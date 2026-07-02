-- Per-clip transition markers between visual timeline items
ALTER TABLE public.event_slideshows
  ADD COLUMN IF NOT EXISTS clip_transitions JSONB NOT NULL DEFAULT '{}';
