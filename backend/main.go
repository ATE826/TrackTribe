package main

import (
	"log"
	"net/http"
	"tracktribe/internal/api"
	"tracktribe/internal/room"
)

func main() {
	manager := room.NewManager()
	handler := api.NewHandler(manager)

	mux := http.NewServeMux()

	// CORS middleware
	cors := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Host-Token")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next(w, r)
		}
	}

	mux.HandleFunc("/api/rooms", cors(handler.CreateRoom))
	mux.HandleFunc("/api/rooms/", cors(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handler.GetRoom(w, r)
		case http.MethodDelete:
			handler.DeleteRoom(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/ws", handler.ServeWS)

	log.Println("TrackTribe backend запущен на :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}