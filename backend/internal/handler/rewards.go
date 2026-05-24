package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/fidelis/api/internal/middleware"
	"github.com/fidelis/api/internal/service"
)

type RewardsHandler struct {
	rewards *service.RewardsService
}

func NewRewardsHandler(s *service.RewardsService) *RewardsHandler {
	return &RewardsHandler{rewards: s}
}

// ===== GET /api/stores/:id/rewards =====
// Catalogo publico — so ativas, dentro da janela e com estoque.
func (h *RewardsHandler) ListByStore(c *gin.Context) {
	storeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_store_id", "ID de loja invalido")
		return
	}
	list, err := h.rewards.ListActiveByStore(c.Request.Context(), storeID)
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"rewards": list})
}

// ===== GET /api/stores/:id/rewards/admin =====
// Catalogo completo (inclui inativas) — so pra lojista membro da loja.
func (h *RewardsHandler) ListAdmin(c *gin.Context) {
	storeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_store_id", "ID de loja invalido")
		return
	}
	callerID, ok := middleware.UserIDFromContext(c)
	if !ok {
		jsonError(c, http.StatusUnauthorized, "unauthenticated", "Autenticacao requerida")
		return
	}
	list, err := h.rewards.ListAllByStore(c.Request.Context(), storeID, callerID)
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"rewards": list})
}

// ===== POST /api/stores/:id/rewards =====
type rewardRequest struct {
	Name        string     `json:"name"                       binding:"required,min=1"`
	Description *string    `json:"description,omitempty"`
	ImageURL    *string    `json:"image_url,omitempty"`
	PointsCost  int        `json:"points_cost"                binding:"required,gt=0"`
	Stock       *int       `json:"stock,omitempty"            binding:"omitempty,gte=0"`
	Active      *bool      `json:"active,omitempty"`
	StartsAt    *time.Time `json:"starts_at,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
}

func (h *RewardsHandler) Create(c *gin.Context) {
	storeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_store_id", "ID de loja invalido")
		return
	}
	callerID, ok := middleware.UserIDFromContext(c)
	if !ok {
		jsonError(c, http.StatusUnauthorized, "unauthenticated", "")
		return
	}
	var req rewardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	active := true
	if req.Active != nil {
		active = *req.Active
	}
	reward, err := h.rewards.Create(c.Request.Context(), service.CreateRewardInput{
		StoreID:     storeID,
		CallerID:    callerID,
		Name:        req.Name,
		Description: req.Description,
		ImageURL:    req.ImageURL,
		PointsCost:  req.PointsCost,
		Stock:       req.Stock,
		Active:      active,
		StartsAt:    req.StartsAt,
		ExpiresAt:   req.ExpiresAt,
	})
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, reward)
}

// ===== PATCH /api/stores/:id/rewards/:rewardId =====
func (h *RewardsHandler) Update(c *gin.Context) {
	storeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_store_id", "ID de loja invalido")
		return
	}
	rewardID, err := uuid.Parse(c.Param("rewardId"))
	if err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_reward_id", "ID de recompensa invalido")
		return
	}
	callerID, ok := middleware.UserIDFromContext(c)
	if !ok {
		jsonError(c, http.StatusUnauthorized, "unauthenticated", "")
		return
	}
	var req rewardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	active := true
	if req.Active != nil {
		active = *req.Active
	}
	reward, err := h.rewards.Update(c.Request.Context(), service.UpdateRewardInput{
		StoreID:     storeID,
		CallerID:    callerID,
		RewardID:    rewardID,
		Name:        req.Name,
		Description: req.Description,
		ImageURL:    req.ImageURL,
		PointsCost:  req.PointsCost,
		Stock:       req.Stock,
		Active:      active,
		StartsAt:    req.StartsAt,
		ExpiresAt:   req.ExpiresAt,
	})
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, reward)
}

// ===== DELETE /api/stores/:id/rewards/:rewardId =====
// Soft delete: marca active=false (preserva FK do ledger).
func (h *RewardsHandler) Delete(c *gin.Context) {
	storeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_store_id", "ID de loja invalido")
		return
	}
	rewardID, err := uuid.Parse(c.Param("rewardId"))
	if err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_reward_id", "ID de recompensa invalido")
		return
	}
	callerID, ok := middleware.UserIDFromContext(c)
	if !ok {
		jsonError(c, http.StatusUnauthorized, "unauthenticated", "")
		return
	}
	if err := h.rewards.Delete(c.Request.Context(), storeID, rewardID, callerID); err != nil {
		renderServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
