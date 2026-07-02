import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { isInstagramConfigured } from '@/lib/social/publishToInstagram';
import { isTikTokConfigured } from '@/lib/social/publishToTikTok';
import { isPubliclyReachableAppUrl } from '@/lib/social/publishAssetToken';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({
    instagram: isInstagramConfigured(),
    tiktok: isTikTokConfigured(),
    publicUrl: isPubliclyReachableAppUrl(),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
  });
}
