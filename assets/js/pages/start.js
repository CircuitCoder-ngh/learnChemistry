/* Lesson 0: How to see chemistry. The three-view explorer and the true-scale powers-of-ten zoom. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const EO = Art.elementColor('O'), EH = Art.elementColor('H'), EC = Art.elementColor('C'), EFE = Art.elementColor('Fe'), EHE = Art.elementColor('He');

  /* ---------- Shared helpers ---------- */
  /** A glossy ball of any size from a few cached sprites, so a changing radius never fills memory. */
  function sball(g, x, y, r, color) {
    if (r <= 0) return;
    const R = r > 70 ? 150 : r > 22 ? 50 : 20;
    g.save(); g.translate(x, y); g.scale(r / R, r / R); Art.ball(g, 0, 0, R, color); g.restore();
  }
  /** Water with its true geometry. s is pixels per nanometer. H sits behind O so a face stays visible. */
  function water(g, x, y, s, rot, o = {}) {
    const c = Math.cos(rot), d = Math.sin(rot);
    const hx = 0.0759 * s, hy = 0.0588 * s;
    const pos = (side) => [x + side * hx * c - hy * d, y + side * hx * d + hy * c];
    const a = pos(-1), b = pos(1);
    const prev = g.globalAlpha;
    g.globalAlpha = prev * (o.aH === undefined ? 1 : o.aH);
    sball(g, a[0], a[1], 0.1 * s, EH); sball(g, b[0], b[1], 0.1 * s, EH);
    g.globalAlpha = prev * (o.aO === undefined ? 1 : o.aO);
    sball(g, x, y, 0.14 * s, EO);
    g.globalAlpha = prev;
    if (o.face) Art.face(g, x, y - 0.02 * s, 0.14 * s, o.face, { t: o.t, seed: o.seed, look: o.look });
    if (o.ringH) { Art.ring(g, a[0], a[1], 0.1 * s + 3, { color: C.sun, w: 3.5 }); Art.ring(g, b[0], b[1], 0.1 * s + 3, { color: C.sun, w: 3.5 }); }
    if (o.ringO) Art.ring(g, x, y, 0.14 * s + 3, { color: C.sun, w: 3.5 });
  }
  /** A row of formula pieces, centered. Each piece: { f, a, on }. on draws a highlight behind that piece. */
  function eqRow(g, parts, cx, y, size) {
    const prev = g.globalAlpha;
    g.globalAlpha = 0;
    const ws = parts.map((p) => Art.formula(g, p.f, 0, -200, { size, colorize: true }));
    g.globalAlpha = prev;
    const gapOf = (i) => (parts[i].tight ? size * 0.015 : size * 0.2);
    const total = ws.reduce((a, b) => a + b, 0) + parts.slice(0, -1).reduce((a, _, i) => a + gapOf(i), 0);
    let x = cx - total / 2;
    parts.forEach((p, i) => {
      if (p.on) {
        g.fillStyle = Art.alpha(C.sun, 0.2); g.strokeStyle = C.sun; g.lineWidth = 3;
        Art.round(g, x - 5, y - size * 0.68, ws[i] + 10, size * 1.36, 10); g.fill(); g.stroke();
      }
      g.save(); g.globalAlpha *= p.a === undefined ? 1 : p.a;
      Art.formula(g, p.f, x, y, { size, colorize: true, align: 'left' });
      g.restore();
      x += ws[i] + gapOf(i);
    });
  }
  function nail(g, x, y, len) {
    const m = g.createLinearGradient(0, y - 10, 0, y + 10);
    m.addColorStop(0, '#E3E6EE'); m.addColorStop(0.45, '#AEB4C4'); m.addColorStop(1, '#5D6276');
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, y + 16, len * 0.52, 6, 0, 0, TAU); g.fill();
    g.fillStyle = m; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x - len / 2, y - 7); g.lineTo(x + len / 2 - 26, y - 7); g.lineTo(x + len / 2, y); g.lineTo(x + len / 2 - 26, y + 7); g.lineTo(x - len / 2, y + 7); g.closePath(); g.fill(); g.stroke();
    Art.round(g, x - len / 2 - 8, y - 17, 11, 34, 4); g.fill(); g.stroke();
  }
  function balloon(g, x, y, r, t, stringTo) {
    const bob = Math.sin(t * 1.3) * 4;
    g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x, y + r * 1.15 + bob); g.quadraticCurveTo(x + 14, (y + stringTo) / 2 + 30, x + 3, stringTo); g.stroke();
    const b = g.createRadialGradient(x - r * 0.35, y - r * 0.4 + bob, r * 0.1, x, y + bob, r * 1.2);
    b.addColorStop(0, '#FFC0E0'); b.addColorStop(0.5, C.pink); b.addColorStop(1, '#A81464');
    g.fillStyle = b; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(x, y + bob, r, r * 1.15, 0, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x - 7, y + r * 1.15 + 8 + bob); g.lineTo(x, y + r * 1.15 - 2 + bob); g.lineTo(x + 7, y + r * 1.15 + 8 + bob); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(x - r * 0.38, y - r * 0.45 + bob, r * 0.15, r * 0.24, 0.5, 0, TAU); g.fill();
  }
  /** Small jiggling bits for a magnifier: an orderly pack of atoms. */
  function packed(gg, cx, cy, R, r, sym, t, faceAt) {
    const dx = r * 2.08, dy = r * 1.8;
    for (let j = -4; j <= 4; j++) for (let i = -5; i <= 5; i++) {
      const x = cx + (i + (j % 2 ? 0.5 : 0)) * dx + wander(i * 3 + j, t) * 1.8, y = cy + j * dy + wander(i + j * 5, t) * 1.8;
      if (Math.hypot(x - cx, y - cy) > R + r) continue;
      Art.atom(gg, x, y, r, sym, { label: false, face: faceAt && i === 0 && j === 0 ? 'happy' : null, t, seed: i });
    }
  }
  const swarmSpots = (seed, n, R) => Array.from({ length: n }, (_, i) => {
    const a = i * 2.39996 + seed, d = Math.sqrt((i + 0.6) / n) * R;
    return [Math.cos(a) * d, Math.sin(a) * d];
  });

  /* ---------- Story 1: what chemistry is ---------- */
  Lab.story('#story-what', {
    title: 'Welcome to the lab',
    scenes: [
      {
        say: 'Look around. Water, an iron nail, the helium in a balloon. All of it is <b>matter</b>: anything that has mass and takes up space.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          Art.bgLab(g, W, H);
          const y = H - 70;
          Art.popIn(g, 130, y, seg(p, 0.05, 0.25), (gg) => {
            Art.beaker(gg, 0, 0, 132, 176, { level: 0.74, liquid: C.water, ticks: false, inside: (g2, b) => Art.bubbles(g2, b.x0 + 8, b.x1 - 8, b.bottom - 6, b.top + 8, t * 0.25, { n: 3, r: 3 }) });
          });
          Art.popIn(g, 350, y - 22, seg(p, 0.25, 0.45), (gg) => nail(gg, 0, 0, 170));
          const q = ease.out(seg(p, 0.45, 0.72));
          if (q > 0) balloon(g, 545, lerp(330, 150, q), 72, t, y);
          Art.text(g, 'water', 130, y - 204, { size: 30, alpha: seg(p, 0.15, 0.3) });
          Art.text(g, 'an iron nail', 350, y - 74, { size: 30, alpha: seg(p, 0.35, 0.5) });
          Art.text(g, 'helium gas', 545, 44, { size: 30, alpha: seg(p, 0.6, 0.8) });
          Art.moe(g, 712, y + 2, 180, 'wave', { t, flip: true });
        },
      },
      {
        say: 'Zoom in far enough and something strange appears. All of it is built from tiny particles: <b>atoms</b>, alone or joined together into <b>molecules</b>.',
        dur: 3.6,
        draw(g, p, t, { W, H }) {
          Art.bgLab(g, W, H, 56);
          const y = H - 56;
          Art.beaker(g, 130, y, 76, 66, { level: 0.72, liquid: C.water, ticks: false });
          nail(g, 400, y - 16, 112);
          balloon(g, 668, y - 50, 22, t, y);
          const R = 118, cy = 148;
          Art.zoom(g, 130, y - 40, 138, cy, R, (gg, cx, cyy, r) => {
            swarmSpots(1, 6, r * 0.7).forEach(([dx, dy], i) => water(gg, cx + dx + wander(i, t) * 4, cyy + dy + wander(i + 40, t) * 4, 172, rand(i + 2) * 6.28 + Math.sin(t * 0.8 + i) * 0.4, { face: i === 0 ? 'happy' : null, t, seed: i }));
          }, { p: seg(p, 0.05, 0.3), rim: C.cyan });
          Art.zoom(g, 400, y - 22, 400, cy, R, (gg, cx, cyy, r) => packed(gg, cx, cyy, r, 27, 'Fe', t, true), { p: seg(p, 0.3, 0.55), rim: C.cyan });
          Art.zoom(g, 668, y - 80, 662, cy, R, (gg, cx, cyy, r) => {
            [[-40, -46], [42, -30], [-26, 46], [50, 56]].forEach(([dx, dy], i) => {
              const x = cx + dx + Math.sin(t * (1.1 + i * 0.2) + i * 2) * 20, yy = cyy + dy + Math.cos(t * (0.9 + i * 0.3) + i) * 20;
              Art.atom(gg, x, yy, 26, 'He', { face: i === 0 ? 'wink' : 'happy', t, seed: i, label: 'He' });
            });
            void r;
          }, { p: seg(p, 0.55, 0.8), rim: C.cyan });
          Art.text(g, 'water molecules', 138, 296, { size: 25, halo: true, alpha: seg(p, 0.2, 0.3) });
          Art.text(g, 'iron atoms', 400, 296, { size: 25, halo: true, alpha: seg(p, 0.45, 0.55) });
          Art.text(g, 'helium atoms', 662, 296, { size: 25, halo: true, alpha: seg(p, 0.7, 0.8) });
        },
      },
      {
        say: 'There are only <b>118 kinds</b> of atom, called the elements. Everything you have ever touched is built from this short list.',
        dur: 3.8,
        draw(g, p, t) {
          const tw = 40, th = 39, gapX = 2.8, gapY = 3, x0 = 15, y0 = 12;
          const big = ['H', 'He', 'O', 'Fe'];
          ELEMENTS.forEach((e, i) => {
            const q = ease.back(seg(p, 0.02 + (i / 118) * 0.6, 0.1 + (i / 118) * 0.6));
            if (q <= 0) return;
            const row = e.y > 7 ? e.y - 1 : e.y - 1;
            const x = x0 + (e.x - 1) * (tw + gapX) + tw / 2, y = y0 + row * (th + gapY) + th / 2;
            g.save(); g.translate(x, y); g.scale(q, q);
            g.fillStyle = Lab.familyColor(e.family);
            Art.round(g, -tw / 2, -th / 2, tw, th, 7); g.fill();
            g.fillStyle = 'rgba(255,255,255,.18)'; Art.round(g, -tw / 2 + 2, -th / 2 + 2, tw - 4, 8, 4); g.fill();
            g.restore();
            if (q > 0.7) Art.text(g, e.sym, x, y + 1.5, { font: 'display', size: 21, color: '#fff' });
          });
          const glow = seg(p, 0.72, 0.85);
          if (glow > 0) big.forEach((s) => {
            const e = EL[s];
            const row = e.y - 1;
            const x = x0 + (e.x - 1) * (tw + gapX), y = y0 + row * (th + gapY);
            g.strokeStyle = C.sun; g.lineWidth = 4;
            g.globalAlpha = glow * (0.75 + 0.25 * Math.sin(t * 4));
            Art.round(g, x - 2, y - 2, tw + 4, th + 4, 9); g.stroke();
            g.globalAlpha = 1;
          });
          const q2 = ease.back(seg(p, 0.6, 0.76));
          if (q2 > 0) {
            g.save(); g.translate(322, 72); g.scale(q2, q2);
            Art.text(g, '118', -86, 0, { font: 'display', size: 64, color: C.sun });
            Art.text(g, 'kinds of atom', 74, 2, { font: 'display', size: 32 });
            g.restore();
          }
        },
      },
      {
        say: 'Atoms can swap partners. When they do, a brand new substance appears. That swap is called a <b>chemical reaction</b>.',
        dur: 4.2,
        draw(g, p, t, { W }) {
          const q = ease.inOut(seg(p, 0.22, 0.72));
          const atoms = [
            { s: 'H', r: 29, a: [78, 92], b: [506, 150] }, { s: 'H', r: 29, a: [164, 92], b: [626, 150] },
            { s: 'H', r: 29, a: [78, 322], b: [506, 330] }, { s: 'H', r: 29, a: [164, 322], b: [626, 330] },
            { s: 'O', r: 45, a: [282, 148], b: [566, 96] }, { s: 'O', r: 45, a: [282, 262], b: [566, 276] },
          ].map((a, i) => {
            const j = (1 - Math.abs(q * 2 - 1)) * 1;
            return Object.assign(a, { x: lerp(a.a[0], a.b[0], q) + wander(i * 2, t) * 3 + Math.sin(q * 6.28 + i) * 26 * j, y: lerp(a.a[1], a.b[1], q) + wander(i * 2 + 40, t) * 3 + Math.cos(q * 6.28 + i * 2) * 26 * j });
          });
          const before = clamp(1 - q * 4), after = clamp((q - 0.72) * 3.6);
          // Where the atoms started stays faintly on screen, so before and after can be compared.
          const ghost = seg(p, 0.3, 0.5) * 0.4;
          if (ghost > 0) {
            g.save(); g.globalAlpha *= ghost;
            Art.molecule(g, 121, 92, 86, 'H2', { labels: false });
            Art.molecule(g, 121, 322, 86, 'H2', { labels: false });
            Art.molecule(g, 282, 205, 114, 'O2', { rot: Math.PI / 2, labels: false });
            g.restore();
          }
          if (before > 0) {
            g.globalAlpha = before;
            Art.bond(g, atoms[0].x, atoms[0].y, atoms[1].x, atoms[1].y, { width: 9 });
            Art.bond(g, atoms[2].x, atoms[2].y, atoms[3].x, atoms[3].y, { width: 9 });
            Art.bond(g, atoms[4].x, atoms[4].y, atoms[5].x, atoms[5].y, { width: 9, order: 2 });
            g.globalAlpha = 1;
          }
          if (after > 0) {
            g.globalAlpha = after;
            Art.bond(g, atoms[4].x, atoms[4].y, atoms[0].x, atoms[0].y, { width: 9 });
            Art.bond(g, atoms[4].x, atoms[4].y, atoms[1].x, atoms[1].y, { width: 9 });
            Art.bond(g, atoms[5].x, atoms[5].y, atoms[2].x, atoms[2].y, { width: 9 });
            Art.bond(g, atoms[5].x, atoms[5].y, atoms[3].x, atoms[3].y, { width: 9 });
            g.globalAlpha = 1;
          }
          const flash = seg(p, 0.36, 0.5) * (1 - seg(p, 0.5, 0.66));
          if (flash > 0) Art.glow(g, W / 2 - 30, 215, 240, C.fire, 0.75 * flash);
          atoms.forEach((a, i) => Art.atom(g, a.x, a.y, a.r, a.s, { face: a.s === 'O' ? (q > 0.1 && q < 0.9 ? 'wow' : q >= 0.9 ? 'grin' : 'happy') : 'happy', t, seed: i, look: [q > 0.05 && q < 0.95 ? 1 : 0, 0] }));
          Art.text(g, 'hydrogen', 121, 164, { size: 27 });
          Art.text(g, 'hydrogen', 121, 250, { size: 27 });
          Art.text(g, 'oxygen', 282, 330, { size: 27 });
          Art.arrow(g, 352, 212, 452, 212, { color: C.pink, w: 7, p: seg(p, 0.7, 0.85) });
          Art.text(g, 'water, a new substance', 566, 40, { size: 28, color: C.cyan, alpha: seg(p, 0.76, 0.88) });
          Art.formula(g, '2H2 + O2 -> 2H2O', W / 2, 410, { size: 46, colorize: true, halo: true });
        },
      },
      {
        say: 'That is all <b>chemistry</b> is: the science of what stuff is made of, and how it changes. The rest of this course is the details.',
        dur: 3,
        draw(g, p, t, { W }) {
          const q = ease.back(seg(p, 0, 0.3));
          if (q > 0) {
            g.save(); g.translate(W / 2, 62); g.scale(q, q);
            Art.text(g, 'Chemistry', 0, 0, { font: 'display', size: 64, color: C.pink });
            g.restore();
          }
          const a = seg(p, 0.25, 0.5), b = seg(p, 0.5, 0.75);
          Art.text(g, 'What is it made of?', 190, 136, { font: 'display', size: 33, alpha: a, color: C.sun });
          Art.popIn(g, 190, 262, a, (gg) => water(gg, 0, 0, 560, 0, { face: 'happy', t, look: [0.4, 0] }));
          Art.text(g, 'How does it change?', 610, 136, { font: 'display', size: 33, alpha: b, color: C.cyan });
          if (b > 0) {
            g.save(); g.globalAlpha *= b;
            Art.molecule(g, 515, 226, 52, 'H2', { labels: false });
            Art.molecule(g, 700, 226, 62, 'O2', { labels: false });
            Art.arrow(g, 610, 275, 610, 325, { color: C.pink, w: 7 });
            Art.molecule(g, 610, 372, 58, 'H2O', { labels: false, face: 'happy', t, faceAll: false });
            g.restore();
          }
          Art.moe(g, W / 2, 442, 158, 'cheer', { t });
        },
      },
    ],
  });

  /* ---------- Story 2: the three views ---------- */
  const glassAt = (g, cx, base, w, h, t, level = 0.78) => Art.beaker(g, cx, base, w, h, { level, liquid: C.water, ticks: false, inside: (g2, b) => {
    g2.fillStyle = 'rgba(255,255,255,.1)'; g2.beginPath(); g2.ellipse(cx, b.top + 16 + Math.sin(t * 1.6) * 2, w * 0.42, 7, 0, 0, TAU); g2.fill();
  } });
  Lab.story('#story-views', {
    title: 'One glass of water, three ways',
    scenes: [
      {
        say: 'Here is a glass of water. It is clear, wet, and fills most of the glass. This is the <b>macroscopic view</b>: what your eyes and hands can tell you.',
        dur: 3,
        draw(g, p, t, { W, H }) {
          Art.bgLab(g, W, H);
          const y = H - 70;
          Art.popIn(g, 230, y, seg(p, 0, 0.25), (gg) => glassAt(gg, 0, 0, 200, 290, t));
          Art.pill(g, 'The macroscopic view', 590, 66, { size: 29, color: C.sun, text: '#22123A', font: 'display' });
          const tags = [['clear', 134], ['wet', 202], ['250 mL', 270]];
          tags.forEach(([s, yy], i) => {
            const q = seg(p, 0.3 + i * 0.16, 0.46 + i * 0.16);
            Art.arrow(g, 480, yy, 345, yy + 8, { color: C.sun, w: 4, p: q, alpha: q });
            Art.text(g, s, 495, yy, { align: 'left', size: 34, alpha: q });
          });
          Art.moe(g, 700, y + 2, 150, 'point', { t, flip: true });
        },
      },
      {
        say: 'Now zoom in about 100 million times, far past what any light microscope can show. You see water molecules jiggling and sliding past one another. This is the <b>particle view</b>.',
        speak: 'Now zoom in about 100 million times, far past what any light microscope can show. You see water molecules jiggling and sliding past one another. This is the particle view.',
        dur: 3.2,
        draw(g, p, t, { W, H }) {
          Art.bgLab(g, W, H);
          const y = H - 70;
          glassAt(g, 150, y, 130, 186, t);
          Art.pill(g, 'The particle view', 150, 70, { size: 26, color: C.cyan, text: '#06324A', font: 'display', alpha: seg(p, 0.3, 0.5) });
          Art.text(g, 'also called', 150, 118, { size: 22, color: C.dim, alpha: seg(p, 0.4, 0.6) });
          Art.text(g, 'submicroscopic', 150, 148, { size: 24, alpha: seg(p, 0.4, 0.6) });
          Art.zoom(g, 190, y - 80, 545, 225, 205, (gg, cx, cy, R) => {
            swarmSpots(0.5, 13, R * 0.82).forEach(([dx, dy], i) => water(gg, cx + dx + wander(i, t) * 7, cy + dy + wander(i + 40, t) * 7, 270, rand(i + 5) * 6.28 + Math.sin(t * 0.7 + i) * 0.5, { face: i < 2 ? 'happy' : null, t, seed: i, look: [0.3, 0] }));
          }, { p: seg(p, 0.05, 0.32) });
        },
      },
      {
        say: 'Chemists also write it down in a short code: $\\ce{H2O(l)}$. Two hydrogens, one oxygen, and $(l)$ for liquid. This is the <b>symbolic view</b>.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          Art.pill(g, 'The symbolic view', W / 2, 44, { size: 29, color: C.pink, text: '#fff', font: 'display', alpha: seg(p, 0, 0.15) });
          const size = 118;
          const q = ease.back(seg(p, 0.08, 0.32));
          if (q > 0) {
            g.save(); g.translate(W / 2, 168); g.scale(q, q);
            Art.formula(g, 'H2O(l)', 0, 0, { size, colorize: true });
            g.restore();
          }
          const marks = [[-163, 'two H atoms', 130, EH, 0.38], [-38, 'one O atom', 400, '#FF8A94', 0.54], [120, 'a liquid', 650, C.cyan, 0.7]];
          marks.forEach(([dx, s, lx, col, a]) => {
            const r = seg(p, a, a + 0.14);
            Art.arrow(g, W / 2 + dx, 244, lx, 300, { color: col, w: 5, p: r, alpha: r });
            Art.text(g, s, lx, 330, { size: 33, color: col, alpha: r });
          });
          const m = seg(p, 0.86, 1);
          if (m > 0) {
            g.globalAlpha = m;
            Art.atom(g, 94, 392, 20, 'H', { label: false }); Art.atom(g, 150, 392, 20, 'H', { label: false });
            Art.atom(g, 400, 392, 27, 'O', { face: 'happy', label: false, t });
            for (let i = 0; i < 3; i++) water(g, 590 + i * 62, 392 + wander(i, t) * 3, 130, i * 2 + Math.sin(t + i) * 0.4);
            g.globalAlpha = 1;
          }
        },
      },
      {
        say: 'It is all the same water, in three languages. A chemist moves between them without thinking. This triangle is the map of the whole course.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          const A = [W / 2, 98], B = [180, 306], D = [620, 306], R = 86;
          const edge = (P, Q, q) => {
            const dx = Q[0] - P[0], dy = Q[1] - P[1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
            Art.arrow(g, P[0] + ux * (R + 8), P[1] + uy * (R + 8), Q[0] - ux * (R + 8), Q[1] - uy * (R + 8), { color: C.ink, w: 5, both: true, p: q, alpha: q * 0.9 });
          };
          const e = seg(p, 0.42, 0.68);
          edge(A, B, e); edge(B, D, e); edge(D, A, e);
          const node = (P, a, col, inner) => Art.popIn(g, P[0], P[1], a, (gg) => {
            gg.save(); gg.beginPath(); gg.arc(0, 0, R, 0, TAU); gg.clip();
            const bg = gg.createRadialGradient(0, -20, 10, 0, 0, R);
            bg.addColorStop(0, '#3D2A66'); bg.addColorStop(1, '#190E2C');
            gg.fillStyle = bg; gg.fillRect(-R, -R, R * 2, R * 2);
            inner(gg);
            gg.restore();
            gg.strokeStyle = col; gg.lineWidth = 7; gg.beginPath(); gg.arc(0, 0, R, 0, TAU); gg.stroke();
          });
          node(A, seg(p, 0, 0.15), C.sun, (gg) => glassAt(gg, 0, 66, 88, 124, t));
          node(B, seg(p, 0.14, 0.28), C.cyan, (gg) => {
            swarmSpots(0.2, 5, 58).forEach(([dx, dy], i) => water(gg, dx + wander(i, t) * 4, dy + wander(i + 30, t) * 4, 145, rand(i) * 6.28 + Math.sin(t + i) * 0.5));
          });
          node(D, seg(p, 0.28, 0.42), C.pink, (gg) => Art.formula(gg, 'H2O', 0, 0, { size: 62, colorize: true }));
          Art.text(g, 'What you see', W / 2 + 100, 52, { size: 28, align: 'left', color: C.sun, alpha: seg(p, 0.05, 0.2) });
          Art.text(g, 'The particles', 180, 422, { size: 28, color: C.cyan, alpha: seg(p, 0.2, 0.32) });
          Art.text(g, 'The symbols', 620, 422, { size: 28, color: C.pink, alpha: seg(p, 0.32, 0.45) });
          const c = seg(p, 0.7, 0.9);
          Art.text(g, 'Same water', W / 2, 252, { font: 'display', size: 38, alpha: c });
          // A spark runs around the triangle: the habit of moving between views.
          if (c > 0) {
            const u = (t * 0.28) % 1, side = Math.floor(u * 3), f = u * 3 - side;
            const pts = [A, D, B, A], P = pts[side], Q = pts[side + 1];
            const sx = lerp(P[0], Q[0], f), sy = lerp(P[1], Q[1], f);
            Art.glow(g, sx, sy, 34, C.sun, 0.9 * c);
          }
        },
      },
      {
        say: 'Build the habit now. See $\\ce{2H2O}$ and picture 2 molecules. Then remember that a real glass holds about $8 \\times 10^{24}$ of them. Symbols, particles, and what you see.',
        speak: 'Build the habit now. See 2 H 2 O and picture 2 molecules. Then remember that a real glass holds about 8 times 10 to the 24 of them. Symbols, particles, and what you see.',
        dur: 3.8,
        draw(g, p, t) {
          const a = seg(p, 0, 0.2), b = seg(p, 0.3, 0.5), c = seg(p, 0.62, 0.82);
          Art.popIn(g, 130, 158, a, (gg) => Art.formula(gg, '2H2O', 0, 0, { size: 76, colorize: true }));
          Art.pill(g, 'symbols', 130, 66, { size: 25, color: C.pink, text: '#fff', alpha: a });
          Art.arrow(g, 240, 158, 298, 158, { color: C.ink, w: 6, p: b });
          Art.pill(g, 'particles', 408, 66, { size: 25, color: C.cyan, text: '#06324A', alpha: b });
          Art.popIn(g, 408, 158, b, (gg) => {
            water(gg, -44, -26, 280, 0.25 + Math.sin(t) * 0.1, { face: 'happy', t, seed: 1 });
            water(gg, 44, 40, 280, -0.3 + Math.cos(t) * 0.1, { face: 'happy', t, seed: 2 });
          });
          Art.text(g, '4 H and 2 O atoms', 408, 268, { size: 27, alpha: b });
          Art.arrow(g, 520, 158, 578, 158, { color: C.ink, w: 6, p: c });
          Art.pill(g, 'what you see', 680, 66, { size: 25, color: C.sun, text: '#22123A', alpha: c });
          Art.popIn(g, 680, 232, c, (gg) => glassAt(gg, 0, 0, 96, 138, t));
          Art.text(g, 'about 8 × 10²⁴', 672, 268, { font: 'display', size: 30, color: C.sun, alpha: c });
          Art.text(g, 'molecules in a glass', 672, 302, { size: 24, alpha: c });
          Art.moe(g, 130, 442, 150, 'think', { t });
          g.fillStyle = Art.alpha(C.plum2, seg(p, 0.82, 0.96)); Art.round(g, 240, 348, 530, 72, 24); g.fill();
          Art.text(g, 'Always ask: which view am I in?', 505, 384, { font: 'display', size: 31, alpha: seg(p, 0.82, 0.96) });
        },
      },
    ],
  });

  /* ---------- Bench: the three-view explorer ---------- */
  const LIQ = (() => {
    const out = [], dx = 72, dy = 62;
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
      const x = (i + (j % 2 ? 0.5 : 0)) * dx, y = j * dy;
      if (Math.hypot(x, y) < 142) out.push({ x, y, rot: rand(i * 3 + j * 7 + 40) * TAU, seed: out.length });
    }
    return out;
  })();
  /* Water near its surface: home spots below the surface, and th is when each one escapes as the slider rises. */
  const SURF = [
    { x: -120, y: 40, th: 0.98 }, { x: -60, y: 36, th: 0.45 }, { x: 0, y: 34, th: 0.78 }, { x: 60, y: 36, th: 0.85 }, { x: 120, y: 40, th: 0.72 },
    { x: -92, y: 82 }, { x: -30, y: 80, th: 0.92 }, { x: 30, y: 80 }, { x: 92, y: 82 },
    { x: -54, y: 122 }, { x: 0, y: 126 }, { x: 54, y: 122 },
  ].map((m, i) => Object.assign(m, { rot: rand(i * 5 + 3) * TAU, sp: 0.85 + rand(i + 9) * 0.45, seed: i + 30 }));
  const FLW = { glass: [['none', 'Nothing'], ['mol', 'One molecule'], ['H', 'Hydrogen atoms'], ['O', 'Oxygen atoms']],
    boil: [['none', 'Nothing'], ['mol', 'One molecule'], ['H', 'Hydrogen atoms'], ['O', 'Oxygen atoms']],
    burn: [['none', 'Nothing'], ['CH4', 'Methane'], ['O2', 'Oxygen gas'], ['CO2', 'Carbon dioxide'], ['H2O', 'Water']] };
  const V = { ev: 'glass', s: 0.6, follow: 'none', play: !Lab.reducedMotion, u: 0.35, hold: 0 };
  const boilT = (s) => (s < 0.7 ? 20 + (s / 0.7) * 80 : 100);
  const boilF = (s) => clamp((s - 0.7) / 0.3);

  const BURN = [
    { s: 'C', r: 27, a: [520, 205], b: [590, 132], sp: ['CH4', 'CO2'] },
    { s: 'H', r: 17, a: [520, 151], b: [690, 300], sp: ['CH4', 'H2O'] },
    { s: 'H', r: 17, a: [520, 259], b: [572, 300], sp: ['CH4', 'H2O'] },
    { s: 'H', r: 17, a: [466, 205], b: [488, 300], sp: ['CH4', 'H2O'] },
    { s: 'H', r: 17, a: [574, 205], b: [612, 300], sp: ['CH4', 'H2O'] },
    { s: 'O', r: 25, a: [640, 130], b: [534, 132], sp: ['O2', 'CO2'] },
    { s: 'O', r: 25, a: [694, 130], b: [646, 132], sp: ['O2', 'CO2'] },
    { s: 'O', r: 25, a: [640, 280], b: [530, 262], sp: ['O2', 'H2O'] },
    { s: 'O', r: 25, a: [694, 280], b: [650, 262], sp: ['O2', 'H2O'] },
  ];
  const BEFORE_BONDS = [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [5, 6, 2], [7, 8, 2]];
  const AFTER_BONDS = [[0, 5, 2], [0, 6, 2], [7, 3, 1], [7, 2, 1], [8, 4, 1], [8, 1, 1]];

  function macroGlass(g, s, t) {
    const b = Art.beaker(g, 165, 352, 188, 262, { level: Math.max(0.015, s * 0.92), liquid: C.water, ticks: false, inside: (g2, box) => {
      g2.fillStyle = 'rgba(255,255,255,.1)'; g2.beginPath(); g2.ellipse(165, box.top + 14 + Math.sin(t * 1.6) * 2, 72, 6, 0, 0, TAU); g2.fill();
    } });
    Art.text(g, Math.round(s * 250) + ' mL', 165, 72, { font: 'display', size: 36, color: C.sun, halo: true });
    return [205, Math.max(b.surface + 30, 200)];
  }
  function macroBoil(g, s, t) {
    const T = boilT(s), bf = boilF(s), heat = 0.25 + 0.75 * s;
    Art.bunsen(g, 150, 352, 0.72, { air: 1, flame: heat, t });
    g.strokeStyle = '#9A94B3'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(80, 262); g.lineTo(220, 262); g.moveTo(92, 262); g.lineTo(78, 352); g.moveTo(208, 262); g.lineTo(222, 352); g.stroke();
    const b = Art.beaker(g, 150, 258, 150, 168, { level: 0.74, liquid: C.water, ticks: false, inside: (g2, box) => {
      const n = Math.round(lerp(0, 4, seg(T, 60, 100)) + bf * 12);
      if (n > 0) Art.bubbles(g2, box.x0 + 12, box.x1 - 12, box.bottom - 6, box.top + 2, t * (0.55 + bf * 1.1), { n, r: 3.4 + bf * 3.2 });
    } });
    if (bf > 0 || T > 85) Art.smoke(g, 150, b.top - 2, t, { n: 7 + Math.round(bf * 8), h: 66 + bf * 26, r: 9, alpha: 0.12 + bf * 0.34, spread: 22 });
    Art.thermometer(g, 276, 118, 168, seg(T, 0, 110), { w: 15 });
    Art.text(g, Math.round(T) + ' °C', 280, 74, { font: 'display', size: 36, color: C.sun, halo: true });
    return [185, b.surface + 4];
  }
  function macroBurn(g, s, t) {
    const lit = seg(s, 0.03, 0.12);
    const fx = 165;
    Art.bunsen(g, fx, 352, 1.02, { air: 1, flame: lit, t });
    // A cold glass held over the flame: water from the reaction fogs its inside.
    g.save(); g.translate(fx, 44); g.scale(1, -1);
    Art.beaker(g, 0, 0, 148, 92, { level: 0, ticks: false });
    g.restore();
    for (let i = 0; i < 26; i++) {
      const q = seg(s, 0.2 + (i / 26) * 0.7, 0.28 + (i / 26) * 0.7);
      if (q <= 0) continue;
      const x = fx - 62 + rand(i + 3) * 124, y = 48 + rand(i + 9) * 74, r = (2 + rand(i + 1) * 3.2) * q;
      g.fillStyle = 'rgba(190,232,255,.8)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    return [fx, 214];
  }

  const vStage = Lab.stage('#c-views', {
    h: 512,
    bg: (g, W, H) => {
      Art.bg(g, W, H, 'micro', 0);
      Art.bench(g, W, 352, 40);
    },
    label: 'One event shown three linked ways: a lab scene on the left, a magnifier into the particles on the right, and the chemical symbols below. The slider moves all three together.',
    draw(g, t, dt, st) {
      if (V.play && dt > 0) {
        V.hold -= dt;
        if (V.hold <= 0) {
          V.u += dt / 9;
          if (V.u >= 1) { V.u = 0; V.hold = 1.2; }
          V.s = 0.5 - 0.5 * Math.cos(V.u * TAU);
          if (V.u > 0.5 && V.u < 0.5 + dt / 9 + 1e-6) V.hold = 2.2;
          syncSlider();
        }
      }
      const { ev, s, follow } = V, W = st.W;
      // Band behind the symbols.
      g.fillStyle = 'rgba(16,8,32,.85)'; g.fillRect(0, 392, W, 120);
      g.fillStyle = Art.alpha(C.pink, 0.9); g.fillRect(0, 392, W, 3);
      const from = ev === 'glass' ? macroGlass(g, s, t) : ev === 'boil' ? macroBoil(g, s, t) : macroBurn(g, s, t);
      const cx = 590, cy = 205, R = 162;
      Art.zoom(g, from[0], from[1], cx, cy, R, (gg, x, y) => {
        if (ev === 'glass') particlesGlass(gg, x, y, t, follow);
        else if (ev === 'boil') particlesBoil(gg, x, y, R, s, t, follow);
        else particlesBurn(gg, s, t, follow);
      }, { rim: C.cyan });
      Art.arrow(g, 545, 378, 520, 404, { color: C.pink, w: 4, both: true, head: 10 });
      symbolsRow(g, ev, s, follow);
      Art.pill(g, 'What you see', 92, 28, { size: 23, color: C.sun, text: '#22123A' });
      Art.pill(g, 'The particles', 716, 26, { size: 23, color: C.cyan, text: '#06324A' });
      Art.pill(g, 'The symbols', 86, 424, { size: 23, color: C.pink, text: '#fff' });
    },
  });
  function particlesGlass(g, cx, cy, t, f) {
    LIQ.forEach((m) => {
      const x = cx + m.x + wander(m.seed, t * 1.1) * 6, y = cy + m.y + wander(m.seed + 40, t * 1.1) * 6;
      const center = m.x === 0 && m.y === 0;
      const o = { t, seed: m.seed };
      if (f === 'mol') { o.aH = o.aO = center ? 1 : 0.2; if (center) o.face = 'happy'; }
      if (f === 'H') { o.aO = 0.22; o.ringH = true; }
      if (f === 'O') { o.aH = 0.22; o.ringO = true; }
      if (f === 'none' && center) o.face = 'happy';
      water(g, x, y, 190, m.rot + Math.sin(t * 0.8 + m.seed) * 0.5, o);
      if (f === 'mol' && center) Art.ring(g, x, y, 54, { color: C.sun, w: 4 });
    });
  }
  function particlesBoil(g, cx, cy, R, s, t, f) {
    const T = boilT(s), amp = 3 + ((T - 20) / 80) * 9, surfY = cy + 12;
    const gr = g.createLinearGradient(0, surfY, 0, cy + R);
    gr.addColorStop(0, Art.alpha(C.water, 0.42)); gr.addColorStop(1, Art.alpha('#1B5FA0', 0.55));
    g.fillStyle = gr; g.fillRect(cx - R, surfY, R * 2, R);
    g.strokeStyle = 'rgba(214,240,255,.7)'; g.lineWidth = 3;
    g.beginPath();
    for (let x = -R; x <= R; x += 10) { const yy = surfY + Math.sin(x * 0.04 + t * 2.4) * (1.5 + (T - 20) / 40); if (x === -R) g.moveTo(cx + x, yy); else g.lineTo(cx + x, yy); }
    g.stroke();
    SURF.forEach((m, i) => {
      const center = m.th === 0.45;
      const q = m.th === undefined ? 0 : ease.inOut(seg(s, m.th, Math.min(1, m.th + 0.09)));
      const hx = cx + m.x + wander(m.seed, t * (1 + T / 60)) * amp, hy = cy + m.y + wander(m.seed + 40, t * (1 + T / 60)) * amp * 0.6;
      // Once free, a molecule zips around the space above the water, still whole.
      const gx = cx + Math.sin(t * m.sp * 1.3 + i * 2.1) * 106, gy = cy - 66 + Math.sin(t * m.sp * 1.8 + i * 1.4) * 58 * (1 - Math.abs(Math.sin(t * m.sp * 1.3 + i * 2.1)) * 0.45);
      const o = { t, seed: i };
      if (f === 'mol') { o.aH = o.aO = center ? 1 : 0.2; if (center) o.face = 'wow'; }
      if (f === 'H') { o.aO = 0.22; o.ringH = true; }
      if (f === 'O') { o.aH = 0.22; o.ringO = true; }
      if (f === 'none' && center) o.face = q > 0.5 ? 'wow' : 'happy';
      const x = lerp(hx, gx, q), y = lerp(hy, gy, q);
      water(g, x, y, 170, m.rot + (q > 0.5 ? t * (2 + m.sp) : Math.sin(t * (0.8 + T / 80) + i) * (0.3 + T / 150)), o);
      if (f === 'mol' && center) Art.ring(g, x, y, 48, { color: C.sun, w: 4 });
    });
  }
  function particlesBurn(g, s, t, f) {
    const q = ease.inOut(seg(s, 0.15, 0.82));
    const mid = 1 - Math.abs(q * 2 - 1);
    const pos = BURN.map((a, i) => ({
      x: lerp(a.a[0], a.b[0], q) + wander(i * 3, t * 1.4) * (3 + mid * 12) + Math.sin(q * TAU + i) * mid * 18,
      y: lerp(a.a[1], a.b[1], q) + wander(i * 3 + 40, t * 1.4) * (3 + mid * 12) + Math.cos(q * TAU + i * 2) * mid * 18,
    }));
    const active = (a) => {
      if (f === 'none') return 1;
      // Following a substance traces its atoms the whole way through, so you can see where they end up.
      return a.sp.includes(f) ? 1 : 0.22;
    };
    const bondA = (list, alpha) => list.forEach(([i, j, order]) => {
      const a = Math.min(active(BURN[i]), active(BURN[j])) * alpha;
      if (a <= 0) return;
      g.save(); g.globalAlpha *= a;
      Art.bond(g, pos[i].x, pos[i].y, pos[j].x, pos[j].y, { order, width: 6.5 });
      g.restore();
    });
    bondA(BEFORE_BONDS, clamp(1 - q * 4));
    bondA(AFTER_BONDS, clamp((q - 0.72) * 3.6));
    if (mid > 0.05) Art.glow(g, 590, 205, 170, C.fire, 0.6 * mid);
    BURN.forEach((a, i) => {
      const al = active(a);
      Art.atom(g, pos[i].x, pos[i].y, a.r, a.s, { alpha: al, face: a.s === 'C' ? (mid > 0.3 ? 'wow' : 'happy') : (a.s === 'O' && mid > 0.3 ? 'wow' : null), t, seed: i, label: a.s === 'C' || a.s === 'O' ? false : 'H' });
      if (al === 1 && f !== 'none') Art.ring(g, pos[i].x, pos[i].y, a.r + 3, { color: C.sun, w: 3.5 });
    });
    const before = 1 - seg(q, 0, 0.14), after = seg(q, 0.88, 1);
    if (before > 0) {
      g.globalAlpha = before;
      Art.formula(g, 'CH4', 520, 300, { size: 30, colorize: true, halo: true });
      Art.formula(g, 'O2', 667, 88, { size: 30, colorize: true, halo: true });
      Art.formula(g, 'O2', 667, 326, { size: 30, colorize: true, halo: true });
      g.globalAlpha = 1;
    }
    if (after > 0) {
      g.globalAlpha = after;
      Art.formula(g, 'CO2', 590, 84, { size: 30, colorize: true, halo: true });
      Art.formula(g, '2H2O', 590, 340, { size: 30, colorize: true, halo: true });
      g.globalAlpha = 1;
    }
  }
  function symbolsRow(g, ev, s, f) {
    const y = 434;
    if (ev === 'glass') {
      eqRow(g, [{ f: 'H2', tight: true, on: f === 'H' || f === 'mol' }, { f: 'O', tight: true, on: f === 'O' || f === 'mol' }, { f: '(l)' }], 430, y, 52);
      const N = (s * 250 / 18.015) * 6.022e23;
      Art.text(g, N > 0 ? Lab.sig(N, 3) + ' molecules, all the same' : 'No water, no molecules', 430, 488, { size: 24, color: C.dim });
    } else if (ev === 'boil') {
      const bf = boilF(s), on = (x) => f === x || f === 'mol';
      const T = boilT(s);
      const a2 = T >= 100 ? 0.5 + bf * 0.5 : 0.25;
      eqRow(g, [{ f: 'H2', tight: true, on: on('H') }, { f: 'O', tight: true, on: on('O') }, { f: '(l)' }, { f: '->', a: a2 }, { f: 'H2', tight: true, a: a2, on: on('H') && T >= 100 }, { f: 'O', tight: true, a: a2, on: on('O') && T >= 100 }, { f: '(g)', a: a2 }], 430, y, 46);
      Art.text(g, T < 100 ? 'Warming up. Almost all still liquid.' : 'Still H₂O on both sides. No atoms changed partners.', 430, 488, { size: 24, color: C.dim });
    } else {
      const q = ease.inOut(seg(s, 0.15, 0.82));
      const ar = 1 - q * 0.55, ap = 0.45 + q * 0.55;
      eqRow(g, [{ f: 'CH4', a: ar, on: f === 'CH4' }, { f: '+', a: ar }, { f: '2O2', a: ar, on: f === 'O2' }, { f: '->' }, { f: 'CO2', a: ap, on: f === 'CO2' }, { f: '+', a: ap }, { f: '2H2O', a: ap, on: f === 'H2O' }], 460, y, 44);
      Art.text(g, '1 C, 4 H and 4 O on both sides. Atoms only rearrange.', 460, 488, { size: 24, color: C.dim });
    }
  }
  const vSlider = Lab.$('#v-s');
  function syncSlider() { vSlider.value = V.s; paintViews(); }
  const VLABEL = {
    glass: ['How full', (s) => Math.round(s * 250) + ' mL'],
    boil: ['Burner heat', (s) => (s < 0.7 ? Math.round(boilT(s)) + ' °C' : '100 °C, ' + Math.round(boilF(s) * 100) + '% of full boil')],
    burn: ['Reaction progress', (s) => Math.round(ease.inOut(seg(s, 0.15, 0.82)) * 100) + '% rearranged'],
  };
  let footKey = '';
  function paintViews() {
    Lab.paintRange(vSlider);
    Lab.$('#v-s-label').textContent = VLABEL[V.ev][0];
    Lab.$('#v-s-out').textContent = VLABEL[V.ev][1](V.s);
    const s = V.s;
    let key, see, part, sym;
    if (V.ev === 'glass') {
      key = 'glass';
      see = 'a clear liquid filling a glass. More water looks like more of the same.';
      part = 'molecules slide past each other. Adding water adds molecules, but every one is the same.';
      sym = '$\\ce{H2O(l)}$ never changes, however full the glass is.';
    } else if (V.ev === 'boil') {
      const T = boilT(s);
      key = 'boil' + (T < 100 ? 0 : 1);
      see = T < 100 ? 'the water warms up on the burner. Few bubbles so far.' : 'big bubbles and rising steam. The thermometer stays at 100 °C while it boils.';
      part = T < 100 ? 'molecules jiggle faster as the temperature rises. Now and then one escapes.' : 'molecules break away from each other and fly off, each one <b>still whole</b>.';
      sym = '$\\ce{H2O(l) -> H2O(g)}$. Only the state label changes.';
    } else {
      const q = ease.inOut(seg(s, 0.15, 0.82));
      key = 'burn' + (q < 0.5 ? 0 : 1);
      see = 'a blue flame, and fog forming on a cold glass above it. That fog is water made by the flame.';
      part = q < 0.5 ? 'methane and oxygen molecules collide, and their bonds start to break.' : 'the same atoms have new partners. Carbon dioxide and water now exist.';
      sym = '$\\ce{CH4 + 2O2 -> CO2 + 2H2O}$. Count the atoms on each side.';
    }
    if (key !== footKey) {
      footKey = key;
      Lab.$('#v-foot').innerHTML = Lab.texString(`<p><b>You see:</b> ${see}</p><p><b>The particles:</b> ${part}</p><p><b>The symbols:</b> ${sym}</p>`);
    }
  }
  function buildFollow() {
    const el = Lab.$('#v-follow');
    el.innerHTML = FLW[V.ev].map(([v, label], i) => `<button type="button" data-value="${v}" aria-pressed="${i === 0}">${label}</button>`).join('');
    V.follow = 'none';
    Lab.segmented(el, (v) => { V.follow = v; vStage.redraw(); });
  }
  const paintPlay = () => { Lab.$('#v-play').textContent = V.play ? 'Pause' : 'Play the event'; };
  Lab.segmented('#v-event', (v) => { V.ev = v; footKey = ''; V.s = v === 'glass' ? 0.6 : 0; V.u = v === 'glass' ? 0.35 : 0; V.hold = 0.6; vSlider.value = V.s; buildFollow(); paintViews(); vStage.redraw(); });
  vSlider.addEventListener('input', () => {
    V.s = +vSlider.value; V.play = false;
    V.u = Math.acos(clamp(1 - 2 * V.s, -1, 1)) / TAU;
    paintPlay(); paintViews(); vStage.redraw();
  });
  Lab.$('#v-play').addEventListener('click', () => {
    V.play = !V.play;
    if (V.play) { if (Lab.reducedMotion) { V.play = false; V.s = V.s > 0.5 ? 0 : 1; syncSlider(); vStage.redraw(); } V.hold = 0; }
    paintPlay();
  });
  buildFollow(); paintViews(); paintPlay();

  /* ---------- Bench: the true-scale powers-of-ten zoom ----------
     Everything is positioned relative to one point: the center of an oxygen nucleus in a water molecule
     in a red blood cell lying on a hair on a person's head. The picture scales about that point, so
     every object keeps its true size at every zoom. L is log10 of the picture's width in meters. */
  const L_MAX = 0.6, L_MIN = -13.87;
  const NM = 1e-9, UM = 1e-6;
  const R_HAIR = 35 * UM, R_CELL = 3.75 * UM;
  const CELL_POS = [1.4 * UM, -0.9 * UM];
  const STOPS = { person: 0.6, hair: -3.4, cell: -4.8, protein: -7.9, water: -9.0, atom: -9.3, nucleus: L_MIN };
  const Z = { L: L_MAX, target: null, tour: false, speed: 0 };
  const CAM = [[0.6, 150, -168], [-0.25, 40, -140], [-0.8, 10, -110], [-2, 0, 0], [-4.0, 0, 0], [-4.8, -71, 45], [-5.7, 0, 0], [-7.2, 0, 0], [-7.9, -228, 38], [-8.7, 0, 0], [-14, 0, 0]];
  function camera(L) {
    for (let i = 0; i < CAM.length - 1; i++) {
      const A = CAM[i], B = CAM[i + 1];
      if (L <= A[0] && L >= B[0]) {
        const f = (A[0] - L) / (A[0] - B[0]), u = f * f * (3 - 2 * f);
        return [lerp(A[1], B[1], u), lerp(A[2], B[2], u)];
      }
    }
    return [0, 0];
  }
  const windowA = (L, hi, lo, fade = 0.12) => clamp((hi - L) / fade) * clamp((L - lo) / fade);

  /* The person, in meters, with the top of the head near y = 0.055 and the hair through the origin. */
  function person(g, ox, oy, S, t, alpha) {
    const cx = 0.04;
    g.save();
    g.globalAlpha *= alpha;
    g.translate(ox, oy); g.scale(S, S);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const ink = '#1A0F2E', lw = Math.min(0.014, 3.2 / S);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cx, 1.76, 0.36, 0.05, 0, 0, TAU); g.fill();
    // Legs and shoes.
    g.fillStyle = '#3E4A8A'; g.strokeStyle = ink; g.lineWidth = lw;
    Art.round(g, cx - 0.155, 0.84, 0.14, 0.86, 0.05); g.fill(); g.stroke();
    Art.round(g, cx + 0.015, 0.84, 0.14, 0.86, 0.05); g.fill(); g.stroke();
    g.fillStyle = C.pink;
    Art.round(g, cx - 0.2, 1.67, 0.19, 0.085, 0.04); g.fill(); g.stroke();
    Art.round(g, cx + 0.01, 1.67, 0.19, 0.085, 0.04); g.fill(); g.stroke();
    // Arms.
    const wave = Math.sin(t * 2.4) * 0.03;
    g.strokeStyle = ink; g.lineWidth = 0.115;
    g.beginPath(); g.moveTo(cx - 0.22, 0.42); g.lineTo(cx - 0.29, 0.86); g.stroke();
    g.beginPath(); g.moveTo(cx + 0.22, 0.42); g.lineTo(cx + 0.46, 0.2 + wave); g.lineTo(cx + 0.4 + wave, -0.08); g.stroke();
    g.strokeStyle = '#F4F0FF'; g.lineWidth = 0.09;
    g.beginPath(); g.moveTo(cx - 0.22, 0.42); g.lineTo(cx - 0.29, 0.86); g.stroke();
    g.beginPath(); g.moveTo(cx + 0.22, 0.42); g.lineTo(cx + 0.46, 0.2 + wave); g.lineTo(cx + 0.4 + wave, -0.08); g.stroke();
    g.fillStyle = '#E0A878'; g.strokeStyle = ink; g.lineWidth = lw;
    g.beginPath(); g.arc(cx - 0.29, 0.91, 0.05, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.arc(cx + 0.4 + wave, -0.12, 0.05, 0, TAU); g.fill(); g.stroke();
    // Lab coat.
    const coat = g.createLinearGradient(cx - 0.3, 0, cx + 0.3, 0);
    coat.addColorStop(0, '#FFFFFF'); coat.addColorStop(1, '#CFC8E6');
    g.fillStyle = coat;
    g.beginPath(); g.moveTo(cx - 0.21, 0.36); g.quadraticCurveTo(cx - 0.24, 0.31, cx - 0.1, 0.3); g.lineTo(cx + 0.1, 0.3); g.quadraticCurveTo(cx + 0.24, 0.31, cx + 0.21, 0.36); g.lineTo(cx + 0.24, 1.02); g.lineTo(cx - 0.24, 1.02); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(cx, 0.32); g.lineTo(cx, 1.02); g.stroke();
    g.fillStyle = C.cyan; Art.round(g, cx - 0.08, 0.3, 0.16, 0.09, 0.03); g.fill(); g.stroke();
    // Neck and head.
    g.fillStyle = '#D3976A'; Art.round(g, cx - 0.05, 0.24, 0.1, 0.08, 0.02); g.fill(); g.stroke();
    const hd = g.createRadialGradient(cx - 0.035, 0.12, 0.01, cx, 0.16, 0.125);
    hd.addColorStop(0, '#F7CDA3'); hd.addColorStop(1, '#D79E72');
    g.fillStyle = '#D79E72'; g.beginPath(); g.arc(cx - 0.107, 0.17, 0.021, 0, TAU); g.arc(cx + 0.107, 0.17, 0.021, 0, TAU); g.fill();
    g.fillStyle = hd; g.beginPath(); g.arc(cx, 0.16, 0.105, 0, TAU); g.fill(); g.stroke();
    // Hair cap.
    g.fillStyle = '#5A3620';
    g.beginPath(); g.arc(cx, 0.158, 0.108, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(cx + 0.03, 0.1, cx - 0.02, 0.12); g.quadraticCurveTo(cx - 0.07, 0.13, cx - 0.107, 0.16); g.closePath(); g.fill(); g.stroke();
    g.restore();
    g.save();
    g.globalAlpha *= alpha;
    Art.face(g, ox + cx * S, oy + 0.185 * S, 0.085 * S, 'happy', { look: [0.2, -1], t });
    g.restore();
  }
  /** One strand: x = dx + a y + b y². Sampled only across the frame, so it stays smooth at any zoom. */
  function strand(g, ox, oy, S, dx, a, b, yTop, yRoot, w, main) {
    const fTop = (0 - oy) / S - 0.1 * 800 / S, fBot = (450 - oy) / S + 0.1 * 800 / S;
    const y0 = Math.max(yTop, fTop), y1 = Math.min(yRoot, fBot);
    if (y1 <= y0) return;
    const pts = [];
    for (let i = 0; i <= 28; i++) { const y = lerp(y0, y1, i / 28); pts.push([ox + (dx + a * y + b * y * y) * S, oy + y * S]); }
    const path = (off) => { g.beginPath(); pts.forEach(([x, y], i) => { if (i) g.lineTo(x + off, y); else g.moveTo(x + off, y); }); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (w <= 3) { g.strokeStyle = main ? '#E2A86E' : '#B98553'; g.lineWidth = w; path(0); g.stroke(); return; }
    if (w <= 14) {
      [[1, '#3F2412', 0], [0.7, '#764824', -0.05], [0.36, '#AA703D', -0.11], [0.12, '#E3B98A', -0.15]].forEach(([k, c, off]) => { g.strokeStyle = c; g.lineWidth = w * k; path(off * w); g.stroke(); });
      return;
    }
    // A thick strand is nearly straight on screen, so one gradient across it reads as a smooth round fiber.
    const mid = pts[14], nv = Math.hypot(a + 2 * b * lerp(y0, y1, 0.5), 1), nx = 1 / nv, ny = -(a + 2 * b * lerp(y0, y1, 0.5)) / nv;
    const gr = g.createLinearGradient(mid[0] - nx * w / 2, mid[1] - ny * w / 2, mid[0] + nx * w / 2, mid[1] + ny * w / 2);
    gr.addColorStop(0, '#37200F'); gr.addColorStop(0.12, '#6A4021'); gr.addColorStop(0.3, '#B57C49'); gr.addColorStop(0.4, '#E6BE90'); gr.addColorStop(0.5, '#B47A47'); gr.addColorStop(0.72, '#7E4E29'); gr.addColorStop(0.92, '#4E2E16'); gr.addColorStop(1, '#2C1809');
    g.strokeStyle = gr; g.lineWidth = w; path(0); g.stroke();
  }
  /** Overlapping cuticle scales on the main strand, spaced at their real pitch of about 6 micrometers. */
  function cuticle(g, ox, oy, S, a, alpha) {
    if (alpha <= 0) return;
    const norm = Math.hypot(a, 1), ux = a / norm, uy = 1 / norm, vx = 1 / norm, vy = -a / norm;
    const w = 2 * R_HAIR * S, pitch = 6 * UM * S;
    const halfFrame = 700;
    const first = Math.ceil((-halfFrame - (oy - 225) * uy - (ox - 400) * ux) / pitch), last = Math.floor((halfFrame - (oy - 225) * uy - (ox - 400) * ux) / pitch);
    g.save(); g.globalAlpha *= alpha; g.lineCap = 'round';
    const span = Math.min(w * 0.5, 1400);
    for (let i = first; i <= last; i++) {
      const u = i * pitch, cxx = ox + ux * u, cyy = oy + uy * u;
      const wob = pitch * 0.34;
      g.beginPath();
      for (let k = -14; k <= 14; k++) {
        const v = (k / 14) * span, bump = (1 - (k / 14) * (k / 14)) * wob + (rand(i) - 0.5) * pitch * 0.2;
        const x = cxx + vx * v + ux * bump, y = cyy + vy * v + uy * bump;
        if (k === -14) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokeStyle = 'rgba(38,18,6,.5)'; g.lineWidth = Math.max(1.5, pitch * 0.035); g.stroke();
      g.translate(ux * 2.4, uy * 2.4);
      g.strokeStyle = 'rgba(255,214,160,.2)'; g.lineWidth = Math.max(1, pitch * 0.02); g.stroke();
      g.translate(-ux * 2.4, -uy * 2.4);
    }
    g.restore();
  }
  function bloodCell(g, x, y, R, rot, alpha) {
    if (alpha <= 0 || x + R < -40 || x - R > 840 || y + R < -40 || y - R > 490) return;
    g.save();
    g.globalAlpha *= alpha;
    g.translate(x, y); g.rotate(rot); g.scale(1, 0.94);
    g.fillStyle = 'rgba(30,6,4,.4)'; g.beginPath(); g.ellipse(R * 0.05, R * 0.1, R * 1.03, R * 1.03, 0, 0, TAU); g.fill();
    const gr = g.createRadialGradient(0, 0, R * 0.05, 0, 0, R);
    gr.addColorStop(0, '#9E1A2E'); gr.addColorStop(0.3, '#A81C30'); gr.addColorStop(0.58, '#D42C42'); gr.addColorStop(0.84, '#F4586A'); gr.addColorStop(1, '#AE1730');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,190,190,.42)'; g.lineWidth = Math.max(1.2, R * 0.07); g.lineCap = 'round';
    g.beginPath(); g.arc(0, 0, R * 0.8, Math.PI * 1.08, Math.PI * 1.62); g.stroke();
    g.strokeStyle = '#4D0A18'; g.lineWidth = Math.max(1, R * 0.018); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke();
    g.restore();
  }
  /* A sprite of hemoglobin: four lobes of bumpy atoms with an iron-holding heme in each. */
  const hbSprites = (function () {
    let big = null, small = null;
    const build = () => {
      const S = 560, c = document.createElement('canvas'); c.width = c.height = S;
      const x = c.getContext('2d'); x.translate(S / 2, S / 2);
      const lobes = [[-96, -88], [98, -92], [-92, 96], [100, 88], [0, 0]];
      const atoms = [];
      const pal = 'CCCCCCCCCCCCNNNOOOCCCCCCCCCCCCNNNOOOS'.split('');
      lobes.forEach(([lx, ly], li) => {
        for (let i = 0; i < 520; i++) {
          // Points on and inside a ball, so the surface reads as packed atoms.
          const z = rand(i * 4.1 + li * 7) * 2 - 1, a = rand(i * 1.3 + li * 40) * TAU, rr = Math.sqrt(1 - z * z), d = 150 * Math.cbrt(rand(i * 2.7 + li * 13) * 0.6 + 0.4);
          atoms.push({ x: lx + Math.cos(a) * rr * d, y: ly + Math.sin(a) * rr * d, z: z * d + (li === 4 ? -60 : 0), c: Art.elementColor(pal[Math.floor(rand(i * 5.9 + li) * pal.length)]) });
        }
      });
      atoms.sort((a, b) => a.z - b.z);
      atoms.forEach((a) => Art.ball(x, a.x, a.y, 17, Art.mix(a.c, '#12062A', 0.5 * clamp(1 - (a.z + 150) / 300))));
      lobes.slice(0, 4).forEach(([lx, ly]) => {
        const hx = lx * 0.95, hy = ly * 0.95;
        for (let k = 0; k < 4; k++) Art.ball(x, hx + Math.cos(k * 1.57) * 30, hy + Math.sin(k * 1.57) * 30, 15, Art.elementColor('N'));
        Art.ball(x, hx, hy, 19, EFE);
      });
      big = c;
      small = document.createElement('canvas'); small.width = small.height = 96;
      small.getContext('2d').drawImage(c, 0, 0, 96, 96);
    };
    return { get big() { if (!big) build(); return big; }, get small() { if (!small) build(); return small; } };
  })();
  const HB = (() => {
    const out = [], sp = 7.6;
    for (let j = -30; j <= 30; j++) for (let i = -30; i <= 30; i++) {
      out.push({ x: 3.6 + i * sp + (i || j ? (rand(i * 3 + j * 7) - 0.5) * 1.6 : 0), y: -0.6 + j * sp + (i || j ? (rand(i * 5 + j * 2) - 0.5) * 1.6 : 0), rot: rand(i * 11 + j * 13) * TAU });
    }
    return out;
  })();
  const SEA = (() => {
    const out = [], sp = 0.335;
    for (let j = -8; j <= 8; j++) for (let i = -14; i <= 14; i++) {
      const x = i * sp + (rand(i * 3 + j * 17) - 0.5) * 0.12, y = j * sp + (rand(i * 7 + j * 5) - 0.5) * 0.12;
      if (Math.hypot(x, y) < 0.33) continue;
      if (HB.some((h) => Math.hypot(h.x - x, h.y - y) < 2.55)) continue;
      out.push({ x, y, rot: rand(i * 13 + j * 3) * TAU, seed: out.length });
    }
    return out;
  })();
  /* Sixteen nucleons of oxygen-16, placed on two shells and sorted by depth. Charge radius about 2.7 fm. */
  const NUC = (() => {
    const out = [], ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < 12; i++) {
      const z = 1 - (i + 0.5) * (2 / 12), r = Math.sqrt(1 - z * z), a = i * ga;
      out.push({ x: Math.cos(a) * r * 2.02, y: Math.sin(a) * r * 2.02, z: z * 2.02 });
    }
    for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.5; out.push({ x: Math.cos(a) * 0.72, y: Math.sin(a) * 0.72, z: i % 2 ? 0.5 : -0.5 }); }
    out.forEach((n, i) => { n.p = [0, 2, 3, 5, 7, 8, 10, 12].includes(i); n.seed = i; });
    return out.sort((a, b) => a.z - b.z);
  })();
  const HB_PITCH = 7.6;
  /** A repeating grain of hemoglobin at its true spacing, for when each molecule is only a few pixels. */
  let grain = null;
  function hbGrain(g) {
    if (grain) return grain;
    const c = document.createElement('canvas'); c.width = c.height = 360;
    const x = c.getContext('2d');
    for (let j = 0; j < 36; j++) for (let i = 0; i < 36; i++) {
      const px = i * 10 + 5 + (rand(i * 3 + j * 7) - 0.5) * 2, py = j * 10 + 5 + (rand(i * 5 + j * 2) - 0.5) * 2;
      x.fillStyle = 'rgba(28,6,18,.62)'; x.beginPath(); x.arc(px, py, 3.7, 0, TAU); x.fill();
      x.fillStyle = 'rgba(230,150,150,.28)'; x.beginPath(); x.arc(px - 0.9, py - 0.9, 1.5, 0, TAU); x.fill();
    }
    grain = g.createPattern(c, 'repeat');
    return grain;
  }
  const fieldKeys = [[-5.4, '#A81C31'], [-6.2, '#7C1428'], [-6.9, '#3A0E22'], [-8.3, '#231236'], [-9.4, '#160E2C'], [-10.5, '#0B0A22'], [-14, '#090718']];
  function fieldColor(L) {
    for (let i = 0; i < fieldKeys.length - 1; i++) {
      const A = fieldKeys[i], B = fieldKeys[i + 1];
      if (L <= A[0] && L >= B[0]) return Art.mix(A[1], B[1], (A[0] - L) / (A[0] - B[0]));
    }
    return fieldKeys[0][1];
  }
  const UNITS = [[1, 'm'], [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm'], [1e-12, 'pm'], [1e-15, 'fm']];
  function fmtLen(m, sf = 2) {
    const u = UNITS.find(([k]) => m >= k * 0.9999) || UNITS[UNITS.length - 1];
    return `${Lab.sig(m / u[0], sf)} ${u[1]}`;
  }
  const sciM = (m, sf = 2) => {
    const e = Math.floor(Math.log10(m) + 1e-9), mant = m / Math.pow(10, e);
    return `${mant.toFixed(sf - 1)} × 10${Lab.sup(e)} m`;
  };
  const LABELS = [
    [0.8, -0.55, 'A person', 'about 1.7 m tall'],
    [-0.6, -2.3, 'One hair', 'Zooming in on a single strand'],
    [-2.5, -4.15, 'A human hair', 'about 70 micrometers wide'],
    [-4.2, -5.5, 'A red blood cell', 'about 7.5 micrometers across'],
    [-5.55, -6.95, 'Inside the cell', 'Light microscopes give up about here'],
    [-7.0, -8.42, 'Hemoglobin', 'one big molecule, about 5.5 nm'],
    [-8.45, -9.17, 'A water molecule', 'about 0.3 nanometers across'],
    [-9.19, -9.72, 'An oxygen atom', 'The ball is only a handy drawing'],
    [-9.75, -11.5, 'Inside the electron cloud', 'A fuzzy blur, mostly empty space'],
    [-11.55, -12.45, 'Still nearly nothing', 'Keep going. Look at the very center'],
    [-12.5, -13.25, 'There it is', 'That speck is the nucleus'],
    [-13.3, -14.2, 'The nucleus', 'about 5 femtometers wide'],
  ];
  const zStage = Lab.stage('#c-zoom', {
    h: 450,
    label: 'A true-scale zoom from a person down through a hair, a red blood cell, a protein, a water molecule and an oxygen atom to its nucleus, with a scale bar.',
    draw(g, t, dt, st) {
      if (Z.target !== null && dt > 0) {
        const d = Z.target - Z.L;
        if (Z.tour) {
          // The tour eases slowly through the empty stretch only because the slider is linear in powers of ten.
          Z.L = Math.max(Z.target, Z.L - dt * 0.95);
          if (Z.L === Z.target) { Z.target = null; Z.tour = false; Lab.$('#z-tour').textContent = 'Play the whole zoom'; }
        } else {
          Z.L += Math.sign(d) * Math.min(Math.abs(d), Math.max(0.5, Math.abs(d) * 2.4) * dt);
          if (Math.abs(Z.target - Z.L) < 1e-3) { Z.L = Z.target; Z.target = null; }
        }
        paintZoom();
      }
      const W = st.W, H = st.H, L = Z.L;
      const fov = Math.pow(10, L), S = W / fov;
      const cam = camera(L), ox = W / 2 + cam[0], oy = H / 2 + cam[1];
      const X = (m) => ox + m * S, Y = (m) => oy + m * S;

      /* Person and Moe, at true scale. */
      if (L > -2) {
        const a = clamp((L + 2) / 0.5);
        if (L > -0.3) {
          g.fillStyle = Art.alpha('#120A22', clamp((L + 0.3) / 0.3) * 0.7);
          g.fillRect(0, Y(1.755), W, Math.max(0, H - Y(1.755)));
        }
        person(g, ox, oy, S, t, a);
        if (L > -0.15) {
          g.save();
          Art.moe(g, X(-0.72), Y(1.755), 0.56 * S, 'point', { t, bob: true });
          g.restore();
        }
        const dim = clamp((L - 0.1) / 0.3);
        if (dim > 0) {
          const ax = X(0.62);
          g.save(); g.globalAlpha = dim;
          Art.arrow(g, ax, Y(1.73), ax, Y(0.08), { color: C.sun, w: 4, both: true, head: 12 });
          Art.text(g, '1.7 m', ax + 12, Y(0.9), { font: 'display', size: 30, color: C.sun, align: 'left', halo: true });
          g.restore();
        }
      }
      /* Hair. Strands thinner than a pixel get a minimum width so you can find them. */
      if (L > -5.35) {
        const a = clamp((L + 5.35) / 0.3);
        g.save(); g.globalAlpha *= a;
        const w = Math.max(1.5, 2 * R_HAIR * S);
        const others = [[-0.0026, 0.34, 5.2, -0.05], [-0.0012, 0.31, 6.4, -0.04], [0.0013, 0.38, 5.8, -0.062], [0.0029, 0.33, 6.6, -0.044], [0.0047, 0.36, 5, -0.03]];
        others.forEach(([dx, sl, cv, top]) => strand(g, ox, oy, S, dx, sl, cv, top, 0.075, w, false));
        strand(g, ox, oy, S, 0, 0.35, 6, -0.06, 0.075, w, true);
        cuticle(g, ox, oy, S, 0.35, clamp((-3.32 - L) / 0.25));
        g.restore();
      }
      /* Red blood cells lying on the hair. */
      if (L < -3 && L > -6.1) {
        const a = clamp((-3 - L) / 0.1) * clamp((L + 6.1) / 0.3);
        const r = R_CELL * S;
        [[11, 6.5, 0.4], [-9.5, -7, 1.3], [-14, 8, 2.1], [17, -6, 0.9]].forEach(([dx, dy, rot]) => bloodCell(g, X(CELL_POS[0] + dx * UM), Y(CELL_POS[1] + dy * UM), r, rot, a));
        bloodCell(g, X(CELL_POS[0]), Y(CELL_POS[1]), r, 0.2, a);
      }
      /* Inside the cell: the field darkens so the molecules can be seen. */
      if (L < -5.35) {
        g.fillStyle = Art.alpha(fieldColor(L), clamp((-5.35 - L) / 0.35));
        g.fillRect(0, 0, W, H);
      }
      if (L < -5.45 && L > -6.95) {
        const k = (HB_PITCH * NM * S) / 10;
        const pat = hbGrain(g);
        pat.setTransform(new DOMMatrix([k, 0, 0, k, X(3.6 * NM), Y(-0.6 * NM)]));
        g.save();
        g.globalAlpha *= clamp((-5.45 - L) / 0.4) * clamp((L + 6.95) / 0.3);
        g.fillStyle = pat; g.fillRect(0, 0, W, H);
        g.restore();
      }
      /* The water around the proteins. */
      if (L < -8.05 && L > -9.5) {
        const a = clamp((-8.05 - L) / 0.25);
        const sNm = S * NM;
        g.save(); g.globalAlpha *= a * clamp((L + 9.5) / 0.2);
        SEA.forEach((m) => {
          const x = X(m.x * NM) + wander(m.seed, t) * sNm * 0.012, y = Y(m.y * NM) + wander(m.seed + 40, t) * sNm * 0.012;
          if (x < -0.3 * sNm || x > W + 0.3 * sNm || y < -0.3 * sNm || y > H + 0.3 * sNm) return;
          water(g, x, y, sNm, m.rot + Math.sin(t * 0.7 + m.seed) * 0.25);
        });
        g.restore();
      }
      const veil = clamp((-8.5 - L) / 0.3);
      /* Hemoglobin. */
      if (L < -6.55 && L > -8.75) {
        const a = clamp((-6.55 - L) / 0.3) * clamp((L + 8.75) / 0.25);
        const r = 2.75 * NM * S, spr = r > 40 ? hbSprites.big : hbSprites.small;
        g.save(); g.globalAlpha *= a;
        HB.forEach((h) => {
          const x = X(h.x * NM), y = Y(h.y * NM);
          if (x < -r || x > W + r || y < -r || y > H + r) return;
          g.save(); g.translate(x, y); g.rotate(h.rot + wander(h.rot, t * 0.25) * 0.05);
          g.drawImage(spr, -r, -r, r * 2, r * 2);
          g.restore();
        });
        g.restore();
      }
      /* Dim everything else so the eye lands on one molecule. */
      if (veil > 0) { g.fillStyle = `rgba(22,14,44,${0.62 * veil})`; g.fillRect(0, 0, W, H); }
      /* The chosen water molecule, then its oxygen atom. */
      if (L < -8.05 && L > -9.8) {
        const sNm = S * NM;
        const a = clamp((-8.05 - L) / 0.25);
        const toCloud = clamp((-9.35 - L) / 0.35);
        const ball = 1 - toCloud;
        if (ball > 0) {
          g.save(); g.globalAlpha *= a * ball;
          water(g, ox, oy, sNm, 0, { aH: clamp(1 - toCloud * 2.6), face: L > -9.42 ? (L < -9.15 ? 'wow' : 'happy') : null, t, seed: 3, look: [0, 0.2] });
          g.restore();
          if (L > -8.95) Art.ring(g, ox, oy + 0.03 * sNm, 0.24 * sNm, { color: C.sun, w: 4, p: clamp((-8.3 - L) / 0.2) });
        }
      }
      /* The electron cloud: a blur with a brighter inner shell. Deep inside it fades, so the emptiness reads as empty. */
      if (L < -9.3) {
        const a = clamp((-9.3 - L) / 0.4);
        const deep = 0.1 + 0.9 * clamp((L + 11.6) / 1.1);
        const R1 = 0.16 * NM * S, R2 = 0.016 * NM * S;
        g.save();
        g.globalAlpha *= a;
        const c1 = g.createRadialGradient(ox, oy, 0, ox, oy, R1);
        c1.addColorStop(0, `rgba(70,214,255,${0.42 * deep})`); c1.addColorStop(0.4, `rgba(47,214,242,${0.26 * deep})`); c1.addColorStop(0.8, `rgba(47,150,242,${0.09 * deep})`); c1.addColorStop(1, 'rgba(47,120,242,0)');
        g.fillStyle = c1; g.fillRect(0, 0, W, H);
        if (R2 > 20 && L > -11.8) {
          const c2 = g.createRadialGradient(ox, oy, 0, ox, oy, R2);
          c2.addColorStop(0, `rgba(200,250,255,${0.45 * deep})`); c2.addColorStop(0.45, `rgba(120,235,255,${0.24 * deep})`); c2.addColorStop(1, 'rgba(90,220,255,0)');
          g.fillStyle = c2; g.fillRect(0, 0, W, H);
        }
        // Where an electron might be found right now: a flicker of probability, not an orbit.
        const tick = Math.floor(t * 9);
        for (let i = 0; i < 84; i++) {
          const inner = i < 16;
          const scale = inner ? 0.0075 : 0.058;
          const ang = rand(i * 3.1 + tick * 0.37) * TAU;
          const d = -Math.log(1 - rand(i * 7.7 + tick * 0.91) * 0.985) * scale * NM * S;
          const x = ox + Math.cos(ang) * d, y = oy + Math.sin(ang) * d;
          if (x < 0 || x > W || y < 0 || y > H) continue;
          g.fillStyle = 'rgba(190,245,255,.8)';
          g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill();
        }
        g.restore();
      }
      /* The nucleus: a dot at first, then protons and neutrons. */
      if (L < -11.7) {
        const r = 2.7e-15 * S;
        const fm = 1e-15 * S;
        if (r < 14) {
          const pulse = 0.65 + 0.35 * Math.sin(t * 4);
          Art.glow(g, ox, oy, Math.max(26, r * 4), '#FFB0A0', 0.85 * pulse);
          g.fillStyle = '#FFE9E2'; g.beginPath(); g.arc(ox, oy, Math.max(1.4, r), 0, TAU); g.fill();
          if (L > -12.9) Art.ring(g, ox, oy, 40 + pulse * 6, { color: C.sun, w: 3.5, dash: [8, 8] });
        }
        const a = clamp((r - 9) / 8);
        if (a > 0) {
          g.save(); g.globalAlpha *= a;
          Art.glow(g, ox, oy, r * 2, '#FF7A7A', 0.5);
          NUC.forEach((n) => {
            const x = ox + (n.x + wander(n.seed, t * 1.8) * 0.05) * fm, y = oy + (n.y + wander(n.seed + 30, t * 1.8) * 0.05) * fm, rn = 0.8 * fm;
            sball(g, x, y, rn, n.p ? C.proton : C.neutron);
            if (rn > 11 && n.p) Art.text(g, '+', x, y, { size: rn * 0.95, color: '#fff' });
          });
          g.restore();
          const lab = clamp((-13.4 - L) / 0.25);
          if (lab > 0) {
            Art.text(g, '8 protons', 112, 214, { font: 'display', size: 28, color: '#FF8A94', halo: true, alpha: lab });
            Art.arrow(g, 118, 240, 232, 268, { color: '#FF8A94', w: 4, p: lab, alpha: lab, curve: 12 });
            Art.text(g, '8 neutrons', 690, 214, { font: 'display', size: 28, color: C.neutron, halo: true, alpha: lab });
            Art.arrow(g, 684, 240, 566, 272, { color: C.neutron, w: 4, p: lab, alpha: lab, curve: -12 });
          }
        }
      }
      /* Name of what is on screen. */
      LABELS.forEach(([hi, lo, name, sub]) => {
        const a = windowA(L, hi, lo, 0.1);
        if (a <= 0) return;
        g.font = `700 25px ${Art.FONT_BODY}`;
        const plate = Math.max(g.measureText(sub).width + 34, 260);
        g.fillStyle = `rgba(16,8,32,${0.55 * a})`; Art.round(g, 10, 10, plate, 86, 16); g.fill();
        Art.text(g, name, 24, 38, { font: 'display', size: 36, align: 'left', color: '#fff', halo: true, alpha: a });
        Art.text(g, sub, 24, 76, { size: 25, align: 'left', color: C.sun, halo: true, alpha: a });
      });
      /* A true scale bar: 1, 2 or 5 of something, 90 to 220 units long. */
      const target = fov * 0.2, mag = Math.pow(10, Math.floor(Math.log10(target)));
      const step = [1, 2, 5, 10].find((k) => k * mag * S >= 90) * mag;
      const bw = step * S, bx = 24, by = H - 26;
      g.fillStyle = 'rgba(16,8,32,.72)'; Art.round(g, bx - 10, by - 44, Math.max(bw + 20, 130), 58, 12); g.fill();
      g.fillStyle = '#fff'; g.fillRect(bx, by, bw, 6); g.fillRect(bx, by - 8, 3, 14); g.fillRect(bx + bw - 3, by - 8, 3, 14);
      Art.text(g, fmtLen(step, 1), bx, by - 22, { size: 25, align: 'left', color: '#fff' });
      g.font = `700 25px ${Art.FONT_BODY}`;
      const wText = 'Width: ' + sciM(fov), wW = g.measureText(wText).width + 26;
      g.fillStyle = 'rgba(16,8,32,.72)'; Art.round(g, W - 13 - wW, H - 48, wW, 40, 12); g.fill();
      Art.text(g, wText, W - 26, H - 27, { size: 25, align: 'right', color: '#fff' });
    },
  });
  const zSlider = Lab.$('#z-s');
  const toSlider = (L) => ((L_MAX - L) / (L_MAX - L_MIN)) * 1000;
  const fromSlider = (v) => L_MAX - (v / 1000) * (L_MAX - L_MIN);
  const stopSeg = Lab.segmented('#z-stop', (v) => {
    Z.tour = false; Lab.$('#z-tour').textContent = 'Play the whole zoom';
    if (Lab.reducedMotion) { Z.L = STOPS[v]; paintZoom(); zStage.redraw(); return; }
    Z.target = STOPS[v];
  });
  function paintZoom() {
    const fov = Math.pow(10, Z.L), mag = Math.pow(10, L_MAX - Z.L);
    zSlider.value = toSlider(Z.L);
    Lab.paintRange(zSlider);
    Lab.$('#z-s-out').textContent = (L_MAX - Z.L).toFixed(1) + ' powers of ten';
    Lab.$('#z-width').textContent = fmtLen(fov);
    Lab.$('#z-sci').textContent = sciM(fov);
    const rounded = Math.round(mag);
    const big = rounded === 1 ? 'Same size' : mag < 1e4 ? rounded.toLocaleString('en-US') + ' times' : Lab.sig(mag, 2) + ' times';
    Lab.$('#z-mag').textContent = big;
    if (Z.target === null) {
      const near = Object.keys(STOPS).find((k) => Math.abs(STOPS[k] - Z.L) < 0.06);
      stopSeg.set(near || '__', false);
    }
  }
  zSlider.addEventListener('input', () => {
    Z.target = null; Z.tour = false; Lab.$('#z-tour').textContent = 'Play the whole zoom';
    Z.L = fromSlider(+zSlider.value);
    paintZoom(); zStage.redraw();
  });
  Lab.$('#z-tour').addEventListener('click', () => {
    if (Lab.reducedMotion) { Z.L = Z.L < -13 ? L_MAX : L_MIN; paintZoom(); zStage.redraw(); return; }
    if (Z.tour) { Z.tour = false; Z.target = null; Lab.$('#z-tour').textContent = 'Play the whole zoom'; return; }
    if (Z.L < L_MIN + 0.1) Z.L = L_MAX;
    Z.tour = true; Z.target = L_MIN;
    Lab.$('#z-tour').textContent = 'Stop the zoom';
    stopSeg.set('__', false);
  });
  paintZoom();

  /* ---------- Story 3: how the site works ---------- */
  Lab.story('#story-tour', {
    title: 'Four things to do in every lesson',
    scenes: [
      {
        say: '<b>Watch.</b> Stories like this one move one step at a time. Press Next when you are ready, and go back as often as you like.',
        dur: 2.6,
        draw(g, p, t) {
          Art.text(g, 'Watch', 610, 66, { font: 'display', size: 54, color: C.sun });
          g.fillStyle = '#100820'; g.strokeStyle = C.line; g.lineWidth = 3;
          Art.round(g, 60, 50, 430, 300, 22); g.fill(); g.stroke();
          g.save(); Art.round(g, 60, 50, 430, 300, 22); g.clip();
          Art.bg(g, 800, 450, 'micro', t);
          const q = ease.inOut(((t * 0.5) % 2) > 1 ? 2 - ((t * 0.5) % 2) : (t * 0.5) % 2);
          water(g, lerp(150, 400, q), 170, 480, q * 2.5, { face: 'happy', t, seed: 1, look: [q < 1 ? 1 : -1, 0] });
          g.restore();
          [0, 1, 2, 3].forEach((i) => { g.fillStyle = i < 2 ? C.pink : 'rgba(255,255,255,.3)'; g.beginPath(); g.arc(120 + i * 30, 390, 10, 0, TAU); g.fill(); });
          const pulse = 1 + Math.sin(t * 5) * 0.04;
          g.save(); g.translate(400, 390); g.scale(pulse, pulse);
          Art.pill(g, 'Next', 0, 0, { size: 32, color: C.pink, text: '#fff', font: 'display', pad: 44 });
          g.restore();
          Art.moe(g, 650, 412, 230, 'point', { t, flip: true });
        },
      },
      {
        say: '<b>Play.</b> Labs have sliders and buttons. Change something and see what happens right away. You cannot break anything, so try the extremes.',
        dur: 2.6,
        draw(g, p, t) {
          Art.text(g, 'Play', 620, 66, { font: 'display', size: 54, color: C.cyan });
          const u = 0.5 + 0.5 * Math.sin(t * 0.9);
          g.fillStyle = '#100820'; g.strokeStyle = C.line; g.lineWidth = 3;
          Art.round(g, 60, 40, 460, 290, 22); g.fill(); g.stroke();
          for (let i = 0; i < 14; i++) {
            const sp = (0.4 + u * 2.6) * (0.7 + rand(i) * 0.7);
            const tri = (v) => { const k = ((v % 2) + 2) % 2; return k > 1 ? 2 - k : k; };
            const x = 90 + tri(t * sp * 0.33 + rand(i + 3) * 2) * 400, y = 70 + tri(t * sp * 0.41 + rand(i + 9) * 2) * 230;
            Art.atom(g, x, y, 21, 'Ne', { label: false, face: i === 0 ? (u > 0.6 ? 'wow' : 'happy') : null, t });
          }
          g.fillStyle = '#4A3772'; Art.round(g, 60, 372, 460, 16, 8); g.fill();
          g.fillStyle = C.pink; Art.round(g, 60, 372, 460 * u, 16, 8); g.fill();
          Art.ball(g, 60 + 460 * u, 380, 22, C.sun);
          Art.text(g, 'Temperature', 60, 350, { size: 24, align: 'left' });
          Art.moe(g, 660, 420, 230, 'wow', { t, flip: true });
        },
      },
      {
        say: '<b>Prove it.</b> The practice gym makes endless fresh problems. Get stuck and it shows every step, with the units worked out.',
        dur: 2.8,
        draw(g, p, t) {
          Art.text(g, 'Prove it', 590, 66, { font: 'display', size: 54, color: C.leaf });
          g.fillStyle = '#FFFDF2'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          Art.round(g, 60, 60, 420, 300, 22); g.fill(); g.stroke();
          Art.text(g, 'How many O atoms', 270, 110, { size: 30, color: '#22123A' });
          Art.text(g, 'are in', 190, 158, { size: 30, color: '#22123A' });
          g.fillStyle = '#22123A'; Art.round(g, 245, 130, 150, 56, 12); g.fill();
          Art.formula(g, '3H2O', 320, 158, { size: 38, colorize: true });
          g.strokeStyle = C.pink; g.lineWidth = 4; Art.round(g, 180, 214, 180, 72, 14); g.stroke();
          const typed = seg(p, 0.2, 0.42) > 0;
          if (typed) Art.text(g, '3', 270, 250, { font: 'display', size: 48, color: '#22123A' });
          const ok = seg(p, 0.5, 0.65);
          if (ok > 0) {
            Art.popIn(g, 410, 250, ok, (gg) => {
              gg.fillStyle = C.leaf; gg.beginPath(); gg.arc(0, 0, 34, 0, TAU); gg.fill();
              gg.strokeStyle = '#fff'; gg.lineWidth = 8; gg.lineCap = 'round'; gg.beginPath(); gg.moveTo(-15, 1); gg.lineTo(-4, 13); gg.lineTo(16, -11); gg.stroke();
            });
            Art.text(g, '3 × 1 = 3', 270, 326, { size: 30, color: '#22123A', alpha: ok });
          }
          // Dumbbell.
          const y = 200 + Math.sin(t * 2.6) * 16;
          g.fillStyle = '#9A94B3'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          Art.round(g, 548, y - 7, 150, 14, 6); g.fill(); g.stroke();
          g.fillStyle = C.pink;
          Art.round(g, 530, y - 38, 30, 76, 8); g.fill(); g.stroke();
          Art.round(g, 686, y - 38, 30, 76, 8); g.fill(); g.stroke();
          Art.moe(g, 620, 430, 178, 'cheer', { t, bob: false });
        },
      },
      {
        say: '<b>Collect.</b> Every right answer discovers the next element, from hydrogen up to number 118. Find them all and you earn the rank of Nobel laureate. The Nobel committee has not confirmed this.',
        dur: 3.8,
        draw(g, p, t) {
          const tw = 39, th = 34, gx = 2.6, gy = 2.8, x0 = 28, y0 = 62;
          const lit = Math.floor(ease.inOut(seg(p, 0.08, 0.92)) * 42);
          ELEMENTS.forEach((e, i) => {
            const row = e.y - 1;
            const x = x0 + (e.x - 1) * (tw + gx), y = y0 + row * (th + gy);
            const on = i < lit;
            g.fillStyle = on ? Lab.familyColor(e.family) : 'rgba(255,255,255,.08)';
            Art.round(g, x, y, tw, th, 6); g.fill();
            if (on) Art.text(g, e.sym, x + tw / 2, y + th / 2 + 1, { font: 'display', size: 20, color: '#fff' });
          });
          Art.text(g, `${lit} of 118 discovered`, 34, 34, { font: 'display', size: 32, align: 'left', color: C.sun });
          const rank = Lab.RANKS.reduce((a, r) => (lit >= r[0] ? r[1] : a), Lab.RANKS[0][1]);
          Art.text(g, 'Rank: ' + rank, 766, 34, { size: 26, align: 'right', color: C.ink });
          const e = ELEMENTS[Math.max(0, lit - 1)];
          if (lit > 0) {
            const row = e.y - 1, x = x0 + (e.x - 1) * (tw + gx), y = y0 + row * (th + gy);
            Art.glow(g, x + tw / 2, y + th / 2, 42, C.sun, 0.7 + Math.sin(t * 6) * 0.2);
          }
        },
      },
    ],
  });

  /* ---------- Math self-check ---------- */
  Bank.buildQuiz(Lab.$('#math-check'), [
    {
      q: 'What is $0.00052$ in scientific notation?',
      options: ['$5.2 \\times 10^{-4}$', '$5.2 \\times 10^{4}$', '$52 \\times 10^{-5}$', '$5.2 \\times 10^{-3}$'],
      answer: 0,
      why: 'Move the decimal point 4 places to the right to get 5.2, and the exponent records that as $-4$. Option C has the right value but is not proper form. Taught in <a href="measurement.html">Measuring and significant figures</a>.',
    },
    {
      q: 'What is $(3 \\times 10^{4}) \\times (2 \\times 10^{3})$?',
      options: ['$5 \\times 10^{7}$', '$6 \\times 10^{12}$', '$6 \\times 10^{7}$', '$6 \\times 10^{1}$'],
      answer: 2,
      why: 'Multiply the front numbers, $3 \\times 2 = 6$, and add the exponents, $4 + 3 = 7$. Taught in <a href="measurement.html">Measuring and significant figures</a>.',
    },
    {
      q: 'Density is $d = \\dfrac{m}{V}$. What is $V$ on its own?',
      options: ['$V = m \\times d$', '$V = \\dfrac{m}{d}$', '$V = \\dfrac{d}{m}$', '$V = m - d$'],
      answer: 1,
      why: 'Multiply both sides by $V$ to get $dV = m$, then divide both sides by $d$. Taught in <a href="conversions.html">Unit conversions and density</a>.',
    },
    {
      q: 'A recipe uses 2 eggs for every 3 cups of flour. How many eggs go with 9 cups of flour?',
      options: ['4', '6', '8', '13.5'],
      answer: 1,
      why: '9 cups is 3 times the recipe, so you need $3 \\times 2 = 6$ eggs. Chemists do the same thing with moles. Taught in <a href="stoichiometry.html">Stoichiometry</a>.',
    },
    {
      q: '12 g of a 48 g sample is carbon. What percent is carbon?',
      options: ['4%', '12%', '25%', '36%'],
      answer: 2,
      why: '$\\dfrac{12}{48} \\times 100\\% = 25\\%$. Part over whole, times 100. Taught in <a href="composition.html">Formulas from data</a>.',
    },
  ], { title: 'Math self-check' });
});
