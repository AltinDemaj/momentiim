export type UserRole = 'admin' | 'host' | 'guest';
export type EventStatus = 'active' | 'completed';
export type PhotoStatus = 'staging' | 'published';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface PackageTier {
  id: string;
  name: string;
  max_total_photos: number;
  per_guest_limit: number;
  price: number | null;
  created_at: string;
}

export interface Event {
  id: string;
  host_id: string;
  title: string;
  date: string;
  qr_code_url: string | null;
  package_tier_id: string;
  status: EventStatus;
  deep_link: string;
  client_name: string | null;
  reveal_scheduled_at: string | null;
  revealed_at: string | null;
  join_code: string;
  test_mode?: boolean;
  studio_status?: string | null;
  client_album_delivered_at?: string | null;
  client_album_note?: string | null;
  guest_album_live?: boolean | null;
  created_at: string;
}

export interface EventGuest {
  id: string;
  event_id: string;
  device_id: string;
  user_id: string | null;
  photos_remaining: number;
  created_at: string;
}

export interface Photo {
  id: string;
  event_id: string;
  uploaded_by_guest_id: string;
  storage_path: string;
  status: PhotoStatus;
  published_at: string | null;
  created_at: string;
}

export interface DecrementGuestLimitResult {
  reservation_id: string;
  storage_path: string;
  photos_remaining: number;
}

export interface CommitPhotoUploadResult {
  photo_id: string;
  storage_path: string;
  status: PhotoStatus;
}

export interface RegisterEventGuestResult {
  guest_id: string;
  photos_remaining: number;
  per_guest_limit: number;
  event_title: string;
}

export interface CreateEventRequest {
  title: string;
  date: string;
  package_tier_id: string;
  client_name?: string;
  reveal_scheduled_at?: string;
}

export interface CreateEventResponse {
  event: Event;
  qr: {
    deep_link: string;
    qr_data_url: string;
    print_url: string | null;
  };
  package_tier: PackageTier;
}

export interface UploadLimits {
  guestRemaining: number;
  eventTotal: number;
  eventMax: number;
  canUpload: boolean;
}

export type UploadErrorCode =
  | 'GUEST_LIMIT_EXCEEDED'
  | 'EVENT_POOL_EXHAUSTED'
  | 'EVENT_NOT_ACTIVE'
  | 'GUEST_NOT_FOUND'
  | 'RESERVATION_EXPIRED'
  | 'PICKER_CANCELLED'
  | 'UPLOAD_FAILED'
  | 'UNKNOWN';

export interface UploadResult {
  success: boolean;
  photoId?: string;
  storagePath?: string;
  photosRemaining?: number;
  error?: UploadErrorCode;
  message?: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      package_tiers: {
        Row: PackageTier;
        Insert: Omit<PackageTier, 'id' | 'created_at'>;
        Update: Partial<Omit<PackageTier, 'id' | 'created_at'>>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'deep_link' | 'created_at' | 'status' | 'qr_code_url' | 'revealed_at'> & {
          qr_code_url?: string | null;
          status?: EventStatus;
          revealed_at?: string | null;
        };
        Update: Partial<Omit<Event, 'id' | 'deep_link' | 'created_at'>>;
      };
      event_guests: {
        Row: EventGuest;
        Insert: Omit<EventGuest, 'id' | 'created_at'>;
        Update: Partial<Omit<EventGuest, 'id' | 'created_at'>>;
      };
      photos: {
        Row: Photo;
        Insert: Omit<Photo, 'id' | 'created_at' | 'published_at'> & {
          published_at?: string | null;
        };
        Update: Partial<Omit<Photo, 'id' | 'created_at'>>;
      };
    };
    Functions: Record<
      string,
      {
        Args: Record<string, unknown>;
        Returns: unknown;
      }
    >;
  };
}
