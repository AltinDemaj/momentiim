/**
 * Records auto-playing TikTok integration demo (no login required).
 * Output: tiktok-app-review/demo/momentiim-tiktok-integration-demo.mp4
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const FFMPEG = ffmpegInstaller.path;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(REPO_ROOT, 'tiktok-app-review', 'demo');
const OUT_MP4 = path.join(OUT_DIR, 'momentiim-tiktok-integration-demo.mp4');

const BASE = (process.env.DEMO_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const DURATION_SEC = 22;

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmpDir = path.join(OUT_DIR, '_tmp-video');
  fs.mkdirSync(tmpDir, { recursive: true });

  console.log(`Recording ${DURATION_SEC}s from ${BASE}/tiktok-integration-demo`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: tmpDir, size: { width: 1440, height: 900 } },
  });

  const page = await context.newPage();
  await page.goto(`${BASE}/tiktok-integration-demo`, { waitUntil: 'load', timeout: 120_000 });
  await page.waitForTimeout(2000);
  await page.waitForTimeout(DURATION_SEC * 1000);

  await context.close();
  await browser.close();

  const webm = fs
    .readdirSync(tmpDir)
    .filter((f) => f.endsWith('.webm'))
    .map((f) => path.join(tmpDir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];

  if (!webm) {
    console.error('No recording captured');
    process.exit(1);
  }

  const ff = spawnSync(
    FFMPEG,
    ['-y', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT_MP4],
    { stdio: 'pipe' }
  );

  if (ff.status === 0) {
    const stat = fs.statSync(OUT_MP4);
    console.log(`Saved: ${OUT_MP4} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
  } else {
    const webmOut = OUT_MP4.replace('.mp4', '.webm');
    fs.copyFileSync(webm, webmOut);
    console.log(`ffmpeg missing — saved WebM: ${webmOut}`);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
