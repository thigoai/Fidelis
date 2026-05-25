package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type StatsRepository struct {
	pool *pgxpool.Pool
}

func NewStatsRepository(pool *pgxpool.Pool) *StatsRepository {
	return &StatsRepository{pool: pool}
}

type StoreKPIs struct {
	TotalCustomers      int `json:"total_customers"`
	TotalPointsCredited int `json:"total_points_credited"`
	TotalPointsRedeemed int `json:"total_points_redeemed"`
	ActiveRewards       int `json:"active_rewards"`
}

type DailyPoints struct {
	Date     time.Time `json:"date"`
	Credited int       `json:"credited"`
	Redeemed int       `json:"redeemed"`
}

type TopCustomer struct {
	CustomerID    uuid.UUID `json:"customer_id"`
	Name          string    `json:"name"`
	PointsBalance int       `json:"points_balance"`
}

type TopReward struct {
	RewardID        uuid.UUID `json:"reward_id"`
	Name            string    `json:"name"`
	PointsCost      int       `json:"points_cost"`
	RedemptionCount int       `json:"redemption_count"`
}

// KPIs agrega contagens basicas usadas nos cards do topo.
func (r *StatsRepository) KPIs(ctx context.Context, storeID uuid.UUID) (StoreKPIs, error) {
	const q = `SELECT
	             (SELECT COUNT(*) FROM memberships WHERE store_id = $1),
	             (SELECT COALESCE(SUM(lifetime_earned), 0) FROM memberships WHERE store_id = $1),
	             (SELECT COALESCE(SUM(lifetime_redeemed), 0) FROM memberships WHERE store_id = $1),
	             (SELECT COUNT(*) FROM rewards WHERE store_id = $1 AND active = TRUE)`
	var k StoreKPIs
	err := r.pool.QueryRow(ctx, q, storeID).Scan(
		&k.TotalCustomers, &k.TotalPointsCredited, &k.TotalPointsRedeemed, &k.ActiveRewards,
	)
	return k, err
}

// PointsPerDay devolve os ultimos N dias (incluindo dias sem transacao via
// generate_series). Coluna credited soma o que entrou (+); redeemed soma o
// que saiu (em valor absoluto) — fica mais natural plotar duas series positivas.
func (r *StatsRepository) PointsPerDay(ctx context.Context, storeID uuid.UUID, days int) ([]DailyPoints, error) {
	const q = `WITH series AS (
	             SELECT generate_series(
	               (CURRENT_DATE - ($2 - 1) * INTERVAL '1 day')::date,
	               CURRENT_DATE,
	               INTERVAL '1 day'
	             )::date AS day
	           )
	           SELECT s.day,
	                  COALESCE(SUM(CASE WHEN pt.points > 0 THEN pt.points ELSE 0 END), 0),
	                  COALESCE(SUM(CASE WHEN pt.points < 0 THEN -pt.points ELSE 0 END), 0)
	           FROM series s
	           LEFT JOIN point_transactions pt
	             ON pt.store_id = $1
	             AND (pt.created_at AT TIME ZONE 'UTC')::date = s.day
	           GROUP BY s.day
	           ORDER BY s.day ASC`
	rows, err := r.pool.Query(ctx, q, storeID, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]DailyPoints, 0, days)
	for rows.Next() {
		var d DailyPoints
		if err := rows.Scan(&d.Date, &d.Credited, &d.Redeemed); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

// TopCustomers lista os N clientes com maior saldo na loja.
func (r *StatsRepository) TopCustomers(ctx context.Context, storeID uuid.UUID, limit int) ([]TopCustomer, error) {
	const q = `SELECT u.id, u.name, m.points_balance
	           FROM memberships m
	           JOIN users u ON u.id = m.customer_user_id
	             AND u.deleted_at IS NULL
	             AND u.role = 'cliente'
	           WHERE m.store_id = $1
	           ORDER BY m.points_balance DESC, u.name ASC
	           LIMIT $2`
	rows, err := r.pool.Query(ctx, q, storeID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]TopCustomer, 0, limit)
	for rows.Next() {
		var t TopCustomer
		if err := rows.Scan(&t.CustomerID, &t.Name, &t.PointsBalance); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// TopRewards lista as N recompensas mais resgatadas (so traz as com >=1 resgate).
func (r *StatsRepository) TopRewards(ctx context.Context, storeID uuid.UUID, limit int) ([]TopReward, error) {
	const q = `SELECT r.id, r.name, r.points_cost, COUNT(pt.id)
	           FROM rewards r
	           LEFT JOIN point_transactions pt
	             ON pt.reward_id = r.id
	             AND pt.type = 'redemption'
	           WHERE r.store_id = $1
	           GROUP BY r.id, r.name, r.points_cost
	           HAVING COUNT(pt.id) > 0
	           ORDER BY COUNT(pt.id) DESC, r.name ASC
	           LIMIT $2`
	rows, err := r.pool.Query(ctx, q, storeID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]TopReward, 0, limit)
	for rows.Next() {
		var t TopReward
		if err := rows.Scan(&t.RewardID, &t.Name, &t.PointsCost, &t.RedemptionCount); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}
