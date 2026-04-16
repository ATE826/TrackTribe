package models

import "time"

type Message struct {
	SessionID string `json:"session_id"` // Кто отправил сообщение
	Nickname  string `json:"nickname"`   // Имя отправителя
	RoomCode  string `json:"room_code"`

	Content string `json:"content"`

	CreatedAt time.Time `json:"created_at"`
}
