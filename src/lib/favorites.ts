import { supabase } from './supabase';

// ─── Buscar favoritos do usuário ───
export async function fetchUserFavorites(userId: string): Promise<string[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', userId);

  if (error) return [];
  return data.map((f) => f.listing_id);
}

// ─── Adicionar favorito ───
export async function addFavorite(userId: string, listingId: string) {
  if (!supabase) return;

  await supabase
    .from('favorites')
    .insert({ user_id: userId, listing_id: listingId });
}

// ─── Remover favorito ───
export async function removeFavorite(userId: string, listingId: string) {
  if (!supabase) return;

  await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId);
}
