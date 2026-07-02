'use client';

import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Film,
  GripVertical,
  ImageIcon,
  Music,
  Play,
  Plus,
  Repeat,
  Shuffle,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { ClipTransition, ClipTransitionsMap, SlideshowConfig, StudioPhoto, TimelineAudioClip, TimelineSelection } from './types';
import {
  TRANSITIONS,
  audioDurationMs,
  clipDurationMs,
  transitionGlyph,
  transitionShortLabel,
} from './types';
import { SlideshowPreviewModal } from './SlideshowPreviewModal';

type BinFilter = 'all' | 'photos' | 'videos' | 'sounds';

function VisualClip({
  photo,
  selected,
  onSelect,
  onRemove,
  onDurationChange,
}: {
  photo: StudioPhoto;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDurationChange?: (ms: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `visual:${photo.id}`,
  });
  const width = Math.max(88, Math.min(220, clipDurationMs(photo) / 35));

  function trimBy(deltaMs: number) {
    if (!onDurationChange) return;
    const next = Math.min(15000, Math.max(2000, clipDurationMs(photo) + deltaMs));
    onDurationChange(next);
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, width, opacity: isDragging ? 0.55 : 1 }}
      className={`group relative shrink-0 overflow-hidden border-y border-amber-500/20 ${selected ? 'ring-2 ring-amber-500/60' : 'ring-1 ring-neutral-800'}`}
    >
      {onDurationChange && (
        <>
          <button
            type="button"
            aria-label="Trim start"
            onClick={(e) => {
              e.stopPropagation();
              trimBy(-250);
            }}
            className="absolute bottom-0 left-0 top-0 z-10 w-2 cursor-ew-resize border-l-4 border-amber-500/60 bg-amber-500/5 opacity-0 transition hover:opacity-100 group-hover:opacity-80"
          />
          <button
            type="button"
            aria-label="Trim end"
            onClick={(e) => {
              e.stopPropagation();
              trimBy(250);
            }}
            className="absolute bottom-0 right-0 top-0 z-10 w-2 cursor-ew-resize border-r-4 border-amber-500/60 bg-amber-500/5 opacity-0 transition hover:opacity-100 group-hover:opacity-80"
          />
        </>
      )}
      <button type="button" onClick={onSelect} className="relative block aspect-video w-full bg-black/60">
        {photo.download_url &&
          (photo.media_type === 'video' ? (
            <video src={photo.download_url} className="h-full w-full object-cover" muted playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.download_url} alt="" className="h-full w-full object-cover" />
          ))}
        <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1 text-[9px] font-bold text-white/90">
          {(clipDurationMs(photo) / 1000).toFixed(1)}s
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-1 top-1 rounded bg-black/60 p-0.5 opacity-0 transition group-hover:opacity-100"
        >
          <X className="h-3 w-3 text-white" />
        </button>
      </button>
      <div {...attributes} {...listeners} className="flex cursor-grab items-center gap-1 bg-white/5 px-2 py-1 active:cursor-grabbing">
        <GripVertical className="h-3 w-3 text-white/35" />
        <span className="text-[9px] font-semibold uppercase text-white/40">
          {photo.media_type === 'video' ? 'Video' : 'Photo'}
        </span>
      </div>
    </div>
  );
}

