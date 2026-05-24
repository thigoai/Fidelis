package service

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"github.com/fidelis/api/internal/model"
	"github.com/fidelis/api/internal/repository"
)

type StoresService struct {
	stores      *repository.StoreRepository
	memberships *repository.MembershipRepository
}

func NewStoresService(s *repository.StoreRepository, m *repository.MembershipRepository) *StoresService {
	return &StoresService{stores: s, memberships: m}
}

// ListByMember devolve as lojas em que o usuario e membro. Slice nunca nulo.
func (s *StoresService) ListByMember(ctx context.Context, userID uuid.UUID) ([]model.Store, error) {
	list, err := s.stores.ListByMember(ctx, userID)
	if err != nil {
		return nil, err
	}
	if list == nil {
		list = []model.Store{}
	}
	return list, nil
}

// ListMembers devolve os clientes (com saldo) de uma loja.
// Exige que callerID seja membro da loja — defesa em profundidade alem do RequireRole.
func (s *StoresService) ListMembers(ctx context.Context, storeID, callerID uuid.UUID) ([]repository.StoreMemberRow, error) {
	if _, err := s.stores.FindByID(ctx, storeID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}
	isMember, err := s.stores.IsMember(ctx, storeID, callerID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrNotStoreMember
	}
	rows, err := s.memberships.ListByStore(ctx, storeID)
	if err != nil {
		return nil, err
	}
	if rows == nil {
		rows = []repository.StoreMemberRow{}
	}
	return rows, nil
}
