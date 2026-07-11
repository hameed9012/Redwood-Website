import { db } from '../lib/supabase';

export interface CarouselSlide { id: string; title: string; body: string; imageUrl: string; sortOrder: number; }
interface Row { id: string; title: string; body: string; image_url: string; sort_order: number; }
const toSlide = (r: Row): CarouselSlide => ({ id: r.id, title: r.title, body: r.body, imageUrl: r.image_url, sortOrder: r.sort_order });

/** A collision-resistant object name. */
export function carouselFilename(ext: string): string {
  const hex = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `${Date.now()}-${hex}.${ext}`;
}

/** Upload image bytes to the public `carousel` bucket, return the public URL. */
export async function uploadCarouselImage(bytes: Uint8Array, contentType: string, ext: string): Promise<string> {
  const name = carouselFilename(ext);
  const up = await db().storage.from('carousel').upload(name, bytes, { contentType, upsert: false });
  if (up.error) throw up.error;
  return db().storage.from('carousel').getPublicUrl(name).data.publicUrl;
}

export async function addSlide(title: string, body: string, imageUrl: string): Promise<void> {
  const { data: maxRow, error: maxErr } = await db().from('carousel_slides').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  if (maxErr) throw maxErr;
  const sortOrder = ((maxRow as { sort_order: number } | null)?.sort_order ?? 0) + 1;
  const { error } = await db().from('carousel_slides').insert({ title, body, image_url: imageUrl, sort_order: sortOrder });
  if (error) throw error;
}

export async function removeSlideByTitle(title: string): Promise<number> {
  const { data, error } = await db().from('carousel_slides').delete().ilike('title', title).select('id');
  if (error) throw error;
  return (data ?? []).length;
}

export async function listSlides(): Promise<CarouselSlide[]> {
  const { data, error } = await db().from('carousel_slides').select('id, title, body, image_url, sort_order').order('sort_order', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(toSlide);
}
