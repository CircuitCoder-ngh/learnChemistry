/* Lesson 3.1: The mole. The reference lesson: copy its patterns. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const NA = 6.022e23;

  /* ---------- Small drawing helpers used only by this lesson ---------- */
  function egg(g, x, y, r) {
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.5, r * 0.1, x, y, r * 1.3);
    gr.addColorStop(0, '#FFFDF6'); gr.addColorStop(0.7, '#F6E7CC'); gr.addColorStop(1, '#C9AE86');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(x, y - r * 1.28);
    g.bezierCurveTo(x + r * 0.78, y - r * 1.28, x + r, y - r * 0.2, x + r, y + r * 0.1);
    g.bezierCurveTo(x + r, y + r * 0.72, x + r * 0.56, y + r, x, y + r);
    g.bezierCurveTo(x - r * 0.56, y + r, x - r, y + r * 0.72, x - r, y + r * 0.1);
    g.bezierCurveTo(x - r, y - r * 0.2, x - r * 0.78, y - r * 1.28, x, y - r * 1.28);
    g.fill();
  }
  /** A swarm of molecules that drift gently in place. */
  function swarm(g, cx, cy, R, n, f, s, t, seed = 1, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(seed + i * 1.7) * 6.283, d = Math.sqrt(rand(seed + i * 3.3)) * R * 0.86;
      const x = cx + Math.cos(a) * d + wander(i + seed, t * 0.7) * 6;
      const y = cy + Math.sin(a) * d + wander(i + seed + 40, t * 0.7) * 6;
      if (window.Art.moleculeData(f)) Art.molecule(g, x, y, s, f, Object.assign({ rot: rand(i + seed) * 6.28 + Math.sin(t * 0.5 + i) * 0.3, labels: false, style: 'fill', atomScale: 1.28 }, o));
      else Art.atom(g, x, y, s, f, { label: false });
    }
  }
  function spoon(g, x, y, s, fill) {
    g.save();
    g.translate(x, y);
    g.fillStyle = '#C9C7DB'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, 92 * s, -9 * s, 210 * s, 18 * s, 9 * s); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(0, 0, 112 * s, 66 * s, 0, 0, 6.283); g.fill(); g.stroke();
    g.fillStyle = '#8F8DA6'; g.beginPath(); g.ellipse(0, 0, 98 * s, 54 * s, 0, 0, 6.283); g.fill();
    if (fill > 0) {
      const w = g.createLinearGradient(0, -50 * s, 0, 50 * s);
      w.addColorStop(0, '#7FD8FF'); w.addColorStop(1, '#2B8FD8');
      g.fillStyle = w; g.beginPath(); g.ellipse(0, 3 * s, 92 * s * fill, 48 * s * fill, 0, 0, 6.283); g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-30 * s, -18 * s, 26 * s * fill, 8 * s * fill, -0.3, 0, 6.283); g.fill();
    }
    g.restore();
  }

  /* ---------- Story 1: what is a mole? ---------- */
  Lab.story('#story-mole', {
    title: 'A word for a really big number',
    scenes: [
      {
        say: 'A <b>dozen</b> means 12. It does not matter if it is 12 eggs or 12 elephants. It is just a counting word.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          Art.text(g, '1 dozen = 12', W / 2, 66, { font: 'display', size: 56, color: C.sun });
          g.fillStyle = '#5D3B24';
          Art.round(g, 90, 150, 520, 212, 22); g.fill();
          g.fillStyle = '#7B5233';
          Art.round(g, 102, 162, 496, 188, 16); g.fill();
          for (let i = 0; i < 12; i++) {
            const col = i % 6, row = i < 6 ? 0 : 1;
            const q = ease.back(seg(p, 0.05 + i * 0.06, 0.2 + i * 0.06));
            if (q <= 0) continue;
            const x = 146 + col * 82, y = 214 + row * 88;
            g.save(); g.translate(x, y); g.scale(q, q); g.translate(-x, -y);
            g.fillStyle = 'rgba(40,20,10,.55)'; g.beginPath(); g.ellipse(x, y + 28, 34, 10, 0, 0, 6.283); g.fill();
            egg(g, x, y, 31);
            Art.text(g, String(i + 1), x, y + 2, { size: 26, color: '#5D3B24' });
            g.restore();
          }
          Art.moe(g, 712, 410, 170, 'point', { t, flip: true });
        },
      },
      {
        say: 'Atoms are so tiny that one drop of water holds about <b>1,700,000,000,000,000,000,000</b> molecules. A dozen will not help here.',
        dur: 3.6,
        draw(g, p, t, { W, H }) {
          // The drop.
          const dropQ = ease.back(seg(p, 0, 0.3));
          const dx = 170, dy = 250;
          g.save(); g.translate(dx, dy); g.scale(dropQ, dropQ);
          const grad = g.createRadialGradient(-22, -8, 6, 0, 20, 90);
          grad.addColorStop(0, '#CDEFFF'); grad.addColorStop(0.45, '#58C0F2'); grad.addColorStop(1, '#1B6FB8');
          g.fillStyle = grad;
          g.beginPath(); g.moveTo(0, -112);
          g.bezierCurveTo(30, -60, 80, -20, 80, 30);
          g.bezierCurveTo(80, 76, 44, 96, 0, 96);
          g.bezierCurveTo(-44, 96, -80, 76, -80, 30);
          g.bezierCurveTo(-80, -20, -30, -60, 0, -112);
          g.fill();
          g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-34, 20, 12, 22, 0.3, 0, 6.283); g.fill();
          g.restore();
          Art.text(g, 'one drop', dx, H - 46, { size: 26, alpha: seg(p, 0.2, 0.4) });
          // Zoom into it.
          Art.zoom(g, dx + 56, dy - 10, 530, 216, 176, (gg, cx, cy, R) => {
            swarm(gg, cx, cy, R, 11, 'H2O', 38, t, 3, { face: 'happy', t });
          }, { p: seg(p, 0.32, 0.6) });
          Art.text(g, 'and it keeps going like this', 530, H - 22, { size: 25, alpha: seg(p, 0.65, 0.85), color: C.cyan, halo: true });
          void W;
        },
      },
      {
        say: 'So chemists use a much bigger word. One <b>mole</b> means this many of something.',
        dur: 4,
        draw(g, p, t, { W }) {
          const digits = '602,200,000,000,000,000,000,000';
          const shown = Math.floor(digits.length * ease.out(seg(p, 0.05, 0.62)));
          Art.text(g, '1 mole =', W / 2, 74, { font: 'display', size: 46, color: C.ink });
          g.font = `400 42px ${Art.FONT_DISPLAY}`;
          const total = g.measureText(digits).width;
          let x = W / 2 - total / 2;
          g.textBaseline = 'middle'; g.textAlign = 'left';
          for (let i = 0; i < shown; i++) {
            const w = g.measureText(digits[i]).width;
            const hue = i < 4 ? C.sun : C.ink;
            g.fillStyle = hue;
            g.fillText(digits[i], x, 170 + Math.sin(t * 2.2 + i * 0.5) * 2.5);
            x += w;
          }
          const q = ease.back(seg(p, 0.66, 0.84));
          if (q > 0) {
            g.save(); g.translate(W / 2 - 110, 276); g.scale(q, q);
            g.fillStyle = C.pink; Art.round(g, -196, -44, 392, 88, 26); g.fill();
            Art.text(g, '6.022 × 10²³', 0, 2, { font: 'display', size: 54, color: '#fff' });
            g.restore();
          }
          Art.text(g, "Avogadro's number", W / 2 - 110, 350, { size: 27, color: C.dim, alpha: seg(p, 0.8, 0.95) });
          Art.moe(g, 660, 432, 190, 'wow', { t });
        },
      },
      {
        say: 'That is <b>huge</b>. A mole of marbles would bury the whole Earth in a layer kilometers deep.',
        dur: 3.8,
        draw(g, p, t, { W, H }) {
          const cx = W / 2, cy = H + 170, R = 360;
          // Marble layer grows outward, drawn behind Earth's edge.
          const layers = 5, q = ease.inOut(seg(p, 0.12, 0.85));
          const colors = [C.pink, C.cyan, C.sun, C.leaf, C.fire, C.violet];
          for (let L = layers - 1; L >= 0; L--) {
            const rr = R + 14 + L * 22;
            const n = Math.round(46 + L * 3);
            for (let i = 0; i < n; i++) {
              const a = -Math.PI + (i / (n - 1)) * Math.PI;
              const local = clamp((q * (layers + 2) - L) * 1.2 - rand(i * 3 + L) * 0.7);
              if (local <= 0) continue;
              const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
              if (y > H + 20 || x < -20 || x > W + 20) continue;
              Art.ball(g, x, y - (1 - local) * 26, 12 * ease.back(local), colors[(i + L * 2) % colors.length]);
            }
          }
          const e = g.createRadialGradient(cx - 90, cy - 150, 40, cx, cy, R);
          e.addColorStop(0, '#5EC8FF'); e.addColorStop(1, '#14589E');
          g.fillStyle = e; g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.fill();
          g.fillStyle = '#45C46F';
          [[cx - 170, cy - 300, 72, 28], [cx + 80, cy - 330, 96, 22], [cx - 40, cy - 266, 60, 22], [cx + 210, cy - 250, 54, 30], [cx - 268, cy - 212, 44, 34]].forEach(([x, y, rx, ry]) => {
            g.beginPath(); g.ellipse(x, y, rx, ry, 0.1, 0, 6.283); g.fill();
          });
          Art.bubble(g, 'Do not ask how I know.', 610, 148, { w: 260, side: 'down', alpha: seg(p, 0.7, 0.85) });
          Art.moe(g, 610, 258, 100, 'oops', { t, bob: false });
          Art.text(g, 'Earth', cx, H - 26, { size: 28, halo: true });
        },
      },
      {
        say: 'But atoms are so small that a mole of water molecules is only <b>18 grams</b>. That is a bit more than one tablespoon.',
        dur: 3.6,
        draw(g, p, t, { W, H }) {
          spoon(g, 200, 230, 1, ease.out(seg(p, 0.05, 0.4)));
          Art.text(g, '18 grams of water', 215, H - 72, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.3, 0.5) });
          Art.text(g, '= 1 mole', 215, H - 34, { font: 'display', size: 30, alpha: seg(p, 0.4, 0.6) });
          Art.zoom(g, 230, 215, 590, 200, 165, (gg, cx, cy, R) => swarm(gg, cx, cy, R, 10, 'H2O', 36, t, 7, { face: 'happy', t }), { p: seg(p, 0.42, 0.7) });
          Art.text(g, '6.022 × 10²³ of these', 590, H - 42, { size: 28, color: C.cyan, alpha: seg(p, 0.72, 0.9), halo: true });
          void W;
        },
      },
      {
        say: 'Here is why the number is so odd. It was picked so the masses match: one carbon atom has a mass of <b>12.01 u</b>, and one mole of carbon has a mass of <b>12.01 g</b>. Same number, bigger unit.',
        dur: 4.4,
        draw(g, p, t, { W }) {
          const a = seg(p, 0, 0.2), b = seg(p, 0.32, 0.55), c = seg(p, 0.66, 0.85);
          // Left: one atom.
          Art.popIn(g, 200, 170, a, (gg) => {
            Art.atom(gg, 0, 0, 62, 'C', { face: 'happy', t, look: [1, 0], label: false, seed: 2 });
          });
          Art.text(g, 'one atom', 200, 70, { size: 28, alpha: a });
          Art.text(g, '12.01 u', 200, 292, { font: 'display', size: 56, color: C.sun, alpha: a });
          // Right: a lump of charcoal on a scale.
          if (b > 0) {
            g.save(); g.globalAlpha *= b;
            const sc = Art.digitalScale(g, 600, 262, 200, '12.01 g', { size: 22 });
            const cg = g.createLinearGradient(560, 170, 640, 230);
            cg.addColorStop(0, '#6A7382'); cg.addColorStop(1, '#2C313C');
            g.fillStyle = cg; g.strokeStyle = '#100820'; g.lineWidth = 3;
            g.beginPath(); g.moveTo(544, sc.top); g.lineTo(538, sc.top - 34); g.lineTo(566, sc.top - 70); g.lineTo(616, sc.top - 78); g.lineTo(656, sc.top - 44); g.lineTo(660, sc.top); g.closePath(); g.fill(); g.stroke();
            g.restore();
          }
          Art.text(g, 'one mole of atoms', 600, 70, { size: 28, alpha: b });
          Art.text(g, '12.01 g', 600, 320, { font: 'display', size: 56, color: C.sun, alpha: b });
          Art.arrow(g, 306, 190, 494, 190, { color: C.pink, w: 7, p: seg(p, 0.5, 0.66), curve: -28 });
          Art.text(g, '× 6.022 × 10²³', W / 2, 134, { size: 25, color: C.pink, alpha: seg(p, 0.55, 0.7) });
          if (c > 0) {
            g.fillStyle = Art.alpha(C.plum2, c); Art.round(g, W / 2 - 280, 366, 560, 58, 22); g.fill();
            Art.text(g, 'Atomic mass in u = molar mass in g/mol', W / 2, 395, { size: 28, color: '#fff', alpha: c });
          }
        },
      },
    ],
  });

  /* ---------- Bench: weigh a mole ---------- */
  const SUBS = {
    C: { name: 'carbon', M: 12.011, density: 2.2, kind: 'pile', color: '#3B414D', particle: 'atoms', f: 'C' },
    H2O: { name: 'water', M: 18.015, density: 1.0, kind: 'liquid', color: '#46B9F0', particle: 'molecules', f: 'H2O' },
    NaCl: { name: 'table salt', M: 58.44, density: 2.16, kind: 'pile', color: '#F4F2FA', particle: 'formula units', f: 'NaCl' },
    Fe: { name: 'iron', M: 55.85, density: 7.87, kind: 'block', color: '#9AA3B2', particle: 'atoms', f: 'Fe' },
    Au: { name: 'gold', M: 196.97, density: 19.3, kind: 'block', color: '#F7C631', particle: 'atoms', f: 'Au' },
    C2H5OH: { name: 'ethanol', M: 46.07, density: 0.789, kind: 'liquid', color: '#C9B6FF', particle: 'molecules', f: 'C2H5OH' },
  };
  const scale = { sub: 'C', n: 1, shownMass: 12, shownSize: 0, bump: 0 };
  Lab.stage('#c-scale', {
    bg: 'lab', label: 'A digital scale holding the substance, with a magnifier showing its particles.',
    draw(g, t, dt) {
      const s = SUBS[scale.sub];
      const targetMass = s.M * scale.n;
      scale.shownMass = lerp(scale.shownMass, targetMass, clamp(dt * 8));
      const vol = (s.M * scale.n) / s.density;
      const target = Math.cbrt(vol) * 24;
      scale.shownSize = lerp(scale.shownSize || target, target, clamp(dt * 7));
      const size = scale.shownSize;
      const benchY = 380;
      const top = benchY - 38;
      // Soft shadow on the bench.
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(232, benchY + 8, 170, 15, 0, 0, 6.283); g.fill();
      if (s.kind === 'pile') {
        const w = size * 1.5, h = size * 0.82;
        const gr = g.createRadialGradient(232 - w * 0.2, top - h * 0.7, 2, 232, top, w);
        gr.addColorStop(0, Art.mix(s.color, '#ffffff', 0.4)); gr.addColorStop(1, Art.mix(s.color, '#000000', 0.25));
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(232 - w * 0.62, top);
        g.quadraticCurveTo(232 - w * 0.3, top - h * 1.14, 232, top - h * 1.1);
        g.quadraticCurveTo(232 + w * 0.3, top - h * 1.14, 232 + w * 0.62, top); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(16,8,32,.5)'; g.lineWidth = 2; g.stroke();
        for (let i = 0; i < 18; i++) {
          const ax = 232 + (rand(i) - 0.5) * w * 0.9, ay = top - rand(i + 3) * h * 0.72;
          g.fillStyle = `rgba(255,255,255,${0.14 + rand(i + 7) * 0.26})`;
          g.fillRect(ax, ay, 2.6, 2.6);
        }
      } else if (s.kind === 'block') {
        const a = size * 0.92, d = a * 0.3, x = 232 - a / 2, y = top - a;
        g.fillStyle = Art.mix(s.color, '#000000', 0.22); g.beginPath(); g.moveTo(x + a, y); g.lineTo(x + a + d, y - d * 0.6); g.lineTo(x + a + d, top - d * 0.6); g.lineTo(x + a, top); g.closePath(); g.fill();
        g.fillStyle = Art.mix(s.color, '#ffffff', 0.32); g.beginPath(); g.moveTo(x, y); g.lineTo(x + d, y - d * 0.6); g.lineTo(x + a + d, y - d * 0.6); g.lineTo(x + a, y); g.closePath(); g.fill();
        const f = g.createLinearGradient(x, y, x + a, top);
        f.addColorStop(0, Art.mix(s.color, '#ffffff', 0.25)); f.addColorStop(1, Art.mix(s.color, '#000000', 0.08));
        g.fillStyle = f; g.fillRect(x, y, a, a);
        g.strokeStyle = 'rgba(16,8,32,.55)'; g.lineWidth = 2; g.strokeRect(x, y, a, a);
      } else {
        const w = Math.max(70, size * 1.05), h = w * 1.1;
        Art.beaker(g, 232, top, w, h, { level: 0.82, liquid: s.color, ticks: false, inside: (gg, box) => Art.bubbles(gg, box.x0 + 6, box.x1 - 6, box.bottom - 4, box.top + 6, t * 0.5, { n: 4, r: 3.5 }) });
      }
      Art.digitalScale(g, 232, benchY + 2, 330, Lab.fmt(scale.shownMass, 2) + ' g', { size: 24 });
      // Particle view.
      Art.zoom(g, 232, top - size * 0.45, 582, 182, 156, (gg, cx, cy, R) => {
        if (scale.sub === 'NaCl') {
          for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
            const x = cx + i * 58 + wander(i * 7 + j, t) * 2, y = cy + j * 58 + wander(i + j * 9, t) * 2;
            const na = (i + j + 40) % 2 === 0;
            Art.atom(gg, x, y, na ? 19 : 28, na ? 'Na' : 'Cl', { label: false, face: (i === 0 && j === 0) || (i === 1 && j === 0) ? 'happy' : null, t, seed: i + j });
          }
        } else if (scale.sub === 'C' || scale.sub === 'Fe' || scale.sub === 'Au') {
          for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
            const x = cx + (i + (j % 2 ? 0.5 : 0)) * 60 + wander(i * 3 + j, t) * 2.5, y = cy + j * 54 + wander(i + j * 5, t) * 2.5;
            Art.atom(gg, x, y, 28, s.f, { label: false, face: i === 0 && j === 0 ? 'happy' : null, t });
          }
        } else {
          swarm(gg, cx, cy, R, scale.sub === 'H2O' ? 10 : 6, s.f, scale.sub === 'H2O' ? 36 : 24, t, 5, { face: scale.sub === 'H2O' ? 'happy' : null, t });
        }
      });
      Art.formula(g, s.f, 582, 362, { size: 34, halo: true, colorize: true });
    },
  });
  const paintScale = () => {
    const s = SUBS[scale.sub];
    Lab.$('#scale-mass').textContent = Lab.fmt(s.M * scale.n, 2) + ' g';
    Lab.$('#scale-count').textContent = Lab.sig(NA * scale.n, 4);
    Lab.$('#scale-count-label').textContent = s.particle[0].toUpperCase() + s.particle.slice(1);
  };
  Lab.segmented('#scale-sub', (v) => { scale.sub = v; paintScale(); });
  Lab.bind('#scale-n', '#scale-n-out', (v) => Lab.fmt(v, 2) + ' mol', (v) => { scale.n = v; paintScale(); });

  /* ---------- Bench: molar mass builder ---------- */
  const molar = { f: 'H2O', t0: 0 };
  const parseOrder = (f) => {
    const counts = Bank.countAtoms(f);
    const order = [];
    f.replace(/[A-Z][a-z]?/g, (m) => { if (!order.includes(m)) order.push(m); return m; });
    // Masses as printed in the row, so that "6 × 16.00" really gives 96.00. Hydrogen keeps its third decimal.
    return order.map((sym) => ({ sym, n: counts[sym], mass: sym === 'H' ? 1.008 : +EL[sym].mass.toFixed(2) }));
  };
  const molarStage = Lab.stage('#c-molar', {
    h: 400, label: 'Rows of atoms for each element, multiplied by atomic mass and added to a total.',
    draw(g, t) {
      const rows = parseOrder(molar.f);
      const elapsed = t - molar.t0;
      Art.formula(g, molar.f, 400, 48, { size: 50, colorize: true });
      const rowH = Math.min(70, 240 / rows.length), y0 = 100 + (240 - rowH * rows.length) / 2;
      let sum = 0;
      rows.forEach((r, i) => {
        const y = y0 + i * rowH + rowH / 2;
        const q = clamp((elapsed - i * 0.55) * 2);
        const shown = Math.min(r.n, 6);
        const rad = Math.min(21, rowH * 0.34);
        for (let k = 0; k < shown; k++) {
          const pop = ease.back(clamp((elapsed - i * 0.55 - k * 0.07) * 4));
          if (pop > 0) Art.atom(g, 46 + k * rad * 1.68, y, rad * pop, r.sym, { label: rad >= 14 ? r.sym : false, alpha: q });
        }
        if (r.n > 6) Art.text(g, '…', 46 + 6 * rad * 1.68 - 6, y, { size: 26, alpha: q });
        Art.text(g, `${r.n} × ${r.sym === 'H' ? '1.008' : r.mass.toFixed(2)}`, 455, y, { size: 30, align: 'right', alpha: q });
        Art.text(g, '=', 485, y, { size: 30, alpha: q, color: C.dim });
        const sub = r.n * r.mass;
        Art.text(g, sub.toFixed(2), 610, y, { font: 'display', size: 34, align: 'right', color: C.sun, alpha: q });
        Art.text(g, 'g', 620, y + 2, { size: 26, align: 'left', alpha: q, color: C.dim });
        if (q >= 1) sum += sub;
      });
      const qT = clamp((elapsed - rows.length * 0.55 - 0.1) * 2.4);
      g.fillStyle = Art.alpha(C.ink, 0.45 * qT); g.fillRect(250, 346, 422, 3);
      const total = rows.reduce((a, r) => a + r.n * r.mass, 0);
      Art.text(g, 'Molar mass', 250, 376, { size: 30, align: 'left', alpha: qT });
      Art.text(g, total.toFixed(2) + ' g/mol', 672, 376, { font: 'display', size: 40, align: 'right', color: C.pink, alpha: qT });
      if (qT >= 1) Art.moe(g, 90, 396, 110, 'cheer', { t }); else if (qT <= 0) { /* still adding */ }
      void sum;
    },
  });
  Lab.segmented('#molar-f', (v) => { molar.f = v; molar.t0 = molarStage.t; });

  /* ---------- Bench: the mole bridge ---------- */
  const ISLANDS = [
    { id: 'g', x: 112, label: 'Grams', color: C.sun },
    { id: 'mol', x: 400, label: 'Moles', color: C.pink },
    { id: 'n', x: 688, label: 'Particles', color: C.cyan },
  ];
  const bridge = { sub: 'H2O', from: 'g', to: 'n', pick: null, t0: 0, v: 36 };
  const MASSES = { H2O: 18.015, CO2: 44.009, NaCl: 58.44, Fe: 55.85 };
  const NAMES = { H2O: 'molecules', CO2: 'molecules', NaCl: 'formula units', Fe: 'atoms' };
  const islandAt = (id) => ISLANDS.find((i) => i.id === id);
  function islandShape(g, x, y, w, color) {
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, y + 36, w * 0.58, 15, 0, 0, 6.283); g.fill();
    const d = g.createLinearGradient(0, y - 18, 0, y + 40);
    d.addColorStop(0, '#6B4A32'); d.addColorStop(1, '#3B2A22');
    g.fillStyle = d;
    g.beginPath(); g.moveTo(x - w * 0.56, y - 2); g.quadraticCurveTo(x - w * 0.4, y + 44, x, y + 40); g.quadraticCurveTo(x + w * 0.4, y + 44, x + w * 0.56, y - 2); g.closePath(); g.fill();
    g.fillStyle = color; g.beginPath(); g.ellipse(x, y - 3, w * 0.56, 19, 0, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(255,255,255,.26)'; g.beginPath(); g.ellipse(x - w * 0.14, y - 8, w * 0.28, 6, 0, 0, 6.283); g.fill();
  }
  function plank(g, x1, x2, y, label) {
    const steps = 9, sag = 16;
    g.strokeStyle = '#D9C9A8'; g.lineWidth = 3.4;
    g.beginPath(); g.moveTo(x1, y); g.quadraticCurveTo((x1 + x2) / 2, y + sag * 2, x2, y); g.stroke();
    for (let i = 0; i <= steps; i++) {
      const u = i / steps, x = lerp(x1, x2, u);
      const yy = y + 4 * sag * u * (1 - u);
      g.fillStyle = i % 2 ? '#A97F58' : '#8E6A48';
      Art.round(g, x - 8, yy - 3, 17, 9, 3); g.fill();
    }
    Art.pill(g, label, (x1 + x2) / 2, y - 122, { size: 21, color: C.plum2, text: '#fff' });
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2.5; g.setLineDash([5, 6]);
    g.beginPath(); g.moveTo((x1 + x2) / 2, y - 104); g.lineTo((x1 + x2) / 2, y + 8); g.stroke(); g.setLineDash([]);
  }
  const bridgeOf = (from, to) => (from === to ? [] : Math.abs(['g', 'mol', 'n'].indexOf(from) - ['g', 'mol', 'n'].indexOf(to)) === 2 ? [from, 'mol', to] : [from, to]);

  const bridgeStage = Lab.stage('#c-bridge', {
    bg: (g, W, H) => {
      const w = g.createLinearGradient(0, 0, 0, H);
      w.addColorStop(0, '#2B1A4A'); w.addColorStop(0.62, '#2C2466'); w.addColorStop(1, '#16386E');
      g.fillStyle = w; g.fillRect(0, 0, W, H);
    },
    h: 380, label: 'Three islands labeled grams, moles and particles, joined by bridges through the moles island.',
    onPointer(e) {
      if (e.type === 'hover') { bridgeStage.canvas.style.cursor = ISLANDS.some((i) => Math.abs(e.x - i.x) < 100) ? 'pointer' : 'default'; return; }
      if (e.type !== 'down') return;
      const hit = ISLANDS.find((i) => Math.abs(e.x - i.x) < 110 && e.y > 130);
      if (!hit) return;
      if (!bridge.pick) { bridge.pick = hit.id; }
      else if (hit.id !== bridge.pick) {
        bridge.from = bridge.pick; bridge.to = hit.id; bridge.pick = null; bridge.t0 = bridgeStage.t;
        Lab.sound.pop(); paintBridge();
      } else bridge.pick = null;
    },
    draw(g, t, dt, s) {
      const y = 262;
      plank(g, 186, 326, y - 12, '÷ molar mass');
      plank(g, 474, 614, y - 12, '× 6.022 × 10²³');
      ISLANDS.forEach((i) => {
        islandShape(g, i.x, y, 132, i.color);
        if (bridge.pick === i.id) Art.ring(g, i.x, y - 3, 84, { color: '#fff', w: 4, dash: [8, 8] });
        Art.text(g, i.label, i.x, y + 72, { font: 'display', size: 30, color: i.color, halo: true });
      });
      // Icons on the islands.
      Art.digitalScale(g, 112, y - 18, 96, 'g', { size: 18 });
      g.fillStyle = '#8E6A48'; g.fillRect(345, y - 72, 7, 60);
      Art.pill(g, 'mol', 349, y - 78, { size: 24, color: C.pink, text: '#fff', font: 'display' });
      for (let k = 0; k < 5; k++) Art.atom(g, 660 + (k % 3) * 28 + (k > 2 ? 14 : 0), y - 30 - (k > 2 ? 24 : 0) + wander(k, t) * 2, 15, 'O', { label: false });

      // Moe walks the route.
      const route = bridgeOf(bridge.from, bridge.to);
      const legs = Math.max(1, route.length - 1);
      const u = clamp((t - bridge.t0) / (legs * 1.5));
      const prog = ease.inOut(u) * legs;
      const leg = Math.min(legs - 1, Math.floor(prog)), lu = prog - leg;
      const a = islandAt(route[leg] || bridge.from), b = islandAt(route[leg + 1] || bridge.to);
      const mx = lerp(a.x, b.x, lu);
      const onBridge = Math.abs(mx - a.x) > 80 && Math.abs(mx - b.x) > 80;
      const walking = u < 1;
      const hop = walking ? Math.abs(Math.sin(t * 9)) * 7 : 0;
      const sagY = onBridge ? 18 : 0;
      Art.moe(g, mx, y - 16 + sagY - hop, 104, walking ? 'happy' : 'cheer', { t, flip: b.x < a.x, bob: !walking });
      void dt; void s;
      const hint = bridge.pick ? 'Now tap where you want to go' : '';
      if (hint) Art.text(g, hint, 400, 36, { size: 25, color: C.sun, halo: true });
    },
  });
  function bridgeValue() {
    const v = +Lab.$('#bridge-v').value / 100;
    const M = MASSES[bridge.sub];
    if (bridge.from === 'g') return Math.round(lerp(1, 180, v) * 10) / 10;
    if (bridge.from === 'mol') return Math.round(lerp(0.1, 10, v) * 100) / 100;
    void M;
    return lerp(0.1, 10, v) * 1e23 * 1;
  }
  function paintBridge() {
    const val = bridgeValue();
    const M = MASSES[bridge.sub];
    const name = NAMES[bridge.sub];
    const ceF = `\\ce{${bridge.sub}}`;
    const unitOf = { g: 'g', mol: 'mol', n: name };
    const out = Lab.$('#bridge-v-out');
    out.textContent = bridge.from === 'n' ? Lab.sig(val, 3) + ' ' + name : `${val} ${unitOf[bridge.from]}`;
    const texSci = (x) => {
      if (x === 0) return '0';
      const e = Math.floor(Math.log10(Math.abs(x)));
      if (e > -3 && e < 4) return Lab.sig(x, 3);
      return `${(x / Math.pow(10, e)).toFixed(2)} \\times 10^{${e}}`;
    };
    const route = bridgeOf(bridge.from, bridge.to);
    let cur = val, html = '';
    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i], b = route[i + 1];
      let tex;
      if (a === 'g') { const next = cur / M; tex = `${texSci(cur)}\\ \\cancel{\\text{g}} \\times \\dfrac{1\\text{ mol}}{${M.toFixed(2)}\\ \\cancel{\\text{g}}} = \\mathbf{${texSci(next)}\\text{ mol}}`; cur = next; }
      else if (a === 'mol' && b === 'g') { const next = cur * M; tex = `${texSci(cur)}\\ \\cancel{\\text{mol}} \\times \\dfrac{${M.toFixed(2)}\\text{ g}}{1\\ \\cancel{\\text{mol}}} = \\mathbf{${texSci(next)}\\text{ g}}`; cur = next; }
      else if (a === 'mol' && b === 'n') { const next = cur * NA; tex = `${texSci(cur)}\\ \\cancel{\\text{mol}} \\times \\dfrac{6.022 \\times 10^{23}}{1\\ \\cancel{\\text{mol}}} = \\mathbf{${texSci(next)}\\text{ ${name}}}`; cur = next; }
      else { const next = cur / NA; tex = `${texSci(cur)}\\ \\text{${name}} \\times \\dfrac{1\\text{ mol}}{6.022 \\times 10^{23}} = \\mathbf{${texSci(next)}\\text{ mol}}`; cur = next; }
      html += `<div class="calc-line">$$${tex}$$</div>`;
    }
    Lab.$('#bridge-calc').innerHTML = Lab.texString(`<p><b>${islandAt(bridge.from).label} to ${islandAt(bridge.to).label.toLowerCase()}</b> for $${ceF}$ with a molar mass of ${M.toFixed(2)} g/mol:</p>${html}`);
  }
  Lab.segmented('#bridge-sub', (v) => { bridge.sub = v; paintBridge(); });
  Lab.bind('#bridge-v', null, null, paintBridge);
  paintBridge();

  /* ---------- Story 2: atoms inside molecules ---------- */
  const row = (g, label, x, y, n, sym, p, t, s = 28) => {
    for (let i = 0; i < n; i++) {
      const q = ease.back(seg(p, 0.15 + i * 0.08, 0.35 + i * 0.08));
      if (q > 0) Art.atom(g, x + (i - (n - 1) / 2) * (s * 2.1), y, s * q, sym, { face: 'happy', t, seed: i });
    }
    Art.text(g, label, x, y + s + 28, { size: 26, alpha: seg(p, 0.45, 0.6) });
  };
  Lab.story('#story-inside', {
    title: 'Subscripts work at every scale',
    scenes: [
      {
        say: 'Take <b>one</b> water molecule apart. You get 2 hydrogen atoms and 1 oxygen atom.',
        dur: 3,
        draw(g, p, t, { W }) {
          const q = ease.inOut(seg(p, 0.25, 0.7));
          Art.formula(g, 'H2O', W / 2, 52, { size: 50, colorize: true });
          Art.text(g, '1 molecule', W / 2, 96, { size: 26, color: C.dim });
          Art.atom(g, lerp(W / 2, W / 2 + 185, q), 250, 78, 'O', { face: q > 0.7 ? 'wow' : 'happy', t, seed: 3 });
          Art.atom(g, lerp(W / 2 - 62, W / 2 - 280, q), lerp(306, 250, q), 50, 'H', { face: 'happy', t, seed: 1 });
          Art.atom(g, lerp(W / 2 + 62, W / 2 - 150, q), lerp(306, 250, q), 50, 'H', { face: 'happy', t, seed: 2 });
          Art.text(g, '2 H atoms', W / 2 - 215, 372, { size: 34, alpha: seg(p, 0.65, 0.85), color: '#fff' });
          Art.text(g, '1 O atom', W / 2 + 185, 372, { size: 34, alpha: seg(p, 0.65, 0.85), color: '#FF8A94' });
        },
      },
      {
        say: 'Now take a <b>dozen</b> water molecules apart. You get 2 dozen H atoms and 1 dozen O atoms. Same ratio.',
        dur: 3,
        draw(g, p, t, { W }) {
          Art.text(g, '1 dozen H₂O', W / 2, 52, { font: 'display', size: 44 });
          const q = seg(p, 0.1, 0.8);
          for (let i = 0; i < 24; i++) {
            const qq = ease.back(clamp(q * 3 - i * 0.07));
            if (qq > 0) Art.atom(g, 72 + ((i % 8) * 40), 150 + Math.floor(i / 8) * 54, 21 * qq, 'H', { label: false });
          }
          for (let i = 0; i < 12; i++) {
            const qq = ease.back(clamp(q * 3 - i * 0.1));
            if (qq > 0) Art.atom(g, 470 + ((i % 4) * 72), 150 + Math.floor(i / 4) * 54, 30 * qq, 'O', { label: false });
          }
          Art.text(g, '24 H atoms, or 2 dozen', 210, 370, { size: 30, alpha: seg(p, 0.6, 0.8) });
          Art.text(g, '12 O atoms, or 1 dozen', 580, 370, { size: 30, alpha: seg(p, 0.6, 0.8), color: '#FF8A94' });
          void W; void t;
        },
      },
      {
        say: 'Now take <b>one mole</b> of water molecules apart. You get 2 moles of H atoms and 1 mole of O atoms. The subscript is the mole ratio.',
        dur: 3.6,
        draw(g, p, t, { W }) {
          Art.text(g, '1 mol H₂O', W / 2, 52, { font: 'display', size: 44 });
          row(g, '2 mol H', 220, 190, 2, 'H', p, t, 50);
          row(g, '1 mol O', 590, 190, 1, 'O', p, t, 68);
          const a = seg(p, 0.65, 0.85);
          if (a > 0) {
            g.fillStyle = Art.alpha(C.pink, a); Art.round(g, W / 2 - 280, 330, 560, 74, 24); g.fill();
            Art.text(g, '1.204 × 10²⁴ H atoms and 6.022 × 10²³ O atoms', W / 2, 367, { size: 24, alpha: a, color: '#fff' });
          }
        },
      },
    ],
  });
});
