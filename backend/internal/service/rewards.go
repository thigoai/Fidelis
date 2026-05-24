package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/fidelis/api/internal/model"
	"github.com/fidelis/api/internal/repository"
)

type RewardsService struct {
	rewards *repository.RewardRepository
	stores  *repository.StoreRepository
}

func NewRewardsService(r *repository.RewardRepository, s *repository.StoreRepository) *RewardsService {
	return &RewardsService{rewards: r, stores: s}
}

// ListActiveByStore — leitura publica (cliente ve catalogo da loja).
func (s *RewardsService) ListActiveByStore(ctx context.Context, storeID uuid.UUID) ([]model.Reward, error) {
	list, err := s.rewards.ListActiveByStore(ctx, storeID)
	if err != nil {
		return nil, err
	}
	if list == nil {
		list = []model.Reward{}
	}
	return list, nil
}

// ListAllByStore — leitura admin (lojista gerencia catalogo).
// Valida store membership antes de devolver tudo.
func (s *RewardsService) ListAllByStore(ctx context.Context, storeID, callerID uuid.UUID) ([]model.Reward, error) {
	if err := s.assertMember(ctx, storeID, callerID); err != nil {
		return nil, err
	}
	list, err := s.rewards.ListAllByStore(ctx, storeID)
	if err != nil {
		return nil, err
	}
	if list == nil {
		list = []model.Reward{}
	}
	return list, nil
}

// ============================================================
// Mutacoes — todas exigem callerID membro da store
// ============================================================

type CreateRewardInput struct {
	StoreID     uuid.UUID
	CallerID    uuid.UUID
	Name        string
	Description *string
	ImageURL    *string
	PointsCost  int
	Stock       *int
	Active      bool
	StartsAt    *time.Time
	ExpiresAt   *time.Time
}

func (s *RewardsService) Create(ctx context.Context, in CreateRewardInput) (*model.Reward, error) {
	if err := validateRewardFields(in.Name, in.PointsCost, in.Stock, in.StartsAt, in.ExpiresAt); err != nil {
		return nil, err
	}
	if err := s.assertMember(ctx, in.StoreID, in.CallerID); err != nil {
		return nil, err
	}
	return s.rewards.Create(ctx, repository.CreateRewardParams{
		StoreID:     in.StoreID,
		Name:        strings.TrimSpace(in.Name),
		Description: trimPtr(in.Description),
		ImageURL:    trimPtr(in.ImageURL),
		PointsCost:  in.PointsCost,
		Stock:       in.Stock,
		Active:      in.Active,
		StartsAt:    in.StartsAt,
		ExpiresAt:   in.ExpiresAt,
	})
}

type UpdateRewardInput struct {
	StoreID     uuid.UUID
	CallerID    uuid.UUID
	RewardID    uuid.UUID
	Name        string
	Description *string
	ImageURL    *string
	PointsCost  int
	Stock       *int
	Active      bool
	StartsAt    *time.Time
	ExpiresAt   *time.Time
}

func (s *RewardsService) Update(ctx context.Context, in UpdateRewardInput) (*model.Reward, error) {
	if err := validateRewardFields(in.Name, in.PointsCost, in.Stock, in.StartsAt, in.ExpiresAt); err != nil {
		return nil, err
	}
	if err := s.assertMember(ctx, in.StoreID, in.CallerID); err != nil {
		return nil, err
	}
	r, err := s.rewards.Update(ctx, repository.UpdateRewardParams{
		ID:          in.RewardID,
		StoreID:     in.StoreID,
		Name:        strings.TrimSpace(in.Name),
		Description: trimPtr(in.Description),
		ImageURL:    trimPtr(in.ImageURL),
		PointsCost:  in.PointsCost,
		Stock:       in.Stock,
		Active:      in.Active,
		StartsAt:    in.StartsAt,
		ExpiresAt:   in.ExpiresAt,
	})
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrRewardNotFound
		}
		return nil, err
	}
	return r, nil
}

func (s *RewardsService) Delete(ctx context.Context, storeID, rewardID, callerID uuid.UUID) error {
	if err := s.assertMember(ctx, storeID, callerID); err != nil {
		return err
	}
	if err := s.rewards.SoftDelete(ctx, storeID, rewardID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrRewardNotFound
		}
		return err
	}
	return nil
}

// ============================================================
// Helpers
// ============================================================

func (s *RewardsService) assertMember(ctx context.Context, storeID, userID uuid.UUID) error {
	if _, err := s.stores.FindByID(ctx, storeID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrStoreNotFound
		}
		return err
	}
	isMember, err := s.stores.IsMember(ctx, storeID, userID)
	if err != nil {
		return err
	}
	if !isMember {
		return ErrNotStoreMember
	}
	return nil
}

func validateRewardFields(name string, pointsCost int, stock *int, startsAt, expiresAt *time.Time) error {
	if strings.TrimSpace(name) == "" {
		return ErrInvalidInput
	}
	if pointsCost <= 0 {
		return ErrInvalidInput
	}
	if stock != nil && *stock < 0 {
		return ErrInvalidInput
	}
	if startsAt != nil && expiresAt != nil && !expiresAt.After(*startsAt) {
		return ErrInvalidInput
	}
	return nil
}

func trimPtr(p *string) *string {
	if p == nil {
		return nil
	}
	t := strings.TrimSpace(*p)
	if t == "" {
		return nil
	}
	return &t
}
