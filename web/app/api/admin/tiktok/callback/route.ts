import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin/auth';
import { exchangeTikTokCode } from '@/lib/tiktok/oauth';

function resultPage(title: string, body: string, ok: boolean) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Momenti Im</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #09090b; color: #f5e9d3; padding: 32px 20px; line-height: 1.5; }
    .card { max-width: 720px; margin: 0 auto; background: #111; border: 1px solid #333; border-radius: 16px; padding: 28px; }
    h1 { font-size: 22px; margin: 0 0 12px; color: ${ok ? '#6ee7b7' : '#fca5a5'}; }
    pre { background: #0a0a0a; border: 1px solid #333; border-radius: 10px; padding: 14px; overflow-x: auto; font-size: 12px; color: #d4cdc4; }
    p, li { color: #d4cdc4; }
    a { color: #c9a96e; }
    code { color: #c9a96e; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    ${body}
    <p style="margin-top:24px"><a href="/admin/social">← Back to Social queue</a></p>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return resultPage(
      'Login required',
      '<p>Sign in as admin first, then open <a href="/api/admin/tiktok/connect">Connect TikTok</a> again.</p>',
      false
    );
  }

  const url = request.nextUrl;
  const error = url.searchParams.get('error');
  if (error) {
    return resultPage('TikTok authorization denied', `<p>${error}</p>`, false);
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = await cookies();
  const savedState = cookieStore.get('tiktok_oauth_state')?.value;
  const codeVerifier = cookieStore.get('tiktok_code_verifier')?.value;

  cookieStore.delete('tiktok_oauth_state');
  cookieStore.delete('tiktok_code_verifier');

  if (!code || !state || !savedState || state !== savedState || !codeVerifier) {
    return resultPage(
      'Invalid OAuth state',
      '<p>Start over from the Social queue → Connect TikTok button.</p>',
      false
    );
  }

  try {
    const tokens = await exchangeTikTokCode(code, codeVerifier);
    const body = `
      <p>TikTok connected for <strong>@${auth.profile.email}</strong>. Add these to Vercel → Settings → Environment Variables (Production):</p>
      <pre>TIKTOK_ACCESS_TOKEN=${tokens.access_token}
TIKTOK_REFRESH_TOKEN=${tokens.refresh_token}</pre>
      <p>Access token expires in ~24h. Keep <code>TIKTOK_REFRESH_TOKEN</code> — the app refreshes automatically on publish.</p>
      <ul>
        <li><code>TIKTOK_PRIVACY_LEVEL=SELF_ONLY</code> for test posts (only you see them)</li>
        <li>Redeploy after saving env vars</li>
      </ul>
    `;
    return resultPage('TikTok connected', body, true);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Token exchange failed';
    return resultPage('TikTok connection failed', `<p>${msg}</p>`, false);
  }
}
