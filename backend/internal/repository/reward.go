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

type RewardRepository struct {
	pool *pgxpool.Pool
}

func NewRewardRepository(pool *pgxpool.Pool) *RewardRepository {
	return &RewardRepository{pool: pool}
}

const rewardCols = `id, store_id, name, description, image_url, points_cost,
                    stock, active, starts_at, expires_at, created_at, updated_at`

func scanReward(row pgx.Row) (*model.Reward, error) {
	var r model.Reward
	err := row.Scan(
		&r.ID, &r.StoreID, &r.Name, &r.Description, &r.ImageURL, &r.PointsCost,
		&r.Stock, &r.Active, &r.StartsAt, &r.ExpiresAt, &r.CreatedAt, &r.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &r, nil
}

func (r *RewardRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Reward, error) {
	const q = `SELECT ` + rewardCols + ` FROM rewards WHERE id = $1`
	return scanReward(r.pool.QueryRow(ctx, q, id))
}

// ListActiveByStore — versao PUBLICA: so retorna o que o cliente pode resgatar agora.
func (r *RewardRepository) ListActiveByStore(ctx context.Context, storeID uuid.UUID) ([]model.Reward, error) {
	const q = `SELECT ` + rewardCols + `
	           FROM rewards
	           WHERE store_id = $1
	             AND active = TRUE
	             AND (starts_at IS NULL OR starts_at <= NOW())
	             AND (expires_at IS NULL OR expires_at > NOW())
	             AND (stock IS NULL OR stock > 0)
	           ORDER BY points_cost ASC`
	return r.queryList(ctx, q, storeID)
}

// ListAllByStore — versao ADMIN: tudo da loja, ordenado por nome.
// Usado no painel do lojista pra gerenciar o catalogo (inclui inativas/expiradas).
func (r *RewardRepository) ListAllByStore(ctx context.Context, storeID uuid.UUID) ([]model.Reward, error) {
	const q = `SELECT ` + rewardCols + `
	           FROM rewards
	           WHERE store_id = $1
	           ORDER BY active DESC, name ASC`
	return r.queryList(ctx, q, storeID)
}

func (r *RewardRepository) queryList(ctx context.Context, q string, args ...any) ([]model.Reward, error) {
	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]model.Reward, 0)
	for rows.Next() {
		var v model.Reward
		if err := rows.Scan(
			&v.ID, &v.StoreID, &v.Name, &v.Description, &v.ImageURL, &v.PointsCost,
			&v.Stock, &v.Active, &v.StartsAt, &v.ExpiresAt, &v.CreatedAt, &v.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, v)
	}
	return list, rows.Err()
}

// ============================================================
// Mutacoes
// ============================================================

type CreateRewardParams struct {
	StoreID     uuid.UUID
	Name        string
	Description *string
	ImageURL    *string
	PointsCost  int
	Stock       *int
	Active      bool
	StartsAt    *time.Time
	ExpiresAt   *time.Time
}

func (r *RewardRepository) Create(ctx context.Context, p CreateRewardParams) (*model.Reward, error) {
	const q = `INSERT INTO rewards
	               (store_id, name, description, image_url, points_cost, stock, active, starts_at, expires_at)
	           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	           RETURNING ` + rewardCols
	return scanReward(r.pool.QueryRow(ctx, q,
		p.StoreID, p.Name, p.Description, p.ImageURL,
		p.PointsCost, p.Stock, p.Active, p.StartsAt, p.ExpiresAt,
	))
}

type UpdateRewardParams struct {
	ID          uuid.UUID
	StoreID     uuid.UUID // serve como scope check no WHERE
	Name        string
	Description *string
	ImageURL    *string
	PointsCost  int
	Stock       *int
	Active      bool
	StartsAt    *time.Time
	ExpiresAt   *time.Time
}

// Update aplica semantica PUT — manda o objeto inteiro.
// O scope por store_id no WHERE garante que mesmo um lojista valido nao consiga
// editar reward de outra loja, mesmo que tente burlar o service.
func (r *RewardRepository) Update(ctx context.Context, p UpdateRewardParams) (*model.Reward, error) {
	const q = `UPDATE rewards
	           SET name = $1, description = $2, image_url = $3, points_cost = $4,
	               stock = $5, active = $6, starts_at = $7, expires_at = $8
	           WHERE id = $9 AND store_id = $10
	           RETURNING ` + rewardCols
	return scanReward(r.pool.QueryRow(ctx, q,
		p.Name, p.Description, p.ImageURL, p.PointsCost,
		p.Stock, p.Active, p.StartsAt, p.ExpiresAt,
		p.ID, p.StoreID,
	))
}

// SoftDelete = active=false. NUNCA deletamos fisico — quebraria FK em
// point_transactions.reward_id (resgates passados perderiam referencia).
func (r *RewardRepository) SoftDelete(ctx context.Context, storeID, rewardID uuid.UUID) error {
	cmd, err := r.pool.Exec(ctx,
		`UPDATE rewards SET active = FALSE WHERE id = $1 AND store_id = $2`,
		rewardID, storeID,
	)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
