'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface PublishConfig {
  instagram: boolean;
  tiktok: boolean;
  publicUrl: boolean;
  appUrl: string | null;
}

function StatusDot({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neutral-500"
      title={label}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {ok ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          </>
        ) : (
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
        )}
      </span>
      <span className="hidden text-neutral-400 sm:inline">{label}</span>
    </span>
  );
}

export function SocialPublishBanner() {
  const [config, setConfig] = useState<PublishConfig | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/admin/social/publish-config')
      .then((r) => r.json())
      .then((data: PublishConfig) => {
        setConfig(data);
        const ready = data.instagram && data.tiktok && data.publicUrl;
        setExpanded(!ready);
      })
      .catch(() => setConfig(null));
  }, []);

  if (!config) return null;

  const allReady = config.instagram && config.tiktok && config.publicUrl;

  return (
    <div className="rounded-[16px] border border-neutral-800/60 bg-neutral-900/40 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex flex-wrap items-center gap-5">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">
            {allReady ? 'Publish ready' : 'Publish setup'}
          </span>
          <div className="flex items-center gap-4">
            <StatusDot ok={config.publicUrl} label="Public URL" />
            <StatusDot ok={config.instagram} label="Instagram" />
            <StatusDot ok={config.tiktok} label="TikTok" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-neutral-600 motion-safe hover:text-neutral-300"
        >
          {expanded ? 'Hide details' : 'Show details'}
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {expanded && (
        <div className="space-y-2.5 border-t border-neutral-800/60 px-5 py-4 font-mono text-[11px] leading-relaxed text-neutral-500">
          <p className="flex items-start gap-2.5">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_0_6px_currentColor] ${config.publicUrl ? 'bg-emerald-400 text-emerald-400' : 'bg-amber-400 text-amber-400'}`}
            />
            <span>
              <span className="text-neutral-300">PUBLIC URL</span>
              {config.publicUrl && config.appUrl ? (
                <> — {config.appUrl}</>
              ) : (
                <> — SET NEXT_PUBLIC_APP_URL</>
              )}
            </span>
          </p>
          <p className="flex items-start gap-2.5">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${config.instagram ? 'bg-emerald-400' : 'bg-amber-400'}`}
            />
            <span>
              <span className="text-neutral-300">INSTAGRAM</span>
              {config.instagram ? <> — ONLINE</> : <> — INSTAGRAM_ACCESS_TOKEN REQUIRED</>}
            </span>
          </p>
          <p className="flex items-start gap-2.5">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${config.tiktok ? 'bg-emerald-400' : 'bg-amber-400'}`}
            />
            <span>
              <span className="text-neutral-300">TIKTOK</span>
              {config.tiktok ? (
                <> — SYNCED</>
              ) : (
                <>
                  {' '}
                  —{' '}
                  <Link href="/api/admin/tiktok/connect" className="text-[#C9A96E] hover:underline">
                    CONNECT TIKTOK
                  </Link>
                </>
              )}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
