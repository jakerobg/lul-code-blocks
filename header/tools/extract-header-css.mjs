import fs from 'fs';
import postcss from 'postcss';
import * as cheerio from 'cheerio';

const [,, HEADER_FILE, OUT, ...CSS_FILES] = process.argv;
const src = fs.readFileSync(HEADER_FILE, 'utf8');

const bodyClass = (src.match(/<body[\s\S]*?class="([\s\S]*?)"/) || [,''])[1].replace(/\s+/g,' ').trim();
const htmlClass = (src.match(/<html[^>]*class="([^"]*)"/) || [,''])[1];
const hStart = src.indexOf('<header'), hEnd = src.indexOf('</header>');
const headerHTML = src.slice(hStart, hEnd + 9);
// Real ancestor chain from the live site: html > body > div#siteWrapper > header
// Several Squarespace rules (e.g. button padding) are scoped to #siteWrapper.site-wrapper,
// so the wrapper must be present or those rules silently fail to match.
const HTML_CLASSES = 'yui3-js-enabled js flexbox canvas canvastext webgl';
const $ = cheerio.load(
  `<html class="${htmlClass} ${HTML_CLASSES}"><body class="${bodyClass}">` +
  `<div id="siteWrapper" class="clearfix site-wrapper">${headerHTML}</div>` +
  `</body></html>`);

const DYNAMIC = /::?(hover|focus-visible|focus-within|focus|active|visited|target|checked|disabled|enabled|placeholder|selection|before|after|first-line|first-letter|marker|backdrop)\b(\([^)]*\))?/g;
const sanitize = s => {
  let x = s.replace(DYNAMIC,'').replace(/::[\w-]+(\([^)]*\))?/g,'')
           .replace(/\s*[>+~]\s*$/,'').trim();
  return x || null;
};
const matches = sel => { const c = sanitize(sel); if(!c) return false;
  try { return $(c).length > 0; } catch { return false; } };

const isVarScope = sel => /^(:root|html|body)\b/.test(sel.trim()) ||
  /data-section-theme|^\.(white|black|light|dark|bright)[\w-]*$/.test(sel);

const kept = [];                 // real style rules
const varDefs = new Map();       // prop -> [{scope, value}]
const stats = {};

for (const file of CSS_FILES) {
  const name = file.split('/').pop();
  let root; try { root = postcss.parse(fs.readFileSync(file,'utf8'), {from:file}); }
  catch(e){ console.error(`parse fail ${name}: ${e.message}`); continue; }
  let n = 0;

  root.walkRules(rule => {
    let p = rule.parent, inKf = false; const chain = [];
    while (p && p.type !== 'root') {
      if (p.type === 'atrule') {
        if (/keyframes/i.test(p.name)) inKf = true;
        chain.unshift(`@${p.name} ${p.params}`.trim());
      }
      p = p.parent;
    }
    if (inKf) return;

    const hits = rule.selectors.filter(matches);
    if (!hits.length) return;

    // split custom properties from real declarations
    const custom = [], real = [];
    rule.each(d => { if (d.type !== 'decl') { real.push(d); return; }
      (d.prop.startsWith('--') ? custom : real).push(d); });

    for (const d of custom) {
      if (!varDefs.has(d.prop)) varDefs.set(d.prop, []);
      varDefs.get(d.prop).push({ scope: hits.join(', '), value: d.value, chain });
    }
    if (!real.length) return;    // variable-only rule: handled above, don't emit wholesale

    kept.push({ chain, selector: hits.join(',\n'),
      body: real.map(d => d.toString()).join(';\n  '), file: name });
    n++;
  });
  stats[name] = n;
}

// which vars do the kept rules actually use? (transitive)
const used = new Set();
const scan = t => { let m; const re=/var\(\s*(--[\w-]+)/g; while((m=re.exec(t))) used.add(m[1]); };
kept.forEach(k => scan(k.body));
let grew = true;
while (grew) { grew = false;
  for (const v of [...used]) for (const d of (varDefs.get(v)||[])) {
    const before = used.size; scan(d.value); if (used.size !== before) grew = true;
  }
}

// emit
let out = `/* ==========================================================================
   Header CSS — extracted from landuselabs.com
   Only rules matching the header markup in lul_header.html are included.
   Sources: ${CSS_FILES.map(f=>f.split('/').pop()).join(', ')}
   ========================================================================== */\n`;

const usedDefs = [...used].filter(v => varDefs.has(v)).sort();
const byScope = new Map();
for (const v of usedDefs) for (const d of varDefs.get(v)) {
  const key = d.chain.length ? `${d.chain.join(' | ')} :: ${d.scope}` : d.scope;
  if (!byScope.has(key)) byScope.set(key, {chain:d.chain, scope:d.scope, decls:[]});
  byScope.get(key).decls.push([v, d.value]);
}
out += `\n/* --------------------------------------------------------------------------
   Custom properties actually referenced by the header rules (${usedDefs.length})
   -------------------------------------------------------------------------- */\n`;
for (const {chain, scope, decls} of byScope.values()) {
  const ind = chain.length ? '  ' : '';
  if (chain.length) out += `\n${chain.join(' {\n')} {\n`;
  out += `${ind}${scope} {\n`;
  for (const [p,v] of decls) out += `${ind}  ${p}: ${v};\n`;
  out += `${ind}}\n`;
  if (chain.length) out += '}\n'.repeat(chain.length);
}

out += `\n/* --------------------------------------------------------------------------
   Header rules
   -------------------------------------------------------------------------- */\n`;
let lastFile = null, lastChain = null;
const closeChain = () => { if (lastChain) out += '}\n'.repeat(lastChain.split(' | ').length); lastChain = null; };
for (const k of kept) {
  const chainKey = k.chain.join(' | ');
  if (k.file !== lastFile) { closeChain(); out += `\n/* ===== ${k.file} ===== */\n`; lastFile = k.file; }
  if (chainKey !== lastChain) { closeChain();
    if (k.chain.length) { out += `\n${k.chain.join(' {\n')} {\n`; lastChain = chainKey; } }
  const ind = lastChain ? '  ' : '';
  out += `${ind}${k.selector.replace(/\n/g,'\n'+ind)} {\n${ind}  ${k.body};\n${ind}}\n`;
}
closeChain();

fs.writeFileSync(OUT, out);
console.log('style rules kept:', JSON.stringify(stats));
console.log('custom properties used:', usedDefs.length, 'across', byScope.size, 'scopes');
console.log('output KB:', (out.length/1024).toFixed(1));