function TransitionMarker({
  afterClipId,
  transition,
  globalType,
  onChange,
}: {
  afterClipId: string;
  transition: ClipTransition | undefined;
  globalType: string;
  onChange: (afterClipId: string, patch: ClipTransition) => void;
}) {
  const [open, setOpen] = useState(false);
  const type = transition?.type ?? globalType;
  const duration = transition?.duration_ms ?? 600;

  return (
    <div className="relative flex shrink-0 items-center self-stretch px-0.5">
      <button
        type="button"
        title={`${transitionShortLabel(type)} · ${duration}ms`}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 min-w-[2rem] flex-col items-center justify-center border border-neutral-800 bg-neutral-950/80 px-1 font-mono text-[9px] uppercase tracking-wider text-neutral-500 transition hover:border-amber-500/30 hover:bg-neutral-900 hover:text-amber-300/90 active:scale-95"
      >
        <span>{transitionGlyph(type)}</span>
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-1/2 z-50 mb-2 w-44 -translate-x-1/2 border border-neutral-800 bg-[#0c0c0e] p-3 shadow-xl">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-neutral-500">Transition</p>
            <select
              value={type}
              onChange={(e) => onChange(afterClipId, { type: e.target.value, duration_ms: duration })}
              className="mb-2 w-full border border-neutral-800 bg-neutral-950 px-2 py-1 font-mono text-[10px] text-neutral-300"
            >
              {TRANSITIONS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-600">
              Duration ms
              <input
                type="number"
                min={0}
                max={3000}
                step={50}
                value={duration}
                onChange={(e) =>
                  onChange(afterClipId, { type, duration_ms: Number(e.target.value) })
                }
                className="mt-1 w-full border border-neutral-800 bg-neutral-950 px-2 py-1 text-center font-mono text-[11px] text-neutral-300"
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}

function AudioClip({
  clip,
  selected,
  onSelect,
  onRemove,
}: {
  clip: TimelineAudioClip;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `audio:${clip.id}`,
  });
  const width = Math.max(100, Math.min(280, audioDurationMs(clip) / 400));

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, width, opacity: isDragging ? 0.55 : 1 }}
      className={`group shrink-0 overflow-hidden rounded-lg ring-2 ${selected ? 'ring-emerald-400' : 'ring-emerald-900/40'}`}
    >
      <button type="button" onClick={onSelect} className="relative flex h-14 w-full flex-col justify-center bg-emerald-950/80 px-3">
        <Music className="h-4 w-4 text-emerald-400/80" />
        <span className="mt-1 truncate text-left text-[10px] font-semibold text-emerald-100">{clip.label}</span>
        <span className="text-[9px] text-emerald-400/60">{(audioDurationMs(clip) / 1000).toFixed(0)}s</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-1 top-1 rounded bg-black/50 p-0.5 opacity-0 transition group-hover:opacity-100"
        >
          <X className="h-3 w-3 text-white" />
        </button>
      </button>
      <div {...attributes} {...listeners} className="flex cursor-grab items-center gap-1 bg-emerald-950/50 px-2 py-1 active:cursor-grabbing">
        <GripVertical className="h-3 w-3 text-emerald-600" />
        <span className="text-[9px] font-semibold uppercase text-emerald-500/70">Sound</span>
      </div>
    </div>
  );
}

