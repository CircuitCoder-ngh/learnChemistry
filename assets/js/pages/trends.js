/* Lesson 7.5: Periodic trends. Every chart here draws from the real values in ELEMENTS, and handles missing values. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const ELS = window.ELEMENTS;
  const T = Bank.all.trends.lib;
  const { SUCC, IONIC } = T;

  /** Shell electron counts, read from the table's configuration strings. */
  function expand(str) {
    const m = {};
    const core = /\[([A-Z][a-z]?)\]/.exec(str);
    if (core) Object.assign(m, expand(EL[core[1]].config));
    const re = /(\d)([spdf])(\d+)/g;
    let t;
    while ((t = re.exec(str))) m[t[1] + t[2]] = +t[3];
    return m;
  }
  function shellsOf(e) {
    const m = expand(e.config), out = [];
    Object.keys(m).forEach((s) => { const n = +s[0] - 1; out[n] = (out[n] || 0) + m[s]; });
    return out.map((x) => x || 0);
  }
  const isMain = (e) => e.block === 's' || e.block === 'p';
  const valence = (e) => { const sh = shellsOf(e); return sh[sh.length - 1]; };
  const zeffOf = (e) => valence(e);
  const coreOf = (e) => e.z - valence(e);
  /** Draw an atom's shells. Outer radius is given, inner shells spaced evenly. */
  function atomShells(g, cx, cy, Rr, sh, o = {}) {
    const k = sh.length;
    const t = o.t || 0;
    if (k > 1) {
      const rr = (Rr * (k - 1)) / k;
      const cl = g.createRadialGradient(cx, cy, rr * 0.2, cx, cy, rr * 1.05);
      cl.addColorStop(0, 'rgba(180,170,220,.05)'); cl.addColorStop(1, `rgba(180,170,220,${o.coreA === undefined ? 0.2 : o.coreA})`);
      g.fillStyle = cl; g.beginPath(); g.arc(cx, cy, rr * 1.05, 0, TAU); g.fill();
    }
    sh.forEach((cnt, i) => {
      const rr = (Rr * (i + 1)) / k, outer = i === k - 1;
      g.strokeStyle = outer ? Art.alpha(C.sun, 0.9) : 'rgba(255,255,255,.22)'; g.lineWidth = outer ? 2.8 : 1.6;
      g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke();
      for (let j = 0; j < cnt; j++) {
        const a = (j / cnt) * TAU + t * (0.3 - i * 0.03) + i * 0.8;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        if (outer) Art.electron(g, x, y, o.eR || 8);
        else Art.ball(g, x, y, cnt > 12 ? 2.6 : 3.6, '#8D93B8');
      }
    });
  }
  const nucleus = (g, x, y, r, txt) => {
    Art.glow(g, x, y, r * 2.2, C.proton, 0.45);
    Art.ball(g, x, y, r, C.proton);
    if (txt) Art.text(g, txt, x, y, { size: Math.max(20, r * 0.86), font: 'display', color: '#fff' });
  };

  /* ---------- Story 1: the tug of war ---------- */
  Lab.story('#story-tug', {
    title: 'The tug of war',
    scenes: [
      {
        say: 'Look at sodium. Its one outer electron is pulled in by 11 protons, but 10 inner electrons sit in between and block most of the pull. This blocking is called <b>shielding</b>.',
        dur: 4.2,
        draw(g, p, t) {
          const cx = 250, cy = 225, Rr = 180;
          const e = EL.Na;
          const a = seg(p, 0.05, 0.25), b = seg(p, 0.3, 0.55);
          const sh = shellsOf(e);
          g.save(); g.globalAlpha *= b;
          atomShells(g, cx, cy, Rr, sh.slice(0, 2).concat([0]), { t, coreA: 0.4 });
          g.restore();
          g.strokeStyle = C.sun; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, Rr, 0, TAU); g.stroke();
          const ang = -0.4 + Math.sin(t * 0.5) * 0.2;
          const ex = cx + Math.cos(ang) * Rr, ey = cy + Math.sin(ang) * Rr;
          nucleus(g, cx, cy, 30, '+11');
          Art.atom(g, ex, ey, 22, 'e', { label: false, face: 'happy', t, color: C.electron, look: [-1, 0.3] });
          Art.text(g, '11 protons pull in', 590, 96, { size: 30, font: 'display', color: C.red, alpha: a });
          Art.text(g, '10 inner electrons', 590, 176, { size: 30, font: 'display', color: '#B9BEDD', alpha: b });
          Art.text(g, 'block part of the pull', 590, 214, { size: 26, color: '#B9BEDD', alpha: b });
          Art.text(g, 'Shielding', 590, 300, { size: 44, font: 'display', color: C.sun, alpha: seg(p, 0.65, 0.85) });
          void rand;
        },
      },
      {
        say: 'So the outer electron does not feel +11. It feels about $11 - 10 = +1$. This smaller number is the <b>effective nuclear charge</b>, $Z_{\\text{eff}}$. It is what the electron really experiences.',
        dur: 4,
        draw(g, p, t) {
          const y = 150;
          const qty = (x, val, label, col, a) => {
            Art.text(g, val, x, y, { size: 84, font: 'display', color: col, alpha: a });
            Art.text(g, label, x, y + 68, { size: 26, alpha: a, color: C.ink });
          };
          qty(150, '+11', 'protons', C.red, seg(p, 0.05, 0.22));
          Art.text(g, '−', 288, y, { size: 74, font: 'display', alpha: seg(p, 0.25, 0.35) });
          qty(420, '10', 'core electrons', '#B9BEDD', seg(p, 0.3, 0.46));
          Art.text(g, '=', 550, y, { size: 74, font: 'display', alpha: seg(p, 0.5, 0.6) });
          qty(670, '+1', 'what it feels', C.sun, seg(p, 0.56, 0.74));
          const b = ease.back(seg(p, 0.76, 0.94));
          if (b > 0) {
            g.save(); g.translate(400, 340); g.scale(b, b);
            g.fillStyle = C.pink; Art.round(g, -310, -42, 620, 84, 26); g.fill();
            Art.text(g, 'Zeff ≈ Z − core electrons', 0, 2, { size: 40, font: 'display', color: '#fff' });
            g.restore();
          }
          Art.text(g, 'A simple estimate. Careful calculations give different values.', 400, 416, { size: 23, color: C.dim, alpha: seg(p, 0.86, 1) });
          void t;
        },
      },
      {
        say: '<b>Across a period</b>, protons are added but the core stays the same. So $Z_{\\text{eff}}$ climbs from +1 to +7, and each atom is pulled tighter. These sizes are real and drawn to scale.',
        dur: 5,
        draw(g, p, t) {
          const list = ['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl'].map((s) => EL[s]);
          const scale = 0.33;
          list.forEach((e, i) => {
            const cx = 66 + i * 112, cy = 210;
            const a = seg(p, 0.06 + i * 0.11, 0.2 + i * 0.11);
            if (a <= 0) return;
            const rr = e.rcov * scale * ease.back(a);
            g.save(); g.globalAlpha *= a;
            Art.atom(g, cx, cy, rr, e.sym, { face: rr >= 18 ? 'happy' : null, t, seed: i, label: e.sym });
            g.restore();
            Art.text(g, `${e.rcov} pm`, cx, 298, { size: 22, alpha: a, color: C.cyan });
            Art.text(g, `+${zeffOf(e)}`, cx, 88, { size: 34, font: 'display', color: C.sun, alpha: a });
          });
          Art.text(g, 'Zeff', 22, 44, { size: 26, color: C.sun, align: 'left', alpha: seg(p, 0.05, 0.2) });
          Art.arrow(g, 60, 356, 730, 356, { color: C.pink, w: 7, p: seg(p, 0.2, 0.9) });
          Art.text(g, 'Stronger pull, same shell: atoms shrink', 400, 402, { size: 30, font: 'display', color: C.pink, alpha: seg(p, 0.76, 0.94) });
        },
      },
      {
        say: '<b>Down a group</b>, each step adds a whole new shell. $Z_{\\text{eff}}$ stays near +1 for this family, but the outer electron sits farther and farther away. Force falls off with distance, so the grip gets weaker.',
        dur: 4.6,
        draw(g, p, t) {
          const list = ['Li', 'Na', 'K', 'Rb'].map((s) => EL[s]);
          let x = 26;
          const scale = 0.49;
          list.forEach((e, i) => {
            const Rr = e.rcov * scale;
            const cx = x + Rr, cy = 240;
            x += Rr * 2 + 15;
            const a = seg(p, 0.06 + i * 0.18, 0.24 + i * 0.18);
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            atomShells(g, cx, cy, Rr, shellsOf(e), { t, eR: 8 });
            nucleus(g, cx, cy, 12);
            g.restore();
            Art.text(g, e.sym, cx, 50, { size: 34, font: 'display', color: C.sun, alpha: a });
            Art.text(g, `${e.rcov} pm`, cx, 86, { size: 23, color: C.cyan, alpha: a });
          });
          Art.text(g, 'Same Zeff of about +1. Farther away. Weaker grip.', 400, 418, { size: 27, color: C.pink, alpha: seg(p, 0.78, 0.96), halo: true });
        },
      },
      {
        say: 'Put the two together, and you have the whole map. Atoms at the <b>top right</b> are small and hold electrons hard. Atoms at the <b>bottom left</b> are big and let go easily.',
        dur: 4,
        draw(g, p, t) {
          const x0 = 150, y0 = 60, w = 500, hgt = 320;
          const gr = g.createLinearGradient(x0, y0 + hgt, x0 + w, y0);
          gr.addColorStop(0, '#5B8CFF'); gr.addColorStop(0.5, '#5B4490'); gr.addColorStop(1, '#FF4FA3');
          const a = seg(p, 0.05, 0.3);
          g.save(); g.globalAlpha *= a;
          g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 4;
          Art.round(g, x0, y0, w, hgt, 20); g.fill(); g.stroke();
          g.restore();
          Art.atom(g, x0 + w - 72, y0 + 72, 36, 'F', { face: 'grumpy', t, alpha: seg(p, 0.3, 0.45), look: [-1, 1] });
          Art.text(g, 'small and grabby', x0 + w - 230, y0 + 42, { size: 24, color: '#fff', alpha: seg(p, 0.35, 0.5), halo: true });
          Art.atom(g, x0 + 96, y0 + hgt - 96, 76, 'Cs', { face: 'sleepy', t, alpha: seg(p, 0.5, 0.65), label: 'Cs' });
          Art.text(g, 'big and giving', x0 + 300, y0 + hgt - 42, { size: 24, color: '#fff', alpha: seg(p, 0.55, 0.7), halo: true });
          Art.arrow(g, x0 + 60, y0 - 22, x0 + w - 60, y0 - 22, { color: C.sun, w: 6, p: seg(p, 0.65, 0.8) });
          Art.text(g, 'Across: Zeff grows', 400, 18, { size: 26, color: C.sun, alpha: seg(p, 0.68, 0.84) });
          Art.arrow(g, x0 - 28, y0 + 30, x0 - 28, y0 + hgt - 30, { color: C.cyan, w: 6, p: seg(p, 0.75, 0.9) });
          Art.text(g, 'Down:', 66, y0 + hgt / 2 - 18, { size: 26, color: C.cyan, alpha: seg(p, 0.78, 0.94) });
          Art.text(g, 'distance', 66, y0 + hgt / 2 + 14, { size: 24, color: C.cyan, alpha: seg(p, 0.78, 0.94) });
          Art.text(g, 'grows', 66, y0 + hgt / 2 + 42, { size: 24, color: C.cyan, alpha: seg(p, 0.78, 0.94) });
          Art.text(g, 'Sizes here are not to scale', 400, 420, { size: 22, color: C.faint, alpha: seg(p, 0.85, 1) });
        },
      },
    ],
  });

  /* ---------- Bench: feel the pull ---------- */
  const COLS = [1, 2, 13, 14, 15, 16, 17, 18];
  const MAINS = ELS.filter((e) => isMain(e) && e.period <= 6);
  const gridOf = (e) => [COLS.indexOf(e.group), e.period - 1];
  const atGrid = (c, r) => MAINS.find((e) => gridOf(e)[0] === c && gridOf(e)[1] === r);
  const Z = { el: EL.Na, shownR: EL.Na.rcov };
  const gx0 = 462, gy0 = 18, gw = 39, gh = 39;
  const zStage = Lab.stage('#c-zeff', {
    h: 520,
    label: 'An atom with its shells, nucleus and outer electrons, sized by the real radius. A small periodic table beside it lets you choose an element. Bars show its effective charge, radius and ionization energy.',
    onPointer(ev) {
      const hit = MAINS.find((e) => { const [c, r] = gridOf(e); return ev.x >= gx0 + c * gw && ev.x < gx0 + (c + 1) * gw && ev.y >= gy0 + r * gh && ev.y < gy0 + (r + 1) * gh; });
      if (ev.type === 'hover') { zStage.canvas.style.cursor = hit ? 'pointer' : 'default'; return; }
      if (ev.type === 'down' && hit) { Z.el = hit; paintZ(); Lab.sound.pop(); }
    },
    draw(g, t, dt) {
      const e = Z.el;
      Z.shownR = dt ? lerp(Z.shownR, e.rcov, clamp(dt * 7)) : e.rcov;
      const cx = 226, cy = 262, Rr = Z.shownR * 0.84;
      const sh = shellsOf(e), zeff = zeffOf(e);
      atomShells(g, cx, cy, Rr, sh, { t, coreA: 0.3, eR: sh[sh.length - 1] > 5 ? 7 : 9 });
      nucleus(g, cx, cy, e.z >= 10 ? 21 : 17, `+${e.z}`);
      // The tug line, from an outer electron to the nucleus. Strength follows Zeff / r².
      const ang = t * (0.3 - (sh.length - 1) * 0.03) + (sh.length - 1) * 0.8;
      const ex = cx + Math.cos(ang) * Rr, ey = cy + Math.sin(ang) * Rr;
      const pull = zeff / Math.pow(e.rcov / 100, 2);
      const pullW = clamp(2.5 + pull * 0.7, 2.5, 14);
      const inX = cx + Math.cos(ang) * 24, inY = cy + Math.sin(ang) * 24;
      Art.arrow(g, ex, ey, inX, inY, { color: C.pink, w: pullW, head: Math.max(11, pullW * 2) });
      Art.atom(g, ex, ey, 18, 'e', { label: false, face: pull > 6 ? 'grumpy' : pull < 1.2 ? 'sleepy' : 'happy', t, color: C.electron, look: [-Math.cos(ang), -Math.sin(ang)] });
      Art.text(g, e.name, 226, 30, { size: 36, font: 'display', color: C.sun, halo: true });
      // Small table.
      MAINS.forEach((m) => {
        const [c, r] = gridOf(m);
        const on = m === e;
        const x = gx0 + c * gw, y = gy0 + r * gh;
        g.fillStyle = on ? C.sun : 'rgba(255,255,255,.1)'; g.strokeStyle = on ? '#fff' : 'rgba(255,255,255,.28)'; g.lineWidth = 1.6;
        Art.round(g, x + 1, y + 1, gw - 2, gh - 2, 5); g.fill(); g.stroke();
        Art.text(g, m.sym, x + gw / 2, y + gh / 2 + 1, { size: 20, font: 'display', color: on ? '#22123A' : C.ink });
      });
      // Bars from real data.
      const rows = [
        ['Zeff, estimated', `+${zeff}`, zeff / 8, C.pink],
        ['Radius', `${e.rcov} pm`, e.rcov / 250, C.cyan],
        ['Ionization energy', `${e.ie} eV`, e.ie / 25, C.sun],
      ];
      rows.forEach(([lab, val, frac, col], i) => {
        const y = 288 + i * 76;
        Art.text(g, lab, gx0, y, { size: 22, align: 'left' });
        Art.text(g, val, gx0 + 8 * gw, y + 2, { size: 26, font: 'display', align: 'right', color: col });
        Art.meter(g, gx0, y + 18, 8 * gw, 20, frac, { color: col });
      });
      Art.text(g, 'Simplified 2D model', 14, 506, { size: 20, color: C.faint, align: 'left' });
    },
  });
  function paintZ() {
    const e = Z.el;
    const zf = zeffOf(e), core = coreOf(e);
    Lab.$('#z-foot').innerHTML = Lab.texString(`<p><b>${e.name}</b> has $Z = ${e.z}$ and ${core} core electrons, so $Z_{\\text{eff}} \\approx ${e.z} - ${core} = +${zf}$. Its outer shell is $n = ${e.period}$. Compare neighbors: to the right, the pull grows. Below, the distance grows. The thickness of the pink arrow shows the pull, $Z_{\\text{eff}}/r^2$.</p>`);
    zStage.redraw();
  }
  const moveZ = (dc, dr) => {
    const [c, r] = gridOf(Z.el);
    let nc = c + dc, nr = r + dr;
    let next = atGrid(nc, nr);
    if (!next && dc !== 0) { while (nc >= 0 && nc < 8 && !next) { nc += dc; next = atGrid(nc, nr); } }
    if (next) { Z.el = next; paintZ(); Lab.sound.pop(); }
  };
  Lab.$('#z-left').addEventListener('click', () => moveZ(-1, 0));
  Lab.$('#z-right').addEventListener('click', () => moveZ(1, 0));
  Lab.$('#z-up').addEventListener('click', () => moveZ(0, -1));
  Lab.$('#z-down').addEventListener('click', () => moveZ(0, 1));
  paintZ();

  /* ---------- Bench: the periodic trend map ---------- */
  const MAPEL = ELS.filter((e) => e.y <= 6);
  const META = {
    rcov: { label: 'Atomic radius', unit: 'pm', fmt: (v) => `${v} pm`, get: (e) => e.rcov, across: 'gets smaller', down: 'gets larger', hue: C.cyan,
      foot: 'Bars show the covalent radius. It shrinks across a period as $Z_{\\text{eff}}$ grows, and grows down a group as shells are added. Transition metals change more slowly, because their new electrons go in an inner d subshell.' },
    ie: { label: 'First ionization energy', unit: 'eV', fmt: (v) => `${v} eV`, get: (e) => e.ie, across: 'goes up', down: 'goes down', hue: C.pink,
      foot: 'Noble gases are the peaks, and alkali metals are the valleys. Look closely for the small dips after groups 2 and 15.' },
    ea: { label: 'Electron affinity', unit: 'eV', fmt: (v) => `${v} eV`, get: (e) => e.ea, across: 'generally goes up', down: 'generally goes down', hue: C.sun,
      foot: 'Taller means more energy released when the atom gains an electron. Gray tiles have <b>no stable negative ion</b> or no reliable value, including the noble gases, Be, Mg and N. This is the least regular trend, and halogens stand far above their neighbors.' },
    en: { label: 'Electronegativity', unit: '', fmt: (v) => `${v}`, get: (e) => (e.family === 'Noble gas' ? null : e.en), across: 'goes up', down: 'goes down', hue: C.leaf,
      foot: 'Pauling scale. Gray tiles have no meaningful value: noble gases are left out because they rarely form bonds, even though this data lists numbers for Kr and Xe, and a few other elements have no reported value.' },
    metal: { label: 'Metallic character', unit: '', fmt: (v) => ['nonmetal', 'metalloid', 'metal'][v], get: (e) => (e.family === 'Noble gas' || e.family === 'Nonmetal' || e.family === 'Halogen' ? 0 : e.family === 'Metalloid' ? 1 : 2), across: 'goes down', down: 'goes up', hue: C.violet, flat: true,
      foot: 'This is a description, not a measurement, so no bars here. Metals lose electrons easily, which is why they sit where ionization energy is low. The staircase of metalloids divides the two.' },
  };
  const M = { prop: 'rcov', view: 'bars', flat: 0, yaw: -8, heights: new Map(), colors: new Map(), sel: EL.Cl, hover: null };
  const MU = 40, MW = 800, MH = 540;
  const rangeOf = (prop) => {
    const vals = MAPEL.map((e) => ({ e, v: META[prop].get(e) })).filter((x) => x.v !== null && x.v !== undefined && !Number.isNaN(x.v));
    const sorted = vals.slice().sort((a, b) => a.v - b.v);
    return { lo: sorted[0], hi: sorted[sorted.length - 1], max: sorted[sorted.length - 1].v, min: sorted[0].v };
  };
  const tileColor = (prop, v, max, min) => {
    if (v === null || v === undefined) return null;
    if (prop === 'metal') return ['#2BB673', '#0AA5C7', '#8F7BFF'][v];
    const f = clamp((v - min) / (max - min));
    return f < 0.6 ? Art.mix('#3A2B72', META[prop].hue, f / 0.6) : Art.mix(META[prop].hue, '#FFFFFF', (f - 0.6) * 1.5);
  };
  function mapProject(flat, yawDeg) {
    const yaw = (lerp(yawDeg, 0, flat) * Math.PI) / 180;
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const V = lerp(35, MU, flat), cy = lerp(340, 280, flat);
    return (c, r, hgt) => {
      const dx = c - 9.5, dy = r - 3.5;
      const X = dx * cosY - dy * sinY, D = dx * sinY + dy * cosY;
      return [400 + X * MU, cy + D * V - hgt];
    };
  }
  const mapStage = Lab.stage('#c-map', {
    h: MH,
    label: 'The periodic table as a landscape of bars, one per element, with height and color showing the chosen property. Arrows show the direction of the trend.',
    onPointer(ev) {
      const P = mapProject(M.flat, M.yaw);
      const order = MAPEL.slice().sort((a, b) => depthOf(b) - depthOf(a));
      const hit = order.find((e) => {
        const hgt = M.heights.get(e.z) || 0;
        const pts = [P(e.x - 0.46, e.y - 0.46, hgt), P(e.x + 0.46, e.y + 0.46, 0), P(e.x + 0.46, e.y - 0.46, hgt), P(e.x - 0.46, e.y + 0.46, 0)];
        const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
        return ev.x >= Math.min(...xs) && ev.x <= Math.max(...xs) && ev.y >= Math.min(...ys) && ev.y <= Math.max(...ys);
      });
      if (ev.type === 'hover') { mapStage.canvas.style.cursor = hit ? 'pointer' : 'default'; return; }
      if (ev.type === 'down' && hit) { M.sel = hit; paintMap(); Lab.sound.pop(); }
    },
    draw(g, t, dt) {
      const meta = META[M.prop];
      const { max, min } = rangeOf(M.prop);
      const forceFlat = meta.flat || M.view === 'flat';
      const target = forceFlat ? 1 : 0;
      M.flat = dt ? lerp(M.flat, target, clamp(dt * 5)) : target;
      if (Math.abs(M.flat - target) < 0.003) M.flat = target;
      const P = mapProject(M.flat, M.yaw);
      // The floor, then trend arrows on it.
      const fl = [P(0.45, 0.45, 0), P(18.55, 0.45, 0), P(18.55, 6.55, 0), P(0.45, 6.55, 0)];
      g.fillStyle = 'rgba(12,6,28,.42)'; g.beginPath(); g.moveTo(...fl[0]); g.lineTo(...fl[1]); g.lineTo(...fl[2]); g.lineTo(...fl[3]); g.closePath(); g.fill();
      const a1 = P(0.7, 7.1, 0), a2 = P(18.3, 7.1, 0);
      Art.arrow(g, a1[0], a1[1], a2[0], a2[1], { color: C.pink, w: 5, head: 13 });
      Art.text(g, `Across a period: ${meta.across}`, (a1[0] + a2[0]) / 2, (a1[1] + a2[1]) / 2 + 26, { size: 24, color: C.pink, halo: true });
      const b1 = P(0.15, 0.6, 0), b2 = P(0.15, 6.5, 0);
      Art.arrow(g, b1[0], b1[1], b2[0], b2[1], { color: C.cyan, w: 5, head: 13 });
      Art.text(g, `Down a group: ${meta.down}`, 20, 72, { size: 24, color: C.cyan, align: 'left', halo: true });
      Art.text(g, meta.label, 20, 34, { size: 34, font: 'display', color: C.sun, align: 'left', halo: true });
      // Bars, far ones first.
      const order = MAPEL.slice().sort((a, b) => depthOf(a) - depthOf(b));
      order.forEach((e) => {
        const v = meta.get(e);
        const missing = v === null || v === undefined;
        const targetH = missing || meta.flat ? 0 : (v / max) * 150;
        const was = M.heights.has(e.z) ? M.heights.get(e.z) : targetH;
        const hNow = dt ? lerp(was, targetH, clamp(dt * 6)) : targetH;
        M.heights.set(e.z, hNow);
        const hgt = hNow * (1 - M.flat);
        const col = tileColor(M.prop, v, max, min);
        const d = 0.46;
        const A = P(e.x - d, e.y - d, hgt), B = P(e.x + d, e.y - d, hgt), Cc = P(e.x + d, e.y + d, hgt), D = P(e.x - d, e.y + d, hgt);
        if (missing) {
          g.fillStyle = 'rgba(255,255,255,.05)'; g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.5; g.setLineDash([3, 3]);
          g.beginPath(); g.moveTo(...A); g.lineTo(...B); g.lineTo(...Cc); g.lineTo(...D); g.closePath(); g.fill(); g.stroke(); g.setLineDash([]);
        } else {
          if (hgt > 0.5) {
            const C0 = P(e.x + d, e.y + d, 0), D0 = P(e.x - d, e.y + d, 0), B0 = P(e.x + d, e.y - d, 0), A0 = P(e.x - d, e.y - d, 0);
            const yawNow = lerp(M.yaw, 0, M.flat);
            g.fillStyle = Art.mix(col, '#12062A', 0.3); g.strokeStyle = 'rgba(16,8,32,.65)'; g.lineWidth = 1;
            g.beginPath(); g.moveTo(...D); g.lineTo(...Cc); g.lineTo(...C0); g.lineTo(...D0); g.closePath(); g.fill(); g.stroke();
            g.fillStyle = Art.mix(col, '#12062A', 0.48);
            g.beginPath();
            if (yawNow <= 0) { g.moveTo(...Cc); g.lineTo(...B); g.lineTo(...B0); g.lineTo(...C0); }
            else { g.moveTo(...A); g.lineTo(...D); g.lineTo(...D0); g.lineTo(...A0); }
            g.closePath(); g.fill(); g.stroke();
          }
          g.fillStyle = col; g.strokeStyle = 'rgba(16,8,32,.8)'; g.lineWidth = 1;
          g.beginPath(); g.moveTo(...A); g.lineTo(...B); g.lineTo(...Cc); g.lineTo(...D); g.closePath(); g.fill(); g.stroke();
        }
        const mid = P(e.x, e.y, hgt);
        Art.text(g, e.sym, mid[0], mid[1] + 1, { size: 20, font: 'display', color: !missing && Art.lum(col) > 0.5 ? '#1A0F2E' : '#fff' });
        if (e === M.sel) {
          g.strokeStyle = '#fff'; g.lineWidth = 3;
          g.beginPath(); g.moveTo(...A); g.lineTo(...B); g.lineTo(...Cc); g.lineTo(...D); g.closePath(); g.stroke();
        }
      });
      // Selected label on top.
      const e = M.sel, v = meta.get(e), hgtS = (M.heights.get(e.z) || 0) * (1 - M.flat);
      const top = P(e.x, e.y, hgtS);
      const txt = `${e.sym}: ${v === null || v === undefined ? 'no value' : meta.fmt(v)}`;
      const gapY = P(7.5, 2.4, 0)[1];
      const py = M.flat > 0.5 ? gapY : Math.max(112, top[1] - 26);
      g.font = `400 26px ${Art.FONT_DISPLAY}`;
      const halfW = g.measureText(txt).width / 2 + 16;
      const px = M.flat > 0.5 ? P(7.5, 2.4, 0)[0] : clamp(top[0], halfW + 6, 794 - halfW);
      if (M.prop === 'metal') {
        const yy = P(7.5, 1.2, 0)[1], xc = P(7.5, 1.2, 0)[0];
        [['metal', '#8F7BFF', -130], ['metalloid', '#0AA5C7', 0], ['nonmetal', '#2BB673', 134]].forEach(([w, col, dx]) => Art.pill(g, w, xc + dx, yy, { size: 22, color: col, text: '#fff' }));
      }
      Art.pill(g, txt, px, py, { size: 26, font: 'display', color: '#FFF3C2', text: '#22123A', stroke: '#1A0F2E' });
      void t;
    },
  });
  function depthOf(e) {
    const yaw = (lerp(M.yaw, 0, M.flat) * Math.PI) / 180;
    return (e.x - 9.5) * Math.sin(yaw) + (e.y - 3.5) * Math.cos(yaw);
  }
  function paintMap() {
    const meta = META[M.prop];
    const { lo, hi } = rangeOf(M.prop);
    const v = meta.get(M.sel);
    Lab.$('#map-sel').textContent = `${M.sel.name}: ${v === null || v === undefined ? 'no value' : meta.fmt(v)}`;
    if (M.prop === 'metal') {
      Lab.$('#map-hi').textContent = 'Bottom left';
      Lab.$('#map-lo').textContent = 'Top right';
    } else {
      Lab.$('#map-hi').textContent = `${hi.e.sym}: ${meta.fmt(hi.v)}`;
      Lab.$('#map-lo').textContent = `${lo.e.sym}: ${meta.fmt(lo.v)}`;
    }
    Lab.$('#map-foot').innerHTML = Lab.texString(`<p>${meta.foot} The f block is left out to keep the picture clear.</p>`);
    mapStage.redraw();
  }
  Lab.segmented('#map-prop', (x) => { M.prop = x; paintMap(); });
  Lab.segmented('#map-view', (x) => { M.view = x; mapStage.redraw(); });
  Lab.bind('#map-yaw', '#map-yaw-out', (x) => `${x}°`, (x) => { M.yaw = x; mapStage.redraw(); });
  paintMap();

  /* ---------- Story 2: ions ---------- */
  const PX = 0.82;
  const ionBall = (g, x, y, pm, sym, charge, o = {}) => {
    const rr = pm * (o.scale || PX);
    Art.atom(g, x, y, rr, sym, { label: sym, face: rr >= 18 ? (o.face || 'happy') : null, t: o.t, color: Art.elementColor(sym), alpha: o.alpha, look: o.look });
    if (charge) {
      const br = clamp(rr * 0.3, 16, 26), bx = x + rr * 0.74, by = y - rr * 0.74;
      g.fillStyle = /\+/.test(charge) ? '#FF3D7F' : '#1FA5FF'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill(); g.stroke();
      Art.text(g, charge.replace('-', '−'), bx, by + 1, { size: Math.max(20, br * 1.1), color: '#fff' });
    }
  };
  Lab.story('#story-ions', {
    title: 'How ions change size',
    scenes: [
      {
        say: 'When sodium loses its one 3s electron, its <b>whole outer shell is gone</b>. The rest is pulled in tighter. So a <b>cation is smaller</b> than its atom: 166 pm shrinks to 102 pm.',
        dur: 3.8,
        draw(g, p, t) {
          const u = ease.inOut(seg(p, 0.25, 0.6));
          const na = EL.Na.rcov;
          g.save(); g.globalAlpha *= 1;
          ionBall(g, 210, 220, na, 'Na', null, { t });
          g.restore();
          Art.text(g, 'Na atom', 210, 54, { size: 30, font: 'display' });
          Art.text(g, `${na} pm`, 210, 386, { size: 32, font: 'display', color: C.cyan });
          Art.arrow(g, 360, 220, 460, 220, { color: C.ink, w: 7, p: seg(p, 0.2, 0.4) });
          if (u > 0) {
            Art.electron(g, lerp(360, 760, u), lerp(160, 40, u), 11);
            Art.text(g, 'e⁻ leaves', 450, 150, { size: 24, color: C.cyan, alpha: 1 - seg(p, 0.6, 0.8) });
          }
          const a = seg(p, 0.5, 0.75);
          if (a > 0) {
            ionBall(g, 600, 220, lerp(na, IONIC['Na+'], ease.out(a)), 'Na', a > 0.7 ? '+' : null, { t, face: 'grin' });
            Art.text(g, 'Na⁺ ion', 600, 54, { size: 30, font: 'display', color: C.sun, alpha: a });
            Art.text(g, `${IONIC['Na+']} pm`, 600, 386, { size: 32, font: 'display', color: C.sun, alpha: a });
          }
          Art.text(g, 'Drawn to scale', 400, 426, { size: 22, color: C.faint, alpha: seg(p, 0.8, 1) });
        },
      },
      {
        say: 'When chlorine gains an electron, the protons stay the same, but the extra electron adds repulsion. The cloud puffs out. So an <b>anion is larger</b> than its atom: 102 pm grows to 181 pm.',
        dur: 3.8,
        draw(g, p, t) {
          const u = ease.inOut(seg(p, 0.15, 0.5));
          const cl = EL.Cl.rcov;
          ionBall(g, 180, 220, cl, 'Cl', null, { t, look: [1, -0.5] });
          Art.text(g, 'Cl atom', 180, 54, { size: 30, font: 'display' });
          Art.text(g, `${cl} pm`, 180, 386, { size: 32, font: 'display', color: C.cyan });
          Art.arrow(g, 300, 220, 390, 220, { color: C.ink, w: 7, p: seg(p, 0.2, 0.4) });
          if (u > 0 && u < 1) Art.electron(g, lerp(800, 560, u), lerp(40, 180, u), 11);
          const a = seg(p, 0.45, 0.8);
          ionBall(g, 590, 220, lerp(cl, IONIC['Cl-'], ease.out(a)), 'Cl', a > 0.7 ? '1-' : null, { t, face: a > 0.5 ? 'grin' : 'happy' });
          Art.text(g, a > 0.5 ? 'Cl⁻ ion' : 'Cl', 590, 28, { size: 30, font: 'display', color: C.sun });
          Art.text(g, `${Math.round(lerp(cl, IONIC['Cl-'], ease.out(a)))} pm`, 590, 418, { size: 32, font: 'display', color: C.sun });
        },
      },
      {
        say: 'Compare atoms and ions together. Group 1 cations are much smaller than their atoms, and group 17 anions are much larger. Radii of atoms and ions are measured differently, so treat these as a guide.',
        dur: 4.4,
        draw(g, p) {
          const rows = [
            [['Li', EL.Li.rcov, null], ['Li', IONIC['Li+'], '+'], ['Na', EL.Na.rcov, null], ['Na', IONIC['Na+'], '+']],
            [['F', EL.F.rcov, null], ['F', IONIC['F-'], '1-'], ['Cl', EL.Cl.rcov, null], ['Cl', IONIC['Cl-'], '1-']],
          ];
          const sc = 0.46;
          rows.forEach((row, ri) => {
            const y = ri === 0 ? 114 : 330;
            row.forEach(([sym, pm, ch], i) => {
              const x = 110 + i * 192;
              const a = seg(p, 0.05 + (ri * 4 + i) * 0.09, 0.15 + (ri * 4 + i) * 0.09);
              if (a <= 0) return;
              Art.atom(g, x, y, pm * sc, sym, { label: pm * sc > 16 ? sym : false, charge: ch, alpha: a });
              Art.text(g, `${pm} pm`, x, ri === 0 ? 208 : 428, { size: 24, color: ch ? C.sun : C.cyan, alpha: a, halo: true });
            });
          });
          Art.text(g, 'Atom to cation: shrinks', 400, 20, { size: 26, font: 'display', color: C.pink, alpha: seg(p, 0.1, 0.3), halo: true });
          Art.text(g, 'Atom to anion: grows', 400, 240, { size: 26, font: 'display', color: C.leaf, alpha: seg(p, 0.45, 0.6), halo: true });
        },
      },
      {
        say: 'These ions are <b>isoelectronic</b>: each has exactly 10 electrons. The only difference is the protons. More protons pull the same cloud tighter, so size falls steadily from $\\ce{N^{3-}}$ to $\\ce{Al^{3+}}$.',
        dur: 5,
        draw(g, p, t) {
          const list = [['N', 7, 'N3-', '3-'], ['O', 8, 'O2-', '2-'], ['F', 9, 'F-', '1-'], ['Na', 11, 'Na+', '+'], ['Mg', 12, 'Mg2+', '2+'], ['Al', 13, 'Al3+', '3+']];
          const sc = 0.42;
          list.forEach(([sym, zz, key, ch], i) => {
            const cx = 74 + i * 131, cy = 188;
            const q = ease.back(seg(p, 0.06 + i * 0.12, 0.2 + i * 0.12));
            if (q <= 0) return;
            const rr = IONIC[key] * sc * q;
            Art.atom(g, cx, cy, rr, sym, { label: sym, charge: ch, face: rr >= 28 ? 'happy' : null, t, seed: i });
            Art.text(g, `+${zz}`, cx, 64, { size: 32, font: 'display', color: C.red });
            Art.text(g, `${IONIC[key]} pm`, cx, 290, { size: 25, color: C.sun });
          });
          Art.text(g, 'protons', 400, 28, { size: 24, color: C.red, alpha: seg(p, 0.06, 0.2) });
          Art.arrow(g, 70, 342, 730, 342, { color: C.cyan, w: 6, p: seg(p, 0.5, 0.85) });
          Art.text(g, 'Same 10 electrons, more protons, smaller ion', 400, 388, { size: 28, font: 'display', color: C.cyan, alpha: seg(p, 0.76, 0.94) });
          Art.text(g, 'To scale. Shannon radii.', 400, 426, { size: 21, color: C.faint, alpha: seg(p, 0.85, 1) });
        },
      },
    ],
  });

  /* ---------- Story 3: ionization energy and its dips ---------- */
  const CHART = ELS.slice(0, 20);
  const IEMAX = 25;
  function ieChart(g, x0, y0, w, hgt, upto, o = {}) {
    const X = (z) => x0 + ((z - 1) / 19) * w, Y = (v) => y0 - (v / IEMAX) * hgt;
    g.strokeStyle = C.ink; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0 - 8, y0 - hgt - 6); g.lineTo(x0 - 8, y0 + 4); g.lineTo(x0 + w + 8, y0 + 4); g.stroke();
    const last = Math.floor(upto), frac = upto - last;
    g.strokeStyle = C.pink; g.lineWidth = 4.5; g.lineJoin = 'round';
    g.beginPath();
    CHART.forEach((e, i) => {
      if (e.z > last + 1) return;
      const vz = e.z <= last ? e.z : last + frac;
      const yy = e.z <= last ? Y(e.ie) : lerp(Y(CHART[last - 1].ie), Y(e.ie), frac);
      if (i) g.lineTo(X(vz), yy); else g.moveTo(X(vz), yy);
    });
    g.stroke();
    CHART.forEach((e) => {
      if (e.z > last) return;
      const noble = e.family === 'Noble gas', alkali = e.family === 'Alkali metal';
      const hot = o.hot && o.hot.includes(e.sym);
      Art.ball(g, X(e.z), Y(e.ie), hot ? 9 : 6, hot ? C.sun : noble ? C.violet : alkali ? C.cyan : C.pink);
      if (o.labels && o.labels.includes(e.sym)) {
        const up = !(o.below && o.below.includes(e.sym));
        Art.text(g, e.sym, X(e.z), Y(e.ie) + (up ? -22 : 24), { size: 24, font: 'display', color: hot ? C.sun : noble ? C.violet : alkali ? C.cyan : C.ink, halo: true });
      }
    });
    [5, 10, 15, 20].forEach((z) => Art.text(g, String(z), X(z), y0 + 26, { size: 21, color: C.dim }));
    [10, 20].forEach((v) => { Art.text(g, String(v), x0 - 18, Y(v), { size: 21, color: C.dim, align: 'right' }); g.fillStyle = C.ink; g.fillRect(x0 - 14, Y(v) - 1, 6, 2.4); });
    return { X, Y };
  }
  function miniBox(g, x, y, bw, bh, n, e, col, name) {
    Art.text(g, name, x - 10, y + bh / 2, { size: 26, font: 'display', color: col, align: 'right' });
    for (let i = 0; i < n; i++) {
      g.fillStyle = 'rgba(255,255,255,.08)'; g.strokeStyle = col; g.lineWidth = 3;
      Art.round(g, x + i * bw + 1, y, bw - 2, bh, 6); g.fill(); g.stroke();
    }
    for (let k = 0; k < e; k++) {
      const box = k < n ? k : k - n, up = k < n;
      const ax = x + box * bw + bw * (up ? 0.34 : 0.66), my = y + bh / 2, h2 = bh * 0.34, d = up ? -1 : 1;
      g.strokeStyle = C.electron; g.lineWidth = 3.2; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(ax, my - d * h2); g.lineTo(ax, my + d * h2);
      g.moveTo(ax - 6, my + d * (h2 - 8)); g.lineTo(ax, my + d * h2); g.lineTo(ax + 6, my + d * (h2 - 8)); g.stroke();
    }
  }
  const CX0 = 70, CY0 = 386, CW = 680, CH = 336;
  Lab.story('#story-ie', {
    title: 'Ionization energy across the table',
    scenes: [
      {
        say: 'Here is the first ionization energy of the first 20 elements, in eV. These are real measurements. It climbs across each period, then crashes at each new alkali metal, when a new shell begins.',
        dur: 5,
        draw(g, p) {
          const upto = lerp(1, 20, ease.inOut(seg(p, 0.05, 0.85)));
          ieChart(g, CX0, CY0, CW, CH, upto, { labels: ['H', 'He', 'Li', 'Ne', 'Na', 'Ar', 'K'], below: ['Li', 'Na', 'K'] });
          Art.text(g, 'First ionization energy, eV', 480, 34, { size: 24, color: C.pink });
          Art.text(g, 'Atomic number', CX0 + CW / 2, CY0 + 50, { size: 22 });
        },
      },
      {
        say: 'The noble gases are the peaks, because full shells hold on tight. The peak heights fall going down, from He to Ne to Ar, since the outer electrons are farther away. That is the <b>group trend</b>.',
        dur: 3.8,
        draw(g, p) {
          const { X, Y } = ieChart(g, CX0, CY0, CW, CH, 20, { labels: ['He', 'Ne', 'Ar', 'Li', 'Na', 'K'], below: ['Li', 'Na', 'K'] });
          const a = seg(p, 0.15, 0.55), b = seg(p, 0.55, 0.9);
          Art.arrow(g, X(2) + 12, Y(EL.He.ie) + 4, X(18) - 8, Y(EL.Ar.ie) - 18, { color: C.violet, w: 5, dash: [10, 8], p: a, curve: -18 });
          Art.arrow(g, X(3) + 8, Y(EL.Li.ie) + 16, X(19) - 10, Y(EL.K.ie) + 12, { color: C.cyan, w: 5, dash: [10, 8], p: b, curve: 14 });
          Art.text(g, 'Peaks fall', 560, 92, { size: 28, font: 'display', color: C.violet, alpha: a, halo: true });
          Art.text(g, 'Valleys fall too', 548, 326, { size: 26, font: 'display', color: C.cyan, alpha: b, halo: true });
        },
      },
      {
        say: 'First dip: <b>Be to B</b>. Boron has more protons, yet it is easier to ionize. Its outer electron is alone in <b>2p</b>, which is higher in energy than 2s and partly shielded by it.',
        dur: 4.6,
        draw(g, p) {
          const x0 = 66, y0 = 396, w = 340, hh = 250;
          const X = (z) => x0 + ((z - 3) / 7) * w, Y = (v) => y0 - (v / 24) * hh;
          g.strokeStyle = C.ink; g.lineWidth = 3;
          g.beginPath(); g.moveTo(x0 - 16, y0 - hh - 6); g.lineTo(x0 - 16, y0 + 2); g.lineTo(x0 + w + 16, y0 + 2); g.stroke();
          g.strokeStyle = C.pink; g.lineWidth = 4;
          g.beginPath(); ELS.slice(2, 10).forEach((e, i) => { if (i) g.lineTo(X(e.z), Y(e.ie)); else g.moveTo(X(e.z), Y(e.ie)); }); g.stroke();
          ELS.slice(2, 10).forEach((e) => {
            const hot = e.sym === 'Be' || e.sym === 'B';
            Art.ball(g, X(e.z), Y(e.ie), hot ? 9 : 6, hot ? C.sun : C.pink);
            Art.text(g, e.sym, X(e.z), Y(e.ie) - 22, { size: 23, font: 'display', color: hot ? C.sun : C.ink, halo: true });
          });
          Art.text(g, 'Period 2', x0 + w / 2, 56, { size: 28, font: 'display' });
          const a = seg(p, 0.2, 0.42), b = seg(p, 0.48, 0.7);
          g.save(); g.globalAlpha *= a;
          Art.text(g, `Be: ${EL.Be.ie} eV`, 610, 48, { size: 30, font: 'display', color: C.sun });
          miniBox(g, 470, 78, 56, 50, 1, 2, C.pink, '2s');
          miniBox(g, 578, 78, 56, 50, 3, 0, C.cyan, '2p');
          g.restore();
          g.save(); g.globalAlpha *= b;
          Art.text(g, `B: ${EL.B.ie} eV`, 610, 198, { size: 30, font: 'display', color: C.sun });
          miniBox(g, 470, 228, 56, 50, 1, 2, C.pink, '2s');
          miniBox(g, 578, 228, 56, 50, 3, 1, C.cyan, '2p');
          g.restore();
          Art.ring(g, 578 + 19, 253, 25, { color: C.red, w: 4, p: seg(p, 0.66, 0.82) });
          Art.text(g, 'Higher and shielded,', 610, 320, { size: 26, color: C.red, alpha: seg(p, 0.72, 0.88) });
          Art.text(g, 'so easier to remove', 610, 354, { size: 26, color: C.red, alpha: seg(p, 0.72, 0.88) });
        },
      },
      {
        say: 'Second dip: <b>N to O</b>. Nitrogen has three lone 2p electrons, spread out as Hund\'s rule says. Oxygen\'s fourth must <b>share a box</b>. The pair repels, so one of them is easier to pull off.',
        dur: 4.6,
        draw(g, p, t) {
          const panel = (cx, sym, e, lab, a) => {
            g.save(); g.globalAlpha *= a;
            Art.atom(g, cx - 200, 110, 48, sym, { face: sym === 'O' ? 'grumpy' : 'grin', t, label: sym });
            Art.text(g, lab, cx + 20, 62, { size: 32, font: 'display', color: C.sun });
            miniBox(g, cx - 110, 92, 84, 76, 3, e, C.cyan, '2p');
            g.restore();
          };
          panel(330, 'N', 3, `Nitrogen: ${EL.N.ie} eV`, seg(p, 0.08, 0.3));
          g.save(); g.translate(0, 180);
          panel(330, 'O', 4, `Oxygen: ${EL.O.ie} eV`, seg(p, 0.38, 0.6));
          g.restore();
          const a = seg(p, 0.62, 0.8);
          Art.ring(g, 262, 310, 44, { color: C.red, w: 4, p: a });
          Art.text(g, 'This pair repels', 560, 310, { size: 30, color: C.red, alpha: a, align: 'left', halo: true });
          Art.text(g, 'Half-filled nitrogen resists losing an electron', 400, 416, { size: 26, color: C.cyan, alpha: seg(p, 0.8, 0.96) });
        },
      },
    ],
  });

  /* ---------- Bench: successive ionization energies ---------- */
  const S = { sym: 'Mg', removed: 0, bars: [], flights: [] };
  const groupVal = (e) => (e.group <= 2 ? e.group : e.group - 10);
  const succStage = Lab.stage('#c-succ', {
    h: 460,
    label: 'An atom on the left loses electrons one at a time. Bars on the right grow to show the energy needed for each electron, with a huge jump when the core is reached.',
    draw(g, t, dt) {
      const e = EL[S.sym], list = SUCC[S.sym];
      const v = groupVal(e);
      // Atom: subtract electrons from outer shells first.
      const sh = shellsOf(e).slice();
      let left = S.removed;
      for (let i = sh.length - 1; i >= 0 && left > 0; i--) { const k = Math.min(sh[i], left); sh[i] -= k; left -= k; }
      const shells = sh.filter((x, i) => x > 0 || i === 0);
      const cx = 168, cy = 236, Rr = 34 + shells.length * 44;
      atomShells(g, cx, cy, Rr, shells, { t, eR: 10, coreA: 0.2 });
      nucleus(g, cx, cy, 24, `+${e.z}`);
      const q = S.removed;
      const label = q === 0 ? e.sym : `${e.sym}${q === 1 ? '⁺' : Lab.sup(q) + '⁺'}`;
      Art.text(g, label, cx, 34, { size: 38, font: 'display', color: C.sun, halo: true });
      Art.text(g, q === 0 ? 'Neutral atom' : `${q} removed`, cx, 72, { size: 24, color: C.ink, halo: true });
      S.flights = S.flights.filter((f) => {
        f.u += dt * 1.8;
        if (f.u >= 1) return false;
        Art.electron(g, lerp(cx + Rr * 0.7, 340, f.u), lerp(cy - Rr * 0.7, 20, f.u), 10);
        return true;
      });
      // Chart.
      const x0 = 386, y0 = 386, w = 390, hgt = 306;
      const max = Math.max(...list) * 1.08;
      g.strokeStyle = C.ink; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, y0 - hgt - 6); g.lineTo(x0, y0); g.lineTo(x0 + w + 4, y0); g.stroke();
      Art.text(g, 'Energy, in thousands of kJ/mol', x0 + 6, 42, { size: 22, color: C.pink, align: 'left' });
      const bw = Math.min(70, w / list.length - 10), step = w / list.length;
      list.forEach((val, i) => {
        const bx = x0 + step * i + (step - bw) / 2;
        S.bars[i] = S.bars[i] === undefined ? 0 : S.bars[i];
        const target = i < S.removed ? val : 0;
        S.bars[i] = dt ? lerp(S.bars[i], target, clamp(dt * 7)) : target;
        const bh = (S.bars[i] / max) * hgt;
        const core = i >= v;
        if (bh > 0.5) {
          const gr = g.createLinearGradient(0, y0 - bh, 0, y0);
          const col = core ? C.red : C.cyan;
          gr.addColorStop(0, Art.mix(col, '#ffffff', 0.2)); gr.addColorStop(1, Art.mix(col, '#1A0F2E', 0.3));
          g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
          Art.round(g, bx, y0 - bh, bw, bh, 5); g.fill(); g.stroke();
        }
        if (i < S.removed) {
          const txt = val >= 10000 ? (val / 1000).toFixed(1) : (val / 1000).toFixed(2);
          Art.text(g, txt, bx + bw / 2, y0 - bh - 16, { size: 21, color: core ? '#FFB3BA' : C.ink, halo: true });
        }
        Art.text(g, String(i + 1), bx + bw / 2, y0 + 24, { size: 22, color: C.dim });
      });
      Art.text(g, 'Which electron', x0 + w / 2, y0 + 54, { size: 22 });
      if (S.removed > v) {
        const i = v;
        const bx = x0 + step * i + step / 2;
        Art.pill(g, 'The wall!', Math.min(bx, 716), 84, { size: 26, font: 'display', color: C.red, text: '#fff' });
      }
    },
  });
  function paintSucc() {
    const e = EL[S.sym], list = SUCC[S.sym], v = groupVal(e);
    const q = S.removed;
    let msg;
    if (q === 0) msg = `<b>${e.name}</b> is in group ${e.group}. How many electrons can you remove before the energy explodes? Press the button to find out.`;
    else {
      const val = list[q - 1];
      if (q <= v) msg = `Electron ${q} costs <b>${val.toLocaleString('en-US')} kJ/mol</b>. ${q > 1 ? 'Each one is harder than the last, since fewer electrons now share the same pull. ' : ''}It is still a valence electron.`;
      else msg = `Electron ${q} costs <b>${val.toLocaleString('en-US')} kJ/mol</b>. This one comes from the <b>core</b>, closer to the nucleus and in a full shell. The wall comes after ${v} electron${v === 1 ? '' : 's'}, so ${e.name.toLowerCase()} has ${v} valence electron${v === 1 ? '' : 's'}, and it is in group ${e.group}.`;
    }
    Lab.$('#succ-foot').innerHTML = `<p>${msg}</p>`;
    Lab.$('#succ-next').disabled = q >= list.length;
    succStage.redraw();
  }
  const succSel = Lab.$('#succ-el');
  succSel.innerHTML = Object.keys(SUCC).map((s) => `<option value="${s}"${s === S.sym ? ' selected' : ''}>${EL[s].name} (${s})</option>`).join('');
  succSel.addEventListener('change', () => { S.sym = succSel.value; S.removed = 0; S.bars = []; paintSucc(); });
  Lab.$('#succ-next').addEventListener('click', () => {
    if (S.removed >= SUCC[S.sym].length) return;
    S.removed++; S.flights.push({ u: 0 });
    if (S.removed > groupVal(EL[S.sym])) Lab.sound.bad(); else Lab.sound.pop();
    paintSucc();
  });
  Lab.$('#succ-reset').addEventListener('click', () => { S.removed = 0; S.bars = []; paintSucc(); });
  paintSucc();

  /* ---------- Bench: rank these (a game) ---------- */
  const R = { items: [], prop: 'rcov', asc: true, picks: [], done: false, right: false, streak: 0, best: 0, t0: 0 };
  const RX = (i, n) => 400 + (i - (n - 1) / 2) * 180;
  const rankRng = Bank.rng();
  function newRank() {
    const prop = rankRng.pick(['rcov', 'ie', 'en']);
    const usePeriod = rankRng.next() < 0.5;
    const pick = T.pickLine(rankRng, prop, 4, usePeriod) || T.pickLine(rankRng, prop, 3, usePeriod) || T.pickLine(rankRng, prop, 3, !usePeriod);
    R.prop = prop; R.asc = rankRng.next() < 0.5;
    R.items = rankRng.shuffle(pick);
    R.picks = []; R.done = false; R.right = false; R.usePeriod = usePeriod; R.t0 = rankStage ? rankStage.t : 0;
    Lab.$('#rank-foot').innerHTML = '<p>Think about where each one sits on the table. Tap the first in the order, then the next.</p>';
  }
  const WORD = {
    rcov: { asc: 'smallest to largest radius', desc: 'largest to smallest radius', unit: ' pm' },
    ie: { asc: 'lowest to highest ionization energy', desc: 'highest to lowest ionization energy', unit: ' eV' },
    en: { asc: 'lowest to highest electronegativity', desc: 'highest to lowest electronegativity', unit: '' },
  };
  let rankStage;
  rankStage = Lab.stage('#c-rank', {
    h: 370,
    label: 'Atoms to tap in order, from low to high or high to low on a chosen property. Real values appear when you finish.',
    onPointer(ev) {
      const n = R.items.length;
      const idx = R.items.findIndex((_, i) => Math.hypot(ev.x - RX(i, n), ev.y - 180) < 74);
      if (ev.type === 'hover') { rankStage.canvas.style.cursor = idx >= 0 && !R.done ? 'pointer' : 'default'; return; }
      if (ev.type !== 'down' || idx < 0 || R.done) return;
      const e = R.items[idx];
      if (R.picks.includes(e)) { R.picks = R.picks.filter((x) => x !== e); return; }
      R.picks.push(e);
      Lab.sound.pop();
      if (R.picks.length === n) finishRank();
    },
    draw(g, t) {
      const n = R.items.length;
      const w = WORD[R.prop];
      Art.text(g, `Order these: ${R.asc ? w.asc : w.desc}`, 400, 40, { size: 30, font: 'display', color: C.sun, halo: true });
      R.items.forEach((e, i) => {
        const x = RX(i, n), y = 180;
        const order = R.picks.indexOf(e);
        const picked = order >= 0;
        if (picked) { Art.glow(g, x, y, 92, R.done ? (R.right ? C.leaf : C.red) : C.sun, 0.42); }
        Art.atom(g, x, y, 62, e.sym, { face: R.done ? (R.right ? 'grin' : 'sad') : 'happy', t, seed: i, label: e.sym });
        if (picked) {
          g.fillStyle = C.sun; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          g.beginPath(); g.arc(x - 50, y - 50, 24, 0, TAU); g.fill(); g.stroke();
          Art.text(g, String(order + 1), x - 50, y - 49, { size: 30, font: 'display', color: '#22123A' });
        }
        Art.text(g, e.name, x, 272, { size: 26 });
        if (R.done) Art.text(g, `${T.VAL[R.prop](e)}${w.unit}`, x, 310, { size: 28, font: 'display', color: C.sun });
      });
      if (R.done) Art.text(g, R.right ? 'Correct!' : 'Not quite. See the values above.', 400, 348, { size: 26, color: R.right ? C.leaf : '#FFB3BA' });
    },
  });
  function finishRank() {
    const vals = R.picks.map((e) => T.VAL[R.prop](e));
    let ok = true;
    for (let i = 1; i < vals.length; i++) if (R.asc ? vals[i] <= vals[i - 1] : vals[i] >= vals[i - 1]) ok = false;
    R.done = true; R.right = ok;
    if (ok) {
      R.streak++; R.best = Math.max(R.best, R.streak);
      Lab.sound.good();
      if (R.streak % 3 === 0) { Lab.collection.award(1); Lab.confetti(70); }
    } else { R.streak = 0; Lab.sound.bad(); }
    Lab.$('#rank-streak').textContent = R.streak; Lab.$('#rank-best').textContent = R.best;
    const sorted = R.items.slice().sort((a, b) => (R.asc ? 1 : -1) * (T.VAL[R.prop](a) - T.VAL[R.prop](b))).map((e) => e.sym).join(', ');
    const line = R.usePeriod ? `These sit in period ${R.items[0].period}.` : `These sit in group ${R.items[0].group}.`;
    Lab.$('#rank-foot').innerHTML = Lab.texString(`<p><b>The right order: ${sorted}.</b> ${line} ${T.INFO[R.prop].why}</p>`);
  }
  newRank();
  Lab.$('#rank-next').addEventListener('click', () => { newRank(); rankStage.redraw(); });
  Lab.$('#rank-clear').addEventListener('click', () => { if (!R.done) { R.picks = []; rankStage.redraw(); } });
});
