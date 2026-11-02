/* Lesson 10.1: Intermolecular forces. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const DPLUS = '#FF8FB8', DMINUS = '#55D8FF';

  /* ---------- Helpers ---------- */
  /** World positions of the atoms in Art.molecule's H2O, so forces can attach to real atoms. */
  function h2o(x, y, s, rot) {
    const c = Math.cos(rot), d = Math.sin(rot);
    const P = (ax, ay) => [x + (ax * c - ay * d) * s, y + (ax * d + ay * c) * s];
    return { O: P(0, -0.25), H1: P(-0.8, 0.38), H2: P(0.8, 0.38) };
  }
  /** The dotted line that means an intermolecular force, marching gently. */
  function dots(g, a, b, o = {}) {
    g.save();
    g.strokeStyle = o.color || C.sun; g.lineWidth = o.w || 5; g.lineCap = 'round';
    g.setLineDash(o.dash || [2, 11]); g.lineDashOffset = -(o.t || 0) * 12;
    g.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    g.restore();
  }
  function delta(g, plus, x, y, o = {}) {
    Art.text(g, plus ? 'δ+' : 'δ−', x, y, { size: o.size || 27, color: plus ? DPLUS : DMINUS, halo: true, alpha: o.alpha, font: 'display' });
  }
  function tick(g, x, y, r, good, a = 1) {
    g.save(); g.globalAlpha *= a;
    g.fillStyle = good ? C.leaf : C.red;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.strokeStyle = '#1A0F2E'; g.lineWidth = r * 0.26; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    if (good) { g.moveTo(x - r * 0.48, y + r * 0.02); g.lineTo(x - r * 0.1, y + r * 0.42); g.lineTo(x + r * 0.5, y - r * 0.36); }
    else { g.moveTo(x - r * 0.38, y - r * 0.38); g.lineTo(x + r * 0.38, y + r * 0.38); g.moveTo(x + r * 0.38, y - r * 0.38); g.lineTo(x - r * 0.38, y + r * 0.38); }
    g.stroke(); g.restore();
  }
  /** A chunky bubble with a highlight, for bubbles in the zoom. */
  function bubbleOutline(g, x, y, r, a = 1) {
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(255,255,255,.08)'; g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 4;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.arc(x, y, r - 11, -2.6, -1.9); g.stroke();
    g.restore();
  }
  function boilRig(g, cx, t) {
    const benchY = 380;
    g.strokeStyle = '#8F8DA6'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - 78, benchY - 2); g.lineTo(cx - 66, 248); g.moveTo(cx + 78, benchY - 2); g.lineTo(cx + 66, 248); g.stroke();
    Art.bunsen(g, cx, benchY, 0.78, { air: 1, flame: 1, t });
    g.fillStyle = '#C9C7DB'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    Art.round(g, cx - 108, 240, 216, 9, 4); g.fill(); g.stroke();
    return Art.beaker(g, cx, 240, 196, 178, {
      level: 0.8, liquid: C.water,
      inside: (gg, box) => Art.bubbles(gg, box.x0 + 16, box.x1 - 16, box.bottom - 8, box.top + 8, t * 1.3, { n: 18, r: 8 }),
    });
  }
  function surfaceWater(g, W, y, H) {
    const gr = g.createLinearGradient(0, y, 0, H);
    gr.addColorStop(0, 'rgba(70,185,240,.5)'); gr.addColorStop(1, 'rgba(27,111,184,.72)');
    g.fillStyle = gr; g.fillRect(0, y, W, H - y);
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(0, y, W, 4);
  }

  /* ---------- Story 1: inside or between ---------- */
  Lab.story('#story-trap', {
    title: 'What really breaks when water boils?',
    scenes: [
      {
        say: 'Start with one water molecule. The sticks are <b>covalent bonds</b>. They hold the atoms together inside the molecule. The exam word is <b>intramolecular</b>: intra means inside.',
        dur: 3.4,
        draw(g, p, t) {
          const q = ease.back(seg(p, 0, 0.3));
          const cx = 270, cy = 250, s = 130;
          const m = h2o(cx, cy, s, 0);
          const glow = seg(p, 0.35, 0.6);
          if (glow > 0) {
            g.save(); g.strokeStyle = Art.alpha(C.pink, 0.75 * glow * (0.75 + 0.25 * Math.sin(t * 4))); g.lineWidth = 30; g.lineCap = 'round';
            g.beginPath(); g.moveTo(m.O[0], m.O[1]); g.lineTo(m.H1[0], m.H1[1]); g.moveTo(m.O[0], m.O[1]); g.lineTo(m.H2[0], m.H2[1]); g.stroke(); g.restore();
          }
          g.save(); g.translate(cx, cy); g.scale(q, q); g.translate(-cx, -cy);
          Art.molecule(g, cx, cy, s, 'H2O', { face: 'happy', t, look: [0.6, 0.2], atomScale: 1.2 });
          g.restore();
          const a = seg(p, 0.5, 0.72);
          Art.text(g, 'Inside the molecule', 590, 96, { font: 'display', size: 38, color: C.pink, alpha: a });
          Art.pill(g, 'covalent bond', 590, 170, { size: 28, color: C.pink, text: '#fff', alpha: a });
          Art.arrow(g, 500, 180, m.H2[0] - 54, (m.O[1] + m.H2[1]) / 2 - 8, { color: C.pink, w: 6, p: seg(p, 0.6, 0.85), curve: 22 });
          Art.text(g, 'intra = inside', 590, 254, { size: 30, alpha: seg(p, 0.75, 0.95) });
          Art.moe(g, 650, 436, 150, 'point', { t, flip: true });
        },
      },
      {
        say: 'Now add a neighbor. The weak pull <b>between</b> two molecules is an <b>intermolecular force</b>. Inter means between, as in international.',
        dur: 3.4,
        draw(g, p, t) {
          const s = 92;
          const A = h2o(215, 232, s, -0.44);
          const slide = ease.out(seg(p, 0, 0.4));
          const bx = lerp(790, 560, slide), by = 212;
          const B = h2o(bx, by, s, -Math.PI / 2);
          const f = seg(p, 0.42, 0.62);
          if (f > 0) dots(g, A.H2, B.O, { t, w: 8, dash: [2, 15], alpha: f * (0.8 + 0.2 * Math.sin(t * 4)) });
          Art.molecule(g, 215, 232, s, 'H2O', { rot: -0.44, face: 'happy', t, look: [1, 0], atomScale: 1.2 });
          Art.molecule(g, bx, by, s, 'H2O', { rot: -Math.PI / 2, face: 'happy', t, look: [-1, 0], atomScale: 1.2, seed: 4 });
          const mid = [(A.H2[0] + B.O[0]) / 2, (A.H2[1] + B.O[1]) / 2];
          const a = seg(p, 0.55, 0.78);
          Art.pill(g, 'intermolecular force', 440, 88, { size: 28, color: C.sun, text: '#22123A', alpha: a });
          Art.arrow(g, 440, 112, mid[0], mid[1] - 18, { color: C.sun, w: 6, p: a });
          Art.pill(g, 'covalent bond', 215, 408, { size: 28, color: C.pink, text: '#fff', alpha: a });
          Art.arrow(g, 215, 386, (A.O[0] + A.H1[0]) / 2 + 14, (A.O[1] + A.H1[1]) / 2 + 18, { color: C.pink, w: 5, p: a });
          Art.text(g, 'strong, inside', 450, 408, { size: 28, color: C.pink, alpha: a });
          Art.text(g, 'weak, between', 440, 42, { size: 28, color: C.sun, alpha: a });
        },
      },
      {
        say: 'The difference is huge. Boiling a mole of water costs about <b>41 kJ</b>. Breaking all of its O&ndash;H bonds would cost about <b>930 kJ</b>. Each bar is drawn to scale.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          Art.text(g, 'The energy bill for one mole of water', W / 2, 52, { font: 'display', size: 36 });
          const full = 690, x0 = 56, unit = full / 926;
          const q1 = ease.out(seg(p, 0.1, 0.35)), q2 = ease.inOut(seg(p, 0.4, 0.92));
          Art.text(g, 'Pull molecules apart: boil it', x0, 132, { size: 30, align: 'left', color: C.sun, alpha: seg(p, 0.05, 0.2) });
          g.fillStyle = C.sun; Art.round(g, x0, 158, Math.max(6, 40.7 * unit * q1), 58, 10); g.fill();
          Art.text(g, '40.7 kJ', x0 + 40.7 * unit + 22, 187, { font: 'display', size: 44, color: C.sun, align: 'left', alpha: seg(p, 0.2, 0.35) });
          Art.text(g, 'Pull atoms apart: break both O–H bonds', x0, 272, { size: 30, align: 'left', color: C.pink, alpha: seg(p, 0.35, 0.45) });
          g.fillStyle = C.pink; Art.round(g, x0, 298, Math.max(6, 926 * unit * q2), 58, 10); g.fill();
          const lab = Math.round(926 * q2);
          if (q2 > 0.25) Art.text(g, `${lab} kJ`, x0 + 926 * unit * q2 - 22, 327, { font: 'display', size: 44, color: '#fff', align: 'right' });
          Art.text(g, 'about 23 times more', W / 2, 402, { size: 32, alpha: seg(p, 0.86, 1) });
          void t;
        },
      },
      {
        say: 'Now heat water until it boils. Big bubbles form inside. Here is the question that catches people: <b>what is inside a bubble?</b>',
        dur: 3,
        draw(g, p, t, { W, H }) {
          Art.bgLab(g, W, H);
          const b = boilRig(g, 210, t);
          Art.smoke(g, 210, 60, t, { n: 8, h: 56, r: 12, spread: 24, alpha: 0.32 });
          const bx = 228, by = 160;
          const pop = ease.back(seg(p, 0.15, 0.35));
          bubbleOutline(g, bx, by, 22 * pop);
          Art.zoom(g, bx, by, 560, 186, 158, (gg, cx, cy) => {
            Art.text(gg, '?', cx, cy + 4, { font: 'display', size: 170, color: C.sun, alpha: seg(p, 0.5, 0.75) });
          }, { p: seg(p, 0.3, 0.55) });
          Art.text(g, 'inside one bubble', 560, 366, { size: 28, halo: true, alpha: seg(p, 0.55, 0.75) });
          void b;
        },
      },
      {
        say: 'A very common guess is <b>hydrogen and oxygen gas</b>. That would mean the bonds broke and the water became new substances. This picture is <b>wrong</b>.',
        dur: 3.8,
        draw(g, p, t, { W, H }) {
          const cx = W / 2 - 110, cy = 230, R = 180;
          bubbleOutline(g, cx, cy, R);
          const split = ease.inOut(seg(p, 0.1, 0.5));
          // Two water molecules come apart into atoms, which regroup as H2 and O2. 4 H and 2 O throughout.
          const P = (ax, ay, bx, by) => [lerp(ax, bx, split), lerp(ay, by, split)];
          const atoms = [
            ['O', cx - 88, cy - 40, cx - 26, cy - 86], ['H', cx - 138, cy + 4, cx - 112, cy + 62], ['H', cx - 38, cy + 4, cx - 60, cy + 62],
            ['O', cx + 88, cy + 40, cx + 34, cy - 86], ['H', cx + 38, cy + 84, cx + 58, cy + 62], ['H', cx + 138, cy + 84, cx + 112, cy + 62],
          ];
          if (split < 0.4) {
            g.save(); g.globalAlpha *= 1 - split / 0.4; g.strokeStyle = '#D9D1EC'; g.lineWidth = 9; g.lineCap = 'round';
            [[0, 1], [0, 2], [3, 4], [3, 5]].forEach(([a, b]) => { g.beginPath(); g.moveTo(atoms[a][1], atoms[a][2]); g.lineTo(atoms[b][1], atoms[b][2]); g.stroke(); });
            g.restore();
          }
          if (split > 0.75) {
            const a = (split - 0.75) / 0.25;
            g.save(); g.globalAlpha *= a; g.strokeStyle = '#D9D1EC'; g.lineWidth = 9;
            [[0, 3], [1, 2], [4, 5]].forEach(([u, v]) => {
              const A = P(atoms[u][1], atoms[u][2], atoms[u][3], atoms[u][4]), B = P(atoms[v][1], atoms[v][2], atoms[v][3], atoms[v][4]);
              g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
            });
            g.restore();
          }
          atoms.forEach(([el, ax, ay, bx, by], i) => {
            const P2 = P(ax, ay, bx, by);
            Art.atom(g, P2[0], P2[1], el === 'O' ? 34 : 24, el, { seed: i });
          });
          Art.formula(g, 'H2', cx - 86, cy + 112, { size: 30, halo: true });
          Art.formula(g, 'H2', cx + 86, cy + 112, { size: 30, halo: true });
          Art.formula(g, 'O2', cx + 4, cy - 142, { size: 30, halo: true });
          const x = ease.out(seg(p, 0.6, 0.72)), y = ease.out(seg(p, 0.72, 0.84));
          Art.strike(g, cx - 200, cy - 180, cx + 200, cy + 180, x, C.red, 15);
          Art.strike(g, cx + 200, cy - 180, cx - 200, cy + 180, y, C.red, 15);
          const a = seg(p, 0.84, 1);
          Art.text(g, 'Wrong!', 640, 120, { font: 'display', size: 64, color: C.red, alpha: a });
          Art.text(g, 'No bonds break', 640, 192, { size: 31, alpha: a });
          Art.text(g, 'when water boils', 640, 232, { size: 31, alpha: a });
          Art.moe(g, 650, H - 16, 150, 'oops', { t, flip: true });
        },
      },
      {
        say: 'Here is what really happens. Only the <b>dotted forces</b> between molecules snap. The molecule leaves <b>whole</b>, still 2 H and 1 O. The bubble is full of water vapor.',
        dur: 5,
        draw(g, p, t, { W, H }) {
          const surfaceY = 268;
          surfaceWater(g, W, surfaceY, H);
          Art.formula(g, 'H2O(l) -> H2O(g)', 188, 46, { size: 36, color: C.sun });
          const s = 46, o = { style: 'ball', labels: false, atomScale: 1.28 };
          const L = [
            [120, 345, 0.4], [270, 325, -0.5], [530, 325, 0.5], [680, 345, -0.3],
            [195, 410, 2.4], [400, 410, 0.1], [600, 410, -2.5],
          ].map(([x, y, r], i) => [x + wander(i + 1, t * 0.6) * 5, y + wander(i + 21, t * 0.6) * 4, r + wander(i + 3, t * 0.4) * 0.08]);
          const q = ease.inOut(seg(p, 0.28, 0.72));
          const ex = 400 + Math.sin(q * 3.2) * 34, ey = lerp(322, 118, q);
          const eRot = lerp(0, 0.5, q) + Math.sin(t * 0.8) * 0.06;
          const E = h2o(ex, ey, s * 1.5, eRot);
          // Forces in the liquid stay.
          const near = [[0, 1], [1, 4], [1, 5], [2, 5], [2, 3], [2, 6], [0, 4], [3, 6], [4, 5], [5, 6]];
          near.forEach(([a, b]) => {
            const A = h2o(L[a][0], L[a][1], s, L[a][2]), B = h2o(L[b][0], L[b][1], s, L[b][2]);
            dots(g, A.O, B.O, { t, w: 4, dash: [1, 9], alpha: 0.75 });
          });
          // Forces to the escaping molecule stretch, then snap.
          const snap = seg(p, 0.22, 0.34);
          [1, 2, 5].forEach((k, i) => {
            const B = h2o(L[k][0], L[k][1], s, L[k][2]);
            if (snap < 1) dots(g, E.O, B.O, { t, w: 7, dash: [2, 12], alpha: 1 - snap });
            else {
              const u = 0.42;
              dots(g, B.O, [B.O[0] + (400 - B.O[0]) * u, B.O[1] + (322 - B.O[1]) * u], { w: 5, dash: [1, 9], color: C.pink, alpha: 0.9 });
            }
            const b = seg(p, 0.3, 0.46);
            if (b > 0 && b < 1) Art.burst(g, lerp(B.O[0], 400, 0.45), lerp(B.O[1], 322, 0.45), b, { n: 8, r: 34, seed: i, colors: [C.sun, '#fff'] });
          });
          L.forEach(([x, y, r], i) => Art.molecule(g, x, y, s, 'H2O', Object.assign({ rot: r, seed: i }, o)));
          const gone = seg(p, 0.55, 0.75);
          if (gone > 0) {
            g.save(); g.globalAlpha *= gone;
            Art.ring(g, 400, 326, 36, { color: C.pink, w: 4, dash: [6, 8] });
            g.restore();
            Art.text(g, 'forces snap here', 400, 296, { size: 25, color: '#FFD0E6', alpha: gone, halo: true });
          }
          // Vapor molecules above, already gone.
          [[120, 136, 0.7], [664, 110, -0.6]].forEach(([x, y, r], i) => Art.molecule(g, x + wander(i + 30, t) * 9, y + wander(i + 40, t) * 7, s, 'H2O', Object.assign({ rot: r + t * 0.3, seed: i }, o)));
          Art.molecule(g, ex, ey, s * 1.5, 'H2O', { rot: eRot, face: q > 0.1 ? 'grin' : 'happy', t, atomScale: 1.2, look: [0, -1] });
          const a = seg(p, 0.72, 0.88);
          if (a > 0) {
            Art.ring(g, ex, ey + 4, 82, { color: C.leaf, w: 6, p: a });
            Art.text(g, 'Still 2 H and 1 O', 628, 202, { size: 30, color: C.leaf, alpha: a, halo: true });
            Art.arrow(g, 520, 196, ex + 88, ey + 26, { color: C.leaf, w: 6, p: a, curve: 14 });
          }
          Art.text(g, 'liquid', 60, surfaceY + 30, { size: 26, color: '#E8F7FF', halo: true });
          Art.text(g, 'gas', 54, surfaceY - 30, { size: 26, halo: true });
        },
      },
      {
        say: 'The equations prove it. Boiling has the <b>same formula on both sides</b>, so it is a physical change. Splitting water takes electricity, and it makes new substances, so it is a chemical change.',
        dur: 3.6,
        draw(g, p, t) {
          const a1 = seg(p, 0.05, 0.3), a2 = seg(p, 0.45, 0.7);
          // Row 1: boiling.
          g.fillStyle = Art.alpha(C.leaf, 0.13 * a1); Art.round(g, 24, 20, 752, 186, 22); g.fill();
          Art.text(g, 'Boiling: physical change', 44, 54, { font: 'display', size: 32, color: C.leaf, align: 'left', alpha: a1 });
          Art.formula(g, 'H2O(l) -> H2O(g)', 610, 54, { size: 30, align: 'center' });
          const j = seg(p, 0.1, 0.4);
          if (j > 0) {
            g.save(); g.globalAlpha *= a1;
            for (let i = 0; i < 2; i++) Art.molecule(g, 92 + i * 92, 136 + wander(i, t) * 3, 38, 'H2O', { rot: i * 1.1, labels: false, atomScale: 1.15 });
            dots(g, [124, 136], [162, 136], { t, w: 5, dash: [1, 10] });
            Art.arrow(g, 300, 136, 450, 136, { color: C.ink, w: 7 });
            Art.text(g, 'heat', 375, 106, { size: 26, color: C.fire });
            for (let i = 0; i < 2; i++) Art.molecule(g, 530 + i * 150, 132 + wander(i + 4, t) * 6, 38, 'H2O', { rot: i * 1.1 + t * 0.3, labels: false, atomScale: 1.15 });
            g.restore();
          }
          // Row 2: electrolysis.
          g.fillStyle = Art.alpha(C.pink, 0.13 * a2); Art.round(g, 24, 226, 752, 200, 22); g.fill();
          Art.text(g, 'Electrolysis: chemical change', 44, 260, { font: 'display', size: 32, color: C.pink, align: 'left', alpha: a2 });
          Art.formula(g, '2H2O -> 2H2 + O2', 640, 260, { size: 30 });
          if (a2 > 0) {
            g.save(); g.globalAlpha *= a2;
            for (let i = 0; i < 2; i++) Art.molecule(g, 92 + i * 92, 348, 38, 'H2O', { rot: i * 1.1, labels: false, atomScale: 1.15 });
            Art.arrow(g, 300, 348, 450, 348, { color: C.ink, w: 7 });
            Art.text(g, 'electricity', 375, 316, { size: 26, color: C.cyan });
            Art.molecule(g, 510, 348, 42, 'H2', { labels: false, atomScale: 1.15 });
            Art.molecule(g, 592, 348, 42, 'H2', { labels: false, atomScale: 1.15 });
            Art.molecule(g, 700, 348, 46, 'O2', { labels: false, atomScale: 1.05 });
            g.restore();
          }
          Art.text(g, 'different substances', 600, 400, { size: 25, color: C.pink, alpha: seg(p, 0.75, 0.95) });
        },
      },
    ],
  });

  /* ---------- Story 2: the forces ---------- */
  /** An atom with a sloshing electron cloud. shift moves the cloud along x. */
  function cloudAtom(g, x, y, R, shift, sym, r) {
    const cx = x + shift;
    const gr = g.createRadialGradient(cx, y, R * 0.1, cx, y, R);
    gr.addColorStop(0, 'rgba(47,214,242,.72)'); gr.addColorStop(0.6, 'rgba(47,214,242,.3)'); gr.addColorStop(1, 'rgba(47,214,242,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, y, R, 0, TAU); g.fill();
    Art.atom(g, x, y, r, sym, {});
  }
  Lab.story('#story-forces', {
    title: 'Four ways molecules stick',
    scenes: [
      {
        say: '<b>London dispersion</b>. Electrons are always moving. For an instant, more of them pile up on one side, making a brief plus and minus. That pulls on the electrons next door. Now both atoms attract.',
        dur: 4.4,
        draw(g, p, t, { W }) {
          const appear = ease.back(seg(p, 0, 0.25));
          const wv = Math.sin(t * 1.25 + 1);
          const sh = Math.sign(wv) * Math.pow(Math.abs(wv), 0.45) * 44 * seg(p, 0.25, 0.5);
          const lx = 248, rx = 556, y = 222;
          g.save(); g.translate(W / 2, y); g.scale(appear, appear); g.translate(-W / 2, -y);
          cloudAtom(g, lx, y, 150, sh, 'Ar', 38);
          cloudAtom(g, rx, y, 150, sh * 0.82, 'Ar', 38);
          // A few electrons, so "sloshing" is something you can see.
          [[lx, sh], [rx, sh * 0.82]].forEach(([ax, off], k) => {
            for (let i = 0; i < 7; i++) {
              const a = rand(i + k * 9 + 1) * TAU + t * (0.9 + rand(i + 4) * 0.8) * (i % 2 ? 1 : -1), rr = 54 + rand(i + 2) * 42;
              Art.electron(g, ax + off * 1.5 + Math.cos(a) * rr * 0.72, y + Math.sin(a) * rr, 6);
            }
          });
          g.restore();
          const a = clamp(Math.abs(sh) / 30) * seg(p, 0.3, 0.45);
          const sign = Math.sign(sh) || 1;
          // Cloud moved right: right side of each atom is negative.
          delta(g, sign < 0, lx - 118, y, { alpha: a, size: 38 });
          delta(g, sign > 0, lx + 118, y, { alpha: a, size: 38 });
          delta(g, sign < 0, rx - 118, y, { alpha: a, size: 38 });
          delta(g, sign > 0, rx + 118, y, { alpha: a, size: 38 });
          dots(g, [lx + 150, y], [rx - 150, y], { t, w: 7, dash: [2, 13], alpha: a * 0.95 });
          Art.text(g, 'electrons slosh', W / 2, 44, { font: 'display', size: 36, color: C.cyan, alpha: seg(p, 0.1, 0.3) });
          Art.text(g, 'Every atom and molecule has this', W / 2, 410, { size: 29, alpha: seg(p, 0.65, 0.85) });
        },
      },
      {
        say: 'Bigger electron clouds slosh more, so <b>bigger molecules stick harder</b>. The halogens show it perfectly. All are nonpolar, yet they go from gas to liquid to solid at room temperature.',
        dur: 4,
        draw(g, p, t) {
          const list = [
            ['F2', -188, 'gas', 22, 40], ['Cl2', -34, 'gas', 30, 40], ['Br2', 59, 'liquid', 35, 40], ['I2', 184, 'solid', 42, 40],
          ];
          const bars = (T) => ((T + 220) / 410) * 130;
          list.forEach(([f, T, st, s], i) => {
            const x = 118 + i * 188, a = seg(p, 0.05 + i * 0.16, 0.2 + i * 0.16);
            const q = ease.back(a);
            if (q <= 0) return;
            g.save(); g.translate(x, 88); g.scale(q, q); g.translate(-x, -88);
            Art.molecule(g, x, 88 + wander(i, t) * 2, s * 1.6, f, { style: 'fill', atomScale: 1.28, labels: false });
            g.restore();
            Art.formula(g, f, x, 176, { size: 36, colorize: true, alpha: a });
            // Bar rising to the boiling point.
            const h = bars(T) * ease.out(seg(p, 0.2 + i * 0.14, 0.45 + i * 0.14));
            g.fillStyle = 'rgba(255,255,255,.1)'; Art.round(g, x - 26, 206, 52, 130, 12); g.fill();
            if (h > 2) { g.fillStyle = Art.mix(C.cyan, C.fire, (T + 188) / 372); Art.round(g, x - 26, 336 - h, 52, h, 12); g.fill(); }
            Art.text(g, `boils at ${T < 0 ? '−' : ''}${Math.abs(T)} °C`, x, 362, { font: 'display', size: 25, color: C.sun, alpha: a });
            Art.pill(g, st, x, 408, { size: 25, alpha: seg(p, 0.76, 0.92), color: st === 'gas' ? '#2C7FB8' : st === 'liquid' ? '#9A3F3C' : '#6D2BA8', text: '#fff' });
          });
        },
      },
      {
        say: '<b>Dipole-dipole</b>. A polar molecule has a permanent plus end and minus end. Neighbors turn so that plus faces minus. HCl molecules line up like little magnets.',
        dur: 4,
        draw(g, p, t, { W }) {
          const q = ease.inOut(seg(p, 0.15, 0.7));
          const cols = 3, rows = 2, s = 94;
          const pts = [];
          for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
            const k = j * cols + i;
            const x = 165 + i * 236 + (j % 2 ? 26 : -26), y = 150 + j * 170;
            const rot0 = rand(k + 2) * TAU;
            pts.push({ x: x + wander(k, t * 0.5) * 3, y: y + wander(k + 9, t * 0.5) * 3, rot: lerp(rot0, Math.round(rot0 / TAU) * TAU, q) + Math.sin(t * 1.4 + k) * 0.04 });
          }
          // Force lines between Cl of one and H of the next along each row.
          const f = seg(p, 0.65, 0.85);
          if (f > 0) {
            for (let j = 0; j < rows; j++) for (let i = 0; i < cols - 1; i++) {
              const a = pts[j * cols + i], b = pts[j * cols + i + 1];
              dots(g, [a.x + s * 0.5, a.y], [b.x - s * 0.5, b.y], { t, w: 7, dash: [2, 12], alpha: f });
            }
          }
          pts.forEach((m, i) => {
            Art.molecule(g, m.x, m.y, s, 'HCl', { rot: m.rot, atomScale: 1.26, seed: i });
            if (i === 1) Art.atom(g, m.x + Math.cos(m.rot) * s * 0.5, m.y + Math.sin(m.rot) * s * 0.5, 0.98 * s * 0.42 * 1.26, 'Cl', { face: 'happy', t, look: [-1, 0], seed: 3 });
          });
          const m = pts[1], a = seg(p, 0.7, 0.88);
          delta(g, true, m.x - s * 0.5, m.y - 58, { alpha: a, size: 32 });
          delta(g, false, m.x + s * 0.5, m.y - 66, { alpha: a, size: 32 });
          Art.text(g, 'plus end faces minus end', W / 2, 424, { size: 28, color: C.sun, alpha: seg(p, 0.75, 0.95) });
          Art.text(g, 'HCl boils at −85 °C', W / 2, 36, { font: 'display', size: 32, alpha: seg(p, 0, 0.2) });
        },
      },
      {
        say: '<b>Hydrogen bonding</b> is an extra strong dipole force. When H is bonded directly to <b>N, O or F</b>, the H is nearly bare. It gets pulled hard to a lone pair on the next molecule. It is a force, not a real bond.',
        dur: 4.4,
        draw(g, p, t) {
          const s = 98;
          const A = h2o(190, 262, s, -0.44), B = h2o(530, 244, s, -Math.PI / 2);
          const f = seg(p, 0.3, 0.55);
          dots(g, A.H2, [B.O[0] - 26, B.O[1]], { t, w: 11, dash: [2, 18], alpha: f * (0.82 + 0.18 * Math.sin(t * 4)) });
          Art.molecule(g, 190, 262, s, 'H2O', { rot: -0.44, face: 'happy', t, look: [1, 0], atomScale: 1.2 });
          Art.molecule(g, 530, 244, s, 'H2O', { rot: -Math.PI / 2, face: 'happy', t, look: [-1, 0], atomScale: 1.2, seed: 3 });
          // Lone pair on the accepting oxygen.
          const a = seg(p, 0.2, 0.4);
          g.save(); g.globalAlpha *= a;
          Art.electron(g, B.O[0] - 50, B.O[1] - 11, 7);
          Art.electron(g, B.O[0] - 50, B.O[1] + 11, 7);
          g.restore();
          delta(g, true, A.H2[0] + 4, A.H2[1] - 48, { alpha: seg(p, 0.15, 0.3), size: 32 });
          delta(g, false, B.O[0] - 6, B.O[1] - 66, { alpha: seg(p, 0.15, 0.3), size: 32 });
          const mid = [(A.H2[0] + B.O[0]) / 2, (A.H2[1] + B.O[1]) / 2];
          Art.pill(g, 'hydrogen bond', 270, 70, { size: 30, color: C.sun, text: '#22123A', alpha: seg(p, 0.45, 0.65) });
          Art.arrow(g, 270, 96, mid[0], mid[1] - 20, { color: C.sun, w: 6, p: seg(p, 0.5, 0.7) });
          // FON tiles.
          ['N', 'O', 'F'].forEach((el, i) => {
            const q = ease.back(seg(p, 0.6 + i * 0.08, 0.75 + i * 0.08));
            if (q <= 0) return;
            Art.atom(g, 610 + i * 66, 54, 28 * q, el, {});
          });
          Art.text(g, 'H must be on one of these', 640, 106, { size: 25, alpha: seg(p, 0.78, 0.95) });
          Art.text(g, 'Water boils at 100 °C. H₂S, heavier, boils at −60 °C.', 400, 420, { size: 27, alpha: seg(p, 0.82, 1) });
        },
      },
      {
        say: '<b>Ion-dipole</b>. A full charge is the strongest pull here. Water turns to face each ion: the partly negative O end faces $\\ce{Na+}$, and the partly positive H ends face $\\ce{Cl-}$.',
        dur: 4,
        draw(g, p, t) {
          const ions = [
            { x: 215, y: 225, el: 'Na', r: 42, ch: '+', o: true },
            { x: 585, y: 225, el: 'Cl', r: 58, ch: '-', o: false },
          ];
          ions.forEach((ion, k) => {
            const n = 6, dist = ion.r + 88;
            const q = ease.out(seg(p, 0.1 + k * 0.12, 0.6 + k * 0.12));
            for (let i = 0; i < n; i++) {
              const a = (i / n) * TAU + 0.26 + Math.sin(t * 0.3 + k) * 0.03;
              const d = dist + (1 - q) * 240;
              const mx = ion.x + Math.cos(a) * d, my = ion.y + Math.sin(a) * d;
              const dx = -Math.cos(a), dy = -Math.sin(a);
              let rot;
              if (ion.o) rot = Math.atan2(dx, -dy);
              else rot = Math.atan2(dy, dx) - Math.atan2(0.63, 0.8);
              rot = lerp(rot + (1 - q) * 3, rot, q);
              Art.molecule(g, mx, my, 42, 'H2O', { rot, labels: false, style: 'fill', atomScale: 1.2, alpha: clamp(q * 2) });
            }
            Art.atom(g, ion.x, ion.y, ion.r, ion.el, { charge: ion.ch, face: 'happy', t, seed: k, look: [0, 0] });
          });
          Art.text(g, 'O end in', 215, 423, { size: 28, color: DMINUS, alpha: seg(p, 0.6, 0.8), halo: true });
          Art.text(g, 'H ends in', 585, 423, { size: 28, color: DPLUS, alpha: seg(p, 0.7, 0.9), halo: true });
        },
      },
      {
        say: 'Now rank them. Typical strengths climb from <b>London</b> to <b>dipole-dipole</b> to <b>hydrogen bonding</b> to <b>ion-dipole</b>, and real bonds are stronger still. One warning: in a very large molecule, London forces add up and can beat the others.',
        dur: 4,
        draw(g, p, t) {
          const steps = [
            ['London dispersion', '0.05 to 40', C.cyan, 'always there'],
            ['Dipole-dipole', '5 to 25', C.violet, 'polar'],
            ['Hydrogen bonding', '10 to 40', C.sun, 'H on N, O, F'],
            ['Ion-dipole', '40 to 600', C.fire, 'ions'],
            ['Covalent bond', '150 to 1100', C.pink, 'inside'],
          ];
          const baseY = 412, w = 142;
          steps.forEach(([name, rng, col, tag], i) => {
            const x = 40 + i * (w + 6), hgt = 66 + i * 58;
            const q = ease.out(seg(p, 0.05 + i * 0.14, 0.25 + i * 0.14));
            if (q <= 0) return;
            const hh = hgt * q;
            const gr = g.createLinearGradient(0, baseY - hh, 0, baseY);
            gr.addColorStop(0, col); gr.addColorStop(1, Art.mix(col, '#1A0F2E', 0.45));
            g.fillStyle = gr; Art.round(g, x, baseY - hh, w, hh, 12); g.fill();
            Art.text(g, rng, x + w / 2, baseY - hh + 26, { font: 'display', size: 24, color: '#1A0F2E', alpha: seg(p, 0.15 + i * 0.14, 0.3 + i * 0.14) });
            g.font = `700 21px ${Art.FONT_BODY}`;
            const words = name.split(' ');
            words.forEach((word, k) => Art.text(g, word, x + w / 2, baseY - hh - 22 - (words.length - 1 - k) * 26, { size: 22, alpha: q, color: C.ink }));
            void tag;
          });
          Art.text(g, 'Rough ranges in kJ/mol', 40, 44, { size: 28, color: C.dim, align: 'left', alpha: seg(p, 0.05, 0.25) });
          Art.moe(g, 112, 278, 130, 'think', { t });
        },
      },
    ],
  });

  /* ---------- Bench: force finder ---------- */
  const XMOL = {
    CH3F: { a: [['C', 0, 0], ['F', 1.1, 0], ['H', -0.5, -0.9], ['H', -0.5, 0.9], ['H', -1.05, 0]], b: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
  };
  const molData = (f) => XMOL[f] || Art.moleculeData(f);
  const FIND = {
    CH4: { name: 'methane', polar: false, hb: false, rotA: -0.0, rotB: 0, i: 2, j: 4, s: 56, note: 'Four identical C&ndash;H bonds point symmetrically, and they are barely polar. London dispersion is all methane has, which is why it boils at &minus;161 °C.' },
    I2: { name: 'iodine', polar: false, hb: false, rotA: 0, rotB: 0, i: 1, j: 0, s: 66, note: 'Two identical atoms share evenly, so no dipole. But iodine is huge, and its big soft electron cloud makes London forces strong. It is a solid at room temperature.' },
    CO2: { name: 'carbon dioxide', polar: false, hb: false, rotA: 0, rotB: 0, i: 2, j: 0, s: 50, note: 'The trick question. Each C=O bond is polar, but they point in exactly opposite directions and cancel. The molecule is nonpolar, so only London forces act.' },
    HCl: { name: 'hydrogen chloride', polar: true, hb: false, rotA: 0, rotB: 0, i: 1, j: 0, s: 74, dp: [[0, true], [1, false]], note: 'Polar, so dipole-dipole. The H is bonded to Cl, which is not on the N, O, F list, so no hydrogen bonding.' },
    SO2: { name: 'sulfur dioxide', polar: true, hb: false, rotA: -0.37, rotB: -Math.PI / 2, i: 2, j: 0, s: 56, dp: [[0, true], [1, false], [2, false]], note: 'Bent, so its bond dipoles do not cancel. Compare it with straight $\\ce{CO2}$. No H at all, so no hydrogen bonding.' },
    H2S: { name: 'hydrogen sulfide', polar: true, hb: false, rotA: -0.44, rotB: -Math.PI / 2, i: 2, j: 0, s: 58, dp: [[0, false], [1, true], [2, true]], note: 'Looks just like water, but sulfur is not on the list. Only dipole-dipole, so it boils at &minus;60 °C. Water boils at 100 °C.' },
    CH3F: { name: 'fluoromethane', polar: true, hb: false, rotA: 0, rotB: 0, i: 1, j: 4, s: 54, dp: [[1, false], [4, true]], note: 'The classic trap. It has H and it has F, but no H is bonded <b>to</b> F. Every H is on carbon. So only dipole-dipole.' },
    NH3: { name: 'ammonia', polar: true, hb: true, rotA: -0.32, rotB: -Math.PI / 2, i: 2, j: 0, s: 58, dp: [[0, false], [2, true]], note: 'H is bonded directly to N. The lone pair on nitrogen accepts the hydrogen bond from a neighbor.' },
    HF: { name: 'hydrogen fluoride', polar: true, hb: true, rotA: Math.PI, rotB: Math.PI, i: 0, j: 1, s: 72, dp: [[0, true], [1, false]], note: 'H on F, the most electronegative element. These are the strongest single hydrogen bonds, which is why small HF boils at 20 °C.' },
    H2O: { name: 'water', polar: true, hb: true, rotA: -0.44, rotB: -Math.PI / 2, i: 2, j: 0, s: 62, dp: [[0, false], [2, true]], note: 'H on O. Each molecule has two H atoms and two lone pairs, so it can hold up to four hydrogen bonds. Tiny water boils at 100 °C because of this.' },
    CH3OH: { name: 'methanol', polar: true, hb: true, rotA: 0.72, rotB: Math.PI - 0.72, i: 2, j: 1, s: 50, dp: [[1, false], [2, true]], note: 'Most of its H atoms are on carbon, but one sits on oxygen. One is all it takes. Methanol hydrogen bonds and boils at 65 °C.' },
  };
  const RAD = { H: 0.56, C: 0.82, N: 0.8, O: 0.78, F: 0.72, Cl: 0.98, S: 1, I: 1.15 };
  function layoutPair(key) {
    const d = FIND[key], m = molData(key);
    let L0 = layoutAt(d, m, d.s * 1.12);
    if (L0.width > 318) L0 = layoutAt(d, m, d.s * 1.12 * (318 / L0.width));
    return L0;
  }
  function layoutAt(d, m, s) {
    const R = (rot) => m.a.map(([el, ax, ay]) => { const c = Math.cos(rot), n = Math.sin(rot); return { el, x: (ax * c - ay * n) * s, y: (ax * n + ay * c) * s }; });
    const A = R(d.rotA), B = R(d.rotB);
    const rA = (RAD[A[d.i].el] || 0.9) * s * 0.46, rB = (RAD[B[d.j].el] || 0.9) * s * 0.46;
    const L = rA + rB + 62;
    const bx = A[d.i].x + L - B[d.j].x, by = A[d.i].y - B[d.j].y;
    const all = A.map((p) => [p.x, p.y]).concat(B.map((p) => [p.x + bx, p.y + by]));
    const xs = all.map((q) => q[0]), ys = all.map((q) => q[1]);
    const ox = 186 - (Math.min(...xs) + Math.max(...xs)) / 2, oy = 276 - (Math.min(...ys) + Math.max(...ys)) / 2;
    return { m, s, ax: ox, ay: oy, bx: ox + bx, by: oy + by, A, B, rA, rB, d, width: Math.max(...xs) - Math.min(...xs) + 2 * Math.max(rA, s * 0.3) };
  }
  function drawMol(g, m, x, y, s, rot, o = {}) {
    const c = Math.cos(rot), n = Math.sin(rot);
    const pts = m.a.map(([el, ax, ay]) => ({ el, x: x + (ax * c - ay * n) * s, y: y + (ax * n + ay * c) * s }));
    m.b.forEach(([i, j, order]) => Art.bond(g, pts[i].x, pts[i].y, pts[j].x, pts[j].y, { order, width: Math.max(3, s * 0.1) }));
    pts.forEach((q, i) => Art.atom(g, q.x, q.y, (RAD[q.el] || 0.9) * s * 0.46, q.el, { seed: i, label: o.labels === false ? false : undefined }));
    return pts;
  }
  const finder = { f: 'H2O', t0: 0 };
  const idStage = Lab.stage('#c-id', {
    label: 'Two molecules of the chosen substance with the force between them, beside three yes or no questions.',
    draw(g, t) {
      const el = t - finder.t0;
      const d = FIND[finder.f], L = layoutPair(finder.f);
      Art.formula(g, finder.f, 186, 50, { size: 50, colorize: true });
      Art.text(g, d.name, 186, 98, { size: 26, color: C.dim });
      // The pair, breathing gently closer and apart.
      const breathe = Math.sin(t * 1.6) * 5;
      const ax = L.ax - breathe, bx = L.bx + breathe;
      const shiftA = Math.sin(t * 1.4) * 10;
      const force = d.hb ? 1 : d.polar ? 0.72 : 0.45;
      if (!d.polar) {
        // Sloshing electron clouds on nonpolar molecules.
        [[ax, L.ay], [bx, L.by]].forEach(([x, y]) => {
          const cg = g.createRadialGradient(x + shiftA, y, 10, x + shiftA, y, L.s * 2.1);
          cg.addColorStop(0, 'rgba(47,214,242,.34)'); cg.addColorStop(1, 'rgba(47,214,242,0)');
          g.fillStyle = cg; g.beginPath(); g.arc(x + shiftA, y, L.s * 2.1, 0, TAU); g.fill();
        });
      }
      const Ai = [ax + L.A[d.i].x, L.ay + L.A[d.i].y], Bj = [bx + L.B[d.j].x, L.by + L.B[d.j].y];
      dots(g, [Ai[0] + L.rA * 0.8, Ai[1]], [Bj[0] - L.rB * 0.8, Bj[1]], { t, w: 3 + force * 6, dash: [2, 8 + force * 6], color: d.hb ? C.sun : d.polar ? C.violet : C.cyan, alpha: 0.85 + 0.15 * Math.sin(t * 4) });
      const m = L.m;
      drawMol(g, m, ax, L.ay, L.s, d.rotA);
      drawMol(g, m, bx, L.by, L.s, d.rotB);
      if (d.dp) {
        d.dp.forEach(([idx, plus]) => {
          delta(g, plus, ax + L.A[idx].x, L.ay + L.A[idx].y - L.rA - 18, { size: 24 });
          delta(g, plus, bx + L.B[idx].x, L.by + L.B[idx].y - L.rB - 18, { size: 24 });
        });
      }
      if (!d.polar) {
        const a = clamp(Math.abs(shiftA) / 7);
        const sign = shiftA >= 0;
        delta(g, !sign, Math.max(26, ax - L.s * 1.1), L.ay - L.s * 1.2, { size: 24, alpha: a * 0.9 });
        delta(g, sign, Math.min(346, bx + L.s * 1.1), L.by - L.s * 1.2, { size: 24, alpha: a * 0.9 });
      }
      // The three questions.
      const rows = [
        ['London dispersion', 'Every molecule has it', true],
        ['Dipole-dipole', 'Is the molecule polar?', d.polar],
        ['Hydrogen bonding', 'Is H bonded to N, O or F?', d.hb],
      ];
      rows.forEach(([name, ask, yes], i) => {
        const y = 72 + i * 96;
        const a = clamp((el - i * 0.5) * 2.4);
        g.fillStyle = Art.alpha(yes ? C.leaf : '#fff', (yes ? 0.14 : 0.05) * a + 0.03);
        Art.round(g, 376, y - 40, 400, 82, 18); g.fill();
        Art.text(g, name, 396, y - 14, { font: 'display', size: 29, align: 'left', color: yes ? C.ink : C.dim });
        Art.text(g, ask, 396, y + 20, { size: 22, align: 'left', color: C.dim, alpha: Math.max(a, 0.7) });
        if (a > 0) tick(g, 734, y, 25 * ease.back(a), yes);
      });
      const top = d.hb ? 'Hydrogen bonding' : d.polar ? 'Dipole-dipole' : 'London dispersion';
      const a = clamp((el - 1.5) * 2.5);
      Art.text(g, 'Strongest here', 576, 354, { size: 24, color: C.dim, alpha: a });
      Art.pill(g, top, 576, 396, { size: 32, color: d.hb ? C.sun : d.polar ? C.violet : C.cyan, text: '#1A0F2E', font: 'display', alpha: a });
    },
  });
  function paintFinder() { Lab.$('#id-note').innerHTML = Lab.texString(`<p>${FIND[finder.f].note}</p>`); }
  Lab.segmented('#id-mol', (v) => { finder.f = v; finder.t0 = idStage.t; paintFinder(); });
  paintFinder();

  /* ---------- Bench: the sticky chamber, a tiny molecular dynamics sim ---------- */
  const STICK = {
    CH4: { name: 'Methane', f: 'CH4', Tb: -161, Tm: -182, s: 18, force: 'London only' },
    HCl: { name: 'Hydrogen chloride', f: 'HCl', Tb: -85, Tm: -114, s: 28, force: 'Dipole-dipole' },
    NH3: { name: 'Ammonia', f: 'NH3', Tb: -33, Tm: -78, s: 21, force: 'Hydrogen, bonding' },
    H2O: { name: 'Water', f: 'H2O', Tb: 100, Tm: 0, s: 23, force: 'Hydrogen, bonding' },
    I2: { name: 'Iodine', f: 'I2', Tb: 184, Tm: 114, s: 25, force: 'London, big cloud' },
  };
  const BOX = { x0: 28, x1: 440, y0: 30, y1: 424 };
  const K_PER = 20;            // Thermal energy per kelvin in (px/s)².
  const sticky = { sub: 'H2O', T: 25, parts: [], frozen: false, links: 0 };
  const SIG = 44, N = 26;
  (function seed() {
    for (let i = 0; i < N; i++) {
      const row = Math.floor(i / 8);
      sticky.parts.push({
        x: BOX.x0 + 34 + (i % 8) * 47 + (row % 2) * 14, y: BOX.y1 - 34 - row * 42,
        vx: (rand(i + 1) - 0.5) * 90, vy: (rand(i + 7) - 0.5) * 90,
        sig: SIG * (0.92 + rand(i + 3) * 0.16), rot: rand(i + 5) * TAU, spin: (rand(i + 9) - 0.5) * 2, sx: 0, sy: 0,
      });
    }
  })();
  function latticeSites() {
    const sites = [], sp = 47, cols = Math.floor((BOX.x1 - BOX.x0 - 30) / sp);
    let k = 0;
    for (let row = 0; k < N; row++) for (let c = 0; c < cols && k < N; c++, k++) {
      sites.push([BOX.x0 + 30 + c * sp + (row % 2) * sp * 0.5, BOX.y1 - 30 - row * sp * 0.88]);
    }
    return sites;
  }
  function stickyStep(dt) {
    const d = STICK[sticky.sub], P = sticky.parts;
    const TK = sticky.T + 273.15, TbK = d.Tb + 273.15, TmK = d.Tm + 273.15;
    const shouldFreeze = sticky.T < d.Tm;
    if (shouldFreeze && !sticky.frozen) {
      const sites = latticeSites();
      const free = sites.slice();
      P.slice().sort((a, b) => b.y - a.y).forEach((q) => {
        let best = 0, bd = 1e12;
        free.forEach((st, i) => { const dd = (st[0] - q.x) ** 2 + (st[1] - q.y) ** 2; if (dd < bd) { bd = dd; best = i; } });
        const st = free.splice(best, 1)[0];
        q.sx = st[0]; q.sy = st[1];
      });
      sticky.frozen = true;
    } else if (!shouldFreeze && sticky.frozen) {
      sticky.frozen = false;
      P.forEach((q, i) => { q.vx = (rand(i + TK) - 0.5) * 80; q.vy = (rand(i * 2 + TK) - 0.5) * 80; });
    }
    if (sticky.frozen) {
      P.forEach((q) => { q.x += (q.sx - q.x) * clamp(dt * 3.2); q.y += (q.sy - q.y) * clamp(dt * 3.2); q.vx = 0; q.vy = 0; });
      return;
    }
    // Stickiness is matched to the real boiling point. Past it the attraction fades fast so the
    // little box of molecules changes state near the right temperature.
    const ratio = TK / TbK;
    const eps = (K_PER * TbK / 0.42) * (ratio < 1 ? 1 : Math.max(0.1, 1 - (ratio - 1) * 13));
    const kT = K_PER * TK;
    const sub = 5, h = dt / sub;
    for (let st = 0; st < sub; st++) {
      const grav = lerp(150, 16, clamp((ratio - 0.92) / 0.12));
      for (let i = 0; i < N; i++) { const q = P[i]; q.ax = 0; q.ay = grav; }
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const a = P[i], b = P[j];
        const dx = b.x - a.x, dy = b.y - a.y, s = (a.sig + b.sig) / 2;
        const r2 = dx * dx + dy * dy, cut = s * 2.5;
        if (r2 > cut * cut) continue;
        const r = Math.max(Math.sqrt(r2), s * 0.8);
        const sr = s / r, sr2 = sr * sr, sr6 = sr2 * sr2 * sr2;
        const F = (24 * eps / r) * (2 * sr6 * sr6 - sr6);
        const fx = (F * dx) / r, fy = (F * dy) / r;
        a.ax -= fx; a.ay -= fy; b.ax += fx; b.ay += fy;
      }
      let ke = 0;
      for (let i = 0; i < N; i++) {
        const q = P[i];
        q.vx += q.ax * h; q.vy += q.ay * h;
        q.x += q.vx * h; q.y += q.vy * h;
        const m = 20;
        if (q.x < BOX.x0 + m) { q.x = BOX.x0 + m; if (q.vx < 0) q.vx = -q.vx; }
        if (q.x > BOX.x1 - m) { q.x = BOX.x1 - m; if (q.vx > 0) q.vx = -q.vx; }
        if (q.y < BOX.y0 + m) { q.y = BOX.y0 + m; if (q.vy < 0) q.vy = -q.vy; }
        if (q.y > BOX.y1 - m) { q.y = BOX.y1 - m; if (q.vy > 0) q.vy = -q.vy; }
        ke += 0.5 * (q.vx * q.vx + q.vy * q.vy);
      }
      // Velocity-rescale thermostat. In 2D, average kinetic energy per particle = kT.
      const cur = ke / N;
      const lam = Math.sqrt(1 + (h / 0.18) * (kT / Math.max(1, cur) - 1));
      for (let i = 0; i < N; i++) { P[i].vx *= lam; P[i].vy *= lam; }
    }
    P.forEach((q) => { q.rot += q.spin * dt * (0.4 + TK / 300); });
    void TmK;
  }
  function fmtT(T) { return `${T < 0 ? '−' : ''}${Math.abs(Math.round(T))} °C`; }
  const stickyStage = Lab.stage('#c-sticky', {
    bg: 'micro',
    label: 'A chamber of molecules. At low temperature they lock in a crystal, in the middle they pool as a liquid, and when hot they fly apart as a gas. A thermometer marks the melting and boiling points of the chosen substance.',
    draw(g, t, dt) {
      const d = STICK[sticky.sub];
      if (dt > 0) stickyStep(Math.min(dt, 0.034));
      // Chamber.
      g.fillStyle = 'rgba(214,240,255,.05)'; Art.round(g, BOX.x0 - 6, BOX.y0 - 6, BOX.x1 - BOX.x0 + 12, BOX.y1 - BOX.y0 + 12, 16); g.fill();
      // Forces between close neighbors.
      const P = sticky.parts;
      const strength = clamp((d.Tb + 273) / 373);
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const a = P[i], b = P[j], s = (a.sig + b.sig) / 2;
        const dx = a.x - b.x, dy = a.y - b.y;
        if (dx * dx + dy * dy < (s * 1.28) * (s * 1.28)) dots(g, [a.x, a.y], [b.x, b.y], { w: 2 + strength * 3.4, dash: [1, 8], alpha: 0.35 + strength * 0.5 });
      }
      const amp = sticky.frozen ? 1 + 4 * ((sticky.T + 273) / (d.Tm + 273)) : 0;
      P.forEach((q, i) => {
        const x = q.x + (amp ? wander(i + 1, t * 6) * amp : 0), y = q.y + (amp ? wander(i + 31, t * 6) * amp : 0);
        Art.molecule(g, x, y, d.s, d.f, { rot: sticky.frozen ? (i % 2 ? 0.5 : -0.5) : q.rot, style: 'fill', atomScale: 1.28, labels: false });
      });
      g.strokeStyle = C.glass; g.lineWidth = 4; Art.round(g, BOX.x0 - 6, BOX.y0 - 6, BOX.x1 - BOX.x0 + 12, BOX.y1 - BOX.y0 + 12, 16); g.stroke();

      // Thermometer, linear from −200 to 200 °C.
      const thX = 474, thTop = 34, thH = 352;
      const fr = (T) => (T + 200) / 400;
      Art.thermometer(g, thX, thTop, thH, fr(sticky.T), { ticks: false, w: 18, color: sticky.T > d.Tb ? C.fire : sticky.T < d.Tm ? C.cyan : '#FF4D5E' });
      const yOf = (T) => thTop + thH - (thH - 8) * fr(T);
      const mark = (T, label, col) => {
        const y = yOf(T);
        g.strokeStyle = col; g.lineWidth = 4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(thX + 12, y); g.lineTo(thX + 32, y); g.stroke();
        Art.text(g, label, thX + 40, y, { size: 22, color: col, align: 'left' });
      };
      const sep = Math.abs(yOf(d.Tb) - yOf(d.Tm));
      mark(d.Tb, `boils ${fmtT(d.Tb)}`, C.fire);
      g.save(); if (sep < 26) g.translate(0, 13);
      mark(d.Tm, `melts ${fmtT(d.Tm)}`, C.cyan);
      g.restore();
      // Readouts.
      const st = sticky.T >= d.Tb ? 'Gas' : sticky.T >= d.Tm ? 'Liquid' : 'Solid';
      const stCol = st === 'Gas' ? C.fire : st === 'Liquid' ? C.water : C.violet;
      const rx = 716;
      Art.formula(g, d.f, rx, 52, { size: 44, colorize: true });
      Art.text(g, fmtT(sticky.T), rx, 116, { font: 'display', size: 42, color: C.sun });
      Art.pill(g, st, rx, 182, { size: 34, font: 'display', color: stCol, text: '#fff' });
      Art.text(g, 'Strongest', rx, 340, { size: 22, color: C.dim });
      Art.text(g, 'force', rx, 366, { size: 22, color: C.dim });
      d.force.split(', ').forEach((line, i, arr) => Art.text(g, line, rx, 402 + (i - (arr.length - 1) / 2) * 26, { size: 22, color: C.ink, maxW: 158 }));
    },
  });
  function stickyRelax() { if (Lab.reducedMotion) { for (let i = 0; i < 90; i++) stickyStep(0.03); stickyStage.redraw(); } }
  Lab.segmented('#stick-sub', (v) => { sticky.sub = v; sticky.frozen = false; stickyRelax(); });
  Lab.bind('#stick-t', '#stick-t-out', fmtT, (v) => { sticky.T = v; stickyRelax(); });

  /* ---------- Bench: ranking game ---------- */
  const BP = {
    He: ['helium', -269], Ar: ['argon', -186], Kr: ['krypton', -153], Xe: ['xenon', -108],
    F2: ['fluorine', -188], Cl2: ['chlorine', -34], Br2: ['bromine', 59], I2: ['iodine', 184],
    CH4: ['methane', -161], C3H8: ['propane', -42], C5H12: ['pentane', 36], C8H18: ['octane', 126],
    NH3: ['ammonia', -33], H2S: ['hydrogen sulfide', -60], HF: ['hydrogen fluoride', 20], HCl: ['hydrogen chloride', -85],
    H2O: ['water', 100], C2H5OH: ['ethanol', 78], CH3OH: ['methanol', 65],
  };
  const ROUNDS = [
    { items: ['HF', 'CH4', 'H2O', 'NH3'], why: 'Methane has only London forces. The other three hydrogen bond. Water wins because each molecule can hold up to four hydrogen bonds.' },
    { items: ['C2H5OH', 'H2S', 'H2O', 'CH4'], why: 'Methane: London only. $\\ce{H2S}$: dipole-dipole. Ethanol: one O&ndash;H per molecule. Water: two O&ndash;H per molecule.' },
    { items: ['Br2', 'F2', 'I2', 'Cl2'], why: 'All four are nonpolar with only London forces, so size decides everything. Bigger electron cloud, higher boiling point.' },
    { items: ['Xe', 'He', 'Kr', 'Ar'], why: 'Noble gases are single atoms with only London forces. Going down the group, the cloud grows and so does the boiling point.' },
    { items: ['C5H12', 'C8H18', 'CH4', 'C3H8'], why: 'All nonpolar alkanes. Longer chains have more electrons and more surface touching their neighbors.' },
    { items: ['HF', 'Cl2', 'CH4', 'HCl'], why: 'The surprise here: nonpolar $\\ce{Cl2}$ beats polar HCl, because its 34 electrons give stronger London forces than the 18 in HCl. HF wins with hydrogen bonds.' },
    { items: ['H2O', 'C3H8', 'C2H5OH', 'CH3OH'], why: 'Propane has no hydrogen bonds. Methanol and ethanol have one O&ndash;H, and ethanol is bigger. Water has two O&ndash;H.' },
    { items: ['H2O', 'C8H18', 'NH3', 'CH3OH'], why: 'The biggest surprise: octane has only London forces, yet it beats water. All those electrons on a long chain add up. Size can win.' },
  ];
  const rk = { round: 0, picks: [], state: 'pick', t0: 0, score: 0, wins: new Set() };
  const toX = (T) => 44 + ((T + 280) / 480) * 712;
  const cardX = (i) => 106 + i * 196;
  function drawBPMol(g, f, x, y, t, i) {
    if (Art.moleculeData(f)) {
      const m = Art.moleculeData(f), n = m.a.length;
      const wide = Math.max(...m.a.map((a) => Math.abs(a[1]))), tall = Math.max(...m.a.map((a) => Math.abs(a[2])));
      const s = Math.min(58, 70 / Math.max(0.7, wide), 34 / Math.max(0.5, tall));
      Art.molecule(g, x, y + wander(i, t) * 2, s, f, { labels: false, atomScale: s < 26 ? 1.25 : 1.1 });
      void n;
    } else Art.atom(g, x, y + wander(i, t) * 2, f === 'He' ? 22 : f === 'Ar' ? 30 : f === 'Kr' ? 35 : 40, f, {});
  }
  const rankStage = Lab.stage('#c-rank', {
    label: 'Four molecule cards above a temperature ruler. After checking, each card connects to its real boiling point.',
    onPointer(e) {
      if (e.type === 'hover') { rankStage.canvas.style.cursor = rk.state === 'pick' && e.y < 216 ? 'pointer' : 'default'; return; }
      if (e.type !== 'down' || rk.state !== 'pick' || e.y > 216) return;
      const items = ROUNDS[rk.round].items;
      items.forEach((f, i) => { if (Math.abs(e.x - cardX(i)) < 92) pick(f); });
    },
    draw(g, t) {
      const R = ROUNDS[rk.round], el = t - rk.t0, checked = rk.state === 'done';
      const truth = R.items.slice().sort((a, b) => BP[a][1] - BP[b][1]);
      // Ruler.
      const y = 346;
      g.fillStyle = 'rgba(255,255,255,.12)'; Art.round(g, 44, y - 8, 712, 16, 8); g.fill();
      const gr = g.createLinearGradient(44, 0, 756, 0);
      gr.addColorStop(0, C.cyan); gr.addColorStop(0.62, '#FFE27A'); gr.addColorStop(1, C.fire);
      g.fillStyle = gr; Art.round(g, 44, y - 5, 712, 10, 5); g.fill();
      [-200, -100, 0, 100, 200].forEach((T) => {
        const x = T === 200 ? 756 : toX(T);
        g.fillStyle = C.ink; g.fillRect(x - 1.5, y - 12, 3, 24);
        Art.text(g, `${T < 0 ? '−' : ''}${Math.abs(T)}`, x, y + 32, { size: 22, color: C.dim, align: T === 200 ? 'right' : 'center' });
      });
      Art.text(g, '°C', 756, y - 30, { size: 22, color: C.dim, align: 'right' });
      // Room temperature.
      const xr = toX(25);
      g.strokeStyle = C.leaf; g.lineWidth = 4; g.setLineDash([6, 7]);
      g.beginPath(); g.moveTo(xr, y - 22); g.lineTo(xr, y + 56); g.stroke(); g.setLineDash([]);
      Art.text(g, 'Gas at room temperature', xr - 16, y + 74, { size: 22, align: 'right', color: C.ink });
      Art.text(g, 'Not a gas', xr + 16, y + 74, { size: 22, align: 'left', color: C.ink });
      // Cards.
      R.items.forEach((f, i) => {
        const my = rk.picks.indexOf(f);
        const trueI = truth.indexOf(f);
        const mv = checked ? ease.inOut(clamp(el * 1.6)) : 0;
        const x = lerp(cardX(i), cardX(trueI), mv);
        const reveal = checked ? clamp((el - 0.55 - trueI * 0.28) * 3) : 0;
        if (reveal > 0) {
          const X = toX(BP[f][1]);
          g.save(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.setLineDash([3, 7]);
          g.beginPath(); g.moveTo(x, 214); g.bezierCurveTo(x, 270, X, 266, lerp(x, X, reveal), lerp(214, y - 6, reveal)); g.stroke(); g.restore();
          if (reveal >= 1) { g.fillStyle = C.sun; g.beginPath(); g.arc(X, y, 9, 0, TAU); g.fill(); g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.stroke(); }
        }
        const chosen = my >= 0;
        g.fillStyle = chosen && !checked ? 'rgba(255,210,63,.18)' : 'rgba(255,255,255,.07)';
        Art.round(g, x - 90, 10, 180, 204, 18); g.fill();
        g.strokeStyle = chosen && !checked ? C.sun : 'rgba(255,255,255,.22)'; g.lineWidth = 3; g.stroke();
        drawBPMol(g, f, x, 74, t, i);
        Art.formula(g, f, x, 144, { size: 30, colorize: true });
        if (checked) {
          const T = BP[f][1];
          Art.text(g, `${T < 0 ? '−' : ''}${Math.abs(T)} °C`, x, 186, { font: 'display', size: 30, color: C.sun, alpha: reveal });
        } else Art.text(g, BP[f][0], x, 186, { size: 21, color: C.dim, maxW: 168 });
        if (chosen) {
          const good = my === trueI;
          const bx = x - 66, by = 34;
          if (checked && reveal >= 1) tick(g, bx, by, 19, good);
          else { g.fillStyle = C.sun; g.beginPath(); g.arc(bx, by, 19, 0, TAU); g.fill(); Art.text(g, String(my + 1), bx, by + 1, { font: 'display', size: 25, color: '#22123A' }); }
        }
      });
    },
  });
  function paintPicks() {
    const R = ROUNDS[rk.round];
    Lab.$('#rank-picks').innerHTML = R.items.map((f) => `<button type="button" data-f="${f}" aria-pressed="${rk.picks.includes(f)}">${Lab.fHTML(f)}${rk.picks.includes(f) ? ` (${rk.picks.indexOf(f) + 1})` : ''}</button>`).join('');
    Lab.$$('#rank-picks button').forEach((b) => b.addEventListener('click', () => pick(b.dataset.f)));
    Lab.$('#rank-check').disabled = rk.picks.length !== 4 || rk.state !== 'pick';
    Lab.$('#rank-check').hidden = rk.state === 'done';
    Lab.$('#rank-clear').hidden = rk.state === 'done';
    Lab.$('#rank-next').hidden = rk.state !== 'done';
    Lab.$('#rank-set').textContent = `${rk.round + 1} of ${ROUNDS.length}`;
    Lab.$('#rank-score').textContent = rk.score;
  }
  function pick(f) {
    if (rk.state !== 'pick') return;
    const i = rk.picks.indexOf(f);
    if (i >= 0) rk.picks.splice(i, 1); else if (rk.picks.length < 4) { rk.picks.push(f); Lab.sound.pop(); }
    paintPicks();
    rankStage.redraw();
  }
  Lab.$('#rank-clear').addEventListener('click', () => { rk.picks = []; paintPicks(); });
  Lab.$('#rank-check').addEventListener('click', () => {
    const R = ROUNDS[rk.round];
    const truth = R.items.slice().sort((a, b) => BP[a][1] - BP[b][1]);
    const perfect = truth.every((f, i) => rk.picks[i] === f);
    rk.state = 'done'; rk.t0 = rankStage.t;
    if (perfect) {
      if (!rk.wins.has(rk.round)) { rk.wins.add(rk.round); rk.score++; Lab.collection.award(1); }
      Lab.confetti(60);
    } else Lab.sound.bad();
    Lab.$('#rank-why').innerHTML = Lab.texString(`<p><b>${perfect ? 'Perfect.' : 'Not quite. Here is the real order.'}</b> ${R.why}</p>`);
    paintPicks();
  });
  Lab.$('#rank-next').addEventListener('click', () => {
    rk.round = (rk.round + 1) % ROUNDS.length;
    rk.picks = []; rk.state = 'pick';
    Lab.$('#rank-why').innerHTML = Lab.texString('<p>Which force is strongest in each? Tie on force? Then the bigger electron cloud wins.</p>');
    paintPicks();
  });
  paintPicks();

  /* ---------- Bench: ice versus water ---------- */
  /* Honeycomb layer of ice, seen from above. Vertex types A and B alternate. A donates two H atoms
     in the plane. B donates one in the plane and one out of the page toward the next layer, so
     every O follows the real rule: two H atoms of its own, two H atoms accepted. */
  const iceM = { m: 0, shown: 0, mols: [] };
  (function buildIce() {
    const e = 64, ax = 0, ay = -e, bx = e * Math.cos(Math.PI / 6), by = e * 0.5, cx = -bx, cy = by;
    const left = 62, right = 436, top = 54, bottom = 374;
    const v1x = bx - ax, v1y = by - ay, v2x = cx - ax, v2y = cy - ay;
    const pts = [];
    for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
      const X = 248 + i * v1x + j * v2x, Y = 210 + i * v1y + j * v2y;
      if (X > left && X < right && Y > top && Y < bottom) pts.push({ x: X, y: Y, type: 'A' });
      const X2 = X + ax, Y2 = Y + ay;
      if (X2 > left && X2 < right && Y2 > top && Y2 < bottom) pts.push({ x: X2, y: Y2, type: 'B' });
    }
    const list = pts.map((q, k) => {
      const a = rand(k + 11) * TAU;
      const row = Math.floor(k / 6);
      void a; void row;
      return Object.assign(q, { id: k });
    });
    const n = list.length;
    // Liquid layout: jumbled closer packing in the lower part of the same box.
    const cols = 5, sp = 80;
    const slots = [];
    for (let k = 0; k < n; k++) {
      const c = k % cols, r = Math.floor(k / cols);
      slots.push([76 + c * sp + (r % 2) * 28 + (rand(k + 1) - 0.5) * 16, 366 - r * 54 + (rand(k + 5) - 0.5) * 12]);
    }
    // Lowest molecules claim the nearest slot first, so the pattern collapses downward without crossing.
    list.slice().sort((p1, p2) => p2.y - p1.y).forEach((q) => {
      let best = 0, bd = 1e12;
      slots.forEach((st, i) => { const dd = (st[0] - q.x) ** 2 + (st[1] - q.y) ** 2; if (dd < bd) { bd = dd; best = i; } });
      const st = slots.splice(best, 1)[0];
      q.lx = st[0]; q.ly = st[1]; q.lrot = rand(q.id + 9) * TAU;
    });
    // Donor directions in ice.
    list.forEach((q) => {
      q.dirs = q.type === 'A' ? [[bx / e, by / e], [cx / e, cy / e]] : [[-ax / e, -ay / e], null];
    });
    iceM.mols = list; iceM.n = n; iceM.top = Math.min(...list.map((q) => q.y)) - 34;
    iceM.ltop = Math.min(...list.map((q) => q.ly)) - 30;
    iceM.bottom = 400;
    void right;
  })();
  function angleLerp(a, b, t) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return a + d * t; }
  Lab.stage('#c-ice', {
    label: 'Left: water molecules held in an open honeycomb that collapses into a closer jumble as it melts. Right: an ice cube floating with most of it under the water.',
    draw(g, t, dt) {
      iceM.shown = lerp(iceM.shown, iceM.m, clamp(dt * 7 || 1));
      const m = ease.inOut(iceM.shown);
      const dO = 22;
      // Box. The lid drops as the pattern collapses.
      const top = lerp(iceM.top, iceM.ltop, m), bot = iceM.bottom;
      g.fillStyle = 'rgba(70,185,240,.12)'; g.fillRect(30, top, 438, bot - top);
      if (m > 0.02) {
        g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 3; g.setLineDash([7, 8]);
        g.beginPath(); g.moveTo(30, iceM.top); g.lineTo(468, iceM.top); g.stroke(); g.setLineDash([]);
        Art.text(g, 'ice filled up to here', 249, iceM.top + 22, { size: 23, color: C.ink, alpha: seg(iceM.shown, 0.62, 0.85), halo: true });
      }
      const pos = iceM.mols.map((q, i) => {
        const j = (1 - m) * 1.3 + m * 5;
        const x = lerp(q.x, q.lx, m) + wander(i + 1, t * (1 + m)) * j;
        const y = lerp(q.y, q.ly, m) + wander(i + 21, t * (1 + m)) * j;
        const rm = q.lrot + wander(i + 5, t * 0.6) * 0.7 + t * 0.12 * (i % 2 ? 1 : -1);
        const a1 = q.dirs[0] ? Math.atan2(q.dirs[0][1], q.dirs[0][0]) : 0;
        const a2 = q.dirs[1] ? Math.atan2(q.dirs[1][1], q.dirs[1][0]) : a1 + 1.82;
        const h1 = angleLerp(a1, rm, m), h2 = angleLerp(a2, rm + 1.82, m);
        const out = q.dirs[1] === null ? 1 - m : 0;
        return { x, y, h1, h2, out, q };
      });
      // Hydrogen bonds in ice: from each in-plane H to the O it points at.
      const hAlpha = 1 - seg(iceM.shown, 0.15, 0.55);
      if (hAlpha > 0) pos.forEach((a) => {
        [a.h1, a.q.dirs[1] ? a.h2 : null].forEach((ang) => {
          if (ang === null) return;
          const tx = a.q.x + Math.cos(ang) * 64, ty = a.q.y + Math.sin(ang) * 64;
          const hit = iceM.mols.some((o) => Math.abs(o.x - tx) < 8 && Math.abs(o.y - ty) < 8);
          if (hit) dots(g, [a.x + Math.cos(ang) * 30, a.y + Math.sin(ang) * 30], [a.x + Math.cos(ang) * 50, a.y + Math.sin(ang) * 50], { w: 6, dash: [1, 8], alpha: hAlpha });
        });
      });
      // In the liquid: brief hydrogen bonds to whichever neighbor is near.
      if (m > 0.5) pos.forEach((a, i) => {
        for (let j = i + 1; j < pos.length; j++) {
          const b = pos[j], dd = Math.hypot(a.x - b.x, a.y - b.y);
          if (dd < 62) dots(g, [a.x, a.y], [b.x, b.y], { w: 3.2, dash: [1, 8], alpha: (m - 0.5) * 1.1 * clamp((62 - dd) / 14) });
        }
      });
      pos.forEach((a, i) => {
        const hx1 = a.x + Math.cos(a.h1) * dO, hy1 = a.y + Math.sin(a.h1) * dO;
        const hx2 = a.x + Math.cos(a.h2) * dO * (1 - a.out), hy2 = a.y + Math.sin(a.h2) * dO * (1 - a.out);
        Art.bond(g, a.x, a.y, hx1, hy1, { width: 4 });
        Art.ball(g, hx1, hy1, 9, Art.elementColor('H'));
        if (!a.out) { Art.bond(g, a.x, a.y, hx2, hy2, { width: 4 }); Art.ball(g, hx2, hy2, 9, Art.elementColor('H')); }
        Art.atom(g, a.x, a.y, 16, 'O', { label: false, t, seed: i });
        if (a.out) Art.ball(g, a.x + 6, a.y - 7, 8, Art.elementColor('H'));
      });
      g.strokeStyle = C.glass; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(30, 24); g.lineTo(30, bot); g.lineTo(468, bot); g.lineTo(468, 24); g.stroke();
      // Lid.
      g.fillStyle = '#B8B2CF'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      Art.round(g, 26, top - 11, 446, 11, 4); g.fill(); g.stroke();
      Art.text(g, `${iceM.mols.length} molecules`, 249, 428, { size: 25, color: C.sun });

      // Right: a floating ice cube, to scale with the real densities.
      const cx = 636, base = 340, w = 240, hBeaker = 248;
      const bk = Art.beaker(g, cx, base, w, hBeaker, { level: 0.7, liquid: C.water, ticks: false });
      const side = 92, under = side * 0.917, bob = Math.sin(t * 0.9) * 1.6;
      const yTop = bk.surface - (side - under) + bob;
      const ix = cx - side / 2 + 6;
      g.save();
      const ig = g.createLinearGradient(ix, yTop, ix + side, yTop + side);
      ig.addColorStop(0, 'rgba(235,250,255,.95)'); ig.addColorStop(1, 'rgba(150,215,245,.82)');
      g.fillStyle = ig; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      Art.round(g, ix, yTop, side, side, 10); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.7)'; Art.round(g, ix + 10, yTop + 10, 28, 8, 4); g.fill();
      g.restore();
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(bk.x0 + 4, bk.surface); g.lineTo(bk.x1 - 4, bk.surface); g.stroke();
      Art.text(g, 'about 8% above', cx, 56, { size: 25, color: C.ink });
      Art.arrow(g, cx + 6, 74, cx + 6, bk.surface - 12, { color: C.ink, w: 4, head: 11 });
      Art.text(g, 'about 92% below', cx, base - 24, { size: 25, color: '#EAF8FF', halo: true });
      Art.text(g, 'Density rules', cx, 376, { font: 'display', size: 28, color: C.sun });
      Art.text(g, '0.917 ÷ 1.000 = 0.917', cx, 414, { size: 24 });
    },
  });
  Lab.bind('#ice-m', '#ice-m-out', (v) => (v === 0 ? 'Solid ice' : v === 100 ? 'Liquid water' : `${v}% melted`), (v) => { iceM.m = v / 100; });

  /* ---------- Story 3: what stickiness does ---------- */
  function neighborsPull(g, x, y, list, p, col) {
    list.forEach((a, i) => {
      Art.arrow(g, x, y, x + Math.cos(a) * 62, y + Math.sin(a) * 62, { color: col, w: 6, head: 15, p: seg(p, 0.3 + i * 0.03, 0.55 + i * 0.03) });
    });
  }
  Lab.story('#story-liquids', {
    title: 'Three sticky behaviors',
    scenes: [
      {
        say: 'Deep in water, a molecule is pulled equally in all directions. Those pulls cancel. At the surface there is nothing above, so the pull is <b>inward</b>. This is <b>surface tension</b>: the surface acts like a stretched skin.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          const sy = 136;
          surfaceWater(g, W, sy, H);
          const pts = [];
          for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
            pts.push([52 + c * 100 + (r % 2) * 48, sy + 36 + r * 88, r * 8 + c]);
          }
          pts.forEach(([x, y, k]) => {
            Art.molecule(g, x + wander(k, t * 0.7) * 3, y + wander(k + 40, t * 0.7) * 3, 30, 'H2O', { style: 'fill', atomScale: 1.28, labels: false, rot: rand(k) * TAU + Math.sin(t * 0.5 + k) * 0.2, alpha: 0.62 });
          });
          // Focus molecules.
          const dx = 548, dy = sy + 172, sx = 248, syy = sy + 36;
          Art.ring(g, dx, dy, 42, { color: C.sun, w: 5, p: seg(p, 0.05, 0.3) });
          Art.ring(g, sx, syy, 42, { color: C.pink, w: 5, p: seg(p, 0.45, 0.7) });
          neighborsPull(g, dx, dy, [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3], p, C.sun);
          [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI].forEach((a, i) => {
            Art.arrow(g, sx, syy, sx + Math.cos(a) * 66, syy + Math.sin(a) * 66, { color: C.pink, w: 6, head: 15, p: seg(p, 0.55 + i * 0.03, 0.75 + i * 0.03) });
          });
          Art.molecule(g, dx, dy, 34, 'H2O', { style: 'fill', atomScale: 1.28, labels: false, face: 'happy', t, rot: 0.2 });
          Art.molecule(g, sx, syy, 34, 'H2O', { style: 'fill', atomScale: 1.28, labels: false, face: 'wow', t, rot: -0.2, seed: 4 });
          Art.text(g, 'Surface molecule: pulled in', 248, 60, { size: 29, color: C.pink, alpha: seg(p, 0.6, 0.8), halo: true });
          Art.arrow(g, 248, 82, 248, 118, { color: C.pink, w: 5, p: seg(p, 0.65, 0.85), head: 13 });
          Art.text(g, 'Deep molecule: balanced', 548, 416, { size: 28, color: C.sun, alpha: seg(p, 0.3, 0.5), halo: true });
        },
      },
      {
        say: 'That skin is strong enough to hold up a steel paper clip, or a water strider. Steel is about 8 times denser than water. The clip stays up only because the molecules at the surface hold on to each other.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          const sy = 240;
          const dip = ease.out(seg(p, 0.1, 0.5)) * 18;
          surfaceWater(g, W, sy, H);
          // The surface dents under the clip.
          g.fillStyle = '#2B1A4A';
          g.beginPath(); g.moveTo(180, sy - 1);
          g.bezierCurveTo(280, sy - 1, 300, sy + dip, 400, sy + dip); g.bezierCurveTo(500, sy + dip, 520, sy - 1, 620, sy - 1);
          g.closePath(); g.fill();
          g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 4;
          g.beginPath(); g.moveTo(0, sy); g.lineTo(180, sy);
          g.bezierCurveTo(280, sy, 300, sy + dip, 400, sy + dip); g.bezierCurveTo(500, sy + dip, 520, sy, 620, sy); g.lineTo(W, sy); g.stroke();
          // The paper clip.
          const yy = sy + dip - 16 - (1 - ease.bounce(seg(p, 0, 0.5))) * 170;
          g.save(); g.translate(400, yy); g.lineJoin = 'round'; g.lineCap = 'round';
          const path = (w) => {
            g.lineWidth = w; g.beginPath();
            g.moveTo(-120, -6); g.lineTo(100, -6); g.arc(100, 8, 14, -Math.PI / 2, Math.PI / 2);
            g.lineTo(-90, 22); g.arc(-90, 8, 14, Math.PI / 2, -Math.PI / 2); g.lineTo(70, -6);
            g.stroke();
          };
          g.strokeStyle = '#1A0F2E'; path(11); g.strokeStyle = '#D8D5E8'; path(6);
          g.restore();
          // Surface molecules linked under it.
          for (let i = 0; i < 8; i++) {
            const x = 56 + i * 98, dipHere = dip * Math.max(0, 1 - Math.abs(x - 400) / 220);
            Art.molecule(g, x, sy + 30 + dipHere, 30, 'H2O', { style: 'fill', atomScale: 1.28, labels: false, rot: rand(i + 2) * TAU });
            if (i < 7) {
              const x2 = x + 98, d2 = dip * Math.max(0, 1 - Math.abs(x2 - 400) / 220);
              dots(g, [x + 22, sy + 30 + dipHere], [x2 - 22, sy + 30 + d2], { t, w: 5, dash: [1, 9], alpha: seg(p, 0.4, 0.6) });
            }
          }
          // A water strider skating on the same skin.
          const sx = 650 + Math.sin(t * 0.5) * 34, sa = seg(p, 0.45, 0.65);
          if (sa > 0) {
            g.save(); g.globalAlpha *= sa; g.lineCap = 'round'; g.lineJoin = 'round';
            g.strokeStyle = '#D9B48C'; g.lineWidth = 5;
            [[-1, 58, 18], [-0.45, 34, 12], [0.5, 40, 12], [1, 62, 18]].forEach(([sgn, reach, up]) => {
              const dirX = Math.sign(sgn);
              g.beginPath(); g.moveTo(sx + sgn * 16, sy - 20); g.lineTo(sx + dirX * reach * 0.62, sy - 20 - up); g.lineTo(sx + dirX * reach, sy - 2); g.stroke();
              g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(sx + dirX * reach, sy + 1, 9, 3, 0, 0, TAU); g.fill();
            });
            g.fillStyle = '#B9825A'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
            g.beginPath(); g.ellipse(sx, sy - 22, 32, 9, 0, 0, TAU); g.fill(); g.stroke();
            g.fillStyle = '#fff'; g.beginPath(); g.arc(sx + 25, sy - 25, 4, 0, TAU); g.fill(); g.fillStyle = '#1A0F2E'; g.beginPath(); g.arc(sx + 26, sy - 25, 2, 0, TAU); g.fill();
            g.restore();
          }
          Art.text(g, 'Steel paper clip and water strider', W / 2, 62, { font: 'display', size: 34, alpha: seg(p, 0.45, 0.65) });
          Art.text(g, 'hydrogen bonds hold the surface together', W / 2, 400, { size: 28, color: C.sun, alpha: seg(p, 0.6, 0.8), halo: true });
          void t;
        },
      },
      {
        say: '<b>Viscosity</b> means resistance to flow. Stronger forces mean thicker liquids, and long molecules can tangle too. Glycerol has three O&ndash;H groups per molecule, so it pours about 1400 times more slowly than water.',
        dur: 4,
        draw(g, p, t) {
          const pour = (x, col, name, rate, value, wid) => {
            const tipY = 150;
            // Stream falls.
            const prog = ease.out(seg(p, 0.05, 0.1 + 0.8 / rate));
            const bot = 340;
            const tip = lerp(tipY, bot, prog);
            g.fillStyle = col;
            g.strokeStyle = 'rgba(16,6,34,.4)'; g.lineWidth = 2;
            Art.round(g, x - wid / 2, tipY, wid, tip - tipY, wid / 2); g.fill(); g.stroke();
            // Rising puddle.
            const lvl = clamp((seg(p, 0.1, 1) * rate - 0.3) / 1.4);
            Art.beaker(g, x, 368, 170, 118, { level: 0.08 + 0.76 * lvl, liquid: col, ticks: false });
            // Bottle lip.
            g.fillStyle = '#C9C7DB'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
            Art.round(g, x - 42, 118, 84, 34, 8); g.fill(); g.stroke();
            Art.text(g, name, x, 74, { font: 'display', size: 36, color: col });
            Art.text(g, value, x, 416, { size: 28, color: C.ink });
          };
          pour(210, C.water, 'Water', 2.4, '1.0 mPa·s', 30);
          pour(590, '#FFC24A', 'Glycerol', 0.5, '1400 mPa·s', 18);
          Art.text(g, 'versus', 400, 74, { size: 28, color: C.dim });
          void t;
        },
      },
      {
        say: '<b>Capillary action</b> is a tug of war. Water sticks to glass (<b>adhesion</b>) more strongly than to itself (<b>cohesion</b>). The edges climb the wall, and the rest gets pulled up behind them. Thin tubes climb highest.',
        dur: 4,
        draw(g, p, t) {
          const dishY = 330;
          Art.beaker(g, 262, 418, 420, 120, { level: 0.75, liquid: C.water, ticks: false });
          const tubes = [[152, 52], [262, 34], [362, 20]];
          const q = ease.out(seg(p, 0.15, 0.75));
          tubes.forEach(([x, w], i) => {
            const h = (620 / w) * 5.6 * q;
            const top = dishY - h - 8;
            const liquid = g.createLinearGradient(0, top, 0, dishY);
            liquid.addColorStop(0, 'rgba(120,210,250,.95)'); liquid.addColorStop(1, 'rgba(70,185,240,.85)');
            g.fillStyle = liquid;
            g.beginPath(); g.moveTo(x - w / 2, top - 8); g.quadraticCurveTo(x, top + 8, x + w / 2, top - 8); g.lineTo(x + w / 2, dishY + 40); g.lineTo(x - w / 2, dishY + 40); g.closePath(); g.fill();
            g.strokeStyle = C.glass; g.lineWidth = 3.4; g.lineCap = 'round';
            g.beginPath(); g.moveTo(x - w / 2, 28); g.lineTo(x - w / 2, 372); g.moveTo(x + w / 2, 28); g.lineTo(x + w / 2, 372); g.stroke();
            void i;
          });
          // A zoom on the meniscus of the wide tube.
          const zx = 152, zy = dishY - (620 / 52) * 5.6 * q - 12;
          Art.zoom(g, zx, zy, 610, 190, 158, (gg, cx, cy, R) => {
            const wallX = cx - R + 64;
            gg.fillStyle = 'rgba(214,240,255,.26)'; gg.fillRect(cx - R, cy - R, 64, R * 2);
            gg.strokeStyle = C.glass; gg.lineWidth = 5; gg.beginPath(); gg.moveTo(wallX, cy - R); gg.lineTo(wallX, cy + R); gg.stroke();
            const nearWall = [[wallX + 34, cy - 74, 1.2], [wallX + 34, cy, 1.5], [wallX + 34, cy + 74, 1.3]];
            const further = [[wallX + 116, cy - 36, -0.5], [wallX + 116, cy + 44, 0.9], [wallX + 196, cy + 6, 2.2]];
            const fa = seg(p, 0.65, 0.85);
            dots(gg, nearWall[0], further[0], { w: 5, dash: [1, 9], alpha: fa, t });
            dots(gg, nearWall[1], further[0], { w: 5, dash: [1, 9], alpha: fa, t });
            dots(gg, nearWall[1], further[1], { w: 5, dash: [1, 9], alpha: fa, t });
            dots(gg, nearWall[2], further[1], { w: 5, dash: [1, 9], alpha: fa, t });
            dots(gg, further[0], further[2], { w: 5, dash: [1, 9], alpha: fa, t });
            dots(gg, further[1], further[2], { w: 5, dash: [1, 9], alpha: fa, t });
            nearWall.concat(further).forEach(([x, y, r], i) => {
              Art.molecule(gg, x + wander(i, t) * 2, y + wander(i + 8, t) * 2, 30, 'H2O', { style: 'fill', atomScale: 1.28, labels: false, rot: r });
            });
            nearWall.forEach(([x, y]) => Art.arrow(gg, x - 18, y - 8, wallX + 3, y - 16, { color: C.pink, w: 6, head: 13, p: seg(p, 0.55, 0.75) }));
          }, { p: seg(p, 0.4, 0.6) });
          Art.text(g, 'adhesion pulls up', 610, 374, { size: 25, color: C.pink, alpha: seg(p, 0.6, 0.78), halo: true });
          Art.text(g, 'cohesion follows', 610, 408, { size: 25, color: C.sun, alpha: seg(p, 0.7, 0.88), halo: true });
        },
      },
    ],
  });

  /* ---------- Bench: five liquids ---------- */
  const LIQ = {
    hexane: { name: 'Hexane', color: '#FFE9A6', gamma: 18.4, eta: 0.31, rho: 0.659, theta: 0, why: 'Hexane has only London forces, so it spreads flat, flows easily and climbs less than half as high as water.' },
    ethanol: { name: 'Ethanol', color: '#C9B6FF', gamma: 22.1, eta: 1.2, rho: 0.789, theta: 0, why: 'Ethanol has one O&ndash;H per molecule, so its forces are stronger than hexane\'s and weaker than water\'s. It flows about like water but with far less surface tension.' },
    water: { name: 'Water', color: C.water, gamma: 72.8, eta: 1.0, rho: 0.998, theta: 0, why: 'Water forms a net of hydrogen bonds. It has a high surface tension for such a small molecule, and it wets glass, so it climbs high.' },
    glycerol: { name: 'Glycerol', color: '#FFC24A', gamma: 63.4, eta: 1412, rho: 1.261, theta: 0, why: 'Three O&ndash;H groups on each molecule make glycerol about 1400 times more viscous than water. Drips here are slowed down on a log scale, so reality is far slower.' },
    mercury: { name: 'Mercury', color: '#C4C4DA', gamma: 486, eta: 1.55, rho: 13.53, theta: 140, why: 'Mercury atoms are held by metallic bonding, so cohesion is huge. It beads up tightly and refuses to wet glass, so it dips <b>down</b> in the tube and its meniscus bulges up.' },
  };
  const lq = { key: 'water', asp: 0.5, cap: 3, gamma: 72.8, eta: 1 };
  const capillaryCm = (d) => (2 * d.gamma * 1e-3 * Math.cos((d.theta * Math.PI) / 180)) / (d.rho * 1000 * 9.81 * 0.0005) * 100;
  Lab.stage('#c-liquid', {
    label: 'Three tests of the chosen liquid: a drop on a surface for surface tension, a funnel for viscosity, and a thin glass tube for capillary action.',
    draw(g, t, dt) {
      const d = LIQ[lq.key];
      const targetAsp = clamp(0.2 + 0.72 * (Math.log10(d.gamma / 18) / Math.log10(486 / 18)), 0.2, 0.92);
      const k = clamp((dt || 1) * 5);
      lq.asp = lerp(lq.asp, targetAsp, k);
      lq.cap = lerp(lq.cap, capillaryCm(d), k);
      const col = d.color;
      // Column heads.
      [[140, 'Surface tension'], [400, 'Viscosity'], [660, 'Capillary action']].forEach(([x, name]) => Art.text(g, name, x, 34, { font: 'display', size: 28, color: C.ink }));
      g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2;
      [270, 530].forEach((x) => { g.beginPath(); g.moveTo(x, 18); g.lineTo(x, 432); g.stroke(); });
      // 1. Drop on a waxy surface.
      const area = 13000, w = Math.min(224, Math.sqrt(area / lq.asp)), h = w * lq.asp;
      const plateY = 298;
      g.fillStyle = '#5D4A7E'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; Art.round(g, 24, plateY, 232, 22, 6); g.fill(); g.stroke();
      const lg = g.createLinearGradient(0, plateY - h, 0, plateY);
      lg.addColorStop(0, Art.mix(col, '#ffffff', 0.35)); lg.addColorStop(1, Art.mix(col, '#1A0F2E', 0.18));
      g.fillStyle = lg; g.strokeStyle = 'rgba(16,6,34,.55)';
      // An ellipse sunk a little into the plate, so the contact patch shrinks as the bead rounds up.
      g.save();
      g.beginPath(); g.rect(0, 0, 270, plateY); g.clip();
      g.beginPath(); g.ellipse(140, plateY - h * 0.46, w / 2, h / 2 * 1.08, 0, 0, TAU); g.fill(); g.stroke();
      g.restore();
      g.fillStyle = 'rgba(255,255,255,.62)'; g.beginPath(); g.ellipse(140 - w * 0.17, plateY - h * 0.7, w * 0.09, h * 0.08 + 2, -0.5, 0, TAU); g.fill();
      Art.text(g, `${Lab.fmt(d.gamma, d.gamma < 100 ? 1 : 0)} mN/m`, 140, 378, { font: 'display', size: 30, color: C.sun });
      Art.text(g, d.gamma > 200 ? 'tight bead' : d.gamma > 50 ? 'round bead' : 'spreads flat', 140, 414, { size: 23, color: C.dim });
      // 2. Funnel drips.
      const f = 1 / (0.22 + 0.9 * Math.log10(1 + d.eta));
      const fx = 400, funTop = 78, funNeck = 170, tipY = 214;
      const cup = Art.beaker(g, fx, 346, 120, 84, { level: 0.42, liquid: col, ticks: false });
      void cup;
      g.fillStyle = Art.alpha(col, 0.92);
      g.beginPath(); g.moveTo(fx - 64, funTop + 18); g.lineTo(fx - 7, funNeck); g.lineTo(fx - 7, tipY); g.lineTo(fx + 7, tipY); g.lineTo(fx + 7, funNeck); g.lineTo(fx + 64, funTop + 18); g.closePath(); g.fill();
      g.strokeStyle = C.glass; g.lineWidth = 4; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(fx - 80, funTop); g.lineTo(fx - 8, funNeck); g.lineTo(fx - 8, tipY); g.moveTo(fx + 8, tipY); g.lineTo(fx + 8, funNeck); g.lineTo(fx + 80, funTop); g.stroke();
      for (let i = 0; i < 3; i++) {
        const ph = ((t * f * 0.55 + i / 3) % 1);
        const fall = clamp((ph - (1 - Math.min(1, 0.32 * f + 0.1))) / Math.min(1, 0.32 * f + 0.1));
        if (fall <= 0) { if (i === 0) { g.fillStyle = col; g.beginPath(); g.ellipse(fx, tipY + 4 + ph * 6, 6, 4 + ph * 5, 0, 0, TAU); g.fill(); } continue; }
        g.fillStyle = col; g.strokeStyle = 'rgba(16,6,34,.5)'; g.lineWidth = 1.6;
        const y = lerp(tipY + 6, 318, fall * fall);
        g.beginPath(); g.ellipse(fx, y, 6.5, 9.5, 0, 0, TAU); g.fill(); g.stroke();
      }
      Art.text(g, `${d.eta < 10 ? Lab.fmt(d.eta, d.eta < 1 ? 2 : 2) : Lab.fmt(d.eta, 0)} mPa·s`, fx, 378, { font: 'display', size: 30, color: C.sun });
      Art.text(g, d.eta > 100 ? 'very slow' : d.eta < 0.5 ? 'runs fast' : 'flows easily', fx, 414, { size: 23, color: C.dim });
      // 3. Capillary tube in a dish.
      const cx = 660, dishTop = 266, dishB = 340, cmPx = 40;
      const hPx = lq.cap * cmPx;
      Art.beaker(g, cx, dishB, 190, 104, { level: 0.68, liquid: col, ticks: false });
      const outside = dishB - (104 - 12) * 0.68;
      const tubeW = 28;
      const lvl = outside - hPx;
      const bulge = lq.cap >= 0 ? 8 : -8;
      g.save();
      g.beginPath(); g.rect(cx - tubeW / 2, 60, tubeW, 290); g.clip();
      g.fillStyle = '#20123A'; g.fillRect(cx - tubeW / 2, 60, tubeW, lvl - 60 + 10);
      g.fillStyle = col;
      g.beginPath(); g.moveTo(cx - tubeW / 2, lvl - (lq.cap >= 0 ? 7 : 0)); g.quadraticCurveTo(cx, lvl + bulge * 1.3, cx + tubeW / 2, lvl - (lq.cap >= 0 ? 7 : 0));
      g.lineTo(cx + tubeW / 2, dishB - 22); g.lineTo(cx - tubeW / 2, dishB - 22); g.closePath(); g.fill();
      g.restore();
      g.strokeStyle = C.glass; g.lineWidth = 3.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - tubeW / 2, 60); g.lineTo(cx - tubeW / 2, dishB - 22); g.moveTo(cx + tubeW / 2, 60); g.lineTo(cx + tubeW / 2, dishB - 22); g.stroke();
      // Dashed reference: the outside level.
      g.save(); g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 2.4; g.setLineDash([5, 6]);
      g.beginPath(); g.moveTo(cx - 92, outside); g.lineTo(cx + 92, outside); g.stroke(); g.restore();
      const sign = lq.cap >= 0 ? '+' : '−';
      Art.text(g, `${sign}${Lab.fmt(Math.abs(capillaryCm(d)), 1)} cm`, cx, 378, { font: 'display', size: 30, color: C.sun });
      Art.text(g, lq.cap >= 0 ? 'climbs in a 1 mm tube' : 'dips in a 1 mm tube', cx, 414, { size: 23, color: C.dim, maxW: 250 });
      void dishTop;
    },
  });
  function paintLiquid() { Lab.$('#liq-why').innerHTML = Lab.texString(`<p>${LIQ[lq.key].why}</p>`); }
  Lab.segmented('#liq-sub', (v) => { lq.key = v; paintLiquid(); });
  paintLiquid();
});
