package model

import (
	"time"

	"github.com/google/uuid"
)

type Store struct {
	ID           uuid.UUID  `json:"id"`
	Slug         string     `json:"slug"`
	Name         string     `json:"name"`
	Description  *string    `json:"description,omitempty"`
	LogoURL      *string    `json:"logo_url,omitempty"`
	PrimaryColor *string    `json:"primary_color,omitempty"`
	Address      *string    `json:"address,omitempty"`
	City         *string    `json:"city,omitempty"`
	State        *string    `json:"state,omitempty"`
	Country      string     `json:"country"`
	Active       bool       `json:"active"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"-"`
}

type StoreMemberRole string

const (
	StoreRoleOwner   StoreMemberRole = "owner"
	StoreRoleManager StoreMemberRole = "manager"
	StoreRoleStaff   StoreMemberRole = "staff"
)

// StoreMember liga um lojista (User com role=lojista) a uma loja, com hierarquia
// para suportar cenarios futuros (multi-staff).
type StoreMember struct {
	StoreID   uuid.UUID       `json:"store_id"`
	UserID    uuid.UUID       `json:"user_id"`
	Role      StoreMemberRole `json:"role"`
	CreatedAt time.Time       `json:"created_at"`
}
