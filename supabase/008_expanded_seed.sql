-- =============================================
-- 008: Seed Expandido — Marcas Chinesas + Motos + Barcos
-- =============================================

-- ─── 1. MARCAS CHINESAS DE AUTO ───

INSERT INTO brands (id, name, logo_url, country, vehicle_types) VALUES
  (gen_random_uuid(), 'BYD', '', 'China', '{auto}'),
  (gen_random_uuid(), 'Chery', '', 'China', '{auto}'),
  (gen_random_uuid(), 'JAC', '', 'China', '{auto}'),
  (gen_random_uuid(), 'Jetour', '', 'China', '{auto}'),
  (gen_random_uuid(), 'Changan', '', 'China', '{auto}'),
  (gen_random_uuid(), 'Great Wall', '', 'China', '{auto}'),
  (gen_random_uuid(), 'Haval', '', 'China', '{auto}'),
  (gen_random_uuid(), 'Geely', '', 'China', '{auto}'),
  (gen_random_uuid(), 'DFSK', '', 'China', '{auto}'),
  (gen_random_uuid(), 'Foton', '', 'China', '{auto}'),
  (gen_random_uuid(), 'MG', '', 'Reino Unido/China', '{auto}'),
  (gen_random_uuid(), 'Omoda', '', 'China', '{auto}')
ON CONFLICT (name) DO UPDATE SET vehicle_types = EXCLUDED.vehicle_types;

-- Modelos BYD
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='BYD'), 'Dolphin', 'hatchback', 'auto', 2022),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='BYD'), 'Seal', 'sedan', 'auto', 2023),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='BYD'), 'Yuan Plus', 'suv', 'auto', 2022),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='BYD'), 'Song Plus DM-i', 'suv', 'auto', 2021),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='BYD'), 'Han', 'sedan', 'auto', 2020),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='BYD'), 'Tang', 'suv', 'auto', 2018)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Modelos Chery
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Chery'), 'Tiggo 2', 'suv', 'auto', 2017),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Chery'), 'Tiggo 4', 'suv', 'auto', 2019),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Chery'), 'Tiggo 7', 'suv', 'auto', 2020),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Chery'), 'Tiggo 8', 'suv', 'auto', 2019),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Chery'), 'Arrizo 5', 'sedan', 'auto', 2016)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Modelos JAC
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='JAC'), 'JS4', 'suv', 'auto', 2020),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='JAC'), 'E JS4', 'suv', 'auto', 2021),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='JAC'), 'S4', 'suv', 'auto', 2019),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='JAC'), 'T8', 'pickup', 'auto', 2018)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Modelos Jetour
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Jetour'), 'X70', 'suv', 'auto', 2018),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Jetour'), 'Dashing', 'suv', 'auto', 2022),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Jetour'), 'T2', 'suv', 'auto', 2023)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Modelos Changan
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Changan'), 'CS55 Plus', 'suv', 'auto', 2019),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Changan'), 'CS75 Plus', 'suv', 'auto', 2020),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Changan'), 'Alsvin', 'sedan', 'auto', 2018)
ON CONFLICT (brand_id, name) DO NOTHING;

-- ─── 2. INSERIR MARCAS QUE PODEM NÃO EXISTIR NO SEED ORIGINAL ───
-- (O seed original só tem 15 marcas: Toyota, VW, Honda, Ford, Chevrolet, Nissan,
--  Hyundai, Kia, Mitsubishi, Renault, Fiat, BMW, Mercedes-Benz, Audi, Jeep)
-- Precisamos garantir que Yamaha, Suzuki, Kawasaki existam antes de referenciar

INSERT INTO brands (id, name, logo_url, country, vehicle_types) VALUES
  (gen_random_uuid(), 'Yamaha', '', 'Japón', '{auto,moto,barco}'),
  (gen_random_uuid(), 'Suzuki', '', 'Japón', '{auto,moto}'),
  (gen_random_uuid(), 'Kawasaki', '', 'Japón', '{auto,moto}'),
  (gen_random_uuid(), 'Peugeot', '', 'Francia', '{auto}'),
  (gen_random_uuid(), 'Citroën', '', 'Francia', '{auto}'),
  (gen_random_uuid(), 'Land Rover', '', 'Reino Unido', '{auto}'),
  (gen_random_uuid(), 'Subaru', '', 'Japón', '{auto}'),
  (gen_random_uuid(), 'Mazda', '', 'Japón', '{auto}'),
  (gen_random_uuid(), 'Volvo', '', 'Suecia', '{auto}')
ON CONFLICT (name) DO UPDATE SET vehicle_types = EXCLUDED.vehicle_types;

-- Atualizar marcas que já existiam para incluir moto
UPDATE brands SET vehicle_types = '{auto,moto}' WHERE name IN ('Honda', 'BMW') AND NOT (vehicle_types @> '{moto}');

-- ─── 3. MARCAS DE MOTO (novas) ───

