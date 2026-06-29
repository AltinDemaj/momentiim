import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Breadcrumb, Card } from '@/components/ui/admin-ui';

export default async function AdminHomePage() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    redirect('/admin/login');
  }

  const { supabase } = auth;

  const { data: events, error } = await supabase
    .from('events')
    .select(`
      id, title, date, status, client_name,
      reveal_scheduled_at, revealed_at, created_at,
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

  type AdminEventRow = {
    id: string;
    title: string;
    date: string;
    status: string;
    client_name: string | null;
    reveal_scheduled_at: string | null;
    revealed_at: string | null;
    created_at: string;
    package_tiers: {
      name: string;
      per_guest_limit: number;
      max_total_photos: number;
    } | null;
  };

  const eventRows = (events ?? []) as unknown as AdminEventRow[];

  return (
    <>
      <Breadcrumb items={[{ label: 'Momenti Im', href: '/admin' }, { label: 'Rooms' }]} />

      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient">Rooms</h1>
          <p className="mt-3 max-w-2xl text-sm text-[color:var(--color-moment-text-secondary)]">
            Premium disposable camera rooms for weddings, concerts, and private gatherings.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[color:var(--color-moment-accent)] px-6 py-2.5 text-sm font-semibold text-[color:var(--color-moment-bg)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] motion-safe hover:-translate-y-px hover:brightness-105"
        >
          <Plus className="h-4 w-4" />
          Create room
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        {(eventRows).length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="text-[color:var(--color-moment-text-secondary)]">No rooms yet.</p>
            <p className="mt-2 text-sm text-[color:var(--color-moment-muted)]">
              Create one and print a table sign for your guests.
            </p>
            <Link
              href="/admin/events/new"
              className="mt-8 inline-flex items-center justify-center rounded-[14px] bg-[color:var(--color-moment-accent)] px-6 py-2.5 text-sm font-semibold text-[color:var(--color-moment-bg)]"
            >
              Create your first room
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-moment-border)] bg-[color:var(--color-moment-card)] text-left text-[11px] uppercase tracking-[0.12em] text-[color:var(--color-moment-muted)]">
                  <th className="px-6 py-4 font-semibold">Room</th>
                  <th className="px-6 py-4 font-semibold">For</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Reveal</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {eventRows.map((event) => {
                  const tierRaw = event.package_tiers as AdminEventRow['package_tiers'] | AdminEventRow['package_tiers'][];
                  const tier = Array.isArray(tierRaw) ? tierRaw[0] ?? null : tierRaw;

                  return (
                    <tr
                      key={event.id}
                      className="border-b border-[color:var(--color-moment-border)] motion-safe last:border-0 hover:bg-[rgba(255,255,255,0.03)]"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="font-semibold text-[color:var(--color-moment-text)] motion-safe hover:text-[color:var(--color-moment-accent)]"
                        >
                          {event.title}
                        </Link>
                        {tier && (
                          <p className="mt-0.5 text-xs text-[color:var(--color-moment-muted)]">
                            {tier.name} · {tier.per_guest_limit}/guest · {tier.max_total_photos} max
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[color:var(--color-moment-text-secondary)]">
                        {event.client_name ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-[color:var(--color-moment-text-secondary)]">
                        {new Date(event.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-[color:var(--color-moment-text-secondary)]">
                        {event.revealed_at
                          ? `Live ${new Date(event.revealed_at).toLocaleDateString()}`
                          : event.reveal_scheduled_at
                            ? new Date(event.reveal_scheduled_at).toLocaleDateString()
                            : 'TBD'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            event.status === 'active'
                              ? 'border border-[rgba(83,215,105,0.3)] bg-[rgba(83,215,105,0.1)] text-[color:var(--color-moment-success)]'
                              : 'border border-[color:var(--color-moment-border)] bg-[color:var(--color-moment-card)] text-[color:var(--color-moment-muted)]'
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
