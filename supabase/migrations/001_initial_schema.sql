-- =============================================================================
-- Momentiim — Initial Schema
-- Run via: supabase db push / supabase migration up
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('host', 'guest');
CREATE TYPE public.event_status AS ENUM ('active', 'completed');

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        public.user_role NOT NULL DEFAULT 'guest',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX profiles_role_idx ON public.profiles (role);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'guest')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- package_tiers
-- ---------------------------------------------------------------------------
CREATE TABLE public.package_tiers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL UNIQUE,
  max_total_photos  INT  NOT NULL CHECK (max_total_photos > 0),
  per_guest_limit   INT  NOT NULL CHECK (per_guest_limit > 0),
  price             NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed tiers
INSERT INTO public.package_tiers (name, max_total_photos, per_guest_limit, price) VALUES
  ('Starter',  500,   10,  49.00),
  ('Standard', 2000,  15,  99.00),
  ('Premium',  10000, 25,  249.00);

-- ---------------------------------------------------------------------------
-- host_subscriptions (links host to purchased tier — payment gate)
-- ---------------------------------------------------------------------------
CREATE TABLE public.host_subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id          UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  package_tier_id  UUID NOT NULL REFERENCES public.package_tiers (id),
  events_remaining INT NOT NULL DEFAULT 1 CHECK (events_remaining >= 0),
  purchased_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at       TIMESTAMPTZ
);

CREATE INDEX host_subscriptions_host_idx ON public.host_subscriptions (host_id);

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
CREATE TABLE public.events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id          UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  date             TIMESTAMPTZ NOT NULL,
  qr_code_url      TEXT,
  package_tier_id  UUID NOT NULL REFERENCES public.package_tiers (id),
  status           public.event_status NOT NULL DEFAULT 'active',
  deep_link        TEXT GENERATED ALWAYS AS ('momentiim://event/' || id::text) STORED,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX events_host_idx   ON public.events (host_id);
CREATE INDEX events_status_idx ON public.events (status);

-- ---------------------------------------------------------------------------
-- event_guests
-- ---------------------------------------------------------------------------
CREATE TABLE public.event_guests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  device_id        TEXT NOT NULL,
  user_id          UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  photos_remaining INT  NOT NULL CHECK (photos_remaining >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, device_id)
);

