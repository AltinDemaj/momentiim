'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sparkles, Wand2, Mic, Scan, Film, Megaphone } from 'lucide-react';
import { Button, Card } from '@/components/ui/admin-ui';

interface ChallengeRow {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface GuestFeaturesPanelProps {
  eventId: string;
}

export function GuestFeaturesPanel({ eventId }: GuestFeaturesPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [newChallenge, setNewChallenge] = useState('');

  const [brandingLabel, setBrandingLabel] = useState('');
  const [celebrationType, setCelebrationType] = useState<
    'wedding' | 'engagement' | 'birthday' | 'anniversary' | 'party' | 'general'
  >('general');
  const [cameraFilter, setCameraFilter] = useState<'none' | 'gala' | 'vintage'>('gala');
  const [showReferralBanner, setShowReferralBanner] = useState(true);
  const [featureScavengerHunt, setFeatureScavengerHunt] = useState(true);
  const [featureAudioGuestbook, setFeatureAudioGuestbook] = useState(true);
  const [featureFaceSearch, setFeatureFaceSearch] = useState(true);
  const [featureCameraFilters, setFeatureCameraFilters] = useState(true);
  const [featureSocialReel, setFeatureSocialReel] = useState(true);
  const [socialReelReady, setSocialReelReady] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [generatingReel, setGeneratingReel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/features`);
    const data = await res.json();
    if (res.ok) {
      const e = data.event;
      setBrandingLabel(e.branding_label ?? '');
      setCelebrationType(e.celebration_type ?? 'general');
      setCameraFilter(e.camera_filter ?? 'gala');
      setShowReferralBanner(e.show_referral_banner ?? true);
      setFeatureScavengerHunt(e.feature_scavenger_hunt ?? true);
      setFeatureAudioGuestbook(e.feature_audio_guestbook ?? true);
      setFeatureFaceSearch(e.feature_face_search ?? true);
      setFeatureCameraFilters(e.feature_camera_filters ?? true);
      setFeatureSocialReel(e.feature_social_reel ?? true);
      setSocialReelReady(e.social_reel_ready ?? false);
      setChallenges(data.challenges ?? []);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveFeatures() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/events/${eventId}/features`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branding_label: brandingLabel.trim() || null,
        celebration_type: celebrationType,
        camera_filter: cameraFilter,
        show_referral_banner: showReferralBanner,
        feature_scavenger_hunt: featureScavengerHunt,
        feature_audio_guestbook: featureAudioGuestbook,
        feature_face_search: featureFaceSearch,
        feature_camera_filters: featureCameraFilters,
        feature_social_reel: featureSocialReel,
      }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(res.ok ? 'Guest features saved.' : data.error ?? 'Save failed');
  }

