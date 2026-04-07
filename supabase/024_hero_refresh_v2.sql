-- ============================================================
-- 024_hero_refresh_v2.sql
-- Atualiza URLs dos banners do hero para a versão refinada (v2)
-- O ?v=2 força o browser a não usar cache da versão anterior
-- ============================================================

UPDATE hero_slides
SET
  desktop_url = '/images/hero/banner-carros-desktop.webp?v=2',
  tablet_url  = '/images/hero/banner-carros-desktop.webp?v=2',
  mobile_url  = '/images/hero/banner-tucson-mobile.webp?v=2',
  updated_at  = now()
WHERE order_index = 0;

UPDATE hero_slides
SET
  desktop_url = '/images/hero/banner-luxury-desktop.webp?v=2',
  tablet_url  = '/images/hero/banner-luxury-desktop.webp?v=2',
  mobile_url  = '/images/hero/banner-tucson-mobile.webp?v=2',
  updated_at  = now()
WHERE order_index = 1;
