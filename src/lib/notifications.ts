import { supabase } from './supabase';
import type { NotificationType } from '../types';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('createNotification error:', error);
    return null;
  }

  return data;
}

// ─── Helpers para eventos específicos ───

export function notifyNewLead(sellerId: string, buyerName: string, listingTitle: string) {
  return createNotification({
    userId: sellerId,
    type: 'new_lead',
    title: 'Nuevo contacto recibido',
    message: `${buyerName} está interesado en tu "${listingTitle}"`,
    link: '/panel',
  });
}

export function notifyListingApproved(sellerId: string, listingTitle: string, listingId: string) {
  return createNotification({
    userId: sellerId,
    type: 'listing_approved',
    title: 'Anuncio aprobado',
    message: `Tu anuncio "${listingTitle}" fue aprobado y ya está visible`,
    link: `/vehiculo/${listingId}`,
  });
}

export function notifyListingRejected(sellerId: string, listingTitle: string) {
  return createNotification({
    userId: sellerId,
    type: 'listing_rejected',
    title: 'Anuncio rechazado',
    message: `Tu anuncio "${listingTitle}" fue rechazado. Revisá los motivos en tu panel.`,
    link: '/panel',
  });
}

export function notifyNewMessage(userId: string, senderName: string, listingTitle: string, conversationId: string) {
  return createNotification({
    userId,
    type: 'system',
    title: 'Nuevo mensaje',
    message: `${senderName} te envió un mensaje sobre "${listingTitle}"`,
    link: `/chat/${conversationId}`,
  });
}

export function notifyDealerApproved(ownerId: string, dealerName: string) {
  return createNotification({
    userId: ownerId,
    type: 'dealer_approved',
    title: 'Concesionaria aprobada',
    message: `Tu concesionaria "${dealerName}" fue aprobada y ya está visible`,
    link: '/dealer',
  });
}
