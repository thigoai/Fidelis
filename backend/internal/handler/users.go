package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/fidelis/api/internal/middleware"
	"github.com/fidelis/api/internal/service"
)

type UsersHandler struct {
	users *service.UsersService
}

func NewUsersHandler(u *service.UsersService) *UsersHandler {
	return &UsersHandler{users: u}
}

// GET /api/me — perfil completo do caller
func (h *UsersHandler) GetMe(c *gin.Context) {
	userID, ok := middleware.UserIDFromContext(c)
	if !ok {
		jsonError(c, http.StatusUnauthorized, "unauthenticated", "")
		return
	}
	u, err := h.users.GetMe(c.Request.Context(), userID)
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, toUserPayload(u))
}

// PATCH /api/me — atualiza nome e telefone
type updateMeRequest struct {
	Name  string  `json:"name"             binding:"required,min=2"`
	Phone *string `json:"phone,omitempty"`
}

func (h *UsersHandler) UpdateMe(c *gin.Context) {
	userID, ok := middleware.UserIDFromContext(c)
	if !ok {
		jsonError(c, http.StatusUnauthorized, "unauthenticated", "")
		return
	}
	var req updateMeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	u, err := h.users.UpdateMe(c.Request.Context(), service.UpdateMeInput{
		UserID: userID,
		Name:   req.Name,
		Phone:  req.Phone,
	})
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, toUserPayload(u))
}

// POST /api/me/password — troca de senha
type changePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password"     binding:"required,min=6"`
}

func (h *UsersHandler) ChangePassword(c *gin.Context) {
	userID, ok := middleware.UserIDFromContext(c)
	if !ok {
		jsonError(c, http.StatusUnauthorized, "unauthenticated", "")
		return
	}
	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	if err := h.users.ChangePassword(c.Request.Context(), service.ChangePasswordInput{
		UserID:          userID,
		CurrentPassword: req.CurrentPassword,
		NewPassword:     req.NewPassword,
	}); err != nil {
		renderServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
