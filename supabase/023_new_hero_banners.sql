-- ============================================================
-- 023_new_hero_banners.sql
-- Substitui os banners do hero por novos (WebP, sem texto queimado)
-- Garante colunas de texto overlay (caso 022 não tenha sido rodada)
-- ============================================================

-- 1. Garante colunas de overlay (idempotente)
ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS subtitle   text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cta_label  text NOT NULL DEFAULT 'Ver ofertas',
  ADD COLUMN IF NOT EXISTS cta_url    text NOT NULL DEFAULT '/autos',
  ADD COLUMN IF NOT EXISTS text_theme text NOT NULL DEFAULT 'dark'
    CHECK (text_theme IN ('dark', 'light'));

-- 2. Remove todos os slides antigos
TRUNCATE TABLE hero_slides;

-- 3. Insere os 2 novos slides com os banners gerados
INSERT INTO hero_slides
  (id, title, subtitle, cta_label, cta_url, text_theme,
   desktop_url, tablet_url, mobile_url, order_index, active)
VALUES
  (
    gen_random_uuid(),
    'Encontrá tu Auto Ideal',
    'SUVs · Pickups · Sedanes — los mejores precios de Paraguay',
    'Explorar Inventario',
    '/autos',
    'light',
    '/images/hero/banner-carros-desktop.webp',
    '/images/hero/banner-carros-desktop.webp',
    '/images/hero/banner-tucson-mobile.webp',
    0,
    true
  ),
  (
    gen_random_uuid(),
    'Vehículos de Lujo y Potencia',
    'Pickups, SUVs y sedanes premium con financiación exclusiva',
    'Ver Vehículos',
    '/autos',
    'light',
    '/images/hero/banner-luxury-desktop.webp',
    '/images/hero/banner-luxury-desktop.webp',
    '/images/hero/banner-tucson-mobile.webp',
    1,
    true
  );
