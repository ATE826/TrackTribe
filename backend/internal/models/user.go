package models

type User struct {
	SessionID string `json:"session_id"` // уникальный ID соединения
	Nickname  string `json:"nickname"`   // имя в комнате
	IsHost    bool   `json:"is_host"`    // создатель комнаты

	RoomCode string `json:"room_code"` // текущая комната
}
