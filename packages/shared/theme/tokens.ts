export const tokens = {
  color: {
    bg: '#0B0B0C',
    bgSecondary: '#121214',
    card: 'rgba(255,255,255,0.05)',
    glass: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.72)',
    muted: 'rgba(255,255,255,0.45)',
    accent: '#F5E9D3',
    accentDim: 'rgba(245,233,211,0.14)',
    success: '#53D769',
    warning: '#FFCC66',
    danger: '#FF5C5C',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.14)',
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  motion: {
    fast: 200,
    normal: 280,
    slow: 350,
  },
  typography: {
    hero: 34,
    h1: 28,
    h2: 22,
    h3: 18,
    body: 16,
    small: 13,
    caption: 11,
  },
} as const;

export type ThemeTokens = typeof tokens;
