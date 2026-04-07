-- =====================================================
-- VITRINEMOTORS - Subscription System
-- Sprint 4: Sistema de Assinaturas
-- =====================================================
-- Executar no SQL Editor do Supabase Dashboard

-- 1. Tabela de assinaturas dos sellers/dealers
CREATE TABLE IF NOT EXISTS seller_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'silver', 'gold', 'platinum')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_subscriptions_user ON seller_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_subscriptions_stripe ON seller_subscriptions(stripe_subscription_id);

-- 2. Tabela de features por tier
CREATE TABLE IF NOT EXISTS tier_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'silver', 'gold', 'platinum')),
  feature_key TEXT NOT NULL,
  feature_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tier, feature_key)
);

-- 3. Coluna subscription_tier na tabela profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'silver', 'gold', 'platinum'));

-- 4. Seed: features por tier
INSERT INTO tier_features (tier, feature_key, feature_value) VALUES
  -- FREE
  ('free', 'max_listings', '5'),
  ('free', 'max_photos', '10'),
  ('free', 'featured_per_month', '0'),
  ('free', 'search_weight', '0'),
  ('free', 'analytics', '"none"'),
  ('free', 'auto_bump', 'false'),
  ('free', 'crm', 'false'),
  ('free', 'team_management', 'false'),
  ('free', 'api_access', 'false'),
  ('free', 'badge', '""'),
  -- SILVER
  ('silver', 'max_listings', '25'),
  ('silver', 'max_photos', '15'),
  ('silver', 'featured_per_month', '2'),
  ('silver', 'search_weight', '10'),
  ('silver', 'analytics', '"basic"'),
  ('silver', 'auto_bump', '"weekly"'),
  ('silver', 'crm', 'false'),
  ('silver', 'team_management', 'false'),
  ('silver', 'api_access', 'false'),
  ('silver', 'badge', '"silver"'),
  -- GOLD
  ('gold', 'max_listings', '100'),
  ('gold', 'max_photos', '25'),
  ('gold', 'featured_per_month', '5'),
  ('gold', 'search_weight', '20'),
  ('gold', 'analytics', '"advanced"'),
  ('gold', 'auto_bump', '"daily"'),
  ('gold', 'crm', 'true'),
  ('gold', 'team_management', 'false'),
  ('gold', 'api_access', 'false'),
  ('gold', 'badge', '"gold"'),
  -- PLATINUM
  ('platinum', 'max_listings', '999999'),
  ('platinum', 'max_photos', '40'),
  ('platinum', 'featured_per_month', '999999'),
  ('platinum', 'search_weight', '30'),
  ('platinum', 'analytics', '"advanced_api"'),
  ('platinum', 'auto_bump', '"daily_priority"'),
  ('platinum', 'crm', 'true'),
  ('platinum', 'team_management', 'true'),
  ('platinum', 'api_access', 'true'),
  ('platinum', 'badge', '"platinum"')
ON CONFLICT (tier, feature_key) DO NOTHING;

-- 5. RLS
ALTER TABLE seller_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON seller_subscriptions
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role handles inserts/updates (via webhook)

ALTER TABLE tier_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tier_features_select_all" ON tier_features
  FOR SELECT USING (true);

CREATE POLICY "tier_features_admin_write" ON tier_features
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
