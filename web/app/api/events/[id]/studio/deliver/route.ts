import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { sendPushToEventGuests } from '@/lib/push/expoPush';

/**
 * Momenti Im internal only — deliver curated album to the event client (couple/host).
 * Optionally opens the guest room for all event guests afterward.
 */
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
    const body = await request.json().catch(() => ({}));
    const openGuestRoom = body.open_guest_room === true;
    const note = typeof body.delivery_note === 'string' ? body.delivery_note.trim() : null;
    const photoIds: string[] | null = Array.isArray(body.photo_ids) && body.photo_ids.length > 0
      ? body.photo_ids
      : null;

    const { supabase } = auth;

    const { data: publishResult, error: publishError } = await supabase.rpc('publish_selected_photos', {
      p_event_id: eventId,
      p_photo_ids: photoIds,
    });

    if (publishError) {
      return NextResponse.json({ error: publishError.message }, { status: 500 });
    }

    const service = createSupabaseServiceClient();
    const now = new Date().toISOString();

    const eventUpdates: Record<string, unknown> = {
      studio_status: 'delivered',
      client_album_delivered_at: now,
      client_album_note: note,
    };

    if (openGuestRoom) {
      eventUpdates.guest_album_live = true;
      eventUpdates.revealed_at = now;
    }

    const { data: event, error: eventError } = await service
      .from('events')
      .update(eventUpdates)
      .eq('id', eventId)
      .select('id, title, client_name, studio_status, client_album_delivered_at, guest_album_live, revealed_at')
      .single();

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    if (openGuestRoom && event) {
      await sendPushToEventGuests(eventId, {
        title: event.title ?? 'Momenti Im',
        body: 'Kujtimet e tua janë gati — hap albumin tani!',
        data: { eventId, screen: 'album' },
      });
    }

    return NextResponse.json({
      ...publishResult,
      event,
      delivered_to_client: true,
      guest_room_opened: openGuestRoom,
    });
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

    const updates: Record<string, unknown> = {};
    if (body.studio_status === 'collecting' || body.studio_status === 'in_studio' || body.studio_status === 'delivered') {
      updates.studio_status = body.studio_status;
    }
    if (typeof body.client_album_note === 'string') {
      updates.client_album_note = body.client_album_note.trim() || null;
    }
    if (typeof body.guest_album_live === 'boolean') {
      updates.guest_album_live = body.guest_album_live;
      if (body.guest_album_live) {
        updates.revealed_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates' }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select('id, studio_status, client_album_delivered_at, client_album_note, guest_album_live, revealed_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (body.guest_album_live === true && data) {
      const { data: eventMeta } = await auth.supabase
        .from('events')
        .select('title')
        .eq('id', eventId)
        .maybeSingle();
      await sendPushToEventGuests(eventId, {
        title: eventMeta?.title ?? 'Momenti Im',
        body: 'Kujtimet e tua janë gati — hap albumin tani!',
        data: { eventId, screen: 'album' },
      });
    }

    return NextResponse.json({ event: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
