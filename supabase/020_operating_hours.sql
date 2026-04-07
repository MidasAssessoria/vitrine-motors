-- ─── Migration 020: Horário de funcionamento das concessionárias ───
-- Cole no SQL Editor do Supabase Dashboard

-- Adicionar coluna JSONB para horário de funcionamento
ALTER TABLE public.dealerships
  ADD COLUMN IF NOT EXISTS operating_hours jsonb DEFAULT NULL;

-- Adicionar colunas de contato e descrição que faltam no schema base
ALTER TABLE public.dealerships
  ADD COLUMN IF NOT EXISTS description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp text DEFAULT '',
  ADD COLUMN IF NOT EXISTS website text DEFAULT '',
  ADD COLUMN IF NOT EXISTS ruc text DEFAULT '';

-- Estrutura esperada do campo operating_hours:
-- {
--   "lunes":    { "open": "08:00", "close": "18:00", "closed": false },
--   "martes":   { "open": "08:00", "close": "18:00", "closed": false },
--   "miercoles":{ "open": "08:00", "close": "18:00", "closed": false },
--   "jueves":   { "open": "08:00", "close": "18:00", "closed": false },
--   "viernes":  { "open": "08:00", "close": "18:00", "closed": false },
--   "sabado":   { "open": "09:00", "close": "13:00", "closed": false },
--   "domingo":  { "open": null,    "close": null,    "closed": true  }
-- }

-- Atualizar política de update do dono para incluir o novo campo
-- (a política existente "Dono edita própria concessionária" já cobre isso)
