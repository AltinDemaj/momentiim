import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const deviceId = body?.device_id as string | undefined;
    const token = body?.expo_push_token as string | undefined;

    if (!deviceId || !token) {
      return NextResponse.json({ error: 'device_id and expo_push_token required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = authHeader.slice(7);
    const service = createSupabaseServiceClient();
    const { data: userData, error: userError } = await service.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { error } = await service.from('guest_push_tokens').upsert(
      {
        device_id: deviceId,
        user_id: userData.user.id,
        expo_push_token: token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'device_id' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ registered: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
