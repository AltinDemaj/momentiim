-- Allow joined guests (and hosts) to read admin-uploaded event cover images
-- Path pattern: events/{event_id}/cover.{ext}

CREATE POLICY "Guests read event cover images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'event-photos'
    AND (storage.foldername(name))[1] = 'events'
    AND public.guest_has_joined_event(((storage.foldername(name))[2])::uuid)
  );

CREATE POLICY "Hosts read event cover images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'event-photos'
    AND (storage.foldername(name))[1] = 'events'
    AND public.is_event_host(((storage.foldername(name))[2])::uuid)
  );