CREATE INDEX event_guests_event_idx ON public.event_guests (event_id);
CREATE INDEX event_guests_user_idx  ON public.event_guests (user_id);

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------
CREATE TABLE public.photos (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id             UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  uploaded_by_guest_id UUID NOT NULL REFERENCES public.event_guests (id) ON DELETE CASCADE,
  storage_path         TEXT NOT NULL UNIQUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX photos_event_idx ON public.photos (event_id);
CREATE INDEX photos_guest_idx ON public.photos (uploaded_by_guest_id);

-- ---------------------------------------------------------------------------
-- upload_reservations (pending slots reserved before storage upload completes)
-- ---------------------------------------------------------------------------
CREATE TABLE public.upload_reservations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id   UUID NOT NULL REFERENCES public.event_guests (id) ON DELETE CASCADE,
  event_id   UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX upload_reservations_guest_idx ON public.upload_reservations (guest_id);

-- ---------------------------------------------------------------------------
-- Helper: count photos for an event
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.event_photo_count(p_event_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INT FROM public.photos WHERE event_id = p_event_id;
$$;

-- ---------------------------------------------------------------------------
-- RPC: decrement_guest_limit — atomic slot reservation
-- Returns JSON: { reservation_id, storage_path, photos_remaining }
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
  -- Sanitize extension
  v_safe_ext := lower(regexp_replace(p_file_ext, '[^a-z0-9]', '', 'g'));
  IF v_safe_ext = '' THEN
    v_safe_ext := 'jpg';
  END IF;

  -- Lock guest row
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

  -- Lock event + load tier
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

  -- Reserve slot: decrement guest counter
  UPDATE public.event_guests
  SET photos_remaining = photos_remaining - 1
  WHERE id = p_guest_id;

  v_storage_path := p_event_id::text || '/' || p_guest_id::text || '/' || gen_random_uuid()::text || '.' || v_safe_ext;

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
-- RPC: commit_photo_upload — finalize after successful storage PUT
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

  INSERT INTO public.photos (event_id, uploaded_by_guest_id, storage_path)
  VALUES (v_reservation.event_id, v_reservation.guest_id, v_reservation.storage_path)
  RETURNING id INTO v_photo_id;

  DELETE FROM public.upload_reservations WHERE id = p_reservation_id;

  RETURN jsonb_build_object('photo_id', v_photo_id, 'storage_path', v_reservation.storage_path);
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: release_guest_reservation — rollback on failed upload
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_guest_reservation(
  p_reservation_id UUID,
  p_guest_id       UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation public.upload_reservations%ROWTYPE;
BEGIN
  SELECT * INTO v_reservation
  FROM public.upload_reservations
  WHERE id = p_reservation_id AND guest_id = p_guest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.event_guests
  SET photos_remaining = photos_remaining + 1
  WHERE id = p_guest_id;

  DELETE FROM public.upload_reservations WHERE id = p_reservation_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: register_event_guest — called on QR scan / deep link open
-- ---------------------------------------------------------------------------
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
  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND' USING ERRCODE = 'P0007';
  END IF;

  SELECT * INTO v_tier FROM public.package_tiers WHERE id = v_event.package_tier_id;

  INSERT INTO public.event_guests (event_id, device_id, user_id, photos_remaining)
  VALUES (p_event_id, p_device_id, p_user_id, v_tier.per_guest_limit)
  ON CONFLICT (event_id, device_id) DO UPDATE
    SET user_id = COALESCE(EXCLUDED.user_id, event_guests.user_id)
  RETURNING * INTO v_guest;

  RETURN jsonb_build_object(
    'guest_id',         v_guest.id,
    'photos_remaining', v_guest.photos_remaining,
    'per_guest_limit',  v_tier.per_guest_limit,
    'event_title',      v_event.title
  );
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_tiers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_guests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_reservations ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- package_tiers (public read)
CREATE POLICY "Anyone can read package tiers"
  ON public.package_tiers FOR SELECT
  USING (true);

-- host_subscriptions
CREATE POLICY "Hosts read own subscriptions"
  ON public.host_subscriptions FOR SELECT
  USING (auth.uid() = host_id);

-- events
CREATE POLICY "Hosts manage own events"
  ON public.events FOR ALL
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Guests read active events they joined"
  ON public.events FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.event_id = events.id
        AND (eg.user_id = auth.uid() OR eg.device_id = current_setting('app.device_id', true))
    )
  );

-- event_guests
CREATE POLICY "Guests read own guest row"
  ON public.event_guests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Guests update own guest row"
  ON public.event_guests FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Hosts read guests for own events"
  ON public.event_guests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_guests.event_id AND e.host_id = auth.uid()
    )
  );

-- photos
CREATE POLICY "Guests read photos for their events"
  ON public.photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.event_id = photos.event_id AND eg.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = photos.event_id AND e.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts read all photos for own events"
  ON public.photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = photos.event_id AND e.host_id = auth.uid()
    )
  );

-- upload_reservations (service role + RPC only; no direct client access)
CREATE POLICY "No direct client access to reservations"
  ON public.upload_reservations FOR ALL
  USING (false);

-- =============================================================================
-- Storage bucket (run in Supabase dashboard or via API)
-- =============================================================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'event-photos',
--   'event-photos',
--   false,
--   52428800,  -- 50 MB
--   ARRAY['image/jpeg','image/png','image/heic','image/heif']
-- );

-- Storage policies (apply after bucket creation):
-- CREATE POLICY "Guests upload to own path"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'event-photos'
--     AND (storage.foldername(name))[2] = auth.uid()::text  -- adjust to guest_id claim
--   );

-- CREATE POLICY "Hosts read event photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'event-photos');

-- Grant execute on RPCs to authenticated users
GRANT EXECUTE ON FUNCTION public.decrement_guest_limit(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.commit_photo_upload(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_guest_reservation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_event_guest(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_photo_count(UUID) TO authenticated;
