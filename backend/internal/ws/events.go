package ws

import (
	"backend/internal/models"
	"encoding/json"
	"log"
)

// ======================================================
// 📥 BASE WS EVENT STRUCTS
// ======================================================

// Событие от клиента (сырой WS JSON)
type ClientEvent struct {
	Type string          `json:"type"` // тип события (chat, vote, join и т.д.)
	Data json.RawMessage `json:"data"` // сырые данные события
}

// Событие от сервера (ответ клиентам)
type ServerEvent struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// ======================================================
// 🎯 EVENT TYPES (протокол общения)
// ======================================================

const (
	EventJoinRoom    = "join_room"
	EventChatMessage = "chat_message"

	EventAddTrack  = "add_track"
	EventVoteTrack = "vote_track"
	EventSkipTrack = "skip_track"

	EventNowPlaying = "now_playing"

	EventUserLeave = "user_leave"
)

// ======================================================
// 📥 PAYLOADS (CLIENT → SERVER)
// ======================================================

// Вход в комнату
type JoinRoomIn struct {
	RoomCode string `json:"room_code"`
	Nickname string `json:"nickname"`
}

// Сообщение в чат
type ChatMessageIn struct {
	Text string `json:"text"`
}

// Добавить трек (Apple Tunes API)
type AddTrackIn struct {
	AppleTrackID int64 `json:"apple_track_id"`
}

// Голос за трек
type VoteTrackIn struct {
	TrackID string `json:"track_id"`
	Value   int    `json:"value"` // +1 или -1
}

// Пропуск трека
type SkipTrackIn struct {
	Force bool `json:"force"`
}

// ======================================================
// 📤 PAYLOADS (SERVER → CLIENT)
// ======================================================

// Чат сообщение для всех пользователей
type ChatMessageOut struct {
	SessionID string `json:"session_id"`
	Nickname  string `json:"nickname"`
	Text      string `json:"text"`
}

// Обновление голосов
type VoteUpdateOut struct {
	TrackID string `json:"track_id"`
	Votes   int    `json:"votes"`
}

// Добавленный трек
type TrackAddedOut struct {
	Track models.Track `json:"track"`
}

// Сейчас играет трек
type NowPlayingOut struct {
	Track models.Track `json:"track"`
}

// Пользователь вышел
type UserLeaveOut struct {
	SessionID string `json:"session_id"`
}

// ======================================================
// 🧠 ROUTER (главный обработчик событий)
// ======================================================

// RouteEvent — главный диспетчер WebSocket событий
func RouteEvent(c *Client, hub *HubManager, event ClientEvent) {

	switch event.Type {

	// ==================================================
	// 🏠 JOIN ROOM
	// ==================================================
	case EventJoinRoom:

		var data JoinRoomIn
		if err := json.Unmarshal(event.Data, &data); err != nil {
			log.Println("join_room parse error:", err)
			return
		}

		room, ok := hub.GetRoom(data.RoomCode)
		if !ok {
			log.Println("room not found:", data.RoomCode)
			return
		}

		// привязываем пользователя к комнате
		c.User.RoomCode = data.RoomCode
		c.User.Nickname = data.Nickname

		// регистрируем клиента в комнате
		room.Register <- c

	// ==================================================
	// 💬 CHAT MESSAGE
	// ==================================================
	case EventChatMessage:

		var data ChatMessageIn
		if err := json.Unmarshal(event.Data, &data); err != nil {
			log.Println("chat parse error:", err)
			return
		}

		room := hub.Rooms[c.User.RoomCode]
		if room == nil {
			return
		}

		out := ServerEvent{
			Type: EventChatMessage,
			Data: ChatMessageOut{
				SessionID: c.User.SessionID,
				Nickname:  c.User.Nickname,
				Text:      data.Text,
			},
		}

		bytes, _ := json.Marshal(out)
		room.Broadcast <- bytes

	// ==================================================
	// 🎵 ADD TRACK (TODO)
	// ==================================================
	case EventAddTrack:

		var data AddTrackIn
		if err := json.Unmarshal(event.Data, &data); err != nil {
			log.Println("add_track parse error:", err)
			return
		}

		// TODO:
		// - запрос к Apple Tunes API
		// - создать Track
		// - добавить в очередь комнаты

		log.Println("add_track:", data.AppleTrackID)

	// ==================================================
	// 🗳 VOTE TRACK (TODO)
	// ==================================================
	case EventVoteTrack:

		var data VoteTrackIn
		if err := json.Unmarshal(event.Data, &data); err != nil {
			log.Println("vote parse error:", err)
			return
		}

		// TODO:
		// - найти трек в комнате
		// - обновить votes
		// - пересортировать очередь

		log.Println("vote_track:", data.TrackID, data.Value)

	// ==================================================
	// ⏭ SKIP TRACK (TODO)
	// ==================================================
	case EventSkipTrack:

		room := hub.Rooms[c.User.RoomCode]
		if room == nil {
			return
		}

		// TODO:
		// - сменить текущий трек
		// - выбрать следующий

		room.Broadcast <- []byte(`{"type":"skip_track"}`)

	// ==================================================
	// 🎧 NOW PLAYING (TODO)
	// ==================================================
	case EventNowPlaying:

		room := hub.Rooms[c.User.RoomCode]
		if room == nil {
			return
		}

		// TODO:
		// - отправить текущий трек

		room.Broadcast <- []byte(`{"type":"now_playing"}`)

	// ==================================================
	// ❌ UNKNOWN EVENT
	// ==================================================
	default:
		log.Println("unknown event:", event.Type)
	}
}
