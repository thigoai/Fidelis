package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/fidelis/api/internal/model"
	"github.com/fidelis/api/internal/repository"
	"github.com/fidelis/api/pkg/jwtauth"
	"github.com/fidelis/api/pkg/password"
)

type AuthService struct {
	users *repository.UserRepository
	jwt   *jwtauth.Manager
}

func NewAuthService(users *repository.UserRepository, jwt *jwtauth.Manager) *AuthService {
	return &AuthService{users: users, jwt: jwt}
}

type LoginResult struct {
	User      *model.User
	Token     string
	ExpiresAt time.Time
}

// Login valida email + senha e emite JWT.
// IMPORTANTE: nunca distinguir "email nao existe" de "senha errada" na resposta —
// ambos viram ErrInvalidCredentials para nao vazar quem tem cadastro.
func (s *AuthService) Login(ctx context.Context, email, plain string) (*LoginResult, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	u, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}
	if !u.Active {
		return nil, ErrUserDisabled
	}
	if err := password.Verify(u.PasswordHash, plain); err != nil {
		return nil, ErrInvalidCredentials
	}
	token, exp, err := s.jwt.Generate(u.ID, u.Role)
	if err != nil {
		return nil, err
	}
	return &LoginResult{User: u, Token: token, ExpiresAt: exp}, nil
}
