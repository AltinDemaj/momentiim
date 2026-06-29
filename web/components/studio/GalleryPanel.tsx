'use client';

import {
  AlertTriangle,
  CheckSquare,
  Heart,
  ImageIcon,
  Pin,
  ScanSearch,
  Square,
} from 'lucide-react';
import type { QueueFilter, StudioPhoto } from './types';
import { statusLabel } from './types';

interface GalleryPanelProps {
  photos: StudioPhoto[];
  filtered: StudioPhoto[];
  loading: boolean;
  queueFilter: QueueFilter;
  selectedId: string | null;
  batchMode: boolean;
  batchSelection: Set<string>;
  onFilterChange: (f: QueueFilter) => void;
  onSelect: (id: string) => void;
  onToggleBatch: () => void;
  onToggleBatchItem: (id: string) => void;
  onBatchApprove: () => void;
  onBatchReject: () => void;
  onBatchFavorite: () => void;
  onScan: () => void;
}

export function GalleryPanel({
  photos,
  filtered,
  loading,
  queueFilter,
  selectedId,
  batchMode,
  batchSelection,
  onFilterChange,
  onSelect,
  onToggleBatch,
  onToggleBatchItem,
  onBatchApprove,
  onBatchReject,
  onBatchFavorite,
  onScan,
}: GalleryPanelProps) {
  const reviewCount = photos.filter((p) => p.moderation_status === 'pending' || p.needs_review).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['review', `Review (${reviewCount})`],
              ['approved', 'Approved'],
              ['rejected', 'Rejected'],
              ['hidden', 'Hidden'],
              ['all', 'All media'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onFilterChange(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                queueFilter === key
                  ? 'bg-[#C9A962] text-[#1A1612]'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onScan}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10"
          >
            <ScanSearch className="h-3.5 w-3.5" />
            Smart scan
          </button>
          <button
            type="button"
            onClick={onToggleBatch}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              batchMode ? 'bg-[#C9A962] text-[#1A1612]' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {batchMode ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
            Batch
          </button>
        </div>
      </div>

      {batchMode && batchSelection.size > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <span className="text-xs font-semibold text-white/50">{batchSelection.size} selected</span>
          <button type="button" onClick={onBatchApprove} className="rounded-lg bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">
            Approve all
          </button>
          <button type="button" onClick={onBatchReject} className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300">
            Reject all
          </button>
          <button type="button" onClick={onBatchFavorite} className="rounded-lg bg-pink-500/20 px-3 py-1 text-xs font-bold text-pink-300">
            Favorite all
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-white/40">Loading gallery…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ImageIcon className="mb-3 h-10 w-10 text-white/20" />
          <p className="text-sm text-white/50">No items in this queue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-5">
          {filtered.map((photo) => {
            const isSelected = photo.id === selectedId;
            const inBatch = batchSelection.has(photo.id);
            const isVideo = photo.media_type === 'video';
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => (batchMode ? onToggleBatchItem(photo.id) : onSelect(photo.id))}
                className={`group relative aspect-square overflow-hidden rounded-xl ring-2 transition ${
                  batchMode && inBatch
                    ? 'ring-[#C9A962]'
                    : isSelected
                      ? 'ring-[#C9A962]'
                      : 'ring-transparent hover:ring-white/20'
                }`}
              >
                {photo.download_url ? (
                  isVideo ? (
                    <video src={photo.download_url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.download_url} alt="" className="h-full w-full object-cover" />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center bg-white/5">
                    <ImageIcon className="h-6 w-6 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-white/80">
                    {statusLabel(photo.moderation_status)}
                  </p>
                </div>
                {(photo.needs_review || photo.is_favorite || photo.is_pinned) && (
                  <div className="absolute right-1 top-1 flex gap-1">
                    {photo.needs_review && (
                      <span className="rounded bg-amber-500/90 p-0.5">
                        <AlertTriangle className="h-3 w-3 text-black" />
                      </span>
                    )}
                    {photo.is_favorite && (
                      <span className="rounded bg-pink-500/90 p-0.5">
                        <Heart className="h-3 w-3 text-white" />
                      </span>
                    )}
                    {photo.is_pinned && (
                      <span className="rounded bg-blue-500/90 p-0.5">
                        <Pin className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
