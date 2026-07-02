import type { TemplateId } from './variants';
import { fetchWeddingPhoto, fetchWeddingPhotoBatch, bufferToDataUrl } from './fetchWeddingPhoto';
import {
  randomScreenMeta,
  renderCameraScreen,
  renderHomeScreen,
  renderAlbumScreen,
} from './renderRealAppScreens';

const PHONE_W = 520;
const PHONE_H = 1060;

/** Compose phone screen using real app UI layouts + dynamic Unsplash photography. */
export async function composePhoneScreen(
  templateId: TemplateId,
  displayLabel: string
): Promise<Buffer> {
  const meta = randomScreenMeta();

  if (templateId === 'user_experience') {
    const photo = await fetchWeddingPhoto(780, 1680);
    const screen = await renderCameraScreen(displayLabel, bufferToDataUrl(photo), meta);
    return resizePhoneJpeg(screen);
  }

  if (templateId === 'benefits_showcase') {
    const hero = await fetchWeddingPhoto(900, 700);
    const screen = await renderHomeScreen(displayLabel, bufferToDataUrl(hero), meta);
    return resizePhoneJpeg(screen);
  }

  const [hero, grid] = await Promise.all([
    fetchWeddingPhoto(900, 800),
    fetchWeddingPhotoBatch(6, 400, 460),
  ]);
  const screen = await renderAlbumScreen(
    displayLabel,
    bufferToDataUrl(hero),
    grid.map((b) => bufferToDataUrl(b)),
    meta
  );
  return resizePhoneJpeg(screen);
}

/** Blurred wedding photo for the marketing scene background. */
export async function composeSceneBackground(width: number, height: number): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  const photo = await fetchWeddingPhoto(width, height);
  return sharp(photo)
    .resize(width, height, { fit: 'cover' })
    .blur(14)
    .modulate({ brightness: 0.5, saturation: 1.1 })
    .jpeg({ quality: 85 })
    .toBuffer();
}

async function resizePhoneJpeg(buffer: Buffer): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  return sharp(buffer).resize(PHONE_W, PHONE_H, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer();
}

export { bufferToDataUrl };

export function clearOverlayCaches(): void {
  /* no-op — overlays removed in v5 */
}
