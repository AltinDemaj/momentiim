'use client';

import { useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import type { StudioPhoto } from './types';

interface CoverCreatorProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  photos: StudioPhoto[];
  coverUrl: string | null;
  onCoverUpdated: (url: string | null) => void;
  onMessage: (msg: string) => void;
}

export function CoverCreator({
  eventId,
  eventTitle,
  eventDate,
  photos,
  coverUrl,
  onCoverUpdated,
  onMessage,
}: CoverCreatorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState(eventTitle);
  const [date, setDate] = useState(eventDate);
  const [uploading, setUploading] = useState(false);
  const [theme, setTheme] = useState('#C9A962');

  const candidates = useMemo(
    () => photos.filter((p) => p.media_type === 'photo' && p.moderation_status === 'approved'),
    [photos]
  );

  const previewPhoto = candidates.find((p) => p.id === selectedId) ?? candidates[0] ?? null;
  const previewUrl = previewPhoto?.download_url ?? coverUrl;

  async function saveCoverFromPhoto() {
    if (!previewPhoto?.download_url) return;
    setUploading(true);
    try {
      const res = await fetch(previewPhoto.download_url);
      const blob = await res.blob();
      const form = new FormData();
      form.append('file', blob, 'cover.jpg');
      const upload = await fetch(`/api/events/${eventId}/cover`, { method: 'POST', body: form });
      const data = await upload.json();
      if (upload.ok) {
        onCoverUpdated(data.cover_url ?? null);
        onMessage('Album cover saved.');
      } else {
        onMessage(data.error ?? 'Cover save failed.');
      }
    } catch {
      onMessage('Could not save cover.');
    }
    setUploading(false);
  }

  async function uploadCustom(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/events/${eventId}/cover`, { method: 'POST', body: form });
    const data = await res.json();
    if (res.ok) {
      onCoverUpdated(data.cover_url ?? null);
      onMessage('Cover uploaded.');
    } else {
      onMessage(data.error ?? 'Upload failed.');
    }
    setUploading(false);
    e.target.value = '';
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Album cover creator</h2>
        <p className="text-sm text-white/50">Choose a photo, add typography, and set the guest album hero.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-white/30">No cover selected</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="text-2xl font-extrabold tracking-tight" style={{ color: theme }}>
              {title}
            </p>
            <p className="mt-1 text-sm text-white/70">{date}</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-white/40">Event title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-white/40">Date label</span>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-white/40">Theme color</span>
            <input type="color" value={theme} onChange={(e) => setTheme(e.target.value)} className="h-10 w-full" />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading || !previewPhoto}
              onClick={saveCoverFromPhoto}
              className="rounded-xl bg-[#C9A962] px-4 py-2 text-sm font-bold text-[#1A1612] disabled:opacity-40"
            >
              {uploading ? 'Saving…' : 'Set as album cover'}
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/15 hover:bg-white/15">
              <Upload className="h-4 w-4" />
              Upload custom
              <input type="file" accept="image/*" className="hidden" onChange={uploadCustom} />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
        {candidates.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(p.id)}
            className={`aspect-square overflow-hidden rounded-lg ring-2 ${
              (selectedId ?? candidates[0]?.id) === p.id ? 'ring-[#C9A962]' : 'ring-transparent'
            }`}
          >
            {p.download_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.download_url} alt="" className="h-full w-full object-cover" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
