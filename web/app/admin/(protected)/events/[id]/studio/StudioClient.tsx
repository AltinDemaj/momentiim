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
import { UnifiedTimelineEditor } from '@/components/studio/UnifiedTimelineEditor';
import type {
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
  updated_at: null,
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
}

export function StudioClient({ event }: StudioClientProps) {
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
    return () => {
      clearInterval(interval);
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
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
    if ('clip_order' in patch || 'audio_clip_order' in patch) {
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

  const eventDate = new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'long' });

  return (
    <div className="studio-shell min-h-screen bg-[#0B0B0C] text-[#E8E4DC]">
      <MediaLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0B0C]/90 px-1 py-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/events/${event.id}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9A962]">
              Momenti Im Studio · Internal
            </p>
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">{event.title}</h1>
              <p className="text-xs text-white/45">
                {event.client_name ? `${event.client_name} · ` : ''}
                {eventDate}
              </p>
            </div>
          </div>
          {(message || timelineDirty) && (
            <p className="max-w-sm truncate rounded-xl bg-[#C9A962]/10 px-4 py-2 text-sm text-[#F5E9D3] ring-1 ring-[#C9A962]/30">
              {message ?? (timelineDirty ? 'Saving timeline…' : '')}
            </p>
          )}
        </div>
      </header>

      <div className="grid gap-0 lg:grid-cols-[72px_minmax(0,1fr)_300px]">
        <nav className="hidden border-r border-white/10 bg-[#0E0E0F] py-4 lg:flex lg:flex-col lg:items-center lg:gap-1">
          {(Object.keys(TAB_ICONS) as StudioTab[]).map((id) => {
            const Icon = TAB_ICONS[id];
            return (
              <button
                key={id}
                type="button"
                title={id}
                onClick={() => setTab(id)}
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                  tab === id
                    ? 'bg-[#C9A962]/20 text-[#F5E9D3] ring-1 ring-[#C9A962]/50'
                    : 'text-white/45 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </nav>

        <div className="flex min-h-[calc(100vh-5rem)] flex-col">
          <div className="flex gap-1 overflow-x-auto border-b border-white/10 bg-[#0E0E0F] px-3 py-2 lg:hidden">
            {(Object.keys(TAB_ICONS) as StudioTab[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                  tab === id ? 'bg-[#C9A962] text-[#1A1612]' : 'bg-white/5 text-white/60'
                }`}
              >
                {id}
              </button>
            ))}
          </div>

          {(tab === 'gallery' || tab === 'edit') && (
            <div className="border-b border-white/10 bg-[#0A0A0B] p-4">
              <CanvasPreview
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

          <main className="flex-1 p-4 md:p-6">
            {tab === 'gallery' && (
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
            )}
            {tab === 'edit' && (
              <UnifiedTimelineEditor
                approvedMedia={approvedMedia}
                config={config}
                selection={timelineSelection}
                uploadingAudio={uploadingMusic}
                onSelect={setTimelineSelection}
                onConfigChange={handleTimelineConfigChange}
                onSave={() => saveSlideshow()}
                onUploadAudio={uploadAudio}
                onDeleteAudio={deleteAudio}
                onUpdateAudio={updateAudio}
              />
            )}
            {tab === 'cover' && (
              <CoverCreator
                eventId={event.id}
                eventTitle={event.title}
                eventDate={eventDate}
                photos={photos}
                coverUrl={coverUrl}
                onCoverUpdated={setCoverUrl}
                onMessage={setMessage}
              />
            )}
            {tab === 'deliver' && (
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
            )}
          </main>
        </div>

        <aside className="hidden border-l border-white/10 bg-[#0E0E0F] p-4 lg:block">
          {timelineSelection?.kind === 'audio' ? (
            <div className="rounded-2xl bg-emerald-950/30 p-4 ring-1 ring-emerald-800/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/70">Audio clip</p>
              <p className="mt-2 text-sm text-white/70">Adjust volume and fades in the timeline panel, or remove from track with ×.</p>
            </div>
          ) : (
            <MetadataPanel
              photo={selected}
              edits={edits}
              busy={busy}
              onEditsChange={setEdits}
              onSaveEdits={() => selected && updatePhoto(selected.id, { photo_edits: edits })}
              onModerate={(action) => selected && moderate(selected.id, action)}
              onDelete={() => selected && deletePhoto(selected.id)}
              onPublishOne={() => selected && deliverToClient({ openGuestRoom: false, note: '', photoIds: [selected.id] })}
              onDurationChange={(ms) => selected && updatePhoto(selected.id, { slide_duration_ms: ms })}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
