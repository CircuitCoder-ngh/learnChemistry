/* Lesson 5.3: Precipitation and net ionic equations. Verdicts and equations all come from window.Solubility. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C, S = window.Solubility, TAU = Math.PI * 2;
  const WATER = '#B4E6FA';
  const R_ = (f) => S.reagents.find((x) => x.formula === f);

  /** Art.formula with a fade, white by default. */
  function F(g, f, x, y, o = {}) {
    const a = o.alpha === undefined ? 1 : o.alpha;
    if (a <= 0) return 0;
    g.save(); g.globalAlpha *= a;
    const w = Art.formula(g, f, x, y, Object.assign({ color: '#fff' }, o));
    g.restore();
    return w;
  }
  function measure(g, f, size) {
    g.save(); g.globalAlpha = 0;
    const w = Art.formula(g, f, 0, -500, { size, align: 'left' });
    g.restore();
    return w;
  }
  /** One row of equation terms, centered on cx. items: { t, color, alpha, strike, box, glow } or '+' or '->'. Returns where each item landed. */
  function eqRow(g, items, cx, y, size, o = {}) {
    const gap = size * 0.34;
    const widths = items.map((it) => (it === '+' ? measure(g, '+', size) : it === '->' ? size * 1.5 : measure(g, it.t, size)));
    const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
    let x = (o.left !== undefined ? o.left : cx - total / 2);
    const out = [];
    items.forEach((it, i) => {
      const w = widths[i];
      if (it === '+') F(g, '+', x, y, { size, align: 'left', color: C.dim, alpha: o.alpha });
      else if (it === '->') Art.arrow(g, x + 2, y + 1, x + w - 4, y + 1, { color: C.ink, w: 4, alpha: o.alpha, head: 12 });
      else {
        const a = (it.alpha === undefined ? 1 : it.alpha) * (o.alpha === undefined ? 1 : o.alpha);
        if (it.glow) {
          g.save(); g.globalAlpha *= it.glow * a;
          g.strokeStyle = it.glowColor || C.sun; g.lineWidth = 3;
          Art.round(g, x - 8, y - size * 0.72, w + 16, size * 1.44, 10); g.stroke();
          g.restore();
        }
        F(g, it.t, x, y, { size, align: 'left', color: it.color || '#fff', alpha: a });
        if (it.strike) Art.strike(g, x - 5, y + size * 0.48, x + w + 5, y - size * 0.48, it.strike, C.red, 5);
        out.push({ x, w, item: it });
      }
      x += w + gap;
    });
    return out;
  }
  const termItems = (terms, fn = () => ({})) => {
    const items = [];
    terms.forEach((t, i) => {
      if (i) items.push('+');
      items.push(Object.assign({ t: S.termText(t), term: t }, fn(t)));
    });
    return items;
  };

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
    for (let i = 0; i < 24; i++) {
      const u = rand(i + 31), v = rand(i + 77);
      const px = lerp(x0 + 10, x1 - 10, u), top = h * (1 - Math.pow(Math.abs(u - 0.5) * 2, 2));
      g.fillStyle = i % 2 ? 'rgba(26,15,46,.2)' : 'rgba(255,255,255,.4)';
      g.fillRect(px, y - 3 - v * top * 0.82, 2.4, 2.4);
    }
  }
  /** A beaker in which a solid forms. cloud and amount run from 0 to 1. */
  function solidBeaker(g, cx, baseY, w, h, o) {
    const level = o.level === undefined ? 0.78 : o.level;
    const color = o.color || '#F4F2EC';
    const t = o.t || 0;
    return Art.beaker(g, cx, baseY, w, h, {
      level, liquid: o.tint || WATER, ticks: false,
      inside(gg, b) {
        const cloud = o.cloud || 0;
        if (cloud > 0) {
          gg.fillStyle = Art.alpha(color, 0.42 * cloud);
          gg.fillRect(b.x0, b.top, b.x1 - b.x0, b.bottom - b.top);
          for (let i = 0; i < 46; i++) {
            const speed = 0.14 + rand(i + 3) * 0.2;
            const u = (t * speed + rand(i + 11)) % 1;
            const px = lerp(b.x0 + 10, b.x1 - 10, rand(i + 29)) + Math.sin(t * 2 + i) * 3;
            gg.fillStyle = Art.alpha(color, Math.min(1, cloud * 1.5));
            gg.beginPath(); gg.arc(px, lerp(b.top + 6, b.bottom - 6, u), 2.7, 0, TAU); gg.fill();
          }
        }
        const amt = o.amount || 0;
        if (amt > 0) mound(gg, b.x0 + 6, b.x1 - 6, b.bottom - 1, (b.bottom - b.top) * 0.3 * amt, color);
        if (o.bubbles) Art.bubbles(gg, b.x0 + 14, b.x1 - 14, b.bottom - 8, b.top + 4, t, { n: 10, r: 4 });
      },
    });
  }

  /* ---------- Story 1: AgNO3 meets NaCl ---------- */
  const HEX12 = [[-0.56, -0.6], [0, -0.74], [0.56, -0.6], [-0.78, -0.13], [-0.26, -0.24], [0.26, -0.24], [0.78, -0.13], [-0.6, 0.34], [-0.08, 0.26], [0.44, 0.3], [-0.3, 0.72], [0.26, 0.72]];
  const CAST = [
    ['Ag', 5], ['Ag', 0], ['Ag', 9],
    ['NO3', 2], ['NO3', 3], ['NO3', 10],
    ['Na', 1], ['Na', 7], ['Na', 6],
    ['Cl', 4], ['Cl', 8], ['Cl', 11],
  ];
  const LATTICE6 = [[-0.34, 0.74], [0.02, 0.76], [0.36, 0.72], [-0.46, 0.42], [-0.1, 0.44], [0.26, 0.42]];
  const LATTICE_OF = { Ag: [0, 2, 4], Cl: [1, 3, 5] };
  function castPos(i, cx, cy, R, t) {
    const [fx, fy] = HEX12[CAST[i][1]];
    return [cx + fx * R * 0.86 + wander(i + 2, t * 0.8) * 8, cy + fy * R * 0.86 + wander(i + 21, t * 0.8) * 8];
  }
  /** Starting side: silver nitrate ions from the left, sodium chloride ions from the right. */
  function castStart(i, cx, cy, R) {
    const left = i < 6;
    const row = i % 3, col = i < 3 || (i >= 6 && i < 9) ? 0 : 1;
    return [cx + (left ? -1 : 1) * R * (0.42 + col * 0.26), cy + (row - 1) * R * 0.52];
  }
  function drawCast(g, cx, cy, R, t, posFn, o = {}) {
    CAST.forEach(([id], i) => {
      const [x, y] = posFn(i);
      const dim = o.dim ? o.dim(id) : 1;
      S.drawIon(g, x, y, o.r || 25, id, { alpha: dim, t, seed: i, rot: t * 0.3 + i, face: o.face ? o.face(id, i) : null, look: o.look });
    });
    void cx; void cy; void R;
  }
  Lab.story('#story-swap', {
    title: 'Silver nitrate meets sodium chloride',
    scenes: [
      {
        say: 'Here are two clear solutions. One holds $\\ce{Ag+}$ and $\\ce{NO3-}$ ions. The other holds $\\ce{Na+}$ and $\\ce{Cl-}$ ions. Each pair is happy to stay dissolved.',
        dur: 3,
        draw(g, p, t) {
          const q = seg(p, 0.1, 0.5);
          [[210, 'AgNO3', ['Ag', 'NO3']], [590, 'NaCl', ['Na', 'Cl']]].forEach(([x, f, ids], k) => {
            F(g, f + '(aq)', x, 34, { size: 36, alpha: seg(p, 0, 0.2) });
            Art.beaker(g, x, 438, 144, 88, { level: 0.74, liquid: WATER, ticks: false });
            Art.zoom(g, x, 372, x, 198, 148, (gg, cx, cy, R) => {
              const layout = [[-0.48, -0.42], [0.48, -0.46], [0, 0.02], [-0.5, 0.48], [0.5, 0.44], [0, -0.74]];
              layout.forEach(([fx, fy], i) => {
                const id = ids[i % 2];
                S.drawIon(gg, cx + fx * R * 0.88 + wander(i + k * 7, t) * 7, cy + fy * R * 0.88 + wander(i + 9 + k * 7, t) * 7, 26, id, { face: i === 2 ? 'happy' : null, t, seed: i, rot: t * 0.3 + i });
              });
            }, { p: q });
          });
        },
      },
      {
        say: 'Pour them together. Now all four kinds of ions move around in the same water, and for a moment nothing has changed but the company.',
        dur: 3,
        draw(g, p, t) {
          solidBeaker(g, 150, 396, 216, 262, { t });
          F(g, 'mixed', 150, 92, { size: 32, alpha: seg(p, 0.5, 0.7) });
          const q = ease.inOut(seg(p, 0.08, 0.82));
          Art.zoom(g, 186, 280, 540, 222, 202, (gg, cx, cy, R) => {
            drawCast(gg, cx, cy, R, t, (i) => {
              const s = castStart(i, cx, cy, R), e = castPos(i, cx, cy, R, t);
              return [lerp(s[0], e[0], q), lerp(s[1], e[1], q)];
            });
          }, { p: 1 });
        },
      },
      {
        say: 'Each ion now has a possible new partner. Check both new pairs with the solubility rules. $\\ce{NaNO3}$ dissolves. But $\\ce{AgCl}$ is insoluble, because silver is an exception for chlorides.',
        dur: 3.8,
        draw(g, p, t) {
          const a = S.isSoluble('Ag', 'Cl'), b = S.isSoluble('Na', 'NO3');
          const qa = seg(p, 0.08, 0.3), qb = seg(p, 0.4, 0.62);
          Art.popIn(g, 180, 130, qa, (gg) => {
            gg.fillStyle = '#2B1A4A'; gg.strokeStyle = C.pink; gg.lineWidth = 4;
            Art.round(gg, -160, -78, 320, 156, 22); gg.fill(); gg.stroke();
            Art.formula(gg, 'Ag^+ + Cl^-', 0, -42, { size: 32, color: '#fff' });
            Art.formula(gg, a.formula, 0, 2, { size: 40, color: C.sun });
            Art.text(gg, 'insoluble', 0, 48, { font: 'display', size: 32, color: C.pink });
          });
          Art.popIn(g, 180, 322, qb, (gg) => {
            gg.fillStyle = '#2B1A4A'; gg.strokeStyle = C.cyan; gg.lineWidth = 4;
            Art.round(gg, -160, -78, 320, 156, 22); gg.fill(); gg.stroke();
            Art.formula(gg, 'Na^+ + NO3^-', 0, -42, { size: 32, color: '#fff' });
            Art.formula(gg, b.formula, 0, 2, { size: 40, color: C.sun });
            Art.text(gg, 'soluble', 0, 48, { font: 'display', size: 32, color: C.cyan });
          });
          Art.zoom(g, 340, 222, 572, 222, 196, (gg, cx, cy, R) => {
            const pos = (i) => castPos(i, cx, cy, R, t);
            drawCast(gg, cx, cy, R, t, pos, { dim: (id) => (id === 'Ag' || id === 'Cl' ? 1 : lerp(1, 0.45, qa)), face: (id, i) => ((i === 0 || i === 9) ? 'wow' : null), look: [0, 0] });
            const A = pos(0), B = pos(9);
            Art.ring(gg, A[0], A[1], 38, { color: C.pink, w: 4, p: qa });
            Art.ring(gg, B[0], B[1], 42, { color: C.pink, w: 4, p: qa });
          }, { p: 1, rim: C.cyan });
        },
      },
      {
        say: 'So silver and chloride grab each other and <b>crash out of the water</b>. Billions of them at once make a white cloud that settles to the bottom. That solid is the <b>precipitate</b>.',
        dur: 4,
        draw(g, p, t) {
          const crash = ease.inOut(seg(p, 0.1, 0.7));
          solidBeaker(g, 150, 396, 216, 262, { t, cloud: Math.max(0.15, 1 - seg(p, 0.55, 1) * 0.75) * seg(p, 0.1, 0.35), amount: seg(p, 0.4, 1), color: '#F4F2EC' });
          F(g, 'AgCl(s)', 150, 92, { size: 34, alpha: seg(p, 0.5, 0.7), color: C.sun });
          Art.zoom(g, 186, 340, 540, 222, 202, (gg, cx, cy, R) => {
            let ag = 0, cl = 0;
            drawCast(gg, cx, cy, R, t, (i) => {
              const id = CAST[i][0];
              const e = castPos(i, cx, cy, R, t);
              if (id === 'Ag' || id === 'Cl') {
                const k = id === 'Ag' ? LATTICE_OF.Ag[ag++] : LATTICE_OF.Cl[cl++];
                const [fx, fy] = LATTICE6[k];
                const q = ease.inOut(clamp(crash * 1.5 - (k * 0.08)));
                return [lerp(e[0], cx + fx * R, q), lerp(e[1], cy + fy * R * 0.96, q)];
              }
              // Spectators stay above the solid.
              return [e[0], lerp(e[1], cy + Math.min(0.08, HEX12[CAST[i][1]][1] * 0.72) * R + wander(i, t) * 4, crash)];
            });
          }, { p: 1 });
          Art.text(g, 'precipitate', 540, 432, { size: 27, color: C.sun, alpha: seg(p, 0.6, 0.8), halo: true });
        },
      },
      {
        say: '$\\ce{Na+}$ and $\\ce{NO3-}$ never did anything. They started dissolved and they ended dissolved. They are <b>spectator ions</b>, watching the reaction from the sidelines.',
        dur: 3.2,
        draw(g, p, t) {
          const q = seg(p, 0.1, 0.45);
          Art.zoom(g, 40, 240, 400, 222, 210, (gg, cx, cy, R) => {
            let ag = 0, cl = 0;
            drawCast(gg, cx, cy, R, t, (i) => {
              const id = CAST[i][0];
              if (id === 'Ag' || id === 'Cl') {
                const k = id === 'Ag' ? LATTICE_OF.Ag[ag++] : LATTICE_OF.Cl[cl++];
                const [fx, fy] = LATTICE6[k];
                return [cx + fx * R, cy + fy * R * 0.96];
              }
              const e = castPos(i, cx, cy, R, t);
              return [e[0], cy + Math.min(0.08, HEX12[CAST[i][1]][1] * 0.72) * R + wander(i, t) * 5];
            }, { face: (id) => (id === 'Na' ? 'sleepy' : null), dim: (id) => (id === 'Ag' || id === 'Cl' ? lerp(1, 0.5, q) : 1) });
          }, { p: 1 });
          Art.text(g, 'spectators', 400, 56, { font: 'display', size: 36, color: C.cyan, alpha: q, halo: true });
          Art.moe(g, 700, 412, 170, 'think', { t, flip: true });
          Art.bubble(g, 'They just watch.', 690, 212, { w: 200, side: 'down', alpha: seg(p, 0.45, 0.6), size: 24 });
          void q;
        },
      },
      {
        say: 'Ignore the spectators and the whole reaction is one short line: the <b>net ionic equation</b>. It shows only what actually changed.',
        dur: 3,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.1, 0.55));
          const y = 196;
          S.drawIon(g, lerp(150, 330, q), y, 66, 'Ag', { scaled: false, face: q > 0.8 ? 'grin' : 'wow', t, look: [1, 0] });
          S.drawIon(g, lerp(650, 455, q), y, 76, 'Cl', { scaled: false, face: q > 0.8 ? 'grin' : 'wow', t, look: [-1, 0] });
          if (q > 0.9) Art.burst(g, 395, y, seg(p, 0.5, 0.8), { n: 16, r: 150 });
          const a = seg(p, 0.55, 0.72);
          if (a > 0) {
            g.fillStyle = Art.alpha(C.plum2, a); Art.round(g, 90, 322, 620, 88, 26); g.fill();
            F(g, 'Ag^+(aq) + Cl^-(aq) -> AgCl(s)', 400, 366, { size: 38, alpha: a, color: C.sun });
          }
        },
      },
    ],
  });

  /* ---------- Bench: mix any two ---------- */
  const POUR = 2.1, CRASH = 2.1;
  const lab = { a: R_('Pb(NO3)2'), b: R_('KI'), phase: 'ready', t0: 0, parts: [], m: S.mix(R_('Pb(NO3)2'), R_('KI')), cx: 632, cy: 205, R: 152, latticeTop: 400 };
  const hunt = Object.assign({ white: 0, yellow: 0, blue: 0, rust: 0, black: 0, green: 0, brown: 0 }, Lab.store.get('hunt:precip', {}));
  const HUNT_NAMES = [['white', 'White', '#F4F2EC'], ['yellow', 'Yellow', '#FFCF1F'], ['blue', 'Blue', '#79C2EE'], ['rust', 'Rust', '#B5502A'], ['black', 'Black', '#26252B'], ['green', 'Green', '#58C27D'], ['brown', 'Dark brown', '#6E4225']];
  const HUNT_OF = { white: 'white', 'off-white': 'white', cream: 'white', 'pale yellow': 'yellow', yellow: 'yellow', 'bright yellow': 'yellow', 'pale blue': 'blue', 'blue-green': 'blue', 'rust brown': 'rust', black: 'black', green: 'green', 'pale green': 'green', 'dark brown': 'brown' };
  const REAL_HUNT = { 'Fe3|CO3': 'rust', 'Al|CO3': 'white', 'Al|S': 'white', 'Fe3|S': 'black' };
  function paintHunt() {
    const found = HUNT_NAMES.filter(([k]) => hunt[k]).length;
    Lab.$('#hunt-count').textContent = `You have found ${found} of ${HUNT_NAMES.length}.`;
    Lab.$('#hunt').innerHTML = HUNT_NAMES.map(([k, name, c]) => `<span class="pr-swatch${hunt[k] ? ' is-found' : ''}" style="--c:${c}"><i></i>${hunt[k] ? name : 'Not yet'}</span>`).join('');
  }
  /* Build a swarm: exact ion counts from the balanced equation, scaled up to a good crowd. */
  function buildParts(m) {
    const { cx, cy, R } = lab;
    const parts = [];
    const add = (id, n, side) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * (R - 34);
        parts.push({ id, side, x: cx + side * R * 0.48 + (Math.random() - 0.5) * R * 0.66, y: cy + (Math.random() - 0.5) * R * 1.3, vx: Math.cos(a) * 22, vy: Math.sin(a) * 22, rot: Math.random() * 6, seed: Math.random() * 40, solid: false, d });
      }
    };
    const c = m.same ? { c1: 3, a1: 3 * S.units(m.A.c, m.A.a).na / S.units(m.A.c, m.A.a).nc, c2: 0, a2: 0 } : m.counts;
    const total = c.c1 + c.a1 + c.c2 + c.a2;
    const k = Math.max(1, Math.floor(18 / total));
    add(m.A.c, c.c1 * k, -1); add(m.A.a, c.a1 * k, -1);
    add(m.B.c, c.c2 * k, 1); add(m.B.a, c.a2 * k, 1);
    return parts;
  }
  /** Assign lattice sites at the bottom of the magnifier to the ions that form a solid. */
  function formLattice() {
    const m = lab.m, { cx, cy, R } = lab;
    const solidIds = new Set();
    (m.solids || []).forEach((sol) => { solidIds.add(sol.cation.id); solidIds.add(sol.anion.id); });
    let chosen = lab.parts.filter((p) => solidIds.has(p.id));
    if (m.kind === 'slight') {
      // Only some of a borderline compound falls out; keep the ratio by taking about half of each.
      const byId = {};
      chosen.forEach((p) => { (byId[p.id] = byId[p.id] || []).push(p); });
      chosen = Object.values(byId).flatMap((l) => l.slice(0, Math.ceil(l.length * (m.hazy ? 0.5 : 0))));
    }
    // Alternate the ions so the block looks like a real lattice.
    const groups = {};
    chosen.forEach((p) => { (groups[p.id] = groups[p.id] || []).push(p); });
    const order = [];
    const keys = Object.keys(groups);
    let any = true;
    while (any) {
      any = false;
      keys.forEach((k) => { if (groups[k].length) { order.push(groups[k].shift()); any = true; } });
    }
    const d = 44;
    const widths = [4, 5, 6, 6, 6];
    let row = 0, used = 0;
    order.forEach((p, i) => {
      if (used >= widths[row]) { row++; used = 0; }
      const w = Math.min(widths[row], order.length - i + used);
      p.solid = true;
      p.tx = cx + (used - (w - 1) / 2) * d;
      p.ty = cy + R * 0.78 - row * (d - 4);
      p.delay = Math.random() * 0.8;
      used++;
    });
    lab.latticeTop = order.length ? cy + R * 0.78 - row * (d - 4) - 40 : cy + R;
  }
  function tintOf(ions) {
    const colors = ions.map((id) => S.ion(id).solution).filter(Boolean);
    return colors.length ? Art.mix(WATER, colors[0], 0.75) : WATER;
  }
  function setupMix() {
    lab.m = S.mix(lab.a, lab.b);
    lab.phase = 'ready';
    lab.parts = buildParts(lab.m);
    lab.latticeTop = lab.cy + lab.R;
    lab.counted = false;
    paintEqs();
    mixStage.redraw();
  }
  function pour() {
    if (lab.phase !== 'ready') { setupMix(); }
    if (lab.m.same) return;
    lab.phase = 'pour';
    lab.t0 = mixStage.t;
    Lab.sound.pop();
    mixBtn.textContent = 'Reset the beakers';
    paintEqs();
    if (Lab.reducedMotion) finishPour();
  }
  function finishPour() {
    lab.phase = 'done';
    formLattice();
    if (Lab.reducedMotion) lab.parts.forEach((p) => { if (p.solid) { p.x = p.tx; p.y = p.ty; } });
    paintEqs();
    const m = lab.m;
    let key = null;
    if (m.real && m.real.colorHex) key = REAL_HUNT[m.pairs[0].key] || REAL_HUNT[m.pairs[1].key];
    else if (m.kind === 'precip' && m.solids[0]) key = HUNT_OF[m.solids[0].colorName];
    if (key && !hunt[key]) {
      hunt[key] = 1; Lab.store.set('hunt:precip', hunt); paintHunt();
      Lab.toast(`<strong>New color found</strong><span>${HUNT_NAMES.find((h) => h[0] === key)[1]} solid.</span>`);
      if (HUNT_NAMES.every(([k]) => hunt[k])) { Lab.confetti(); Lab.collection.award(2); }
    }
    Lab.sound[m.kind === 'none' ? 'pop' : 'good']();
  }
  function srcBeaker(g, x, y, r, level, tilt, dir) {
    g.save(); g.translate(x, y); g.rotate(tilt * dir);
    Art.beaker(g, 0, 0, 110, 100, { level: Math.max(0.0001, level), liquid: tintOf([r.c]), ticks: false });
    g.restore();
  }
  function ionsLabel(g) {
    // Name the two kinds of event inside the view.
    const m = lab.m;
    if (lab.phase === 'done' && m.kind !== 'none' && m.spectators) {
      Art.text(g, 'spectators', lab.cx, lab.cy - lab.R + 34, { size: 24, color: C.cyan, halo: true });
    }
  }
  const mixStage = Lab.stage('#c-mix', {
    bg: 'lab',
    label: 'Two small beakers pour into a large beaker. A magnifier shows the ions inside.',
    draw(g, t, dt) {
      const m = lab.m, tau = Lab.reducedMotion ? 99 : t - lab.t0;
      const pourP = lab.phase === 'ready' ? 0 : clamp(tau / POUR);
      const pA = ease.inOut(seg(pourP, 0, 0.55)), pB = ease.inOut(seg(pourP, 0.3, 0.92));
      const after = lab.phase === 'done' ? clamp((tau - POUR) / CRASH) : 0;
      if (lab.phase === 'pour' && pourP >= 1) finishPour();

      const tA = tintOf([lab.a.c]), tB = tintOf([lab.b.c]);
      let tint = pB > 0 ? Art.mix(tA, tB, 0.5) : tA;
      if (lab.phase === 'done') {
        const remaining = (m.spectators || []).map((x) => x.id);
        let end = m.kind === 'none' ? Art.mix(tA, tB, 0.5) : tintOf(remaining.length ? remaining : []);
        if (m.real && m.real.tint) end = Art.mix(WATER, m.real.tint, 0.8);
        tint = Art.mix(tint, end, after);
      }
      // Big beaker.
      const level = 0.8 * Math.min(1, (pA + pB) / 2);
      const hasSolid = m.kind === 'precip' || (m.kind === 'slight' && m.hazy);
      const color = m.real && m.real.colorHex ? m.real.colorHex : (m.solids && m.solids[0] ? m.solids[0].color : '#F4F2EC');
      const size = m.kind === 'slight' ? 0.34 : 1;
      const cloud = hasSolid ? Math.sin(Math.min(1, after * 1.05 + 0.2) * Math.PI * 0.7) * (0.45 + 0.55 * (1 - after)) * seg(after, 0, 0.1) : 0;
      const murky = m.real && m.real.murky ? after * 0.8 : 0;
      const mixed = solidBeaker(g, 256, 380, 250, 226, {
        level, tint, t, cloud: Math.max(cloud * size, murky), color: m.real && m.real.murky ? '#9A6A2A' : color,
        amount: hasSolid ? ease.out(seg(after, 0.2, 1)) * size : 0,
        bubbles: m.real && m.real.bubbles && after > 0,
      });
      // Streams.
      const stream = (x0, y0, x1, y1, c, on) => {
        if (on <= 0) return;
        g.save(); g.strokeStyle = Art.alpha(c, 0.75); g.lineWidth = 8 * on; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x1 + 3 * Math.sin(t * 20), (y0 + y1) / 2, x1, y1); g.stroke(); g.restore();
      };
      const pouringA = lab.phase === 'pour' && pA > 0.15 && pA < 0.99;
      const pouringB = lab.phase === 'pour' && pB > 0.15 && pB < 0.99;
      const tiltAmt = (q) => 1.22 * Math.sin(Math.min(1, q) * Math.PI) ** 0.5;
      stream(196, 174, 212, mixed.surface, tA, pouringA ? 1 : 0);
      stream(296, 174, 288, mixed.surface, tB, pouringB ? 1 : 0);
      srcBeaker(g, 88, 158, lab.a, 0.74 * (1 - pA), tiltAmt(pA), 1);
      srcBeaker(g, 404, 158, lab.b, 0.74 * (1 - pB), tiltAmt(pB), -1);
      F(g, lab.a.formula, 88, 30, { size: 30, halo: true });
      F(g, lab.b.formula, 404, 30, { size: 30, halo: true });

      // Magnifier with the ions.
      const { cx, cy, R } = lab;
      Art.zoom(g, 340, 300, cx, cy, R, (gg) => {
        const dividerA = lab.phase === 'ready' ? 1 : 1 - pourP;
        if (dividerA > 0.02 && !m.same) {
          gg.strokeStyle = Art.alpha('#ffffff', 0.4 * dividerA); gg.lineWidth = 3; gg.setLineDash([9, 9]);
          gg.beginPath(); gg.moveTo(cx, cy - R); gg.lineTo(cx, cy + R); gg.stroke(); gg.setLineDash([]);
          Art.text(gg, 'A', cx - R * 0.5, cy - R * 0.72, { font: 'display', size: 30, color: C.sun, alpha: dividerA });
          Art.text(gg, 'B', cx + R * 0.5, cy - R * 0.72, { font: 'display', size: 30, color: C.sun, alpha: dividerA });
        }
        const free = lab.parts.filter((p) => !(p.solid && after * CRASH > p.delay));
        for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) {
          const A = free[i], B = free[j], ex = B.x - A.x, ey = B.y - A.y, dist = Math.hypot(ex, ey) || 1, min = 46;
          if (dist < min) {
            const push = (min - dist) * clamp(dt * 3.5) / 2;
            A.x -= (ex / dist) * push; A.y -= (ey / dist) * push;
            B.x += (ex / dist) * push; B.y += (ey / dist) * push;
          }
        }
        lab.parts.forEach((p) => {
          if (p.solid && after * CRASH > p.delay) {
            const k = clamp(dt * 3.4);
            p.x = lerp(p.x, p.tx, k); p.y = lerp(p.y, p.ty, k);
          } else {
            p.vx += (Math.random() - 0.5) * 90 * dt; p.vy += (Math.random() - 0.5) * 90 * dt;
            const sp = Math.hypot(p.vx, p.vy) || 1, cap = 42;
            if (sp > cap) { p.vx *= cap / sp; p.vy *= cap / sp; }
            p.x += p.vx * dt; p.y += p.vy * dt;
            // Stay in the circle, on your own side until the pour, and above any solid.
            const dx = p.x - cx, dy = p.y - cy, dist = Math.hypot(dx, dy), lim = R - 30;
            if (dist > lim) { p.x = cx + (dx / dist) * lim; p.y = cy + (dy / dist) * lim; p.vx -= (dx / dist) * 34; p.vy -= (dy / dist) * 34; }
            if (lab.phase === 'ready' && !m.same) {
              if (p.side < 0 && p.x > cx - 26) { p.x = cx - 26; p.vx = -Math.abs(p.vx); }
              if (p.side > 0 && p.x < cx + 26) { p.x = cx + 26; p.vx = Math.abs(p.vx); }
            }
            if (lab.phase === 'done' && p.y > lab.latticeTop) { p.y = lerp(p.y, lab.latticeTop, clamp(dt * 3)); p.vy = -Math.abs(p.vy); }
          }
          p.rot += dt * 0.4;
        });
        // Solids draw first so the free ions pass in front.
        lab.parts.filter((p) => p.solid).forEach((p) => S.drawIon(gg, p.x, p.y, 21, p.id, { rot: p.rot, t, seed: p.seed }));
        lab.parts.filter((p) => !p.solid).forEach((p) => S.drawIon(gg, p.x, p.y, 21, p.id, { rot: p.rot, t, seed: p.seed }));
        ionsLabel(gg);
      }, { p: 1 });

      // The verdict, on the bench.
      let msg = '', msgColor = C.ink, formula = null;
      if (m.same) { msg = 'Pick two different solutions'; msgColor = C.sun; }
      else if (lab.phase === 'ready') msg = '';
      else if (lab.phase === 'pour') msg = 'Pouring';
      else if (m.kind === 'none') { msg = m.real ? 'No solid, as the rules predict. See the note.' : 'No precipitate: every ion stays dissolved'; msgColor = C.cyan; }
      else if (m.kind === 'slight') { formula = m.solids[0].formula; msg = m.hazy ? `is borderline: a faint ${m.solids[0].colorName} haze` : 'is borderline: tables disagree'; msgColor = C.sun; }
      else {
        const solid = m.molecular.right.find((x) => x.phase === 's');
        formula = solid.f;
        const name = m.real && m.real.colorHex ? 'predicted. See the note.' : `falls out: ${m.solids[0].colorName} solid`;
        msg = name; msgColor = C.leaf;
      }
      if (msg && (lab.phase !== 'done' || after > 0.25 || m.kind === 'none')) {
        g.font = `400 30px ${Art.FONT_DISPLAY}`;
        const tw = g.measureText(msg).width, fw = formula ? measure(g, formula, 32) + 12 : 0;
        const x0 = 400 - (tw + fw) / 2;
        if (formula) F(g, formula, x0, 416, { size: 32, align: 'left', halo: true });
        Art.text(g, msg, x0 + fw, 416, { font: 'display', size: 30, color: msgColor, align: 'left', halo: true });
      }
    },
  });
  const mixBtn = Lab.$('#mix-pour');

  /* The equations under the stage. */
  const tx = Lab.texString;
  const termHTML = (t, cross) => `<span class="pr-term${cross ? ' is-spec' : ''}">${tx(cross ? `$\\cancel{\\ce{${S.termText(t)}}}$` : `$\\ce{${S.termText(t)}}$`)}</span>`;
  const op = (c) => `<span class="pr-op">${c}</span>`;
  const sideHTML = (terms, cross) => terms.map((t) => termHTML(t, cross && t.ion && cross.has(t.ion))).join(op('+'));
  const eqHTML = (eq, cross) => sideHTML(eq.left, cross) + op('→') + sideHTML(eq.right, cross);
  const chargeSum = (side) => {
    const parts = side.filter((x) => x.z).map((x) => {
      const z = (x.z > 0 ? '+' : '−') + Math.abs(x.z);
      return x.n > 1 ? `${x.n}(${z})` : z;
    });
    return parts.length ? parts.join(' + ') : '0';
  };
  function paintEqs() {
    const host = Lab.$('#mix-eqs');
    const m = lab.m;
    if (m.same) { host.innerHTML = '<p>Both beakers hold the same solution. Mixing gives more of the same. Choose a different one for beaker B.</p>'; return; }
    if (lab.phase === 'ready') { host.innerHTML = `<p>Beaker A holds ${tx(S.ionTex(lab.a.c))} and ${tx(S.ionTex(lab.a.a))}. Beaker B holds ${tx(S.ionTex(lab.b.c))} and ${tx(S.ionTex(lab.b.a))}. <b>Make a guess, then pour.</b></p>`; return; }
    if (lab.phase === 'pour') { host.innerHTML = '<p>Watch the ions in the magnifier.</p>'; return; }
    if (m.shareIon) {
      host.innerHTML = `<p>These two solutions share an ion, so swapping partners gives back the same two compounds. <b>Nothing happens.</b></p>`;
      return;
    }
    const [p1, p2] = m.pairs;
    let html = `<p class="pr-eq">New pairs to check: <b>${S.html(p1.formula)}</b> is ${p1.status === 'slight' ? 'borderline' : p1.status}, and <b>${S.html(p2.formula)}</b> is ${p2.status === 'slight' ? 'borderline' : p2.status}.</p>`;
    const specs = new Set((m.spectators || []).map((x) => x.id));
    html += `<p class="pr-eq"><span class="pr-eq-name">Molecular</span>${eqHTML(m.molecular)}</p>`;
    html += `<p class="pr-eq"><span class="pr-eq-name">Complete ionic, with spectators crossed out</span>${eqHTML(m.complete, specs)}</p>`;
    if (m.net) {
      const ck = m.checks.net;
      html += `<p class="pr-eq is-net"><span class="pr-eq-name">Net ionic</span>${eqHTML(m.net)}</p>`;
      html += `<p class="pr-eq"><span class="pr-check">Atoms balance</span><span class="pr-check">Charge: ${chargeSum(m.net.left)} = ${ck.leftCharge === 0 ? '0' : ck.leftCharge} on the left, ${ck.rightCharge} on the right</span></p>`;
    } else {
      html += '<p class="pr-eq is-net"><span class="pr-eq-name">Net ionic</span>Nothing is left. Every ion is a spectator, so <b>no reaction</b> happens.</p>';
    }
    if (m.kind === 'slight') {
      html += `<p class="pr-real"><b>Borderline.</b> ${tx(m.solids[0].reason)} Your table decides how to answer on a test.</p>`;
    }
    if (m.real) html += `<p class="pr-real"><b>Real flask.</b> ${tx(m.real.say)}</p>`;
    host.innerHTML = html;
  }

  function chips(host, current) {
    const el = Lab.$(host);
    el.innerHTML = S.reagents.map((r) => `<button type="button" data-value="${r.formula}" aria-pressed="${r.formula === current ? 'true' : 'false'}" aria-label="${r.name}">${S.html(r.formula)}</button>`).join('');
  }
  chips('#mix-a', lab.a.formula);
  chips('#mix-b', lab.b.formula);
  const resetLabel = () => { mixBtn.textContent = 'Pour them together'; };
  const segA = Lab.segmented('#mix-a', (v) => { lab.a = R_(v); resetLabel(); setupMix(); });
  const segB = Lab.segmented('#mix-b', (v) => { lab.b = R_(v); resetLabel(); setupMix(); });
  mixBtn.addEventListener('click', () => {
    if (lab.phase === 'ready') pour();
    else { resetLabel(); setupMix(); }
  });
  Lab.$('#mix-random').addEventListener('click', () => {
    const pairs = [];
    S.reagents.forEach((a) => S.reagents.forEach((b) => {
      const m = S.mix(a, b);
      if (m.kind === 'precip' && a.formula < b.formula) pairs.push([a, b]);
    }));
    const [a, b] = pairs[Math.floor(Math.random() * pairs.length)];
    segA.set(a.formula, false); segB.set(b.formula, false);
    lab.a = a; lab.b = b;
    resetLabel(); setupMix(); pour();
  });
  paintHunt();
  setupMix();

  /* ---------- Story 2: the same reaction written three ways ---------- */
  const PB = S.mix(R_('Pb(NO3)2'), R_('KI'));
  const SPECS = new Set(PB.spectators.map((x) => x.id));
  const ionGroup = (g, id, n, cx, y, gap, r, o = {}) => {
    for (let i = 0; i < n; i++) S.drawIon(g, cx + (i - (n - 1) / 2) * gap, y, r, id, Object.assign({ rot: i * 1.3 }, o));
  };
  function pbRows(g, p, t, o = {}) {
    const tops = [['Pb', 1, 110], ['NO3', 2, 290], ['K', 2, 490], ['I', 2, 680]];
    const y1 = 118, y2 = 318;
    const dim = o.dim || 0, strike = o.strike || 0;
    tops.forEach(([id, n, x], i) => {
      const spec = SPECS.has(id);
      Art.popIn(g, x, y1, seg(p, i * 0.08, 0.2 + i * 0.08), (gg) => ionGroup(gg, id, n, 0, 0, 78, 29, { alpha: spec ? 1 - dim * 0.65 : 1, t, face: !spec && o.faces ? 'grin' : null, seed: i }));
    });
    // The product side.
    const q = seg(p, 0.3, 0.5);
    Art.popIn(g, 150, y2, q, (gg) => {
      S.drawIon(gg, 0, -26, 25, 'Pb', { t, face: o.faces ? 'grin' : null });
      S.drawIon(gg, -44, 18, 25, 'I', { t });
      S.drawIon(gg, 44, 18, 25, 'I', { t });
    });
    Art.popIn(g, 470, y2, seg(p, 0.36, 0.56), (gg) => ionGroup(gg, 'K', 2, 0, 0, 78, 29, { alpha: 1 - dim * 0.65, t }));
    Art.popIn(g, 670, y2, seg(p, 0.42, 0.62), (gg) => ionGroup(gg, 'NO3', 2, 0, 0, 78, 29, { alpha: 1 - dim * 0.65, t }));
    F(g, 'Pb^2+(aq)', 110, y1 + 58, { size: 25, alpha: seg(p, 0.1, 0.3) });
    F(g, '2NO3^-(aq)', 290, y1 + 58, { size: 25, alpha: seg(p, 0.15, 0.35) * (1 - dim * 0.5) });
    F(g, '2K^+(aq)', 490, y1 + 58, { size: 25, alpha: seg(p, 0.2, 0.4) * (1 - dim * 0.5) });
    F(g, '2I^-(aq)', 680, y1 + 58, { size: 25, alpha: seg(p, 0.25, 0.45) });
    [200, 390, 590].forEach((x, i) => F(g, '+', x, y1, { size: 34, color: C.dim, alpha: seg(p, 0.1 + i * 0.05, 0.3 + i * 0.05) }));
    F(g, 'PbI2(s)', 150, y2 + 72, { size: 27, color: C.sun, alpha: seg(p, 0.36, 0.56) });
    F(g, '2K^+(aq)', 470, y2 + 58, { size: 25, alpha: seg(p, 0.4, 0.6) * (1 - dim * 0.5) });
    F(g, '2NO3^-(aq)', 670, y2 + 58, { size: 25, alpha: seg(p, 0.46, 0.66) * (1 - dim * 0.5) });
    F(g, '+', 300, y2, { size: 34, color: C.dim, alpha: seg(p, 0.38, 0.5) });
    F(g, '+', 570, y2, { size: 34, color: C.dim, alpha: seg(p, 0.42, 0.56) });
    Art.arrow(g, 400, y1 + 86, 400, y2 - 44, { color: C.ink, w: 5, p: seg(p, 0.26, 0.4) });
    if (strike > 0) {
      [[290, y1], [490, y1], [470, y2], [670, y2]].forEach(([x, y], i) => {
        Art.strike(g, x - 88, y + 62, x + 88, y - 44, seg(strike, i * 0.18, 0.4 + i * 0.18), C.red, 7);
      });
    }
  }
  Lab.story('#story-three', {
    title: 'Lead nitrate plus potassium iodide: three equations',
    scenes: [
      {
        say: 'The <b>molecular equation</b> treats everything as whole compounds. It matches the bottles you measure from. Here two clear solutions make a <b>bright yellow</b> solid, $\\ce{PbI2}$.',
        dur: 4,
        draw(g, p, t) {
          F(g, PB.molecular.left.map((x) => S.termText(x)).join(' + ') + ' -> ' + PB.molecular.right.map((x) => S.termText(x)).join(' + '), 400, 48, { size: 28, alpha: seg(p, 0, 0.14), color: C.sun });
          const q = seg(p, 0.14, 0.9);
          const benchY = 400;
          g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, benchY, 800, 50);
          Art.beaker(g, 118, benchY, 134, 130, { level: 0.74 * (1 - ease.inOut(seg(q, 0, 0.4))), liquid: WATER, ticks: false });
          Art.beaker(g, 682, benchY, 134, 130, { level: 0.74 * (1 - ease.inOut(seg(q, 0.2, 0.6))), liquid: WATER, ticks: false });
          F(g, 'Pb(NO3)2(aq)', 118, 222, { size: 26 });
          F(g, '2KI(aq)', 682, 222, { size: 26 });
          const cloud = seg(q, 0.22, 0.5) * (1 - seg(q, 0.82, 1) * 0.5);
          solidBeaker(g, 400, benchY, 240, 268, { level: 0.2 + 0.58 * ease.inOut(seg(q, 0, 0.6)), t, cloud, amount: ease.out(seg(q, 0.45, 1)), color: '#FFCF1F' });
          F(g, 'PbI2(s)', 400, 104, { size: 34, color: '#FFCF1F', alpha: seg(p, 0.7, 0.86) });
        },
      },
      {
        say: 'But the dissolved compounds are not really whole. The <b>complete ionic equation</b> splits them. Count carefully: $\\ce{Pb(NO3)2}$ gives one lead and <b>two</b> nitrates, and $\\ce{2KI}$ gives two potassium and two iodide. The solid stays together.',
        dur: 4.4,
        draw(g, p, t) {
          F(g, 'Complete ionic', 400, 34, { size: 30, color: C.sun, alpha: seg(p, 0, 0.1) });
          pbRows(g, p, t);
        },
      },
      {
        say: 'Now compare the two sides. Two $\\ce{K+}$ and two $\\ce{NO3-}$ appear on both, unchanged. Those are the <b>spectators</b>. Cross them out, just as you cancel a number on both sides of an algebra equation.',
        dur: 3.6,
        draw(g, p, t) {
          F(g, 'Cross out what is the same on both sides', 400, 34, { size: 28, color: C.pink });
          pbRows(g, 1, t, { dim: seg(p, 0.4, 0.9), strike: seg(p, 0.2, 0.85), faces: true });
        },
      },
      {
        say: 'What remains is the <b>net ionic equation</b>. One lead ion and two iodide ions lock together. Check it: charge is $+2 + 2(-1) = 0$ on the left and $0$ on the right.',
        dur: 3.6,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.12, 0.62));
          const y = 180;
          S.drawIon(g, lerp(150, 400, q), lerp(y, y - 44, q), 56, 'Pb', { scaled: false, face: 'grin', t, look: [q < 0.9 ? 1 : 0, 0] });
          S.drawIon(g, lerp(380, 318, q), lerp(y + 6, y + 44, q), 58, 'I', { scaled: false, t, face: q > 0.9 ? 'happy' : null });
          S.drawIon(g, lerp(610, 482, q), lerp(y + 6, y + 44, q), 58, 'I', { scaled: false, t, face: q > 0.9 ? 'happy' : null });
          const a = seg(p, 0.55, 0.72);
          if (a > 0) {
            g.fillStyle = Art.alpha(C.plum2, a); Art.round(g, 90, 318, 620, 76, 26); g.fill();
            F(g, 'Pb^2+(aq) + 2I^-(aq) -> PbI2(s)', 400, 356, { size: 34, alpha: a, color: C.sun });
          }
          Art.text(g, 'Net ionic', 400, 34, { font: 'display', size: 30, color: C.sun, alpha: seg(p, 0, 0.1) });
          Art.text(g, 'atoms balance, charge balances', 400, 418, { size: 26, color: C.leaf, alpha: seg(p, 0.75, 0.92) });
        },
      },
      {
        say: 'Here is why net ionic equations matter. <b>Any</b> soluble lead salt plus <b>any</b> soluble iodide gives this exact same reaction. The spectators can change, and the chemistry does not.',
        dur: 3.8,
        draw(g, p, t) {
          const pairs = [['Pb(NO3)2', 'KI', 'Pb', 'K'], ['Pb(C2H3O2)2', 'NaI', 'Pb', 'Na'], ['Pb(ClO4)2', 'NH4I', 'Pb', 'NH4']];
          pairs.forEach(([a, b], i) => {
            const y = 82 + i * 100, q = seg(p, 0.06 + i * 0.14, 0.24 + i * 0.14);
            Art.popIn(g, 206, y, q, (gg) => {
              gg.fillStyle = '#2B1A4A'; Art.round(gg, -190, -38, 380, 76, 18); gg.fill();
              Art.formula(gg, `${a} + ${b}`, 0, 0, { size: 28, color: '#fff' });
            });
            Art.arrow(g, 400, y, 500, 182, { color: C.sun, w: 5, p: seg(p, 0.3 + i * 0.12, 0.46 + i * 0.12) });
          });
          const a = seg(p, 0.62, 0.8);
          Art.popIn(g, 640, 182, a, (gg) => {
            gg.fillStyle = C.pink; Art.round(gg, -128, -66, 256, 132, 26); gg.fill();
            Art.formula(gg, 'Pb^2+ + 2I^-', 0, -22, { size: 30, color: '#fff' });
            Art.formula(gg, '-> PbI2(s)', 0, 24, { size: 30, color: '#fff' });
          });
          Art.moe(g, 660, 432, 130, 'cheer', { t });
          Art.text(g, 'same net ionic equation', 310, 412, { size: 28, color: C.sun, alpha: seg(p, 0.75, 0.92) });
        },
      },
    ],
  });

  /* ---------- Bench: net ionic stepper ---------- */
  const STEP_PAIRS = [['Pb(NO3)2', 'KI'], ['AgNO3', 'NaCl'], ['BaCl2', 'Na2SO4'], ['CuSO4', 'NaOH'], ['CaCl2', 'Na3PO4'], ['FeCl3', 'NaOH'], ['AgNO3', 'NaOH']];
  const stepper = { i: 0, step: 0, t0: 0, m: null };
  const STEP_SAY = [
    'Start from the balanced <b>molecular equation</b>, with phase labels. Every compound is written whole.',
    '<b>Split</b> every compound marked (aq) into its ions. The coefficient multiplies through, and subscripts become coefficients. Anything marked (s) or (l) stays whole.',
    'Look for <b>spectators</b>: the same ion, with the same count, on both sides.',
    '<b>Cross them out</b>. They appear on both sides, so they cancel.',
    'What is left is the <b>net ionic equation</b>. Reduce the coefficients if they share a factor.',
    '<b>Check it.</b> Atoms must match on both sides, and so must total charge.',
  ];
  function paintStep() {
    const s = stepper;
    s.m = S.mix(R_(STEP_PAIRS[s.i][0]), R_(STEP_PAIRS[s.i][1]));
    Lab.$('#step-say').innerHTML = `<p><b>Step ${s.step + 1} of 6.</b> ${STEP_SAY[s.step]}</p>`;
    Lab.$('#step-back').disabled = s.step === 0;
    const nb = Lab.$('#step-next');
    nb.disabled = s.step === 5;
    Lab.$('#step-pick').querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-pressed', String(k === s.i)));
  }
  const stepStage = Lab.stage('#c-step', {
    label: 'Three lines of equations. Spectator ions are highlighted and crossed out, leaving the net ionic equation.',
    draw(g, t) {
      const s = stepper, m = s.m;
      if (!m) return;
      const e = Lab.reducedMotion ? 9 : t - s.t0;
      const specSet = new Set(m.spectators.map((x) => x.id));
      const fit = (terms, want, maxW) => {
        const text = terms.map((x) => S.termText(x)).join(' + ');
        const w = measure(g, text, want);
        return Math.max(20, Math.min(want, want * (maxW / w)));
      };
      // Row 1: molecular.
      Art.text(g, 'Molecular', 26, 30, { size: 25, color: s.step === 0 ? C.sun : C.dim, align: 'left', font: 'display' });
      const molT = m.molecular.left.concat(m.molecular.right);
      const molSize = Math.min(29, fit(molT, 29, 640));
      eqRow(g, termItems(m.molecular.left).concat(['->']).concat(termItems(m.molecular.right)), 400, 72, molSize, { alpha: s.step === 0 ? 1 : 0.75 });
      if (s.step < 1) Art.text(g, 'Complete ionic', 26, 122, { size: 25, color: C.faint, align: 'left', font: 'display' });
      if (s.step < 4) {
        Art.text(g, 'Net ionic', 26, 278, { size: 25, color: C.faint, align: 'left', font: 'display' });
        g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 3; g.setLineDash([10, 10]);
        Art.round(g, 42, 298, 716, 68, 22); g.stroke(); g.setLineDash([]);
      }
      // Row 2: complete ionic, on two lines.
      if (s.step >= 1) {
        const q = s.step === 1 ? seg(e, 0, 0.5) : 1;
        Art.text(g, 'Complete ionic', 26, 122, { size: 25, color: s.step >= 1 && s.step <= 3 ? C.sun : C.dim, align: 'left', font: 'display', alpha: q });
        const highlight = s.step >= 2;
        const strikeP = s.step === 3 ? seg(e, 0.05, 0.75) : s.step > 3 ? 1 : 0;
        const fn = (tm) => {
          const isSpec = tm.ion && specSet.has(tm.ion);
          return {
            color: isSpec && highlight ? C.sun : '#fff',
            glow: isSpec && highlight ? 1 : 0,
            strike: isSpec ? strikeP : 0,
            alpha: isSpec && s.step > 3 ? 0.4 : 1,
          };
        };
        const size2 = 26;
        const leftRow = eqRow(g, termItems(m.complete.left, fn), 400, 166, size2, { alpha: q });
        const rightRow = eqRow(g, ['->'].concat(termItems(m.complete.right, fn)), 400, 222, size2, { alpha: s.step === 1 ? seg(e, 0.2, 0.7) : 1 });
        // Arcs joining matching spectators.
        if (s.step === 2) {
          leftRow.forEach((a) => {
            if (!a.item.term.ion || !specSet.has(a.item.term.ion)) return;
            const b = rightRow.find((r) => r.item.term.ion === a.item.term.ion);
            if (b) Art.arrow(g, a.x + a.w / 2, 182, b.x + b.w / 2, 204, { color: C.sun, w: 4, dash: [6, 7], p: seg(e, 0.1, 0.7), both: true, head: 10 });
          });
        }
      }
      // Row 3: net ionic.
      if (s.step >= 4) {
        const q = s.step === 4 ? ease.out(seg(e, 0, 0.5)) : 1;
        Art.text(g, 'Net ionic', 26, 278, { size: 25, color: C.sun, align: 'left', font: 'display', alpha: q });
        g.fillStyle = Art.alpha(C.plum2, q); Art.round(g, 42, 298, 716, 68, 22); g.fill();
        eqRow(g, termItems(m.net.left, () => ({ color: C.sun })).concat(['->']).concat(termItems(m.net.right, () => ({ color: C.sun }))), 400, 332, 31, { alpha: q });
      }
      if (s.step >= 5) {
        const ck = m.checks.net, q = seg(e, 0.1, 0.6);
        Art.text(g, `Charge: ${chargeSum(m.net.left)} = ${ck.leftCharge} on the left, ${ck.rightCharge} on the right`, 340, 396, { size: 25, color: C.leaf, alpha: q });
        Art.text(g, 'Atoms: same on both sides', 340, 428, { size: 25, color: C.leaf, alpha: seg(e, 0.4, 0.9) });
        Art.moe(g, 724, 444, 76, 'cheer', { t });
      }
    },
  });
  Lab.$('#step-pick').innerHTML = STEP_PAIRS.map(([a, b], i) => `<button type="button" data-value="${i}" aria-pressed="${i === 0}">${S.html(a)} + ${S.html(b)}</button>`).join('');
  Lab.segmented('#step-pick', (v) => { stepper.i = +v; stepper.step = 0; stepper.t0 = stepStage.t; paintStep(); });
  Lab.$('#step-next').addEventListener('click', () => { if (stepper.step < 5) { stepper.step++; stepper.t0 = stepStage.t; paintStep(); Lab.sound.pop(); } });
  Lab.$('#step-back').addEventListener('click', () => { if (stepper.step > 0) { stepper.step--; stepper.t0 = stepStage.t; paintStep(); } });
  paintStep();

  /* ---------- Bench: split it or keep it whole? ---------- */
  const SPLIT = [
    { f: 'NaCl(aq)', split: true, into: ['Na^+(aq)', 'Cl^-(aq)'], why: 'A soluble ionic compound. It really is separate ions in the water.' },
    { f: 'AgCl(s)', split: false, why: 'It is marked (s). A solid is not free ions, so it stays whole.' },
    { f: 'H2O(l)', split: false, why: 'Liquid water is molecules, so it stays whole.' },
    { f: 'CO2(g)', split: false, why: 'A gas is not dissolved ions, so it stays whole.' },
    { f: 'HCl(aq)', split: true, into: ['H^+(aq)', 'Cl^-(aq)'], why: 'HCl is a strong acid. In water it splits completely.' },
    { f: 'HC2H3O2(aq)', split: false, why: 'Acetic acid is a weak acid. Nearly all of it stays as whole molecules, even dissolved.' },
    { f: 'NH3(aq)', split: false, why: 'Ammonia is a weak base. It stays mostly as whole molecules.' },
    { f: 'KNO3(aq)', split: true, into: ['K^+(aq)', 'NO3^-(aq)'], why: 'A soluble ionic compound. Nitrate stays in one piece as a polyatomic ion.' },
    { f: 'BaSO4(s)', split: false, why: 'It is marked (s). It stays whole on either side of the arrow.' },
    { f: 'NaOH(aq)', split: true, into: ['Na^+(aq)', 'OH^-(aq)'], why: 'NaOH is a strong base. It splits completely.' },
    { f: 'Ca(NO3)2(aq)', split: true, into: ['Ca^2+(aq)', '2NO3^-(aq)'], why: 'A soluble ionic compound. The subscript 2 becomes a coefficient on nitrate.' },
    { f: 'H2SO4(aq)', split: true, into: ['2H^+(aq)', 'SO4^2-(aq)'], why: 'A strong acid. At this level, we split it into two H⁺ and one sulfate.' },
    { f: 'C6H12O6(aq)', split: false, why: 'Sugar dissolves, but as whole molecules. It makes no ions at all, so dissolved does not always mean split.' },
    { f: 'Na2CO3(aq)', split: true, into: ['2Na^+(aq)', 'CO3^2-(aq)'], why: 'A soluble ionic compound, thanks to group 1. Carbonate stays in one piece.' },
    { f: 'Fe(OH)3(s)', split: false, why: 'It is marked (s). Solids stay whole.' },
  ];
  const splitGame = { order: [], i: 0, score: 0, answered: null, t0: 0, done: false };
  const shuffled = () => SPLIT.slice().sort(() => Math.random() - 0.5);
  function startSplit() {
    Object.assign(splitGame, { order: shuffled(), i: 0, score: 0, answered: null, done: false });
    syncSplit();
  }
  function syncSplit() {
    const g = splitGame;
    const asking = !g.answered && !g.done;
    Lab.$('#split-yes').hidden = Lab.$('#split-no').hidden = !asking;
    const nb = Lab.$('#split-next');
    nb.hidden = asking;
    nb.textContent = g.done ? 'Play again' : g.i === g.order.length - 1 ? 'See my score' : 'Next formula';
  }
  function answerSplit(val) {
    const g = splitGame;
    if (g.answered || g.done) return;
    const q = g.order[g.i], ok = val === q.split;
    if (ok) g.score++;
    g.answered = { ok, val };
    g.t0 = splitStage.t;
    if (ok) Lab.sound.good(); else Lab.sound.bad();
    Lab.$('#split-say').innerHTML = `<p><b>${ok ? 'Yes.' : 'Not quite.'} ${q.split ? 'Split it.' : 'Keep it whole.'}</b> ${q.why}</p>`;
    syncSplit();
  }
  Lab.$('#split-yes').addEventListener('click', () => answerSplit(true));
  Lab.$('#split-no').addEventListener('click', () => answerSplit(false));
  Lab.$('#split-next').addEventListener('click', () => {
    const g = splitGame;
    if (g.done) { startSplit(); return; }
    if (g.i < g.order.length - 1) { g.i++; g.answered = null; syncSplit(); return; }
    g.done = true;
    if (g.score === g.order.length) { Lab.confetti(); Lab.collection.award(1); }
    Lab.$('#split-say').innerHTML = `<p><b>You got ${g.score} of ${g.order.length}.</b> ${g.score === g.order.length ? 'A perfect sort, and a new element for you.' : 'Read the phase label first, then ask if it is a strong electrolyte.'}</p>`;
    syncSplit();
  });
  function bigCard(g, f, x, y, size = 44, fill = '#FFFDF2', ink = '#22123A', alpha = 1) {
    const w = measure(g, f, size) + 48, h = size * 1.9;
    g.save(); g.globalAlpha *= alpha;
    g.fillStyle = fill; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3.5;
    Art.round(g, x - w / 2, y - h / 2, w, h, 18); g.fill(); g.stroke();
    Art.formula(g, f, x, y, { size, color: ink });
    g.restore();
  }
  const splitStage = Lab.stage('#c-split', {
    h: 320, bg: 'micro', label: 'A chemical formula on a card. It splits into ions if it is a strong electrolyte, or stays whole if not.',
    draw(g, t) {
      const G = splitGame;
      if (!G.order.length) return;
      Art.text(g, `${G.score} right so far`, 26, 34, { size: 25, color: C.sun, align: 'left', font: 'display' });
      if (G.done) {
        Art.text(g, `${G.score} of ${G.order.length}`, 400, 140, { font: 'display', size: 64, color: C.sun });
        Art.moe(g, 400, 310, 120, G.score >= G.order.length - 2 ? 'cheer' : 'think', { t });
        return;
      }
      Art.text(g, `${G.i + 1} of ${G.order.length}`, 774, 34, { size: 25, color: C.dim, align: 'right' });
      const q = G.order[G.i];
      if (!G.answered) {
        bigCard(g, q.f, 400, 150 + Math.sin(t * 1.6) * 4, 46);
        Art.text(g, 'Is this really separate ions?', 400, 268, { size: 28 });
        return;
      }
      const e = Lab.reducedMotion ? 9 : t - G.t0;
      const ok = G.answered.ok;
      if (q.split) {
        const s = ease.back(clamp(e / 0.7));
        q.into.forEach((f, i) => bigCard(g, f, 400 + (i ? 1 : -1) * 170 * s, 150, 36, i ? '#D7F3FF' : '#FFE1F1'));
        if (s < 0.3) bigCard(g, q.f, 400, 150, 46);
        Art.text(g, 'splits into ions', 400, 268, { font: 'display', size: 32, color: C.cyan, alpha: clamp(e * 2) });
        Art.burst(g, 400, 150, clamp(e / 0.8), { n: 14, r: 130 });
      } else {
        const wob = Math.sin(e * 12) * 6 * Math.exp(-e * 3);
        bigCard(g, q.f, 400 + wob, 150, 46);
        Art.ring(g, 400, 150, 150, { color: C.sun, w: 4, dash: [8, 10], p: clamp(e * 1.6) });
        Art.text(g, 'stays whole', 400, 268 + 8, { font: 'display', size: 32, color: C.sun, halo: true, alpha: clamp(e * 2) });
      }
      Art.text(g, ok ? 'Correct' : 'Not quite', 400, 48, { font: 'display', size: 30, color: ok ? C.leaf : C.red, alpha: clamp(e * 3) });
    },
  });
  startSplit();
});
