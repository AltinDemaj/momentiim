import { NextRequest, NextResponse } from 'next/server';
import { runDailySocialPipeline } from '@/lib/social/runDailyPipeline';

export const runtime = 'nodejs';
export const maxDuration = 60;

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runDailySocialPipeline();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pipeline failed';
    console.error('[cron/daily-social]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
