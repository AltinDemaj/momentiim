import { useCallback, useState } from 'react';
import { supabase, EVENT_PHOTOS_BUCKET } from '../lib/supabase';
import { readMediaFile, isStorageObjectExistsError } from '../lib/mediaHash';

const MIN_VIDEO_SECONDS = 3;
const MAX_VIDEO_SECONDS = 60;

export interface VideoUploadResult {
  success: boolean;
  error?: string;
  message?: string;
  videosRemaining?: number;
}

interface AcquireBlobResult {
  blob_id: string;
  storage_path: string;
  upload_required: boolean;
}

function parseVideoError(error: { message?: string }): VideoUploadResult {
  const msg = error.message ?? '';
  if (msg.includes('VIDEO_LIMIT_EXCEEDED')) {
    return { success: false, error: 'VIDEO_LIMIT_EXCEEDED' };
  }
  if (msg.includes('VIDEO_NOT_ALLOWED')) {
    return { success: false, error: 'VIDEO_NOT_ALLOWED' };
  }
  if (msg.includes('EVENT_POOL_EXHAUSTED')) {
    return { success: false, error: 'EVENT_POOL_EXHAUSTED' };
  }
  return { success: false, error: 'UPLOAD_FAILED', message: msg || undefined };
}

export function useEventVideoUpload({
  eventId,
  guestId,
}: {
  eventId: string;
  guestId: string;
}) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadVideo = useCallback(
    async (uri: string, durationMs?: number): Promise<VideoUploadResult> => {
      if (!eventId || !guestId) {
        return { success: false, error: 'NOT_JOINED' };
      }

      const durationSec = (durationMs ?? 0) / 1000;
      if (durationSec < MIN_VIDEO_SECONDS) {
        return { success: false, error: 'TOO_SHORT' };
      }
      if (durationSec > MAX_VIDEO_SECONDS + 1) {
        return { success: false, error: 'TOO_LONG' };
      }

      setIsUploading(true);
      let reservationId: string | undefined;

      try {
        const media = await readMediaFile(uri);

        const { data: blobRaw, error: blobError } = await supabase.rpc('acquire_global_media_blob', {
          p_content_hash: media.contentHash,
          p_byte_size: media.byteSize,
          p_mime_type: media.contentType,
          p_file_ext: media.ext,
          p_media_type: 'video',
        });

        if (blobError) {
          return { success: false, error: 'UPLOAD_FAILED', message: blobError.message };
        }

        const blob = blobRaw as unknown as AcquireBlobResult;

        const { data: reservationRaw, error: reserveError } = await supabase.rpc(
          'decrement_guest_video_limit',
          { p_guest_id: guestId, p_event_id: eventId, p_file_ext: media.ext }
        );

        if (reserveError) return parseVideoError(reserveError);

        const reservation = reservationRaw as {
          reservation_id: string;
          storage_path: string;
          videos_remaining: number;
        };
        reservationId = reservation.reservation_id;

        if (blob.upload_required) {
          const { error: uploadError } = await supabase.storage
            .from(EVENT_PHOTOS_BUCKET)
            .upload(blob.storage_path, media.bytes, {
              contentType: media.contentType,
              upsert: false,
            });

          if (uploadError && !isStorageObjectExistsError(uploadError.message)) {
            await supabase.rpc('release_guest_reservation', {
              p_reservation_id: reservationId,
              p_guest_id: guestId,
            });
            return { success: false, error: 'UPLOAD_FAILED', message: uploadError.message };
          }
        }

        const { error: commitError } = await supabase.rpc('commit_photo_upload', {
          p_reservation_id: reservationId,
          p_guest_id: guestId,
          p_media_blob_id: blob.blob_id,
        });

        if (commitError) {
          await supabase.rpc('release_guest_reservation', {
            p_reservation_id: reservationId,
            p_guest_id: guestId,
          });
          return parseVideoError(commitError);
        }

        return {
          success: true,
          videosRemaining: reservation.videos_remaining,
        };
      } catch (err) {
        if (reservationId) {
          await supabase.rpc('release_guest_reservation', {
            p_reservation_id: reservationId,
            p_guest_id: guestId,
          });
        }
        if (err instanceof Error && err.message === 'FILE_MISSING') {
          return { success: false, error: 'VIDEO_FILE_MISSING' };
        }
        return {
          success: false,
          error: 'UPLOAD_FAILED',
          message: err instanceof Error ? err.message : undefined,
        };
      } finally {
        setIsUploading(false);
      }
    },
    [eventId, guestId]
  );

  return { uploadVideo, isUploading };
}
