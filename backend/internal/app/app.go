package app

import (
	"backend/internal/handler"
	"backend/internal/ws"
	"net/http"
)

type App struct {
	HubManager *ws.HubManager

	RoomHandler *handler.RoomHandler
	WSHandler   *handler.WSHandler
}

func NewApp(hubManager *ws.HubManager) *App {
	app := &App{
		HubManager: hubManager,
	}

	// handlers получают доступ к системе
	app.RoomHandler = handler.NewRoomHandler(hubManager)
	app.WSHandler = handler.NewWSHandler(hubManager)

	return app
}

func (a *App) SetupRouter() http.Handler {
	mux := http.NewServeMux()

	// HTTP API
	mux.HandleFunc("/room/create", a.RoomHandler.CreateRoom)
	mux.HandleFunc("/room/join", a.RoomHandler.JoinRoom)

	// WebSocket
	mux.HandleFunc("/ws", a.WSHandler.HandleWS)

	return mux
}
