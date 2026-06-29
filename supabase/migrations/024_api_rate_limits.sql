-- API rate limiting for server-side endpoints (e.g. guest session)

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  bucket_key    TEXT PRIMARY KEY,
  hit_count     INT NOT NULL DEFAULT 0,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct client access to api_rate_limits"
  ON public.api_rate_limits
  FOR ALL
  USING (false);

CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_bucket_key TEXT,
  p_max_requests INT,
  p_window_seconds INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.api_rate_limits%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_retry_after INT;
BEGIN
  IF p_max_requests <= 0 OR p_window_seconds <= 0 THEN
    RETURN jsonb_build_object('allowed', true);
  END IF;

  SELECT * INTO v_row
  FROM public.api_rate_limits
  WHERE bucket_key = p_bucket_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.api_rate_limits (bucket_key, hit_count, window_start)
    VALUES (p_bucket_key, 1, v_now);
    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_requests - 1);
  END IF;

  IF v_row.window_start + make_interval(secs => p_window_seconds) <= v_now THEN
    UPDATE public.api_rate_limits
    SET hit_count = 1, window_start = v_now
    WHERE bucket_key = p_bucket_key;
    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_requests - 1);
  END IF;

  IF v_row.hit_count >= p_max_requests THEN
    v_retry_after := GREATEST(
      1,
      EXTRACT(EPOCH FROM (v_row.window_start + make_interval(secs => p_window_seconds) - v_now))::INT
    );
    RETURN jsonb_build_object(
      'allowed', false,
      'retry_after', v_retry_after,
      'remaining', 0
    );
  END IF;

  UPDATE public.api_rate_limits
  SET hit_count = hit_count + 1
  WHERE bucket_key = p_bucket_key;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', p_max_requests - v_row.hit_count - 1
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_api_rate_limit(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_api_rate_limit(TEXT, INT, INT) TO service_role;
