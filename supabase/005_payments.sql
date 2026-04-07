-- ============================================
-- VitrineMOTORS — Migration 005: Payments
-- Tabela de transações para Stripe
-- Cole no SQL Editor do Supabase Dashboard
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  boost_purchase_id uuid REFERENCES public.boost_purchases(id) ON DELETE SET NULL,
  stripe_session_id text UNIQUE,
  stripe_payment_intent text,
  amount_usd numeric(8,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_read_own" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payment_admin" ON public.payment_transactions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON public.payment_transactions(stripe_session_id);
