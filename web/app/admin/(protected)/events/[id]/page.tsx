import { requireAdmin } from '@/lib/admin/auth';
import { redirect, notFound } from 'next/navigation';
import { buildJoinUrl, buildExpoGoLink, generateQrDataUrl } from '@/lib/qr';
import { EventDetailClient } from './EventDetailClient';
import type { ComponentProps } from 'react';

type EventDetailRow = ComponentProps<typeof EventDetailClient>['event'] & {
  package_tiers: {
    name: string;
    per_guest_limit: number;
    max_total_photos: number;
  } | null;
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const { supabase } = auth;

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      package_tiers ( name, per_guest_limit, max_total_photos )
    `)
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  const eventRow = event as unknown as EventDetailRow;

  const [{ count: guestCount }, { count: stagingCount }, { count: publishedCount }] =
    await Promise.all([
      supabase
        .from('event_guests')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id),
      supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id)
        .eq('status', 'staging'),
      supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id)
        .eq('status', 'published'),
    ]);

  const joinUrl = buildJoinUrl(eventRow.id, eventRow.join_code);
  const qrDataUrl = await generateQrDataUrl(joinUrl);
  const expoGoLink = buildExpoGoLink(eventRow.id);

  const tier = eventRow.package_tiers;

  return (
    <EventDetailClient
      event={eventRow}
      tier={tier}
      stats={{
        guestCount: guestCount ?? 0,
        stagingCount: stagingCount ?? 0,
        publishedCount: publishedCount ?? 0,
      }}
      joinUrl={joinUrl}
      qrDataUrl={qrDataUrl}
      expoGoLink={expoGoLink}
    />
  );
}
