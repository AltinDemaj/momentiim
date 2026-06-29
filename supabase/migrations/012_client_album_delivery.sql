-- Momenti Im internal studio: client album delivery tracking

CREATE TYPE public.studio_status AS ENUM (
  'collecting',
  'in_studio',
  'delivered'
);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS studio_status public.studio_status NOT NULL DEFAULT 'collecting',
  ADD COLUMN IF NOT EXISTS client_album_delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_album_note TEXT,
  ADD COLUMN IF NOT EXISTS guest_album_live BOOLEAN NOT NULL DEFAULT false;

-- Events already revealed count as delivered guest access
UPDATE public.events
SET guest_album_live = true
WHERE revealed_at IS NOT NULL;

UPDATE public.events
SET studio_status = 'delivered', client_album_delivered_at = revealed_at
WHERE revealed_at IS NOT NULL AND client_album_delivered_at IS NULL;

-- Guests only see the album after Momenti Im opens the guest room
DROP POLICY IF EXISTS "Guests read published photos for joined events" ON public.photos;

CREATE POLICY "Guests read published photos for joined events"
  ON public.photos FOR SELECT
  USING (
    status = 'published'
    AND moderation_status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = photos.event_id AND e.guest_album_live = true
    )
    AND EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.event_id = photos.event_id AND eg.user_id = auth.uid()
    )
  );
