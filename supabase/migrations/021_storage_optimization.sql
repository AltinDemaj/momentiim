-- Storage optimization: thumbnails, tighter bucket limits, delete thumbs on guest delete.

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS thumb_storage_path TEXT;

CREATE INDEX IF NOT EXISTS photos_thumb_path_idx ON public.photos (thumb_storage_path)
  WHERE thumb_storage_path IS NOT NULL;

-- 8 MB per object — forces client-side compression before upload.
UPDATE storage.buckets
SET
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'audio/m4a',
    'audio/mp4',
    'audio/mpeg'
  ]
WHERE id = 'event-photos';

-- Store thumb path derived from main path (…/uuid.jpg → …/uuid_thumb.jpg).
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
  v_reservation      public.upload_reservations%ROWTYPE;
  v_event            public.events%ROWTYPE;
  v_photo_id         UUID;
  v_status           public.photo_status := 'staging';
  v_published_at     TIMESTAMPTZ := NULL;
  v_thumb_path       TEXT;
BEGIN
  SELECT * INTO v_reservation FROM public.upload_reservations
  WHERE id = p_reservation_id AND guest_id = p_guest_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0005'; END IF;
  IF v_reservation.expires_at < now() THEN
    DELETE FROM public.upload_reservations WHERE id = p_reservation_id;
    RAISE EXCEPTION 'RESERVATION_EXPIRED' USING ERRCODE = 'P0006';
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = v_reservation.event_id;

  IF v_event.test_mode THEN
    v_status := 'published';
    v_published_at := now();
    UPDATE public.events
    SET
      revealed_at = COALESCE(revealed_at, now()),
      guest_album_live = true
    WHERE id = v_event.id;
  END IF;

  IF v_reservation.media_type = 'photo' THEN
    v_thumb_path := regexp_replace(v_reservation.storage_path, '\.([^.]+)$', '_thumb.\1');
  END IF;

  INSERT INTO public.photos (
    event_id,
    uploaded_by_guest_id,
    storage_path,
    thumb_storage_path,
    status,
    media_type,
    moderation_status,
    published_at
  )
  VALUES (
    v_reservation.event_id,
    v_reservation.guest_id,
    v_reservation.storage_path,
    v_thumb_path,
    v_status,
    v_reservation.media_type,
    'approved',
    v_published_at
  )
  RETURNING id INTO v_photo_id;

  DELETE FROM public.upload_reservations WHERE id = p_reservation_id;

  RETURN jsonb_build_object(
    'photo_id', v_photo_id,
    'storage_path', v_reservation.storage_path,
    'thumb_storage_path', v_thumb_path,
    'status', v_status,
    'media_type', v_reservation.media_type
  );
END;
$$;

-- Delete thumb object when guest deletes a photo.
CREATE OR REPLACE FUNCTION public.guest_delete_own_photo(
  p_photo_id UUID,
  p_guest_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_guest public.event_guests%ROWTYPE;
  v_photo public.photos%ROWTYPE;
  v_tier public.package_tiers%ROWTYPE;
BEGIN
  SELECT * INTO v_guest
  FROM public.event_guests
  WHERE id = p_guest_id AND user_id = auth.uid()
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'GUEST_NOT_AUTHORIZED' USING ERRCODE = 'P0016';
  END IF;

  SELECT * INTO v_photo
  FROM public.photos
  WHERE id = p_photo_id AND uploaded_by_guest_id = p_guest_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PHOTO_NOT_FOUND' USING ERRCODE = 'P0017';
  END IF;

  DELETE FROM public.guest_challenge_completions WHERE photo_id = p_photo_id;
  DELETE FROM public.photo_face_signatures WHERE photo_id = p_photo_id;

  DELETE FROM storage.objects
  WHERE bucket_id = 'event-photos' AND name = v_photo.storage_path;

  IF v_photo.thumb_storage_path IS NOT NULL THEN
    DELETE FROM storage.objects
    WHERE bucket_id = 'event-photos' AND name = v_photo.thumb_storage_path;
  END IF;

  DELETE FROM public.photos WHERE id = p_photo_id;

  SELECT pt.* INTO v_tier
  FROM public.events e
  JOIN public.package_tiers pt ON pt.id = e.package_tier_id
  WHERE e.id = v_guest.event_id;

  IF v_photo.media_type = 'video' THEN
    UPDATE public.event_guests
    SET videos_remaining = videos_remaining + 1
    WHERE id = p_guest_id;
  ELSE
    UPDATE public.event_guests
    SET photos_remaining = LEAST(photos_remaining + 1, v_tier.per_guest_limit)
    WHERE id = p_guest_id;
  END IF;

  RETURN jsonb_build_object('deleted', true, 'photo_id', p_photo_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.guest_delete_own_photo(UUID, UUID) TO authenticated;
CREATE OR REPLACE FUNCTION public.purge_stale_staging_photos(p_older_than_days INT DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_photo public.photos%ROWTYPE;
  v_deleted INT := 0;
  v_cutoff TIMESTAMPTZ := now() - (p_older_than_days || ' days')::interval;
BEGIN
  FOR v_photo IN
    SELECT * FROM public.photos
    WHERE status = 'staging'
      AND created_at < v_cutoff
  LOOP
    DELETE FROM storage.objects
    WHERE bucket_id = 'event-photos' AND name = v_photo.storage_path;
    IF v_photo.thumb_storage_path IS NOT NULL THEN
      DELETE FROM storage.objects
      WHERE bucket_id = 'event-photos' AND name = v_photo.thumb_storage_path;
    END IF;
    DELETE FROM public.photos WHERE id = v_photo.id;
    v_deleted := v_deleted + 1;
  END LOOP;

  RETURN jsonb_build_object('deleted_photos', v_deleted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_stale_staging_photos(INT) TO service_role;
