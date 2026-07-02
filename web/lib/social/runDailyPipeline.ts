import { generateSocialDraft } from '@/lib/social/generateDraft';

export interface DailySocialResult {
  skipped?: boolean;
  reason?: string;
  draftId?: string;
  photoIds?: string[];
  conceptType?: string;
  conceptLabel?: string;
}

/** Cron entrypoint — exactly one automated draft per day, emails on create. */
export async function runDailySocialPipeline(): Promise<DailySocialResult> {
  return generateSocialDraft({ source: 'cron', sendEmail: true });
}
