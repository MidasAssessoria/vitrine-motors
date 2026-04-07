import { supabase } from './supabase';
import type { Listing } from '../types';
import { computeQualityScore } from './boost';
import { sanitizeText, sanitizePhoneNumber, validateImageFile } from './sanitize';
import { notifyListingApproved, notifyListingRejected } from './notifications';

export interface CreateListingData {
  vehicle_type: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  version: string;
  condition: string;
  category: string;
  fuel: string;
  transmission?: string;
  mileage: number;
  price_usd: number;
  color: string;
  doors?: number;
  description: string;
  city: string;
  department: string;
  whatsapp_contact: string;
  // Enterprise fields
  trim_id?: string | null;
  color_ext?: string;
  color_int?: string;
  plate_masked?: string;
  equipment?: Record<string, boolean>;
  // Moto-specific
  engine_cc?: number;
  brake_type?: string;
  starter?: string;
  cooling?: string;
  // Barco-specific
  length_ft?: number;
  engine_hp?: number;
  hours_used?: number;
  hull_material?: string;
  passenger_capacity?: number;
  // Custom brand
  custom_brand?: string;
  is_custom_brand?: boolean;
}

// ─── Criar listing ───
export async function createListing(data: CreateListingData, userId: string, isVerified?: boolean) {
  if (!supabase) throw new Error('Supabase no configurado');

  // Sanitizar campos de texto contra XSS
  data.title = sanitizeText(data.title);
  data.description = sanitizeText(data.description);
  data.whatsapp_contact = sanitizePhoneNumber(data.whatsapp_contact);
  if (data.color) data.color = sanitizeText(data.color);
  if (data.color_ext) data.color_ext = sanitizeText(data.color_ext);
  if (data.color_int) data.color_int = sanitizeText(data.color_int);
  if (data.custom_brand) data.custom_brand = sanitizeText(data.custom_brand);

  const qualityScore = computeQualityScore({
    description: data.description,
    price_usd: data.price_usd,
    brand: data.brand,
    model: data.model,
    year: data.year,
    fuel: data.fuel,
    transmission: data.transmission,
    equipment: data.equipment,
  });

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      ...data,
      seller_id: userId,
      status: isVerified ? 'active' : 'pending',
      featured: false,
      views_count: 0,
      quality_score: qualityScore,
      tier: 'free',
      last_bump_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return listing;
}

// ─── Upload de foto ───
export async function uploadListingPhoto(
  file: File,
  userId: string,
  listingId: string,
  orderIndex: number
) {
  if (!supabase) throw new Error('Supabase no configurado');

  // Validar arquivo antes do upload
  const fileValidation = validateImageFile(file);
  if (!fileValidation.valid) {
    throw new Error(fileValidation.error);
  }

  const ext = file.name.split('.').pop();
  const path = `${userId}/${listingId}/${orderIndex}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('vehicle-photos')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('vehicle-photos')
    .getPublicUrl(path);

  // Inserir registro na tabela listing_photos
  const { data: photo, error: dbError } = await supabase
    .from('listing_photos')
    .insert({
      listing_id: listingId,
      url: publicUrl,
      order_index: orderIndex,
      is_cover: orderIndex === 0,
    })
    .select()
    .single();

  if (dbError) throw dbError;

  // Recalcular quality score após nova foto
  recalculateQualityScore(listingId).catch(() => {});

  return photo;
}

// ─── Buscar listings ativos (com fotos e dealership) ───
export async function fetchActiveListings() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      photos:listing_photos(*),
      dealership:dealerships(*)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching listings:', error);
    return [];
  }

  return data as Listing[];
}

// ─── Buscar TODOS os listings (admin) ───
export async function fetchAllListings() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      photos:listing_photos(*),
      dealership:dealerships(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all listings:', error);
    return [];
  }

  return data as Listing[];
}

// ─── Atualizar listing (admin/seller) ───
export async function updateListing(id: string, updates: Partial<Listing>) {
  if (!supabase) throw new Error('Supabase no configurado');

  // Remover campos relacionais que não pertencem à tabela
  const { photos, dealership, trim, ...cleanUpdates } = updates as Listing & { photos?: unknown; dealership?: unknown; trim?: unknown };
  void photos; void dealership; void trim;

  const { error } = await supabase
    .from('listings')
    .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// ─── Buscar listing por ID ───
export async function fetchListingById(id: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      photos:listing_photos(*),
      dealership:dealerships(*)
    `)
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Listing;
}

