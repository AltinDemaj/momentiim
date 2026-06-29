import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function verifyGuestMembership(
  eventId: string,
  guestId: string,
  userId: string
): Promise<boolean> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from('event_guests')
    .select('id')
    .eq('id', guestId)
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!data;
}
