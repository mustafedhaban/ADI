/**
 * PROVISIONAL Alool visual system — design exploration only.
 * Not an official brand identity. Client brand assets may replace this entirely.
 */

export const ALOOL_PROVISIONAL = {
  note: "Provisional Alool visual system · exploration only · not official brand",
  colors: {
    primary: "#1a3c34",
    secondary: "#c4a574",
    accent: "#d4783a",
    ink: "#12100e",
    paper: "#f4efe6",
    mute: "#6a635a",
    line: "#d8d0c4",
  },
  motion: {
    ease: "cubic-bezier(0.22, 1, 0.36, 1)",
    fast: "160ms",
    base: "480ms",
    slow: "900ms",
  },
  signatures: {
    "ai-editorial": "Signal Rail",
    "creative-systems": "Modular Grid System",
    "future-studio": "Signature Graphic Form",
  },
} as const;

/** Locked after Round 2/3 review — Future Studio × Graphic Form */
export const SELECTED_DIRECTION = {
  id: "future-studio",
  title: "Future Studio",
  signature: "Signature Graphic Form",
  path: "/concepts/round-2/future-studio",
  finalPath: "/concepts/final",
  parents: "AI-First × Premium Creative → Future Studio",
  status: "selected",
} as const;
