import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { getCachedMediaUri, prefetchMediaCache } from './mediaShareCache';

export { prefetchMediaCache };

export async function requestMediaPermission(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === 'granted';
}

export async function downloadPhoto(url: string, filename: string): Promise<boolean> {
  const granted = await requestMediaPermission();
  if (!granted) return false;

  try {
    const dest = `${FileSystem.cacheDirectory}${filename}`;
    const { uri } = await FileSystem.downloadAsync(url, dest);
    await MediaLibrary.saveToLibraryAsync(uri);
    return true;
  } catch {
    return false;
  }
}

export async function downloadSingleMedia(item: {
  url: string;
  id: string;
  mediaType?: string;
}): Promise<boolean> {
  const ext = item.mediaType === 'video' ? 'mp4' : 'jpg';
  try {
    return await downloadPhoto(item.url, `momentiim-${item.id}.${ext}`);
  } catch {
    return false;
  }
}

export async function downloadPhotos(
  items: { url: string; id: string; mediaType?: string }[]
): Promise<{ saved: number; failed: number }> {
  let saved = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const localUri = await getCachedMediaUri(item);
      if (!localUri) {
        failed += 1;
        continue;
      }
      await MediaLibrary.saveToLibraryAsync(localUri);
      saved += 1;
    } catch {
      failed += 1;
    }
  }

  return { saved, failed };
}

export type ShareStage = 'preparing' | 'loading' | 'opening';

async function openShareSheet(
  uri: string,
  title: string,
  ext: 'jpg' | 'mp4'
): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;

  try {
    await Sharing.shareAsync(uri, {
      dialogTitle: `${title} — Momenti Im`,
      mimeType: ext === 'mp4' ? 'video/mp4' : 'image/jpeg',
      UTI: ext === 'mp4' ? 'public.mpeg-4' : 'public.jpeg',
    });
    return true;
  } catch {
    return false;
  }
}

/** Opens the native share sheet ASAP; uses cache or remote URL on iOS for photos. */
export async function shareSingleMedia(
  item: { url: string; id: string; mediaType?: string },
  title: string,
  onStage?: (stage: ShareStage) => void
): Promise<boolean> {
  const ext = item.mediaType === 'video' ? 'mp4' : 'jpg';
  onStage?.('preparing');

  if (Platform.OS === 'ios') {
    onStage?.('opening');
    prefetchMediaCache(item);
    Share.share({
      url: item.url,
      message: `${title} — Momenti Im`,
    }).catch(() => {});
    return true;
  }

  onStage?.('loading');
  const localUri = await getCachedMediaUri(item);
  if (!localUri) return false;

  onStage?.('opening');
  return openShareSheet(localUri, title, ext);
}

export async function shareAlbum(
  title: string,
  items: { url: string; id: string; mediaType?: string }[]
): Promise<boolean> {
  if (items.length === 0) return false;
  return shareSingleMedia(items[0], title);
}

export async function shareSelectedMedia(
  title: string,
  items: { url: string; id: string; mediaType?: string }[],
  onStage?: (stage: ShareStage) => void
): Promise<boolean> {
  if (items.length === 0) return false;
  if (items.length === 1) return shareSingleMedia(items[0], title, onStage);

  onStage?.('loading');
  const localUris: string[] = [];
  for (const item of items.slice(0, 10)) {
    const uri = await getCachedMediaUri(item);
    if (uri) localUris.push(uri);
  }

  if (localUris.length === 0) return false;

  onStage?.('opening');
  if (!(await Sharing.isAvailableAsync())) return false;

  try {
    await Sharing.shareAsync(localUris[0], {
      dialogTitle: `${title} — ${items.length} moments`,
      mimeType: 'image/jpeg',
    });
    return true;
  } catch {
    return false;
  }
}
