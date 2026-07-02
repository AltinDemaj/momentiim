'use client';

import { useEffect, useState } from 'react';
import type { TimelineAudioClip } from './types';
import { dbToVolume, volumeToDb } from './types';
import { PreciseSlider } from './PreciseSlider';

interface AudioMixerPanelProps {
  clip: TimelineAudioClip;
  onUpdate: (patch: Partial<TimelineAudioClip>) => void;
  onDelete: () => void;
}

function LevelMeter({ level }: { level: number }) {
  const bars = 12;
  return (
    <div className="flex h-8 items-end gap-[2px]">
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i + 1) / bars;
        const active = level >= threshold;
        const hot = i >= bars - 3;
        return (
          <div
            key={i}
            className={`w-1.5 rounded-sm transition-all duration-75 ${
              active ? (hot ? 'bg-amber-400/90' : 'bg-emerald-500/80') : 'bg-neutral-800'
            }`}
            style={{ height: `${((i + 1) / bars) * 100}%` }}
          />
        );
      })}
    </div>
  );
}

export function AudioMixerPanel({ clip, onUpdate, onDelete }: AudioMixerPanelProps) {
  const [meterL, setMeterL] = useState(0.35);
  const [meterR, setMeterR] = useState(0.28);
  const gainDb = volumeToDb(clip.volume);

  useEffect(() => {
    const id = setInterval(() => {
      const base = Math.min(1, clip.volume * 1.1);
      setMeterL(base * (0.65 + Math.random() * 0.35));
      setMeterR(base * (0.6 + Math.random() * 0.4));
    }, 120);
    return () => clearInterval(id);
  }, [clip.volume]);

  return (
    <div className="space-y-6 px-5 py-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-500/80">Audio mixer</p>
        <p className="mt-2 truncate text-sm text-neutral-300">{clip.label}</p>
      </div>

      {clip.url && <audio controls src={clip.url} className="w-full" />}

      <div className="border border-neutral-900 bg-[#050506] p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-neutral-600">Stereo level</p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 font-mono text-[9px] text-neutral-700">L</p>
            <LevelMeter level={meterL} />
          </div>
          <div>
            <p className="mb-1 font-mono text-[9px] text-neutral-700">R</p>
            <LevelMeter level={meterR} />
          </div>
        </div>
      </div>

      <PreciseSlider
        label="Gain"
        value={gainDb}
        min={-60}
        max={6}
        step={1}
        unit="dB"
        onChange={(db) => onUpdate({ volume: dbToVolume(db) })}
      />

      <PreciseSlider
        label="Fade in"
        value={clip.fade_in_ms}
        min={0}
        max={5000}
        step={50}
        unit="ms"
        onChange={(fade_in_ms) => onUpdate({ fade_in_ms })}
      />

      <PreciseSlider
        label="Fade out"
        value={clip.fade_out_ms}
        min={0}
        max={5000}
        step={50}
        unit="ms"
        onChange={(fade_out_ms) => onUpdate({ fade_out_ms })}
      />

      <button
        type="button"
        onClick={onDelete}
        className="w-full border border-red-900/50 py-2 font-mono text-[11px] uppercase tracking-wider text-red-400/90 transition hover:bg-red-950/30 active:scale-95"
      >
        Remove from timeline
      </button>
    </div>
  );
}
