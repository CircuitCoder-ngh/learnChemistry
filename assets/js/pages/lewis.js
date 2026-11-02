/* Lesson 8.3: Lewis structures. Every structure comes from LewisKit (bank/lewis.js), which runs the
   recipe in code and verifies the electron count. This file only draws what the kit worked out. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander } = Lab;
  const C = Art.C;
  const K = window.LewisKit;
  const TAU = Math.PI * 2;
  const MINUS = '−';
  const fcText = (f) => (f > 0 ? '+' + f : f < 0 ? MINUS + -f : '0');
  const chargeText = (c) => (Math.abs(c) === 1 ? (c > 0 ? '+' : MINUS) : Math.abs(c) + (c > 0 ? '+' : MINUS));

  /* ---------- Layout ---------- */
  const sizeOf = (el) => (el === 'H' ? 0.74 : EL[el].period >= 4 ? 1.16 : EL[el].period === 3 ? 1.08 : 1);
  /** Fit a molecule into a box. Returns stage positions, atom radius, and bond style. */
  function layoutMol(mol, box, o = {}) {
    const xs = mol.atoms.map((a) => a.x), ys = mol.atoms.map((a) => a.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const m = o.margin || 56;
    const L = Math.min(o.maxL || 132, x1 > x0 ? (box.w - 2 * m) / (x1 - x0) : 999, y1 > y0 ? (box.h - 2 * m) / (y1 - y0) : 999);
    const r = clamp(L * 0.23, o.minR || 21, o.maxR || 30);
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const P = mol.atoms.map((a) => ({ x: cx + (a.x - (x0 + x1) / 2) * L, y: cy + (a.y - (y0 + y1) / 2) * L, r: r * sizeOf(a.el) }));
    return { P, L, r, cx, cy, gap: clamp(r * 0.46, 9, 14), bw: clamp(r * 0.2, 4, 6.4), dot: clamp(r * 0.2, 4.4, 6), box, ext: { x0: cx + (x0 - (x0 + x1) / 2) * L, x1: cx + (x1 - (x0 + x1) / 2) * L, y0: cy + (y0 - (y0 + y1) / 2) * L, y1: cy + (y1 - (y0 + y1) / 2) * L } };
  }
  const bondAngles = (mol, lay, i) => K.neighbors(mol, i).map(({ j }) => Math.atan2(lay.P[j].y - lay.P[i].y, lay.P[j].x - lay.P[i].x)).sort((a, b) => a - b);
  /** Where lone pairs go on an atom: as far from its bonds, and each other, as possible. */
  function lpAngles(mol, lay, i, count) {
    if (count <= 0) return [];
    const set = mol.lpAng && mol.lpAng[i];
    if (set && set.length === count) return set.map((d) => (-d * Math.PI) / 180);
    const nb = bondAngles(mol, lay, i);
    if (!nb.length) return Array.from({ length: count }, (_, k) => (k / count) * TAU - Math.PI / 2);
    if (nb.length === 1) {
      const sets = { 1: [Math.PI], 2: [(2 * Math.PI) / 3, (-2 * Math.PI) / 3], 3: [Math.PI, Math.PI / 2, -Math.PI / 2], 4: [Math.PI, Math.PI / 2, -Math.PI / 2, 0] };
      return sets[Math.min(count, 4)].map((d) => nb[0] + d);
    }
    const gaps = nb.map((a, k) => { const b = nb[(k + 1) % nb.length]; const s = ((b - a + TAU) % TAU) || TAU; return { a, s, n: 0 }; });
    for (let k = 0; k < count; k++) gaps.slice().sort((x, y) => y.s / (y.n + 1) - x.s / (x.n + 1))[0].n++;
    const out = [];
    gaps.forEach((g) => { for (let j = 0; j < g.n; j++) out.push(g.a + (g.s * (j + 1)) / (g.n + 1)); });
    return out;
  }

  /* ---------- Marks ---------- */
  function eDot(g, x, y, r, o = {}) {
    if (o.alpha !== undefined && o.alpha <= 0) return;
    const prev = g.globalAlpha;
    if (o.alpha !== undefined) g.globalAlpha = prev * o.alpha;
    g.fillStyle = Art.alpha(o.color || C.electron, 0.26); g.beginPath(); g.arc(x, y, r * 1.9, 0, TAU); g.fill();
    Art.ball(g, x, y, r, o.color || C.electron);
    g.globalAlpha = prev;
  }
  function pairAt(g, x, y, ang, r0, dr, o = {}) {
    const cx = x + Math.cos(ang) * r0, cy = y + Math.sin(ang) * r0;
    const sep = dr * 1.42, ox = -Math.sin(ang) * sep, oy = Math.cos(ang) * sep;
    eDot(g, cx + ox, cy + oy, dr, o); eDot(g, cx - ox, cy - oy, dr, o);
  }
  /** One line of a bond. off is its sideways offset. */
  function bondLine(g, ax, ay, bx, by, off, w, color, alpha) {
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, nx = (-dy / len) * off, ny = (dx / len) * off;
    const prev = g.globalAlpha;
    g.globalAlpha = prev * alpha;
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(16,6,34,.8)'; g.lineWidth = w + 3;
    g.beginPath(); g.moveTo(ax + nx, ay + ny); g.lineTo(bx + nx, by + ny); g.stroke();
    g.strokeStyle = color; g.lineWidth = w;
    g.beginPath(); g.moveTo(ax + nx, ay + ny); g.lineTo(bx + nx, by + ny); g.stroke();
    g.globalAlpha = prev;
  }
  const OFFS = { 0: [], 1: [0], 2: [-0.5, 0.5], 3: [-1, 0, 1] };
  function bondDraw(g, a, b, was, now, tau, lay, o = {}) {
    const A = OFFS[was], B = OFFS[now], cnt = Math.max(A.length, B.length);
    const q = ease.inOut(tau);
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    const color = o.hi ? C.sun : o.color || '#EDE6FA';
    for (let k = 0; k < cnt; k++) {
      const from = k < A.length ? A[k] : A.length ? A[A.length - 1] : 0;
      const to = k < B.length ? B[k] : 0;
      const alpha = k < A.length && k < B.length ? 1 : k >= A.length ? q : 1 - q;
      const off = lerp(from, to, q) * lay.gap;
      const end = was === 0 ? q : 1;
      if (o.dots) bondLine(g, a.x, a.y, a.x + dx * end, a.y + dy * end, off, Math.max(2, lay.bw * 0.34), o.hi ? C.sun : 'rgba(237,230,250,.34)', alpha);
      else bondLine(g, a.x, a.y, a.x + dx * end, a.y + dy * end, off, lay.bw, color, alpha);
      if (o.dots && q > 0.9) {
        const nx = -uy * off, ny = ux * off, mx = (a.x + b.x) / 2 + nx, my = (a.y + b.y) / 2 + ny, s = lay.dot * 1.5;
        eDot(g, mx - ux * s, my - uy * s, lay.dot, { alpha });
        eDot(g, mx + ux * s, my + uy * s, lay.dot, { alpha });
      }
    }
  }
  /** Square brackets around an ion, with its charge outside. */
  function brackets(g, lay, charge, alpha = 1) {
    if (!charge) return;
    const pad = lay.r + 34;
    const x0 = Math.max(lay.box.x + 6, lay.ext.x0 - pad), x1 = Math.min(lay.box.x + lay.box.w - 36, lay.ext.x1 + pad);
    const y0 = Math.max(lay.box.y + 2, lay.ext.y0 - pad), y1 = Math.min(lay.box.y + lay.box.h - 2, lay.ext.y1 + pad);
    const prev = g.globalAlpha;
    g.globalAlpha = prev * alpha;
    g.strokeStyle = '#EDE6FA'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x0 + 16, y0); g.lineTo(x0, y0); g.lineTo(x0, y1); g.lineTo(x0 + 16, y1); g.stroke();
    g.beginPath(); g.moveTo(x1 - 16, y0); g.lineTo(x1, y0); g.lineTo(x1, y1); g.lineTo(x1 - 16, y1); g.stroke();
    Art.text(g, chargeText(charge), x1 + 8, y0 + 8, { font: 'display', size: 32, align: 'left', color: charge > 0 ? '#FF7AB8' : '#6EC6FF', alpha: 1 });
    g.globalAlpha = prev;
  }
  /** The freest direction around an atom, for a badge or a label. */
  function freeSpot(mol, lay, st, i, dist) {
    const used = bondAngles(mol, lay, i).concat(lpAngles(mol, lay, i, st.lp[i]));
    const cand = [-Math.PI / 4, (-3 * Math.PI) / 4, Math.PI / 4, (3 * Math.PI) / 4, 0, -Math.PI / 2, Math.PI, Math.PI / 2];
    let best = cand[0], bestD = -1;
    cand.forEach((a) => {
      let d = 9;
      used.forEach((u) => { const q = Math.abs(((a - u + Math.PI * 3) % TAU) - Math.PI); d = Math.min(d, q); });
      if (d > bestD + 1e-6) { bestD = d; best = a; }
    });
    const p = lay.P[i];
    return { x: p.x + Math.cos(best) * dist, y: p.y + Math.sin(best) * dist, a: best };
  }
  function fcBadge(g, x, y, f, alpha = 1, o = {}) {
    if (alpha <= 0) return;
    const prev = g.globalAlpha;
    g.globalAlpha = prev * alpha;
    const R = o.r || 16;
    g.fillStyle = f > 0 ? '#E8357F' : f < 0 ? '#1786D8' : '#5B4A80';
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill(); g.stroke();
    Art.text(g, typeof f === 'string' ? f : fcText(f), x, y + 1, { size: o.size || 22, color: '#fff' });
    g.globalAlpha = prev;
  }

  /* ---------- Draw one electron state, optionally animating from a previous state ---------- */
  function drawState(g, mol, lay, st, o = {}) {
    const P = lay.P, prev = o.prev || st, tau = o.tau === undefined ? 1 : o.tau, t = o.t || 0;
    const flights = [];
    const hi = o.hiEdges || [];
    mol.edges.forEach((e, k) => {
      const was = prev.order[k], now = st.order[k];
      if (!was && !now) return;
      bondDraw(g, P[e[0]], P[e[1]], was, now, tau, lay, { hi: hi.includes(k), dots: o.dots });
      if (now > was && o.flyFrom && was === 0) flights.push({ x: (P[e[0]].x + P[e[1]].x) / 2, y: (P[e[0]].y + P[e[1]].y) / 2, ang: Math.atan2(P[e[1]].y - P[e[0]].y, P[e[1]].x - P[e[0]].x) + Math.PI / 2, r0: 0 });
    });
    mol.atoms.forEach((a, i) => {
      const p = P[i], n = K.around(mol, st, i), need = K.target(a.el);
      const useFace = o.faces && (o.faces === true || o.faces.includes(i)) && p.r >= 18;
      let mood = null;
      if (useFace) mood = o.mood ? o.mood(i, n, need) : n >= need ? 'happy' : 'grumpy';
      if (o.glowAtoms && o.glowAtoms.includes(i)) Art.glow(g, p.x, p.y, p.r * 2.1, C.sun, 0.45);
      Art.atom(g, p.x, p.y, p.r, a.el, { face: mood, t, seed: i, look: o.look, alpha: o.dimAtom && o.dimAtom(i) ? 0.35 : undefined });
    });
    if (o.rings) {
      mol.atoms.forEach((a, i) => {
        const p = P[i], n = K.around(mol, st, i), need = K.target(a.el);
        const col = st.rad[i] ? C.violet : n === need ? C.leaf : n < need ? C.red : C.sun;
        Art.ring(g, p.x, p.y, p.r + 5, { color: col, w: 4, p: o.rings === true ? 1 : o.rings });
      });
    }
    // Lone pairs.
    const r0 = (p) => p.r + lay.dot * 2.1;
    mol.atoms.forEach((a, i) => {
      const p = P[i], now = st.lp[i], was = prev.lp[i];
      const nowA = lpAngles(mol, lay, i, now), wasA = lpAngles(mol, lay, i, was);
      for (let j = 0; j < now; j++) {
        if (j < was) {
          let d = ((nowA[j] - wasA[j] + Math.PI * 3) % TAU) - Math.PI;
          pairAt(g, p.x, p.y, wasA[j] + d * ease.inOut(tau), r0(p), lay.dot);
        } else if (o.flyFrom) flights.push({ x: p.x, y: p.y, ang: nowA[j], r0: r0(p) });
        else pairAt(g, p.x, p.y, nowA[j], r0(p), lay.dot, { alpha: ease.out(tau) });
      }
      // Pairs that became part of a bond slide into the bond.
      for (let j = now; j < was; j++) {
        const nbr = K.neighbors(mol, i).find(({ k }) => st.order[k] > prev.order[k]);
        const q = ease.inOut(tau);
        if (nbr && q < 1) {
          const m = P[nbr.j], tx = (p.x + m.x) / 2, ty = (p.y + m.y) / 2;
          const sx = p.x + Math.cos(wasA[j]) * r0(p), sy = p.y + Math.sin(wasA[j]) * r0(p);
          pairAt(g, lerp(sx, tx, q), lerp(sy, ty, q), wasA[j], 0, lay.dot, { alpha: 1 - seg(q, 0.8, 1) });
        }
      }
      // A lonely single electron.
      if (st.rad[i]) {
        const spot = freeSpot(mol, lay, Object.assign({}, st, { lp: st.lp }), i, p.r + lay.dot * 2.1);
        const on = prev.rad[i] ? 1 : ease.out(tau);
        eDot(g, spot.x, spot.y, lay.dot * 1.18, { alpha: on, color: C.sun });
        if (o.t !== undefined) Art.ring(g, spot.x, spot.y, lay.dot * 2.4 + Math.sin(t * 3) * 1.5, { color: C.sun, w: 2 });
      }
    });
    // Electrons flying in from the pile, one pair after another.
    if (o.flyFrom && tau < 1) {
      flights.forEach((f, idx) => {
        const start = (idx / Math.max(1, flights.length)) * 0.62;
        const q = ease.inOut(seg(tau, start, start + 0.38));
        const tx = f.x + Math.cos(f.ang) * f.r0, ty = f.y + Math.sin(f.ang) * f.r0;
        const x = lerp(o.flyFrom.x, tx, q), y = lerp(o.flyFrom.y, ty, q) - Math.sin(q * Math.PI) * 46;
        pairAt(g, x, y, f.ang, 0, lay.dot);
      });
    } else if (o.flyFrom) {
      flights.forEach((f) => { if (f.r0) pairAt(g, f.x, f.y, f.ang, f.r0, lay.dot); });
    }
    if (o.fc) {
      const fcs = K.fcs(mol, st);
      fcs.forEach((f, i) => {
        if (!f && !o.fcZero) return;
        const s = freeSpot(mol, lay, st, i, P[i].r + 13);
        fcBadge(g, s.x, s.y, f, o.fc === true ? 1 : o.fc);
      });
    }
  }
  /** Where the dots of a free atom go, in classic Lewis symbol order: one per side, then pair up. */
  function symbolDots(n, r) {
    const side = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const count = [0, 0, 0, 0];
    for (let k = 0; k < n; k++) count[k % 4]++;
    const out = [];
    const used = [0, 0, 0, 0];
    for (let k = 0; k < n; k++) {
      const s = k % 4, c = count[s], idx = used[s]++;
      const off = c === 1 ? 0 : idx === 0 ? -7.5 : 7.5;
      out.push({ x: side[s][0] * r + (side[s][1] ? off : 0), y: side[s][1] * r + (side[s][0] ? off : 0) });
    }
    return out;
  }
  function drawSymbol(g, x, y, r, el, q, o = {}) {
    const n = K.valence(el), dots = symbolDots(n, r + (o.dotGap || 11));
    Art.atom(g, x, y, r, el, { face: o.face, t: o.t, seed: o.seed, look: o.look });
    dots.forEach((d, k) => {
      const qq = o.dotAlpha !== undefined ? o.dotAlpha : ease.back(seg(q, k / (n + 1), (k + 1.6) / (n + 1)));
      if (qq > 0) eDot(g, x + d.x, y + d.y, o.dotR || 5.2, { alpha: clamp(qq) });
    });
  }

  /* ---------- The electron pile panel ---------- */
  function drawPile(g, box, total, left, o = {}) {
    const { x, y, w, h } = box;
    g.fillStyle = 'rgba(14,6,30,.62)'; Art.round(g, x, y, w, h, 18); g.fill();
    g.strokeStyle = 'rgba(247,242,255,.14)'; g.lineWidth = 2; g.stroke();
    const cx = x + w / 2;
    Art.text(g, 'Electrons left', cx, y + 28, { size: 21, color: C.dim });
    const shown = Math.round(left);
    Art.text(g, String(shown), cx, y + 76, { font: 'display', size: 62, color: shown < 0 ? C.red : shown === 0 ? C.leaf : C.sun });
    Art.text(g, 'of ' + total + ' total', cx, y + 120, { size: 21, color: C.dim });
    const cols = total <= 20 ? 4 : total <= 32 ? 6 : 7, sp = total <= 20 ? 36 : total <= 32 ? 25 : 22, dr = total <= 20 ? 10 : total <= 32 ? 7.5 : 6.5;
    const x0 = cx - ((cols - 1) * sp) / 2, y0 = y + 152;
    for (let i = 0; i < total; i++) {
      const dx = x0 + (i % cols) * sp, dy = y0 + Math.floor(i / cols) * sp;
      if (i < left) Art.ball(g, dx, dy, dr, C.electron);
      else { g.strokeStyle = 'rgba(191,178,218,.32)'; g.lineWidth = 2; g.beginPath(); g.arc(dx, dy, dr - 1.5, 0, TAU); g.stroke(); }
    }
    return { x: cx, y: y0 + 30, gridBottom: y0 + Math.ceil(total / cols) * sp };
  }

  /* ---------- One recipe frame on a stage ---------- */
  const TITLES = { count: 'Count the valence electrons', skeleton: 'Build the skeleton', connect: 'Connect with single bonds', outer: 'Fill the outer atoms', central: 'Leftovers go on the center', promote: 'Short of 8? Share a lone pair', check: 'Check every atom', fc: 'Work out the formal charges', expand: 'Lower the formal charges' };
  const STEP_NO = { count: '1', skeleton: '2', connect: '3', outer: '4', central: '5', promote: '6', check: '7', fc: '7', expand: 'Extra' };
  const PILE = (H) => ({ x: 12, y: 12, w: 176, h: H - 24 });
  /** Row of free atoms for the counting step. */
  function rowLayout(mol, box) {
    const n = mol.atoms.length, per = n > 5 ? Math.ceil(n / 2) : n, rows = Math.ceil(n / per);
    const spX = Math.min(170, box.w / per), spY = 150, r = per <= 3 && rows === 1 ? 44 : per <= 4 ? 32 : 28;
    return mol.atoms.map((a, i) => {
      const rr = Math.floor(i / per), col = i % per;
      const inRow = rr === rows - 1 ? n - per * (rows - 1) : per;
      return { x: box.x + box.w / 2 + (col - (inRow - 1) / 2) * spX, y: box.y + box.h / 2 + (rr - (rows - 1) / 2) * spY + 8, r: r * sizeOf(a.el) };
    });
  }
  function drawFrame(g, mol, idx, tau, stage, o = {}) {
    const fr = mol.frames[idx], prevFr = mol.frames[Math.max(0, idx - 1)];
    const { W, H } = stage;
    const pileBox = PILE(H);
    const box = { x: 198, y: 58, w: W - 206, h: H - 66 };
    const lay = o.lay || layoutMol(mol, box, o.layout);
    const row = rowLayout(mol, box);
    const leftNow = fr.kind === 'count' ? mol.total * ease.inOut(seg(tau, 0.05, 0.95)) : lerp(prevFr.st.left, fr.st.left, ease.inOut(tau));
    const pile = drawPile(g, pileBox, mol.total, leftNow);
    if (o.pips !== false) {
      const cur = fr.kind === 'expand' ? 8 : +STEP_NO[fr.kind];
      for (let k = 1; k <= 7; k++) {
        const x = pileBox.x + pileBox.w / 2 + (k - 4) * 23, y = pileBox.y + pileBox.h - 26;
        g.fillStyle = k === cur ? C.sun : k < cur ? C.leaf : 'rgba(191,178,218,.2)';
        g.beginPath(); g.arc(x, y, 10.5, 0, TAU); g.fill();
        g.font = `700 14px ${Art.FONT_BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = k <= cur ? '#1A0F2E' : C.dim; g.fillText(String(k), x, y + 0.5);
      }
    }
    if (!o.noTitle) Art.pill(g, (o.number !== false ? (fr.kind === 'expand' ? 'Extra: ' : STEP_NO[fr.kind] + '. ') : '') + TITLES[fr.kind], box.x + box.w / 2, 30, { size: 24, color: C.plum2, text: '#fff' });
    const t = o.t || 0;
    const faces = o.faces;
    if (fr.kind === 'count') {
      mol.atoms.forEach((a, i) => {
        const q = seg(tau, i / (mol.atoms.length + 0.5), (i + 1.4) / (mol.atoms.length + 0.5));
        const p = row[i];
        const bigDots = p.r >= 40;
        drawSymbol(g, p.x, p.y, p.r, a.el, q, { face: faces ? 'happy' : null, t, seed: i, dotR: bigDots ? 7 : 5.2, dotGap: bigDots ? 14 : 11 });
        Art.text(g, '+' + K.valence(a.el), p.x, p.y + p.r + (bigDots ? 48 : 40), { font: 'display', size: bigDots ? 38 : 30, color: C.sun, alpha: seg(q, 0.5, 1) });
      });
      if (mol.charge) {
        const extra = mol.charge < 0 ? `+${-mol.charge} for the charge` : `${MINUS}${mol.charge} for the charge`;
        Art.text(g, extra, box.x + box.w / 2, H - 28, { size: 25, color: mol.charge < 0 ? '#6EC6FF' : '#FF7AB8', alpha: seg(tau, 0.8, 1) });
      }
    } else if (fr.kind === 'skeleton') {
      const q = ease.inOut(tau);
      const P = mol.atoms.map((a, i) => ({ x: lerp(row[i].x, lay.P[i].x, q), y: lerp(row[i].y, lay.P[i].y, q), r: lerp(row[i].r, lay.P[i].r, q) }));
      mol.atoms.forEach((a, i) => {
        const p = P[i];
        drawSymbol(g, p.x, p.y, p.r, a.el, 1, { face: faces ? 'happy' : null, t, seed: i, dotAlpha: 1 - seg(tau, 0, 0.5), dotR: p.r >= 40 ? 7 : 5.2, dotGap: p.r >= 40 ? 14 : 11 });
      });
      const cs = mol.centers;
      cs.forEach((i) => {
        Art.ring(g, lay.P[i].x, lay.P[i].y, lay.P[i].r + 7, { color: C.pink, w: 4, p: seg(tau, 0.55, 1) });
      });
      if (cs.length === 1 && mol.atoms.length > 2) {
        const c = cs[0], s = freeSpot(mol, lay, fr.st, c, lay.P[c].r + 44);
        Art.pill(g, 'central', s.x, s.y, { size: 22, color: C.pink, text: '#fff', alpha: seg(tau, 0.65, 1) });
      }
      brackets(g, lay, mol.charge, seg(tau, 0.6, 1));
    } else {
      const isMove = fr.kind === 'promote' || fr.kind === 'expand';
      const fly = fr.kind === 'connect' || fr.kind === 'outer' || fr.kind === 'central';
      brackets(g, lay, mol.charge, 1);
      drawState(g, mol, lay, fr.st, {
        prev: prevFr.st, tau: fr.kind === 'check' || fr.kind === 'fc' ? 1 : tau,
        flyFrom: fly ? pile : null, t, faces, dots: o.dots,
        hiEdges: isMove ? [fr.edge] : [],
        rings: fr.kind === 'check' ? seg(tau, 0, 0.8) : false,
        fc: fr.kind === 'fc' || fr.kind === 'expand' ? (fr.kind === 'fc' ? ease.out(seg(tau, 0.1, 0.8)) : 1) : false,
        fcZero: mol.atoms.length <= 6,
      });
      if (isMove) {
        const from = lay.P[fr.from], to = lay.P[fr.to];
        const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
        const ang = Math.atan2(from.y - to.y, from.x - to.x);
        const nx = -Math.sin(ang), ny = Math.cos(ang);
        const side = ny < 0 || (Math.abs(ny) < 0.01 && nx < 0) ? 1 : -1;
        const sx = from.x + nx * side * (from.r + 30), sy = from.y + ny * side * (from.r + 30);
        Art.arrow(g, sx, sy, mx + nx * side * (lay.gap + 5), my + ny * side * (lay.gap + 5), { color: C.pink, w: 5, p: ease.out(seg(tau, 0, 0.55)), curve: side * 14, alpha: o.keepArrow ? 1 : 1 - seg(tau, 0.82, 1) });
      }
      if (fr.kind === 'check') {
        const rows = mol.centers.length ? mol.centers.slice(0, 2) : [0, 1];
        rows.forEach((i, k) => {
          const n = K.around(mol, fr.st, i);
          const col = fr.st.rad[i] ? C.violet : n === K.target(mol.atoms[i].el) ? C.leaf : n < K.target(mol.atoms[i].el) ? C.red : C.sun;
          Art.text(g, `${mol.atoms[i].el} sees ${n}`, pileBox.x + pileBox.w / 2, pile.gridBottom + 18 + k * 30, { size: 23, color: col, alpha: seg(tau, 0.5, 0.9) });
        });
      }
    }
    return lay;
  }

  /* ---------- Story 1: dots and dashes ---------- */
  const PERIOD2 = ['Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'];
  const GROUPS2 = [1, 2, 13, 14, 15, 16, 17, 18];
  const O_POS = { x: 400, y: 220 };
  Lab.story('#story-dots', {
    title: 'What the dots and dashes mean',
    scenes: [
      {
        say: 'Each dot is one <b>valence electron</b>. The group number tells you how many an atom has.',
        dur: 4.2,
        draw(g, p, t, { W }) {
          Art.text(g, 'Valence electrons in period 2', W / 2, 44, { font: 'display', size: 38 });
          PERIOD2.forEach((el, i) => {
            const x = 134 + i * 88, y = 170;
            const q = seg(p, 0.04 + i * 0.09, 0.14 + i * 0.09);
            if (q <= 0) return;
            g.save(); g.translate(x, y); const s = ease.back(Math.min(1, q * 1.6)); g.scale(s, s); g.translate(-x, -y);
            drawSymbol(g, x, y, 25, el, q, { dotGap: 9, dotR: 4.8 });
            g.restore();
            Art.text(g, String(K.valence(el)), x, 268, { font: 'display', size: 50, color: C.sun, alpha: seg(q, 0.5, 1) });
            Art.text(g, String(GROUPS2[i]), x, 336, { size: 32, color: C.ink, alpha: seg(q, 0.5, 1) });
          });
          Art.text(g, 'dots', 50, 268, { size: 26, color: C.sun, alpha: seg(p, 0.1, 0.2) });
          Art.text(g, 'group', 50, 336, { size: 26, color: C.dim, alpha: seg(p, 0.1, 0.2) });
          g.fillStyle = Art.alpha(C.cyan, 0.14 * seg(p, 0.88, 1)); Art.round(g, 150, 382, 500, 50, 20); g.fill();
          Art.text(g, 'For groups 13 to 18, drop the first digit.', 400, 407, { size: 27, color: C.cyan, alpha: seg(p, 0.88, 1) });
        },
      },
      {
        say: 'Neon has 8 and is perfectly content. Other atoms share electrons until they see 8 too. That is the <b>octet rule</b>. Hydrogen is tiny and only needs 2.',
        dur: 3.6,
        draw(g, p, t) {
          const q1 = ease.back(seg(p, 0, 0.3)), q2 = ease.back(seg(p, 0.2, 0.5)), q3 = ease.back(seg(p, 0.4, 0.7));
          if (q1 > 0) { g.save(); g.translate(140, 170); g.scale(q1, q1); drawSymbol(g, 0, 0, 74, 'Ne', 1, { face: 'grin', t, dotR: 9, dotGap: 18, dotAlpha: 1 }); g.restore(); }
          if (q2 > 0) { g.save(); g.translate(400, 170); g.scale(q2, q2); drawSymbol(g, 0, 0, 74, 'O', 1, { face: 'grumpy', t, dotR: 9, dotGap: 18, dotAlpha: 1, look: [1, 0] }); g.restore(); }
          if (q3 > 0) { g.save(); g.translate(660, 170); g.scale(q3, q3); drawSymbol(g, 0, 0, 56, 'H', 1, { face: 'sad', t, dotR: 9, dotGap: 18, dotAlpha: 1, look: [-1, 0] }); g.restore(); }
          const rows = [[140, 'Neon', 'has 8', 'full', C.leaf, 0.25], [400, 'Oxygen', 'has 6', 'wants 2 more', C.sun, 0.45], [660, 'Hydrogen', 'has 1', 'wants 1 more', C.sun, 0.65]];
          rows.forEach(([x, name, a, b, col, at]) => {
            Art.text(g, name, x, 306, { size: 26, color: C.dim, alpha: seg(p, at, at + 0.15) });
            Art.text(g, a, x, 350, { font: 'display', size: 38, color: C.ink, alpha: seg(p, at, at + 0.15) });
            Art.text(g, b, x, 396, { size: 30, color: col, alpha: seg(p, at, at + 0.15) });
          });
        },
      },
      {
        say: 'Oxygen and two hydrogens solve this by <b>sharing</b>. Each hydrogen brings 1 electron and oxygen matches it with 1 of its own. Each match is a shared pair.',
        dur: 3.8,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.1, 0.8));
          const ox = 400, oy = 230;
          const d = lerp(290, 138, q);
          const hL = { x: ox - d, y: oy + lerp(30, 80, q) }, hR = { x: ox + d, y: oy + lerp(30, 80, q) };
          Art.glow(g, ox, oy, 170, C.cyan, 0.08 + 0.1 * q);
          Art.atom(g, ox, oy, 66, 'O', { face: q > 0.9 ? 'happy' : 'grumpy', t, seed: 1 });
          Art.atom(g, hL.x, hL.y, 44, 'H', { face: q > 0.9 ? 'happy' : 'wow', t, seed: 2, look: [1, -0.2] });
          Art.atom(g, hR.x, hR.y, 44, 'H', { face: q > 0.9 ? 'happy' : 'wow', t, seed: 3, look: [-1, -0.2] });
          // Oxygen's own electrons: two pairs and two unpaired.
          pairAt(g, ox, oy, -Math.PI / 2 - 0.55, 84, 8);
          pairAt(g, ox, oy, -Math.PI / 2 + 0.55, 84, 8);
          // Each shared pair ends up between the atoms.
          [hL, hR].forEach((h, k) => {
            const sgn = k ? 1 : -1;
            const mid = { x: (ox + h.x) / 2, y: (oy + h.y) / 2 };
            const a = Math.atan2(h.y - oy, h.x - ox), nx = -Math.sin(a), ny = Math.cos(a);
            const fromH = { x: h.x - sgn * 58, y: h.y - 8 };
            const fromO = { x: ox + Math.cos(a) * 82, y: oy + Math.sin(a) * 82 };
            eDot(g, lerp(fromH.x, mid.x + nx * 10, q), lerp(fromH.y, mid.y + ny * 10, q), 8);
            eDot(g, lerp(fromO.x, mid.x - nx * 10, q), lerp(fromO.y, mid.y - ny * 10, q), 8);
            if (q > 0.85) Art.ring(g, mid.x, mid.y, 26, { color: C.sun, w: 3.5, dash: [6, 6] });
          });
          Art.text(g, 'shared pair', 136, 112, { size: 32, color: C.sun, alpha: seg(p, 0.8, 0.95) });
          Art.text(g, 'shared pair', 664, 112, { size: 32, color: C.sun, alpha: seg(p, 0.8, 0.95) });
          Art.arrow(g, 170, 140, 304, 256, { color: C.sun, w: 5, p: seg(p, 0.85, 1), curve: 18 });
          Art.arrow(g, 630, 140, 496, 256, { color: C.sun, w: 5, p: seg(p, 0.85, 1), curve: -18 });
        },
      },
      {
        say: 'Chemists draw each shared pair as a dash, called a <b>bonding pair</b>. The pairs that are not shared are <b>lone pairs</b>. Together, this is a Lewis structure.',
        dur: 3.2,
        draw(g, p, t) {
          const mol = K.get('H2O');
          const lay = layoutMol(mol, { x: 150, y: 70, w: 480, h: 330 }, { maxL: 215, maxR: 66, minR: 58, margin: 70 });
          drawState(g, mol, lay, mol.octet, { t, faces: true, tau: 1 });
          const o = lay.P[0];
          Art.text(g, 'lone pairs', 660, 90, { size: 32, color: C.cyan, alpha: seg(p, 0.15, 0.35) });
          Art.arrow(g, 582, 92, o.x + 62, o.y - 92, { color: C.cyan, w: 5, p: seg(p, 0.2, 0.45), curve: 14 });
          const mid = { x: (o.x + lay.P[2].x) / 2, y: (o.y + lay.P[2].y) / 2 };
          Art.text(g, 'bonding pair', 650, 210, { size: 32, color: C.sun, alpha: seg(p, 0.45, 0.65) });
          Art.arrow(g, 620, 232, mid.x + 16, mid.y - 6, { color: C.sun, w: 5, p: seg(p, 0.5, 0.75), curve: -10 });
          Art.formula(g, 'H2O', 92, 56, { size: 52, colorize: true });
          Art.moe(g, 700, 442, 130, 'happy', { t, flip: true });
        },
      },
      {
        say: 'To check an atom, count every electron <b>touching it</b>: its lone pairs plus both electrons in each of its bonds. Oxygen sees 8. Each hydrogen sees 2.',
        dur: 4,
        draw(g, p, t) {
          const mol = K.get('H2O');
          const lay = layoutMol(mol, { x: 20, y: 36, w: 500, h: 340 }, { maxL: 190, maxR: 56, minR: 50, margin: 66 });
          const st = mol.octet;
          const q = seg(p, 0.05, 0.85);
          drawState(g, mol, lay, st, { t, faces: true, tau: 1, dots: true });
          const o = lay.P[0];
          const sweep = q;
          Art.ring(g, o.x, o.y, 104, { color: C.leaf, w: 5, p: sweep, dash: [8, 7] });
          Art.text(g, String(Math.max(1, Math.round(8 * q))), 650, 100, { font: 'display', size: 96, color: q >= 1 ? C.leaf : C.sun });
          Art.text(g, 'around oxygen', 650, 170, { size: 30, color: C.ink });
          lay.P.slice(1).forEach((h) => Art.ring(g, h.x, h.y, 70, { color: C.leaf, w: 4, p: seg(p, 0.7, 1), dash: [7, 6] }));
          Art.text(g, '2', 650, 262, { font: 'display', size: 76, color: C.leaf, alpha: seg(p, 0.7, 0.9) });
          Art.text(g, 'around each hydrogen', 650, 322, { size: 26, color: C.ink, alpha: seg(p, 0.7, 0.9) });
          g.fillStyle = Art.alpha(C.cyan, 0.14 * seg(p, 0.85, 1)); Art.round(g, 150, 388, 500, 48, 20); g.fill();
          Art.text(g, 'Bond electrons count for both atoms.', 400, 412, { size: 27, color: C.cyan, alpha: seg(p, 0.85, 1) });
        },
      },
    ],
  });
  void O_POS;

  /* ---------- Story 2: the recipe on carbon dioxide ---------- */
  const co2 = K.get('CO2');
  const SAY = {
    count: 'Step 1: <b>count</b>. Carbon is in group 14, so 4. Each oxygen is in group 16, so 6. The pile starts with $4 + 6 + 6 = 16$ electrons.',
    skeleton: 'Step 2: <b>skeleton</b>. The least electronegative atom goes in the center. That is carbon.',
    connect: 'Step 3: <b>connect</b>. Draw two single bonds. Each one takes 2 electrons from the pile: $16 - 4 = 12$ left.',
    outer: 'Step 4: <b>outer atoms first</b>. Each oxygen needs 3 lone pairs. That takes 12 electrons. The pile is empty.',
    central: 'Step 5: <b>leftovers on the center</b>. Nothing is left, and carbon only sees 4. It is not happy. You cannot add electrons, since the pile is empty.',
    promote1: 'Step 6: <b>share</b>. Oxygen turns a lone pair into a second bond. The electrons were already counted, so the pile stays at 0. Carbon sees 6.',
    promote2: 'Do the same on the other side. Now carbon sees 8 and $\\ce{O=C=O}$ is complete.',
    check: 'Step 7: <b>check</b>. Each atom sees 8, and the drawing holds $2(4) + 2(4) = 16$ electrons, matching the count.',
    fc: 'Finally, the formal charges are all <b>0</b>, as good as it gets. You will learn to work these out further down.',
  };
  let promoteSeen = 0;
  const co2Scenes = co2.frames.map((fr, idx) => {
    let say = SAY[fr.kind];
    if (fr.kind === 'promote') { promoteSeen++; say = SAY['promote' + promoteSeen]; }
    return {
      say, dur: fr.kind === 'count' ? 3.8 : fr.kind === 'skeleton' ? 2.4 : 3.2,
      draw(g, p, t, info) {
        drawFrame(g, co2, idx, p, info, { t, faces: true, keepArrow: true, layout: { maxL: 200, maxR: 48, minR: 44, margin: 78 }, number: false });
        if (fr.kind === 'central') Art.bubble(g, 'I only see 4!', 495, 196, { w: 220, size: 26, side: 'down', alpha: seg(p, 0.4, 0.6) });
        if (fr.kind === 'fc') Art.moe(g, 730, 462, 112, 'cheer', { t, flip: true });
      },
    };
  });
  Lab.story('#story-recipe', { title: 'The recipe, on carbon dioxide', h: 470, scenes: co2Scenes });

  /* ---------- Bench: the Lewis builder ---------- */
  const lb = { id: 'H2O', idx: 0, t0: 0, dots: false, mol: K.get('H2O') };
  const lbStage = Lab.stage('#c-builder', {
    h: 480, label: 'A Lewis structure drawn one recipe step at a time, with a pile of electrons counting down on the left.',
    draw(g, t, dt, s) {
      const tau = Lab.reducedMotion ? 1 : clamp((t - lb.t0) / (lb.mol.frames[lb.idx].kind === 'count' ? 2.2 : 1.5));
      drawFrame(g, lb.mol, lb.idx, tau, s, { t, dots: lb.dots, faces: lb.mol.centers.length ? lb.mol.centers : [0, 1], number: true });
    },
  });
  function describe(mol, i) {
    const fr = mol.frames[i], st = fr.st, prev = mol.frames[Math.max(0, i - 1)].st;
    const parts = K.sumParts(mol);
    const center = mol.centers.length ? mol.atoms[mol.centers[0]].el : null;
    switch (fr.kind) {
      case 'count': {
        const list = parts.map((p) => `${p.n > 1 ? 'each ' : ''}${p.el} brings ${p.v}`).join(', ');
        const sum = parts.map((p) => (p.n > 1 ? `${p.n}(${p.v})` : `${p.v}`)).join(' + ');
        const raw = mol.total + mol.charge;
        const adj = mol.charge > 0 ? ` - ${mol.charge} = ${mol.total}` : mol.charge < 0 ? ` + ${-mol.charge} = ${mol.total}` : '';
        return `<p>${list[0].toUpperCase() + list.slice(1)}. Total: $${sum} = ${raw}${adj}$ electrons.${mol.charge ? ` The ${chargeText(mol.charge)} charge ${mol.charge > 0 ? 'removes' : 'adds'} ${Math.abs(mol.charge)}.` : ''}${mol.total % 2 ? ' That is an <b>odd</b> number, so one electron will end up alone.' : ''}</p>`;
      }
      case 'skeleton': {
        if (mol.atoms.length === 2) return `<p>With only two atoms, the skeleton is just ${mol.atoms[0].el} next to ${mol.atoms[1].el}.</p>`;
        if (mol.centers.length > 1) return `<p>Hydrogens always go on the outside, so the ${mol.centers.map((c) => mol.atoms[c].el).join(' and ')} atoms form the backbone.</p>`;
        const hasH = mol.atoms.some((a) => a.el === 'H');
        const others = [...new Set(mol.atoms.filter((a, k) => !mol.centers.includes(k) && a.el !== 'H').map((a) => a.el))].filter((el) => el !== center);
        const reason = others.length ? `It is less electronegative than ${others.join(' and ')}.` : mol.atoms.every((a) => a.el === center) ? 'All the atoms are the same element, so one of them simply takes the middle.' : mol.atoms[mol.centers[0]].el + ' is the only atom that can make enough bonds.';
        return `<p><b>${center} goes in the center.</b> ${reason}${hasH ? ' Hydrogen is never central, since it only forms one bond.' : ''}</p>`;
      }
      case 'connect': return `<p>Draw ${mol.edges.length} single bond${mol.edges.length > 1 ? 's' : ''}. Each uses 2 electrons: $${mol.total} - ${2 * mol.edges.length} = ${st.left}$ left.</p>`;
      case 'outer': {
        const used = prev.left - st.left;
        const hOnly = mol.atoms.every((a, k) => a.el === 'H' || !K.terminal(mol, k));
        if (hOnly) return '<p>The only outer atoms here are hydrogens. Each already has its 2 electrons, so nothing happens in this step.</p>';
        return `<p>Give outer atoms lone pairs until each sees 8, leaving H at 2. That uses ${used} electrons: $${prev.left} - ${used} = ${st.left}$ left.</p>`;
      }
      case 'central': {
        if (!fr.gave) return `<p>Nothing is left for the center.${mol.atoms.some((a, k) => K.around(mol, st, k) < K.target(a.el)) ? ' Look at the grumpy atom: it does not have enough electrons yet.' : ' Everyone is already satisfied.'}</p>`;
        const single = st.rad.some((x) => x) ? ' One electron has no partner, so it sits alone.' : '';
        return `<p>The last ${fr.gave} electron${fr.gave === 1 ? '' : 's'} go on the ${center || 'neediest atom'}.${single}</p>`;
      }
      case 'promote': return `<p>${mol.atoms[fr.to].el} only saw ${K.around(mol, prev, fr.to)} electrons, and the pile is empty. So ${mol.atoms[fr.from].el} shares a lone pair. A bond grows and no new electrons are used.</p>`;
      case 'check': {
        const total = 2 * K.pairs(st).bond + 2 * K.pairs(st).lone + st.rad.reduce((a, b) => a + b, 0);
        const kind = mol.kind;
        const extra = kind === 'few' ? ` ${center} is short of 8, and that is fine: ${center} is happy with ${K.target(center)}.` : kind === 'odd' ? ' With an odd total, one atom must stop at 7. This is a <b>free radical</b>.' : kind === 'many' ? ` ${center} sees ${K.around(mol, st, mol.centers[0])}. It is in period ${EL[center].period}, so it can hold more than 8.` : ' Every atom has what it needs.';
        return `<p>Count every electron in the drawing: $2(${K.pairs(st).bond}) + 2(${K.pairs(st).lone})${st.rad.some((x) => x) ? ' + 1' : ''} = ${total}$. It matches the ${mol.total} you started with.${extra}</p>`;
      }
      case 'fc': {
        const fcs = K.fcs(mol, st);
        const nz = fcs.filter((f) => f).length;
        const sum = fcs.reduce((a, b) => a + b, 0);
        const canExpand = mol.frames[i + 1] && mol.frames[i + 1].kind === 'expand';
        return `<p>${nz ? 'Atoms not marked have a formal charge of 0.' : 'All formal charges are 0.'} They add up to ${fcText(sum)}, which matches the charge on the ${mol.charge ? 'ion' : 'molecule'}.${canExpand ? ` Press next: ${center} is in period ${EL[center].period}, so there is another option.` : ''}${K.pairs(st).bond && mol.group === 'resonance' && mol.frames[i + 1] === undefined ? ' The double bond could have gone on another atom: that is resonance.' : ''}</p>`;
      }
      case 'expand': return `<p>${center} is in period ${EL[center].period}, so it may hold more than 8. Sharing one more lone pair lowers the formal charges. Now ${center} sees ${K.around(mol, st, mol.centers[0])} and has a charge of ${fcText(K.fc(mol, st, mol.centers[0]))}. <b>Textbooks differ here,</b> so use the version your instructor uses.</p>`;
      default: return '';
    }
  }
  function paintBuilder() {
    const m = lb.mol, fr = m.frames[lb.idx], st = fr.st;
    const pairs = K.pairs(st), rad = st.rad.reduce((a, b) => a + b, 0);
    Lab.$('#lb-total').textContent = m.total;
    Lab.$('#lb-bond').textContent = pairs.bond;
    Lab.$('#lb-lone').textContent = pairs.lone;
    Lab.$('#lb-used').textContent = (fr.kind === 'count' || fr.kind === 'skeleton' ? 0 : 2 * pairs.bond + 2 * pairs.lone + rad) + ' of ' + m.total;
    Lab.$('#lb-name').textContent = m.name;
    Lab.$('#lb-say').innerHTML = Lab.texString(describe(m, lb.idx));
    Lab.$('#lb-back').disabled = lb.idx === 0;
    Lab.$('#lb-next').disabled = lb.idx === m.frames.length - 1;
    Lab.$('#lb-end').disabled = lb.idx === m.frames.length - 1;
    lb.t0 = lbStage.t;
    lbStage.redraw();
  }
  function setMol(id) {
    lb.id = id; lb.mol = K.get(id); lb.idx = 0;
    Lab.$$('#lb-mol button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === id)));
    paintBuilder();
  }
  function setGroup(gr) {
    const ids = K.ids.filter((id) => K.get(id).group === gr);
    Lab.$('#lb-mol').innerHTML = ids.map((id, i) => `<button type="button" data-value="${id}" aria-pressed="${i === 0}">${Lab.fHTML(id.replace('^', '^'))}</button>`).join('');
    setMol(ids[0]);
  }
  Lab.segmented('#lb-group', setGroup);
  Lab.$('#lb-mol').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setMol(b.dataset.value); });
  Lab.segmented('#lb-style', (v) => { lb.dots = v === 'dots'; lbStage.redraw(); });
  Lab.$('#lb-next').addEventListener('click', () => { lb.idx = Math.min(lb.mol.frames.length - 1, lb.idx + 1); Lab.sound.pop(); paintBuilder(); });
  Lab.$('#lb-back').addEventListener('click', () => { lb.idx = Math.max(0, lb.idx - 1); paintBuilder(); });
  Lab.$('#lb-end').addEventListener('click', () => { lb.idx = lb.mol.frames.length - 1; paintBuilder(); });
  setGroup('simple');
  if (Lab.isAuto) window.__lewis = { set(id, idx) { const m = K.get(id); Lab.$('#lb-group button[data-value="' + m.group + '"]').click(); setMol(id); lb.idx = idx < 0 ? m.frames.length + idx : idx; paintBuilder(); } };

  /* ---------- Bench: draw it yourself ---------- */
  const DIY_IDS = ['H2O', 'NH3', 'HCN', 'CO2', 'CH2O', 'N2', 'NH4^+', 'O3', 'NO3^-', 'BF3', 'SF4', 'XeF4'];
  const diy = { id: 'H2O', mol: K.get('H2O'), st: { order: K.get('H2O').edges.map(() => 1), lp: K.get('H2O').atoms.map(() => 0), rad: K.get('H2O').atoms.map(() => 0), left: 0 }, showFC: false, msg: '', ok: false, solved: new Set() };
  function diyReset(id) {
    diy.id = id; diy.mol = K.get(id);
    diy.st = { order: diy.mol.edges.map(() => 1), lp: diy.mol.atoms.map(() => 0), rad: diy.mol.atoms.map(() => 0), left: 0 };
    diy.ok = false; diy.showFC = false;
    diy.msg = `<p>Target: <b>${diy.mol.name}</b>, $${K.tex(id)}$. Start by working out how many electrons you have. The panel does the counting: the single bonds are already placed.</p>`;
    Lab.$$('#diy-mol button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === id)));
    paintDIY();
  }
  const diyUsed = () => 2 * diy.st.order.reduce((a, b) => a + b, 0) + 2 * diy.st.lp.reduce((a, b) => a + b, 0);
  function paintDIY() {
    Lab.$('#diy-say').innerHTML = Lab.texString(diy.msg);
    Lab.$('#diy-fc').textContent = diy.showFC ? 'Hide formal charges' : 'Show formal charges';
    diyStage.redraw();
  }
  const diyLay = () => layoutMol(diy.mol, { x: 198, y: 20, w: 594, h: 440 }, {});
  const diyStage = Lab.stage('#c-diy', {
    h: 480, drag: false, label: 'Your own Lewis drawing. Tap atoms to add lone pairs and bonds to raise the bond order.',
    onPointer(e) {
      const lay = diyLay();
      const atomHit = lay.P.findIndex((p) => Math.hypot(e.x - p.x, e.y - p.y) < Math.max(p.r + 10, 34));
      const edgeHit = diy.mol.edges.findIndex(([a, b]) => Math.hypot(e.x - (lay.P[a].x + lay.P[b].x) / 2, e.y - (lay.P[a].y + lay.P[b].y) / 2) < 34);
      if (e.type === 'hover') { diyStage.canvas.style.cursor = atomHit >= 0 || edgeHit >= 0 ? 'pointer' : 'default'; return; }
      if (e.type !== 'down') return;
      if (atomHit >= 0) {
        if (diy.mol.atoms[atomHit].el === 'H') { diy.msg = '<p>Hydrogen already has its 2 electrons from the bond. It never gets a lone pair.</p>'; paintDIY(); return; }
        const n = K.neighbors(diy.mol, atomHit).length;
        const maxLp = Math.max(1, 4 - (n > 4 ? 4 : n === 1 ? 1 : 0));
        diy.st.lp[atomHit] = (diy.st.lp[atomHit] + 1) % (maxLp + 1);
        Lab.sound.pop(); diy.ok = false; paintDIY();
      } else if (edgeHit >= 0) {
        const [a, b] = diy.mol.edges[edgeHit];
        if (diy.mol.atoms[a].el === 'H' || diy.mol.atoms[b].el === 'H') { diy.msg = '<p>Hydrogen can only make one bond, so this one stays single.</p>'; paintDIY(); return; }
        diy.st.order[edgeHit] = diy.st.order[edgeHit] % 3 + 1;
        Lab.sound.pop(); diy.ok = false; paintDIY();
      }
    },
    draw(g, t, dt, s) {
      const m = diy.mol, st = diy.st, used = diyUsed();
      const lay = diyLay();
      drawPile(g, PILE(s.H), m.total, m.total - used);
      if (used > m.total) Art.text(g, 'Too many!', 100, 450, { size: 26, color: C.red });
      else {
        Art.text(g, 'Tap an atom:', 100, 364, { size: 21, color: C.cyan });
        Art.text(g, 'add a lone pair', 100, 388, { size: 21, color: C.dim });
        Art.text(g, 'Tap a bond:', 100, 422, { size: 21, color: C.sun });
        Art.text(g, 'add to the bond', 100, 446, { size: 21, color: C.dim });
      }
      brackets(g, lay, m.charge, 1);
      drawState(g, m, lay, st, { t, tau: 1, rings: true, fc: diy.showFC, faces: diy.ok ? true : null });
      if (diy.ok) Art.moe(g, 725, 462, 110, 'cheer', { t, flip: true });
    },
  });
  Lab.$('#diy-mol').innerHTML = DIY_IDS.map((id, i) => `<button type="button" data-value="${id}" aria-pressed="${i === 0}">${Lab.fHTML(id)}</button>`).join('');
  Lab.$('#diy-mol').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) diyReset(b.dataset.value); });
  Lab.$('#diy-reset').addEventListener('click', () => diyReset(diy.id));
  Lab.$('#diy-fc').addEventListener('click', () => { diy.showFC = !diy.showFC; paintDIY(); });
  Lab.$('#diy-check').addEventListener('click', () => {
    const m = diy.mol, st = diy.st, used = diyUsed();
    const say = (html, good) => { diy.msg = html; diy.ok = !!good; if (!good) Lab.sound.bad(); paintDIY(); };
    if (used !== m.total) {
      const d = m.total - used;
      return say(d > 0 ? `<p>You still have <b>${d}</b> electron${d === 1 ? '' : 's'} left to place. Add lone pairs${m.atoms.length > 2 ? ', and put any extras on the center' : ''}.</p>` : `<p>You used <b>${-d}</b> too many. The total is fixed at ${m.total}. If an atom needs more, turn a lone pair into a bond: that does not use new electrons.</p>`);
    }
    for (let i = 0; i < m.atoms.length; i++) {
      const a = m.atoms[i], n = K.around(m, st, i);
      if (EL[a.el].period === 2 && n > 8) return say(`<p>${a.el} sees ${n} electrons. Period 2 atoms can never hold more than 8.</p>`);
      if (n < K.target(a.el)) return say(`<p>Your count of ${m.total} is right, but ${a.el} only sees ${n}. Try turning a lone pair on a neighbor into another bond.</p>`);
      if (a.el !== 'H' && K.terminal(m, i) && n > 8) return say(`<p>The outer ${a.el} sees ${n}. Outer atoms stop at 8.</p>`);
    }
    const sumAbs = (x) => K.fcs(m, x).reduce((a, f) => a + Math.abs(f), 0);
    const mine = sumAbs(st), best = Math.min(sumAbs(m.octet), sumAbs(m.best));
    if (mine > best) {
      diy.showFC = true;
      return say('<p>Every atom is satisfied and the count is right, but look at the formal charges. They can be smaller. Can you spread the bonds more evenly?</p>');
    }
    diy.showFC = true;
    if (!diy.solved.has(m.id)) { diy.solved.add(m.id); Lab.collection.award(1); }
    Lab.confetti(); Lab.sound.good();
    const res = m.group === 'resonance' ? ' You could have put the double bond on a different atom, and that would be right too. That is resonance.' : '';
    say(`<p><b>Correct.</b> ${m.total} electrons used, and every atom is satisfied.${res} Pick another target.</p>`, true);
  });
  diyReset('H2O');

  /* ---------- Bench: the formal charge court ---------- */
  const cases = K.cases();
  const court = { c: cases[0], sel: [0, 1], seen: new Set(['0:1']), winner: false, t0: 0 };
  const panelBox = (n, k, W) => ({ x: (W * k) / n + 8, y: 66, w: W / n - 16, h: 214 });
  const courtLay = (s, k, n, W) => layoutMol(s, panelBox(n, k, W), { margin: 44, maxL: 84, maxR: 25, minR: 22 });
  const courtStage = Lab.stage('#c-court', {
    h: 470, label: 'Candidate Lewis structures side by side with their formal charges and a calculation for the atom you tap.',
    onPointer(e) {
      const c = court.c, n = c.list.length, W = 800;
      let hit = null;
      c.list.forEach((s, k) => { courtLay(s, k, n, W).P.forEach((p, i) => { if (Math.hypot(e.x - p.x, e.y - p.y) < 30) hit = [k, i]; }); });
      if (e.type === 'hover') { courtStage.canvas.style.cursor = hit ? 'pointer' : 'default'; return; }
      if (e.type !== 'down' || !hit) return;
      court.sel = hit; court.seen.add(hit.join(':')); court.t0 = courtStage.t; Lab.sound.pop(); paintCourt();
    },
    draw(g, t, dt, s) {
      const c = court.c, n = c.list.length;
      Art.formula(g, c.title, s.W / 2, 34, { size: 38 });
      c.list.forEach((st, k) => {
        const lay = courtLay(st, k, n, s.W);
        const box = panelBox(n, k, s.W);
        const isBest = court.winner && k === c.best;
        g.fillStyle = isBest ? 'rgba(61,220,132,.13)' : 'rgba(14,6,30,.5)';
        Art.round(g, box.x, box.y - 4, box.w, box.h + 58, 16); g.fill();
        g.strokeStyle = isBest ? C.leaf : 'rgba(247,242,255,.14)'; g.lineWidth = isBest ? 4 : 2; g.stroke();
        drawState(g, st, lay, st.st, { t, tau: 1 });
        st.fcs.forEach((f, i) => {
          const known = court.winner || court.seen.has(k + ':' + i);
          const spot = { x: lay.P[i].x, y: lay.P[i].y + lay.P[i].r + 40 };
          if (known) fcBadge(g, spot.x, spot.y, f, 1);
          else fcBadge(g, spot.x, spot.y, '?', 0.75);
        });
        // Selected atom: the snip.
        if (court.sel[0] === k) {
          const i = court.sel[1], p = lay.P[i];
          Art.ring(g, p.x, p.y, p.r + 6, { color: C.sun, w: 4 });
          K.neighbors(st, i).forEach(({ j, k: e }) => {
            const m = lay.P[j];
            const mx = (p.x + m.x) / 2, my = (p.y + m.y) / 2, a = Math.atan2(m.y - p.y, m.x - p.x);
            const nx = -Math.sin(a), ny = Math.cos(a);
            g.strokeStyle = C.pink; g.lineWidth = 3; g.setLineDash([5, 5]);
            g.beginPath(); g.moveTo(mx + nx * 25, my + ny * 25); g.lineTo(mx - nx * 25, my - ny * 25); g.stroke(); g.setLineDash([]);
            const offs = OFFS[st.st.order[e]];
            offs.forEach((o) => {
              const ox = nx * o * lay.gap, oy = ny * o * lay.gap;
              eDot(g, mx + ox - Math.cos(a) * 9, my + oy - Math.sin(a) * 9, 4.6, { color: C.pink });
            });
          });
        }
        const allKnown = court.winner || st.atoms.every((_, i) => court.seen.has(k + ':' + i));
        Art.text(g, allKnown ? `Total size: ${st.sumAbs}` : 'Tap each atom', box.x + box.w / 2, box.y + box.h + 34, { size: 23, color: allKnown ? C.sun : C.dim });
        if (isBest) { g.fillStyle = C.sun; Art.star(g, box.x + 30, box.y + 26, 22, -0.4 + Math.sin(t * 2) * 0.1); }
      });
      // Calculation bar.
      const [pk, pi] = court.sel;
      const st = c.list[pk];
      const el = st.atoms[pi].el, v = K.valence(el), L = 2 * st.st.lp[pi], B = 2 * K.neighbors(st, pi).reduce((a, x) => a + st.st.order[x.k], 0), f = st.fcs[pi];
      const y = 384;
      g.fillStyle = 'rgba(14,6,30,.72)'; Art.round(g, 12, 344, s.W - 24, 114, 16); g.fill();
      Art.atom(g, 58, y + 18, 26, el, { face: f === 0 ? 'happy' : f > 0 ? 'wow' : 'grumpy', t });
      const q = ease.out(clamp((t - court.t0) * 2));
      const xs = [136, 236, 296, 396, 462, 588, 640, 716];
      const parts = [['FC', C.ink], ['=', C.dim], [String(v), C.sun], [MINUS, C.dim], [String(L), C.cyan], [MINUS, C.dim], [`½(${B})`, C.pink]];
      const xp = [132, 186, 236, 288, 340, 392, 470];
      parts.forEach(([txt, col], k) => Art.text(g, txt, xp[k], y, { font: 'display', size: 38, color: col, alpha: seg(q, k * 0.1, 0.4 + k * 0.1) }));
      Art.text(g, '=', 560, y, { font: 'display', size: 38, color: C.dim, alpha: seg(q, 0.7, 1) });
      Art.text(g, fcText(f), 628, y, { font: 'display', size: 48, color: f === 0 ? C.leaf : f > 0 ? '#FF7AB8' : '#6EC6FF', alpha: seg(q, 0.7, 1) });
      Art.text(g, 'valence', 236, y + 46, { size: 21, color: C.sun, alpha: q });
      Art.text(g, 'lone', 340, y + 46, { size: 21, color: C.cyan, alpha: q });
      Art.text(g, 'half of bonds', 470, y + 46, { size: 21, color: C.pink, alpha: q });
      void xs; void wander;
    },
  });
  function paintCourt() {
    const c = court.c, n = c.list.length;
    const total = c.list.reduce((a, s) => a + s.atoms.length, 0);
    const seenAll = court.seen.size >= total;
    let html;
    if (court.winner) {
      const best = c.list[c.best];
      const tied = c.list.filter((s) => s.sumAbs === best.sumAbs).length > 1;
      const negs = best.atoms.filter((_, i) => best.fcs[i] < 0).map((a) => a.el);
      html = `<p><b>The winner is ${best.label}.</b> Its formal charges are the smallest, with a total size of ${best.sumAbs}.${tied && negs.length ? ` It ties another structure on size, so the rule for negative charge decides: it belongs on the more electronegative atom, and here that is ${negs[0]} (electronegativity ${EL[negs[0]].en}).` : ''}</p>`;
    } else html = seenAll ? '<p>All the charges are out. Add up their sizes, ignoring the signs. Which structure has the smallest total? Press the winner button to check.</p>' : `<p>Tap an atom to work out its formal charge. The pink dots show the half of each bond that atom keeps. There ${n === 1 ? 'is' : 'are'} ${n} candidate${n === 1 ? '' : 's'} here, and all of them have the same ${c.list[0].total} electrons.</p>`;
    Lab.$('#court-say').innerHTML = Lab.texString(html);
    courtStage.redraw();
  }
  Lab.$('#court-case').innerHTML = cases.map((c, i) => `<button type="button" data-value="${i}" aria-pressed="${i === 0}">${Lab.fHTML(c.title)}</button>`).join('');
  Lab.segmented('#court-case', (v) => { court.c = cases[+v]; court.sel = [0, 1]; court.seen = new Set(['0:1']); court.winner = false; court.t0 = courtStage.t; paintCourt(); });
  Lab.$('#court-reveal').addEventListener('click', () => { court.winner = true; Lab.sound.good(); paintCourt(); });
  Lab.$('#court-reset').addEventListener('click', () => { court.winner = false; court.seen = new Set([court.sel.join(':')]); paintCourt(); });
  paintCourt();

  /* ---------- Resonance data ---------- */
  const OCTET_FORM = (mol) => {
    // Every way to put the extra bond on an equivalent position.
    const c = mol.centers[0];
    const nb = K.neighbors(mol, c);
    return nb.map((n) => {
      const st = { order: mol.edges.map(() => 1), lp: mol.octet.lp.slice(), rad: mol.atoms.map(() => 0), left: 0 };
      nb.forEach((x) => { st.lp[x.j] = 3; });
      st.order[n.k] = 2; st.lp[n.j] = 2;
      K.verify(mol, st);
      return st;
    });
  };
  const benzene = (() => {
    const atoms = [], edges = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU - Math.PI / 2; atoms.push({ el: 'C', x: Math.cos(a), y: Math.sin(a) }); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU - Math.PI / 2; atoms.push({ el: 'H', x: Math.cos(a) * 1.72, y: Math.sin(a) * 1.72 }); }
    for (let i = 0; i < 6; i++) edges.push([i, (i + 1) % 6]);
    for (let i = 0; i < 6; i++) edges.push([i, i + 6]);
    const mol = { id: 'C6H6', name: 'Benzene', charge: 0, atoms, edges, lpAng: {}, total: 30, centers: [0, 1, 2, 3, 4, 5] };
    const mk = (s) => ({ order: edges.map((_, k) => (k < 6 ? ((k + s) % 2 ? 1 : 2) : 1)), lp: atoms.map(() => 0), rad: atoms.map(() => 0), left: 0 });
    mol.forms = [mk(0), mk(1)];
    mol.forms.forEach((f) => { K.verify(mol, f); });
    return mol;
  })();
  const RES = {
    O3: { mol: K.get('O3'), short: 121, long: 148, real: 128, pair: 'O−O', frac: '1½', center: '+1', term: `${MINUS}½` },
    'NO3^-': { mol: K.get('NO3^-'), short: 121, long: 141, real: 124, pair: 'N−O', frac: '1⅓', center: '+1', term: `${MINUS}⅔`, about: true },
    'CO3^2-': { mol: K.get('CO3^2-'), short: 123, long: 143, real: 129, pair: 'C−O', frac: '1⅓', center: '0', term: `${MINUS}⅔`, about: true },
    C6H6: { mol: benzene, short: 134, long: 154, real: 139, pair: 'C−C', frac: '1½', center: null, term: null },
  };
  Object.values(RES).forEach((R) => { R.forms = R.mol.forms || OCTET_FORM(R.mol); });
  const RES_BOX = { x: 150, y: 8, w: 500, h: 330 };
  function resEdges(R) { return R.mol === benzene ? [0, 1, 2, 3, 4, 5] : K.neighbors(R.mol, R.mol.centers[0]).map((n) => n.k); }
  function resLayout(R, box) {
    if (R.mol === benzene) return layoutMol(R.mol, box, { margin: 34, maxL: 96, maxR: 26, minR: 22 });
    const big = box.big || R.mol.atoms.length === 3;
    return layoutMol(R.mol, box, { margin: 66, maxL: big ? 170 : 122, maxR: big ? 44 : 30, minR: 26 });
  }
  /** The real molecule: every resonance bond the same, drawn solid plus dashed, with electrons spread over them. */
  function drawHybrid(g, R, lay, t, q = 1, o = {}) {
    const mol = R.mol, P = lay.P, edges = resEdges(R);
    const prev = g.globalAlpha;
    edges.forEach((k, idx) => {
      const [a, b] = mol.edges[k];
      const A = P[a], B = P[b], dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
      g.globalAlpha = prev * q;
      // The spread-out cloud.
      for (let i = 0; i <= 8; i++) {
        const u = i / 8, x = lerp(A.x, B.x, u), y = lerp(A.y, B.y, u);
        g.fillStyle = Art.alpha(C.cyan, 0.08 + 0.05 * Math.sin(t * 2 + i * 0.7 + idx));
        g.beginPath(); g.arc(x, y, lay.r * 0.9, 0, TAU); g.fill();
      }
      bondLine(g, A.x, A.y, B.x, B.y, -lay.gap * 0.5, lay.bw, '#EDE6FA', 1);
      g.setLineDash([9, 8]);
      bondLine(g, A.x, A.y, B.x, B.y, lay.gap * 0.5, lay.bw, C.cyan, 1);
      g.setLineDash([]);
      g.globalAlpha = prev;
      // Moving electrons along the bond.
      for (let i = 0; i < 2; i++) {
        const u = 0.5 + 0.42 * Math.sin(t * 1.4 + i * 3.14 + idx * 2.1);
        eDot(g, lerp(A.x, B.x, u) + nx * lay.gap * 0.5, lerp(A.y, B.y, u) + ny * lay.gap * 0.5, lay.dot * 0.9, { alpha: q });
      }
    });
    mol.edges.forEach((e, k) => { if (!edges.includes(k)) bondLine(g, P[e[0]].x, P[e[0]].y, P[e[1]].x, P[e[1]].y, 0, lay.bw, '#EDE6FA', 1); });
    mol.atoms.forEach((a, i) => Art.atom(g, P[i].x, P[i].y, P[i].r, a.el, { t, seed: i, face: o.faces && i === 0 ? 'happy' : null }));
    if (R.term) {
      const c = mol.centers[0];
      mol.atoms.forEach((a, i) => {
        if (i === c) return;
        const ang = Math.atan2(P[i].y - P[c].y, P[i].x - P[c].x);
        Art.pill(g, R.term, P[i].x + Math.cos(ang) * (P[i].r + 30), P[i].y + Math.sin(ang) * (P[i].r + 30), { size: 25, color: '#1786D8', text: '#fff', alpha: q });
      });
      if (R.center && R.center !== '0') { const s = { x: P[c].x, y: P[c].y }; Art.pill(g, R.center, s.x + P[c].r + 14, s.y - P[c].r - 12, { size: 25, color: '#E8357F', text: '#fff', alpha: q }); }
    }
    if (mol === benzene) {
      g.strokeStyle = Art.alpha(C.cyan, 0.65 * q); g.lineWidth = 5; g.setLineDash([12, 10]);
      g.beginPath(); g.arc(lay.cx, lay.cy, lay.L * 0.56, t * 0.2, t * 0.2 + TAU); g.stroke(); g.setLineDash([]);
    }
  }
  /** A pm ruler that shows what each view predicts for every bond. */
  function drawRuler(g, R, x0, x1, y, bonds, o = {}) {
    const lo = R.short - 12, hi = R.long + 12;
    const X = (v) => lerp(x0, x1, (v - lo) / (hi - lo));
    g.fillStyle = 'rgba(14,6,30,.72)'; Art.round(g, x0 - 46, y - 56, x1 - x0 + 92, 118, 16); g.fill();
    g.strokeStyle = 'rgba(247,242,255,.65)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    [[R.short, 'double', C.dim], [R.long, 'single', C.dim]].forEach(([v, lab, col]) => {
      g.strokeStyle = '#fff'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(X(v), y - 10); g.lineTo(X(v), y + 10); g.stroke();
      Art.text(g, `${lab} ${v} pm`, X(v), y + 34, { size: 22, color: col });
    });
    bonds.forEach((b, i) => {
      const n = bonds.length;
      const dx = (i - (n - 1) / 2) * 20 * (b.spread === false ? 0 : 1);
      const x = X(b.v) + dx, yy = y - 22 - Math.sin(o.t * 3 + i) * 2;
      g.fillStyle = b.color; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, yy + 14); g.lineTo(x - 11, yy - 6); g.lineTo(x + 11, yy - 6); g.closePath(); g.fill(); g.stroke();
    });
  }

  /* ---------- Story 3: resonance in ozone ---------- */
  const O3R = RES.O3;
  const O3BOX = { x: 110, y: 0, w: 580, h: 350, big: true };
  const resStage = (g, p, t, formA, formB, q, o = {}) => {
    const lay = resLayout(O3R, O3BOX);
    brackets(g, lay, 0);
    drawState(g, O3R.mol, lay, formB, { prev: formA, tau: q, t, fc: o.fc, faces: o.faces });
    return lay;
  };
  Lab.story('#story-resonance', {
    title: 'Two drawings, one molecule',
    scenes: [
      {
        say: 'Follow the recipe for ozone, $\\ce{O3}$, and you get a double bond on one side. But who says it goes on the <b>left</b>?',
        dur: 2.6,
        draw(g, p, t) {
          const lay = resLayout(O3R, O3BOX);
          drawState(g, O3R.mol, lay, O3R.forms[0], { t, faces: true });
          const c = lay.P[0], a = lay.P[1], b = lay.P[2];
          Art.text(g, 'short', (a.x + c.x) / 2 - 60, (a.y + c.y) / 2 - 42, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.4, 0.6) });
          Art.text(g, 'long', (b.x + c.x) / 2 + 56, (b.y + c.y) / 2 - 42, { font: 'display', size: 34, color: C.pink, alpha: seg(p, 0.5, 0.7) });
          Art.text(g, 'This drawing predicts two different bonds.', 430, 400, { size: 29, alpha: seg(p, 0.6, 0.8) });
          Art.moe(g, 72, 446, 104, 'think', { t });
        },
      },
      {
        say: 'The other side works just as well. Same atoms, same electrons, same formal charges. Only one pair of electrons has moved. So which is correct?',
        dur: 3.4,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.3, 0.9));
          const lay = resStage(g, p, t, O3R.forms[0], O3R.forms[1], q, { faces: true });
          const [c, a, b] = lay.P;
          const lift = (P) => ({ x: (P.x + c.x) / 2, y: (P.y + c.y) / 2 });
          const mA = lift(a), mB = lift(b);
          Art.arrow(g, b.x + 40, b.y - 70, mB.x + 14, mB.y - 22, { color: C.pink, w: 6, curve: -30, p: seg(p, 0.05, 0.35) });
          Art.arrow(g, mA.x - 14, mA.y - 22, a.x - 40, a.y - 70, { color: C.pink, w: 6, curve: -30, p: seg(p, 0.1, 0.4) });
          Art.text(g, 'Electrons move. Atoms do not.', 400, 400, { font: 'display', size: 36, color: C.cyan, alpha: seg(p, 0.6, 0.85) });
        },
      },
      {
        say: 'Measure them. A normal O−O single bond is <b>148 pm</b> long and an O=O double bond is <b>121 pm</b>. If ozone had one of each, you would find 121 and 148.',
        dur: 3,
        draw(g, p, t) {
          const lay = resStage(g, p, t, O3R.forms[0], O3R.forms[0], 1, {});
          void lay;
          drawRuler(g, O3R, 170, 630, 398, [{ v: 121, color: C.sun, spread: false }, { v: 148, color: C.pink, spread: false }], { t });
          Art.text(g, 'what two different bonds would measure', 400, 357, { size: 22, color: C.ink });
        },
      },
      {
        say: 'They are not. Both bonds in ozone measure <b>128 pm</b>. They are identical, somewhere in between. Neither drawing is the real molecule.',
        dur: 3.2,
        draw(g, p, t) {
          const lay = resLayout(O3R, O3BOX);
          drawState(g, O3R.mol, lay, O3R.forms[0], { t });
          const q = ease.inOut(seg(p, 0.15, 0.7));
          const v1 = lerp(121, 128, q), v2 = lerp(148, 128, q);
          drawRuler(g, O3R, 170, 630, 398, [{ v: v1, color: C.sun, spread: q < 0.9 ? false : true }, { v: v2, color: C.pink, spread: q < 0.9 ? false : true }], { t });
          Art.text(g, 'measured: both 128 pm', 400, 357, { size: 25, color: C.leaf, alpha: seg(p, 0.65, 0.85) });
          Art.strike(g, 150, 50, 650, 320, seg(p, 0.7, 0.95), C.red, 7);
        },
      },
      {
        say: 'The real molecule is a <b>resonance hybrid</b>. Two electrons are spread over both bonds, so each bond is a bond and a half. Each end oxygen carries half of the charge.',
        dur: 3.4,
        draw(g, p, t) {
          const lay = resLayout(O3R, O3BOX);
          drawHybrid(g, O3R, lay, t, ease.out(seg(p, 0.05, 0.6)));
          Art.pill(g, 'bond order 1½', 400, 346, { size: 28, color: C.pink, text: '#fff', alpha: seg(p, 0.55, 0.75) });
          Art.text(g, 'One structure. It never flips.', 400, 404, { font: 'display', size: 38, color: C.sun, alpha: seg(p, 0.7, 0.9) });
        },
      },
    ],
  });

  /* ---------- Bench: resonance lab ---------- */
  const res = { id: 'O3', view: 0, prevView: 0, t0: 0 };
  const resBench = Lab.stage('#c-res', {
    h: 480, label: 'Resonance forms of a molecule with arrows showing the electrons, and a ruler comparing predicted and measured bond lengths.',
    draw(g, t) {
      const R = RES[res.id];
      const lay = resLayout(R, RES_BOX);
      const n = R.forms.length;
      const hybrid = res.view === n;
      const q = Lab.reducedMotion ? 1 : ease.inOut(clamp((t - res.t0) / 1.1));
      const edges = resEdges(R);
      const showBrackets = R.mol.charge;
      if (showBrackets) brackets(g, lay, R.mol.charge, 1);
      if (hybrid) {
        drawHybrid(g, R, lay, t, res.prevView === n ? 1 : q);
        Art.pill(g, `bond order ${R.frac}`, 90, 40, { size: 25, color: C.pink, text: '#fff' });
      } else {
        const from = res.prevView === n ? R.forms[res.view] : R.forms[res.prevView], to = R.forms[res.view];
        drawState(g, R.mol, lay, to, { prev: from, tau: q, t, fc: R.mol !== benzene });
        // Curved arrows showing the electrons that moved.
        if (from !== to && q < 1) {
          edges.forEach((k) => {
            if (to.order[k] > from.order[k]) {
              const [a, b] = R.mol.edges[k];
              const A = lay.P[a], B = lay.P[b], mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
              if (R.mol === benzene) {
                const prevEdge = edges.find((e) => from.order[e] > to.order[e] && (R.mol.edges[e].includes(a)));
                if (prevEdge !== undefined) {
                  const [c, d] = R.mol.edges[prevEdge];
                  Art.arrow(g, (lay.P[c].x + lay.P[d].x) / 2, (lay.P[c].y + lay.P[d].y) / 2, mx, my, { color: C.pink, w: 4, curve: -24, p: seg(q, 0, 0.7) });
                }
              } else {
                const outer = R.mol.centers[0] === a ? B : A;
                Art.arrow(g, outer.x + (outer.x - lay.cx) * 0.34, outer.y + (outer.y - lay.cy) * 0.34, mx, my, { color: C.pink, w: 5, curve: 34, p: seg(q, 0, 0.7) });
              }
            }
          });
        }
      }
      // Ruler.
      const bonds = edges.map((k, i) => {
        const color = [C.sun, C.pink, C.cyan, C.leaf, C.violet, C.fire][i % 6];
        const pred = R.forms[hybrid ? 0 : res.view].order[k] === 2 ? R.short : R.long;
        const was = R.forms[Math.min(n - 1, res.prevView)].order[k] === 2 ? R.short : R.long;
        const v = hybrid ? (res.prevView === n ? R.real : lerp(was, R.real, q)) : lerp(res.prevView === n ? R.real : was, pred, q);
        return { v, color };
      });
      drawRuler(g, R, 170, 630, 414, bonds, { t });
      Art.text(g, hybrid ? `measured: all ${R.about ? 'about ' : ''}${R.real} pm` : 'bond lengths this drawing predicts', 400, 366, { size: 24, color: hybrid ? C.leaf : C.ink });
    },
  });
  function paintRes() {
    const R = RES[res.id], n = R.forms.length;
    const hybrid = res.view === n;
    Lab.$('#res-name').textContent = R.mol.name;
    const pairsToCenter = R.mol === benzene ? 9 : null;
    let html;
    if (hybrid) {
      html = R.mol === benzene
        ? `<p>All six C−C bonds measure <b>139 pm</b>, between C−C (154 pm) and C=C (134 pm). Three pairs of electrons spread around the whole ring, so each bond has a bond order of <b>1½</b>.</p>`
        : `<p>All the ${R.pair} bonds measure ${R.about ? 'about ' : ''}<b>${R.real} pm</b>, and the average bond order is <b>${R.frac}</b>: that is ${R.frac === '1½' ? '3 bonding pairs over 2 bonds' : '4 bonding pairs over 3 bonds'}. The negative charge is shared equally by the outer oxygens. Bond lengths are typical values and vary a little between sources.</p>`;
    } else {
      html = `<p>Drawing ${res.view + 1} of ${n}. ${R.mol === benzene ? 'Three C=C double bonds, in alternating places.' : 'One double bond and the rest single.'} Each triangle on the ruler is one bond. ${n} equally good drawings predict ${R.mol === benzene ? 'long and short' : 'one short bond and the rest long'}, but real measurements disagree. Press real molecule.</p>`;
    }
    void pairsToCenter;
    Lab.$('#res-say').innerHTML = Lab.texString(html);
  }
  function buildResView() {
    const R = RES[res.id], n = R.forms.length;
    const host = Lab.$('#res-view');
    host.innerHTML = R.forms.map((_, i) => `<button type="button" data-value="${i}" aria-pressed="${i === 0}">Drawing ${i + 1}</button>`).join('') + `<button type="button" data-value="${n}" aria-pressed="false">Real molecule</button>`;
  }
  Lab.$('#res-view').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    res.prevView = res.view; res.view = +b.dataset.value; res.t0 = resBench.t;
    Lab.$$('#res-view button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    Lab.sound.pop(); paintRes();
  });
  Lab.segmented('#res-mol', (v) => { res.id = v; res.view = 0; res.prevView = 0; res.t0 = resBench.t - 5; buildResView(); paintRes(); resBench.redraw(); });
  buildResView(); paintRes();

  /* ---------- Story 4: when the octet rule breaks ---------- */
  const BF3 = K.get('BF3'), NO = K.get('NO'), SF6 = K.get('SF6'), XEF4 = K.get('XeF4');
  // A rejected drawing of BF3 with a B=F double bond, checked by the same bookkeeping.
  const BF3_BAD = { order: [2, 1, 1], lp: [0, 2, 3, 3], rad: [0, 0, 0, 0], left: 0 };
  K.verify(BF3, BF3_BAD);
  Lab.story('#story-exceptions', {
    title: 'Three ways to break the octet rule',
    scenes: [
      {
        say: '<b>Too few.</b> Boron in $\\ce{BF3}$ sees only 6, and it is fine. Making a B=F double bond would give boron an octet, but it would put a <b>+1</b> charge on fluorine, the most electron-hungry atom there is.',
        dur: 3.6,
        draw(g, p, t, { W }) {
          const L = layoutMol(BF3, { x: 10, y: 6, w: 390, h: 330 }, { maxL: 104, maxR: 28, minR: 26, margin: 58 });
          drawState(g, BF3, L, BF3.octet, { t, rings: true, faces: [0], tau: 1 });
          const R = layoutMol(BF3, { x: 400, y: 6, w: 390, h: 330 }, { maxL: 104, maxR: 28, minR: 26, margin: 58 });
          const q = ease.out(seg(p, 0.35, 0.65));
          g.save(); g.globalAlpha *= q;
          drawState(g, BF3, R, BF3_BAD, { t, tau: 1, fc: true, faces: [0], mood: () => 'wow' });
          g.restore();
          Art.strike(g, 440, 40, 760, 310, seg(p, 0.7, 0.95), C.red, 8);
          Art.text(g, 'B sees 6: correct', 205, 372, { size: 30, color: C.leaf, alpha: seg(p, 0.1, 0.3) });
          Art.text(g, 'F with +1: rejected', 595, 372, { size: 30, color: C.red, alpha: seg(p, 0.75, 0.95) });
          Art.text(g, 'Beryllium does this too. It is fine with 4.', W / 2, 420, { size: 26, color: C.dim, alpha: seg(p, 0.85, 1) });
        },
      },
      {
        say: '<b>Odd electrons.</b> Nitric oxide has $5 + 6 = 11$ electrons. You cannot pair up an odd number, so one electron stays alone. This is a <b>free radical</b>, and it is very reactive.',
        dur: 3.2,
        draw(g, p, t, { W }) {
          const L = layoutMol(NO, { x: 200, y: 30, w: 400, h: 300 }, { maxL: 180, maxR: 50, minR: 46, margin: 80 });
          const q = ease.back(seg(p, 0, 0.3));
          g.save(); g.translate(400, 180); g.scale(q, q); g.translate(-400, -180);
          drawState(g, NO, L, NO.octet, { t, faces: true, tau: 1, mood: (i) => (i === 0 ? 'wow' : 'happy') });
          g.restore();
          Art.text(g, '5 + 6 = 11', 124, 92, { font: 'display', size: 42, color: C.sun, alpha: seg(p, 0.15, 0.3) });
          Art.text(g, 'odd!', 124, 140, { font: 'display', size: 38, color: C.red, alpha: seg(p, 0.25, 0.4) });
          Art.text(g, 'N sees 7', L.P[0].x, 340, { size: 30, color: C.violet, alpha: seg(p, 0.45, 0.6) });
          Art.text(g, 'O sees 8', L.P[1].x, 340, { size: 30, color: C.leaf, alpha: seg(p, 0.5, 0.65) });
          Art.text(g, 'Quick test: an odd total means a radical.', W / 2, 400, { size: 30, color: C.cyan, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: '<b>Too many.</b> Sulfur in $\\ce{SF6}$ sees 12 electrons. Six bonds use $6 \\times 2 = 12$ of them, which is more than an octet. This is an <b>expanded octet</b>.',
        dur: 3.2,
        draw(g, p, t) {
          const L = layoutMol(SF6, { x: 40, y: 6, w: 470, h: 436 }, { maxL: 150, maxR: 30, minR: 26, margin: 62 });
          drawState(g, SF6, L, SF6.octet, { t, tau: 1, faces: [0] });
          const c = L.P[0];
          Art.ring(g, c.x, c.y, 62, { color: C.sun, w: 5, dash: [8, 7], p: seg(p, 0.1, 0.7) });
          Art.text(g, String(Math.max(2, 2 * Math.round(6 * seg(p, 0.1, 0.7)))), 630, 170, { font: 'display', size: 110, color: C.sun });
          Art.text(g, 'around sulfur', 630, 246, { size: 30, alpha: seg(p, 0.5, 0.7) });
          Art.text(g, 'and it is fine', 630, 288, { size: 28, color: C.leaf, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: 'Why sulfur and not oxygen? Atoms in <b>period 3 and below</b> are bigger, so more neighbors fit around them. Period 2 atoms stop at 8. Older books credit empty d orbitals, but size is a big part of the story.',
        dur: 3.6,
        draw(g, p, t) {
          // Radii in stage units come from covalent radii.
          const k = 0.72;
          const draw6 = (cx, cy, el, q) => {
            const r0 = EL[el].rcov * k, rF = EL.F.rcov * k, d = r0 + rF;
            for (let i = 0; i < 6; i++) {
              const a = (i / 6) * TAU - Math.PI / 2;
              const dd = lerp(d + 90, d, q);
              Art.atom(g, cx + Math.cos(a) * dd, cy + Math.sin(a) * dd, rF, 'F', { label: 'F', alpha: q });
            }
            Art.atom(g, cx, cy, r0, el, { face: el === 'O' ? 'grumpy' : 'happy', t, label: el });
          };
          const q = ease.inOut(seg(p, 0.1, 0.65));
          draw6(214, 178, 'O', q);
          draw6(586, 178, 'S', q);
          Art.text(g, 'Shoulder to shoulder on O', 214, 368, { size: 27, color: C.red, alpha: seg(p, 0.65, 0.85) });
          Art.text(g, 'More elbow room on S', 586, 368, { size: 27, color: C.leaf, alpha: seg(p, 0.65, 0.85) });
          Art.text(g, 'A simplified picture, with atoms drawn at their covalent radii', 400, 416, { size: 23, color: C.dim, alpha: seg(p, 0.75, 0.95) });
        },
      },
      {
        say: 'For these, the recipe still works: extra electrons go on the center. $\\ce{XeF4}$ has 36. Bonds take 8 and the fluorines take 24, leaving <b>4 electrons</b>, so xenon holds 2 lone pairs.',
        dur: 3.4,
        draw(g, p, t) {
          const L = layoutMol(XEF4, { x: 200, y: 6, w: 560, h: 420 }, { maxL: 140, maxR: 34, minR: 30, margin: 62 });
          const before = XEF4.frames.find((f) => f.kind === 'outer').st, after = XEF4.frames.find((f) => f.kind === 'central').st;
          const q = seg(p, 0.35, 0.8);
          drawState(g, XEF4, L, after, { prev: before, tau: q, t, faces: [0], mood: () => 'happy' });
          const c = L.P[0];
          if (q >= 1) { Art.ring(g, c.x, c.y, 78, { color: C.pink, w: 4, dash: [7, 7] }); }
          const rows = [['36', 'total', C.sun], [`${MINUS} 8`, 'in 4 bonds', C.ink], [`${MINUS} 24`, 'on the F atoms', C.ink], ['= 4', 'on Xe', C.leaf]];
          rows.forEach(([a, b, col], i) => {
            const al = seg(p, 0.02 + i * 0.13, 0.12 + i * 0.13);
            Art.text(g, a, 112, 110 + i * 82, { font: 'display', size: 42, color: col, alpha: al, align: 'right' });
            Art.text(g, b, 124, 110 + i * 82, { size: 24, align: 'left', alpha: al, color: C.dim });
          });
        },
      },
    ],
  });
});
