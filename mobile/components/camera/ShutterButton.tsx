import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/theme';

interface ShutterButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  recording?: boolean;
}

export function ShutterButton({ onPress, disabled, loading, recording }: ShutterButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function animatePress() {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.94,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }

  async function handlePress() {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animatePress();
    onPress();
  }

  return (
    <Pressable onPress={handlePress} disabled={disabled || loading} accessibilityRole="button">
      <Animated.View
        style={[
          styles.outer,
          { transform: [{ scale }] },
          (disabled || loading) && styles.disabled,
        ]}
      >
        <View style={styles.mid}>
          <View style={[styles.inner, recording && styles.innerRecording]}>
            {loading ? (
              <ActivityIndicator color={tokens.color.bg} />
            ) : recording ? (
              <View style={styles.recSquare} />
            ) : (
              <View style={[styles.core, disabled && styles.coreOff]} />
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  mid: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  inner: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: tokens.color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRecording: {
    backgroundColor: '#c0392b',
  },
  core: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.color.bg,
    borderWidth: 1,
    borderColor: tokens.color.borderStrong,
  },
  coreOff: {
    backgroundColor: '#1c1c1f',
  },
  recSquare: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  disabled: {
    opacity: 0.38,
  },
});
