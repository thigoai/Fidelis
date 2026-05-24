package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/fidelis/api/internal/model"
)

type StoreRepository struct {
	pool *pgxpool.Pool
}

func NewStoreRepository(pool *pgxpool.Pool) *StoreRepository {
	return &StoreRepository{pool: pool}
}

const storeCols = `id, slug, name, description, logo_url, primary_color,
                   address, city, state, country, active,
                   created_at, updated_at, deleted_at`

func scanStore(row pgx.Row) (*model.Store, error) {
	var s model.Store
	err := row.Scan(
		&s.ID, &s.Slug, &s.Name, &s.Description, &s.LogoURL, &s.PrimaryColor,
		&s.Address, &s.City, &s.State, &s.Country, &s.Active,
		&s.CreatedAt, &s.UpdatedAt, &s.DeletedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &s, nil
}

func (r *StoreRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Store, error) {
	const q = `SELECT ` + storeCols + `
	           FROM stores
	           WHERE id = $1 AND deleted_at IS NULL`
	return scanStore(r.pool.QueryRow(ctx, q, id))
}

// IsMember verifica se userID esta vinculado a storeID em qualquer papel.
func (r *StoreRepository) IsMember(ctx context.Context, storeID, userID uuid.UUID) (bool, error) {
	const q = `SELECT EXISTS (
	               SELECT 1 FROM store_members
	               WHERE store_id = $1 AND user_id = $2
	           )`
	var exists bool
	if err := r.pool.QueryRow(ctx, q, storeID, userID).Scan(&exists); err != nil {
		return false, err
	}
	return exists, nil
}

// ListByMember retorna todas as lojas em que userID e membro (qualquer papel).
// Usado pelo painel do lojista para popular o seletor de "minhas lojas".
func (r *StoreRepository) ListByMember(ctx context.Context, userID uuid.UUID) ([]model.Store, error) {
	const q = `SELECT s.id, s.slug, s.name, s.description, s.logo_url, s.primary_color,
	                  s.address, s.city, s.state, s.country, s.active,
	                  s.created_at, s.updated_at, s.deleted_at
	           FROM stores s
	           JOIN store_members sm ON sm.store_id = s.id
	           WHERE sm.user_id = $1 AND s.deleted_at IS NULL
	           ORDER BY s.name ASC`
	rows, err := r.pool.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]model.Store, 0)
	for rows.Next() {
		var s model.Store
		if err := rows.Scan(
			&s.ID, &s.Slug, &s.Name, &s.Description, &s.LogoURL, &s.PrimaryColor,
			&s.Address, &s.City, &s.State, &s.Country, &s.Active,
			&s.CreatedAt, &s.UpdatedAt, &s.DeletedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, rows.Err()
}
