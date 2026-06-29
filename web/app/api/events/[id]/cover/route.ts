import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BUCKET = 'event-photos';

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

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const storagePath = `events/${eventId}/cover.${safeExt}`;

    const service = createSupabaseServiceClient();
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await service.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { error: updateError } = await auth.supabase
      .from('events')
      .update({ cover_image_path: storagePath })
      .eq('id', eventId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { data: signed } = await service.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({
      cover_image_path: storagePath,
      cover_url: signed?.signedUrl ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const { data: event } = await auth.supabase
      .from('events')
      .select('cover_image_path')
      .eq('id', eventId)
      .single();

    if (!event?.cover_image_path) {
      return NextResponse.json({ cover_url: null });
    }

    const service = createSupabaseServiceClient();
    const { data: signed } = await service.storage
      .from(BUCKET)
      .createSignedUrl(event.cover_image_path, 3600);

    return NextResponse.json({
      cover_image_path: event.cover_image_path,
      cover_url: signed?.signedUrl ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
