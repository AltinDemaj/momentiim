-- Track Instagram / TikTok publish attempts per draft

ALTER TABLE public.social_content_drafts
  ADD COLUMN IF NOT EXISTS instagram_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS instagram_media_id TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tiktok_publish_id TEXT,
  ADD COLUMN IF NOT EXISTS last_publish_error TEXT,
  ADD COLUMN IF NOT EXISTS last_publish_result JSONB;
