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

export interface CreateEventResponse {
  event: Event;
  qr: {
    deep_link: string;
    qr_data_url: string;
    print_url: string | null;
  };
  package_tier: PackageTier;
}
