import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { requireAdmin } from '@/lib/admin/auth';
import {
  buildTikTokAuthorizeUrl,
  createPkcePair,
  isTikTokOAuthConfigured,
} from '@/lib/tiktok/oauth';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isTikTokOAuthConfigured()) {
    return NextResponse.json(
      { error: 'Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET in env first' },
      { status: 503 }
    );
  }

  const state = crypto.randomBytes(16).toString('hex');
  const { codeVerifier, codeChallenge } = createPkcePair();
  const cookieStore = await cookies();

  cookieStore.set('tiktok_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  cookieStore.set('tiktok_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return NextResponse.redirect(buildTikTokAuthorizeUrl(state, codeChallenge));
}
