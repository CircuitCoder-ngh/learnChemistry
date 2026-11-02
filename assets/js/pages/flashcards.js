/* Flashcards: every bank's cards, with Leitner boxes kept in this browser.

   The boxes: a new card starts in box 1. "Knew it" moves it up one box and waits longer before
   showing it again. "Study again" sends it back to box 1, and it comes round again this round. */
Lab.ready(function () {
  'use strict';
  const { $, $$ } = Lab;
  const WAIT_DAYS = [0, 1, 2, 4, 8, 16]; // Index by box. Box 1 comes back tomorrow, box 5 in 16 days.
  const ROUND = 15;                       // Cards in one sitting.
  const EARN_EVERY = 5;                   // Promotions that find one new element.
  const host = $('#fc');
  const today = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };

  /** Short stable id, so a card keeps its box as long as its question stays the same. */
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  const shuffled = (list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  /* ---------- Memory ---------- */
  const load = () => Lab.store.get('leitner', {});
  let memory = load();
  const save = () => Lab.store.set('leitner', memory);
  const boxOf = (card) => (memory[card.id] ? memory[card.id].b : 1);
  const isDue = (card) => !memory[card.id] || memory[card.id].due <= today();

  /* ---------- State ---------- */
  let deck = [];
  let unit = 'all';
  let queue = [];
  let current = null;
  let flipped = false;
  let extra = false;       // Extra practice: nothing moves between boxes.
  let round = null;        // { knew, again, total }
  let busy = false;
  let firstCard = true;

  Bank.loadAll().then(() => {
    const seen = new Set();
    Lab.lessons.forEach((l) => {
      const b = Bank.all[l.id];
      if (!b || !Array.isArray(b.cards)) return;
      b.cards.forEach((c) => {
        if (!c || !c.front || !c.back) return;
        const id = hash(l.id + '|' + c.front);
        if (seen.has(id)) return;
        seen.add(id);
        deck.push({ id, lesson: l, front: c.front, back: c.back });
      });
    });
    buildChips();
    startRound();
    document.addEventListener('keydown', onKey);
  });

  const inUnit = () => (unit === 'all' ? deck : deck.filter((c) => c.lesson.unit.id === unit));

  /* ---------- Unit chips ---------- */
  function buildChips() {
    const counts = {};
    deck.forEach((c) => { counts[c.lesson.unit.id] = (counts[c.lesson.unit.id] || 0) + 1; });
    const units = Lab.course.filter((u) => counts[u.id]);
    $('#fc-units').innerHTML = `<button type="button" class="chip is-on" data-u="all">All units <small>${deck.length}</small></button>` +
      units.map((u) => `<button type="button" class="chip" data-u="${u.id}">${u.title} <small>${counts[u.id]}</small></button>`).join('');
    $$('#fc-units .chip').forEach((b) => b.addEventListener('click', () => {
      $$('#fc-units .chip').forEach((x) => x.classList.toggle('is-on', x === b));
      unit = b.dataset.u;
      extra = false;
      startRound();
      focusCard();
    }));
  }

  /* ---------- A round ---------- */
  function pickQueue() {
    const pool = inUnit();
    const due = extra ? pool : pool.filter(isDue);
    // Lower boxes first, shuffled within each box, so shaky cards get the attention.
    const byBox = shuffled(due).sort((a, b) => boxOf(a) - boxOf(b));
    return byBox.slice(0, ROUND);
  }
  function startRound() {
    queue = pickQueue();
    round = { knew: 0, again: 0, total: queue.length };
    paintBoxes();
    next();
  }
  function next() {
    current = queue.shift() || null;
    flipped = false;
    if (current) paintCard(); else paintDone();
    paintProgress();
  }
  /* The player replaces its buttons, so keep keyboard users in place. */
  function focusCard() {
    const c = $('#fc-card') || $('#fc-player button');
    if (c) c.focus({ preventScroll: true });
  }
  const progressText = () => {
    const left = queue.length + (current ? 1 : 0);
    if (!round.total || !left) return '';
    return `${left} card${left === 1 ? '' : 's'} left in this round${extra ? ' of extra practice' : ''}`;
  };
  function paintProgress() {
    $('#fc-progress').textContent = progressText();
    const done = round.total ? (round.knew / round.total) * 100 : 0;
    $('#fc-bar').style.width = done + '%';
  }

  /* ---------- The card ---------- */
  function paintCard() {
    const c = current;
    const l = c.lesson;
    $('#fc-player').innerHTML = `
      <button type="button" class="fc-card" id="fc-card" aria-label="Flip the card" style="--u:${Lab.unitColor(l.unit.id)}">
        <span class="fc-inner">
          <span class="fc-face fc-front" id="fc-front"><span class="fc-tag">Lesson ${l.num}: ${l.title}</span><span class="fc-text">${Lab.texString(c.front)}</span><span class="fc-hint">Say it out loud, then flip</span></span>
          <span class="fc-face fc-back" id="fc-back" aria-hidden="true"><span class="fc-tag">Answer</span><span class="fc-text">${Lab.texString(c.back)}</span></span>
        </span>
      </button>
      <div class="fc-actions" id="fc-actions">
        <button type="button" class="btn sun fc-flip-btn" id="fc-flip">Flip the card</button>
      </div>
      <p class="fc-keys">On a keyboard: space flips, 1 is study again, 2 is knew it.</p>`;
    const card = $('#fc-card');
    card.classList.add('is-in');
    card.addEventListener('click', flip);
    $('#fc-flip').addEventListener('click', flip);
    setMoe('think');
    if (firstCard) { say('Try to answer before you flip.'); firstCard = false; }
  }
  function flip() {
    if (!current || busy) return;
    flipped = !flipped;
    const card = $('#fc-card');
    card.classList.toggle('is-flipped', flipped);
    $('#fc-front').setAttribute('aria-hidden', String(flipped));
    $('#fc-back').setAttribute('aria-hidden', String(!flipped));
    card.setAttribute('aria-label', flipped ? 'Flip back to the question' : 'Flip the card');
    Lab.sound.pop();
    if (flipped && !$('#fc-again')) {
      $('#fc-actions').innerHTML = `
        <button type="button" class="btn fc-again" id="fc-again">Study again</button>
        <button type="button" class="btn fc-knew" id="fc-knew">Knew it</button>`;
      $('#fc-again').addEventListener('click', () => answer(false));
      $('#fc-knew').addEventListener('click', () => answer(true));
    }
  }

  /* ---------- Answering ---------- */
  function answer(knew) {
    if (!current || busy || !flipped) return;
    busy = true;
    const card = current;
    const before = boxOf(card);
    let after = before;
    if (!extra) {
      after = knew ? Math.min(5, before + 1) : 1;
      memory[card.id] = { b: after, due: today() + (knew ? WAIT_DAYS[after] : 0) };
      save();
    }
    if (knew) { round.knew++; Lab.sound.good(); } else { round.again++; Lab.sound.bad(); }
    // A card you missed comes back later in this round.
    if (!knew) queue.splice(Math.min(queue.length, 3), 0, card);
    else if (!extra) earn();
    setMoe(knew ? 'cheer' : 'oops');
    say(knew ? (extra ? 'Nice.' : `Up to box ${after}. See you in ${WAIT_DAYS[after]} day${WAIT_DAYS[after] === 1 ? '' : 's'}.`) : (extra ? 'It will come back in a moment.' : 'Back to box 1. It will come back in a moment.'));
    flyToBox(after, knew, () => {
      paintBoxes(after);
      busy = false;
      next();
      focusCard();
    });
  }
  /* Every few promotions pays out one new element. */
  function earn() {
    const n = Lab.store.get('fc:earn', 0) + 1;
    if (n >= EARN_EVERY) { Lab.store.set('fc:earn', 0); Lab.collection.award(1); }
    else Lab.store.set('fc:earn', n);
    paintEarn();
  }
  function paintEarn() {
    const n = Lab.store.get('fc:earn', 0);
    $('#fc-earn').innerHTML = `<span class="fc-pips" aria-hidden="true">${Array.from({ length: EARN_EVERY }, (_, i) => `<i class="${i < n ? 'is-on' : ''}"></i>`).join('')}</span><span>${EARN_EVERY - n} more knew-it${EARN_EVERY - n === 1 ? '' : 's'} to discover the next element</span>`;
  }
  function flyToBox(box, knew, done) {
    const el = $('#fc-card');
    const target = $(`.fc-box[data-b="${box}"]`);
    if (Lab.reducedMotion || !el || !target || !el.animate) { done(); return; }
    const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = el.animate([
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1, offset: 0 },
      { transform: `translate(0,-14px) scale(1.03) rotate(${knew ? 1.5 : -1.5}deg)`, opacity: 1, offset: 0.22 },
      { transform: `translate(${dx}px,${dy}px) scale(0.1) rotate(${knew ? 10 : -10}deg)`, opacity: 0.25, offset: 1 },
    ], { duration: 460, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' });
    anim.onfinish = done;
    anim.oncancel = done;
  }

  /* ---------- The five boxes ---------- */
  function paintBoxes(bump) {
    const pool = inUnit();
    const counts = [0, 0, 0, 0, 0, 0];
    pool.forEach((c) => { counts[boxOf(c)]++; });
    const max = Math.max(1, ...counts);
    $('#fc-boxes').innerHTML = [1, 2, 3, 4, 5].map((b) => {
      const n = counts[b];
      const fill = n ? Math.max(12, Math.round((n / max) * 100)) : 0;
      return `<li class="fc-box${bump === b ? ' is-bump' : ''}" data-b="${b}">
        <span class="fc-box-body"><i class="fc-stack" style="height:${fill}%"></i><b>${n}</b></span>
        <span class="fc-box-name">Box ${b}</span>
        <span class="fc-box-wait">${b === 1 ? 'every day' : `every ${WAIT_DAYS[b]} days`}</span>
      </li>`;
    }).join('');
  }

  /* ---------- Moe ---------- */
  function setMoe(mood) {
    const m = $('#fc-moe');
    if (m.dataset.mood === mood) return;
    m.dataset.mood = mood;
    m.innerHTML = window.Moe ? window.Moe.svg(mood) : '';
  }
  function say(text) { $('#fc-say').textContent = text; }

  /* ---------- End of round ---------- */
  function paintDone() {
    const pool = inUnit();
    const player = $('#fc-player');
    if (!deck.length) {
      setMoe('oops');
      say('The cards are still being written.');
      player.innerHTML = `<div class="fc-done"><h2>No cards yet</h2><p>Each lesson adds its own cards here. Check back soon, or start with <a href="mole.html">the mole</a>.</p></div>`;
      return;
    }
    const dueLeft = pool.filter(isDue).length;
    const finishedSomething = round.total > 0;
    if (finishedSomething && !extra && dueLeft === 0) Lab.confetti(70);
    if (finishedSomething) Lab.sound.fanfare();
    setMoe(finishedSomething ? 'cheer' : 'happy');
    say(finishedSomething ? 'That is how it sticks.' : 'Nothing to review. Rest is part of it.');
    // When is the next one due?
    let nextDue = Infinity;
    pool.forEach((c) => { const m = memory[c.id]; if (m) nextDue = Math.min(nextDue, m.due); });
    const inDays = Number.isFinite(nextDue) ? nextDue - today() : null;
    const when = inDays === null ? '' : inDays <= 0 ? 'More are waiting today.' : inDays === 1 ? 'Your next cards are due tomorrow.' : `Your next cards are due in ${inDays} days.`;
    const stats = finishedSomething
      ? `<p class="fc-score"><b>${round.knew}</b> knew it, <b>${round.again}</b> study again</p>` : '';
    const moreBtn = dueLeft > 0 && !extra ? `<button type="button" class="btn sun" id="fc-more">Start the next round (${Math.min(ROUND, dueLeft)} cards)</button>` : '';
    const title = dueLeft > 0 && !extra ? 'Round finished' : extra ? 'Extra practice finished' : 'All caught up';
    player.innerHTML = `<div class="fc-done">
      <h2>${title}</h2>
      ${stats}
      <p>${dueLeft > 0 && !extra ? `${dueLeft} card${dueLeft === 1 ? '' : 's'} still due today in this set.` : when}</p>
      <div class="fc-done-btns">${moreBtn}<button type="button" class="btn ghost-dark" id="fc-extra">Review ${Math.min(ROUND, pool.length)} anyway, without moving boxes</button></div>
    </div>`;
    const more = $('#fc-more');
    if (more) more.addEventListener('click', () => { extra = false; startRound(); focusCard(); });
    $('#fc-extra').addEventListener('click', () => { extra = true; startRound(); focusCard(); });
  }

  /* ---------- Keyboard ---------- */
  function onKey(e) {
    if (e.target.closest && e.target.closest('input, textarea, select, a')) return;
    if (!current) return;
    if (e.key === ' ') {
      // A focused button already answers to the space bar.
      if (e.target.closest && e.target.closest('button')) return;
      e.preventDefault();
      flip();
    } else if (e.key === '1' && flipped) answer(false);
    else if (e.key === '2' && flipped) answer(true);
  }

  $('#fc-reset').addEventListener('click', () => {
    if (!window.confirm('Put every card back in box 1?')) return;
    memory = {};
    save();
    extra = false;
    startRound();
  });
  paintEarn();
  setMoe('happy');
  say('Loading the cards.');
});
