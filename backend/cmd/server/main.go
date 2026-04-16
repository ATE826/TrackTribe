package main

import (
	"backend/internal/app"
	"backend/internal/ws"
	"log"
	"net/http"
)

func main() {
	// Создаём hub manager (все комнаты)
	hubManager := ws.NewHubManager()

	// Создаём приложение (обвязка)
	application := app.NewApp(hubManager)

	// Маршруты HTTP + WebSocket
	router := application.SetupRouter()

	// HTTP сервер
	server := &http.Server{
		Addr:    ":8080",
		Handler: router,
	}

	log.Println("Server is running on http://localhost:8080")

	// Запуск сервера
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
