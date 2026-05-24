package service

import "errors"

// Erros canonicos da camada de servico. Os handlers HTTP devem mapea-los para
// status codes via renderServiceError.
var (
	ErrInvalidCredentials   = errors.New("invalid credentials")
	ErrUserDisabled         = errors.New("user disabled")
	ErrUserNotFound         = errors.New("user not found")
	ErrStoreNotFound        = errors.New("store not found")
	ErrCustomerNotFound     = errors.New("customer not found")
	ErrNotStoreMember       = errors.New("not a store member")
	ErrInvalidPoints        = errors.New("invalid points")
	ErrCustomerRoleMismatch = errors.New("target user is not a customer")

	// Resgate de recompensas
	ErrRewardNotFound      = errors.New("reward not found")
	ErrRewardUnavailable   = errors.New("reward unavailable")
	ErrRewardOutOfStock    = errors.New("reward out of stock")
	ErrInsufficientBalance = errors.New("insufficient balance")

	// Cadastro de novos usuarios
	ErrEmailTaken   = errors.New("email already registered")
	ErrSlugTaken    = errors.New("store slug already taken")
	ErrInvalidSlug  = errors.New("invalid slug format")
	ErrWeakPassword = errors.New("password too weak")
	ErrInvalidInput = errors.New("invalid input")

	// Perfil
	ErrPasswordIncorrect = errors.New("current password incorrect")
)
