/* Lesson 4.1: Balancing equations. The balancer's scale weighs real atoms, so it tips and settles honestly. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const Chem = Bank.balancingChem;
  const TAU = Math.PI * 2;

  /* ---------- Equations on stage ---------- */
  function fw(g, f, size) { const a = g.globalAlpha; g.globalAlpha = 0; const w = Art.formula(g, f, -999, -999, { size }); g.globalAlpha = a; return w; }
  function eqRow(g, items, cx, y, size = 36) {
    const gap = size * 0.3, aw = size * 1.15;
    const parts = items.map((it) => {
      const obj = typeof it === 'string' ? { t: it } : it;
      if (obj.t === '->') return Object.assign({ w: aw, kind: 'arrow' }, obj);
      if (obj.t === '+') return Object.assign({ w: size * 0.6, kind: 'plus' }, obj);
      const m = /^(\d+)\s*([A-Z(].*)$/.exec(obj.t);
      const coef = m ? m[1] : '', f = m ? m[2] : obj.t;
      g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
      const cw = coef ? g.measureText(coef).width + size * 0.08 : 0;
      return Object.assign({ kind: 'term', coef, f, cw, w: cw + fw(g, f, size) }, obj);
    });
    let x = cx - (parts.reduce((s, p) => s + p.w, 0) + gap * (parts.length - 1)) / 2;
    const prev = g.globalAlpha;
    parts.forEach((p) => {
      g.globalAlpha = prev * (p.dim ? 0.32 : 1);
      if (p.hi) {
        g.fillStyle = Art.alpha(p.hi, 0.26); Art.round(g, x - 8, y - size * 0.74, p.w + 16, size * 1.5, 12); g.fill();
        g.strokeStyle = p.hi; g.lineWidth = 3; g.stroke();
      }
      if (p.kind === 'arrow') Art.arrow(g, x + 2, y, x + p.w - 4, y, { color: C.ink, w: size * 0.09, head: size * 0.24 });
      else if (p.kind === 'plus') Art.text(g, '+', x + p.w / 2, y, { size, font: 'display', color: C.dim });
      else {
        if (p.coef) Art.text(g, p.coef, x, y, { size, font: 'display', align: 'left', color: C.sun });
        Art.formula(g, p.f, x + p.cw, y, { size, align: 'left', colorize: true });
      }
      x += p.w + gap;
    });
    g.globalAlpha = prev;
  }
  function strip(g, x, y, w, h, o = {}) {
    g.fillStyle = o.fill || 'rgba(18,8,36,.78)'; Art.round(g, x, y, w, h, Math.min(20, h / 2)); g.fill();
    g.strokeStyle = o.stroke || 'rgba(255,255,255,.14)'; g.lineWidth = 2.5; g.stroke();
  }
  function tick(g, x, y, ok, q = 1) {
    Art.popIn(g, x, y, q, (gg) => {
      gg.fillStyle = ok ? C.leaf : C.red; gg.beginPath(); gg.arc(0, 0, 20, 0, TAU); gg.fill();
      gg.strokeStyle = ok ? '#07301A' : '#fff'; gg.lineWidth = 5.5; gg.lineCap = 'round'; gg.lineJoin = 'round'; gg.beginPath();
      if (ok) { gg.moveTo(-9, 1); gg.lineTo(-2, 8); gg.lineTo(10, -7); } else { gg.moveTo(-7, -7); gg.lineTo(7, 7); gg.moveTo(7, -7); gg.lineTo(-7, 7); }
      gg.stroke();
    });
  }
  function beadRow(g, n, x0, x1, y, sym, o = {}) {
    const r = o.r || 17, sp = Math.min(r * 2.2, n > 1 ? (x1 - x0 - 2 * r) / (n - 1) : r);
    for (let i = 0; i < n; i++) {
      const x = o.align === 'right' ? x1 - r - i * sp : x0 + r + i * sp;
      const q = o.q === undefined ? 1 : ease.back(seg(o.q, i * 0.1, 0.3 + i * 0.1));
      if (q > 0) Art.ball(g, x, y, r * q, Art.elementColor(sym));
    }
  }
  /** One counted row: beads and number on each side, element in the middle, verdict at the end. */
  function countRow(g, sym, L, R, y, o = {}) {
    const prev = g.globalAlpha; g.globalAlpha = prev * (o.alpha === undefined ? 1 : o.alpha);
    beadRow(g, L, 70, 330, y, sym, { align: 'right', r: o.r });
    Art.text(g, String(L), 356, y, { font: 'display', size: 38, color: L === R ? C.leaf : C.sun });
    Art.atom(g, 400, y, 24, sym);
    Art.text(g, String(R), 444, y, { font: 'display', size: 38, color: L === R ? C.leaf : C.sun });
    beadRow(g, R, 470, 730, y, sym, { r: o.r });
    if (o.ghost) {
      g.save(); g.setLineDash([6, 6]); g.strokeStyle = C.red; g.lineWidth = 3;
      const r = o.r || 17; g.beginPath(); g.arc(470 + r + R * r * 2.2, y, r, 0, TAU); g.stroke(); g.restore();
      Art.text(g, '?', 470 + r + R * r * 2.2, y + 1, { font: 'display', size: 24, color: C.red });
    }
    g.globalAlpha = prev;
    tick(g, 760, y, L === R, o.tick === undefined ? 1 : o.tick);
  }

  /* ---------- A small reaction engine: atoms keep identity as partners change ---------- */
  function buildRx(reacts, prods, cx, cy) {
    const atoms = [], b0 = [], ends = [], b1 = [];
    const place = (f, x, y, s, rot) => {
      const m = Art.moleculeData(f), c = Math.cos(rot || 0), d = Math.sin(rot || 0);
      return { a: m.a.map(([sym, u, v]) => ({ sym, x: x + (u * c - v * d) * s, y: y + (u * d + v * c) * s, s })), b: m.b };
    };
    reacts.forEach(([f, x, y, s, rot]) => { const m = place(f, x, y, s, rot), base = atoms.length; m.a.forEach((a) => atoms.push({ sym: a.sym, x0: a.x, y0: a.y, s })); m.b.forEach(([i, j, o]) => b0.push([base + i, base + j, o])); });
    prods.forEach(([f, x, y, s, rot]) => { const m = place(f, x, y, s, rot), base = ends.length; m.a.forEach((a) => ends.push({ sym: a.sym, x: a.x, y: a.y, used: false })); m.b.forEach(([i, j, o]) => b1.push([base + i, base + j, o])); });
    const map = new Map();
    atoms.forEach((a, i) => {
      let best = -1, bd = 1e9;
      ends.forEach((e, k) => { if (!e.used && e.sym === a.sym) { const d = Math.hypot(e.x - a.x0, e.y - a.y0); if (d < bd) { bd = d; best = k; } } });
      if (best < 0) throw new Error('Atoms do not match');
      ends[best].used = true; map.set(best, i); a.x1 = ends[best].x; a.y1 = ends[best].y;
      const an = (i / 6) * TAU + 0.4; a.mx = cx + Math.cos(an) * 130; a.my = cy + Math.sin(an) * 80;
    });
    return { atoms, b0, b1: b1.map(([i, j, o]) => [map.get(i), map.get(j), o]) };
  }
  function drawRx(g, rx, q, t) {
    const P = rx.atoms.map((a) => {
      if (q < 0.5) { const u = ease.inOut(q * 2); return { x: lerp(a.x0, a.mx, u), y: lerp(a.y0, a.my, u) }; }
      const u = ease.inOut((q - 0.5) * 2); return { x: lerp(a.mx, a.x1, u), y: lerp(a.my, a.y1, u) };
    });
    const bonds = (list, A, w) => {
      if (A <= 0) return;
      const pr = g.globalAlpha; g.globalAlpha = pr * A;
      list.forEach(([i, j, o]) => Art.bond(g, P[i].x, P[i].y, P[j].x, P[j].y, { order: o, width: w }));
      g.globalAlpha = pr;
    };
    bonds(rx.b0, 1 - seg(q, 0.1, 0.26), 6); bonds(rx.b1, seg(q, 0.74, 0.9), 6);
    rx.atoms.forEach((a, i) => Art.atom(g, P[i].x + wander(i, t * 2) * 5 * Math.sin(Math.PI * q), P[i].y + wander(i + 9, t * 2) * 5 * Math.sin(Math.PI * q), a.sym === 'O' ? 27 : 20, a.sym, { face: a.sym === 'O' ? 'happy' : null, t, seed: i }));
  }

  /* ---------- Story 1: why balance? ---------- */
  const RX = buildRx([['H2', 160, 190, 74, 0.2], ['O2', 400, 180, 78, -0.2], ['H2', 640, 190, 74, -0.2]], [['H2O', 270, 190, 84, 0], ['H2O', 530, 190, 84, 0]], 400, 195);
  Lab.story('#story-why', {
    title: 'A vanishing oxygen',
    scenes: [
      {
        say: 'Here is hydrogen burning, written the quick way. Count the atoms on each side. One oxygen has <b>vanished</b>.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          eqRow(g, ['H2', '+', 'O2', '->', 'H2O'], W / 2, 42, 40);
          Art.molecule(g, 170, 150, 74, 'H2', { face: 'happy', t, faceAll: true, rot: 0 });
          Art.molecule(g, 330, 150, 70, 'O2', { face: 'happy', t, rot: 0.2 });
          Art.arrow(g, 420, 150, 480, 150, { color: C.pink, w: 7 });
          Art.molecule(g, 590, 140, 78, 'H2O', { face: 'wow', t });
          countRow(g, 'H', 2, 2, 270, { tick: seg(p, 0.2, 0.4), alpha: seg(p, 0.05, 0.25) });
          countRow(g, 'O', 2, 1, 346, { tick: seg(p, 0.5, 0.7), alpha: seg(p, 0.3, 0.5), ghost: p > 0.7 });
          Art.moe(g, 90, 432, 96, 'oops', { t });
        },
      },
      {
        say: 'But atoms do not vanish. Seal this reaction in a flask, and the mass after equals the mass before. This is the <b>law of conservation of mass</b>.',
        dur: 3.6,
        draw(g, p, t, { W }) {
          [[200, 0], [600, 1]].forEach(([x, after]) => {
            const sc = Art.digitalScale(g, x, 376, 250, '120.00 g', { size: 22 });
            Art.flask(g, x, sc.top, 170, 214, {});
            g.fillStyle = '#9A6A42'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; Art.round(g, x - 21, sc.top - 226, 42, 26, 6); g.fill(); g.stroke();
            if (!after) {
              [[-44, -44, 'H2', 34, 0.3], [34, -66, 'H2', 34, -0.6], [-4, -24, 'O2', 36, 1.2]].forEach(([u, v, f, s, r], i) => Art.molecule(g, x + u + wander(i, t) * 4, sc.top + v + wander(i + 5, t) * 4, s, f, { style: 'fill', atomScale: 1, rot: r + Math.sin(t + i) * 0.2, labels: false }));
            } else {
              [[-30, -40, 0.3], [36, -58, -0.5]].forEach(([u, v, r], i) => Art.molecule(g, x + u + wander(i, t) * 4, sc.top + v + wander(i + 5, t) * 4, 34, 'H2O', { style: 'fill', atomScale: 1, rot: r + Math.sin(t + i) * 0.2, labels: false, alpha: seg(p, 0.4, 0.7) }));
            }
          });
          Art.text(g, 'before', 200, 40, { font: 'display', size: 34, color: C.dim });
          Art.text(g, 'after', 600, 40, { font: 'display', size: 34, color: C.dim });
          Art.arrow(g, 348, 226, 452, 226, { color: C.pink, w: 8, p: seg(p, 0.15, 0.45) });
          Art.burst(g, 400, 200, seg(p, 0.3, 0.7), { n: 12, r: 60 });
          strip(g, 150, 392, 500, 50);
          Art.text(g, 'Mass before = mass after', W / 2, 417, { font: 'display', size: 30, color: C.leaf, alpha: seg(p, 0.6, 0.85) });
        },
      },
      {
        say: 'So fix the equation. A big number in front is called a <b>coefficient</b>. $\\ce{2H2O}$ means two whole water molecules. Oxygen now matches, but hydrogen has fallen short.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          eqRow(g, ['H2', '+', 'O2', '->', { t: '2H2O', hi: C.pink }], W / 2, 42, 40);
          Art.molecule(g, 150, 150, 74, 'H2', { face: 'happy', t });
          Art.molecule(g, 300, 150, 70, 'O2', { face: 'happy', t, rot: 0.2 });
          Art.arrow(g, 380, 150, 436, 150, { color: C.pink, w: 7 });
          Art.molecule(g, 530, 140, 72, 'H2O', { face: 'happy', t });
          Art.popIn(g, 680, 140, seg(p, 0.1, 0.35), (gg) => Art.molecule(gg, 0, 0, 72, 'H2O', { face: 'wink', t }));
          countRow(g, 'O', 2, 2, 270, { tick: seg(p, 0.35, 0.55) });
          countRow(g, 'H', 2, 4, 346, { tick: seg(p, 0.6, 0.8) });
        },
      },
      {
        say: 'Now put a 2 in front of $\\ce{H2}$. Hydrogen matches, oxygen still matches, and the scale settles. The equation is <b>balanced</b>.',
        dur: 3.8,
        draw(g, p, t, { W }) {
          eqRow(g, [{ t: '2H2', hi: C.pink }, '+', 'O2', '->', '2H2O'], W / 2, 42, 40);
          const set = seg(p, 0.15, 1);
          const tilt = -0.9 * Math.exp(-5 * set) * Math.cos(set * 13);
          Art.balance(g, 400, 300, 470, set <= 0 ? 0.9 : tilt, {
            drawLeft: (gg, x, y) => {
              Art.molecule(gg, x - 28, y - 22, 28, 'H2', { style: 'fill', labels: false });
              Art.molecule(gg, x + 34, y - 22, 28, 'H2', { style: 'fill', labels: false });
              Art.molecule(gg, x + 2, y - 54, 30, 'O2', { style: 'fill', labels: false });
            },
            drawRight: (gg, x, y) => {
              Art.molecule(gg, x - 36, y - 22, 28, 'H2O', { style: 'fill', labels: false });
              Art.molecule(gg, x + 36, y - 22, 28, 'H2O', { style: 'fill', labels: false });
            },
          });
          const q = seg(p, 0.65, 0.85);
          Art.text(g, '4 H', 100, 120, { font: 'display', size: 40, color: C.leaf, alpha: q });
          Art.text(g, '2 O', 100, 170, { font: 'display', size: 40, color: C.leaf, alpha: q });
          Art.text(g, '4 H', 700, 120, { font: 'display', size: 40, color: C.leaf, alpha: q });
          Art.text(g, '2 O', 700, 170, { font: 'display', size: 40, color: C.leaf, alpha: q });
          strip(g, 240, 346, 320, 68);
          Art.text(g, 'Balanced', W / 2, 380, { font: 'display', size: 44, color: C.leaf, alpha: q });
          Art.burst(g, 400, 200, seg(p, 0.7, 1), { n: 18, r: 170 });
        },
      },
      {
        say: 'Watch the same atoms change partners. Three molecules become two, and that is fine. <b>Atoms</b> are what must match, not molecules.',
        dur: 3.8,
        draw(g, p, t, { W }) {
          const q = ease.inOut(seg(p, 0.05, 0.9));
          drawRx(g, RX, q, t);
          Art.text(g, q < 0.3 ? '3 molecules' : q > 0.7 ? '2 molecules' : 'atoms loose', 400, 30, { font: 'display', size: 30, color: C.dim });
          strip(g, 90, 372, 620, 62);
          eqRow(g, ['2H2', '+', 'O2', '->', '2H2O'], 245, 403, 32);
          Art.atom(g, 480, 403, 19, 'H', { label: 'H' }); Art.text(g, '4', 512, 404, { font: 'display', size: 34, color: C.sun });
          Art.atom(g, 572, 403, 19, 'O', { label: 'O' }); Art.text(g, '2', 604, 404, { font: 'display', size: 34, color: C.sun });
          Art.text(g, 'always', 662, 404, { size: 22, color: C.dim });
          void W;
        },
      },
    ],
  });

  /* ---------- Story 2: the subscript trap ---------- */
  function bottle(g, x, y, s) {
    const gr = g.createLinearGradient(x - 40 * s, 0, x + 40 * s, 0);
    gr.addColorStop(0, '#5A3214'); gr.addColorStop(0.35, '#A5662A'); gr.addColorStop(1, '#3F210C');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, x - 40 * s, y - 112 * s, 80 * s, 112 * s, 12 * s); g.fill(); g.stroke();
    Art.round(g, x - 16 * s, y - 138 * s, 32 * s, 30 * s, 5 * s); g.fill(); g.stroke();
    g.fillStyle = '#FFFDF2'; Art.round(g, x - 30 * s, y - 86 * s, 60 * s, 44 * s, 5 * s); g.fill();
    Art.formula(g, 'H2O2', x, y - 64 * s, { size: 22, color: '#22123A' });
  }
  Lab.story('#story-sub', {
    title: 'The tempting shortcut',
    scenes: [
      {
        say: 'Why not skip coefficients and just change the formula to $\\ce{H2O2}$? On paper, the atoms even match. That is what makes this trap so tempting.',
        dur: 3,
        draw(g, p, t, { W }) {
          eqRow(g, ['H2', '+', 'O2', '->', { t: 'H2O2', hi: C.red }], W / 2, 52, 48);
          countRow(g, 'H', 2, 2, 190, { tick: seg(p, 0.25, 0.45) });
          countRow(g, 'O', 2, 2, 270, { tick: seg(p, 0.45, 0.65) });
          Art.moe(g, 400, 438, 96, 'think', { t });
          Art.text(g, 'Looks fine...', 400, 322, { size: 26, color: C.sun, alpha: seg(p, 0.65, 0.85) });
        },
      },
      {
        say: 'But a subscript is part of what a substance <b>is</b>. Add one more O and water turns into <b>hydrogen peroxide</b>, a different chemical with different behavior.',
        dur: 3.8,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.1, 0.55));
          // Left: water in a glass.
          Art.beaker(g, 130, 330, 110, 130, { level: 0.8, ticks: false });
          Art.molecule(g, 300, 200, 70, 'H2O', { face: 'happy', t });
          Art.text(g, 'H₂O: water', 215, 66, { font: 'display', size: 36, color: C.water });
          Art.text(g, 'You drink it.', 215, 390, { size: 28 });
          // Middle: an arrow and a flying O.
          Art.arrow(g, 374, 208, 426, 208, { color: C.red, w: 7 });
          Art.atom(g, lerp(400, 560, q), lerp(120, 160, q), 26, 'O', { alpha: 1 - seg(p, 0.55, 0.6), face: 'grin', t });
          // Right: peroxide in a brown bottle.
          const a = seg(p, 0.5, 0.7);
          Art.popIn(g, 560, 200, a, (gg) => {
            Art.molecule(gg, 0, 0, 62, 'H2O2', { face: 'wow', t });
          });
          Art.text(g, 'H₂O₂: peroxide', 610, 66, { font: 'display', size: 36, color: C.red, alpha: a });
          const pr = g.globalAlpha; g.globalAlpha = pr * a; bottle(g, 712, 330, 1); g.globalAlpha = pr;
          Art.text(g, 'It bleaches hair. Do not drink it.', 590, 390, { size: 26, alpha: a, maxW: 400 });
        },
      },
      {
        say: 'Here is the difference. A <b>coefficient</b> gives you more of the same thing. A <b>subscript</b> gives you a different thing.',
        dur: 3.4,
        draw(g, p, t) {
          const panel = (x, w, color) => { g.fillStyle = Art.alpha(color, 0.12); Art.round(g, x, 22, w, 406, 24); g.fill(); g.strokeStyle = Art.alpha(color, 0.6); g.lineWidth = 3; g.stroke(); };
          panel(20, 370, C.leaf); panel(410, 370, C.red);
          Art.text(g, 'Coefficient', 205, 62, { font: 'display', size: 36, color: C.leaf });
          Art.text(g, 'Subscript', 595, 62, { font: 'display', size: 36, color: C.red });
          eqRow(g, ['2H2O'], 205, 122, 52);
          Art.formula(g, 'H2O2', 595, 122, { size: 52, colorize: true });
          Art.molecule(g, 112, 238, 58, 'H2O', { face: 'happy', t });
          Art.popIn(g, 296, 238, seg(p, 0.15, 0.4), (gg) => Art.molecule(gg, 0, 0, 58, 'H2O', { face: 'happy', t }));
          Art.popIn(g, 595, 238, seg(p, 0.35, 0.6), (gg) => Art.molecule(gg, 0, 0, 70, 'H2O2', { face: 'wow', t }));
          Art.text(g, 'two waters', 205, 344, { size: 30, alpha: seg(p, 0.3, 0.5) });
          Art.text(g, 'still water', 205, 388, { font: 'display', size: 30, color: C.leaf, alpha: seg(p, 0.4, 0.6) });
          Art.text(g, 'one peroxide', 595, 344, { size: 30, alpha: seg(p, 0.55, 0.7) });
          Art.text(g, 'not water any more', 595, 388, { font: 'display', size: 30, color: C.red, alpha: seg(p, 0.65, 0.85) });
        },
      },
      {
        say: 'So the rule is simple. The number in front is yours to change. The small number inside is <b>hands off</b>.',
        dur: 3.2,
        draw(g, p, t, { W }) {
          // A giant formula with its two kinds of number.
          Art.text(g, '3', 262, 186, { font: 'display', size: 170, color: C.sun });
          Art.formula(g, 'H2O', 330, 186, { size: 170, align: 'left', colorize: true });
          Art.ring(g, 262, 186, 84, { color: C.leaf, w: 8, p: seg(p, 0.1, 0.4) });
          Art.text(g, 'yours to change', 262, 322, { font: 'display', size: 32, color: C.leaf, alpha: seg(p, 0.25, 0.45) });
          Art.ring(g, 492, 236, 48, { color: C.red, w: 8, p: seg(p, 0.5, 0.75) });
          Art.strike(g, 460, 202, 524, 270, seg(p, 0.65, 0.85), C.red, 7);
          Art.text(g, 'hands off', 520, 322, { font: 'display', size: 32, color: C.red, alpha: seg(p, 0.6, 0.8) });
          strip(g, 130, 366, 540, 62);
          Art.text(g, 'Balance with coefficients only', W / 2, 397, { font: 'display', size: 32, alpha: seg(p, 0.75, 0.95) });
          Art.moe(g, 700, 350, 130, 'point', { t, flip: true });
        },
      },
    ],
  });

  /* ---------- Bench: coefficient or subscript? ---------- */
  const SUB = {
    water: { f: 'H2O', name: 'water', note: 'You drink it.', color: C.water, alt: { f: 'H2O2', name: 'hydrogen peroxide', note: 'It bleaches hair. Do not drink it.' } },
    carbon: { f: 'CO2', name: 'carbon dioxide', note: 'You breathe it out.', color: C.leaf, alt: { f: 'CO', name: 'carbon monoxide', note: 'A silent poison.' } },
    oxygen: { f: 'O2', name: 'oxygen gas', note: 'You breathe it in.', color: C.cyan, alt: { f: 'O3', name: 'ozone', note: 'Harsh on your lungs, useful high in the sky.' } },
  };
  const sub = { k: 'water', c: 1, alt: false, flip: 0, shownC: 1, flipBy: 0 };
  Lab.stage('#c-sub', {
    label: 'Copies of a molecule that multiply with the coefficient, or change into a different molecule when the subscript changes.',
    draw(g, t, dt) {
      const d = SUB[sub.k], cur = sub.alt ? d.alt : d;
      sub.flip = lerp(sub.flip, 1, clamp(dt * 4));
      const pop = 1 + Math.sin(Math.min(1, sub.flip) * Math.PI) * 0.28;
      eqRow(g, [(sub.c > 1 ? sub.c : '') + cur.f], 400, 52, 58);
      const xs = Art.moleculeData(cur.f).a.map((a) => a[1]), span = Math.max(...xs) - Math.min(...xs), cols = sub.c, cell = 720 / cols, s = clamp((cell * 0.56) / Math.max(span, 1), 34, 96);
      for (let i = 0; i < sub.c; i++) {
        const x = 40 + cell * (i + 0.5), y = 204 + wander(i, t) * 4;
        g.save(); g.translate(x, y); g.scale(pop, pop);
        Art.molecule(g, 0, 0, s, cur.f, { face: sub.alt ? 'wow' : 'happy', t, seed: i });
        g.restore();
      }
      strip(g, 90, 310, 620, 118, sub.alt ? { stroke: C.red } : { stroke: C.leaf });
      Art.text(g, cur.name, 400, 346, { font: 'display', size: 38, color: sub.alt ? C.red : d.color });
      Art.text(g, cur.note, 400, 394, { size: 26, maxW: 590 });
    },
  });
  function paintSub() {
    const d = SUB[sub.k], cur = sub.alt ? d.alt : d;
    const counts = Bank.countAtoms(cur.f), list = Object.keys(counts).map((e) => `${counts[e] * sub.c} ${e}`).join(', ');
    Lab.$('#sub-flip').textContent = sub.alt ? 'Change the subscript back' : 'Change the subscript';
    Lab.$('#sub-foot').innerHTML = Lab.texString(sub.alt
      ? `<p><b>Different substance.</b> That one small number turned ${d.name} into ${d.alt.name}. You did not balance anything. You changed the chemistry. Atoms shown: ${list}.</p>`
      : `<p><b>Same substance.</b> $\\ce{${sub.c > 1 ? sub.c : ''}${cur.f}}$ is ${sub.c === 1 ? 'one molecule' : sub.c + ' molecules'} of ${cur.name}. Atoms shown: ${list}. Try the subscript button to see the difference.</p>`);
  }
  Lab.segmented('#sub-pick', (v) => { sub.k = v; sub.alt = false; sub.flip = 0; paintSub(); });
  Lab.bind('#sub-c', '#sub-c-out', (v) => v, (v) => { sub.c = v; paintSub(); });
  Lab.$('#sub-flip').addEventListener('click', () => { sub.alt = !sub.alt; sub.flip = 0; Lab.sound.pop(); paintSub(); });
  paintSub();

  /* ---------- Molecule pictures for any formula ---------- */
  const RAD = { H: 0.42, C: 0.56, N: 0.55, O: 0.54, Cl: 0.62, S: 0.62, P: 0.62 };
  const shapes = new Map();
  /** Atoms of a formula in unit coordinates: known molecules keep their shape, others pack into a tidy cluster. */
  function shapeOf(f) {
    if (shapes.has(f)) return shapes.get(f);
    const known = Art.moleculeData(f);
    let list;
    if (known) list = known.a.map(([sym, x, y]) => ({ sym, x, y, r: RAD[sym] || 0.66 }));
    else {
      const counts = Bank.countAtoms(f);
      const syms = Object.keys(counts).sort((a, b) => EL[b].mass - EL[a].mass);
      const seq = []; syms.forEach((s) => { for (let i = 0; i < counts[s]; i++) seq.push(s); });
      // Spiral out through a hex grid, biggest atoms in the middle.
      const hex = [];
      for (let q = -3; q <= 3; q++) for (let r = -3; r <= 3; r++) hex.push([q + r * 0.5, r * 0.866]);
      hex.sort((a, b) => (a[0] * a[0] + a[1] * a[1]) - (b[0] * b[0] + b[1] * b[1]) || Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
      list = seq.map((sym, i) => ({ sym, x: hex[i][0], y: hex[i][1], r: RAD[sym] || 0.66 }));
    }
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    list.forEach((a) => { x0 = Math.min(x0, a.x - a.r); x1 = Math.max(x1, a.x + a.r); y0 = Math.min(y0, a.y - a.r); y1 = Math.max(y1, a.y + a.r); });
    const out = { atoms: list.slice().sort((a, b) => (a.sym === 'H') - (b.sym === 'H')), w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
    shapes.set(f, out);
    return out;
  }
  function drawShape(g, f, x, y, s, scale = 1) {
    const sh = shapeOf(f), k = s * scale;
    sh.atoms.forEach((a) => {
      const r = a.r * k;
      Art.atom(g, x + (a.x - sh.cx) * k, y + (a.y - sh.cy) * k, r, a.sym, { label: r >= 11 ? a.sym : false });
    });
  }

  /* ---------- Bench: the balancer ---------- */
  const EQ = Chem.EQUATIONS;
  const B = { i: 0, co: [], copies: [], tilt: 0, vel: 0, solved: new Set(), state: 'off', at: -9, hits: [], hintSym: null, hover: -1, msg: null };
  const unitLabel = { NO3: 'NO₃', SO4: 'SO₄', PO4: 'PO₄' };
  function splitUnits(f, units) {
    const c = {}; let rem = f;
    (units || []).forEach((u) => {
      const re = new RegExp('\\(' + u + '\\)(\\d*)'), m = re.exec(rem);
      if (m) { c[u] = +(m[1] || 1); rem = rem.replace(re, ''); }
      else if (rem.includes(u)) { c[u] = 1; rem = rem.replace(u, ''); }
    });
    const atoms = Bank.countAtoms(rem);
    for (const e in atoms) c[e] = (c[e] || 0) + atoms[e];
    return c;
  }
  /** Rows for the tally. Polyatomic ions the equation flags are counted as one thing. */
  function tallyRows() {
    const q = EQ[B.i], lt = {}, rt = {};
    q.L.forEach((f, i) => { const c = splitUnits(f, q.units); for (const e in c) lt[e] = (lt[e] || 0) + c[e] * B.co[i]; });
    q.R.forEach((f, i) => { const c = splitUnits(f, q.units); for (const e in c) rt[e] = (rt[e] || 0) + c[e] * B.co[q.L.length + i]; });
    const keys = [...new Set([...Object.keys(lt), ...Object.keys(rt)])];
    const rank = (k) => (k === 'O' ? 3 : k === 'H' ? 2 : unitLabel[k] ? 1 : 0);
    keys.sort((a, b) => rank(a) - rank(b));
    return keys.map((k) => ({ key: k, unit: !!unitLabel[k], L: lt[k] || 0, R: rt[k] || 0 }));
  }
  const allMatch = () => { const q = EQ[B.i]; return Chem.isBalanced(q.L, q.R, B.co); };
  const lowest = () => B.co.reduce((a, b) => (b ? (function g2(x, y) { return y ? g2(y, x % y) : x; })(a, b) : a)) === 1;
  function massSides() {
    const { lt, rt } = Chem.sides(EQ[B.i].L, EQ[B.i].R, B.co);
    const m = (o) => Object.keys(o).reduce((s, e) => s + EL[e].mass * o[e], 0);
    return { ML: m(lt), MR: m(rt), lt, rt };
  }
  function layoutCopies() {
    const q = EQ[B.i], n = q.L.length + q.R.length;
    const side = (fs, off, x0, x1) => {
      const weights = fs.map((f, i) => Math.sqrt(B.co[off + i] * shapeOf(f).atoms.length) + 1.2);
      const tot = weights.reduce((a, b) => a + b, 0);
      let x = x0;
      fs.forEach((f, i) => {
        const w = ((x1 - x0) * weights[i]) / tot, c = B.co[off + i], sh = shapeOf(f), h = 164;
        let best = { s: 0 };
        for (let cols = 1; cols <= c; cols++) {
          const rows = Math.ceil(c / cols);
          const sz = Math.min((w - 6) / (cols * (sh.w + 0.3)), h / (rows * (sh.h + 0.3)), 32);
          if (sz > best.s) best = { s: sz, cols, rows };
        }
        const list = B.copies[off + i] || (B.copies[off + i] = []);
        while (list.length > c) list.pop();
        for (let k = 0; k < c; k++) {
          const row = Math.floor(k / best.cols), inRow = row < best.rows - 1 ? best.cols : c - best.cols * (best.rows - 1), col = k % best.cols;
          const tx = x + w / 2 + (col - (inRow - 1) / 2) * (sh.w + 0.3) * best.s;
          const ty = 214 + (row - (best.rows - 1) / 2) * (sh.h + 0.3) * best.s;
          if (!list[k]) list[k] = { x: tx, y: ty, s: best.s, pop: 0 };
          list[k].tx = tx; list[k].ty = ty; list[k].ts = best.s;
        }
        x += w;
      });
    };
    side(q.L, 0, 14, 386);
    side(q.R, q.L.length, 414, 786);
    void n;
  }
  function setEq(i) {
    B.i = clamp(i, 0, EQ.length - 1);
    const q = EQ[B.i];
    B.co = new Array(q.L.length + q.R.length).fill(1);
    B.copies = [];
    B.state = 'off'; B.hintSym = null; B.msg = null;
    layoutCopies();
    buildSteppers();
    paintBal();
    levelSeg.set(String(q.level), false);
  }
  function bump(i, d) {
    const v = clamp(B.co[i] + d, 1, 14);
    if (v === B.co[i]) return;
    B.co[i] = v; B.hintSym = null; B.msg = null;
    B.vel += d * 0.3;
    if (B.state !== 'off') B.state = 'off';
    layoutCopies();
    Lab.sound.pop();
    paintBal();
    if (Lab.reducedMotion) checkReduced();
    balStage.redraw();
  }
  function onLocked() {
    B.state = 'locked'; B.at = balStage.t;
    if (lowest()) {
      const first = !B.solved.has(B.i);
      B.solved.add(B.i);
      Lab.sound.good();
      if (first) Lab.collection.award(1);
      if (B.solved.size === EQ.length && first) { Lab.confetti(); Lab.sound.fanfare(); }
    }
    paintBal();
  }
  function checkReduced() {
    const m = massSides();
    B.tilt = clamp((-(m.ML - m.MR) / Math.max(m.ML, m.MR)) * 2.2, -1, 1);
    if (allMatch()) { B.tilt = 0; onLocked(); }
  }
  function paintBal() {
    const q = EQ[B.i], foot = Lab.$('#bal-foot');
    Lab.$('#bal-hint-line').textContent = `Equation ${B.i + 1} of ${EQ.length}. ${B.solved.size} solved.`;
    let html;
    if (B.state === 'locked' && lowest()) html = `<p><b>Balanced.</b> ${Chem.eqTex(q.L, q.R, B.co)}. ${B.solved.size === EQ.length ? 'That is all 18. Well done, chemist.' : 'Press the button for the next one.'}</p>`;
    else if (B.state === 'locked' || (allMatch() && !lowest())) html = '<p><b>It balances, but these are not the smallest whole numbers.</b> Every coefficient shares a factor. Bring them down.</p>';
    else if (B.msg) html = `<p>${B.msg}</p>`;
    else html = `<p>${q.tip}${q.units.length ? ` The tally counts ${q.units.map((u) => `$\\ce{${u}}$`).join(' and ')} as one unit.` : ''}</p>`;
    foot.innerHTML = Lab.texString(html);
    Lab.$('#bal-prev').disabled = B.i === 0;
    Lab.$('#bal-next').disabled = B.i === EQ.length - 1;
    // Steppers show the live value.
    Lab.$$('[data-co]').forEach((el) => { el.textContent = B.co[+el.dataset.co]; });
  }
  function buildSteppers() {
    const q = EQ[B.i], terms = q.L.concat(q.R), host = Lab.$('#bal-steppers');
    host.innerHTML = terms.map((f, i) => `<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap">
      <button type="button" class="btn ghost small" data-step="${i}" data-d="-1" aria-label="Lower the coefficient of ${f}">−</button>
      <span style="min-width:4.4em;text-align:center;font-weight:700"><span data-co="${i}" style="color:#FFD23F">1</span> ${Lab.fHTML(f)}</span>
      <button type="button" class="btn ghost small" data-step="${i}" data-d="1" aria-label="Raise the coefficient of ${f}">+</button>
    </span>`).join('');
    Lab.$$('[data-step]', host).forEach((b) => b.addEventListener('click', () => bump(+b.dataset.step, +b.dataset.d)));
  }
  function chevron(g, x, y, up, on) {
    g.fillStyle = on ? C.sun : 'rgba(255,255,255,.34)';
    g.beginPath(); g.moveTo(x - 15, y + (up ? 8 : -8)); g.lineTo(x, y + (up ? -8 : 8)); g.lineTo(x + 15, y + (up ? 8 : -8)); g.closePath(); g.fill();
  }
  const balStage = Lab.stage('#c-balancer', {
    h: 530,
    label: 'An equation with coefficients you can raise and lower, pictures of every molecule, a bar tally of each element, and a scale that settles when both sides match.',
    onPointer(e) {
      const hit = e.y < 134 ? B.hits.find((h) => e.x >= h.x0 && e.x <= h.x1) : null;
      if (e.type === 'hover') { balStage.canvas.style.cursor = hit ? 'pointer' : 'default'; B.hover = hit ? hit.i : -1; B.hoverUp = e.y < 66; return; }
      if (e.type === 'down' && hit) bump(hit.i, e.y < 66 ? 1 : -1);
    },
    draw(g, t, dt) {
      if (!B.co.length) return;
      const q = EQ[B.i], terms = q.L.concat(q.R), W = 800, H = 530, nL = q.L.length;
      const locked = B.state === 'locked' && lowest();
      // The equation row, sized to fit.
      let size = 34, widths;
      const slotW = 58;
      for (; size >= 22; size -= 2) {
        widths = terms.map((f) => slotW + 8 + fw(g, f, size));
        const tot = widths.reduce((a, b) => a + b, 0) + 38 * (terms.length - 2) + 70 + 12 * terms.length;
        if (tot <= 776) break;
      }
      const tot = widths.reduce((a, b) => a + b, 0) + 38 * (terms.length - 2) + 70 + 12 * terms.length;
      let x = (W - tot) / 2 + 6;
      B.hits = [];
      terms.forEach((f, i) => {
        if (i === nL) { Art.arrow(g, x + 2, 66, x + 52, 66, { color: locked ? C.leaf : C.ink, w: 5, head: 13 }); x += 58 + 12; }
        else if (i > 0) { Art.text(g, '+', x + 13, 66, { font: 'display', size: 32, color: C.dim }); x += 26 + 12; }
        const sx = x + slotW / 2, on = B.hover === i;
        g.fillStyle = locked ? 'rgba(61,220,132,.2)' : 'rgba(255,255,255,.08)';
        g.strokeStyle = locked ? C.leaf : on ? C.sun : 'rgba(255,255,255,.26)'; g.lineWidth = locked || on ? 3.5 : 2.5;
        Art.round(g, x, 12, slotW, 108, 15); g.fill(); g.stroke();
        chevron(g, sx, 28, true, on && B.hoverUp);
        chevron(g, sx, 104, false, on && !B.hoverUp);
        Art.text(g, String(B.co[i]), sx, 67, { font: 'display', size: B.co[i] > 9 ? 34 : 42, color: B.co[i] === 1 ? C.faint : C.sun });
        Art.formula(g, f, x + slotW + 8, 66, { size, align: 'left', colorize: true });
        B.hits.push({ i, x0: x - 4, x1: x + widths[i] + 4 });
        x += widths[i] + 12;
      });

      // The molecule pictures, sliding to their places.
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.setLineDash([6, 9]); g.lineWidth = 2.5; g.beginPath(); g.moveTo(400, 134); g.lineTo(400, 294); g.stroke(); g.setLineDash([]);
      B.copies.forEach((list, i) => {
        list.forEach((c, k) => {
          c.x = lerp(c.x, c.tx, clamp(dt * 10)); c.y = lerp(c.y, c.ty, clamp(dt * 10)); c.s = lerp(c.s, c.ts, clamp(dt * 10));
          c.pop = Math.min(1, c.pop + dt * 4);
          if (Lab.reducedMotion) { c.x = c.tx; c.y = c.ty; c.s = c.ts; c.pop = 1; }
          drawShape(g, terms[i], c.x, c.y + wander(i * 3 + k, t) * 1.6, c.s, Math.max(0.01, ease.back(c.pop)));
        });
      });

      // The bar tally.
      const rows = tallyRows(), rh = Math.min(46, 208 / rows.length), y0 = 310 + (208 - rh * rows.length) / 2 + rh / 2;
      const cx = 196, top = Math.max(8, ...rows.map((r) => Math.max(r.L, r.R)));
      g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, 8, 302, 376, 224, 18); g.fill();
      rows.forEach((r, i) => {
        const y = y0 + i * rh, ok = r.L === r.R, focus = B.hintSym === r.key;
        if (focus) { g.fillStyle = 'rgba(255,79,163,.2)'; Art.round(g, 12, y - rh / 2 + 2, 368, rh - 4, 10); g.fill(); g.strokeStyle = C.pink; g.lineWidth = 2.5; g.stroke(); }
        const bar = (n, dir) => {
          const w = (n / top) * 104;
          const color = ok ? C.leaf : (r.unit ? C.violet : Art.elementColor(r.key) === '#5A6475' ? '#8E99AE' : Art.elementColor(r.key));
          g.fillStyle = color;
          const bx = dir < 0 ? cx - 34 - w : cx + 34;
          Art.round(g, bx, y - 9, Math.max(3, w), 18, 7); g.fill();
          if (n <= 20) { g.fillStyle = 'rgba(16,6,34,.45)'; for (let k = 1; k < n; k++) g.fillRect(dir < 0 ? cx - 34 - (k / top) * 104 : cx + 34 + (k / top) * 104, y - 9, 1.6, 18); }
          Art.text(g, String(n), dir < 0 ? bx - 8 : bx + Math.max(3, w) + 8, y + 1, { font: 'display', size: 25, align: dir < 0 ? 'right' : 'left', color: ok ? C.leaf : C.sun });
        };
        bar(r.L, -1); bar(r.R, 1);
        if (r.unit) Art.pill(g, unitLabel[r.key], cx, y, { size: 21, font: 'display', color: C.violet, text: '#1A0F2E', pad: 8 });
        else Art.atom(g, cx, y, Math.min(19, rh * 0.42), r.key);
      });

      // The scale. A spring pulls it toward the real mass difference, so it overshoots and settles.
      const m = massSides(), match = allMatch();
      const target = match ? 0 : clamp((-(m.ML - m.MR) / Math.max(m.ML, m.MR)) * 2.2, -1, 1);
      if (!Lab.reducedMotion) {
        const h = Math.min(dt, 0.033);
        B.vel += (46 * (target - B.tilt) - 3.1 * B.vel) * h;
        B.tilt += B.vel * h;
      }
      if (match && B.state === 'off') B.state = 'settling';
      if (B.state === 'settling' && Math.abs(B.tilt) < 0.012 && Math.abs(B.vel) < 0.05) onLocked();
      const pile = (gg, x, y, totals) => {
        const seq = []; Object.keys(totals).forEach((e) => { for (let k = 0; k < Math.min(totals[e], 9); k++) seq.push(e); });
        const n = Math.min(seq.length, 15);
        let idx = 0;
        for (let row = 0, wid = 5; row < 3 && idx < n; row++, wid--) {
          for (let c = 0; c < wid && idx < n; c++, idx++) Art.ball(gg, x + (c - (wid - 1) / 2) * 21, y - 11 - row * 18, 11, Art.elementColor(seq[idx]));
        }
      };
      Art.balance(g, 590, H - 4, 280, B.tilt, { drawLeft: (gg, px, py) => pile(gg, px, py, m.lt), drawRight: (gg, px, py) => pile(gg, px, py, m.rt) });
      // Verdict over the scale.
      if (locked) {
        const since = t - B.at;
        Art.burst(g, 594, 400, clamp(since / 1.3), { n: 24, r: 210 });
        Art.glow(g, 594, 410, 180, C.leaf, 0.22 + Math.sin(t * 3) * 0.05);
        Art.popIn(g, 594, 336, clamp(since * 3), (gg) => Art.pill(gg, 'Balanced!', 0, 0, { size: 34, font: 'display', color: C.leaf, text: '#07301A' }));
      } else if (B.state === 'locked' || (match && !lowest())) {
        Art.pill(g, 'Level, but shrink the numbers', 594, 336, { size: 23, color: C.sun, text: '#22123A' });
      } else if (!match) {
        const big = Math.abs(m.ML - m.MR) < 0.5;
        Art.text(g, big ? 'Same mass, but atoms differ' : m.ML > m.MR ? 'Left side is heavier' : 'Right side is heavier', 594, 336, { size: 25, color: C.sun, halo: true });
      }
    },
  });
  const levelSeg = Lab.segmented('#bal-level', (v) => { setEq(EQ.findIndex((q) => q.level === +v)); Lab.sound.pop(); });
  Lab.$('#bal-next').addEventListener('click', () => { setEq(B.i + 1); Lab.sound.pop(); });
  Lab.$('#bal-prev').addEventListener('click', () => { setEq(B.i - 1); Lab.sound.pop(); });
  Lab.$('#bal-reset').addEventListener('click', () => { B.co = B.co.map(() => 1); B.state = 'off'; B.msg = null; B.hintSym = null; layoutCopies(); paintBal(); });
  Lab.$('#bal-hint').addEventListener('click', () => {
    const q = EQ[B.i];
    if (allMatch()) { B.msg = lowest() ? 'No hint needed. It already balances.' : 'Divide every coefficient by the number they share.'; paintBal(); return; }
    const rows = tallyRows();
    const bad = rows.find((r) => r.L !== r.R);
    const has = (f) => (bad.unit ? f.includes(bad.key) : Bank.countAtoms(f)[bad.key] > 0);
    const lefts = q.L.filter(has), rights = q.R.filter(has);
    const name = bad.unit ? `$\\ce{${bad.key}}$` : EL[bad.key].name.toLowerCase();
    B.hintSym = bad.key;
    B.msg = `<b>Look at ${name}:</b> ${bad.L} on the left and ${bad.R} on the right. Adjust ${[...lefts, ...rights].map((f) => `$\\ce{${f}}$`).join(' or ')}.`;
    paintBal();
    Lab.sound.pop();
  });
  setEq(0);

  /* ---------- Story 3: the method on a hard one ---------- */
  function methodRows(g, rows, focus, p) {
    rows.forEach(([key, unit, L, R], i) => {
      const y = 158 + i * 66, ok = L === R, on = focus === key;
      if (on) { g.fillStyle = 'rgba(255,79,163,.16)'; Art.round(g, 30, y - 30, 740, 60, 16); g.fill(); g.strokeStyle = C.pink; g.lineWidth = 2.5; g.stroke(); }
      const show = (n, x0, x1, right) => {
        for (let k = 0; k < n; k++) {
          const xx = right ? x1 - 19 - k * 40 : x0 + 19 + k * 40;
          if (unit) { Art.atom(g, xx, y, 17, 'P'); for (let a = 0; a < 4; a++) Art.atom(g, xx + Math.cos(a * 1.571 + 0.78) * 15, y + Math.sin(a * 1.571 + 0.78) * 15, 7, 'O', { label: false }); }
          else Art.ball(g, xx, y, 17, Art.elementColor(key));
        }
      };
      show(L, 90, 346, true); show(R, 454, 710, false);
      Art.text(g, String(L), 368, y, { font: 'display', size: 36, color: ok ? C.leaf : C.sun });
      Art.text(g, String(R), 432, y, { font: 'display', size: 36, color: ok ? C.leaf : C.sun });
      if (unit) Art.pill(g, 'PO₄', 56, y, { size: 22, font: 'display', color: C.violet, text: '#1A0F2E', pad: 10 });
      else Art.atom(g, 56, y, 22, key);
      tick(g, 748, y, ok);
    });
    void p;
  }
  const M_ST = (co) => [['Ca', false, co[1], 3 * co[2]], ['PO4', true, co[0], 2 * co[2]], ['Na', false, 3 * co[0], co[3]], ['Cl', false, 2 * co[1], co[3]]];
  const mEq = (co, hi) => { const n = ['Na3PO4', 'CaCl2', 'Ca3(PO4)2', 'NaCl'].map((f, i) => (co[i] > 1 ? co[i] : '') + f); return [{ t: n[0], hi: hi === 0 ? C.pink : null }, '+', { t: n[1], hi: hi === 1 ? C.pink : null }, '->', { t: n[2], hi: hi === 2 ? C.pink : null }, '+', { t: n[3], hi: hi === 3 ? C.pink : null }]; };
  const mScene = (say, co, hi, focus) => ({
    say, dur: 2.8,
    draw(g, p, t, { W }) {
      eqRow(g, mEq(co, hi), W / 2, 50, 36);
      methodRows(g, M_ST(co), focus, p);
      Art.text(g, 'left', 300, 106, { size: 22, color: C.dim });
      Art.text(g, 'right', 500, 106, { size: 22, color: C.dim });
      if (co[3] === 6) { Art.burst(g, 400, 250, seg(p, 0.3, 1), { n: 20, r: 220 }); }
      void t;
    },
  });
  Lab.story('#story-method', {
    title: 'A tough one, in order',
    scenes: [
      mScene('Start with the <b>biggest formula</b>, $\\ce{Ca3(PO4)2}$, and hold it at 1. Notice phosphate appears on both sides, so count it <b>as one unit</b>.', [1, 1, 1, 1], 2, null),
      mScene('<b>Calcium.</b> The right has 3, so write 3 in front of $\\ce{CaCl2}$.', [1, 3, 1, 1], 1, 'Ca'),
      mScene('<b>Phosphate.</b> The right has 2 whole phosphates, so write 2 in front of $\\ce{Na3PO4}$.', [2, 3, 1, 1], 0, 'PO4'),
      mScene('<b>Sodium.</b> The left now has $2 \\times 3 = 6$, so write 6 in front of $\\ce{NaCl}$.', [2, 3, 1, 6], 3, 'Na'),
      mScene('<b>Chlorine.</b> The left has $3 \\times 2 = 6$, and the right already has 6. Everything checks, and you never had to go back.', [2, 3, 1, 6], null, 'Cl'),
    ],
  });

  /* ---------- Bench: phase labels ---------- */
  const PH = {
    s: { x: 118, label: '(s)', name: 'solid', say: 'Particles are locked in place. They can only vibrate.', foot: '<b>Solid.</b> Sodium metal here. Its atoms stay in a fixed pattern and shake in place.' },
    l: { x: 306, label: '(l)', name: 'liquid', say: 'Touching, but free to slide past each other.', foot: '<b>Liquid.</b> Pure water here. Molecules stay close together but slide around.' },
    aq: { x: 494, label: '(aq)', name: 'dissolved', say: 'Ions spread out, wrapped in water.', foot: '<b>Aqueous.</b> Sodium hydroxide dissolved in water. Its ions drift apart, each one surrounded by water molecules.' },
    g: { x: 682, label: '(g)', name: 'gas', say: 'Far apart and flying fast.', foot: '<b>Gas.</b> Hydrogen here. Molecules are far apart and move quickly in straight lines until they hit something.' },
  };
  const ph = { k: 's', z: { s: 1, l: 0, aq: 0, g: 0 } };
  function phaseInside(k, g, cx, cy, R, t) {
    if (k === 's') {
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
        const x = cx + (i + (j % 2 ? 0.5 : 0)) * 44 + wander(i * 3 + j, t * 5) * 2.6, y = cy + j * 38 + wander(i + j * 5, t * 5) * 2.6;
        Art.atom(g, x, y, 21, 'Na', { label: false, face: i === 0 && j === 0 ? 'happy' : null, t });
      }
    } else if (k === 'l') {
      for (let i = 0; i < 9; i++) {
        const a = rand(i * 2.1) * TAU, d = Math.sqrt(rand(i * 3.7)) * R * 0.78;
        Art.molecule(g, cx + Math.cos(a) * d + wander(i, t * 0.9) * 14, cy + Math.sin(a) * d + wander(i + 7, t * 0.9) * 14, 27, 'H2O', { style: 'fill', atomScale: 1.2, rot: i + Math.sin(t * 0.7 + i) * 0.7, labels: false });
      }
    } else if (k === 'g') {
      for (let i = 0; i < 5; i++) {
        const sp = 42 + rand(i) * 40, px = i * R * 0.58 + t * sp * (i % 2 ? 1 : -1), py = ((i * 3) % 5) * R * 0.58 + t * sp * 0.7 * (i % 3 ? 1 : -1);
        const bounce = (v, m) => { const u = ((v % (2 * m)) + 2 * m) % (2 * m); return u > m ? 2 * m - u : u; };
        Art.molecule(g, cx - R * 0.72 + bounce(px, R * 1.44), cy - R * 0.72 + bounce(py, R * 1.44), 32, 'H2', { style: 'fill', atomScale: 1.3, rot: i + t * 2, labels: false });
      }
    } else {
      [[-0.45, -0.32, 'Na', 26, '+'], [0.42, 0.32, 'O', 24, '-']].forEach(([u, v, sym, r, ch], n) => {
        const x = cx + u * R + wander(n, t * 0.6) * 10, y = cy + v * R + wander(n + 3, t * 0.6) * 10;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * TAU + t * 0.25 + n;
          Art.molecule(g, x + Math.cos(a) * 44, y + Math.sin(a) * 44, 18, 'H2O', { style: 'fill', atomScale: 1.2, rot: a + (ch === '+' ? Math.PI / 2 : -Math.PI / 2), labels: false });
        }
        if (sym === 'O') Art.atom(g, x + 15, y - 12, 12, 'H', { label: false });
        Art.atom(g, x, y, r, sym, { charge: ch, label: sym === 'Na' ? 'Na' : 'O', face: null });
      });
    }
  }
  Lab.stage('#c-phase', {
    h: 450, label: 'Four magnifiers showing particles in a solid, a liquid, a dissolved compound and a gas, under an equation carrying those tags.',
    draw(g, t, dt) {
      const hi = (k) => (ph.k === k ? C.pink : null);
      eqRow(g, [{ t: '2Na(s)', hi: hi('s') }, '+', { t: '2H2O(l)', hi: hi('l') }, '->', { t: '2NaOH(aq)', hi: hi('aq') }, '+', { t: 'H2(g)', hi: hi('g') }], 400, 50, 36);
      ['s', 'l', 'aq', 'g'].forEach((k) => {
        ph.z[k] = lerp(ph.z[k], ph.k === k ? 1 : 0, clamp(dt * 7));
        const P = PH[k], R = 74 + 18 * ph.z[k];
        const prev = g.globalAlpha; g.globalAlpha = prev * (0.55 + 0.45 * ph.z[k]);
        Art.zoom(g, P.x, 200, P.x, 200, R, (gg, cx, cy, RR) => phaseInside(k, gg, cx, cy, RR, t), { rim: ph.k === k ? C.pink : C.cyan });
        Art.text(g, P.label, P.x, 320, { font: 'display', size: 34, color: ph.k === k ? C.sun : C.ink });
        Art.text(g, P.name, P.x, 356, { size: 24, color: ph.k === k ? C.ink : C.dim });
        g.globalAlpha = prev;
      });
      strip(g, 70, 386, 660, 50);
      Art.text(g, PH[ph.k].say, 400, 411, { size: 26, maxW: 630 });
    },
  });
  const paintPh = () => { Lab.$('#ph-foot').innerHTML = `<p>${PH[ph.k].foot}</p>`; };
  Lab.segmented('#ph-pick', (v) => { ph.k = v; paintPh(); });
  paintPh();
});
