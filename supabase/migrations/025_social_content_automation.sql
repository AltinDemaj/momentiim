-- Daily social content automation: photo pick → mockup → email approval

CREATE TYPE public.social_draft_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'skipped'
);

CREATE TABLE public.social_content_drafts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID REFERENCES public.events(id) ON DELETE SET NULL,
  photo_ids         UUID[] NOT NULL DEFAULT '{}',
  mockup_storage_path TEXT,
  status            public.social_draft_status NOT NULL DEFAULT 'pending',
  scheduled_for     DATE NOT NULL DEFAULT CURRENT_DATE,
  email_sent_at     TIMESTAMPTZ,
  reviewed_at       TIMESTAMPTZ,
  review_note       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX social_content_drafts_scheduled_for_active_idx
  ON public.social_content_drafts (scheduled_for)
  WHERE status IN ('pending', 'approved');

CREATE INDEX social_content_drafts_status_idx
  ON public.social_content_drafts (status, created_at DESC);

ALTER TABLE public.social_content_drafts ENABLE ROW LEVEL SECURITY;

-- Admin-only via service role (no public policies)
CREATE POLICY "Admins manage social drafts"
  ON public.social_content_drafts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Storage bucket for generated mockups (private; signed URLs in email)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-drafts',
  'social-drafts',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Service role uploads mockups from cron
CREATE POLICY "Service role manages social draft files"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'social-drafts')
  WITH CHECK (bucket_id = 'social-drafts');
