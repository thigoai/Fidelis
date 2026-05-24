package service

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"github.com/fidelis/api/internal/repository"
)

type TransactionsService struct {
	transactions *repository.PointTransactionRepository
	stores       *repository.StoreRepository
}

func NewTransactionsService(
	t *repository.PointTransactionRepository,
	s *repository.StoreRepository,
) *TransactionsService {
	return &TransactionsService{transactions: t, stores: s}
}

const (
	defaultListLimit = 50
	maxListLimit     = 200
)

// clampLimit garante limite saudavel mesmo se o caller passar valores invalidos.
func clampLimit(limit int) int {
	if limit <= 0 {
		return defaultListLimit
	}
	if limit > maxListLimit {
		return maxListLimit
	}
	return limit
}

func clampOffset(offset int) int {
	if offset < 0 {
		return 0
	}
	return offset
}

// ===== Extrato do cliente =====

type ListMineInput struct {
	CustomerID uuid.UUID
	StoreID    *uuid.UUID
	Limit      int
	Offset     int
}

func (s *TransactionsService) ListMine(ctx context.Context, in ListMineInput) ([]repository.CustomerTransactionRow, error) {
	rows, err := s.transactions.ListByCustomer(
		ctx, in.CustomerID, in.StoreID,
		clampLimit(in.Limit), clampOffset(in.Offset),
	)
	if err != nil {
		return nil, err
	}
	if rows == nil {
		rows = []repository.CustomerTransactionRow{}
	}
	return rows, nil
}

// ===== Extrato da loja =====

type ListByStoreInput struct {
	StoreID  uuid.UUID
	CallerID uuid.UUID
	Type     *string // nil = sem filtro de tipo
	Limit    int
	Offset   int
}

func (s *TransactionsService) ListByStore(ctx context.Context, in ListByStoreInput) ([]repository.StoreTransactionRow, error) {
	if _, err := s.stores.FindByID(ctx, in.StoreID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}
	isMember, err := s.stores.IsMember(ctx, in.StoreID, in.CallerID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrNotStoreMember
	}
	rows, err := s.transactions.ListByStore(
		ctx, in.StoreID, in.Type,
		clampLimit(in.Limit), clampOffset(in.Offset),
	)
	if err != nil {
		return nil, err
	}
	if rows == nil {
		rows = []repository.StoreTransactionRow{}
	}
	return rows, nil
}
