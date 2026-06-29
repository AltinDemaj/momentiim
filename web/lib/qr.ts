import QRCode from 'qrcode';
import type { Event, PackageTier } from '@/types/database';

const APP_SCHEME = process.env.NEXT_PUBLIC_APP_SCHEME ?? 'momentiim';

export function buildDeepLink(eventId: string): string {
  return `${APP_SCHEME}://event/${eventId}`;
}

/** HTTPS join URL — uses short code when available */
export function buildJoinUrl(eventId: string, joinCode?: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const slug = joinCode ?? eventId;
  return `${base.replace(/\/$/, '')}/join/${slug}`;
}

/** Expo Go dev link — only works when phone + PC on same Wi‑Fi */
export function buildExpoGoLink(eventId: string): string | null {
  const host = process.env.NEXT_PUBLIC_EXPO_DEV_HOST;
  if (!host) return null;
  const port = process.env.NEXT_PUBLIC_EXPO_DEV_PORT ?? '8081';
  return `exp://${host}:${port}/--/event/${eventId}`;
}

export async function generateQrDataUrl(content: string, width = 512): Promise<string> {
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}

export function buildQrMockupReference(
  event: Event,
  tier: PackageTier,
  qrDataUrl: string,
  joinUrl: string
) {
  return {
    deep_link: event.deep_link ?? buildDeepLink(event.id),
    join_url: joinUrl,
    qr_data_url: qrDataUrl,
    print_url: null as string | null,
    metadata: {
      event_title: event.title,
      event_date: event.date,
      tier_name: tier.name,
      per_guest_limit: tier.per_guest_limit,
      max_total_photos: tier.max_total_photos,
      suggested_print_size: '4x4in',
      scan_instructions: 'Guests scan the QR code to open the join page and enter the room.',
    },
  };
}
