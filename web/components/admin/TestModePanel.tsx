'use client';

import { useState } from 'react';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { Button, Card } from '@/components/ui/admin-ui';

interface TestModePanelProps {
  eventId: string;
  testMode: boolean;
}

export function TestModePanel({ eventId, testMode: initial }: TestModePanelProps) {
  const [testMode, setTestMode] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggleTestMode() {
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/events/${eventId}/test-mode`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_mode: !testMode }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setTestMode(data.event.test_mode);
      setMessage(data.event.test_mode ? 'Test mode on — unlimited guest uploads.' : 'Test mode off — package limits apply.');
    } else {
      setMessage(data.error ?? 'Could not update test mode.');
    }
  }

  async function resetUploads() {
    if (!confirm('Delete ALL photos/videos for this event and reset guest quotas? Storage files remain until you purge the bucket.')) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/events/${eventId}/test-mode`, { method: 'POST' });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setMessage(`Reset complete — ${data.photos_deleted ?? 0} media rows cleared. Guests can shoot again.`);
    } else {
      setMessage(data.error ?? 'Reset failed.');
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 text-[color:var(--color-moment-accent)]">
        <FlaskConical className="h-4 w-4" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Test mode</h2>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-moment-muted)]">
        QA events only — guests get unlimited photos/reels. Production events should keep this off.
      </p>

      <label className="mt-4 flex cursor-pointer items-center justify-between gap-4">
        <span className="text-sm text-[color:var(--color-moment-text)]">Unlimited guest uploads</span>
        <input
          type="checkbox"
          checked={testMode}
          onChange={toggleTestMode}
          disabled={busy}
          className="h-4 w-4 accent-[color:var(--color-moment-accent)]"
        />
      </label>

      <Button
        variant="secondary"
        className="mt-4 w-full"
        type="button"
        onClick={resetUploads}
        disabled={busy}
      >
        <RotateCcw className="h-4 w-4" />
        {busy ? 'Working…' : 'Reset all uploads & guest quotas'}
      </Button>

      {message && <p className="mt-3 text-xs text-[color:var(--color-moment-success)]">{message}</p>}
    </Card>
  );
}
