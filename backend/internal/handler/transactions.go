package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/fidelis/api/internal/middleware"
	"github.com/fidelis/api/internal/service"
)

type TransactionsHandler struct {
	transactions *service.TransactionsService
}

func NewTransactionsHandler(t *service.TransactionsService) *TransactionsHandler {
	return &TransactionsHandler{transactions: t}
}

// GET /api/me/transactions?store_id=&limit=&offset=
// Extrato do proprio cliente. store_id opcional filtra por loja.
func (h *TransactionsHandler) ListMine(c *gin.Context) {
	callerID, ok := middleware.UserIDFromContext(c)
	if !ok {
		jsonError(c, http.StatusUnauthorized, "unauthenticated", "")
		return
	}

	var storeIDFilter *uuid.UUID
	if q := c.Query("store_id"); q != "" {
		parsed, err := uuid.Parse(q)
		if err != nil {
			jsonError(c, http.StatusBadRequest, "invalid_store_id", "ID de loja invalido")
			return
		}
		storeIDFilter = &parsed
	}

	rows, err := h.transactions.ListMine(c.Request.Context(), service.ListMineInput{
		CustomerID: callerID,
		StoreID:    storeIDFilter,
		Limit:      queryInt(c, "limit", 0),
		Offset:     queryInt(c, "offset", 0),
	})
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"transactions": rows})
}

// GET /api/stores/:id/transactions?type=&limit=&offset=
// Extrato da loja. Type opcional: purchase|redemption|adjustment|expiration|bonus.
func (h *TransactionsHandler) ListByStore(c *gin.Context) {
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

	var typeFilter *string
	if t := c.Query("type"); t != "" {
		if !isValidTxType(t) {
			jsonError(c, http.StatusBadRequest, "invalid_type", "Tipo de transacao invalido")
			return
		}
		typeFilter = &t
	}

	rows, err := h.transactions.ListByStore(c.Request.Context(), service.ListByStoreInput{
		StoreID:  storeID,
		CallerID: callerID,
		Type:     typeFilter,
		Limit:    queryInt(c, "limit", 0),
		Offset:   queryInt(c, "offset", 0),
	})
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"transactions": rows})
}

func queryInt(c *gin.Context, key string, fallback int) int {
	v := c.Query(key)
	if v == "" {
		return fallback
	}
	i, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return i
}

func isValidTxType(t string) bool {
	switch t {
	case "purchase", "redemption", "adjustment", "expiration", "bonus":
		return true
	}
	return false
}
