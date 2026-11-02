/* Lesson 9.2: The ideal gas law. Story gas is a pure function of time; benches use Sim.Box. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, rand, wander } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const R_GAS = 0.08206; // L atm / (mol K)

  /* ---------- Shared drawing helpers ---------- */
  /** Art.zoom draws an arc of radius R - 7, which throws while the lens is still tiny. Skip those few frames. */
  const zoom = (g, fx, fy, cx, cy, r, inside, o = {}) => { if (r * ease.back(clamp(o.p === undefined ? 1 : o.p)) > 8) Art.zoom(g, fx, fy, cx, cy, r, inside, o); };
  const steady = (t, v, w, h) => ({ phx: (t * v) / w, phy: (t * v) / h, ratex: v / w, ratey: v / h });
  function spark(g, x, y, age) {
    const a = 1 - age;
    g.save();
    g.globalAlpha *= a;
    g.fillStyle = C.sun; Art.star(g, x, y, 15 * (0.5 + 0.5 * a), age * 2);
    g.fillStyle = '#fff'; Art.star(g, x, y, 7 * (0.5 + 0.5 * a), age * 2 + 0.4);
    g.restore();
  }
  const drawParticle = (g, f, x, y, bond, rot) => {
    if (Art.moleculeData(f)) Art.molecule(g, x, y, bond, f, { rot, style: 'fill', atomScale: 1.28, labels: false });
    else Art.atom(g, x, y, bond * 0.82, f, { label: false });
  };
  /** Bouncing molecules inside box, pure in t. formula may be a function of the index. */
  function gasField(g, box, n, m, o = {}) {
    const seed = o.seed || 1, r = o.r || 15, bond = o.bond || 13;
    const w = Math.max(1, box.x1 - box.x0 - 2 * r), h = Math.max(1, box.y1 - box.y0 - 2 * r);
    for (let i = 0; i < n; i++) {
      const kx = 0.6 + rand(seed + i * 1.31) * 0.8, ky = 0.6 + rand(seed + i * 2.17) * 0.8;
      const u = rand(seed + i * 3.7) * 2 + m.phx * kx, v = rand(seed + i * 5.9) * 2 + m.phy * ky;
      const mu = ((u % 2) + 2) % 2, mv = ((v % 2) + 2) % 2;
      const x = box.x0 + r + w * (mu < 1 ? mu : 2 - mu), y = box.y0 + r + h * (mv < 1 ? mv : 2 - mv);
      if (o.sparks !== false) {
        const ax = (mu % 1) / (m.ratex * kx), ay = (mv % 1) / (m.ratey * ky), fl = 0.17;
        if (ax < fl) spark(g, mu < 1 ? box.x0 : box.x1, y, ax / fl);
        if (ay < fl) spark(g, x, mv < 1 ? box.y0 : box.y1, ay / fl);
      }
      const f = typeof o.formula === 'function' ? o.formula(i) : (o.formula || 'N2');
      drawParticle(g, f, x, y, bond, rand(seed + i) * 6.28 + (m.phx + m.phy) * 0.9 * (0.5 + rand(i)));
    }
  }
  function gauge(g, x, y, R, val, o = {}) {
    const max = o.max || 10, step = o.step || 2, A0 = Math.PI * 0.75, SW = Math.PI * 1.5;
    const ang = (v) => A0 + SW * clamp(v / max, 0, 1.03);
    g.save();
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.arc(x + 2, y + 5, R + 1, 0, TAU); g.fill();
    const b = g.createLinearGradient(x - R, y - R, x + R, y + R);
    b.addColorStop(0, '#F1EDFB'); b.addColorStop(0.5, '#9D97B9'); b.addColorStop(1, '#514B6C');
    g.fillStyle = b; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill(); g.stroke();
    const f = g.createRadialGradient(x, y - R * 0.3, R * 0.1, x, y, R * 0.92);
    f.addColorStop(0, '#3C2A68'); f.addColorStop(1, '#170C29');
    g.fillStyle = f; g.beginPath(); g.arc(x, y, R * 0.9, 0, TAU); g.fill();
    const band = (a, c, col) => { g.strokeStyle = col; g.lineWidth = R * 0.075; g.beginPath(); g.arc(x, y, R * 0.8, ang(a), ang(c)); g.stroke(); };
    band(0, max * 0.6, C.leaf); band(max * 0.6, max * 0.85, C.sun); band(max * 0.85, max, C.red);
    g.lineCap = 'round';
    for (let v = 0; v <= max + 1e-6; v += step / 2) {
      const a = ang(v), major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
      g.strokeStyle = major ? '#fff' : 'rgba(255,255,255,.55)'; g.lineWidth = major ? 3 : 2;
      g.beginPath(); g.moveTo(x + Math.cos(a) * R * 0.86, y + Math.sin(a) * R * 0.86);
      g.lineTo(x + Math.cos(a) * R * (major ? 0.7 : 0.75), y + Math.sin(a) * R * (major ? 0.7 : 0.75)); g.stroke();
      if (major) Art.text(g, String(Math.round(v * 10) / 10), x + Math.cos(a) * R * 0.53, y + Math.sin(a) * R * 0.53, { size: 20, color: '#F2ECFF' });
    }
    Art.text(g, o.unit || 'atm', x, y + R * 0.32, { size: 20, color: C.dim });
    const a = ang(val);
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = C.pink; g.beginPath(); g.moveTo(-R * 0.1, -6.5); g.lineTo(R * 0.74, 0); g.lineTo(-R * 0.1, 6.5); g.closePath(); g.fill();
    g.restore();
    g.fillStyle = '#E8E4F5'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(x, y, R * 0.1, 0, TAU); g.fill(); g.stroke();
    if (o.readout !== false) {
      const lw = o.lcdW || 124, lh = o.lcdH || 38, ly = y + R * 0.62;
      g.fillStyle = '#0F2A1E'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      Art.round(g, x - lw / 2, ly, lw, lh, 9); g.fill(); g.stroke();
      Art.text(g, o.readout || Lab.fmt(val, 2) + ' atm', x, ly + lh / 2 + 1, { size: o.lcdSize || 25, color: '#6CFFAF', font: 'display' });
    }
    g.restore();
  }
  function balloon(g, x, y, rx, ry, col = '#FF4FA3', o = {}) {
    const tie = o.string === undefined ? 90 : o.string;
    if (tie) {
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(x, y + ry + 8); g.bezierCurveTo(x - 14, y + ry + tie * 0.4, x + 14, y + ry + tie * 0.65, x, y + ry + tie); g.stroke();
    }
    g.fillStyle = Art.mix(col, '#000000', 0.2);
    g.beginPath(); g.moveTo(x - 8, y + ry + 12); g.lineTo(x + 8, y + ry + 12); g.lineTo(x, y + ry - 2); g.closePath(); g.fill();
    const gr = g.createRadialGradient(x - rx * 0.35, y - ry * 0.4, rx * 0.1, x, y, Math.max(rx, ry) * 1.1);
    gr.addColorStop(0, Art.mix(col, '#ffffff', 0.62)); gr.addColorStop(0.5, col); gr.addColorStop(1, Art.mix(col, '#2A0A3A', 0.45));
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.beginPath(); g.ellipse(x - rx * 0.42, y - ry * 0.5, rx * 0.16, ry * 0.11, -0.6, 0, TAU); g.fill();
  }
  /** Stacked fraction in stage text. */
  function frac(g, top, bot, x, y, o = {}) {
    const size = o.size || 30;
    g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
    const w = Math.max(g.measureText(top).width, g.measureText(bot).width) + 12;
    Art.text(g, top, x, y - size * 0.62, { font: 'display', size, color: o.color, alpha: o.alpha });
    Art.text(g, bot, x, y + size * 0.72, { font: 'display', size, color: o.color, alpha: o.alpha });
    g.save(); g.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    g.strokeStyle = o.color || C.ink; g.lineWidth = 3.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - w / 2, y + 1); g.lineTo(x + w / 2, y + 1); g.stroke();
    g.restore();
    return w;
  }
  const tokenCol = { P: C.pink, V: C.cyan, n: C.leaf, R: C.violet, T: C.fire };

  /* ---------- Story 1: four laws become one ---------- */
  const lawCard = (g, x, y, w, h, name, lines, col, a) => {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(14,6,30,.6)'; Art.round(g, x, y, w, h, 18); g.fill();
    g.strokeStyle = Art.alpha(col, 0.85); g.lineWidth = 3; g.stroke();
    Art.text(g, name, x + w / 2, y + 30, { font: 'display', size: 28, color: col });
    Art.text(g, lines, x + w / 2, y + 82, { font: 'display', size: 40, color: C.ink });
    g.restore();
  };
  const eqTerm = (g, ch, x, y, size, a = 1) => Art.text(g, ch, x, y, { font: 'display', size, color: tokenCol[ch] || C.ink, alpha: a });
  Lab.story('#story-merge', {
    title: 'Stacking the laws',
    scenes: [
      {
        say: 'Remember three of the laws. More pressure, less volume. More temperature, more volume. More moles, more volume. All three talk about <b>volume</b>.',
        dur: 3.2,
        draw(g, p, t) {
          const cards = [[30, 'Boyle', 'V ∝ 1/P', C.pink, 'P'], [285, 'Charles', 'V ∝ T', C.fire, 'T'], [540, 'Avogadro', 'V ∝ n', C.leaf, 'n']];
          cards.forEach(([x, name, line, col], i) => lawCard(g, x, 36, 230, 130, name, line, col, ease.out(seg(p, 0.05 + i * 0.2, 0.25 + i * 0.2))));
          // A small live picture under each card.
          const pic = (cx, i, a) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            const u = (Math.sin(t * 1.5 + i) + 1) / 2, f = 404, hw = 70;
            const hd = i === 0 ? lerp(60, 170, u) : lerp(70, 170, u);
            const box = { x0: cx - hw, x1: cx + hw, y0: f - hd, y1: f };
            const count = i === 2 ? Math.round(lerp(4, 11, u)) : 7;
            const sp = i === 1 ? lerp(70, 200, u) : 120;
            g.fillStyle = 'rgba(214,240,255,.08)'; g.fillRect(box.x0, box.y0, hw * 2, hd);
            gasField(g, box, count, steady(t, sp, 110, 110), { seed: 3 + i, bond: 11, r: 14, sparks: false });
            g.strokeStyle = C.glass; g.lineWidth = 4; g.lineCap = 'round';
            g.beginPath(); g.moveTo(cx - hw, 214); g.lineTo(cx - hw, f); g.lineTo(cx + hw, f); g.lineTo(cx + hw, 214); g.stroke();
            g.fillStyle = '#B2ACC9'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
            Art.round(g, cx - hw + 3, f - hd - 13, hw * 2 - 6, 13, 3); g.fill(); g.stroke();
            if (i === 1) { for (let k = 0; k < 4; k++) Art.flame(g, cx - 42 + k * 28, f + 34, 14 + u * 16, t + k, {}); }
            g.restore();
          };
          cards.forEach(([x], i) => pic(x + 115, i, seg(p, 0.15 + i * 0.2, 0.35 + i * 0.2)));
        },
      },
      {
        say: 'If volume grows with each of those, it grows with all of them at once. Stack them and you get one big <b>proportion</b>.',
        dur: 3.4,
        draw(g, p) {
          const q = ease.inOut(seg(p, 0.15, 0.7));
          const cards = [[30, 'Boyle', C.pink], [285, 'Charles', C.fire], [540, 'Avogadro', C.leaf]];
          cards.forEach(([x, name, col]) => lawCard(g, x, 36, 230, 96, name, '', col, 1 - seg(p, 0.75, 1) * 0.5));
          // Tokens leave the cards and land in the fraction.
          const dest = { n: [400, 262], T: [448, 262], P: [424, 348] };
          const from = { n: [655, 110], T: [400, 110], P: [175, 110] };
          ['n', 'T', 'P'].forEach((k, i) => {
            const qi = ease.inOut(seg(p, 0.15 + i * 0.12, 0.55 + i * 0.12));
            eqTerm(g, k, lerp(from[k][0], dest[k][0], qi), lerp(from[k][1], dest[k][1], qi), lerp(40, 72, qi));
          });
          const a = seg(p, 0.55, 0.8);
          eqTerm(g, 'V', 262, 304, 78, a);
          Art.text(g, '∝', 332, 304, { font: 'display', size: 62, alpha: a });
          g.save(); g.globalAlpha *= seg(p, 0.5, 0.75);
          g.strokeStyle = C.ink; g.lineWidth = 6; g.lineCap = 'round';
          g.beginPath(); g.moveTo(372, 306); g.lineTo(478, 306); g.stroke();
          g.restore();
          void q;
          Art.text(g, 'Volume goes up with n and T, and down with P.', 400, 414, { size: 27, color: C.dim, alpha: seg(p, 0.78, 0.95) });
        },
      },
      {
        say: 'To turn a proportion into an equation, you need a constant. We call it <b>R</b>, the gas constant. Then multiply both sides by P, and there it is.',
        dur: 3.8,
        draw(g, p, t) {
          const a = seg(p, 0.05, 0.25), b = seg(p, 0.3, 0.55), c = seg(p, 0.6, 0.85);
          // Line 1: V = R n T / P
          g.save(); g.globalAlpha *= a * (1 - 0.55 * seg(p, 0.55, 0.7));
          eqTerm(g, 'V', 240, 92, 54); Art.text(g, '=', 292, 92, { font: 'display', size: 50 });
          eqTerm(g, 'n', 346, 58, 50); eqTerm(g, 'R', 386, 58, 50); eqTerm(g, 'T', 426, 58, 50);
          g.strokeStyle = C.ink; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(320, 94); g.lineTo(452, 94); g.stroke();
          eqTerm(g, 'P', 386, 130, 50);
          g.restore();
          Art.pill(g, 'R is new', 610, 58, { size: 24, color: C.violet, text: '#1A0F2E', alpha: a });
          // The P moves across.
          const mv = ease.inOut(seg(p, 0.3, 0.55));
          if (b > 0 && c < 1) {
            Art.arrow(g, 380, 150, 230, 222, { color: C.sun, w: 6, curve: 26, p: b, alpha: 1 - c });
            Art.text(g, '× P on both sides', 480, 196, { size: 27, color: C.sun, alpha: b * (1 - c) });
            eqTerm(g, 'P', lerp(386, 230, mv), lerp(130, 248, mv), lerp(50, 60, mv), 1 - c);
          }
          // Final result.
          if (c > 0) {
            const s = ease.back(c);
            g.save(); g.translate(400, 300); g.scale(s, s);
            Art.glow(g, 0, 0, 280, C.pink, 0.3 + 0.06 * Math.sin(t * 2.5));
            const letters = [['P', -212], ['V', -144], ['=', -62], ['n', 26], ['R', 104], ['T', 184]];
            letters.forEach(([ch, x]) => Art.text(g, ch, x, 0, { font: 'display', size: 118, color: tokenCol[ch] || C.ink }));
            g.restore();
          }
        },
      },
      {
        say: 'Name every part, with its unit. <b>P</b> in atmospheres, <b>V</b> in liters, <b>n</b> in moles, <b>T</b> in Kelvin. <b>R</b> ties those units together.',
        dur: 3.4,
        draw(g, p, t) {
          const cols = [['P', 'pressure', 'atm', 78], ['V', 'volume', 'L', 234], ['n', 'moles', 'mol', 400], ['R', 'gas constant', '0.08206', 566], ['T', 'temperature', 'K, not °C!', 722]];
          Art.text(g, '=', 317, 80, { font: 'display', size: 76 });
          cols.forEach(([ch, name, unit, x], i) => {
            const a = ease.out(seg(p, 0.05 + i * 0.13, 0.22 + i * 0.13));
            if (a <= 0) return;
            Art.text(g, ch, x, 80, { font: 'display', size: 98, color: tokenCol[ch] });
            g.strokeStyle = Art.alpha(tokenCol[ch], a * 0.8); g.lineWidth = 4; g.setLineDash([6, 7]);
            g.beginPath(); g.moveTo(x, 138); g.lineTo(x, 172); g.stroke(); g.setLineDash([]);
            // Icon for each letter.
            const iy = 240;
            g.save(); g.globalAlpha *= a;
            if (ch === 'P') gauge(g, x, iy, 54, 1 + Math.sin(t) * 0.25, { max: 4, step: 2, readout: false, unit: ' ' });
            if (ch === 'V') {
              const u = 62 + Math.sin(t * 1.3) * 6;
              g.fillStyle = Art.alpha(C.cyan, 0.2); g.strokeStyle = C.cyan; g.lineWidth = 4;
              g.beginPath(); g.rect(x - u / 2 - 6, iy - u / 2 + 6, u, u); g.fill(); g.stroke();
              g.beginPath(); g.moveTo(x - u / 2 - 6, iy - u / 2 + 6); g.lineTo(x - u / 2 + 8, iy - u / 2 - 8); g.lineTo(x + u / 2 + 8, iy - u / 2 - 8); g.lineTo(x + u / 2 - 6, iy - u / 2 + 6); g.moveTo(x + u / 2 + 8, iy - u / 2 - 8); g.lineTo(x + u / 2 + 8, iy + u / 2 - 8); g.lineTo(x + u / 2 - 6, iy + u / 2 + 6); g.stroke();
            }
            if (ch === 'n') for (let k = 0; k < 6; k++) Art.atom(g, x - 36 + (k % 3) * 36 + wander(k, t) * 2, iy - 18 + Math.floor(k / 3) * 36 + wander(k + 7, t) * 2, 15, 'N', { label: false });
            if (ch === 'R') {
              g.fillStyle = C.plum2; g.strokeStyle = C.violet; g.lineWidth = 4;
              Art.round(g, x - 50, iy - 40, 100, 80, 18); g.fill(); g.stroke();
              Art.text(g, 'R', x, iy + 2, { font: 'display', size: 50, color: C.violet });
            }
            if (ch === 'T') Art.thermometer(g, x, iy - 58, 92, 0.65, { w: 15, ticks: false });
            g.restore();
            Art.text(g, name, x, 330, { size: name.length > 8 ? 21 : 24, alpha: a });
            Art.text(g, unit, x, 370, { font: 'display', size: 28, color: tokenCol[ch], alpha: a });
          });
          Art.text(g, 'Pressure and volume on one side. Everything else on the other.', 400, 422, { size: 24, color: C.dim, alpha: seg(p, 0.85, 1) });
        },
      },
      {
        say: 'R has two common values, and they are the same quantity in different units, like 1 foot and 12 inches. Use <b>0.08206</b> with atm and liters. Use <b>8.314</b> when you need joules.',
        speak: 'R has two common values, and they are the same quantity in different units, like one foot and twelve inches. Use 0.08206 with atmospheres and liters. Use 8.314 when you need joules.',
        dur: 3.4,
        draw(g, p, t) {
          const card = (x, big, unit, use1, use2, col, a) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            g.fillStyle = 'rgba(14,6,30,.62)'; Art.round(g, x, 34, 348, 268, 22); g.fill();
            g.strokeStyle = Art.alpha(col, 0.9); g.lineWidth = 4; g.stroke();
            Art.text(g, 'R =', x + 174, 72, { font: 'display', size: 32, color: C.dim });
            Art.text(g, big, x + 174, 126, { font: 'display', size: 62, color: col });
            Art.text(g, unit, x + 174, 182, { size: 26 });
            Art.text(g, use1, x + 174, 234, { size: 24, color: C.dim });
            Art.text(g, use2, x + 174, 266, { size: 24, color: C.dim });
            g.restore();
          };
          card(30, '0.08206', 'L·atm / (mol·K)', 'for most gas problems:', 'atm and liters', C.violet, ease.out(seg(p, 0.05, 0.3)));
          card(422, '8.314', 'J / (mol·K)', 'for energy and speed,', 'and for kPa with liters', C.leaf, ease.out(seg(p, 0.3, 0.55)));
          const c = seg(p, 0.6, 0.8);
          Art.text(g, '=', 400, 168, { font: 'display', size: 54, color: C.sun, alpha: c });
          if (c > 0) {
            g.fillStyle = Art.alpha(C.plum2, 0.95 * c); Art.round(g, 118, 334, 400, 84, 20); g.fill();
            Art.text(g, 'because 1 L·atm = 101.325 J', 318, 376, { size: 27, alpha: c });
          }
          Art.moe(g, 660, 436, 120, 'point', { t, flip: true });
        },
      },
    ],
  });

  /* ---------- Bench: the PV = nRT machine ---------- */
  const calcBox = new Sim.Box({ x0: 50, x1: 262, y0: 100, y1: 372, speed: 150, seed: 5 });
  const calc = { solve: 'V', pu: 'atm', vu: 'L', tu: 'C', P: 1, V: 24.5, n: 1, T: 298.15, ok: true, shownV: 200, flash: 0, gaugeP: 1 };
  const PU = { atm: 1, mmHg: 760, torr: 760, kPa: 101.325 };
  const VU = { L: 1, mL: 1000 };
  const fld = { P: Lab.$('#calc-p'), V: Lab.$('#calc-v'), n: Lab.$('#calc-n'), T: Lab.$('#calc-t') };
  const sigT = (x, sf = 4) => Lab.sig(x, sf).replace(/ × 10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (m, e) => ` \\times 10^{${e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '-0123456789'['⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)])}}`);
  const clean = (x, sf = 4) => (Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3 ? sigT(x, sf) : String(+x.toPrecision(sf)));
  function solveCalc() {
    const read = (k) => parseFloat(fld[k].value);
    const inP = read('P'), inV = read('V'), inN = read('n'), inT = read('T');
    const unknown = calc.solve;
    const pAtm = inP / PU[calc.pu], vL = inV / VU[calc.vu], tK = calc.tu === 'C' ? inT + 273.15 : inT;
    const bad = [];
    if (unknown !== 'P' && !(pAtm > 0)) bad.push('Pressure must be above zero.');
    if (unknown !== 'V' && !(vL > 0)) bad.push('Volume must be above zero.');
    if (unknown !== 'n' && !(inN > 0)) bad.push('Moles must be above zero.');
    if (unknown !== 'T' && !(tK > 0)) bad.push('That temperature is at or below absolute zero, which is impossible.');
    calc.ok = !bad.length;
    const foot = Lab.$('#calc-steps');
    if (!calc.ok) { foot.innerHTML = `<p><b>Check your numbers.</b> ${bad.join(' ')}</p>`; return; }
    const res = { P: pAtm, V: vL, n: inN, T: tK };
    const lines = [];
    if (unknown !== 'P' && calc.pu !== 'atm') lines.push(`Pressure to atm: $${clean(inP)}\\ \\cancel{\\text{${calc.pu}}} \\times \\dfrac{1\\text{ atm}}{${PU[calc.pu]}\\ \\cancel{\\text{${calc.pu}}}} = ${clean(pAtm)}\\text{ atm}$.`);
    if (unknown !== 'V' && calc.vu !== 'L') lines.push(`Volume to liters: $${clean(inV)}\\ \\cancel{\\text{mL}} \\times \\dfrac{1\\text{ L}}{1000\\ \\cancel{\\text{mL}}} = ${clean(vL)}\\text{ L}$.`);
    if (unknown !== 'T' && calc.tu === 'C') lines.push(`Temperature to Kelvin: $T = ${clean(inT, 5)} + 273.15 = ${clean(tK, 5)}\\text{ K}$.`);
    const nS = clean(inN), tS = clean(tK, 5), pS = clean(pAtm), vS = clean(vL);
    const Rs = '0.08206';
    let tex, ans;
    if (unknown === 'P') {
      res.P = (inN * R_GAS * tK) / vL; ans = res.P;
      lines.push('Divide both sides by $V$: $P = \\dfrac{nRT}{V}$.');
      tex = `P = \\dfrac{(${nS}\\ \\cancel{\\text{mol}})\\left(${Rs}\\ \\dfrac{\\cancel{\\text{L}}\\text{ atm}}{\\cancel{\\text{mol}}\\ \\cancel{\\text{K}}}\\right)(${tS}\\ \\cancel{\\text{K}})}{${vS}\\ \\cancel{\\text{L}}} = \\mathbf{${clean(ans, 3)}\\text{ atm}}`;
    } else if (unknown === 'V') {
      res.V = (inN * R_GAS * tK) / pAtm; ans = res.V;
      lines.push('Divide both sides by $P$: $V = \\dfrac{nRT}{P}$.');
      tex = `V = \\dfrac{(${nS}\\ \\cancel{\\text{mol}})\\left(${Rs}\\ \\dfrac{\\text{L}\\ \\cancel{\\text{atm}}}{\\cancel{\\text{mol}}\\ \\cancel{\\text{K}}}\\right)(${tS}\\ \\cancel{\\text{K}})}{${pS}\\ \\cancel{\\text{atm}}} = \\mathbf{${clean(ans, 3)}\\text{ L}}`;
    } else if (unknown === 'n') {
      res.n = (pAtm * vL) / (R_GAS * tK); ans = res.n;
      lines.push('Divide both sides by $RT$: $n = \\dfrac{PV}{RT}$.');
      tex = `n = \\dfrac{(${pS}\\ \\cancel{\\text{atm}})(${vS}\\ \\cancel{\\text{L}})}{\\left(${Rs}\\ \\dfrac{\\cancel{\\text{L}}\\ \\cancel{\\text{atm}}}{\\text{mol}\\ \\cancel{\\text{K}}}\\right)(${tS}\\ \\cancel{\\text{K}})} = \\mathbf{${clean(ans, 3)}\\text{ mol}}`;
    } else {
      res.T = (pAtm * vL) / (inN * R_GAS); ans = res.T;
      lines.push('Divide both sides by $nR$: $T = \\dfrac{PV}{nR}$.');
      tex = `T = \\dfrac{(${pS}\\ \\cancel{\\text{atm}})(${vS}\\ \\cancel{\\text{L}})}{(${nS}\\ \\cancel{\\text{mol}})\\left(${Rs}\\ \\dfrac{\\cancel{\\text{L}}\\ \\cancel{\\text{atm}}}{\\cancel{\\text{mol}}\\text{ K}}\\right)} = \\mathbf{${clean(ans, 3)}\\text{ K}}`;
    }
    const after = [];
    if (unknown === 'P' && calc.pu !== 'atm') after.push(`In your unit: $${clean(ans, 3)}\\text{ atm} = ${clean(ans * PU[calc.pu], 3)}\\text{ ${calc.pu}}$.`);
    if (unknown === 'V' && calc.vu !== 'L') after.push(`In your unit: $${clean(ans, 3)}\\text{ L} = ${clean(ans * 1000, 3)}\\text{ mL}$.`);
    if (unknown === 'T' && calc.tu === 'C') after.push(`In Celsius: $${clean(ans, 3)} - 273.15 = ${clean(ans - 273.15, 3)}$ °C.`);
    foot.innerHTML = Lab.texString(`<ol style="margin:0;padding-left:1.3em">${lines.map((l) => `<li>${l}</li>`).join('')}<li>Put in the numbers. Watch every unit but one cancel:<div class="calc-line" data-overflow-ok style="overflow-x:auto">$$${tex}$$</div></li>${after.map((l) => `<li>${l}</li>`).join('')}</ol>`);
    Object.assign(calc, { P: res.P, V: res.V, n: res.n, T: res.T });
    // Put the answer in the field that is being solved for.
    const shown = { P: res.P * PU[calc.pu], V: res.V * VU[calc.vu], n: res.n, T: calc.tu === 'C' ? res.T - 273.15 : res.T }[unknown];
    fld[unknown].value = +shown.toPrecision(4);
    calc.flash = 1;
    calcStage && calcStage.redraw();
  }
  const fmtVal = (x) => (Math.abs(x) >= 1e4 || (Math.abs(x) < 0.01 && x !== 0) ? Lab.sig(x, 2).replace(/ /g, '') : String(+x.toPrecision(3)));
  const calcStage = Lab.stage('#c-calc', {
    h: 430,
    label: 'A cylinder of gas beside the equation PV equals nRT, written as five tiles holding the current numbers, with the unknown highlighted.',
    draw(g, t, dt) {
      const floor = 382, x0 = 44, x1 = 268;
      // Picture: capped so any homework number stays on screen.
      const hTarget = clamp(calc.V * 7, 34, 290);
      calc.shownV = dt ? lerp(calc.shownV, hTarget, clamp(dt * 6)) : hTarget;
      calc.gaugeP = dt ? lerp(calc.gaugeP, calc.P, clamp(dt * 6)) : calc.P;
      const yHead = floor - calc.shownV;
      const want = clamp(Math.round(calc.n * 14), 2, 44);
      if (calcBox.particles.length < want) calcBox.add({ n: want - calcBox.particles.length, r: 4, kind: 'N2', mass: 1 });
      if (calcBox.particles.length > want) calcBox.particles.length = want;
      calcBox.setBounds(x0 + 4, yHead, x1 - 4, floor - 4);
      const spd = 170 * Math.sqrt(clamp(calc.T, 30, 1500) / 300);
      if (dt) {
        calcBox.step(dt / 2); calcBox.step(dt / 2);
        let s = 0; for (const q of calcBox.particles) s += q.vx * q.vx + q.vy * q.vy;
        if (s > 0) { const k = (spd * Math.sqrt(calcBox.particles.length)) / Math.sqrt(s); for (const q of calcBox.particles) { q.vx *= k; q.vy *= k; } }
      }
      const hot = clamp((calc.T - 300) / 500), cold = clamp((300 - calc.T) / 200);
      const gr = g.createLinearGradient(0, yHead, 0, floor);
      gr.addColorStop(0, 'rgba(30,18,60,.75)');
      gr.addColorStop(1, Art.alpha(hot > 0 ? Art.mix('#2A1A52', '#C2410C', hot * 0.8) : Art.mix('#2A1A52', '#1565C0', cold * 0.8), 0.85));
      g.fillStyle = gr; g.fillRect(x0, yHead, x1 - x0, floor - yHead);
      g.save(); g.beginPath(); g.rect(x0, yHead, x1 - x0, floor - yHead); g.clip();
      for (const q of calcBox.particles) Art.molecule(g, q.x, q.y, 10.5, 'N2', { rot: q.rot * 3, style: 'fill', atomScale: 1.28, labels: false });
      g.restore();
      g.lineCap = 'round'; g.strokeStyle = C.glass; g.lineWidth = 5;
      g.beginPath(); g.moveTo(x0, 60); g.lineTo(x0, floor); g.lineTo(x1, floor); g.lineTo(x1, 60); g.stroke();
      const cx = (x0 + x1) / 2;
      const rod = g.createLinearGradient(cx - 12, 0, cx + 12, 0);
      rod.addColorStop(0, '#6F6A8B'); rod.addColorStop(0.45, '#E2DEF2'); rod.addColorStop(1, '#5E5A7B');
      g.fillStyle = rod; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      g.fillRect(cx - 12, 0, 24, yHead - 20); g.strokeRect(cx - 12, -4, 24, yHead - 16);
      const hd = g.createLinearGradient(0, yHead - 22, 0, yHead);
      hd.addColorStop(0, '#E8E4F5'); hd.addColorStop(1, '#6F6A8B');
      g.fillStyle = hd; Art.round(g, x0 + 3, yHead - 22, x1 - x0 - 6, 22, 5); g.fill(); g.stroke();
      if (hot > 0.02) for (let i = 0; i < 5; i++) Art.flame(g, x0 + 30 + i * 41, floor + 40, 14 + hot * 26, t + i, {});
      else if (cold > 0.02) {
        g.strokeStyle = 'rgba(232,248,255,.9)'; g.lineWidth = 3;
        for (let i = 0; i < 6; i++) { const fx = x0 + 22 + i * 36, fy = floor + 22, s = 7 + 6 * cold; for (let a = 0; a < 3; a++) { const an = (a / 3) * Math.PI; g.beginPath(); g.moveTo(fx - Math.cos(an) * s, fy - Math.sin(an) * s); g.lineTo(fx + Math.cos(an) * s, fy + Math.sin(an) * s); g.stroke(); } }
      }
      // Equation tiles.
      const uniqueIs = (k) => calc.solve === k;
      const tile = (k, x, val, unit) => {
        const y = 18, w = 92, h = 128, on = uniqueIs(k);
        if (on) Art.glow(g, x + w / 2, y + h / 2, 92, C.pink, 0.5 + 0.1 * Math.sin(t * 3));
        g.fillStyle = on ? C.pink : 'rgba(14,6,30,.7)';
        Art.round(g, x, y, w, h, 14); g.fill();
        g.strokeStyle = on ? '#fff' : Art.alpha(tokenCol[k], 0.85); g.lineWidth = 3; g.stroke();
        Art.text(g, k, x + w / 2, y + 28, { font: 'display', size: 36, color: on ? '#fff' : tokenCol[k] });
        if (k === 'R') {
          Art.text(g, val, x + w / 2, y + 62, { font: 'display', size: 22, color: '#fff' });
          Art.text(g, 'L·atm', x + w / 2, y + 86, { size: 20, color: C.dim });
          g.strokeStyle = C.dim; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 18, y + 100); g.lineTo(x + w - 18, y + 100); g.stroke();
          Art.text(g, 'mol·K', x + w / 2, y + 114, { size: 20, color: C.dim });
        } else {
          Art.text(g, val, x + w / 2, y + 72, { font: 'display', size: 25, color: '#fff', maxW: w - 8 });
          Art.text(g, unit, x + w / 2, y + 102, { size: 20, color: on ? '#fff' : C.dim, maxW: w - 8 });
        }
      };
      if (calc.ok) {
        tile('P', 292, fmtVal(calc.P), 'atm');
        tile('V', 388, fmtVal(calc.V), 'L');
        Art.text(g, '=', 494, 82, { font: 'display', size: 44 });
        tile('n', 512, fmtVal(calc.n), 'mol');
        tile('R', 606, '0.08206', '');
        tile('T', 700, fmtVal(calc.T), 'K');
        const name = { P: 'pressure', V: 'volume', n: 'amount', T: 'temperature' }[calc.solve];
        const unit = { P: 'atm', V: 'L', n: 'mol', T: 'K' }[calc.solve];
        const ans = { P: calc.P, V: calc.V, n: calc.n, T: calc.T }[calc.solve];
        Art.text(g, 'The ' + name + ' is', 530, 180, { size: 28, color: C.dim });
        Art.text(g, `${Lab.sig(ans, 3)} ${unit}`, 530, 240, { font: 'display', size: 62, color: C.sun, maxW: 480 });
        gauge(g, 410, 340, 72, Math.min(calc.gaugeP, 10.3), { max: 10, step: 5, readout: false, unit: ' ' });
        Art.text(g, 'pressure', 410, 424 - 6, { size: 20, color: C.dim });
        Art.thermometer(g, 580, 280, 100, clamp(calc.T / 800), { w: 14, ticks: false });
        Art.text(g, Lab.sig(calc.T - 273.15, 3) + ' °C', 610, 330, { size: 24, align: 'left', color: C.fire });
      } else {
        Art.text(g, 'Check your numbers', 530, 200, { font: 'display', size: 40, color: C.red });
      }
    },
  });
  const solveSeg = Lab.segmented('#calc-solve', (v) => {
    calc.solve = v;
    Object.keys(fld).forEach((k) => {
      fld[k].disabled = k === v;
      const ctl = Lab.$('#ctl-' + k.toLowerCase());
      ctl.style.opacity = k === v ? 0.72 : 1;
    });
    solveCalc();
  });
  Lab.segmented('#calc-pu', (v) => {
    const old = parseFloat(fld.P.value) / PU[calc.pu];
    calc.pu = v;
    if (Number.isFinite(old)) fld.P.value = +(old * PU[v]).toPrecision(4);
    solveCalc();
  });
  Lab.segmented('#calc-vu', (v) => {
    const old = parseFloat(fld.V.value) / VU[calc.vu];
    calc.vu = v;
    if (Number.isFinite(old)) fld.V.value = +(old * VU[v]).toPrecision(4);
    solveCalc();
  });
  Lab.segmented('#calc-tu', (v) => {
    const raw = parseFloat(fld.T.value);
    if (Number.isFinite(raw) && calc.tu !== v) fld.T.value = +(v === 'C' ? raw - 273.15 : raw + 273.15).toFixed(2);
    calc.tu = v;
    solveCalc();
  });
  Object.values(fld).forEach((el) => el.addEventListener('input', solveCalc));
  solveSeg.set('V');

  /* ---------- Story 2: the combined gas law ---------- */
  const skyBg = (g, W, H, f) => {
    const s = g.createLinearGradient(0, 0, 0, H);
    s.addColorStop(0, Art.mix('#3C7FC8', '#0B0A30', f)); s.addColorStop(1, Art.mix('#A6DCF7', '#2C4F96', f));
    g.fillStyle = s; g.fillRect(0, 0, W, H);
  };
  const BAL = { V1: 5, P1: 1, T1: 293, P2: 0.3, T2: 233 };
  const balV = (q) => {
    const P = lerp(BAL.P1, BAL.P2, q), T = lerp(BAL.T1, BAL.T2, q);
    return { P, T, V: (BAL.V1 * (BAL.P1 / P) * T) / BAL.T1 };
  };
  const rOf = (V) => 66 * Math.cbrt(V / 5);
  Lab.story('#story-combined', {
    title: 'A weather balloon goes up',
    scenes: [
      {
        say: 'A weather balloon rises through the sky. The pressure falls and the temperature falls <b>at the same time</b>. No single law handles two changes at once.',
        dur: 4.4,
        draw(g, p, t, { W, H }) {
          const q = ease.inOut(seg(p, 0.1, 0.9));
          skyBg(g, W, H, q);
          // Ground and clouds scroll away.
          g.fillStyle = '#3F8F4F'; g.fillRect(0, lerp(H - 44, H + 300, q), W, 400);
          for (let i = 0; i < 6; i++) {
            const y = lerp(120 + i * 70, 620 + i * 70, q), x = ((rand(i + 2) * 800 + t * 6 * (i % 2 ? 1 : -1)) % 800 + 800) % 800;
            g.fillStyle = 'rgba(255,255,255,.75)';
            g.beginPath(); g.ellipse(x, y, 60, 18, 0, 0, TAU); g.ellipse(x + 34, y - 10, 38, 16, 0, 0, TAU); g.fill();
          }
          for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,255,255,${q * (0.3 + 0.5 * rand(i))})`; g.beginPath(); g.arc(rand(i + 3) * W, rand(i + 5) * 300, 1.6, 0, TAU); g.fill(); }
          const s = balV(q), r = rOf(s.V);
          const y = lerp(250, 196, q) + Math.sin(t * 1.3) * 5;
          balloon(g, 250, y, r, r * 1.08, '#FF4FA3', { string: 46 });
          // A little instrument box on the string.
          g.fillStyle = '#E8E4F5'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
          Art.round(g, 238, y + r * 1.08 + 46, 24, 18, 3); g.fill(); g.stroke();
          // Live values.
          g.fillStyle = 'rgba(20,10,40,.78)'; Art.round(g, 460, 64, 300, 262, 20); g.fill();
          const row = (yy, label, val, col) => { Art.text(g, label, 484, yy, { size: 26, align: 'left', color: C.dim }); Art.text(g, val, 738, yy, { font: 'display', size: 36, align: 'right', color: col }); };
          row(112, 'Pressure', Lab.fmt(s.P, 2) + ' atm', C.pink);
          row(190, 'Temperature', Lab.fmt(s.T, 0) + ' K', C.fire);
          row(268, 'Volume', Lab.fmt(s.V, 1) + ' L', C.cyan);
        },
      },
      {
        say: 'Same gas means the same $n$, and $R$ never changes. So $PV/T$ has to stay the same. That gives the <b>combined gas law</b>.',
        speak: 'Same gas means the same moles, and R never changes. So P V over T has to stay the same. That gives the combined gas law.',
        dur: 3.4,
        draw(g, p) {
          const a = seg(p, 0.05, 0.3), b = seg(p, 0.35, 0.6), c = seg(p, 0.65, 0.9);
          Art.text(g, 'PV = nRT, so', 400, 56, { font: 'display', size: 40, alpha: a });
          frac(g, 'P V', 'T', 306, 150, { size: 54, color: C.sun, alpha: a });
          Art.text(g, '= n R', 430, 150, { font: 'display', size: 54, alpha: a, color: C.leaf });
          Art.text(g, 'never changes', 546, 134, { size: 26, color: C.dim, alpha: b, align: 'left' });
          Art.text(g, 'for one sample', 546, 168, { size: 26, color: C.dim, alpha: b, align: 'left' });
          Art.arrow(g, 538, 150, 498, 150, { color: C.dim, w: 4, alpha: b });
          if (c > 0) {
            g.fillStyle = Art.alpha(C.plum2, 0.95 * c); Art.round(g, 120, 256, 560, 148, 26); g.fill();
            frac(g, 'P₁ V₁', 'T₁', 280, 330, { size: 50, color: C.cyan, alpha: c });
            Art.text(g, '=', 400, 332, { font: 'display', size: 54, alpha: c });
            frac(g, 'P₂ V₂', 'T₂', 520, 330, { size: 50, color: C.pink, alpha: c });
          }
          Art.text(g, 'before', 280, 240, { size: 24, color: C.cyan, alpha: c });
          Art.text(g, 'after', 520, 240, { size: 24, color: C.pink, alpha: c });
        },
      },
      {
        say: 'This one equation hides the older laws. If a variable does not change, <b>cross it out</b> on both sides and a familiar law remains.',
        dur: 4.4,
        draw(g, p) {
          const rows = [
            { y: 76, tag: 'T steady', name: "Boyle's law", col: C.pink, cross: 'T', result: 'P₁V₁ = P₂V₂' },
            { y: 216, tag: 'P steady', name: "Charles's law", col: C.cyan, cross: 'P', result: 'V₁/T₁ = V₂/T₂' },
            { y: 356, tag: 'V steady', name: "Gay-Lussac's law", col: C.fire, cross: 'V', result: 'P₁/T₁ = P₂/T₂' },
          ];
          rows.forEach((r, i) => {
            const a = seg(p, 0.03 + i * 0.3, 0.14 + i * 0.3), s = seg(p, 0.12 + i * 0.3, 0.22 + i * 0.3), e = seg(p, 0.2 + i * 0.3, 0.32 + i * 0.3);
            Art.text(g, r.tag, 28, r.y, { size: 25, align: 'left', color: C.dim, alpha: a });
            const dim = (k) => (r.cross === k ? 0.45 : 1);
            const pos = { xL: 214, xR: 386 };
            [[pos.xL, '₁'], [pos.xR, '₂']].forEach(([x, n]) => {
              g.save(); g.globalAlpha *= a;
              Art.text(g, 'P' + n, x - 28, r.y - 34, { font: 'display', size: 34, alpha: dim('P') });
              Art.text(g, 'V' + n, x + 28, r.y - 34, { font: 'display', size: 34, alpha: dim('V') });
              Art.text(g, 'T' + n, x, r.y + 34, { font: 'display', size: 34, alpha: dim('T') });
              g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 58, r.y); g.lineTo(x + 58, r.y); g.stroke();
              g.restore();
              const sx = r.cross === 'T' ? x : r.cross === 'P' ? x - 28 : x + 28, sy = r.cross === 'T' ? r.y + 34 : r.y - 34;
              Art.strike(g, sx - 24, sy + 18, sx + 24, sy - 18, s, C.red, 5);
            });
            Art.text(g, '=', 300, r.y, { font: 'display', size: 36, alpha: a });
            Art.arrow(g, 462, r.y, 508, r.y, { color: r.col, w: 6, p: e });
            Art.text(g, r.result, 660, r.y - 20, { font: 'display', size: 32, color: r.col, alpha: e, maxW: 270 });
            Art.text(g, r.name, 660, r.y + 22, { size: 25, alpha: e });
          });
        },
      },
      {
        say: 'Now solve the balloon. Falling pressure makes it <b>3.33 times</b> bigger. Cooling shrinks it to <b>0.795</b> of that. Multiply them and you get 13.3 L.',
        dur: 4.4,
        draw(g, p, t, { W, H }) {
          skyBg(g, W, H, 0.9);
          const a = seg(p, 0.05, 0.22), b = seg(p, 0.26, 0.48), c = seg(p, 0.55, 0.75);
          const qP = ease.inOut(seg(p, 0.26, 0.5)), qT = ease.inOut(seg(p, 0.55, 0.78));
          const V = lerp(lerp(5, 16.67, qP), 13.25, qT);
          const r = rOf(V);
          balloon(g, 150, 200, r, r * 1.08, '#FF4FA3', { string: 40 });
          Art.text(g, Lab.fmt(V, 1) + ' L', 150, 200, { font: 'display', size: 38, color: '#fff', halo: true });
          Art.text(g, 'V₂ =', 300, 92, { font: 'display', size: 36, align: 'left', alpha: a });
          Art.text(g, '5.00 L', 392, 92, { font: 'display', size: 36, align: 'left', alpha: a });
          // Pressure factor.
          Art.text(g, '×', 512, 92, { font: 'display', size: 34, alpha: b });
          frac(g, '1.00 atm', '0.300 atm', 610, 92, { size: 28, color: C.pink, alpha: b });
          Art.text(g, 'pressure falls: × 3.33', 500, 186, { size: 26, color: '#fff', alpha: b, halo: true });
          // Temperature factor.
          Art.text(g, '×', 330, 262, { font: 'display', size: 34, alpha: c });
          frac(g, '233 K', '293 K', 420, 262, { size: 28, color: C.fire, alpha: c });
          Art.text(g, 'it cools: × 0.795', 620, 262, { size: 26, color: '#fff', alpha: c, halo: true });
          const d = seg(p, 0.8, 0.95);
          if (d > 0) {
            Art.popIn(g, 520, 382, d, (gg) => {
              gg.fillStyle = C.leaf; Art.round(gg, -170, -40, 340, 80, 24); gg.fill();
              Art.text(gg, 'V₂ = 13.3 L', 0, 2, { font: 'display', size: 44, color: '#0B2A18' });
            });
          }
          void t;
        },
      },
    ],
  });

  /* ---------- Story 3: STP and molar volume ---------- */
  const glassCube = (g, x, y, s, inside) => {
    const d = s * 0.22;
    g.fillStyle = 'rgba(214,240,255,.09)'; g.fillRect(x, y, s, s);
    if (inside) { g.save(); g.beginPath(); g.rect(x, y, s, s); g.clip(); inside(); g.restore(); }
    g.lineJoin = 'round'; g.strokeStyle = C.glass; g.lineWidth = 3.4;
    g.strokeRect(x, y, s, s);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + d, y - d); g.lineTo(x + s + d, y - d); g.lineTo(x + s, y); g.moveTo(x + s + d, y - d); g.lineTo(x + s + d, y + s - d); g.lineTo(x + s, y + s); g.stroke();
  };
  const basketball = (g, x, y, r) => {
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r * 1.05);
    gr.addColorStop(0, '#FFB067'); gr.addColorStop(0.6, '#E86A1F'); gr.addColorStop(1, '#9A3E0B');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = '#3A1A08'; g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke();
    g.beginPath(); g.arc(x - r * 1.05, y, r * 0.78, -0.95, 0.95); g.stroke();
    g.beginPath(); g.arc(x + r * 1.05, y, r * 0.78, Math.PI - 0.95, Math.PI + 0.95); g.stroke();
  };
  Lab.story('#story-stp', {
    title: 'One mole of any gas',
    bg: 'lab',
    scenes: [
      {
        say: 'Take one mole each of hydrogen, nitrogen and carbon dioxide at <b>STP</b>, 0 °C and 1 atm. Same number of particles. Same volume, <b>22.4 L</b>. Very different masses.',
        dur: 3.6,
        draw(g, p, t) {
          const gases = [['H2', 'H₂', '2.02 g', 130, 15], ['N2', 'N₂', '28.02 g', 400, 15], ['CO2', 'CO₂', '44.01 g', 670, 13]];
          gases.forEach(([f, name, mass, x, bond], i) => {
            const a = ease.back(seg(p, 0.05 + i * 0.2, 0.28 + i * 0.2));
            if (a <= 0) return;
            g.save(); g.translate(x, 360); g.scale(a, a); g.translate(-x, -360);
            const sc = Art.digitalScale(g, x, 376, 200, mass, { size: 22 });
            const s = 158, bx = x - s / 2 - 8, by = sc.top - s - 2;
            glassCube(g, bx, by, s, () => {
              gasField(g, { x0: bx, x1: bx + s, y0: by, y1: by + s }, 9, steady(t, 110 * Math.sqrt(28 / { H2: 2, N2: 28, CO2: 44 }[f]) * 0.55, 110, 110), { seed: 2 + i, formula: f, bond, r: 22, sparks: false });
            });
            Art.formula(g, f, x, by - 56, { size: 40, colorize: true, halo: true });
            g.restore();
            void name;
          });
          Art.text(g, 'all 22.4 L, all 6.022 × 10²³ molecules', 400, 26, { font: 'display', size: 28, color: C.sun, alpha: seg(p, 0.72, 0.9) });
        },
      },
      {
        say: 'You can get 22.4 L yourself. Put 1 mol, 273.15 K and 1 atm into $V = nRT/P$. This value is called the <b>molar volume</b> of a gas at STP.',
        speak: 'You can get 22.4 liters yourself. Put one mole, 273.15 kelvin and one atmosphere into V equals n R T over P. This value is called the molar volume of a gas at STP.',
        dur: 3.6,
        draw(g, p) {
          Art.bg(g, 800, 450, 'micro', 0);
          const a = seg(p, 0.05, 0.25), b = seg(p, 0.3, 0.55), c = seg(p, 0.6, 0.85);
          Art.text(g, 'V =', 150, 92, { font: 'display', size: 54, alpha: a, color: C.cyan });
          frac(g, 'n R T', 'P', 290, 92, { size: 54, alpha: a });
          Art.text(g, 'V =', 150, 250, { font: 'display', size: 42, alpha: b, color: C.cyan });
          frac(g, '(1 mol)(0.08206 L·atm/mol·K)(273.15 K)', '1 atm', 480, 250, { size: 30, alpha: b });
          if (c > 0) {
            Art.popIn(g, 400, 378, c, (gg) => {
              gg.fillStyle = C.pink; Art.round(gg, -220, -44, 440, 88, 26); gg.fill();
              Art.text(gg, 'V = 22.4 L', 0, 2, { font: 'display', size: 54, color: '#fff' });
            });
          }
        },
      },
      {
        say: 'How big is 22.4 L? A cube about <b>28 cm</b> on each side. That is a little more than three basketballs.',
        dur: 3,
        draw(g, p, t) {
          const scale = 6.2; // stage units per cm, the same for the cube and the balls
          const s = 28.2 * scale, y = 380 - s, x = 58;
          const a = ease.back(seg(p, 0.05, 0.3));
          g.save(); g.translate(x + s / 2, 380); g.scale(a, a); g.translate(-(x + s / 2), -380);
          glassCube(g, x, y, s, () => gasField(g, { x0: x, x1: x + s, y0: y, y1: y + s }, 11, steady(t, 120, 130, 130), { seed: 6, bond: 16, r: 24, sparks: false }));
          g.restore();
          const b = seg(p, 0.2, 0.36);
          Art.text(g, '28.2 cm on each side', x + s / 2 + 34, y - s * 0.22 - 26, { font: 'display', size: 30, color: C.sun, alpha: b, halo: true });
          Art.text(g, '22.4 L', x + s / 2, y + s / 2, { font: 'display', size: 46, color: '#fff', alpha: b, halo: true });
          const rB = (23.8 / 2) * scale;
          [0, 1, 2].forEach((i) => {
            const q = ease.bounce(seg(p, 0.35 + i * 0.13, 0.55 + i * 0.13));
            if (q <= 0) return;
            const bx = 362 + rB + i * (rB * 2 + 6);
            basketball(g, bx - 40, lerp(-80, 380 - rB, q), rB);
          });
          Art.text(g, 'each basketball is about 7 L', 590, 150, { size: 27, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: 'Careful: 22.4 L is only for 0 °C and 1 atm. A warm room gives <b>24.5 L</b>. The newer IUPAC standard uses 1 bar, which gives <b>22.7 L</b>. Same gas, same mole, different conditions.',
        dur: 3.6,
        draw(g, p) {
          const baseY = 372, k = 12.4;
          const bars = [
            { x: 150, V: 22.4, name: 'Classic STP', sub: '0 °C and 1 atm', col: C.sun },
            { x: 400, V: 22.7, name: 'IUPAC STP', sub: '0 °C and 1 bar', col: C.cyan },
            { x: 650, V: 24.5, name: 'Warm room', sub: '25 °C and 1 atm', col: C.fire },
          ];
          bars.forEach((b, i) => {
            const q = ease.out(seg(p, 0.05 + i * 0.2, 0.32 + i * 0.2));
            if (q <= 0) return;
            const h = b.V * k * q;
            const gr = g.createLinearGradient(0, baseY - h, 0, baseY);
            gr.addColorStop(0, b.col); gr.addColorStop(1, Art.mix(b.col, '#1A0F2E', 0.45));
            g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
            Art.round(g, b.x - 72, baseY - h, 144, h, 10); g.fill(); g.stroke();
            Art.text(g, (b.V * q).toFixed(1) + ' L', b.x, baseY - h - 30, { font: 'display', size: 40, color: b.col });
            Art.text(g, b.name, b.x, baseY + 28, { size: 27, alpha: q });
            Art.text(g, b.sub, b.x, baseY + 60, { size: 23, color: C.dim, alpha: q });
          });
          g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.moveTo(40, baseY); g.lineTo(760, baseY); g.stroke();
        },
      },
    ],
  });

  /* ---------- Bench: will the balloon float? ---------- */
  const GASES = {
    He: { M: 4.003, label: 'He', draw: 'He', col: '#7FF3F3', bond: 18 },
    CH4: { M: 16.04, label: 'CH4', draw: 'CH4', col: '#FFB03B', bond: 14 },
    Air: { M: 28.97, label: 'air', draw: 'N2', col: '#9FB6FF', bond: 16 },
    CO2: { M: 44.01, label: 'CO2', draw: 'CO2', col: '#B9C2D6', bond: 14 },
    Xe: { M: 131.29, label: 'Xe', draw: 'Xe', col: '#4AA8C4', bond: 23 },
  };
  const AIR_D = (28.97 / (R_GAS * 293));
  const den = { gas: 'He', T: 293, y: 240, vy: 0 };
  const dOf = () => GASES[den.gas].M / (R_GAS * den.T);
  const densityStage = Lab.stage('#c-density', {
    h: 460,
    label: 'A balloon in a room next to two bars comparing the density of the gas inside with the density of the air outside. It floats when the gas is less dense.',
    bg: (g, W, H) => { Art.bgLab(g, W, H, 44); },
    draw(g, t, dt) {
      const gas = GASES[den.gas], d = dOf();
      const floorY = 416, ceilY = 20, r = 74;
      const minY = ceilY + r * 1.08 + 2, maxY = floorY - r * 1.08 - 96;
      if (dt) {
        const lift = (AIR_D - d) / (AIR_D + d); // -1 sinks hard, +1 rises hard
        den.vy += (-lift * 900 - den.vy * 1.8) * dt;
        den.y += den.vy * dt;
        if (den.y < minY) { den.y = minY; den.vy *= -0.3; }
        if (den.y > maxY) { den.y = maxY; den.vy *= -0.3; }
      } else {
        const lift = AIR_D - d;
        if (Lab.reducedMotion) den.y = Math.abs(lift) < 0.01 ? (minY + maxY) / 2 : lift > 0 ? minY : maxY;
      }
      const x = 200, y = den.y;
      // Burner when the gas is hot.
      const hot = clamp((den.T - 300) / 200);
      if (hot > 0) {
        Art.flame(g, x, y + r * 1.08 + 48, 18 + hot * 40, t, { wide: 0.9 });
        g.fillStyle = '#7D7798'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
        Art.round(g, x - 16, y + r * 1.08 + 48, 32, 12, 3); g.fill(); g.stroke();
      }
      balloon(g, x, y, r, r * 1.08, gas.col, { string: hot > 0 ? 0 : 92 });
      // The particles inside. Fewer in the same space as it gets hotter, in proportion to n/V = P/RT.
      g.save(); g.beginPath(); g.ellipse(x, y, r - 5, r * 1.08 - 5, 0, 0, TAU); g.clip();
      const N = Math.max(2, Math.round((10 * 293) / den.T));
      const spd = 50 * Math.sqrt((den.T / 293) * (28 / gas.M));
      for (let i = 0; i < N; i++) {
        const a = rand(i + 4) * TAU + t * (spd / 90) * (i % 2 ? 1 : -1) * (0.5 + rand(i));
        const rr = Math.sqrt(rand(i * 3 + 1)) * (r - 18);
        drawParticle(g, gas.draw, x + Math.cos(a) * rr, y + Math.sin(a) * rr * 1.04, gas.bond * 0.72, a * 2);
      }
      g.restore();
      Art.formula(g, gas.label === 'air' ? 'Air' : gas.label, x, y + r * 1.08 - 26, { size: 26, halo: true });
      // Density bars.
      const bx = 450, baseY = 400, scale = 62; // units per g/L
      const cap = 5.6;
      const bar = (cx, val, col, name) => {
        const h = Math.min(val, cap) * scale;
        const gr = g.createLinearGradient(0, baseY - h, 0, baseY);
        gr.addColorStop(0, col); gr.addColorStop(1, Art.mix(col, '#1A0F2E', 0.45));
        g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
        Art.round(g, cx - 56, baseY - h, 112, Math.max(h, 8), 8); g.fill(); g.stroke();
        Art.text(g, Lab.fmt(val, 2) + (val > cap ? ' g/L (off chart)' : ' g/L'), cx, Math.max(baseY - h - 22, 24), { font: 'display', size: 28, color: col, maxW: 200 });
        Art.text(g, name, cx, baseY + 26, { size: 24 });
      };
      bar(bx, d, gas.col, 'inside');
      bar(bx + 200, AIR_D, '#BFE9FF', 'room air');
      // The comparison line at air density.
      g.save(); g.setLineDash([10, 8]); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(bx - 80, baseY - AIR_D * scale); g.lineTo(bx + 280, baseY - AIR_D * scale); g.stroke(); g.restore();
      Art.text(g, 'd = PM ÷ RT', 560, 40, { font: 'display', size: 38, color: C.sun });
      // Arrow shows which way it is going.
      const lift = AIR_D - d;
      if (Math.abs(lift) > 0.015) {
        const up = lift > 0;
        Art.arrow(g, x + r + 34, y + (up ? 34 : -34), x + r + 34, y + (up ? -34 : 34), { color: up ? C.leaf : C.red, w: 9 });
      }
    },
  });
  const paintDensity = () => {
    const d = dOf(), diff = AIR_D - d;
    Lab.$('#den-d').textContent = Lab.fmt(d, 3) + ' g/L';
    Lab.$('#den-air').textContent = Lab.fmt(AIR_D, 3) + ' g/L';
    const v = Lab.$('#den-verdict'), box = Lab.$('#den-verdict-box');
    const floats = diff > 0.015, sinks = diff < -0.015;
    v.textContent = floats ? 'Floats up' : sinks ? 'Sinks down' : 'Hovers';
    box.classList.toggle('is-good', floats); box.classList.toggle('is-bad', sinks);
    densityStage.redraw();
  };
  Lab.segmented('#den-gas', (v) => { den.gas = v; paintDensity(); });
  Lab.bind('#den-t', '#den-t-out', (v) => `${v} K = ${v - 273} °C`, (v) => { den.T = v; paintDensity(); });

  /* ---------- Story 4: the airbag ---------- */
  const carShape = (g, x, y, t, bag) => {
    // Body.
    const b = g.createLinearGradient(0, y - 110, 0, y);
    b.addColorStop(0, '#FF6B7D'); b.addColorStop(1, '#B3243C');
    g.fillStyle = b; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3.5;
    g.beginPath();
    g.moveTo(x - 190, y - 26);
    g.quadraticCurveTo(x - 190, y - 66, x - 150, y - 68);
    g.lineTo(x - 104, y - 72);
    g.quadraticCurveTo(x - 70, y - 138, x - 18, y - 140);
    g.lineTo(x + 60, y - 140);
    g.quadraticCurveTo(x + 104, y - 132, x + 128, y - 74);
    g.lineTo(x + 172, y - 62);
    g.quadraticCurveTo(x + 200, y - 54, x + 198, y - 24);
    g.lineTo(x + 198, y - 14); g.lineTo(x - 190, y - 14); g.closePath(); g.fill(); g.stroke();
    // Window.
    g.fillStyle = 'rgba(190,232,255,.32)';
    g.beginPath(); g.moveTo(x - 82, y - 74); g.quadraticCurveTo(x - 56, y - 124, x - 16, y - 126); g.lineTo(x + 56, y - 126); g.quadraticCurveTo(x + 90, y - 118, x + 108, y - 76); g.closePath(); g.fill(); g.stroke();
    // Driver and airbag, inside the window.
    Art.moe(g, x + 0, y - 58, 74, bag > 0.5 ? 'oops' : 'happy', { t, bob: false });
    if (bag > 0) {
      g.save();
      g.beginPath(); g.moveTo(x - 82, y - 74); g.quadraticCurveTo(x - 56, y - 124, x - 16, y - 126); g.lineTo(x + 56, y - 126); g.quadraticCurveTo(x + 90, y - 118, x + 108, y - 76); g.closePath(); g.clip();
      balloon(g, x + 86 - bag * 14, y - 92, 40 * bag, 40 * bag, '#F4F0E0', { string: 0 });
      g.restore();
    }
    // Wheels.
    [x - 112, x + 118].forEach((wx) => {
      g.fillStyle = '#20182E'; g.beginPath(); g.arc(wx, y - 14, 30, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#C9C7DB'; g.beginPath(); g.arc(wx, y - 14, 13, 0, TAU); g.fill();
    });
  };
  const naN3 = (g, x, y, s, o = {}) => {
    Art.atom(g, x, y, 22 * s, 'Na', { label: 'Na', face: o.face, t: o.t });
    [0, 1, 2].forEach((i) => Art.atom(g, x + (34 + i * 27) * s, y, 15 * s, 'N', { label: 'N' }));
  };
  const stone = (g, x, y, w, text, sub, col, a) => {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(14,6,30,.75)'; Art.round(g, x - w / 2, y - 52, w, 104, 20); g.fill();
    g.strokeStyle = col; g.lineWidth = 4; g.stroke();
    Art.text(g, text, x, y - 12, { font: 'display', size: 34, color: col });
    Art.text(g, sub, x, y + 26, { size: 23 });
    g.restore();
  };
  Lab.story('#story-airbag', {
    title: 'Inflating an airbag',
    scenes: [
      {
        say: 'A car hits a wall. A sensor fires a tiny spark, and within a few hundredths of a second the bag is full of gas. Where did all that gas come from?',
        dur: 3.6,
        draw(g, p, t) {
          Art.bgLab(g, 800, 450);
          const ground = 380;
          // Brick wall.
          g.fillStyle = '#7F3B2C'; g.fillRect(676, 40, 124, ground - 40);
          g.strokeStyle = 'rgba(30,10,10,.6)'; g.lineWidth = 2.5;
          for (let r = 0; r < 12; r++) { const y = 40 + r * 28.3; g.beginPath(); g.moveTo(676, y); g.lineTo(800, y); g.stroke(); for (let c = 0; c < 4; c++) { const x = 676 + (c + (r % 2) * 0.5) * 44; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 28.3); g.stroke(); } }
          const go = seg(p, 0, 0.42);
          const x = lerp(170, 472, go * go);
          const hit = seg(p, 0.42, 0.62), bag = ease.back(seg(p, 0.46, 0.7));
          const shake = hit > 0 && hit < 1 ? Math.sin(t * 60) * 5 * (1 - hit) : 0;
          carShape(g, x + shake, ground, t, bag);
          Art.burst(g, 670, 310, hit, { n: 18, r: 110, size: 11 });
          const a = seg(p, 0.72, 0.9);
          if (a > 0) {
            Art.arrow(g, 390, 104, x + 74, ground - 120, { color: C.sun, w: 6, alpha: a });
            Art.text(g, 'full of nitrogen gas', 330, 76, { font: 'display', size: 34, color: C.sun, alpha: a, halo: true });
          }
        },
      },
      {
        say: 'The bag holds a solid pellet of sodium azide. The spark breaks it down: $\\ce{2NaN3(s) -> 2Na(s) + 3N2(g)}$. Count the atoms. Two Na and six N on each side.',
        speak: 'The bag holds a solid pellet of sodium azide. The spark breaks it down. Two sodium azide gives two sodium plus three nitrogen gas. Count the atoms. Two sodium and six nitrogen on each side.',
        dur: 4,
        draw(g, p, t, { W }) {
          Art.formula(g, '2NaN3 -> 2Na + 3N2', W / 2, 44, { size: 44, colorize: true });
          const q = ease.inOut(seg(p, 0.22, 0.72));
          const a = 1 - seg(p, 0.2, 0.34);
          const ys = [176, 296];
          // Left side: the azide units.
          if (a > 0) {
            g.save(); g.globalAlpha *= a;
            ys.forEach((y) => naN3(g, 96, y, 1.6, { }));
            g.restore();
          }
          Art.text(g, 'a solid pellet', 180, 400, { size: 27, color: C.dim, alpha: 1 - seg(p, 0.3, 0.5) });
          if (q > 0) {
            // Sodium drops, nitrogens pair up and fly.
            ys.forEach((y, i) => {
              Art.atom(g, lerp(96, 214 + i * 92, q), lerp(y, 334, q), 34, 'Na', { label: 'Na' });
            });
            const pairs = [[150, 176, 480, 150], [190, 296, 590, 250], [170, 240, 690, 136]];
            pairs.forEach(([x0, y0, x1, y1], i) => {
              const x = lerp(x0, x1, q) + wander(i + 3, t) * 8 * q, y = lerp(y0, y1, q) + wander(i + 9, t) * 8 * q;
              Art.molecule(g, x, y, 42, 'N2', { rot: t * 0.8 * q + i, style: 'fill', atomScale: 1.2, labels: false, face: q > 0.7 ? 'happy' : null, faceAll: q > 0.7, t });
            });
          }
          const b = seg(p, 0.72, 0.9);
          Art.text(g, '2 Na stay solid', 260, 400, { size: 27, alpha: b, color: Art.elementColor('Na') });
          Art.text(g, '3 N₂ fly off as gas', 590, 400, { size: 27, alpha: b, color: '#8FB0FF' });
        },
      },
      {
        say: 'Say the bag must hold 50.0 L at 1.20 atm and 27 °C. Use $PV = nRT$ to find the moles of gas. It takes <b>2.437 mol</b> of nitrogen.',
        speak: 'Say the bag must hold 50 liters at 1.20 atmospheres and 27 degrees Celsius. Use P V equals n R T to find the moles of gas. It takes 2.437 moles of nitrogen.',
        dur: 3.8,
        draw(g, p, t) {
          balloon(g, 170, 190, 136 + Math.sin(t * 2) * 2, 136 + Math.sin(t * 2) * 2, '#F4F0E0', { string: 0 });
          g.save(); g.beginPath(); g.arc(170, 190, 130, 0, TAU); g.clip();
          gasField(g, { x0: 40, x1: 300, y0: 60, y1: 320 }, 14, steady(t, 130, 200, 200), { seed: 4, bond: 15, r: 22 });
          g.restore();
          Art.text(g, '50.0 L', 90, 362, { font: 'display', size: 28, color: C.cyan });
          Art.text(g, '1.20 atm', 190, 362, { font: 'display', size: 28, color: C.pink });
          Art.text(g, '300 K', 296, 362, { font: 'display', size: 28, color: C.fire });
          const a = seg(p, 0.1, 0.3), b = seg(p, 0.36, 0.58), c = seg(p, 0.66, 0.86);
          Art.text(g, 'n =', 400, 92, { font: 'display', size: 44, align: 'left', color: C.leaf, alpha: a });
          frac(g, 'P V', 'R T', 530, 92, { size: 44, alpha: a });
          Art.text(g, 'n =', 346, 236, { font: 'display', size: 34, align: 'left', color: C.leaf, alpha: b });
          frac(g, '(1.20 atm)(50.0 L)', '(0.08206 L·atm/mol·K)(300 K)', 598, 236, { size: 22, alpha: b });
          if (c > 0) {
            Art.popIn(g, 590, 372, c, (gg) => {
              gg.fillStyle = C.leaf; Art.round(gg, -190, -38, 380, 76, 22); gg.fill();
              Art.text(gg, '2.437 mol N₂', 0, 2, { font: 'display', size: 42, color: '#0B2A18' });
            });
          }
        },
      },
      {
        say: 'Now cross the bridges. Use the mole ratio from the equation, <b>2 NaN₃ for every 3 N₂</b>. Then use the molar mass of $\\ce{NaN3}$, 65.01 g/mol.',
        speak: 'Now cross the bridges. Use the mole ratio from the equation, two sodium azide for every three nitrogen. Then use the molar mass of sodium azide, 65.01 grams per mole.',
        dur: 4.2,
        draw(g, p, t) {
          const y = 196;
          const a1 = seg(p, 0.02, 0.15), a2 = seg(p, 0.35, 0.5), a3 = seg(p, 0.7, 0.85);
          stone(g, 118, y, 210, '2.437 mol', 'N₂ gas', C.leaf, a1);
          stone(g, 400, y, 210, '1.625 mol', 'NaN₃', C.violet, a2);
          stone(g, 682, y, 210, '106 g', 'NaN₃', C.sun, a3);
          const b1 = seg(p, 0.16, 0.35), b2 = seg(p, 0.5, 0.7);
          Art.arrow(g, 226, y, 292, y, { color: C.ink, w: 7, p: b1 });
          Art.arrow(g, 508, y, 574, y, { color: C.ink, w: 7, p: b2 });
          // Factors sit above their arrows.
          frac(g, '2 mol NaN₃', '3 mol N₂', 259, 84, { size: 27, color: C.cyan, alpha: b1 });
          frac(g, '65.01 g', '1 mol NaN₃', 541, 84, { size: 27, color: C.cyan, alpha: b2 });
          Art.text(g, '×', 148, 84, { font: 'display', size: 34, color: C.cyan, alpha: b1 });
          Art.text(g, '×', 432, 84, { font: 'display', size: 34, color: C.cyan, alpha: b2 });
          // Moe hops across.
          const route = ease.inOut(seg(p, 0.18, 0.34)) + ease.inOut(seg(p, 0.52, 0.68));
          const mx = lerp(118, 400, Math.min(route, 1)) + (route > 1 ? lerp(0, 282, route - 1) : 0);
          const hop = Math.sin((route % 1) * Math.PI) * 44;
          Art.moe(g, mx, y + 148 - hop, 92, route >= 2 ? 'cheer' : 'happy', { t, bob: false });
          g.fillStyle = 'rgba(255,255,255,.13)';
          [118, 400, 682].forEach((x) => { g.beginPath(); g.ellipse(x, y + 152, 62, 11, 0, 0, TAU); g.fill(); });
        },
      },
      {
        say: 'So about <b>106 g</b> of solid, roughly a handful, makes a 50 L bag of gas. Real airbags add other chemicals to trap the hot sodium, and many newer ones use different propellants.',
        dur: 3.4,
        draw(g, p, t) {
          Art.bgLab(g, 800, 450);
          // Pellet on a scale.
          const sc = Art.digitalScale(g, 170, 384, 220, '106 g', { size: 22 });
          const a = ease.back(seg(p, 0.05, 0.3));
          g.save(); g.translate(170, sc.top); g.scale(a, a);
          for (let i = 0; i < 24; i++) {
            const row = i < 10 ? 0 : i < 18 ? 1 : i < 22 ? 2 : 3;
            const offs = [10, 8, 4, 2][row];
            const k = i - [0, 10, 18, 22][row];
            Art.ball(g, (k - (offs - 1) / 2) * 14, -7 - row * 11, 7, '#D9DCE8');
          }
          g.restore();
          Art.text(g, 'a handful of NaN₃', 170, 216, { size: 27, alpha: seg(p, 0.15, 0.35) });
          // The arrow and the bag.
          Art.arrow(g, 306, 270, 410, 230, { color: C.sun, w: 9, p: seg(p, 0.3, 0.5) });
          const q = ease.back(seg(p, 0.4, 0.75));
          const r = 150 * q;
          if (r > 2) balloon(g, 590, 196, r, r, '#F4F0E0', { string: 0 });
          const b = seg(p, 0.72, 0.9);
          if (b > 0) {
            Art.text(g, '50.0 L', 590, 176, { font: 'display', size: 56, color: '#1F1236', alpha: b });
            Art.text(g, 'of nitrogen gas', 590, 226, { size: 28, color: '#1F1236', alpha: b });
          }
          void t;
        },
      },
    ],
  });

  /* ---------- Story 5: Dalton's idea ---------- */
  const miniTank = (g, x, y, w, h, m, list, o = {}) => {
    g.fillStyle = 'rgba(14,6,30,.6)'; Art.round(g, x, y, w, h, 12); g.fill();
    const box = { x0: x + 3, x1: x + w - 3, y0: y + 3, y1: y + h - 3 };
    let seed = 2;
    list.forEach(([f, n, bond]) => { gasField(g, box, n, m, { seed: seed += 5, formula: f, bond, r: bond + 10, sparks: o.sparks }); });
    g.strokeStyle = C.glass; g.lineWidth = 5; Art.round(g, x, y, w, h, 12); g.stroke();
  };
  Lab.story('#story-dalton', {
    title: 'Sharing a tank',
    scenes: [
      {
        say: 'Two identical tanks. One holds only nitrogen and reads <b>1.2 atm</b>. The other holds only oxygen and reads <b>0.3 atm</b>. There is four times as much nitrogen.',
        dur: 3,
        draw(g, p, t) {
          const m = steady(t, 130, 170, 170);
          const a = ease.out(seg(p, 0.05, 0.35)), b = ease.out(seg(p, 0.3, 0.6));
          g.save(); g.globalAlpha *= a;
          miniTank(g, 70, 150, 270, 270, m, [['N2', 16, 15]]);
          gauge(g, 205, 70, 62, 1.2, { max: 2, step: 1, readout: false, unit: ' ' });
          Art.text(g, '1.2 atm', 278, 62, { font: 'display', size: 32, align: 'left', color: C.sun });
          g.restore();
          g.save(); g.globalAlpha *= b;
          miniTank(g, 460, 150, 270, 270, m, [['O2', 4, 15]]);
          gauge(g, 595, 70, 62, 0.3, { max: 2, step: 1, readout: false, unit: ' ' });
          Art.text(g, '0.3 atm', 668, 62, { font: 'display', size: 32, align: 'left', color: C.sun });
          g.restore();
        },
      },
      {
        say: 'Now put both gases in one identical tank. Particles of an ideal gas ignore each other, so the pushes simply add. The gauge reads <b>1.5 atm</b>.',
        dur: 3.6,
        draw(g, p, t) {
          const m = steady(t, 130, 170, 170);
          const q = ease.inOut(seg(p, 0.05, 0.42));
          // Tanks slide together.
          if (q < 1) {
            g.save(); g.globalAlpha *= 1 - q;
            miniTank(g, lerp(40, 180, q), 150, 200, 270, steady(t, 130, 130, 170), [['N2', 16, 15]], { sparks: false });
            miniTank(g, lerp(560, 420, q), 150, 200, 270, steady(t, 130, 130, 170), [['O2', 4, 15]], { sparks: false });
            g.restore();
          }
          const a = seg(p, 0.3, 0.5);
          if (a > 0) {
            g.save(); g.globalAlpha *= a;
            miniTank(g, 120, 150, 280, 270, m, [['N2', 16, 15], ['O2', 4, 15]]);
            gauge(g, 260, 70, 62, 1.5, { max: 2, step: 1, readout: false, unit: ' ' });
            g.restore();
          }
          // Pressure tower.
          const b = ease.out(seg(p, 0.5, 0.72)), c = ease.out(seg(p, 0.68, 0.88));
          const baseY = 420, k = 170, x = 500, w = 112;
          if (b > 0) {
            g.fillStyle = Art.elementColor('N'); g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
            Art.round(g, x, baseY - 1.2 * k * b, w, 1.2 * k * b, 6); g.fill(); g.stroke();
            Art.text(g, 'N₂: 1.2 atm', x + w + 12, baseY - 0.6 * k, { size: 25, align: 'left', alpha: b, maxW: 180 });
          }
          if (c > 0) {
            g.fillStyle = Art.elementColor('O'); g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
            Art.round(g, x, baseY - 1.2 * k - 0.3 * k * c, w, 0.3 * k * c, 6); g.fill(); g.stroke();
            Art.text(g, 'O₂: 0.3 atm', x + w + 12, baseY - 1.35 * k, { size: 25, align: 'left', alpha: c, maxW: 180 });
            Art.text(g, '1.5 atm total', x + w / 2 + 60, baseY - 1.5 * k - 28, { font: 'display', size: 32, color: C.sun, alpha: seg(p, 0.82, 0.96) });
          }
        },
      },
      {
        say: 'Each gas has its own share of the total, called its <b>partial pressure</b>. Oxygen is 4 of the 20 molecules, a <b>mole fraction</b> of 0.20. So its share is 0.20 × 1.5 atm = 0.30 atm.',
        dur: 3.8,
        draw(g, p, t) {
          // Count them.
          const per = 5;
          for (let i = 0; i < 20; i++) {
            const row = Math.floor(i / per), col = i % per;
            const x = 90 + col * 66, y = 80 + row * 72;
            const on = i >= 16;
            const q = ease.back(seg(p, 0.02 + i * 0.022, 0.1 + i * 0.022));
            if (q <= 0) continue;
            const hl = seg(p, 0.5, 0.65);
            if (on && hl > 0) Art.glow(g, x, y, 42, C.sun, 0.6 * hl);
            g.save(); g.translate(x, y); g.scale(q, q);
            Art.molecule(g, wander(i, t) * 2, wander(i + 5, t) * 2, 22, on ? 'O2' : 'N2', { rot: 0.5 + Math.sin(t + i) * 0.3, style: 'fill', atomScale: 1.28, labels: false, alpha: on || hl === 0 ? 1 : 1 - 0.4 * hl });
            g.restore();
          }
          const a = seg(p, 0.5, 0.68), b = seg(p, 0.74, 0.92);
          Art.text(g, 'X =', 460, 112, { font: 'display', size: 40, align: 'left', color: C.sun, alpha: a });
          frac(g, '4 O₂', '20 total', 610, 112, { size: 38, alpha: a });
          Art.text(g, '= 0.20', 690, 112, { font: 'display', size: 34, align: 'left', alpha: a, maxW: 100 });
          if (b > 0) {
            g.fillStyle = Art.alpha(C.plum2, 0.95 * b); Art.round(g, 440, 218, 340, 138, 22); g.fill();
            Art.text(g, 'P(O₂) = X × P(total)', 610, 256, { size: 27, alpha: b });
            Art.text(g, '0.20 × 1.5 atm', 610, 292, { size: 27, alpha: b, color: C.dim });
            Art.text(g, '= 0.30 atm', 610, 330, { font: 'display', size: 36, color: C.sun, alpha: b });
          }
        },
      },
    ],
  });

  /* ---------- Bench: mix your own gas ---------- */
  const DAL = { N2: { M: 28.02, f: 'N2', col: Art.elementColor('N'), name: 'N₂', r: 6 }, O2: { M: 32.0, f: 'O2', col: Art.elementColor('O'), name: 'O₂', r: 6 }, He: { M: 4.0, f: 'He', col: Art.elementColor('He'), name: 'He', r: 6 } };
  const dal = { n: { N2: 0.6, O2: 0.3, He: 0.1 }, spot: 'all', flux: { N2: 0.6, O2: 0.3, He: 0.1 }, hits: { N2: 0, O2: 0, He: 0 } };
  const DX0 = 34, DX1 = 424, DY0 = 28, DY1 = 450, DPER = 20, DV = 24.618, DT = 300;
  const dBox = new Sim.Box({ x0: DX0 + 3, y0: DY0 + 3, x1: DX1 - 3, y1: DY1 - 3, seed: 21 });
  const mScale = (k) => DAL[k].M / 28.02;
  const VREF = 150; // rms speed of N2 in the picture, sets the slow-motion scale
  // Equal average KE per particle at one temperature: m <v²> is the same for every gas.
  const KE_REF = VREF * VREF;
  // Particle-count pressure calibration: 2D kinetic theory, P2D = sum(m v²) / (2 A).
  const DW = DX1 - DX0 - 6 - 8, DH = DY1 - DY0 - 6 - 8;
  const DCAL = ((R_GAS * DT) / DV) / (DPER * KE_REF / (2 * DW * DH));
  function dalSync() {
    Object.keys(DAL).forEach((k) => {
      const want = Math.round(dal.n[k] * DPER);
      const have = dBox.particles.filter((q) => q.kind === k).length;
      if (have < want) {
        const before = dBox.particles.length;
        dBox.add({ n: want - have, r: 4, kind: k, mass: mScale(k), speed: VREF });
        for (let i = before; i < dBox.particles.length; i++) {
          const q = dBox.particles[i], s = Math.hypot(q.vx, q.vy) || 1, v = Math.sqrt(KE_REF / q.mass);
          q.vx *= v / s; q.vy *= v / s;
        }
      } else if (have > want) dBox.remove(k, have - want);
    });
  }
  dBox.onWall = (q) => {
    const dT = q.y - q.r - dBox.y0, dB = dBox.y1 - q.y - q.r, dL = q.x - q.r - dBox.x0, dR = dBox.x1 - q.x - q.r;
    const m = Math.min(dT, dB, dL, dR);
    const vn = m === dT || m === dB ? Math.abs(q.vy) : Math.abs(q.vx);
    dal.hits[q.kind] += 2 * q.mass * vn;
  };
  dalSync();
  const dalStage = Lab.stage('#c-dalton', {
    h: 478,
    label: 'A tank of mixed gases beside two stacked towers showing the partial pressure of each gas, one calculated and one measured from particle hits.',
    draw(g, t, dt) {
      if (dt) {
        dBox.step(dt / 2); dBox.step(dt / 2);
        // Keep the total kinetic energy on the set temperature.
        let s = 0; const P = dBox.particles;
        for (const q of P) s += q.mass * (q.vx * q.vx + q.vy * q.vy);
        if (P.length && s > 0) { const k = Math.sqrt((P.length * KE_REF) / s); for (const q of P) { q.vx *= k; q.vy *= k; } }
        Object.keys(DAL).forEach((k) => {
          const flux = dal.hits[k] / (2 * (DW + DH));
          dal.flux[k] += (flux * DCAL - dal.flux[k] * dt) / 3.2;
          dal.hits[k] = 0;
        });
      }
      // Tank.
      g.fillStyle = 'rgba(14,6,30,.55)'; Art.round(g, DX0, DY0, DX1 - DX0, DY1 - DY0, 14); g.fill();
      g.save(); g.beginPath(); g.rect(DX0, DY0, DX1 - DX0, DY1 - DY0); g.clip();
      g.lineCap = 'round'; g.lineWidth = 5;
      for (const q of dBox.particles) {
        const a = dal.spot === 'all' || dal.spot === q.kind ? 1 : 0.14;
        g.globalAlpha = a;
        g.strokeStyle = 'rgba(255,255,255,.18)';
        g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x - q.vx * 0.05, q.y - q.vy * 0.05); g.stroke();
        drawParticle(g, DAL[q.kind].f, q.x, q.y, q.kind === 'He' ? 10.5 : 11.5, q.rot * 3);
      }
      g.globalAlpha = 1;
      g.restore();
      g.strokeStyle = C.glass; g.lineWidth = 5; Art.round(g, DX0, DY0, DX1 - DX0, DY1 - DY0, 14); g.stroke();

      // Towers.
      const base = 404, top = 76, maxP = 3.3, scale = (base - top) / maxP;
      const keys = ['N2', 'O2', 'He'];
      const unitP = (R_GAS * DT) / DV;
      const tower = (x, w, vals, label) => {
        let y = base;
        keys.forEach((k) => {
          const h = Math.max(0, vals[k]) * scale;
          if (h < 0.5) return;
          const a = dal.spot === 'all' || dal.spot === k ? 1 : 0.22;
          g.save(); g.globalAlpha *= a;
          const gr = g.createLinearGradient(x, 0, x + w, 0);
          gr.addColorStop(0, Art.mix(DAL[k].col, '#ffffff', 0.25)); gr.addColorStop(1, Art.mix(DAL[k].col, '#1A0F2E', 0.35));
          g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
          g.fillRect(x, y - h, w, h); g.strokeRect(x, y - h, w, h);
          g.restore();
          y -= h;
        });
        Art.text(g, label, x + w / 2, base + 26, { size: 21, color: C.dim });
        return y;
      };
      const calcP = { N2: dal.n.N2 * unitP, O2: dal.n.O2 * unitP, He: dal.n.He * unitP };
      const topY = tower(476, 118, calcP, 'calculated');
      tower(620, 96, dal.flux, 'from hits');
      // Axis.
      g.strokeStyle = C.ink; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(462, top - 8); g.lineTo(462, base); g.lineTo(730, base); g.stroke();
      for (let v = 1; v <= 3; v++) {
        const y = base - v * scale;
        g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; g.beginPath(); g.moveTo(462, y); g.lineTo(730, y); g.stroke();
        Art.text(g, String(v), 452, y, { size: 20, align: 'right', color: C.dim });
      }
      Art.text(g, 'atm', 450, top - 22, { size: 20, color: C.dim });
      const total = calcP.N2 + calcP.O2 + calcP.He;
      Art.text(g, Lab.fmt(total, 2) + ' atm', 535, Math.max(topY - 24, 40), { font: 'display', size: 30, color: C.sun, maxW: 150 });
      // Tags beside the first tower, with their gas colors.
      const yTag = [442, 442, 442];
      void yTag;
      let lx = 470;
      keys.forEach((k) => {
        Art.ball(g, lx + 8, 462, 8, DAL[k].col);
        Art.text(g, DAL[k].name, lx + 22, 462, { size: 21, align: 'left' });
        lx += 80;
      });
      void t;
    },
  });
  function paintDalton() {
    dalSync();
    const unitP = (R_GAS * DT) / DV;
    const nT = dal.n.N2 + dal.n.O2 + dal.n.He;
    const foot = Lab.$('#dal-foot');
    if (nT <= 0) { foot.innerHTML = '<p>The tank is empty, so the pressure is zero. Add some gas.</p>'; dalStage.redraw(); return; }
    const rows = Object.keys(DAL).filter((k) => dal.n[k] > 0).map((k) => {
      const X = dal.n[k] / nT, Pi = dal.n[k] * unitP;
      const td = 'padding:5px 12px 5px 0;border-bottom:1px solid rgba(255,255,255,.16)';
      return `<tr><td style="${td}">$\\ce{${k}}$</td><td style="${td}">${dal.n[k].toFixed(2)} mol</td><td style="${td}">$\\frac{${dal.n[k].toFixed(2)}}{${nT.toFixed(2)}} = ${X.toFixed(3)}$</td><td style="${td}"><b>${Pi.toFixed(2)} atm</b></td></tr>`;
    }).join('');
    foot.innerHTML = Lab.texString(`<div class="tbl-wrap" style="margin:0;max-width:none"><table style="width:100%;border-collapse:collapse;text-align:left"><thead><tr><th style="padding:0 12px 5px 0">Gas</th><th style="padding:0 12px 5px 0">Moles</th><th style="padding:0 12px 5px 0">Mole fraction</th><th style="padding:0 12px 5px 0">Partial pressure</th></tr></thead><tbody>${rows}</tbody></table></div><p style="margin-top:8px">Total: <b>${(nT * unitP).toFixed(2)} atm</b>. Check any row with $P_i = X_i P_\\text{total}$. Then spotlight one gas, and ask whether it would push any differently alone.</p>`);
    dalStage.redraw();
  }
  const bindDal = (id, key) => Lab.bind(id, id + '-out', (v) => v.toFixed(2) + ' mol', (v) => { dal.n[key] = v; paintDalton(); });
  bindDal('#dal-n2', 'N2'); bindDal('#dal-o2', 'O2'); bindDal('#dal-he', 'He');
  Lab.segmented('#dal-spot', (v) => { dal.spot = v; dalStage.redraw(); });
  Lab.$('#dal-air').addEventListener('click', () => {
    const set = (id, v) => { const el = Lab.$(id); el.value = v; el.dispatchEvent(new Event('input')); };
    set('#dal-n2', 0.8); set('#dal-o2', 0.2); set('#dal-he', 0);
    Lab.toast('Close to real air, which is about 78% nitrogen and 21% oxygen by moles. Pressure is 1.00 atm.', 3600);
  });

  /* ---------- Over water: the rig, used by the story and the bench ---------- */
  const VAPOR = [[15, 12.8], [16, 13.6], [17, 14.5], [18, 15.5], [19, 16.5], [20, 17.5], [21, 18.7], [22, 19.8], [23, 21.1], [24, 22.4], [25, 23.8], [26, 25.2], [27, 26.7], [28, 28.3], [29, 30.0], [30, 31.8], [31, 33.7], [32, 35.7], [33, 37.7], [34, 39.9], [35, 42.2]];
  const vaporAt = (c) => { const i = clamp(Math.round(c) - 15, 0, 20); return VAPOR[i][1]; };
  /** o: { gasH (units of gas in the cylinder), rate (0..1 bubbling), t, levelDiff, labels } */
  function waterRig(g, ox, o) {
    const t = o.t, base = 392;
    // Flask with acid and magnesium.
    const fx = ox + 96;
    const fl = Art.flask(g, fx, base, 140, 180, { level: 0.62, liquid: '#BFE8D0', inside: (gg, b) => {
      if (o.rate > 0) Art.bubbles(gg, b.x0 + 34, b.x1 - 34, b.bottom - 16, b.top + 4, t, { n: Math.round(4 + 8 * o.rate), r: 4 });
    } });
    // Magnesium strip.
    const stripQ = o.strip === undefined ? 1 : o.strip;
    if (stripQ > 0) { g.fillStyle = '#C9CDD8'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2; Art.round(g, fx - 28 * stripQ, base - 20, 56 * stripQ, 11, 3); g.fill(); g.stroke(); }
    // Stopper and delivery tube.
    g.fillStyle = '#6E5140'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    Art.round(g, fx - 25, fl.neckY - 16, 50, 26, 4); g.fill(); g.stroke();
    const cx = ox + 386, mouthY = 372;
    const troughX0 = ox + 240, troughX1 = ox + 530, watY = 322;
    const tube = new Path2D();
    tube.moveTo(fx, fl.neckY + 8); tube.lineTo(fx, fl.neckY - 42); tube.quadraticCurveTo(fx, fl.neckY - 66, fx + 26, fl.neckY - 66);
    tube.lineTo(ox + 278, fl.neckY - 66); tube.quadraticCurveTo(ox + 302, fl.neckY - 66, ox + 302, fl.neckY - 42);
    tube.lineTo(ox + 302, base - 28); tube.quadraticCurveTo(ox + 302, base - 8, ox + 322, base - 8);
    tube.lineTo(cx - 20, base - 8); tube.quadraticCurveTo(cx, base - 8, cx, mouthY - 16);
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = 'rgba(18,7,40,.7)'; g.lineWidth = 11; g.stroke(tube);
    g.strokeStyle = 'rgba(214,240,255,.85)'; g.lineWidth = 7; g.stroke(tube);
    g.strokeStyle = 'rgba(40,24,80,.9)'; g.lineWidth = 3; g.stroke(tube);
    // Trough of water.
    const w = g.createLinearGradient(0, watY, 0, base);
    w.addColorStop(0, 'rgba(90,190,245,.78)'); w.addColorStop(1, 'rgba(30,110,190,.9)');
    g.fillStyle = w; g.fillRect(troughX0 + 3, watY, troughX1 - troughX0 - 6, base - watY - 2);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(troughX0 + 3, watY, troughX1 - troughX0 - 6, 3);
    // Upside-down collecting cylinder.
    const cw = 88, cTop = 36, cBot = mouthY;
    const x0 = cx - cw / 2, x1 = cx + cw / 2;
    const gasH = o.gasH;
    const inside = cTop + gasH + 8 + (o.levelDiff || 0);
    // Water still inside the cylinder.
    const wi = g.createLinearGradient(0, inside, 0, cBot);
    wi.addColorStop(0, 'rgba(120,205,250,.85)'); wi.addColorStop(1, 'rgba(50,140,210,.9)');
    g.fillStyle = wi; g.fillRect(x0 + 2, inside, cw - 4, cBot - inside);
    g.fillStyle = 'rgba(255,255,255,.42)'; g.fillRect(x0 + 2, inside, cw - 4, 3);
    // Gas region.
    g.fillStyle = 'rgba(240,250,255,.1)'; g.fillRect(x0 + 2, cTop + 6, cw - 4, inside - cTop - 6);
    // Bubbles rising inside the cylinder.
    if (o.rate > 0) {
      g.save(); g.beginPath(); g.rect(x0 + 2, inside, cw - 4, cBot - inside); g.clip();
      Art.bubbles(g, cx - 8, cx + 8, cBot + 2, inside, t * 1.1, { n: Math.round(3 + 7 * o.rate), r: 6 });
      g.restore();
    }
    const cyl = new Path2D();
    cyl.moveTo(x0, cBot); cyl.lineTo(x0, cTop + 12); cyl.quadraticCurveTo(x0, cTop, x0 + 12, cTop); cyl.lineTo(x1 - 12, cTop); cyl.quadraticCurveTo(x1, cTop, x1, cTop + 12); cyl.lineTo(x1, cBot);
    g.strokeStyle = 'rgba(18,7,40,.6)'; g.lineWidth = 7; g.stroke(cyl);
    g.strokeStyle = C.glass; g.lineWidth = 3.6; g.stroke(cyl);
    // Tick marks.
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2;
    for (let i = 1; i <= 10; i++) { const y = cTop + 8 + i * 24; g.beginPath(); g.moveTo(x1 - 2, y); g.lineTo(x1 - (i % 5 ? 10 : 18), y); g.stroke(); }
    // Trough outline last, so the glass reads clearly.
    const tr = new Path2D();
    tr.moveTo(troughX0, watY - 30); tr.lineTo(troughX0, base); tr.lineTo(troughX1, base); tr.lineTo(troughX1, watY - 30);
    g.strokeStyle = 'rgba(18,7,40,.6)'; g.lineWidth = 7; g.stroke(tr);
    g.strokeStyle = C.glass; g.lineWidth = 3.6; g.stroke(tr);
    return { cx, x0, x1, cTop, inside, watY, troughX0, troughX1, fx, flaskTop: fl.neckY, base };
  }
  const gasInZoom = (gg, cx, cy, R, t, nW, o = {}) => {
    const b = { x0: cx - R, x1: cx + R, y0: cy - R, y1: cy + R };
    gasField(gg, b, o.n || 14, steady(t, 150, R * 1.6, R * 1.6), { seed: 7, formula: (i) => (i < nW ? 'H2O' : 'H2'), bond: o.bond || 20, r: 26, sparks: false });
  };

  /* ---------- Story 6: collecting over water ---------- */
  Lab.story('#story-water', {
    title: 'Hydrogen in a bottle',
    bg: 'lab',
    scenes: [
      {
        say: 'Meet the setup. Magnesium reacts with acid in the flask: $\\ce{Mg + 2HCl -> MgCl2 + H2}$. A tube carries the gas to an upside-down cylinder that starts <b>full of water</b>.',
        speak: 'Meet the setup. Magnesium reacts with acid in the flask, making hydrogen gas. A tube carries the gas to an upside-down cylinder that starts full of water.',
        dur: 3.4,
        draw(g, p, t) {
          const rig = waterRig(g, 0, { gasH: 0, rate: 0, t, strip: 1 });
          const a = seg(p, 0.1, 0.3), b = seg(p, 0.3, 0.5), c = seg(p, 0.5, 0.7), d = seg(p, 0.7, 0.9);
          Art.text(g, 'magnesium + acid', 112, 424, { size: 24, alpha: a });
          Art.text(g, 'tube', 240, 122, { size: 24, alpha: b, halo: true });
          Art.text(g, 'cylinder full', 600, 96, { size: 25, align: 'left', alpha: c, halo: true, maxW: 190 });
          Art.text(g, 'of water', 600, 128, { size: 25, align: 'left', alpha: c, halo: true });
          Art.arrow(g, 594, 112, rig.x1 + 8, 112, { color: C.ink, w: 4, alpha: c });
          Art.text(g, 'trough of water', 596, 344, { size: 24, align: 'left', alpha: d, halo: true });
          Art.arrow(g, 590, 344, rig.troughX1 - 8, 344, { color: C.ink, w: 4, alpha: d });
        },
      },
      {
        say: 'Hydrogen bubbles along the tube and rises into the cylinder. It collects at the top and <b>pushes the water down</b>. The markings show the gas volume.',
        dur: 3.6,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.08, 0.92));
          const rig = waterRig(g, 0, { gasH: q * 190, rate: 1 - seg(p, 0.86, 1), t, strip: 1 - 0.7 * q });
          Art.text(g, 'H₂ gas', rig.cx, rig.cTop + 30 + q * 60, { font: 'display', size: 28, color: '#fff', halo: true, alpha: seg(p, 0.35, 0.5) });
          Art.arrow(g, rig.x1 + 34, 96, rig.x1 + 34, 96 + 40 + q * 100, { color: C.cyan, w: 8, alpha: seg(p, 0.2, 0.4) });
          Art.text(g, 'water pushed down', 650, 74, { size: 25, color: C.cyan, alpha: seg(p, 0.3, 0.5), halo: true, maxW: 280 });
        },
      },
      {
        say: 'Look closer. Water keeps evaporating into the gas space, so the cylinder holds <b>two gases</b>: hydrogen and water vapor. Both are pushing.',
        dur: 3.4,
        draw(g, p, t) {
          const rig = waterRig(g, 0, { gasH: 190, rate: 0, t, strip: 0.3 });
          zoom(g, rig.cx - 10, rig.cTop + 96, 640, 190, 142, (gg, cx, cy, R) => gasInZoom(gg, cx, cy, R, t, 2, { n: 13, bond: 20 }), { p: seg(p, 0.1, 0.42) });
          const a = seg(p, 0.5, 0.72);
          if (a > 0) {
            Art.pill(g, 'H₂, what you want', 640, 62 - 28 + 0, { size: 22, color: Art.elementColor('H'), text: '#1A0F2E', alpha: a });
            Art.pill(g, 'H₂O vapor, along for the ride', 620, 352, { size: 22, color: Art.elementColor('O'), text: '#fff', alpha: seg(p, 0.65, 0.85) });
          }
        },
      },
      {
        say: 'Raise or lower the cylinder until the water inside and outside are <b>level</b>. Now the pressure inside equals the air pressure in the room.',
        dur: 3.4,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.1, 0.65));
          const rigY = lerp(-30, 0, q);
          const rig = waterRig(g, 0, { gasH: 208 + rigY * 0, rate: 0, t, strip: 0.3, levelDiff: lerp(52, 76, q) });
          const inY = rig.inside;
          // Guide line at the outside water surface.
          const a = seg(p, 0.55, 0.8);
          void rigY;
          g.save(); g.setLineDash([9, 8]); g.strokeStyle = Art.alpha(C.sun, Math.max(a, 0.35)); g.lineWidth = 3;
          g.beginPath(); g.moveTo(rig.troughX0 - 30, rig.watY); g.lineTo(rig.troughX1 + 30, rig.watY); g.stroke(); g.restore();
          Art.text(g, 'level', rig.troughX1 + 40, rig.watY, { font: 'display', size: 30, align: 'left', color: C.sun, alpha: a, halo: true });
          void inY;
          const b = seg(p, 0.68, 0.9);
          if (b > 0) {
            g.fillStyle = Art.alpha(C.plum2, 0.95 * b); Art.round(g, 570, 60, 216, 124, 18); g.fill();
            Art.text(g, 'P inside', 678, 92, { size: 26, alpha: b });
            Art.text(g, '=', 678, 122, { font: 'display', size: 30, color: C.sun, alpha: b });
            Art.text(g, 'P of the room', 678, 154, { size: 26, alpha: b });
          }
        },
      },
      {
        say: 'Apply Dalton\'s law. The total is the room pressure, so <b>subtract the water vapor</b>. At 25 °C and 757 torr, that leaves 757 − 23.8 = 733.2 torr of hydrogen.',
        speak: 'Apply Dalton\'s law. The total is the room pressure, so subtract the water vapor. At 25 degrees Celsius and 757 torr, that leaves 733.2 torr of hydrogen.',
        dur: 3.8,
        draw(g, p) {
          const baseY = 380, k = 0.42, x = 120, w = 150;
          const q = ease.out(seg(p, 0.05, 0.4));
          const hH2 = 733.2 * k * q, hW = 23.8 * k * 3.2 * seg(p, 0.35, 0.55);
          g.fillStyle = Art.elementColor('H'); g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          Art.round(g, x, baseY - hH2, w, hH2, 6); g.fill(); g.stroke();
          g.fillStyle = Art.elementColor('O');
          g.fillRect(x, baseY - hH2 - hW, w, hW); g.strokeRect(x, baseY - hH2 - hW, w, hW);
          Art.text(g, 'H₂', x + w / 2, baseY - hH2 / 2, { font: 'display', size: 44, color: '#1F1236', alpha: q });
          const a = seg(p, 0.42, 0.6);
          Art.text(g, 'water vapor (drawn larger so you can see it)', x + w + 22, baseY - hH2 - hW / 2, { size: 21, align: 'left', alpha: a, color: '#FFB3BA', maxW: 480 });
          const b = seg(p, 0.5, 0.72), c = seg(p, 0.72, 0.9);
          Art.text(g, 'P(total) = P(H₂) + P(water)', x + w + 30, 150, { font: 'display', size: 30, align: 'left', alpha: b, maxW: 470 });
          Art.text(g, '757 torr = P(H₂) + 23.8 torr', x + w + 30, 198, { font: 'display', size: 30, align: 'left', color: C.cyan, alpha: b, maxW: 470 });
          if (c > 0) {
            Art.popIn(g, 530, 292, c, (gg) => {
              gg.fillStyle = C.pink; Art.round(gg, -196, -42, 392, 84, 24); gg.fill();
              Art.text(gg, 'P(H₂) = 733.2 torr', 0, 2, { font: 'display', size: 38, color: '#fff' });
            });
          }
        },
      },
    ],
  });

  /* ---------- Bench: collect hydrogen ---------- */
  const wat = { m: 0.1, c: 25, p: 757, shown: 0 };
  const watCalc = () => {
    const n = wat.m / 24.305, Pw = vaporAt(wat.c), PH2 = wat.p - Pw, T = wat.c + 273.15;
    const VL = (n * R_GAS * T) / (PH2 / 760);
    return { n, Pw, PH2, T, VL, mL: VL * 1000 };
  };
  const watStage = Lab.stage('#c-water', {
    h: 450, bg: 'lab',
    label: 'A flask of acid and magnesium feeding gas into an upside-down cylinder in a water trough, with a tower showing the hydrogen and water vapor pressures.',
    draw(g, t, dt) {
      const c = watCalc();
      const prev = wat.shown;
      wat.shown = dt ? lerp(wat.shown, c.mL, clamp(dt * 1.6)) : c.mL;
      const rate = clamp(Math.abs(wat.shown - c.mL) / 30);
      void prev;
      // Cylinder scale: 240 stage units is 250 mL.
      const gasH = clamp(wat.shown * 0.96, 0, 268);
      const rig = waterRig(g, -10, { gasH, rate, t, strip: rate > 0.02 ? clamp(rate * 1.4 + 0.2) : 0 });
      // Ml labels on the cylinder.
      for (let v = 50; v <= 250; v += 50) {
        const y = rig.cTop + 8 + v * 0.96;
        Art.text(g, String(v), rig.x1 + 6, y, { size: 20, align: 'left', color: '#fff', halo: true });
      }
      // Volume callout.
      Art.text(g, Lab.fmt(wat.shown, 0) + ' mL', rig.x0 - 66, rig.cTop + 8 + gasH, { font: 'display', size: 30, color: C.sun, halo: true });
      // Zoom on the gas.
      if (gasH > 40) {
        const X = c.Pw / wat.p;
        const nW = Math.max(1, Math.round(X * 24));
        zoom(g, rig.cx + 20, rig.cTop + Math.min(36, gasH * 0.4), 552, 104, 80, (gg, cx, cy, R) => gasInZoom(gg, cx, cy, R, t, nW, { n: 10, bond: 12 }), { p: 1, rim: C.cyan });
      }
      // Pressure tower, to scale except the vapor note.
      const bx = 660, bw = 86, base = 372, kk = 0.38;
      const hH2 = c.PH2 * kk, hW = c.Pw * kk;
      g.fillStyle = Art.elementColor('H'); g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      g.fillRect(bx, base - hH2, bw, hH2); g.strokeRect(bx, base - hH2, bw, hH2);
      g.fillStyle = Art.elementColor('O');
      g.fillRect(bx, base - hH2 - hW, bw, hW); g.strokeRect(bx, base - hH2 - hW, bw, hW);
      Art.text(g, 'H₂', bx + bw / 2, base - hH2 / 2 - 30, { font: 'display', size: 30, color: '#1F1236' });
      Art.text(g, Lab.fmt(c.PH2, 1), bx + bw / 2, base - hH2 / 2 + 4, { font: 'display', size: 25, color: '#1F1236' });
      Art.text(g, 'torr', bx + bw / 2, base - hH2 / 2 + 34, { size: 20, color: '#1F1236' });
      Art.text(g, `water ${Lab.fmt(c.Pw, 1)}`, bx + bw / 2, base - hH2 - hW - 18, { size: 22, color: '#FFB3BA' });
      Art.text(g, `${wat.p} torr total`, bx + bw / 2, base - hH2 - hW - 46, { font: 'display', size: 24, color: C.sun, maxW: 136 });
    },
  });
  function paintWater() {
    const c = watCalc();
    const mN = c.n.toFixed(5);
    Lab.$('#wat-foot').innerHTML = Lab.texString(`<ol style="margin:0;padding-left:1.3em">
      <li>Moles of $\\ce{H2}$. One Mg gives one $\\ce{H2}$: $${wat.m.toFixed(2)}\\text{ g} \\div 24.31\\text{ g/mol} = ${mN}\\text{ mol}$.</li>
      <li>Subtract water vapor at ${wat.c} °C: $P_{\\ce{H2}} = ${wat.p} - ${c.Pw.toFixed(1)} = ${c.PH2.toFixed(1)}\\text{ torr} = ${(c.PH2 / 760).toFixed(4)}\\text{ atm}$.</li>
      <li>Volume collected: $V = \\dfrac{nRT}{P} = \\dfrac{(${mN})(0.08206)(${c.T.toFixed(2)})}{${(c.PH2 / 760).toFixed(4)}} = \\mathbf{${c.VL.toFixed(3)}\\text{ L}}$, or <b>${c.mL.toFixed(0)} mL</b>.</li></ol>`);
    watStage.redraw();
  }
  Lab.bind('#wat-m', '#wat-m-out', (v) => v.toFixed(2) + ' g', (v) => { wat.m = v; paintWater(); });
  Lab.bind('#wat-t', '#wat-t-out', (v) => `${v} °C`, (v) => { wat.c = v; paintWater(); });
  Lab.bind('#wat-p', '#wat-p-out', (v) => `${v} torr`, (v) => { wat.p = v; paintWater(); });
});
