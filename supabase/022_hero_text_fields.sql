-- ============================================================
-- 022_hero_text_fields.sql
-- Adiciona campos de texto ao hero_slides para que o texto
-- seja renderizado como overlay HTML (não queimado na imagem)
-- ============================================================

ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS subtitle      text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cta_label     text    NOT NULL DEFAULT 'Ver ofertas',
  ADD COLUMN IF NOT EXISTS cta_url       text    NOT NULL DEFAULT '/autos',
  ADD COLUMN IF NOT EXISTS text_theme    text    NOT NULL DEFAULT 'dark'
    CHECK (text_theme IN ('dark', 'light'));

-- ============================================================
-- Textos por banner (baseado nos IDs reais do banco)
-- ============================================================

-- Banner 1: fundo claro/cream + wave lines + VW Tiguan laranja
-- text_theme 'dark' = texto preto sobre fundo claro
UPDATE hero_slides SET
  title      = 'Tu Próximo SUV está Aquí',
  subtitle   = 'Financiación exclusiva en cuotas fijas',
  cta_label  = 'Explorar Modelos',
  cta_url    = '/autos',
  text_theme = 'dark'
WHERE id = 'b3dbdd66-8499-429b-9824-5a3b92291f1e';

-- Banner 2: fundo escuro/preto + carro dark
-- text_theme 'light' = texto branco sobre fundo escuro
UPDATE hero_slides SET
  title      = 'El Marketplace #1 de Paraguay',
  subtitle   = 'Comprá y vendé autos, motos y barcos de forma rápida y segura',
  cta_label  = 'Ver Vehículos',
  cta_url    = '/autos',
  text_theme = 'light'
WHERE id = 'a3d7da21-bea3-452c-a2c7-5757a3aceae2';

-- Banner 3: fundo claro + VW Tiguan limpo (sem texto na imagem)
-- text_theme 'dark' = texto preto sobre fundo claro
UPDATE hero_slides SET
  title      = 'Encontrá tu Próximo Auto',
  subtitle   = 'Miles de vehículos nuevos y usados en todo Paraguay',
  cta_label  = 'Buscar Autos',
  cta_url    = '/autos',
  text_theme = 'dark'
WHERE id = '66391c66-d1b6-4f34-b894-f4ef506c5412';
