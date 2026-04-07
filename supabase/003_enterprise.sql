-- ============================================
-- VitrineMOTORS — Migration 003: Enterprise
-- Catálogo Brand>Model>Trim + Gold Engine + Expand listings/leads
-- Cole no SQL Editor do Supabase Dashboard
-- ============================================

-- ═══════════════════════════════════════════
-- CATÁLOGO VEICULAR (Brand > Model > Trim)
-- ═══════════════════════════════════════════

create table if not exists public.brands (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  logo_url text default '',
  country text default ''
);

create table if not exists public.models (
  id uuid primary key default uuid_generate_v4(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  category text check (category in ('sedan','suv','pickup','hatchback','coupe','van','camion')),
  year_start int,
  year_end int,
  unique(brand_id, name)
);

create table if not exists public.trims (
  id uuid primary key default uuid_generate_v4(),
  model_id uuid not null references public.models(id) on delete cascade,
  name text not null,
  engine_cc int,
  horsepower int,
  fuel text check (fuel in ('nafta','diesel','hibrido','electrico')),
  transmission text check (transmission in ('manual','automatico','cvt')),
  doors int default 4,
  unique(model_id, name)
);

-- RLS catálogo: leitura pública, admin gerencia
alter table public.brands enable row level security;
alter table public.models enable row level security;
alter table public.trims enable row level security;

create policy "brands_read" on public.brands for select using (true);
create policy "brands_admin" on public.brands for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "models_read" on public.models for select using (true);
create policy "models_admin" on public.models for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "trims_read" on public.trims for select using (true);
create policy "trims_admin" on public.trims for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create index if not exists idx_models_brand on public.models(brand_id);
create index if not exists idx_trims_model on public.trims(model_id);

-- ═══════════════════════════════════════════
-- GOLD ENGINE (Boost packages + purchases)
-- ═══════════════════════════════════════════

create table if not exists public.boost_packages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  tier text not null check (tier in ('gold','silver')),
  price_usd numeric(8,2) not null,
  duration_days int not null,
  weight int not null,
  auto_bump boolean default false,
  max_photos int default 20,
  badge_label text default '',
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.boost_purchases (
  id uuid primary key default uuid_generate_v4(),
  dealer_id uuid references public.dealerships(id) on delete set null,
  package_id uuid not null references public.boost_packages(id),
  listing_id uuid not null references public.listings(id) on delete cascade,
  credits_used int default 0,
  activated_at timestamptz default now(),
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.boost_packages enable row level security;
alter table public.boost_purchases enable row level security;

create policy "boost_pkg_read" on public.boost_packages for select using (true);
create policy "boost_pkg_admin" on public.boost_packages for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "boost_purch_read" on public.boost_purchases for select using (dealer_id in (select id from public.dealerships where owner_id = auth.uid()));
create policy "boost_purch_insert" on public.boost_purchases for insert with check (dealer_id in (select id from public.dealerships where owner_id = auth.uid()));
create policy "boost_purch_admin" on public.boost_purchases for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create index if not exists idx_boost_purch_dealer on public.boost_purchases(dealer_id);
create index if not exists idx_boost_purch_listing on public.boost_purchases(listing_id);
create index if not exists idx_boost_purch_expires on public.boost_purchases(expires_at);

-- ═══════════════════════════════════════════
-- EXPAND LISTINGS (novos campos enterprise)
-- ═══════════════════════════════════════════

alter table public.listings
  add column if not exists trim_id uuid references public.trims(id),
  add column if not exists color_ext text default '',
  add column if not exists color_int text default '',
  add column if not exists plate_masked text default '',
  add column if not exists equipment jsonb default '[]',
  add column if not exists inspection_status text default 'none',
  add column if not exists inspection_url text default '',
  add column if not exists reserved_until timestamptz,
  add column if not exists tier text default 'free',
  add column if not exists quality_score int default 0,
  add column if not exists last_bump_at timestamptz default now(),
  add column if not exists boost_expires_at timestamptz;

-- Drop e recria constraints para expandir valores
alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings add constraint listings_status_check
  check (status in ('pending','active','paused','rejected','reserved','sold'));

-- Constraint para inspection_status (não usar IF NOT EXISTS em check constraints)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'listings_inspection_check') then
    alter table public.listings add constraint listings_inspection_check
      check (inspection_status in ('none','pending','approved','rejected'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'listings_tier_check') then
    alter table public.listings add constraint listings_tier_check
      check (tier in ('free','silver','gold'));
  end if;
end $$;

create index if not exists idx_listings_tier on public.listings(tier);
create index if not exists idx_listings_bump on public.listings(last_bump_at);
create index if not exists idx_listings_trim on public.listings(trim_id);

-- ═══════════════════════════════════════════
-- EXPAND DEALERSHIPS (slots + credits)
-- ═══════════════════════════════════════════

alter table public.dealerships
  add column if not exists slot_limit int default 10,
  add column if not exists credits int default 0;

-- ═══════════════════════════════════════════
-- EXPAND LEADS (temperature + deal tracking)
-- ═══════════════════════════════════════════

alter table public.leads
  add column if not exists temperature text default 'warm',
  add column if not exists expected_close_date date,
  add column if not exists deal_value numeric(12,2),
  add column if not exists loss_reason text default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_temperature_check') then
    alter table public.leads add constraint leads_temperature_check
      check (temperature in ('hot','warm','cold'));
  end if;
end $$;

alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check
  check (status in ('new','contacted','negotiating','test_drive','sold','lost'));

-- ═══════════════════════════════════════════
-- EXPAND LEAD INTERACTIONS
-- ═══════════════════════════════════════════

alter table public.lead_interactions
  add column if not exists outcome text default '',
  add column if not exists next_action_date date;

-- ═══════════════════════════════════════════
-- EXPAND ANALYTICS
-- ═══════════════════════════════════════════

alter table public.analytics_events
  add column if not exists source text default '',
  add column if not exists device text default '',
  add column if not exists session_id text default '';

alter table public.analytics_events drop constraint if exists analytics_events_event_type_check;
alter table public.analytics_events add constraint analytics_events_event_type_check
  check (event_type in ('view','contact_click','whatsapp_click','phone_click',
    'share','favorite','gallery_view','test_drive_request','finance_calc'));

-- ═══════════════════════════════════════════
-- SEED: Boost packages
-- ═══════════════════════════════════════════

insert into public.boost_packages (name, tier, price_usd, duration_days, weight, auto_bump, max_photos, badge_label) values
  ('Gold Premium', 'gold', 49.99, 30, 10, true, 30, 'GOLD'),
  ('Gold Semanal', 'gold', 19.99, 7, 10, true, 30, 'GOLD'),
  ('Silver Mensal', 'silver', 24.99, 30, 5, false, 20, 'SILVER'),
  ('Silver Semanal', 'silver', 9.99, 7, 5, false, 20, 'SILVER')
on conflict do nothing;

-- ═══════════════════════════════════════════
-- SEED: Brands + Models + Trims (Paraguay market)
-- ═══════════════════════════════════════════

-- Toyota
insert into public.brands (name, logo_url, country) values ('Toyota', '', 'Japón') on conflict (name) do nothing;
insert into public.models (brand_id, name, category, year_start) values
  ((select id from public.brands where name = 'Toyota'), 'Hilux', 'pickup', 2016),
  ((select id from public.brands where name = 'Toyota'), 'Corolla', 'sedan', 2014),
  ((select id from public.brands where name = 'Toyota'), 'Corolla Cross', 'suv', 2021),
  ((select id from public.brands where name = 'Toyota'), 'RAV4', 'suv', 2019),
  ((select id from public.brands where name = 'Toyota'), 'Yaris', 'hatchback', 2018)
on conflict (brand_id, name) do nothing;

insert into public.trims (model_id, name, engine_cc, horsepower, fuel, transmission, doors) values
  ((select id from public.models where name = 'Hilux' and brand_id = (select id from public.brands where name = 'Toyota')), 'SR 2.7', 2694, 164, 'nafta', 'manual', 4),
  ((select id from public.models where name = 'Hilux' and brand_id = (select id from public.brands where name = 'Toyota')), 'SRV 2.8 TDI', 2755, 204, 'diesel', 'automatico', 4),
  ((select id from public.models where name = 'Hilux' and brand_id = (select id from public.brands where name = 'Toyota')), 'SRX 2.8 TDI', 2755, 204, 'diesel', 'automatico', 4),
  ((select id from public.models where name = 'Corolla' and brand_id = (select id from public.brands where name = 'Toyota')), 'XEi 2.0 CVT', 1987, 170, 'nafta', 'cvt', 4),
  ((select id from public.models where name = 'Corolla' and brand_id = (select id from public.brands where name = 'Toyota')), 'SEG 2.0 CVT', 1987, 170, 'nafta', 'cvt', 4),
  ((select id from public.models where name = 'Corolla Cross' and brand_id = (select id from public.brands where name = 'Toyota')), 'XEi 2.0 CVT', 1987, 170, 'nafta', 'cvt', 4)
on conflict (model_id, name) do nothing;

-- Volkswagen
insert into public.brands (name, logo_url, country) values ('Volkswagen', '', 'Alemania') on conflict (name) do nothing;
insert into public.models (brand_id, name, category, year_start) values
  ((select id from public.brands where name = 'Volkswagen'), 'Nivus', 'suv', 2021),
  ((select id from public.brands where name = 'Volkswagen'), 'T-Cross', 'suv', 2019),
  ((select id from public.brands where name = 'Volkswagen'), 'Amarok', 'pickup', 2010),
  ((select id from public.brands where name = 'Volkswagen'), 'Polo', 'hatchback', 2018)
on conflict (brand_id, name) do nothing;

insert into public.trims (model_id, name, engine_cc, horsepower, fuel, transmission, doors) values
  ((select id from public.models where name = 'Nivus' and brand_id = (select id from public.brands where name = 'Volkswagen')), 'Comfortline 1.0 TSI', 999, 116, 'nafta', 'automatico', 4),
  ((select id from public.models where name = 'Nivus' and brand_id = (select id from public.brands where name = 'Volkswagen')), 'Highline 1.0 TSI', 999, 116, 'nafta', 'automatico', 4),
  ((select id from public.models where name = 'Amarok' and brand_id = (select id from public.brands where name = 'Volkswagen')), 'Highline 3.0 V6 TDI', 2967, 258, 'diesel', 'automatico', 4)
on conflict (model_id, name) do nothing;

-- Honda
insert into public.brands (name, logo_url, country) values ('Honda', '', 'Japón') on conflict (name) do nothing;
insert into public.models (brand_id, name, category, year_start) values
  ((select id from public.brands where name = 'Honda'), 'Civic', 'sedan', 2016),
  ((select id from public.brands where name = 'Honda'), 'HR-V', 'suv', 2015),
  ((select id from public.brands where name = 'Honda'), 'City', 'sedan', 2020)
on conflict (brand_id, name) do nothing;

insert into public.trims (model_id, name, engine_cc, horsepower, fuel, transmission, doors) values
  ((select id from public.models where name = 'Civic' and brand_id = (select id from public.brands where name = 'Honda')), 'Touring 1.5 Turbo', 1498, 173, 'nafta', 'cvt', 4),
  ((select id from public.models where name = 'Civic' and brand_id = (select id from public.brands where name = 'Honda')), 'EXL 2.0', 1996, 155, 'nafta', 'cvt', 4),
  ((select id from public.models where name = 'HR-V' and brand_id = (select id from public.brands where name = 'Honda')), 'EXL 1.5 Turbo', 1498, 177, 'nafta', 'cvt', 4)
on conflict (model_id, name) do nothing;

-- Ford
insert into public.brands (name, logo_url, country) values ('Ford', '', 'Estados Unidos') on conflict (name) do nothing;
insert into public.models (brand_id, name, category, year_start) values
  ((select id from public.brands where name = 'Ford'), 'Ranger', 'pickup', 2012),
  ((select id from public.brands where name = 'Ford'), 'Territory', 'suv', 2023),
  ((select id from public.brands where name = 'Ford'), 'Ka', 'hatchback', 2014)
on conflict (brand_id, name) do nothing;

insert into public.trims (model_id, name, engine_cc, horsepower, fuel, transmission, doors) values
  ((select id from public.models where name = 'Ranger' and brand_id = (select id from public.brands where name = 'Ford')), 'Limited 3.0 V6', 2996, 250, 'diesel', 'automatico', 4),
  ((select id from public.models where name = 'Ranger' and brand_id = (select id from public.brands where name = 'Ford')), 'XLT 2.0 Biturbo', 1996, 210, 'diesel', 'automatico', 4),
  ((select id from public.models where name = 'Ka' and brand_id = (select id from public.brands where name = 'Ford')), 'SE 1.5', 1498, 107, 'nafta', 'manual', 4)
on conflict (model_id, name) do nothing;

-- Chevrolet
insert into public.brands (name, logo_url, country) values ('Chevrolet', '', 'Estados Unidos') on conflict (name) do nothing;
insert into public.models (brand_id, name, category, year_start) values
  ((select id from public.brands where name = 'Chevrolet'), 'S10', 'pickup', 2012),
  ((select id from public.brands where name = 'Chevrolet'), 'Onix', 'hatchback', 2019),
  ((select id from public.brands where name = 'Chevrolet'), 'Tracker', 'suv', 2021)
on conflict (brand_id, name) do nothing;

insert into public.trims (model_id, name, engine_cc, horsepower, fuel, transmission, doors) values
  ((select id from public.models where name = 'S10' and brand_id = (select id from public.brands where name = 'Chevrolet')), 'LTZ 2.8 TDI 4x4', 2776, 200, 'diesel', 'automatico', 4),
  ((select id from public.models where name = 'Onix' and brand_id = (select id from public.brands where name = 'Chevrolet')), 'Premier 1.0 Turbo', 999, 116, 'nafta', 'automatico', 4),
  ((select id from public.models where name = 'Tracker' and brand_id = (select id from public.brands where name = 'Chevrolet')), 'Premier 1.2 Turbo', 1199, 133, 'nafta', 'automatico', 4)
on conflict (model_id, name) do nothing;

-- Hyundai
insert into public.brands (name, logo_url, country) values ('Hyundai', '', 'Corea del Sur') on conflict (name) do nothing;
insert into public.models (brand_id, name, category, year_start) values
  ((select id from public.brands where name = 'Hyundai'), 'Tucson', 'suv', 2016),
  ((select id from public.brands where name = 'Hyundai'), 'HB20', 'hatchback', 2019),
  ((select id from public.brands where name = 'Hyundai'), 'Creta', 'suv', 2017)
on conflict (brand_id, name) do nothing;

insert into public.trims (model_id, name, engine_cc, horsepower, fuel, transmission, doors) values
  ((select id from public.models where name = 'Tucson' and brand_id = (select id from public.brands where name = 'Hyundai')), 'GLS 2.0', 1999, 167, 'nafta', 'automatico', 4),
  ((select id from public.models where name = 'HB20' and brand_id = (select id from public.brands where name = 'Hyundai')), 'Comfort 1.0', 998, 80, 'nafta', 'manual', 4),
  ((select id from public.models where name = 'Creta' and brand_id = (select id from public.brands where name = 'Hyundai')), 'Ultimate 2.0', 1999, 167, 'nafta', 'automatico', 4)
on conflict (model_id, name) do nothing;

-- Kia, Nissan, Mitsubishi, Renault, Fiat, BMW, Mercedes-Benz, Audi, Jeep
insert into public.brands (name, logo_url, country) values
  ('Kia', '', 'Corea del Sur'),
  ('Nissan', '', 'Japón'),
  ('Mitsubishi', '', 'Japón'),
  ('Renault', '', 'Francia'),
  ('Fiat', '', 'Italia'),
  ('BMW', '', 'Alemania'),
  ('Mercedes-Benz', '', 'Alemania'),
  ('Audi', '', 'Alemania'),
  ('Jeep', '', 'Estados Unidos')
on conflict (name) do nothing;

-- Kia models
insert into public.models (brand_id, name, category, year_start) values
  ((select id from public.brands where name = 'Kia'), 'Sportage', 'suv', 2016),
  ((select id from public.brands where name = 'Kia'), 'Seltos', 'suv', 2020)
on conflict (brand_id, name) do nothing;

insert into public.trims (model_id, name, engine_cc, horsepower, fuel, transmission, doors) values
  ((select id from public.models where name = 'Sportage' and brand_id = (select id from public.brands where name = 'Kia')), 'LX 2.0', 1999, 155, 'nafta', 'automatico', 4),
  ((select id from public.models where name = 'Seltos' and brand_id = (select id from public.brands where name = 'Kia')), 'EX 1.6 Turbo', 1591, 177, 'nafta', 'automatico', 4)
on conflict (model_id, name) do nothing;

-- Jeep models
insert into public.models (brand_id, name, category, year_start) values
  ((select id from public.brands where name = 'Jeep'), 'Compass', 'suv', 2017),
  ((select id from public.brands where name = 'Jeep'), 'Renegade', 'suv', 2015)
on conflict (brand_id, name) do nothing;

insert into public.trims (model_id, name, engine_cc, horsepower, fuel, transmission, doors) values
  ((select id from public.models where name = 'Compass' and brand_id = (select id from public.brands where name = 'Jeep')), 'Limited 2.0 TD', 1956, 170, 'diesel', 'automatico', 4),
  ((select id from public.models where name = 'Renegade' and brand_id = (select id from public.brands where name = 'Jeep')), 'Longitude 1.8', 1798, 139, 'nafta', 'automatico', 4)
on conflict (model_id, name) do nothing;

-- BMW models
insert into public.models (brand_id, name, category, year_start) values
  ((select id from public.brands where name = 'BMW'), 'X3', 'suv', 2018),
  ((select id from public.brands where name = 'BMW'), 'Serie 3', 'sedan', 2019)
on conflict (brand_id, name) do nothing;

insert into public.trims (model_id, name, engine_cc, horsepower, fuel, transmission, doors) values
  ((select id from public.models where name = 'X3' and brand_id = (select id from public.brands where name = 'BMW')), 'xDrive30i M Sport', 1998, 252, 'nafta', 'automatico', 4),
  ((select id from public.models where name = 'Serie 3' and brand_id = (select id from public.brands where name = 'BMW')), '330i M Sport', 1998, 258, 'nafta', 'automatico', 4)
on conflict (model_id, name) do nothing;

-- Mercedes-Benz models
insert into public.models (brand_id, name, category, year_start) values
  ((select id from public.brands where name = 'Mercedes-Benz'), 'GLC', 'suv', 2016),
  ((select id from public.brands where name = 'Mercedes-Benz'), 'Clase C', 'sedan', 2015)
on conflict (brand_id, name) do nothing;

insert into public.trims (model_id, name, engine_cc, horsepower, fuel, transmission, doors) values
  ((select id from public.models where name = 'GLC' and brand_id = (select id from public.brands where name = 'Mercedes-Benz')), '300 4MATIC AMG Line', 1991, 258, 'nafta', 'automatico', 4),
  ((select id from public.models where name = 'Clase C' and brand_id = (select id from public.brands where name = 'Mercedes-Benz')), 'C200 Avantgarde', 1497, 204, 'nafta', 'automatico', 4)
on conflict (model_id, name) do nothing;

-- Audi models
insert into public.models (brand_id, name, category, year_start) values
  ((select id from public.brands where name = 'Audi'), 'Q5', 'suv', 2017),
  ((select id from public.brands where name = 'Audi'), 'A3', 'sedan', 2016)
on conflict (brand_id, name) do nothing;

insert into public.trims (model_id, name, engine_cc, horsepower, fuel, transmission, doors) values
  ((select id from public.models where name = 'Q5' and brand_id = (select id from public.brands where name = 'Audi')), 'Sportback 45 TFSI Quattro', 1984, 265, 'nafta', 'automatico', 4),
  ((select id from public.models where name = 'A3' and brand_id = (select id from public.brands where name = 'Audi')), 'Sportback 35 TFSI', 1498, 150, 'nafta', 'automatico', 4)
on conflict (model_id, name) do nothing;
