-- Guest delete own photos/audio; admin can delete audio via service role policies (already covered).

-- Guests may read photos they uploaded (any status) for delete/review in keepsake album.
DROP POLICY IF EXISTS "Guests read own uploaded photos" ON public.photos;
CREATE POLICY "Guests read own uploaded photos"
  ON public.photos FOR SELECT
  USING (
    uploaded_by_guest_id IN (
      SELECT id FROM public.event_guests WHERE user_id = auth.uid()
    )
  );

-- Guests may delete their own audio message rows (RPC handles storage).
DROP POLICY IF EXISTS "Guests delete own audio messages" ON public.audio_messages;
CREATE POLICY "Guests delete own audio messages"
  ON public.audio_messages FOR DELETE
  USING (
    guest_id IN (
      SELECT id FROM public.event_guests WHERE user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.guest_delete_own_photo(
  p_photo_id UUID,
  p_guest_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_guest public.event_guests%ROWTYPE;
  v_photo public.photos%ROWTYPE;
  v_tier public.package_tiers%ROWTYPE;
BEGIN
  SELECT * INTO v_guest
  FROM public.event_guests
  WHERE id = p_guest_id AND user_id = auth.uid()
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'GUEST_NOT_AUTHORIZED' USING ERRCODE = 'P0016';
  END IF;

  SELECT * INTO v_photo
  FROM public.photos
  WHERE id = p_photo_id AND uploaded_by_guest_id = p_guest_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PHOTO_NOT_FOUND' USING ERRCODE = 'P0017';
  END IF;

  DELETE FROM public.guest_challenge_completions WHERE photo_id = p_photo_id;
  DELETE FROM public.photo_face_signatures WHERE photo_id = p_photo_id;
  DELETE FROM storage.objects
  WHERE bucket_id = 'event-photos' AND name = v_photo.storage_path;

  DELETE FROM public.photos WHERE id = p_photo_id;

  SELECT pt.* INTO v_tier
  FROM public.events e
  JOIN public.package_tiers pt ON pt.id = e.package_tier_id
  WHERE e.id = v_guest.event_id;

  IF v_photo.media_type = 'video' THEN
    UPDATE public.event_guests
    SET videos_remaining = videos_remaining + 1
    WHERE id = p_guest_id;
  ELSE
    UPDATE public.event_guests
    SET photos_remaining = LEAST(photos_remaining + 1, v_tier.per_guest_limit)
    WHERE id = p_guest_id;
  END IF;

  RETURN jsonb_build_object('deleted', true, 'photo_id', p_photo_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.guest_delete_own_audio_message(
  p_message_id UUID,
  p_guest_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_guest public.event_guests%ROWTYPE;
  v_msg public.audio_messages%ROWTYPE;
BEGIN
  SELECT * INTO v_guest
  FROM public.event_guests
  WHERE id = p_guest_id AND user_id = auth.uid()
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'GUEST_NOT_AUTHORIZED' USING ERRCODE = 'P0016';
  END IF;

  SELECT * INTO v_msg
  FROM public.audio_messages
  WHERE id = p_message_id AND guest_id = p_guest_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'AUDIO_NOT_FOUND' USING ERRCODE = 'P0015';
  END IF;

  DELETE FROM storage.objects
  WHERE bucket_id = 'event-photos' AND name = v_msg.storage_path;

  DELETE FROM public.audio_messages WHERE id = p_message_id;

  UPDATE public.event_guests
  SET audio_messages_remaining = audio_messages_remaining + 1
  WHERE id = p_guest_id;

  RETURN jsonb_build_object('deleted', true, 'message_id', p_message_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.guest_delete_own_photo(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.guest_delete_own_audio_message(UUID, UUID) TO authenticated;
