package ws

import (
	"encoding/json"
	"log"
	"sync"
	"tracktribe/internal/room"
)

// Hub управляет всеми клиентами одной комнаты
type Hub struct {
	mu       sync.RWMutex
	Room     *room.Room
	clients  map[*Client]bool
	register chan *Client
	unregister chan *Client
	broadcast  chan []byte
}

func NewHub(r *room.Room) *Hub {
	return &Hub{
		Room:       r,
		clients:    make(map[*Client]bool),
		register:   make(chan *Client, 8),
		unregister: make(chan *Client, 8),
		broadcast:  make(chan []byte, 64),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			h.clients[c] = true
			h.mu.Unlock()
		case c := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[c]; ok {
				delete(h.clients, c)
				close(c.send)
			}
			h.mu.Unlock()
			h.Room.RemoveGuest(c.ClientID)
			h.BroadcastGuestCount()
		case msg := <-h.broadcast:
			h.mu.RLock()
			for c := range h.clients {
				select {
				case c.send <- msg:
				default:
					// медленный клиент — пропускаем
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Send отправляет сообщение всем клиентам
func (h *Hub) Send(evt string, payload interface{}) {
	msg := OutgoingMessage{Type: evt, Payload: payload}
	b, err := json.Marshal(msg)
	if err != nil {
		log.Printf("hub marshal error: %v", err)
		return
	}
	h.broadcast <- b
}

// SendTo отправляет сообщение конкретному клиенту
func (h *Hub) SendTo(clientID string, evt string, payload interface{}) {
	msg := OutgoingMessage{Type: evt, Payload: payload}
	b, _ := json.Marshal(msg)
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.clients {
		if c.ClientID == clientID {
			select {
			case c.send <- b:
			default:
			}
		}
	}
}

func (h *Hub) BroadcastQueue() {
	h.Send(EvtQueueUpdated, QueueUpdatedPayload{Queue: h.Room.QueueSnapshot()})
}

func (h *Hub) BroadcastGuestCount() {
	h.Send(EvtGuestCount, GuestCountPayload{Count: h.Room.ActiveGuestCount()})
}

func (h *Hub) BroadcastPlaybackState() {
	p := h.Room.Playback
	h.Send(EvtPlaybackState, PlaybackStatePayload{
		IsPlaying:   p.IsPlaying,
		CurrentTime: p.CurrentTime,
		Volume:      p.Volume,
		TrackID:     p.TrackID,
	})
}