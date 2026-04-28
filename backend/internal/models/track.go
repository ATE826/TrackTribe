package models

type Track struct {
	ID string `json:"id"` // внутренний UUID в комнате

	AppleTrackID int64  `json:"apple_track_id"`
	Title        string `json:"title"`
	Artist       string `json:"artist"`
	Album        string `json:"album"`
	CoverURL     string `json:"cover_url"`
	PreviewURL   string `json:"preview_url"`

	Position int `json:"position"` // место в очереди
	Votes    int `json:"votes"`

	IsPlayed bool `json:"is_played"`
}
