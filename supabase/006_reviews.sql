-- ============================================
-- VitrineMOTORS — Migration 006: Reviews
-- Sistema de avaliações de dealers
-- Cole no SQL Editor do Supabase Dashboard
-- ============================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler reviews
CREATE POLICY "reviews_read" ON public.reviews FOR SELECT USING (true);

-- Usuário autenticado pode criar review
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuário pode editar próprio review
CREATE POLICY "reviews_update" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuário pode deletar próprio review
CREATE POLICY "reviews_delete" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Admin gerencia tudo
CREATE POLICY "reviews_admin" ON public.reviews
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_reviews_dealer ON public.reviews(dealer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Unique: 1 review por usuário por dealer
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_user_dealer ON public.reviews(user_id, dealer_id);
