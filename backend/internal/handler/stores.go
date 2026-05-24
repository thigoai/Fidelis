package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/fidelis/api/internal/middleware"
	"github.com/fidelis/api/internal/service"
)

type StoresHandler struct {
	stores *service.StoresService
}

func NewStoresHandler(s *service.StoresService) *StoresHandler {
	return &StoresHandler{stores: s}
}

// GET /api/me/stores
func (h *StoresHandler) ListMine(c *gin.Context) {
	userID, ok := middleware.UserIDFromContext(c)
	if !ok {
		jsonError(c, http.StatusUnauthorized, "unauthenticated", "Autenticacao requerida")
		return
	}
	list, err := h.stores.ListByMember(c.Request.Context(), userID)
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"stores": list})
}

// GET /api/stores/:id/members
// So lojista membro da loja (validado no service via assertMember).
func (h *StoresHandler) ListMembers(c *gin.Context) {
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
	rows, err := h.stores.ListMembers(c.Request.Context(), storeID, callerID)
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"members": rows})
}
