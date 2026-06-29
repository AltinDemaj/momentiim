/** Warm wedding-style placeholder hero images (Unsplash, stable URLs) */
export const HERO_PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
  'https://images.unsplash.com/photo-1465497420217-53fae8dee968?w=1200&q=80',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80',
] as const;

export function getPlaceholderHero(eventId?: string): string {
  if (!eventId) return HERO_PLACEHOLDERS[0];
  let hash = 0;
  for (let i = 0; i < eventId.length; i += 1) {
    hash = (hash + eventId.charCodeAt(i) * (i + 1)) % HERO_PLACEHOLDERS.length;
  }
  return HERO_PLACEHOLDERS[hash];
}
