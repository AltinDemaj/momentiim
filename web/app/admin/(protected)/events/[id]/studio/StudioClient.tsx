'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Film,
  ImageIcon,
  Send,
  LayoutTemplate,
} from 'lucide-react';
import { MediaLightbox, type MediaItem } from '@/components/admin/MediaLightbox';
import { CanvasPreview } from '@/components/studio/CanvasPreview';
import { CoverCreator } from '@/components/studio/CoverCreator';
import { GalleryPanel } from '@/components/studio/GalleryPanel';
import { MetadataPanel } from '@/components/studio/MetadataPanel';
import { DeliverPanel } from '@/components/studio/DeliverPanel';
import { AudioMixerPanel } from '@/components/studio/AudioMixerPanel';
import { UnifiedTimelineEditor } from '@/components/studio/UnifiedTimelineEditor';
import { AdminUserMenu } from '@/components/admin/AdminUserMenu';
import type {
  ClipTransition,
  PhotoEdits,
  QueueFilter,
  SlideshowConfig,
  StudioPhoto,
  StudioTab,
  TimelineAudioClip,
  TimelineSelection,
} from '@/components/studio/types';
import { normalizeAudioClip, normalizePhoto } from '@/components/studio/types';
import { useStudioKeyboard } from '@/components/studio/useStudioKeyboard';

const TAB_ICONS: Record<StudioTab, typeof ImageIcon> = {
  gallery: ImageIcon,
  edit: Film,
  cover: LayoutTemplate,
  deliver: Send,
};

const DEFAULT_CONFIG: SlideshowConfig = {
  event_id: '',
  music_storage_path: null,
  music_url: null,
  music_volume: 0.8,
  music_fade_in_ms: 800,
  music_fade_out_ms: 1200,
  music_trim_start_ms: 0,
  music_trim_end_ms: null,
  clip_order: [],
  audio_tracks: [],
  audio_clip_order: [],
  transition: 'crossfade',
  shuffle: false,
  loop: true,
  publish_mode: 'approved_collection',
  hide_videos: false,
  clip_transitions: {},
  updated_at: null,
};

const TAB_LABELS: Record<StudioTab, string> = {
  gallery: 'Gallery',
  edit: 'Edit',
  cover: 'Cover',
  deliver: 'Deliver',
};

interface StudioClientProps {
  event: {
    id: string;
    title: string;
    date: string;
    client_name: string | null;
    join_code: string;
    revealed_at: string | null;
    status: string;
    studio_status?: 'collecting' | 'in_studio' | 'delivered';
    client_album_delivered_at?: string | null;
    client_album_note?: string | null;
    guest_album_live?: boolean;
  };
  userEmail: string;
}

