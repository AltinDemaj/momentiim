'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useSocialProduction } from './SocialProductionHub';

interface SocialQueueClientProps {
  automatedCountToday: number;
}

export function SocialQueueClient({ automatedCountToday }: SocialQueueClientProps) {
  const router = useRouter();
  const { setRendering } = useSocialProduction();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generateNow() {
    setLoading(true);
    setRendering(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/social/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      if (data.skipped) {
        setMessage(data.reason ?? 'Skipped');
      } else {
        setMessage(`New variant: ${data.templateLabel ?? data.conceptLabel ?? 'draft'} created.`);
        router.refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
      setTimeout(() => setRendering(false), 800);
    }
  }

  const counterLabel =
    automatedCountToday === 0
      ? 'No cron draft yet today — manual generation is always available.'
      : `${automatedCountToday} cron draft${automatedCountToday === 1 ? '' : 's'} today.`;

  return (
    <div className="flex shrink-0 flex-col items-end gap-3">
      <button
        type="button"
        onClick={generateNow}
        disabled={loading}
        className="group relative overflow-hidden rounded-[14px] border border-amber-500/30 bg-[#09090b] px-8 py-3.5 disabled:opacity-50"
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-hover:animate-pulse" />
        <span className="relative flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.18em] text-[#F5E9D3]">
          <Sparkles className={`h-4 w-4 text-amber-400/80 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Engine running…' : 'Generate now'}
        </span>
      </button>
      <p className="max-w-[220px] text-right text-[10px] leading-relaxed tracking-wide text-neutral-600">
        {counterLabel}
      </p>
      {message && (
        <p className="max-w-[220px] text-right text-[10px] tracking-wide text-[#C9A96E]/90">
          {message}
        </p>
      )}
    </div>
  );
}
