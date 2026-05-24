package model

import (
	"time"

	"github.com/google/uuid"
)

// Membership e a "carteirinha" do cliente em uma loja: saldo atual e historico
// agregado. O DB sustenta os totais via trigger sobre point_transactions, de
// modo que esta tabela nunca diverge do ledger.
type Membership struct {
	CustomerUserID   uuid.UUID `json:"customer_user_id"`
	StoreID          uuid.UUID `json:"store_id"`
	PointsBalance    int       `json:"points_balance"`
	LifetimeEarned   int       `json:"lifetime_earned"`
	LifetimeRedeemed int       `json:"lifetime_redeemed"`
	JoinedAt         time.Time `json:"joined_at"`
	LastActivityAt   time.Time `json:"last_activity_at"`
}
