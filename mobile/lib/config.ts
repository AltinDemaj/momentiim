/** Production admin + API base URL (no trailing slash). Override via EXPO_PUBLIC_API_URL in .env */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? 'https://momentiim.com'
).replace(/\/$/, '');
