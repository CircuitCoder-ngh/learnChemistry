/* Lesson 12: Reaction rates. Collision reactor, energy hill, rate laws and first-order decay. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;

  /* ---------- Small drawing helpers used only by this lesson ---------- */
  /** Draw explicit atoms and bonds, for reactions where atoms change partners. */
  function atoms(g, list, bonds = []) {
    bonds.forEach(([a, b, order]) => Art.bond(g, list[a].x, list[a].y, list[b].x, list[b].y, { order: order || 1, width: 7 }));
    list.forEach((a) => Art.atom(g, a.x, a.y, a.r || 25, a.sym, { face: a.face, look: a.look, t: a.t, seed: a.seed || 0 }));
  }
  /** Speed lines trailing behind something moving along dir (+1 right, -1 left). */
  function speedLines(g, x, y, dir, power, color = C.ink) {
    if (power <= 0.02) return;
    g.save(); g.strokeStyle = Art.alpha(color, 0.5 * Math.min(1, power)); g.lineWidth = 4; g.lineCap = 'round';
    [-26, 0, 26].forEach((dy, i) => {
      const len = (24 + 30 * power) * (i === 1 ? 1.25 : 1);
      g.beginPath(); g.moveTo(x - dir * 8, y + dy); g.lineTo(x - dir * (8 + len), y + dy); g.stroke();
    });
    g.restore();
  }
  /** The energy-of-this-hit meter, with the bar a collision has to clear. */
  function hitMeter(g, frac, q, ok) {
    const x = 170, y = 396, w = 460, h = 26, bar = 0.62;
    Art.text(g, 'Energy of the hit', x, y - 26, { size: 24, align: 'left', color: C.dim });
    Art.meter(g, x, y, w, h, frac * q, { color: ok ? C.leaf : frac < bar ? C.cyan : C.fire });
    const bx = x + w * bar;
    g.fillStyle = C.sun; g.fillRect(bx - 2.5, y - 8, 5, h + 16);
    Art.text(g, 'Needed', bx, y - 26, { size: 24, color: C.sun });
  }
  /** Reactants and products on a smooth hill, u from 0 to 1. */
  function hillY(u, r, top, pr) {
    const s = (v) => { const q = clamp(v); return q * q * (3 - 2 * q); };
    return u < 0.5 ? lerp(r, top, s((u - 0.14) / 0.36)) : lerp(top, pr, s((u - 0.5) / 0.36));
  }
  const H = { x0: 110, x1: 720, y0: 392, re: 266, pr: 330, top: 80 };
  const hillX = (u) => lerp(H.x0, H.x1, u);
  function hillAxes(g, a = 1) {
    g.save(); g.globalAlpha *= a;
    Art.arrow(g, H.x0 - 34, H.y0 + 16, H.x0 - 34, 36, { color: C.dim, w: 4 });
    Art.arrow(g, H.x0 - 34, H.y0 + 16, H.x1 + 44, H.y0 + 16, { color: C.dim, w: 4 });
    g.restore();
    g.save(); g.translate(44, 216); g.rotate(-Math.PI / 2);
    Art.text(g, 'Energy', 0, 0, { size: 24, color: C.dim, alpha: a });
    g.restore();
    Art.text(g, 'Reaction progress', 415, 431, { size: 24, color: C.dim, alpha: a });
  }
  function hillCurve(g, top, q = 1, o = {}) {
    const N = 80;
    g.save();
    if (o.fill !== false) {
      g.beginPath(); g.moveTo(hillX(0), H.y0 + 16);
      for (let i = 0; i <= N * q; i++) g.lineTo(hillX(i / N), hillY(i / N, H.re, top, H.pr));
      g.lineTo(hillX(Math.floor(N * q) / N), H.y0 + 16); g.closePath();
      g.fillStyle = Art.alpha(o.color || C.violet, 0.14); g.fill();
    }
    g.beginPath();
    for (let i = 0; i <= N * q; i++) { const x = hillX(i / N), y = hillY(i / N, H.re, top, H.pr); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.strokeStyle = o.color || C.violet; g.lineWidth = o.w || 7; g.lineCap = 'round'; g.lineJoin = 'round';
    if (o.dash) g.setLineDash(o.dash);
    g.stroke();
    g.restore();
  }
  /** Maxwell-Boltzmann energy distribution, in 3D, normalized to the same total area. */
  const mb = (E, kT) => (2 / Math.sqrt(Math.PI)) * Math.pow(1 / kT, 1.5) * Math.sqrt(Math.max(E, 0)) * Math.exp(-E / kT);

  /* ---------- Story 1: what it takes to react ---------- */
  const EQ_Y = 42;
  const drawEq = (g, a = 1) => { g.save(); g.globalAlpha *= a; Art.formula(g, 'NO + O3 -> NO2 + O2', 400, EQ_Y, { size: 36, colorize: true }); g.restore(); };

  Lab.story('#story-collide', {
    title: 'What it takes to react',
    scenes: [
      {
        say: 'A <b>reaction rate</b> is how fast reactants get used up. Fireworks do it in a blink. A nail rusts over years. Same idea, wildly different speeds.',
        dur: 3.6,
        draw(g, p, t) {
          // Fireworks, on the left.
          const a = seg(p, 0, 0.22);
          for (let i = 0; i < 4; i++) {
            const ph = ((t * 0.42 + i * 0.25) % 1);
            const x = 210 + [-90, 80, -20, 50][i], y = 170 + [-20, 30, 50, -50][i];
            g.save(); g.globalAlpha *= a;
            Art.burst(g, x, y, ph, { n: 20, r: 120, size: 12, seed: i * 3 });
            g.restore();
          }
          Art.text(g, 'Fireworks', 210, 322, { font: 'display', size: 38, alpha: a });
          Art.text(g, 'done in about a second', 210, 362, { size: 25, color: C.sun, alpha: a });
          // A nail rusting, on the right.
          const b = seg(p, 0.26, 0.46), rust = seg(p, 0.4, 1);
          g.save(); g.globalAlpha *= b; g.translate(590, 170); g.rotate(-0.22);
          const steel = g.createLinearGradient(0, -14, 0, 14);
          steel.addColorStop(0, '#E2E5EE'); steel.addColorStop(0.5, '#AEB4C6'); steel.addColorStop(1, '#6D728A');
          g.fillStyle = steel; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          g.beginPath(); g.moveTo(-158, -13); g.lineTo(120, -13); g.lineTo(170, 0); g.lineTo(120, 13); g.lineTo(-158, 13); g.closePath(); g.fill(); g.stroke();
          Art.round(g, -176, -40, 22, 80, 7); g.fill(); g.stroke();
          for (let i = 0; i < 22; i++) {
            const q = ease.out(seg(rust, i * 0.035, 0.25 + i * 0.035));
            if (q <= 0) continue;
            g.fillStyle = i % 3 ? '#B5561E' : '#8A3F16';
            g.beginPath(); g.ellipse(-140 + rand(i + 3) * 280, -9 + rand(i + 9) * 18, (6 + rand(i) * 12) * q, (3 + rand(i + 1) * 5) * q, 0, 0, TAU); g.fill();
          }
          g.restore();
          Art.text(g, 'A rusting nail', 590, 322, { font: 'display', size: 38, alpha: b });
          Art.text(g, 'takes months or years', 590, 362, { size: 25, color: C.sun, alpha: b });
          Art.text(g, 'Kinetics asks: why the difference?', 400, 416, { size: 28, color: C.cyan, alpha: seg(p, 0.74, 0.92) });
        },
      },
      {
        say: 'Meet two molecules from polluted city air: <b>nitric oxide</b> and <b>ozone</b>. To react, they must first run into each other.',
        dur: 3,
        draw(g, p, t) {
          drawEq(g, seg(p, 0, 0.2));
          const a = ease.back(seg(p, 0.1, 0.4)), b = ease.back(seg(p, 0.25, 0.55));
          const y1 = 225 + wander(1, t) * 8, y2 = 225 + wander(2, t) * 8;
          Art.popIn(g, 220, y1, a, (gg) => Art.molecule(gg, 0, 0, 86, 'NO', { rot: Math.PI, face: 'happy', look: [-1, 0], t }));
          Art.popIn(g, 580, y2, b, (gg) => Art.molecule(gg, 0, 0, 80, 'O3', { face: 'happy', look: [-1, 0], t, seed: 3 }));
          Art.text(g, 'Nitric oxide', 220, 328, { font: 'display', size: 34, alpha: a });
          Art.formula(g, 'NO', 220, 372, { size: 34, colorize: true });
          Art.text(g, 'Ozone', 580, 328, { font: 'display', size: 34, alpha: b });
          Art.formula(g, 'O3', 580, 372, { size: 34, colorize: true });
          Art.arrow(g, 318, 220, 482, 220, { color: C.cyan, w: 7, p: seg(p, 0.6, 0.85), both: true, dash: [14, 12] });
        },
      },
      {
        say: 'A gentle bump does nothing. The hit needs at least a minimum energy, called the <b>activation energy</b>. This one falls short, so they bounce apart unchanged.',
        dur: 3.6,
        draw(g, p, t) {
          Art.text(g, 'Too soft', 400, 44, { font: 'display', size: 42, color: C.cyan });
          const a = ease.inOut(seg(p, 0, 0.45)), b = ease.out(seg(p, 0.45, 1));
          const lx = lerp(100, 322, a) - 150 * b, rx = lerp(700, 478, a) + 150 * b;
          const y = 200;
          Art.molecule(g, lx, y, 74, 'NO', { rot: Math.PI, face: p > 0.45 ? 'sleepy' : 'happy', look: [1, 0], t });
          Art.molecule(g, rx, y - 8, 70, 'O3', { face: p > 0.45 ? 'sleepy' : 'happy', look: [-1, 0], t, seed: 3 });
          if (p < 0.45) { speedLines(g, lx - 40, y, 1, 0.3); speedLines(g, rx + 74, y, -1, 0.3); }
          Art.burst(g, 400, y, seg(p, 0.43, 0.62), { n: 8, r: 46, size: 7, colors: [C.ink, C.dim] });
          hitMeter(g, 0.34, ease.out(seg(p, 0.4, 0.6)), false);
          if (p > 0.6) {
            Art.arrow(g, lx - 50, y + 80, lx - 120, y + 80, { color: C.cyan, w: 5, p: seg(p, 0.6, 0.8) });
            Art.arrow(g, rx + 50, y + 80, rx + 120, y + 80, { color: C.cyan, w: 5, p: seg(p, 0.6, 0.8) });
          }
        },
      },
      {
        say: 'A hard hit can still fail. Here the <b>oxygen</b> end of NO hits first, and no new bond can form. They must meet the right way round. This is called <b>orientation</b>.',
        dur: 3.6,
        draw(g, p, t) {
          Art.text(g, 'Hard enough, wrong way round', 400, 44, { font: 'display', size: 38, color: C.fire });
          const a = ease.in(seg(p, 0, 0.42)), b = ease.out(seg(p, 0.42, 1));
          const lx = lerp(70, 322, a) - 180 * b, rx = lerp(730, 478, a) + 180 * b;
          const y = 200;
          Art.molecule(g, lx, y, 74, 'NO', { rot: 0, face: p > 0.42 ? 'grumpy' : 'happy', look: [1, 0], t });
          Art.molecule(g, rx, y - 8, 70, 'O3', { face: p > 0.42 ? 'grumpy' : 'happy', look: [-1, 0], t, seed: 3 });
          if (p < 0.42) { speedLines(g, lx - 40, y, 1, 1); speedLines(g, rx + 74, y, -1, 1); }
          Art.burst(g, 400, y, seg(p, 0.4, 0.62), { n: 14, r: 88, size: 11, colors: [C.fire, C.sun, C.ink] });
          if (p > 0.55) {
            Art.ring(g, lx + 37, y, 40, { color: C.red, w: 6, p: seg(p, 0.55, 0.8) });
            Art.text(g, 'O end first', lx + 37, y + 74, { size: 26, color: C.red, alpha: seg(p, 0.7, 0.85), halo: true });
          }
          hitMeter(g, 0.86, ease.out(seg(p, 0.36, 0.56)), false);
        },
      },
      {
        say: 'Hard enough and the right way round. The N end grabs an oxygen from ozone. Old bonds break, new ones form, and out fly <b>NO₂</b> and <b>O₂</b>.',
        dur: 4.4,
        draw(g, p, t) {
          Art.text(g, 'It reacts!', 400, 44, { font: 'display', size: 42, color: C.leaf });
          const y = 190, a = ease.in(seg(p, 0, 0.32)), swap = ease.inOut(seg(p, 0.32, 0.52)), out = ease.out(seg(p, 0.52, 0.95));
          const r = 28;
          // Molecules approach with the N facing ozone.
          const nx = lerp(120, 340, a) - out * 170, ox = nx - 66;
          const midX = lerp(700, 460, a) + out * 180;
          const Ob = { x: midX + 28, y: y - 36 + out * 40 }, Oc = { x: midX + 80 + 18 * swap, y: y + 24 };
          const O3a0 = { x: midX - 24, y };
          const Oa = { x: lerp(O3a0.x, nx + 66 * 0.52, swap), y: lerp(y, y + 58, swap) };
          // Keep Oa tied to N once swapped, and make the left product bent.
          const list = [
            { sym: 'N', x: nx, y, r, face: p > 0.52 ? 'grin' : 'happy', look: [1, 0], t },
            { sym: 'O', x: ox, y: y + 34 * swap, r },
            { sym: 'O', x: Oa.x - out * 0, y: Oa.y, r },
            { sym: 'O', x: Ob.x, y: Ob.y, r, face: p > 0.52 ? 'grin' : 'happy', look: [-1, 0], t, seed: 4 },
            { sym: 'O', x: Oc.x, y: Oc.y, r },
          ];
          const left = Math.max(0, 1 - swap * 1.9), right = clamp(swap * 1.9 - 0.9);
          // Bonds fade as they break, using width-free alpha on the old partners.
          const bonds = [[0, 1, 1], [3, 4, swap > 0.6 ? 2 : 1]];
          if (left > 0) { g.save(); g.globalAlpha *= left; Art.bond(g, list[2].x, list[2].y, list[3].x, list[3].y, { width: 7 }); g.restore(); }
          if (right > 0) { g.save(); g.globalAlpha *= right; Art.bond(g, list[0].x, list[0].y, list[2].x, list[2].y, { width: 7 }); g.restore(); }
          atoms(g, list, bonds);
          Art.burst(g, 400, y, seg(p, 0.3, 0.58), { n: 22, r: 130, size: 13 });
          if (out > 0.5) {
            Art.formula(g, 'NO2', nx - 14, y + 124, { size: 36, colorize: true, halo: true });
            Art.formula(g, 'O2', (Ob.x + Oc.x) / 2, y + 124, { size: 36, colorize: true, halo: true });
          }
          hitMeter(g, 0.86, ease.out(seg(p, 0.26, 0.44)), true);
        },
      },
      {
        say: 'That is <b>collision theory</b>. A reaction needs all three: a collision, enough energy, and the right orientation. Most collisions fail, which is why many reactions are slow.',
        dur: 3.6,
        draw(g, p, t) {
          const cards = [
            { x: 146, title: 'They collide', color: C.cyan },
            { x: 400, title: 'Hard enough', color: C.sun },
            { x: 654, title: 'Right way round', color: C.pink },
          ];
          cards.forEach((cd, i) => {
            const q = ease.back(seg(p, 0.05 + i * 0.2, 0.28 + i * 0.2));
            if (q <= 0) return;
            g.save(); g.translate(cd.x, 182); g.scale(q, q);
            g.fillStyle = 'rgba(255,255,255,.08)'; g.strokeStyle = cd.color; g.lineWidth = 4;
            Art.round(g, -116, -140, 232, 280, 24); g.fill(); g.stroke();
            Art.text(g, String(i + 1), 0, -102, { font: 'display', size: 44, color: cd.color });
            Art.text(g, cd.title, 0, 104, { size: 25 });
            if (i === 0) {
              const w = Math.sin(t * 2.4) * 8;
              Art.atom(g, -46 - w, 0, 26, 'N', {}); Art.atom(g, 46 + w, 0, 26, 'O', {});
              Art.star(g, 0, 0, 16, t); g.fillStyle = C.sun; Art.star(g, 0, 0, 16, t); g.fill();
            } else if (i === 1) {
              Art.meter(g, -82, -14, 164, 28, 0.84, { color: C.leaf });
              g.fillStyle = C.sun; g.fillRect(-82 + 164 * 0.62 - 2.5, -24, 5, 48);
            } else {
              Art.molecule(g, -66, 0, 44, 'NO', { rot: Math.PI, labels: false });
              Art.molecule(g, 56, -2, 40, 'O3', { labels: false });
              Art.arrow(g, -22, 44, 16, 44, { color: C.pink, w: 4 });
            }
            g.restore();
          });
          Art.text(g, 'All three, or nothing happens', 400, 396, { font: 'display', size: 34, color: C.leaf, alpha: seg(p, 0.72, 0.9) });
        },
      },
    ],
  });

  /* ---------- Bench: collision reactor ---------- */
  const BOX = { x0: 14, y0: 66, x1: 500, y1: 494 };
  const V_RMS = 150;
  const KT300 = 0.5 * V_RMS * V_RMS;         // Mean KE per particle in 2D equals kT.
  const EA0 = 2.5 * KT300;                   // The bar without a catalyst: e^-2.5 = 8% of hits at 300 K.
  const BINS = 14, EMAX = 2.4 * EA0;
  const R_ = 22;
  const rx = { T: 300, n: 14, cat: false, box: null, hist: [], ev: [], series: [], clock: 0, sample: 0, hitsPS: 0, rxnPS: 0, hitNow: 0, rxnNow: 0, fracShown: 0.08 };
  const ea = () => (rx.cat ? 0.5 * EA0 : EA0);
  const kT = () => KT300 * rx.T / 300;

  function fillBox() {
    const box = new Sim.Box({ x0: BOX.x0, y0: BOX.y0, x1: BOX.x1, y1: BOX.y1, speed: V_RMS, seed: 11 + Math.floor(Math.random() * 1000) });
    box.add({ n: rx.n, r: R_, kind: 'NO' }).add({ n: rx.n, r: R_, kind: 'O3' });
    // Set the real kinetic energy to match the chosen temperature exactly.
    const k = Math.sqrt(kT() / box.ke());
    box.particles.forEach((q) => { q.vx *= k; q.vy *= k; });
    box.temp = rx.T / 300;
    box.onHit = onHit;
    rx.box = box;
    rx.ev = []; rx.series = [{ t: 0, n: rx.n }]; rx.clock = 0; rx.sample = 0;
    rx.hitsPS = 0; rx.rxnPS = 0;
    // Start the chart from the expected shape, then let real hits take over.
    rx.hist = Array.from({ length: BINS }, (_, i) => 60 * Math.exp(-((i + 0.5) * EMAX / BINS) / kT()));
  }
  function onHit(a, b, rel) {
    const E = 0.25 * rel * rel;              // Energy along the line of centers, with reduced mass 1/2.
    const bin = Math.min(BINS - 1, Math.floor((E / EMAX) * BINS));
    rx.hist[bin] += 1; rx.hitNow += 1;
    const pair = (a.kind === 'NO' && b.kind === 'O3') || (a.kind === 'O3' && b.kind === 'NO');
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    if (pair && E >= ea()) {
      const no = a.kind === 'NO' ? a : b, oz = a.kind === 'NO' ? b : a;
      no.kind = 'NO2'; oz.kind = 'O2';
      rx.rxnNow += 1;
      rx.ev.push({ x: mx, y: my, age: 0, big: true, seed: Math.random() * 50 });
      if (rx.ev.length > 40) rx.ev.shift();
      Lab.sound.pop();
    } else if (pair) {
      rx.ev.push({ x: mx, y: my, age: 0, big: false });
      if (rx.ev.length > 40) rx.ev.shift();
    }
  }
  function drawMol(g, q) {
    const prod = q.kind === 'NO2' || q.kind === 'O2';
    if (prod) { g.fillStyle = 'rgba(61,220,132,.3)'; g.beginPath(); g.arc(q.x, q.y, q.r + 3, 0, TAU); g.fill(); }
    const s = q.kind === 'NO' || q.kind === 'O2' ? 21 : 18;
    Art.molecule(g, q.x, q.y, s, q.kind, { rot: q.rot, labels: false, style: 'fill', atomScale: 1.16 });
  }
  function reactorPlot(g) {
    // Energy chart.
    const x0 = 524, x1 = 786, y0 = 268, top = 126;
    const bw = (x1 - x0) / BINS;
    const eaX = x0 + (ea() / EMAX) * (x1 - x0);
    let total = 0, above = 0, max = 1;
    rx.hist.forEach((v, i) => { total += v; if (((i + 0.5) / BINS) * EMAX >= ea()) above += v; if (v > max) max = v; });
    rx.hist.forEach((v, i) => {
      const h = (v / max) * (y0 - top);
      const hot = ((i + 0.5) / BINS) * EMAX >= ea();
      g.fillStyle = hot ? C.pink : Art.alpha(C.cyan, 0.75);
      Art.round(g, x0 + i * bw + 1.5, y0 - h, bw - 3, Math.max(2, h), 3); g.fill();
    });
    g.fillStyle = C.line; g.fillRect(x0, y0, x1 - x0, 2);
    g.fillStyle = C.sun; g.fillRect(eaX - 2, top - 6, 4, y0 - top + 8);
    Art.text(g, 'The bar', Math.min(eaX + 8, 700), top + 8, { size: 22, color: C.sun, align: 'left', halo: true });
    Art.text(g, 'How hard each hit is', (x0 + x1) / 2, y0 + 20, { size: 21, color: C.dim });
    const frac = total ? above / total : 0;
    rx.fracShown = lerp(rx.fracShown, frac, 0.08);
    Art.text(g, Math.round(rx.fracShown * 100) + '%', 628, 54, { font: 'display', size: 54, color: C.pink, align: 'right' });
    Art.text(g, 'of hits', 642, 36, { size: 22, align: 'left', color: C.dim });
    Art.text(g, 'clear the bar', 642, 62, { size: 22, align: 'left', color: C.dim });
    // Reactant remaining over time.
    const px0 = 524, px1 = 786, py0 = 472, py1 = 342;
    g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, px0, py1, px1 - px0, py0 - py1, 8); g.fill();
    g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(px0, py1, px1 - px0, py0 - py1);
    const span = 30, t0 = Math.max(0, rx.clock - span);
    g.beginPath();
    let first = true;
    rx.series.forEach((s) => {
      if (s.t < t0) return;
      const x = lerp(px0, px1, (s.t - t0) / span), y = lerp(py0, py1, s.n / Math.max(1, rx.n));
      if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y);
    });
    g.strokeStyle = C.sun; g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke();
    const left = rx.box.particles.filter((q) => q.kind === 'NO').length;
    Art.formula(g, 'NO', px0 + 4, py1 - 18, { size: 26, align: 'left', colorize: true });
    Art.text(g, 'left: ' + left, px0 + 54, py1 - 18, { size: 24, align: 'left', color: C.sun });
    Art.text(g, 'Time', (px0 + px1) / 2, py0 + 20, { size: 21, color: C.dim });
  }
  fillBox();
  const reactor = Lab.stage('#c-reactor', {
    h: 510,
    label: 'A box of colliding NO and ozone molecules beside a live chart of collision energies and a graph of reactant left over time.',
    draw(g, t, dt) {
      const box = rx.box;
      if (dt > 0) {
        const h = dt / 2;
        box.step(h); box.step(h);
        rx.clock += dt; rx.sample += dt;
        // Hits decay away, so the chart follows what happens now, not long ago.
        const fade = Math.exp(-dt / 3);
        rx.hist = rx.hist.map((v) => v * fade);
        const k = 1 - Math.exp(-dt / 1.6);
        rx.hitsPS += (rx.hitNow / dt - rx.hitsPS) * k;
        rx.rxnPS += (rx.rxnNow / dt - rx.rxnPS) * k;
        rx.hitNow = 0; rx.rxnNow = 0;
        if (rx.sample > 0.25) {
          rx.sample = 0;
          rx.series.push({ t: rx.clock, n: box.particles.filter((q) => q.kind === 'NO').length });
          if (rx.series.length > 200) rx.series.shift();
          paintReactor();
        }
      }
      g.fillStyle = 'rgba(61,220,132,.26)'; Art.round(g, 262, 12, 130, 46, 22); g.fill();
      Art.formula(g, 'NO + O3 -> NO2 + O2', (BOX.x0 + BOX.x1) / 2, 34, { size: 30, colorize: true });
      // The box walls.
      g.fillStyle = 'rgba(255,255,255,.04)'; Art.round(g, BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0, 10); g.fill();
      g.strokeStyle = 'rgba(214,240,255,.65)'; g.lineWidth = 4; g.stroke();
      box.particles.forEach((q) => drawMol(g, q));
      g.save(); Art.round(g, BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0, 10); g.clip();
      rx.ev.forEach((e) => {
        e.age += dt;
        if (e.big) Art.burst(g, e.x, e.y, e.age / 0.7, { n: 12, r: 62, size: 10, seed: e.seed });
        else if (e.age < 0.28) {
          g.strokeStyle = Art.alpha('#FFFFFF', 0.5 * (1 - e.age / 0.28)); g.lineWidth = 3;
          g.beginPath(); g.arc(e.x, e.y, 10 + e.age * 70, 0, TAU); g.stroke();
        }
      });
      g.restore();
      rx.ev = rx.ev.filter((e) => e.age < 0.7);
      const left = box.particles.filter((q) => q.kind === 'NO').length;
      if (left === 0) Art.pill(g, 'All used up. Refill the box.', (BOX.x0 + BOX.x1) / 2, 280, { size: 26, color: C.leaf, text: '#14301F' });
      reactorPlot(g);
      void t;
    },
  });
  function paintReactor() {
    Lab.$('#rx-hits').textContent = Math.round(rx.hitsPS);
    Lab.$('#rx-rate').textContent = Lab.fmt(rx.rxnPS, 1);
    Lab.$('#rx-frac').textContent = Math.round(rx.fracShown * 100) + '%';
  }
  Lab.bind('#rx-t', '#rx-t-out', (v) => v + ' K', (v) => {
    rx.T = v;
    if (rx.box) rx.box.setTemperature(v / 300);
  });
  Lab.bind('#rx-n', '#rx-n-out', (v) => v, (v) => { if (v !== rx.n) { rx.n = v; fillBox(); } });
  Lab.segmented('#rx-cat', (v) => { rx.cat = v === 'yes'; });
  Lab.$('#rx-refill').addEventListener('click', () => { fillBox(); Lab.sound.pop(); });
  void reactor;

  /* ---------- Story 2: the energy hill ---------- */
  Lab.story('#story-hill', {
    title: 'The energy hill',
    scenes: [
      {
        say: 'Plot energy as a reaction goes along. It starts at the <b>reactants</b>, climbs a hill, and comes down at the <b>products</b>. No reaction skips the climb.',
        dur: 3,
        draw(g, p, t) {
          hillAxes(g, seg(p, 0, 0.2));
          hillCurve(g, H.top, ease.inOut(seg(p, 0.05, 0.75)));
          Art.text(g, 'Reactants', hillX(0.08), H.re - 44, { size: 26, color: C.ink, alpha: seg(p, 0.1, 0.3) });
          Art.text(g, 'Products', hillX(0.92), H.pr + 40, { size: 26, color: C.leaf, alpha: seg(p, 0.7, 0.9) });
          const q = ease.back(seg(p, 0.2, 0.4));
          if (q > 0) Art.atom(g, hillX(0.08), H.re - 18 + wander(2, t) * 2, 14 * q, 'O', { label: false });
        },
      },
      {
        say: 'The top of the hill is the <b>transition state</b>, where old bonds are half broken and new ones half formed. The climb from reactants to the top is the <b>activation energy</b>, $E_a$.',
        dur: 3.6,
        draw(g, p, t) {
          hillAxes(g); hillCurve(g, H.top);
          Art.text(g, 'Reactants', hillX(0.08), H.re - 44, { size: 26 });
          Art.text(g, 'Products', hillX(0.92), H.pr + 40, { size: 26, color: C.leaf });
          const a = seg(p, 0.05, 0.3);
          Art.text(g, 'Transition state', 570, 62, { size: 26, color: C.sun, alpha: a });
          Art.arrow(g, 458, 66, hillX(0.5) + 16, H.top + 4, { color: C.sun, w: 4, p: a });
          Art.ring(g, hillX(0.5), H.top, 22, { color: C.sun, w: 5, p: a });
          const q = seg(p, 0.35, 0.65);
          g.save(); g.setLineDash([9, 8]); g.strokeStyle = Art.alpha(C.pink, 0.8 * q); g.lineWidth = 3;
          g.beginPath(); g.moveTo(hillX(0.16), H.re); g.lineTo(hillX(0.34), H.re); g.stroke();
          g.beginPath(); g.moveTo(hillX(0.34), H.top); g.lineTo(hillX(0.48), H.top); g.stroke();
          g.restore();
          Art.arrow(g, hillX(0.34), H.re, hillX(0.34), H.top + 2, { color: C.pink, w: 7, p: q, both: q >= 1 });
          Art.text(g, 'Eₐ', hillX(0.34) - 40, (H.re + H.top) / 2, { font: 'display', size: 46, color: C.pink, alpha: seg(p, 0.55, 0.75) });
          void t;
        },
      },
      {
        say: 'Picture rolling a ball at the hill. Too little energy and it rolls back. With at least $E_a$, it gets over and comes down the other side. That is a reaction.',
        dur: 5,
        draw(g, p, t) {
          hillAxes(g); hillCurve(g, H.top);
          Art.text(g, 'Reactants', hillX(0.08), H.re - 62, { size: 26 });
          Art.text(g, 'Products', hillX(0.92), H.pr + 40, { size: 26, color: C.leaf });
          // Weak ball: climbs part way and returns.
          const up = seg(p, 0.02, 0.28), down = seg(p, 0.28, 0.5);
          const uW = lerp(0.08, 0.34, ease.out(up)) - (0.26) * ease.in(down);
          const yW = hillY(uW, H.re, H.top, H.pr) - 16;
          Art.atom(g, hillX(uW), yW, 15, 'N', { label: false });
          if (down > 0) Art.text(g, 'Rolled back', hillX(0.06) + 16, H.re + 30, { size: 25, color: C.cyan, alpha: down, halo: true });
          // Strong ball: makes it over, on its second chance.
          const s = ease.inOut(seg(p, 0.5, 0.96));
          if (p > 0.5) {
            const u = lerp(0.08, 0.92, s);
            const y = hillY(u, H.re, H.top, H.pr) - 18;
            Art.atom(g, hillX(u), y, 18, 'O', { label: false, glow: 1 });
            if (s > 0.98) Art.text(g, 'Made it!', hillX(0.92), H.pr - 66, { font: 'display', size: 32, color: C.leaf });
          }
          void t;
        },
      },
      {
        say: 'The drop from reactants to products is $\\Delta H$. Hill height and $\\Delta H$ are separate things. A reaction can release lots of energy and still have a tall hill.',
        dur: 3.4,
        draw(g, p, t) {
          hillAxes(g); hillCurve(g, H.top);
          Art.text(g, 'Reactants', hillX(0.08), H.re - 44, { size: 26 });
          Art.text(g, 'Products', hillX(0.92), H.pr + 40, { size: 26, color: C.leaf });
          const q = seg(p, 0.1, 0.5);
          g.save(); g.setLineDash([9, 8]); g.strokeStyle = Art.alpha(C.fire, 0.85 * q); g.lineWidth = 3;
          g.beginPath(); g.moveTo(hillX(0.16), H.re); g.lineTo(hillX(0.82), H.re); g.stroke();
          g.restore();
          Art.arrow(g, hillX(0.78), H.re, hillX(0.78), H.pr - 4, { color: C.fire, w: 7, p: q });
          Art.text(g, 'ΔH', hillX(0.78) + 44, (H.re + H.pr) / 2 - 6, { font: 'display', size: 38, color: C.fire, alpha: seg(p, 0.35, 0.6) });
          Art.arrow(g, hillX(0.34), H.re, hillX(0.34), H.top + 2, { color: C.pink, w: 7, both: true, alpha: 0.9 });
          Art.text(g, 'Eₐ', hillX(0.34) - 40, (H.re + H.top) / 2, { font: 'display', size: 40, color: C.pink });
          Art.text(g, 'Eₐ sets the speed', 610, 84, { size: 26, color: C.pink, alpha: seg(p, 0.55, 0.75) });
          Art.text(g, 'ΔH sets the heat', 610, 124, { size: 26, color: C.fire, alpha: seg(p, 0.7, 0.9) });
          void t;
        },
      },
      {
        say: 'Now heat things up. Molecules have a spread of energies. A hotter sample has a much bigger share above $E_a$, shown in pink. The hill stays the same, but far more molecules can climb it.',
        dur: 4.2,
        draw(g, p, t) {
          const x0 = 90, x1 = 744, y0 = 372, top = 76;
          const Emax = 10, Ea = 4.2, cool = 1, hot = 2;
          const X = (E) => lerp(x0, x1, E / Emax), Y = (v) => y0 - (v / 0.45) * (y0 - top);
          const heat = ease.inOut(seg(p, 0.3, 0.72));
          const curve = (kt, color, w, fill) => {
            g.beginPath(); g.moveTo(X(0), y0);
            for (let i = 0; i <= 90; i++) { const E = (i / 90) * Emax; g.lineTo(X(E), Y(mb(E, kt))); }
            g.strokeStyle = color; g.lineWidth = w; g.lineJoin = 'round'; g.stroke();
            if (fill) {
              g.beginPath(); g.moveTo(X(Ea), y0);
              for (let i = 0; i <= 50; i++) { const E = Ea + (i / 50) * (Emax - Ea); g.lineTo(X(E), Y(mb(E, kt))); }
              g.lineTo(X(Emax), y0); g.closePath(); g.fillStyle = fill; g.fill();
            }
          };
          const kNow = lerp(cool, hot, heat);
          if (heat > 0) curve(kNow, C.fire, 6, Art.alpha(C.pink, 0.8));
          curve(cool, C.cyan, 5, Art.alpha(C.cyan, 0.75));
          g.fillStyle = C.dim; g.fillRect(x0, y0, x1 - x0 + 24, 4); g.fillRect(x0 - 4, top - 30, 4, y0 - top + 34);
          g.fillStyle = C.sun; g.fillRect(X(Ea) - 2.5, 96, 5, y0 - 96);
          Art.text(g, 'Eₐ', X(Ea), 72, { font: 'display', size: 40, color: C.sun });
          Art.text(g, 'Energy of a molecule', 420, 410, { size: 25, color: C.dim });
          Art.text(g, 'How many', 96, 38, { size: 25, color: C.dim, align: 'left' });
          Art.text(g, 'Cool', 210, 106, { size: 28, color: C.cyan, align: 'center' });
          Art.text(g, 'Hot', 316, 196, { size: 28, color: C.fire, alpha: seg(p, 0.6, 0.8), halo: true });
          Art.text(g, 'Enough to react', 590, 226, { size: 26, color: C.pink, alpha: seg(p, 0.6, 0.85), halo: true });
          Art.arrow(g, 560, 250, 520, 318, { color: C.pink, w: 4, p: seg(p, 0.7, 0.9) });
          void t;
        },
      },
      {
        say: 'A <b>catalyst</b> opens a lower road. $E_a$ shrinks, so far more collisions succeed. The start and the end stay put, so $\\Delta H$ does not change. The catalyst comes out unused.',
        dur: 4,
        draw(g, p, t) {
          hillAxes(g);
          hillCurve(g, H.top, 1, { fill: false, color: Art.alpha(C.violet, 0.8), w: 6 });
          const low = lerp(H.top, 190, ease.inOut(seg(p, 0.15, 0.55)));
          if (p > 0.15) hillCurve(g, low, 1, { color: C.leaf, w: 7, fill: false });
          Art.text(g, 'Reactants', hillX(0.08), H.re - 44, { size: 26 });
          Art.text(g, 'Products', hillX(0.92), H.pr + 40, { size: 26, color: C.leaf });
          Art.text(g, 'No catalyst', 560, 88, { size: 26, color: C.violet });
          const a = seg(p, 0.5, 0.75);
          Art.text(g, 'With catalyst', hillX(0.55), 298, { size: 26, color: C.leaf, alpha: a, halo: true });
          Art.arrow(g, hillX(0.28), H.re, hillX(0.28), H.top + 2, { color: C.violet, w: 5, both: true });
          Art.text(g, 'Eₐ', hillX(0.28) - 34, 170, { font: 'display', size: 34, color: C.violet });
          if (a > 0) {
            Art.arrow(g, hillX(0.38), H.re, hillX(0.38), 196, { color: C.leaf, w: 6, both: true, p: a });
            Art.text(g, 'Eₐ', hillX(0.38) + 32, 236, { font: 'display', size: 34, color: C.leaf, alpha: a, halo: true });
          }
          Art.moe(g, 716, 240, 110, 'cheer', { t, flip: true });
        },
      },
    ],
  });

  /* ---------- Story 3: what doubling does ---------- */
  function jar(g, x, n, t, seedBase) {
    const cx = x, y0 = 86, w = 180, h = 180;
    g.fillStyle = 'rgba(214,240,255,.07)'; g.strokeStyle = 'rgba(214,240,255,.65)'; g.lineWidth = 4;
    Art.round(g, cx - w / 2, y0, w, h, 18); g.fill(); g.stroke();
    const cols = 4, rows = 3;
    for (let i = 0; i < n; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const px = cx - w / 2 + (col + 0.5) * (w / cols) + wander(i + seedBase, t) * 5;
      const py = y0 + (row + 0.5) * (h / rows) + wander(i + seedBase + 9, t) * 5;
      Art.ball(g, px, py, 17, C.pink);
      Art.text(g, 'A', px, py + 1, { size: 21, color: '#fff' });
    }
  }
  function doubling(order) {
    return (g, p, t) => {
      const rate1 = 1, rate2 = Math.pow(2, order);
      const a = seg(p, 0, 0.18), b = seg(p, 0.22, 0.42), bars = ease.out(seg(p, 0.46, 0.8));
      g.save(); g.globalAlpha *= a; jar(g, 140, 6, t, 1); g.restore();
      Art.text(g, '[A]', 140, 52, { font: 'display', size: 36, alpha: a });
      if (b > 0) {
        g.save(); g.globalAlpha *= b; jar(g, 480, 12, t, 30); g.restore();
        Art.text(g, '2 × [A]', 480, 52, { font: 'display', size: 36, color: C.sun, alpha: b });
      }
      // Rate bars beside each jar: the bar height is the rate.
      const base = 266, unit = 44;
      const bar = (x, r, color) => {
        const h = unit * r * bars;
        g.fillStyle = color; Art.round(g, x - 20, base - h, 40, Math.max(3, h), 8); g.fill();
      };
      if (bars > 0) {
        bar(270, rate1, C.cyan); bar(610, rate2, C.fire);
        Art.text(g, 'rate', 270, base + 26, { size: 24, color: C.cyan });
        Art.text(g, 'rate', 610, base + 26, { size: 24, color: C.fire });
      }
      const c = ease.back(seg(p, 0.72, 0.94));
      const eqs = { 0: 'rate = k', 1: 'rate = k[A]', 2: 'rate = k[A]²' };
      const name = { 0: 'Zero order', 1: 'First order', 2: 'Second order' };
      const x2 = { 0: '× 1', 1: '× 2', 2: '× 4' };
      if (c > 0) {
        Art.text(g, x2[order], 720, 180, { font: 'display', size: 60, color: C.sun, alpha: seg(p, 0.72, 0.9) });
        g.save(); g.translate(400, 364); g.scale(c, c);
        g.fillStyle = C.plum2; Art.round(g, -320, -40, 640, 80, 28); g.fill();
        Art.text(g, name[order], -170, 0, { font: 'display', size: 36, color: C.sun });
        Art.text(g, eqs[order], 150, 0, { font: 'display', size: 38, color: '#fff' });
        g.restore();
      }
    };
  }
  Lab.story('#story-order', {
    title: 'What doubling does',
    scenes: [
      { say: 'Double A and nothing changes. The reaction is <b>zero order</b> in A. It usually means something else, such as a crowded catalyst surface, is holding it back.', dur: 3.6, draw: doubling(0) },
      { say: 'Double A and the rate doubles. That is <b>first order</b>. Twice the molecules, twice the reacting per second.', dur: 3.6, draw: doubling(1) },
      { say: 'Double A and the rate goes up 4 times. That is <b>second order</b>, because $2^2 = 4$. Triple A and it would go up 9 times.', dur: 3.6, draw: doubling(2) },
      {
        say: 'You cannot read this off the equation. Here the coefficient is 2, but experiments show $\\ce{N2O5}$ is <b>first order</b>. Only data can tell you.',
        dur: 3.8,
        draw(g, p, t) {
          Art.formula(g, '2N2O5 -> 4NO2 + O2', 400, 62, { size: 44, colorize: true });
          const a = ease.back(seg(p, 0.15, 0.38));
          if (a > 0) {
            g.save(); g.translate(400, 176); g.scale(a, a);
            g.fillStyle = 'rgba(255,90,107,.16)'; g.strokeStyle = C.red; g.lineWidth = 3; Art.round(g, -240, -44, 480, 88, 22); g.fill(); g.stroke();
            Art.text(g, 'rate = k[N₂O₅]²', 0, 0, { font: 'display', size: 40, color: '#FFC4CB' });
            g.restore();
            Art.strike(g, 172, 200, 628, 152, seg(p, 0.38, 0.52), C.red, 8);
          }
          Art.text(g, 'Tempting, and wrong', 400, 246, { size: 26, color: C.red, alpha: seg(p, 0.42, 0.56) });
          const b = ease.back(seg(p, 0.58, 0.8));
          if (b > 0) {
            g.save(); g.translate(400, 330); g.scale(b, b);
            g.fillStyle = 'rgba(61,220,132,.16)'; g.strokeStyle = C.leaf; g.lineWidth = 4; Art.round(g, -240, -44, 480, 88, 22); g.fill(); g.stroke();
            Art.text(g, 'rate = k[N₂O₅]', 0, 0, { font: 'display', size: 40, color: '#CFFBE0' });
            g.restore();
          }
          Art.text(g, 'What experiments find', 400, 406, { size: 26, color: C.leaf, alpha: seg(p, 0.72, 0.88) });
          Art.moe(g, 716, 440, 120, 'think', { t, flip: true });
        },
      },
    ],
  });

  /* ---------- Bench: first-order clock ---------- */
  const dk = { k: 0.06, a0: 1, t: 0, view: 'a', playing: false };
  const N_MAX = 40;
  // Every molecule gets its own moment to react. They are spaced so the count tracks the true curve.
  const order = Array.from({ length: N_MAX }, (_, i) => i).sort((a, b) => rand(a + 2.3) - rand(b + 2.3));
  const P_ = { x0: 14, x1: 276, y0: 60, y1: 386 };
  const PL = { x0: 372, x1: 780, y0: 382, y1: 34 };
  const dkX = (t) => lerp(PL.x0, PL.x1, t / 100);
  const decayStage = Lab.stage('#c-decay', {
    label: 'A jar of molecules that vanish over time, beside a graph of concentration against time with half-lives marked.',
    draw(g, t, dt) {
      if (dk.playing && dt > 0) {
        dk.t += dt * 8;
        if (dk.t >= 100) { dk.t = 100; setPlaying(false); }
        const r = Lab.$('#dk-t'); r.value = dk.t; Lab.paintRange(r);
        paintDecay();
      }
      const half = Math.LN2 / dk.k;
      const frac = Math.exp(-dk.k * dk.t);
      // The jar.
      const n = Math.round(dk.a0 * N_MAX);
      g.fillStyle = 'rgba(214,240,255,.06)'; g.strokeStyle = 'rgba(214,240,255,.65)'; g.lineWidth = 4;
      Art.round(g, P_.x0, P_.y0, P_.x1 - P_.x0, P_.y1 - P_.y0, 16); g.fill(); g.stroke();
      const cols = 6, cellW = (P_.x1 - P_.x0) / cols, cellH = (P_.y1 - P_.y0) / 7;
      let alive = 0;
      for (let i = 0; i < n; i++) {
        const idx = order[i];
        const u = (i + 0.5) / n;
        const life = -Math.log(1 - u) / dk.k;
        const px = P_.x0 + ((idx % cols) + 0.5) * cellW + wander(idx, t) * 5;
        const py = P_.y0 + (Math.floor(idx / cols) + 0.5) * cellH + wander(idx + 50, t) * 5;
        if (dk.t < life) {
          alive++;
          Art.ball(g, px, py, 17, C.pink);
          Art.text(g, 'A', px, py + 1, { size: 21, color: '#fff' });
        } else {
          g.fillStyle = 'rgba(61,220,132,.18)'; g.beginPath(); g.arc(px, py, 10, 0, TAU); g.fill();
        }
      }
      Art.text(g, alive + ' of ' + n + ' left', (P_.x0 + P_.x1) / 2, 30, { font: 'display', size: 32, color: C.pink });
      Art.text(g, 'Green marks have reacted', (P_.x0 + P_.x1) / 2, 414, { size: 21, color: C.leaf });

      // Chart.
      g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(PL.x0, PL.y1, PL.x1 - PL.x0, PL.y0 - PL.y1);
      g.fillStyle = C.dim; g.fillRect(PL.x0 - 3, PL.y1, 3, PL.y0 - PL.y1 + 3); g.fillRect(PL.x0, PL.y0, PL.x1 - PL.x0, 3);
      [25, 50, 75, 100].forEach((v) => Art.text(g, String(v), dkX(v), PL.y0 + 22, { size: 21, color: C.dim }));
      Art.text(g, 'Time (s)', (PL.x0 + PL.x1) / 2 - 90, PL.y0 + 50, { size: 23, color: C.dim });
      const isLn = dk.view === 'ln';
      const lnMin = -7;
      const Y = (a) => isLn ? lerp(PL.y0, PL.y1, (Math.log(Math.max(a, 1e-6)) - lnMin) / (0 - lnMin)) : lerp(PL.y0, PL.y1, a);
      if (isLn) [-6, -4, -2, 0].forEach((v) => Art.text(g, v === 0 ? '0' : '−' + (-v), PL.x0 - 16, lerp(PL.y0, PL.y1, (v - lnMin) / -lnMin), { size: 21, color: C.dim, align: 'right' }));
      else [0.25, 0.5, 0.75, 1].forEach((v) => Art.text(g, v.toFixed(2), PL.x0 - 16, Y(v), { size: 21, color: C.dim, align: 'right' }));
      g.save(); g.translate(292, 165); g.rotate(-Math.PI / 2);
      Art.text(g, isLn ? 'ln[A]' : '[A] (M)', 0, 0, { size: 23, color: C.dim });
      g.restore();
      // Half-life guides.
      if (!isLn) {
        const colors = [C.sun, C.fire, C.pink, C.violet];
        for (let i = 1; i <= 4; i++) {
          const tt = half * i;
          if (tt > 100) break;
          const a = dk.a0 * Math.pow(0.5, i);
          g.save(); g.setLineDash([7, 7]); g.strokeStyle = Art.alpha(colors[i - 1], 0.75); g.lineWidth = 2.5;
          g.beginPath(); g.moveTo(PL.x0, Y(a)); g.lineTo(dkX(tt), Y(a)); g.lineTo(dkX(tt), PL.y0); g.stroke();
          g.restore();
          g.fillStyle = colors[i - 1]; g.beginPath(); g.arc(dkX(tt), Y(a), 6, 0, TAU); g.fill();
          const labelGap = dkX(tt) - (i > 1 ? dkX(half * (i - 1)) : PL.x0);
          if (labelGap > 44 && i <= 3) Art.text(g, ['½', '¼', '⅛'][i - 1], dkX(tt) + 12, Y(a) - 20, { size: 26, color: colors[i - 1], halo: true });
        }
      }
      // The curve.
      g.beginPath();
      for (let i = 0; i <= 120; i++) { const tt = (i / 120) * 100; const y = Y(dk.a0 * Math.exp(-dk.k * tt)); const yc = Math.min(PL.y0, y); if (i) g.lineTo(dkX(tt), yc); else g.moveTo(dkX(tt), yc); }
      g.strokeStyle = C.cyan; g.lineWidth = 6; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke();
      if (isLn) Art.text(g, 'A straight line, slope = −k', 610, 76, { size: 25, color: C.cyan, halo: true });
      // Now marker.
      const now = dk.a0 * frac;
      const ny = Math.min(PL.y0, Y(now));
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(dkX(dk.t), PL.y1); g.lineTo(dkX(dk.t), PL.y0); g.stroke();
      Art.ball(g, dkX(dk.t), ny, 11, C.sun);
    },
  });
  function setPlaying(on) {
    dk.playing = on;
    Lab.$('#dk-play').textContent = on ? 'Pause the clock' : 'Run the clock';
  }
  function paintDecay() {
    const half = Math.LN2 / dk.k, now = dk.a0 * Math.exp(-dk.k * dk.t);
    Lab.$('#dk-half').textContent = Lab.sig(half, 3) + ' s';
    Lab.$('#dk-now').textContent = Lab.sig(now, 3) + ' M';
    Lab.$('#dk-t-out').textContent = Lab.fmt(dk.t, 1) + ' s';
    Lab.$('#dk-calc').innerHTML = Lab.texString(`<div class="calc-line">$$t_{1/2} = \\frac{0.693}{${dk.k.toFixed(2)}\\text{ s}^{-1}} = ${Lab.sig(half, 3)}\\text{ s}$$</div><div class="calc-line">$$[\\text{A}]_t = ${dk.a0.toFixed(2)}\\,e^{-(${dk.k.toFixed(2)})(${dk.t.toFixed(1)})} = ${Lab.sig(now, 3)}\\text{ M}$$</div>`);
  }
  Lab.bind('#dk-k', '#dk-k-out', (v) => v.toFixed(2) + ' s⁻¹', (v) => { dk.k = v; paintDecay(); });
  Lab.bind('#dk-a', '#dk-a-out', (v) => v.toFixed(2) + ' M', (v) => { dk.a0 = v; paintDecay(); });
  Lab.bind('#dk-t', null, null, (v) => { dk.t = v; paintDecay(); });
  Lab.segmented('#dk-view', (v) => { dk.view = v; decayStage.redraw(); });
  Lab.$('#dk-play').addEventListener('click', () => {
    if (!dk.playing && dk.t >= 100) dk.t = 0;
    setPlaying(!dk.playing);
    if (dk.playing && !decayStage.playing) decayStage.play();
  });
  paintDecay();
});
