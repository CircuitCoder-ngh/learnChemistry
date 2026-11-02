/* The Mole Hole: question banks, quizzes and the practice gym.

   Each lesson registers one bank in assets/js/bank/<lesson>.js:

     Bank.add('mole', {
       quiz:  [{ q, options:[...], answer: index, why }],             // concept checks
       gens:  [{ id, title, make(r) { return problem } }],            // endless randomized problems
       cards: [{ front, back }],                                      // flashcards
     });

   A problem is either numeric, multiple choice, or typed text:
     { q, answer: 12.3, unit: 'g', tol: 0.02, steps: ['...'], hint: '...' }
     { q, choices: ['a','b'], answer: 1, steps: [...] }
     { q, accept: ['NaCl','nacl'], steps: [...], placeholder: 'formula' }
   Strings may use <b> and $math$. tol is relative (default 2%). `steps` is the worked solution.

   Mount with <div data-quiz="mole"></div> and <div data-practice="mole"></div> in the page. */
(function () {
  'use strict';
  const Bank = (window.Bank = { all: {} });

  Bank.add = function (id, data) { Bank.all[id] = data; };

  /** Load every lesson's bank, for the exam simulator, flashcards and glossary. Resolves when all have arrived. */
  Bank.loadAll = function () {
    return Promise.all(Lab.lessons.map((l) => new Promise((done) => {
      if (Bank.all[l.id]) { done(); return; }
      const s = document.createElement('script');
      s.src = 'assets/js/bank/' + l.id + '.js';
      s.onload = done;
      s.onerror = done;
      document.head.appendChild(s);
    })));
  };

  /* ---------- Random helper handed to every generator ---------- */
  function makeRng(seed) {
    let s = seed === undefined ? Math.floor(Math.random() * 1e9) : seed;
    const next = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    const r = {
      next,
      int: (a, b) => a + Math.floor(next() * (b - a + 1)),
      /** A random number between a and b rounded to d decimals. */
      num: (a, b, d = 2) => +(a + next() * (b - a)).toFixed(d),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      shuffle: (arr) => {
        const out = arr.slice();
        for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
        return out;
      },
      /** Format to n significant figures as a string, for use in question text. */
      sf: (x, n = 3) => Lab.sig(x, n),
      /** A multiple-choice answer set: returns { choices, answer } with distractors shuffled in. */
      mc: (correct, wrong) => {
        const seen = new Set([String(correct)]);
        const list = [correct];
        wrong.forEach((w) => { if (!seen.has(String(w))) { seen.add(String(w)); list.push(w); } });
        const shuffled = r.shuffle(list);
        return { choices: shuffled, answer: shuffled.indexOf(correct) };
      },
    };
    return r;
  }
  Bank.rng = makeRng;

  /** Molar mass from a formula such as "Ca(OH)2" or "CuSO4·5H2O", using the element table. */
  Bank.molarMass = function (f) {
    const counts = Bank.countAtoms(f);
    let m = 0;
    for (const sym in counts) {
      if (!window.EL[sym]) throw new Error('Unknown element ' + sym + ' in ' + f);
      m += window.EL[sym].mass * counts[sym];
    }
    return m;
  };
  /** Atom counts from a formula: { Ca:1, O:2, H:2 }. */
  Bank.countAtoms = function (f) {
    const parse = (s) => {
      const stack = [{}];
      const re = /([A-Z][a-z]?)(\d*)|([(\[])|([)\]])(\d*)/g;
      let m;
      while ((m = re.exec(s))) {
        if (m[1]) { const top = stack[stack.length - 1]; top[m[1]] = (top[m[1]] || 0) + (m[2] ? +m[2] : 1); }
        else if (m[3]) stack.push({});
        else {
          const g = stack.pop(), k = m[5] ? +m[5] : 1, top = stack[stack.length - 1];
          for (const e in g) top[e] = (top[e] || 0) + g[e] * k;
        }
      }
      return stack[0];
    };
    const total = {};
    f.replace(/\s/g, '').split(/[·.]/).forEach((part) => {
      const c = /^(\d+)(.*)$/.exec(part);
      const mult = c ? +c[1] : 1;
      const counts = parse(c ? c[2] : part);
      for (const e in counts) total[e] = (total[e] || 0) + counts[e] * mult;
    });
    return total;
  };

  /** Read what someone typed as a number: accepts 6.02e23, 6.02x10^23, 6.02 × 10^23, 1,250. */
  Bank.parseNumber = function (raw) {
    if (raw === null || raw === undefined) return NaN;
    let s = String(raw).trim().replace(/[−–]/g, '-').replace(/,/g, '').replace(/\s+/g, '');
    s = s.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => '^' + m.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '-0123456789'['⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)]));
    const sci = /^([+-]?[\d.]+)[x×*]10\^?([+-]?\d+)$/i.exec(s);
    if (sci) return parseFloat(sci[1]) * Math.pow(10, +sci[2]);
    const pow = /^10\^([+-]?\d+)$/.exec(s);
    if (pow) return Math.pow(10, +pow[1]);
    // Allow a trailing unit such as "12.3g".
    const unit = /^([+-]?[\d.]+(?:e[+-]?\d+)?)([a-zA-Z/°%·]*\d*)$/i.exec(s);
    return unit ? parseFloat(unit[1]) : NaN;
  };
  /** Does typed text match an accepted answer? Ignores spaces, case and sub/superscript characters. */
  Bank.matchText = function (typed, accept) {
    const norm = (x) => String(x).replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).replace(/[\s_^]/g, '').toLowerCase();
    return accept.some((a) => norm(a) === norm(typed));
  };

  /* ---------- Quiz ---------- */
  function buildQuiz(host, items, opts = {}) {
    let answered = 0, correct = 0;
    const title = host.dataset.title || opts.title || 'Check yourself';
    host.classList.add('quiz');
    host.innerHTML = `<div class="quiz-head"><h3>${title}</h3><span class="quiz-score" aria-live="polite">${items.length} questions</span></div>`;
    const score = host.querySelector('.quiz-score');
    const foot = document.createElement('div');
    foot.className = 'quiz-foot'; foot.hidden = true;
    foot.innerHTML = '<span class="quiz-verdict"></span><button type="button" class="btn ghost small">Try again</button>';
    foot.querySelector('button').addEventListener('click', () => buildQuiz(host, items, opts));
    items.forEach((item, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'quiz-item';
      wrap.innerHTML = `<p class="quiz-q"><span class="quiz-n">${i + 1}</span><span>${Lab.texString(item.q)}</span></p>
        <ul class="quiz-opts" role="list">${item.options.map((o, j) => `<li><button type="button" class="quiz-opt" data-j="${j}"><span class="mark" aria-hidden="true"></span><span>${Lab.texString(o)}</span></button></li>`).join('')}</ul>
        <p class="quiz-why" hidden></p>`;
      const why = wrap.querySelector('.quiz-why');
      const btns = Lab.$$('.quiz-opt', wrap);
      btns.forEach((b) => b.addEventListener('click', () => {
        const j = +b.dataset.j, ok = j === item.answer;
        btns.forEach((x) => (x.disabled = true));
        btns[item.answer].classList.add('is-correct');
        btns[item.answer].querySelector('.mark').innerHTML = Lab.icons.check;
        if (!ok) { b.classList.add('is-wrong'); b.querySelector('.mark').innerHTML = Lab.icons.x; }
        why.innerHTML = `<strong>${ok ? 'Yes!' : 'Not quite.'}</strong> ${Lab.texString(item.why || '')}`;
        why.hidden = false;
        answered++;
        if (ok) { correct++; Lab.collection.award(1); } else Lab.sound.bad();
        score.textContent = answered === items.length ? `You got ${correct} of ${items.length}` : `${correct} of ${answered} right so far`;
        if (answered === items.length) {
          foot.hidden = false;
          const pct = correct / items.length;
          foot.querySelector('.quiz-verdict').textContent = pct === 1 ? 'A perfect run.' : pct >= 0.7 ? 'Solid. Review the ones you missed.' : 'Rewatch the animations, then try again.';
          if (pct === 1) Lab.confetti(60);
        }
        if (opts.onAnswer) opts.onAnswer(ok, item);
      }));
      host.appendChild(wrap);
    });
    host.appendChild(foot);
  }
  Bank.buildQuiz = buildQuiz;

  /* ---------- Practice gym ---------- */
  function buildPractice(host, bankId, gens) {
    host.classList.add('practice');
    let streak = 0, best = Lab.store.get('best:' + bankId, 0), solved = 0;
    const single = gens.length === 1;
    host.innerHTML = `
      <div class="practice-head">
        <div><h3>${host.dataset.title || 'Practice gym'}</h3><p class="practice-sub">New numbers every time. Keep going until it feels easy.</p></div>
        <div class="practice-stats"><span><b class="p-streak">0</b> in a row</span><span><b class="p-best">${best}</b> best</span></div>
      </div>
      ${single ? '' : `<div class="practice-types" role="group" aria-label="Problem type">
        <button type="button" class="chip is-on" data-g="*">Mixed</button>
        ${gens.map((g, i) => `<button type="button" class="chip" data-g="${i}">${g.title}</button>`).join('')}
      </div>`}
      <div class="practice-card" aria-live="polite"></div>`;
    const card = host.querySelector('.practice-card');
    const pStreak = host.querySelector('.p-streak');
    const pBest = host.querySelector('.p-best');
    let filter = '*';
    Lab.$$('.chip', host).forEach((c) => c.addEventListener('click', () => {
      Lab.$$('.chip', host).forEach((x) => x.classList.toggle('is-on', x === c));
      filter = c.dataset.g;
      next();
    }));

    function next() {
      const rng = makeRng();
      const g = filter === '*' ? rng.pick(gens) : gens[+filter];
      let prob;
      try { prob = g.make(rng); }
      catch (e) { console.error('Generator failed: ' + g.id, e); card.textContent = 'This problem could not be generated. Press Next.'; return; }
      render(prob, g);
    }
    function render(prob, gen) {
      const isChoice = Array.isArray(prob.choices);
      const isText = Array.isArray(prob.accept);
      card.innerHTML = `
        <p class="practice-kind">${gen.title}</p>
        <div class="practice-q">${Lab.texString(prob.q)}</div>
        ${isChoice
          ? `<div class="practice-choices">${prob.choices.map((c, i) => `<button type="button" class="quiz-opt" data-i="${i}"><span class="mark" aria-hidden="true"></span><span>${Lab.texString(c)}</span></button>`).join('')}</div>`
          : `<form class="practice-form" autocomplete="off">
              <label class="sr-only" for="p-${bankId}">Your answer</label>
              <input id="p-${bankId}" class="practice-input" inputmode="${isText ? 'text' : 'text'}" placeholder="${prob.placeholder || (isText ? 'Your answer' : 'Your answer')}" spellcheck="false">
              ${prob.unit ? `<span class="practice-unit">${Lab.texString(prob.unit)}</span>` : ''}
              <button class="btn small" type="submit">Check</button>
            </form>${isText || !prob.tip ? '' : ''}<p class="practice-note">${isText ? '' : 'Scientific notation works: 6.02e23 or 6.02x10^23.'}</p>`}
        <div class="practice-feedback" hidden></div>
        <div class="practice-steps" hidden></div>
        <div class="practice-actions" hidden><button type="button" class="btn next-btn">Next problem</button></div>`;
      const fb = card.querySelector('.practice-feedback');
      const stepsEl = card.querySelector('.practice-steps');
      const actions = card.querySelector('.practice-actions');
      let tries = 0, over = false;
      const showSteps = () => {
        if (!prob.steps || !prob.steps.length) return;
        stepsEl.hidden = false;
        stepsEl.innerHTML = '<h4>How to solve it</h4><ol>' + prob.steps.map((s) => `<li>${Lab.texString(s)}</li>`).join('') + '</ol>';
      };
      const finish = (ok) => {
        over = true;
        if (ok) {
          streak++; solved++;
          Lab.collection.award(1);
          if (streak > best) { best = streak; Lab.store.set('best:' + bankId, best); pBest.textContent = best; }
        } else streak = 0;
        pStreak.textContent = streak;
        actions.hidden = false;
        showSteps();
        const nb = actions.querySelector('.next-btn');
        nb.addEventListener('click', next);
        nb.focus({ preventScroll: true });
      };
      if (isChoice) {
        const btns = Lab.$$('.quiz-opt', card);
        btns.forEach((b) => b.addEventListener('click', () => {
          if (over) return;
          const i = +b.dataset.i, ok = i === prob.answer;
          btns.forEach((x) => (x.disabled = true));
          btns[prob.answer].classList.add('is-correct');
          btns[prob.answer].querySelector('.mark').innerHTML = Lab.icons.check;
          if (!ok) { b.classList.add('is-wrong'); b.querySelector('.mark').innerHTML = Lab.icons.x; Lab.sound.bad(); }
          fb.hidden = false;
          fb.className = 'practice-feedback ' + (ok ? 'is-good' : 'is-bad');
          fb.innerHTML = ok ? 'Correct!' : 'Not this time. Here is how it works.';
          finish(ok);
        }));
      } else {
        const form = card.querySelector('form');
        const input = card.querySelector('input');
        input.focus({ preventScroll: true });
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          if (over) return;
          const raw = input.value;
          if (!raw.trim()) { input.focus(); return; }
          let ok;
          if (isText) ok = Bank.matchText(raw, prob.accept);
          else {
            const v = Bank.parseNumber(raw);
            if (!Number.isFinite(v)) {
              fb.hidden = false; fb.className = 'practice-feedback is-bad';
              fb.textContent = 'Enter a number, like 12.5 or 3.2e-4.';
              return;
            }
            const tol = prob.tol === undefined ? 0.02 : prob.tol;
            ok = Math.abs(v - prob.answer) <= Math.abs(prob.answer) * tol + 1e-12;
          }
          tries++;
          fb.hidden = false;
          if (ok) {
            fb.className = 'practice-feedback is-good';
            fb.innerHTML = 'Correct!' + (isText ? '' : ` The answer is ${prob.answerText || Lab.sig(prob.answer, prob.sf || 3)}${prob.unit ? ' ' + Lab.texString(prob.unit) : ''}.`);
            input.disabled = true;
            finish(true);
          } else if (tries === 1 && prob.hint) {
            Lab.sound.bad();
            fb.className = 'practice-feedback is-hint';
            fb.innerHTML = `<strong>Close the gap:</strong> ${Lab.texString(prob.hint)}`;
            input.select();
          } else if (tries < 2) {
            Lab.sound.bad();
            fb.className = 'practice-feedback is-hint';
            fb.textContent = 'Not yet. Check your setup and try once more.';
            input.select();
          } else {
            Lab.sound.bad();
            fb.className = 'practice-feedback is-bad';
            const shown = isText ? prob.accept[0] : (prob.answerText || Lab.sig(prob.answer, prob.sf || 3));
            fb.innerHTML = `The answer is <strong>${Lab.texString(shown)}</strong>${prob.unit ? ' ' + Lab.texString(prob.unit) : ''}.`;
            input.disabled = true;
            finish(false);
          }
        });
      }
    }
    next();
  }
  Bank.buildPractice = buildPractice;

  /* ---------- Mount every [data-quiz] and [data-practice] on the page ---------- */
  Bank.mountAll = function () {
    Lab.$$('[data-quiz]').forEach((el) => {
      const b = Bank.all[el.dataset.quiz];
      if (!b || !b.quiz) { console.error('No quiz for ' + el.dataset.quiz); return; }
      buildQuiz(el, b.quiz);
    });
    Lab.$$('[data-practice]').forEach((el) => {
      const b = Bank.all[el.dataset.practice];
      if (!b || !b.gens || !b.gens.length) { console.error('No practice for ' + el.dataset.practice); return; }
      buildPractice(el, el.dataset.practice, b.gens);
    });
  };
})();
