import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { SOCIAL_PIPELINE_VERSION } from '@/lib/social/constants';

const DRAFT_BUCKET = 'social-drafts';

/** Remove legacy v1 pending drafts so the queue only shows unified story assets. */
export async function purgeLegacySocialDrafts(): Promise<number> {
  const service = createSupabaseServiceClient();

  const { data: legacy } = await service
    .from('social_content_drafts')
    .select('id, mockup_storage_path')
    .lt('pipeline_version', SOCIAL_PIPELINE_VERSION)
    .eq('status', 'pending');

  if (!legacy?.length) return 0;

  const paths = legacy
    .map((d) => d.mockup_storage_path)
    .filter((p): p is string => !!p);

  if (paths.length) {
    await service.storage.from(DRAFT_BUCKET).remove(paths);
  }

  await service
    .from('social_content_drafts')
    .delete()
    .in(
      'id',
      legacy.map((d) => d.id)
    );

  return legacy.length;
}
