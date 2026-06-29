'use client';

import type { PhotoEdits, StudioPhoto } from './types';
import { editsToFilter, statusLabel } from './types';

interface CanvasPreviewProps {
  photo: StudioPhoto | null;
  edits: PhotoEdits;
  onOpenLightbox?: () => void;
  playing?: boolean;
}

export function CanvasPreview({ photo, edits, onOpenLightbox, playing }: CanvasPreviewProps) {
  if (!photo?.download_url) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-black/40 ring-1 ring-white/10">
        <p className="text-sm text-white/30">Select media to preview</p>
      </div>
    );
  }

  const filter = editsToFilter(edits);
  const isVideo = photo.media_type === 'video';

  return (
    <button
      type="button"
      onClick={onOpenLightbox}
      className="group relative w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10"
    >
      <div className="relative aspect-video w-full">
        {isVideo ? (
          <video
            src={photo.download_url}
            className="h-full w-full object-contain"
            style={{ filter }}
            muted
            playsInline
            autoPlay={playing}
            loop
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.download_url}
            alt=""
            className="h-full w-full object-contain transition duration-700 group-hover:scale-[1.02]"
            style={{ filter }}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
            {statusLabel(photo.moderation_status)}
            {photo.is_highlight ? ' · Highlight' : ''}
          </p>
        </div>
      </div>
    </button>
  );
}
