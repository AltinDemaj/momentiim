import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { adminLoginPath } from '@/lib/admin/access';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/admin-ui';
import { buildJoinUrl, generateQrDataUrl } from '@/lib/qr';
import type { AdminRoomCardData, AdminRoomTier } from '@/lib/admin/room-types';
import { RoomsGrid } from './RoomsGrid';

type EventListRow = {
  id: string;
  title: string;
  date: string;
  status: string;
  client_name: string | null;
  reveal_scheduled_at: string | null;
  revealed_at: string | null;
  created_at: string;
  join_code: string;
  package_tiers: AdminRoomTier | AdminRoomTier[] | null;
};

function normalizeTier(
  raw: EventListRow['package_tiers']
): AdminRoomTier | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

export default async function AdminRoomsPage() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    redirect(
      auth.status === 403 ? adminLoginPath('forbidden') : adminLoginPath()
    );
  }

  const { supabase } = auth;

  const { data: events, error } = await supabase
    .from('events')
    .select(`
      id, title, date, status, client_name,
      reveal_scheduled_at, revealed_at, created_at, join_code,
      package_tiers ( name, per_guest_limit, max_total_photos )
    `)
    .order('date', { ascending: false });

  if (error) {
    return (
      <p className="rounded-[14px] border border-[rgba(255,92,92,0.25)] bg-[rgba(255,92,92,0.08)] px-4 py-3 text-[color:var(--color-moment-danger)]">
        Failed to load rooms: {error.message}
      </p>
    );
  }

  const rows = (events ?? []) as unknown as EventListRow[];

  const rooms: AdminRoomCardData[] = await Promise.all(
    rows.map(async (event) => {
      const [{ count: photoCount }, joinUrl, qrDataUrl] = await Promise.all([
        supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id),
        Promise.resolve(buildJoinUrl(event.id, event.join_code)),
        generateQrDataUrl(buildJoinUrl(event.id, event.join_code), 400),
      ]);

      return {
        id: event.id,
        title: event.title,
        date: event.date,
        status: event.status,
        client_name: event.client_name,
        reveal_scheduled_at: event.reveal_scheduled_at,
        revealed_at: event.revealed_at,
        created_at: event.created_at,
        join_code: event.join_code,
        tier: normalizeTier(event.package_tiers),
        joinUrl,
        qrDataUrl,
        photoCount: photoCount ?? 0,
      };
    })
  );

  return (
    <div className="relative min-h-full bg-[#09090b]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 animate-pulse bg-[radial-gradient(ellipse_at_20%_0%,rgba(201,169,110,0.04),transparent_65%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-2">
        <Breadcrumb
          items={[
            { label: 'Momenti Im', href: '/admin/rooms' },
            { label: 'Rooms' },
          ]}
        />

        <header className="mb-12 flex flex-col gap-8 border-b border-neutral-900/80 pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A96E]/60">
              Control center
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Event command hub
            </h1>
            <p className="mt-4 text-sm leading-relaxed tracking-wide text-neutral-400">
              Premium disposable camera rooms for weddings, concerts, and private
              gatherings.
            </p>
          </div>
          <Link
            href="/admin/rooms/new"
            className="group relative inline-flex shrink-0 items-center justify-center gap-2.5 overflow-hidden rounded-[14px] border border-amber-500/40 bg-neutral-950/50 px-7 py-3.5 backdrop-blur-md motion-safe hover:border-amber-500/55"
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/15 to-amber-500/0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-hover:animate-pulse" />
            <Plus className="relative h-4 w-4 text-[#F5E9D3]" />
            <span className="relative text-sm font-bold uppercase tracking-[0.16em] text-[#F5E9D3]">
              Create room
            </span>
          </Link>
        </header>

        <RoomsGrid rooms={rooms} />
      </div>
    </div>
  );
}
