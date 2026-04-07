-- ============================================
-- VitrineMOTORS — Migration 004: Fixes & Indexes
-- RPC increment_views + índices de performance
-- Cole no SQL Editor do Supabase Dashboard
-- ============================================

-- ═══════════════════════════════════════════
-- FIX: RPC para incrementar views atomicamente
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.increment_views(p_listing_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.listings
  SET views_count = views_count + 1
  WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════
-- ÍNDICES DE PERFORMANCE FALTANTES
-- ═══════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_listings_quality_score ON public.listings(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price_usd);
CREATE INDEX IF NOT EXISTS idx_listings_year ON public.listings(year DESC);
CREATE INDEX IF NOT EXISTS idx_listings_mileage ON public.listings(mileage);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON public.listings(condition);
CREATE INDEX IF NOT EXISTS idx_listings_fuel ON public.listings(fuel);
CREATE INDEX IF NOT EXISTS idx_listings_transmission ON public.listings(transmission);
CREATE INDEX IF NOT EXISTS idx_listings_created ON public.listings(created_at DESC);

-- Índice composto para ranking (tier + quality + bump)
CREATE INDEX IF NOT EXISTS idx_listings_ranking
  ON public.listings(status, tier DESC, quality_score DESC, last_bump_at DESC);

-- Índices em leads
CREATE INDEX IF NOT EXISTS idx_leads_seller ON public.leads(seller_id);
CREATE INDEX IF NOT EXISTS idx_leads_dealer ON public.leads(dealer_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead ON public.lead_interactions(lead_id);

-- Índices em analytics
CREATE INDEX IF NOT EXISTS idx_analytics_listing ON public.analytics_events(listing_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at DESC);
