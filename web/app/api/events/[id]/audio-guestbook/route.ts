import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BUCKET = 'event-photos';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: eventId } = await params;
  const service = createSupabaseServiceClient();

  const { data: rows, error } = await service
    .from('audio_messages')
    .select('id, guest_id, storage_path, duration_ms, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const messages = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data: signed } = await service.storage
        .from(BUCKET)
        .createSignedUrl(row.storage_path, 3600);
      return {
        ...row,
        url: signed?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json({ messages, count: messages.length });
}
