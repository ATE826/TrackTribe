package ws

import "sync"

type HubManager struct {
	Rooms map[string]*RoomHub
	mu    sync.RWMutex
}
