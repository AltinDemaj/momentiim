import crypto from 'crypto';

const TIKTOK_AUTH = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN = 'https://open.tiktokapis.com/v2/oauth/token/';

export const TIKTOK_SCOPES = ['user.info.basic', 'video.publish', 'video.upload'].join(',');

export interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  open_id: string;
  scope: string;
  token_type: string;
}

export function tiktokRedirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/api/admin/tiktok/callback`;
}

export function getTikTokClientConfig() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    throw new Error('TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET are not configured');
  }
  return { clientKey, clientSecret };
}

export function isTikTokOAuthConfigured(): boolean {
  return !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
}

export function createPkcePair() {
  const codeVerifier = crypto.randomBytes(48).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

export function buildTikTokAuthorizeUrl(state: string, codeChallenge: string): string {
  const { clientKey } = getTikTokClientConfig();
  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: 'code',
    scope: TIKTOK_SCOPES,
    redirect_uri: tiktokRedirectUri(),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${TIKTOK_AUTH}?${params.toString()}`;
}

async function postToken(body: Record<string, string>): Promise<TikTokTokenResponse> {
  const res = await fetch(TIKTOK_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  const json = (await res.json()) as {
    data?: TikTokTokenResponse;
    error?: { message?: string; code?: string };
  };
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `TikTok token error (${res.status})`);
  }
  if (!json.data?.access_token) throw new Error('TikTok token response missing access_token');
  return json.data;
}

export async function exchangeTikTokCode(code: string, codeVerifier: string) {
  const { clientKey, clientSecret } = getTikTokClientConfig();
  return postToken({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: tiktokRedirectUri(),
    code_verifier: codeVerifier,
  });
}

export async function refreshTikTokAccessToken(refreshToken: string) {
  const { clientKey, clientSecret } = getTikTokClientConfig();
  return postToken({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
}
