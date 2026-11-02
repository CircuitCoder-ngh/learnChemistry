/* Lesson 1.1: What is stuff made of? States of matter, kinds of matter, and physical versus chemical change. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const EO = Art.elementColor('O'), EH = Art.elementColor('H');

  /* ---------- Shared drawing helpers ---------- */
  function sball(g, x, y, r, color) {
    if (r <= 0) return;
    const R = r > 70 ? 150 : r > 22 ? 50 : 20;
    g.save(); g.translate(x, y); g.scale(r / R, r / R); Art.ball(g, 0, 0, R, color); g.restore();
  }
  /** Water with its true shape. s is pixels per nanometer. */
  function water(g, x, y, s, rot, o = {}) {
    const c = Math.cos(rot), d = Math.sin(rot), hx = 0.0759 * s, hy = 0.0588 * s;
    sball(g, x - hx * c - hy * d, y - hx * d + hy * c, 0.1 * s, EH);
    sball(g, x + hx * c - hy * d, y + hx * d + hy * c, 0.1 * s, EH);
    sball(g, x, y, 0.14 * s, EO);
    if (o.face) Art.face(g, x, y - 0.02 * s, 0.14 * s, o.face, { t: o.t, seed: o.seed, look: o.look });
  }
  function duo(g, x, y, rot, color, r, sep) {
    const c = Math.cos(rot) * sep / 2, d = Math.sin(rot) * sep / 2;
    sball(g, x - c, y - d, r, color); sball(g, x + c, y + d, r, color);
  }
  const hexSpots = (d, R, fn = () => true) => {
    const out = [];
    for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) {
      const x = (i + (j % 2 ? 0.5 : 0)) * d, y = j * d * 0.88;
      if (Math.hypot(x, y) < R && fn(x, y)) out.push([x, y]);
    }
    return out;
  };
  const spiral = (n, R, seed = 0.7) => Array.from({ length: n }, (_, i) => {
    const a = i * 2.39996 + seed, d = Math.sqrt((i + 0.6) / n) * R;
    return [Math.cos(a) * d, Math.sin(a) * d];
  });
  /** One particle of a picture: an atom, an ion, a known molecule, or water. */
  function particle(g, it, t, amp) {
    const x = it.x + wander(it.seed || 0, t) * amp, y = it.y + wander((it.seed || 0) + 40, t) * amp;
    const rot = (it.rot || 0) + (amp > 3 ? Math.sin(t * 0.7 + (it.seed || 0)) * 0.4 : 0);
    if (it.f === 'H2O') water(g, x, y, it.s || 170, rot, { face: it.face, t, seed: it.seed });
    else if (it.f === 'sugar') sugar(g, x, y, it.s || 1, rot);
    else if (it.f === 'oil') oilChain(g, x, y, rot);
    else if (it.ion) Art.atom(g, x, y, it.r || 20, it.f, { label: false, charge: it.ion });
    else if (Art.moleculeData(it.f)) Art.molecule(g, x, y, it.s || 30, it.f, { style: 'fill', atomScale: 1.28, labels: false, rot, face: it.face, t, seed: it.seed });
    else Art.atom(g, x, y, it.r || 21, it.f, { label: false, face: it.face, t, seed: it.seed });
  }
  /** A short oil-like carbon chain with its hydrogens left out, so it reads clearly at small sizes. */
  function oilChain(g, x, y, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    for (let i = 0; i < 5; i++) sball(g, (i - 2) * 15, i % 2 ? 6 : -6, 10.5, Art.elementColor('C'));
    sball(g, -41, -9, 6.5, EH); sball(g, 41, -9, 6.5, EH);
    g.restore();
  }
  /** A simple picture of sucrose: two sugar rings of carbon and oxygen, joined by an oxygen. */
  function sugar(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    const ring = (cx, cy, n, r) => {
      const pts = Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * TAU - 1.57) * r, cy + Math.sin(i / n * TAU - 1.57) * r]);
      g.strokeStyle = 'rgba(217,209,236,.8)'; g.lineWidth = 3;
      g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.stroke();
      pts.forEach((p, i) => sball(g, p[0], p[1], i === 0 ? 8.5 : 8, i === 0 ? EO : Art.elementColor('C')));
      return pts;
    };
    ring(-23, 2, 6, 17); ring(23, -2, 5, 15);
    sball(g, 0, 0, 7.5, EO);
    [[-23, 2], [23, -2]].forEach(([cx, cy], k) => [0.7, 2.6, 4.6].forEach((a) => sball(g, cx + Math.cos(a + k) * 25, cy + Math.sin(a + k) * 25, 5.2, EH)));
    g.restore();
  }
  function drawPic(g, pic, cx, cy, R, t) {
    const k = R / 170;
    g.save(); g.translate(cx, cy); g.scale(k, k);
    pic.items.forEach((it) => particle(g, it, t, pic.amp === undefined ? 3 : pic.amp));
    g.restore();
  }
  /* Particle picture builders. Coordinates fit a circle of radius 170. */
  const mix = (list, n, seed) => {
    // Species are spaced evenly along the spiral, so a mixture really is even, not clumped by chance.
    const flat = [];
    list.forEach(([f, c, extra], si) => { for (let i = 0; i < c; i++) flat.push(Object.assign({ f, key: (i + 0.5 + si * 0.17) / c }, extra)); });
    flat.sort((a, b) => a.key - b.key);
    return spiral(flat.length, 132, seed).map(([x, y], i) => Object.assign({ x, y, rot: rand(i + seed) * TAU, seed: i + seed }, flat[i]));
  };
  const gasPic = (list, seed = 1) => ({ items: mix(list, 0, seed), amp: 6 });
  const latticePic = (a, b, r, d, seed = 1) => ({
    amp: 1.2,
    items: (() => {
      const out = []; let n = 0;
      if (b) {
        for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
          const x = i * d, y = j * d;
          if (Math.hypot(x, y) < 165) { const A = (i + j + 16) % 2 === 0; out.push({ f: A ? a : b, x, y, r: A ? r * 0.72 : r, seed: n++ + seed }); }
        }
      } else hexSpots(d, 170).forEach(([x, y]) => out.push({ f: a, x, y, r, seed: n++ + seed }));
      return out;
    })(),
  });
  const layersPic = (top, bot, seed = 1) => ({
    amp: 2.4,
    items: [
      ...(top.f === 'oil'
        ? [-18, -56, -94, -132].flatMap((y, r) => [-1.5, -0.5, 0.5, 1.5].map((c) => ({ x: (c + (r % 2 ? 0.25 : -0.25)) * 92, y }))).filter((q) => Math.hypot(q.x, q.y) < 170).map((q, i) => Object.assign({ x: q.x, y: q.y, rot: 0.08 * (i % 3 - 1), seed: i + seed }, top))
        : hexSpots(top.d || 56, 165, (x, y) => y < -8).map(([x, y], i) => Object.assign({ x, y: y - 6, rot: rand(i + seed) * TAU, seed: i + seed }, top))),
      ...hexSpots(bot.d || 56, 165, (x, y) => y > 8).map(([x, y], i) => Object.assign({ x, y: y + 6, rot: rand(i + seed + 30) * TAU, seed: i + seed + 30 }, bot)),
    ],
  });
  const clumpPic = (lump, rest, seed = 1) => {
    const centers = [[-52, 52], [66, -48]];
    const inLump = (x, y) => centers.some(([a, b]) => Math.hypot(x - a, y - b) < 58);
    const items = [];
    hexSpots(46, 165, inLump).forEach(([x, y], i) => items.push(Object.assign({ x, y, seed: i + seed, rot: 0 }, lump, lump.alt && i % 3 !== 0 ? { f: lump.alt, r: lump.altR } : {})));
    hexSpots(64, 165, (x, y) => !centers.some(([a, b]) => Math.hypot(x - a, y - b) < 88)).forEach(([x, y], i) => items.push(Object.assign({ x, y, rot: rand(i + seed) * TAU, seed: i + seed + 60 }, rest)));
    return { items, amp: 2.4 };
  };

  /* Small lab objects. */
  function nugget(g, x, y, s) {
    const gr = g.createLinearGradient(x - 40 * s, y - 40 * s, x + 40 * s, y + 10 * s);
    gr.addColorStop(0, '#FFF1A8'); gr.addColorStop(0.5, '#FFC83D'); gr.addColorStop(1, '#B9820F');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x - 46 * s, y); g.lineTo(x - 40 * s, y - 26 * s); g.lineTo(x - 12 * s, y - 42 * s); g.lineTo(x + 26 * s, y - 34 * s); g.lineTo(x + 46 * s, y - 14 * s); g.lineTo(x + 40 * s, y); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(x - 24 * s, y - 26 * s); g.lineTo(x - 8 * s, y - 34 * s); g.lineTo(x + 2 * s, y - 22 * s); g.closePath(); g.fill();
  }
  function saltPile(g, x, y, s) {
    g.fillStyle = '#F4F2FA'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x - 58 * s, y); g.quadraticCurveTo(x, y - 76 * s, x + 58 * s, y); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(140,130,180,.5)';
    for (let i = 0; i < 14; i++) g.fillRect(x + (rand(i) - 0.5) * 70 * s, y - rand(i + 3) * 28 * s - 3, 3, 3);
  }
  function tank(g, x, y, s) {
    const gr = g.createLinearGradient(x - 26 * s, 0, x + 26 * s, 0);
    gr.addColorStop(0, '#3A7D5A'); gr.addColorStop(0.45, '#7FDCA8'); gr.addColorStop(1, '#2C6146');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    Art.round(g, x - 26 * s, y - 76 * s, 52 * s, 76 * s, 14 * s); g.fill(); g.stroke();
    g.fillStyle = '#9A94B3'; Art.round(g, x - 8 * s, y - 92 * s, 16 * s, 18 * s, 3); g.fill(); g.stroke();
  }
  function balloonS(g, x, y, r, t, color = C.pink) {
    const bob = Math.sin(t * 1.3) * 3;
    g.fillStyle = color; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(x, y + bob, r, r * 1.15, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x - r * 0.38, y - r * 0.45 + bob, r * 0.15, r * 0.24, 0.5, 0, TAU); g.fill();
  }
  const glass = (g, cx, base, w, h, level = 0.7, liquid = C.water, inside) => Art.beaker(g, cx, base, w, h, { level, liquid, ticks: false, inside });

  /* ---------- Bench: states of matter, a real attractive particle model ---------- */
  const SUB = {
    H2O: { name: 'Water', f: 'H2O', mp: 273.15, bp: 373.15, solid: '#DDF4FF', liquid: C.water, gas: 'rgba(235,245,255,.08)', draw: (g, x, y, r) => water(g, x, y, 112, r) },
    O2: { name: 'Oxygen', f: 'O2', mp: EL.O.mp, bp: EL.O.bp, solid: '#BFE3FF', liquid: '#9BD3FF', gas: 'rgba(235,245,255,.03)', draw: (g, x, y, r) => duo(g, x, y, r, EO, 13.5, 16) },
    Br2: { name: 'Bromine', f: 'Br2', mp: EL.Br.mp, bp: EL.Br.bp, solid: '#6B2415', liquid: '#8A2A14', gas: 'rgba(214,92,38,.52)', draw: (g, x, y, r) => duo(g, x, y, r, Art.elementColor('Br'), 14.5, 17) },
  };
  const BOX = { x0: 246, y0: 40, x1: 640, y1: 422 };
  const SIG = 38, EPS = 18000, GRAV = 120, NPART = 28;
  const ST = { sub: 'H2O', u: -0.35, parts: [] };
  const stateOf = (u) => (u < 0 ? 'Solid' : u < 1 ? 'Liquid' : 'Gas');
  /** The temperature the thermostat holds. Worked out by running the model: rows melt near 0.42, and it flies apart above about 0.9. */
  const reduced = (u) => (u < 0 ? lerp(0.03, 0.36, (u + 0.6) / 0.6) : u < 1 ? lerp(0.47, 0.62, u) : lerp(1, 2.1, (u - 1) / 0.6));
  function seedSim() {
    const cols = 7, W = BOX.x1 - BOX.x0, H = BOX.y1 - BOX.y0;
    ST.parts = Array.from({ length: NPART }, (_, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      return { x: W / 2 + (c - (cols - 1) / 2 + (r % 2 ? 0.5 : 0)) * SIG * 1.12, y: H - SIG * 0.6 - r * SIG * 0.97, vx: (rand(i) - 0.5) * 30, vy: (rand(i + 9) - 0.5) * 30, rot: 0.3 + (r % 2) * 0.2, spin: (rand(i + 3) - 0.5) * 2, fx: 0, fy: 0 };
    });
  }
  function stepSim(dtFrame) {
    const P = ST.parts, n = P.length, W = BOX.x1 - BOX.x0, H = BOX.y1 - BOX.y0;
    const rc2 = (2.5 * SIG) ** 2, s2 = SIG * SIG, target = reduced(ST.u);
    const steps = Math.max(1, Math.min(10, Math.round(dtFrame * 400))), dt = dtFrame / steps;
    for (let st = 0; st < steps; st++) {
      for (let i = 0; i < n; i++) { P[i].fx = 0; P[i].fy = GRAV; }
      for (let i = 0; i < n; i++) {
        const a = P[i];
        for (let j = i + 1; j < n; j++) {
          const b = P[j]; const dx = a.x - b.x, dy = a.y - b.y; let r2 = dx * dx + dy * dy;
          if (r2 > rc2) continue;
          if (r2 < s2 * 0.5) r2 = s2 * 0.5;
          const ir2 = s2 / r2, ir6 = ir2 * ir2 * ir2, f = 24 * EPS * ir6 * (2 * ir6 - 1) / r2;
          a.fx += f * dx; a.fy += f * dy; b.fx -= f * dx; b.fy -= f * dy;
        }
      }
      let ke = 0;
      for (let i = 0; i < n; i++) { const p = P[i]; p.vx += p.fx * dt; p.vy += p.fy * dt; ke += p.vx * p.vx + p.vy * p.vy; }
      const T = ke / (2 * n) / EPS, lam = Math.sqrt(Math.max(0.5, 1 + (dt / 0.2) * (target / Math.max(T, 1e-4) - 1)));
      for (let i = 0; i < n; i++) {
        const p = P[i], r = SIG * 0.5;
        p.vx *= lam; p.vy *= lam; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < r) { p.x = r; p.vx = Math.abs(p.vx); }
        if (p.x > W - r) { p.x = W - r; p.vx = -Math.abs(p.vx); }
        if (p.y < r) { p.y = r; p.vy = Math.abs(p.vy); }
        if (p.y > H - r) { p.y = H - r; p.vy = -Math.abs(p.vy); }
      }
    }
    const spinRate = clamp((target - 0.3) * 2.2);
    for (let i = 0; i < n; i++) P[i].rot += P[i].spin * spinRate * dtFrame * 3;
  }
  function chunk(g, cx, base, s, color) {
    if (s <= 0) return;
    const w = 106 * s, h = 86 * s, x = cx - w / 2, y = base - h - 3;
    const d = g.createLinearGradient(x, y, x + w, y + h);
    d.addColorStop(0, Art.mix(color, '#ffffff', 0.5)); d.addColorStop(0.5, color); d.addColorStop(1, Art.mix(color, '#102040', 0.28));
    g.fillStyle = d; g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2.5;
    Art.round(g, x, y, w, h, 10 * s); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x + w * 0.2, y + h * 0.26); g.lineTo(x + w * 0.46, y + h * 0.5); g.lineTo(x + w * 0.36, y + h * 0.8); g.moveTo(x + w * 0.46, y + h * 0.5); g.lineTo(x + w * 0.8, y + h * 0.4); g.stroke();
  }
  const stStage = Lab.stage('#c-states', {
    bg: (g, W, H) => { Art.bg(g, W, H, 'micro', 0); },
    label: 'On the left a sealed jar of the substance, in the middle a particle simulation that changes from solid rows to a sliding liquid to a flying gas as the temperature rises, and on the right the formula with its state.',
    draw(g, t, dt) {
      if (dt > 0) stepSim(dt);
      const sub = SUB[ST.sub], u = ST.u, state = stateOf(u);
      /* The view into the jar. */
      g.fillStyle = 'rgba(255,255,255,.07)';
      g.beginPath(); g.moveTo(170, 260); g.lineTo(BOX.x0, BOX.y0); g.lineTo(BOX.x0, BOX.y1); g.closePath(); g.fill();
      /* Macro: a lidded jar. */
      const base = 400;
      const melt = seg(u, -0.04, 0.04), boil = seg(u, 1, 1.12);
      const level = melt * (1 - boil) * 0.6;
      Art.bench(g, 236, base, 50);
      const jar = Art.beaker(g, 118, base, 150, 196, {
        level, liquid: sub.liquid, ticks: false,
        inside: (g2, b) => {
          if (boil > 0) { g2.fillStyle = sub.gas; g2.globalAlpha = boil; g2.fillRect(b.x0 - 8, base - 196, 170, 196); g2.globalAlpha = 1; }
          if (ST.sub === 'H2O' && boil > 0) Art.smoke(g2, 118, base - 12, t, { n: 12, h: 170, r: 16, alpha: 0.13 * boil, spread: 40, speed: 0.2 });
          if (level > 0 && u > 0.82 && u < 1.12) Art.bubbles(g2, b.x0 + 12, b.x1 - 12, base - 8, b.surface + 4, t, { n: Math.round(lerp(3, 12, seg(u, 0.82, 1))), r: 5 });
        },
      });
      chunk(g, 118, base, 1 - melt, sub.solid);
      g.fillStyle = '#6F6A8B'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      Art.round(g, 118 - 84, base - 196 - 14, 168, 14, 5); g.fill(); g.stroke();
      void jar;
      const Tk = lerp(sub.mp, sub.bp, u), Tc = Math.round(Tk - 273.15);
      Art.pill(g, 'What you see', 92, 26, { size: 22, color: C.sun, text: '#22123A' });
      Art.text(g, `${String(Tc).replace('-', '−')} °C`, 118, 92, { font: 'display', size: 44, color: u < 0 ? '#9FE3FF' : u < 1 ? C.sun : C.fire, halo: true });
      /* Particle box. */
      g.fillStyle = 'rgba(16,8,32,.72)'; Art.round(g, BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0, 10); g.fill();
      g.save(); g.beginPath(); g.rect(BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0); g.clip();
      ST.parts.forEach((p) => sub.draw(g, BOX.x0 + p.x, BOX.y0 + p.y, p.rot));
      g.restore();
      g.strokeStyle = C.cyan; g.lineWidth = 4; Art.round(g, BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0, 10); g.stroke();
      Art.pill(g, 'The particles', (BOX.x0 + BOX.x1) / 2, 24, { size: 22, color: C.cyan, text: '#06324A' });
      /* Symbols and description. */
      Art.pill(g, 'The symbols', 722, 26, { size: 22, color: C.pink, text: '#fff' });
      const letter = state === 'Solid' ? '(s)' : state === 'Liquid' ? '(l)' : '(g)';
      Art.formula(g, sub.f + letter, 722, 86, { size: 36, colorize: true });
      Art.text(g, state, 722, 158, { font: 'display', size: 46, color: state === 'Solid' ? '#9FE3FF' : state === 'Liquid' ? C.water : C.fire });
      const motion = state === 'Solid' ? ['Vibrating', 'in place'] : state === 'Liquid' ? ['Sliding', 'past each', 'other'] : ['Flying', 'around', 'freely'];
      motion.forEach((s, i) => Art.text(g, s, 722, 212 + i * 30, { size: 25 }));
      /* A thermometer tied to the slider. */
      Art.thermometer(g, 722, 322, 74, (u + 0.6) / 2.2, { w: 13 });
      void t;
    },
  });
  function paintStates() {
    const sub = SUB[ST.sub], u = ST.u;
    const c = (k) => `${String(Math.round(k - 273.15)).replace('-', '−')} °C`;
    Lab.$('#st-u-out').textContent = c(lerp(sub.mp, sub.bp, u));
    Lab.$('#st-state').textContent = stateOf(u);
    Lab.$('#st-mp').textContent = c(sub.mp);
    Lab.$('#st-bp').textContent = c(sub.bp);
    stStage.redraw();
  }
  seedSim();
  // Let the crystal settle so the first frame is already a neat solid.
  for (let i = 0; i < 80; i++) stepSim(1 / 60);
  Lab.segmented('#st-sub', (v) => { ST.sub = v; paintStates(); });
  Lab.bind('#st-u', null, null, (v) => { ST.u = v; paintStates(); });

  /* ---------- Story: the four kinds of matter ---------- */
  const PIC = {
    gold: latticePic('Au', null, 26, 54),
    oxygen: gasPic([['O2', 7, { s: 34 }]], 2),
    waterL: { amp: 4, items: spiral(10, 132, 0.4).map(([x, y], i) => ({ f: 'H2O', x, y, rot: rand(i + 2) * TAU, seed: i, s: 190 })) },
    salt: latticePic('Na', 'Cl', 28, 55),
    air: gasPic([['N2', 7, { s: 32 }], ['O2', 2, { s: 32 }]], 3),
    saltWater: { amp: 4, items: mix([['H2O', 8, { s: 165 }], ['Na', 2, { ion: '+', r: 19 }], ['Cl', 2, { ion: '-', r: 25 }]], 0, 5) },
    oilWater: layersPic({ f: 'oil', d: 92 }, { f: 'H2O', s: 150, d: 58 }, 4),
    sandWater: clumpPic({ f: 'Si', r: 22, alt: 'O', altR: 20 }, { f: 'H2O', s: 150 }, 2),
  };
  function twoZooms(g, p, t, title, color, textColor, A, B) {
    const R = 116, cy = 178, xA = 250, xB = 550;
    A.obj(g, xA, 404);
    B.obj(g, xB, 404);
    Art.zoom(g, xA, A.fromY || 372, 196, cy, R, (gg, x, y, r) => drawPic(gg, A.pic, x, y, r, t), { p: seg(p, 0.06, 0.32) });
    Art.zoom(g, xB, B.fromY || 372, 604, cy, R, (gg, x, y, r) => drawPic(gg, B.pic, x, y, r, t), { p: seg(p, 0.32, 0.58) });
    Art.text(g, A.label, 40, 380, { size: 27, align: 'left', alpha: seg(p, 0.2, 0.35), halo: true });
    Art.text(g, B.label, 760, 380, { size: 27, align: 'right', alpha: seg(p, 0.46, 0.6), halo: true });
    Art.pill(g, title, 400, 34, { size: 32, font: 'display', color, text: textColor, alpha: seg(p, 0, 0.12) });
  }
  const benchLab = (g, W, H) => Art.bgLab(g, W, H, 46);
  Lab.story('#story-kinds', {
    title: 'Four boxes for all matter',
    scenes: [
      {
        say: 'An <b>element</b> has only one kind of atom. Gold is all gold atoms. Oxygen gas is all oxygen atoms, even though they travel in pairs.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          benchLab(g, W, H);
          twoZooms(g, p, t, 'Element', C.leaf, '#06301C', { pic: PIC.gold, obj: (gg, x) => nugget(gg, x, 404, 1.1), label: 'gold', fromY: 376 }, { pic: PIC.oxygen, obj: (gg, x) => tank(gg, x, 404, 0.86), label: 'oxygen gas', fromY: 350 });
        },
      },
      {
        say: 'A <b>compound</b> has two or more different elements bonded in a fixed ratio. Every bit of water is $\\ce{H2O}$. Every bit of table salt is $\\ce{NaCl}$.',
        speak: 'A compound has two or more different elements bonded in a fixed ratio. Every bit of water is H 2 O. Every bit of table salt is N a C l.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          benchLab(g, W, H);
          twoZooms(g, p, t, 'Compound', C.cyan, '#06324A', { pic: PIC.waterL, obj: (gg, x) => glass(gg, x, 404, 84, 84, 0.76), label: 'water', fromY: 360 }, { pic: PIC.salt, obj: (gg, x) => saltPile(gg, x, 404, 0.95), label: 'table salt', fromY: 372 });
        },
      },
      {
        say: 'A <b>homogeneous mixture</b> has more than one kind of particle, not bonded, and evenly spread. Every spoonful is the same. Air and salt water are both like this.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          benchLab(g, W, H);
          twoZooms(g, p, t, 'Homogeneous mixture', C.sun, '#22123A', { pic: PIC.air, obj: (gg, x) => balloonS(gg, x, 362, 34, t, '#7BD7E6'), label: 'air', fromY: 340 }, { pic: PIC.saltWater, obj: (gg, x) => glass(gg, x, 404, 84, 84, 0.76), label: 'salt water', fromY: 360 });
        },
      },
      {
        say: 'A <b>heterogeneous mixture</b> has separate regions you could point to. A scoop from one spot is different from a scoop from another. Think oil on water, or sand in water.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          benchLab(g, W, H);
          twoZooms(g, p, t, 'Heterogeneous mixture', C.pink, '#fff', {
            pic: PIC.oilWater, label: 'oil on water', fromY: 362,
            obj: (gg, x) => glass(gg, x, 404, 84, 84, 0.8, C.water, (g2, b) => { g2.fillStyle = 'rgba(255,214,70,.9)'; g2.fillRect(b.x0, b.top, 84, 24); }),
          }, {
            pic: PIC.sandWater, label: 'sand in water', fromY: 376,
            obj: (gg, x) => glass(gg, x, 404, 84, 84, 0.8, C.water, (g2, b) => { g2.fillStyle = '#D9B26B'; g2.beginPath(); g2.ellipse(x, b.bottom, 46, 20, 0, 0, TAU); g2.fill(); }),
          });
        },
      },
      {
        say: 'That is the whole map. Ask two questions: <b>is there one kind of building block, or more?</b> Then, if one kind, is it one element? If more, is it evenly spread?',
        dur: 4.4,
        draw(g, p, t) {
          const Lv = [[100, 'Element', PIC.gold, C.leaf], [300, 'Compound', PIC.waterL, C.cyan], [500, 'Homogeneous', PIC.air, C.sun], [700, 'Heterogeneous', PIC.oilWater, C.pink]];
          const a1 = seg(p, 0.06, 0.26), a2 = seg(p, 0.3, 0.55);
          Art.arrow(g, 360, 52, 214, 112, { color: C.ink, w: 5, p: a1, alpha: 0.8 });
          Art.arrow(g, 440, 52, 586, 112, { color: C.ink, w: 5, p: a1, alpha: 0.8 });
          Art.arrow(g, 170, 158, 110, 214, { color: C.ink, w: 5, p: a2, alpha: 0.8 });
          Art.arrow(g, 232, 158, 290, 214, { color: C.ink, w: 5, p: a2, alpha: 0.8 });
          Art.arrow(g, 568, 158, 510, 214, { color: C.ink, w: 5, p: a2, alpha: 0.8 });
          Art.arrow(g, 632, 158, 690, 214, { color: C.ink, w: 5, p: a2, alpha: 0.8 });
          Art.pill(g, 'Matter', 400, 34, { size: 30, font: 'display', color: C.plum2, text: '#fff' });
          Art.pill(g, 'Pure substance', 200, 134, { size: 26, font: 'display', color: C.violet, text: '#22123A', alpha: a1 });
          Art.pill(g, 'Mixture', 600, 134, { size: 26, font: 'display', color: C.fire, text: '#22123A', alpha: a1 });
          Art.text(g, 'one kind', 208, 66, { size: 23, color: C.dim, alpha: a1 });
          Art.text(g, 'more than one', 612, 66, { size: 23, color: C.dim, alpha: a1 });
          Lv.forEach(([x, name, pic, col], i) => {
            const q = seg(p, 0.52 + i * 0.09, 0.66 + i * 0.09);
            if (q <= 0) return;
            Art.zoom(g, x, 276, x, 276, 66, (gg, cx, cy, r) => drawPic(gg, pic, cx, cy, r, t), { p: q, rim: col });
            Art.text(g, name, x, 366, { font: 'display', size: 25, color: col, alpha: q });
          });
          const ex = [[100, 'gold, O₂'], [300, 'water, salt'], [500, 'air, salt water'], [700, 'oil on water']];
          ex.forEach(([x, s], i) => Art.text(g, s, x, 402, { size: 22, alpha: seg(p, 0.6 + i * 0.09, 0.74 + i * 0.09) }));
        },
      },
    ],
  });

  /* ---------- Bench: classify the particle picture ---------- */
  const POOL = [
    { pic: () => gasPic([['He', 7, { r: 24 }]], 2), kind: 'element', name: 'helium gas', n: 1, why: 'Single helium atoms. One kind of particle, one element.' },
    { pic: () => gasPic([['Ne', 8, { r: 25 }]], 4), kind: 'element', name: 'neon gas', n: 1, why: 'Single neon atoms. One kind of particle, one element.' },
    { pic: () => latticePic('Fe', null, 26, 54), kind: 'element', name: 'solid iron', n: 1, why: 'A solid of iron atoms. Every atom is the same element.' },
    { pic: () => latticePic('Au', null, 26, 54, 3), kind: 'element', name: 'solid gold', n: 1, why: 'A solid of gold atoms. Every atom is the same element.' },
    { pic: () => gasPic([['O2', 7]], 6), kind: 'element', name: 'oxygen gas', n: 1, why: 'Pairs of atoms, but both atoms in each pair are oxygen. That makes it an element.' },
    { pic: () => gasPic([['N2', 7]], 8), kind: 'element', name: 'nitrogen gas', n: 1, why: 'Pairs of atoms, but both atoms are nitrogen. Still an element.' },
    { pic: () => gasPic([['H2', 8, { s: 30 }]], 9), kind: 'element', name: 'hydrogen gas', n: 1, why: 'Pairs of hydrogen atoms. Still an element.' },
    { pic: () => gasPic([['Cl2', 6]], 10), kind: 'element', name: 'chlorine gas', n: 1, why: 'Pairs of chlorine atoms. Still an element.' },
    { pic: () => ({ amp: 4, items: spiral(10, 132, 0.8).map(([x, y], i) => ({ f: 'H2O', x, y, rot: rand(i + 7) * TAU, seed: i, s: 190 })) }), kind: 'compound', name: 'water', n: 2, why: 'Every particle is the same, and each has two elements bonded: H and O.' },
    { pic: () => gasPic([['CO2', 6, { s: 22 }]], 11), kind: 'compound', name: 'carbon dioxide', n: 2, why: 'Every particle is the same, and each has two elements bonded: C and O.' },
    { pic: () => gasPic([['NH3', 7, { s: 26 }]], 12), kind: 'compound', name: 'ammonia', n: 2, why: 'Every particle is the same, and each has two elements bonded: N and H.' },
    { pic: () => gasPic([['CH4', 6, { s: 22 }]], 13), kind: 'compound', name: 'methane', n: 2, why: 'Every particle is the same, and each has two elements bonded: C and H.' },
    { pic: () => gasPic([['HCl', 7]], 14), kind: 'compound', name: 'hydrogen chloride', n: 2, why: 'Two different atoms joined in every particle, and every particle the same.' },
    { pic: () => latticePic('Na', 'Cl', 28, 55, 2), kind: 'compound', name: 'table salt', n: 2, why: 'Two elements in a fixed one-to-one ratio, held in a repeating grid. This is one compound.' },
    { pic: () => gasPic([['N2', 5], ['O2', 3]], 15), kind: 'homo', name: 'air', n: 2, even: true, why: 'Two kinds of molecule, not bonded to each other, and evenly spread. A mixture of two elements.' },
    { pic: () => gasPic([['He', 5, { r: 22 }], ['Ne', 4, { r: 25 }]], 16), kind: 'homo', name: 'helium and neon', n: 2, even: true, why: 'Two kinds of atom, not bonded, and evenly spread.' },
    { pic: () => gasPic([['CO2', 4, { s: 22 }], ['O2', 5]], 17), kind: 'homo', name: 'a gas mixture', n: 2, even: true, why: 'Two kinds of molecule, not bonded to each other, and evenly spread.' },
    { pic: () => ({ amp: 4, items: mix([['H2O', 8, { s: 165 }], ['Na', 2, { ion: '+', r: 19 }], ['Cl', 2, { ion: '-', r: 25 }]], 0, 18) }), kind: 'homo', name: 'salt water', n: 3, even: true, why: 'Water molecules and separated ions, evenly spread. This is a solution, which is a homogeneous mixture.' },
    { pic: () => ({ amp: 4, items: mix([['H2O', 6, { s: 165 }], ['CH3OH', 5, { s: 21 }]], 0, 19) }), kind: 'homo', name: 'methanol in water', n: 2, even: true, why: 'Two kinds of molecule evenly spread. A solution.' },
    { pic: () => layersPic({ f: 'oil', d: 92 }, { f: 'H2O', s: 150, d: 58 }, 6), kind: 'hetero', name: 'oil on water', n: 2, even: false, why: 'Two kinds of particle sitting in separate regions. Not evenly spread.' },
    { pic: () => clumpPic({ f: 'Si', r: 22, alt: 'O', altR: 20 }, { f: 'H2O', s: 150 }, 4), kind: 'hetero', name: 'sand in water', n: 2, even: false, why: 'Lumps of one substance sitting in another. You could point to the regions.' },
    { pic: () => clumpPic({ f: 'Au', r: 22 }, { f: 'N2', s: 28 }, 8), kind: 'hetero', name: 'gold dust in nitrogen', n: 2, even: false, why: 'Solid lumps in a gas. Two kinds of particle in separate regions.' },
    { pic: () => layersPic({ f: 'N2', d: 74 }, { f: 'H2O', s: 150, d: 58 }, 9), kind: 'hetero', name: 'nitrogen above water', n: 2, even: false, why: 'A gas sitting above a liquid. Two regions with a clear boundary.' },
  ];
  const KIND_NAME = { element: 'Element', compound: 'Compound', homo: 'Homogeneous mixture', hetero: 'Heterogeneous mixture' };
  const CL = { order: [], i: 0, score: 0, answered: null, t0: 0, pic: null, done: false };
  function newRound() {
    const by = (k) => POOL.filter((p) => p.kind === k).map((p) => [Math.random(), p]).sort((a, b) => a[0] - b[0]).map((e) => e[1]);
    const picks = [...by('element').slice(0, 3), ...by('compound').slice(0, 2), ...by('homo').slice(0, 3), ...by('hetero').slice(0, 2)];
    CL.order = picks.map((p) => [Math.random(), p]).sort((a, b) => a[0] - b[0]).map((e) => e[1]);
    CL.i = 0; CL.score = 0; CL.done = false; CL.answered = null;
    CL.pic = CL.order[0].pic();
    Lab.$('#cl-next').disabled = true; Lab.$('#cl-next').textContent = 'Next picture';
  }
  newRound();
  const clStage = Lab.stage('#c-classify', {
    label: 'A magnifier showing a particle picture, with the reasoning steps beside it. Answer with the buttons below.',
    draw(g, t, dt, st) {
      if (CL.done) {
        Art.text(g, `${CL.score} of ${CL.order.length}`, 400, 130, { font: 'display', size: 76, color: CL.score >= 8 ? C.leaf : C.sun });
        Art.text(g, CL.score === 10 ? 'Perfect. Could not have sorted it better myself.' : CL.score >= 8 ? 'Strong. You read particles like a chemist.' : 'Look at the two questions in the story, then try again.', 400, 210, { size: 27 });
        Art.moe(g, 400, 430, 190, CL.score >= 8 ? 'cheer' : 'think', { t });
        return;
      }
      const it = CL.order[CL.i];
      const ans = CL.answered, right = ans === it.kind;
      const since = t - CL.t0;
      const cx = 236, cy = 225, R = 200;
      Art.zoom(g, cx, cy, cx, cy, R, (gg, x, y, r) => drawPic(gg, CL.pic, x, y, r, t), { rim: ans ? (right ? C.leaf : C.red) : C.cyan });
      if (ans && since < 1) Art.burst(g, cx, cy, since, { r: 260, n: 22 });
      Art.text(g, `Picture ${CL.i + 1} of ${CL.order.length}`, 790, 30, { size: 24, align: 'right', color: C.dim });
      Art.text(g, `Right: ${CL.score}`, 790, 62, { font: 'display', size: 30, align: 'right', color: C.sun });
      if (!ans) {
        const lines = ['1. How many kinds', '    of particle?', '2. If one: is each', '    particle one element?', '3. If more: are they', '    evenly spread?'];
        lines.forEach((s, i) => Art.text(g, s, 462, 138 + i * 36 + (i > 1 ? 10 : 0) + (i > 3 ? 10 : 0), { size: 25, align: 'left', color: i % 2 ? C.ink : C.ink }));
        Art.moe(g, 716, 446, 100, 'think', { t, flip: true });
      } else {
        const q = (k) => clamp((since - k * 0.3) * 3);
        const col1 = it.n === 1 ? 'One' : 'More than one';
        Art.text(g, 'Kinds of particle', 462, 126, { size: 23, align: 'left', color: C.dim, alpha: q(0) });
        Art.text(g, it.kind === 'element' || it.kind === 'compound' ? 'One' : 'More than one', 462, 158, { font: 'display', size: 33, align: 'left', alpha: q(0) });
        void col1;
        const pure = it.kind === 'element' || it.kind === 'compound';
        Art.text(g, pure ? 'Elements in each particle' : 'Evenly spread?', 462, 208, { size: 23, align: 'left', color: C.dim, alpha: q(1) });
        Art.text(g, pure ? (it.kind === 'element' ? 'Just one' : 'Two or more') : (it.even ? 'Yes' : 'No, separate regions'), 462, 240, { font: 'display', size: 33, align: 'left', alpha: q(1) });
        Art.text(g, 'So it is', 462, 290, { size: 23, align: 'left', color: C.dim, alpha: q(2) });
        const nm = KIND_NAME[it.kind].split(' ');
        Art.text(g, nm[0], 462, 326, { font: 'display', size: 38, align: 'left', color: right ? C.leaf : C.sun, alpha: q(2) });
        if (nm[1]) Art.text(g, nm[1], 462, 366, { font: 'display', size: 38, align: 'left', color: right ? C.leaf : C.sun, alpha: q(2) });
        Art.text(g, it.name, 462, 412, { size: 25, align: 'left', alpha: q(3), color: C.cyan });
      }
      void st; void dt;
    },
  });
  const clSeg = Lab.segmented('#cl-answer', (v) => {
    if (CL.answered || CL.done) { clSeg.set('__', false); return; }
    CL.answered = v; CL.t0 = clStage.t;
    const it = CL.order[CL.i], right = v === it.kind;
    if (right) { CL.score++; Lab.sound.good(); } else Lab.sound.bad();
    Lab.$('#cl-foot').innerHTML = Lab.texString(`<p><b>${right ? 'Yes!' : `It is: ${KIND_NAME[it.kind].toLowerCase()}.`}</b> ${it.why}</p>`);
    const next = Lab.$('#cl-next'); next.disabled = false;
    next.textContent = CL.i === CL.order.length - 1 ? 'See your score' : 'Next picture';
    clStage.redraw();
  });
  Lab.$('#cl-next').addEventListener('click', () => {
    if (CL.done) { newRound(); clSeg.set('__', false); Lab.$('#cl-foot').innerHTML = '<p>Count the different kinds of particle first. Then look at what each particle is made of.</p>'; clStage.redraw(); return; }
    if (CL.i >= CL.order.length - 1) {
      CL.done = true;
      Lab.$('#cl-next').textContent = 'Play again';
      if (CL.score >= 8) { Lab.collection.award(1); Lab.confetti(); }
      Lab.$('#cl-foot').innerHTML = '<p>Every picture on an exam yields to the same two questions.</p>';
    } else {
      CL.i++; CL.answered = null; CL.pic = CL.order[CL.i].pic();
      Lab.$('#cl-next').disabled = true;
      Lab.$('#cl-foot').innerHTML = '<p>Count the different kinds of particle first. Then look at what each particle is made of.</p>';
    }
    clSeg.set('__', false);
    clStage.redraw();
  });

  /* ---------- Story: physical or chemical, with particle proof ---------- */
  const grid = (f, cols, rows, dx, dy, extra = {}) => {
    const out = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push(Object.assign({ f, x: (i - (cols - 1) / 2 + (j % 2 ? 0.25 : -0.25)) * dx, y: (j - (rows - 1) / 2) * dy, rot: 0.3, seed: i * 3 + j * 7 }, extra));
    return out;
  };
  const spread = (list, R = 120, seed = 1) => mix(list, 0, seed).map((it) => { it.x *= R / 132; it.y *= R / 132; return it; });
  const ICE = { amp: 1.5, items: grid('H2O', 4, 4, 72, 62, { s: 210 }).filter((it) => Math.hypot(it.x, it.y) < 150) };
  const LIQUID = { amp: 5, items: spread([['H2O', 11, { s: 210 }]], 132, 3) };
  const BURNA = [
    { s: 'C', r: 42, a: [190, 180], b: [400, 92] },
    { s: 'H', r: 26, a: [190, 92], b: [712, 322] }, { s: 'H', r: 26, a: [190, 268], b: [288, 322] },
    { s: 'H', r: 26, a: [102, 180], b: [88, 322] }, { s: 'H', r: 26, a: [278, 180], b: [512, 322] },
    { s: 'O', r: 38, a: [510, 92], b: [298, 92] }, { s: 'O', r: 38, a: [610, 92], b: [502, 92] },
    { s: 'O', r: 38, a: [510, 276], b: [188, 262] }, { s: 'O', r: 38, a: [610, 276], b: [612, 262] },
  ];
  const BA = [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [5, 6, 2], [7, 8, 2]];
  const AA = [[0, 5, 2], [0, 6, 2], [7, 3, 1], [7, 2, 1], [8, 4, 1], [8, 1, 1]];
  function badge(g, text, color, y, alpha, W = 800) {
    if (alpha <= 0) return;
    g.save(); g.globalAlpha *= alpha;
    g.font = `400 30px ${Art.FONT_DISPLAY}`;
    const w = g.measureText(text).width + 50;
    g.fillStyle = color; Art.round(g, W / 2 - w / 2, y - 26, w, 52, 18); g.fill();
    Art.text(g, text, W / 2, y + 1, { font: 'display', size: 30, color: Art.lum(color) > 0.6 ? '#22123A' : '#fff' });
    g.restore();
  }
  function iconTube(g, x, y, draw) { Art.testTube(g, x, y, 54, 130, draw); }
  Lab.story('#story-change', {
    title: 'The particle test',
    scenes: [
      {
        say: 'Melting. Before and after, every particle is still a whole $\\ce{H2O}$ molecule. They only left their rows. Same particles, so this is a <b>physical change</b>.',
        speak: 'Melting. Before and after, every particle is still a whole water molecule. They only left their rows. Same particles, so this is a physical change.',
        dur: 3.2,
        draw(g, p, t, { W }) {
          Art.zoom(g, 200, 186, 200, 186, 148, (gg, x, y, r) => drawPic(gg, ICE, x, y, r, t), { p: seg(p, 0, 0.2) });
          Art.arrow(g, 366, 186, 434, 186, { color: C.fire, w: 8, p: seg(p, 0.25, 0.4) });
          Art.text(g, 'heat', 400, 150, { size: 26, color: C.fire, alpha: seg(p, 0.25, 0.4) });
          Art.zoom(g, 600, 186, 600, 186, 148, (gg, x, y, r) => drawPic(gg, LIQUID, x, y, r, t), { p: seg(p, 0.35, 0.55) });
          Art.text(g, 'ice', 200, 20, { size: 25, alpha: seg(p, 0.05, 0.2) });
          Art.text(g, 'liquid water', 600, 20, { size: 25, alpha: seg(p, 0.4, 0.55) });
          Art.formula(g, 'H2O(s) -> H2O(l)', W / 2, 362, { size: 38, colorize: true });
          badge(g, 'Same molecules: physical change', C.leaf, 416, seg(p, 0.72, 0.9));
        },
      },
      {
        say: 'Boiling. What is inside a bubble? Many people guess hydrogen and oxygen gas. <b>That is wrong.</b> Each bubble holds whole $\\ce{H2O}$ molecules. No bonds inside the molecules break.',
        speak: 'Boiling. What is inside a bubble? Many people guess hydrogen and oxygen gas. That is wrong. Each bubble holds whole water molecules. No bonds inside the molecules break.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          Art.bgLab(g, W, H, 40);
          const base = H - 40;
          Art.bunsen(g, 400, base, 0.55, { air: 1, flame: 1, t });
          const b = Art.beaker(g, 400, base - 62, 150, 120, { level: 0.8, liquid: C.water, ticks: false, inside: (g2, box) => Art.bubbles(g2, box.x0 + 12, box.x1 - 12, box.bottom - 6, box.top + 4, t * 1.1, { n: 12, r: 6 }) });
          const wrong = seg(p, 0.1, 0.34), right = seg(p, 0.55, 0.78);
          Art.zoom(g, 372, b.surface + 30, 165, 170, 145, (gg, x, y) => {
            const swirl = (i) => [Math.sin(t * 1.2 + i * 2) * 62, Math.cos(t * 1.4 + i * 1.3) * 62];
            [['H2', 34], ['H2', 34], ['O2', 28]].forEach(([f, s], i) => {
              const [dx, dy] = swirl(i);
              Art.molecule(gg, x + dx, y + dy, s, f, { style: 'fill', atomScale: 1.28, labels: false, rot: t * (1 + i * 0.3) + i });
            });
          }, { p: wrong, rim: C.red });
          if (seg(p, 0.34, 0.5) > 0) {
            Art.strike(g, 75, 80, 255, 260, seg(p, 0.34, 0.42), C.red, 12);
            Art.strike(g, 255, 80, 75, 260, seg(p, 0.42, 0.5), C.red, 12);
          }
          Art.text(g, 'Not hydrogen and oxygen', 168, 336, { font: 'display', size: 25, color: '#FF8A94', alpha: seg(p, 0.42, 0.5), halo: true });
          Art.zoom(g, 428, b.surface + 30, 635, 170, 145, (gg, x, y) => {
            [0, 1, 2].forEach((i) => {
              const dx = Math.sin(t * 1.2 + i * 2.1) * 70, dy = Math.cos(t * 1.5 + i * 1.3) * 70;
              water(gg, x + dx, y + dy, 300, t * (0.9 + i * 0.2) + i, { face: i === 0 ? 'happy' : null, t, seed: i });
            });
          }, { p: right, rim: C.leaf });
          Art.text(g, 'Whole water molecules', 632, 336, { font: 'display', size: 25, color: C.leaf, alpha: seg(p, 0.72, 0.86), halo: true });
          Art.formula(g, 'H2O(l) -> H2O(g)', 632, 374, { size: 28, colorize: true, halo: true });
        },
      },
      {
        say: 'Dissolving. Sugar molecules spread out in water, still whole. Salt splits into ions, but dry it out and the same salt comes back. Courses count both as <b>physical changes</b>.',
        dur: 3.8,
        draw(g, p, t) {
          const R = 88, y = 168;
          const sugarPack = { amp: 1, items: grid('sugar', 3, 3, 82, 64, { s: 0.96, rot: 0.1 }) };
          const sugarSpread = { amp: 6, items: spread([['sugar', 3, { s: 0.92 }], ['H2O', 7, { s: 190 }]], 136, 4) };
          const saltLattice = latticePic('Na', 'Cl', 30, 62, 7);
          const saltIons = { amp: 6, items: spread([['Na', 3, { ion: '+', r: 24 }], ['Cl', 3, { ion: '-', r: 31 }], ['H2O', 6, { s: 190 }]], 136, 8) };
          Art.text(g, 'Sugar', 196, 30, { font: 'display', size: 33, color: C.sun });
          Art.text(g, 'Salt', 604, 30, { font: 'display', size: 33, color: C.cyan });
          Art.zoom(g, 96, y, 96, y, R, (gg, x, yy, r) => drawPic(gg, sugarPack, x, yy, r, t), { p: seg(p, 0.02, 0.18) });
          Art.arrow(g, 190, y, 208, y, { color: C.ink, w: 6, p: seg(p, 0.18, 0.28), head: 14 });
          Art.zoom(g, 298, y, 298, y, R, (gg, x, yy, r) => drawPic(gg, sugarSpread, x, yy, r, t), { p: seg(p, 0.24, 0.4) });
          Art.zoom(g, 502, y, 502, y, R, (gg, x, yy, r) => drawPic(gg, saltLattice, x, yy, r, t), { p: seg(p, 0.42, 0.58) });
          Art.arrow(g, 596, y, 614, y, { color: C.ink, w: 6, p: seg(p, 0.58, 0.66), head: 14 });
          Art.zoom(g, 704, y, 704, y, R, (gg, x, yy, r) => drawPic(gg, saltIons, x, yy, r, t), { p: seg(p, 0.62, 0.76) });
          Art.text(g, 'Each sugar molecule', 196, 290, { size: 25, alpha: seg(p, 0.3, 0.45) });
          Art.text(g, 'is still whole', 196, 322, { size: 25, alpha: seg(p, 0.3, 0.45) });
          Art.text(g, 'Dry it out and the', 604, 290, { size: 25, alpha: seg(p, 0.7, 0.82) });
          Art.text(g, 'same salt comes back', 604, 322, { size: 25, alpha: seg(p, 0.7, 0.82) });
          badge(g, 'Dissolving counts as a physical change', C.leaf, 392, seg(p, 0.82, 0.96));
        },
      },
      {
        say: 'Burning. Now the atoms really do change partners. Methane and oxygen are gone. Carbon dioxide and water are new substances. Count the atoms: none lost, all rearranged. This is a <b>chemical change</b>.',
        dur: 4.6,
        draw(g, p, t, { W }) {
          const q = ease.inOut(seg(p, 0.15, 0.72)), mid = 1 - Math.abs(q * 2 - 1);
          const pos = BURNA.map((a, i) => ({
            x: lerp(a.a[0], a.b[0], q) + wander(i * 3, t) * (2 + mid * 8) + Math.sin(q * TAU + i) * mid * 40,
            y: lerp(a.a[1], a.b[1], q) + wander(i * 3 + 40, t) * (2 + mid * 8) + Math.cos(q * TAU + i * 2) * mid * 40,
          }));
          const bonds = (list, al) => { if (al <= 0) return; g.save(); g.globalAlpha *= al; list.forEach(([i, j, o]) => Art.bond(g, pos[i].x, pos[i].y, pos[j].x, pos[j].y, { order: o, width: 8 })); g.restore(); };
          bonds(BA, clamp(1 - q * 4)); bonds(AA, clamp((q - 0.72) * 3.6));
          if (mid > 0.05) Art.glow(g, 400, 190, 320, C.fire, 0.75 * mid);
          BURNA.forEach((a, i) => Art.atom(g, pos[i].x, pos[i].y, a.r, a.s, { face: a.s === 'C' || a.s === 'O' ? (mid > 0.25 ? 'wow' : 'happy') : 'happy', t, seed: i, look: [0, 0] }));
          const b4 = 1 - seg(p, 0.1, 0.2), af = seg(p, 0.72, 0.84);
          Art.text(g, 'methane', 190, 318, { size: 27, alpha: b4 });
          Art.text(g, 'oxygen', 560, 180, { size: 27, alpha: b4 });
          Art.text(g, 'carbon dioxide', 400, 158, { size: 27, color: C.cyan, alpha: af });
          Art.text(g, 'water', 188, 378, { size: 27, color: C.cyan, alpha: af });
          Art.text(g, 'water', 612, 378, { size: 27, color: C.cyan, alpha: af });
          Art.formula(g, 'CH4 + 2O2 -> CO2 + 2H2O', W / 2, 372, { size: 28, colorize: true });
          badge(g, 'New substances: chemical change', C.pink, 420, seg(p, 0.8, 0.95));
        },
      },
      {
        say: 'Without a particle view, watch for clues: a gas forms, the color changes, a solid appears, heat or light comes out, a new smell. <b>They are clues, not proof.</b> Boiling makes bubbles too.',
        dur: 4.2,
        draw(g, p, t) {
          const cols = [84, 242, 400, 558, 716], top = 70;
          const a = (i) => seg(p, 0.05 + i * 0.13, 0.2 + i * 0.13);
          Art.popIn(g, cols[0], 150, a(0), (gg) => iconTube(gg, 0, -80, { level: 0.6, liquid: '#BDE8FF', inside: (g2, b) => Art.bubbles(g2, b.x0 + 5, b.x1 - 5, b.bottom - 4, b.top + 2, t, { n: 7, r: 4.5 }) }));
          const colorMix = 0.5 - 0.5 * Math.cos(t * 0.9);
          Art.popIn(g, cols[1], 150, a(1), (gg) => iconTube(gg, 0, -80, { level: 0.7, liquid: Art.mix('#E8F6FF', '#2B6BE0', colorMix) }));
          Art.popIn(g, cols[2], 150, a(2), (gg) => iconTube(gg, 0, -80, { level: 0.7, liquid: '#C9E8FF', inside: (g2, b) => {
            g2.fillStyle = '#F7F4EA';
            for (let i = 0; i < 26; i++) {
              const ph = (t * 0.28 + rand(i)) % 1, x = b.x0 + 4 + rand(i + 5) * 46, y = lerp(b.top + 2, b.bottom - 8, Math.min(1, ph * 1.2));
              g2.beginPath(); g2.arc(x, y, 2.6, 0, TAU); g2.fill();
            }
            g2.beginPath(); g2.ellipse(0, b.bottom - 4, 26, 14, 0, 0, TAU); g2.fill();
          } }));
          Art.popIn(g, cols[3], 150, a(3), (gg) => {
            Art.flame(gg, 0, 50, 112, t, { kind: 'orange' });
            gg.fillStyle = '#5B3A22'; Art.round(gg, -34, 46, 68, 10, 4); gg.fill();
          });
          Art.popIn(g, cols[4], 150, a(4), (gg) => {
            iconTube(gg, 0, -40, { level: 0.55, liquid: '#D8E8A8' });
            Art.smoke(gg, 0, -40, t, { n: 7, h: 72, r: 8, alpha: 0.5, color: '#B6E36A', spread: 22 });
          });
          [['a gas', 'forms'], ['the color', 'changes'], ['a solid', 'appears'], ['heat or', 'light'], ['a new', 'smell']].forEach(([x, y], i) => {
            Art.text(g, x, cols[i], 262, { size: 25, alpha: a(i) });
            Art.text(g, y, cols[i], 294, { size: 25, alpha: a(i) });
          });
          void top;
          const b = seg(p, 0.78, 0.94);
          if (b > 0) {
            g.fillStyle = Art.alpha(C.plum2, b); Art.round(g, 96, 340, 608, 80, 22); g.fill();
            Art.text(g, 'Clues, not proof', 400, 364, { font: 'display', size: 30, color: C.sun, alpha: b });
            Art.text(g, 'New substances are the real test.', 400, 398, { size: 25, alpha: b });
          }
        },
      },
    ],
  });

  /* ---------- Bench: the change sorter ---------- */
  const rust = { f: 'rust' };
  const CHANGES = [
    { text: 'Ice melts', phys: true, eq: 'H2O(s) -> H2O(l)', a: ICE, b: LIQUID, why: 'Same $\\ce{H2O}$ molecules, just out of their rows.' },
    { text: 'Water boils', phys: true, eq: 'H2O(l) -> H2O(g)', a: LIQUID, b: { amp: 10, items: spread([['H2O', 5, { s: 210 }]], 132, 5) }, why: 'Molecules fly apart from each other but stay whole. The bubbles are water vapor.' },
    { text: 'Sugar dissolves in tea', phys: true, eq: 'C12H22O11(s) -> C12H22O11(aq)', a: { amp: 1, items: grid('sugar', 3, 3, 88, 68, { s: 1.04, rot: 0.1 }) }, b: { amp: 6, items: spread([['sugar', 3], ['H2O', 7, { s: 190 }]], 132, 4) }, why: 'Sugar molecules spread out among the water molecules. Each one is still whole.' },
    { text: 'Salt dissolves in water', phys: true, eq: 'NaCl(s) -> Na^+(aq) + Cl^-(aq)', a: latticePic('Na', 'Cl', 30, 60, 5), b: { amp: 6, items: spread([['Na', 3, { ion: '+', r: 24 }], ['Cl', 3, { ion: '-', r: 31 }], ['H2O', 6, { s: 190 }]], 132, 8) }, why: 'The ions separate, but no new substance forms. Evaporate the water and you get the same salt back.' },
    { text: 'Dry ice turns into gas', phys: true, eq: 'CO2(s) -> CO2(g)', a: { amp: 1.2, items: grid('CO2', 3, 5, 92, 54, { s: 22, rot: 0 }) }, b: { amp: 10, items: spread([['CO2', 5, { s: 22 }]], 132, 6) }, why: 'Solid straight to gas, and every particle is still whole $\\ce{CO2}$.' },
    { text: 'A copper wire is cut in two', phys: true, eq: 'Cu(s) -> Cu(s)', a: latticePic('Cu', null, 26, 54, 1), b: { amp: 1.2, items: latticePic('Cu', null, 26, 54, 1).items.map((it) => Object.assign({}, it, { x: it.x + (it.x < 0 ? -18 : 18) })) }, why: 'Still copper atoms, in two pieces. A change of shape never changes the substance.' },
    { text: 'Water vapor fogs a cold window', phys: true, eq: 'H2O(g) -> H2O(l)', a: { amp: 10, items: spread([['H2O', 5, { s: 210 }]], 132, 5) }, b: LIQUID, why: 'Gas becoming liquid. Whole molecules move closer together.' },
    { text: 'Methane burns', phys: false, eq: 'CH4 + 2O2 -> CO2 + 2H2O', a: { amp: 4, items: spread([['CH4', 2, { s: 22 }], ['O2', 4, { s: 26 }]], 128, 7) }, b: { amp: 4, items: spread([['CO2', 2, { s: 20 }], ['H2O', 4, { s: 190 }]], 128, 8) }, why: 'C and H atoms leave methane and bond to oxygen. Carbon dioxide and water are new.' },
    { text: 'Hydrogen burns', phys: false, eq: '2H2 + O2 -> 2H2O', a: { amp: 4, items: spread([['H2', 4, { s: 32 }], ['O2', 2, { s: 26 }]], 118, 9) }, b: { amp: 4, items: spread([['H2O', 4, { s: 240 }]], 110, 10) }, why: 'H and O atoms bond to each other. Water is a new substance.' },
    { text: 'Electric current splits water', phys: false, eq: '2H2O -> 2H2 + O2', a: { amp: 4, items: spread([['H2O', 4, { s: 240 }]], 110, 10) }, b: { amp: 4, items: spread([['H2', 4, { s: 32 }], ['O2', 2, { s: 26 }]], 118, 9) }, why: 'This time the bonds inside water really do break. Compare it with boiling.' },
    { text: 'An iron nail rusts', phys: false, eq: '4Fe + 3O2 -> 2Fe2O3', a: { amp: 2.4, items: [...latticePic('Fe', null, 24, 50, 2).items.filter((it) => it.y > 8), ...spread([['O2', 3]], 90, 3).map((it) => Object.assign(it, { y: it.y * 0.42 - 92, x: it.x * 1.15 }))] }, b: { amp: 1.2, items: hexSpots(52, 170).map(([x, y], i) => (i * 3) % 5 < 2 ? { f: 'Fe', x, y, r: 21, seed: i } : { f: 'O', x, y, r: 23, seed: i }) }, why: 'Iron atoms bond to oxygen atoms, 2 iron for every 3 oxygen. Rust is a new substance, and it even looks different.' },
    { text: 'Magnesium burns', phys: false, eq: '2Mg + O2 -> 2MgO', a: { amp: 2.4, items: [...latticePic('Mg', null, 24, 50, 2).items.filter((it) => it.y > 8), ...spread([['O2', 3]], 90, 5).map((it) => Object.assign(it, { y: it.y * 0.42 - 92, x: it.x * 1.15 }))] }, b: latticePic('Mg', 'O', 28, 56, 4), why: 'Magnesium and oxygen form magnesium oxide, a white powder with a blinding flash.' },
    { text: 'Carbon burns in oxygen', phys: false, eq: 'C + O2 -> CO2', a: { amp: 2.4, items: [...latticePic('C', null, 24, 50, 2).items.filter((it) => it.y > 8), ...spread([['O2', 3]], 90, 7).map((it) => Object.assign(it, { y: it.y * 0.42 - 92, x: it.x * 1.15 }))] }, b: { amp: 5, items: spread([['CO2', 6, { s: 20 }]], 128, 11) }, why: 'Carbon atoms bond to oxygen atoms. Carbon dioxide is new.' },
  ];
  void rust;
  const SO = { order: [], i: 0, score: 0, answered: null, t0: 0, done: false, dx: 0, dy: 0, drag: false, flyFrom: null };
  const BIN = { phys: { x: 22, y: 338, w: 372, h: 100 }, chem: { x: 406, y: 338, w: 372, h: 100 } };
  const inBin = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  function newSort() {
    const phys = CHANGES.filter((c) => c.phys).map((c) => [Math.random(), c]).sort((a, b) => a[0] - b[0]).map((e) => e[1]).slice(0, 5);
    const chem = CHANGES.filter((c) => !c.phys).map((c) => [Math.random(), c]).sort((a, b) => a[0] - b[0]).map((e) => e[1]).slice(0, 5);
    SO.order = [...phys, ...chem].map((c) => [Math.random(), c]).sort((a, b) => a[0] - b[0]).map((e) => e[1]);
    SO.i = 0; SO.score = 0; SO.answered = null; SO.done = false; SO.dx = SO.dy = 0;
    Lab.$('#so-next').disabled = true; Lab.$('#so-next').textContent = 'Next change';
  }
  function answerSort(isPhys) {
    if (SO.answered !== null || SO.done) return;
    const it = SO.order[SO.i], right = isPhys === it.phys;
    SO.answered = isPhys; SO.t0 = soStage.t;
    if (right) { SO.score++; Lab.sound.good(); } else Lab.sound.bad();
    Lab.$('#so-foot').innerHTML = Lab.texString(`<p><b>${right ? 'Right.' : (it.phys ? 'This one is physical.' : 'This one is chemical.')}</b> ${it.why}</p>`);
    const n = Lab.$('#so-next'); n.disabled = false;
    n.textContent = SO.i === SO.order.length - 1 ? 'See your score' : 'Next change';
  }
  function drawBin(g, b, title, sub, state, t) {
    const hot = state === 'good' ? C.leaf : state === 'bad' ? C.red : null;
    g.fillStyle = hot ? Art.alpha(hot, 0.26) : 'rgba(255,255,255,.07)';
    g.strokeStyle = hot || 'rgba(255,255,255,.4)'; g.lineWidth = hot ? 5 : 3;
    g.setLineDash(hot ? [] : [10, 8]);
    Art.round(g, b.x, b.y, b.w, b.h, 18); g.fill(); g.stroke();
    g.setLineDash([]);
    Art.text(g, title, b.x + b.w / 2, b.y + 36, { font: 'display', size: 32 });
    Art.text(g, sub, b.x + b.w / 2, b.y + 72, { size: 24, color: C.dim });
    void t;
  }
  newSort();
  const soStage = Lab.stage('#c-sorter', {
    drag: true,
    label: 'A card describing a change, particle pictures from before and after, and two bins for physical and chemical changes.',
    onPointer(e) {
      if (SO.done || SO.answered !== null) return;
      const cardHit = Math.abs(e.x - (400 + SO.dx)) < 240 && Math.abs(e.y - (46 + SO.dy)) < 38;
      if (e.type === 'down') {
        if (cardHit) { SO.drag = true; SO.gx = e.x - SO.dx; SO.gy = e.y - SO.dy; }
        else if (inBin(BIN.phys, e.x, e.y)) answerSort(true);
        else if (inBin(BIN.chem, e.x, e.y)) answerSort(false);
      } else if (e.type === 'move' && SO.drag) {
        SO.dx = e.x - SO.gx; SO.dy = e.y - SO.gy;
      } else if (e.type === 'up' && SO.drag) {
        SO.drag = false;
        if (inBin(BIN.phys, e.x, e.y)) answerSort(true);
        else if (inBin(BIN.chem, e.x, e.y)) answerSort(false);
        else { SO.dx = 0; SO.dy = 0; }
      }
    },
    draw(g, t) {
      if (SO.done) {
        Art.text(g, `${SO.score} of ${SO.order.length}`, 400, 110, { font: 'display', size: 76, color: SO.score >= 8 ? C.leaf : C.sun });
        Art.text(g, SO.score >= 8 ? 'You can spot a new substance a mile away.' : 'Picture the particles first, then choose.', 400, 186, { size: 27 });
        Art.moe(g, 400, 430, 200, SO.score >= 8 ? 'cheer' : 'think', { t });
        return;
      }
      const it = SO.order[SO.i], ans = SO.answered;
      const since = t - SO.t0;
      const R = 94, cy = 186, xa = 196, xb = 604;
      Art.zoom(g, xa, cy, xa, cy, R, (gg, x, y, r) => drawPic(gg, it.a, x, y, r, t), { rim: C.cyan });
      Art.text(g, 'Before', xa - R - 14, cy, { size: 24, align: 'right', color: C.dim });
      Art.text(g, 'After', xb + R + 14, cy, { size: 24, align: 'left', color: C.dim });
      const showB = ans !== null ? clamp(since * 2.4) : 0;
      if (showB > 0) {
        Art.zoom(g, xb, cy, xb, cy, R, (gg, x, y, r) => drawPic(gg, it.b, x, y, r, t), { p: showB, rim: it.phys ? C.leaf : C.pink });
        Art.arrow(g, 306, cy, 494, cy, { color: C.ink, w: 7, p: showB });
        Art.text(g, it.phys ? 'same particles' : 'new particles', 400, cy - 30, { size: 25, color: it.phys ? C.leaf : C.pink, alpha: showB });
        Art.formula(g, it.eq, 400, 310, { size: 27, colorize: true, halo: true });
      } else {
        g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 4; g.setLineDash([10, 9]);
        g.beginPath(); g.arc(xb, cy, R, 0, TAU); g.stroke(); g.setLineDash([]);
        Art.text(g, '?', xb, cy + 2, { font: 'display', size: 84, color: C.dim });
        Art.arrow(g, 306, cy, 494, cy, { color: 'rgba(247,242,255,.4)', w: 7 });
      }
      const stPhys = ans === null ? null : it.phys ? 'good' : ans === true ? 'bad' : null;
      const stChem = ans === null ? null : !it.phys ? 'good' : ans === false ? 'bad' : null;
      drawBin(g, BIN.phys, 'Physical change', 'same particles', stPhys, t);
      drawBin(g, BIN.chem, 'Chemical change', 'new particles', stChem, t);
      // The card, which can be dragged. Once answered it settles into the bin chosen.
      let cx = 400 + SO.dx, cyC = 46 + SO.dy;
      if (ans !== null) {
        const q = ease.out(clamp(since * 2.2));
        cx = lerp(400 + SO.dx, 400, q); cyC = lerp(46 + SO.dy, 46, q);
      }
      g.fillStyle = '#FFFDF2'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      Art.round(g, cx - 250, cyC - 34, 500, 68, 16); g.fill(); g.stroke();
      Art.text(g, it.text, cx, cyC + 1, { font: 'display', size: 33, color: '#22123A' });
      Art.text(g, `${SO.i + 1} of ${SO.order.length}`, 790, 30, { size: 22, align: 'right', color: C.dim });
      Art.text(g, `Right: ${SO.score}`, 14, 30, { size: 24, align: 'left', color: C.sun });
    },
  });
  Lab.$('#so-next').addEventListener('click', () => {
    if (SO.done) { newSort(); Lab.$('#so-foot').innerHTML = '<p>Before you choose, imagine the particles. The right side of the picture stays hidden until you answer.</p>'; soStage.redraw(); return; }
    if (SO.i >= SO.order.length - 1) {
      SO.done = true;
      Lab.$('#so-next').textContent = 'Play again';
      if (SO.score >= 8) { Lab.collection.award(1); Lab.confetti(); }
      Lab.$('#so-foot').innerHTML = '<p>The test is always the same: same particles, or new ones?</p>';
    } else {
      SO.i++; SO.answered = null; SO.dx = SO.dy = 0;
      Lab.$('#so-next').disabled = true;
      Lab.$('#so-foot').innerHTML = '<p>Before you choose, imagine the particles. The right side of the picture stays hidden until you answer.</p>';
    }
    soStage.redraw();
  });

  /* ---------- Bench: intensive versus extensive ---------- */
  const GO = { f: 1, shown: 1, cut: 0 };
  const AU_D = EL.Au.density, AU_MP = EL.Au.mp - 273.15, MASS0 = 1000;
  const goStage = Lab.stage('#c-gold', {
    bg: 'lab',
    label: 'A gold bar that gets shorter as you cut it, with meters showing mass and volume shrinking while density and melting point stay fixed.',
    draw(g, t, dt) {
      GO.shown = lerp(GO.shown, GO.f, clamp(dt * 9) || (dt === 0 ? 1 : 0));
      const f = GO.shown;
      /* The bar: true to scale, shorter as you keep less. */
      const y = 300, h = 74, d = 26, full = 300, x0 = 26, len = full * f;
      const barFront = g.createLinearGradient(0, y - h, 0, y);
      barFront.addColorStop(0, '#FFE680'); barFront.addColorStop(0.5, '#FFC83D'); barFront.addColorStop(1, '#C48B12');
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2.5; g.setLineDash([8, 7]);
      g.strokeRect(x0, y - h, full, h); g.setLineDash([]);
      g.fillStyle = '#E2A81E'; g.beginPath(); g.moveTo(x0 + len, y - h); g.lineTo(x0 + len + d, y - h - d * 0.55); g.lineTo(x0 + len + d, y - d * 0.55); g.lineTo(x0 + len, y); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#FFF0A6'; g.strokeStyle = '#1A0F2E'; g.beginPath(); g.moveTo(x0, y - h); g.lineTo(x0 + d, y - h - d * 0.55); g.lineTo(x0 + len + d, y - h - d * 0.55); g.lineTo(x0 + len, y - h); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = barFront; g.fillRect(x0, y - h, len, h); g.strokeRect(x0, y - h, len, h);
      g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x0 + 8, y - h + 10, Math.max(0, len - 16), 8);
      Art.zoom(g, x0 + Math.min(len * 0.5, 80), y - h + 10, 160, 110, 92, (gg, x, yy, r) => {
        for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
          const ax = x + (i + (j % 2 ? 0.5 : 0)) * 46 + wander(i * 3 + j, t) * 1.4, ay = yy + j * 40 + wander(i + j * 5, t) * 1.4;
          if (Math.hypot(ax - x, ay - yy) < r + 16) Art.atom(gg, ax, ay, 21, 'Au', { label: false, face: i === 0 && j === 0 ? 'happy' : null, t });
        }
      });
      Art.text(g, 'Same atoms in', 160, 332, { size: 24, halo: true });
      Art.text(g, 'every piece', 160, 362, { size: 24, halo: true });
      /* The property rows. */
      const rows = [
        { name: 'Mass', val: Lab.fmt(MASS0 * f, 0) + ' g', frac: f, ext: true },
        { name: 'Volume', val: Lab.fmt((MASS0 * f) / AU_D, 1) + ' mL', frac: f, ext: true },
        { name: 'Density', val: AU_D.toFixed(1) + ' g/mL', frac: 1, ext: false },
        { name: 'Melting point', val: Math.round(AU_MP).toLocaleString('en-US') + ' °C', frac: 1, ext: false },
      ];
      rows.forEach((r, i) => {
        const yy = 30 + i * 78;
        const col = r.ext ? C.pink : C.cyan;
        Art.text(g, r.name, 378, yy + 8, { size: 26, align: 'left' });
        Art.text(g, r.val, 780, yy + 8, { font: 'display', size: 30, align: 'right', color: col });
        Art.meter(g, 378, yy + 30, 402, 18, r.frac, { color: col });
      });
      Art.pill(g, 'Extensive: depends on how much', 580, 340, { size: 22, color: C.pink, text: '#fff' });
      Art.pill(g, 'Intensive: stays the same', 580, 374, { size: 22, color: C.cyan, text: '#06324A' });
    },
  });
  Lab.bind('#go-m', '#go-m-out', (v) => `${Lab.fmt(v * MASS0, 0)} g`, (v) => { GO.f = v; goStage.redraw(); });
});
