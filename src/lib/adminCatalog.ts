import { supabase } from './supabase';
import type { VehicleType } from '../types';

// ─── Brands CRUD ───

export async function createBrand(data: { name: string; logo_url?: string; country?: string; vehicle_types: VehicleType[] }) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data: brand, error } = await supabase.from('brands').insert(data).select().single();
  if (error) throw error;
  return brand;
}

export async function updateBrand(id: string, data: Partial<{ name: string; logo_url: string; country: string; vehicle_types: VehicleType[] }>) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { error } = await supabase.from('brands').update(data).eq('id', id);
  if (error) throw error;
}

export async function deleteBrand(id: string) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) throw error;
}

// ─── Models CRUD ───

export async function createModel(data: { brand_id: string; name: string; category: string; vehicle_type: VehicleType; year_start?: number; year_end?: number | null }) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data: model, error } = await supabase.from('models').insert(data).select().single();
  if (error) throw error;
  return model;
}

export async function updateModel(id: string, data: Partial<{ name: string; category: string; vehicle_type: VehicleType; year_start: number; year_end: number | null }>) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { error } = await supabase.from('models').update(data).eq('id', id);
  if (error) throw error;
}

export async function deleteModel(id: string) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { error } = await supabase.from('models').delete().eq('id', id);
  if (error) throw error;
}

// ─── Trims CRUD ───

export async function createTrim(data: { model_id: string; name: string; engine_cc?: number; horsepower?: number; fuel?: string; transmission?: string; doors?: number }) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data: trim, error } = await supabase.from('trims').insert(data).select().single();
  if (error) throw error;
  return trim;
}

export async function updateTrim(id: string, data: Partial<{ name: string; engine_cc: number; horsepower: number; fuel: string; transmission: string; doors: number }>) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { error } = await supabase.from('trims').update(data).eq('id', id);
  if (error) throw error;
}

export async function deleteTrim(id: string) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { error } = await supabase.from('trims').delete().eq('id', id);
  if (error) throw error;
}

// ─── Custom Brands (pendientes de aprobación) ───

export async function fetchPendingCustomBrands(): Promise<{ custom_brand: string; count: number }[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('listings')
    .select('custom_brand')
    .eq('is_custom_brand', true)
    .not('custom_brand', 'is', null);

  if (error || !data) return [];

  // Agrupar por custom_brand
  const grouped: Record<string, number> = {};
  data.forEach((row: { custom_brand: string }) => {
    const name = row.custom_brand;
    grouped[name] = (grouped[name] || 0) + 1;
  });

  return Object.entries(grouped).map(([custom_brand, count]) => ({ custom_brand, count }));
}

export async function approveCustomBrand(customBrandName: string, vehicleTypes: VehicleType[], country: string) {
  if (!supabase) throw new Error('Supabase no configurado');

  // 1. Criar marca oficial
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .insert({ name: customBrandName, logo_url: '', country, vehicle_types: vehicleTypes })
    .select()
    .single();

  if (brandError) throw brandError;

  // 2. Atualizar listings que usavam essa custom brand
  const { error: updateError } = await supabase
    .from('listings')
    .update({ brand: customBrandName, is_custom_brand: false, custom_brand: null })
    .eq('custom_brand', customBrandName)
    .eq('is_custom_brand', true);

  if (updateError) throw updateError;

  return brand;
}
