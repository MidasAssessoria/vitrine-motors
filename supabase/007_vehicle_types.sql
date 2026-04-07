-- =============================================
-- 007: Multi-tipo de Veículos (Auto + Moto + Barco)
-- =============================================

-- 1. Adicionar vehicle_type na tabela listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS vehicle_type text DEFAULT 'auto';
ALTER TABLE listings ADD CONSTRAINT chk_vehicle_type CHECK (vehicle_type IN ('auto', 'moto', 'barco'));

-- 2. Adicionar vehicle_types (array) na tabela brands
ALTER TABLE brands ADD COLUMN IF NOT EXISTS vehicle_types text[] DEFAULT '{auto}';

-- 3. Adicionar vehicle_type na tabela models
ALTER TABLE models ADD COLUMN IF NOT EXISTS vehicle_type text DEFAULT 'auto';

-- 4. Expandir CHECK de category em listings (drop old + create new)
ALTER TABLE listings DROP CONSTRAINT IF EXISTS chk_category;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_category_check;
ALTER TABLE listings ADD CONSTRAINT chk_category CHECK (category IN (
  -- Auto
  'sedan', 'suv', 'pickup', 'hatchback', 'coupe', 'van', 'camion',
  -- Moto
  'scooter', 'street', 'sport', 'touring', 'adventure', 'custom', 'trail', 'cuatriciclo',
  -- Barco
  'lancha', 'velero', 'yate', 'jetski', 'bote', 'pesquero'
));

-- 5. Expandir CHECK de category em models
ALTER TABLE models DROP CONSTRAINT IF EXISTS chk_model_category;
ALTER TABLE models DROP CONSTRAINT IF EXISTS models_category_check;
ALTER TABLE models ADD CONSTRAINT chk_model_category CHECK (category IN (
  'sedan', 'suv', 'pickup', 'hatchback', 'coupe', 'van', 'camion',
  'scooter', 'street', 'sport', 'touring', 'adventure', 'custom', 'trail', 'cuatriciclo',
  'lancha', 'velero', 'yate', 'jetski', 'bote', 'pesquero'
));

-- 6. Campos específicos de MOTO em listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS engine_cc integer;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS brake_type text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS starter text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS cooling text;

ALTER TABLE listings ADD CONSTRAINT chk_starter CHECK (starter IS NULL OR starter IN ('electrica', 'kick', 'ambas'));
ALTER TABLE listings ADD CONSTRAINT chk_cooling CHECK (cooling IS NULL OR cooling IN ('aire', 'liquida'));

-- 7. Campos específicos de BARCO em listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS length_ft numeric(5,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS engine_hp integer;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS hours_used integer;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS hull_material text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS passenger_capacity integer;

ALTER TABLE listings ADD CONSTRAINT chk_hull_material CHECK (hull_material IS NULL OR hull_material IN ('fibra', 'aluminio', 'madera', 'inflable', 'acero'));

-- 8. Tornar doors e transmission NULLABLE (motos/barcos não têm)
-- (Essas colunas provavelmente já são nullable, mas garantimos)
ALTER TABLE listings ALTER COLUMN doors DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN transmission DROP NOT NULL;

-- 9. Expandir CHECK de fuel para incluir 2t (2 tempos - motos)
ALTER TABLE listings DROP CONSTRAINT IF EXISTS chk_fuel;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_fuel_check;
ALTER TABLE listings ADD CONSTRAINT chk_fuel CHECK (fuel IN ('nafta', 'diesel', 'hibrido', 'electrico', '2t'));

-- 10. Campos para "Otra marca"
ALTER TABLE listings ADD COLUMN IF NOT EXISTS custom_brand text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_custom_brand boolean DEFAULT false;

-- 11. Índices para performance
CREATE INDEX IF NOT EXISTS idx_listings_vehicle_type ON listings(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_brands_vehicle_types ON brands USING gin(vehicle_types);
CREATE INDEX IF NOT EXISTS idx_models_vehicle_type ON models(vehicle_type);

-- 12. Atualizar listings existentes
UPDATE listings SET vehicle_type = 'auto' WHERE vehicle_type IS NULL;

-- 13. Atualizar brands existentes (todas são de auto por padrão)
UPDATE brands SET vehicle_types = '{auto}' WHERE vehicle_types IS NULL;

-- 14. Atualizar models existentes
UPDATE models SET vehicle_type = 'auto' WHERE vehicle_type IS NULL;
