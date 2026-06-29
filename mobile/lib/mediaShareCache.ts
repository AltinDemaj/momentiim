import * as FileSystem from 'expo-file-system/legacy';

const inflight = new Map<string, Promise<string | null>>();
const ready = new Map<string, string>();

function cachePath(id: string, ext: 'jpg' | 'mp4') {
  return `${FileSystem.cacheDirectory}momentiim-cache-${id}.${ext}`;
}

async function downloadToCache(
  id: string,
  url: string,
  mediaType?: string
): Promise<string | null> {
  const ext = mediaType === 'video' ? 'mp4' : 'jpg';
  const dest = cachePath(id, ext);

  const existing = ready.get(id);
  if (existing) return existing;

  try {
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) {
      ready.set(id, dest);
      return dest;
    }

    const { uri } = await FileSystem.downloadAsync(url, dest);
    ready.set(id, uri);
    return uri;
  } catch {
    return null;
  }
}

export function prefetchMediaCache(item: {
  id: string;
  url: string;
  mediaType?: string;
}): void {
  if (!item.url || ready.has(item.id) || inflight.has(item.id)) return;

  const job = downloadToCache(item.id, item.url, item.mediaType).finally(() => {
    inflight.delete(item.id);
  });
  inflight.set(item.id, job);
}

export async function getCachedMediaUri(item: {
  id: string;
  url: string;
  mediaType?: string;
}): Promise<string | null> {
  if (ready.has(item.id)) return ready.get(item.id)!;

  const pending = inflight.get(item.id);
  if (pending) return pending;

  const job = downloadToCache(item.id, item.url, item.mediaType).finally(() => {
    inflight.delete(item.id);
  });
  inflight.set(item.id, job);
  return job;
}

export function clearMediaShareCache(): void {
  inflight.clear();
  ready.clear();
}
