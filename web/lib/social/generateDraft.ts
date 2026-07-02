import crypto from 'crypto';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { generateUnifiedStory } from '@/lib/social/generateUnifiedStory';
import { sendSocialApprovalEmail } from '@/lib/social/sendApprovalEmail';
import { SOCIAL_PIPELINE_VERSION } from '@/lib/social/constants';
import {
  pickRandomVariant,
  type PickVariantOptions,
  type SocialVariantSelection,
  type TemplateId,
} from '@/lib/social/variants';

const DRAFT_BUCKET = 'social-drafts';

/** Maps v3 template IDs to legacy enum for concept_type column compatibility. */
function legacyConceptType(templateId: TemplateId): 'qr_scan' | 'app_explainer' | 'staged_use_case' {
  switch (templateId) {
    case 'benefits_showcase':
      return 'app_explainer';
    case 'user_experience':
      return 'staged_use_case';
    case 'album_reveal':
      return 'qr_scan';
  }
}

export type DraftSource = 'cron' | 'manual';

export interface GenerateDraftOptions {
  source: DraftSource;
  sendEmail?: boolean;
  excludeVariant?: PickVariantOptions;
  forceVariant?: SocialVariantSelection;
}

export interface GenerateDraftResult {
  skipped?: boolean;
  reason?: string;
  draftId?: string;
  photoIds?: string[];
  templateId?: TemplateId;
  templateLabel?: string;
  headlineId?: string;
  bulletSetId?: string;
  roomContextLabel?: string;
}

async function resolveEventId(): Promise<string | null> {
  const service = createSupabaseServiceClient();

  const { data: withPhotos } = await service
    .from('events')
    .select('id')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10);

  for (const row of withPhotos ?? []) {
    const { count } = await service
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', row.id)
      .eq('status', 'published')
      .eq('moderation_status', 'approved');
    if ((count ?? 0) > 0) return row.id;
  }

  const { data: fallback } = await service
    .from('events')
    .select('id')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return fallback?.id ?? null;
}

export async function generateSocialDraft(
  options: GenerateDraftOptions
): Promise<GenerateDraftResult> {
  const service = createSupabaseServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  if (options.source === 'cron') {
    const { data: existing } = await service
      .from('social_content_drafts')
      .select('id')
      .eq('scheduled_for', today)
      .eq('source', 'cron')
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existing) {
      return { skipped: true, reason: 'Automated cron draft already created today' };
    }
  }

  const eventId = await resolveEventId();
  if (!eventId) {
    return { skipped: true, reason: 'No active events found' };
  }

  const variant = options.forceVariant ?? pickRandomVariant(options.excludeVariant ?? {});

  const mockupBuffer = await generateUnifiedStory({ variant });

  const mockupPath = `${today}/${crypto.randomUUID()}.png`;
  const { error: uploadError } = await service.storage
    .from(DRAFT_BUCKET)
    .upload(mockupPath, mockupBuffer, {
      contentType: 'image/png',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Mockup upload failed: ${uploadError.message}`);
  }

  const { data: draft, error: insertError } = await service
    .from('social_content_drafts')
    .insert({
      event_id: eventId,
      photo_ids: [],
      mockup_storage_path: mockupPath,
      status: 'pending',
      scheduled_for: today,
      source: options.source,
      concept_type: legacyConceptType(variant.templateId),
      concept_label: variant.templateDisplayName,
      headline_variant: variant.headlineId,
      template_variant: variant.templateId,
      bullet_set_variant: variant.bulletSetId,
      anonymous_event_label: variant.anonymousEventLabel,
      pipeline_version: SOCIAL_PIPELINE_VERSION,
    })
    .select('id')
    .single();

  if (insertError || !draft) {
    throw new Error(insertError?.message ?? 'Failed to create draft');
  }

  const shouldEmail = options.sendEmail ?? options.source === 'cron';
  if (shouldEmail) {
    await sendSocialApprovalEmail({
      draftId: draft.id,
      roomContextLabel: variant.roomContextLabel,
      mockupBuffer,
      templateLabel: variant.templateLabel,
      templateCategory: variant.templateCategory,
    });

    await service
      .from('social_content_drafts')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', draft.id);
  }

  return {
    draftId: draft.id,
    photoIds: [],
    templateId: variant.templateId,
    templateLabel: variant.templateDisplayName,
    headlineId: variant.headlineId,
    bulletSetId: variant.bulletSetId,
    roomContextLabel: variant.roomContextLabel,
  };
}

export async function approveAndEmailDraft(draftId: string): Promise<void> {
  const service = createSupabaseServiceClient();

  const { data: draft, error } = await service
    .from('social_content_drafts')
    .select(`
      id,
      mockup_storage_path,
      photo_ids,
      concept_label,
      concept_type,
      template_variant,
      anonymous_event_label,
      headline_variant,
      bullet_set_variant
    `)
    .eq('id', draftId)
    .maybeSingle();

  if (error || !draft?.mockup_storage_path) {
    throw new Error('Draft not found');
  }

  const { data: file } = await service.storage
    .from(DRAFT_BUCKET)
    .download(draft.mockup_storage_path);

  if (!file) throw new Error('Mockup file missing');

  const mockupBuffer = Buffer.from(await file.arrayBuffer());
  const { resolveDraftDisplayMeta } = await import('@/lib/social/variants');
  const meta = resolveDraftDisplayMeta(draft);

  await sendSocialApprovalEmail({
    draftId: draft.id,
    roomContextLabel: meta.roomContextLabel,
    mockupBuffer,
    templateLabel: meta.templateLabel,
    templateCategory: meta.templateCategory,
  });

  await service
    .from('social_content_drafts')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      email_sent_at: new Date().toISOString(),
    })
    .eq('id', draftId);
}

export async function deleteSocialDraft(draftId: string): Promise<void> {
  const service = createSupabaseServiceClient();

  const { data: draft } = await service
    .from('social_content_drafts')
    .select('mockup_storage_path')
    .eq('id', draftId)
    .maybeSingle();

  if (draft?.mockup_storage_path) {
    await service.storage.from(DRAFT_BUCKET).remove([draft.mockup_storage_path]);
  }

  await service.from('social_content_drafts').delete().eq('id', draftId);
}
