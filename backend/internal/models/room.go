package models

import "time"

type Room struct {
	Code      string `json:"code"`
	IsPremium bool   `json:"is_premium"`
	MaxUsers  int    `json:"max_users"`

	HostSessionID string `json:"host_session_id"`

	CreatedAt time.Time `json:"created_at"`
	ExpireAt  time.Time `json:"expire_at"`

	IsActive bool `json:"is_active"`
}
