'use client';

import { useState } from 'react';
import { Check, Download, Gift, ImageIcon, Lock, Send, Sparkles, Users } from 'lucide-react';
import type { SlideshowConfig, StudioPhoto, StudioStatus } from './types';
import { PUBLISH_MODES } from './types';

interface DeliverPanelProps {
  clientName: string | null;
  eventTitle: string;
  studioStatus: StudioStatus;
  deliveredAt: string | null;
  guestAlbumLive: boolean;
  approvedStaging: StudioPhoto[];
  timelineClipIds: string[];
  publishSelection: Set<string>;
  config: SlideshowConfig;
  busy: boolean;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeliverToClient: (opts: { openGuestRoom: boolean; note: string; photoIds?: string[] }) => void;
  onOpenGuestRoomOnly: () => void;
  onConfigChange: (patch: Partial<SlideshowConfig>) => void;
  onSaveConfig: () => void;
  onScan: () => void;
}

export function DeliverPanel({
  clientName,
  eventTitle,
  studioStatus,
  deliveredAt,
  guestAlbumLive,
  approvedStaging,
  timelineClipIds,
  publishSelection,
  config,
  busy,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onDeliverToClient,
  onOpenGuestRoomOnly,
  onConfigChange,
  onSaveConfig,
  onScan,
}: DeliverPanelProps) {
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [openGuestRoom, setOpenGuestRoom] = useState(false);

  const clientLabel = clientName ?? 'the client';
  const deliverCount =
    publishSelection.size > 0
      ? publishSelection.size
      : timelineClipIds.length > 0
        ? timelineClipIds.length
        : approvedStaging.length;

  async function exportZip() {
    setExportMsg('Preparing download links…');
    const urls = approvedStaging.map((p) => p.download_url).filter(Boolean);
    if (urls.length === 0) {
      setExportMsg('No approved items to export.');
      return;
    }
    for (const photo of approvedStaging) {
      if (photo.download_url) {
        window.open(photo.download_url, '_blank', 'noopener');
      }
    }
    setExportMsg(`Opened ${urls.length} items — save for handoff to ${clientLabel}.`);
  }

  function handleDeliver() {
    const photoIds =
      publishSelection.size > 0
        ? Array.from(publishSelection)
        : timelineClipIds.length > 0
          ? timelineClipIds
          : undefined;
    onDeliverToClient({ openGuestRoom, note: deliveryNote, photoIds });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[#C9A962]/25 bg-[#C9A962]/5 p-5">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A962]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#C9A962]">Momenti Im internal</p>
            <h2 className="mt-1 text-lg font-bold">Deliver album to client</h2>
            <p className="mt-2 text-sm text-white/55">
              You curate in Studio — {clientLabel} receives the finished album. Event guests only see it when
              you choose to open the guest room. Couples and hosts never access this editor.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <StatusPill label="Studio" value={studioStatusLabel(studioStatus)} />
          {deliveredAt && (
            <StatusPill
              label="Delivered to client"
              value={new Date(deliveredAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            />
          )}
          <StatusPill label="Guest album" value={guestAlbumLive ? 'Live' : 'Not open'} />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-white/80">Production workflow</h3>
        <ol className="mt-3 space-y-2 text-sm text-white/50">
          <li>1. Gallery — review & approve guest uploads</li>
          <li>2. Timeline — build slideshow (photos, videos, music)</li>
          <li>3. Cover — set album hero for {clientLabel}</li>
          <li>4. Deliver — hand off curated album below</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onScan}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            Smart scan
          </button>
          <button
            type="button"
            onClick={exportZip}
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10"
          >
            <Download className="h-4 w-4" />
            Export for handoff
          </button>
        </div>
        {exportMsg && <p className="mt-2 text-xs text-[#C9A962]">{exportMsg}</p>}
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">What the client receives</p>
        <select
          value={config.publish_mode}
          onChange={(e) => onConfigChange({ publish_mode: e.target.value })}
          className="w-full max-w-md rounded-xl bg-white/5 px-3 py-2.5 text-sm ring-1 ring-white/10"
        >
          {PUBLISH_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={config.hide_videos}
            onChange={(e) => onConfigChange({ hide_videos: e.target.checked })}
            className="accent-[#C9A962]"
          />
          Hide videos from client album
        </label>
        <button
          type="button"
          onClick={onSaveConfig}
          className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold ring-1 ring-white/15"
        >
          Save album settings
        </button>
      </section>

      <section className="space-y-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-[#C9A962]" />
          <h3 className="font-bold">Deliver &ldquo;{eventTitle}&rdquo; to {clientLabel}</h3>
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-white/45">Internal delivery note (optional)</span>
          <textarea
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            placeholder="e.g. Sent album link via WhatsApp, premium edit complete…"
            rows={2}
            className="w-full rounded-xl bg-black/30 px-3 py-2 text-sm ring-1 ring-white/10"
          />
        </label>

        <label className="flex items-start gap-3 rounded-xl bg-black/20 p-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={openGuestRoom}
            onChange={(e) => setOpenGuestRoom(e.target.checked)}
            className="mt-1 accent-[#C9A962]"
          />
          <span>
            <span className="font-semibold text-white/90">Also open guest album</span>
            <span className="mt-0.5 block text-xs text-white/45">
              All event guests can view the album in the app. Leave unchecked to deliver to {clientLabel} only
              first.
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy || deliverCount === 0}
            onClick={handleDeliver}
            className="inline-flex items-center gap-2 rounded-xl bg-[#C9A962] px-5 py-2.5 text-sm font-bold text-[#1A1612] disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            Deliver album to {clientLabel} ({deliverCount} items)
          </button>
          {deliveredAt && !guestAlbumLive && (
            <button
              type="button"
              disabled={busy}
              onClick={onOpenGuestRoomOnly}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold ring-1 ring-white/15 disabled:opacity-40"
            >
              <Users className="h-4 w-4" />
              Open guest album now
            </button>
          )}
          <button type="button" onClick={onSelectAll} className="text-xs font-semibold text-white/50 hover:text-white">
            Select all
          </button>
          <button type="button" onClick={onClearSelection} className="text-xs font-semibold text-white/50 hover:text-white">
            Clear
          </button>
        </div>

        <p className="text-[11px] text-white/35">
          Uses timeline order when set, otherwise all approved staging items. Timeline clips: {timelineClipIds.length}.
        </p>

        <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
          {approvedStaging.map((photo) => {
            const checked = publishSelection.has(photo.id);
            const onTimeline = timelineClipIds.includes(photo.id);
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => onToggleSelect(photo.id)}
                className={`relative aspect-square overflow-hidden rounded-lg ring-2 transition ${
                  checked ? 'ring-[#C9A962]' : onTimeline ? 'ring-white/25' : 'ring-transparent hover:ring-white/20'
                }`}
              >
                {photo.download_url ? (
                  photo.media_type === 'video' ? (
                    <video src={photo.download_url} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.download_url} alt="" className="h-full w-full object-cover" />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center bg-white/5">
                    <ImageIcon className="h-5 w-5 text-white/20" />
                  </div>
                )}
                {checked && (
                  <span className="absolute right-1 top-1 rounded-full bg-[#C9A962] p-0.5">
                    <Check className="h-3 w-3 text-[#1A1612]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {approvedStaging.length === 0 && (
          <p className="text-sm text-white/40">Approve items in Gallery and build the timeline first.</p>
        )}
      </section>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-black/30 px-3 py-1 ring-1 ring-white/10">
      <span className="text-white/40">{label}: </span>
      <span className="font-semibold text-white/80">{value}</span>
    </span>
  );
}

function studioStatusLabel(status: StudioStatus) {
  switch (status) {
    case 'collecting':
      return 'Collecting uploads';
    case 'in_studio':
      return 'In production';
    case 'delivered':
      return 'Delivered';
  }
}
