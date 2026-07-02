'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  ImageIcon,
  Lock,
  Share2,
  Send,
  Users,
  Calendar,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { Breadcrumb, Button, Skeleton } from '@/components/ui/admin-ui';
import { MediaLightbox, type MediaItem } from '@/components/admin/MediaLightbox';
import { GuestFeaturesPanel } from '@/components/admin/GuestFeaturesPanel';
import { TestModePanel } from '@/components/admin/TestModePanel';
import { AudioGuestbookPanel } from '@/components/admin/AudioGuestbookPanel';

interface PhotoRow {
  id: string;
  storage_path: string;
  status: string;
  created_at: string;
  download_url: string | null;
  media_type: 'photo' | 'video';
}

interface EventDetailProps {
  event: {
    id: string;
    title: string;
    date: string;
    client_name: string | null;
    deep_link: string;
    join_code: string;
    reveal_scheduled_at: string | null;
    revealed_at: string | null;
    status: string;
    venue_name?: string | null;
    allow_guest_download?: boolean;
    allow_guest_share?: boolean;
    allow_guest_video?: boolean;
    max_videos_per_guest?: number;
    test_mode?: boolean;
  };
  tier: {
    name: string;
    per_guest_limit: number;
    max_total_photos: number;
  } | null;
  stats: {
    guestCount: number;
    stagingCount: number;
    publishedCount: number;
  };
  joinUrl: string;
  qrDataUrl: string;
  expoGoLink: string | null;
}

type HubTab = 'vault' | 'experience' | 'settings';

function HubPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-neutral-800/70 bg-[#121215] p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function StatusBadge({ status, revealed }: { status: string; revealed: boolean }) {
  if (status !== 'active') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-neutral-700/60 bg-neutral-900/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        Closed
      </span>
    );
  }

  if (revealed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.12)]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Gallery live
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200/90">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
      Collecting live
    </span>
  );
}

