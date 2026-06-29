'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, QrCode } from 'lucide-react';
import {
  Breadcrumb,
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  Select,
} from '@/components/ui/admin-ui';

interface Tier {
  id: string;
  name: string;
  max_total_photos: number;
  per_guest_limit: number;
}

export default function NewRoomPage() {
  const router = useRouter();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/tiers')
      .then((r) => r.json())
      .then((data) => setTiers(data.tiers ?? []))
      .catch(() => setError('Failed to load package tiers'));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      title: form.get('title') as string,
      client_name: (form.get('client_name') as string) || undefined,
      date: new Date(form.get('date') as string).toISOString(),
      package_tier_id: form.get('package_tier_id') as string,
      reveal_scheduled_at: form.get('reveal_scheduled_at')
        ? new Date(form.get('reveal_scheduled_at') as string).toISOString()
        : undefined,
    };

    const res = await fetch('/api/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Failed to create room');
      setLoading(false);
      return;
    }

    router.push(`/admin/events/${data.event.id}`);
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Momentiim Admin', href: '/admin' },
          { label: 'Rooms', href: '/admin' },
          { label: 'New room' },
        ]}
      />

      <PageHeader
        title="Create room"
        description="Guests scan the unique QR code to join this room and begin uploading photos."
      />

      <div className="max-w-3xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Room name</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="e.g. Sarah & James Wedding"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="client_name">For (host / client)</Label>
                <Input
                  id="client_name"
                  name="client_name"
                  placeholder="Who is this room for?"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Event date & time</Label>
                <Input id="date" name="date" type="datetime-local" required />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="reveal_scheduled_at">
                  Reveal to guests (optional)
                </Label>
                <Input
                  id="reveal_scheduled_at"
                  name="reveal_scheduled_at"
                  type="datetime-local"
                />
                <p className="text-xs text-slate-500">Defaults to +24h after event</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="package_tier_id">Photo limits & package</Label>
              <Select
                id="package_tier_id"
                name="package_tier_id"
                required
                defaultValue={tiers[0]?.id}
              >
                {tiers.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name} — {tier.per_guest_limit} shots/guest,{' '}
                    {tier.max_total_photos} total
                  </option>
                ))}
              </Select>
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="border-t border-slate-800 pt-6">
              <Button type="submit" disabled={loading || tiers.length === 0}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Create room & generate QR
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
