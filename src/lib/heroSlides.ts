import { supabase } from './supabase';
import type { HeroSlide } from '../types';

// ─── Fetch (público) ───

export async function fetchActiveHeroSlides(): Promise<HeroSlide[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('active', true)
    .order('order_index', { ascending: true });
  if (error) return [];
  return data as HeroSlide[];
}

// ─── Fetch (admin) ───

export async function fetchAllHeroSlides(): Promise<HeroSlide[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .order('order_index', { ascending: true });
  if (error) return [];
  return data as HeroSlide[];
}

// ─── CRUD ───

export async function createHeroSlide(data: {
  title: string;
  desktop_url: string;
  tablet_url: string;
  mobile_url: string;
  order_index: number;
}) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data: slide, error } = await supabase
    .from('hero_slides')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return slide as HeroSlide;
}

export async function updateHeroSlide(id: string, updates: Partial<Omit<HeroSlide, 'id' | 'created_at'>>) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { error } = await supabase
    .from('hero_slides')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteHeroSlide(id: string) {
  if (!supabase) throw new Error('Supabase no configurado');

  // Limpar arquivos do storage primeiro
  await deleteHeroBannerFiles(id).catch(() => {});

  const { error } = await supabase
    .from('hero_slides')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── Upload ───

export async function uploadHeroBanner(
  file: File,
  slideId: string,
  variant: 'desktop' | 'tablet' | 'mobile'
): Promise<string> {
  if (!supabase) throw new Error('Supabase no configurado');

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `slides/${slideId}/${variant}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('hero-banners')
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('hero-banners')
    .getPublicUrl(path);

  return publicUrl;
}

// ─── Delete files do storage ───

async function deleteHeroBannerFiles(slideId: string) {
  if (!supabase) return;

  const { data: files } = await supabase.storage
    .from('hero-banners')
    .list(`slides/${slideId}`);

  if (files && files.length > 0) {
    const paths = files.map((f) => `slides/${slideId}/${f.name}`);
    await supabase.storage.from('hero-banners').remove(paths);
  }
}
