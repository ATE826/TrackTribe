package ws

import (
	"encoding/json"
	"tracktribe/internal/room"
)

// Входящие события (от клиента к серверу)
const (
	EvtAddTrack       = "add_track"
	EvtVote           = "vote"
	EvtRemoveTrack    = "remove_track"
	EvtSkipVote       = "skip_vote"
	EvtPlaybackCtrl   = "playback_control"
	EvtUpdatePlayback = "update_playback"
	EvtChatMessage    = "chat_message" // чат — relay to all
)

// Исходящие события (от сервера к клиентам)
const (
	EvtQueueUpdated  = "queue_updated"
	EvtTrackChanged  = "track_changed"
	EvtPlaybackState = "playback_state"
	EvtSkipProgress  = "skip_progress"
	EvtSkipCompleted = "skip_completed"
	EvtGuestCount    = "guest_count"
	EvtRoomState     = "room_state"
	EvtError         = "error"
)

// IncomingMessage — любое сообщение от клиента
type IncomingMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// --- Payload структуры ---

type AddTrackPayload struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Artist   string `json:"artist"`
	Image    string `json:"image"`
	Duration int    `json:"duration"`
	Preview  string `json:"previewUrl"`
}

type VotePayload struct {
	QueueID string `json:"queueId"`
	Value   bool   `json:"value"`
}

type RemoveTrackPayload struct {
	QueueID string `json:"queueId"`
}

type SkipVotePayload struct {
	Agree bool `json:"agree"`
}

type PlaybackCtrlPayload struct {
	Action string  `json:"action"`
	Value  float64 `json:"value"`
}

type UpdatePlaybackPayload struct {
	CurrentTime float64 `json:"currentTime"`
	IsPlaying   bool    `json:"isPlaying"`
}

type ChatMessagePayload struct {
	ID       string `json:"id"`
	Nick     string `json:"nick"`
	Text     string `json:"text"`
	Ts       int64  `json:"ts"`
	IsSystem bool   `json:"isSystem,omitempty"`
}

// --- Outgoing ---

type OutgoingMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type QueueUpdatedPayload struct {
	Queue []*room.Track `json:"queue"`
}

type TrackChangedPayload struct {
	Track *room.Track `json:"track"`
}

type PlaybackStatePayload struct {
	IsPlaying   bool    `json:"isPlaying"`
	CurrentTime float64 `json:"currentTime"`
	Volume      float64 `json:"volume"`
	TrackID     string  `json:"trackId"`
}

type SkipProgressPayload struct {
	Current   int    `json:"current"`
	Threshold int    `json:"threshold"`
	TrackID   string `json:"trackId"`
}

type GuestCountPayload struct {
	Count int `json:"count"`
}

type ErrorPayload struct {
	Message string `json:"message"`
}
