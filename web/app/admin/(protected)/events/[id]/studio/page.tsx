import { requireAdmin } from '@/lib/admin/auth';
import { redirect, notFound } from 'next/navigation';
import { StudioClient } from './StudioClient';
import type { ComponentProps } from 'react';

type StudioEventRow = ComponentProps<typeof StudioClient>['event'];

export default async function StudioPage({
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
    .select('id, title, date, client_name, join_code, revealed_at, status, studio_status, client_album_delivered_at, client_album_note, guest_album_live')
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  const eventRow = event as unknown as StudioEventRow;

  return <StudioClient event={eventRow} />;
}
