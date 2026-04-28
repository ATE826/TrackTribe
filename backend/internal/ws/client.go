package ws

import (
	"backend/internal/models"
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn *websocket.Conn

	Send chan []byte

	User *models.User
}

func (c *Client) ReadPump(hub *HubManager) {
	defer func() {
		c.Conn.Close()
	}()

	for {
		_, msg, err := c.Conn.ReadMessage()
		if err != nil {
			log.Println("read error:", err)
			break
		}

		var event ClientEvent
		if err := json.Unmarshal(msg, &event); err != nil {
			log.Println("bad event:", err)
			continue
		}

		RouteEvent(c, hub, event)
	}
}

func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()

	for msg := range c.Send {
		err := c.Conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			log.Println("write error:", err)
			break
		}
	}
}
