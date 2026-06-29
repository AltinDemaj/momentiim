import type { TranslationKey } from './translations';

const ERROR_CODE_KEYS: Record<string, TranslationKey> = {
  GUEST_LIMIT_EXCEEDED: 'upload.guestLimitExceeded',
  EVENT_POOL_EXHAUSTED: 'upload.eventPoolExhausted',
  EVENT_NOT_ACTIVE: 'upload.eventNotActive',
  RESERVATION_EXPIRED: 'upload.reservationExpired',
  UPLOAD_FAILED: 'upload.failed',
  FILE_MISSING: 'upload.fileMissing',
  PHOTO_READ_FAILED: 'upload.photoReadFailed',
  PERMISSION_DENIED_CAMERA: 'upload.permissionDeniedCamera',
  PERMISSION_DENIED_GALLERY: 'upload.permissionDeniedGallery',
  VIDEO_LIMIT_EXCEEDED: 'upload.videoLimitExceeded',
  VIDEO_NOT_ALLOWED: 'upload.videoNotAllowed',
  TOO_SHORT: 'upload.videoTooShort',
  TOO_LONG: 'upload.videoTooLong',
  VIDEO_FILE_MISSING: 'upload.videoFileMissing',
  NOT_JOINED: 'upload.notJoined',
  UNKNOWN: 'upload.unknown',
};

type TranslateFn = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

export function uploadErrorMessage(
  error: string | undefined,
  fallback: string | undefined,
  t: TranslateFn
): string {
  if (error && ERROR_CODE_KEYS[error]) {
    return t(ERROR_CODE_KEYS[error]);
  }
  if (fallback) return fallback;
  return t('upload.unknown');
}
