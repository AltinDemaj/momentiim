'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Rocket, Sparkles, User } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/admin-ui';
import {
  combineDateTime,
  getDefaultEventDateTime,
  resolveTierDisplay,
  type PackageTierOption,
} from '@/lib/admin/create-room';
import { LiveTableTentPreview } from './LiveTableTentPreview';

function LuxuryField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
        <Icon className="h-3.5 w-3.5 text-[#C9A96E]/70" />
        {label}
      </label>
      <div className="rounded-[14px] border border-neutral-800/80 bg-neutral-900/50 p-[1px] transition-shadow focus-within:shadow-[0_0_0_1px_rgba(245,158,11,0.3),0_0_24px_rgba(201,169,110,0.12)] focus-within:ring-1 focus-within:ring-amber-500/30">
        {children}
      </div>
    </div>
  );
}

function luxuryInputClassName() {
  return 'w-full rounded-[13px] border-0 bg-transparent px-4 py-3.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-0';
}

function PackageTierCards({
  tiers,
  selectedId,
  onSelect,
}: {
  tiers: PackageTierOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {tiers.map((tier) => {
        const meta = resolveTierDisplay(tier);
        const selected = tier.id === selectedId;
        return (
          <motion.button
            key={tier.id}
            type="button"
            initial={false}
            onClick={() => onSelect(tier.id)}
            className={`group relative w-full rounded-[16px] border p-5 text-left transition-all duration-300 ${
              selected
                ? 'border-[#C9A96E]/50 bg-[#C9A96E]/[0.07] shadow-[0_0_32px_rgba(201,169,110,0.12)]'
                : 'border-neutral-800/80 bg-neutral-900/40 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">{tier.name}</p>
                <p className="mt-1 text-xs text-neutral-500">{meta.tagline}</p>
              </div>
              <span
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  selected
                    ? 'border-[#C9A96E] bg-[#C9A96E]'
                    : 'border-neutral-700 bg-transparent'
                }`}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-neutral-950" />}
              </span>
            </div>
            <ul className="mt-4 space-y-1.5">
              {meta.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-xs leading-relaxed text-neutral-400"
                >
                  <Sparkles className="h-3 w-3 shrink-0 text-[#C9A96E]/50" />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.button>
        );
      })}
    </div>
  );
}

export function CreateRoomExperience() {
  const router = useRouter();
  const defaults = getDefaultEventDateTime();

  const [tiers, setTiers] = useState<PackageTierOption[]>([]);
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState(defaults.date);
  const [eventTime, setEventTime] = useState(defaults.time);
  const [revealDate, setRevealDate] = useState('');
  const [revealTime, setRevealTime] = useState('');
  const [packageTierId, setPackageTierId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glow, setGlow] = useState({ x: 50, y: 30 });

  useEffect(() => {
    fetch('/api/admin/tiers')
      .then((r) => r.json())
      .then((data) => {
        const list = (data.tiers ?? []) as PackageTierOption[];
        setTiers(list);
        if (list[0]) setPackageTierId(list[0].id);
      })
      .catch(() => setError('Failed to load package tiers'));
  }, []);

  const eventAt = useMemo(
    () => combineDateTime(eventDate, eventTime),
    [eventDate, eventTime]
  );
  const revealAt = useMemo(() => {
    if (!revealDate || !revealTime) return null;
    return combineDateTime(revealDate, revealTime);
  }, [revealDate, revealTime]);

  const selectedTier = tiers.find((t) => t.id === packageTierId) ?? null;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!eventAt || !packageTierId) return;

    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      client_name: clientName.trim() || undefined,
      date: eventAt.toISOString(),
      package_tier_id: packageTierId,
      reveal_scheduled_at: revealAt?.toISOString(),
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

    await new Promise((r) => setTimeout(r, 600));
    router.push('/admin/rooms');
  }

  return (
    <div
      className="relative min-h-[calc(100vh-8rem)] bg-neutral-950"
      onMouseMove={handleMouseMove}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-[background] duration-700 ease-out"
        style={{
          background: `radial-gradient(600px circle at ${glow.x}% ${glow.y}%, rgba(201,169,110,0.08), transparent 45%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,110,0.04),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-4">
        <Breadcrumb
          items={[
            { label: 'Momenti Im', href: '/admin/rooms' },
            { label: 'Rooms', href: '/admin/rooms' },
            { label: 'New room' },
          ]}
        />

        <header className="mb-10 max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C9A96E]/70">
            Room generation
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Create room
          </h1>
          <p className="mt-4 text-base leading-relaxed text-neutral-400">
            Guests scan the unique QR code to join this room and begin uploading photos.
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-12 pt-4 lg:grid-cols-12">
          <form onSubmit={handleSubmit} className="space-y-8 lg:col-span-6">
            <LuxuryField label="Room name" icon={Sparkles}>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sarah & James Wedding"
                className={luxuryInputClassName()}
              />
            </LuxuryField>

            <LuxuryField label="For (host / client)" icon={User}>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Who is this room for?"
                className={luxuryInputClassName()}
              />
            </LuxuryField>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <LuxuryField label="Event date" icon={Calendar}>
                <input
                  required
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={`${luxuryInputClassName()} [color-scheme:dark]`}
                />
              </LuxuryField>
              <LuxuryField label="Event time" icon={Clock}>
                <input
                  required
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className={`${luxuryInputClassName()} [color-scheme:dark]`}
                />
              </LuxuryField>
            </div>

            <div>
              <LuxuryField label="Reveal to guests (optional)" icon={Clock}>
                <div className="grid grid-cols-2 gap-0 divide-x divide-neutral-800/80">
                  <input
                    type="date"
                    value={revealDate}
                    onChange={(e) => setRevealDate(e.target.value)}
                    className={`${luxuryInputClassName()} rounded-r-none [color-scheme:dark]`}
                  />
                  <input
                    type="time"
                    value={revealTime}
                    onChange={(e) => setRevealTime(e.target.value)}
                    className={`${luxuryInputClassName()} rounded-l-none [color-scheme:dark]`}
                  />
                </div>
              </LuxuryField>
              <p className="mt-2 pl-1 text-xs leading-relaxed text-neutral-600">
                Defaults to +24h after event if left empty
              </p>
            </div>

            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                <Sparkles className="h-3.5 w-3.5 text-[#C9A96E]/70" />
                Photo limits & package
              </p>
              {tiers.length > 0 ? (
                <PackageTierCards
                  tiers={tiers}
                  selectedId={packageTierId}
                  onSelect={setPackageTierId}
                />
              ) : (
                <p className="text-sm text-neutral-500">Loading packages…</p>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0 }}
                  className="rounded-[12px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading || tiers.length === 0}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="group relative w-full overflow-hidden rounded-[16px] bg-[#F5E9D3] px-6 py-4 text-sm font-bold tracking-wide text-neutral-950 disabled:opacity-50 sm:w-auto sm:min-w-[280px]"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-hover:animate-shimmer" />
              <span className="relative flex items-center justify-center gap-2.5">
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-950/20 border-t-[#C9A96E]" />
                    Launching room…
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Create room & generate QR
                  </>
                )}
              </span>
            </motion.button>

            <Link
              href="/admin/rooms"
              className="inline-block text-xs text-neutral-600 hover:text-neutral-400"
            >
              ← Back to rooms
            </Link>
          </form>

          <div className="lg:col-span-6">
            <LiveTableTentPreview
              title={title}
              clientName={clientName}
              tier={selectedTier}
              eventAt={eventAt}
              revealAt={revealAt}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
