package models

import "gorm.io/gorm"

type RoomStatus string

const (
	RoomActive RoomStatus = "active"
	RoomEnded  RoomStatus = "ended"
)

type RoomPlan string

const (
	PlanFree    RoomPlan = "free"
	PlanPremium RoomPlan = "premium"
)

type Room struct {
	gorm.Model

	Code     string     `gorm:"not null"`
	Status   RoomStatus `gorm:"not null; default:'active'"`
	Plan     RoomPlan   `gorm:"not null; default:'free'"`
	MaxUsers int        `gorm:"default:10"`
}
