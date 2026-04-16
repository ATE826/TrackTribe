package handler

import (
	"backend/internal/ws"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Разрешаем все подключения (для разработки)
	},
}

type WSHandler struct {
	HubManager *ws.HubManager
}

func NewWSHandler(h *ws.HubManager) *WSHandler {
	return &WSHandler{
		HubManager: h,
	}
}
