/* Lesson 17: Nuclear chemistry. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const DARK = '#1A0F2E';
  const elZ = (z) => window.ELEMENTS[z - 1];

  /* ---------- Nuclei, drawn with their real counts of protons and neutrons ---------- */
  const nucR = (A) => 15 * Math.cbrt(A);
  const sprites = new Map();
  /** Pack exactly A balls in a disc (golden angle), exactly Z of them protons. Radius grows as the cube root of A, as real nuclei do. */
  function nucleusSprite(A, Z) {
    const key = A + '|' + Z;
    let c = sprites.get(key);
    if (c) return c;
    const R = nucR(A), r = A === 1 ? R * 0.85 : Math.max(5, R * Math.sqrt(0.86 / A));
    const pad = r + 5, half = R + pad, S = 3;
    c = document.createElement('canvas');
    c.width = c.height = Math.ceil(half * 2 * S);
    const x = c.getContext('2d');
    x.scale(S, S); x.translate(half, half);
    // A repeatable shuffle decides which spots are protons.
    const order = Array.from({ length: A }, (_, i) => i);
    for (let i = A - 1; i > 0; i--) { const j = Math.floor(rand(i * 1.37 + A) * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const proton = new Set(order.slice(0, Z));
    for (let i = A - 1; i >= 0; i--) {
      const rr = A === 1 ? 0 : R * Math.sqrt((i + 0.5) / A), a = i * 2.39996;
      const b = r * (1 + 0.2 * (1 - rr / R));
      Art.ball(x, Math.cos(a) * rr, Math.sin(a) * rr, b, proton.has(i) ? C.proton : C.neutron);
    }
    c._half = half;
    sprites.set(key, c);
    return c;
  }
  /** o: { scale, face, look, t, seed, glow, alpha, shake } */
  function nucleus(g, x, y, A, Z, o = {}) {
    const s = o.scale || 1, c = nucleusSprite(A, Z), h = c._half * s, R = nucR(A) * s;
    const prev = g.globalAlpha;
    if (o.alpha !== undefined) g.globalAlpha = prev * o.alpha;
    if (o.glow) Art.glow(g, x, y, R * 1.7, o.glowColor || C.sun, 0.55 * o.glow);
    g.drawImage(c, x - h, y - h, h * 2, h * 2);
    if (o.face) {
      // A soft dim patch lets the face read over the busy texture.
      Art.glow(g, x, y - R * 0.04, R * 1.02, '#2B1A4A', 0.62);
      Art.face(g, x, y - R * 0.05, R * 0.82, o.face, { look: o.look, t: o.t, seed: o.seed });
    }
    g.globalAlpha = prev;
  }
  const faded = (g, a, draw) => { if (a <= 0) return; const p = g.globalAlpha; g.globalAlpha = p * a; draw(); g.globalAlpha = p; };
  function fm(g, f, x, y, o = {}) { faded(g, o.alpha === undefined ? 1 : o.alpha, () => Art.formula(g, f, x, y, o)); }

  /** Nuclide notation: mass number above, atomic number below, and the symbol. Returns the width. */
  function nuclideWidth(g, n, S) {
    g.font = `400 ${S}px ${Art.FONT_DISPLAY}`; const sw = g.measureText(n.sym).width;
    g.font = `400 ${S * 0.54}px ${Art.FONT_DISPLAY}`;
    const aw = Math.max(g.measureText(String(n.A)).width, g.measureText(String(n.Z)).width);
    g.font = `400 ${S}px ${Art.FONT_DISPLAY}`;
    const cw = n.coef ? g.measureText(String(n.coef)).width + 5 : 0;
    return { sw, aw, cw, w: cw + sw + aw + 4 };
  }
  function nuclide(g, n, x, S, y, o = {}) {
    const { sw, aw, cw, w } = nuclideWidth(g, n, S);
    const a = o.alpha === undefined ? 1 : o.alpha;
    if (n.coef) { Art.text(g, String(n.coef), x, y, { font: 'display', size: S, align: 'left', alpha: a }); x += cw; }
    Art.text(g, String(n.A), x + aw, y - S * 0.46, { font: 'display', size: S * 0.54, align: 'right', color: C.sun, alpha: a });
    Art.text(g, String(n.Z).replace('-', '−'), x + aw, y + S * 0.46, { font: 'display', size: S * 0.54, align: 'right', color: C.cyan, alpha: a });
    Art.text(g, n.sym, x + aw + 4, y, { font: 'display', size: S, align: 'left', color: o.color || C.ink, alpha: a });
    void sw;
    return w;
  }
  /** Lay out a nuclear equation, centered on cx. parts: nuclide objects and the strings '+' or '->'. */
  function equation(g, parts, cx, y, S, o = {}) {
    const gap = S * 0.36;
    const widths = parts.map((p) => {
      if (p === '->') return S * 1.05;
      if (p === '+') { g.font = `400 ${S * 0.8}px ${Art.FONT_DISPLAY}`; return g.measureText('+').width; }
      return nuclideWidth(g, p, S).w;
    });
    const total = widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
    let x = cx - total / 2;
    const a = o.alpha === undefined ? 1 : o.alpha;
    parts.forEach((p, i) => {
      const ap = o.reveal ? a * clamp(o.reveal * parts.length * 1.2 - i) : a;
      if (p === '->') Art.arrow(g, x + 3, y, x + widths[i] - 3, y, { color: C.ink, w: 5, head: 15, alpha: ap });
      else if (p === '+') Art.text(g, '+', x + widths[i] / 2, y, { font: 'display', size: S * 0.8, alpha: ap });
      else nuclide(g, p, x, S, y, { alpha: ap, color: p.color });
      x += widths[i] + gap;
    });
  }
  /** The two conservation checks, as a pair of lines of big numbers. */
  function checks(g, topStr, botStr, y, a = 1) {
    Art.text(g, 'Top: ' + topStr, 215, y, { font: 'display', size: 28, color: C.sun, alpha: a, halo: true });
    Art.text(g, 'Bottom: ' + botStr, 585, y, { font: 'display', size: 28, color: C.cyan, alpha: a, halo: true });
  }
  function gammaWave(g, x0, y0, x1, y1, t, a = 1, o = {}) {
    const d = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / d, uy = (y1 - y0) / d;
    g.save(); g.globalAlpha *= a; g.strokeStyle = o.color || C.leaf; g.lineWidth = o.w || 5; g.lineCap = 'round'; g.lineJoin = 'round';
    g.shadowColor = o.color || C.leaf; g.shadowBlur = 8;
    g.beginPath();
    for (let i = 0; i <= 80; i++) {
      const s = (i / 80) * d, w = Math.sin(s * 0.24 - t * 8) * (o.amp || 13);
      const px = x0 + ux * s - uy * w, py = y0 + uy * s + ux * w;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.stroke(); g.restore();
  }
  /** A positron: like an electron, with a plus sign. */
  function positron(g, x, y, r = 11) {
    Art.glow(g, x, y, r * 2.6, C.pink, 0.55); Art.ball(g, x, y, r, C.pink);
    Art.text(g, '+', x, y, { size: r * 1.7, color: '#fff' });
  }
  function electronMinus(g, x, y, r = 11) {
    Art.electron(g, x, y, r); Art.text(g, '−', x, y, { size: r * 1.7, color: '#06324A' });
  }
  /** Motion for something flung out of a nucleus. */
  const fling = (x0, y0, x1, y1, q, lift = 0) => ({ x: lerp(x0, x1, q), y: lerp(y0, y1, q) - Math.sin(q * Math.PI) * lift });

  /* ---------- Story 1: the kinds of decay ---------- */
  function miniAtom(g, cx, cy, t, o = {}) {
    [78, 128].forEach((R) => { g.strokeStyle = 'rgba(247,242,255,.28)'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke(); });
    const el = o.electrons;
    [[78, 2], [128, 4]].forEach(([R, n], ring) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + t * (ring ? -0.5 : 0.8) + ring;
        Art.electron(g, cx + Math.cos(a) * R, cy + Math.sin(a) * R, el ? 10 : 7);
      }
    });
    nucleus(g, cx, cy, 12, 6, { scale: o.nucScale || 1, glow: o.glow || 0 });
  }
  Lab.story('#story-decay', {
    title: 'What an unstable nucleus does',
    scenes: [
      {
        say: 'Chemical reactions only move <b>electrons</b>, so the atom stays the same element. Nuclear reactions change the <b>nucleus</b>, and that can turn it into a different element.',
        dur: 3.6,
        draw(g, p, t) {
          const a = ease.out(seg(p, 0, 0.3)), b = ease.out(seg(p, 0.3, 0.6));
          Art.text(g, 'Chemistry', 205, 40, { font: 'display', size: 38, color: C.cyan, alpha: a });
          faded(g, a, () => miniAtom(g, 205, 200, t, { electrons: true }));
          Art.ring(g, 205, 200, 128, { color: C.cyan, w: 6, p: seg(p, 0.1, 0.35) });
          Art.text(g, 'electrons move', 205, 368, { size: 28, alpha: a });
          Art.text(g, 'same element', 205, 406, { size: 28, color: C.dim, alpha: a });
          Art.text(g, 'Nuclear chemistry', 595, 40, { font: 'display', size: 38, color: C.pink, alpha: b });
          faded(g, b, () => miniAtom(g, 595, 200, t, { nucScale: 1.25, glow: 1 }));
          Art.ring(g, 595, 200, 50, { color: C.pink, w: 6, p: seg(p, 0.42, 0.65) });
          Art.text(g, 'nucleus changes', 595, 368, { size: 28, alpha: b });
          Art.text(g, 'new element', 595, 406, { size: 28, color: C.dim, alpha: b });
          Art.text(g, 'not to scale', 400, 432, { size: 20, color: C.dim, alpha: b });
          Art.moe(g, 400, 320, 110, 'think', { t });
        },
      },
      {
        say: 'Meet the notation first. The top number is the <b>mass number</b> $A$, protons plus neutrons. The bottom number is the <b>atomic number</b> $Z$, just the protons.',
        dur: 3.6,
        draw(g, p, t) {
          const a = ease.out(seg(p, 0, 0.3));
          faded(g, a, () => nucleus(g, 180, 200, 238, 92, { face: 'grumpy', t, look: [1, 0], scale: 1.18 }));
          Art.text(g, 'uranium-238', 180, 36, { font: 'display', size: 32, alpha: a });
          Art.text(g, '92 protons', 180, 352, { size: 28, color: C.proton, alpha: seg(p, 0.5, 0.75), halo: true });
          Art.text(g, '146 neutrons', 180, 392, { size: 28, color: '#D5CEE3', alpha: seg(p, 0.5, 0.75), halo: true });
          const n = seg(p, 0.15, 0.4);
          nuclide(g, { A: 238, Z: 92, sym: 'U' }, 438, 136, 212, { alpha: n });
          const at = seg(p, 0.35, 0.6), zt = seg(p, 0.55, 0.8);
          Art.text(g, 'mass number A', 628, 46, { font: 'display', size: 32, color: C.sun, alpha: at });
          Art.text(g, 'protons + neutrons', 628, 82, { size: 26, alpha: at });
          Art.arrow(g, 506, 62, 478, 112, { color: C.sun, w: 5, p: at, curve: 10 });
          Art.text(g, 'atomic number Z', 628, 370, { font: 'display', size: 32, color: C.cyan, alpha: zt });
          Art.text(g, 'protons only', 628, 406, { size: 26, alpha: zt });
          Art.arrow(g, 506, 368, 490, 322, { color: C.cyan, w: 5, p: zt, curve: -8 });
        },
      },
      {
        say: '<b>Alpha decay.</b> A heavy nucleus throws out a clump of 2 protons and 2 neutrons, which is a helium nucleus. The top number drops by 4 and the bottom number drops by 2.',
        dur: 4,
        draw(g, p, t) {
          const q = ease.out(seg(p, 0.15, 0.6));
          const after = q > 0.02;
          const shake = q <= 0 ? Math.sin(t * 40) * 2 * seg(p, 0, 0.15) : 0;
          nucleus(g, 190 + shake, 140, after ? 234 : 238, after ? 90 : 92, { face: after ? 'happy' : 'grumpy', t, look: [1, 0], scale: 1 });
          Art.text(g, after ? 'thorium-234' : 'uranium-238', 190, 262, { font: 'display', size: 28, halo: true });
          const P = fling(240, 130, 610, 120, q);
          if (q > 0) {
            Art.arrow(g, 300, 130, P.x - 52, P.y + 2, { color: C.sun, w: 5, alpha: 0.75, dash: [10, 10] });
            nucleus(g, P.x, P.y + wander(2, t) * 2, 4, 2, { scale: 1.9, glow: 1 });
          }
          Art.text(g, 'alpha particle', 610, 40, { font: 'display', size: 30, color: C.sun, alpha: seg(p, 0.5, 0.72) });
          Art.text(g, '2 protons, 2 neutrons', 610, 212, { size: 25, alpha: seg(p, 0.55, 0.75) });
          equation(g, [{ A: 238, Z: 92, sym: 'U' }, '->', { A: 234, Z: 90, sym: 'Th' }, '+', { A: 4, Z: 2, sym: 'He' }], 400, 330, 48, { alpha: seg(p, 0.45, 0.7) });
          checks(g, '238 = 234 + 4', '92 = 90 + 2', 414, seg(p, 0.7, 0.9));
        },
      },
      {
        say: '<b>Beta decay.</b> Inside the nucleus, a neutron turns into a proton and an electron. The electron shoots out. The mass number stays the same, and the atomic number goes <b>up by 1</b>.',
        dur: 4.2,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.2, 0.62));
          nucleus(g, 150, 150, 14, q > 0.5 ? 7 : 6, { scale: 2.1, face: q > 0.5 ? 'happy' : 'grumpy', t, look: [1, 0] });
          Art.text(g, q > 0.5 ? 'nitrogen-14' : 'carbon-14', 150, 276, { font: 'display', size: 28, halo: true });
          Art.zoom(g, 196, 150, 520, 150, 134, (gg, cx, cy, R) => {
            const r = 50;
            if (q < 0.5) { Art.ball(gg, cx - 40, cy, r, C.neutron); Art.text(gg, 'neutron', cx - 40, cy + 2, { size: 22, color: '#22123A' }); }
            else {
              Art.ball(gg, cx - 40, cy, r, C.proton); Art.text(gg, 'proton', cx - 40, cy + 2, { size: 23, color: '#fff' });
            }
            if (q > 0.5) {
              const e = ease.out(seg(q, 0.5, 1));
              electronMinus(gg, lerp(cx - 20, cx + R * 0.62, e), cy - Math.sin(e * 3.1) * 44, 19);
            }
            void R;
          }, { p: seg(p, 0, 0.2), rim: C.cyan });
          fm(g, 'e^-', 708, 60, { size: 40, color: C.cyan, halo: true, alpha: seg(p, 0.6, 0.8) });
          Art.text(g, 'flies out', 712, 100, { size: 24, color: C.cyan, alpha: seg(p, 0.6, 0.8), halo: true });
          equation(g, [{ A: 14, Z: 6, sym: 'C' }, '->', { A: 14, Z: 7, sym: 'N' }, '+', { A: 0, Z: -1, sym: 'e' }], 400, 330, 48, { alpha: seg(p, 0.45, 0.7) });
          checks(g, '14 = 14 + 0', '6 = 7 + (−1)', 414, seg(p, 0.7, 0.9));
        },
      },
      {
        say: '<b>Going the other way.</b> A proton can become a neutron. It can emit a <b>positron</b>, or pull in an inner electron, which is <b>electron capture</b>. Either way, the atomic number goes <b>down by 1</b>.',
        dur: 4.2,
        draw(g, p, t) {
          const a = ease.out(seg(p, 0, 0.25)), b = ease.out(seg(p, 0.45, 0.68));
          const panel = (y, al) => { faded(g, al, () => { g.fillStyle = 'rgba(26,15,46,.72)'; Art.round(g, 18, y, 764, 190, 22); g.fill(); }); };
          panel(18, a); panel(232, b);
          // Positron emission.
          Art.text(g, 'Positron emission', 400, 48, { font: 'display', size: 30, color: C.pink, alpha: a });
          const q1 = ease.out(seg(p, 0.12, 0.45));
          faded(g, a, () => {
            nucleus(g, 110, 118, 18, q1 > 0.5 ? 8 : 9, { scale: 1.28, face: q1 > 0.5 ? 'happy' : 'grumpy', t, look: [1, 0] });
            positron(g, lerp(170, 256, q1), 118 - Math.sin(q1 * 3.1) * 26, 15);
          });
          equation(g, [{ A: 18, Z: 9, sym: 'F' }, '->', { A: 18, Z: 8, sym: 'O' }, '+', { A: 0, Z: '+1', sym: 'e' }], 530, 122, 44, { alpha: a });
          // Electron capture.
          Art.text(g, 'Electron capture', 400, 262, { font: 'display', size: 30, color: C.cyan, alpha: b });
          const q2 = ease.inOut(seg(p, 0.58, 0.92));
          faded(g, b, () => {
            g.strokeStyle = 'rgba(247,242,255,.3)'; g.lineWidth = 2.5; g.beginPath(); g.arc(110, 334, 68, 0, TAU); g.stroke();
            nucleus(g, 110, 334, 7, q2 > 0.9 ? 3 : 4, { scale: 1.45, face: q2 > 0.9 ? 'happy' : 'grumpy', t, look: [1, 0] });
            if (q2 < 0.98) { const R = 68 * (1 - q2 * 0.7), ang = -0.6 + q2 * 5; electronMinus(g, 110 + Math.cos(ang) * R, 334 + Math.sin(ang) * R, 14); }
          });
          equation(g, [{ A: 7, Z: 4, sym: 'Be' }, '+', { A: 0, Z: -1, sym: 'e' }, '->', { A: 7, Z: 3, sym: 'Li' }], 530, 340, 44, { alpha: b });
        },
      },
      {
        say: '<b>Gamma emission.</b> Sometimes a nucleus just has too much energy. It calms down by giving off a <b>gamma ray</b>, a burst of very high-energy light. Nothing else changes, so $A$ and $Z$ stay the same.',
        dur: 3.8,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.2, 0.5));
          nucleus(g, 190, 150, 99, 43, { scale: 1.24, face: q > 0.5 ? 'happy' : 'wow', t, look: [1, -0.4], glow: 1 - q, glowColor: C.leaf });
          Art.text(g, q > 0.5 ? 'calm technetium-99' : 'excited technetium-99m', 216, 280, { font: 'display', size: 26, halo: true });
          if (q > 0) gammaWave(g, 280, 138, lerp(280, 590, ease.out(q)), 88, t, 1, { amp: 15, w: 6 });
          Art.text(g, 'gamma ray: pure energy', 490, 52, { font: 'display', size: 30, color: C.leaf, alpha: seg(p, 0.4, 0.6) });
          Art.moe(g, 700, 280, 140, 'point', { t, flip: true });
          equation(g, [{ A: '99m', Z: 43, sym: 'Tc' }, '->', { A: 99, Z: 43, sym: 'Tc' }, '+', { A: 0, Z: 0, sym: 'γ' }], 400, 342, 48, { alpha: seg(p, 0.45, 0.7) });
          checks(g, '99 = 99 + 0', '43 = 43 + 0', 418, seg(p, 0.7, 0.9));
        },
      },
      {
        say: 'They differ in how far they get. <b>Paper stops alpha</b>, <b>aluminum stops beta</b>, and <b>gamma</b> gets through nearly everything. Easy to stop does not mean safe: alpha sources are very harmful if breathed in or swallowed.',
        dur: 4.4,
        draw(g, p, t) {
          const walls = [[258, 10, '#F5EFDC', 'paper'], [486, 24, '#BFC6D6', 'aluminum'], [662, 64, '#5C6274', 'thick lead']];
          const on = ease.out(seg(p, 0, 0.3));
          // Source.
          faded(g, on, () => {
            const sg = g.createLinearGradient(30, 0, 100, 0);
            sg.addColorStop(0, '#6F6B8E'); sg.addColorStop(1, '#3D3958');
            g.fillStyle = sg; g.strokeStyle = DARK; g.lineWidth = 3;
            Art.round(g, 26, 68, 74, 300, 14); g.fill(); g.stroke();
            Art.text(g, 'source', 63, 400, { size: 24 });
          });
          walls.forEach(([x, w, col, name], i) => {
            const a = ease.out(seg(p, 0.05 + i * 0.1, 0.25 + i * 0.1));
            faded(g, a, () => {
              const wg = g.createLinearGradient(x, 0, x + w, 0);
              wg.addColorStop(0, Art.mix(col, '#ffffff', 0.25)); wg.addColorStop(1, Art.mix(col, '#000000', 0.2));
              g.fillStyle = wg; g.strokeStyle = DARK; g.lineWidth = 2.5;
              Art.round(g, x, 62, w, 312, 3); g.fill(); g.stroke();
            });
            Art.text(g, name, x + w / 2, 400, { size: 25, alpha: a });
          });
          const lane = { a: 115, b: 215, g: 315 };
          const go = seg(p, 0.25, 0.4);
          // Alpha stops at the paper.
          faded(g, go, () => {
            for (let i = 0; i < 3; i++) {
              const u = (t * 0.55 + i / 3) % 1;
              const x = lerp(112, 240, u);
              nucleus(g, x, lane.a + Math.sin(i * 2) * 8, 4, 2, { scale: 0.86, alpha: clamp((1 - u) * 8) });
            }
            for (let i = 0; i < 4; i++) {
              const u = (t * 0.7 + i / 4) % 1;
              const x = lerp(112, 478, u);
              electronMinus(g, x, lane.b + Math.sin(i * 3 + u * 9) * 6, 9);
            }
            gammaWave(g, 104, lane.g, 662, lane.g, t, 1, { w: 5, amp: 12 });
            gammaWave(g, 726, lane.g, 796, lane.g, t, 0.34, { w: 4, amp: 8 });
          });
          Art.text(g, 'α', 62, lane.a, { font: 'display', size: 44, color: C.sun, alpha: on });
          Art.text(g, 'β', 62, lane.b, { font: 'display', size: 44, color: C.cyan, alpha: on });
          Art.text(g, 'γ', 62, lane.g, { font: 'display', size: 44, color: C.leaf, alpha: on });
          const warn = seg(p, 0.65, 0.85);
          Art.text(g, 'harmful if inhaled', 376, lane.a, { size: 24, color: '#FF9AA6', alpha: warn, halo: true });
          Art.text(g, 'some', 763, lane.g - 62, { size: 22, color: C.leaf, alpha: seg(p, 0.5, 0.7), halo: true });
          Art.text(g, 'passes', 763, lane.g - 36, { size: 22, color: C.leaf, alpha: seg(p, 0.5, 0.7), halo: true });
        },
      },
    ],
  });

  /* ---------- Bench: decay equation builder ---------- */
  const ISO = {
    'U-238': { sym: 'U', A: 238, Z: 92, real: ['alpha'], hl: '4.47 billion years' },
    'Ra-226': { sym: 'Ra', A: 226, Z: 88, real: ['alpha'], hl: '1,600 years' },
    'Rn-222': { sym: 'Rn', A: 222, Z: 86, real: ['alpha'], hl: '3.82 days' },
    'Po-210': { sym: 'Po', A: 210, Z: 84, real: ['alpha'], hl: '138 days' },
    'Am-241': { sym: 'Am', A: 241, Z: 95, real: ['alpha'], hl: '432 years' },
    'C-14': { sym: 'C', A: 14, Z: 6, real: ['beta'], hl: '5,730 years' },
    'H-3': { sym: 'H', A: 3, Z: 1, real: ['beta'], hl: '12.3 years' },
    'Co-60': { sym: 'Co', A: 60, Z: 27, real: ['beta'], hl: '5.27 years' },
    'Sr-90': { sym: 'Sr', A: 90, Z: 38, real: ['beta'], hl: '28.8 years' },
    'I-131': { sym: 'I', A: 131, Z: 53, real: ['beta'], hl: '8.02 days' },
    'Cs-137': { sym: 'Cs', A: 137, Z: 55, real: ['beta'], hl: 'About 30 years' },
    'K-40': { sym: 'K', A: 40, Z: 19, real: ['beta', 'ec'], hl: '1.25 billion years' },
    'F-18': { sym: 'F', A: 18, Z: 9, real: ['positron', 'ec'], hl: '110 minutes' },
    'C-11': { sym: 'C', A: 11, Z: 6, real: ['positron'], hl: '20.4 minutes' },
    'Be-7': { sym: 'Be', A: 7, Z: 4, real: ['ec'], hl: '53 days' },
    'Tc-99m': { sym: 'Tc', A: 99, Z: 43, m: true, real: ['gamma'], hl: '6.0 hours' },
  };
  const MODES = {
    alpha: { dA: -4, dZ: -2, name: 'alpha particle', p: { A: 4, Z: 2, sym: 'He' } },
    beta: { dA: 0, dZ: 1, name: 'beta particle', p: { A: 0, Z: -1, sym: 'e' } },
    positron: { dA: 0, dZ: -1, name: 'positron', p: { A: 0, Z: '+1', sym: 'e' } },
    ec: { dA: 0, dZ: -1, name: 'captured electron', p: { A: 0, Z: -1, sym: 'e' }, left: true },
    gamma: { dA: 0, dZ: 0, name: 'gamma ray', p: { A: 0, Z: 0, sym: 'γ' } },
  };
  const MODE_WORD = { alpha: 'alpha decay', beta: 'beta decay', positron: 'positron emission', ec: 'electron capture', gamma: 'gamma emission' };
  const b = { iso: 'U-238', mode: 'alpha', t0: 0 };
  const dispScale = (A) => (nucR(A) < 52 ? 52 / nucR(A) : Math.min(1, 92 / nucR(A)));
  function builderState() {
    const I = ISO[b.iso], M = MODES[b.mode];
    const Z2 = I.Z + M.dZ, A2 = I.A + M.dA;
    const possible = Z2 >= 1 && A2 >= Z2;
    const prodEl = possible ? elZ(Z2) : null;
    const real = I.real.includes(b.mode);
    return { I, M, Z2, A2, possible, prodEl, real, nameOf: (el, A, m) => `${el.name.toLowerCase()}-${A}${m ? 'm' : ''}` };
  }
  const builderStage = Lab.stage('#c-builder', {
    label: 'A nucleus on the left decays into a product nucleus, with the particle flying out. The balanced nuclear equation sits below, with the top and bottom numbers checked.',
    draw(g, t, dt, st) {
      const S = builderState();
      const { I, M } = S;
      const el = t - b.t0;
      const q = Lab.reducedMotion ? 1 : ease.inOut(clamp((el - 0.25) / 1.1));
      const pop = Lab.reducedMotion ? 1 : ease.back(clamp((el - 0.65) / 0.5));
      const y = 126, xP = 150, xD = 455;
      const sP = dispScale(I.A);
      const rP = nucR(I.A) * sP;
      const shake = q < 0.02 && el < 0.3 ? Math.sin(t * 50) * 2.5 : 0;
      nucleus(g, xP + shake, y, I.A, I.Z, { scale: sP, face: q > 0.6 && !S.possible ? 'sad' : 'grumpy', t, look: [1, 0], glow: b.mode === 'gamma' ? 1 - q : 0, glowColor: C.leaf });
      const name = `${elZ(I.Z).name.toLowerCase()}-${I.A}${I.m ? 'm' : ''}`;
      Art.text(g, name, xP, 244, { font: 'display', size: 28, halo: true });
      Art.arrow(g, xP + rP + 18, y, xD - 96, y, { color: C.ink, w: 6, head: 17, alpha: 0.85 });
      if (S.possible) {
        const sD = dispScale(S.A2);
        if (pop > 0) {
          Art.popIn(g, xD, y, clamp(pop), (gg) => nucleus(gg, 0, 0, S.A2, S.Z2, { scale: sD, face: 'happy', t, look: [1, 0], seed: 2 }));
          const nm = `${S.prodEl.name.toLowerCase()}-${S.A2}`;
          Art.text(g, nm, xD, 244, { font: 'display', size: 28, halo: true, alpha: clamp(pop) });
        }
        // The particle.
        const xE = 680, yE = 112;
        if (b.mode === 'alpha') {
          const P = fling(xP + 20, y - 10, xE, yE, q, 112);
          nucleus(g, P.x, P.y, 4, 2, { scale: 1.7, glow: 0.8 });
        } else if (b.mode === 'beta' || b.mode === 'positron') {
          const P = fling(xP + 20, y - 10, xE, yE, q, 112);
          if (b.mode === 'beta') electronMinus(g, P.x, P.y, 17); else positron(g, P.x, P.y, 17);
        } else if (b.mode === 'ec') {
          const R = lerp(rP + 40, 0, q), ang = q * 6.5 - 1;
          if (q < 0.98) electronMinus(g, xP + Math.cos(ang) * R, y + Math.sin(ang) * R, 15);
          if (q > 0.5) Art.text(g, 'electron pulled in', 668, y, { size: 24, color: C.cyan, alpha: seg(q, 0.6, 1), maxW: 220 });
        } else if (b.mode === 'gamma') {
          gammaWave(g, xD + 62, y - 14, lerp(xD + 62, 780, q), y - 34, t, Math.min(1, q * 4), { amp: 14, w: 5 });
        }
        if (b.mode !== 'ec') Art.text(g, M.name, 680, 214, { size: 25, color: b.mode === 'gamma' ? C.leaf : b.mode === 'alpha' ? C.sun : b.mode === 'beta' ? C.cyan : C.pink, alpha: clamp(pop), halo: true });
        // The verdict.
        const col = S.real ? '#128A52' : '#B46A08';
        Art.pill(g, S.real ? 'Nature really does this' : 'Balanced, but not what this nucleus really does', 400, 284, { size: 23, color: col, text: '#fff', alpha: clamp(pop) });
        // The equation.
        const parent = { A: I.m ? I.A + 'm' : I.A, Z: I.Z, sym: I.sym };
        const prod = { A: S.A2, Z: S.Z2, sym: S.prodEl.sym };
        const parts = M.left ? [parent, '+', M.p, '->', prod] : [parent, '->', prod, '+', M.p];
        equation(g, parts, 400, 348, 46, { alpha: clamp(pop) });
        const zp = M.p.Z === '+1' ? 1 : M.p.Z;
        const fmtZ = zp < 0 ? `(−${-zp})` : zp;
        const top = M.left ? `${I.A} + 0 = ${S.A2}` : `${I.A} = ${S.A2} + ${M.p.A}`;
        const bot = M.left ? `${I.Z} + ${fmtZ} = ${S.Z2}` : `${I.Z} = ${S.Z2} + ${fmtZ}`;
        checks(g, top, bot, 420, clamp(pop));
      } else {
        Art.text(g, 'Not possible', xD + 90, y - 10, { font: 'display', size: 38, color: C.red });
        Art.para(g, 'This nucleus does not have enough protons for that.', xD + 90, y + 24, 340, { size: 25, align: 'center' });
        Art.moe(g, 400, 420, 120, 'oops', { t });
      }
      void dt; void st; void rand;
    },
  });
  function paintBuilder() {
    const S = builderState();
    const { I } = S;
    const parentName = `${elZ(I.Z).name.toLowerCase()}-${I.A}${I.m ? 'm' : ''}`;
    Lab.$('#b-prod').textContent = S.possible ? `${S.prodEl.name} (${S.prodEl.sym}), Z = ${S.Z2}` : 'None';
    Lab.$('#b-hl').textContent = I.hl;
    const realWords = I.real.map((m) => MODE_WORD[m]).join(' and ');
    let note;
    if (!S.possible) {
      note = `<p>${MODE_WORD[b.mode][0].toUpperCase() + MODE_WORD[b.mode].slice(1)} would leave ${parentName} with ${S.Z2 < 0 ? '−' + -S.Z2 : S.Z2} protons, so it cannot happen. In reality, ${parentName} undergoes <b>${realWords}</b>.</p>`;
    } else if (S.real) {
      const extra = b.iso === 'K-40' ? ' Most potassium-40 nuclei undergo beta decay, and about 1 in 9 undergo electron capture.' : b.iso === 'F-18' ? ' About 97 percent emit a positron, and the rest capture an electron.' : b.iso === 'Tc-99m' ? ' The "m" means metastable, a long-lived excited state. Hospitals use it because the gamma ray can be imaged from outside the body.' : b.iso === 'Co-60' ? ' Its product is left excited and then gives off two gamma rays, which is why cobalt-60 is used in radiation therapy.' : '';
      note = `<p><b>Right.</b> ${parentName[0].toUpperCase() + parentName.slice(1)} really undergoes ${MODE_WORD[b.mode]}.${extra} Find $Z$, then look up the element: $Z = ${S.Z2}$ is ${S.prodEl.name.toLowerCase()}.</p>`;
    } else if (b.mode === 'gamma') {
      note = `<p>A gamma ray comes from an <b>excited</b> nucleus, and it usually follows another decay. The ground state of ${parentName} does not just emit one. Its real decay is <b>${realWords}</b>.</p>`;
    } else {
      note = `<p>The numbers balance, so the equation is fine on paper, and exams may ask you to write it. But ${parentName} really undergoes <b>${realWords}</b>. Balancing tells you what the product <em>would</em> be, not whether it happens.</p>`;
    }
    Lab.$('#b-note').innerHTML = Lab.texString(note);
  }
  const replay = () => { b.t0 = builderStage.t; paintBuilder(); builderStage.redraw(); };
  const firstIso = Lab.segmented('#b-iso', (v) => { b.iso = v; replay(); });
  const firstMode = Lab.segmented('#b-mode', (v) => { b.mode = v; replay(); });
  paintBuilder();
  void firstIso; void firstMode;

  /* ---------- Bench: band of stability ---------- */
  const BAND = {
    'C-14': { Z: 6, N: 8, kind: 'beta' }, 'I-131': { Z: 53, N: 78, kind: 'beta' }, 'C-11': { Z: 6, N: 5, kind: 'pos' }, 'I-123': { Z: 53, N: 70, kind: 'pos' },
    'U-238': { Z: 92, N: 146, kind: 'alpha' }, 'Ra-226': { Z: 88, N: 138, kind: 'alpha' }, 'Fe-56': { Z: 26, N: 30, kind: 'stable' }, 'Pb-208': { Z: 82, N: 126, kind: 'stable' },
  };
  /* Stable nuclides near each choice, by Z: list of mass numbers. Nuclides with lifetimes far beyond the age of the universe count as stable here. */
  const STABLE = {
    4: [9], 5: [10, 11], 6: [12, 13], 7: [14, 15], 8: [16, 17, 18],
    24: [50, 52, 53, 54], 25: [55], 26: [54, 56, 57, 58], 27: [59], 28: [58, 60, 61, 62, 64],
    51: [121, 123], 52: [120, 122, 123, 124, 125, 126, 128, 130], 53: [127], 54: [124, 126, 128, 129, 130, 131, 132, 134, 136], 55: [133],
    80: [196, 198, 199, 200, 201, 202, 204], 81: [203, 205], 82: [204, 206, 207, 208], 83: [209],
  };
  const isStable = (Z, N) => (STABLE[Z] || []).includes(Z + N);
  const bandS = { iso: 'I-131', t0: 0 };
  const CH = { x0: 76, x1: 424, y0: 372, y1: 40 };
  const mx = (Z) => lerp(CH.x0, CH.x1, Z / 100), my = (N) => lerp(CH.y0, CH.y1, N / 150);
  /* The line of stable nuclei from the semi-empirical mass formula, a good fit to real data. */
  const stableZ = (A) => A / (1.98 + 0.0155 * Math.pow(A, 2 / 3));
  const stableN = (() => {
    const tbl = [];
    for (let A = 1; A <= 300; A++) tbl.push([stableZ(A), A - stableZ(A)]);
    return (Z) => { for (let i = 1; i < tbl.length; i++) if (tbl[i][0] >= Z) { const q = (Z - tbl[i - 1][0]) / (tbl[i][0] - tbl[i - 1][0]); return lerp(tbl[i - 1][1], tbl[i][1], q); } return tbl[tbl.length - 1][1]; };
  })();
  const PANEL = { x: 456, y: 26, cell: 62, n: 5 };
  const bandStage = Lab.stage('#c-band', {
    label: 'On the left, a plot of neutrons against protons, with stable nuclei forming a green band that curves above the line where neutrons equal protons. On the right, a zoomed-in grid of nearby nuclei shows the chosen nucleus and where one decay step takes it.',
    draw(g, t) {
      const x0 = CH.x0, y0 = CH.y0;
      g.strokeStyle = 'rgba(247,242,255,.45)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x0, CH.y1); g.lineTo(x0, y0); g.lineTo(CH.x1, y0); g.stroke();
      [20, 40, 60, 80, 100].forEach((v) => {
        g.strokeStyle = 'rgba(247,242,255,.1)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(mx(v), y0); g.lineTo(mx(v), CH.y1); g.stroke();
        Art.text(g, String(v), mx(v), y0 + 20, { size: 21, color: C.dim });
      });
      [50, 100, 150].forEach((v) => {
        g.strokeStyle = 'rgba(247,242,255,.1)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x0, my(v)); g.lineTo(CH.x1, my(v)); g.stroke();
        Art.text(g, String(v), x0 - 8, my(v), { size: 21, color: C.dim, align: 'right' });
      });
      Art.text(g, 'Protons, Z', (CH.x0 + CH.x1) / 2, y0 + 52, { font: 'display', size: 26 });
      Art.text(g, 'Neutrons, N', 22, 16, { font: 'display', size: 25, align: 'left' });
      // N = Z.
      g.save(); g.strokeStyle = 'rgba(247,242,255,.55)'; g.lineWidth = 3; g.setLineDash([8, 8]);
      g.beginPath(); g.moveTo(mx(0), my(0)); g.lineTo(mx(100), my(100)); g.stroke(); g.restore();
      Art.text(g, 'N = Z', mx(87), my(100) + 40, { size: 22, halo: true });
      // The band.
      const wid = (Z) => 1 + 0.05 * Z;
      const poly = (from, to, color) => {
        g.beginPath();
        for (let Z = from; Z <= to; Z += 1) { const N = stableN(Z) + wid(Z); const X = mx(Z), Y = my(N); if (Z === from) g.moveTo(X, Y); else g.lineTo(X, Y); }
        for (let Z = to; Z >= from; Z -= 1) { const N = stableN(Z) - wid(Z); g.lineTo(mx(Z), my(N)); }
        g.closePath(); g.fillStyle = color; g.fill();
      };
      poly(1, 83, 'rgba(61,220,132,.72)');
      g.save(); g.beginPath(); g.rect(0, CH.y1 - 6, 800, 400); g.clip();
      poly(83, 100, 'rgba(255,138,43,.42)');
      g.restore();
      // Region labels.
      Art.text(g, 'too many neutrons', 196, 74, { font: 'display', size: 23, color: C.cyan, halo: true });
      Art.text(g, 'beta decay', 196, 102, { size: 22, color: C.cyan, halo: true });
      Art.text(g, 'too few neutrons', 316, 310, { font: 'display', size: 23, color: C.pink, halo: true });
      Art.text(g, 'positron or capture', 316, 338, { size: 22, color: C.pink, halo: true });
      Art.text(g, 'band of', 144, 190, { font: 'display', size: 23, color: '#9DF2C1', halo: true });
      Art.text(g, 'stability', 144, 218, { font: 'display', size: 23, color: '#9DF2C1', halo: true });
      Art.text(g, 'too big', 374, 124, { font: 'display', size: 23, color: C.fire, halo: true });
      Art.text(g, 'alpha', 374, 150, { size: 22, color: C.fire, halo: true });
      // The chosen nucleus, and the wedge opening into the zoomed-in panel.
      const I = BAND[bandS.iso];
      const dx = mx(I.Z), dy = my(I.N);
      const P = PANEL, size = P.cell * P.n;
      g.fillStyle = 'rgba(255,210,63,.1)';
      g.beginPath(); g.moveTo(dx, dy); g.lineTo(P.x, P.y); g.lineTo(P.x, P.y + size); g.closePath(); g.fill();
      g.save(); g.setLineDash([6, 6]); g.strokeStyle = 'rgba(255,210,63,.5)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(dx, dy); g.lineTo(P.x, P.y); g.moveTo(dx, dy); g.lineTo(P.x, P.y + size); g.stroke(); g.restore();
      Art.glow(g, dx, dy, 30, C.sun, 0.7);
      Art.ball(g, dx, dy, 9, C.sun);
      Art.ring(g, dx, dy, 15, { color: '#fff', w: 3 });
      // The zoomed-in panel: one square for one nucleus. Up means more neutrons, right means more protons.
      g.fillStyle = 'rgba(16,8,32,.92)'; Art.round(g, P.x - 6, P.y - 6, size + 12, size + 12, 16); g.fill();
      g.strokeStyle = C.sun; g.lineWidth = 3; g.stroke();
      const half = Math.floor(P.n / 2);
      const cellX = (Z) => P.x + (Z - I.Z + half) * P.cell, cellY = (N) => P.y + (I.N - N + half) * P.cell;
      for (let Z = I.Z - half; Z <= I.Z + half; Z++) for (let N = I.N - half; N <= I.N + half; N++) {
        const X = cellX(Z), Y = cellY(N), stable = isStable(Z, N), me = Z === I.Z && N === I.N;
        g.fillStyle = me ? C.sun : stable ? '#1F9F5C' : 'rgba(247,242,255,.07)';
        Art.round(g, X + 3, Y + 3, P.cell - 6, P.cell - 6, 8); g.fill();
        const col = me ? '#22123A' : stable ? '#fff' : C.dim;
        Art.text(g, elZ(Z).sym, X + P.cell / 2, Y + P.cell * 0.32, { size: 22, color: col, font: 'display', alpha: me || stable ? 1 : 0.8 });
        Art.text(g, String(Z + N), X + P.cell / 2, Y + P.cell * 0.7, { size: 20, color: col, alpha: me || stable ? 1 : 0.8 });
      }
      // One decay step.
      const steps = { beta: [1, -1], pos: [-1, 1], alpha: [-2, -2] };
      const elapsed = t - bandS.t0;
      const stepQ = Lab.reducedMotion ? 1 : clamp((elapsed - 0.2) * 1.5);
      if (I.kind !== 'stable') {
        const [dz, dn] = steps[I.kind];
        const col = I.kind === 'beta' ? C.cyan : I.kind === 'pos' ? C.pink : C.fire;
        const fx = cellX(I.Z) + P.cell / 2, fy = cellY(I.N) + P.cell / 2;
        const tx = cellX(I.Z + dz) + P.cell / 2, ty = cellY(I.N + dn) + P.cell / 2;
        Art.ring(g, tx, ty, P.cell * 0.56, { color: col, w: 4, p: clamp(stepQ * 2 - 1) });
        const L = Math.hypot(tx - fx, ty - fy), ux = (tx - fx) / L, uy = (ty - fy) / L;
        Art.arrow(g, fx + ux * 30, fy + uy * 30, tx - ux * 34, ty - uy * 34, { color: col, w: 7, head: 17, p: ease.inOut(stepQ) });
      }
      Art.text(g, 'green squares are stable', P.x + size / 2, P.y + size + 28, { size: 22, color: '#9DF2C1' });
      const after = { beta: 'one step lands on green', pos: 'one step lands on green', alpha: 'still not green, so it decays again', stable: 'already on green, so it stays' };
      Art.text(g, after[I.kind], P.x + size / 2, P.y + size + 58, { font: 'display', size: 21, color: C.sun, maxW: 330 });
    },
  });
  function paintBand() {
    const I = BAND[bandS.iso];
    Lab.$('#band-pn').textContent = `${I.Z} p, ${I.N} n`;
    Lab.$('#band-ratio').textContent = (I.N / I.Z).toFixed(2);
    const pred = { beta: 'Beta decay', pos: 'Positron or capture', alpha: 'Alpha decay', stable: 'Stable' };
    Lab.$('#band-pred').textContent = pred[I.kind];
    const why = {
      'C-14': 'Carbon-14 has <b>too many neutrons</b>. Its two stable cousins have 6 and 7 neutrons, and it has 8. Beta decay trades a neutron for a proton and lands on stable nitrogen-14.',
      'I-131': 'The only stable iodine is iodine-127. Iodine-131 has 4 <b>extra neutrons</b>, so beta decay trades one for a proton and lands on stable xenon-131.',
      'C-11': 'Carbon-11 has <b>too few neutrons</b>. A positron emission trades a proton for a neutron and lands on stable boron-11.',
      'I-123': 'Iodine-123 has 4 <b>too few neutrons</b> compared with stable iodine-127. Electron capture trades a proton for a neutron and lands on tellurium-123, which is effectively stable.',
      'U-238': 'Uranium is <b>past bismuth</b> ($Z = 83$), and every nucleus past there is unstable. Alpha decay removes 2 protons and 2 neutrons at once. The chain keeps going, through many steps, until it reaches stable lead-206.',
      'Ra-226': 'Radium is <b>past bismuth</b> ($Z = 83$). Alpha decay removes 2 protons and 2 neutrons at once, giving radon-222, which is also radioactive.',
      'Fe-56': 'Iron-56 is <b>on the band</b>. It does not decay.',
      'Pb-208': 'Lead-208 is <b>on the band</b>, right near its upper end. It does not decay.',
    };
    Lab.$('#band-note').innerHTML = Lab.texString(`<p>${why[bandS.iso]}</p><p>The big chart hides how close neighbors are, which is why the zoomed-in grid helps. The band is drawn from a smooth formula that fits the real data. These are rules of thumb for exams, and some nuclei break them.</p>`);
  }
  Lab.segmented('#band-iso', (v) => { bandS.iso = v; bandS.t0 = bandStage.t; paintBand(); bandStage.redraw(); });
  paintBand();

  /* ---------- Bench: half-life simulator ---------- */
  const HL = {
    'I-131': { sym: 'I', d: 'Xe', t12: 8.02, unit: 'days', dp: 1 },
    'C-14': { sym: 'C', d: 'N', t12: 5730, unit: 'years', dp: 0 },
    'F-18': { sym: 'F', d: 'O', t12: 110, unit: 'minutes', dp: 0 },
    'Ra-226': { sym: 'Ra', d: 'Rn', t12: 1600, unit: 'years', dp: 0 },
  };
  const SEC_PER_HL = 3.2, MAX_HL = 5;
  const GRID = { x: 16, y: 18, size: 362 };
  const PLOT = { x0: 452, x1: 776, y0: 26, y1: 346 };
  const sim = { N: 400, iso: 'I-131', speed: 1, run: true, hl: 0, alive: [], left: 0, hist: [], flashes: [], bet: -1, betLife: null, off: null, offN: 0, offIso: '' };
  function resetSim() {
    sim.alive = new Array(sim.N).fill(true);
    sim.left = sim.N; sim.hl = 0; sim.hist = [[0, 1]]; sim.flashes = []; sim.bet = -1; sim.betLife = null; sim.run = true;
    const btn = Lab.$('#hl-go'); if (btn) btn.textContent = 'Pause';
    paintGrid();
    paintSimText();
  }
  const cellOf = (i) => {
    const n = Math.round(Math.sqrt(sim.N)), c = GRID.size / n;
    return { x: GRID.x + ((i % n) + 0.5) * c, y: GRID.y + (Math.floor(i / n) + 0.5) * c, c };
  };
  const OFF_S = 3;
  function paintCell(x, i) {
    const { x: cx, y: cy, c } = cellOf(i);
    const I = HL[sim.iso];
    const r = c * 0.43;
    x.clearRect(cx - c / 2, cy - c / 2, c, c);
    if (sim.alive[i]) Art.ball(x, cx, cy, r, Art.elementColor(I.sym));
    else { x.globalAlpha = 0.34; Art.ball(x, cx, cy, r, Art.elementColor(I.d)); x.globalAlpha = 1; }
  }
  function paintGrid() {
    if (!sim.off) { sim.off = document.createElement('canvas'); sim.off.width = sim.off.height = Math.ceil((GRID.size + GRID.x * 2) * OFF_S); sim.offCtx = sim.off.getContext('2d'); sim.offCtx.scale(OFF_S, OFF_S); }
    const x = sim.offCtx;
    x.clearRect(0, 0, GRID.size + GRID.x * 2, GRID.size + GRID.x * 2);
    for (let i = 0; i < sim.N; i++) paintCell(x, i);
  }
  const fracIdeal = (hl) => Math.pow(0.5, hl);
  const px = (hl) => lerp(PLOT.x0, PLOT.x1, hl / MAX_HL), py = (fr) => lerp(PLOT.y1, PLOT.y0, fr);
  resetSim();
  const hlStage = Lab.stage('#c-hl', {
    label: 'A grid of nuclei that decay at random on the left, with a live graph on the right. The graph compares the number left with the ideal half-life curve.',
    onPointer(e) {
      if (e.type !== 'down') return;
      if (e.x < GRID.x || e.y < GRID.y || e.x > GRID.x + GRID.size || e.y > GRID.y + GRID.size) return;
      const n = Math.round(Math.sqrt(sim.N)), c = GRID.size / n;
      const i = Math.floor((e.y - GRID.y) / c) * n + Math.floor((e.x - GRID.x) / c);
      if (sim.alive[i]) { sim.bet = i; sim.betLife = null; Lab.sound.pop(); paintSimText(); }
    },
    draw(g, t, dt, st) {
      const I = HL[sim.iso];
      if (sim.run && st.playing) {
        const dHL = (dt / SEC_PER_HL) * sim.speed;
        const pDecay = 1 - Math.pow(0.5, dHL);
        sim.hl += dHL;
        let changed = false;
        for (let i = 0; i < sim.N; i++) {
          if (sim.alive[i] && Math.random() < pDecay) {
            sim.alive[i] = false; sim.left--; changed = true;
            paintCell(sim.offCtx, i);
            if (sim.flashes.length < 26) sim.flashes.push({ i, t0: t });
            if (i === sim.bet) sim.betLife = sim.hl;
          }
        }
        if (dt > 0) {
          const last = sim.hist[sim.hist.length - 1];
          if (sim.hl - last[0] > 0.02) sim.hist.push([Math.min(sim.hl, MAX_HL), sim.left / sim.N]);
        }
        if (sim.hl >= MAX_HL) { sim.hl = MAX_HL; sim.run = false; Lab.$('#hl-go').textContent = 'Run again'; }
        if (changed || dt > 0) paintSimText();
      }
      // The grid.
      g.fillStyle = 'rgba(20,10,36,.55)'; Art.round(g, GRID.x - 6, GRID.y - 6, GRID.size + 12, GRID.size + 12, 16); g.fill();
      g.drawImage(sim.off, 0, 0, GRID.size + GRID.x * 2, GRID.size + GRID.x * 2);
      if (sim.N === 25) {
        for (let i = 0; i < 25; i++) {
          const { x, y, c } = cellOf(i);
          const r = c * 0.43;
          Art.face(g, x, y - r * 0.05, r, sim.alive[i] ? 'grumpy' : 'happy', { t, seed: i, look: [0, 0] });
        }
      }
      // Decay flashes.
      sim.flashes = sim.flashes.filter((f) => t - f.t0 < 0.45);
      sim.flashes.forEach((f) => {
        const { x, y, c } = cellOf(f.i), q = (t - f.t0) / 0.45;
        Art.glow(g, x, y, c * (0.8 + q), C.sun, 0.8 * (1 - q));
      });
      if (sim.bet >= 0) {
        const { x, y, c } = cellOf(sim.bet);
        Art.ring(g, x, y, Math.max(c * 0.62, 11), { color: '#fff', w: 3.5 });
      }
      Art.text(g, `${sim.left.toLocaleString('en-US')} of ${sim.N.toLocaleString('en-US')} left`, GRID.x + GRID.size / 2, 414, { font: 'display', size: 30, color: C.pink });
      // The plot.
      g.lineCap = 'round';
      [1, 0.5, 0.25, 0.125].forEach((fr) => {
        g.save(); g.strokeStyle = 'rgba(247,242,255,.22)'; g.lineWidth = 2; g.setLineDash([5, 7]);
        g.beginPath(); g.moveTo(PLOT.x0, py(fr)); g.lineTo(PLOT.x1, py(fr)); g.stroke(); g.restore();
        Art.text(g, (fr * 100) + '%', PLOT.x0 - 8, py(fr), { size: 20, color: C.dim, align: 'right' });
      });
      for (let h = 1; h <= MAX_HL; h++) {
        g.save(); g.strokeStyle = 'rgba(247,242,255,.14)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(px(h), PLOT.y0); g.lineTo(px(h), PLOT.y1); g.stroke(); g.restore();
        Art.text(g, String(h), px(h), PLOT.y1 + 20, { size: 21, color: C.dim });
      }
      g.strokeStyle = 'rgba(247,242,255,.6)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(PLOT.x0, PLOT.y0); g.lineTo(PLOT.x0, PLOT.y1); g.lineTo(PLOT.x1, PLOT.y1); g.stroke();
      const fmt = I.t12 >= 1000 ? I.t12.toLocaleString('en-US') : I.t12;
      Art.text(g, `half-lives (1 = ${fmt} ${I.unit})`, (PLOT.x0 + PLOT.x1) / 2 - 6, PLOT.y1 + 54, { size: 22, color: C.ink, maxW: 348 });
      // The myth.
      g.save(); g.strokeStyle = C.red; g.lineWidth = 3.5; g.setLineDash([10, 9]);
      g.beginPath(); g.moveTo(px(0), py(1)); g.lineTo(px(2), py(0)); g.stroke(); g.restore();
      Art.text(g, 'myth', px(0) + 34, py(0) - 20, { size: 22, color: '#FF8FA0', halo: true });
      // The ideal curve.
      g.strokeStyle = C.sun; g.lineWidth = 4;
      g.beginPath();
      for (let i = 0; i <= 80; i++) { const h = (i / 80) * MAX_HL; const X = px(h), Y = py(fracIdeal(h)); if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }
      g.stroke();
      Art.text(g, 'ideal curve', 604, py(0.72), { font: 'display', size: 25, color: C.sun, halo: true, align: 'left' });
      // The live curve.
      g.strokeStyle = C.pink; g.lineWidth = 5; g.lineJoin = 'round';
      g.beginPath();
      sim.hist.forEach(([h, f], i) => { const X = px(h), Y = py(f); if (i) g.lineTo(X, Y); else g.moveTo(X, Y); });
      const headF = sim.left / sim.N, headX = px(sim.hl), headY = py(headF);
      g.lineTo(headX, headY); g.stroke();
      Art.ball(g, headX, headY, 9, C.pink);
      if (sim.hl < 3) Art.text(g, 'yours', headX + 16, headY - 20, { font: 'display', size: 25, color: C.pink, halo: true, align: 'left' });
      if (sim.hl >= MAX_HL) Art.pill(g, 'Five half-lives done', px(3.1), py(0.74), { size: 24, color: C.pink, text: '#fff' });
      void wander;
    },
  });
  function paintSimText() {
    const I = HL[sim.iso];
    Lab.$('#hl-left').textContent = sim.left.toLocaleString('en-US');
    Lab.$('#hl-ideal').textContent = Lab.fmt(sim.N * fracIdeal(sim.hl), 0);
    const time = sim.hl * I.t12;
    Lab.$('#hl-time').textContent = `${time >= 1000 ? Math.round(time).toLocaleString('en-US') : time.toFixed(I.dp)} ${I.unit}`;
    Lab.$('#hl-bet').textContent = sim.bet < 0 ? 'Tap one in the grid' : sim.betLife === null ? 'Still here' : `Lasted ${sim.betLife.toFixed(1)} half-lives`;
  }
  Lab.segmented('#hl-n', (v) => { sim.N = +v; resetSim(); hlStage.redraw(); });
  Lab.segmented('#hl-iso', (v) => { sim.iso = v; resetSim(); hlStage.redraw(); });
  Lab.bind('#hl-speed', '#hl-speed-out', (v) => v + '×', (v) => { sim.speed = v; });
  Lab.$('#hl-go').addEventListener('click', (e) => {
    if (!sim.run && sim.hl >= MAX_HL) { resetSim(); return; }
    sim.run = !sim.run; e.target.textContent = sim.run ? 'Pause' : 'Resume';
  });
  Lab.$('#hl-reset').addEventListener('click', () => { resetSim(); hlStage.redraw(); });

  /* ---------- Story 2: mass, fission, fusion ---------- */
  const BE_POINTS = [[1, 0], [2, 1.11], [3, 2.57], [4, 7.07], [7, 5.61], [12, 7.68], [16, 7.98], [20, 8.03], [28, 8.45], [56, 8.79], [90, 8.71], [120, 8.5], [138, 8.39], [208, 7.87], [238, 7.57]];
  Lab.story('#story-energy', {
    title: 'A little missing mass, a lot of energy',
    scenes: [
      {
        say: 'Weigh 2 protons and 2 neutrons, then weigh a helium-4 nucleus made of the same four particles. The nucleus is <b>lighter</b>. That missing mass is called the <b>mass defect</b>.',
        dur: 4,
        draw(g, p, t) {
          const q = ease.out(seg(p, 0.1, 0.5));
          Art.balance(g, 400, 412, 520, q * -0.7, {
            drawLeft(gg, x, y) { Art.proton(gg, x - 42, y - 26, 19); Art.proton(gg, x - 14, y - 26, 19); Art.neutron(gg, x + 14, y - 26, 19); Art.neutron(gg, x + 42, y - 26, 19); },
            drawRight(gg, x, y) { nucleus(gg, x, y - 40, 4, 2, { scale: 1.5, face: 'happy', t, look: [-1, 0] }); },
          });
          Art.text(g, '2 protons, 2 neutrons', 170, 44, { font: 'display', size: 27, color: C.ink });
          Art.text(g, '4.03188 u', 170, 86, { font: 'display', size: 40, color: C.sun });
          Art.text(g, 'helium-4 nucleus', 630, 44, { font: 'display', size: 27, color: C.ink });
          Art.text(g, '4.00151 u', 630, 86, { font: 'display', size: 40, color: C.sun });
          const a = seg(p, 0.55, 0.8);
          faded(g, a, () => { g.fillStyle = 'rgba(217,18,127,.92)'; Art.round(g, 248, 138, 304, 66, 22); g.fill(); });
          Art.text(g, 'missing: 0.03037 u', 400, 171, { font: 'display', size: 31, color: '#fff', alpha: a });
        },
      },
      {
        say: 'The missing mass became energy, by Einstein\'s $E = mc^2$. The speed of light squared is huge, so a tiny mass means a lot of energy: about <b>3 million times</b> the energy of burning methane, per mole.',
        dur: 4,
        draw(g, p, t) {
          Art.text(g, 'E = mc²', 400, 62, { font: 'display', size: 66, color: C.pink, alpha: ease.out(seg(p, 0, 0.2)) });
          const rows = [
            ['One helium-4 nucleus', '4.54 × 10⁻¹² J', C.cyan],
            ['One mole of nuclei', '2.7 × 10¹² J', C.sun],
            ['One mole of methane burning', '8.9 × 10⁵ J', C.fire],
          ];
          rows.forEach(([l, v, col], i) => {
            const a = ease.out(seg(p, 0.2 + i * 0.18, 0.38 + i * 0.18));
            faded(g, a, () => { g.fillStyle = 'rgba(26,15,46,.75)'; Art.round(g, 40, 120 + i * 78, 720, 66, 18); g.fill(); });
            Art.text(g, l, 66, 153 + i * 78, { size: 28, align: 'left', alpha: a });
            Art.text(g, v, 734, 153 + i * 78, { font: 'display', size: 36, align: 'right', color: col, alpha: a });
          });
          Art.text(g, 'Same amount, millions of times the energy', 450, 400, { size: 27, color: C.ink, alpha: seg(p, 0.75, 0.95), halo: true });
          Art.moe(g, 76, 444, 92, 'wow', { t });
        },
      },
      {
        say: 'Plot how tightly each nucleus is bound. The curve peaks near <b>iron</b>. Joining light nuclei moves up the curve, and so does splitting heavy ones. Both release energy.',
        dur: 4.4,
        draw(g, p, t) {
          const x0 = 104, x1 = 770, y0 = 372, y1 = 44;
          const X = (A) => lerp(x0, x1, A / 240), Y = (b) => lerp(y0, y1, b / 9.5);
          g.strokeStyle = 'rgba(247,242,255,.6)'; g.lineWidth = 3;
          g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
          [2, 4, 6, 8].forEach((v) => { Art.text(g, String(v), x0 - 12, Y(v), { size: 21, color: C.dim, align: 'right' }); });
          [50, 100, 150, 200].forEach((v) => { Art.text(g, String(v), X(v), y0 + 22, { size: 21, color: C.dim }); });
          Art.text(g, 'Mass number', (x0 + x1) / 2, y0 + 56, { font: 'display', size: 26 });
          Art.text(g, 'Binding energy per nucleon, in MeV', 60, 20, { size: 23, color: C.ink, align: 'left' });
          const q = ease.inOut(seg(p, 0, 0.45));
          g.strokeStyle = C.leaf; g.lineWidth = 6; g.lineJoin = 'round'; g.lineCap = 'round';
          g.beginPath();
          const maxA = lerp(1, 238, q);
          BE_POINTS.forEach(([A, E], i) => {
            if (A > maxA) return;
            if (i) g.lineTo(X(A), Y(E)); else g.moveTo(X(A), Y(E));
          });
          g.stroke();
          const lab = seg(p, 0.45, 0.6);
          [['He', 4, 7.07, 34, 30], ['Fe', 56, 8.79, 14, 34], ['U', 238, 7.57, -8, 32]].forEach(([s, A, E, dx, dy]) => {
            Art.atom(g, X(A), Y(E), 11, s, { label: false, alpha: lab });
            Art.text(g, s, X(A) + dx, Y(E) + dy, { font: 'display', size: 28, alpha: lab, halo: true });
          });
          // Arrows toward the peak.
          const a1 = seg(p, 0.58, 0.78), a2 = seg(p, 0.72, 0.92);
          Art.arrow(g, X(16), Y(3.2), X(52), Y(6.4), { color: C.pink, w: 8, head: 22, p: a1 });
          Art.text(g, 'Fusion', X(66), Y(3.3), { font: 'display', size: 34, color: C.pink, alpha: a1, halo: true });
          Art.text(g, 'joins light nuclei', X(84), Y(2.4), { size: 25, alpha: a1, halo: true });
          Art.arrow(g, X(226), Y(6.6), X(130), Y(6.6), { color: C.fire, w: 8, head: 22, p: a2 });
          Art.text(g, 'Fission', X(180), Y(5.5), { font: 'display', size: 34, color: C.fire, alpha: a2, halo: true });
          Art.text(g, 'splits heavy nuclei', X(180), Y(4.6), { size: 25, alpha: a2, halo: true });
          void t;
        },
      },
      {
        say: '<b>Fission.</b> A neutron hits uranium-235, and the nucleus splits into two smaller ones. It also frees 2 or 3 more neutrons. Check the numbers: they still balance.',
        dur: 4.4,
        draw(g, p, t) {
          const hit = ease.in(seg(p, 0, 0.28)), split = ease.out(seg(p, 0.3, 0.7));
          const cy = 150;
          if (hit < 1) Art.neutron(g, lerp(30, 280, hit), cy, 15);
          const wob = hit >= 1 && split <= 0 ? Math.sin(t * 40) * 3 : 0;
          if (split <= 0) nucleus(g, 340 + wob, cy, 235, 92, { scale: 1.08, face: hit >= 1 ? 'wow' : 'sleepy', t, look: [-1, 0] });
          else {
            nucleus(g, lerp(340, 196, split), lerp(cy, cy - 10, split), 141, 56, { scale: 1.1, face: 'wow', t, look: [-1, 0] });
            nucleus(g, lerp(340, 560, split), lerp(cy, cy + 4, split), 92, 36, { scale: 1.1, face: 'wow', t, look: [1, 0], seed: 3 });
            [[-0.8, -1], [1, -0.7], [0.8, 0.9]].forEach(([dx, dy], i) => {
              const u = ease.out(seg(p, 0.35 + i * 0.04, 0.85));
              Art.neutron(g, 340 + dx * 330 * u + (dx > 0 ? 40 : 0), cy + dy * 112 * u, 13);
            });
            Art.glow(g, 340, cy, 130 * (1 - split * 0.6), C.sun, 0.5 * (1 - split));
            Art.text(g, 'barium-141', 196, 268, { font: 'display', size: 25, alpha: seg(p, 0.6, 0.8), halo: true });
            Art.text(g, 'krypton-92', 560, 268, { font: 'display', size: 25, alpha: seg(p, 0.6, 0.8), halo: true });
          }
          Art.text(g, 'uranium-235', 340, 26, { font: 'display', size: 26, alpha: 1 - seg(p, 0.3, 0.42) });
          equation(g, [{ A: 1, Z: 0, sym: 'n' }, '+', { A: 235, Z: 92, sym: 'U' }, '->', { A: 141, Z: 56, sym: 'Ba' }, '+', { A: 92, Z: 36, sym: 'Kr' }, '+', { A: 1, Z: 0, sym: 'n', coef: 3 }], 400, 332, 42, { alpha: seg(p, 0.55, 0.78) });
          checks(g, '236 = 141 + 92 + 3', '92 = 56 + 36', 414, seg(p, 0.75, 0.92));
        },
      },
      {
        say: 'Those neutrons can split more nuclei, which is a <b>chain reaction</b>. It needs enough fuel, a <b>critical mass</b>. In a power plant, control rods absorb extra neutrons so the reaction stays steady.',
        dur: 4.4,
        draw(g, p, t) {
          // Each generation is 3 times as large. Drawn as a branching tree.
          const levels = [[0], [-1, 0, 1], [-4, -3, -2, -1, 0, 1, 2, 3, 4]];
          const X = [78, 288, 530];
          const sp = [0, 112, 36];
          const yAt = (lv, v) => 226 + v * sp[lv];
          const Rn = [27, 22, 15];
          const rods = seg(p, 0.72, 0.92);
          for (let lv = 0; lv < 3; lv++) {
            const a = ease.out(seg(p, 0.05 + lv * 0.25, 0.3 + lv * 0.25));
            levels[lv].forEach((v, i) => {
              if (lv > 0) {
                const parent = lv === 1 ? 0 : Math.round(v / 3);
                const x0 = X[lv - 1] + Rn[lv - 1] + 8, y0 = yAt(lv - 1, parent), x1 = X[lv] - Rn[lv] - 6, y1 = yAt(lv, v);
                Art.arrow(g, x0, y0, x1, y1, { color: 'rgba(247,242,255,.5)', w: 3, head: 10, p: a });
                if (a >= 1) { const u = (t * 0.55 + i * 0.13 + lv * 0.31) % 1; Art.neutron(g, lerp(x0, x1, u), lerp(y0, y1, u), 7); }
              }
              faded(g, a, () => Art.ball(g, X[lv], yAt(lv, v), Rn[lv], Art.elementColor('U')));
            });
            Art.text(g, ['1', '3', '9'][lv] + (lv ? ' splits' : ' split'), X[lv] + (lv === 0 ? 8 : 0), 28, { font: 'display', size: 30, color: C.sun, alpha: a });
          }
          // Neutrons from the last row run into the rods.
          levels[2].forEach((v, i) => {
            const x0 = X[2] + Rn[2] + 6, x1 = 648, y = yAt(2, v);
            Art.arrow(g, x0, y, x1, y, { color: 'rgba(247,242,255,.4)', w: 2.5, head: 9, p: rods });
            if (rods >= 1) { const u = (t * 0.55 + i * 0.11) % 1; Art.neutron(g, lerp(x0, x1, u), y, 7); }
          });
          // Control rods.
          [664, 708, 752].forEach((x) => {
            const y = lerp(-340, 0, ease.out(rods));
            const rg = g.createLinearGradient(x - 14, 0, x + 14, 0);
            rg.addColorStop(0, '#6A7288'); rg.addColorStop(1, '#2C3144');
            g.fillStyle = rg; g.strokeStyle = DARK; g.lineWidth = 2.5;
            Art.round(g, x - 14, y + 56, 28, 348, 7); g.fill(); g.stroke();
          });
          Art.text(g, 'control rods', 708, 28, { font: 'display', size: 26, color: C.ink, alpha: rods });
          Art.text(g, 'absorb neutrons', 660, 430, { size: 24, alpha: rods, halo: true });
        },
      },
      {
        say: '<b>Fusion.</b> Two light nuclei join into a heavier one. Both are positive and repel, so it takes millions of degrees to force them together. Stars run on fusion. Hydrogen becoming helium powers the sun.',
        dur: 4.2,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.05, 0.5));
          const sun = g.createRadialGradient(690, 60, 10, 690, 60, 230);
          sun.addColorStop(0, 'rgba(255,214,90,.95)'); sun.addColorStop(0.28, 'rgba(255,138,43,.62)'); sun.addColorStop(1, 'rgba(255,90,20,0)');
          g.fillStyle = sun; g.beginPath(); g.arc(690, 60, 230, 0, TAU); g.fill();
          if (q < 1) {
            const off = lerp(240, 18, q);
            nucleus(g, 340 - off, 150 + Math.sin(q * 3) * 4, 2, 1, { scale: 2.2, face: 'grumpy', t, look: [1, 0] });
            nucleus(g, 340 + off, 150 - Math.sin(q * 3) * 4, 3, 1, { scale: 2.2, face: 'grumpy', t, look: [-1, 0], seed: 2 });
            Art.text(g, 'deuterium', 340 - off, 240, { font: 'display', size: 25, alpha: 1 - seg(q, 0.5, 0.8), halo: true });
            Art.text(g, 'tritium', 340 + off, 240, { font: 'display', size: 25, alpha: 1 - seg(q, 0.5, 0.8), halo: true });
          } else {
            const u = ease.out(seg(p, 0.5, 0.85));
            nucleus(g, 300, 150, 4, 2, { scale: 2.5, face: 'grin', t, look: [1, 0] });
            Art.text(g, 'helium-4', 300, 256, { font: 'display', size: 26, halo: true });
            Art.neutron(g, lerp(340, 620, u), 138, 18);
            Art.text(g, 'neutron', lerp(340, 620, u), 182, { size: 24, alpha: u, halo: true });
            Art.glow(g, 340, 150, 150 * (1 - u * 0.7), C.sun, 0.6 * (1 - u));
          }
          equation(g, [{ A: 2, Z: 1, sym: 'H' }, '+', { A: 3, Z: 1, sym: 'H' }, '->', { A: 4, Z: 2, sym: 'He' }, '+', { A: 1, Z: 0, sym: 'n' }], 400, 332, 46, { alpha: seg(p, 0.5, 0.72) });
          checks(g, '2 + 3 = 4 + 1', '1 + 1 = 2 + 0', 414, seg(p, 0.7, 0.88));
        },
      },
    ],
  });
});
