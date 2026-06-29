import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function requireEventGuest(
  request: NextRequest,
  eventId: string
): Promise<
  | { guestId: string; userId: string }
  | { error: string; status: number }
> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const service = createSupabaseServiceClient();
  const token = authHeader.slice(7);
  const { data: userData, error: userError } = await service.auth.getUser(token);

  if (userError || !userData.user) {
    return { error: 'Invalid session', status: 401 };
  }

  const { data: guest } = await service
    .from('event_guests')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (!guest) {
    return { error: 'Guest not found for this event', status: 403 };
  }

  return { guestId: guest.id, userId: userData.user.id };
}

export async function requireAdminOrEventGuest(
  request: NextRequest,
  eventId: string
): Promise<
  | { kind: 'admin' }
  | { kind: 'guest'; guestId: string; userId: string }
  | { error: string; status: number }
> {
  const admin = await requireAdmin();
  if (!('error' in admin)) {
    return { kind: 'admin' };
  }

  const guest = await requireEventGuest(request, eventId);
  if ('error' in guest) {
    return guest;
  }

  return { kind: 'guest', guestId: guest.guestId, userId: guest.userId };
}
