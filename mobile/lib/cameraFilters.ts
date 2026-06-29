export type LensFilterId =
  | 'none'
  | 'classic'
  | 'golden'
  | 'noir'
  | 'rose'
  | 'film'
  | 'sparkle'
  | 'crown'
  | 'hearts'
  | 'party';

export type CelebrationType =
  | 'wedding'
  | 'engagement'
  | 'birthday'
  | 'anniversary'
  | 'party'
  | 'general';

export interface LensFilter {
  id: LensFilterId;
  label: string;
  emoji: string;
}

export const LENS_FILTERS: LensFilter[] = [
  { id: 'none', label: 'Normal', emoji: '○' },
  { id: 'classic', label: 'Gala', emoji: '✦' },
  { id: 'golden', label: 'Gold', emoji: '☀' },
  { id: 'noir', label: 'Noir', emoji: '◐' },
  { id: 'rose', label: 'Rose', emoji: '❀' },
  { id: 'film', label: 'Film', emoji: '▣' },
  { id: 'sparkle', label: 'Glow', emoji: '✨' },
  { id: 'crown', label: 'Royal', emoji: '👑' },
  { id: 'hearts', label: 'Love', emoji: '♥' },
  { id: 'party', label: 'Party', emoji: '🎉' },
];

export function inferCelebrationType(
  title: string,
  clientName: string | null
): CelebrationType {
  const text = `${title} ${clientName ?? ''}`.toLowerCase();
  if (text.includes('engagement') || text.includes('fejes') || text.includes('propozim')) {
    return 'engagement';
  }
  if (text.includes('wedding') || text.includes('dasma') || text.includes('dasem')) {
    return 'wedding';
  }
  if (text.includes('birthday') || text.includes('ditëlind')) return 'birthday';
  if (text.includes('anniversary')) return 'anniversary';
  if (text.includes('party') || text.includes('fest')) return 'party';
  return 'general';
}

export function getCongratsBanner(
  type: CelebrationType,
  clientName: string | null
): string | null {
  const name = clientName?.trim();
  if (!name) return null;

  switch (type) {
    case 'engagement':
      return `Congrats ${name} 💍`;
    case 'wedding':
      return `${name} — Forever Starts Today 💒`;
    case 'birthday':
      return `Happy Birthday ${name} 🎂`;
    case 'anniversary':
      return `Cheers to ${name} ✨`;
    case 'party':
      return `Let's celebrate ${name} 🎉`;
    default:
      return `Cheers ${name} ✨`;
  }
}

export function mapAdminFilterToLens(
  cameraFilter: 'none' | 'gala' | 'vintage' | string | null
): LensFilterId {
  if (cameraFilter === 'gala') return 'classic';
  if (cameraFilter === 'vintage') return 'golden';
  if (cameraFilter === 'none') return 'none';
  return 'classic';
}
