import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase, EVENT_PHOTOS_BUCKET } from '../lib/supabase';
import { readMediaFile, isStorageObjectExistsError } from '../lib/mediaHash';
import type {
  UploadLimits,
  UploadResult,
  DecrementGuestLimitResult,
  CommitPhotoUploadResult,
} from '../../packages/shared/types/database';

interface UseEventUploadOptions {
  eventId: string;
  guestId: string;
}

interface UseEventUploadReturn {
  isUploading: boolean;
  limits: UploadLimits | null;
  refreshLimits: () => Promise<UploadLimits | null>;
  pickFromCamera: () => Promise<UploadResult>;
  pickFromGallery: () => Promise<UploadResult>;
  selectFromGallery: () => Promise<{ uri: string } | { cancelled: true }>;
  uploadAsset: (uri: string) => Promise<UploadResult>;
}

interface AcquireBlobResult {
  blob_id: string;
  storage_path: string;
  upload_required: boolean;
  reused: boolean;
}

function parseRpcError(error: { message?: string; code?: string }): UploadResult {
  const msg = error.message ?? '';

  if (msg.includes('GUEST_LIMIT_EXCEEDED')) {
    return { success: false, error: 'GUEST_LIMIT_EXCEEDED' };
  }
  if (msg.includes('EVENT_POOL_EXHAUSTED')) {
    return { success: false, error: 'EVENT_POOL_EXHAUSTED' };
  }
  if (msg.includes('EVENT_NOT_ACTIVE')) {
    return { success: false, error: 'EVENT_NOT_ACTIVE' };
  }
  if (msg.includes('RESERVATION_EXPIRED')) {
    return { success: false, error: 'RESERVATION_EXPIRED' };
  }

  return { success: false, error: 'UNKNOWN', message: msg || undefined };
}