INSERT INTO brands (id, name, logo_url, country, vehicle_types) VALUES
  (gen_random_uuid(), 'KTM', '', 'Austria', '{moto}'),
  (gen_random_uuid(), 'Kymco', '', 'Taiwán', '{moto}'),
  (gen_random_uuid(), 'Zanella', '', 'Argentina', '{moto}'),
  (gen_random_uuid(), 'Motomel', '', 'Argentina', '{moto}'),
  (gen_random_uuid(), 'Benelli', '', 'Italia', '{moto}'),
  (gen_random_uuid(), 'TVS', '', 'India', '{moto}'),
  (gen_random_uuid(), 'Bajaj', '', 'India', '{moto}'),
  (gen_random_uuid(), 'Royal Enfield', '', 'India', '{moto}'),
  (gen_random_uuid(), 'Ducati', '', 'Italia', '{moto}'),
  (gen_random_uuid(), 'Harley-Davidson', '', 'Estados Unidos', '{moto}')
ON CONFLICT (name) DO UPDATE SET vehicle_types = EXCLUDED.vehicle_types;

-- Modelos Honda Moto
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Honda'), 'CG 150 Titan', 'street', 'moto', 2004),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Honda'), 'XR 150 Rally', 'trail', 'moto', 2015),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Honda'), 'Wave 110', 'street', 'moto', 2010),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Honda'), 'CB 250 Twister', 'street', 'moto', 2016),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Honda'), 'Africa Twin 1100', 'adventure', 'moto', 2020),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Honda'), 'PCX 150', 'scooter', 'moto', 2018),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Honda'), 'CBR 600RR', 'sport', 'moto', 2003)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Modelos Yamaha Moto
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Yamaha'), 'FZ 25', 'street', 'moto', 2017),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Yamaha'), 'MT-03', 'street', 'moto', 2015),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Yamaha'), 'YBR 125', 'street', 'moto', 2005),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Yamaha'), 'XTZ 250 Tenere', 'adventure', 'moto', 2014),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Yamaha'), 'NMAX 155', 'scooter', 'moto', 2015),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Yamaha'), 'R3', 'sport', 'moto', 2015)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Modelos KTM
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='KTM'), 'Duke 200', 'street', 'moto', 2012),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='KTM'), 'Duke 390', 'street', 'moto', 2013),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='KTM'), 'Adventure 390', 'adventure', 'moto', 2020),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='KTM'), 'RC 390', 'sport', 'moto', 2014)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Modelos Bajaj
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Bajaj'), 'Pulsar NS200', 'street', 'moto', 2012),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Bajaj'), 'Dominar 400', 'touring', 'moto', 2017),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Bajaj'), 'Pulsar 150', 'street', 'moto', 2001)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Modelos Benelli
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Benelli'), 'TNT 300', 'street', 'moto', 2014),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Benelli'), 'TRK 502', 'adventure', 'moto', 2017),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Benelli'), 'Leoncino 250', 'street', 'moto', 2018),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Benelli'), 'Imperiale 400', 'custom', 'moto', 2019)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Modelos TVS
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='TVS'), 'Apache 200', 'sport', 'moto', 2016),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='TVS'), 'Ntorq 125', 'scooter', 'moto', 2018),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='TVS'), 'Raider 125', 'street', 'moto', 2021)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Modelos Royal Enfield
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Royal Enfield'), 'Classic 350', 'custom', 'moto', 2009),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Royal Enfield'), 'Himalayan', 'adventure', 'moto', 2016),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Royal Enfield'), 'Meteor 350', 'touring', 'moto', 2020)
ON CONFLICT (brand_id, name) DO NOTHING;

-- ─── 4. MARCAS DE BARCO ───

INSERT INTO brands (id, name, logo_url, country, vehicle_types) VALUES
  (gen_random_uuid(), 'Mercury', '', 'Estados Unidos', '{barco}'),
  (gen_random_uuid(), 'Bayliner', '', 'Estados Unidos', '{barco}'),
  (gen_random_uuid(), 'Sea-Doo', '', 'Canadá', '{barco}'),
  (gen_random_uuid(), 'Quicksilver', '', 'Estados Unidos', '{barco}'),
  (gen_random_uuid(), 'Tracker', '', 'Estados Unidos', '{barco}'),
  (gen_random_uuid(), 'Regnicoli', '', 'Argentina', '{barco}')
ON CONFLICT (name) DO UPDATE SET vehicle_types = EXCLUDED.vehicle_types;

-- Modelos Yamaha Barco
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Yamaha'), 'WaveRunner EX', 'jetski', 'barco', 2017),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Yamaha'), 'WaveRunner VX', 'jetski', 'barco', 2015),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Yamaha'), 'AR210', 'lancha', 'barco', 2019)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Modelos Sea-Doo
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Sea-Doo'), 'Spark', 'jetski', 'barco', 2014),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Sea-Doo'), 'GTI SE', 'jetski', 'barco', 2010),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Sea-Doo'), 'GTX Limited', 'jetski', 'barco', 2015),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Sea-Doo'), 'Wake Pro', 'jetski', 'barco', 2018)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Modelos Bayliner
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Bayliner'), 'Element E18', 'lancha', 'barco', 2016),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Bayliner'), 'VR5', 'lancha', 'barco', 2018),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Bayliner'), 'Trophy T22CX', 'pesquero', 'barco', 2020)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Modelos Tracker
INSERT INTO models (id, brand_id, name, category, vehicle_type, year_start) VALUES
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Tracker'), 'Pro Team 175', 'pesquero', 'barco', 2015),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Tracker'), 'Bass Tracker Classic', 'pesquero', 'barco', 2010),
  (gen_random_uuid(), (SELECT id FROM brands WHERE name='Tracker'), 'Targa V-18', 'pesquero', 'barco', 2018)
ON CONFLICT (brand_id, name) DO NOTHING;
