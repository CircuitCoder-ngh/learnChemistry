/* Lesson 11.1: Solubility and colligative properties. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const R_GAS = 0.08206;
  const fmtDeg = (T, d = 0) => `${T < 0 ? '−' : ''}${Lab.fmt(Math.abs(T), d)} °C`;

  /* ---------- Helpers ---------- */
  function dots(g, a, b, o = {}) {
    g.save(); g.strokeStyle = o.color || C.sun; g.lineWidth = o.w || 4; g.lineCap = 'round'; g.setLineDash([1, o.gap || 8]);
    g.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.restore();
  }
  /** A nonpolar chain of carbon atoms, like an oil or hexane molecule. Hydrogens are left off to keep it readable. */
  function chain(g, x, y, n, b, rot, o = {}) {
    const c = Math.cos(rot), d = Math.sin(rot);
    for (let i = 0; i < n; i++) {
      const ax = (i - (n - 1) / 2) * b, ay = (i % 2 ? 0.3 : -0.3) * b;
      Art.ball(g, x + ax * c - ay * d, y + ax * d + ay * c, b * (o.r || 0.62), Art.elementColor('C'));
    }
  }
  /** Sugar, drawn as a ring of C and O. */
  function sugar(g, x, y, s, rot) {
    for (let i = 0; i < 6; i++) {
      const a = rot + (i / 6) * TAU;
      Art.ball(g, x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.56, Art.elementColor(i === 0 || i === 3 ? 'O' : 'C'));
    }
  }
  function sprite(g, kind, x, y, rot, i) {
    if (kind === 'water') Art.molecule(g, x, y, 20, 'H2O', { rot, style: 'fill', atomScale: 1.28, labels: false });
    else if (kind === 'hexane') chain(g, x, y, 4, 13, rot, { r: 0.7 });
    else if (kind === 'oil') chain(g, x, y, 5, 12, rot, { r: 0.7 });
    else if (kind === 'ethanol') Art.molecule(g, x, y, 12, 'C2H5OH', { rot, style: 'fill', atomScale: 1.2, labels: false });
    else if (kind === 'salt') { const na = i % 2 === 0; Art.atom(g, x, y, na ? 13 : 19, na ? 'Na' : 'Cl', { label: na ? '+' : '−' }); }
    else if (kind === 'sugar') sugar(g, x, y, 12, rot);
    else if (kind === 'iodine') Art.molecule(g, x, y, 22, 'I2', { rot, style: 'fill', atomScale: 1.05, labels: false });
  }

  /* ---------- Story: like dissolves like ---------- */
  Lab.story('#story-like', {
    title: 'Why oil and water will not mix',
    scenes: [
      {
        say: 'Water molecules are a tight club. Each one holds its neighbors with <b>hydrogen bonds</b>, shown as dotted lines. They are constantly breaking and reforming with each other.',
        dur: 3,
        draw(g, p, t, { W, H }) {
          const pts = [];
          for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) pts.push([100 + i * 118 + (j % 2) * 59 - 26, 74 + j * 102, rand(i * 7 + j) * TAU]);
          const a = seg(p, 0.15, 0.55);
          pts.forEach((A, k) => pts.forEach((B, m) => {
            if (m > k && Math.hypot(A[0] - B[0], A[1] - B[1]) < 135) dots(g, A, B, { w: 5, gap: 11, alpha: a * (0.65 + 0.35 * Math.sin(t * 2 + k + m)) });
          }));
          pts.forEach(([x, y, r], k) => {
            const q = ease.back(seg(p, 0.01 * k, 0.2 + 0.01 * k));
            if (q > 0) Art.molecule(g, x + wander(k, t) * 3, y + wander(k + 40, t) * 3, 34 * q, 'H2O', { rot: r + Math.sin(t * 0.6 + k) * 0.15, style: 'fill', atomScale: 1.28, labels: false, face: k === 8 ? 'happy' : null, t });
          });
          void W; void H;
        },
      },
      {
        say: 'Now an oil molecule pushes in. It is <b>nonpolar</b>, with no charges to offer. To make room, water would have to break hydrogen bonds, and it gets almost nothing back. So the water squeezes it out.',
        dur: 4,
        draw(g, p, t) {
          const pts = [];
          for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) pts.push([100 + i * 118 + (j % 2) * 59 - 26, 98 + j * 94, rand(i * 7 + j) * TAU]);
          const q = ease.inOut(seg(p, 0.08, 0.42)), out = ease.inOut(seg(p, 0.55, 0.95));
          const ox = 400, oy = lerp(lerp(-40, 226, q), 22, out);
          const shove = (A) => {
            const d = Math.hypot(A[0] - ox, A[1] - oy) || 1, f = Math.max(0, 1 - d / 190) * 62;
            return [A[0] + ((A[0] - ox) / d) * f, A[1] + ((A[1] - oy) / d) * f];
          };
          const S = pts.map((A) => shove(A));
          S.forEach((A, k) => S.forEach((B, m) => {
            if (m > k && Math.hypot(pts[k][0] - pts[m][0], pts[k][1] - pts[m][1]) < 135) {
              const stretched = Math.hypot(A[0] - B[0], A[1] - B[1]) > 158;
              if (!stretched) dots(g, A, B, { w: 5, gap: 11, alpha: 0.75 });
            }
          }));
          S.forEach((A, k) => Art.molecule(g, A[0], A[1], 34, 'H2O', { rot: pts[k][2], style: 'fill', atomScale: 1.28, labels: false }));
          chain(g, ox, oy, 7, 24, Math.sin(t) * 0.1);
          if (q > 0.6 && out < 0.5) Art.ring(g, ox, oy, 104, { color: C.red, w: 5, dash: [10, 10] });
          Art.text(g, 'No hydrogen bonds to offer', 400, 432, { size: 29, color: C.red, alpha: seg(p, 0.3, 0.5) * (1 - seg(p, 0.75, 0.92)), halo: true });
          Art.text(g, 'Water closes up again', 400, 432, { size: 29, color: C.leaf, alpha: seg(p, 0.84, 1), halo: true });
        },
      },
      {
        say: 'So shaken oil drops find each other and rise to the top. It floats because it is less dense. The two liquids are <b>immiscible</b>: they will not mix.',
        dur: 4,
        draw(g, p, t) {
          const x0 = 250, x1 = 550, top = 60, bot = 416;
          const q = ease.inOut(seg(p, 0.12, 0.92));
          const sy = lerp(bot + 1, 170, q);
          g.fillStyle = 'rgba(70,185,240,.62)'; g.fillRect(x0, top + 40, x1 - x0, bot - top - 40);
          g.fillStyle = 'rgba(255,215,90,.92)'; g.fillRect(x0, 100, x1 - x0, Math.max(0, sy - 100) * q);
          for (let i = 0; i < 22; i++) {
            const dx = x0 + 28 + rand(i + 1) * (x1 - x0 - 56), dy = 130 + rand(i + 3) * 260 + wander(i, t * 0.6) * 5;
            const yy = lerp(dy, 118, q), r = (9 + rand(i + 5) * 14) * (1 - q * 0.7);
            if (q > 0.97) continue;
            const gr = g.createRadialGradient(dx - r * 0.3, yy - r * 0.3, 1, dx, yy, r);
            gr.addColorStop(0, '#FFF3B5'); gr.addColorStop(1, '#F2B630');
            g.fillStyle = gr; g.beginPath(); g.arc(dx, yy, Math.max(1, r), 0, TAU); g.fill();
          }
          g.strokeStyle = C.glass; g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round';
          g.beginPath(); g.moveTo(x0, top); g.lineTo(x0, bot - 12); g.quadraticCurveTo(x0, bot, x0 + 12, bot); g.lineTo(x1 - 12, bot); g.quadraticCurveTo(x1, bot, x1, bot - 12); g.lineTo(x1, top); g.stroke();
          const a = seg(p, 0.75, 0.95);
          Art.text(g, 'oil', 650, 134, { font: 'display', size: 40, color: '#FFDF7A', alpha: a });
          Art.text(g, 'water', 665, 300, { font: 'display', size: 40, color: C.water, alpha: a });
          Art.moe(g, 118, 430, 170, q < 0.5 ? 'think' : 'cheer', { t });
        },
      },
      {
        say: 'Ethanol is different. Its <b>O&ndash;H</b> end hydrogen bonds with water, so it joins the club. Water and ethanol are <b>miscible</b>: they mix in any amounts.',
        dur: 3.4,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.1, 0.6));
          const wat = [[140, 120, 0.3], [140, 330, 2.2], [400, 90, 1.4], [400, 365, 0.2], [660, 120, 2.9], [660, 330, 1.0]];
          const E = [[270, lerp(-60, 226, q), 0], [530, lerp(510, 226, q), Math.PI]];
          const s = 40;
          const f = seg(p, 0.55, 0.8);
          E.forEach(([x, y, r], k) => {
            const c = Math.cos(r), d = Math.sin(r), oh = [x + (1.25 * c - 0.25 * d) * s, y + (1.25 * d + 0.25 * c) * s];
            const near = k === 0 ? [[400, 90], [400, 365]] : [[140 + 260, 90], [400, 365]];
            near.forEach((N) => dots(g, oh, N, { w: 7, gap: 13, alpha: f }));
            dots(g, oh, k === 0 ? [140, 330] : [660, 120], { w: 7, gap: 13, alpha: f * 0.75 });
          });
          wat.forEach(([x, y, r], k) => Art.molecule(g, x + wander(k, t) * 3, y + wander(k + 9, t) * 3, 46, 'H2O', { rot: r, style: 'fill', atomScale: 1.28, labels: false }));
          E.forEach(([x, y, r], k) => Art.molecule(g, x, y, s, 'C2H5OH', { rot: r, style: 'ball', labels: false, atomScale: 1.3, seed: k }));
          Art.text(g, 'The O–H end joins in', 400, 28, { font: 'display', size: 32, color: C.sun, alpha: seg(p, 0.7, 0.9), halo: true });
        },
      },
      {
        say: 'Put it together. Water dissolves ions and polar molecules. Hexane dissolves nonpolar molecules. Each solvent only dissolves what it can make good attractions with. <b>Like dissolves like</b>.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          const col = (x, name, color, list, s0) => {
            const a = seg(p, s0, s0 + 0.2);
            g.fillStyle = Art.alpha(color, 0.16 * a); Art.round(g, x - 180, 24, 360, 400, 24); g.fill();
            Art.text(g, name, x, 62, { font: 'display', size: 34, color, alpha: a });
            list.forEach(([kind, label], i) => {
              const y = 134 + i * 96, q = ease.back(seg(p, s0 + 0.1 + i * 0.1, s0 + 0.25 + i * 0.1));
              if (q <= 0) return;
              g.save(); g.translate(x - 126, y); g.scale(q * 1.7, q * 1.7);
              sprite(g, kind, 0, 0, 0.4, 0);
              if (kind === 'salt') sprite(g, kind, 24, 0, 0, 1);
              g.restore();
              Art.text(g, label, x - 26, y, { size: 26, align: 'left', alpha: q });
            });
          };
          col(210, 'Water dissolves', C.water, [['salt', 'Ions'], ['sugar', 'Sugar'], ['ethanol', 'Ethanol']], 0.04);
          col(590, 'Hexane dissolves', '#FFDF7A', [['oil', 'Oils'], ['iodine', 'Iodine'], ['hexane', 'Grease']], 0.42);
          void t; void W;
        },
      },
    ],
  });

  /* ---------- Bench: mix anything ---------- */
  const EPS = { water: 3600, hexane: 2400, oil: 2600, ethanol: 3000, salt: 9000, sugar: 5000, iodine: 4000 };
  const MIXES = {
    water: { oil: 0, ethanol: 1, salt: 1, sugar: 1, iodine: 0 },
    hexane: { oil: 1, ethanol: 1, salt: 0, sugar: 0, iodine: 1 },
  };
  const DENS = { oil: -1, hexane: -1, ethanol: -0.2, salt: 1, sugar: 0.7, iodine: 1 };
  const WHY = {
    water: {
      oil: 'Separate layers. Oil is nonpolar, so it cannot pay for the hydrogen bonds it would break. It floats because it is less dense.',
      ethanol: 'They mix completely. The O&ndash;H group on ethanol hydrogen bonds with water.',
      salt: 'It dissolves. Water pulls each ion off the crystal and surrounds it, thanks to ion-dipole forces that are strong enough to pay for breaking up the crystal.',
      sugar: 'It dissolves. Sugar covers itself with O&ndash;H groups, so it hydrogen bonds with water. The molecules stay whole, with no ions.',
      iodine: 'Almost nothing dissolves. Nonpolar $\\ce{I2}$ cannot pay for breaking up water\'s hydrogen bonds.',
    },
    hexane: {
      oil: 'They mix completely. Both are nonpolar hydrocarbons held by similar London forces, which is why oil paint thinner works.',
      ethanol: 'They mix at room temperature. Ethanol has a polar O&ndash;H end, but its $\\ce{C2H5}$ tail is nonpolar enough to get along with hexane.',
      salt: 'Nothing dissolves. Hexane has no charges to attract the ions, so the crystal stays whole and sinks.',
      sugar: 'Nothing dissolves. Polar sugar molecules would rather stick to each other than to hexane.',
      iodine: 'It dissolves, and turns the hexane purple. Both are nonpolar with similar London forces.',
    },
  };
  const BOX = { x0: 40, x1: 500, y0: 50, y1: 418 };
  const mix = { solvent: 'water', solute: 'oil', P: [], t0: 0, top: 200 };
  const N_SOLV = 26, N_SOLU = 14, SIG = 44;
  function resetMix(shaken) {
    const P = [];
    const cols = Math.floor((BOX.x1 - BOX.x0 - 40) / (SIG + 1));
    const add = (kind, k, i, row) => {
      const x = BOX.x0 + 26 + (i % cols) * (SIG + 2) + (row % 2) * 10, y = BOX.y1 - 26 - row * (SIG * 0.92);
      P.push({ kind, x, y, vx: (rand(k + 1) - 0.5) * 100, vy: (rand(k + 2) - 0.5) * 100, rot: rand(k + 3) * TAU, spin: (rand(k + 4) - 0.5) * 2, sol: kind !== mix.solvent, id: k });
    };
    const soluteLow = DENS[mix.solute] > 0;
    let k = 0, row = 0, i = 0;
    const seq = soluteLow ? [[mix.solute, N_SOLU], [mix.solvent, N_SOLV]] : [[mix.solvent, N_SOLV], [mix.solute, N_SOLU]];
    seq.forEach(([kind, n]) => {
      for (let m = 0; m < n; m++, k++, i++) {
        if (i && i % cols === 0) row++;
        add(kind, k, i, row);
      }
    });
    if (shaken) P.forEach((q, j) => {
      q.x = BOX.x0 + 30 + rand(j + mix.t0 * 3.1) * (BOX.x1 - BOX.x0 - 60);
      q.y = BOX.y0 + 90 + rand(j * 2 + mix.t0 * 5.3) * (BOX.y1 - BOX.y0 - 120);
      q.vx = (rand(j + 11) - 0.5) * 400; q.vy = (rand(j + 13) - 0.5) * 400;
    });
    mix.P = P;
  }
  function stepMix(dt) {
    const P = mix.P, n = P.length, sub = 4, h = dt / sub;
    const mixes = MIXES[mix.solvent][mix.solute];
    const eS = EPS[mix.solvent], eU = EPS[mix.solute];
    const eX = mixes ? Math.max(eS, (eS + eU) / 2) * 1.2 : Math.min(eS, eU) * 0.28;
    // Once dissolved, solute particles are surrounded by solvent and barely feel each other.
    const eUU = mixes ? Math.min(eU, eS) * 0.5 : eU;
    const kT = 1500;
    for (let st = 0; st < sub; st++) {
      for (let i = 0; i < n; i++) {
        const q = P[i];
        q.ax = 0;
        const d = q.sol && !mixes ? DENS[mix.solute] : 0;
        q.ay = 24 + d * 90;
        // A soluble solute spreads out through the solvent: a stand-in for the slow diffusion of real molecules.
        if (q.sol && mixes) { q.ax = (BOX.x0 + 40 + rand(q.id * 3.3 + 1) * (BOX.x1 - BOX.x0 - 80) - q.x) * 3; q.ay += (mix.top + 30 + rand(q.id * 1.7 + 5) * (BOX.y1 - mix.top - 60) - q.y) * 3; }
      }
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const a = P[i], b = P[j], dx = b.x - a.x, dy = b.y - a.y, r2 = dx * dx + dy * dy;
        if (r2 > 12100) continue;
        const r = Math.max(Math.sqrt(r2), SIG * 0.84);
        const e = a.sol === b.sol ? (a.sol ? eUU : eS) : eX;
        const sr = SIG / r, s2 = sr * sr, s6 = s2 * s2 * s2;
        const F = (24 * e / r) * (2 * s6 * s6 - s6), fx = (F * dx) / r, fy = (F * dy) / r;
        a.ax -= fx; a.ay -= fy; b.ax += fx; b.ay += fy;
      }
      let ke = 0;
      for (let i = 0; i < n; i++) {
        const q = P[i];
        q.vx += q.ax * h; q.vy += q.ay * h; q.x += q.vx * h; q.y += q.vy * h;
        const m = 20;
        if (q.x < BOX.x0 + m) { q.x = BOX.x0 + m; q.vx = Math.abs(q.vx); }
        if (q.x > BOX.x1 - m) { q.x = BOX.x1 - m; q.vx = -Math.abs(q.vx); }
        if (q.y < BOX.y0 + 44) { q.y = BOX.y0 + 44; q.vy = Math.abs(q.vy); }
        if (q.y > BOX.y1 - m) { q.y = BOX.y1 - m; q.vy = -Math.abs(q.vy); }
        ke += 0.5 * (q.vx * q.vx + q.vy * q.vy);
      }
      const lam = Math.sqrt(1 + (h / 0.15) * (kT / Math.max(1, ke / n) - 1));
      for (let i = 0; i < n; i++) { P[i].vx *= lam; P[i].vy *= lam; }
    }
    P.forEach((q) => { q.rot += q.spin * dt; });
  }
  const mixStage = Lab.stage('#c-mix', {
    label: 'A beaker of solvent and solute molecules. Like pairs mix evenly, and unlike pairs separate into layers or stay as a lump.',
    draw(g, t, dt) {
      if (dt > 0) stepMix(Math.min(dt, 0.034));
      const liq = mix.solvent === 'water' ? 'rgba(70,185,240,.3)' : 'rgba(255,233,166,.2)';
      const ys = mix.P.map((q) => q.y).sort((a, b) => a - b);
      mix.top = lerp(mix.top, ys[3] - 26, clamp((dt || 1) * 2));
      g.fillStyle = liq; g.fillRect(BOX.x0, mix.top, BOX.x1 - BOX.x0, BOX.y1 - mix.top);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(BOX.x0, mix.top, BOX.x1 - BOX.x0, 3);
      mix.P.slice().sort((a, b) => (a.sol ? 1 : 0) - (b.sol ? 1 : 0)).forEach((q) => sprite(g, q.kind, q.x, q.y, q.rot, q.id));
      g.strokeStyle = C.glass; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(BOX.x0, BOX.y0 - 22); g.lineTo(BOX.x0, BOX.y1 - 10); g.quadraticCurveTo(BOX.x0, BOX.y1, BOX.x0 + 10, BOX.y1); g.lineTo(BOX.x1 - 10, BOX.y1); g.quadraticCurveTo(BOX.x1, BOX.y1, BOX.x1, BOX.y1 - 10); g.lineTo(BOX.x1, BOX.y0 - 22); g.stroke();
      // The legend sits with the things themselves: one big sample of each.
      const rx = 650;
      const names = { water: 'water', hexane: 'hexane', oil: 'oil', ethanol: 'ethanol', salt: 'salt', sugar: 'sugar', iodine: 'iodine' };
      const pol = { water: 'polar', hexane: 'nonpolar', oil: 'nonpolar', ethanol: 'polar with a nonpolar tail', salt: 'ions', sugar: 'polar', iodine: 'nonpolar' };
      const big = (kind, y) => {
        g.save(); g.translate(rx, y); g.scale(1.7, 1.7);
        sprite(g, kind, 0, 0, Math.sin(t * 0.7) * 0.3, 0);
        if (kind === 'salt') sprite(g, kind, 28, 0, 0, 1);
        g.restore();
      };
      big(mix.solvent, 64);
      Art.text(g, names[mix.solvent], rx, 112, { font: 'display', size: 28 });
      Art.text(g, pol[mix.solvent], rx, 142, { size: 22, color: C.dim });
      Art.text(g, '+', rx, 176, { font: 'display', size: 30, color: C.dim });
      big(mix.solute, 224);
      Art.text(g, names[mix.solute], rx, 272, { font: 'display', size: 28 });
      const pl = pol[mix.solute];
      if (pl.length > 20) { Art.text(g, 'polar, with a', rx, 302, { size: 22, color: C.dim }); Art.text(g, 'nonpolar tail', rx, 328, { size: 22, color: C.dim }); }
      else Art.text(g, pl, rx, 302, { size: 22, color: C.dim });
      const ok = MIXES[mix.solvent][mix.solute], a = clamp((t - mix.t0 - 0.5) * 2);
      Art.pill(g, ok ? 'They mix' : 'They stay apart', rx, 392, { size: 28, font: 'display', color: ok ? C.leaf : C.red, text: '#1A0F2E', alpha: a });
    },
  });
  function paintMix() { Lab.$('#mix-why').innerHTML = Lab.texString(`<p>${WHY[mix.solvent][mix.solute]}</p>`); }
  const restart = (shaken) => { mix.t0 = mixStage.t; resetMix(shaken); paintMix(); if (Lab.reducedMotion) { for (let i = 0; i < 300; i++) stepMix(0.03); mixStage.redraw(); } };
  Lab.segmented('#mix-solvent', (v) => { mix.solvent = v; restart(false); });
  Lab.segmented('#mix-solute', (v) => { mix.solute = v; restart(false); });
  Lab.$('#mix-shake').addEventListener('click', () => restart(true));
  restart(false);

  /* ---------- Story: the energy of dissolving ---------- */
  function ladder(g, x0, x1, levels, p, o = {}) {
    // levels: list of energies in stage y, joined by arrows.
    levels.forEach((L, i) => {
      const a = seg(p, L.at, L.at + 0.14);
      if (a <= 0) return;
      const x = lerp(x0, x1, (i + 0.5) / levels.length), w = (x1 - x0) / levels.length - 14;
      g.save(); g.globalAlpha *= a;
      g.strokeStyle = L.color || '#fff'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x - w / 2, L.y); g.lineTo(x + w / 2, L.y); g.stroke();
      g.restore();
      if (L.draw) L.draw(g, x, L.y, a);
      if (i > 0) {
        const pv = levels[i - 1], px = lerp(x0, x1, (i - 0.5) / levels.length) + w / 2 - 4;
        const up = L.y < pv.y;
        Art.arrow(g, px + 6, pv.y, px + 6, L.y, { color: up ? C.red : C.leaf, w: 7, p: a, head: 18 });
        if (L.tag) Art.text(g, L.tag, px + 14 + (o.tagX || 0), (pv.y + L.y) / 2, { size: 23, color: up ? C.red : C.leaf, align: 'left', alpha: a, halo: true });
      }
    });
  }
  const lumpIons = (g, x, y, a) => { g.save(); g.globalAlpha *= a; [[-24, -26, 'Na'], [12, -26, 'Cl'], [-24, -60, 'Cl'], [12, -60, 'Na']].forEach(([dx, dy, el]) => Art.atom(g, x + dx, y + dy, el === 'Na' ? 13 : 18, el, { label: false })); g.restore(); };
  const apartIons = (g, x, y, a) => { g.save(); g.globalAlpha *= a; [[-52, -22, 'Na'], [52, -22, 'Cl'], [-20, -62, 'Cl'], [24, -62, 'Na']].forEach(([dx, dy, el]) => Art.atom(g, x + dx, y + dy, el === 'Na' ? 13 : 18, el, { label: false })); g.restore(); };
  const withGaps = (g, x, y, a) => { apartIons(g, x, y, a); g.save(); g.globalAlpha *= a; [[-70, -66], [66, -66], [0, -100]].forEach(([dx, dy], i) => Art.molecule(g, x + dx, y + dy, 18, 'H2O', { rot: i, style: 'fill', atomScale: 1.28, labels: false })); g.restore(); };
  const mixedUp = (g, x, y, a) => {
    g.save(); g.globalAlpha *= a;
    Art.atom(g, x - 26, y - 30, 13, 'Na', { label: false }); Art.atom(g, x + 34, y - 30, 18, 'Cl', { label: false });
    [[-62, -30, 1], [-26, -66, 0], [4, -30, 2], [68, -30, 0], [34, -68, 1]].forEach(([dx, dy, r]) => Art.molecule(g, x + dx, y + dy, 18, 'H2O', { rot: r, style: 'fill', atomScale: 1.28, labels: false }));
    g.restore();
  };
  Lab.story('#story-heat', {
    title: 'The energy bill for dissolving',
    scenes: [
      {
        say: '<b>Step 1: pull the solute apart.</b> The ions in a crystal attract each other. Separating them costs energy, so the energy climbs.',
        dur: 3,
        draw(g, p) {
          ladder(g, 30, 790, [{ y: 372, at: 0.02, draw: lumpIons }, { y: 240, at: 0.35, draw: apartIons, tag: 'costs energy' }, { y: 240, at: 2 }, { y: 240, at: 2 }], p);
          Art.text(g, 'Energy', 40, 34, { size: 25, color: C.dim, align: 'left' });
        },
      },
      {
        say: '<b>Step 2: make room in the solvent.</b> Water molecules have to be pushed apart too, breaking some hydrogen bonds. That also costs energy.',
        dur: 3,
        draw(g, p) {
          ladder(g, 30, 790, [{ y: 372, at: 0, draw: lumpIons }, { y: 260, at: 0, draw: apartIons, tag: 'costs energy' }, { y: 152, at: 0.3, draw: withGaps, tag: 'costs energy' }, { y: 152, at: 2 }], p);
          Art.text(g, 'Energy', 40, 34, { size: 25, color: C.dim, align: 'left' });
        },
      },
      {
        say: '<b>Step 3: mix them.</b> Now ions and water attract each other. New attractions release energy, so the energy drops back down.',
        dur: 3,
        draw(g, p) {
          ladder(g, 30, 790, [{ y: 372, at: 0, draw: lumpIons }, { y: 260, at: 0, draw: apartIons, tag: 'costs energy' }, { y: 152, at: 0, draw: withGaps, tag: 'costs energy' }, { y: 320, at: 0.3, draw: mixedUp, tag: 'pays energy' }], p);
          Art.text(g, 'Energy', 40, 34, { size: 25, color: C.dim, align: 'left' });
          const a = seg(p, 0.7, 0.95);
          g.save(); g.globalAlpha *= a; g.setLineDash([6, 8]); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3;
          g.beginPath(); g.moveTo(130, 372); g.lineTo(790, 372); g.stroke(); g.restore();
        },
      },
      {
        say: 'Compare start and finish. End <b>higher</b> and heat is absorbed: <b>endothermic</b>, like the $\\ce{NH4NO3}$ in a cold pack. End <b>lower</b> and heat is released: <b>exothermic</b>, like $\\ce{CaCl2}$ in a hot pack.',
        dur: 4,
        draw(g, p) {
          const pack = (cx, name, f, dH, col, cold, s0) => {
            const a = seg(p, s0, s0 + 0.2);
            g.fillStyle = Art.alpha(col, 0.14 * a); Art.round(g, cx - 186, 22, 372, 406, 24); g.fill();
            Art.text(g, name, cx, 58, { font: 'display', size: 34, color: col, alpha: a });
            Art.formula(g, f, cx, 106, { size: 34, color: C.ink });
            const startY = cold ? 300 : 190, endY = cold ? 190 : 330;
            const lx = cx - 150, rx = cx - 20;
            g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.globalAlpha = a;
            g.beginPath(); g.moveTo(lx, startY); g.lineTo(lx + 70, startY); g.moveTo(rx, endY); g.lineTo(rx + 70, endY); g.stroke(); g.globalAlpha = 1;
            Art.arrow(g, lx + 76, startY, rx - 6, endY, { color: cold ? C.red : C.leaf, w: 6, p: seg(p, s0 + 0.1, s0 + 0.3), dash: [6, 7] });
            Art.text(g, 'start', lx + 35, startY + 26, { size: 22, color: C.dim, alpha: a });
            Art.text(g, 'finish', rx + 35, endY + 26, { size: 22, color: C.dim, alpha: a });
            const q = seg(p, s0 + 0.18, s0 + 0.32);
            Art.thermometer(g, cx + 130, 150, 190, cold ? lerp(0.5, 0.18, q) : lerp(0.5, 0.88, q), { color: cold ? C.cyan : C.fire, w: 18 });
            Art.text(g, dH, cx, 396, { font: 'display', size: 28, color: C.sun, alpha: seg(p, s0 + 0.25, s0 + 0.4) });
          };
          pack(204, 'Cold pack', 'NH4NO3', '+25.7 kJ/mol', C.cyan, true, 0.04);
          pack(596, 'Hot pack', 'CaCl2', '−82.8 kJ/mol', C.fire, false, 0.42);
        },
      },
    ],
  });

  /* ---------- Bench: saturation and the crystal drop ---------- */
  const SOLUB = [[0, 13.3], [10, 20.9], [20, 31.6], [30, 45.8], [40, 63.9], [50, 85.5], [60, 110], [70, 138], [80, 169], [90, 202], [100, 246]];
  const S_of = (T) => {
    for (let i = 1; i < SOLUB.length; i++) if (T <= SOLUB[i][0]) return lerp(SOLUB[i - 1][1], SOLUB[i][1], (T - SOLUB[i - 1][0]) / 10);
    return SOLUB[SOLUB.length - 1][1];
  };
  const sat = { T: 30, g: 30, d: 30, crash: 0, seedT: -99, shownD: 30 };
  const SAT_BOX = { x0: 452, x1: 780, y0: 44, y1: 388 };
  const satStage = Lab.stage('#c-sat', {
    label: 'A beaker with dissolved particles and any undissolved crystals, beside a graph of solubility against temperature.',
    draw(g, t, dt) {
      sat.shownD = lerp(sat.shownD, sat.d, clamp((dt || 1) * (t - sat.seedT < 3 ? 2.2 : 7)));
      const cx = 216, base = 412, w = 330, h = 330;
      const excess = Math.max(0, sat.g - sat.shownD);
      const nCry = Math.min(60, Math.round(excess / 3));
      const S = S_of(sat.T);
      const superSat = sat.shownD > S + 0.5;
      const fall = clamp((t - sat.seedT) / 0.7);
      const seedLand = [cx + 30, base - 18];
      Art.beaker(g, cx, base, w, h, {
        level: 0.72, liquid: Art.mix('#46B9F0', '#FF8A2B', clamp((sat.T - 20) / 200)), ticks: false,
        inside: (gg, box) => {
          // Dissolved ions: more solute, more ions, up to a limit that stays readable.
          const n = Math.min(40, Math.round(sat.shownD / 4));
          for (let i = 0; i < n; i++) {
            const speed = 0.5 + sat.T / 60;
            const x = lerp(box.x0 + 22, box.x1 - 22, rand(i * 7.31 + 1)) + wander(i + 1, t * speed) * 16;
            const y = lerp(box.top + 18, box.bottom - 40, rand(i * 3.77 + 7.5)) + wander(i + 9, t * speed) * 12;
            Art.atom(gg, x, y, i % 2 ? 9.5 : 8, i % 2 ? 'N' : 'K', { label: false });
          }
          // Crystals, spreading out from the seed.
          for (let i = 0; i < nCry; i++) {
            const ring = Math.sqrt(i) * 19, a = i * 2.399;
            const x = clamp(seedLand[0] + Math.cos(a) * ring * 1.5, box.x0 + 14, box.x1 - 14);
            const y = clamp(seedLand[1] - Math.abs(Math.sin(a)) * ring * 0.5 + 4, box.top + 10, box.bottom - 8);
            g.save(); g.translate(x, y); g.rotate(rand(i + 2) * 3);
            gg.fillStyle = 'rgba(245,250,255,.96)'; gg.strokeStyle = 'rgba(30,20,60,.65)'; gg.lineWidth = 1.5;
            gg.beginPath(); gg.moveTo(-13, 0); gg.lineTo(0, -8); gg.lineTo(13, 0); gg.lineTo(0, 8); gg.closePath(); gg.fill(); gg.stroke();
            g.restore();
          }
          if (superSat && t - sat.seedT > 0.7) {
            gg.fillStyle = `rgba(255,255,255,${0.06 + 0.04 * Math.sin(t * 3)})`; gg.fillRect(box.x0, box.top, box.x1 - box.x0, box.bottom - box.top);
          }
        },
      });
      // The seed, falling.
      if (fall < 1) {
        const y = lerp(30, seedLand[1], fall * fall);
        g.save(); g.translate(seedLand[0], y); g.rotate(fall * 5);
        g.fillStyle = '#fff'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(-12, 0); g.lineTo(0, -9); g.lineTo(12, 0); g.lineTo(0, 9); g.closePath(); g.fill(); g.stroke();
        g.restore();
      }
      const crash = clamp((t - sat.seedT - 0.6) / 1.4);
      if (crash > 0 && crash < 1) Art.burst(g, seedLand[0], seedLand[1] - 30, crash, { n: 14, r: 120, colors: ['#fff', C.cyan] });
      // Graph.
      const b = SAT_BOX, X = (T) => b.x0 + (T / 100) * (b.x1 - b.x0), Y = (s) => b.y1 - (s / 250) * (b.y1 - b.y0);
      g.fillStyle = '#1E1236'; Art.round(g, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 10); g.fill();
      g.save(); g.beginPath(); g.rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); g.clip();
      g.fillStyle = 'rgba(70,185,240,.28)';
      g.beginPath(); g.moveTo(X(0), Y(0)); SOLUB.forEach(([T, s]) => g.lineTo(X(T), Y(s))); g.lineTo(X(100), Y(0)); g.closePath(); g.fill();
      g.restore();
      g.strokeStyle = C.cyan; g.lineWidth = 6; g.lineJoin = 'round'; g.lineCap = 'round';
      g.beginPath(); SOLUB.forEach(([T, s], i) => (i ? g.lineTo(X(T), Y(s)) : g.moveTo(X(T), Y(s)))); g.stroke();
      Art.text(g, 'g per 100 g of water', b.x0, 24, { size: 21, color: C.dim, align: 'left' });
      [0, 50, 100].forEach((T) => Art.text(g, String(T), X(T), b.y1 + 20, { size: 21, color: C.dim, align: T === 0 ? 'left' : T === 100 ? 'right' : 'center' }));
      Art.text(g, '°C', (X(0) + X(50)) / 2, b.y1 + 20, { size: 21, color: C.dim });
      Art.text(g, 'unsaturated', X(66), Y(34), { size: 22, color: '#D4F1FF' });
      Art.text(g, 'too much', X(24), Y(184), { size: 22, color: '#FFD6E6' });
      const px = X(sat.T), py = Y(sat.g);
      g.fillStyle = C.pink; g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.beginPath(); g.arc(px, py, 11, 0, TAU); g.fill(); g.stroke();
    },
  });
  function paintSat() {
    const S = S_of(sat.T);
    const excess = sat.g - sat.d;
    Lab.$('#sat-S').textContent = `${Lab.fmt(S, 1)} g`;
    Lab.$('#sat-d').textContent = `${Lab.fmt(sat.d, 1)} g`;
    let st = 'Unsaturated';
    if (excess > 0.05) st = 'Saturated, with extra solid';
    else if (sat.d > S + 0.05) st = 'Supersaturated';
    else if (Math.abs(sat.d - S) <= 0.05) st = 'Saturated';
    Lab.$('#sat-state').textContent = st;
    Lab.$('#sat-seed').disabled = !(sat.d > S + 0.05);
  }
  Lab.bind('#sat-T', '#sat-T-out', (v) => fmtDeg(v), (v) => {
    sat.T = v;
    const S = S_of(v);
    // Cooling a clear solution keeps its solute (supersaturated). Warming, or extra solid, lets it reach equilibrium.
    if (sat.g - sat.d > 0.05) sat.d = Math.min(sat.g, S);
    else if (sat.d < sat.g) sat.d = Math.min(sat.g, S);
    paintSat();
  });
  Lab.bind('#sat-g', '#sat-g-out', (v) => `${v} g`, (v) => {
    sat.g = v;
    const S = S_of(sat.T);
    if (sat.d > v) sat.d = v;
    else if (sat.d < S) sat.d = Math.min(v, S);
    paintSat();
  });
  Lab.$('#sat-seed').addEventListener('click', () => {
    sat.seedT = satStage.t; sat.d = Math.min(sat.g, S_of(sat.T)); Lab.sound.pop(); paintSat();
  });
  paintSat();

  /* ---------- Bench: the soda bottle ---------- */
  const kH = (T) => 0.034 * Math.exp(2400 * (1 / (T + 273.15) - 1 / 298.15));
  const soda = { P: 3, T: 25, open: false, C: 0.102, tOpen: -99 };
  const AIR_P = 0.0004;
  function bottlePath(cx, top, bot, w) {
    const p = new Path2D(), n = w * 0.24;
    p.moveTo(cx - n, top); p.lineTo(cx - n, top + 54);
    p.bezierCurveTo(cx - n, top + 92, cx - w / 2, top + 104, cx - w / 2, top + 150);
    p.lineTo(cx - w / 2, bot - 18); p.quadraticCurveTo(cx - w / 2, bot, cx - w / 2 + 18, bot);
    p.lineTo(cx + w / 2 - 18, bot); p.quadraticCurveTo(cx + w / 2, bot, cx + w / 2, bot - 18);
    p.lineTo(cx + w / 2, top + 150); p.bezierCurveTo(cx + w / 2, top + 104, cx + n, top + 92, cx + n, top + 54);
    p.lineTo(cx + n, top);
    return p;
  }
  const SODA = { x0: 446, x1: 776, y0: 54, y1: 384 };
  const sodaStage = Lab.stage('#c-soda', {
    label: 'A soda bottle with carbon dioxide molecules above and within the liquid, beside a graph of concentration against pressure.',
    draw(g, t, dt) {
      const Pnow = soda.open ? AIR_P : soda.P;
      const Ceq = kH(soda.T) * Pnow;
      soda.C = lerp(soda.C, Ceq, clamp((dt || 0.03) * (soda.open ? 0.32 : 2.2)));
      const fizz = soda.open ? clamp((soda.C - Ceq) / 0.08) : 0;
      const cx = 196, top = 34, bot = 426, w = 220;
      const body = bottlePath(cx, top, bot, w);
      const surfaceY = 200;
      g.save(); g.clip(body);
      g.fillStyle = 'rgba(214,240,255,.06)'; g.fillRect(cx - w / 2 - 4, top, w + 8, bot - top);
      const lg = g.createLinearGradient(0, surfaceY, 0, bot);
      lg.addColorStop(0, 'rgba(150,84,40,.82)'); lg.addColorStop(1, 'rgba(84,42,22,.95)');
      g.fillStyle = lg; g.fillRect(cx - w / 2 - 4, surfaceY, w + 8, bot - surfaceY);
      // Dissolved CO2.
      const nD = Math.round(clamp(soda.C / 0.34) * 22);
      for (let i = 0; i < nD; i++) {
        const x = lerp(cx - w / 2 + 26, cx + w / 2 - 26, rand(i * 7.31 + 1)) + wander(i + 1, t) * 12;
        const y = lerp(surfaceY + 26, bot - 26, rand(i * 3.77 + 5.5)) + wander(i + 21, t) * 10;
        Art.molecule(g, x, y, 15, 'CO2', { rot: rand(i) * 3 + t * 0.3, style: 'fill', atomScale: 1.2, labels: false });
      }
      if (fizz > 0.01) Art.bubbles(g, cx - w / 2 + 18, cx + w / 2 - 18, bot - 10, surfaceY + 4, t * 1.6, { n: Math.round(6 + fizz * 26), r: 7 });
      // Gas above the liquid.
      const nG = soda.open ? 0 : Math.round(2 + (soda.P / 5) * 10);
      for (let i = 0; i < nG; i++) {
        const X = 0.5 + 0.5 * Math.sin(t * (0.9 + rand(i) * 0.7) + i * 2.1), Y = 0.5 + 0.5 * Math.sin(t * (1.1 + rand(i + 4) * 0.7) + i);
        Art.molecule(g, lerp(cx - 60, cx + 60, X), lerp(120, surfaceY - 18, Y), 15, 'CO2', { rot: t + i, style: 'fill', atomScale: 1.2, labels: false });
      }
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(cx - w / 2, surfaceY, w, 3);
      g.restore();
      // Escaping gas when open.
      if (soda.open) {
        const sinceOpen = t - soda.tOpen;
        for (let i = 0; i < 6; i++) {
          const ph = (t * 0.55 + i / 6) % 1;
          if (fizz < 0.05 && i > 1) continue;
          Art.molecule(g, cx + Math.sin(ph * 6 + i) * (10 + ph * 44), lerp(150, -10, ph), 15, 'CO2', { rot: t + i, style: 'fill', atomScale: 1.2, labels: false, alpha: 1 - ph * 0.5 });
        }
        if (sinceOpen < 0.7) Art.burst(g, cx, top + 6, sinceOpen / 0.7, { n: 16, r: 90, colors: ['#fff', C.cyan, C.sun] });
      }
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.strokeStyle = 'rgba(18,7,40,.6)'; g.lineWidth = 7; g.stroke(body);
      g.strokeStyle = C.glass; g.lineWidth = 4; g.stroke(body);
      g.fillStyle = 'rgba(255,255,255,.22)'; Art.round(g, cx - w / 2 + 14, 240, 10, 150, 5); g.fill();
      // The cap.
      const n = w * 0.24;
      const capLift = soda.open ? ease.out(clamp((t - soda.tOpen) * 2)) : 0;
      g.save(); g.translate(cx + capLift * 94, top - 4 + capLift * 8); g.rotate(capLift * 1.2);
      g.fillStyle = C.red; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; Art.round(g, -n - 7, -20, n * 2 + 14, 28, 6); g.fill(); g.stroke();
      g.restore();
      // Graph.
      const b = SODA, X = (P) => b.x0 + (P / 5) * (b.x1 - b.x0), Y = (Cv) => b.y1 - (Cv / 0.36) * (b.y1 - b.y0);
      g.fillStyle = '#1E1236'; Art.round(g, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 10); g.fill();
      g.save(); g.beginPath(); g.rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); g.clip();
      g.setLineDash([6, 7]); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(5), Y(0.034 * 5)); g.stroke(); g.setLineDash([]);
      g.strokeStyle = C.cyan; g.lineWidth = 6;
      g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(5), Y(kH(soda.T) * 5)); g.stroke();
      g.restore();
      Art.text(g, 'CO₂ dissolved (mol/L)', b.x0, 28, { size: 21, color: C.dim, align: 'left' });
      Art.text(g, 'CO₂ pressure (atm)', (b.x0 + b.x1) / 2, b.y1 + 40, { size: 21, color: C.dim });
      [0, 1, 2, 3, 4, 5].forEach((P) => Art.text(g, String(P), X(P), b.y1 + 16, { size: 20, color: C.dim }));
      Art.text(g, 'at 25 °C', X(4.2), Y(0.034 * 4.2) + 26, { size: 21, color: C.dim, halo: true });
      Art.text(g, `C = kH × P`, X(1.4), Y(0.31), { font: 'display', size: 30, color: C.cyan });
      const px = X(Math.max(Pnow, 0)), py = Y(soda.C);
      Art.glow(g, px, py, 28, '#fff', 0.5);
      g.fillStyle = C.pink; g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.beginPath(); g.arc(px, py, 11, 0, TAU); g.fill(); g.stroke();
      // Live readouts.
      if (Math.round(t * 6) !== Math.round((t - (dt || 0)) * 6)) paintSoda();
    },
  });
  function paintSoda() {
    Lab.$('#soda-k').textContent = `${Lab.fmt(kH(soda.T) * 100, 1)} × 10⁻² mol/(L atm)`;
    Lab.$('#soda-C').textContent = soda.C < 0.001 ? 'nearly none' : `${Lab.fmt(soda.C, 3)} mol/L`;
    Lab.$('#soda-Pnow').textContent = soda.open ? 'about 0.0004 atm' : `${Lab.fmt(soda.P, 1)} atm`;
    const b = Lab.$('#soda-cap');
    b.textContent = soda.open ? 'Reseal with fresh gas' : 'Open the cap';
  }
  Lab.bind('#soda-P', '#soda-P-out', (v) => `${Lab.fmt(v, 1)} atm`, (v) => { soda.P = v; paintSoda(); });
  Lab.bind('#soda-T', '#soda-T-out', (v) => fmtDeg(v), (v) => { soda.T = v; paintSoda(); });
  Lab.$('#soda-cap').addEventListener('click', () => {
    soda.open = !soda.open;
    if (soda.open) { soda.tOpen = sodaStage.t; Lab.sound.pop(); }
    paintSoda();
  });
  paintSoda();

  /* ---------- Bench: one solution, five numbers ---------- */
  const UNITS = { sub: 'NaCl', g: 29, w: 500 };
  const U_NAME = { NaCl: 'NaCl', C6H12O6: 'glucose', C2H6O: 'ethanol' };
  function unitsVals() {
    const M = Bank.molarMass(UNITS.sub), Mw = Bank.molarMass('H2O');
    const n = UNITS.g / M, nw = UNITS.w / Mw, total = UNITS.g + UNITS.w;
    return { M, n, nw, total, molal: n / (UNITS.w / 1000), molar: n / (total / 1000), chi: n / (n + nw), pct: (UNITS.g / total) * 100, ppm: (UNITS.g / total) * 1e6 };
  }
  Lab.stage('#c-units', {
    label: 'A beaker of solute and water beside five concentration units, each with its fraction and value.',
    draw(g, t) {
      const V = unitsVals();
      const cx = 134, base = 410, w = 214, h = Math.max(150, lerp(150, 320, UNITS.w / 1000));
      Art.beaker(g, cx, base, w, h, {
        level: 0.8, liquid: C.water, ticks: false,
        inside: (gg, box) => {
          for (let i = 0; i < 12; i++) {
            const x = lerp(box.x0 + 22, box.x1 - 22, rand(i * 7.31 + 2)) + wander(i, t) * 7, y = lerp(box.top + 18, box.bottom - 16, rand(i * 3.77 + 6.5)) + wander(i + 9, t) * 6;
            Art.molecule(gg, x, y, 14, 'H2O', { rot: rand(i) * 6, style: 'fill', atomScale: 1.2, labels: false, alpha: 0.7 });
          }
          const nS = Math.max(1, Math.min(18, Math.round(V.molal * 7)));
          for (let i = 0; i < nS; i++) {
            const x = lerp(box.x0 + 20, box.x1 - 20, rand(i * 5.13 + 31)) + wander(i + 3, t) * 8, y = lerp(box.top + 16, box.bottom - 16, rand(i * 2.71 + 37.5)) + wander(i + 19, t) * 6;
            if (UNITS.sub === 'NaCl') Art.atom(gg, x, y, i % 2 ? 11 : 8, i % 2 ? 'Cl' : 'Na', { label: false });
            else if (UNITS.sub === 'C6H12O6') sugar(gg, x, y, 7, i);
            else Art.molecule(gg, x, y, 8, 'C2H5OH', { rot: i, style: 'fill', atomScale: 1.2, labels: false });
          }
        },
      });
      Art.text(g, `${UNITS.g} g ${U_NAME[UNITS.sub]}`, cx, 28, { font: 'display', size: 25, color: C.pink });
      Art.text(g, `in ${UNITS.w} g water`, cx, 58, { size: 23, color: C.water });
      const sigFmt = (x, n = 3) => Lab.sig(x, n);
      const rows = [
        ['Molality', 'mol solute ÷ kg solvent', `${sigFmt(V.molal)} m`, C.sun],
        ['Molarity', 'mol solute ÷ L solution', `about ${sigFmt(V.molar)} M`, C.cyan],
        ['Mole fraction', 'mol solute ÷ total mol', sigFmt(V.chi, 3), C.leaf],
        ['Mass percent', 'g solute ÷ g solution × 100', `${sigFmt(V.pct)}%`, C.pink],
        ['Parts per million', 'g solute ÷ g solution × 10⁶', `${Lab.fmt(Math.round(V.ppm / 100) * 100, 0)} ppm`, C.fire],
      ];
      rows.forEach(([name, def, val, col], i) => {
        const y = 52 + i * 82;
        g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, 262, y - 37, 528, 74, 14); g.fill();
        Art.text(g, name, 278, y - 14, { font: 'display', size: 26, align: 'left', color: col });
        Art.text(g, def, 278, y + 17, { size: 21, align: 'left', color: C.dim });
        Art.text(g, val, 776, y, { font: 'display', size: 30, align: 'right', color: C.ink });
      });
    },
  });
  Lab.segmented('#u-sub', (v) => { UNITS.sub = v; });
  Lab.bind('#u-g', '#u-g-out', (v) => `${v} g`, (v) => { UNITS.g = v; });
  Lab.bind('#u-w', '#u-w-out', (v) => `${v} g`, (v) => { UNITS.w = v; });

  /* ---------- Story: colligative properties ---------- */
  function vpChart(g, b, drop, p, o = {}) {
    // A schematic vapor pressure curve for water and for the solution, with the 1 atm line.
    const X = (T) => b.x0 + ((T - 60) / 55) * (b.x1 - b.x0), Y = (P) => b.y1 - (P / 1100) * (b.y1 - b.y0);
    const vp = (T) => Math.pow(10, 8.07131 - 1730.63 / (233.426 + T));
    g.fillStyle = '#1E1236'; Art.round(g, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 10); g.fill();
    g.save(); g.beginPath(); g.rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); g.clip();
    const curve = (f, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); for (let T = 60; T <= 115; T += 1) { const x = X(T), y = Y(f(T)); if (T === 60) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); };
    curve(vp, C.water, 6);
    if (drop > 0) curve((T) => vp(T) * (1 - drop), C.pink, 6);
    g.setLineDash([7, 7]); g.strokeStyle = C.sun; g.lineWidth = 3; g.beginPath(); g.moveTo(b.x0, Y(760)); g.lineTo(b.x1, Y(760)); g.stroke(); g.setLineDash([]);
    g.restore();
    Art.text(g, '1 atm', b.x0 + 8, Y(760) - 16, { size: 22, color: C.sun, align: 'left', halo: true });
    Art.text(g, 'Vapor pressure', b.x0, b.y0 - 18, { size: 22, color: C.dim, align: 'left' });
    Art.text(g, 'Temperature', (b.x0 + b.x1) / 2, b.y1 + 22, { size: 22, color: C.dim });
    return { X, Y, vp };
  }
  function surfaceView(g, cx, cy, R, solutes, t, o = {}) {
    // Liquid surface with water and perhaps blocking solutes along it.
    const sy = cy - R * 0.1;
    g.fillStyle = 'rgba(70,185,240,.42)'; g.fillRect(cx - R, sy, R * 2, R * 1.2);
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(cx - R, sy, R * 2, 3);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) {
      const x = cx - R + 30 + i * (R * 2 - 60) / 5 + (j % 2) * 18, y = sy + 28 + j * 54;
      const isS = solutes && (i + j * 2) % 3 === 0;
      if (isS) Art.atom(g, x, y, 18, 'Na', { label: false, glow: 0.4 });
      else Art.molecule(g, x + wander(i * 3 + j, t) * 3, y + wander(i + j * 7, t) * 3, 21, 'H2O', { rot: rand(i + j * 5) * TAU, style: 'fill', atomScale: 1.28, labels: false });
    }
    const n = o.n === undefined ? (solutes ? 2 : 4) : o.n;
    for (let i = 0; i < n; i++) {
      const ph = (t * 0.32 + i / n) % 1;
      const x = cx - R * 0.72 + (i * 2 + 1) * R * 0.72 / n + Math.sin(ph * 6 + i) * 8, y = lerp(sy - 8, cy - R + 14, ease.out(ph));
      Art.molecule(g, x, y, 21, 'H2O', { rot: t + i, style: 'fill', atomScale: 1.28, labels: false, alpha: 1 - ph * 0.4 });
    }
  }
  const FU = {
    sugar: (g, x, y, a) => { g.save(); g.globalAlpha *= a; sugar(g, x, y, 28, 0.2); g.restore(); },
  };
  Lab.story('#story-coll', {
    title: 'Why dissolved particles change everything',
    scenes: [
      {
        say: 'Count the particles. Sugar stays whole, so each sugar gives <b>1</b> particle. NaCl splits in <b>2</b>. $\\ce{CaCl2}$ splits in <b>3</b>. This count is the <b>van \'t Hoff factor</b>, $i$. Water only notices the count.',
        dur: 4,
        draw(g, p) {
          const rows = [
            ['Sugar', 'i = 1', (x, y, a, q) => { FU.sugar(g, x, y, a); void q; }, 0.05],
            ['NaCl', 'i = 2', (x, y, a, q) => { g.save(); g.globalAlpha *= a; Art.atom(g, x - q * 60 - 18, y, 24, 'Na', { charge: '+' }); Art.atom(g, x + q * 60 + 18, y, 32, 'Cl', { charge: '-' }); g.restore(); }, 0.3],
            ['CaCl₂', 'i = 3', (x, y, a, q) => { g.save(); g.globalAlpha *= a; Art.atom(g, x, y, 28, 'Ca', { charge: '2+' }); Art.atom(g, x - q * 78 - 42, y, 32, 'Cl', { charge: '-' }); Art.atom(g, x + q * 78 + 42, y, 32, 'Cl', { charge: '-' }); g.restore(); }, 0.55],
          ];
          rows.forEach(([name, tag, draw, s0], i) => {
            const y = 86 + i * 138, a = seg(p, s0, s0 + 0.15), q = ease.back(seg(p, s0 + 0.08, s0 + 0.28));
            Art.text(g, name, 110, y, { font: 'display', size: 38, alpha: a });
            draw(420, y, a, q);
            Art.text(g, tag, 712, y, { font: 'display', size: 42, color: C.sun, alpha: seg(p, s0 + 0.15, s0 + 0.3) });
          });
        },
      },
      {
        say: 'Now look at the surface. In pure water, every spot at the surface can launch a molecule. Solute particles take up some of those spots, so fewer water molecules escape. Vapor pressure <b>drops</b>. That is <b>Raoult\'s law</b>. This picture is a handy simplification: the deeper reason is entropy.',
        dur: 4,
        draw(g, p, t) {
          const pane = (cx, sol, title, col, s0) => {
            const q = seg(p, s0, s0 + 0.25);
            Art.zoom(g, cx, 216, cx, 216, 172, (gg, x, y, R) => surfaceView(gg, x, y, R, sol, t), { p: q });
            Art.text(g, title, cx, 26, { font: 'display', size: 30, color: col, alpha: q });
          };
          pane(204, false, 'Pure water', C.water, 0.05);
          pane(596, true, 'With solute', C.pink, 0.35);
          Art.text(g, 'more escape', 204, 418, { size: 28, color: C.water, alpha: seg(p, 0.3, 0.5), halo: true });
          Art.text(g, 'fewer escape', 596, 418, { size: 28, color: C.pink, alpha: seg(p, 0.6, 0.8), halo: true });
        },
      },
      {
        say: 'Lower vapor pressure means you must heat <b>further</b> before it reaches 1 atm. The solution boils above 100 °C. That is <b>boiling point elevation</b>, and the size of the gap is $\\Delta T_b = iK_bm$.',
        dur: 4,
        draw(g, p) {
          const b = { x0: 96, x1: 700, y0: 52, y1: 386 };
          const drop = 0.2 * ease.inOut(seg(p, 0.12, 0.5));
          const { X, Y, vp } = vpChart(g, b, drop, p);
          const T1 = 100;
          const bpS = 1730.63 / (8.07131 - Math.log10(760 / (1 - 0.2))) - 233.426;
          const a = seg(p, 0.55, 0.75);
          g.save(); g.globalAlpha *= a; g.setLineDash([5, 6]); g.lineWidth = 3;
          g.strokeStyle = C.water; g.beginPath(); g.moveTo(X(T1), Y(760)); g.lineTo(X(T1), b.y1); g.stroke();
          g.strokeStyle = C.pink; g.beginPath(); g.moveTo(X(bpS), Y(760)); g.lineTo(X(bpS), b.y1); g.stroke();
          g.restore();
          Art.text(g, 'gap exaggerated', b.x0 + 12, b.y1 - 62, { size: 22, color: C.dim, align: 'left', alpha: a });
          Art.text(g, 'water, 100 °C', X(T1) - 8, b.y1 - 24, { size: 24, color: C.water, align: 'right', alpha: a, halo: true });
          Art.text(g, 'solution', X(bpS) + 8, b.y1 - 24, { size: 24, color: C.pink, align: 'left', alpha: a, halo: true });
          Art.arrow(g, X(T1), Y(500), X(bpS), Y(500), { color: C.sun, w: 6, head: 14, p: seg(p, 0.7, 0.9) });
          Art.text(g, 'ΔTb', (X(T1) + X(bpS)) / 2, Y(500) - 26, { font: 'display', size: 30, color: C.sun, alpha: seg(p, 0.75, 0.95), halo: true });
          void vp;
        },
      },
      {
        say: 'Freezing works the other way. Water molecules must join the ice, but solute particles get in the way, and they do not fit in the crystal. You must cool <b>further</b> before ice can form. That is <b>freezing point depression</b>: $\\Delta T_f = iK_fm$.',
        dur: 4.4,
        draw(g, p, t) {
          const cx = 280, cy = 225, R = 195;
          Art.zoom(g, cx, cy, cx, cy, R, (gg, x, y) => {
            // Ice below, liquid above.
            const ice = y + 40;
            gg.fillStyle = 'rgba(200,235,255,.26)'; gg.fillRect(x - R, ice, R * 2, R);
            gg.fillStyle = 'rgba(70,185,240,.28)'; gg.fillRect(x - R, y - R, R * 2, R + 40);
            for (let j = 0; j < 3; j++) for (let i = 0; i < 7; i++) {
              const px = x - R + 26 + i * 58 + (j % 2) * 28, py = ice + 28 + j * 52;
              if (j < 2 || i % 2) dots(gg, [px, py], [px + 58, py], { w: 3.5, alpha: 0.8 });
              Art.molecule(gg, px, py, 21, 'H2O', { rot: (i + j) % 2 ? 0.5 : -0.5, style: 'fill', atomScale: 1.28, labels: false });
            }
            const solu = [[-130, -40], [10, -82], [120, -14], [-40, -2]];
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * TAU + 0.4;
              Art.molecule(gg, x + Math.cos(a) * (R * 0.72) * 0.96 + wander(i, t) * 6, y - 66 + Math.sin(a) * 66 + wander(i + 7, t) * 5, 21, 'H2O', { rot: t * 0.4 + i, style: 'fill', atomScale: 1.28, labels: false });
            }
            solu.forEach(([dx, dy], i) => Art.atom(gg, x + dx + wander(i + 3, t) * 5, y + dy + wander(i + 8, t) * 4, i % 2 ? 17 : 22, i % 2 ? 'Na' : 'Cl', { charge: i % 2 ? '+' : '-', glow: 0.35 }));
            const a = seg(p, 0.55, 0.75);
            Art.arrow(gg, x + 66, y - 70, x + 90, ice + 2, { color: C.red, w: 6, p: a, dash: [5, 6] });
            Art.strike(gg, x + 58, ice - 34, x + 102, ice - 8, seg(p, 0.7, 0.85), C.red, 7);
          }, { p: seg(p, 0.05, 0.25) });
          Art.text(g, 'liquid', 616, 150, { font: 'display', size: 34, color: C.water, alpha: seg(p, 0.2, 0.4) });
          Art.text(g, 'with solute', 616, 188, { size: 26, alpha: seg(p, 0.2, 0.4) });
          Art.text(g, 'ice', 616, 322, { font: 'display', size: 34, color: '#D6F2FF', alpha: seg(p, 0.3, 0.5) });
          Art.text(g, 'solute keeps out', 616, 360, { size: 26, alpha: seg(p, 0.3, 0.5) });
        },
      },
      {
        say: 'So salt on a road does not heat the ice. It lowers the temperature at which water can freeze. If that is now below the air temperature, the ice can no longer stay frozen, and it melts.',
        dur: 3.8,
        draw(g, p, t, { W, H }) {
          // A road with salt on an ice patch.
          g.fillStyle = '#39324F'; g.fillRect(0, 346, W, H - 346);
          g.fillStyle = '#FFD23F'; for (let x = 20; x < W; x += 150) g.fillRect(x, 405, 84, 7);
          const melt = ease.inOut(seg(p, 0.4, 0.95));
          const iw = 560, ih = lerp(46, 6, melt);
          const ig = g.createLinearGradient(0, 346 - ih, 0, 346);
          ig.addColorStop(0, 'rgba(225,245,255,.96)'); ig.addColorStop(1, 'rgba(150,215,245,.9)');
          g.fillStyle = ig; Art.round(g, 120, 346 - ih, iw, ih, 8); g.fill();
          g.fillStyle = `rgba(70,185,240,${0.15 + melt * 0.5})`; g.beginPath(); g.ellipse(400, 356, 340 + melt * 34, 14, 0, 0, TAU); g.fill();
          for (let i = 0; i < 26; i++) {
            const q = ease.bounce(seg(p, 0.02 + rand(i) * 0.2, 0.3 + rand(i) * 0.2));
            const x = 150 + rand(i + 4) * 500, y = lerp(60, 346 - ih - 4 + rand(i + 9) * 8, q);
            g.fillStyle = '#FFFFFF'; g.fillRect(x, y, 7, 7);
          }
          Art.text(g, `Air: −5 °C`, 130, 56, { font: 'display', size: 34, color: C.cyan });
          Art.text(g, 'Pure water freezes at 0 °C', 400, 150, { size: 28, alpha: seg(p, 0.1, 0.3) });
          Art.text(g, 'This salty water freezes at −11 °C', 400, 192, { size: 28, color: C.pink, alpha: seg(p, 0.3, 0.5) });
          Art.text(g, 'So at −5 °C it stays liquid', 400, 240, { font: 'display', size: 32, color: C.leaf, alpha: seg(p, 0.65, 0.85) });
          Art.moe(g, 700, 340, 110, 'think', { t, flip: true });
        },
      },
    ],
  });

  /* ---------- Bench: salt on ice ---------- */
  const KF = 1.86, KB = 0.512;
  const fp = { i: 2, m: 1, env: -5, ice: 1 };
  const FP_NAME = { 1: 'sugar', 2: 'NaCl', 3: 'CaCl₂' };
  function paintFP() {
    const dTf = fp.i * KF * fp.m, dTb = fp.i * KB * fp.m;
    Lab.$('#fp-calc').innerHTML = Lab.texString(`<div class="calc-line">$$\\Delta T_f = iK_fm = (${fp.i})\\left(1.86\\ \\tfrac{^\\circ\\text{C}}{m}\\right)(${Lab.fmt(fp.m, 1)}\\ m) = ${Lab.fmt(dTf, 2)}\\ ^\\circ\\text{C}$$</div><div class="calc-line">$$\\Delta T_b = iK_bm = (${fp.i})\\left(0.512\\ \\tfrac{^\\circ\\text{C}}{m}\\right)(${Lab.fmt(fp.m, 1)}\\ m) = ${Lab.fmt(dTb, 2)}\\ ^\\circ\\text{C}$$</div><p>This is the ideal calculation. A real $\\ce{NaCl}$ brine cannot go below about $-21\\ ^\\circ\\text{C}$, since by then the salt itself crystallizes out of solution.</p>`);
  }
  Lab.stage('#c-fp', {
    label: 'An ice block in a dish with a thermometer that marks the outside temperature and the freezing point of the solution.',
    draw(g, t, dt) {
      const dTf = fp.i * KF * fp.m, dTb = fp.i * KB * fp.m, FP = -dTf;
      const melts = fp.env > FP;
      fp.ice = clamp(fp.ice + ((melts ? -1 : 1) * (dt || 0)) / 3);
      // The dish: an ice block in brine.
      const dcx = 150, base = 410;
      Art.beaker(g, dcx, base, 256, 92, { level: 0.78, liquid: '#58B6E8', ticks: false });
      const side = lerp(26, 110, fp.ice);
      const top = base - 78 - side * 0.62;
      const ig = g.createLinearGradient(dcx - side / 2, top, dcx + side / 2, top + side);
      ig.addColorStop(0, 'rgba(235,250,255,.96)'); ig.addColorStop(1, 'rgba(150,215,245,.85)');
      g.fillStyle = ig; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      Art.round(g, dcx - side / 2, top, side, side * 0.9, Math.min(14, side * 0.2)); g.fill(); g.stroke();
      // Particle view at the surface of the ice.
      Art.zoom(g, dcx, top + 18, dcx, 136, 118, (gg, x, y, R) => {
        const iy = y + 26;
        gg.fillStyle = 'rgba(200,235,255,.28)'; gg.fillRect(x - R, iy, R * 2, R);
        gg.fillStyle = 'rgba(70,185,240,.26)'; gg.fillRect(x - R, y - R, R * 2, R + 26);
        for (let j = 0; j < 2; j++) for (let i = 0; i < 5; i++) {
          const px = x - R + 24 + i * 50 + (j % 2) * 24, py = iy + 22 + j * 44;
          Art.molecule(gg, px, py, 17, 'H2O', { rot: (i + j) % 2 ? 0.5 : -0.5, style: 'fill', atomScale: 1.28, labels: false });
        }
        const speed = melts ? 1 : 0.5;
        for (let i = 0; i < 6; i++) {
          Art.molecule(gg, x - R * 0.75 + (i % 3) * R * 0.75 + wander(i, t * speed) * 10, y - 70 + (i > 2 ? 44 : 0) + wander(i + 7, t * speed) * 8, 16, 'H2O', { rot: t * 0.6 + i, style: 'fill', atomScale: 1.28, labels: false });
        }
        const n = Math.round(fp.i * fp.m * 1.9);
        for (let i = 0; i < Math.min(n, 18); i++) {
          const u = rand(i + 2), v = rand(i + 5);
          const X = x - R * 0.82 + u * R * 1.64 + wander(i + 11, t) * 6, Y = y - 92 + v * 104 + wander(i + 15, t) * 5;
          if (fp.i === 1) sugar(gg, X, Y, 7, i);
          else if (fp.i === 2) Art.atom(gg, X, Y, i % 2 ? 9 : 12, i % 2 ? 'Na' : 'Cl', { label: false });
          else Art.atom(gg, X, Y, i % 3 === 0 ? 9 : 12, i % 3 === 0 ? 'Ca' : 'Cl', { label: false });
        }
        // Rates at the ice surface.
        const a = melts ? 1 : 0.3;
        Art.arrow(gg, x - 32, iy + 8, x - 32, iy - 42, { color: C.fire, w: 7, head: 16, alpha: a });
        Art.arrow(gg, x + 32, iy - 42, x + 32, iy + 8, { color: C.cyan, w: melts ? 3.5 : 7, head: 14, alpha: melts ? 0.65 : 1 });
      });
      // Thermometer scale, +5 down to −25 °C.
      const tx = 346, y0 = 34, y1 = 416, Yt = (T) => lerp(y0, y1, (5 - T) / 35);
      g.fillStyle = 'rgba(255,255,255,.1)'; Art.round(g, tx - 12, y0 - 8, 24, y1 - y0 + 16, 12); g.fill();
      const grd = g.createLinearGradient(0, y0, 0, y1);
      grd.addColorStop(0, C.fire); grd.addColorStop(0.2, '#FFE27A'); grd.addColorStop(1, C.cyan);
      g.fillStyle = grd; Art.round(g, tx - 6, y0, 12, y1 - y0, 6); g.fill();
      const mark = (T, label, col, align) => {
        const yy = Yt(T);
        g.strokeStyle = col; g.lineWidth = 5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(tx - 18, yy); g.lineTo(tx + 18, yy); g.stroke();
        Art.text(g, label, align === 'left' ? tx + 26 : tx - 26, yy, { size: 23, color: col, align, halo: true });
      };
      mark(0, '0 °C', '#fff', 'right');
      const fpY = FP, lowTick = Math.abs(fp.env - FP) < 2.9;
      mark(fpY, `freezes ${fmtDeg(FP, 1)}`, C.pink, 'left');
      g.save(); if (lowTick) g.translate(0, fp.env > FP ? -22 : 22);
      Art.text(g, `air ${fmtDeg(fp.env)}`, tx + 26, Yt(fp.env), { size: 23, color: C.cyan, align: 'left', halo: true });
      g.restore();
      g.strokeStyle = C.cyan; g.lineWidth = 5; g.beginPath(); g.moveTo(tx - 18, Yt(fp.env)); g.lineTo(tx + 18, Yt(fp.env)); g.stroke();
      // Right side: result.
      const rx = 660;
      Art.text(g, `${FP_NAME[fp.i]}: ${fp.i} particle${fp.i > 1 ? 's' : ''} each`, rx, 40, { size: 25 });
      Art.text(g, `freezes at`, rx, 92, { size: 24, color: C.dim });
      Art.text(g, fmtDeg(FP, 1), rx, 132, { font: 'display', size: 50, color: C.pink });
      Art.text(g, `boils at`, rx, 192, { size: 24, color: C.dim });
      Art.text(g, `${Lab.fmt(100 + dTb, 2)} °C`, rx, 230, { font: 'display', size: 40, color: C.fire });
      Art.pill(g, melts ? 'The ice melts' : 'The ice stays frozen', rx, 306, { size: 28, font: 'display', color: melts ? C.leaf : C.cyan, text: '#1A0F2E' });
      Art.text(g, melts ? 'air is warmer than the' : 'air is colder than the', rx, 356, { size: 23 });
      Art.text(g, 'solution\'s freezing point', rx, 386, { size: 23 });
    },
  });
  Lab.segmented('#fp-sub', (v) => { fp.i = +v; paintFP(); });
  Lab.bind('#fp-m', '#fp-m-out', (v) => `${Lab.fmt(v, 1)} m`, (v) => { fp.m = v; paintFP(); });
  Lab.bind('#fp-env', '#fp-env-out', (v) => fmtDeg(v), (v) => { fp.env = v; });

  /* ---------- Bench: osmosis U-tube ---------- */
  const os = { M: 0.3, P: 0, level: 0, T: 298 };
  const piOf = (M) => M * R_GAS * os.T;
  function paintOsmo() {
    const Pi = piOf(os.M), net = Pi - os.P;
    Lab.$('#os-Pi').textContent = `${Lab.fmt(Pi, 2)} atm`;
    const d = Math.abs(net) < 0.2 ? 'No net flow' : net > 0 ? 'Into the solution' : 'Out of the solution (reverse osmosis)';
    Lab.$('#os-dir').textContent = d;
    Lab.$('#os-calc').innerHTML = Lab.texString(`<div class="calc-line">$$\\Pi = iMRT = (1)\\left(${Lab.fmt(os.M, 2)}\\ \\tfrac{\\text{mol}}{\\text{L}}\\right)\\left(0.08206\\ \\tfrac{\\text{L atm}}{\\text{mol K}}\\right)(298\\text{ K}) = ${Lab.fmt(Pi, 2)}\\text{ atm}$$</div><p>Height changes are drawn on a compressed scale: 1 atm would really hold up about 10 m of water. Push harder than $\\Pi$ and you force water backward. That is <b>reverse osmosis</b>, which is how ships and desert cities purify seawater.</p>`);
  }
  Lab.stage('#c-osmo', {
    label: 'A U-shaped tube with pure water on the left and a sugar solution on the right, split by a membrane at the bottom. A magnifier shows water passing through while sugar is blocked.',
    draw(g, t, dt) {
      const Pi = piOf(os.M), net = Pi - os.P;
      const target = clamp(net / 25, -1, 1) * 92;
      os.level = lerp(os.level, target, clamp((dt || 0.03) * 0.7));
      const lvl = os.level;
      const lx = 124, rx = 356, aw = 110, top = 40, floorY = 410, tubeH = 84;
      const baseY = 214;
      const ly = baseY + lvl, ry = baseY - lvl;
      const memX = (lx + rx) / 2;
      // Liquid.
      const leftCol = '#4BA8DC', rightCol = '#4BA8DC';
      g.fillStyle = leftCol;
      g.fillRect(lx - aw / 2, ly, aw, floorY - ly);
      g.fillRect(lx - aw / 2, floorY - tubeH, memX - lx + aw / 2, tubeH);
      g.fillStyle = rightCol;
      g.fillRect(rx - aw / 2, ry, aw, floorY - ry);
      g.fillRect(memX, floorY - tubeH, rx + aw / 2 - memX, tubeH);
      // Sugar only on the right.
      const nS = Math.round(os.M * 22);
      for (let i = 0; i < nS; i++) {
        const u = rand(i + 2), inArm = i % 3 !== 0;
        const X = inArm ? rx - aw / 2 + 18 + u * (aw - 36) : memX + 22 + u * (rx + aw / 2 - memX - 40);
        const Y = inArm ? lerp(ry + 18, floorY - 22, rand(i + 7)) : floorY - tubeH + 22 + rand(i + 7) * (tubeH - 44);
        sugar(g, X + wander(i, t) * 5, Y + wander(i + 9, t) * 5, 8, i + t * 0.2);
      }
      // Glass.
      g.strokeStyle = C.glass; g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(lx - aw / 2, top); g.lineTo(lx - aw / 2, floorY); g.lineTo(rx + aw / 2, floorY); g.lineTo(rx + aw / 2, top);
      g.moveTo(lx + aw / 2, top); g.lineTo(lx + aw / 2, floorY - tubeH); g.lineTo(rx - aw / 2, floorY - tubeH); g.lineTo(rx - aw / 2, top);
      g.stroke();
      // The membrane.
      g.save(); g.strokeStyle = C.pink; g.lineWidth = 7; g.setLineDash([9, 6]);
      g.beginPath(); g.moveTo(memX, floorY - tubeH + 3); g.lineTo(memX, floorY - 3); g.stroke(); g.restore();
      // Start marker.
      g.save(); g.setLineDash([5, 7]); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(lx - aw / 2 - 12, baseY); g.lineTo(rx + aw / 2 + 12, baseY); g.stroke(); g.restore();
      Art.text(g, 'pure water', lx, ly - 22, { size: 22, color: '#D4F1FF', halo: true });
      if (os.P < 0.1) Art.text(g, 'sugar water', rx, ry - 22, { size: 22, color: '#FFE3C7', halo: true });
      // Piston.
      if (os.P >= 0.1) {
        g.fillStyle = '#B8B2CF'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
        Art.round(g, rx - aw / 2 + 3, ry - 16, aw - 6, 16, 4); g.fill(); g.stroke();
        g.fillStyle = '#9A94B3'; g.fillRect(rx - 7, 6, 14, Math.max(0, ry - 22)); g.strokeRect(rx - 7, 6, 14, Math.max(0, ry - 22));
        Art.arrow(g, rx + 34, ry - 62, rx + 34, ry - 22, { color: C.red, w: 6, head: 15 });
      }
      // Net flow.
      if (Math.abs(net) > 0.2) {
        const ax = net > 0 ? memX - 34 : memX + 34, bx = net > 0 ? memX + 34 : memX - 34;
        Art.arrow(g, ax, floorY + 20, bx, floorY + 20, { color: C.leaf, w: 7, head: 17 });
      }
      // Membrane close-up.
      const zx = 640, zy = 148, zr = 128;
      Art.zoom(g, memX, floorY - tubeH / 2, zx, zy, zr, (gg, x, y, RR) => {
        gg.fillStyle = 'rgba(70,185,240,.32)'; gg.fillRect(x - RR, y - RR, RR * 2, RR * 2);
        const toRight = clamp(0.5 + net / 12, 0.12, 0.88);
        const n = 8;
        for (let i = 0; i < n; i++) {
          const dir = (i + 0.5) / n < toRight ? 1 : -1;
          const ph = (t * 0.28 + rand(i + 3)) % 1;
          const X = x + dir * lerp(-RR * 0.95, RR * 0.95, ph), Y = y - RR * 0.75 + (i / (n - 1)) * RR * 1.5;
          Art.molecule(gg, X, Y, 22, 'H2O', { rot: t * 0.5 + i, style: 'fill', atomScale: 1.28, labels: false });
        }
        const nZ = Math.round(os.M * 8);
        for (let i = 0; i < nZ; i++) {
          const yy = y - RR * 0.7 + (i / Math.max(1, nZ - 1)) * RR * 1.4;
          const xx = x + 34 + Math.abs(Math.sin(t * 1.2 + i * 1.7)) * (RR * 0.62);
          sugar(gg, xx, yy, 12, t * 0.4 + i);
        }
        gg.fillStyle = 'rgba(255,79,163,.86)';
        for (let j = -5; j <= 5; j++) gg.fillRect(x - 4, y + j * 28 - 10, 8, 20);
      }, { rim: C.pink });
      Art.text(g, 'water passes,', zx - 8, 304, { size: 24, color: '#D4F1FF' });
      Art.text(g, 'sugar is blocked', zx - 8, 334, { size: 24, color: C.sun });
      const label = Math.abs(net) < 0.2 ? 'Balanced' : net > 0 ? 'Water moves right' : 'Water moves left';
      Art.pill(g, label, zx - 6, 390, { size: 27, font: 'display', color: Math.abs(net) < 0.2 ? C.sun : net > 0 ? C.leaf : C.red, text: '#1A0F2E' });
    },
  });
  Lab.bind('#os-M', '#os-M-out', (v) => `${Lab.fmt(v, 2)} M`, (v) => { os.M = v; paintOsmo(); });
  Lab.bind('#os-P', '#os-P-out', (v) => `${Lab.fmt(v, 1)} atm`, (v) => { os.P = v; paintOsmo(); });

  /* ---------- Story: cells in solutions ---------- */
  function cell(g, cx, cy, rx, ry, wob, t, spikes) {
    const gr = g.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 6, cx, cy, Math.max(rx, ry));
    gr.addColorStop(0, '#FF9AA8'); gr.addColorStop(1, '#C8324C');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath();
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const r = 1 + wob * Math.sin(a * (spikes || 3) + t * 0.8);
      const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r;
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(120,20,40,.35)'; g.beginPath(); g.ellipse(cx, cy, rx * 0.42, ry * 0.42, 0, 0, TAU); g.fill();
  }
  function cellScene(g, p, t, o) {
    const cx = 290, cy = 225;
    g.fillStyle = 'rgba(70,185,240,.16)'; Art.round(g, 26, 26, 530, 398, 24); g.fill();
    const q = ease.inOut(seg(p, 0.12, 0.92));
    const rx = lerp(120, o.rx, q), ry = lerp(92, o.ry, q);
    cell(g, cx, cy, rx, ry, lerp(0, o.wob, q), t, 7);
    // Solute dots outside and inside.
    for (let i = 0; i < o.out; i++) {
      const a = rand(i + 1) * TAU, d = 190 + rand(i + 3) * 60;
      const X = clamp(cx + Math.cos(a) * d + wander(i, t) * 5, 44, 538), Y = clamp(cy + Math.sin(a) * d * 0.85 + wander(i + 3, t) * 5, 44, 406);
      sugar(g, X, Y, 8, i + t * 0.2);
    }
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.5; sugar(g, cx + Math.cos(a) * rx * 0.55, cy + Math.sin(a) * ry * 0.55, 8, i); }
    // Water arrows.
    const a = seg(p, 0.05, 0.3);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * TAU + 0.5, cos = Math.cos(ang), sin = Math.sin(ang);
      const near = [cx + cos * (rx * 1.04), cy + sin * (ry * 1.04)], far = [cx + cos * (rx * 1.04 + 52), cy + sin * (ry * 1.04 + 52)];
      if (o.dir > 0) Art.arrow(g, far[0], far[1], near[0], near[1], { color: C.water, w: 6, head: 15, alpha: a });
      else if (o.dir < 0) Art.arrow(g, near[0], near[1], far[0], far[1], { color: C.water, w: 6, head: 15, alpha: a });
    }
    if (o.dir === 0) {
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * TAU + 0.8, cos = Math.cos(ang), sin = Math.sin(ang);
        Art.arrow(g, cx + cos * (rx + 8), cy + sin * (ry + 8), cx + cos * (rx + 56), cy + sin * (ry + 56), { color: C.water, w: 5, head: 13, both: true, alpha: a });
      }
    }
    const x = 678;
    Art.text(g, o.name, x, 96, { font: 'display', size: 36, color: o.col, alpha: seg(p, 0.1, 0.3) });
    Art.text(g, o.l1, x, 160, { size: 25, alpha: seg(p, 0.25, 0.45) });
    Art.text(g, o.l2, x, 192, { size: 25, alpha: seg(p, 0.25, 0.45) });
    Art.pill(g, o.res, x, 262, { size: 28, font: 'display', color: o.col, text: '#1A0F2E', alpha: seg(p, 0.75, 0.92) });
  }
  Lab.story('#story-cells', {
    title: 'What osmosis does to a living cell',
    scenes: [
      {
        say: 'A cell\'s outer membrane is semipermeable. In an <b>isotonic</b> solution, the solute level matches the inside of the cell. Water moves both ways equally, so the cell keeps its shape. IV saline is made this way.',
        dur: 3,
        draw(g, p, t) { cellScene(g, p, t, { rx: 120, ry: 92, wob: 0, dir: 0, out: 14, name: 'Isotonic', col: C.leaf, l1: 'Same solute', l2: 'inside and out', res: 'No change' }); },
      },
      {
        say: 'In a <b>hypotonic</b> solution, such as pure water, there is less solute outside. Water rushes <b>into</b> the cell, toward the higher solute level. The cell swells, and may burst.',
        dur: 3.4,
        draw(g, p, t) { cellScene(g, p, t, { rx: 154, ry: 142, wob: 0, dir: 1, out: 2, name: 'Hypotonic', col: C.cyan, l1: 'Less solute', l2: 'outside', res: 'It swells' }); },
      },
      {
        say: 'In a <b>hypertonic</b> solution, such as very salty water, there is more solute outside. Water leaves the cell, and it shrivels. That is why drinking seawater makes you more thirsty, not less.',
        dur: 3.4,
        draw(g, p, t) { cellScene(g, p, t, { rx: 84, ry: 64, wob: 0.13, dir: -1, out: 34, name: 'Hypertonic', col: C.fire, l1: 'More solute', l2: 'outside', res: 'It shrivels' }); },
      },
    ],
  });

  paintFP();
  paintOsmo();
});
