package service

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/fidelis/api/internal/model"
	"github.com/fidelis/api/pkg/jwtauth"
	"github.com/fidelis/api/pkg/password"
)

const (
	minPasswordLen = 6
	minSlugLen     = 3
	maxSlugLen     = 50

	sqlstateUniqueViolation = "23505"

	constraintEmailUnique = "uq_users_email_active"
	constraintSlugUnique  = "uq_stores_slug"
)

// kebab-case: minusculo, alfanumerico, hifens entre segmentos.
var slugRegex = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type RegistrationService struct {
	pool *pgxpool.Pool
	jwt  *jwtauth.Manager
}

func NewRegistrationService(pool *pgxpool.Pool, jwt *jwtauth.Manager) *RegistrationService {
	return &RegistrationService{pool: pool, jwt: jwt}
}

// RegisterResult e o payload comum a ambos os registros.
// Store fica nil quando o registro e de cliente.
type RegisterResult struct {
	User      *model.User
	Token     string
	ExpiresAt time.Time
	Store     *model.Store
}

// =============================================================
// Registro de cliente
// =============================================================

type RegisterClienteInput struct {
	Name     string
	Email    string
	Password string
	Phone    *string
}

func (s *RegistrationService) RegisterCliente(ctx context.Context, in RegisterClienteInput) (*RegisterResult, error) {
	if err := validatePassword(in.Password); err != nil {
		return nil, err
	}
	hash, err := password.Hash(in.Password)
	if err != nil {
		return nil, err
	}

	var u model.User
	err = s.pool.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, name, phone, role)
		 VALUES ($1, $2, $3, $4, 'cliente')
		 RETURNING id, email, password_hash, name, phone, role,
		           email_verified, active, created_at, updated_at, deleted_at`,
		strings.ToLower(strings.TrimSpace(in.Email)), hash, strings.TrimSpace(in.Name), in.Phone,
	).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Phone, &u.Role,
		&u.EmailVerified, &u.Active, &u.CreatedAt, &u.UpdatedAt, &u.DeletedAt,
	)
	if err != nil {
		return nil, mapInsertUserError(err)
	}

	return s.issue(&u, nil)
}

// =============================================================
// Registro de lojista (cria User + Store + StoreMember atomicamente)
// =============================================================

type RegisterLojistaInput struct {
	OwnerName     string
	OwnerEmail    string
	OwnerPassword string
	OwnerPhone    *string

	StoreSlug         string
	StoreName         string
	StorePrimaryColor *string
	StoreCity         *string
	StoreState        *string
}

func (s *RegistrationService) RegisterLojista(ctx context.Context, in RegisterLojistaInput) (*RegisterResult, error) {
	if err := validatePassword(in.OwnerPassword); err != nil {
		return nil, err
	}
	slug := strings.ToLower(strings.TrimSpace(in.StoreSlug))
	if err := validateSlug(slug); err != nil {
		return nil, err
	}

	hash, err := password.Hash(in.OwnerPassword)
	if err != nil {
		return nil, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 1. Cria o usuario lojista.
	var u model.User
	err = tx.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, name, phone, role)
		 VALUES ($1, $2, $3, $4, 'lojista')
		 RETURNING id, email, password_hash, name, phone, role,
		           email_verified, active, created_at, updated_at, deleted_at`,
		strings.ToLower(strings.TrimSpace(in.OwnerEmail)), hash, strings.TrimSpace(in.OwnerName), in.OwnerPhone,
	).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Phone, &u.Role,
		&u.EmailVerified, &u.Active, &u.CreatedAt, &u.UpdatedAt, &u.DeletedAt,
	)
	if err != nil {
		return nil, mapInsertUserError(err)
	}

	// 2. Cria a loja.
	var st model.Store
	err = tx.QueryRow(ctx,
		`INSERT INTO stores (slug, name, primary_color, city, state)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, slug, name, description, logo_url, primary_color,
		           address, city, state, country, active,
		           created_at, updated_at, deleted_at`,
		slug, strings.TrimSpace(in.StoreName), in.StorePrimaryColor, in.StoreCity, in.StoreState,
	).Scan(
		&st.ID, &st.Slug, &st.Name, &st.Description, &st.LogoURL, &st.PrimaryColor,
		&st.Address, &st.City, &st.State, &st.Country, &st.Active,
		&st.CreatedAt, &st.UpdatedAt, &st.DeletedAt,
	)
	if err != nil {
		return nil, mapInsertStoreError(err)
	}

	// 3. Vincula o usuario como owner.
	if _, err := tx.Exec(ctx,
		`INSERT INTO store_members (store_id, user_id, role) VALUES ($1, $2, 'owner')`,
		st.ID, u.ID,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return s.issue(&u, &st)
}

// =============================================================
// Helpers
// =============================================================

func (s *RegistrationService) issue(u *model.User, st *model.Store) (*RegisterResult, error) {
	token, exp, err := s.jwt.Generate(u.ID, u.Role)
	if err != nil {
		return nil, err
	}
	return &RegisterResult{User: u, Token: token, ExpiresAt: exp, Store: st}, nil
}

func validatePassword(p string) error {
	if len(p) < minPasswordLen {
		return ErrWeakPassword
	}
	return nil
}

func validateSlug(s string) error {
	if len(s) < minSlugLen || len(s) > maxSlugLen {
		return ErrInvalidSlug
	}
	if !slugRegex.MatchString(s) {
		return ErrInvalidSlug
	}
	return nil
}

func mapInsertUserError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == sqlstateUniqueViolation {
		if pgErr.ConstraintName == constraintEmailUnique {
			return ErrEmailTaken
		}
	}
	return err
}

func mapInsertStoreError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == sqlstateUniqueViolation {
		if pgErr.ConstraintName == constraintSlugUnique {
			return ErrSlugTaken
		}
	}
	return err
}
