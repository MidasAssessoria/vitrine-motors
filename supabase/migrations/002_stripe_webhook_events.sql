-- =====================================================
-- VITRINEMOTORS - Stripe Webhook Idempotency
-- Sprint 2: Stripe Webhook Handler
-- =====================================================
-- Executar no SQL Editor do Supabase Dashboard

-- Tabela para garantir que webhooks duplicados nao sejam processados
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para busca rapida por event_id
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id
  ON stripe_webhook_events(stripe_event_id);

-- Coluna webhook_verified na tabela de pagamentos
ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS webhook_verified BOOLEAN DEFAULT FALSE;

-- RLS para stripe_webhook_events (somente admin pode ler, service_role escreve)
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_events_admin_only" ON stripe_webhook_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Limpar eventos antigos automaticamente (mais de 90 dias)
-- Pode ser executado via cron job do Supabase
-- DELETE FROM stripe_webhook_events WHERE created_at < NOW() - INTERVAL '90 days';
