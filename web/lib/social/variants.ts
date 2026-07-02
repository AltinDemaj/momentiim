/** Three independent axes mixed on every generation (A × B × C). */

export type HeadlineId = 'h1' | 'h2' | 'h3' | 'h4';
export type TemplateId = 'benefits_showcase' | 'user_experience' | 'album_reveal';
export type BulletSetId = 'bullets_1' | 'bullets_2' | 'bullets_3';

export interface HeadlineVariant {
  id: HeadlineId;
  text: string;
}

export interface TemplateVariant {
  id: TemplateId;
  label: string;
  category: string;
  /** Sub-label shown on dashboard card */
  displayName: string;
}

export interface BulletSetVariant {
  id: BulletSetId;
  steps: [string, string, string];
}

/** Premium generic labels — never real client/event names. */
export const ANONYMOUS_EVENT_LABELS = [
  'Dasma Jonë',
  'Wedding Celebration',
  'Elegant Wedding',
  'Kujtimet e Festës',
  'Elegant Wedding Celebration',
] as const;

export const HEADLINE_VARIANTS: HeadlineVariant[] = [
  { id: 'h1', text: 'Zbuloni Festën përmes Syve të Mysafirëve.' },
  { id: 'h2', text: 'Çastet Tuaja të Çmuara në Kohë Reale.' },
  { id: 'h3', text: 'Një Përvojë Unike për Dasmën Tuaj.' },
  { id: 'h4', text: 'Çastet Tuaja të Çmuara, të Kapura nga të Gjithë.' },
];

export const TEMPLATE_VARIANTS: TemplateVariant[] = [
  {
    id: 'benefits_showcase',
    label: 'Event Hero Card',
    category: 'Educational / App Explainer',
    displayName: 'Home / Event Hero',
  },
  {
    id: 'user_experience',
    label: 'Camera Capture',
    category: 'Lifestyle / Staged Use Case',
    displayName: 'Camera Viewfinder',
  },
  {
    id: 'album_reveal',
    label: 'Keepsake Album',
    category: 'Educational / How It Works',
    displayName: 'Album kujtimesh',
  },
];

export const BULLET_SET_VARIANTS: BulletSetVariant[] = [
  {
    id: 'bullets_1',
    steps: [
      '1. Ruajini të gjitha fotot e mysafirëve në një vend.',
      '2. Merrni kënde unike që fotografi zyrtar mund t\'i humbasë.',
      '3. Shtoni një element interaktiv dhe argëtues në festën tuaj.',
    ],
  },
  {
    id: 'bullets_2',
    steps: [
      '1. Mysafirët bëhen pjesë e dokumentimit të festës.',
      '2. Ndani kënaqësinë e zbulimit të kujtimeve së bashku.',
      '3. Zbuloni fotot unike të kapura nga mysafirët.',
    ],
  },
  {
    id: 'bullets_3',
    steps: [
      '1. Zbuloni fotot unike dhe autentike të kapura nga mysafirët.',
      '2. Krijoni një album të vërtetë të festës suaj.',
      '3. Shkrepni pa kompresim — cilësi maksimale për çdo çast.',
    ],
  },
];

export interface SocialVariantSelection {
  headlineId: HeadlineId;
  templateId: TemplateId;
  bulletSetId: BulletSetId;
  headline: string;
  bullets: [string, string, string];
  templateLabel: string;
  templateCategory: string;
  templateDisplayName: string;
  anonymousEventLabel: string;
  roomContextLabel: string;
}

function pickOne<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function pickRandomAnonymousLabel(): string {
  return pickOne([...ANONYMOUS_EVENT_LABELS]);
}

export function formatRoomContext(label: string): string {
  return `${label} (Anonymous Private Room)`;
}

export interface PickVariantOptions {
  excludeTemplate?: TemplateId;
  excludeHeadline?: HeadlineId;
  excludeBulletSet?: BulletSetId;
}

/** Randomly mixes one choice from each layer on every call. */
export function pickRandomVariant(options: PickVariantOptions = {}): SocialVariantSelection {
  const headlinePool = options.excludeHeadline
    ? HEADLINE_VARIANTS.filter((h) => h.id !== options.excludeHeadline)
    : HEADLINE_VARIANTS;

  const templatePool = options.excludeTemplate
    ? TEMPLATE_VARIANTS.filter((t) => t.id !== options.excludeTemplate)
    : TEMPLATE_VARIANTS;

  const bulletPool = options.excludeBulletSet
    ? BULLET_SET_VARIANTS.filter((b) => b.id !== options.excludeBulletSet)
    : BULLET_SET_VARIANTS;

  const headline = pickOne(headlinePool);
  const template = pickOne(templatePool);
  const bullets = pickOne(bulletPool);
  const anonymousEventLabel = pickRandomAnonymousLabel();

  return {
    headlineId: headline.id,
    templateId: template.id,
    bulletSetId: bullets.id,
    headline: headline.text,
    bullets: bullets.steps,
    templateLabel: template.label,
    templateCategory: template.category,
    templateDisplayName: template.displayName,
    anonymousEventLabel,
    roomContextLabel: formatRoomContext(anonymousEventLabel),
  };
}

export function getTemplateVariant(id: string): TemplateVariant {
  const found = TEMPLATE_VARIANTS.find((t) => t.id === id);
  if (found) return found;

  const legacyMap: Record<string, TemplateId> = {
    qr_scan: 'album_reveal',
    app_explainer: 'benefits_showcase',
    staged_use_case: 'user_experience',
  };
  const mapped = legacyMap[id];
  if (mapped) return TEMPLATE_VARIANTS.find((t) => t.id === mapped)!;

  return TEMPLATE_VARIANTS[0];
}

export function getBulletSteps(id: string | null | undefined): [string, string, string] | null {
  if (!id) return null;
  const set = BULLET_SET_VARIANTS.find((b) => b.id === id);
  return set?.steps ?? null;
}

/** Resolve dashboard metadata from stored variant fields (with v2 fallback). */
export function resolveDraftDisplayMeta(draft: {
  template_variant?: string | null;
  concept_type?: string | null;
  concept_label?: string | null;
  anonymous_event_label?: string | null;
  headline_variant?: string | null;
  bullet_set_variant?: string | null;
}): {
  roomContextLabel: string;
  templateCategory: string;
  templateDisplayName: string;
  templateLabel: string;
} {
  const templateId =
    draft.template_variant ??
    (draft.concept_type as string | undefined);
  const template = getTemplateVariant(templateId ?? 'benefits_showcase');
  const anonymous = draft.anonymous_event_label ?? 'Wedding Celebration';

  return {
    roomContextLabel: formatRoomContext(anonymous),
    templateCategory: template.category,
    templateDisplayName: draft.concept_label ?? template.displayName,
    templateLabel: template.label,
  };
}
