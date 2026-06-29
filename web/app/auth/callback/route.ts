import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { adminLoginPath } from '@/lib/admin/access';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/admin';

  if (!code) {
    return NextResponse.redirect(new URL(adminLoginPath('auth'), origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(adminLoginPath('auth'), origin));
  }

  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/admin';
  return NextResponse.redirect(new URL(safeNext, origin));
}
