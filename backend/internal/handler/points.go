package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/fidelis/api/internal/middleware"
	"github.com/fidelis/api/internal/service"
)

type PointsHandler struct {
	points *service.PointsService
}

func NewPointsHandler(points *service.PointsService) *PointsHandler {
	return &PointsHandler{points: points}
}

type awardPointsRequest struct {
	CustomerEmail  string   `json:"customer_email"            binding:"required,email"`
	Points         int      `json:"points"                    binding:"required,gt=0"`
	PurchaseAmount *float64 `json:"purchase_amount,omitempty" binding:"omitempty,gte=0"`
	Notes          *string  `json:"notes,omitempty"`
}

// POST /api/stores/:id/points
// Roles permitidos: lojista (enforce no router via RequireRole).
// Mesmo com role correta, o service valida que o lojista e membro DESTA loja.
func (h *PointsHandler) Award(c *gin.Context) {
	storeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_store_id", "ID de loja invalido")
		return
	}
	var req awardPointsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	lojistaID, ok := middleware.UserIDFromContext(c)
	if !ok {
		jsonError(c, http.StatusUnauthorized, "unauthenticated", "Autenticacao requerida")
		return
	}

	res, err := h.points.Award(c.Request.Context(), service.AwardPointsInput{
		StoreID:        storeID,
		LojistaUserID:  lojistaID,
		CustomerEmail:  req.CustomerEmail,
		Points:         req.Points,
		PurchaseAmount: req.PurchaseAmount,
		Notes:          req.Notes,
	})
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"transaction": res.Transaction,
		"membership":  res.Membership,
	})
}
