// Package email entrega mensagens transacionais.
// Duas implementacoes: SMTP real (producao) e Console (dev) — escolhida
// automaticamente conforme presenca de SMTP_HOST no config.
package email

import (
	"context"
	"fmt"
	"log"
	"net/smtp"
	"strings"
)

type Sender interface {
	Send(ctx context.Context, to, subject, body string) error
}

type Config struct {
	Host string
	Port string
	User string
	Pass string
	From string
}

// New devolve um Sender SMTP se Host configurado; senao um Console (loga no stdout).
func New(cfg Config) Sender {
	if cfg.Host == "" {
		log.Println("email: SMTP_HOST vazio — usando ConsoleSender (emails serao impressos no log)")
		return &ConsoleSender{from: cfg.From}
	}
	return &SMTPSender{cfg: cfg}
}

// ============================================================
// SMTP
// ============================================================

type SMTPSender struct {
	cfg Config
}

func (s *SMTPSender) Send(_ context.Context, to, subject, body string) error {
	auth := smtp.PlainAuth("", s.cfg.User, s.cfg.Pass, s.cfg.Host)
	msg := buildMessage(s.cfg.From, to, subject, body)
	addr := s.cfg.Host + ":" + s.cfg.Port
	return smtp.SendMail(addr, auth, extractEmail(s.cfg.From), []string{to}, msg)
}

// extractEmail extrai o endereco de "Nome <email@host>" se vier nesse formato.
func extractEmail(from string) string {
	if i := strings.LastIndex(from, "<"); i >= 0 {
		if j := strings.Index(from[i:], ">"); j > 0 {
			return from[i+1 : i+j]
		}
	}
	return from
}

func buildMessage(from, to, subject, body string) []byte {
	var b strings.Builder
	b.WriteString("From: " + from + "\r\n")
	b.WriteString("To: " + to + "\r\n")
	b.WriteString("Subject: " + subject + "\r\n")
	b.WriteString("MIME-Version: 1.0\r\n")
	b.WriteString("Content-Type: text/plain; charset=utf-8\r\n")
	b.WriteString("\r\n")
	b.WriteString(body)
	return []byte(b.String())
}

// ============================================================
// Console (dev/fallback)
// ============================================================

type ConsoleSender struct {
	from string
}

func (c *ConsoleSender) Send(_ context.Context, to, subject, body string) error {
	fmt.Println("\n========================= EMAIL (dev) =========================")
	fmt.Printf("From:    %s\n", c.from)
	fmt.Printf("To:      %s\n", to)
	fmt.Printf("Subject: %s\n", subject)
	fmt.Println("---------------------------------------------------------------")
	fmt.Println(body)
	fmt.Println("===============================================================")
	return nil
}
