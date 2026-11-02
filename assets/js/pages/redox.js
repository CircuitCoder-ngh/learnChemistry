/* Lesson 5.5: Oxidation and reduction. Oxidation numbers and displacement results come from window.Redox. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander } = Lab;
  const C = Art.C, R = window.Redox, TAU = Math.PI * 2;
  const CLEAR = '#CFEAF6', BLUE = '#2A86E8';

  function F(g, f, x, y, o = {}) {
    const a = o.alpha === undefined ? 1 : o.alpha;
    if (a <= 0) return 0;
    g.save(); g.globalAlpha *= a;
    const w = Art.formula(g, f, x, y, Object.assign({ color: '#fff' }, o));
    g.restore();
    return w;
  }
  const chargeOf = (z) => (z > 1 ? `${z}+` : '+');

  /* ---------- A metal surface meeting ions, at the particle level ----------
     e counts finished events. In each event a metal atoms give electrons to b ions, so that a(zM) = b(zN).
     A pure function of e and t, so stories can use it directly. */
  function surfaceScene(g, cx, cy, R0, M, N, e, t, o = {}) {
    const r = o.r || 21, d = r * 2.1;
    const gcd = (x, y) => (y ? gcd(y, x % y) : x);
    const lc = (M.z * N.z) / gcd(M.z, N.z);
    let a = lc / M.z, b = lc / N.z;
    if (N.gas && b % 2) { a *= 2; b *= 2; }
    const sx = cx - R0 * 0.56;
    const rows = 7, rowY = (j) => cy + (j - (rows - 1) / 2) * d;
    const evI = Math.floor(e), p = e - evI;
    // Back rank of the strip, which never changes.
    for (let j = 0; j < rows; j++) Art.atom(g, sx - d * 0.92, rowY(j), r, M.sym, { label: false, alpha: 0.75 });
    const maxEv = o.max || Math.floor(rows / Math.max(a, 1));
    const FREE = [[0.12, -0.68], [0.5, -0.52], [0.72, -0.12], [0.12, -0.3], [0.42, -0.14], [0.68, 0.24], [0.26, 0.14], [0.5, 0.5], [0.04, 0.08]];
    const AWAY = [[-0.06, 0.72], [0.26, 0.76], [-0.1, 0.44], [0.22, 0.48], [0.46, 0.72], [0.0, 0.26], [0.34, 0.3]];
    const freeHome = (i) => [cx + R0 * FREE[i % 9][0] + wander(i + 5, t) * 6, cy + R0 * FREE[i % 9][1] + wander(i + 15, t) * 6];
    const atomOf = (ev, k) => ev * a + k;
    const ionOf = (ev, k) => ev * b + k;
    const nAtoms = rows, nIons = Math.min(9, b * Math.max(maxEv, 1));
    const site = (i) => {
      const j = (2 + i) % rows;
      return [sx + d * 0.96, rowY(j)];
    };
    const leftAway = (k) => [cx + R0 * AWAY[k % 7][0] + wander(k + 40, t) * 6, cy + R0 * AWAY[k % 7][1] + wander(k + 50, t) * 5];
    const none = o.none;
    // Spectator anions stay in the water throughout.
    if (o.spect) {
      [[0.76, 0.46], [0.34, -0.82], [0.8, -0.42]].forEach(([fx, fy], i) => {
        const x = cx + R0 * fx + wander(i + 60, t) * 5, y = cy + R0 * fy * 0.94 + wander(i + 70, t) * 5;
        if (o.spect === 'Cl') { Art.atom(g, x, y, r * 0.96, 'Cl', { charge: '-', alpha: 0.85 }); return; }
        const n = o.spect === 'SO4' ? 4 : 3, center = o.spect === 'SO4' ? 'S' : 'N';
        for (let k = 0; k < n; k++) { const a = t * 0.3 + i + (k * TAU) / n; Art.ball(g, x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72, r * 0.46, Art.elementColor('O')); }
        Art.atom(g, x, y, r * 0.6, center, { charge: o.spect === 'SO4' ? '2-' : '-', label: false });
      });
    }
    // Metal atoms in the front rank.
    for (let j = 0; j < nAtoms; j++) {
      const ev = Math.floor(j / a);
      const y = rowY((j + 2) % rows);
      if (!none && ev < evI) {
        const [lx, ly] = leftAway(j);
        Art.atom(g, lx, ly, r, M.sym, { charge: chargeOf(M.z), label: M.sym, t, seed: j });
      } else if (!none && ev === evI && j < a * (evI + 1) && p > 0.62) {
        const q = ease.inOut(seg(p, 0.62, 1));
        const [lx, ly] = leftAway(j);
        Art.atom(g, lerp(sx, lx, q), lerp(y, ly, q), r, M.sym, { charge: chargeOf(M.z), label: M.sym, face: 'wow', look: [1, 0], t, seed: j });
      } else {
        const active = !none && ev === evI && p > 0.2;
        Art.atom(g, sx, y, r, M.sym, { face: active ? 'grumpy' : null, look: [1, 0], t, seed: j, label: M.sym, glow: active ? 0.5 : 0 });
      }
    }
    // Ions and what they become.
    const electrons = a * M.z;
    for (let i = 0; i < nIons; i++) {
      const ev = Math.floor(i / b);
      const home = freeHome(i);
      if (none) {
        const bump = Math.max(0, Math.sin(t * 0.9 + i * 1.1));
        const x = lerp(home[0], sx + d * 1.4, bump * 0.46);
        Art.atom(g, x, home[1], r, N.sym, { charge: chargeOf(N.z), face: i === 0 ? 'sleepy' : null, t, seed: i });
        continue;
      }
      const [tx, ty] = site(i);
      if (ev < evI || (ev === evI && p >= 0.62)) {
        // Now neutral: a deposit on the strip, or part of a hydrogen molecule.
        const done = ev < evI ? 1 : seg(p, 0.62, 0.8);
        if (N.gas) {
          if (i % 2 === 0) {
            const up = ev < evI ? 1 : ease.in(seg(p, 0.64, 1));
            const yy = lerp(ty, cy - R0 * 0.82, up);
            if (up < 0.98) Art.molecule(g, tx + 14, yy, 28, 'H2', { style: 'fill', atomScale: 1.2, labels: false, rot: t });
          }
        } else {
          Art.atom(g, tx, ty, r, N.sym, { face: ev === evI && done < 1 ? 'grin' : null, t, seed: i, label: N.sym, glow: ev === evI ? 0.5 * (1 - done) : 0 });
        }
      } else if (ev === evI) {
        const q = ease.inOut(seg(p, 0, 0.34));
        const x = lerp(home[0], tx, q), y = lerp(home[1], ty, q);
        Art.atom(g, x, y, r, N.sym, { charge: chargeOf(N.z), face: q > 0.5 ? 'wow' : 'happy', look: [-1, 0], t, seed: i });
      } else {
        Art.atom(g, home[0], home[1], r, N.sym, { charge: chargeOf(N.z), t, seed: i });
      }
    }
    // Electrons crossing over.
    if (!none && evI < maxEv && p > 0.34 && p < 0.62) {
      for (let n = 0; n < electrons; n++) {
        const atom = atomOf(evI, Math.floor(n / M.z)), ion = ionOf(evI, Math.floor(n / N.z));
        const u = ease.inOut(seg(p, 0.34 + (n / electrons) * 0.1, 0.48 + (n / electrons) * 0.14));
        if (u <= 0 || u >= 1) continue;
        const ax = sx, ay = rowY((atom + 2) % rows), [ix, iy] = site(ion);
        Art.electron(g, lerp(ax, ix, u) + Math.sin(n * 2) * 3, lerp(ay, iy, u) - Math.sin(u * Math.PI) * 22 - n * 3, 7);
      }
    }
  }

  /** The strip and its beaker. react runs 0 to 1. */
  function stripBeaker(g, cx, baseY, w, h, o) {
    const q = o.q || 0, t = o.t || 0;
    const stripW = o.stripW || 46, level = o.level || 0.78;
    const surface = baseY - (h - 12) * level;
    const top = baseY - h - 28, bottom = baseY - 22;
    const box = Art.beaker(g, cx, baseY, w, h, {
      level, liquid: o.liquid || CLEAR, ticks: false,
      inside(gg, b) {
        if (o.bubbles && q > 0) Art.bubbles(gg, cx - stripW * 0.8, cx + stripW * 0.8, bottom - 10, b.top + 4, t * 1.2, { n: 14, r: 5 });
        if (o.fall && q > 0) {
          for (let i = 0; i < 26; i++) {
            const u = (t * (0.08 + Lab.rand(i) * 0.1) + Lab.rand(i + 3)) % 1;
            gg.fillStyle = Art.alpha(o.coat || '#fff', 0.7 * q);
            gg.fillRect(cx + (Lab.rand(i + 7) - 0.5) * stripW * 1.6, lerp(surface + 12, b.bottom - 6, u), 3, 3);
          }
        }
      },
    });
    // The strip, drawn over the liquid so it reads clearly.
    const gr = g.createLinearGradient(cx - stripW / 2, 0, cx + stripW / 2, 0);
    gr.addColorStop(0, Art.mix(o.strip, '#000000', 0.2)); gr.addColorStop(0.45, Art.mix(o.strip, '#ffffff', 0.34)); gr.addColorStop(1, Art.mix(o.strip, '#000000', 0.26));
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    Art.round(g, cx - stripW / 2, top, stripW, bottom - top, 5); g.fill(); g.stroke();
    // The new coat grows from the bottom edge of the wet part.
    if (o.coat && q > 0) {
      const wetTop = surface + 4, hh = bottom - wetTop;
      g.save();
      Art.round(g, cx - stripW / 2, top, stripW, bottom - top, 5); g.clip();
      const edge = bottom - hh * ease.out(clamp(q * 1.15));
      const n = 70;
      for (let i = 0; i < n; i++) {
        const px = cx - stripW / 2 + Lab.rand(i + 1) * stripW, py = edge + Lab.rand(i + 11) * (bottom - edge);
        g.fillStyle = Art.mix(o.coat, i % 3 ? '#000000' : '#ffffff', 0.14);
        g.beginPath(); g.arc(px, py, 3 + Lab.rand(i + 21) * 3.4, 0, TAU); g.fill();
      }
      g.fillStyle = Art.alpha(o.coat, 0.78);
      g.fillRect(cx - stripW / 2, edge, stripW, bottom - edge);
      g.restore();
      // Silver grows as little crystal needles.
      if (o.crystals) {
        g.strokeStyle = o.coat; g.lineWidth = 2.4; g.lineCap = 'round';
        for (let i = 0; i < 18; i++) {
          const sy = lerp(edge, bottom, Lab.rand(i + 31)), side = i % 2 ? 1 : -1;
          const len = (10 + Lab.rand(i + 41) * 22) * clamp(q * 1.2);
          const sx0 = cx + (side * stripW) / 2;
          g.beginPath(); g.moveTo(sx0, sy); g.lineTo(sx0 + side * len, sy - len * 0.4); g.moveTo(sx0 + side * len * 0.5, sy - len * 0.2); g.lineTo(sx0 + side * len * 0.72, sy + len * 0.2); g.stroke();
        }
      }
    }
    return box;
  }
  const ZN = R.METALS.find((m) => m.sym === 'Zn'), CU = R.IONS.find((i) => i.sym === 'Cu');

  /* ---------- Story 1: zinc in copper sulfate ---------- */
  Lab.story('#story-zinc', {
    title: 'Zinc meets copper sulfate',
    scenes: [
      {
        say: 'Here is a strip of zinc in blue copper sulfate solution. Fast forward a few minutes. The strip grows a brown coat, and the blue fades. <b>Something is changing hands.</b>',
        dur: 4,
        draw(g, p, t) {
          const q = seg(p, 0.12, 0.96);
          stripBeaker(g, 400, 420, 300, 300, { q, t, strip: ZN.strip, coat: '#B5602E', liquid: Art.mix(BLUE, CLEAR, ease.inOut(q) * 0.82), fall: true });
          Art.text(g, 'zinc strip', 172, 110, { size: 28, alpha: seg(p, 0, 0.12) });
          Art.arrow(g, 240, 112, 366, 130, { color: C.ink, w: 5, p: seg(p, 0.04, 0.16) });
          Art.text(g, 'blue copper', 136, 262, { size: 28, color: '#7CC4FF', alpha: seg(p, 0, 0.14) });
          Art.text(g, 'sulfate solution', 136, 296, { size: 28, color: '#7CC4FF', alpha: seg(p, 0, 0.14) });
          Art.text(g, 'a brown coat', 664, 300, { size: 28, color: '#E89A5E', alpha: seg(p, 0.55, 0.72) });
          Art.arrow(g, 588, 304, 430, 338, { color: '#E89A5E', w: 5, p: seg(p, 0.55, 0.75) });
          Art.text(g, 'the blue fades', 664, 180, { size: 28, color: C.ink, alpha: seg(p, 0.7, 0.85) });
        },
      },
      {
        say: 'Zoom in where the strip meets the water. On the left are neutral zinc atoms in the metal. On the right are copper ions, $\\ce{Cu^2+}$, which each lack two electrons.',
        dur: 3,
        draw(g, p, t) {
          stripBeaker(g, 130, 420, 180, 200, { q: 0, t, strip: ZN.strip, stripW: 36, liquid: BLUE });
          Art.zoom(g, 150, 330, 520, 222, 206, (gg, cx, cy, R0) => {
            surfaceScene(gg, cx, cy, R0, ZN, CU, 0, t, { max: 3, spect: 'SO4' });
          }, { p: seg(p, 0.1, 0.42) });
          Art.text(g, 'zinc metal', 94, 64, { size: 26, color: '#A9C4E4', alpha: seg(p, 0.4, 0.55) });
          Art.text(g, 'copper ions', 722, 34, { size: 26, color: '#E89A5E', alpha: seg(p, 0.5, 0.65) });
          Art.arrow(g, 150, 80, 346, 152, { color: '#A9C4E4', w: 4, p: seg(p, 0.42, 0.58) });
          Art.arrow(g, 708, 52, 618, 104, { color: '#E89A5E', w: 4, p: seg(p, 0.52, 0.68) });
        },
      },
      {
        say: 'A copper ion bumps into the strip. <b>Two electrons jump</b> from a zinc atom to the copper ion. The zinc atom becomes $\\ce{Zn^2+}$ and swims away. The copper ion becomes a copper atom and sticks on.',
        dur: 5,
        draw(g, p, t) {
          Art.zoom(g, 40, 240, 420, 222, 214, (gg, cx, cy, R0) => {
            surfaceScene(gg, cx, cy, R0, ZN, CU, seg(p, 0.05, 0.98), t, { max: 3, r: 23, spect: 'SO4' });
          }, { p: 1 });
          Art.text(g, 'now a Cu atom', 378, 174, { size: 24, color: '#FFC58F', align: 'left', halo: true, alpha: seg(p, 0.82, 0.96) });
          Art.text(g, 'now Zn²⁺', 438, 370, { size: 24, color: '#C9CCFF', align: 'left', halo: true, alpha: seg(p, 0.82, 0.96) });
          Art.moe(g, 730, 420, 146, 'wow', { t, flip: true });
          Art.text(g, 'electrons', 716, 76, { size: 26, color: C.cyan, alpha: seg(p, 0.3, 0.45) });
          Art.text(g, 'jump across', 716, 108, { size: 26, color: C.cyan, alpha: seg(p, 0.3, 0.45) });
        },
      },
      {
        say: 'Now name each half. Zinc <b>lost</b> electrons, so it was <b>oxidized</b>. Copper(II) <b>gained</b> electrons, so it was <b>reduced</b>. Each half is a <b>half-reaction</b>, and the electrons match exactly.',
        dur: 4,
        draw(g, p, t) {
          const a = seg(p, 0.06, 0.24), b = seg(p, 0.4, 0.58);
          const panel = (y, color, alpha) => {
            if (alpha <= 0) return;
            g.save(); g.globalAlpha *= alpha; g.fillStyle = '#2B1A4A'; g.strokeStyle = color; g.lineWidth = 4;
            Art.round(g, 40, y, 720, 150, 22); g.fill(); g.stroke(); g.restore();
          };
          panel(36, C.pink, a);
          Art.text(g, 'Loses electrons: oxidation', 400, 66, { font: 'display', size: 28, color: C.pink, alpha: a });
          if (a > 0) {
            g.save(); g.globalAlpha *= a;
            Art.atom(g, 120, 130, 34, 'Zn', { face: 'wow', t });
            F(g, '->', 196, 130, { size: 36 });
            Art.atom(g, 272, 130, 34, 'Zn', { charge: '2+', face: 'happy', t });
            F(g, '+', 340, 130, { size: 36, color: C.dim });
            Art.electron(g, 388, 130, 11); Art.electron(g, 424, 130, 11);
            g.restore();
          }
          F(g, 'Zn -> Zn^2+ + 2e^-', 610, 130, { size: 32, color: C.sun, alpha: a });
          panel(216, C.cyan, b);
          Art.text(g, 'Gains electrons: reduction', 400, 246, { font: 'display', size: 28, color: C.cyan, alpha: b });
          if (b > 0) {
            g.save(); g.globalAlpha *= b;
            Art.atom(g, 110, 310, 34, 'Cu', { charge: '2+', face: 'happy', t });
            F(g, '+', 168, 310, { size: 36, color: C.dim });
            Art.electron(g, 208, 310, 11); Art.electron(g, 244, 310, 11);
            F(g, '->', 298, 310, { size: 36 });
            Art.atom(g, 376, 310, 34, 'Cu', { face: 'grin', t });
            g.restore();
          }
          F(g, 'Cu^2+ + 2e^- -> Cu', 610, 310, { size: 32, color: C.sun, alpha: b });
          Art.text(g, 'Oxidation Is Loss, Reduction Is Gain', 400, 410, { font: 'display', size: 32, color: C.sun, alpha: seg(p, 0.76, 0.92) });
        },
      },
      {
        say: 'Zinc gave the electrons that reduced copper, so zinc is the <b>reducing agent</b>. Copper(II) took the electrons that oxidized zinc, so it is the <b>oxidizing agent</b>. The agent always does the opposite of what it undergoes.',
        dur: 4,
        draw(g, p, t) {
          const a = seg(p, 0.06, 0.24);
          Art.popIn(g, 200, 158, a, (gg) => Art.atom(gg, 0, 0, 78, 'Zn', { face: 'happy', look: [1, 0], t }));
          Art.popIn(g, 600, 158, seg(p, 0.18, 0.36), (gg) => Art.atom(gg, 0, 0, 78, 'Cu', { charge: '2+', face: 'grin', look: [-1, 0], t }));
          for (let i = 0; i < 2; i++) {
            const u = (t * 0.5 + i * 0.5) % 1;
            if (p > 0.3) Art.electron(g, lerp(292, 508, u), 158 + Math.sin(u * Math.PI) * -22, 10);
          }
          Art.text(g, 'gives electrons', 400, 96, { size: 26, color: C.cyan, alpha: seg(p, 0.3, 0.44) });
          const b = seg(p, 0.42, 0.6), c = seg(p, 0.56, 0.74);
          Art.text(g, 'reducing agent', 200, 286, { font: 'display', size: 33, color: C.pink, alpha: b });
          Art.text(g, 'is oxidized itself', 200, 326, { size: 27, alpha: b });
          Art.text(g, 'oxidizing agent', 600, 286, { font: 'display', size: 33, color: C.cyan, alpha: c });
          Art.text(g, 'is reduced itself', 600, 326, { size: 27, alpha: c });
          Art.moe(g, 400, 440, 100, 'point', { t });
        },
      },
      {
        say: 'Add the halves and the electrons cancel. The blue faded because the color comes from $\\ce{Cu^2+}$, and those ions are leaving the water. Sulfate never changed. It is a <b>spectator</b>, just like in a precipitation.',
        dur: 3.6,
        draw(g, p, t) {
          const q = seg(p, 0, 0.5);
          stripBeaker(g, 170, 404, 240, 280, { q: 0.4 + q * 0.6, t, strip: ZN.strip, coat: '#B5602E', liquid: Art.mix(BLUE, CLEAR, 0.45 + q * 0.5), fall: true });
          F(g, 'Zn(s) + Cu^2+(aq) -> Zn^2+(aq) + Cu(s)', 548, 150, { size: 28, color: C.sun, alpha: seg(p, 0.15, 0.34) });
          Art.text(g, 'Net ionic equation', 548, 104, { size: 27, alpha: seg(p, 0.1, 0.26) });
          Art.text(g, 'blue copper ions leave', 548, 214, { size: 26, color: '#7CC4FF', alpha: seg(p, 0.4, 0.56) });
          Art.text(g, 'colorless zinc ions arrive', 548, 250, { size: 26, alpha: seg(p, 0.5, 0.66) });
          const sq = seg(p, 0.64, 0.84);
          if (sq > 0) {
            g.save(); g.globalAlpha *= sq;
            for (let k = 0; k < 4; k++) { const a = (k * TAU) / 4 + t * 0.4; Art.ball(g, 452 + Math.cos(a) * 26, 340 + Math.sin(a) * 26, 15, Art.elementColor('O')); }
            Art.atom(g, 452, 340, 21, 'S', { charge: '2-', label: false, face: 'sleepy', t });
            g.restore();
          }
          Art.text(g, 'sulfate just watches', 616, 340, { size: 26, color: C.cyan, alpha: sq });
        },
      },
    ],
  });

  /* ---------- Bench: oxidation number tool ---------- */
  const OX_LIST = ['H2O', 'O2', 'Na+', 'NH3', 'CO2', 'H2O2', 'NaH', 'NO3-', 'SO4-2', 'H2SO4', 'MnO4-', 'Cr2O7-2', 'K2Cr2O7', 'ClO4-', 'NH4+', 'Fe2O3', 'C2O4-2', 'OF2'].map((key) => {
    const m = /^(.+?)([+-])(\d*)$/.exec(key);
    const f = m ? m[1] : key;
    const z = m ? (m[2] === '+' ? 1 : -1) * (m[3] ? +m[3] : 1) : 0;
    return R.SPECIES.find((s) => s.f === f && (s.z || 0) === z);
  });
  const oxLab = { mode: 'explore', sp: OX_LIST[0], s: null, shown: new Set(), active: null, t0: 0, askEl: null, streak: 0, solved: false };
  const oxPos = (n, i) => {
    const gap = n === 1 ? 0 : n === 2 ? 270 : 240;
    return [400 + (i - (n - 1) / 2) * gap, 212];
  };
  const htmlF = (t) => String(t).replace(/\^([0-9]*)([+-])/g, (_, n, s) => `<sup>${n}${s === '-' ? '−' : '+'}</sup>`).replace(/([A-Za-z)])(\d+)/g, '$1<sub>$2</sub>');
  function pickSpecies(sp) {
    oxLab.sp = sp; oxLab.s = R.solve(sp); oxLab.shown = new Set(); oxLab.active = null; oxLab.t0 = oxStage ? oxStage.t : 0; oxLab.solved = false;
    if (oxLab.mode === 'test') {
      const s = oxLab.s;
      oxLab.askEl = s.target || s.items[s.items.length - 1].el;
      s.items.forEach((it) => { if (it.el !== oxLab.askEl) oxLab.shown.add(it.el); });
      Lab.$('#ox-q').textContent = `Oxidation number of ${oxLab.askEl}:`;
      Lab.$('#ox-ans').value = '';
    }
    paintOx();
  }
  function paintOx() {
    const s = oxLab.s, say = Lab.$('#ox-say');
    if (oxLab.mode === 'test') {
      say.innerHTML = oxLab.solved ? oxLab.message : `<p>The other atoms are filled in. Use them to find <b>${oxLab.askEl}</b>. Your streak: <b>${oxLab.streak}</b>.</p>`;
      return;
    }
    if (!oxLab.active) { say.innerHTML = '<p>Tap an atom, or press <b>Reveal the next atom</b>. It is easiest to start with the atoms a rule names directly.</p>'; return; }
    const it = s.items.find((x) => x.el === oxLab.active);
    let html = `<p><b>${it.el} is ${R.signed(it.v)}.</b> ${it.why}</p>`;
    if (it.rule === 'sum') html += `<p>${Lab.texString(s.lines.join(' &nbsp; so &nbsp; '))}</p>`;
    if (oxLab.shown.size === s.items.length && s.items.length > 1) html += `<p>Check: the numbers add up to ${R.signed(s.z)}, the total charge.</p>`;
    say.innerHTML = html;
  }
  function revealAtom(el) {
    oxLab.shown.add(el); oxLab.active = el; oxLab.t0 = oxStage.t;
    Lab.sound.pop(); paintOx(); oxStage.redraw();
  }
  const oxStage = Lab.stage('#c-ox', {
    h: 400,
    label: 'A formula with one big atom for each element. Tapping an atom shows its oxidation number.',
    onPointer(e) {
      if (e.type !== 'down' && e.type !== 'hover') return;
      const s = oxLab.s;
      const hit = s.items.find((it, i) => { const [x, y] = oxPos(s.items.length, i); return Math.hypot(e.x - x, e.y - y) < 90; });
      if (e.type === 'hover') { oxStage.canvas.style.cursor = hit && oxLab.mode === 'explore' ? 'pointer' : 'default'; return; }
      if (hit && oxLab.mode === 'explore') revealAtom(hit.el);
    },
    draw(g, t) {
      const s = oxLab.s;
      if (!s) return;
      F(g, s.text, 400, 54, { size: 58, color: '#fff' });
      s.items.forEach((it, i) => {
        const [x, y] = oxPos(s.items.length, i);
        const shown = oxLab.shown.has(it.el);
        const active = oxLab.active === it.el;
        const bob = Math.sin(t * 2 + i * 1.5) * 3;
        const mood = !shown ? 'happy' : it.v > 0 ? 'wow' : it.v < 0 ? 'grin' : 'happy';
        if (active) Art.ring(g, x, y + bob, 86, { color: C.sun, w: 5, dash: [8, 8] });
        Art.atom(g, x, y + bob, 70, it.el, { face: mood, t, seed: i });
        Art.text(g, `× ${it.n}`, x, y + 106, { size: 30, color: C.dim });
        // The number, in a badge at the shoulder.
        const bx = x + 62, by = y - 62 + bob;
        if (shown) {
          const q = active ? ease.back(clamp((t - oxLab.t0) * 3 + (Lab.reducedMotion ? 1 : 0))) : 1;
          g.save(); g.translate(bx, by); g.scale(q, q);
          g.fillStyle = it.v > 0 ? '#FF3D7F' : it.v < 0 ? '#1FA5FF' : '#7A6E94';
          g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          g.beginPath(); g.arc(0, 0, 34, 0, TAU); g.fill(); g.stroke();
          Art.text(g, R.signed(it.v), 0, 2, { font: 'display', size: 34, color: '#fff' });
          g.restore();
        } else {
          const pulse = 1 + Math.sin(t * 3 + i) * 0.06;
          g.save(); g.translate(bx, by); g.scale(pulse, pulse);
          g.fillStyle = C.plum2; g.strokeStyle = C.sun; g.lineWidth = 3;
          g.beginPath(); g.arc(0, 0, 30, 0, TAU); g.fill(); g.stroke();
          Art.text(g, '?', 0, 2, { font: 'display', size: 38, color: C.sun });
          g.restore();
        }
      });
      if (oxLab.shown.size === s.items.length) {
        const sum = s.items.map((it) => `${it.n}(${R.signed(it.v)})`).join(' + ');
        Art.text(g, `${sum} = ${R.signed(s.z)}`, 400, 376, { font: 'display', size: 30, color: C.leaf });
      }
    },
  });
  Lab.$('#ox-pick').innerHTML = OX_LIST.map((sp, i) => `<button type="button" data-value="${i}" aria-pressed="${i === 0}">${htmlF(R.speciesText(sp))}</button>`).join('');
  Lab.segmented('#ox-pick', (v) => pickSpecies(OX_LIST[+v]));
  Lab.$('#ox-next').addEventListener('click', () => {
    const s = oxLab.s;
    const hidden = s.items.filter((it) => !oxLab.shown.has(it.el));
    if (!hidden.length) return;
    // Easy atoms first, and the one found by the sum last.
    const next = hidden.find((it) => it.rule !== 'sum') || hidden[0];
    revealAtom(next.el);
  });
  const newTest = () => {
    const pool = R.SPECIES.filter((sp) => R.solve(sp).target);
    let sp = pool[Math.floor(Math.random() * pool.length)];
    if (sp === oxLab.sp) sp = pool[(pool.indexOf(sp) + 1) % pool.length];
    pickSpecies(sp);
  };
  Lab.segmented('#ox-mode', (v) => {
    oxLab.mode = v;
    Lab.$('#ox-pick-ctl').hidden = v === 'test';
    Lab.$('#ox-explore-btns').hidden = v === 'test';
    Lab.$('#ox-form').hidden = v !== 'test';
    if (v === 'test') newTest(); else pickSpecies(OX_LIST[+(Lab.$('#ox-pick button[aria-pressed="true"]') || { dataset: { value: 0 } }).dataset.value]);
  });
  Lab.$('#ox-skip').addEventListener('click', newTest);
  Lab.$('#ox-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const s = oxLab.s, it = s.items.find((x) => x.el === oxLab.askEl);
    if (oxLab.solved) { newTest(); return; }
    const raw = Lab.$('#ox-ans').value.trim().replace(/[−–]/g, '-');
    const typed = parseFloat(raw);
    if (!Number.isFinite(typed)) { Lab.$('#ox-say').innerHTML = '<p>Enter a number with a sign, like +6 or -2.</p>'; return; }
    const ok = Math.abs(typed - it.v) < 0.01;
    oxLab.solved = true; oxLab.shown.add(it.el); oxLab.active = it.el; oxLab.t0 = oxStage.t;
    if (ok) {
      oxLab.streak++;
      Lab.sound.good();
      if (oxLab.streak % 5 === 0) { Lab.collection.award(1); Lab.confetti(50); }
    } else { oxLab.streak = 0; Lab.sound.bad(); }
    oxLab.message = `<p><b>${ok ? 'Correct!' : 'Not quite.'} ${it.el} is ${R.signed(it.v)}.</b> ${s.lines.length ? Lab.texString(s.lines.join(' &nbsp; so &nbsp; ')) : it.why}</p><p>Your streak: <b>${oxLab.streak}</b>. Press <b>Give me a new one</b> to keep going.</p>`;
    paintOx();
    oxStage.redraw();
  });
  pickSpecies(OX_LIST[0]);

  /* ---------- Bench: activity series ---------- */
  const act = { metal: 'Zn', ion: 'Cu', t0: 0, shownQ: 0 };
  const ACT_DUR = 8;
  function paintAct() {
    const x = R.react(act.metal, act.ion);
    const say = Lab.$('#act-say');
    const tx = Lab.texString;
    if (x.same) { say.innerHTML = tx(`<p>The strip and the ion are the same element, so there is nothing to trade. <b>No reaction.</b></p>`); return; }
    if (!x.goes) {
      const m = R.elName[x.M.sym], n = R.elName[x.N.sym];
      say.innerHTML = tx(`<p><b>No reaction.</b> ${m[0].toUpperCase() + m.slice(1)} is below ${n} on the ladder, so it holds on to its electrons more tightly than ${n} would. The reverse reaction is the one that happens.</p>`);
      return;
    }
    say.innerHTML = tx(`<p><b>Oxidation half:</b> $\\ce{${x.oxHalf}}$${x.oxTimes > 1 ? `, times ${x.oxTimes}` : ''}</p>
      <p><b>Reduction half:</b> $\\ce{${x.redHalf}}$${x.redTimes > 1 ? `, times ${x.redTimes}` : ''}</p>
      <p><b>Net:</b> $\\ce{${x.net}}$. That moves <b>${x.electrons} electrons</b>.</p>
      <p>$\\ce{${x.M.sym}}$ is the reducing agent and $\\ce{${x.nIon}}$ is the oxidizing agent.${x.note ? ' ' + x.note : ''}</p>`);
  }
  const actStage = Lab.stage('#c-activity', {
    h: 460, bg: (g, W, H) => Art.bgLab(g, W, H, 30),
    label: 'A ladder of metals from most to least active, a beaker with a metal strip in a solution, and a magnifier showing the atoms and ions.',
    draw(g, t) {
      const x = R.react(act.metal, act.ion);
      const e = Lab.reducedMotion ? 9 : t - act.t0;
      const q = x.goes ? clamp(e / ACT_DUR) : 0;
      // Ladder.
      const ly = 46, gap = 27.2, lx = 22, lw = 92;
      Art.text(g, 'most active', lx + lw / 2 + 8, 20, { size: 21, color: C.sun });
      Art.text(g, 'least active', lx + lw / 2 + 8, ly + gap * 13 + 26, { size: 21, color: C.dim });
      g.strokeStyle = '#A97F58'; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(lx, ly - 12); g.lineTo(lx, ly + gap * 13 + 12); g.moveTo(lx + lw, ly - 12); g.lineTo(lx + lw, ly + gap * 13 + 12); g.stroke();
      R.LADDER.forEach((sym, i) => {
        const y = ly + i * gap;
        const isM = sym === act.metal, isI = sym === act.ion;
        g.fillStyle = isM ? C.leaf : isI ? C.cyan : '#8E6A48';
        Art.round(g, lx - 2, y - 11.5, lw + 4, 23, 6); g.fill();
        Art.text(g, sym === 'H' ? 'H₂' : sym, lx + lw / 2, y + 0.5, { size: 21, color: isM || isI ? '#1A0F2E' : '#fff', font: 'display' });
      });
      const iy = (s) => ly + R.rank(s) * gap;
      if (!x.same) Art.arrow(g, lx + lw + 14, iy(act.metal), lx + lw + 14, iy(act.ion), { color: x.goes ? C.leaf : C.red, w: 5, curve: x.goes ? 22 : -22 });
      // Beaker.
      const prodColor = R.METAL_ION_COLOR[x.M.sym];
      const start = x.N.color ? x.N.color : CLEAR;
      let liquid = start;
      if (x.goes) liquid = prodColor ? Art.mix(start, prodColor, ease.inOut(q) * 0.7) : Art.mix(start, CLEAR, ease.inOut(q) * 0.82);
      stripBeaker(g, 268, 428, 190, 280, {
        q, t, strip: x.M.strip, coat: x.N.gas ? null : x.N.coat, crystals: x.N.crystals, liquid, bubbles: x.goes && x.N.gas, fall: x.goes && !x.N.gas, stripW: 42,
      });
      F(g, x.M.sym, 268, 96, { size: 30, halo: true });
      F(g, x.N.salt + '(aq)', 268, 448 - 4, { size: 21, halo: true });
      // Particle view.
      const evMax = x.goes ? Math.min(3, Math.floor(7 / Math.max(x.a, 1))) : 0;
      const loop = 3.4;
      const prog = x.goes ? Math.min(evMax, e / loop) : 0;
      Art.zoom(g, 296, 330, 590, 210, 186, (gg, cx, cy, R0) => {
        surfaceScene(gg, cx, cy, R0, x.M, x.N, prog, t, { max: evMax || 2, none: !x.goes, r: 21, spect: x.N.salt === 'HCl' ? 'Cl' : x.N.salt.includes('NO3') ? 'NO3' : 'SO4' });
      }, { p: 1 });
      const verdict = x.same ? 'Same element: nothing to trade' : x.goes ? 'Electrons jump: it reacts' : 'No electrons move: no reaction';
      Art.text(g, verdict, 590, 422, { font: 'display', size: 28, color: x.goes ? C.leaf : C.fire, halo: true });
    },
  });
  Lab.$('#act-metal').innerHTML = R.METALS.map((m) => `<button type="button" data-value="${m.sym}" aria-pressed="${m.sym === act.metal}" aria-label="${R.elName[m.sym]}">${m.sym}</button>`).join('');
  Lab.$('#act-ion').innerHTML = R.IONS.map((n) => `<button type="button" data-value="${n.sym}" aria-pressed="${n.sym === act.ion}">${htmlF(n.salt)}</button>`).join('');
  const restartAct = () => { act.t0 = actStage.t; paintAct(); actStage.redraw(); };
  Lab.segmented('#act-metal', (v) => { act.metal = v; restartAct(); });
  Lab.segmented('#act-ion', (v) => { act.ion = v; restartAct(); });
  paintAct();

  /* ---------- Story 2: redox everywhere ---------- */
  /** An atom with a floating oxidation number. */
  function tagged(g, x, y, r, sym, num, o = {}) {
    Art.atom(g, x, y, r, sym, { face: o.face, t: o.t, seed: o.seed, look: o.look, alpha: o.alpha });
    if (num) {
      const a = o.tagAlpha === undefined ? 1 : o.tagAlpha;
      Art.pill(g, num, x + r * 0.9, y - r * 0.92, { size: 24, color: o.tagColor || C.sun, text: '#1A0F2E', font: 'display', alpha: a });
    }
  }
  Lab.story('#story-everywhere', {
    title: 'Same electrons, different costumes',
    scenes: [
      {
        say: '<b>Rust.</b> Iron atoms give electrons to oxygen. Iron goes from 0 up to +3, so it is oxidized. Oxygen goes from 0 down to −2, so it is reduced. Water helps this along, which is why cars rust faster in the rain.',
        dur: 3.8,
        draw(g, p, t) {
          F(g, '4Fe + 3O2 -> 2Fe2O3', 400, 42, { size: 36, color: C.sun, alpha: seg(p, 0, 0.14) });
          const q = seg(p, 0.1, 0.78);
          // A nail going rusty.
          const nx = 70, ny = 150, nl = 660;
          const gr = g.createLinearGradient(0, ny - 20, 0, ny + 20);
          gr.addColorStop(0, '#C8CCD4'); gr.addColorStop(0.5, '#EEF0F4'); gr.addColorStop(1, '#7E828C');
          g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          g.beginPath(); g.moveTo(nx, ny - 15); g.lineTo(nx + nl - 40, ny - 15); g.lineTo(nx + nl, ny); g.lineTo(nx + nl - 40, ny + 15); g.lineTo(nx, ny + 15); g.closePath(); g.fill(); g.stroke();
          Art.round(g, nx - 16, ny - 34, 18, 68, 6); g.fillStyle = '#B7BBC4'; g.fill(); g.stroke();
          g.save();
          g.beginPath(); g.moveTo(nx, ny - 15); g.lineTo(nx + nl - 40, ny - 15); g.lineTo(nx + nl, ny); g.lineTo(nx + nl - 40, ny + 15); g.lineTo(nx, ny + 15); g.closePath(); g.clip();
          for (let i = 0; i < 120; i++) {
            if (Lab.rand(i + 2) > q) continue;
            g.fillStyle = i % 2 ? '#A5481F' : '#C9652B';
            g.beginPath(); g.arc(nx + Lab.rand(i + 5) * nl, ny - 15 + Lab.rand(i + 9) * 30, 5 + Lab.rand(i + 13) * 9, 0, TAU); g.fill();
          }
          g.restore();
          // The electron trade.
          const y = 290;
          tagged(g, 180, y, 56, 'Fe', q > 0.5 ? '+3' : '0', { face: q > 0.5 ? 'wow' : 'happy', t, look: [1, 0] });
          tagged(g, 620, y, 50, 'O', q > 0.5 ? '−2' : '0', { face: q > 0.5 ? 'grin' : 'happy', t, look: [-1, 0] });
          for (let i = 0; i < 3; i++) {
            const u = (t * 0.45 + i / 3) % 1;
            if (q > 0.1) Art.electron(g, lerp(250, 556, u), y + Math.sin(u * Math.PI) * -24, 10);
          }
          Art.text(g, 'oxidized', 180, 376, { size: 28, color: C.pink, font: 'display', alpha: seg(p, 0.6, 0.76) });
          Art.text(g, 'reduced', 620, 376, { size: 28, color: C.cyan, font: 'display', alpha: seg(p, 0.66, 0.82) });
          Art.text(g, '12 electrons move per equation', 400, 424, { size: 25, color: C.dim, alpha: seg(p, 0.76, 0.92) });
        },
      },
      {
        say: '<b>Fire.</b> Burning methane is redox too, even with no ions in sight. Carbon goes from −4 to +4, so it is oxidized. Oxygen goes from 0 to −2, so it is reduced.',
        dur: 3.8,
        draw(g, p, t) {
          F(g, 'CH4 + 2O2 -> CO2 + 2H2O', 400, 42, { size: 36, color: C.sun, alpha: seg(p, 0, 0.14) });
          const q = seg(p, 0.15, 0.7);
          Art.bunsen(g, 400, 430, 1.1, { air: 1, t });
          Art.text(g, 'Before', 190, 112, { size: 28, color: C.dim });
          Art.text(g, 'After', 620, 112, { size: 28, color: C.dim, alpha: seg(p, 0.5, 0.65) });
          Art.molecule(g, 110, 214, 58, 'CH4', { face: 'happy', t });
          Art.pill(g, '−4', 148, 178, { size: 24, color: C.sun, text: '#1A0F2E', font: 'display' });
          Art.molecule(g, 276, 214, 76, 'O2', { face: 'happy', t });
          Art.pill(g, '0', 316, 172, { size: 26, color: C.sun, text: '#1A0F2E', font: 'display' });
          g.save(); g.globalAlpha *= seg(p, 0.5, 0.65);
          Art.molecule(g, 560, 214, 52, 'CO2', { face: 'wow', t });
          Art.pill(g, '+4', 582, 170, { size: 26, color: C.pink, text: '#fff', font: 'display' });
          Art.molecule(g, 700, 220, 58, 'H2O', { face: 'grin', t });
          Art.pill(g, '−2', 726, 170, { size: 26, color: C.cyan, text: '#1A0F2E', font: 'display' });
          g.restore();
          Art.text(g, 'C goes up: oxidized', 190, 330, { size: 26, color: C.pink, alpha: seg(p, 0.66, 0.8) });
          Art.text(g, 'O goes down: reduced', 610, 330, { size: 26, color: C.cyan, alpha: seg(p, 0.72, 0.86) });
          void q;
        },
      },
      {
        say: '<b>Unequal trades.</b> Aluminum gives 3 electrons, but copper(II) takes only 2. So multiply until they match: 2 Al give 6 electrons, and 3 $\\ce{Cu^2+}$ take 6. Electrons lost must equal electrons gained.',
        dur: 4.2,
        draw(g, p, t) {
          F(g, '2Al + 3Cu^2+ -> 2Al^3+ + 3Cu', 400, 42, { size: 36, color: C.sun, alpha: seg(p, 0.75, 0.9) });
          const al = [[150, 176], [150, 326]], cu = [[650, 112], [650, 240], [650, 368]];
          al.forEach(([x, y], i) => Art.popIn(g, x, y, seg(p, 0.02 + i * 0.08, 0.2 + i * 0.08), (gg) => Art.atom(gg, 0, 0, 52, 'Al', { face: 'wow', t, look: [1, 0], charge: p > 0.8 ? '3+' : null })));
          cu.forEach(([x, y], i) => Art.popIn(g, x, y, seg(p, 0.14 + i * 0.07, 0.32 + i * 0.07), (gg) => Art.atom(gg, 0, 0, 46, 'Cu', { face: p > 0.7 ? 'grin' : 'happy', t, look: [-1, 0], charge: p > 0.8 ? null : '2+' })));
          for (let n = 0; n < 6; n++) {
            const from = al[Math.floor(n / 3)], to = cu[Math.floor(n / 2)];
            const u = ease.inOut(seg(p, 0.34 + n * 0.05, 0.56 + n * 0.05));
            const j = n % 3 - 1;
            if (u > 0) Art.electron(g, lerp(from[0] + 56, to[0] - 58 + (n % 2) * 18, u), lerp(from[1] + j * 14, to[1] + (n % 2 ? 12 : -12), u), 10);
          }
          Art.arrow(g, 260, 240, 540, 240, { color: C.cyan, w: 7, p: seg(p, 0.3, 0.6), alpha: 0.5 });
          Art.text(g, '6 electrons', 400, 196, { font: 'display', size: 36, color: C.cyan, alpha: seg(p, 0.6, 0.76) });
          Art.text(g, '2 × 3 = 6 lost', 150, 412, { size: 27, color: C.pink, font: 'display', alpha: seg(p, 0.7, 0.84) });
          Art.text(g, '3 × 2 = 6 gained', 400, 340, { size: 27, color: C.cyan, font: 'display', alpha: seg(p, 0.76, 0.9) });
        },
      },
      {
        say: '<b>Not everything is redox.</b> In a precipitation or a neutralization, every oxidation number stays the same. Ions switch partners or protons move, but no electrons change owners. If no number changes, it is not redox.',
        dur: 3.4,
        draw(g, p, t) {
          const panel = (y, title, eq, tags, color, a) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a; g.fillStyle = '#2B1A4A'; g.strokeStyle = color; g.lineWidth = 4;
            Art.round(g, 34, y, 732, 172, 22); g.fill(); g.stroke(); g.restore();
            Art.text(g, title, 400, y + 30, { font: 'display', size: 28, color, alpha: a });
            F(g, eq, 400, y + 78, { size: 30, alpha: a });
            Art.text(g, tags, 400, y + 128, { size: 26, color: C.dim, alpha: a });
          };
          panel(30, 'Redox: numbers change', 'Zn + Cu^2+ -> Zn^2+ + Cu', 'Zn 0 to +2 and Cu +2 to 0', C.leaf, seg(p, 0.06, 0.26));
          panel(226, 'Not redox: numbers stay put', 'Ag^+ + Cl^- -> AgCl', 'Ag stays +1 and Cl stays −1', C.fire, seg(p, 0.4, 0.6));
          void t;
        },
      },
    ],
  });

  const problems = R.selfTest();
  if (problems.length) console.error('Redox self-test failed: ' + problems.join('; '));
});
