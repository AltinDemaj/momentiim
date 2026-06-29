import { View, Text, StyleSheet, Pressable, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { tokens, C } from '@/theme';

export { C, tokens };

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        styles[`btn_${variant}`],
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? tokens.color.bg : tokens.color.accent} />
      ) : (
        <Text style={[styles.btnText, styles[`btnText_${variant}`]]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="secondary" />;
}

export function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

export function Eyebrow({ children, style }: { children: string; style?: TextStyle }) {
  return <Text style={[styles.eyebrow, style]}>{children}</Text>;
}

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  glassCard: {
    backgroundColor: tokens.color.glass,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.spacing.lg,
  },
  eyebrow: {
    color: tokens.color.accent,
    fontSize: tokens.typography.caption,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  btn: {
    borderRadius: tokens.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  btn_primary: {
    backgroundColor: tokens.color.accent,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  btn_secondary: {
    backgroundColor: tokens.color.glass,
    borderWidth: 1,
    borderColor: tokens.color.borderStrong,
  },
  btn_ghost: {
    backgroundColor: 'transparent',
  },
  btn_danger: {
    backgroundColor: 'rgba(255,92,92,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,92,92,0.35)',
  },
  btnDisabled: {
    opacity: 0.42,
  },
  btnPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  btnText: {
    fontSize: tokens.typography.body,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  btnText_primary: {
    color: tokens.color.bg,
  },
  btnText_secondary: {
    color: tokens.color.text,
  },
  btnText_ghost: {
    color: tokens.color.textSecondary,
  },
  btnText_danger: {
    color: tokens.color.danger,
  },
});
