package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/fidelis/api/internal/service"
)

func jsonError(c *gin.Context, status int, code, msg string) {
	c.AbortWithStatusJSON(status, gin.H{"error": code, "message": msg})
}

// renderServiceError centraliza o mapeamento de erros da camada de servico
// para status HTTP. Todos os handlers devem usa-lo no caminho de erro.
func renderServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrInvalidCredentials):
		jsonError(c, http.StatusUnauthorized, "invalid_credentials", "Email ou senha invalidos")
	case errors.Is(err, service.ErrUserDisabled):
		jsonError(c, http.StatusForbidden, "user_disabled", "Usuario desabilitado")
	case errors.Is(err, service.ErrUserNotFound):
		jsonError(c, http.StatusNotFound, "user_not_found", "Usuario nao encontrado")
	case errors.Is(err, service.ErrStoreNotFound):
		jsonError(c, http.StatusNotFound, "store_not_found", "Loja nao encontrada")
	case errors.Is(err, service.ErrCustomerNotFound):
		jsonError(c, http.StatusNotFound, "customer_not_found", "Cliente nao encontrado")
	case errors.Is(err, service.ErrNotStoreMember):
		jsonError(c, http.StatusForbidden, "not_store_member", "Voce nao tem permissao nesta loja")
	case errors.Is(err, service.ErrInvalidPoints):
		jsonError(c, http.StatusBadRequest, "invalid_points", "Quantidade de pontos deve ser positiva")
	case errors.Is(err, service.ErrCustomerRoleMismatch):
		jsonError(c, http.StatusBadRequest, "invalid_customer", "O usuario informado nao e um cliente")

	// Resgate de recompensas
	case errors.Is(err, service.ErrRewardNotFound):
		jsonError(c, http.StatusNotFound, "reward_not_found", "Recompensa nao encontrada nesta loja")
	case errors.Is(err, service.ErrRewardUnavailable):
		jsonError(c, http.StatusBadRequest, "reward_unavailable", "Recompensa indisponivel (inativa ou fora da janela)")
	case errors.Is(err, service.ErrRewardOutOfStock):
		jsonError(c, http.StatusConflict, "reward_out_of_stock", "Recompensa sem estoque")
	case errors.Is(err, service.ErrInsufficientBalance):
		jsonError(c, http.StatusConflict, "insufficient_balance", "Saldo de pontos insuficiente")

	// Cadastro
	case errors.Is(err, service.ErrEmailTaken):
		jsonError(c, http.StatusConflict, "email_taken", "Este email ja esta cadastrado")
	case errors.Is(err, service.ErrSlugTaken):
		jsonError(c, http.StatusConflict, "slug_taken", "Este endereco de loja ja esta em uso")
	case errors.Is(err, service.ErrInvalidSlug):
		jsonError(c, http.StatusBadRequest, "invalid_slug", "Endereco invalido: use apenas letras minusculas, numeros e hifens")
	case errors.Is(err, service.ErrWeakPassword):
		jsonError(c, http.StatusBadRequest, "weak_password", "Senha precisa ter pelo menos 6 caracteres")
	case errors.Is(err, service.ErrInvalidInput):
		jsonError(c, http.StatusBadRequest, "invalid_input", "Dados invalidos")

	// Perfil
	case errors.Is(err, service.ErrPasswordIncorrect):
		jsonError(c, http.StatusUnauthorized, "password_incorrect", "Senha atual incorreta")

	default:
		jsonError(c, http.StatusInternalServerError, "internal_error", "Erro interno")
	}
}
