/** Map public webpage hostnames to ADI design sources. */

const SOURCE_HOST_RULES: Array<{ match: RegExp; source: string }> = [
  { match: /(^|\.)pinterest\./i, source: "Pinterest" },
  { match: /(^|\.)behance\.net$/i, source: "Behance" },
  { match: /(^|\.)dribbble\.com$/i, source: "Dribbble" },
  { match: /(^|\.)awwwards\.com$/i, source: "Awwwards" },
  { match: /(^|\.)mobbin\.com$/i, source: "Mobbin" },
  { match: /(^|\.)land-book\.com$/i, source: "Land-book" },
  { match: /(^|\.)godly\.website$/i, source: "Godly" },
  { match: /(^|\.)siteinspire\.com$/i, source: "SiteInspire" },
  { match: /(^|\.)are\.na$/i, source: "Are.na" },
  { match: /(^|\.)savee\.it$/i, source: "Savee" },
  { match: /(^|\.)x\.com$/i, source: "X" },
  { match: /(^|\.)twitter\.com$/i, source: "X" },
  { match: /(^|\.)figma\.com$/i, source: "Figma Community" },
];

export function detectSourceFromHostname(hostname: string): string {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  for (const rule of SOURCE_HOST_RULES) {
    if (rule.match.test(host)) return rule.source;
  }
  return "Other";
}

export function detectSourceFromUrl(url: string): string {
  try {
    return detectSourceFromHostname(new URL(url).hostname);
  } catch {
    return "Other";
  }
}
