/* Glossary: gathers `terms` from every bank, one entry per term, with search and an A to Z index. */
Lab.ready(function () {
  'use strict';
  const { $, $$ } = Lab;
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  /** The readable text of a term or definition, without math markup. */
  const plain = (s) => String(s)
    .replace(/\\ce\{([^}]*)\}/g, '$1').replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, ' ').replace(/[${}\\^_]/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const keyOf = (term) => plain(term).toLowerCase().replace(/^[^a-z0-9]+/, '');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const slug = (s) => keyOf(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  let entries = [];

  Bank.loadAll().then(() => {
    const map = new Map();
    Lab.lessons.forEach((l) => {
      const b = Bank.all[l.id];
      if (!b || !Array.isArray(b.terms)) return;
      b.terms.forEach((t) => {
        if (!t || !t.term || !t.def) return;
        const key = keyOf(t.term);
        if (!key) return;
        const hit = map.get(key);
        if (hit) { if (!hit.lessons.includes(l)) hit.lessons.push(l); return; }
        map.set(key, { key, term: t.term, def: t.def, lessons: [l], hay: (plain(t.term) + ' ' + plain(t.def)).toLowerCase() });
      });
    });
    entries = Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key, 'en'));
    build();
    const fromHash = decodeURIComponent(location.hash.slice(1)).split(/[?&]/)[0];
    if (fromHash) {
      const t = document.getElementById(fromHash);
      if (t) t.scrollIntoView({ block: 'start' });
    }
  });

  function letterOf(e) {
    const c = e.key[0].toUpperCase();
    return LETTERS.includes(c) ? c : '#';
  }
  function build() {
    const groups = new Map();
    entries.forEach((e) => {
      const L = letterOf(e);
      if (!groups.has(L)) groups.set(L, []);
      groups.get(L).push(e);
    });
    const order = ['#'].concat(LETTERS).filter((L) => groups.has(L));
    $('#gl-list').innerHTML = order.map((L) => `
      <section class="gl-group" id="${L === '#' ? 'letter-num' : 'letter-' + L}" data-letter="${L}">
        <h2 class="gl-letter" aria-label="${L === '#' ? 'Numbers' : 'Letter ' + L}">${L}</h2>
        <dl class="gl-entries">${groups.get(L).map(entryHTML).join('')}</dl>
      </section>`).join('');
    paintIndex(groups);
    $$('.gl-entry').forEach((el, i) => { el._entry = entries.find((x) => x.key === el.dataset.key) || entries[i]; });
    filter('');
    const input = $('#gl-search');
    input.addEventListener('input', () => filter(input.value));
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { input.value = ''; filter(''); } });
  }
  function entryHTML(e) {
    const links = e.lessons.map((l) => `<a href="${l.href}">${l.num} ${esc(l.title)}</a>`).join(', ');
    return `<div class="gl-entry" id="term-${slug(e.term)}" data-key="${esc(e.key)}">
      <dt class="gl-term">${Lab.texString(e.term)}</dt>
      <dd class="gl-def">${Lab.texString(e.def)}</dd>
      <dd class="gl-src">Taught in ${links}</dd>
    </div>`;
  }
  function paintIndex(groups) {
    $('#gl-index').innerHTML = LETTERS.map((L) => (groups.has(L)
      ? `<a href="#letter-${L}" data-l="${L}">${L}</a>`
      : `<span class="is-off" aria-hidden="true">${L}</span>`)).join('');
  }
  function filter(q) {
    q = q.trim().toLowerCase();
    let shown = 0;
    const visibleLetters = new Set();
    $$('.gl-group').forEach((g) => {
      let any = false;
      $$('.gl-entry', g).forEach((el) => {
        const e = el._entry;
        const on = !q || e.hay.includes(q);
        el.hidden = !on;
        if (on) { any = true; shown++; }
      });
      g.hidden = !any;
      if (any) visibleLetters.add(g.dataset.letter);
    });
    $$('#gl-index a').forEach((a) => a.classList.toggle('is-dim', !visibleLetters.has(a.dataset.l)));
    const lessons = new Set();
    entries.forEach((e) => e.lessons.forEach((l) => lessons.add(l.id)));
    $('#gl-count').textContent = q
      ? `${shown} of ${entries.length} terms`
      : `${entries.length} terms from ${lessons.size} lesson${lessons.size === 1 ? '' : 's'}`;
    const empty = $('#gl-empty');
    empty.hidden = shown > 0;
    if (!shown) {
      $('#gl-empty-text').textContent = entries.length
        ? `Nothing here matches "${q}". Try a shorter word, or a piece of the word.`
        : 'The terms are still being dug up. Check back soon.';
      Lab.placeMoe(empty);
    }
  }
});
