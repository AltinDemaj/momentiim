-- Short 6-character join codes for easy phone entry
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
  attempts INT := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.events WHERE join_code = result);
    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'JOIN_CODE_GENERATION_FAILED';
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_event_join_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.join_code IS NULL OR NEW.join_code = '' THEN
    NEW.join_code := public.generate_join_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_set_join_code ON public.events;
CREATE TRIGGER events_set_join_code
  BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_event_join_code();

UPDATE public.events SET join_code = public.generate_join_code() WHERE join_code IS NULL;

ALTER TABLE public.events ALTER COLUMN join_code SET NOT NULL;

CREATE OR REPLACE FUNCTION public.resolve_join_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
BEGIN
  SELECT * INTO v_event
  FROM public.events
  WHERE join_code = upper(trim(p_code)) AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_JOIN_CODE' USING ERRCODE = 'P0009';
  END IF;

  RETURN jsonb_build_object(
    'event_id', v_event.id,
    'event_title', v_event.title,
    'join_code', v_event.join_code
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_join_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_join_code(TEXT) TO anon;
