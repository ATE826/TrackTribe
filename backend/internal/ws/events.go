package ws

import "encoding/json"

// INCOMING (клиент → сервер)

type ClientToServerEvent struct {
	Type string          `json:"type"` // Тип события (например, "join", "leave", "message", "track_add")
	Data json.RawMessage `json:"data"` // Данные события (структура зависит от типа)
}

// OUTGOING (сервер → клиенты)

type ServerToClientEvent struct {
	Type string      `json:"type"` // Тип события (например, "user_joined", "user_left", "new_message", "track_added")
	Data interface{} `json:"data"` // Данные события (структура зависит от типа)
}

// EVENT TYPES

const (
	EventChatMessage = "chat_message"

	EventAddTrack   = "add_track"
	EventVoteTrack  = "vote_track"
	EventSkipTrack  = "skip_track"
	EventNowPlaying = "now_playing"

	EventUserJoin  = "user_join"
	EventUserLeave = "user_leave"

	EventRoomState   = "room_state"
	EventRoomUpgrade = "room_upgrad"
)
