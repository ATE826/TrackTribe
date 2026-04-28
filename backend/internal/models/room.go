package models

type Room struct {
	Code string `json:"code"`

	IsPremium bool `json:"is_premium"`
	MaxUsers  int  `json:"max_users"` // -1 = без лимита

	HostSessionID string `json:"host_session_id"`

	CurrentTrackID string `json:"current_track_id"`
}
