-- Fix guest album delivery: publish button flow + test mode instant publish

CREATE OR REPLACE FUNCTION public.publish_selected_photos(
  p_event_id UUID,
  p_photo_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_published_count INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'ADMIN_ONLY' USING ERRCODE = 'P0008';
  END IF;

  UPDATE public.photos
  SET status = 'published', published_at = now()
  WHERE event_id = p_event_id
    AND status = 'staging'
    AND moderation_status = 'approved'
    AND (p_photo_ids IS NULL OR id = ANY(p_photo_ids));

  GET DIAGNOSTICS v_published_count = ROW_COUNT;

  IF v_published_count > 0 THEN
    UPDATE public.events
    SET
      revealed_at = COALESCE(revealed_at, now()),
      guest_album_live = true,
      studio_status = CASE
        WHEN studio_status = 'collecting' THEN 'in_studio'::public.studio_status
        ELSE studio_status
      END
    WHERE id = p_event_id;
  END IF;

  RETURN jsonb_build_object(
    'event_id', p_event_id,
    'published_count', v_published_count,
    'revealed_at', (SELECT revealed_at FROM public.events WHERE id = p_event_id),
    'guest_album_live', (SELECT guest_album_live FROM public.events WHERE id = p_event_id)
  );
END;
$$;

-- Test events: skip staging — photos go live in the guest album immediately
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
  v_reservation  public.upload_reservations%ROWTYPE;
  v_event        public.events%ROWTYPE;
  v_photo_id     UUID;
  v_status       TEXT := 'staging';
  v_published_at TIMESTAMPTZ := NULL;
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

  INSERT INTO public.photos (
    event_id,
    uploaded_by_guest_id,
    storage_path,
    status,
    media_type,
    moderation_status,
    published_at
  )
  VALUES (
    v_reservation.event_id,
    v_reservation.guest_id,
    v_reservation.storage_path,
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
    'status', v_status,
    'media_type', v_reservation.media_type
  );
END;
$$;

-- Backfill: publish any approved staging on test events
UPDATE public.photos p
SET status = 'published', published_at = COALESCE(p.published_at, now())
FROM public.events e
WHERE p.event_id = e.id
  AND e.test_mode = true
  AND p.status = 'staging'
  AND p.moderation_status = 'approved';

UPDATE public.events e
SET
  revealed_at = COALESCE(e.revealed_at, now()),
  guest_album_live = true
WHERE e.test_mode = true
  AND EXISTS (
    SELECT 1 FROM public.photos p
    WHERE p.event_id = e.id AND p.status = 'published'
  );
