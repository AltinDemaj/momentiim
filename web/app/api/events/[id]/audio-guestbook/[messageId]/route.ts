import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BUCKET = 'event-photos';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: eventId, messageId } = await params;
  const service = createSupabaseServiceClient();

  const { data: row, error: fetchError } = await service
    .from('audio_messages')
    .select('id, storage_path')
    .eq('id', messageId)
    .eq('event_id', eventId)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  await service.storage.from(BUCKET).remove([row.storage_path]);

  const { error } = await service.from('audio_messages').delete().eq('id', messageId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
