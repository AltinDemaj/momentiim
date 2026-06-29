import type { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function enforceRateLimit(
  bucketKey: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  const service = createSupabaseServiceClient();
  const { data, error } = await service.rpc('check_api_rate_limit', {
    p_bucket_key: bucketKey,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error('[rateLimit]', error.message);
    return { allowed: true };
  }

  const result = data as { allowed?: boolean; retry_after?: number } | null;
  if (result?.allowed === false) {
    return { allowed: false, retryAfter: result.retry_after ?? windowSeconds };
  }

  return { allowed: true };
}

export async function enforceGuestSessionRateLimit(
  request: NextRequest,
  deviceId: string
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  const ip = getClientIp(request);
  const ipLimit = await enforceRateLimit(`guest-session:ip:${ip}`, 30, 3600);
  if (!ipLimit.allowed) return ipLimit;

  return enforceRateLimit(`guest-session:device:${deviceId.slice(0, 64)}`, 15, 3600);
}
