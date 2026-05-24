package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/fidelis/api/internal/config"
	"github.com/fidelis/api/internal/database"
	"github.com/fidelis/api/internal/handler"
	"github.com/fidelis/api/internal/repository"
	"github.com/fidelis/api/internal/router"
	"github.com/fidelis/api/internal/service"
	"github.com/fidelis/api/pkg/jwtauth"
)

var version = "dev"

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	rootCtx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pool, err := database.NewPool(rootCtx, database.PoolConfig{
		URL:             cfg.DatabaseURL,
		MaxConns:        cfg.DBMaxConns,
		MinConns:        cfg.DBMinConns,
		MaxConnLifetime: cfg.DBMaxConnLifetime,
		MaxConnIdleTime: cfg.DBMaxConnIdleTime,
	})
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()
	log.Printf("postgres pool ready (max=%d min=%d)", pool.Config().MaxConns, pool.Config().MinConns)

	// ===== Wiring =====
	jwtMgr := jwtauth.New(cfg.JWTSecret, cfg.JWTExpiresIn)

	userRepo := repository.NewUserRepository(pool)
	storeRepo := repository.NewStoreRepository(pool)
	membershipRepo := repository.NewMembershipRepository(pool)
	txRepo := repository.NewPointTransactionRepository(pool)
	rewardRepo := repository.NewRewardRepository(pool)

	authSvc := service.NewAuthService(userRepo, jwtMgr)
	registrationSvc := service.NewRegistrationService(pool, jwtMgr)
	usersSvc := service.NewUsersService(userRepo)
	storesSvc := service.NewStoresService(storeRepo, membershipRepo)
	pointsSvc := service.NewPointsService(userRepo, storeRepo, txRepo, membershipRepo)
	balanceSvc := service.NewBalanceService(membershipRepo)
	rewardsSvc := service.NewRewardsService(rewardRepo, storeRepo)
	redemptionsSvc := service.NewRedemptionService(pool)
	transactionsSvc := service.NewTransactionsService(txRepo, storeRepo)

	r := router.New(router.Deps{
		Pool:         pool,
		JWT:          jwtMgr,
		Auth:         handler.NewAuthHandler(authSvc, registrationSvc),
		Users:        handler.NewUsersHandler(usersSvc),
		Stores:       handler.NewStoresHandler(storesSvc),
		Points:       handler.NewPointsHandler(pointsSvc),
		Balance:      handler.NewBalanceHandler(balanceSvc),
		Rewards:      handler.NewRewardsHandler(rewardsSvc),
		Redemptions:  handler.NewRedemptionHandler(redemptionsSvc),
		Transactions: handler.NewTransactionsHandler(transactionsSvc),
	})

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("fidelis-api %s listening on :%s", version, cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen: %v", err)
		}
	}()

	<-rootCtx.Done()
	log.Println("shutdown signal received")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown: %v", err)
	}
}
