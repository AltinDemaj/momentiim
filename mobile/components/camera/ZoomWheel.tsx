import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';

const WHEEL_HEIGHT = 140;
const MIN_ZOOM = 0;
const MAX_ZOOM = 1;

interface ZoomWheelProps {
  zoom: number;
  onZoomChange: (value: number) => void;
  top: number;
  label?: string;
}

export function ZoomWheel({ zoom, onZoomChange, top, label = 'zoom' }: ZoomWheelProps) {
  const startZoom = useRef(zoom);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startZoom.current = zoomRef.current;
      },
      onPanResponderMove: (_, g) => {
        const delta = -g.dy / WHEEL_HEIGHT;
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, startZoom.current + delta));
        onZoomChange(next);
      },
    })
  ).current;

  const displayZoom = (1 + zoom * 4).toFixed(1);
  const thumbTop = (1 - zoom) * (WHEEL_HEIGHT - 24);

  return (
    <View style={[styles.wrap, { top }]} {...pan.panHandlers}>
      <Text style={styles.label}>{displayZoom}×</Text>
      <View style={styles.track}>
        <View style={styles.tickTop} />
        <View style={styles.tickMid} />
        <View style={styles.tickBot} />
        <View style={[styles.thumb, { top: thumbTop }]} />
      </View>
      <Text style={styles.hint}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 10,
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    zIndex: 18,
  },
  label: {
    color: '#F5E9D3',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  track: {
    width: 24,
    height: WHEEL_HEIGHT,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  tickTop: {
    position: 'absolute',
    top: 6,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tickMid: {
    position: 'absolute',
    top: '50%',
    left: 3,
    right: 3,
    height: 1,
    backgroundColor: 'rgba(245,233,211,0.3)',
  },
  tickBot: {
    position: 'absolute',
    bottom: 6,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  thumb: {
    position: 'absolute',
    left: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5E9D3',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  hint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
