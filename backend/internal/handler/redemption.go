package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/fidelis/api/internal/middleware"
	"github.com/fidelis/api/internal/service"
)

type RedemptionHandler struct {
	redemptions *service.RedemptionService
}

func NewRedemptionHandler(s *service.RedemptionService) *RedemptionHandler {
	return &RedemptionHandler{redemptions: s}
}

type redeemRequest struct {
	RewardID string `json:"reward_id" binding:"required"`
}

// POST /api/stores/:id/redemptions
// Roles permitidos: cliente (enforce via RequireRole no router).
// O cliente autenticado e o sujeito do resgate — nao precisa enviar customer_id.
func (h *RedemptionHandler) Create(c *gin.Context) {
	storeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_store_id", "ID de loja invalido")
		return
	}
	var req redeemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	rewardID, err := uuid.Parse(req.RewardID)
	if err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_reward_id", "ID de recompensa invalido")
		return
	}
	customerID, ok := middleware.UserIDFromContext(c)
	if !ok {
		jsonError(c, http.StatusUnauthorized, "unauthenticated", "Autenticacao requerida")
		return
	}

	res, err := h.redemptions.Redeem(c.Request.Context(), service.RedeemInput{
		StoreID:    storeID,
		CustomerID: customerID,
		RewardID:   rewardID,
	})
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"transaction": res.Transaction,
		"membership":  res.Membership,
		"reward":      res.Reward,
	})
}
