import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '@/theme';

interface FilmRollMeterProps {
  remaining: number;
  total: number;
}

export function FilmRollMeter({ remaining, total }: FilmRollMeterProps) {
  const used = Math.max(0, total - remaining);
  const ratio = total > 0 ? remaining / total : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.ringOuter}>
        <View
          style={[
            styles.ringTrack,
            {
              borderTopColor: ratio > 0 ? tokens.color.accent : 'transparent',
              borderRightColor: ratio > 0.25 ? tokens.color.accent : tokens.color.border,
              borderBottomColor: ratio > 0.5 ? tokens.color.accent : tokens.color.border,
              borderLeftColor: ratio > 0.75 ? tokens.color.accent : tokens.color.border,
            },
          ]}
        />
        <View style={styles.ringInner}>
          <Text style={styles.count}>{remaining}</Text>
          <Text style={styles.slash}>/</Text>
          <Text style={styles.total}>{total}</Text>
        </View>
      </View>

      <View style={styles.meta}>
        <Text style={styles.label}>Film remaining</Text>
        <View style={styles.filmStrip}>
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.frame,
                i < used ? styles.frameUsed : styles.frameOpen,
                i === used && styles.frameNext,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: tokens.color.glass,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ringOuter: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTrack: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    transform: [{ rotate: '-90deg' }],
  },
  ringInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: tokens.color.bgSecondary,
    borderWidth: 1,
    borderColor: tokens.color.border,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingTop: 18,
  },
  count: {
    color: tokens.color.accent,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
  slash: {
    color: tokens.color.muted,
    fontSize: 13,
    fontWeight: '500',
    marginHorizontal: 1,
  },
  total: {
    color: tokens.color.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 24,
  },
  meta: {
    flex: 1,
    gap: 8,
  },
  label: {
    color: tokens.color.muted,
    fontSize: tokens.typography.caption,
    fontWeight: '600',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  filmStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  frame: {
    width: 10,
    height: 14,
    borderRadius: 2,
    borderWidth: 1,
  },
  frameOpen: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: tokens.color.borderStrong,
  },
  frameUsed: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: tokens.color.border,
    opacity: 0.5,
  },
  frameNext: {
    backgroundColor: tokens.color.accentDim,
    borderColor: 'rgba(245,233,211,0.45)',
  },
});
