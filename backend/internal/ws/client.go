package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
	"tracktribe/internal/room"

	"github.com/gorilla/websocket"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = 50 * time.Second
	maxMsgSize = 8192
)

var upgrader = websocket.Upgrader{
	CheckOrigin:     func(r *http.Request) bool { return true },
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Client struct {
	Hub      *Hub
	conn     *websocket.Conn
	send     chan []byte
	ClientID string
	IsHost   bool
}

func ServeWS(hub *Hub, w http.ResponseWriter, r *http.Request, clientID string, isHost bool) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade error: %v", err)
		return
	}

	c := &Client{
		Hub:      hub,
		conn:     conn,
		send:     make(chan []byte, 64),
		ClientID: clientID,
		IsHost:   isHost,
	}

	hub.register <- c
	hub.Room.AddGuest(clientID)

	go c.sendRoomState()
	hub.BroadcastGuestCount()

	go c.writePump()
	go c.readPump()
}

func (c *Client) sendRoomState() {
	r := c.Hub.Room
	state := map[string]interface{}{
		"roomId":       r.ID,
		"queue":        r.QueueSnapshot(),
		"currentTrack": r.CurrentTrack,
		"playback":     r.Playback,
		"guestCount":   r.ActiveGuestCount(),
	}
	msg := OutgoingMessage{Type: EvtRoomState, Payload: state}
	b, _ := json.Marshal(msg)
	c.send <- b
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMsgSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		c.handleMessage(raw)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.conn.WriteMessage(websocket.TextMessage, msg)
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleMessage(raw []byte) {
	var msg IncomingMessage
	if err := json.Unmarshal(raw, &msg); err != nil {
		return
	}

	hub := c.Hub
	r := hub.Room

	switch msg.Type {
	case EvtAddTrack:
		var p AddTrackPayload
		if err := json.Unmarshal(msg.Payload, &p); err != nil {
			return
		}
		r.AddTrack(room.TrackInfo{
			ID: p.ID, Title: p.Title, Artist: p.Artist,
			Image: p.Image, Duration: p.Duration, Preview: p.Preview,
		}, c.ClientID)
		hub.BroadcastQueue()

	case EvtVote:
		var p VotePayload
		if err := json.Unmarshal(msg.Payload, &p); err != nil {
			return
		}
		r.Vote(p.QueueID, c.ClientID, p.Value)
		hub.BroadcastQueue()

	case EvtRemoveTrack:
		if !c.IsHost {
			hub.SendTo(c.ClientID, EvtError, ErrorPayload{"Только хост может удалять треки"})
			return
		}
		var p RemoveTrackPayload
		if err := json.Unmarshal(msg.Payload, &p); err != nil {
			return
		}
		r.RemoveTrack(p.QueueID)
		hub.BroadcastQueue()

	case EvtSkipVote:
		var p SkipVotePayload
		if err := json.Unmarshal(msg.Payload, &p); err != nil {
			return
		}
		current, threshold := r.VoteSkip(c.ClientID, p.Agree)
		trackID := ""
		if r.CurrentTrack != nil {
			trackID = r.CurrentTrack.QueueID
		}
		hub.Send(EvtSkipProgress, SkipProgressPayload{current, threshold, trackID})
		if current >= threshold {
			next := r.NextTrack()
			hub.Send(EvtSkipCompleted, nil)
			hub.Send(EvtTrackChanged, TrackChangedPayload{Track: next})
			hub.BroadcastQueue()
			hub.BroadcastPlaybackState()
		}

	case EvtPlaybackCtrl:
		if !c.IsHost {
			return
		}
		var p PlaybackCtrlPayload
		if err := json.Unmarshal(msg.Payload, &p); err != nil {
			return
		}
		switch p.Action {
		case "play":
			r.Playback.IsPlaying = true
		case "pause":
			r.Playback.IsPlaying = false
		case "next":
			next := r.NextTrack()
			hub.Send(EvtTrackChanged, TrackChangedPayload{Track: next})
			hub.BroadcastQueue()
		case "seek":
			r.Playback.CurrentTime = p.Value
		case "volume":
			r.Playback.Volume = p.Value
		}
		hub.BroadcastPlaybackState()

	case EvtUpdatePlayback:
		if !c.IsHost {
			return
		}
		var p UpdatePlaybackPayload
		if err := json.Unmarshal(msg.Payload, &p); err != nil {
			return
		}
		r.Playback.CurrentTime = p.CurrentTime
		r.Playback.IsPlaying = p.IsPlaying
		hub.BroadcastPlaybackState()

	case EvtChatMessage:
		// Relay chat message to all clients in the room
		var p ChatMessagePayload
		if err := json.Unmarshal(msg.Payload, &p); err != nil {
			return
		}
		// Sanitize: trim long messages
		if len(p.Text) > 500 {
			p.Text = p.Text[:500]
		}
		hub.Send(EvtChatMessage, p)
	}
}
