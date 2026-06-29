-- =============================================================================
-- Admin-only ops, staged photo delivery, remove payment/subscriptions
-- =============================================================================

-- Admin role (must be committed before use — see 003a migration)

CREATE TYPE public.photo_status AS ENUM ('staging', 'published');

-- Events: client label + delayed reveal window (TBD, default +24h after event date)
ALTER TABLE public.events
  ADD COLUMN client_name          TEXT,
  ADD COLUMN reveal_scheduled_at  TIMESTAMPTZ,
  ADD COLUMN revealed_at          TIMESTAMPTZ;

-- Photos land in staging first; guests only see published
ALTER TABLE public.photos
  ADD COLUMN status       public.photo_status NOT NULL DEFAULT 'staging',
  ADD COLUMN published_at TIMESTAMPTZ;

CREATE INDEX photos_status_idx ON public.photos (event_id, status);

-- Drop payment gate (no Stripe)
DROP TABLE IF EXISTS public.host_subscriptions;

-- Optional: tiers are admin-configured limits only — price no longer required
ALTER TABLE public.package_tiers ALTER COLUMN price DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Count all uploaded photos (staging + published) toward event pool limit
CREATE OR REPLACE FUNCTION public.event_photo_count(p_event_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INT FROM public.photos WHERE event_id = p_event_id;
$$;

-- Staging path prefix for admin inbox
CREATE OR REPLACE FUNCTION public.staging_storage_path(
  p_event_id UUID,
  p_guest_id UUID,
  p_file_ext TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'staging/' || p_event_id::text || '/' || p_guest_id::text || '/'
         || gen_random_uuid()::text || '.' || p_file_ext;
$$;

-- ---------------------------------------------------------------------------
-- Update decrement_guest_limit — write to staging/ prefix
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
BEGIN
  v_safe_ext := lower(regexp_replace(p_file_ext, '[^a-z0-9]', '', 'g'));
  IF v_safe_ext = '' THEN
    v_safe_ext := 'jpg';
  END IF;

  SELECT * INTO v_guest
  FROM public.event_guests
  WHERE id = p_guest_id AND event_id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'GUEST_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF v_guest.photos_remaining <= 0 THEN
    RAISE EXCEPTION 'GUEST_LIMIT_EXCEEDED' USING ERRCODE = 'P0002';
  END IF;

  SELECT e.* INTO v_event
  FROM public.events e
  WHERE e.id = p_event_id AND e.status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_ACTIVE' USING ERRCODE = 'P0003';
  END IF;

  SELECT * INTO v_tier FROM public.package_tiers WHERE id = v_event.package_tier_id;

  v_current_count := public.event_photo_count(p_event_id);

  IF v_current_count >= v_tier.max_total_photos THEN
    RAISE EXCEPTION 'EVENT_POOL_EXHAUSTED' USING ERRCODE = 'P0004';
  END IF;

  UPDATE public.event_guests
  SET photos_remaining = photos_remaining - 1
  WHERE id = p_guest_id;

  v_storage_path := public.staging_storage_path(p_event_id, p_guest_id, v_safe_ext);

  INSERT INTO public.upload_reservations (guest_id, event_id, storage_path)
  VALUES (p_guest_id, p_event_id, v_storage_path)
  RETURNING id INTO v_reservation_id;

  RETURN jsonb_build_object(
    'reservation_id',   v_reservation_id,
    'storage_path',     v_storage_path,
    'photos_remaining', v_guest.photos_remaining - 1
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- commit_photo_upload — always staging
-- ---------------------------------------------------------------------------
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
  SELECT * INTO v_reservation
  FROM public.upload_reservations
  WHERE id = p_reservation_id AND guest_id = p_guest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0005';
  END IF;

  IF v_reservation.expires_at < now() THEN
    DELETE FROM public.upload_reservations WHERE id = p_reservation_id;
    RAISE EXCEPTION 'RESERVATION_EXPIRED' USING ERRCODE = 'P0006';
  END IF;

  INSERT INTO public.photos (event_id, uploaded_by_guest_id, storage_path, status)
  VALUES (v_reservation.event_id, v_reservation.guest_id, v_reservation.storage_path, 'staging')
  RETURNING id INTO v_photo_id;

  DELETE FROM public.upload_reservations WHERE id = p_reservation_id;

  RETURN jsonb_build_object(
    'photo_id', v_photo_id,
    'storage_path', v_reservation.storage_path,
    'status', 'staging'
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- publish_event_photos — move staging → vault for guest event room
-- Called manually from admin dashboard (or future cron when reveal_scheduled_at hits)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_event_photos(p_event_id UUID)
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
  WHERE event_id = p_event_id AND status = 'staging';

  GET DIAGNOSTICS v_published_count = ROW_COUNT;

  UPDATE public.events
  SET revealed_at = now()
  WHERE id = p_event_id;

  RETURN jsonb_build_object(
    'event_id', p_event_id,
    'published_count', v_published_count,
    'revealed_at', now()
  );
END;
$$;

-- Default reveal_scheduled_at = event date + 24 hours on insert
CREATE OR REPLACE FUNCTION public.set_default_reveal_scheduled_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.reveal_scheduled_at IS NULL THEN
    NEW.reveal_scheduled_at := NEW.date + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER events_set_reveal_scheduled_at
  BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_default_reveal_scheduled_at();

-- ---------------------------------------------------------------------------
-- RLS updates — admin full access; guests see published photos only
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins manage all events"
  ON public.events FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins read all guests"
  ON public.event_guests FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins read all photos"
  ON public.photos FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins update photos"
  ON public.photos FOR UPDATE
  USING (public.is_admin());

-- Replace guest photo read — published only in event room
DROP POLICY IF EXISTS "Guests read photos for their events" ON public.photos;
DROP POLICY IF EXISTS "Hosts read all photos for own events" ON public.photos;

CREATE POLICY "Guests read published photos for joined events"
  ON public.photos FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.event_id = photos.event_id AND eg.user_id = auth.uid()
    )
  );

GRANT EXECUTE ON FUNCTION public.publish_event_photos(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
