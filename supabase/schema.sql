-- ============================================
-- VitrineMOTORS — Schema Supabase
-- Cole este SQL no SQL Editor do Supabase Dashboard
-- ============================================

-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───
-- Extende auth.users com dados do marketplace
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'admin')),
  name text not null,
  email text not null,
  phone text default '',
  whatsapp text default '',
  avatar_url text default '',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Perfis são públicos para leitura"
  on public.profiles for select using (true);

create policy "Usuários editam próprio perfil"
  on public.profiles for update using (auth.uid() = id);

-- Trigger: criar perfil automaticamente ao registrar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Usuario'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'buyer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── DEALERSHIPS ───
create table public.dealerships (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  logo_url text default '',
  address text default '',
  city text default '',
  verified boolean default false,
  approved boolean default false,
  plan text default 'free' check (plan in ('free', 'premium')),
  created_at timestamptz default now()
);

alter table public.dealerships enable row level security;

create policy "Concessionárias são públicas para leitura"
  on public.dealerships for select using (true);

create policy "Dono edita própria concessionária"
  on public.dealerships for update using (auth.uid() = owner_id);

create policy "Seller pode criar concessionária"
  on public.dealerships for insert with check (auth.uid() = owner_id);

-- ─── LISTINGS ───
create table public.listings (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  dealership_id uuid references public.dealerships(id) on delete set null,
  title text not null,
  brand text not null,
  model text not null,
  year int not null,
  version text default '',
  condition text not null check (condition in ('0km', 'usado')),
  category text not null check (category in ('sedan', 'suv', 'pickup', 'hatchback', 'coupe', 'van', 'camion')),
  fuel text not null check (fuel in ('nafta', 'diesel', 'hibrido', 'electrico')),
  transmission text not null check (transmission in ('manual', 'automatico', 'cvt')),
  mileage int default 0,
  price_usd numeric(12,2) not null,
  color text default '',
  doors int default 4,
  description text default '',
  city text not null,
  department text default 'Central',
  whatsapp_contact text not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'paused', 'rejected')),
  featured boolean default false,
  views_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.listings enable row level security;

create policy "Listings ativos são públicos"
  on public.listings for select using (status = 'active' or auth.uid() = seller_id);

create policy "Seller cria listing"
  on public.listings for insert with check (auth.uid() = seller_id);

create policy "Seller edita próprio listing"
  on public.listings for update using (auth.uid() = seller_id);

create policy "Seller deleta próprio listing"
  on public.listings for delete using (auth.uid() = seller_id);

-- ─── LISTING PHOTOS ───
create table public.listing_photos (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url text not null,
  order_index int default 0,
  is_cover boolean default false,
  created_at timestamptz default now()
);

alter table public.listing_photos enable row level security;

create policy "Fotos são públicas"
  on public.listing_photos for select using (true);

create policy "Seller gerencia fotos do próprio listing"
  on public.listing_photos for all using (
    auth.uid() = (select seller_id from public.listings where id = listing_id)
  );

-- ─── FAVORITES ───
create table public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

alter table public.favorites enable row level security;

create policy "Usuário vê próprios favoritos"
  on public.favorites for select using (auth.uid() = user_id);

create policy "Usuário adiciona favorito"
  on public.favorites for insert with check (auth.uid() = user_id);

create policy "Usuário remove favorito"
  on public.favorites for delete using (auth.uid() = user_id);

-- ─── STORAGE BUCKET (fotos de veículos) ───
insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict do nothing;

create policy "Qualquer um pode ver fotos"
  on storage.objects for select using (bucket_id = 'vehicle-photos');

create policy "Autenticados podem fazer upload"
  on storage.objects for insert with check (
    bucket_id = 'vehicle-photos' and auth.role() = 'authenticated'
  );

create policy "Dono pode deletar foto"
  on storage.objects for delete using (
    bucket_id = 'vehicle-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── INDEXES ───
create index idx_listings_status on public.listings(status);
create index idx_listings_brand on public.listings(brand);
create index idx_listings_category on public.listings(category);
create index idx_listings_seller on public.listings(seller_id);
create index idx_listings_city on public.listings(city);
create index idx_favorites_user on public.favorites(user_id);
create index idx_photos_listing on public.listing_photos(listing_id);

-- ─── ADMIN POLICIES (para painel admin) ───
-- Admins podem gerenciar tudo
create policy "Admin gerencia listings"
  on public.listings for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin gerencia concessionárias"
  on public.dealerships for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
