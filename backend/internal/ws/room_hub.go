package ws

import "sync"

type RoomHub struct {
	Code string

	Clients map[*Client]bool
	Users   map[string]*Client

	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client

	mu sync.RWMutex
}

func NewRoomHub(code string) *RoomHub {
	return &RoomHub{
		Code:       code,
		Clients:    make(map[*Client]bool),
		Users:      make(map[string]*Client),
		Broadcast:  make(chan []byte),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (r *RoomHub) Run() {
	for {
		select {

		case client := <-r.Register:
			r.Clients[client] = true

		case client := <-r.Unregister:
			if _, ok := r.Clients[client]; ok {
				delete(r.Clients, client)
				close(client.Send)
			}

		case msg := <-r.Broadcast:
			for client := range r.Clients {
				select {
				case client.Send <- msg:
				default:
					close(client.Send)
					delete(r.Clients, client)
				}
			}
		}
	}
}
