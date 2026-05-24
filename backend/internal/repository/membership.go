package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/fidelis/api/internal/model"
)

type MembershipRepository struct {
	pool *pgxpool.Pool
}

func NewMembershipRepository(pool *pgxpool.Pool) *MembershipRepository {
	return &MembershipRepository{pool: pool}
}

// BalanceEntry — projeção usada na visão do cliente ("minhas lojas com saldo").
type BalanceEntry struct {
	StoreID           uuid.UUID `json:"store_id"`
	StoreSlug         string    `json:"store_slug"`
	StoreName         string    `json:"store_name"`
	StoreLogoURL      *string   `json:"store_logo_url,omitempty"`
	StorePrimaryColor *string   `json:"store_primary_color,omitempty"`
	PointsBalance     int       `json:"points_balance"`
	LifetimeEarned    int       `json:"lifetime_earned"`
	LifetimeRedeemed  int       `json:"lifetime_redeemed"`
	JoinedAt          time.Time `json:"joined_at"`
	LastActivityAt    time.Time `json:"last_activity_at"`
}

// StoreMemberRow — projeção usada na visão da loja ("meus clientes com pontos").
// Espelha BalanceEntry, mas trazendo dados do USUARIO em vez da loja.
type StoreMemberRow struct {
	CustomerID       uuid.UUID `json:"customer_id"`
	CustomerName     string    `json:"customer_name"`
	CustomerEmail    string    `json:"customer_email"`
	CustomerPhone    *string   `json:"customer_phone,omitempty"`
	PointsBalance    int       `json:"points_balance"`
	LifetimeEarned   int       `json:"lifetime_earned"`
	LifetimeRedeemed int       `json:"lifetime_redeemed"`
	JoinedAt         time.Time `json:"joined_at"`
	LastActivityAt   time.Time `json:"last_activity_at"`
}

func (r *MembershipRepository) ListByCustomer(ctx context.Context, customerID uuid.UUID) ([]BalanceEntry, error) {
	const q = `SELECT s.id, s.slug, s.name, s.logo_url, s.primary_color,
	                  m.points_balance, m.lifetime_earned, m.lifetime_redeemed,
	                  m.joined_at, m.last_activity_at
	           FROM memberships m
	           JOIN stores s ON s.id = m.store_id AND s.deleted_at IS NULL
	           WHERE m.customer_user_id = $1
	           ORDER BY m.last_activity_at DESC`
	rows, err := r.pool.Query(ctx, q, customerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	entries := make([]BalanceEntry, 0)
	for rows.Next() {
		var e BalanceEntry
		if err := rows.Scan(
			&e.StoreID, &e.StoreSlug, &e.StoreName, &e.StoreLogoURL, &e.StorePrimaryColor,
			&e.PointsBalance, &e.LifetimeEarned, &e.LifetimeRedeemed,
			&e.JoinedAt, &e.LastActivityAt,
		); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

// ListByStore — visao do lojista. Ordenado por saldo desc (mais engajados primeiro).
// Filtra users.role='cliente' e nao-deletados pra nao incluir staff/admin.
func (r *MembershipRepository) ListByStore(ctx context.Context, storeID uuid.UUID) ([]StoreMemberRow, error) {
	const q = `SELECT u.id, u.name, u.email, u.phone,
	                  m.points_balance, m.lifetime_earned, m.lifetime_redeemed,
	                  m.joined_at, m.last_activity_at
	           FROM memberships m
	           JOIN users u ON u.id = m.customer_user_id
	             AND u.deleted_at IS NULL
	             AND u.role = 'cliente'
	           WHERE m.store_id = $1
	           ORDER BY m.points_balance DESC, u.name ASC`
	rows, err := r.pool.Query(ctx, q, storeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]StoreMemberRow, 0)
	for rows.Next() {
		var row StoreMemberRow
		if err := rows.Scan(
			&row.CustomerID, &row.CustomerName, &row.CustomerEmail, &row.CustomerPhone,
			&row.PointsBalance, &row.LifetimeEarned, &row.LifetimeRedeemed,
			&row.JoinedAt, &row.LastActivityAt,
		); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *MembershipRepository) GetForCustomerInStore(ctx context.Context, customerID, storeID uuid.UUID) (*model.Membership, error) {
	const q = `SELECT customer_user_id, store_id, points_balance,
	                  lifetime_earned, lifetime_redeemed, joined_at, last_activity_at
	           FROM memberships
	           WHERE customer_user_id = $1 AND store_id = $2`
	var m model.Membership
	err := r.pool.QueryRow(ctx, q, customerID, storeID).Scan(
		&m.CustomerUserID, &m.StoreID, &m.PointsBalance,
		&m.LifetimeEarned, &m.LifetimeRedeemed, &m.JoinedAt, &m.LastActivityAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &m, nil
}
