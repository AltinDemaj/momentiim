import { useRef, useEffect } from 'react';
import { View, StyleSheet, PanResponder, type GestureResponderEvent } from 'react-native';

const MIN_ZOOM = 0;
const MAX_ZOOM = 1;

function touchDistance(touches: GestureResponderEvent['nativeEvent']['touches']) {
  if (touches.length < 2) return 0;
  const [a, b] = touches;
  return Math.hypot(b.pageX - a.pageX, b.pageY - a.pageY);
}

interface PinchZoomLayerProps {
  zoom: number;
  onZoomChange: (value: number) => void;
  top: number;
  bottom: number;
}

export function PinchZoomLayer({ zoom, onZoomChange, top, bottom }: PinchZoomLayerProps) {
  const baseDist = useRef(0);
  const baseZoom = useRef(zoom);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponder: (e) => e.nativeEvent.touches.length >= 2,
      onPanResponderGrant: (e) => {
        if (e.nativeEvent.touches.length >= 2) {
          baseDist.current = touchDistance(e.nativeEvent.touches);
          baseZoom.current = zoomRef.current;
        }
      },
      onPanResponderMove: (e) => {
        if (e.nativeEvent.touches.length < 2 || baseDist.current <= 0) return;
        const dist = touchDistance(e.nativeEvent.touches);
        const ratio = dist / baseDist.current;
        const delta = (ratio - 1) * 0.45;
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, baseZoom.current + delta));
        onZoomChange(next);
      },
    })
  ).current;

  return <View style={[styles.layer, { top, bottom }]} {...pan.panHandlers} />;
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 8,
  },
});
