/** Verified Unsplash wedding photography — direct CDN URLs (no API key). */
const WEDDING_PHOTO_IDS = [
  '1769038936061-056e79c8273f',
  '1768739936628-ac38f8f5efed',
  '1770301312266-9cb209eae9f6',
  '1492684223066-81342ee5ff30',
  '1511285560929-80b456fea0bc',
  '1493663284031-b7e3aefcae8e',
  '1511795409834-ef04bbd61622',
  '1507003211169-0a1dd7228f2d',
  '1461988320302-91bde64fc8e4',
] as const;

const SEARCH_TERMS = [
  'wedding-decor',
  'luxury-wedding-reception',
  'wedding-guest',
  'wedding-cake',
  'wedding-flowers',
  'wedding-venue',
] as const;

function pickRandom<T>(pool: readonly T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function buildUnsplashUrl(photoId: string, width: number, height: number): string {
  const sig = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const term = pickRandom(SEARCH_TERMS);
  return (
    `https://images.unsplash.com/photo-${photoId}` +
    `?auto=format&fit=crop&w=${width}&h=${height}&q=85` +
    `&sig=${sig}&utm_term=${term}`
  );
}

function buildPicsumUrl(width: number, height: number): string {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MomentiIm-SocialBot/1.0' },
    cache: 'no-store',
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Image fetch failed (${res.status}): ${url}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export async function fetchWeddingPhoto(width: number, height: number): Promise<Buffer> {
  const ids = shuffle([...WEDDING_PHOTO_IDS]);

  for (const id of ids) {
    try {
      return await fetchImageBuffer(buildUnsplashUrl(id, width, height));
    } catch {
      continue;
    }
  }

  return fetchImageBuffer(buildPicsumUrl(width, height));
}

/** Fetch N distinct wedding photos for grid compositions. */
export async function fetchWeddingPhotoBatch(
  count: number,
  cellWidth: number,
  cellHeight: number
): Promise<Buffer[]> {
  const ids = shuffle([...WEDDING_PHOTO_IDS]);
  const results: Buffer[] = [];

  for (let i = 0; i < count; i++) {
    const id = ids[i % ids.length]!;
    const sig = `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`;
    const url =
      `https://images.unsplash.com/photo-${id}` +
      `?auto=format&fit=crop&w=${cellWidth}&h=${cellHeight}&q=85&sig=${sig}`;

    try {
      results.push(await fetchImageBuffer(url));
    } catch {
      results.push(await fetchImageBuffer(buildPicsumUrl(cellWidth, cellHeight)));
    }
  }

  return results;
}

export function bufferToDataUrl(buffer: Buffer, mime = 'image/jpeg'): string {
  return `data:${mime};base64,${buffer.toString('base64')}`;
}
