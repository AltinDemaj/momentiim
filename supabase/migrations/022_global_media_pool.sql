-- Global media pool (Marketi Juaj-style): one physical file per unique content hash app-wide.
-- Full quality preserved — duplicates only create a reference, not a second upload.

CREATE TABLE IF NOT EXISTS public.global_media_blobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash  TEXT NOT NULL UNIQUE,
  storage_path  TEXT NOT NULL UNIQUE,
  mime_type     TEXT NOT NULL,
  byte_size     BIGINT NOT NULL,
  media_type    TEXT NOT NULL DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
  ref_count     INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS global_media_blobs_hash_idx ON public.global_media_blobs (content_hash);

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS media_blob_id UUID REFERENCES public.global_media_blobs (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS photos_media_blob_idx ON public.photos (media_blob_id)
  WHERE media_blob_id IS NOT NULL;

-- Restore generous file size (full-quality photos & reels).
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'event-photos';

CREATE OR REPLACE FUNCTION public.global_media_storage_path(
  p_content_hash TEXT,
  p_file_ext     TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'global/' || substr(p_content_hash, 1, 2) || '/' || substr(p_content_hash, 3, 2) || '/'
         || p_content_hash || '.' || lower(regexp_replace(p_file_ext, '[^a-z0-9]', '', 'g'));
$$;

-- Look up or register a blob slot. Returns whether the client must upload bytes.
CREATE OR REPLACE FUNCTION public.acquire_global_media_blob(
  p_content_hash TEXT,
  p_byte_size    BIGINT,
  p_mime_type    TEXT,
  p_file_ext     TEXT,
  p_media_type   TEXT DEFAULT 'photo'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_safe_ext TEXT;
  v_path     TEXT;
  v_blob     public.global_media_blobs%ROWTYPE;
  v_upload   BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'P0018';
  END IF;

  v_safe_ext := lower(regexp_replace(p_file_ext, '[^a-z0-9]', '', 'g'));
  IF v_safe_ext = '' THEN v_safe_ext := 'jpg'; END IF;

  v_path := public.global_media_storage_path(p_content_hash, v_safe_ext);

  INSERT INTO public.global_media_blobs (
    content_hash, storage_path, mime_type, byte_size, media_type, ref_count
  )
  VALUES (p_content_hash, v_path, p_mime_type, p_byte_size, p_media_type, 0)
  ON CONFLICT (content_hash) DO NOTHING;

  SELECT * INTO v_blob FROM public.global_media_blobs WHERE content_hash = p_content_hash FOR UPDATE;
  v_upload := v_blob.ref_count = 0;

  RETURN jsonb_build_object(
    'blob_id', v_blob.id,
    'storage_path', v_blob.storage_path,
    'upload_required', v_upload,
    'reused', NOT v_upload
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.acquire_global_media_blob(TEXT, BIGINT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.commit_photo_upload(
  p_reservation_id UUID,
  p_guest_id       UUID,
  p_media_blob_id  UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation  public.upload_reservations%ROWTYPE;
  v_event        public.events%ROWTYPE;
  v_blob         public.global_media_blobs%ROWTYPE;
  v_photo_id     UUID;
  v_status       public.photo_status := 'staging';
  v_published_at TIMESTAMPTZ := NULL;
  v_storage_path TEXT;
  v_ref_count    INT;
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
    SET revealed_at = COALESCE(revealed_at, now()), guest_album_live = true
    WHERE id = v_event.id;
  END IF;

  IF p_media_blob_id IS NOT NULL THEN
    SELECT * INTO v_blob FROM public.global_media_blobs WHERE id = p_media_blob_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'BLOB_NOT_FOUND' USING ERRCODE = 'P0020'; END IF;
    v_storage_path := v_blob.storage_path;
    UPDATE public.global_media_blobs SET ref_count = ref_count + 1 WHERE id = p_media_blob_id
    RETURNING ref_count INTO v_ref_count;
  ELSE
    v_storage_path := v_reservation.storage_path;
  END IF;

  INSERT INTO public.photos (
    event_id,
    uploaded_by_guest_id,
    storage_path,
    media_blob_id,
    thumb_storage_path,
    status,
    media_type,
    moderation_status,
    published_at
  )
  VALUES (
    v_reservation.event_id,
    v_reservation.guest_id,
    v_storage_path,
    p_media_blob_id,
    NULL,
    v_status,
    v_reservation.media_type,
    'approved',
    v_published_at
  )
  RETURNING id INTO v_photo_id;

  DELETE FROM public.upload_reservations WHERE id = p_reservation_id;

  RETURN jsonb_build_object(
    'photo_id', v_photo_id,
    'storage_path', v_storage_path,
    'media_blob_id', p_media_blob_id,
    'reused_blob', COALESCE(v_ref_count > 1, false),
    'status', v_status,
    'media_type', v_reservation.media_type
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.release_global_media_blob(p_blob_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_blob public.global_media_blobs%ROWTYPE;
  v_rc   INT;
BEGIN
  SELECT * INTO v_blob FROM public.global_media_blobs WHERE id = p_blob_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('released', false); END IF;

  UPDATE public.global_media_blobs SET ref_count = GREATEST(0, ref_count - 1) WHERE id = p_blob_id
  RETURNING ref_count INTO v_rc;

  IF v_rc = 0 THEN
    DELETE FROM storage.objects WHERE bucket_id = 'event-photos' AND name = v_blob.storage_path;
    DELETE FROM public.global_media_blobs WHERE id = p_blob_id;
    RETURN jsonb_build_object('released', true, 'deleted_blob', true);
  END IF;

  RETURN jsonb_build_object('released', true, 'deleted_blob', false, 'ref_count', v_rc);
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_global_media_blob(UUID) TO authenticated;

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
  v_tier  public.package_tiers%ROWTYPE;
BEGIN
  SELECT * INTO v_guest FROM public.event_guests
  WHERE id = p_guest_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'GUEST_NOT_AUTHORIZED' USING ERRCODE = 'P0016'; END IF;

  SELECT * INTO v_photo FROM public.photos
  WHERE id = p_photo_id AND uploaded_by_guest_id = p_guest_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PHOTO_NOT_FOUND' USING ERRCODE = 'P0017'; END IF;

  DELETE FROM public.guest_challenge_completions WHERE photo_id = p_photo_id;
  DELETE FROM public.photo_face_signatures WHERE photo_id = p_photo_id;

  IF v_photo.media_blob_id IS NOT NULL THEN
    PERFORM public.release_global_media_blob(v_photo.media_blob_id);
  ELSE
    DELETE FROM storage.objects WHERE bucket_id = 'event-photos' AND name = v_photo.storage_path;
    IF v_photo.thumb_storage_path IS NOT NULL THEN
      DELETE FROM storage.objects WHERE bucket_id = 'event-photos' AND name = v_photo.thumb_storage_path;
    END IF;
  END IF;

  DELETE FROM public.photos WHERE id = p_photo_id;

  SELECT pt.* INTO v_tier FROM public.events e
  JOIN public.package_tiers pt ON pt.id = e.package_tier_id WHERE e.id = v_guest.event_id;

  IF v_photo.media_type = 'video' THEN
    UPDATE public.event_guests SET videos_remaining = videos_remaining + 1 WHERE id = p_guest_id;
  ELSE
    UPDATE public.event_guests
    SET photos_remaining = LEAST(photos_remaining + 1, v_tier.per_guest_limit) WHERE id = p_guest_id;
  END IF;

  RETURN jsonb_build_object('deleted', true, 'photo_id', p_photo_id);
END;
$$;

-- Guests may upload into the shared global pool (content-addressed paths only).
DROP POLICY IF EXISTS "Authenticated guests upload global media" ON storage.objects;
CREATE POLICY "Authenticated guests upload global media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-photos'
    AND (storage.foldername(name))[1] = 'global'
  );

DROP POLICY IF EXISTS "Authenticated read global media pool" ON storage.objects;
CREATE POLICY "Authenticated read global media pool"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'event-photos'
    AND (storage.foldername(name))[1] = 'global'
  );

-- Orphan blobs: registered but never committed (ref_count still 0 after 1 day).
CREATE OR REPLACE FUNCTION public.purge_orphan_media_blobs(p_older_than_hours INT DEFAULT 24)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_blob public.global_media_blobs%ROWTYPE;
  v_deleted INT := 0;
  v_cutoff TIMESTAMPTZ := now() - (p_older_than_hours || ' hours')::interval;
BEGIN
  FOR v_blob IN
    SELECT * FROM public.global_media_blobs
    WHERE ref_count = 0 AND created_at < v_cutoff
  LOOP
    DELETE FROM storage.objects WHERE bucket_id = 'event-photos' AND name = v_blob.storage_path;
    DELETE FROM public.global_media_blobs WHERE id = v_blob.id;
    v_deleted := v_deleted + 1;
  END LOOP;
  RETURN jsonb_build_object('deleted_blobs', v_deleted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_orphan_media_blobs(INT) TO service_role;
