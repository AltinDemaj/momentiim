-- v3: 3-layer variant system (headline × template × bullet set) + anonymized labels

ALTER TABLE public.social_content_drafts
  ADD COLUMN IF NOT EXISTS headline_variant TEXT,
  ADD COLUMN IF NOT EXISTS template_variant TEXT,
  ADD COLUMN IF NOT EXISTS bullet_set_variant TEXT,
  ADD COLUMN IF NOT EXISTS anonymous_event_label TEXT;

CREATE INDEX IF NOT EXISTS social_content_drafts_template_variant_idx
  ON public.social_content_drafts (template_variant, created_at DESC);
