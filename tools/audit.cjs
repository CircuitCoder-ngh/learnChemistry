#!/usr/bin/env node
/* Whole-site audit, no browser needed.  node tools/audit.cjs
   - every lesson in the course map exists, with its page script and bank
   - every lesson meets the anatomy minimums in docs/AUTHORING.md
   - every local link and script in every page resolves
   - copy rules: no spaced em dashes in teaching text, no arrows on links */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const has = (p) => fs.existsSync(path.join(ROOT, p));

// Pull the course map out of lab.js without a DOM.
const labSrc = rd('assets/js/lab.js');
const start = labSrc.indexOf('Lab.course = [');
const end = labSrc.indexOf('];', labSrc.indexOf("id: 'organic'")) + 2;
const ctx = { Lab: {} };
vm.createContext(ctx);
vm.runInContext(labSrc.slice(start, end), ctx);
const lessons = ctx.Lab.course.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u.id, bonus: !!u.bonus })));

const problems = [], rows = [];
const count = (s, re) => (s.match(re) || []).length;

// Load the real bank engine once, so banks can use its helpers while they load.
const sup = (e) => String(e);
const sb = { console, Math, Number, String, Array, Object, JSON, Set, Map, parseFloat, parseInt, isFinite, isNaN, document: {}, Lab: { clamp: (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp: (a, b, t) => a + (b - a) * t, fmt: (n) => String(n), sig: (n) => String(n), sup, fHTML: (f) => f, texString: (t) => t } };
sb.window = sb;
vm.createContext(sb);
vm.runInContext(rd('assets/js/data/elements.js'), sb);
vm.runInContext(rd('assets/js/bank.js'), sb);
sb.EL = sb.window.EL; sb.ELEMENTS = sb.window.ELEMENTS;
function bankCounts(id) {
  try { vm.runInContext(rd(`assets/js/bank/${id}.js`), sb); } catch (e) { return { err: e.message }; }
  const d = sb.Bank.all[id] || {};
  return { quiz: (d.quiz || []).length, gens: (d.gens || []).length, cards: (d.cards || []).length, terms: (d.terms || []).length };
}

lessons.forEach((l) => {
  const page = `${l.id}.html`, js = `assets/js/pages/${l.id}.js`, bank = `assets/js/bank/${l.id}.js`;
  const miss = [page, js, bank].filter((f) => !has(f));
  if (miss.length) { problems.push(`${l.id}: missing ${miss.join(', ')}`); return; }
  const html = rd(page), code = rd(js);
  const stories = count(code, /Lab\.story\(/g);
  const benches = count(html, /class="bench[ "]/g);
  const need = l.bonus ? { stories: 1, benches: 1 } : { stories: 2, benches: 2 };
  const b = bankCounts(l.id);
  const row = { id: l.id, stories, benches, trap: count(html, /class="trap"/g), big: count(html, /class="big-idea"/g), moe: count(html, /class="moe-says/g), worked: count(html, /class="worked"/g), formula: count(html, /class="formula"/g), ...b };
  rows.push(row);
  if (b.err) problems.push(`${l.id}: bank error ${b.err}`);
  if (!new RegExp(`data-page="${l.id}"`).test(html)) problems.push(`${l.id}: wrong data-page`);
  if (stories < need.stories) problems.push(`${l.id}: ${stories} stories, needs ${need.stories}`);
  if (benches < need.benches) problems.push(`${l.id}: ${benches} benches, needs ${need.benches}`);
  if (!row.trap && !l.bonus) problems.push(`${l.id}: no exam trap`);
  if (!row.big && !l.bonus) problems.push(`${l.id}: no big idea`);
  if (!/data-quiz=/.test(html)) problems.push(`${l.id}: no quiz`);
  if (!/data-practice=/.test(html)) problems.push(`${l.id}: no practice gym`);
  if (!/class="pocket"/.test(html)) problems.push(`${l.id}: no pocket card`);
  if (!/id="lesson-end"/.test(html)) problems.push(`${l.id}: no lesson end`);
  if ((b.quiz || 0) < 6) problems.push(`${l.id}: ${b.quiz} quiz questions, needs 6`);
  if ((b.gens || 0) < 3) problems.push(`${l.id}: ${b.gens} generators, needs 3`);
  if ((b.cards || 0) < 5) problems.push(`${l.id}: ${b.cards} cards, needs 5`);
  if (!(b.terms > 0)) problems.push(`${l.id}: no glossary terms`);
});

// Every HTML page: local links and assets resolve.
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
pages.forEach((p) => {
  const html = rd(p);
  const refs = [...html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)].map((m) => m[1]);
  refs.forEach((r) => {
    if (/^(https?:|mailto:|data:|tel:)/.test(r)) return;
    if (!has(r)) problems.push(`${p}: broken link ${r}`);
  });
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  if (/\w — \w/.test(text)) problems.push(`${p}: spaced em dash in text`);
  if (/>[^<]*(→|->)\s*<\/a>/.test(text)) problems.push(`${p}: arrow on a link`);
  if (!/<title>[^<]+<\/title>/.test(html)) problems.push(`${p}: no title`);
});
// Links written in page scripts.
['extras'].forEach(() => {
  ['periodic-table', 'exam', 'flashcards', 'cheat-sheet', 'glossary', 'movie', 'about', 'index'].forEach((f) => {
    if (!has(f + '.html')) problems.push(`missing page ${f}.html`);
  });
});
fs.readdirSync(path.join(ROOT, 'assets/js/pages')).forEach((f) => {
  const src = rd('assets/js/pages/' + f);
  [...src.matchAll(/href="([a-z0-9-]+\.html)/g)].forEach((m) => { if (!has(m[1])) problems.push(`pages/${f}: broken link ${m[1]}`); });
  if (/\w — \w/.test(src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))) problems.push(`pages/${f}: spaced em dash in text`);
});
fs.readdirSync(path.join(ROOT, 'assets/js/bank')).forEach((f) => {
  const src = rd('assets/js/bank/' + f);
  if (/\w — \w/.test(src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))) problems.push(`bank/${f}: spaced em dash in text`);
});

const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
console.log(`${rows.length} of ${lessons.length} lessons present, ${pages.length} pages.`);
console.log(`Totals: ${sum('stories')} stories, ${sum('benches')} interactive labs, ${sum('worked')} worked examples, ${sum('trap')} exam traps, ${sum('quiz')} quiz questions, ${sum('gens')} problem generators, ${sum('cards')} flashcards, ${sum('terms')} glossary terms.`);
if (process.argv.includes('--table')) console.table(rows);
console.log(problems.length ? `PROBLEMS (${problems.length}):\n` + problems.join('\n') : 'audit clean');
process.exit(problems.length ? 1 : 0);
