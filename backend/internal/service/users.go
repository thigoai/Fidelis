package service

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"

	"github.com/fidelis/api/internal/model"
	"github.com/fidelis/api/internal/repository"
	"github.com/fidelis/api/pkg/password"
)

type UsersService struct {
	users *repository.UserRepository
}

func NewUsersService(u *repository.UserRepository) *UsersService {
	return &UsersService{users: u}
}

func (s *UsersService) GetMe(ctx context.Context, userID uuid.UUID) (*model.User, error) {
	u, err := s.users.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return u, nil
}

type UpdateMeInput struct {
	UserID uuid.UUID
	Name   string
	Phone  *string
}

func (s *UsersService) UpdateMe(ctx context.Context, in UpdateMeInput) (*model.User, error) {
	name := strings.TrimSpace(in.Name)
	if len(name) < 2 {
		return nil, ErrInvalidInput
	}
	phone := in.Phone
	if phone != nil {
		trimmed := strings.TrimSpace(*phone)
		if trimmed == "" {
			phone = nil
		} else {
			phone = &trimmed
		}
	}
	u, err := s.users.Update(ctx, repository.UpdateUserParams{
		ID:    in.UserID,
		Name:  name,
		Phone: phone,
	})
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return u, nil
}

type ChangePasswordInput struct {
	UserID          uuid.UUID
	CurrentPassword string
	NewPassword     string
}

// ChangePassword exige a senha atual para evitar que um token sequestrado
// permita trocar a senha sem o usuario perceber.
func (s *UsersService) ChangePassword(ctx context.Context, in ChangePasswordInput) error {
	if len(in.NewPassword) < 6 {
		return ErrWeakPassword
	}
	u, err := s.users.FindByID(ctx, in.UserID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrUserNotFound
		}
		return err
	}
	if err := password.Verify(u.PasswordHash, in.CurrentPassword); err != nil {
		return ErrPasswordIncorrect
	}
	newHash, err := password.Hash(in.NewPassword)
	if err != nil {
		return err
	}
	return s.users.UpdatePassword(ctx, in.UserID, newHash)
}
