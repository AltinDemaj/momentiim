export interface PackageTierOption {
  id: string;
  name: string;
  max_total_photos: number;
  per_guest_limit: number;
}

export interface TierDisplayMeta {
  tagline: string;
  features: string[];
  accent: 'starter' | 'premium' | 'vip';
}

const TIER_META: Record<string, Omit<TierDisplayMeta, 'features'> & { featureTemplate: (t: PackageTierOption) => string[] }> = {
  Starter: {
    tagline: 'Intimate gatherings & rehearsal dinners',
    accent: 'starter',
    featureTemplate: (t) => [
      `${t.per_guest_limit} shots per guest`,
      `${t.max_total_photos} photos total cap`,
      'Standard reveal window',
      'QR table tent included',
    ],
  },
  Premium: {
    tagline: 'Full wedding weekends & celebrations',
    accent: 'premium',
    featureTemplate: (t) => [
      `${t.per_guest_limit} shots per guest`,
      `${t.max_total_photos} photos total cap`,
      'Priority album delivery',
      'Guest video capture enabled',
    ],
  },
  VIP: {
    tagline: 'Large-scale events & luxury productions',
    accent: 'vip',
    featureTemplate: (t) => [
      `${t.per_guest_limit} shots per guest`,
      `${t.max_total_photos} photos total cap`,
      'White-glove studio workflow',
      'Unlimited guest challenges',
    ],
  },
};

export function resolveTierDisplay(tier: PackageTierOption): TierDisplayMeta {
  const meta = TIER_META[tier.name] ?? {
    tagline: 'Custom event package',
    accent: 'starter' as const,
    featureTemplate: (t: PackageTierOption) => [
      `${t.per_guest_limit} shots per guest`,
      `${t.max_total_photos} photos total cap`,
    ],
  };

  return {
    tagline: meta.tagline,
    accent: meta.accent,
    features: meta.featureTemplate(tier),
  };
}

export interface CreateRoomFormState {
  title: string;
  clientName: string;
  eventDate: string;
  eventTime: string;
  revealDate: string;
  revealTime: string;
  packageTierId: string;
}

export function combineDateTime(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDefaultEventDateTime(): { date: string; time: string } {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  const date = d.toISOString().slice(0, 10);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { date, time };
}

export function getRevealBannerText(
  eventAt: Date | null,
  revealAt: Date | null
): string {
  if (revealAt) {
    const formatter = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    return `✨ Unlocking ${formatter.format(revealAt)}`;
  }

  if (eventAt) {
    const defaultReveal = new Date(eventAt.getTime() + 24 * 60 * 60 * 1000);
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    const hoursUntil = Math.round(
      (defaultReveal.getTime() - Date.now()) / 3_600_000
    );
    if (hoursUntil > 0 && hoursUntil < 48) {
      return `✨ Unlocking precisely ${formatter.format(hoursUntil, 'hour')} after launch`;
    }
  }

  return '✨ Unlocking precisely 24 hours after launch';
}
