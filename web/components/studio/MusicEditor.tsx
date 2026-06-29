'use client';

import { useRef, useState } from 'react';
import { Music, Trash2, Upload, Volume2 } from 'lucide-react';
import type { SlideshowConfig } from './types';

interface MusicEditorProps {
  config: SlideshowConfig;
  musicUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onConfigChange: (patch: Partial<SlideshowConfig>) => void;
  onSave: () => void;
}

export function MusicEditor({
  config,
  musicUrl,
  uploading,
  onUpload,
  onRemove,
  onConfigChange,
  onSave,
}: MusicEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  const playbackUrl = localUrl ?? musicUrl;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localUrl) URL.revokeObjectURL(localUrl);
    setLocalUrl(URL.createObjectURL(file));
    onUpload(file);
    e.target.value = '';
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Music editor</h2>
        <p className="text-sm text-white/50">Upload a track, trim, and sync with your slideshow length.</p>
      </div>

      <div className="rounded-2xl bg-black/30 p-6 ring-1 ring-white/10">
        {playbackUrl ? (
          <div className="space-y-4">
            <audio controls src={playbackUrl} className="w-full" />
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-2 text-xs font-semibold text-red-300 hover:text-red-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove track
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <Music className="mb-3 h-10 w-10 text-white/20" />
            <p className="mb-4 text-sm text-white/50">No music uploaded yet</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#C9A962] px-5 py-2.5 text-sm font-bold text-[#1A1612] disabled:opacity-40"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading…' : 'Upload music'}
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="audio/mpeg,audio/mp4,audio/wav,audio/aac,audio/ogg,.mp3,.m4a,.wav"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Slider label="Volume" value={Math.round(config.music_volume * 100)} max={100} onChange={(v) => onConfigChange({ music_volume: v / 100 })} icon={Volume2} />
        <Slider label="Fade in (ms)" value={config.music_fade_in_ms} max={5000} onChange={(v) => onConfigChange({ music_fade_in_ms: v })} />
        <Slider label="Fade out (ms)" value={config.music_fade_out_ms} max={5000} onChange={(v) => onConfigChange({ music_fade_out_ms: v })} />
        <Slider label="Trim start (ms)" value={config.music_trim_start_ms} max={60000} onChange={(v) => onConfigChange({ music_trim_start_ms: v })} />
        <Slider
          label="Trim end (ms)"
          value={config.music_trim_end_ms ?? 0}
          max={300000}
          onChange={(v) => onConfigChange({ music_trim_end_ms: v || null })}
        />
      </div>

      <button
        type="button"
        onClick={onSave}
        className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold ring-1 ring-white/15 hover:bg-white/15"
      >
        Save music settings
      </button>
    </div>
  );
}

function Slider({
  label,
  value,
  max,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  icon?: typeof Volume2;
}) {
  return (
    <label className="block space-y-2 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex items-center gap-2 text-xs font-semibold text-white/50">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
        <span className="ml-auto tabular-nums text-white/70">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#C9A962]"
      />
    </label>
  );
}
