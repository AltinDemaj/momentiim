'use client';

import { useEffect } from 'react';
import { X, Film } from 'lucide-react';

export interface MediaItem {
  id: string;
  download_url: string | null;
  media_type: 'photo' | 'video';
}

interface MediaLightboxProps {
  item: MediaItem | null;
  onClose: () => void;
}

export function MediaLightbox({ item, onClose }: MediaLightboxProps) {
  useEffect(() => {
    if (!item) return undefined;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  if (!item?.download_url) return null;

  const isVideo = item.media_type === 'video';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(11,11,12,0.92)] p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-[rgba(255,255,255,0.1)] p-2 motion-safe hover:bg-[rgba(255,255,255,0.18)]"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-white" />
      </button>

      <div
        className="relative max-h-[90vh] max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={item.download_url}
            controls
            autoPlay
            playsInline
            className="max-h-[85vh] w-full rounded-[16px] bg-black object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.download_url}
            alt=""
            className="max-h-[85vh] w-full rounded-[16px] object-contain"
          />
        )}
        {isVideo && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[rgba(11,11,12,0.72)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-moment-accent)] backdrop-blur-sm">
            <Film className="h-3.5 w-3.5" />
            Reel
          </span>
        )}
      </div>
    </div>
  );
}
