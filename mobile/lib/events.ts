import { supabase, EVENT_PHOTOS_BUCKET } from './supabase';
import { getDeviceId } from './device';
import { ensureGuestSession } from './auth';
import { getPlaceholderHero } from './heroPlaceholders';

export interface GuestEventSummary {
  eventId: string;
  title: string;
  clientName: string | null;
  date: string;
  revealScheduledAt: string | null;
  revealedAt: string | null;
  joinCode: string;
  guestId: string;
  photosRemaining: number;
  perGuestLimit: number;
  publishedCount: number;
  photosTaken: number;
  venueName: string | null;
  guestCount: number;
  coverUrl: string | null;
  coverIsPlaceholder: boolean;
  allowDownload: boolean;
  allowShare: boolean;
  allowVideo: boolean;
  videosRemaining: number;
  maxVideos: number;
  testMode: boolean;
}

export interface MemoryAlbum {
  eventId: string;
  title: string;
  clientName: string | null;
  date: string;
  revealScheduledAt: string | null;
  revealedAt: string | null;
  publishedCount: number;
  status: 'developing' | 'developed';
  coverUrl: string | null;
  coverIsPlaceholder: boolean;
  allowDownload: boolean;
  allowShare: boolean;
}

async function resolveEventCoverUrl(
  eventId: string,
  coverImagePath: string | null
): Promise<{ url: string; isPlaceholder: boolean }> {
  if (coverImagePath) {
    const { data: signed } = await supabase.storage
      .from(EVENT_PHOTOS_BUCKET)
      .createSignedUrl(coverImagePath, 3600);
    if (signed?.signedUrl) return { url: signed.signedUrl, isPlaceholder: false };
  }

  const { data: coverPhoto } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('event_id', eventId)
    .eq('status', 'published')
    .eq('media_type', 'photo')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (coverPhoto?.storage_path) {
    const { data: signed } = await supabase.storage
      .from(EVENT_PHOTOS_BUCKET)
      .createSignedUrl(coverPhoto.storage_path, 3600);
    if (signed?.signedUrl) return { url: signed.signedUrl, isPlaceholder: false };
  }

  return { url: getPlaceholderHero(eventId), isPlaceholder: true };
}

export async function fetchGuestEventSummary(eventId: string): Promise<GuestEventSummary | null> {
  await ensureGuestSession();
  const deviceId = await getDeviceId();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(
      'id, title, client_name, date, reveal_scheduled_at, revealed_at, join_code, venue_name, allow_guest_download, allow_guest_share, allow_guest_video, max_videos_per_guest, cover_image_path, test_mode'
    )
    .eq('id', eventId)
    .maybeSingle();

  if (eventError || !event) return null;

  const { data: guest, error: guestError } = await supabase
    .from('event_guests')
    .select('id, photos_remaining, videos_remaining')
    .eq('event_id', eventId)
    .eq('device_id', deviceId)
    .maybeSingle();

  if (guestError || !guest) return null;

  const { data: tierRow } = await supabase
    .from('events')
    .select('package_tiers(per_guest_limit)')
    .eq('id', eventId)
    .maybeSingle();

  const tier = tierRow?.package_tiers as { per_guest_limit: number } | null;
  const perGuestLimit = tier?.per_guest_limit ?? guest.photos_remaining;

  const [{ count: publishedCount }, { count: guestCount }] = await Promise.all([
    supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'published'),
    supabase
      .from('event_guests')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId),
  ]);

  const photosTaken = Math.max(0, perGuestLimit - guest.photos_remaining);
  const cover = await resolveEventCoverUrl(eventId, event.cover_image_path);

  return {
    eventId: event.id,
    title: event.title,
    clientName: event.client_name,
    date: event.date,
    revealScheduledAt: event.reveal_scheduled_at,
    revealedAt: event.revealed_at,
    joinCode: event.join_code,
    guestId: guest.id,
    photosRemaining: guest.photos_remaining,
    perGuestLimit,
    publishedCount: publishedCount ?? 0,
    photosTaken,
    venueName: event.venue_name,
    guestCount: guestCount ?? 0,
    coverUrl: cover.url,
    coverIsPlaceholder: cover.isPlaceholder,
    allowDownload: event.allow_guest_download ?? false,
    allowShare: event.allow_guest_share ?? false,
    allowVideo: event.allow_guest_video ?? true,
    videosRemaining: guest.videos_remaining ?? 0,
    maxVideos: event.max_videos_per_guest ?? 3,
    testMode: event.test_mode ?? false,
  };
}

