import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BUCKET = 'event-photos';

type ModerationAction =
  | 'approve'
  | 'reject'
  | 'hide'
  | 'favorite'
  | 'unfavorite'
  | 'pin'
  | 'unpin'
  | 'highlight'
  | 'unhighlight'
  | 'cover_candidate'
  | 'uncover_candidate'
  | 'flag_review'
  | 'clear_review';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();
    const action = body.action as ModerationAction | 'update';
    const note = typeof body.note === 'string' ? body.note : undefined;

    const updates: Record<string, unknown> = {};

    if (action === 'update') {
      if (typeof body.slide_duration_ms === 'number') {
        updates.slide_duration_ms = Math.max(1000, Math.min(30000, body.slide_duration_ms));
      }
      if (typeof body.display_order === 'number') {
        updates.display_order = body.display_order;
      }
      if (body.photo_edits && typeof body.photo_edits === 'object') {
        updates.photo_edits = body.photo_edits;
      }
      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
      }
    } else {
    switch (action) {
      case 'approve':
        updates.moderation_status = 'approved';
        updates.needs_review = false;
        break;
      case 'reject':
        updates.moderation_status = 'rejected';
        if (note) updates.moderation_note = note;
        break;
      case 'hide':
        updates.moderation_status = 'hidden';
        break;
      case 'favorite':
        updates.is_favorite = true;
        break;
      case 'unfavorite':
        updates.is_favorite = false;
        break;
      case 'pin':
        updates.is_pinned = true;
        break;
      case 'unpin':
        updates.is_pinned = false;
        break;
      case 'highlight':
        updates.is_highlight = true;
        break;
      case 'unhighlight':
        updates.is_highlight = false;
        break;
      case 'cover_candidate':
        updates.is_cover_candidate = true;
        break;
      case 'uncover_candidate':
        updates.is_cover_candidate = false;
        break;
      case 'flag_review':
        updates.needs_review = true;
        break;
      case 'clear_review':
        updates.needs_review = false;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    }

    const { data, error } = await auth.supabase
      .from('photos')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ photo: data });
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

    const { id } = await params;
    const service = createSupabaseServiceClient();

    const { data: photo, error: fetchError } = await service
      .from('photos')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    await service.storage.from(BUCKET).remove([photo.storage_path]);

    const { error } = await service.from('photos').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
