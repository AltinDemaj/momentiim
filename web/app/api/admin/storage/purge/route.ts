import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

/**
 * Reclaim Supabase storage: old staging photos + orphan global blobs from failed uploads.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const days = typeof body.older_than_days === 'number' ? body.older_than_days : 7;

    const service = createSupabaseServiceClient();

    const [staging, orphans] = await Promise.all([
      service.rpc('purge_stale_staging_photos', { p_older_than_days: days }),
      service.rpc('purge_orphan_media_blobs', { p_older_than_hours: 24 }),
    ]);

    if (staging.error) {
      return NextResponse.json({ error: staging.error.message }, { status: 500 });
    }
    if (orphans.error) {
      return NextResponse.json({ error: orphans.error.message }, { status: 500 });
    }

    return NextResponse.json({
      staging: staging.data,
      orphans: orphans.data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
