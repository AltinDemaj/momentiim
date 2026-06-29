CREATE TYPE public.celebration_type AS ENUM (
  'wedding',
  'engagement',
  'birthday',
  'anniversary',
  'party',
  'general'
);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS celebration_type public.celebration_type NOT NULL DEFAULT 'general';
