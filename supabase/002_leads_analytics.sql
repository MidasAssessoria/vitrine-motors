-- ============================================
-- VitrineMOTORS — Migração 002: Leads + Analytics + Dealer Hours
-- Cole este SQL no SQL Editor do Supabase Dashboard
-- ============================================

-- ─── LEADS (CRM) ───
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  dealer_id uuid references public.dealerships(id) on delete set null,
  seller_id uuid not null references public.profiles(id),
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text default '',
  source text default 'whatsapp' check (source in ('whatsapp', 'phone', 'email', 'form')),
  status text default 'new' check (status in ('new', 'contacted', 'negotiating', 'sold', 'lost')),
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.leads enable row level security;

create policy "Seller vê próprios leads"
  on public.leads for select using (auth.uid() = seller_id);
create policy "Dealer vê leads da loja"
  on public.leads for select using (
    dealer_id in (select id from public.dealerships where owner_id = auth.uid())
  );
create policy "Admin vê todos os leads"
  on public.leads for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Seller gerencia próprios leads"
  on public.leads for all using (auth.uid() = seller_id);

-- ─── LEAD INTERACTIONS ───
create table if not exists public.lead_interactions (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  type text not null check (type in ('call', 'whatsapp', 'email', 'note', 'visit')),
  content text default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.lead_interactions enable row level security;
create policy "Acessível via lead owner"
  on public.lead_interactions for all using (
    lead_id in (select id from public.leads where seller_id = auth.uid())
  );
create policy "Admin gerencia interações"
  on public.lead_interactions for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ─── ANALYTICS EVENTS ───
create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete cascade,
  dealer_id uuid references public.dealerships(id) on delete set null,
  event_type text not null check (event_type in ('view', 'contact_click', 'whatsapp_click', 'share', 'favorite')),
  viewer_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.analytics_events enable row level security;
create policy "Inserção pública tracking"
  on public.analytics_events for insert with check (true);
create policy "Seller vê analytics dos seus listings"
  on public.analytics_events for select using (
    listing_id in (select id from public.listings where seller_id = auth.uid())
  );
create policy "Admin vê todos analytics"
  on public.analytics_events for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ─── DEALER HOURS ───
create table if not exists public.dealer_hours (
  id uuid primary key default uuid_generate_v4(),
  dealer_id uuid not null references public.dealerships(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  open_time time,
  close_time time,
  is_closed boolean default false
);

alter table public.dealer_hours enable row level security;
create policy "Público para leitura horários"
  on public.dealer_hours for select using (true);
create policy "Dono edita horários"
  on public.dealer_hours for all using (
    dealer_id in (select id from public.dealerships where owner_id = auth.uid())
  );
create policy "Admin gerencia horários"
  on public.dealer_hours for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ─── INDEXES ───
create index if not exists idx_leads_seller on public.leads(seller_id);
create index if not exists idx_leads_dealer on public.leads(dealer_id);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_created on public.leads(created_at);
create index if not exists idx_interactions_lead on public.lead_interactions(lead_id);
create index if not exists idx_analytics_listing on public.analytics_events(listing_id);
create index if not exists idx_analytics_type on public.analytics_events(event_type);
create index if not exists idx_analytics_created on public.analytics_events(created_at);
create index if not exists idx_dealer_hours_dealer on public.dealer_hours(dealer_id);
