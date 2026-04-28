package ws

import "sync"

type HubManager struct {
	Rooms map[string]*RoomHub
	mu    sync.RWMutex
}

func NewHubManager() *HubManager {
	return &HubManager{
		Rooms: make(map[string]*RoomHub),
	}
}

func (m *HubManager) GetRoom(code string) (*RoomHub, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	room, ok := m.Rooms[code]
	return room, ok
}

func (m *HubManager) CreateRoom(code string, room *RoomHub) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.Rooms[code] = room
}

func (m *HubManager) DeleteRoom(code string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.Rooms, code)
}
