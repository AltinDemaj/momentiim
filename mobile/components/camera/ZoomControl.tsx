import { View, Text, StyleSheet, Pressable } from 'react-native';
import { tokens } from '@/theme';

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (value: number) => void;
}

export function ZoomControl({ zoom, onZoomChange }: ZoomControlProps) {
  const presets = [0, 0.15, 0.35, 0.6];

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{(1 + zoom * 4).toFixed(1)}×</Text>
      <View style={styles.track}>
        {presets.map((preset) => (
          <Pressable
            key={preset}
            style={[styles.preset, Math.abs(zoom - preset) < 0.08 && styles.presetActive]}
            onPress={() => onZoomChange(preset)}
            hitSlop={8}
          >
            <Text
              style={[
                styles.presetText,
                Math.abs(zoom - preset) < 0.08 && styles.presetTextActive,
              ]}
            >
              {preset === 0 ? '1' : (1 + preset * 4).toFixed(1)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 14,
    top: '38%',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(11,11,12,0.55)',
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.color.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  label: {
    color: tokens.color.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  track: {
    gap: 6,
  },
  preset: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  presetActive: {
    backgroundColor: tokens.color.accentDim,
    borderWidth: 1,
    borderColor: 'rgba(245,233,211,0.35)',
  },
  presetText: {
    color: tokens.color.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  presetTextActive: {
    color: tokens.color.accent,
  },
});
