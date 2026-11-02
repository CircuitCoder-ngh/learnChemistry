/* Lesson 4.2: The five reaction types. Each type is a dance: parts keep their identity and change partners. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, rand } = Lab;
  const C = Art.C;
  const Chem = Bank.reactionChem;
  const TAU = Math.PI * 2;

  /* ---------- Equations on stage ---------- */
  function fw(g, f, size) { const a = g.globalAlpha; g.globalAlpha = 0; const w = Art.formula(g, f, -999, -999, { size }); g.globalAlpha = a; return w; }
  function eqWidth(g, items, size) {
    const gap = size * 0.3;
    return items.reduce((s, it) => {
      const t = typeof it === 'string' ? it : it.t;
      if (t === '->') return s + size * 1.15 + gap;
      if (t === '+') return s + size * 0.6 + gap;
      const m = /^(\d+)\s*([A-Z(].*)$/.exec(t);
      g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
      return s + (m ? g.measureText(m[1]).width + size * 0.08 + fw(g, m[2], size) : fw(g, t, size)) + gap;
    }, -gap);
  }
  function eqRow(g, items, cx, y, size = 36, maxW = 760) {
    while (size > 20 && eqWidth(g, items, size) > maxW) size -= 2;
    const gap = size * 0.3;
    let x = cx - eqWidth(g, items, size) / 2;
    const prev = g.globalAlpha;
    items.forEach((it) => {
      const obj = typeof it === 'string' ? { t: it } : it, t = obj.t;
      g.globalAlpha = prev * (obj.dim ? 0.3 : 1);
      if (t === '->') { Art.arrow(g, x + 2, y, x + size * 1.15 - 4, y, { color: C.ink, w: size * 0.09, head: size * 0.24 }); x += size * 1.15 + gap; return; }
      if (t === '+') { Art.text(g, '+', x + size * 0.3, y, { size, font: 'display', color: C.dim }); x += size * 0.6 + gap; return; }
      const m = /^(\d+)\s*([A-Z(].*)$/.exec(t);
      const coef = m ? m[1] : '', f = m ? m[2] : t;
      g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
      const cw = coef ? g.measureText(coef).width + size * 0.08 : 0, w = cw + fw(g, f, size);
      if (obj.hi) { g.fillStyle = Art.alpha(obj.hi, 0.26); Art.round(g, x - 8, y - size * 0.74, w + 16, size * 1.5, 12); g.fill(); g.strokeStyle = obj.hi; g.lineWidth = 3; g.stroke(); }
      if (coef) Art.text(g, coef, x, y, { size, font: 'display', align: 'left', color: C.sun });
      Art.formula(g, f, x + cw, y, { size, align: 'left', colorize: true });
      x += w + gap;
    });
    g.globalAlpha = prev;
  }
  function strip(g, x, y, w, h, o = {}) {
    g.fillStyle = o.fill || 'rgba(18,8,36,.78)'; Art.round(g, x, y, w, h, Math.min(20, h / 2)); g.fill();
    g.strokeStyle = o.stroke || 'rgba(255,255,255,.14)'; g.lineWidth = 2.5; g.stroke();
  }
  const eqItems = (x) => {
    const items = [];
    x.L.forEach((f, i) => { if (i) items.push('+'); items.push((x.co[i] > 1 ? x.co[i] : '') + f); });
    items.push('->');
    x.R.forEach((f, i) => { if (i) items.push('+'); items.push((x.co[x.L.length + i] > 1 ? x.co[x.L.length + i] : '') + f); });
    return items;
  };

  /* ---------- Letter dancers ---------- */
  const LETTER = { A: '#FF6FB5', B: '#4FC3F7', C: '#FFD23F', D: '#7CE38B' };
  const letter = (g, x, y, L, r, o = {}) => Art.atom(g, x, y, r, L, { color: LETTER[L], label: L, face: o.face || 'happy', t: o.t, seed: L.charCodeAt(0), look: o.look });
  function floor(g, W, H) {
    const y0 = H - 118;
    const d = g.createLinearGradient(0, y0, 0, H);
    d.addColorStop(0, '#2A1A4A'); d.addColorStop(1, '#3B2763');
    g.fillStyle = d; g.fillRect(0, y0, W, H - y0);
    for (let i = 0; i < 14; i++) for (let j = 0; j < 4; j++) {
      if ((i + j) % 2) continue;
      const z0 = j / 4, z1 = (j + 1) / 4, sp = (z) => 0.62 + z * 0.5;
      const x0 = W / 2 + (i - 7) * 64 * sp(z0), x1 = W / 2 + (i - 6) * 64 * sp(z0), x2 = W / 2 + (i - 6) * 64 * sp(z1), x3 = W / 2 + (i - 7) * 64 * sp(z1);
      g.fillStyle = 'rgba(255,255,255,.04)';
      g.beginPath(); g.moveTo(x0, y0 + z0 * 118); g.lineTo(x1, y0 + z0 * 118); g.lineTo(x2, y0 + z1 * 118); g.lineTo(x3, y0 + z1 * 118); g.closePath(); g.fill();
    }
  }
  /** Spotlights that sweep gently, for the dance floor. */
  function spots(g, W, H, t) {
    [[120, C.pink, 0.8], [680, C.cyan, 1.1], [400, C.sun, 0.6]].forEach(([x, col, sp], i) => {
      const tx = W / 2 + Math.sin(t * sp + i * 2) * 260;
      g.fillStyle = Art.alpha(col, 0.06);
      g.beginPath(); g.moveTo(x, -10); g.lineTo(tx - 90, H - 70); g.lineTo(tx + 90, H - 70); g.closePath(); g.fill();
    });
  }
  /** Move from a to b with a hop. */
  function hop(a, b, u, h = 70) { const e = ease.inOut(clamp(u)); return [lerp(a[0], b[0], e), lerp(a[1], b[1], e) - Math.sin(Math.PI * clamp(u)) * h]; }
  const sway = (t, s, k = 5) => Math.sin(t * 2.6 + s) * k;
  function hold(g, a, b, alpha = 1) { if (alpha <= 0.02) return; const pr = g.globalAlpha; g.globalAlpha = pr * alpha; Art.bond(g, a[0], a[1], b[0], b[1], { width: 8, color: '#EDE4FB' }); g.globalAlpha = pr; }

  function patternRow(g, parts, cx, y, size = 46) {
    // parts: letters as colored bubbles in a text row: e.g. [['A'], '+', ['B'], '->', ['A','B']]
    const pad = size * 0.42, r = size * 0.6;
    let w = 0;
    parts.forEach((p) => { w += p === '+' ? size * 0.7 : p === '->' ? size * 1.3 : p.length * (r * 1.92) ; w += pad; });
    w -= pad;
    let x = cx - w / 2;
    parts.forEach((p) => {
      if (p === '+') { Art.text(g, '+', x + size * 0.35, y, { font: 'display', size, color: C.dim }); x += size * 0.7 + pad; return; }
      if (p === '->') { Art.arrow(g, x + 4, y, x + size * 1.26, y, { color: C.ink, w: 5.5, head: 15 }); x += size * 1.3 + pad; return; }
      p.forEach((L, i) => Art.atom(g, x + r + i * r * 1.92, y, r, L, { color: LETTER[L], label: L }));
      x += p.length * (r * 1.92) + pad;
    });
  }

  /* ---------- Story 1: the five dances ---------- */
  const MIDY = 196;
  Lab.story('#story-dance', {
    title: 'Five dances',
    bg: (g, W, H) => { const r = g.createLinearGradient(0, 0, 0, H); r.addColorStop(0, '#1F1236'); r.addColorStop(1, '#2C1B4D'); g.fillStyle = r; g.fillRect(0, 0, W, H); floor(g, W, H); },
    scenes: [
      {
        say: '<b>Combination.</b> Two partners meet and become one. Many things in, <b>one thing out</b>. Exam people also call it synthesis.',
        dur: 3.2,
        draw(g, p, t, { W }) {
          spots(g, W, 450, t);
          patternRow(g, [['A'], '+', ['B'], '->', ['A', 'B']], W / 2, 44);
          const u = seg(p, 0.15, 0.7);
          const a = hop([210, MIDY + 40], [352, MIDY + 40], u), b = hop([590, MIDY + 40], [448, MIDY + 40], u);
          hold(g, a, b, seg(p, 0.66, 0.8));
          letter(g, a[0], a[1] + sway(t, 0), 'A', 50, { t, face: u > 0.8 ? 'grin' : 'happy', look: [1, 0] });
          letter(g, b[0], b[1] + sway(t, 1), 'B', 50, { t, face: u > 0.8 ? 'grin' : 'happy', look: [-1, 0] });
          Art.burst(g, 400, MIDY + 30, seg(p, 0.65, 1), { n: 16, r: 120 });
          strip(g, 170, 376, 460, 58);
          eqRow(g, ['2Mg', '+', 'O2', '->', '2MgO'], W / 2, 405, 34);
        },
      },
      {
        say: '<b>Decomposition.</b> The opposite: one thing breaks apart, usually with a push of heat or electricity. <b>One thing in</b>, many things out.',
        dur: 3.2,
        draw(g, p, t, { W }) {
          spots(g, W, 450, t);
          patternRow(g, [['A', 'B'], '->', ['A'], '+', ['B']], W / 2, 44);
          const u = seg(p, 0.3, 0.8);
          const a = hop([352, MIDY + 40], [190, MIDY + 40], u), b = hop([448, MIDY + 40], [610, MIDY + 40], u);
          hold(g, a, b, 1 - seg(p, 0.28, 0.38));
          // A jolt of energy strikes first.
          const jolt = seg(p, 0.05, 0.3);
          if (jolt > 0 && jolt < 1) { g.strokeStyle = C.sun; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(400, 80); g.lineTo(380, 130); g.lineTo(416, 130); g.lineTo(400, MIDY - 10); g.stroke(); }
          letter(g, a[0], a[1] + sway(t, 0), 'A', 50, { t, face: u > 0.1 && u < 0.9 ? 'wow' : 'happy', look: [-1, 0] });
          letter(g, b[0], b[1] + sway(t, 1), 'B', 50, { t, face: u > 0.1 && u < 0.9 ? 'wow' : 'happy', look: [1, 0] });
          strip(g, 170, 376, 460, 58);
          eqRow(g, ['2H2O', '->', '2H2', '+', 'O2'], W / 2, 405, 34);
        },
      },
      {
        say: '<b>Single displacement.</b> A lone dancer cuts in, and someone gets left out. Look for <b>an element and a compound</b> on each side.',
        dur: 3.8,
        draw(g, p, t, { W }) {
          spots(g, W, 450, t);
          patternRow(g, [['A'], '+', ['B', 'C'], '->', ['A', 'C'], '+', ['B']], W / 2, 44, 40);
          const u = seg(p, 0.15, 0.6), v = seg(p, 0.35, 0.8);
          const a = hop([130, MIDY + 40], [360, MIDY + 40], u), b = hop([360, MIDY + 40], [640, MIDY + 40], v, 90), c = [456, MIDY + 40];
          hold(g, b, c, 1 - seg(p, 0.33, 0.42));
          hold(g, a, c, seg(p, 0.5, 0.62));
          letter(g, a[0], a[1] + sway(t, 0), 'A', 50, { t, face: 'grin', look: [1, 0] });
          letter(g, c[0], c[1] + sway(t, 2), 'C', 50, { t, look: [-1, 0] });
          letter(g, b[0], b[1] + sway(t, 1), 'B', 50, { t, face: v > 0.3 ? 'sad' : 'wow', look: [-1, 0] });
          strip(g, 170, 376, 460, 58);
          eqRow(g, ['Zn', '+', '2HCl', '->', 'ZnCl2', '+', 'H2'], W / 2, 405, 34);
        },
      },
      {
        say: '<b>Double displacement.</b> Two couples swap partners. Look for <b>two compounds</b> on each side. The cation always stays in front.',
        dur: 3.8,
        draw(g, p, t, { W }) {
          spots(g, W, 450, t);
          patternRow(g, [['A', 'B'], '+', ['C', 'D'], '->', ['A', 'D'], '+', ['C', 'B']], W / 2, 44, 36);
          const u = seg(p, 0.2, 0.8), y = MIDY + 40;
          const b = hop([258, y], [558, y], u, 90), d = hop([558, y], [258, y], u, -60);
          const a = [162, y], c = [462, y];
          hold(g, a, b, 1 - seg(p, 0.18, 0.28)); hold(g, c, d, 1 - seg(p, 0.18, 0.28));
          hold(g, a, d, seg(p, 0.72, 0.84)); hold(g, c, b, seg(p, 0.72, 0.84));
          letter(g, a[0], a[1] + sway(t, 0), 'A', 46, { t });
          letter(g, c[0], c[1] + sway(t, 3), 'C', 46, { t });
          letter(g, b[0], b[1] + sway(t, 1), 'B', 46, { t, face: u > 0 && u < 1 ? 'wow' : 'happy' });
          letter(g, d[0], d[1] + sway(t, 2), 'D', 46, { t, face: u > 0 && u < 1 ? 'wink' : 'happy' });
          strip(g, 110, 376, 580, 58);
          eqRow(g, ['AgNO3', '+', 'NaCl', '->', 'AgCl', '+', 'NaNO3'], W / 2, 405, 32);
          Art.moe(g, 730, 370, 90, 'oops', { t, flip: true });
        },
      },
      {
        say: '<b>Combustion.</b> A fuel grabs $\\ce{O2}$, and fire breaks out. When a fuel of carbon and hydrogen burns completely, the products are <b>$\\ce{CO2}$ and $\\ce{H2O}$</b>.',
        dur: 3.8,
        draw(g, p, t, { W }) {
          spots(g, W, 450, t);
          eqRow(g, ['fuel', '+', 'O2', '->', 'CO2', '+', 'H2O'], W / 2, 44, 40);
          const q = seg(p, 0.15, 0.55), out = seg(p, 0.5, 0.9), y = MIDY + 40;
          if (q < 1) {
            const c = ease.in(q);
            Art.molecule(g, lerp(190, 370, c), y - 10, 52, 'CH4', { face: 'happy', t, alpha: 1 - seg(p, 0.45, 0.55) });
            Art.molecule(g, lerp(520, 430, c), y - 72, 60, 'O2', { face: 'happy', t, rot: 0.4, alpha: 1 - seg(p, 0.45, 0.55) });
            Art.molecule(g, lerp(560, 430, c), y + 56, 60, 'O2', { face: 'happy', t, rot: -0.4, alpha: 1 - seg(p, 0.45, 0.55) });
          }
          const fl = Math.sin(Math.PI * seg(p, 0.35, 1.2));
          if (fl > 0.02) {
            for (let i = -2; i <= 2; i++) {
              const hh = (150 - Math.abs(i) * 30) * fl + Math.sin(t * 13 + i) * 12;
              Art.flame(g, 400 + i * 48, y + 96, Math.max(10, hh), t + i, { kind: 'orange' });
            }
          }
          if (out > 0) {
            Art.popIn(g, 180, y - 20, out, (gg) => Art.molecule(gg, 0, 0, 56, 'CO2', { face: 'grin', t }));
            Art.popIn(g, 620, y - 26, out, (gg) => Art.molecule(gg, 0, 0, 62, 'H2O', { face: 'grin', t }));
          }
          strip(g, 170, 376, 460, 58);
          eqRow(g, ['CH4', '+', '2O2', '->', 'CO2', '+', '2H2O'], W / 2, 405, 34);
        },
      },
      {
        say: 'That is all five. On a test, <b>count the things on each side first</b>. The shape of the equation names the dance before you read a single formula.',
        dur: 3.6,
        draw(g, p, t, { W }) {
          const rows = [
            ['Combination', [['A'], '+', ['B'], '->', ['A', 'B']], 'one product'],
            ['Decomposition', [['A', 'B'], '->', ['A'], '+', ['B']], 'one reactant'],
            ['Single', [['A'], '+', ['B', 'C'], '->', ['A', 'C'], '+', ['B']], 'a lone element'],
            ['Double', [['A', 'B'], '+', ['C', 'D'], '->', ['A', 'D'], '+', ['C', 'B']], 'two compounds'],
          ];
          rows.forEach(([name, pat, cue], i) => {
            const y = 42 + i * 72, q = seg(p, 0.03 + i * 0.13, 0.2 + i * 0.13);
            const pr = g.globalAlpha; g.globalAlpha = pr * q;
            Art.text(g, name, 24, y, { font: 'display', size: 30, align: 'left', color: C.sun });
            patternRow(g, pat, 400, y, 24);
            Art.text(g, cue, 780, y, { size: 22, align: 'right', color: C.dim, maxW: 200 });
            g.globalAlpha = pr;
          });
          const q = seg(p, 0.55, 0.72), y = 330;
          const pr = g.globalAlpha; g.globalAlpha = pr * q;
          Art.text(g, 'Combustion', 24, y, { font: 'display', size: 30, align: 'left', color: C.sun });
          Art.text(g, 'fuel + O₂ → CO₂ + H₂O', 410, y, { font: 'display', size: 28 });
          Art.text(g, 'O₂ on the left', 780, y, { size: 22, align: 'right', color: C.dim });
          g.globalAlpha = pr;
          Art.moe(g, W / 2, 448, 84, p > 0.85 ? 'cheer' : 'happy', { t });
          void rand;
        },
      },
    ],
  });

  /* ---------- Parts: an atom, or a polyatomic ion that moves as one ---------- */
  const POLY = {
    NO3: [['N', 0, 0, 0.5], ['O', -0.62, 0.42, 0.4], ['O', 0.62, 0.42, 0.4], ['O', 0, -0.74, 0.4]],
    SO4: [['S', 0, 0, 0.5], ['O', -0.66, -0.5, 0.4], ['O', 0.66, -0.5, 0.4], ['O', -0.66, 0.5, 0.4], ['O', 0.66, 0.5, 0.4]],
    OH: [['O', -0.18, 0, 0.62], ['H', 0.62, 0, 0.4]],
  };
  const baseR = { H: 15, C: 20, N: 20, O: 20, Cl: 24, Br: 25, Na: 26, Mg: 26, Zn: 26, Cu: 26, Ag: 27, Ca: 27, Ba: 29, NO3: 30, SO4: 32, OH: 24 };
  function drawPart(g, name, x, y, k, o = {}) {
    const r = (baseR[name] || 22) * k;
    if (POLY[name]) {
      g.save(); g.setLineDash([5, 5]); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r * 1.28, 0, TAU); g.stroke(); g.restore();
      POLY[name].forEach(([s, u, v, f]) => Art.atom(g, x + u * r, y + v * r, r * f, s, { label: r * f >= 11 ? s : false }));
      return;
    }
    Art.atom(g, x, y, r, name, { face: o.face && r >= 18 ? o.face : null, t: o.t, seed: x, label: r >= 11 ? name : false });
  }
  function molLayout(parts, x, y, d) {
    const n = parts.length;
    if (n === 1) return [[x, y]];
    if (n === 2) return [[x - d * 0.55, y], [x + d * 0.55, y]];
    if (n === 3) return [[x, y - d * 0.2], [x - d * 0.86, y + d * 0.34], [x + d * 0.86, y + d * 0.34]];
    if (n === 4) return [[x, y], [x - d * 0.92, y + d * 0.22], [x + d * 0.92, y + d * 0.22], [x, y - d * 0.92]];
    if (n === 5) return [[x, y], [x, y - d], [x + d, y], [x, y + d], [x - d, y]];
    // Longer chains: carbons along a row with the rest above and below.
    const out = [], cs = parts.filter((p) => p === 'C').length, others = n - cs;
    let ci = 0, oi = 0;
    parts.forEach((p) => {
      if (p === 'C') { out.push([x + (ci - (cs - 1) / 2) * d, y]); ci++; }
      else { const col = Math.floor(oi / 2), side = oi % 2 ? 1 : -1; out.push([x + (col - ((others / 2) - 1) / 2) * d * 0.9, y + side * d * 0.95]); oi++; }
    });
    return out;
  }
  /** Fit a list of molecules in a box, and return part positions with their mol index. */
  function placeMols(mols, x0, y0, x1, y1) {
    const n = mols.length, big = Math.max(...mols.map((m) => m.length));
    const cols = n <= 2 ? n : Math.ceil(Math.sqrt(n * 1.2)), rows = Math.ceil(n / cols);
    const cw = (x1 - x0) / cols, ch = (y1 - y0) / rows;
    const d = clamp(Math.min(cw / (big > 5 ? 4.6 : big > 2 ? 2.9 : 2.2), ch / (big > 2 ? 2.7 : 1.7)), 24, 62);
    const out = [];
    mols.forEach((m, i) => {
      const col = i % cols, row = Math.floor(i / cols), inRow = row < rows - 1 ? cols : n - cols * (rows - 1);
      const cx = (x0 + x1) / 2 + (col - (inRow - 1) / 2) * cw, cy = y0 + ch * (row + 0.5);
      molLayout(m, cx, cy, d).forEach((pos, k) => out.push({ name: m[k], x: pos[0], y: pos[1], mol: i }));
    });
    return { list: out, k: clamp(d / 36, 0.6, 1.4) };
  }
  function buildFloor(ex) {
    const L = placeMols(ex.L, 16, 96, 384, 346), R = placeMols(ex.R, 416, 96, 784, 346);
    const parts = L.list.map((a) => ({ name: a.name, x0: a.x, y0: a.y, mol0: a.mol }));
    const free = R.list.map((b) => Object.assign({}, b, { used: false }));
    parts.forEach((a) => {
      let best = null, bd = 1e9;
      free.forEach((b) => { if (!b.used && b.name === a.name) { const d = Math.hypot(b.x - a.x0, b.y - a.y0); if (d < bd) { bd = d; best = b; } } });
      if (!best) throw new Error('Parts do not match in ' + ex.label);
      best.used = true; a.x1 = best.x; a.y1 = best.y; a.mol1 = best.mol;
    });
    if (free.some((b) => !b.used)) throw new Error('Parts do not match in ' + ex.label);
    return { parts, k0: L.k, k1: R.k };
  }
  const H2O = ['O', 'H', 'H'];
  const EX = {
    combo: [
      { label: 'Mg + O₂', L: [['Mg'], ['Mg'], ['O', 'O']], R: [['Mg', 'O'], ['Mg', 'O']], eq: ['2Mg', '+', 'O2', '->', '2MgO'], see: 'A blinding white flame, then a white powder.', scene: { type: 'flame', color: 'white' } },
      { label: 'Na + Cl₂', L: [['Na'], ['Na'], ['Cl', 'Cl']], R: [['Na', 'Cl'], ['Na', 'Cl']], eq: ['2Na', '+', 'Cl2', '->', '2NaCl'], see: 'A soft metal and a green gas give white table salt.', scene: { type: 'flame', color: 'yellow' } },
      { label: 'N₂ + H₂', L: [['N', 'N'], ['H', 'H'], ['H', 'H'], ['H', 'H']], R: [['N', 'H', 'H', 'H'], ['N', 'H', 'H', 'H']], eq: ['N2', '+', '3H2', '->', '2NH3'], see: 'Ammonia, made by the megaton for fertilizer.', scene: { type: 'beaker', c0: 'rgba(120,120,140,.2)', c1: 'rgba(160,200,255,.35)', bubbles: true } },
    ],
    decomp: [
      { label: 'H₂O', L: [H2O, H2O], R: [['H', 'H'], ['H', 'H'], ['O', 'O']], eq: ['2H2O', '->', '2H2', '+', 'O2'], see: 'With electricity, bubbles of hydrogen and oxygen rise.', scene: { type: 'beaker', c0: '#46B9F0', c1: '#46B9F0', bubbles: true } },
      { label: 'CaCO₃', L: [['Ca', 'C', 'O', 'O', 'O']], R: [['Ca', 'O'], ['O', 'C', 'O']], eq: ['CaCO3', '->', 'CaO', '+', 'CO2'], see: 'Hot limestone gives off carbon dioxide and leaves lime.', scene: { type: 'beaker', c0: 'rgba(240,235,225,.9)', c1: 'rgba(250,250,250,.65)', flame: true } },
      { label: 'H₂O₂', L: [['O', 'O', 'H', 'H'], ['O', 'O', 'H', 'H']], R: [H2O, H2O, ['O', 'O']], eq: ['2H2O2', '->', '2H2O', '+', 'O2'], see: 'It fizzes with oxygen when it touches yeast or liver.', scene: { type: 'beaker', c0: '#BFE6FF', c1: '#BFE6FF', bubbles: true } },
    ],
    single: [
      { label: 'Zn + HCl', L: [['Zn'], ['H', 'Cl'], ['H', 'Cl']], R: [['Zn', 'Cl', 'Cl'], ['H', 'H']], eq: ['Zn', '+', '2HCl', '->', 'ZnCl2', '+', 'H2'], see: 'Zinc fizzes as hydrogen gas bubbles away.', scene: { type: 'beaker', c0: '#DDEBFF', c1: '#DDEBFF', bubbles: true } },
      { label: 'Zn + CuSO₄', L: [['Zn'], ['Cu', 'SO4']], R: [['Zn', 'SO4'], ['Cu']], eq: ['Zn', '+', 'CuSO4', '->', 'ZnSO4', '+', 'Cu'], see: 'The blue fades, and copper coats the zinc.', scene: { type: 'beaker', c0: '#2E8FE0', c1: '#DCEBF7', ppt: '#C9783A' } },
      { label: 'Cl₂ + NaBr', L: [['Cl', 'Cl'], ['Na', 'Br'], ['Na', 'Br']], R: [['Na', 'Cl'], ['Na', 'Cl'], ['Br', 'Br']], eq: ['Cl2', '+', '2NaBr', '->', '2NaCl', '+', 'Br2'], see: 'A clear solution turns orange as bromine forms.', scene: { type: 'beaker', c0: '#E4F2E6', c1: '#E8933A' } },
    ],
    double: [
      { label: 'AgNO₃ + NaCl', L: [['Ag', 'NO3'], ['Na', 'Cl']], R: [['Ag', 'Cl'], ['Na', 'NO3']], eq: ['AgNO3', '+', 'NaCl', '->', 'AgCl', '+', 'NaNO3'], see: 'Two clear liquids make a cloudy white solid, AgCl.', scene: { type: 'beaker', c0: '#DDEBFF', c1: '#EEF2F8', ppt: '#FFFFFF' } },
      { label: 'HCl + NaOH', L: [['H', 'Cl'], ['Na', 'OH']], R: [['Na', 'Cl'], ['H', 'OH']], eq: ['HCl', '+', 'NaOH', '->', 'NaCl', '+', 'H2O'], see: 'No color change, but the beaker warms up. Water forms.', scene: { type: 'beaker', c0: '#DDEBFF', c1: '#DDEBFF', warm: true } },
      { label: 'BaCl₂ + Na₂SO₄', L: [['Ba', 'Cl', 'Cl'], ['SO4', 'Na', 'Na']], R: [['Ba', 'SO4'], ['Na', 'Cl'], ['Na', 'Cl']], eq: ['BaCl2', '+', 'Na2SO4', '->', 'BaSO4', '+', '2NaCl'], see: 'A heavy white solid, BaSO₄, settles out.', scene: { type: 'beaker', c0: '#DDEBFF', c1: '#EEF2F8', ppt: '#FFFFFF' } },
    ],
    burn: [
      { label: 'Methane', L: [['C', 'H', 'H', 'H', 'H'], ['O', 'O'], ['O', 'O']], R: [['C', 'O', 'O'], H2O, H2O], eq: ['CH4', '+', '2O2', '->', 'CO2', '+', '2H2O'], see: 'A hot blue flame.', scene: { type: 'flame', color: 'blue' } },
      { label: 'Hydrogen', L: [['H', 'H'], ['H', 'H'], ['O', 'O']], R: [H2O, H2O], eq: ['2H2', '+', 'O2', '->', '2H2O'], see: 'A pale flame, and only water comes out. Also a combination.', scene: { type: 'flame', color: 'pale' } },
      { label: 'Propane', L: [['C', 'C', 'C', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], ['O', 'O'], ['O', 'O'], ['O', 'O'], ['O', 'O'], ['O', 'O']], R: [['C', 'O', 'O'], ['C', 'O', 'O'], ['C', 'O', 'O'], H2O, H2O, H2O, H2O], eq: ['C3H8', '+', '5O2', '->', '3CO2', '+', '4H2O'], see: 'A backyard grill.', scene: { type: 'flame', color: 'blue' } },
    ],
  };
  // Verify every animated reaction balances, using the same atom counts as the equation written beside it.
  Object.keys(EX).forEach((k) => EX[k].forEach((ex) => {
    const expand = (p) => (POLY[p] ? POLY[p].map((a) => a[0]) : [p]);
    const count = (mols) => { const c = {}; mols.forEach((m) => m.forEach((part) => expand(part).forEach((a) => { c[a] = (c[a] || 0) + 1; }))); return c; };
    const a = count(ex.L), b = count(ex.R);
    Object.keys(a).forEach((e) => { if (a[e] !== b[e]) throw new Error('Atoms do not match in ' + ex.label); });
    ex.floor = buildFloor(ex);
  }));
  const fl = { kind: 'combo', i: 0, q: 0, play: false };
  function macroScene(g, ex, q, t) {
    const S = ex.scene, x = 66, base = 464;
    if (S.type === 'flame') {
      if (S.color === 'white') { const r = Math.sin(Math.PI * q) * 40 + (q > 0.5 ? 6 : 0); if (r > 1) { Art.glow(g, x, base - 40, r * 1.5, '#FFFFFF', 0.85); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, base - 40, r * 0.35, 0, TAU); g.fill(); } }
      else { const h = 22 + Math.sin(Math.PI * q) * 66; Art.flame(g, x, base - 6, h, t, { kind: S.color === 'yellow' ? 'orange' : 'blue' }); }
      g.fillStyle = '#6E6A86'; Art.round(g, x - 26, base - 6, 52, 8, 3); g.fill();
      return;
    }
    const col = Art.mix(S.c0.startsWith('rgba') ? '#8894A8' : S.c0, S.c1.startsWith('rgba') ? '#BFD8FF' : S.c1, clamp(q));
    Art.beaker(g, x, base, 76, 88, {
      level: 0.72, liquid: col, ticks: false,
      inside: (gg, box) => {
        if (S.bubbles && q > 0.02) Art.bubbles(gg, box.x0 + 6, box.x1 - 6, box.bottom - 4, box.top + 3, t, { n: Math.ceil(q * 9), r: 3.2 });
        if (S.ppt && q > 0.2) {
          const a = seg(q, 0.2, 0.9);
          for (let i = 0; i < 26; i++) { gg.fillStyle = Art.alpha(S.ppt, a * 0.85); gg.beginPath(); gg.arc(box.x0 + 5 + rand(i) * 66, box.bottom - 4 - rand(i + 4) * 22 * a, 3, 0, TAU); gg.fill(); }
        }
      },
    });
    if (S.flame) Art.flame(g, x, base + 16, 16, t, { kind: 'blue' });
    if (S.warm && q > 0.5) Art.smoke(g, x, base - 90, t, { n: 5, h: 34, r: 7, alpha: 0.3 * q });
  }
  const floorStage = Lab.stage('#c-floor', {
    h: 480, label: 'Atoms and polyatomic ions change partners as the slider moves, with the equation above them and what you would see in the lab below.',
    draw(g, t, dt) {
      if (fl.play) {
        fl.q = Math.min(1, fl.q + dt / 3.2);
        const el = Lab.$('#floor-q'); el.value = Math.round(fl.q * 100); Lab.paintRange(el); Lab.$('#floor-q-out').textContent = Math.round(fl.q * 100) + '%';
        if (fl.q >= 1) fl.play = false;
      }
      const ex = EX[fl.kind][fl.i], F = ex.floor, q = fl.q;
      strip(g, 30, 10, 740, 62);
      eqRow(g, ex.eq, 400, 41, 34, 700);
      const k = lerp(F.k0, F.k1, ease.inOut(q));
      // Hand-holding within each molecule, fading through the middle of the move.
      const pos = (a, i) => {
        const u = ease.inOut(clamp((q - rand(i + 3) * 0.08) / 0.92)), arc = Math.sin(Math.PI * clamp(q)) * (34 + rand(i + 7) * 40) * (i % 2 ? 1 : -1);
        return [lerp(a.x0, a.x1, u), lerp(a.y0, a.y1, u) + arc];
      };
      const P = F.parts.map(pos);
      const link = (key, A) => {
        if (A <= 0.02) return;
        const groups = {};
        F.parts.forEach((a, i) => { (groups[a[key]] = groups[a[key]] || []).push(i); });
        const pr = g.globalAlpha; g.globalAlpha = pr * A;
        Object.values(groups).forEach((ids) => {
          // Join each part to the group's first part, unless a carbon chain joins along itself.
          ids.slice(1).forEach((id) => {
            const hub = ids.reduce((best, j) => (Math.hypot(P[j][0] - P[id][0], P[j][1] - P[id][1]) < Math.hypot(P[best][0] - P[id][0], P[best][1] - P[id][1]) && j !== id ? j : best), ids[0] === id ? ids[1] : ids[0]);
            Art.bond(g, P[id][0], P[id][1], P[hub][0], P[hub][1], { width: 5 });
          });
        });
        g.globalAlpha = pr;
      };
      // Faint ghosts show where everything is headed, or where it came from.
      const ghEnd = 0.16 * (1 - seg(q, 0.25, 0.75)), ghStart = 0.16 * seg(q, 0.25, 0.75);
      F.parts.forEach((a) => {
        const pr = g.globalAlpha;
        if (ghEnd > 0.01) { g.globalAlpha = pr * ghEnd; drawPart(g, a.name, a.x1, a.y1, F.k1); }
        if (ghStart > 0.01) { g.globalAlpha = pr * ghStart; drawPart(g, a.name, a.x0, a.y0, F.k0); }
        g.globalAlpha = pr;
      });
      link('mol0', 1 - seg(q, 0.04, 0.2));
      link('mol1', seg(q, 0.8, 0.96));
      const mid = Math.sin(Math.PI * q);
      if (mid > 0.02) Art.glow(g, 400, 220, 190 * mid + 30, fl.kind === 'burn' ? '#FF8A2B' : C.violet, 0.3 * mid);
      F.parts.forEach((a, i) => drawPart(g, a.name, P[i][0], P[i][1], k, { t, face: (F.parts.length <= 6) ? (mid > 0.2 ? 'wow' : 'happy') : null }));
      if (q < 0.04) Art.arrow(g, 382, 220, 418, 220, { color: C.pink, w: 6 });
      // The lab view along the bottom.
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 366, 800, 114);
      macroScene(g, ex, q, t);
      Art.text(g, 'What you would see', 132, 390, { size: 21, align: 'left', color: C.dim });
      Art.para(g, ex.see, 132, 412, 650, { size: 25, align: 'left', color: C.ink });
    },
  });
  function resetFloor() { fl.q = 0; fl.play = false; const el = Lab.$('#floor-q'); el.value = 0; Lab.paintRange(el); Lab.$('#floor-q-out').textContent = '0%'; }
  function paintEx() {
    Lab.$('#floor-ex').innerHTML = EX[fl.kind].map((e, i) => `<button type="button" data-value="${i}" aria-pressed="${i === fl.i}">${e.label}</button>`).join('');
    Lab.$$('#floor-ex button').forEach((b) => b.addEventListener('click', () => {
      fl.i = +b.dataset.value;
      Lab.$$('#floor-ex button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      resetFloor(); paintFloorFoot(); Lab.sound.pop();
    }));
    paintFloorFoot();
  }
  function paintFloorFoot() {
    const T = Chem.KIND[fl.kind];
    Lab.$('#floor-foot').innerHTML = `<p><b>${T.name[0].toUpperCase() + T.name.slice(1)}.</b> ${T.shape} ${fl.kind === 'single' || fl.kind === 'double' ? 'A simplified 2D model: in water, ions drift apart rather than sitting in pairs.' : 'A simplified 2D model.'}</p>`;
  }
  Lab.segmented('#floor-type', (v) => { fl.kind = v; fl.i = 0; resetFloor(); paintEx(); });
  Lab.bind('#floor-q', '#floor-q-out', (v) => v + '%', (v) => { fl.q = v / 100; fl.play = false; });
  Lab.$('#floor-play').addEventListener('click', () => { if (fl.q >= 1) fl.q = 0; fl.play = true; Lab.sound.pop(); });
  paintEx();
  void floorStage;

  /* ---------- Bench: name that dance ---------- */
  const game = { deck: [], i: 0, score: 0, answered: null, tAns: -9, over: false };
  function newDeck() {
    const by = Object.keys(Chem.POOL).map((k) => Chem.POOL[k]().slice().sort(() => Math.random() - 0.5));
    const deck = [];
    for (let i = 0; i < 2; i++) by.forEach((list) => deck.push(list[i]));
    game.deck = deck.sort(() => Math.random() - 0.5);
    game.i = 0; game.score = 0; game.answered = null; game.over = false;
    paintGame();
  }
  const sortStage = Lab.stage('#c-sort', {
    h: 380, label: 'A chemical equation, how many things are on each side, and your score.',
    draw(g, t) {
      if (game.over) {
        const n = game.deck.length, ok = game.score >= 8;
        Art.text(g, `${game.score} of ${n}`, 400, 90, { font: 'display', size: 76, color: ok ? C.leaf : C.sun });
        Art.text(g, game.score === n ? 'A perfect dance card.' : ok ? 'You can spot them by shape.' : 'Count things on each side, then try again.', 400, 170, { size: 30 });
        Art.moe(g, 400, 370, 170, ok ? 'cheer' : 'think', { t });
        return;
      }
      const x = game.deck[game.i];
      if (!x) return;
      Art.text(g, `Equation ${game.i + 1} of ${game.deck.length}`, 30, 32, { size: 24, align: 'left', color: C.dim });
      Art.text(g, `Score ${game.score}`, 770, 32, { font: 'display', size: 30, align: 'right', color: C.sun });
      strip(g, 24, 74, 752, 96, game.answered === null ? {} : { stroke: game.answered ? C.leaf : C.red });
      eqRow(g, eqItems(x), 400, 122, 44, 720);
      // The shape of the equation: how many things on each side.
      const sa = game.answered === null ? 0.35 : 1;
      const pr = g.globalAlpha; g.globalAlpha = pr * sa;
      const dots = (cx, n, lone) => {
        for (let i = 0; i < n; i++) {
          const dx = cx + (i - (n - 1) / 2) * 58;
          g.fillStyle = lone && lone[i] ? C.sun : C.violet;
          g.beginPath(); g.arc(dx, 232, 22, 0, TAU); g.fill();
          g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.stroke();
        }
      };
      const isEl = (f) => Object.keys(Bank.countAtoms(f)).length === 1;
      dots(240, x.L.length, x.L.map(isEl)); dots(560, x.R.length, x.R.map(isEl));
      Art.arrow(g, 372, 232, 428, 232, { color: C.ink, w: 6 });
      g.globalAlpha = pr;
      Art.text(g, 'the shape: a yellow dot is a lone element', 400, 278, { size: 22, color: C.dim, alpha: sa });
      if (game.answered !== null) {
        Art.burst(g, 400, 122, clamp((t - game.tAns) / 1.1), { n: game.answered ? 20 : 0, r: 200 });
        Art.text(g, game.answered ? 'Yes!' : 'Not this one', 400, 322, { font: 'display', size: 40, color: game.answered ? C.leaf : C.red });
      } else Art.text(g, 'Which dance is it?', 400, 322, { font: 'display', size: 34 });
    },
  });
  function paintGame() {
    const foot = Lab.$('#sort-foot');
    const btns = Lab.$$('#sort-btns [data-kind]');
    btns.forEach((b) => { b.hidden = game.over; b.disabled = game.answered !== null; b.classList.remove('sun'); });
    Lab.$('#sort-next').hidden = game.answered === null || game.over;
    Lab.$('#sort-again').hidden = !game.over;
    if (game.over) foot.innerHTML = `<p>Finished. ${game.score >= 8 ? 'That earns a new element.' : 'Score 8 or more for a new element.'}</p>`;
    else if (game.answered === null) foot.innerHTML = '<p>One product? One reactant? A lone element? Oxygen burning a fuel? Look at the shape first.</p>';
    else {
      const k = game.deck[game.i].kind, T = Chem.KIND[k], twoHats = k === 'combo' && game.deck[game.i].L.includes('O2');
      foot.innerHTML = `<p>This is <b>${T.name}</b>. ${T.shape}${twoHats ? ' It is also combustion, since something burns in oxygen.' : ''}</p>`;
    }
    void sortStage;
  }
  Lab.$$('#sort-btns [data-kind]').forEach((b) => b.addEventListener('click', () => {
    if (game.answered !== null || game.over) return;
    const cur = game.deck[game.i];
    // Burning in O2 to one product wears two hats, as the lesson says, so either answer counts.
    const ok = b.dataset.kind === cur.kind || (cur.kind === 'combo' && b.dataset.kind === 'burn' && cur.L.includes('O2'));
    game.answered = ok; game.tAns = sortStage.t;
    if (ok) { game.score++; Lab.sound.good(); } else Lab.sound.bad();
    Lab.$(`#sort-btns [data-kind="${game.deck[game.i].kind}"]`).classList.add('sun');
    paintGame();
    Lab.$(`#sort-btns [data-kind="${game.deck[game.i].kind}"]`).classList.add('sun');
  }));
  Lab.$('#sort-next').addEventListener('click', () => {
    if (game.i >= game.deck.length - 1) { game.over = true; if (game.score >= 8) Lab.collection.award(1); if (game.score === game.deck.length) Lab.confetti(); }
    else game.i++;
    game.answered = null;
    paintGame();
  });
  Lab.$('#sort-again').addEventListener('click', newDeck);
  newDeck();

  /* ---------- Story 2: predicting products ---------- */
  const ionTile = (g, x, y, sym, txt, col, q) => Art.popIn(g, x, y, q, (gg) => {
    Art.atom(gg, 0, 0, 34, sym, { label: sym });
    Art.pill(gg, txt, 26, -30, { size: 22, font: 'display', color: col, text: '#fff', pad: 12 });
  });
  Lab.story('#story-predict', {
    title: 'Aluminum meets copper(II) chloride',
    scenes: [
      {
        say: '<b>Name the pattern.</b> A lone element plus a compound. That is single displacement: $\\ce{A + BC}$ $\\rightarrow$ $\\ce{AC + B}$.',
        dur: 2.8,
        draw(g, p, t, { W }) {
          eqRow(g, ['Al', '+', 'CuCl2', '->', '?'], W / 2, 52, 50);
          patternRow(g, [['A'], '+', ['B', 'C'], '->', ['A', 'C'], '+', ['B']], W / 2, 150, 34);
          Art.atom(g, 160, 290, 44, 'Al', { face: 'grin', t, look: [1, 0], label: 'Al' });
          Art.atom(g, 380, 290, 42, 'Cu', { face: 'happy', t, label: 'Cu' });
          Art.atom(g, 460, 256, 30, 'Cl'); Art.atom(g, 460, 330, 30, 'Cl');
          Art.text(g, 'lone element', 160, 370, { size: 26, color: C.sun, alpha: seg(p, 0.3, 0.6) });
          Art.text(g, 'compound', 420, 390, { size: 26, color: C.cyan, alpha: seg(p, 0.45, 0.75) });
          Art.moe(g, 680, 430, 150, 'point', { t, flip: true });
        },
      },
      {
        say: '<b>Swap partners.</b> Aluminum takes copper\'s place beside the chlorine, and copper ends up alone. You know who is with whom, but not yet how many.',
        dur: 3.2,
        draw(g, p, t, { W }) {
          eqRow(g, ['Al', '+', 'CuCl2', '->', { t: 'AlCl', hi: C.pink }, '+', 'Cu'], W / 2, 52, 44);
          const u = seg(p, 0.1, 0.6), v = seg(p, 0.28, 0.8);
          const a = hop([140, 270], [360, 270], u, 60), b = hop([360, 270], [650, 270], v, 90);
          Art.atom(g, 450, 234, 30, 'Cl'); Art.atom(g, 450, 306, 30, 'Cl');
          Art.atom(g, b[0], b[1], 42, 'Cu', { face: v > 0.3 ? 'sad' : 'wow', t, label: 'Cu', look: [-1, 0] });
          Art.atom(g, a[0], a[1], 44, 'Al', { face: 'grin', t, label: 'Al', look: [1, 0] });
          Art.text(g, 'How many Cl for each Al?', W / 2, 400, { font: 'display', size: 32, color: C.sun, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: '<b>Fix the formula with charges.</b> $\\ce{Al^3+}$ carries +3 and each $\\ce{Cl-}$ carries −1. It takes three chlorides to cancel, so the formula is $\\ce{AlCl3}$.',
        dur: 3.6,
        draw(g, p, t, { W }) {
          eqRow(g, ['Al', '+', 'CuCl2', '->', { t: 'AlCl3', hi: C.leaf }, '+', 'Cu'], W / 2, 52, 44);
          ionTile(g, 170, 210, 'Al', '3+', '#FF3D7F', seg(p, 0.05, 0.25));
          [0, 1, 2].forEach((i) => ionTile(g, 390 + i * 124, 210, 'Cl', '−', '#1FA5FF', seg(p, 0.25 + i * 0.13, 0.4 + i * 0.13)));
          const a = seg(p, 0.7, 0.9);
          Art.text(g, '+3', 170, 310, { font: 'display', size: 50, color: '#FF7CA8', alpha: a });
          Art.text(g, '+', 280, 310, { font: 'display', size: 44, color: C.dim, alpha: a });
          Art.text(g, '(−1) × 3', 514, 310, { font: 'display', size: 50, color: '#6FC3FF', alpha: a });
          Art.text(g, '= 0', 696, 310, { font: 'display', size: 50, color: C.leaf, alpha: a });
          strip(g, 170, 366, 460, 58);
          Art.text(g, 'A compound has no net charge', W / 2, 395, { size: 28, alpha: a });
        },
      },
      {
        say: '<b>Then balance.</b> Only now touch the coefficients. Cl needs a common count, and 2 and 3 share 6. Result: $\\ce{2Al + 3CuCl2}$ $\\rightarrow$ $\\ce{2AlCl3 + 3Cu}$.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          const x = Chem.single('Al', 'Cu', 'Cl');
          eqRow(g, eqItems(x).map((it) => ({ t: it, hi: it === '->' || it === '+' ? null : C.leaf })), W / 2, 52, 40);
          const { co } = x, Al = co[0], Cu = co[1], Cl = co[1] * 2;
          [['Al', Al, co[2], 160], ['Cu', Cu, co[3], 240], ['Cl', Cl, co[2] * 3, 320]].forEach(([sym, L, R, y], i) => {
            const q = seg(p, 0.1 + i * 0.22, 0.3 + i * 0.22);
            const pr = g.globalAlpha; g.globalAlpha = pr * q;
            for (let k = 0; k < L; k++) Art.ball(g, 322 - k * 40, y, 17, Art.elementColor(sym));
            Art.text(g, String(L), 356, y, { font: 'display', size: 38, color: C.leaf });
            Art.atom(g, 400, y, 25, sym, { label: sym });
            Art.text(g, String(R), 444, y, { font: 'display', size: 38, color: C.leaf });
            for (let k = 0; k < R; k++) Art.ball(g, 478 + k * 40, y, 17, Art.elementColor(sym));
            g.globalAlpha = pr;
          });
          Art.text(g, 'Same atoms on both sides', W / 2, 392, { font: 'display', size: 32, color: C.leaf, alpha: seg(p, 0.75, 0.95) });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: the prediction lab ---------- */
  const RAD = { H: 0.42, C: 0.56, N: 0.55, O: 0.54, Cl: 0.62, S: 0.62 };
  const shapes = new Map();
  function shapeOf(f) {
    if (shapes.has(f)) return shapes.get(f);
    const known = Art.moleculeData(f);
    let list;
    if (known) list = known.a.map(([sym, x, y]) => ({ sym, x, y, r: RAD[sym] || 0.66 }));
    else {
      const counts = Bank.countAtoms(f), syms = Object.keys(counts).sort((a, b) => EL[b].mass - EL[a].mass), seq = [];
      syms.forEach((s) => { for (let i = 0; i < counts[s]; i++) seq.push(s); });
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
  function drawShape(g, f, x, y, box) {
    const sh = shapeOf(f), k = Math.min(box / sh.w, box / sh.h, 42);
    sh.atoms.forEach((a) => { const r = a.r * k; Art.atom(g, x + (a.x - sh.cx) * k, y + (a.y - sh.cy) * k, r, a.sym, { label: r >= 11 ? a.sym : false }); });
  }
  const lab = { kind: 'combo', x: null, reveal: false, tReveal: -9, verdict: null };
  const PATTERN = {
    combo: [['A'], '+', ['B'], '->', ['A', 'B']], decomp: [['A', 'B'], '->', ['A'], '+', ['B']],
    single: [['A'], '+', ['B', 'C'], '->', ['A', 'C'], '+', ['B']], double: [['A', 'B'], '+', ['C', 'D'], '->', ['A', 'D'], '+', ['C', 'B']],
  };
  const labStage = Lab.stage('#c-lab', {
    h: 400, label: 'The reactants, the pattern they follow, and, once revealed, the products with a balanced equation.',
    draw(g, t) {
      const x = lab.x;
      if (!x) return;
      const q = lab.reveal ? clamp((t - lab.tReveal) * 2.4) : 0;
      if (lab.reveal) eqRow(g, eqItems(x), 400, 44, 38);
      else eqRow(g, x.L.reduce((a, f, i) => (i ? a.concat(['+', f]) : [f]), []).concat(['->', '?']), 400, 44, 40);
      if (PATTERN[x.kind]) patternRow(g, PATTERN[x.kind], 400, 112, 26);
      else Art.text(g, 'fuel + O₂ → CO₂ + H₂O', 400, 112, { font: 'display', size: 28, color: C.dim });
      const left = x.L, right = x.R;
      left.forEach((f, i) => {
        const cx = 200 + (i - (left.length - 1) / 2) * 170;
        drawShape(g, f, cx, 226, 120);
        Art.formula(g, f, cx, 322, { size: 26, colorize: true });
      });
      Art.arrow(g, 382, 226, 428, 226, { color: C.pink, w: 7 });
      right.forEach((f, i) => {
        const cx = 600 + (i - (right.length - 1) / 2) * (right.length > 2 ? 112 : 165);
        if (q > 0) {
          Art.popIn(g, cx, 226, q, (gg) => drawShape(gg, f, 0, 0, right.length > 2 ? 90 : 120));
          Art.formula(g, f, cx, 322, { size: 26, colorize: true });
        } else {
          g.save(); g.setLineDash([9, 9]); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, 226, right.length > 2 ? 42 : 56, 0, TAU); g.stroke(); g.restore();
          Art.text(g, '?', cx, 228, { font: 'display', size: 46, color: C.faint });
        }
      });
      if (lab.verdict === true) {
        strip(g, 220, 346, 360, 46, { fill: 'rgba(30,110,70,.9)', stroke: C.leaf });
        Art.text(g, 'Correct prediction', 400, 370, { font: 'display', size: 28, color: '#fff' });
        Art.burst(g, 600, 226, clamp((t - lab.tReveal) / 1.1), { n: 20, r: 170 });
      } else if (lab.reveal) {
        strip(g, 150, 346, 500, 46);
        Art.text(g, Chem.KIND[x.kind].name, 400, 370, { font: 'display', size: 28, color: C.sun });
      }
    },
  });
  function labNew() {
    const list = Chem.POOL[lab.kind]();
    let x = list[Math.floor(Math.random() * list.length)];
    if (lab.x && lab.x.L.join() === x.L.join()) x = list[(list.indexOf(x) + 1) % list.length];
    lab.x = x; lab.reveal = false; lab.verdict = null;
    Lab.$('#lab-in').value = '';
    Lab.$('#lab-foot').innerHTML = `<p>${Chem.KIND[lab.kind].shape} Write the formula of each product. Coefficients are optional here.</p>`;
  }
  const norm = (s) => s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).replace(/\s/g, '').replace(/^\d+/, '');
  function labCheck() {
    const raw = Lab.$('#lab-in').value.trim(), x = lab.x;
    if (!raw) { Lab.$('#lab-foot').innerHTML = '<p>Type your products in the box first.</p>'; return; }
    const typed = raw.split('+').map(norm).sort(), want = x.R.slice().sort();
    const ok = typed.length === want.length && typed.every((f, i) => f === want[i]);
    if (ok) {
      lab.reveal = true; lab.verdict = true; lab.tReveal = labStage.t;
      Lab.collection.award(1);
      Lab.$('#lab-foot').innerHTML = Lab.texString(`<p><b>Correct!</b> Balanced, it reads ${Chem.eqTex(x.L, x.R, x.co)}.</p>`);
      return;
    }
    Lab.sound.bad();
    const lower = (a) => a.map((s) => s.toLowerCase()).join();
    const close = lower(typed) === lower(want);
    let msg;
    if (close) msg = 'The letters are right, but check your capitals. Each element symbol starts with one capital letter.';
    else if (typed.length !== want.length) msg = `This reaction has ${want.length} product${want.length > 1 ? 's' : ''}. ${Chem.KIND[x.kind].shape}`;
    else if (x.kind === 'single' || x.kind === 'double' || x.kind === 'combo') msg = 'Check your subscripts. They come from the ion charges, not from the reactants. The total charge in each compound must be zero.';
    else msg = `Think about the pattern again. ${Chem.KIND[x.kind].shape}`;
    Lab.$('#lab-foot').innerHTML = Lab.texString(`<p>${msg}</p>`);
  }
  Lab.segmented('#lab-kind', (v) => { lab.kind = v; labNew(); });
  Lab.$('#lab-check').addEventListener('click', labCheck);
  Lab.$('#lab-in').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); labCheck(); } });
  Lab.$('#lab-new').addEventListener('click', () => { labNew(); Lab.sound.pop(); });
  Lab.$('#lab-show').addEventListener('click', () => {
    const x = lab.x;
    lab.reveal = true; lab.verdict = null; lab.tReveal = labStage.t;
    Lab.$('#lab-foot').innerHTML = Lab.texString(`<p>Balanced, it reads ${Chem.eqTex(x.L, x.R, x.co)}. Try the next one yourself.</p>`);
  });
  labNew();
});
