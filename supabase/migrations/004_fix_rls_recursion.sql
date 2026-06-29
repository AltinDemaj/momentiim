-- Fix infinite recursion: events policy queried event_guests whose policy queried events
-- Use SECURITY DEFINER helpers so cross-table checks bypass RLS

CREATE OR REPLACE FUNCTION public.guest_has_joined_event(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_guests eg
    WHERE eg.event_id = p_event_id
      AND (
        eg.user_id = auth.uid()
        OR eg.device_id = current_setting('app.device_id', true)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_event_host(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id AND e.host_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Guests read active events they joined" ON public.events;
DROP POLICY IF EXISTS "Hosts read guests for own events" ON public.event_guests;

CREATE POLICY "Guests read active events they joined"
  ON public.events FOR SELECT
  USING (
    status = 'active'
    AND public.guest_has_joined_event(id)
  );

CREATE POLICY "Hosts read guests for own events"
  ON public.event_guests FOR SELECT
  USING (
    public.is_event_host(event_id)
    OR public.is_admin()
  );

GRANT EXECUTE ON FUNCTION public.guest_has_joined_event(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_host(UUID) TO authenticated;
