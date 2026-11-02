/* Lesson 5.2: Solubility rules. Every verdict on this page comes from window.Solubility in the bank file. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C, S = window.Solubility, TAU = Math.PI * 2;
  const WATER = '#B4E6FA';
  const STATUS_WORD = { soluble: 'Dissolves', slight: 'Borderline', insoluble: 'Stays solid' };

  /** Art.formula with a fade, white by default. */
  function F(g, f, x, y, o = {}) {
    const a = o.alpha === undefined ? 1 : o.alpha;
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    Art.formula(g, f, x, y, Object.assign({ color: '#fff' }, o));
    g.restore();
  }

  /* ---------- Particles ---------- */
  function water(g, x, y, s, rot, o = {}) {
    Art.molecule(g, x, y, s, 'H2O', Object.assign({ rot, style: 'fill', atomScale: 1.28, labels: false }, o));
  }
  const pointO = (x, y, tx, ty) => Math.atan2(ty - y, tx - x) + Math.PI / 2;
  const pointH = (x, y, tx, ty) => Math.atan2(ty - y, tx - x) - Math.PI / 2;

  /** An ion in its shell of water: oxygen ends face a cation, hydrogen ends face an anion. q draws the shell in. */
  function hydrated(g, x, y, r, id, t, o = {}) {
    const ion = S.ion(id), R = r * (ion.size || 1);
    const n = o.n || 6, s = o.s || 17, rr = R + s * 1.06, q = o.q === undefined ? 1 : o.q;
    if (q > 0) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + t * 0.18 + (o.seed || 0);
        const d = lerp(rr + 46, rr, ease.out(q)) + wander(i + (o.seed || 0), t) * 1.6;
        const wx = x + Math.cos(a) * d, wy = y + Math.sin(a) * d;
        water(g, wx, wy, s, (ion.z > 0 ? pointO : pointH)(wx, wy, x, y), { alpha: q });
      }
    }
    S.drawIon(g, x, y, r, id, { face: o.face, t, seed: o.seed, look: o.look, rot: t * 0.25 });
  }

  /** A block of ions in the right ratio. Returns nothing; (cx, cy) is the block center. */
  function crystal(g, cx, cy, cols, rows, d, r, c, a, o = {}) {
    const { nc, na } = S.units(c, a);
    const seq = [];
    for (let i = 0; i < nc; i++) seq.push(c);
    for (let i = 0; i < na; i++) seq.push(a);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        if (o.skip && o.skip(i, j)) continue;
        const k = (i + j * (seq.length === 2 ? 1 : 2)) % seq.length;
        const shake = o.shake === undefined ? 1.6 : o.shake;
        const x = cx + (i - (cols - 1) / 2) * d + wander(i * 3 + j + 2, o.t || 0) * shake;
        const y = cy + (j - (rows - 1) / 2) * d + wander(i + j * 5 + 7, o.t || 0) * shake;
        S.drawIon(g, x, y, r, seq[k], { face: o.face && o.face(i, j), t: o.t, seed: i + j, look: o.look, label: o.label });
      }
    }
  }

  /* ---------- A beaker that a compound is dropped into. Used by the story, the grid and the game. ---------- */
  function mound(g, x0, x1, y, h, color) {
    if (h <= 0) return;
    const cx = (x0 + x1) / 2;
    const gr = g.createLinearGradient(0, y - h, 0, y);
    gr.addColorStop(0, Art.mix(color, '#ffffff', 0.22)); gr.addColorStop(1, Art.mix(color, '#1A0F2E', 0.22));
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x0, y);
    g.bezierCurveTo(x0 + (cx - x0) * 0.4, y - h * 0.5, cx - (x1 - x0) * 0.2, y - h * 1.1, cx, y - h);
    g.bezierCurveTo(cx + (x1 - x0) * 0.2, y - h * 1.1, x1 - (x1 - cx) * 0.4, y - h * 0.5, x1, y);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(26,15,46,.45)'; g.lineWidth = 2; g.stroke();
    // A few speckles give it the look of powder.
    for (let i = 0; i < 24; i++) {
      const u = rand(i + 31), v = rand(i + 77);
      const px = lerp(x0 + 10, x1 - 10, u), top = h * (1 - Math.pow(Math.abs(u - 0.5) * 2, 2));
      g.fillStyle = i % 2 ? 'rgba(26,15,46,.2)' : 'rgba(255,255,255,.4)';
      g.fillRect(px, y - 3 - v * top * 0.82, 2.4, 2.4);
    }
  }
  /**
   * Draw the whole drop-and-see event.
   * info: a Solubility.isSoluble result. p: 0..1 through the event. size: mound size multiplier.
   */
  function dropBeaker(g, cx, baseY, w, h, info, p, t, o = {}) {
    const fall = seg(p, 0, 0.26), act = seg(p, 0.2, 0.86);
    const level = o.level || 0.74;
    const dissolving = info.soluble;
    const tint = dissolving && info.solutionColor ? Art.mix(WATER, info.solutionColor, ease.inOut(act)) : WATER;
    const grainColor = info.color || '#F4F2EC';
    const surface = baseY - (h - 12) * level;
    // Powder on its way in.
    if (fall > 0 && fall < 1) {
      for (let i = 0; i < 26; i++) {
        const u = clamp((fall - rand(i + 3) * 0.5) * 2);
        if (u <= 0 || u >= 1) continue;
        const px = cx + (rand(i + 9) - 0.5) * w * 0.32;
        g.fillStyle = grainColor;
        g.fillRect(px, lerp(baseY - h - 34, surface + 4, u * u), 3.6, 3.6);
      }
    }
    const box = Art.beaker(g, cx, baseY, w, h, {
      level, liquid: tint, ticks: false,
      inside(gg, b) {
        if (dissolving) {
          // Grains swirl, shrink and vanish.
          for (let i = 0; i < 30; i++) {
            const life = 1 - clamp((act - rand(i + 13) * 0.55) * 2.2);
            if (life <= 0 || act <= 0) continue;
            const a = rand(i + 5) * TAU + t * (0.7 + rand(i) * 0.6);
            const rr = (0.18 + rand(i + 21) * 0.74) * (b.x1 - b.x0) * 0.46;
            const px = cx + Math.cos(a) * rr, py = lerp(b.top + 16, b.bottom - 12, rand(i + 41) * 0.5 + act * 0.4) + Math.sin(a) * 8;
            gg.fillStyle = Art.alpha('#FFFFFF', 0.85 * life);
            gg.fillRect(px, py, 3.4 * life + 0.8, 3.4 * life + 0.8);
          }
        } else {
          const cloud = Math.sin(clamp((act - 0.02) * 1.1) * Math.PI);
          if (cloud > 0) {
            gg.fillStyle = Art.alpha(grainColor, 0.3 * cloud);
            gg.fillRect(b.x0, b.top, b.x1 - b.x0, b.bottom - b.top);
          }
          const amount = (info.slight ? 0.55 : 1) * (o.size || 1);
          for (let i = 0; i < 46; i++) {
            const start = rand(i + 61) * 0.62;
            const u = clamp((act - start) / 0.38);
            if (u <= 0 || u >= 1) continue;
            const px = lerp(b.x0 + 12, b.x1 - 12, rand(i + 29)) + Math.sin(t * 3 + i) * 2;
            gg.fillStyle = grainColor;
            gg.beginPath(); gg.arc(px, lerp(b.top + 8, b.bottom - 8, ease.in(u)), 2.6, 0, TAU); gg.fill();
          }
          mound(gg, b.x0 + 6, b.x1 - 6, b.bottom - 1, (b.bottom - b.top) * 0.28 * amount * ease.out(seg(act, 0.34, 1)), grainColor);
        }
      },
    });
    return box;
  }

  /* The particle view for any compound. */
  const FREE_SPOTS = {
    2: [[-0.42, -0.18], [0.42, 0.2]],
    3: [[-0.5, -0.2], [0.44, -0.34], [0.05, 0.46]],
    4: [[-0.46, -0.42], [0.46, -0.4], [-0.44, 0.42], [0.46, 0.44]],
    5: [[-0.5, -0.44], [0.5, -0.44], [0, 0], [-0.5, 0.46], [0.5, 0.46]],
  };
  function ionView(g, cx, cy, R, info, p, t) {
    const { nc, na } = S.units(info.cation, info.anion);
    const q = ease.out(seg(p, 0.25, 0.9));
    if (info.soluble) {
      const ids = [];
      const k = nc + na <= 2 ? 2 : 1;
      for (let i = 0; i < nc * k; i++) ids.push(info.cation.id);
      for (let i = 0; i < na * k; i++) ids.push(info.anion.id);
      const spots = FREE_SPOTS[ids.length] || FREE_SPOTS[5];
      const big = ids.length <= 4;
      // Order so that cations and anions alternate around the view.
      const ordered = ids.length === 4 && nc === na ? [ids[0], ids[2], ids[3], ids[1]] : ids;
      ordered.forEach((id, i) => {
        const [fx, fy] = spots[i];
        const x = cx + fx * R + wander(i * 2 + 1, t * 0.8) * 7, y = cy + fy * R + wander(i * 2 + 12, t * 0.8) * 7;
        const start = cx + (fx * 0.3) * R, startY = cy + R * 0.55;
        hydrated(g, lerp(start, x, q), lerp(startY, y, q), big ? 20 : 17, id, t, { q, n: big ? 6 : 5, s: big ? 15 : 13, seed: i * 1.7, face: i === 0 && !S.ion(id).poly ? 'happy' : null });
      });
    } else {
      const r = 21, d = 47;
      const c = info.cation, a = info.anion;
      const down = lerp(-40, 0, q);
      const rows = info.slight ? 2 : 3;
      crystal(g, cx, cy + R * (info.slight ? 0.56 : 0.38) + down, 6, rows, d, r, c, a, {
        t, shake: 0.9,
        face: (i, j) => (j === 0 && (i === 2 || i === 3) ? (info.slight ? 'sleepy' : 'grumpy') : null),
        look: [0, -1],
      });
      // A few ions always get away, even from an "insoluble" solid.
      const free = info.slight ? 3 : 1;
      for (let i = 0; i < free; i++) {
        const id = i % 2 ? a.id : c.id;
        const x = cx + (i === 0 ? -0.34 : i === 1 ? 0.42 : 0.02) * R + wander(i + 3, t) * 8;
        const y = cy - R * (info.slight ? 0.34 : 0.56) + (i === 2 ? 28 : 0) + wander(i + 21, t) * 6;
        hydrated(g, x, y, 17, id, t, { q: seg(p, 0.5, 1), n: 5, s: 12, seed: i });
      }
    }
  }

  /* ---------- The tug of war picture ----------
     d runs from -1 (water wins, the ion is pulled out) to 1 (the crystal wins). A pure function of d and t. */
  const TUG = {
    NaCl: { c: 'Na', a: 'Cl', pull: 0.74, grip: 0.62, win: -1, say: 'Sodium and chloride have small charges, and water grabs both happily. <b>Water wins.</b> Salt dissolves, up to about 6 M.' },
    KNO3: { c: 'K', a: 'NO3', pull: 0.66, grip: 0.46, win: -1, say: 'A big $\\ce{K+}$ and a big $\\ce{NO3-}$ each carry a charge of only 1. The crystal has a weak grip. <b>Water wins.</b>' },
    CuSO4: { c: 'Cu', a: 'SO4', pull: 0.86, grip: 0.76, win: -1, say: 'Both ions have a charge of 2, so the crystal grips hard. But water grabs tiny $\\ce{Cu^2+}$ even harder. <b>Water wins</b>, and the blue you see is hydrated copper ions.' },
    AgCl: { c: 'Ag', a: 'Cl', pull: 0.56, grip: 0.82, win: 1, say: 'Same charges as NaCl, yet the bond between silver and chloride is unusually strong, with some shared electrons in it. <b>The crystal wins.</b>' },
    CaCO3: { c: 'Ca', a: 'CO3', pull: 0.62, grip: 0.86, win: 1, say: 'Charges of 2+ and 2− attract about four times as hard as 1+ and 1−, and water cannot keep up. <b>The crystal wins.</b> That is why seashells last.' },
    BaSO4: { c: 'Ba', a: 'SO4', pull: 0.58, grip: 0.88, win: 1, say: 'Also 2+ and 2−, but barium is big, so water grips it weakly. <b>The crystal wins.</b> Compare it with $\\ce{CuSO4}$, which has the same charges and the opposite result. Size matters too.' },
  };
  function rope(g, x0, x1, y, t, tight) {
    const N = 26, wob = (1 - tight) * 6;
    g.save(); g.lineCap = 'round';
    const path = () => { g.beginPath(); for (let i = 0; i <= N; i++) { const u = i / N, x = lerp(x0, x1, u), yy = y + Math.sin(u * Math.PI) * (6 + wob) + Math.sin(t * 7 + u * 12) * wob * 0.4; if (i) g.lineTo(x, yy); else g.moveTo(x, yy); } };
    path(); g.strokeStyle = '#3A2A1A'; g.lineWidth = 11; g.stroke();
    path(); g.strokeStyle = '#D7B27A'; g.lineWidth = 7; g.stroke();
    path(); g.strokeStyle = '#A97F4A'; g.lineWidth = 7; g.setLineDash([3, 9]); g.stroke(); g.setLineDash([]);
    g.restore();
  }
  function tugPicture(g, d, t, o) {
    const c = o.c, a = o.a, y = 248;
    const home = 628;
    const ionX = d < 0 ? lerp(556, 268, -d) : lerp(556, home, d);
    const r = 31;
    // The crystal, with a gap where our ion sits.
    const gapped = (i, j) => i === 0 && j === 2;
    crystal(g, 684, y, 3, 5, 48, 20, c, a, { t, skip: gapped, shake: 1.2, face: (i, j) => (i === 1 && j === 2 ? (d > 0.4 ? 'grin' : d < -0.4 ? 'sad' : 'grumpy') : null), look: [-1, 0] });
    // Electric grip from the crystal to the ion: it snaps when the ion gets away.
    const gripAlpha = clamp(1 - (home - ionX) / 150);
    if (gripAlpha > 0) {
      [[636, y - 48], [636, y + 48], [684, y]].forEach(([tx, ty], i) => {
        g.save();
        g.strokeStyle = Art.alpha(C.sun, 0.9 * gripAlpha); g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath();
        const steps = 7;
        for (let k = 0; k <= steps; k++) {
          const u = k / steps, nx = -(ty - y), ny = tx - ionX, len = Math.hypot(nx, ny) || 1;
          const jag = k === 0 || k === steps ? 0 : Math.sin(k * 2.4 + t * 18 + i) * 6;
          const px = lerp(ionX, tx, u) + (nx / len) * jag, py = lerp(y, ty, u) + (ny / len) * jag;
          if (k) g.lineTo(px, py); else g.moveTo(px, py);
        }
        g.stroke(); g.restore();
      });
    }
    // Water team hauling on the rope.
    const lean = d < 0 ? 1 : -d;
    const X = [ionX - 112, ionX - 186, ionX - 260];
    const tight = clamp(1 - Math.abs(d) * 0.3);
    rope(g, X[2] - 18, ionX, y + 10, t, tight);
    X.forEach((x, i) => {
      const yy = y + 2 + Math.sin(t * 5 + i * 1.4) * 2.5;
      const rot = pointO(x, yy, ionX, y) - lean * 0.22;
      water(g, x, yy, 42, rot, { face: d < -0.3 ? 'grin' : d > 0.3 ? 'sad' : 'grumpy', look: [1, 0], t, seed: i });
    });
    S.drawIon(g, ionX, y, r, c, { scaled: false, face: d < -0.3 ? 'wow' : d > 0.3 ? 'sleepy' : 'grumpy', look: [-1, 0], t, rot: t * 0.3 });
    // The two scoreboards.
    const showBars = o.bars !== false;
    if (showBars) {
      Art.text(g, "Water's pull", 40, 40, { size: 28, color: C.cyan, align: 'left', font: 'display' });
      Art.meter(g, 40, 62, 290, 20, o.pull * (o.barP === undefined ? 1 : o.barP), { color: C.cyan });
      Art.text(g, "Crystal's grip", 760, 40, { size: 28, color: C.sun, align: 'right', font: 'display' });
      g.save(); g.translate(760, 0); g.scale(-1, 1); Art.meter(g, 0, 62, 290, 20, o.grip * (o.barP === undefined ? 1 : o.barP), { color: C.sun }); g.restore();
    }
  }

  /* ---------- Story 1: the tug of war ---------- */
  Lab.story('#story-tug', {
    title: 'Two pulls on every ion',
    scenes: [
      {
        say: 'Stir table salt into water and it seems to vanish. It has not. Zoom in and you find a <b>crystal</b> of $\\ce{Na+}$ and $\\ce{Cl-}$ ions packed together.',
        dur: 3.4,
        draw(g, p, t) {
          const info = S.isSoluble('Na', 'Cl');
          dropBeaker(g, 176, 392, 244, 262, info, Math.min(p * 0.45, 0.3), t, {});
          Art.text(g, 'salt water', 176, 424, { size: 26 });
          Art.zoom(g, 196, 296, 556, 218, 186, (gg, cx, cy, R) => {
            crystal(gg, cx - 28, cy + 66, 6, 4, 54, 25, 'Na', 'Cl', { t, face: (i, j) => (j === 1 && i === 2 ? 'happy' : j === 1 && i === 3 ? 'happy' : null), look: [0, -1] });
            for (let i = 0; i < 5; i++) {
              const x = cx + [-120, -40, 44, 118, 60][i] + wander(i, t) * 10, y = cy + [-118, -136, -112, -66, -56][i] + wander(i + 9, t) * 8;
              water(gg, x, y, 26, t * 0.4 + i * 1.3);
            }
            void R;
          }, { p: seg(p, 0.3, 0.62) });
          Art.text(g, 'ions in a crystal', 556, 424, { size: 27, color: C.cyan, alpha: seg(p, 0.62, 0.8) });
        },
      },
      {
        say: 'Water is lopsided. Its oxygen end is <b>slightly negative</b> and its hydrogen end is <b>slightly positive</b>. So each water molecule works like a tiny magnet.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          const a = ease.back(seg(p, 0.02, 0.26));
          const cx = W / 2, cy = 112;
          if (a > 0) {
            g.save(); g.translate(cx, cy); g.scale(a, a);
            Art.molecule(g, 0, 0, 96, 'H2O', { style: 'ball', face: 'happy', look: [0, 0], t, labels: true, atomScale: 1.18 });
            g.restore();
          }
          Art.text(g, 'slightly negative', cx + 236, cy - 54, { size: 28, color: '#6CC8FF', alpha: seg(p, 0.2, 0.36) });
          Art.arrow(g, cx + 122, cy - 50, cx + 56, cy - 30, { color: '#6CC8FF', w: 5, p: seg(p, 0.24, 0.4) });
          Art.text(g, 'slightly positive', cx - 240, cy + 58, { size: 28, color: '#FF8AC0', alpha: seg(p, 0.3, 0.46) });
          Art.arrow(g, cx - 130, cy + 54, cx - 92, cy + 42, { color: '#FF8AC0', w: 5, p: seg(p, 0.34, 0.5) });
          // Two demonstrations: oxygen toward a cation, hydrogen toward an anion.
          const b = seg(p, 0.5, 0.74);
          if (b > 0) {
            const ax = 216, bx = 584, y = 300;
            g.save(); g.globalAlpha *= b;
            for (let i = 0; i < 6; i++) {
              const ang = (i / 6) * TAU + t * 0.25;
              const d1 = lerp(100, 64, ease.out(b)), wx = ax + Math.cos(ang) * d1, wy = y + Math.sin(ang) * d1;
              water(g, wx, wy, 25, pointO(wx, wy, ax, y));
              const d2 = lerp(112, 74, ease.out(b)), vx = bx + Math.cos(ang + 0.4) * d2, vy = y + Math.sin(ang + 0.4) * d2;
              water(g, vx, vy, 25, pointH(vx, vy, bx, y));
            }
            S.drawIon(g, ax, y, 28, 'Na', { face: 'happy', t });
            S.drawIon(g, bx, y, 32, 'Cl', { scaled: false, face: 'happy', t });
            g.restore();
          }
          Art.text(g, 'oxygen ends face a cation', 216, 416, { size: 26, alpha: seg(p, 0.72, 0.86), color: '#6CC8FF' });
          Art.text(g, 'hydrogen ends face an anion', 584, 416, { size: 26, alpha: seg(p, 0.76, 0.9), color: '#FF8AC0' });
        },
      },
      {
        say: 'So an ion on the crystal edge feels two pulls. Water tugs it out, and the crystal holds it in. Water\'s pull is called <b>hydration</b>. The crystal\'s grip is the <b>lattice</b> attraction.',
        dur: 3.2,
        draw(g, p, t) {
          const wob = Math.sin(t * 3.4) * 0.07;
          tugPicture(g, wob, t, Object.assign({}, TUG.NaCl, { barP: ease.out(seg(p, 0.15, 0.6)), pull: 0.7, grip: 0.7 }));
          Art.text(g, 'The pull is called hydration', 176, 112, { size: 24, color: C.cyan, alpha: seg(p, 0.45, 0.7) });
          Art.text(g, 'This hold is the lattice', 624, 112, { size: 24, color: C.sun, alpha: seg(p, 0.55, 0.8) });
          Art.text(g, 'Both pull on the same ion', 440, 410, { size: 30, alpha: seg(p, 0.7, 0.9), font: 'display' });
          Art.moe(g, 112, 436, 136, 'point', { t });
        },
      },
      {
        say: 'For $\\ce{NaCl}$, <b>water wins</b>. Ions slip out one at a time, each wrapped in a shell of water. We write this as $\\ce{Na+(aq)}$ and $\\ce{Cl-(aq)}$. The compound is <b>soluble</b>.',
        dur: 3.8,
        draw(g, p, t) {
          const d = -ease.inOut(seg(p, 0.08, 0.5));
          if (p < 0.6) {
            tugPicture(g, d, t, TUG.NaCl);
            Art.text(g, 'Water wins', 400, 404, { font: 'display', size: 38, color: C.leaf, alpha: seg(p, 0.38, 0.5) });
          } else {
            const q = ease.out(seg(p, 0.6, 0.85));
            g.save(); g.globalAlpha *= q;
            hydrated(g, 210, 180, 44, 'Na', t, { q: 1, n: 8, s: 34, face: 'grin', seed: 1 });
            hydrated(g, 590, 180, 40, 'Cl', t, { q: 1, n: 8, s: 34, face: 'grin', seed: 3 });
            g.restore();
            F(g, 'Na^+(aq)', 210, 356, { size: 38, alpha: q });
            F(g, 'Cl^-(aq)', 590, 356, { size: 38, alpha: q });
            Art.text(g, 'aq means surrounded by water', 400, 416, { size: 28, color: C.cyan, alpha: seg(p, 0.75, 0.95) });
          }
        },
      },
      {
        say: 'For $\\ce{AgCl}$, the <b>crystal wins</b>. Water tugs, but the ions hold on. The white solid just sits there. The compound is <b>insoluble</b>.',
        dur: 3.4,
        draw(g, p, t) {
          const d = ease.inOut(seg(p, 0.12, 0.5));
          tugPicture(g, d, t, TUG.AgCl);
          Art.text(g, 'The crystal wins', 430, 410, { font: 'display', size: 38, color: C.red, alpha: seg(p, 0.42, 0.56) });
          Art.moe(g, 118, 436, 136, 'oops', { t });
        },
      },
      {
        say: 'See the difference in the beaker. Soluble compounds give a clear solution of separate ions. Insoluble ones stay as a solid in clear water. Clear does not have to mean colorless: copper ions make water blue.',
        dur: 4,
        draw(g, p, t) {
          const list = [['Na', 'Cl', 138], ['Cu', 'SO4', 400], ['Ag', 'Cl', 662]];
          list.forEach(([c, a, x], i) => {
            const info = S.isSoluble(c, a);
            const q = seg(p, 0.06 + i * 0.18, 0.5 + i * 0.18);
            dropBeaker(g, x, 348, 196, 222, info, q, t);
            F(g, info.formula, x, 56, { size: 40, alpha: q });
            const qq = seg(p, 0.5 + i * 0.15, 0.68 + i * 0.15);
            Art.text(g, i === 2 ? 'stays solid' : 'dissolves', x, 390, { size: 28, font: 'display', color: i === 2 ? C.fire : C.cyan, alpha: qq });
            Art.text(g, i === 0 ? 'colorless' : i === 1 ? 'blue, still clear' : 'white solid', x, 424, { size: 24, color: C.dim, alpha: qq });
          });
        },
      },
    ],
  });

  /* ---------- Bench: tug of war ---------- */
  const tugLab = { pick: 'NaCl', t0: 0 };
  const tugStage = Lab.stage('#c-tug', {
    label: 'A tug of war between three water molecules on the left and a crystal of ions on the right, with one ion between them.',
    draw(g, t, dt, s) {
      const o = TUG[tugLab.pick];
      const e = Lab.reducedMotion ? 9 : t - tugLab.t0;
      const commit = ease.inOut(clamp((e - 1.25) / 1.1));
      const strug = Math.sin(e * 6.5) * 0.14 * (1 - commit) * clamp(e * 3);
      const d = strug + o.win * commit;
      tugPicture(g, d, t, Object.assign({}, o, { barP: ease.out(clamp(e / 1)) }));
      const done = commit >= 0.96;
      F(g, S.isSoluble(o.c, o.a).formula, 400, 142, { size: 46, halo: true });
      if (done) {
        const good = o.win < 0;
        Art.text(g, good ? 'Water wins: it dissolves' : 'The crystal wins: it stays solid', 400, 404, { font: 'display', size: 36, color: good ? C.leaf : C.red });
      } else Art.text(g, 'Pull!', 400, 404, { font: 'display', size: 36, color: C.ink, alpha: 0.8 });
      void dt; void s;
    },
  });
  const paintTug = () => { Lab.$('#tug-say').innerHTML = `<p>${Lab.texString(TUG[tugLab.pick].say)}</p>`; };
  Lab.segmented('#tug-pick', (v) => { tugLab.pick = v; tugLab.t0 = tugStage.t; paintTug(); tugStage.redraw(); });
  paintTug();

  /* ---------- Bench: how much is "insoluble"? ---------- */
  // Grams per 100 mL near room temperature, rounded: textbook handbook values.
  const RULER = [
    { f: 'BaSO4', g: 0.00024, c: 'Ba', a: 'SO4' },
    { f: 'AgCl', g: 0.00019, c: 'Ag', a: 'Cl' },
    { f: 'CaCO3', g: 0.0013, c: 'Ca', a: 'CO3' },
    { f: 'PbI2', g: 0.076, c: 'Pb', a: 'I' },
    { f: 'CaSO4', g: 0.2, c: 'Ca', a: 'SO4' },
    { f: 'Ca(OH)2', g: 0.17, c: 'Ca', a: 'OH' },
    { f: 'PbCl2', g: 0.99, c: 'Pb', a: 'Cl' },
    { f: 'KNO3', g: 32, c: 'K', a: 'NO3' },
    { f: 'NaCl', g: 36, c: 'Na', a: 'Cl' },
  ].map((o) => {
    const M = Bank.molarMass(o.f);
    return Object.assign(o, { M, s: (o.g * 10) / M, info: S.isSoluble(o.c, o.a) });
  });
  const ruler = { pick: 'AgCl', x: null, pileShown: 1, t0: 0 };
  const rulerX = (s) => lerp(46, 754, (Math.log10(s) + 6) / 8); // 10^-6 to 10^2 M
  const oneSig = (x) => Lab.sig(x, 1);
  const prettyCount = (n) => {
    const r = Number(n.toPrecision(1));
    if (r >= 1e6) return (r / 1e6) + ' million';
    return r.toLocaleString('en-US');
  };
  function paintRuler() {
    const o = RULER.find((x) => x.f === ruler.pick);
    const dis = Math.min(1, o.g);
    const places = dis >= 0.1 ? 1 : -Math.floor(Math.log10(dis));
    Lab.$('#ruler-dis').textContent = dis >= 0.99 ? 'All of it' : dis.toFixed(places) + ' g';
    Lab.$('#ruler-left').textContent = dis >= 0.99 ? 'None' : (1 - dis).toFixed(places) + ' g';
    Lab.$('#ruler-m').textContent = 'about ' + oneSig(o.s) + ' M';
    Lab.$('#ruler-w').textContent = 'about ' + prettyCount(55.5 / o.s);
  }
  const rulerStage = Lab.stage('#c-ruler', {
    h: 400, bg: 'micro', label: 'A logarithmic ruler of solubility with a line at 0.01 molar, and a beaker holding the undissolved part of one gram.',
    draw(g, t, dt) {
      const o = RULER.find((x) => x.f === ruler.pick);
      const y = 58;
      const xCut = rulerX(0.01);
      // Zones.
      g.fillStyle = 'rgba(255,138,43,.26)'; Art.round(g, 46, y - 16, xCut - 46, 32, 10); g.fill();
      g.fillStyle = 'rgba(47,214,242,.26)'; Art.round(g, xCut, y - 16, 754 - xCut, 32, 10); g.fill();
      Art.text(g, 'insoluble', (46 + xCut) / 2, y, { size: 24, color: '#FFC58F' });
      Art.text(g, 'soluble', (xCut + 754) / 2, y, { size: 24, color: '#9BEBFA' });
      for (let e = -6; e <= 2; e++) {
        const x = rulerX(Math.pow(10, e));
        g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x - 1, y + 16, 2, e % 2 === 0 ? 14 : 8);
        if (e % 2 === 0 && e !== -2) Art.text(g, e === 0 ? '1 M' : e === 2 ? '100 M' : `10${Lab.sup(e)} M`, x, y + 46, { size: 21, color: C.dim, align: e === -6 ? 'left' : e === 2 ? 'right' : 'center' });
      }
      Art.text(g, '0.01 M', xCut, y + 46, { size: 24, color: C.sun, font: 'display' });
      g.fillStyle = C.sun; g.fillRect(xCut - 2, y - 22, 4, 44);
      // Other compounds as faint dots, the chosen one as a marker.
      RULER.forEach((r) => {
        const x = rulerX(r.s);
        g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill();
      });
      const target = rulerX(o.s);
      ruler.x = ruler.x === null ? target : lerp(ruler.x, target, clamp(dt * 7));
      g.fillStyle = C.pink; g.beginPath(); g.arc(ruler.x, y, 11, 0, TAU); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
      // Beaker with whatever is left.
      const left = 1 - Math.min(1, o.g);
      ruler.pileShown = lerp(ruler.pileShown, left, clamp(dt * 5));
      const color = o.info.color || '#F4F2EC';
      const base = 370;
      Art.beaker(g, 214, base, 250, 232, {
        level: 0.78, liquid: WATER, ticks: false,
        inside(gg, b) {
          mound(gg, b.x0 + 10, b.x1 - 10, b.bottom - 1, 58 * Math.sqrt(ruler.pileShown), left > 0.0001 ? color : '#F4F2EC');
          // Dissolved ions drawn as sparkles. Rare ones are rare.
          const n = Math.round(clamp((Math.log10(o.s) + 6) / 7.2) * 34);
          for (let i = 0; i < n; i++) {
            const x = lerp(b.x0 + 12, b.x1 - 12, rand(i + 8)) + wander(i, t) * 7;
            const yy = lerp(b.top + 10, b.bottom - 60, rand(i + 40)) + wander(i + 7, t) * 7;
            gg.fillStyle = i % 2 ? '#FF7DBE' : '#7FEAFF';
            gg.beginPath(); gg.arc(x, yy, 3.8, 0, TAU); gg.fill();
          }
        },
      });
      F(g, o.f, 214, 170, { size: 38, halo: true });
      // The crowd: one formula unit among this many waters.
      const N = 55.5 / o.s;
      Art.text(g, 'One formula unit for every', 584, 136, { size: 26 });
      Art.text(g, prettyCount(N), 584, 186, { font: 'display', size: 52, color: C.sun });
      Art.text(g, 'water molecules', 584, 236, { size: 26 });
      Art.zoom(g, 340, 290, 584, 322, 66, (gg, cx, cy, R) => {
        const dots = N < 30 ? 8 : 18;
        for (let i = 0; i < dots; i++) {
          const a = rand(i + 3) * TAU, d = Math.sqrt(rand(i + 5)) * R * 0.88;
          water(gg, cx + Math.cos(a) * d + wander(i, t) * 2, cy + Math.sin(a) * d + wander(i + 3, t) * 2, 12, t * 0.3 + i);
        }
        if (N < 30) { S.drawIon(gg, cx - 18, cy - 8, 15, o.c, { charge: false, label: false }); S.drawIon(gg, cx + 18, cy + 10, 15, o.a, { charge: false, label: false }); }
      }, { p: 1, rim: C.cyan });
    },
  });
  void rulerStage;
  Lab.segmented('#ruler-pick', (v) => { ruler.pick = v; paintRuler(); });
  paintRuler();

  /* ---------- Story 2: asking in the right order ---------- */
  function stepDots(g, active) {
    const labels = ['Cation', 'Always crew', 'Halide', 'Sulfate', 'The rest'];
    const w = 150, x0 = 400 - ((labels.length - 1) * w) / 2;
    labels.forEach((l, i) => {
      const x = x0 + i * w;
      if (i < labels.length - 1) { g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x + 22, 34, w - 44, 4); }
      const on = i === active;
      g.fillStyle = on ? C.sun : i < active ? '#8F76C2' : '#4A3772';
      g.beginPath(); g.arc(x, 36, on ? 20 : 15, 0, TAU); g.fill();
      Art.text(g, String(i + 1), x, 37, { size: on ? 26 : 20, color: on ? '#22123A' : '#fff', font: 'display' });
    });
    Art.text(g, labels[active], x0 + active * w, 72, { size: 24, color: C.sun, font: 'display', align: active === 0 ? 'center' : active === 4 ? 'center' : 'center' });
  }
  /** A row of ions popping in one by one. */
  function ionRow(g, ids, x0, y, gap, r, p, o = {}) {
    ids.forEach((id, i) => {
      const q = seg(p, i * 0.08, 0.3 + i * 0.08);
      Art.popIn(g, x0 + i * gap, y, q, (gg) => S.drawIon(gg, 0, 0, r, id, { face: o.face, t: o.t, seed: i, look: o.look }));
    });
  }
  /** Compound card that slides from x0 to the beaker and drops in. */
  function card(g, f, x, y, q, o = {}) {
    if (q <= 0) return;
    g.save(); g.globalAlpha *= clamp(q * 3);
    g.font = `400 34px ${Art.FONT_DISPLAY}`;
    const w = g.measureText(f.replace(/\d/g, '')).width + f.replace(/\D/g, '').length * 15 + 34;
    g.fillStyle = o.color || '#FFFDF2'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, x - w / 2, y - 28, w, 56, 13); g.fill(); g.stroke();
    Art.formula(g, f, x, y, { size: 34, color: '#22123A' });
    g.restore();
  }
  const verdictText = (g, info, x, y, a, size = 30) => Art.text(g, STATUS_WORD[info.status], x, y, { font: 'display', size, color: info.soluble ? C.cyan : info.slight ? C.sun : C.fire, alpha: a });

  Lab.story('#story-rules', {
    title: 'Ask in this order, and stop at the first yes',
    scenes: [
      {
        say: '<b>First ask about the cation.</b> Is it group 1 or ammonium? Then stop: it dissolves. Even $\\ce{K2CO3}$ dissolves, though carbonates usually do not.',
        dur: 3.6,
        draw(g, p, t) {
          stepDots(g, 0);
          ionRow(g, ['Li', 'Na', 'K', 'NH4'], 100, 170, 92, 36, p, { face: 'grin', t, look: [0, 1] });
          Art.text(g, 'group 1 and ammonium', 238, 240, { size: 26, alpha: seg(p, 0.3, 0.45), color: C.cyan });
          const info = S.isSoluble('K', 'CO3');
          const mv = ease.inOut(seg(p, 0.38, 0.58));
          dropBeaker(g, 640, 404, 210, 232, info, seg(p, 0.55, 1), t);
          card(g, 'K2CO3', lerp(238, 640, mv), lerp(320, 132, mv), seg(p, 0.3, 0.38) * (1 - seg(p, 0.6, 0.66)));
          verdictText(g, info, 640, 130, seg(p, 0.8, 0.95), 34);
          Art.arrow(g, 370, 320, 510, 300, { color: C.leaf, w: 6, p: seg(p, 0.36, 0.5), alpha: 0.9 });
          Art.text(g, 'Yes, so stop', 238, 320, { size: 30, color: C.leaf, font: 'display', alpha: seg(p, 0.66, 0.8) });
          F(g, 'K2CO3', 238, 374, { size: 36, alpha: seg(p, 0.66, 0.8) });
          F(g, '2K^+(aq) + CO3^2-(aq)', 640, 430, { size: 25, alpha: seg(p, 0.86, 1), color: C.cyan });
        },
      },
      {
        say: '<b>Next ask about the anion.</b> Is it nitrate, acetate, chlorate or perchlorate? Then stop: it dissolves. That even rescues silver: $\\ce{AgNO3}$ is soluble.',
        dur: 3.6,
        draw(g, p, t) {
          stepDots(g, 1);
          ionRow(g, ['NO3', 'C2H3O2', 'ClO3', 'ClO4'], 74, 170, 106, 31, p, { t });
          Art.text(g, 'the always crew', 236, 248, { size: 26, alpha: seg(p, 0.3, 0.45), color: C.cyan });
          const info = S.isSoluble('Ag', 'NO3');
          const mv = ease.inOut(seg(p, 0.38, 0.58));
          dropBeaker(g, 640, 404, 210, 232, info, seg(p, 0.55, 1), t);
          card(g, 'AgNO3', lerp(236, 640, mv), lerp(320, 132, mv), seg(p, 0.3, 0.38) * (1 - seg(p, 0.6, 0.66)));
          verdictText(g, info, 640, 130, seg(p, 0.8, 0.95), 34);
          Art.text(g, 'Yes, so stop', 236, 320, { size: 30, color: C.leaf, font: 'display', alpha: seg(p, 0.66, 0.8) });
          F(g, 'AgNO3', 236, 374, { size: 36, alpha: seg(p, 0.66, 0.8) });
          F(g, 'Ag^+(aq) + NO3^-(aq)', 640, 430, { size: 25, alpha: seg(p, 0.86, 1), color: C.cyan });
          Art.arrow(g, 370, 320, 510, 300, { color: C.leaf, w: 6, p: seg(p, 0.36, 0.5), alpha: 0.9 });
        },
      },
      {
        say: '<b>Halide?</b> It dissolves, unless the cation is one of the <b>grumpy three</b>: $\\ce{Ag+}$, $\\ce{Pb^2+}$ and $\\ce{Hg2^2+}$. So $\\ce{MgCl2}$ dissolves but $\\ce{PbI2}$ falls out as a bright yellow solid.',
        dur: 4.2,
        draw(g, p, t) {
          stepDots(g, 2);
          ionRow(g, ['Cl', 'Br', 'I'], 96, 150, 84, 30, p, { t });
          Art.text(g, 'halides', 180, 214, { size: 26, color: C.leaf, alpha: seg(p, 0.2, 0.34) });
          const q = seg(p, 0.22, 0.42);
          ionRow(g, ['Ag', 'Pb', 'Hg2'], 92, 300, 92, 36, q, { face: 'grumpy', t, look: [1, 0] });
          Art.text(g, 'the grumpy three', 184, 374, { size: 28, color: C.pink, font: 'display', alpha: seg(p, 0.4, 0.5) });
          const A = S.isSoluble('Mg', 'Cl'), B = S.isSoluble('Pb', 'I');
          dropBeaker(g, 450, 400, 160, 200, A, seg(p, 0.45, 0.72), t);
          dropBeaker(g, 668, 400, 160, 200, B, seg(p, 0.6, 0.96), t);
          F(g, 'MgCl2', 450, 136, { size: 36, alpha: seg(p, 0.42, 0.5) });
          F(g, 'PbI2', 668, 136, { size: 36, alpha: seg(p, 0.56, 0.64) });
          verdictText(g, A, 450, 428, seg(p, 0.72, 0.8), 26);
          verdictText(g, B, 668, 428, seg(p, 0.92, 1), 26);
        },
      },
      {
        say: '<b>Sulfate?</b> It dissolves, unless the cation is $\\ce{Pb^2+}$ or $\\ce{Hg2^2+}$ from the grumpy three, or $\\ce{Ba^2+}$ or $\\ce{Sr^2+}$. $\\ce{Ca^2+}$ and $\\ce{Ag+}$ manage only slightly. Remember <b>CaStroBear</b>: Ca, Sr, Ba.',
        dur: 4.2,
        draw(g, p, t) {
          stepDots(g, 3);
          ionRow(g, ['SO4'], 180, 150, 80, 36, p, { t });
          Art.text(g, 'sulfate', 180, 214, { size: 26, color: C.leaf, alpha: seg(p, 0.1, 0.24) });
          const q = seg(p, 0.2, 0.42);
          ionRow(g, ['Ca', 'Sr', 'Ba'], 92, 300, 92, 36, q, { face: 'sad', t, look: [1, 0] });
          Art.text(g, 'CaStroBear', 184, 374, { size: 30, color: C.pink, font: 'display', alpha: seg(p, 0.4, 0.5) });
          const A = S.isSoluble('Cu', 'SO4'), B = S.isSoluble('Ba', 'SO4');
          dropBeaker(g, 450, 400, 160, 200, A, seg(p, 0.45, 0.72), t);
          dropBeaker(g, 668, 400, 160, 200, B, seg(p, 0.6, 0.96), t);
          F(g, 'CuSO4', 450, 136, { size: 36, alpha: seg(p, 0.42, 0.5) });
          F(g, 'BaSO4', 668, 136, { size: 36, alpha: seg(p, 0.56, 0.64) });
          verdictText(g, A, 450, 428, seg(p, 0.72, 0.8), 26);
          verdictText(g, B, 668, 428, seg(p, 0.92, 1), 26);
        },
      },
      {
        say: '<b>Anything left?</b> Carbonate, phosphate, sulfide and hydroxide stay solid. Remember <b>COPS say OH</b>. So $\\ce{CaCO3}$ stays solid and $\\ce{Fe(OH)3}$ is rust brown. Hydroxide has one twist: $\\ce{Ba(OH)2}$ dissolves, $\\ce{Ca(OH)2}$ barely.',
        dur: 4.2,
        draw(g, p, t) {
          stepDots(g, 4);
          ionRow(g, ['CO3', 'PO4', 'S', 'OH'], 72, 158, 92, 34, p, { t });
          Art.text(g, 'COPS say OH', 210, 226, { size: 32, color: C.fire, font: 'display', alpha: seg(p, 0.3, 0.45) });
          Art.text(g, 'all stay solid', 210, 264, { size: 26, alpha: seg(p, 0.34, 0.5) });
          Art.text(g, 'unless rule 1 steps in', 210, 300, { size: 26, color: C.cyan, alpha: seg(p, 0.42, 0.56) });
          Art.moe(g, 196, 440, 120, 'point', { t });
          const A = S.isSoluble('Ca', 'CO3'), B = S.isSoluble('Fe3', 'OH');
          dropBeaker(g, 480, 400, 160, 200, A, seg(p, 0.45, 0.72), t);
          dropBeaker(g, 680, 400, 160, 200, B, seg(p, 0.6, 0.96), t);
          F(g, 'CaCO3', 480, 136, { size: 36, alpha: seg(p, 0.42, 0.5) });
          F(g, 'Fe(OH)3', 680, 136, { size: 36, alpha: seg(p, 0.56, 0.64) });
          verdictText(g, A, 480, 428, seg(p, 0.72, 0.8), 26);
          verdictText(g, B, 680, 428, seg(p, 0.92, 1), 26);
        },
      },
      {
        say: 'Those few questions decide <b>216 compounds</b>. Watch them paint the whole table, one rule at a time. The picture below is real data. It is the grid you can explore in the next section.',
        dur: 5,
        draw(g, p, t) {
          const x0 = 214, y0 = 62, cw = 44, ch = 19.6;
          const order = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
          const tally = {};
          S.cations.forEach((c, i) => {
            S.anions.forEach((a, j) => {
              const r = S.isSoluble(c, a);
              const k = order.indexOf(r.rule);
              tally[r.rule] = (tally[r.rule] || 0) + 1;
              const q = ease.out(seg(p, 0.06 + k * 0.13 + (i + j) * 0.002, 0.2 + k * 0.13 + (i + j) * 0.002));
              const x = x0 + j * cw, y = y0 + i * ch;
              g.fillStyle = '#33214F'; g.fillRect(x, y, cw - 2, ch - 2);
              if (q > 0) {
                g.save(); g.globalAlpha *= q;
                if (r.status === 'soluble') g.fillStyle = r.solutionColor ? Art.mix('#1F5DA0', r.solutionColor, 0.45) : '#1F5DA0';
                else if (r.status === 'slight') g.fillStyle = Art.mix('#1F5DA0', r.color, 0.5);
                else g.fillStyle = r.color;
                g.fillRect(x, y, cw - 2, ch - 2);
                g.restore();
              }
            });
          });
          order.forEach((id, k) => {
            const q = seg(p, 0.06 + k * 0.13, 0.14 + k * 0.13);
            const x = 112, y = 92 + k * 56;
            Art.text(g, `Rule ${k + 1}`, x, y, { size: 25, font: 'display', color: S.tiers[S.rule(id).tier].color, alpha: q });
            Art.text(g, `${tally[id]} squares`, x, y + 24, { size: 21, color: C.dim, alpha: q });
          });
          Art.text(g, '18 cations × 12 anions = 216 compounds', 478, 32, { size: 28, font: 'display', color: C.sun, alpha: seg(p, 0.86, 0.96) });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: the giant grid ---------- */
  const table = Lab.$('#sol-grid');
  const cells = [];
  const anionBreak = (a) => a.id === 'Cl' || a.id === 'SO4' || a.id === 'CO3';
  const cationBreak = (c) => c.id === 'Mg' || c.id === 'Al' || c.id === 'Ag';
  (function buildGrid() {
    let html = '<thead><tr><th class="sol-corner" scope="col">Cation down, anion across</th>';
    S.anions.forEach((a) => {
      html += `<th scope="col" data-a="${a.id}" class="${anionBreak(a) ? 'sep-col' : ''}"><b>${S.html(S.ionText(a))}</b><small>${a.name}</small></th>`;
    });
    html += '</tr></thead><tbody>';
    S.cations.forEach((c) => {
      html += `<tr class="${cationBreak(c) ? 'sep' : ''}"><th scope="row" data-c="${c.id}"><b>${S.html(S.ionText(c))}</b><small>${c.name}</small></th>`;
      S.anions.forEach((a) => {
        const r = S.isSoluble(c, a);
        const cls = ['sol-cell', 'is-' + r.status];
        if (r.solutionColor && r.soluble) cls.push('has-tint');
        if (r.note) cls.push('has-note');
        if (r.color && Art.lum(r.color) < 0.3) cls.push('is-dark-solid');
        const style = `--c:${r.color || '#fff'};${r.solutionColor ? `--sol:${r.solutionColor};` : ''}`;
        const label = `${r.formula}, ${r.name}. ${STATUS_WORD[r.status]}${r.colorName ? ', ' + r.colorName : ''}.`;
        html += `<td class="${anionBreak(a) ? 'sep-col' : ''}"><button type="button" class="${cls.join(' ')}" data-c="${c.id}" data-a="${a.id}" style="${style}" tabindex="-1" aria-label="${label}"><span>${S.html(r.formula).replace(/\(/g, '<wbr>(')}</span></button></td>`;
      });
      html += '</tr>';
    });
    html += '</tbody>';
    table.innerHTML = html;
    Lab.$$('.sol-cell', table).forEach((b) => cells.push(b));
    cells[0].tabIndex = 0;
  })();
  const resultOf = (b) => S.isSoluble(b.dataset.c, b.dataset.a);
  const headsFor = (b) => [table.querySelector(`thead th[data-a="${b.dataset.a}"]`), table.querySelector(`tbody th[data-c="${b.dataset.c}"]`)];
  const cellAt = (cid, aid) => cells.find((x) => x.dataset.c === cid && x.dataset.a === aid);

  /* Dock */
  const dock = { info: S.isSoluble('Pb', 'I'), t0: 0 };
  const cellStage = Lab.stage('#c-cell', {
    w: 560, h: 320,
    bg: (g, W, H) => Art.bgLab(g, W, H, 36),
    label: 'The chosen compound dropped into a beaker of water, with a magnifier on its particles.',
    draw(g, t) {
      const info = dock.info;
      const e = Lab.reducedMotion ? 9 : t - dock.t0;
      const p = clamp(e / 3.2);
      const box = dropBeaker(g, 126, 288, 178, 178, info, p, t);
      Art.formula(g, info.formula, 128, 40, { size: info.formula.length > 9 ? 28 : 36, colorize: true, halo: true });
      Art.zoom(g, 150, box.bottom - 40, 392, 156, 142, (gg, cx, cy, R) => ionView(gg, cx, cy, R, info, p, t), { p: seg(p, 0.1, 0.32) });
    },
  });
  function paintDock() {
    const r = dock.info;
    const verdict = r.soluble ? `Dissolves${r.solutionColor ? ', and the ions color the water' : ''}` : r.slight ? `Borderline: a little dissolves, the rest is ${r.colorName}` : `Stays solid: ${r.colorName}`;
    const rule = S.rule(r.rule);
    Lab.$('#cell-text').innerHTML = Lab.texString(`
      <h3 class="sol-dock-f">${S.html(r.formula)}</h3> <p class="sol-dock-name">${r.name}</p>
      <p class="sol-verdict is-${r.status}">${verdict}</p>
      <p class="sol-reason"><b>Rule ${rule.n}.</b> ${r.reason}</p>
      ${r.note ? `<p class="sol-note"><b>Real life:</b> ${r.note}</p>` : ''}`);
  }
  function pickCell(b, focus) {
    cells.forEach((x) => { x.classList.remove('is-picked'); x.tabIndex = -1; });
    b.classList.add('is-picked');
    b.tabIndex = 0;
    if (focus) b.focus({ preventScroll: false });
    if (hideMode) { b.classList.remove('is-blank'); }
    dock.info = resultOf(b);
    dock.t0 = cellStage.t;
    paintDock();
    cellStage.redraw();
    Lab.sound.pop();
  }
  table.addEventListener('click', (e) => {
    const b = e.target.closest('.sol-cell');
    if (b) pickCell(b, false);
  });
  table.addEventListener('mouseover', (e) => {
    const b = e.target.closest('.sol-cell');
    Lab.$$('th.is-lit', table).forEach((h) => h.classList.remove('is-lit'));
    if (b) headsFor(b).forEach((h) => h && h.classList.add('is-lit'));
  });
  table.addEventListener('mouseleave', () => Lab.$$('th.is-lit', table).forEach((h) => h.classList.remove('is-lit')));
  // Arrow keys move around the grid, so there is one tab stop instead of 216.
  table.addEventListener('keydown', (e) => {
    const b = e.target.closest('.sol-cell');
    if (!b) return;
    const ci = S.cations.findIndex((c) => c.id === b.dataset.c), ai = S.anions.findIndex((a) => a.id === b.dataset.a);
    const move = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
    if (!move) return;
    e.preventDefault();
    const nc = S.cations[clamp(ci + move[0], 0, S.cations.length - 1)], na = S.anions[clamp(ai + move[1], 0, S.anions.length - 1)];
    const next = cellAt(nc.id, na.id);
    cells.forEach((x) => { x.tabIndex = -1; });
    next.tabIndex = 0; next.focus();
  });

  /* Rule highlighter */
  const ruleBtnHost = Lab.$('#rule-btns');
  ruleBtnHost.innerHTML = S.rules.map((r) => `<button type="button" class="sol-rulebtn" data-rule="${r.id}" aria-pressed="false" style="--tier:${S.tiers[r.tier].color}"><b>${r.n}</b> ${r.short}</button>`).join('');
  const ruleSay = Lab.$('#rule-say');
  let activeRule = null, painting = 0;
  function setRule(id) {
    activeRule = id;
    Lab.$$('.sol-rulebtn', ruleBtnHost).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.rule === id)));
    table.classList.toggle('has-rule', !!id);
    let n = 0, exc = 0;
    cells.forEach((b) => {
      const r = resultOf(b);
      const on = id && r.rule === id;
      b.classList.remove('is-ruled', 'is-exc');
      if (on) {
        n++;
        if (r.exception) exc++;
        const row = S.cations.findIndex((c) => c.id === b.dataset.c), col = S.anions.findIndex((a) => a.id === b.dataset.a);
        b.style.setProperty('--d', `${(row + col) * 16}ms`);
        void b.offsetWidth;
        b.classList.add('is-ruled');
        if (r.exception) b.classList.add('is-exc');
      }
    });
    if (id) {
      const rule = S.rule(id);
      ruleSay.innerHTML = Lab.texString(`<b>${rule.title}</b> decide ${n} squares${exc ? `, and the ${exc} glowing pink are the exceptions` : ''}. ${rule.say}`);
    } else ruleSay.innerHTML = '';
  }
  ruleBtnHost.addEventListener('click', (e) => {
    const b = e.target.closest('.sol-rulebtn');
    if (!b) return;
    stopPaint();
    setRule(activeRule === b.dataset.rule ? null : b.dataset.rule);
    Lab.sound.pop();
  });

  /* Paint it rule by rule */
  let paintTimer = 0;
  const paintBtn = Lab.$('#grid-paint');
  function stopPaint() {
    if (!painting) return;
    painting = 0; clearTimeout(paintTimer);
    cells.forEach((b) => { if (!hideMode) b.classList.remove('is-blank'); });
    paintBtn.textContent = 'Paint the grid, rule by rule';
  }
  function runPaint() {
    if (painting) { stopPaint(); setRule(null); return; }
    setRule(null);
    setHide(false);
    painting = 1;
    paintBtn.textContent = 'Stop painting';
    cells.forEach((b) => { b.classList.add('is-blank'); b.classList.remove('just-painted'); });
    let k = 0;
    const step = () => {
      if (!painting) return;
      if (k >= S.rules.length) {
        painting = 0;
        ruleSay.innerHTML = Lab.texString('<b>Done.</b> Six rules, 216 compounds. Notice the shape: the top rows and left columns are blue, the right columns are solid, and the exceptions cluster in the bottom three rows.');
        paintBtn.textContent = 'Paint the grid, rule by rule';
        return;
      }
      const rule = S.rules[k];
      let n = 0;
      cells.forEach((b) => {
        if (resultOf(b).rule !== rule.id) return;
        n++;
        const row = S.cations.findIndex((c) => c.id === b.dataset.c), col = S.anions.findIndex((a) => a.id === b.dataset.a);
        b.style.setProperty('--d', `${(row + col) * 22}ms`);
        b.classList.remove('is-blank');
        b.classList.add('just-painted');
      });
      ruleSay.innerHTML = Lab.texString(`<b>Rule ${rule.n}: ${rule.title.toLowerCase()}</b> paints ${n} squares.`);
      Lab.sound.pop();
      k++;
      paintTimer = setTimeout(step, Lab.reducedMotion ? 700 : 1500);
    };
    step();
  }
  paintBtn.addEventListener('click', runPaint);

  /* Hide the answers for self-testing */
  let hideMode = false;
  const hideBtn = Lab.$('#grid-hide');
  function setHide(on) {
    hideMode = on;
    hideBtn.setAttribute('aria-pressed', String(on));
    hideBtn.textContent = on ? 'Show all the answers' : 'Hide the answers';
    cells.forEach((b) => b.classList.toggle('is-blank', on));
    Lab.$('#grid-hint').textContent = on ? 'Guess first, then tap a square to check.' : 'Tap a rule, then tap a square.';
  }
  hideBtn.addEventListener('click', () => { stopPaint(); setRule(null); setHide(!hideMode); });

  paintDock();
  cellAt('Pb', 'I').classList.add('is-picked');

  /* ---------- Bench: the speed game ---------- */
  const ROUNDS_MAX = 25, STRIKES = 3;
  function gameWeights() {
    const list = [];
    S.pool().forEach((r) => {
      let w = 1;
      if (r.exception) w = 7;
      else if (r.rule === 'r1' && (r.anion.kind === 'cops' || r.anion.kind === 'hydroxide')) w = 3;
      else if (r.rule === 'r2' && r.cation.kind === 'grump') w = 4;
      else if (r.rule === 'r5' || r.rule === 'r6') w = 2;
      else if (r.rule === 'r3' || r.rule === 'r4') w = 2;
      list.push([r, w]);
    });
    return list;
  }
  const WEIGHTS = gameWeights();
  const pickWeighted = (avoid) => {
    for (let tries = 0; tries < 8; tries++) {
      const total = WEIGHTS.reduce((s, x) => s + x[1], 0);
      let v = Math.random() * total;
      for (const [r, w] of WEIGHTS) {
        v -= w;
        if (v <= 0) { if (!avoid || !avoid.has(r.key)) return r; break; }
      }
    }
    return WEIGHTS[Math.floor(Math.random() * WEIGHTS.length)][0];
  };
  const game = {
    mode: 'idle', score: 0, strikes: 0, streak: 0, best: Lab.store.get('best:solubility-speed', 0),
    round: 0, q: null, t0: 0, limit: 7, answered: null, seen: new Set(), missed: [], awarded: 0,
  };
  const btnYes = Lab.$('#game-yes'), btnNo = Lab.$('#game-no'), btnStart = Lab.$('#game-start'), gameSay = Lab.$('#game-say');
  function gameButtons() {
    const playing = game.mode === 'ask';
    btnYes.hidden = btnNo.hidden = game.mode === 'idle' || game.mode === 'over';
    btnYes.disabled = btnNo.disabled = !playing;
    btnStart.hidden = !(game.mode === 'idle' || game.mode === 'over' || game.mode === 'stopped');
    btnStart.textContent = game.mode === 'over' ? 'Play again' : game.mode === 'stopped' ? 'Next formula' : 'Start the game';
  }
  function nextRound() {
    game.round++;
    game.q = pickWeighted(game.seen);
    game.seen.add(game.q.key);
    game.limit = Math.max(3.2, 7 - game.round * 0.2);
    game.t0 = gameStage.t;
    game.answered = null;
    game.mode = 'ask';
    gameButtons();
    gameStage.redraw();
  }
  function startGame() {
    if (game.mode === 'stopped') { nextRound(); return; }
    Object.assign(game, { score: 0, strikes: 0, streak: 0, round: 0, seen: new Set(), missed: [], awarded: 0 });
    gameSay.innerHTML = '<p>Decide before the formula lands.</p>';
    nextRound();
  }
  function answer(val) {
    if (game.mode !== 'ask') return;
    const r = game.q, truth = r.soluble;
    const ok = val === truth;
    const timedOut = val === null;
    game.answered = { ok, timedOut };
    game.t0 = gameStage.t;
    if (ok) {
      game.score++; game.streak++;
      Lab.sound.good();
      gameSay.innerHTML = `<p><b>${S.html(r.formula)}: ${r.soluble ? 'dissolves' : 'stays solid'}.</b> ${Lab.texString(r.reason)}</p>`;
      if (game.score === 10) { Lab.collection.award(1); game.awarded++; }
      if (game.score === 20) { Lab.collection.award(2); game.awarded += 2; }
      game.mode = 'show';
      gameButtons();
      setTimeout(() => {
        if (game.mode !== 'show') return;
        if (game.round >= ROUNDS_MAX) endGame(); else nextRound();
      }, Lab.reducedMotion ? 1800 : 2200);
    } else {
      game.strikes++; game.streak = 0;
      game.missed.push(r);
      Lab.sound.bad();
      gameSay.innerHTML = `<p><b>${timedOut ? 'Time ran out.' : 'Not this time.'} ${S.html(r.formula)} ${r.soluble ? 'dissolves' : 'stays solid'}.</b> ${Lab.texString(r.reason)}</p>`;
      if (game.strikes >= STRIKES) { game.mode = 'show'; gameButtons(); setTimeout(endGame, 2600); }
      else { game.mode = 'stopped'; gameButtons(); btnStart.focus({ preventScroll: true }); }
    }
  }
  function endGame() {
    game.mode = 'over';
    const newBest = game.score > game.best;
    if (newBest) { game.best = game.score; Lab.store.set('best:solubility-speed', game.best); }
    if (game.score >= 15) Lab.confetti(); else if (newBest && game.score >= 5) Lab.confetti(50);
    Lab.sound.fanfare();
    const missed = [...new Map(game.missed.map((m) => [m.rule, m])).values()];
    const review = missed.length ? ` Worth another look: ${missed.map((m) => `rule ${S.rule(m.rule).n} (${S.rule(m.rule).short.toLowerCase()})`).join(', ')}.` : '';
    gameSay.innerHTML = `<p><b>Final score: ${game.score}.</b>${newBest ? ' A new best.' : ` Your best is ${game.best}.`}${review}</p>`;
    gameButtons();
  }
  btnYes.addEventListener('click', () => answer(true));
  btnNo.addEventListener('click', () => answer(false));
  btnStart.addEventListener('click', startGame);
  document.addEventListener('keydown', (e) => {
    if (game.mode !== 'ask' || !gameStage.visible) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); answer(true); }
    if (e.key === 'ArrowRight') { e.preventDefault(); answer(false); }
  });
  const gameStage = Lab.stage('#c-game', {
    h: 420, bg: 'lab', label: 'A formula falling toward a beaker of water, with score, streak and strikes shown at the top.',
    draw(g, t) {
      const W = 800, base = 342;
      // Scoreboard.
      Art.text(g, `Score ${game.score}`, 26, 34, { font: 'display', size: 30, color: C.sun, align: 'left' });
      Art.text(g, `Best ${game.best}`, 26, 68, { size: 23, color: C.dim, align: 'left' });
      if (game.streak >= 2) Art.text(g, `${game.streak} in a row`, 26, 100, { size: 24, color: C.pink, align: 'left', font: 'display' });
      for (let i = 0; i < STRIKES; i++) {
        const used = i < game.strikes;
        Art.atom(g, W - 40 - i * 50, 38, 21, 'O', { face: used ? 'sad' : 'happy', t, seed: i, label: false, alpha: used ? 0.35 : 1 });
      }
      const info = game.q;
      if (game.mode === 'idle' || game.mode === 'over' || !info) {
        const over = game.mode === 'over';
        dropBeaker(g, 400, base, 220, 190, S.isSoluble('Na', 'Cl'), 0, t);
        Art.text(g, over ? `You scored ${game.score}` : 'Dissolve or stay solid?', 400, 92, { font: 'display', size: 42, color: over ? C.sun : C.ink });
        Art.moe(g, 140, base + 4, 172, over ? (game.score >= 10 ? 'cheer' : 'oops') : 'wave', { t });
        return;
      }
      const e = Lab.reducedMotion ? 9 : t - game.t0;
      if (game.mode === 'ask') {
        const u = Lab.reducedMotion ? 0.3 : clamp(e / game.limit);
        // Timer bar.
        Art.meter(g, 240, 22, 320, 16, 1 - u, { color: u > 0.75 ? C.red : u > 0.5 ? C.sun : C.leaf });
        dropBeaker(g, 400, base, 220, 190, info, 0, t);
        const y = lerp(86, base - 104, u * u);
        card(g, info.formula, 400 + Math.sin(t * 1.6) * 8, y, 1);
        Art.text(g, info.name, 400, y + 46, { size: 25, halo: true, color: C.dim });
        Art.moe(g, 134, base + 4, 150, 'think', { t });
        if (u >= 1 && !Lab.reducedMotion) answer(null);
      } else {
        const p = clamp(e / 2);
        dropBeaker(g, 400, base, 220, 190, info, p, t);
        Art.formula(g, info.formula, 400, 86, { size: 42, colorize: true, halo: true });
        const ok = game.answered && game.answered.ok;
        Art.text(g, ok ? 'Yes!' : (game.answered && game.answered.timedOut ? 'Too slow' : 'Oops'), 150, 96, { font: 'display', size: 44, color: ok ? C.leaf : C.red });
        Art.moe(g, 134, base + 4, 150, ok ? 'cheer' : 'oops', { t });
        Art.zoom(g, 470, base - 70, 642, 200, 126, (gg, cx, cy, R) => ionView(gg, cx, cy, R, info, p, t), { p: seg(p, 0.08, 0.3) });
        if (info.colorName && p > 0.6) Art.text(g, info.colorName, 400, 380, { size: 26, color: '#fff', alpha: seg(p, 0.6, 0.8), halo: true });
        if (!info.colorName && p > 0.6) Art.text(g, 'ions spread out', 400, 380, { size: 26, color: '#fff', alpha: seg(p, 0.6, 0.8), halo: true });
      }
    },
  });
  gameButtons();
  // Every page load re-checks the rules and the equations, so a bad edit shows up as a console error.
  const problems = S.selfTest();
  if (problems.length) console.error('Solubility self-test failed: ' + problems.join('; '));
});
