package service

import (
	"context"

	"github.com/google/uuid"

	"github.com/fidelis/api/internal/repository"
)

type BalanceService struct {
	memberships *repository.MembershipRepository
}

func NewBalanceService(memberships *repository.MembershipRepository) *BalanceService {
	return &BalanceService{memberships: memberships}
}

// ListByCustomer devolve sempre slice nao-nil para JSON consistente
// (cliente sem nenhuma fidelidade vira "balances": [], nao "balances": null).
func (s *BalanceService) ListByCustomer(ctx context.Context, customerID uuid.UUID) ([]repository.BalanceEntry, error) {
	entries, err := s.memberships.ListByCustomer(ctx, customerID)
	if err != nil {
		return nil, err
	}
	if entries == nil {
		entries = []repository.BalanceEntry{}
	}
	return entries, nil
}
