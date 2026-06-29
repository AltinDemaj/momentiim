-- Unified timeline: audio tracks library + timeline order

ALTER TABLE public.event_slideshows
  ADD COLUMN IF NOT EXISTS audio_tracks JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS audio_clip_order TEXT[] NOT NULL DEFAULT '{}';
