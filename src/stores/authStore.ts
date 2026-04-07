import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { useNotificationStore } from './notificationStore';

// Boot the notification subscription + initial fetch for a given user.
// Called once after user is resolved — safe to call multiple times (store deduplicates channel).
function bootNotifications(userId: string) {
  const { fetchNotifications, subscribeToRealtime } = useNotificationStore.getState();
  fetchNotifications(userId);
  subscribeToRealtime(userId);
}

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string; password: string; name: string; phone: string; role: 'buyer' | 'seller';
    companyName?: string; ruc?: string; address?: string; city?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  initialize: async () => {
    if (!supabase) {
      set({ loading: false });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          set({ user: profile as Profile, isAuthenticated: true, loading: false });
          bootNotifications(session.user.id);
          return;
        }
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
    }

    set({ loading: false });
  },

  login: async (email, password) => {
    if (!supabase) {
      set({ error: 'Supabase no configurado. Verificá el archivo .env' });
      return;
    }

    set({ loading: true, error: null });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        set({ loading: false, error: 'No se pudo cargar el perfil. Intentá de nuevo.' });
        return;
      }

      set({
        user: profile as Profile,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      bootNotifications(data.user.id);
    }
  },

  register: async ({ email, password, name, phone, role, companyName, ruc, address, city }) => {
    if (!supabase) {
      set({ error: 'Supabase no configurado. Verificá el archivo .env' });
      return;
    }

    set({ loading: true, error: null });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, role },
      },
    });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    if (data.user) {
      // O trigger do banco cria o profile automaticamente
      // Buscar o profile criado
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // Se for concessionária, criar dealership automaticamente
      if (role === 'seller' && companyName) {
        await supabase.from('dealerships').insert({
          owner_id: data.user.id,
          name: companyName,
          ruc: ruc || '',
          address: address || '',
          city: city || '',
          approved: false,
          verified: false,
          plan: 'free',
        }).select().single();
      }

      if (!profile) {
        set({ loading: false, error: 'Cuenta creada pero el perfil aún no está disponible. Intentá iniciar sesión.' });
        return;
      }

      set({
        user: profile as Profile,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
    }
  },

  logout: async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    set({ user: null, isAuthenticated: false, error: null });
  },

  requestPasswordReset: async (email: string) => {
    if (!supabase) { set({ error: 'Supabase no configurado' }); return false; }
    set({ loading: true, error: null });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    set({ loading: false, error: error?.message || null });
    return !error;
  },

  updatePassword: async (newPassword: string) => {
    if (!supabase) { set({ error: 'Supabase no configurado' }); return false; }
    set({ loading: true, error: null });
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    set({ loading: false, error: error?.message || null });
    return !error;
  },

  clearError: () => set({ error: null }),
}));
