import { supabase } from './supabase';
import type { Dealership, DealerHours, Profile } from '../types';

// ─── Buscar dealership do user logado ───
export async function fetchDealerByOwner(ownerId: string): Promise<Dealership | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('dealerships')
    .select('*')
    .eq('owner_id', ownerId)
    .single();

  if (error) return null;
  return data as Dealership;
}

// ─── Listar todas (admin) ───
export async function fetchAllDealers(): Promise<Dealership[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('dealerships')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as Dealership[];
}

// ─── Criar dealership ───
export async function createDealership(data: {
  owner_id: string;
  name: string;
  address?: string;
  city?: string;
}) {
  if (!supabase) return null;

  const { data: dealer, error } = await supabase
    .from('dealerships')
    .insert({ ...data, verified: false, approved: false, plan: 'free' })
    .select()
    .single();

  if (error) { console.error('createDealership error:', error); return null; }
  return dealer as Dealership;
}

// ─── Atualizar perfil ───
export async function updateDealerProfile(id: string, data: Partial<Dealership>) {
  if (!supabase) return;

  const { error } = await supabase
    .from('dealerships')
    .update(data)
    .eq('id', id);

  if (error) console.error('updateDealerProfile error:', error);
}

// ─── Admin: aprovar / verificar ───
export async function approveDealership(id: string) {
  if (!supabase) return;
  await supabase.from('dealerships').update({ approved: true }).eq('id', id);
}

export async function verifyDealership(id: string, verified: boolean) {
  if (!supabase) return;
  await supabase.from('dealerships').update({ verified }).eq('id', id);
}

export async function deleteDealership(id: string) {
  if (!supabase) return;
  await supabase.from('dealerships').delete().eq('id', id);
}

// ─── Horários ───
export async function fetchDealerHours(dealerId: string): Promise<DealerHours[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('dealer_hours')
    .select('*')
    .eq('dealer_id', dealerId)
    .order('day_of_week');

  if (error) return [];
  return data as DealerHours[];
}

export async function saveDealerHours(dealerId: string, hours: Omit<DealerHours, 'id' | 'dealer_id'>[]) {
  if (!supabase) return;

  // Deletar horários existentes e inserir novos
  await supabase.from('dealer_hours').delete().eq('dealer_id', dealerId);

  if (hours.length > 0) {
    await supabase.from('dealer_hours').insert(
      hours.map((h) => ({ ...h, dealer_id: dealerId }))
    );
  }
}

// ─── Admin: buscar todos os users ───
export async function fetchAllUsers(): Promise<Profile[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as Profile[];
}

// ─── Admin: buscar todos os listings (qualquer status) ───
export async function fetchAllListings() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('listings')
    .select('*, photos:listing_photos(*), dealership:dealerships(name, verified)')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

// ─── Admin: mudar role de user ───
export async function updateUserRole(userId: string, role: string) {
  if (!supabase) return;
  await supabase.from('profiles').update({ role }).eq('id', userId);
}
