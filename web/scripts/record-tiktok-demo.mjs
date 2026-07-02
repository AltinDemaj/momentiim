/**
 * Records TikTok app-review demo — real admin web app with live interactions.
 *
 * Usage (from web/):
 *   $env:DEMO_ADMIN_EMAIL="you@gmail.com"
 *   $env:DEMO_ADMIN_PASSWORD="your-password"
 *   $env:DEMO_BASE_URL="http://localhost:3001"   # optional
 *   npm run record-tiktok-demo
 *
 * Output: ../tiktok-app-review/demo/momentiim-tiktok-integration-demo.mp4
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const FFMPEG = ffmpegInstaller.path;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

loadEnvLocal();

const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(REPO_ROOT, 'tiktok-app-review', 'demo');
const OUT_FILE = path.join(OUT_DIR, 'momentiim-tiktok-integration-demo.mp4');

const BASE_URL = (
  process.env.DEMO_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://localhost:3001'
).replace(/\/$/, '');

const EMAIL =
  process.env.DEMO_ADMIN_EMAIL ??
  process.env.GMAIL_USER ??
  process.env.ADMIN_EMAILS?.split(',')[0]?.trim();
const PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? process.env.ADMIN_DEMO_PASSWORD;

async function pause(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function moveMouse(page, x, y) {
  await page.mouse.move(x, y, { steps: 12 });
  await pause(120);
}

async function smoothScroll(page, totalY, durationMs = 1200) {
  const steps = 24;
  const stepY = totalY / steps;
  const stepMs = durationMs / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((y) => window.scrollBy(0, y), stepY);
    await pause(stepMs);
  }
}

async function typeSlowly(page, selector, text) {
  await page.click(selector);
  await pause(200);
  for (const char of text) {
    await page.keyboard.type(char, { delay: 55 });
  }
}

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error(
      'Set DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD (admin login for the real app recording).'
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const videoDir = path.join(OUT_DIR, '_playwright-tmp');
  fs.rmSync(videoDir, { recursive: true, force: true });
  fs.mkdirSync(videoDir, { recursive: true });

  console.log(`Recording live app demo against ${BASE_URL}`);
  console.log(`Output: ${OUT_FILE}`);

  const browser = await chromium.launch({
    headless: true,
    slowMo: 40,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
    locale: 'en-US',
  });

  const page = await context.newPage();
  page.setDefaultTimeout(90_000);

  try {
    // ── 1. Admin login (real form, typed slowly) ─────────────────────────
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
    await pause(1800);
    await moveMouse(page, 720, 380);
    await typeSlowly(page, 'input[name="email"]', EMAIL);
    await pause(500);
    await moveMouse(page, 720, 450);
    await typeSlowly(page, 'input[name="password"]', PASSWORD);
    await pause(700);
    await moveMouse(page, 720, 520);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin(?!\/login)/, { timeout: 45_000 });
    await pause(2500);

    // ── 2. Rooms dashboard — scroll, show real data ───────────────────────
    await moveMouse(page, 200, 120);
    await pause(800);
    await smoothScroll(page, 280, 1400);
    await pause(1500);
    await smoothScroll(page, -180, 900);
    await pause(1000);

    // ── 3. Navigate to Social via header link ─────────────────────────────
    const socialNav = page.getByRole('link', { name: 'Social' });
    await socialNav.scrollIntoViewIfNeeded();
    await moveMouse(page, 310, 52);
    await pause(400);
    await socialNav.click();
    await page.waitForURL(/\/admin\/social/, { timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    await pause(2200);

    // ── 4. Explore social queue — scroll through draft cards ──────────────
    await moveMouse(page, 900, 200);
    await pause(600);
    await smoothScroll(page, 420, 1800);
    await pause(1800);

    const mockup = page.locator('article img[alt*="mockup"]').first();
    if (await mockup.isVisible().catch(() => false)) {
      const box = await mockup.boundingBox();
      if (box) {
        await moveMouse(page, box.x + box.width / 2, box.y + box.height / 3);
        await pause(1200);
      }
    }

    await smoothScroll(page, 320, 1400);
    await pause(1500);

    // ── 5. Generate a draft if none with publish button ───────────────────
    let publishBtn = page.getByRole('button', { name: /Publish to IG & TikTok/i }).first();
    let hasPublish = await publishBtn.isVisible().catch(() => false);

    if (!hasPublish) {
      await smoothScroll(page, -600, 1200);
      await pause(800);
      const genBtn = page.getByRole('button', { name: /Generate now/i });
      if (await genBtn.isVisible().catch(() => false)) {
        await genBtn.scrollIntoViewIfNeeded();
        await moveMouse(page, 1180, 180);
        await pause(500);
        await genBtn.click();
        await page.getByText(/Generating|New variant/i).waitFor({ timeout: 5_000 }).catch(() => {});
        await pause(14_000);
        await page.reload({ waitUntil: 'networkidle' });
        await pause(2500);
        await smoothScroll(page, 500, 1600);
        await pause(1500);
        publishBtn = page.getByRole('button', { name: /Publish to IG & TikTok/i }).first();
        hasPublish = await publishBtn.isVisible().catch(() => false);
      }
    }

    // ── 6. Publish flow ───────────────────────────────────────────────────
    if (hasPublish) {
      await publishBtn.scrollIntoViewIfNeeded();
      const pubBox = await publishBtn.boundingBox();
      if (pubBox) {
        await moveMouse(page, pubBox.x + pubBox.width / 2, pubBox.y + pubBox.height / 2);
        await pause(900);
      }
      await publishBtn.click();
      await page.getByText(/Publishing to IG/i).waitFor({ timeout: 8_000 }).catch(() => {});
      await pause(3000);
      await page
        .getByText(/TikTok|IG Story|Publish finished|Publish failed|error/i)
        .first()
        .waitFor({ timeout: 60_000 })
        .catch(() => {});
      await pause(3500);
      await smoothScroll(page, 120, 600);
      await pause(2000);
    }

    // ── 7. Hold on final state ────────────────────────────────────────────
    await pause(4000);
  } catch (err) {
    console.error('Recording error (partial video may still be saved):', err.message);
    await pause(3000);
  }

  await context.close();
  await browser.close();

  const webms = fs
    .readdirSync(videoDir)
    .filter((f) => f.endsWith('.webm'))
    .map((f) => path.join(videoDir, f));

  if (!webms.length) {
    console.error('No video file recorded');
    process.exit(1);
  }

  const latest = webms.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  const webmOut = OUT_FILE.replace('.mp4', '.webm');

  const ff = spawnSync(
    FFMPEG,
    [
      '-y',
      '-i',
      latest,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      OUT_FILE,
    ],
    { stdio: 'pipe' }
  );

  if (ff.status === 0) {
    const stat = fs.statSync(OUT_FILE);
    console.log(`\nDemo saved: ${OUT_FILE} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
  } else {
    fs.copyFileSync(latest, webmOut);
    console.log(`\nffmpeg failed — demo saved as WebM: ${webmOut}`);
    if (ff.stderr) console.error(ff.stderr.toString().slice(-500));
  }

  try {
    fs.rmSync(videoDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
