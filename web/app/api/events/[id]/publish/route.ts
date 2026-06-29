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
    const { supabase } = auth;

    let photoIds: string[] | null = null;
    try {
      const body = await request.json();
      if (Array.isArray(body?.photo_ids) && body.photo_ids.length > 0) {
        photoIds = body.photo_ids;
      }
    } catch {
      // empty body = publish all approved
    }

    const { data, error } = await supabase.rpc('publish_selected_photos', {
      p_event_id: eventId,
      p_photo_ids: photoIds,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** List staging photos with signed download URLs for admin inbox */
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

    const { data: photos, error } = await service
      .from('photos')
      .select(
        'id, storage_path, status, created_at, uploaded_by_guest_id, media_type, moderation_status, is_favorite, is_pinned, is_highlight, is_cover_candidate, needs_review, review_flags, display_order, slide_duration_ms, photo_edits'
      )
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const withUrls = await Promise.all(
      (photos ?? []).map(async (photo) => {
        const { data: signed } = await service.storage
          .from(BUCKET)
          .createSignedUrl(photo.storage_path, 3600);

        return {
          ...photo,
          download_url: signed?.signedUrl ?? null,
        };
      })
    );

    const staging = withUrls.filter((p) => p.status === 'staging');
    const published = withUrls.filter((p) => p.status === 'published');

    return NextResponse.json({
      staging,
      published,
      staging_count: staging.length,
      published_count: published.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
