package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/fidelis/api/internal/middleware"
	"github.com/fidelis/api/internal/service"
)

type StatsHandler struct {
	stats *service.StatsService
}

func NewStatsHandler(s *service.StatsService) *StatsHandler {
	return &StatsHandler{stats: s}
}

// GET /api/stores/:id/stats
// Devolve KPIs + serie diaria (30d) + top 5 clientes + top 5 recompensas.
// So lojista membro da loja.
func (h *StatsHandler) Get(c *gin.Context) {
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
	res, err := h.stats.Get(c.Request.Context(), storeID, callerID)
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, res)
}
