-- Fix photo_status enum type in commit_photo_upload (was TEXT, broke uploads)

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
  v_status       public.photo_status := 'staging';
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
