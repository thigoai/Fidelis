package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/fidelis/api/internal/middleware"
	"github.com/fidelis/api/internal/model"
	"github.com/fidelis/api/internal/service"
)

type BalanceHandler struct {
	balance *service.BalanceService
}

func NewBalanceHandler(balance *service.BalanceService) *BalanceHandler {
	return &BalanceHandler{balance: balance}
}

// GET /api/users/:id/balance
// Self-only: qualquer usuario autenticado pode consultar APENAS o proprio saldo
// (exceto admin, que pode consultar qualquer um — util para suporte).
func (h *BalanceHandler) Get(c *gin.Context) {
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_user_id", "ID de usuario invalido")
		return
	}
	callerID, ok := middleware.UserIDFromContext(c)
	if !ok {
		jsonError(c, http.StatusUnauthorized, "unauthenticated", "Autenticacao requerida")
		return
	}
	callerRole, _ := middleware.RoleFromContext(c)
	if callerID != targetID && callerRole != model.RoleAdmin {
		jsonError(c, http.StatusForbidden, "forbidden", "Voce so pode consultar o proprio saldo")
		return
	}

	entries, err := h.balance.ListByCustomer(c.Request.Context(), targetID)
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"user_id":  targetID.String(),
		"balances": entries,
	})
}
