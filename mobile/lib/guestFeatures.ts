import { computeImageSignature } from './imageSignature';
import {
  getCongratsBanner,
  inferCelebrationType,
  type CelebrationType,
} from './cameraFilters';
import { supabase, EVENT_PHOTOS_BUCKET } from './supabase';
import { getDeviceId } from './device';
import { ensureGuestSession } from './auth';
import { File } from 'expo-file-system';
import { readMediaFile } from './mediaHash';

import { API_URL } from './config';

export type CameraFilterPreset = 'none' | 'gala' | 'vintage';

export type { CelebrationType } from './cameraFilters';

export interface EventGuestFeatures {
  brandingLabel: string | null;
  clientName: string | null;
  celebrationType: CelebrationType;
  congratsBanner: string | null;
  cameraFilter: CameraFilterPreset;
  showReferralBanner: boolean;
  featureScavengerHunt: boolean;
  featureAudioGuestbook: boolean;
  featureFaceSearch: boolean;
  featureCameraFilters: boolean;
  featureSocialReel: boolean;
  socialReelReady: boolean;
  audioMessagesRemaining: number;
}

export interface EventChallenge {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  completed: boolean;
  photo_id: string | null;
}

export interface SocialReelManifest {
  clip_ids: string[];
  music_path: string | null;
  music_url: string | null;
  clip_duration_ms: number;
}

export async function fetchGuestFeatures(eventId: string): Promise<EventGuestFeatures | null> {
  await ensureGuestSession();
  const deviceId = await getDeviceId();

  const { data: event } = await supabase
    .from('events')
    .select(
      'branding_label, camera_filter, show_referral_banner, feature_scavenger_hunt, feature_audio_guestbook, feature_face_search, feature_camera_filters, feature_social_reel, social_reel_ready, client_name, title, date, celebration_type'
    )
    .eq('id', eventId)
    .maybeSingle();

  if (!event) return null;

  const { data: guest } = await supabase
    .from('event_guests')
    .select('audio_messages_remaining')
    .eq('event_id', eventId)
    .eq('device_id', deviceId)
    .maybeSingle();

  const celebrationType: CelebrationType =
    (event.celebration_type as CelebrationType | null) ??
    inferCelebrationType(event.title, event.client_name);

  const branding =
    event.branding_label ??
    (event.client_name
      ? `${event.client_name} — ${new Date(event.date).toLocaleDateString('en-GB')}`
      : event.title);

  const congratsBanner = getCongratsBanner(celebrationType, event.client_name);

  return {
    brandingLabel: branding,
    clientName: event.client_name,
    celebrationType,
    congratsBanner,
    cameraFilter: (event.camera_filter as CameraFilterPreset) ?? 'gala',
    showReferralBanner: event.show_referral_banner ?? true,
    featureScavengerHunt: event.feature_scavenger_hunt ?? true,
    featureAudioGuestbook: event.feature_audio_guestbook ?? true,
    featureFaceSearch: event.feature_face_search ?? true,
    featureCameraFilters: event.feature_camera_filters ?? true,
    featureSocialReel: event.feature_social_reel ?? true,
    socialReelReady: event.social_reel_ready ?? false,
    audioMessagesRemaining: guest?.audio_messages_remaining ?? 0,
  };
}

export async function fetchChallenges(eventId: string, guestId: string): Promise<EventChallenge[]> {
  await ensureGuestSession();

  const [{ data: challenges }, { data: completions }] = await Promise.all([
    supabase
      .from('event_challenges')
      .select('id, title, description, sort_order, is_active')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('guest_challenge_completions')
      .select('challenge_id, photo_id')
      .eq('guest_id', guestId),
  ]);

  const done = new Map((completions ?? []).map((c) => [c.challenge_id, c.photo_id]));

  return (challenges ?? []).map((c) => ({
    ...c,
    completed: done.has(c.id),
    photo_id: done.get(c.id) ?? null,
  }));
}

export async function completeChallenge(
  challengeId: string,
  guestId: string,
  photoId: string
): Promise<boolean> {
  const { error } = await supabase.rpc('complete_event_challenge', {
    p_challenge_id: challengeId,
    p_guest_id: guestId,
    p_photo_id: photoId,
  });
  return !error;
}

