import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BUCKET = 'event-photos';

type RawAudio = {
  id: string;
  storage_path: string;
  label?: string;
  start_ms?: number;
  duration_ms?: number;
  trim_start_ms?: number;
  trim_end_ms?: number | null;
  volume?: number;
  fade_in_ms?: number;
  fade_out_ms?: number;
};

async function signSlideshow(service: ReturnType<typeof createSupabaseServiceClient>, slideshow: Record<string, unknown>) {
  let musicUrl: string | null = null;
  if (slideshow.music_storage_path && typeof slideshow.music_storage_path === 'string') {
    const { data: signed } = await service.storage
      .from(BUCKET)
      .createSignedUrl(slideshow.music_storage_path, 3600);
    musicUrl = signed?.signedUrl ?? null;
  }

  const rawTracks = (slideshow.audio_tracks as RawAudio[] | null) ?? [];
  const audio_tracks = await Promise.all(
    rawTracks.map(async (t) => {
      const { data: signed } = await service.storage.from(BUCKET).createSignedUrl(t.storage_path, 3600);
      return { ...t, url: signed?.signedUrl ?? null };
    })
  );

  return {
    ...slideshow,
    music_url: musicUrl,
    audio_tracks,
    audio_clip_order: (slideshow.audio_clip_order as string[] | null) ?? [],
  };
}

const DEFAULT_SLIDESHOW = {
  music_volume: 0.8,
  music_fade_in_ms: 800,
  music_fade_out_ms: 1200,
  music_trim_start_ms: 0,
  music_trim_end_ms: null,
  clip_order: [] as string[],
  audio_tracks: [] as RawAudio[],
  audio_clip_order: [] as string[],
  transition: 'crossfade',
  shuffle: false,
  loop: true,
  publish_mode: 'approved_collection',
  hide_videos: false,
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: eventId } = await params;
    const service = createSupabaseServiceClient();

    const { data: slideshow, error } = await service
      .from('event_slideshows')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const payload = slideshow
      ? await signSlideshow(service, slideshow)
      : { event_id: eventId, ...DEFAULT_SLIDESHOW, music_storage_path: null, music_url: null, updated_at: null };

    return NextResponse.json({ slideshow: payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const service = createSupabaseServiceClient();

    const allowed = [
      'music_volume',
      'music_fade_in_ms',
      'music_fade_out_ms',
      'music_trim_start_ms',
      'music_trim_end_ms',
      'clip_order',
      'audio_tracks',
      'audio_clip_order',
      'transition',
      'shuffle',
      'loop',
      'publish_mode',
      'hide_videos',
      'clip_transitions',
    ] as const;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const { data, error } = await service
      .from('event_slideshows')
      .upsert({ event_id: eventId, ...updates }, { onConflict: 'event_id' })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ slideshow: await signSlideshow(service, data) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
