/* The exam simulator. Draws from every lesson's question bank: concept questions plus freshly generated
   calculations, turned into multiple choice the way standardized finals are. Nothing is revealed until the end. */
Lab.ready(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  /* Topic weights: first-term ACS exam topics, leaning into the mole and stoichiometry, which research
     shows matter most. Units not selected simply drop out and the rest are scaled up. */
  const WEIGHT = { u0: 1, u1: 7, u2: 12, u3: 13, u4: 19, u5: 13, u6: 10, u7: 10, u8: 10, u9: 7, u10: 4, u11: 3, u12: 8 };
  const state = { n: 50, units: new Set(Lab.course.filter((u) => !u.bonus && u.id !== 'u0').map((u) => u.id)), items: [], at: 0, ends: 0, tick: 0, timed: true };

  /* ---------- Setup screen ---------- */
  Lab.$$('.exam-choice').forEach((b) => b.addEventListener('click', () => {
    Lab.$$('.exam-choice').forEach((x) => x.classList.toggle('is-on', x === b));
    state.n = +b.dataset.n;
    Lab.sound.pop();
  }));
  $('opt-units').innerHTML = Lab.course.filter((u) => u.id !== 'u0').map((u) => `<button type="button" class="chip" data-u="${u.id}" aria-pressed="${state.units.has(u.id)}">${u.title}</button>`).join('');
  Lab.$$('#opt-units .chip').forEach((c) => c.addEventListener('click', () => {
    const id = c.dataset.u;
    if (state.units.has(id)) state.units.delete(id); else state.units.add(id);
    c.setAttribute('aria-pressed', String(state.units.has(id)));
    paintPool();
  }));

  function paintHistory() {
    const h = Lab.store.get('examHistory', []);
    const host = $('exam-history');
    if (!h.length) { host.innerHTML = ''; return; }
    host.className = 'exam-history';
    host.innerHTML = `<h3>Your past exams</h3><ul>${h.slice(-6).reverse().map((e) => `<li><span>${new Date(e.at).toLocaleDateString()}, ${e.n} questions</span><strong>${e.pct}%</strong></li>`).join('')}</ul>`;
  }
  function poolFor(unitId) {
    const list = [];
    Lab.course.find((u) => u.id === unitId).lessons.forEach((l) => {
      const b = Bank.all[l.id];
      if (!b) return;
      (b.quiz || []).forEach((q) => list.push({ kind: 'quiz', lesson: l, q }));
      (b.gens || []).forEach((g) => list.push({ kind: 'gen', lesson: l, g }));
    });
    return list;
  }
  function paintPool() {
    let quiz = 0, gens = 0;
    state.units.forEach((u) => poolFor(u).forEach((i) => { if (i.kind === 'quiz') quiz++; else gens++; }));
    $('exam-pool').textContent = quiz + gens ? `Drawing from ${quiz} concept questions and ${gens} problem generators.` : 'No questions available for that selection yet.';
    $('exam-start').disabled = !(quiz + gens);
  }

  /* ---------- Building a paper ---------- */
  function largestRemainder(n, weights) {
    const total = weights.reduce((s, w) => s + w.w, 0) || 1;
    const out = weights.map((w) => { const raw = (n * w.w) / total; return { id: w.id, k: Math.floor(raw), rem: raw - Math.floor(raw) }; });
    let left = n - out.reduce((s, o) => s + o.k, 0);
    out.slice().sort((a, b) => b.rem - a.rem).forEach((o) => { if (left > 0) { o.k++; left--; } });
    return out;
  }
  /** Make multiple choice from a numeric answer. Distractors are the slips students really make. */
  function numericToChoices(p, r) {
    const a = p.answer, sf = p.sf || 3;
    const fmt = (x) => Lab.sig(x, sf) + (p.unit ? ' ' + p.unit : '');
    const correct = p.answerText ? p.answerText + (p.unit ? ' ' + p.unit : '') : fmt(a);
    const factors = r.shuffle([2, 0.5, 10, 0.1, 1.5, 2 / 3, 3, 1 / 3, 4, 0.25, 100, 0.01, 1.25, 0.8]);
    const wrong = [];
    if (a < 0) wrong.push(fmt(-a));
    for (const f of factors) {
      const s = fmt(a * f);
      if (s !== correct && !wrong.includes(s)) wrong.push(s);
      if (wrong.length >= 3) break;
    }
    return r.mc(correct, wrong.slice(0, 3));
  }
  function makeItem(entry, r) {
    const { lesson } = entry;
    const base = { lesson, unit: lesson.unit, picked: null, typed: '', flagged: false };
    if (entry.kind === 'quiz') {
      const q = entry.q;
      const order = r.shuffle(q.options.map((o, i) => ({ o, i })));
      return Object.assign(base, { q: q.q, type: 'choice', choices: order.map((x) => x.o), answer: order.findIndex((x) => x.i === q.answer), why: q.why });
    }
    const p = entry.g.make(r);
    if (Array.isArray(p.choices)) return Object.assign(base, { q: p.q, type: 'choice', choices: p.choices, answer: p.answer, steps: p.steps });
    if (Array.isArray(p.accept)) return Object.assign(base, { q: p.q, type: 'text', accept: p.accept, placeholder: p.placeholder, steps: p.steps });
    const mc = numericToChoices(p, r);
    return Object.assign(base, { q: p.q, type: 'choice', choices: mc.choices, answer: mc.answer, steps: p.steps });
  }
  function buildPaper() {
    const r = Bank.rng();
    const weights = [...state.units].map((id) => ({ id, w: WEIGHT[id] || 3 })).filter((w) => poolFor(w.id).length);
    const items = [];
    largestRemainder(state.n, weights).forEach(({ id, k }) => {
      const pool = r.shuffle(poolFor(id));
      // Walk lessons evenly, and let generators repeat with fresh numbers if a unit runs short.
      for (let i = 0; i < k; i++) {
        const entry = pool[i % pool.length];
        try { items.push(makeItem(entry, r)); }
        catch (e) { console.error('Could not build exam item', e); }
      }
    });
    return r.shuffle(items);
  }

  /* ---------- Taking it ---------- */
  function show(which) {
    ['exam-setup', 'exam-run', 'exam-results'].forEach((id) => { $(id).hidden = id !== which; });
    window.scrollTo({ top: document.querySelector('.lesson-head').offsetHeight - 10, behavior: 'instant' });
  }
  function start() {
    state.items = buildPaper();
    if (!state.items.length) return;
    state.at = 0;
    state.timed = $('opt-timer').checked;
    state.startedAt = Date.now();
    state.ends = state.timed ? Date.now() + state.items.length * 120000 : 0;
    $('exam-grid').innerHTML = state.items.map((_, i) => `<button class="exam-cell" type="button" data-i="${i}" aria-label="Question ${i + 1}">${i + 1}</button>`).join('');
    Lab.$$('.exam-cell').forEach((c) => c.addEventListener('click', () => go(+c.dataset.i)));
    clearInterval(state.tick);
    if (state.timed) { state.tick = setInterval(clock, 1000); clock(); } else $('exam-clock').textContent = '';
    show('exam-run');
    go(0);
  }
  function clock() {
    const left = Math.max(0, state.ends - Date.now());
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    const el = $('exam-clock');
    el.textContent = `${m}:${String(s).padStart(2, '0')} left`;
    el.classList.toggle('is-low', left < 120000);
    if (left <= 0) { clearInterval(state.tick); finish(); }
  }
  function go(i) {
    state.at = Lab.clamp(i, 0, state.items.length - 1);
    const it = state.items[state.at];
    $('exam-count').textContent = `Question ${state.at + 1} of ${state.items.length}`;
    $('exam-topic').textContent = it.unit.title;
    $('exam-q').innerHTML = Lab.texString(it.q);
    const a = $('exam-a');
    if (it.type === 'choice') {
      a.innerHTML = it.choices.map((c, k) => `<button type="button" class="exam-opt" data-k="${k}" aria-pressed="${it.picked === k}"><span class="exam-letter" aria-hidden="true">${'ABCDEFGH'[k]}</span><span>${Lab.texString(String(c))}</span></button>`).join('');
      Lab.$$('.exam-opt', a).forEach((b) => b.addEventListener('click', () => {
        const k = +b.dataset.k;
        it.picked = it.picked === k ? null : k;
        Lab.$$('.exam-opt', a).forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.k === it.picked)));
        Lab.sound.pop();
        paintGrid();
      }));
    } else {
      a.innerHTML = `<label class="sr-only" for="exam-text">Your answer</label><input id="exam-text" class="exam-text" type="text" autocomplete="off" spellcheck="false" placeholder="${it.placeholder || 'Your answer'}" value="${(it.typed || '').replace(/"/g, '&quot;')}">`;
      const inp = $('exam-text');
      inp.addEventListener('input', () => { it.typed = inp.value; paintGrid(); });
    }
    $('exam-flag').classList.toggle('is-on', it.flagged);
    $('exam-flag').textContent = it.flagged ? 'Flagged' : 'Flag for review';
    $('exam-prev').disabled = state.at === 0;
    $('exam-next').disabled = state.at === state.items.length - 1;
    paintGrid();
  }
  const isAnswered = (it) => (it.type === 'choice' ? it.picked !== null : !!(it.typed && it.typed.trim()));
  function paintGrid() {
    Lab.$$('.exam-cell').forEach((c, i) => {
      const it = state.items[i];
      c.classList.toggle('is-answered', isAnswered(it));
      c.classList.toggle('is-flagged', it.flagged);
      c.classList.toggle('is-here', i === state.at);
    });
  }
  $('exam-prev').addEventListener('click', () => go(state.at - 1));
  $('exam-next').addEventListener('click', () => go(state.at + 1));
  $('exam-flag').addEventListener('click', () => { const it = state.items[state.at]; it.flagged = !it.flagged; go(state.at); });
  $('exam-start').addEventListener('click', start);
  $('exam-again').addEventListener('click', () => { paintHistory(); show('exam-setup'); });
  $('exam-submit').addEventListener('click', () => {
    const blank = state.items.filter((it) => !isAnswered(it)).length;
    if (blank && !confirm(`You left ${blank} question${blank === 1 ? '' : 's'} blank. Hand it in anyway?`)) return;
    finish();
  });

  /* ---------- Results ---------- */
  const isRight = (it) => (it.type === 'choice' ? it.picked === it.answer : Bank.matchText(it.typed || '', it.accept));
  function finish() {
    clearInterval(state.tick);
    const items = state.items;
    const right = items.filter(isRight).length;
    const pct = Math.round((100 * right) / items.length);
    const hist = Lab.store.get('examHistory', []);
    hist.push({ at: Date.now(), n: items.length, pct });
    Lab.store.set('examHistory', hist.slice(-30));

    const verdict = pct >= 90 ? ['That is an A. Go to bed.', 'cheer'] : pct >= 80 ? ['Strong. You would pass with room to spare.', 'cheer'] : pct >= 70 ? ['You are passing. Tidy up the weak spots below.', 'happy'] : pct >= 55 ? ['Getting there. The topic list below shows where to dig.', 'think'] : ['Not yet, and that is what practice is for. Start with your lowest topic.', 'oops'];
    $('score-moe').innerHTML = Moe.svg(verdict[1]);
    $('score-num').textContent = pct + '%';
    $('score-word').textContent = verdict[0];
    const mins = Math.max(1, Math.round((Date.now() - state.startedAt) / 60000));
    $('score-detail').textContent = `${right} of ${items.length} right in about ${mins} minute${mins === 1 ? '' : 's'}.`;

    // Topic bars, weakest first, each with a link to the weakest lesson.
    const units = new Map();
    items.forEach((it) => {
      const u = units.get(it.unit.id) || { unit: it.unit, n: 0, r: 0, lessons: new Map() };
      u.n++; if (isRight(it)) u.r++;
      const L = u.lessons.get(it.lesson.id) || { lesson: it.lesson, n: 0, r: 0 };
      L.n++; if (isRight(it)) L.r++;
      u.lessons.set(it.lesson.id, L);
      units.set(it.unit.id, u);
    });
    const rows = [...units.values()].sort((a, b) => a.r / a.n - b.r / b.n);
    $('topic-bars').innerHTML = rows.map((u) => {
      const p = Math.round((100 * u.r) / u.n);
      const worst = [...u.lessons.values()].sort((a, b) => a.r / a.n - b.r / b.n)[0];
      const color = p >= 80 ? 'var(--leaf)' : p >= 60 ? 'var(--sun-deep)' : 'var(--red)';
      return `<div class="topic-row" style="--c:${color}"><b>${u.unit.title}</b><span class="pct">${u.r} of ${u.n}</span><div class="meter"><span style="width:${p}%"></span></div>
        ${p < 100 ? `<a class="goto" href="${worst.lesson.href}">Review ${worst.lesson.num}: ${worst.lesson.title}</a>` : ''}</div>`;
    }).join('');
    paintReview('wrong');
    show('exam-results');
    if (pct >= 70) Lab.confetti();
    const award = Math.min(12, Math.round(right / 3));
    if (award > 0) Lab.collection.award(award);
    Lab.sound.fanfare();
  }
  function paintReview(mode) {
    const list = $('review-list');
    const shown = state.items.map((it, i) => ({ it, i })).filter(({ it }) => mode === 'all' || !isRight(it));
    if (!shown.length) { list.innerHTML = '<p>You got every question right. Nothing to review.</p>'; return; }
    list.innerHTML = shown.map(({ it, i }) => {
      const right = isRight(it), blank = !isAnswered(it);
      const yours = it.type === 'choice' ? (blank ? 'Left blank' : it.choices[it.picked]) : (it.typed || 'Left blank');
      const correct = it.type === 'choice' ? it.choices[it.answer] : it.accept[0];
      const sol = it.steps ? `<div class="review-steps"><ol>${it.steps.map((s) => `<li>${s}</li>`).join('')}</ol></div>` : it.why ? `<div class="review-steps"><p>${it.why}</p></div>` : '';
      return `<article class="review-item ${right ? '' : blank ? 'is-blank' : 'is-wrong'}">
        <p class="review-q">${i + 1}. ${Lab.texString(it.q)}</p>
        <p class="review-line">Your answer: ${Lab.texString(String(yours))}</p>
        ${right ? '' : `<p class="review-line"><strong>Correct: ${Lab.texString(String(correct))}</strong></p>`}
        ${Lab.texString(sol)}
        <a class="review-goto" href="${it.lesson.href}">Lesson ${it.lesson.num}: ${it.lesson.title}</a>
      </article>`;
    }).join('');
  }
  Lab.$$('#review-filter .chip').forEach((c) => c.addEventListener('click', () => {
    Lab.$$('#review-filter .chip').forEach((x) => x.classList.toggle('is-on', x === c));
    paintReview(c.dataset.f);
  }));

  /* ---------- Load every lesson's questions ---------- */
  $('exam-start').disabled = true;
  $('exam-pool').textContent = 'Loading questions.';
  Bank.loadAll().then(() => { paintPool(); paintHistory(); });
  window.__exam = { state, start, finish, isRight };
});
