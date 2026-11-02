/* Lesson 15: Entropy and free energy. Microstates, a real spreading sim, the four-quadrant chart. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const comb = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
  const big = (v) => Math.round(v).toLocaleString('en-US');
  const LABEL = [C.pink, C.cyan, C.sun, C.leaf];

  /* ---------- Small art ---------- */
  function mug(g, x, y, t) {
    g.fillStyle = '#F2ECFA'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.arc(x + 54, y + 16, 24, -1.3, 1.3); g.lineWidth = 11; g.strokeStyle = '#D9D1EC'; g.stroke();
    g.lineWidth = 3; g.strokeStyle = '#1A0F2E';
    Art.round(g, x - 48, y - 26, 96, 90, 14); g.fill(); g.stroke();
    g.fillStyle = '#5A3420'; g.beginPath(); g.ellipse(x, y - 24, 44, 9, 0, 0, TAU); g.fill();
    Art.smoke(g, x - 14, y - 34, t, { n: 7, h: 74, r: 8, alpha: 0.42 });
    Art.smoke(g, x + 14, y - 34, t + 0.9, { n: 7, h: 64, r: 7, alpha: 0.42 });
  }
  function iceCube(g, x, baseY, s) {
    const d = s * 0.28, top = baseY - s, l = x - s / 2;
    g.fillStyle = '#BFE8FB'; g.beginPath(); g.moveTo(l, top); g.lineTo(l + d, top - d * 0.6); g.lineTo(l + s + d, top - d * 0.6); g.lineTo(l + s, top); g.closePath(); g.fill();
    g.fillStyle = '#6DB9E2'; g.beginPath(); g.moveTo(l + s, top); g.lineTo(l + s + d, top - d * 0.6); g.lineTo(l + s + d, baseY - d * 0.6); g.lineTo(l + s, baseY); g.closePath(); g.fill();
    const f = g.createLinearGradient(l, top, l + s, baseY);
    f.addColorStop(0, '#E9F9FF'); f.addColorStop(1, '#8FD0F0');
    g.fillStyle = f; g.fillRect(l, top, s, s);
    g.strokeStyle = 'rgba(16,8,32,.45)'; g.lineWidth = 2; g.strokeRect(l, top, s, s);
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(l + s * 0.18, top + s * 0.42); g.lineTo(l + s * 0.18, top + s * 0.16); g.lineTo(l + s * 0.42, top + s * 0.16); g.stroke();
  }
  function puddle(g, x, y, w) {
    if (w <= 2) return;
    const gr = g.createRadialGradient(x, y, 2, x, y, w);
    gr.addColorStop(0, 'rgba(120,205,250,.95)'); gr.addColorStop(1, 'rgba(70,160,225,.75)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, w, w * 0.2, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(x - w * 0.3, y - w * 0.05, w * 0.22, w * 0.04, 0, 0, TAU); g.fill();
  }
  function gem(g, x, y, s, t) {
    const pts = [[-1, -0.32], [-0.55, -0.82], [0.55, -0.82], [1, -0.32], [0, 1]];
    const P = pts.map(([a, b]) => [x + a * s, y + b * s]);
    const fan = [[[0, 1], '#CFF4FF'], [[1, 2], '#F5FDFF'], [[2, 3], '#A7E2F6']];
    fan.forEach(([[a, b], col]) => { g.fillStyle = col; g.beginPath(); g.moveTo(P[a][0], P[a][1]); g.lineTo(P[b][0], P[b][1]); g.lineTo(x, y - 0.32 * s); g.closePath(); g.fill(); });
    g.fillStyle = '#7CCDEE'; g.beginPath(); g.moveTo(P[0][0], P[0][1]); g.lineTo(x, y - 0.32 * s); g.lineTo(P[4][0], P[4][1]); g.closePath(); g.fill();
    g.fillStyle = '#B9EBFB'; g.beginPath(); g.moveTo(P[3][0], P[3][1]); g.lineTo(x, y - 0.32 * s); g.lineTo(P[4][0], P[4][1]); g.closePath(); g.fill();
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.lineJoin = 'round';
    g.beginPath(); P.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.stroke();
    g.fillStyle = '#fff';
    [[-0.6, -1.0, 0], [0.82, -0.72, 1.6], [0.4, 0.1, 3.1]].forEach(([a, b, ph]) => { const r = (Math.sin(t * 2.4 + ph) * 0.5 + 0.5) * s * 0.14 + 2; Art.star(g, x + a * s, y + b * s, r, t + ph); g.fill(); });
  }
  function pencil(g, x, y, s) {
    g.save(); g.translate(x, y); g.rotate(-0.5);
    g.fillStyle = '#FFC93C'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, -s * 1.1, -s * 0.2, s * 1.7, s * 0.4, 3); g.fill(); g.stroke();
    g.fillStyle = '#E7B07A'; g.beginPath(); g.moveTo(s * 0.6, -s * 0.2); g.lineTo(s * 1.05, 0); g.lineTo(s * 0.6, s * 0.2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#3B414D'; g.beginPath(); g.moveTo(s * 0.88, -s * 0.08); g.lineTo(s * 1.05, 0); g.lineTo(s * 0.88, s * 0.08); g.closePath(); g.fill();
    g.fillStyle = '#FF7FA3'; Art.round(g, -s * 1.3, -s * 0.2, s * 0.22, s * 0.4, 4); g.fill(); g.stroke();
    g.restore();
  }
  function card(g, x, y, w, h, q, color) {
    g.fillStyle = 'rgba(255,255,255,.07)'; g.strokeStyle = color; g.lineWidth = 4;
    g.save(); g.globalAlpha *= q; Art.round(g, x - w / 2, y, w, h, 20); g.fill(); g.stroke(); g.restore();
  }

  /* ---------- Story 1: why things spread ---------- */
  Lab.story('#story-spread', {
    title: 'Why things spread out',
    scenes: [
      {
        say: 'Coffee cools. Scent spreads across a room. A ball rolls downhill. None of them ever runs backward by itself. We call this direction <b>spontaneous</b>: it can happen without continued outside help.',
        dur: 3.6,
        draw(g, p, t) {
          const xs = [146, 400, 654], W_ = 236, y0 = 22, h = 310;
          xs.forEach((x, i) => { const q = seg(p, 0.02 + i * 0.2, 0.2 + i * 0.2); if (q > 0) card(g, x, y0, W_, h, q, [C.fire, C.violet, C.cyan][i]); });
          const a = seg(p, 0.02, 0.2), b = seg(p, 0.22, 0.4), c = seg(p, 0.42, 0.6);
          g.save(); g.globalAlpha *= a; mug(g, xs[0] - 6, 148, t); g.restore();
          Art.text(g, 'Coffee cools', xs[0], 256, { size: 27, alpha: a });
          // Scent: a bottle, and dots spreading out from it.
          g.save(); g.globalAlpha *= b;
          const bx = xs[1] - 66, by = 196;
          g.fillStyle = '#E2B6FF'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; Art.round(g, bx - 24, by - 40, 48, 60, 10); g.fill(); g.stroke();
          g.fillStyle = '#FFD23F'; Art.round(g, bx - 9, by - 58, 18, 18, 4); g.fill(); g.stroke();
          const sp = ease.out(seg(p, 0.3, 0.9));
          for (let i = 0; i < 22; i++) {
            const tx = xs[1] - 96 + rand(i + 1) * 196 + wander(i, t) * 5, ty = 54 + rand(i + 5) * 150 + wander(i + 6, t) * 5;
            g.fillStyle = C.violet; g.beginPath(); g.arc(lerp(bx, tx, sp), lerp(by - 60, ty, sp), 5, 0, TAU); g.fill();
          }
          g.restore();
          Art.text(g, 'Scent spreads', xs[1], 256, { size: 27, alpha: b });
          // Ball on a slope.
          g.save(); g.globalAlpha *= c;
          g.strokeStyle = C.dim; g.lineWidth = 7; g.lineCap = 'round';
          const sx = (u) => xs[2] - 92 + u * 184, sy = (u) => 90 + 120 * u * u;
          g.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24; if (i) g.lineTo(sx(u), sy(u)); else g.moveTo(sx(u), sy(u)); } g.stroke();
          const u = ease.in(seg(p, 0.46, 0.82));
          g.restore();
          if (c > 0) Art.ball(g, sx(u), sy(u) - 20, 20, C.sun);
          Art.text(g, 'A ball rolls down', xs[2], 256, { size: 27, alpha: c });
          const r = seg(p, 0.68, 0.84);
          xs.forEach((x) => Art.text(g, 'Never backward', x, 298, { size: 24, color: C.red, alpha: r }));
          Art.text(g, 'One-way street: spontaneous', 400, 394, { font: 'display', size: 36, color: C.leaf, alpha: seg(p, 0.82, 0.98) });
        },
      },
      {
        say: 'Is the rule just "energy goes down"? That works for many reactions, but not all. Ice <b>takes in</b> heat as it melts, so $\\Delta H$ is positive, and it melts anyway. Something else is pushing.',
        dur: 4,
        draw(g, p, t) {
          const a = seg(p, 0, 0.2);
          g.save(); g.globalAlpha *= a;
          g.strokeStyle = C.dim; g.lineWidth = 8; g.lineCap = 'round';
          const hx = (u) => 46 + u * 272, hy = (u) => 130 + 170 * u * u;
          g.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24; if (i) g.lineTo(hx(u), hy(u)); else g.moveTo(hx(u), hy(u)); } g.stroke();
          g.restore();
          const u = ease.in(seg(p, 0.05, 0.32));
          if (a > 0) Art.atom(g, hx(u), hy(u) - 26, 26, 'C', { face: 'happy', t, label: false, look: [1, 0.4] });
          Art.text(g, 'Energy going down', 182, 62, { font: 'display', size: 32, color: C.leaf, alpha: a });
          Art.text(g, 'ΔH < 0: that makes sense', 182, 362, { size: 25, alpha: seg(p, 0.2, 0.34) });
          // Ice melting on the right.
          const q = ease.inOut(seg(p, 0.38, 0.92));
          const b = seg(p, 0.32, 0.46);
          g.save(); g.globalAlpha *= b;
          const baseY = 300;
          puddle(g, 610, baseY + 2, lerp(70, 150, q));
          iceCube(g, 610, baseY, lerp(150, 92, q));
          g.restore();
          Art.text(g, 'But ice melts!', 610, 62, { font: 'display', size: 32, color: C.cyan, alpha: b });
          [[440, 150, 530, 186], [780, 150, 690, 186], [448, 268, 526, 268], [776, 268, 694, 268]].forEach(([x1, y1, x2, y2], i) => {
            Art.arrow(g, x1, y1, x2, y2, { color: C.fire, w: 7, p: seg(p, 0.44 + i * 0.05, 0.6 + i * 0.05) });
          });
          Art.text(g, 'Heat flows in', 610, 112, { size: 25, color: C.fire, alpha: seg(p, 0.5, 0.65) });
          Art.text(g, 'ΔH > 0: and it still happens', 610, 362, { size: 25, alpha: seg(p, 0.7, 0.85) });
          Art.moe(g, 392, 444, 96, 'think', { t });
        },
      },
      {
        say: 'Count the ways. Put 4 labeled particles in a box with two halves. There are 16 possible arrangements, called <b>microstates</b>. Only 1 has them all on the left. <b>6</b> have an even split. Even split wins by sheer numbers.',
        dur: 5,
        draw(g, p, t) {
          const cols = [[], [], [], [], []];
          for (let m = 0; m < 16; m++) { let left = 0; for (let b = 0; b < 4; b++) if (m & (1 << b)) left++; cols[4 - left].push(m); }
          const xs = [84, 242, 400, 558, 716];
          const BW = 132, BH = 44, gap = 49;
          const heads = ['4 left', '3 left', '2 left', '1 left', '0 left'];
          let order = 0;
          cols.forEach((list, c) => {
            const yTop = 214 - ((list.length - 1) * gap) / 2;
            const head = seg(p, 0.02 + c * 0.04, 0.12 + c * 0.04);
            Art.text(g, heads[c], xs[c], 40, { font: 'display', size: 28, color: c === 2 ? C.pink : C.ink, alpha: head });
            list.forEach((m, r) => {
              const q = ease.back(seg(p, 0.08 + order * 0.04, 0.16 + order * 0.04)); order++;
              if (q <= 0) return;
              const y = yTop + r * gap;
              g.save(); g.translate(xs[c], y); g.scale(q, q);
              g.fillStyle = c === 2 ? 'rgba(255,79,163,.14)' : 'rgba(255,255,255,.08)'; g.strokeStyle = c === 2 ? C.pink : 'rgba(214,240,255,.5)'; g.lineWidth = 2.5;
              Art.round(g, -BW / 2, -BH / 2, BW, BH, 8); g.fill(); g.stroke();
              g.strokeStyle = 'rgba(214,240,255,.45)'; g.beginPath(); g.moveTo(0, -BH / 2); g.lineTo(0, BH / 2); g.stroke();
              let nl = 0, nr = 0;
              for (let b = 0; b < 4; b++) {
                const onLeft = !!(m & (1 << b));
                const k = onLeft ? nl++ : nr++;
                const px = (onLeft ? -1 : 1) * (BW / 4) + ((k % 2) - 0.5) * 22 , py = (Math.floor(k / 2) - 0.5) * 20;
                Art.ball(g, px, py, 8.5, LABEL[b]);
              }
              g.restore();
            });
            const lab = seg(p, 0.82, 0.96);
            Art.text(g, list.length === 1 ? '1 way' : list.length + ' ways', xs[c], 392, { font: 'display', size: 30, color: c === 2 ? C.pink : C.sun, alpha: lab });
          });
          Art.text(g, 'All 16 are equally likely', 400, 430, { size: 24, color: C.dim, alpha: seg(p, 0.9, 1) });
          void t;
        },
      },
      {
        say: 'With more particles, the odds become absurd. Each particle added <b>doubles</b> the arrangements. For a real sample, all of it gathering on one side is not forbidden. It just never happens.',
        dur: 4,
        draw(g, p, t) {
          const rows = [['4 particles', '1 in 16', 4], ['10 particles', '1 in 1,024', 10], ['100 particles', '1 in 10³⁰', 40], ['1 mole', 'Effectively never', 70]];
          Art.text(g, 'Chance that all are on the left', 400, 36, { size: 28, color: C.dim });
          rows.forEach((row, i) => {
            const q = seg(p, 0.06 + i * 0.21, 0.24 + i * 0.21);
            if (q <= 0) return;
            const y = 104 + i * 86;
            g.save(); g.globalAlpha *= q;
            g.fillStyle = 'rgba(255,255,255,.08)'; g.strokeStyle = 'rgba(214,240,255,.55)'; g.lineWidth = 3;
            Art.round(g, 40, y - 34, 170, 68, 8); g.fill(); g.stroke();
            g.strokeStyle = 'rgba(214,240,255,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(125, y - 34); g.lineTo(125, y + 34); g.stroke();
            const n = row[2], r_ = i === 0 ? 8 : i === 1 ? 6 : i === 2 ? 3.4 : 2.4;
            for (let k = 0; k < n; k++) {
              const x = 48 + rand(k * 3.1 + i) * 154 + wander(k + i * 7, t) * 2, yy = y - 28 + rand(k * 5.3 + i) * 56 + wander(k + i * 9, t) * 2;
              g.fillStyle = C.fire; g.beginPath(); g.arc(x, yy, r_, 0, TAU); g.fill();
            }
            g.restore();
            Art.text(g, row[0], 234, y, { size: 27, align: 'left', alpha: q });
            Art.text(g, row[1], 766, y, { font: 'display', size: i === 3 ? 38 : 40, color: i === 3 ? C.pink : C.sun, align: 'right', alpha: q });
          });
        },
      },
      {
        say: '<b>Entropy</b>, $S$, measures how many ways a system can be arranged: $S = k\\ln W$. Gas has far more ways than liquid, and liquid has more than solid. Many books say "disorder", but spreading of matter and energy is the better picture.',
        dur: 4,
        draw(g, p, t) {
          const items = [
            { x: 146, name: 'Ice', S: 41, color: C.cyan, kind: 0 },
            { x: 400, name: 'Liquid water', S: 70, color: C.water, kind: 1 },
            { x: 654, name: 'Steam', S: 189, color: C.fire, kind: 2 },
          ];
          items.forEach((it, i) => {
            const a = seg(p, 0.02 + i * 0.18, 0.2 + i * 0.18);
            if (a <= 0) return;
            const bx0 = it.x - 112, by0 = 12, bw = 224, bh = 170;
            g.save(); g.globalAlpha *= a;
            g.fillStyle = 'rgba(255,255,255,.06)'; g.strokeStyle = 'rgba(214,240,255,.55)'; g.lineWidth = 3;
            Art.round(g, bx0, by0, bw, bh, 12); g.fill(); g.stroke();
            g.save(); Art.round(g, bx0, by0, bw, bh, 12); g.clip();
            if (it.kind === 0) {
              for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
                const x = bx0 + 34 + c * 52 + wander(r * 4 + c, t * 3) * 1.6, y = by0 + 34 + r * 54 + wander(r * 4 + c + 20, t * 3) * 1.6;
                Art.molecule(g, x, y, 21, 'H2O', { style: 'fill', atomScale: 1.2, labels: false, rot: (r + c) % 2 ? 0.3 : -0.3 });
              }
            } else if (it.kind === 1) {
              for (let k = 0; k < 11; k++) {
                const x = bx0 + 28 + ((k * 0.618 + wander(k, t * 0.6) * 0.03) % 1) * (bw - 56), y = by0 + 28 + rand(k + 3) * (bh - 56) + wander(k + 9, t * 0.8) * 8;
                Art.molecule(g, x, y, 21, 'H2O', { style: 'fill', atomScale: 1.2, labels: false, rot: rand(k) * 6.28 + Math.sin(t * 0.8 + k) });
              }
            } else {
              for (let k = 0; k < 4; k++) {
                const sp = 90 + k * 26;
                const tx = ((t * sp + k * 97) % (2 * (bw - 50))), ty = ((t * (sp * 0.7) + k * 61) % (2 * (bh - 50)));
                const x = bx0 + 25 + (tx > bw - 50 ? 2 * (bw - 50) - tx : tx), y = by0 + 25 + (ty > bh - 50 ? 2 * (bh - 50) - ty : ty);
                Art.molecule(g, x, y, 21, 'H2O', { style: 'fill', atomScale: 1.2, labels: false, rot: t * (1 + k * 0.4) });
              }
            }
            g.restore();
            g.restore();
            const hgt = ease.out(seg(p, 0.1 + i * 0.18, 0.34 + i * 0.18)) * (it.S / 189) * 96;
            const base = 330;
            g.fillStyle = it.color; Art.round(g, it.x - 40, base - Math.max(hgt, 4), 80, Math.max(hgt, 4), 8); g.fill();
            Art.text(g, String(it.S), it.x, base - hgt - 22, { font: 'display', size: 32, color: '#fff', alpha: a });
            Art.text(g, it.name, it.x, 356, { size: 25, alpha: a });
          });
          const q = ease.back(seg(p, 0.76, 0.94));
          if (q > 0) {
            g.save(); g.translate(400, 410); g.scale(q, q);
            g.fillStyle = C.plum2; Art.round(g, -330, -28, 660, 56, 22); g.fill();
            Art.text(g, 'S° in J/(mol K). More ways, more entropy.', 0, 1, { size: 27, color: C.sun });
            g.restore();
          }
        },
      },
      {
        say: 'That gives the <b>second law</b>: in every spontaneous process, the entropy of the <b>universe</b> goes up. One part can go down, as water does when it freezes, as long as the surroundings gain more.',
        dur: 4,
        draw(g, p, t) {
          const base = 226, xs = [150, 400, 650];
          const vals = [-1, 1.32, 0.32];
          const cols = [C.cyan, C.fire, C.leaf];
          const names = ['The water', 'The surroundings', 'The universe'];
          const signs = ['ΔS is negative', 'ΔS is positive', 'ΔS is positive'];
          g.fillStyle = C.line; g.fillRect(50, base - 1.5, 700, 3);
          xs.forEach((x, i) => {
            const q = ease.out(seg(p, 0.08 + i * 0.24, 0.3 + i * 0.24));
            if (q <= 0) return;
            const h = vals[i] * 112 * q;
            g.fillStyle = cols[i];
            if (h >= 0) Art.round(g, x - 52, base - h, 104, Math.max(h, 3), 10); else Art.round(g, x - 52, base, 104, Math.max(-h, 3), 10);
            g.fill();
            Art.text(g, names[i], x, 38, { font: 'display', size: 30, color: cols[i], alpha: q });
            Art.text(g, signs[i], x, h >= 0 ? 372 : 372, { size: 25, alpha: q });
          });
          Art.text(g, '+', 275, base - 56, { font: 'display', size: 48, color: C.ink, alpha: seg(p, 0.3, 0.44) });
          Art.text(g, '=', 525, base - 56, { font: 'display', size: 48, color: C.ink, alpha: seg(p, 0.56, 0.7) });
          Art.text(g, 'The total always goes up. Bars are not to scale.', 400, 416, { size: 26, color: C.leaf, alpha: seg(p, 0.76, 0.94) });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: the spreading box ---------- */
  const MB = { x0: 14, y0: 58, x1: 440, y1: 418 };
  const MID = (MB.x0 + MB.x1) / 2;
  const ms = { N: 8, open: false, box: null, lift: 0, time: [], total: 0, back: 0, wasAll: true, flash: 0, k: 8, tries: 0 };
  function buildMs() {
    const box = new Sim.Box({ x0: MB.x0, y0: MB.y0, x1: MID - 6, y1: MB.y1, speed: 250, seed: 3 + Math.floor(Math.random() * 999) });
    box.add({ n: ms.N, r: 18, kind: 'Ne' });
    ms.box = box; ms.open = false; ms.lift = 0;
    ms.time = new Array(ms.N + 1).fill(0); ms.total = 0; ms.since = 0; ms.back = 0; ms.wasAll = true; ms.flash = 0; ms.k = ms.N;
    paintMs();
  }
  function paintMs() {
    const W = comb(ms.N, ms.k), total = Math.pow(2, ms.N);
    Lab.$('#ms-ways').textContent = big(W);
    Lab.$('#ms-total').textContent = big(total);
    Lab.$('#ms-back').textContent = ms.open ? ms.back : '—';
    Lab.$('#ms-wall').textContent = ms.open ? 'Put them back and close it' : 'Remove the wall';
  }
  function saySpread() {
    const N = ms.N, total = Math.pow(2, N), even = comb(N, Math.floor(N / 2));
    Lab.$('#ms-say').innerHTML = Lab.texString(`<p>With ${N} particles, there are $2^{${N}} = ${big(total)}$ arrangements, and only <b>1</b> has them all on the left. The most even split has <b>${big(even)}</b>. Yellow dots show where this box really spends its time. Try 3 particles, then try 24. A simplified 2D model.</p>`);
  }
  function msDraw(g, t, dt) {
    const box = ms.box;
    if (dt > 0) {
      box.step(dt);
      ms.lift = lerp(ms.lift, ms.open ? 1 : 0, clamp(dt * 5));
      const k = box.particles.filter((q) => q.x < MID).length;
      if (k !== ms.k) { ms.k = k; paintMs(); }
      if (ms.open) {
        // The first seconds are the spreading itself. After that, tally where the box spends its time.
        ms.since += dt;
        if (ms.since > 2.5) { ms.time[k] += dt; ms.total += dt; }
        const all = k === ms.N;
        if (all && !ms.wasAll) { ms.back++; ms.flash = 1; paintMs(); Lab.sound.pop(); }
        ms.wasAll = all;
      }
      ms.flash = Math.max(0, ms.flash - dt * 0.7);
    }
    // The box.
    g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, MB.x0, MB.y0, MB.x1 - MB.x0, MB.y1 - MB.y0, 10); g.fill();
    g.strokeStyle = 'rgba(214,240,255,.65)'; g.lineWidth = 4; g.stroke();
    if (ms.lift > 0.02) { g.save(); g.setLineDash([8, 10]); g.strokeStyle = 'rgba(214,240,255,.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(MID, MB.y0); g.lineTo(MID, MB.y1); g.stroke(); g.restore(); }
    box.particles.forEach((q, i) => {
      Art.atom(g, q.x, q.y, 18, 'Ne', { label: false, face: i === 0 ? 'happy' : null, look: [Math.sign(q.vx), Math.sign(q.vy) * 0.4], t });
    });
    if (ms.lift < 0.98) {
      g.save(); Art.round(g, MB.x0, MB.y0, MB.x1 - MB.x0, MB.y1 - MB.y0, 10); g.clip();
      const h = MB.y1 - MB.y0, top = MB.y0 - h * ms.lift;
      const wall = g.createLinearGradient(MID - 7, 0, MID + 7, 0);
      wall.addColorStop(0, '#8F88AD'); wall.addColorStop(0.5, '#E4E0F2'); wall.addColorStop(1, '#6F6A8B');
      g.fillStyle = wall; g.fillRect(MID - 6, top, 12, h);
      g.restore();
    }
    const kNow = ms.k;
    Art.pill(g, 'Left: ' + kNow, MB.x0 + 110, 30, { size: 25, color: C.plum2, text: C.sun, font: 'display' });
    Art.pill(g, 'Right: ' + (ms.N - kNow), MB.x1 - 110, 30, { size: 25, color: C.plum2, text: C.sun, font: 'display' });
    if (ms.flash > 0) {
      g.save(); g.globalAlpha *= clamp(ms.flash * 2);
      Art.pill(g, 'All back on the left!', (MB.x0 + MB.x1) / 2, MB.y0 + 44, { size: 26, color: C.leaf, text: '#14301F' });
      g.restore();
    }
    Art.text(g, 'All on the left: 1 in ' + big(Math.pow(2, ms.N)), (MB.x0 + MB.x1) / 2, 446, { size: 25, color: C.sun });
    // The chart of ways.
    const x0 = 470, x1 = 786, y0 = 362, top = 84;
    const peak = comb(ms.N, Math.floor(ms.N / 2));
    const n = ms.N + 1, bw = (x1 - x0) / n;
    Art.text(g, 'Ways to get each split', (x0 + x1) / 2, 30, { size: 25, color: C.dim });
    for (let k = 0; k <= ms.N; k++) {
      const W = comb(ms.N, k), h = Math.max(3, (W / peak) * (y0 - top));
      const cur = k === kNow;
      g.fillStyle = cur ? C.pink : Art.alpha(C.violet, 0.65);
      Art.round(g, x0 + k * bw + 1.5, y0 - h, Math.max(2, bw - 3), h, Math.min(5, bw / 3)); g.fill();
    }
    // The time this real box has spent at each split, against the same height scale.
    if (ms.total > 3) {
      const peakShare = peak / Math.pow(2, ms.N);
      for (let k = 0; k <= ms.N; k++) {
        const share = ms.time[k] / ms.total;
        if (share <= 0) continue;
        const h = Math.min(y0 - top + 34, (share / peakShare) * (y0 - top));
        Art.ball(g, x0 + (k + 0.5) * bw, y0 - h, Math.min(7, bw * 0.34), C.sun);
      }
    }
    g.fillStyle = C.dim; g.fillRect(x0, y0, x1 - x0, 3);
    const curH = Math.max(3, (comb(ms.N, kNow) / peak) * (y0 - top));
    const labelX = clamp(x0 + (kNow + 0.5) * bw, x0 + 62, x1 - 62);
    Art.text(g, big(comb(ms.N, kNow)) + (comb(ms.N, kNow) === 1 ? ' way' : ' ways'), labelX, Math.max(58, y0 - curH - 22), { font: 'display', size: 25, color: C.pink, halo: true });
    Art.text(g, '0', x0 + 0.5 * bw, y0 + 24, { size: 22, color: C.dim });
    Art.text(g, String(ms.N), x1 - 0.5 * bw, y0 + 24, { size: 22, color: C.dim });
    Art.text(g, 'How many on the left', (x0 + x1) / 2, y0 + 56, { size: 23, color: C.dim });
    void t;
  }
  buildMs();
  const spreadStage = Lab.stage('#c-spread', {
    h: 470,
    label: 'A box of bouncing particles with a removable wall, beside a bar chart of how many arrangements each left-right split has.',
    draw: msDraw,
  });
  Lab.bind('#ms-n', '#ms-n-out', (v) => v, (v) => { if (v !== ms.N) { ms.N = v; buildMs(); } saySpread(); });
  Lab.$('#ms-wall').addEventListener('click', () => {
    if (ms.open) buildMs();
    else {
      ms.open = true; ms.wasAll = true;
      ms.box.setBounds(MB.x0, MB.y0, MB.x1, MB.y1);
      paintMs();
    }
    Lab.sound.pop();
    if (!spreadStage.playing) spreadStage.play();
  });

  /* ---------- Story 2: free energy ---------- */
  /** Draw colored pieces of an equation in one line and return each piece's center. */
  function pieces(g, list, x, y, size) {
    g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
    let w = 0;
    list.forEach((it) => { it.w = g.measureText(it.s).width; w += it.w; });
    let cx = x - w / 2;
    list.forEach((it) => { Art.text(g, it.s, cx, y, { font: 'display', size, color: it.c, align: 'left', alpha: it.a }); it.x = cx + it.w / 2; cx += it.w; });
    return list;
  }
  Lab.story('#story-gibbs', {
    title: 'Energy against spreading',
    scenes: [
      {
        say: 'Two urges decide what happens. Systems tend to go <b>down in energy</b>, and things tend to <b>spread out</b>. Sometimes both agree. Often they pull in opposite directions.',
        dur: 3.4,
        draw(g, p, t) {
          const a = seg(p, 0, 0.3), b = seg(p, 0.3, 0.6);
          if (a > 0) card(g, 205, 28, 350, 300, a, C.fire);
          if (b > 0) card(g, 595, 28, 350, 300, b, C.cyan);
          Art.text(g, 'Lower the energy', 205, 66, { font: 'display', size: 32, color: C.fire, alpha: a });
          Art.text(g, 'Spread out', 595, 66, { font: 'display', size: 32, color: C.cyan, alpha: b });
          g.save(); g.globalAlpha *= a;
          g.strokeStyle = C.dim; g.lineWidth = 7; g.lineCap = 'round';
          const hx = (u) => 70 + u * 270, hy = (u) => 130 + 150 * u * u;
          g.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24; if (i) g.lineTo(hx(u), hy(u)); else g.moveTo(hx(u), hy(u)); } g.stroke();
          const u = ((t * 0.3) % 1.3);
          Art.ball(g, hx(Math.min(1, ease.in(Math.min(1, u)))), hy(Math.min(1, ease.in(Math.min(1, u)))) - 22, 22, C.sun);
          g.restore();
          g.save(); g.globalAlpha *= b;
          const sp = (Math.sin(t * 0.8) * 0.5 + 0.5);
          for (let i = 0; i < 14; i++) {
            const x0 = 480 + (i % 4) * 22, y0 = 170 + Math.floor(i / 4) * 22;
            const x1 = 445 + rand(i + 1) * 300, y1 = 100 + rand(i + 4) * 165;
            Art.atom(g, lerp(x0, x1, sp) + wander(i, t) * 3, lerp(y0, y1, sp) + wander(i + 4, t) * 3, 12, 'Ne', { label: false });
          }
          g.restore();
          Art.text(g, 'ΔH negative helps', 205, 300, { size: 26, alpha: a });
          Art.text(g, 'ΔS positive helps', 595, 300, { size: 26, alpha: b });
          Art.text(g, 'Who wins? Temperature decides.', 400, 396, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.72, 0.92) });
        },
      },
      {
        say: '<b>Gibbs free energy</b> combines both into one number. Temperature multiplies the entropy term, so it acts like a volume knob: the hotter it gets, the louder entropy\'s voice becomes.',
        dur: 4,
        draw(g, p, t) {
          const a = seg(p, 0, 0.15);
          const parts = pieces(g, [
            { s: 'ΔG', c: C.pink, a }, { s: ' = ', c: C.ink, a }, { s: 'ΔH', c: C.fire, a }, { s: ' − ', c: C.ink, a }, { s: 'T', c: C.sun, a }, { s: 'ΔS', c: C.cyan, a },
          ], 400, 186, 88);
          const lab = [
            { i: 0, x: 130, y: 62, s: 'The verdict', c: C.pink, w: seg(p, 0.15, 0.32) },
            { i: 2, x: 360, y: 62, s: 'The energy part', c: C.fire, w: seg(p, 0.3, 0.48) },
            { i: 4, x: 400, y: 340, s: 'Temperature, in kelvin', c: C.sun, w: seg(p, 0.46, 0.64) },
            { i: 5, x: 650, y: 62, s: 'The spreading part', c: C.cyan, w: seg(p, 0.62, 0.8) },
          ];
          lab.forEach((L) => {
            Art.text(g, L.s, L.x, L.y, { size: 28, color: L.c, alpha: L.w });
            const from = L.y < 186 ? L.y + 22 : L.y - 22, to = L.y < 186 ? 136 : 240;
            Art.arrow(g, L.x, from, parts[L.i].x, to, { color: L.c, w: 5, p: L.w });
          });
          Art.text(g, 'Negative ΔG: it can go on its own', 400, 404, { font: 'display', size: 32, color: C.leaf, alpha: seg(p, 0.8, 0.98) });
          void t;
        },
      },
      {
        say: 'The sign is the verdict. <b>Negative</b> means spontaneous as written. <b>Positive</b> means the reverse direction is spontaneous instead. <b>Zero</b> means the system is at equilibrium.',
        dur: 3.6,
        draw(g, p, t) {
          const rows = [
            ['ΔG < 0', 'Spontaneous forward', C.leaf, '#14301F', 1],
            ['ΔG = 0', 'At equilibrium', C.sun, '#2B2100', 0],
            ['ΔG > 0', 'Reverse is spontaneous', C.red, '#fff', -1],
          ];
          rows.forEach((row, i) => {
            const q = ease.back(seg(p, 0.05 + i * 0.26, 0.28 + i * 0.26));
            if (q <= 0) return;
            const y = 92 + i * 128;
            g.save(); g.translate(150, y); g.scale(q, q);
            g.fillStyle = row[2]; Art.round(g, -116, -44, 232, 88, 28); g.fill();
            Art.text(g, row[0], 0, 2, { font: 'display', size: 44, color: row[3] });
            g.restore();
            Art.text(g, row[1], 288, y, { size: 29, align: 'left', alpha: q });
            const ax = 706, w = 66, wig = wander(i, t) * 3;
            if (row[4] > 0) Art.arrow(g, ax - w, y + wig, ax + w, y + wig, { color: row[2], w: 13, p: q });
            else if (row[4] < 0) Art.arrow(g, ax + w, y + wig, ax - w, y + wig, { color: row[2], w: 13, p: q });
            else {
              Art.arrow(g, ax - w, y - 16, ax + w, y - 16, { color: row[2], w: 8, p: q });
              Art.arrow(g, ax + w, y + 16, ax - w, y + 16, { color: row[2], w: 8, p: q });
            }
          });
        },
      },
      {
        say: 'Ice shows temperature settling the argument. Melting has $\\Delta H = +6.01$ kJ and $\\Delta S = +22.0$ J/K, per mole. Below 0 °C the energy term wins. Above it, entropy wins. At 273 K it is a tie.',
        dur: 4.4,
        draw(g, p, t) {
          const rows = [
            { x: 146, T: 263, c: '−10 °C', val: '+0.22 kJ', say: 'Stays frozen', col: C.red, ice: 104, pud: 0 },
            { x: 400, T: 273, c: '0 °C', val: '0 kJ', say: 'Ice and water', col: C.sun, ice: 84, pud: 96 },
            { x: 654, T: 283, c: '+10 °C', val: '−0.22 kJ', say: 'Melts', col: C.leaf, ice: 0, pud: 118 },
          ];
          rows.forEach((r, i) => {
            const q = seg(p, 0.04 + i * 0.28, 0.26 + i * 0.28);
            if (q <= 0) return;
            card(g, r.x, 14, 238, 408, q, r.col);
            Art.text(g, r.c, r.x, 52, { font: 'display', size: 36, alpha: q });
            Art.text(g, r.T + ' K', r.x, 88, { size: 24, color: C.dim, alpha: q });
            g.save(); g.globalAlpha *= q;
            puddle(g, r.x, 226, r.pud);
            if (r.ice > 0) iceCube(g, r.x, 226, r.ice);
            g.restore();
            Art.text(g, `6.01 − ${r.T}(0.0220)`, r.x, 278, { size: 23, color: C.dim, alpha: q });
            Art.text(g, 'ΔG = ' + r.val, r.x, 326, { font: 'display', size: 30, color: r.col, alpha: q });
            Art.text(g, r.say, r.x, 380, { size: 26, alpha: q });
          });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: the four-quadrant chart ---------- */
  const PRE = {
    ice: { name: 'Ice melts', H: 6.01, S: 22.0, Sx: 50, Hy: 15, tex: '\\ce{H2O(s) -> H2O(l)}' },
    boil: { name: 'Water boils', H: 40.7, S: 109, Sx: 200, Hy: 70, tex: '\\ce{H2O(l) -> H2O(g)}' },
    lime: { name: 'Limestone breaks down', H: 178, S: 161, Sx: 300, Hy: 300, tex: '\\ce{CaCO3(s) -> CaO(s) + CO2(g)}' },
    nh3: { name: 'Making ammonia', H: -92.2, S: -198.7, Sx: 300, Hy: 150, tex: '\\ce{N2(g) + 3H2(g) -> 2NH3(g)}' },
    h2o2: { name: 'Peroxide falls apart', H: -196, S: 126, Sx: 300, Hy: 300, tex: '\\ce{2H2O2(l) -> 2H2O(l) + O2(g)}' },
    o3: { name: 'Oxygen to ozone', H: 285, S: -137, Sx: 300, Hy: 500, tex: '\\ce{3O2(g) -> 2O3(g)}' },
    dia: { name: 'Diamond to graphite', H: -1.9, S: 3.3, Sx: 8, Hy: 4, tex: '\\ce{C(diamond) -> C(graphite)}' },
  };
  const Q = { pre: 'ice', H: 6.01, S: 22, T: 298, Sx: 50, Hy: 15, curSx: 50, curHy: 15, name: 'Ice melts', dragging: false };
  const CH = { x0: 30, x1: 572, y0: 18, y1: 450 };
  const cx = (CH.x0 + CH.x1) / 2, cy = (CH.y0 + CH.y1) / 2;
  const toX = (S) => cx + (S / Q.curSx) * (CH.x1 - cx), toY = (H) => cy - (H / Q.curHy) * (cy - CH.y0);
  const fromX = (x) => ((x - cx) / (CH.x1 - cx)) * Q.curSx, fromY = (y) => ((cy - y) / (cy - CH.y0)) * Q.curHy;
  const dG = () => Q.H - (Q.T * Q.S) / 1000;
  const fmtV = (v) => { const a = Math.abs(v); return (v < 0 ? '−' : '+') + (a < 10 ? a.toFixed(2) : a < 100 ? a.toFixed(1) : a.toFixed(0)); };
  const verdict = () => {
    const G = dG(), scale = Math.max(Math.abs(Q.H), Math.abs(Q.T * Q.S) / 1000, 1e-9);
    if (Math.abs(G) < 0.004 * scale) return { s: 'At equilibrium', c: C.sun, t: '#2B2100' };
    return G < 0 ? { s: 'Spontaneous', c: C.leaf, t: '#14301F' } : { s: 'Not spontaneous', c: C.red, t: '#fff' };
  };
  function quadDraw(g, t, dt) {
    Q.curSx = lerp(Q.curSx, Q.Sx, dt > 0 ? clamp(dt * 6) : 1);
    Q.curHy = lerp(Q.curHy, Q.Hy, dt > 0 ? clamp(dt * 6) : 1);
    const w = CH.x1 - CH.x0, h = CH.y1 - CH.y0;
    g.save(); Art.round(g, CH.x0, CH.y0, w, h, 12); g.clip();
    // ΔG = 0 is the line ΔH = TΔS through the origin. Everything below it has a negative ΔG.
    const yAt = (x) => toY((Q.T * fromX(x)) / 1000);
    g.fillStyle = 'rgba(255,90,107,.2)'; g.fillRect(CH.x0, CH.y0, w, h);
    g.fillStyle = 'rgba(61,220,132,.3)';
    g.beginPath(); g.moveTo(CH.x0, yAt(CH.x0)); g.lineTo(CH.x1, yAt(CH.x1)); g.lineTo(CH.x1, CH.y1 + 2000); g.lineTo(CH.x0, CH.y1 + 2000); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(CH.x0, cy); g.lineTo(CH.x1, cy); g.moveTo(cx, CH.y0); g.lineTo(cx, CH.y1); g.stroke();
    g.strokeStyle = C.sun; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(CH.x0, yAt(CH.x0)); g.lineTo(CH.x1, yAt(CH.x1)); g.stroke();
    g.restore();
    g.strokeStyle = 'rgba(214,240,255,.55)'; g.lineWidth = 3; Art.round(g, CH.x0, CH.y0, w, h, 12); g.stroke();
    // Quadrant names.
    const q = 23;
    Art.text(g, 'Never spontaneous', CH.x0 + 12, CH.y0 + 26, { size: q, align: 'left', color: '#FFD0D5', halo: true });
    Art.text(g, 'Spontaneous if hot', CH.x1 - 12, CH.y0 + 26, { size: q, align: 'right', color: '#FFD9A8', halo: true });
    Art.text(g, 'Spontaneous if cold', CH.x0 + 12, CH.y1 - 26, { size: q, align: 'left', color: '#BFE9FF', halo: true });
    Art.text(g, 'Always spontaneous', CH.x1 - 12, CH.y1 - 26, { size: q, align: 'right', color: '#C8F8DA', halo: true });
    // Axis labels with the current range.
    const sx = Math.round(Q.curSx * 10) / 10, hy = Math.round(Q.curHy * 10) / 10;
    Art.text(g, 'ΔH', cx - 10, CH.y0 + 60, { size: 24, align: 'right', color: C.ink, halo: true });
    Art.text(g, 'ΔS', CH.x1 - 12, cy - 20, { size: 24, align: 'right', color: C.ink, halo: true });
    Art.text(g, 'Top edge: +' + hy + ' kJ. Right edge: +' + sx + ' J/K.', cx, CH.y1 + 26, { size: 22, color: C.dim });
    // Dashed guides to the dot, then the dot.
    const dx = clamp(toX(Q.S), CH.x0 + 4, CH.x1 - 4), dy = clamp(toY(Q.H), CH.y0 + 4, CH.y1 - 4);
    g.save(); g.setLineDash([7, 7]); g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(dx, dy); g.lineTo(dx, cy); g.moveTo(dx, dy); g.lineTo(cx, dy); g.stroke(); g.restore();
    // The ΔG = 0 label sits on the far side of the line from the dot.
    const dir = Q.S > 0 ? -1 : 1;
    const span = (CH.x1 - cx) * 0.62;
    let lx = cx + dir * span, ly = yAt(lx);
    if (ly < CH.y0 + 56 || ly > CH.y1 - 56) { const lim = dir > 0 ? CH.y0 + 56 : CH.y1 - 56; ly = lim; lx = toX((-((ly - cy) / (cy - CH.y0)) * Q.curHy * 1000) / Q.T); }
    Art.text(g, 'ΔG = 0', lx, ly + (dir > 0 ? 28 : -28), { font: 'display', size: 26, color: C.sun, halo: true });
    const V = verdict();
    const pulse = 1 + Math.sin(t * 4) * 0.05;
    Art.glow(g, dx, dy, 40, V.c, 0.55);
    Art.ball(g, dx, dy, 17 * pulse, V.c);
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(dx, dy, 17 * pulse, 0, TAU); g.stroke();
    const nameY = dy - 42 > CH.y0 + 66 ? dy - 42 : dy + 42;
    Art.pill(g, Q.name, clamp(dx, CH.x0 + 150, CH.x1 - 150), nameY, { size: 23, color: '#1A0F2E', text: '#fff', stroke: V.c });

    // The verdict panel.
    const G = dG();
    const X0 = 584, X1 = 794, mx = (X0 + X1) / 2;
    Art.text(g, 'ΔG', mx, 34, { font: 'display', size: 30, color: C.dim });
    Art.text(g, fmtV(G) + ' kJ', mx, 80, { font: 'display', size: 40, color: V.c });
    Art.pill(g, V.s, mx, 130, { size: 22, color: V.c, text: V.t });
    // Bars: ΔH and −TΔS add up to ΔG.
    const base = 310, room = 112;
    const parts = [
      { n: 'ΔH', v: Q.H, c: C.fire }, { n: '−TΔS', v: -(Q.T * Q.S) / 1000, c: C.cyan }, { n: 'ΔG', v: G, c: V.c },
    ];
    const top = Math.max(...parts.map((b) => Math.abs(b.v)), 1e-6);
    const bw = 54;
    parts.forEach((b, i) => {
      const x = X0 + 12 + i * ((X1 - X0 - 24) / 3) + 6;
      const hh = (b.v / top) * room;
      g.fillStyle = b.c;
      if (hh >= 0) Art.round(g, x, base - Math.max(hh, 2), bw, Math.max(hh, 2), 6); else Art.round(g, x, base, bw, Math.max(-hh, 2), 6);
      g.fill();
      Art.text(g, b.n, x + bw / 2, 456, { size: i === 1 ? 20 : 22, color: b.c === V.c ? V.c : b.c });
    });
    g.fillStyle = C.dim; g.fillRect(X0 + 4, base - 1, X1 - X0 - 8, 3);
    void dt;
  }
  const quadStage = Lab.stage('#c-quad', {
    h: 496, drag: true,
    label: 'A four-quadrant chart of enthalpy against entropy. A yellow line rotates with temperature, separating the spontaneous region from the rest, with a draggable dot for the reaction.',
    onPointer(e) {
      const inChart = e.x > CH.x0 && e.x < CH.x1 && e.y > CH.y0 && e.y < CH.y1;
      if (e.type === 'hover') { quadStage.canvas.style.cursor = inChart ? 'grab' : 'default'; return; }
      if (e.type === 'up') { Q.dragging = false; return; }
      if (e.type === 'down' && !inChart) return;
      if (e.type === 'down') Q.dragging = true;
      if (!Q.dragging) return;
      const stepS = Q.Sx / 200, stepH = Q.Hy / 200;
      Q.S = Math.round(clamp(fromX(e.x), -Q.Sx, Q.Sx) / stepS) * stepS;
      Q.H = Math.round(clamp(fromY(e.y), -Q.Hy, Q.Hy) / stepH) * stepH;
      if (Q.pre) { Q.pre = null; Q.name = 'Your reaction'; Lab.$$('#q-pre button').forEach((b) => b.setAttribute('aria-pressed', 'false')); }
      paintQuad();
    },
    draw: quadDraw,
  });
  const v2 = (x) => { const a = Math.abs(x); return (a < 10 ? x.toFixed(2) : a < 100 ? x.toFixed(1) : x.toFixed(0)); };
  const vS = (x) => (Math.abs(x) < 10 ? x.toFixed(2) : x.toFixed(1));
  function paintQuad() {
    const G = dG(), Sk = Q.S / 1000;
    const pre = Q.pre ? PRE[Q.pre] : null;
    const rows = [];
    if (pre) rows.push(`<p>$${pre.tex}$ with $\\Delta H = ${fmtTex(Q.H)}$ kJ and $\\Delta S = ${(Q.S < 0 ? '-' : '+') + vS(Math.abs(Q.S))}$ J/K, per mole of reaction as written. A common simplification: both are treated as constant with temperature.</p>`);
    rows.push(`<div class="calc-line">$$\\Delta G = (${v2(Q.H)}) - (${Q.T})(${Sk.toFixed(Math.abs(Sk) < 0.1 ? 4 : 3)}) = ${v2(G)}\\text{ kJ}$$</div>`);
    if (Math.abs(Q.S) < 1e-9 || Math.abs(Q.H) < 1e-9 || Q.H * Q.S < 0) rows.push('<p>The signs of $\\Delta H$ and $\\Delta S$ differ, so <b>no temperature can flip this one</b>. Slide the temperature and watch the dot stay on the same side.</p>');
    else {
      const flip = (Q.H * 1000) / Q.S;
      rows.push(`<p>The verdict flips at $T = \\Delta H / \\Delta S = ${flip < 1000 ? flip.toFixed(0) : Lab.sig(flip, 3)}$ K: <b>spontaneous ${Q.S > 0 ? 'above' : 'below'}</b> that. The yellow line is where $\\Delta H = T\\Delta S$. Anything below it is in the green, so $\\Delta G$ is negative.</p>`);
    }
    Lab.$('#q-calc').innerHTML = Lab.texString(rows.join(''));
  }
  function fmtTex(v) { return (v < 0 ? '-' : '+') + v2(Math.abs(v)); }
  Lab.segmented('#q-pre', (v) => {
    const P = PRE[v];
    Q.pre = v; Q.H = P.H; Q.S = P.S; Q.Sx = P.Sx; Q.Hy = P.Hy; Q.name = P.name;
    paintQuad();
    quadStage.redraw();
  });
  Lab.bind('#q-t', '#q-t-out', (v) => `${v} K (${v - 273} °C)`, (v) => { Q.T = v; paintQuad(); });

  /* ---------- Story 3: spontaneous does not mean fast ---------- */
  const Hill = { x0: 80, x1: 720, re: 300, pr: 330, top: 62 };
  const hillAt = (u) => {
    const s = (v) => { const q = clamp(v); return q * q * (3 - 2 * q); };
    return u < 0.5 ? lerp(Hill.re, Hill.top, s((u - 0.16) / 0.34)) : lerp(Hill.top, Hill.pr, s((u - 0.5) / 0.34));
  };
  Lab.story('#story-slow', {
    title: 'Spontaneous does not mean fast',
    scenes: [
      {
        say: 'Here is a surprise. For diamond turning into graphite, $\\Delta G^\\circ$ is about <b>−2.9 kJ/mol</b>. It is negative, so it is spontaneous. Your diamond ring "wants" to become pencil lead.',
        dur: 3.6,
        draw(g, p, t) {
          g.save(); g.globalAlpha *= seg(p, 0, 0.2); gem(g, 180, 176, 96, t); g.restore();
          Art.text(g, 'Diamond', 180, 312, { font: 'display', size: 36, color: '#BDEBFA', alpha: seg(p, 0, 0.2) });
          Art.arrow(g, 310, 180, 480, 180, { color: C.leaf, w: 10, p: seg(p, 0.25, 0.5) });
          Art.text(g, 'ΔG° = −2.9 kJ/mol', 396, 120, { font: 'display', size: 28, color: C.leaf, alpha: seg(p, 0.4, 0.55) });
          g.save(); g.globalAlpha *= seg(p, 0.48, 0.66); pencil(g, 620, 180, 118); g.restore();
          Art.text(g, 'Graphite', 620, 312, { font: 'display', size: 36, color: C.ink, alpha: seg(p, 0.48, 0.66) });
          Art.text(g, 'Spontaneous!', 400, 392, { font: 'display', size: 44, color: C.sun, alpha: seg(p, 0.7, 0.88) });
        },
      },
      {
        say: 'So why do diamonds last? Look at the hill. The drop in free energy is tiny. The <b>activation energy</b> is enormous, because diamond\'s strong bonds must break first. At room temperature, the reaction is far too slow to notice.',
        dur: 4.4,
        draw(g, p, t) {
          const X = (u) => lerp(Hill.x0, Hill.x1, u);
          const N = 80, q = ease.inOut(seg(p, 0, 0.4));
          g.beginPath();
          for (let i = 0; i <= N * q; i++) { const u = i / N; if (i) g.lineTo(X(u), hillAt(u)); else g.moveTo(X(u), hillAt(u)); }
          g.strokeStyle = C.violet; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
          Art.text(g, 'Free energy', 76, 30, { size: 24, color: C.dim, align: 'left' });
          g.fillStyle = C.dim; g.fillRect(62, 40, 4, 366); g.fillRect(62, 402, 690, 4);
          Art.text(g, 'Reaction progress', 400, 428, { size: 23, color: C.dim });
          const a = seg(p, 0.08, 0.25);
          g.save(); g.globalAlpha *= a; gem(g, X(0.07), Hill.re - 42, 28, t); g.restore();
          Art.text(g, 'Diamond', X(0.07), Hill.re + 34, { size: 25, color: '#BDEBFA', alpha: a });
          Art.text(g, 'Graphite', X(0.93), Hill.pr + 34, { size: 25, alpha: seg(p, 0.32, 0.45) });
          const b = seg(p, 0.42, 0.62);
          Art.arrow(g, X(0.3), Hill.re, X(0.3), Hill.top + 4, { color: C.pink, w: 8, both: true, p: b });
          Art.text(g, 'Huge Eₐ', X(0.3) - 16, 136, { font: 'display', size: 34, color: C.pink, align: 'right', alpha: b, halo: true });
          Art.text(g, 'Sets the speed', X(0.3) - 16, 176, { size: 24, color: C.pink, align: 'right', alpha: b, halo: true });
          const c = seg(p, 0.62, 0.82);
          g.save(); g.setLineDash([9, 8]); g.strokeStyle = Art.alpha(C.leaf, c); g.lineWidth = 3; g.beginPath(); g.moveTo(X(0.16), Hill.re); g.lineTo(X(0.86), Hill.re); g.stroke(); g.restore();
          Art.arrow(g, X(0.8), Hill.re, X(0.8), Hill.pr - 4, { color: C.leaf, w: 6, p: c });
          Art.text(g, 'Tiny ΔG', X(0.82), 256, { font: 'display', size: 30, color: C.leaf, alpha: c, align: 'left' });
          Art.text(g, 'Sets the direction', 556, 222, { size: 24, color: C.leaf, alpha: c, align: 'left' });
          void t;
        },
      },
      {
        say: 'Hydrogen and oxygen make water with a huge $\\Delta G^\\circ$ of <b>−474 kJ</b>, as written. Yet a balloon of the mixture can sit for years. One spark supplies the activation energy, and then it goes all at once.',
        dur: 4.4,
        draw(g, p, t) {
          g.save(); g.globalAlpha *= seg(p, 0, 0.15); Art.formula(g, '2H2 + O2 -> 2H2O', 400, 38, { size: 38, colorize: true }); g.restore();
          const a = seg(p, 0.05, 0.25), b = seg(p, 0.35, 0.5);
          const balloon = (x, y, s, f = '#7FD6FF') => {
            const gr = g.createRadialGradient(x - s * 0.3, y - s * 0.4, s * 0.1, x, y, s * 1.1);
            gr.addColorStop(0, '#E8FBFF'); gr.addColorStop(1, f);
            g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
            g.beginPath(); g.ellipse(x, y, s * 0.85, s, 0, 0, TAU); g.fill(); g.stroke();
            g.strokeStyle = C.dim; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y + s); g.quadraticCurveTo(x + 12, y + s * 1.4, x - 4, y + s * 1.8); g.stroke();
          };
          g.save(); g.globalAlpha *= a; balloon(205, 196 + wander(1, t) * 6, 84); Art.text(g, 'H₂ + O₂', 205, 196 + wander(1, t) * 6, { font: 'display', size: 28, color: '#123A55' }); g.restore();
          Art.text(g, 'No spark', 205, 86, { font: 'display', size: 32, color: C.cyan, alpha: a });
          Art.text(g, 'Sits there for years', 205, 386, { size: 27, alpha: seg(p, 0.15, 0.3) });
          Art.text(g, 'With a spark', 595, 86, { font: 'display', size: 32, color: C.fire, alpha: b });
          const c = seg(p, 0.45, 0.6);
          // The right side loops: balloon, spark, bang, water.
          const lp = ((t * 0.34) % 1);
          if (b > 0) {
            g.save(); g.globalAlpha *= b;
            if (lp < 0.3) { balloon(595, 196, 84); Art.text(g, 'H₂ + O₂', 595, 196, { font: 'display', size: 28, color: '#123A55' }); Art.star(g, 595 + 60 - lp * 60, 300 - lp * 60, 18, t * 5); g.fillStyle = C.sun; Art.star(g, 595 + 60 - lp * 60, 300 - lp * 60, 18, t * 5); g.fill(); }
            else if (lp < 0.5) {
              const q = (lp - 0.3) / 0.2;
              Art.glow(g, 595, 196, 90 + q * 110, C.fire, 0.8 * (1 - q));
              Art.burst(g, 595, 196, q, { n: 26, r: 170, size: 16, colors: [C.fire, C.sun, '#fff'] });
            } else {
              [[530, 170], [660, 170], [595, 250]].forEach(([x, y], i) => Art.molecule(g, x, y + wander(i, t) * 4, 56, 'H2O', { face: 'happy', t, seed: i }));
            }
            g.restore();
          }
          Art.text(g, 'Goes all at once', 595, 386, { size: 27, alpha: c });
          Art.text(g, 'ΔG° = −474 kJ', 400, 428, { font: 'display', size: 30, color: C.leaf, alpha: seg(p, 0.6, 0.8) });
        },
      },
      {
        say: 'So keep two questions apart. <b>Thermodynamics</b> asks: can it go? <b>Kinetics</b> asks: how fast? A catalyst can change the speed, but it can never change $\\Delta G$. It cannot make an impossible reaction possible.',
        dur: 3.8,
        draw(g, p, t) {
          const a = seg(p, 0.02, 0.3), b = seg(p, 0.28, 0.56);
          if (a > 0) card(g, 205, 32, 350, 260, a, C.leaf);
          if (b > 0) card(g, 595, 32, 350, 260, b, C.pink);
          Art.text(g, 'Thermodynamics', 205, 76, { font: 'display', size: 33, color: C.leaf, alpha: a });
          Art.text(g, 'Can it go?', 205, 134, { font: 'display', size: 44, alpha: a });
          Art.text(g, 'Look at ΔG', 205, 204, { size: 30, color: C.sun, alpha: a });
          Art.text(g, 'The depth of the valley', 205, 252, { size: 24, color: C.dim, alpha: a });
          Art.text(g, 'Kinetics', 595, 76, { font: 'display', size: 33, color: C.pink, alpha: b });
          Art.text(g, 'How fast?', 595, 134, { font: 'display', size: 44, alpha: b });
          Art.text(g, 'Look at Eₐ', 595, 204, { size: 30, color: C.sun, alpha: b });
          Art.text(g, 'The height of the hill', 595, 252, { size: 24, color: C.dim, alpha: b });
          Art.text(g, 'Neither answer tells you the other', 330, 362, { font: 'display', size: 32, color: C.cyan, alpha: seg(p, 0.62, 0.82) });
          Art.moe(g, 700, 440, 130, 'cheer', { t, flip: true });
        },
      },
    ],
  });
});
