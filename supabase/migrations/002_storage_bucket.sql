-- =============================================================================
-- Storage bucket for uncompressed event photos
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  false,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Staging path: staging/{event_id}/{guest_id}/... — see migration 002
CREATE POLICY "Authenticated guests upload event photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-photos'
    AND (
      (storage.foldername(name))[2] IN (
        SELECT eg.id::text FROM public.event_guests eg WHERE eg.user_id = auth.uid()
      )
      OR (storage.foldername(name))[3] IN (
        SELECT eg.id::text FROM public.event_guests eg WHERE eg.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Hosts and guests read event photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'event-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE (e.id::text = (storage.foldername(name))[1] OR e.id::text = (storage.foldername(name))[2])
          AND e.host_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.event_guests eg
        WHERE (eg.id::text = (storage.foldername(name))[2] OR eg.id::text = (storage.foldername(name))[3])
          AND eg.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Guests delete own pending uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-photos'
    AND (
      (storage.foldername(name))[2] IN (SELECT eg.id::text FROM public.event_guests eg WHERE eg.user_id = auth.uid())
      OR (storage.foldername(name))[3] IN (SELECT eg.id::text FROM public.event_guests eg WHERE eg.user_id = auth.uid())
    )
  );
