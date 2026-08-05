/**
 * Provisional copy for Round 1 Alool Technologies website concepts.
 * READY WITH ASSUMPTIONS — not client-approved marketing.
 * Do not invent specific services, clients, metrics, awards, or logos.
 */

export const BRAND = "Alool Technologies";

export const PROVISIONAL = {
  tagline: "Technology solutions for ambitious organizations.",
  support:
    "Building digital systems that move businesses forward — with research before build, and human judgment throughout.",
  ctaPrimary: "Start a conversation",
  ctaSecondary: "Explore our approach",
  nav: ["Approach", "Solutions", "Work", "About", "Contact"] as const,
  solutionsIntro:
    "Capabilities shown as provisional placeholders until the client confirms the public services catalog.",
  solutionSlots: [
    {
      label: "01",
      title: "Digital product & experience design",
      body: "Provisional. Clarify scope with the client before final copy.",
    },
    {
      label: "02",
      title: "Web platforms & systems",
      body: "Provisional. Structure for how solution areas may appear.",
    },
    {
      label: "03",
      title: "Research-led delivery",
      body: "Provisional. Reflects Alool’s documented research → direction → build workflow.",
    },
  ],
  process: [
    {
      step: "01",
      title: "Research",
      body: "Gather references, constraints, and direction before committing pixels or code.",
    },
    {
      step: "02",
      title: "Direction",
      body: "Align on visual and structural intent with clear decision criteria.",
    },
    {
      step: "03",
      title: "Build",
      body: "Implement with AI-assisted craft and human review at every meaningful step.",
    },
    {
      step: "04",
      title: "Refine",
      body: "Ship, learn, and keep institutional knowledge for the next engagement.",
    },
  ],
  workSlots: [
    {
      code: "WRK—01",
      title: "Selected engagement",
      meta: "Case study placeholder — publishable projects TBD",
    },
    {
      code: "WRK—02",
      title: "Selected engagement",
      meta: "Case study placeholder — no invented results",
    },
    {
      code: "WRK—03",
      title: "Selected engagement",
      meta: "Case study placeholder — client names withheld",
    },
  ],
  about:
    "Alool Technologies builds websites and digital products using a research-led, AI-assisted workflow. Exact public positioning, markets, and differentiators remain subject to client confirmation.",
  trustNote:
    "Credibility markers intentionally omitted — no invented logos, awards, or statistics.",
  footerNote: "Round 1 concept exploration · Provisional content · Not final brand",
} as const;

export const CONCEPTS = [
  {
    id: "technology-authority",
    number: "01",
    title: "Technology Authority",
    path: "/concepts/technology-authority",
    blurb:
      "Trusted, precise, enterprise-ready technology partner. Structured IA and typographic confidence.",
  },
  {
    id: "creative-technology",
    number: "02",
    title: "Premium Creative Technology",
    path: "/concepts/creative-technology",
    blurb:
      "Editorial studio craft. Typography-led layouts and immersive project rhythm.",
  },
  {
    id: "ai-first",
    number: "03",
    title: "AI-First Future Technology",
    path: "/concepts/ai-first",
    blurb:
      "Forward-looking intelligence without neon clichés. Precise systems and generative restraint.",
  },
  {
    id: "human-centered",
    number: "04",
    title: "Human-Centered Digital Transform",
    path: "/concepts/human-centered",
    blurb:
      "Problem → solution → impact storytelling. Approachable, strategic, trustworthy.",
  },
  {
    id: "africa-global",
    number: "05",
    title: "Africa × Global Ambition",
    path: "/concepts/africa-global",
    blurb:
      "African technology company with global ambition. Modern, distinctive, without stereotypes.",
  },
] as const;

export const ROUND2_CONCEPTS = [
  {
    id: "ai-editorial",
    number: "01",
    title: "AI Editorial",
    path: "/concepts/round-2/ai-editorial",
    blurb:
      "Serious technology company with the cultural sophistication of a world-class creative publication.",
    parents: "AI-First × Premium Creative",
  },
  {
    id: "creative-systems",
    number: "02",
    title: "Creative Systems",
    path: "/concepts/round-2/creative-systems",
    blurb: "A technology company that thinks like a designer — modular, precise, expressive.",
    parents: "AI-First systems × Creative layout",
  },
  {
    id: "future-studio",
    number: "03",
    title: "Future Studio",
    path: "/concepts/round-2/future-studio",
    blurb:
      "Next-generation technology studio building important digital products and systems.",
    parents: "Creative ambition × Future precision",
  },
] as const;

export const ROUND2_FOOTER =
  "Round 2 refined exploration · Provisional content · Not final brand" as const;
