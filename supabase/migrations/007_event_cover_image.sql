-- Event cover image for hero displays (admin-uploaded)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS cover_image_path TEXT;
