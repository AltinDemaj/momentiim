import { requireAdmin } from '@/lib/admin/auth';
import { redirect, notFound } from 'next/navigation';
import { buildJoinUrl, generateQrDataUrl } from '@/lib/qr';
import { PrintSignClient } from './PrintSignClient';

type SignEventRow = {
  id: string;
  title: string;
  join_code: string;
  client_name: string | null;
  date: string;
};

export default async function PrintSignPage({
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
    .select('id, title, join_code, client_name, date')
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  const eventRow = event as SignEventRow;
  const joinUrl = buildJoinUrl(eventRow.id, eventRow.join_code);
  const qrDataUrl = await generateQrDataUrl(joinUrl, 512);

  return (
    <PrintSignClient
      event={eventRow}
      joinUrl={joinUrl}
      qrDataUrl={qrDataUrl}
    />
  );
}
