import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { approveAndEmailDraft } from '@/lib/social/generateDraft';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    await approveAndEmailDraft(id);
    return NextResponse.json({ ok: true, status: 'approved' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Approve failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
