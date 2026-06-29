import { Pressable, Text, StyleSheet, Linking } from 'react-native';
import { tokens } from '@/theme';
import { useLocale } from '@/context/LocaleContext';

const font = { medium: 'Inter_500Medium' };

interface PoweredByBannerProps {
  visible?: boolean;
}

export function PoweredByBanner({ visible = true }: PoweredByBannerProps) {
  const { t } = useLocale();
  if (!visible) return null;

  return (
    <Pressable
      style={styles.banner}
      onPress={() => Linking.openURL('https://momentiim.com')}
      accessibilityRole="link"
    >
      <Text style={styles.text}>{t('referral.banner')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 88,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(245,233,211,0.15)',
  },
  text: {
    color: tokens.color.muted,
    fontSize: 11,
    fontFamily: font.medium,
    textAlign: 'center',
    lineHeight: 16,
  },
  brand: {
    color: tokens.color.accent,
  },
});
