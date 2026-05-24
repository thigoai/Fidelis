package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/fidelis/api/internal/model"
	"github.com/fidelis/api/pkg/jwtauth"
)

// Chaves usadas no gin.Context para guardar identidade autenticada.
// Prefixadas com "fidelis." para evitar colisao com middlewares de terceiros.
const (
	ctxUserID = "fidelis.userID"
	ctxRole   = "fidelis.role"
)

// Auth e o middleware de autenticacao. Valida o JWT do header
// "Authorization: Bearer <token>" e popula userID + role no contexto.
func Auth(j *jwtauth.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.GetHeader("Authorization")
		if h == "" {
			abort(c, http.StatusUnauthorized, "missing_token", "Authorization header ausente")
			return
		}
		parts := strings.SplitN(h, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
			abort(c, http.StatusUnauthorized, "invalid_auth_format", "Esperado 'Bearer <token>'")
			return
		}
		claims, err := j.Parse(parts[1])
		if err != nil {
			switch {
			case errors.Is(err, jwtauth.ErrExpiredToken):
				abort(c, http.StatusUnauthorized, "token_expired", "Token expirado")
			default:
				abort(c, http.StatusUnauthorized, "invalid_token", "Token invalido")
			}
			return
		}
		c.Set(ctxUserID, claims.UserID)
		c.Set(ctxRole, claims.Role)
		c.Next()
	}
}

// RequireRole e o middleware de autorizacao. Use sempre apos Auth.
// Ex.: api.POST("/stores/:id/points", middleware.RequireRole(model.RoleLojista), handler.Award)
func RequireRole(roles ...model.UserRole) gin.HandlerFunc {
	allowed := make(map[model.UserRole]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}
	return func(c *gin.Context) {
		v, ok := c.Get(ctxRole)
		if !ok {
			abort(c, http.StatusUnauthorized, "unauthenticated", "Autenticacao requerida")
			return
		}
		role, _ := v.(model.UserRole)
		if _, ok := allowed[role]; !ok {
			abort(c, http.StatusForbidden, "forbidden_role", "Perfil sem permissao para esta acao")
			return
		}
		c.Next()
	}
}

// UserIDFromContext devolve o user.ID do JWT (false se nao houver auth no contexto).
func UserIDFromContext(c *gin.Context) (uuid.UUID, bool) {
	v, ok := c.Get(ctxUserID)
	if !ok {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}

// RoleFromContext devolve o user.Role do JWT.
func RoleFromContext(c *gin.Context) (model.UserRole, bool) {
	v, ok := c.Get(ctxRole)
	if !ok {
		return "", false
	}
	r, ok := v.(model.UserRole)
	return r, ok
}

func abort(c *gin.Context, status int, code, msg string) {
	c.AbortWithStatusJSON(status, gin.H{"error": code, "message": msg})
}
