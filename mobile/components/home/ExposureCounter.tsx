import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '@/theme';
import { useLocale } from '@/context/LocaleContext';

const font = {
  mono: 'Inter_700Bold',
  label: 'Inter_600SemiBold',
  hint: 'Inter_400Regular',
};

interface ExposureCounterProps {
  remaining: number;
  total: number;
  compact?: boolean;
  light?: boolean;
}

export function ExposureCounter({ remaining, total, compact, light }: ExposureCounterProps) {
  const { t } = useLocale();
  const ratio = total > 0 ? remaining / total : 0;
  const segments = Math.min(total, 12);
  const filled = Math.round(ratio * segments);
  const mutedColor = light ? '#8A8178' : tokens.color.muted;
  const segOn = light ? '#C9A96E' : tokens.color.accent;
  const segOff = light ? 'rgba(26,22,18,0.1)' : 'rgba(255,255,255,0.12)';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {!compact && (
        <Text style={[styles.eyebrow, { color: mutedColor }]}>{t('home.filmRoll')}</Text>
      )}
      <View style={styles.barRow}>
        {Array.from({ length: segments }).map((_, i) => {
          const usedSeg = i < segments - filled;
          return (
            <View
              key={i}
              style={[styles.seg, { backgroundColor: usedSeg ? segOn : segOff }]}
            />
          );
        })}
      </View>
      {!compact && (
        <Text style={[styles.hint, { color: mutedColor }]}>
          {t('exposure.ofRemaining', { remaining, total })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingVertical: 2,
  },
  wrapCompact: {
    paddingVertical: 0,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: font.label,
    letterSpacing: 1.2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  seg: {
    flex: 1,
    maxWidth: 22,
    height: 6,
    borderRadius: 3,
  },
  hint: {
    color: tokens.color.muted,
    fontSize: 12,
    fontFamily: font.hint,
    textAlign: 'center',
    marginTop: 2,
  },
});
