package models

type Vote struct {
	SessionID string `json:"session_id"`
	TrackID   string `json:"track_id"`

	Value int `json:"value"` // +1 / -1
}
