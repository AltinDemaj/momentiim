'use client';

import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

interface JoinPageProps {
  eventId: string;
  eventTitle: string | null;
  joinCode: string;
  deepLink: string;
  expoGoLink: string | null;
}

export function JoinPageClient({
  eventTitle,
  joinCode,
  expoGoLink,
}: JoinPageProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (expoGoLink) {
      window.location.href = expoGoLink;
    }
  }, [expoGoLink]);

  async function copyCode() {
    await navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-moment-bg)] px-6 text-center">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,233,211,0.07),transparent_55%)]" />

      <div className="relative mb-8 flex h-16 w-16 items-center justify-center rounded-[18px] border border-[rgba(245,233,211,0.2)] bg-[color:var(--color-moment-accent-dim)]">
        <Camera className="h-8 w-8 text-[color:var(--color-moment-accent)]" strokeWidth={1.75} />
      </div>

      <h1 className="relative text-3xl font-extrabold text-[color:var(--color-moment-text)]">
        {eventTitle ?? 'Join room'}
      </h1>
      <p className="relative mt-2 text-sm text-[color:var(--color-moment-muted)]">
        Momenti Im · My moment
      </p>

      <p className="relative mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-moment-muted)]">
        Room code
      </p>
      <p className="relative mt-3 font-mono text-5xl font-bold tracking-[0.28em] text-[color:var(--color-moment-accent)]">
        {joinCode}
      </p>
      <button
        onClick={copyCode}
        className="relative mt-4 text-sm text-[color:var(--color-moment-muted)] motion-safe hover:text-[color:var(--color-moment-accent)]"
      >
        {copied ? 'Copied' : 'Copy code'}
      </button>

      <p className="relative mt-10 max-w-sm text-sm leading-relaxed text-[color:var(--color-moment-text-secondary)]">
        With the app installed, this link opens your room automatically. Without it, you&apos;ll
        be directed to install Momenti Im — coming soon on App Store and Play Store.
      </p>

      {expoGoLink && (
        <a
          href={expoGoLink}
          className="relative mt-8 rounded-[14px] bg-[color:var(--color-moment-accent)] px-8 py-4 text-sm font-semibold text-[color:var(--color-moment-bg)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] motion-safe hover:brightness-105"
        >
          Open in Expo Go
        </a>
      )}
    </div>
  );
}
