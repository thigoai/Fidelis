package router

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/fidelis/api/internal/handler"
	"github.com/fidelis/api/internal/middleware"
	"github.com/fidelis/api/internal/model"
	"github.com/fidelis/api/pkg/jwtauth"
)

type Deps struct {
	Pool *pgxpool.Pool
	JWT  *jwtauth.Manager

	Auth          *handler.AuthHandler
	Users         *handler.UsersHandler
	Stores        *handler.StoresHandler
	Points        *handler.PointsHandler
	Balance       *handler.BalanceHandler
	Rewards       *handler.RewardsHandler
	Redemptions   *handler.RedemptionHandler
	Transactions  *handler.TransactionsHandler
	Stats         *handler.StatsHandler
	PasswordReset *handler.PasswordResetHandler
}

func New(deps Deps) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery(), gin.Logger(), middleware.CORS())

	r.GET("/health", healthHandler(deps.Pool))

	// ===== Publicas =====
	auth := r.Group("/auth")
	{
		auth.POST("/login", deps.Auth.Login)
		auth.POST("/register/lojista", deps.Auth.RegisterLojista)
		auth.POST("/register/cliente", deps.Auth.RegisterCliente)
		auth.POST("/password-reset/request", deps.PasswordReset.Request)
		auth.POST("/password-reset/confirm", deps.PasswordReset.Confirm)
	}

	// ===== API autenticada =====
	api := r.Group("/api", middleware.Auth(deps.JWT))
	{
		api.GET("/me", deps.Users.GetMe)
		api.PATCH("/me", deps.Users.UpdateMe)
		api.POST("/me/password", deps.Users.ChangePassword)
		api.GET("/me/stores", deps.Stores.ListMine)
		api.GET("/me/transactions", deps.Transactions.ListMine)

		api.GET("/users/:id/balance", deps.Balance.Get)

		// ===== Recompensas =====
		api.GET("/stores/:id/rewards", deps.Rewards.ListByStore)
		api.GET("/stores/:id/rewards/admin",
			middleware.RequireRole(model.RoleLojista, model.RoleAdmin),
			deps.Rewards.ListAdmin,
		)
		api.POST("/stores/:id/rewards",
			middleware.RequireRole(model.RoleLojista, model.RoleAdmin),
			deps.Rewards.Create,
		)
		api.PATCH("/stores/:id/rewards/:rewardId",
			middleware.RequireRole(model.RoleLojista, model.RoleAdmin),
			deps.Rewards.Update,
		)
		api.DELETE("/stores/:id/rewards/:rewardId",
			middleware.RequireRole(model.RoleLojista, model.RoleAdmin),
			deps.Rewards.Delete,
		)

		// ===== Clientes, extrato e analytics da loja =====
		api.GET("/stores/:id/members",
			middleware.RequireRole(model.RoleLojista, model.RoleAdmin),
			deps.Stores.ListMembers,
		)
		api.GET("/stores/:id/transactions",
			middleware.RequireRole(model.RoleLojista, model.RoleAdmin),
			deps.Transactions.ListByStore,
		)
		api.GET("/stores/:id/stats",
			middleware.RequireRole(model.RoleLojista, model.RoleAdmin),
			deps.Stats.Get,
		)

		// ===== Pontuar e resgatar =====
		api.POST("/stores/:id/points",
			middleware.RequireRole(model.RoleLojista),
			deps.Points.Award,
		)
		api.POST("/stores/:id/redemptions",
			middleware.RequireRole(model.RoleCliente),
			deps.Redemptions.Create,
		)
	}

	return r
}

func healthHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		body := gin.H{"service": "fidelis-api", "status": "ok"}
		if err := pool.Ping(ctx); err != nil {
			body["status"] = "degraded"
			body["db_error"] = err.Error()
			c.JSON(http.StatusServiceUnavailable, body)
			return
		}
		c.JSON(http.StatusOK, body)
	}
}
