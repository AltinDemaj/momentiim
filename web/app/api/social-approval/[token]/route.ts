import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { verifyApprovalToken } from '@/lib/social/approvalToken';

function resultPage(title: string, message: string, ok: boolean): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0b0c; color: #f5e9d3; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { max-width: 420px; padding: 32px; border: 1px solid #2a2a2e; border-radius: 16px; text-align: center; }
    h1 { font-size: 1.5rem; margin: 0 0 12px; color: ${ok ? '#C9A96E' : '#f87171'}; }
    p { color: #9ca3af; line-height: 1.5; }
    a { color: #C9A96E; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <p><a href="/admin/social">Open social queue →</a></p>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const action = request.nextUrl.searchParams.get('action');

  if (action !== 'approve' && action !== 'reject') {
    return resultPage('Invalid link', 'Missing or invalid action.', false);
  }

  const verified = verifyApprovalToken(token, action);
  if (!verified) {
    return resultPage('Link expired', 'This approval link is invalid or has expired.', false);
  }

  const service = createSupabaseServiceClient();
  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  const { data: draft, error } = await service
    .from('social_content_drafts')
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', verified.draftId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error || !draft) {
    return resultPage(
      'Already reviewed',
      'This draft was already approved or rejected.',
      false
    );
  }

  if (action === 'approve') {
    return resultPage(
      'Approved',
      'Mockup saved. Download it from the admin social queue and post to TikTok / Instagram.',
      true
    );
  }

  return resultPage('Deleted', 'Draft rejected — it will not be used for posting.', true);
}
