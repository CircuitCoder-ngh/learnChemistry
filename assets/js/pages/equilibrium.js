/* Lesson 13: Chemical equilibrium. A real two-way particle sim, K and Q, ICE tables, Le Chatelier. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const COL = { A: C.pink, B: C.cyan, C: C.leaf };

  /* ---------- Small helpers ---------- */
  /** A generic species, with its letter. These are stand-ins, not atoms, so they have their own colors. */
  function species(g, x, y, r, k, o = {}) {
    Art.atom(g, x, y, r, k, Object.assign({ color: COL[k], label: k, labelColor: '#fff' }, o));
  }
  /** Particles on a loose grid. Which ones are B moves around with time, while the share stays at fracB. */
  function swarm(g, x0, y0, x1, y1, N, fracB, t, flip = 0.09, r = 16) {
    const cols = Math.round(Math.sqrt(N * (x1 - x0) / (y1 - y0))), rows = Math.ceil(N / cols);
    const cw = (x1 - x0) / cols, ch = (y1 - y0) / rows;
    for (let i = 0; i < N; i++) {
      const px = x0 + ((i % cols) + 0.5) * cw + wander(i + 3, t * 0.9) * 6;
      const py = y0 + (Math.floor(i / cols) + 0.5) * ch + wander(i + 40, t * 0.9) * 6;
      const ph = ((i * 0.618034 + t * flip) % 1 + 1) % 1;
      const isB = ph < fracB;
      const near = Math.min(ph, Math.abs(ph - fracB), 1 - ph);
      const pop = flip && fracB > 0 && fracB < 1 ? clamp(1 - near / 0.02) : 0;
      const rr = r * (1 + 0.28 * pop);
      Art.ball(g, px, py, rr, isB ? C.cyan : C.pink);
      Art.text(g, isB ? 'B' : 'A', px, py + 1, { size: 21, color: '#fff' });
    }
  }
  function frame(g, x0, y0, x1, y1) {
    g.fillStyle = 'rgba(214,240,255,.05)'; Art.round(g, x0, y0, x1 - x0, y1 - y0, 14); g.fill();
    g.strokeStyle = 'rgba(214,240,255,.6)'; g.lineWidth = 4; g.stroke();
  }
  /* The story's reaction: K = 2. Fraction of A against progress u. */
  const aOf = (u) => 1 / 3 + (2 / 3) * Math.exp(-u * 7);
  const fw = (u) => 2 * aOf(u), rv = (u) => 1 - aOf(u);
  const PLOT = { x0: 450, x1: 770, y0: 356, y1: 88 };
  function ratePlot(g, u, a = 1) {
    const X = (v) => lerp(PLOT.x0, PLOT.x1, v), Y = (v) => lerp(PLOT.y0, PLOT.y1, v / 2.1);
    g.save(); g.globalAlpha *= a;
    Art.arrow(g, PLOT.x0, PLOT.y0, PLOT.x0, PLOT.y1 - 22, { color: C.dim, w: 4 });
    Art.arrow(g, PLOT.x0, PLOT.y0, PLOT.x1 + 16, PLOT.y0, { color: C.dim, w: 4 });
    const line = (fn, color) => {
      g.beginPath();
      for (let i = 0; i <= 80; i++) { const v = (i / 80) * u; const x = X(v), y = Y(fn(v)); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.strokeStyle = color; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
    };
    line(fw, C.pink); line(rv, C.cyan);
    Art.ball(g, X(u), Y(fw(u)), 10, C.pink); Art.ball(g, X(u), Y(rv(u)), 10, C.cyan);
    g.restore();
    Art.text(g, 'Rate', PLOT.x0 + 34, PLOT.y1 - 20, { size: 25, color: C.dim, alpha: a });
    Art.text(g, 'Time', (PLOT.x0 + PLOT.x1) / 2, PLOT.y0 + 28, { size: 25, color: C.dim, alpha: a });
  }
  const yOf = (v) => lerp(PLOT.y0, PLOT.y1, v / 2.1), xOf = (v) => lerp(PLOT.x0, PLOT.x1, v);

  /* ---------- Story 1: dynamic balance ---------- */
  Lab.story('#story-balance', {
    title: 'How a reaction finds its balance',
    scenes: [
      {
        say: 'Meet A and B. A can turn into B, and B can turn back into A. The double arrow means both are happening. A turning into B is the <b>forward</b> reaction, and the other way is the <b>reverse</b>.',
        dur: 3.6,
        draw(g, p, t) {
          const a = ease.back(seg(p, 0, 0.25)), b = ease.back(seg(p, 0.15, 0.4));
          const y = 220;
          Art.popIn(g, 180, y + wander(1, t) * 5, a, (gg) => species(gg, 0, 0, 74, 'A', { face: 'happy', look: [1, 0], t }));
          Art.popIn(g, 620, y + wander(2, t) * 5, b, (gg) => species(gg, 0, 0, 74, 'B', { face: 'happy', look: [-1, 0], t, seed: 2 }));
          Art.arrow(g, 282, y - 34, 518, y - 34, { color: C.pink, w: 11, p: seg(p, 0.35, 0.6) });
          Art.arrow(g, 518, y + 34, 282, y + 34, { color: C.cyan, w: 11, p: seg(p, 0.55, 0.8) });
          Art.text(g, 'Forward', 400, y - 76, { font: 'display', size: 34, color: C.pink, alpha: seg(p, 0.4, 0.6) });
          Art.text(g, 'Reverse', 400, y + 78, { font: 'display', size: 34, color: C.cyan, alpha: seg(p, 0.6, 0.8) });
          g.save(); g.globalAlpha *= seg(p, 0.7, 0.9); Art.formula(g, 'A <=> B', 400, 400, { size: 44 }); g.restore();
        },
      },
      {
        say: 'Start with only A. Lots of A means the forward reaction is <b>fast</b>. There is no B yet, so the reverse rate is <b>zero</b>.',
        dur: 3,
        draw(g, p, t) {
          const u = lerp(0, 0.01, p);
          frame(g, 30, 60, 400, 400);
          swarm(g, 30, 60, 400, 400, 24, 0, t * 0.3, 0);
          Art.text(g, 'All A at the start', 215, 30, { size: 26 });
          ratePlot(g, u);
          Art.text(g, 'Forward: fast', xOf(0.01) + 38, yOf(fw(u)) + 2, { size: 27, color: C.pink, align: 'left' });
          Art.text(g, 'Reverse: zero', xOf(0.01) + 38, yOf(0) - 28, { size: 27, color: C.cyan, align: 'left' });
          Art.ring(g, xOf(u), yOf(fw(u)), 24, { color: C.sun, w: 4, p: seg(p, 0.2, 0.6) });
        },
      },
      {
        say: 'As B builds up, the picture changes. Less A means a <b>slower</b> forward rate. More B means a <b>faster</b> reverse rate. The two rates close in on each other.',
        dur: 3.8,
        draw(g, p, t) {
          const u = lerp(0.01, 0.2, ease.inOut(p));
          frame(g, 30, 60, 400, 400);
          swarm(g, 30, 60, 400, 400, 24, 1 - aOf(u), t * 0.3, 0.12);
          Art.text(g, 'B is building up', 215, 30, { size: 26 });
          ratePlot(g, u);
          const fy = yOf(fw(u)), ry = yOf(rv(u));
          Art.text(g, 'Forward slows', xOf(u) + 22, fy - 30, { size: 27, color: C.pink, align: 'left', halo: true });
          Art.text(g, 'Reverse speeds up', xOf(u) + 22, ry + 38, { size: 27, color: C.cyan, align: 'left', halo: true });
        },
      },
      {
        say: 'Eventually the rates are <b>equal</b>. Each second, as many A turn into B as B turn into A, so the amounts stop changing. This is <b>equilibrium</b>.',
        dur: 4,
        draw(g, p, t) {
          const u = lerp(0.2, 1, ease.inOut(seg(p, 0, 0.85)));
          frame(g, 30, 60, 400, 400);
          swarm(g, 30, 60, 400, 400, 24, 1 - aOf(u), t * 0.3, 0.18);
          Art.text(g, 'The amounts settle', 215, 30, { size: 26 });
          ratePlot(g, u);
          const q = ease.back(seg(p, 0.8, 1));
          if (q > 0) {
            g.save(); g.translate(636, 172); g.scale(q, q);
            g.fillStyle = C.leaf; Art.round(g, -130, -34, 260, 68, 26); g.fill();
            Art.text(g, 'Rates are equal', 0, 1, { font: 'display', size: 30, color: '#14301F' });
            g.restore();
            Art.arrow(g, 680, 212, 710, yOf(fw(1)) - 18, { color: C.leaf, w: 5, p: seg(p, 0.86, 1) });
          }
        },
      },
      {
        say: 'Nothing looks like it is happening, but look closer. Molecules keep flipping both ways at the same pace. That is why we call it <b>dynamic</b>: like a bridge with equal traffic in both directions.',
        dur: 3.2,
        draw(g, p, t) {
          const a = seg(p, 0, 0.25);
          g.save(); g.globalAlpha *= a;
          frame(g, 24, 110, 234, 370); frame(g, 566, 110, 776, 370);
          swarm(g, 24, 110, 234, 370, 8, 0, t, 0);
          swarm(g, 566, 110, 776, 370, 16, 1, t, 0, 15);
          g.restore();
          Art.text(g, '8 of A', 129, 76, { font: 'display', size: 36, color: C.pink, alpha: a });
          Art.text(g, '16 of B', 671, 76, { font: 'display', size: 36, color: C.cyan, alpha: a });
          // Two lanes. Particles change identity as they cross the middle.
          const lane = (y, dir, phase) => {
            for (let i = 0; i < 4; i++) {
              const u = ((t * 0.3 + i * 0.25 + phase) % 1);
              const x = dir > 0 ? lerp(254, 546, u) : lerp(546, 254, u);
              const isB = dir > 0 ? u > 0.5 : u < 0.5;
              const q = clamp(Math.min(u, 1 - u) * 8);
              if (q <= 0 || a <= 0) continue;
              Art.ball(g, x, y, 22 * q, isB ? C.cyan : C.pink);
              if (q > 0.7) Art.text(g, isB ? 'B' : 'A', x, y + 1, { size: 24, color: '#fff' });
            }
          };
          g.fillStyle = 'rgba(255,255,255,.07)'; Art.round(g, 244, 172, 312, 62, 18); g.fill(); Art.round(g, 244, 252, 312, 62, 18); g.fill();
          lane(203, 1, 0); lane(283, -1, 0.1);
          Art.text(g, 'Same speed both ways', 400, 142, { size: 26, color: C.sun, alpha: seg(p, 0.3, 0.5) });
          Art.text(g, 'So the counts stay the same', 400, 412, { size: 28, color: C.leaf, alpha: seg(p, 0.5, 0.75) });
        },
      },
      {
        say: 'Equal <b>rates</b> do not mean equal <b>amounts</b>. Each of these two mixtures is at equilibrium, and they look nothing alike. Where a reaction settles depends on $K$.',
        dur: 3.4,
        draw(g, p, t) {
          const q1 = seg(p, 0, 0.3), q2 = seg(p, 0.25, 0.55);
          g.save(); g.globalAlpha *= q1;
          frame(g, 40, 76, 370, 326); swarm(g, 40, 76, 370, 326, 20, 0.8, t, 0.07, 15);
          g.restore();
          g.save(); g.globalAlpha *= q2;
          frame(g, 430, 76, 760, 326); swarm(g, 430, 76, 760, 326, 20, 0.2, t, 0.07, 15);
          g.restore();
          Art.text(g, 'K = 4: mostly B', 205, 40, { font: 'display', size: 34, color: C.cyan, alpha: q1 });
          Art.text(g, 'K = 0.25: mostly A', 595, 40, { font: 'display', size: 34, color: C.pink, alpha: q2 });
          const arrows = (cx, a) => {
            Art.arrow(g, cx - 80, 358, cx + 80, 358, { color: C.pink, w: 7, alpha: a });
            Art.arrow(g, cx + 80, 386, cx - 80, 386, { color: C.cyan, w: 7, alpha: a });
          };
          arrows(205, q1); arrows(595, q2);
          Art.text(g, 'Equal rates in both', 400, 424, { size: 27, color: C.leaf, alpha: seg(p, 0.6, 0.85) });
        },
      },
    ],
  });

  /* ---------- Bench: the equilibrium lab ---------- */
  const BX = { x0: 14, y0: 14, x1: 412, y1: 346 };
  const PT = { x0: 462, x1: 786, y0: 300, y1: 34 };
  const CAP = 96, CHUNK = 15, R_ = 13.5;
  const eq = { T: 300, type: 'exo', plot: 'rates', box: null, series: [], marks: [], clock: 0, sample: 0, f: 0, r: 0, nA: 60, nB: 0, yMax: 12, say: '' };
  const kRates = (T = eq.T, type = eq.type) => {
    const a = 1 / 300 - 1 / T, exo = type === 'exo';
    return { kf: 0.25 * Math.exp((exo ? 1000 : 3000) * a), kr: 0.125 * Math.exp((exo ? 3000 : 1000) * a) };
  };
  const kEq = (T, type) => { const k = kRates(T, type); return k.kf / k.kr; };
  const count = (kind) => eq.box.particles.filter((q) => q.kind === kind).length;
  const SAY_START = 'All A to begin with. Watch the two rates come together, then try a button. <b>Before you press, predict which way it will shift.</b> A simplified model: A and B flip at random, at rates that follow the Arrhenius equation.';
  function reset() {
    const box = new Sim.Box({ x0: BX.x0, y0: BX.y0, x1: BX.x1, y1: BX.y1, speed: 95, temperature: eq.T / 300, seed: 7 + Math.floor(Math.random() * 999) });
    box.add({ n: 60, r: R_, kind: 'A' });
    eq.box = box;
    eq.series = []; eq.marks = []; eq.clock = 0; eq.sample = 0;
    const k = kRates();
    eq.nA = 60; eq.nB = 0; eq.f = k.kf * 60; eq.r = 0;
    say(SAY_START);
  }
  function say(html) { eq.say = html; Lab.$('#le-say').innerHTML = '<p>' + Lab.texString(html) + '</p>'; }
  function mark(label) {
    eq.marks.push({ t: eq.clock, label });
    if (eq.marks.length > 8) eq.marks.shift();
  }
  function stress(kind) {
    const box = eq.box;
    const total = box.particles.length;
    const K = kEq(eq.T, eq.type).toFixed(2);
    if (kind === 'add-a') {
      const n = Math.min(CHUNK, CAP - total);
      if (n <= 0) { say('The box is full. Remove something first.'); return; }
      box.add({ n, r: R_, kind: 'A' }); mark('+A');
      say(`You added A. That lowered $Q$ below $K$, so the <b>forward</b> rate jumps and the reaction shifts forward until $Q = K$ again. $K$ is still ${K}.`);
    } else if (kind === 'add-b') {
      const n = Math.min(CHUNK, CAP - total);
      if (n <= 0) { say('The box is full. Remove something first.'); return; }
      box.add({ n, r: R_, kind: 'B' }); mark('+B');
      say(`You added B. That raised $Q$ above $K$, so the <b>reverse</b> rate jumps and the reaction shifts backward until $Q = K$ again. $K$ is still ${K}.`);
    } else if (kind === 'rem-b') {
      if (!count('B')) { say('There is no B left to remove.'); return; }
      box.remove('B', CHUNK); mark('−B');
      say(`You removed B. That lowered $Q$ below $K$, so the <b>reverse</b> rate drops and the reaction shifts forward to replace some B. $K$ is still ${K}.`);
    } else if (kind === 'rem-a') {
      if (!count('A')) { say('There is no A left to remove.'); return; }
      box.remove('A', CHUNK); mark('−A');
      say(`You removed A. That raised $Q$ above $K$, so the <b>forward</b> rate drops and the reaction shifts backward to replace some A. $K$ is still ${K}.`);
    }
    Lab.sound.pop();
  }
  function labPlot(g) {
    const t0 = Math.max(0, eq.clock - 40);
    const X = (t) => lerp(PT.x0, PT.x1, (t - t0) / 40);
    const isRates = eq.plot === 'rates';
    const keyA = isRates ? 'f' : 'a', keyB = isRates ? 'r' : 'b';
    let top = isRates ? 6 : 40;
    eq.series.forEach((s) => { if (s.t >= t0) top = Math.max(top, s[keyA], s[keyB]); });
    eq.yMax = lerp(eq.yMax, top * 1.15, 0.08);
    const Y = (v) => lerp(PT.y0, PT.y1, Math.min(1, v / eq.yMax));
    g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(PT.x0, PT.y1, PT.x1 - PT.x0, PT.y0 - PT.y1);
    g.fillStyle = C.dim; g.fillRect(PT.x0 - 3, PT.y1, 3, PT.y0 - PT.y1 + 3); g.fillRect(PT.x0, PT.y0, PT.x1 - PT.x0, 3);
    g.save(); g.translate(438, (PT.y0 + PT.y1) / 2); g.rotate(-Math.PI / 2);
    Art.text(g, isRates ? 'Rate' : 'How many', 0, 0, { size: 23, color: C.dim });
    g.restore();
    Art.text(g, 'Time', (PT.x0 + PT.x1) / 2, PT.y0 + 24, { size: 23, color: C.dim });
    // Each disturbance gets a dashed line where it happened.
    let lastX = -999;
    eq.marks.forEach((m) => {
      if (m.t < t0) return;
      const x = X(m.t);
      g.save(); g.setLineDash([6, 6]); g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, PT.y1); g.lineTo(x, PT.y0); g.stroke(); g.restore();
      if (x - lastX > 42) { Art.text(g, m.label, x, 18, { size: 21, color: C.sun }); lastX = x; }
    });
    const line = (key, color) => {
      g.beginPath(); let first = true;
      eq.series.forEach((s) => {
        if (s.t < t0) return;
        const x = X(s.t), y = Y(s[key]);
        if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y);
      });
      g.strokeStyle = color; g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke();
    };
    line(keyA, C.pink); line(keyB, C.cyan);
    const last = eq.series[eq.series.length - 1];
    if (last) {
      const ya = Y(last[keyA]), yb = Y(last[keyB]);
      const xEnd = Math.min(PT.x1 - 6, X(last.t) - 4);
      const upperIsA = ya <= yb;
      const close = Math.abs(ya - yb) < 44;
      const yUpper = (upperIsA ? ya : yb) - (close ? 28 : 22);
      const yLower = (upperIsA ? yb : ya) + (close ? 28 : 22);
      const placeA = clamp(upperIsA ? yUpper : yLower, PT.y1 + 14, PT.y0 - 14);
      const placeB = clamp(upperIsA ? yLower : yUpper, PT.y1 + 14, PT.y0 - 14);
      const left = eq.clock < 14 ? xEnd + 110 : xEnd;
      const ax = Math.min(PT.x1 - 6, left);
      Art.text(g, isRates ? 'Forward' : 'A', ax, placeA, { size: 24, color: C.pink, align: 'right', halo: true });
      Art.text(g, isRates ? 'Reverse' : 'B', ax, placeB, { size: 24, color: C.cyan, align: 'right', halo: true });
    }
  }
  function labBottom(g, t, k) {
    // Left: the two arrows, drawn as thick as the rates are fast.
    const ya = 462, xA = 66, xB = 356;
    const exo = eq.type === 'exo';
    Art.text(g, exo ? 'A ⇌ B + heat' : 'A + heat ⇌ B', 212, 376, { font: 'display', size: 30, color: exo ? C.fire : C.sun });
    const w = (v) => clamp(v * 1.0, 3, 24);
    const wf = w(eq.f), wr = w(eq.r);
    species(g, xA, ya, 40, 'A', { face: 'happy', look: [1, 0], t, label: false });
    species(g, xB, ya, 40, 'B', { face: 'happy', look: [-1, 0], t, seed: 2, label: false });
    Art.arrow(g, xA + 48, ya - 22, xB - 54, ya - 22, { color: C.pink, w: wf, head: Math.max(16, wf * 1.6) });
    Art.arrow(g, xB - 48, ya + 24, xA + 54, ya + 24, { color: C.cyan, w: wr, head: Math.max(16, wr * 1.6) });
    Art.text(g, 'Forward', (xA + xB) / 2, ya - 56, { size: 22, color: C.pink });
    Art.text(g, 'Reverse', (xA + xB) / 2, ya + 60, { size: 22, color: C.cyan });

    // Right: Q against K, on a scale where each tick is ten times the last.
    const x0 = 474, x1 = 774, y = 456;
    const toX = (v) => lerp(x0, x1, clamp((Math.log10(Math.max(v, 1e-4)) + 2) / 4));
    const K = k.kf / k.kr;
    const nA = eq.nA, nB = eq.nB;
    const Q = nA > 0.5 ? nB / nA : 1e3;
    g.fillStyle = 'rgba(255,255,255,.22)'; Art.round(g, x0, y - 6, x1 - x0, 12, 6); g.fill();
    [[0.01, '0.01'], [0.1, '0.1'], [1, '1'], [10, '10'], [100, '100']].forEach(([v, s]) => {
      g.fillStyle = C.dim; g.fillRect(toX(v) - 1.5, y - 10, 3, 20);
      Art.text(g, s, toX(v), y + 28, { size: 20, color: C.dim });
    });
    const kx = toX(K), qx = toX(Q);
    g.fillStyle = C.sun; g.beginPath(); g.moveTo(kx, y - 12); g.lineTo(kx - 12, y - 32); g.lineTo(kx + 12, y - 32); g.closePath(); g.fill();
    Art.text(g, 'K = ' + (K < 10 ? K.toFixed(2) : K.toFixed(1)), clamp(kx, x0 + 54, x1 - 54), y - 52, { font: 'display', size: 28, color: C.sun });
    Art.ball(g, qx, y, 16, '#FFFFFF');
    Art.text(g, 'Q', qx, y + 1, { size: 21, color: '#22123A' });
    const ratio = Math.log(Math.max(Q, 1e-4) / K);
    const at = Math.abs(ratio) < 0.3;
    const verdict = at ? 'Q is about K: at equilibrium' : ratio < 0 ? 'Q is below K: shifting forward' : 'Q is above K: shifting backward';
    Art.text(g, verdict, (x0 + x1) / 2, 516, { size: 23, color: at ? C.leaf : C.ink });
    if (at) { /* The verdict turns green at balance. */ }
  }
  reset();
  Lab.stage('#c-lab', {
    h: 536,
    label: 'A box of A and B particles flipping back and forth, with a live graph of forward and reverse rates, two arrows sized by rate, and a scale comparing Q with K.',
    draw(g, t, dt) {
      const box = eq.box, k = kRates();
      if (dt > 0) {
        box.step(dt);
        const pf = 1 - Math.exp(-k.kf * dt), pr = 1 - Math.exp(-k.kr * dt);
        box.particles.forEach((q) => {
          if (q.kind === 'A' && Math.random() < pf) { q.kind = 'B'; q.pop = 1; }
          else if (q.kind === 'B' && Math.random() < pr) { q.kind = 'A'; q.pop = 1; }
          if (q.pop) q.pop = Math.max(0, q.pop - dt * 3);
        });
        eq.clock += dt; eq.sample += dt;
        const na = count('A'), nb = box.particles.length - na;
        const s = 1 - Math.exp(-dt / 0.7);
        eq.nA += (na - eq.nA) * s; eq.nB += (nb - eq.nB) * s;
        eq.f = k.kf * eq.nA; eq.r = k.kr * eq.nB;
        if (eq.sample > 0.2) {
          eq.sample = 0;
          eq.series.push({ t: eq.clock, f: eq.f, r: eq.r, a: eq.nA, b: eq.nB });
          if (eq.series.length > 230) eq.series.shift();
        }
      }
      frame(g, BX.x0, BX.y0, BX.x1, BX.y1);
      box.particles.forEach((q) => {
        const rr = q.r * (1 + 0.4 * (q.pop || 0));
        if (q.pop) { g.strokeStyle = Art.alpha('#FFFFFF', 0.7 * q.pop); g.lineWidth = 3; g.beginPath(); g.arc(q.x, q.y, rr + 8 * (1 - q.pop), 0, TAU); g.stroke(); }
        Art.ball(g, q.x, q.y, rr, q.kind === 'A' ? C.pink : C.cyan);
        Art.text(g, q.kind, q.x, q.y + 1, { size: 21, color: '#fff' });
      });
      labPlot(g);
      labBottom(g, t, k);
    },
  });
  Lab.$('#le-add-a').addEventListener('click', () => stress('add-a'));
  Lab.$('#le-add-b').addEventListener('click', () => stress('add-b'));
  Lab.$('#le-rem-b').addEventListener('click', () => stress('rem-b'));
  Lab.$('#le-rem-a').addEventListener('click', () => stress('rem-a'));
  Lab.$('#le-reset').addEventListener('click', () => { reset(); tempFrom = eq.T; });
  const tempSay = (T0, T1) => {
    const K0 = kEq(T0, eq.type), K1 = kEq(T1, eq.type), hot = T1 > T0, exo = eq.type === 'exo';
    const role = exo ? 'a product' : 'a reactant';
    const dir = (hot && exo) || (!hot && !exo) ? 'backward' : 'forward';
    return `You ${hot ? 'heated' : 'cooled'} it. In this ${exo ? 'exothermic' : 'endothermic'} reaction, heat acts as ${role}. So $K$ itself changes, from ${K0.toFixed(2)} to ${K1.toFixed(2)}, and the reaction shifts <b>${dir}</b>. This is the only stress that changes $K$.`;
  };
  let lastMarkT = -5, tempFrom = 300;
  Lab.bind('#le-t', '#le-t-out', (v) => v + ' K', (v) => {
    if (v === eq.T) return;
    if (v !== tempFrom) say(tempSay(tempFrom, v));
    eq.T = v;
    eq.box.setTemperature(v / 300);
    if (eq.clock - lastMarkT > 1.5 && v !== tempFrom) { mark(v > tempFrom ? 'heat' : 'cool'); lastMarkT = eq.clock; tempFrom = v; }
  });
  Lab.segmented('#le-type', (v) => {
    eq.type = v;
    say(`The forward reaction is now ${v === 'exo' ? 'exothermic, so heat is a product: $\\text{A} \\rightleftharpoons \\text{B} + \\text{heat}$' : 'endothermic, so heat is a reactant: $\\text{A} + \\text{heat} \\rightleftharpoons \\text{B}$'}. At 300 K both have the same $K$. Now change the temperature and see what differs.`);
  });
  Lab.segmented('#le-plot', (v) => { eq.plot = v; eq.yMax = v === 'rates' ? 14 : 70; });

  /* ---------- Story 2: K and Q ---------- */
  /** A fraction drawn on the canvas. */
  function fraction(g, x, y, top, bottom, o = {}) {
    const size = o.size || 42;
    g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
    const w = Math.max(g.measureText(top).width, g.measureText(bottom).width) + 24;
    Art.text(g, top, x, y - size * 0.78, { font: 'display', size, color: o.top || C.cyan, alpha: o.alpha });
    Art.text(g, bottom, x, y + size * 0.82, { font: 'display', size, color: o.bottom || C.pink, alpha: o.alpha });
    g.fillStyle = Art.alpha(C.ink, o.alpha === undefined ? 1 : o.alpha); g.fillRect(x - w / 2, y - 2.5, w, 5);
    return w;
  }
  /** A bar split between reactants and products, for a size of K. */
  function splitBar(g, y, K, label, q, t) {
    const x0 = 250, x1 = 700, reactantShare = 1 / (1 + K);
    const mid = lerp(x0, x1, reactantShare * q + (1 - q) * 0.5);
    Art.text(g, label, 44, y, { font: 'display', size: 32, align: 'left', alpha: q, color: C.sun });
    g.save(); g.globalAlpha *= q;
    g.fillStyle = C.pink; Art.round(g, x0, y - 26, Math.max(mid - x0, 6), 52, 12); g.fill();
    g.fillStyle = C.cyan; Art.round(g, mid, y - 26, Math.max(x1 - mid, 6), 52, 12); g.fill();
    g.restore();
    const word = K > 10 ? 'Mostly products' : K < 0.1 ? 'Mostly reactants' : 'A good mix of both';
    Art.text(g, word, 475, y + 1, { size: 25, color: '#fff', alpha: q, halo: true });
    void t;
  }
  Lab.story('#story-k', {
    title: 'K and Q',
    scenes: [
      {
        say: '$K$ is a fraction: <b>products on top, reactants on the bottom</b>. Each coefficient becomes an exponent. Watch the 3 and the 2 climb up.',
        dur: 4,
        draw(g, p, t) {
          Art.formula(g, 'N2 + 3H2 <=> 2NH3', 400, 62, { size: 48, colorize: true });
          const a = seg(p, 0.05, 0.3);
          Art.text(g, 'K =', 196, 262, { font: 'display', size: 56, color: C.sun, alpha: a });
          fraction(g, 420, 262, '[NH₃]²', '[N₂] [H₂]³', { size: 56, alpha: seg(p, 0.1, 0.35) });
          // The coefficients travel to their exponents.
          const q1 = ease.inOut(seg(p, 0.4, 0.66)), q2 = ease.inOut(seg(p, 0.6, 0.86));
          if (q1 > 0 && q1 < 1) Art.text(g, '2', lerp(462, 480, q1), lerp(62, 178, q1), { font: 'display', size: 48, color: C.sun, halo: true });
          if (q2 > 0 && q2 < 1) Art.text(g, '3', lerp(310, 516, q2), lerp(62, 314, q2), { font: 'display', size: 48, color: C.sun, halo: true });
          Art.ring(g, 485, 178, 30, { color: C.sun, w: 4, p: seg(p, 0.66, 0.78) });
          Art.ring(g, 530, 320, 30, { color: C.sun, w: 4, p: seg(p, 0.86, 0.98) });
          Art.text(g, 'Products on top', 150, 180, { size: 25, color: C.cyan, alpha: seg(p, 0.2, 0.4) });
          Art.text(g, 'Reactants below', 150, 344, { size: 25, color: C.pink, alpha: seg(p, 0.2, 0.4) });
          Art.text(g, 'Multiply. Never add.', 400, 410, { size: 28, color: C.ink, alpha: seg(p, 0.88, 1) });
        },
      },
      {
        say: '<b>Leave out pure solids and liquids.</b> Their concentration never changes, so they have no place in $K$. For limestone breaking down, only the gas is left.',
        dur: 3.6,
        draw(g, p, t) {
          Art.formula(g, 'CaCO3(s) <=> CaO(s) + CO2(g)', 400, 62, { size: 42, colorize: true });
          const a = seg(p, 0.05, 0.25);
          Art.text(g, 'K =', 140, 226, { font: 'display', size: 52, color: C.sun, alpha: a });
          fraction(g, 390, 226, '[CaO] [CO₂]', '[CaCO₃]', { size: 52, alpha: a });
          const s = seg(p, 0.3, 0.5), s2 = seg(p, 0.42, 0.62);
          Art.strike(g, 258, 186, 388, 148, s, C.red, 8);
          Art.strike(g, 300, 288, 480, 252, s2, C.red, 8);
          const q = ease.back(seg(p, 0.68, 0.88));
          if (q > 0) {
            g.save(); g.translate(400, 374); g.scale(q, q);
            g.fillStyle = C.plum2; Art.round(g, -180, -40, 360, 80, 28); g.fill();
            Art.text(g, 'K = [CO₂]', 0, 2, { font: 'display', size: 46, color: C.sun });
            g.restore();
          }
          Art.moe(g, 716, 430, 120, 'point', { t, flip: true });
        },
      },
      {
        say: 'The size of $K$ tells you where the reaction settles. A big $K$ means <b>mostly products</b>. A small $K$ means <b>mostly reactants</b>. Close to 1 means a good mix.',
        dur: 3.4,
        draw(g, p, t) {
          Art.text(g, 'Reactants', 330, 56, { font: 'display', size: 30, color: C.pink, alpha: seg(p, 0, 0.2) });
          Art.text(g, 'Products', 620, 56, { font: 'display', size: 30, color: C.cyan, alpha: seg(p, 0, 0.2) });
          splitBar(g, 134, 1000, 'K = 1000', ease.out(seg(p, 0.05, 0.35)), t);
          splitBar(g, 244, 1, 'K = 1', ease.out(seg(p, 0.3, 0.6)), t);
          splitBar(g, 354, 0.001, 'K = 0.001', ease.out(seg(p, 0.55, 0.85)), t);
        },
      },
      {
        say: '$Q$ is the same fraction, using the amounts <b>right now</b>. If $Q < K$, it needs more product, so it runs forward. If $Q > K$, it runs in reverse. It always heads toward $K$.',
        dur: 5,
        draw(g, p, t) {
          const x0 = 70, x1 = 730, y = 226;
          g.fillStyle = 'rgba(255,255,255,.22)'; Art.round(g, x0, y - 9, x1 - x0, 18, 9); g.fill();
          const kx = 400;
          g.fillStyle = C.sun; g.beginPath(); g.moveTo(kx, y - 16); g.lineTo(kx - 18, y - 46); g.lineTo(kx + 18, y - 46); g.closePath(); g.fill();
          Art.text(g, 'K', kx, y - 74, { font: 'display', size: 50, color: C.sun });
          Art.text(g, 'Too little product', 200, 116, { size: 26, color: C.pink, alpha: seg(p, 0.05, 0.25) });
          Art.text(g, 'Too much product', 600, 116, { size: 26, color: C.cyan, alpha: seg(p, 0.5, 0.7) });
          // First Q starts low and climbs to K, then another starts high and falls to K.
          const q1 = ease.inOut(seg(p, 0.12, 0.45)), q2 = ease.inOut(seg(p, 0.58, 0.92));
          const lx = lerp(120, kx - 30, q1), hx = lerp(680, kx + 30, q2);
          Art.ball(g, lx, y, 28, '#FFFFFF'); Art.text(g, 'Q', lx, y + 1, { size: 28, color: '#22123A' });
          if (p > 0.5) { Art.ball(g, hx, y, 28, '#FFFFFF'); Art.text(g, 'Q', hx, y + 1, { size: 28, color: '#22123A' }); }
          Art.arrow(g, 120, y + 66, 340, y + 66, { color: C.pink, w: 7, p: seg(p, 0.15, 0.4) });
          Art.text(g, 'Runs forward', 230, y + 104, { font: 'display', size: 32, color: C.pink, alpha: seg(p, 0.3, 0.45) });
          Art.arrow(g, 680, y + 66, 460, y + 66, { color: C.cyan, w: 7, p: seg(p, 0.6, 0.85) });
          Art.text(g, 'Runs in reverse', 570, y + 104, { font: 'display', size: 32, color: C.cyan, alpha: seg(p, 0.75, 0.9) });
          Art.text(g, 'Q is pulled toward K', 400, 412, { size: 28, color: C.leaf, alpha: seg(p, 0.9, 1) });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: the ICE table solver ---------- */
  const ice = { type: 'ab', a: 1, K: 2, shown: null };
  function solve(type, a, K) {
    if (type === 'ab') return (K * a) / (1 + K);
    if (type === 'a2b') return (-K + Math.sqrt(K * K + 16 * K * a)) / 8;
    const s = Math.sqrt(K);
    return (a * s) / (2 + s);
  }
  const ICE_DEF = {
    ab: { eq: 'A <=> B', cols: ['A', 'B'], change: ['−x', '+x'], end: (a) => [`${a} − x`, 'x'], vals: (a, x) => [a - x, x], init: (a) => [a, 0] },
    a2b: { eq: 'A <=> 2B', cols: ['A', 'B'], change: ['−x', '+2x'], end: (a) => [`${a} − x`, '2x'], vals: (a, x) => [a - x, 2 * x], init: (a) => [a, 0] },
    abc: { eq: 'A + B <=> 2C', cols: ['A', 'B', 'C'], change: ['−x', '−x', '+2x'], end: (a) => [`${a} − x`, `${a} − x`, '2x'], vals: (a, x) => [a - x, a - x, 2 * x], init: (a) => [a, a, 0] },
  };
  const iceStage = Lab.stage('#c-ice', {
    h: 440,
    label: 'An ICE table with rows for initial, change and equilibrium, solved live, beside bars comparing the starting and final amounts.',
    draw(g, t, dt) {
      const d = ICE_DEF[ice.type];
      const x = solve(ice.type, ice.a, ice.K);
      const vals = d.vals(ice.a, x);
      const aStr = ice.a.toFixed(2);
      if (!ice.shown || ice.shown.length !== vals.length) ice.shown = vals.slice();
      ice.shown = ice.shown.map((v, i) => lerp(v, vals[i], dt > 0 ? clamp(dt * 9) : 1));
      Art.formula(g, d.eq, 280, 34, { size: 38 });
      // The table.
      const n = d.cols.length;
      const x0 = 18, rowLab = 142, colW = (530 - rowLab) / n;
      const rows = [{ y: 72, h: 44 }, { y: 116, h: 62 }, { y: 178, h: 62 }, { y: 240, h: 62 }, { y: 302, h: 78 }];
      g.fillStyle = 'rgba(255,255,255,.06)'; Art.round(g, x0, rows[0].y, 530, rows[4].y + rows[4].h - rows[0].y, 14); g.fill();
      g.fillStyle = 'rgba(255,210,63,.16)'; Art.round(g, x0, rows[4].y, 530, rows[4].h, 14); g.fill();
      for (let i = 1; i < rows.length; i++) { g.fillStyle = C.line; g.fillRect(x0 + 8, rows[i].y, 514, 2); }
      const cx = (i) => x0 + rowLab + (i + 0.5) * colW;
      d.cols.forEach((c, i) => Art.text(g, c, cx(i), rows[0].y + rows[0].h / 2 + 1, { font: 'display', size: 32, color: COL[c] }));
      const lab = ['Initial', 'Change', 'Equilibrium', 'Solved (M)'];
      [1, 2, 3, 4].forEach((r, k) => Art.text(g, lab[k], x0 + 12, rows[r].y + rows[r].h / 2 + 1, { size: 23, align: 'left', color: r === 4 ? C.sun : C.ink }));
      const init = d.init(ice.a);
      d.cols.forEach((c, i) => {
        Art.text(g, init[i] === 0 ? '0' : init[i].toFixed(2), cx(i), rows[1].y + 32, { size: 26 });
        Art.text(g, d.change[i], cx(i), rows[2].y + 32, { size: 28, color: d.change[i][0] === '+' ? C.leaf : C.red });
        Art.text(g, d.end(aStr)[i], cx(i), rows[3].y + 32, { size: n === 3 && i < 2 ? 22 : 26 });
        Art.text(g, vals[i].toFixed(vals[i] < 0.1 ? 3 : 2) , cx(i), rows[4].y + 40, { font: 'display', size: 36, color: C.sun });
      });
      // Bars on the right: ghost outline is the start, solid is equilibrium.
      const bx0 = 580, bx1 = 784, by0 = 348, byTop = 92;
      const maxV = Math.max(...init, ...vals, 0.1);
      const bw = (bx1 - bx0) / n;
      Art.text(g, 'Start and end', (bx0 + bx1) / 2, 50, { size: 24, color: C.dim });
      d.cols.forEach((c, i) => {
        const bcx = bx0 + (i + 0.5) * bw, w = Math.min(bw - 16, 72);
        const h0 = (init[i] / maxV) * (by0 - byTop), h1 = (ice.shown[i] / maxV) * (by0 - byTop);
        g.fillStyle = COL[c];
        Art.round(g, bcx - w / 2, by0 - Math.max(h1, 3), w, Math.max(h1, 3), 8); g.fill();
        if (h0 > 2) {
          g.save(); g.setLineDash([7, 6]); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3;
          Art.round(g, bcx - w / 2, by0 - h0, w, h0, 8); g.stroke(); g.restore();
        }
        Art.text(g, c, bcx, by0 + 24, { font: 'display', size: 28, color: COL[c] });
      });
      g.fillStyle = C.dim; g.fillRect(bx0, by0, bx1 - bx0, 3);
      const Q = ice.type === 'ab' ? vals[1] / vals[0] : ice.type === 'a2b' ? (vals[1] * vals[1]) / vals[0] : (vals[2] * vals[2]) / (vals[0] * vals[1]);
      Art.text(g, `x = ${Lab.sig(x, 3)} M`, 280, 412, { font: 'display', size: 34, color: C.pink });
      Art.text(g, `Check: Q = ${Lab.sig(Q, 3)}`, 672, 412, { size: 24, color: C.leaf });
      void t;
    },
  });
  function paintIce() {
    const { type, a, K } = ice;
    const x = solve(type, a, K);
    const A = a.toFixed(2), Ks = Lab.sig(K, 3);
    let lines = [];
    if (type === 'ab') {
      lines = [`K = \\frac{[\\text{B}]}{[\\text{A}]} \\quad\\Rightarrow\\quad ${Ks} = \\frac{x}{${A} - x}`, `x = \\frac{K\\,a}{1 + K} = \\frac{(${Ks})(${A})}{1 + ${Ks}} = ${Lab.sig(x, 3)}\\text{ M}`];
    } else if (type === 'a2b') {
      lines = [`K = \\frac{[\\text{B}]^2}{[\\text{A}]} \\quad\\Rightarrow\\quad ${Ks} = \\frac{(2x)^2}{${A} - x}`, `4x^2 + ${Ks}x - ${Lab.sig(K * a, 3)} = 0`, `x = \\frac{-${Ks} + \\sqrt{(${Ks})^2 + 16(${Lab.sig(K * a, 3)})}}{8} = ${Lab.sig(x, 3)}\\text{ M}`];
    } else {
      lines = [`K = \\frac{[\\text{C}]^2}{[\\text{A}][\\text{B}]} \\quad\\Rightarrow\\quad ${Ks} = \\frac{(2x)^2}{(${A} - x)^2}`, `\\sqrt{${Ks}} = \\frac{2x}{${A} - x} \\quad\\Rightarrow\\quad x = \\frac{(${Lab.sig(Math.sqrt(K), 3)})(${A})}{2 + ${Lab.sig(Math.sqrt(K), 3)}} = ${Lab.sig(x, 3)}\\text{ M}`];
    }
    Lab.$('#ice-calc').innerHTML = Lab.texString(lines.map((l) => `<div class="calc-line">$$${l}$$</div>`).join(''));
    iceStage.redraw();
  }
  Lab.segmented('#ice-type', (v) => { ice.type = v; ice.shown = null; paintIce(); });
  Lab.bind('#ice-a', '#ice-a-out', (v) => v.toFixed(2) + ' M', (v) => { ice.a = v; paintIce(); });
  Lab.bind('#ice-k', '#ice-k-out', (v) => Lab.sig(Number(Math.pow(10, v).toPrecision(2)), 2), (v) => { ice.K = Number(Math.pow(10, v).toPrecision(2)); paintIce(); });

  /* ---------- Story 3: a gas you can see shift ---------- */
  /** One NO2 unit, with a brown glow when it is free, since free NO2 is what colors the gas. */
  function no2(g, x, y, b, rot, glow) {
    if (glow > 0) { g.fillStyle = `rgba(190,92,34,${0.55 * glow})`; g.beginPath(); g.arc(x, y, b * 1.75, 0, TAU); g.fill(); }
    Art.molecule(g, x, y, b, 'NO2', { rot, labels: false, style: 'fill', atomScale: 1.18 });
  }
  /** s = 0: two units joined at the nitrogens as N2O4. s = 1: two free NO2 at their own spots. */
  function pair(g, ax, ay, bx, by, s, b) {
    const mx = (ax + bx) / 2, my = (ay + by) / 2, ang = Math.atan2(by - ay, bx - ax);
    const d = b * 0.72, c = Math.cos(ang), n = Math.sin(ang);
    const x1 = lerp(mx - c * d, ax, s), y1 = lerp(my - n * d, ay, s), x2 = lerp(mx + c * d, bx, s), y2 = lerp(my + n * d, by, s);
    // In NO2 the nitrogen sits on the -y side, so these rotations point the two nitrogens at each other.
    no2(g, x1, y1, b, ang + Math.PI / 2, s);
    no2(g, x2, y2, b, ang - Math.PI / 2, s);
  }
  /* Five pairs hold 10 nitrogen atoms, so atoms are conserved at every shift. */
  const SITES = [[-0.62, -0.42, -0.12, -0.66], [0.2, -0.62, 0.66, -0.3], [-0.24, -0.1, 0.24, 0.0], [-0.72, 0.12, -0.42, 0.56], [0.02, 0.62, 0.6, 0.4]];
  /** level 0: 1 pair split. level 0.5: 2 split. level 1: 4 split. */
  function gasView(g, cx, cy, R, level, t) {
    const order = [2, 4, 0, 3, 1];
    const nSplit = 1 + level * 3;
    SITES.forEach((st, i) => {
      const s = ease.inOut(clamp(nSplit - order.indexOf(i)));
      const dx = wander(i, t) * 3, dy = wander(i + 7, t) * 3;
      pair(g, cx + st[0] * R + dx, cy + st[1] * R + dy, cx + st[2] * R + dx, cy + st[3] * R + dy, s, R * 0.115);
    });
  }
  const brown = (f) => Art.alpha('#B3521C', 0.06 + 0.86 * f);
  function gasTube(g, cx, top, w, h, f) {
    const x0 = cx - w / 2, r = w / 2, bottom = top + h;
    g.beginPath(); g.moveTo(x0, top + 8); g.lineTo(x0, bottom - r); g.arc(cx, bottom - r, r, Math.PI, 0, true); g.lineTo(x0 + w, top + 8); g.closePath();
    g.fillStyle = brown(f); g.fill();
    Art.testTube(g, cx, top, w, h, { level: 0 });
    g.fillStyle = '#6B4A32'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, cx - w / 2 - 3, top - 16, w + 6, 30, 7); g.fill(); g.stroke();
  }
  const GAS_EQ = (g, a = 1) => { g.save(); g.globalAlpha *= a; Art.formula(g, 'N2O4 + heat <=> 2NO2', 400, 36, { size: 38, colorize: true }); g.restore(); };
  Lab.story('#story-gas', {
    title: 'A gas you can watch shift',
    scenes: [
      {
        say: '$\\ce{N2O4}$ is colorless. Split it in two and you get $\\ce{NO2}$, a <b>brown</b> gas. The forward direction takes in heat, so it is <b>endothermic</b>. The color of the tube tells you which side is winning.',
        dur: 3.6,
        draw(g, p, t) {
          GAS_EQ(g, seg(p, 0, 0.2));
          gasTube(g, 150, 110, 112, 270, 0.42);
          Art.text(g, 'Pale brown', 150, 414, { size: 25, alpha: seg(p, 0.1, 0.3) });
          Art.zoom(g, 190, 220, 456, 240, 128, (gg, cx, cy, R) => gasView(gg, cx, cy, R, 0.5, t), { p: seg(p, 0.2, 0.5) });
          const a = seg(p, 0.6, 0.8);
          g.save(); g.globalAlpha *= a;
          pair(g, 656, 150, 716, 150, 0, 22);
          pair(g, 640, 312, 732, 312, 1, 20);
          g.restore();
          g.save(); g.globalAlpha *= a;
          Art.formula(g, 'N2O4', 686, 210, { size: 28, colorize: true, halo: true });
          Art.formula(g, 'NO2', 686, 362, { size: 28, colorize: true, halo: true });
          g.restore();
          Art.text(g, 'colorless', 686, 240, { size: 23, color: C.dim, alpha: a });
          Art.text(g, 'brown', 686, 392, { size: 23, color: '#E89A62', alpha: a });
        },
      },
      {
        say: '<b>Heat it.</b> Heat is on the reactant side here, so adding heat pushes the reaction forward. More $\\ce{NO2}$ forms, and the tube turns dark brown.',
        dur: 3.8,
        draw(g, p, t) {
          GAS_EQ(g);
          const q = ease.inOut(seg(p, 0.15, 0.85));
          const f = lerp(0.42, 0.95, q);
          Art.beaker(g, 150, 396, 200, 180, { level: 0.82, liquid: '#E0662C', ticks: false, inside: (gg, box) => Art.bubbles(gg, box.x0 + 12, box.x1 - 12, box.bottom - 8, box.top + 8, t * 0.6, { n: 8, r: 5 }) });
          gasTube(g, 150, 110, 92, 260, f);
          Art.smoke(g, 90, 214, t, { n: 6, h: 60, r: 8 }); Art.smoke(g, 214, 214, t + 1.3, { n: 6, h: 60, r: 8 });
          Art.text(g, 'Hot water', 150, 424, { size: 25, color: C.fire });
          Art.zoom(g, 190, 220, 478, 214, 142, (gg, cx, cy, R) => gasView(gg, cx, cy, R, lerp(0.5, 1, q), t * 1.5), { rim: C.fire });
          Art.arrow(g, 348, 396, 608, 396, { color: C.fire, w: 9, p: seg(p, 0.45, 0.8) });
          Art.text(g, 'Shifts forward', 478, 426, { font: 'display', size: 30, color: C.fire, alpha: seg(p, 0.6, 0.85) });
          Art.text(g, 'K goes up', 722, 214, { font: 'display', size: 30, color: C.sun, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: '<b>Cool it.</b> Taking heat away pushes the reaction backward. $\\ce{NO2}$ pairs up into $\\ce{N2O4}$, and the color fades. Put it back in hot water and the brown returns: it really is reversible.',
        dur: 3.8,
        draw(g, p, t) {
          GAS_EQ(g);
          const q = ease.inOut(seg(p, 0.15, 0.85));
          const f = lerp(0.42, 0.1, q);
          Art.beaker(g, 150, 396, 200, 180, { level: 0.82, liquid: '#7FCBEF', ticks: false, inside: (gg) => {
            [[92, 262, 0.3], [144, 240, 1.1], [206, 268, 2.4], [110, 318, 0.9], [196, 330, 1.8], [150, 360, 0.2]].forEach(([x, y, a]) => {
              g.save(); gg.translate(x, y); gg.rotate(a); gg.fillStyle = 'rgba(240,250,255,.85)'; gg.strokeStyle = 'rgba(120,180,220,.9)'; gg.lineWidth = 2; Art.round(gg, -15, -15, 30, 30, 6); gg.fill(); gg.stroke(); g.restore();
            });
          } });
          gasTube(g, 150, 110, 92, 260, f);
          Art.text(g, 'Ice water', 150, 424, { size: 25, color: C.cyan });
          Art.zoom(g, 190, 220, 478, 214, 142, (gg, cx, cy, R) => gasView(gg, cx, cy, R, lerp(0.5, 0, q), t * 0.5), {});
          Art.arrow(g, 608, 396, 348, 396, { color: C.cyan, w: 9, p: seg(p, 0.45, 0.8) });
          Art.text(g, 'Shifts backward', 478, 426, { font: 'display', size: 30, color: C.cyan, alpha: seg(p, 0.6, 0.85) });
          Art.text(g, 'K goes down', 722, 214, { font: 'display', size: 28, color: C.sun, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: '<b>Squeeze it.</b> The gas first looks darker, simply because it is crowded. Then it pales a little: the system eases the crowding by favoring the side with <b>fewer gas molecules</b>. $K$ does not change.',
        dur: 5,
        draw(g, p, t) {
          GAS_EQ(g);
          const sq = ease.inOut(seg(p, 0.1, 0.42)), shift = ease.inOut(seg(p, 0.5, 0.95));
          const pos = lerp(0.82, 0.32, sq);
          const f = lerp(0.42, 0.86, sq) - 0.22 * shift;
          Art.piston(g, 150, 396, 140, 268, pos, { inside: (gg, box) => { gg.fillStyle = brown(f); gg.fillRect(box.x0, box.top, box.x1 - box.x0, box.bottom - box.top); } });
          if (sq < 1 && sq > 0) Art.arrow(g, 150, 60, 150, 96, { color: C.sun, w: 8 });
          Art.zoom(g, 190, 300, 500, 216, 142, (gg, cx, cy, R) => gasView(gg, cx, cy, R, lerp(0.5, 0.05, shift), t * 0.5), {});
          Art.text(g, shift > 0.5 ? 'Then it pales a little' : 'First it looks darker', 150, 424, { size: 25, color: C.sun, alpha: seg(p, 0.15, 0.3) });
          Art.text(g, '1 gas molecule on the left', 590, 386, { size: 25, color: C.leaf, alpha: seg(p, 0.6, 0.8) });
          Art.text(g, '2 gas molecules on the right', 590, 420, { size: 25, color: C.dim, alpha: seg(p, 0.6, 0.8) });
          Art.moe(g, 720, 200, 110, 'think', { t, flip: true });
        },
      },
    ],
  });
});
