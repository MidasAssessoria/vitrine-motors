import { supabase } from './supabase';
import type { AnalyticsEventType, SystemKPIs, DealerKPIs } from '../types';

export async function trackEvent(
  listingId: string,
  eventType: AnalyticsEventType,
  viewerId?: string | null,
  dealerId?: string | null
) {
  if (!supabase) return;

  await supabase.from('analytics_events').insert({
    listing_id: listingId,
    event_type: eventType,
    viewer_id: viewerId || null,
    dealer_id: dealerId || null,
  });
}

export async function fetchSystemKPIs(): Promise<SystemKPIs> {
  const empty: SystemKPIs = {
    totalListings: 0, activeListings: 0, pendingListings: 0,
    totalUsers: 0, totalDealers: 0, totalLeads: 0,
    leadsLast7d: 0, viewsLast7d: 0,
  };

  if (!supabase) return empty;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [listings, activeL, pendingL, users, dealers, leads, leads7d, views7d] = await Promise.all([
    supabase.from('listings').select('id', { count: 'exact', head: true }),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('dealerships').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', 'view').gte('created_at', sevenDaysAgo),
  ]);

  return {
    totalListings: listings.count ?? 0,
    activeListings: activeL.count ?? 0,
    pendingListings: pendingL.count ?? 0,
    totalUsers: users.count ?? 0,
    totalDealers: dealers.count ?? 0,
    totalLeads: leads.count ?? 0,
    leadsLast7d: leads7d.count ?? 0,
    viewsLast7d: views7d.count ?? 0,
  };
}

export async function fetchDealerKPIs(dealerId: string): Promise<DealerKPIs> {
  const empty: DealerKPIs = {
    totalInventory: 0, activeInventory: 0, totalLeads: 0,
    newLeadsToday: 0, leadsLast7d: 0, avgInventoryAgeDays: 0,
    featuredPercentage: 0, ctrByListing: [],
  };

  if (!supabase) return empty;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Buscar listings do dealer
  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, status, featured, created_at')
    .eq('dealership_id', dealerId);

  if (!listings) return empty;

  const active = listings.filter((l) => l.status === 'active');
  const featured = listings.filter((l) => l.featured);

  // Calcular aging médio
  const ageDays = listings.map((l) => {
    const created = new Date(l.created_at);
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  });
  const avgAge = ageDays.length > 0 ? ageDays.reduce((a, b) => a + b, 0) / ageDays.length : 0;

  // Leads
  const [totalLeads, leadsToday, leads7d] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('dealer_id', dealerId),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('dealer_id', dealerId).gte('created_at', today),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('dealer_id', dealerId).gte('created_at', sevenDaysAgo),
  ]);

  // CTR por listing (views vs clicks)
  const listingIds = listings.map((l) => l.id);
  const { data: events } = await supabase
    .from('analytics_events')
    .select('listing_id, event_type')
    .in('listing_id', listingIds.length > 0 ? listingIds : ['none']);

  const ctrMap = new Map<string, { views: number; clicks: number }>();
  (events ?? []).forEach((e) => {
    const entry = ctrMap.get(e.listing_id) ?? { views: 0, clicks: 0 };
    if (e.event_type === 'view') entry.views++;
    else if (['contact_click', 'whatsapp_click'].includes(e.event_type)) entry.clicks++;
    ctrMap.set(e.listing_id, entry);
  });

  const ctrByListing = listings.map((l) => {
    const stats = ctrMap.get(l.id) ?? { views: 0, clicks: 0 };
    return {
      listingId: l.id,
      title: l.title,
      views: stats.views,
      clicks: stats.clicks,
      ctr: stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0,
    };
  });

  return {
    totalInventory: listings.length,
    activeInventory: active.length,
    totalLeads: totalLeads.count ?? 0,
    newLeadsToday: leadsToday.count ?? 0,
    leadsLast7d: leads7d.count ?? 0,
    avgInventoryAgeDays: Math.round(avgAge),
    featuredPercentage: listings.length > 0 ? Math.round((featured.length / listings.length) * 100) : 0,
    ctrByListing,
  };
}
