/* Lesson 4.4: Stoichiometry. Recipes, mole ratios, and the down-across-up map. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const PI = Math.PI;

  /* ---------- Molecule shapes and drawing ---------- */
  const RADIUS = { H: 0.56, C: 0.82, N: 0.8, O: 0.78, F: 0.72, Cl: 0.98, S: 1, Na: 1.1, Br: 1.05, I: 1.15, P: 1, Mg: 1.05, Al: 1, Fe: 1.05 };
  const single = (s) => ({ a: [[s, 0, 0]], b: [] });
  const EXTRA = {
    Na: single('Na'), Mg: single('Mg'), Fe: single('Fe'), Al: single('Al'),
    MgO: { a: [['Mg', -0.52, 0], ['O', 0.52, 0]], b: [] },
    Fe2O3: { a: [['Fe', -0.52, -0.42], ['Fe', 0.52, -0.42], ['O', -1.02, 0.46], ['O', 0, 0.46], ['O', 1.02, 0.46]], b: [] },
  };
  const shapeOf = (f) => EXTRA[f] || Art.moleculeData(f);
  const atomR = (sym, s, style, scale) => (RADIUS[sym] || 0.9) * s * (style === 'ball' ? 0.42 : 0.62) * (scale || (style === 'ball' ? 1 : 1.28));
  /** Atom positions of a molecule at (x, y). */
  function atomsAt(f, x, y, s, rot = 0) {
    const m = shapeOf(f), c = Math.cos(rot), d = Math.sin(rot);
    return m.a.map(([sym, ax, ay]) => ({ sym, x: x + (ax * c - ay * d) * s, y: y + (ax * d + ay * c) * s }));
  }
  /** Draw any molecule, including ionic formula units Art.molecule does not know. */
  function mol(g, f, x, y, s, o = {}) {
    const style = o.style || 'fill', pts = atomsAt(f, x, y, s, o.rot || 0), m = shapeOf(f);
    const prev = g.globalAlpha;
    if (o.alpha !== undefined) g.globalAlpha = prev * o.alpha;
    if (style === 'ball') m.b.forEach(([i, j, ord]) => Art.bond(g, pts[i].x, pts[i].y, pts[j].x, pts[j].y, { order: ord, width: Math.max(3, s * 0.11) }));
    pts.map((_, i) => i).sort((a, b) => (pts[a].sym === 'H' ? 1 : 0) - (pts[b].sym === 'H' ? 1 : 0)).forEach((i) => {
      const p = pts[i], r = atomR(p.sym, s, style, o.atomScale);
      Art.atom(g, p.x, p.y, r, p.sym, { label: o.labels === false ? false : (r >= 11 ? p.sym : false), face: o.face && i === (o.faceAt || 0) ? o.face : null, look: o.look, t: o.t, seed: i + (o.seed || 0) });
    });
    g.globalAlpha = prev;
  }
  /** Width and height of a molecule drawn flat. */
  function extent(f, s, style) {
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    atomsAt(f, 0, 0, s).forEach((p) => { const r = atomR(p.sym, s, style); x0 = Math.min(x0, p.x - r); x1 = Math.max(x1, p.x + r); y0 = Math.min(y0, p.y - r); y1 = Math.max(y1, p.y + r); });
    return { w: x1 - x0, h: y1 - y0 };
  }

  /* ---------- Flying atoms: every atom on the left is literally moved to the right ---------- */
  function plan(before, after, s) {
    const src = [], dst = [], bondsA = [], bondsB = [];
    before.forEach((m) => { const base = src.length; atomsAt(m.f, m.x, m.y, s, m.rot).forEach((p) => src.push(p)); shapeOf(m.f).b.forEach(([i, j, o]) => bondsA.push([base + i, base + j, o])); });
    after.forEach((m) => { const base = dst.length; atomsAt(m.f, m.x, m.y, s, m.rot).forEach((p) => dst.push(p)); shapeOf(m.f).b.forEach(([i, j, o]) => bondsB.push([base + i, base + j, o])); });
    const used = new Array(src.length).fill(false);
    const atoms = dst.map((d, k) => {
      let best = -1, bd = 1e12;
      src.forEach((a, i) => { if (used[i] || a.sym !== d.sym) return; const dd = (a.x - d.x) ** 2 + (a.y - d.y) ** 2; if (dd < bd) { bd = dd; best = i; } });
      if (best < 0) throw new Error('Atoms not conserved at ' + d.sym);
      used[best] = true;
      return { sym: d.sym, src: best, x0: src[best].x, y0: src[best].y, x1: d.x, y1: d.y, seed: k * 1.37 + 3, delay: rand(k * 2.3 + 1) };
    });
    if (used.some((u) => !u)) throw new Error('Atoms not conserved: leftovers');
    return { src, dst, bondsA, bondsB, atoms, s, order: atoms.map((_, i) => i).sort((a, b) => (atoms[a].sym === 'H' ? 1 : 0) - (atoms[b].sym === 'H' ? 1 : 0)) };
  }
  /** q runs 0..1. Bonds break, atoms fly along gentle arcs, new bonds form. */
  function drawRun(g, run, q, o = {}) {
    const style = o.style || 'fill', t = o.t || 0, scale = o.atomScale;
    const fly = seg(q, 0.14, 0.88), shake = Math.sin(seg(q, 0, 0.14) * PI) * (o.shake === undefined ? 3 : o.shake);
    const posOf = (a) => {
      const u = ease.inOut(seg(fly, a.delay * 0.28, 0.72 + a.delay * 0.28));
      const dx = a.x1 - a.x0, dy = a.y1 - a.y0, d = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(u * PI) * Math.min(46, d * 0.14) * (rand(a.seed) > 0.5 ? 1 : -1);
      const jig = u <= 0 ? shake : 0, settle = u >= 1 ? 1.2 : 0;
      return { x: lerp(a.x0, a.x1, u) + (-dy / d) * arc + wander(a.seed, t * 3) * (jig + settle), y: lerp(a.y0, a.y1, u) + (dx / d) * arc + wander(a.seed + 9, t * 3) * (jig + settle), u };
    };
    const ps = run.atoms.map(posOf);
    if (style === 'ball') {
      const bySrc = {}; run.atoms.forEach((a, i) => { bySrc[a.src] = ps[i]; });
      const fade = 1 - seg(q, 0.06, 0.22);
      if (fade > 0) { g.save(); g.globalAlpha *= fade; run.bondsA.forEach(([i, j, ord]) => Art.bond(g, bySrc[i].x, bySrc[i].y, bySrc[j].x, bySrc[j].y, { order: ord, width: Math.max(3, run.s * 0.11) })); g.restore(); }
      const form = seg(q, 0.86, 0.98);
      if (form > 0) { g.save(); g.globalAlpha *= form; run.bondsB.forEach(([i, j, ord]) => Art.bond(g, ps[i].x, ps[i].y, ps[j].x, ps[j].y, { order: ord, width: Math.max(3, run.s * 0.11) })); g.restore(); }
    }
    run.order.forEach((i) => {
      const a = run.atoms[i], r = atomR(a.sym, run.s, style, scale);
      Art.atom(g, ps[i].x, ps[i].y, r, a.sym, { label: o.labels === false ? false : (r >= 11 ? a.sym : false), glow: ps[i].u > 0 && ps[i].u < 1 ? 0.5 : 0, face: o.faces && a.sym === o.faces && r >= 18 ? (ps[i].u > 0 && ps[i].u < 1 ? 'wow' : 'happy') : null, t, seed: a.seed, look: [0.7, 0] });
    });
  }

  /* ---------- Text helpers ---------- */
  /** A number with a unit followed by a formula. Art.formula eats decimals, so the number goes first as text. */
  function qty(g, num, f, x, y, o = {}) {
    const size = o.size || 26;
    g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
    const nw = num ? g.measureText(num + ' ').width : 0;
    const prev = g.globalAlpha;
    g.globalAlpha = 0; const fw = f ? Art.formula(g, f, 0, 0, { size }) : 0; g.globalAlpha = prev;
    const w = nw + fw, x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
    if (num) Art.text(g, num, x0, y, { font: 'display', size, color: o.color, align: 'left', halo: o.halo, alpha: o.alpha });
    if (f) {
      g.globalAlpha = prev * (o.alpha === undefined ? 1 : o.alpha);
      Art.formula(g, f, x0 + nw, y, { size, color: o.color, align: 'left', halo: o.halo, colorize: o.colorize });
      g.globalAlpha = prev;
    }
    return w;
  }
  /** A pill holding qty text. */
  function chip(g, num, f, x, y, o = {}) {
    const size = o.size || 25, a = o.alpha === undefined ? 1 : o.alpha;
    if (a <= 0) return;
    g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
    const nw = num ? g.measureText(num + ' ').width : 0;
    const prev = g.globalAlpha;
    g.globalAlpha = 0; const fw = f ? Art.formula(g, f, 0, 0, { size }) : 0; g.globalAlpha = prev;
    const w = nw + fw + size * 1.1, h = size * 1.62;
    g.globalAlpha = prev * a;
    g.fillStyle = o.bg || C.plum2; g.strokeStyle = o.stroke || 'rgba(255,255,255,.4)'; g.lineWidth = 2.5;
    Art.round(g, x - w / 2, y - h / 2, w, h, h / 2); g.fill(); g.stroke();
    g.globalAlpha = prev;
    qty(g, num, f, x, y + 1, { size, color: o.color || '#fff', alpha: a });
  }
  /** Colored formula like Art.formula, but carbon stays readable on the dark stage. Returns the width. */
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
  /** Parse "2H2 + O2 -> 2H2O". */
  function parseEq(s) {
    const side = (x) => x.split(' + ').map((t) => { const m = /^(\d*)(.+)$/.exec(t.trim()); return { n: m[1] ? +m[1] : 1, f: m[2] }; });
    const [l, r] = s.split(' -> ');
    const rx = { s, r: side(l), p: side(r) };
    const tally = (list) => { const c = {}; list.forEach(({ n, f }) => { const a = Bank.countAtoms(f); for (const e in a) c[e] = (c[e] || 0) + a[e] * n; }); return c; };
    const a = tally(rx.r), b = tally(rx.p);
    Object.keys({ ...a, ...b }).forEach((e) => { if (a[e] !== b[e]) throw new Error('Unbalanced: ' + s); });
    rx.atoms = a;
    return rx;
  }
  /** Draw a colored equation term by term. Returns the center x of each term and its coefficient. */
  function equation(g, rx, cx, y, o = {}) {
    const size = o.size || 36, all = [];
    rx.r.forEach((t, i) => { if (i) all.push({ op: '+' }); all.push({ t, side: 'r', k: i }); });
    all.push({ op: '→' });
    rx.p.forEach((t, i) => { if (i) all.push({ op: '+' }); all.push({ t, side: 'p', k: i }); });
    const prev = g.globalAlpha;
    g.globalAlpha = 0;
    let total = 0;
    all.forEach((a) => {
      if (a.op) { g.font = `400 ${size}px ${Art.FONT_DISPLAY}`; a.w = g.measureText(a.op).width + size * 0.7; }
      else { const coef = a.t.n > 1 || o.showOnes ? String(a.t.n) : ''; g.font = `400 ${size}px ${Art.FONT_DISPLAY}`; a.cw = coef ? g.measureText(coef).width + (o.coefGap || 0) : 0; a.coef = coef; a.fw = cform(g, a.t.f, 0, 0, { size, measure: true }); a.w = a.cw + a.fw; }
      total += a.w;
    });
    g.globalAlpha = prev;
    let x = cx - total / 2;
    const out = { r: [], p: [], x0: x, x1: x + total };
    all.forEach((a) => {
      if (a.op) { Art.text(g, a.op, x + a.w / 2, y, { font: 'display', size, color: C.dim, halo: o.halo, alpha: o.alpha }); }
      else {
        const col = o.coefColor && o.coefColor(a) ;
        if (a.coef) Art.text(g, a.coef, x, y, { font: 'display', size, align: 'left', color: col || C.sun, halo: o.halo, alpha: o.alpha });
        cform(g, a.t.f, x + a.cw, y, { size, align: 'left', halo: o.halo, alpha: o.alpha });
        out[a.side][a.k] = { cx: x + a.w / 2, coefX: x + (a.cw - (o.coefGap || 0)) / 2, formulaX: x + a.cw + a.fw / 2, x0: x, w: a.w };
      }
      x += a.w;
    });
    return out;
  }
  /** A row of atom badges with counts: H × 12, O × 8. */
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
    return tw;
  }
  const scaleCounts = (c, k) => { const o = {}; for (const e in c) o[e] = c[e] * k; return o; };
  /** A stacked fraction. */
  function frac(g, top, bot, x, y, o = {}) {
    const size = o.size || 26, gap = size * 0.72;
    const prev = g.globalAlpha;
    g.globalAlpha = 0;
    const w = Math.max(qty(g, top[0], top[1], 0, 0, { size }), qty(g, bot[0], bot[1], 0, 0, { size }));
    g.globalAlpha = prev;
    qty(g, top[0], top[1], x, y - gap, { size, color: o.color, alpha: o.alpha, halo: o.halo });
    qty(g, bot[0], bot[1], x, y + gap, { size, color: o.color, alpha: o.alpha, halo: o.halo });
    g.globalAlpha = prev * (o.alpha === undefined ? 1 : o.alpha);
    g.fillStyle = o.color || C.ink; g.fillRect(x - w / 2 - 4, y - 1.5, w + 8, 3);
    g.globalAlpha = prev;
    return w + 8;
  }

  /* ---------- Sandwich art ---------- */
  function breadPath(g) {
    g.beginPath(); g.moveTo(-30, 34); g.lineTo(-30, -6);
    g.bezierCurveTo(-46, -10, -46, -38, -20, -38); g.lineTo(20, -38);
    g.bezierCurveTo(46, -38, 46, -10, 30, -6); g.lineTo(30, 34);
    g.quadraticCurveTo(30, 40, 24, 40); g.lineTo(-24, 40); g.quadraticCurveTo(-30, 40, -30, 34); g.closePath();
  }
  function bread(g, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); if (o.rot) g.rotate(o.rot); if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    breadPath(g);
    g.fillStyle = '#C07A32'; g.fill(); g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.6; g.stroke();
    g.save(); g.scale(0.84, 0.84); g.translate(0, 0); breadPath(g);
    const gr = g.createLinearGradient(0, -38, 0, 40); gr.addColorStop(0, '#FFF1CC'); gr.addColorStop(1, '#F2D79C');
    g.fillStyle = gr; g.fill(); g.restore();
    g.fillStyle = 'rgba(190,140,70,.55)';
    [[-14, -14, 2.4], [8, -22, 2], [16, 4, 2.6], [-8, 12, 2.2], [4, 24, 2], [-18, 22, 1.8]].forEach(([a, b, r]) => { g.beginPath(); g.arc(a, b, r, 0, 6.283); g.fill(); });
    g.restore();
  }
  function cheese(g, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.rot === undefined ? 0.12 : o.rot); if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    const gr = g.createLinearGradient(-30, -30, 30, 30); gr.addColorStop(0, '#FFE066'); gr.addColorStop(1, '#F7B500');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.6;
    Art.round(g, -32, -32, 64, 64, 6); g.fill(); g.stroke();
    g.fillStyle = '#E09A00';
    [[-14, -12, 7], [12, -16, 4.5], [14, 12, 8], [-12, 16, 5]].forEach(([a, b, r]) => { g.beginPath(); g.arc(a, b, r, 0, 6.283); g.fill(); });
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
  /** A burlap sack with a label. */
  function sack(g, x, y, s, label, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    const gr = g.createRadialGradient(-14, -14, 6, 0, 8, 62);
    gr.addColorStop(0, '#E7C794'); gr.addColorStop(1, '#A87D4E');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-16, -38);
    g.bezierCurveTo(-54, -18, -52, 44, -28, 48); g.lineTo(28, 48);
    g.bezierCurveTo(52, 44, 54, -18, 16, -38); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#C69C66'; g.beginPath(); g.moveTo(-16, -38); g.quadraticCurveTo(-26, -56, -13, -54); g.lineTo(13, -54); g.quadraticCurveTo(26, -56, 16, -38); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = C.pink; g.lineWidth = 5; g.beginPath(); g.moveTo(-17, -38); g.lineTo(17, -38); g.stroke();
    g.restore();
    if (label) Art.text(g, label, x, y + 8 * s, { font: 'display', size: o.size || 26, color: '#3A2412', alpha: o.alpha });
  }

  /* ---------- Story 1: the recipe ---------- */
  const STORY_H2O = parseEq('2H2 + O2 -> 2H2O');
  const runSmall = plan(
    [{ f: 'H2', x: 96, y: 160, rot: 0.2 }, { f: 'H2', x: 96, y: 300, rot: -0.15 }, { f: 'O2', x: 262, y: 230, rot: 1.4 }],
    [{ f: 'H2O', x: 610, y: 150, rot: 0.1 }, { f: 'H2O', x: 610, y: 300, rot: -0.1 }], 64);
  const crowdLeft = [];
  for (let i = 0; i < 10; i++) crowdLeft.push({ f: 'H2', x: 62 + (i % 5) * 62, y: 150 + Math.floor(i / 5) * 62, rot: rand(i + 1) * 3 });
  for (let i = 0; i < 5; i++) crowdLeft.push({ f: 'O2', x: 62 + i * 62, y: 290, rot: rand(i + 21) * 3 });
  const crowdRight = [];
  for (let i = 0; i < 10; i++) crowdRight.push({ f: 'H2O', x: 492 + (i % 4) * 78 + (Math.floor(i / 4) === 2 ? 78 : 0), y: 148 + Math.floor(i / 4) * 78, rot: rand(i + 41) * 1.2 - 0.6 });
  const runCrowd = plan(crowdLeft, crowdRight, 28);

  const crate = (g, x, y, w, h) => {
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x + w / 2, y + h + 4, w * 0.54, 10, 0, 0, 6.283); g.fill();
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#7B5233'); gr.addColorStop(1, '#5D3B24');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; Art.round(g, x, y, w, h, 14); g.fill(); g.stroke();
    g.fillStyle = '#4A2E1C'; Art.round(g, x + 8, y + 8, w - 16, h - 16, 8); g.fill();
  };

  Lab.story('#story-recipe', {
    title: 'From sandwiches to moles',
    scenes: [
      {
        say: 'A sandwich has a recipe: <b>2</b> slices of bread and <b>1</b> slice of cheese make <b>1</b> sandwich.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          const a1 = ease.back(seg(p, 0, 0.12)), a2 = ease.back(seg(p, 0.08, 0.2)), a3 = ease.back(seg(p, 0.2, 0.32));
          const dimL = 1 - 0.18 * seg(p, 0.5, 0.75);
          if (a1 > 0) bread(g, 90, 185, 1.3 * a1, { alpha: dimL });
          if (a2 > 0) bread(g, 215, 185, 1.3 * a2, { alpha: dimL });
          Art.text(g, '+', 292, 185, { font: 'display', size: 54, color: C.dim, alpha: seg(p, 0.18, 0.26) });
          if (a3 > 0) cheese(g, 375, 185, 1.3 * a3, { alpha: dimL });
          Art.arrow(g, 462, 185, 544, 185, { color: C.pink, w: 8, p: seg(p, 0.34, 0.46) });
          // Ingredient copies fly in and stack.
          const f = ease.inOut(seg(p, 0.46, 0.76));
          if (f > 0 && f < 1) {
            bread(g, lerp(90, 666, f), lerp(185, 185 - Math.sin(f * PI) * 50, f), 1.3);
            cheese(g, lerp(375, 666, f), 185 + Math.sin(f * PI) * 40, 1.3);
            bread(g, lerp(215, 666, f), 185 - Math.sin(f * PI) * 34, 1.3);
          }
          const s = ease.back(seg(p, 0.76, 0.9));
          if (s > 0) sandwich(g, 666, 185, 1.55 * s, { face: 'grin', t, seed: 2 });
          Art.burst(g, 666, 185, seg(p, 0.76, 0.98), { n: 16, r: 120 });
          const lab = seg(p, 0.05, 0.3);
          Art.text(g, '2 bread', 152, 310, { font: 'display', size: 38, color: C.sun, alpha: lab });
          Art.text(g, '1 cheese', 375, 310, { font: 'display', size: 38, color: C.sun, alpha: seg(p, 0.2, 0.32) });
          Art.text(g, '1 sandwich', 666, 310, { font: 'display', size: 38, color: C.sun, alpha: seg(p, 0.8, 0.92) });
          const r = seg(p, 0.88, 1);
          if (r > 0) {
            g.fillStyle = Art.alpha(C.plum2, r); Art.round(g, W / 2 - 200, H - 92, 400, 62, 24); g.fill();
            Art.text(g, 'That is the recipe', W / 2, H - 60, { size: 32, alpha: r });
          }
        },
      },
      {
        say: 'Want 3 sandwiches? Multiply the whole recipe by 3. Now you need <b>6 bread</b> and <b>3 cheese</b>.',
        dur: 3.6,
        draw(g, p, t, { W, H }) {
          for (let row = 0; row < 3; row++) {
            const q = seg(p, 0.04 + row * 0.24, 0.3 + row * 0.24), y = 72 + row * 106;
            const a = ease.back(q);
            if (a <= 0) continue;
            bread(g, 112, y, 0.92 * a); bread(g, 200, y, 0.92 * a);
            Art.text(g, '+', 268, y, { font: 'display', size: 40, color: C.dim, alpha: q });
            cheese(g, 336, y, 0.92 * a);
            Art.arrow(g, 408, y, 470, y, { color: C.pink, w: 6, p: q });
            sandwich(g, 548, y, 0.96 * a, { face: 'happy', t, seed: row });
          }
          const v = seg(p, 0.1, 0.3);
          Art.text(g, '× 3', 700, 178, { font: 'display', size: 76, color: C.pink, alpha: v });
          const r = seg(p, 0.8, 0.96);
          if (r > 0) {
            g.fillStyle = Art.alpha(C.plum2, r); Art.round(g, W / 2 - 330, H - 62, 660, 52, 22); g.fill();
            Art.text(g, '6 bread + 3 cheese → 3 sandwiches', W / 2, H - 36, { font: 'display', size: 34, color: C.sun, alpha: r });
          }
        },
      },
      {
        say: 'A <b>dozen</b> works the same way: 2 dozen bread and 1 dozen cheese make 1 dozen sandwiches. The counting word changes. The ratio never does.',
        dur: 4,
        draw(g, p, t, { W }) {
          const q1 = seg(p, 0.02, 0.4), q2 = seg(p, 0.26, 0.6), q3 = seg(p, 0.5, 0.86);
          crate(g, 34, 92, 290, 200);
          for (let i = 0; i < 24; i++) { const a = ease.back(clamp(q1 * 34 - i)); if (a > 0) bread(g, 66 + (i % 6) * 45, 124 + Math.floor(i / 6) * 45, 0.45 * a); }
          Art.text(g, '+', 352, 192, { font: 'display', size: 46, color: C.dim, alpha: q2 });
          crate(g, 382, 92, 136, 200);
          for (let i = 0; i < 12; i++) { const a = ease.back(clamp(q2 * 18 - i)); if (a > 0) cheese(g, 414 + (i % 3) * 37, 118 + Math.floor(i / 3) * 49, 0.42 * a); }
          Art.arrow(g, 528, 192, 576, 192, { color: C.pink, w: 7, p: q3 });
          crate(g, 590, 92, 176, 200);
          for (let i = 0; i < 12; i++) { const a = ease.back(clamp(q3 * 18 - i)); if (a > 0) sandwich(g, 622 + (i % 3) * 56, 124 + Math.floor(i / 3) * 46, 0.42 * a); }
          Art.text(g, '2 dozen', 179, 56, { font: 'display', size: 38, color: C.sun, alpha: q1 });
          Art.text(g, '1 dozen', 450, 56, { font: 'display', size: 38, color: C.sun, alpha: q2 });
          Art.text(g, '1 dozen', 678, 56, { font: 'display', size: 38, color: C.sun, alpha: q3 });
          const a = seg(p, 0.82, 0.98);
          Art.text(g, 'Ratio', W / 2 - 150, 368, { size: 34, alpha: a, color: C.dim });
          Art.text(g, '2 : 1 : 1', W / 2 + 30, 368, { font: 'display', size: 62, color: C.pink, alpha: a });
          Art.moe(g, 716, 432, 108, 'happy', { t, flip: true });
        },
      },
      {
        say: 'Chemistry recipes look just the same. In a balanced equation, the big numbers in front are the <b>coefficients</b>. They tell you how many of each molecule to use.',
        dur: 3.6,
        draw(g, p, t, { W }) {
          const eqa = seg(p, 0, 0.2);
          const pos = equation(g, STORY_H2O, W / 2, 56, { size: 58, alpha: eqa, showOnes: true, coefGap: 14 });
          const ringQ = seg(p, 0.5, 0.74);
          [pos.r[0], pos.r[1], pos.p[0]].forEach((c) => { if (ringQ > 0 && c) Art.ring(g, c.coefX, 56, 29, { color: C.pink, w: 5, p: ringQ }); });
          const q = ease.back(seg(p, 0.14, 0.4));
          const y = 235;
          if (q > 0) {
            g.save(); g.translate(0, (1 - q) * 20); g.globalAlpha *= clamp(q);
            mol(g, 'H2', 120, y - 66, 60, { style: 'ball', atomScale: 1.6, face: 'happy', t, faceAt: 0, rot: 0, look: [1, 0] });
            mol(g, 'H2', 120, y + 66, 60, { style: 'ball', atomScale: 1.6, face: 'happy', t, faceAt: 0, rot: 0, seed: 3, look: [1, 0] });
            Art.text(g, '+', 222, y, { font: 'display', size: 54, color: C.dim });
            mol(g, 'O2', 330, y, 76, { style: 'ball', atomScale: 1.5, face: 'happy', t, rot: 0, look: [1, 0] });
            Art.arrow(g, 442, y, 522, y, { color: C.pink, w: 8 });
            mol(g, 'H2O', 650, y - 72, 66, { style: 'ball', atomScale: 1.5, face: 'grin', t, faceAt: 0 });
            mol(g, 'H2O', 650, y + 72, 66, { style: 'ball', atomScale: 1.5, face: 'grin', t, faceAt: 0, seed: 3 });
            g.restore();
          }
          const a = seg(p, 0.6, 0.82);
          Art.text(g, '2 molecules', 120, 410, { size: 30, color: C.sun, alpha: a });
          Art.text(g, '1 molecule', 330, 410, { size: 30, color: C.sun, alpha: a });
          Art.text(g, '2 molecules', 650, 410, { size: 30, color: C.sun, alpha: a });
        },
      },
      {
        say: 'Now run it. Bonds break, atoms swap partners, and <b>nothing is lost</b>. Count them: 4 H and 2 O before, 4 H and 2 O after.',
        dur: 4.8,
        draw(g, p, t, { W, H }) {
          equation(g, STORY_H2O, W / 2, 38, { size: 38 });
          const q = seg(p, 0.1, 0.84);
          [{ f: 'H2', x: 96, y: 160, rot: 0.2 }, { f: 'H2', x: 96, y: 300, rot: -0.15 }, { f: 'O2', x: 262, y: 230, rot: 1.4 }].forEach((m) => mol(g, m.f, m.x, m.y, 64, { style: 'ball', atomScale: 1.5, rot: m.rot, alpha: 0.24 * seg(q, 0.1, 0.4), labels: false }));
          drawRun(g, runSmall, q, { style: 'ball', atomScale: 1.5, t, faces: 'O', shake: 4 });
          Art.burst(g, 610, 150, seg(p, 0.72, 0.96), { n: 12, r: 90 });
          Art.burst(g, 610, 300, seg(p, 0.74, 0.98), { n: 12, r: 90 });
          g.fillStyle = 'rgba(16,8,32,.72)'; Art.round(g, 24, H - 66, W - 48, 54, 22); g.fill();
          Art.text(g, 'Before', 112, H - 39, { size: 26, color: C.dim });
          tally(g, STORY_H2O.atoms, 256, H - 39, { size: 28 });
          const a = seg(p, 0.84, 0.96);
          Art.text(g, 'After', 490, H - 39, { size: 26, color: C.dim, alpha: a });
          tally(g, STORY_H2O.atoms, 630, H - 39, { size: 28, alpha: a });
          Art.text(g, '=', 388, H - 39, { font: 'display', size: 40, color: C.leaf, alpha: a });
        },
      },
      {
        say: 'Scale it up like the sandwiches. <b>10 H₂</b> and <b>5 O₂</b> make <b>10 H₂O</b>. Same 2 to 1 to 2 ratio, and still not one atom is lost.',
        dur: 5,
        draw(g, p, t, { W, H }) {
          const eq5 = parseEq('10H2 + 5O2 -> 10H2O');
          equation(g, eq5, W / 2, 40, { size: 44 });
          g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, 16, 86, 362, 278, 24); g.fill(); Art.round(g, 448, 86, 336, 300, 24); g.fill();
          // Faint ghosts keep the starting crowd visible after the atoms leave.
          crowdLeft.forEach((m) => mol(g, m.f, m.x, m.y, 28, { rot: m.rot, alpha: 0.28, labels: false }));
          drawRun(g, runCrowd, seg(p, 0.08, 0.86), { t, labels: false, shake: 2 });
          Art.arrow(g, 388, 226, 438, 226, { color: C.pink, w: 7, p: seg(p, 0.05, 0.2) });
          const a = seg(p, 0.86, 0.98);
          Art.text(g, 'Before', 96, H - 28, { size: 26, color: C.dim });
          tally(g, scaleCounts(STORY_H2O.atoms, 5), 262, H - 28, { size: 27 });
          Art.text(g, '=', 414, H - 28, { font: 'display', size: 40, color: C.leaf, alpha: a });
          Art.text(g, 'After', 506, H - 28, { size: 26, color: C.dim, alpha: a });
          tally(g, scaleCounts(STORY_H2O.atoms, 5), 662, H - 28, { size: 27, alpha: a });
        },
      },
      {
        say: 'A mole is only a counting word, like a dozen. So <b>2 mol H₂</b> and <b>1 mol O₂</b> make <b>2 mol H₂O</b>. The coefficients are a mole ratio.',
        dur: 4,
        draw(g, p, t, { W }) {
          const y = 196;
          const q = (a, b) => ease.back(seg(p, a, b));
          const sk = (x, a, b, lab) => { const s = q(a, b); if (s > 0) sack(g, x, y, 1.08 * s, lab, { size: 26, alpha: clamp(s) }); };
          sk(82, 0.04, 0.2, '1 mol'); sk(204, 0.1, 0.26, '1 mol');
          Art.text(g, '+', 296, y, { font: 'display', size: 50, color: C.dim, alpha: seg(p, 0.22, 0.3) });
          sk(386, 0.24, 0.4, '1 mol');
          Art.arrow(g, 462, y, 526, y, { color: C.pink, w: 8, p: seg(p, 0.4, 0.5) });
          sk(600, 0.48, 0.64, '1 mol'); sk(722, 0.54, 0.7, '1 mol');
          qty(g, '2 mol', 'H2', 143, 300, { size: 38, color: C.sun, alpha: seg(p, 0.2, 0.34) });
          qty(g, '1 mol', 'O2', 386, 300, { size: 38, color: C.sun, alpha: seg(p, 0.36, 0.5) });
          qty(g, '2 mol', 'H2O', 661, 300, { size: 38, color: C.sun, alpha: seg(p, 0.64, 0.78) });
          const a = seg(p, 0.78, 0.94);
          if (a > 0) {
            g.fillStyle = Art.alpha(C.pink, a); Art.round(g, W / 2 - 300, 352, 600, 72, 26); g.fill();
            Art.text(g, 'Mole ratio 2 : 1 : 2', W / 2, 389, { font: 'display', size: 46, color: '#fff', alpha: a });
          }
        },
      },
      {
        say: 'Any two coefficients make a conversion factor called a <b>mole ratio</b>. It is your bridge from one substance to another. Put what you want on top.',
        dur: 3.8,
        draw(g, p, t, { W }) {
          equation(g, STORY_H2O, W / 2, 46, { size: 46 });
          const cards = [
            [[ '2 mol', 'H2O' ], [ '1 mol', 'O2' ], 'O₂ to H₂O', 150, 0.08],
            [[ '2 mol', 'H2' ], [ '1 mol', 'O2' ], 'O₂ to H₂', 400, 0.28],
            [[ '1 mol', 'O2' ], [ '2 mol', 'H2O' ], 'H₂O to O₂', 650, 0.48],
          ];
          cards.forEach(([top, bot, cap, x, d]) => {
            const q = ease.back(seg(p, d, d + 0.22));
            if (q <= 0) return;
            g.save(); g.translate(x, 210); g.scale(q, q);
            g.fillStyle = '#2E5B4E'; g.strokeStyle = '#8A6A45'; g.lineWidth = 8; Art.round(g, -112, -82, 224, 164, 12); g.fill(); g.stroke();
            frac(g, top, bot, 0, 0, { size: 34, color: '#F4F8F0' });
            g.restore();
            Art.text(g, cap, x, 324, { size: 27, color: C.sun, alpha: seg(p, d + 0.1, d + 0.24) });
          });
          Art.moe(g, 118, 448, 92, 'point', { t });
          Art.bubble(g, 'Want on top, know on the bottom.', 180, 396, { w: 480, side: 'left', size: 28, alpha: seg(p, 0.7, 0.86) });
        },
      },
    ],
  });

  /* ---------- Bench: reaction visualizer ---------- */
  const RUNS = [
    { id: 'h2o', btn: 'Water', eq: '2H2 + O2 -> 2H2O', max: 5 },
    { id: 'nh3', btn: 'Ammonia', eq: 'N2 + 3H2 -> 2NH3', max: 3 },
    { id: 'ch4', btn: 'Methane burning', eq: 'CH4 + 2O2 -> CO2 + 2H2O', max: 4 },
    { id: 'c3h8', btn: 'Propane burning', eq: 'C3H8 + 5O2 -> 3CO2 + 4H2O', max: 2 },
    { id: 'co', btn: 'Carbon monoxide', eq: '2CO + O2 -> 2CO2', max: 5 },
    { id: 'nacl', btn: 'Table salt', eq: '2Na + Cl2 -> 2NaCl', max: 5 },
    { id: 'rust', btn: 'Rust', eq: '4Fe + 3O2 -> 2Fe2O3', max: 2 },
    { id: 'h2o2', btn: 'Peroxide splits', eq: '2H2O2 -> 2H2O + O2', max: 4 },
  ];
  RUNS.forEach((r) => { r.rx = parseEq(r.eq); });
  Lab.$('#run-rx').innerHTML = RUNS.map((r, i) => `<button type="button" data-value="${r.id}" aria-pressed="${i === 0}">${r.btn}</button>`).join('');

  /** Lay molecules out in labeled bands so they fill a box. Shrinks the molecules until everything fits. */
  function bands(list, x0, y0, x1, y1, sMax, seed) {
    const W = x1 - x0, H = y1 - y0, head = 34;
    for (let s = sMax; s >= 12; s -= 1) {
      const rows = list.map(({ f, n }) => {
        const e = extent(f, s, 'fill'), cw = e.w * 1.06 + 4, ch = e.h * 1.06 + 4;
        const cols = Math.max(1, Math.min(n, Math.floor(W / cw)));
        return { f, n, cw, ch, cols, r: Math.ceil(n / cols) };
      });
      const need = rows.reduce((a, b) => a + head + b.r * b.ch, 0);
      if (need > H) continue;
      const extra = (H - need) / rows.length;
      const out = [], heads = [];
      let y = y0;
      rows.forEach((b) => {
        heads.push({ f: b.f, n: b.n, y: y + 15 });
        const top = y + head + extra * 0.3;
        for (let i = 0; i < b.n; i++) {
          const rowI = Math.floor(i / b.cols), inRow = rowI === b.r - 1 ? b.n - rowI * b.cols : b.cols;
          const gap = Math.min(W / inRow, b.cw * 1.45);
          const cx = (x0 + x1) / 2 + ((i % b.cols) - (inRow - 1) / 2) * gap;
          out.push({ f: b.f, x: cx, y: top + rowI * b.ch + b.ch / 2, rot: (rand(seed + i * 1.3 + b.n) - 0.5) * 0.5 });
        }
        y += head + b.r * b.ch + extra;
      });
      return { mols: out, heads, s };
    }
    throw new Error('Could not fit molecules');
  }
  const runState = { cur: RUNS[0], k: 2, t0: 0, layout: null, dirty: true };
  function buildRun() {
    const { rx } = runState.cur, k = runState.k;
    const left = bands(rx.r.map((t) => ({ f: t.f, n: t.n * k })), 26, 118, 372, 388, 48, 3);
    const right = bands(rx.p.map((t) => ({ f: t.f, n: t.n * k })), 428, 118, 774, 388, 48, 9);
    const s = Math.min(left.s, right.s);
    // Redo with one shared scale so sizes match on both sides.
    const L = bands(rx.r.map((t) => ({ f: t.f, n: t.n * k })), 26, 118, 372, 388, s, 3);
    const R = bands(rx.p.map((t) => ({ f: t.f, n: t.n * k })), 428, 118, 774, 388, s, 9);
    runState.layout = { L, R, run: plan(L.mols, R.mols, s), s };
  }
  const q0 = (t) => (Lab.reducedMotion ? 1 : clamp((t - runState.t0 - 0.2) / 3));
  const runStage = Lab.stage('#c-run', {
    h: 520, label: 'Reactant molecules on the left break apart and their atoms fly to form product molecules on the right, with atom counts underneath.',
    draw(g, t, dt, s) {
      if (runState.dirty) { buildRun(); runState.dirty = false; runState.t0 = t; }
      const { rx } = runState.cur, k = runState.k, L = runState.layout;
      const scaled = { r: rx.r.map((a) => ({ n: a.n * k, f: a.f })), p: rx.p.map((a) => ({ n: a.n * k, f: a.f })) };
      const pos = equation(g, rx, 400, 34, { size: 38 });
      const label = (c, n) => { if (c) Art.text(g, `${n} mol`, c.cx, 76, { size: 24, color: C.cyan }); };
      rx.r.forEach((a, i) => label(pos.r[i], scaled.r[i].n));
      rx.p.forEach((a, i) => label(pos.p[i], scaled.p[i].n));
      // Panels.
      g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, 14, 100, 370, 298, 22); g.fill(); Art.round(g, 416, 100, 370, 298, 22); g.fill();
      L.L.heads.forEach((h) => qty(g, `${h.n}`, h.f, 26, h.y + 8, { size: 24, align: 'left', color: C.dim }));
      L.R.heads.forEach((h) => qty(g, `${h.n}`, h.f, 428, h.y + 8, { size: 24, align: 'left', color: C.dim }));
      L.L.mols.forEach((m) => mol(g, m.f, m.x, m.y, L.s, { rot: m.rot, alpha: 0.34 * seg(q0(t), 0.1, 0.5) + 0, labels: false }));
      const q = q0(t);
      drawRun(g, L.run, q, { t, shake: 2.5 });
      Art.arrow(g, 386, 248, 414, 248, { color: C.pink, w: 6, head: 16 });
      // Atom tally.
      const atoms = scaleCounts(rx.atoms, k), a = seg(q, 0.86, 1);
      Art.text(g, 'Atoms before', 199, 425, { size: 25, color: C.dim });
      tally(g, atoms, 199, 470, { size: 28, r: 20 });
      Art.text(g, '=', 400, 458, { font: 'display', size: 60, color: C.leaf, alpha: a });
      Art.text(g, 'Atoms after', 601, 425, { size: 25, color: C.dim, alpha: a });
      tally(g, atoms, 601, 470, { size: 28, r: 20, alpha: a });
      void dt; void s;
    },
  });
  const moleF = (f) => Lab.fHTML(f);
  function paintRun() {
    const { rx } = runState.cur, k = runState.k;
    const first = rx.r[0];
    const inp = Lab.$('#run-n');
    Lab.$('#run-n-label').innerHTML = `${moleF(first.f)} you start with`;
    Lab.$('#run-n-out').textContent = `${first.n * k} mol`;
    void inp;
    const row = (a) => `<div class="readout"><div class="readout-label">${moleF(a.f)}</div><div class="readout-value">${Lab.fmt(a.n * k * Bank.molarMass(a.f), 2)} g</div></div>`;
    const tot = (list) => list.reduce((s, a) => s + a.n * k * Bank.molarMass(a.f), 0);
    Lab.$('#run-readouts').innerHTML = rx.r.map(row).join('') + `<div class="readout is-sun"><div class="readout-label">Total mass in</div><div class="readout-value">${Lab.fmt(tot(rx.r), 2)} g</div></div>` + rx.p.map(row).join('') + `<div class="readout is-sun"><div class="readout-label">Total mass out</div><div class="readout-value">${Lab.fmt(tot(rx.p), 2)} g</div></div>`;
  }
  Lab.segmented('#run-rx', (v) => {
    runState.cur = RUNS.find((r) => r.id === v);
    const inp = Lab.$('#run-n');
    inp.max = runState.cur.max;
    if (+inp.value > runState.cur.max) inp.value = runState.cur.max;
    runState.k = +inp.value; runState.dirty = true;
    Lab.paintRange(inp); paintRun(); runStage.redraw();
  });
  Lab.bind('#run-n', null, null, (v) => { runState.k = v; runState.dirty = true; paintRun(); runStage.redraw(); });
  Lab.$('#run-again').addEventListener('click', () => { runState.dirty = true; Lab.sound.pop(); runStage.redraw(); });

  /* ---------- Story 2: why grams will not work ---------- */
  const SCATTER_H2 = [];
  for (let i = 0; i < 32; i++) {
    const a = i * 2.39996, d = Math.sqrt((i + 0.5) / 32) * 118;
    SCATTER_H2.push([Math.cos(a) * d, Math.sin(a) * d, rand(i + 5) * 3]);
  }
  /** A soft sample bag, since most of these reactants are gases. y is the bottom edge. */
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
  /** A beam balance with wide pans, sized for the stage. Pans hang at y = baseY - h + drop. */
  function beam(g, cx, baseY, span, o = {}) {
    const h = o.h || 220, drop = o.drop || 108, pan = o.pan || 128, col = '#E4DEF4', tiltY = (o.tilt || 0) * 26;
    const by = baseY - h;
    g.save();
    g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - 110, baseY); g.quadraticCurveTo(cx, baseY - 18, cx + 110, baseY); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = col; g.lineWidth = 11; g.beginPath(); g.moveTo(cx, baseY - 8); g.lineTo(cx, by); g.stroke();
    g.lineWidth = 10; g.beginPath(); g.moveTo(cx - span, by - tiltY); g.lineTo(cx + span, by + tiltY); g.stroke();
    g.fillStyle = C.pink; g.beginPath(); g.arc(cx, by, 12, 0, 6.283); g.fill();
    [[-1, o.drawL, -tiltY], [1, o.drawR, tiltY]].forEach(([d, draw, ty]) => {
      const x = cx + d * span, y0 = by + ty, py = y0 + drop;
      g.strokeStyle = 'rgba(228,222,244,.75)'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x - pan, py); g.moveTo(x, y0); g.lineTo(x + pan, py); g.stroke();
      g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(x - pan - 8, py); g.quadraticCurveTo(x, py + 24, x + pan + 8, py); g.closePath(); g.fill(); g.stroke();
      if (draw) draw(g, x, py);
    });
    g.restore();
  }

  Lab.story('#story-grams', {
    title: 'Two grams and one gram?',
    bg: 'lab',
    scenes: [
      {
        say: 'The recipe says 2 H₂ for every 1 O₂. So should you weigh out <b>2 grams</b> of H₂ and <b>1 gram</b> of O₂? It sounds right. Try it.',
        dur: 3,
        draw(g, p, t, { W, H }) {
          equation(g, STORY_H2O, W / 2, 46, { size: 46 });
          const benchY = H - 70;
          const a = ease.back(seg(p, 0.1, 0.34)), b = ease.back(seg(p, 0.24, 0.48));
          if (a > 0) { Art.digitalScale(g, 220, benchY + 2, 240, '2.00 g', { size: 22 }); gasBag(g, 220, benchY - 36, 150 * a, 96 * a, '#E3E6F2'); }
          if (b > 0) { Art.digitalScale(g, 560, benchY + 2, 240, '1.00 g', { size: 22 }); gasBag(g, 560, benchY - 36, 86 * b, 44 * b, '#FF7682'); }
          cform(g, 'H2', 220, 150, { size: 46 });
          cform(g, 'O2', 560, 214, { size: 46 });
          Art.moe(g, 390, H - 66, 110, 'think', { t });
          Art.bubble(g, '2 to 1?', 390, H - 186, { w: 130, size: 30, alpha: seg(p, 0.55, 0.75) });
        },
      },
      {
        say: 'Look inside. 2 g of H₂ holds about <b>32 times</b> as many molecules as 1 g of O₂. That is nowhere near a 2 to 1 mix.',
        dur: 3.6,
        draw(g, p, t, { W, H }) {
          const benchY = H - 40;
          Art.digitalScale(g, 160, benchY + 2, 190, '2.00 g', { size: 22 });
          gasBag(g, 160, benchY - 36, 104, 58, '#E3E6F2');
          Art.digitalScale(g, 640, benchY + 2, 190, '1.00 g', { size: 22 });
          gasBag(g, 640, benchY - 36, 60, 30, '#FF7682');
          const n = Math.ceil(32 * ease.out(seg(p, 0.22, 0.74)));
          Art.zoom(g, 160, benchY - 76, 160, 150, 138, (gg, cx, cy) => {
            for (let i = 0; i < n; i++) mol(gg, 'H2', cx + SCATTER_H2[i][0] + wander(i, t) * 3, cy + SCATTER_H2[i][1] + wander(i + 50, t) * 3, 17, { rot: SCATTER_H2[i][2] + t * 0.2, labels: false });
          }, { p: seg(p, 0.05, 0.28) });
          Art.zoom(g, 640, benchY - 56, 640, 150, 138, (gg, cx, cy) => {
            mol(gg, 'O2', cx + wander(2, t) * 6, cy + wander(5, t) * 6, 48, { rot: 0.4 + Math.sin(t * 0.4) * 0.3, face: 'wow', t, labels: false, look: [-1, 0] });
          }, { p: seg(p, 0.12, 0.34) });
          const a = seg(p, 0.7, 0.86);
          qty(g, 'about 32', 'H2', W / 2, 92, { size: 40, color: C.sun, alpha: a });
          Art.text(g, 'for every', W / 2, 138, { size: 26, alpha: a, color: C.dim });
          qty(g, '1', 'O2', W / 2, 184, { size: 44, color: C.sun, alpha: a });
          Art.text(g, 'not 2 to 1', W / 2, 258, { font: 'display', size: 38, color: C.red, alpha: seg(p, 0.8, 0.94) });
        },
      },
      {
        say: 'Why? Because molecules have different weights. One O₂ weighs about the same as <b>16 H₂</b>. Equal grams are not equal counts.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          const q = seg(p, 0.1, 0.9);
          beam(g, W / 2, H - 66, 245, {
            drawL(gg, x, y) {
              const a = ease.back(seg(p, 0.08, 0.3));
              if (a > 0) mol(gg, 'O2', x, y - 40, 54 * a, { atomScale: 1.12, face: 'happy', t, rot: 0.08, labels: false, look: [1, 0] });
            },
            drawR(gg, x, y) {
              const n = Math.ceil(16 * q);
              const rows = [6, 5, 3, 2]; let k = 0;
              rows.forEach((c, r) => { for (let i = 0; i < c; i++) { if (k++ >= n) return; mol(gg, 'H2', x + (i - (c - 1) / 2) * 38, y - 16 - r * 25, 15, { rot: rand(k) * 3, labels: false }); } });
            },
          });
          qty(g, '1', 'O2', 155, 62, { size: 50, color: C.sun, alpha: seg(p, 0.1, 0.3) });
          qty(g, 'about 16', 'H2', 645, 62, { size: 50, color: C.sun, alpha: seg(p, 0.5, 0.8) });
          Art.text(g, 'Level!', W / 2, 62, { font: 'display', size: 44, color: C.leaf, alpha: seg(p, 0.8, 0.95) });
        },
      },
      {
        say: 'So count first, then weigh. 2 moles of H₂ is <b>4.03 g</b>. 1 mole of O₂ is <b>32.00 g</b>. The recipe by mass is about 1 to 8, nothing like 2 to 1.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          const benchY = H - 70;
          const a = ease.back(seg(p, 0.05, 0.28)), b = ease.back(seg(p, 0.22, 0.45));
          if (a > 0) { sack(g, 170, benchY - 76, 0.82 * a, '1 mol', { size: 22, alpha: clamp(a) }); sack(g, 272, benchY - 76, 0.82 * a, '1 mol', { size: 22, alpha: clamp(a) }); Art.digitalScale(g, 220, benchY + 2, 280, '4.03 g', { size: 22 }); }
          if (b > 0) { sack(g, 570, benchY - 90, 1.08 * b, '1 mol', { size: 28, alpha: clamp(b) }); Art.digitalScale(g, 570, benchY + 2, 280, '32.00 g', { size: 22 }); }
          qty(g, '2 mol', 'H2', 220, 54, { size: 38, color: C.sun, alpha: seg(p, 0.1, 0.25) });
          qty(g, '1 mol', 'O2', 570, 54, { size: 38, color: C.sun, alpha: seg(p, 0.28, 0.42) });
          const r1 = seg(p, 0.52, 0.68), r2 = seg(p, 0.72, 0.88);
          Art.pill(g, 'Moles 2 : 1', 400, 118, { size: 34, font: 'display', color: '#1E7A4A', alpha: r1 });
          Art.pill(g, 'Grams 1 : 8', 400, 182, { size: 34, font: 'display', color: '#B81F71', alpha: r2 });
          void W; void t;
        },
      },
      {
        say: 'Only the <b>total</b> mass stays the same. 4.03 g + 32.00 g makes 36.03 g of water. The grams of each substance change. The grand total does not.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          const a = seg(p, 0.06, 0.3), b = seg(p, 0.34, 0.6);
          beam(g, W / 2, H - 66, 245, {
            drawL(gg, x, y) { if (a > 0) { gasBag(gg, x - 62, y + 2, 66, 40, '#E3E6F2', { alpha: a }); gasBag(gg, x + 40, y + 2, 112, 72, '#FF7682', { alpha: a }); } },
            drawR(gg, x, y) { if (b > 0) gasBag(gg, x, y + 2, 140, 80, '#6FC6F2', { alpha: b }); },
          });
          qty(g, '4.03 g', 'H2', 155, 34, { size: 30, color: C.ink, alpha: a });
          qty(g, '+ 32.00 g', 'O2', 155, 72, { size: 30, color: C.ink, alpha: a });
          qty(g, '36.03 g', 'H2O', 645, 54, { size: 30, color: C.ink, alpha: b });
          const c = seg(p, 0.66, 0.84);
          Art.text(g, '36.03 g', 155, 122, { font: 'display', size: 44, color: C.sun, alpha: c });
          Art.text(g, '36.03 g', 645, 122, { font: 'display', size: 44, color: C.sun, alpha: c });
          Art.text(g, '=', W / 2, 90, { font: 'display', size: 70, color: C.leaf, alpha: c });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: mole bars and mass bars ---------- */
  const BARS = [
    { id: 'h2o', btn: '2H₂ + O₂', eq: '2H2 + O2 -> 2H2O' },
    { id: 'nh3', btn: 'N₂ + 3H₂', eq: 'N2 + 3H2 -> 2NH3' },
    { id: 'ch4', btn: 'CH₄ + 2O₂', eq: 'CH4 + 2O2 -> CO2 + 2H2O' },
    { id: 'c3h8', btn: 'C₃H₈ + 5O₂', eq: 'C3H8 + 5O2 -> 3CO2 + 4H2O' },
    { id: 'caco3', btn: 'CaCO₃ splits', eq: 'CaCO3 -> CaO + CO2' },
    { id: 'kclo3', btn: '2KClO₃ splits', eq: '2KClO3 -> 2KCl + 3O2' },
  ];
  BARS.forEach((b) => { b.rx = parseEq(b.eq); });
  Lab.$('#bars-rx').innerHTML = BARS.map((r, i) => `<button type="button" data-value="${r.id}" aria-pressed="${i === 0}">${r.btn}</button>`).join('');
  const barsState = { cur: BARS[0], k: 1 };
  const BAR_COLORS = [C.cyan, C.pink, C.sun, C.leaf, C.violet];
  function barRow(g, items, x, y, w, h, full, fmt) {
    // Values go inside the segments when they fit. If not, they go in one line beside or above the bar.
    let cx = x;
    const sizes = items.map((it) => (it.v / full) * w);
    const prev = g.globalAlpha;
    g.globalAlpha = 0; const widths = items.map((it) => qty(g, fmt(it.v), it.f, 0, 0, { size: 24 })); g.globalAlpha = prev;
    const allFit = widths.every((lw, i) => lw + 14 <= sizes[i]);
    items.forEach((it, i) => {
      const sw = sizes[i];
      const gr = g.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, Art.mix(it.color, '#ffffff', 0.22)); gr.addColorStop(1, Art.mix(it.color, '#160A2C', 0.18));
      g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      Art.round(g, cx, y, Math.max(sw, 6), h, 9); g.fill(); g.stroke();
      if (allFit) qty(g, fmt(it.v), it.f, cx + sw / 2, y + h / 2 + 1, { size: 24, color: '#1A0F2E' });
      cx += sw;
    });
    if (!allFit) {
      const lineW = widths.reduce((a, b) => a + b, 0) + (items.length - 1) * 30;
      const beside = cx + 12 + lineW <= x + w;
      let lx = beside ? cx + 12 : x + 2;
      const ly = beside ? y + h / 2 + 1 : y - 15;
      items.forEach((it, i) => {
        if (i) { Art.text(g, '+', lx + 15, ly, { size: 24, color: C.dim }); lx += 30; }
        qty(g, fmt(it.v), it.f, lx, ly, { size: 24, align: 'left', color: it.color });
        lx += widths[i];
      });
    }
    return cx;
  }
  const BAR_MAX_K = 3;
  Lab.stage('#c-bars', {
    h: 470, label: 'Bars for moles and for grams before and after the reaction. Total grams match and total moles need not.',
    draw(g, t, dt) {
      barsState.shown = lerp(barsState.shown === undefined ? barsState.k : barsState.shown, barsState.k, Lab.reducedMotion ? 1 : clamp(dt * 9));
      const { rx } = barsState.cur, k = barsState.shown;
      equation(g, rx, 400, 34, { size: 38 });
      const color = {}; [...rx.r, ...rx.p].forEach((a, i) => { color[a.f] = BAR_COLORS[i % BAR_COLORS.length]; });
      const mk = (list, f) => list.map((a) => ({ f: a.f, color: color[a.f], v: f(a) }));
      const molB = mk(rx.r, (a) => a.n * k), molA = mk(rx.p, (a) => a.n * k);
      const gB = mk(rx.r, (a) => a.n * k * Bank.molarMass(a.f)), gA = mk(rx.p, (a) => a.n * k * Bank.molarMass(a.f));
      const sum = (l) => l.reduce((a, b) => a + b.v, 0);
      // Both rows share one scale so that bars really grow with the slider.
      const fullMol = Math.max(rx.r.reduce((a, b) => a + b.n, 0), rx.p.reduce((a, b) => a + b.n, 0)) * BAR_MAX_K;
      const fullG = rx.r.reduce((a, b) => a + b.n * Bank.molarMass(b.f), 0) * BAR_MAX_K;
      const X = 122, WW = 656, h = 38;
      const fmtM = (v) => `${Lab.fmt(v, 2)} mol`, fmtG = (v) => `${Lab.fmt(v, 2)} g`;
      Art.text(g, 'Moles', 24, 92, { font: 'display', size: 32, color: C.cyan, align: 'left' });
      const sameM = Math.abs(sum(molB) - sum(molA)) < 1e-9;
      Art.text(g, `${Lab.fmt(sum(molB), 2)} mol before, ${Lab.fmt(sum(molA), 2)} mol after`, 776, 92, { size: 24, align: 'right', color: sameM ? C.leaf : C.dim });
      Art.text(g, 'Before', 112, 139, { size: 24, align: 'right', color: C.dim });
      barRow(g, molB, X, 120, WW, h, fullMol, fmtM);
      Art.text(g, 'After', 112, 197, { size: 24, align: 'right', color: C.dim });
      barRow(g, molA, X, 178, WW, h, fullMol, fmtM);
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(24, 234, 752, 3);
      Art.text(g, 'Grams', 24, 268, { font: 'display', size: 32, color: C.sun, align: 'left' });
      Art.text(g, `${Lab.fmt(sum(gB), 2)} g before, ${Lab.fmt(sum(gA), 2)} g after`, 776, 268, { size: 24, align: 'right', color: C.leaf });
      const yB = 314, yA = yB + 58;
      Art.text(g, 'Before', 112, yB + 19, { size: 24, align: 'right', color: C.dim });
      const end = barRow(g, gB, X, yB, WW, h, fullG, fmtG);
      Art.text(g, 'After', 112, yA + 19, { size: 24, align: 'right', color: C.dim });
      barRow(g, gA, X, yA, WW, h, fullG, fmtG);
      // A line joining the two gram bars at their shared end.
      g.save(); g.strokeStyle = C.leaf; g.lineWidth = 4; g.setLineDash([9, 7]);
      g.beginPath(); g.moveTo(end, yB - 6); g.lineTo(end, yA + h + 6); g.stroke(); g.restore();
      Art.text(g, 'Same total', Math.max(X + 70, Math.min(end, 776)), yA + h + 25, { size: 24, align: end > 400 ? 'right' : 'center', color: C.leaf });
      void t;
    },
  });
  function paintBars() {
    const { rx } = barsState.cur, k = barsState.k;
    const nb = rx.r.reduce((a, b) => a + b.n * k, 0), na = rx.p.reduce((a, b) => a + b.n * k, 0);
    const mg = rx.r.reduce((a, b) => a + b.n * k * Bank.molarMass(b.f), 0);
    const rel = Math.abs(nb - na) < 1e-9 ? 'stayed the same here, which is just luck' : na < nb ? 'went down' : 'went up';
    Lab.$('#bars-foot').innerHTML = `<p>Total moles of molecules ${rel}: ${Lab.fmt(nb, 2)} to ${Lab.fmt(na, 2)} mol. <b>Total mass did not change: ${Lab.fmt(mg, 2)} g on both sides.</b> The atoms are all still there, in new groups.</p>`;
    Lab.$('#bars-n-out').textContent = `${Lab.fmt(k, 2)} × the recipe`;
  }
  Lab.segmented('#bars-rx', (v) => { barsState.cur = BARS.find((b) => b.id === v); paintBars(); });
  Lab.bind('#bars-n', null, null, (v) => { barsState.k = v; paintBars(); });

  /* ---------- The map ---------- */
  const CAVE_Y = 345, LX = 210, RX = 590;
  const STATIONS = {
    gA: { x: 112, y: 150 }, gB: { x: 688, y: 150 },
    molA: { x: LX, y: 394 }, molB: { x: RX, y: 394 },
    nA: { x: 62, y: 394 }, nB: { x: 680, y: 394 },
  };
  function mapBase(g, W, H, t, o = {}) {
    // Dusk sky above, Moe's soil below.
    const sky = g.createLinearGradient(0, 0, 0, 150);
    sky.addColorStop(0, '#231A52'); sky.addColorStop(1, '#3E3F8E');
    g.fillStyle = sky; g.fillRect(0, 0, W, 152);
    const d = g.createLinearGradient(0, 150, 0, H);
    d.addColorStop(0, '#4A2C3F'); d.addColorStop(1, '#27142F');
    g.fillStyle = d; g.fillRect(0, 150, W, H - 150);
    for (let i = 0; i < 30; i++) {
      const x = rand(i + 11) * W, y = 170 + rand(i + 23) * (H - 170), r = 3 + rand(i + 37) * 8;
      g.fillStyle = `rgba(255,220,190,${0.03 + rand(i + 2) * 0.05})`;
      g.beginPath(); g.ellipse(x, y, r * 1.3, r, rand(i) * 3, 0, 6.283); g.fill();
    }
    // The U-shaped cave.
    const path = () => {
      g.beginPath();
      if (o.rooms) { g.moveTo(10, CAVE_Y); g.lineTo(LX, CAVE_Y); } else g.moveTo(LX, 150);
      if (o.rooms) { g.moveTo(LX, 150); g.lineTo(LX, CAVE_Y); g.lineTo(RX, CAVE_Y); g.lineTo(RX, 150); g.moveTo(RX, CAVE_Y); g.lineTo(790, CAVE_Y); }
      else { g.lineTo(LX, CAVE_Y); g.lineTo(RX, CAVE_Y); g.lineTo(RX, 150); }
    };
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = '#6B4432'; g.lineWidth = 124; path(); g.stroke();
    g.strokeStyle = '#1B0F2A'; g.lineWidth = 110; path(); g.stroke();
    // Grass over everything, with holes where the shafts come up.
    const grassY = 150;
    g.fillStyle = '#2FA35E'; g.fillRect(0, grassY - 4, W, 16);
    g.fillStyle = '#4CD07F'; g.fillRect(0, grassY - 4, W, 5);
    g.fillStyle = '#1B0F2A';
    g.beginPath(); g.ellipse(LX, grassY + 6, 56, 11, 0, 0, 6.283); g.fill();
    g.beginPath(); g.ellipse(RX, grassY + 6, 56, 11, 0, 0, 6.283); g.fill();
    // The rock wall nobody can cross.
    const boulders = [[372, 132, 34], [428, 134, 36], [400, 96, 32], [354, 100, 18], [448, 98, 20]];
    boulders.forEach(([x, y, r]) => {
      const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.4, 2, x, y, r * 1.05);
      gr.addColorStop(0, '#A49DB5'); gr.addColorStop(1, '#4F4860');
      g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); g.stroke();
    });
    void t;
  }
  /** Moe's walking point along the route between two stations. */
  function routePoint(a, b, q) {
    const A = STATIONS[a], B = STATIONS[b];
    const vert = (a[0] === 'g') !== (b[0] === 'g');
    if (!vert) return { x: lerp(A.x, B.x, q), y: A.y };
    const shaftX = a[0] === 'g' ? B.x : A.x;
    const total = Math.abs(shaftX - (a[0] === 'g' ? A.x : B.x)) + Math.abs(A.y - B.y);
    const d1 = Math.abs(shaftX - A.x) / total, d2 = Math.abs(A.y - B.y) / total, d3 = Math.abs(shaftX - B.x) / total;
    if (q < d1) return { x: lerp(A.x, shaftX, q / d1), y: A.y };
    if (q < d1 + d2) return { x: shaftX, y: lerp(A.y, B.y, (q - d1) / d2) };
    return { x: lerp(shaftX, B.x, (q - d1 - d2) / Math.max(1e-6, d3)), y: B.y };
  }
  function walkMoe(g, a, b, q, t, mood, h = 88) {
    const u = ease.inOut(clamp(q));
    const P = routePoint(a, b, u);
    const moving = q > 0 && q < 1;
    const hop = moving ? Math.abs(Math.sin(t * 9)) * 5 : 0;
    const flip = STATIONS[b].x < STATIONS[a].x;
    Art.moe(g, P.x, P.y - hop, h, moving ? 'happy' : mood, { t, flip, bob: !moving });
  }
  function surfaceScale(g, x, label, color, heap, o = {}) {
    Art.digitalScale(g, x, 150, 120, label, { size: 19 });
    if (heap) gasBag(g, x, 112, 76 * heap, 40 * heap, color);
    void o;
  }
  /** Label beside a shaft: lit when it is the leg in play. */
  function legLabel(g, lines, x, y, align, lit, color) {
    const a = lit === undefined ? 1 : lit;
    lines.forEach((l, i) => Art.text(g, l, x, y + i * 28, { size: 24, align, color: a > 0.5 ? color : C.dim, alpha: Math.max(0.5, a) }));
  }

  const MAP_NH3 = parseEq('N2 + 3H2 -> 2NH3');
  const mapChips = (g, st) => {
    if (st.gA) chip(g, st.gA[0], st.gA[1], 106, 30, { alpha: st.gA[2], bg: '#6B4F0C', stroke: C.sun });
    if (st.gB) chip(g, st.gB[0], st.gB[1], 694, 30, { alpha: st.gB[2], bg: st.gB[3] ? '#1E7A4A' : '#6B4F0C', stroke: st.gB[3] ? C.leaf : C.sun });
    if (st.molA) chip(g, st.molA[0], st.molA[1], LX, 426, { alpha: st.molA[2], bg: '#8C1F5E', stroke: C.pink });
    if (st.molB) chip(g, st.molB[0], st.molB[1], st.molBX || RX, 426, { alpha: st.molB[2], bg: '#8C1F5E', stroke: C.pink });
  };
  const NH3_LEGS = (g, lit) => {
    legLabel(g, ['÷ 28.01', 'g/mol'], 148, 215, 'right', lit[0], C.sun);
    legLabel(g, ['× 17.03', 'g/mol'], 652, 215, 'left', lit[2], C.sun);
    const a = Math.max(0.5, lit[1]);
    frac(g, ['2 mol', 'NH3'], ['1 mol', 'N2'], 400, 228, { size: 30, color: lit[1] > 0.5 ? C.pink : C.dim, alpha: a });
  };

  /** Strike only the unit part of "num unit formula", never the number. */
  function strikeUnit(g, num, unit, f, cx, y, size, q, color) {
    if (q <= 0) return;
    const prev = g.globalAlpha;
    g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
    const nw = g.measureText(num + ' ').width, uw = g.measureText(unit + ' ').width;
    g.globalAlpha = 0; const fw = Art.formula(g, f, 0, 0, { size }); g.globalAlpha = prev;
    const x0 = cx - (nw + uw + fw) / 2 + nw, x1 = x0 + uw + fw;
    Art.strike(g, x0 - 2, y + size * 0.52, x1 + 2, y - size * 0.44, q, color, 4.5);
  }
  /** The whole chain with each pair of units struck out in turn. */
  function chainBoard(g, p, W) {
    const size = 24, y = 208, gap = size * 0.72;
    g.fillStyle = '#2E5B4E'; g.strokeStyle = '#8A6A45'; g.lineWidth = 10;
    Art.round(g, 14, 96, W - 28, 226, 18); g.fill(); g.stroke();
    const X = { start: 80, f1: 224, f2: 382, f3: 540 };
    const ink = '#F4F8F0';
    qty(g, '14.0 g', 'N2', X.start, y, { size, color: ink });
    Art.text(g, '×', 146, y, { size: 28, color: ink });
    frac(g, ['1 mol', 'N2'], ['28.01 g', 'N2'], X.f1, y, { size, color: ink });
    Art.text(g, '×', 303, y, { size: 28, color: ink });
    frac(g, ['2 mol', 'NH3'], ['1 mol', 'N2'], X.f2, y, { size, color: ink });
    Art.text(g, '×', 461, y, { size: 28, color: ink });
    frac(g, ['17.03 g', 'NH3'], ['1 mol', 'NH3'], X.f3, y, { size, color: ink });
    qty(g, '= 17.0 g', 'NH3', 618, y, { size: 27, color: C.sun, align: 'left', alpha: seg(p, 0.82, 0.92) });
    const a = seg(p, 0.16, 0.34), b = seg(p, 0.4, 0.58), c = seg(p, 0.64, 0.82);
    strikeUnit(g, '14.0', 'g', 'N2', X.start, y, size, a, C.sun);
    strikeUnit(g, '28.01', 'g', 'N2', X.f1, y + gap, size, a, C.sun);
    strikeUnit(g, '1', 'mol', 'N2', X.f1, y - gap, size, b, C.pink);
    strikeUnit(g, '1', 'mol', 'N2', X.f2, y + gap, size, b, C.pink);
    strikeUnit(g, '2', 'mol', 'NH3', X.f2, y - gap, size, c, C.cyan);
    strikeUnit(g, '1', 'mol', 'NH3', X.f3, y + gap, size, c, C.cyan);
    Art.text(g, 'Down', X.f1, 134, { font: 'display', size: 30, color: C.sun, alpha: seg(p, 0.06, 0.2) });
    Art.text(g, 'Across', X.f2, 134, { font: 'display', size: 30, color: C.pink, alpha: seg(p, 0.3, 0.44) });
    Art.text(g, 'Up', X.f3, 134, { font: 'display', size: 30, color: C.cyan, alpha: seg(p, 0.54, 0.68) });
    Art.text(g, 'Everything cancels except the unit you wanted.', W / 2, 376, { size: 28, alpha: seg(p, 0.86, 0.98) });
  }

  Lab.story('#story-map', {
    title: 'The only way across is through the mole hole',
    scenes: [
      {
        say: 'Meet the map. Up top is the surface, where you <b>weigh</b> things in grams. Underground is the mole tunnel, where you <b>count</b> things in moles.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          mapBase(g, W, H, t);
          equation(g, MAP_NH3, W / 2, 34, { size: 38 });
          surfaceScale(g, 210, 'g', '#7EA6FF', 1);
          surfaceScale(g, 590, 'g', '#C7D3FF', 1);
          Art.text(g, 'Surface:', 710, 76, { font: 'display', size: 28, color: C.sun, alpha: seg(p, 0.15, 0.35) });
          Art.text(g, 'grams', 710, 110, { font: 'display', size: 28, color: C.sun, alpha: seg(p, 0.15, 0.35) });
          Art.text(g, 'Mole tunnel: moles', 400, 347, { font: 'display', size: 34, color: C.pink, alpha: seg(p, 0.45, 0.65) });
          Art.moe(g, 112, 150, 88, 'wave', { t });
        },
      },
      {
        say: 'Here is a real job: how many grams of NH₃ can you make from <b>14.0 g of N₂</b>? You know grams and you want grams. But look at that wall. There is no path straight across.',
        dur: 3.8,
        draw(g, p, t, { W, H }) {
          mapBase(g, W, H, t);
          equation(g, MAP_NH3, W / 2, 34, { size: 38 });
          surfaceScale(g, 210, '14.0 g', '#7EA6FF', 1);
          surfaceScale(g, 590, '? g', '#C7D3FF', 1);
          mapChips(g, { gA: ['14.0 g', 'N2', seg(p, 0.05, 0.2)], gB: ['? g', 'NH3', seg(p, 0.15, 0.3)] });
          const u = ease.inOut(seg(p, 0.25, 0.6));
          Art.moe(g, lerp(112, 318, u) - (u >= 1 ? Math.sin(seg(p, 0.6, 0.72) * PI) * 16 : 0), 150, 88, u >= 1 ? 'oops' : 'happy', { t });
          const a = seg(p, 0.6, 0.7);
          Art.strike(g, 366, 74, 434, 142, a, C.red, 9);
          Art.strike(g, 434, 74, 366, 142, a, C.red, 9);
          Art.text(g, 'No shortcut', 400, 192, { font: 'display', size: 32, color: C.red, alpha: seg(p, 0.66, 0.8), halo: true });
          Art.text(g, 'Equations do not speak grams', 400, 240, { size: 26, alpha: seg(p, 0.76, 0.9), color: C.ink, halo: true });
        },
      },
      {
        say: 'So go <b>down</b>. Divide by the molar mass of N₂ to change grams into moles: 14.0 g ÷ 28.01 g/mol = <b>0.500 mol</b>.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          mapBase(g, W, H, t);
          equation(g, MAP_NH3, W / 2, 34, { size: 38 });
          surfaceScale(g, 210, '14.0 g', '#7EA6FF', 1);
          surfaceScale(g, 590, '? g', '#C7D3FF', 1);
          mapChips(g, { gA: ['14.0 g', 'N2', 1], gB: ['? g', 'NH3', 1], molA: ['0.500 mol', 'N2', seg(p, 0.78, 0.92)] });
          NH3_LEGS(g, [seg(p, 0.1, 0.3), 0, 0]);
          Art.arrow(g, 160, 170, 160, 300, { color: C.sun, w: 6, p: seg(p, 0.2, 0.5) });
          walkMoe(g, 'gA', 'molA', seg(p, 0.14, 0.8), t, 'happy');
        },
      },
      {
        say: 'Now you are in the tunnel, and the recipe works here. It says <b>2 NH₃ for every 1 N₂</b>, so multiply: 0.500 mol × 2/1 = <b>1.00 mol NH₃</b>.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          mapBase(g, W, H, t);
          const pos = equation(g, MAP_NH3, W / 2, 34, { size: 38, showOnes: true, coefGap: 9 });
          const r = seg(p, 0.05, 0.25);
          if (r > 0) { Art.ring(g, pos.p[0].coefX, 34, 20, { color: C.pink, w: 4, p: r }); Art.ring(g, pos.r[0].coefX, 34, 20, { color: C.pink, w: 4, p: r }); }
          surfaceScale(g, 210, '14.0 g', '#7EA6FF', 1);
          surfaceScale(g, 590, '? g', '#C7D3FF', 1);
          mapChips(g, { gA: ['14.0 g', 'N2', 1], gB: ['? g', 'NH3', 1], molA: ['0.500 mol', 'N2', 1], molB: ['1.00 mol', 'NH3', seg(p, 0.8, 0.94)] });
          NH3_LEGS(g, [0, seg(p, 0.05, 0.25), 0]);
          Art.arrow(g, 300, 300, 500, 300, { color: C.pink, w: 6, p: seg(p, 0.2, 0.7) });
          walkMoe(g, 'molA', 'molB', seg(p, 0.14, 0.8), t, 'happy');
        },
      },
      {
        say: 'Climb back <b>up</b>. Multiply by the molar mass of NH₃: 1.00 mol × 17.03 g/mol = <b>17.0 g</b>. You made it across.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          mapBase(g, W, H, t);
          equation(g, MAP_NH3, W / 2, 34, { size: 38 });
          surfaceScale(g, 210, '14.0 g', '#7EA6FF', 1);
          surfaceScale(g, 590, seg(p, 0.84, 0.9) > 0 ? '17.0 g' : '? g', '#C7D3FF', 1);
          mapChips(g, { gA: ['14.0 g', 'N2', 1], gB: seg(p, 0.84, 0.9) > 0 ? ['17.0 g', 'NH3', 1, true] : ['? g', 'NH3', 1], molA: ['0.500 mol', 'N2', 1], molB: ['1.00 mol', 'NH3', 1] });
          NH3_LEGS(g, [0, 0, seg(p, 0.05, 0.25)]);
          Art.arrow(g, 640, 300, 640, 170, { color: C.sun, w: 6, p: seg(p, 0.2, 0.5) });
          walkMoe(g, 'molB', 'gB', seg(p, 0.14, 0.84), t, 'cheer');
          Art.burst(g, 590, 110, seg(p, 0.84, 1), { n: 18, r: 110 });
        },
      },
      {
        say: 'Down, across, up. Written as one line, each unit cancels the one before it, so <b>the units themselves check your work</b>.',
        dur: 5,
        draw(g, p, t, { W }) {
          Art.text(g, 'The whole trip', W / 2, 52, { font: 'display', size: 42, color: C.ink });
          chainBoard(g, p, W);
          void t;
        },
      },
      {
        say: 'Need to count particles? Side rooms sit at each end of the tunnel. From moles, multiply by <b>6.022 × 10²³</b> to get molecules. So 1.00 mol NH₃ is 6.02 × 10²³ molecules.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          mapBase(g, W, H, t, { rooms: true });
          equation(g, MAP_NH3, W / 2, 34, { size: 38 });
          surfaceScale(g, 210, '14.0 g', '#7EA6FF', 1);
          surfaceScale(g, 590, '17.0 g', '#C7D3FF', 1);
          mapChips(g, { molA: ['0.500 mol', 'N2', 1], molB: ['1.00 mol', 'NH3', 1], molBX: 520 });
          const a = seg(p, 0.1, 0.3);
          Art.text(g, 'Particles', 80, 262, { font: 'display', size: 28, color: C.cyan, alpha: Math.max(a, 0.6) });
          Art.text(g, 'Particles', 722, 262, { font: 'display', size: 28, color: C.cyan });
          for (let i = 0; i < 6; i++) {
            mol(g, 'NH3', 724 + (i % 2) * 34 + wander(i, t) * 2, 312 + Math.floor(i / 2) * 30 + wander(i + 9, t) * 2, 10, { rot: i, labels: false, alpha: seg(p, 0.5, 0.7) });
            mol(g, 'N2', 40 + (i % 3) * 40 + wander(i + 3, t) * 2, 322 + Math.floor(i / 3) * 40, 14, { rot: i, labels: false });
          }
          Art.text(g, '× 6.022 × 10²³', 722, 224, { font: 'display', size: 23, color: C.cyan, alpha: seg(p, 0.35, 0.55) });
          chip(g, '6.02 × 10²³', '', 708, 426, { alpha: seg(p, 0.7, 0.86), bg: '#0E5E6E', stroke: C.cyan, size: 24 });
          const u = seg(p, 0.1, 0.65);
          walkMoe(g, 'molB', 'nB', u, t, 'point', 84);
        },
      },
    ],
  });

  /* ---------- Bench: map walker ---------- */
  const TRIPS = [
    '2H2 + O2 -> 2H2O', 'N2 + 3H2 -> 2NH3', 'CH4 + 2O2 -> CO2 + 2H2O', 'C3H8 + 5O2 -> 3CO2 + 4H2O', '2Mg + O2 -> 2MgO', '4Al + 3O2 -> 2Al2O3',
    '2KClO3 -> 2KCl + 3O2', 'CaCO3 -> CaO + CO2', 'Fe2O3 + 3CO -> 2Fe + 3CO2', '2Na + Cl2 -> 2NaCl', 'Zn + 2HCl -> ZnCl2 + H2', '2H2O2 -> 2H2O + O2',
    '2C2H6 + 7O2 -> 4CO2 + 6H2O', '2Al + 6HCl -> 2AlCl3 + 3H2', '4NH3 + 5O2 -> 4NO + 6H2O',
  ].map(parseEq);
  const ceF = (f) => `\\ce{${f}}`;
  const walk = { mode: 'gg', rx: null, A: null, B: null, val: 0, route: [], leg: 0, cur: 0, walkT0: -9, mood: 'happy', chain: '', msg: '', done: false, wrongs: 0, seed: 1, t: 0, stage: null, values: {}, rewarded: false };
  const texN = (x, sf = 3) => {
    const s = Lab.sig(x, sf);
    return s.replace(/\s*×\s*10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (m, e) => ' \\times 10^{' + e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '-0123456789'['⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)]) + '}');
  };
  const NA_TEX = '6.022 \\times 10^{23}';
  function newWalk() {
    const r = Bank.rng();
    walk.rx = r.pick(TRIPS);
    const all = [...walk.rx.r, ...walk.rx.p];
    const a = r.pick(walk.rx.r);
    let b = r.pick(all.filter((x) => x.f !== a.f));
    if (walk.mode === 'gn' || walk.mode === 'ng') {
      const NON_MOLECULAR = /^(NaCl|MgO|Al2O3|KCl|KClO3|CaO|CaCO3|Fe2O3|ZnCl2|AlCl3|Mg|Al|Fe|Na|Zn)$/;
      const covalent = all.filter((x) => x.f !== a.f && !NON_MOLECULAR.test(x.f));
      if (!covalent.length || NON_MOLECULAR.test(a.f)) return newWalk();
      b = r.pick(covalent);
    }
    walk.A = a; walk.B = b;
    const MA = Bank.molarMass(a.f);
    const route = { gg: ['gA', 'molA', 'molB', 'gB'], mg: ['molA', 'molB', 'gB'], gm: ['gA', 'molA', 'molB'], gn: ['gA', 'molA', 'molB', 'nB'], ng: ['nA', 'molA', 'molB', 'gB'] }[walk.mode];
    walk.route = route;
    const start = route[0];
    if (start === 'gA') walk.val = +(MA * (0.2 + r.next() * 2.3)).toPrecision(3);
    else if (start === 'molA') walk.val = +(0.1 + r.next() * 2.4).toPrecision(2);
    else walk.val = +((1 + r.next() * 8) * 1e23).toPrecision(2);
    walk.values = { [start]: walk.val };
    walk.leg = 0; walk.done = false; walk.mood = 'think'; walk.msg = ''; walk.walkT0 = -9; walk.wrongs = 0; walk.rewarded = false;
    walk.chainParts = [startTex()];
    paintWalk();
  }
  const unitOf = (st) => ({ gA: `\\text{g }${ceF(walk.A.f)}`, gB: `\\text{g }${ceF(walk.B.f)}`, molA: `\\text{mol }${ceF(walk.A.f)}`, molB: `\\text{mol }${ceF(walk.B.f)}`, nA: `\\text{molecules }${ceF(walk.A.f)}`, nB: `\\text{molecules }${ceF(walk.B.f)}` }[st]);
  const numText = (st, v) => (st[0] === 'n' ? texN(v, 3) : texN(v, 3));
  function startTex() { const st = walk.route[0]; return `${numText(st, walk.val)}\\ \\cancel{${unitOf(st)}}`; }
  function legFactors(a, b) {
    const { A, B } = walk, MA = Bank.molarMass(A.f), MB = Bank.molarMass(B.f);
    const fr = (t, bt) => `\\dfrac{${t}}{${bt}}`;
    const ga = `\\text{g }${ceF(A.f)}`, gb = `\\text{g }${ceF(B.f)}`, ma = `\\text{mol }${ceF(A.f)}`, mb = `\\text{mol }${ceF(B.f)}`;
    const pa = `\\text{molecules }${ceF(A.f)}`, pb = `\\text{molecules }${ceF(B.f)}`;
    const ks = `${a}>${b}`;
    if (ks === 'gA>molA') return {
      name: 'Go down: grams to moles',
      right: { tex: fr(`1\\ ${ma}`, `${MA.toFixed(2)}\\ ${ga}`), texC: fr(`1\\ ${ma}`, `${MA.toFixed(2)}\\ \\cancel{${ga}}`), f: (v) => v / MA },
      wrong: [
        { tex: fr(`${MA.toFixed(2)}\\ ${ga}`, `1\\ ${ma}`), why: 'That is upside down. Grams would pile up instead of canceling, and you would be left with g squared per mol.' },
        { tex: fr(`1\\ ${mb}`, `${MB.toFixed(2)}\\ ${gb}`), why: `That is the molar mass of ${B.f}. You are still holding ${A.f}, so use its molar mass.` },
      ],
    };
    if (ks === 'nA>molA') return {
      name: 'Go into the tunnel: molecules to moles',
      right: { tex: fr(`1\\ ${ma}`, `${NA_TEX}\\ ${pa}`), texC: fr(`1\\ ${ma}`, `${NA_TEX}\\ \\cancel{${pa}}`), f: (v) => v / 6.022e23 },
      wrong: [
        { tex: fr(`${NA_TEX}\\ ${pa}`, `1\\ ${ma}`), why: 'That is upside down. Molecules would not cancel, and the number gets absurdly huge.' },
        { tex: fr(`1\\ ${ma}`, `${MA.toFixed(2)}\\ ${ga}`), why: 'That factor needs grams to cancel, and you have molecules. Avogadro\'s number is the bridge here.' },
      ],
    };
    if (ks === 'molA>molB') return {
      name: 'Go across: the mole ratio',
      right: { tex: fr(`${B.n}\\ ${mb}`, `${A.n}\\ ${ma}`), texC: fr(`${B.n}\\ \\cancel{${mb}}`, `${A.n}\\ \\cancel{${ma}}`), texK: walk.route[walk.route.indexOf('molB') + 1] ? true : false, f: (v) => (v * B.n) / A.n },
      wrong: [
        { tex: fr(`${A.n}\\ ${ma}`, `${B.n}\\ ${mb}`), why: `Flipped. You want ${B.f} on top, so ${A.f} cancels on the bottom.`, same: B.n === A.n },
        { tex: fr(`${MB.toFixed(2)}\\ ${gb}`, `${MA.toFixed(2)}\\ ${ga}`), why: 'That is a ratio of molar masses, and it uses no coefficients. Only coefficients can carry you across, and they speak moles.' },
      ],
    };
    if (ks === 'molB>gB') return {
      name: 'Go up: moles to grams',
      right: { tex: fr(`${MB.toFixed(2)}\\ ${gb}`, `1\\ ${mb}`), texC: fr(`${MB.toFixed(2)}\\ ${gb}`, `1\\ \\cancel{${mb}}`), f: (v) => v * MB },
      wrong: [
        { tex: fr(`1\\ ${mb}`, `${MB.toFixed(2)}\\ ${gb}`), why: 'Upside down. Moles would pile up instead of canceling. Molar mass goes on top when you climb out.' },
        { tex: fr(`${MA.toFixed(2)}\\ ${ga}`, `1\\ ${ma}`), why: `That is the molar mass of ${A.f}, the thing you started with. You now hold ${B.f}.` },
      ],
    };
    if (ks === 'molB>nB') return {
      name: 'Go to the side room: moles to molecules',
      right: { tex: fr(`${NA_TEX}\\ ${pb}`, `1\\ ${mb}`), texC: fr(`${NA_TEX}\\ ${pb}`, `1\\ \\cancel{${mb}}`), f: (v) => v * 6.022e23 },
      wrong: [
        { tex: fr(`1\\ ${mb}`, `${NA_TEX}\\ ${pb}`), why: 'Upside down. Moles would not cancel, and you would get a number far too small.' },
        { tex: fr(`${MB.toFixed(2)}\\ ${gb}`, `1\\ ${mb}`), why: 'That climbs up to grams. This trip wants molecules, so use Avogadro\'s number.' },
      ],
    };
    throw new Error('Unknown leg ' + ks);
  }
  function factorChain() {
    // Only show cancel slashes on units that really get canceled by the next factor.
    return walk.chainParts.join(' \\times ');
  }
  function paintWalk() {
    const { route } = walk;
    const a = route[walk.leg], b = route[walk.leg + 1];
    const box = Lab.$('#walk-choices');
    const r = Bank.rng(walk.seed++ * 13 + walk.leg * 7);
    if (walk.done) {
      box.innerHTML = '';
      Lab.$('#walk-prompt').textContent = 'You made it';
    } else {
      const F = legFactors(a, b);
      Lab.$('#walk-prompt').textContent = F.name;
      const opts = r.shuffle([{ tex: F.right.tex, ok: true }, ...F.wrong.filter((w) => !w.same)]);
      box.innerHTML = opts.map((o, i) => `<button type="button" class="walk-choice" data-i="${i}">${Lab.texString('$' + o.tex + '$')}</button>`).join('');
      Lab.$$('.walk-choice', box).forEach((btn, i) => btn.addEventListener('click', () => {
        const o = opts[i];
        if (o.ok) {
          walk.values[b] = F.right.f(walk.values[a]);
          walk.chainParts.push(F.right.texC);
          walk.walkT0 = walk.t; walk.fromLeg = walk.leg; walk.leg++;
          walk.mood = 'happy'; walk.msg = '';
          Lab.sound.pop();
          if (walk.leg >= route.length - 1) {
            walk.done = true; walk.mood = 'cheer';
            if (!walk.wrongs && !walk.rewarded) { walk.rewarded = true; Lab.collection.award(1); }
          }
          paintWalk();
        } else {
          btn.classList.add('is-wrong'); btn.disabled = true;
          walk.wrongs++; walk.mood = 'oops'; walk.wrongT = walk.t;
          Lab.$('#walk-msg').textContent = o.why;
          Lab.sound.bad();
        }
      }));
    }
    Lab.$('#walk-msg').textContent = walk.done ? (walk.wrongs ? 'You got there. Try another with no wrong turns to find a new element.' : 'No wrong turns. Well walked.') : walk.msg;
    // Calculation strip.
    const finalSt = route[route.length - 1];
    const parts = factorChain();
    let html = `<p><b>Start:</b> ${Lab.texString(`$${numText(route[0], walk.val)}\\ ${unitOf(route[0])}$`)}. Goal: ${Lab.texString(`$${unitOf(finalSt)}$`)}.</p>`;
    if (walk.chainParts.length > 1) {
      const cur = route[walk.leg];
      const endUnit = walk.done ? unitOf(finalSt) : unitOf(cur);
      html += `<div class="calc-line">$$${parts} = \\mathbf{${numText(cur, walk.values[cur])}}\\ ${endUnit}$$</div>`;
    }
    Lab.$('#walk-calc').innerHTML = Lab.texString(html);
  }
  newWalk();
  walk.stage = Lab.stage('#c-walk', {
    h: 470, label: 'The stoichiometry map with Moe walking from grams down to moles, across the mole ratio and back up to grams.',
    draw(g, t, dt, s) {
      walk.t = t;
      const W = s.W, H = 450;
      const useRooms = walk.route.includes('nA') || walk.route.includes('nB');
      mapBase(g, W, s.H, t, { rooms: useRooms });
      void H;
      equation(g, walk.rx, W / 2, 32, { size: 34 });
      const { A, B, route, values } = walk;
      const has = (st) => values[st] !== undefined;
      surfaceScale(g, LX, has('gA') ? Lab.sig(values.gA, 3) + ' g' : route.includes('gA') ? '? g' : 'g', '#7EA6FF', 1);
      surfaceScale(g, RX, has('gB') ? Lab.sig(values.gB, 3) + ' g' : route.includes('gB') ? '? g' : 'g', '#C7D3FF', 1);
      const fA = A.f, fB = B.f;
      // Chips.
      const lit = (st) => route.includes(st);
      if (lit('gA')) chip(g, has('gA') ? Lab.sig(values.gA, 3) + ' g' : '? g', fA, 106, 30, { bg: '#6B4F0C', stroke: C.sun, size: 22 });
      if (lit('gB')) chip(g, has('gB') ? Lab.sig(values.gB, 3) + ' g' : '? g', fB, 694, 30, { bg: walk.done ? '#1E7A4A' : '#6B4F0C', stroke: walk.done ? C.leaf : C.sun, size: 22 });
      if (lit('molA')) chip(g, has('molA') ? Lab.sig(values.molA, 3) + ' mol' : '? mol', fA, useRooms ? LX + 18 : LX, 448, { bg: '#8C1F5E', stroke: C.pink, size: 24 });
      if (lit('molB')) chip(g, has('molB') ? Lab.sig(values.molB, 3) + ' mol' : '? mol', fB, useRooms ? RX - 18 : RX, 448, { bg: '#8C1F5E', stroke: C.pink, size: 24 });
      if (lit('nB')) chip(g, has('nB') ? Lab.sig(values.nB, 3) : '? molecules', '', 680, 262, { bg: walk.done ? '#1E7A4A' : '#0E5E6E', stroke: walk.done ? C.leaf : C.cyan, size: 22 });
      if (lit('nA')) chip(g, has('nA') ? Lab.sig(values.nA, 3) : '? molecules', '', 112, 262, { bg: '#0E5E6E', stroke: C.cyan, size: 22 });
      const curSt = route[walk.leg];
      Art.text(g, 'Mole ratio lives here', 400, 240, { size: 26, color: curSt === 'molA' && !walk.done ? C.pink : C.dim });
      // Moe.
      const q = clamp((t - walk.walkT0) / 1.5);
      const movingLeg = q < 1 && walk.fromLeg !== undefined;
      const from = movingLeg ? route[walk.fromLeg] : curSt, to = movingLeg ? route[walk.fromLeg + 1] : curSt;
      if (from === to) {
        const P = STATIONS[from];
        const shake = walk.mood === 'oops' && t - (walk.wrongT || -9) < 0.5 ? Math.sin(t * 40) * 4 : 0;
        Art.moe(g, P.x + shake, P.y, 86, walk.mood, { t, flip: P.x > 400 });
      } else walkMoe(g, from, to, q, t, walk.mood, 86);
      if (walk.done && q >= 1) Art.burst(g, STATIONS[to].x, STATIONS[to].y - 80, clamp((t - walk.walkT0 - 1.5) / 1.2), { n: 16, r: 100 });
    },
  });
  Lab.segmented('#walk-mode', (v) => { walk.mode = v; newWalk(); });
  Lab.$('#walk-new').addEventListener('click', () => { Lab.sound.pop(); newWalk(); });

  /* ---------- Story 3: octane surprise ---------- */
  const OCT = parseEq('2C8H18 + 25O2 -> 16CO2 + 18H2O');
  function fuelCan(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const gr = g.createLinearGradient(-50, 0, 50, 0);
    gr.addColorStop(0, '#C73B3B'); gr.addColorStop(0.45, '#FF6B5E'); gr.addColorStop(1, '#9E2A2A');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, -52, -96, 104, 96, 10); g.fill(); g.stroke();
    g.fillStyle = '#7E8496'; Art.round(g, 20, -116, 26, 22, 4); g.fill(); g.stroke();
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 9; g.beginPath(); g.moveTo(-34, -96); g.quadraticCurveTo(-34, -126, 0, -122); g.stroke();
    g.fillStyle = '#FFF2C7'; Art.round(g, -38, -70, 76, 42, 6); g.fill();
    g.restore();
    Art.formula(g, 'C8H18', x, y - 49 * s, { size: 26 * s, color: '#22123A', font: 'body' });
  }
  Lab.story('#story-octane', {
    title: 'How much CO₂ comes from 1 kg of fuel?',
    bg: 'lab',
    scenes: [
      {
        say: 'Here is 1 kilogram of octane, a stand-in for gasoline. It burns and leaves as CO₂ and water. How much CO₂ comes out? <b>Guess before you press Next.</b>',
        dur: 3,
        draw(g, p, t, { W, H }) {
          const benchY = H - 70;
          Art.digitalScale(g, 220, benchY + 2, 260, '1000 g', { size: 22 });
          const a = ease.back(seg(p, 0, 0.25));
          if (a > 0) fuelCan(g, 220, benchY - 38, 1.5 * a);
          const opts = ['Less than 1 kg', 'About 1 kg', 'More than 1 kg'];
          opts.forEach((o, i) => {
            const q = seg(p, 0.3 + i * 0.12, 0.45 + i * 0.12);
            Art.pill(g, o, 590, 100 + i * 70, { size: 28, color: C.plum2, stroke: 'rgba(255,255,255,.4)', alpha: q });
          });
          Art.moe(g, 480, benchY, 96, 'think', { t, flip: false });
          void W;
        },
      },
      {
        say: 'Here is the recipe. Every octane molecule holds <b>8 carbon atoms</b>, and each one leaves as its own CO₂. Those new CO₂ molecules pick up their oxygen from the air.',
        dur: 4.4,
        draw(g, p, t, { W, H }) {
          Art.bg(g, W, H, 'micro', t);
          const pos = equation(g, OCT, W / 2, 44, { size: 40, coefGap: 10 });
          const r = seg(p, 0.05, 0.25);
          if (r > 0) { Art.ring(g, pos.r[0].coefX, 44, 21, { color: C.pink, w: 4, p: r }); Art.ring(g, pos.p[0].coefX, 44, 29, { color: C.pink, w: 4, p: r }); }
          // One octane, its carbons lighting up.
          const a = ease.back(seg(p, 0.05, 0.25));
          if (a > 0) {
            g.save(); g.translate(400, 158); g.scale(a, a); g.translate(-400, -158);
            mol(g, 'C8H18', 400, 158, 42, { style: 'ball', labels: true });
            g.restore();
          }
          for (let i = 0; i < 8; i++) {
            const x0 = 400 + (i - 3.5) * 42;
            const q = ease.inOut(seg(p, 0.3 + i * 0.05, 0.62 + i * 0.03));
            const cx = 106 + (i % 8) * 84;
            if (q > 0) {
              const y = lerp(158, 340, q);
              const x = lerp(x0, cx, q);
              if (q < 1) Art.atom(g, x, y, 17, 'C', { glow: 0.8 });
              else mol(g, 'CO2', cx, 340, 30, { rot: -PI / 2, style: 'fill', atomScale: 1.05, labels: false });
              Art.burst(g, cx, 340, seg(p, 0.62 + i * 0.03, 0.8 + i * 0.03), { n: 8, r: 44 });
            }
          }
          Art.text(g, '8 CO₂ from every 1 octane', W / 2, 424, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.85, 0.97) });
          cform(g, 'C8H18', 110, 118, { size: 30 });
          void t;
        },
      },
      {
        say: 'Walk the map. 1000 g ÷ 114.23 g/mol = 8.754 mol. Multiply by 16/2 to get 70.03 mol CO₂. Multiply by 44.01 g/mol to get <b>3082 g</b>. That is <b>3.08 kg</b> of CO₂ from 1 kg of fuel.',
        dur: 5,
        draw(g, p, t, { W, H }) {
          mapBase(g, W, H, t);
          equation(g, OCT, W / 2, 30, { size: 29 });
          surfaceScale(g, LX, '1000 g', '#FF8A7A', 1);
          const up = seg(p, 0.8, 0.86) > 0;
          surfaceScale(g, RX, up ? '3082 g' : '? g', '#9FB2C7', 1 + 0.5 * seg(p, 0.8, 1));
          chip(g, '1000 g', 'C8H18', 90, 30, { bg: '#6B4F0C', stroke: C.sun, size: 20 });
          chip(g, up ? '3082 g' : '? g', 'CO2', 716, 30, { bg: up ? '#1E7A4A' : '#6B4F0C', stroke: up ? C.leaf : C.sun, size: 20 });
          legLabel(g, ['÷ 114.23', 'g/mol'], 148, 215, 'right', seg(p, 0, 0.3), C.sun);
          legLabel(g, ['× 44.01', 'g/mol'], 652, 215, 'left', seg(p, 0.62, 0.72), C.sun);
          frac(g, ['16 mol', 'CO2'], ['2 mol', 'C8H18'], 400, 228, { size: 28, color: seg(p, 0.3, 0.38) > 0 && p < 0.72 ? C.pink : C.ink });
          chip(g, '8.754 mol', 'C8H18', LX, 426, { bg: '#8C1F5E', stroke: C.pink, size: 22, alpha: seg(p, 0.26, 0.34) });
          chip(g, '70.03 mol', 'CO2', RX, 426, { bg: '#8C1F5E', stroke: C.pink, size: 22, alpha: seg(p, 0.58, 0.66) });
          const legs = [['gA', 'molA', 0, 0.3], ['molA', 'molB', 0.32, 0.62], ['molB', 'gB', 0.64, 0.84]];
          const L = p < 0.32 ? legs[0] : p < 0.64 ? legs[1] : legs[2];
          walkMoe(g, L[0], L[1], seg(p, L[2], L[3]), t, p >= 0.84 ? 'wow' : 'happy');
        },
      },
      {
        say: 'Where did the extra mass come from? <b>Oxygen from the air.</b> 1.00 kg of fuel takes 3.50 kg of O₂ and makes 3.08 kg of CO₂ and 1.42 kg of H₂O. Both sides total 4.50 kg. Mass is conserved after all.',
        dur: 4.4,
        draw(g, p, t, { W, H }) {
          const a = seg(p, 0.06, 0.3), b = seg(p, 0.36, 0.6);
          beam(g, W / 2, H - 66, 245, {
            drawL(gg, x, y) { if (a > 0) { gg.save(); gg.globalAlpha *= a; fuelCan(gg, x - 76, y + 2, 0.46); gasBag(gg, x + 34, y + 2, 138, 74, '#FF7682'); gg.restore(); } },
            drawR(gg, x, y) { if (b > 0) { gg.save(); gg.globalAlpha *= b; gasBag(gg, x - 40, y + 2, 132, 72, '#8D97A8'); gasBag(gg, x + 74, y + 2, 72, 40, '#6FC6F2'); gg.restore(); } },
          });
          qty(g, '1.00 kg', 'C8H18', 155, 32, { size: 30, alpha: a });
          qty(g, '+ 3.50 kg', 'O2', 155, 70, { size: 30, alpha: a });
          qty(g, '3.08 kg', 'CO2', 645, 32, { size: 30, alpha: b });
          qty(g, '+ 1.42 kg', 'H2O', 645, 70, { size: 30, alpha: b });
          const c = seg(p, 0.68, 0.86);
          Art.text(g, '4.50 kg', 155, 120, { font: 'display', size: 44, color: C.sun, alpha: c });
          Art.text(g, '4.50 kg', 645, 120, { font: 'display', size: 44, color: C.sun, alpha: c });
          Art.text(g, '=', W / 2, 90, { font: 'display', size: 70, color: C.leaf, alpha: c });
          void t;
        },
      },
    ],
  });
});
