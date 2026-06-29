import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

const BUCKET = 'event-photos';

const EXT_TO_MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
};

function resolveAudioContentType(file: File, ext: string): string {
  const fromExt = EXT_TO_MIME[ext];
  if (fromExt) return fromExt;
  if (file.type && file.type.startsWith('audio/')) return file.type;
  return 'audio/mpeg';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: eventId } = await params;
    const form = await request.formData();
    const file = form.get('file');
    const addToTimeline = form.get('addToTimeline') !== 'false';

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
    if (!['mp3', 'm4a', 'wav', 'aac', 'ogg'].includes(ext)) {
      return NextResponse.json({ error: 'Unsupported audio format' }, { status: 400 });
    }

    const clipId = randomUUID();
    const storagePath = `events/${eventId}/audio/${clipId}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const service = createSupabaseServiceClient();

    const { error: uploadError } = await service.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        upsert: false,
        contentType: resolveAudioContentType(file, ext),
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const label = file.name.replace(/\.[^.]+$/, '') || 'Sound';
    const newClip = {
      id: clipId,
      storage_path: storagePath,
      label,
      start_ms: 0,
      duration_ms: 120000,
      trim_start_ms: 0,
      trim_end_ms: null,
      volume: 0.8,
      fade_in_ms: 800,
      fade_out_ms: 1200,
    };

    const { data: existing } = await service
      .from('event_slideshows')
      .select('audio_tracks, audio_clip_order')
      .eq('event_id', eventId)
      .maybeSingle();

    const tracks = [...((existing?.audio_tracks as typeof newClip[] | null) ?? []), newClip];
    const order = [...((existing?.audio_clip_order as string[] | null) ?? [])];
    if (addToTimeline) order.push(clipId);

    const { data, error } = await service
      .from('event_slideshows')
      .upsert(
        {
          event_id: eventId,
          audio_tracks: tracks,
          audio_clip_order: order,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'event_id' }
      )
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: signed } = await service.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
    const audio_tracks = tracks.map((t) =>
      t.id === clipId ? { ...t, url: signed?.signedUrl ?? null } : t
    );

    return NextResponse.json({
      clip: { ...newClip, url: signed?.signedUrl ?? null },
      slideshow: { ...data, audio_tracks },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: eventId } = await params;
    const clipId = new URL(request.url).searchParams.get('clipId');
    if (!clipId) {
      return NextResponse.json({ error: 'clipId required' }, { status: 400 });
    }

    const service = createSupabaseServiceClient();
    const { data: row } = await service
      .from('event_slideshows')
      .select('audio_tracks, audio_clip_order')
      .eq('event_id', eventId)
      .maybeSingle();

    const tracks = ((row?.audio_tracks as { id: string; storage_path: string }[] | null) ?? []).filter(
      (t) => t.id !== clipId
    );
    const removed = ((row?.audio_tracks as { id: string; storage_path: string }[] | null) ?? []).find(
      (t) => t.id === clipId
    );
    const order = ((row?.audio_clip_order as string[] | null) ?? []).filter((id) => id !== clipId);

    if (removed?.storage_path) {
      await service.storage.from(BUCKET).remove([removed.storage_path]);
    }

    await service
      .from('event_slideshows')
      .upsert(
        { event_id: eventId, audio_tracks: tracks, audio_clip_order: order, updated_at: new Date().toISOString() },
        { onConflict: 'event_id' }
      );

    return NextResponse.json({ removed: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
