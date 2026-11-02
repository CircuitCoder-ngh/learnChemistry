/* Lesson 4.3: Combustion equations. Flagship lesson requested by the course owner.
   Every coefficient on stage comes from Bank.combustionChem, which computes and atom-checks it. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const Chem = Bank.combustionChem;
  const TAU = Math.PI * 2;
  const cf = (n) => (n === 1 ? '' : String(n));

  /* ---------- Fire ---------- */
  function tongue(g, x, y, h, w, sway, c0, c1, a) {
    const gr = g.createLinearGradient(0, y, 0, y - h);
    gr.addColorStop(0, Art.alpha(c0, a)); gr.addColorStop(0.55, Art.alpha(c1, a)); gr.addColorStop(1, Art.alpha(c1, a * 0.25));
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x - w * 0.22, y);
    g.bezierCurveTo(x - w * 1.12, y - h * 0.2, x - w * 0.62 + sway * 0.5, y - h * 0.62, x + sway, y - h);
    g.bezierCurveTo(x + w * 0.62 + sway * 0.5, y - h * 0.62, x + w * 1.12, y - h * 0.2, x + w * 0.22, y);
    g.quadraticCurveTo(x, y + w * 0.14, x - w * 0.22, y);
    g.fill();
  }
  /* Soft light sprites, cached: real fire is hundreds of rising glows, so the flame body is drawn that way. */
  const blobCache = new Map();
  function blobSprite(color) {
    let c = blobCache.get(color);
    if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, Art.alpha(color, 1)); gr.addColorStop(0.35, Art.alpha(color, 0.6)); gr.addColorStop(1, Art.alpha(color, 0));
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    blobCache.set(color, c);
    return c;
  }
  const FIRE_Y = ['#FFF3C2', '#FFC23A', '#FF6A13', '#B52A08'], FIRE_B = ['#E4FAFF', '#6FD4FF', '#2F7BFF', '#1B3FC8'];
  /** A living flame. blue 0 is a yellow sooty flame, 1 is a clean blue flame. Base at (x, y). */
  function flame(g, x, y, h, t, o = {}) {
    if (h <= 1) return;
    const b = o.blue || 0, wide = o.wide || 1, w = h * 0.3 * wide, s = o.seed || 0, A = o.alpha === undefined ? 1 : o.alpha;
    const pal = b === 0 ? FIRE_Y : b === 1 ? FIRE_B : FIRE_Y.map((c, i) => Art.mix(c, FIRE_B[i], b));
    const sway = (Math.sin(t * 7 + s) * 0.05 + Math.sin(t * 13 + s * 2) * 0.035) * h;
    const fl = 1 + Math.sin(t * 11 + s) * 0.05 + Math.sin(t * 19 + s) * 0.03;
    Art.glow(g, x, y - h * 0.42, h * (1.2 - b * 0.3), Art.mix('#FF8A2B', '#3D7BFF', b), 0.34 * A);
    g.save();
    const base = g.globalAlpha * A;
    g.globalAlpha = base;
    // Crisp layers keep the flame friendly and readable, in the site's drawn style.
    const oa = 0.92 - b * 0.42;
    tongue(g, x - w * 0.46, y, h * 0.6 * fl, w * 0.55, -sway * 1.2, pal[2], pal[1], oa * 0.9);
    tongue(g, x + w * 0.46, y, h * 0.7 * fl, w * 0.55, sway * 1.3, pal[2], pal[1], oa * 0.9);
    tongue(g, x, y, h * fl, w, sway, pal[2], pal[1], oa);
    tongue(g, x, y, h * 0.7 * fl, w * 0.66, sway * 0.7, pal[1], pal[0], 0.92);
    tongue(g, x, y, h * 0.4 * fl, w * 0.34, sway * 0.4, pal[0], '#FFFFFF', 0.95);
    // Then light that rises and flickers along it.
    g.globalCompositeOperation = 'lighter';
    const n = o.n || 16;
    for (let i = 0; i < n; i++) {
      const r1 = rand(i + s * 7 + 0.1), r2 = rand(i * 3 + s + 0.7), r3 = rand(i * 5 + s + 0.3);
      const life = (t * (0.85 + r1 * 0.85) + r2) % 1;
      const prof = Math.sin(Math.PI * Math.pow(life, 0.6));
      const px = x + (r3 - 0.5) * 1.9 * w * prof + Math.sin(t * 4 + life * 6 + i) * h * 0.04 * life;
      const py = y - life * h * (0.9 + 0.2 * r1);
      const size = h * (0.05 + 0.13 * prof) * (0.8 + 0.4 * r2);
      g.globalAlpha = base * Math.min(1, life * 7) * Math.pow(1 - life, 0.8) * 0.34;
      g.drawImage(blobSprite(life < 0.5 ? pal[1] : pal[2]), px - size, py - size, size * 2, size * 2);
    }
    g.restore();
  }
  /** A wavy line: a ripple of rising heat. */
  function wave(g, x0, y0, x1, y1, amp, cycles, phase, color, lw = 3, alpha = 1) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    g.save(); g.globalAlpha *= alpha; g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round';
    g.beginPath();
    for (let i = 0; i <= 44; i++) {
      const u = i / 44, off = Math.sin(u * cycles * TAU + phase) * amp * Math.sin(Math.PI * u);
      const x = x0 + dx * u + nx * off, y = y0 + dy * u + ny * off;
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.stroke(); g.restore();
  }
  /** A spark of energy flying out from (x, y) along angle a. */
  function photon(g, x, y, a, dist, phase, color = '#FFE27A') {
    const u = phase % 1, d = u * dist, fade = Math.sin(u * Math.PI);
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    g.strokeStyle = Art.alpha(color, 0.55 * fade); g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x + Math.cos(a) * Math.max(0, d - 30), y + Math.sin(a) * Math.max(0, d - 30)); g.lineTo(px, py); g.stroke();
    Art.glow(g, px, py, 16, color, 0.7 * fade);
    g.fillStyle = Art.alpha(color, fade);
    Art.star(g, px, py, 7 + 3 * fade, a + u * 3);
  }
  /** Soft beams of light fanning out from a flame. */
  function beams(g, x, y, a0, a1, n, len, t, alpha) {
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = lerp(a0, a1, n > 1 ? i / (n - 1) : 0.5), L = len * (0.8 + 0.2 * Math.sin(t * 2 + i * 1.7));
      const gr = g.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L);
      gr.addColorStop(0, Art.alpha('#FFE27A', 0.6 * alpha)); gr.addColorStop(1, Art.alpha('#FFE27A', 0));
      g.strokeStyle = gr; g.lineWidth = 11;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    g.restore();
  }

  /* ---------- Equations on stage ---------- */
  function fw(g, f, size) { const a = g.globalAlpha; g.globalAlpha = 0; const w = Art.formula(g, f, -999, -999, { size }); g.globalAlpha = a; return w; }
  /**
   * Draw an equation with spacing, a real arrow, and highlights.
   * items: 'CH4', '2O2', '+', '->', or { t:'2O2', hi:color, dim:true, alpha }.
   */
  function eqRow(g, items, cx, y, size = 36, o = {}) {
    const gap = size * 0.3, aw = size * 1.15;
    const parts = items.map((it) => {
      const obj = typeof it === 'string' ? { t: it } : it;
      if (obj.t === '->') return Object.assign({ w: aw, kind: 'arrow' }, obj);
      if (obj.t === '+') return Object.assign({ w: size * 0.6, kind: 'plus' }, obj);
      const m = /^(\d+(?:\/\d+)?|\?)\s*([A-Z(].*)$/.exec(obj.t);
      const coef = m ? m[1] : '', f = m ? m[2] : obj.t;
      g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
      const frac = coef.includes('/');
      const cw = coef ? (frac ? size * 0.74 : g.measureText(coef).width) + size * 0.08 : 0;
      return Object.assign({ kind: 'term', coef, f, cw, w: cw + fw(g, f, size) }, obj);
    });
    const total = parts.reduce((s, p) => s + p.w, 0) + gap * (parts.length - 1);
    let x = cx - total / 2;
    const prev = g.globalAlpha;
    parts.forEach((p) => {
      g.globalAlpha = prev * (p.alpha === undefined ? (p.dim ? 0.32 : 1) : p.alpha);
      if (p.hi) {
        g.fillStyle = Art.alpha(p.hi, 0.26); Art.round(g, x - 8, y - size * 0.74, p.w + 16, size * 1.5, 12); g.fill();
        g.strokeStyle = p.hi; g.lineWidth = 3; g.stroke();
      }
      if (p.kind === 'arrow') Art.arrow(g, x + 2, y, x + p.w - 4, y, { color: o.opColor || C.ink, w: size * 0.09, head: size * 0.24 });
      else if (p.kind === 'plus') Art.text(g, '+', x + p.w / 2, y, { size, font: 'display', color: o.opColor || C.dim });
      else {
        if (p.coef && p.coef.includes('/')) {
          const [nu, de] = p.coef.split('/'), fs = Math.max(20, size * 0.62), cc = o.coefColor || C.sun, mx = x + size * 0.37;
          Art.text(g, nu, mx, y - fs * 0.62, { size: fs, font: 'display', color: cc });
          Art.text(g, de, mx, y + fs * 0.62, { size: fs, font: 'display', color: cc });
          g.strokeStyle = cc; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(mx - size * 0.3, y); g.lineTo(mx + size * 0.3, y); g.stroke();
        } else if (p.coef) Art.text(g, p.coef, x, y, { size, font: 'display', align: 'left', color: p.coef === '?' ? C.pink : (o.coefColor || C.sun) });
        Art.formula(g, p.f, x + p.cw, y, { size, align: 'left', colorize: true });
      }
      x += p.w + gap;
    });
    g.globalAlpha = prev;
    return total;
  }
  const eqItems = (fu, k) => [cf(k.a) + fu, '+', cf(k.b) + 'O2', '->', cf(k.c) + 'CO2', '+', cf(k.d) + 'H2O'];
  function strip(g, x, y, w, h, o = {}) {
    g.fillStyle = o.fill || 'rgba(18,8,36,.78)'; Art.round(g, x, y, w, h, Math.min(20, h / 2)); g.fill();
    g.strokeStyle = o.stroke || 'rgba(255,255,255,.14)'; g.lineWidth = 2.5; g.stroke();
  }

  /* ---------- A small reaction engine: atoms keep their identity as partners change ---------- */
  const R_ATOM = { H: 0.56, C: 0.82, O: 0.78, Mg: 1.05, S: 1.0 };
  const LOCAL_MOL = {
    C: { a: [['C', 0, 0]], b: [] }, S: { a: [['S', 0, 0]], b: [] }, Mg: { a: [['Mg', 0, 0]], b: [] },
    MgO: { a: [['Mg', -0.58, 0], ['O', 0.58, 0]], b: [] },
  };
  const tplOf = (f) => Art.moleculeData(f) || LOCAL_MOL[f];
  const radius = (sym, s, fill) => (R_ATOM[sym] || 0.9) * s * (fill ? 0.72 : 0.42);
  function place(f, x, y, s, rot = 0) {
    const c = Math.cos(rot), d = Math.sin(rot), m = tplOf(f);
    return { atoms: m.a.map(([sym, ax, ay]) => ({ sym, x: x + (ax * c - ay * d) * s, y: y + (ax * d + ay * c) * s, s })), bonds: m.b };
  }
  /** reacts, prods: lists of [formula, x, y, s, rot]. Returns atoms that remember where they start, roam and end. */
  function buildRx(reacts, prods, mid = {}) {
    const atoms = [], b0 = [];
    reacts.forEach(([f, x, y, s, rot]) => {
      const m = place(f, x, y, s, rot), base = atoms.length;
      m.atoms.forEach((a) => atoms.push({ sym: a.sym, x0: a.x, y0: a.y, s0: a.s }));
      m.bonds.forEach(([i, j, o]) => b0.push([base + i, base + j, o]));
    });
    const ends = [], b1 = [];
    prods.forEach(([f, x, y, s, rot]) => {
      const m = place(f, x, y, s, rot), base = ends.length;
      m.atoms.forEach((a) => ends.push({ sym: a.sym, x: a.x, y: a.y, s: a.s, used: false }));
      m.bonds.forEach(([i, j, o]) => b1.push([base + i, base + j, o]));
    });
    const endToAtom = new Map();
    // Handle scarce elements first so that carbons pair sensibly, then nearest free partner.
    ['C', 'S', 'Mg', 'O', 'H'].forEach((sym) => {
      atoms.forEach((a, i) => {
        if (a.sym !== sym) return;
        let best = -1, bd = 1e9;
        ends.forEach((e, k) => { if (!e.used && e.sym === sym) { const d = Math.hypot(e.x - a.x0, e.y - a.y0); if (d < bd) { bd = d; best = k; } } });
        if (best < 0) throw new Error('Atoms do not match in reaction');
        ends[best].used = true; endToAtom.set(best, i);
        a.x1 = ends[best].x; a.y1 = ends[best].y; a.s1 = ends[best].s;
      });
    });
    if (ends.some((e) => !e.used)) throw new Error('Atoms do not match in reaction');
    const cx = mid.x === undefined ? 400 : mid.x, cy = mid.y === undefined ? 220 : mid.y, rx = mid.rx || 170, ry = mid.ry || 120;
    atoms.forEach((a, i) => {
      const an = (i / atoms.length) * TAU + rand(i + 3) * 0.7, rr = 0.45 + rand(i + 11) * 0.55;
      a.mx = cx + Math.cos(an) * rx * rr; a.my = cy + Math.sin(an) * ry * rr;
      a.d = rand(i + 21);
    });
    return { atoms, b0, b1: b1.map(([i, j, o]) => [endToAtom.get(i), endToAtom.get(j), o]) };
  }
  function rxPos(a, q, t, i, jig = 1) {
    const qq = clamp((q - a.d * 0.06) / 0.94);
    let x, y, s;
    if (qq < 0.5) { const u = ease.inOut(qq * 2); x = lerp(a.x0, a.mx, u); y = lerp(a.y0, a.my, u); s = a.s0; }
    else { const u = ease.inOut((qq - 0.5) * 2); x = lerp(a.mx, a.x1, u); y = lerp(a.my, a.y1, u); s = a.s1; }
    const looseness = Math.sin(Math.PI * clamp(qq)) * 7 * jig;
    return { x: x + wander(i + 5, t * 2.4) * looseness, y: y + wander(i + 50, t * 2.4) * looseness, s };
  }
  /** Draw a reaction at q: 0 reactants, 0.5 every atom loose, 1 products. */
  function drawRx(g, rx, q, t, o = {}) {
    const P = rx.atoms.map((a, i) => rxPos(a, q, t, i, o.jig));
    const fill = !!o.fill;
    if (!fill) {
      const a0 = 1 - seg(q, 0.1, 0.26), a1 = seg(q, 0.74, 0.9);
      const bond = (list, A) => {
        if (A <= 0) return;
        const prev = g.globalAlpha; g.globalAlpha = prev * A;
        list.forEach(([i, j, ord]) => Art.bond(g, P[i].x, P[i].y, P[j].x, P[j].y, { order: ord, width: Math.max(3, P[i].s * 0.1) }));
        g.globalAlpha = prev;
      };
      bond(rx.b0, a0); bond(rx.b1, a1);
    }
    const order = P.map((_, i) => i).sort((A, B) => (rx.atoms[A].sym === 'H') - (rx.atoms[B].sym === 'H'));
    order.forEach((i) => {
      const a = rx.atoms[i], p = P[i], r = radius(a.sym, p.s, fill);
      const face = o.face ? o.face(i, a, q) : null;
      Art.atom(g, p.x, p.y, r, a.sym, { face, t, seed: i, look: o.look, label: o.labels === false ? false : (r >= 11 ? a.sym : false), glow: o.glow ? o.glow(i, a, q) : 0 });
    });
    return P;
  }
  /** Flash of energy where atoms crash together. */
  function flash(g, x, y, r, q) {
    const a = Math.sin(Math.PI * clamp(q));
    if (a <= 0.01) return;
    Art.glow(g, x, y, r * 0.9, '#FF9E3D', 0.42 * a);
    Art.glow(g, x, y, r * 0.42, '#FFE7B0', 0.42 * a);
  }

  /* ---------- Atom tally: beads you can count ---------- */
  function beads(g, n, x0, x1, y, sym, o = {}) {
    if (n <= 0) return;
    const rows = n > 36 ? 3 : n > 14 ? 2 : 1;
    const r = o.r || (rows === 1 ? 13 : rows === 2 ? 10.5 : 8.5);
    const cols = Math.ceil(n / rows);
    const sp = Math.min(r * 2.2, (x1 - x0 - 2 * r) / Math.max(1, cols - 1) || r * 2.2);
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / cols), col = i % cols, rowN = row < rows - 1 ? cols : n - cols * (rows - 1);
      const w = (rowN - 1) * sp;
      const base = o.align === 'right' ? x1 - r - w : x0 + r;
      const x = base + col * sp;
      const yy = y + (row - (rows - 1) / 2) * r * 2.15;
      Art.ball(g, x, yy, r, Art.elementColor(sym));
    }
  }

  /* ---------- Story 1: what fire is ---------- */
  function candle(g, x, base, w, h) {
    const top = base - h;
    const wax = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    wax.addColorStop(0, '#E9C7D2'); wax.addColorStop(0.32, '#FFF4E8'); wax.addColorStop(1, '#C49AB4');
    g.fillStyle = wax; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - w / 2, top); g.lineTo(x - w / 2, base); g.lineTo(x + w / 2, base); g.lineTo(x + w / 2, top); g.closePath(); g.fill(); g.stroke();
    // Drips, the melted pool, and the wick.
    g.fillStyle = '#FFF4E8';
    Art.round(g, x - w * 0.4, top, 13, h * 0.42, 6); g.fill();
    Art.round(g, x + w * 0.2, top, 11, h * 0.26, 5); g.fill();
    g.fillStyle = '#FFF9F2'; g.beginPath(); g.ellipse(x, top, w / 2, w * 0.13, 0, 0, TAU); g.fill(); g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#FFD99A'; g.beginPath(); g.ellipse(x, top, w * 0.3, w * 0.07, 0, 0, TAU); g.fill();
    g.strokeStyle = '#2B1A1A'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, top); g.quadraticCurveTo(x + 1, top - 10, x + 3, top - 20); g.stroke();
    return top - 16;
  }
  function table(g, W, y) {
    const b = g.createLinearGradient(0, y, 0, y + 60);
    b.addColorStop(0, '#6B4A33'); b.addColorStop(1, '#2F1F1C');
    g.fillStyle = b; g.fillRect(0, y, W, 90);
    g.fillStyle = 'rgba(255,214,160,.3)'; g.fillRect(0, y, W, 3);
  }
  function waxBits(gg, cx, cy, t, q, spread = 1) {
    // Wax vapor is a very long hydrocarbon. An eight-carbon chain stands in for it, and two more peek in.
    Art.molecule(gg, cx - 18 * (1 - q) * spread, cy + 6 + wander(3, t) * 4, 32, 'C8H18', { style: 'fill', atomScale: 1.05, rot: 0.06 + Math.sin(t * 0.6) * 0.04, labels: false });
  }
  Lab.story('#story-fire', {
    title: 'What is a flame?',
    bg: (g, W, H) => {
      const r = g.createRadialGradient(W * 0.5, H * 0.4, 30, W * 0.5, H * 0.5, W * 0.72);
      r.addColorStop(0, '#3A1F4F'); r.addColorStop(1, '#150A26');
      g.fillStyle = r; g.fillRect(0, 0, W, H);
    },
    scenes: [
      {
        say: 'Light a candle. You get <b>heat</b> you can feel and <b>light</b> you can see. But where does it come from?',
        dur: 3.2,
        draw(g, p, t, { W, H }) {
          const q = ease.out(seg(p, 0, 0.35));
          Art.glow(g, 400, 170, 400, '#FF8A2B', 0.24 * q);
          table(g, W, H - 48);
          const top = candle(g, 400, H - 48, 94, 172);
          flame(g, 400, top + 4, 150 * q, t);
          const a = seg(p, 0.35, 0.6);
          // Light on the left: beams and sparks that spread straight out.
          beams(g, 396, 170, Math.PI - 0.8, Math.PI + 0.8, 7, 300, t, a);
          if (a > 0) for (let i = 0; i < 6; i++) photon(g, 396, 170, Math.PI - 0.72 + i * 0.29, 280, t * 0.42 + i * 0.37 + 1);
          Art.text(g, 'light', 120, 118, { font: 'display', size: 48, color: C.sun, alpha: a, halo: true });
          // Heat on the right, ripples that rise.
          for (let i = 0; i < 5; i++) {
            const x = 486 + i * 32;
            wave(g, x, 250, x + 6, 74, 12, 2.2, t * 3 + i, '#FF8A2B', 5, a * (0.8 - i * 0.1));
          }
          Art.text(g, 'heat', 700, 118, { font: 'display', size: 48, color: C.fire, alpha: a, halo: true });
          Art.moe(g, 690, H - 44, 150, 'wow', { t, flip: true });
        },
      },
      {
        say: 'Zoom into the flame. Wax vapor from the candle meets <b>oxygen</b> from the air. The wax is the <b>fuel</b>.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          Art.glow(g, 130, 210, 200, '#FF8A2B', 0.2);
          table(g, W, H - 48);
          const top = candle(g, 130, H - 48, 64, 118);
          flame(g, 130, top + 3, 110, t);
          Art.zoom(g, 136, top - 46, 500, 206, 188, (gg, cx, cy, R) => {
            const q = ease.out(seg(p, 0.25, 0.8));
            waxBits(gg, cx, cy + 16, t, q);
            [[-0.95, -0.62], [0, -0.78], [0.95, -0.62], [-0.62, 0.98], [0.62, 0.98]].forEach(([u, v], i) => {
              const k = 1 - (1 - q) * 0.3;
              const x = cx + u * R * 0.78 * (2 - k), y = cy + v * R * 0.74 * (2 - k);
              Art.molecule(gg, x + wander(i + 3, t) * 7, y + wander(i + 30, t) * 7, 40, 'O2', { rot: i * 1.1 + Math.sin(t * 0.7 + i) * 0.25, style: 'fill', atomScale: 1.16, face: i === 1 || i === 3 ? 'happy' : null, labels: false, t, look: [0, 1] });
            });
          }, { p: seg(p, 0.08, 0.45), bg1: '#44213F', bg2: '#1C0D22' });
          const a = seg(p, 0.6, 0.85);
          Art.pill(g, 'fuel: wax vapor', 500, 288, { size: 24, color: C.fire, text: '#22123A', alpha: a });
          Art.pill(g, 'oxygen from the air', 500, 28, { size: 24, color: C.cyan, text: '#06222B', alpha: a });
        },
      },
      {
        say: 'They react. Atoms swap partners and leave as <b>carbon dioxide</b> and <b>water</b>, both invisible gases. Each swap releases energy.',
        dur: 3.8,
        draw(g, p, t, { W, H }) {
          Art.glow(g, 130, 210, 200, '#FF8A2B', 0.2);
          table(g, W, H - 48);
          const top = candle(g, 130, H - 48, 64, 118);
          flame(g, 130, top + 3, 110, t);
          Art.zoom(g, 136, top - 46, 500, 206, 188, (gg, cx, cy, R) => {
            const q = seg(p, 0.08, 0.55);
            if (q < 0.55) {
              const a = 1 - seg(q, 0.3, 0.55);
              const pr = gg.globalAlpha; gg.globalAlpha = pr * a;
              waxBits(gg, cx, cy + 12, t, 1);
              [[-1, -0.48], [0.1, -0.68], [1, -0.5], [-1, 0.68], [0.95, 0.62]].forEach(([u, v], i) => {
                Art.molecule(gg, lerp(cx + u * R * 0.72, cx, ease.in(q)), lerp(cy + v * R * 0.72, cy, ease.in(q)), 40, 'O2', { rot: i * 1.1, style: 'fill', atomScale: 1.16, labels: false });
              });
              gg.globalAlpha = pr;
            }
            flash(gg, cx, cy, R * 1.1, seg(p, 0.14, 0.62));
            // Energy leaves as sparks, behind the molecules.
            const e = seg(p, 0.5, 0.7);
            if (e > 0) for (let i = 0; i < 10; i++) photon(gg, cx, cy, (i / 10) * TAU + 0.3, R * 0.98, t * 0.45 + i * 0.29, i % 2 ? '#FFE27A' : '#FFA24A');
            const out = ease.out(seg(p, 0.42, 1));
            if (out > 0) {
              const items = [['CO2', -1.0, -0.5, 36, 0.2, 'happy'], ['H2O', -0.15, -0.72, 44, -0.3, 'happy'], ['CO2', 0.86, -0.42, 36, -0.35, null], ['H2O', -0.82, 0.48, 44, 0.3, null], ['CO2', 0.05, 0.1, 36, 0.3, 'happy'], ['H2O', 0.82, 0.5, 44, 0.5, 'happy']];
              items.forEach(([f, u, v, s, rot, face], i) => {
                const x = cx + u * R * 0.72 * out + wander(i + 7, t) * 6, y = cy + v * R * 0.72 * out - Math.sin(t * 0.8 + i) * 5;
                Art.molecule(gg, x, y, s, f, { rot: rot + Math.sin(t * 0.7 + i) * 0.18, style: 'fill', atomScale: 1.14, labels: false, face, t, alpha: seg(p, 0.42, 0.6), look: [0, -1] });
              });
            }
          }, { p: 1, bg1: '#44213F', bg2: '#1C0D22' });
          const a = seg(p, 0.72, 0.92);
          Art.text(g, 'CO₂', 745, 112, { font: 'display', size: 34, alpha: a, halo: true });
          Art.text(g, 'H₂O', 745, 164, { font: 'display', size: 34, alpha: a, halo: true, color: '#8FD8FF' });
          Art.text(g, 'energy', 745, 216, { font: 'display', size: 28, alpha: a, halo: true, color: C.sun });
        },
      },
      {
        say: 'That is <b>combustion</b>: a fuel reacts rapidly with $\\ce{O2}$, releasing heat and light. Learn this pattern. It works for every fuel made of carbon and hydrogen.',
        dur: 3.8,
        draw(g, p, t, { W, H }) {
          const box = (x, label, draw, q) => {
            Art.popIn(g, x, 190, q, (gg) => {
              gg.fillStyle = 'rgba(255,255,255,.07)'; Art.round(gg, -68, -92, 136, 184, 26); gg.fill();
              gg.strokeStyle = 'rgba(255,255,255,.18)'; gg.lineWidth = 2.5; gg.stroke();
              draw(gg);
            });
            Art.text(g, label, x, 310, { font: 'display', size: 24, alpha: q, maxW: 148 });
          };
          const q = (i) => seg(p, 0.05 + i * 0.13, 0.26 + i * 0.13);
          box(82, 'fuel', (gg) => Art.molecule(gg, 0, 0, 42, 'CH4', { face: 'happy', t }), q(0));
          box(236, 'oxygen', (gg) => Art.molecule(gg, 0, 0, 54, 'O2', { face: 'happy', t, rot: -0.5 }), q(1));
          box(432, 'carbon dioxide', (gg) => Art.molecule(gg, 0, 0, 40, 'CO2', { face: 'happy', t, rot: 0.92 }), q(2));
          box(586, 'water', (gg) => Art.molecule(gg, 0, -6, 52, 'H2O', { face: 'happy', t }), q(3));
          Art.text(g, '+', 159, 190, { font: 'display', size: 44, alpha: q(1), color: C.dim });
          Art.text(g, '+', 509, 190, { font: 'display', size: 44, alpha: q(3), color: C.dim });
          Art.arrow(g, 312, 190, 354, 190, { color: C.pink, w: 7, p: seg(p, 0.28, 0.42) });
          const e = q(4);
          Art.text(g, '+', 663, 190, { font: 'display', size: 44, alpha: e, color: C.dim });
          Art.popIn(g, 730, 190, e, (gg) => flame(gg, 0, 66, 124, t));
          Art.text(g, 'energy', 730, 310, { font: 'display', size: 24, alpha: e, color: C.sun });
          strip(g, 110, 356, 580, 68);
          Art.text(g, 'fuel + O₂  →  CO₂ + H₂O + energy', W / 2, 391, { font: 'display', size: 34, color: C.ink, alpha: seg(p, 0.65, 0.85) });
          void H;
        },
      },
    ],
  });

  /* ---------- Bench: the fire triangle ---------- */
  const fire = { noFuel: false, lid: false, wet: false, h: 1, lidY: 0, logs: 0, o2: 1, wetT: 0, smoke: 0, found: new Set() };
  function log(g, x, y, w, rot, burn) {
    g.save(); g.translate(x, y); g.rotate(rot);
    const gr = g.createLinearGradient(0, -14, 0, 14);
    gr.addColorStop(0, '#9A6A42'); gr.addColorStop(1, '#4A2C1B');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, -w / 2, -14, w, 28, 12); g.fill(); g.stroke();
    if (burn > 0) { g.fillStyle = Art.alpha('#FF8A2B', 0.55 * burn); Art.round(g, -w * 0.18, -12, w * 0.36, 24, 10); g.fill(); }
    g.fillStyle = '#D7B48A'; g.beginPath(); g.ellipse(w / 2 - 2, 0, 7, 13, 0, 0, TAU); g.fill(); g.stroke();
    g.restore();
  }
  const triStage = Lab.stage('#c-triangle', {
    bg: (g, W, H) => {
      const r = g.createLinearGradient(0, 0, 0, H);
      r.addColorStop(0, '#1B1140'); r.addColorStop(1, '#2C1B4D');
      g.fillStyle = r; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + rand(i) * 0.6})`; g.fillRect(rand(i + 3) * W, rand(i + 5) * 210, 2, 2); }
      g.fillStyle = '#231335'; g.beginPath(); g.moveTo(0, H - 96); g.quadraticCurveTo(W * 0.3, H - 120, W * 0.6, H - 98); g.quadraticCurveTo(W * 0.8, H - 90, W, H - 104); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    },
    label: 'A campfire next to the fire triangle. Each side of the triangle goes dark when you remove it, and the fire dies.',
    draw(g, t, dt) {
      const F = fire, X = 232, base = 392;
      // Physics of the fire.
      F.lidY = lerp(F.lidY, F.lid ? 1 : 0, clamp(dt * 3.2));
      F.logs = lerp(F.logs, F.noFuel ? 1 : 0, clamp(dt * 3));
      if (F.lid && F.lidY > 0.92) F.o2 = Math.max(0, F.o2 - dt * 0.42); else if (!F.lid) F.o2 = Math.min(1, F.o2 + dt * 0.9);
      const target = F.noFuel || F.wet ? 0 : clamp(F.o2 * 1.4);
      F.h = lerp(F.h, target, clamp(dt * (target < F.h ? 2.4 : 1.6)));
      if (F.h < 0.08) F.smoke = Math.max(0, F.smoke - dt * 0.12);
      if (F.h > 0.5) F.smoke = 1;
      if (F.wet) F.wetT += dt; else F.wetT = 0;

      // Ground and fire ring.
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(X, base + 12, 180, 26, 0, 0, TAU); g.fill();
      Art.glow(g, X, base - 60, 240 * (0.25 + F.h), '#FF8A2B', 0.3 * F.h);
      const spread = F.logs * 96;
      log(g, X - 40 - spread, base - 8, 164, -0.2 - F.logs * 0.1, F.h);
      log(g, X + 40 + spread, base - 8, 164, Math.PI + 0.2 + F.logs * 0.1, F.h);
      if (!F.noFuel || F.logs < 0.98) log(g, X, base - 30 + F.logs * 8, 150 - F.logs * 40, Math.PI / 2 - 1.5, F.h * 0.8);
      if (F.h > 0.02) {
        flame(g, X, base - 26, 190 * F.h, t, { wide: 1.25 });
        flame(g, X - 44, base - 22, 108 * F.h, t, { seed: 3 });
        flame(g, X + 46, base - 20, 92 * F.h, t, { seed: 6 });
        // Sparks.
        for (let i = 0; i < 7; i++) {
          const ph = (t * (0.4 + rand(i) * 0.4) + rand(i + 2)) % 1;
          g.fillStyle = Art.alpha('#FFD27A', (1 - ph) * F.h);
          g.beginPath(); g.arc(X + Math.sin(ph * 8 + i) * 34 + (rand(i + 9) - 0.5) * 60, base - 90 - ph * 210, 2.6, 0, TAU); g.fill();
        }
      } else if (F.smoke > 0) {
        Art.smoke(g, X, base - 40, t, { n: 12, h: 240, r: 15, spread: 40, alpha: 0.36 * F.smoke, color: '#CFC7DD' });
      }
      // Water pours from above.
      if (F.wet && F.wetT < 2.4) {
        for (let i = 0; i < 26; i++) {
          const ph = (t * 1.5 + rand(i)) % 1, x = X - 90 + rand(i + 4) * 180;
          g.fillStyle = 'rgba(120,205,255,.85)';
          g.beginPath(); g.ellipse(x, 10 + ph * (base - 40), 4, 10, 0, 0, TAU); g.fill();
        }
      }
      if (F.wet && F.wetT > 0.5) Art.smoke(g, X, base - 30, t, { n: 10, h: 220, r: 18, spread: 50, alpha: 0.3, color: '#F2F7FF', speed: 0.5 });
      // Lid drops over the fire.
      if (F.lidY > 0.01) {
        const y = lerp(-250, base - 18, ease.out(F.lidY));
        g.save(); g.translate(X, y);
        const gr = g.createLinearGradient(-130, 0, 130, 0);
        gr.addColorStop(0, '#7F7A99'); gr.addColorStop(0.4, '#E5E2F2'); gr.addColorStop(1, '#615C7C');
        g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3.5;
        g.beginPath(); g.moveTo(-140, 10); g.bezierCurveTo(-136, -240, 136, -240, 140, 10); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#C9C5DD'; Art.round(g, -148, 4, 296, 16, 7); g.fill(); g.stroke();
        Art.round(g, -22, -204, 44, 18, 8); g.fill(); g.stroke();
        g.restore();
        // A gauge on the lid shows oxygen running out inside.
        if (F.lidY > 0.8) {
          Art.text(g, 'oxygen left', X, base - 138, { size: 22, color: '#22123A' });
          Art.meter(g, X - 70, base - 118, 140, 16, F.o2, { color: F.o2 > 0.3 ? '#17A7C6' : C.red });
        }
      }

      // The triangle.
      const cx = 566, cy = 250, R = 166;
      const pts = [[cx, cy - R * 0.98], [cx - R * 0.95, cy + R * 0.66], [cx + R * 0.95, cy + R * 0.66]];
      const sides = [
        { a: pts[0], b: pts[1], on: !F.noFuel, label: 'Fuel', color: C.sun, lx: cx - 128, ly: cy - 66 },
        { a: pts[0], b: pts[2], on: F.o2 > 0.05 && !(F.lid && F.o2 < 0.12), label: 'Oxygen', color: C.cyan, lx: cx + 140, ly: cy - 66 },
        { a: pts[1], b: pts[2], on: !F.wet, label: 'Heat', color: C.fire, lx: cx, ly: cy + R * 0.66 + 40 },
      ];
      sides.forEach((s) => {
        const c = s.on ? s.color : '#4A3772';
        g.lineCap = 'round';
        if (s.on) { g.strokeStyle = Art.alpha(s.color, 0.3); g.lineWidth = 26; g.beginPath(); g.moveTo(s.a[0], s.a[1]); g.lineTo(s.b[0], s.b[1]); g.stroke(); }
        g.strokeStyle = c; g.lineWidth = 13;
        if (!s.on) g.setLineDash([16, 18]);
        g.beginPath(); g.moveTo(s.a[0], s.a[1]); g.lineTo(s.b[0], s.b[1]); g.stroke(); g.setLineDash([]);
        Art.text(g, s.label, s.lx, s.ly, { font: 'display', size: 34, color: s.on ? s.color : C.faint, halo: true });
      });
      const alive = F.h > 0.1;
      if (alive) flame(g, cx, cy + 44, 110 * F.h + 10, t, { seed: 2 });
      Art.text(g, alive ? 'Burning' : 'Out', cx, cy + 74, { font: 'display', size: 32, color: alive ? '#fff' : C.red, halo: true });
      Art.text(g, `${F.found.size} of 3 ways found`, cx, 30, { size: 25, color: F.found.size === 3 ? C.leaf : C.dim, halo: true });
    },
  });
  function fireFoot(html) { Lab.$('#fire-foot').innerHTML = Lab.texString(html); }
  function firePut(kind) {
    if (kind === 'fuel') { fire.noFuel = true; fireFoot('<p><b>Fuel removed.</b> With nothing to burn, the flames die as the logs part. This is how firefighters use a firebreak: they clear the wood ahead of a wildfire.</p>'); }
    if (kind === 'air') { fire.lid = true; fireFoot('<p><b>Oxygen removed.</b> The fire burns until it has used up the oxygen under the lid. This is why you smother a pan fire with a lid. Never use water on burning oil.</p>'); }
    if (kind === 'heat') { fire.wet = true; fireFoot('<p><b>Heat removed.</b> Water soaks up heat as it turns to steam, and the fuel cools below the point where it can keep reacting.</p>'); }
    const before = fire.found.size;
    fire.found.add(kind);
    Lab.sound.pop();
    if (fire.found.size === 3 && before < 3) {
      Lab.collection.award(1);
      fireFoot('<p><b>All three.</b> Fuel, oxygen, heat. You removed one side each time and the reaction stopped, because a reaction cannot run without its reactants and enough energy to get going.</p>');
    }
    triStage.redraw();
  }
  Lab.$('#fire-fuel').addEventListener('click', () => firePut('fuel'));
  Lab.$('#fire-air').addEventListener('click', () => firePut('air'));
  Lab.$('#fire-heat').addEventListener('click', () => firePut('heat'));
  Lab.$('#fire-reset').addEventListener('click', () => { fire.noFuel = false; fire.lid = false; fire.wet = false; Lab.sound.pop(); fireFoot('<p>Burning again. Try a different way to stop it.</p>'); });

  /* ---------- Story 2: methane, atom by atom ---------- */
  const LENS = { x: 500, y: 190, R: 176 };
  const METH = buildRx(
    [['CH4', 410, 190, 62, 0], ['O2', 588, 122, 52, -0.6], ['O2', 588, 262, 52, 0.6]],
    [['CO2', 500, 96, 58, 0], ['H2O', 412, 262, 54, 0], ['H2O', 588, 262, 54, 0]],
    { x: 500, y: 190, rx: 138, ry: 128 },
  );
  function burnerScene(g, t, o = {}) {
    Art.bunsen(g, 108, 372, 1.34, { air: 1, flame: 0, t });
    const top = 372 - 92 * 1.34;
    flame(g, 108, top + 2, 92, t, { blue: 1, wide: 0.72 });
    g.fillStyle = 'rgba(170,235,255,.85)'; g.beginPath(); g.moveTo(101, top + 2); g.lineTo(108, top - 40); g.lineTo(115, top + 2); g.closePath(); g.fill();
    return { x: 110, y: top - 46, alpha: o.alpha };
  }
  function methStrip(g, W, parts, label) {
    strip(g, 16, 384, W - 32, 56);
    eqRow(g, parts, W / 2 + 50, 412, 34);
    if (label) Art.pill(g, label, 122, 412, { size: 20, color: C.sun, text: '#22123A' });
  }
  function tallyCol(g, a) {
    if (a <= 0) return;
    const prev = g.globalAlpha; g.globalAlpha = prev * a;
    Art.text(g, 'Atoms', 742, 58, { size: 24, color: C.dim });
    [['C', '1', 112], ['H', '4', 186], ['O', '4', 262]].forEach(([sym, n, y]) => {
      Art.atom(g, 714, y, 22, sym);
      Art.text(g, n, 766, y + 1, { font: 'display', size: 40, color: C.sun });
    });
    g.globalAlpha = prev;
  }
  const faceHappy = (i, a) => (a.sym === 'C' || a.sym === 'O' ? 'happy' : null);
  Lab.story('#story-methane', {
    title: 'One molecule of methane burns',
    scenes: [
      {
        say: 'Three views of one event. On the left is <b>what you see</b>, a blue flame. Inside the lens is <b>what the particles do</b>. Below is <b>what chemists write</b>.',
        dur: 3.6,
        draw(g, p, t, { W }) {
          const b = burnerScene(g, t);
          Art.zoom(g, b.x, b.y, LENS.x, LENS.y, LENS.R, (gg, cx, cy, R) => {
            [['CH4', -0.55, -0.45, 30], ['O2', 0.4, -0.6, 36], ['O2', -0.25, 0.1, 36], ['CH4', 0.5, 0.25, 30], ['O2', -0.68, 0.55, 36], ['O2', 0.2, 0.68, 36], ['O2', 0.82, -0.12, 36]].forEach(([f, u, v, s], i) => {
              Art.molecule(gg, cx + u * R + wander(i + 1, t) * 7, cy + v * R + wander(i + 20, t) * 7, s, f, { style: 'fill', atomScale: 1.2, rot: i + Math.sin(t * 0.8 + i) * 0.4, labels: false, face: i === 0 || i === 2 ? 'happy' : null, t });
            });
          }, { p: seg(p, 0.1, 0.5), bg1: '#1E2C5E', bg2: '#0E1230' });
          const a = seg(p, 0.5, 0.75);
          Art.pill(g, 'what you see', 108, 28, { size: 22, color: C.leaf, text: '#07301A', alpha: a });
          Art.pill(g, 'particles', 738, 190, { size: 21, color: C.cyan, text: '#06222B', alpha: a });
          methStrip(g, W, [{ t: 'CH4', alpha: a }, { t: '+', alpha: a }, { t: '2O2', alpha: a }, { t: '->', alpha: a }, { t: 'CO2', alpha: a }, { t: '+', alpha: a }, { t: '2H2O', alpha: a }], a > 0.5 ? 'what chemists write' : null);
        },
      },
      {
        say: 'Meet the reactants: one <b>methane</b>, the fuel, and two <b>oxygen</b> molecules from the air. Count the atoms: 1 carbon, 4 hydrogen, 4 oxygen.',
        dur: 3,
        draw(g, p, t, { W }) {
          const b = burnerScene(g, t);
          Art.zoom(g, b.x, b.y, LENS.x, LENS.y, LENS.R, (gg) => {
            drawRx(gg, METH, 0, t, { face: faceHappy, look: [0.6, 0] });
            const a = seg(p, 0.2, 0.5);
            Art.pill(gg, 'methane', 422, 290, { size: 23, color: C.fire, text: '#22123A', alpha: a });
            Art.pill(gg, 'oxygen', 590, 192, { size: 23, color: C.cyan, text: '#06222B', alpha: a });
          }, { bg1: '#1E2C5E', bg2: '#0E1230' });
          tallyCol(g, seg(p, 0.4, 0.8));
          methStrip(g, W, [{ t: 'CH4', hi: C.fire }, '+', { t: '2O2', hi: C.cyan }, { t: '->', dim: true }, { t: 'CO2', dim: true }, { t: '+', dim: true }, { t: '2H2O', dim: true }]);
        },
      },
      {
        say: 'The flame is hot enough to shake them apart. Bonds break, and for an instant every atom is loose. <b>Breaking bonds costs energy.</b>',
        dur: 3,
        draw(g, p, t, { W }) {
          const q = ease.inOut(seg(p, 0, 0.9)) * 0.5;
          const b = burnerScene(g, t);
          Art.zoom(g, b.x, b.y, LENS.x, LENS.y, LENS.R, (gg) => {
            flash(gg, 500, 190, 210, seg(p, 0.2, 1) * 0.72);
            drawRx(gg, METH, q, t, { face: (i, a) => (a.sym !== 'H' ? 'wow' : null), jig: 1.3 });
          }, { bg1: '#3B2A63', bg2: '#141034' });
          tallyCol(g, 1);
          Art.text(g, 'bonds break', 110, 60, { font: 'display', size: 26, color: C.sun, alpha: seg(p, 0.5, 0.8), halo: true });
          methStrip(g, W, [{ t: 'CH4', dim: true }, { t: '+', dim: true }, { t: '2O2', dim: true }, { t: '->', hi: C.sun }, { t: 'CO2', dim: true }, { t: '+', dim: true }, { t: '2H2O', dim: true }]);
        },
      },
      {
        say: 'Now the atoms grab new partners. Carbon takes two oxygens to make <b>$\\ce{CO2}$</b>. Each remaining oxygen takes two hydrogens to make <b>$\\ce{H2O}$</b>. <b>Making bonds releases energy.</b>',
        dur: 3.4,
        draw(g, p, t, { W }) {
          const q = 0.5 + ease.inOut(seg(p, 0, 0.8)) * 0.5;
          const b = burnerScene(g, t);
          Art.zoom(g, b.x, b.y, LENS.x, LENS.y, LENS.R, (gg) => {
            const e = seg(p, 0.45, 0.75);
            if (e > 0) for (let i = 0; i < 9; i++) photon(gg, 500, 190, (i / 9) * TAU + 0.5, 176, t * 0.45 + i * 0.31, i % 2 ? '#FFE27A' : '#FFA24A');
            drawRx(gg, METH, q, t, { face: (i, a) => (a.sym !== 'H' ? 'grin' : null) });
            const a = seg(p, 0.72, 0.95);
            Art.pill(gg, 'carbon dioxide', 500, 146, { size: 23, color: C.dim, text: '#22123A', alpha: a });
            Art.pill(gg, 'water', 500, 316, { size: 23, color: '#8FD8FF', text: '#06222B', alpha: a });
          }, { bg1: '#1E2C5E', bg2: '#0E1230' });
          tallyCol(g, 1);
          methStrip(g, W, [{ t: 'CH4', dim: true }, { t: '+', dim: true }, { t: '2O2', dim: true }, { t: '->', dim: true }, { t: 'CO2', hi: C.leaf }, '+', { t: '2H2O', hi: C.leaf }]);
        },
      },
      {
        say: 'Count both sides. <b>Same atoms, new partners.</b> Notice oxygen on the right: 2 are in $\\ce{CO2}$ and 2 are in $\\ce{H2O}$. You must add them both.',
        dur: 4,
        draw(g, p, t, { W }) {
          Art.text(g, 'Before', 212, 28, { font: 'display', size: 32, color: C.dim });
          Art.text(g, 'After', 588, 28, { font: 'display', size: 32, color: C.dim });
          Art.molecule(g, 96, 100, 40, 'CH4', { face: 'happy', t });
          Art.molecule(g, 226, 100, 54, 'O2', { face: 'happy', t, rot: -0.2 });
          Art.molecule(g, 326, 100, 54, 'O2', { rot: 0.2, face: 'happy', t });
          Art.molecule(g, 496, 100, 44, 'CO2', { face: 'happy', t });
          Art.molecule(g, 628, 96, 48, 'H2O', { face: 'happy', t });
          Art.molecule(g, 734, 96, 48, 'H2O', { face: 'happy', t });
          Art.arrow(g, 382, 100, 424, 100, { color: C.pink, w: 6 });
          const rows = [['C', 1, 1, 200], ['H', 4, 4, 268], ['O', 4, 4, 336]];
          rows.forEach(([sym, L, R, y], i) => {
            const q = seg(p, 0.1 + i * 0.24, 0.3 + i * 0.24);
            const pr = g.globalAlpha; g.globalAlpha = pr * q;
            beads(g, L, 60, 312, y, sym, { align: 'right', r: 17 });
            Art.text(g, String(L), 344, y, { font: 'display', size: 40, color: C.sun });
            Art.atom(g, 400, y, 25, sym);
            Art.text(g, String(R), 456, y, { font: 'display', size: 40, color: C.sun });
            if (sym === 'O') {
              beads(g, 2, 488, 570, y, sym, { r: 17 });
              beads(g, 2, 600, 682, y, sym, { r: 17 });
              Art.text(g, 'in CO₂', 528, y + 35, { size: 21, color: C.dim });
              Art.text(g, 'in H₂O', 640, y + 35, { size: 21, color: C.dim });
              Art.text(g, '+', 581, y, { font: 'display', size: 28, color: C.dim });
            } else beads(g, R, 488, 740, y, sym, { r: 17 });
            g.globalAlpha = pr;
            Art.popIn(g, 762, y, seg(p, 0.28 + i * 0.24, 0.42 + i * 0.24), (gg) => {
              gg.fillStyle = C.leaf; gg.beginPath(); gg.arc(0, 0, 21, 0, TAU); gg.fill();
              gg.strokeStyle = '#07301A'; gg.lineWidth = 5.5; gg.lineCap = 'round'; gg.lineJoin = 'round';
              gg.beginPath(); gg.moveTo(-9, 1); gg.lineTo(-2, 8); gg.lineTo(10, -7); gg.stroke();
            });
          });
          strip(g, 150, 388, 500, 52);
          eqRow(g, ['CH4', '+', '2O2', '->', 'CO2', '+', '2H2O'], W / 2, 414, 32);
        },
      },
      {
        say: 'Why is this a fire and not just a swap? The new bonds are stronger, so the products sit <b>lower in energy</b>. The difference pours out as heat and light: about <b>890 kJ</b> per mole of methane.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          const x0 = 70, xM = 410, top = 132, bot = 340;
          g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 3; g.lineCap = 'round';
          Art.arrow(g, x0 - 22, 410, x0 - 22, 40, { color: 'rgba(255,255,255,.55)', w: 3.5 });
          Art.text(g, 'energy', x0 + 34, 34, { size: 24, color: C.dim });
          // Reactants ledge, a hill, then the products ledge.
          const q = ease.inOut(seg(p, 0.05, 0.5));
          g.strokeStyle = C.cyan; g.lineWidth = 8;
          g.beginPath(); g.moveTo(x0, top); g.lineTo(x0 + 110, top); g.stroke();
          g.strokeStyle = C.leaf;
          g.globalAlpha *= q; g.beginPath(); g.moveTo(xM - 90, bot); g.lineTo(xM + 40, bot); g.stroke(); g.globalAlpha = 1;
          g.setLineDash([9, 10]); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 4;
          g.beginPath(); g.moveTo(x0 + 110, top); g.bezierCurveTo(x0 + 170, top - 20 - 60, x0 + 200, top - 60, xM - 90, bot); g.stroke(); g.setLineDash([]);
          Art.formula(g, 'CH4 + 2 O2', x0 + 56, top + 38, { size: 28, colorize: true });
          Art.formula(g, 'CO2 + 2 H2O', xM - 26, bot + 40, { size: 28, colorize: true, });
          // Drop arrow.
          const ar = seg(p, 0.4, 0.72);
          Art.arrow(g, xM + 74, top, xM + 74, bot - 6, { color: C.fire, w: 10, p: ar });
          g.setLineDash([6, 8]); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x0 + 110, top); g.lineTo(xM + 90, top); g.stroke(); g.setLineDash([]);
          // Right: the energy that came out.
          const a = seg(p, 0.6, 0.85);
          flame(g, 660, 300, 190 * a + 1, t, { blue: 1, wide: 0.9 });
          if (a > 0) for (let i = 0; i < 8; i++) photon(g, 660, 200, (i / 8) * TAU + 0.2, 100, t * 0.5 + i * 0.29, i % 2 ? '#FFE27A' : '#FF8A2B');
          Art.text(g, '890 kJ', 660, 348, { font: 'display', size: 52, color: C.fire, alpha: a, halo: true });
          Art.text(g, 'per mole of CH₄', 660, 394, { size: 26, alpha: a, halo: true });
          void W; void H;
        },
      },
    ],
  });

  /* ---------- Bench: the reaction scrubber ---------- */
  const SCRUB_FUELS = { CH4: [1, 4, 0], C2H6: [2, 6, 0], C3H8: [3, 8, 0], C2H4: [2, 4, 0], C2H2: [2, 2, 0], CH3OH: [1, 4, 1], C2H5OH: [2, 6, 1] };
  function extent(f) {
    const m = tplOf(f);
    const xs = m.a.map((a) => a[1]), ys = m.a.map((a) => a[2]);
    return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), cx: (Math.max(...xs) + Math.min(...xs)) / 2, cy: (Math.max(...ys) + Math.min(...ys)) / 2 };
  }
  /** Fit groups of molecules into a box, biggest size that fits. Returns the placement list and the label anchors. */
  function layout(groups, x0, y0, x1, y1) {
    for (let s = 44; s >= 12; s--) {
      let y = 0; const rows = []; let fits = true;
      groups.forEach(({ f, n }) => {
        const e = extent(f), mw = e.w * s + s * 1.62, mh = e.h * s + s * 1.62;
        const perRow = Math.max(1, Math.floor((x1 - x0) / mw));
        if (mw > x1 - x0) fits = false;
        for (let i = 0; i < n; i += perRow) {
          const cnt = Math.min(perRow, n - i);
          rows.push({ f, cnt, mw, mh, y, e });
          y += mh;
        }
      });
      if (fits && y <= y1 - y0) {
        const list = [], off = y0 + (y1 - y0 - y) / 2;
        rows.forEach((r) => {
          const start = (x0 + x1) / 2 - ((r.cnt - 1) * r.mw) / 2;
          for (let i = 0; i < r.cnt; i++) list.push([r.f, start + i * r.mw - r.e.cx * s, off + r.y + r.mh / 2 - r.e.cy * s, s, 0]);
        });
        return { list, s };
      }
    }
    throw new Error('Layout did not fit');
  }
  const scrub = { f: 'CH4', q: 0, play: false, rx: null };
  function buildScrub() {
    const [x, y, z] = SCRUB_FUELS[scrub.f];
    const k = Chem.balance(x, y, z);
    const L = layout([{ f: scrub.f, n: k.a }, { f: 'O2', n: k.b }], 16, 74, 384, 372);
    const R = layout([{ f: 'CO2', n: k.c }, { f: 'H2O', n: k.d }], 416, 74, 784, 372);
    scrub.k = k; scrub.counts = { C: k.a * x, H: k.a * y, O: k.a * z + 2 * k.b };
    scrub.rx = buildRx(L.list, R.list, { x: 400, y: 224, rx: 210, ry: 130 });
  }
  buildScrub();
  Lab.stage('#c-scrub', {
    label: 'Fuel and oxygen molecules on the left break into loose atoms and rebuild as carbon dioxide and water on the right as the slider moves.',
    draw(g, t, dt) {
      if (scrub.play) {
        scrub.q = Math.min(1, scrub.q + dt / 3.4);
        const el = Lab.$('#scrub-q'); el.value = Math.round(scrub.q * 100); Lab.paintRange(el);
        Lab.$('#scrub-q-out').textContent = Math.round(scrub.q * 100) + '%';
        if (scrub.q >= 1) scrub.play = false;
      }
      const q = scrub.q;
      const midness = Math.sin(Math.PI * q);
      if (midness > 0.02) {
        Art.glow(g, 400, 224, 300 * midness + 60, '#FF8A2B', 0.42 * midness);
        Art.glow(g, 400, 224, 170 * midness + 20, '#FFE7B0', 0.3 * midness);
      }
      // Labels at rest.
      const aL = 1 - seg(q, 0.02, 0.14), aR = seg(q, 0.86, 0.98);
      Art.text(g, 'reactants', 200, 68, { font: 'display', size: 30, color: C.cyan, alpha: aL });
      Art.text(g, 'products', 600, 68, { font: 'display', size: 30, color: C.leaf, alpha: aR });
      if (aL > 0) Art.arrow(g, 384, 224, 418, 224, { color: C.pink, w: 6, alpha: aL });
      // Faint ghosts show where atoms will end up, or where they came from.
      const ghostEnd = 0.14 * (1 - seg(q, 0.3, 0.8)), ghostStart = 0.14 * seg(q, 0.2, 0.7);
      scrub.rx.atoms.forEach((a) => {
        if (ghostEnd > 0.005) Art.atom(g, a.x1, a.y1, radius(a.sym, a.s1, true), a.sym, { label: false, alpha: ghostEnd });
        if (ghostStart > 0.005) Art.atom(g, a.x0, a.y0, radius(a.sym, a.s0, true), a.sym, { label: false, alpha: ghostStart });
      });
      drawRx(g, scrub.rx, q, t, { fill: true, labels: true, jig: 1.5 });
      // Atom count never changes.
      strip(g, 212, 8, 376, 44);
      const c = scrub.counts;
      [['C', c.C, 276], ['H', c.H, 400], ['O', c.O, 524]].forEach(([sym, n, x]) => {
        Art.atom(g, x - 26, 30, 15, sym);
        Art.text(g, String(n), x + 2, 31, { font: 'display', size: 30, align: 'left', color: C.sun });
      });
      strip(g, 40, 392, 720, 50);
      eqRow(g, eqItems(scrub.f, scrub.k).map((it, i) => ({ t: it, alpha: i < 3 ? 1 - 0.55 * seg(q, 0.4, 0.8) : i > 3 ? 0.45 + 0.55 * seg(q, 0.4, 0.8) : 1 })), 400, 417, 32);
    },
  });
  Lab.segmented('#scrub-fuel', (v) => { scrub.f = v; scrub.play = false; scrub.q = 0; const el = Lab.$('#scrub-q'); el.value = 0; Lab.paintRange(el); Lab.$('#scrub-q-out').textContent = '0%'; buildScrub(); });
  Lab.bind('#scrub-q', '#scrub-q-out', (v) => v + '%', (v) => { scrub.q = v / 100; scrub.play = false; });
  Lab.$('#scrub-play').addEventListener('click', () => { if (scrub.q >= 1) scrub.q = 0; scrub.play = true; Lab.sound.pop(); });

  /* ---------- Bench: the C, H, O balancer ---------- */
  const bal = { fam: 'alkane', n: 2, step: 0, t0: 0, shown: {}, fu: null, plan: [] };
  function buildPlan() {
    const fu = bal.fam === 'sugar' ? Chem.GLUCOSE : Chem.fuel(bal.fam, bal.n);
    const { x, y, z } = fu, k = Chem.balance(x, y, z), o = Chem.o2PerFuel(x, y, z);
    const h2o = y / 2, rightO = 2 * x + h2o, needO = rightO - z;
    const ce = (s) => `$\\ce{${s}}$`;
    const plan = [];
    plan.push({
      key: 'skel', focus: null, coef: { fuel: 1, o2: 1, co2: 1, h2o: 1 }, changed: [],
      text: `<p><b>Skeleton first.</b> ${fu.name[0].toUpperCase() + fu.name.slice(1)} is ${ce(fu.f)}. Products are always ${ce('CO2')} and ${ce('H2O')}. Every coefficient starts at 1, and the counts do not match yet.</p>`,
    });
    plan.push({
      key: 'C', focus: 'C', coef: { fuel: 1, o2: 1, co2: x, h2o: 1 }, changed: x === 1 ? [] : ['co2'],
      text: x === 1 ? `<p><b>Carbon first.</b> 1 C on each side already. Nothing to change.</p>` : `<p><b>Carbon first.</b> The left has ${x} C and each ${ce('CO2')} holds 1, so write <b>${x}</b> in front of ${ce('CO2')}.</p>`,
    });
    plan.push({
      key: 'H', focus: 'H', coef: { fuel: 1, o2: 1, co2: x, h2o }, changed: h2o === 1 ? [] : ['h2o'],
      text: `<p><b>Hydrogen next.</b> The left has ${y} H${fu.family === 'alcohol' ? ' (remember the one on the O)' : ''}. Each ${ce('H2O')} holds 2, so $${y} \\div 2 = ${h2o}$. Write <b>${h2o}</b> in front of ${ce('H2O')}.</p>`,
    });
    const fracTex = o.den === 1 ? String(o.num) : `\\tfrac{${o.num}}{${o.den}}`;
    plan.push({
      key: 'O', focus: 'O', coef: { fuel: 1, o2: o.den === 1 ? o.num : { n: o.num, d: o.den }, co2: x, h2o }, changed: ['o2'],
      text: `<p><b>Oxygen last.</b> The right has $${x} \\times 2 + ${h2o} \\times 1 = ${rightO}$ O, adding both products. ${z ? `The fuel already brings ${z}, so ${ce('O2')} must bring $${rightO} - ${z} = ${needO}$. ` : ''}Each ${ce('O2')} holds 2, so $${needO} \\div 2 = ${fracTex}$.</p>`,
    });
    if (k.a !== 1) {
      plan.push({
        key: 'clear', focus: 'all', coef: { fuel: k.a, o2: k.b, co2: k.c, h2o: k.d }, changed: ['fuel', 'o2', 'co2', 'h2o'], times: k.a,
        text: `<p><b>Clear the fraction.</b> You cannot have part of a molecule, so multiply <b>every</b> coefficient by ${k.a}, including the invisible 1 in front of the fuel.</p>`,
      });
    }
    plan.push({
      key: 'done', focus: 'done', coef: { fuel: k.a, o2: k.b, co2: k.c, h2o: k.d }, changed: [],
      text: `<p><b>Balanced.</b> ${Chem.wrapCe(Chem.eqCe(fu, k))}. Count C, H and O: all three match on both sides, so this is your answer.</p>`,
    });
    bal.fu = fu; bal.k = k; bal.plan = plan; bal.step = 0;
    bal.t0 = balStage ? balStage.t : 0;
    paintBal();
  }
  const cval = (c) => (typeof c === 'object' ? c.n / c.d : c);
  function paintBal() {
    const s = bal.plan[bal.step];
    Lab.$('#bal-foot').innerHTML = Lab.texString(s.text);
    Lab.$('#bal-back').disabled = bal.step === 0;
    Lab.$('#bal-next').disabled = bal.step === bal.plan.length - 1;
  }
  function slot(g, x, y, c, o) {
    const w = 60, h = 66, pop = o.pop === undefined ? 1 : o.pop;
    const scale = 1 + Math.sin(pop * Math.PI) * 0.22;
    g.save(); g.translate(x, y); g.scale(scale, scale);
    g.fillStyle = o.hi ? Art.alpha(o.hi, 0.3) : 'rgba(255,255,255,.08)';
    g.strokeStyle = o.hi || 'rgba(255,255,255,.26)'; g.lineWidth = o.hi ? 4 : 2.5;
    Art.round(g, -w / 2, -h / 2, w, h, 14); g.fill(); g.stroke();
    if (typeof c === 'object') {
      Art.text(g, String(c.n), 0, -15, { font: 'display', size: 26, color: C.sun });
      g.strokeStyle = C.sun; g.lineWidth = 3; g.beginPath(); g.moveTo(-17, 0); g.lineTo(17, 0); g.stroke();
      Art.text(g, String(c.d), 0, 16, { font: 'display', size: 26, color: C.sun });
    } else Art.text(g, String(c), 0, 2, { font: 'display', size: c === 1 ? 36 : 42, color: c === 1 ? C.faint : C.sun });
    g.restore();
  }
  const balStage = Lab.stage('#c-balancer', {
    h: 480, label: 'The equation with a coefficient box in front of each substance, and rows of carbon, hydrogen and oxygen atoms counted on each side.',
    draw(g, t, dt) {
      if (!bal.plan.length) return;
      const st = bal.plan[bal.step], fu = bal.fu, co = st.coef, el = t - bal.t0;
      // The equation with its coefficient slots.
      const terms = [{ key: 'fuel', f: fu.f }, { op: '+' }, { key: 'o2', f: 'O2' }, { op: '->' }, { key: 'co2', f: 'CO2' }, { op: '+' }, { key: 'h2o', f: 'H2O' }];
      const size = fu.f.length > 6 ? 34 : 38, slotW = 60, gap = 9;
      const widths = terms.map((T) => (T.op ? (T.op === '->' ? 52 : 28) : slotW + gap + fw(g, T.f, size)));
      const total = widths.reduce((a, b) => a + b, 0) + 10 * 6;
      let x = 400 - total / 2;
      const y = 52;
      terms.forEach((T, i) => {
        if (T.op === '->') Art.arrow(g, x + 2, y, x + widths[i] - 2, y, { color: C.ink, w: 4.5, head: 12 });
        else if (T.op) Art.text(g, '+', x + widths[i] / 2, y, { font: 'display', size: 34, color: C.dim });
        else {
          const changed = st.changed.includes(T.key);
          const pop = changed ? clamp(el * 2.2) : 1;
          slot(g, x + slotW / 2, y, co[T.key], { hi: changed ? C.pink : st.key === 'done' ? C.leaf : null, pop });
          Art.formula(g, T.f, x + slotW + gap, y, { size, align: 'left', colorize: true });
          if (st.times && changed) {
            Art.popIn(g, x + slotW - 4, y - 28, seg(el, 0.1, 0.5), (gg) => Art.pill(gg, '×' + st.times, 0, 0, { size: 20, font: 'display', color: C.pink, text: '#fff', pad: 14 }));
          }
        }
        x += widths[i] + 10;
      });

      // Atom counts for each row, left and right.
      const leftO = cval(co.fuel) * fu.z + 2 * cval(co.o2);
      const rows = [
        { sym: 'C', L: cval(co.fuel) * fu.x, R: cval(co.co2), y: 162 },
        { sym: 'H', L: cval(co.fuel) * fu.y, R: 2 * cval(co.h2o), y: 256 },
        { sym: 'O', L: leftO, R: 2 * cval(co.co2) + cval(co.h2o), y: 350 },
      ];
      Art.text(g, 'Left side', 190, 103, { size: 22, color: C.dim });
      Art.text(g, 'Right side', 610, 103, { size: 22, color: C.dim });
      rows.forEach((r) => {
        const on = st.focus === r.sym || st.focus === 'all' || st.focus === 'done' || st.focus === null;
        const ok = r.L === r.R;
        const prev = g.globalAlpha;
        g.globalAlpha = prev * (on ? 1 : 0.42);
        if (st.focus === r.sym) {
          g.fillStyle = 'rgba(255,79,163,.13)'; Art.round(g, 14, r.y - 42, 772, 90, 20); g.fill();
          g.strokeStyle = 'rgba(255,79,163,.55)'; g.lineWidth = 2.5; g.stroke();
        }
        // Smoothly animated counts.
        const kL = r.sym + 'L', kR = r.sym + 'R';
        bal.shown[kL] = lerp(bal.shown[kL] === undefined ? r.L : bal.shown[kL], r.L, clamp(dt * 6));
        bal.shown[kR] = lerp(bal.shown[kR] === undefined ? r.R : bal.shown[kR], r.R, clamp(dt * 6));
        const nL = Math.round(bal.shown[kL]), nR = Math.round(bal.shown[kR]);
        const oSplit = r.sym === 'O' && st.key !== 'skel';
        if (r.sym === 'O' && fu.z && cval(co.o2) > 0 && oSplit) {
          const fuelO = cval(co.fuel) * fu.z, o2O = Math.max(0, nL - fuelO);
          const split = clamp(22 + (288 * fuelO) / Math.max(nL, 1), 112, 220);
          beads(g, fuelO, 22, split - 8, r.y - 8, 'O', { align: 'right' });
          beads(g, o2O, split + 8, 310, r.y - 8, 'O', { align: 'right' });
          Art.text(g, `${fuelO} in fuel`, (22 + split) / 2 + 12, r.y + 32, { size: 20, color: C.dim, maxW: split - 26 });
          Art.text(g, `${o2O} in O₂`, (split + 310) / 2, r.y + 32, { size: 20, color: C.dim, maxW: 300 - split });
        } else beads(g, nL, 22, 310, r.y, r.sym, { align: 'right' });
        if (oSplit) {
          const fromCO2 = 2 * cval(co.co2), fromH2O = cval(co.h2o);
          const mid = 490 + (290 * fromCO2) / Math.max(1, fromCO2 + fromH2O);
          beads(g, fromCO2, 490, mid - 8, r.y - 8, 'O');
          beads(g, fromH2O, mid + 8, 778, r.y - 8, 'O');
          Art.text(g, `${fromCO2} in CO₂`, (490 + mid) / 2, r.y + 32, { size: 20, color: C.dim, maxW: Math.max(90, mid - 500) });
          Art.text(g, `${fromH2O} in H₂O`, (mid + 778) / 2, r.y + 32, { size: 20, color: C.dim, maxW: Math.max(90, 770 - mid) });
        } else beads(g, nR, 490, 778, r.y, r.sym);
        Art.text(g, String(nL), 346, r.y, { font: 'display', size: 40, color: ok ? C.leaf : C.sun });
        Art.text(g, String(nR), 454, r.y, { font: 'display', size: 40, color: ok ? C.leaf : C.sun });
        Art.atom(g, 400, r.y - 2, 28, r.sym, { glow: st.focus === r.sym ? 1 : 0 });
        g.globalAlpha = prev;
      });
      // Progress pills.
      const pills = bal.plan.map((s) => ({ skel: 'Skeleton', C: 'Carbon', H: 'Hydrogen', O: 'Oxygen', clear: 'Fraction', done: 'Check' }[s.key]));
      g.font = `700 21px ${Art.FONT_BODY}`;
      const widthsP = pills.map((s) => g.measureText(s).width + 26);
      let px = 400 - (widthsP.reduce((a, b) => a + b, 0) + 10 * (pills.length - 1)) / 2;
      pills.forEach((s, i) => {
        const cur = i === bal.step, past = i < bal.step;
        Art.pill(g, s, px, 448, { align: 'left', size: 21, pad: 26, color: cur ? C.pink : past ? '#2E8F6A' : C.plum2, text: '#fff' });
        px += widthsP[i] + 10;
      });
      // A good settle when it is done.
      if (st.key === 'done') {
        rows.forEach((r, i) => Art.burst(g, 400, r.y, clamp((el - i * 0.12) / 1.1), { n: 16, r: 120, seed: i }));
      }
    },
  });
  Lab.segmented('#bal-fam', (v) => {
    bal.fam = v;
    const n = Lab.$('#bal-n');
    n.disabled = v === 'sugar';
    n.min = v === 'alkene' || v === 'alkyne' ? 2 : 1;
    if (+n.value < +n.min) n.value = n.min;
    bal.n = +n.value;
    Lab.$('#bal-n-out').textContent = v === 'sugar' ? '6' : n.value;
    Lab.paintRange(n);
    buildPlan();
  });
  Lab.bind('#bal-n', '#bal-n-out', (v) => v, (v) => { bal.n = v; buildPlan(); });
  Lab.$('#bal-next').addEventListener('click', () => {
    if (bal.step < bal.plan.length - 1) {
      bal.step++; bal.t0 = balStage.t; paintBal(); Lab.sound.pop();
      if (bal.plan[bal.step].key === 'done') Lab.sound.good();
    }
  });
  Lab.$('#bal-back').addEventListener('click', () => { if (bal.step > 0) { bal.step--; bal.t0 = balStage.t; paintBal(); } });
  buildPlan();

  /* ---------- Story 3: half a molecule ---------- */
  function pairRow(g, n, cx, y, r, o = {}) {
    // Draw n oxygen atoms as pairs of O2, a lonely odd one last.
    const pairs = Math.floor(n / 2), odd = n % 2;
    const pw = r * 2.5 + r * 1.3, total = pairs * pw + (odd ? r * 4 : 0);
    const q = o.q === undefined ? 1 : o.q;
    let x = cx - total / 2 + r * 1.25;
    for (let i = 0; i < pairs; i++) {
      const gapx = lerp(r * 2.4, r * 1.62, q);
      Art.atom(g, x - gapx / 2, y, r, 'O', { face: q > 0.7 ? 'happy' : null, t: o.t, seed: i, label: false });
      Art.atom(g, x + gapx / 2, y, r, 'O', { face: q > 0.7 ? 'happy' : null, t: o.t, seed: i + 5, label: false });
      x += pw;
    }
    if (odd) {
      Art.atom(g, x + r * 0.6, y, r, 'O', { face: q > 0.7 ? 'sad' : null, t: o.t, seed: 3, label: false });
      return { oddX: x + r * 0.6 };
    }
    return {};
  }
  Lab.story('#story-half', {
    title: 'The trouble with half a molecule',
    scenes: [
      {
        say: 'Take <b>ethane</b>, $\\ce{C2H6}$. Carbon and hydrogen go first: 2 C means 2 $\\ce{CO2}$, and 6 H means 3 $\\ce{H2O}$. Now count the oxygen on the right.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          eqRow(g, ['C2H6', '+', { t: '? O2', hi: C.pink }, '->', { t: '2CO2', hi: C.sun }, '+', { t: '3H2O', hi: C.sun }], W / 2, 50, 40);
          const a = seg(p, 0.05, 0.35);
          const pr = g.globalAlpha; g.globalAlpha = pr * a;
          Art.molecule(g, 112, 166, 46, 'CO2', { face: 'happy', t });
          Art.molecule(g, 300, 166, 46, 'CO2', { face: 'happy', t });
          Art.molecule(g, 462, 160, 52, 'H2O', { face: 'happy', t });
          Art.molecule(g, 586, 160, 52, 'H2O', { face: 'happy', t });
          Art.molecule(g, 710, 160, 52, 'H2O', { face: 'happy', t });
          g.globalAlpha = pr;
          const b = ease.back(seg(p, 0.45, 0.8));
          if (b > 0) {
            [0, 1, 2, 3].forEach((i) => Art.atom(g, 210 + i * 70, 300, 30 * b, 'O', { label: false, face: 'happy', t, seed: i }));
            [0, 1, 2].forEach((i) => Art.atom(g, 540 + i * 70, 300, 30 * b, 'O', { label: false, face: 'happy', t, seed: i + 4 }));
          }
          const c = seg(p, 0.65, 0.9);
          Art.text(g, '4 in CO₂', 315, 354, { size: 26, alpha: c });
          Art.text(g, '3 in H₂O', 610, 354, { size: 26, alpha: c });
          Art.text(g, '+', 480, 300, { font: 'display', size: 40, alpha: c, color: C.dim });
          strip(g, 244, 382, 312, 54);
          Art.text(g, '4 + 3 = 7 O atoms', W / 2, 409, { font: 'display', size: 32, color: C.sun, alpha: c });
        },
      },
      {
        say: 'Oxygen only arrives in pairs, as $\\ce{O2}$. Pair up 7 atoms and you get 3 pairs with <b>one left over</b>. So the coefficient is $\\tfrac{7}{2}$, or 3 and a half.',
        dur: 3.6,
        draw(g, p, t, { W }) {
          eqRow(g, ['C2H6', '+', { t: '7/2O2', hi: C.pink }, '->', '2CO2', '+', '3H2O'], W / 2, 50, 40);
          const q = ease.inOut(seg(p, 0.1, 0.55));
          const r = 36, y = 210;
          const res = pairRow(g, 7, 370, y, r, { q, t });
          for (let i = 0; i < 3; i++) {
            const a = seg(p, 0.5 + i * 0.08, 0.66 + i * 0.08);
            const x = 370 - (3 * (r * 3.8) + r * 4) / 2 + r * 1.25 + i * r * 3.8;
            Art.ring(g, x, y, r * 1.85, { color: C.leaf, w: 5, p: a });
            Art.text(g, 'O₂', x, y + 88, { font: 'display', size: 30, color: C.leaf, alpha: a });
          }
          const d = seg(p, 0.72, 0.95);
          if (d > 0) {
            const ox = res.oddX;
            Art.ring(g, ox + r * 0.65, y, r * 1.9, { color: C.red, w: 5, dash: [10, 9], p: d });
            g.save(); g.setLineDash([7, 7]); g.strokeStyle = Art.alpha(C.red, d); g.lineWidth = 3.5;
            g.beginPath(); g.arc(ox + r * 1.62, y, r, 0, TAU); g.stroke(); g.restore();
            Art.text(g, '½ O₂?', ox + 22, y + 88, { font: 'display', size: 30, color: C.red, alpha: d });
          }
          strip(g, 70, 342, 660, 88);
          Art.text(g, 'Half a molecule does not exist.', W / 2, 368, { size: 28, alpha: d });
          Art.text(g, 'Fine in the middle of the work, not as an answer.', W / 2, 404, { size: 24, color: C.dim, alpha: d });
        },
      },
      {
        say: 'The fix: <b>multiply every coefficient by 2</b>. Fuel, oxygen, carbon dioxide and water all double, so the balance stays exactly right.',
        dur: 3.6,
        draw(g, p, t, { W }) {
          const q = seg(p, 0.1, 0.6);
          const swap = q > 0.5;
          const it = swap
            ? [{ t: '2C2H6', hi: C.leaf }, '+', { t: '7O2', hi: C.leaf }, '->', { t: '4CO2', hi: C.leaf }, '+', { t: '6H2O', hi: C.leaf }]
            : ['C2H6', '+', '7/2O2', '->', '2CO2', '+', '3H2O'];
          eqRow(g, it, W / 2, 56, 40);
          [150, 310, 500, 650].forEach((x, i) => {
            Art.popIn(g, x, 118, seg(p, 0.02 + i * 0.06, 0.2 + i * 0.06) * (1 - seg(p, 0.55, 0.75) * 0.2), (gg) => {
              gg.fillStyle = C.pink; Art.round(gg, -38, -23, 76, 46, 18); gg.fill();
              Art.text(gg, '× 2', 0, 1, { font: 'display', size: 30, color: '#fff' });
            });
          });
          const b = ease.inOut(seg(p, 0.45, 0.85));
          const r = 22;
          for (let i = 0; i < 14; i++) {
            const pair = Math.floor(i / 2), side = i % 2 ? 1 : -1;
            const x = 400 + (pair - 3) * 96 + side * lerp(38, 19, b), y = 268;
            Art.atom(g, x, y, r * ease.back(seg(p, 0.1 + i * 0.015, 0.3 + i * 0.015)), 'O', { label: false, face: 'happy', t, seed: i });
          }
          for (let i = 0; i < 7; i++) {
            const x = 400 + (i - 3) * 96;
            Art.ring(g, x, 268, 46, { color: C.leaf, w: 4.5, p: seg(p, 0.62 + i * 0.03, 0.8 + i * 0.03) });
            Art.text(g, 'O₂', x, 332, { font: 'display', size: 26, color: C.leaf, alpha: seg(p, 0.7, 0.9) });
          }
          Art.text(g, '14 oxygen atoms make 7 whole O₂. Nobody is left over.', W / 2, 400, { size: 28, alpha: seg(p, 0.82, 0.98), color: C.sun });
        },
      },
      {
        say: 'Always finish by counting. $\\ce{2C2H6 + 7O2}$ $\\rightarrow$ $\\ce{4CO2 + 6H2O}$. Carbon 4 and 4, hydrogen 12 and 12, oxygen 14 and 14. <b>Balanced, in whole numbers.</b>',
        dur: 3.4,
        draw(g, p, t, { W }) {
          eqRow(g, [{ t: '2C2H6', hi: C.leaf }, '+', { t: '7O2', hi: C.leaf }, '->', { t: '4CO2', hi: C.leaf }, '+', { t: '6H2O', hi: C.leaf }], W / 2, 52, 40);
          [['C', 4, 4, 150], ['H', 12, 12, 244], ['O', 14, 14, 338]].forEach(([sym, L, R, y], i) => {
            const q = seg(p, 0.1 + i * 0.22, 0.3 + i * 0.22);
            const pr = g.globalAlpha; g.globalAlpha = pr * q;
            beads(g, L, 40, 312, y, sym, { align: 'right', r: 14 });
            Art.text(g, String(L), 346, y, { font: 'display', size: 42, color: C.leaf });
            Art.atom(g, 400, y, 28, sym);
            Art.text(g, String(R), 454, y, { font: 'display', size: 42, color: C.leaf });
            beads(g, R, 488, 760, y, sym, { r: 14 });
            g.globalAlpha = pr;
          });
          Art.moe(g, 720, 448, 92, p > 0.8 ? 'cheer' : 'happy', { t });
        },
      },
    ],
  });

  /* ---------- Bench: the alkane ladder ---------- */
  const USES = ['a gas: the main part of natural gas', 'a gas: used to make plastics', 'a gas: grills and heaters', 'a gas: lighters', 'a liquid: in gasoline and foams', 'a liquid: a common solvent', 'a liquid: rated 0 on the octane scale', 'a liquid: a big part of gasoline'];
  const lad = { n: 1, seen: new Set([1]) };
  Lab.stage('#c-ladder', {
    h: 510, label: 'A straight-chain alkane drawn atom by atom, with its name, formula and balanced combustion equation.',
    draw(g, t) {
      const n = lad.n, f = n === 1 ? 'CH4' : `C${n}H${2 * n + 2}`, fu = Chem.fuel('alkane', n), k = Chem.balance(fu.x, fu.y, 0), o = Chem.o2PerFuel(fu.x, fu.y, 0);
      Art.text(g, fu.name, 34, 40, { font: 'display', size: 44, align: 'left', color: C.sun });
      Art.formula(g, f, 766, 40, { size: 44, align: 'right', colorize: true });
      const s = Math.min(68, 660 / (n + 1));
      Art.molecule(g, 400, 150, s, f, { face: 'happy', t, look: [0, 0.5] });
      Art.text(g, USES[n - 1], 400, 258, { size: 24, color: C.dim, maxW: 740 });
      // A rung for each alkane you have visited, colored by whether it needed doubling.
      for (let i = 1; i <= 8; i++) {
        const x = 400 + (i - 4.5) * 58, y = 306, seen = lad.seen.has(i), odd = Chem.o2PerFuel(i, 2 * i + 2, 0).den === 1;
        g.fillStyle = seen ? (odd ? C.leaf : C.pink) : 'rgba(255,255,255,.1)';
        g.beginPath(); g.arc(x, y, 21, 0, TAU); g.fill();
        if (i === n) { g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke(); }
        Art.text(g, String(i), x, y + 1, { font: 'display', size: 25, color: seen ? (odd ? '#07301A' : '#fff') : C.faint });
      }
      Art.text(g, 'whole', 94, 306, { size: 22, color: C.leaf });
      Art.text(g, 'fraction', 706, 306, { size: 22, color: C.pink });
      const whole = o.den === 1;
      const mid = `O₂ for one fuel: (3 × ${n} + 1) ÷ 2 =`;
      g.font = `700 26px ${Art.FONT_BODY}`;
      const w1 = g.measureText(mid).width;
      const x0 = 400 - (w1 + 100) / 2;
      Art.text(g, mid, x0, 362, { size: 26, align: 'left' });
      if (whole) Art.pill(g, String(o.num), x0 + w1 + 46, 362, { size: 28, font: 'display', color: C.leaf, text: '#07301A' });
      else Art.pill(g, `${o.num}/2`, x0 + w1 + 50, 362, { size: 28, font: 'display', color: C.pink, text: '#fff' });
      strip(g, 40, 398, 720, 92);
      eqRow(g, eqItems(f, k), 400, 432, 36);
      Art.text(g, whole ? 'whole numbers straight away' : 'doubled to clear the fraction', 400, 470, { size: 21, color: whole ? C.leaf : C.pink });
    },
  });
  Lab.bind('#lad-n', '#lad-n-out', (v) => `n = ${v}`, (v) => { lad.n = v; lad.seen.add(v); });

  /* ---------- Story 4: ethanol ---------- */
  function ethanol(g, x, y, s, o = {}) { Art.molecule(g, x, y, s, 'C2H5OH', o); }
  Lab.story('#story-ethanol', {
    title: 'Ethanol carries one oxygen on board',
    scenes: [
      {
        say: 'Ethanol, $\\ce{C2H5OH}$, looks like ethane with an O tucked in. Be careful counting: 2 C, <b>6 H</b> (5 plus the one on the O), and <b>1 O</b>.',
        dur: 3.2,
        draw(g, p, t, { W }) {
          const q = ease.back(seg(p, 0, 0.3));
          Art.popIn(g, 330, 200, q, (gg) => ethanol(gg, 0, 0, 88, { labels: true }));
          // The O atom of the template sits at (1.25, 0.25).
          const ox = 330 + 1.25 * 88, oy = 200 + 0.25 * 88;
          Art.ring(g, ox, oy, 54, { color: C.pink, w: 6, p: seg(p, 0.35, 0.6) });
          Art.ring(g, 330 + 2 * 88, 200 - 0.35 * 88, 34, { color: C.sun, w: 5, p: seg(p, 0.55, 0.75) });
          Art.text(g, 'one O, built in', 600, 74, { font: 'display', size: 30, color: C.pink, alpha: seg(p, 0.45, 0.65), halo: true });
          Art.arrow(g, 570, 96, ox + 20, oy - 52, { color: C.pink, w: 5, p: seg(p, 0.45, 0.65) });
          Art.text(g, 'do not miss this H', 640, 300, { size: 25, color: C.sun, alpha: seg(p, 0.65, 0.85), halo: true });
          Art.arrow(g, 640, 280, 330 + 2 * 88 + 14, 200 - 0.35 * 88 + 34, { color: C.sun, w: 4, p: seg(p, 0.65, 0.85) });
          strip(g, 210, 372, 380, 58);
          Art.formula(g, 'C2H5OH', W / 2, 401, { size: 38, colorize: true });
        },
      },
      {
        say: 'Carbon and hydrogen work the same as ever. 2 C makes 2 $\\ce{CO2}$. 6 H makes 3 $\\ce{H2O}$. That puts <b>7 O atoms</b> on the right.',
        dur: 3.2,
        draw(g, p, t, { W }) {
          eqRow(g, ['C2H5OH', '+', { t: '? O2', dim: true }, '->', { t: '2CO2', hi: C.sun }, '+', { t: '3H2O', hi: C.sun }], W / 2, 50, 38);
          for (let i = 0; i < 7; i++) {
            const a = ease.back(seg(p, 0.1 + i * 0.07, 0.28 + i * 0.07));
            const x = 400 + (i - 3) * 94;
            if (a > 0) Art.atom(g, x, 210, 36 * a, 'O', { label: false, face: 'happy', t, seed: i });
          }
          const c = seg(p, 0.65, 0.85);
          Art.text(g, '4 from CO₂', 400 - 2.5 * 94 + 47 - 47, 280, { size: 27, alpha: c });
          Art.text(g, '3 from H₂O', 400 + 2 * 94, 280, { size: 27, alpha: c, color: '#8FD8FF' });
          g.strokeStyle = Art.alpha('#FFFFFF', 0.5 * c); g.lineWidth = 3;
          g.beginPath(); g.moveTo(400 - 3 * 94 - 26, 254); g.lineTo(400 + 0 * 94 + 26, 254); g.stroke();
          g.strokeStyle = Art.alpha('#8FD8FF', 0.7 * c);
          g.beginPath(); g.moveTo(400 + 1 * 94 - 26, 254); g.lineTo(400 + 3 * 94 + 26, 254); g.stroke();
          strip(g, 244, 340, 312, 64);
          Art.text(g, '4 + 3 = 7', W / 2, 372, { font: 'display', size: 40, color: C.sun, alpha: c });
        },
      },
      {
        say: 'Here comes the twist. One of those 7 is <b>already in the fuel</b>. Only 6 must come from $\\ce{O2}$, and 6 O atoms is exactly <b>3 $\\ce{O2}$</b>.',
        dur: 3.8,
        draw(g, p, t, { W }) {
          const q = ease.inOut(seg(p, 0.1, 0.5));
          eqRow(g, ['C2H5OH', '+', { t: p > 0.6 ? '3O2' : '? O2', hi: C.pink }, '->', '2CO2', '+', '3H2O'], W / 2, 50, 38);
          // The first O slides out to the fuel.
          const x0 = 400 + (-3) * 94;
          Art.atom(g, lerp(x0, 112, q), lerp(210, 196, q), 36, 'O', { label: false, face: 'wink', t, seed: 2, glow: q });
          Art.text(g, 'from the fuel', 112, 258, { size: 25, alpha: seg(p, 0.35, 0.55), color: C.pink });
          for (let i = 0; i < 3; i++) {
            const pq = ease.inOut(seg(p, 0.5 + i * 0.05, 0.75 + i * 0.05));
            const cx = 320 + i * 170;
            const u = (k) => cx + k * lerp(66, 28, pq);
            Art.atom(g, u(-1), 200, 36, 'O', { label: false, face: 'happy', t, seed: i });
            Art.atom(g, u(1), 200, 36, 'O', { label: false, face: 'happy', t, seed: i + 7 });
            Art.ring(g, cx, 200, 80, { color: C.leaf, w: 5, p: seg(p, 0.72 + i * 0.05, 0.9 + i * 0.05) });
            Art.text(g, 'O₂', cx, 300, { font: 'display', size: 32, color: C.leaf, alpha: seg(p, 0.78, 0.92) });
          }
          strip(g, 150, 340, 500, 62);
          Art.text(g, '7 − 1 = 6, and 6 ÷ 2 = 3', W / 2, 371, { font: 'display', size: 36, color: C.sun, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: 'Result: $\\ce{C2H5OH + 3O2}$ $\\rightarrow$ $\\ce{2CO2 + 3H2O}$. Ethanol needs less air than ethane does, because it has brought some of its own.',
        dur: 3.2,
        draw(g, p, t, { W }) {
          eqRow(g, [{ t: 'C2H5OH', hi: C.leaf }, '+', { t: '3O2', hi: C.leaf }, '->', { t: '2CO2', hi: C.leaf }, '+', { t: '3H2O', hi: C.leaf }], W / 2, 52, 36);
          const bar = (y, label, val, color, q) => {
            Art.text(g, label, 60, y, { font: 'display', size: 30, align: 'left', alpha: q });
            for (let i = 0; i < Math.ceil(val); i++) {
              const a = ease.back(seg(q, i * 0.1, 0.25 + i * 0.1));
              const whole = i < Math.floor(val);
              if (a <= 0) continue;
              const x = 280 + i * 92;
              if (whole) Art.molecule(g, x, y, 36, 'O2', { rot: 0, style: 'fill', atomScale: 1.05, labels: false, alpha: a });
              else {
                g.save(); g.beginPath(); g.rect(x - 40, y - 40, 40, 80); g.clip();
                Art.molecule(g, x, y, 36, 'O2', { rot: 0, style: 'fill', atomScale: 1.05, labels: false, alpha: a });
                g.restore();
                g.save(); g.setLineDash([6, 6]); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3; g.beginPath(); g.arc(x + 18, y, 26, 0, TAU); g.stroke(); g.restore();
              }
            }
            Art.text(g, String(val) + ' O₂', 710, y, { font: 'display', size: 32, color, alpha: q });
          };
          bar(170, 'Ethane', 3.5, C.sun, seg(p, 0.1, 0.6));
          bar(270, 'Ethanol', 3, C.leaf, seg(p, 0.35, 0.85));
          Art.text(g, 'for one molecule of fuel', 400, 348, { size: 26, color: C.dim, alpha: seg(p, 0.75, 0.95) });
          strip(g, 110, 376, 580, 56);
          Art.text(g, 'Same 2 CO₂ and 3 H₂O from each', W / 2, 404, { size: 28, color: C.ink, alpha: seg(p, 0.8, 1) });
        },
      },
      {
        say: 'Your body does this too. Glucose carries six oxygens: $\\ce{C6H12O6 + 6O2}$ $\\rightarrow$ $\\ce{6CO2 + 6H2O}$. Same products, but your cells run it slowly, in many small steps, so you stay warm rather than on fire.',
        dur: 3.8,
        draw(g, p, t, { W }) {
          eqRow(g, ['C6H12O6', '+', '6O2', '->', '6CO2', '+', '6H2O'], W / 2, 52, 38);
          // Hexagon ring of glucose, simplified.
          const q = ease.back(seg(p, 0.05, 0.4));
          Art.popIn(g, 190, 226, q, (gg) => {
            // Ring: O at the top right, then C1 to C5. Each C1 to C4 has an OH. C5 has a CH2OH. Hydrogens are not drawn.
            const ang = (i) => -Math.PI / 3 + i * (TAU / 6);
            const pts = []; for (let i = 0; i < 6; i++) pts.push([Math.cos(ang(i)) * 74, Math.sin(ang(i)) * 74 + 6]);
            pts.forEach((P, i) => { const Q = pts[(i + 1) % 6]; Art.bond(gg, P[0], P[1], Q[0], Q[1], { width: 7 }); });
            for (let i = 1; i <= 4; i++) {
              const P = pts[i], u = [Math.cos(ang(i)), Math.sin(ang(i))];
              Art.bond(gg, P[0], P[1], P[0] + u[0] * 46, P[1] + u[1] * 46, { width: 5 });
              Art.atom(gg, P[0] + u[0] * 52, P[1] + u[1] * 52, 17, 'O');
            }
            const P5 = pts[5], u5 = [Math.cos(ang(5)), Math.sin(ang(5))];
            const C6 = [P5[0] + u5[0] * 50, P5[1] + u5[1] * 50], O6 = [C6[0] + 42, C6[1] + 26];
            Art.bond(gg, P5[0], P5[1], C6[0], C6[1], { width: 5 }); Art.bond(gg, C6[0], C6[1], O6[0], O6[1], { width: 5 });
            Art.atom(gg, O6[0], O6[1], 17, 'O');
            Art.atom(gg, C6[0], C6[1], 18, 'C');
            pts.forEach((P, i) => { if (i === 0) Art.atom(gg, P[0], P[1], 20, 'O', { face: 'happy', t, label: false }); else Art.atom(gg, P[0], P[1], 20, 'C', { face: null }); });
          });
          Art.text(g, 'six O on board, H not drawn', 190, 408, { size: 22, color: C.pink, alpha: seg(p, 0.35, 0.55), halo: true });
          // A simplified person made of warmth.
          const a = seg(p, 0.45, 0.7);
          Art.glow(g, 590, 210, 190, '#FF8A2B', 0.3 * a);
          const steps = 6;
          for (let i = 0; i < steps; i++) {
            const u = i / (steps - 1);
            const x = 430 + u * 320, y = 300 - u * 180;
            const k = seg(p, 0.45 + i * 0.05, 0.62 + i * 0.05);
            Art.popIn(g, x, y, k, (gg) => {
              gg.fillStyle = Art.mix('#FFD27A', '#FF6A13', u); gg.beginPath(); gg.arc(0, 0, 24, 0, TAU); gg.fill();
              Art.text(gg, String(i + 1), 0, 1, { font: 'display', size: 24, color: '#22123A' });
            });
            if (i < steps - 1) Art.arrow(g, x + 22, y - 12, x + 44, y - 24, { color: C.dim, w: 3.5, p: k });
          }
          Art.text(g, 'many small steps', 620, 344, { font: 'display', size: 28, color: C.sun, alpha: seg(p, 0.75, 0.95), halo: true });
          Art.text(g, 'a slow, controlled burn', 620, 384, { size: 25, alpha: seg(p, 0.8, 1), halo: true });
        },
      },
    ],
  });

  /* ---------- Bench: the Bunsen burner air hole ---------- */
  const bun = { air: 1, soot: 0, co: 0, cleanedOnce: false };
  const BUN_ZONES = [
    { key: 'soot', max: 0.34, items: ['CH4', '+', 'O2', '->', 'C', '+', '2H2O'], flame: 'yellow and lazy', o2: '1', heat: 'about 500 kJ', foot: '<b>Starved of air.</b> Carbon cannot find oxygen, so it clumps into soot. Those hot specks glow yellow, and they will blacken anything you hold in the flame.' },
    { key: 'co', max: 0.67, items: ['2CH4', '+', '3O2', '->', '2CO', '+', '4H2O'], flame: 'wavering', o2: '1.5', heat: 'about 610 kJ', foot: '<b>Short of air.</b> Each carbon gets only one oxygen and stops at <b>carbon monoxide</b>. It is invisible, has no smell, and is poisonous.' },
    { key: 'co2', max: 1.01, items: ['CH4', '+', '2O2', '->', 'CO2', '+', '2H2O'], flame: 'blue and roaring', o2: '2', heat: '890 kJ', foot: '<b>Plenty of air.</b> Every carbon reaches $\\ce{CO2}$. The flame is hot, blue and clean. This is complete combustion.' },
  ];
  const zoneOf = (air) => BUN_ZONES.find((z) => air <= z.max);
  function sootBlob(g, x, y, r, t, i) {
    Art.glow(g, x, y, r * 2.2, '#FFB01F', 0.5);
    [[0, 0], [0.8, 0.2], [-0.5, 0.75], [0.15, -0.8]].forEach(([u, v], k) => Art.atom(g, x + u * r * 0.9, y + v * r * 0.9, r * 0.72, 'C', { label: false }));
    void t; void i;
  }
  Lab.stage('#c-bunsen', {
    h: 480, bg: 'lab', label: 'A Bunsen burner under a beaker, with a magnifier showing molecules going in and out of the flame and the balanced equation below.',
    draw(g, t, dt) {
      const air = bun.air, W = 800, benchY = 410, X = 150;
      const blue = ease.inOut(seg(air, 0.3, 0.72));
      const z = zoneOf(air);
      // Soot builds in a starved flame and burns off in a hot one.
      if (air < 0.34) bun.soot = Math.min(1, bun.soot + dt * 0.22);
      else if (air > 0.67) bun.soot = Math.max(0, bun.soot - dt * 0.16);
      // Ring stand.
      g.fillStyle = '#6E6A86'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      g.fillRect(X + 118, 70, 8, benchY - 70); g.strokeRect(X + 118, 70, 8, benchY - 70);
      Art.round(g, X + 92, benchY - 10, 60, 10, 4); g.fill(); g.stroke();
      g.fillRect(X + 40, 148, 84, 7); g.strokeRect(X + 40, 148, 84, 7);
      // The burner and its flame.
      Art.bunsen(g, X, benchY, 1.5, { air, flame: 0, t });
      const fy = benchY - 92 * 1.5;
      const h = lerp(150, 104, blue);
      flame(g, X, fy + 2, h, t, { blue: 0, wide: 1.05, alpha: 1 - blue });
      flame(g, X, fy + 2, h, t, { blue: 1, wide: 0.68, alpha: blue });
      if (blue > 0.5) {
        g.fillStyle = Art.alpha('#A9EEFF', (blue - 0.5) * 1.8);
        g.beginPath(); g.moveTo(X - 9, fy + 2); g.quadraticCurveTo(X, fy - 62, X + 9, fy + 2); g.closePath(); g.fill();
      }
      // Flying soot sparks in a yellow flame.
      if (blue < 0.6) for (let i = 0; i < 10; i++) {
        const ph = (t * 0.7 + rand(i)) % 1;
        g.fillStyle = Art.alpha('#FFD27A', (1 - ph) * (1 - blue));
        g.beginPath(); g.arc(X + (rand(i + 5) - 0.5) * 36 + Math.sin(ph * 7 + i) * 6, fy - 26 - ph * 100, 2.4, 0, TAU); g.fill();
      }
      // The beaker above the flame collects soot.
      const bb = Art.beaker(g, X, 148, 150, 112, { level: 0.6, ticks: false, inside: (gg, box) => Art.bubbles(gg, box.x0 + 12, box.x1 - 12, box.bottom - 6, box.top + 6, t, { n: 4 + Math.round(blue * 8), r: 3.6 }) });
      if (bun.soot > 0.01) {
        const sg = g.createLinearGradient(0, 148 - 52 * bun.soot, 0, 150);
        sg.addColorStop(0, 'rgba(15,12,20,0)'); sg.addColorStop(0.45, Art.alpha('#14111C', 0.75 * bun.soot)); sg.addColorStop(1, Art.alpha('#050408', 0.98 * Math.min(1, bun.soot * 1.5)));
        g.fillStyle = sg; Art.round(g, bb.x0 + 1, 148 - 52 * bun.soot, 148, 52 * bun.soot + 1, 10); g.fill();
        if (bun.soot > 0.25) Art.text(g, 'soot', X + 112, 118, { size: 26, color: C.ink, halo: true, alpha: seg(bun.soot, 0.25, 0.5) });
      }

      // Particle lens: what goes in, what comes out.
      const lx = 508, ly = 192, R = 170;
      Art.zoom(g, X + 8, fy - 30, lx, ly, R, (gg, cx, cy, RR) => {
        const band = gg.createLinearGradient(0, cy - 34, 0, cy + 34);
        const tint = Art.mix('#FF9E2B', '#4FB4FF', blue);
        band.addColorStop(0, Art.alpha(tint, 0)); band.addColorStop(0.5, Art.alpha(tint, 0.34)); band.addColorStop(1, Art.alpha(tint, 0));
        gg.fillStyle = band; gg.fillRect(cx - RR, cy - 34, RR * 2, 68);
        const fCO2 = seg(air, 0.52, 0.78), fSoot = 1 - seg(air, 0.16, 0.42), fO2in = 0.25 + 0.5 * air;
        for (let i = 0; i < 15; i++) {
          const sp = 0.1 + rand(i + 2) * 0.06, ph = (t * sp + rand(i * 3.1)) % 1;
          const sprd = Math.sqrt(Math.max(0, 1 - Math.pow((ph - 0.5) * 2, 2)));
          const x = cx + (rand(i * 5.3) - 0.5) * RR * 1.8 * sprd + wander(i, t) * 6, y = cy + RR * 0.96 - ph * RR * 1.92;
          if (ph < 0.44) {
            const isO2 = rand(i * 7.7) < fO2in;
            Art.molecule(gg, x, y, isO2 ? 26 : 21, isO2 ? 'O2' : 'CH4', { style: 'fill', atomScale: 1.15, rot: i + t * 0.4, labels: false });
          } else if (ph > 0.56) {
            const carbon = rand(i * 9.1) < 0.56 + fSoot * 0.2;
            if (!carbon) Art.molecule(gg, x, y, 26, 'H2O', { style: 'fill', atomScale: 1.15, rot: i + t * 0.4, labels: false });
            else {
              const u = rand(i * 11.7);
              if (u < fSoot) sootBlob(gg, x, y, 22, t, i);
              else if (u > 1 - fCO2 * (1 - fSoot) && fCO2 > 0) Art.molecule(gg, x, y, 23, 'CO2', { style: 'fill', atomScale: 1.15, rot: i + t * 0.4, labels: false });
              else {
                Art.molecule(gg, x, y, 28, 'CO', { style: 'fill', atomScale: 1.3, rot: i + t * 0.4, labels: false });
                gg.strokeStyle = 'rgba(255,90,107,.85)'; gg.lineWidth = 3; gg.beginPath(); gg.arc(x, y, 30, 0, TAU); gg.stroke();
              }
            }
          }
        }
      }, { rim: Art.mix('#FFB01F', C.cyan, blue), bg1: '#231744', bg2: '#100826' });
      Art.text(g, 'comes out', 736, 60, { size: 22, color: C.dim });
      Art.arrow(g, 736, 170, 736, 84, { color: C.dim, w: 4 });
      Art.text(g, 'goes in', 736, 330, { size: 22, color: C.dim });
      Art.arrow(g, 736, 306, 736, 216, { color: C.dim, w: 4 });
      // What the flame says.
      if (z.key === 'co') Art.pill(g, 'CO: poison gas', lx, ly + R + 2, { size: 23, color: C.red, text: '#fff' });
      else if (z.key === 'soot') Art.pill(g, 'soot: bare carbon', lx, ly + R + 2, { size: 23, color: '#FFB01F', text: '#22123A' });
      else Art.pill(g, 'clean: all CO₂', lx, ly + R + 2, { size: 23, color: C.leaf, text: '#07301A' });
      // The equation on the bench.
      strip(g, 238, benchY - 4, 546, 62, { fill: 'rgba(23,12,41,.9)' });
      eqRow(g, z.items, 511, benchY + 27, 34);
      void W;
    },
  });
  function paintBun() {
    const z = zoneOf(bun.air);
    Lab.$('#bun-o2').textContent = z.o2;
    Lab.$('#bun-heat').textContent = z.heat;
    Lab.$('#bun-foot').innerHTML = Lab.texString(`<p>${z.foot}</p><p>Simplified: real flames make a mix, and the equation shows the main carbon product.</p>`);
  }
  Lab.bind('#bun-air', '#bun-air-out', (v) => (v > 67 ? 'open' : v > 34 ? 'half closed' : 'nearly closed'), (v) => { bun.air = v / 100; paintBun(); });

  /* ---------- Story 5: why CO is dangerous ---------- */
  function rbc(g, x, y, r) {
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.15, x, y, r);
    gr.addColorStop(0, '#E85A5A'); gr.addColorStop(0.68, '#C42C3A'); gr.addColorStop(1, '#7A1626');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * 0.86, 0, 0, TAU); g.fill();
    g.strokeStyle = '#3A0A14'; g.lineWidth = 3.5; g.stroke();
    const dimple = g.createRadialGradient(x, y, r * 0.05, x, y, r * 0.56);
    dimple.addColorStop(0, 'rgba(90,10,26,.5)'); dimple.addColorStop(1, 'rgba(90,10,26,0)');
    g.fillStyle = dimple; g.beginPath(); g.ellipse(x, y, r * 0.56, r * 0.46, 0, 0, TAU); g.fill();
  }
  function seat(g, x, y, r) {
    g.fillStyle = '#3B1A36'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke();
    Art.atom(g, x, y, r * 0.58, 'Fe', { label: 'Fe' });
  }
  const SEATS = [[-112, -86], [112, -86], [-112, 86], [112, 86]];
  const moleC = { x: 320, y: 220, R: 196 };
  Lab.story('#story-co', {
    title: 'Why carbon monoxide is so dangerous',
    scenes: [
      {
        say: 'A heater that runs short of air makes <b>carbon monoxide</b>. You cannot see it, and you cannot smell it. It has no warning at all.',
        speak: 'A heater that runs short of air makes carbon monoxide. You cannot see it, and you cannot smell it. It has no warning at all.',
        dur: 3.2,
        draw(g, p, t, { W, H }) {
          // A room with a heater.
          const w = g.createLinearGradient(0, 0, 0, H); w.addColorStop(0, '#3A2A55'); w.addColorStop(1, '#2C1F45');
          g.fillStyle = w; g.fillRect(0, 0, W, H);
          Art.bench(g, W, H - 60, 60);
          g.fillStyle = '#6E6A86'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          Art.round(g, 60, H - 210, 170, 150, 12); g.fill(); g.stroke();
          g.fillStyle = '#1A0F2E'; Art.round(g, 80, H - 170, 130, 90, 8); g.fill();
          flame(g, 110, H - 84, 66, t, { seed: 1 }); flame(g, 145, H - 84, 78, t, { seed: 2 }); flame(g, 180, H - 84, 62, t, { seed: 3 });
          Art.text(g, 'yellow flame', 145, H - 232, { size: 24, color: C.sun });
          // CO drifting: drawn faint because it really is invisible.
          for (let i = 0; i < 9; i++) {
            const ph = (t * 0.07 + rand(i * 2.3)) % 1;
            const x = 262 + ph * 300, y = 60 + rand(i * 7.1) * 290 + Math.sin(t * 0.8 + i) * 12;
            Art.molecule(g, x, y, 36, 'CO', { style: 'fill', atomScale: 1.3, labels: false, rot: i + t * 0.3, alpha: seg(p, 0.2, 0.6) * 0.5 });
            g.strokeStyle = Art.alpha(C.red, 0.5 * seg(p, 0.2, 0.6)); g.lineWidth = 2.5; g.setLineDash([5, 6]); g.beginPath(); g.arc(x, y, 34, 0, TAU); g.stroke(); g.setLineDash([]);
          }
          Art.moe(g, 690, H - 58, 158, 'think', { t, flip: true });
          Art.bubble(g, 'Smells fine to me.', 680, H - 226, { w: 220, side: 'down', alpha: seg(p, 0.5, 0.75) });
        },
      },
      {
        say: 'Here is what it attacks. Red blood cells carry oxygen on <b>hemoglobin</b>. Picture seats with iron in them: $\\ce{O2}$ hops on in your lungs and hops off wherever your body needs it.',
        dur: 3.6,
        draw(g, p, t) {
          rbc(g, moleC.x, moleC.y, moleC.R);
          SEATS.forEach(([u, v]) => seat(g, moleC.x + u, moleC.y + v, 32));
          SEATS.forEach(([u, v], i) => {
            const ph = (t * 0.28 + i * 0.25) % 1;
            const hop = Math.abs(Math.sin(ph * Math.PI));
            const dir = u < 0 ? -1 : 1;
            const e = Math.pow(hop, 3);
            Art.molecule(g, moleC.x + u + dir * e * 64, moleC.y + v - 30 - e * 60 * (v < 0 ? 1 : -1.2), 46, 'O2', { face: 'happy', t, seed: i, rot: 0.25 * dir, style: 'fill', atomScale: 0.98 });
          });
          Art.text(g, 'red blood cell', moleC.x, moleC.y + 2, { font: 'display', size: 28, color: '#FFE6E6', halo: true });
          const a = seg(p, 0.3, 0.6);
          Art.text(g, 'easy on, easy off', 660, 70, { font: 'display', size: 32, color: C.cyan, alpha: a });
          const lq = seg(p, 0.4, 0.65), mq = seg(p, 0.55, 0.8);
          strip(g, 556, 112, 212, 92); Art.text(g, 'in your lungs', 662, 138, { size: 22, color: C.dim, alpha: lq }); Art.text(g, 'O₂ hops on', 662, 174, { font: 'display', size: 28, color: C.leaf, alpha: lq });
          strip(g, 556, 222, 212, 92); Art.text(g, 'in your muscles', 662, 248, { size: 22, color: C.dim, alpha: mq }); Art.text(g, 'O₂ hops off', 662, 284, { font: 'display', size: 28, color: C.sun, alpha: mq });
          Art.para(g, 'A simplified model of hemoglobin', 662, 344, 230, { size: 21, align: 'center', color: C.dim, alpha: a });
        },
      },
      {
        say: '$\\ce{CO}$ fits the same seat, but it grips <b>over 200 times</b> more tightly than $\\ce{O2}$. Once it sits down, it is very slow to get up.',
        dur: 3.6,
        draw(g, p, t) {
          rbc(g, moleC.x, moleC.y, moleC.R);
          SEATS.forEach(([u, v]) => seat(g, moleC.x + u, moleC.y + v, 32));
          // O2 on three seats, CO lands on one and locks.
          [1, 2, 3].forEach((i) => { const [u, v] = SEATS[i]; Art.molecule(g, moleC.x + u, moleC.y + v - 30, 46, 'O2', { face: 'happy', t, seed: i, rot: 0.2, style: 'fill', atomScale: 0.98 }); });
          const q = ease.back(seg(p, 0.1, 0.45));
          const [u0, v0] = SEATS[0];
          const lx = lerp(-30, moleC.x + u0, q), ly = lerp(-30, moleC.y + v0 - 28, q);
          Art.glow(g, lx, ly, 60, C.red, 0.5 * seg(p, 0.42, 0.6));
          Art.molecule(g, lx, ly, 46, 'CO', { face: q > 0.9 ? 'grin' : 'happy', t, style: 'fill', atomScale: 1.05, rot: 0.1, labels: false });
          Art.ring(g, moleC.x + u0, moleC.y + v0 - 4, 62, { color: C.red, w: 6, p: seg(p, 0.45, 0.65) });
          // Grip bars.
          const a = seg(p, 0.5, 0.8);
          Art.text(g, 'How tightly it grips', 650, 86, { font: 'display', size: 26, alpha: a });
          Art.text(g, 'O₂', 568, 158, { font: 'display', size: 30, align: 'right', alpha: a, color: '#FF8A94' });
          g.fillStyle = Art.alpha('#FF8A94', a); Art.round(g, 584, 142, 6, 32, 3); g.fill();
          Art.text(g, 'CO', 568, 240, { font: 'display', size: 30, align: 'right', alpha: a, color: C.red });
          const w = 196 * ease.out(seg(p, 0.6, 0.95));
          g.fillStyle = Art.alpha(C.red, a); Art.round(g, 584, 222, Math.max(6, w), 36, 8); g.fill();
          Art.text(g, 'over 200 ×', 682, 292, { font: 'display', size: 34, color: C.red, alpha: seg(p, 0.8, 1) });
        },
      },
      {
        say: 'As seats fill with $\\ce{CO}$, your blood carries less oxygen, even with air all around you. So never run an engine indoors, and keep a <b>CO detector</b> at home.',
        dur: 4,
        draw(g, p, t) {
          rbc(g, moleC.x - 60, moleC.y, moleC.R * 0.92);
          const X = moleC.x - 60;
          SEATS.forEach(([u, v]) => seat(g, X + u * 0.92, moleC.y + v * 0.92, 30));
          SEATS.forEach(([u, v], i) => {
            const taken = i < 3 ? seg(p, 0.1 + i * 0.16, 0.26 + i * 0.16) : 0;
            const x = X + u * 0.92, y = moleC.y + v * 0.92 - 28;
            if (taken > 0) Art.molecule(g, x, y, 42, 'CO', { face: 'grin', t, style: 'fill', atomScale: 1.05, rot: 0.1, labels: false, alpha: taken });
            else if (i === 3) Art.molecule(g, x, y, 42, 'O2', { face: 'sad', t, style: 'fill', atomScale: 0.98, rot: 0.2 });
          });
          const lost = seg(p, 0.1, 0.6);
          Art.text(g, 'oxygen carried', 620, 62, { size: 24, color: C.dim });
          Art.meter(g, 510, 86, 220, 24, 1 - lost * 0.75, { color: lost > 0.5 ? C.red : C.cyan });
          // A detector on the wall.
          const d = seg(p, 0.55, 0.75);
          Art.popIn(g, 620, 260, d, (gg) => {
            gg.fillStyle = '#F4F0FF'; gg.strokeStyle = '#1A0F2E'; gg.lineWidth = 4;
            Art.round(gg, -86, -66, 172, 132, 26); gg.fill(); gg.stroke();
            const on = Math.sin(t * 7) > 0;
            gg.fillStyle = on ? C.red : '#8A2A36'; gg.beginPath(); gg.arc(-50, -34, 13, 0, TAU); gg.fill();
            if (on) Art.glow(gg, -50, -34, 40, C.red, 0.8);
            Art.text(gg, 'CO', 22, -30, { font: 'display', size: 38, color: '#22123A' });
            for (let i = 0; i < 4; i++) { gg.fillStyle = '#9A94B3'; Art.round(gg, -62, 2 + i * 12, 124, 6, 3); gg.fill(); }
          });
          if (d > 0.5) for (let i = 0; i < 3; i++) {
            const ph = (t * 0.9 + i / 3) % 1;
            g.strokeStyle = Art.alpha(C.red, 1 - ph); g.lineWidth = 4;
            g.beginPath(); g.arc(620, 260, 100 + ph * 46, -0.8, 0.8); g.stroke();
            g.beginPath(); g.arc(620, 260, 100 + ph * 46, Math.PI - 0.8, Math.PI + 0.8); g.stroke();
          }
        },
      },
    ],
  });

  /* ---------- Bench: four things that burn ---------- */
  const EL_SCENES = {
    H: {
      name: 'hydrogen', items: ['2H2', '+', 'O2', '->', '2H2O'],
      rx: buildRx([['H2', 410, 122, 66, 0.25], ['H2', 410, 280, 66, -0.25], ['O2', 610, 200, 66, 1.3]], [['H2O', 430, 196, 62, 0], ['H2O', 588, 196, 62, 0]], { x: 508, y: 200, rx: 90, ry: 90 }),
      foot: 'Hydrogen burns with a pale flame that is hard to see, and its only product is water. Rule: <b>hydrogen makes $\\ce{H2O}$</b>. No carbon in, no $\\ce{CO2}$ out.',
    },
    Mg: {
      name: 'magnesium', items: ['2Mg', '+', 'O2', '->', '2MgO'],
      rx: buildRx([['Mg', 408, 122, 60, 0], ['Mg', 408, 278, 60, 0], ['O2', 610, 200, 66, 1.3]], [['MgO', 508, 112, 62, 0], ['MgO', 508, 288, 62, 0]], { x: 508, y: 200, rx: 90, ry: 90 }),
      foot: 'Magnesium burns with a blinding white light, which is why it is used in fireworks and flares. Never look straight at it. It leaves a white powder, the oxide. Rule: <b>metal + $\\ce{O2}$ gives metal oxide</b>.',
    },
    S: {
      name: 'sulfur', items: ['S', '+', 'O2', '->', 'SO2'],
      rx: buildRx([['S', 410, 200, 72, 0], ['O2', 610, 200, 72, 1.3]], [['SO2', 508, 196, 96, 0]], { x: 508, y: 200, rx: 70, ry: 70 }),
      foot: 'Sulfur melts and burns with a soft blue flame, giving sharp-smelling $\\ce{SO2}$ gas. Coal and oil contain traces of sulfur, and that $\\ce{SO2}$ is a cause of acid rain.',
    },
    C: {
      name: 'charcoal', items: ['C', '+', 'O2', '->', 'CO2'],
      rx: buildRx([['C', 410, 200, 72, 0], ['O2', 610, 200, 72, 1.3]], [['CO2', 508, 200, 82, 0]], { x: 508, y: 200, rx: 70, ry: 70 }),
      foot: 'Charcoal is nearly pure carbon. It glows red rather than making tall flames, and with plenty of air it gives $\\ce{CO2}$. Short of air it gives $\\ce{CO}$, which is why a charcoal grill must never be used indoors.',
    },
  };
  const elem = { k: 'H', t0: 0 };
  function macro(g, k, t, blinkT) {
    const x = 150, base = 386;
    if (k === 'H') {
      // A gas jet with a barely visible pale flame.
      g.fillStyle = '#9A94B3'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      Art.round(g, x - 12, base - 150, 24, 150, 5); g.fill(); g.stroke();
      Art.round(g, x - 44, base - 14, 88, 14, 6); g.fill(); g.stroke();
      flame(g, x, base - 150, 140, t, { blue: 1, wide: 0.7, alpha: 0.42 });
      Art.text(g, 'pale, almost invisible', x, 68, { size: 24, color: '#BFE4FF', maxW: 260 });
    } else if (k === 'Mg') {
      // Tongs holding a burning ribbon.
      g.strokeStyle = '#9A94B3'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x + 124, base); g.lineTo(x + 8, base - 118); g.stroke();
      g.beginPath(); g.moveTo(x + 140, base - 8); g.lineTo(x + 18, base - 110); g.stroke();
      g.strokeStyle = '#E8E6F2'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(x + 12, base - 114); g.lineTo(x - 46, base - 176); g.stroke();
      const pulse = 0.86 + Math.sin(t * 40) * 0.08 + Math.sin(t * 23) * 0.06;
      const fx = x - 46, fy = base - 176;
      Art.glow(g, fx, fy, 210 * pulse, '#FFFFFF', 0.7);
      Art.glow(g, fx, fy, 96 * pulse, '#FFFFFF', 1);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(fx, fy, 24 * pulse, 0, TAU); g.fill();
      // White ash falling.
      for (let i = 0; i < 12; i++) {
        const ph = (t * 0.5 + rand(i * 3)) % 1;
        g.fillStyle = Art.alpha('#FFFFFF', 0.85 * (1 - ph * 0.5));
        g.fillRect(fx + (rand(i * 7) - 0.5) * 60 + Math.sin(ph * 5 + i) * 6, fy + 20 + ph * (base - fy - 20), 3.4, 3.4);
      }
      Art.text(g, 'blinding white', x + 20, 66, { size: 24, color: '#fff' });
      void blinkT;
    } else if (k === 'S') {
      // Deflagrating spoon with sulfur and a low blue flame.
      g.strokeStyle = '#9A94B3'; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x + 120, base - 8); g.lineTo(x + 22, base - 100); g.stroke();
      g.fillStyle = '#9A94B3'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(x, base - 104, 42, 16, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#FFD23F'; g.beginPath(); g.ellipse(x, base - 108, 32, 9, 0, 0, TAU); g.fill();
      flame(g, x, base - 110, 104, t, { blue: 1, wide: 1.2, alpha: 0.82 });
      Art.smoke(g, x, base - 210, t, { n: 10, h: 110, r: 12, spread: 34, alpha: 0.2, color: '#EDEAF7' });
      Art.text(g, 'soft blue', x, 68, { size: 24, color: '#8FBBFF' });
    } else {
      // A pile of glowing charcoal.
      Art.glow(g, x, base - 44, 170, '#FF5A1A', 0.5 + Math.sin(t * 3) * 0.08);
      [[-66, -16, 44], [0, -26, 52], [66, -14, 42], [-34, -62, 40], [36, -66, 40], [0, -100, 34]].forEach(([u, v, r], i) => {
        const gl = 0.5 + Math.sin(t * 2.2 + i * 1.7) * 0.25;
        const gr = g.createRadialGradient(x + u, base + v, r * 0.1, x + u, base + v, r);
        gr.addColorStop(0, Art.mix('#FF7A1A', '#FFD27A', gl)); gr.addColorStop(0.55, Art.mix('#7A1E0A', '#FF5A1A', gl)); gr.addColorStop(1, '#1C1214');
        g.fillStyle = gr; g.strokeStyle = '#100820'; g.lineWidth = 3;
        g.beginPath();
        for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU, rr = r * (0.82 + rand(i * 3 + j) * 0.26); const px = x + u + Math.cos(a) * rr, py = base + v + Math.sin(a) * rr * 0.86; if (j) g.lineTo(px, py); else g.moveTo(px, py); }
        g.closePath(); g.fill(); g.stroke();
      });
      flame(g, x - 20, base - 112, 52, t, { seed: 2, alpha: 0.5, blue: 0.3 });
      flame(g, x + 28, base - 100, 44, t, { seed: 4, alpha: 0.5, blue: 0.3 });
      Art.text(g, 'glowing red', x, 68, { size: 24, color: '#FFB48A' });
    }
  }
  const elStage = Lab.stage('#c-elements', {
    h: 480, bg: 'micro', label: 'Burning hydrogen, magnesium, sulfur or charcoal on the left, with atoms combining with oxygen in a lens on the right and the equation below.',
    draw(g, t) {
      const sc = EL_SCENES[elem.k];
      Art.bench(g, 800, 386, 94);
      macro(g, elem.k, t, 0);
      const cyc = ((t - elem.t0) % 4.6) / 4.6;
      const q = ease.inOut(seg(cyc, 0.05, 0.75));
      Art.zoom(g, 170, 220, 508, 200, 176, (gg, cx, cy) => {
        flash(gg, cx, cy, 200, seg(cyc, 0.25, 0.55));
        drawRx(gg, sc.rx, q, t, { face: (i, a) => (a.sym !== 'H' ? (q < 0.2 ? 'happy' : q < 0.7 ? 'wow' : 'grin') : null), jig: 0.7 });
      }, { bg1: '#2A1C52', bg2: '#100826' });
      Art.formula(g, sc.items[4], 738, 200, { size: 36, colorize: true, halo: true });
      Art.text(g, 'oxide', 738, 246, { font: 'display', size: 26, color: C.leaf, halo: true });
      strip(g, 180, 400, 440, 64, { fill: 'rgba(23,12,41,.92)' });
      eqRow(g, sc.items, 400, 432, 38);
    },
  });
  function paintEl() { Lab.$('#el-foot').innerHTML = Lab.texString(`<p>${EL_SCENES[elem.k].foot}</p>`); }
  Lab.segmented('#el-pick', (v) => { elem.k = v; elem.t0 = elStage.t; paintEl(); });
  paintEl();

  /* ---------- Bench: the fuel gallery ---------- */
  // Heats of combustion in kJ per mole, for 25 °C with liquid water as a product. Sources differ by a fraction of a percent.
  const GALLERY = [
    { key: 'H2', name: 'hydrogen', f: 'H2', x: 0, y: 2, z: 0, dH: 286 },
    { key: 'CH4', name: 'methane', f: 'CH4', x: 1, y: 4, z: 0, dH: 890 },
    { key: 'C2H2', name: 'acetylene', f: 'C2H2', x: 2, y: 2, z: 0, dH: 1301 },
    { key: 'C3H8', name: 'propane', f: 'C3H8', x: 3, y: 8, z: 0, dH: 2220 },
    { key: 'C8H18', name: 'octane', f: 'C8H18', x: 8, y: 18, z: 0, dH: 5471 },
    { key: 'CH3OH', name: 'methanol', f: 'CH3OH', x: 1, y: 4, z: 1, dH: 726 },
    { key: 'C2H5OH', name: 'ethanol', f: 'C2H5OH', x: 2, y: 6, z: 1, dH: 1367 },
    { key: 'C6H12O6', name: 'glucose', f: 'C6H12O6', x: 6, y: 12, z: 6, dH: 2803 },
  ];
  const Mco2 = Bank.molarMass('CO2');
  GALLERY.forEach((F) => {
    F.M = Bank.molarMass(F.f);
    F.mol = F.x;
    F.g = (F.x * Mco2) / F.M;
    F.heat = F.dH / F.M;
    F.clean = (F.x * Mco2) / (F.dH / 1000);
    F.y0 = 0;
  });
  const GMODES = {
    mol: { title: 'Moles of CO₂ from 1 mole of fuel', fmt: (v) => String(v), unit: '', get: (F) => F.mol, max: 8.4, note: 'Just count the carbons. Each C makes one $\\ce{CO2}$, so octane looks far worse than methane. But a mole of octane is also a lot more fuel.', color: C.pink },
    g: { title: 'Grams of CO₂ from 1 gram of fuel', fmt: (v) => v.toFixed(2), unit: ' g', get: (F) => F.g, max: 3.6, note: 'Per gram, methane, propane and octane nearly tie at about 3 g of $\\ce{CO2}$: more mass than the fuel itself, thanks to the oxygen picked up from the air. Oxygen-rich fuels like glucose make less, because so much of their mass is oxygen already.', color: C.pink },
    heat: { title: 'Heat from 1 gram of fuel', fmt: (v) => v.toFixed(1), unit: ' kJ', get: (F) => F.heat, max: 150, note: 'Hydrogen is the champion by mass. Oxygen in a fuel lowers the heat per gram: it is already partly burned. That is why ethanol and glucose score low.', color: C.fire },
    clean: { title: 'Grams of CO₂ for 1,000 kJ of heat', fmt: (v) => v.toFixed(0), unit: ' g', get: (F) => F.clean, max: 100, note: 'This is the fair climate question. Hydrogen makes none. Among carbon fuels, methane makes the least $\\ce{CO2}$ for the heat you get, because so much of its energy comes from its hydrogen.', color: C.leaf },
  };
  const gal = { mode: 'mol', sel: 'CH4', first: true };
  const ROW_H = 48, ROW_Y0 = 60;
  function layoutRows() {
    const m = GMODES[gal.mode];
    const sorted = GALLERY.slice().sort((a, b) => m.get(b) - m.get(a));
    sorted.forEach((F, i) => { F.yT = ROW_Y0 + i * ROW_H; if (gal.first) F.y0 = F.yT; F.frac = F.frac === undefined ? 0 : F.frac; });
    gal.first = false;
  }
  layoutRows();
  const galStage = Lab.stage('#c-gallery', {
    h: 470, label: 'Eight fuels ranked by bars that sort themselves when you change the measure.',
    onPointer(e) {
      const hover = GALLERY.find((F) => Math.abs(e.y - (F.y0 + ROW_H / 2)) < ROW_H / 2);
      if (e.type === 'hover') { galStage.canvas.style.cursor = hover ? 'pointer' : 'default'; return; }
      if (e.type === 'down' && hover) { gal.sel = hover.key; paintGal(); Lab.sound.pop(); }
    },
    draw(g, t, dt) {
      const m = GMODES[gal.mode];
      Art.text(g, m.title, 400, 30, { font: 'display', size: 30, color: C.ink });
      GALLERY.forEach((F) => {
        F.y0 = lerp(F.y0, F.yT, clamp(dt * 7));
        const v = m.get(F), tf = clamp(v / m.max);
        F.frac = lerp(F.frac, tf, clamp(dt * 6));
        const sel = gal.sel === F.key, y = F.y0 + ROW_H / 2;
        if (sel) { g.fillStyle = 'rgba(255,255,255,.1)'; Art.round(g, 12, F.y0 + 2, 776, ROW_H - 4, 14); g.fill(); g.strokeStyle = C.sun; g.lineWidth = 2.5; g.stroke(); }
        Art.text(g, F.name, 28, y, { size: 24, align: 'left', color: sel ? C.sun : C.ink });
        Art.formula(g, F.f, 232, y, { size: 24, align: 'center', colorize: true });
        const bx = 300, bw = 400;
        if (gal.mode === 'mol' && v > 0) {
          const shown = Math.round(lerp(0, v, clamp(F.frac / Math.max(0.001, tf))));
          for (let i = 0; i < shown; i++) Art.molecule(g, bx + 26 + i * 50, y, 13.5, 'CO2', { style: 'fill', atomScale: 1.25, labels: false });
        } else if (v > 0) {
          const bw2 = Math.max(10, bw * F.frac);
          const grd = g.createLinearGradient(bx, 0, bx + bw2, 0);
          grd.addColorStop(0, Art.mix(m.color, '#22123A', 0.3)); grd.addColorStop(1, m.color);
          g.fillStyle = grd; Art.round(g, bx, y - 15, bw2, 30, 12); g.fill();
        }
        const label = v === 0 ? 'none' : m.fmt(v) + m.unit;
        const endX = gal.mode === 'mol' ? bx + 26 + v * 50 - 8 : bx + Math.max(10, bw * F.frac) + 10;
        Art.text(g, label, Math.min(endX, 716), y, { font: 'display', size: 26, align: 'left', color: v === 0 ? C.leaf : C.sun });
      });
    },
  });
  function paintGal() {
    const m = GMODES[gal.mode], F = GALLERY.find((X) => X.key === gal.sel);
    let eq;
    if (F.key === 'H2') eq = '$\\ce{2H2 + O2}$ $\\rightarrow$ $\\ce{2H2O}$';
    else { const k = Chem.balance(F.x, F.y, F.z); eq = Chem.wrapCe(Chem.eqCe(F, k)); }
    Lab.$('#gal-foot').innerHTML = Lab.texString(`<p>${m.note}</p><p><b>${F.name[0].toUpperCase() + F.name.slice(1)}:</b> ${eq}, releasing ${F.dH.toLocaleString('en-US')} kJ per mole.</p><p>Heats are for 25 °C with liquid water as a product. Sources differ slightly.</p>`);
  }
  Lab.segmented('#gal-mode', (v) => { gal.mode = v; layoutRows(); paintGal(); });
  paintGal();

  /* ---------- Bench: follow the grams ---------- */
  const massB = { f: 'CH4', g: 60, ease: { fuel: 0, o2: 0, co2: 0, h2o: 0 } };
  const MASS_F = { CH4: [1, 4, 0, 'methane', 'CH4'], C3H8: [3, 8, 0, 'propane', 'C3H8'], C8H18: [8, 18, 0, 'octane', 'C8H18'], C2H5OH: [2, 6, 1, 'ethanol', 'C2H6O'] };
  function massData() {
    const [x, y, z, , flat] = MASS_F[massB.f], k = Chem.balance(x, y, z), M = Bank.molarMass(flat);
    const mol = massB.g / M;
    return { k, mol, fuel: massB.g, o2: (mol * k.b / k.a) * Bank.molarMass('O2'), co2: (mol * k.c / k.a) * Mco2, h2o: (mol * k.d / k.a) * Bank.molarMass('H2O') };
  }
  Lab.stage('#c-mass', {
    label: 'Two stacked towers of mass, fuel plus oxygen on the left and carbon dioxide plus water on the right, always the same height.',
    draw(g, t, dt) {
      const d = massData(), E = massB.ease;
      ['fuel', 'o2', 'co2', 'h2o'].forEach((key) => { E[key] = lerp(E[key], d[key], clamp(dt * 6)); });
      const scale = 296 / 500, base = 404;
      const stackL = [['fuel', E.fuel, C.fire], ['o2', E.o2, '#FF6B78']];
      const stackR = [['co2', E.co2, '#8E99AE'], ['h2o', E.h2o, C.water]];
      const NAMES = { fuel: MASS_F[massB.f][3], o2: 'oxygen', co2: 'carbon dioxide', h2o: 'water' };
      const tower = (x, stack, labelX, align) => {
        let y = base;
        const w = 138;
        stack.forEach(([key, val, color], i) => {
          const h = val * scale;
          const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
          gr.addColorStop(0, Art.mix(color, '#ffffff', 0.25)); gr.addColorStop(1, Art.mix(color, '#12062A', 0.2));
          g.fillStyle = gr; Art.round(g, x - w / 2, y - h, w, h, 5); g.fill();
          g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.stroke();
          const ly = lerp(i === 0 ? base - 40 : 110, y - h / 2, 0.5);
          g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2;
          const ex = align === 'right' ? x - w / 2 : x + w / 2;
          g.beginPath(); g.moveTo(ex, y - h / 2); g.lineTo(labelX + (align === 'right' ? 8 : -8), ly); g.stroke();
          Art.text(g, val.toFixed(1) + ' g', labelX, ly - 15, { font: 'display', size: 28, align, color: C.sun });
          Art.text(g, NAMES[key], labelX, ly + 16, { size: 22, align, color: C.ink, maxW: 170 });
          y -= h;
        });
        return y;
      };
      const topL = tower(300, stackL, 190, 'right');
      const topR = tower(500, stackR, 610, 'left');
      g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(200, base, 400, 4);
      // The same total on each side.
      Art.text(g, (E.fuel + E.o2).toFixed(1) + ' g', 300, topL - 24, { font: 'display', size: 30, color: C.leaf, halo: true });
      Art.text(g, (E.co2 + E.h2o).toFixed(1) + ' g', 500, topR - 24, { font: 'display', size: 30, color: C.leaf, halo: true });
      Art.arrow(g, 382, base - 90, 418, base - 90, { color: C.pink, w: 7 });
      flame(g, 400, base - 110, 58, t, { blue: 0.8 });
      Art.text(g, 'total in', 300, base + 26, { size: 24, color: C.dim });
      Art.text(g, 'total out', 500, base + 26, { size: 24, color: C.dim });
      eqRow(g, eqItems(massB.f, d.k), 400, 32, 30);
    },
  });
  function paintMass() {
    const d = massData(), [x, y, z, name] = MASS_F[massB.f], fu = { f: massB.f };
    void x; void y; void z;
    const ratio = d.co2 / d.fuel;
    Lab.$('#mass-foot').innerHTML = Lab.texString(`<p>${Chem.wrapCe(Chem.eqCe(fu, d.k))}. Burning ${massB.g} g of ${name} makes <b>${d.co2.toFixed(1)} g of $\\ce{CO2}$</b>, which is ${ratio.toFixed(2)} times the mass of the fuel. The rest of that mass came from the air.</p>`);
  }
  Lab.segmented('#mass-fuel', (v) => { massB.f = v; paintMass(); });
  Lab.bind('#mass-g', '#mass-g-out', (v) => v + ' g', (v) => { massB.g = v; paintMass(); });

  /* ---------- Bench: the equation writer ---------- */
  const write = { fu: null, parsed: null, tally: { L: { C: 0, H: 0, O: 0 }, R: { C: 0, H: 0, O: 0 } }, shown: {}, status: 'idle', tOk: -9, wins: 0 };
  const WRITE_POOL = [];
  ['alkane', 'alkene', 'alkyne', 'alcohol'].forEach((fam) => { for (let n = fam === 'alkane' || fam === 'alcohol' ? 1 : 2; n <= 6; n++) WRITE_POOL.push(Chem.fuel(fam, n)); });
  const writeIdx = { i: 1 };
  write.fu = WRITE_POOL[1];
  const writeStage = Lab.stage('#c-write', {
    label: 'Your fuel at the top, with the atoms you typed counted on the left and right, and a balance that tips until they match.',
    draw(g, t, dt) {
      const fu = write.fu;
      Art.text(g, 'Burn this completely:', 190, 26, { size: 23, color: C.dim });
      Art.text(g, fu.name, 480, 26, { font: 'display', size: 32, color: C.sun, align: 'center' });
      Art.formula(g, fu.f, 690, 26, { size: 36, colorize: true });
      // A clean preview of what has been typed.
      const e = write.parsed;
      if (e && !e.error) {
        const term = (T) => (T.raw ? T.raw.replace(/\s/g, '') : '') + T.f;
        const items = [];
        e.left.forEach((T, i) => { if (i) items.push('+'); items.push(term(T)); });
        items.push('->');
        e.right.forEach((T, i) => { if (i) items.push('+'); items.push(term(T)); });
        eqRow(g, items, 400, 84, 32);
      } else {
        strip(g, 150, 60, 500, 48);
        Art.text(g, 'Your equation appears here', 400, 84, { size: 22, color: C.faint });
      }
      Art.text(g, 'Left side', 190, 130, { size: 22, color: C.dim });
      Art.text(g, 'Right side', 610, 130, { size: 22, color: C.dim });
      const L = write.tally.L, R = write.tally.R;
      const syms = ['C', 'H', 'O'];
      syms.forEach((sym, i) => {
        const y = 174 + i * 72;
        const lt = L[sym] || 0, rt = R[sym] || 0;
        write.shown[sym + 'L'] = lerp(write.shown[sym + 'L'] || 0, lt, clamp(dt * 9));
        write.shown[sym + 'R'] = lerp(write.shown[sym + 'R'] || 0, rt, clamp(dt * 9));
        const nl = Math.round(write.shown[sym + 'L']), nr = Math.round(write.shown[sym + 'R']);
        const ok = lt === rt && lt > 0;
        if (ok) { g.fillStyle = 'rgba(61,220,132,.12)'; Art.round(g, 12, y - 33, 776, 66, 18); g.fill(); }
        beads(g, Math.min(nl, 60), 22, 312, y, sym, { align: 'right' });
        beads(g, Math.min(nr, 60), 488, 778, y, sym);
        const lTxt = Number.isInteger(lt) ? String(nl) : lt.toFixed(1);
        const rTxt = Number.isInteger(rt) ? String(nr) : rt.toFixed(1);
        Art.text(g, lTxt, 346, y, { font: 'display', size: 38, color: ok ? C.leaf : lt === rt ? C.dim : C.sun });
        Art.text(g, rTxt, 454, y, { font: 'display', size: 38, color: ok ? C.leaf : rt === lt ? C.dim : C.sun });
        Art.atom(g, 400, y, 26, sym);
      });
      // Verdict.
      const since = t - write.tOk;
      if (write.status === 'good') {
        Art.burst(g, 400, 230, clamp(since / 1.2), { n: 22, r: 240 });
        strip(g, 170, 394, 460, 46, { fill: 'rgba(30,110,70,.9)', stroke: C.leaf });
        Art.text(g, 'Balanced. Well done.', 400, 418, { font: 'display', size: 28, color: '#fff' });
      } else {
        strip(g, 96, 394, 608, 46);
        const anyUnmatched = syms.some((s) => (L[s] || 0) !== (R[s] || 0));
        const empty = syms.every((s) => !(L[s] || 0) && !(R[s] || 0));
        Art.text(g, empty ? 'Start typing below' : anyUnmatched ? 'Not matched yet' : 'Atoms match. Now press the check button', 400, 417, { size: 24, color: empty ? C.dim : anyUnmatched ? C.sun : C.leaf });
      }
    },
  });
  function setWriteFuel(fu) {
    write.fu = fu; write.status = 'idle';
    Lab.$('#write-in').value = '';
    updateTally();
    Lab.$('#write-foot').innerHTML = Lab.texString(`<p>Write the balanced equation for the complete combustion of ${fu.name}, $\\ce{${fu.f}}$. Use the smallest whole numbers.</p>`);
  }
  function updateTally() {
    const raw = Lab.$('#write-in').value;
    const e = raw.trim() ? Chem.parseEquation(raw) : { error: 'empty' };
    write.parsed = e;
    // Show what we can, even when only the left side is typed.
    if (!e.error) { write.tally.L = Chem.tally(e.left); write.tally.R = Chem.tally(e.right); }
    else {
      const left = raw.split(/->|→|=+>|=/)[0] || '';
      const lp = Chem.parseEquation(left + ' -> H');
      if (!lp.error) { write.tally.L = Chem.tally(lp.left); write.tally.R = { C: 0, H: 0, O: 0 }; } else { write.tally.L = { C: 0, H: 0, O: 0 }; write.tally.R = { C: 0, H: 0, O: 0 }; }
    }
    write.status = 'idle';
  }
  function checkWrite() {
    const e = write.parsed, fu = write.fu, k = Chem.balance(fu.x, fu.y, fu.z);
    let msg, good = false;
    if (!e || e.error === 'empty') msg = 'Type your equation in the box first.';
    else if (e.error === 'arrow') msg = 'Use an arrow between the two sides, like this: <b>-&gt;</b>';
    else if (e.error) msg = 'I could not read that. Separate terms with + and write coefficients in front, as in <b>2CO2</b>.';
    else {
      const names = (side) => side.map((T) => T.f);
      const sameAtoms = (a, b) => { const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every((K) => a[K] === b[K]); };
      const fuelCounts = { C: fu.x, H: fu.y }; if (fu.z) fuelCounts.O = fu.z;
      const fuelTerm = e.left.find((T) => sameAtoms(T.counts, fuelCounts));
      const o2Term = e.left.find((T) => T.f === 'O2');
      const hasCO2 = names(e.right).includes('CO2'), hasH2O = names(e.right).includes('H2O');
      const L = Chem.tally(e.left), R = Chem.tally(e.right);
      const balanced = ['C', 'H', 'O'].every((s) => (L[s] || 0) === (R[s] || 0));
      if (!fuelTerm) msg = `The left side needs the fuel, $\\ce{${fu.f}}$. Check the subscripts: you cannot change them to make things balance.`;
      else if (!o2Term) msg = 'Trap! Burning needs oxygen. Where is $\\ce{O2}$ on the left?';
      else if (names(e.right).includes('H2')) msg = 'Trap! Hydrogen leaves as water, so write $\\ce{H2O}$, not $\\ce{H2}$.';
      else if (names(e.right).includes('CO') || names(e.right).includes('C')) msg = 'That is <b>incomplete</b> combustion. With plenty of oxygen, carbon goes all the way to $\\ce{CO2}$.';
      else if (!hasCO2 || !hasH2O) msg = 'The products of complete combustion are always $\\ce{CO2}$ and $\\ce{H2O}$. One is missing.';
      else if (e.right.length !== 2 || e.left.length !== 2) msg = 'There should be exactly two things on each side: fuel and $\\ce{O2}$, then $\\ce{CO2}$ and $\\ce{H2O}$.';
      else if (!balanced) {
        const bad = ['C', 'H', 'O'].find((s) => (L[s] || 0) !== (R[s] || 0));
        const nm = { C: 'Carbon', H: 'Hydrogen', O: 'Oxygen' }[bad];
        const extra = bad === 'O' ? ' Remember to add the O in both $\\ce{CO2}$ and $\\ce{H2O}$.' : '';
        const order = bad === 'C' ? 'Fix carbon first.' : bad === 'H' ? 'Carbon is fine, so fix hydrogen next.' : 'C and H are fine, so fix oxygen last.';
        msg = `${nm} does not match: ${L[bad] || 0} on the left and ${R[bad] || 0} on the right. ${order}${extra}`;
      }
      else if (e.left.concat(e.right).some((T) => !Number.isInteger(T.coef))) msg = 'Trap! The atoms match, but there is a fraction left. Multiply every coefficient by 2.';
      else {
        const a = fuelTerm.coef, b = o2Term.coef;
        if (a !== k.a || b !== k.b) msg = `The atoms match, but these are not the smallest whole numbers. Divide everything by ${a / k.a}.`;
        else good = true;
      }
    }
    if (good) {
      write.status = 'good'; write.tOk = writeStage.t; write.wins++;
      Lab.collection.award(1);
      if (write.wins % 3 === 0) Lab.confetti(70);
      Lab.$('#write-foot').innerHTML = Lab.texString(`<p><b>Correct!</b> ${Chem.wrapCe(Chem.eqCe(fu, k))}. That is ${write.wins} solved. Ask for a new fuel and go again.</p>`);
    } else {
      Lab.sound.bad();
      Lab.$('#write-foot').innerHTML = Lab.texString(`<p>${msg}</p>`);
    }
  }
  Lab.$('#write-in').addEventListener('input', updateTally);
  Lab.$('#write-in').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); checkWrite(); } });
  Lab.$('#write-check').addEventListener('click', checkWrite);
  Lab.$('#write-new').addEventListener('click', () => {
    let next = writeIdx.i;
    while (next === writeIdx.i) next = Math.floor(Math.random() * WRITE_POOL.length);
    writeIdx.i = next;
    setWriteFuel(WRITE_POOL[next]);
    Lab.sound.pop();
  });
  setWriteFuel(WRITE_POOL[1]);
});