export function StudioClient({ event, userEmail }: StudioClientProps) {
  const [tab, setTab] = useState<StudioTab>('edit');
  const [photos, setPhotos] = useState<StudioPhoto[]>([]);
  const [config, setConfig] = useState<SlideshowConfig>({ ...DEFAULT_CONFIG, event_id: event.id });
  const [loading, setLoading] = useState(true);
  const [timelineSelection, setTimelineSelection] = useState<TimelineSelection>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('review');
  const [publishSelection, setPublishSelection] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [batchSelection, setBatchSelection] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<PhotoEdits>({});
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [studioStatus, setStudioStatus] = useState(event.studio_status ?? 'collecting');
  const [deliveredAt, setDeliveredAt] = useState<string | null>(event.client_album_delivered_at ?? null);
  const [guestAlbumLive, setGuestAlbumLive] = useState(event.guest_album_live ?? !!event.revealed_at);
  const [timelineDirty, setTimelineDirty] = useState(false);
  const configDirtyRef = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  const loadGallery = useCallback(async () => {
    const res = await fetch(`/api/events/${event.id}/publish`);
    const data = await res.json();
    if (res.ok) {
      const all = [
        ...(data.staging ?? []).map(normalizePhoto),
        ...(data.published ?? []).map(normalizePhoto),
      ];
      setPhotos(all);
      setSelectedId((prev) => prev ?? all[0]?.id ?? null);
    }
    setLoading(false);
  }, [event.id]);

  const loadStudioConfig = useCallback(async (force = false) => {
    if (!force && configDirtyRef.current) return;

    const res = await fetch(`/api/events/${event.id}/studio`);
    const data = await res.json();
    if (res.ok && data.slideshow) {
      const slideshow = data.slideshow;
      setConfig({
        ...DEFAULT_CONFIG,
        ...slideshow,
        event_id: event.id,
        audio_tracks: (slideshow.audio_tracks ?? []).map((t: TimelineAudioClip) => normalizeAudioClip(t)),
        audio_clip_order: slideshow.audio_clip_order ?? [],
        clip_transitions: slideshow.clip_transitions ?? {},
      });
    }
  }, [event.id]);

  const loadCover = useCallback(async () => {
    const res = await fetch(`/api/events/${event.id}/cover`);
    const data = await res.json();
    if (res.ok) setCoverUrl(data.cover_url ?? null);
  }, [event.id]);

  const loadPhotos = useCallback(async () => {
    await Promise.all([loadGallery(), loadStudioConfig(), loadCover()]);
  }, [loadGallery, loadStudioConfig, loadCover]);

  useEffect(() => {
    loadPhotos();
    // Refresh gallery only — never overwrite unsaved timeline config
    const interval = setInterval(loadGallery, 60000);
    fetch(`/api/events/${event.id}/studio/deliver`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studio_status: 'in_studio' }),
    }).then(() => setStudioStatus('in_studio'));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearInterval(interval);
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      document.body.style.overflow = prevOverflow;
    };
  }, [loadPhotos, loadGallery, event.id]);

  const selected = useMemo(() => {
    if (timelineSelection?.kind === 'visual') {
      return photos.find((p) => p.id === timelineSelection.id) ?? null;
    }
    return photos.find((p) => p.id === selectedId) ?? null;
  }, [photos, selectedId, timelineSelection]);

  const approvedMedia = useMemo(
    () => photos.filter((p) => p.moderation_status === 'approved'),
    [photos]
  );

  useEffect(() => {
    if (selected?.photo_edits) {
      setEdits(selected.photo_edits as PhotoEdits);
    } else {
      setEdits({});
    }
  }, [selected?.id, selected?.photo_edits]);

  const filtered = useMemo(() => {
    switch (queueFilter) {
      case 'review':
        return photos.filter((p) => p.moderation_status === 'pending' || p.needs_review);
      case 'approved':
        return photos.filter((p) => p.moderation_status === 'approved');
      case 'rejected':
        return photos.filter((p) => p.moderation_status === 'rejected');
      case 'hidden':
        return photos.filter((p) => p.moderation_status === 'hidden');
      default:
        return photos;
    }
  }, [photos, queueFilter]);

  const approvedClips = useMemo(() => {
    const map = new Map(approvedMedia.map((p) => [p.id, p]));
    if (config.clip_order.length) {
      return config.clip_order.map((id) => map.get(id)).filter(Boolean) as StudioPhoto[];
    }
    return approvedMedia;
  }, [approvedMedia, config.clip_order]);

  const approvedStaging = useMemo(
    () => photos.filter((p) => p.status === 'staging' && p.moderation_status === 'approved'),
    [photos]
  );

  const navigate = useCallback(
    (dir: -1 | 1) => {
      const list = tab === 'gallery' ? filtered : approvedClips;
      if (!selectedId || list.length === 0) return;
      const idx = list.findIndex((p) => p.id === selectedId);
      const next = list[(idx + dir + list.length) % list.length];
      if (next) setSelectedId(next.id);
    },
    [filtered, approvedClips, selectedId, tab]
  );

  useStudioKeyboard({
    onApprove: () => selected && moderate(selected.id, 'approve'),
    onReject: () => selected && moderate(selected.id, 'reject'),
    onDelete: () => selected && deletePhoto(selected.id),
    onPrev: () => navigate(-1),
    onNext: () => navigate(1),
    onTogglePlay: () => setPreviewPlaying((p) => !p),
  });

  async function moderate(id: string, action: string) {
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/photos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok) {
      setPhotos((prev) => prev.map((p) => (p.id === id ? normalizePhoto({ ...p, ...data.photo }) : p)));
    } else setMessage(data.error ?? 'Action failed');
    setBusy(false);
  }

  async function updatePhoto(id: string, patch: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch(`/api/photos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', ...patch }),
    });
    const data = await res.json();
    if (res.ok) {
      setPhotos((prev) => prev.map((p) => (p.id === id ? normalizePhoto({ ...p, ...data.photo }) : p)));
      setMessage('Saved.');
    } else setMessage(data.error ?? 'Save failed');
    setBusy(false);
  }

  async function deletePhoto(id: string) {
    if (!confirm('Delete permanently?')) return;
    setBusy(true);
    const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      if (selectedId === id) setSelectedId(null);
    } else {
      const data = await res.json();
      setMessage(data.error ?? 'Delete failed');
    }
    setBusy(false);
  }

  async function batchAction(action: string) {
    const ids = Array.from(batchSelection);
    if (ids.length === 0) return;
    setBusy(true);
    const res = await fetch(`/api/events/${event.id}/studio/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, photo_ids: ids }),
    });
    if (res.ok) {
      setMessage(`Updated ${ids.length} item(s).`);
      setBatchSelection(new Set());
      await loadGallery();
    } else {
      const data = await res.json();
      setMessage(data.error ?? 'Batch failed');
    }
    setBusy(false);
  }

  async function saveSlideshow(patch?: Partial<SlideshowConfig>, opts?: { silent?: boolean }) {
    const body = { ...configRef.current, ...patch };
    if (body.clip_order.length > 0) {
      await fetch(`/api/events/${event.id}/studio/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', order: body.clip_order }),
      });
    }
    const res = await fetch(`/api/events/${event.id}/studio`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clip_order: body.clip_order,
        audio_tracks: body.audio_tracks,
        audio_clip_order: body.audio_clip_order,
        transition: body.transition,
        shuffle: body.shuffle,
        loop: body.loop,
        publish_mode: body.publish_mode,
        hide_videos: body.hide_videos,
        clip_transitions: body.clip_transitions,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      configDirtyRef.current = false;
      setTimelineDirty(false);
      setConfig({
        ...DEFAULT_CONFIG,
        ...data.slideshow,
        event_id: event.id,
        audio_tracks: (data.slideshow.audio_tracks ?? []).map((t: TimelineAudioClip) => normalizeAudioClip(t)),
        audio_clip_order: data.slideshow.audio_clip_order ?? body.audio_clip_order,
        clip_order: data.slideshow.clip_order ?? body.clip_order,
        clip_transitions: data.slideshow.clip_transitions ?? body.clip_transitions,
      });
      if (!opts?.silent) {
        setMessage('Timeline saved.');
      }
    } else if (!opts?.silent) {
      setMessage(data.error ?? 'Save failed');
    }
  }

  const scheduleAutoSave = useCallback(() => {
    configDirtyRef.current = true;
    setTimelineDirty(true);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      void saveSlideshow(undefined, { silent: true });
    }, 1200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  async function uploadAudio(file: File) {
    setUploadingMusic(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/events/${event.id}/studio/audio`, { method: 'POST', body: form });
    const data = await res.json();
    if (res.ok) {
      configDirtyRef.current = false;
      setTimelineDirty(false);
      setConfig((c) => ({
        ...c,
        audio_tracks: (data.slideshow.audio_tracks ?? []).map((t: TimelineAudioClip) => normalizeAudioClip(t)),
        audio_clip_order: data.slideshow.audio_clip_order ?? c.audio_clip_order,
      }));
      setMessage('Sound added to timeline.');
    } else setMessage(data.error ?? 'Upload failed');
    setUploadingMusic(false);
  }

  async function deleteAudio(clipId: string) {
    if (!confirm('Delete this sound permanently?')) return;
    const res = await fetch(`/api/events/${event.id}/studio/audio?clipId=${clipId}`, { method: 'DELETE' });
    if (res.ok) {
      setConfig((c) => ({
        ...c,
        audio_tracks: c.audio_tracks.filter((t) => t.id !== clipId),
        audio_clip_order: c.audio_clip_order.filter((id) => id !== clipId),
      }));
      if (timelineSelection?.kind === 'audio' && timelineSelection.id === clipId) {
        setTimelineSelection(null);
      }
      setMessage('Sound deleted.');
    }
  }

  function updateAudio(clipId: string, patch: Partial<TimelineAudioClip>) {
    setConfig((c) => ({
      ...c,
      audio_tracks: c.audio_tracks.map((t) => (t.id === clipId ? { ...t, ...patch } : t)),
    }));
  }

  function handleTimelineConfigChange(patch: Partial<SlideshowConfig>) {
    setConfig((c) => ({ ...c, ...patch }));
    if ('clip_order' in patch || 'audio_clip_order' in patch || 'clip_transitions' in patch) {
      scheduleAutoSave();
    } else {
      configDirtyRef.current = true;
      setTimelineDirty(true);
    }
  }

  async function runScan() {
    setBusy(true);
    const res = await fetch(`/api/events/${event.id}/studio/scan`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Scanned ${data.scanned} items — ${data.flagged} flagged for review.`);
      await loadGallery();
    } else setMessage(data.error ?? 'Scan failed');
    setBusy(false);
  }

  async function deliverToClient(opts: {
    openGuestRoom: boolean;
    note: string;
    photoIds?: string[];
  }) {
    const clientLabel = event.client_name ?? 'the client';
    const count = opts.photoIds?.length ?? config.clip_order.length ?? approvedStaging.length;
    if (!confirm(`Deliver curated album (${count} items) to ${clientLabel}?`)) return;

    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/events/${event.id}/studio/deliver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        open_guest_room: opts.openGuestRoom,
        delivery_note: opts.note || null,
        photo_ids: opts.photoIds,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStudioStatus('delivered');
      setDeliveredAt(data.event?.client_album_delivered_at ?? new Date().toISOString());
      setGuestAlbumLive(!!data.event?.guest_album_live);
      setMessage(
        opts.openGuestRoom
          ? `Album delivered to ${clientLabel} and guest room is live.`
          : `Album delivered to ${clientLabel}. Guest room stays closed until you open it.`
      );
      setPublishSelection(new Set());
      configDirtyRef.current = false;
      setTimelineDirty(false);
      await Promise.all([loadGallery(), loadStudioConfig(true)]);
    } else {
      setMessage(data.error ?? 'Delivery failed');
    }
    setBusy(false);
  }

  async function openGuestRoomOnly() {
    if (!confirm('Open the guest album for all event guests?')) return;
    setBusy(true);
    const res = await fetch(`/api/events/${event.id}/studio/deliver`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guest_album_live: true }),
    });
    const data = await res.json();
    if (res.ok) {
      setGuestAlbumLive(true);
      setMessage('Guest album is now live.');
    } else setMessage(data.error ?? 'Could not open guest room');
    setBusy(false);
  }

  async function publishSelected(ids?: string[]) {
    await deliverToClient({
      openGuestRoom: false,
      note: '',
      photoIds: ids,
    });
  }

  function handleClipTransitionChange(afterClipId: string, patch: ClipTransition) {
    setConfig((c) => ({
      ...c,
      clip_transitions: { ...(c.clip_transitions ?? {}), [afterClipId]: patch },
    }));
    configDirtyRef.current = true;
    setTimelineDirty(true);
    scheduleAutoSave();
  }

  function handleVisualDurationChange(photoId: string, ms: number) {
    void updatePhoto(photoId, { slide_duration_ms: ms });
  }

  const selectedAudioClip = useMemo(() => {
    if (timelineSelection?.kind !== 'audio') return null;
    return config.audio_tracks.find((t) => t.id === timelineSelection.id) ?? null;
  }, [timelineSelection, config.audio_tracks]);

  const eventDate = new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'long' });

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#070708] text-neutral-200">
      <MediaLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />

      <header className="flex h-11 shrink-0 select-none items-center justify-between border-b border-neutral-900 bg-[#0c0c0e] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/admin/events/${event.id}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center border border-neutral-800 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300"
            title="Back to room"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <p className="truncate font-mono text-xs tracking-wide text-neutral-500">
            <span className="text-neutral-400">Momenti Im Studio</span>
            <span className="mx-2 text-neutral-700">/</span>
            <span className="text-neutral-300">{event.title}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {(message || timelineDirty) && (
            <p className="max-w-[280px] truncate font-mono text-[10px] uppercase tracking-wider text-amber-400/90">
              {message ?? 'Saving timeline…'}
            </p>
          )}
          <AdminUserMenu email={userEmail} />
        </div>
      </header>

      <div className="flex w-full flex-1 overflow-hidden">
        <nav className="flex h-full w-16 shrink-0 flex-col items-center gap-2 border-r border-neutral-900 bg-[#0c0c0e] py-4">
          {(Object.keys(TAB_ICONS) as StudioTab[]).map((id) => {
            const Icon = TAB_ICONS[id];
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                title={TAB_LABELS[id]}
                onClick={() => setTab(id)}
                className={`flex h-11 w-11 items-center justify-center border transition-colors ${
                  active
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-200/90'
                    : 'border-transparent text-neutral-600 hover:border-neutral-800 hover:bg-neutral-900/60 hover:text-neutral-400'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </button>
            );
          })}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#020203] p-4">
            {tab === 'edit' && (
              <div className="h-full w-full">
                <CanvasPreview
                  embedded
                  photo={selected}
                  edits={edits}
                  playing={previewPlaying}
                  onOpenLightbox={() =>
                    selected?.download_url &&
                    setLightboxItem({
                      id: selected.id,
                      download_url: selected.download_url,
                      media_type: selected.media_type,
                    })
                  }
                />
              </div>
            )}

            {tab === 'gallery' && (
              <div className="h-full w-full overflow-y-auto">
                <GalleryPanel
                  photos={photos}
                  filtered={filtered}
                  loading={loading}
                  queueFilter={queueFilter}
                  selectedId={selectedId}
                  batchMode={batchMode}
                  batchSelection={batchSelection}
                  onFilterChange={setQueueFilter}
                  onSelect={(id) => {
                    setSelectedId(id);
                    setTimelineSelection(null);
                  }}
                  onToggleBatch={() => {
                    setBatchMode((b) => !b);
                    setBatchSelection(new Set());
                  }}
                  onToggleBatchItem={(id) =>
                    setBatchSelection((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })
                  }
                  onBatchApprove={() => batchAction('approve')}
                  onBatchReject={() => batchAction('reject')}
                  onBatchFavorite={() => batchAction('favorite')}
                  onScan={runScan}
                />
              </div>
            )}

            {tab === 'cover' && (
              <div className="h-full w-full max-w-5xl overflow-y-auto">
                <CoverCreator
                  eventId={event.id}
                  eventTitle={event.title}
                  eventDate={eventDate}
                  photos={photos}
                  coverUrl={coverUrl}
                  onCoverUpdated={setCoverUrl}
                  onMessage={setMessage}
                />
              </div>
            )}

            {tab === 'deliver' && (
              <div className="h-full w-full max-w-3xl overflow-y-auto">
                <DeliverPanel
                  clientName={event.client_name}
                  eventTitle={event.title}
                  studioStatus={studioStatus}
                  deliveredAt={deliveredAt}
                  guestAlbumLive={guestAlbumLive}
                  approvedStaging={approvedStaging}
                  timelineClipIds={config.clip_order}
                  publishSelection={publishSelection}
                  config={config}
                  busy={busy}
                  onToggleSelect={(id) =>
                    setPublishSelection((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })
                  }
                  onSelectAll={() => setPublishSelection(new Set(approvedStaging.map((p) => p.id)))}
                  onClearSelection={() => setPublishSelection(new Set())}
                  onDeliverToClient={deliverToClient}
                  onOpenGuestRoomOnly={openGuestRoomOnly}
                  onConfigChange={(patch) => setConfig((c) => ({ ...c, ...patch }))}
                  onSaveConfig={() => saveSlideshow()}
                  onScan={runScan}
                />
              </div>
            )}
          </div>

          <div className="flex h-[320px] shrink-0 flex-col overflow-hidden border-t border-neutral-900 bg-[#0c0c0e]">
            <UnifiedTimelineEditor
              variant="docked"
              approvedMedia={approvedMedia}
              config={config}
              selection={timelineSelection}
              uploadingAudio={uploadingMusic}
              clipTransitions={config.clip_transitions ?? {}}
              onClipTransitionChange={handleClipTransitionChange}
              onVisualDurationChange={handleVisualDurationChange}
              onSelect={setTimelineSelection}
              onConfigChange={handleTimelineConfigChange}
              onSave={() => saveSlideshow()}
              onUploadAudio={uploadAudio}
              onDeleteAudio={deleteAudio}
              onUpdateAudio={updateAudio}
            />
          </div>
        </div>

        <aside className="flex h-full w-[360px] shrink-0 flex-col overflow-hidden border-l border-neutral-900 bg-[#0c0c0e]">
          <div className="shrink-0 border-b border-neutral-900 px-5 py-3">
            <p className="font-mono text-xs uppercase tracking-wider text-neutral-500">Inspector</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {selectedAudioClip ? (
              <AudioMixerPanel
                clip={selectedAudioClip}
                onUpdate={(patch) => updateAudio(selectedAudioClip.id, patch)}
                onDelete={() => deleteAudio(selectedAudioClip.id)}
              />
            ) : (
              <MetadataPanel
                variant="docked"
                photo={selected}
                edits={edits}
                busy={busy}
                onEditsChange={setEdits}
                onSaveEdits={() => selected && updatePhoto(selected.id, { photo_edits: edits })}
                onModerate={(action) => selected && moderate(selected.id, action)}
                onDelete={() => selected && deletePhoto(selected.id)}
                onPublishOne={() =>
                  selected && deliverToClient({ openGuestRoom: false, note: '', photoIds: [selected.id] })
                }
                onDurationChange={(ms) => selected && updatePhoto(selected.id, { slide_duration_ms: ms })}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
