'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Aperture,
  Calendar,
  Clock,
  ScanLine,
  Settings2,
  User,
} from 'lucide-react';
import type { AdminRoomCardData } from '@/lib/admin/room-types';
import {
  formatRoomCreatedDate,
  formatRoomEventDate,
  formatRoomRevealLabel,
} from '@/lib/admin/format-room-meta';
import { RoomQrModal } from './RoomQrModal';

function statusAura(status: string): { rgb: string; pulse: boolean } {
  if (status === 'active') {
    return { rgb: '52, 211, 153', pulse: true };
  }
  if (status === 'completed') {
    return { rgb: '100, 116, 139', pulse: false };
  }
  return { rgb: '201, 169, 110', pulse: false };
}

function RoomStatusBadge({ status }: { status: string }) {
  const isActive = status === 'active';

  if (isActive) {
    return (
      <span className="relative inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.12)]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Active
      </span>
    );
  }

  const label = status === 'completed' ? 'Archived' : status;
  const tone =
    status === 'completed'
      ? 'border-neutral-600/40 bg-neutral-800/30 text-neutral-400'
      : 'border-amber-500/25 bg-amber-500/5 text-amber-200/80';

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${tone}`}
    >
      {label}
    </span>
  );
}

function PhotoCapacityMeter({
  uploaded,
  max,
}: {
  uploaded: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, (uploaded / max) * 100) : 0;

  return (
    <div className="rounded-[12px] border border-neutral-800/50 bg-neutral-950/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-600">
          Live capacity
        </p>
        <p className="font-mono text-[11px] tracking-wide text-neutral-400">
          {uploaded} / {max}
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-800 via-[#C9A96E] to-amber-200 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-[10px] tracking-wide text-neutral-600">
        photos uploaded
      </p>
    </div>
  );
}

export function RoomCard({ room }: { room: AdminRoomCardData }) {
  const [qrOpen, setQrOpen] = useState(false);
  const reveal = formatRoomRevealLabel(room.revealed_at, room.reveal_scheduled_at);
  const aura = statusAura(room.status);
  const maxPhotos = room.tier?.max_total_photos ?? 500;

  return (
    <>
      <article className="group relative transition-all duration-500 hover:-translate-y-2">
        <div
          className={`pointer-events-none absolute -inset-3 rounded-[26px] blur-2xl transition-opacity duration-500 group-hover:opacity-100 ${aura.pulse ? 'animate-pulse opacity-70' : 'opacity-50'}`}
          style={{
            background: `radial-gradient(ellipse at 50% 40%, rgba(${aura.rgb}, 0.18), transparent 72%)`,
          }}
        />

        <div className="relative overflow-hidden rounded-[20px] border border-neutral-800/60 bg-[#121215]/80 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-500 group-hover:border-neutral-700/80 group-hover:shadow-[0_20px_40px_rgba(217,119,6,0.03)]">
          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-semibold tracking-tight text-white">
                  {room.title}
                </h2>
                {room.client_name && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-500">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{room.client_name}</span>
                  </p>
                )}
                {room.tier && (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[#C9A96E]/70">
                    {room.tier.name} tier · {room.tier.per_guest_limit}/guest
                  </p>
                )}
              </div>
              <RoomStatusBadge status={room.status} />
            </div>

            <div className="mt-6 space-y-4">
              <PhotoCapacityMeter uploaded={room.photoCount} max={maxPhotos} />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-800/60 bg-neutral-900/50 px-2.5 py-1 font-mono text-[11px] text-neutral-400">
                  <Calendar className="h-3 w-3 shrink-0 text-neutral-600" />
                  {formatRoomEventDate(room.date)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-800/60 bg-neutral-900/50 px-2.5 py-1 font-mono text-[11px] text-neutral-400">
                  <Clock className="h-3 w-3 shrink-0 text-neutral-600" />
                  Created {formatRoomCreatedDate(room.created_at)}
                </span>
              </div>

              <span
                className={`inline-flex w-full items-center justify-center rounded-md border px-2.5 py-1.5 font-mono text-[11px] ${
                  reveal.tone === 'live'
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300/90'
                    : reveal.tone === 'scheduled'
                      ? 'border-amber-500/20 bg-amber-500/5 text-amber-200/80'
                      : 'border-neutral-800/60 bg-neutral-900/50 text-neutral-500'
                }`}
              >
                {reveal.label}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-neutral-900/80 bg-neutral-950/30 p-4 sm:flex-row">
            <Link
              href={`/admin/events/${room.id}/studio`}
              className="group/btn inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-neutral-900/30 px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-300 motion-safe hover:bg-neutral-800/80"
            >
              <Aperture className="h-3.5 w-3.5 text-neutral-500 transition-transform group-hover/btn:scale-110 group-hover/btn:text-[#C9A96E]/80" />
              View Gallery
            </Link>
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              className="group/btn inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-neutral-900/30 px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-300 motion-safe hover:bg-neutral-800/80"
            >
              <ScanLine className="h-3.5 w-3.5 text-neutral-500 transition-transform group-hover/btn:scale-110 group-hover/btn:text-[#C9A96E]/80" />
              Get QR Code
            </button>
            <Link
              href={`/admin/events/${room.id}`}
              className="group/btn inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-neutral-900/30 px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-300 motion-safe hover:bg-neutral-800/80"
            >
              <Settings2 className="h-3.5 w-3.5 text-neutral-500 transition-transform group-hover/btn:scale-110 group-hover/btn:text-[#C9A96E]/80" />
              Settings
            </Link>
          </div>
        </div>
      </article>

      {qrOpen && <RoomQrModal room={room} onClose={() => setQrOpen(false)} />}
    </>
  );
}
