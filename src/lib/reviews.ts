import { supabase } from './supabase';
import type { Review } from '../types';

export async function createReview(data: {
  user_id: string;
  dealer_id?: string | null;
  seller_id?: string | null;
  listing_id?: string | null;
  rating: number;
  comment: string;
}): Promise<Review | null> {
  if (!supabase) return null;

  const { data: review, error } = await supabase
    .from('reviews')
    .insert(data)
    .select('*, profile:profiles(name, avatar_url)')
    .single();

  if (error) {
    console.error('createReview error:', error);
    return null;
  }

  return review as Review;
}

export async function fetchDealerReviews(dealerId: string): Promise<Review[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reviews')
    .select('*, profile:profiles(name, avatar_url)')
    .eq('dealer_id', dealerId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as Review[];
}

export async function fetchDealerAverageRating(dealerId: string): Promise<{ avg: number; count: number }> {
  if (!supabase) return { avg: 0, count: 0 };

  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('dealer_id', dealerId);

  if (error || !data || data.length === 0) return { avg: 0, count: 0 };

  const total = data.reduce((sum, r) => sum + r.rating, 0);
  return { avg: total / data.length, count: data.length };
}