export async function uploadAudioMessage(
  eventId: string,
  guestId: string,
  uri: string,
  durationMs: number,
  photoId?: string
): Promise<{ success: boolean; message?: string; audioRemaining?: number }> {
  let messageId: string | undefined;

  try {
    const { data: slotRaw, error: slotError } = await supabase.rpc('reserve_audio_message_slot', {
      p_guest_id: guestId,
      p_event_id: eventId,
      p_file_ext: 'm4a',
    });

    if (slotError) {
      return { success: false, message: slotError.message };
    }

    const slot = slotRaw as { message_id: string; storage_path: string; audio_remaining: number };
    messageId = slot.message_id;

    const file = new File(uri);
    if (!file.exists) {
      await supabase.rpc('rollback_audio_message', { p_message_id: messageId, p_guest_id: guestId });
      return { success: false, message: 'Recording file not found' };
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(EVENT_PHOTOS_BUCKET)
      .upload(slot.storage_path, bytes, { contentType: 'audio/m4a', upsert: false });

    if (uploadError) {
      await supabase.rpc('rollback_audio_message', { p_message_id: messageId, p_guest_id: guestId });
      return { success: false, message: uploadError.message };
    }

    const { error: commitError } = await supabase.rpc('commit_audio_message', {
      p_message_id: messageId,
      p_guest_id: guestId,
      p_duration_ms: durationMs,
      p_photo_id: photoId ?? null,
    });

    if (commitError) {
      await supabase.storage.from(EVENT_PHOTOS_BUCKET).remove([slot.storage_path]);
      await supabase.rpc('rollback_audio_message', { p_message_id: messageId, p_guest_id: guestId });
      return { success: false, message: commitError.message };
    }

    return { success: true, audioRemaining: slot.audio_remaining };
  } catch (err) {
    if (messageId) {
      await supabase.rpc('rollback_audio_message', { p_message_id: messageId, p_guest_id: guestId });
    }
    return { success: false, message: err instanceof Error ? err.message : 'Upload failed' };
  }
}

export async function fetchAudioMessages(eventId: string) {
  await ensureGuestSession();

  const { data: rows } = await supabase
    .from('audio_messages')
    .select('id, guest_id, storage_path, duration_ms, photo_id, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  return Promise.all(
    (rows ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from(EVENT_PHOTOS_BUCKET)
        .createSignedUrl(row.storage_path, 3600);
      return { ...row, url: signed?.signedUrl ?? null };
    })
  );
}

/** Only the current guest's voice messages — for the keepsake album. */
export async function fetchMyAudioMessages(eventId: string, guestId: string) {
  await ensureGuestSession();

  const { data: rows } = await supabase
    .from('audio_messages')
    .select('id, guest_id, storage_path, duration_ms, created_at')
    .eq('event_id', eventId)
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false });

  return Promise.all(
    (rows ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from(EVENT_PHOTOS_BUCKET)
        .createSignedUrl(row.storage_path, 3600);
      return { ...row, url: signed?.signedUrl ?? null };
    })
  );
}

export async function uploadSelfieAndSearch(
  eventId: string,
  guestId: string,
  uri: string
): Promise<{ photos: { id: string; url: string | null; is_own: boolean }[] }> {
  const media = await readMediaFile(uri);
  const sig = computeImageSignature(media.bytes);
  const storagePath = `selfies/${eventId}/${guestId}.jpg`;

  await supabase.storage.from(EVENT_PHOTOS_BUCKET).upload(storagePath, media.bytes, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  await supabase.rpc('upsert_guest_selfie', {
    p_guest_id: guestId,
    p_event_id: eventId,
    p_storage_path: storagePath,
    p_face_signature: sig,
  });

  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return { photos: [] };

  const res = await fetch(`${API_URL}/api/events/${eventId}/face-search`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ event_id: eventId, guest_id: guestId }),
  });

  if (!res.ok) return { photos: [] };
  const data = await res.json();
  return { photos: data.photos ?? [] };
}

export async function fetchSocialReel(eventId: string): Promise<SocialReelManifest | null> {
  await ensureGuestSession();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return null;

  const res = await fetch(`${API_URL}/api/events/${eventId}/social-reel`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.ready) return null;
  return {
    clip_ids: data.reel.clip_ids,
    music_path: data.reel.music_path ?? null,
    music_url: data.reel.music_url ?? null,
    clip_duration_ms: data.reel.clip_duration_ms ?? 1000,
  };
}

export async function fetchSocialReelClips(eventId: string) {
  await ensureGuestSession();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return [];

  const res = await fetch(`${API_URL}/api/events/${eventId}/social-reel`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.ready) return [];
  return (data.reel.clips ?? []) as { id: string; url: string | null }[];
}

export async function deleteGuestPhoto(
  photoId: string,
  guestId: string
): Promise<{ success: boolean; message?: string }> {
  await ensureGuestSession();
  const { error } = await supabase.rpc('guest_delete_own_photo', {
    p_photo_id: photoId,
    p_guest_id: guestId,
  });
  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function deleteGuestAudioMessage(
  messageId: string,
  guestId: string
): Promise<{ success: boolean; message?: string }> {
  await ensureGuestSession();
  const { error } = await supabase.rpc('guest_delete_own_audio_message', {
    p_message_id: messageId,
    p_guest_id: guestId,
  });
  if (error) return { success: false, message: error.message };
  return { success: true };
}
