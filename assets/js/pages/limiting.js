/* Lesson 4.5: Limiting reactants and yield. Sandwiches, a molecule reactor, the mass surprise, and percent yield. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const PI = Math.PI;
  const TAU = PI * 2;

  /* ---------- Molecule shapes and drawing ---------- */
  const RADIUS = { H: 0.56, C: 0.82, N: 0.8, O: 0.78, F: 0.72, Cl: 0.98, S: 1, Na: 1.1, Br: 1.05, I: 1.15, P: 1, Mg: 1.05, Al: 1, Fe: 1.05, Zn: 0.95 };
  const single = (s) => ({ a: [[s, 0, 0]], b: [] });
  const EXTRA = {
    Na: single('Na'), Mg: single('Mg'), Fe: single('Fe'), Al: single('Al'), Zn: single('Zn'),
    MgO: { a: [['Mg', -0.52, 0], ['O', 0.52, 0]], b: [] },
    ZnI2: { a: [['I', -1.3, 0], ['I', 1.3, 0], ['Zn', 0, 0]], b: [] },
  };
  const shapeOf = (f) => EXTRA[f] || Art.moleculeData(f);
  const atomR = (sym, s, style, scale) => (RADIUS[sym] || 0.9) * s * (style === 'ball' ? 0.42 : 0.62) * (scale || (style === 'ball' ? 1 : 1.28));
  function atomsAt(f, x, y, s, rot = 0) {
    const m = shapeOf(f), c = Math.cos(rot), d = Math.sin(rot);
    return m.a.map(([sym, ax, ay]) => ({ sym, x: x + (ax * c - ay * d) * s, y: y + (ax * d + ay * c) * s }));
  }
  function mol(g, f, x, y, s, o = {}) {
    const style = o.style || 'fill', pts = atomsAt(f, x, y, s, o.rot || 0), m = shapeOf(f);
    const prev = g.globalAlpha;
    if (o.alpha !== undefined) g.globalAlpha = prev * o.alpha;
    if (style === 'ball') m.b.forEach(([i, j, ord]) => Art.bond(g, pts[i].x, pts[i].y, pts[j].x, pts[j].y, { order: ord, width: Math.max(3, s * 0.11) }));
    pts.map((_, i) => i).sort((a, b) => (pts[a].sym === 'H' ? 1 : 0) - (pts[b].sym === 'H' ? 1 : 0)).forEach((i) => {
      const p = pts[i], r = atomR(p.sym, s, style, o.atomScale);
      Art.atom(g, p.x, p.y, r, p.sym, { label: o.labels === false ? false : (r >= 11 ? p.sym : false), face: o.face && i === (o.faceAt || 0) && r >= 16 ? o.face : null, look: o.look, t: o.t, seed: i + (o.seed || 0) });
    });
    g.globalAlpha = prev;
  }
  function extent(f, s, style) {
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    atomsAt(f, 0, 0, s).forEach((p) => { const r = atomR(p.sym, s, style); x0 = Math.min(x0, p.x - r); x1 = Math.max(x1, p.x + r); y0 = Math.min(y0, p.y - r); y1 = Math.max(y1, p.y + r); });
    return { w: x1 - x0, h: y1 - y0 };
  }

  /* ---------- Flying atoms: every atom on the left is literally moved to the right ---------- */
  function plan(before, after, s) {
    const src = [], dst = [];
    before.forEach((m) => atomsAt(m.f, m.x, m.y, s, m.rot).forEach((p) => src.push(p)));
    after.forEach((m) => atomsAt(m.f, m.x, m.y, s, m.rot).forEach((p) => dst.push(p)));
    const used = new Array(src.length).fill(false);
    const atoms = dst.map((d, k) => {
      let best = -1, bd = 1e12;
      src.forEach((a, i) => { if (used[i] || a.sym !== d.sym) return; const dd = (a.x - d.x) ** 2 + (a.y - d.y) ** 2; if (dd < bd) { bd = dd; best = i; } });
      if (best < 0) throw new Error('Atoms not conserved at ' + d.sym);
      used[best] = true;
      return { sym: d.sym, x0: src[best].x, y0: src[best].y, x1: d.x, y1: d.y, seed: k * 1.37 + 3, delay: rand(k * 2.3 + 1) };
    });
    if (used.some((u) => !u)) throw new Error('Atoms not conserved: leftovers');
    return { atoms, s, order: atoms.map((_, i) => i).sort((a, b) => (atoms[a].sym === 'H' ? 1 : 0) - (atoms[b].sym === 'H' ? 1 : 0)) };
  }
  function drawRun(g, run, q, o = {}) {
    const t = o.t || 0, fly = seg(q, 0.14, 0.88), shake = Math.sin(seg(q, 0, 0.14) * PI) * (o.shake === undefined ? 3 : o.shake);
    run.order.forEach((i) => {
      const a = run.atoms[i];
      const u = ease.inOut(seg(fly, a.delay * 0.28, 0.72 + a.delay * 0.28));
      const dx = a.x1 - a.x0, dy = a.y1 - a.y0, d = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(u * PI) * Math.min(46, d * 0.14) * (rand(a.seed) > 0.5 ? 1 : -1);
      const jig = u <= 0 ? shake : 0, settle = u >= 1 ? (o.settle === undefined ? 1.2 : o.settle) : 0;
      const x = lerp(a.x0, a.x1, u) + (-dy / d) * arc + wander(a.seed, t * 3) * (jig + settle);
      const y = lerp(a.y0, a.y1, u) + (dx / d) * arc + wander(a.seed + 9, t * 3) * (jig + settle);
      const r = atomR(a.sym, run.s, 'fill');
      Art.atom(g, x, y, r, a.sym, { label: o.labels === false ? false : (r >= 11 ? a.sym : false), glow: u > 0 && u < 1 ? 0.5 : 0 });
    });
  }

  /* ---------- Text helpers ---------- */
  function cform(g, f, x, y, o = {}) {
    const size = o.size || 30, toks = f.match(/[A-Z][a-z]?|\d+|[()]/g) || [];
    const font = (s) => `400 ${s}px ${Art.FONT_DISPLAY}`;
    const widths = toks.map((k) => { g.font = font(/^\d/.test(k) ? size * 0.66 : size); return g.measureText(k).width; });
    const total = widths.reduce((a, b) => a + b, 0);
    if (o.measure) return total;
    let cx = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
    const prev = g.globalAlpha;
    if (o.alpha !== undefined) g.globalAlpha = prev * o.alpha;
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const base = y + size * 0.36;
    let last = C.ink;
    toks.forEach((k, i) => {
      const sub = /^\d/.test(k);
      if (!sub && /[A-Z]/.test(k)) { last = Art.elementColor(k); if (Art.lum(last) < 0.5) last = Art.mix(last, '#ffffff', 0.55); }
      g.font = font(sub ? size * 0.66 : size);
      if (o.halo) { g.lineJoin = 'round'; g.lineWidth = size * 0.16; g.strokeStyle = 'rgba(23,12,41,.9)'; g.strokeText(k, cx, sub ? base + size * 0.2 : base); }
      g.fillStyle = o.color || (/[()]/.test(k) ? C.ink : last);
      g.fillText(k, cx, sub ? base + size * 0.2 : base);
      cx += widths[i];
    });
    g.globalAlpha = prev;
    return total;
  }
  /** A line mixing plain text and colored formulas. parts: ['text', { f: 'H2' }, 'more text']. */
  function rich(g, parts, x, y, o = {}) {
    const size = o.size || 26;
    const widths = parts.map((p) => {
      if (typeof p === 'string') { g.font = `400 ${size}px ${Art.FONT_DISPLAY}`; return g.measureText(p).width; }
      return cform(g, p.f, 0, 0, { size, measure: true });
    });
    const total = widths.reduce((a, b) => a + b, 0);
    if (o.measure) return total;
    let cx = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
    parts.forEach((p, i) => {
      if (typeof p === 'string') Art.text(g, p, cx, y, { font: 'display', size, align: 'left', color: o.color, alpha: o.alpha, halo: o.halo });
      else cform(g, p.f, cx, y, { size, align: 'left', alpha: o.alpha, halo: o.halo, color: o.flat ? o.color : undefined });
      cx += widths[i];
    });
    return total;
  }
  /** A rounded banner holding rich text. */
  function banner(g, parts, x, y, o = {}) {
    const size = o.size || 28, a = o.alpha === undefined ? 1 : o.alpha;
    if (a <= 0) return;
    const w = rich(g, parts, 0, 0, { size, measure: true }) + size * 1.2, h = size * 1.7;
    const prev = g.globalAlpha;
    g.globalAlpha = prev * a;
    g.fillStyle = o.bg || C.plum2; g.strokeStyle = o.stroke || 'rgba(255,255,255,.4)'; g.lineWidth = 3;
    Art.round(g, x - w / 2, y - h / 2, w, h, h / 2); g.fill(); g.stroke();
    g.globalAlpha = prev;
    rich(g, parts, x, y + 1, { size, color: o.color || '#fff', alpha: a, flat: o.flat });
  }
  function parseEq(s) {
    const side = (x) => x.split(' + ').map((t) => { const m = /^(\d*)(.+)$/.exec(t.trim()); return { n: m[1] ? +m[1] : 1, f: m[2] }; });
    const [l, r] = s.split(' -> ');
    const rx = { s, r: side(l), p: side(r) };
    const count = (list) => { const c = {}; list.forEach(({ n, f }) => { const a = Bank.countAtoms(f); for (const e in a) c[e] = (c[e] || 0) + a[e] * n; }); return c; };
    const a = count(rx.r), b = count(rx.p);
    Object.keys({ ...a, ...b }).forEach((e) => { if (a[e] !== b[e]) throw new Error('Unbalanced: ' + s); });
    return rx;
  }
  function equation(g, rx, cx, y, o = {}) {
    const size = o.size || 36, all = [];
    rx.r.forEach((t, i) => { if (i) all.push({ op: '+' }); all.push({ t, side: 'r', k: i }); });
    all.push({ op: '→' });
    rx.p.forEach((t, i) => { if (i) all.push({ op: '+' }); all.push({ t, side: 'p', k: i }); });
    let total = 0;
    all.forEach((a) => {
      g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
      if (a.op) a.w = g.measureText(a.op).width + size * 0.7;
      else { a.coef = a.t.n > 1 ? String(a.t.n) : ''; a.cw = a.coef ? g.measureText(a.coef).width : 0; a.fw = cform(g, a.t.f, 0, 0, { size, measure: true }); a.w = a.cw + a.fw; }
      total += a.w;
    });
    let x = cx - total / 2;
    all.forEach((a) => {
      if (a.op) Art.text(g, a.op, x + a.w / 2, y, { font: 'display', size, color: C.dim, alpha: o.alpha });
      else {
        if (a.coef) Art.text(g, a.coef, x, y, { font: 'display', size, align: 'left', color: C.sun, alpha: o.alpha });
        cform(g, a.t.f, x + a.cw, y, { size, align: 'left', alpha: o.alpha });
      }
      x += a.w;
    });
  }
  function tally(g, counts, cx, y, o = {}) {
    const keys = Object.keys(counts), size = o.size || 26, r = o.r || 17;
    g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
    const items = keys.map((k) => ({ k, w: r * 2 + 8 + g.measureText('× ' + counts[k]).width }));
    const gap = 22, tw = items.reduce((a, b) => a + b.w, 0) + gap * (items.length - 1);
    let x = cx - tw / 2;
    items.forEach((it) => {
      Art.atom(g, x + r, y, r, it.k, { alpha: o.alpha });
      Art.text(g, '× ' + counts[it.k], x + r * 2 + 8, y + 1, { font: 'display', size, align: 'left', alpha: o.alpha, color: o.color });
      x += it.w + gap;
    });
  }
  /** Count atoms from a list of molecule formulas. */
  function atomCount(list) {
    const c = {};
    list.forEach((f) => { const a = Bank.countAtoms(f); for (const e in a) c[e] = (c[e] || 0) + a[e]; });
    return c;
  }
  function stamp(g, str, x, y, q, o = {}) {
    if (q <= 0) return;
    const s = ease.back(q) * (1 + (1 - q) * 1.2);
    g.save(); g.translate(x, y); g.rotate(o.rot === undefined ? -0.14 : o.rot); g.scale(s, s); g.globalAlpha *= clamp(q * 2);
    const size = o.size || 42;
    g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
    const w = g.measureText(str).width + size * 0.9, h = size * 1.45;
    g.strokeStyle = o.color || C.red; g.lineWidth = 6; g.fillStyle = 'rgba(23,12,41,.82)';
    Art.round(g, -w / 2, -h / 2, w, h, 12); g.fill(); g.stroke();
    Art.text(g, str, 0, 2, { font: 'display', size, color: o.color || C.red });
    g.restore();
  }

  /* ---------- Sandwich art ---------- */
  function breadPath(g) {
    g.beginPath(); g.moveTo(-30, 34); g.lineTo(-30, -6);
    g.bezierCurveTo(-46, -10, -46, -38, -20, -38); g.lineTo(20, -38);
    g.bezierCurveTo(46, -38, 46, -10, 30, -6); g.lineTo(30, 34);
    g.quadraticCurveTo(30, 40, 24, 40); g.lineTo(-24, 40); g.quadraticCurveTo(-30, 40, -30, 34); g.closePath();
  }
  function bread(g, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    breadPath(g);
    g.fillStyle = '#C07A32'; g.fill(); g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.6; g.stroke();
    g.save(); g.scale(0.84, 0.84); breadPath(g);
    const gr = g.createLinearGradient(0, -38, 0, 40); gr.addColorStop(0, '#FFF1CC'); gr.addColorStop(1, '#F2D79C');
    g.fillStyle = gr; g.fill(); g.restore();
    g.fillStyle = 'rgba(190,140,70,.55)';
    [[-14, -14, 2.4], [8, -22, 2], [16, 4, 2.6], [-8, 12, 2.2], [4, 24, 2], [-18, 22, 1.8]].forEach(([a, b, r]) => { g.beginPath(); g.arc(a, b, r, 0, TAU); g.fill(); });
    if (o.face) Art.face(g, 0, -4, 34, o.face, { t: o.t, seed: o.seed, look: o.look });
    g.restore();
  }
  function cheese(g, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    g.rotate(o.rot === undefined ? 0.12 : o.rot);
    const gr = g.createLinearGradient(-30, -30, 30, 30); gr.addColorStop(0, '#FFE066'); gr.addColorStop(1, '#F7B500');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.6;
    Art.round(g, -32, -32, 64, 64, 6); g.fill(); g.stroke();
    if (o.face) { g.rotate(-(o.rot === undefined ? 0.12 : o.rot)); Art.face(g, 0, 0, 34, o.face, { t: o.t, seed: o.seed, look: o.look }); }
    else {
      g.fillStyle = '#E09A00';
      [[-14, -12, 7], [12, -16, 4.5], [14, 12, 8], [-12, 16, 5]].forEach(([a, b, r]) => { g.beginPath(); g.arc(a, b, r, 0, TAU); g.fill(); });
    }
    g.restore();
  }
  function sandwich(g, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    bread(g, 7, 6, 1);
    cheese(g, 2, 2, 0.98, { rot: 0.72 });
    bread(g, -3, -3, 1);
    if (o.face) Art.face(g, -3, -2, 34, o.face, { t: o.t, seed: o.seed });
    g.restore();
  }
  function gasBag(g, x, y, w, h, color, o = {}) {
    g.save(); if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    const top = y - h;
    g.fillStyle = '#9A94B3'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
    Art.round(g, x - 6, top - 12, 12, 16, 3); g.fill(); g.stroke();
    const gr = g.createLinearGradient(x - w / 2, top, x + w / 2, y);
    gr.addColorStop(0, Art.mix(color, '#ffffff', 0.45)); gr.addColorStop(1, Art.mix(color, '#2A1A4A', 0.2));
    g.fillStyle = gr; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x - w * 0.46, y);
    g.bezierCurveTo(x - w * 0.62, y - h * 0.5, x - w * 0.5, top, x - w * 0.24, top + h * 0.04);
    g.quadraticCurveTo(x, top - h * 0.04, x + w * 0.24, top + h * 0.04);
    g.bezierCurveTo(x + w * 0.5, top, x + w * 0.62, y - h * 0.5, x + w * 0.46, y);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = Math.max(2, w * 0.03); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - w * 0.32, y - h * 0.26); g.quadraticCurveTo(x - w * 0.36, y - h * 0.62, x - w * 0.18, y - h * 0.8); g.stroke();
    g.restore();
  }
  /** A speckled heap for solid samples. y is the bottom edge. */
  function pile(g, x, y, w, h, color, o = {}) {
    g.save(); if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    const gr = g.createRadialGradient(x - w * 0.15, y - h * 0.8, 2, x, y - h * 0.2, w * 0.7);
    gr.addColorStop(0, Art.mix(color, '#ffffff', 0.4)); gr.addColorStop(1, Art.mix(color, '#100820', 0.3));
    g.fillStyle = gr; g.strokeStyle = 'rgba(16,8,32,.65)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x - w / 2, y);
    g.bezierCurveTo(x - w * 0.36, y - h * 0.8, x - w * 0.16, y - h, x, y - h);
    g.bezierCurveTo(x + w * 0.16, y - h, x + w * 0.36, y - h * 0.8, x + w / 2, y);
    g.closePath(); g.fill(); g.stroke();
    for (let i = 0; i < 14; i++) {
      const u = rand(i + 2) - 0.5, v = rand(i + 7);
      const yy = y - v * h * 0.8, xx = x + u * w * (1 - v * 0.75) * 0.8;
      g.fillStyle = `rgba(255,255,255,${0.12 + rand(i) * 0.3})`;
      g.fillRect(xx, yy, 2.6, 2.6);
    }
    g.restore();
  }
  /** A sample on a scale. Gases go in a bag, solids in a heap. */
  function sample(g, f, x, baseY, w, massText, size, o = {}) {
    const top = baseY - 38;
    const col = { H2: '#E3E6F2', O2: '#FF7682', N2: '#8AA8FF', Cl2: '#A8E86A', CH4: '#C9D2E0', I2: '#6B2FA8', Zn: '#AEB4D6', Al: '#D6D0E2', Mg: '#CDEBCD', CO: '#A9B0BC' }[f] || '#BBB';
    if (/^(H2|O2|N2|Cl2|CH4|CO)$/.test(f)) gasBag(g, x, top, size, size * 0.62, col, o);
    else pile(g, x, top, size, size * 0.6, col, o);
    Art.digitalScale(g, x, baseY, w, massText, { size: 22 });
  }
  function beam(g, cx, baseY, span, o = {}) {
    const h = o.h || 220, drop = o.drop || 108, pan = o.pan || 128, col = '#E4DEF4';
    const by = baseY - h;
    g.save();
    g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - 110, baseY); g.quadraticCurveTo(cx, baseY - 18, cx + 110, baseY); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = col; g.lineWidth = 11; g.beginPath(); g.moveTo(cx, baseY - 8); g.lineTo(cx, by); g.stroke();
    g.lineWidth = 10; g.beginPath(); g.moveTo(cx - span, by); g.lineTo(cx + span, by); g.stroke();
    g.fillStyle = C.pink; g.beginPath(); g.arc(cx, by, 12, 0, TAU); g.fill();
    [[-1, o.drawL], [1, o.drawR]].forEach(([d, draw]) => {
      const x = cx + d * span, py = by + drop;
      g.strokeStyle = 'rgba(228,222,244,.75)'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(x, by); g.lineTo(x - pan, py); g.moveTo(x, by); g.lineTo(x + pan, py); g.stroke();
      g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(x - pan - 8, py); g.quadraticCurveTo(x, py + 24, x + pan + 8, py); g.closePath(); g.fill(); g.stroke();
      if (draw) draw(g, x, py);
    });
    g.restore();
  }

  /* ---------- Story 1: the sandwich shop ---------- */
  const BS = 0.8, CS = 0.72;
  const breadPos = (i) => [62 + (i % 4) * 78, 76 + Math.floor(i / 4) * 92];
  const cheesePos = (i) => [52 + i * 68, 276];
  const sandPos = (i) => [520 + (i % 2) * 168, 94 + Math.floor(i / 2) * 150];
  /** runs: how many sandwiches are done, fractional while one is being made. */
  function shop(g, runs, t, o = {}) {
    const whole = Math.floor(runs), u = runs - whole;
    // Empty slots stay visible, so you can see what has gone.
    for (let i = 0; i < 8; i++) {
      const [x, y] = breadPos(i);
      const batch = Math.floor((7 - i) / 2);
      if (batch < whole) { g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; g.setLineDash([5, 6]); g.save(); g.translate(x, y); g.scale(BS, BS); breadPath(g); g.restore(); g.stroke(); g.setLineDash([]); continue; }
      if (batch === whole && u > 0) continue;
      bread(g, x, y, BS, { face: o.breadFace, t, seed: i });
    }
    for (let i = 0; i < 5; i++) {
      const [x, y] = cheesePos(i);
      const batch = 4 - i;
      if (batch < whole) { g.save(); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; g.setLineDash([5, 6]); Art.round(g, x - 23, y - 23, 46, 46, 5); g.stroke(); g.setLineDash([]); g.restore(); continue; }
      if (batch === whole && u > 0) continue;
      const left = o.cheeseFace && i === 0;
      cheese(g, x, y, left ? CS * 1.2 : CS, { face: left ? o.cheeseFace : null, t, seed: i, rot: left ? 0.04 : undefined, look: [1, 0] });
    }
    for (let k = 0; k < 4; k++) {
      const [sx, sy] = sandPos(k);
      if (k < whole) sandwich(g, sx, sy, 1.08, { face: 'happy', t, seed: k });
      else if (k === whole && u > 0) {
        const f = ease.inOut(seg(u, 0, 0.72)), [b1x, b1y] = breadPos(7 - 2 * k), [b2x, b2y] = breadPos(6 - 2 * k), [cx, cy] = cheesePos(4 - k);
        const pop = ease.back(seg(u, 0.74, 1));
        if (pop <= 0) {
          bread(g, lerp(b1x, sx, f), lerp(b1y, sy, f) - Math.sin(f * PI) * 34, BS);
          cheese(g, lerp(cx, sx, f), lerp(cy, sy, f) + Math.sin(f * PI) * 16, CS);
          bread(g, lerp(b2x, sx, f), lerp(b2y, sy, f) - Math.sin(f * PI) * 16, BS);
        } else sandwich(g, sx, sy, 1.08 * pop, { face: 'grin', t, seed: k });
        Art.burst(g, sx, sy, seg(u, 0.7, 1), { n: 10, r: 80 });
      }
    }
  }
  function shopCounts(g, runs, y) {
    const n = Math.floor(runs + 0.4);
    Art.text(g, `Bread ${8 - n * 2}`, 150, y, { font: 'display', size: 36, color: n === 4 ? C.red : C.ink });
    Art.text(g, `Cheese ${5 - n}`, 390, y, { font: 'display', size: 36, color: n === 4 ? C.sun : C.ink });
    Art.text(g, `Sandwiches ${n}`, 640, y, { font: 'display', size: 36, color: C.leaf });
  }

  const H2O_RX = parseEq('2H2 + O2 -> 2H2O');
  const shopReact = (() => {
    const left = [], right = [];
    for (let i = 0; i < 6; i++) left.push({ f: 'H2', x: 66 + (i % 3) * 112, y: 118 + Math.floor(i / 3) * 74, rot: rand(i + 1) * 1 - 0.5 });
    for (let i = 0; i < 4; i++) left.push({ f: 'O2', x: 62 + (i % 4) * 86, y: 290, rot: rand(i + 21) * 1 - 0.5 });
    for (let i = 0; i < 6; i++) right.push({ f: 'H2O', x: 500 + (i % 3) * 104, y: 136 + Math.floor(i / 3) * 110, rot: rand(i + 41) * 0.8 - 0.4 });
    return { left, right, run: plan(left.slice(0, 9), right, 37), leftover: left[9] };
  })();

  Lab.story('#story-sandwich', {
    title: 'What runs out first?',
    scenes: [
      {
        say: 'The recipe is 2 bread + 1 cheese makes 1 sandwich. You have <b>8 slices of bread</b> and <b>5 slices of cheese</b>. There is less cheese. So cheese runs out first, right? Make a guess.',
        dur: 3.4,
        draw(g, p, t, { H }) {
          const q = (i) => ease.back(seg(p, 0.02 + i * 0.05, 0.16 + i * 0.05));
          for (let i = 0; i < 8; i++) { const a = q(i); if (a > 0) { const [x, y] = breadPos(i); bread(g, x, y, BS * a); } }
          for (let i = 0; i < 5; i++) { const a = q(i + 6); if (a > 0) { const [x, y] = cheesePos(i); cheese(g, x, y, CS * a); } }
          shopCounts(g, 0, H - 44);
          Art.moe(g, 610, 330, 170, 'think', { t, flip: true });
          Art.bubble(g, 'Which runs out first?', 610, 148, { w: 260, size: 28, alpha: seg(p, 0.6, 0.8) });
        },
      },
      {
        say: 'Build sandwiches one at a time. Each one takes 2 bread and 1 cheese. Watch the counters fall at different speeds.',
        dur: 5.5,
        draw(g, p, t, { H }) {
          const runs = 4 * seg(p, 0.03, 0.97);
          shop(g, runs, t);
          shopCounts(g, runs, H - 44);
        },
      },
      {
        say: 'The bread is gone, so the shop has to stop. One slice of cheese is left over. You had <b>more bread than cheese</b>, and the bread still ran out first.',
        dur: 3,
        draw(g, p, t, { H }) {
          shop(g, 4, t, { cheeseFace: 'sad' });
          shopCounts(g, 4, H - 44);
          const a = seg(p, 0.1, 0.4);
          Art.ring(g, 52, 276, 44, { color: C.sun, w: 5, p: a });
          stamp(g, 'Out of bread!', 192, 124, seg(p, 0.3, 0.55), { size: 44 });
          Art.text(g, 'Left over', 200, 276, { size: 30, color: C.sun, alpha: seg(p, 0.5, 0.7), align: 'center' });
        },
      },
      {
        say: 'Now the real names. The <b>limiting reactant</b> runs out first and sets how much you make. The <b>excess reactant</b> has some left over.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          const a = ease.back(seg(p, 0.02, 0.26)), b = ease.back(seg(p, 0.28, 0.52));
          if (a > 0) {
            bread(g, 180, 150, 1.8 * a, { face: 'wow', t, look: [0, 0.6] });
            Art.pill(g, 'Limiting reactant', 180, 266, { size: 32, font: 'display', color: '#B81F71', alpha: clamp(a) });
            Art.text(g, 'It runs out first.', 180, 318, { size: 28, alpha: clamp(a) });
            Art.text(g, 'It sets the amount.', 180, 354, { size: 28, alpha: clamp(a) });
          }
          if (b > 0) {
            cheese(g, 620, 150, 1.7 * b, { face: 'sad', t, rot: 0.02, look: [0, 0.6] });
            Art.pill(g, 'Excess reactant', 620, 266, { size: 32, font: 'display', color: '#8A6400', alpha: clamp(b) });
            Art.text(g, 'It reacts until the end.', 620, 318, { size: 28, alpha: clamp(b) });
            Art.text(g, 'Some is left over.', 620, 354, { size: 28, alpha: clamp(b) });
          }
          Art.text(g, '4 sandwiches, no more', W / 2, 416, { font: 'display', size: 34, color: C.leaf, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: 'Molecules work the same way. The recipe is 2 H₂ + O₂. You have <b>6 H₂</b> and <b>4 O₂</b>. Again, the one you have more of is not safe.',
        dur: 3,
        draw(g, p, t, { W }) {
          equation(g, H2O_RX, W / 2, 38, { size: 42 });
          g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, 16, 76, 380, 280, 22); g.fill();
          shopReact.left.forEach((m, i) => {
            const a = ease.back(seg(p, 0.05 + i * 0.05, 0.2 + i * 0.05));
            if (a > 0) mol(g, m.f, m.x + wander(i, t) * 3, m.y + wander(i + 30, t) * 3, 37 * a, { rot: m.rot, labels: a > 0.9 });
          });
          Art.text(g, '6 H₂', 120, 376, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.3, 0.5), align: 'center' });
          Art.text(g, '4 O₂', 300, 376, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.6, 0.8), align: 'center' });
          Art.moe(g, 610, 420, 180, 'think', { t, flip: true });
          Art.bubble(g, 'Who runs out?', 610, 226, { w: 220, size: 28, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: 'Run it. 6 H₂ only needs 3 O₂, so the H₂ runs out and <b>1 O₂ is left over</b>. You started with more H₂ molecules, yet H₂ is limiting. Every atom is still here.',
        dur: 5,
        draw(g, p, t, { W, H }) {
          equation(g, H2O_RX, W / 2, 34, { size: 38 });
          g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, 16, 68, 380, 292, 22); g.fill(); Art.round(g, 436, 68, 348, 292, 22); g.fill();
          const q = seg(p, 0.05, 0.84);
          shopReact.left.slice(0, 9).forEach((m) => mol(g, m.f, m.x, m.y, 37, { rot: m.rot, alpha: 0.22 * seg(q, 0.1, 0.4), labels: false }));
          drawRun(g, shopReact.run, q, { t, shake: 3 });
          const L = shopReact.leftover, a = seg(p, 0.82, 0.96);
          mol(g, L.f, L.x + wander(3, t) * 3, L.y + wander(7, t) * 3, 37, { rot: L.rot, face: a > 0.2 ? 'sleepy' : null, t });
          Art.ring(g, L.x, L.y, 62, { color: C.sun, w: 5, p: a });
          banner(g, ['1 ', { f: 'O2' }, ' left over'], 262, 212, { size: 28, alpha: seg(p, 0.86, 1), bg: '#6B4F0C', stroke: C.sun });
          stamp(g, 'H₂ ran out', 148, 150, seg(p, 0.8, 0.96), { size: 34, color: C.red });
          g.fillStyle = 'rgba(16,8,32,.72)'; Art.round(g, 16, H - 78, W - 32, 68, 22); g.fill();
          Art.text(g, 'Before', 74, H - 44, { size: 25, color: C.dim });
          tally(g, { H: 12, O: 8 }, 234, H - 44, { size: 28, r: 19 });
          const e = seg(p, 0.82, 0.96);
          Art.text(g, '=', 400, H - 44, { font: 'display', size: 44, color: C.leaf, alpha: e });
          Art.text(g, 'After', 484, H - 44, { size: 25, color: C.dim, alpha: e });
          tally(g, { H: 12, O: 8 }, 636, H - 44, { size: 28, r: 19, alpha: e });
        },
      },
    ],
  });

  /* ---------- Bench: the molecule reactor ---------- */
  const CH = { x0: 20, y0: 118, x1: 780, y1: 424 };
  const REACT = [
    { id: 'h2o', btn: '2H₂ + O₂', eq: '2H2 + O2 -> 2H2O', s: 33, runsA: 6, runsB: 10, start: [6, 4], heavy: [10, 1] },
    { id: 'nh3', btn: 'N₂ + 3H₂', eq: 'N2 + 3H2 -> 2NH3', s: 30, runsA: 8, runsB: 5, start: [2, 12], heavy: [1, 12] },
    { id: 'co2', btn: '2CO + O₂', eq: '2CO + O2 -> 2CO2', s: 30, runsA: 6, runsB: 10, start: [6, 2], heavy: [4, 3] },
    { id: 'ch4', btn: 'CH₄ + 2O₂', eq: 'CH4 + 2O2 -> CO2 + 2H2O', s: 25, runsA: 8, runsB: 6, start: [2, 8], heavy: [3, 2] },
    { id: 'nacl', btn: '2Na + Cl₂', eq: '2Na + Cl2 -> 2NaCl', s: 26, runsA: 6, runsB: 8, start: [6, 2], heavy: [6, 2] },
  ];
  REACT.forEach((r) => { r.rx = parseEq(r.eq); });
  const rc = { cfg: REACT[0], phase: 'idle', box: null, events: [], pending: null, gap: 0, wait: 0, predict: null, nA: 6, nB: 4, used: {}, made: {}, startAtoms: {}, t: 0 };
  const speciesOf = (rx) => [...rx.r, ...rx.p];
  const countKind = (f) => rc.box.particles.filter((p) => p.kind === f).length;
  function diskR(f, s) { const e = extent(f, s, 'fill'); return Math.max(e.w, e.h) * 0.42; }
  function resetReactor() {
    const { rx, s } = rc.cfg;
    const seed = Math.floor(rc.nA * 37 + rc.nB * 101 + 7);
    const box = new Sim.Box({ x0: CH.x0 + 8, y0: CH.y0 + 8, x1: CH.x1 - 8, y1: CH.y1 - 8, speed: 120, collide: true, seed });
    const A = rx.r[0], B = rx.r[1];
    box.add({ n: rc.nA, r: diskR(A.f, s), kind: A.f, mass: 1 + Bank.molarMass(A.f) / 60 });
    box.add({ n: rc.nB, r: diskR(B.f, s), kind: B.f, mass: 1 + Bank.molarMass(B.f) / 60 });
    box.onHit = (a, b) => {
      if (rc.phase === 'running' && !rc.pending && a.kind !== b.kind && rc.isReact(a.kind) && rc.isReact(b.kind)) rc.pending = [a, b];
    };
    rc.isReact = (f) => rx.r.some((t) => t.f === f);
    rc.box = box;
    rc.events = []; rc.pending = null; rc.gap = 0; rc.wait = 0; rc.phase = 'idle';
    rc.used = {}; rc.made = {};
    rc.startAtoms = atomCount(box.particles.map((p) => p.kind));
    rc.runs = 0;
    paintTable(); paintMyths(); paintVerdict();
  }
  function startEvent(pair) {
    const { rx, s } = rc.cfg;
    const box = rc.box;
    const can = rx.r.every((t) => countKind(t.f) >= t.n);
    if (!can) return false;
    const seedP = pair ? pair[0] : box.particles.find((p) => rc.isReact(p.kind));
    const cx0 = pair ? (pair[0].x + pair[1].x) / 2 : seedP.x, cy0 = pair ? (pair[0].y + pair[1].y) / 2 : seedP.y;
    const members = [];
    rx.r.forEach((t) => {
      box.particles.filter((p) => p.kind === t.f).sort((a, b) => (a.x - cx0) ** 2 + (a.y - cy0) ** 2 - (b.x - cx0) ** 2 - (b.y - cy0) ** 2).slice(0, t.n).forEach((p) => members.push(p));
    });
    const cx = clamp(members.reduce((a, p) => a + p.x, 0) / members.length, CH.x0 + 80, CH.x1 - 80);
    const cy = clamp(members.reduce((a, p) => a + p.y, 0) / members.length, CH.y0 + 70, CH.y1 - 70);
    const before = members.map((p) => ({ f: p.kind, x: p.x, y: p.y, rot: p.rot }));
    const prods = [];
    rx.p.forEach((t) => { for (let i = 0; i < t.n; i++) prods.push(t.f); });
    const R = prods.length > 1 ? s * 1.5 : 0, a0 = rand(rc.t * 3.1) * TAU;
    const after = prods.map((f, i) => { const a = a0 + (i / prods.length) * TAU; return { f, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * 0.8, rot: rand(i + rc.t) * TAU, a }; });
    box.particles = box.particles.filter((p) => !members.includes(p));
    rx.r.forEach((t) => { rc.used[t.f] = (rc.used[t.f] || 0) + t.n; });
    rc.events.push({ run: plan(before, after, s), after, t0: rc.t, cx, cy });
    rc.runs++;
    Lab.sound.pop();
    paintTable();
    return true;
  }
  const EVENT_DUR = 0.95;
  function rcStep(dt) {
    if (!rc.box) return;
    rc.t += dt;
    rc.box.step(dt);
    if (rc.phase !== 'running') return;
    rc.gap += dt; rc.wait += dt;
    if (rc.gap > 0.42 && (rc.pending || rc.wait > 0.95)) {
      if (startEvent(rc.pending)) { rc.gap = 0; rc.wait = 0; }
      rc.pending = null;
    } else if (rc.pending && rc.gap <= 0.42) rc.pending = null;
    // Finish events whose atoms have landed.
    rc.events = rc.events.filter((ev) => {
      if (rc.t - ev.t0 < EVENT_DUR) return true;
      const { rx, s } = rc.cfg;
      ev.after.forEach((m) => {
        const sp = 90;
        rc.box.particles.push({ x: m.x, y: m.y, vx: Math.cos(m.a || 0) * sp + (rand(m.x) - 0.5) * 60, vy: Math.sin(m.a || 0) * sp + (rand(m.y) - 0.5) * 60, r: diskR(m.f, s), kind: m.f, mass: 1 + Bank.molarMass(m.f) / 60, id: rc.box.particles.length + 1000, rot: m.rot, spin: (rand(m.x + m.y) - 0.5) * 1.6 });
        rc.made[m.f] = (rc.made[m.f] || 0) + 1;
      });
      void rx;
      paintTable();
      return false;
    });
    const canMore = rc.cfg.rx.r.every((t) => countKind(t.f) >= t.n);
    if (!canMore && !rc.events.length) finishReactor();
  }
  function outcome() {
    const { rx } = rc.cfg;
    const A = rx.r[0], B = rx.r[1];
    const runsA = rc.nA / A.n, runsB = rc.nB / B.n;
    const exact = Math.abs(runsA - runsB) < 1e-9;
    const lim = exact ? null : runsA < runsB ? A : B, exc = exact ? null : runsA < runsB ? B : A;
    const runs = Math.min(runsA, runsB);
    const left = exact ? 0 : (exc === A ? rc.nA : rc.nB) - runs * exc.n;
    return { A, B, runsA, runsB, exact, lim, exc, runs, left, massA: rc.nA * Bank.molarMass(A.f), massB: rc.nB * Bank.molarMass(B.f) };
  }
  function finishReactor() {
    rc.phase = 'done';
    const o = outcome();
    paintVerdict(); paintMyths(); paintTable();
    if (rc.predict) {
      const right = (rc.predict === 'none' && o.exact) || (rc.predict === 'A' && o.exc === o.A) || (rc.predict === 'B' && o.exc === o.B);
      if (right) { Lab.collection.award(1); } else Lab.sound.bad();
    } else Lab.sound.good();
  }
  const hF = (f) => Lab.fHTML(f);
  function paintVerdict() {
    const el = Lab.$('#rc-verdict');
    if (rc.phase === 'idle') { el.innerHTML = 'Make your prediction, then press run.'; return; }
    if (rc.phase === 'running') { el.innerHTML = 'Reacting. Watch the counters and the table.'; return; }
    const o = outcome();
    const what = o.exact ? 'Nothing is left over. This is the exact recipe.' : `${hF(o.lim.f)} ran out first, so it is limiting. ${o.left} mol of ${hF(o.exc.f)} is left over.`;
    let pred = '';
    if (rc.predict) {
      const right = (rc.predict === 'none' && o.exact) || (rc.predict === 'A' && o.exc === o.A) || (rc.predict === 'B' && o.exc === o.B);
      pred = right ? 'Your prediction was right. ' : 'Not what you predicted. ';
    }
    el.innerHTML = pred + what;
  }
  function paintTable() {
    const { rx } = rc.cfg;
    const sp = speciesOf(rx);
    const isR = (f) => rx.r.some((t) => t.f === f);
    const start = (f) => (f === rx.r[0].f ? rc.nA : f === rx.r[1].f ? rc.nB : 0);
    const change = (f) => (isR(f) ? -(rc.used[f] || 0) : rc.made[f] || 0);
    const fmtC = (v) => (v === 0 ? '0' : v > 0 ? '+' + v : '−' + -v);
    const end = (f) => start(f) + change(f);
    const done = rc.phase === 'done';
    const cls = (f) => (!done || !isR(f) ? '' : end(f) === 0 ? 'is-zero' : 'is-left');
    Lab.$('#rc-table').innerHTML = `<thead><tr><th>Moles</th>${sp.map((s) => `<th>${hF(s.f)}</th>`).join('')}</tr></thead><tbody>
      <tr><td>Start</td>${sp.map((s) => `<td>${start(s.f)}</td>`).join('')}</tr>
      <tr><td>Change</td>${sp.map((s) => `<td>${rc.phase === 'idle' ? '' : fmtC(change(s.f))}</td>`).join('')}</tr>
      <tr><td>End</td>${sp.map((s) => `<td class="${cls(s.f)}">${done ? end(s.f) : ''}</td>`).join('')}</tr>
      <tr><td>Start mass</td>${sp.map((s) => `<td>${isR(s.f) ? Lab.fmt(start(s.f) * Bank.molarMass(s.f), 2) + ' g' : ''}</td>`).join('')}</tr>
    </tbody>`;
  }
  function paintMyths() {
    const el = Lab.$('#rc-myths');
    const rows = [
      ['Wrong idea 1: everything always gets used up.'],
      ['Wrong idea 2: only one reactant gets used, whatever the amounts.'],
      ['Wrong idea 3: the reactant with the smallest mass runs out first.'],
    ];
    if (rc.phase === 'done') {
      const o = outcome();
      const A = hF(o.A.f), B = hF(o.B.f);
      const bust = '<span class="is-bust-word">Busted.</span> ';
      rows[0].push(o.exact ? ['is-luck', 'It happened this time, but only because this is the exact recipe. Change either slider and it fails.'] : ['is-bust', `${bust}${o.left} mol of ${hF(o.exc.f)} is still here.`]);
      rows[1].push(['is-bust', `${bust}Both reacted: ${o.runs * o.A.n} mol of ${A} and ${o.runs * o.B.n} mol of ${B} were used.`]);
      if (o.exact) rows[2].push(['is-bust', `${bust}Both ran out together, even with ${Lab.fmt(o.massA, 2)} g of ${A} and ${Lab.fmt(o.massB, 2)} g of ${B}.`]);
      else {
        const limMass = o.lim === o.A ? o.massA : o.massB, excMass = o.lim === o.A ? o.massB : o.massA;
        if (limMass > excMass) rows[2].push(['is-bust', `${bust}${hF(o.lim.f)} had more grams (${Lab.fmt(limMass, 2)} g against ${Lab.fmt(excMass, 2)} g) and it still ran out first.`]);
        else rows[2].push(['is-luck', `It held this time by luck. Press <b>The heavier one runs out</b> and watch it fail.`]);
      }
    }
    el.innerHTML = rows.map(([m, r]) => `<li class="${r ? r[0] : ''}"><span class="myth">${m}</span><span class="res">${r ? r[1] : 'Run the reactor to test this one.'}</span></li>`).join('');
  }
  function reactorControls() {
    const { rx } = rc.cfg;
    const A = rx.r[0], B = rx.r[1];
    const a = Lab.$('#rc-a'), b = Lab.$('#rc-b');
    a.min = A.n; a.step = A.n; a.max = A.n * rc.cfg.runsA;
    b.min = B.n; b.step = B.n; b.max = B.n * rc.cfg.runsB;
    a.value = rc.nA; b.value = rc.nB;
    Lab.paintRange(a); Lab.paintRange(b);
    Lab.$('#rc-a-label').innerHTML = `${hF(A.f)} to start`;
    Lab.$('#rc-b-label').innerHTML = `${hF(B.f)} to start`;
    Lab.$('#rc-a-out').textContent = `${rc.nA} mol`;
    Lab.$('#rc-b-out').textContent = `${rc.nB} mol`;
    Lab.$('#rc-predict').innerHTML = [['A', hF(A.f)], ['B', hF(B.f)], ['none', 'Nothing']].map(([v, l]) => `<button type="button" data-value="${v}" aria-pressed="${rc.predict === v}">${l}</button>`).join('');
    const presets = [['extraA', `Extra ${hF(A.f)}`], ['extraB', `Extra ${hF(B.f)}`], ['exact', 'The exact recipe'], ['heavy', 'The heavier one runs out']];
    Lab.$('#rc-preset').innerHTML = presets.map(([v, l]) => `<button type="button" data-value="${v}" aria-pressed="false">${l}</button>`).join('');
  }
  function setAmounts(a, b) { rc.nA = a; rc.nB = b; rc.predict = null; reactorControls(); resetReactor(); rcStage.redraw(); }
  Lab.$('#rc-rx').innerHTML = REACT.map((r, i) => `<button type="button" data-value="${r.id}" aria-pressed="${i === 0}">${r.btn}</button>`).join('');
  Lab.segmented('#rc-rx', (v) => { rc.cfg = REACT.find((r) => r.id === v); setAmounts(rc.cfg.start[0], rc.cfg.start[1]); });
  Lab.$('#rc-a').addEventListener('input', (e) => { rc.nA = +e.target.value; rc.predict = null; reactorControls(); resetReactor(); });
  Lab.$('#rc-b').addEventListener('input', (e) => { rc.nB = +e.target.value; rc.predict = null; reactorControls(); resetReactor(); });
  Lab.$('#rc-predict').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    rc.predict = b.dataset.value;
    Lab.$$('#rc-predict button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
  Lab.$('#rc-preset').addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const { rx } = rc.cfg, a = rx.r[0].n, b = rx.r[1].n, v = btn.dataset.value;
    if (v === 'extraA') setAmounts(a * 5, b * 2);
    else if (v === 'extraB') setAmounts(a * 2, b * 5);
    else if (v === 'exact') setAmounts(a * 3, b * 3);
    else setAmounts(rc.cfg.heavy[0], rc.cfg.heavy[1]);
    Lab.$$('#rc-preset button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.value === v)));
  });
  Lab.$('#rc-run').addEventListener('click', () => {
    if (rc.phase === 'done') { const keep = rc.predict; resetReactor(); rc.predict = keep; }
    if (rc.phase === 'running') return;
    rc.phase = 'running'; rc.wait = 0.8; rc.gap = 1;
    paintVerdict(); paintMyths(); paintTable();
    if (Lab.reducedMotion) { let guard = 0; while (rc.phase === 'running' && guard++ < 4000) rcStep(0.05); rcStage.redraw(); }
  });
  Lab.$('#rc-reset').addEventListener('click', () => { resetReactor(); rcStage.redraw(); });

  function card(g, f, x, y, w, h, count, full, state) {
    const stroke = state === 'out' ? C.red : state === 'left' ? C.sun : state === 'made' ? C.leaf : 'rgba(255,255,255,.28)';
    g.fillStyle = 'rgba(16,8,32,.62)'; g.strokeStyle = stroke; g.lineWidth = state ? 4 : 2.5;
    Art.round(g, x, y, w, h, 13); g.fill(); g.stroke();
    cform(g, f, x + 12, y + h / 2 - 4, { size: 26, align: 'left' });
    Art.text(g, String(count), x + w - 14, y + h / 2 - 4, { font: 'display', size: 32, align: 'right', color: state === 'out' ? C.red : state === 'left' ? C.sun : state === 'made' ? C.leaf : C.ink });
    if (full > 0) {
      g.fillStyle = 'rgba(255,255,255,.12)'; Art.round(g, x + 10, y + h - 11, w - 20, 7, 3.5); g.fill();
      if (count > 0) { g.fillStyle = stroke === 'rgba(255,255,255,.28)' ? C.cyan : stroke; Art.round(g, x + 10, y + h - 11, Math.max(8, (w - 20) * (count / full)), 7, 3.5); g.fill(); }
    }
  }
  reactorControls();
  resetReactor();
  const rcStage = Lab.stage('#c-reactor', {
    h: 546, label: 'A chamber of drifting molecules that react in batches until one reactant runs out, with counters above and an atom tally below.',
    draw(g, t, dt) {
      rcStep(dt);
      const { rx, s } = rc.cfg;
      equation(g, rx, 400, 28, { size: 36 });
      // Counters.
      const sp = speciesOf(rx), gap = 10, cw = (760 - gap * (sp.length - 1)) / sp.length;
      const done = rc.phase === 'done';
      sp.forEach((a, i) => {
        const isR = rx.r.includes(a);
        const start = a === rx.r[0] ? rc.nA : a === rx.r[1] ? rc.nB : 0;
        const c = countKind(a.f);
        const totalP = Math.min(rc.nA / rx.r[0].n, rc.nB / rx.r[1].n) * a.n;
        const state = done ? (isR ? (c === 0 ? 'out' : 'left') : 'made') : '';
        card(g, a.f, 20 + i * (cw + gap), 54, cw, 54, c, isR ? start : totalP, state);
      });
      // Chamber.
      g.fillStyle = 'rgba(214,240,255,.05)'; g.strokeStyle = Art.C.glass; g.lineWidth = 3.5;
      Art.round(g, CH.x0, CH.y0, CH.x1 - CH.x0, CH.y1 - CH.y0, 18); g.fill(); g.stroke();
      const parts = rc.box.particles;
      const isR = (f) => rx.r.some((x) => x.f === f);
      parts.forEach((p) => {
        if (isR(p.kind)) return;
        mol(g, p.kind, p.x, p.y, s, { rot: p.rot, labels: s >= 26 });
      });
      parts.forEach((p) => {
        if (!isR(p.kind)) return;
        const leftover = done;
        mol(g, p.kind, p.x, p.y, s, { rot: p.rot, labels: s >= 26, face: leftover ? 'sleepy' : null, t, seed: p.id });
        if (leftover) Art.ring(g, p.x, p.y, p.r + 12, { color: C.sun, w: 3.5, dash: [7, 7] });
      });
      rc.events.forEach((ev) => {
        const q = clamp((rc.t - ev.t0) / EVENT_DUR);
        drawRun(g, ev.run, q, { t: rc.t, shake: 3, settle: 0, labels: s >= 26 });
        Art.burst(g, ev.cx, ev.cy, seg(q, 0.72, 1), { n: 10, r: 66 });
      });
      if (rc.phase === 'idle') Art.text(g, 'Ready to react', 400, CH.y1 - 26, { size: 26, color: C.dim, halo: true });
      if (done) {
        const o = outcome();
        const parts2 = o.exact ? ['Both ran out together. Nothing left over.'] : [{ f: o.lim.f }, ' ran out first. ', `${o.left} `, { f: o.exc.f }, ' left over.'];
        banner(g, parts2, 400, CH.y1 - 32, { size: 28, bg: '#22123A', stroke: o.exact ? C.leaf : C.sun });
      }
      // Atom tally, counted from what is really on screen right now.
      const nowList = parts.map((p) => p.kind);
      const counted = atomCount(nowList);
      rc.events.forEach((ev) => ev.run.atoms.forEach((a) => { counted[a.sym] = (counted[a.sym] || 0) + 1; }));
      const now = {};
      Object.keys(rc.startAtoms).forEach((k) => { now[k] = counted[k] || 0; });
      Object.keys(counted).forEach((k) => { if (!(k in now)) now[k] = counted[k]; });
      const same = Object.keys(rc.startAtoms).every((k) => rc.startAtoms[k] === now[k]);
      Art.text(g, 'Atoms at the start', 205, 450, { size: 24, color: C.dim });
      tally(g, rc.startAtoms, 205, 494, { size: 28, r: 20 });
      Art.text(g, same ? '=' : '≠', 400, 482, { font: 'display', size: 60, color: same ? C.leaf : C.red });
      Art.text(g, 'Atoms right now', 595, 450, { size: 24, color: C.dim });
      tally(g, now, 595, 494, { size: 28, r: 20 });
      void t;
    },
  });

  /* ---------- Story 2: three wrong ideas, tested ---------- */
  const mythA = (() => {
    const left = [], right = [];
    for (let i = 0; i < 8; i++) left.push({ f: 'H2', x: 60 + (i % 4) * 88, y: 112 + Math.floor(i / 4) * 58, rot: rand(i + 1) - 0.5 });
    for (let i = 0; i < 8; i++) left.push({ f: 'O2', x: 62 + (i % 4) * 88, y: 240 + Math.floor(i / 4) * 66, rot: rand(i + 21) - 0.5 });
    for (let i = 0; i < 8; i++) right.push({ f: 'H2O', x: 484 + (i % 3) * 110, y: 122 + Math.floor(i / 3) * 82 + (i >= 6 ? 0 : 0), rot: rand(i + 41) * 0.8 - 0.4 });
    const used = left.slice(0, 12), leftover = left.slice(12);
    return { left, right, used, leftover, run: plan(used, right, 30) };
  })();
  const mythB = (() => {
    const left = [], right = [];
    for (let i = 0; i < 4; i++) left.push({ f: 'H2', x: 80 + (i % 2) * 180, y: 122 + Math.floor(i / 2) * 82, rot: rand(i + 3) - 0.5 });
    for (let i = 0; i < 2; i++) left.push({ f: 'O2', x: 88 + i * 176, y: 304, rot: rand(i + 13) - 0.5 });
    for (let i = 0; i < 4; i++) right.push({ f: 'H2O', x: 510 + (i % 2) * 160, y: 122 + Math.floor(i / 2) * 184, rot: rand(i + 43) * 0.6 - 0.3 });
    return { left, right, run: plan(left, right, 40) };
  })();
  const ZNI2 = parseEq('Zn + I2 -> ZnI2');
  const mythC = (() => {
    const zn = [], i2 = [], prod = [];
    for (let i = 0; i < 15; i++) zn.push({ f: 'Zn', x: 54 + (i % 5) * 72, y: 104 + Math.floor(i / 5) * 54, rot: 0 });
    for (let i = 0; i < 8; i++) i2.push({ f: 'I2', x: 66 + (i % 4) * 92, y: 282 + Math.floor(i / 4) * 54, rot: rand(i + 7) * 0.5 - 0.25 });
    for (let i = 0; i < 8; i++) prod.push({ f: 'ZnI2', x: 516 + (i % 2) * 174, y: 100 + Math.floor(i / 2) * 58, rot: rand(i + 17) * 0.2 - 0.1 });
    const usedZn = zn.slice(7), leftZn = zn.slice(0, 7);
    return { zn, i2, prod, leftZn, usedZn, run: plan(usedZn.concat(i2), prod, 24) };
  })();
  const ZN_DOTS = [], I2_DOTS = [];
  for (let i = 0; i < 15; i++) { const a = i * 2.39996, d = Math.sqrt((i + 0.5) / 15) * 102; ZN_DOTS.push([Math.cos(a) * d, Math.sin(a) * d]); }
  for (let i = 0; i < 8; i++) { const a = i * 2.39996, d = Math.sqrt((i + 0.5) / 8) * 94; I2_DOTS.push([Math.cos(a) * d, Math.sin(a) * d, rand(i + 2) * 3]); }

  const mythTitle = (g, str, W, a = 1) => Art.text(g, str, W / 2, 32, { font: 'display', size: 33, color: C.pink, alpha: a });
  Lab.story('#story-myths', {
    title: 'Three wrong ideas, tested',
    scenes: [
      {
        say: 'Wrong idea 1: <b>everything always gets used up</b>. Test it with 8 H₂ and 8 O₂. The recipe only needs 4 O₂ for that much H₂, so 4 O₂ have nothing to react with.',
        dur: 5,
        draw(g, p, t, { W, H }) {
          mythTitle(g, 'Everything always gets used up?', W);
          g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, 12, 68, 388, 306, 22); g.fill(); Art.round(g, 424, 68, 364, 306, 22); g.fill();
          const q = seg(p, 0.04, 0.8);
          mythA.used.forEach((m) => mol(g, m.f, m.x, m.y, 30, { rot: m.rot, alpha: 0.2 * seg(q, 0.1, 0.4), labels: false }));
          drawRun(g, mythA.run, q, { t, labels: false });
          const a = seg(p, 0.78, 0.92);
          mythA.leftover.forEach((m, i) => {
            mol(g, m.f, m.x + wander(i + 2, t) * 2, m.y + wander(i + 6, t) * 2, 30, { rot: m.rot, face: a > 0.2 ? 'sleepy' : null, t, labels: false, seed: i });
            Art.ring(g, m.x, m.y, 44, { color: C.sun, w: 4, p: a });
          });
          banner(g, ['4 ', { f: 'O2' }, ' left over'], 205, 348, { size: 26, alpha: seg(p, 0.84, 0.96), bg: '#6B4F0C', stroke: C.sun });
          stamp(g, 'Busted', 662, 342, seg(p, 0.88, 1), { size: 36 });
          Art.text(g, 'Atoms before and after', 190, H - 38, { size: 24, color: C.dim });
          tally(g, { H: 16, O: 16 }, 520, H - 38, { size: 28, r: 19 });
        },
      },
      {
        say: 'Wrong idea 2: <b>only one reactant gets used</b>. Look back: the O₂ fell from 8 to 4, so it was being used all along. And with the exact recipe, 4 H₂ and 2 O₂, <b>both</b> run out together.',
        dur: 4.6,
        draw(g, p, t, { W, H }) {
          mythTitle(g, 'Only one reactant gets used?', W);
          g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, 12, 68, 388, 306, 22); g.fill(); Art.round(g, 424, 68, 364, 306, 22); g.fill();
          const q = seg(p, 0.04, 0.8);
          mythB.left.forEach((m) => mol(g, m.f, m.x, m.y, 40, { rot: m.rot, alpha: 0.2 * seg(q, 0.1, 0.4), labels: false }));
          drawRun(g, mythB.run, q, { t, shake: 3 });
          const a = seg(p, 0.8, 0.95);
          Art.text(g, 'Used up', 206, 208, { font: 'display', size: 40, color: C.leaf, alpha: a, halo: true });
          stamp(g, 'Busted', 600, 218, seg(p, 0.88, 1));
          rich(g, [{ f: 'H2' }, ' 4 to 0'], 200, H - 38, { size: 32, alpha: a });
          rich(g, [{ f: 'O2' }, ' 2 to 0'], 400, H - 38, { size: 32, alpha: a });
          rich(g, [{ f: 'H2O' }, ' 0 to 4'], 610, H - 38, { size: 32, alpha: a });
        },
      },
      {
        say: 'Wrong idea 3: <b>the smallest mass runs out first</b>. Here is 10 g of zinc and 20 g of iodine. They react 1 to 1. Zinc has less mass, so most people pick zinc.',
        dur: 3.2,
        draw(g, p, t, { W, H }) {
          mythTitle(g, 'The smallest mass runs out first?', W);
          equation(g, ZNI2, W / 2, 84, { size: 38 });
          const a = ease.back(seg(p, 0.04, 0.3)), b = ease.back(seg(p, 0.18, 0.44));
          const bench = H - 50;
          if (a > 0) sample(g, 'Zn', 170, bench, 240, '10.0 g', 170 * a);
          if (b > 0) sample(g, 'I2', 630, bench, 240, '20.0 g', 240 * b);
          cform(g, 'Zn', 170, 150, { size: 46, alpha: seg(p, 0.1, 0.3) });
          cform(g, 'I2', 630, 150, { size: 46, alpha: seg(p, 0.3, 0.5) });
          Art.moe(g, 402, H - 22, 148, 'think', { t, flip: true });
          Art.bubble(g, 'Less mass, so zinc?', 402, H - 180, { w: 230, size: 27, alpha: seg(p, 0.55, 0.75) });
          Art.arrow(g, 282, H - 118, 250, H - 118, { color: C.sun, w: 6, p: seg(p, 0.72, 0.9) });
        },
      },
      {
        say: 'Count the particles. An iodine molecule is heavy, at 253.8 g/mol against 65.4 g/mol for zinc. So 20 g of I₂ is only <b>0.079 mol</b>, while 10 g of Zn is <b>0.153 mol</b>. Twice the grams, about half as many.',
        dur: 4,
        draw(g, p, t, { H }) {
          const bench = H - 22;
          sample(g, 'Zn', 170, bench, 200, '10.0 g', 90);
          sample(g, 'I2', 630, bench, 200, '20.0 g', 124);
          const n1 = Math.ceil(15 * ease.out(seg(p, 0.2, 0.62))), n2 = Math.ceil(8 * ease.out(seg(p, 0.3, 0.62)));
          Art.zoom(g, 170, bench - 70, 170, 160, 136, (gg, cx, cy) => {
            for (let i = 0; i < n1; i++) Art.atom(gg, cx + ZN_DOTS[i][0] + wander(i, t) * 2, cy + ZN_DOTS[i][1] + wander(i + 9, t) * 2, 21, 'Zn', { label: 'Zn' });
          }, { p: seg(p, 0.05, 0.25) });
          Art.zoom(g, 630, bench - 80, 630, 160, 136, (gg, cx, cy) => {
            for (let i = 0; i < n2; i++) mol(gg, 'I2', cx + I2_DOTS[i][0] + wander(i + 20, t) * 2, cy + I2_DOTS[i][1] + wander(i + 29, t) * 2, 24, { rot: I2_DOTS[i][2], labels: true, atomScale: 1.2 });
          }, { p: seg(p, 0.12, 0.32) });
          const a = seg(p, 0.66, 0.84);
          Art.text(g, 'more', 400, 104, { font: 'display', size: 28, color: C.dim, alpha: a });
          Art.text(g, 'particles', 400, 138, { font: 'display', size: 28, color: C.dim, alpha: a });
          Art.text(g, 'on the left', 400, 172, { font: 'display', size: 28, color: C.sun, alpha: a });
          Art.text(g, 'Each picture is', 400, 240, { size: 24, color: C.dim, alpha: seg(p, 0.75, 0.9) });
          Art.text(g, 'about 0.01 mol', 400, 270, { size: 24, color: C.dim, alpha: seg(p, 0.75, 0.9) });
        },
      },
      {
        say: 'Run it. <b>The iodine runs out</b>, even though it had twice the grams. About 7 of the 15 zinc atoms are left, which is 4.85 g of zinc.',
        dur: 5,
        draw(g, p, t, { W, H }) {
          equation(g, ZNI2, W / 2, 34, { size: 36 });
          g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, 12, 68, 388, 306, 22); g.fill(); Art.round(g, 424, 68, 364, 306, 22); g.fill();
          const q = seg(p, 0.04, 0.8);
          mythC.usedZn.concat(mythC.i2).forEach((m) => mol(g, m.f, m.x, m.y, 24, { rot: m.rot, alpha: 0.2 * seg(q, 0.1, 0.4), labels: false }));
          drawRun(g, mythC.run, q, { t });
          const a = seg(p, 0.78, 0.92);
          mythC.leftZn.forEach((m, i) => {
            mol(g, m.f, m.x + wander(i + 2, t) * 2, m.y + wander(i + 6, t) * 2, 24, { face: a > 0.2 ? 'sleepy' : null, t, labels: false, seed: i });
            Art.ring(g, m.x, m.y, 30, { color: C.sun, w: 3.5, p: a });
          });
          stamp(g, 'Busted', 610, 340, seg(p, 0.88, 1), { size: 36 });
          banner(g, [{ f: 'I2' }, ' ran out'], 206, 340, { size: 28, alpha: seg(p, 0.82, 0.94), bg: '#6B1F2E', stroke: C.red });
          Art.text(g, 'Before', 62, H - 38, { size: 24, color: C.dim });
          tally(g, { Zn: 15, I: 16 }, 226, H - 38, { size: 27, r: 18 });
          const e = seg(p, 0.8, 0.94);
          Art.text(g, '=', 400, H - 38, { font: 'display', size: 44, color: C.leaf, alpha: e });
          Art.text(g, 'After', 476, H - 38, { size: 24, color: C.dim, alpha: e });
          tally(g, { Zn: 15, I: 16 }, 636, H - 38, { size: 27, r: 18, alpha: e });
        },
      },
      {
        say: 'So what does decide? Only one thing: <b>moles compared with the coefficients</b>. Not how much you can see, not how heavy it is, and not how many molecules you started with on their own.',
        dur: 3.6,
        draw(g, p, t, { W }) {
          const lines = ['Everything gets used up', 'Only one reactant gets used', 'The smallest mass runs out'];
          lines.forEach((l, i) => {
            const a = seg(p, 0.05 + i * 0.16, 0.2 + i * 0.16), y = 64 + i * 70;
            Art.text(g, l, 300, y, { size: 32, color: C.dim, alpha: a });
            g.font = `700 32px ${Art.FONT_BODY}`;
            const w = g.measureText(l).width;
            Art.strike(g, 300 - w / 2 - 8, y + 5, 300 + w / 2 + 8, y - 3, seg(p, 0.14 + i * 0.16, 0.28 + i * 0.16), C.red, 6);
          });
          const q = ease.back(seg(p, 0.6, 0.82));
          if (q > 0) {
            g.save(); g.translate(300, 330); g.scale(q, q);
            g.fillStyle = '#1E7A4A'; g.strokeStyle = C.leaf; g.lineWidth = 4; Art.round(g, -272, -56, 544, 112, 28); g.fill(); g.stroke();
            Art.text(g, 'Moles ÷ coefficient.', 0, -18, { font: 'display', size: 40, color: '#fff' });
            Art.text(g, 'The smallest one is limiting.', 0, 26, { font: 'display', size: 32, color: C.sun });
            g.restore();
          }
          Art.moe(g, 688, 410, 190, 'cheer', { t, flip: true });
          void W;
        },
      },
    ],
  });

  /* ---------- Bench: grams can fool you ---------- */
  const MS = [
    { id: 'zni2', btn: 'Zn + I₂', eq: 'Zn + I2 -> ZnI2', prod: 'ZnI2', surprise: [10, 20], normal: [10, 5] },
    { id: 'h2o', btn: '2H₂ + O₂', eq: '2H2 + O2 -> 2H2O', prod: 'H2O', surprise: [5, 20], normal: [1, 30] },
    { id: 'nh3', btn: 'N₂ + 3H₂', eq: 'N2 + 3H2 -> 2NH3', prod: 'NH3', surprise: [14, 10], normal: [40, 2] },
    { id: 'alcl3', btn: '2Al + 3Cl₂', eq: '2Al + 3Cl2 -> 2AlCl3', prod: 'AlCl3', surprise: [30, 50], normal: [5, 50] },
    { id: 'ch4', btn: 'CH₄ + 2O₂', eq: 'CH4 + 2O2 -> CO2 + 2H2O', prod: 'CO2', surprise: [20, 50], normal: [5, 50] },
    { id: 'mgo', btn: '2Mg + O₂', eq: '2Mg + O2 -> 2MgO', prod: 'MgO', surprise: [24, 20], normal: [10, 30] },
  ];
  MS.forEach((m) => { m.rx = parseEq(m.eq); });
  const ms = { cfg: MS[0], a: 10, b: 20, shownA: null, shownB: null };
  Lab.$('#ms-rx').innerHTML = MS.map((r, i) => `<button type="button" data-value="${r.id}" aria-pressed="${i === 0}">${r.btn}</button>`).join('');
  const msCalc = () => {
    const { rx, prod } = ms.cfg;
    const A = rx.r[0], B = rx.r[1], P = rx.p.find((x) => x.f === prod);
    const MA = Bank.molarMass(A.f), MB = Bank.molarMass(B.f), MP = Bank.molarMass(P.f);
    const nA = ms.a / MA, nB = ms.b / MB, rA = nA / A.n, rB = nB / B.n;
    const limA = rA < rB;
    const runs = Math.min(rA, rB), L = limA ? A : B, E = limA ? B : A;
    const excUsedMol = runs * E.n, excStart = limA ? nB : nA, excMass = (excStart - excUsedMol) * (limA ? MB : MA);
    return { A, B, P, MA, MB, MP, nA, nB, rA, rB, limA, runs, L, E, product: runs * P.n * MP, excMass, tie: Math.abs(rA - rB) / Math.max(rA, rB) < 0.005 };
  };
  Lab.stage('#c-mass', {
    h: 520, bg: 'micro', label: 'Two reactants weighed on scales. Their masses become moles and then recipe runs, drawn as bars. The shorter bar is the limiting reactant.',
    draw(g, t, dt) {
      const c = msCalc();
      ms.shownA = ms.shownA === null ? c.rA : lerp(ms.shownA, c.rA, Lab.reducedMotion ? 1 : clamp(dt * 8));
      ms.shownB = ms.shownB === null ? c.rB : lerp(ms.shownB, c.rB, Lab.reducedMotion ? 1 : clamp(dt * 8));
      equation(g, ms.cfg.rx, 400, 28, { size: 34 });
      Art.text(g, 'Weigh', 104, 68, { font: 'display', size: 25, color: C.sun });
      Art.text(g, 'Count', 316, 68, { font: 'display', size: 25, color: C.pink });
      Art.text(g, 'Recipe runs', 620, 68, { font: 'display', size: 25, color: C.cyan });
      const BX = 450, BW = 330, full = Math.max(ms.shownA, ms.shownB) || 1;
      const rows = [
        { sp: c.A, y: 160, g: ms.a, M: c.MA, n: c.nA, r: ms.shownA, real: c.rA, lim: c.limA },
        { sp: c.B, y: 310, g: ms.b, M: c.MB, n: c.nB, r: ms.shownB, real: c.rB, lim: !c.limA },
      ];
      const stopX = BX + (Math.min(ms.shownA, ms.shownB) / full) * BW;
      rows.forEach((row) => {
        const sz = 34 + Math.sqrt(row.g) * 8;
        sample(g, row.sp.f, 104, row.y + 62, 176, `${row.g} g`, sz);
        cform(g, row.sp.f, 26, row.y - 44, { size: 30, align: 'left' });
        // The middle: grams to moles to runs.
        Art.arrow(g, 204, row.y + 4, 236, row.y + 4, { color: C.dim, w: 4, head: 12 });
        Art.text(g, `÷ ${row.M.toFixed(2)} g/mol`, 322, row.y - 40, { size: 21, color: C.dim });
        Art.text(g, `${Lab.sig(row.n, 3)} mol`, 322, row.y + 4, { font: 'display', size: 30, color: C.pink });
        Art.text(g, `÷ ${row.sp.n} (coefficient)`, 322, row.y + 46, { size: 21, color: C.dim });
        Art.arrow(g, 412, row.y + 4, 442, row.y + 4, { color: C.dim, w: 4, head: 12 });
        // The bar.
        const w = Math.max(10, (row.r / full) * BW), h = 58, y0 = row.y - 25;
        g.fillStyle = 'rgba(255,255,255,.08)'; Art.round(g, BX, y0, BW, h, 12); g.fill();
        const usedW = Math.min(w, stopX - BX);
        const gr = g.createLinearGradient(0, y0, 0, y0 + h);
        gr.addColorStop(0, '#7BE9FA'); gr.addColorStop(1, '#179BC0');
        g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
        Art.round(g, BX, y0, Math.max(8, usedW), h, 12); g.fill(); g.stroke();
        if (w > usedW + 3) {
          // Beyond the stop line nothing happens: this part is the leftover.
          g.save(); Art.round(g, BX + usedW, y0, w - usedW, h, 10); g.clip();
          g.fillStyle = '#6B4F0C'; g.fillRect(BX + usedW, y0, w - usedW, h);
          g.strokeStyle = C.sun; g.lineWidth = 5;
          for (let k = -40; k < w - usedW + 40; k += 18) { g.beginPath(); g.moveTo(BX + usedW + k, y0 + h); g.lineTo(BX + usedW + k + 40, y0); g.stroke(); }
          g.restore();
          if (w - usedW > 90) Art.text(g, 'left over', BX + usedW + (w - usedW) / 2, y0 + h / 2, { size: 23, color: '#fff', halo: true });
        }
        Art.text(g, `${Lab.sig(row.real, 3)} runs`, BX + 4, y0 - 17, { size: 24, align: 'left', color: C.ink });
        if (!c.tie) {
          Art.pill(g, row.lim ? 'Limiting' : 'Excess', BX + BW, y0 - 17, { size: 22, align: 'right', color: row.lim ? '#B81F71' : '#8A6400', font: 'display' });
        }
      });
      // The stop line.
      g.save(); g.strokeStyle = C.red; g.lineWidth = 4; g.setLineDash([9, 7]);
      g.beginPath(); g.moveTo(stopX, 108); g.lineTo(stopX, 372); g.stroke(); g.restore();
      // Heavier sample tag.
      const heavyRow = ms.a === ms.b ? null : ms.a > ms.b ? rows[0] : rows[1];
      if (heavyRow) Art.pill(g, 'More grams', 104, heavyRow.y - 44, { size: 21, align: 'left', color: '#6B4F0C', font: 'display', stroke: C.sun });
      // Verdict.
      const limMore = !c.tie && ((c.limA && ms.a > ms.b) || (!c.limA && ms.b > ms.a));
      const y = 416;
      g.fillStyle = limMore ? 'rgba(255,79,163,.2)' : 'rgba(16,8,32,.6)'; g.strokeStyle = limMore ? C.pink : 'rgba(255,255,255,.25)'; g.lineWidth = 3;
      Art.round(g, 104, y - 34, 676, 124, 22); g.fill(); g.stroke();
      if (c.tie) rich(g, ['About the exact recipe. Both run out together.'], 442, y + 8, { size: 28, color: C.leaf });
      else if (limMore) rich(g, ['Surprise! ', { f: c.L.f }, ' has more grams and runs out first.'], 442, y, { size: 28, color: C.ink });
      else if (ms.a === ms.b) rich(g, ['Equal grams, but ', { f: c.L.f }, ' runs out first.'], 442, y, { size: 28, color: C.ink });
      else rich(g, [{ f: c.L.f }, ' has fewer grams and runs out. Luck, this time.'], 442, y, { size: 28, color: C.ink });
      if (!c.tie) {
        rich(g, [`You make ${Lab.sig(c.product, 3)} g of `, { f: c.P.f }, '.'], 442, y + 40, { size: 25, color: C.leaf });
        rich(g, [`${Lab.sig(c.excMass, 3)} g of `, { f: c.E.f }, ' is left over.'], 442, y + 70, { size: 25, color: C.sun });
      }
      Art.moe(g, 56, 510, 104, limMore ? 'wow' : 'think', { t });
    },
  });
  function paintMass() {
    const c = msCalc();
    const fA = c.A.f, fB = c.B.f, fP = c.P.f;
    const ce = (f) => `\\ce{${f}}`;
    const t3 = (x) => Lab.sig(x, 3);
    const fromA = c.nA * (c.P.n / c.A.n) * c.MP, fromB = c.nB * (c.P.n / c.B.n) * c.MP;
    const chain = (g0, M, sp, val) => `$$${g0}\\text{ g }${ce(sp.f)} \\times \\dfrac{1\\text{ mol}}{${M.toFixed(2)}\\text{ g}} \\times \\dfrac{${c.P.n}\\text{ mol }${ce(fP)}}{${sp.n}\\text{ mol }${ce(sp.f)}} \\times \\dfrac{${c.MP.toFixed(2)}\\text{ g}}{1\\text{ mol}} = \\mathbf{${t3(val)}\\text{ g}}$$`;
    Lab.$('#ms-calc').innerHTML = Lab.texString(`<h5>Method 1: recipe runs</h5><p>$${ce(fA)}$: $${t3(c.nA)} \\div ${c.A.n} = ${t3(c.rA)}$ runs. $${ce(fB)}$: $${t3(c.nB)} \\div ${c.B.n} = ${t3(c.rB)}$ runs. The smaller number is limiting.</p>
      <h5>Method 2: product from each</h5>${chain(ms.a, c.MA, c.A, fromA)}${chain(ms.b, c.MB, c.B, fromB)}<p>Only the smaller amount really forms: <b>${t3(Math.min(fromA, fromB))} g</b> of $${ce(fP)}$. Same answer.</p>`);
    Lab.$('#ms-a-out').textContent = `${ms.a} g`;
    Lab.$('#ms-b-out').textContent = `${ms.b} g`;
    Lab.$('#ms-a-label').innerHTML = `Mass of ${hF(fA)}`;
    Lab.$('#ms-b-label').innerHTML = `Mass of ${hF(fB)}`;
  }
  const setMass = (a, b) => { ms.a = a; ms.b = b; Lab.$('#ms-a').value = a; Lab.$('#ms-b').value = b; Lab.paintRange(Lab.$('#ms-a')); Lab.paintRange(Lab.$('#ms-b')); paintMass(); };
  Lab.segmented('#ms-rx', (v) => { ms.cfg = MS.find((m) => m.id === v); setMass(ms.cfg.normal[0], ms.cfg.normal[1]); });
  Lab.$('#ms-a').addEventListener('input', (e) => { ms.a = +e.target.value; paintMass(); });
  Lab.$('#ms-b').addEventListener('input', (e) => { ms.b = +e.target.value; paintMass(); });
  Lab.$('#ms-surprise').addEventListener('click', () => { setMass(ms.cfg.surprise[0], ms.cfg.surprise[1]); Lab.sound.pop(); });
  paintMass();

  /* ---------- Story 3: two methods ---------- */
  const AL = parseEq('2Al + 3Cl2 -> 2AlCl3');
  /** A labeled horizontal bar, optionally with a hatched part that never happens. */
  function hbar(g, x, y, w, h, color, o = {}) {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, Art.mix(color, '#ffffff', 0.25)); gr.addColorStop(1, Art.mix(color, '#160A2C', 0.2));
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    Art.round(g, x, y, Math.max(6, w), h, 11); g.fill(); g.stroke();
    if (o.hatchFrom !== undefined && w > o.hatchFrom) {
      g.save(); Art.round(g, x + o.hatchFrom, y, w - o.hatchFrom, h, 10); g.clip();
      g.fillStyle = '#6B4F0C'; g.fillRect(x + o.hatchFrom, y, w - o.hatchFrom, h);
      g.strokeStyle = C.sun; g.lineWidth = 5;
      for (let k = -40; k < w - o.hatchFrom + 40; k += 18) { g.beginPath(); g.moveTo(x + o.hatchFrom + k, y + h); g.lineTo(x + o.hatchFrom + k + 40, y); g.stroke(); }
      g.restore();
    }
  }
  Lab.story('#story-methods', {
    title: 'One problem, two ways',
    bg: 'lab',
    scenes: [
      {
        say: 'The problem: <b>10.0 g of Al</b> meets <b>35.0 g of Cl₂</b>. How much AlCl₃ can form, and how much is left over? Notice that Cl₂ has more grams. Keep an eye on it.',
        dur: 3,
        draw(g, p, t, { W, H }) {
          equation(g, AL, W / 2, 44, { size: 44 });
          const bench = H - 68;
          const a = ease.back(seg(p, 0.08, 0.3)), b = ease.back(seg(p, 0.22, 0.44));
          if (a > 0) sample(g, 'Al', 190, bench, 250, '10.0 g', 120 * a);
          if (b > 0) sample(g, 'Cl2', 610, bench, 250, '35.0 g', 200 * b);
          cform(g, 'Al', 190, 180, { size: 44, alpha: seg(p, 0.1, 0.3) });
          cform(g, 'Cl2', 610, 136, { size: 44, alpha: seg(p, 0.3, 0.5) });
          Art.moe(g, 400, bench + 4, 120, 'think', { t });
          rich(g, ['? g of ', { f: 'AlCl3' }], 400, 118, { size: 34, color: C.sun, alpha: seg(p, 0.5, 0.7) });
        },
      },
      {
        say: 'Both methods start the same way. <b>Change every mass to moles.</b> Divide by each molar mass. You cannot compare anything until you do this.',
        dur: 3.6,
        draw(g, p, t, { W }) {
          Art.bg(g, W, 450, 'micro', t);
          Art.text(g, 'Step 1: change to moles', W / 2, 52, { font: 'display', size: 38, color: C.pink });
          const row = (y, f, a, line1, line2) => {
            const q = seg(p, a, a + 0.32);
            if (q <= 0) return;
            const s = ease.back(q);
            if (f === 'Al') Art.atom(g, 88, y, 50 * s, 'Al', {});
            else mol(g, 'Cl2', 88, y, 56 * s, { atomScale: 0.9, labels: true });
            Art.text(g, line1, 180, y - 22, { size: 30, align: 'left', alpha: q });
            Art.text(g, line2, 180, y + 24, { font: 'display', size: 38, align: 'left', color: C.sun, alpha: seg(p, a + 0.15, a + 0.32) });
          };
          row(170, 'Al', 0.05, '10.0 g ÷ 26.98 g/mol', '= 0.3706 mol Al');
          row(320, 'Cl2', 0.4, '35.0 g ÷ 70.90 g/mol', '= 0.4936 mol Cl₂');
        },
      },
      {
        say: '<b>Method 1, recipe runs.</b> Divide each by its coefficient. Al: 0.3706 ÷ 2 = 0.1853 runs. Cl₂: 0.4936 ÷ 3 = 0.1645 runs. Cl₂ runs out first, so <b>Cl₂ is limiting</b>. It had the most grams and the most moles too.',
        dur: 4.6,
        draw(g, p, t, { W }) {
          Art.bg(g, W, 450, 'micro', t);
          Art.text(g, 'Method 1: recipe runs', W / 2, 48, { font: 'display', size: 38, color: C.cyan });
          const BX = 90, BW = 660, full = 0.1853, a = ease.inOut(seg(p, 0.12, 0.42)), b = ease.inOut(seg(p, 0.3, 0.6));
          const stop = BX + (0.1645 / full) * BW;
          cform(g, 'Al', 54, 150, { size: 38 });
          Art.text(g, '0.3706 ÷ 2 = 0.1853 runs', BX, 112, { size: 27, align: 'left', alpha: seg(p, 0.08, 0.24) });
          hbar(g, BX, 130, BW * a, 46, C.cyan, { hatchFrom: stop - BX });
          cform(g, 'Cl2', 50, 280, { size: 38 });
          Art.text(g, '0.4936 ÷ 3 = 0.1645 runs', BX, 242, { size: 27, align: 'left', alpha: seg(p, 0.26, 0.42) });
          hbar(g, BX, 260, (stop - BX) * b, 46, C.cyan);
          const c = seg(p, 0.6, 0.76);
          if (c > 0) {
            g.save(); g.strokeStyle = C.red; g.lineWidth = 5; g.setLineDash([10, 8]); g.globalAlpha *= c;
            g.beginPath(); g.moveTo(stop, 100); g.lineTo(stop, 330); g.stroke(); g.restore();
          }
          Art.text(g, 'Stops here', stop - 10, 90, { font: 'display', size: 26, align: 'right', color: C.red, alpha: seg(p, 0.66, 0.82) });
          Art.text(g, 'left over', stop + (BX + BW - stop) / 2, 196, { size: 24, color: C.sun, alpha: seg(p, 0.76, 0.9), halo: true });
          banner(g, [{ f: 'Cl2' }, ' is limiting'], 560, 386, { size: 34, bg: '#B81F71', alpha: seg(p, 0.8, 0.95) });
        },
      },
      {
        say: '<b>Method 2, product from each.</b> Pretend each reactant is the one that runs out. Al could make 49.4 g of AlCl₃. Cl₂ could only make 43.9 g. <b>The smaller number is what really happens.</b>',
        dur: 4.6,
        draw(g, p, t, { W }) {
          Art.bg(g, W, 450, 'micro', t);
          Art.text(g, 'Method 2: product from each', W / 2, 48, { font: 'display', size: 38, color: C.sun });
          const BX = 90, BW = 660, full = 49.42, a = ease.inOut(seg(p, 0.12, 0.42)), b = ease.inOut(seg(p, 0.34, 0.64));
          const stop = BX + (43.88 / full) * BW;
          cform(g, 'Al', 54, 164, { size: 38 });
          Art.text(g, '0.3706 mol × 2/2 × 133.33 g/mol', BX, 126, { size: 25, align: 'left', alpha: seg(p, 0.08, 0.24) });
          hbar(g, BX, 144, BW * a, 46, C.sun, { hatchFrom: stop - BX });
          Art.text(g, '49.4 g', BX + 12, 167, { font: 'display', size: 28, align: 'left', color: '#22123A', alpha: seg(p, 0.36, 0.48) });
          cform(g, 'Cl2', 50, 294, { size: 38 });
          Art.text(g, '0.4936 mol × 2/3 × 133.33 g/mol', BX, 256, { size: 25, align: 'left', alpha: seg(p, 0.3, 0.46) });
          hbar(g, BX, 274, (stop - BX) * b, 46, C.sun);
          Art.text(g, '43.9 g', BX + 12, 297, { font: 'display', size: 28, align: 'left', color: '#22123A', alpha: seg(p, 0.58, 0.68) });
          const c = seg(p, 0.66, 0.8);
          if (c > 0) {
            g.save(); g.strokeStyle = C.red; g.lineWidth = 5; g.setLineDash([10, 8]); g.globalAlpha *= c;
            g.beginPath(); g.moveTo(stop, 110); g.lineTo(stop, 340); g.stroke(); g.restore();
          }
          Art.text(g, 'Never', 730, 100, { size: 23, color: C.sun, alpha: seg(p, 0.76, 0.9) });
          Art.text(g, 'happens', 730, 126, { size: 23, color: C.sun, alpha: seg(p, 0.76, 0.9) });
          banner(g, ['You get 43.9 g of ', { f: 'AlCl3' }], 400, 386, { size: 34, bg: '#1E7A4A', stroke: C.leaf, alpha: seg(p, 0.8, 0.95) });
        },
      },
      {
        say: 'How much Al is left? The Cl₂ decides how much Al gets used: 0.4936 mol Cl₂ × 2/3 = 0.3291 mol Al, which is <b>8.88 g</b>. Subtract from the start: 10.0 g − 8.88 g = <b>1.12 g left over</b>.',
        dur: 4,
        draw(g, p, t, { W }) {
          Art.bg(g, W, 450, 'micro', t);
          Art.text(g, 'Find the leftovers', W / 2, 48, { font: 'display', size: 38, color: C.sun });
          Art.text(g, '0.4936 mol Cl₂ × 2 mol Al / 3 mol Cl₂ = 0.3291 mol Al', W / 2, 108, { size: 27, alpha: seg(p, 0.04, 0.2) });
          Art.text(g, '0.3291 mol × 26.98 g/mol = 8.88 g of Al used', W / 2, 150, { size: 27, alpha: seg(p, 0.18, 0.34) });
          const BX = 70, BW = 660, used = (8.88 / 10) * BW, q = ease.inOut(seg(p, 0.36, 0.72));
          cform(g, 'Al', BX - 36, 266, { size: 34 });
          g.fillStyle = 'rgba(255,255,255,.08)'; Art.round(g, BX, 236, BW, 60, 12); g.fill();
          hbar(g, BX, 236, Math.max(0, used * q), 60, C.cyan);
          if (q > 0.5) Art.text(g, '8.88 g used', BX + 18, 266, { font: 'display', size: 30, align: 'left', color: '#1A0F2E', alpha: seg(p, 0.5, 0.64) });
          const r = seg(p, 0.7, 0.84);
          if (r > 0) { hbar(g, BX + used, 236, (BW - used), 60, C.sun); }
          Art.arrow(g, BX + used + (BW - used) / 2, 346, BX + used + (BW - used) / 2, 304, { color: C.sun, w: 6, p: r });
          Art.text(g, '1.12 g left over', BX + used + (BW - used) / 2 - 40, 372, { font: 'display', size: 36, color: C.sun, alpha: r });
          Art.text(g, '10.0 g at the start', BX, 218, { size: 24, align: 'left', color: C.dim });
          Art.moe(g, 150, 442, 96, 'point', { t });
        },
      },
      {
        say: 'Always check with mass. In: 10.0 g + 35.0 g = 45.0 g. Out: 43.9 g of product + 1.12 g of leftover Al = 45.0 g. <b>They match.</b> If yours do not match, something went wrong.',
        dur: 3.6,
        draw(g, p, t, { W, H }) {
          const a = seg(p, 0.06, 0.3), b = seg(p, 0.36, 0.6);
          beam(g, W / 2, H - 66, 245, {
            drawL(gg, x, y) { if (a > 0) { pile(gg, x - 66, y + 2, 84, 44, '#D6D0E2', { alpha: a }); gasBag(gg, x + 36, y + 2, 132, 76, '#A8E86A', { alpha: a }); } },
            drawR(gg, x, y) { if (b > 0) { pile(gg, x - 34, y + 2, 164, 76, '#F2E9D0', { alpha: b }); pile(gg, x + 88, y + 2, 44, 18, '#D6D0E2', { alpha: b }); } },
          });
          rich(g, ['10.0 g ', { f: 'Al' }], 155, 32, { size: 30, alpha: a, color: C.ink });
          rich(g, ['+ 35.0 g ', { f: 'Cl2' }], 155, 70, { size: 30, alpha: a, color: C.ink });
          rich(g, ['43.9 g ', { f: 'AlCl3' }], 645, 32, { size: 30, alpha: b, color: C.ink });
          rich(g, ['+ 1.12 g ', { f: 'Al' }], 645, 70, { size: 30, alpha: b, color: C.ink });
          const c = seg(p, 0.66, 0.84);
          Art.text(g, '45.0 g', 155, 122, { font: 'display', size: 44, color: C.sun, alpha: c });
          Art.text(g, '45.0 g', 645, 122, { font: 'display', size: 44, color: C.sun, alpha: c });
          Art.text(g, '=', W / 2, 90, { font: 'display', size: 70, color: C.leaf, alpha: c });
        },
      },
    ],
  });

  /* ---------- Yield art ---------- */
  /** A jar of solid product. pct is percent of the theoretical yield. */
  function jar(g, cx, baseY, w, h, pct, color, t, o = {}) {
    const lineFrac = 0.78, level = clamp((pct / 100) * lineFrac, 0, 0.94);
    const box = Art.beaker(g, cx, baseY, w, h, {
      level, liquid: color, ticks: false,
      inside(gg, b) {
        for (let i = 0; i < 70; i++) {
          const x = b.x0 + rand(i + 3) * (b.x1 - b.x0), y = b.top + rand(i + 9) * (b.bottom - b.top);
          gg.fillStyle = `rgba(${i % 2 ? '255,255,255' : '40,20,60'},${0.08 + rand(i) * 0.2})`;
          gg.beginPath(); gg.arc(x, y, 1.6 + rand(i + 1) * 2.4, 0, TAU); gg.fill();
        }
        if (pct > 100) {
          gg.fillStyle = 'rgba(70,185,240,.55)';
          for (let i = 0; i < 16; i++) { const x = b.x0 + 8 + rand(i + 31) * (b.x1 - b.x0 - 16), y = b.top + 6 + rand(i + 41) * (b.bottom - b.top - 12) * 0.7; gg.beginPath(); gg.moveTo(x, y - 7); gg.quadraticCurveTo(x + 6, y + 2, x, y + 5); gg.quadraticCurveTo(x - 6, y + 2, x, y - 7); gg.fill(); }
        }
      },
    });
    const lineY = baseY - (h - 12) * lineFrac;
    const x0 = cx - w / 2 - 14, x1 = cx + w / 2 + 14;
    g.save(); g.strokeStyle = C.leaf; g.lineWidth = 4; g.setLineDash([10, 8]);
    g.beginPath(); g.moveTo(x0, lineY); g.lineTo(x1, lineY); g.stroke(); g.restore();
    if (o.target !== undefined) {
      const ty = baseY - (h - 12) * (o.target / 100) * lineFrac;
      g.fillStyle = 'rgba(255,210,63,.3)'; g.fillRect(cx - w / 2, ty - 5, w, 10);
      g.strokeStyle = C.sun; g.lineWidth = 2.5; g.strokeRect(cx - w / 2, ty - 5, w, 10);
    }
    void t;
    return { lineY, surface: box.surface, x0: cx - w / 2, x1: cx + w / 2 };
  }
  function hopper(g, cx, y, grains, color, t, surfaceY) {
    // A funnel pouring product. Grains are pure functions of t.
    g.fillStyle = '#9A94B3'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(cx - 62, y - 42); g.lineTo(cx + 62, y - 42); g.lineTo(cx + 12, y + 8); g.lineTo(cx - 12, y + 8); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = color;
    g.beginPath(); g.moveTo(cx - 48, y - 36); g.lineTo(cx + 48, y - 36); g.lineTo(cx + 18, y - 8); g.lineTo(cx - 18, y - 8); g.closePath(); g.fill();
    if (grains > 0) {
      for (let i = 0; i < grains; i++) {
        const ph = (t * 1.5 + rand(i + 4)) % 1;
        const yy = y + 8 + (surfaceY - y - 8) * ph * ph;
        g.fillStyle = color; g.strokeStyle = 'rgba(26,15,46,.6)'; g.lineWidth = 1;
        g.beginPath(); g.arc(cx + (rand(i) - 0.5) * 16 + Math.sin(t * 7 + i) * 2, yy, 3.8, 0, TAU); g.fill(); g.stroke();
      }
    }
  }
  /* ---------- Story 4: percent yield ---------- */
  Lab.story('#story-yield', {
    title: 'What the math promises and what the lab delivers',
    bg: 'lab',
    scenes: [
      {
        say: 'The map said 43.9 g of AlCl₃ can form. That is the <b>theoretical yield</b>: the most the atoms allow. Every atom would have to end up in your jar.',
        dur: 3.2,
        draw(g, p, t, { H }) {
          const bench = H - 70;
          const q = ease.inOut(seg(p, 0.15, 0.75));
          jar(g, 260, bench, 280, 330, 100 * q, '#F2E9D0', t);
          g.save(); g.globalAlpha *= seg(p, 0.5, 0.75); g.restore();
          rich(g, ['Theoretical yield'], 590, 120, { size: 32, color: C.leaf, alpha: seg(p, 0.55, 0.75) });
          Art.text(g, '43.9 g', 590, 178, { font: 'display', size: 64, color: C.leaf, alpha: seg(p, 0.6, 0.8) });
          Art.moe(g, 600, bench, 130, 'point', { t, flip: true });
        },
      },
      {
        say: 'Real labs lose some. Product sticks to glass, stays in the filter, or goes astray in side reactions. Suppose you weigh your jar and find <b>38.6 g</b>. That is the <b>actual yield</b>.',
        dur: 4.6,
        draw(g, p, t, { H }) {
          const bench = H - 70;
          const fill = seg(p, 0.08, 0.72);
          const pct = 87.9 * ease.out(fill);
          const J = jar(g, 240, bench, 260, 300, pct, '#F2E9D0', t);
          if (fill > 0 && fill < 1) hopper(g, 240, 58, 14, '#F2E9D0', t, J.surface);
          else hopper(g, 240, 58, 0, '#F2E9D0', t, J.surface);
          // Lost grains veer off toward the three reasons.
          const reasons = [['Stuck to the glass', 224], ['Left in the filter', 278], ['Side reactions', 332]];
          reasons.forEach(([label, y], k) => {
            const a = seg(p, 0.24 + k * 0.16, 0.38 + k * 0.16);
            for (let i = 0; i < 6; i++) {
              const ph = ((t * 0.5 + i / 6 + k * 0.3) % 1);
              if (a <= 0 || fill >= 1) break;
              g.fillStyle = '#F2E9D0'; g.beginPath(); g.arc(lerp(290, 460, ph), lerp(100, y, ph) - Math.sin(ph * PI) * 26, 3.6, 0, TAU); g.fill();
            }
            Art.pill(g, label, 610, y, { size: 26, color: '#6B1F2E', stroke: C.red, alpha: a });
          });
          const c = seg(p, 0.76, 0.92);
          Art.text(g, 'Actual yield', 590, 54, { font: 'display', size: 30, color: C.sun, alpha: c });
          Art.text(g, '38.6 g', 590, 96, { font: 'display', size: 50, color: C.sun, alpha: c });
          Art.text(g, 'Theoretical 43.9 g', J.x1 + 14, J.lineY, { size: 22, align: 'left', color: C.leaf, alpha: seg(p, 0.02, 0.12), halo: true });
        },
      },
      {
        say: 'Percent yield compares the two: <b>actual ÷ theoretical × 100</b>. Here that is 38.6 ÷ 43.9 × 100 = <b>87.9%</b>. The grams cancel, so a percent is left.',
        dur: 3.6,
        draw(g, p, t, { H }) {
          const bench = H - 70;
          jar(g, 170, bench, 210, 300, 87.9, '#F2E9D0', t);
          g.fillStyle = '#2E5B4E'; g.strokeStyle = '#8A6A45'; g.lineWidth = 10;
          Art.round(g, 320, 66, 454, 212, 16); g.fill(); g.stroke();
          const a = seg(p, 0.06, 0.26), b = seg(p, 0.26, 0.5);
          Art.text(g, '38.6 g', 450, 130, { font: 'display', size: 44, color: '#F4F8F0', alpha: a });
          g.globalAlpha = a; g.fillStyle = '#F4F8F0'; g.fillRect(376, 163, 148, 4); g.globalAlpha = 1;
          Art.text(g, '43.9 g', 450, 200, { font: 'display', size: 44, color: '#F4F8F0', alpha: a });
          Art.text(g, '× 100', 610, 166, { font: 'display', size: 44, color: '#F4F8F0', alpha: b });
          Art.strike(g, 482, 142, 524, 118, seg(p, 0.5, 0.6), C.sun, 5);
          Art.strike(g, 482, 212, 524, 188, seg(p, 0.56, 0.66), C.sun, 5);
          const q = ease.back(seg(p, 0.68, 0.88));
          if (q > 0) { g.save(); g.translate(548, 340); g.scale(q, q); Art.text(g, '= 87.9%', 0, 0, { font: 'display', size: 70, color: C.sun }); g.restore(); }
        },
      },
      {
        say: 'Over 100%? Then something is off. You cannot make atoms. Most often the product is <b>still wet</b>, or holds something else, so it weighs more than it should. Dry it and weigh again.',
        dur: 3.4,
        draw(g, p, t, { H }) {
          const bench = H - 70;
          const pct = 87.9 + 26 * ease.inOut(seg(p, 0.06, 0.5));
          const J = jar(g, 240, bench, 260, 300, pct, '#F2E9D0', t);
          Art.text(g, `${Math.round(pct)}%`, 560, 110, { font: 'display', size: 78, color: pct > 100 ? C.red : C.sun });
          Art.moe(g, 620, bench, 150, 'oops', { t, flip: true });
          Art.bubble(g, 'Still wet!', 520, 250, { w: 180, size: 30, alpha: seg(p, 0.55, 0.75), side: 'right', dx: 0 });
          void J;
        },
      },
    ],
  });

  /* ---------- Bench: yield filler ---------- */
  const YD = [
    { id: 'mgo', btn: 'MgO', eq: '2Mg + O2 -> 2MgO', lim: 'Mg', prod: 'MgO', color: '#F1EEF8' },
    { id: 'agcl', btn: 'AgCl', eq: 'AgNO3 + NaCl -> AgCl + NaNO3', lim: 'AgNO3', prod: 'AgCl', color: '#F7F5EC' },
    { id: 'pbi2', btn: 'PbI₂', eq: 'Pb(NO3)2 + 2KI -> PbI2 + 2KNO3', lim: 'Pb(NO3)2', prod: 'PbI2', color: '#F6CB1F' },
    { id: 'cu', btn: 'Cu', eq: 'Zn + CuSO4 -> ZnSO4 + Cu', lim: 'Zn', prod: 'Cu', color: '#D98A4A' },
  ];
  YD.forEach((y) => { y.rx = parseEq(y.eq); });
  const yd = { cfg: YD[0], limG: 20, pct: 70, shown: 0, target: undefined, hit: false, grainsT: 0 };
  Lab.$('#yd-rx').innerHTML = YD.map((r, i) => `<button type="button" data-value="${r.id}" aria-pressed="${i === 0}">${r.btn}</button>`).join('');
  const ydCalc = () => {
    const { rx, lim, prod } = yd.cfg;
    const L = rx.r.find((x) => x.f === lim), P = rx.p.find((x) => x.f === prod);
    const n = yd.limG / Bank.molarMass(lim), np = n * (P.n / L.n), th = np * Bank.molarMass(prod);
    return { L, P, n, np, th, act: (yd.pct / 100) * th, ML: Bank.molarMass(lim), MP: Bank.molarMass(prod) };
  };
  Lab.stage('#c-yield', {
    h: 460, bg: 'lab', label: 'A jar fills with product up to the actual yield. A dashed line marks the theoretical yield, and a large number shows the percent yield.',
    draw(g, t, dt) {
      const c = ydCalc();
      const bench = 460 - 70;
      const prevShown = yd.shown;
      yd.shown = lerp(yd.shown, yd.pct, Lab.reducedMotion ? 1 : clamp(dt * 5));
      const filling = Math.abs(yd.pct - yd.shown) > 0.4 && yd.shown >= prevShown;
      equation(g, yd.cfg.rx, 400, 28, { size: 28 });
      const J = jar(g, 210, bench, 270, 280, yd.shown, yd.cfg.color, t, { target: yd.target });
      hopper(g, 210, 92, filling ? 14 : 0, yd.cfg.color, t, J.surface);
      Art.text(g, 'Theoretical', J.x1 + 18, J.lineY - 16, { size: 22, align: 'left', color: C.leaf, halo: true });
      Art.text(g, `${Lab.sig(c.th, 3)} g`, J.x1 + 18, J.lineY + 14, { font: 'display', size: 24, align: 'left', color: C.leaf, halo: true });
      // Readouts.
      const col = yd.shown > 100.5 ? C.red : yd.target !== undefined && Math.abs(yd.pct - yd.target) <= 1 ? C.leaf : C.sun;
      Art.text(g, `${yd.shown.toFixed(1)}%`, 620, 100, { font: 'display', size: 70, color: col });
      Art.text(g, 'percent yield', 620, 150, { size: 26, color: C.dim });
      const rowY = 202;
      rich(g, [`Actual ${Lab.sig(c.act, 3)} g of `, { f: c.P.f }], 620, rowY, { size: 25, color: C.sun });
      const lost = c.th - c.act;
      if (lost >= 0) Art.text(g, `Lost along the way: ${Lab.sig(lost, 2)} g`, 620, rowY + 38, { size: 23, color: C.ink });
      else Art.text(g, 'More than the atoms allow', 620, rowY + 38, { size: 23, color: C.red });
      if (yd.target !== undefined) Art.text(g, `Target: ${yd.target}%`, 620, rowY + 76, { font: 'display', size: 28, color: C.sun });
      const hit = yd.target !== undefined && Math.abs(yd.pct - yd.target) <= 1;
      const mood = yd.shown > 100.5 ? 'oops' : hit ? 'cheer' : 'happy';
      Art.moe(g, 722, bench + 2, 104, mood, { t, flip: true });
      if (yd.shown > 100.5) Art.bubble(g, 'Still wet?', 626, bench - 40, { w: 160, size: 25, side: 'right', dx: 0 });
    },
  });
  function paintYield() {
    const c = ydCalc();
    const { lim, prod } = yd.cfg;
    const ce = (f) => `\\ce{${f}}`;
    Lab.$('#yd-lim-label').innerHTML = `Limiting ${hF(lim)}`;
    Lab.$('#yd-lim-out').textContent = `${yd.limG} g`;
    Lab.$('#yd-act-out').textContent = `${Lab.sig(c.act, 3)} g`;
    Lab.$('#yd-calc').innerHTML = Lab.texString(`<p>Theoretical yield: $${yd.limG}\\text{ g }${ce(lim)} \\times \\dfrac{1\\text{ mol}}{${c.ML.toFixed(2)}\\text{ g}} \\times \\dfrac{${c.P.n}\\text{ mol }${ce(prod)}}{${c.L.n}\\text{ mol }${ce(lim)}} \\times \\dfrac{${c.MP.toFixed(2)}\\text{ g}}{1\\text{ mol}} = ${Lab.sig(c.th, 3)}\\text{ g}$.</p><p>Percent yield: $\\dfrac{${Lab.sig(c.act, 3)}\\text{ g}}{${Lab.sig(c.th, 3)}\\text{ g}} \\times 100\\% = ${yd.pct}\\%$.</p>`);
    if (yd.target !== undefined && !yd.hit && Math.abs(yd.pct - yd.target) <= 1) {
      yd.hit = true;
      Lab.collection.award(1);
      Lab.$('#yd-target').textContent = 'New target';
    }
  }
  Lab.segmented('#yd-rx', (v) => { yd.cfg = YD.find((y) => y.id === v); paintYield(); });
  Lab.bind('#yd-lim', null, null, (v) => { yd.limG = v; paintYield(); });
  Lab.bind('#yd-act', null, null, (v) => { yd.pct = v; paintYield(); });
  Lab.$('#yd-target').addEventListener('click', () => {
    let tgt;
    do { tgt = 50 + Math.floor(Math.random() * 46); } while (Math.abs(tgt - yd.pct) < 8);
    yd.target = tgt; yd.hit = false;
    Lab.$('#yd-target').textContent = 'New target';
    Lab.sound.pop();
  });
});
