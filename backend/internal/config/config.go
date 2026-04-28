package config

import (
	"os"
	"strconv"
)

type Config struct {
	// 🌐 порт сервера
	Port string

	// 🧠 окружение (dev / prod)
	Env string

	// ⚡ WebSocket буферы (важно для производительности)
	WSReadBufferSize  int
	WSWriteBufferSize int

	// 🔐 максимальное количество соединений на весь сервер (safety limit)
	MaxConnections int

	// ⏱ таймауты (на будущее, но полезно сразу)
	WriteWaitSeconds  int
	PongWaitSeconds   int
	PingPeriodSeconds int
}

func Load() *Config {
	return &Config{
		Port:              getEnv("PORT", "8080"),
		Env:               getEnv("ENV", "dev"),
		WSReadBufferSize:  getEnvInt("WS_READ_BUFFER", 1024),
		WSWriteBufferSize: getEnvInt("WS_WRITE_BUFFER", 1024),
		MaxConnections:    getEnvInt("MAX_CONNECTIONS", 5000),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}
