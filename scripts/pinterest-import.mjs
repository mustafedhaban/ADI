// Export saved Pins as ADI references using a Pinterest OAuth access token
// with boards:read and pins:read. Set PINTEREST_ACCESS_TOKEN in your shell.
// Run with --list-boards to find IDs, then --board ID > pinterest.json.
// Open Import in ADI, upload the JSON, review the preview, and confirm.

import { parseArgs } from 'node:util';

async function* pages(path, token) {
  const url = new URL(path, 'https://api.pinterest.com/v5/');
  const seenBookmarks = new Set();

  while (true) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      const hints = {
        401: 'Refresh your Pinterest access token.',
        403: 'Check app access, board permissions, and the boards:read and pins:read scopes.',
        404: 'Check the board ID and whether this account can access it.',
        429: 'Pinterest rate limit reached. Try again later.',
      };
      throw new Error(`Pinterest returned HTTP ${response.status}. ${hints[response.status] ?? 'Try again later.'}`);
    }

    const { items, bookmark } = await response.json();
    if (!Array.isArray(items)) throw new Error('Pinterest returned an invalid item list.');
    yield* items;
    if (bookmark == null) return;
    if (typeof bookmark !== 'string' || !bookmark || seenBookmarks.has(bookmark)) {
      throw new Error('Pinterest returned an invalid pagination cursor.');
    }
    seenBookmarks.add(bookmark);
    url.searchParams.set('bookmark', bookmark);
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      help: { type: 'boolean' },
      'list-boards': { type: 'boolean' },
      board: { type: 'string', multiple: true },
      type: { type: 'string', default: 'ui' },
    },
  });
  if (values.help) {
    console.log('Usage: node scripts/pinterest-import.mjs --list-boards');
    console.log('       node scripts/pinterest-import.mjs --board ID [--board ID] [--type ui] > pinterest.json');
    return;
  }

  const boards = values.board ?? [];
  if (Boolean(values['list-boards']) === Boolean(boards.length)) {
    throw new Error('Choose --list-boards or provide at least one --board ID.');
  }
  if (boards.some(id => !/^\d+$/.test(id))) throw new Error('Board IDs must contain only digits.');
  if (!['website', 'ui', 'mobile', 'branding', 'component'].includes(values.type)) {
    throw new Error('Choose an ADI type: website, ui, mobile, branding, or component.');
  }

  const token = process.env.PINTEREST_ACCESS_TOKEN?.trim();
  if (!token) throw new Error('Set PINTEREST_ACCESS_TOKEN before running the collector.');

  if (values['list-boards']) {
    const availableBoards = [];
    for await (const { id, name } of pages('boards', token)) availableBoards.push({ id, name });
    console.log(JSON.stringify(availableBoards, null, 2));
    return;
  }

  const references = new Map();
  let skipped = 0;
  for (const board of new Set(boards)) {
    for await (const pin of pages(`boards/${board}/pins`, token)) {
      if (typeof pin?.id !== 'string' || !/^\d+$/.test(pin.id)) {
        skipped++;
        continue;
      }
      if (references.has(pin.id)) continue;
      references.set(pin.id, {
        title: pin.title?.trim() || `Pinterest Pin ${pin.id}`,
        source: 'Pinterest',
        url: `https://www.pinterest.com/pin/${pin.id}/`,
        type: values.type,
        description: pin.description?.trim() || undefined,
      });
    }
  }

  if (skipped) console.error(`Skipped ${skipped} entries without valid Pin IDs.`);
  console.log(JSON.stringify({ references: [...references.values()] }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
