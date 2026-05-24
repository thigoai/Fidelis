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

type PointTransactionRepository struct {
	pool *pgxpool.Pool
}

func NewPointTransactionRepository(pool *pgxpool.Pool) *PointTransactionRepository {
	return &PointTransactionRepository{pool: pool}
}

const txCols = `id, customer_user_id, store_id, type, points, purchase_amount,
                reward_id, notes, created_by_user_id, created_at`

func scanTx(row pgx.Row) (*model.PointTransaction, error) {
	var t model.PointTransaction
	err := row.Scan(
		&t.ID, &t.CustomerUserID, &t.StoreID, &t.Type, &t.Points,
		&t.PurchaseAmount, &t.RewardID, &t.Notes, &t.CreatedByUserID, &t.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &t, nil
}

type InsertTransactionParams struct {
	CustomerUserID  uuid.UUID
	StoreID         uuid.UUID
	Type            model.TransactionType
	Points          int
	PurchaseAmount  *float64
	RewardID        *uuid.UUID
	Notes           *string
	CreatedByUserID *uuid.UUID
}

func (r *PointTransactionRepository) Insert(ctx context.Context, p InsertTransactionParams) (*model.PointTransaction, error) {
	const q = `INSERT INTO point_transactions
	               (customer_user_id, store_id, type, points,
	                purchase_amount, reward_id, notes, created_by_user_id)
	           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	           RETURNING ` + txCols
	return scanTx(r.pool.QueryRow(ctx, q,
		p.CustomerUserID, p.StoreID, p.Type, p.Points,
		p.PurchaseAmount, p.RewardID, p.Notes, p.CreatedByUserID,
	))
}

// ============================================================
// Projecoes enriquecidas para extrato
// ============================================================

// CustomerTransactionRow — extrato do cliente, enriquecido com nome da loja
// e nome da recompensa (se aplicavel). Evita N+1 no frontend.
type CustomerTransactionRow struct {
	ID                uuid.UUID `json:"id"`
	StoreID           uuid.UUID `json:"store_id"`
	StoreName         string    `json:"store_name"`
	StorePrimaryColor *string   `json:"store_primary_color,omitempty"`
	Type              string    `json:"type"`
	Points            int       `json:"points"`
	PurchaseAmount    *float64  `json:"purchase_amount,omitempty"`
	RewardID          *string   `json:"reward_id,omitempty"`
	RewardName        *string   `json:"reward_name,omitempty"`
	Notes             *string   `json:"notes,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
}

// StoreTransactionRow — extrato da loja, enriquecido com nome do cliente
// e quem criou a transacao (se for um lojista identificado).
type StoreTransactionRow struct {
	ID              uuid.UUID `json:"id"`
	CustomerID      uuid.UUID `json:"customer_id"`
	CustomerName    string    `json:"customer_name"`
	CustomerEmail   string    `json:"customer_email"`
	Type            string    `json:"type"`
	Points          int       `json:"points"`
	PurchaseAmount  *float64  `json:"purchase_amount,omitempty"`
	RewardID        *string   `json:"reward_id,omitempty"`
	RewardName      *string   `json:"reward_name,omitempty"`
	Notes           *string   `json:"notes,omitempty"`
	CreatedByUserID *string   `json:"created_by_user_id,omitempty"`
	CreatedByName   *string   `json:"created_by_name,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

// ListByCustomer retorna o extrato do cliente, opcionalmente filtrado por loja.
// Paginado por limit/offset. Ordem: mais recente primeiro.
func (r *PointTransactionRepository) ListByCustomer(
	ctx context.Context, customerID uuid.UUID, storeID *uuid.UUID, limit, offset int,
) ([]CustomerTransactionRow, error) {
	const q = `SELECT pt.id, pt.store_id, s.name, s.primary_color,
	                  pt.type::text, pt.points, pt.purchase_amount,
	                  pt.reward_id::text, r.name,
	                  pt.notes, pt.created_at
	           FROM point_transactions pt
	           JOIN stores s ON s.id = pt.store_id
	           LEFT JOIN rewards r ON r.id = pt.reward_id
	           WHERE pt.customer_user_id = $1
	             AND ($2::uuid IS NULL OR pt.store_id = $2::uuid)
	           ORDER BY pt.created_at DESC
	           LIMIT $3 OFFSET $4`
	rows, err := r.pool.Query(ctx, q, customerID, storeID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]CustomerTransactionRow, 0)
	for rows.Next() {
		var t CustomerTransactionRow
		if err := rows.Scan(
			&t.ID, &t.StoreID, &t.StoreName, &t.StorePrimaryColor,
			&t.Type, &t.Points, &t.PurchaseAmount,
			&t.RewardID, &t.RewardName,
			&t.Notes, &t.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// ListByStore retorna o extrato da loja, opcionalmente filtrado por tipo.
// Paginado. Ordem: mais recente primeiro.
func (r *PointTransactionRepository) ListByStore(
	ctx context.Context, storeID uuid.UUID, txType *string, limit, offset int,
) ([]StoreTransactionRow, error) {
	const q = `SELECT pt.id, pt.customer_user_id, u.name, u.email,
	                  pt.type::text, pt.points, pt.purchase_amount,
	                  pt.reward_id::text, r.name,
	                  pt.notes,
	                  pt.created_by_user_id::text, cu.name,
	                  pt.created_at
	           FROM point_transactions pt
	           JOIN users u ON u.id = pt.customer_user_id
	           LEFT JOIN rewards r ON r.id = pt.reward_id
	           LEFT JOIN users cu ON cu.id = pt.created_by_user_id
	           WHERE pt.store_id = $1
	             AND ($2::text IS NULL OR pt.type::text = $2::text)
	           ORDER BY pt.created_at DESC
	           LIMIT $3 OFFSET $4`
	rows, err := r.pool.Query(ctx, q, storeID, txType, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]StoreTransactionRow, 0)
	for rows.Next() {
		var t StoreTransactionRow
		if err := rows.Scan(
			&t.ID, &t.CustomerID, &t.CustomerName, &t.CustomerEmail,
			&t.Type, &t.Points, &t.PurchaseAmount,
			&t.RewardID, &t.RewardName,
			&t.Notes,
			&t.CreatedByUserID, &t.CreatedByName,
			&t.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}
