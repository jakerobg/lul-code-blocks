/**
 * Scope styles/lul.css to a single Squarespace page, for safe testing.
 * (header.custom.css was merged into styles/lul.css on 2026-09-21.)
 *
 *   node tools/scope-to-page.mjs collection-6a41d45bb52a355c76fed701 > /tmp/scoped.css
 *
 * Find the id by opening the page and running this in the browser console:
 *   document.body.id
 *
 * Paste the output into Design -> Custom CSS. It only applies on that one page;
 * every other page keeps the current styling. Delete it when you're done testing.
 */
import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const id = process.argv[2];
if (!id) { console.error('usage: node scope-to-page.mjs <collection-id>'); process.exit(1); }
const scope = `body#${id.replace(/^#/, '')}`;

const SHEET = path.join(HERE, '..', '..', 'styles', 'lul.css');
const css = fs.readFileSync(SHEET, 'utf8');
const root = postcss.parse(css, { from: SHEET });

root.walkRules(rule => {
  // don't touch rules inside @keyframes
  let p = rule.parent, inKf = false;
  while (p && p.type !== 'root') { if (p.type === 'atrule' && /keyframes/i.test(p.name)) inKf = true; p = p.parent; }
  if (inKf) return;

  rule.selectors = rule.selectors.map(sel => {
    const s = sel.trim();
    // :root can't live under a body scope — put the variables on the body itself
    if (s === ':root') return scope;
    if (s.startsWith(scope)) return s;
    return `${scope} ${s}`;
  });
});

process.stdout.write(
  `/* Scoped to ${scope} — testing only. Remove when done. */\n` + root.toString() + '\n'
);
