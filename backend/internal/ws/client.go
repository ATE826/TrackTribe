package ws

// Клиент, представляющий подключение пользователя к комнате

import "github.com/gorilla/websocket"

type Client struct {
	SessionID string
	Nickname  string
	RoomID    string
	Conn      *websocket.Conn
}
