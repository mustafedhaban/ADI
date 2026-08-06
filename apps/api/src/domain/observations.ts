/* ---------------------------------------------------------------------------
   Structured visual observations.

   An observation is one objectively checkable statement about a captured
   reference: "this page has a left sidebar", "body copy is set in a serif",
   "there is an Ask AI button". Three properties make it useful:

   1. It is drawn from a controlled vocabulary, so the same trait recorded on
      two references is literally the same value and can be counted, compared
      and grouped. Free text cannot do this.
   2. It carries provenance, so a fact read off a screenshot is never confused
      with a conclusion drawn from it or a note somebody typed.
   3. It can point at the asset it came from, so any claim is traceable back to
      the pixels that justify it.

   This is the layer AI Research and Design DNA should read instead of
   re-analysing screenshots: the expensive vision work happens once, here.

   The vocabulary is deliberately closed, exactly like `taxonomy.ts`. An unknown
   trait is an error, not a new term — that is what keeps the data queryable.
--------------------------------------------------------------------------- */

export const OBSERVATION_CATEGORIES = [
  "navigation",
  "search",
  "layout",
  "typography",
  "content",
  "interaction",
  "density",
  "ai",
  "conversion",
  "accessibility",
  "media",
  "theme",
] as const;

export type ObservationCategory = (typeof OBSERVATION_CATEGORIES)[number];

/**
 * Provenance is the heart of the model.
 *
 * `observed`  — visible in a captured asset. The source of truth.
 * `inferred`  — a conclusion drawn from observations. Never a substitute for one.
 * `authored`  — written by a person. Opinion, context, intent.
 *
 * Aggregations across the library count `observed` only unless asked otherwise,
 * so inference can never quietly become evidence.
 */
export const PROVENANCES = ["observed", "inferred", "authored"] as const;
export type Provenance = (typeof PROVENANCES)[number];

export const CATEGORY_LABELS: Record<ObservationCategory, string> = {
  navigation: "Navigation system",
  search: "Search behaviour",
  layout: "Layout structure",
  typography: "Typography",
  content: "Content organisation",
  interaction: "Interaction patterns",
  density: "Visual density",
  ai: "AI-assisted features",
  conversion: "Conversion patterns",
  accessibility: "Accessibility cues",
  media: "Imagery and media",
  theme: "Theme and colour",
};

/**
 * The trait vocabulary. Every entry names something a person can point at in a
 * screenshot and agree on — no aesthetic judgements, no intent, no quality
 * ratings. "Left sidebar" qualifies. "Elegant" does not.
 */
export const TRAITS: Record<ObservationCategory, readonly string[]> = {
  navigation: [
    "Left Sidebar",
    "Right Rail",
    "Top Horizontal Nav",
    "Mega Menu",
    "Sticky Header",
    "Breadcrumbs",
    "On This Page TOC",
    "Grouped Sidebar Sections",
    "Version Selector",
    "Language Selector",
    "Floating Nav Controls",
    "Doc Type Tab Switcher",
    "Filter Field In Navigation",
    "Numbered Chapter List",
    "Prev Next Pagination",
    "Product List As Nav",
    "Announcement Bar",
    "Minimal Chrome",
  ],
  search: [
    "Header Search Field",
    "Keyboard Shortcut Hint",
    "Search As Primary Action",
    "Faceted Filters",
    "Filter Rail",
    "Sort Controls",
    "Result Count Displayed",
    "Inline Suggestions",
    "Scoped Search Selector",
  ],
  layout: [
    "Single Column Centered",
    "Two Column",
    "Three Column",
    "Full Bleed Hero",
    "Split Hero",
    "Card Grid",
    "Plain Link Directory",
    "Logo Tile Grid",
    "Masonry Grid",
    "Narrow Reading Measure",
    "Asymmetric Composition",
    "Bordered Panels",
    "Rule Separated Sections",
  ],
  typography: [
    "Serif Body",
    "Sans Body",
    "Monospace Accent",
    "Display Scale Heading",
    "Uppercase Eyebrow",
    "Tabular Numerals",
    "Mixed Serif And Sans",
    "Oversized Type",
    "Tight Tracking",
    "Wide Tracking",
  ],
  content: [
    "Numbered Steps",
    "Tabbed Content",
    "Accordion",
    "Callout Box",
    "Code Panel Pairing",
    "Version Notice",
    "Inline Code Samples",
    "Comparison Table",
    "Statistics Block",
    "Timeline",
    "FAQ Block",
  ],
  interaction: [
    "Copy To Clipboard Button",
    "Theme Toggle",
    "Language Toggle",
    "Package Manager Switcher",
    "API Preference Toggle",
    "Live Demo Embed",
    "Interactive Sandbox",
    "Hover Reveal",
    "Scroll Animation",
    "Video Playback",
  ],
  density: ["Low Density", "Medium Density", "High Density"],
  ai: [
    "Ask AI Button",
    "Copy Prompt",
    "Copy As Markdown",
    "AI Prompt Quickstart",
    "AI Blended Search",
    "Agent Setup Instructions",
    "AI Tool Icons Shown",
  ],
  conversion: [
    "Primary CTA Button",
    "Secondary CTA Link",
    "Signup In Header",
    "Pricing Link",
    "Newsletter Signup",
    "Sponsor Grid",
    "Advertising Slot",
    "Donation Appeal",
    "Social Proof Logos",
    "Contributor Wall",
    "Star Or Usage Count",
  ],
  accessibility: [
    "Visible Focus Ring",
    "Skip Link",
    "High Contrast Text",
    "Low Contrast Text",
    "Keyboard Shortcut Documented",
    "Reduced Motion Option",
    "Text Over Image Without Scrim",
    "Consent Banner Present",
  ],
  media: [
    "Documentary Photography",
    "Flat Illustration",
    "3D Render",
    "Video Background",
    "Product Screenshot",
    "Avatar Grid",
    "Abstract Gradient",
    "Pixel Art",
    "Line Art Texture",
    "Diagram",
    "No Imagery",
  ],
  theme: [
    "Light Theme",
    "Dark Theme",
    "Dark Shell Light Body",
    "Monochrome Palette",
    "Single Accent Colour",
    "Multi Colour Palette",
    "Tinted Ground",
  ],
};

