/* Lesson 5.4: Acids, bases and titration. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander } = Lab;
  const C = Art.C, TAU = Math.PI * 2;
  const CLEAR = '#CFEAF6';

  function F(g, f, x, y, o = {}) {
    const a = o.alpha === undefined ? 1 : o.alpha;
    if (a <= 0) return 0;
    g.save(); g.globalAlpha *= a;
    const w = Art.formula(g, f, x, y, Object.assign({ color: '#fff' }, o));
    g.restore();
    return w;
  }
  function badge(g, x, y, ch, r = 13) {
    g.fillStyle = /\+/.test(ch) ? '#FF3D7F' : '#1FA5FF';
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke();
    g.font = `700 ${r * 1.3}px ${Art.FONT_BODY}`;
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(ch.replace('-', '−'), x, y + 0.5);
  }

  function measure(g, f, size) {
    g.save(); g.globalAlpha = 0;
    const w = Art.formula(g, f, 0, -500, { size, align: 'left' });
    g.restore();
    return w;
  }
  /** Terms in a centered row, each measured so a strike-through lands on the right term. */
  function eqRow(g, terms, cx, y, size, alpha, strike) {
    const gap = size * 0.36;
    const widths = terms.map((t) => measure(g, t.t, size));
    const total = widths.reduce((a, b) => a + b, 0) + gap * (terms.length - 1);
    let x = cx - total / 2;
    terms.forEach((t, i) => {
      F(g, t.t, x, y, { size, align: 'left', alpha, color: t.color || '#fff' });
      if (t.spec && strike > 0) Art.strike(g, x - 4, y + size * 0.5, x + widths[i] + 4, y - size * 0.5, strike, C.red, 5);
      x += widths[i] + gap;
    });
  }

  /* ---------- A small molecule library. Coordinates are in bond lengths. ---------- */
  const RAD = { H: 0.3, O: 0.46, N: 0.46, C: 0.44, Cl: 0.56, Na: 0.5, F: 0.42, S: 0.55 };
  const MOL = {
    HCl: { a: [['Cl', 0, 0], ['H', 1, 0]], b: [[0, 1]], move: 1, f: 'HCl' },
    HNO3: { a: [['N', -0.6, 0], ['O', -1.15, -0.84], ['O', -1.15, 0.84], ['O', 0.32, 0], ['H', 1.2, 0]], b: [[0, 1, 2], [0, 2], [0, 3], [3, 4]], move: 4, f: 'HNO3', badge: [0.74, -0.34] },
    H2O_a: { a: [['O', 0, 0], ['H', -0.6, 0.8], ['H', 1, 0]], b: [[0, 1], [0, 2]], move: 2, f: 'H2O' },
    CH3COOH: { a: [['C', -1.1, 0], ['C', -0.12, 0], ['O', 0.36, -0.86], ['O', 0.66, 0.52], ['H', 1.52, 0.2], ['H', -1.6, -0.86], ['H', -1.6, 0.86], ['H', -2.1, 0]], b: [[0, 1], [1, 2, 2], [1, 3], [3, 4], [0, 5], [0, 6], [0, 7]], move: 4, f: 'CH3COOH', badge: [1.12, 0.12] },
    H3O: { a: [['O', 0, 0], ['H', -0.5, -0.86], ['H', -0.5, 0.86], ['H', 1, 0]], b: [[0, 1], [0, 2], [0, 3]], move: 3, f: 'H3O^+', z: '+' },
    H2O_b: { a: [['O', 0, 0], ['H', 0.6, -0.8], ['H', 0.6, 0.8]], b: [[0, 1], [0, 2]], catch: [-1, 0], f: 'H2O' },
    NH3_b: { a: [['N', 0, 0], ['H', 0.5, -0.86], ['H', 0.5, 0.86], ['H', 1, 0]], b: [[0, 1], [0, 2], [0, 3]], catch: [-1, 0], f: 'NH3' },
    OH_b: { a: [['O', 0, 0], ['H', 1, 0]], b: [[0, 1]], catch: [-1, 0], f: 'OH^-', z: '-' },
  };
  /** Draw a molecule. o.hide skips one atom. o.bondFade fades bonds to that atom. o.z shows a charge badge. */
  function drawMol(g, x, y, s, def, o = {}) {
    const pos = (i) => [x + def.a[i][1] * s, y + def.a[i][2] * s];
    const prev = g.globalAlpha;
    if (o.alpha !== undefined) g.globalAlpha = prev * o.alpha;
    def.b.forEach(([i, j, order]) => {
      if (i === o.hide || j === o.hide) {
        if (o.bondFade === undefined || o.bondFade <= 0) return;
        g.save(); g.globalAlpha *= o.bondFade;
      }
      const [x1, y1] = pos(i), [x2, y2] = pos(j);
      Art.bond(g, x1, y1, x2, y2, { order: order || 1, width: Math.max(3, s * 0.09) });
      if (i === o.hide || j === o.hide) g.restore();
    });
    def.a.forEach(([sym], i) => {
      if (i === o.hide) return;
      const [px, py] = pos(i);
      const isCenter = i === 0;
      Art.atom(g, px, py, (RAD[sym] || 0.4) * s, sym, { face: isCenter && o.face ? o.face : null, look: o.look, t: o.t, seed: i });
    });
    const z = o.z === undefined ? def.z : o.z;
    if (z) badge(g, x + (o.badgeX === undefined ? -0.38 : o.badgeX) * s, y + (o.badgeY === undefined ? -0.62 : o.badgeY) * s, z, Math.max(12, s * 0.2));
    g.globalAlpha = prev;
  }
  function lonePair(g, x, y, s) {
    Art.glow(g, x, y, s * 0.42, C.cyan, 0.4);
    [-0.13, 0.13].forEach((d) => Art.electron(g, x, y + d * s, Math.max(4.2, s * 0.08)));
  }
  /** The proton handoff. q runs 0 to 1. Everything is a pure function of q and t. */
  function transfer(g, acid, base, ax, ay, bx, by, s, q, t, o = {}) {
    const m = acid.a[acid.move];
    const sx = ax + m[1] * s, sy = ay + m[2] * s;
    const ex = bx + base.catch[0] * s, ey = by + base.catch[1] * s;
    const k = ease.inOut(q);
    const px = o.px !== undefined ? o.px : lerp(sx, ex, k);
    const py = o.py !== undefined ? o.py : lerp(sy, ey, k) - Math.sin(k * Math.PI) * s * 0.7;
    const done = q >= 0.98;
    // The base's new bond grows in as the proton lands.
    if (k > 0.8) Art.bond(g, bx, by, px, py, { width: Math.max(3, s * 0.09) });
    drawMol(g, ax, ay, s, acid, { hide: acid.move, bondFade: 1 - clamp(k * 2.4), face: o.acidFace || 'happy', look: [1, 0], t, z: k > 0.45 ? (acid.z === '+' ? null : '-') : acid.z, badgeX: acid.badge ? acid.badge[0] : 0.1, badgeY: acid.badge ? acid.badge[1] : undefined });
    drawMol(g, bx, by, s, base, { face: done ? 'grin' : (o.baseFace || 'happy'), look: [-1, 0], t, z: k > 0.8 ? (base.z === '-' ? null : '+') : base.z, badgeX: -0.44 });
    if (k < 0.82) lonePair(g, bx - s * 0.74, by, s);
    const flying = q > 0.02 && q < 0.98;
    if (flying) { Art.glow(g, px, py, s * 0.62, C.pink, 0.55); Art.proton(g, px, py, s * 0.26); }
    else Art.atom(g, px, py, RAD.H * s, 'H', { glow: q <= 0.02 ? (o.pulse === undefined ? 0.6 : o.pulse) : 0 });
    return [px, py];
  }

  /* ---------- Story 1: the proton changes hands ---------- */
  Lab.story('#story-proton', {
    title: 'Who has the proton?',
    scenes: [
      {
        say: 'A hydrogen atom is just one proton and one electron. Remove the electron and only the bare proton is left. So $\\ce{H+}$ and <b>proton</b> mean the same thing.',
        dur: 3.2,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.25, 0.65));
          const cx = 240, cy = 214;
          g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 3; g.setLineDash([8, 9]);
          g.beginPath(); g.arc(cx, cy, 118, 0, TAU); g.stroke(); g.setLineDash([]);
          const a = t * 1.6;
          const ex = lerp(cx + Math.cos(a) * 118, 668, q), ey = lerp(cy + Math.sin(a) * 118, 88, q);
          Art.electron(g, ex, ey, 15);
          Art.proton(g, cx, cy, 34);
          Art.text(g, 'hydrogen atom', cx, 384, { size: 30, alpha: 1 - q });
          Art.text(g, 'electron leaves', 660, 150, { size: 27, color: C.cyan, alpha: q });
          Art.arrow(g, 370, 130, 620, 82, { color: C.cyan, w: 5, p: seg(p, 0.3, 0.55), dash: [8, 8], alpha: 0.8 });
          const b = seg(p, 0.6, 0.8);
          Art.text(g, 'just a proton', cx, 384, { size: 30, color: C.pink, alpha: b, font: 'display' });
          F(g, 'H^+', cx, 318, { size: 54, alpha: b, color: C.sun });
          Art.moe(g, 650, 432, 170, 'point', { t, flip: true });
        },
      },
      {
        say: 'The first definition is from Arrhenius. An <b>acid</b> makes $\\ce{H+}$ when dissolved in water. A <b>base</b> makes $\\ce{OH-}$ when dissolved in water.',
        dur: 3.2,
        draw(g, p, t) {
          const draw = (cx, title, formula, ions) => {
            F(g, formula, cx, 44, { size: 38, alpha: seg(p, 0, 0.15) });
            Art.text(g, title, cx, 88, { font: 'display', size: 32, color: title === 'Acid' ? C.pink : C.cyan, alpha: seg(p, 0.05, 0.2) });
            Art.beaker(g, cx - 122, 428, 108, 116, { level: 0.72, liquid: CLEAR, ticks: false });
            Art.zoom(g, cx - 104, 356, cx + 58, 268, 124, (gg, zx, zy, R) => {
              ions.forEach(([kind, fx, fy], i) => {
                const x = zx + fx * R + wander(i + cx, t) * 7, y = zy + fy * R + wander(i + 9 + cx, t) * 7;
                const q = seg(p, 0.2 + i * 0.05, 0.5 + i * 0.05);
                if (kind === 'H') { Art.glow(gg, x, y, 30, C.pink, 0.5 * q); Art.proton(gg, x, y, 16); }
                else if (kind === 'Cl') Art.atom(gg, x, y, 28, 'Cl', { charge: '-', alpha: q, label: 'Cl' });
                else if (kind === 'Na') Art.atom(gg, x, y, 22, 'Na', { charge: '+', alpha: q });
                else {
                  Art.atom(gg, x + 18, y - 2, 12, 'H', { alpha: q, label: false });
                  Art.atom(gg, x, y, 24, 'O', { charge: '-', alpha: q, face: 'happy', t, seed: i, label: false });
                }
              });
            }, { p: seg(p, 0.1, 0.3) });
          };
          draw(214, 'Acid', 'HCl', [['H', -0.4, -0.48], ['Cl', 0.34, -0.42], ['H', 0.46, 0.34], ['Cl', -0.36, 0.42]]);
          draw(586, 'Base', 'NaOH', [['OH', -0.42, -0.46], ['Na', 0.4, -0.38], ['OH', 0.42, 0.38], ['Na', -0.4, 0.44]]);
        },
      },
      {
        say: 'Here is the truth about $\\ce{H+}$: it never floats around alone. It grabs a water molecule at once, making <b>hydronium</b>, $\\ce{H3O+}$. Chemists still write $\\ce{H+}$ as a shortcut.',
        dur: 4,
        draw(g, p, t) {
          const q = seg(p, 0.14, 0.72);
          transfer(g, MOL.HCl, MOL.H2O_b, 170, 190, 560, 190, 104, q, t);
          F(g, 'HCl', 170, 330, { size: 36, alpha: 1 - seg(p, 0.5, 0.65) });
          F(g, 'H2O', 590, 330, { size: 36, alpha: 1 - seg(p, 0.5, 0.65) });
          F(g, 'Cl^-', 170, 330, { size: 36, alpha: seg(p, 0.65, 0.8), color: C.sun });
          F(g, 'H3O^+', 590, 330, { size: 36, alpha: seg(p, 0.65, 0.8), color: C.sun });
          Art.text(g, 'hydronium', 590, 378, { size: 28, color: C.pink, alpha: seg(p, 0.72, 0.86), font: 'display' });
          Art.text(g, 'chloride', 170, 378, { size: 26, color: C.dim, alpha: seg(p, 0.72, 0.86) });
          Art.text(g, 'one proton moved', 372, 56, { size: 28, color: C.pink, alpha: seg(p, 0.3, 0.5) });
        },
      },
      {
        say: 'That hand-off gives a better definition, from Brønsted and Lowry. The giver of the proton is the <b>acid</b>. The taker is the <b>base</b>. The two new species are their <b>conjugates</b>.',
        dur: 3.6,
        draw(g, p, t) {
          const q = seg(p, 0, 0.1);
          transfer(g, MOL.HCl, MOL.H2O_b, 170, 170, 560, 170, 100, 1, t);
          const row = (x, y, f, role, color, a) => {
            F(g, f, x, y, { size: 34, alpha: a });
            Art.text(g, role, x, y + 42, { size: 26, color, alpha: a, font: 'display' });
          };
          row(120, 316, 'HCl', 'acid', C.pink, seg(p, 0.08, 0.22));
          row(310, 316, 'H2O', 'base', C.cyan, seg(p, 0.2, 0.34));
          F(g, '->', 412, 316, { size: 36, alpha: seg(p, 0.3, 0.42) });
          row(510, 316, 'Cl^-', 'conjugate base', C.cyan, seg(p, 0.42, 0.56));
          row(710, 316, 'H3O^+', 'conjugate acid', C.pink, seg(p, 0.54, 0.68));
          F(g, '+', 215, 316, { size: 34, color: C.dim, alpha: seg(p, 0.18, 0.3) });
          F(g, '+', 612, 316, { size: 34, color: C.dim, alpha: seg(p, 0.5, 0.62) });
          // Brackets joining each conjugate pair.
          const arc = (x1, x2, y, color, a) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a; g.strokeStyle = color; g.lineWidth = 4; g.lineCap = 'round';
            g.beginPath(); g.moveTo(x1, y); g.quadraticCurveTo((x1 + x2) / 2, y + 44, x2, y); g.stroke(); g.restore();
          };
          arc(120, 510, 386, C.pink, seg(p, 0.72, 0.86));
          arc(310, 710, 386, C.cyan, seg(p, 0.8, 0.94));
          void q;
        },
      },
      {
        say: 'Now $\\ce{NH3}$. It has no $\\ce{OH}$ in it, so Arrhenius cannot explain it. But its lone pair pulls a proton off water, leaving $\\ce{OH-}$ behind. Here, water is the <b>acid</b>. Water can play either role.',
        dur: 4,
        draw(g, p, t) {
          const q = seg(p, 0.16, 0.74);
          transfer(g, MOL.H2O_a, MOL.NH3_b, 170, 180, 560, 180, 104, q, t);
          F(g, 'H2O', 170, 320, { size: 36, alpha: 1 - seg(p, 0.56, 0.66) });
          F(g, 'NH3', 590, 320, { size: 36, alpha: 1 - seg(p, 0.56, 0.66) });
          F(g, 'OH^-', 170, 320, { size: 36, alpha: seg(p, 0.66, 0.8), color: C.sun });
          F(g, 'NH4^+', 590, 320, { size: 36, alpha: seg(p, 0.66, 0.8), color: C.sun });
          Art.text(g, 'water gave the proton', 170, 372, { size: 26, color: C.pink, alpha: seg(p, 0.7, 0.84) });
          Art.text(g, 'ammonia took it', 590, 372, { size: 26, color: C.cyan, alpha: seg(p, 0.76, 0.9) });
        },
      },
    ],
  });

  /* ---------- Bench: hand over the proton ---------- */
  const PAIRS = [
    { acid: MOL.HCl, base: MOL.H2O_b, an: 'HCl', bn: 'H2O', ca: 'Cl^-', cb: 'H3O^+', say: 'Hydrochloric acid is strong, so this goes essentially to completion. Water is the base here.', eq: '$\\ce{HCl(aq) + H2O(l) -> Cl-(aq) + H3O+(aq)}$' },
    { acid: MOL.HCl, base: MOL.NH3_b, an: 'HCl', bn: 'NH3', ca: 'Cl^-', cb: 'NH4^+', say: 'No water is needed. A proton moves and that is what makes it acid-base chemistry. This is why Brønsted-Lowry is broader than Arrhenius.', eq: '$\\ce{HCl + NH3 -> Cl- + NH4+}$' },
    { acid: MOL.H2O_a, base: MOL.NH3_b, an: 'H2O', bn: 'NH3', ca: 'OH^-', cb: 'NH4^+', say: 'Now water is the acid. Only a small fraction of ammonia reacts, so we use a double arrow and call ammonia a weak base.', eq: '$\\ce{H2O(l) + NH3(aq) <=> OH-(aq) + NH4+(aq)}$' },
    { acid: MOL.HNO3, base: MOL.H2O_b, ax: 196, s: 84, an: 'HNO3', bn: 'H2O', ca: 'NO3^-', cb: 'H3O^+', say: 'Nitric acid is one of the strong six. Notice that the rest of the molecule stays in one piece, as nitrate.', eq: '$\\ce{HNO3(aq) + H2O(l) -> NO3-(aq) + H3O+(aq)}$' },
    { acid: MOL.CH3COOH, base: MOL.H2O_b, ax: 196, s: 72, an: 'CH3COOH', bn: 'H2O', ca: 'CH3COO^-', cb: 'H3O^+', say: 'Only the H on oxygen can leave. The three H atoms on carbon stay put. Acetic acid is weak, so most molecules hang on to their proton at any moment.', eq: '$\\ce{CH3COOH(aq) + H2O(l) <=> CH3COO-(aq) + H3O+(aq)}$' },
    { acid: MOL.H3O, base: MOL.OH_b, an: 'H3O^+', bn: 'OH^-', ca: 'H2O', cb: 'H2O', say: 'This is the heart of neutralization. Hydronium gives its proton to hydroxide, and you get two water molecules.', eq: '$\\ce{H3O+(aq) + OH-(aq) -> 2H2O(l)}$' },
  ];
  const pr = { i: 0, q: 0, anim: 0, drag: false, px: null, py: null, t0: 0 };
  const AY = 170, BX = 590, BY = 170;
  const axOf = (P) => (P.ax || 196), sOf = (P) => (P.s || 92);
  const protonHome = (P) => { const m = P.acid.a[P.acid.move]; return [axOf(P) + m[1] * sOf(P), AY + m[2] * sOf(P)]; };
  const protonCatch = (P) => [BX + P.base.catch[0] * sOf(P), BY + P.base.catch[1] * sOf(P)];
  function paintProton() {
    const P = PAIRS[pr.i];
    Lab.$('#proton-say').innerHTML = pr.q >= 1 ? `<p>${Lab.texString(P.eq)}</p><p>${P.say}</p>` : '<p><b>Which one gives, and which one takes?</b> Move the proton and find out.</p>';
  }
  const protonStage = Lab.stage('#c-proton', {
    h: 400, drag: true, label: 'An acid molecule on the left with a glowing proton, and a base on the right with a lone pair. Drag the proton across.',
    onPointer(e) {
      const P = PAIRS[pr.i];
      const [hx, hy] = protonHome(P);
      if (e.type === 'hover') { protonStage.canvas.style.cursor = pr.q < 1 && Math.hypot(e.x - hx, e.y - hy) < 60 ? 'grab' : 'default'; return; }
      if (e.type === 'down' && pr.q === 0 && Math.hypot(e.x - hx, e.y - hy) < 70) { pr.drag = true; pr.px = e.x; pr.py = e.y; Lab.sound.pop(); }
      if (e.type === 'move' && pr.drag) { pr.px = e.x; pr.py = e.y; }
      if (e.type === 'up' && pr.drag) {
        pr.drag = false;
        const [cx, cy] = protonCatch(P);
        if (Math.hypot(pr.px - cx, pr.py - cy) < 80) { pr.q = 1; pr.t0 = protonStage.t; Lab.sound.good(); paintProton(); }
        pr.px = pr.py = null;
      }
    },
    draw(g, t, dt) {
      const P = PAIRS[pr.i];
      if (pr.anim > 0) {
        pr.q = Math.min(1, pr.q + dt / 1.3);
        if (pr.q >= 1 || Lab.reducedMotion) { pr.q = 1; pr.anim = 0; pr.t0 = t; Lab.sound.good(); paintProton(); }
      }
      let opts = {};
      if (pr.drag && pr.px !== null) {
        const hx = protonHome(P), cx = protonCatch(P);
        const k = clamp((pr.px - hx[0]) / (cx[0] - hx[0]));
        opts = { px: pr.px, py: pr.py, q: Math.max(0.05, Math.min(0.9, k)) };
      }
      const q = pr.drag ? opts.q : pr.q;
      transfer(g, P.acid, P.base, axOf(P), AY, BX, BY, sOf(P), q, t, { px: opts.px, py: opts.py, pulse: 0.55 + Math.sin(t * 4) * 0.4 });
      const done = pr.q >= 1 && !pr.drag;
      const a = done ? clamp((t - pr.t0) * 2.4) : 0;
      F(g, P.an, 196, 318, { size: 36, alpha: 1 - a });
      F(g, P.bn, BX, 318, { size: 36, alpha: 1 - a });
      Art.text(g, 'gives a proton', 196, 362, { size: 26, color: C.pink, alpha: 1 - a * 0.999, font: 'display' });
      Art.text(g, 'takes a proton', BX, 362, { size: 26, color: C.cyan, alpha: 1 - a * 0.999, font: 'display' });
      F(g, P.ca, 196, 318, { size: 36, alpha: a, color: C.sun });
      F(g, P.cb, BX, 318, { size: 36, alpha: a, color: C.sun });
      Art.text(g, 'conjugate base', 196, 362, { size: 26, color: C.cyan, alpha: a, font: 'display' });
      Art.text(g, 'conjugate acid', BX, 362, { size: 26, color: C.pink, alpha: a, font: 'display' });
      if (!done && !pr.drag && pr.anim === 0) {
        const [hx, hy] = protonHome(P), [cx, cy] = protonCatch(P);
        Art.arrow(g, hx + 26, hy - 34, cx - 30, cy - 34, { color: C.sun, w: 5, dash: [10, 11], curve: -44, alpha: 0.55 + Math.sin(t * 3) * 0.25 });
        Art.text(g, 'Drag me', (hx + cx) / 2, hy - 98, { size: 28, color: C.sun, font: 'display' });
      }
    },
  });
  function resetProton() { pr.q = 0; pr.anim = 0; pr.drag = false; pr.px = pr.py = null; paintProton(); protonStage.redraw(); }
  Lab.segmented('#proton-pick', (v) => { pr.i = +v; resetProton(); });
  Lab.$('#proton-go').addEventListener('click', () => { if (pr.q >= 1) return; if (Lab.reducedMotion) { pr.q = 1; paintProton(); protonStage.redraw(); return; } pr.anim = 1; });
  Lab.$('#proton-reset').addEventListener('click', resetProton);
  paintProton();

  /* ---------- Bench: strong or weak ---------- */
  const STRONG = {
    HCl: { kind: 'strong acid', splitFrac: 1, whole: ['H', 'Cl'], ionA: 'H3O', ionB: 'Cl', label: 'HCl', say: '<b>Strong acid.</b> Every HCl gives up its proton. All ions, and a bright bulb.' },
    HNO3: { kind: 'strong acid', splitFrac: 1, whole: ['H', 'N'], ionA: 'H3O', ionB: 'NO3', label: 'HNO3', say: '<b>Strong acid.</b> Every $\\ce{HNO3}$ gives up its proton. Nitrate stays in one piece.' },
    HF: { kind: 'weak acid', splitFrac: 0.17, whole: ['H', 'F'], ionA: 'H3O', ionB: 'F', label: 'HF', say: '<b>Weak acid.</b> It looks like HCl, but its bond to H is much stronger, so most molecules stay whole. At 0.1 M about 1 in 12 splits.' },
    CH3COOH: { kind: 'weak acid', splitFrac: 0.09, whole: ['H', 'C'], ionA: 'H3O', ionB: 'Ac', label: 'CH3COOH', say: '<b>Weak acid.</b> This is the acid in vinegar. At 0.1 M only about 1 in 75 molecules splits. The picture shows slightly more so you can see one.' },
    NaOH: { kind: 'strong base', splitFrac: 1, whole: ['Na', 'O'], ionA: 'Na', ionB: 'OH', label: 'NaOH', say: '<b>Strong base.</b> It is ionic, so in water it is entirely $\\ce{Na+}$ and $\\ce{OH-}$. A bright bulb.' },
    NH3: { kind: 'weak base', splitFrac: 0.09, whole: ['N', 'H'], ionA: 'NH4', ionB: 'OH', label: 'NH3', say: '<b>Weak base.</b> Only a small fraction takes a proton from water. At 0.1 M about 1 in 75 molecules reacts. The picture shows slightly more so you can see one.' },
  };
  const strong = { pick: 'HCl', n: 12, glow: 1 };
  function smallIon(g, id, x, y, r, t, seed) {
    if (id === 'H3O') {
      for (let k = 0; k < 3; k++) { const a = seed + t * 0.4 + (k * TAU) / 3; Art.ball(g, x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95, r * 0.46, Art.elementColor('H')); }
      Art.atom(g, x, y, r * 0.86, 'O', { charge: '+', label: false });
    } else if (id === 'OH') {
      Art.ball(g, x + r * 0.95, y - r * 0.2, r * 0.46, Art.elementColor('H'));
      Art.atom(g, x, y, r * 0.9, 'O', { charge: '-', label: false });
    } else if (id === 'NH4') {
      for (let k = 0; k < 4; k++) { const a = seed + t * 0.4 + (k * TAU) / 4; Art.ball(g, x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95, r * 0.42, Art.elementColor('H')); }
      Art.atom(g, x, y, r * 0.84, 'N', { charge: '+', label: false });
    } else if (id === 'NO3') {
      for (let k = 0; k < 3; k++) { const a = seed + (k * TAU) / 3; Art.ball(g, x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86, r * 0.54, Art.elementColor('O')); }
      Art.atom(g, x, y, r * 0.66, 'N', { charge: '-', label: false });
    } else if (id === 'Ac') {
      Art.ball(g, x - r, y, r * 0.66, Art.elementColor('C'));
      Art.ball(g, x + r * 0.7, y - r * 0.56, r * 0.54, Art.elementColor('O'));
      Art.ball(g, x + r * 0.7, y + r * 0.56, r * 0.54, Art.elementColor('O'));
      Art.atom(g, x, y, r * 0.66, 'C', { charge: '-', label: false });
    } else if (id === 'Na') Art.atom(g, x, y, r * 0.86, 'Na', { charge: '+' });
    else if (id === 'Cl') Art.atom(g, x, y, r * 1.1, 'Cl', { charge: '-' });
    else if (id === 'F') Art.atom(g, x, y, r * 0.96, 'F', { charge: '-' });
  }
  function wholeMol(g, id, x, y, r, rot) {
    const c = Math.cos(rot), s = Math.sin(rot);
    if (id === 'CH3COOH') {
      Art.ball(g, x - c * r, y - s * r, r * 0.66, Art.elementColor('C'));
      Art.ball(g, x + c * r * 0.7 - s * r * 0.56, y + s * r * 0.7 + c * r * 0.56, r * 0.5, Art.elementColor('O'));
      Art.ball(g, x + c * r * 0.7 + s * r * 0.56, y + s * r * 0.7 - c * r * 0.56, r * 0.5, Art.elementColor('O'));
      Art.ball(g, x, y, r * 0.66, Art.elementColor('C'));
      Art.ball(g, x + c * r * 1.3 + s * r * 0.7, y + s * r * 1.3 - c * r * 0.7, r * 0.32, Art.elementColor('H'));
    } else if (id === 'NH3') {
      for (let k = 0; k < 3; k++) { const a = rot + (k * TAU) / 3; Art.ball(g, x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, r * 0.42, Art.elementColor('H')); }
      Art.ball(g, x, y, r * 0.8, Art.elementColor('N'));
    } else {
      const sym = id === 'HF' ? 'F' : 'Cl';
      Art.ball(g, x + c * r * 0.9, y + s * r * 0.9, r * 0.46, Art.elementColor('H'));
      Art.ball(g, x, y, r * 0.86, Art.elementColor(sym));
    }
  }
  function paintStrong() {
    Lab.$('#strong-say').innerHTML = `<p>${Lab.texString(STRONG[strong.pick].say)}</p>`;
  }
  Lab.stage('#c-strong', {
    bg: 'lab', label: 'A beaker of solution wired to a light bulb. A magnifier shows either all ions or mostly whole molecules.',
    draw(g, t, dt) {
      const o = STRONG[strong.pick];
      const nIons = Math.max(o.splitFrac >= 1 ? strong.n : 1, Math.round(strong.n * o.splitFrac));
      const whole = o.splitFrac >= 1 ? 0 : strong.n - nIons;
      const target = clamp((nIons * 2) / 24) * (o.splitFrac >= 1 ? 1 : 0.8) + 0.02;
      strong.glow = lerp(strong.glow, target, clamp(dt * 5));
      // Circuit.
      const bx = 174, by = 104;
      g.strokeStyle = '#2B1A4A'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(120, 200); g.lineTo(120, 150); g.quadraticCurveTo(120, 130, bx - 16, by + 42); g.stroke();
      g.beginPath(); g.moveTo(228, 200); g.lineTo(228, 150); g.quadraticCurveTo(228, 130, bx + 16, by + 42); g.stroke();
      g.strokeStyle = '#E8B05A'; g.lineWidth = 3.4;
      g.beginPath(); g.moveTo(120, 200); g.lineTo(120, 150); g.quadraticCurveTo(120, 130, bx - 16, by + 42); g.stroke();
      g.beginPath(); g.moveTo(228, 200); g.lineTo(228, 150); g.quadraticCurveTo(228, 130, bx + 16, by + 42); g.stroke();
      Art.bulb(g, bx, by, 40, strong.glow);
      const box = Art.beaker(g, 174, 380, 240, 186, { level: 0.74, liquid: CLEAR, ticks: false });
      g.fillStyle = '#9A94B3'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
      Art.round(g, 112, 192, 16, 130, 4); g.fill(); g.stroke();
      Art.round(g, 220, 192, 16, 130, 4); g.fill(); g.stroke();
      Art.zoom(g, 256, box.surface + 60, 556, 196, 182, (gg, cx, cy, R) => {
        const total = nIons * 2 + whole;
        const r = total > 22 ? 17 : 20;
        const place = (i) => {
          const a = i * 2.39996, d = Math.sqrt((i + 0.5) / total) * R * 0.86;
          return [cx + Math.cos(a) * d + wander(i, t) * 6, cy + Math.sin(a) * d + wander(i + 30, t) * 6];
        };
        let k = 0;
        for (let i = 0; i < whole; i++, k++) { const [x, y] = place(k); wholeMol(gg, strong.pick === 'HCl' ? 'HCl' : strong.pick, x, y, r, t * 0.3 + i); }
        for (let i = 0; i < nIons; i++) {
          let [x, y] = place(k++); smallIon(gg, o.ionA, x, y, r, t, i);
          [x, y] = place(k++); smallIon(gg, o.ionB, x, y, r, t, i + 3);
        }
      });
      F(g, o.label, 174, 418, { size: 34, halo: true });
      Art.text(g, o.kind, 556, 418, { font: 'display', size: 32, color: o.kind.startsWith('strong') ? C.sun : C.cyan, halo: true });
    },
  });
  Lab.segmented('#strong-pick', (v) => { strong.pick = v; paintStrong(); });
  Lab.bind('#strong-n', '#strong-n-out', (v) => `${v} particles`, (v) => { strong.n = v; });
  paintStrong();

  /* ---------- Story 2: neutralization ---------- */
  // Four of each ion, so the picture counts correctly: 4 H3O+, 4 Cl-, 4 Na+, 4 OH-.
  const STARTS = [[-0.46, -0.36], [0.46, -0.36], [-0.46, 0.38], [0.46, 0.38]];
  const MEET = [[-0.36, -0.26], [0.36, -0.26], [-0.36, 0.3], [0.36, 0.3]];
  function neutral(g, cx, cy, R, p, t, o = {}) {
    const q = o.mix || 0;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.39;
      const x = cx + Math.cos(a) * R * 0.8 + wander(i + 9, t) * 4, y = cy + Math.sin(a) * R * 0.8 + wander(i + 19, t) * 4;
      if (i % 2) Art.atom(g, x, y, 24, 'Cl', { charge: '-', face: o.specFace ? 'sleepy' : null, t, seed: i });
      else Art.atom(g, x, y, 20, 'Na', { charge: '+', face: o.specFace ? 'sleepy' : null, t, seed: i });
    }
    for (let i = 0; i < 4; i++) {
      const raw = clamp(q * 1.5 - i * 0.14);
      const k = ease.inOut(raw);
      const mx = cx + MEET[i][0] * R, my = cy + MEET[i][1] * R;
      const hs = STARTS[i], os = STARTS[(i + 3) % 4];
      if (raw < 1) {
        smallIon(g, 'H3O', lerp(cx + hs[0] * R, mx - 18, k) + wander(i, t) * 3, lerp(cy + hs[1] * R, my, k) + wander(i + 7, t) * 3, 20, t, i);
        smallIon(g, 'OH', lerp(cx + os[0] * R * 0.6, mx + 18, k) + wander(i + 3, t) * 3, lerp(cy + os[1] * R * 0.6, my, k) + wander(i + 11, t) * 3, 20, t, i);
      } else {
        Art.glow(g, mx, my, 62, C.fire, 0.26 * (o.heat === undefined ? 1 : o.heat));
        Art.molecule(g, mx - 25, my, 21, 'H2O', { style: 'fill', atomScale: 1.28, labels: false, rot: t * 0.3 + i });
        Art.molecule(g, mx + 25, my, 21, 'H2O', { style: 'fill', atomScale: 1.28, labels: false, rot: t * 0.25 + i + 2 });
      }
    }
  }
  Lab.story('#story-neutral', {
    title: 'Acid meets base',
    scenes: [
      {
        say: 'Start with $\\ce{HCl}$ solution and $\\ce{NaOH}$ solution. The acid is full of hydronium and chloride. The base is full of sodium and hydroxide.',
        dur: 3,
        draw(g, p, t) {
          [[210, 'HCl(aq)', 'H3O', 'Cl', C.pink], [590, 'NaOH(aq)', 'Na', 'OH', C.cyan]].forEach(([x, f, a, b, col], k) => {
            F(g, f, x, 36, { size: 36, alpha: seg(p, 0, 0.2), color: col });
            Art.beaker(g, x, 438, 144, 86, { level: 0.72, liquid: CLEAR, ticks: false });
            Art.zoom(g, x, 372, x, 200, 150, (gg, cx, cy, R) => {
              [[-0.5, -0.44], [0.48, -0.46], [0, 0.02], [-0.5, 0.48], [0.5, 0.46], [0, -0.76]].forEach(([fx, fy], i) => {
                smallIon(gg, i % 2 ? b : a, cx + fx * R * 0.9 + wander(i + k * 7, t) * 6, cy + fy * R * 0.9 + wander(i + 9 + k * 7, t) * 6, 24, t, i);
              });
            }, { p: seg(p, 0.1, 0.5) });
          });
        },
      },
      {
        say: 'Pour them together. Every <b>hydronium</b> passes its proton to a <b>hydroxide</b>. Each pair becomes two water molecules, and that makes the solution warmer.',
        dur: 4.2,
        draw(g, p, t) {
          Art.beaker(g, 134, 410, 194, 214, { level: 0.74, liquid: CLEAR, ticks: false });
          Art.thermometer(g, 134, 140, 210, lerp(0.34, 0.56, seg(p, 0.2, 0.95)), { label: 'warmer' });
          Art.zoom(g, 180, 300, 520, 222, 206, (gg, cx, cy, R) => neutral(gg, cx, cy, R, p, t, { mix: seg(p, 0.08, 0.92) }), { p: 1 });
        },
      },
      {
        say: 'When the hydronium and hydroxide run out, only sodium and chloride are left, wandering in water. They never changed. They are spectators, and together they are the <b>salt</b>.',
        dur: 3.2,
        draw(g, p, t) {
          Art.beaker(g, 112, 436, 132, 124, { level: 0.74, liquid: CLEAR, ticks: false });
          Art.zoom(g, 140, 372, 436, 222, 208, (gg, cx, cy, R) => neutral(gg, cx, cy, R, p, t, { mix: 1, specFace: true, heat: 0 }), { p: 1 });
          Art.text(g, 'salt water', 112, 110, { font: 'display', size: 32, color: C.sun, alpha: seg(p, 0.2, 0.45) });
          Art.text(g, 'Na⁺ and Cl⁻', 112, 164, { size: 26, color: C.cyan, alpha: seg(p, 0.4, 0.6) });
          Art.text(g, 'just watch', 112, 196, { size: 26, color: C.cyan, alpha: seg(p, 0.4, 0.6) });
          Art.moe(g, 722, 432, 156, 'think', { t, flip: true });
        },
      },
      {
        say: 'Write it three ways, as with any ionic reaction. Cross out the spectators and all that is left is one line. It is the same line for <b>any</b> strong acid with any strong base, as long as the salt stays dissolved.',
        dur: 4.2,
        draw(g, p, t) {
          Art.text(g, 'Molecular', 400, 34, { size: 26, color: C.dim, alpha: seg(p, 0, 0.1) });
          F(g, 'HCl(aq) + NaOH(aq) -> NaCl(aq) + H2O(l)', 400, 76, { size: 31, alpha: seg(p, 0, 0.18) });
          Art.text(g, 'Complete ionic', 400, 136, { size: 26, color: C.dim, alpha: seg(p, 0.16, 0.26) });
          const a = seg(p, 0.16, 0.34), st = seg(p, 0.42, 0.68);
          eqRow(g, [{ t: 'H^+(aq)' }, { t: '+' }, { t: 'Cl^-(aq)', spec: 1 }, { t: '+' }, { t: 'Na^+(aq)', spec: 1 }, { t: '+' }, { t: 'OH^-(aq)' }], 400, 176, 28, a, st);
          eqRow(g, [{ t: '->' }, { t: 'Na^+(aq)', spec: 1 }, { t: '+' }, { t: 'Cl^-(aq)', spec: 1 }, { t: '+' }, { t: 'H2O(l)' }], 400, 224, 28, a, st);
          const b = seg(p, 0.68, 0.84);
          Art.text(g, 'Net ionic', 400, 288, { size: 26, color: C.sun, alpha: b });
          if (b > 0) { g.fillStyle = Art.alpha(C.plum2, b); Art.round(g, 150, 312, 500, 76, 24); g.fill(); }
          F(g, 'H^+(aq) + OH^-(aq) -> H2O(l)', 400, 350, { size: 36, alpha: b, color: C.sun });
          void t;
        },
      },
      {
        say: 'Now count protons. $\\ce{H2SO4}$ can give <b>two</b>, so it needs two $\\ce{OH-}$. That means two $\\ce{NaOH}$. Balancing a neutralization is just matching $\\ce{H+}$ to $\\ce{OH-}$ one for one.',
        dur: 3.8,
        draw(g, p, t) {
          F(g, 'H2SO4(aq) + 2NaOH(aq) -> Na2SO4(aq) + 2H2O(l)', 400, 46, { size: 29, color: C.sun, alpha: seg(p, 0, 0.14) });
          Art.text(g, 'H⁺ from the acid', 240, 118, { size: 27, color: C.pink, alpha: seg(p, 0.1, 0.25) });
          Art.text(g, 'OH⁻ from the base', 560, 118, { size: 27, color: C.cyan, alpha: seg(p, 0.2, 0.35) });
          const y = [190, 300];
          y.forEach((yy, i) => {
            const q = ease.inOut(seg(p, 0.4 + i * 0.16, 0.66 + i * 0.16));
            const pop = seg(p, 0.14 + i * 0.05, 0.3 + i * 0.05);
            if (q < 1) {
              Art.popIn(g, lerp(240, 372, q), yy, pop, (gg) => { Art.glow(gg, 0, 0, 46, C.pink, 0.5); Art.proton(gg, 0, 0, 26); });
              Art.popIn(g, lerp(560, 428, q), yy, seg(p, 0.24 + i * 0.05, 0.4 + i * 0.05), (gg) => smallIon(gg, 'OH', 0, 0, 34, t, i));
            } else {
              Art.molecule(g, 400, yy, 54, 'H2O', { style: 'fill', atomScale: 1.28, labels: false, face: 'grin', t });
            }
          });
          Art.text(g, '2 H⁺ + 2 OH⁻ make 2 H₂O', 400, 402, { font: 'display', size: 32, color: C.sun, alpha: seg(p, 0.86, 1) });
        },
      },
    ],
  });

  /* ---------- Bench: the titration simulator ----------
     A pH-free model: count moles of acid protons and of hydroxide. The equivalence point is where they
     match. Phenolphthalein stays clear until a slight excess of hydroxide, then deepens with the excess. */
  const ACIDS = {
    HCl: { f: 'HCl', name: 'HCl', H: 1, anion: 'Cl', eq: 'HCl(aq) + NaOH(aq) -> NaCl(aq) + H2O(l)', ratioText: '1 to 1' },
    H2SO4: { f: 'H2SO4', name: 'sulfuric acid', H: 2, anion: 'SO4', eq: 'H2SO4(aq) + 2NaOH(aq) -> Na2SO4(aq) + 2H2O(l)', ratioText: '1 to 2' },
    CH3COOH: { f: 'CH3COOH', name: 'acetic acid', H: 1, anion: 'Ac', weak: true, eq: 'CH3COOH(aq) + NaOH(aq) -> NaCH3COO(aq) + H2O(l)', ratioText: '1 to 1' },
  };
  const DROP = 0.05, RATES = [0, 0.15, 1.2, 4], RATE_NAMES = ['Closed', 'Slow', 'Medium', 'Fast'];
  const N0 = 8;
  const tit = { acid: 'HCl', Va: 25, Ma: 0.1, Mb: 0.1, mode: 'known', v: 0, rate: 0, drops: [], flash: 0, flashLife: 1, parts: [], flies: [], reacted: 0, naShown: 0, extraShown: 0, recorded: null, spawnT: 0, reveal: false };
  const moleH = () => tit.Ma * (tit.Va / 1000) * ACIDS[tit.acid].H;
  const Veq = () => (moleH() / tit.Mb) * 1000;
  const moleOH = () => (tit.v / 1000) * tit.Mb;
  const extraOH = () => Math.max(0, moleOH() - moleH());
  const leftH = () => Math.max(0, moleH() - moleOH());
  const totalL = () => (tit.Va + tit.v) / 1000;
  function pinkness() {
    const e = extraOH() / totalL();
    if (e <= 1e-7) return 0;
    return clamp((Math.log10(e) + 5.6) / 3.2);
  }
  function partBox() { return { cx: 600, cy: 140, R: 134 }; }
  function newPart(kind, x, y) {
    const a = Math.random() * TAU;
    return { kind, x, y, vx: Math.cos(a) * 22, vy: Math.sin(a) * 22, seed: Math.random() * 20, born: 0 };
  }
  function buildParts() {
    const { cx, cy, R } = partBox();
    const rnd = () => { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * (R - 26); return [cx + Math.cos(a) * d, cy + Math.sin(a) * d]; };
    tit.parts = []; tit.flies = []; tit.reacted = 0; tit.naShown = 0; tit.extraShown = 0;
    const A = ACIDS[tit.acid];
    for (let i = 0; i < N0; i++) { const [x, y] = rnd(); tit.parts.push(newPart('H', x, y)); }
    if (!A.weak) {
      const nA = A.H === 2 ? N0 / 2 : N0;
      for (let i = 0; i < nA; i++) { const [x, y] = rnd(); tit.parts.push(newPart(A.anion, x, y)); }
    }
  }
  /** Bring the particle picture in line with the moles. */
  function syncParts() {
    const { cx, cy, R } = partBox();
    const frac = tit.v / Veq();
    const wantReact = frac >= 1 ? N0 : Math.floor(frac * N0);
    while (tit.reacted < wantReact) {
      const targets = tit.parts.filter((p) => p.kind === 'H' && !p.claimed);
      if (!targets.length) break;
      const t = targets[Math.floor(Math.random() * targets.length)];
      t.claimed = true;
      tit.flies.push({ x: cx + (Math.random() - 0.5) * 60, y: cy - R + 12, target: t, u: 0 });
      tit.reacted++;
    }
    const wantNa = Math.min(12, Math.round(frac * N0));
    while (tit.naShown < wantNa) {
      tit.parts.push(newPart('Na', cx + (Math.random() - 0.5) * 80, cy - R + 26));
      tit.naShown++;
    }
    const wantExtra = frac > 1 ? Math.min(7, Math.ceil((frac - 1) * N0 * 2)) : 0;
    while (tit.extraShown < wantExtra) {
      tit.parts.push(newPart('OH', cx + (Math.random() - 0.5) * 80, cy - R + 26));
      tit.extraShown++;
    }
  }
  function addVolume(dv, showDrop = true) {
    tit.v += dv;
    if (showDrop) tit.drops.push({ y: 0, x: 0 });
    // A pink swirl where the drop lands. Near the end point it lingers, because it takes longer to use up.
    const f = clamp(tit.v / Veq());
    if (f < 1) { tit.flash = Math.max(tit.flash, 0.55 + 0.45 * f); tit.flashLife = 0.35 + 3.4 * Math.pow(f, 10); }
    syncParts();
    paintTit();
  }
  function stopcockSet(v) {
    tit.rate = RATES[v];
  }
  const fmtMol = (x) => (x <= 0 ? '0' : Lab.sig(x, 3) + ' mol');
  function paintTit() {
    const A = ACIDS[tit.acid], myst = tit.mode === 'mystery';
    Lab.$('#tit-v').textContent = tit.v.toFixed(2) + ' mL';
    Lab.$('#tit-noh').textContent = fmtMol(moleOH());
    Lab.$('#tit-nh').textContent = myst && !tit.reveal ? 'Unknown' : fmtMol(leftH());
    Lab.$('#tit-extra').textContent = myst && !tit.reveal ? 'Unknown' : fmtMol(extraOH());
    const say = Lab.$('#tit-say');
    if (tit.recorded === null) {
      say.innerHTML = myst
        ? Lab.texString(`<p>The flask holds ${tit.Va}.00 mL of $\\ce{${A.f}}$ with an unknown concentration, plus a little phenolphthalein. Add $\\ce{NaOH}$ until the first lasting pink, then press <b>Record this volume</b>.</p>`)
        : Lab.texString(`<p>Equation: $\\ce{${A.eq}}$. This takes exactly <b>${Lab.fmt(Veq(), 2)} mL</b> of base, so aim to go pink one drop past that. The model counts moles only. It leaves out pH, which comes later.</p>`);
    }
  }
  function paintRecord() {
    const A = ACIDS[tit.acid], V = tit.recorded;
    const nb = (V / 1000) * tit.Mb, na = nb / A.H, Ma = na / (tit.Va / 1000);
    const myst = tit.mode === 'mystery';
    const texN = (x) => {
      const e = Math.floor(Math.log10(x));
      return `${(x / Math.pow(10, e)).toFixed(3)} \\times 10^{${e}}`;
    };
    const lines = [
      `<b>Your end point: ${V.toFixed(2)} mL of ${tit.Mb.toFixed(3)} M NaOH.</b>`,
      `Moles of $\\ce{NaOH}$: $${(V / 1000).toFixed(5)}\\ \\cancel{\\text{L}} \\times ${tit.Mb.toFixed(3)}\\text{ mol}/\\cancel{\\text{L}} = ${texN(nb)}\\text{ mol}$`,
      `Mole ratio, acid to base, is ${A.ratioText}: moles of acid $= ${texN(na)}\\text{ mol}$`,
    ];
    if (myst && !tit.reveal) {
      lines.push(`Now you finish it: divide moles of acid by ${(tit.Va / 1000).toFixed(5)} L. Then enter the molarity.`);
      Lab.$('#tit-say').innerHTML = lines.map((l) => `<p style="margin:0 0 5px">${Lab.texString(l)}</p>`).join('') +
        `<form id="tit-form" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center"><label for="tit-ans" class="sr-only">Molarity of the acid</label><input id="tit-ans" type="text" inputmode="decimal" autocomplete="off" placeholder="Molarity" style="max-width:160px"><span>M</span><button class="btn small" type="submit">Check my answer</button></form><p id="tit-result" style="margin:7px 0 0"></p>`;
      Lab.$('#tit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const typed = Bank.parseNumber(Lab.$('#tit-ans').value);
        const res = Lab.$('#tit-result');
        if (!Number.isFinite(typed)) { res.textContent = 'Enter a number, like 0.125.'; return; }
        const mathOK = Math.abs(typed - Ma) / Ma < 0.015;
        const trueOK = Math.abs(typed - tit.Ma) / tit.Ma < 0.03;
        if (mathOK) {
          tit.reveal = true;
          res.innerHTML = `<b>${trueOK ? 'Correct!' : 'Your math is right, but you overshot.'}</b> The true concentration was ${tit.Ma.toFixed(3)} M, and the true equivalence point was ${Veq().toFixed(2)} mL. You stopped at ${V.toFixed(2)} mL.`;
          if (trueOK) { Lab.collection.award(1); Lab.confetti(50); }
          Lab.sound.good();
          paintTit();
        } else {
          res.innerHTML = `Not yet. Divide moles of acid by the volume in liters: $${texN(na)} \\div ${(tit.Va / 1000).toFixed(5)}$.`;
          res.innerHTML = Lab.texString(res.innerHTML);
          Lab.sound.bad();
        }
      });
    } else {
      lines.push(`Molarity of acid: $${texN(na)}\\text{ mol} \\div ${(tit.Va / 1000).toFixed(5)}\\text{ L} = ${Ma.toFixed(4)}\\text{ M}$`);
      const off = V - Veq();
      lines.push(Math.abs(off) <= DROP * 2.01 ? '<b>Right on target.</b> You stopped within two drops of the equivalence point.' : off > 0 ? `You went ${off.toFixed(2)} mL past the equivalence point, so this answer reads high. The real value is ${tit.Ma.toFixed(3)} M.` : `You stopped ${(-off).toFixed(2)} mL short of the equivalence point, so this answer reads low. The real value is ${tit.Ma.toFixed(3)} M.`);
      Lab.$('#tit-say').innerHTML = lines.map((l) => `<p style="margin:0 0 5px">${Lab.texString(l)}</p>`).join('');
    }
  }
  function drawStand(g) {
    g.fillStyle = '#6E6A86'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    Art.round(g, 40, 458, 260, 12, 5); g.fill(); g.stroke();
    Art.round(g, 66, 12, 10, 448, 4); g.fill(); g.stroke();
    Art.round(g, 70, 60, 92, 10, 4); g.fill(); g.stroke();
  }
  function drawGraph(g) {
    const x0 = 346, x1 = 776, y0 = 440, y1 = 322;
    const Ve = Veq(), maxV = Math.max(Ve * 1.5, tit.v * 1.08, 5);
    const X = (v) => lerp(x0, x1, v / maxV);
    const peak = Math.max(moleH(), maxV / 1000 * tit.Mb - moleH());
    const Y = (n) => lerp(y0, y1, n / peak);
    g.fillStyle = 'rgba(26,15,46,.75)'; Art.round(g, x0 - 16, y1 - 12, x1 - x0 + 30, y0 - y1 + 46, 12); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x0, y1 - 4); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
    const known = tit.mode === 'known' || tit.reveal;
    if (known) {
      g.strokeStyle = 'rgba(255,79,163,.35)'; g.lineWidth = 3; g.setLineDash([7, 7]);
      g.beginPath(); g.moveTo(X(0), Y(moleH())); g.lineTo(X(Ve), Y(0)); g.lineTo(X(maxV), Y(maxV / 1000 * tit.Mb - moleH())); g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(255,210,63,.75)'; g.lineWidth = 2; g.setLineDash([4, 6]);
      g.beginPath(); g.moveTo(X(Ve), y1); g.lineTo(X(Ve), y0); g.stroke(); g.setLineDash([]);
      Art.text(g, `${Ve.toFixed(1)} mL`, X(Ve), y0 + 19, { size: 21, color: C.sun });
    }
    // The learner's own trace so far.
    g.strokeStyle = C.pink; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(X(0), Y(known ? moleH() : moleH()));
    if (known) {
      const seen = Math.min(tit.v, Ve);
      g.lineTo(X(seen), Y(Math.max(0, moleH() - (seen / 1000) * tit.Mb)));
      if (tit.v > Ve) g.lineTo(X(tit.v), Y(extraOH()));
      g.stroke();
      const nowN = tit.v <= Ve ? leftH() : extraOH();
      Art.ball(g, X(tit.v), Y(nowN), 8, C.sun);
    }
    if (known) {
      Art.text(g, 'H⁺ left', x0 + 8, y1 + 8, { size: 22, color: '#FF8AC0', align: 'left' });
      Art.text(g, 'extra OH⁻', x1 - 2, y1 + 8, { size: 22, color: '#FF8AC0', align: 'right' });
    } else {
      Art.text(g, 'Graph hidden: this acid is a mystery', (x0 + x1) / 2, (y0 + y1) / 2, { size: 24, color: C.dim });
    }
    Art.text(g, 'mL of base', x0 + 8, y0 + 19, { size: 21, color: C.dim, align: 'left' });
  }
  const titStage = Lab.stage('#c-tit', {
    h: 480, bg: (g, W, H) => {
      const w = g.createLinearGradient(0, 0, 0, H);
      w.addColorStop(0, '#2C1B4D'); w.addColorStop(1, '#3E2A68');
      g.fillStyle = w; g.fillRect(0, 0, W, H);
    },
    label: 'A burette dripping sodium hydroxide into a flask of acid, with a magnifier on the ions and a graph of moles against volume.',
    draw(g, t, dt) {
      const A = ACIDS[tit.acid];
      const prevV = tit.v;
      if (tit.rate > 0) {
        tit.v += tit.rate * dt;
        tit.spawnT -= dt;
        if (tit.spawnT <= 0) { tit.drops.push({ y: 0, x: 0 }); tit.spawnT = tit.rate > 2 ? 0.08 : tit.rate > 1 ? 0.16 : 0.34; }
        const f = clamp(tit.v / Veq());
        if (f < 1) { tit.flash = Math.max(tit.flash, 0.5 + 0.5 * f); tit.flashLife = 0.35 + 3.4 * Math.pow(f, 10); }
        syncParts();
        if (Math.floor(tit.v * 4) !== Math.floor(prevV * 4)) paintTit();
      }
      tit.flash = Math.max(0, tit.flash - (dt / tit.flashLife));
      drawStand(g);
      // Burette: it reads 0 at the top and is refilled at 50 mL.
      const burLevel = 1 - ((tit.v % 50) / 50);
      const b = Art.burette(g, 170, 14, 30, 268, { level: burLevel, liquid: '#DCEAF6', open: tit.rate > 0 ? 1 : 0 });
      g.fillStyle = '#6E6A86'; g.fillRect(150, 56, 40, 14);
      // Flask, on a stir plate.
      g.fillStyle = '#B8B2CF'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      Art.round(g, 74, 432, 192, 26, 6); g.fill(); g.stroke();
      const pink = pinkness();
      const liquid = pink > 0 ? Art.mix('#F6DDEB', '#F0147F', pink) : CLEAR;
      const level = 0.5 + 0.42 * Math.min(1, tit.v / 60);
      const flask = Art.flask(g, 170, 432, 192, 134, {
        level, liquid,
        inside(gg, box) {
          if (tit.flash > 0 && pink < 0.1) {
            const fy = box.top + 30;
            for (let i = 0; i < 3; i++) Art.glow(gg, 170 + Math.sin(t * 2 + i) * 26, fy + i * 20, 54 * (0.7 + tit.flash), '#FF4FA3', 0.72 * tit.flash);
          }
          // Stir bar.
          const w = 26 * Math.abs(Math.cos(t * 7));
          gg.fillStyle = '#F4F0FF'; Art.round(gg, 170 - w - 3, box.bottom - 13, 2 * w + 6, 7, 3); gg.fill();
        },
      });
      // Drops.
      tit.drops.forEach((d) => {
        d.y += dt * 620 || 900;
        const y = b.tipY + d.y;
        if (y < flask.surface) {
          g.fillStyle = '#E4F0F8'; g.beginPath(); g.ellipse(170, y, 5.5, 8, 0, 0, TAU); g.fill();
          g.strokeStyle = 'rgba(26,15,46,.4)'; g.lineWidth = 1.2; g.stroke();
        } else d.dead = true;
      });
      tit.drops = tit.drops.filter((d) => !d.dead);

      // Big reading.
      Art.text(g, 'Base added', 326, 34, { size: 25, color: C.dim });
      Art.text(g, `${tit.v.toFixed(2)} mL`, 326, 78, { font: 'display', size: 44, color: C.sun });
      Art.text(g, `${tit.Mb.toFixed(3)} M NaOH`, 326, 122, { size: 25 });
      const isPink = pink > 0.06;
      Art.pill(g, isPink ? 'Pink: past the end' : 'Colorless so far', 326, 166, { size: 23, color: isPink ? C.pink : C.plum2, text: '#fff' });
      F(g, `${A.f}(aq)`, 326, 214, { size: 28 });
      Art.text(g, tit.mode === 'mystery' && !tit.reveal ? 'Molarity unknown' : `${tit.Ma.toFixed(3)} M`, 326, 250, { size: 25, color: C.dim });

      // Particle view.
      const { cx, cy, R } = partBox();
      Art.zoom(g, 196, 372, cx, cy, R, (gg) => {
        const sep = 40;
        const ps = tit.parts;
        for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i], c = ps[j]; const ex = c.x - a.x, ey = c.y - a.y, d = Math.hypot(ex, ey) || 1;
          if (d < sep) { const push = (sep - d) * clamp(dt * 3) / 2; a.x -= (ex / d) * push; a.y -= (ey / d) * push; c.x += (ex / d) * push; c.y += (ey / d) * push; }
        }
        ps.forEach((p) => {
          p.vx += (Math.random() - 0.5) * 70 * dt; p.vy += (Math.random() - 0.5) * 70 * dt;
          const sp = Math.hypot(p.vx, p.vy) || 1; if (sp > 34) { p.vx *= 34 / sp; p.vy *= 34 / sp; }
          p.x += p.vx * dt; p.y += p.vy * dt;
          const dx = p.x - cx, dy = p.y - cy, dd = Math.hypot(dx, dy), lim = R - 24;
          if (dd > lim) { p.x = cx + (dx / dd) * lim; p.y = cy + (dy / dd) * lim; p.vx -= (dx / dd) * 24; p.vy -= (dy / dd) * 24; }
        });
        // Water made so far, faint in the background.
        ps.filter((p) => p.kind === 'W').forEach((p, i) => Art.molecule(gg, p.x, p.y, 16, 'H2O', { style: 'fill', atomScale: 1.28, labels: false, rot: t * 0.4 + i, alpha: 0.75 }));
        ps.forEach((p) => {
          if (p.kind === 'W') return;
          if (p.kind === 'H') {
            if (A.weak) wholeMol(gg, 'CH3COOH', p.x, p.y, 16, p.seed + t * 0.3);
            else smallIon(gg, 'H3O', p.x, p.y, 17, t, p.seed);
          } else if (p.kind === 'OH') smallIon(gg, 'OH', p.x, p.y, 17, t, p.seed);
          else if (p.kind === 'Na') smallIon(gg, 'Na', p.x, p.y, 17, t, p.seed);
          else if (p.kind === 'Cl') smallIon(gg, 'Cl', p.x, p.y, 16, t, p.seed);
          else if (p.kind === 'SO4') {
            for (let k = 0; k < 4; k++) { const a = p.seed + (k * TAU) / 4; Art.ball(gg, p.x + Math.cos(a) * 15, p.y + Math.sin(a) * 15, 8.6, Art.elementColor('O')); }
            Art.atom(gg, p.x, p.y, 12, 'S', { charge: '2-', label: false });
          } else if (p.kind === 'Ac') smallIon(gg, 'Ac', p.x, p.y, 14, t, p.seed);
        });
        // Hydroxide flying in to take a proton.
        tit.flies.forEach((fl) => {
          fl.u += dt * 2.6;
          if (Lab.reducedMotion) fl.u = 1;
          const tx = fl.target.x, ty = fl.target.y, q = ease.inOut(clamp(fl.u));
          smallIon(gg, 'OH', lerp(fl.x, tx, q), lerp(fl.y, ty, q), 17, t, 1);
          if (fl.u >= 1) {
            fl.dead = true;
            tit.parts = tit.parts.filter((p) => p !== fl.target);
            const water = newPart('W', tx, ty);
            tit.parts.push(water);
            if (A.weak) tit.parts.push(newPart('Ac', tx + 16, ty));
            else if (tit.parts.filter((p) => p.kind === 'W').length < 14) tit.parts.push(newPart('W', tx + 18, ty));
          }
        });
        tit.flies = tit.flies.filter((f) => !f.dead);
      }, { p: 1 });
      drawGraph(g);
    },
  });

  function resetTit() {
    tit.v = 0; tit.drops = []; tit.flash = 0; tit.recorded = null; tit.reveal = false;
    Lab.$('#tit-rate').value = 0; Lab.paintRange(Lab.$('#tit-rate'));
    Lab.$('#tit-rate-out').textContent = RATE_NAMES[0];
    tit.rate = 0;
    if (tit.mode === 'mystery') {
      tit.Va = 25;
      tit.Ma = Math.round((0.06 + Math.random() * 0.1) * 1000) / 1000;
      if (ACIDS[tit.acid].H === 2) tit.Ma = Math.round(tit.Ma * 500) / 1000;
    } else {
      tit.Va = +Lab.$('#tit-va').value;
      tit.Ma = +Lab.$('#tit-ma').value;
    }
    Lab.$('#tit-ma-ctl').hidden = Lab.$('#tit-va-ctl').hidden = tit.mode === 'mystery';
    buildParts();
    paintTit();
  }
  Lab.segmented('#tit-mode', (v) => { tit.mode = v; resetTit(); });
  Lab.segmented('#tit-acid', (v) => { tit.acid = v; resetTit(); });
  Lab.segmented('#tit-mb', (v) => { tit.Mb = +v; resetTit(); });
  Lab.bind('#tit-va', '#tit-va-out', (v) => `${v}.00 mL`, (v) => { if (tit.mode === 'known') { tit.Va = v; if (tit.parts.length) resetTit(); } });
  Lab.bind('#tit-ma', '#tit-ma-out', (v) => `${v.toFixed(3)} M`, (v) => { if (tit.mode === 'known') { tit.Ma = v; if (tit.parts.length) resetTit(); } });
  Lab.bind('#tit-rate', '#tit-rate-out', (v) => RATE_NAMES[v], stopcockSet);
  Lab.$('#tit-drop').addEventListener('click', () => { addVolume(DROP); Lab.sound.pop(); titStage.redraw(); });
  Lab.$('#tit-ml').addEventListener('click', () => { addVolume(1); Lab.sound.pop(); titStage.redraw(); });
  Lab.$('#tit-reset').addEventListener('click', () => { resetTit(); titStage.redraw(); });
  Lab.$('#tit-record').addEventListener('click', () => {
    if (tit.v <= 0) { Lab.$('#tit-say').innerHTML = '<p>Add some base first.</p>'; return; }
    stopRate();
    tit.recorded = tit.v;
    paintRecord();
    Lab.sound.pop();
  });
  function stopRate() { tit.rate = 0; Lab.$('#tit-rate').value = 0; Lab.paintRange(Lab.$('#tit-rate')); Lab.$('#tit-rate-out').textContent = RATE_NAMES[0]; }
  resetTit();
});
