-- Guest media permissions, video support, venue
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS venue_name TEXT,
  ADD COLUMN IF NOT EXISTS allow_guest_download BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_guest_share BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_guest_video BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_videos_per_guest INT NOT NULL DEFAULT 3;

ALTER TABLE public.event_guests
  ADD COLUMN IF NOT EXISTS videos_remaining INT NOT NULL DEFAULT 3;

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'photo'
    CHECK (media_type IN ('photo', 'video'));

ALTER TABLE public.upload_reservations
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'photo'
    CHECK (media_type IN ('photo', 'video'));

-- Allow video uploads in storage bucket
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/png', 'image/heic', 'image/heif',
  'video/mp4', 'video/quicktime'
]
WHERE id = 'event-photos';

-- Video limit decrement
CREATE OR REPLACE FUNCTION public.decrement_guest_video_limit(
  p_guest_id UUID,
  p_event_id UUID,
  p_file_ext  TEXT DEFAULT 'mp4'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest           public.event_guests%ROWTYPE;
  v_event           public.events%ROWTYPE;
  v_tier            public.package_tiers%ROWTYPE;
  v_current_count   INT;
  v_reservation_id  UUID;
  v_storage_path    TEXT;
  v_safe_ext        TEXT;
BEGIN
  v_safe_ext := lower(regexp_replace(p_file_ext, '[^a-z0-9]', '', 'g'));
  IF v_safe_ext = '' THEN v_safe_ext := 'mp4'; END IF;

  SELECT * INTO v_guest FROM public.event_guests
  WHERE id = p_guest_id AND event_id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'GUEST_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND OR NOT v_event.allow_guest_video THEN
    RAISE EXCEPTION 'VIDEO_NOT_ALLOWED' USING ERRCODE = 'P0009';
  END IF;

  IF v_guest.videos_remaining <= 0 THEN
    RAISE EXCEPTION 'VIDEO_LIMIT_EXCEEDED' USING ERRCODE = 'P0010';
  END IF;

  SELECT e.* INTO v_event FROM public.events e
  WHERE e.id = p_event_id AND e.status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'EVENT_NOT_ACTIVE' USING ERRCODE = 'P0003'; END IF;

  SELECT * INTO v_tier FROM public.package_tiers WHERE id = v_event.package_tier_id;
  v_current_count := public.event_photo_count(p_event_id);
  IF v_current_count >= v_tier.max_total_photos THEN
    RAISE EXCEPTION 'EVENT_POOL_EXHAUSTED' USING ERRCODE = 'P0004';
  END IF;

  UPDATE public.event_guests SET videos_remaining = videos_remaining - 1 WHERE id = p_guest_id;

  v_storage_path := public.staging_storage_path(p_event_id, p_guest_id, v_safe_ext);

  INSERT INTO public.upload_reservations (guest_id, event_id, storage_path, media_type)
  VALUES (p_guest_id, p_event_id, v_storage_path, 'video')
  RETURNING id INTO v_reservation_id;

  RETURN jsonb_build_object(
    'reservation_id', v_reservation_id,
    'storage_path', v_storage_path,
    'videos_remaining', v_guest.videos_remaining - 1
  );
END;
$$;

-- commit with media_type
CREATE OR REPLACE FUNCTION public.commit_photo_upload(
  p_reservation_id UUID,
  p_guest_id       UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation public.upload_reservations%ROWTYPE;
  v_photo_id    UUID;
BEGIN
  SELECT * INTO v_reservation FROM public.upload_reservations
  WHERE id = p_reservation_id AND guest_id = p_guest_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0005'; END IF;
  IF v_reservation.expires_at < now() THEN
    DELETE FROM public.upload_reservations WHERE id = p_reservation_id;
    RAISE EXCEPTION 'RESERVATION_EXPIRED' USING ERRCODE = 'P0006';
  END IF;

  INSERT INTO public.photos (event_id, uploaded_by_guest_id, storage_path, status, media_type)
  VALUES (v_reservation.event_id, v_reservation.guest_id, v_reservation.storage_path, 'staging', v_reservation.media_type)
  RETURNING id INTO v_photo_id;

  DELETE FROM public.upload_reservations WHERE id = p_reservation_id;

  RETURN jsonb_build_object(
    'photo_id', v_photo_id,
    'storage_path', v_reservation.storage_path,
    'status', 'staging',
    'media_type', v_reservation.media_type
  );
END;
$$;

-- Set videos_remaining on guest register
CREATE OR REPLACE FUNCTION public.register_event_guest(
  p_event_id  UUID,
  p_device_id TEXT,
  p_user_id   UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event  public.events%ROWTYPE;
  v_tier   public.package_tiers%ROWTYPE;
  v_guest  public.event_guests%ROWTYPE;
BEGIN
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'EVENT_NOT_FOUND' USING ERRCODE = 'P0007'; END IF;

  SELECT * INTO v_tier FROM public.package_tiers WHERE id = v_event.package_tier_id;

  INSERT INTO public.event_guests (event_id, device_id, user_id, photos_remaining, videos_remaining)
  VALUES (p_event_id, p_device_id, p_user_id, v_tier.per_guest_limit, v_event.max_videos_per_guest)
  ON CONFLICT (event_id, device_id) DO UPDATE
    SET user_id = COALESCE(EXCLUDED.user_id, event_guests.user_id)
  RETURNING * INTO v_guest;

  RETURN jsonb_build_object(
    'guest_id', v_guest.id,
    'photos_remaining', v_guest.photos_remaining,
    'videos_remaining', v_guest.videos_remaining,
    'per_guest_limit', v_tier.per_guest_limit,
    'max_videos', v_event.max_videos_per_guest,
    'event_title', v_event.title
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_guest_video_limit(UUID, UUID, TEXT) TO authenticated;
