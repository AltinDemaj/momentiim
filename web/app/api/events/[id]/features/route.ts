import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const patchSchema = z.object({
  branding_label: z.string().max(120).nullable().optional(),
  celebration_type: z
    .enum(['wedding', 'engagement', 'birthday', 'anniversary', 'party', 'general'])
    .optional(),
  camera_filter: z.enum(['none', 'gala', 'vintage']).optional(),
  show_referral_banner: z.boolean().optional(),
  feature_scavenger_hunt: z.boolean().optional(),
  feature_audio_guestbook: z.boolean().optional(),
  feature_face_search: z.boolean().optional(),
  feature_camera_filters: z.boolean().optional(),
  feature_social_reel: z.boolean().optional(),
  audio_messages_per_guest: z.number().int().min(1).max(10).optional(),
});

const challengeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(300).nullable().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: eventId } = await params;
  const { supabase } = auth;

  const [{ data: event }, { data: challenges }] = await Promise.all([
    supabase
      .from('events')
      .select(
        'branding_label, celebration_type, camera_filter, show_referral_banner, feature_scavenger_hunt, feature_audio_guestbook, feature_face_search, feature_camera_filters, feature_social_reel, audio_messages_per_guest, social_reel_ready, social_reel_generated_at'
      )
      .eq('id', eventId)
      .single(),
    supabase
      .from('event_challenges')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order'),
  ]);

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  return NextResponse.json({ event, challenges: challenges ?? [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: eventId } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('events')
    .update(parsed.data)
    .eq('id', eventId)
    .select(
      'branding_label, celebration_type, camera_filter, show_referral_banner, feature_scavenger_hunt, feature_audio_guestbook, feature_face_search, feature_camera_filters, feature_social_reel, audio_messages_per_guest, social_reel_ready'
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: eventId } = await params;
  const body = await request.json();

  if (body.action === 'seed_challenges') {
    const service = createSupabaseServiceClient();
    const { error } = await service.rpc('seed_event_challenges', { p_event_id: eventId });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { data: challenges } = await auth.supabase
      .from('event_challenges')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order');
    return NextResponse.json({ challenges: challenges ?? [] });
  }

  const parsed = challengeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: maxRow } = await auth.supabase
    .from('event_challenges')
    .select('sort_order')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: challenge, error } = await auth.supabase
    .from('event_challenges')
    .insert({
      event_id: eventId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      sort_order: parsed.data.sort_order ?? (maxRow?.sort_order ?? 0) + 1,
      is_active: parsed.data.is_active ?? true,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ challenge });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: eventId } = await params;
  const challengeId = request.nextUrl.searchParams.get('challenge_id');
  if (!challengeId) {
    return NextResponse.json({ error: 'challenge_id required' }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from('event_challenges')
    .delete()
    .eq('id', challengeId)
    .eq('event_id', eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
