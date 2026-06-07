package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/fidelis/api/internal/service"
)

type PasswordResetHandler struct {
	svc *service.PasswordResetService
}

func NewPasswordResetHandler(s *service.PasswordResetService) *PasswordResetHandler {
	return &PasswordResetHandler{svc: s}
}

// POST /auth/password-reset/request
// Sempre 204 — nao revela existencia de email.
type requestResetRequest struct {
	Email string `json:"email" binding:"required,email"`
}

func (h *PasswordResetHandler) Request(c *gin.Context) {
	var req requestResetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	if err := h.svc.RequestReset(c.Request.Context(), req.Email); err != nil {
		renderServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// POST /auth/password-reset/confirm
type confirmResetRequest struct {
	Token       string `json:"token"        binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

func (h *PasswordResetHandler) Confirm(c *gin.Context) {
	var req confirmResetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	if err := h.svc.ConfirmReset(c.Request.Context(), service.ConfirmResetInput{
		Token:       req.Token,
		NewPassword: req.NewPassword,
	}); err != nil {
		renderServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
