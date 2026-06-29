-- Guest experience features (free for all guests — admin can toggle per event)

CREATE TYPE public.camera_filter_preset AS ENUM ('none', 'gala', 'vintage');

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS branding_label TEXT,
  ADD COLUMN IF NOT EXISTS camera_filter public.camera_filter_preset NOT NULL DEFAULT 'gala',
  ADD COLUMN IF NOT EXISTS show_referral_banner BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS feature_scavenger_hunt BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS feature_audio_guestbook BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS feature_face_search BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS feature_camera_filters BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS feature_social_reel BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS audio_messages_per_guest INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS social_reel_ready BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS social_reel_generated_at TIMESTAMPTZ;

ALTER TABLE public.event_slideshows
  ADD COLUMN IF NOT EXISTS social_reel_clip_order UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_reel_music_path TEXT;

-- ---------------------------------------------------------------------------
-- Scavenger hunt
-- ---------------------------------------------------------------------------
CREATE TABLE public.event_challenges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX event_challenges_event_idx ON public.event_challenges (event_id, sort_order);

CREATE TABLE public.guest_challenge_completions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.event_challenges (id) ON DELETE CASCADE,
  guest_id     UUID NOT NULL REFERENCES public.event_guests (id) ON DELETE CASCADE,
  photo_id     UUID NOT NULL REFERENCES public.photos (id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, guest_id)
);

CREATE INDEX guest_challenge_completions_guest_idx
  ON public.guest_challenge_completions (guest_id);

