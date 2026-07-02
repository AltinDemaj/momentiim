'use client';

import { useEffect, useState } from 'react';
import type { TemplateId } from '@/lib/social/variants';

const TEMPLATE_GLOW: Record<TemplateId, string> = {
  album_reveal: '217, 119, 6',
  user_experience: '148, 163, 184',
  benefits_showcase: '201, 169, 110',
};

export function useMockupGlow(
  mockupUrl: string | null,
  templateVariant: string | null
): string {
  const fallback =
    TEMPLATE_GLOW[(templateVariant as TemplateId) ?? 'benefits_showcase'] ??
    TEMPLATE_GLOW.benefits_showcase;

  const [glowRgb, setGlowRgb] = useState(fallback);

  useEffect(() => {
    if (!mockupUrl) {
      setGlowRgb(fallback);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        const size = 24;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const sx = img.width * 0.15;
        const sy = img.height * 0.08;
        const sw = img.width * 0.7;
        const sh = img.height * 0.35;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]!;
          g += data[i + 1]!;
          b += data[i + 2]!;
          n++;
        }
        if (n > 0) {
          setGlowRgb(`${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)}`);
        }
      } catch {
        setGlowRgb(fallback);
      }
    };

    img.onerror = () => {
      if (!cancelled) setGlowRgb(fallback);
    };

    img.src = mockupUrl;

    return () => {
      cancelled = true;
    };
  }, [mockupUrl, fallback]);

  return glowRgb;
}
