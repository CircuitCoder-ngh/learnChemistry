/* Lesson 14: pH and buffers. Friendly logs, a real pH scale, strong against weak, a live buffer. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const KW = 1e-14;

  /* ---------- pH math ---------- */
  /** Solve a monotonic rising function on a log scale for [H3O+]. */
  function solveH(f) {
    let lo = -16, hi = 2;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      if (f(Math.pow(10, mid)) > 0) hi = mid; else lo = mid;
    }
    return Math.pow(10, (lo + hi) / 2);
  }
  /** Exact [H3O+] for a weak acid at concentration c. Charge balance: [H3O+] = [A-] + [OH-]. */
  const weakH = (Ka, c) => solveH((h) => h - (c * Ka) / (Ka + h) - KW / h);
  /** Exact [H3O+] with a total weak acid Ca (either form) and net strong cation S. Charge balance. */
  const mixH = (Ka, Ca, S) => solveH((h) => h + S - KW / h - (Ca * Ka) / (Ka + h));
  /** Exact [H3O+] in plain water with net strong cation S, written to keep precision. */
  const waterH = (S) => (S >= 0 ? (2 * KW) / (S + Math.sqrt(S * S + 4 * KW)) : (-S + Math.sqrt(S * S + 4 * KW)) / 2);
  const pHof = (h) => -Math.log10(h);
  /** Scientific notation with Unicode, for canvas text. */
  function sci(x, n = 2) {
    const v = Number(x.toPrecision(n));
    const e = Math.floor(Math.log10(v));
    if (e === 0 || e === -1) return Lab.sig(v, n);
    return (v / Math.pow(10, e)).toFixed(n - 1) + ' × 10' + Lab.sup(e);
  }
  const texSci = (x, n = 2) => {
    const v = Number(x.toPrecision(n));
    const e = Math.floor(Math.log10(v));
    if (e > -3 && e < 3) return Lab.sig(v, n);
    return `${(v / Math.pow(10, e)).toFixed(n - 1)} \\times 10^{${e}}`;
  };

  /* ---------- Universal indicator colors ---------- */
  const UI = ['#D8232A', '#E8402A', '#F0592A', '#F47B2A', '#F9A72B', '#F7D52E', '#C6DC36', '#55C13F', '#27A96C', '#1E9AA6', '#2277C9', '#2C53BB', '#4A3BAF', '#6B2FA6', '#7E2596'];
  const uiColor = (pH) => {
    const v = clamp(pH, 0, 14), i = Math.min(13, Math.floor(v));
    return Art.mix(UI[i], UI[i + 1], v - i);
  };
  /** A readable version of the indicator color for text on the dark stage. */
  const uiText = (pH) => Art.mix(uiColor(pH), '#FFFFFF', pH > 10 ? 0.45 : 0.15);
  function rainbow(g, x0, x1, y, h, a = 1) {
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    UI.forEach((c, i) => gr.addColorStop(i / 14, c));
    g.save(); g.globalAlpha *= a;
    g.fillStyle = gr; Art.round(g, x0, y, x1 - x0, h, h / 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2.5; g.stroke();
    g.restore();
  }

  /* ---------- Ions ---------- */
  function hydronium(g, x, y, r, o = {}) {
    const a = o.rot || 0;
    [-2.6, -0.54, 1.57].forEach((ang) => Art.atom(g, x + Math.cos(ang + a) * r * 1.02, y + Math.sin(ang + a) * r * 1.02, r * 0.58, 'H', { label: false }));
    Art.atom(g, x, y, r, 'O', { label: o.face ? false : (r >= 14 ? 'O' : false), face: o.face, t: o.t, seed: o.seed, look: o.look, charge: '+' });
  }
  function hydroxide(g, x, y, r, o = {}) {
    const a = o.rot === undefined ? 2.2 : o.rot;
    Art.atom(g, x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 1.05, r * 0.58, 'H', { label: false });
    Art.atom(g, x, y, r, 'O', { label: o.face ? false : (r >= 14 ? 'O' : false), face: o.face, t: o.t, seed: o.seed, look: o.look, charge: '-' });
  }
  /* The weak acids, drawn as a body with an H on it. The body's color is its own; only real atoms use element colors. */
  const ANION = {
    Cl: { sym: 'Cl', label: 'Cl' }, F: { sym: 'F', label: 'F' },
    Ac: { sym: 'A', label: 'Ac', color: C.violet }, CN: { sym: 'A', label: 'CN', color: '#7F9BC4' },
  };
  function anion(g, x, y, r, k, o = {}) {
    const a = ANION[k];
    Art.atom(g, x, y, r, a.sym, { color: a.color, label: a.label, labelColor: k === 'F' ? '#1A2E0C' : undefined, charge: o.charge ? '-' : undefined, face: o.face, t: o.t, look: o.look, seed: o.seed });
  }
  function whole(g, x, y, r, k, rot = 0.6, o = {}) {
    Art.atom(g, x + Math.cos(rot) * r * 1.12, y + Math.sin(rot) * r * 1.12, r * 0.55, 'H', { label: false });
    anion(g, x, y, r, k, o);
  }
  function panel(g, x0, y0, x1, y1) {
    g.fillStyle = 'rgba(70,185,240,.1)'; Art.round(g, x0, y0, x1 - x0, y1 - y0, 14); g.fill();
    g.strokeStyle = 'rgba(214,240,255,.55)'; g.lineWidth = 3.5; g.stroke();
  }
  const sun = (i, n, R) => { const a = i * 2.39996, d = Math.sqrt((i + 0.5) / n) * R; return [Math.cos(a) * d, Math.sin(a) * d]; };

  /** Centered display text with real subscripts: parts are [text] or [text, 'sub']. */
  function rich(g, parts, x, y, o = {}) {
    const size = o.size || 36, sub = size * 0.62, fam = Art.FONT_DISPLAY;
    let w = 0;
    parts.forEach((pt) => { g.font = `400 ${pt[1] ? sub : size}px ${fam}`; pt.w = g.measureText(pt[0]).width; w += pt.w; });
    let cx = x - w / 2;
    parts.forEach((pt) => {
      Art.text(g, pt[0], cx, y + (pt[1] ? size * 0.26 : 0), { font: 'display', size: pt[1] ? sub : size, align: 'left', color: o.color, alpha: o.alpha });
      cx += pt.w;
    });
  }

  /* ---------- Story 1: counting zeros ---------- */
  Lab.story('#story-logs', {
    title: 'Counting zeros',
    scenes: [
      {
        say: 'Even pure water has a few ions. Very rarely, one water molecule hands a proton to another, making <b>hydronium</b> and <b>hydroxide</b>. Only about 1 water molecule in 550 million is ionized.',
        dur: 4,
        draw(g, p, t) {
          g.save(); g.globalAlpha *= seg(p, 0, 0.15); Art.formula(g, '2H2O <=> H3O^+ + OH^-', 400, 42, { size: 40, colorize: true }); g.restore();
          const q = ease.inOut(seg(p, 0.3, 0.65));
          const O1 = [262, 200], O2 = [540, 200];
          const r = 48, hr = 27;
          const Ha = [O1[0] - 56, O1[1] + 66], Hb = [lerp(O1[0] + 56, O2[0] - 74, q), lerp(O1[1] + 66, O2[1] + 14, q) - Math.sin(q * Math.PI) * 74];
          const Hc = [O2[0] + 12, O2[1] + 84], Hd = [O2[0] + 74, O2[1] - 8];
          const bond = (A, B, a = 1) => { g.save(); g.globalAlpha *= a; Art.bond(g, A[0], A[1], B[0], B[1], { width: 9 }); g.restore(); };
          bond(O1, Ha); bond(O2, Hc); bond(O2, Hd);
          bond(O1, Hb, clamp(1 - q * 3)); bond(O2, Hb, clamp(q * 3 - 2));
          [Ha, Hc, Hd].forEach((h) => Art.atom(g, h[0], h[1], hr, 'H', { label: false }));
          Art.atom(g, Hb[0], Hb[1], hr, 'H', { label: false, glow: 1 });
          const done = q >= 1;
          Art.atom(g, O1[0], O1[1], r, 'O', { face: done ? 'sad' : 'happy', look: [1, 0], t, charge: done ? '-' : undefined, label: false });
          Art.atom(g, O2[0], O2[1], r, 'O', { face: done ? 'grin' : 'happy', look: [-1, 0], t, seed: 2, charge: done ? '+' : undefined, label: false });
          Art.text(g, 'Hydroxide', O1[0], 318, { font: 'display', size: 30, color: C.cyan, alpha: seg(p, 0.7, 0.85) });
          Art.text(g, 'Hydronium', O2[0], 318, { font: 'display', size: 30, color: C.pink, alpha: seg(p, 0.7, 0.85) });
          Art.text(g, 'In pure water at 25 °C: 1.0 × 10⁻⁷ M of each', 400, 392, { size: 28, color: C.sun, alpha: seg(p, 0.82, 0.98) });
        },
      },
      {
        say: 'Written out, that is <b>0.0000001</b> M. Numbers this small are awkward. So count the decimal places instead. Seven places means <b>pH 7</b>.',
        dur: 4.4,
        draw(g, p, t) {
          const chars = ['0', '.', '0', '0', '0', '0', '0', '0', '1'];
          const w = 62, x0 = 400 - ((chars.length - 1) * w) / 2 - 20, y = 150;
          Art.text(g, 'Hydronium in pure water', 380, 62, { size: 28, color: C.dim });
          let n = 0;
          chars.forEach((ch, i) => {
            const x = x0 + i * w;
            Art.text(g, ch, x, y, { font: 'display', size: 74, color: ch === '1' ? C.pink : C.ink });
            if (i >= 2) {
              n += 1;
              const q = ease.back(seg(p, 0.12 + (i - 2) * 0.08, 0.24 + (i - 2) * 0.08));
              if (q > 0) {
                g.save(); g.translate(x, y + 74); g.scale(q, q);
                g.fillStyle = i === 8 ? C.pink : C.plum2; g.beginPath(); g.arc(0, 0, 23, 0, TAU); g.fill();
                Art.text(g, String(n), 0, 1, { font: 'display', size: 28, color: i === 8 ? '#fff' : C.sun });
                g.restore();
              }
            }
          });
          Art.text(g, 'M', x0 + chars.length * w - 8, y + 10, { size: 36, color: C.dim });
          const a = ease.back(seg(p, 0.76, 0.96));
          if (a > 0) {
            g.save(); g.translate(330, 346); g.scale(a, a);
            g.fillStyle = uiColor(7); Art.round(g, -120, -50, 240, 100, 34); g.fill();
            Art.text(g, 'pH = 7', 0, 2, { font: 'display', size: 56, color: '#fff' });
            g.restore();
          }
          Art.moe(g, 650, 440, 150, 'point', { t, flip: true });
        },
      },
      {
        say: 'It works for any power of ten. pH is the exponent with the minus sign dropped. In exam language: $\\text{pH} = -\\log[\\ce{H3O+}]$.',
        dur: 4,
        draw(g, p, t) {
          const rows = [['0.1 M', '10⁻¹', 1], ['0.01 M', '10⁻²', 2], ['0.001 M', '10⁻³', 3], ['0.0000001 M', '10⁻⁷', 7]];
          Art.text(g, '[H₃O⁺]', 190, 44, { font: 'display', size: 32, color: C.dim });
          Art.text(g, 'as a power', 448, 44, { size: 26, color: C.dim });
          Art.text(g, 'pH', 640, 44, { font: 'display', size: 32, color: C.dim });
          rows.forEach((row, i) => {
            const q = seg(p, 0.05 + i * 0.2, 0.25 + i * 0.2);
            if (q <= 0) return;
            const y = 108 + i * 76;
            Art.text(g, row[0], 190, y, { font: 'display', size: 38, alpha: q });
            Art.arrow(g, 344, y, 386, y, { color: C.dim, w: 4, p: q });
            Art.text(g, row[1], 448, y, { font: 'display', size: 40, color: C.cyan, alpha: q });
            Art.arrow(g, 510, y, 552, y, { color: C.dim, w: 4, p: q });
            const b = ease.back(q);
            g.save(); g.translate(640, y); g.scale(b, b);
            g.fillStyle = uiColor(row[2]); Art.round(g, -56, -28, 112, 56, 22); g.fill();
            Art.text(g, String(row[2]), 0, 2, { font: 'display', size: 40, color: '#fff' });
            g.restore();
          });
          void t;
        },
      },
      {
        say: 'Here is what the scale hides. Each step is <b>10 times</b> more hydronium. Go from pH 5 to pH 3, and you have not doubled anything. You have made it <b>100 times</b> more acidic.',
        dur: 4.4,
        draw(g, p, t) {
          const panels = [{ x: 120, n: 1, ph: 5 }, { x: 400, n: 10, ph: 4 }, { x: 680, n: 100, ph: 3 }];
          const y0 = 96, size = 200;
          panels.forEach((P, k) => {
            const a = seg(p, 0.04 + k * 0.26, 0.2 + k * 0.26);
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            g.fillStyle = 'rgba(255,255,255,.07)'; g.strokeStyle = uiColor(P.ph); g.lineWidth = 5;
            Art.round(g, P.x - size / 2, y0, size, size, 16); g.fill(); g.stroke();
            g.restore();
            Art.text(g, 'pH ' + P.ph, P.x, 58, { font: 'display', size: 38, color: uiText(P.ph), alpha: a });
            const cols = P.n === 1 ? 1 : P.n === 10 ? 4 : 10, rows = Math.ceil(P.n / cols);
            const cell = P.n === 100 ? 18.6 : 44;
            const r = P.n === 100 ? 8 : P.n === 10 ? 17 : 26;
            const yC = y0 + size / 2;
            for (let i = 0; i < P.n; i++) {
              const q = ease.back(seg(p, 0.08 + k * 0.26 + (i / P.n) * 0.13, 0.14 + k * 0.26 + (i / P.n) * 0.13));
              if (q <= 0) continue;
              const cx = P.x + ((i % cols) - (cols - 1) / 2) * cell;
              const cy = yC + (Math.floor(i / cols) - (rows - 1) / 2) * cell;
              Art.ball(g, cx, cy, r * q, Art.elementColor('O'));
            }
            Art.text(g, P.n === 1 ? '1 ion' : P.n + ' ions', P.x, y0 + size + 30, { size: 27, alpha: a });
          });
          [[260, seg(p, 0.3, 0.42)], [540, seg(p, 0.56, 0.68)]].forEach(([x, q]) => {
            Art.text(g, '× 10', x, y0 + size / 2 - 22, { font: 'display', size: 32, color: C.sun, alpha: q });
            Art.arrow(g, x - 20, y0 + size / 2 + 8, x + 20, y0 + size / 2 + 8, { color: C.sun, w: 5, p: q });
          });
          Art.text(g, 'A small change in pH is a big change in acid', 400, 402, { size: 28, color: C.leaf, alpha: seg(p, 0.86, 1) });
          void t;
        },
      },
      {
        say: 'The scale runs "backward": <b>lower pH means more acid</b>. Below 7 is acidic, above 7 is basic, and exactly 7 is neutral at 25 °C.',
        dur: 3.4,
        draw(g, p, t) {
          const x0 = 50, x1 = 750, y = 210;
          const q = ease.out(seg(p, 0, 0.35));
          g.save(); g.beginPath(); g.rect(x0 - 4, 0, (x1 - x0 + 8) * q, 450); g.clip();
          rainbow(g, x0, x1, y, 60);
          g.restore();
          for (let i = 0; i <= 14; i++) {
            const a = seg(p, 0.12 + i * 0.015, 0.28 + i * 0.015);
            Art.text(g, String(i), lerp(x0 + 14, x1 - 14, i / 14), y + 88, { size: 26, alpha: a, color: i === 7 ? C.leaf : C.ink });
          }
          const nx = 400;
          g.fillStyle = C.leaf; g.globalAlpha *= seg(p, 0.4, 0.55); g.fillRect(nx - 2.5, y - 16, 5, 92); g.globalAlpha = 1;
          Art.text(g, 'Neutral', nx, y - 40, { font: 'display', size: 34, color: C.leaf, alpha: seg(p, 0.4, 0.55) });
          Art.arrow(g, nx - 50, y + 130, x0 + 30, y + 130, { color: UI[1], w: 8, p: seg(p, 0.5, 0.72) });
          Art.text(g, 'More acidic', 215, y + 164, { font: 'display', size: 34, color: '#FF8A7A', alpha: seg(p, 0.6, 0.75) });
          Art.arrow(g, nx + 50, y + 130, x1 - 30, y + 130, { color: '#7C8CFF', w: 8, p: seg(p, 0.65, 0.85) });
          Art.text(g, 'More basic', 585, y + 164, { font: 'display', size: 34, color: '#9DABFF', alpha: seg(p, 0.75, 0.9) });
          Art.bubble(g, 'Yes, it runs backward. Nobody asked me.', 180, 186, { w: 290, side: 'down', alpha: seg(p, 0.8, 0.95) });
          void t;
        },
      },
      {
        say: 'Most numbers are not neat powers of ten. $3.2 \\times 10^{-4}$ falls between pH 3 and pH 4. Your calculator finds exactly where: press log, then flip the sign. The answer is <b>3.49</b>.',
        dur: 4.6,
        draw(g, p, t) {
          const x0 = 90, x1 = 710, y = 112;
          const X = (ph) => lerp(x1, x0, ph - 3);
          g.fillStyle = 'rgba(255,255,255,.2)'; Art.round(g, x0, y, x1 - x0, 16, 8); g.fill();
          [[4, 'pH 4', '10⁻⁴ M'], [3, 'pH 3', '10⁻³ M']].forEach(([ph, a, b]) => {
            g.fillStyle = C.ink; g.fillRect(X(ph) - 3, y - 14, 6, 44);
            Art.text(g, a, X(ph), y - 36, { font: 'display', size: 32, color: uiText(ph) });
            Art.text(g, b, X(ph), y + 54, { size: 25, color: C.dim });
          });
          const q = ease.inOut(seg(p, 0.1, 0.4));
          const ph = lerp(4, 3.49, q);
          g.fillStyle = C.pink; g.beginPath(); g.moveTo(X(ph), y + 2); g.lineTo(X(ph) - 16, y - 26); g.lineTo(X(ph) + 16, y - 26); g.closePath(); g.fill();
          if (q >= 1) Art.text(g, '3.2 × 10⁻⁴ M', X(ph), y + 54, { size: 26, color: C.pink });
          // The calculator steps.
          const steps = [['log(3.2 × 10⁻⁴)', '= −3.49', C.ink], ['Flip the sign', 'pH = 3.49', C.sun]];
          steps.forEach((st, i) => {
            const a = ease.back(seg(p, 0.42 + i * 0.22, 0.58 + i * 0.22));
            if (a <= 0) return;
            const yy = 252 + i * 80;
            g.save(); g.translate(400, yy); g.scale(a, a);
            g.fillStyle = '#10261B'; g.strokeStyle = C.leaf; g.lineWidth = 3; Art.round(g, -290, -34, 580, 68, 14); g.fill(); g.stroke();
            Art.text(g, st[0], -272, 1, { size: 32, align: 'left', color: '#6CFFAF' });
            Art.text(g, st[1], 272, 1, { font: 'display', size: 38, align: 'right', color: st[2] });
            g.restore();
          });
          void t;
        },
      },
      {
        say: 'When hydronium goes up, hydroxide goes down, because their product is fixed: $K_w = [\\ce{H3O+}][\\ce{OH-}] = 1.0 \\times 10^{-14}$. So at 25 °C, <b>pH + pOH = 14</b>. Watch the bar: it never gets longer.',
        dur: 3.6,
        draw(g, p, t) {
          const a = seg(p, 0, 0.25);
          const ph = 7 + 5 * Math.sin(t * 0.55) * ease.inOut(seg(p, 0.2, 0.7));
          const x0 = 60, x1 = 740, y = 180, h = 84;
          const mid = lerp(x0, x1, ph / 14);
          g.save(); g.globalAlpha *= a;
          g.fillStyle = C.pink; Art.round(g, x0, y, mid - x0, h, 16); g.fill();
          g.fillStyle = C.cyan; Art.round(g, mid, y, x1 - mid, h, 16); g.fill();
          g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; Art.round(g, x0, y, x1 - x0, h, 16); g.stroke();
          g.restore();
          Art.text(g, 'pH ' + ph.toFixed(1), Math.max(x0 + 84, (x0 + mid) / 2), y + h / 2, { font: 'display', size: 34, color: '#fff', alpha: a, halo: true });
          Art.text(g, 'pOH ' + (14 - ph).toFixed(1), Math.min(x1 - 96, (mid + x1) / 2), y + h / 2, { font: 'display', size: 34, color: '#fff', alpha: a, halo: true });
          Art.text(g, 'Always 14 in total', 400, 126, { font: 'display', size: 36, color: C.sun, alpha: a });
          Art.arrow(g, x0, 150, x1, 150, { color: C.sun, w: 4, both: true, alpha: a });
          Art.text(g, '[H₃O⁺] = ' + sci(Math.pow(10, -ph)) + ' M', 400, 322, { size: 29, color: C.pink, alpha: seg(p, 0.3, 0.5) });
          Art.text(g, '[OH⁻] = ' + sci(Math.pow(10, ph - 14)) + ' M', 400, 366, { size: 29, color: C.cyan, alpha: seg(p, 0.3, 0.5) });
        },
      },
    ],
  });

  /* ---------- Bench: pH explorer ---------- */
  const SUBS = [[0.8, 'Battery acid'], [1.5, 'Stomach acid'], [2.3, 'Lemon juice'], [2.8, 'Vinegar'], [5, 'Black coffee'], [6.6, 'Milk'], [7, 'Pure water'], [7.4, 'Blood'], [8.1, 'Seawater'], [8.3, 'Baking soda'], [11.5, 'Ammonia cleaner'], [12.5, 'Bleach'], [14, 'Drain cleaner']];
  const sc = { pH: 7, shown: 7, name: 'Pure water' };
  const SX0 = 40, SX1 = 760, SY = 396;
  const scX = (ph) => lerp(SX0 + 12, SX1 - 12, ph / 14);
  function setPH(v, fromSlider) {
    sc.pH = clamp(v, 0, 14);
    const hit = SUBS.find(([ph]) => Math.abs(ph - sc.pH) < 0.051);
    sc.name = hit ? hit[1] : 'Your pH';
    Lab.$$('#sc-sub button').forEach((b) => b.setAttribute('aria-pressed', String(!!hit && +b.dataset.value === hit[0])));
    if (!fromSlider) { const r = Lab.$('#sc-ph'); r.value = sc.pH; Lab.paintRange(r); }
    Lab.$('#sc-ph-out').textContent = 'pH ' + sc.pH.toFixed(1);
  }
  const scaleStage = Lab.stage('#c-scale', {
    h: 470,
    label: 'A beaker colored by universal indicator, the pH with its hydronium concentration, a magnifier of ions, and a rainbow pH scale with real substances marked.',
    onPointer(e) {
      if ((e.type === 'down' || e.type === 'move') && e.y > SY - 40) setPH(Number((((e.x - SX0 - 12) / (SX1 - SX0 - 24)) * 14).toFixed(1)));
      if (e.type === 'hover') scaleStage.canvas.style.cursor = e.y > SY - 40 ? 'pointer' : 'default';
    },
    draw(g, t, dt) {
      sc.shown = lerp(sc.shown, sc.pH, dt > 0 ? clamp(dt * 9) : 1);
      const ph = sc.shown, h = Math.pow(10, -ph), oh = Math.pow(10, ph - 14);
      // Beaker.
      const col = uiColor(ph);
      Art.beaker(g, 446, 346, 150, 196, { level: 0.76, liquid: col, inside: (gg, box) => Art.bubbles(gg, box.x0 + 8, box.x1 - 8, box.bottom - 4, box.top + 6, t * 0.4, { n: 4, r: 4 }) });
      // Numbers.
      Art.text(g, sc.name, 400, 46, { font: 'display', size: 44, color: C.ink });
      Art.text(g, 'pH ' + ph.toFixed(1), 190, 130, { font: 'display', size: 66, color: uiText(ph) });
      Art.text(g, '[H₃O⁺] = ' + sci(h) + ' M', 190, 198, { size: 26, color: C.ink });
      Art.text(g, '[OH⁻] = ' + sci(oh) + ' M', 190, 234, { size: 26, color: C.dim });
      const ratio = Math.pow(10, 7 - ph);
      const big = (v) => (v >= 1000 ? Number(v.toPrecision(2)).toLocaleString('en-US') : Number(v.toPrecision(2)).toString());
      const line = Math.abs(ph - 7) < 0.05 ? 'Same as pure water' : ph < 7 ? big(ratio) + ' times more H₃O⁺' : big(1 / ratio) + ' times less H₃O⁺';
      Art.text(g, line, 190, 288, { font: 'display', size: 26, color: ph < 6.95 ? '#FFB199' : ph > 7.05 ? '#A9C2FF' : C.leaf });
      Art.text(g, 'than pure water', 190, 322, { size: 22, color: C.dim, alpha: Math.abs(ph - 7) < 0.05 ? 0 : 1 });
      // Particle view, not to scale.
      const nH = Math.round(lerp(12, 0, ph / 14)), nOH = 12 - nH;
      Art.zoom(g, 470, 262, 662, 196, 124, (gg, cx, cy, R) => {
        for (let i = 0; i < 12; i++) {
          const [dx, dy] = sun(i, 12, R * 0.78);
          const x = cx + dx + wander(i, t) * 4, y = cy + dy + wander(i + 20, t) * 4;
          if (i < nH) hydronium(gg, x, y, 17, { rot: i });
          else hydroxide(gg, x, y, 17, { rot: i * 1.4 });
        }
      }, { rim: col });
      Art.text(g, 'Not to scale', 662, 342, { size: 22, color: C.dim });
      // The scale.
      rainbow(g, SX0, SX1, SY, 28);
      for (let i = 0; i <= 14; i++) Art.text(g, String(i), scX(i), SY + 50, { size: 23, color: i === 7 ? C.leaf : C.ink });
      SUBS.forEach(([v]) => { g.fillStyle = 'rgba(255,255,255,.92)'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2; g.beginPath(); g.arc(scX(v), SY + 14, 5, 0, TAU); g.fill(); g.stroke(); });
      const mx = scX(ph);
      g.fillStyle = '#fff'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(mx, SY + 4); g.lineTo(mx - 15, SY - 22); g.lineTo(mx + 15, SY - 22); g.closePath(); g.fill(); g.stroke();
    },
  });
  Lab.bind('#sc-ph', null, null, (v) => setPH(v, true));
  Lab.$$('#sc-sub button').forEach((b) => b.addEventListener('click', () => { setPH(+b.dataset.value); }));

  /* ---------- Story 2: strong and weak ---------- */
  const STRONG_N = 12;
  Lab.story('#story-acids', {
    title: 'Strong acids and weak acids',
    scenes: [
      {
        say: 'An acid is a <b>proton donor</b>. Here, HCl hands its proton to water. That makes hydronium and leaves behind a chloride ion. The arrow goes one way, because this reaction is complete.',
        dur: 4,
        draw(g, p, t) {
          g.save(); g.globalAlpha *= seg(p, 0, 0.15); Art.formula(g, 'HCl + H2O -> H3O^+ + Cl^-', 400, 42, { size: 42, colorize: true }); g.restore();
          const q = ease.inOut(seg(p, 0.25, 0.65));
          const Cl = [218, 230], O = [560, 230];
          const Hx = lerp(Cl[0] + 72, O[0] - 80, q), Hy = 230 - Math.sin(q * Math.PI) * 88 + q * 8;
          const Hl = [O[0] + 52, O[1] + 66], Hr = [O[0] + 76, O[1] - 44];
          Art.bond(g, O[0], O[1], Hl[0], Hl[1], { width: 9 }); Art.bond(g, O[0], O[1], Hr[0], Hr[1], { width: 9 });
          if (q < 0.3) { g.save(); g.globalAlpha *= clamp(1 - q * 3.3); Art.bond(g, Cl[0], Cl[1], Hx, Hy, { width: 9 }); g.restore(); }
          if (q > 0.7) { g.save(); g.globalAlpha *= clamp(q * 3.3 - 2.3); Art.bond(g, O[0], O[1], Hx, Hy, { width: 9 }); g.restore(); }
          Art.atom(g, Hl[0], Hl[1], 25, 'H', { label: false }); Art.atom(g, Hr[0], Hr[1], 25, 'H', { label: false });
          Art.atom(g, Hx, Hy, 25, 'H', { label: false, glow: 1 });
          const done = q >= 1;
          Art.atom(g, Cl[0], Cl[1], 66, 'Cl', { face: 'happy', look: [1, 0], t, charge: done ? '-' : undefined });
          Art.atom(g, O[0], O[1], 54, 'O', { face: done ? 'grin' : 'happy', look: [-1, 0], t, seed: 2, charge: done ? '+' : undefined });
          Art.text(g, 'Proton', (Cl[0] + O[0]) / 2, 110, { size: 26, color: C.sun, alpha: seg(p, 0.3, 0.42) * (1 - seg(p, 0.6, 0.7)) });
          Art.text(g, 'Chloride', Cl[0], 340, { font: 'display', size: 30, color: C.leaf, alpha: seg(p, 0.66, 0.8) });
          Art.text(g, 'Hydronium', O[0], 340, { font: 'display', size: 30, color: C.pink, alpha: seg(p, 0.66, 0.8) });
          Art.text(g, 'An acid gives. Water takes.', 400, 406, { size: 28, color: C.ink, alpha: seg(p, 0.82, 0.98) });
        },
      },
      {
        say: 'A <b>strong acid</b> does this with every molecule. Look in the beaker: no HCl remains. Only hydronium and chloride. So the hydronium concentration equals the acid concentration.',
        dur: 3.8,
        draw(g, p, t) {
          Art.beaker(g, 134, 382, 190, 210, { level: 0.78, liquid: C.water });
          Art.text(g, '0.10 M HCl', 134, 420, { size: 25 });
          Art.zoom(g, 190, 270, 470, 200, 168, (gg, cx, cy, R) => {
            for (let i = 0; i < STRONG_N; i++) {
              const [dx, dy] = sun(i, STRONG_N, R * 0.74);
              const x = cx + dx, y = cy + dy, q = ease.inOut(seg(p, 0.25 + i * 0.035, 0.4 + i * 0.035));
              const a = i * 1.7;
              const off = 25 * q;
              const wx = wander(i, t) * 3, wy = wander(i + 9, t) * 3;
              if (q < 1) whole(gg, x + wx, y + wy, 17, 'Cl', a, { charge: false });
              if (q > 0) {
                gg.save(); gg.globalAlpha *= q;
                anion(gg, x - Math.cos(a) * off + wx, y - Math.sin(a) * off + wy, 16, 'Cl', { charge: true });
                hydronium(gg, x + Math.cos(a) * off + wx, y + Math.sin(a) * off + wy, 12, { rot: a });
                gg.restore();
              }
            }
          }, { p: seg(p, 0, 0.22) });
          Art.text(g, '100% ionized', 470, 406, { font: 'display', size: 36, color: C.pink, alpha: seg(p, 0.72, 0.9) });
          Art.text(g, 'HCl left:', 720, 150, { size: 26, color: C.dim, alpha: seg(p, 0.72, 0.9) });
          Art.text(g, '0', 720, 204, { font: 'display', size: 62, color: C.pink, alpha: seg(p, 0.72, 0.9) });
        },
      },
      {
        say: 'A <b>weak acid</b> mostly stays whole. In 0.10 M HF, only about 8% of the molecules have ionized at any moment. It is a two-way equilibrium, and the double arrow shows it.',
        dur: 3.8,
        draw(g, p, t) {
          Art.beaker(g, 134, 382, 190, 210, { level: 0.78, liquid: C.water });
          Art.text(g, '0.10 M HF', 134, 420, { size: 25 });
          Art.zoom(g, 190, 270, 470, 200, 168, (gg, cx, cy, R) => {
            const which = Math.floor(t / 1.7) * 5 % STRONG_N;
            const ph = (t / 1.7) % 1, s = clamp(Math.min(ph * 4, (1 - ph) * 4));
            for (let i = 0; i < STRONG_N; i++) {
              const [dx, dy] = sun(i, STRONG_N, R * 0.74);
              const x = cx + dx + wander(i, t) * 3, y = cy + dy + wander(i + 9, t) * 3;
              const a = i * 1.7;
              if (i === which) {
                const off = 25 * s;
                gg.save(); gg.globalAlpha *= 1;
                if (s < 0.4) whole(gg, x, y, 17, 'F', a);
                else {
                  anion(gg, x - Math.cos(a) * off, y - Math.sin(a) * off, 16, 'F', { charge: true });
                  hydronium(gg, x + Math.cos(a) * off, y + Math.sin(a) * off, 12, { rot: a });
                }
                gg.restore();
              } else whole(gg, x, y, 17, 'F', a);
            }
          }, { p: seg(p, 0, 0.22) });
          Art.text(g, 'About 8% ionized', 470, 406, { font: 'display', size: 36, color: C.cyan, alpha: seg(p, 0.5, 0.7) });
          g.save(); g.globalAlpha *= seg(p, 0.6, 0.8); Art.formula(g, 'HF <=> H^+ + F^-', 722, 150, { size: 24, colorize: true }); g.restore();
          Art.text(g, 'One flips', 722, 208, { size: 25, color: C.dim, alpha: seg(p, 0.7, 0.85) });
          Art.text(g, 'at a time', 722, 240, { size: 25, color: C.dim, alpha: seg(p, 0.7, 0.85) });
        },
      },
      {
        say: '<b>Strong</b> is not the same as <b>concentrated</b>. On the left, every molecule has ionized, but there are few of them. On the right, there are many, but almost none have ionized.',
        dur: 3.6,
        draw(g, p, t) {
          const a = seg(p, 0, 0.3), b = seg(p, 0.3, 0.6);
          g.save(); g.globalAlpha *= a;
          panel(g, 24, 84, 386, 362);
          for (let i = 0; i < 3; i++) {
            const [dx, dy] = sun(i, 3, 76);
            const x = 205 + dx + wander(i, t) * 4, y = 222 + dy + wander(i + 5, t) * 4;
            anion(g, x - 28, y, 21, 'Cl', { charge: true });
            hydronium(g, x + 26, y, 16, { rot: i });
          }
          g.restore();
          g.save(); g.globalAlpha *= b;
          panel(g, 414, 84, 776, 362);
          for (let i = 0; i < 18; i++) {
            const col = i % 6, row = Math.floor(i / 6);
            const x = 449 + col * 58 + wander(i, t) * 3, y = 136 + row * 88 + wander(i + 5, t) * 3;
            if (i === 8) { anion(g, x - 18, y, 16, 'F', { charge: true }); hydronium(g, x + 14, y + 16, 11, { rot: 1 }); }
            else whole(g, x, y, 18, 'F', i * 1.3);
          }
          g.restore();
          Art.text(g, 'Strong, but dilute', 205, 46, { font: 'display', size: 34, color: C.pink, alpha: a });
          Art.text(g, 'Weak, but concentrated', 595, 46, { font: 'display', size: 34, color: C.cyan, alpha: b });
          Art.text(g, 'All ionized, few molecules', 205, 402, { size: 25, alpha: a });
          Art.text(g, 'Lots of molecules, few ionized', 595, 402, { size: 25, alpha: b });
        },
      },
      {
        say: 'To compare weak acids, use the <b>acid ionization constant</b>, $K_a$. It is just $K$ for giving a proton to water. A larger $K_a$ means a stronger acid. Each bar here is a power-of-ten scale.',
        dur: 4,
        draw(g, p, t) {
          rich(g, [['K'], ['a', 1], [' =']], 150, 62, { size: 42, color: C.sun, alpha: seg(p, 0, 0.15) });
          Art.text(g, '[H₃O⁺] [A⁻]', 340, 38, { font: 'display', size: 32, color: C.cyan, alpha: seg(p, 0, 0.15) });
          g.fillStyle = Art.alpha(C.ink, seg(p, 0, 0.15)); g.fillRect(238, 61, 204, 4);
          Art.text(g, '[HA]', 340, 88, { font: 'display', size: 32, color: C.pink, alpha: seg(p, 0, 0.15) });
          const rows = [['HF', 6.8e-4, '6.8 × 10⁻⁴'], ['Acetic acid', 1.8e-5, '1.8 × 10⁻⁵'], ['HClO', 3.0e-8, '3.0 × 10⁻⁸'], ['HCN', 6.2e-10, '6.2 × 10⁻¹⁰']];
          rows.forEach((row, i) => {
            const q = ease.out(seg(p, 0.15 + i * 0.16, 0.36 + i * 0.16));
            const y = 152 + i * 70;
            Art.text(g, row[0], 40, y, { font: 'display', size: 30, align: 'left', alpha: q });
            const len = (Math.log10(row[1]) + 11) * 46;
            g.fillStyle = Art.mix(C.pink, C.cyan, i / 3); Art.round(g, 216, y - 24, Math.max(8, len * q), 48, 12); g.fill();
            Art.text(g, row[2], 216 + len * q + 14, y, { size: 26, align: 'left', alpha: q });
          });
          Art.arrow(g, 762, 340, 762, 132, { color: C.sun, w: 6, p: seg(p, 0.75, 0.95) });
          Art.text(g, 'Stronger', 700, 96, { font: 'display', size: 30, color: C.sun, alpha: seg(p, 0.8, 0.95) });
          void t;
        },
      },
      {
        say: 'When an acid loses a proton, what is left can take one back. That leftover is its <b>conjugate base</b>. The two are a pair, tied together by $K_a K_b = K_w$. The stronger the acid, the weaker its conjugate base.',
        dur: 4,
        draw(g, p, t) {
          const y = 176;
          Art.popIn(g, 192, y, seg(p, 0, 0.22), (gg) => whole(gg, 0, 0, 62, 'F', 0.3, { face: 'happy', t, look: [1, 0] }));
          Art.popIn(g, 608, y, seg(p, 0.12, 0.34), (gg) => anion(gg, 0, 0, 62, 'F', { charge: true, face: 'happy', t, look: [-1, 0], seed: 3 }));
          Art.text(g, 'Acid', 192, 54, { font: 'display', size: 34, color: C.pink, alpha: seg(p, 0, 0.22) });
          Art.text(g, 'Conjugate base', 608, 54, { font: 'display', size: 34, color: C.cyan, alpha: seg(p, 0.12, 0.34) });
          Art.arrow(g, 322, y - 28, 478, y - 28, { color: C.pink, w: 8, p: seg(p, 0.3, 0.5) });
          Art.arrow(g, 478, y + 28, 322, y + 28, { color: C.cyan, w: 8, p: seg(p, 0.42, 0.62) });
          Art.text(g, 'loses H⁺', 400, y - 58, { size: 26, color: C.pink, alpha: seg(p, 0.35, 0.5) });
          Art.text(g, 'gains H⁺', 400, y + 60, { size: 26, color: C.cyan, alpha: seg(p, 0.48, 0.62) });
          const a = ease.back(seg(p, 0.66, 0.86));
          if (a > 0) {
            g.save(); g.translate(400, 330); g.scale(a, a);
            g.fillStyle = C.plum2; Art.round(g, -300, -36, 600, 72, 26); g.fill();
            rich(g, [['K'], ['a', 1], [' × K'], ['b', 1], [' = 1.0 × 10⁻¹⁴']], 0, 2, { size: 38, color: C.sun });
            g.restore();
          }
          rich(g, [['For F⁻, K'], ['b', 1], [' = 1.5 × 10⁻¹¹']], 400, 410, { size: 28, color: C.dim, alpha: seg(p, 0.84, 1) });
        },
      },
    ],
  });

  /* ---------- Bench: strong against weak ---------- */
  const WEAK = { HF: { Ka: 6.8e-4, k: 'F', name: 'HF', tex: '\\ce{HF}' }, Ac: { Ka: 1.8e-5, k: 'Ac', name: 'Acetic acid', tex: '\\ce{CH3COOH}' }, HCN: { Ka: 6.2e-10, k: 'CN', name: 'HCN', tex: '\\ce{HCN}' } };
  const ac = { c: 0.1, weak: 'HF' };
  const AC_N = 10;
  function acidCircle(g, cx, cy, R, kind, n, t, strong) {
    // n of AC_N molecules are ionized. In a weak acid, which ones keeps changing.
    const shift = strong ? 0 : Math.floor(t / 1.6);
    const on = new Set();
    for (let j = 0; j < n; j++) on.add((shift * 5 + j * 3) % AC_N);
    const ph = (t / 1.6) % 1, s = strong ? 1 : clamp(ph * 5);
    if (strong) {
      // Everything is ionized: 20 separate ions, each with its own spot.
      for (let i = 0; i < AC_N * 2; i++) {
        const [dx, dy] = sun(i, AC_N * 2, R * 0.82);
        const x = cx + dx + wander(i, t) * 3, y = cy + dy + wander(i + 9, t) * 3;
        if (i % 2) anion(g, x, y, 16, kind, { charge: true });
        else hydronium(g, x, y, 12, { rot: i * 1.7 });
      }
      return;
    }
    for (let i = 0; i < AC_N; i++) {
      const [dx, dy] = sun(i, AC_N, R * 0.72);
      const x = cx + dx + wander(i, t) * 3, y = cy + dy + wander(i + 9, t) * 3;
      const a = i * 1.7;
      if (on.has(i)) {
        const off = 13 + 11 * s;
        anion(g, x - Math.cos(a) * off, y - Math.sin(a) * off, 16, kind, { charge: true });
        hydronium(g, x + Math.cos(a) * off, y + Math.sin(a) * off, 12, { rot: a });
      } else whole(g, x, y, 19, kind, a);
    }
  }
  Lab.stage('#c-acids', {
    h: 470,
    label: 'Two magnifiers side by side, a strong acid fully split into ions and a weak acid mostly whole, each with its pH and percent ionized.',
    draw(g, t) {
      const W = WEAK[ac.weak];
      const hS = waterH(-ac.c);
      const hW = weakH(W.Ka, ac.c);
      const fW = W.Ka / (W.Ka + hW);
      const nW = Math.max(fW > 0.002 ? 1 : 0, Math.round(AC_N * fW));
      Art.text(g, 'HCl', 200, 30, { font: 'display', size: 36, color: C.pink });
      Art.text(g, W.name, 600, 30, { font: 'display', size: 36, color: C.cyan });
      Art.zoom(g, 200, 200, 200, 194, 148, (gg, cx, cy, R) => acidCircle(gg, cx, cy, R, 'Cl', AC_N, t, true), { rim: C.pink });
      Art.zoom(g, 600, 200, 600, 194, 148, (gg, cx, cy, R) => acidCircle(gg, cx, cy, R, W.k, nW, t, false), { rim: C.cyan });
      const pHS = pHof(hS), pHW = pHof(hW);
      Art.text(g, 'pH ' + pHS.toFixed(2), 200, 382, { font: 'display', size: 46, color: uiText(pHS) });
      Art.text(g, 'pH ' + pHW.toFixed(2), 600, 382, { font: 'display', size: 46, color: uiText(pHW) });
      Art.text(g, '100% ionized', 200, 432, { size: 28 });
      const pct = fW * 100;
      Art.text(g, (pct >= 10 ? pct.toFixed(0) : pct >= 1 ? pct.toFixed(1) : pct.toPrecision(2)) + '% ionized', 600, 432, { size: 28 });
    },
  });
  function paintAcids() {
    const W = WEAK[ac.weak];
    const hW = weakH(W.Ka, ac.c), pct = (W.Ka / (W.Ka + hW)) * 100;
    const c = Lab.sig(ac.c, 2);
    Lab.$('#ac-calc').innerHTML = Lab.texString(`<p>Strong acid: $[\\ce{H3O+}]$ is just the molarity, ${c} M. Weak acid: solve $K_a = ${texSci(W.Ka)} = \\dfrac{x^2}{${c} - x}$, which gives $x = ${texSci(hW, 2)}$ M. As you <b>dilute</b> a weak acid, a <b>larger share</b> ionizes. The picture shows 10 molecules, and water molecules are left out.</p>`);
  }
  Lab.bind('#ac-c', '#ac-c-out', (v) => Lab.sig(Math.pow(10, v), 2) + ' M', (v) => { ac.c = Number(Math.pow(10, v).toPrecision(2)); paintAcids(); });
  Lab.segmented('#ac-weak', (v) => { ac.weak = v; paintAcids(); });

  /* ---------- Story 3: buffers ---------- */
  const twoBig = (g, x, y, r, k, kind, t, look) => {
    if (kind === 'HA') whole(g, x, y, r, k, 0.5, { face: 'happy', t, look });
    else anion(g, x, y, r, k, { charge: true, face: 'happy', t, look, seed: 3 });
  };
  Lab.story('#story-buffer', {
    title: 'How a buffer works',
    scenes: [
      {
        say: 'First, the problem. Add 0.010 mol of strong acid to a liter of pure water. Nothing is there to stop it, so the pH crashes from <b>7.00 to 2.00</b>. That is 100,000 times more hydronium.',
        dur: 3.6,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.3, 0.8));
          const pH = lerp(7, 2, q);
          Art.beaker(g, 230, 380, 250, 260, { level: 0.74, liquid: uiColor(pH), inside: (gg, box) => {
            for (let i = 0; i < 14; i++) {
              const a = seg(q, i * 0.06, 0.1 + i * 0.06);
              if (a <= 0) continue;
              const x = box.x0 + 28 + (i % 5) * 46 + wander(i, t) * 4, y = box.top + 28 + Math.floor(i / 5) * 54 + wander(i + 7, t) * 4;
              gg.save(); gg.globalAlpha *= a; hydronium(gg, x, y, 14, { rot: i }); gg.restore();
            }
          } });
          // Drops of acid.
          const dp = seg(p, 0.15, 0.4);
          if (dp > 0 && dp < 1) { Art.ball(g, 230, lerp(40, 200, ease.in(dp)), 12, UI[1]); }
          Art.text(g, 'Plain water', 230, 416, { size: 26 });
          Art.text(g, 'pH ' + pH.toFixed(2), 580, 150, { font: 'display', size: 76, color: uiText(pH) });
          Art.arrow(g, 580, 210, 580, 310, { color: C.red, w: 10, p: seg(p, 0.5, 0.8) });
          Art.text(g, 'Crash!', 580, 346, { font: 'display', size: 44, color: C.red, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: 'A <b>buffer</b> keeps two partners ready: a <b>weak acid</b> (HA) and its <b>conjugate base</b> (A⁻). Here, that is acetic acid and acetate, which chemists shorten to HAc and Ac⁻.',
        dur: 3,
        draw(g, p, t) {
          Art.popIn(g, 210, 196, seg(p, 0, 0.3), (gg) => twoBig(gg, 0, 0, 72, 'Ac', 'HA', t, [1, 0]));
          Art.popIn(g, 590, 196, seg(p, 0.2, 0.5), (gg) => twoBig(gg, 0, 0, 72, 'Ac', 'A', t, [-1, 0]));
          Art.text(g, 'Weak acid', 210, 60, { font: 'display', size: 36, color: C.pink, alpha: seg(p, 0, 0.3) });
          Art.text(g, 'Catches base', 210, 316, { size: 28, alpha: seg(p, 0.45, 0.65) });
          Art.text(g, 'Conjugate base', 590, 60, { font: 'display', size: 36, color: C.cyan, alpha: seg(p, 0.2, 0.5) });
          Art.text(g, 'Catches acid', 590, 316, { size: 28, alpha: seg(p, 0.55, 0.75) });
          Art.text(g, 'Both in the same beaker, in good amounts', 400, 396, { size: 28, color: C.leaf, alpha: seg(p, 0.75, 0.95) });
        },
      },
      {
        say: 'Acid arrives. The <b>base partner</b> catches it right away and becomes more weak acid: $\\ce{H3O+ + A- -> HA + H2O}$. A strong acid has been swapped for a weak one.',
        dur: 4,
        draw(g, p, t) {
          g.save(); g.globalAlpha *= seg(p, 0, 0.15); Art.formula(g, 'H3O^+ + Ac^- -> HAc + H2O', 400, 42, { size: 38 }); g.restore();
          const q = ease.inOut(seg(p, 0.2, 0.62));
          const x = lerp(690, 410, q), y = lerp(120, 206, q);
          anionGrab(g, 340, 224, q, t);
          if (q < 0.97) hydronium(g, x, y, 34, { face: 'wow', t, look: [-1, 0.5] });
          const s = seg(p, 0.62, 0.8);
          if (s > 0) Art.popIn(g, 620, 260, s, (gg) => Art.molecule(gg, 0, 0, 68, 'H2O', { face: 'happy', t }));
          Art.text(g, 'Water', 620, 340, { font: 'display', size: 30, color: C.water, alpha: s });
          Art.text(g, 'Weak acid', 340, 344, { font: 'display', size: 30, color: C.pink, alpha: s });
          Art.text(g, 'Almost no extra hydronium remains', 400, 410, { size: 27, color: C.leaf, alpha: seg(p, 0.8, 0.98) });
        },
      },
      {
        say: 'Base arrives. The <b>acid partner</b> hands over its proton: $\\ce{OH- + HA -> A- + H2O}$. A strong base has been swapped for a weak one. Either way, the wild ion is gone.',
        dur: 4,
        draw(g, p, t) {
          g.save(); g.globalAlpha *= seg(p, 0, 0.15); Art.formula(g, 'OH^- + HAc -> Ac^- + H2O', 400, 42, { size: 38 }); g.restore();
          const q = ease.inOut(seg(p, 0.2, 0.62));
          const x = lerp(690, 468, q), y = lerp(120, 200, q);
          const Hgone = q > 0.8;
          // The acid partner's proton leaves for the hydroxide.
          if (!Hgone) Art.atom(g, 340 + 76, 224 - 30, 36, 'H', { label: false });
          anion(g, 340, 224, 72, 'Ac', { charge: Hgone, face: 'happy', t, look: [1, 0] });
          if (q < 0.97) hydroxide(g, x, y, 36, { rot: 1.2, face: 'wow', t, look: [-1, 0.5] });
          const s = seg(p, 0.62, 0.8);
          if (s > 0) Art.popIn(g, 620, 260, s, (gg) => Art.molecule(gg, 0, 0, 68, 'H2O', { face: 'happy', t }));
          Art.text(g, 'Water', 620, 340, { font: 'display', size: 30, color: C.water, alpha: s });
          Art.text(g, 'Conjugate base', 340, 344, { font: 'display', size: 30, color: C.cyan, alpha: s });
          Art.text(g, 'Almost no extra hydroxide remains', 400, 410, { size: 27, color: C.leaf, alpha: seg(p, 0.8, 0.98) });
        },
      },
      {
        say: 'The pH depends on the <b>ratio</b> of the two partners. A small addition barely changes that ratio, so it barely moves the pH. The <b>Henderson-Hasselbalch</b> equation says so exactly.',
        dur: 4,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.35, 0.65));
          const a0 = 10, b0 = 10, a = a0 + q, b = b0 - q;
          const barX = 90, top = 72, unit = 19;
          const bar = (x, v, color, label) => {
            const h = v * unit;
            g.fillStyle = color; Art.round(g, x, top + 12 * unit - h, 96, h, 10); g.fill();
            Art.text(g, label, x + 48, top + 12 * unit + 30, { font: 'display', size: 30, color });
            Art.text(g, v.toFixed(0), x + 48, top + 12 * unit - h - 22, { font: 'display', size: 34, color: '#fff' });
          };
          bar(barX, a, C.pink, 'HAc'); bar(barX + 130, b, C.cyan, 'Ac⁻');
          const pH = 4.74 + Math.log10(b / a);
          rich(g, [['pH = pK'], ['a', 1], [' + log']], 530, 152, { size: 34, color: C.ink });
          Art.text(g, '[A⁻]', 690, 124, { font: 'display', size: 30, color: C.cyan });
          g.fillStyle = C.ink; g.fillRect(652, 150, 76, 4);
          Art.text(g, '[HA]', 690, 180, { font: 'display', size: 30, color: C.pink });
          Art.text(g, 'One H₃O⁺ arrives', 560, 248, { size: 27, color: C.sun, alpha: seg(p, 0.25, 0.4) });
          Art.text(g, 'pH ' + pH.toFixed(2), 560, 318, { font: 'display', size: 62, color: uiText(pH) });
          Art.text(g, q >= 1 ? 'It only moved from 4.74' : 'Equal partners: pH = 4.74', 560, 382, { size: 27, color: C.leaf });
          void t;
        },
      },
      {
        say: 'Buffers are real and you are full of them. Blood stays at pH 7.35 to 7.45 thanks to a carbonic acid and bicarbonate buffer. But buffers have a limit, called <b>buffer capacity</b>. Use up a partner and pH crashes. Try that next.',
        dur: 3.8,
        draw(g, p, t) {
          const x0 = 70, x1 = 730, y = 150;
          rainbow(g, x0, x1, y, 44, seg(p, 0, 0.2));
          const X = (v) => lerp(x0, x1, v / 14);
          const q = ease.out(seg(p, 0.2, 0.5));
          g.strokeStyle = C.ink; g.lineWidth = 5; g.fillStyle = 'rgba(255,255,255,.35)';
          Art.round(g, X(7.35) - 3, y - 14, (X(7.45) - X(7.35)) + 6, 72, 4); g.fill(); g.stroke();
          Art.text(g, 'Your blood: 7.35 to 7.45', X(7.4), y - 44, { font: 'display', size: 36, color: C.ink, alpha: q });
          for (let i = 0; i <= 14; i += 2) Art.text(g, String(i), X(i), y + 70, { size: 24, alpha: q });
          g.save(); g.globalAlpha *= seg(p, 0.45, 0.65);
          Art.formula(g, 'H2CO3 <=> H^+ + HCO3^-', 340, 302, { size: 40, colorize: true });
          g.restore();
          Art.text(g, 'The carbonic acid and bicarbonate buffer', 340, 352, { size: 26, color: C.dim, alpha: seg(p, 0.5, 0.7) });
          Art.text(g, 'Every buffer has a limit', 340, 404, { font: 'display', size: 32, color: C.sun, alpha: seg(p, 0.72, 0.9) });
          Art.moe(g, 700, 440, 130, 'cheer', { t, flip: true });
        },
      },
    ],
  });
  /** The base partner gets its proton as the hydronium arrives. */
  function anionGrab(g, x, y, q, t) {
    const got = q > 0.8;
    if (got) Art.atom(g, x + 76, y - 30, 36, 'H', { label: false });
    anion(g, x, y, 72, 'Ac', { charge: !got, face: 'happy', t, look: [1, -0.3] });
  }

  /* ---------- Bench: buffer against plain water ---------- */
  const KA_AC = Math.pow(10, -4.74); // About 1.8e-5, and matches the pKa of 4.74 used in the text.
  const MIX = { eq: [10, 10], acid: [15, 5], base: [5, 15] };
  const STEP = 0.01, MAXC = 14;
  const L = { x0: 14, y0: 58, x1: 392, y1: 268 }, Rt = { x0: 408, y0: 58, x1: 786, y1: 268 };
  const bf = { mix: 'eq', net: 0, ha: 10, a: 10, waterIons: [], bufBox: null, watBox: null, drops: [], fx: [], showW: 7, showB: 4.74 };
  const bufferPH = (net) => {
    const [ha, a] = MIX[bf.mix];
    const Ca = (ha + a) * STEP;
    const S = a * STEP + net * STEP;   // Net cations: Na+ from the salt and added NaOH, minus Cl- from added HCl.
    return pHof(mixH(KA_AC, Ca, S));
  };
  const waterPH = (net) => pHof(waterH(net * STEP));
  function buildBoxes() {
    const [ha, a] = MIX[bf.mix];
    bf.bufBox = new Sim.Box({ x0: Rt.x0 + 6, y0: Rt.y0 + 6, x1: Rt.x1 - 6, y1: Rt.y1 - 6, speed: 34, seed: 5 });
    bf.bufBox.add({ n: ha, r: 19, kind: 'HA' }).add({ n: a, r: 19, kind: 'A' });
    bf.watBox = new Sim.Box({ x0: L.x0 + 6, y0: L.y0 + 6, x1: L.x1 - 6, y1: L.y1 - 6, speed: 34, seed: 9 });
    bf.net = 0; bf.drops = []; bf.fx = [];
    paintBuffer();
  }
  function say(html) { Lab.$('#bf-say').innerHTML = '<p>' + Lab.texString(html) + '</p>'; }
  function paintBuffer() {
    const pW = waterPH(bf.net), pB = bufferPH(bf.net);
    const [ha0, a0] = MIX[bf.mix];
    if (bf.net === 0) {
      say(`Each ball in the buffer stands for 0.01 mol, in 1.00 L. It starts with ${(ha0 * STEP).toFixed(2)} mol HAc and ${(a0 * STEP).toFixed(2)} mol Ac⁻, so $\\text{pH} = 4.74 + \\log\\dfrac{${(a0 * STEP).toFixed(2)}}{${(ha0 * STEP).toFixed(2)}} = ${(4.74 + Math.log10(a0 / ha0)).toFixed(2)}$. Plain water starts at 7.00. <b>Add acid or base and compare.</b>`);
      return;
    }
    const added = `${(Math.abs(bf.net) * STEP).toFixed(2)} mol of ${bf.net < 0 ? 'HCl' : 'NaOH'}`;
    const aNow = a0 + bf.net, haNow = ha0 - bf.net;
    const intact = aNow > 0 && haNow > 0;
    const eqn = intact ? ` Henderson-Hasselbalch agrees: $4.74 + \\log\\dfrac{${(aNow * STEP).toFixed(2)}}{${(haNow * STEP).toFixed(2)}} = ${(4.74 + Math.log10(aNow / haNow)).toFixed(2)}$.` : ' <b>The buffer is used up.</b> One partner has run out, so extra ions stay free, and it now behaves much like plain water.';
    say(`You added ${added}. Plain water went to pH <b>${pW.toFixed(2)}</b>. The buffer went to pH <b>${pB.toFixed(2)}</b>.${eqn}`);
  }
  function addIon(kind) {
    if (Math.abs(bf.net + (kind === 'H' ? -1 : 1)) > MAXC) return;
    bf.net += kind === 'H' ? -1 : 1;
    // A drop lands in each beaker.
    bf.drops.push({ kind, side: 'B', x: (Rt.x0 + Rt.x1) / 2 + (Math.random() - 0.5) * 80, y: Rt.y0 - 14, target: null, age: 0 });
    bf.drops.push({ kind, side: 'W', x: (L.x0 + L.x1) / 2 + (Math.random() - 0.5) * 80, y: L.y0 - 14, target: null, age: 0 });
    Lab.sound.pop();
    paintBuffer();
  }
  function stepDrop(d, dt) {
    d.age += dt;
    const box = d.side === 'B' ? bf.bufBox : bf.watBox;
    if (!d.target || !box.particles.includes(d.target)) {
      // A strong ion meets any free opposite ion first, then the buffer partner that can catch it.
      const free = d.kind === 'H' ? 'OH' : 'H3O', partner = d.kind === 'H' ? 'A' : 'HA';
      const pick = (want) => {
        let best = null, bd = 1e12;
        box.particles.forEach((q) => { if (q.kind === want && !q.taken) { const r = (q.x - d.x) ** 2 + (q.y - d.y) ** 2; if (r < bd) { bd = r; best = q; } } });
        return best;
      };
      d.target = pick(free) || (d.side === 'B' ? pick(partner) : null);
      if (d.target) d.target.taken = true;
    }
    const finish = () => {
      d.done = true;
      const q = d.target;
      if (q && (q.kind === 'H3O' || q.kind === 'OH')) {
        box.particles.splice(box.particles.indexOf(q), 1);
        bf.fx.push({ x: d.x, y: d.y, age: 0, seed: Math.random() * 40 });
      } else if (q) {
        q.kind = d.kind === 'H' ? 'HA' : 'A'; q.taken = false;
        bf.fx.push({ x: d.x, y: d.y, age: 0, seed: Math.random() * 40 });
      } else {
        box.add({ n: 1, r: 13, kind: d.kind === 'H' ? 'H3O' : 'OH' });
        const nw = box.particles[box.particles.length - 1];
        nw.x = d.x; nw.y = Math.max(box.y0 + 14, d.y);
      }
    };
    const tx = d.target ? d.target.x : d.x, ty = d.target ? d.target.y : (d.side === 'B' ? Rt.y0 + 50 : L.y0 + 50);
    const dx = tx - d.x, dy = ty - d.y, len = Math.hypot(dx, dy) || 1, sp = 420 * dt;
    if (len < 18 + sp) finish(); else { d.x += (dx / len) * sp; d.y += (dy / len) * sp; }
  }
  function drawParticle(g, q) {
    if (q.kind === 'HA') whole(g, q.x, q.y, 19, 'Ac', q.rot);
    else if (q.kind === 'A') anion(g, q.x, q.y, 19, 'Ac', { charge: true });
    else if (q.kind === 'H3O') hydronium(g, q.x, q.y, 13, { rot: q.rot });
    else hydroxide(g, q.x, q.y, 13, { rot: q.rot });
  }
  function bufChart(g) {
    const x0 = 66, x1 = 786, y0 = 472, y1 = 302, span = 0.14;
    const X = (n) => lerp(x0, x1, (n + span) / (2 * span)), Y = (v) => lerp(y0, y1, v / 14);
    g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(x0, y1, x1 - x0, y0 - y1);
    g.fillStyle = C.dim; g.fillRect(x0 - 3, y1, 3, y0 - y1 + 3); g.fillRect(x0, y0, x1 - x0, 3);
    [0, 7, 14].forEach((v) => { Art.text(g, String(v), x0 - 10, Y(v) + (v === 14 ? 8 : v === 0 ? -8 : 0), { size: 20, color: C.dim, align: 'right' }); if (v === 7) { g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x0, Y(7), x1 - x0, 2); } });
    g.save(); g.translate(20, (y0 + y1) / 2); g.rotate(-Math.PI / 2); Art.text(g, 'pH', 0, 0, { size: 22, color: C.dim }); g.restore();
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(X(0) - 1, y1, 2, y0 - y1);
    Art.text(g, 'More HCl added', x0 + 96, y0 + 22, { size: 21, color: '#FFB199' });
    Art.text(g, 'None', X(0), y0 + 22, { size: 21, color: C.dim });
    Art.text(g, 'More NaOH added', x1 - 106, y0 + 22, { size: 21, color: '#A9C2FF' });
    const line = (fn, color, w) => {
      g.beginPath();
      for (let i = 0; i <= 160; i++) {
        const n = -14 + (i / 160) * 28;
        const x = X(n * STEP), y = Y(fn(n));
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.strokeStyle = color; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke();
    };
    line(waterPH, C.violet, 5);
    line(bufferPH, C.sun, 6);
    Art.ball(g, X(bf.net * STEP), Y(bf.showW), 11, C.violet);
    Art.ball(g, X(bf.net * STEP), Y(bf.showB), 11, C.sun);
    Art.text(g, 'Plain water', X(0.05), Y(11), { size: 23, color: C.violet });
    Art.text(g, 'Buffer: nearly flat', X(0.05), Y(7.6), { size: 23, color: C.sun });
  }
  buildBoxes();
  const bufferStage = Lab.stage('#c-buffer', {
    h: 506,
    label: 'Two beakers of particles, plain water on the left and a buffer on the right, with their pH values above a graph of pH against acid or base added.',
    draw(g, t, dt) {
      bf.showW = lerp(bf.showW, waterPH(bf.net), dt > 0 ? clamp(dt * 7) : 1);
      bf.showB = lerp(bf.showB, bufferPH(bf.net), dt > 0 ? clamp(dt * 7) : 1);
      if (dt > 0) {
        bf.bufBox.step(dt); bf.watBox.step(dt);
        bf.drops.forEach((d) => stepDrop(d, dt));
        bf.drops = bf.drops.filter((d) => !d.done);
        bf.fx.forEach((f) => { f.age += dt; });
        bf.fx = bf.fx.filter((f) => f.age < 0.8);
      }
      const head = (x, name, ph, color) => {
        Art.text(g, name, x + 8, 30, { font: 'display', size: 28, align: 'left', color });
        Art.pill(g, 'pH ' + ph.toFixed(2), x + 370, 30, { size: 26, color: uiColor(ph), text: '#fff', font: 'display', align: 'right' });
      };
      head(L.x0, 'Plain water', bf.showW, C.violet);
      head(Rt.x0, 'Acetate buffer', bf.showB, C.sun);
      panel(g, L.x0, L.y0, L.x1, L.y1); panel(g, Rt.x0, Rt.y0, Rt.x1, Rt.y1);
      bf.watBox.particles.forEach((q) => drawParticle(g, q));
      bf.bufBox.particles.forEach((q) => drawParticle(g, q));
      if (!bf.watBox.particles.length && !bf.drops.some((d) => d.side === 'W')) Art.text(g, 'Just water, no spare ions', (L.x0 + L.x1) / 2, (L.y0 + L.y1) / 2, { size: 25, color: C.dim });
      bf.drops.forEach((d) => {
        if (d.kind === 'H') hydronium(g, d.x, d.y, 16, { rot: d.age * 3 });
        else hydroxide(g, d.x, d.y, 16, { rot: d.age * 3 });
      });
      bf.fx.forEach((f) => Art.burst(g, f.x, f.y, f.age / 0.8, { n: 10, r: 46, size: 8, seed: f.seed, colors: [C.water, '#fff', C.sun] }));
      bufChart(g);
      void t;
    },
  });
  Lab.$('#bf-acid').addEventListener('click', () => { addIon('H'); if (!bufferStage.playing) bufferStage.play(); });
  Lab.$('#bf-base').addEventListener('click', () => { addIon('OH'); if (!bufferStage.playing) bufferStage.play(); });
  Lab.$('#bf-reset').addEventListener('click', buildBoxes);
  Lab.segmented('#bf-mix', (v) => { bf.mix = v; buildBoxes(); });
});
