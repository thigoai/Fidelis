package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/fidelis/api/internal/model"
	"github.com/fidelis/api/internal/repository"
	"github.com/fidelis/api/pkg/email"
	"github.com/fidelis/api/pkg/password"
)

const (
	resetTokenTTL     = 1 * time.Hour
	resetTokenRandLen = 32 // bytes; 64 chars hex
)

type PasswordResetService struct {
	users         *repository.UserRepository
	tokens        *repository.PasswordResetRepository
	sender        email.Sender
	appURLLoja    string
	appURLCliente string
}

func NewPasswordResetService(
	users *repository.UserRepository,
	tokens *repository.PasswordResetRepository,
	sender email.Sender,
	appURLLoja, appURLCliente string,
) *PasswordResetService {
	return &PasswordResetService{
		users:         users,
		tokens:        tokens,
		sender:        sender,
		appURLLoja:    strings.TrimRight(appURLLoja, "/"),
		appURLCliente: strings.TrimRight(appURLCliente, "/"),
	}
}

// RequestReset emite token e dispara email. NAO retorna erro mesmo se o email
// nao existir — anti-enumeracao. O caller (handler) sempre devolve 204.
func (s *PasswordResetService) RequestReset(ctx context.Context, emailAddr string) error {
	emailAddr = strings.TrimSpace(strings.ToLower(emailAddr))
	if emailAddr == "" {
		return nil
	}

	u, err := s.users.FindByEmail(ctx, emailAddr)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			// Silencioso: nao vaza existencia. Loga internamente pra debug.
			log.Printf("password_reset: email nao cadastrado (%s)", emailAddr)
			return nil
		}
		return err
	}
	if !u.Active {
		log.Printf("password_reset: usuario inativo (%s)", emailAddr)
		return nil
	}

	rawToken, tokenHash, err := generateToken()
	if err != nil {
		return err
	}

	if err := s.tokens.Create(ctx, tokenHash, u.ID, time.Now().Add(resetTokenTTL)); err != nil {
		return err
	}

	link := s.buildResetLink(u.Role, rawToken)
	body := buildResetEmailBody(u.Name, link)
	if err := s.sender.Send(ctx, u.Email, "Recuperação de senha · Fidelis", body); err != nil {
		// Logamos mas nao bloqueamos: o token ja existe no DB; se SMTP falhar
		// temporariamente, o usuario pode pedir reset de novo.
		log.Printf("password_reset: falha ao enviar email para %s: %v", u.Email, err)
	}
	return nil
}

type ConfirmResetInput struct {
	Token       string
	NewPassword string
}

// ConfirmReset valida token, troca senha, marca token como usado.
// Token invalido/expirado/usado → ErrInvalidToken (sem detalhes).
func (s *PasswordResetService) ConfirmReset(ctx context.Context, in ConfirmResetInput) error {
	if len(in.NewPassword) < 6 {
		return ErrWeakPassword
	}
	if in.Token == "" {
		return ErrInvalidToken
	}

	tokenHash := hashToken(in.Token)
	t, err := s.tokens.Find(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrInvalidToken
		}
		return err
	}
	if t.UsedAt != nil || !t.ExpiresAt.After(time.Now()) {
		return ErrInvalidToken
	}

	// Marca como usado ANTES de trocar a senha. Se a marca falhar (corrida),
	// abortamos sem tocar na senha.
	ok, err := s.tokens.MarkUsed(ctx, tokenHash)
	if err != nil {
		return err
	}
	if !ok {
		return ErrInvalidToken
	}

	newHash, err := password.Hash(in.NewPassword)
	if err != nil {
		return err
	}
	return s.users.UpdatePassword(ctx, t.UserID, newHash)
}

// ============================================================
// Helpers
// ============================================================

func generateToken() (raw, hash string, err error) {
	b := make([]byte, resetTokenRandLen)
	if _, err := rand.Read(b); err != nil {
		return "", "", fmt.Errorf("gerar token aleatorio: %w", err)
	}
	raw = hex.EncodeToString(b)
	hash = hashToken(raw)
	return raw, hash, nil
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func (s *PasswordResetService) buildResetLink(role model.UserRole, token string) string {
	base := s.appURLCliente
	if role == model.RoleLojista || role == model.RoleAdmin {
		base = s.appURLLoja
	}
	return base + "/reset-senha?token=" + token
}

func buildResetEmailBody(name, link string) string {
	var b strings.Builder
	b.WriteString("Olá, ")
	b.WriteString(name)
	b.WriteString(".\n\n")
	b.WriteString("Recebemos um pedido para trocar sua senha no Fidelis.\n\n")
	b.WriteString("Clique no link abaixo para definir uma nova senha (válido por 1 hora):\n\n")
	b.WriteString(link)
	b.WriteString("\n\n")
	b.WriteString("Se você não fez esse pedido, pode ignorar este email — sua senha continua a mesma.\n\n")
	b.WriteString("— Equipe Fidelis\n")
	return b.String()
}
