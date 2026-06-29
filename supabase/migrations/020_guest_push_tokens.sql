CREATE TABLE IF NOT EXISTS public.guest_push_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       TEXT NOT NULL UNIQUE,
  user_id         UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX guest_push_tokens_user_idx ON public.guest_push_tokens (user_id);

ALTER TABLE public.guest_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests manage own push token"
  ON public.guest_push_tokens
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.upsert_guest_push_token(
  p_device_id       TEXT,
  p_expo_push_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'P0018';
  END IF;

  INSERT INTO public.guest_push_tokens (device_id, user_id, expo_push_token, updated_at)
  VALUES (p_device_id, auth.uid(), p_expo_push_token, now())
  ON CONFLICT (device_id)
  DO UPDATE SET
    expo_push_token = EXCLUDED.expo_push_token,
    user_id = EXCLUDED.user_id,
    updated_at = now();

  RETURN jsonb_build_object('registered', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_guest_push_token(TEXT, TEXT) TO authenticated;
