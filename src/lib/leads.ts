import { supabase } from './supabase';
import type { Lead, LeadStatus, LeadTemperature, LeadInteraction, InteractionType } from '../types';
import { notifyNewLead } from './notifications';

export async function fetchLeads(filters?: {
  sellerId?: string;
  dealerId?: string;
  status?: LeadStatus;
}): Promise<Lead[]> {
  if (!supabase) return [];

  let query = supabase
    .from('leads')
    .select('*, listing:listings(id, title, brand, model, price_usd, photos:listing_photos(url, is_cover))')
    .order('created_at', { ascending: false });

  if (filters?.sellerId) query = query.eq('seller_id', filters.sellerId);
  if (filters?.dealerId) query = query.eq('dealer_id', filters.dealerId);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) { console.error('fetchLeads error:', error); return []; }
  return data as Lead[];
}

export async function createLead(data: {
  listing_id: string;
  dealer_id?: string | null;
  seller_id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email?: string;
  source: string;
  temperature?: LeadTemperature;
  notes?: string;
}) {
  if (!supabase) return null;

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({ ...data, temperature: data.temperature || 'warm' })
    .select()
    .single();

  if (error) { console.error('createLead error:', error); return null; }

  // Enviar notificações ao vendedor
  if (lead) {
    // Notificação in-app (buscar título do listing)
    supabase.from('listings').select('title').eq('id', data.listing_id).single().then(({ data: listing }) => {
      notifyNewLead(data.seller_id, data.buyer_name, listing?.title || 'tu vehículo').catch(() => {});
    });

    // Notificação por email (Edge Function)
    supabase.functions.invoke('send-notification', {
      body: { type: 'new_lead', lead_id: lead.id, listing_id: data.listing_id, seller_id: data.seller_id },
    }).catch(() => {});
  }

  return lead as Lead;
}

// ─── Subscrever a novos leads em tempo real ───
export function subscribeToNewLeads(
  filter: { type: 'dealer'; dealerId: string } | { type: 'seller'; sellerId: string },
  onNew: (lead: Lead) => void
): () => void {
  if (!supabase) return () => {};

  const fieldName = filter.type === 'dealer' ? 'dealer_id' : 'seller_id';
  const fieldValue = filter.type === 'dealer' ? filter.dealerId : filter.sellerId;
  const channelName = `leads:${fieldName}:${fieldValue}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `${fieldName}=eq.${fieldValue}`,
      },
      (payload) => {
        onNew(payload.new as Lead);
      }
    )
    .subscribe();

  return () => {
    supabase!.removeChannel(channel);
  };
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  if (!supabase) return;
  await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
}

export async function updateLeadTemperature(id: string, temperature: LeadTemperature) {
  if (!supabase) return;
  await supabase.from('leads').update({ temperature, updated_at: new Date().toISOString() }).eq('id', id);
}

export async function addInteraction(data: {
  lead_id: string;
  type: InteractionType;
  content: string;
  created_by: string;
  outcome?: string;
  next_action_date?: string | null;
}) {
  if (!supabase) return null;

  const { data: interaction, error } = await supabase
    .from('lead_interactions')
    .insert(data)
    .select()
    .single();

  if (error) { console.error('addInteraction error:', error); return null; }
  return interaction as LeadInteraction;
}

export async function fetchLeadInteractions(leadId: string): Promise<LeadInteraction[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('lead_interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as LeadInteraction[];
}
