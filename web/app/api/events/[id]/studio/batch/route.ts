import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';

type BatchAction =
  | 'approve'
  | 'reject'
  | 'hide'
  | 'favorite'
  | 'delete'
  | 'flag_review'
  | 'reorder';

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
    const body = await request.json();
    const action = body.action as BatchAction;
    const photoIds: string[] = Array.isArray(body.photo_ids) ? body.photo_ids : [];
    const order: string[] = Array.isArray(body.order) ? body.order : [];

    if (action === 'reorder') {
      if (order.length === 0) {
        return NextResponse.json({ error: 'order required' }, { status: 400 });
      }
      await Promise.all(
        order.map((photoId, index) =>
          auth.supabase
            .from('photos')
            .update({ display_order: index })
            .eq('id', photoId)
            .eq('event_id', eventId)
        )
      );
      return NextResponse.json({ updated: order.length });
    }

    if (photoIds.length === 0) {
      return NextResponse.json({ error: 'photo_ids required' }, { status: 400 });
    }

    if (action === 'delete') {
      const service = auth.supabase;
      const { data: rows } = await service
        .from('photos')
        .select('id, storage_path')
        .in('id', photoIds)
        .eq('event_id', eventId);

      if (rows?.length) {
        await service.storage
          .from('event-photos')
          .remove(rows.map((r) => r.storage_path));
        await service.from('photos').delete().in('id', photoIds);
      }
      return NextResponse.json({ deleted: rows?.length ?? 0 });
    }

    const updates: Record<string, unknown> = {};
    switch (action) {
      case 'approve':
        updates.moderation_status = 'approved';
        updates.needs_review = false;
        break;
      case 'reject':
        updates.moderation_status = 'rejected';
        break;
      case 'hide':
        updates.moderation_status = 'hidden';
        break;
      case 'favorite':
        updates.is_favorite = true;
        break;
      case 'flag_review':
        updates.needs_review = true;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error } = await auth.supabase
      .from('photos')
      .update(updates)
      .in('id', photoIds)
      .eq('event_id', eventId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ updated: photoIds.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
