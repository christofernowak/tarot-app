-- migrations/001_initial_schema.sql
-- Segurança: UUIDs como IDs públicos (previne enumeration attacks)
-- Segurança: RLS deve ser habilitado via Supabase ou comandos separados

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Usuários ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL UNIQUE,
  -- Segurança: password_hash armazena hash bcrypt, NUNCA a senha em texto claro
  password_hash VARCHAR(255),
  name        VARCHAR(255),
  birth_date  DATE,
  birth_time  TIME,
  birth_city  VARCHAR(255),
  sun_sign    VARCHAR(50),
  moon_sign   VARCHAR(50),
  rising_sign VARCHAR(50),
  -- Segurança: role no banco, não hardcoded no código
  role        VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan        VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  stripe_customer_id VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Assinaturas ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_price_id       VARCHAR(255),
  status                VARCHAR(50) NOT NULL,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Leituras ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS readings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spread_type         VARCHAR(50) NOT NULL,
  focus_area          VARCHAR(50),
  -- Segurança: cards_json validado antes de inserir (via Zod no app)
  cards_json          JSONB NOT NULL,
  interpretation_text TEXT,
  title               VARCHAR(255),
  keywords            TEXT[],
  advice              TEXT,
  is_favorite         BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Uso mensal (controle de limite gratuito) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year_month  VARCHAR(7) NOT NULL, -- formato: '2024-01'
  reading_count INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, year_month)
);

-- ── Índices de performance ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_readings_user_id ON readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_created_at ON readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_usage_lookup ON monthly_usage(user_id, year_month);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- ── Trigger: atualiza updated_at automaticamente ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS (Row Level Security) — habilitar se usar Supabase ────────────────────
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE monthly_usage ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "users_own_data" ON users FOR ALL USING (auth.uid() = id);
-- CREATE POLICY "readings_own_data" ON readings FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "subscriptions_own_data" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "usage_own_data" ON monthly_usage FOR ALL USING (auth.uid() = user_id);
