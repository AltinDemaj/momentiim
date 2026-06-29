import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { enforceGuestSessionRateLimit } from '@/lib/rateLimit';

function guestEmail(deviceId: string): string {
  const safe = deviceId.replace(/-/g, '').slice(0, 32);
  return `guest.${safe}@example.com`;
}

function guestAuthSecret(): string {
  const secret = process.env.GUEST_AUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('GUEST_AUTH_SECRET must be set in production');
  }

  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!fallback) {
    throw new Error('GUEST_AUTH_SECRET or SUPABASE_SERVICE_ROLE_KEY is required');
  }

  return fallback;
}

function guestPassword(deviceId: string): string {
  const secret = guestAuthSecret();
  return createHash('sha256').update(`${deviceId}:${secret}`).digest('hex');
}

function guestUserId(deviceId: string): string {
  const hash = createHash('sha256').update(`momentiim-guest:${deviceId}`).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `${((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0')}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join('-');
}

async function findUserIdByEmail(
  service: ReturnType<typeof createSupabaseServiceClient>,
  email: string
): Promise<string | null> {
  let page = 1;

  while (page <= 20) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data.users.length) return null;

    const match = data.users.find((user) => user.email === email);
    if (match) return match.id;

    if (data.users.length < 1000) return null;
    page += 1;
  }

  return null;
}

async function syncGuestPassword(
  service: ReturnType<typeof createSupabaseServiceClient>,
  userId: string,
  deviceId: string,
  email: string,
  password: string
) {
  const { error } = await service.auth.admin.updateUserById(userId, {
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'guest', device_id: deviceId },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const deviceId = body?.device_id as string | undefined;

    if (!deviceId || typeof deviceId !== 'string') {
      return NextResponse.json({ error: 'device_id is required' }, { status: 400 });
    }

    if (deviceId.length > 128) {
      return NextResponse.json({ error: 'device_id is too long' }, { status: 400 });
    }

    const rateLimit = await enforceGuestSessionRateLimit(request, deviceId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many session requests. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter) },
        }
      );
    }

    const service = createSupabaseServiceClient();
    const email = guestEmail(deviceId);
    const password = guestPassword(deviceId);
    const userId = guestUserId(deviceId);

    const { error: createError } = await service.auth.admin.createUser({
      id: userId,
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'guest', device_id: deviceId },
    });

    if (createError) {
      const exists =
        createError.code === 'email_exists' ||
        createError.message.toLowerCase().includes('already') ||
        createError.message.toLowerCase().includes('registered');

      if (!exists) {
        console.error('[guest/session create]', createError.message);
      }

      const existingId =
        (exists ? await findUserIdByEmail(service, email) : null) ?? userId;

      await syncGuestPassword(service, existingId, deviceId, email, password);
    }

    const { data: signIn, error: signInError } = await service.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signIn.session) {
      return NextResponse.json(
        { error: signInError?.message ?? 'Could not create guest session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
