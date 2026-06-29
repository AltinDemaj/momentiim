export type CameraFilterPreset = 'none' | 'gala' | 'vintage';

export interface EventGuestFeatures {
  brandingLabel: string | null;
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

export interface AudioMessageItem {
  id: string;
  guest_id: string;
  storage_path: string;
  duration_ms: number;
  photo_id: string | null;
  created_at: string;
  url?: string | null;
}

export interface SocialReelManifest {
  clip_ids: string[];
  music_path: string | null;
  music_url: string | null;
  clip_duration_ms: number;
}
