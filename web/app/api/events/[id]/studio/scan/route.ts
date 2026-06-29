import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';

/** Heuristic content scan — flags items for review, never auto-deletes */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: eventId } = await params;

    const { data: photos, error } = await auth.supabase
      .from('photos')
      .select('id, storage_path, media_type, created_at')
      .eq('event_id', eventId)
      .eq('status', 'staging');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const flagged: string[] = [];
    const pathCounts = new Map<string, number>();

    for (const photo of photos ?? []) {
      const flags: string[] = [];
      const base = photo.storage_path.split('/').pop() ?? '';

      if (photo.media_type === 'photo') {
        if (base.includes('screenshot') || base.includes('screen')) {
          flags.push('possible_screenshot');
        }
      }

      if (photo.media_type === 'video') {
        flags.push('video_review');
      }

      const hourKey = photo.created_at.slice(0, 13);
      const burstKey = `${hourKey}-${photo.media_type}`;
      pathCounts.set(burstKey, (pathCounts.get(burstKey) ?? 0) + 1);
      if ((pathCounts.get(burstKey) ?? 0) > 8) {
        flags.push('burst_duplicate');
      }

      if (flags.length > 0) {
        await auth.supabase
          .from('photos')
          .update({ needs_review: true, review_flags: flags })
          .eq('id', photo.id);
        flagged.push(photo.id);
      }
    }

    return NextResponse.json({ scanned: photos?.length ?? 0, flagged: flagged.length, flagged_ids: flagged });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
