import { supabase } from './supabase';
import type { BoostPackage, BoostPurchase } from '../types';

// ─── Packages ───
export async function fetchBoostPackages(): Promise<BoostPackage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('boost_packages').select('*').eq('active', true).order('weight', { ascending: false });
  if (error) return [];
  return data as BoostPackage[];
}

// ─── Purchases ───
export async function purchaseBoost(data: {
  dealer_id: string;
  package_id: string;
  listing_id: string;
  credits_used: number;
  duration_days: number;
}) {
  if (!supabase) return null;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + data.duration_days);

  const { data: purchase, error } = await supabase
    .from('boost_purchases')
    .insert({
      dealer_id: data.dealer_id,
      package_id: data.package_id,
      listing_id: data.listing_id,
      credits_used: data.credits_used,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) { console.error('purchaseBoost error:', error); return null; }

  // Atualizar tier e boost_expires no listing
  const pkg = await supabase.from('boost_packages').select('tier').eq('id', data.package_id).single();
  if (pkg.data) {
    await supabase.from('listings').update({
      tier: pkg.data.tier,
      boost_expires_at: expiresAt.toISOString(),
      last_bump_at: new Date().toISOString(),
    }).eq('id', data.listing_id);
  }

  return purchase as BoostPurchase;
}

export async function fetchDealerPurchases(dealerId: string): Promise<BoostPurchase[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('boost_purchases')
    .select('*, package:boost_packages(*)')
    .eq('dealer_id', dealerId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data as BoostPurchase[];
}

// ─── Quality Score ───
export function computeQualityScore(listing: {
  photos?: { url: string }[];
  description?: string;
  inspection_status?: string;
  price_usd?: number;
  brand?: string;
  model?: string;
  year?: number;
  fuel?: string;
  transmission?: string;
  equipment?: Record<string, boolean> | Record<string, boolean>[];
}): number {
  let score = 0;

  // ≥10 fotos → +30
  const photoCount = listing.photos?.length ?? 0;
  if (photoCount >= 10) score += 30;
  else if (photoCount >= 5) score += 15;
  else if (photoCount >= 1) score += 5;

  // Descrição > 200 chars → +20
  const descLen = listing.description?.length ?? 0;
  if (descLen > 200) score += 20;
  else if (descLen > 50) score += 10;

  // Laudo cautelar → +30
  if (listing.inspection_status === 'approved') score += 30;

  // Preço preenchido → +10
  if (listing.price_usd && listing.price_usd > 0) score += 10;

  // Specs completas → +10
  const hasSpecs = listing.brand && listing.model && listing.year && listing.fuel && listing.transmission;
  if (hasSpecs) score += 10;

  return Math.min(score, 100);
}

// ─── Ranking query (busca pública) ───
export async function fetchRankedListings(limit = 20, offset = 0, vehicleType?: string) {
  if (!supabase) return [];

  let query = supabase
    .from('listings')
    .select('*, photos:listing_photos(*), dealership:dealerships(*)')
    .eq('status', 'active');

  if (vehicleType) {
    query = query.eq('vehicle_type', vehicleType);
  }

  const { data, error } = await query
    .order('tier', { ascending: false })
    .order('quality_score', { ascending: false })
    .order('last_bump_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { console.error('fetchRankedListings error:', error); return []; }
  return data;
}
