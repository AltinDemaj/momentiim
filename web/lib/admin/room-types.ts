import type { EventStatus } from '@/types/database';

/** Package tier slice joined from Supabase on the rooms list query. */
export interface AdminRoomTier {
  name: string;
  per_guest_limit: number;
  max_total_photos: number;
}

/** Serializable room card payload (server → client). */
export interface AdminRoomCardData {
  id: string;
  title: string;
  date: string;
  status: EventStatus | string;
  client_name: string | null;
  reveal_scheduled_at: string | null;
  revealed_at: string | null;
  created_at: string;
  join_code: string;
  tier: AdminRoomTier | null;
  joinUrl: string;
  qrDataUrl: string;
  photoCount: number;
}