export function useEventUpload({
  eventId,
  guestId,
}: UseEventUploadOptions): UseEventUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [limits, setLimits] = useState<UploadLimits | null>(null);

  const refreshLimits = useCallback(async (): Promise<UploadLimits | null> => {
    try {
      const [{ data: guest, error: guestError }, { data: event, error: eventError }] =
        await Promise.all([
          supabase
            .from('event_guests')
            .select('photos_remaining')
            .eq('id', guestId)
            .eq('event_id', eventId)
            .single(),
          supabase
            .from('events')
            .select('package_tier_id, status, test_mode, package_tiers(max_total_photos)')
            .eq('id', eventId)
            .single(),
        ]);

      if (guestError) throw guestError;
      if (eventError) throw eventError;
      if (event.status !== 'active') {
        const inactive: UploadLimits = {
          guestRemaining: guest.photos_remaining,
          eventTotal: 0,
          eventMax: 0,
          canUpload: false,
        };
        setLimits(inactive);
        return inactive;
      }

      const tier = event.package_tiers as { max_total_photos: number } | null;
      const eventMax = tier?.max_total_photos ?? 0;

      const { data: totalCount, error: countError } = await supabase.rpc(
        'event_photo_count',
        { p_event_id: eventId }
      );

      if (countError) throw countError;

      const eventTotal = totalCount ?? 0;
      const testMode = (event as { test_mode?: boolean }).test_mode === true;
      const next: UploadLimits = {
        guestRemaining: guest.photos_remaining,
        eventTotal,
        eventMax,
        canUpload: testMode || (guest.photos_remaining > 0 && eventTotal < eventMax),
      };

      setLimits(next);
      return next;
    } catch {
      return null;
    }
  }, [eventId, guestId]);

  const uploadAsset = useCallback(
    async (uri: string): Promise<UploadResult> => {
      setIsUploading(true);
      let reservationId: string | undefined;

      try {
        const currentLimits = limits ?? (await refreshLimits());
        if (!currentLimits?.canUpload) {
          if (currentLimits && currentLimits.guestRemaining <= 0) {
            return { success: false, error: 'GUEST_LIMIT_EXCEEDED' };
          }
          if (currentLimits && currentLimits.eventTotal >= currentLimits.eventMax) {
            return { success: false, error: 'EVENT_POOL_EXHAUSTED' };
          }
          return { success: false, error: 'EVENT_NOT_ACTIVE' };
        }

        const media = await readMediaFile(uri);

        const { data: blobRaw, error: blobError } = await supabase.rpc('acquire_global_media_blob', {
          p_content_hash: media.contentHash,
          p_byte_size: media.byteSize,
          p_mime_type: media.contentType,
          p_file_ext: media.ext,
          p_media_type: 'photo',
        });

        if (blobError) {
          return { success: false, error: 'UPLOAD_FAILED', message: blobError.message };
        }

        const blob = blobRaw as unknown as AcquireBlobResult;

        const { data: reservationRaw, error: reserveError } = await supabase.rpc(
          'decrement_guest_limit',
          {
            p_guest_id: guestId,
            p_event_id: eventId,
            p_file_ext: media.ext,
          }
        );

        if (reserveError) {
          return parseRpcError(reserveError);
        }

        const reservation = reservationRaw as unknown as DecrementGuestLimitResult;
        reservationId = reservation.reservation_id;

        if (blob.upload_required) {
          const { error: uploadError } = await supabase.storage
            .from(EVENT_PHOTOS_BUCKET)
            .upload(blob.storage_path, media.bytes, {
              contentType: media.contentType,
              upsert: false,
              cacheControl: '31536000',
            });

          if (uploadError && !isStorageObjectExistsError(uploadError.message)) {
            await supabase.rpc('release_guest_reservation', {
              p_reservation_id: reservationId,
              p_guest_id: guestId,
            });
            return {
              success: false,
              error: 'UPLOAD_FAILED',
              message: uploadError.message,
            };
          }
        }

        const { data: commitRaw, error: commitError } = await supabase.rpc('commit_photo_upload', {
          p_reservation_id: reservationId,
          p_guest_id: guestId,
          p_media_blob_id: blob.blob_id,
        });

        if (commitError) {
          await supabase.rpc('release_guest_reservation', {
            p_reservation_id: reservationId,
            p_guest_id: guestId,
          });
          return parseRpcError(commitError);
        }

        const committed = commitRaw as unknown as CommitPhotoUploadResult;

        await refreshLimits();

        return {
          success: true,
          photoId: committed.photo_id,
          storagePath: committed.storage_path,
          photosRemaining: reservation.photos_remaining,
        };
      } catch (err) {
        if (reservationId) {
          await supabase.rpc('release_guest_reservation', {
            p_reservation_id: reservationId,
            p_guest_id: guestId,
          });
        }

        if (err instanceof Error) {
          if (err.message === 'FILE_MISSING') {
            return { success: false, error: 'FILE_MISSING' };
          }
          if (err.message === 'PHOTO_READ_FAILED') {
            return { success: false, error: 'PHOTO_READ_FAILED' };
          }
        }

        const message = err instanceof Error ? err.message : undefined;
        return { success: false, error: 'UPLOAD_FAILED', message };
      } finally {
        setIsUploading(false);
      }
    },
    [eventId, guestId, limits, refreshLimits]
  );

  const launchPicker = useCallback(
    async (source: 'camera' | 'gallery'): Promise<UploadResult> => {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        return {
          success: false,
          error: source === 'camera' ? 'PERMISSION_DENIED_CAMERA' : 'PERMISSION_DENIED_GALLERY',
        };
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 1,
              exif: true,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 1,
              exif: true,
            });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return { success: false, error: 'PICKER_CANCELLED' };
      }

      return uploadAsset(result.assets[0].uri);
    },
    [uploadAsset]
  );

  const pickFromCamera = useCallback(() => launchPicker('camera'), [launchPicker]);

  const selectFromGallery = useCallback(async (): Promise<{ uri: string } | { cancelled: true }> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return { cancelled: true };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      exif: true,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return { cancelled: true };
    }

    return { uri: result.assets[0].uri };
  }, []);

  const pickFromGallery = useCallback(() => launchPicker('gallery'), [launchPicker]);

  return {
    isUploading,
    limits,
    refreshLimits,
    pickFromCamera,
    pickFromGallery,
    selectFromGallery,
    uploadAsset,
  };
}
