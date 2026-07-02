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
import { ASPECT_FIT_PRESETS, PRESETS, statusLabel } from './types';
import { PreciseSlider } from './PreciseSlider';

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant,
  active,
  docked,
}: {
  icon: typeof Check;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'danger';
  active?: boolean;
  docked?: boolean;
}) {
  const base = docked
    ? 'border font-mono text-[10px] uppercase tracking-wider transition hover:bg-neutral-800/80 active:scale-95'
    : 'rounded-lg text-xs font-semibold transition';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 px-2 py-2 disabled:opacity-40 ${
        variant === 'danger'
          ? docked
            ? `${base} border-red-900/50 text-red-400/90 hover:bg-red-950/30`
            : 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30 hover:bg-red-500/25'
          : active
            ? docked
              ? `${base} border-amber-500/40 bg-amber-500/10 text-amber-200/90`
              : 'bg-[#C9A962]/20 text-[#F5E9D3] ring-1 ring-[#C9A962]/40'
            : docked
              ? `${base} border-neutral-800 text-neutral-500 hover:text-neutral-300`
              : 'bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
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
  variant?: 'default' | 'docked';
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
  variant = 'default',
}: MetadataPanelProps) {
  const docked = variant === 'docked';

  if (!photo) {
    return (
      <div className={docked ? 'px-5 py-6' : 'rounded-2xl bg-[#121110]/80 p-6 ring-1 ring-white/10'}>
        <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-600">
          Select an asset to inspect metadata and adjustments.
        </p>
      </div>
    );
  }

  const duration = photo.slide_duration_ms ?? (photo.media_type === 'video' ? 8000 : 4500);
  const sectionTitle = 'font-mono text-[11px] uppercase tracking-wider text-neutral-500';
  const sectionDivider = docked ? 'border-t border-neutral-900 pt-6' : 'border-t border-white/10 pt-4';

  return (
    <div
      className={
        docked
          ? 'space-y-6 px-5 py-6'
          : 'max-h-[calc(100vh-12rem)] space-y-4 overflow-y-auto rounded-2xl bg-[#121110]/80 p-4 ring-1 ring-white/10 backdrop-blur-xl'
      }
    >
      <div>
        <p className={sectionTitle}>Metadata</p>
        <p className="mt-2 text-sm font-medium text-neutral-200">{statusLabel(photo.moderation_status)}</p>
        <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-600">
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
        <ActionBtn docked={docked} icon={Check} label="Approve" disabled={busy} onClick={() => onModerate('approve')} />
        <ActionBtn docked={docked} icon={X} label="Reject" disabled={busy} onClick={() => onModerate('reject')} />
        <ActionBtn docked={docked} icon={EyeOff} label="Hide" disabled={busy} onClick={() => onModerate('hide')} />
        <ActionBtn docked={docked} icon={Trash2} label="Delete" disabled={busy} variant="danger" onClick={onDelete} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ActionBtn
          docked={docked}
          icon={Heart}
          label={photo.is_favorite ? 'Unfavorite' : 'Favorite'}
          disabled={busy}
          active={photo.is_favorite}
          onClick={() => onModerate(photo.is_favorite ? 'unfavorite' : 'favorite')}
        />
        <ActionBtn
          docked={docked}
          icon={Pin}
          label={photo.is_pinned ? 'Unpin' : 'Pin'}
          disabled={busy}
          active={photo.is_pinned}
          onClick={() => onModerate(photo.is_pinned ? 'unpin' : 'pin')}
        />
        <ActionBtn
          docked={docked}
          icon={Star}
          label={photo.is_highlight ? 'Unhighlight' : 'Highlight'}
          disabled={busy}
          active={photo.is_highlight}
          onClick={() => onModerate(photo.is_highlight ? 'unhighlight' : 'highlight')}
        />
        <ActionBtn
          docked={docked}
          icon={ImageIcon}
          label={photo.is_cover_candidate ? 'Remove cover' : 'Cover pick'}
          disabled={busy}
          active={photo.is_cover_candidate}
          onClick={() =>
            onModerate(photo.is_cover_candidate ? 'uncover_candidate' : 'cover_candidate')
          }
        />
      </div>

      <div className={`space-y-4 ${sectionDivider}`}>
        <p className={sectionTitle}>Transform & crop</p>
        <PreciseSlider
          label="Scale"
          value={edits.scale ?? 100}
          min={50}
          max={200}
          step={1}
          unit="%"
          onChange={(scale) => onEditsChange({ ...edits, scale })}
        />
        <PreciseSlider
          label="Position X"
          value={edits.offsetX ?? 0}
          min={-400}
          max={400}
          step={1}
          unit="px"
          onChange={(offsetX) => onEditsChange({ ...edits, offsetX })}
        />
        <PreciseSlider
          label="Position Y"
          value={edits.offsetY ?? 0}
          min={-400}
          max={400}
          step={1}
          unit="px"
          onChange={(offsetY) => onEditsChange({ ...edits, offsetY })}
        />
        <div className="space-y-2">
          <p className={sectionTitle}>Aspect fit</p>
          <div className="flex flex-wrap gap-1.5">
            {ASPECT_FIT_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onEditsChange({ ...edits, aspectFit: p.id })}
                className={`rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition hover:bg-neutral-800/80 active:scale-95 ${
                  (edits.aspectFit ?? 'native') === p.id
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-200/90'
                    : 'border-neutral-800 text-neutral-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`space-y-4 ${sectionDivider}`}>
        <p className={sectionTitle}>Clip duration</p>
        <PreciseSlider
          label="Display time"
          value={duration}
          min={2000}
          max={15000}
          step={100}
          unit="ms"
          onChange={onDurationChange}
        />
      </div>

      <div className={`space-y-4 ${sectionDivider}`}>
        <p className={sectionTitle}>Adjustments</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onEditsChange({ ...edits, preset: p.id === 'none' ? undefined : p.id })}
              className={`rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition hover:bg-neutral-800/80 active:scale-95 ${
                (edits.preset ?? 'none') === p.id
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-200/90'
                  : 'border-neutral-800 text-neutral-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <PreciseSlider
          label="Brightness"
          value={edits.brightness ?? 0}
          onChange={(v) => onEditsChange({ ...edits, brightness: v })}
        />
        <PreciseSlider
          label="Contrast"
          value={edits.contrast ?? 0}
          onChange={(v) => onEditsChange({ ...edits, contrast: v })}
        />
        <PreciseSlider
          label="Saturation"
          value={edits.saturation ?? 0}
          onChange={(v) => onEditsChange({ ...edits, saturation: v })}
        />
        <PreciseSlider
          label="Warmth"
          value={edits.warmth ?? 0}
          onChange={(v) => onEditsChange({ ...edits, warmth: v })}
        />
        <button
          type="button"
          disabled={busy}
          onClick={onSaveEdits}
          className="w-full border border-neutral-800 bg-neutral-900/50 py-2.5 font-mono text-[11px] uppercase tracking-wider text-neutral-300 transition hover:bg-neutral-800/80 active:scale-95 disabled:opacity-40"
        >
          Save adjustments
        </button>
      </div>

      {onPublishOne && photo.status === 'staging' && photo.moderation_status === 'approved' && (
        <button
          type="button"
          disabled={busy}
          onClick={onPublishOne}
          className="flex w-full items-center justify-center gap-2 border border-amber-500/30 bg-amber-500/10 py-2.5 font-mono text-[11px] uppercase tracking-wider text-amber-200/90 transition hover:bg-amber-500/15 active:scale-95 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          Deliver to client
        </button>
      )}

      <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-700">
        A approve · R reject · ← → navigate · Space preview
      </p>
    </div>
  );
}
