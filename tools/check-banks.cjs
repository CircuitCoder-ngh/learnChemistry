#!/usr/bin/env node
/* Hammers every question bank with no browser needed.
   node tools/check-banks.cjs [lessonId ...]

   For every generator it makes 300 problems and fails on: exceptions, NaN or undefined anywhere in the
   text, non-finite numeric answers, answer indexes out of range, duplicate choices, missing steps.
   It also renders every $...$ with KaTeX, including mhchem, so broken math fails here instead of on the page. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const katex = require('katex');
require('katex/contrib/mhchem');

const ROOT = path.resolve(__dirname, '..');
const only = process.argv.slice(2);

const sup = (e) => String(e).replace(/[-0-9]/g, (c) => '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)]);
const Lab = {
  clamp: (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  fmt: (n, d = 2) => (Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—'),
  sup,
  sig(x, n = 3) {
    if (!Number.isFinite(x)) return '—';
    if (x === 0) return (0).toFixed(Math.max(0, n - 1));
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e >= n + 3 || e < -3) return (x / Math.pow(10, e)).toFixed(n - 1) + ' × 10' + sup(e);
    const d = Math.max(0, n - 1 - e);
    if (d === 0) { const f = Math.pow(10, e - n + 1); return String(Math.round(x / f) * f); }
    return x.toFixed(d);
  },
  fHTML: (f) => String(f),
  texString: (s) => s,
};
const sandbox = { console, Math, Lab, window: {}, document: { }, Number, String, Array, Object, JSON, parseFloat, parseInt, isFinite, isNaN, Set, Map };
sandbox.window = sandbox;
vm.createContext(sandbox);
const load = (rel) => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel });
load('assets/js/data/elements.js');
load('assets/js/bank.js');
sandbox.EL = sandbox.window.EL;
sandbox.ELEMENTS = sandbox.window.ELEMENTS;

const dir = path.join(ROOT, 'assets/js/bank');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
const problems = [];
files.forEach((f) => {
  try { load('assets/js/bank/' + f); } catch (e) { problems.push(`${f}: failed to load: ${e.message}`); }
});

function checkTex(where, s) {
  if (typeof s !== 'string') return;
  if (/\bundefined\b|\bNaN\b|\[object Object\]|Infinity/.test(s)) problems.push(`${where}: bad text "${s.slice(0, 120)}"`);
  const stripped = s.replace(/\\\$/g, '');
  const matches = stripped.match(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g) || [];
  matches.forEach((m) => {
    const src = m.replace(/^\$+|\$+$/g, '');
    try { katex.renderToString(src, { throwOnError: true, strict: false }); }
    catch (e) { problems.push(`${where}: TeX error in "${src.slice(0, 80)}": ${e.message.slice(0, 100)}`); }
  });
  const dollars = (stripped.match(/\$/g) || []).length;
  if (dollars % 2) problems.push(`${where}: unbalanced $ in "${s.slice(0, 100)}"`);
}

let counted = { banks: 0, quiz: 0, gens: 0, cards: 0, terms: 0 };
const banks = sandbox.Bank.all;
Object.keys(banks).forEach((id) => {
  if (only.length && !only.includes(id)) return;
  counted.banks++;
  const b = banks[id];
  (b.quiz || []).forEach((q, i) => {
    counted.quiz++;
    const where = `${id} quiz ${i + 1}`;
    if (!Array.isArray(q.options) || q.options.length < 2) problems.push(`${where}: needs options`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) problems.push(`${where}: answer index out of range`);
    if (!q.why) problems.push(`${where}: missing why`);
    if (new Set(q.options).size !== q.options.length) problems.push(`${where}: duplicate options`);
    checkTex(where, q.q); checkTex(where, q.why);
    q.options.forEach((o) => checkTex(where, o));
  });
  (b.gens || []).forEach((g) => {
    counted.gens++;
    if (!g.id || !g.title || typeof g.make !== 'function') problems.push(`${id} gen ${g.id}: needs id, title and make`);
    const seenQ = new Set();
    const before = problems.length;
    let tries = 0;
    for (let seed = 1; seed <= 300; seed++) {
      tries = seed;
      const where = `${id} gen ${g.id}`;
      let p;
      try { p = g.make(sandbox.Bank.rng(seed * 7919)); }
      catch (e) { problems.push(`${where}: threw at seed ${seed}: ${e.message}`); break; }
      if (!p || !p.q) { problems.push(`${where}: no q`); break; }
      seenQ.add(p.q);
      checkTex(where, p.q);
      (p.steps || []).forEach((s) => checkTex(where, s));
      checkTex(where, p.hint);
      if (!p.steps || !p.steps.length) problems.push(`${where}: no steps`);
      if (Array.isArray(p.choices)) {
        if (!Number.isInteger(p.answer) || p.answer < 0 || p.answer >= p.choices.length) problems.push(`${where}: choice answer out of range`);
        if (new Set(p.choices.map(String)).size !== p.choices.length) problems.push(`${where}: duplicate choices in "${p.q.slice(0, 60)}"`);
        p.choices.forEach((c) => checkTex(where, String(c)));
      } else if (Array.isArray(p.accept)) {
        if (!p.accept.length) problems.push(`${where}: empty accept`);
      } else if (typeof p.answer !== 'number' || !Number.isFinite(p.answer)) {
        problems.push(`${where}: non-finite answer ${p.answer} for "${p.q.slice(0, 60)}"`);
      }
      if (problems.length - before > 6) break; // Enough to see what is wrong with this generator.
    }
    if (tries === 300 && seenQ.size < 4) problems.push(`${id} gen ${g.id}: only ${seenQ.size} distinct problems in 300 tries`);
  });
  (b.cards || []).forEach((c, i) => { counted.cards++; checkTex(`${id} card ${i + 1}`, c.front); checkTex(`${id} card ${i + 1}`, c.back); });
  (b.terms || []).forEach((c, i) => { counted.terms++; checkTex(`${id} term ${i + 1}`, c.def); });
});
const uniq = [...new Set(problems)];
console.log(`${counted.banks} banks, ${counted.quiz} quiz questions, ${counted.gens} generators, ${counted.cards} cards, ${counted.terms} terms`);
console.log(uniq.length ? `PROBLEMS (${uniq.length}):\n` + uniq.join('\n') : 'all banks clean');
process.exit(uniq.length ? 1 : 0);
