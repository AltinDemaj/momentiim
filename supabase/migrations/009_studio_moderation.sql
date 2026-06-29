-- Momenti Im Studio: per-photo moderation, flags, slideshow config

CREATE TYPE public.moderation_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'hidden'
);

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS moderation_status public.moderation_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_highlight BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_cover_candidate BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_flags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS moderation_note TEXT,
  ADD COLUMN IF NOT EXISTS display_order INT,
  ADD COLUMN IF NOT EXISTS slide_duration_ms INT DEFAULT 4500;

-- Existing media is grandfathered as approved
UPDATE public.photos
SET moderation_status = 'approved'
WHERE moderation_status = 'pending';

CREATE TABLE IF NOT EXISTS public.event_slideshows (
  event_id UUID PRIMARY KEY REFERENCES public.events (id) ON DELETE CASCADE,
  music_storage_path TEXT,
  music_volume REAL NOT NULL DEFAULT 0.8,
  clip_order UUID[] NOT NULL DEFAULT '{}',
  transition TEXT NOT NULL DEFAULT 'crossfade',
  shuffle BOOLEAN NOT NULL DEFAULT false,
  loop BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_slideshows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage event slideshows"
  ON public.event_slideshows FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Publish only approved staging items; optional subset by id
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
    SET revealed_at = COALESCE(revealed_at, now())
    WHERE id = p_event_id;
  END IF;

  RETURN jsonb_build_object(
    'event_id', p_event_id,
    'published_count', v_published_count,
    'revealed_at', (SELECT revealed_at FROM public.events WHERE id = p_event_id)
  );
END;
$$;

-- Keep legacy bulk publish but only approved items
CREATE OR REPLACE FUNCTION public.publish_event_photos(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.publish_selected_photos(p_event_id, NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_selected_photos(UUID, UUID[]) TO authenticated;

-- Guests never see hidden/rejected even if mistakenly published
DROP POLICY IF EXISTS "Guests read published photos for joined events" ON public.photos;

CREATE POLICY "Guests read published photos for joined events"
  ON public.photos FOR SELECT
  USING (
    status = 'published'
    AND moderation_status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.event_id = photos.event_id AND eg.user_id = auth.uid()
    )
  );
