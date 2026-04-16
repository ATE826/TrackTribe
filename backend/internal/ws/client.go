package ws

import (
	"backend/internal/models"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn *websocket.Conn
	User *models.User

	Outbound chan []byte // сервер → клиент |chan - для отправки сообщений клиенту
}
