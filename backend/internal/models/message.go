package models

import "gorm.io/gorm"

type Message struct {
	gorm.Model

	RoomID    string `gorm:"index;not null"`
	SessionID string `gorm:"not null"`
}
