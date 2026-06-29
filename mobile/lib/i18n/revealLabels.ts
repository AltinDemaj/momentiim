import type { TranslationKey } from './translations';

type TranslateFn = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

export function formatRevealLabelLocalized(
  revealedAt: string | null,
  revealScheduledAt: string | null,
  isPast: boolean,
  t: TranslateFn
): string {
  if (revealedAt) return t('memories.developedShort');
  if (!revealScheduledAt) return t('memories.developing');
  if (isPast) return t('home.revealReady');
  const d = new Date(revealScheduledAt);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return t('home.revealsTomorrow');
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return t('home.revealsOn', { date });
}
