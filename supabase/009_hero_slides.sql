-- =============================================
-- 009: Hero Slides — Carrossel do Hero com Admin
-- =============================================

-- 1. Tabela hero_slides
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  desktop_url text NOT NULL,
  tablet_url text NOT NULL,
  mobile_url text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hero slides são públicos para leitura"
  ON public.hero_slides FOR SELECT USING (true);

CREATE POLICY "Admin gerencia hero slides"
  ON public.hero_slides FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON public.hero_slides(order_index);

-- 4. Storage bucket para banners do hero
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-banners', 'hero-banners', true)
ON CONFLICT DO NOTHING;

-- Qualquer um pode ver as imagens do hero
CREATE POLICY "Qualquer um pode ver hero banners"
  ON storage.objects FOR SELECT USING (bucket_id = 'hero-banners');

-- Apenas admin pode fazer upload
CREATE POLICY "Admin pode fazer upload de hero banners"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'hero-banners'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin pode atualizar (upsert)
CREATE POLICY "Admin pode atualizar hero banners"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'hero-banners'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin pode deletar
CREATE POLICY "Admin pode deletar hero banners"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'hero-banners'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
