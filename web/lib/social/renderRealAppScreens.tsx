import React from 'react';
import { ImageResponse } from 'next/og';

const W = 780;
const H = 1680;

const CREAM = '#F5E9D3';
const GOLD = '#C9A96E';
const IVORY = '#FBF7F0';
const DARK = '#0B0B0C';
const WARM_TEXT = '#1A1612';
const MUTED = '#8A8178';

export interface ScreenMeta {
  shotsLeft: number;
  guestCount: number;
  photoCount: number;
  reelCount: number;
}

export function randomScreenMeta(): ScreenMeta {
  const shotsPool = [7, 8, 9, 10, 11, 12];
  const guestPool = [28, 42, 56, 73, 89];
  const photoPool = [47, 68, 83, 104, 127, 156];
  return {
    shotsLeft: shotsPool[Math.floor(Math.random() * shotsPool.length)]!,
    guestCount: guestPool[Math.floor(Math.random() * guestPool.length)]!,
    photoCount: photoPool[Math.floor(Math.random() * photoPool.length)]!,
    reelCount: Math.floor(Math.random() * 8) + 2,
  };
}

/** Real Camera tab — wedding scene in viewfinder + actual HUD + shutter dock. */
export async function renderCameraScreen(
  eventTitle: string,
  photoDataUrl: string,
  meta: ScreenMeta
): Promise<Buffer> {
  const response = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#000' }}>
        <img
          src={photoDataUrl}
          width={W}
          height={H}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 12%, transparent 68%, rgba(0,0,0,0.82) 100%)',
          }}
        />

        {/* Top HUD — matches CameraExperience */}
        <div
          style={{
            position: 'absolute',
            top: 52,
            left: 20,
            right: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', color: '#fff', fontSize: 18, fontWeight: 600, maxWidth: 380 }}>
            {eventTitle.slice(0, 32)}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(245,233,211,0.35)',
                borderRadius: 16,
                padding: '7px 12px',
                color: CREAM,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              MAX
            </div>
            <div
              style={{
                display: 'flex',
                width: 32,
                height: 32,
                borderRadius: 16,
                background: 'rgba(0,0,0,0.45)',
              }}
            />
            <div
              style={{
                display: 'flex',
                color: CREAM,
                fontSize: 11,
                fontWeight: 600,
                background: 'rgba(0,0,0,0.4)',
                padding: '7px 10px',
                borderRadius: 10,
              }}
            >
              {meta.shotsLeft}
            </div>
          </div>
        </div>

        {/* Viewfinder corner brackets */}
        <div style={{ position: 'absolute', top: 120, left: 16, width: 28, height: 28, display: 'flex', borderTop: `2px solid ${CREAM}`, borderLeft: `2px solid ${CREAM}`, opacity: 0.9 }} />
        <div style={{ position: 'absolute', top: 120, right: 16, width: 28, height: 28, display: 'flex', borderTop: `2px solid ${CREAM}`, borderRight: `2px solid ${CREAM}`, opacity: 0.9 }} />
        <div style={{ position: 'absolute', bottom: 300, left: 16, width: 28, height: 28, display: 'flex', borderBottom: `2px solid ${CREAM}`, borderLeft: `2px solid ${CREAM}`, opacity: 0.9 }} />
        <div style={{ position: 'absolute', bottom: 300, right: 16, width: 28, height: 28, display: 'flex', borderBottom: `2px solid ${CREAM}`, borderRight: `2px solid ${CREAM}`, opacity: 0.9 }} />

        {/* Bottom dock — Photo/Reel + shutter */}
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 22,
              padding: 3,
            }}
          >
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.16)', borderRadius: 18, padding: '8px 22px', color: '#fff', fontSize: 13, fontWeight: 500 }}>
              Photo
            </div>
            <div style={{ display: 'flex', padding: '8px 22px', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500 }}>
              Reel
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 48px' }}>
            <div style={{ display: 'flex', width: 52, height: 52, alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 600 }}>
              Gal
            </div>
            <div
              style={{
                display: 'flex',
                width: 88,
                height: 88,
                borderRadius: 44,
                border: '2px solid rgba(255,255,255,0.55)',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 5,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  borderRadius: 40,
                  background: CREAM,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ display: 'flex', width: 56, height: 56, borderRadius: 28, background: DARK, border: '1px solid rgba(255,255,255,0.14)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', width: 52, height: 52, alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 600 }}>
              Flip
            </div>
          </div>
        </div>

        {/* Tab bar hint */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            background: 'rgba(18,18,20,0.92)',
            borderRadius: 20,
            padding: '10px 28px',
            gap: 32,
          }}
        >
          <div style={{ display: 'flex', color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Home</div>
          <div style={{ display: 'flex', color: CREAM, fontSize: 11, fontWeight: 600 }}>Camera</div>
          <div style={{ display: 'flex', color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Keepsakes</div>
          <div style={{ display: 'flex', color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Profile</div>
        </div>
      </div>
    ),
    { width: W, height: H }
  );

  return Buffer.from(await response.arrayBuffer());
}

/** Real Home tab — EventStoryHero card on ivory background. */
export async function renderHomeScreen(
  eventTitle: string,
  heroDataUrl: string,
  meta: ScreenMeta
): Promise<Buffer> {
  const response = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: IVORY,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', padding: '48px 32px 20px', gap: 6 }}>
          <div style={{ display: 'flex', color: GOLD, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
            Momenti Im
          </div>
          <div style={{ display: 'flex', color: WARM_TEXT, fontSize: 26, fontWeight: 800 }}>
            Përshëndetje 👋
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            margin: '0 24px',
            borderRadius: 24,
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 14px 28px rgba(26,22,18,0.12)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: 340, position: 'relative' }}>
            <img src={heroDataUrl} width={W - 48} height={340} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                background: 'linear-gradient(180deg, rgba(26,22,18,0.15) 0%, rgba(26,22,18,0.5) 45%, rgba(26,22,18,0.92) 100%)',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: '5px 10px' }}>
                <div style={{ display: 'flex', width: 6, height: 6, borderRadius: 3, background: '#53D769' }} />
                <div style={{ display: 'flex', color: '#fff', fontSize: 11, fontWeight: 600 }}>Live</div>
              </div>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.35)', borderRadius: 20, padding: '5px 10px', color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
                {meta.guestCount} mysafirë
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', padding: 20, marginTop: 'auto', position: 'relative', gap: 4 }}>
              <div style={{ display: 'flex', color: GOLD, fontSize: 11, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                Festimi i sotëm
              </div>
              <div style={{ display: 'flex', color: '#fff', fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>
                {eventTitle.slice(0, 28)}
              </div>
              <div style={{ display: 'flex', color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500 }}>
                E shtunë · 18:00
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', padding: 18, gap: 14, background: '#fff' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', gap: 4, background: IVORY, borderRadius: 14, padding: '12px 4px', border: '1px solid rgba(26,22,18,0.08)' }}>
                <div style={{ display: 'flex', color: WARM_TEXT, fontSize: 20, fontWeight: 700 }}>{meta.shotsLeft}</div>
                <div style={{ display: 'flex', color: MUTED, fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>foto të mbetura</div>
              </div>
              <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', gap: 4, background: IVORY, borderRadius: 14, padding: '12px 4px', border: '1px solid rgba(26,22,18,0.08)' }}>
                <div style={{ display: 'flex', color: WARM_TEXT, fontSize: 20, fontWeight: 700 }}>{meta.reelCount}</div>
                <div style={{ display: 'flex', color: MUTED, fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>reels</div>
              </div>
              <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', gap: 4, background: IVORY, borderRadius: 14, padding: '12px 4px', border: '1px solid rgba(26,22,18,0.08)' }}>
                <div style={{ display: 'flex', color: WARM_TEXT, fontSize: 15, fontWeight: 700 }}>Gati</div>
                <div style={{ display: 'flex', color: MUTED, fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>albumi</div>
              </div>
            </div>
            <div style={{ display: 'flex', background: 'rgba(201,169,110,0.15)', border: '1.5px solid rgba(201,169,110,0.45)', borderRadius: 16, padding: '16px 0', justifyContent: 'center', color: GOLD, fontSize: 16, fontWeight: 700 }}>
              Hap kamerën
            </div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H }
  );

  return Buffer.from(await response.arrayBuffer());
}

/** Real Keepsake album screen — hero cover + 2-column photo grid. */
export async function renderAlbumScreen(
  eventTitle: string,
  heroDataUrl: string,
  gridDataUrls: string[],
  meta: ScreenMeta
): Promise<Buffer> {
  const cellW = Math.floor((W - 32 - 6) / 2);
  const cellH = Math.floor(cellW * 1.15);

  const response = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: IVORY,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: 400, position: 'relative' }}>
          <img src={heroDataUrl} width={W} height={400} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              background: 'linear-gradient(180deg, transparent 0%, rgba(26,22,18,0.55) 55%, rgba(26,22,18,0.92) 100%)',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', padding: '0 24px 28px', position: 'relative', gap: 6 }}>
            <div style={{ display: 'flex', color: GOLD, fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Album kujtimesh
            </div>
            <div style={{ display: 'flex', color: '#fff', fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>
              {eventTitle.slice(0, 30)}
            </div>
            <div style={{ display: 'flex', color: 'rgba(255,255,255,0.88)', fontSize: 15 }}>
              12 korrik 2026
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: -20, background: IVORY, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 16px', flex: 1, gap: 14 }}>
          <div style={{ display: 'flex', color: MUTED, fontSize: 14 }}>
            <span style={{ display: 'flex', color: WARM_TEXT, fontWeight: 700 }}>{meta.photoCount}</span>
            <span style={{ display: 'flex', marginLeft: 4 }}>momente</span>
            <span style={{ display: 'flex', marginLeft: 12, color: GOLD, fontWeight: 600 }}>· Zhvilluar</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <img src={gridDataUrls[0]} width={cellW} height={cellH} style={{ display: 'flex', width: cellW, height: cellH, borderRadius: 14, objectFit: 'cover' }} />
            <img src={gridDataUrls[1]} width={cellW} height={cellH} style={{ display: 'flex', width: cellW, height: cellH, borderRadius: 14, objectFit: 'cover' }} />
            <img src={gridDataUrls[2]} width={cellW} height={cellH} style={{ display: 'flex', width: cellW, height: cellH, borderRadius: 14, objectFit: 'cover' }} />
            <img src={gridDataUrls[3]} width={cellW} height={cellH} style={{ display: 'flex', width: cellW, height: cellH, borderRadius: 14, objectFit: 'cover' }} />
            <img src={gridDataUrls[4]} width={cellW} height={cellH} style={{ display: 'flex', width: cellW, height: cellH, borderRadius: 14, objectFit: 'cover' }} />
            <img src={gridDataUrls[5]} width={cellW} height={cellH} style={{ display: 'flex', width: cellW, height: cellH, borderRadius: 14, objectFit: 'cover' }} />
          </div>
        </div>
      </div>
    ),
    { width: W, height: H }
  );

  return Buffer.from(await response.arrayBuffer());
}
