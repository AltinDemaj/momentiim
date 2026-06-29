'use client';

import {
  Check,
  EyeOff,
  Heart,
  ImageIcon,
  Pin,
  Send,
  Star,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';
import type { PhotoEdits, StudioPhoto } from './types';
import { PRESETS, statusLabel } from './types';

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant,
  active,
}: {
  icon: typeof Check;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'danger';
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition disabled:opacity-40 ${
        variant === 'danger'
          ? 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30 hover:bg-red-500/25'
          : active
            ? 'bg-[#C9A962]/20 text-[#F5E9D3] ring-1 ring-[#C9A962]/40'
            : 'bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function SliderRow({
  label,
  value,
  min = -100,
  max = 100,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="font-medium text-white/50">{label}</span>
        <span className="tabular-nums text-white/70">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#C9A962]"
      />
    </label>
  );
}

interface MetadataPanelProps {
  photo: StudioPhoto | null;
  edits: PhotoEdits;
  busy: boolean;
  onEditsChange: (edits: PhotoEdits) => void;
  onSaveEdits: () => void;
  onModerate: (action: string) => void;
  onDelete: () => void;
  onPublishOne?: () => void;
  onDurationChange: (ms: number) => void;
}

export function MetadataPanel({
  photo,
  edits,
  busy,
  onEditsChange,
  onSaveEdits,
  onModerate,
  onDelete,
  onPublishOne,
  onDurationChange,
}: MetadataPanelProps) {
  if (!photo) {
    return (
      <div className="rounded-2xl bg-[#121110]/80 p-6 ring-1 ring-white/10">
        <p className="text-sm text-white/40">Select an item to edit metadata and adjustments.</p>
      </div>
    );
  }

  const duration = photo.slide_duration_ms ?? (photo.media_type === 'video' ? 8000 : 4500);

  return (
    <div className="max-h-[calc(100vh-12rem)] space-y-4 overflow-y-auto rounded-2xl bg-[#121110]/80 p-4 ring-1 ring-white/10 backdrop-blur-xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Metadata</p>
        <p className="mt-1 text-sm font-medium">{statusLabel(photo.moderation_status)}</p>
        <p className="text-[11px] text-white/40">
          {photo.media_type === 'video' ? 'Video' : 'Photo'} ·{' '}
          {new Date(photo.created_at).toLocaleString()}
        </p>
        {photo.needs_review && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {photo.review_flags.length > 0 ? photo.review_flags.join(', ') : 'Needs review'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ActionBtn icon={Check} label="Approve" disabled={busy} onClick={() => onModerate('approve')} />
        <ActionBtn icon={X} label="Reject" disabled={busy} onClick={() => onModerate('reject')} />
        <ActionBtn icon={EyeOff} label="Hide" disabled={busy} onClick={() => onModerate('hide')} />
        <ActionBtn icon={Trash2} label="Delete" disabled={busy} variant="danger" onClick={onDelete} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ActionBtn
          icon={Heart}
          label={photo.is_favorite ? 'Unfavorite' : 'Favorite'}
          disabled={busy}
          active={photo.is_favorite}
          onClick={() => onModerate(photo.is_favorite ? 'unfavorite' : 'favorite')}
        />
        <ActionBtn
          icon={Pin}
          label={photo.is_pinned ? 'Unpin' : 'Pin'}
          disabled={busy}
          active={photo.is_pinned}
          onClick={() => onModerate(photo.is_pinned ? 'unpin' : 'pin')}
        />
        <ActionBtn
          icon={Star}
          label={photo.is_highlight ? 'Unhighlight' : 'Highlight'}
          disabled={busy}
          active={photo.is_highlight}
          onClick={() => onModerate(photo.is_highlight ? 'unhighlight' : 'highlight')}
        />
        <ActionBtn
          icon={ImageIcon}
          label={photo.is_cover_candidate ? 'Remove cover' : 'Cover pick'}
          disabled={busy}
          active={photo.is_cover_candidate}
          onClick={() =>
            onModerate(photo.is_cover_candidate ? 'uncover_candidate' : 'cover_candidate')
          }
        />
      </div>

      <div className="space-y-3 border-t border-white/10 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Clip duration</p>
        <SliderRow
          label="Display time (ms)"
          value={duration}
          min={2000}
          max={15000}
          onChange={onDurationChange}
        />
      </div>

      <div className="space-y-3 border-t border-white/10 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Adjustments</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onEditsChange({ ...edits, preset: p.id === 'none' ? undefined : p.id })}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                (edits.preset ?? 'none') === p.id
                  ? 'bg-[#C9A962] text-[#1A1612]'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <SliderRow
          label="Brightness"
          value={edits.brightness ?? 0}
          onChange={(v) => onEditsChange({ ...edits, brightness: v })}
        />
        <SliderRow
          label="Contrast"
          value={edits.contrast ?? 0}
          onChange={(v) => onEditsChange({ ...edits, contrast: v })}
        />
        <SliderRow
          label="Saturation"
          value={edits.saturation ?? 0}
          onChange={(v) => onEditsChange({ ...edits, saturation: v })}
        />
        <SliderRow
          label="Warmth"
          value={edits.warmth ?? 0}
          onChange={(v) => onEditsChange({ ...edits, warmth: v })}
        />
        <button
          type="button"
          disabled={busy}
          onClick={onSaveEdits}
          className="w-full rounded-xl bg-white/10 py-2 text-xs font-semibold ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-40"
        >
          Save adjustments
        </button>
      </div>

      {onPublishOne && photo.status === 'staging' && photo.moderation_status === 'approved' && (
        <button
          type="button"
          disabled={busy}
          onClick={onPublishOne}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A962] py-2.5 text-sm font-bold text-[#1A1612] disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          Deliver to client
        </button>
      )}

      <p className="text-[10px] text-white/30">
        Shortcuts: A approve · R reject · ← → navigate · Space preview
      </p>
    </div>
  );
}
