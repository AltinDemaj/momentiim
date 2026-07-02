import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { generateSocialDraft } from '@/lib/social/generateDraft';
import type { TemplateId } from '@/lib/social/variants';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const service = createSupabaseServiceClient();

  const { data: current } = await service
    .from('social_content_drafts')
    .select('template_variant, concept_type, headline_variant, bullet_set_variant')
    .eq('id', id)
    .maybeSingle();

  await service
    .from('social_content_drafts')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', id);

  try {
    const templateId = (current?.template_variant ?? current?.concept_type) as TemplateId | undefined;
    const result = await generateSocialDraft({
      source: 'manual',
      sendEmail: false,
      excludeVariant: {
        excludeTemplate: templateId,
        excludeHeadline: current?.headline_variant as never,
        excludeBulletSet: current?.bullet_set_variant as never,
      },
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Regenerate failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
