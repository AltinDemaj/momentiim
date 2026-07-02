import crypto from 'crypto';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  const secret = process.env.SOCIAL_APPROVAL_SECRET ?? process.env.GUEST_AUTH_SECRET;
  if (!secret) {
    throw new Error('SOCIAL_APPROVAL_SECRET or GUEST_AUTH_SECRET is required');
  }
  return secret;
}

export function createApprovalToken(draftId: string, action: 'approve' | 'reject'): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${draftId}:${action}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyApprovalToken(
  token: string,
  expectedAction: 'approve' | 'reject'
): { draftId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [draftId, action, expiresAtStr, sig] = decoded.split(':');
    if (!draftId || action !== expectedAction || !expiresAtStr || !sig) return null;

    const expiresAt = Number(expiresAtStr);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

    const payload = `${draftId}:${action}:${expiresAtStr}`;
    const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

    return { draftId };
  } catch {
    return null;
  }
}

export function approvalUrl(draftId: string, action: 'approve' | 'reject'): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const token = createApprovalToken(draftId, action);
  return `${base}/api/social-approval/${token}?action=${action}`;
}
