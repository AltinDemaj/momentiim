import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/auth';
import { buildDeepLink, buildJoinUrl, buildQrMockupReference, generateQrDataUrl } from '@/lib/qr';
import type { CreateEventResponse } from '@/types/database';

const createEventSchema = z.object({
  title: z.string().min(1).max(120),
  date: z.string().datetime({ offset: true }),
  package_tier_id: z.string().uuid(),
  client_name: z.string().max(120).optional(),
  reveal_scheduled_at: z.string().datetime({ offset: true }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase, profile } = auth;
    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, date, package_tier_id, client_name, reveal_scheduled_at } = parsed.data;

    const { data: tier, error: tierError } = await supabase
      .from('package_tiers')
      .select('*')
      .eq('id', package_tier_id)
      .single();

    if (tierError || !tier) {
      return NextResponse.json({ error: 'Package tier not found' }, { status: 404 });
    }

    const brandingLabel = client_name
      ? `${client_name} — ${new Date(date).toLocaleDateString('en-GB')}`
      : title;

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        host_id: profile.id,
        title,
        date,
        package_tier_id,
        client_name: client_name ?? null,
        branding_label: brandingLabel,
        reveal_scheduled_at: reveal_scheduled_at ?? null,
        status: 'active',
      })
      .select('*')
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: eventError?.message ?? 'Failed to create event' },
        { status: 500 }
      );
    }

    await supabase.rpc('seed_event_challenges', { p_event_id: event.id });

    const joinUrl = buildJoinUrl(event.id, event.join_code);
    const qrDataUrl = await generateQrDataUrl(joinUrl);
    const qrReference = buildQrMockupReference(event, tier, qrDataUrl, joinUrl);

    await supabase.from('events').update({ qr_code_url: qrDataUrl }).eq('id', event.id);

    const response: CreateEventResponse = {
      event: { ...event, qr_code_url: qrDataUrl },
      qr: {
        deep_link: qrReference.deep_link,
        qr_data_url: qrReference.qr_data_url,
        print_url: qrReference.print_url,
      },
      package_tier: tier,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/events/create]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
