package api

import (
    "encoding/json"
    "net/http"
    "strings"
    "sync"
    "tracktribe/internal/room"
    "tracktribe/internal/ws"
)
type Handler struct {
	Manager *room.Manager
	Hubs    map[string]*ws.Hub
	hubsMu  sync.RWMutex
}

func NewHandler(m *room.Manager) *Handler {
	return &Handler{
		Manager: m,
		Hubs:    make(map[string]*ws.Hub),
	}
}

func (h *Handler) getOrCreateHub(r *room.Room) *ws.Hub {
	h.hubsMu.RLock()
	hub, ok := h.Hubs[r.ID]
	h.hubsMu.RUnlock()
	if ok {
		return hub
	}
	h.hubsMu.Lock()
	defer h.hubsMu.Unlock()
	hub = ws.NewHub(r)
	h.Hubs[r.ID] = hub
	go hub.Run()
	return hub
}

// POST /api/rooms
func (h *Handler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	rm, err := h.Manager.Create()
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	// Сразу создаём Hub
	h.getOrCreateHub(rm)
	writeJSON(w, http.StatusCreated, map[string]string{
		"roomId":    rm.ID,
		"hostToken": rm.HostToken,
	})
}

// GET /api/rooms/{roomId}
func (h *Handler) GetRoom(w http.ResponseWriter, r *http.Request) {
	id := roomIDFromPath(r.URL.Path)
	rm, ok := h.Manager.Get(id)
	if !ok {
		http.Error(w, "room not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"roomId":       rm.ID,
		"queue":        rm.QueueSnapshot(),
		"currentTrack": rm.CurrentTrack,
		"playback":     rm.Playback,
		"guestCount":   rm.ActiveGuestCount(),
	})
}

// DELETE /api/rooms/{roomId}
func (h *Handler) DeleteRoom(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := roomIDFromPath(r.URL.Path)
	token := r.Header.Get("X-Host-Token")
	if !h.Manager.Delete(id, token) {
		http.Error(w, "forbidden or not found", http.StatusForbidden)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GET /ws?roomId=&clientId=&token=
func (h *Handler) ServeWS(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	roomID := q.Get("roomId")
	clientID := q.Get("clientId")
	token := q.Get("token")

	if roomID == "" || clientID == "" {
		http.Error(w, "roomId and clientId required", http.StatusBadRequest)
		return
	}

	rm, ok := h.Manager.Get(roomID)
	if !ok {
		http.Error(w, "room not found", http.StatusNotFound)
		return
	}

	isHost := token != "" && token == rm.HostToken
	hub := h.getOrCreateHub(rm)
	ws.ServeWS(hub, w, r, clientID, isHost)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func roomIDFromPath(path string) string {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) >= 3 {
		return parts[2] // /api/rooms/{id}
	}
	return ""
}