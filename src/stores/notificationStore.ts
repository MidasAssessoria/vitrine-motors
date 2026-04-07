import { create } from 'zustand';
import type { AppNotification } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from './toastStore';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  // Actions
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  addNotification: (notification: AppNotification) => void;
  subscribeToRealtime: (userId: string) => (() => void) | undefined;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (userId: string) => {
    if (!supabase) {
      // Mock notifications for development
      const mockNotifications: AppNotification[] = [
        {
          id: '1',
          user_id: userId,
          type: 'new_lead',
          title: 'Nuevo contacto',
          message: 'Juan Perez esta interesado en tu Toyota Hilux 2023',
          link: '/panel',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '2',
          user_id: userId,
          type: 'listing_approved',
          title: 'Anuncio aprobado',
          message: 'Tu anuncio "Honda Civic 2022" fue aprobado y ya esta visible',
          link: '/panel',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: '3',
          user_id: userId,
          type: 'system',
          title: 'Bienvenido a VitrineMOTORS',
          message: 'Tu cuenta fue creada exitosamente. Publica tu primer vehiculo!',
          link: '/publicar',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ];
      set({
        notifications: mockNotifications,
        unreadCount: mockNotifications.filter((n) => !n.read).length,
        loading: false,
      });
      return;
    }

    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifications = (data || []) as AppNotification[];
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
        loading: false,
      });
    } catch {
      // Tabela pode não existir ainda — falhar silenciosamente
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: state.notifications.filter((n) => !n.read && n.id !== id).length,
    }));

    if (supabase) {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    }
  },

  markAllAsRead: async (userId: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));

    if (supabase) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    }
  },

  addNotification: (notification: AppNotification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    }));
    // Show toast for high-priority notification types
    if (notification.type === 'new_lead') {
      toast.info(`${notification.title}: ${notification.message}`);
    }
  },

  subscribeToRealtime: (userId: string) => {
    if (!supabase) return undefined;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          get().addNotification(payload.new as AppNotification);
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  },
}));