  async function seedChallenges() {
    const res = await fetch(`/api/events/${eventId}/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed_challenges' }),
    });
    const data = await res.json();
    if (res.ok) setChallenges(data.challenges ?? []);
  }

  async function addChallenge() {
    if (!newChallenge.trim()) return;
    const res = await fetch(`/api/events/${eventId}/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newChallenge.trim() }),
    });
    const data = await res.json();
    if (res.ok && data.challenge) {
      setChallenges((prev) => [...prev, data.challenge]);
      setNewChallenge('');
    }
  }

  async function indexFaces() {
    setIndexing(true);
    const res = await fetch(`/api/events/${eventId}/face-search`, { method: 'POST' });
    const data = await res.json();
    setIndexing(false);
    setMessage(res.ok ? `Indexed ${data.indexed} photos for Find My Photos.` : data.error);
  }

  async function generateReel() {
    setGeneratingReel(true);
    const res = await fetch(`/api/events/${eventId}/social-reel`, { method: 'POST' });
    const data = await res.json();
    setGeneratingReel(false);
    if (res.ok) {
      setSocialReelReady(true);
      setMessage(`Social reel ready — ${data.reel?.clip_ids?.length ?? 0} clips.`);
    } else {
      setMessage(data.error ?? 'Reel generation failed');
    }
  }

  function Toggle({
    label,
    hint,
    checked,
    onChange,
    icon: Icon,
  }: {
    label: string;
    hint: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    icon?: typeof Sparkles;
  }) {
    return (
      <label className="flex cursor-pointer items-start justify-between gap-4 py-2.5">
        <span className="flex gap-3">
          {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-moment-accent)]" /> : null}
          <span>
            <span className="block text-sm font-medium text-[color:var(--color-moment-text)]">{label}</span>
            <span className="mt-0.5 block text-xs text-[color:var(--color-moment-muted)]">{hint}</span>
          </span>
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[color:var(--color-moment-accent)]"
        />
      </label>
    );
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-[color:var(--color-moment-muted)]">Loading guest features…</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2 text-[color:var(--color-moment-accent)]">
        <Sparkles className="h-4 w-4" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Guest experience</h2>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-moment-muted)]">
        All features are free for guests — toggle what appears in the mobile app for this event.
      </p>

      <div className="mt-4 space-y-1 divide-y divide-[color:var(--color-moment-border)]">
        <Toggle
          icon={Wand2}
          label="I Spy scavenger hunt"
          hint="10-item photo checklist — guests play during the party"
          checked={featureScavengerHunt}
          onChange={setFeatureScavengerHunt}
        />
        <Toggle
          icon={Mic}
          label="Audio guestbook"
          hint="Voice messages for the couple — separate from photo limits"
          checked={featureAudioGuestbook}
          onChange={setFeatureAudioGuestbook}
        />
        <Toggle
          icon={Scan}
          label="Find My Photos"
          hint="Selfie search across the guest album"
          checked={featureFaceSearch}
          onChange={setFeatureFaceSearch}
        />
        <Toggle
          icon={Wand2}
          label="Camera filters & stickers"
          hint="Snapchat-style lens carousel + event congrats overlay"
          checked={featureCameraFilters}
          onChange={setFeatureCameraFilters}
        />
        <Toggle
          icon={Film}
          label="Social reel export"
          hint="15-clip vertical recap for Instagram/TikTok"
          checked={featureSocialReel}
          onChange={setFeatureSocialReel}
        />
        <Toggle
          icon={Megaphone}
          label="Powered by banner"
          hint="Referral strip on camera & album screens"
          checked={showReferralBanner}
          onChange={setShowReferralBanner}
        />
      </div>

      <div className="mt-5 space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--color-moment-muted)]">
          Celebration type
        </label>
        <select
          value={celebrationType}
          onChange={(e) =>
            setCelebrationType(
              e.target.value as
                | 'wedding'
                | 'engagement'
                | 'birthday'
                | 'anniversary'
                | 'party'
                | 'general'
            )
          }
          className="w-full rounded-[12px] border border-[color:var(--color-moment-border)] bg-[color:var(--color-moment-bg-secondary)] px-3 py-2.5 text-sm text-[color:var(--color-moment-text)]"
        >
          <option value="wedding">Wedding — congrats sticker for the couple</option>
          <option value="engagement">Engagement</option>
          <option value="birthday">Birthday</option>
          <option value="anniversary">Anniversary</option>
          <option value="party">Party</option>
          <option value="general">General celebration</option>
        </select>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--color-moment-muted)]">
          Viewfinder watermark
        </label>
        <input
          value={brandingLabel}
          onChange={(e) => setBrandingLabel(e.target.value)}
          placeholder="Sara & Tin — 01.07.2026"
          className="w-full rounded-[12px] border border-[color:var(--color-moment-border)] bg-[color:var(--color-moment-bg-secondary)] px-3 py-2.5 text-sm text-[color:var(--color-moment-text)]"
        />
        <select
          value={cameraFilter}
          onChange={(e) => setCameraFilter(e.target.value as 'none' | 'gala' | 'vintage')}
          className="w-full rounded-[12px] border border-[color:var(--color-moment-border)] bg-[color:var(--color-moment-bg-secondary)] px-3 py-2.5 text-sm text-[color:var(--color-moment-text)]"
        >
          <option value="gala">Gala — Hollywood B&W glow</option>
          <option value="vintage">Vintage — warm film tone</option>
          <option value="none">None</option>
        </select>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" type="button" onClick={indexFaces} disabled={indexing}>
          {indexing ? 'Indexing…' : 'Index photos for search'}
        </Button>
        <Button variant="secondary" type="button" onClick={generateReel} disabled={generatingReel}>
          {generatingReel ? 'Building reel…' : socialReelReady ? 'Regenerate social reel' : 'Generate social reel'}
        </Button>
      </div>

      <div className="mt-6 border-t border-[color:var(--color-moment-border)] pt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-moment-muted)]">
          Scavenger hunt items ({challenges.length})
        </p>
        <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm text-[color:var(--color-moment-text-secondary)]">
          {challenges.map((c) => (
            <li key={c.id}>· {c.title}</li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            value={newChallenge}
            onChange={(e) => setNewChallenge(e.target.value)}
            placeholder="Add custom challenge…"
            className="min-w-0 flex-1 rounded-[12px] border border-[color:var(--color-moment-border)] bg-[color:var(--color-moment-bg-secondary)] px-3 py-2 text-sm"
          />
          <Button variant="secondary" type="button" onClick={addChallenge}>
            Add
          </Button>
        </div>
        {challenges.length === 0 && (
          <Button variant="secondary" className="mt-2 w-full" type="button" onClick={seedChallenges}>
            Load default wedding checklist
          </Button>
        )}
      </div>

      {message && <p className="mt-3 text-xs text-[color:var(--color-moment-success)]">{message}</p>}

      <Button variant="secondary" className="mt-4 w-full" type="button" onClick={saveFeatures} disabled={saving}>
        {saving ? 'Saving…' : 'Save guest features'}
      </Button>
    </Card>
  );
}
