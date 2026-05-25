package service

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"github.com/fidelis/api/internal/repository"
)

type StatsService struct {
	stats  *repository.StatsRepository
	stores *repository.StoreRepository
}

func NewStatsService(s *repository.StatsRepository, st *repository.StoreRepository) *StatsService {
	return &StatsService{stats: s, stores: st}
}

const (
	statsDays      = 30
	statsTopLimit  = 5
)

type StoreStats struct {
	KPIs          repository.StoreKPIs    `json:"kpis"`
	PointsPerDay  []repository.DailyPoints `json:"points_per_day"`
	TopCustomers  []repository.TopCustomer `json:"top_customers"`
	TopRewards    []repository.TopReward   `json:"top_rewards"`
}

// Get monta o snapshot completo de stats para uma loja.
// Quatro queries em sequencia — todas leves, sem necessidade de paralelizar.
func (s *StatsService) Get(ctx context.Context, storeID, callerID uuid.UUID) (*StoreStats, error) {
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

	kpis, err := s.stats.KPIs(ctx, storeID)
	if err != nil {
		return nil, err
	}
	daily, err := s.stats.PointsPerDay(ctx, storeID, statsDays)
	if err != nil {
		return nil, err
	}
	topCust, err := s.stats.TopCustomers(ctx, storeID, statsTopLimit)
	if err != nil {
		return nil, err
	}
	topRew, err := s.stats.TopRewards(ctx, storeID, statsTopLimit)
	if err != nil {
		return nil, err
	}

	return &StoreStats{
		KPIs:         kpis,
		PointsPerDay: daily,
		TopCustomers: topCust,
		TopRewards:   topRew,
	}, nil
}
