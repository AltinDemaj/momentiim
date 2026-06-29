-- Admin enum must be in its own migration (Postgres requires commit before use)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';
