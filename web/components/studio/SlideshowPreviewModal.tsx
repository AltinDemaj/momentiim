'use client';

import { useEffect, useRef, useState } from 'react';
import type { SlideshowConfig, StudioPhoto } from './types';
import { clipDurationMs, editsToFilter } from './types';

interface SlideshowPreviewModalProps {
  open: boolean;
  onClose: () => void;
  clips: StudioPhoto[];
  config: SlideshowConfig;
  musicUrl: string | null;
}

export function SlideshowPreviewModal({
  open,
  onClose,
  clips,
  config,
  musicUrl,
}: SlideshowPreviewModalProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = clips[index];
  const isVideo = current?.media_type === 'video';

  useEffect(() => {
    if (open) {
      setIndex(0);
      setPlaying(true);
      setVisible(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !playing || !current || isVideo) return;
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1 >= clips.length ? (config.loop ? 0 : i) : i + 1));
    }, clipDurationMs(current));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, playing, index, current, isVideo, clips.length, config.loop]);

  useEffect(() => {
    if (!open || !musicUrl || !audioRef.current) return;
    const audio = audioRef.current;
    audio.volume = config.music_volume;
    if (playing) audio.play().catch(() => {});
    else audio.pause();
  }, [open, playing, musicUrl, config.music_volume]);

  if (!open) return null;

  const filter = current?.photo_edits
    ? editsToFilter(current.photo_edits as Record<string, number>)
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop />}
      <div className="relative w-full max-w-5xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 text-sm font-semibold text-white/60 hover:text-white"
        >
          Close preview
        </button>

        <div
          className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-white/15"
          onClick={() => setVisible((v) => !v)}
        >
          <div className="aspect-video w-full">
            {current?.download_url ? (
              isVideo ? (
                <video
                  key={current.id}
                  src={current.download_url}
                  className="h-full w-full object-contain"
                  autoPlay
                  muted
                  playsInline
                  onEnded={() =>
                    setIndex((i) => (i + 1 >= clips.length ? (config.loop ? 0 : i) : i + 1))
                  }
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={current.id}
                  src={current.download_url}
                  alt=""
                  className="h-full w-full object-contain transition duration-700"
                  style={{ filter }}
                />
              )
            ) : null}
          </div>

          <div
            className={`absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
              visible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPlaying((p) => !p);
              }}
              className="rounded-full bg-[#F5E9D3] px-4 py-2 text-sm font-bold text-[#1A1612]"
            >
              {playing ? 'Pause' : 'Play'}
            </button>
            <p className="text-sm font-semibold text-white/80">
              {index + 1} / {clips.length} · {config.transition}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
