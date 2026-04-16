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
