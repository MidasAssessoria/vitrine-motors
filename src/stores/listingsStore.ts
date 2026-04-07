import { create } from 'zustand';
import type { Listing, FilterState } from '../types';
import { fetchRankedListings } from '../lib/boost';
import { fetchUserFavorites, addFavorite, removeFavorite } from '../lib/favorites';
import { supabase } from '../lib/supabase';
import { toast } from './toastStore';

interface ListingsState {
  listings: Listing[];
  favorites: string[];
  filters: FilterState;
  loaded: boolean;
  loading: boolean;
  hasMore: boolean;
  page: number;
  pageSize: number;
  loadListings: () => Promise<void>;
  loadMore: () => Promise<void>;
  loadFavorites: (userId: string) => Promise<void>;
  setFilter: (key: keyof FilterState, value: string | number | boolean | null) => void;
  resetFilters: () => void;
  toggleFavorite: (listingId: string, userId?: string) => void;
  getFilteredListings: () => Listing[];
}

const defaultFilters: FilterState = {
  vehicleType: 'auto',
  brand: '',
  condition: '',
  category: '',
  fuel: '',
  transmission: '',
  priceMin: null,
  priceMax: null,
  yearMin: null,
  yearMax: null,
  mileageMax: null,
  city: '',
  search: '',
  tier: '',
  inspected: false,
  sortBy: 'recent',
};

export const useListingsStore = create<ListingsState>((set, get) => ({
  listings: [],
  favorites: [],
  filters: { ...defaultFilters },
  loaded: false,
  loading: false,
  hasMore: true,
  page: 0,
  pageSize: 30,

  loadListings: async () => {
    if (!supabase) return;
    set({ loading: true, page: 0 });

    try {
      const pageSize = get().pageSize;
      const data = await fetchRankedListings(pageSize, 0);
      set({
        listings: data as Listing[],
        loaded: true,
        loading: false,
        hasMore: data.length >= pageSize,
        page: 1,
      });
    } catch {
      set({ listings: [], loaded: true, loading: false, hasMore: false });
    }
  },

  loadMore: async () => {
    const { loading, hasMore, page, pageSize, listings } = get();
    if (loading || !hasMore || !supabase) return;

    set({ loading: true });

    try {
      const offset = page * pageSize;
      const data = await fetchRankedListings(pageSize, offset);
      set({
        listings: [...listings, ...(data as Listing[])],
        loading: false,
        hasMore: data.length >= pageSize,
        page: page + 1,
      });
    } catch {
      set({ loading: false });
    }
  },

  loadFavorites: async (userId) => {
    if (!supabase) return;
    const favs = await fetchUserFavorites(userId);
    set({ favorites: favs });
  },

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      page: 0,
      hasMore: true,
    })),

  resetFilters: () => set({ filters: { ...defaultFilters }, page: 0, hasMore: true }),

  toggleFavorite: (listingId, userId) => {
    const { favorites } = get();
    const isFav = favorites.includes(listingId);

    set({
      favorites: isFav
        ? favorites.filter((id) => id !== listingId)
        : [...favorites, listingId],
    });

    toast[isFav ? 'info' : 'success'](
      isFav ? 'Eliminado de favoritos' : 'Agregado a favoritos'
    );

    if (userId && supabase) {
      if (isFav) {
        removeFavorite(userId, listingId);
      } else {
        addFavorite(userId, listingId);
      }
    }
  },

  getFilteredListings: () => {
    const { listings, filters } = get();
    let result = listings.filter((l) => l.status === 'active');

    // Filtrar por tipo de veículo
    if (filters.vehicleType) result = result.filter((l) => (l.vehicle_type || 'auto') === filters.vehicleType);

    if (filters.brand) result = result.filter((l) => l.brand === filters.brand);
    if (filters.condition) result = result.filter((l) => l.condition === filters.condition);
    if (filters.category) result = result.filter((l) => l.category === filters.category);
    if (filters.fuel) result = result.filter((l) => l.fuel === filters.fuel);
    if (filters.transmission) result = result.filter((l) => l.transmission === filters.transmission);
    if (filters.priceMin) result = result.filter((l) => l.price_usd >= filters.priceMin!);
    if (filters.priceMax) result = result.filter((l) => l.price_usd <= filters.priceMax!);
    if (filters.yearMin) result = result.filter((l) => l.year >= filters.yearMin!);
    if (filters.yearMax) result = result.filter((l) => l.year <= filters.yearMax!);
    if (filters.mileageMax) result = result.filter((l) => l.mileage <= filters.mileageMax!);
    if (filters.city) result = result.filter((l) => l.city === filters.city);
    if (filters.tier) result = result.filter((l) => l.tier === filters.tier);
    if (filters.inspected) result = result.filter((l) => l.inspection_status === 'approved');
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.brand.toLowerCase().includes(q) ||
          l.model.toLowerCase().includes(q)
      );
    }

    // Comparador único: tier primeiro, depois critério do usuário, depois quality score
    const tierWeight = (l: Listing) => {
      if (l.tier === 'gold') return 3;
      if (l.tier === 'silver') return 2;
      if (l.featured) return 1;
      return 0;
    };

    result.sort((a, b) => {
      const tierDiff = tierWeight(b) - tierWeight(a);
      if (tierDiff !== 0) return tierDiff;

      switch (filters.sortBy) {
        case 'price_asc':  return a.price_usd - b.price_usd;
        case 'price_desc': return b.price_usd - a.price_usd;
        case 'year_desc':  return b.year - a.year;
        case 'mileage_asc': return a.mileage - b.mileage;
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  },
}));
