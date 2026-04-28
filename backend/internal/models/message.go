package models

import "time"

type Message struct {
	ID string `json:"id"`

	SessionID string `json:"session_id"`
	Nickname  string `json:"nickname"`

	Text string `json:"text"`

	CreatedAt time.Time `json:"created_at"`
}
