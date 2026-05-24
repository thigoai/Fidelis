package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/fidelis/api/internal/model"
)

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

const userCols = `id, email, password_hash, name, phone, role,
                  email_verified, active, created_at, updated_at, deleted_at`

func scanUser(row pgx.Row) (*model.User, error) {
	var u model.User
	err := row.Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Phone, &u.Role,
		&u.EmailVerified, &u.Active, &u.CreatedAt, &u.UpdatedAt, &u.DeletedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	const q = `SELECT ` + userCols + `
	           FROM users
	           WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`
	return scanUser(r.pool.QueryRow(ctx, q, email))
}

func (r *UserRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	const q = `SELECT ` + userCols + `
	           FROM users
	           WHERE id = $1 AND deleted_at IS NULL`
	return scanUser(r.pool.QueryRow(ctx, q, id))
}

type CreateUserParams struct {
	Email        string
	PasswordHash string
	Name         string
	Phone        *string
	Role         model.UserRole
}

func (r *UserRepository) Create(ctx context.Context, p CreateUserParams) (*model.User, error) {
	const q = `INSERT INTO users (email, password_hash, name, phone, role)
	           VALUES ($1, $2, $3, $4, $5)
	           RETURNING ` + userCols
	return scanUser(r.pool.QueryRow(ctx, q, p.Email, p.PasswordHash, p.Name, p.Phone, p.Role))
}

type UpdateUserParams struct {
	ID    uuid.UUID
	Name  string
	Phone *string
}

// Update atualiza apenas nome e telefone. Email/role/senha tem fluxos proprios.
func (r *UserRepository) Update(ctx context.Context, p UpdateUserParams) (*model.User, error) {
	const q = `UPDATE users
	           SET name = $1, phone = $2
	           WHERE id = $3 AND deleted_at IS NULL
	           RETURNING ` + userCols
	return scanUser(r.pool.QueryRow(ctx, q, p.Name, p.Phone, p.ID))
}

// UpdatePassword atualiza o hash da senha. A verificacao da senha atual
// e responsabilidade do service (precisa ler o hash atual antes).
func (r *UserRepository) UpdatePassword(ctx context.Context, userID uuid.UUID, newHash string) error {
	cmd, err := r.pool.Exec(ctx,
		`UPDATE users SET password_hash = $1 WHERE id = $2 AND deleted_at IS NULL`,
		newHash, userID,
	)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
