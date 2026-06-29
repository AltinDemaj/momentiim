import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { adminLoginPath, isEmailAllowedForAdmin } from '@/lib/admin/access';

function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, getResponse: () => response };
}

async function isAdminSession(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  email: string | undefined
) {
  if (!isEmailAllowedForAdmin(email)) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  return profile?.role === 'admin';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const { supabase, getResponse } = createMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname === '/admin/login') {
    if (user && (await isAdminSession(supabase, user.id, user.email))) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return getResponse();
  }

  if (!user) {
    return NextResponse.redirect(new URL(adminLoginPath(), request.url));
  }

  if (!(await isAdminSession(supabase, user.id, user.email))) {
    return NextResponse.redirect(new URL(adminLoginPath('forbidden'), request.url));
  }

  return getResponse();
}

export const config = {
  matcher: ['/admin/:path*'],
};
