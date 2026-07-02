import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { publishSocialDraft, type PublishPlatform } from '@/lib/social/publishDraft';
import { isInstagramConfigured } from '@/lib/social/publishToInstagram';
import { isTikTokConfigured } from '@/lib/social/publishToTikTok';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  let platforms: PublishPlatform[] = ['instagram', 'tiktok'];
  try {
    const body = await request.json();
    if (Array.isArray(body?.platforms)) {
      platforms = body.platforms.filter((p: string) => p === 'instagram' || p === 'tiktok');
    }
  } catch {
    // default both platforms
  }

  try {
    const result = await publishSocialDraft(id, platforms);
    const success =
      (!platforms.includes('instagram') || !!result.instagram) &&
      (!platforms.includes('tiktok') || !!result.tiktok);

    return NextResponse.json({
      ok: success,
      configured: {
        instagram: isInstagramConfigured(),
        tiktok: isTikTokConfigured(),
      },
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Publish failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
