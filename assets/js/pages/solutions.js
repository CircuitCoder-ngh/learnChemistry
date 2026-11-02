/* Lesson 5.1: Solutions and molarity. Dissolving, electrolytes, molarity, dilution and ions. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const PI = Math.PI, TAU = PI * 2;

  /** Art.formula with fade support. */
  function fo(g, str, x, y, o = {}) {
    const prev = g.globalAlpha;
    if (o.alpha !== undefined) g.globalAlpha = prev * o.alpha;
    const w = Art.formula(g, str, x, y, o);
    g.globalAlpha = prev;
    return w;
  }

  /* ---------- Shapes ---------- */
  const R0 = { H: 0.56, C: 0.82, N: 0.8, O: 0.78, S: 1, P: 1, Cl: 0.98 };
  const SHAPES = {
    SO4: { a: [['S', 0, 0], ['O', 0, -1], ['O', 1, 0], ['O', 0, 1], ['O', -1, 0]] },
    PO4: { a: [['P', 0, 0], ['O', 0, -1], ['O', 1, 0], ['O', 0, 1], ['O', -1, 0]] },
    NO3: { a: [['N', 0, 0], ['O', 0, -1], ['O', 0.9, 0.55], ['O', -0.9, 0.55]] },
    NH4: { a: [['N', 0, 0], ['H', 0, -1], ['H', 1, 0], ['H', 0, 1], ['H', -1, 0]] },
    CO3: { a: [['C', 0, 0], ['O', 0, -1], ['O', 0.9, 0.55], ['O', -0.9, 0.55]] },
    H3O: { a: [['O', 0, 0], ['H', 0, -1], ['H', 0.9, 0.55], ['H', -0.9, 0.55]] },
    OH: { a: [['O', -0.3, 0], ['H', 0.6, 0]] },
    HAc: { a: [['C', -0.8, 0], ['C', 0.25, 0], ['O', 0.9, -0.8], ['O', 1.0, 0.8], ['H', 1.85, 0.8], ['H', -1.6, -0.6], ['H', -1.6, 0.6], ['H', -0.8, 1]] },
    Ac: { a: [['C', -0.8, 0], ['C', 0.25, 0], ['O', 0.9, -0.8], ['O', 1.0, 0.8], ['H', -1.6, -0.6], ['H', -1.6, 0.6], ['H', -0.8, 1]] },
    NH3: { a: [['N', 0, -0.12], ['H', -0.9, 0.3], ['H', 0.9, 0.3], ['H', 0, 0.82]] },
    EtOH: { a: [['C', -1.3, 0.25], ['C', 0, -0.25], ['O', 1.25, 0.25], ['H', 2, -0.35], ['H', -1.3, 1.25], ['H', -2.25, -0.1], ['H', -1.55, -0.7], ['H', 0, -1.25], ['H', 0.1, 0.72]] },
    HCl: { a: [['H', -0.55, 0], ['Cl', 0.55, 0]] },
  };
  function shape(g, key, x, y, s, o = {}) {
    const m = SHAPES[key], c = Math.cos(o.rot || 0), d = Math.sin(o.rot || 0);
    const prev = g.globalAlpha;
    if (o.alpha !== undefined) g.globalAlpha = prev * o.alpha;
    const pts = m.a.map(([sym, ax, ay]) => ({ sym, x: x + (ax * c - ay * d) * s, y: y + (ax * d + ay * c) * s }));
    pts.map((_, i) => i).sort((a, b) => (pts[a].sym === 'H' ? 1 : 0) - (pts[b].sym === 'H' ? 1 : 0)).forEach((i) => {
      const p = pts[i], r = (R0[p.sym] || 0.9) * s * 0.74;
      Art.atom(g, p.x, p.y, r, p.sym, { label: o.labels && r >= 10 ? p.sym : false });
    });
    if (o.charge) {
      // A single badge for the whole ion: the charge belongs to the group.
      const bx = x + s * 1.05, by = y - s * 1.05, br = Math.max(11, s * 0.5);
      g.fillStyle = /\+/.test(o.charge) ? '#FF3D7F' : '#1FA5FF'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
      g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill(); g.stroke();
      g.font = `700 ${br * 1.26}px ${Art.FONT_BODY}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(o.charge.replace('-', '−'), bx, by + 0.5);
    }
    g.globalAlpha = prev;
  }
  const water = (g, x, y, s, rot, o = {}) => Art.molecule(g, x, y, s, 'H2O', Object.assign({ rot, style: 'fill', atomScale: 1.22, labels: false }, o));
  /** Rotation that points a water molecule's oxygen (or hydrogens) at a spot. */
  const aimO = (x, y, tx, ty) => Math.atan2(tx - x, -(ty - y));
  const aimH = (x, y, tx, ty) => Math.atan2(-(tx - x), ty - y);
  function shell(g, x, y, R, n, end, s, t, seed, alpha = 1) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + t * 0.22 + seed;
      const wx = x + Math.cos(a) * R, wy = y + Math.sin(a) * R;
      water(g, wx, wy, s, end === 'O' ? aimO(wx, wy, x, y) : aimH(wx, wy, x, y), { alpha });
    }
  }
  const naIon = (g, x, y, r, o = {}) => Art.atom(g, x, y, r, 'Na', Object.assign({ charge: '+', label: 'Na' }, o));
  const clIon = (g, x, y, r, o = {}) => Art.atom(g, x, y, r, 'Cl', Object.assign({ charge: '-', label: 'Cl' }, o));
  /** A simple sugar: two joined rings with OH groups sticking out. */
  function sugar(g, x, y, s, rot = 0, o = {}) {
    g.save(); g.translate(x, y); g.rotate(rot); if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    const ring = (cx, oxy) => {
      g.strokeStyle = 'rgba(217,209,236,.75)'; g.lineWidth = Math.max(2, s * 0.14);
      g.beginPath();
      for (let i = 0; i <= 6; i++) { const a = (i / 6) * TAU + PI / 6; const px = cx + Math.cos(a) * s * 0.72, py = Math.sin(a) * s * 0.72; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + PI / 6; Art.ball(g, cx + Math.cos(a) * s * 0.72, Math.sin(a) * s * 0.72, s * 0.3, i === oxy ? Art.elementColor('O') : Art.elementColor('C')); }
    };
    const oh = (px, py) => { Art.ball(g, px, py, s * 0.27, Art.elementColor('O')); Art.ball(g, px + s * 0.26, py + s * 0.14, s * 0.17, Art.elementColor('H')); };
    ring(-s * 1.05, 0); ring(s * 1.05, 3);
    Art.ball(g, 0, 0, s * 0.26, Art.elementColor('O'));
    oh(-s * 1.2, -s * 1.15); oh(-s * 1.75, s * 0.85); oh(s * 1.15, -s * 1.15); oh(s * 1.7, s * 0.85);
    g.restore();
  }

  /* ---------- Particle views ---------- */
  const SP = 45, RNA = 15, RCL = 25;
  const sunflower = (n, R) => Array.from({ length: n }, (_, i) => { const a = i * 2.39996 + 0.6, d = Math.sqrt((i + 0.6) / n) * R; return [Math.cos(a) * d, Math.sin(a) * d]; });
  const SALT = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) SALT.push({ na: (i + j) % 2 === 0, ox: (i - 1.5) * SP, oy: (j - 1) * SP });
  (function assign() {
    const sites = sunflower(12, 150).sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
    SALT.forEach((a) => { a.dist = Math.hypot(a.ox, a.oy); a.ang = Math.atan2(a.oy, a.ox); });
    const byAng = SALT.slice().sort((a, b) => a.ang - b.ang);
    byAng.forEach((a, i) => { a.dx = sites[i][0]; a.dy = sites[i][1]; });
    const byOut = SALT.slice().sort((a, b) => b.dist - a.dist + (rand(a.ox + a.oy) - 0.5) * 8);
    byOut.forEach((a, i) => { a.start = (i / 12) * 0.78; });
  })();
  const FREE_WATER = Array.from({ length: 9 }, (_, i) => ({ a: rand(i + 1) * TAU, d: 136 + rand(i + 5) * 44, sp: 0.05 + rand(i + 9) * 0.08, rot: rand(i) * TAU, seed: i }));
  /** Salt crystal dissolving in a circle of radius about 190. prog 0..1. */
  function saltView(g, cx, cy, prog, t) {
    FREE_WATER.forEach((w) => {
      const a = w.a + t * w.sp, x = cx + Math.cos(a) * w.d, y = cy + Math.sin(a) * w.d;
      // Free water drifts, and turns its charged ends toward the crystal.
      water(g, x + wander(w.seed, t) * 4, y + wander(w.seed + 9, t) * 4, 13, w.rot + Math.sin(t * 0.5 + w.seed) * 0.5, { alpha: 0.75 });
    });
    SALT.forEach((a, i) => {
      const u = ease.inOut(seg(prog, a.start, a.start + 0.22));
      const wob = 1 + u * 3.5;
      const x = cx + lerp(a.ox, a.dx, u) + wander(i, t) * wob * (u > 0 ? 1 : 0.5), y = cy + lerp(a.oy, a.dy, u) + wander(i + 20, t) * wob * (u > 0 ? 1 : 0.5);
      const sh = seg(u, 0.12, 0.7);
      if (sh > 0) {
        if (a.na) shell(g, x, y, RNA + 13, 4, 'O', 12.5, t, i, sh);
        else shell(g, x, y, RCL + 8, 5, 'H', 12.5, t, i, sh);
      }
      if (a.na) naIon(g, x, y, RNA); else clIon(g, x, y, RCL);
    });
  }
  const SUGAR_SITES = sunflower(6, 124);
  const SUGARS = Array.from({ length: 6 }, (_, i) => {
    const ox = ((i % 3) - 1) * 76, oy = (Math.floor(i / 3) - 0.5) * 62;
    const near = SUGAR_SITES.slice();
    return { ox, oy, dx: near[i][0], dy: near[i][1], start: [0, 0.38, 0.13, 0.5, 0.25, 0.63][i], rot0: 0, rot1: rand(i + 4) * 2 - 1 };
  });
  function sugarView(g, cx, cy, prog, t) {
    FREE_WATER.forEach((w) => {
      const a = w.a + t * w.sp, x = cx + Math.cos(a) * w.d, y = cy + Math.sin(a) * w.d;
      water(g, x + wander(w.seed, t) * 4, y + wander(w.seed + 9, t) * 4, 13, w.rot + Math.sin(t * 0.5 + w.seed) * 0.5, { alpha: 0.75 });
    });
    SUGARS.forEach((m, i) => {
      const u = ease.inOut(seg(prog, m.start, m.start + 0.3));
      const x = cx + lerp(m.ox, m.dx, u) + wander(i, t) * (0.6 + u * 3), y = cy + lerp(m.oy, m.dy, u) + wander(i + 20, t) * (0.6 + u * 3);
      if (u > 0.3) for (let k = 0; k < 3; k++) { const a = k * 2.1 + t * 0.2 + i; const wx = x + Math.cos(a) * 46, wy = y + Math.sin(a) * 36; water(g, wx, wy, 12, aimO(wx, wy, x, y), { alpha: seg(u, 0.3, 0.8) }); }
      sugar(g, x, y, 15.5, lerp(0, m.rot1, u) + (u > 0 ? Math.sin(t * 0.4 + i) * 0.2 * u : 0));
    });
  }
  function crystals(g, x, y, w, h, color) {
    for (let i = 0; i < 14; i++) {
      const a = rand(i + 2), b = rand(i + 7);
      const cx = x + (a - 0.5) * w * (1 - b * 0.7), cy = y - b * h, s = 5 + rand(i) * 4;
      g.fillStyle = Art.mix(color, i % 2 ? '#ffffff' : '#8F88AA', 0.3); g.strokeStyle = 'rgba(16,8,32,.5)'; g.lineWidth = 1.2;
      g.beginPath(); g.rect(cx - s / 2, cy - s / 2, s, s); g.fill(); g.stroke();
    }
  }
  /** Tiny label for a substance name beside a formula with charges. */
  const ionEq = (g, str, x, y, size, o = {}) => fo(g, str, x, y, { size, colorize: true, halo: true, ...o });

  /* ---------- Story 1: dissolving ---------- */
  const lattice = (cols, rows, sp) => { const out = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push({ i, j, na: (i + j) % 2 === 0, x: (i - (cols - 1) / 2) * sp, y: (j - (rows - 1) / 2) * sp }); return out; };
  Lab.story('#story-dissolve', {
    title: 'Water takes a crystal apart',
    scenes: [
      {
        say: 'Three names first. The salt is the <b>solute</b>, because it gets dissolved. The water is the <b>solvent</b>, because it does the dissolving. Together they make a <b>solution</b>.',
        dur: 4.2,
        draw(g, p, t, { W, H }) {
          Art.bg(g, W, H, 'lab');
          const bench = H - 70;
          // The salt pile on a dish.
          g.fillStyle = '#C9C7DB'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(120, bench - 8, 86, 12, 0, 0, TAU); g.fill(); g.stroke();
          const shrink = 1 - 0.75 * seg(p, 0.3, 0.68);
          g.fillStyle = '#F4F2FA'; g.beginPath(); g.moveTo(120 - 66 * shrink, bench - 12); g.quadraticCurveTo(120, bench - 12 - 92 * shrink, 120 + 66 * shrink, bench - 12); g.closePath(); g.fill(); g.strokeStyle = 'rgba(26,15,46,.5)'; g.stroke();
          crystals(g, 120, bench - 14, 110 * shrink, 60 * shrink, '#F4F2FA');
          // Grains flying into the water.
          for (let i = 0; i < 16; i++) {
            const ph = seg(p, 0.28 + i * 0.022, 0.42 + i * 0.022);
            if (ph <= 0 || ph >= 1) continue;
            const x = lerp(130, 320 + rand(i) * 60, ph), y = lerp(bench - 50, bench - 170, ph) - Math.sin(ph * PI) * 90 + ph * ph * 110;
            g.fillStyle = '#F4F2FA'; g.fillRect(x - 4, y - 4, 8, 8);
          }
          Art.beaker(g, 350, bench, 190, 220, { level: 0.74, liquid: C.water, inside(gg, b) { const n = Math.floor(14 * seg(p, 0.4, 0.68)); for (let i = 0; i < n; i++) { const ph = (t * 0.2 + rand(i)) % 1; gg.fillStyle = 'rgba(255,255,255,.6)'; gg.fillRect(b.x0 + rand(i + 3) * 180, b.top + ph * (b.bottom - b.top), 6, 6); } } });
          Art.arrow(g, 470, 240, 526, 240, { color: C.pink, w: 8, p: seg(p, 0.62, 0.74) });
          const q = ease.back(seg(p, 0.72, 0.9));
          if (q > 0) Art.beaker(g, 656, bench, 190 * q, 220 * q, { level: 0.74, liquid: '#7CCBF1' });
          Art.text(g, 'Solute', 120, 240, { font: 'display', size: 40, color: C.sun, alpha: seg(p, 0.04, 0.18) });
          Art.text(g, 'the salt', 120, 280, { size: 26, alpha: seg(p, 0.04, 0.18) });
          Art.text(g, 'Solvent', 350, 56, { font: 'display', size: 40, color: C.cyan, alpha: seg(p, 0.14, 0.28) });
          Art.text(g, 'the water', 350, 96, { size: 26, alpha: seg(p, 0.14, 0.28) });
          Art.text(g, 'Solution', 656, 56, { font: 'display', size: 40, color: C.pink, alpha: seg(p, 0.78, 0.92) });
          Art.text(g, 'salt water', 656, 96, { size: 26, alpha: seg(p, 0.78, 0.92) });
        },
      },
      {
        say: 'Now zoom in. A water molecule is bent, and oxygen pulls the shared electrons harder. So the oxygen end is slightly negative and the hydrogen ends are slightly positive. We call that <b>polar</b>.',
        dur: 3.8,
        draw(g, p, t) {
          const cx = 270, cy = 250, s = 128;
          const q = ease.back(seg(p, 0, 0.26));
          if (q > 0) {
            const gl = seg(p, 0.3, 0.55);
            Art.glow(g, cx, cy - 40, 170 * gl + 1, C.cyan, 0.5);
            Art.glow(g, cx - 104, cy + 50, 110 * gl + 1, C.pink, 0.5);
            Art.glow(g, cx + 104, cy + 50, 110 * gl + 1, C.pink, 0.5);
            g.save(); g.translate(cx, cy); g.scale(q, q);
            Art.molecule(g, 0, 0, s, 'H2O', { style: 'ball', atomScale: 1.45, face: 'happy', t, look: [0, 0] });
            g.restore();
          }
          const a = seg(p, 0.34, 0.54), b = seg(p, 0.46, 0.66);
          Art.text(g, 'δ−', cx, cy - 138, { font: 'display', size: 52, color: C.cyan, alpha: a });
          Art.text(g, 'δ+', cx - 150, cy + 112, { font: 'display', size: 46, color: C.pink, alpha: b });
          Art.text(g, 'δ+', cx + 150, cy + 112, { font: 'display', size: 46, color: C.pink, alpha: b });
          Art.text(g, 'Slightly negative', 610, 118, { size: 30, color: C.cyan, alpha: a });
          Art.arrow(g, 480, 118, 330, 170, { color: C.cyan, w: 5, p: a });
          Art.text(g, 'Slightly positive', 610, 318, { size: 30, color: C.pink, alpha: b });
          Art.arrow(g, 480, 318, 420, 306, { color: C.pink, w: 5, p: b });
          const c = ease.back(seg(p, 0.72, 0.92));
          if (c > 0) { g.save(); g.translate(610, 218); g.scale(c, c); g.fillStyle = C.plum2; g.strokeStyle = C.sun; g.lineWidth = 4; Art.round(g, -116, -36, 232, 72, 26); g.fill(); g.stroke(); Art.text(g, 'Polar', 0, 2, { font: 'display', size: 44, color: C.sun }); g.restore(); }
        },
      },
      {
        say: 'Salt is a neat crystal of ions, <b>Na⁺</b> and <b>Cl⁻</b>, each stuck to its opposite neighbors. Water molecules drift in and start tugging at the edges.',
        dur: 3.8,
        draw(g, p, t, { W, H }) {
          const L = lattice(6, 4, 66), cx = W / 2, cy = H / 2 + 6;
          L.forEach((a, i) => {
            const q = ease.back(seg(p, 0.01 * i, 0.16 + 0.01 * i));
            if (q <= 0) return;
            const x = cx + a.x + wander(i, t) * 1.4, y = cy + a.y + wander(i + 30, t) * 1.4;
            if (a.na) naIon(g, x, y, 22 * q); else clIon(g, x, y, 37 * q);
          });
          const spots = [[-1, -1], [-0.4, -1.32], [0.45, -1.32], [1, -1], [1.32, -0.2], [1, 1], [0.3, 1.34], [-0.5, 1.34], [-1, 1], [-1.34, 0.2]];
          spots.forEach(([dx, dy], i) => {
            const u = ease.out(seg(p, 0.34 + i * 0.03, 0.78 + i * 0.015));
            const tx = cx + dx * 262, ty = cy + dy * 138, fx = cx + dx * 420, fy = cy + dy * 280;
            const x = lerp(fx, tx, u) + wander(i, t) * 3, y = lerp(fy, ty, u) + wander(i + 7, t) * 3;
            water(g, x, y, 26, aimO(x, y, cx, cy) + (i % 2 ? PI : 0));
          });
          const a = seg(p, 0.16, 0.3);
          Art.text(g, 'Na⁺', cx - 200, 42, { font: 'display', size: 30, color: Art.mix(Art.elementColor('Na'), '#ffffff', 0.45), alpha: a });
          Art.text(g, 'Cl⁻', cx + 200, 42, { font: 'display', size: 30, color: Art.elementColor('Cl'), alpha: a });
        },
      },
      {
        say: 'Look closely at the corner. The negative <b>O ends</b> point at Na⁺, and the positive <b>H ends</b> point at Cl⁻. Opposites attract, so water pulls on the ions from outside.',
        dur: 4,
        draw(g, p, t) {
          const cx = 210, cy = 218, sp = 106, rNa = 37, rCl = 62;
          const near = (i, j) => (i + j) % 2 === 0;
          const tug = seg(p, 0.5, 1) * 6;
          [-1, 0, 1].forEach((j) => [-1, 0, 1].forEach((i) => {
            const pull = i === 1 ? tug : 0;
            const x = cx + i * sp + pull + wander(i * 3 + j, t) * (i === 1 ? 2.2 : 0.8), y = cy + j * sp + wander(i + j * 5 + 9, t) * (i === 1 ? 2.2 : 0.8);
            if (near(i, j)) naIon(g, x, y, rNa, { face: i === 1 ? 'wow' : null, t, seed: i + j }); else clIon(g, x, y, rCl, { face: i === 1 && j === 0 ? 'wow' : null, t, seed: i + j });
          }));
          const naX = cx + sp, naY = cy + sp, clX = cx + sp, clY = cy;
          const q = ease.out(seg(p, 0.08, 0.44));
          [[0.1, 84], [1.02, 84]].forEach(([a, R], i) => {
            const d = lerp(R + 70, R, q);
            const x = naX + Math.cos(a) * d, y = naY + Math.sin(a) * d;
            water(g, x, y, 40, aimO(x, y, naX, naY), { alpha: clamp(q * 2), seed: i });
          });
          [[-0.66, 112], [0.08, 112]].forEach(([a, R], i) => {
            const d = lerp(R + 70, R, q);
            const x = clX + Math.cos(a) * d, y = clY + Math.sin(a) * d;
            water(g, x, y, 40, aimH(x, y, clX, clY), { alpha: clamp(q * 2), seed: i });
          });
          const a = seg(p, 0.42, 0.62), b = seg(p, 0.56, 0.76);
          Art.text(g, 'H ends face Cl⁻', 640, 170, { font: 'display', size: 30, color: C.pink, alpha: a });
          Art.text(g, 'O ends face Na⁺', 640, 350, { font: 'display', size: 30, color: C.cyan, alpha: b });
          Art.arrow(g, 530, 176, 478, 190, { color: C.pink, w: 5, p: a });
          Art.arrow(g, 530, 348, 472, 334, { color: C.cyan, w: 5, p: b });
        },
      },
      {
        say: 'The ion comes loose, and water wraps around it. Each ion rides inside its own coat of water. That coat is called <b>hydration</b>, and we write the ion as <b>(aq)</b>.',
        dur: 4,
        draw(g, p, t) {
          const q = ease.out(seg(p, 0.05, 0.6));
          const nx = 215, ny = 196, cx = 585, cy = 196;
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * TAU + t * 0.14, R = lerp(250, 104, ease.out(seg(p, 0.05 + i * 0.05, 0.42 + i * 0.05)));
            const x = nx + Math.cos(a) * R, y = ny + Math.sin(a) * R;
            water(g, x, y, 42, aimO(x, y, nx, ny), { alpha: clamp(q * 2) });
          }
          naIon(g, nx, ny, 40, { face: 'happy', t, look: [0.7, 0] });
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * TAU - t * 0.14 + 0.5, R = lerp(250, 116, ease.out(seg(p, 0.05 + i * 0.05, 0.42 + i * 0.05)));
            const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
            water(g, x, y, 42, aimH(x, y, cx, cy), { alpha: clamp(q * 2) });
          }
          clIon(g, cx, cy, 64, { face: 'happy', t, look: [-0.7, 0], seed: 2 });
          const a = seg(p, 0.68, 0.86);
          ionEq(g, 'Na^+(aq)', nx, 386, 36, { alpha: a });
          ionEq(g, 'Cl^-(aq)', cx, 386, 36, { alpha: a });
          Art.text(g, 'O faces in', nx, 428, { size: 26, color: C.cyan, alpha: a });
          Art.text(g, 'H faces in', cx, 428, { size: 26, color: C.pink, alpha: a });
        },
      },
      {
        say: 'Soon the whole crystal is gone, and the ions drift freely. The salt only looks like it vanished: the ions are still there, and they can move. <b>One NaCl gives two particles.</b>',
        dur: 5,
        draw(g, p, t, { W, H }) {
          Art.bg(g, W, H, 'lab');
          const bench = H - 70;
          Art.beaker(g, 120, bench, 170, 210, { level: 0.74, liquid: '#7CCBF1' });
          crystals(g, 120, bench - 6, 90 * (1 - seg(p, 0.1, 0.8)), 26 * (1 - seg(p, 0.1, 0.8)), '#F4F2FA');
          Art.zoom(g, 140, bench - 60, 520, 238, 205, (gg, cx, cy) => saltView(gg, cx, cy, ease.inOut(seg(p, 0.06, 0.92)), t), { p: seg(p, 0, 0.14) });
          Art.text(g, 'NaCl(s) →', 138, 52, { font: 'display', size: 28, color: C.sun, alpha: seg(p, 0.8, 0.95) });
          Art.text(g, 'Na⁺(aq) + Cl⁻(aq)', 138, 90, { font: 'display', size: 26, color: C.sun, alpha: seg(p, 0.84, 0.98) });
        },
      },
      {
        say: 'Sugar is different. It is made of molecules, with no ions to pull apart. Water surrounds each molecule and carries it off <b>whole</b>. So one sugar gives just one particle, with no charge at all.',
        dur: 5,
        draw(g, p, t, { W, H }) {
          Art.bg(g, W, H, 'lab');
          const bench = H - 70;
          Art.beaker(g, 120, bench, 170, 210, { level: 0.74, liquid: '#7CCBF1' });
          crystals(g, 120, bench - 6, 90 * (1 - seg(p, 0.1, 0.8)), 26 * (1 - seg(p, 0.1, 0.8)), '#FFFDF2');
          Art.zoom(g, 140, bench - 60, 520, 238, 205, (gg, cx, cy) => sugarView(gg, cx, cy, ease.inOut(seg(p, 0.06, 0.94)), t), { p: seg(p, 0, 0.14) });
          Art.text(g, 'No ions.', 134, 58, { font: 'display', size: 36, color: C.sun, alpha: seg(p, 0.74, 0.88) });
          Art.text(g, 'Whole molecules.', 150, 100, { font: 'display', size: 30, color: C.sun, alpha: seg(p, 0.8, 0.94) });
        },
      },
    ],
  });

  /* ---------- Bench: dissolve it ---------- */
  const dis = { sub: 'salt', p: 0.35, playT: null, stage: null };
  dis.stage = Lab.stage('#c-dissolve', {
    h: 480, bg: 'lab', label: 'A beaker with a shrinking pile of crystals, and a magnified view of the crystal coming apart in water.',
    draw(g, t, dt, s) {
      if (dis.playT !== null) {
        dis.p = clamp(dis.p + dt / 7);
        Lab.$('#dis-p').value = Math.round(dis.p * 100); Lab.paintRange(Lab.$('#dis-p')); paintDis();
        if (dis.p >= 1) dis.playT = null;
      }
      const H = s.H, bench = H - 70;
      const left = 1 - dis.p;
      Art.beaker(g, 125, bench, 180, 260, { level: 0.72, liquid: dis.sub === 'salt' ? '#7CCBF1' : '#88D2F4' });
      crystals(g, 125, bench - 6, 118 * left + 4, 40 * left + 2, '#F4F2FA');
      Art.zoom(g, 148, bench - 40, 530, 244, 218, (gg, cx, cy) => (dis.sub === 'salt' ? saltView(gg, cx, cy, dis.p, t) : sugarView(gg, cx, cy, dis.p, t)));
      if (dis.sub === 'salt') { Art.text(g, 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)', 136, 60, { font: 'display', size: 22, color: C.sun, maxW: 250 }); }
      else { Art.text(g, 'C₁₂H₂₂O₁₁(s) → C₁₂H₂₂O₁₁(aq)', 136, 60, { font: 'display', size: 20, color: C.sun, maxW: 256 }); }
    },
  });
  function paintDis() {
    const P = dis.p;
    Lab.$('#dis-p-out').textContent = `${Math.round(P * 100)}%`;
    if (dis.sub === 'salt') {
      const free = SALT.filter((a) => P >= a.start + 0.11).length;
      Lab.$('#dis-a-label').textContent = 'Ions set free';
      Lab.$('#dis-a').textContent = `${free} of 12`;
      Lab.$('#dis-b-label').textContent = 'Charge of what is set free';
      Lab.$('#dis-b').textContent = 'Each one charged';
    } else {
      const free = SUGARS.filter((a) => P >= a.start + 0.15).length;
      Lab.$('#dis-a-label').textContent = 'Whole molecules set free';
      Lab.$('#dis-a').textContent = `${free} of 6`;
      Lab.$('#dis-b-label').textContent = 'Charge of what is set free';
      Lab.$('#dis-b').textContent = 'None at all';
    }
  }
  Lab.segmented('#dis-sub', (v) => { dis.sub = v; paintDis(); });
  Lab.bind('#dis-p', null, null, (v) => { dis.p = v / 100; dis.playT = null; paintDis(); });
  Lab.$('#dis-stir').addEventListener('click', () => {
    dis.p = 0; dis.playT = 0; Lab.sound.pop();
    if (Lab.reducedMotion) { dis.p = 1; dis.playT = null; Lab.$('#dis-p').value = 100; Lab.paintRange(Lab.$('#dis-p')); paintDis(); dis.stage.redraw(); }
  });

  /* ---------- Bench: conductivity tester ---------- */
  const CAT = (sym, ch, r) => (g, x, y) => Art.atom(g, x, y, r, sym, { charge: ch, label: sym });
  const H3O = (g, x, y) => shape(g, 'H3O', x, y, 17, { charge: '+' });
  const ACET = (g, x, y) => shape(g, 'Ac', x, y, 14, { charge: '-' });
  const NH4I = (g, x, y) => shape(g, 'NH4', x, y, 15, { charge: '+' });
  const OHI = (g, x, y) => shape(g, 'OH', x, y, 20, { charge: '-' });
  const CON = [
    { id: 'h2o', btn: 'Pure water', type: 'Almost non', kind: 'water', whole: (g, x, y, rot) => water(g, x, y, 22, rot) },
    { id: 'nacl', btn: 'Salt, NaCl', type: 'Strong electrolyte', kind: 'strong', cats: [CAT('Na', '+', 15)], ans: [CAT('Cl', '-', 24)], perUnit: 2, say: 'Every NaCl splits into Na⁺ and Cl⁻. Lots of ions means a bright bulb.' },
    { id: 'cacl2', btn: 'CaCl₂', type: 'Strong electrolyte', kind: 'strong', cats: [CAT('Ca', '2+', 18)], ans: [CAT('Cl', '-', 24), CAT('Cl', '-', 24)], perUnit: 3, say: 'Each CaCl₂ gives 3 ions, not 2, so it conducts better than NaCl at the same molarity.' },
    { id: 'hcl', btn: 'HCl', type: 'Strong electrolyte', kind: 'strong', cats: [H3O], ans: [CAT('Cl', '-', 24)], perUnit: 2, say: 'HCl is molecular, but as a strong acid it splits completely in water, giving H₃O⁺ and Cl⁻.' },
    { id: 'hac', btn: 'Vinegar acid', type: 'Weak electrolyte', kind: 'weak', K: 1.8e-5, cat: H3O, an: ACET, whole: (g, x, y, rot) => shape(g, 'HAc', x, y, 14, { rot }), say: 'Acetic acid, CH₃COOH, mostly stays whole. At 0.1 M only about 1 in 75 molecules splits. The drawing always shows one split so you can see it, which is more than the true share. The readout gives the real figure.' },
    { id: 'nh3', btn: 'Ammonia', type: 'Weak electrolyte', kind: 'weak', K: 1.8e-5, cat: NH4I, an: OHI, whole: (g, x, y, rot) => shape(g, 'NH3', x, y, 20, { rot }), say: 'NH₃ takes H⁺ from a few water molecules, making NH₄⁺ and OH⁻. Most of it stays as NH₃.' },
    { id: 'sugar', btn: 'Sugar', type: 'Nonelectrolyte', kind: 'non', whole: (g, x, y, rot) => sugar(g, x, y, 12, rot), say: 'Whole, uncharged molecules cannot carry current. However much you add, the bulb stays dark.' },
    { id: 'etoh', btn: 'Ethanol', type: 'Nonelectrolyte', kind: 'non', whole: (g, x, y, rot) => shape(g, 'EtOH', x, y, 13, { rot }), say: 'Ethanol dissolves well, as whole molecules with no ions, so it does not conduct.' },
  ];
  Lab.$('#con-sub').innerHTML = CON.map((c, i) => `<button type="button" data-value="${c.id}" aria-pressed="${i === 1}">${c.btn}</button>`).join('');
  const con = { cur: CON[1], c: 0.1, shownGlow: 0 };
  const concOf = (v) => Math.pow(10, lerp(-2, 0, v / 100));
  function ionsOf() {
    const s = con.cur, c = con.c;
    if (s.kind === 'strong') return { alpha: 1, ions: c * s.perUnit };
    if (s.kind === 'weak') { const x = (-s.K + Math.sqrt(s.K * s.K + 4 * s.K * c)) / 2; return { alpha: x / c, ions: 2 * x }; }
    if (s.kind === 'water') return { alpha: 0, ions: 2e-7 };
    return { alpha: 0, ions: 0 };
  }
  const glowOf = (ions) => (ions < 1e-6 ? 0 : clamp((Math.log10(ions) + 4) / 4.1));
  // The circuit, clockwise from the battery's negative end.
  const WIRE = [[294, 74], [430, 74], [510, 74], [610, 74], [610, 240]];
  const WIRE2 = [[190, 240], [190, 74], [226, 74]];
  function along(path, u) {
    let total = 0; const lens = [];
    for (let i = 0; i < path.length - 1; i++) { const d = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]); lens.push(d); total += d; }
    let at = u * total;
    for (let i = 0; i < lens.length; i++) { if (at <= lens[i]) { const k = at / lens[i]; return [lerp(path[i][0], path[i + 1][0], k), lerp(path[i][1], path[i + 1][1], k)]; } at -= lens[i]; }
    return path[path.length - 1];
  }
  const ION_SEEDS = Array.from({ length: 60 }, (_, i) => [(i * 0.618034 + 0.13) % 1, (i * 0.754877 + 0.37) % 1, rand(i + 13.1) * TAU]);
  Lab.stage('#c-conduct', {
    h: 540, bg: 'lab', label: 'A battery, bulb and two electrodes in a beaker. Ions drift to the electrodes and the bulb glows according to how many ions there are.',
    draw(g, t, dt, s) {
      const cur = con.cur, H = s.H, bench = H - 34;
      const { ions } = ionsOf();
      const target = glowOf(ions);
      con.shownGlow = lerp(con.shownGlow, target, Lab.reducedMotion ? 1 : clamp(dt * 6));
      const glow = con.shownGlow;
      // Wires.
      g.strokeStyle = '#B9B4CC'; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
      const strokePath = (P) => { g.beginPath(); P.forEach((q, i) => { if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.stroke(); };
      strokePath(WIRE); strokePath(WIRE2);
      // Battery.
      const bg1 = g.createLinearGradient(226, 0, 294, 0); bg1.addColorStop(0, '#FF5A6B'); bg1.addColorStop(0.6, '#FF5A6B'); bg1.addColorStop(0.6, '#22123A'); bg1.addColorStop(1, '#3B2763');
      g.fillStyle = bg1; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; Art.round(g, 222, 50, 76, 48, 8); g.fill(); g.stroke();
      Art.text(g, '+', 246, 73, { font: 'display', size: 30, color: '#fff' });
      Art.text(g, '−', 278, 73, { font: 'display', size: 30, color: '#fff' });
      // Bulb in the top wire.
      Art.bulb(g, 470, 54, 34, glow);
      // Electrons flow when current flows.
      if (glow > 0.02) {
        const sp = 0.06 + glow * 0.22;
        for (let i = 0; i < 8; i++) { const P = along(WIRE, (t * sp + i / 8) % 1); Art.electron(g, P[0], P[1], 5.5); }
        for (let i = 0; i < 4; i++) { const P = along(WIRE2, (t * sp + i / 4) % 1); Art.electron(g, P[0], P[1], 5.5); }
      }
      // Beaker with particles.
      const bw = 560, bh = 330, cx = 400;
      Art.beaker(g, cx, bench, bw, bh, {
        level: 0.84, liquid: C.water, ticks: false,
        inside(gg, b) {
          const W2 = b.x1 - b.x0, H2 = b.bottom - b.top;
          const n = Math.round(2 + 11 * Math.sqrt(con.c));
          let idx = 0;
          const pos = (i) => [b.x0 + 18 + ION_SEEDS[i][0] * (W2 - 36), b.top + 24 + ION_SEEDS[i][1] * (H2 - 48)];
          const driftOne = (i, dir, draw) => {
            const [x0, y0] = pos(i);
            const u = ((x0 - b.x0) / W2 + dir * t * 0.045) % 1;
            const x = b.x0 + ((u + 1) % 1) * W2;
            const edge = Math.min(seg(x, b.x0, b.x0 + 30), 1 - seg(x, b.x1 - 30, b.x1));
            gg.save(); gg.globalAlpha *= edge; draw(gg, x, y0 + wander(i, t) * 5); gg.restore();
          };
          const whole = (i, draw) => { const [x0, y0] = pos(i); draw(gg, x0 + wander(i, t) * 7, y0 + wander(i + 30, t) * 6, ION_SEEDS[i][2] + Math.sin(t * 0.5 + i) * 0.3); };
          if (cur.kind === 'strong') {
            for (let u = 0; u < n; u++) {
              cur.cats.forEach((f) => driftOne(idx++, 1, f));
              cur.ans.forEach((f) => driftOne(idx++, -1, f));
            }
          } else if (cur.kind === 'weak') {
            for (let u = 0; u < n - 1; u++) whole(idx++, cur.whole);
            driftOne(idx++, 1, cur.cat); driftOne(idx++, -1, cur.an);
          } else if (cur.kind === 'water') {
            for (let u = 0; u < 12; u++) whole(idx++, cur.whole);
          } else {
            for (let u = 0; u < n; u++) whole(idx++, cur.whole);
          }
        },
      });
      // Electrodes on top of the liquid.
      const rod = (x, col, sign) => {
        g.fillStyle = '#5E5A7B'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
        Art.round(g, x - 11, 240, 22, bench - 262, 6); g.fill(); g.stroke();
        g.fillStyle = col; g.beginPath(); g.arc(x, 262, 15, 0, TAU); g.fill(); g.stroke();
        Art.text(g, sign, x, 262, { font: 'display', size: 24, color: '#fff' });
      };
      rod(190, '#FF3D7F', '+'); rod(610, '#1FA5FF', '−');
      Art.text(g, cur.kind === 'non' || cur.kind === 'water' ? 'No current' : glow > 0.68 ? 'Bright' : 'Dim', 640, 54, { font: 'display', size: 34, color: glow > 0.02 ? C.sun : C.dim });
    },
  });
  function paintCon() {
    const s = con.cur, { alpha, ions } = ionsOf();
    Lab.$('#con-c-out').textContent = s.kind === 'water' ? 'pure' : `${Lab.sig(con.c, 2)} M`;
    Lab.$('#con-type').textContent = s.type;
    Lab.$('#con-frac').textContent = s.kind === 'strong' ? 'All of it' : s.kind === 'weak' ? `About ${Lab.sig(alpha * 100, 2)}%` : s.kind === 'water' ? 'Almost none' : 'None';
    Lab.$('#con-ions').textContent = s.kind === 'water' ? 'About 2 × 10⁻⁷ M' : s.kind === 'non' ? '0 M' : `${Lab.sig(ions, 2)} M`;
    Lab.$('#con-foot').innerHTML = Lab.texString(`<p>${s.say || 'Pure water has almost no ions, only about 2 in every billion molecules, so the bulb stays dark. Tap water does conduct, thanks to dissolved minerals.'}</p><p>Positive ions drift toward the negative electrode and negative ions toward the positive one, which completes the circuit. A simplified model: brightness is scaled so that small currents still show.</p>`);
  }
  Lab.segmented('#con-sub', (v) => { con.cur = CON.find((c) => c.id === v); paintCon(); });
  Lab.bind('#con-c', null, null, (v) => { con.c = concOf(v); paintCon(); });

  /* ---------- Story 2: making a solution ---------- */
  function sack(g, x, y, s, label, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    const gr = g.createRadialGradient(-14, -14, 6, 0, 8, 62);
    gr.addColorStop(0, '#E7C794'); gr.addColorStop(1, '#A87D4E');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-16, -38); g.bezierCurveTo(-54, -18, -52, 44, -28, 48); g.lineTo(28, 48); g.bezierCurveTo(52, 44, 54, -18, 16, -38); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#C69C66'; g.beginPath(); g.moveTo(-16, -38); g.quadraticCurveTo(-26, -56, -13, -54); g.lineTo(13, -54); g.quadraticCurveTo(26, -56, 16, -38); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = C.pink; g.lineWidth = 5; g.beginPath(); g.moveTo(-17, -38); g.lineTo(17, -38); g.stroke();
    g.restore();
    if (label) Art.text(g, label, x, y + 8 * s, { font: 'display', size: o.size || 26, color: '#3A2412', alpha: o.alpha });
  }
  /** Volumetric flask. o.surface is the liquid's y. Returns the y of the calibration mark. */
  function volFlask(g, cx, baseY, w, h, o = {}) {
    const r = w / 2, cy = baseY - r * 0.9, top = baseY - h, nw = w * 0.16, mark = top + (h - 2 * r) * 0.32;
    const body = new Path2D();
    body.moveTo(cx - nw / 2 - 5, top); body.lineTo(cx - nw / 2, top + 6); body.lineTo(cx - nw / 2, cy - r * 0.86);
    body.bezierCurveTo(cx - nw / 2, cy - r * 0.62, cx - r, cy - r * 0.55, cx - r, cy);
    body.bezierCurveTo(cx - r, cy + r * 0.62, cx - r * 0.7, baseY, cx - r * 0.5, baseY);
    body.lineTo(cx + r * 0.5, baseY);
    body.bezierCurveTo(cx + r * 0.7, baseY, cx + r, cy + r * 0.62, cx + r, cy);
    body.bezierCurveTo(cx + r, cy - r * 0.55, cx + nw / 2, cy - r * 0.62, cx + nw / 2, cy - r * 0.86);
    body.lineTo(cx + nw / 2, top + 6); body.lineTo(cx + nw / 2 + 5, top);
    g.fillStyle = 'rgba(214,240,255,.07)'; g.fill(body);
    if (o.surface !== undefined) {
      g.save(); g.clip(body);
      g.fillStyle = Art.alpha(o.liquid || C.water, 0.85); g.fillRect(cx - r - 4, o.surface, w + 8, baseY - o.surface + 2);
      if (o.inside) o.inside(g, { x0: cx - r, x1: cx + r, top: o.surface, bottom: baseY });
      g.fillStyle = 'rgba(255,255,255,.26)'; g.fillRect(cx - r - 4, o.surface, w + 8, 3);
      g.restore();
    }
    g.lineJoin = 'round'; g.strokeStyle = 'rgba(18,7,40,.6)'; g.lineWidth = 6.4; g.stroke(body);
    g.strokeStyle = C.glass; g.lineWidth = 3.4; g.stroke(body);
    g.strokeStyle = o.markColor || C.sun; g.lineWidth = 3.5; g.beginPath(); g.moveTo(cx - nw / 2 - 7, mark); g.lineTo(cx + nw / 2 + 7, mark); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(cx - r * 0.5, cy - r * 0.15, r * 0.14, r * 0.34, 0.5, 0, TAU); g.fill();
    return { mark, top, cy, r };
  }
  const dotsIn = (g, b, n, t, color, seed = 1, r = 5) => {
    for (let i = 0; i < n; i++) {
      const x = b.x0 + 12 + rand(i + seed) * (b.x1 - b.x0 - 24) + wander(i, t) * 3, y = b.top + 8 + rand(i + seed + 40) * Math.max(4, b.bottom - b.top - 14) + wander(i + 9, t) * 3;
      Art.ball(g, x, y, r, color);
    }
  };
  Lab.story('#story-make', {
    title: 'Making a solution properly',
    bg: 'lab',
    scenes: [
      {
        say: '<b>Molarity</b> is moles of solute per liter of solution. Put 1 mole of solute in enough water to make 1 liter, and you have a <b>1.00 M</b> solution. Say it "one molar".',
        dur: 3.4,
        draw(g, p, t, { H }) {
          const bench = H - 70;
          const lvl = 0.72;
          Art.beaker(g, 230, bench, 250, 290, { level: lvl, liquid: '#7CCBF1', inside(gg, b) { dotsIn(gg, b, Math.floor(16 * seg(p, 0.3, 0.7)), t, C.pink, 3, 8); } });
          Art.text(g, '1 L', 230, bench - 228, { size: 30, color: '#fff', alpha: seg(p, 0.05, 0.2), halo: true });
          const q = ease.back(seg(p, 0.02, 0.2));
          if (q > 0) sack(g, 460, 110, 1.1 * q, '1 mol', { size: 26, alpha: clamp(q) });
          Art.arrow(g, 410, 130, 340, 170, { color: C.pink, w: 6, p: seg(p, 0.2, 0.32) });
          const a = seg(p, 0.55, 0.75);
          Art.text(g, '1.00 M', 590, 200, { font: 'display', size: 76, color: C.sun, alpha: a });
          Art.text(g, '= 1.00 mol per liter', 590, 266, { size: 28, alpha: seg(p, 0.65, 0.85) });
          Art.moe(g, 690, bench, 96, 'point', { t, flip: true });
        },
      },
      {
        say: 'Same mole, half the volume: now it is <b>2.00 M</b>. Compare equal peeks into each beaker. Molarity is really about <b>how crowded</b> the solute is, and not how much solution you have.',
        dur: 3.8,
        draw(g, p, t, { H }) {
          const bench = H - 70;
          Art.beaker(g, 130, bench, 170, 240, { level: 0.8, liquid: '#7CCBF1' });
          Art.beaker(g, 670, bench, 170, 240, { level: 0.4, liquid: '#58B2E6' });
          Art.text(g, '1.00 L', 130, bench - 110, { size: 26, color: '#fff', halo: true });
          Art.text(g, '0.50 L', 670, bench - 42, { size: 26, color: '#fff', halo: true });
          const crowd = (gg, cx, cy, n) => { for (let i = 0; i < n; i++) { const a = i * 2.39996, d = Math.sqrt((i + 0.5) / n) * 84; Art.atom(gg, cx + Math.cos(a) * d + wander(i, t) * 3, cy + Math.sin(a) * d + wander(i + 9, t) * 3, 14, 'Na', { label: false }); } };
          Art.zoom(g, 160, bench - 80, 292, 146, 104, (gg, cx, cy) => crowd(gg, cx, cy, Math.ceil(8 * seg(p, 0.15, 0.5))), { p: seg(p, 0.05, 0.25), rim: C.cyan });
          Art.zoom(g, 640, bench - 60, 508, 146, 104, (gg, cx, cy) => crowd(gg, cx, cy, Math.ceil(16 * seg(p, 0.35, 0.7))), { p: seg(p, 0.25, 0.45), rim: C.cyan });
          const a = seg(p, 0.5, 0.65), b = seg(p, 0.7, 0.85);
          Art.text(g, '1.00 M', 292, 292, { font: 'display', size: 46, color: C.sun, alpha: a });
          Art.text(g, '2.00 M', 508, 292, { font: 'display', size: 46, color: C.sun, alpha: b });
          Art.text(g, 'Same mole in each', 402, 346, { size: 26, alpha: seg(p, 0.8, 0.95) });
        },
      },
      {
        say: 'Now make one for real. To make 1.00 L of 1.00 M NaCl, you need 1.00 mol. Multiply by the molar mass: 1.00 mol × 58.44 g/mol = <b>58.44 g</b>. Weigh it out.',
        dur: 3,
        draw(g, p, t, { H }) {
          const bench = H - 70;
          const m = 58.44 * ease.out(seg(p, 0.15, 0.75));
          const sc = Art.digitalScale(g, 260, bench + 2, 300, `${m.toFixed(2)} g`, { size: 24 });
          const k = seg(p, 0.15, 0.75);
          g.fillStyle = '#F4F2FA'; g.strokeStyle = 'rgba(26,15,46,.5)'; g.lineWidth = 2.5;
          g.beginPath(); g.moveTo(260 - 100 * k, sc.top); g.quadraticCurveTo(260, sc.top - 130 * k, 260 + 100 * k, sc.top); g.closePath(); g.fill(); g.stroke();
          crystals(g, 260, sc.top - 3, 170 * k, 76 * k, '#F4F2FA');
          fo(g, 'NaCl', 260, 94, { size: 50, colorize: true });
          Art.text(g, '1.00 mol × 58.44 g/mol', 590, 170, { size: 28, alpha: seg(p, 0.1, 0.3) });
          Art.text(g, '= 58.44 g', 590, 226, { font: 'display', size: 54, color: C.sun, alpha: seg(p, 0.6, 0.8) });
        },
      },
      {
        say: 'Tip it into a <b>volumetric flask</b>, a flask with one exact mark on the neck. Add water until it is about half full, then swirl until all the salt has dissolved.',
        dur: 4,
        draw(g, p, t, { H }) {
          const bench = H - 70;
          const fw = 300, fh = 350, cx = 300;
          const tilt = Math.sin(seg(p, 0.55, 0.95) * PI * 4) * 0.05;
          const surfaceTop = bench - 150 * ease.inOut(seg(p, 0.25, 0.55));
          g.save(); g.translate(cx, bench); g.rotate(tilt); g.translate(-cx, -bench);
          volFlask(g, cx, bench, fw, fh, {
            surface: surfaceTop, liquid: '#7CCBF1',
            inside(gg, b) {
              const left = 1 - seg(p, 0.55, 0.95);
              crystals(gg, cx, bench - 4, 130 * left, 40 * left, '#F4F2FA');
              dotsIn(gg, b, Math.floor(18 * seg(p, 0.55, 0.95)), t, '#FFFFFF', 7, 3.2);
            },
          });
          g.restore();
          if (p < 0.25) { // Salt going in through a funnel.
            for (let i = 0; i < 12; i++) { const ph = (t * 1.3 + rand(i)) % 1; g.fillStyle = '#F4F2FA'; g.fillRect(cx - 8 + rand(i + 3) * 16, lerp(72, bench - 30, ph), 6, 6); }
          }
          if (p >= 0.25 && p < 0.55) { g.strokeStyle = C.water; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, 60); g.lineTo(cx, surfaceTop); g.stroke(); }
          Art.text(g, 'Add the salt', 610, 120, { font: 'display', size: 32, color: p < 0.25 ? C.sun : C.dim });
          Art.text(g, 'Add some water', 610, 180, { font: 'display', size: 32, color: p >= 0.25 && p < 0.55 ? C.sun : C.dim, alpha: seg(p, 0.2, 0.3) });
          Art.text(g, 'Swirl to dissolve', 610, 240, { font: 'display', size: 32, color: p >= 0.55 ? C.sun : C.dim, alpha: seg(p, 0.5, 0.6) });
        },
      },
      {
        say: 'Now add water slowly until the liquid reaches the mark. That mark means exactly <b>1.00 L of solution</b>. Mix once more, and you have <b>1.00 M</b> NaCl.',
        dur: 3.6,
        draw(g, p, t, { H }) {
          const bench = H - 70;
          const cx = 300, fw = 300, fh = 350;
          const top = bench - fh, mark = top + (fh - fw) * 0.32;
          const q = ease.inOut(seg(p, 0.05, 0.7));
          const y = lerp(bench - 150, mark, q);
          const m = volFlask(g, cx, bench, fw, fh, { surface: y, liquid: '#7CCBF1', inside(gg, b) { dotsIn(gg, b, 18, t, '#FFFFFF', 7, 3.2); } });
          if (q < 1 && q > 0) { g.strokeStyle = C.water; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, top - 26); g.lineTo(cx, y); g.stroke(); }
          Art.arrow(g, 470, m.mark, 345, m.mark, { color: C.sun, w: 5, p: seg(p, 0.4, 0.6) });
          Art.text(g, 'Fill to here', 590, m.mark, { font: 'display', size: 30, color: C.sun, alpha: seg(p, 0.4, 0.6) });
          Art.text(g, '1.00 L total', 590, m.mark + 46, { size: 26, alpha: seg(p, 0.5, 0.7) });
          const a = ease.back(seg(p, 0.72, 0.9));
          if (a > 0) { g.save(); g.translate(590, 232); g.scale(a, a); g.fillStyle = C.pink; Art.round(g, -130, -44, 260, 88, 26); g.fill(); Art.text(g, '1.00 M', 0, 2, { font: 'display', size: 54, color: '#fff' }); g.restore(); }
          Art.moe(g, 690, bench, 88, 'cheer', { t, flip: true });
        },
      },
      {
        say: 'Here is the classic mistake: measuring out 1.00 L of water and then adding salt. The salt takes up room, so you end up <b>above the mark</b>, and the solution is a little under 1.00 M.',
        dur: 3.6,
        draw(g, p, t, { H }) {
          const bench = H - 70;
          const fw = 236, fh = 296, top = bench - fh;
          const mark = top + (fh - fw) * 0.32;
          volFlask(g, 200, bench, fw, fh, { surface: mark, liquid: '#7CCBF1', markColor: C.leaf });
          const y = lerp(mark, mark - 22, ease.out(seg(p, 0.25, 0.7)));
          volFlask(g, 600, bench, fw, fh, { surface: y, liquid: '#7CCBF1', markColor: C.red });
          Art.text(g, 'Water added up to the mark', 200, 24, { size: 24, color: C.leaf, alpha: seg(p, 0.02, 0.2) });
          Art.text(g, '1.00 L of water, then salt', 600, 24, { size: 24, color: C.red, alpha: seg(p, 0.1, 0.3) });
          Art.ring(g, 600, mark - 10, 32, { color: C.red, w: 5, p: seg(p, 0.6, 0.8) });
          Art.text(g, 'Right', 200, 290, { font: 'display', size: 40, color: '#1A0F2E', alpha: seg(p, 0.1, 0.3) });
          Art.text(g, 'Too much', 600, 290, { font: 'display', size: 40, color: '#1A0F2E', alpha: seg(p, 0.7, 0.86) });
          Art.moe(g, 400, bench, 110, 'oops', { t });
        },
      },
    ],
  });

  /* ---------- Bench: molarity beaker ---------- */
  const SOLS = {
    CuSO4: { name: 'CuSO₄', color: '#1F86E0', ions: [['Cu', '2+', 15, 1], ['SO4', '2-', 0, 1]] },
    NiCl2: { name: 'NiCl₂', color: '#36B56A', ions: [['Ni', '2+', 15, 1], ['Cl', '-', 19, 2]] },
    CoCl2: { name: 'CoCl₂', color: '#E8528F', ions: [['Co', '2+', 15, 1], ['Cl', '-', 19, 2]] },
    NaCl: { name: 'NaCl', color: '#BFE7FA', ions: [['Na', '+', 13, 1], ['Cl', '-', 19, 1]] },
  };
  const mo = { sub: 'CuSO4', n: 0.25, V: 1, showM: 0.25, showV: 1, target: undefined, hit: false };
  const TG = [0.25, 0.5, 1, 0.2, 0.4, 0.75];
  const PEEK = Array.from({ length: 45 }, (_, i) => { const a = i * 2.39996 + 0.4, d = Math.sqrt((i + 0.5) / 45) * 136; return [Math.cos(a) * d, Math.sin(a) * d, rand(i * 3.7 + 1)]; }).sort((a, b) => a[2] - b[2]);
  const drawIon = (g, ion, x, y, t) => {
    if (ion[0] === 'SO4') shape(g, 'SO4', x, y, 13, { charge: ion[1] });
    else Art.atom(g, x, y, ion[2], ion[0], { charge: ion[1], label: ion[0] });
  };
  Lab.stage('#c-molar', {
    h: 480, bg: 'lab', label: 'A beaker of colored solution beside a magnified peek at it. More solute or less volume crowds the peek and deepens the color.',
    draw(g, t, dt, s) {
      const S = SOLS[mo.sub], bench = s.H - 70, M = mo.n / mo.V;
      mo.showM = lerp(mo.showM, M, Lab.reducedMotion ? 1 : clamp(dt * 7));
      mo.showV = lerp(mo.showV, mo.V, Lab.reducedMotion ? 1 : clamp(dt * 7));
      const intensity = clamp(0.12 + Math.pow(mo.showM / 1.25, 0.7) * 0.88);
      const liquid = Art.mix('#CFEAF7', S.color, intensity);
      const bw = 260, bh = 310, cx = 165;
      const b = Art.beaker(g, cx, bench, bw, bh, { level: (mo.showV / 2) * 0.92, liquid, ticks: false });
      // Volume scale.
      [0.5, 1, 1.5, 2].forEach((v) => {
        const y = bench - (bh - 12) * (v / 2) * 0.92;
        g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(b.x1 - 4, y); g.lineTo(b.x1 - 26, y); g.stroke();
        Art.text(g, `${Lab.fmt(v, 1)} L`, b.x1 + 8, y, { size: 22, align: 'left', color: C.ink, halo: true });
      });
      // The peek.
      const px = 520, py = 196, R = 164;
      const fu = Math.max(1, Math.round(mo.showM * 12));
      Art.zoom(g, cx + 50, bench - 90, px, py, R, (gg, x, y) => {
        let k = 0;
        for (let u = 0; u < fu; u++) {
          S.ions.forEach((ion) => {
            for (let c = 0; c < ion[3]; c++) {
              if (k >= PEEK.length) return;
              drawIon(gg, ion, x + PEEK[k][0] + wander(k, t) * 4, y + PEEK[k][1] + wander(k + 40, t) * 4, t);
              k++;
            }
          });
        }
      });
      // The number.
      const hitting = mo.target !== undefined && Math.abs(M - mo.target) < 1e-6;
      Art.text(g, `${Lab.fmt(mo.showM, 3)} M`, 520, 402, { font: 'display', size: 56, color: hitting ? C.leaf : C.sun, halo: true });
      if (mo.target !== undefined) Art.text(g, `Target: ${Lab.fmt(mo.target, 3)} M`, 165, 40, { font: 'display', size: 28, color: C.sun, halo: true });
      Art.moe(g, 744, bench + 2, 96, hitting ? 'cheer' : 'happy', { t, flip: true });
    },
  });
  function paintMo() {
    const S = SOLS[mo.sub], M = mo.n / mo.V, mm = Bank.molarMass(mo.sub), grams = mo.n * mm, F = `\\ce{${mo.sub}}`;
    Lab.$('#mol-n-out').textContent = `${Lab.fmt(mo.n, 2)} mol`;
    Lab.$('#mol-v-out').textContent = `${Lab.fmt(mo.V, 2)} L`;
    Lab.$('#mol-calc').innerHTML = Lab.texString(`<p>$M = \\dfrac{${Lab.fmt(mo.n, 2)}\\text{ mol}}{${Lab.fmt(mo.V, 2)}\\text{ L}} = \\mathbf{${Lab.fmt(M, 3)}\\text{ M}}$. To make it, weigh out $${Lab.fmt(mo.n, 2)}\\ \\cancel{\\text{mol}} \\times \\dfrac{${mm.toFixed(2)}\\text{ g}}{1\\ \\cancel{\\text{mol}}} = ${Lab.fmt(grams, 1)}\\text{ g}$ of $${F}$.</p><p>The peek always shows the same small volume. It shows crowding, not true counts. ${S.color === '#BFE7FA' ? 'Salt water is clear, so you could not judge this one by eye.' : 'The color deepens because more colored ions sit in each bit of liquid.'}</p>`);
    if (mo.target !== undefined && !mo.hit && Math.abs(M - mo.target) < 1e-6) { mo.hit = true; Lab.collection.award(1); }
  }
  Lab.segmented('#mol-sub', (v) => { mo.sub = v; paintMo(); });
  Lab.bind('#mol-n', null, null, (v) => { mo.n = v; paintMo(); });
  Lab.bind('#mol-v', null, null, (v) => { mo.V = v; paintMo(); });
  Lab.$('#mol-target').addEventListener('click', () => {
    let c; do { c = TG[Math.floor(Math.random() * TG.length)]; } while (Math.abs(mo.n / mo.V - c) < 1e-6);
    mo.target = c; mo.hit = false; Lab.$('#mol-target').textContent = 'New target'; Lab.sound.pop(); paintMo();
  });

  /* ---------- Bench: dilution ---------- */
  const dl = { M1: 1, V1: 100, W: 100, showV: 200, showM: 0.5, target: undefined, hit: false };
  const DOTS = Array.from({ length: 22 }, (_, i) => [rand(i + 0.7), rand(i + 11.3)]);
  const dilColor = (M) => Art.mix('#D6EEFA', '#1F86E0', clamp(0.1 + Math.pow(M / 1.25, 0.7) * 0.9));
  const dotsOf = (M1, V1) => Math.max(2, Math.round((M1 * (V1 / 1000)) / 0.3125 * 20));
  function dilBeaker(g, cx, bench, vol, M, n, t) {
    const bw = 230, bh = 280, level = (vol / 1000) * 0.92;
    const b = Art.beaker(g, cx, bench, bw, bh, {
      level, liquid: dilColor(M), ticks: false,
      inside(gg, box) {
        const H2 = box.bottom - box.top;
        for (let i = 0; i < n; i++) {
          const x = box.x0 + 18 + DOTS[i][0] * (box.x1 - box.x0 - 36) + wander(i, t) * 3, y = box.top + Math.min(8, H2 * 0.4) + DOTS[i][1] * Math.max(1, H2 - Math.min(16, H2 * 0.8)) + wander(i + 9, t) * 1.5;
          Art.ball(gg, x, y, 8, '#D98A4A');
        }
      },
    });
    return b;
  }
  Lab.stage('#c-dilute', {
    h: 480, bg: 'lab', label: 'Two beakers. The stock on the left and the diluted solution on the right hold the same number of dots, spread through more water.',
    draw(g, t, dt, s) {
      const bench = s.H - 70, V2 = dl.V1 + dl.W, M2 = (dl.M1 * dl.V1) / V2;
      const before = dl.showV;
      dl.showV = lerp(dl.showV, V2, Lab.reducedMotion ? 1 : clamp(dt * 5));
      dl.showM = (dl.M1 * dl.V1) / dl.showV;
      const n = dotsOf(dl.M1, dl.V1);
      Art.text(g, 'Stock', 180, 34, { font: 'display', size: 34, color: C.cyan });
      Art.text(g, 'Diluted', 620, 34, { font: 'display', size: 34, color: C.pink });
      dilBeaker(g, 180, bench, dl.V1, dl.M1, n, t);
      const b2 = dilBeaker(g, 620, bench, dl.showV, dl.showM, n, t);
      // Water pours in while the volume grows.
      if (dl.showV - before > 0.15) {
        g.strokeStyle = C.water; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(620, 74); g.lineTo(620, b2.surface); g.stroke();
      }
      Art.arrow(g, 318, 240, 482, 240, { color: C.pink, w: 8 });
      Art.text(g, `+ ${dl.W} mL water`, 400, 206, { font: 'display', size: 26, color: C.water, halo: true });
      Art.text(g, `${Lab.fmt(dl.M1, 2)} M`, 180, 76, { font: 'display', size: 34, color: C.sun, halo: true });
      Art.text(g, `${dl.V1} mL`, 180, bench + 34, { font: 'display', size: 28, color: C.ink });
      const hit = dl.target !== undefined && Math.abs(M2 - dl.target) < 0.005;
      Art.text(g, `${Lab.fmt(dl.showM, 3)} M`, 720, 76, { font: 'display', size: 34, color: hit ? C.leaf : C.sun, halo: true });
      Art.text(g, `${V2} mL`, 620, bench + 34, { font: 'display', size: 28, color: C.ink });
      // Same moles.
      const mol = (dl.M1 * dl.V1) / 1000;
      Art.text(g, `${Lab.sig(mol, 3)} mol`, 400, 282, { font: 'display', size: 34, color: C.leaf, halo: true });
      Art.text(g, 'in both', 400, 316, { size: 24, color: C.leaf, halo: true });
      Art.text(g, `${n} dots in both`, 400, bench + 34, { size: 25, color: C.dim });
      if (dl.target !== undefined) Art.text(g, `Target: ${Lab.fmt(dl.target, 3)} M`, 400, 88, { font: 'display', size: 26, color: C.sun, halo: true });
      Art.moe(g, 400, 408, 72, hit ? 'cheer' : 'happy', { t });
    },
  });
  function paintDl() {
    const V2 = dl.V1 + dl.W, M2 = (dl.M1 * dl.V1) / V2;
    Lab.$('#dil-m-out').textContent = `${Lab.fmt(dl.M1, 2)} M`;
    Lab.$('#dil-v-out').textContent = `${dl.V1} mL`;
    Lab.$('#dil-w-out').textContent = `${dl.W} mL`;
    Lab.$('#dil-calc').innerHTML = Lab.texString(`<p>Before: $M_1V_1 = ${Lab.fmt(dl.M1, 2)}\\text{ M} \\times ${dl.V1}\\text{ mL}$. After: $V_2 = ${dl.V1} + ${dl.W} = ${V2}\\text{ mL}$.</p><p>$M_2 = \\dfrac{M_1V_1}{V_2} = \\dfrac{${Lab.fmt(dl.M1, 2)}\\text{ M} \\times ${dl.V1}\\ \\cancel{\\text{mL}}}{${V2}\\ \\cancel{\\text{mL}}} = \\mathbf{${Lab.fmt(M2, 3)}\\text{ M}}$.</p>`);
    if (dl.target !== undefined && !dl.hit && Math.abs(M2 - dl.target) < 0.005) { dl.hit = true; Lab.collection.award(1); }
  }
  Lab.bind('#dil-m', null, null, (v) => { dl.M1 = v; paintDl(); });
  Lab.bind('#dil-v', null, null, (v) => { dl.V1 = v; paintDl(); });
  Lab.bind('#dil-w', null, null, (v) => { dl.W = v; paintDl(); });
  Lab.$('#dil-target').addEventListener('click', () => {
    const opts = [0.1, 0.125, 0.2, 0.25, 0.4, 0.5];
    let c; do { c = opts[Math.floor(Math.random() * opts.length)]; } while (Math.abs((dl.M1 * dl.V1) / (dl.V1 + dl.W) - c) < 0.005 || c >= dl.M1);
    dl.target = c; dl.hit = false; Lab.$('#dil-target').textContent = 'New target'; Lab.sound.pop(); paintDl();
  });

  /* ---------- Story 3: counting ions ---------- */
  const alI = (g, x, y, r, o = {}) => Art.atom(g, x, y, r, 'Al', Object.assign({ charge: '3+', label: 'Al' }, o));
  const so4 = (g, x, y, s) => shape(g, 'SO4', x, y, s, { charge: '2-', labels: s >= 18 });
  const AS = [[-74, 0], [74, 0]], SS = [[0, -94], [-130, 86], [130, 86]];
  Lab.story('#story-ions', {
    title: 'One formula, many ions',
    scenes: [
      {
        say: 'Read the formula. $\\ce{Al2(SO4)3}$ holds <b>2 aluminum ions</b> and <b>3 sulfate ions</b>. The subscript 3 applies to the whole sulfate group.',
        dur: 3,
        draw(g, p, t, { W }) {
          fo(g, 'Al2(SO4)3', W / 2, 54, { size: 58, colorize: true });
          const q = ease.back(seg(p, 0.1, 0.45));
          if (q > 0) {
            g.save(); g.translate(400, 256); g.scale(q, q);
            AS.forEach(([x, y]) => alI(g, x, y, 34));
            SS.forEach(([x, y]) => so4(g, x, y, 28));
            g.restore();
          }
          const r1 = seg(p, 0.52, 0.72), r2 = seg(p, 0.66, 0.86);
          Art.text(g, '2 Al³⁺', 130, 230, { font: 'display', size: 40, color: C.sun, alpha: r1 });
          Art.text(g, '3 SO₄²⁻', 670, 230, { font: 'display', size: 40, color: C.sun, alpha: r2 });
        },
      },
      {
        say: 'Put it in water, and water pulls it apart into ions. Notice that each <b>sulfate stays in one piece</b>. Polyatomic ions do not break up when they dissolve.',
        dur: 3.8,
        draw(g, p, t, { W }) {
          const q = ease.inOut(seg(p, 0.12, 0.72));
          const destA = [[150, 140], [150, 320]], destS = [[440, 110], [620, 240], [440, 340]];
          AS.forEach(([x, y], i) => { alI(g, lerp(400 + x * 0.8, destA[i][0], q) + wander(i, t) * 4 * q, lerp(226 + y, destA[i][1], q) + wander(i + 6, t) * 4 * q, 34, { face: q > 0.8 ? 'happy' : null, t, seed: i, look: [1, 0] }); });
          SS.forEach(([x, y], i) => so4(g, lerp(400 + x * 0.8, destS[i][0], q) + wander(i + 3, t) * 4 * q, lerp(226 + y * 0.8, destS[i][1], q) + wander(i + 12, t) * 4 * q, 30));
          const a = seg(p, 0.76, 0.92);
          fo(g, 'Al2(SO4)3 -> 2Al^3+ + 3SO4^2-', W / 2, 416, { size: 36, colorize: true, alpha: a, halo: true });
          Art.ring(g, 620, 240, 70, { color: C.sun, w: 5, p: seg(p, 0.72, 0.9) });
          Art.text(g, 'Still whole', 710, 150, { size: 26, color: C.sun, alpha: seg(p, 0.8, 0.94) });
          void W;
        },
      },
      {
        say: 'The coefficients work at any scale. One mole of $\\ce{Al2(SO4)3}$ gives <b>2 mol of Al³⁺</b> and <b>3 mol of SO₄²⁻</b>. That is 5 moles of ions from 1 mole of compound.',
        dur: 3.4,
        draw(g, p, t) {
          const y = 196;
          const q = (a, b) => ease.back(seg(p, a, b));
          const sk = (x, a, b, lab, c) => { const s = q(a, b); if (s > 0) sack(g, x, y, 1 * s, lab, { size: 23, alpha: clamp(s) }); void c; };
          sk(78, 0.02, 0.2, '1 mol');
          Art.arrow(g, 134, y, 188, y, { color: C.pink, w: 7, p: seg(p, 0.16, 0.28) });
          sk(246, 0.24, 0.4, '1 mol'); sk(354, 0.3, 0.46, '1 mol');
          Art.text(g, '+', 424, y, { font: 'display', size: 44, color: C.dim, alpha: seg(p, 0.4, 0.5) });
          sk(492, 0.44, 0.6, '1 mol'); sk(600, 0.5, 0.66, '1 mol'); sk(708, 0.56, 0.72, '1 mol');
          fo(g, 'Al2(SO4)3', 78, 300, { size: 26, colorize: true, alpha: seg(p, 0.06, 0.2) });
          fo(g, '2Al^3+', 300, 300, { size: 34, colorize: true, alpha: seg(p, 0.3, 0.46) });
          fo(g, '3SO4^2-', 600, 300, { size: 34, colorize: true, alpha: seg(p, 0.56, 0.72) });
          const a = seg(p, 0.76, 0.92);
          if (a > 0) { g.fillStyle = Art.alpha(C.pink, a); Art.round(g, 160, 352, 480, 66, 24); g.fill(); Art.text(g, '5 mol of ions in all', 400, 386, { font: 'display', size: 40, color: '#fff', alpha: a }); }
          void t;
        },
      },
      {
        say: 'So in <b>0.10 M</b> $\\ce{Al2(SO4)3}$, the Al³⁺ is <b>0.20 M</b> and the SO₄²⁻ is <b>0.30 M</b>. Check the charges: 2 × 3+ is 6+, and 3 × 2− is 6−. The solution stays neutral.',
        dur: 3.8,
        draw(g, p, t) {
          Art.text(g, '0.10 M', 400, 52, { font: 'display', size: 52, color: C.sun });
          fo(g, 'Al2(SO4)3', 400, 104, { size: 36, colorize: true });
          const BX = 200, BW = 520, a = ease.inOut(seg(p, 0.14, 0.44)), b = ease.inOut(seg(p, 0.34, 0.64));
          fo(g, 'Al^3+', 100, 204, { size: 40, colorize: true });
          g.fillStyle = 'rgba(255,255,255,.08)'; Art.round(g, BX, 176, BW, 56, 14); g.fill();
          g.fillStyle = C.cyan; Art.round(g, BX, 176, Math.max(8, BW * (0.2 / 0.3) * a), 56, 14); g.fill();
          Art.text(g, '0.10 × 2 = 0.20 M', BX + 16, 204, { font: 'display', size: 30, align: 'left', color: '#1A0F2E', alpha: seg(p, 0.34, 0.46) });
          fo(g, 'SO4^2-', 100, 290, { size: 36, colorize: true });
          g.fillStyle = 'rgba(255,255,255,.08)'; Art.round(g, BX, 262, BW, 56, 14); g.fill();
          g.fillStyle = C.pink; Art.round(g, BX, 262, Math.max(8, BW * b), 56, 14); g.fill();
          Art.text(g, '0.10 × 3 = 0.30 M', BX + 16, 290, { font: 'display', size: 30, align: 'left', color: '#fff', alpha: seg(p, 0.54, 0.66) });
          const c = seg(p, 0.72, 0.9);
          Art.text(g, 'Charges: 6+ and 6−. Balanced.', 400, 376, { font: 'display', size: 34, color: C.leaf, alpha: c });
          Art.moe(g, 738, 448, 76, 'happy', { t, flip: true });
        },
      },
    ],
  });

  /* ---------- Bench: ion counter ---------- */
  const ION = [
    { f: 'NaCl', btn: 'NaCl', c: ['Na', '+', 1, 'Na^+'], a: ['Cl', '-', 1, 'Cl^-'] },
    { f: 'CaCl2', btn: 'CaCl₂', c: ['Ca', '2+', 1, 'Ca^2+'], a: ['Cl', '-', 2, 'Cl^-'] },
    { f: 'FeCl3', btn: 'FeCl₃', c: ['Fe', '3+', 1, 'Fe^3+'], a: ['Cl', '-', 3, 'Cl^-'] },
    { f: 'Na2SO4', btn: 'Na₂SO₄', c: ['Na', '+', 2, 'Na^+'], a: ['SO4', '2-', 1, 'SO4^2-'] },
    { f: 'Mg(NO3)2', btn: 'Mg(NO₃)₂', c: ['Mg', '2+', 1, 'Mg^2+'], a: ['NO3', '-', 2, 'NO3^-'] },
    { f: 'K3PO4', btn: 'K₃PO₄', c: ['K', '+', 3, 'K^+'], a: ['PO4', '3-', 1, 'PO4^3-'] },
    { f: 'Al2(SO4)3', btn: 'Al₂(SO₄)₃', c: ['Al', '3+', 2, 'Al^3+'], a: ['SO4', '2-', 3, 'SO4^2-'] },
    { f: '(NH4)2SO4', btn: '(NH₄)₂SO₄', c: ['NH4', '+', 2, 'NH4^+'], a: ['SO4', '2-', 1, 'SO4^2-'] },
  ];
  ION.forEach((x) => { // Check the charges balance and the atoms match the formula.
    const q = (s) => (/(\d)/.test(s) ? +/(\d)/.exec(s)[1] : 1);
    if (x.c[2] * q(x.c[1]) !== x.a[2] * q(x.a[1])) throw new Error('Charge not balanced: ' + x.f);
  });
  Lab.$('#ion-sub').innerHTML = ION.map((x, i) => `<button type="button" data-value="${x.f}" aria-pressed="${i === 6}">${x.btn}</button>`).join('');
  const io = { cur: ION[6], c: 0.1, t0: 0, sc: 0.1 };
  const drawGroup = (g, part, x, y, s) => {
    if (SHAPES[part[0]]) shape(g, part[0], x, y, s * 0.72, { charge: part[1] });
    else Art.atom(g, x, y, s, part[0], { charge: part[1], label: part[0] });
  };
  const ioStage = Lab.stage('#c-ions', {
    h: 430, label: 'A compound splitting into its ions, with a bar for the concentration of each ion.',
    draw(g, t, dt) {
      io.sc = lerp(io.sc, io.c, Lab.reducedMotion ? 1 : clamp(dt * 8));
      const x = io.cur, q = Lab.reducedMotion ? 1 : ease.inOut(clamp((t - io.t0) / 1.2));
      const str = `${x.f} -> ${x.c[2] > 1 ? x.c[2] : ''}${x.c[3]} + ${x.a[2] > 1 ? x.a[2] : ''}${x.a[3]}`;
      fo(g, str, 400, 40, { size: 36, colorize: true });
      const total = x.c[2] + x.a[2], gap = Math.min(116, 720 / total);
      const parts = [];
      for (let i = 0; i < x.c[2]; i++) parts.push(x.c);
      for (let i = 0; i < x.a[2]; i++) parts.push(x.a);
      parts.forEach((part, i) => {
        const dx = 400 + (i - (total - 1) / 2) * gap, sx = 400 + (i - (total - 1) / 2) * 30;
        const px = lerp(sx, dx, q) + wander(i, t) * 3 * q, py = 138 + wander(i + 9, t) * 3 * q;
        drawGroup(g, part, px, py, part[0] === 'SO4' || part[0] === 'PO4' || part[0] === 'NO3' || part[0] === 'NH4' ? 34 : 34);
      });
      const BX = 170, BW = 590, max = 3;
      [[x.c, C.cyan, 240], [x.a, C.pink, 318]].forEach(([part, col, y]) => {
        const val = io.sc * part[2];
        fo(g, part[3], 86, y + 25, { size: 34, colorize: true });
        g.fillStyle = 'rgba(255,255,255,.08)'; Art.round(g, BX, y, BW, 50, 14); g.fill();
        const w = (val / max) * BW;
        g.fillStyle = col; Art.round(g, BX, y, Math.max(10, w), 50, 14); g.fill();
        Art.text(g, `${Lab.fmt(val, 2)} M`, BX + w + 12 > BX + BW - 110 ? BX + w - 12 : BX + w + 12, y + 25, { font: 'display', size: 30, align: BX + w + 12 > BX + BW - 110 ? 'right' : 'left', color: BX + w + 12 > BX + BW - 110 ? '#1A0F2E' : C.ink });
      });
      Art.text(g, `Total ions: ${Lab.fmt(io.sc * total, 2)} M`, 400, 400, { font: 'display', size: 30, color: C.sun });
    },
  });
  function paintIo() {
    const x = io.cur;
    Lab.$('#ion-c-out').textContent = `${Lab.fmt(io.c, 2)} M`;
    const cc = `\\ce{${x.c[3].replace('^', '^')}}`, aa = `\\ce{${x.a[3]}}`;
    Lab.$('#ion-calc').innerHTML = Lab.texString(`<p>Each $\\ce{${x.f}}$ gives ${x.c[2]} $${cc}$ and ${x.a[2]} $${aa}$. So $${cc}$ is $${Lab.fmt(io.c, 2)} \\times ${x.c[2]} = ${Lab.fmt(io.c * x.c[2], 2)}$ M and $${aa}$ is $${Lab.fmt(io.c, 2)} \\times ${x.a[2]} = ${Lab.fmt(io.c * x.a[2], 2)}$ M.</p>`);
  }
  Lab.segmented('#ion-sub', (v) => { io.cur = ION.find((i) => i.f === v); io.t0 = ioStage.t; paintIo(); });
  Lab.bind('#ion-c', null, null, (v) => { io.c = v; paintIo(); });

  /* ---------- Story 4: a new door into the mole tunnel ---------- */
  const LX = 210, RX = 590, CAVE_Y = 345;
  function cform(g, f, x, y, o = {}) {
    const size = o.size || 30, toks = f.match(/[A-Z][a-z]?|\d+|[()]/g) || [];
    const font = (s) => `400 ${s}px ${Art.FONT_DISPLAY}`;
    const widths = toks.map((k) => { g.font = font(/^\d/.test(k) ? size * 0.66 : size); return g.measureText(k).width; });
    const total = widths.reduce((a, b) => a + b, 0);
    if (o.measure) return total;
    let cx = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const base = y + size * 0.36;
    let last = C.ink;
    toks.forEach((k, i) => {
      const sub = /^\d/.test(k);
      if (!sub && /[A-Z]/.test(k)) { last = Art.elementColor(k); if (Art.lum(last) < 0.5) last = Art.mix(last, '#ffffff', 0.55); }
      g.font = font(sub ? size * 0.66 : size);
      g.fillStyle = o.color || (/[()]/.test(k) ? C.ink : last);
      g.fillText(k, cx, sub ? base + size * 0.2 : base);
      cx += widths[i];
    });
    return total;
  }
  function rich(g, parts, x, y, o = {}) {
    const size = o.size || 26;
    const widths = parts.map((p) => { if (typeof p === 'string') { g.font = `400 ${size}px ${Art.FONT_DISPLAY}`; return g.measureText(p).width; } return cform(g, p.f, 0, 0, { size, measure: true }); });
    const total = widths.reduce((a, b) => a + b, 0);
    if (o.measure) return total;
    let cx = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
    parts.forEach((p, i) => { if (typeof p === 'string') Art.text(g, p, cx, y, { font: 'display', size, align: 'left', color: o.color }); else cform(g, p.f, cx, y, { size, align: 'left', color: o.flat ? o.color : undefined }); cx += widths[i]; });
    return total;
  }
  function pillRich(g, parts, x, y, o = {}) {
    const size = o.size || 22, w = rich(g, parts, 0, 0, { size, measure: true }) + size * 1.1, h = size * 1.62;
    g.fillStyle = o.bg || C.plum2; g.strokeStyle = o.stroke || 'rgba(255,255,255,.4)'; g.lineWidth = 2.5;
    Art.round(g, x - w / 2, y - h / 2, w, h, h / 2); g.fill(); g.stroke();
    rich(g, parts, x, y + 1, { size, color: '#fff', flat: true });
  }
  function doorMap(g, W, H, t) {
    const sky = g.createLinearGradient(0, 0, 0, 150);
    sky.addColorStop(0, '#231A52'); sky.addColorStop(1, '#3E3F8E');
    g.fillStyle = sky; g.fillRect(0, 0, W, 152);
    const d = g.createLinearGradient(0, 150, 0, H);
    d.addColorStop(0, '#4A2C3F'); d.addColorStop(1, '#27142F');
    g.fillStyle = d; g.fillRect(0, 150, W, H - 150);
    for (let i = 0; i < 30; i++) {
      const x = rand(i + 11) * W, y = 170 + rand(i + 23) * (H - 170), r = 3 + rand(i + 37) * 8;
      g.fillStyle = `rgba(255,220,190,${0.03 + rand(i + 2) * 0.05})`;
      g.beginPath(); g.ellipse(x, y, r * 1.3, r, rand(i) * 3, 0, TAU); g.fill();
    }
    const path = () => { g.beginPath(); g.moveTo(LX, 150); g.lineTo(LX, CAVE_Y); g.lineTo(RX, CAVE_Y); g.lineTo(RX, 150); };
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = '#6B4432'; g.lineWidth = 124; path(); g.stroke();
    g.strokeStyle = '#1B0F2A'; g.lineWidth = 110; path(); g.stroke();
    g.fillStyle = '#2FA35E'; g.fillRect(0, 146, W, 16);
    g.fillStyle = '#4CD07F'; g.fillRect(0, 146, W, 5);
    g.fillStyle = '#1B0F2A'; g.beginPath(); g.ellipse(LX, 156, 56, 11, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(RX, 156, 56, 11, 0, 0, TAU); g.fill();
    void t;
  }
  const smallBeaker = (g, x, liquid, label) => { Art.beaker(g, x, 148, 96, 88, { level: 0.68, liquid, ticks: false }); Art.text(g, label, x, 120, { font: 'display', size: 21, color: '#fff', halo: true }); };
  const STOPS = { a: [116, 148], ma: [LX, 394], mb: [RX, 394], b: [684, 148] };
  function walker(g, from, to, q, t, mood) {
    const A = STOPS[from], B = STOPS[to], u = ease.inOut(clamp(q));
    let x, y;
    if (A[1] === B[1]) { x = lerp(A[0], B[0], u); y = A[1]; }
    else {
      const sx = from === 'a' ? LX : from === 'mb' ? RX : A[0];
      const d1 = Math.abs(sx - A[0]), d2 = Math.abs(A[1] - B[1]), d3 = Math.abs(B[0] - sx), T = d1 + d2 + d3, at = u * T;
      if (at < d1) { x = lerp(A[0], sx, at / d1); y = A[1]; }
      else if (at < d1 + d2) { x = sx; y = lerp(A[1], B[1], (at - d1) / d2); }
      else { x = lerp(sx, B[0], (at - d1 - d2) / Math.max(1, d3)); y = B[1]; }
    }
    const moving = q > 0 && q < 1;
    Art.moe(g, x, y - (moving ? Math.abs(Math.sin(t * 9)) * 5 : 0), 86, moving ? 'happy' : mood, { t, flip: B[0] < A[0], bob: !moving });
  }
  const EQ = 'CaCl2 + 2AgNO3 → 2AgCl + Ca(NO3)2';
  const eqLine = (g, W) => rich(g, [{ f: 'CaCl2' }, ' + 2', { f: 'AgNO3' }, ' → 2', { f: 'AgCl' }, ' + ', { f: 'Ca(NO3)2' }], W / 2, 28, { size: 28, color: C.ink });
  void EQ;
  Lab.story('#story-door', {
    title: 'Liters are a door to moles',
    scenes: [
      {
        say: 'Same map as before, but with beakers up top instead of scales. How much 0.100 M AgNO₃ reacts with 25.0 mL of 0.200 M CaCl₂? Go <b>down</b>: liters × molarity = moles. 0.0250 L × 0.200 mol/L = <b>0.00500 mol</b>.',
        dur: 4.4,
        draw(g, p, t, { W, H }) {
          doorMap(g, W, H, t);
          smallBeaker(g, LX, '#7CCBF1', '25.0 mL'); smallBeaker(g, RX, '#BFE7FA', '? mL');
          eqLine(g, W);
          Art.text(g, '× 0.200 mol/L', 150, 230, { font: 'display', size: 22, align: 'right', color: C.sun, alpha: seg(p, 0.05, 0.25), maxW: 138 });
          Art.arrow(g, 162, 170, 162, 300, { color: C.sun, w: 6, p: seg(p, 0.2, 0.5) });
          walker(g, 'a', 'ma', seg(p, 0.12, 0.8), t, 'happy');
          if (seg(p, 0.78, 0.86) > 0) pillRich(g, ['0.00500 mol ', { f: 'CaCl2' }], LX, 426, { bg: '#8C1F5E', stroke: C.pink });
        },
      },
      {
        say: 'Go <b>across</b>, as always, with the coefficients. 2 AgNO₃ for every 1 CaCl₂, so 0.00500 mol × 2/1 = <b>0.0100 mol AgNO₃</b>.',
        dur: 3.6,
        draw(g, p, t, { W, H }) {
          doorMap(g, W, H, t);
          smallBeaker(g, LX, '#7CCBF1', '25.0 mL'); smallBeaker(g, RX, '#BFE7FA', '? mL');
          eqLine(g, W);
          pillRich(g, ['0.00500 mol ', { f: 'CaCl2' }], LX, 426, { bg: '#8C1F5E', stroke: C.pink });
          if (seg(p, 0.74, 0.84) > 0) pillRich(g, ['0.0100 mol ', { f: 'AgNO3' }], RX, 426, { bg: '#8C1F5E', stroke: C.pink });
          Art.arrow(g, 300, 290, 500, 290, { color: C.pink, w: 6, p: seg(p, 0.15, 0.6) });
          rich(g, ['2 mol ', { f: 'AgNO3' }, ' / 1 mol ', { f: 'CaCl2' }], 400, 244, { size: 25, color: C.pink, flat: true });
          walker(g, 'ma', 'mb', seg(p, 0.12, 0.76), t, 'happy');
        },
      },
      {
        say: 'Come <b>up</b> through the other door. Moles ÷ molarity = liters. 0.0100 mol ÷ 0.100 mol/L = 0.100 L, which is <b>100. mL</b>. The door works in both directions.',
        dur: 3.6,
        draw(g, p, t, { W, H }) {
          doorMap(g, W, H, t);
          const done = seg(p, 0.8, 0.86) > 0;
          smallBeaker(g, LX, '#7CCBF1', '25.0 mL'); smallBeaker(g, RX, '#BFE7FA', done ? '100. mL' : '? mL');
          eqLine(g, W);
          pillRich(g, ['0.00500 mol ', { f: 'CaCl2' }], LX, 426, { bg: '#8C1F5E', stroke: C.pink });
          pillRich(g, ['0.0100 mol ', { f: 'AgNO3' }], RX, 426, { bg: '#8C1F5E', stroke: C.pink });
          Art.text(g, '÷ 0.100 mol/L', 652, 230, { font: 'display', size: 22, align: 'left', color: C.sun, maxW: 138 });
          Art.arrow(g, 640, 300, 640, 170, { color: C.sun, w: 6, p: seg(p, 0.2, 0.5) });
          walker(g, 'mb', 'b', seg(p, 0.1, 0.8), t, 'cheer');
          Art.burst(g, RX, 100, seg(p, 0.8, 1), { n: 16, r: 100 });
        },
      },
    ],
  });
});
