import { db } from "./index.js";
import {
  industries,
  pageTypes,
  patterns,
  styles,
  tags,
} from "./schema.js";
import {
  COMMON_TAGS,
  INDUSTRIES,
  PAGE_TYPES,
  PATTERNS,
  STYLES,
} from "../domain/taxonomy.js";

function seedTable(
  table: typeof industries | typeof pageTypes | typeof styles | typeof patterns | typeof tags,
  values: readonly string[],
) {
  for (const name of values) {
    db.insert(table)
      .values({ name })
      .onConflictDoNothing()
      .run();
  }
}

seedTable(industries, INDUSTRIES);
seedTable(pageTypes, PAGE_TYPES);
seedTable(styles, STYLES);
seedTable(patterns, PATTERNS);
seedTable(tags, COMMON_TAGS);

console.log("Seeded taxonomy data (industries, page types, styles, patterns, tags).");