-- ---------------------------------------------------------------------------
-- Audio guestbook
-- ---------------------------------------------------------------------------
CREATE TABLE public.audio_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  guest_id     UUID NOT NULL REFERENCES public.event_guests (id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  duration_ms  INT NOT NULL CHECK (duration_ms > 0 AND duration_ms <= 120000),
  photo_id     UUID REFERENCES public.photos (id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audio_messages_event_idx ON public.audio_messages (event_id);

ALTER TABLE public.event_guests
  ADD COLUMN IF NOT EXISTS audio_messages_remaining INT NOT NULL DEFAULT 3;

-- ---------------------------------------------------------------------------
-- Find My Photos (visual signature matching)
-- ---------------------------------------------------------------------------
CREATE TABLE public.guest_selfies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  guest_id        UUID NOT NULL REFERENCES public.event_guests (id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,
  face_signature  REAL[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, guest_id)
);

CREATE TABLE public.photo_face_signatures (
  photo_id    UUID PRIMARY KEY REFERENCES public.photos (id) ON DELETE CASCADE,
  event_id    UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  signatures  REAL[] NOT NULL DEFAULT '{}',
  indexed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX photo_face_signatures_event_idx ON public.photo_face_signatures (event_id);

-- ---------------------------------------------------------------------------
-- Default wedding scavenger hunt challenges
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_event_challenges(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.event_challenges WHERE event_id = p_event_id) THEN
    RETURN;
  END IF;

  INSERT INTO public.event_challenges (event_id, title, description, sort_order) VALUES
    (p_event_id, 'Snap the groom laughing', 'Catch a genuine laugh on camera', 1),
    (p_event_id, 'Capture the valle dancing', 'The wildest traditional dance moment', 2),
    (p_event_id, 'Selfie with someone new', 'Meet a guest you did not know before tonight', 3),
    (p_event_id, 'The couple''s first dance', 'A photo from their first dance together', 4),
    (p_event_id, 'Toast or speech moment', 'Someone raising a glass or giving a speech', 5),
    (p_event_id, 'Table decoration detail', 'A beautiful centerpiece or place setting', 6),
    (p_event_id, 'Candid bride & groom', 'A natural, unposed moment of the couple', 7),
    (p_event_id, 'Group photo energy', 'A big group having fun together', 8),
    (p_event_id, 'Late-night dance floor', 'The party when the music peaks', 9),
    (p_event_id, 'A sweet family moment', 'Parents, siblings, or elders sharing a moment', 10);
END;
$$;

-- ---------------------------------------------------------------------------
-- Complete scavenger hunt item (links latest photo)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_event_challenge(
  p_challenge_id UUID,
  p_guest_id     UUID,
  p_photo_id     UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge public.event_challenges%ROWTYPE;
  v_guest     public.event_guests%ROWTYPE;
  v_photo     public.photos%ROWTYPE;
BEGIN
  SELECT * INTO v_challenge FROM public.event_challenges WHERE id = p_challenge_id;
  IF NOT FOUND OR NOT v_challenge.is_active THEN
    RAISE EXCEPTION 'CHALLENGE_NOT_FOUND' USING ERRCODE = 'P0011';
  END IF;

  SELECT * INTO v_guest FROM public.event_guests
  WHERE id = p_guest_id AND event_id = v_challenge.event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'GUEST_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_photo FROM public.photos
  WHERE id = p_photo_id AND event_id = v_challenge.event_id AND uploaded_by_guest_id = p_guest_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PHOTO_NOT_FOUND' USING ERRCODE = 'P0012';
  END IF;

  INSERT INTO public.guest_challenge_completions (challenge_id, guest_id, photo_id)
  VALUES (p_challenge_id, p_guest_id, p_photo_id)
  ON CONFLICT (challenge_id, guest_id)
  DO UPDATE SET photo_id = EXCLUDED.photo_id, completed_at = now();

  RETURN jsonb_build_object('challenge_id', p_challenge_id, 'photo_id', p_photo_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- Audio message reservation + commit (does not use photo pool)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_audio_message_slot(
  p_guest_id UUID,
  p_event_id UUID,
  p_file_ext TEXT DEFAULT 'm4a'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest        public.event_guests%ROWTYPE;
  v_event        public.events%ROWTYPE;
  v_safe_ext     TEXT;
  v_storage_path TEXT;
  v_message_id   UUID;
BEGIN
  v_safe_ext := lower(regexp_replace(p_file_ext, '[^a-z0-9]', '', 'g'));
  IF v_safe_ext = '' THEN v_safe_ext := 'm4a'; END IF;

  SELECT * INTO v_guest FROM public.event_guests
  WHERE id = p_guest_id AND event_id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'GUEST_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF NOT FOUND OR NOT v_event.feature_audio_guestbook THEN
    RAISE EXCEPTION 'AUDIO_NOT_ENABLED' USING ERRCODE = 'P0013';
  END IF;

  IF v_guest.audio_messages_remaining <= 0 THEN
    RAISE EXCEPTION 'AUDIO_LIMIT_EXCEEDED' USING ERRCODE = 'P0014';
  END IF;

  v_storage_path := 'audio/' || p_event_id::text || '/' || p_guest_id::text || '/' || gen_random_uuid()::text || '.' || v_safe_ext;

  UPDATE public.event_guests
  SET audio_messages_remaining = audio_messages_remaining - 1
  WHERE id = p_guest_id;

  INSERT INTO public.audio_messages (event_id, guest_id, storage_path, duration_ms)
  VALUES (p_event_id, p_guest_id, v_storage_path, 1)
  RETURNING id INTO v_message_id;

  RETURN jsonb_build_object(
    'message_id', v_message_id,
    'storage_path', v_storage_path,
    'audio_remaining', v_guest.audio_messages_remaining - 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.commit_audio_message(
  p_message_id   UUID,
  p_guest_id     UUID,
  p_duration_ms  INT,
  p_photo_id     UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg public.audio_messages%ROWTYPE;
BEGIN
  SELECT * INTO v_msg FROM public.audio_messages
  WHERE id = p_message_id AND guest_id = p_guest_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'AUDIO_NOT_FOUND' USING ERRCODE = 'P0015'; END IF;

  UPDATE public.audio_messages
  SET duration_ms = GREATEST(p_duration_ms, 500),
      photo_id = p_photo_id
  WHERE id = p_message_id;

  RETURN jsonb_build_object('message_id', p_message_id, 'storage_path', v_msg.storage_path);
END;
$$;

CREATE OR REPLACE FUNCTION public.rollback_audio_message(
  p_message_id UUID,
  p_guest_id   UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg public.audio_messages%ROWTYPE;
BEGIN
  SELECT * INTO v_msg FROM public.audio_messages
  WHERE id = p_message_id AND guest_id = p_guest_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  DELETE FROM public.audio_messages WHERE id = p_message_id;

  UPDATE public.event_guests
  SET audio_messages_remaining = audio_messages_remaining + 1
  WHERE id = p_guest_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Guest selfie + face signature upsert
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_guest_selfie(
  p_guest_id        UUID,
  p_event_id        UUID,
  p_storage_path    TEXT,
  p_face_signature  REAL[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.guest_selfies (event_id, guest_id, storage_path, face_signature, updated_at)
  VALUES (p_event_id, p_guest_id, p_storage_path, COALESCE(p_face_signature, '{}'), now())
  ON CONFLICT (event_id, guest_id)
  DO UPDATE SET
    storage_path = EXCLUDED.storage_path,
    face_signature = EXCLUDED.face_signature,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('selfie_id', v_id, 'storage_path', p_storage_path);
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_photo_face_signature(
  p_photo_id   UUID,
  p_event_id   UUID,
  p_signatures REAL[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.photo_face_signatures (photo_id, event_id, signatures, indexed_at)
  VALUES (p_photo_id, p_event_id, p_signatures, now())
  ON CONFLICT (photo_id)
  DO UPDATE SET signatures = EXCLUDED.signatures, indexed_at = now();
END;
$$;

-- Sync audio limits when guest registers
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
  v_audio  INT;
BEGIN
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'EVENT_NOT_FOUND' USING ERRCODE = 'P0007'; END IF;
  IF v_event.status <> 'active' THEN RAISE EXCEPTION 'EVENT_NOT_ACTIVE' USING ERRCODE = 'P0003'; END IF;

  SELECT * INTO v_tier FROM public.package_tiers WHERE id = v_event.package_tier_id;
  v_audio := COALESCE(v_event.audio_messages_per_guest, 3);

  INSERT INTO public.event_guests (event_id, device_id, user_id, photos_remaining, videos_remaining, audio_messages_remaining)
  VALUES (p_event_id, p_device_id, p_user_id, v_tier.per_guest_limit, v_event.max_videos_per_guest, v_audio)
  ON CONFLICT (event_id, device_id)
  DO UPDATE SET user_id = COALESCE(EXCLUDED.user_id, public.event_guests.user_id)
  RETURNING * INTO v_guest;

  PERFORM public.seed_event_challenges(p_event_id);

  RETURN jsonb_build_object(
    'guest_id', v_guest.id,
    'photos_remaining', v_guest.photos_remaining,
    'videos_remaining', v_guest.videos_remaining,
    'per_guest_limit', v_tier.per_guest_limit,
    'max_videos', v_event.max_videos_per_guest,
    'event_title', v_event.title,
    'audio_messages_remaining', v_guest.audio_messages_remaining
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.event_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_selfies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_face_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests read challenges for joined events"
  ON public.event_challenges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.event_id = event_challenges.event_id AND eg.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage challenges"
  ON public.event_challenges FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Guests read own challenge completions"
  ON public.guest_challenge_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.id = guest_challenge_completions.guest_id AND eg.user_id = auth.uid()
    )
  );

CREATE POLICY "Guests insert own challenge completions via RPC only"
  ON public.guest_challenge_completions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.id = guest_id AND eg.user_id = auth.uid()
    )
  );

CREATE POLICY "Guests read audio for joined events"
  ON public.audio_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.event_id = audio_messages.event_id AND eg.user_id = auth.uid()
    )
  );

CREATE POLICY "Guests read own selfies"
  ON public.guest_selfies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.id = guest_selfies.guest_id AND eg.user_id = auth.uid()
    )
  );

CREATE POLICY "Guests read photo signatures for joined events"
  ON public.photo_face_signatures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.event_id = photo_face_signatures.event_id AND eg.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage guest experience tables"
  ON public.guest_challenge_completions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage audio messages"
  ON public.audio_messages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage selfies"
  ON public.guest_selfies FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage photo signatures"
  ON public.photo_face_signatures FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT EXECUTE ON FUNCTION public.seed_event_challenges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_event_challenge(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_audio_message_slot(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.commit_audio_message(UUID, UUID, INT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_audio_message(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_guest_selfie(UUID, UUID, TEXT, REAL[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_photo_face_signature(UUID, UUID, REAL[]) TO authenticated;

-- Allow audio MIME types in storage
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/png', 'image/heic', 'image/heif',
  'video/mp4', 'video/quicktime',
  'audio/m4a', 'audio/mp4', 'audio/aac', 'audio/mpeg', 'audio/x-m4a'
]
WHERE id = 'event-photos';
