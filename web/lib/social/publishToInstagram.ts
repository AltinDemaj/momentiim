const GRAPH_VERSION = 'v21.0';

export interface InstagramPublishResult {
  mediaId: string;
  containerId: string;
}

function getConfig() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN ?? process.env.META_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!accessToken) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN (or META_ACCESS_TOKEN) is not configured');
  }
  if (!igUserId) {
    throw new Error('INSTAGRAM_BUSINESS_ACCOUNT_ID is not configured');
  }
  return { accessToken, igUserId };
}

async function graphPost(
  path: string,
  accessToken: string,
  body: Record<string, string>
): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({ ...body, access_token: accessToken });
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = data.error as { message?: string } | undefined;
    throw new Error(err?.message ?? `Instagram API error (${res.status})`);
  }
  return data;
}

async function graphGet(path: string, accessToken: string): Promise<Record<string, unknown>> {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}${path}?access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = data.error as { message?: string } | undefined;
    throw new Error(err?.message ?? `Instagram API error (${res.status})`);
  }
  return data;
}

async function waitForContainer(containerId: string, accessToken: string): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const data = await graphGet(`/${containerId}?fields=status_code`, accessToken);
    const status = data.status_code as string | undefined;
    if (status === 'FINISHED') return;
    if (status === 'ERROR' || status === 'EXPIRED') {
      throw new Error(`Instagram container failed: ${status}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Instagram container processing timed out');
}

/** Publish 9:16 mockup as an Instagram Story (best fit for static vertical assets). */
export async function publishToInstagramStory(
  imageUrl: string,
  caption?: string
): Promise<InstagramPublishResult> {
  const { accessToken, igUserId } = getConfig();

  const containerBody: Record<string, string> = {
    image_url: imageUrl,
    media_type: 'STORIES',
  };
  if (caption) containerBody.caption = caption.slice(0, 2200);

  const container = await graphPost(`/${igUserId}/media`, accessToken, containerBody);
  const containerId = String(container.id);
  await waitForContainer(containerId, accessToken);

  const published = await graphPost(`/${igUserId}/media_publish`, accessToken, {
    creation_id: containerId,
  });

  return {
    containerId,
    mediaId: String(published.id),
  };
}

export function isInstagramConfigured(): boolean {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}
