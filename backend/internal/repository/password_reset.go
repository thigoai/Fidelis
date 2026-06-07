package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PasswordResetRepository struct {
	pool *pgxpool.Pool
}

func NewPasswordResetRepository(pool *pgxpool.Pool) *PasswordResetRepository {
	return &PasswordResetRepository{pool: pool}
}

type PasswordResetToken struct {
	TokenHash string
	UserID    uuid.UUID
	ExpiresAt time.Time
	UsedAt    *time.Time
	CreatedAt time.Time
}

func (r *PasswordResetRepository) Create(
	ctx context.Context, tokenHash string, userID uuid.UUID, expiresAt time.Time,
) error {
	const q = `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
	           VALUES ($1, $2, $3)`
	_, err := r.pool.Exec(ctx, q, tokenHash, userID, expiresAt)
	return err
}

func (r *PasswordResetRepository) Find(ctx context.Context, tokenHash string) (*PasswordResetToken, error) {
	const q = `SELECT token_hash, user_id, expires_at, used_at, created_at
	           FROM password_reset_tokens WHERE token_hash = $1`
	var t PasswordResetToken
	err := r.pool.QueryRow(ctx, q, tokenHash).Scan(
		&t.TokenHash, &t.UserID, &t.ExpiresAt, &t.UsedAt, &t.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &t, nil
}

// MarkUsed marca o token como consumido. Atomico via UPDATE com WHERE used_at IS NULL —
// dois requests simultaneos com o mesmo token: o segundo nao afeta linhas.
func (r *PasswordResetRepository) MarkUsed(ctx context.Context, tokenHash string) (bool, error) {
	cmd, err := r.pool.Exec(ctx,
		`UPDATE password_reset_tokens SET used_at = NOW()
		 WHERE token_hash = $1 AND used_at IS NULL`,
		tokenHash,
	)
	if err != nil {
		return false, err
	}
	return cmd.RowsAffected() > 0, nil
}

// DeleteExpiredOrUsed e util pra rodar periodicamente (cron) e limpar a tabela.
// Nao usado no fluxo principal — apenas exposto pra eventual job de manutencao.
func (r *PasswordResetRepository) DeleteExpiredOrUsed(ctx context.Context) (int64, error) {
	cmd, err := r.pool.Exec(ctx,
		`DELETE FROM password_reset_tokens
		 WHERE used_at IS NOT NULL OR expires_at <= NOW()`,
	)
	if err != nil {
		return 0, err
	}
	return cmd.RowsAffected(), nil
}
