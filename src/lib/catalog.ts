import { supabase } from './supabase';
import type { Brand, Model, Trim, VehicleType } from '../types';

export async function fetchBrands(vehicleType?: VehicleType): Promise<Brand[]> {
  if (!supabase) return [];
  let query = supabase.from('brands').select('*').order('name');
  if (vehicleType) {
    query = query.contains('vehicle_types', [vehicleType]);
  }
  const { data, error } = await query;
  if (error) return [];
  return data as Brand[];
}

export async function fetchModelsByBrand(brandId: string, vehicleType?: VehicleType): Promise<Model[]> {
  if (!supabase) return [];
  let query = supabase.from('models').select('*').eq('brand_id', brandId).order('name');
  if (vehicleType) {
    query = query.eq('vehicle_type', vehicleType);
  }
  const { data, error } = await query;
  if (error) return [];
  return data as Model[];
}

export async function fetchTrimsByModel(modelId: string): Promise<Trim[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('trims').select('*').eq('model_id', modelId).order('name');
  if (error) return [];
  return data as Trim[];
}

export async function fetchFullCatalog(vehicleType?: VehicleType): Promise<(Brand & { models: (Model & { trims: Trim[] })[] })[]> {
  if (!supabase) return [];
  let query = supabase.from('brands').select('*, models(*, trims(*))').order('name');
  if (vehicleType) {
    query = query.contains('vehicle_types', [vehicleType]);
  }
  const { data, error } = await query;
  if (error) return [];
  return data as (Brand & { models: (Model & { trims: Trim[] })[] })[];
}
