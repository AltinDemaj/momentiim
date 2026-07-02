-- Track social pipeline format; v2 = unified 9:16 story with app UI screenshot

ALTER TABLE public.social_content_drafts
  ADD COLUMN IF NOT EXISTS pipeline_version INT NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS social_content_drafts_pipeline_version_idx
  ON public.social_content_drafts (pipeline_version, created_at DESC);
