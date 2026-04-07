-- ─── Migration 021: Equipe das concessionárias (Platinum) ───
-- Cole no SQL Editor do Supabase Dashboard
-- Requer: migration 001 (profiles) e schema base (dealerships)

CREATE TABLE IF NOT EXISTS public.dealer_members (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id uuid NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dealer_role   text NOT NULL DEFAULT 'sales'
                CHECK (dealer_role IN ('admin', 'sales', 'viewer')),
  invited_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(dealership_id, user_id)
);

-- Roles:
--   admin  → pode tudo: convidar, remover, editar perfil da conc., ver financeiro
--   sales  → pode criar/editar anúncios, gerenciar leads, ver analytics
--   viewer → só visualiza dashboard, leads e relatórios (sem edição)

ALTER TABLE public.dealer_members ENABLE ROW LEVEL SECURITY;

-- Leitura: dono da conc. e membros podem ver a equipe
CREATE POLICY "dealer_members_read" ON public.dealer_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.dealerships
      WHERE id = dealer_members.dealership_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert: só dono da conc. ou membro com dealer_role = 'admin' pode convidar
CREATE POLICY "dealer_members_insert" ON public.dealer_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dealerships
      WHERE id = dealership_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.dealer_members dm
      WHERE dm.dealership_id = dealer_members.dealership_id
        AND dm.user_id = auth.uid()
        AND dm.dealer_role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Delete: dono ou membro admin pode remover
CREATE POLICY "dealer_members_delete" ON public.dealer_members
  FOR DELETE USING (
    auth.uid() = user_id -- pode sair por conta própria
    OR EXISTS (
      SELECT 1 FROM public.dealerships
      WHERE id = dealer_members.dealership_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.dealer_members dm
      WHERE dm.dealership_id = dealer_members.dealership_id
        AND dm.user_id = auth.uid()
        AND dm.dealer_role = 'admin'
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_dealer_members_dealership ON public.dealer_members(dealership_id);
CREATE INDEX IF NOT EXISTS idx_dealer_members_user ON public.dealer_members(user_id);
