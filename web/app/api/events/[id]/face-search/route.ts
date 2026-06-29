import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { computeImageSignature } from '@/lib/image-signature';

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

  const { data: photos, error } = await service
    .from('photos')
    .select('id, storage_path, media_type')
    .eq('event_id', eventId)
    .eq('media_type', 'photo')
    .in('status', ['staging', 'published']);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let indexed = 0;

  for (const photo of photos ?? []) {
    const { data: blob, error: dlError } = await service.storage
      .from(EVENT_PHOTOS_BUCKET)
      .download(photo.storage_path);

    if (dlError || !blob) continue;

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const sig = computeImageSignature(bytes);

    await service.rpc('upsert_photo_face_signature', {
      p_photo_id: photo.id,
      p_event_id: eventId,
      p_signatures: sig,
    });
    indexed += 1;
  }

  return NextResponse.json({ indexed, total: photos?.length ?? 0 });
}

const searchSchema = z.object({
  event_id: z.string().uuid(),
  guest_id: z.string().uuid(),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = searchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = createSupabaseServiceClient();
    const token = authHeader.slice(7);
    const { data: userData, error: userError } = await service.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { event_id: eventId, guest_id: guestId } = parsed.data;

    const { data: guest } = await service
      .from('event_guests')
      .select('id')
      .eq('id', guestId)
      .eq('event_id', eventId)
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 403 });
    }

    const { data: selfie } = await service
      .from('guest_selfies')
      .select('face_signature')
      .eq('event_id', eventId)
      .eq('guest_id', guestId)
      .maybeSingle();

    const guestSig = (selfie?.face_signature as number[] | null) ?? [];

    const [{ data: ownPhotos }, { data: signatures }, { data: published }] = await Promise.all([
      service
        .from('photos')
        .select('id')
        .eq('event_id', eventId)
        .eq('uploaded_by_guest_id', guestId)
        .eq('status', 'published'),
      service.from('photo_face_signatures').select('photo_id, signatures').eq('event_id', eventId),
      service
        .from('photos')
        .select('id, storage_path, uploaded_by_guest_id')
        .eq('event_id', eventId)
        .eq('status', 'published')
        .eq('media_type', 'photo'),
    ]);

    const ownIds = new Set((ownPhotos ?? []).map((p) => p.id));
    const sigMap = new Map(
      (signatures ?? []).map((s) => [s.photo_id, s.signatures as number[]])
    );

    const matched = new Set<string>(ownIds);

    if (guestSig.length > 0) {
      for (const row of signatures ?? []) {
        const sig = row.signatures as number[];
        if (sig.length === 0) continue;
        let dot = 0;
        const n = Math.min(sig.length, guestSig.length);
        for (let i = 0; i < n; i++) dot += sig[i] * guestSig[i];
        if (dot >= 0.82) matched.add(row.photo_id);
      }
    }

    const results = (published ?? []).filter((p) => matched.has(p.id));

    const withUrls = await Promise.all(
      results.map(async (photo) => {
        const { data: signed } = await service.storage
          .from(EVENT_PHOTOS_BUCKET)
          .createSignedUrl(photo.storage_path, 3600);
        return {
          id: photo.id,
          url: signed?.signedUrl ?? null,
          is_own: photo.uploaded_by_guest_id === guestId,
        };
      })
    );

    return NextResponse.json({
      photo_ids: Array.from(matched),
      photos: withUrls,
      indexed_count: sigMap.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
