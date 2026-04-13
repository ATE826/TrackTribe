package room

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"
)

const roomTTL = 2 * time.Hour
const cleanupInterval = 5 * time.Minute

type Manager struct {
	mu    sync.RWMutex
	rooms map[string]*Room
}

func NewManager() *Manager {
	m := &Manager{rooms: make(map[string]*Room)}
	go m.cleanup()
	return m
}

func (m *Manager) Create() (*Room, error) {
	id, err := randomHex(4)
	if err != nil {
		return nil, err
	}
	token, err := randomHex(16)
	if err != nil {
		return nil, err
	}
	r := NewRoom(id, token)
	m.mu.Lock()
	m.rooms[id] = r
	m.mu.Unlock()
	return r, nil
}

func (m *Manager) Get(id string) (*Room, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	r, ok := m.rooms[id]
	return r, ok
}

func (m *Manager) Delete(id, token string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	r, ok := m.rooms[id]
	if !ok || r.HostToken != token {
		return false
	}
	delete(m.rooms, id)
	return true
}

func (m *Manager) cleanup() {
	for range time.Tick(cleanupInterval) {
		m.mu.Lock()
		for id, r := range m.rooms {
			if time.Since(r.LastActivity) > roomTTL {
				delete(m.rooms, id)
			}
		}
		m.mu.Unlock()
	}
}

func randomHex(n int) (string, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	return hex.EncodeToString(b), err
}