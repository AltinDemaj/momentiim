export { tokens, celebration } from './tokens';
export type { ThemeTokens, CelebrationTokens } from './tokens';
import { tokens } from './tokens';

/** @deprecated Use tokens.color — kept for gradual migration */
export const C = {
  bg: tokens.color.bg,
  card: tokens.color.card,
  border: tokens.color.border,
  amber: tokens.color.accent,
  amberDim: tokens.color.accentDim,
  text: tokens.color.text,
  muted: tokens.color.textSecondary,
  dim: tokens.color.muted,
  success: tokens.color.success,
  danger: tokens.color.danger,
  warning: tokens.color.warning,
  glass: tokens.color.glass,
} as const;
