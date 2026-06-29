import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { requireAdminOrEventGuest } from '@/lib/guest/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const EVENT_PHOTOS_BUCKET = 'event-photos';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: eventId } = await params;
  const service = createSupabaseServiceClient();

  const { data: slideshow } = await service
    .from('event_slideshows')
    .select('clip_order, audio_tracks, music_storage_path')
    .eq('event_id', eventId)
    .maybeSingle();

  const { data: favorites } = await service
    .from('photos')
    .select('id, storage_path, is_favorite, is_highlight, media_type')
    .eq('event_id', eventId)
    .eq('status', 'published')
    .eq('moderation_status', 'approved')
    .eq('media_type', 'photo')
    .order('is_favorite', { ascending: false })
    .order('is_highlight', { ascending: false })
    .limit(30);

  let clipIds: string[] = [];

  if (slideshow?.clip_order?.length) {
    clipIds = slideshow.clip_order.slice(0, 15);
  } else {
    clipIds = (favorites ?? [])
      .filter((p) => p.is_favorite || p.is_highlight)
      .slice(0, 15)
      .map((p) => p.id);

    if (clipIds.length < 15) {
      const rest = (favorites ?? [])
        .filter((p) => !clipIds.includes(p.id))
        .slice(0, 15 - clipIds.length)
        .map((p) => p.id);
      clipIds = [...clipIds, ...rest];
    }
  }

  const musicPath =
    slideshow?.music_storage_path ??
    (Array.isArray(slideshow?.audio_tracks) && slideshow.audio_tracks[0]
      ? (slideshow.audio_tracks[0] as { storage_path?: string }).storage_path
      : null);

  let musicUrl: string | null = null;
  if (musicPath) {
    const { data: signed } = await service.storage
      .from(EVENT_PHOTOS_BUCKET)
      .createSignedUrl(musicPath, 86400);
    musicUrl = signed?.signedUrl ?? null;
  }

  const clipUrls = await Promise.all(
    clipIds.map(async (id) => {
      const photo = (favorites ?? []).find((p) => p.id === id);
      if (!photo) {
        const { data: row } = await service
          .from('photos')
          .select('storage_path')
          .eq('id', id)
          .maybeSingle();
        if (!row) return null;
        const { data: signed } = await service.storage
          .from(EVENT_PHOTOS_BUCKET)
          .createSignedUrl(row.storage_path, 86400);
        return { id, url: signed?.signedUrl ?? null };
      }
      const { data: signed } = await service.storage
        .from(EVENT_PHOTOS_BUCKET)
        .createSignedUrl(photo.storage_path, 86400);
      return { id, url: signed?.signedUrl ?? null };
    })
  );

  await service
    .from('event_slideshows')
    .upsert(
      {
        event_id: eventId,
        social_reel_clip_order: clipIds,
        social_reel_music_path: musicPath,
      },
      { onConflict: 'event_id' }
    );

  const now = new Date().toISOString();
  await service
    .from('events')
    .update({ social_reel_ready: true, social_reel_generated_at: now })
    .eq('id', eventId);

  return NextResponse.json({
    reel: {
      clip_ids: clipIds,
      clip_duration_ms: 1000,
      music_path: musicPath,
      music_url: musicUrl,
      clips: clipUrls.filter(Boolean),
    },
    generated_at: now,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  const access = await requireAdminOrEventGuest(request, eventId);
  if ('error' in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const service = createSupabaseServiceClient();

  const [{ data: event }, { data: slideshow }] = await Promise.all([
    service
      .from('events')
      .select('social_reel_ready, feature_social_reel')
      .eq('id', eventId)
      .single(),
    service
      .from('event_slideshows')
      .select('social_reel_clip_order, social_reel_music_path')
      .eq('event_id', eventId)
      .maybeSingle(),
  ]);

  if (!event?.feature_social_reel || !event.social_reel_ready) {
    return NextResponse.json({ ready: false });
  }

  const clipIds = slideshow?.social_reel_clip_order ?? [];
  let musicUrl: string | null = null;
  if (slideshow?.social_reel_music_path) {
    const { data: signed } = await service.storage
      .from(EVENT_PHOTOS_BUCKET)
      .createSignedUrl(slideshow.social_reel_music_path, 3600);
    musicUrl = signed?.signedUrl ?? null;
  }

  const clips = await Promise.all(
    clipIds.map(async (id: string) => {
      const { data: photo } = await service
        .from('photos')
        .select('storage_path')
        .eq('id', id)
        .maybeSingle();
      if (!photo) return null;
      const { data: signed } = await service.storage
        .from(EVENT_PHOTOS_BUCKET)
        .createSignedUrl(photo.storage_path, 3600);
      return { id, url: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json({
    ready: true,
    reel: {
      clip_ids: clipIds,
      clip_duration_ms: 1000,
      music_url: musicUrl,
      clips: clips.filter(Boolean),
    },
  });
}
