package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/fidelis/api/internal/model"
	"github.com/fidelis/api/internal/service"
)

type AuthHandler struct {
	auth         *service.AuthService
	registration *service.RegistrationService
}

func NewAuthHandler(auth *service.AuthService, registration *service.RegistrationService) *AuthHandler {
	return &AuthHandler{auth: auth, registration: registration}
}

// ===== Payloads compartilhados =====

type userPayload struct {
	ID    string  `json:"id"`
	Email string  `json:"email"`
	Name  string  `json:"name"`
	Phone *string `json:"phone,omitempty"`
	Role  string  `json:"role"`
}

type storePayload struct {
	ID           string  `json:"id"`
	Slug         string  `json:"slug"`
	Name         string  `json:"name"`
	PrimaryColor *string `json:"primary_color,omitempty"`
}

type authResponse struct {
	Token     string        `json:"token"`
	ExpiresAt time.Time     `json:"expires_at"`
	User      userPayload   `json:"user"`
	Store     *storePayload `json:"store,omitempty"`
}

func toUserPayload(u *model.User) userPayload {
	return userPayload{
		ID:    u.ID.String(),
		Email: u.Email,
		Name:  u.Name,
		Phone: u.Phone,
		Role:  string(u.Role),
	}
}

func toStorePayload(s *model.Store) *storePayload {
	if s == nil {
		return nil
	}
	return &storePayload{
		ID:           s.ID.String(),
		Slug:         s.Slug,
		Name:         s.Name,
		PrimaryColor: s.PrimaryColor,
	}
}

// ===== POST /auth/login =====

type loginRequest struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	res, err := h.auth.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, authResponse{
		Token:     res.Token,
		ExpiresAt: res.ExpiresAt,
		User:      toUserPayload(res.User),
	})
}

// ===== POST /auth/register/cliente =====

type registerClienteRequest struct {
	Name     string  `json:"name"             binding:"required,min=2"`
	Email    string  `json:"email"            binding:"required,email"`
	Password string  `json:"password"         binding:"required,min=6"`
	Phone    *string `json:"phone,omitempty"`
}

func (h *AuthHandler) RegisterCliente(c *gin.Context) {
	var req registerClienteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	res, err := h.registration.RegisterCliente(c.Request.Context(), service.RegisterClienteInput{
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password,
		Phone:    req.Phone,
	})
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, authResponse{
		Token:     res.Token,
		ExpiresAt: res.ExpiresAt,
		User:      toUserPayload(res.User),
	})
}

// ===== POST /auth/register/lojista =====

type ownerData struct {
	Name     string  `json:"name"             binding:"required,min=2"`
	Email    string  `json:"email"            binding:"required,email"`
	Password string  `json:"password"         binding:"required,min=6"`
	Phone    *string `json:"phone,omitempty"`
}

type storeData struct {
	Slug         string  `json:"slug"                    binding:"required,min=3,max=50"`
	Name         string  `json:"name"                    binding:"required,min=2"`
	PrimaryColor *string `json:"primary_color,omitempty"`
	City         *string `json:"city,omitempty"`
	State        *string `json:"state,omitempty"`
}

type registerLojistaRequest struct {
	Owner ownerData `json:"owner" binding:"required"`
	Store storeData `json:"store" binding:"required"`
}

func (h *AuthHandler) RegisterLojista(c *gin.Context) {
	var req registerLojistaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		jsonError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	res, err := h.registration.RegisterLojista(c.Request.Context(), service.RegisterLojistaInput{
		OwnerName:         req.Owner.Name,
		OwnerEmail:        req.Owner.Email,
		OwnerPassword:     req.Owner.Password,
		OwnerPhone:        req.Owner.Phone,
		StoreSlug:         req.Store.Slug,
		StoreName:         req.Store.Name,
		StorePrimaryColor: req.Store.PrimaryColor,
		StoreCity:         req.Store.City,
		StoreState:        req.Store.State,
	})
	if err != nil {
		renderServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, authResponse{
		Token:     res.Token,
		ExpiresAt: res.ExpiresAt,
		User:      toUserPayload(res.User),
		Store:     toStorePayload(res.Store),
	})
}
