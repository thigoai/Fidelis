package service

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"

	"github.com/fidelis/api/internal/model"
	"github.com/fidelis/api/internal/repository"
)

type PointsService struct {
	users        *repository.UserRepository
	stores       *repository.StoreRepository
	transactions *repository.PointTransactionRepository
	memberships  *repository.MembershipRepository
}

func NewPointsService(
	users *repository.UserRepository,
	stores *repository.StoreRepository,
	transactions *repository.PointTransactionRepository,
	memberships *repository.MembershipRepository,
) *PointsService {
	return &PointsService{
		users:        users,
		stores:       stores,
		transactions: transactions,
		memberships:  memberships,
	}
}

type AwardPointsInput struct {
	StoreID        uuid.UUID
	LojistaUserID  uuid.UUID
	CustomerEmail  string
	Points         int
	PurchaseAmount *float64
	Notes          *string
}

type AwardPointsResult struct {
	Transaction *model.PointTransaction
	Membership  *model.Membership
}

// Award e o fluxo de "lojista da pontos para um cliente".
// Ordem de validacao escolhida de proposito:
//  1. Pontos > 0 (rapido, sem I/O).
//  2. Loja existe (404 antes de qualquer outra checagem de permissao).
//  3. Lojista pertence aa loja (autorizacao fina; complementa o roleMiddleware).
//  4. Cliente existe e tem role=cliente (impede pontuar admin/outro lojista).
//  5. INSERT no ledger; trigger atualiza memberships.
//  6. Re-le memberships para devolver saldo atualizado.
func (s *PointsService) Award(ctx context.Context, in AwardPointsInput) (*AwardPointsResult, error) {
	if in.Points <= 0 {
		return nil, ErrInvalidPoints
	}

	if _, err := s.stores.FindByID(ctx, in.StoreID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	isMember, err := s.stores.IsMember(ctx, in.StoreID, in.LojistaUserID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrNotStoreMember
	}

	email := strings.TrimSpace(strings.ToLower(in.CustomerEmail))
	customer, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrCustomerNotFound
		}
		return nil, err
	}
	if customer.Role != model.RoleCliente {
		return nil, ErrCustomerRoleMismatch
	}
	if !customer.Active {
		return nil, ErrUserDisabled
	}

	tx, err := s.transactions.Insert(ctx, repository.InsertTransactionParams{
		CustomerUserID:  customer.ID,
		StoreID:         in.StoreID,
		Type:            model.TxPurchase,
		Points:          in.Points,
		PurchaseAmount:  in.PurchaseAmount,
		Notes:           in.Notes,
		CreatedByUserID: &in.LojistaUserID,
	})
	if err != nil {
		return nil, err
	}

	m, err := s.memberships.GetForCustomerInStore(ctx, customer.ID, in.StoreID)
	if err != nil {
		return nil, err
	}

	return &AwardPointsResult{Transaction: tx, Membership: m}, nil
}
