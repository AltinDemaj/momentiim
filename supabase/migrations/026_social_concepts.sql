-- Social draft concepts, source tracking, cron-only daily limit

CREATE TYPE public.social_draft_source AS ENUM ('cron', 'manual');
CREATE TYPE public.social_concept_type AS ENUM (
  'qr_scan',
  'app_explainer',
  'staged_use_case'
);

ALTER TABLE public.social_content_drafts
  ADD COLUMN IF NOT EXISTS source public.social_draft_source NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS concept_type public.social_concept_type NOT NULL DEFAULT 'app_explainer',
  ADD COLUMN IF NOT EXISTS concept_label TEXT;

DROP INDEX IF EXISTS social_content_drafts_scheduled_for_active_idx;

-- Only one automated cron draft per calendar day
CREATE UNIQUE INDEX social_content_drafts_cron_per_day_idx
  ON public.social_content_drafts (scheduled_for)
  WHERE source = 'cron' AND status IN ('pending', 'approved');
