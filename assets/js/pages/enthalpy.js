/* Lesson 6.3: Enthalpy and Hess's law. Every number comes from the table in the bank. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const EXO = C.fire, ENDO = C.cyan;
  const B = Bank.all.enthalpy;
  const { hf: HF, dHof, BE, PUZZLES, COMB, OTHER } = B;
  const smooth = (x) => { const u = clamp(x); return u * u * (3 - 2 * u); };
  const rx = (r, p) => ({ r, p });
  /** Text form of an enthalpy with a real minus sign. */
  const kj = (x, d = 1) => (x > 0 ? '+' : x < 0 ? '−' : '') + Lab.fmt(Math.abs(x), d);
  const texNum = (x, d = 1) => (x > 0 ? '+' : x < 0 ? '-' : '') + Math.abs(x).toFixed(d);

  /* ---------- Drawing helpers for this lesson ---------- */
  const widthCache = new Map();
  function fw(g, f, size) {
    const k = f + '|' + size;
    if (widthCache.has(k)) return widthCache.get(k);
    g.save(); g.globalAlpha = 0;
    const w = Art.formula(g, f, -999, -999, { size, align: 'left' });
    g.restore();
    widthCache.set(k, w);
    return w;
  }
  /** Art.formula silently drops fractions such as ½ and 3/2, which would change the chemistry. This keeps them. */
  function fml(g, str, x, y, o = {}) {
    const parts = str.split(/(\d+\/\d+|[½¼¾])/);
    if (parts.length === 1) return Art.formula(g, str, x, y, o);
    const size = o.size || 30;
    const isFrac = (s) => /^(\d+\/\d+|[½¼¾])$/.test(s);
    g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
    const widths = parts.map((s) => (isFrac(s) ? g.measureText(s).width : s ? fw(g, s, size) : 0));
    const total = widths.reduce((a, b) => a + b, 0);
    let cx = o.align === 'right' ? x - total : o.align === 'left' ? x : x - total / 2;
    parts.forEach((s, i) => {
      if (isFrac(s)) Art.text(g, s, cx, y, { font: 'display', size, align: 'left', color: o.color, halo: o.halo });
      else if (s) Art.formula(g, s, cx, y, Object.assign({}, o, { align: 'left' }));
      cx += widths[i];
    });
    return total;
  }
  function heatArrow(g, x1, y1, x2, y2, t, o = {}) {
    const p = o.p === undefined ? 1 : clamp(o.p);
    if (p <= 0) return;
    const w = o.w || 20, head = o.head || w * 1.25;
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, L = len * p;
    const bodyEnd = Math.max(0, L - head);
    g.save();
    g.translate(x1, y1); g.rotate(Math.atan2(dy, dx));
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    g.beginPath();
    g.moveTo(0, -w / 2); g.lineTo(bodyEnd, -w / 2); g.lineTo(bodyEnd, -w); g.lineTo(L, 0); g.lineTo(bodyEnd, w); g.lineTo(bodyEnd, w / 2); g.lineTo(0, w / 2); g.closePath();
    const gr = g.createLinearGradient(0, 0, L, 0);
    gr.addColorStop(0, '#E0561B'); gr.addColorStop(1, '#FFB23F');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.stroke();
    g.clip();
    const gap = 30, off = (t * 54) % gap;
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Math.max(3, w * 0.2); g.lineCap = 'round'; g.lineJoin = 'round';
    for (let s = off - gap; s < L; s += gap) {
      g.beginPath(); g.moveTo(s - w * 0.32, -w * 0.32); g.lineTo(s, 0); g.lineTo(s - w * 0.32, w * 0.32); g.stroke();
    }
    g.restore();
  }
  /** The change-in-enthalpy arrow on a diagram: down is negative, up is positive. */
  function deltaArrow(g, x, y1, y2, o = {}) {
    const color = o.color || C.sun, p = o.p === undefined ? 1 : clamp(o.p);
    if (p <= 0 || Math.abs(y2 - y1) < 2) return;
    Art.arrow(g, x, y1, x, lerp(y1, y2, p), { color, w: o.w || 9, head: o.head || 24 });
  }
  function packet(g, x, y, r = 11, a = 1) {
    if (a <= 0) return;
    const prev = g.globalAlpha;
    g.globalAlpha = prev * a;
    Art.glow(g, x, y, r * 2.6, C.fire, 0.6);
    Art.ball(g, x, y, r, '#FFA63D');
    g.globalAlpha = prev;
  }
  function shelf(g, x0, x1, y, color = '#9A7CC9') {
    const s = g.createLinearGradient(0, y, 0, y + 15);
    s.addColorStop(0, color); s.addColorStop(1, Art.mix(color, '#12062A', 0.45));
    g.fillStyle = s; Art.round(g, x0, y, x1 - x0, 15, 7); g.fill();
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 2; g.stroke();
  }
  function yAxis(g, x, y0, y1, label) {
    Art.arrow(g, x, y0, x, y1, { color: C.ink, w: 3.5, head: 12 });
    Art.text(g, label, x + 14, y1 + 6, { size: 23, color: C.dim, align: 'left' });
  }
  const mol = (g, x, y, s, f, t, o = {}) => Art.molecule(g, x, y, s, f, Object.assign({ rot: (o.rot || 0) + Math.sin(t * 0.8 + x) * 0.08, labels: false, style: 'fill', atomScale: 1.2, face: o.face, t }, o));

  /* ---------- Story 1: shelves ---------- */
  const CH4RX = COMB[0][3], dCH4 = dHof(CH4RX);
  const NORX = rx({ 'N2(g)': 1, 'O2(g)': 1 }, { 'NO(g)': 2 });
  const dNO = dHof(NORX);
  function shelfDiagram(g, p, t, o) {
    const hiY = 158, loY = 344;
    const exo = o.dH < 0;
    const yR = exo ? hiY : loY, yP = exo ? loY : hiY;
    yAxis(g, 34, 412, 34, 'Enthalpy, H');
    const a = seg(p, 0, 0.2), b = seg(p, 0.35, 0.55);
    g.save(); g.globalAlpha *= a; shelf(g, 62, 342, yR); o.left(g, yR, t); g.restore();
    g.save(); g.globalAlpha *= b; shelf(g, 458, 738, yP); o.right(g, yP, t); g.restore();
    Art.formula(g, o.lf, 202, yR + 42, { size: 26, alpha: a, color: a > 0.3 ? C.ink : 'rgba(0,0,0,0)' });
    Art.text(g, 'Reactants', 202, yR + 76, { size: 23, color: C.dim, alpha: a });
    Art.formula(g, o.rf, 598, yP + 42, { size: 26, color: b > 0.3 ? C.ink : 'rgba(0,0,0,0)' });
    Art.text(g, 'Products', 598, yP + 76, { size: 23, color: C.dim, alpha: b });
    // Dashed guides and the delta arrow.
    const q = ease.inOut(seg(p, 0.4, 0.7));
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2.5; g.setLineDash([8, 8]);
    g.beginPath(); g.moveTo(342, yR + 7); g.lineTo(406, yR + 7); g.moveTo(458, yP + 7); g.lineTo(394, yP + 7); g.stroke(); g.setLineDash([]);
    deltaArrow(g, 400, yR + 7, yP + 7, { p: q, w: 11, head: 28 });
    const c = seg(p, 0.6, 0.8);
    Art.text(g, 'ΔH', 442, (hiY + loY) / 2 - 18, { font: 'display', size: 30, color: C.sun, alpha: c, halo: true, align: 'left', maxW: 90 });
    Art.text(g, kj(o.dH) + ' kJ', 442, (hiY + loY) / 2 + 18, { font: 'display', size: 30, color: C.sun, alpha: c, halo: true, align: 'left', maxW: 150 });
    // Heat that agrees with the sign.
    const h = seg(p, 0.55, 0.85);
    if (exo) heatArrow(g, 440, 62, 620, 62, t, { p: h, w: 22 });
    else heatArrow(g, 620, 62, 440, 62, t, { p: h, w: 22 });
    Art.text(g, exo ? 'Heat leaves' : 'Heat enters', 700, 62, { size: 25, alpha: h, color: EXO, halo: true });
  }
  const leftCH4 = (g, y, t) => { mol(g, 116, y - 40, 36, 'CH4', t, { face: 'happy' }); mol(g, 214, y - 34, 40, 'O2', t); mol(g, 296, y - 34, 40, 'O2', t, { rot: 0.4 }); };
  const rightCH4 = (g, y, t) => { mol(g, 526, y - 34, 40, 'CO2', t); mol(g, 626, y - 34, 40, 'H2O', t); mol(g, 706, y - 34, 40, 'H2O', t, { rot: 0.2 }); };

  Lab.story('#story-shelves', {
    title: 'Reactions move between shelves',
    scenes: [
      {
        say: 'Every set of chemicals has an <b>enthalpy</b>, like a height on a shelf. No one can read the true height, but you can measure the <b>change</b> between shelves: $\\Delta H$.',
        dur: 3,
        draw(g, p, t) {
          yAxis(g, 34, 412, 34, 'Enthalpy, H');
          shelf(g, 90, 360, 136); shelf(g, 440, 710, 330);
          g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(70, 418, 690, 2);
          const a = seg(p, 0.05, 0.35), b = seg(p, 0.35, 0.65), c = seg(p, 0.6, 0.85);
          Art.popIn(g, 225, 88, a, (gg) => Art.atom(gg, 0, 0, 44, 'C', { face: 'happy', t, label: 'A' }));
          Art.popIn(g, 575, 282, b, (gg) => Art.atom(gg, 0, 0, 44, 'O', { face: 'grin', t, label: 'B' }));
          Art.text(g, 'Start', 225, 170, { size: 26, alpha: a });
          Art.text(g, 'End', 575, 364, { size: 26, alpha: b });
          g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2.5; g.setLineDash([8, 8]);
          g.globalAlpha = c; g.beginPath(); g.moveTo(360, 143); g.lineTo(404, 143); g.stroke(); g.globalAlpha = 1; g.setLineDash([]);
          deltaArrow(g, 400, 143, 337, { p: ease.inOut(seg(p, 0.6, 0.9)), w: 11, head: 28 });
          Art.text(g, 'ΔH = H products − H reactants', 480, 54, { size: 28, color: C.sun, alpha: c, maxW: 560 });
          void wander;
        },
      },
      {
        say: 'Burning methane drops to a lower shelf. Products are lower, so $\\Delta H$ is <b>negative</b>. The energy that was lost leaves as <b>heat</b>. Exothermic.',
        dur: 3.4,
        draw(g, p, t) {
          shelfDiagram(g, p, t, { dH: dCH4, lf: 'CH4 + 2 O2', rf: 'CO2 + 2 H2O', left: leftCH4, right: rightCH4 });
        },
      },
      {
        say: 'Making NO from air climbs to a higher shelf. Products are higher, so $\\Delta H$ is <b>positive</b>. The climb is paid for with heat from outside. Endothermic.',
        dur: 3.4,
        draw(g, p, t) {
          shelfDiagram(g, p, t, {
            dH: dNO, lf: 'N2 + O2', rf: '2 NO',
            left: (gg, y, tt) => { mol(gg, 142, y - 34, 44, 'N2', tt, { face: 'sleepy' }); mol(gg, 262, y - 34, 44, 'O2', tt); },
            right: (gg, y, tt) => { mol(gg, 538, y - 34, 44, 'NO', tt); mol(gg, 658, y - 34, 44, 'NO', tt, { rot: 0.3 }); },
          });
        },
      },
      {
        say: '$\\Delta H$ scales with the recipe. Burn twice as much, get twice the heat. Burn half as much, get half. <b>Multiply the equation, multiply $\\Delta H$.</b>',
        dur: 3.4,
        draw(g, p, t) {
          const y0 = 106, unit = 0.135;
          g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3; g.setLineDash([9, 8]);
          g.beginPath(); g.moveTo(50, y0); g.lineTo(760, y0); g.stroke(); g.setLineDash([]);
          [[0.5, 150, '½ CH₄'], [1, 400, '1 CH₄'], [2, 650, '2 CH₄']].forEach(([k, x, name], i) => {
            const d = seg(p, 0.05 + i * 0.25, 0.32 + i * 0.25);
            const L = Math.abs(dCH4) * k * unit;
            Art.text(g, name, x, 62, { font: 'display', size: 34, alpha: d });
            deltaArrow(g, x, y0 + 4, y0 + 4 + L, { p: ease.inOut(d), w: 26, head: 34, color: C.sun });
            const a = seg(p, 0.2 + i * 0.25, 0.38 + i * 0.25);
            Art.text(g, kj(dCH4 * k) + ' kJ', x + (k === 2 ? 0 : 0), y0 + 34 + L + 2, { font: 'display', size: 34, color: C.sun, alpha: a, halo: true, maxW: 220 });
          });
          void t;
        },
      },
      {
        say: 'Run any reaction backward and it has to climb what it once fell. The size stays the same, but <b>the sign flips</b>. Flip the equation, flip the sign.',
        dur: 3.6,
        draw(g, p, t, { W }) {
          const q = seg(p, 0.3, 0.6);
          const flip = q > 0.5;
          const sy = Math.abs(Math.cos(q * Math.PI));
          g.save(); g.translate(W / 2, 110); g.scale(1, Math.max(0.02, sy));
          g.fillStyle = flip ? '#23506B' : '#5E3216'; g.strokeStyle = flip ? ENDO : EXO; g.lineWidth = 4;
          Art.round(g, -372, -62, 744, 124, 24); g.fill(); g.stroke();
          Art.formula(g, flip ? 'CO2 + 2 H2O -> CH4 + 2 O2' : 'CH4 + 2 O2 -> CO2 + 2 H2O', 0, -18, { size: 33 });
          Art.text(g, 'ΔH = ' + kj(flip ? -dCH4 : dCH4) + ' kJ', 0, 28, { font: 'display', size: 34, color: C.sun });
          g.restore();
          const yHi = 232, yLo = 384;
          shelf(g, 112, 328, yHi); shelf(g, 472, 688, yLo);
          Art.formula(g, 'CH4 + 2 O2', 220, yHi - 28, { size: 26 });
          Art.formula(g, 'CO2 + 2 H2O', 580, yLo - 28, { size: 26 });
          const a1 = seg(p, 0, 0.15);
          const fwd = 1 - seg(p, 0.45, 0.6), back = seg(p, 0.55, 0.8);
          g.save(); g.globalAlpha *= a1 * Math.max(0.15, fwd);
          Art.arrow(g, 338, yHi + 8, 462, yLo + 6, { color: EXO, w: 10, head: 28 });
          g.restore();
          if (back > 0) {
            g.save(); g.globalAlpha *= back;
            Art.arrow(g, 462, yLo - 40, 338, yHi - 28, { color: ENDO, w: 10, head: 28 });
            g.restore();
            Art.text(g, 'climbs back up', 520, yHi + 18, { size: 25, color: ENDO, alpha: back, halo: true });
          } else {
            Art.text(g, 'falls down', 300, 340, { size: 25, color: EXO, alpha: a1, halo: true });
          }
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: energy diagram explorer ---------- */
  const DIA = {
    ch4: { re: CH4RX, l: 'CH4 + 2 O2', r: 'CO2 + 2 H2O' },
    h2o: { re: rx({ 'H2(g)': 1, 'O2(g)': 0.5 }, { 'H2O(l)': 1 }), l: 'H2 + ½ O2', r: 'H2O' },
    nh3: { re: rx({ 'N2(g)': 1, 'H2(g)': 3 }, { 'NH3(g)': 2 }), l: 'N2 + 3 H2', r: '2 NH3' },
    no: { re: NORX, l: 'N2 + O2', r: '2 NO' },
    caco3: { re: rx({ 'CaCO3(s)': 1 }, { 'CaO(s)': 1, 'CO2(g)': 1 }), l: 'CaCO3', r: 'CaO + CO2' },
  };
  const dia = { key: 'ch4', k: 1, flip: false, p: 0, auto: true, yR: 150, yP: 390, shake: 0 };
  /** Multiply a label such as "CH4 + 2 O2" by k. */
  function scaleLabel(s, k) {
    if (k === 1) return s;
    return s.split(' + ').map((tok) => {
      const m = /^([½\d]+)\s+(.*)$/.exec(tok);
      const n = m ? (m[1] === '½' ? 0.5 : +m[1]) : 1;
      const name = m ? m[2] : tok;
      const v = n * k;
      const c = v === 1 ? '' : v === 0.5 ? '½ ' : v === 0.25 ? '¼ ' : v === 1.5 ? '3/2 ' : v + ' ';
      return c + name;
    }).join(' + ');
  }
  const coefTex = (n) => (n === 1 ? '' : Number.isInteger(n) ? String(n) : Number.isInteger(n * 2) ? `${n * 2}/2 ` : `${n * 4}/4 `);
  const sideTex = (o, k = 1) => Object.keys(o).map((s) => coefTex(o[s] * k) + s.replace('(graphite)', '(gr)').replace('(diamond)', '(dia)')).join(' + ');
  const wrapEq = (tex) => tex.replace(' -> ', ' ->}$ $\\ce{');
  const eqTex = (re, k = 1, flip = false) => `\\ce{${sideTex(flip ? re.p : re.r, k)} -> ${sideTex(flip ? re.r : re.p, k)}}`;
  function diaValues() {
    const D = DIA[dia.key];
    const base = dHof(D.re);
    const val = base * dia.k * (dia.flip ? -1 : 1);
    return { D, base, val, l: scaleLabel(dia.flip ? D.r : D.l, dia.k), r: scaleLabel(dia.flip ? D.l : D.r, dia.k) };
  }
  const diaStage = Lab.stage('#c-diagram', {
    h: 480,
    label: 'An energy diagram: two shelves joined by a curve with a hump, a ball moving along it, and an arrow showing the enthalpy change.',
    draw(g, t, dt) {
      const { val, l, r, base } = diaValues();
      if (dia.auto) {
        dia.p = Math.min(100, dia.p + dt * 26);
        const el = Lab.$('#dia-p'); el.value = dia.p; Lab.paintRange(el);
        if (dia.p >= 100) dia.auto = false;
      }
      const u = dia.p / 100;
      const scale = 120 / Math.abs(base);
      const d = Math.abs(val) * scale;
      const mid = 268;
      const tR = val < 0 ? mid - d / 2 : mid + d / 2, tP = val < 0 ? mid + d / 2 : mid - d / 2;
      dia.yR = lerp(dia.yR, tR, clamp(dt * 7)); dia.yP = lerp(dia.yP, tP, clamp(dt * 7));
      const yR = dia.yR, yP = dia.yP;
      const x0 = 76, x1 = 560;
      const top = Math.min(yR, yP);
      const A = (yR + yP) / 2 - (top - 58);
      const yC = (w) => {
        const v = clamp((w - 0.24) / 0.52);
        return lerp(yR, yP, smooth(v)) - A * Math.pow(Math.sin(Math.PI * v), 2);
      };
      const xC = (w) => lerp(x0, x1, w);
      yAxis(g, 50, 452, 58, 'Enthalpy, H');
      Art.arrow(g, 50, 452, 580, 452, { color: C.ink, w: 3.5, head: 12 });
      Art.text(g, 'Reaction progress', 315, 470, { size: 21, color: C.dim });
      // Path, thick and glowing.
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(178,141,255,.28)'; g.lineWidth = 16;
      g.beginPath(); for (let i = 0; i <= 80; i++) { const w = i / 80; if (i) g.lineTo(xC(w), yC(w)); else g.moveTo(xC(w), yC(w)); } g.stroke();
      g.strokeStyle = C.violet; g.lineWidth = 6;
      g.beginPath(); for (let i = 0; i <= 80; i++) { const w = i / 80; if (i) g.lineTo(xC(w), yC(w)); else g.moveTo(xC(w), yC(w)); } g.stroke();
      // Labels on the shelves.
      const lblR = yR <= yP ? yR - 34 : yR + 34, lblP = yP < yR ? yP - 34 : yP + 34;
      fml(g, l, 168, lblR, { size: 27, halo: true });
      fml(g, r, 472, lblP, { size: 27, halo: true });
      // Guides and the arrow.
      const ax = 598;
      g.strokeStyle = 'rgba(255,255,255,.42)'; g.lineWidth = 2.5; g.setLineDash([8, 8]);
      g.beginPath(); g.moveTo(170, yR); g.lineTo(ax + 16, yR); g.moveTo(xC(0.9), yP); g.lineTo(ax + 16, yP); g.stroke(); g.setLineDash([]);
      deltaArrow(g, ax, yR, yP, { w: 11, head: 26 });
      // The ball.
      const bx = xC(u), by = yC(u);
      const falling = (val < 0 && u > 0.5) || (val > 0 && u < 0.5 && u > 0.1);
      if (u > 0.08) {
        for (let i = 0; i < 7; i++) {
          const ph = (t * 0.7 + i / 7) % 1, a = (i / 7) * TAU + 0.3;
          const rr = val < 0 ? 28 + ph * 110 : 138 - ph * 110;
          const on = val < 0 ? seg(u, 0.5, 0.65) * (1 - seg(u, 0.92, 1) * 0.7) : seg(u, 0.1, 0.25) * (1 - seg(u, 0.5, 0.75));
          packet(g, bx + Math.cos(a) * rr, by + Math.sin(a) * rr * 0.75, 8, on * (val < 0 ? 1 - ph : ph));
        }
      }
      Art.glow(g, bx, by - 22, 46, C.sun, 0.3);
      Art.ball(g, bx, by - 24, 24, C.sun);
      Art.face(g, bx, by - 24, 24, falling ? 'grin' : (u > 0.3 && u < 0.5 ? 'wow' : 'happy'), { t, look: [val < 0 ? 1 : 0.6, 0.2] });
      // The readout.
      const X = 700;
      const exo = val < 0;
      Art.text(g, 'ΔH', X, 66, { font: 'display', size: 28, color: C.dim });
      Art.text(g, kj(val) + ' kJ', X, 108, { font: 'display', size: 34, color: C.sun, maxW: 186 });
      Art.pill(g, exo ? 'Exothermic' : 'Endothermic', X, 160, { size: 24, color: exo ? EXO : ENDO, text: '#1A0F2E', maxW: 180 });
      if (exo) heatArrow(g, 622, 226, 780, 226, t, { w: 20 });
      else heatArrow(g, 780, 226, 622, 226, t, { w: 20 });
      Art.text(g, exo ? 'Heat leaves' : 'Heat enters', X, 268, { size: 24, color: EXO });
      Art.text(g, exo ? 'Products lower' : 'Products higher', X, 308, { size: 22, maxW: 186 });
      Art.text(g, 'not to scale', X, 438, { size: 20, color: C.faint });
    },
  });
  void diaStage;
  function paintDia() {
    const { D, val } = diaValues();
    const dH = Math.abs(val).toFixed(1);
    const a = sideTex(dia.flip ? D.re.p : D.re.r, dia.k), b = sideTex(dia.flip ? D.re.r : D.re.p, dia.k);
    const heatForm = val < 0 ? `\\ce{${a} -> ${b}} + ${dH}\\ \\text{kJ}` : `${dH}\\ \\text{kJ} + \\ce{${a} -> ${b}}`;
    const notes = [];
    if (dia.flip) notes.push('You reversed it, so the sign flipped.');
    if (dia.k !== 1) notes.push(`You multiplied it by ${dia.k === 0.5 ? 'one half' : dia.k}, so $\\Delta H$ was multiplied too.`);
    Lab.$('#dia-foot').innerHTML = Lab.texString(`<p>$${wrapEq(eqTex(D.re, dia.k, dia.flip))}$, $\\Delta H = ${texNum(val)}$ kJ</p>
      <p>You can also write heat as part of the equation: $${wrapEq(heatForm)}$</p>
      <p>${notes.join(' ')} The hump is the energy needed to get started. It sets how fast a reaction runs, but it has no effect on $\\Delta H$.</p>`);
  }
  Lab.segmented('#dia-rx', (v) => { dia.key = v; dia.flip = false; dia.p = 0; dia.auto = true; paintDia(); });
  Lab.segmented('#dia-k', (v) => { dia.k = +v; paintDia(); });
  Lab.$('#dia-flip').addEventListener('click', () => { dia.flip = !dia.flip; dia.p = 0; dia.auto = true; Lab.sound.pop(); paintDia(); });
  Lab.bind('#dia-p', null, null, (v) => { if (Math.abs(v - dia.p) > 0.5) dia.auto = false; dia.p = v; });
  dia.auto = true;
  paintDia();

  /* ---------- Story 2: Hess's law ---------- */
  const dC = HF['CO2(g)'], dCO = HF['CO(g)'], dStep2 = dC - dCO;
  Lab.story('#story-hess', {
    title: 'The route does not matter',
    scenes: [
      {
        say: 'Two trails go from camp to the summit. One is short and steep. The other stops at a hut. Either way, you end up the <b>same height</b> above camp.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          const sky = g.createLinearGradient(0, 0, 0, H);
          sky.addColorStop(0, '#2B3F7C'); sky.addColorStop(1, '#6E4E9A');
          g.fillStyle = sky; g.fillRect(0, 0, W, H);
          const ridge = (pts, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(W, H); g.closePath(); g.fill(); };
          ridge([[0, 330], [150, 280], [330, 200], [430, 70], [540, 190], [700, 300], [800, 340]], '#4B3A73');
          ridge([[0, 400], [800, 400]], '#2F5E46');
          g.fillStyle = '#F4F0FF'; g.beginPath(); g.moveTo(430, 70); g.lineTo(388, 124); g.lineTo(412, 116); g.lineTo(430, 132); g.lineTo(450, 114); g.lineTo(472, 124); g.closePath(); g.fill();
          const camp = [120, 388], hut = [612, 258], top = [430, 72];
          // Short trail.
          const trail = (a, b, curve, col, q) => Art.arrow(g, a[0], a[1], b[0], b[1], { color: col, w: 6, head: 16, curve, p: q, dash: [12, 9] });
          trail(camp, top, -28, C.sun, seg(p, 0.05, 0.4));
          trail(camp, hut, 30, C.cyan, seg(p, 0.4, 0.62));
          trail(hut, top, 20, C.cyan, seg(p, 0.62, 0.82));
          Art.pill(g, 'Short trail', 196, 208, { size: 24, color: C.sun, text: '#1A0F2E', alpha: seg(p, 0.2, 0.4) });
          Art.pill(g, 'Long trail', 668, 346, { size: 24, color: C.cyan, text: '#1A0F2E', alpha: seg(p, 0.5, 0.65) });
          // Camp, hut, flag.
          g.fillStyle = '#FF8A2B'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
          g.beginPath(); g.moveTo(camp[0] - 34, camp[1] + 8); g.lineTo(camp[0], camp[1] - 30); g.lineTo(camp[0] + 34, camp[1] + 8); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#C49A55'; g.fillRect(hut[0] - 22, hut[1] - 18, 44, 28); g.strokeRect(hut[0] - 22, hut[1] - 18, 44, 28);
          g.fillStyle = '#B5602A'; g.beginPath(); g.moveTo(hut[0] - 30, hut[1] - 18); g.lineTo(hut[0], hut[1] - 42); g.lineTo(hut[0] + 30, hut[1] - 18); g.closePath(); g.fill(); g.stroke();
          g.strokeStyle = '#F4F0FF'; g.lineWidth = 4; g.beginPath(); g.moveTo(top[0], top[1] + 4); g.lineTo(top[0], top[1] - 46); g.stroke();
          g.fillStyle = C.pink; g.beginPath(); g.moveTo(top[0], top[1] - 46); g.lineTo(top[0] + 36, top[1] - 34); g.lineTo(top[0], top[1] - 22); g.closePath(); g.fill();
          // Height gain arrow.
          g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2.5; g.setLineDash([8, 8]);
          g.beginPath(); g.moveTo(top[0] + 30, top[1]); g.lineTo(752, top[1]); g.moveTo(camp[0] + 40, camp[1]); g.lineTo(752, camp[1]); g.stroke(); g.setLineDash([]);
          const a = seg(p, 0.8, 0.96);
          Art.arrow(g, 738, camp[1], 738, top[1], { color: C.leaf, w: 8, head: 22, both: true, p: a });
          Art.text(g, 'Same height gain', 610, 112, { font: 'display', size: 28, color: C.leaf, alpha: a, halo: true });
          void t;
        },
      },
      {
        say: 'Burning carbon works the same way. Go straight to $\\ce{CO2}$, or stop at $\\ce{CO}$ on the way. Both routes drop the same total: <b>−393.5 kJ</b>.',
        dur: 4.2,
        draw(g, p, t) {
          const k = 0.72, y0 = 62;
          const y = (v) => y0 + -v * k;
          const Yt = y(0), Ym = y(dCO), Yb = y(dC);
          shelf(g, 60, 570, Yt); shelf(g, 380, 570, Ym, '#7E9CD9'); shelf(g, 60, 570, Yb, '#5EC48A');
          Art.formula(g, 'C(s) + O2(g)', 315, Yt - 22, { size: 28, halo: true });
          fml(g, 'CO(g) + ½ O2(g)', 582, Ym + 7, { size: 26, halo: true, align: 'left' });
          Art.formula(g, 'CO2(g)', 315, Yb + 40, { size: 28, halo: true });
          const q1 = ease.inOut(seg(p, 0.05, 0.35));
          deltaArrow(g, 200, Yt + 14, Yb - 2, { p: q1, w: 14, head: 30 });
          Art.text(g, kj(dC), 124, (Yt + Yb) / 2, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.25, 0.4), halo: true, maxW: 120 });
          Art.text(g, 'one step', 274, (Yt + Yb) / 2, { size: 25, alpha: seg(p, 0.25, 0.4), halo: true });
          const q2 = ease.inOut(seg(p, 0.42, 0.6)), q3 = ease.inOut(seg(p, 0.6, 0.78));
          deltaArrow(g, 440, Yt + 14, Ym - 2, { p: q2, w: 12, head: 24, color: C.cyan });
          deltaArrow(g, 440, Ym + 14, Yb - 2, { p: q3, w: 12, head: 26, color: C.cyan });
          Art.text(g, kj(dCO), 508, (Yt + Ym) / 2 + 2, { font: 'display', size: 28, color: C.cyan, alpha: seg(p, 0.5, 0.62), halo: true, maxW: 110 });
          Art.text(g, kj(dStep2), 508, (Ym + Yb) / 2, { font: 'display', size: 30, color: C.cyan, alpha: seg(p, 0.68, 0.8), halo: true, maxW: 110 });
          const a = seg(p, 0.84, 0.98);
          Art.text(g, kj(dCO) + ' + (' + kj(dStep2) + ') = ' + kj(dC) + ' kJ', 400, Yb + 80, { font: 'display', size: 30, color: C.leaf, alpha: a, halo: true, maxW: 700 });
          void t;
        },
      },
      {
        say: 'Now on paper. Write both steps and <b>add them</b>, like a sum. $\\ce{CO}$ is on both sides, so it <b>cancels</b>. The two halves of $\\ce{O2}$ combine. What is left is the overall reaction.',
        dur: 4.6,
        draw(g, p, t) {
          const size = 34, r1 = 92, r2 = 186, r3 = 316;
          const row = (toks, y) => toks.forEach(([s, x, c]) => fml(g, s, x, y, { size, color: c || C.ink, align: 'left' }));
          const a1 = seg(p, 0, 0.12), a2 = seg(p, 0.12, 0.24);
          g.save(); g.globalAlpha *= a1; row([['C(s)', 52], ['+', 134], ['½ O2(g)', 170], ['->', 322], ['CO(g)', 380]], r1); g.restore();
          g.save(); g.globalAlpha *= a2; row([['CO(g)', 52], ['+', 170], ['½ O2(g)', 206], ['->', 358], ['CO2(g)', 416]], r2); g.restore();
          Art.text(g, kj(dCO) + ' kJ', 760, r1, { font: 'display', size: 32, color: C.sun, align: 'right', alpha: a1 });
          Art.text(g, kj(dStep2) + ' kJ', 760, r2, { font: 'display', size: 32, color: C.sun, align: 'right', alpha: a2 });
          // Cross out CO on both sides.
          const st = seg(p, 0.32, 0.46);
          Art.strike(g, 372, r1 + 16, 476, r1 - 18, st, C.red, 6);
          Art.strike(g, 44, r2 + 16, 150, r2 - 18, seg(p, 0.42, 0.56), C.red, 6);
          if (st > 0) {
            Art.arrow(g, 424, r1 + 22, 110, r2 - 26, { color: C.red, w: 3.5, head: 12, curve: -18, dash: [7, 7], p: seg(p, 0.36, 0.5), alpha: 0.75 });
          }
          Art.burst(g, 424, r1, seg(p, 0.42, 0.62), { n: 12, r: 70 });
          Art.burst(g, 96, r2, seg(p, 0.52, 0.72), { n: 12, r: 70 });
          // Sum bar.
          const b = seg(p, 0.6, 0.72);
          g.fillStyle = Art.alpha(C.ink, 0.8 * b); g.fillRect(36, 240, 728 * b, 5);
          Art.text(g, '+', 18, 215, { font: 'display', size: 34, alpha: b });
          // The result.
          const c = seg(p, 0.72, 0.88);
          g.save(); g.globalAlpha *= c; row([['C(s)', 52], ['+', 134], ['O2(g)', 170], ['->', 322], ['CO2(g)', 380]], r3); g.restore();
          Art.text(g, kj(dC) + ' kJ', 760, r3, { font: 'display', size: 34, color: C.leaf, align: 'right', alpha: c });
          Art.text(g, '½ O₂ + ½ O₂ = O₂', 240, 372, { size: 25, color: C.dim, alpha: seg(p, 0.8, 0.95) });
          Art.text(g, 'Add the equations, add the ΔH', 400, 416, { font: 'display', size: 30, color: C.sun, alpha: seg(p, 0.88, 1) });
          void t;
        },
      },
      {
        say: 'That is the whole game, and it has three rules. <b>Flip</b> an equation and the sign flips. <b>Multiply</b> it and $\\Delta H$ multiplies. <b>Add</b> equations and the $\\Delta H$ values add.',
        dur: 3.6,
        draw(g, p, t) {
          const tile = (i, name, draw, sub) => {
            const x = 30 + i * 253, q = ease.back(seg(p, 0.05 + i * 0.25, 0.3 + i * 0.25));
            if (q <= 0) return;
            g.save(); g.translate(x + 120, 225); g.scale(q, q); g.translate(-x - 120, -225);
            g.fillStyle = 'rgba(255,255,255,.08)'; Art.round(g, x, 34, 240, 380, 24); g.fill();
            g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 3; g.stroke();
            Art.text(g, name, x + 120, 76, { font: 'display', size: 38, color: C.sun });
            draw(x + 120);
            Art.text(g, sub, x + 120, 370, { size: 25, maxW: 224 });
            g.restore();
          };
          const miniCard = (x, y, w, h, color, txt) => {
            g.fillStyle = Art.mix(color, '#1A0F2E', 0.55); g.strokeStyle = color; g.lineWidth = 3.5;
            Art.round(g, x - w / 2, y - h / 2, w, h, 13); g.fill(); g.stroke();
            Art.text(g, txt, x, y, { font: 'display', size: 28, color: '#fff' });
          };
          tile(0, 'Flip', (x) => {
            const q = (Math.sin(t * 1.2) + 1) / 2;
            const sx = Math.abs(Math.cos(q * Math.PI));
            g.save(); g.translate(x, 210); g.scale(Math.max(0.03, sx), 1);
            miniCard(0, 0, 168, 96, q < 0.5 ? EXO : ENDO, q < 0.5 ? '−100 kJ' : '+100 kJ');
            g.restore();
          }, 'sign flips');
          tile(1, 'Multiply', (x) => {
            miniCard(x, 160, 150, 66, EXO, '−100 kJ');
            Art.text(g, '× 2', x, 214, { font: 'display', size: 30, color: C.ink });
            miniCard(x, 270, 180, 66, EXO, '−200 kJ');
          }, 'ΔH multiplies');
          tile(2, 'Add', (x) => {
            miniCard(x, 150, 150, 58, EXO, '−100 kJ');
            Art.text(g, '+', x, 196, { font: 'display', size: 30 });
            miniCard(x, 240, 150, 58, ENDO, '+30 kJ');
            g.fillStyle = C.ink; g.fillRect(x - 86, 278, 172, 4);
            Art.text(g, '−70 kJ', x, 314, { font: 'display', size: 32, color: C.leaf });
          }, 'ΔH adds');
        },
      },
    ],
  });

  /* ---------- Bench: the Hess's law puzzle ---------- */
  const FACTORS = [0.5, 1, 2, 3, 4];
  const facName = (k) => (k === 0.5 ? '½' : String(k));
  const coefStr = (n) => {
    if (Math.abs(n - 1) < 1e-9) return '';
    if (Number.isInteger(n)) return String(n);
    if (Math.abs(n - 0.5) < 1e-9) return '½';
    if (Math.abs(n - 0.25) < 1e-9) return '¼';
    if (Math.abs(n - 0.75) < 1e-9) return '¾';
    if (Number.isInteger(n * 2)) return `${n * 2}/2`;
    return `${n * 4}/4`;
  };
  const SUBS = '₀₁₂₃₄₅₆₇₈₉';
  const pretty = (s) => s.replace(/\(.*\)$/, '').replace(/\d/g, (d) => SUBS[+d]);
  function tokenWidth(g, tok, size) {
    let w = fw(g, tok.s, size);
    if (tok.c) {
      g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
      w += g.measureText(tok.c).width + size * 0.22;
    }
    return w;
  }
  function drawToken(g, tok, x, y, size, o = {}) {
    let cx = x;
    const color = o.color || C.ink;
    if (tok.c) {
      Art.text(g, tok.c, cx, y, { font: 'display', size, align: 'left', color, alpha: o.alpha });
      g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
      cx += g.measureText(tok.c).width + size * 0.22;
    }
    g.save();
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    Art.formula(g, tok.s, cx, y, { size, align: 'left', color });
    g.restore();
  }
  /** Lays out one equation centered in x0..x1, returning placed tokens. */
  function layoutEq(g, left, right, x0, x1, maxSize, minSize = 20) {
    let size = maxSize, total = 0;
    const measure = (s) => {
      let w = 0;
      left.concat(right).forEach((tk) => { w += tokenWidth(g, tk, s); });
      w += Math.max(0, left.length - 1) * s * 0.95 + Math.max(0, right.length - 1) * s * 0.95 + s * 1.9;
      return w;
    };
    total = measure(size);
    while (total > x1 - x0 && size > minSize) { size -= 1; total = measure(size); }
    let x = (x0 + x1) / 2 - total / 2;
    const placed = [];
    const put = (arr, sideName) => arr.forEach((tk, i) => {
      if (i) x += size * 0.95;
      const w = tokenWidth(g, tk, size);
      placed.push({ tk, x, w, side: sideName, plusBefore: i > 0 });
      x += w;
    });
    put(left, 'L');
    const arrowX = x + size * 0.3, arrowW = size * 1.3;
    x += size * 1.9;
    put(right, 'R');
    return { placed, size, arrowX, arrowW };
  }
  const hess = { level: 0, cards: [], moves: 0, won: false, wonAt: -9, hint: null, done: Lab.store.get('hess:done', {}), flash: 0, downAt: null };
  const P = () => PUZZLES[hess.level];
  const cardRe = (card) => {
    const re = {};
    const mult = (o) => { const t = {}; Object.keys(o).forEach((s) => { t[s] = o[s] * card.k; }); return t; };
    re.r = mult(card.flip ? card.c.p : card.c.r);
    re.p = mult(card.flip ? card.c.r : card.c.p);
    return re;
  };
  const cardDH = (card) => dHof(card.c) * card.k * (card.flip ? -1 : 1);
  const asTokens = (o) => Object.keys(o).map((s) => ({ s, n: o[s], c: coefStr(o[s]) }));
  function tally() {
    const L = {}, R = {};
    hess.cards.forEach((c) => {
      const re = cardRe(c);
      Object.keys(re.r).forEach((s) => { L[s] = (L[s] || 0) + re.r[s]; });
      Object.keys(re.p).forEach((s) => { R[s] = (R[s] || 0) + re.p[s]; });
    });
    return { L, R };
  }
  function netEq() {
    const { L, R } = tally();
    const left = {}, right = {};
    new Set(Object.keys(L).concat(Object.keys(R))).forEach((s) => {
      const d = (R[s] || 0) - (L[s] || 0);
      if (d > 1e-9) right[s] = d; else if (d < -1e-9) left[s] = -d;
    });
    return { left, right, L, R };
  }
  function isSolved() {
    const { left, right } = netEq();
    const g = P().goal;
    const same = (a, b) => { const k = Object.keys(a); return k.length === Object.keys(b).length && k.every((s) => Math.abs((a[s] || 0) - (b[s] || 0)) < 1e-9); };
    return same(left, g.r) && same(right, g.p);
  }
  function parMoves() { return P().sol.reduce((a, [f, k]) => a + (f ? 1 : 0) + (k !== 1 ? 1 : 0), 0); }
  function loadLevel(i) {
    hess.level = i;
    hess.cards = P().cards.map((c) => ({ c, flip: false, k: 1, flipAt: -9, kAt: -9, f: {}, burst: {} }));
    hess.moves = 0; hess.won = false; hess.hint = null; hess.wonAt = -9;
    buildHessControls();
    paintHess();
  }
  function buildHessControls() {
    const host = Lab.$('#hess-cards');
    host.innerHTML = hess.cards.map((c, i) => {
      const L = String.fromCharCode(65 + i);
      return `<div style="display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin-bottom:10px">
        <span style="font-family:var(--font-display);font-size:1.3rem;color:#FFD23F;width:1.2em">${L}</span>
        <button type="button" class="btn small cyan" data-flip="${i}" aria-pressed="${c.flip}">Flip card ${L}</button>
        <div class="seg" role="group" aria-label="Multiply card ${L} by">${FACTORS.map((k) => `<button type="button" data-card="${i}" data-k="${k}" aria-pressed="${k === c.k}" aria-label="Multiply card ${L} by ${facName(k)}">×${facName(k)}</button>`).join('')}</div>
      </div>`;
    }).join('');
    Lab.$$('[data-flip]', host).forEach((b) => b.addEventListener('click', () => flipCard(+b.dataset.flip)));
    Lab.$$('[data-k]', host).forEach((b) => b.addEventListener('click', () => setFactor(+b.dataset.card, +b.dataset.k)));
    const lv = Lab.$('#hess-level');
    Lab.$$('button', lv).forEach((b, i) => {
      b.setAttribute('aria-pressed', String(i === hess.level));
      b.textContent = (i + 1) + (hess.done[i] ? ' ✓' : '');
    });
    Lab.$('#hess-next').disabled = hess.level === PUZZLES.length - 1;
  }
  function flipCard(i) {
    if (hess.won) return;
    const c = hess.cards[i];
    c.flip = !c.flip; c.flipAt = hessStage.t; hess.moves++;
    Lab.sound.pop();
    const b = Lab.$(`[data-flip="${i}"]`);
    if (b) b.setAttribute('aria-pressed', String(c.flip));
    winCheck(); paintHess();
  }
  function setFactor(i, k) {
    if (hess.won) return;
    const c = hess.cards[i];
    if (c.k === k) return;
    c.k = k; c.kAt = hessStage.t; hess.moves++;
    Lab.sound.pop();
    Lab.$$(`[data-card="${i}"]`).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.k === k)));
    winCheck(); paintHess();
  }
  function winCheck() {
    if (!hess.won && isSolved()) {
      hess.won = true; hess.wonAt = hessStage.t;
      Lab.sound.fanfare();
      if (!hess.done[hess.level]) {
        hess.done[hess.level] = true;
        Lab.store.set('hess:done', hess.done);
        Lab.collection.award(1);
      }
      Lab.confetti(70);
      buildHessControls();
    }
  }
  function paintHess() {
    const foot = Lab.$('#hess-foot');
    const name = P().name;
    if (hess.won) {
      const vals = hess.cards.map(cardDH);
      const total = vals.reduce((a, b) => a + b, 0);
      const lines = hess.cards.map((c, i) => {
        const re = cardRe(c);
        return `<p style="margin:0 0 .3em">${String.fromCharCode(65 + i)}: $${wrapEq(eqTex(re))}$ <b>${kj(vals[i])} kJ</b></p>`;
      }).join('');
      foot.innerHTML = Lab.texString(`<p><b>Solved: ${name}.</b></p>${lines}<p>Everything else cancels, leaving $${wrapEq(eqTex(P().goal))}$, and $\\Delta H = ${vals.map((v, i) => (i === 0 ? texNum(v) : v < 0 ? `- ${Math.abs(v).toFixed(1)}` : `+ ${v.toFixed(1)}`)).join(' ')} = ${texNum(total)}$ kJ.</p>`);
    } else if (hess.hint !== null) {
      const L = String.fromCharCode(65 + hess.hint);
      foot.innerHTML = Lab.texString(`<p><b>Hint for card ${L}.</b> ${P().hints[hess.hint]}</p>`);
    } else {
      foot.innerHTML = Lab.texString(`<p><b>Puzzle ${hess.level + 1}: ${name}.</b> Tap a card to flip it, or use the buttons. Multiply a card with the number buttons. The goal is at the top. Par is ${parMoves()} ${parMoves() === 1 ? 'move' : 'moves'}.</p>`);
    }
  }
  function nextHint() {
    const sol = P().sol;
    const i = hess.cards.findIndex((c, k) => c.flip !== sol[k][0] || Math.abs(c.k - sol[k][1]) > 1e-9);
    hess.hint = i >= 0 ? i : 0;
    paintHess();
  }
  const hessStage = Lab.stage('#c-hess', {
    h: 576,
    label: "A goal equation on top, reaction cards below, and the leftover equation at the bottom. Species on opposite sides are crossed out.",
    onPointer(e) {
      if (e.type === 'hover') {
        const hit = hessRows().some((r) => e.y >= r.y && e.y <= r.y + r.h);
        hessStage.canvas.style.cursor = hit && !hess.won ? 'pointer' : 'default';
        return;
      }
      if (e.type === 'down') { hess.downAt = { x: e.x, y: e.y }; return; }
      if (e.type === 'up') {
        const d = hess.downAt; hess.downAt = null;
        if (!d || (e.raw && e.raw.type === 'pointercancel')) return;
        if (Math.hypot(e.x - d.x, e.y - d.y) > 14) return;
        const i = hessRows().findIndex((r) => e.y >= r.y && e.y <= r.y + r.h);
        if (i >= 0) flipCard(i);
      }
    },
    draw(g, t, dt) {
      if (!hess.cards.length) return;
      const W = 800;
      const n = hess.cards.length;
      const rows = hessRows();
      const goal = P().goal;
      const net = netEq();
      const { L, R } = net;
      // Goal plate.
      const wonQ = hess.won ? ease.out(clamp((t - hess.wonAt) / 0.6)) : 0;
      g.fillStyle = Art.mix('#4A3200', '#1E5A3A', wonQ); g.strokeStyle = hess.won ? C.leaf : C.sun; g.lineWidth = 4;
      Art.round(g, 14, 10, W - 28, 74, 18); g.fill(); g.stroke();
      Art.text(g, 'Goal', 54, 47, { font: 'display', size: 28, color: hess.won ? C.leaf : C.sun });
      const goalL = asTokens(goal.r), goalR = asTokens(goal.p);
      const gl = layoutEq(g, goalL, goalR, 92, 626, 28);
      const matched = (tk, side) => { const set = side === 'L' ? net.left : net.right; return Math.abs((set[tk.s] || 0) - tk.n) < 1e-9; };
      gl.placed.forEach((pl, i) => {
        if (pl.plusBefore) Art.text(g, '+', pl.x - gl.size * 0.48, 47, { font: 'display', size: gl.size * 0.85, color: C.ink });
        const ok = matched(pl.tk, pl.side);
        drawToken(g, pl.tk, pl.x, 47, gl.size, { color: ok ? '#7CF0AE' : C.ink });
        void i;
      });
      Art.arrow(g, gl.arrowX, 47, gl.arrowX + gl.arrowW, 47, { color: C.ink, w: 4, head: 11 });
      const total = hess.cards.reduce((a, c) => a + cardDH(c), 0);
      const goalDH = dHof(goal);
      Art.text(g, hess.won ? kj(goalDH) + ' kJ' : 'ΔH = ?', 708, 47, { font: 'display', size: hess.won ? 27 + Math.sin(clamp((t - hess.wonAt) * 3) * Math.PI) * 6 : 28, color: hess.won ? '#7CF0AE' : C.sun, maxW: 140 });

      // Cards. First compute how much of each species cancels.
      const cancelled = {};
      Object.keys(L).forEach((s) => { if (R[s]) cancelled[s] = Math.min(L[s], R[s]); });
      const placedAll = [];
      hess.cards.forEach((c, i) => {
        const row = rows[i];
        const age = t - c.flipAt;
        const fq = clamp(age / 0.5);
        const midShown = fq < 0.5;
        const shownFlip = midShown && age < 0.5 ? !c.flip : c.flip;
        const sx = age < 0.5 ? Math.max(0.03, Math.abs(Math.cos(fq * Math.PI))) : 1;
        const col = shownFlip ? C.pink : 'rgba(255,255,255,.28)';
        const yMid = row.y + row.h / 2;
        g.save();
        g.translate(W / 2, yMid); g.scale(sx, 1); g.translate(-W / 2, -yMid);
        const f = g.createLinearGradient(0, row.y, 0, row.y + row.h);
        f.addColorStop(0, '#463074'); f.addColorStop(1, '#2C1B4D');
        g.fillStyle = f; g.strokeStyle = col; g.lineWidth = shownFlip ? 4 : 3;
        Art.round(g, 14, row.y, W - 28, row.h, 16); g.fill(); g.stroke();
        Art.text(g, String.fromCharCode(65 + i), 44, yMid - (c.k !== 1 || shownFlip ? 14 : 0), { font: 'display', size: 30, color: C.sun });
        const tag = (shownFlip ? '⇄ ' : '') + (c.k !== 1 ? '×' + facName(c.k) : '');
        if (tag) Art.text(g, tag, 44, yMid + 19, { font: 'body', size: 21, color: shownFlip ? '#FF8AC4' : C.ink, maxW: 58 });
        const re = shownFlip === c.flip ? cardRe(c) : { r: mapK(shownFlip ? c.c.p : c.c.r, c.k), p: mapK(shownFlip ? c.c.r : c.c.p, c.k) };
        const toksL = asTokens(re.r), toksR = asTokens(re.p);
        const pop = 1 + 0.16 * Math.max(0, 1 - (t - c.kAt) / 0.3);
        const lay = layoutEq(g, toksL, toksR, 80, 638, 26);
        lay.placed.forEach((pl) => {
          const key = pl.side + pl.tk.s;
          const tot = pl.side === 'L' ? (L[pl.tk.s] || 0) : (R[pl.tk.s] || 0);
          const targetF = sx >= 1 ? ((cancelled[pl.tk.s] || 0) / Math.max(1e-9, tot)) : 0;
          const prevF = c.f[key] || 0;
          c.f[key] = lerp(prevF, targetF, clamp(dt * 7));
          if (targetF > 0.995 && prevF <= 0.97 && c.f[key] > 0.9) c.burst[key] = t;
          const cf = c.f[key];
          if (pl.plusBefore) Art.text(g, '+', pl.x - lay.size * 0.48, yMid, { font: 'display', size: lay.size * 0.85, color: C.ink, alpha: 0.85 });
          g.save();
          if (pop > 1.001) { const cx = pl.x + pl.w / 2; g.translate(cx, yMid); g.scale(pop, pop); g.translate(-cx, -yMid); }
          drawToken(g, pl.tk, pl.x, yMid, lay.size, { alpha: lerp(1, 0.42, cf), color: cf > 0.5 ? '#D9CFEF' : C.ink });
          g.restore();
          if (cf > 0.01) Art.strike(g, pl.x - 5, yMid + 15, pl.x - 5 + (pl.w + 10) * cf, yMid + 15 - 30 * cf, 1, C.red, 5);
          if (sx >= 1) placedAll.push({ s: pl.tk.s, side: pl.side, cx: pl.x + pl.w / 2, y: yMid, cf, row: i });
          const b = c.burst[key];
          if (b !== undefined) Art.burst(g, pl.x + pl.w / 2, yMid, clamp((t - b) / 0.7), { n: 10, r: 56, size: 6, seed: i });
        });
        Art.arrow(g, lay.arrowX, yMid, lay.arrowX + lay.arrowW, yMid, { color: C.ink, w: 4, head: 11 });
        // Delta H chip.
        const v = cardDH(c);
        const shownV = shownFlip === c.flip ? v : -v;
        const exo = shownV < 0;
        g.fillStyle = exo ? EXO : ENDO;
        Art.round(g, 652, yMid - 23, 124, 46, 14); g.fill();
        Art.text(g, kj(shownV) + ' kJ', 714, yMid + 1, { font: 'display', size: 26 * pop > 30 ? 30 : 26 * pop, color: '#1A0F2E', maxW: 112 });
        g.restore();
      });
      // Faint arcs join the things that cancel.
      Object.keys(cancelled).forEach((s) => {
        const a = placedAll.find((q) => q.s === s && q.side === 'L');
        const b = placedAll.find((q) => q.s === s && q.side === 'R');
        if (!a || !b) return;
        const show = Math.min(a.cf, b.cf);
        if (show < 0.05) return;
        g.save(); g.globalAlpha *= 0.45 * show;
        g.strokeStyle = C.red; g.lineWidth = 2.5; g.setLineDash([6, 7]);
        const my = (a.y + b.y) / 2 + 2, mx = (a.cx + b.cx) / 2 + (a.row === b.row ? 0 : 20);
        g.beginPath(); g.moveTo(a.cx, a.y + (b.y > a.y ? 18 : -18)); g.quadraticCurveTo(mx, my, b.cx, b.y + (b.y > a.y ? -18 : 18)); g.stroke();
        g.restore();
      });
      // The sum line.
      const sumY = 411;
      g.fillStyle = C.ink; g.fillRect(14, sumY, W - 28, 4);
      // What is left.
      const netY = sumY + 42;
      Art.text(g, 'Left', 54, netY, { font: 'display', size: 26, color: C.dim });
      const nl = asTokens(net.left), nr = asTokens(net.right);
      if (nl.length + nr.length === 0) {
        Art.text(g, 'Everything cancels', 360, netY, { size: 25, color: C.dim });
      } else {
        const ll = layoutEq(g, nl, nr, 92, 626, 26);
        ll.placed.forEach((pl) => {
          if (pl.plusBefore) Art.text(g, '+', pl.x - ll.size * 0.48, netY, { font: 'display', size: ll.size * 0.85, color: C.ink });
          const good = matchesGoalSide(pl.tk, pl.side);
          drawToken(g, pl.tk, pl.x, netY, ll.size, { color: good ? '#7CF0AE' : '#FFB48F' });
        });
        Art.arrow(g, ll.arrowX, netY, ll.arrowX + ll.arrowW, netY, { color: C.ink, w: 4, head: 11 });
      }
      Art.text(g, kj(total) + ' kJ', 708, netY, { font: 'display', size: 28, color: hess.won ? '#7CF0AE' : C.sun, maxW: 140 });
      // Status and stars.
      const stY = netY + 46;
      if (hess.won) {
        const par = parMoves();
        const stars = hess.moves <= par ? 3 : hess.moves <= par + 2 ? 2 : 1;
        for (let i = 0; i < 3; i++) {
          const q = ease.back(clamp((t - hess.wonAt - 0.2 - i * 0.18) * 3));
          if (q <= 0) continue;
          g.save(); g.translate(330 + i * 70, stY + 14); g.scale(q, q);
          g.fillStyle = i < stars ? C.sun : 'rgba(255,255,255,.18)';
          g.beginPath();
          for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k / 10) * TAU, rr = k % 2 ? 13 : 30; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
          g.closePath(); g.fill(); g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.stroke();
          g.restore();
        }
        Art.text(g, 'Solved in ' + hess.moves + ' ' + (hess.moves === 1 ? 'move' : 'moves'), 150, stY + 14, { size: 25, color: C.leaf });
        Art.moe(g, 690, stY + 54, 96, 'cheer', { t, bob: false });
      } else {
        const extra = Object.keys(net.left).concat(Object.keys(net.right)).filter((s) => !(s in goal.r) && !(s in goal.p));
        const msg = extra.length ? 'Still extra: ' + [...new Set(extra)].map(pretty).slice(0, 4).join(', ') : 'Right species. Now get the amounts right';
        Art.text(g, msg, 400, stY + 6, { size: 25, color: '#FFB48F', maxW: 720 });
        Art.text(g, 'Moves: ' + hess.moves + '   Par: ' + parMoves(), 400, stY + 42, { size: 22, color: C.dim });
      }
    },
  });
  function mapK(o, k) { const t = {}; Object.keys(o).forEach((s) => { t[s] = o[s] * k; }); return t; }
  function matchesGoalSide(tk, side) { const g = side === 'L' ? P().goal.r : P().goal.p; return Math.abs((g[tk.s] || 0) - tk.n) < 1e-9; }
  function hessRows() {
    const n = hess.cards.length;
    const h = 78, top = 96, room = 300;
    const gap = n >= 3 ? (room - n * h) / (n - 1) : 26;
    const y0 = n >= 3 ? top : top + (room - (n * h + gap)) / 2;
    return hess.cards.map((_, i) => ({ y: y0 + i * (h + gap), h }));
  }
  (function initHess() {
    const lv = Lab.$('#hess-level');
    lv.innerHTML = PUZZLES.map((_, i) => `<button type="button" data-value="${i}" aria-pressed="${i === 0}" aria-label="Puzzle ${i + 1}">${i + 1}</button>`).join('');
    Lab.segmented(lv, (v) => loadLevel(+v));
    Lab.$('#hess-hint').addEventListener('click', nextHint);
    Lab.$('#hess-reset').addEventListener('click', () => loadLevel(hess.level));
    Lab.$('#hess-next').addEventListener('click', () => { if (hess.level < PUZZLES.length - 1) loadLevel(hess.level + 1); });
    loadLevel(0);
  })();

  /* ---------- Bench: formation enthalpy calculator ---------- */
  const HFRX = { ch4: COMB[0][3], c3h8: COMB[1][3], etoh: COMB[2][3], nh3: OTHER[2], thermite: OTHER[3], lime: OTHER[0] };
  const SPECIES = Object.keys(HF).filter((s) => s !== 'C(graphite)');
  const own = { rows: [[1, 'CH4(g)'], [2, 'O2(g)'], [1, 'CO2(g)'], [2, 'H2O(l)']] };
  const hfs = { key: 'ch4', mode: 'right', t0: 0 };
  function currentRx() {
    if (hfs.key !== 'own') return HFRX[hfs.key];
    const r = {}, p = {};
    own.rows.forEach(([n, s], i) => { if (n > 0) { const side = i < 2 ? r : p; side[s] = (side[s] || 0) + n; } });
    return { r, p };
  }
  function balance(re) {
    const count = (side) => {
      const t = {};
      Object.keys(side).forEach((s) => {
        const c = Bank.countAtoms(s.replace(/\(.*\)$/, ''));
        Object.keys(c).forEach((e) => { t[e] = (t[e] || 0) + c[e] * side[s]; });
      });
      return t;
    };
    const a = count(re.r), b = count(re.p);
    const bad = [];
    new Set(Object.keys(a).concat(Object.keys(b))).forEach((e) => { if (Math.abs((a[e] || 0) - (b[e] || 0)) > 1e-9) bad.push(`${e}: ${a[e] || 0} on the left and ${b[e] || 0} on the right`); });
    return bad;
  }
  function hfModel() {
    const re = currentRx();
    const items = (side) => Object.keys(side).map((s) => ({ s, n: side[s], hf: HF[s], v: side[s] * HF[s], v1: HF[s] }));
    const a = items(re.r), b = items(re.p);
    const sum = (l, key) => l.reduce((x, it) => x + it[key], 0);
    const right = sum(b, 'v') - sum(a, 'v');
    const noCoef = sum(b, 'v1') - sum(a, 'v1');
    const bad = balance(re);
    return { re, a, b, right, noCoef, bad, empty: !a.length || !b.length };
  }
  const hfStage = Lab.stage('#c-hf', {
    h: 560,
    label: 'Two waterfalls of blocks hanging from a zero line, one for reactants and one for products. An arrow between their ends shows the enthalpy change.',
    draw(g, t) {
      const m = hfModel();
      const key = hfs.mode === 'coef' ? 'v1' : 'v';
      const prog = clamp((t - hfs.t0) / 1.4);
      const W = 800, H = 560;
      // Scale.
      const waterfall = (list) => {
        let cum = 0;
        return list.map((it) => { const from = cum; cum += it[key]; return { ...it, from, to: cum }; });
      };
      const A = waterfall(m.a), Bb = waterfall(m.b);
      const levels = [0].concat(A.map((x) => x.to), Bb.map((x) => x.to));
      const hi = Math.max(...levels), lo = Math.min(...levels);
      const span = Math.max(hi - lo, 1);
      const topM = 92, botM = 40;
      const k = (H - topM - botM) / span;
      const yV = (v) => topM + (hi - v) * k;
      const y0 = yV(0);
      // Sky above zero, ground below, so sea level reads as sea level.
      g.fillStyle = 'rgba(70,185,240,.07)'; g.fillRect(0, y0, W, H - y0);
      Art.text(g, 'Reactants', 230, 28, { font: 'display', size: 32, color: C.violet });
      Art.text(g, 'Products', 570, 28, { font: 'display', size: 32, color: C.leaf });
      g.strokeStyle = C.ink; g.lineWidth = 3.5; g.setLineDash([12, 9]);
      g.beginPath(); g.moveTo(16, y0); g.lineTo(W - 16, y0); g.stroke(); g.setLineDash([]);
      Art.pill(g, 'Elements: 0', 400, Math.max(30, y0 - 22), { size: 22, color: C.sun, text: '#1A0F2E' });
      const col = (list, X, labelSide, color) => {
        let lastLabelY = -99;
        const n = Math.max(1, list.length);
        list.forEach((it, i) => {
          const q = ease.out(seg(prog, (i / n) * 0.7, ((i + 1) / n) * 0.7));
          const y1 = yV(it.from), y2 = yV(it.from + (it.to - it.from) * q);
          const top = Math.min(y1, y2), hh = Math.abs(y2 - y1);
          if (hh > 0.5) {
            const gr = g.createLinearGradient(X - 70, 0, X + 70, 0);
            gr.addColorStop(0, Art.mix(color, '#ffffff', 0.2)); gr.addColorStop(1, Art.mix(color, '#12062A', 0.25));
            g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
            Art.round(g, X - 66, top, 132, Math.max(3, hh), Math.min(8, hh / 2)); g.fill(); g.stroke();
          }
          const cy = Math.max((yV(it.from) + yV(it.to)) / 2, lastLabelY + 56, it.from <= 0 && it.to <= 0 ? y0 + 34 : -99);
          lastLabelY = cy;
          const nShow = hfs.mode === 'coef' ? 1 : it.n;
          const str = (nShow === 1 ? '' : coefStr(nShow) + ' ') + it.s;
          const LX = labelSide < 0 ? X - 80 : X + 80;
          const al = labelSide < 0 ? 'right' : 'left';
          fml(g, str, LX, cy - 13, { size: 23, align: al, halo: true });
          Art.text(g, it.hf === 0 ? '0 kJ' : kj(it[key]) + ' kJ', LX, cy + 15, { size: 22, align: al, color: it.hf === 0 ? C.dim : C.sun, halo: true });
        });
      };
      col(A, 230, -1, C.violet);
      col(Bb, 570, 1, C.leaf);
      if (m.empty) return;
      const sumA = A.length ? A[A.length - 1].to : 0, sumB = Bb.length ? Bb[Bb.length - 1].to : 0;
      const yA = yV(sumA), yB = yV(sumB);
      const q = ease.inOut(seg(prog, 0.72, 0.98));
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2.5; g.setLineDash([8, 8]);
      g.beginPath(); g.moveTo(296, yA); g.lineTo(lerp(296, 412, q), yA); g.moveTo(504, yB); g.lineTo(lerp(504, 388, q), yB); g.stroke(); g.setLineDash([]);
      if (m.bad.length) {
        Art.pill(g, 'Not balanced yet', 400, H - 40, { size: 28, color: C.red, text: '#fff' });
        return;
      }
      const wrong = hfs.mode !== 'right';
      const ans = hfs.mode === 'coef' ? m.noCoef : hfs.mode === 'back' ? -m.right : m.right;
      const from = hfs.mode === 'back' ? yB : yA, to = hfs.mode === 'back' ? yA : yB;
      const color = wrong ? C.red : C.sun;
      const midY = Math.abs(yA - yB) < 110 ? clamp(Math.min(yA, yB) - 52, 60, H - 60) : clamp((yA + yB) / 2, 90, H - 90);
      if (Math.abs(to - from) > 4) deltaArrow(g, 400, from, to, { p: q, w: 12, head: 28, color });
      const a = seg(prog, 0.85, 1);
      g.save(); g.globalAlpha *= a;
      g.fillStyle = wrong ? '#4A1020' : '#3B2763'; g.strokeStyle = color; g.lineWidth = 3;
      Art.round(g, 306, midY - 38, 188, 76, 16); g.fill(); g.stroke();
      Art.text(g, wrong ? 'Wrong' : 'ΔH°', 400, midY - 16, { size: 23, color: wrong ? C.red : C.dim });
      Art.text(g, kj(ans) + ' kJ', 400, midY + 15, { font: 'display', size: 28, color, maxW: 172 });
      g.restore();
    },
  });
  function paintHf() {
    const m = hfModel();
    const foot = Lab.$('#hf-foot');
    if (m.empty) { foot.innerHTML = '<p>Give each side at least one substance.</p>'; return; }
    if (m.bad.length) { foot.innerHTML = Lab.texString(`<p><b>Balance it first.</b> ${m.bad.join('. ')}. Adjust the coefficients until both sides match.</p>`); return; }
    const term = (l) => l.map((it) => `${it.n}(${it.hf === 0 ? '0' : texNum(it.hf)})`).join(' + ');
    const sum = (l) => l.reduce((a, x) => a + x.v, 0);
    let h = `<p>$${wrapEq(eqTex(m.re))}$</p>
      <div class="calc-line">$$\\text{Products: } ${term(m.b)} = ${sum(m.b) === 0 ? '0' : texNum(sum(m.b))}$$</div>
      <div class="calc-line">$$\\text{Reactants: } ${term(m.a)} = ${sum(m.a) === 0 ? '0' : texNum(sum(m.a))}$$</div>
      <div class="calc-line">$$\\Delta H^\\circ = (${sum(m.b) === 0 ? '0' : texNum(sum(m.b))}) - (${sum(m.a) === 0 ? '0' : texNum(sum(m.a))}) = ${texNum(m.right)}\\ \\text{kJ}$$</div>`;
    if (hfs.mode === 'coef') h += `<p><b>Forgetting the coefficients</b> gives ${kj(m.noCoef)} kJ, which is wrong. The stacks are too short because each substance is counted only once.</p>`;
    else if (hfs.mode === 'back') h += `<p><b>Reactants minus products</b> gives ${kj(-m.right)} kJ, which has the wrong sign. ${m.right < 0 ? 'Burning fuel would have to cool the room. It does not.' : 'This would make the reaction release heat, when it really absorbs heat.'}</p>`;
    else h += `<p>${m.right < 0 ? 'Products sit lower than reactants, so heat is released.' : 'Products sit higher than reactants, so heat is absorbed.'} Elements in their standard states add nothing to the stack.</p>`;
    foot.innerHTML = Lab.texString(h);
  }
  function buildOwn() {
    const host = Lab.$('#hf-own');
    const opts = (sel) => SPECIES.map((s) => `<option value="${s}"${s === sel ? ' selected' : ''}>${pretty(s)}${s.slice(s.indexOf('('))}  (${HF[s] === 0 ? '0' : kj(HF[s])})</option>`).join('');
    const row = (i, label) => `<div style="display:grid;grid-template-columns:70px 1fr;gap:8px;align-items:center;margin-bottom:6px"><input type="number" min="0" max="12" step="1" value="${own.rows[i][0]}" data-n="${i}" aria-label="Coefficient for ${label}"><select data-s="${i}" aria-label="${label}">${opts(own.rows[i][1])}</select></div>`;
    host.innerHTML = `<div style="display:grid;gap:10px 22px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
      <div><span class="ctl-label">Reactants</span>${row(0, 'first reactant')}${row(1, 'second reactant')}</div>
      <div><span class="ctl-label">Products</span>${row(2, 'first product')}${row(3, 'second product')}</div></div>
      <p class="ctl-help">Pick a coefficient of 0 to leave a substance out.</p>`;
    Lab.$$('[data-n]', host).forEach((el) => el.addEventListener('input', () => { own.rows[+el.dataset.n][0] = clamp(Math.round(+el.value || 0), 0, 12); hfs.t0 = hfStage.t; paintHf(); }));
    Lab.$$('[data-s]', host).forEach((el) => el.addEventListener('change', () => { own.rows[+el.dataset.s][1] = el.value; hfs.t0 = hfStage.t; paintHf(); }));
  }
  Lab.segmented('#hf-rx', (v) => { hfs.key = v; Lab.$('#hf-own').hidden = v !== 'own'; hfs.t0 = hfStage.t; paintHf(); });
  Lab.segmented('#hf-mode', (v) => { hfs.mode = v; hfs.t0 = hfStage.t - 0.6; paintHf(); });
  buildOwn();
  paintHf();

  /* ---------- The break and make engine ---------- */
  const RAD = { H: 19, C: 27, N: 25, O: 25, Cl: 30 };
  /* Each atom: [symbol, start x, y, free x, y, end x, y]. Heights mean energy: atoms climb as bonds break, then fall as bonds form. */
  const BR = {
    hcl: {
      name: 'H₂ + Cl₂', tex: '\\ce{H2(g) + Cl2(g) -> 2HCl(g)}',
      re: rx({ 'H2(g)': 1, 'Cl2(g)': 1 }, { 'HCl(g)': 2 }),
      big: 1.5,
      atoms: [['H', 110, 240, 80, 112, 86, 374], ['H', 190, 240, 214, 112, 320, 374], ['Cl', 320, 240, 350, 104, 180, 368], ['Cl', 442, 240, 484, 104, 414, 368]],
      brk: [[0, 1, 1, 'H–H'], [2, 3, 1, 'Cl–Cl']], mk: [[0, 2, 1, 'H–Cl'], [1, 3, 1, 'H–Cl']],
    },
    h2o: {
      name: '2H₂ + O₂', tex: '\\ce{2H2(g) + O2(g) -> 2H2O(g)}',
      re: rx({ 'H2(g)': 2, 'O2(g)': 1 }, { 'H2O(g)': 2 }),
      atoms: [['H', 70, 210, 60, 80, 76, 386], ['H', 134, 210, 150, 110, 188, 386], ['H', 70, 280, 240, 80, 310, 386], ['H', 134, 280, 330, 110, 424, 386], ['O', 300, 240, 420, 80, 132, 346], ['O', 390, 240, 500, 110, 368, 346]],
      brk: [[0, 1, 1, 'H–H'], [2, 3, 1, 'H–H'], [4, 5, 2, 'O=O']], mk: [[4, 0, 1, 'O–H'], [4, 1, 1, 'O–H'], [5, 2, 1, 'O–H'], [5, 3, 1, 'O–H']],
    },
    nh3: {
      name: 'N₂ + 3H₂', tex: '\\ce{N2(g) + 3H2(g) -> 2NH3(g)}',
      re: rx({ 'N2(g)': 1, 'H2(g)': 3 }, { 'NH3(g)': 2 }),
      atoms: [['N', 60, 230, 50, 110, 136, 345], ['N', 138, 230, 120, 76, 386, 345], ['H', 240, 200, 190, 110, 70, 382], ['H', 300, 200, 250, 76, 136, 402], ['H', 240, 250, 310, 110, 202, 382], ['H', 300, 250, 370, 76, 320, 382], ['H', 400, 225, 430, 110, 386, 402], ['H', 460, 225, 490, 76, 452, 382]],
      brk: [[0, 1, 3, 'N≡N'], [2, 3, 1, 'H–H'], [4, 5, 1, 'H–H'], [6, 7, 1, 'H–H']], mk: [[0, 2, 1, 'N–H'], [0, 3, 1, 'N–H'], [0, 4, 1, 'N–H'], [1, 5, 1, 'N–H'], [1, 6, 1, 'N–H'], [1, 7, 1, 'N–H']],
    },
    ch4: {
      name: 'CH₄ + 2O₂', tex: '\\ce{CH4(g) + 2O2(g) -> CO2(g) + 2H2O(g)}',
      re: rx({ 'CH4(g)': 1, 'O2(g)': 2 }, { 'CO2(g)': 1, 'H2O(g)': 2 }),
      atoms: [['C', 120, 240, 50, 112, 102, 348], ['H', 120, 186, 118, 76, 262, 388], ['H', 174, 240, 186, 112, 344, 388], ['H', 120, 294, 254, 76, 408, 388], ['H', 66, 240, 322, 112, 490, 388],
        ['O', 280, 205, 390, 76, 40, 348], ['O', 356, 205, 458, 112, 164, 348], ['O', 280, 280, 390, 148, 303, 348], ['O', 356, 280, 492, 62, 449, 348]],
      brk: [[0, 1, 1, 'C–H'], [0, 2, 1, 'C–H'], [0, 3, 1, 'C–H'], [0, 4, 1, 'C–H'], [5, 6, 2, 'O=O'], [7, 8, 2, 'O=O']],
      mk: [[0, 5, 2, 'C=O'], [0, 6, 2, 'C=O'], [7, 1, 1, 'O–H'], [7, 2, 1, 'O–H'], [8, 3, 1, 'O–H'], [8, 4, 1, 'O–H']],
    },
    c2h4: {
      name: 'C₂H₄ + H₂', tex: '\\ce{C2H4(g) + H2(g) -> C2H6(g)}',
      re: rx({ 'C2H4(g)': 1, 'H2(g)': 1 }, { 'C2H6(g)': 1 }),
      atoms: [['C', 130, 240, 90, 110, 200, 356], ['C', 206, 240, 240, 110, 290, 356],
        ['H', 86, 200, 46, 70, 170, 306], ['H', 86, 280, 46, 150, 150, 372], ['H', 250, 200, 284, 70, 320, 306], ['H', 250, 280, 284, 150, 340, 372],
        ['H', 370, 240, 372, 96, 200, 412], ['H', 436, 240, 470, 96, 290, 412]],
      keep: [[0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]],
      brk: [[0, 1, 2, 'C=C'], [6, 7, 1, 'H–H']], mk: [[0, 1, 1, 'C–C'], [0, 6, 1, 'C–H'], [1, 7, 1, 'C–H']],
    },
  };
  const bondSum = (l) => l.reduce((a, b) => a + BE[b[3]], 0);
  function bondWindow(i, n, a, b) { return [a + (i / n) * (b - a), a + ((i + 0.9) / n) * (b - a)]; }
  function atomProgress(R, list, prog, a0, b0) {
    const n = list.length;
    const qs = list.map((_, i) => { const [a, b] = bondWindow(i, n, a0, b0); return seg(prog, a, b); });
    return R.atoms.map((_, i) => {
      const own = [];
      list.forEach((bd, k) => { if (bd[0] === i || bd[1] === i) own.push(qs[k]); });
      // Atoms held by a kept bond move with their neighbor.
      if (!own.length && R.keep) {
        R.keep.forEach(([x, y]) => {
          const nb = x === i ? y : y === i ? x : -1;
          if (nb >= 0) list.forEach((bd, k) => { if (bd[0] === nb || bd[1] === nb) own.push(qs[k]); });
        });
      }
      return own.length ? own.reduce((a, b) => a + b, 0) / own.length : 0;
    });
  }
  /** Draws the whole break-and-make picture. prog runs 0..1: breaking up to 0.45, free atoms, then making from 0.55. */
  function bondScene(g, R, prog, t, o = {}) {
    const W = 800;
    const up = atomProgress(R, R.brk, prog, 0.03, 0.45);
    const down = atomProgress(R, R.mk, prog, 0.55, 0.98);
    const pos = R.atoms.map((a, i) => {
      const u = ease.inOut(up[i]), d = ease.inOut(down[i]);
      const x = lerp(lerp(a[1], a[3], u), a[5], d), y = lerp(lerp(a[2], a[4], u), a[6], d);
      const free = u > 0.95 && d < 0.05;
      return [x + (free ? wander(i * 1.3, t) * 3 : 0), y + (free ? wander(i * 2.7, t) * 3 : 0)];
    });
    const nb = R.brk.length, nm = R.mk.length;
    const qB = R.brk.map((_, i) => { const [a, b] = bondWindow(i, nb, 0.03, 0.45); return seg(prog, a, b); });
    const qM = R.mk.map((_, i) => { const [a, b] = bondWindow(i, nm, 0.55, 0.98); return seg(prog, a, b); });
    (R.keep || []).forEach(([x, y, ord]) => Art.bond(g, pos[x][0], pos[x][1], pos[y][0], pos[y][1], { order: ord, width: 7 }));
    R.brk.forEach(([x, y, ord], i) => {
      const q = qB[i];
      if (q < 0.55) {
        const shake = q > 0.05 ? Math.sin(t * 60 + i) * q * 4 : 0;
        Art.bond(g, pos[x][0], pos[x][1] + shake, pos[y][0], pos[y][1] - shake, { order: ord, width: 7, color: q > 0.05 ? '#FFD9A8' : undefined });
      }
    });
    R.mk.forEach(([x, y, ord], i) => {
      if (qM[i] > 0.45) Art.bond(g, pos[x][0], pos[x][1], pos[y][0], pos[y][1], { order: ord, width: 7, color: qM[i] < 1 ? '#FFE27A' : undefined });
    });
    R.atoms.forEach((a, i) => {
      const happy = prog > 0.98 ? 'grin' : (up[i] > 0.9 && down[i] < 0.1 ? 'wow' : 'happy');
      Art.atom(g, pos[i][0], pos[i][1], (RAD[a[0]] || 24) * (R.big || 1), a[0], { face: RAD[a[0]] >= 24 || R.atoms.length <= 4 ? happy : null, t, seed: i });
    });
    // Effects on top: heat in as a bond breaks, heat out as a bond forms, with the price tag.
    R.brk.forEach(([x, y, , name], i) => {
      const q = qB[i];
      const mx = (pos[x][0] + pos[y][0]) / 2, my = (pos[x][1] + pos[y][1]) / 2;
      if (q > 0 && q < 1) {
        for (let k = 0; k < 3; k++) {
          const a = -Math.PI / 2 + (k - 1) * 0.7;
          const rr = 70 * (1 - q);
          packet(g, mx + Math.cos(a) * rr, my + Math.sin(a) * rr, 8, 1 - Math.abs(q - 0.5) * 0.8);
        }
        Art.text(g, '+' + BE[name], mx, my - 42 - q * 16, { font: 'display', size: 26, color: C.sun, halo: true, alpha: Math.sin(q * Math.PI) });
      }
      Art.burst(g, mx, my, seg(q, 0.5, 1), { n: 8, r: 40, size: 5, colors: ['#FFD9A8', '#fff'], seed: i });
    });
    R.mk.forEach(([x, y, , name], i) => {
      const q = qM[i];
      const mx = (pos[x][0] + pos[y][0]) / 2, my = (pos[x][1] + pos[y][1]) / 2;
      if (q > 0.4 && q < 1) {
        const u = (q - 0.4) / 0.6;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * TAU + i;
          packet(g, mx + Math.cos(a) * (14 + u * 60), my + Math.sin(a) * (14 + u * 60), 7, 1 - u);
        }
        Art.text(g, '−' + BE[name], mx, my - 34 - u * 20, { font: 'display', size: 26, color: C.leaf, halo: true, alpha: Math.sin(u * Math.PI) });
      }
    });
    // The phase banner.
    const banner = prog < 0.03 ? 'Reactants' : prog < 0.47 ? 'Breaking bonds costs energy' : prog < 0.55 ? 'All free atoms: the top of the climb' : prog < 0.985 ? 'Making bonds pays energy back' : 'Products';
    Art.text(g, banner, 276, 26, { font: 'display', size: 25, color: prog < 0.47 && prog >= 0.03 ? C.sun : prog >= 0.55 && prog < 0.985 ? C.leaf : C.ink, maxW: 510, halo: true });
    // The energy column on the right.
    const X0 = 548, X1 = W - 8;
    g.fillStyle = 'rgba(16,8,32,.62)'; Art.round(g, X0, 8, X1 - X0, (o.H || 450) - 16, 16); g.fill();
    const brokeAll = bondSum(R.brk), madeAll = bondSum(R.mk);
    const inNow = R.brk.reduce((a, b, i) => a + BE[b[3]] * qB[i], 0);
    const outNow = R.mk.reduce((a, b, i) => a + BE[b[3]] * qM[i], 0);
    const bottom = (o.H || 450) - 58, top = 90;
    const k = (bottom - top) / Math.max(madeAll, brokeAll);
    const yS = top + brokeAll * k;
    const yNow = yS - (inNow - outNow) * k;
    const yPeak = yS - inNow * k;
    const xA = X0 + 46, xB = X0 + 118, xC = X0 + 196;
    Art.text(g, 'Paid in', xA + 14, 28, { size: 21, color: C.dim });
    Art.text(g, (inNow > 0.5 ? '+' : '') + Math.round(inNow), xA + 14, 58, { font: 'display', size: 28, color: C.sun });
    Art.text(g, 'Paid back', xC - 22, 28, { size: 21, color: C.dim });
    Art.text(g, (outNow > 0.5 ? '−' : '') + Math.round(outNow), xC - 22, 58, { font: 'display', size: 28, color: C.leaf });
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2.5; g.setLineDash([7, 7]);
    g.beginPath(); g.moveTo(X0 + 14, yS); g.lineTo(X1 - 10, yS); g.stroke(); g.setLineDash([]);
    Art.text(g, 'start', X0 + 22, yS + 18, { size: 20, color: C.dim, align: 'left' });
    if (inNow > 1) heatArrow(g, xA, yS, xA, yPeak, t, { w: 18, head: 22 });
    if (outNow > 1) heatArrow(g, xB, yPeak, xB, yNow, t, { w: 18, head: 22 });
    const done = prog >= 0.985;
    const dH = brokeAll - madeAll;
    if (done) {
      if (Math.abs(yNow - yS) > 4) deltaArrow(g, xC, yS, yNow, { w: 9, head: 22, color: C.sun });
      Art.text(g, 'ΔH ≈ ' + kj(dH, 0) + ' kJ', (X0 + X1) / 2, (o.H || 450) - 28, { font: 'display', size: 26, color: C.sun, maxW: 228 });
    } else {
      Art.ball(g, xC, yNow, 11, C.sun);
      g.strokeStyle = C.sun; g.lineWidth = 3; g.beginPath(); g.moveTo(xB + 16, yNow); g.lineTo(xC - 11, yNow); g.stroke();
      Art.text(g, 'energy now', (X0 + X1) / 2, (o.H || 450) - 28, { size: 22, color: C.dim });
    }
  }

  /* ---------- Story 3: the bonds of HCl ---------- */
  const HCLR = BR.hcl;
  Lab.story('#story-bonds', {
    title: 'Pay to break, get paid to make',
    scenes: [
      {
        say: 'Hydrogen and chlorine react to make hydrogen chloride: $\\ce{H2 + Cl2 -> 2HCl}$. Count the bonds first. Going in, there is <b>one H–H</b> and <b>one Cl–Cl</b>.',
        dur: 2.6,
        draw(g, p, t) {
          bondScene(g, HCLR, 0, t);
          const a = seg(p, 0.3, 0.7);
          Art.ring(g, 150, 240, 88, { color: C.sun, w: 4, p: a });
          Art.ring(g, 381, 240, 118, { color: C.sun, w: 4, p: a });
          Art.text(g, 'H–H', 150, 354, { font: 'display', size: 32, color: C.sun, alpha: a });
          Art.text(g, 'Cl–Cl', 381, 386, { font: 'display', size: 32, color: C.sun, alpha: a });
        },
      },
      {
        say: 'Pull the atoms apart. Each bond needs energy to break, so heat goes <b>in</b>: 436 kJ for H–H and 243 kJ for Cl–Cl. Breaking is always <b>positive</b>.',
        dur: 4.2,
        draw(g, p, t) { bondScene(g, HCLR, lerp(0, 0.5, seg(p, 0.05, 1)), t); },
      },
      {
        say: 'Now the atoms are free, at the top of the climb. You paid 679 kJ to get here. The atoms are unhappy and very ready to bond.',
        dur: 2.2,
        draw(g, p, t) {
          bondScene(g, HCLR, 0.5, t);
          Art.bubble(g, 'Anyone want to bond?', 350, 156, { w: 280, side: 'up', size: 25, alpha: seg(p, 0.2, 0.5) });
        },
      },
      {
        say: 'They snap together into two H–Cl bonds. Each new bond gives energy back: 431 kJ each, so 862 kJ in all. Making is always <b>negative</b>.',
        dur: 4.2,
        draw(g, p, t) { bondScene(g, HCLR, lerp(0.5, 1, seg(p, 0.05, 1)), t); },
      },
      {
        say: 'You paid 679 kJ and got 862 kJ back. So $\\Delta H \\approx 679 - 862 = -183$ kJ: heat comes out, and the reaction is <b>exothermic</b>. Measured, it is −184.6 kJ.',
        dur: 3,
        draw(g, p, t) {
          bondScene(g, HCLR, 1, t);
          const a = seg(p, 0.2, 0.6);
          g.save(); g.globalAlpha *= a;
          g.fillStyle = C.plum2; g.strokeStyle = C.sun; g.lineWidth = 3;
          Art.round(g, 60, 100, 420, 110, 20); g.fill(); g.stroke();
          g.restore();
          Art.text(g, 'broken − formed', 270, 130, { size: 26, color: C.dim, alpha: a });
          Art.text(g, '679 − 862 = −183 kJ', 270, 172, { font: 'display', size: 36, color: C.sun, alpha: a });
        },
      },
    ],
  });

  /* ---------- Bench: break and make ---------- */
  const bond = { key: 'hcl', p: 0, playing: false };
  const bondStage = Lab.stage('#c-bonds', {
    label: 'Atoms climbing as bonds break and falling as bonds form, beside a column tracking the energy paid in and paid back.',
    draw(g, t, dt) {
      if (bond.playing) {
        bond.p = Math.min(1, bond.p + dt / 9);
        const el = Lab.$('#bond-p'); el.value = bond.p * 100; Lab.paintRange(el);
        if (bond.p >= 1) { bond.playing = false; Lab.$('#bond-go').textContent = 'Play the reaction'; }
      }
      bondScene(g, BR[bond.key], bond.p, t);
      if (bond.p >= 0.985) {
        Art.text(g, 'You got back more than you paid', 276, 120, { size: 26, color: C.leaf, maxW: 500 });
        Art.text(g, 'so heat comes out: exothermic', 276, 158, { size: 26, color: C.leaf, maxW: 500 });
      }
    },
  });
  void bondStage;
  function paintBond() {
    const R = BR[bond.key];
    const group = (l) => {
      const c = {};
      l.forEach((b) => { c[b[3]] = (c[b[3]] || 0) + 1; });
      return Object.keys(c).map((n) => `${c[n]}(${BE[n]})`).join(' + ');
    };
    const brk = bondSum(R.brk), mk = bondSum(R.mk), est = brk - mk, real = dHof(R.re);
    let note = `The value from formation enthalpies is ${kj(real)} kJ.`;
    if (bond.key === 'c2h4') note = `The value from formation enthalpies is ${kj(real)} kJ. Here the estimate is off by more, because bond enthalpies are only averages. Only the bonds that change are counted.`;
    Lab.$('#bond-foot').innerHTML = Lab.texString(`<p>$${wrapEq(R.tex)}$</p>
      <div class="calc-line">$$\\text{Broken: } ${group(R.brk)} = ${brk}$$</div>
      <div class="calc-line">$$\\text{Formed: } ${group(R.mk)} = ${mk}$$</div>
      <div class="calc-line">$$\\Delta H \\approx ${brk} - ${mk} = ${texNum(est, 0)}\\ \\text{kJ}$$</div>
      <p>${note}</p>`);
  }
  Lab.segmented('#bond-rx', (v) => { bond.key = v; bond.p = 0; bond.playing = false; const el = Lab.$('#bond-p'); el.value = 0; Lab.paintRange(el); Lab.$('#bond-go').textContent = 'Play the reaction'; paintBond(); });
  Lab.bind('#bond-p', null, null, (v) => { bond.p = v / 100; bond.playing = false; Lab.$('#bond-go').textContent = 'Play the reaction'; });
  Lab.$('#bond-go').addEventListener('click', () => {
    if (bond.playing) { bond.playing = false; Lab.$('#bond-go').textContent = 'Play the reaction'; return; }
    if (bond.p >= 1) bond.p = 0;
    bond.playing = true; Lab.$('#bond-go').textContent = 'Pause'; Lab.sound.pop();
  });
  paintBond();

  /* ---------- Bench: fuel gallery ---------- */
  const KETTLE = (1000 * 4.184 * 80) / 1000; // kJ to warm 1 L of water from 20 to 100 °C
  const FUELS = [
    { name: 'Hydrogen', f: 'H2', re: rx({ 'H2(g)': 1, 'O2(g)': 0.5 }, { 'H2O(l)': 1 }) },
    { name: 'Methane', f: 'CH4', re: COMB[0][3] },
    { name: 'Propane', f: 'C3H8', re: COMB[1][3] },
    { name: 'Octane', f: 'C8H18', re: rx({ 'C8H18(l)': 1, 'O2(g)': 12.5 }, { 'CO2(g)': 8, 'H2O(l)': 9 }) },
    { name: 'Ethanol', f: 'C2H5OH', re: COMB[2][3] },
    { name: 'Glucose', f: 'C6H12O6', re: COMB[6][3] },
  ].map((F) => {
    const dH = dHof(F.re), M = Bank.molarMass(F.f);
    return { ...F, dH, M, perG: dH / M, kettle: KETTLE / (Math.abs(dH) / M), y: 0, w: 0 };
  });
  const fuel = { mode: 'mol' };
  const fuelVal = (F) => (fuel.mode === 'mol' ? Math.abs(F.dH) : fuel.mode === 'g' ? Math.abs(F.perG) : F.kettle);
  const fuelTxt = (F) => (fuel.mode === 'mol' ? kj(F.dH) + ' kJ/mol' : fuel.mode === 'g' ? kj(F.perG) + ' kJ/g' : Lab.fmt(F.kettle, 1) + ' g');
  FUELS.forEach((F, i) => { F.y = 80 + i * 60; });
  Lab.stage('#c-fuels', {
    h: 460,
    label: 'Six fuels as horizontal bars, re-ranking when you change the comparison.',
    draw(g, t, dt) {
      const order = FUELS.slice().sort((a, b) => fuelVal(b) - fuelVal(a));
      const max = fuelVal(order[0]);
      Art.text(g, fuel.mode === 'mol' ? 'Heat released per mole of fuel' : fuel.mode === 'g' ? 'Heat released per gram of fuel' : 'Grams needed to heat 1 L of water from 20 to 100 °C', 400, 30, { font: 'display', size: 27, color: C.sun, maxW: 760 });
      order.forEach((F, i) => {
        const yT = 84 + i * 60, wT = (fuelVal(F) / max) * 340;
        F.y = lerp(F.y, yT, clamp(dt * 6)); F.w = lerp(F.w, wT, clamp(dt * 6));
        Art.text(g, F.name, 124, F.y - 13, { font: 'display', size: 25, align: 'right' });
        Art.formula(g, F.f, 124, F.y + 15, { size: 22, align: 'right', color: C.dim });
        const x0 = 140;
        const gr = g.createLinearGradient(x0, 0, x0 + Math.max(F.w, 4), 0);
        gr.addColorStop(0, '#E0561B'); gr.addColorStop(1, '#FFD23F');
        g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
        Art.round(g, x0, F.y - 20, Math.max(F.w, 8), 40, 10); g.fill(); g.stroke();
        if (fuel.mode !== 'kettle') Art.flame(g, x0 + F.w + 16, F.y + 18, 40, t + i, { kind: 'orange' });
        Art.text(g, fuelTxt(F), x0 + F.w + (fuel.mode !== 'kettle' ? 38 : 14), F.y, { font: 'display', size: 26, align: 'left', color: i === 0 ? C.sun : C.ink, maxW: 260 });
      });
    },
  });
  function paintFuel() {
    const foot = Lab.$('#fuel-foot');
    if (fuel.mode === 'mol') foot.innerHTML = Lab.texString('<p><b>Per mole, octane wins</b>, and hydrogen comes last. A big molecule has many bonds to rearrange. All these values are negative, because burning always releases heat.</p>');
    else if (fuel.mode === 'g') foot.innerHTML = Lab.texString('<p><b>Per gram, hydrogen wins</b> by a long way, since it is so light. This is why some rockets use it. Glucose and ethanol already contain oxygen, so they are partly burned to begin with.</p>');
    else foot.innerHTML = Lab.texString(`<p>This takes $q = (1000\\ \\text{g})(4.184)(80\\ {}^\\circ\\text{C}) = ${KETTLE.toFixed(1)}$ kJ. Smaller bars are better. It assumes that every bit of the heat goes into the water, which a real kettle cannot manage.</p>`);
  }
  Lab.segmented('#fuel-mode', (v) => { fuel.mode = v; paintFuel(); });
  paintFuel();
});
