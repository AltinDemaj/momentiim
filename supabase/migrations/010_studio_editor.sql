-- Studio editor extensions: photo edits, slideshow music trim, guest read

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS photo_edits JSONB NOT NULL DEFAULT '{}';

ALTER TABLE public.event_slideshows
  ADD COLUMN IF NOT EXISTS music_fade_in_ms INT NOT NULL DEFAULT 800,
  ADD COLUMN IF NOT EXISTS music_fade_out_ms INT NOT NULL DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS music_trim_start_ms INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS music_trim_end_ms INT,
  ADD COLUMN IF NOT EXISTS publish_mode TEXT NOT NULL DEFAULT 'approved_collection',
  ADD COLUMN IF NOT EXISTS hide_videos BOOLEAN NOT NULL DEFAULT false;

-- Guests may read slideshow playback order for joined events
CREATE POLICY "Guests read slideshow for joined events"
  ON public.event_slideshows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.event_id = event_slideshows.event_id AND eg.user_id = auth.uid()
    )
  );
