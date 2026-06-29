import { View, Text, StyleSheet, Pressable } from 'react-native';
import { tokens } from '@/theme';
import { useLocale } from '@/context/LocaleContext';

const font = { mono: 'Inter_600SemiBold' };

export interface QualityPreset {
  id: string;
  label: string;
  pictureSize?: string;
  quality: number;
}

export const DEFAULT_QUALITY_PRESETS: QualityPreset[] = [
  { id: 'standard', label: 'Std', quality: 0.72 },
  { id: 'high', label: 'HD', quality: 0.88 },
  { id: 'max', label: 'Max', quality: 1 },
];

interface QualitySelectorProps {
  preset: QualityPreset;
  presets: QualityPreset[];
  onChange: (preset: QualityPreset) => void;
  variant?: 'overlay' | 'chip';
  disabled?: boolean;
}

export function QualitySelector({
  preset,
  presets,
  onChange,
  variant = 'chip',
  disabled,
}: QualitySelectorProps) {
  const { t } = useLocale();
  const index = presets.findIndex((p) => p.id === preset.id);

  function cycle() {
    if (disabled) return;
    const next = presets[(index + 1) % presets.length];
    onChange(next);
  }

  if (variant === 'chip') {
    return (
      <Pressable
        style={[styles.chip, disabled && styles.chipDisabled]}
        onPress={cycle}
        disabled={disabled}
      >
        <Text style={styles.chipText}>{preset.label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.wrap} onPress={cycle} disabled={disabled}>
      <Text style={styles.eyebrow}>{t('camera.quality')}</Text>
      <Text style={styles.value}>{preset.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minWidth: 40,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    color: '#F5E9D3',
    fontSize: 11,
    fontFamily: font.mono,
    letterSpacing: 0.4,
  },
  wrap: {
    position: 'absolute',
    left: 14,
    top: '36%',
    backgroundColor: 'rgba(18,18,20,0.78)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.color.borderStrong,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 72,
  },
  eyebrow: {
    color: tokens.color.muted,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  value: {
    color: tokens.color.accent,
    fontSize: 13,
    fontFamily: font.mono,
    marginTop: 2,
  },
});
