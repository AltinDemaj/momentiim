const TIKTOK_API = 'https://open.tiktokapis.com';

export interface TikTokPublishResult {
  publishId: string;
  status: string;
}

async function resolveAccessToken(): Promise<string> {
  const direct = process.env.TIKTOK_ACCESS_TOKEN;
  if (direct) return direct;

  const refreshToken = process.env.TIKTOK_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error('TIKTOK_ACCESS_TOKEN is not configured');
  }

  const { refreshTikTokAccessToken } = await import('@/lib/tiktok/oauth');
  const tokens = await refreshTikTokAccessToken(refreshToken);
  return tokens.access_token;
}

async function getConfig() {
  const accessToken = await resolveAccessToken();
  const privacy = process.env.TIKTOK_PRIVACY_LEVEL ?? 'SELF_ONLY';
  return { accessToken, privacy };
}

async function tiktokPost<T>(path: string, accessToken: string, body: unknown): Promise<T> {
  const res = await fetch(`${TIKTOK_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { data?: T; error?: { message?: string; code?: string } };
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? `TikTok API error (${res.status})`);
  }
  if (!data.data) throw new Error('TikTok API returned empty data');
  return data.data;
}

async function waitForPublish(publishId: string, accessToken: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const data = await tiktokPost<{ status: string; fail_reason?: string }>(
      '/v2/post/publish/status/fetch/',
      accessToken,
      { publish_id: publishId }
    );
    const status = data.status;
    if (status === 'PUBLISH_COMPLETE') return status;
    if (status === 'FAILED') {
      throw new Error(data.fail_reason ?? 'TikTok publish failed');
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('TikTok publish timed out');
}

/** Publish vertical mockup as a TikTok photo post (test mode defaults to SELF_ONLY). */
export async function publishToTikTokPhoto(
  imageUrl: string,
  title: string
): Promise<TikTokPublishResult> {
  const { accessToken, privacy } = await getConfig();

  const init = await tiktokPost<{ publish_id: string }>(
    '/v2/post/publish/content/init/',
    accessToken,
    {
      post_info: {
        title: title.slice(0, 150),
        privacy_level: privacy,
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
        brand_content_toggle: false,
        brand_organic_toggle: false,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        photo_cover_index: 0,
        photo_images: [imageUrl],
      },
      post_mode: 'DIRECT_POST',
      media_type: 'PHOTO',
    }
  );

  const status = await waitForPublish(init.publish_id, accessToken);
  return { publishId: init.publish_id, status };
}

export function isTikTokConfigured(): boolean {
  return !!(process.env.TIKTOK_ACCESS_TOKEN || process.env.TIKTOK_REFRESH_TOKEN);
}
