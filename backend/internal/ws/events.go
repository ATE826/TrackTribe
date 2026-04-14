package ws

type Event struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type ChatEvent struct {
	Nickname string `json:"nickname"`
	Text     string `json:"text"`
}

type VoteEvent struct {
	TrackID string `json:"trackId"`
	Value   int    `json:"value"` // +1 или -1
}

type SkipEvent struct {
	TrackID string `json:"trackId"`
}

type AddTrackEvent struct {
	Title  string `json:"title"`
	Artist string `json:"artist"`
	URL    string `json:"url"`
}
