import { supabase } from './supabase';
import type { Profile, Dealership, Listing, Review } from '../types';

export async function fetchPublicProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}

export async function fetchSellerDealership(userId: string): Promise<Dealership | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('dealerships')
    .select('*')
    .eq('owner_id', userId)
    .single();
  if (error) return null;
  return data as Dealership;
}

export async function fetchDealershipById(dealershipId: string): Promise<Dealership | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('dealerships')
    .select('*')
    .eq('id', dealershipId)
    .single();
  if (error) return null;
  return data as Dealership;
}

export async function fetchSellerListings(sellerId: string): Promise<Listing[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('listings')
    .select('*, photos:listing_photos(*)')
    .eq('seller_id', sellerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data as Listing[];
}

export async function fetchDealershipListings(dealershipId: string): Promise<Listing[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('listings')
    .select('*, photos:listing_photos(*)')
    .eq('dealership_id', dealershipId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data as Listing[];
}

export async function fetchSellerReviews(sellerId: string): Promise<Review[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profile:profiles(name, avatar_url)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data as Review[];
}

export async function fetchDealerReviewsPublic(dealerId: string): Promise<Review[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profile:profiles(name, avatar_url)')
    .eq('dealer_id', dealerId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data as Review[];
}

export async function fetchAverageRating(options: { sellerId?: string; dealerId?: string }): Promise<{ avg: number; count: number }> {
  if (!supabase) return { avg: 0, count: 0 };

  let query = supabase.from('reviews').select('rating');
  if (options.sellerId) query = query.eq('seller_id', options.sellerId);
  if (options.dealerId) query = query.eq('dealer_id', options.dealerId);

  const { data, error } = await query;
  if (error || !data || data.length === 0) return { avg: 0, count: 0 };

  const sum = data.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
  return { avg: Math.round((sum / data.length) * 10) / 10, count: data.length };
}
