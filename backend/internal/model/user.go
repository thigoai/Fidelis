package model

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RoleLojista UserRole = "lojista"
	RoleCliente UserRole = "cliente"
	RoleAdmin   UserRole = "admin"
)

func (r UserRole) Valid() bool {
	switch r {
	case RoleLojista, RoleCliente, RoleAdmin:
		return true
	}
	return false
}

// User representa um cadastro unificado. O campo Role determina em qual
// modulo (Loja ou Cliente) o usuario opera.
type User struct {
	ID            uuid.UUID  `json:"id"`
	Email         string     `json:"email"`
	PasswordHash  string     `json:"-"`
	Name          string     `json:"name"`
	Phone         *string    `json:"phone,omitempty"`
	Role          UserRole   `json:"role"`
	EmailVerified bool       `json:"email_verified"`
	Active        bool       `json:"active"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	DeletedAt     *time.Time `json:"-"`
}
