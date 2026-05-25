-- =========================================================================
-- Fidelis · Tokens de recuperacao de senha
-- token_hash = SHA-256 do token enviado por email (nunca armazenamos o plain).
-- Single-use: marca used_at quando consumido; tentativas posteriores falham.
-- =========================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash  CHAR(64) PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user
    ON password_reset_tokens (user_id);

-- Limpeza opcional: indice parcial pra varrer expirados rapido.
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires
    ON password_reset_tokens (expires_at)
    WHERE used_at IS NULL;