function GalleryGrid({
  photos,
  emptyLabel,
  badge,
  onOpen,
}: {
  photos: PhotoRow[];
  emptyLabel: string;
  badge: string;
  onOpen: (item: MediaItem) => void;
}) {
  if (photos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-800/80 px-6 py-12 text-center">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
        <p className="mt-6 text-sm text-neutral-500">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {photos.map((photo) => {
        const isVideo = photo.media_type === 'video';

        return (
          <button
            key={photo.id}
            type="button"
            onClick={() =>
              onOpen({
                id: photo.id,
                download_url: photo.download_url,
                media_type: photo.media_type ?? 'photo',
              })
            }
            className="group relative overflow-hidden rounded-xl border border-neutral-800/60 text-left motion-safe hover:border-neutral-700"
          >
            {photo.download_url ? (
              isVideo ? (
                <video
                  src={photo.download_url}
                  preload="metadata"
                  playsInline
                  muted
                  className="aspect-[4/5] w-full object-cover motion-safe group-hover:scale-[1.02]"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.download_url}
                  alt=""
                  className="aspect-[4/5] w-full object-cover motion-safe group-hover:scale-[1.02]"
                  loading="lazy"
                />
              )
            ) : (
              <Skeleton className="aspect-[4/5] w-full" />
            )}
            {isVideo && (
              <span className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-200/90">
                Reel
              </span>
            )}
            {badge && !isVideo ? (
              <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300/90">
                {badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

const HUB_TABS: { id: HubTab; label: string }[] = [
  { id: 'vault', label: '📸 Live Vault' },
  { id: 'experience', label: '🎯 Guest Experience' },
  { id: 'settings', label: '⚙️ Room Settings & Test' },
];

export function EventDetailClient({
  event,
  tier,
  stats,
  joinUrl,
  qrDataUrl,
  expoGoLink,
}: EventDetailProps) {
  const [staging, setStaging] = useState<PhotoRow[]>([]);
  const [published, setPublished] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copiedJoin, setCopiedJoin] = useState(false);
  const [copiedExpo, setCopiedExpo] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testingOpen, setTestingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<HubTab>('vault');
  const [venueName, setVenueName] = useState(event.venue_name ?? '');
  const [allowDownload, setAllowDownload] = useState(event.allow_guest_download ?? false);
  const [allowShare, setAllowShare] = useState(event.allow_guest_share ?? false);
  const [allowVideo, setAllowVideo] = useState(event.allow_guest_video ?? true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/events/${event.id}/publish`);
    const data = await res.json();
    if (res.ok) {
      const normalize = (rows: PhotoRow[]): PhotoRow[] =>
        (rows ?? []).map((r) => ({
          ...r,
          media_type: (r.media_type === 'video' ? 'video' : 'photo') as PhotoRow['media_type'],
        }));
      setStaging(normalize((data.staging ?? []) as PhotoRow[]));
      setPublished(normalize((data.published ?? []) as PhotoRow[]));
    }
    setLoading(false);
  }, [event.id]);

  useEffect(() => {
    loadPhotos();
    const interval = setInterval(loadPhotos, 15000);
    return () => clearInterval(interval);
  }, [loadPhotos]);

  useEffect(() => {
    fetch(`/api/events/${event.id}/cover`)
      .then((r) => r.json())
      .then((d) => setCoverUrl(d.cover_url ?? null))
      .catch(() => {});
  }, [event.id]);

  async function handlePublish() {
    const approvedCount = staging.filter(
      (p) => (p as PhotoRow & { moderation_status?: string }).moderation_status !== 'rejected'
        && (p as PhotoRow & { moderation_status?: string }).moderation_status !== 'hidden'
    ).length;
    if (!confirm(`Publish approved staging items to the guest room? (${approvedCount} eligible)`)) return;

    setPublishing(true);
    setMessage(null);

    const res = await fetch(`/api/events/${event.id}/publish`, { method: 'POST' });
    const data = await res.json();

    if (res.ok) {
      setMessage(`Published ${data.published_count} photo(s) to the guest room.`);
      await loadPhotos();
    } else {
      setMessage(data.error ?? 'Publish failed');
    }

    setPublishing(false);
  }

  async function copyCode() {
    await navigator.clipboard.writeText(event.join_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  async function copyJoinUrl() {
    await navigator.clipboard.writeText(joinUrl);
    setCopiedJoin(true);
    setTimeout(() => setCopiedJoin(false), 2000);
  }

  async function copyExpoLink() {
    if (!expoGoLink) return;
    await navigator.clipboard.writeText(expoGoLink);
    setCopiedExpo(true);
    setTimeout(() => setCopiedExpo(false), 2000);
  }

  async function shareJoin() {
    if (navigator.share) {
      await navigator.share({
        title: event.title,
        text: `Join ${event.title} on Momenti Im — code ${event.join_code}`,
        url: joinUrl,
      });
    } else {
      copyJoinUrl();
    }
  }

  async function saveGuestSettings() {
    setSavingSettings(true);
    setSettingsMessage(null);

    const res = await fetch(`/api/events/${event.id}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venue_name: venueName.trim() || null,
        allow_guest_download: allowDownload,
        allow_guest_share: allowShare,
        allow_guest_video: allowVideo,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setSettingsMessage('Guest permissions saved.');
    } else {
      setSettingsMessage(data.error ?? 'Could not save settings.');
    }
    setSavingSettings(false);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`/api/events/${event.id}/cover`, { method: 'POST', body: form });
    const data = await res.json();

    if (res.ok) {
      setCoverUrl(data.cover_url ?? null);
      setSettingsMessage('Cover photo updated.');
    } else {
      setSettingsMessage(data.error ?? 'Cover upload failed.');
    }
    setUploadingCover(false);
    e.target.value = '';
  }

  function filterPhotos(list: PhotoRow[]) {
    if (mediaFilter === 'all') return list;
    return list.filter((p) => p.media_type === mediaFilter);
  }

  function ToggleRow({
    label,
    hint,
    checked,
    onChange,
  }: {
    label: string;
    hint: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-neutral-900/80 py-3 last:border-0">
        <span>
          <span className="block text-sm font-medium text-neutral-100">{label}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{hint}</span>
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 accent-amber-400"
        />
      </label>
    );
  }

  const eventDate = new Date(event.date).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const inputClass =
    'mt-2 w-full rounded-[10px] border border-neutral-800/70 bg-neutral-950/50 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30';

  return (
    <div className="relative min-h-full bg-[#09090b]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-[1600px] px-6 pb-16 pt-2">
        <MediaLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />

        <Breadcrumb
          items={[
            { label: 'Momenti Im', href: '/admin/rooms' },
            { label: 'Rooms', href: '/admin/rooms' },
            { label: event.title },
          ]}
        />

        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {event.title}
              </h1>
              <StatusBadge status={event.status} revealed={!!event.revealed_at} />
            </div>
            <p className="text-sm text-neutral-400">
              {event.client_name ? (
                <>
                  For <span className="text-neutral-200">{event.client_name}</span> · {eventDate}
                </>
              ) : (
                eventDate
              )}
            </p>
          </div>
          <Link
            href={`/admin/events/${event.id}/studio`}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-neutral-950/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-amber-200/90 backdrop-blur-md motion-safe hover:bg-neutral-900/80"
          >
            <Lock className="h-4 w-4" />
            Production Studio
          </Link>
        </header>

        <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-12">
          {/* Left — core metrics */}
          <aside className="space-y-4 xl:col-span-3 xl:sticky xl:top-6 xl:self-start">
            <HubPanel>
              <div className="mb-4 flex items-center gap-2 text-amber-400/80">
                <Calendar className="h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Live metrics
                </h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Guests joined', value: stats.guestCount },
                  { label: 'Staging', value: stats.stagingCount, hint: 'Awaiting publish' },
                  { label: 'Live in room', value: stats.publishedCount },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-neutral-800/60 bg-neutral-950/40 px-4 py-3"
                  >
                    <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                      {stat.value}
                    </p>
                    {'hint' in stat && stat.hint && (
                      <p className="mt-0.5 text-[10px] text-neutral-600">{stat.hint}</p>
                    )}
                  </div>
                ))}
              </div>
            </HubPanel>

            {tier && (
              <HubPanel>
                <div className="mb-3 flex items-center gap-2 text-amber-400/80">
                  <Sparkles className="h-4 w-4" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Package
                  </h2>
                </div>
                <p className="text-xl font-semibold text-white">{tier.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {tier.per_guest_limit} shots per guest · {tier.max_total_photos} total pool
                </p>
              </HubPanel>
            )}
          </aside>

          {/* Center — tabbed production desk */}
          <section className="min-w-0 xl:col-span-6">
            <div className="mb-4 flex flex-wrap gap-2">
              {HUB_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-lg px-4 py-2.5 text-xs font-semibold tracking-wide motion-safe ${
                    activeTab === tab.id
                      ? 'border border-amber-500/30 bg-amber-500/10 text-amber-100'
                      : 'border border-transparent bg-neutral-900/40 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'vault' && (
              <HubPanel className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-900/80 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-amber-400/80" />
                      <h2 className="text-lg font-semibold text-white">Organizer vault</h2>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      Photos and reels appear instantly — click to preview.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={publishing || staging.length === 0}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-200/90 disabled:opacity-40"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {publishing ? 'Publishing…' : 'Publish to album'}
                    </button>
                    {(['all', 'photo', 'video'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setMediaFilter(f)}
                        className={`rounded-md px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider ${
                          mediaFilter === f
                            ? 'bg-neutral-800 text-neutral-200'
                            : 'text-neutral-600 hover:text-neutral-400'
                        }`}
                      >
                        {f === 'all' ? 'All' : f === 'photo' ? 'Photos' : 'Reels'}
                      </button>
                    ))}
                  </div>
                </div>

                {message && (
                  <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    {message}
                  </p>
                )}

                {loading ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <section>
                      <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-600">
                        Staging · {filterPhotos(staging).length}
                      </h3>
                      <GalleryGrid
                        photos={filterPhotos(staging)}
                        emptyLabel="No staging moments"
                        badge="Staging"
                        onOpen={setLightboxItem}
                      />
                    </section>
                    <section>
                      <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-600">
                        Guest room · {filterPhotos(published).length}
                      </h3>
                      <GalleryGrid
                        photos={filterPhotos(published)}
                        emptyLabel="Nothing published yet"
                        badge="Live"
                        onOpen={setLightboxItem}
                      />
                    </section>
                  </div>
                )}

                <div className="rounded-xl border border-neutral-900/80 bg-neutral-950/40 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Guest album
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    {event.revealed_at
                      ? `Album went live ${new Date(event.revealed_at).toLocaleString()}`
                      : event.reveal_scheduled_at
                        ? `Scheduled ${new Date(event.reveal_scheduled_at).toLocaleString()}`
                        : 'Publish approved photos from staging to open the guest keepsake album.'}
                  </p>
                  <Button
                    className="mt-4 w-full"
                    onClick={handlePublish}
                    disabled={publishing || staging.length === 0}
                    type="button"
                  >
                    <Send className="h-4 w-4" />
                    {publishing
                      ? 'Publishing…'
                      : staging.length > 0
                        ? `Publish ${staging.length} to guest album`
                        : 'Nothing to publish'}
                  </Button>
                </div>
              </HubPanel>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-4">
                <GuestFeaturesPanel eventId={event.id} />
                <AudioGuestbookPanel eventId={event.id} />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <HubPanel>
                  <div className="mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-400/80" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      Guest permissions
                    </h2>
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-500">
                    Control what guests can do after the album develops.
                  </p>

                  <div className="mt-5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                      Event cover photo
                    </label>
                    {coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverUrl}
                        alt="Event cover"
                        className="mt-2 aspect-[16/9] w-full rounded-lg object-cover border border-neutral-800/60"
                      />
                    )}
                    <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-800/80 bg-neutral-950/30 px-3 py-3 text-xs font-medium text-neutral-400 motion-safe hover:bg-neutral-900/50">
                      {uploadingCover ? 'Uploading…' : coverUrl ? 'Replace cover photo' : 'Upload cover photo'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleCoverUpload}
                        disabled={uploadingCover}
                      />
                    </label>
                  </div>

                  <div className="mt-5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                      Venue name
                    </label>
                    <input
                      type="text"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="Grand Hotel"
                      className={inputClass}
                    />
                  </div>

                  <div className="mt-4">
                    <ToggleRow
                      label="Allow download"
                      hint="Guests can save photos to their camera roll"
                      checked={allowDownload}
                      onChange={setAllowDownload}
                    />
                    <ToggleRow
                      label="Allow share"
                      hint="Guests can share moments from the album"
                      checked={allowShare}
                      onChange={setAllowShare}
                    />
                    <ToggleRow
                      label="Allow video reels"
                      hint="Up to 3 reels per guest, 60 seconds each"
                      checked={allowVideo}
                      onChange={setAllowVideo}
                    />
                  </div>

                  {settingsMessage && (
                    <p className="mt-3 text-xs text-emerald-400">{settingsMessage}</p>
                  )}

                  <Button
                    variant="secondary"
                    className="mt-4 w-full"
                    onClick={saveGuestSettings}
                    disabled={savingSettings}
                    type="button"
                  >
                    {savingSettings ? 'Saving…' : 'Save guest permissions'}
                  </Button>
                </HubPanel>

                <TestModePanel eventId={event.id} testMode={!!event.test_mode} />

                <HubPanel className="overflow-hidden p-0">
                  <button
                    type="button"
                    onClick={() => setTestingOpen((v) => !v)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left motion-safe hover:bg-neutral-900/30"
                  >
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4 text-neutral-500" />
                      <div>
                        <p className="text-sm font-medium text-neutral-200">Testing links</p>
                        <p className="text-xs text-neutral-600">Dev & Expo Go</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-neutral-600 motion-safe ${testingOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {testingOpen && (
                    <div className="space-y-4 border-t border-neutral-900/80 px-6 py-4">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                          Join URL
                        </p>
                        <div className="mt-2 flex gap-2">
                          <code className="flex-1 break-all rounded-lg border border-neutral-800/60 bg-neutral-950/50 px-3 py-2 font-mono text-[11px] text-amber-200/80">
                            {joinUrl}
                          </code>
                          <Button variant="secondary" onClick={copyJoinUrl} type="button" className="px-3">
                            {copiedJoin ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      {expoGoLink && (
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                            Expo Go
                          </p>
                          <div className="mt-2 flex gap-2">
                            <code className="flex-1 break-all rounded-lg border border-neutral-800/60 bg-neutral-950/50 px-3 py-2 font-mono text-[11px] text-emerald-300/80">
                              {expoGoLink}
                            </code>
                            <Button variant="secondary" onClick={copyExpoLink} type="button" className="px-3">
                              {copiedExpo ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      )}
                      <code className="block break-all rounded-lg border border-neutral-800/60 bg-neutral-950/50 px-3 py-2 font-mono text-[11px] text-neutral-500">
                        {event.deep_link}
                      </code>
                    </div>
                  )}
                </HubPanel>
              </div>
            )}
          </section>

          {/* Right — print & share */}
          <aside className="xl:col-span-3 xl:sticky xl:top-6 xl:self-start">
            <HubPanel className="text-center">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-600">
                Print & share suite
              </p>

              <p className="mt-6 text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                Room code
              </p>
              <p className="mt-2 font-mono text-4xl font-bold tracking-[0.2em] text-white">
                {event.join_code}
              </p>
              <button
                type="button"
                onClick={copyCode}
                className="mt-2 text-[11px] text-neutral-600 motion-safe hover:text-amber-400/90"
              >
                {copiedCode ? 'Copied' : 'Copy for phone entry'}
              </button>

              <div className="relative mx-auto mt-8 w-fit">
                <div className="absolute -inset-3 rounded-2xl bg-white/10 blur-xl" />
                <div className="relative rounded-xl bg-white p-4 shadow-[0_0_40px_rgba(255,255,255,0.12)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="Room QR" width={200} height={200} className="rounded-lg" />
                </div>
              </div>
              <p className="mt-4 text-[11px] text-neutral-600">Scan with any camera app</p>

              <div className="mt-6 space-y-2">
                <Link
                  href={`/admin/events/${event.id}/sign`}
                  target="_blank"
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-300 motion-safe hover:bg-neutral-800/80"
                >
                  <Download className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Download sign
                </Link>
                <button
                  type="button"
                  onClick={shareJoin}
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-300 motion-safe hover:bg-neutral-800/80"
                >
                  <Share2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Share link
                </button>
              </div>
            </HubPanel>
          </aside>
        </div>
      </div>
    </div>
  );
}
