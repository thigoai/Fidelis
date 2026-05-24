package model

import (
	"time"

	"github.com/google/uuid"
)

type TransactionType string

const (
	TxPurchase   TransactionType = "purchase"   // ganhou pontos numa compra
	TxRedemption TransactionType = "redemption" // gastou pontos resgatando recompensa
	TxAdjustment TransactionType = "adjustment" // ajuste manual (pode ser + ou -)
	TxExpiration TransactionType = "expiration" // expirou (sempre -)
	TxBonus      TransactionType = "bonus"      // bonus avulso (sempre +)
)

func (t TransactionType) Valid() bool {
	switch t {
	case TxPurchase, TxRedemption, TxAdjustment, TxExpiration, TxBonus:
		return true
	}
	return false
}

// PointTransaction e uma entrada IMUTAVEL do ledger.
// Positivo = ganho; negativo = gasto. Nunca usar UPDATE/DELETE — o DB bloqueia.
type PointTransaction struct {
	ID              uuid.UUID       `json:"id"`
	CustomerUserID  uuid.UUID       `json:"customer_user_id"`
	StoreID         uuid.UUID       `json:"store_id"`
	Type            TransactionType `json:"type"`
	Points          int             `json:"points"`
	PurchaseAmount  *float64        `json:"purchase_amount,omitempty"`
	RewardID        *uuid.UUID      `json:"reward_id,omitempty"`
	Notes           *string         `json:"notes,omitempty"`
	CreatedByUserID *uuid.UUID      `json:"created_by_user_id,omitempty"`
	CreatedAt       time.Time       `json:"created_at"`
}
