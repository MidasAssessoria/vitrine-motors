import { supabase } from './supabase';
import type { Conversation, Message } from '../types';

export async function getOrCreateConversation(
  listingId: string,
  buyerId: string,
  sellerId: string
): Promise<Conversation> {
  if (!supabase) throw new Error('Supabase no configurado');

  // Try to find existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (existing) return existing as Conversation;

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
    .select()
    .single();

  if (error) throw error;
  return data as Conversation;
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      listing:listings(id, title, price_usd, photos),
      buyer:profiles!conversations_buyer_id_fkey(id, name, avatar_url),
      seller:profiles!conversations_seller_id_fkey(id, name, avatar_url)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error) return [];
  return (data as Conversation[]) || [];
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return [];
  return (data as Message[]) || [];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
  isBuyer: boolean
): Promise<Message | null> {
  if (!supabase) return null;

  const { data: msg, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select()
    .single();

  if (error) return null;

  // Update conversation preview and increment unread for the OTHER party
  const unreadField = isBuyer ? 'seller_unread' : 'buyer_unread';
  const { data: conv } = await supabase
    .from('conversations')
    .select(unreadField)
    .eq('id', conversationId)
    .single();

  const currentUnread = (conv as Record<string, number>)?.[unreadField] ?? 0;

  await supabase
    .from('conversations')
    .update({
      last_message_preview: body.slice(0, 100),
      last_message_at: new Date().toISOString(),
      [unreadField]: currentUnread + 1,
    })
    .eq('id', conversationId);

  return msg as Message;
}

export async function markConversationRead(
  conversationId: string,
  isBuyer: boolean
): Promise<void> {
  if (!supabase) return;
  const field = isBuyer ? 'buyer_unread' : 'seller_unread';
  await supabase
    .from('conversations')
    .update({ [field]: 0 })
    .eq('id', conversationId);
}

export async function fetchTotalUnread(userId: string): Promise<number> {
  if (!supabase) return 0;

  const { data } = await supabase
    .from('conversations')
    .select('buyer_id, buyer_unread, seller_unread')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

  if (!data) return 0;
  return data.reduce((sum, c) => {
    const isBuyer = c.buyer_id === userId;
    return sum + (isBuyer ? (c.buyer_unread ?? 0) : (c.seller_unread ?? 0));
  }, 0);
}
