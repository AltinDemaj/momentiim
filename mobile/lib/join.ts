import { supabase } from './supabase';

export async function resolveJoinCode(code: string) {
  const { data, error } = await supabase.rpc('resolve_join_code', {
    p_code: code.toUpperCase().trim(),
  });

  if (error) {
    throw new Error(error.message.includes('INVALID_JOIN_CODE') ? 'Invalid code' : error.message);
  }

  return data as {
    event_id: string;
    event_title: string;
    join_code: string;
  };
}

export function extractEventIdFromUrl(url: string): string | null {
  const uuidMatch = url.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  return uuidMatch?.[0] ?? null;
}
