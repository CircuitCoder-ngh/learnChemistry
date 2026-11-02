/* Lesson 10.2: Phase changes. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const fmtDeg = (T, d = 0) => `${T < 0 ? '−' : ''}${Lab.fmt(Math.abs(T), d)} °C`;

  /* ---------- Real water numbers ---------- */
  const CICE = 2.09, CW = 4.18, CST = 2.0, HF = 334, HV = 2260;
  const T_START = -20, T_END = 120;
  const COL = { ice: C.violet, melt: C.cyan, water: C.water, boil: C.sun, steam: C.fire };
  function stages(m) {
    return [
      { id: 'ice', q: (m * CICE * (0 - T_START)) / 1000, a: T_START, b: 0 },
      { id: 'melt', q: (m * HF) / 1000, a: 0, b: 0 },
      { id: 'water', q: (m * CW * 100) / 1000, a: 0, b: 100 },
      { id: 'boil', q: (m * HV) / 1000, a: 100, b: 100 },
      { id: 'steam', q: (m * CST * (T_END - 100)) / 1000, a: 100, b: T_END },
    ];
  }
  /** Where you are after adding q kJ. u is the stage index plus the fraction through it. */
  function stateAt(m, q) {
    const S = stages(m);
    let left = q;
    for (let i = 0; i < S.length; i++) {
      if (left <= S[i].q || i === S.length - 1) {
        const f = clamp(left / S[i].q);
        return fromU(i + f);
      }
      left -= S[i].q;
    }
    return fromU(5);
  }
  function fromU(u) {
    u = clamp(u, 0, 5);
    const i = Math.min(4, Math.floor(u)), f = u - i;
    const T = i === 0 ? lerp(T_START, 0, f) : i === 1 ? 0 : i === 2 ? lerp(0, 100, f) : i === 3 ? 100 : lerp(100, T_END, f);
    return { u, i, f, T, melt: clamp(u - 1), boil: clamp(u - 3) };
  }

  /* ---------- Particle view: a pure function of state and time ---------- */
  const HEX = [[0, 0]];
  for (let k = 0; k < 6; k++) HEX.push([Math.cos((k * TAU) / 6), Math.sin((k * TAU) / 6)]);
  for (let k = 0; k < 6; k++) HEX.push([2 * Math.cos((k * TAU) / 6), 2 * Math.sin((k * TAU) / 6)]);
  for (let k = 0; k < 6; k++) HEX.push([1.732 * Math.cos(((k + 0.5) * TAU) / 6), 1.732 * Math.sin(((k + 0.5) * TAU) / 6)]);
  const NP = HEX.length;
  const RANK_M = HEX.map((h, i) => i).sort((a, b) => Math.hypot(...HEX[b]) - Math.hypot(...HEX[a]) || a - b);
  const meltOrder = []; RANK_M.forEach((idx, k) => { meltOrder[idx] = k; });
  const boilOrder = HEX.map((h, i) => i).sort((a, b) => HEX[a][1] - HEX[b][1] || a - b);
  const boilRank = []; boilOrder.forEach((idx, k) => { boilRank[idx] = k; });
  const PAIRS = [];
  for (let i = 0; i < NP; i++) for (let j = i + 1; j < NP; j++) {
    if (Math.hypot(HEX[i][0] - HEX[j][0], HEX[i][1] - HEX[j][1]) < 1.15) PAIRS.push([i, j]);
  }
  const smooth = (x) => x * x * (3 - 2 * x);
  /** A triangle wave, -1..1: straight flight paths that bounce, with no dwelling at the walls. */
  const tri = (x) => (2 / Math.PI) * Math.asin(Math.sin(x));
  /**
   * st: { T, melt, boil, super }, tau: a clock that runs faster when hot.
   * Hot gas molecules swing in wide arcs that leave the circle, so gas really looks sparse.
   */
  function particles(g, cx, cy, R, st, t, tau, o = {}) {
    const sp = o.sp || R * 0.405, f = o.f || 'H2O', s = o.s || R * 0.165;
    const heat = clamp((st.T + 40) / 170);
    const pos = [];
    for (let i = 0; i < NP; i++) {
      const mi = smooth(clamp((st.melt * (NP + 4) - meltOrder[i]) / 4));
      const bi = smooth(clamp((st.boil * (NP + 4) - boilRank[i]) / 4));
      const vib = 1.2 + 4.5 * heat;
      const sx = cx + HEX[i][0] * sp + wander(i + 1, t * 9) * vib, sy = cy + HEX[i][1] * sp + wander(i + 31, t * 9) * vib;
      const roam = 8 + 20 * heat;
      const lx = cx + HEX[i][0] * sp * 0.96 + (rand(i + 3) - 0.5) * sp * 0.8 + wander(i + 7, tau * 0.9) * roam;
      const ly = cy + HEX[i][1] * sp * 0.96 + 6 + (rand(i + 9) - 0.5) * sp * 0.8 + wander(i + 17, tau * 0.9) * roam;
      const amp = st.super ? 0.85 : i < 6 ? 0.85 : 1.9;
      const gx = cx + tri(tau * (0.9 + rand(i + 1) * 0.9) + i * 2.1) * R * amp;
      const gy = cy + tri(tau * (0.75 + rand(i + 2) * 0.9) + i * 4.3) * R * amp;
      const x = lerp(lerp(sx, lx, mi), gx, bi), y = lerp(lerp(sy, ly, mi), gy, bi);
      const rot = lerp(lerp(i % 2 ? 0.5 : -0.5, rand(i + 5) * TAU + wander(i, tau * 0.5) * 0.8, mi), tau * (0.8 + rand(i) * 0.6) + i, bi);
      pos.push({ x, y, rot, mi, bi });
    }
    // Forces: strong and regular in the solid, flickering in the liquid, gone in the gas.
    if (o.forces !== false) {
      g.save(); g.strokeStyle = C.sun; g.lineCap = 'round'; g.setLineDash([1, 8]);
      PAIRS.forEach(([a, b]) => {
        const A = pos[a], B = pos[b];
        const sol = (1 - A.mi) * (1 - B.mi) * (1 - A.bi) * (1 - B.bi);
        if (sol > 0.02) { g.globalAlpha = 0.95 * sol; g.lineWidth = 5; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke(); }
      });
      for (let a = 0; a < NP; a++) for (let b = a + 1; b < NP; b++) {
        const A = pos[a], B = pos[b];
        const liq = Math.max(A.mi, 0.001) * Math.max(B.mi, 0.001) * (1 - A.bi) * (1 - B.bi);
        if (liq < 0.05) continue;
        const d = Math.hypot(A.x - B.x, A.y - B.y);
        if (d < sp * 1.15) { g.globalAlpha = 0.6 * liq * clamp((sp * 1.15 - d) / (sp * 0.25)); g.lineWidth = 3.5; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke(); }
      }
      g.restore();
    }
    pos.forEach((q, i) => Art.molecule(g, q.x, q.y, s, f, { rot: q.rot, style: 'fill', atomScale: 1.28, labels: false, seed: i }));
  }

  /* ---------- The heating curve chart ---------- */
  const STYLE_W = [0.11, 0.17, 0.22, 0.38, 0.12];
  /**
   * Draw the curve. u is progress in stage units. z = 0 is stylized widths, z = 1 is true scale.
   */
  function curve(g, b, m, u, z, o = {}) {
    const S = stages(m), total = S.reduce((a, s) => a + s.q, 0);
    const wid = S.map((s, i) => lerp(STYLE_W[i], s.q / total, z));
    const Xu = (uu) => {
      let x = 0, left = clamp(uu, 0, 5);
      for (let i = 0; i < 5 && left > 0; i++) { const f = Math.min(1, left); x += wid[i] * f; left -= f; }
      return b.x0 + x * (b.x1 - b.x0);
    };
    const Y = (T) => b.y1 - ((T + 30) / 160) * (b.y1 - b.y0);
    // Plot background and guide lines.
    g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 10); g.fill();
    g.save(); g.setLineDash([4, 7]); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2;
    [0, 100].forEach((T) => { g.beginPath(); g.moveTo(b.x0, Y(T)); g.lineTo(b.x1, Y(T)); g.stroke(); });
    g.restore();
    [[0, '0'], [100, '100']].forEach(([T, l]) => Art.text(g, l, b.x0 - 10, Y(T), { size: 22, align: 'right', color: C.dim }));
    Art.text(g, o.yLabel || 'Temperature (°C)', b.x0 - 2, b.y0 - 16, { size: 21, align: 'left', color: C.dim });
    Art.text(g, o.xLabel || 'Heat added', (b.x0 + b.x1) / 2, b.y1 + 22, { size: 21, color: C.dim });
    // The ghost of the path ahead, then the bright path travelled.
    const line = (from, to, col, w, alpha) => {
      g.save(); g.globalAlpha *= alpha; g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath();
      const start = fromU(from); g.moveTo(Xu(from), Y(start.T));
      for (let k = Math.floor(from) + 1; k < to; k++) { const st = fromU(k); g.lineTo(Xu(k), Y(st.T)); }
      const en = fromU(to); g.lineTo(Xu(to), Y(en.T)); g.stroke(); g.restore();
    };
    line(0, 5, '#fff', 5, 0.18);
    for (let i = 0; i < 5; i++) {
      if (u <= i) break;
      line(i, Math.min(u, i + 1), COL[S[i].id], 9, 1);
    }
    if (o.dot !== false) {
      const st = fromU(u), x = Xu(u), y = Y(st.T);
      Art.glow(g, x, y, 34, '#fff', 0.5);
      g.fillStyle = '#fff'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      g.beginPath(); g.arc(x, y, 10, 0, TAU); g.fill(); g.stroke();
    }
    return { Xu, Y, total, wid };
  }
  const zoomBg = { bg1: '#2E1D55', bg2: '#150A28' };

  /* ---------- Story 1: why the temperature stops ---------- */
  const PX = 188, PY = 196, PR = 158;
  const CB = { x0: 424, x1: 770, y0: 56, y1: 370 };
  function curveScene(g, t, u, o = {}) {
    const st = fromU(u);
    const tau = t * (0.5 + 1.4 * clamp((st.T + 30) / 150));
    const c = curve(g, CB, 100, u, o.z || 0, {});
    Art.zoom(g, c.Xu(u), c.Y(st.T), PX, PY, PR, (gg, cx, cy, R) => particles(gg, cx, cy, R, st, t, tau), { p: 1 });
    // Moving heat under the particles.
    if (o.flame !== false) Art.flame(g, PX, 450, 56, t, { kind: 'blue', wide: 1.5 });
    Art.text(g, fmtDeg(st.T), PX - 148, 418, { font: 'display', size: 42, color: C.sun, align: 'left' });
    return { c, st };
  }
  function pillOver(g, text, col, x = (CB.x0 + CB.x1) / 2) { Art.pill(g, text, x, 422, { size: 27, font: 'display', color: col, text: '#1A0F2E' }); }
  Lab.story('#story-curve', {
    title: 'From ice to steam',
    scenes: [
      {
        say: 'Here is 100 g of ice at $-20\\ ^\\circ\\text{C}$. In the circle are its molecules, held in place by hydrogen bonds. They only vibrate. The graph will track <b>temperature</b> as we add <b>heat</b>.',
        dur: 2.6,
        draw(g, p, t) {
          const { c } = curveScene(g, t, 0, { flame: false });
          const a = seg(p, 0.3, 0.7);
          Art.arrow(g, CB.x0 + 40, c.Y(-20) - 32, CB.x0 + 8, c.Y(-20) - 6, { color: C.ink, w: 5, p: a });
          Art.text(g, 'you are here', CB.x0 + 44, c.Y(-20) - 46, { size: 25, align: 'left', alpha: a });
          pillOver(g, 'Solid ice', COL.ice);
        },
      },
      {
        say: 'Turn on the heat. The molecules <b>vibrate faster</b>, and that is exactly what a rising temperature means. The line climbs.',
        dur: 3,
        draw(g, p, t) {
          curveScene(g, t, ease.inOut(seg(p, 0.1, 0.92)));
          pillOver(g, 'Warming: faster vibration', COL.ice);
        },
      },
      {
        say: 'At $0\\ ^\\circ\\text{C}$, the temperature <b>stops rising</b>, though the flame is still on. All the heat now goes into pulling molecules out of the crystal. Watch the dotted forces break.',
        dur: 5,
        draw(g, p, t) {
          const u = 1 + ease.inOut(seg(p, 0.08, 0.95));
          const { c } = curveScene(g, t, u);
          const mid = c.Xu(1.5);
          Art.text(g, 'flat!', mid, c.Y(0) - 34, { font: 'display', size: 38, color: C.cyan, alpha: seg(p, 0.2, 0.4) });
          pillOver(g, 'Melting: same temperature', COL.melt);
        },
      },
      {
        say: 'Once it is all liquid, the temperature climbs again. Molecules now <b>slide past each other</b> faster and faster, still touching.',
        dur: 3.6,
        draw(g, p, t) {
          curveScene(g, t, 2 + ease.inOut(seg(p, 0.08, 0.95)));
          pillOver(g, 'Warming: faster sliding', COL.water);
        },
      },
      {
        say: 'At $100\\ ^\\circ\\text{C}$ it stops again, and this time for much longer. Every molecule must escape <b>all</b> of its neighbors. No bonds inside the molecules break.',
        dur: 5.5,
        draw(g, p, t) {
          const u = 3 + ease.inOut(seg(p, 0.08, 0.95));
          const { c } = curveScene(g, t, u);
          Art.text(g, 'flat again!', c.Xu(3.5), c.Y(100) - 34, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.2, 0.4) });
          pillOver(g, 'Boiling: same temperature', COL.boil);
        },
      },
      {
        say: 'Now it is all steam. With no neighbors holding them back, the molecules just fly faster, and the temperature rises once more.',
        dur: 3,
        draw(g, p, t) {
          curveScene(g, t, 4 + ease.inOut(seg(p, 0.08, 0.95)));
          pillOver(g, 'Warming: faster flying', COL.steam);
        },
      },
      {
        say: 'Here is the true shape, to scale. The slopes use $q = mc\\Delta T$, and the flats use $q = m\\Delta H$. Boiling is by far the biggest part: almost <b>7 times</b> the heat of melting.',
        dur: 3.6,
        draw(g, p, t) {
          const z = ease.inOut(seg(p, 0.05, 0.6));
          const box = { x0: 86, x1: 770, y0: 62, y1: 352 };
          const c = curve(g, box, 100, 5, z, { dot: false });
          const a = seg(p, 0.6, 0.85);
          Art.text(g, 'melting 33 kJ', c.Xu(1.5), c.Y(0) + 34, { size: 25, color: C.cyan, alpha: a, align: z > 0.5 ? 'left' : 'center' });
          Art.text(g, 'boiling 226 kJ', c.Xu(3.5), c.Y(100) - 28, { font: 'display', size: 34, color: C.sun, alpha: a });
          Art.text(g, 'warming 42 kJ', c.Xu(2.5) + 18, c.Y(50) + 6, { size: 25, color: C.water, alpha: a, align: 'left' });
          Art.pill(g, 'To scale', 690, c.Y(-14), { size: 25, color: C.plum2, text: '#fff', alpha: a });
          Art.text(g, 'q = mcΔT on slopes.  q = mΔH on flats.', 428, 418, { size: 28, alpha: seg(p, 0.8, 1) });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: heating curve lab ---------- */
  const lab = { m: 100, frac: 0, burner: 'off', tau: 0, lastCalc: -1 };
  const CURVE_BOX = { x0: 62, x1: 500, y0: 42, y1: 392 };
  const qSlider = Lab.$('#curve-q');
  function totalHeat(m) { return stages(m).reduce((a, s) => a + s.q, 0); }
  function paintLab() {
    const total = totalHeat(lab.m), q = lab.frac * total, st = stateAt(lab.m, q);
    const S = stages(lab.m);
    Lab.$('#curve-q-out').textContent = `${Lab.sig(q, 3)} kJ of ${Lab.sig(total, 3)} kJ`;
    Lab.$('#curve-T').textContent = fmtDeg(st.T, 1);
    const left = lab.m;
    let mix;
    if (st.i === 0) mix = `${left} g ice`;
    else if (st.i === 1) mix = `${Lab.fmt(left * (1 - st.f), 0)} g ice, ${Lab.fmt(left * st.f, 0)} g water`;
    else if (st.i === 2) mix = `${left} g water`;
    else if (st.i === 3) mix = `${Lab.fmt(left * (1 - st.f), 0)} g water, ${Lab.fmt(left * st.f, 0)} g steam`;
    else mix = `${left} g steam`;
    Lab.$('#curve-mix').textContent = mix;
    Lab.$('#curve-goes').textContent = st.i % 2 ? 'Separating molecules' : 'Speeding up molecules';
    // The live calculation for the current stage.
    const key = `${lab.m}|${st.i}|${Math.round(st.f * 400)}`;
    if (key === lab.lastCalc) return;
    lab.lastCalc = key;
    const s = S[st.i];
    let html;
    const unit = `\\dfrac{\\text{J}}{\\text{g}\\ ^\\circ\\text{C}}`;
    if (st.i % 2 === 0) {
      const c = ['2.09', '', '4.18', '', '2.0'][st.i], cNum = [CICE, 0, CW, 0, CST][st.i], dT = st.T - s.a;
      const name = ['Warming the ice', '', 'Warming the liquid', '', 'Warming the steam'][st.i];
      html = `<p><b>${name}.</b> Temperature is rising, so use $q = mc\\Delta T$.</p><div class="calc-line">$$q = (${lab.m}\\text{ g})\\left(${c}\\ ${unit}\\right)(${Lab.fmt(dT, 1)}\\ ^\\circ\\text{C}) = ${Lab.fmt((lab.m * cNum * dT) / 1000, 2)}\\text{ kJ}$$</div>`;
    } else {
      const H = st.i === 1 ? HF : HV, sub = st.i === 1 ? 'fus' : 'vap';
      const done = lab.m * st.f;
      html = `<p><b>${st.i === 1 ? 'Melting' : 'Boiling'}.</b> Temperature is flat, so use $q = m\\Delta H_\\text{${sub}}$ for the part that has changed so far.</p><div class="calc-line">$$q = (${Lab.fmt(done, 1)}\\text{ g})\\left(${H}\\ \\dfrac{\\text{J}}{\\text{g}}\\right) = ${Lab.fmt((done * H) / 1000, 2)}\\text{ kJ}$$</div>`;
    }
    Lab.$('#curve-calc').innerHTML = Lab.texString(html);
  }
  Lab.stage('#c-curve', {
    label: 'A heating curve for water, with a magnifier showing the molecules at the current point.',
    draw(g, t, dt) {
      const total = totalHeat(lab.m);
      if (lab.burner !== 'off' && dt > 0) {
        lab.frac = clamp(lab.frac + ((lab.burner === 'heat' ? 1 : -1) * dt) / 34);
        qSlider.value = Math.round(lab.frac * 1000);
        Lab.paintRange(qSlider);
        if (lab.frac <= 0 || lab.frac >= 1) { burnerSeg.set('off'); }
        paintLab();
      }
      const q = lab.frac * total, st = stateAt(lab.m, q);
      lab.tau += (dt || 0) * (0.5 + 1.5 * clamp((st.T + 30) / 150));
      const c = curve(g, CURVE_BOX, lab.m, st.u, 1, { xLabel: `Heat added, up to ${Lab.sig(total, 3)} kJ` });
      const a = 0.9;
      Art.text(g, 'melting', c.Xu(2) + 22, c.Y(0) + 2, { size: 22, color: COL.melt, align: 'left', alpha: a });
      Art.text(g, 'boiling: by far the longest', c.Xu(3.5), c.Y(100) - 24, { size: 24, color: COL.boil, alpha: a });
      Art.text(g, 'warming', c.Xu(2.5) + 16, c.Y(50), { size: 22, color: COL.water, align: 'left', alpha: a });
      // The particle view.
      const zx = 656, zy = 146, zr = 124;
      Art.zoom(g, c.Xu(st.u), c.Y(st.T), zx, zy, zr, (gg, cx, cy, R) => particles(gg, cx, cy, R, st, t, lab.tau), zoomBg);
      Art.text(g, fmtDeg(st.T, 1), zx, 312, { font: 'display', size: 46, color: C.sun });
      const name = ['Warming ice', 'Melting', 'Warming water', 'Boiling', 'Warming steam'][st.i];
      Art.pill(g, name, zx, 362, { size: 28, font: 'display', color: COL[stages(lab.m)[st.i].id], text: '#1A0F2E' });
      if (lab.burner === 'heat') Art.flame(g, zx, 446, 50, t, { kind: 'blue', wide: 1.5 });
      if (lab.burner === 'cool') Art.text(g, 'cooling', zx, 412, { size: 25, color: C.cyan });
    },
  });
  const burnerSeg = Lab.segmented('#curve-burner', (v) => {
    if (v === 'heat' && lab.frac >= 1) lab.frac = 0;
    if (v === 'cool' && lab.frac <= 0) lab.frac = 1;
    lab.burner = v;
  });
  Lab.segmented('#curve-m', (v) => { lab.m = +v; lab.lastCalc = -1; paintLab(); });
  Lab.bind(qSlider, null, null, (v) => { lab.frac = v / 1000; paintLab(); });

  /* ---------- Bench: the heat bill ---------- */
  const STATE_OF = (T) => (T <= 0 ? 0 : T <= 100 ? 1 : 2);
  function pathRows(m, a, b) {
    const lo = Math.min(a, b), hi = Math.max(a, b);
    const sLo = STATE_OF(lo), sHi = STATE_OF(hi);
    const rows = [
      { id: 'ice', name: 'Warm the ice', c: CICE, dT: sLo === 0 ? Math.min(hi, 0) - lo : 0 },
      { id: 'melt', name: 'Melt', H: HF, on: sLo === 0 && sHi >= 1 },
      { id: 'water', name: 'Warm the water', c: CW, dT: sHi >= 1 && sLo <= 1 ? Math.min(hi, 100) - Math.max(lo, 0) : 0 },
      { id: 'boil', name: 'Boil', H: HV, on: sLo <= 1 && sHi === 2 },
      { id: 'steam', name: 'Warm the steam', c: CST, dT: sHi === 2 ? hi - Math.max(lo, 100) : 0 },
    ];
    const down = b < a;
    rows.forEach((r) => {
      r.q = r.H ? (r.on ? m * r.H : 0) : m * r.c * r.dT;
      r.used = r.H ? r.on : r.dT > 0;
      if (down) r.name = { ice: 'Cool the ice', melt: 'Freeze', water: 'Cool the water', boil: 'Condense', steam: 'Cool the steam' }[r.id];
    });
    return { rows, down, total: rows.reduce((s, r) => s + r.q, 0) };
  }
  const bill = { m: 25, a: -10, b: 110, show: [0, 0, 0, 0, 0], total: 0 };
  Lab.stage('#c-path', {
    h: 450,
    label: 'A bar for each piece of the trip, drawn to scale, with the total heat below.',
    draw(g, t, dt) {
      const P = pathRows(bill.m, bill.a, bill.b);
      const maxQ = Math.max(1, ...P.rows.map((r) => r.q));
      const k = clamp((dt || 1) * 7);
      const x0 = 236, full = 400;
      P.rows.forEach((r, i) => {
        const y = 44 + i * 66;
        bill.show[i] = lerp(bill.show[i], r.q / maxQ, k);
        const on = r.used;
        Art.text(g, r.name, 28, y, { size: 26, align: 'left', color: on ? C.ink : C.faint });
        g.fillStyle = 'rgba(255,255,255,.08)'; Art.round(g, x0, y - 20, full, 40, 12); g.fill();
        const w = bill.show[i] * full;
        if (w > 1) { g.fillStyle = COL[r.id]; Art.round(g, x0, y - 20, Math.max(8, w), 40, 12); g.fill(); }
        Art.text(g, on ? `${Lab.sig(r.q / 1000, 3)} kJ` : 'none', 778, y, { font: 'display', size: on ? 30 : 24, align: 'right', color: on ? COL[r.id] : C.faint });
      });
      bill.total = lerp(bill.total, P.total, k);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(28, 368, 750, 3);
      Art.text(g, P.down ? 'Total heat released' : 'Total heat needed', 28, 410, { font: 'display', size: 34, align: 'left' });
      Art.text(g, `${Lab.sig(bill.total / 1000, 3)} kJ`, 778, 410, { font: 'display', size: 50, align: 'right', color: P.down ? C.cyan : C.pink });
      void t;
    },
  });
  function paintBill() {
    const P = pathRows(bill.m, bill.a, bill.b);
    const lines = P.rows.filter((r) => r.used).map((r) => (r.H
      ? `<div class="calc-line">$$\\text{${r.name}:}\\quad (${bill.m}\\ \\cancel{\\text{g}})\\left(${r.H}\\ \\dfrac{\\text{J}}{\\cancel{\\text{g}}}\\right) = ${Lab.sig(r.q / 1000, 3)}\\text{ kJ}$$</div>`
      : `<div class="calc-line">$$\\text{${r.name}:}\\quad (${bill.m}\\ \\cancel{\\text{g}})\\left(${r.c === 2 ? '2.0' : r.c}\\ \\dfrac{\\text{J}}{\\cancel{\\text{g}}\\ \\cancel{^\\circ\\text{C}}}\\right)(${r.dT}\\ \\cancel{^\\circ\\text{C}}) = ${Lab.sig(r.q / 1000, 3)}\\text{ kJ}$$</div>`)).join('');
    Lab.$('#path-calc').innerHTML = Lab.texString(bill.a === bill.b ? '<p>Start and end are the same, so there is nothing to pay.</p>' : lines);
  }
  Lab.bind('#path-m', '#path-m-out', (v) => `${v} g`, (v) => { bill.m = v; paintBill(); });
  Lab.bind('#path-a', '#path-a-out', (v) => fmtDeg(v), (v) => { bill.a = v; paintBill(); });
  Lab.bind('#path-b', '#path-b-out', (v) => fmtDeg(v), (v) => { bill.b = v; paintBill(); });

  /* ---------- Story 2: vapor pressure ---------- */
  /** Vapor molecules that hop in a jar, deterministic in t. n molecules between x0..x1, y0..y1. */
  function vaporSwarm(g, n, x0, x1, y0, y1, t, o = {}) {
    for (let i = 0; i < n; i++) {
      const sx = 0.5 + rand(i + 3) * 0.5, sy = 0.6 + rand(i + 5) * 0.6;
      const speed = o.speed || 1;
      const X = 0.5 + 0.5 * Math.sin(t * sx * speed + i * 2.4), Y = 0.5 + 0.5 * Math.sin(t * sy * speed + i * 1.3);
      Art.molecule(g, lerp(x0, x1, X), lerp(y0, y1, Y), o.s || 22, o.f || 'H2O', { rot: t * sx + i, style: 'fill', atomScale: 1.28, labels: false });
    }
  }
  function liquidRow(g, x0, x1, y0, y1, n, t, f = 'H2O', s = 22) {
    const cols = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      const x = lerp(x0, x1, (c + 0.5 + (r % 2) * 0.3) / (cols + 0.3)), y = lerp(y0, y1, (r + 0.5) / 2);
      Art.molecule(g, x + wander(i + 1, t * 1.2) * 5, y + wander(i + 7, t * 1.2) * 4, s, f, { rot: rand(i) * TAU + Math.sin(t + i) * 0.3, style: 'fill', atomScale: 1.28, labels: false });
    }
  }
  function jar(g, cx, base, w, h, level, o = {}) {
    const x0 = cx - w / 2, x1 = cx + w / 2, top = base - h, surface = base - h * level;
    const lg = g.createLinearGradient(0, surface, 0, base);
    lg.addColorStop(0, Art.alpha(o.liquid || C.water, 0.55)); lg.addColorStop(1, Art.alpha(o.liquid || C.water, 0.85));
    g.fillStyle = 'rgba(214,240,255,.05)'; Art.round(g, x0, top, w, h, 14); g.fill();
    g.fillStyle = lg; g.fillRect(x0 + 2, surface, w - 4, base - surface - 2);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x0 + 2, surface, w - 4, 3);
    return { x0, x1, top, surface, base };
  }
  function jarGlass(g, cx, base, w, h, lid = true) {
    const x0 = cx - w / 2, top = base - h;
    g.strokeStyle = C.glass; g.lineWidth = 4; g.lineJoin = 'round';
    if (lid) { Art.round(g, x0, top, w, h, 14); g.stroke(); g.fillStyle = '#B8B2CF'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; Art.round(g, x0 - 8, top - 11, w + 16, 15, 5); g.fill(); g.stroke(); }
    else { g.beginPath(); g.moveTo(x0, top); g.lineTo(x0, base - 8); g.quadraticCurveTo(x0, base, x0 + 8, base); g.lineTo(x0 + w - 8, base); g.quadraticCurveTo(x0 + w, base, x0 + w, base - 8); g.lineTo(x0 + w, top); g.stroke(); }
  }
  /** A round pressure dial. frac 0..1 sets the needle. */
  function dial(g, x, y, r, frac, label, o = {}) {
    g.fillStyle = '#F4F0FF'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = '#6E6A86'; g.lineWidth = 2.5;
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * 0.75 + (i / 8) * Math.PI * 1.5;
      g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82); g.lineTo(x + Math.cos(a) * r * 0.94, y + Math.sin(a) * r * 0.94); g.stroke();
    }
    const a = Math.PI * 0.75 + clamp(frac) * Math.PI * 1.5;
    g.strokeStyle = o.color || '#E0245E'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r * 0.74, y + Math.sin(a) * r * 0.74); g.stroke();
    g.fillStyle = '#1A0F2E'; g.beginPath(); g.arc(x, y, r * 0.11, 0, TAU); g.fill();
    if (label) Art.text(g, label, x, y + r + 20, { size: o.size || 24, color: C.sun, font: 'display' });
  }
  function rateArrows(g, x, y, upW, downW, p) {
    Art.arrow(g, x - 26, y, x - 26, y - 76, { color: C.fire, w: upW, head: Math.max(15, upW * 2.1), p });
    Art.arrow(g, x + 26, y - 76, x + 26, y, { color: C.cyan, w: downW, head: Math.max(15, downW * 2.1), p });
  }
  Lab.story('#story-vapor', {
    title: 'Escaping molecules',
    scenes: [
      {
        say: 'Molecules in a liquid move at many different speeds. Now and then a <b>fast</b> one near the surface breaks free. That is <b>evaporation</b>. In an open dish, they are gone for good.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          const sy = 268;
          g.fillStyle = 'rgba(70,185,240,.55)'; g.fillRect(0, sy, W, H - sy);
          g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(0, sy, W, 4);
          liquidRow(g, 20, 780, sy + 14, H - 10, 22, t, 'H2O', 26);
          for (let i = 0; i < 4; i++) {
            const ph = (t * 0.28 + i * 0.25) % 1;
            const x = 350 + i * 130 + Math.sin(ph * 5 + i) * 24, y = lerp(sy + 8, -30, ease.out(ph));
            Art.molecule(g, x, y, 34, 'H2O', { rot: t * 1.5 + i, style: 'fill', atomScale: 1.28, labels: false, face: i === 1 ? 'grin' : null, t, alpha: 1 });
            g.save(); g.strokeStyle = C.fire; g.lineWidth = 4; g.lineCap = 'round'; g.globalAlpha *= 0.7;
            [-14, 0, 14].forEach((dx) => { g.beginPath(); g.moveTo(x + dx, y + 36); g.lineTo(x + dx, y + 58); g.stroke(); });
            g.restore();
          }
          Art.text(g, 'The fastest', 160, 112, { font: 'display', size: 38, color: C.fire, alpha: seg(p, 0.3, 0.6) });
          Art.text(g, 'ones escape', 160, 158, { font: 'display', size: 38, color: C.fire, alpha: seg(p, 0.3, 0.6) });
        },
      },
      {
        say: 'Now close the lid. Escaped molecules are trapped above the liquid. As they build up, some crash back in. That is <b>condensation</b>. At first, more leave than return.',
        dur: 3.6,
        draw(g, p, t) {
          const cx = 280, base = 420, w = 420, h = 360;
          const J = jar(g, cx, base, w, h, 0.32);
          liquidRow(g, J.x0 + 8, J.x1 - 8, J.surface + 8, base - 8, 12, t, 'H2O', 24);
          const n = Math.round(lerp(2, 7, ease.out(seg(p, 0.1, 0.95))));
          vaporSwarm(g, n, J.x0 + 34, J.x1 - 34, J.top + 40, J.surface - 40, t);
          jarGlass(g, cx, base, w, h);
          rateArrows(g, 640, 310, 14, lerp(3, 7, seg(p, 0.2, 1)), seg(p, 0.1, 0.4));
          Art.text(g, 'out', 614, 342, { size: 27, color: C.fire, alpha: seg(p, 0.2, 0.4) });
          Art.text(g, 'back', 668, 342, { size: 27, color: C.cyan, alpha: seg(p, 0.2, 0.4) });
          Art.text(g, 'More leave', 640, 118, { font: 'display', size: 32, alpha: seg(p, 0.3, 0.5) });
          Art.text(g, 'than return', 640, 154, { font: 'display', size: 32, alpha: seg(p, 0.3, 0.5) });
        },
      },
      {
        say: 'Soon the two rates are <b>equal</b>. Molecules still leave and return, but the vapor stops building up. This is <b>dynamic equilibrium</b>, and the steady pressure of the vapor is the <b>vapor pressure</b>.',
        dur: 3.6,
        draw(g, p, t) {
          const cx = 280, base = 420, w = 420, h = 360;
          const J = jar(g, cx, base, w, h, 0.32);
          liquidRow(g, J.x0 + 8, J.x1 - 8, J.surface + 8, base - 8, 12, t, 'H2O', 24);
          vaporSwarm(g, 10, J.x0 + 34, J.x1 - 34, J.top + 40, J.surface - 40, t);
          jarGlass(g, cx, base, w, h);
          dial(g, 640, 80, 50, 0.42 + Math.sin(t * 2.4) * 0.008, null);
          Art.text(g, 'vapor pressure', 640, 156, { size: 28, color: C.sun, alpha: seg(p, 0.5, 0.8) });
          Art.text(g, 'Equal!', 640, 214, { font: 'display', size: 44, color: C.leaf, alpha: seg(p, 0.15, 0.4) });
          rateArrows(g, 640, 350, 11, 11, 1);
          Art.text(g, 'out', 614, 380, { size: 27, color: C.fire });
          Art.text(g, 'back', 668, 380, { size: 27, color: C.cyan });
        },
      },
      {
        say: '<b>Temperature matters.</b> Warm water has more molecules fast enough to escape, so its vapor pressure is higher. At 20 °C water has about 18 torr. At 60 °C it has about 149 torr.',
        dur: 3.6,
        draw(g, p, t) {
          [[208, 3, '20 °C', '18 torr', 0.05, 0.9], [592, 15, '60 °C', '149 torr', 0.3, 1.5]].forEach(([cx, n, T, P, fr, sp], k) => {
            const base = 408, w = 330, h = 270;
            const J = jar(g, cx, base, w, h, 0.28);
            liquidRow(g, J.x0 + 8, J.x1 - 8, J.surface + 6, base - 6, 10, t, 'H2O', 20);
            const shown = Math.round(lerp(1, n, ease.out(seg(p, 0.1 + k * 0.1, 0.9))));
            vaporSwarm(g, shown, J.x0 + 28, J.x1 - 28, J.top + 30, J.surface - 30, t, { speed: sp, s: 20 });
            jarGlass(g, cx, base, w, h);
            Art.text(g, T, cx - 84, 62, { font: 'display', size: 38, color: k ? C.fire : C.cyan });
            dial(g, cx + 96, 62, 36, fr * ease.out(seg(p, 0.1, 0.8)), null);
            Art.text(g, P, cx, 432, { font: 'display', size: 28, color: C.sun, alpha: seg(p, 0.5, 0.8) });
          });
        },
      },
      {
        say: '<b>Forces matter too.</b> At the same 20 °C, water has about 18 torr and diethyl ether has about 440 torr. Ether has no hydrogen bonds to itself, so its molecules escape easily.',
        dur: 3.4,
        draw(g, p, t) {
          [[208, 3, 'Water', '18 torr', 0.05, 'hydrogen bonds hold on'], [592, 16, 'Diethyl ether', '440 torr', 0.75, 'weak forces let go']].forEach(([cx, n, name, P, fr, tag], k) => {
            const base = 372, w = 330, h = 240;
            const col = k ? '#FFE9A6' : C.water;
            const J = jar(g, cx, base, w, h, 0.28, { liquid: col });
            const shown = Math.round(lerp(1, n, ease.out(seg(p, 0.1, 0.9))));
            if (k) {
              for (let i = 0; i < shown; i++) {
                const X = 0.5 + 0.5 * Math.sin(t * (0.6 + rand(i) * 0.6) + i * 2.4), Y = 0.5 + 0.5 * Math.sin(t * (0.5 + rand(i + 3) * 0.7) + i * 1.3);
                drawEther(g, lerp(J.x0 + 40, J.x1 - 40, X), lerp(J.top + 26, J.surface - 26, Y), 12, t * 0.8 + i);
              }
              for (let i = 0; i < 8; i++) drawEther(g, lerp(J.x0 + 34, J.x1 - 34, (i % 4 + 0.5) / 4), J.surface + 20 + (i > 3 ? 32 : 0), 11, i * 2.1 + Math.sin(t + i) * 0.3);
            } else {
              liquidRow(g, J.x0 + 8, J.x1 - 8, J.surface + 6, base - 6, 10, t, 'H2O', 20);
              vaporSwarm(g, shown, J.x0 + 28, J.x1 - 28, J.top + 30, J.surface - 30, t, { s: 20 });
            }
            jarGlass(g, cx, base, w, h);
            Art.text(g, name, cx - 44, 62 - 16, { font: 'display', size: 34, color: col });
            dial(g, cx + 124, 62, 36, fr * ease.out(seg(p, 0.1, 0.8)), null);
            Art.text(g, P, cx, 398, { font: 'display', size: 28, color: C.sun, alpha: seg(p, 0.5, 0.8) });
            Art.text(g, tag, cx, 430, { size: 25, alpha: seg(p, 0.65, 0.9) });
          });
        },
      },
      {
        say: '<b>Boiling</b> starts when a bubble of vapor can survive inside the liquid. Its vapor pressure must push back as hard as the air pushing down. So a liquid boils when <b>vapor pressure equals outside pressure</b>.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          const sy = 110;
          const lg = g.createLinearGradient(0, sy, 0, H);
          lg.addColorStop(0, 'rgba(70,185,240,.55)'); lg.addColorStop(1, 'rgba(27,111,184,.85)');
          g.fillStyle = lg; g.fillRect(0, sy, W, H - sy);
          g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(0, sy, W, 4);
          const q = ease.back(seg(p, 0.1, 0.5));
          const bx = 400, by = 284 - seg(p, 0.75, 1) * 20, R = 118 * q;
          if (R > 0) {
            g.save(); g.fillStyle = '#20123A'; g.beginPath(); g.arc(bx, by, R, 0, TAU); g.fill();
            g.clip();
            vaporSwarm(g, 6, bx - R * 0.65, bx + R * 0.65, by - R * 0.65, by + R * 0.65, t * 1.4, { s: 22 });
            g.restore();
            g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 4; g.beginPath(); g.arc(bx, by, R, 0, TAU); g.stroke();
          }
          const a = seg(p, 0.4, 0.7);
          for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * TAU + 0.39;
            Art.arrow(g, bx + Math.cos(ang) * (R - 8), by + Math.sin(ang) * (R - 8), bx + Math.cos(ang) * (R + 34), by + Math.sin(ang) * (R + 34), { color: C.fire, w: 6, head: 15, p: a });
          }
          const b = seg(p, 0.5, 0.8);
          [130, 265, 400, 535, 670].forEach((x) => Art.arrow(g, x, 30, x, 94, { color: C.cyan, w: 8, head: 20, p: b }));
          Art.text(g, 'air pushes down', 150, 134, { size: 28, color: '#D6F7FF', alpha: b, halo: true });
          Art.text(g, 'vapor pushes out', 400, by + R + 54, { size: 28, color: '#FFD9B8', alpha: a, halo: true });
        },
      },
      {
        say: 'So <b>boiling point depends on pressure</b>. Air is thinner up high, so water boils cooler. It boils near 95 °C in Denver and 72 °C on Everest. A pressure cooker pushes back harder, so water boils near 120 °C.',
        dur: 4,
        draw(g, p, t) {
          // A profile from sea level, up past Denver's plateau, to the summit of Everest.
          const baseY = 450;
          const rock = g.createLinearGradient(0, 110, 0, baseY);
          rock.addColorStop(0, '#6A5A94'); rock.addColorStop(1, '#3B2763');
          g.fillStyle = rock;
          g.beginPath(); g.moveTo(180, baseY); g.lineTo(300, 322); g.lineTo(424, 306); g.lineTo(602, 118); g.lineTo(800, 352); g.lineTo(800, baseY); g.closePath(); g.fill();
          g.fillStyle = '#F4F0FF';
          g.beginPath(); g.moveTo(602, 118); g.lineTo(556, 170); g.lineTo(582, 160); g.lineTo(604, 182); g.lineTo(628, 156); g.lineTo(650, 174); g.closePath(); g.fill();
          g.fillStyle = '#2E8F4F'; g.beginPath(); g.moveTo(0, baseY); g.lineTo(0, 408); g.lineTo(186, 408); g.lineTo(226, baseY); g.closePath(); g.fill();
          const item = (x, y, name, T, P, a, px, py) => {
            g.save(); g.globalAlpha *= a;
            g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.setLineDash([4, 6]);
            g.beginPath(); g.moveTo(x, y + 44); g.lineTo(px, py); g.stroke(); g.setLineDash([]);
            g.fillStyle = C.sun; g.beginPath(); g.arc(px, py, 6, 0, TAU); g.fill();
            g.fillStyle = 'rgba(23,12,41,.88)'; Art.round(g, x - 100, y - 46, 200, 92, 14); g.fill();
            g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; g.stroke();
            Art.text(g, name, x, y - 26, { size: 22, color: C.ink });
            Art.text(g, T, x, y + 2, { font: 'display', size: 30, color: C.sun });
            Art.text(g, P, x, y + 30, { size: 21, color: C.dim });
            g.restore();
          };
          item(110, 296, 'Sea level', '100 °C', '760 torr', seg(p, 0.1, 0.3), 110, 408);
          item(358, 208, 'Denver', '95 °C', '630 torr', seg(p, 0.32, 0.52), 358, 314);
          item(602, 58, 'Mount Everest', '72 °C', '253 torr', seg(p, 0.54, 0.74), 602, 118);
          item(118, 76, 'Pressure cooker', '120 °C', '1520 torr', seg(p, 0.76, 0.96), 118, 122);
          Art.moe(g, 716, 446, 110, 'think', { t, flip: true });
        },
      },
    ],
  });
  /** Diethyl ether, drawn as its chain of five heavy atoms. Bond length b. */
  function drawEther(g, x, y, b, rot) {
    const c = Math.cos(rot), d = Math.sin(rot);
    const P = [[-2, 0.35, 'C'], [-1, -0.25, 'C'], [0, 0.35, 'O'], [1, -0.25, 'C'], [2, 0.35, 'C']];
    P.forEach(([ax, ay, el]) => Art.ball(g, x + (ax * c - ay * d) * b, y + (ax * d + ay * c) * b, el === 'O' ? b * 0.72 : b * 0.72, Art.elementColor(el)));
  }

  /* ---------- Bench: the bell jar ---------- */
  const LIQS = {
    water: { name: 'water', A: 8.07131, B: 1730.63, C: 233.426, col: C.water, f: 'H2O', s: 20, label: 'water' },
    ethanol: { name: 'ethanol', A: 8.20417, B: 1642.89, C: 230.3, col: '#C9B6FF', f: 'C2H5OH', s: 11, label: 'ethanol' },
    ether: { name: 'diethyl ether', A: 6.92, B: 1064.07, C: 228.8, col: '#FFE9A6', f: 'ether', s: 11, label: 'ether' },
  };
  const VP = (L, T) => Math.pow(10, L.A - L.B / (L.C + T));
  const BP = (L, P) => L.B / (L.A - Math.log10(P)) - L.C;
  const jr = { liq: 'water', T: 25, P: 760, view: 'curve', vapor: [], air: [], emit: 0, outRate: 0, inRate: 0, bubbleT: 0 };
  const JAR = { cx: 206, base: 396, rx: 170, top: 28, sy: 322 };
  function jarHeightAt(x) { const u = (x - JAR.cx) / JAR.rx; return JAR.base - 40 - (JAR.base - 40 - JAR.top) * Math.sqrt(Math.max(0, 1 - u * u)); }
  function spawnVapor(burst) {
    const x = JAR.cx + (rand(jr.emit * 13.1 + jr.vapor.length) - 0.5) * JAR.rx * 1.4;
    const sp = 70 + jr.T * 1.1;
    jr.vapor.push({ x, y: JAR.sy - 6, vx: (rand(x) - 0.5) * sp * 1.1, vy: -(0.55 + rand(x + 1) * 0.5) * sp * (burst ? 1.4 : 1), rot: rand(x + 2) * TAU, spin: (rand(x + 3) - 0.5) * 3 });
  }
  function ensureAir() {
    const n = jr.P >= 1000 ? 30 : Math.round(jr.P / 40);
    while (jr.air.length < n) {
      const i = jr.air.length;
      const x = JAR.cx + (rand(i + 5) - 0.5) * JAR.rx * 1.5;
      jr.air.push({ x, y: lerp(70, JAR.sy - 16, rand(i + 7)), vx: (rand(i + 1) - 0.5) * 170, vy: (rand(i + 2) - 0.5) * 170 });
    }
    jr.air.length = n;
  }
  function stepJar(dt) {
    const L = LIQS[jr.liq], vp = VP(L, jr.T), boiling = vp >= jr.P;
    const nEq = 2 + 22 * Math.sqrt(Math.min(vp, 1520) / 1520);
    // Return rate is about one crossing of the jar per few seconds, so emit at the matching rate.
    const hitRate = 0.2 + jr.T * 0.0016;
    let rateOut = nEq * hitRate * (boiling ? 2.4 : 1);
    jr.emit += rateOut * dt;
    let emitted = 0;
    while (jr.emit >= 1 && jr.vapor.length < 26) { jr.emit -= 1; spawnVapor(boiling); emitted++; }
    if (jr.emit > 2) jr.emit = 0;
    let captured = 0;
    jr.vapor = jr.vapor.filter((q) => {
      q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.spin * dt;
      if (q.x < JAR.cx - JAR.rx + 20) { q.x = JAR.cx - JAR.rx + 20; q.vx = Math.abs(q.vx); }
      if (q.x > JAR.cx + JAR.rx - 20) { q.x = JAR.cx + JAR.rx - 20; q.vx = -Math.abs(q.vx); }
      const roof = jarHeightAt(q.x) + 18;
      if (q.y < roof) { q.y = roof; q.vy = Math.abs(q.vy); }
      if (q.y > JAR.sy - 2) {
        // Each molecule striking the surface is caught. Too many above equilibrium just means more strike.
        if (rand(q.x * 3.1 + q.rot) < 0.8 || jr.vapor.length > nEq * 1.25) { captured++; return false; }
        q.y = JAR.sy - 2; q.vy = -Math.abs(q.vy);
      }
      return true;
    });
    jr.outRate = lerp(jr.outRate, emitted / Math.max(dt, 0.001), clamp(dt * 0.9));
    jr.inRate = lerp(jr.inRate, captured / Math.max(dt, 0.001), clamp(dt * 0.9));
    jr.air.forEach((q) => {
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.x < JAR.cx - JAR.rx + 14) { q.x = JAR.cx - JAR.rx + 14; q.vx = Math.abs(q.vx); }
      if (q.x > JAR.cx + JAR.rx - 14) { q.x = JAR.cx + JAR.rx - 14; q.vx = -Math.abs(q.vx); }
      const roof = jarHeightAt(q.x) + 10;
      if (q.y < roof) { q.y = roof; q.vy = Math.abs(q.vy); }
      if (q.y > JAR.sy - 8) { q.y = JAR.sy - 8; q.vy = -Math.abs(q.vy); }
    });
  }
  const CH = { x0: 462, x1: 782, y0: 58, y1: 382 };
  function chartMap(view) {
    if (view === 'curve') {
      return { X: (T) => CH.x0 + (T / 130) * (CH.x1 - CH.x0), Y: (P) => CH.y1 - (Math.min(P, 1700) / 1700) * (CH.y1 - CH.y0) };
    }
    return { X: (T) => CH.x0 + ((1000 / (T + 273.15) - 3.67) / (2.45 - 3.67)) * (CH.x1 - CH.x0), Y: (P) => CH.y1 - (Math.log(Math.max(P, 1)) / 8.4) * (CH.y1 - CH.y0) };
  }
  Lab.stage('#c-jar', {
    label: 'A liquid under a bell jar on the left, with molecules escaping and returning. A graph of vapor pressure against temperature on the right, with a line at the air pressure.',
    draw(g, t, dt) {
      const L = LIQS[jr.liq], vp = VP(L, jr.T), boiling = vp >= jr.P;
      ensureAir();
      if (dt > 0) stepJar(Math.min(dt, 0.04));
      const cx = JAR.cx, sy = JAR.sy, base = JAR.base;
      // Hot plate and base.
      g.fillStyle = Art.mix('#5C5478', '#FF6A2B', clamp(jr.T / 130)); g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      Art.round(g, cx - 186, base + 10, 372, 16, 6); g.fill(); g.stroke();
      g.fillStyle = '#8F8DA6'; Art.round(g, cx - 198, base - 2, 396, 14, 6); g.fill(); g.stroke();
      // Liquid dish.
      const lg = g.createLinearGradient(0, sy, 0, base);
      lg.addColorStop(0, Art.alpha(L.col, 0.75)); lg.addColorStop(1, Art.alpha(Art.mix(L.col, '#10306A', 0.35), 0.95));
      g.fillStyle = lg; g.fillRect(cx - JAR.rx + 8, sy, JAR.rx * 2 - 16, base - sy - 2);
      if (boiling) Art.bubbles(g, cx - JAR.rx + 20, cx + JAR.rx - 20, base - 8, sy + 6, t * 1.5, { n: 16, r: 7 });
      g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(cx - JAR.rx + 8, sy, JAR.rx * 2 - 16, 3);
      // Air: small pale dots.
      jr.air.forEach((q) => Art.ball(g, q.x, q.y, 6, '#B9C7E8'));
      // Vapor.
      jr.vapor.forEach((q) => {
        if (L.f === 'ether') drawEther(g, q.x, q.y, 10, q.rot);
        else Art.molecule(g, q.x, q.y, L.s, L.f, { rot: q.rot, style: 'fill', atomScale: 1.28, labels: false });
      });
      // The dome.
      g.strokeStyle = C.glass; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - JAR.rx, base - 2); g.lineTo(cx - JAR.rx, base - 40);
      g.ellipse(cx, base - 40, JAR.rx, base - 40 - JAR.top, 0, Math.PI, TAU);
      g.lineTo(cx + JAR.rx, base - 2); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 6;
      g.beginPath(); g.ellipse(cx, base - 40, JAR.rx - 14, base - 54 - JAR.top, 0, Math.PI * 1.15, Math.PI * 1.42); g.stroke();
      // Rates.
      const upW = clamp(jr.outRate * 0.9, 2, 13), downW = clamp(jr.inRate * 0.9, 2, 13);
      Art.arrow(g, cx - 30, sy - 8, cx - 30, sy - 56, { color: C.fire, w: upW, head: Math.max(13, upW * 2) });
      Art.arrow(g, cx + 30, sy - 56, cx + 30, sy - 8, { color: C.cyan, w: downW, head: Math.max(13, downW * 2) });
      Art.text(g, boiling ? 'Boiling!' : 'Not boiling', cx, 436, { font: 'display', size: 30, color: boiling ? C.fire : C.dim });

      // The graph.
      const M = chartMap(jr.view);
      g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, CH.x0, CH.y0, CH.x1 - CH.x0, CH.y1 - CH.y0, 10); g.fill();
      g.save(); g.beginPath(); g.rect(CH.x0, CH.y0, CH.x1 - CH.x0, CH.y1 - CH.y0); g.clip();
      Object.keys(LIQS).forEach((k) => {
        const D = LIQS[k], on = k === jr.liq;
        g.strokeStyle = D.col; g.lineWidth = on ? 6 : 2.5; g.globalAlpha = on ? 1 : 0.5; g.lineJoin = 'round';
        g.beginPath();
        for (let T = 0; T <= 130; T += 2) { const x = M.X(T), y = M.Y(VP(D, T)); if (T === 0) g.moveTo(x, y); else g.lineTo(x, y); }
        g.stroke();
      });
      g.globalAlpha = 1;
      // Air pressure line.
      g.strokeStyle = C.cyan; g.lineWidth = 3; g.setLineDash([7, 7]);
      g.beginPath(); g.moveTo(CH.x0, M.Y(jr.P)); g.lineTo(CH.x1, M.Y(jr.P)); g.stroke(); g.setLineDash([]);
      // Current temperature.
      g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(M.X(jr.T), CH.y0); g.lineTo(M.X(jr.T), CH.y1); g.stroke();
      g.restore();
      const air = jr.P === 20 ? (jr.view === 'curve' ? 'pump' : 'pump: 20 torr') : `air: ${jr.P} torr`;
      const airY = M.Y(jr.P), lowLine = airY > CH.y1 - 30;
      Art.text(g, air, CH.x1 - 6, airY + (lowLine ? -16 : -16), { size: 21, color: C.cyan, align: 'right', halo: true });
      const py = M.Y(vp), px = M.X(jr.T);
      if (py > CH.y0 - 2) {
        Art.glow(g, px, py, 26, '#fff', 0.5);
        g.fillStyle = '#fff'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.beginPath(); g.arc(px, py, 9, 0, TAU); g.fill(); g.stroke();
      }
      // Axes.
      if (jr.view === 'curve') {
        Art.text(g, 'Vapor pressure (torr)', CH.x0, CH.y0 - 22, { size: 21, color: C.dim, align: 'left' });
        [0, 50, 100].forEach((T) => Art.text(g, String(T), M.X(T), CH.y1 + 20, { size: 21, color: C.dim }));
        Art.text(g, '°C', CH.x1, CH.y1 + 20, { size: 21, color: C.dim, align: 'right' });
        [[760, '760'], [1520, '1520']].forEach(([P, l]) => Art.text(g, l, CH.x0 - 6, M.Y(P), { size: 20, color: C.dim, align: 'right' }));
        Art.text(g, '0', CH.x0 - 6, CH.y1 - 6, { size: 20, color: C.dim, align: 'right' });
      } else {
        Art.text(g, 'ln P: a straight line', CH.x0, CH.y0 - 22, { size: 21, color: C.dim, align: 'left' });
        Art.text(g, '1/T: hotter this way', (CH.x0 + CH.x1) / 2, CH.y1 + 20, { size: 21, color: C.dim });
      }
    },
  });
  function paintJar() {
    const L = LIQS[jr.liq], vp = VP(L, jr.T);
    Lab.$('#jar-vp').textContent = vp > 2000 ? 'over 2000 torr' : `${Lab.sig(vp, 3)} torr`;
    Lab.$('#jar-air').textContent = `${jr.P} torr`;
    const bp = BP(L, jr.P);
    Lab.$('#jar-bp').textContent = fmtDeg(bp, 0);
    const st = Lab.$('#jar-state');
    st.textContent = vp >= jr.P ? 'Boiling' : 'Evaporating at the surface only';
  }
  Lab.segmented('#jar-liq', (v) => { jr.liq = v; jr.vapor = []; paintJar(); });
  Lab.segmented('#jar-P', (v) => { jr.P = +v; paintJar(); });
  Lab.segmented('#jar-view', (v) => { jr.view = v; });
  Lab.bind('#jar-T', '#jar-T-out', (v) => fmtDeg(v), (v) => { jr.T = v; paintJar(); });

  /* ---------- Phase diagrams ---------- */
  const PD = {
    water: {
      name: 'Water', f: 'H2O',
      // The stretch around 0 °C is what makes the backward lean visible. See the note on the page.
      tK: [[-50, 0], [-9, 0.17], [-4.2, 0.179], [-2.4, 0.1833], [-0.75, 0.1949], [-0.15, 0.2054], [0, 0.225], [0.01, 0.24], [100, 0.5], [374, 0.82], [500, 1]],
      pK: [[1e-5, 0], [0.006, 0.2], [1, 0.5], [218, 0.82], [1000, 1]],
      triple: [0.01, 0.006], crit: [374, 218],
      sub: [[-50, 3.9e-5], [-40, 1.27e-4], [-30, 3.76e-4], [-20, 1.02e-3], [-10, 2.57e-3], [0.01, 0.006]],
      vap: [[0.01, 0.006], [25, 0.0313], [50, 0.122], [75, 0.382], [100, 1], [150, 4.7], [200, 15.3], [250, 39.2], [300, 84.8], [350, 163], [374, 218]],
      fus: [[0.01, 0.006], [0, 1], [-0.15, 20], [-0.75, 100], [-2.4, 300], [-4.2, 500], [-9, 1000]],
      ticksT: [[0, '0'], [100, '100'], [374, '374']], ticksP: [[0.006, '0.006'], [1, '1'], [218, '218']],
      labels: { solid: [0.1, 0.62], liquid: [0.4, 0.72], gas: [0.66, 0.26] },
      tripleLabel: ['Triple point', '0.01 °C, 0.006 atm'], critLabel: ['Critical point', '374 °C, 218 atm'],
      tripleOff: [0.03, -0.09], critOff: [0.995, -0.15], critRight: true,
      tries: [['Everyday', 25, 1], ['Squeeze ice', -0.5, 400], ['Freeze-dry', -20, 0.0005], ['Supercritical', 420, 400]],
    },
    co2: {
      name: 'Carbon dioxide', f: 'CO2',
      tK: [[-120, 0], [-78.5, 0.2], [-56.6, 0.38], [-54.7, 0.4236], [-47, 0.447], [-38, 0.46], [31, 0.68], [100, 1]],
      pK: [[0.01, 0], [1, 0.22], [5.1, 0.38], [73, 0.68], [1000, 1]],
      triple: [-56.6, 5.1], crit: [31, 73],
      sub: [[-120, 0.013], [-100, 0.138], [-78.5, 1], [-70, 2], [-60, 4.1], [-56.6, 5.1]],
      vap: [[-56.6, 5.1], [-40, 10], [-20, 19.7], [0, 34.9], [20, 57.3], [31, 73]],
      fus: [[-56.6, 5.1], [-54.7, 100], [-47, 500], [-38, 1000]],
      ticksT: [[-78.5, '−78.5'], [31, '31']], ticksP: [[1, '1'], [5.1, '5.1'], [73, '73']],
      labels: { solid: [0.2, 0.62], liquid: [0.56, 0.86], gas: [0.78, 0.1] },
      tripleLabel: ['Triple point', '−56.6 °C, 5.1 atm'], critLabel: ['Critical point', '31 °C, 73 atm'],
      tripleOff: [0.04, -0.06], critOff: [0.03, -0.11],
      tries: [['Room air', 25, 1], ['Dry ice', -90, 1], ['Fire extinguisher', 20, 57], ['Supercritical', 60, 150]],
    },
  };
  const pw = (K, v, log) => {
    const f = (x) => (log ? Math.log10(x) : x);
    const V = f(Math.max(v, log ? 1e-9 : -1e9));
    if (V <= f(K[0][0])) return K[0][1];
    for (let i = 1; i < K.length; i++) {
      if (V <= f(K[i][0])) { const a = f(K[i - 1][0]), b = f(K[i][0]); return lerp(K[i - 1][1], K[i][1], (V - a) / (b - a)); }
    }
    return K[K.length - 1][1];
  };
  const inv = (K, y, log) => {
    const f = (x) => (log ? Math.log10(x) : x), un = (x) => (log ? Math.pow(10, x) : x);
    if (y <= K[0][1]) return K[0][0];
    for (let i = 1; i < K.length; i++) {
      if (y <= K[i][1]) return un(lerp(f(K[i - 1][0]), f(K[i][0]), (y - K[i - 1][1]) / (K[i][1] - K[i - 1][1])));
    }
    return K[K.length - 1][0];
  };
  /** Each diagram's lines, in 0..1 chart coordinates. */
  function geom(key) {
    const D = PD[key];
    if (D.g) return D.g;
    const fx = (T) => pw(D.tK, T, false), fy = (P) => pw(D.pK, P, true);
    const toF = (list) => list.map(([T, P]) => [fx(T), fy(P)]);
    D.g = { sub: toF(D.sub), vap: toF(D.vap), fus: toF(D.fus), tr: [fx(D.triple[0]), fy(D.triple[1])], cr: [fx(D.crit[0]), fy(D.crit[1])], fx, fy };
    return D.g;
  }
  const along = (list, x) => {
    for (let i = 1; i < list.length; i++) if (x <= list[i][0]) return lerp(list[i - 1][1], list[i][1], (x - list[i - 1][0]) / ((list[i][0] - list[i - 1][0]) || 1e-6));
    return list[list.length - 1][1];
  };
  const fusXat = (list, y) => {
    for (let i = 1; i < list.length; i++) if (y <= list[i][1]) return lerp(list[i - 1][0], list[i][0], (y - list[i - 1][1]) / ((list[i][1] - list[i - 1][1]) || 1e-6));
    return list[list.length - 1][0];
  };
  /** Which phase is at this chart position? Includes "on a line" results. */
  function phaseAt(key, x, y) {
    const G = geom(key), [xt, yt] = G.tr, [xc, yc] = G.cr;
    const near = 0.016;
    if (Math.hypot(x - xt, y - yt) < 0.028) return 'triple';
    if (Math.hypot(x - xc, y - yc) < 0.028) return 'critical';
    if (y >= yt && Math.abs(x - fusXat(G.fus, y)) < near) return 'melt-line';
    if (x >= xt && x <= xc && Math.abs(y - along(G.vap, x)) < near) return 'vap-line';
    if (x <= xt && Math.abs(y - along(G.sub, x)) < near) return 'sub-line';
    if (x >= xc && y >= yc) return 'super';
    if (y >= yt) {
      if (x < fusXat(G.fus, y)) return 'solid';
      if (x <= xc && y > along(G.vap, Math.max(x, xt))) return 'liquid';
      if (x <= xt) return 'liquid';
      return 'gas';
    }
    if (x < xt && y > along(G.sub, x)) return 'solid';
    return 'gas';
  }
  /** Draw a diagram. o.show: which parts are visible, each a 0..1 alpha. */
  function diagram(g, key, b, o = {}) {
    const D = PD[key], G = geom(key);
    const show = Object.assign({ regions: 1, lines: 1, tp: 1, cp: 1, atm: 1, labels: 1, axes: 1 }, o.show || {});
    const X = (f) => b.x0 + f * (b.x1 - b.x0), Y = (f) => b.y1 - f * (b.y1 - b.y0);
    const path = (list) => list.forEach(([u, v], i) => { if (i) g.lineTo(X(u), Y(v)); else g.moveTo(X(u), Y(v)); });
    g.save();
    g.beginPath(); g.rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); g.clip();
    g.fillStyle = '#1E1236'; g.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    if (show.regions > 0) {
      g.globalAlpha = show.regions;
      g.fillStyle = 'rgba(255,138,43,.16)'; g.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
      // Solid.
      g.fillStyle = '#4C3B8F';
      g.beginPath(); path(G.sub); G.fus.slice(1).forEach(([u, v]) => g.lineTo(X(u), Y(v))); g.lineTo(X(0), Y(1)); g.lineTo(X(0), Y(G.sub[0][1])); g.closePath(); g.fill();
      // Liquid.
      g.fillStyle = '#1E6C9E';
      g.beginPath(); path(G.fus); g.lineTo(X(G.cr[0]), Y(1)); g.lineTo(X(G.cr[0]), Y(G.cr[1])); G.vap.slice().reverse().forEach(([u, v]) => g.lineTo(X(u), Y(v))); g.closePath(); g.fill();
      // Supercritical.
      g.fillStyle = 'rgba(61,220,132,.3)'; g.fillRect(X(G.cr[0]), b.y0, b.x1 - X(G.cr[0]), Y(G.cr[1]) - b.y0);
      g.globalAlpha = 1;
    }
    if (show.atm > 0) {
      g.globalAlpha = show.atm; g.strokeStyle = C.sun; g.lineWidth = 3; g.setLineDash([8, 8]);
      g.beginPath(); g.moveTo(b.x0, Y(G.fy(1))); g.lineTo(b.x1, Y(G.fy(1))); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    }
    if (show.lines > 0) {
      g.globalAlpha = show.lines; g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round';
      [G.sub, G.vap, G.fus].forEach((list, i) => {
        g.strokeStyle = o.hiLine === i ? C.pink : '#fff'; g.lineWidth = o.hiLine === i ? 8 : 5;
        g.beginPath(); path(list); g.stroke();
      });
      g.globalAlpha = 1;
    }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2.5; g.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    if (show.axes > 0) {
      Art.text(g, 'Pressure (atm)', b.x0, b.y0 - 16, { size: 21, align: 'left', color: C.dim, alpha: show.axes });
      Art.text(g, 'Temperature (°C)', (b.x0 + b.x1) / 2, b.y1 + 44, { size: 21, color: C.dim, alpha: show.axes });
      D.ticksT.forEach(([T, l]) => Art.text(g, l, X(G.fx(T)), b.y1 + 18, { size: 21, color: C.dim, alpha: show.axes }));
      D.ticksP.forEach(([P, l]) => Art.text(g, l, b.x0 - 7, Y(G.fy(P)), { size: 20, color: P === 1 ? C.sun : C.dim, align: 'right', alpha: show.axes }));
      Art.text(g, 'schematic', b.x1 - 4, b.y0 - 16, { size: 21, align: 'right', color: C.sun, alpha: show.axes });
    }
    if (show.labels > 0) {
      const a = show.labels;
      Art.text(g, 'Solid', X(D.labels.solid[0]), Y(D.labels.solid[1]), { font: 'display', size: 32, color: '#E3D6FF', alpha: a });
      Art.text(g, 'Liquid', X(D.labels.liquid[0]), Y(D.labels.liquid[1]), { font: 'display', size: 32, color: '#D4F1FF', alpha: a });
      Art.text(g, 'Gas', X(D.labels.gas[0]), Y(D.labels.gas[1]), { font: 'display', size: 32, color: '#FFE3C7', alpha: a });
      if (X(1) - X(G.cr[0]) > 60) {
        Art.text(g, o.shortSuper ? 'Super' : 'Super-', X((G.cr[0] + 1) / 2), Y((G.cr[1] + 1) / 2 + 0.03), { font: 'display', size: 22, color: '#C8FFE0', alpha: a });
        if (!o.shortSuper) Art.text(g, 'critical', X((G.cr[0] + 1) / 2), Y((G.cr[1] + 1) / 2 - 0.05), { font: 'display', size: 22, color: '#C8FFE0', alpha: a });
      }
    }
    const pt = (f, label, off, a, col) => {
      if (a <= 0) return;
      g.save(); g.globalAlpha *= a;
      Art.glow(g, X(f[0]), Y(f[1]), 22, col, 0.6);
      g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.beginPath(); g.arc(X(f[0]), Y(f[1]), 9, 0, TAU); g.fill(); g.stroke();
      if (o.pointLabels !== false) {
        const right = label === D.critLabel && D.critRight;
        const tx = right ? X(off[0]) : X(f[0] + off[0]), ty = Y(f[1] + off[1]), al = right ? 'right' : 'left';
        Art.text(g, label[0], tx, ty - 12, { size: 22, color: col, align: al, halo: true });
        Art.text(g, label[1], tx, ty + 14, { size: 21, align: al, halo: true });
      }
      g.restore();
    };
    pt(G.tr, D.tripleLabel, D.tripleOff, show.tp, C.sun);
    pt(G.cr, D.critLabel, D.critOff, show.cp, C.pink);
    return { X, Y, G };
  }

  /* ---------- Story 3: reading the map ---------- */
  const MB = { x0: 100, x1: 610, y0: 42, y1: 376 };
  Lab.story('#story-map', {
    title: 'How to read a phase diagram',
    scenes: [
      {
        say: 'A phase diagram is a <b>map</b>. Across is temperature, up is pressure. Each territory is a phase. Cold and squeezed is <b>solid</b>. Hot and low pressure is <b>gas</b>. <b>Liquid</b> sits in between.',
        dur: 3.2,
        draw(g, p, t) {
          diagram(g, 'water', MB, { show: { regions: ease.out(seg(p, 0.15, 0.6)), lines: 0, tp: 0, cp: 0, atm: 0, labels: seg(p, 0.45, 0.8) } });
          Art.moe(g, 712, 430, 150, 'point', { t, flip: true });
        },
      },
      {
        say: 'The lines are <b>borders</b>. Cross one and the phase changes. Standing right on a line, two phases exist together. The solid-gas line is <b>sublimation</b>, the solid-liquid line is <b>melting</b>, and the liquid-gas line is <b>boiling</b>.',
        dur: 3.6,
        draw(g, p, t) {
          const hi = p < 0.45 ? -1 : p < 0.6 ? 0 : p < 0.75 ? 2 : p < 0.92 ? 1 : -1;
          const { X, Y, G } = diagram(g, 'water', MB, { show: { lines: ease.out(seg(p, 0.1, 0.4)), tp: 0, cp: 0, atm: 0, labels: 0.35 }, hiLine: hi });
          Art.text(g, 'sublimation', X(0.03), Y(along(G.sub, 0.12) - 0.1), { size: 25, align: 'left', color: C.ink, alpha: seg(p, 0.45, 0.58), halo: true });
          Art.text(g, 'melting', X(0.25), Y(0.84), { size: 25, align: 'left', color: C.ink, alpha: seg(p, 0.6, 0.72), halo: true });
          Art.text(g, 'boiling', X(0.56), Y(along(G.vap, 0.56) - 0.08), { size: 25, align: 'left', color: C.ink, alpha: seg(p, 0.75, 0.88), halo: true });
          Art.moe(g, 712, 430, 130, 'think', { t, flip: true });
        },
      },
      {
        say: 'Two special places. At the <b>triple point</b>, all three phases exist at once. At the <b>critical point</b>, the boiling line ends. Past it, liquid and gas blur into one <b>supercritical fluid</b>.',
        dur: 3.4,
        draw(g, p) {
          diagram(g, 'water', MB, { show: { tp: seg(p, 0.1, 0.35), cp: seg(p, 0.45, 0.7), atm: 0, labels: 0.6 } });
          Art.moe(g, 712, 430, 130, 'wow', { t: p * 5 });
        },
      },
      {
        say: 'Here is water\'s oddity. Its solid-liquid line <b>leans backward</b>. Start in solid and press straight up: you cross into liquid! Squeezing melts ice, because liquid water takes less room than ice. The tilt is exaggerated here.',
        dur: 4,
        draw(g, p, t) {
          const { X, Y, G } = diagram(g, 'water', MB, { show: { atm: 1, labels: 0.7, tp: 0.8, cp: 0.8 }, hiLine: 2, pointLabels: false });
          const x = 0.205, y0 = G.fy(1) - 0.07, y1 = 0.86;
          const q = ease.inOut(seg(p, 0.25, 0.85));
          const yNow = lerp(y0, y1, q);
          Art.arrow(g, X(x), Y(y0), X(x), Y(y1), { color: C.pink, w: 5, dash: [6, 7], p: 1, alpha: 0.75 });
          const crossed = x > fusXat(G.fus, yNow);
          g.fillStyle = C.pink; g.strokeStyle = '#fff'; g.lineWidth = 4;
          g.beginPath(); g.arc(X(x), Y(yNow), 13, 0, TAU); g.fill(); g.stroke();
          Art.pill(g, crossed ? 'Now liquid' : 'Solid', 700, 90, { size: 32, font: 'display', color: crossed ? C.water : C.violet, text: '#fff' });
          Art.text(g, 'press harder', 700, 150, { size: 26, alpha: seg(p, 0.2, 0.4) });
          Art.arrow(g, 700, 240, 700, 172, { color: C.pink, w: 7, p: seg(p, 0.25, 0.5) });
          Art.text(g, '1 atm', 700, Y(G.fy(1)), { size: 24, color: C.sun });
          void t;
        },
      },
      {
        say: 'Carbon dioxide is the normal case: its solid-liquid line <b>leans forward</b>. Its triple point is at <b>5.1 atm</b>, so at 1 atm there is no liquid at all. Walk across at 1 atm and solid turns straight to gas. That is why we call it <b>dry ice</b>.',
        dur: 4.4,
        draw(g, p, t) {
          const { X, Y, G } = diagram(g, 'co2', MB, { show: { atm: 1, labels: 0.7, tp: 0.9, cp: 0.9 }, hiLine: 2, pointLabels: false });
          const q = ease.inOut(seg(p, 0.25, 0.92));
          const x = lerp(0.05, 0.62, q), y = G.fy(1);
          g.fillStyle = C.pink; g.strokeStyle = '#fff'; g.lineWidth = 4;
          g.beginPath(); g.arc(X(x), Y(y), 13, 0, TAU); g.fill(); g.stroke();
          const solid = x < G.fx(-78.5);
          Art.zoom(g, X(x), Y(y), 712, 138, 84, (gg, cx, cy, R) => {
            particles(gg, cx, cy, R, { T: -80, melt: 0, boil: solid ? 0 : 1 }, t, t * 1.2, { f: 'CO2', s: 13, sp: R * 0.39, forces: false });
          }, { p: seg(p, 0.1, 0.3) });
          Art.pill(g, solid ? 'Solid' : 'Gas', 712, 256, { size: 30, font: 'display', color: solid ? C.violet : C.fire, text: '#fff' });
          Art.text(g, 'never liquid', 712, 306, { size: 26, color: C.sun, alpha: seg(p, 0.6, 0.85) });
          Art.text(g, 'at 1 atm', 712, 338, { size: 26, color: C.sun, alpha: seg(p, 0.6, 0.85) });
        },
      },
    ],
  });

  /* ---------- Bench: draggable phase diagram ---------- */
  const BOX = { x0: 72, x1: 560, y0: 36, y1: 386 };
  const pd = { key: 'water', x: 0, y: 0, drag: false, melt: 1, boil: 0, sup: 0, tau: 0, walking: 0 };
  function placeAt(T, P) { const G = geom(pd.key); pd.x = G.fx(T); pd.y = G.fy(P); }
  const PHASE = {
    solid: ['Solid', C.violet, 0, 0], liquid: ['Liquid', C.water, 1, 0], gas: ['Gas', C.fire, 1, 1], super: ['Supercritical fluid', C.leaf, 1, 1],
    'melt-line': ['Solid and liquid', C.cyan, 0.5, 0], 'vap-line': ['Liquid and gas', C.sun, 1, 0.5], 'sub-line': ['Solid and gas', C.pink, 0, 0.5],
    triple: ['All three phases', C.sun, 0.55, 0.3], critical: ['Critical point', C.pink, 1, 1],
  };
  const PDN = {
    water: {
      solid: 'Ice. Hydrogen bonds lock the molecules in place.', liquid: 'Liquid water.', gas: 'Water vapor. Below the triple point pressure, you can only ever get solid or gas.',
      super: 'Supercritical water. Above 374 °C and 218 atm it is neither a true liquid nor a true gas.',
      'melt-line': 'You are on the melting line. Ice and liquid water coexist here. Notice it leans backward.', 'vap-line': 'You are on the boiling line. Liquid and vapor coexist. Find where it crosses 1 atm: that is 100 °C, the normal boiling point.',
      'sub-line': 'You are on the sublimation line. Ice and vapor coexist with no liquid. Freeze-drying works down here.',
      triple: 'The triple point of water: 0.01 °C and 0.006 atm. Ice, liquid and vapor all coexist. The three lines meet here.', critical: 'The critical point of water: 374 °C and 218 atm. The boiling line stops here.',
    },
    co2: {
      solid: 'Dry ice. London forces hold the molecules in place.', liquid: 'Liquid carbon dioxide. It only exists above 5.1 atm, which is why a fire extinguisher holds it under high pressure.', gas: 'Carbon dioxide gas, the normal state in air.',
      super: 'Supercritical carbon dioxide. It dissolves things like a liquid and flows like a gas. It is used to decaffeinate coffee.',
      'melt-line': 'You are on the melting line. Solid and liquid coexist. Notice it leans forward, as it does for most substances.', 'vap-line': 'You are on the boiling line. Liquid and gas coexist. A fire extinguisher sits right on this line: at 20 °C it holds liquid and gas together at about 57 atm.',
      'sub-line': 'You are on the sublimation line. At 1 atm this happens at −78.5 °C: dry ice turns straight to gas.',
      triple: 'The triple point of carbon dioxide: −56.6 °C and 5.1 atm. It is above 1 atm, so there is no liquid in the open air.', critical: 'The critical point of carbon dioxide: 31 °C and 73 atm. A warm room is almost hot enough.',
    },
  };
  function fmtP(P) { return P < 0.01 ? Lab.sig(P, 2) + ' atm' : P < 1 ? Lab.sig(P, 2) + ' atm' : Lab.sig(P, 3) + ' atm'; }
  function pdRead() {
    const D = PD[pd.key];
    return { T: inv(D.tK, pd.x, false), P: inv(D.pK, pd.y, true) };
  }
  let pdLastPhase = '';
  function paintPD() {
    const ph = phaseAt(pd.key, pd.x, pd.y), r = pdRead();
    const D = PD[pd.key];
    const T = ph === 'triple' ? D.triple[0] : ph === 'critical' ? D.crit[0] : r.T, P = ph === 'triple' ? D.triple[1] : ph === 'critical' ? D.crit[1] : r.P;
    Lab.$('#pd-T').textContent = fmtDeg(T, Math.abs(T) < 10 || ph === 'triple' ? (Math.abs(T) < 1 ? 2 : 1) : 0);
    Lab.$('#pd-P').textContent = fmtP(P);
    Lab.$('#pd-phase').textContent = PHASE[ph][0];
    if (ph !== pdLastPhase) { Lab.$('#pd-note').innerHTML = `<p>${PDN[pd.key][ph]}</p>`; pdLastPhase = ph; }
  }
  const pdStage = Lab.stage('#c-diagram', {
    drag: true,
    label: 'A phase diagram with a draggable dot. The circle at the right shows the molecules at that temperature and pressure.',
    onPointer(e) {
      const nx = (e.x - BOX.x0) / (BOX.x1 - BOX.x0), ny = (BOX.y1 - e.y) / (BOX.y1 - BOX.y0);
      if (e.type === 'hover') {
        pdStage.canvas.style.cursor = Math.hypot(e.x - (BOX.x0 + pd.x * (BOX.x1 - BOX.x0)), e.y - (BOX.y1 - pd.y * (BOX.y1 - BOX.y0))) < 50 ? 'grab' : 'crosshair';
        return;
      }
      if (e.type === 'down') { pd.drag = nx > -0.1 && nx < 1.1 && ny > -0.1 && ny < 1.1; pd.walking = 0; }
      if (e.type === 'up') { pd.drag = false; return; }
      if (pd.drag) { pd.x = clamp(nx); pd.y = clamp(ny); paintPD(); }
    },
    draw(g, t, dt) {
      if (pd.walking && dt > 0) {
        pd.x = clamp(pd.x + dt / 9);
        if (pd.x >= 0.985) pd.walking = 0;
        paintPD();
      }
      const ph = phaseAt(pd.key, pd.x, pd.y), P = PHASE[ph];
      const k = clamp((dt || 1) * 3.5);
      pd.melt = lerp(pd.melt, P[2], k); pd.boil = lerp(pd.boil, P[3], k);
      pd.sup = lerp(pd.sup, ph === 'super' || ph === 'critical' ? 1 : 0, k);
      const r = pdRead();
      pd.tau += (dt || 0) * (0.6 + 1.2 * pd.boil + 0.6 * pd.melt);
      const { X, Y } = diagram(g, pd.key, BOX, {});
      const px = X(pd.x), py = Y(pd.y);
      // The particle circle.
      Art.zoom(g, px, py, 680, 136, 106, (gg, cx, cy, R) => {
        particles(gg, cx, cy, R, { T: r.T > 100 ? 100 : Math.max(-40, r.T), melt: pd.melt, boil: pd.boil, super: pd.sup > 0.5 }, t, pd.tau, { f: PD[pd.key].f, s: pd.key === 'co2' ? 15 : 19, sp: R * 0.39, forces: pd.key === 'water' });
      });
      Art.text(g, P[0], 680, 272, { font: 'display', size: P[0].length > 16 ? 25 : 32, color: P[1], maxW: 228 });
      const T = ph === 'triple' ? PD[pd.key].triple[0] : ph === 'critical' ? PD[pd.key].crit[0] : r.T;
      const PP = ph === 'triple' ? PD[pd.key].triple[1] : ph === 'critical' ? PD[pd.key].crit[1] : r.P;
      Art.text(g, fmtDeg(T, Math.abs(T) < 1 ? 2 : Math.abs(T) < 10 ? 1 : 0), 680, 324, { font: 'display', size: 32, color: C.sun });
      Art.text(g, fmtP(PP), 680, 366, { font: 'display', size: 28, color: C.cyan });
      // The dot.
      Art.glow(g, px, py, 40, C.pink, 0.55 + Math.sin(t * 3) * 0.12);
      g.fillStyle = C.pink; g.strokeStyle = '#fff'; g.lineWidth = 4;
      g.beginPath(); g.arc(px, py, 15, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py, 4, 0, TAU); g.fill();
    },
  });
  function paintTries() {
    const host = Lab.$('#pd-try');
    host.innerHTML = PD[pd.key].tries.map(([n], i) => `<button type="button" data-i="${i}" aria-pressed="false">${n}</button>`).join('');
    Lab.$$('button', host).forEach((b) => b.addEventListener('click', () => {
      const [, T, P] = PD[pd.key].tries[+b.dataset.i];
      pd.walking = 0; placeAt(T, P); paintPD();
      Lab.$$('button', host).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    }));
  }
  Lab.segmented('#pd-sub', (v) => { pd.key = v; pd.walking = 0; pdLastPhase = ''; paintTries(); placeAt(25, 1); paintPD(); });
  Lab.$('#pd-walk').addEventListener('click', () => { const G = geom(pd.key); pd.y = G.fy(1); pd.x = 0.02; pd.walking = 1; pdLastPhase = ''; paintPD(); });
  paintTries(); placeAt(25, 1); paintPD();
});
