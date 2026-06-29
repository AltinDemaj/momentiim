'use client';

import { useMemo, useState } from 'react';
import { Play, Shuffle, Repeat, Sparkles } from 'lucide-react';
import type { SlideshowConfig, StudioPhoto } from './types';
import { TRANSITIONS, clipDurationMs } from './types';
import { SlideshowPreviewModal } from './SlideshowPreviewModal';

interface SlideshowBuilderProps {
  clips: StudioPhoto[];
  config: SlideshowConfig;
  onConfigChange: (patch: Partial<SlideshowConfig>) => void;
  onSave: () => void;
  musicUrl: string | null;
}

export function SlideshowBuilder({
  clips,
  config,
  onConfigChange,
  onSave,
  musicUrl,
}: SlideshowBuilderProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const orderedClips = useMemo(() => {
    if (config.clip_order.length === 0) return clips;
    const map = new Map(clips.map((c) => [c.id, c]));
    const ordered = config.clip_order.map((id) => map.get(id)).filter(Boolean) as StudioPhoto[];
    const rest = clips.filter((c) => !config.clip_order.includes(c.id));
    return [...ordered, ...rest];
  }, [clips, config.clip_order]);

  const totalSec = orderedClips.reduce((s, c) => s + clipDurationMs(c), 0) / 1000;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Slideshow builder</h2>
          <p className="text-sm text-white/50">
            {orderedClips.length} clips · ~{totalSec.toFixed(0)}s · {config.transition} transition
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            disabled={orderedClips.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#C9A962] px-4 py-2 text-sm font-bold text-[#1A1612] disabled:opacity-40"
          >
            <Play className="h-4 w-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/15 hover:bg-white/15"
          >
            Save slideshow
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Transition</span>
          <select
            value={config.transition}
            onChange={(e) => onConfigChange({ transition: e.target.value })}
            className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm ring-1 ring-white/10"
          >
            {TRANSITIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-3 pt-6">
          <ToggleChip
            icon={Shuffle}
            label="Shuffle"
            active={config.shuffle}
            onClick={() => onConfigChange({ shuffle: !config.shuffle })}
          />
          <ToggleChip
            icon={Repeat}
            label="Loop"
            active={config.loop}
            onClick={() => onConfigChange({ loop: !config.loop })}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
        {orderedClips.map((photo, i) => (
          <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-white/10">
            {photo.download_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.download_url} alt="" className="h-full w-full object-cover" />
            )}
            <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 text-[10px] font-bold text-white">
              {i + 1}
            </span>
          </div>
        ))}
      </div>

      {orderedClips.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <Sparkles className="mb-3 h-10 w-10 text-[#C9A962]/40" />
          <p className="text-sm text-white/50">Build your timeline first — approved clips appear here.</p>
        </div>
      )}

      <SlideshowPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        clips={orderedClips}
        config={config}
        musicUrl={musicUrl}
      />
    </div>
  );
}

function ToggleChip({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Shuffle;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? 'bg-[#C9A962] text-[#1A1612]' : 'bg-white/5 text-white/60 hover:bg-white/10'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
