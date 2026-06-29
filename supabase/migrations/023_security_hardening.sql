-- Security hardening: admin-only destructive RPCs, guest ownership on quota RPCs

-- ---------------------------------------------------------------------------
-- decrement_guest_limit / decrement_guest_video_limit: caller must own guest
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_guest_limit(
  p_guest_id UUID,
  p_event_id UUID,
  p_file_ext  TEXT DEFAULT 'jpg'
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
  v_remaining       INT;
BEGIN
  v_safe_ext := lower(regexp_replace(p_file_ext, '[^a-z0-9]', '', 'g'));
  IF v_safe_ext = '' THEN v_safe_ext := 'jpg'; END IF;

  SELECT * INTO v_guest FROM public.event_guests
  WHERE id = p_guest_id AND event_id = p_event_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'GUEST_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;

  SELECT e.* INTO v_event FROM public.events e
  WHERE e.id = p_event_id AND e.status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'EVENT_NOT_ACTIVE' USING ERRCODE = 'P0003'; END IF;

  IF NOT v_event.test_mode THEN
    IF v_guest.photos_remaining <= 0 THEN
      RAISE EXCEPTION 'GUEST_LIMIT_EXCEEDED' USING ERRCODE = 'P0002';
    END IF;
    SELECT * INTO v_tier FROM public.package_tiers WHERE id = v_event.package_tier_id;
    v_current_count := public.event_photo_count(p_event_id);
    IF v_current_count >= v_tier.max_total_photos THEN
      RAISE EXCEPTION 'EVENT_POOL_EXHAUSTED' USING ERRCODE = 'P0004';
    END IF;
    UPDATE public.event_guests SET photos_remaining = photos_remaining - 1 WHERE id = p_guest_id;
    v_remaining := v_guest.photos_remaining - 1;
  ELSE
    v_remaining := 9999;
  END IF;

  v_storage_path := public.staging_storage_path(p_event_id, p_guest_id, v_safe_ext);

  INSERT INTO public.upload_reservations (guest_id, event_id, storage_path)
  VALUES (p_guest_id, p_event_id, v_storage_path)
  RETURNING id INTO v_reservation_id;

  RETURN jsonb_build_object(
    'reservation_id', v_reservation_id,
    'storage_path', v_storage_path,
    'photos_remaining', v_remaining
  );
END;
$$;

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
  v_remaining       INT;
BEGIN
  v_safe_ext := lower(regexp_replace(p_file_ext, '[^a-z0-9]', '', 'g'));
  IF v_safe_ext = '' THEN v_safe_ext := 'mp4'; END IF;

  SELECT * INTO v_guest FROM public.event_guests
  WHERE id = p_guest_id AND event_id = p_event_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'GUEST_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND OR NOT v_event.allow_guest_video THEN
    RAISE EXCEPTION 'VIDEO_NOT_ALLOWED' USING ERRCODE = 'P0009';
  END IF;

  IF NOT v_event.test_mode THEN
    IF v_guest.videos_remaining <= 0 THEN
      RAISE EXCEPTION 'VIDEO_LIMIT_EXCEEDED' USING ERRCODE = 'P0010';
    END IF;
    SELECT e.* INTO v_event FROM public.events e
    WHERE e.id = p_event_id AND e.status = 'active' FOR UPDATE;
    SELECT * INTO v_tier FROM public.package_tiers WHERE id = v_event.package_tier_id;
    v_current_count := public.event_photo_count(p_event_id);
    IF v_current_count >= v_tier.max_total_photos THEN
      RAISE EXCEPTION 'EVENT_POOL_EXHAUSTED' USING ERRCODE = 'P0004';
    END IF;
    UPDATE public.event_guests SET videos_remaining = videos_remaining - 1 WHERE id = p_guest_id;
    v_remaining := v_guest.videos_remaining - 1;
  ELSE
    v_remaining := 99;
  END IF;

  v_storage_path := public.staging_storage_path(p_event_id, p_guest_id, v_safe_ext);

  INSERT INTO public.upload_reservations (guest_id, event_id, storage_path, media_type)
  VALUES (p_guest_id, p_event_id, v_storage_path, 'video')
  RETURNING id INTO v_reservation_id;

  RETURN jsonb_build_object(
    'reservation_id', v_reservation_id,
    'storage_path', v_storage_path,
    'videos_remaining', v_remaining
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- reset_event_test_data: admin only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_event_test_data(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event   public.events%ROWTYPE;
  v_tier    public.package_tiers%ROWTYPE;
  v_deleted INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'ADMIN_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'EVENT_NOT_FOUND' USING ERRCODE = 'P0007'; END IF;

  SELECT * INTO v_tier FROM public.package_tiers WHERE id = v_event.package_tier_id;

  DELETE FROM public.guest_challenge_completions
  WHERE challenge_id IN (SELECT id FROM public.event_challenges WHERE event_id = p_event_id);

  DELETE FROM public.upload_reservations WHERE event_id = p_event_id;

  WITH deleted AS (
    DELETE FROM public.photos WHERE event_id = p_event_id RETURNING id
  )
  SELECT COUNT(*)::INT INTO v_deleted FROM deleted;

  UPDATE public.event_guests
  SET
    photos_remaining = CASE WHEN v_event.test_mode THEN 9999 ELSE v_tier.per_guest_limit END,
    videos_remaining = CASE WHEN v_event.test_mode THEN 99 ELSE v_event.max_videos_per_guest END,
    audio_messages_remaining = COALESCE(v_event.audio_messages_per_guest, 3)
  WHERE event_id = p_event_id;

  RETURN jsonb_build_object(
    'event_id', p_event_id,
    'photos_deleted', v_deleted,
    'test_mode', v_event.test_mode
  );
END;
$$;

-- release_global_media_blob: only callable via SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.release_global_media_blob(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.release_global_media_blob(UUID) TO service_role;
