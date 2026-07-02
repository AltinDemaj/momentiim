import { requireAdmin } from '@/lib/admin/auth';
import { adminLoginPath } from '@/lib/admin/access';
import { redirect } from 'next/navigation';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { countAutomatedDraftsToday } from '@/lib/social/draftQueries';
import { SOCIAL_PIPELINE_VERSION } from '@/lib/social/constants';
import { purgeLegacySocialDrafts } from '@/lib/social/purgeLegacyDrafts';
import { getBulletSteps, resolveDraftDisplayMeta } from '@/lib/social/variants';
import { SocialProductionHub } from './SocialProductionHub';
import type { SocialDraftCardData } from './SocialDraftCard';

export default async function AdminSocialPage() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    redirect(
      auth.status === 403 ? adminLoginPath('forbidden') : adminLoginPath()
    );
  }

  const service = createSupabaseServiceClient();
  await purgeLegacySocialDrafts();
  const automatedCountToday = await countAutomatedDraftsToday();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { count: mockupsThisWeek } = await service
    .from('social_content_drafts')
    .select('*', { count: 'exact', head: true })
    .gte('pipeline_version', SOCIAL_PIPELINE_VERSION)
    .gte('created_at', weekAgo.toISOString());

  const { data: drafts } = await service
    .from('social_content_drafts')
    .select(`
      id,
      status,
      scheduled_for,
      photo_ids,
      mockup_storage_path,
      email_sent_at,
      reviewed_at,
      created_at,
      source,
      concept_type,
      concept_label,
      headline_variant,
      template_variant,
      bullet_set_variant,
      anonymous_event_label,
      pipeline_version,
      instagram_published_at,
      tiktok_published_at,
      last_publish_error
    `)
    .gte('pipeline_version', SOCIAL_PIPELINE_VERSION)
    .neq('status', 'rejected')
    .order('created_at', { ascending: false })
    .limit(30);

  const withUrls: SocialDraftCardData[] = await Promise.all(
    (drafts ?? []).map(async (draft) => {
      let mockupUrl: string | null = null;
      if (draft.mockup_storage_path) {
        const { data } = await service.storage
          .from('social-drafts')
          .createSignedUrl(draft.mockup_storage_path, 3600);
        mockupUrl = data?.signedUrl ?? null;
      }

      const meta = resolveDraftDisplayMeta(draft);
      const bulletSetId = (draft.bullet_set_variant as string) ?? null;

      return {
        id: draft.id,
        status: draft.status as string,
        scheduledFor: draft.scheduled_for as string,
        mockupUrl,
        roomContextLabel: meta.roomContextLabel,
        templateCategory: meta.templateCategory,
        templateDisplayName: meta.templateDisplayName,
        templateLabel: meta.templateLabel,
        templateVariant: (draft.template_variant as string) ?? null,
        headlineVariant: (draft.headline_variant as string) ?? null,
        bulletSetVariant: bulletSetId,
        bulletSteps: getBulletSteps(bulletSetId),
        emailSentAt: draft.email_sent_at as string | null,
        source: (draft.source as string) ?? 'manual',
        instagramPublishedAt: draft.instagram_published_at as string | null,
        tiktokPublishedAt: draft.tiktok_published_at as string | null,
        lastPublishError: draft.last_publish_error as string | null,
      };
    })
  );

  return (
    <SocialProductionHub
      drafts={withUrls}
      automatedCountToday={automatedCountToday}
      mockupsThisWeek={mockupsThisWeek ?? 0}
    />
  );
}
