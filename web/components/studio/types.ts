export type StudioPhoto = {
  id: string;
  storage_path: string;
  status: string;
  created_at: string;
  download_url: string | null;
  media_type: 'photo' | 'video';
  moderation_status: 'pending' | 'approved' | 'rejected' | 'hidden';
  is_favorite: boolean;
  is_pinned: boolean;
  is_highlight: boolean;
  is_cover_candidate: boolean;
  needs_review: boolean;
  review_flags: string[];
  display_order: number | null;
  slide_duration_ms: number | null;
  photo_edits?: Record<string, number>;
};

export type TimelineAudioClip = {
  id: string;
  storage_path: string;
  url?: string | null;
  label: string;
  start_ms: number;
  duration_ms: number;
  trim_start_ms: number;
  trim_end_ms: number | null;
  volume: number;
  fade_in_ms: number;
  fade_out_ms: number;
};

export type SlideshowConfig = {
  event_id: string;
  music_storage_path: string | null;
  music_url: string | null;
  music_volume: number;
  music_fade_in_ms: number;
  music_fade_out_ms: number;
  music_trim_start_ms: number;
  music_trim_end_ms: number | null;
  clip_order: string[];
  audio_tracks: TimelineAudioClip[];
  audio_clip_order: string[];
  transition: string;
  shuffle: boolean;
  loop: boolean;
  publish_mode: string;
  hide_videos: boolean;
  updated_at: string | null;
  clip_transitions?: ClipTransitionsMap;
};

export type StudioTab = 'gallery' | 'edit' | 'cover' | 'deliver';

export type TimelineSelection =
  | { kind: 'visual'; id: string }
  | { kind: 'audio'; id: string }
  | null;

export type QueueFilter = 'review' | 'approved' | 'rejected' | 'hidden' | 'all';

export type PhotoEdits = {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  warmth?: number;
  vignette?: number;
  preset?: string;
  /** Transform & crop (stored in photo_edits JSONB) */
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  aspectFit?: 'native' | '9:16' | '1:1' | '4:5';
};

export type AspectFitPreset = PhotoEdits['aspectFit'];

export const ASPECT_FIT_PRESETS = [
  { id: 'native' as const, label: 'Native' },
  { id: '9:16' as const, label: '9:16 Reel' },
  { id: '1:1' as const, label: '1:1 Square' },
  { id: '4:5' as const, label: '4:5 Portrait' },
];

export type ClipTransition = {
  type: string;
  duration_ms: number;
};

export type ClipTransitionsMap = Record<string, ClipTransition>;

export const TRANSITIONS = [
  { id: 'crossfade', label: 'Cross dissolve' },
  { id: 'fade', label: 'Fade in/out' },
  { id: 'cut', label: 'Cut' },
  { id: 'kenburns', label: 'Ken Burns' },
  { id: 'blur', label: 'Blur transition' },
  { id: 'film-burn', label: 'Film burn' },
  { id: 'vintage-flash', label: 'Vintage flash' },
] as const;

export const PRESETS = [
  { id: 'none', label: 'Original' },
  { id: 'bw', label: 'Black & White' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'party', label: 'Party' },
  { id: 'sunset', label: 'Sunset' },
] as const;

export const PUBLISH_MODES = [
  { id: 'approved_collection', label: 'Full curated album' },
  { id: 'favorites_only', label: 'Favorites only' },
  { id: 'highlights_only', label: 'Highlight reel' },
  { id: 'hide_videos', label: 'Photos only' },
  { id: 'organizer_only', label: 'Client preview (not live for guests)' },
] as const;

export type StudioStatus = 'collecting' | 'in_studio' | 'delivered';

