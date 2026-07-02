import { createSupabaseServiceClient } from '@/lib/supabase/server';
import {
  createPublishAssetToken,
  publishAssetUrl,
  isPubliclyReachableAppUrl,
} from '@/lib/social/publishAssetToken';
import { publishToInstagramStory, isInstagramConfigured } from '@/lib/social/publishToInstagram';
import { publishToTikTokPhoto, isTikTokConfigured } from '@/lib/social/publishToTikTok';

export type PublishPlatform = 'instagram' | 'tiktok';

export interface PublishDraftResult {
  imageUrl: string;
  instagram?: { mediaId: string; containerId: string };
  tiktok?: { publishId: string; status: string };
  errors: Partial<Record<PublishPlatform, string>>;
  warnings: string[];
}

async function buildPublicImageUrl(draftId: string): Promise<string> {
  const token = createPublishAssetToken(draftId, 900);
  return publishAssetUrl(draftId, token);
}

export async function publishSocialDraft(
  draftId: string,
  platforms: PublishPlatform[] = ['instagram', 'tiktok']
): Promise<PublishDraftResult> {
  const service = createSupabaseServiceClient();
  const warnings: string[] = [];
  const errors: Partial<Record<PublishPlatform, string>> = {};

  if (!isPubliclyReachableAppUrl()) {
    warnings.push(
      'NEXT_PUBLIC_APP_URL is localhost — Instagram/TikTok cannot fetch images. Use your Vercel URL or ngrok for real posts.'
    );
  }

  const { data: draft, error } = await service
    .from('social_content_drafts')
    .select('id, mockup_storage_path, concept_label, anonymous_event_label, headline_variant')
    .eq('id', draftId)
    .maybeSingle();

  if (error || !draft?.mockup_storage_path) {
    throw new Error('Draft not found or missing mockup');
  }

  const imageUrl = await buildPublicImageUrl(draftId);
  const caption =
    draft.anonymous_event_label ??
    draft.concept_label ??
    'Momenti Im — premium wedding memories';

  const result: PublishDraftResult = { imageUrl, errors, warnings };

  if (platforms.includes('instagram')) {
    if (!isInstagramConfigured()) {
      errors.instagram = 'Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in env';
    } else {
      try {
        result.instagram = await publishToInstagramStory(imageUrl, caption);
      } catch (err) {
        errors.instagram = err instanceof Error ? err.message : 'Instagram publish failed';
      }
    }
  }

  if (platforms.includes('tiktok')) {
    if (!isTikTokConfigured()) {
      errors.tiktok = 'Set TIKTOK_ACCESS_TOKEN in env (TikTok Content Posting API)';
    } else {
      try {
        result.tiktok = await publishToTikTokPhoto(imageUrl, caption);
      } catch (err) {
        errors.tiktok = err instanceof Error ? err.message : 'TikTok publish failed';
      }
    }
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    last_publish_result: result,
    last_publish_error:
      Object.keys(errors).length > 0
        ? Object.entries(errors)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ')
        : null,
  };

  if (result.instagram) {
    update.instagram_published_at = now;
    update.instagram_media_id = result.instagram.mediaId;
  }
  if (result.tiktok) {
    update.tiktok_published_at = now;
    update.tiktok_publish_id = result.tiktok.publishId;
  }

  await service.from('social_content_drafts').update(update).eq('id', draftId);

  return result;
}
