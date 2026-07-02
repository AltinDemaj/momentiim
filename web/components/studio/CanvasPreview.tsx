'use client';

import type { PhotoEdits, StudioPhoto } from './types';
import {
  aspectRatioCss,
  editsToFilter,
  editsToTransform,
  statusLabel,
} from './types';

interface CanvasPreviewProps {
  photo: StudioPhoto | null;
  edits: PhotoEdits;
  onOpenLightbox?: () => void;
  playing?: boolean;
  embedded?: boolean;
}

function ViewfinderFrame() {
  const corner = 'absolute h-10 w-10 border-amber-500/25';
  return (
    <>
      <span className={`${corner} left-3 top-3 border-l border-t`} />
      <span className={`${corner} right-3 top-3 border-r border-t`} />
      <span className={`${corner} bottom-3 left-3 border-b border-l`} />
      <span className={`${corner} bottom-3 right-3 border-b border-r`} />
    </>
  );
}

export function CanvasPreview({
  photo,
  edits,
  onOpenLightbox,
  playing,
  embedded,
}: CanvasPreviewProps) {
  const filter = editsToFilter(edits);
  const transform = editsToTransform(edits);
  const aspect = aspectRatioCss(edits.aspectFit);

  if (!photo?.download_url) {
    return (
      <div className="flex h-full w-full items-center justify-center border border-neutral-900 bg-[#030304]">
        <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-600">
          Select media to preview
        </p>
      </div>
    );
  }

  const isVideo = photo.media_type === 'video';

  const frameStyle = aspect
    ? { aspectRatio: aspect, maxHeight: '100%', maxWidth: '100%', height: 'auto', width: 'auto' }
    : { height: '100%', width: '100%', maxHeight: '100%', maxWidth: '100%' };

  return (
    <button
      type="button"
      onClick={onOpenLightbox}
      className={`group relative flex h-full w-full items-center justify-center ${
        embedded ? 'min-h-0 bg-transparent' : 'rounded-2xl bg-black ring-1 ring-white/10'
      }`}
    >
      <div
        className="relative flex items-center justify-center overflow-hidden border border-neutral-900 bg-[#030304]"
        style={frameStyle}
      >
        <ViewfinderFrame />

        {/* Cinematic ambient blur layer */}
        {isVideo ? (
          <video
            src={photo.download_url}
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-105 select-none object-cover opacity-20 blur-3xl"
            muted
            playsInline
            tabIndex={-1}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.download_url}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-105 select-none object-cover opacity-20 blur-3xl"
          />
        )}

        {/* Contained asset — native aspect, never cropped */}
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
          {isVideo ? (
            <video
              src={photo.download_url}
              className="h-full w-full object-contain"
              style={{ filter, transform, transformOrigin: 'center center' }}
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
              className="h-full w-full object-contain"
              style={{ filter, transform, transformOrigin: 'center center' }}
            />
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            {statusLabel(photo.moderation_status)}
            {photo.is_highlight ? ' · Highlight' : ''}
            {edits.aspectFit && edits.aspectFit !== 'native' ? ` · ${edits.aspectFit}` : ''}
          </p>
        </div>
      </div>
    </button>
  );
}
