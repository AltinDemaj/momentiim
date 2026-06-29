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
  Upload,
  Users,
  Camera,
  Calendar,
  Send,
} from 'lucide-react';
import { Breadcrumb, Button, Card, Skeleton, StatBlock } from '@/components/ui/admin-ui';
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

function StatusBadge({ status, revealed }: { status: string; revealed: boolean }) {
  if (status !== 'active') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-moment-border-strong)] bg-[color:var(--color-moment-card)] px-3 py-1 text-xs font-semibold text-[color:var(--color-moment-muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-moment-muted)]" />
        Closed
      </span>
    );
  }

  if (revealed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(83,215,105,0.35)] bg-[rgba(83,215,105,0.1)] px-3 py-1 text-xs font-semibold text-[color:var(--color-moment-success)]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-moment-success)]" />
        Gallery live
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,233,211,0.25)] bg-[color:var(--color-moment-accent-dim)] px-3 py-1 text-xs font-semibold text-[color:var(--color-moment-accent)]">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-moment-accent)]" />
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
      <div className="rounded-[18px] border border-dashed border-[color:var(--color-moment-border)] px-6 py-14 text-center">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
        <p className="mt-8 text-sm font-medium text-[color:var(--color-moment-text-secondary)]">
          {emptyLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
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
            className="group relative overflow-hidden rounded-[14px] ring-1 ring-[color:var(--color-moment-border)] motion-safe hover:ring-[rgba(245,233,211,0.35)] text-left"
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
              <span className="absolute right-2 top-2 rounded-full bg-[rgba(11,11,12,0.72)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-moment-accent)] backdrop-blur-sm">
                Reel
              </span>
            )}
            {badge && !isVideo ? (
              <span className="absolute left-2 top-2 rounded-full bg-[rgba(11,11,12,0.72)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-moment-accent)] backdrop-blur-sm">
                {badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

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
      <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
        <span>
          <span className="block text-sm font-medium text-[color:var(--color-moment-text)]">
            {label}
          </span>
          <span className="mt-0.5 block text-xs text-[color:var(--color-moment-muted)]">{hint}</span>
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[color:var(--color-moment-accent)]"
        />
      </label>
    );
  }

  const eventDate = new Date(event.date).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const vaultPhotos = [...staging, ...published];

  return (
    <>
      <MediaLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      <Breadcrumb
        items={[
          { label: 'Momenti Im', href: '/admin' },
          { label: 'Rooms', href: '/admin' },
          { label: event.title },
        ]}
      />

      <header className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-gradient">{event.title}</h1>
            <StatusBadge status={event.status} revealed={!!event.revealed_at} />
          </div>
          <p className="max-w-2xl text-sm text-[color:var(--color-moment-text-secondary)]">
            {event.client_name ? (
              <>
                For <span className="text-[color:var(--color-moment-text)]">{event.client_name}</span>
                {' · '}
                {eventDate}
              </>
            ) : (
              eventDate
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/events/${event.id}/studio`}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,233,211,0.25)] bg-[rgba(245,233,211,0.08)] px-4 py-2 text-sm font-semibold text-[color:var(--color-moment-accent)] motion-safe hover:bg-[rgba(245,233,211,0.14)]"
          >
            <Lock className="h-4 w-4" />
            Production Studio
          </Link>
          <p className="max-w-xs text-xs text-[color:var(--color-moment-muted)]">
            Internal only — curate the album here, then deliver to {event.client_name ?? 'the client'}.
          </p>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* Left — event intelligence */}
        <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <Card className="space-y-4">
            <div className="flex items-center gap-2 text-[color:var(--color-moment-accent)]">
              <Calendar className="h-4 w-4" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Event</h2>
            </div>
            <StatBlock label="Guests joined" value={stats.guestCount} />
            <StatBlock label="Staging" value={stats.stagingCount} hint="Awaiting publish" />
            <StatBlock label="Live in room" value={stats.publishedCount} />
          </Card>

          {tier && (
            <Card className="space-y-3">
              <div className="flex items-center gap-2 text-[color:var(--color-moment-accent)]">
                <Camera className="h-4 w-4" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Package</h2>
              </div>
              <p className="text-lg font-bold text-[color:var(--color-moment-text)]">{tier.name}</p>
              <p className="text-sm text-[color:var(--color-moment-muted)]">
                {tier.per_guest_limit} shots per guest · {tier.max_total_photos} total pool
              </p>
            </Card>
          )}

          <Card>
            <div className="flex items-center gap-2 text-[color:var(--color-moment-accent)]">
              <Users className="h-4 w-4" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Guest permissions</h2>
            </div>
            <p className="mt-2 text-xs text-[color:var(--color-moment-muted)]">
              Control what guests can do after the album develops — e.g. wedding couple opts in.
            </p>

            <div className="mt-3">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-moment-muted)]">
                Event cover photo
              </label>
              {coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt="Event cover"
                  className="mt-2 aspect-[16/9] w-full rounded-[10px] object-cover ring-1 ring-[color:var(--color-moment-border)]"
                />
              )}
              <label className="mt-2 flex cursor-pointer items-center justify-center rounded-[10px] border border-dashed border-[color:var(--color-moment-border)] px-3 py-3 text-xs font-medium text-[color:var(--color-moment-accent)] motion-safe hover:bg-[rgba(255,255,255,0.03)]">
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

            <div className="mt-3">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-moment-muted)]">
                Venue name
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Grand Hotel"
                className="mt-2 w-full rounded-[10px] border border-[color:var(--color-moment-border)] bg-[color:var(--color-moment-bg-secondary)] px-3 py-2 text-sm text-[color:var(--color-moment-text)]"
              />
            </div>

            <div className="mt-2 divide-y divide-[color:var(--color-moment-border)]">
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
              <p className="mt-3 text-xs text-[color:var(--color-moment-success)]">{settingsMessage}</p>
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
          </Card>

          <TestModePanel eventId={event.id} testMode={!!(event as { test_mode?: boolean }).test_mode} />

          <GuestFeaturesPanel eventId={event.id} />

          <AudioGuestbookPanel eventId={event.id} />

          <Card>
            <div className="flex items-center gap-2 text-[color:var(--color-moment-accent)]">
              <Users className="h-4 w-4" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Guest album</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-moment-text-secondary)]">
              {event.revealed_at
                ? `Album went live ${new Date(event.revealed_at).toLocaleString()}`
                : event.reveal_scheduled_at
                  ? `Scheduled ${new Date(event.reveal_scheduled_at).toLocaleString()}`
                  : 'Publish approved photos from staging to open the guest keepsake album.'}
            </p>
            <p className="mt-2 text-xs text-[color:var(--color-moment-muted)]">
              {stats.stagingCount > 0
                ? `${stats.stagingCount} moment${stats.stagingCount === 1 ? '' : 's'} in staging · ${stats.publishedCount} live for guests`
                : `${stats.publishedCount} moment${stats.publishedCount === 1 ? '' : 's'} visible in the app`}
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
          </Card>

          <Card className="overflow-hidden p-0">
            <button
              type="button"
              onClick={() => setTestingOpen((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-left motion-safe hover:bg-[rgba(255,255,255,0.03)]"
            >
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-moment-text)]">
                  Testing links
                </p>
                <p className="text-xs text-[color:var(--color-moment-muted)]">Dev & Expo Go</p>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-[color:var(--color-moment-muted)] motion-safe ${testingOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {testingOpen && (
              <div className="space-y-4 border-t border-[color:var(--color-moment-border)] px-5 py-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-moment-muted)]">
                    Join URL
                  </p>
                  <div className="mt-2 flex gap-2">
                    <code className="flex-1 break-all rounded-[10px] bg-[color:var(--color-moment-bg-secondary)] px-3 py-2 font-mono text-[11px] text-[color:var(--color-moment-accent)]">
                      {joinUrl}
                    </code>
                    <Button variant="secondary" onClick={copyJoinUrl} type="button" className="px-3">
                      {copiedJoin ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {expoGoLink && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-moment-muted)]">
                      Expo Go
                    </p>
                    <div className="mt-2 flex gap-2">
                      <code className="flex-1 break-all rounded-[10px] bg-[color:var(--color-moment-bg-secondary)] px-3 py-2 font-mono text-[11px] text-[color:var(--color-moment-success)]">
                        {expoGoLink}
                      </code>
                      <Button variant="secondary" onClick={copyExpoLink} type="button" className="px-3">
                        {copiedExpo ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
                <code className="block break-all rounded-[10px] bg-[color:var(--color-moment-bg-secondary)] px-3 py-2 font-mono text-[11px] text-[color:var(--color-moment-muted)]">
                  {event.deep_link}
                </code>
              </div>
            )}
          </Card>
        </aside>

        {/* Center — live gallery */}
        <section className="min-w-0">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-[color:var(--color-moment-border)] px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-[color:var(--color-moment-accent)]" />
                    <h2 className="text-lg font-semibold text-[color:var(--color-moment-text)]">
                      Live gallery
                    </h2>
                    <span className="text-sm font-normal text-[color:var(--color-moment-muted)]">
                      Organizer vault
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[color:var(--color-moment-muted)]">
                    Photos and reels appear here instantly — click to preview in browser.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={handlePublish}
                    disabled={publishing || staging.length === 0}
                    type="button"
                  >
                    <Send className="h-4 w-4" />
                    {publishing ? 'Publishing…' : 'Publish to album'}
                  </Button>
                  {(['all', 'photo', 'video'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setMediaFilter(f)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize motion-safe ${
                        mediaFilter === f
                          ? 'bg-[color:var(--color-moment-accent-dim)] text-[color:var(--color-moment-accent)] ring-1 ring-[rgba(245,233,211,0.25)]'
                          : 'text-[color:var(--color-moment-muted)] hover:text-[color:var(--color-moment-text-secondary)]'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'photo' ? 'Photos' : 'Reels'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6">
              {message && (
                <p className="mb-4 rounded-[14px] border border-[rgba(83,215,105,0.25)] bg-[rgba(83,215,105,0.08)] px-4 py-3 text-sm text-[color:var(--color-moment-success)]">
                  {message}
                </p>
              )}

              {loading ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[4/5]" />
                  ))}
                </div>
              ) : vaultPhotos.length === 0 ? (
                <GalleryGrid photos={[]} emptyLabel="No moments yet — your vault is ready" badge="" onOpen={setLightboxItem} />
              ) : (
                <div className="space-y-8">
                  <section>
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-moment-muted)]">
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
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-moment-muted)]">
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
            </div>
          </Card>
        </section>

        {/* Right — print & share */}
        <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <div className="glass-panel rounded-[18px] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-moment-muted)]">
              Print & share suite
            </p>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-moment-muted)]">
              Room code
            </p>
            <p className="mt-2 font-mono text-5xl font-bold tracking-[0.22em] text-[color:var(--color-moment-accent)]">
              {event.join_code}
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="mt-3 text-xs text-[color:var(--color-moment-muted)] motion-safe hover:text-[color:var(--color-moment-accent)]"
            >
              {copiedCode ? 'Copied' : 'Copy for phone entry'}
            </button>

            <div className="my-6 h-px bg-[color:var(--color-moment-border)]" />

            <div className="mx-auto w-fit rounded-[16px] bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Room QR" width={200} height={200} className="rounded-[10px]" />
            </div>
            <p className="mt-4 text-center text-xs text-[color:var(--color-moment-muted)]">
              Scan with any camera app
            </p>

            <div className="mt-6 space-y-2">
              <Link
                href={`/admin/events/${event.id}/sign`}
                target="_blank"
                className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[rgba(245,233,211,0.25)] bg-[color:var(--color-moment-accent-dim)] px-4 py-3.5 text-sm font-semibold text-[color:var(--color-moment-accent)] motion-safe hover:bg-[rgba(245,233,211,0.2)]"
              >
                <Download className="h-4 w-4" />
                Download printable table sign
              </Link>
              <Button variant="secondary" className="w-full" onClick={shareJoin} type="button">
                <Share2 className="h-4 w-4" />
                Share join link
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
