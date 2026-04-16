package models

type Track struct {
	ID       string `json:"id"`
	RoomCode string `json:"room_code"`

	// === Apple iTunes API ===
	AppleTrackID string `json:"apple_track_id"`
	Title        string `json:"title"`
	Artist       string `json:"artist"`
	Album        string `json:"album"`
	CoverURL     string `json:"cover_url"`
	PreviewURL   string `json:"preview_url"`

	// === Логика комнаты ===
	AddedBySessionID string `json:"added_by_session_id"`
	Votes            int    `json:"votes"`

	// === playback состояние ===
	IsPlaying bool `json:"is_playing"`
	IsPlayed  bool `json:"is_played"`
}
