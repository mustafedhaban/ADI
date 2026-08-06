export type AloolcmsScreen = "desk" | "catalogue" | "composer" | "empty";

export const ALOOLCMS_SCREENS: { id: AloolcmsScreen; label: string }[] = [
  { id: "desk", label: "Desk" },
  { id: "catalogue", label: "Catalogue" },
  { id: "composer", label: "Composer" },
  { id: "empty", label: "Empty" },
];

export type AloolcmsDirection = {
  id: string;
  number: string;
  title: string;
  blurb: string;
  path: string;
  navModel: string;
  story: string;
  evidence: string[];
  antiPaste: string[];
};

export const ALOOLCMS_DIRECTIONS: AloolcmsDirection[] = [
  {
    id: "folio",
    number: "D1",
    title: "Folio Shell",
    blurb:
      "Advancing finalist · Round 2 — Folio + D3 compose pair + D5 content facets. Product path.",
    path: "/concepts/aloolcms/folio",
    navModel: "Grouped left rail",
    story: "What needs an editor",
    evidence: [
      "Grouped Sidebar Sections",
      "Mixed Serif And Sans",
      "Dark Shell Light Body",
      "Medium Density",
      "Single Accent Colour",
      "Oliver Wyman type index",
    ],
    antiPaste: ["Signup In Header", "Full Bleed Hero", "Announcement Bar"],
  },
  {
    id: "spec",
    number: "D2",
    title: "Spec Instrument",
    blurb:
      "Command-first dark instrument — signals, inspector, mono metadata (Linear product mock lineage).",
    path: "/concepts/aloolcms/spec",
    navModel: "Icon rail + command strip",
    story: "Conflicts & publish integrity",
    evidence: [
      "Keyboard Shortcut Hint",
      "Left Sidebar (product mock)",
      "Bordered Panels",
      "Dark Theme",
      "Monospace Accent",
    ],
    antiPaste: ["Signup In Header", "Abstract Gradient", "glass marketing"],
  },
  {
    id: "compose",
    number: "D3",
    title: "Compose Pair",
    blurb:
      "Builder desk — modules + canvas + inspector + live preview as one instrument.",
    path: "/concepts/aloolcms/compose",
    navModel: "Top tools · module dock",
    story: "Page as the product",
    evidence: [
      "Code Panel Pairing",
      "Bordered Panels",
      "Tabbed Content",
      "Retool builder framing",
    ],
    antiPaste: ["Vanity dashboard", "Marketing hero chrome"],
  },
  {
    id: "ledger",
    number: "D4",
    title: "Ledger Index",
    blurb:
      "Publication register — top index, stamps, archive authority (Pentagram / Sagmeister lineage).",
    path: "/concepts/aloolcms/ledger",
    navModel: "Top horizontal index",
    story: "Official publication records",
    evidence: [
      "Top Horizontal Nav",
      "Mixed Serif And Sans",
      "Minimal Chrome",
      "Monochrome Palette",
      "Light Theme",
    ],
    antiPaste: ["Multi Colour Palette", "Soft SaaS cards"],
  },
  {
    id: "facet",
    number: "D5",
    title: "Facet Desk",
    blurb:
      "Filterable catalogue instrument — facets + search + suggestion chips across typed collections.",
    path: "/concepts/aloolcms/facet",
    navModel: "Facet rail + results",
    story: "Find anything across collections",
    evidence: [
      "Filter Field In Navigation",
      "Header Search Field",
      "Keyboard Shortcut Hint",
      "Faceted discovery (HF)",
    ],
    antiPaste: ["Equal-weight 15-item Content dump"],
  },
];
