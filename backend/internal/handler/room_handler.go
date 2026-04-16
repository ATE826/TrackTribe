package handler

import "backend/internal/ws"

type RoomHandler struct {
	HubManager *ws.HubManager
}

func NewRoomHandler(h *ws.HubManager) *RoomHandler {
	return &RoomHandler{
		HubManager: h,
	}
}
