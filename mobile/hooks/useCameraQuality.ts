import { useEffect, useState, type RefObject } from 'react';
import type { CameraView } from 'expo-camera';
import type { QualityPreset } from '@/components/camera/QualitySelector';

function parseSize(size: string): number {
  const [w, h] = size.split('x').map(Number);
  return (w || 0) * (h || 0);
}

function labelForSize(size: string, index: number, total: number): string {
  const h = parseInt(size.split('x')[1] ?? '0', 10);
  if (h >= 2160) return '4K';
  if (h >= 1440) return 'Ultra';
  if (h >= 1080) return 'HD';
  if (h >= 720) return '720p';
  if (total > 1) return `Q${total - index}`;
  return 'Max';
}

function qualityFallbackPresets(pictureSize?: string): QualityPreset[] {
  return [
    { id: 'q-max', label: '4K', pictureSize, quality: 1 },
    { id: 'q-hd', label: 'HD', pictureSize, quality: 0.92 },
    { id: 'q-std', label: 'Std', pictureSize, quality: 0.8 },
  ];
}

function defaultPresetIndex(presets: QualityPreset[]): number {
  const hd = presets.findIndex((p) => p.label === 'HD' || p.label === '720p');
  if (hd >= 0) return hd;
  if (presets.length <= 1) return 0;
  return Math.min(1, presets.length - 1);
}

function qualityForLabel(label: string): number {
  if (label === '4K') return 0.88;
  if (label === 'Ultra') return 0.85;
  if (label === 'HD' || label === '720p') return 0.82;
  return 0.78;
}

function buildPresetsFromSizes(sizes: string[]): QualityPreset[] {
  const sorted = [...new Set(sizes)].sort((a, b) => parseSize(b) - parseSize(a));
  if (!sorted.length) return qualityFallbackPresets();

  if (sorted.length === 1) {
    return qualityFallbackPresets(sorted[0]);
  }

  const presets: QualityPreset[] = [];
  for (let i = 0; i < Math.min(sorted.length, 4); i++) {
    const size = sorted[i];
    presets.push({
      id: size,
      label: labelForSize(size, i, sorted.length),
      pictureSize: size,
      quality: qualityForLabel(labelForSize(size, i, sorted.length)),
    });
  }
  return presets;
}

const FALLBACK_PRESETS: QualityPreset[] = qualityFallbackPresets();

export function useCameraQuality(
  cameraRef: RefObject<CameraView | null>,
  cameraReady: boolean,
  facing: 'front' | 'back'
) {
  const [presets, setPresets] = useState<QualityPreset[]>(FALLBACK_PRESETS);
  const [presetIndex, setPresetIndex] = useState(() => defaultPresetIndex(FALLBACK_PRESETS));

  const preset = presets[presetIndex] ?? presets[0] ?? FALLBACK_PRESETS[0];

  useEffect(() => {
    if (!cameraReady) return;
    let cancelled = false;

    (async () => {
      try {
        const sizes = await cameraRef.current?.getAvailablePictureSizesAsync?.();
        if (!sizes?.length || cancelled) return;
        const built = buildPresetsFromSizes(sizes);
        if (!cancelled) {
          setPresets(built);
          setPresetIndex(defaultPresetIndex(built));
        }
      } catch {
        if (!cancelled) {
          setPresets(FALLBACK_PRESETS);
          setPresetIndex(defaultPresetIndex(FALLBACK_PRESETS));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cameraRef, cameraReady, facing]);

  function cyclePreset() {
    setPresetIndex((i) => (i + 1) % Math.max(presets.length, 1));
  }

  function setPreset(next: QualityPreset) {
    const idx = presets.findIndex((p) => p.id === next.id);
    if (idx >= 0) setPresetIndex(idx);
  }

  return { preset, presets, cyclePreset, setPreset, qualityLabel: preset.label };
}
