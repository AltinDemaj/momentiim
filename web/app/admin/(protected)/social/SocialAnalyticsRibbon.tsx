'use client';

interface SocialAnalyticsRibbonProps {
  automatedCountToday: number;
  mockupsThisWeek: number;
  tiktokConfigured: boolean;
  instagramConfigured: boolean;
}

export function SocialAnalyticsRibbon({
  automatedCountToday,
  mockupsThisWeek,
  tiktokConfigured,
  instagramConfigured,
}: SocialAnalyticsRibbonProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-[12px] border border-neutral-800/50 bg-neutral-950/30 px-4 py-3 backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
          TikTok Sync
        </p>
        <p className="mt-1.5 text-xs font-medium tracking-wide text-neutral-400">
          Queue Status:{' '}
          <span className={tiktokConfigured ? 'text-emerald-400/90' : 'text-amber-400/90'}>
            {tiktokConfigured ? 'Synced' : 'Pending auth'}
          </span>
          <span className="text-neutral-600"> · </span>
          Automations active at 09:00
          {automatedCountToday > 0 && (
            <span className="text-neutral-600">
              {' '}
              · {automatedCountToday} today
            </span>
          )}
        </p>
      </div>
      <div className="rounded-[12px] border border-neutral-800/50 bg-neutral-950/30 px-4 py-3 backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
          Instagram Feed
        </p>
        <p className="mt-1.5 text-xs font-medium tracking-wide text-neutral-400">
          API Gateway:{' '}
          <span className={instagramConfigured ? 'text-emerald-400/90' : 'text-amber-400/90'}>
            {instagramConfigured ? 'Online' : 'Offline'}
          </span>
          <span className="text-neutral-600"> · </span>
          {mockupsThisWeek} mockup{mockupsThisWeek === 1 ? '' : 's'} generated this week
        </p>
      </div>
    </div>
  );
}