export function editsToFilter(edits: PhotoEdits): string {
  const b = 1 + (edits.brightness ?? 0) / 100;
  const c = 1 + (edits.contrast ?? 0) / 100;
  const s = 1 + (edits.saturation ?? 0) / 100;
  const w = edits.warmth ?? 0;
  const sepia = Math.max(0, w / 200);
  const hue = w < 0 ? w * 0.5 : 0;

  let filter = `brightness(${b}) contrast(${c}) saturate(${s})`;
  if (sepia > 0) filter += ` sepia(${sepia})`;
  if (hue !== 0) filter += ` hue-rotate(${hue}deg)`;

  if (edits.preset === 'bw') filter += ' grayscale(1)';
  if (edits.preset === 'vintage') filter += ' sepia(0.35) contrast(1.1)';
  if (edits.preset === 'wedding') filter += ' brightness(1.05) contrast(0.95) saturate(0.9)';
  if (edits.preset === 'party') filter += ' saturate(1.35) contrast(1.1)';
  if (edits.preset === 'sunset') filter += ' sepia(0.2) saturate(1.2) hue-rotate(-8deg)';

  return filter;
}

export function aspectRatioCss(fit: AspectFitPreset | undefined): string | undefined {
  switch (fit) {
    case '9:16':
      return '9 / 16';
    case '1:1':
      return '1 / 1';
    case '4:5':
      return '4 / 5';
    default:
      return undefined;
  }
}

export function editsToTransform(edits: PhotoEdits): string {
  const scale = (edits.scale ?? 100) / 100;
  const x = edits.offsetX ?? 0;
  const y = edits.offsetY ?? 0;
  return `scale(${scale}) translate(${x}px, ${y}px)`;
}

export function volumeToDb(volume: number): number {
  if (volume <= 0.001) return -60;
  return Math.round(20 * Math.log10(volume));
}

export function dbToVolume(db: number): number {
  if (db <= -60) return 0;
  return Math.min(2, Math.pow(10, db / 20));
}

export function transitionGlyph(type: string): string {
  switch (type) {
    case 'crossfade':
      return '✕';
    case 'fade':
      return '⬇';
    case 'cut':
      return '▶';
    default:
      return '✕';
  }
}

export function transitionShortLabel(type: string): string {
  const t = TRANSITIONS.find((x) => x.id === type);
  return t?.label.split(' ')[0] ?? type;
}

export function statusLabel(status: StudioPhoto['moderation_status']) {
  switch (status) {
    case 'pending':
      return 'Needs review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'hidden':
      return 'Hidden';
  }
}

export function clipDurationMs(photo: StudioPhoto) {
  return photo.slide_duration_ms ?? (photo.media_type === 'video' ? 8000 : 4500);
}

export function audioDurationMs(clip: TimelineAudioClip) {
  const end = clip.trim_end_ms ?? clip.duration_ms;
  return Math.max(1000, end - clip.trim_start_ms);
}

export function normalizeAudioClip(raw: Partial<TimelineAudioClip> & { id: string; storage_path: string }): TimelineAudioClip {
  return {
    id: raw.id,
    storage_path: raw.storage_path,
    url: raw.url ?? null,
    label: raw.label ?? 'Sound',
    start_ms: raw.start_ms ?? 0,
    duration_ms: raw.duration_ms ?? 120000,
    trim_start_ms: raw.trim_start_ms ?? 0,
    trim_end_ms: raw.trim_end_ms ?? null,
    volume: raw.volume ?? 0.8,
    fade_in_ms: raw.fade_in_ms ?? 800,
    fade_out_ms: raw.fade_out_ms ?? 1200,
  };
}

export function normalizePhoto(r: StudioPhoto): StudioPhoto {
  return {
    ...r,
    media_type: r.media_type === 'video' ? 'video' : 'photo',
    moderation_status: r.moderation_status ?? 'pending',
    is_favorite: r.is_favorite ?? false,
    is_pinned: r.is_pinned ?? false,
    is_highlight: r.is_highlight ?? false,
    is_cover_candidate: r.is_cover_candidate ?? false,
    needs_review: r.needs_review ?? false,
    review_flags: r.review_flags ?? [],
    photo_edits: (r.photo_edits as Record<string, number>) ?? {},
  };
}
