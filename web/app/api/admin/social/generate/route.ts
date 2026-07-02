import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { generateSocialDraft } from '@/lib/social/generateDraft';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Manual trigger — always creates a new variant, no daily lockout. */
export async function POST(_request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await generateSocialDraft({
      source: 'manual',
      sendEmail: false,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pipeline failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
