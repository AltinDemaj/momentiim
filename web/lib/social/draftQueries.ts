import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function countAutomatedDraftsToday(): Promise<number> {
  const service = createSupabaseServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await service
    .from('social_content_drafts')
    .select('id', { count: 'exact', head: true })
    .eq('scheduled_for', today)
    .eq('source', 'cron');
  return count ?? 0;
}
