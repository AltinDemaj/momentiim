import crypto from 'crypto';

function secret(): string {
  const s = process.env.SOCIAL_PUBLISH_SECRET ?? process.env.SOCIAL_APPROVAL_SECRET ?? process.env.GUEST_AUTH_SECRET;
  if (!s) throw new Error('SOCIAL_PUBLISH_SECRET or GUEST_AUTH_SECRET is required for publish asset URLs');
  return s;
}

/** Short-lived public URL token so Meta/TikTok can fetch the mockup image. */
export function createPublishAssetToken(draftId: string, ttlSeconds = 900): string {
  const exp = Date.now() + ttlSeconds * 1000;
  const payload = `${draftId}:${exp}`;
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyPublishAssetToken(draftId: string, token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [id, expStr, sig] = decoded.split(':');
    if (id !== draftId || !expStr || !sig) return false;
    if (Date.now() > Number(expStr)) return false;
    const payload = `${id}:${expStr}`;
    const expected = crypto.createHmac('sha256', secret()).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function publishAssetUrl(draftId: string, token: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/api/social-publish/${draftId}/mockup?t=${token}`;
}

export function isPubliclyReachableAppUrl(): boolean {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return !!base && !base.includes('localhost') && !base.includes('127.0.0.1');
}
