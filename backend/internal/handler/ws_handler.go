package handler

import (
	"net/http"

	"github.com/google/uuid"
)

func (h *Handler) HandleWS(w http.ResponseWriter, r *http.Request) {
	roomCode := r.URL.Query().Get("room")
	nickname := r.URL.Query().Get("nickname")

	sessionID := uuid.New().String() // 👈 ВОТ ТУТ создаётся пользователь

	conn, _ := upgrader.Upgrade(w, r, nil)

	client := &ws.Client{
		SessionID: sessionID,
		Nickname:  nickname,
		RoomID:    roomCode,
		Conn:      conn,
	}

	hub.Register <- client
}
