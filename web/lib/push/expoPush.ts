import { createSupabaseServiceClient } from '@/lib/supabase/server';

interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushToEventGuests(eventId: string, message: PushMessage) {
  const service = createSupabaseServiceClient();

  const { data: guests } = await service
    .from('event_guests')
    .select('user_id')
    .eq('event_id', eventId)
    .not('user_id', 'is', null);

  const userIds = [...new Set((guests ?? []).map((g) => g.user_id).filter(Boolean))] as string[];
  if (!userIds.length) return { sent: 0 };

  const { data: tokens } = await service
    .from('guest_push_tokens')
    .select('expo_push_token')
    .in('user_id', userIds);

  const pushTokens = (tokens ?? []).map((t) => t.expo_push_token).filter(Boolean);
  if (!pushTokens.length) return { sent: 0 };

  const chunks: string[][] = [];
  for (let i = 0; i < pushTokens.length; i += 100) {
    chunks.push(pushTokens.slice(i, i + 100));
  }

  let sent = 0;
  for (const chunk of chunks) {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        chunk.map((to) => ({
          to,
          sound: 'default',
          title: message.title,
          body: message.body,
          data: message.data ?? {},
        }))
      ),
    });
    if (res.ok) sent += chunk.length;
  }

  return { sent };
}
