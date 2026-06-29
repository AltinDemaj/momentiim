import { View, StyleSheet } from 'react-native';
import { tokens } from '@/theme';

const BRACKET = 28;
const STROKE = 1.5;
const GRID = 'rgba(245,233,211,0.2)';

interface ViewfinderOverlayProps {
  top: number;
  bottom: number;
  horizontal?: number;
}

export function ViewfinderOverlay({ top, bottom, horizontal = 16 }: ViewfinderOverlayProps) {
  return (
    <View
      style={[styles.frame, { top, bottom, left: horizontal, right: horizontal }]}
      pointerEvents="none"
    >
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />

      <View style={[styles.gridLine, styles.gridV1]} />
      <View style={[styles.gridLine, styles.gridV2]} />
      <View style={[styles.gridLine, styles.gridH1]} />
      <View style={[styles.gridLine, styles.gridH2]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    zIndex: 6,
  },
  corner: {
    position: 'absolute',
    width: BRACKET,
    height: BRACKET,
    borderColor: tokens.color.accent,
    opacity: 0.9,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: STROKE,
    borderLeftWidth: STROKE,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: STROKE,
    borderRightWidth: STROKE,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: STROKE,
    borderLeftWidth: STROKE,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: STROKE,
    borderRightWidth: STROKE,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: GRID,
  },
  gridV1: {
    left: '33.33%',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
  },
  gridV2: {
    left: '66.66%',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
  },
  gridH1: {
    top: '33.33%',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  gridH2: {
    top: '66.66%',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
