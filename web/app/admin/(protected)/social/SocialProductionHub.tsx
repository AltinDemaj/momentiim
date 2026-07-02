'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SocialPublishBanner } from './SocialPublishBanner';
import { SocialAnalyticsRibbon } from './SocialAnalyticsRibbon';
import { SocialQueueClient } from './SocialQueueClient';
import { SocialDraftCard, type SocialDraftCardData } from './SocialDraftCard';

interface SocialProductionContextValue {
  isRendering: boolean;
  setRendering: (v: boolean) => void;
}

const SocialProductionContext = createContext<SocialProductionContextValue>({
  isRendering: false,
  setRendering: () => {},
});

export function useSocialProduction() {
  return useContext(SocialProductionContext);
}

interface SocialProductionHubProps {
  drafts: SocialDraftCardData[];
  automatedCountToday: number;
  mockupsThisWeek: number;
}

export function SocialProductionHub({
  drafts,
  automatedCountToday,
  mockupsThisWeek,
}: SocialProductionHubProps) {
  const [isRendering, setRendering] = useState(false);
  const [publishFlags, setPublishFlags] = useState({
    instagram: false,
    tiktok: false,
  });

  useEffect(() => {
    fetch('/api/admin/social/publish-config')
      .then((r) => r.json())
      .then((data) =>
        setPublishFlags({
          instagram: !!data.instagram,
          tiktok: !!data.tiktok,
        })
      )
      .catch(() => {});
  }, []);

  return (
    <SocialProductionContext.Provider value={{ isRendering, setRendering }}>
      <div className="relative min-h-full bg-[#09090b]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 animate-pulse bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,169,110,0.04),transparent_70%)]" />

        <div className="relative mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-2">
          <SocialPublishBanner />

          <header className="flex flex-wrap items-end justify-between gap-8 border-b border-neutral-900/80 pb-10">
            <div className="max-w-2xl space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
                  Media production command center
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-[2.75rem] sm:leading-tight">
                  Social content queue
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-relaxed tracking-wide text-neutral-400">
                  Anonymized wedding mockups for TikTok & Instagram — cron runs daily at
                  09:00.
                </p>
              </div>
              <SocialAnalyticsRibbon
                automatedCountToday={automatedCountToday}
                mockupsThisWeek={mockupsThisWeek}
                tiktokConfigured={publishFlags.tiktok}
                instagramConfigured={publishFlags.instagram}
              />
            </div>
            <SocialQueueClient automatedCountToday={automatedCountToday} />
          </header>

          {drafts.length === 0 ? (
            <div className="rounded-[20px] border border-neutral-900 bg-[#111113]/80 p-16 text-center shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
              <p className="text-lg font-medium tracking-wide text-neutral-200">
                No campaigns in queue
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
                Cron creates one automated draft per day, or launch the engine to cycle
                variants manually.
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 gap-8 lg:grid-cols-3 ${isRendering ? 'pointer-events-none' : ''}`}
            >
              {drafts.map((draft, index) => (
                <motion.div
                  key={draft.id}
                  animate={
                    isRendering
                      ? {
                          opacity: [1, 0.35, 0.85, 0.4, 1],
                          y: [0, 4, 0, 6, 0],
                        }
                      : { opacity: 1, y: 0 }
                  }
                  transition={
                    isRendering
                      ? {
                          duration: 2.2,
                          repeat: Infinity,
                          delay: index * 0.18,
                          ease: 'easeInOut',
                        }
                      : { duration: 0.4 }
                  }
                >
                  <SocialDraftCard draft={draft} index={index} />
                </motion.div>
              ))}
            </div>
          )}

          {isRendering && (
            <div className="fixed inset-x-0 bottom-8 z-40 flex justify-center">
              <div className="rounded-full border border-amber-500/20 bg-neutral-950/90 px-5 py-2 text-xs tracking-[0.2em] text-amber-200/80 backdrop-blur-xl">
                RENDERING TIMELINE CASCADE…
              </div>
            </div>
          )}

          <p className="text-[11px] leading-relaxed tracking-wide text-neutral-600">
            Variants rotate: 4 headlines × 3 templates × 3 bullet sets · Publish test posts
            to Instagram Story + TikTok.{' '}
            <Link href="/admin/rooms" className="text-[#C9A96E]/80 hover:text-[#C9A96E]">
              Back to rooms
            </Link>
          </p>
        </div>
      </div>
    </SocialProductionContext.Provider>
  );
}
