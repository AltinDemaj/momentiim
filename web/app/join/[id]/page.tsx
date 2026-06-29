import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { buildDeepLink, buildExpoGoLink } from '@/lib/qr';
import { JoinPageClient } from './JoinPageClient';
import { notFound } from 'next/navigation';

type JoinEventRow = {
  id: string;
  title: string;
  status: string;
  join_code: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE_RE = /^[A-Z0-9]{6}$/i;

export default async function JoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from('events')
    .select('id, title, status, join_code')
    .eq('status', 'active');

  if (UUID_RE.test(id)) {
    query = query.eq('id', id);
  } else if (CODE_RE.test(id)) {
    query = query.eq('join_code', id.toUpperCase());
  } else {
    notFound();
  }

  const { data: event } = await query.single();

  if (!event) {
    notFound();
  }

  const eventRow = event as JoinEventRow;

  return (
    <JoinPageClient
      eventId={eventRow.id}
      eventTitle={eventRow.title}
      joinCode={eventRow.join_code}
      deepLink={buildDeepLink(eventRow.id)}
      expoGoLink={buildExpoGoLink(eventRow.id)}
    />
  );
}