export async function fetchMemoryAlbums(eventIds: string[]): Promise<MemoryAlbum[]> {
  if (eventIds.length === 0) return [];
  await ensureGuestSession();

  const albums: MemoryAlbum[] = [];

  for (const eventId of eventIds) {
    const { data: event } = await supabase
      .from('events')
      .select(
        'id, title, client_name, date, reveal_scheduled_at, revealed_at, allow_guest_download, allow_guest_share, cover_image_path'
      )
      .eq('id', eventId)
      .maybeSingle();

    if (!event) continue;

    const { count } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'published');

    const publishedCount = count ?? 0;
    const isDeveloped = !!event.revealed_at || publishedCount > 0;
    const status: MemoryAlbum['status'] = isDeveloped ? 'developed' : 'developing';
    const cover = await resolveEventCoverUrl(eventId, event.cover_image_path);

    albums.push({
      eventId: event.id,
      title: event.title,
      clientName: event.client_name,
      date: event.date,
      revealScheduledAt: event.reveal_scheduled_at,
      revealedAt: event.revealed_at,
      publishedCount,
      status,
      coverUrl: cover.url,
      coverIsPlaceholder: cover.isPlaceholder,
      allowDownload: event.allow_guest_download ?? false,
      allowShare: event.allow_guest_share ?? false,
    });
  }

  return albums;
}

export async function fetchPublishedPhotos(eventId: string) {
  await ensureGuestSession();

  const [{ data: photos, error }, { data: slideshow }] = await Promise.all([
    supabase
      .from('photos')
      .select('id, storage_path, created_at, published_at, media_type, moderation_status, slide_duration_ms, is_favorite, is_highlight, uploaded_by_guest_id')
      .eq('event_id', eventId)
      .eq('status', 'published')
      .eq('moderation_status', 'approved')
      .order('published_at', { ascending: false }),
    supabase.from('event_slideshows').select('clip_order, hide_videos, publish_mode, shuffle').eq('event_id', eventId).maybeSingle(),
  ]);

  if (error || !photos?.length) return [];

  let filtered = photos;
  if (slideshow?.hide_videos || slideshow?.publish_mode === 'hide_videos') {
    filtered = filtered.filter((p) => p.media_type !== 'video');
  }
  if (slideshow?.publish_mode === 'favorites_only') {
    filtered = filtered.filter((p) => p.is_favorite);
  }
  if (slideshow?.publish_mode === 'highlights_only') {
    filtered = filtered.filter((p) => p.is_highlight);
  }

  if (slideshow?.clip_order?.length) {
    const orderMap = new Map(slideshow.clip_order.map((id, i) => [id, i]));
    filtered = [...filtered].sort((a, b) => {
      const ao = orderMap.get(a.id) ?? 9999;
      const bo = orderMap.get(b.id) ?? 9999;
      return ao - bo;
    });
  }

  if (slideshow?.shuffle) {
    filtered = [...filtered].sort(() => Math.random() - 0.5);
  }

  const withUrls = await Promise.all(
    filtered.map(async (photo) => {
      const { data: signed } = await supabase.storage
        .from(EVENT_PHOTOS_BUCKET)
        .createSignedUrl(photo.storage_path, 3600);
      return {
        ...photo,
        url: signed?.signedUrl ?? null,
      };
    })
  );

  return withUrls;
}

export async function fetchGuestStats(): Promise<{
  eventsJoined: number;
  photosCaptured: number;
  memoriesCount: number;
  videosCaptured: number;
}> {
  await ensureGuestSession();
  const deviceId = await getDeviceId();

  const { data: guests } = await supabase
    .from('event_guests')
    .select('id, event_id, photos_remaining, videos_remaining')
    .eq('device_id', deviceId);

  if (!guests?.length) {
    return { eventsJoined: 0, photosCaptured: 0, memoriesCount: 0, videosCaptured: 0 };
  }

  let photosCaptured = 0;
  let memoriesCount = 0;
  let videosCaptured = 0;

  for (const guest of guests) {
    const { data: tierRow } = await supabase
      .from('events')
      .select('package_tiers(per_guest_limit), revealed_at, max_videos_per_guest')
      .eq('id', guest.event_id)
      .maybeSingle();

    const tier = tierRow?.package_tiers as { per_guest_limit: number } | null;
    const limit = tier?.per_guest_limit ?? 0;
    photosCaptured += Math.max(0, limit - guest.photos_remaining);

    const maxVideos = (tierRow as { max_videos_per_guest?: number })?.max_videos_per_guest ?? 3;
    videosCaptured += Math.max(0, maxVideos - (guest.videos_remaining ?? 0));

    const { count } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', guest.event_id)
      .eq('status', 'published');

    if ((count ?? 0) > 0 || tierRow?.revealed_at) {
      memoriesCount += 1;
    }
  }

  return {
    eventsJoined: guests.length,
    photosCaptured,
    memoriesCount,
    videosCaptured,
  };
}

export interface EventPermissions {
  allowDownload: boolean;
  allowShare: boolean;
  allowVideo: boolean;
}

export async function fetchEventPermissions(eventId: string): Promise<EventPermissions | null> {
  await ensureGuestSession();

  const { data } = await supabase
    .from('events')
    .select('allow_guest_download, allow_guest_share, allow_guest_video')
    .eq('id', eventId)
    .maybeSingle();

  if (!data) return null;

  return {
    allowDownload: data.allow_guest_download ?? false,
    allowShare: data.allow_guest_share ?? false,
    allowVideo: data.allow_guest_video ?? true,
  };
}
