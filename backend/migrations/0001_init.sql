-- =========================================================================
-- Fidelis · Schema inicial
-- Convenções:
--   * IDs em UUID v4 (gen_random_uuid).
--   * Todos os timestamps em TIMESTAMPTZ.
--   * Soft delete via deleted_at em entidades primárias (users, stores).
--   * point_transactions é IMUTÁVEL (ledger): só INSERT, nunca UPDATE/DELETE.
--   * Saldo "vivo" do cliente em uma loja vive em memberships e é sustentado
--     por trigger sobre point_transactions. Isso impede divergência mesmo se
--     a aplicação tiver bug.
-- =========================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ====================== Tipos enumerados =================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('lojista', 'cliente', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE store_member_role AS ENUM ('owner', 'manager', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('purchase', 'redemption', 'adjustment', 'expiration', 'bonus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ====================== Tabela: users ====================================

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL,
    password_hash   TEXT NOT NULL,
    name            TEXT NOT NULL,
    phone           TEXT,
    role            user_role NOT NULL,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- email único case-insensitive entre usuários não deletados
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_active
    ON users (LOWER(email))
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_role
    ON users (role)
    WHERE deleted_at IS NULL;

-- ====================== Tabela: stores ===================================

CREATE TABLE IF NOT EXISTS stores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    logo_url        TEXT,
    primary_color   TEXT,
    address         TEXT,
    city            TEXT,
    state           TEXT,
    country         TEXT NOT NULL DEFAULT 'BR',
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_stores_slug
    ON stores (LOWER(slug))
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stores_active
    ON stores (active)
    WHERE deleted_at IS NULL;

-- ====================== Tabela: store_members ============================
-- Relaciona usuários (lojistas) com lojas. Suporta múltiplos donos/gerentes/staff.

CREATE TABLE IF NOT EXISTS store_members (
    store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            store_member_role NOT NULL DEFAULT 'owner',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (store_id, user_id)
);

-- "minhas lojas" (consulta pelo lado do usuário)
CREATE INDEX IF NOT EXISTS idx_store_members_user
    ON store_members (user_id);

-- ====================== Tabela: memberships ==============================
-- Saldo "vivo" do cliente em uma loja. Sustentado por trigger no ledger.

CREATE TABLE IF NOT EXISTS memberships (
    customer_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id            UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    points_balance      INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    lifetime_earned     INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
    lifetime_redeemed   INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_redeemed >= 0),
    joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (customer_user_id, store_id)
);

-- "quem são meus clientes" (lado da loja)
CREATE INDEX IF NOT EXISTS idx_memberships_store
    ON memberships (store_id);

-- ====================== Tabela: rewards ==================================

CREATE TABLE IF NOT EXISTS rewards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    image_url       TEXT,
    points_cost     INTEGER NOT NULL CHECK (points_cost > 0),
    stock           INTEGER CHECK (stock IS NULL OR stock >= 0),  -- NULL = ilimitado
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    starts_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_rewards_store
    ON rewards (store_id);

-- catálogo de recompensas ativas de uma loja (caso de uso quente do cliente)
CREATE INDEX IF NOT EXISTS idx_rewards_store_active
    ON rewards (store_id)
    WHERE active = TRUE;

-- ====================== Tabela: point_transactions (LEDGER) ==============
-- IMUTÁVEL. Reversões via uma nova linha com type='adjustment'.

CREATE TABLE IF NOT EXISTS point_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    store_id            UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    type                transaction_type NOT NULL,
    points              INTEGER NOT NULL CHECK (points <> 0),  -- + ganhou / - gastou
    purchase_amount     NUMERIC(12,2) CHECK (purchase_amount IS NULL OR purchase_amount >= 0),
    reward_id           UUID REFERENCES rewards(id) ON DELETE SET NULL,
    notes               TEXT,
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sinal coerente com o tipo
ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS chk_pt_points_sign;
ALTER TABLE point_transactions ADD CONSTRAINT chk_pt_points_sign CHECK (
       (type IN ('purchase', 'bonus')           AND points > 0)
    OR (type IN ('redemption', 'expiration')    AND points < 0)
    OR (type = 'adjustment')                                       -- pode ser + ou -
);

-- Resgate exige reward_id; outros tipos não
ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS chk_pt_redemption_reward;
ALTER TABLE point_transactions ADD CONSTRAINT chk_pt_redemption_reward CHECK (
       (type = 'redemption' AND reward_id IS NOT NULL)
    OR (type <> 'redemption')
);

-- Extrato do cliente em uma loja, mais recente primeiro
CREATE INDEX IF NOT EXISTS idx_pt_customer_store_time
    ON point_transactions (customer_user_id, store_id, created_at DESC);

-- Relatórios por loja
CREATE INDEX IF NOT EXISTS idx_pt_store_time
    ON point_transactions (store_id, created_at DESC);

-- Filtragem por tipo (para dashboards)
CREATE INDEX IF NOT EXISTS idx_pt_type
    ON point_transactions (type);

-- ====================== Funções e triggers ===============================

-- updated_at automático
CREATE OR REPLACE FUNCTION fidelis_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fidelis_set_updated_at();

DROP TRIGGER IF EXISTS trg_stores_updated_at ON stores;
CREATE TRIGGER trg_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION fidelis_set_updated_at();

DROP TRIGGER IF EXISTS trg_rewards_updated_at ON rewards;
CREATE TRIGGER trg_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION fidelis_set_updated_at();

-- Imutabilidade do ledger
CREATE OR REPLACE FUNCTION fidelis_block_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'point_transactions e imutavel: use uma transacao compensatoria (type=adjustment) em vez de UPDATE/DELETE';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pt_block_mutation ON point_transactions;
CREATE TRIGGER trg_pt_block_mutation BEFORE UPDATE OR DELETE ON point_transactions
    FOR EACH ROW EXECUTE FUNCTION fidelis_block_ledger_mutation();

-- Sincroniza memberships ao inserir no ledger.
-- Como points_balance tem CHECK >= 0, tentar resgatar mais do que o saldo
-- aborta a transação inteira automaticamente. Saldo nunca diverge do ledger.
CREATE OR REPLACE FUNCTION fidelis_apply_ledger_to_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO memberships (
        customer_user_id, store_id,
        points_balance,
        lifetime_earned, lifetime_redeemed,
        joined_at, last_activity_at
    ) VALUES (
        NEW.customer_user_id, NEW.store_id,
        NEW.points,
        GREATEST(NEW.points, 0),
        GREATEST(-NEW.points, 0),
        NEW.created_at, NEW.created_at
    )
    ON CONFLICT (customer_user_id, store_id) DO UPDATE
       SET points_balance    = memberships.points_balance + NEW.points,
           lifetime_earned   = memberships.lifetime_earned + GREATEST(NEW.points, 0),
           lifetime_redeemed = memberships.lifetime_redeemed + GREATEST(-NEW.points, 0),
           last_activity_at  = NEW.created_at;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pt_apply_balance ON point_transactions;
CREATE TRIGGER trg_pt_apply_balance AFTER INSERT ON point_transactions
    FOR EACH ROW EXECUTE FUNCTION fidelis_apply_ledger_to_membership();

COMMIT;
