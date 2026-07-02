const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

export function formatRoomEventDate(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

export function formatRoomCreatedDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatRoomRevealLabel(
  revealedAt: string | null,
  revealScheduledAt: string | null
): { label: string; tone: 'live' | 'scheduled' | 'pending' } {
  if (revealedAt) {
    return {
      label: `Live since ${dateFmt.format(new Date(revealedAt))}`,
      tone: 'live',
    };
  }

  if (revealScheduledAt) {
    const scheduled = new Date(revealScheduledAt);
    const now = new Date();
    const diffMs = scheduled.getTime() - now.getTime();
    const dayMs = 86_400_000;

    if (diffMs > 0 && diffMs < dayMs * 2) {
      const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
      const hours = Math.round(diffMs / 3_600_000);
      if (hours < 24) {
        return {
          label: `Unlocks: ${relative.format(hours, 'hour')}`,
          tone: 'scheduled',
        };
      }
      return {
        label: `Unlocks: ${relative.format(1, 'day')}`,
        tone: 'scheduled',
      };
    }

    return {
      label: `Unlocks: ${dateTimeFmt.format(scheduled)}`,
      tone: 'scheduled',
    };
  }

  return { label: 'Reveal not scheduled', tone: 'pending' };
}

export function formatTierSummary(tier: {
  name: string;
  per_guest_limit: number;
  max_total_photos: number;
}): string {
  return `${tier.name} Tier · ${tier.per_guest_limit}/guest limit · ${tier.max_total_photos} photos max`;
}
