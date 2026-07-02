import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { buildJoinUrl, generateQrDataUrl } from '@/lib/qr';

export interface EventSocialContext {
  eventId: string;
  eventTitle: string;
  joinCode: string;
  joinUrl: string;
  qrDataUrl: string;
}

export async function getEventSocialContext(eventId: string): Promise<EventSocialContext> {
  const service = createSupabaseServiceClient();
  const { data, error } = await service
    .from('events')
    .select('id, title, join_code')
    .eq('id', eventId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Event not found');
  }

  const joinUrl = buildJoinUrl(data.id, data.join_code);
  const qrDataUrl = await generateQrDataUrl(joinUrl, 400);

  return {
    eventId: data.id,
    eventTitle: data.title,
    joinCode: data.join_code,
    joinUrl,
    qrDataUrl,
  };
}
