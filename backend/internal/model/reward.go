package model

import (
	"time"

	"github.com/google/uuid"
)

type Reward struct {
	ID          uuid.UUID  `json:"id"`
	StoreID     uuid.UUID  `json:"store_id"`
	Name        string     `json:"name"`
	Description *string    `json:"description,omitempty"`
	ImageURL    *string    `json:"image_url,omitempty"`
	PointsCost  int        `json:"points_cost"`
	Stock       *int       `json:"stock,omitempty"` // nil = estoque ilimitado
	Active      bool       `json:"active"`
	StartsAt    *time.Time `json:"starts_at,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}
