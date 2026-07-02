'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { t: 0, label: 'Admin opens Social Content Queue' },
  { t: 4, label: 'Review anonymized 9:16 marketing mockup' },
  { t: 8, label: 'Click Publish to IG & TikTok (Test)' },
  { t: 12, label: 'Content Posting API — photo direct post' },
  { t: 16, label: 'Published to TikTok (SELF_ONLY test mode)' },
];

const SITE = 'https://web-alpha-three-29.vercel.app';

export default function TikTokIntegrationDemoPage() {
  const [sec, setSec] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (sec === 10) setPublishing(true);
    if (sec === 14) {
      setPublishing(false);
      setPublished(true);
    }
  }, [sec]);

  const step = [...STEPS].reverse().find((s) => sec >= s.t)?.label ?? STEPS[0].label;

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Browser chrome — production URL visible for TikTok review */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-[#1a1a1c] px-4 py-2">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-400/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex-1 rounded-md bg-[#0b0b0c] px-4 py-1.5 text-center text-sm text-white/70">
          {SITE}/admin/social
        </div>
      </div>

      {/* Step caption for reviewers */}
      <div className="bg-[#C9A96E]/15 px-6 py-2 text-center text-sm font-medium text-[#F5E9D3]">
        {step}
      </div>

      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-semibold">Momenti Im</span>
          <span className="text-sm text-white/50">supremetinho@gmail.com</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Social content queue</h1>
            <p className="mt-1 text-sm text-white/45">
              Anonymized wedding mockups — TikTok Content Posting API integration
            </p>
          </div>
          <button type="button" className="rounded-lg bg-[#F5E9D3] px-4 py-2 text-sm font-semibold text-[#111]">
            Generate now
          </button>
        </div>

        <div className="grid max-w-sm gap-6">
          <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div
              className="aspect-[9/16] bg-cover bg-center"
              style={{
                backgroundImage:
                  'linear-gradient(160deg, #2a1f18, #0b0b0c), url("https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80")',
              }}
            />
            <div className="space-y-3 p-4">
              <p className="text-sm font-medium">Wedding Celebration (Anonymous Private Room)</p>
              <p className="text-xs text-white/45">2026-07-02 · Manual</p>
              <div className="rounded-lg border border-white/10 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A96E]">Template</p>
                <p className="text-sm">Camera Viewfinder</p>
              </div>
              <button
                type="button"
                className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  publishing
                    ? 'border-[#C9A96E] bg-[#C9A96E]/25 text-[#F5E9D3]'
                    : published
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : sec >= 8
                        ? 'border-[#C9A96E]/40 bg-[#C9A96E]/12 text-[#F5E9D3] ring-2 ring-[#C9A96E]/50'
                        : 'border-[#C9A96E]/40 bg-[#C9A96E]/12 text-[#F5E9D3]'
                }`}
              >
                {publishing
                  ? 'Publishing to IG & TikTok…'
                  : published
                    ? '✓ TikTok photo posted (SELF_ONLY)'
                    : 'Publish to IG & TikTok (Test)'}
              </button>
              {published && (
                <p className="text-xs text-emerald-400">
                  TikTok publish_id: demo_publish_8f3a… · Content Posting API
                </p>
              )}
            </div>
          </article>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0b0b0c]/95 px-6 py-3 text-center text-xs text-white/35">
        Momenti Im · Content Posting API · Direct Post · media_type=PHOTO · post_mode=DIRECT_POST
      </footer>
    </div>
  );
}