export const categorySet = new Set<string>(OBSERVATION_CATEGORIES);
export const provenanceSet = new Set<string>(PROVENANCES);

/** category -> Set of traits, for O(1) validation. */
export const traitSets: Record<ObservationCategory, Set<string>> =
  Object.fromEntries(
    OBSERVATION_CATEGORIES.map((c) => [c, new Set(TRAITS[c])]),
  ) as Record<ObservationCategory, Set<string>>;

export function isCategory(value: unknown): value is ObservationCategory {
  return typeof value === "string" && categorySet.has(value);
}

export function isProvenance(value: unknown): value is Provenance {
  return typeof value === "string" && provenanceSet.has(value);
}

export function isTrait(category: ObservationCategory, trait: unknown): boolean {
  return typeof trait === "string" && traitSets[category].has(trait);
}

/** Every (category, trait) pair, for vocabulary endpoints and UI pickers. */
export function allTraits(): { category: ObservationCategory; trait: string }[] {
  return OBSERVATION_CATEGORIES.flatMap((category) =>
    TRAITS[category].map((trait) => ({ category, trait })),
  );
}

export interface ObservationInput {
  category: ObservationCategory;
  trait: string;
  provenance: Provenance;
  /** Short qualifier — "12 logos", "sidebar top". Never a substitute for a trait. */
  detail?: string | null;
  /** 0-100. Only meaningful for `inferred`; rejected on `observed`. */
  confidence?: number | null;
  /** The asset this was read from. Traceability back to the pixels. */
  evidenceAssetId?: string | null;
  /** Where in the asset — "header right", "below the fold". */
  evidenceNote?: string | null;
  /** Who recorded it: a curator handle, or an agent name for future AI passes. */
  recordedBy?: string | null;
}

export interface ObservationIssue {
  field: string;
  message: string;
}

const MAX_DETAIL = 200;
const MAX_EVIDENCE_NOTE = 300;

/**
 * Validate one observation. Mirrors `validation.ts`: collect every problem
 * rather than throwing on the first, so a bulk write reports completely.
 */
export function validateObservation(input: unknown): {
  ok: boolean;
  issues: ObservationIssue[];
  value?: ObservationInput;
} {
  const issues: ObservationIssue[] = [];
  if (!input || typeof input !== "object") {
    return { ok: false, issues: [{ field: "body", message: "Expected an object" }] };
  }
  const raw = input as Record<string, unknown>;

  const category = raw.category;
  if (!isCategory(category)) {
    issues.push({
      field: "category",
      message: `Unknown category: ${JSON.stringify(category)}. Expected one of: ${OBSERVATION_CATEGORIES.join(", ")}`,
    });
  }

  const provenance = raw.provenance;
  if (!isProvenance(provenance)) {
    issues.push({
      field: "provenance",
      message: `Unknown provenance: ${JSON.stringify(provenance)}. Expected one of: ${PROVENANCES.join(", ")}`,
    });
  }

  if (isCategory(category) && !isTrait(category, raw.trait)) {
    issues.push({
      field: "trait",
      message: `Unknown trait for category "${category}": ${JSON.stringify(raw.trait)}`,
    });
  }

  const detail = raw.detail;
  if (detail != null && (typeof detail !== "string" || detail.length > MAX_DETAIL)) {
    issues.push({
      field: "detail",
      message: `detail must be a string of at most ${MAX_DETAIL} characters`,
    });
  }

  const evidenceNote = raw.evidenceNote;
  if (
    evidenceNote != null &&
    (typeof evidenceNote !== "string" || evidenceNote.length > MAX_EVIDENCE_NOTE)
  ) {
    issues.push({
      field: "evidenceNote",
      message: `evidenceNote must be a string of at most ${MAX_EVIDENCE_NOTE} characters`,
    });
  }

  const confidence = raw.confidence;
  if (confidence != null) {
    if (
      typeof confidence !== "number" ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 100
    ) {
      issues.push({
        field: "confidence",
        message: "confidence must be a number between 0 and 100",
      });
    } else if (provenance === "observed") {
      // An observed fact is either visible or it is not. A confidence score on
      // one is a category error, and would let inference masquerade as evidence.
      issues.push({
        field: "confidence",
        message: "confidence is not allowed on an observed fact — use provenance 'inferred'",
      });
    }
  }

  if (issues.length) return { ok: false, issues };

  return {
    ok: true,
    issues: [],
    value: {
      category: category as ObservationCategory,
      trait: raw.trait as string,
      provenance: provenance as Provenance,
      detail: typeof detail === "string" ? detail.trim() || null : null,
      confidence: typeof confidence === "number" ? Math.round(confidence) : null,
      evidenceAssetId:
        typeof raw.evidenceAssetId === "string" ? raw.evidenceAssetId : null,
      evidenceNote:
        typeof evidenceNote === "string" ? evidenceNote.trim() || null : null,
      recordedBy: typeof raw.recordedBy === "string" ? raw.recordedBy.trim() || null : null,
    },
  };
}
