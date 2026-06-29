import { View, StyleSheet } from 'react-native';
import { tokens } from '@/theme';

/** Subtle film grain overlay — lightweight procedural pattern */
export function GrainOverlay() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      {GRAIN_DOTS.map((dot, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              top: `${dot.y}%`,
              left: `${dot.x}%`,
              opacity: dot.o,
              width: dot.s,
              height: dot.s,
            },
          ]}
        />
      ))}
    </View>
  );
}

const GRAIN_DOTS = Array.from({ length: 48 }, (_, i) => ({
  x: (i * 17 + 7) % 100,
  y: (i * 23 + 11) % 100,
  o: 0.04 + (i % 5) * 0.012,
  s: 1 + (i % 3),
}));

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    borderRadius: 1,
    backgroundColor: tokens.color.text,
  },
});
