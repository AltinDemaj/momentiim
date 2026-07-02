import React from 'react';
import { ImageResponse } from 'next/og';
import type { SocialVariantSelection } from './variants';
import {
  composePhoneScreen,
  composeSceneBackground,
  bufferToDataUrl,
  clearOverlayCaches,
} from './composePhoneScreen';

export interface UnifiedStoryInput {
  variant: SocialVariantSelection;
}

function PhoneFrame({
  screenSrc,
  scale = 1,
  rotate = 0,
}: {
  screenSrc: string;
  scale?: number;
  rotate?: number;
}) {
  const w = Math.round(520 * scale);
  const h = Math.round(1060 * scale);
  const transform = rotate ? `rotate(${rotate}deg)` : undefined;

  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: w,
        height: h,
        borderRadius: Math.round(56 * scale),
        border: `${Math.round(12 * scale)}px solid #2a2a2e`,
        background: '#111114',
        boxShadow: '0 48px 96px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)',
        overflow: 'hidden',
        ...(transform ? { transform } : {}),
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 32,
          borderRadius: 20,
          background: '#0b0b0c',
        }}
      />
      <img
        src={screenSrc}
        width={w}
        height={h}
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
      />
    </div>
  );
}

function BulletFooter({ bullets }: { bullets: [string, string, string] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: 480,
        padding: '0 64px',
        gap: 20,
        borderTop: '1px solid rgba(245,233,211,0.1)',
        background: 'rgba(0,0,0,0.72)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', width: 8, height: 8, borderRadius: 999, background: '#C9A96E', flexShrink: 0 }} />
        <div style={{ display: 'flex', fontSize: 24, color: '#F5E9D3', fontWeight: 500, lineHeight: 1.3 }}>{bullets[0]}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', width: 8, height: 8, borderRadius: 999, background: '#C9A96E', flexShrink: 0 }} />
        <div style={{ display: 'flex', fontSize: 24, color: '#F5E9D3', fontWeight: 500, lineHeight: 1.3 }}>{bullets[1]}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', width: 8, height: 8, borderRadius: 999, background: '#C9A96E', flexShrink: 0 }} />
        <div style={{ display: 'flex', fontSize: 24, color: '#F5E9D3', fontWeight: 500, lineHeight: 1.3 }}>{bullets[2]}</div>
      </div>
    </div>
  );
}

/**
 * 9:16 marketing asset — dynamic Unsplash photography + real app UI overlay composition.
 */
export async function generateUnifiedStory(input: UnifiedStoryInput): Promise<Buffer> {
  const { variant } = input;
  clearOverlayCaches();

  const [sceneBg, phoneScreen] = await Promise.all([
    composeSceneBackground(1080, 1152),
    composePhoneScreen(variant.templateId, variant.anonymousEventLabel),
  ]);

  const sceneBgSrc = bufferToDataUrl(sceneBg);
  const phoneScreenSrc = bufferToDataUrl(phoneScreen);
  const isUserExperience = variant.templateId === 'user_experience';

  const response = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: '#0b0b0c',
          fontFamily: 'system-ui, sans-serif',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 288,
            padding: '0 48px',
            gap: 16,
            background: 'rgba(11,11,12,0.85)',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: '#C9A96E',
              fontWeight: 600,
            }}
          >
            Momenti Im
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              fontWeight: 700,
              color: '#F5E9D3',
              textAlign: 'center',
              lineHeight: 1.25,
              maxWidth: 920,
            }}
          >
            {variant.headline}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 1152,
            position: 'relative',
            width: '100%',
          }}
        >
          <img
            src={sceneBgSrc}
            width={1080}
            height={1152}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.55) 100%)',
            }}
          />

          {isUserExperience ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                position: 'relative',
                width: '100%',
                height: '100%',
                paddingBottom: 80,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  position: 'absolute',
                  bottom: 40,
                  width: 340,
                  height: 180,
                  borderRadius: '120px 120px 40px 40px',
                  background: 'linear-gradient(180deg, rgba(30,25,22,0.9) 0%, rgba(15,12,10,0.95) 100%)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              />
              <div style={{ display: 'flex', position: 'relative', marginBottom: 60 }}>
                <PhoneFrame screenSrc={phoneScreenSrc} scale={1.05} rotate={-4} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', position: 'relative' }}>
              <PhoneFrame screenSrc={phoneScreenSrc} />
            </div>
          )}
        </div>

        <BulletFooter bullets={variant.bullets} />
      </div>
    ),
    { width: 1080, height: 1920 }
  );

  return Buffer.from(await response.arrayBuffer());
}
