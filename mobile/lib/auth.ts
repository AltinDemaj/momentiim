import { supabase } from './supabase';
import { getDeviceId } from './device';
import { addRecentRoom } from './recentRooms';

import { API_URL } from './config';

export async function ensureGuestSession(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user) return;
    await supabase.auth.signOut();
  }

  const { error: anonError } = await supabase.auth.signInAnonymously();
  if (!anonError) return;

  const deviceId = await getDeviceId();

  const res = await fetch(`${API_URL}/api/guest/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error ??
        'Could not sign in. Make sure the admin server is running on the same Wi‑Fi.'
    );
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  if (sessionError) {
    throw new Error(sessionError.message);
  }
}

export async function joinRoom(eventId: string) {
  await ensureGuestSession();

  const deviceId = await getDeviceId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc('register_event_guest', {
    p_event_id: eventId,
    p_device_id: deviceId,
    p_user_id: user?.id ?? undefined,
  });

  if (error) {
    throw new Error(error.message);
  }

  const guest = data as {
    guest_id: string;
    photos_remaining: number;
    per_guest_limit: number;
    event_title: string;
  };

  const { data: eventRow } = await supabase
    .from('events')
    .select('join_code')
    .eq('id', eventId)
    .maybeSingle();

  await addRecentRoom({
    eventId,
    title: guest.event_title,
    joinCode: eventRow?.join_code ?? '',
  });

  return guest;
}
