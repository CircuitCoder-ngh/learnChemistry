/* Lesson 8.4: VSEPR and molecular shapes. Shapes and polarity come from VseprKit (bank/vsepr.js),
   and the repulsion simulator finds its geometry by physics, with no list of shapes inside it. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp } = Lab;
  const C = Art.C;
  const K = window.VseprKit;
  const TAU = Math.PI * 2;
  const G = K.GEOM;
  const THREE = window.THREE;

  /* ---------- A small 3D projector for canvas figures ---------- */
  const norm = (v) => { const m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
  const mixV = (a, b, q) => norm([lerp(a[0], b[0], q), lerp(a[1], b[1], q), lerp(a[2], b[2], q)]);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const angleOf = (a, b) => (Math.acos(clamp(dot(norm(a), norm(b)), -1, 1)) * 180) / Math.PI;
  function rot(v, yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = v[0] * cy + v[2] * sy, z1 = -v[0] * sy + v[2] * cy;
    return [x1, v[1] * cp - z1 * sp, v[1] * sp + z1 * cp];
  }
  function proj(v, cam) {
    const [x, y, z] = rot(v, cam.yaw, cam.pitch);
    const f = (cam.d || 5.5) / ((cam.d || 5.5) - z);
    return { x: cam.cx + x * cam.s * f, y: cam.cy - y * cam.s * f, z, f };
  }
  function lobe(g, ox, oy, tip, W, alpha, o = {}) {
    if (alpha <= 0.01) return;
    const vx = tip.x - ox, vy = tip.y - oy, L = Math.hypot(vx, vy) || 1, a = Math.atan2(vy, vx);
    const len = Math.max(W * 1.25, L);
    g.save();
    g.translate(ox, oy); g.rotate(a); g.globalAlpha *= alpha;
    const gr = g.createRadialGradient(len * 0.62, -W * 0.25, W * 0.1, len * 0.55, 0, len * 0.72);
    gr.addColorStop(0, 'rgba(255,243,180,.92)'); gr.addColorStop(0.55, o.color || 'rgba(255,214,79,.62)'); gr.addColorStop(1, 'rgba(214,150,20,.4)');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(0, 0);
    g.bezierCurveTo(len * 0.22, -W * 0.3, len * 0.32, -W, len * 0.66, -W);
    g.bezierCurveTo(len * 0.92, -W, len, -W * 0.5, len, 0);
    g.bezierCurveTo(len, W * 0.5, len * 0.92, W, len * 0.66, W);
    g.bezierCurveTo(len * 0.32, W, len * 0.22, W * 0.3, 0, 0);
    g.fill();
    g.strokeStyle = 'rgba(255,226,122,.75)'; g.lineWidth = 2; g.stroke();
    Art.ball(g, len * 0.66, -W * 0.42, Math.max(4.5, W * 0.17), C.electron);
    Art.ball(g, len * 0.66, W * 0.42, Math.max(4.5, W * 0.17), C.electron);
    g.restore();
  }
  /** Draw a central atom with electron groups around it, back to front. */
  function drawAX(g, o) {
    const cam = o.cam;
    const center = proj([0, 0, 0], cam);
    const items = o.items.map((it, idx) => ({ ...it, idx, tip: proj(it.d, cam) }));
    const far = items.filter((i) => i.tip.z < 0).sort((a, b) => a.tip.z - b.tip.z);
    const near = items.filter((i) => i.tip.z >= 0).sort((a, b) => a.tip.z - b.tip.z);
    const rc = o.rc || cam.s * 0.27, ro = o.ro || cam.s * 0.2;
    const drawOne = (it) => {
      const al = it.alpha === undefined ? 1 : it.alpha;
      if (it.el) {
        if (al < 1) { g.save(); g.globalAlpha *= al; }
        Art.bond(g, center.x, center.y, it.tip.x, it.tip.y, { order: it.order || 1, width: Math.max(4, cam.s * 0.042), color: it.bondColor });
        const r = (it.r || ro) * it.tip.f;
        Art.atom(g, it.tip.x, it.tip.y, r * (it.el === 'H' ? 0.82 : 1), it.el, { label: it.label === false ? false : it.el, face: r > 18 && it.face ? it.face : null, t: o.t, seed: it.idx, glow: it.glow });
        if (al < 1) g.restore();
      } else lobe(g, center.x, center.y, it.tip, (it.w || cam.s * 0.2) * it.tip.f, al);
    };
    far.forEach(drawOne);
    Art.atom(g, center.x, center.y, rc, o.center, { face: o.face, t: o.t, look: o.look, label: o.center });
    near.forEach(drawOne);
    return { center, items };
  }
  /** Arc between two directions with its label, drawn over the model. */
  function arc3(g, a, b, rad, cam, o = {}) {
    const q = o.p === undefined ? 1 : o.p;
    if (q <= 0) return;
    const A = norm(a), B = norm(b);
    let axisOK = Math.abs(dot(A, B)) < 0.999;
    let mid = axisOK ? norm([A[0] + B[0], A[1] + B[1], A[2] + B[2]]) : null;
    if (!axisOK) { const up = Math.abs(A[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; mid = norm([A[1] * up[2] - A[2] * up[1], A[2] * up[0] - A[0] * up[2], A[0] * up[1] - A[1] * up[0]]); }
    const pts = [];
    for (let i = 0; i <= 32; i++) {
      const u = (i / 32) * q;
      const v = u < 0.5 ? mixV(A, mid, u * 2) : mixV(mid, B, (u - 0.5) * 2);
      pts.push(proj([v[0] * rad, v[1] * rad, v[2] * rad], cam));
    }
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(23,12,41,.85)'; g.lineWidth = 8; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke();
    g.strokeStyle = o.color || C.sun; g.lineWidth = 4.5; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke();
    if (o.label) {
      const m = proj([mid[0] * (rad + (o.gap || 0.24)), mid[1] * (rad + (o.gap || 0.24)), mid[2] * (rad + (o.gap || 0.24))], cam);
      Art.text(g, o.label, m.x + (o.dx || 0), m.y + (o.dy || 0), { font: 'display', size: o.size || 30, color: o.color || C.sun, halo: true, alpha: seg(q, 0.6, 1) });
    }
  }
  /* A balloon tied to a knot at the origin, pointing at tip. */
  function balloon(g, ox, oy, tip, W, color) {
    const vx = tip.x - ox, vy = tip.y - oy, L = Math.hypot(vx, vy) || 1, a = Math.atan2(vy, vx);
    const len = Math.max(W * 1.65, L);
    g.save();
    g.translate(ox, oy); g.rotate(a);
    const gr = g.createRadialGradient(len * 0.62, -W * 0.32, W * 0.08, len * 0.56, 0, len * 0.72);
    gr.addColorStop(0, Art.mix(color, '#ffffff', 0.55)); gr.addColorStop(0.45, color); gr.addColorStop(1, Art.mix(color, '#12062A', 0.42));
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 0);
    g.bezierCurveTo(len * 0.18, -W * 0.22, len * 0.28, -W, len * 0.64, -W);
    g.bezierCurveTo(len * 0.9, -W, len, -W * 0.52, len, 0);
    g.bezierCurveTo(len, W * 0.52, len * 0.9, W, len * 0.64, W);
    g.bezierCurveTo(len * 0.28, W, len * 0.18, W * 0.22, 0, 0);
    g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.beginPath(); g.ellipse(len * 0.7, -W * 0.46, len * 0.13, W * 0.16, 0.1, 0, TAU); g.fill();
    g.restore();
  }
  const BALLOON_COLORS = [C.pink, C.cyan, C.sun, C.leaf, C.violet, C.fire];
  function drawBalloons(g, dirs, cam, W) {
    const center = proj([0, 0, 0], cam);
    const list = dirs.map((d, i) => ({ d, i, tip: proj(d, cam) })).sort((a, b) => a.tip.z - b.tip.z);
    list.forEach((b) => balloon(g, center.x, center.y, b.tip, W * b.tip.f, BALLOON_COLORS[b.i % 6]));
    g.fillStyle = '#F7F2FF'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.arc(center.x, center.y, 11, 0, TAU); g.fill(); g.stroke();
  }
  const clustered = (n) => Array.from({ length: n }, (_, i) => norm([Math.cos((i / n) * TAU) * 0.3, 1, Math.sin((i / n) * TAU) * 0.3]));
  const camAt = (cx, cy, s, t, o = {}) => ({ cx, cy, s, yaw: (o.yaw === undefined ? 0.5 : o.yaw) + Math.sin(t * 0.55) * (o.spin === undefined ? 0.32 : o.spin * 1.4), pitch: o.pitch === undefined ? 0.28 : o.pitch });

  /* ---------- Story 1: balloons ---------- */
  function balloonScene(n, geomDirs, name, angleText, sayLabel) {
    return (g, p, t, { W, H }) => {
      const q = ease.out(seg(p, 0.05, 0.75));
      const start = clustered(n);
      const dirs = geomDirs.map((d, i) => mixV(start[i], d, q));
      const cam = camAt(W / 2, H / 2 + 8, 158, t, { yaw: n === 2 || n === 3 ? 0.18 : 0.5, spin: n === 2 || n === 3 ? 0.16 : 0.22, pitch: n === 2 || n === 3 ? 0.12 : 0.28 });
      drawBalloons(g, dirs, cam, n > 4 ? 36 : 46);
      Art.text(g, `${n} groups`, 92, 52, { font: 'display', size: 42, color: C.ink });
      Art.text(g, angleText, W - 18, 52, { font: 'display', size: angleText.length > 6 ? 40 : 56, color: C.sun, align: 'right', alpha: seg(p, 0.65, 0.85) });
      Art.text(g, name, W / 2, H - 28, { font: 'display', size: 38, halo: true, alpha: seg(p, 0.7, 0.9) });
      void sayLabel;
    };
  }
  const alpha54 = Math.acos(1 / Math.sqrt(3));
  const tetraFromFlat = [[Math.sin(alpha54), 0, Math.cos(alpha54)], [-Math.sin(alpha54), 0, Math.cos(alpha54)], [0, Math.sin(alpha54), -Math.cos(alpha54)], [0, -Math.sin(alpha54), -Math.cos(alpha54)]];
  const flat4 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]];
  Lab.story('#story-balloons', {
    title: 'Electron groups behave like balloons',
    scenes: [
      {
        say: 'Tie two balloons at the same knot. They push apart until they point in <b>opposite directions</b>. Electron groups around an atom do the same thing, because they are all negative.',
        dur: 3,
        draw: balloonScene(2, G.linear, 'Linear', '180°'),
      },
      {
        say: 'Three balloons spread out flat, pointing at the corners of a triangle. Each pair is <b>120°</b> apart. This is <b>trigonal planar</b>.',
        dur: 3,
        draw: balloonScene(3, G.trigonal, 'Trigonal planar', '120°'),
      },
      {
        say: 'You might guess four balloons make a flat plus sign, 90° apart. But they can do better. They pop into 3D, pointing at the corners of a <b>tetrahedron</b>, 109.5° apart.',
        speak: 'You might guess four balloons make a flat plus sign, ninety degrees apart. But they can do better. They pop into 3D, pointing at the corners of a tetrahedron, 109.5 degrees apart.',
        dur: 4.4,
        draw(g, p, t, { W, H }) {
          const q = ease.inOut(seg(p, 0.42, 0.82));
          const dirs = flat4.map((d, i) => mixV(d, tetraFromFlat[i], q));
          const cam = { cx: W / 2, cy: H / 2 + 6, s: 150, yaw: q * (0.5 + Math.sin(t * 0.55) * 0.3), pitch: q * 0.3 };
          drawBalloons(g, dirs, cam, 42);
          const ang = angleOf(dirs[0], dirs[2]);
          Art.text(g, '4 groups', 92, 52, { font: 'display', size: 42 });
          Art.text(g, ang.toFixed(ang > 109 ? 1 : 0) + '°', W - 18, 52, { font: 'display', size: 56, color: q >= 1 ? C.leaf : C.red, align: 'right' });
          if (p < 0.4) Art.text(g, 'A flat plus sign? Too close!', W / 2, H - 28, { size: 30, color: C.red, halo: true, alpha: seg(p, 0.1, 0.22) });
          else Art.text(g, 'Tetrahedral', W / 2, H - 28, { font: 'display', size: 38, halo: true, alpha: seg(p, 0.75, 0.9) });
          Art.moe(g, 90, H - 8, 110, q < 0.5 ? 'think' : 'wow', { t });
        },
      },
      {
        say: 'Five groups make a <b>trigonal bipyramid</b>. Three sit around the middle, 120° apart, and two sit at the top and bottom, 90° from the middle ones. So there are two kinds of spots.',
        dur: 3.2,
        draw(g, p, t, { W, H }) {
          const q = ease.out(seg(p, 0.05, 0.7));
          const start = clustered(5);
          const dirs = G.tbp.map((d, i) => mixV(start[i], d, q));
          drawBalloons(g, dirs, camAt(W / 2, H / 2 + 8, 150, t, { pitch: 0.2 }), 34);
          Art.text(g, '5 groups', 92, 52, { font: 'display', size: 42 });
          Art.text(g, '90° and 120°', W - 18, 52, { font: 'display', size: 40, color: C.sun, align: 'right', alpha: seg(p, 0.65, 0.85) });
          Art.text(g, 'Trigonal bipyramidal', W / 2, H - 26, { font: 'display', size: 36, halo: true, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: 'Six groups make an <b>octahedron</b>: four around the middle and two at the top and bottom, all <b>90°</b> from their neighbors. Every spot is the same as every other.',
        dur: 3,
        draw: balloonScene(6, G.octahedral, 'Octahedral', '90°'),
      },
      {
        say: 'That is all five electron geometries. Learn these five and every other shape comes from them. <b>The number of groups picks the arrangement.</b>',
        dur: 3.4,
        draw(g, p, t, { W }) {
          const rows = [[2, G.linear, ['Linear'], '180°'], [3, G.trigonal, ['Trigonal', 'planar'], '120°'], [4, G.tetrahedral, ['Tetrahedral'], '109.5°'], [5, G.tbp, ['Trigonal', 'bipyramidal'], '90°, 120°'], [6, G.octahedral, ['Octahedral'], '90°']];
          rows.forEach(([n, dirs, name, ang], i) => {
            const x = 84 + i * 158, qq = ease.back(seg(p, 0.03 + i * 0.13, 0.25 + i * 0.13));
            if (qq <= 0) return;
            g.save(); g.translate(x, 170); g.scale(qq, qq); g.translate(-x, -170);
            drawBalloons(g, dirs, camAt(x, 170, 62, t, { pitch: 0.25 }), n > 4 ? 15 : 19);
            g.restore();
            Art.text(g, String(n), x, 44, { font: 'display', size: 46, color: C.pink });
            Art.text(g, 'groups', x, 82, { size: 22, color: C.pink });
            name.forEach((s, k) => Art.text(g, s, x, 290 + k * 26, { size: 21, color: C.ink, alpha: seg(p, 0.1 + i * 0.13, 0.3 + i * 0.13) }));
            Art.text(g, ang, x, 362, { font: 'display', size: 26, color: C.sun, alpha: seg(p, 0.1 + i * 0.13, 0.3 + i * 0.13) });
          });
          void W;
        },
      },
    ],
  });

  /* ---------- Bench: the repulsion simulator ---------- */
  // Coulomb-like repulsion on a unit sphere. A lone pair pushes harder: 1.25 times against a bond, 1.7 against another lone pair.
  const PAIR = (a, b) => (a && b ? 1.7 : a || b ? 1.25 : 1);
  function energyOf(P, nB) {
    let E = 0;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const r = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1], P[i][2] - P[j][2]) + 1e-6;
      E += PAIR(i >= nB, j >= nB) / r;
    }
    return E;
  }
  function relaxStep(P, V, nB, h, damp) {
    const n = P.length;
    let maxF = 0;
    const F = P.map(() => [0, 0, 0]);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const d = [P[i][0] - P[j][0], P[i][1] - P[j][1], P[i][2] - P[j][2]];
      const r = Math.hypot(d[0], d[1], d[2]) + 1e-4, f = PAIR(i >= nB, j >= nB) / (r * r * r);
      for (let a = 0; a < 3; a++) { F[i][a] += f * d[a]; F[j][a] -= f * d[a]; }
    }
    for (let i = 0; i < n; i++) {
      const rad = dot(F[i], P[i]);
      for (let a = 0; a < 3; a++) F[i][a] -= rad * P[i][a];
      maxF = Math.max(maxF, Math.hypot(F[i][0], F[i][1], F[i][2]));
      for (let a = 0; a < 3; a++) { V[i][a] = V[i][a] * damp + F[i][a] * h; P[i][a] += V[i][a] * h; }
      const m = Math.hypot(P[i][0], P[i][1], P[i][2]) || 1;
      for (let a = 0; a < 3; a++) P[i][a] /= m;
    }
    return maxF;
  }
  const randDir = () => { const u = Math.random() * 2 - 1, a = Math.random() * TAU, q = Math.sqrt(1 - u * u); return [q * Math.cos(a), q * Math.sin(a), u]; };
  const bestE = {};
  /** The true lowest energy for this mix of groups, from many random starts. Used to shake the model out of traps. */
  function lowestEnergy(nB, nL) {
    const key = nB + '-' + nL;
    if (bestE[key] !== undefined) return bestE[key];
    let best = Infinity;
    for (let s = 0; s < 14; s++) {
      const P = Array.from({ length: nB + nL }, randDir), V = P.map(() => [0, 0, 0]);
      for (let it = 0; it < 900; it++) relaxStep(P, V, nB, 0.06, 0.82);
      best = Math.min(best, energyOf(P, nB));
    }
    return (bestE[key] = best);
  }
  const simAngle = (a) => (Math.abs(a - 109.47) < 0.3 ? '109.5°' : Math.round(a) + '°');
  const sim = { nB: 4, nL: 0, P: [], V: [], settled: false, tSettle: 0, parts: [], kick: 0, group: null };
  const simV = Chem3D.viewer('#v-sim', { height: 440, distance: 7.6, label: 'Atoms and lone pairs on a sphere pushing each other into a shape.' });
  function rebuildSim(keep) {
    if (!simV.ok) { paintSim(); return; }
    const old = keep ? sim.P.map((p, i) => ({ p, lone: i >= sim.prevB })) : [];
    const oldB = old.filter((o) => !o.lone).map((o) => o.p), oldL = old.filter((o) => o.lone).map((o) => o.p);
    sim.P = [];
    for (let i = 0; i < sim.nB; i++) sim.P.push(oldB[i] ? oldB[i].slice() : randDir());
    for (let i = 0; i < sim.nL; i++) sim.P.push(oldL[i] ? oldL[i].slice() : randDir());
    sim.V = sim.P.map(() => [0, 0, 0]);
    sim.prevB = sim.nB;
    sim.settled = false; sim.settleT = 0;
    simV.clear();
    const group = new THREE.Group();
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.46, 40, 30), simV.atomMaterial(Art.elementColor('S')));
    group.add(center);
    sim.parts = sim.P.map((_, i) => {
      if (i < sim.nB) {
        const atom = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 24), simV.atomMaterial(Art.elementColor('F')));
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 18), simV.atomMaterial('#D9D1EC', { roughness: 0.45 }));
        group.add(atom); group.add(stick);
        return { atom, stick };
      }
      const mat = simV.atomMaterial('#FFE27A', { opacity: 0.55, roughness: 0.4 });
      mat.emissive = new THREE.Color('#B88A10');
      const lobeM = new THREE.Mesh(new THREE.SphereGeometry(0.4, 30, 22), mat);
      lobeM.scale.set(0.82, 1.5, 0.82);
      const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), simV.atomMaterial('#35E6FF'));
      const e2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), simV.atomMaterial('#35E6FF'));
      group.add(lobeM); group.add(e1); group.add(e2);
      return { lobe: lobeM, e1, e2 };
    });
    simV.add(group);
    sim.group = group;
    placeSim();
    simV.animate(stepSim);
    if (Lab.reducedMotion || Lab.isAuto) { settleNow(); }
    paintSim();
  }
  const UP = THREE ? new THREE.Vector3(0, 1, 0) : null;
  function placeSim() {
    const v = new THREE.Vector3();
    sim.P.forEach((p, i) => {
      v.set(p[0], p[1], p[2]);
      const part = sim.parts[i];
      if (!part) return;
      if (part.atom) {
        part.atom.position.copy(v).multiplyScalar(1.6);
        part.stick.position.copy(v).multiplyScalar(0.8);
        part.stick.scale.set(1, 1.6, 1);
        part.stick.quaternion.setFromUnitVectors(UP, v);
      } else {
        part.lobe.position.copy(v).multiplyScalar(0.9);
        part.lobe.quaternion.setFromUnitVectors(UP, v);
        const side = new THREE.Vector3(0.31, 0.77, 0.55).cross(v).normalize();
        part.e1.position.copy(v).multiplyScalar(1.1).addScaledVector(side, 0.12);
        part.e2.position.copy(v).multiplyScalar(1.1).addScaledVector(side, -0.12);
      }
    });
  }
  function settleNow() {
    for (let k = 0; k < 8; k++) {
      for (let it = 0; it < 900; it++) relaxStep(sim.P, sim.V, sim.nB, 0.06, 0.82);
      if (energyOf(sim.P, sim.nB) <= lowestEnergy(sim.nB, sim.nL) + 1e-3) break;
      sim.P = sim.P.map(() => randDir()); sim.V = sim.P.map(() => [0, 0, 0]);
    }
    placeSim();
    sim.settled = true;
    if (simV.ok) labelSim();
  }
  function bondAngles() {
    const list = [];
    for (let i = 0; i < sim.nB; i++) for (let j = i + 1; j < sim.nB; j++) list.push({ i, j, a: angleOf(sim.P[i], sim.P[j]) });
    return list.sort((x, y) => x.a - y.a);
  }
  function labelSim() {
    const list = bondAngles();
    const labels = [];
    const lab = (pair) => {
      const mid = norm([sim.P[pair.i][0] + sim.P[pair.j][0], sim.P[pair.i][1] + sim.P[pair.j][1], sim.P[pair.i][2] + sim.P[pair.j][2]]);
      labels.push({ p: [mid[0] * 1.05, mid[1] * 1.05, mid[2] * 1.05], text: simAngle(pair.a) });
    };
    if (list.length) lab(list[0]);
    if (list.length > 1 && list[list.length - 1].a - list[0].a > 5 && list[list.length - 1].a < 175) lab(list[list.length - 1]);
    simV.labels(labels);
  }
  let simClock = 0;
  function stepSim(dt) {
    if (sim.settled) return;
    let maxF = 0;
    for (let k = 0; k < 2; k++) maxF = relaxStep(sim.P, sim.V, sim.nB, 0.05, 0.86);
    simClock += dt;
    placeSim();
    if (simClock > 0.12) { simClock = 0; paintSim(); }
    if (maxF < 0.004) {
      if (energyOf(sim.P, sim.nB) > lowestEnergy(sim.nB, sim.nL) + 1e-3) {
        // Stuck in a trap: a little nudge lets it fall into the true lowest arrangement.
        sim.P = sim.P.map((p) => norm([p[0] + (Math.random() - 0.5) * 0.7, p[1] + (Math.random() - 0.5) * 0.7, p[2] + (Math.random() - 0.5) * 0.7]));
        sim.V = sim.P.map(() => [0, 0, 0]);
      } else {
        sim.settled = true;
        labelSim();
        paintSim();
      }
    }
  }
  function paintSim() {
    Lab.$('#sim-b-out').textContent = sim.nB;
    Lab.$('#sim-l-out').textContent = sim.nL;
    const groups = sim.nB + sim.nL;
    const list = simV.ok ? bondAngles() : [];
    const shape = K.shape(groups, sim.nL);
    const a0 = list.length ? list[0].a : null, a1 = list.length ? list[list.length - 1].a : null;
    Lab.$('#sim-a0').textContent = a0 === null ? 'none' : simAngle(a0);
    Lab.$('#sim-a1').textContent = a1 === null ? 'none' : simAngle(a1);
    let text, say;
    if (groups < 2 || !shape) {
      text = groups > 6 ? 'Too many' : sim.nB + sim.nL < 2 ? 'Needs more' : 'Not common';
      say = sim.nB === 1 ? 'One bond is just a pair of atoms. Add more groups to see a shape form.' : 'This mix of groups is unusual in Chem 101. Try fewer lone pairs.';
    } else {
      text = sim.settled ? shape.name : 'Settling';
      if (sim.nL === 0) say = `With ${groups} equal groups, the sphere splits up evenly. No shape was programmed in: this is simply the arrangement with the least repulsion.`;
      else if (groups === 5) say = 'Look where the lone pairs land. They settle in the <b>equatorial</b> spots, around the middle, every time. Shake it and see for yourself.';
      else if (groups === 6 && sim.nL === 2) say = 'The two lone pairs push each other to <b>opposite sides</b>. The four atoms left make a flat square.';
      else say = 'The lone pair pushes a little harder, so the bonds are squeezed together. Compare the angle to the one with no lone pairs.';
    }
    Lab.$('#sim-shape').textContent = text;
    const caveat = groups === 5 && sim.nL === 1 ? 'A simplified model. Most real angles differ by a few degrees, but not this one: the two equatorial bonds spread to about 124° here, while real SF₄ closes them to about 102°.' : 'A simplified model. Real angles differ by a few degrees.';
    Lab.$('#sim-say').innerHTML = say + ` <span style="opacity:.75">${caveat}</span>`;
  }
  const fixSimL = () => {
    Lab.$$('#sim-l button').forEach((b) => {
      const v = +b.dataset.value;
      const allowed = sim.nB + v <= 6 && sim.nB + v >= 2 && K.shape(sim.nB + v, v);
      b.disabled = !allowed; b.style.opacity = allowed ? '' : '0.35';
    });
  };
  const segSimB = Lab.segmented('#sim-b', (v) => {
    sim.nB = +v;
    if (!K.shape(sim.nB + sim.nL, sim.nL)) { for (let l = sim.nL; l >= 0; l--) if (K.shape(sim.nB + l, l)) { sim.nL = l; break; } }
    if (!K.shape(sim.nB + sim.nL, sim.nL)) { for (let l = 0; l <= 3; l++) if (K.shape(sim.nB + l, l)) { sim.nL = l; break; } }
    segSimL.set(String(sim.nL), false);
    fixSimL();
    rebuildSim(true);
  });
  const segSimL = Lab.segmented('#sim-l', (v) => { sim.nL = +v; rebuildSim(true); });
  void segSimB;
  Lab.$('#sim-shake').addEventListener('click', () => {
    sim.P = sim.P.map(() => randDir()); sim.V = sim.P.map(() => [0, 0, 0]); sim.settled = false;
    if (simV.ok) simV.labels([]);
    Lab.sound.pop(); placeSim(); paintSim();
    if (Lab.reducedMotion) { settleNow(); paintSim(); }
  });
  fixSimL();
  rebuildSim(false);

  /* ---------- Local Lewis sketch ---------- */
  function sketch(g, cx, cy, center, spec, o = {}) {
    const L = o.L || 110, r = o.r || 34, ro = o.ro || 28;
    (spec.bonds || []).forEach((b, k) => {
      const x = cx + Math.cos(b.a) * L, y = cy + Math.sin(b.a) * L;
      const alpha = b.alpha === undefined ? 1 : b.alpha;
      if (alpha <= 0) return;
      g.save(); g.globalAlpha *= alpha;
      Art.bond(g, cx, cy, x, y, { order: b.order || 1, width: 6 });
      Art.atom(g, x, y, b.el === 'H' ? ro * 0.8 : ro, b.el, { face: o.faces && b.el !== 'H' ? 'happy' : null, t: o.t, seed: k });
      g.restore();
    });
    Art.atom(g, cx, cy, r, center, { face: o.face, t: o.t, look: o.look });
    (spec.lps || []).forEach((a) => {
      const d = r + 16, px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d, ox = -Math.sin(a) * 8, oy = Math.cos(a) * 8;
      Art.electron(g, px + ox, py + oy, 5.8); Art.electron(g, px - ox, py - oy, 5.8);
    });
  }
  const DEG = Math.PI / 180;
  function numberBadge(g, x, y, n, q) {
    if (q <= 0) return;
    const s = ease.back(q);
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = C.pink; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.arc(0, 0, 21, 0, TAU); g.fill(); g.stroke();
    Art.text(g, String(n), 0, 1, { font: 'display', size: 28, color: '#fff' });
    g.restore();
  }
  const h2oItems = (lpAlpha, theta = 104.5, faces) => {
    const h = (theta / 2) * DEG;
    return [
      { d: [Math.sin(h), -Math.cos(h), 0], el: 'H', face: faces ? 'happy' : null },
      { d: [-Math.sin(h), -Math.cos(h), 0], el: 'H', face: faces ? 'happy' : null },
      { d: [0, 0.5, 0.866], alpha: lpAlpha }, { d: [0, 0.5, -0.866], alpha: lpAlpha },
    ];
  };

  /* ---------- Story 2: from Lewis structure to shape ---------- */
  Lab.story('#story-count', {
    title: 'Counting groups, then naming the shape',
    scenes: [
      {
        say: 'An electron group is anything that points one way from the center. A <b>single bond</b>, a <b>double bond</b>, a <b>triple bond</b> and a <b>lone pair</b> each count as exactly <b>one group</b>.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          Art.text(g, 'Each of these is one group', W / 2, 44, { font: 'display', size: 38 });
          const cards = [['single bond', 1, 'H'], ['double bond', 2, 'O'], ['triple bond', 3, 'N'], ['lone pair', 0, null]];
          cards.forEach(([label, order, el], i) => {
            const x = 106 + i * 196, q = ease.back(seg(p, 0.05 + i * 0.17, 0.25 + i * 0.17));
            if (q <= 0) return;
            g.save(); g.translate(x, 210); g.scale(q, q);
            g.fillStyle = 'rgba(14,6,30,.6)'; Art.round(g, -90, -110, 180, 220, 18); g.fill();
            g.strokeStyle = 'rgba(247,242,255,.16)'; g.lineWidth = 2; g.stroke();
            if (order) {
              Art.bond(g, -38, -16, 40, -16, { order, width: 6 });
              Art.atom(g, -44, -16, 28, 'C', {});
              Art.atom(g, 46, -16, el === 'H' ? 22 : 26, el, {});
            } else {
              Art.atom(g, -18, -16, 30, 'N', {});
              Art.electron(g, 30, -28, 7); Art.electron(g, 30, -4, 7);
            }
            Art.text(g, label, 0, 54, { size: 25 });
            Art.text(g, '= 1', 0, 86, { font: 'display', size: 28, color: C.sun });
            g.restore();
          });
          Art.text(g, 'Only the direction matters here, not the number of electrons.', W / 2, 372, { size: 25, color: C.cyan, alpha: seg(p, 0.8, 0.95) });
        },
      },
      {
        say: 'Now water. From the Lewis structure, oxygen has <b>2 bonds</b> and <b>2 lone pairs</b>. That makes 4 groups.',
        dur: 3.6,
        draw(g, p, t) {
          const cx = 280, cy = 190;
          sketch(g, cx, cy, 'O', { bonds: [{ a: 35 * DEG, el: 'H' }, { a: 145 * DEG, el: 'H' }], lps: [-55 * DEG, -125 * DEG] }, { L: 150, r: 54, ro: 46, t, face: 'happy' });
          numberBadge(g, cx + Math.cos(35 * DEG) * 92, cy + Math.sin(35 * DEG) * 92 + 28, 1, seg(p, 0.1, 0.25));
          numberBadge(g, cx + Math.cos(145 * DEG) * 92, cy + Math.sin(145 * DEG) * 92 + 28, 2, seg(p, 0.25, 0.4));
          numberBadge(g, cx + Math.cos(-55 * DEG) * 104 + 18, cy + Math.sin(-55 * DEG) * 104, 3, seg(p, 0.4, 0.55));
          numberBadge(g, cx + Math.cos(-125 * DEG) * 104 - 18, cy + Math.sin(-125 * DEG) * 104, 4, seg(p, 0.55, 0.7));
          Art.text(g, '4 groups', 620, 110, { font: 'display', size: 60, color: C.sun, alpha: seg(p, 0.7, 0.85) });
          Art.text(g, '2 bonds', 620, 186, { size: 30, alpha: seg(p, 0.75, 0.9) });
          Art.text(g, '2 lone pairs', 620, 226, { size: 30, color: C.cyan, alpha: seg(p, 0.75, 0.9) });
          Art.formula(g, 'H2O', 280, 376, { size: 48, colorize: true });
          Art.moe(g, 620, 430, 130, 'point', { t, flip: true });
        },
      },
      {
        say: 'Four groups point to the corners of a tetrahedron. That arrangement of all the groups is the <b>electron geometry</b>. Lone pairs are the yellow clouds.',
        dur: 2.8,
        draw(g, p, t, { W, H }) {
          const q = ease.out(seg(p, 0, 0.5));
          const cam = camAt(W / 2, H / 2 - 10, 150 * lerp(0.7, 1, q), t, { spin: 0.3 });
          drawAX(g, { cam, center: 'O', items: h2oItems(1, 109.5, true), t, face: 'happy' });
          Art.text(g, 'Electron geometry', W / 2, 30, { size: 26, color: C.dim });
          Art.text(g, 'Tetrahedral', W / 2, H - 34, { font: 'display', size: 44, color: C.sun, halo: true, alpha: seg(p, 0.5, 0.75) });
        },
      },
      {
        say: 'But you cannot see lone pairs. The <b>molecular geometry</b> names only where the <b>atoms</b> are. Three atoms in this arrangement form a V. Water is <b>bent</b>, not tetrahedral.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          const q = ease.inOut(seg(p, 0.15, 0.6));
          const cam = camAt(W / 2, H / 2 - 10, 150, t, { spin: 0.3 });
          drawAX(g, { cam, center: 'O', items: h2oItems(lerp(1, 0.12, q), 104.5, true), t, face: 'happy' });
          Art.text(g, 'Molecular geometry', W / 2, 30, { size: 26, color: C.dim });
          Art.text(g, 'Bent', W / 2, H - 34, { font: 'display', size: 50, color: C.pink, halo: true, alpha: seg(p, 0.55, 0.8) });
        },
      },
      {
        say: 'Compare carbon dioxide. Three atoms again, but carbon has <b>no lone pairs</b>, and each double bond counts once. Only <b>2 groups</b>, so $\\ce{CO2}$ is <b>linear</b>. You have to count. The formula alone will not tell you.',
        dur: 3.4,
        draw(g, p, t, { H }) {
          const camA = camAt(205, 196, 104, t, { yaw: 0.62, spin: 0.12 });
          const camB = camAt(595, 196, 118, t, { yaw: 0.3, spin: 0.12 });
          drawAX(g, { cam: camA, center: 'O', items: h2oItems(0.85, 104.5), t, rc: 34, ro: 26, face: 'happy' });
          const q = ease.out(seg(p, 0.1, 0.55));
          drawAX(g, { cam: camB, center: 'C', items: [{ d: [1, 0, 0], el: 'O', order: 2 }, { d: [-1, 0, 0], el: 'O', order: 2 }], t, rc: 34, ro: 28, alpha: q, face: 'happy' });
          Art.text(g, 'H₂O', 205, 46, { font: 'display', size: 42 });
          Art.text(g, 'CO₂', 595, 46, { font: 'display', size: 42 });
          Art.text(g, '4 groups', 205, H - 118, { size: 30, color: C.sun, alpha: seg(p, 0.2, 0.4) });
          Art.text(g, 'Bent', 205, H - 66, { font: 'display', size: 46, color: C.pink, alpha: seg(p, 0.3, 0.5) });
          Art.text(g, '2 groups', 595, H - 118, { size: 30, color: C.sun, alpha: seg(p, 0.5, 0.7) });
          Art.text(g, 'Linear', 595, H - 66, { font: 'display', size: 46, color: C.pink, alpha: seg(p, 0.6, 0.8) });
        },
      },
    ],
  });

  /* ---------- Bench: shape explorer ---------- */
  const PAIRS = { '2-0': [[0, 1]], '3-0': [[1, 2]], '3-1': [[1, 2]], '4-0': [[0, 1]], '4-1': [[1, 2]], '4-2': [[2, 3]], '5-0': [[0, 2], [2, 3]], '5-1': [[0, 3], [3, 4]], '5-2': [[0, 4], [0, 1]], '5-3': [[0, 1]], '6-0': [[0, 2]], '6-1': [[1, 2], [2, 4]], '6-2': [[2, 4]] };
  const SYMMETRIC_LP = ['5-3', '6-2'];
  const EXPLAIN = {
    '2-0': 'Two groups get as far apart as possible, on opposite sides of the atom.',
    '3-0': 'Three groups spread out in a flat triangle.',
    '3-1': 'One of the three spots holds a lone pair. The atoms make a V, squeezed a little by the lone pair.',
    '4-0': 'Four groups point to the corners of a tetrahedron, a pyramid with a triangle for a base.',
    '4-1': 'One corner of the tetrahedron is a lone pair. Hide it and you see a pyramid with the central atom at the top.',
    '4-2': 'Two corners are lone pairs. Hide them and the atoms make a V.',
    '5-0': 'Three atoms sit around the middle (equatorial) and two at the top and bottom (axial).',
    '5-1': 'The lone pair takes an equatorial spot, with fewer neighbors at 90°. The atoms look like a seesaw: tilt your head!',
    '5-2': 'Both lone pairs go equatorial. The three atoms left make a T.',
    '5-3': 'All three lone pairs go equatorial, a flat triangle around the middle. The two atoms left are straight across from each other.',
    '6-0': 'Six groups at the corners of an octahedron, all at 90° to their neighbors.',
    '6-1': 'Every spot is the same, so the lone pair can go anywhere. The five atoms make a pyramid with a square base.',
    '6-2': 'The two lone pairs go on opposite sides, as far from each other as they can get. The four atoms left make a flat square.',
  };
  const sx = { g: 4, l: 0, view: 'eg', ex: 0 };
  const shapeV = Chem3D.viewer('#v-shapes', { height: 470, distance: 7.4, label: 'A rotatable 3D model of the selected molecular shape with its bond angles labeled.' });

  function hullFaces(pts) {
    // Brute force is fine for up to 7 points. Groups coplanar triangles into one polygon per plane.
    const planes = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
      const a = pts[i], b = pts[j], c = pts[k];
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      let nor = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const m = Math.hypot(nor[0], nor[1], nor[2]);
      if (m < 1e-5) continue;
      nor = [nor[0] / m, nor[1] / m, nor[2] / m];
      const dist = pts.map((p) => (p[0] - a[0]) * nor[0] + (p[1] - a[1]) * nor[1] + (p[2] - a[2]) * nor[2]);
      const pos = dist.some((d) => d > 1e-4), neg = dist.some((d) => d < -1e-4);
      if (pos && neg) continue;
      const on = pts.map((_, q) => q).filter((q) => Math.abs(dist[q]) < 1e-4);
      const key = on.join(',');
      if (!planes.some((pl) => pl.key === key)) planes.push({ key, on, nor });
    }
    return planes.map((pl) => {
      const cen = pl.on.reduce((s, q) => [s[0] + pts[q][0] / pl.on.length, s[1] + pts[q][1] / pl.on.length, s[2] + pts[q][2] / pl.on.length], [0, 0, 0]);
      const u = norm([pts[pl.on[0]][0] - cen[0], pts[pl.on[0]][1] - cen[1], pts[pl.on[0]][2] - cen[2]]);
      const w = [pl.nor[1] * u[2] - pl.nor[2] * u[1], pl.nor[2] * u[0] - pl.nor[0] * u[2], pl.nor[0] * u[1] - pl.nor[1] * u[0]];
      const ang = (q) => Math.atan2(dot([pts[q][0] - cen[0], pts[q][1] - cen[1], pts[q][2] - cen[2]], w), dot([pts[q][0] - cen[0], pts[q][1] - cen[1], pts[q][2] - cen[2]], u));
      return pl.on.slice().sort((a, b) => ang(a) - ang(b)).map((q) => pts[q]);
    });
  }
  function ghostSolid(pts, color) {
    const faces = hullFaces(pts);
    const tri = [], edges = [];
    faces.forEach((poly) => {
      for (let i = 1; i < poly.length - 1; i++) tri.push(...poly[0], ...poly[i], ...poly[i + 1]);
      poly.forEach((p, i) => edges.push(...p, ...poly[(i + 1) % poly.length]));
    });
    const group = new THREE.Group();
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3));
    group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false })));
    const eGeo = new THREE.BufferGeometry(); eGeo.setAttribute('position', new THREE.Float32BufferAttribute(edges, 3));
    group.add(new THREE.LineSegments(eGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 })));
    return group;
  }
  function arcMesh(a, b, r) {
    const A = new THREE.Vector3(...a).normalize(), B = new THREE.Vector3(...b).normalize();
    const ang = A.angleTo(B);
    let axis = A.clone().cross(B);
    if (axis.length() < 1e-3) { axis = new THREE.Vector3(0, 0, 1).cross(A); if (axis.length() < 1e-3) axis = new THREE.Vector3(0, 1, 0).cross(A); }
    axis.normalize();
    const pts = [];
    for (let i = 0; i <= 24; i++) pts.push(A.clone().applyAxisAngle(axis, (ang * i) / 24).multiplyScalar(r));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.026, 8, false), new THREE.MeshBasicMaterial({ color: '#FFD23F' }));
    return { mesh, mid: A.clone().applyAxisAngle(axis, ang / 2), ang: (ang * 180) / Math.PI };
  }
  const fmtAngle = (a) => (Math.abs(a - 109.47) < 0.1 ? '109.5' : String(Math.round(a))) + '°';
  function paintExplorer() {
    const shape = K.shape(sx.g, sx.l);
    const f = shape.examples[Math.min(sx.ex, shape.examples.length - 1)];
    const spec = K.get(f);
    const key = shape.key;
    Lab.$('#sx-name').textContent = shape.name;
    Lab.$('#sx-eg').textContent = shape.eg;
    Lab.$('#sx-ang').textContent = shape.angle;
    Lab.$('#sx-real').textContent = shape.real;
    Lab.$('#sx-say').innerHTML = Lab.texString(`<p><b>${shape.axe.replace(/<\/?sub>/g, (m) => m)} notation.</b> A is the center, X the bonded atoms, E the lone pairs. ${EXPLAIN[key]} Showing $${K.tex(f)}$, ${spec.name}.</p>`);
    if (!shapeV.ok) return;
    const pos = G[shape.geom];
    const lone = shape.lone;
    const bondLen = 1.55;
    const bonded = pos.map((_, i) => i).filter((i) => !lone.includes(i));
    const outerAt = {};
    bonded.forEach((pi, k) => { outerAt[pi] = spec.o[k % spec.o.length]; });
    const orderOf = (k) => (f === 'HCN' && spec.o[k] === 'N' ? 3 : (spec.doubles.includes(k) ? 2 : 1));
    const atoms = [{ el: spec.c, p: [0, 0, 0] }], bonds = [];
    bonded.forEach((pi, k) => { atoms.push({ el: outerAt[pi], p: pos[pi].map((c) => c * bondLen) }); bonds.push([0, atoms.length - 1, orderOf(k)]); });
    if (sx.view === 'eg') {
      if (f === 'HCN') shapeV.molecule({ atoms, bonds, lonePairs: lone.map((i) => ({ at: 0, dir: pos[i] })) });
      else {
        const doubles = bonded.filter((_, k) => orderOf(k) === 2);
        const outer = pos.map((_, i) => outerAt[i] || 'H');
        shapeV.shape({ geom: shape.geom, center: spec.c, outer, lone, doubles, bondLen });
      }
    } else shapeV.molecule({ atoms, bonds });
    // The ghost solid gives the shape its name.
    let solidPts = null;
    if (sx.view === 'eg' && sx.g >= 3) solidPts = pos.map((p) => p.map((c) => c * bondLen));
    if (sx.view === 'mg') {
      if (['3-0', '4-0', '5-0', '6-0', '6-1', '6-2'].includes(key)) solidPts = bonded.map((i) => pos[i].map((c) => c * bondLen));
      if (key === '4-1') solidPts = [[0, 0, 0]].concat(bonded.map((i) => pos[i].map((c) => c * bondLen)));
    }
    if (solidPts) shapeV.add(ghostSolid(solidPts, sx.view === 'eg' ? '#2FD6F2' : '#FF4FA3'));
    const labels = [];
    PAIRS[key].forEach(([a, b]) => {
      const arc = arcMesh(pos[a], pos[b], 0.86);
      shapeV.add(arc.mesh);
      const m = arc.mid.clone().multiplyScalar(1.3);
      const squeezed = sx.l > 0 && !SYMMETRIC_LP.includes(key);
      labels.push({ p: [m.x, m.y, m.z], text: (squeezed ? '&lt;' : '') + fmtAngle(arc.ang) });
    });
    shapeV.labels(labels);
    // A quick pop as it arrives.
    let age = 0;
    const main = shapeV.root.children[0];
    if (main && !Lab.reducedMotion) {
      main.scale.setScalar(0.5);
      shapeV.animate((dt) => { age += dt; main.scale.setScalar(0.5 + 0.5 * ease.back(clamp(age / 0.45))); });
    }
  }
  const sxL = Lab.$('#sx-l');
  function buildSxControls() {
    const max = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 2 }[sx.g];
    sx.l = Math.min(sx.l, max);
    sxL.innerHTML = Array.from({ length: max + 1 }, (_, i) => `<button type="button" data-value="${i}" aria-pressed="${i === sx.l}">${i}</button>`).join('');
    buildSxEx();
  }
  function buildSxEx() {
    const shape = K.shape(sx.g, sx.l);
    sx.ex = 0;
    Lab.$('#sx-ex').innerHTML = shape.examples.map((f, i) => `<button type="button" data-value="${i}" aria-pressed="${i === 0}">${Lab.fHTML(f)}</button>`).join('');
    paintExplorer();
  }
  sxL.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; sx.l = +b.dataset.value; Lab.$$('button', sxL).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); buildSxEx(); });
  Lab.$('#sx-ex').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; sx.ex = +b.dataset.value; Lab.$$('#sx-ex button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); paintExplorer(); });
  Lab.segmented('#sx-g', (v) => { sx.g = +v; buildSxControls(); });
  Lab.segmented('#sx-view', (v) => { sx.view = v; paintExplorer(); });
  buildSxControls();
  Lab.$('#shape-table').innerHTML = K.SHAPES.map((s) => `<tr><td>${s.groups}</td><td>${s.lp}</td><td>${s.eg}</td><td><b>${s.name}</b></td><td>${s.angle}</td><td>$${K.tex(s.examples[0])}$</td></tr>`).join('');
  if (Lab.isAuto) window.__vsepr = { sx: (g, l, view, ex) => { Lab.$(`#sx-g [data-value="${g}"]`).click(); const b = Lab.$(`#sx-l [data-value="${l}"]`); if (b) b.click(); Lab.$(`#sx-view [data-value="${view || 'eg'}"]`).click(); if (ex) Lab.$(`#sx-ex [data-value="${ex}"]`).click(); } };

  /* ---------- Story 3: lone pairs squeeze ---------- */
  const pyramidDirs = (theta) => {
    const s2 = (1 - Math.cos(theta * DEG)) / 1.5, phi = Math.asin(Math.sqrt(s2));
    return [90, 210, 330].map((az) => [Math.sin(phi) * Math.cos(az * DEG), -Math.cos(phi), Math.sin(phi) * Math.sin(az * DEG)]);
  };
  function angleBig(g, value, label, x, y, color) {
    Art.text(g, value, x, y, { font: 'display', size: 72, color });
    Art.text(g, label, x, y + 52, { size: 26, color: C.dim });
  }
  Lab.story('#story-squeeze', {
    title: 'Why lone pairs squeeze the bond angles',
    scenes: [
      {
        say: 'Methane, $\\ce{CH4}$, has 4 bonds and no lone pairs. All four are the same, so every H-C-H angle is exactly <b>109.5°</b>, the ideal tetrahedral angle.',
        dur: 2.6,
        draw(g, p, t) {
          const cam = camAt(290, 215, 150, t, { yaw: 0.3, spin: 0.12, pitch: 0.42 });
          const dirs = pyramidDirs(109.47);
          drawAX(g, { cam, center: 'C', items: [...dirs.map((d) => ({ d, el: 'H' })), { d: [0, 1, 0], el: 'H' }], t, rc: 40, ro: 28, face: 'happy' });
          arc3(g, dirs[0], dirs[1], 0.62, cam, { label: '109.5°', p: seg(p, 0.2, 0.7), gap: 0.34 });
          angleBig(g, '109.5°', 'H-C-H angle', 640, 150, C.sun);
          Art.formula(g, 'CH4', 640, 300, { size: 54 });
          Art.text(g, 'no lone pairs', 640, 354, { size: 28, color: C.leaf });
        },
      },
      {
        say: 'Swap one hydrogen for a <b>lone pair</b> and you have ammonia, $\\ce{NH3}$. The lone pair is held by only one nucleus, so it spreads out and takes more room. The bonds close up to <b>107°</b>.',
        dur: 3.6,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.1, 0.65));
          const theta = lerp(109.47, 107, q);
          const cam = camAt(290, 215, 150, t, { yaw: 0.3, spin: 0.12, pitch: 0.42 });
          const dirs = pyramidDirs(theta);
          drawAX(g, { cam, center: 'N', items: [...dirs.map((d) => ({ d, el: 'H' })), { d: [0, 1, 0], alpha: q, w: lerp(16, 38, q) }], t, rc: 40, ro: 28, face: 'happy' });
          arc3(g, dirs[0], dirs[1], 0.62, cam, { label: theta < 107.2 ? '107°' : theta.toFixed(1) + '°', gap: 0.34 });
          angleBig(g, theta < 107.2 ? '107°' : theta.toFixed(1) + '°', 'H-N-H angle', 640, 150, C.sun);
          Art.formula(g, 'NH3', 640, 300, { size: 54 });
          Art.text(g, '1 lone pair', 640, 354, { size: 28, color: C.cyan });
        },
      },
      {
        say: 'Two lone pairs in water, $\\ce{H2O}$, squeeze even harder. The angle closes to <b>104.5°</b>. The electron geometry is still tetrahedral, just distorted.',
        dur: 3.2,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.05, 0.6));
          const theta = lerp(107, 104.5, q);
          const cam = camAt(290, 190, 158, t, { yaw: 0.5, spin: 0.12, pitch: 0.18 });
          const h = (theta / 2) * DEG;
          const dirs = [[Math.sin(h), -Math.cos(h), 0], [-Math.sin(h), -Math.cos(h), 0]];
          drawAX(g, { cam, center: 'O', items: [{ d: dirs[0], el: 'H' }, { d: dirs[1], el: 'H' }, { d: [0, 0.5, 0.866], w: 38 }, { d: [0, 0.5, -0.866], w: 38 }], t, rc: 40, ro: 28, face: 'happy' });
          arc3(g, dirs[0], dirs[1], 0.58, cam, { label: theta < 104.7 ? '104.5°' : theta.toFixed(1) + '°', gap: 0.3 });
          angleBig(g, theta < 104.7 ? '104.5°' : theta.toFixed(1) + '°', 'H-O-H angle', 640, 150, C.sun);
          Art.formula(g, 'H2O', 640, 300, { size: 54 });
          Art.text(g, '2 lone pairs', 640, 354, { size: 28, color: C.cyan });
        },
      },
      {
        say: 'Put it together. <b>Lone pair with lone pair</b> pushes hardest, then lone pair with bond, then bond with bond. Every extra lone pair closes the angle a little more.',
        dur: 3.4,
        draw(g, p, t) {
          const rows = [['Lone pair, lone pair', 22, C.pink, 2, 2, 0], ['Lone pair, bond', 13, C.fire, 2, 1, 0.15], ['Bond, bond', 6, C.leaf, 1, 1, 0.3]];
          rows.forEach(([label, w, color, a, b, at], i) => {
            const y = 88 + i * 104, q = ease.out(seg(p, at, at + 0.3));
            const x1 = 86, x2 = 86 + 268 * (0.4 + 0.6 * q);
            const draw = (x, kind) => {
              if (kind === 2) lobe(g, x - 30, y, { x: x + 34, y }, 22, 1);
              else { Art.bond(g, x - 30, y, x + 14, y, { width: 6 }); Art.atom(g, x + 20, y, 19, 'H', {}); }
            };
            draw(x1, a); draw(x2 + 96, b);
            Art.arrow(g, x2 + 52, y, x1 + 66, y, { color, w, head: w * 1.7 + 8, both: true, p: q });
            Art.text(g, label, 280, y + 40, { size: 24, color, alpha: q });
          });
          const data = [['CH₄', 109.5, 0], ['NH₃', 107, 1], ['H₂O', 104.5, 2]];
          data.forEach(([f, a, i]) => {
            const x = 560 + i * 90, h = (a - 100) * 28 * ease.out(seg(p, 0.5 + i * 0.1, 0.8 + i * 0.1));
            g.fillStyle = [C.leaf, C.fire, C.pink][i];
            Art.round(g, x - 32, 340 - h, 64, h, 8); g.fill();
            Art.text(g, f, x, 370, { font: 'display', size: 30 });
            Art.text(g, a + '°', x, 330 - h, { font: 'display', size: 26, color: C.sun, alpha: seg(p, 0.65 + i * 0.1, 0.85 + i * 0.1) });
          });
          g.strokeStyle = 'rgba(247,242,255,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(516, 341); g.lineTo(784, 341); g.stroke();
          Art.text(g, 'Bars are not to zero: they start at 100°.', 400, 418, { size: 24, color: C.dim, alpha: seg(p, 0.8, 1) });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: place the lone pairs ---------- */
  const place = { key: '5-1', g: 5, k: 1, lps: [0], t0: 0, won: new Set(), best: null };
  const placeCount = (g, lps) => {
    const pos = G[K.shape(g, 0).geom];
    let LL = 0, LB = 0, BB = 0;
    const links = [];
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
      if (Math.abs(angleOf(pos[i], pos[j]) - 90) > 1) continue;
      const a = lps.includes(i), b = lps.includes(j);
      if (a && b) { LL++; links.push([i, j, 2]); } else if (a || b) { LB++; links.push([i, j, 1]); } else BB++;
    }
    return { LL, LB, BB, links };
  };
  /** The best arrangement, found by trying them all: fewest lone-lone at 90°, then fewest lone-bond at 90°. */
  function bestPlace(g, k) {
    const n = G[K.shape(g, 0).geom].length;
    let best = null;
    const walk = (start, chosen) => {
      if (chosen.length === k) {
        const c = placeCount(g, chosen);
        const score = c.LL * 100 + c.LB;
        if (!best || score < best.score) best = { score, LL: c.LL, LB: c.LB };
        return;
      }
      for (let i = start; i < n; i++) walk(i + 1, chosen.concat(i));
    };
    walk(0, []);
    return best;
  }
  place.best = bestPlace(5, 1);
  const placeCam = (t) => ({ cx: 262, cy: 240, s: 158, yaw: -0.42 + Math.sin(t * 0.5) * 0.18, pitch: 0.2 });
  const placeStage = Lab.stage('#c-place', {
    h: 480, label: 'Electron groups around a central atom with lone pairs you can move, and a count of the neighbors at 90 degrees.',
    onPointer(e) {
      const cam = placeCam(placeStage.t);
      const pos = G[K.shape(place.g, 0).geom];
      const hit = pos.findIndex((d) => { const q = proj(d, cam); return Math.hypot(e.x - q.x, e.y - q.y) < 52; });
      if (e.type === 'hover') { placeStage.canvas.style.cursor = hit >= 0 ? 'pointer' : 'default'; return; }
      if (e.type !== 'down' || hit < 0) return;
      if (place.lps.includes(hit)) return;
      place.lps.shift(); place.lps.push(hit);
      Lab.sound.pop(); place.t0 = placeStage.t;
      paintPlace();
    },
    draw(g, t) {
      const cam = placeCam(t);
      const pos = G[K.shape(place.g, 0).geom];
      const c = placeCount(place.g, place.lps);
      const isBest = c.LL === place.best.LL && c.LB === place.best.LB;
      // Crowded 90 degree links from the lone pairs.
      c.links.forEach(([i, j, kind]) => {
        const A = proj(pos[i], cam), B = proj(pos[j], cam);
        g.strokeStyle = kind === 2 ? Art.alpha(C.red, 0.95) : Art.alpha(C.fire, 0.55 + Math.sin(t * 4 + i) * 0.15);
        g.lineWidth = kind === 2 ? 8 : 4; g.setLineDash(kind === 2 ? [] : [9, 8]);
        g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke(); g.setLineDash([]);
      });
      const items = pos.map((d, i) => (place.lps.includes(i) ? { d, w: 40 } : { d, el: 'F', ro: 28 }));
      drawAX(g, { cam, center: 'S', items, t, rc: 38, ro: 28, face: isBest ? 'happy' : 'grumpy' });
      // Panel.
      g.fillStyle = 'rgba(14,6,30,.66)'; Art.round(g, 512, 14, 276, 452, 18); g.fill();
      Art.text(g, 'Neighbors at 90°', 650, 46, { size: 26 });
      const row = (y, label1, label2, v, color) => {
        Art.text(g, String(v), 560, y, { font: 'display', size: 50, color });
        Art.text(g, label1, 600, y - 14, { size: 22, align: 'left' });
        Art.text(g, label2, 600, y + 14, { size: 22, align: 'left', color: C.dim });
      };
      row(112, 'Lone pair and', 'lone pair', c.LL, c.LL ? C.red : C.leaf);
      row(196, 'Lone pair and', 'bond', c.LB, c.LB > place.best.LB ? C.fire : C.leaf);
      row(280, 'Bond and', 'bond', c.BB, C.dim);
      g.fillStyle = 'rgba(247,242,255,.2)'; g.fillRect(530, 326, 240, 3);
      if (isBest) {
        const shape = K.shape(place.g, place.k);
        Art.text(g, 'Least crowded!', 650, 364, { font: 'display', size: 32, color: C.leaf });
        Art.text(g, shape.name, 650, 414, { font: 'display', size: shape.name.length > 12 ? 30 : 40, color: C.sun });
      } else {
        Art.text(g, 'Still crowded.', 650, 372, { font: 'display', size: 30, color: C.fire });
        Art.text(g, 'Tap another spot.', 650, 414, { size: 25, color: C.dim });
      }
    },
  });
  function paintPlace() {
    const c = placeCount(place.g, place.lps);
    const isBest = c.LL === place.best.LL && c.LB === place.best.LB;
    const shape = K.shape(place.g, place.k);
    let html;
    if (isBest) {
      if (!place.won.has(place.key)) { place.won.add(place.key); Lab.collection.award(1); Lab.sound.good(); }
      const where = place.g === 5 ? 'in equatorial spots' : 'on opposite sides';
      html = `<p><b>Best arrangement found.</b> With ${place.k > 1 ? 'the lone pairs' : 'the lone pair'} ${where}, there are only ${c.LB} lone pair to bond contacts at 90° and ${c.LL} between lone pairs. The atoms form a <b>${shape.name.toLowerCase()}</b> shape.</p>`;
    } else {
      html = `<p>This arrangement has ${c.LL ? `<b>${c.LL}</b> lone pair to lone pair contact${c.LL === 1 ? '' : 's'} at 90° (the worst kind) and ` : ''}<b>${c.LB}</b> lone pair to bond contacts at 90°. Tap a bond to put a lone pair there instead.</p>`;
    }
    Lab.$('#place-say').innerHTML = html;
  }
  Lab.segmented('#place-mode', (v) => {
    const [g, k] = v.split('-').map(Number);
    place.key = v; place.g = g; place.k = k;
    place.best = bestPlace(g, k);
    place.lps = g === 5 ? [0, 2, 3].slice(0, k) : [0, 2].slice(0, k);
    paintPlace(); placeStage.redraw();
  });
  paintPlace();

  /* ---------- Story 4: polarity ---------- */
  const dipoleArrow = (g, a, b, o = {}) => {
    Art.arrow(g, a.x, a.y, b.x, b.y, { color: o.color || C.cyan, w: o.w || 6, p: o.p, head: o.head });
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const q = o.p === undefined ? 1 : o.p;
    if (q > 0.1) {
      const cx = a.x + dx * 0.16, cy = a.y + dy * 0.16;
      g.strokeStyle = o.color || C.cyan; g.lineWidth = o.w ? o.w * 0.75 : 4.5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx + nx * 9, cy + ny * 9); g.lineTo(cx - nx * 9, cy - ny * 9); g.stroke();
    }
  };
  Lab.story('#story-polar', {
    title: 'Adding arrows: carbon dioxide against water',
    scenes: [
      {
        say: 'In a polar bond, the more electronegative atom pulls the electrons closer. We draw that as an arrow pointing toward it. The cross marks the positive end. This is a <b>bond dipole</b>.',
        dur: 3,
        draw(g, p, t, { W }) {
          const y = 190;
          Art.glow(g, 520, y, 170, C.cyan, 0.2);
          Art.bond(g, 280, y, 520, y, { order: 1, width: 8 });
          Art.atom(g, 260, y, 56, 'H', { face: 'sad', t, look: [1, 0] });
          Art.atom(g, 540, y, 78, 'Cl', { face: 'grin', t, look: [-1, 0] });
          Art.electron(g, lerp(400, 470, ease.inOut(seg(p, 0.1, 0.5))), y - 7, 8);
          Art.electron(g, lerp(400, 470, ease.inOut(seg(p, 0.1, 0.5))), y + 7, 8);
          dipoleArrow(g, { x: 270, y: y + 112 }, { x: 530, y: y + 112 }, { p: ease.out(seg(p, 0.4, 0.8)), w: 8, head: 26 });
          Art.text(g, 'δ+', 260, y - 88, { font: 'display', size: 40, color: '#FF7AB8', alpha: seg(p, 0.5, 0.7) });
          Art.text(g, 'δ−', 540, y - 110, { font: 'display', size: 40, color: '#6EC6FF', alpha: seg(p, 0.5, 0.7) });
          Art.text(g, 'points toward the more electronegative atom', W / 2, 372, { size: 26, color: C.cyan, alpha: seg(p, 0.65, 0.85) });
        },
      },
      {
        say: '$\\ce{CO2}$ has two polar bonds. But the molecule is linear, so the arrows pull in <b>exactly opposite</b> directions. It is a tug of war with equal teams: a tie. Add them tip to tail and you end where you started. <b>Nonpolar.</b>',
        dur: 3.6,
        draw(g, p, t) {
          const y = 150, wob = Math.sin(t * 5) * 1.5 * seg(p, 0.1, 0.4);
          Art.bond(g, 240, y, 400, y, { order: 2, width: 8 });
          Art.bond(g, 400, y, 560, y, { order: 2, width: 8 });
          Art.atom(g, 220 - wob, y, 54, 'O', { face: 'grumpy', t, look: [1, 0] });
          Art.atom(g, 400, y, 50, 'C', { face: 'wow', t });
          Art.atom(g, 580 + wob, y, 54, 'O', { face: 'grumpy', t, look: [-1, 0] });
          dipoleArrow(g, { x: 390, y: y - 74 }, { x: 240, y: y - 74 }, { p: ease.out(seg(p, 0.1, 0.35)), color: C.cyan, head: 22 });
          dipoleArrow(g, { x: 410, y: y - 74 }, { x: 560, y: y - 74 }, { p: ease.out(seg(p, 0.1, 0.35)), color: C.sun, head: 22 });
          const q = ease.inOut(seg(p, 0.45, 0.8));
          g.fillStyle = 'rgba(14,6,30,.62)'; Art.round(g, 180, 248, 440, 136, 18); g.fill();
          Art.text(g, 'Tip to tail', 240, 274, { size: 23, color: C.dim });
          const ax = 300, ay = 330;
          dipoleArrow(g, { x: ax, y: ay }, { x: ax + 200, y: ay }, { color: C.sun, head: 20, p: seg(p, 0.42, 0.55) });
          if (q > 0) dipoleArrow(g, { x: ax + 200, y: ay + 14 }, { x: ax, y: ay + 14 }, { color: C.cyan, head: 20, p: q });
          Art.text(g, 'Sum = 0', 400, 412, { font: 'display', size: 40, color: C.leaf, alpha: seg(p, 0.8, 0.95) });
        },
      },
      {
        say: 'Water has polar bonds too, but it is <b>bent</b>. Both arrows point up and inward toward oxygen. Their sideways parts cancel, but their upward parts add. The arrows do not close. <b>Polar.</b>',
        dur: 3.6,
        draw(g, p, t) {
          const ox = 250, oy = 120, hx = 130, hy = 118;
          const H1 = { x: ox - hx, y: oy + hy }, H2 = { x: ox + hx, y: oy + hy };
          Art.bond(g, ox, oy, H1.x, H1.y, { width: 7 }); Art.bond(g, ox, oy, H2.x, H2.y, { width: 7 });
          Art.atom(g, ox, oy, 62, 'O', { face: 'happy', t });
          Art.atom(g, H1.x, H1.y, 42, 'H', { face: 'happy', t, seed: 2 });
          Art.atom(g, H2.x, H2.y, 42, 'H', { face: 'happy', t, seed: 3 });
          const nx = 0.67, ny = 0.74;
          dipoleArrow(g, { x: H1.x + 48 + 20, y: H1.y - 46 + 28 }, { x: ox - 40, y: oy + 62 }, { p: ease.out(seg(p, 0.08, 0.3)), color: C.cyan, head: 20 });
          dipoleArrow(g, { x: H2.x - 48 - 20, y: H2.y - 46 + 28 }, { x: ox + 40, y: oy + 62 }, { p: ease.out(seg(p, 0.08, 0.3)), color: C.sun, head: 20 });
          void nx; void ny;
          const X0 = 560, Y0 = 362, dx = 88, dy = 114;
          const q1 = ease.out(seg(p, 0.32, 0.5)), q2 = ease.out(seg(p, 0.5, 0.68)), q3 = ease.out(seg(p, 0.7, 0.92));
          g.fillStyle = 'rgba(14,6,30,.62)'; Art.round(g, 450, 40, 330, 370, 18); g.fill();
          Art.text(g, 'Tip to tail', 615, 72, { size: 24, color: C.dim });
          dipoleArrow(g, { x: X0, y: Y0 }, { x: X0 + dx, y: Y0 - dy }, { color: C.cyan, p: q1, head: 20 });
          dipoleArrow(g, { x: X0 + dx, y: Y0 - dy }, { x: X0, y: Y0 - 2 * dy }, { color: C.sun, p: q2, head: 20 });
          if (q3 > 0) Art.arrow(g, X0 - 26, Y0, X0 - 26, Y0 - 2 * dy, { color: C.pink, w: 11, head: 28, p: q3 });
          Art.text(g, 'net', X0 - 62, Y0 - dy, { font: 'display', size: 30, color: C.pink, alpha: seg(p, 0.85, 1) });
          Art.text(g, 'Polar', ox, 348, { font: 'display', size: 46, color: C.pink, alpha: seg(p, 0.8, 0.95) });
          Art.text(g, 'O end is negative', ox, 396, { size: 26, color: '#6EC6FF', alpha: seg(p, 0.85, 1) });
        },
      },
      {
        say: 'Same thing in 3D. The four arrows in $\\ce{CCl4}$ close into a loop: <b>nonpolar</b>. Swap one Cl for H in $\\ce{CHCl3}$ and the loop breaks open: <b>polar</b>.',
        dur: 3.6,
        draw(g, p, t) {
          const cams = [camAt(210, 118, 78, t, { spin: 0.25 }), camAt(590, 118, 78, t, { spin: 0.25 })];
          const sets = [['Cl', 'Cl', 'Cl', 'Cl'], ['Cl', 'Cl', 'Cl', 'H']];
          sets.forEach((outs, k) => {
            const dirs = G.tetrahedral;
            const cam = cams[k];
            drawAX(g, { cam, center: 'C', items: outs.map((el, i) => ({ d: dirs[i], el })), t, rc: 28, ro: 24 });
            const d = K.dipole('C', outs, dirs);
            const scale = 120;
            let cx = 0, cy = 0;
            const pts = [[0, 0]];
            d.bonds.forEach((b) => { const r = rot(b.vec, cam.yaw, cam.pitch); cx += r[0]; cy -= r[1]; pts.push([cx, cy]); });
            const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
            const mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
            const ox = cam.cx - mx * scale, oy = 300 - my * scale;
            const colors = [C.cyan, C.sun, C.leaf, C.violet];
            pts.slice(1).forEach((q, i) => {
              const a = pts[i];
              Art.arrow(g, ox + a[0] * scale, oy + a[1] * scale, ox + q[0] * scale, oy + q[1] * scale, { color: colors[i], w: 6, head: 17, p: ease.out(seg(p, 0.15 + i * 0.13, 0.3 + i * 0.13)) });
            });
            const end = pts[pts.length - 1];
            if (Math.hypot(end[0], end[1]) > 0.02) Art.arrow(g, ox, oy, ox + end[0] * scale, oy + end[1] * scale, { color: C.pink, w: 8, head: 22, p: ease.out(seg(p, 0.72, 0.9)) });
            Art.text(g, k ? 'CHCl₃: polar' : 'CCl₄: nonpolar', cam.cx, 424, { font: 'display', size: 34, color: k ? C.pink : C.leaf, alpha: seg(p, 0.8, 0.95) });
          });
        },
      },
    ],
  });

  /* ---------- Bench: dipole vector adder ---------- */
  const POL_IDS = ['CO2', 'H2O', 'BF3', 'NH3', 'CH4', 'CCl4', 'CHCl3', 'SO2', 'HCN', 'CH2O', 'PCl5', 'SF4', 'ClF3', 'XeF2', 'XeF4', 'SF6', 'BrF5'];
  const SWAP = { C: ['H', 'F', 'Cl', 'Br'], N: ['H', 'F', 'Cl'], O: ['H', 'F', 'Cl'], B: ['F', 'Cl', 'Br'], P: ['F', 'Cl', 'Br'] };
  const pol = { id: 'CO2', center: 'C', outers: ['O', 'O'], groups: 2, lp: 0, dirs: K.places(2, 0).bonded, lones: [], yaw: 0.35, pitch: 0.3, drag: null, moved: 0, t0: 0, lastT: 0 };
  function polSet(id) {
    const s = K.get(id), c = K.count(s), pl = K.places(c.groups, c.lp);
    Object.assign(pol, { id, center: s.c, outers: s.o.slice(), groups: c.groups, lp: c.lp, dirs: pl.bonded, lones: pl.lone, custom: false });
    pol.t0 = polStage ? polStage.t : 0;
    paintPol();
  }
  const orderOf = (id, i) => { const s = K.get(id); if (id === 'HCN' && s.o[i] === 'N') return 3; return s.doubles.includes(i) ? 2 : 1; };
  const formulaOf = () => {
    const counts = {};
    pol.outers.forEach((e) => { counts[e] = (counts[e] || 0) + 1; });
    const order = ['H', 'O', 'S', 'N', 'F', 'Cl', 'Br', 'I'];
    return pol.center + Object.keys(counts).sort((a, b) => order.indexOf(a) - order.indexOf(b)).map((e) => e + (counts[e] > 1 ? counts[e] : '')).join('');
  };
  function polCam() { return { cx: 248, cy: 248, s: 150, yaw: pol.yaw + (pol.rock || 0), pitch: pol.pitch }; }
  let polStage = null;
  polStage = Lab.stage('#c-polar', {
    h: 480, label: 'A molecule with an arrow on each bond, and those arrows added tip to tail on the right.',
    onPointer(e) {
      const cam = polCam();
      const hit = pol.dirs.findIndex((d) => { const q = proj(d, cam); return Math.hypot(e.x - q.x, e.y - q.y) < 46; });
      if (e.type === 'hover') { polStage.canvas.style.cursor = hit >= 0 ? 'pointer' : 'grab'; return; }
      if (e.type === 'down') { pol.drag = { x: e.x, y: e.y }; pol.moved = 0; pol.downHit = hit; return; }
      if (e.type === 'move' && pol.drag) {
        pol.yaw += (e.x - pol.drag.x) * 0.012; pol.pitch = clamp(pol.pitch + (e.y - pol.drag.y) * 0.012, -1.3, 1.3);
        pol.moved += Math.abs(e.x - pol.drag.x) + Math.abs(e.y - pol.drag.y);
        pol.drag = { x: e.x, y: e.y };
        return;
      }
      if (e.type === 'up') {
        if (pol.moved < 8 && pol.downHit >= 0) swapAtom(pol.downHit);
        pol.drag = null;
      }
    },
    draw(g, t, dt) {
      pol.rock = Lab.reducedMotion ? 0 : Math.sin(t * 0.5) * 0.3 * (pol.drag ? 0 : 1);
      const cam = polCam();
      const d = K.dipole(pol.center, pol.outers, pol.dirs);
      const age = t - pol.t0;
      const items = pol.dirs.map((dir, i) => ({ d: dir, el: pol.outers[i], order: orderOf(pol.id, i) && pol.outers[i] === K.get(pol.id).o[i] ? orderOf(pol.id, i) : 1 })).concat(pol.lones.map((dir) => ({ d: dir, w: 34 })));
      drawAX(g, { cam, center: pol.center, items, t, rc: 36, ro: 30 });
      const COLORS = [C.cyan, C.sun, C.leaf, C.violet, C.fire, '#FF9FD2'];
      // Bond arrows, beside each bond.
      d.bonds.forEach((b, i) => {
        if (b.size < 0.02) return;
        const inward = b.toward === pol.center;
        const a0 = 0.32, a1 = a0 + Math.min(0.58, 0.18 + b.size * 0.42);
        const from = inward ? a1 : a0, to = inward ? a0 : a1;
        const P0 = proj([b.dir[0] * from, b.dir[1] * from, b.dir[2] * from], cam), P1 = proj([b.dir[0] * to, b.dir[1] * to, b.dir[2] * to], cam);
        const dx = P1.x - P0.x, dy = P1.y - P0.y, L = Math.hypot(dx, dy) || 1;
        if (L < 10) return;
        const nx = -dy / L * 17, ny = dx / L * 17;
        dipoleArrow(g, { x: P0.x + nx, y: P0.y + ny }, { x: P1.x + nx, y: P1.y + ny }, { color: COLORS[i], w: 5, head: 17, p: ease.out(clamp((age - i * 0.1) * 2.2)) });
      });
      // Tip to tail panel.
      g.fillStyle = 'rgba(14,6,30,.66)'; Art.round(g, 506, 14, 282, 452, 18); g.fill();
      Art.text(g, 'Add them tip to tail', 647, 42, { size: 24 });
      const pts = [[0, 0]];
      let cx = 0, cy = 0;
      d.bonds.forEach((b) => { const r = rot(b.vec, cam.yaw, cam.pitch); cx += r[0]; cy -= r[1]; pts.push([cx, cy]); });
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const spanX = Math.max(...xs) - Math.min(...xs), spanY = Math.max(...ys) - Math.min(...ys);
      const scale = Math.min(92, 200 / Math.max(spanX || 1, 0.5), 220 / Math.max(spanY || 1, 0.5));
      const mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
      const ox = 647 - mx * scale, oy = 216 - my * scale;
      const anyBond = d.bonds.some((b) => b.size >= 0.02);
      // When the arrows all lie along one line, nudge them apart so you can see each one.
      const flat = Math.min(spanX, spanY) * scale < 16;
      pts.slice(1).forEach((q, i) => {
        const a = pts[i];
        if (d.bonds[i].size < 0.02) return;
        const dx = q[0] - a[0], dy = q[1] - a[1], L = Math.hypot(dx, dy) || 1;
        const nudge = flat ? (i - (pts.length - 2) / 2) * 13 : 0, nx = (-dy / L) * nudge, ny = (dx / L) * nudge;
        Art.arrow(g, ox + a[0] * scale + nx, oy + a[1] * scale + ny, ox + q[0] * scale + nx, oy + q[1] * scale + ny, { color: COLORS[i], w: 5, head: 16, p: ease.out(clamp((age - 0.35 - i * 0.18) * 3)) });
      });
      const done = clamp((age - 0.5 - pts.length * 0.18) * 2.2);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ox, oy, 6, 0, TAU); g.fill();
      if (d.polar) {
        const e = pts[pts.length - 1];
        Art.arrow(g, ox, oy, ox + e[0] * scale, oy + e[1] * scale, { color: C.pink, w: 9, head: 24, p: ease.out(done) });
        const net = norm(d.net), big = Math.min(1.05, 0.34 + d.size * 0.5);
        const A = proj([0, 0, 0], cam), B = proj([net[0] * big, net[1] * big, net[2] * big], cam);
        if (done > 0.6) Art.arrow(g, A.x, A.y, B.x, B.y, { color: C.pink, w: 10, head: 26, alpha: 0.95 });
      } else if (done > 0) Art.ring(g, ox, oy, 19, { color: C.leaf, w: 4.5, p: ease.out(done) });
      Art.text(g, d.polar ? 'Polar' : 'Nonpolar', 647, 392, { font: 'display', size: 46, color: d.polar ? C.pink : C.leaf, alpha: done });
      Art.text(g, d.polar ? 'The arrows do not close' : anyBond ? 'Back to the start: zero' : 'No polar bonds to add', 647, 438, { size: 22, color: C.dim, alpha: done });
      Art.formula(g, pol.custom ? formulaOf() : pol.id, 20, 44, { size: 44, align: 'left' });
    },
  });
  polStage.canvas.style.touchAction = 'pan-y';
  function swapAtom(i) {
    const list = SWAP[pol.center];
    const cur = pol.outers[i];
    if (!list || !list.includes(cur)) {
      Lab.$('#pol-say').innerHTML = Lab.texString(`<p>Swapping is not offered here: ${cur} bonded to ${pol.center} is a special case. Try a molecule with a center of C, N, O, B or P with single-bonded outer atoms.</p>`);
      return;
    }
    pol.outers[i] = list[(list.indexOf(cur) + 1) % list.length];
    pol.custom = true;
    pol.t0 = polStage.t - 0.3;
    Lab.sound.pop();
    paintPol(true);
  }
  function paintPol(swapped) {
    const d = K.dipole(pol.center, pol.outers, pol.dirs);
    const shape = K.shape(pol.groups, pol.lp);
    Lab.$('#pol-shape').textContent = shape.name;
    Lab.$('#pol-net').textContent = d.size < 0.02 ? '0' : d.size.toFixed(2);
    Lab.$('#pol-verdict').textContent = d.polar ? 'Polar' : 'Nonpolar';
    const s = K.get(pol.id);
    Lab.$('#pol-name').textContent = swapped ? 'Your molecule' : s.name[0].toUpperCase() + s.name.slice(1);
    const en = [...new Set(pol.outers)].map((e) => `${pol.center}-${e}: ${Math.abs(EL[e].en - EL[pol.center].en).toFixed(2)}`).join(', ');
    const note = pol.lp && !d.polar ? ' The lone pairs are balanced too, since they sit on opposite sides.' : '';
    Lab.$('#pol-say').innerHTML = Lab.texString(`<p>Each arrow's length comes from the electronegativity difference (${en}). They are added as real vectors in 3D: the sum has a size of <b>${d.size < 0.02 ? '0' : d.size.toFixed(2)}</b>.${note}</p>`);
  }
  Lab.$('#pol-mol').innerHTML = POL_IDS.map((id, i) => `<button type="button" data-value="${id}" aria-pressed="${i === 0}">${Lab.fHTML(id)}</button>`).join('');
  Lab.segmented('#pol-mol', polSet);
  polSet('CO2');

  /* ---------- Bench: name that shape ---------- */
  const T1 = ['CO2', 'BF3', 'CH4', 'H2O', 'NH3'], T2 = ['SO2', 'H2S', 'BeCl2', 'CCl4', 'NF3', 'SO3', 'NH4^+', 'H3O^+'], T3 = ['PCl5', 'SF6', 'SF4', 'ClF3', 'XeF2', 'XeF4', 'BrF5', 'I3^-', 'CO3^2-', 'NO3^-', 'SO4^2-', 'ClO3^-', 'ICl4^-', 'OF2', 'O3', 'PO4^3-'];
  const game = { round: 0, total: 10, score: 0, list: T1.concat(T2), answered: false, picked: null, correct: null, t0: 0, done: false, choices: [] };
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  function gameStart() {
    game.list = shuffle(T1).slice(0, 3).concat(shuffle(T2).slice(0, 3), shuffle(T3).slice(0, 4));
    game.round = 0; game.score = 0; game.done = false;
    gameRound();
  }
  function gameRound() {
    const id = game.list[game.round], s = K.get(id), c = K.count(s), ans = c.shape.name;
    game.answered = false; game.picked = null; game.t0 = gameStage.t;
    const wrongs = [];
    if (c.shape.eg !== ans) wrongs.push(c.shape.eg);
    const pool = shuffle(K.NAMES.filter((n) => n !== ans && !wrongs.includes(n)));
    game.choices = shuffle([ans].concat(wrongs, pool).slice(0, 4));
    Lab.$('#game-choices').innerHTML = game.choices.map((n) => `<button type="button" class="btn ghost small" data-name="${n}">${n}</button>`).join('');
    Lab.$('#game-say').innerHTML = Lab.texString(`<p>Round ${game.round + 1} of ${game.total}. ${game.round < 3 ? 'Look at the model, then name the shape.' : 'No picture this time: count the electrons in your head.'}</p>`);
    gameStage.redraw();
  }
  function gamePick(name) {
    if (game.answered) return;
    const id = game.list[game.round], s = K.get(id), c = K.count(s), right = c.shape.name;
    game.answered = true; game.picked = name; game.correct = name === right; game.t0 = gameStage.t;
    if (game.correct) { game.score++; Lab.sound.good(); } else Lab.sound.bad();
    Lab.$$('#game-choices button').forEach((b) => { b.disabled = true; if (b.dataset.name === right) { b.classList.remove('ghost'); b.classList.add('sun'); } });
    const next = document.createElement('button');
    next.type = 'button'; next.className = 'btn cyan small'; next.id = 'game-next';
    next.textContent = game.round + 1 < game.total ? 'Next round' : 'See my score';
    Lab.$('#game-choices').appendChild(next);
    next.addEventListener('click', () => {
      game.round++;
      if (game.round < game.total) gameRound(); else gameEnd();
    });
    Lab.$('#game-say').innerHTML = Lab.texString(`<p><b>${game.correct ? 'Yes!' : 'Not quite.'}</b> $${K.tex(id)}$ has ${c.total} valence electrons. Outer atoms keep ${c.outer}, leaving ${c.left} for ${c.lp} lone pair${c.lp === 1 ? '' : 's'} on ${s.c}. That makes ${c.groups} groups, with ${c.lp} lone: <b>${right.toLowerCase()}</b>.</p>`);
  }
  function gameEnd() {
    game.done = true; game.t0 = gameStage.t;
    if (game.score >= 8) { Lab.collection.award(game.score - 6); Lab.confetti(); Lab.sound.fanfare(); }
    Lab.$('#game-choices').innerHTML = '<button type="button" class="btn sun small" id="game-again">Play again</button>';
    Lab.$('#game-again').addEventListener('click', gameStart);
    Lab.$('#game-say').innerHTML = `<p>You got <b>${game.score} of ${game.total}</b>. ${game.score >= 8 ? 'That is exam-ready. New elements discovered.' : 'Score 8 or more to discover new elements. Use the shape explorer above to practice the ones you missed.'}</p>`;
    gameStage.redraw();
  }
  Lab.$('#game-choices').addEventListener('click', (e) => { const b = e.target.closest('[data-name]'); if (b) gamePick(b.dataset.name); });
  const gameStage = Lab.stage('#c-game', {
    h: 420, label: 'A molecule and its 3D shape, for a shape-naming game.',
    draw(g, t, dt, s) {
      if (game.done) {
        Art.text(g, `${game.score} of ${game.total}`, s.W / 2, 150, { font: 'display', size: 96, color: game.score >= 8 ? C.leaf : C.sun });
        Art.text(g, game.score >= 8 ? 'Well done!' : 'Good practice. Go again?', s.W / 2, 250, { size: 36 });
        Art.moe(g, s.W / 2, 410, 130, game.score >= 8 ? 'cheer' : 'think', { t });
        return;
      }
      const id = game.list[game.round], sp = K.get(id), c = K.count(sp), pl = K.places(c.groups, c.lp);
      for (let i = 0; i < game.total; i++) {
        g.fillStyle = i < game.round ? C.leaf : i === game.round ? C.sun : 'rgba(191,178,218,.25)';
        g.beginPath(); g.arc(s.W - 192 + i * 19, 28, 6.5, 0, TAU); g.fill();
      }
      Art.formula(g, id, 28, 44, { size: 56, align: 'left' });
      Art.text(g, `Score: ${game.score}`, s.W - 110, 62, { size: 26, color: C.sun });
      const show = game.answered || game.round < 3;
      if (show) {
        const cam = { cx: s.W / 2, cy: 238, s: 138, yaw: 0.4 + Math.sin(t * 0.6) * 0.32, pitch: 0.28 };
        const q = ease.back(clamp((t - game.t0) * 2.4));
        cam.s *= 0.6 + 0.4 * q;
        const items = pl.bonded.map((d, i) => ({ d, el: sp.o[i], order: orderOf(id, i) }));
        if (game.answered) pl.lone.forEach((d) => items.push({ d, w: 32 }));
        drawAX(g, { cam, center: sp.c, items, t, rc: 34, ro: 28 });
        if (game.answered) {
          Art.text(g, c.shape.name, s.W / 2, 392, { font: 'display', size: 36, color: game.correct ? C.leaf : C.pink, halo: true });
          Art.moe(g, 90, 410, 100, game.correct ? 'cheer' : 'oops', { t });
        }
      } else {
        Art.text(g, '?', s.W / 2, 220, { font: 'display', size: 170, color: Art.alpha(C.sun, 0.9 + Math.sin(t * 3) * 0.1) });
        Art.text(g, 'Count the electrons in your head', s.W / 2, 356, { size: 28, color: C.dim });
        Art.moe(g, 660, 410, 120, 'think', { t, flip: true });
      }
    },
  });
  gameStart();
});
