package models

import "gorm.io/gorm"

type User struct {
	gorm.Model

	RoomID string `gorm:"index;not null"`

	Nickname string `gorm:"not null"`
	Role     string `gorm:"not null"`

	IsOnline bool `gorm:"default:false"`
}
