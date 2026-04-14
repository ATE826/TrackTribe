package ws

import "encoding/json"

// Добавление клиента в комнату
func (h *Hub) JoinRoom(roomID string, client *Client) {
	if h.Rooms[roomID] == nil {
		h.Rooms[roomID] = make(map[string]*Client)
	}

	h.Rooms[roomID][client.SessionID] = client
}

// Удаление клиента из комнаты
func (h *Hub) LeaveRoom(roomID string, sessionID string) {
	if h.Rooms[roomID] == nil {
		return
	}

	delete(h.Rooms[roomID], sessionID)

	// если комната пустая — можно удалить её из памяти
	if len(h.Rooms[roomID]) == 0 {
		delete(h.Rooms, roomID)
	}
}

// Получить всех пользователей комнаты
func (h *Hub) GetRoomClients(roomID string) map[string]*Client {
	return h.Rooms[roomID]
}

// Отправить сообщение ВСЕМ в комнате
func (h *Hub) BroadcastToRoom(roomID string, event string, data interface{}) {
	clients := h.Rooms[roomID]

	if clients == nil {
		return
	}

	message := map[string]interface{}{
		"event": event,
		"data":  data,
	}

	bytes, _ := json.Marshal(message)

	for _, client := range clients {
		client.Conn.WriteMessage(1, bytes)
	}
}
