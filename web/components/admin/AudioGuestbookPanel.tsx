'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Pause, Play, Trash2 } from 'lucide-react';
import { Button, Card } from '@/components/ui/admin-ui';

interface AudioRow {
  id: string;
  guest_id: string;
  duration_ms: number;
  created_at: string;
  url: string | null;
}

interface AudioGuestbookPanelProps {
  eventId: string;
}

function formatDuration(ms: number) {
  const sec = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export function AudioGuestbookPanel({ eventId }: AudioGuestbookPanelProps) {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<AudioRow[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/audio-guestbook`);
    const data = await res.json();
    if (res.ok) setMessages(data.messages ?? []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
    return () => {
      audioRef.current?.pause();
    };
  }, [load]);

  async function deleteMessage(row: AudioRow) {
    if (!confirm('Delete this voice message?')) return;
    const res = await fetch(`/api/events/${eventId}/audio-guestbook/${row.id}`, { method: 'DELETE' });
    if (res.ok) {
      if (playingId === row.id) {
        audioRef.current?.pause();
        setPlayingId(null);
      }
      await load();
    }
  }

  function togglePlay(row: AudioRow) {
    if (!row.url) return;

    if (playingId === row.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setPlayingId(null);
    }

    audioRef.current.src = row.url;
    audioRef.current.play().catch(() => setPlayingId(null));
    setPlayingId(row.id);
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[color:var(--color-moment-accent)]">
          <Mic className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Voice guestbook</h2>
        </div>
        <Button variant="secondary" type="button" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-moment-muted)]">
        Listen to voice messages guests leave for the couple.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-[color:var(--color-moment-muted)]">Loading messages…</p>
      ) : messages.length === 0 ? (
        <p className="mt-4 text-sm text-[color:var(--color-moment-muted)]">No voice messages yet.</p>
      ) : (
        <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto">
          {messages.map((row) => (
            <li
              key={row.id}
              className="flex items-center gap-3 rounded-[12px] border border-[color:var(--color-moment-border)] bg-[color:var(--color-moment-bg-secondary)] px-3 py-2.5"
            >
              <button
                type="button"
                onClick={() => togglePlay(row)}
                disabled={!row.url}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-moment-accent-dim)] text-[color:var(--color-moment-accent)] disabled:opacity-40"
              >
                {playingId === row.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[color:var(--color-moment-text)]">
                  Guest message
                </p>
                <p className="text-xs text-[color:var(--color-moment-muted)]">
                  {formatDuration(row.duration_ms)} · {new Date(row.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteMessage(row)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-moment-border)] text-[color:var(--color-moment-muted)] hover:text-red-400"
                aria-label="Delete message"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
