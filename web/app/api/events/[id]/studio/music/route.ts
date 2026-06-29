import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BUCKET = 'event-photos';

const EXT_TO_MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
};

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

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
    if (!['mp3', 'm4a', 'wav', 'aac', 'ogg'].includes(ext)) {
      return NextResponse.json({ error: 'Unsupported audio format' }, { status: 400 });
    }

    const storagePath = `events/${eventId}/music/track.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const service = createSupabaseServiceClient();
    const contentType = EXT_TO_MIME[ext] ?? (file.type.startsWith('audio/') ? file.type : 'audio/mpeg');

    const { error: uploadError } = await service.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { upsert: true, contentType });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data, error } = await service
      .from('event_slideshows')
      .upsert(
        {
          event_id: eventId,
          music_storage_path: storagePath,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'event_id' }
      )
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: signed } = await service.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({
      slideshow: { ...data, music_url: signed?.signedUrl ?? null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
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

    const { data: row } = await service
      .from('event_slideshows')
      .select('music_storage_path')
      .eq('event_id', eventId)
      .maybeSingle();

    if (row?.music_storage_path) {
      await service.storage.from(BUCKET).remove([row.music_storage_path]);
    }

    await service
      .from('event_slideshows')
      .update({ music_storage_path: null, updated_at: new Date().toISOString() })
      .eq('event_id', eventId);

    return NextResponse.json({ removed: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
