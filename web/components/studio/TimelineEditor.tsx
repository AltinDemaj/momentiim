'use client';

import { useMemo } from 'react';
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
import { Film, GripVertical } from 'lucide-react';
import type { StudioPhoto } from './types';
import { clipDurationMs } from './types';

function TimelineClip({
  photo,
  selected,
  onSelect,
}: {
  photo: StudioPhoto;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const width = Math.max(80, Math.min(200, clipDurationMs(photo) / 40));

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, width }}
      className={`flex shrink-0 flex-col overflow-hidden rounded-lg ring-2 ${
        selected ? 'ring-[#C9A962]' : 'ring-white/10'
      }`}
    >
      <button type="button" onClick={onSelect} className="relative aspect-video w-full bg-black/50">
        {photo.download_url ? (
          photo.media_type === 'video' ? (
            <video src={photo.download_url} className="h-full w-full object-cover" muted playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.download_url} alt="" className="h-full w-full object-cover" />
          )
        ) : null}
        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[9px] font-bold text-white/80">
          {(clipDurationMs(photo) / 1000).toFixed(1)}s
        </span>
      </button>
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center justify-center gap-1 bg-white/5 py-1 active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3 text-white/40" />
        <span className="text-[9px] font-semibold uppercase text-white/40">
          {photo.media_type === 'video' ? 'Reel' : 'Photo'}
        </span>
      </div>
    </div>
  );
}

interface TimelineEditorProps {
  clips: StudioPhoto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

export function TimelineEditor({ clips, selectedId, onSelect, onReorder }: TimelineEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = useMemo(() => clips.map((c) => c.id), [clips]);
  const totalMs = useMemo(() => clips.reduce((s, c) => s + clipDurationMs(c), 0), [clips]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = [...ids];
    next.splice(newIndex, 0, next.splice(oldIndex, 1)[0]);
    onReorder(next);
  }

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Film className="mb-3 h-10 w-10 text-white/20" />
        <p className="text-sm text-white/50">Approve media in Gallery to build your timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Timeline</h2>
          <p className="text-xs text-white/45">
            {clips.length} clips · ~{(totalMs / 1000).toFixed(0)}s total · drag to reorder
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-black/30 p-4 ring-1 ring-white/10">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
            <div className="flex min-w-min gap-2">
              {clips.map((photo) => (
                <TimelineClip
                  key={photo.id}
                  photo={photo}
                  selected={photo.id === selectedId}
                  onSelect={() => onSelect(photo.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <p className="text-[11px] text-white/35">
        Trim and split coming soon — adjust per-clip duration in the right panel.
      </p>
    </div>
  );
}
