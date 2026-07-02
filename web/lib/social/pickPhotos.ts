import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BUCKET = 'event-photos';

export interface PickedPhoto {
  id: string;
  event_id: string;
  storage_path: string;
  thumb_storage_path: string | null;
  is_favorite: boolean;
  is_highlight: boolean;
  event_title: string;
}

export async function pickDailyPhotos(limit = 3): Promise<PickedPhoto[]> {
  const service = createSupabaseServiceClient();

  const { data: usedRows } = await service
    .from('social_content_drafts')
    .select('photo_ids')
    .eq('status', 'approved');

  const usedIds = new Set<string>();
  for (const row of usedRows ?? []) {
    for (const id of row.photo_ids ?? []) {
      usedIds.add(id);
    }
  }

  const { data: photos, error } = await service
    .from('photos')
    .select(`
      id,
      event_id,
      storage_path,
      thumb_storage_path,
      is_favorite,
      is_highlight,
      created_at,
      events ( title )
    `)
    .eq('status', 'published')
    .eq('moderation_status', 'approved')
    .eq('media_type', 'photo')
    .order('is_favorite', { ascending: false })
    .order('is_highlight', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  const picked: PickedPhoto[] = [];
  for (const row of photos ?? []) {
    if (usedIds.has(row.id)) continue;
    const events = row.events as { title: string } | { title: string }[] | null;
    const eventTitle = Array.isArray(events) ? events[0]?.title : events?.title;
    picked.push({
      id: row.id,
      event_id: row.event_id,
      storage_path: row.storage_path,
      thumb_storage_path: row.thumb_storage_path,
      is_favorite: row.is_favorite ?? false,
      is_highlight: row.is_highlight ?? false,
      event_title: eventTitle ?? 'Event',
    });
    if (picked.length >= limit) break;
  }

  return picked;
}

export async function signedPhotoUrl(storagePath: string, ttlSeconds = 3600): Promise<string> {
  const service = createSupabaseServiceClient();
  const { data, error } = await service.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, ttlSeconds);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Failed to sign photo URL');
  }
  return data.signedUrl;
}

export async function downloadPhotoBuffer(storagePath: string): Promise<Buffer> {
  const service = createSupabaseServiceClient();
  const { data, error } = await service.storage.from(BUCKET).download(storagePath);
  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to download photo');
  }
  return Buffer.from(await data.arrayBuffer());
}
