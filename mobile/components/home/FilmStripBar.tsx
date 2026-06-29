import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '@/theme';
import { useLocale } from '@/context/LocaleContext';

const font = { semibold: 'Inter_600SemiBold', bold: 'Inter_700Bold' };

interface FilmStripBarProps {
  remaining: number;
  total: number;
}

export function FilmStripBar({ remaining, total }: FilmStripBarProps) {
  const { t } = useLocale();
  const used = Math.max(0, total - remaining);
  const ratio = total > 0 ? remaining / total : 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('film.label')}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <Text style={styles.count}>
        {remaining} / {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: tokens.color.muted,
    fontSize: 10,
    fontFamily: font.semibold,
    letterSpacing: 2.2,
    textAlign: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  fill: {
    height: '100%',
    backgroundColor: tokens.color.accent,
    borderRadius: 3,
  },
  count: {
    color: tokens.color.text,
    fontSize: 15,
    fontFamily: font.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
