import { getSupabase } from './supabase';

export interface DbSlide {
  title: string;
  body: string;
  imageUrl: string;
}

/** DB slides if any, else the fallback. Pure. */
export function pickSlides<T>(dbSlides: T[], fallback: T[]): T[] {
  return dbSlides.length ? dbSlides : fallback;
}

/** Client-side fetch of active slides. Returns [] on missing creds or error. */
export async function loadSlides(): Promise<DbSlide[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('carousel_slides')
    .select('title, body, image_url')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data ?? []).map((r: { title: string; body: string; image_url: string }) => ({ title: r.title, body: r.body, imageUrl: r.image_url }));
}
