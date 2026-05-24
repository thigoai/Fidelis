package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/fidelis/api/internal/model"
)

type RedemptionService struct {
	pool *pgxpool.Pool
}

func NewRedemptionService(pool *pgxpool.Pool) *RedemptionService {
	return &RedemptionService{pool: pool}
}

type RedeemInput struct {
	StoreID    uuid.UUID
	CustomerID uuid.UUID
	RewardID   uuid.UUID
}

type RedeemResult struct {
	Transaction *model.PointTransaction
	Membership  *model.Membership
	Reward      *model.Reward
}

// codigo SQLSTATE 23514 = CHECK constraint violation.
// No nosso fluxo o unico CHECK que pode disparar e memberships.points_balance >= 0.
const sqlstateCheckViolation = "23514"

// Redeem executa o resgate de uma recompensa pelo cliente. O fluxo todo roda em
// uma unica transacao postgres, com SELECT FOR UPDATE na recompensa para evitar
// race em decremento de estoque.
//
// Ordem:
//  1. Lock pessimista na recompensa (SELECT ... FOR UPDATE).
//  2. Valida disponibilidade (ativa, janela, estoque, loja correta).
//  3. Decrementa estoque se aplicavel (stock != nil).
//  4. Insere no ledger; trigger atualiza memberships.
//     Se saldo ficaria negativo, o CHECK aborta a transacao inteira —
//     incluindo o decremento de estoque feito no passo 3.
//  5. Le saldo atualizado para devolver na resposta.
func (s *RedemptionService) Redeem(ctx context.Context, in RedeemInput) (*RedeemResult, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 1. Lock + leitura da recompensa
	const qLock = `SELECT id, store_id, name, description, image_url, points_cost,
	                      stock, active, starts_at, expires_at, created_at, updated_at
	               FROM rewards WHERE id = $1 FOR UPDATE`
	var r model.Reward
	err = tx.QueryRow(ctx, qLock, in.RewardID).Scan(
		&r.ID, &r.StoreID, &r.Name, &r.Description, &r.ImageURL, &r.PointsCost,
		&r.Stock, &r.Active, &r.StartsAt, &r.ExpiresAt, &r.CreatedAt, &r.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRewardNotFound
		}
		return nil, err
	}

	// 2. Validacoes. Reward de outra loja vira NotFound de proposito (nao confirma existencia).
	if r.StoreID != in.StoreID {
		return nil, ErrRewardNotFound
	}
	if !r.Active {
		return nil, ErrRewardUnavailable
	}
	now := time.Now()
	if r.StartsAt != nil && r.StartsAt.After(now) {
		return nil, ErrRewardUnavailable
	}
	if r.ExpiresAt != nil && !r.ExpiresAt.After(now) {
		return nil, ErrRewardUnavailable
	}
	if r.Stock != nil && *r.Stock <= 0 {
		return nil, ErrRewardOutOfStock
	}

	// 3. Decrementa estoque se nao for ilimitado.
	if r.Stock != nil {
		if _, err := tx.Exec(ctx, `UPDATE rewards SET stock = stock - 1 WHERE id = $1`, r.ID); err != nil {
			return nil, err
		}
	}

	// 4. INSERT no ledger. created_by = o proprio cliente (e ele quem inicia o resgate).
	const qInsert = `INSERT INTO point_transactions
	                     (customer_user_id, store_id, type, points, reward_id, created_by_user_id)
	                 VALUES ($1, $2, 'redemption', $3, $4, $1)
	                 RETURNING id, customer_user_id, store_id, type, points,
	                           purchase_amount, reward_id, notes, created_by_user_id, created_at`
	var ptx model.PointTransaction
	err = tx.QueryRow(ctx, qInsert, in.CustomerID, in.StoreID, -r.PointsCost, r.ID).Scan(
		&ptx.ID, &ptx.CustomerUserID, &ptx.StoreID, &ptx.Type, &ptx.Points,
		&ptx.PurchaseAmount, &ptx.RewardID, &ptx.Notes, &ptx.CreatedByUserID, &ptx.CreatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == sqlstateCheckViolation {
			return nil, ErrInsufficientBalance
		}
		return nil, err
	}

	// 5. Le saldo atualizado pelo trigger.
	const qMember = `SELECT customer_user_id, store_id, points_balance,
	                        lifetime_earned, lifetime_redeemed, joined_at, last_activity_at
	                 FROM memberships WHERE customer_user_id = $1 AND store_id = $2`
	var m model.Membership
	err = tx.QueryRow(ctx, qMember, in.CustomerID, in.StoreID).Scan(
		&m.CustomerUserID, &m.StoreID, &m.PointsBalance,
		&m.LifetimeEarned, &m.LifetimeRedeemed, &m.JoinedAt, &m.LastActivityAt,
	)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &RedeemResult{Transaction: &ptx, Membership: &m, Reward: &r}, nil
}
