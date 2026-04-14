package ws

// Хранилище для всех комнат и клиентов

type Hub struct {
	Rooms map[string]map[string]*Client
}
