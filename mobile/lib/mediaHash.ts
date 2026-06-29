import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
};

export interface MediaFilePayload {
  bytes: Uint8Array;
  contentHash: string;
  ext: string;
  contentType: string;
  byteSize: number;
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const b64 = bytesToBase64(bytes);
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, b64, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
}

export function extractExtension(uri: string, mimeType?: string | null): string {
  if (mimeType) {
    const fromMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/heic': 'heic',
      'image/heif': 'heif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
    };
    if (fromMime[mimeType]) return fromMime[mimeType];
  }
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

export function resolveMimeType(ext: string): string {
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}

/** Read file at full quality and fingerprint it for the global media pool. */
export async function readMediaFile(uri: string, mimeType?: string | null): Promise<MediaFilePayload> {
  const file = new File(uri);
  if (!file.exists) {
    throw new Error('FILE_MISSING');
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new Error('PHOTO_READ_FAILED');
  }
  const ext = extractExtension(uri, mimeType);
  const contentHash = await sha256Hex(bytes);
  return {
    bytes,
    contentHash,
    ext,
    contentType: resolveMimeType(ext),
    byteSize: bytes.byteLength,
  };
}

export function isStorageObjectExistsError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('already exists') || lower.includes('duplicate') || lower.includes('409');
}
