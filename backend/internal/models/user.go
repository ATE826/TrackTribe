package models

// Не в бд
type User struct {
	SessionID string `json:"session_id"`
	Nickname  string `json:"nickname"`
	IsHost    bool   `json:"is_host"`
	RoomCode  string `json:"room_code"`
}
