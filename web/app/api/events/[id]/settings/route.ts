import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/auth';

const patchSchema = z.object({
  venue_name: z.string().max(200).nullable().optional(),
  allow_guest_download: z.boolean().optional(),
  allow_guest_share: z.boolean().optional(),
  allow_guest_video: z.boolean().optional(),
  max_videos_per_guest: z.number().int().min(0).max(10).optional(),
});

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
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    const data = parsed.data;

    if (data.venue_name !== undefined) updates.venue_name = data.venue_name;
    if (data.allow_guest_download !== undefined) {
      updates.allow_guest_download = data.allow_guest_download;
    }
    if (data.allow_guest_share !== undefined) updates.allow_guest_share = data.allow_guest_share;
    if (data.allow_guest_video !== undefined) updates.allow_guest_video = data.allow_guest_video;
    if (data.max_videos_per_guest !== undefined) {
      updates.max_videos_per_guest = data.max_videos_per_guest;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: event, error } = await auth.supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select(
        'venue_name, allow_guest_download, allow_guest_share, allow_guest_video, max_videos_per_guest'
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
