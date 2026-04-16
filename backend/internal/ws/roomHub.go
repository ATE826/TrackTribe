package ws

import (
	"backend/internal/models"
	"sync"
)

type RoomHub struct {
	Code string

	// Пользователи
	Users   map[string]*models.User
	Clients map[*Client]bool

	// Музыка и чат
	Tracks   []models.Track
	Messages []models.Message

	// Websocket каналы
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan []byte

	mu sync.RWMutex

	// Настройки комнаты
	IsPremium bool
	MaxUsers  int
}
