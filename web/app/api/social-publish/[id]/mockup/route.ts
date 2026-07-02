import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { verifyPublishAssetToken } from '@/lib/social/publishAssetToken';

const DRAFT_BUCKET = 'social-drafts';

/** Public mockup URL for Meta/TikTok to pull during publish (token-gated, short-lived). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get('t');

  if (!token || !verifyPublishAssetToken(id, token)) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });
  }

  const service = createSupabaseServiceClient();
  const { data: draft } = await service
    .from('social_content_drafts')
    .select('mockup_storage_path')
    .eq('id', id)
    .maybeSingle();

  if (!draft?.mockup_storage_path) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: file, error } = await service.storage
    .from(DRAFT_BUCKET)
    .download(draft.mockup_storage_path);

  if (error || !file) {
    return NextResponse.json({ error: 'Asset missing' }, { status: 404 });
  }

  const jpeg = await sharp(Buffer.from(await file.arrayBuffer()))
    .jpeg({ quality: 92 })
    .toBuffer();

  return new NextResponse(jpeg, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'no-store',
    },
  });
}
