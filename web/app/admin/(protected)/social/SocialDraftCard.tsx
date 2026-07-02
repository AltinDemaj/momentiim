'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMockupGlow } from './useMockupGlow';

export interface SocialDraftCardData {
  id: string;
  status: string;
  scheduledFor: string;
  mockupUrl: string | null;
  roomContextLabel: string;
  templateCategory: string;
  templateDisplayName: string;
  templateLabel: string;
  templateVariant: string | null;
  headlineVariant: string | null;
  bulletSetVariant: string | null;
  bulletSteps: [string, string, string] | null;
  emailSentAt: string | null;
  source: string;
  instagramPublishedAt: string | null;
  tiktokPublishedAt: string | null;
  lastPublishError: string | null;
}

export function SocialDraftCard({
  draft,
  index: _index,
}: {
  draft: SocialDraftCardData;
  index?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const glowRgb = useMockupGlow(draft.mockupUrl, draft.templateVariant);

  async function runAction(action: 'approve' | 'regenerate' | 'delete' | 'publish') {
    setLoading(action);
    setError(null);
    setPublishMessage(null);
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/admin/social/${draft.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Delete failed');
      } else if (action === 'publish') {
        const res = await fetch(`/api/admin/social/${draft.id}/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platforms: ['instagram', 'tiktok'] }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Publish failed');

        const parts: string[] = [];
        if (data.instagram?.mediaId) parts.push(`IG Story ✓`);
        if (data.tiktok?.publishId) parts.push(`TikTok ✓`);
        if (data.errors?.instagram) parts.push(`IG: ${data.errors.instagram}`);
        if (data.errors?.tiktok) parts.push(`TikTok: ${data.errors.tiktok}`);
        if (data.warnings?.length) parts.push(data.warnings.join(' '));

        setPublishMessage(parts.join(' · ') || (data.ok ? 'Published' : 'Publish finished with errors'));
        router.refresh();
      } else {
        const res = await fetch(`/api/admin/social/${draft.id}/${action}`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Action failed');
        router.refresh();
      }
      if (action !== 'publish') router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(null);
    }
  }

  const canPublish = !!draft.mockupUrl;

  return (
    <article className="group relative transition-all duration-500 hover:-translate-y-2">
      <div
        className="pointer-events-none absolute -inset-4 rounded-[28px] opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, rgba(${glowRgb}, 0.22), transparent 70%)`,
        }}
      />

      <div className="relative overflow-hidden rounded-[18px] border border-neutral-900 bg-[#111113] shadow-[0_16px_48px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:border-neutral-800 group-hover:shadow-[0_20px_50px_rgba(217,119,6,0.05)]">
        <div className="overflow-hidden">
          {draft.mockupUrl ? (
            <img
              src={draft.mockupUrl}
              alt={`${draft.templateDisplayName} mockup`}
              className="aspect-[9/16] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex aspect-[9/16] items-center justify-center bg-neutral-950 text-sm text-neutral-600">
              No preview
            </div>
          )}
        </div>

        <div className="border-t border-neutral-900 bg-neutral-950/40 p-6">
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={draft.status} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
              {draft.source === 'cron' ? 'Automated' : 'Manual'}
            </span>
          </div>

          <p className="mt-4 text-sm font-medium tracking-wide text-neutral-100">
            {draft.roomContextLabel}
          </p>
          <p className="mt-1 text-[11px] tracking-wide text-neutral-600">
            {draft.templateCategory} · {draft.templateDisplayName}
          </p>

          {draft.bulletSteps && (
            <ul className="mt-5 space-y-2 border-t border-neutral-900/80 pt-5">
              {draft.bulletSteps.map((step) => (
                <li
                  key={step}
                  className="text-xs leading-relaxed tracking-wide text-neutral-400"
                >
                  {step}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 space-y-3">
            {(draft.instagramPublishedAt || draft.tiktokPublishedAt) && (
              <div className="space-y-1 text-[10px] tracking-wide text-neutral-600">
                {draft.instagramPublishedAt && (
                  <p>IG · {new Date(draft.instagramPublishedAt).toLocaleString()}</p>
                )}
                {draft.tiktokPublishedAt && (
                  <p>TikTok · {new Date(draft.tiktokPublishedAt).toLocaleString()}</p>
                )}
              </div>
            )}

            {draft.lastPublishError && (
              <p className="text-[11px] text-amber-400/90">{draft.lastPublishError}</p>
            )}

            {canPublish && (
              <button
                type="button"
                disabled={!!loading}
                onClick={() => runAction('publish')}
                className="w-full rounded-[10px] border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-amber-200/90 disabled:opacity-50"
              >
                {loading === 'publish' ? 'Publishing…' : 'Publish to IG & TikTok (Test)'}
              </button>
            )}

            {publishMessage && (
              <p className="text-[11px] text-emerald-400/90">{publishMessage}</p>
            )}

            {draft.status === 'pending' && (
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  disabled={!!loading}
                  onClick={() => runAction('approve')}
                  className="rounded-[10px] bg-[#C9A96E] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#111] disabled:opacity-50"
                >
                  {loading === 'approve' ? 'Sending…' : 'Approve & Send to Gmail'}
                </button>
                <button
                  type="button"
                  disabled={!!loading}
                  onClick={() => runAction('regenerate')}
                  className="rounded-[10px] border border-neutral-800 bg-neutral-900/60 px-3 py-2.5 text-[11px] font-medium tracking-wide text-neutral-300 disabled:opacity-50"
                >
                  {loading === 'regenerate' ? 'Cycling…' : 'Cycle variant'}
                </button>
                <button
                  type="button"
                  disabled={!!loading}
                  onClick={() => runAction('delete')}
                  className="rounded-[10px] px-3 py-2 text-[11px] font-medium tracking-wide text-red-400/90 hover:bg-red-500/5 disabled:opacity-50"
                >
                  {loading === 'delete' ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            )}

            {draft.status === 'approved' && draft.mockupUrl && (
              <a
                href={draft.mockupUrl}
                download
                className="inline-block text-[11px] tracking-wide text-[#C9A96E]/80 hover:text-[#C9A96E]"
              >
                Download mockup →
              </a>
            )}

            {error && <p className="text-[11px] text-red-400">{error}</p>}
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:
      'border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    approved:
      'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.15)]',
    rejected:
      'border-red-500/40 bg-red-500/10 text-red-300 shadow-[0_0_12px_rgba(248,113,113,0.12)]',
    skipped: 'border-neutral-700/50 bg-neutral-800/30 text-neutral-500',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${styles[status] ?? styles.pending}`}
    >
      {status}
    </span>
  );
}