function BinItem({
  kind,
  label,
  thumb,
  isVideo,
  onTimeline,
  onAdd,
}: {
  kind: 'visual' | 'audio';
  label: string;
  thumb?: string | null;
  isVideo?: boolean;
  onTimeline: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
      {kind === 'audio' ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 bg-emerald-950/40 p-2">
          <Music className="h-5 w-5 text-emerald-400/70" />
          <span className="line-clamp-2 text-center text-[9px] font-semibold text-emerald-100/80">{label}</span>
        </div>
      ) : thumb ? (
        isVideo ? (
          <video src={thumb} className="h-full w-full object-cover" muted playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        )
      ) : (
        <div className="flex h-full items-center justify-center">
          <ImageIcon className="h-5 w-5 text-white/20" />
        </div>
      )}
      {onTimeline && (
        <span className="absolute left-1 top-1 rounded bg-[#C9A962] px-1 text-[8px] font-bold text-[#1A1612]">IN</span>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
      >
        <span className="flex items-center gap-1 rounded-full bg-[#C9A962] px-2 py-1 text-[10px] font-bold text-[#1A1612]">
          <Plus className="h-3 w-3" />
          Add
        </span>
      </button>
    </div>
  );
}

interface UnifiedTimelineEditorProps {
  approvedMedia: StudioPhoto[];
  config: SlideshowConfig;
  selection: TimelineSelection;
  uploadingAudio: boolean;
  onSelect: (sel: TimelineSelection) => void;
  onConfigChange: (patch: Partial<SlideshowConfig>) => void;
  onSave: () => void;
  onUploadAudio: (file: File) => void;
  onDeleteAudio: (clipId: string) => void;
  onUpdateAudio: (clipId: string, patch: Partial<TimelineAudioClip>) => void;
  variant?: 'default' | 'docked';
  clipTransitions?: ClipTransitionsMap;
  onClipTransitionChange?: (afterClipId: string, patch: ClipTransition) => void;
  onVisualDurationChange?: (photoId: string, ms: number) => void;
}

export function UnifiedTimelineEditor({
  approvedMedia,
  config,
  selection,
  uploadingAudio,
  onSelect,
  onConfigChange,
  onSave,
  onUploadAudio,
  onDeleteAudio,
  onUpdateAudio,
  variant = 'default',
  clipTransitions = {},
  onClipTransitionChange,
  onVisualDurationChange,
}: UnifiedTimelineEditorProps) {
  const [binFilter, setBinFilter] = useState<BinFilter>('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const photoMap = useMemo(() => new Map(approvedMedia.map((p) => [p.id, p])), [approvedMedia]);
  const audioMap = useMemo(
    () => new Map((config.audio_tracks ?? []).map((a) => [a.id, a])),
    [config.audio_tracks]
  );

  const visualClips = useMemo(
    () => config.clip_order.map((id) => photoMap.get(id)).filter(Boolean) as StudioPhoto[],
    [config.clip_order, photoMap]
  );

  const audioClips = useMemo(
    () => config.audio_clip_order.map((id) => audioMap.get(id)).filter(Boolean) as TimelineAudioClip[],
    [config.audio_clip_order, audioMap]
  );

  const visualTotal = visualClips.reduce((s, c) => s + clipDurationMs(c), 0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function reorderVisual(next: string[]) {
    onConfigChange({ clip_order: next });
  }

  function reorderAudio(next: string[]) {
    onConfigChange({ audio_clip_order: next });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith('visual:') && overId.startsWith('visual:')) {
      const ids = visualClips.map((c) => c.id);
      const oldIndex = ids.indexOf(activeId.replace('visual:', ''));
      const newIndex = ids.indexOf(overId.replace('visual:', ''));
      if (oldIndex < 0 || newIndex < 0) return;
      const next = [...ids];
      next.splice(newIndex, 0, next.splice(oldIndex, 1)[0]);
      reorderVisual(next);
    }

    if (activeId.startsWith('audio:') && overId.startsWith('audio:')) {
      const ids = audioClips.map((c) => c.id);
      const oldIndex = ids.indexOf(activeId.replace('audio:', ''));
      const newIndex = ids.indexOf(overId.replace('audio:', ''));
      if (oldIndex < 0 || newIndex < 0) return;
      const next = [...ids];
      next.splice(newIndex, 0, next.splice(oldIndex, 1)[0]);
      reorderAudio(next);
    }
  }

  function addVisual(id: string) {
    if (config.clip_order.includes(id)) return;
    reorderVisual([...config.clip_order, id]);
    onSelect({ kind: 'visual', id });
  }

  function addAudio(id: string) {
    if (config.audio_clip_order.includes(id)) return;
    reorderAudio([...config.audio_clip_order, id]);
    onSelect({ kind: 'audio', id });
  }

  function removeVisual(id: string) {
    reorderVisual(config.clip_order.filter((x) => x !== id));
    if (selection?.kind === 'visual' && selection.id === id) onSelect(null);
  }

  function removeAudio(id: string) {
    reorderAudio(config.audio_clip_order.filter((x) => x !== id));
    if (selection?.kind === 'audio' && selection.id === id) onSelect(null);
  }

  const binPhotos = approvedMedia.filter((p) => p.media_type === 'photo');
  const binVideos = approvedMedia.filter((p) => p.media_type === 'video');
  const binSounds = config.audio_tracks ?? [];

  const binItems: { kind: 'visual' | 'audio'; id: string; label: string; thumb?: string | null; isVideo?: boolean }[] =
    [];
  if (binFilter === 'all' || binFilter === 'photos') {
    binItems.push(...binPhotos.map((p) => ({ kind: 'visual' as const, id: p.id, label: 'Photo', thumb: p.download_url, isVideo: false })));
  }
  if (binFilter === 'all' || binFilter === 'videos') {
    binItems.push(...binVideos.map((p) => ({ kind: 'visual' as const, id: p.id, label: 'Video', thumb: p.download_url, isVideo: true })));
  }
  if (binFilter === 'all' || binFilter === 'sounds') {
    binItems.push(...binSounds.map((s) => ({ kind: 'audio' as const, id: s.id, label: s.label })));
  }

  const selectedAudio =
    selection?.kind === 'audio' ? audioMap.get(selection.id) ?? null : null;

  const docked = variant === 'docked';

  const toolbar = (
    <div className={`flex shrink-0 flex-wrap items-center justify-between gap-2 ${docked ? 'border-b border-neutral-900 px-4 py-2' : ''}`}>
      <div>
        {docked ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Timeline · {visualClips.length} visual · {audioClips.length} audio · ~{(visualTotal / 1000).toFixed(0)}s
          </p>
        ) : (
          <>
            <h2 className="text-lg font-bold">Unified timeline</h2>
            <p className="text-xs text-white/45">
              Momenti Im production — drag photos, videos & sounds. Clients never edit here.
              {' · '}
              {visualClips.length} visual · {audioClips.length} audio · ~{(visualTotal / 1000).toFixed(0)}s
            </p>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={config.transition}
          onChange={(e) => onConfigChange({ transition: e.target.value })}
          className={`rounded border border-neutral-800 bg-neutral-950/60 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400 ${docked ? '' : 'rounded-lg bg-white/5 px-2 py-1.5 text-xs ring-1 ring-white/10'}`}
        >
          {TRANSITIONS.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <Toggle label="Shuffle" active={config.shuffle} onClick={() => onConfigChange({ shuffle: !config.shuffle })} icon={Shuffle} />
        <Toggle label="Loop" active={config.loop} onClick={() => onConfigChange({ loop: !config.loop })} icon={Repeat} />
        <button
          type="button"
          disabled={visualClips.length === 0}
          onClick={() => setPreviewOpen(true)}
          className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider disabled:opacity-40 ${
            docked
              ? 'border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-200/90'
              : 'rounded-lg bg-[#C9A962] px-3 py-1.5 text-xs font-bold text-[#1A1612]'
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          Preview
        </button>
        <button
          type="button"
          onClick={onSave}
          className={
            docked
              ? 'border border-neutral-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-neutral-400 hover:bg-neutral-900'
              : 'rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/15 hover:bg-white/15'
          }
        >
          Save
        </button>
        {!docked && <span className="text-[10px] text-white/35">Changes auto-save</span>}
      </div>
    </div>
  );

  const timelineTracks = (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className={docked ? 'min-h-0 space-y-2' : 'space-y-3'}>
        <TrackLabel icon={Film} label="Visual track" hint="Photos & videos" color="gold" docked={docked} />
        <div className={`overflow-x-auto ${docked ? 'border border-neutral-900 bg-[#020203] p-2' : 'rounded-xl bg-black/40 p-3 ring-1 ring-white/10'}`}>
          <SortableContext items={visualClips.map((c) => `visual:${c.id}`)} strategy={horizontalListSortingStrategy}>
            <div className={`flex min-w-min items-center gap-2 ${docked ? 'min-h-[72px]' : 'min-h-[100px]'}`}>
              {visualClips.length === 0 ? (
                <p className="px-4 font-mono text-[10px] uppercase tracking-wider text-neutral-600">
                  Add media from bin below
                </p>
              ) : (
                visualClips.map((photo, index) => (
                  <div key={photo.id} className="flex min-w-min items-center gap-0">
                    <VisualClip
                      photo={photo}
                      selected={selection?.kind === 'visual' && selection.id === photo.id}
                      onSelect={() => onSelect({ kind: 'visual', id: photo.id })}
                      onRemove={() => removeVisual(photo.id)}
                      onDurationChange={
                        onVisualDurationChange
                          ? (ms) => onVisualDurationChange(photo.id, ms)
                          : undefined
                      }
                    />
                    {index < visualClips.length - 1 && onClipTransitionChange && (
                      <TransitionMarker
                        afterClipId={photo.id}
                        transition={clipTransitions[photo.id]}
                        globalType={config.transition}
                        onChange={onClipTransitionChange}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </SortableContext>
        </div>

        <TrackLabel icon={Music} label="Audio track" hint="Music & sounds" color="emerald" docked={docked} />
        <div className={`overflow-x-auto ${docked ? 'border border-neutral-900 bg-emerald-950/10 p-2' : 'rounded-xl bg-emerald-950/20 p-3 ring-1 ring-emerald-900/30'}`}>
          <SortableContext items={audioClips.map((c) => `audio:${c.id}`)} strategy={horizontalListSortingStrategy}>
            <div className={`flex min-w-min items-center gap-2 ${docked ? 'min-h-[56px]' : 'min-h-[72px]'}`}>
              {audioClips.length === 0 ? (
                <p className="px-4 font-mono text-[10px] uppercase tracking-wider text-emerald-900/80">
                  Upload or add sounds from bin
                </p>
              ) : (
                audioClips.map((clip) => (
                  <AudioClip
                    key={clip.id}
                    clip={clip}
                    selected={selection?.kind === 'audio' && selection.id === clip.id}
                    onSelect={() => onSelect({ kind: 'audio', id: clip.id })}
                    onRemove={() => removeAudio(clip.id)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );

  const mediaBin = (
    <div className={docked ? 'flex min-h-0 flex-1 flex-col border-t border-neutral-900' : 'rounded-xl bg-[#0A0A0B] p-4 ring-1 ring-white/10'}>
      <div className={`flex flex-wrap items-center justify-between gap-2 ${docked ? 'shrink-0 px-4 py-2' : 'mb-3'}`}>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Media bin</p>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ['all', 'All'],
              ['photos', 'Photos'],
              ['videos', 'Videos'],
              ['sounds', 'Sounds'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setBinFilter(key)}
              className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                binFilter === key ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-600 hover:text-neutral-400'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAudio}
            className="inline-flex items-center gap-1 rounded border border-emerald-900/50 bg-emerald-950/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400/90 disabled:opacity-40"
          >
            <Upload className="h-3 w-3" />
            {uploadingAudio ? '…' : 'Upload'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,.mp3,.m4a,.wav"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadAudio(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>
      {binItems.length === 0 ? (
        <p className={`text-center font-mono text-[10px] uppercase tracking-wider text-neutral-600 ${docked ? 'px-4 py-6' : 'py-8 text-xs text-white/35'}`}>
          {binFilter === 'sounds'
            ? 'Upload audio or approve guest media'
            : 'Approve media in gallery to populate bin'}
        </p>
      ) : (
        <div className={`overflow-x-auto ${docked ? 'min-h-0 flex-1 px-4 pb-3' : ''}`}>
          <div className={`grid gap-2 ${docked ? 'grid-flow-col auto-cols-[64px] grid-rows-1' : 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10'}`}>
            {binItems.map((item) => (
              <BinItem
                key={`${item.kind}-${item.id}`}
                kind={item.kind}
                label={item.label}
                thumb={item.thumb}
                isVideo={item.isVideo}
                onTimeline={
                  item.kind === 'visual'
                    ? config.clip_order.includes(item.id)
                    : config.audio_clip_order.includes(item.id)
                }
                onAdd={() => (item.kind === 'visual' ? addVisual(item.id) : addAudio(item.id))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (docked) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {toolbar}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">{timelineTracks}</div>
          {mediaBin}
        </div>
        <SlideshowPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          clips={visualClips}
          config={config}
          musicUrl={audioClips[0]?.url ?? config.music_url}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toolbar}
      {timelineTracks}

      {selectedAudio && (
        <div className="rounded-xl bg-emerald-950/30 p-4 ring-1 ring-emerald-800/40">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-400/70">Selected sound</p>
          {selectedAudio.url && <audio controls src={selectedAudio.url} className="mb-3 w-full" />}
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs text-white/50">
              Volume ({Math.round(selectedAudio.volume * 100)}%)
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(selectedAudio.volume * 100)}
                onChange={(e) => onUpdateAudio(selectedAudio.id, { volume: Number(e.target.value) / 100 })}
                className="mt-1 w-full accent-emerald-400"
              />
            </label>
            <label className="text-xs text-white/50">
              Fade in (ms)
              <input
                type="number"
                value={selectedAudio.fade_in_ms}
                onChange={(e) => onUpdateAudio(selectedAudio.id, { fade_in_ms: Number(e.target.value) })}
                className="mt-1 w-full rounded bg-white/5 px-2 py-1 text-sm ring-1 ring-white/10"
              />
            </label>
            <label className="text-xs text-white/50">
              Fade out (ms)
              <input
                type="number"
                value={selectedAudio.fade_out_ms}
                onChange={(e) => onUpdateAudio(selectedAudio.id, { fade_out_ms: Number(e.target.value) })}
                className="mt-1 w-full rounded bg-white/5 px-2 py-1 text-sm ring-1 ring-white/10"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => onDeleteAudio(selectedAudio.id)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-300 hover:text-red-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete sound file
          </button>
        </div>
      )}

      {mediaBin}

      <SlideshowPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        clips={visualClips}
        config={config}
        musicUrl={audioClips[0]?.url ?? config.music_url}
      />
    </div>
  );
}

function TrackLabel({
  icon: Icon,
  label,
  hint,
  color,
  docked,
}: {
  icon: typeof Film;
  label: string;
  hint: string;
  color: 'gold' | 'emerald';
  docked?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-3.5 w-3.5 ${color === 'gold' ? 'text-amber-500/80' : 'text-emerald-400/80'}`} />
      <span className={docked ? 'font-mono text-[10px] uppercase tracking-wider text-neutral-500' : 'text-sm font-semibold'}>
        {label}
      </span>
      <span className={docked ? 'font-mono text-[10px] text-neutral-700' : 'text-xs text-white/35'}>{hint}</span>
    </div>
  );
}

function Toggle({
  label,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: typeof Shuffle;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold ${
        active ? 'bg-white/15 text-white' : 'bg-white/5 text-white/50'
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