// ─── Listings do vendedor ───
export async function fetchSellerListings(sellerId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      photos:listing_photos(*)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as Listing[];
}

// ─── Atualizar status (admin) ───
export async function updateListingStatus(id: string, status: string) {
  if (!supabase) throw new Error('Supabase no configurado');

  const { error } = await supabase
    .from('listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;

  // Enviar notificações quando status muda para active ou rejected
  if (status === 'active' || status === 'rejected') {
    const listing = await fetchListingById(id);
    if (listing) {
      // Notificação in-app
      if (status === 'active') {
        notifyListingApproved(listing.seller_id, listing.title, id).catch(() => {});
      } else {
        notifyListingRejected(listing.seller_id, listing.title).catch(() => {});
      }

      // Notificação por email (Edge Function)
      supabase.functions.invoke('send-notification', {
        body: {
          type: status === 'active' ? 'listing_approved' : 'listing_rejected',
          listing_id: id,
          seller_id: listing.seller_id,
        },
      }).catch(() => {});
    }
  }
}

// ─── Toggle featured (admin) ───
export async function toggleListingFeatured(id: string, featured: boolean) {
  if (!supabase) throw new Error('Supabase no configurado');

  const { error } = await supabase
    .from('listings')
    .update({ featured })
    .eq('id', id);

  if (error) throw error;
}

// ─── Deletar listing ───
export async function deleteListing(id: string) {
  if (!supabase) throw new Error('Supabase no configurado');

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── Incrementar views ───
export async function incrementViews(id: string) {
  if (!supabase) return;

  const { error } = await supabase.rpc('increment_views', { p_listing_id: id });
  if (error) {
    // Fallback: buscar count atual e incrementar
    const { data } = await supabase
      .from('listings')
      .select('views_count')
      .eq('id', id)
      .single();
    if (data) {
      await supabase
        .from('listings')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', id);
    }
  }
}

// ─── Deletar foto de listing ───
export async function deleteListingPhoto(photoId: string, photoUrl: string) {
  if (!supabase) throw new Error('Supabase no configurado');

  // Remover do storage
  const urlParts = photoUrl.split('/vehicle-photos/');
  if (urlParts.length > 1) {
    const storagePath = decodeURIComponent(urlParts[1]);
    await supabase.storage.from('vehicle-photos').remove([storagePath]);
  }

  // Remover da tabela
  const { error } = await supabase
    .from('listing_photos')
    .delete()
    .eq('id', photoId);

  if (error) throw error;
}

// ─── Solicitar inspeção (seller) ───
export async function requestInspection(id: string) {
  if (!supabase) throw new Error('Supabase no configurado');

  // Verificar pré-condições: listing deve ser active e inspection_status none
  const listing = await fetchListingById(id);
  if (!listing) throw new Error('Anuncio no encontrado');
  if (listing.status !== 'active') throw new Error('Solo anuncios activos pueden solicitar inspección');
  if (listing.inspection_status && listing.inspection_status !== 'none') {
    throw new Error('Este anuncio ya tiene una inspección en curso o completada');
  }

  const { error } = await supabase
    .from('listings')
    .update({ inspection_status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// ─── Atualizar status de inspeção (admin) ───
export async function updateInspectionStatus(
  id: string,
  status: 'approved' | 'rejected',
  inspectionUrl?: string
) {
  if (!supabase) throw new Error('Supabase no configurado');

  const updates: Record<string, unknown> = {
    inspection_status: status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'approved' && inspectionUrl) {
    updates.inspection_url = inspectionUrl;
  }

  const { error } = await supabase
    .from('listings')
    .update(updates)
    .eq('id', id);

  if (error) throw error;

  // Recalcular quality score — inspeção aprovada aumenta a nota
  recalculateQualityScore(id).catch(() => {});
}

// ─── Recalcular quality score após mudanças ───
export async function recalculateQualityScore(listingId: string) {
  if (!supabase) return;

  const listing = await fetchListingById(listingId);
  if (!listing) return;

  const score = computeQualityScore({
    photos: listing.photos,
    description: listing.description,
    inspection_status: listing.inspection_status,
    price_usd: listing.price_usd,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    fuel: listing.fuel,
    transmission: listing.transmission,
  });

  await supabase
    .from('listings')
    .update({ quality_score: score })
    .eq('id', listingId);
}
