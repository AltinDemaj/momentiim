'use client';

import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import type { PackageTierOption } from '@/lib/admin/create-room';
import { getRevealBannerText } from '@/lib/admin/create-room';

interface LiveTableTentPreviewProps {
  title: string;
  clientName: string;
  tier: PackageTierOption | null;
  eventAt: Date | null;
  revealAt: Date | null;
}

function QrPlaceholder() {
  const cells = Array.from({ length: 49 }, (_, i) => {
    const row = Math.floor(i / 7);
    const col = i % 7;
    const on =
      (row + col) % 3 === 0 ||
      row === 0 ||
      col === 0 ||
      row === 6 ||
      col === 6 ||
      (row > 1 && row < 5 && col > 1 && col < 5 && (row + col) % 2 === 0);
    return on;
  });

  return (
    <div className="relative mx-auto w-[168px]">
      <div className="absolute -inset-1 rounded-[18px] bg-[conic-gradient(from_0deg,transparent,rgba(201,169,110,0.6),transparent,rgba(201,169,110,0.35),transparent)] opacity-80 blur-[2px] animate-[spin_8s_linear_infinite]" />
      <div className="relative rounded-[16px] border border-[#C9A96E]/40 bg-white p-3 shadow-[0_0_40px_rgba(201,169,110,0.15)]">
        <div className="grid grid-cols-7 gap-[3px]">
          {cells.map((on, i) => (
            <div
              key={i}
              className={`aspect-square rounded-[1px] ${on ? 'bg-neutral-900' : 'bg-white'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ViewfinderCorners() {
  const corner =
    'absolute h-8 w-8 border-[#C9A96E]/50';
  return (
    <>
      <span className={`${corner} left-4 top-4 border-l-2 border-t-2`} />
      <span className={`${corner} right-4 top-4 border-r-2 border-t-2`} />
      <span className={`${corner} bottom-4 left-4 border-b-2 border-l-2`} />
      <span className={`${corner} bottom-4 right-4 border-b-2 border-r-2`} />
    </>
  );
}

export function LiveTableTentPreview({
  title,
  clientName,
  tier,
  eventAt,
  revealAt,
}: LiveTableTentPreviewProps) {
  const displayTitle = title.trim() || 'Your Event Name';
  const revealText = getRevealBannerText(eventAt, revealAt);

  return (
    <div className="sticky top-8">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A96E]/60">
        Live generation canvas
      </p>

      <div className="relative overflow-hidden rounded-[24px] border border-neutral-800/80 bg-neutral-900/40 p-1 shadow-[0_32px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,169,110,0.12),transparent_55%)]" />

        <div className="relative rounded-[22px] border border-white/[0.06] bg-neutral-950/80 px-8 py-10">
          <ViewfinderCorners />

          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A96E]/30 bg-[#C9A96E]/10">
              <Camera className="h-4 w-4 text-[#C9A96E]" strokeWidth={1.5} />
            </div>

            <motion.p
              key={displayTitle}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="max-w-[240px] text-2xl font-semibold leading-tight tracking-tight text-white"
            >
              {displayTitle}
            </motion.p>

            {clientName.trim() && (
              <motion.p
                key={clientName}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-sm text-neutral-400"
              >
                For {clientName.trim()}
              </motion.p>
            )}

            <div className="my-8">
              <QrPlaceholder />
            </div>

            <p className="font-mono text-[10px] tracking-[0.35em] text-neutral-500">
              SCAN · SNAP · DEVELOP
            </p>

            {tier && (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 rounded-full border border-neutral-800 bg-neutral-900/80 px-4 py-1.5 text-xs text-neutral-400"
              >
                {tier.name} · {tier.per_guest_limit}/guest · {tier.max_total_photos} max
              </motion.div>
            )}

            <motion.div
              key={revealText}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 w-full rounded-[12px] border border-[#C9A96E]/20 bg-[#C9A96E]/5 px-4 py-3 text-xs leading-relaxed text-[#C9A96E]/90"
            >
              {revealText}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
