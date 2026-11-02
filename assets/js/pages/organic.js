/* Lesson 18: A first look at organic chemistry. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const fm = (g, f, x, y, o = {}) => {
    const a = o.alpha === undefined ? 1 : o.alpha;
    if (a <= 0) return;
    const p = g.globalAlpha; g.globalAlpha = p * a; Art.formula(g, f, x, y, o); g.globalAlpha = p;
  };

  /* ---------- Real 3D geometry, built from bond lengths and angles ---------- */
  const A3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const S3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const M3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const CR = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const DOT = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const U3 = (a) => M3(a, 1 / Math.hypot(a[0], a[1], a[2]));
  const rad = (d) => (d * Math.PI) / 180;
  /** Place atom D so it sits r from C, makes an angle B-C-D, and a dihedral A-B-C-D. */
  function place(A, B, Cc, r, ang, dih) {
    const bc = U3(S3(Cc, B));
    const n = U3(CR(S3(B, A), bc));
    const m = CR(n, bc);
    const a = rad(ang), d = rad(dih);
    const x = -r * Math.cos(a), y = r * Math.sin(a) * Math.cos(d), z = r * Math.sin(a) * Math.sin(d);
    return A3(Cc, A3(M3(bc, x), A3(M3(m, y), M3(n, z))));
  }
  const SCALE = 1.25; // Stage units per angstrom.
  /** rows: [element, bondedTo, length, angleAtom, angle, dihedralAtom, dihedral, bondOrder]. Lengths in angstroms. */
  function build(rows, extra = {}) {
    const pos = [];
    const bonds = [];
    rows.forEach((row, i) => {
      const [, a, r, b, ang, c, dih, order = 1] = row;
      if (i === 0) pos.push([0, 0, 0]);
      else if (i === 1) pos.push([r, 0, 0]);
      else if (c === undefined || c === null) pos.push(place(A3(pos[b], [0, 1, 0]), pos[b], pos[a], r, ang, 0));
      else pos.push(place(pos[c], pos[b], pos[a], r, ang, dih));
      if (i > 0) bonds.push([a, i, order]);
    });
    const mean = M3(pos.reduce(A3, [0, 0, 0]), 1 / pos.length);
    return Object.assign({
      atoms: rows.map((row, i) => ({ el: row[0], p: M3(S3(pos[i], mean), SCALE) })),
      bonds,
    }, extra);
  }
  /** Three hydrogens on a methyl carbon, staggered. */
  const methylH = (c, nb, ref, start = 180, len = 1.09, ang = 109.5) => [start, start - 120, start + 120].map((d) => ['H', c, len, nb, ang, ref, d]);
  /** Two lone-pair directions on an atom with two bonded neighbors. */
  function lonePairs(mol, at, n1, n2) {
    const P = mol.atoms[at].p;
    const a = U3(S3(mol.atoms[n1].p, P)), b = U3(S3(mol.atoms[n2].p, P));
    const bis = M3(U3(A3(a, b)), -1), nrm = U3(CR(a, b));
    const k = rad(54.75);
    return [A3(M3(bis, Math.cos(k)), M3(nrm, Math.sin(k))), A3(M3(bis, Math.cos(k)), M3(nrm, -Math.sin(k)))].map((dir) => ({ at, dir }));
  }
  const t3 = 1 / Math.sqrt(3);
  const MOL = {
    methane: {
      atoms: [{ el: 'C', p: [0, 0, 0] }].concat([[t3, t3, t3], [t3, -t3, -t3], [-t3, t3, -t3], [-t3, -t3, t3]].map((v) => ({ el: 'H', p: M3(v, 1.09 * SCALE) }))),
      bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]],
    },
    flat: {
      atoms: [{ el: 'C', p: [0, 0, 0] }].concat([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]].map((v) => ({ el: 'H', p: M3(v, 1.09 * SCALE) }))),
      bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]],
    },
    ethane: build([['C'], ['C', 0, 1.54], ['H', 1, 1.09, 0, 109.5], ['H', 1, 1.09, 0, 109.5, 2, 120], ['H', 1, 1.09, 0, 109.5, 2, -120],
      ['H', 0, 1.09, 1, 109.5, 2, 180], ['H', 0, 1.09, 1, 109.5, 2, 60], ['H', 0, 1.09, 1, 109.5, 2, -60]]),
    ethene: build([['C'], ['C', 0, 1.34, null, null, null, null, 2], ['H', 1, 1.09, 0, 121.3], ['H', 1, 1.09, 0, 121.3, 2, 180],
      ['H', 0, 1.09, 1, 121.3, 2, 0], ['H', 0, 1.09, 1, 121.3, 2, 180]]),
    // Ethyne is a straight line, so its atoms are placed directly.
    ethyne: {
      atoms: [{ el: 'C', p: [-0.6 * SCALE, 0, 0] }, { el: 'C', p: [0.6 * SCALE, 0, 0] }, { el: 'H', p: [-(0.6 + 1.06) * SCALE, 0, 0] }, { el: 'H', p: [(0.6 + 1.06) * SCALE, 0, 0] }],
      bonds: [[0, 1, 3], [0, 2, 1], [1, 3, 1]],
    },
    ethanol: build([['C'], ['C', 0, 1.52], ['O', 0, 1.43, 1, 109.5], ['H', 2, 0.96, 0, 108.5, 1, 180],
      ['H', 0, 1.09, 1, 109.5, 2, 120], ['H', 0, 1.09, 1, 109.5, 2, -120], ...methylH(1, 0, 2)]),
    ether: build([['O'], ['C', 0, 1.41], ['C', 0, 1.41, 1, 111.7], ...methylH(1, 0, 2), ...methylH(2, 0, 1)]),
    aldehyde: build([['C'], ['C', 0, 1.5], ['O', 0, 1.21, 1, 124, null, null, 2], ['H', 0, 1.11, 1, 115, 2, 180], ...methylH(1, 0, 2, 0, 1.09, 110)]),
    ketone: build([['C'], ['C', 0, 1.52], ['O', 0, 1.21, 1, 121.5, null, null, 2], ['C', 0, 1.52, 1, 117, 2, 180], ...methylH(1, 0, 2, 0, 1.09, 110), ...methylH(3, 0, 2, 0, 1.09, 110)]),
    acid: build([['C'], ['C', 0, 1.5], ['O', 0, 1.21, 1, 126, null, null, 2], ['O', 0, 1.35, 1, 111, 2, 180], ['H', 3, 0.97, 0, 106, 1, 180], ...methylH(1, 0, 2, 0, 1.09, 110)]),
    ester: build([['C'], ['C', 0, 1.5], ['O', 0, 1.21, 1, 126, null, null, 2], ['O', 0, 1.35, 1, 111, 2, 180], ['C', 3, 1.44, 0, 116, 1, 180], ...methylH(1, 0, 2, 0, 1.09, 110), ...methylH(4, 3, 0)]),
    amine: build([['C'], ['N', 0, 1.47], ['H', 0, 1.09, 1, 109.5], ['H', 0, 1.09, 1, 109.5, 2, 120], ['H', 0, 1.09, 1, 109.5, 2, -120], ['H', 1, 1.01, 0, 110, 2, 60], ['H', 1, 1.01, 0, 110, 2, -60]]),
    butane: build([['C'], ['C', 0, 1.54], ['C', 1, 1.54, 0, 112], ['C', 2, 1.54, 1, 112, 0, 180],
      ...methylH(0, 1, 2, 180, 1.09, 110), ['H', 1, 1.09, 0, 109, 2, 120], ['H', 1, 1.09, 0, 109, 2, -120], ['H', 2, 1.09, 3, 109, 1, 120], ['H', 2, 1.09, 3, 109, 1, -120], ...methylH(3, 2, 1, 180, 1.09, 110)]),
    isobutane: build([['C'], ['C', 0, 1.53], ['C', 0, 1.53, 1, 110.8], ['C', 0, 1.53, 1, 110.8, 2, 120], ['H', 0, 1.1, 1, 108, 2, -120],
      ...methylH(1, 0, 2, 180, 1.09, 110), ...methylH(2, 0, 1, 180, 1.09, 110), ...methylH(3, 0, 1, 180, 1.09, 110)]),
  };
  MOL.ethanol.lonePairs = lonePairs(MOL.ethanol, 2, 0, 3);
  if (Lab.isAuto) window.__orgMols = MOL;
  const mid = (mol, i, j, off = [0, 0, 0]) => A3(M3(A3(mol.atoms[i].p, mol.atoms[j].p), 0.5), off);
  const between = (mol, center, i, j, k = 0.62) => A3(mol.atoms[center].p, M3(S3(M3(A3(mol.atoms[i].p, mol.atoms[j].p), 0.5), mol.atoms[center].p), k));

  /* ---------- Bench: five molecules in 3D ---------- */
  const INFO = {
    methane: { f: 'CH₄', fam: 'Alkane', geom: 'Tetrahedral, sp³', bond: 'None, only one C', twist: null, act: 'Show the flat drawing',
      note: 'Each H-C-H angle is <b>109.5°</b>. That is the farthest apart four bonds can get in 3D, so the electron pairs stay as far from each other as they can.' },
    ethane: { f: 'C₂H₆', fam: 'Alkane', geom: 'Tetrahedral, sp³', bond: 'Single, 154 pm', twist: 'free', act: 'Twist the C-C bond', moving: [2, 3, 4], axis: [0, 1],
      note: 'Each carbon is tetrahedral, at about <b>109.5°</b>. The <b>single bond</b> lets each end spin. Press the button and watch one end turn.' },
    ethene: { f: 'C₂H₄', fam: 'Alkene', geom: 'Trigonal planar, sp²', bond: 'Double, 134 pm', twist: 'locked', act: 'Try to twist the C=C bond', moving: [2, 3], axis: [0, 1],
      note: 'All six atoms lie in <b>one plane</b>, with angles of about <b>120°</b>. The double bond is shorter and stronger than a single bond, and its pi bond locks the molecule flat.' },
    ethyne: { f: 'C₂H₂', fam: 'Alkyne', geom: 'Linear, sp', bond: 'Triple, 120 pm', twist: 'line', act: 'Try to twist the C≡C bond', moving: [3], axis: [0, 1],
      note: 'All four atoms lie in a straight line at <b>180°</b>. This triple bond is the shortest and strongest of the three carbon-carbon bonds.' },
    ethanol: { f: 'C₂H₅OH', fam: 'Alcohol', geom: 'Tetrahedral, sp³', bond: 'Single, 153 pm', twist: 'free', act: 'Twist the C-C bond', moving: [6, 7, 8], axis: [0, 1],
      note: 'Ethanol is ethane with one H swapped for an <b>OH group</b>. The gold lobes are the two lone pairs on oxygen. They bend the C-O-H angle to about <b>109°</b>, as in water.' },
  };
  const LABELS = {
    methane: (m) => [{ p: between(m, 0, 1, 2, 1.25), text: '109.5°' }],
    ethane: (m) => [{ p: between(m, 0, 5, 6, 1), text: '109.5°' }, { p: mid(m, 0, 1, [0, -0.5, 0]), text: 'C-C 154 pm' }],
    ethene: (m) => [{ p: between(m, 0, 4, 5, 1.05), text: '≈120°' }, { p: mid(m, 0, 1, [0, 1.1, 0]), text: 'C=C 134 pm' }],
    ethyne: (m) => [{ p: A3(m.atoms[3].p, [-0.5, 0.65, 0]), text: '180°' }, { p: mid(m, 0, 1, [0, 0.65, 0]), text: 'C≡C 120 pm' }],
    ethanol: (m) => [{ p: between(m, 2, 0, 3, 1.5), text: '≈109°' }, { p: A3(m.atoms[2].p, [0.75, -0.75, 0]), text: 'OH group' }],
  };
  /** A curved marker for a bond angle, drawn in the same space as the model. */
  function angleArc(v, center, p1, p2, radius = 0.72) {
    const T = window.THREE;
    const u = U3(S3(p1, center)), w = U3(S3(p2, center));
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const q = i / 18;
      const d = U3(A3(M3(u, 1 - q), M3(w, q)));
      pts.push(new T.Vector3(center[0] + d[0] * radius, center[1] + d[1] * radius, center[2] + d[2] * radius));
    }
    const mat = v.atomMaterial('#FFD23F', {});
    mat.emissive = new T.Color('#C99A10');
    v.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, 0.035, 8, false), mat));
  }
  const ARCS = { methane: [0, 1, 2], ethane: [0, 5, 6], ethene: [0, 4, 5], ethanol: [2, 0, 3] };
  const DIST = { methane: 6, ethane: 6.8, ethene: 6.4, ethyne: 6.8, ethanol: 9 };
  let mv = null, molNow = 'methane', flatOn = false, twistOn = false;
  if (window.Chem3D) {
    mv = Chem3D.viewer('#v-mol', { height: 460, distance: 7.2, label: 'A rotatable 3D ball-and-stick model of the chosen small organic molecule, with bond angles labeled.' });
  }
  /** Move some atoms and their bonds into a group that can spin around the carbon-carbon axis. */
  function makePivot(spec, ids, axisA) {
    if (!mv || !mv.ok) return null;
    const T = window.THREE;
    const g = mv.root.children[0];
    const n = spec.atoms.length;
    const movers = [];
    ids.forEach((i) => movers.push(g.children[i]));
    let idx = n;
    spec.bonds.forEach(([i, j, order = 1]) => {
      if (ids.includes(i) || ids.includes(j)) for (let k = 0; k < order; k++) movers.push(g.children[idx + k]);
      idx += order;
    });
    const pivot = new T.Group();
    const A = spec.atoms[axisA].p;
    pivot.position.set(A[0], A[1], A[2]);
    g.add(pivot);
    movers.forEach((mesh) => { mesh.position.sub(pivot.position); pivot.add(mesh); });
    return pivot;
  }
  function paintMol() {
    const I = INFO[molNow];
    Lab.$('#mol-f').textContent = flatOn ? 'CH₄, drawn flat' : I.f;
    Lab.$('#mol-fam').textContent = I.fam;
    Lab.$('#mol-geom').textContent = I.geom;
    Lab.$('#mol-bond').textContent = I.bond;
    const act = Lab.$('#mol-act');
    act.textContent = molNow === 'methane' ? (flatOn ? 'Show the real shape' : I.act) : twistOn ? 'Stop twisting' : I.act;
    let note = I.note;
    if (flatOn) note = 'This is how methane gets <b>drawn</b> on paper, and it is <b>not real</b>. It would squeeze the bonds to 90°. Turn it and see that it is a flat plate. The real molecule keeps its bonds farther apart, at 109.5°.';
    else if (twistOn && I.twist === 'locked') note = '<b>It will not go.</b> Twisting would pull apart the side-by-side overlap of the pi bond, and that costs far too much energy at room temperature. So it just wobbles and springs back.';
    else if (twistOn && I.twist === 'line') note = 'Every atom sits right on the axis, so turning shows no change at all. Twisting has no meaning for a straight line.';
    else if (twistOn && I.twist === 'free') note = 'One end turns while the other stays put. The bond is still there the whole time, since a sigma bond keeps its overlap as it turns. At room temperature, this happens constantly.';
    Lab.$('#mol-note').innerHTML = Lab.texString(`<p>${note}</p><p>Bond lengths and angles are real values, drawn to scale. The balls are drawn small so that you can see the sticks.</p>`);
  }
  function showMol() {
    if (!mv) { paintMol(); return; }
    const key = flatOn ? 'flat' : molNow;
    const spec = MOL[key];
    mv.molecule(spec);
    if (flatOn) mv.labels([{ p: between(spec, 0, 1, 3, 0.86), text: '90°: not real' }]);
    else mv.labels(LABELS[molNow](spec));
    const I = INFO[molNow];
    if (twistOn && I.moving && mv.ok) {
      const pivot = makePivot(spec, I.moving, I.axis[0]);
      const axisDir = U3(S3(spec.atoms[I.axis[1]].p, spec.atoms[I.axis[0]].p));
      if (pivot) {
        pivot.quaternion.identity();
        const ax = new window.THREE.Vector3(axisDir[0], axisDir[1], axisDir[2]);
        let ang = 0;
        mv.animate((dt, t) => {
          if (I.twist === 'locked') ang = Math.sin(t * 7) * 0.12;
          else if (I.twist === 'line') ang += dt * 2;
          else ang += dt * 1.6;
          pivot.quaternion.setFromAxisAngle(ax, ang);
        });
      }
    }
    if (mv.ok) {
      mv.rotateTo(0.3, molNow === 'ethene' || molNow === 'ethyne' ? -0.25 : -0.5);
      mv.setDistance(flatOn ? 6.6 : DIST[molNow]);
      const arc = flatOn ? null : ARCS[molNow];
      if (arc) angleArc(mv, spec.atoms[arc[0]].p, spec.atoms[arc[1]].p, spec.atoms[arc[2]].p);
    }
    paintMol();
  }
  Lab.segmented('#mol-pick', (v) => { molNow = v; flatOn = false; twistOn = false; showMol(); });
  Lab.$('#mol-act').addEventListener('click', () => {
    if (molNow === 'methane') flatOn = !flatOn; else twistOn = !twistOn;
    Lab.sound.pop();
    showMol();
  });
  showMol();

  /* ---------- Story 1: carbon's four bonds ---------- */
  function electronPair(g, x1, y1, x2, y2, t, a = 1) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L, w = wander(x1 * 0.01 + y1 * 0.03, t) * 3;
    const p = g.globalAlpha; g.globalAlpha = p * a;
    Art.electron(g, mx + ux * (10 + w), my + uy * (10 + w), 7);
    Art.electron(g, mx - ux * (10 + w), my - uy * (10 + w), 7);
    g.globalAlpha = p;
  }
  Lab.story('#story-carbon', {
    title: 'What carbon does',
    scenes: [
      {
        say: 'Carbon has <b>4 valence electrons</b>. It wants 8, so it shares with 4 partners. That gives it exactly <b>four bonds</b>, and no other number is common.',
        dur: 3.6,
        draw(g, p, t) {
          const cx = 240, cy = 225, R = 150;
          const a = ease.out(seg(p, 0, 0.3));
          Art.popIn(g, cx, cy, a, (gg) => Art.atom(gg, 0, 0, 84, 'C', { face: 'happy', t, look: [0.6, 0], seed: 2 }));
          g.strokeStyle = 'rgba(247,242,255,.3)'; g.lineWidth = 3; g.setLineDash([8, 9]);
          g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke(); g.setLineDash([]);
          for (let i = 0; i < 4; i++) {
            const q = ease.back(seg(p, 0.18 + i * 0.1, 0.34 + i * 0.1));
            if (q <= 0) continue;
            const ang = -Math.PI / 2 + (i * Math.PI) / 2 + Math.sin(t * 0.6) * 0.05;
            const x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R;
            Art.electron(g, x, y, 13 * q);
            // An empty seat next to each electron, waiting for a partner.
            const b = seg(p, 0.65, 0.85);
            if (b > 0) {
              const x2 = cx + Math.cos(ang + 0.22) * R, y2 = cy + Math.sin(ang + 0.22) * R;
              g.save(); g.globalAlpha *= b; g.strokeStyle = C.sun; g.lineWidth = 3; g.setLineDash([4, 5]);
              g.beginPath(); g.arc(x2, y2, 12, 0, TAU); g.stroke(); g.restore();
            }
          }
          Art.text(g, '4 valence electrons', 590, 96, { font: 'display', size: 36, color: C.cyan, alpha: seg(p, 0.45, 0.65) });
          Art.text(g, '4 empty seats', 590, 158, { font: 'display', size: 36, color: C.sun, alpha: seg(p, 0.65, 0.85) });
          Art.text(g, '4 bonds', 590, 232, { font: 'display', size: 62, color: C.pink, alpha: seg(p, 0.8, 0.98) });
          Art.moe(g, 640, 430, 150, 'point', { t, flip: true });
        },
      },
      {
        say: 'Give each seat a hydrogen and you get <b>methane</b>, $\\ce{CH4}$. Each bond is one shared pair of electrons. Now every atom is happy.',
        dur: 3.6,
        draw(g, p, t) {
          const cx = 270, cy = 225, d = 158;
          const qs = [0, 1, 2, 3].map((i) => ease.out(seg(p, 0.06 + i * 0.15, 0.24 + i * 0.15)));
          const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
          dirs.forEach(([dx, dy], i) => {
            const q = qs[i];
            if (q <= 0) return;
            const hx = cx + dx * lerp(330, d, q), hy = cy + dy * lerp(330, d, q);
            if (q > 0.97) { Art.bond(g, cx, cy, cx + dx * d, cy + dy * d, { width: 7 }); electronPair(g, cx + dx * 58, cy + dy * 58, cx + dx * (d - 36), cy + dy * (d - 36), t); }
            Art.atom(g, hx, hy, 38, 'H', { face: q > 0.97 ? 'happy' : 'wow', t, look: [-dx, -dy], seed: i });
          });
          const allIn = qs[3] > 0.97;
          Art.atom(g, cx, cy, 58, 'C', { face: allIn ? 'grin' : 'wow', t, look: [0.5, 0], seed: 4 });
          fm(g, 'CH4', 610, 130, { size: 74, colorize: true, alpha: seg(p, 0.7, 0.88) });
          Art.text(g, 'methane', 610, 200, { font: 'display', size: 38, alpha: seg(p, 0.72, 0.9) });
          Art.text(g, 'natural gas', 610, 246, { size: 28, color: C.dim, alpha: seg(p, 0.78, 0.95) });
          Art.text(g, 'flat for now', 610, 352, { size: 25, color: C.sun, alpha: seg(p, 0.85, 1) });
          Art.text(g, 'see the real shape below', 610, 386, { size: 23, color: C.dim, alpha: seg(p, 0.85, 1) });
        },
      },
      {
        say: 'Here is carbon\'s superpower: it bonds to <b>other carbons</b>, as many as it likes. Those bonds are strong, so it can build long chains, branches and rings.',
        dur: 3.8,
        draw(g, p, t) {
          const r = 25, bw = 8;
          const net = (pts, edges, a) => {
            if (a <= 0) return;
            const q = g.globalAlpha; g.globalAlpha = q * a;
            edges.forEach(([i, j]) => Art.bond(g, pts[i][0], pts[i][1], pts[j][0], pts[j][1], { width: bw }));
            pts.forEach((P, i) => Art.atom(g, P[0] + wander(i * 5, t) * 1.3, P[1] + wander(i * 3 + 2, t) * 1.3, r, 'C', {}));
            g.globalAlpha = q;
          };
          const a1 = ease.out(seg(p, 0.05, 0.32)), a2 = ease.out(seg(p, 0.35, 0.6)), a3 = ease.out(seg(p, 0.62, 0.86));
          // Chain.
          const ch = [0, 1, 2, 3, 4].map((i) => [48 + i * 47, 200 + (i % 2 ? -28 : 28)]);
          net(ch, [[0, 1], [1, 2], [2, 3], [3, 4]], a1);
          Art.text(g, 'chain', 142, 310, { font: 'display', size: 36, color: C.cyan, alpha: a1 });
          // Branch.
          const br = [[318, 228], [370, 172], [436, 172], [488, 228], [403, 104]];
          net(br, [[0, 1], [1, 2], [2, 3], [1, 4]], a2);
          Art.text(g, 'branch', 403, 310, { font: 'display', size: 36, color: C.sun, alpha: a2 });
          // Ring.
          const ring = [0, 1, 2, 3, 4, 5].map((i) => { const ang = -Math.PI / 2 + (i * TAU) / 6; return [666 + Math.cos(ang) * 76, 180 + Math.sin(ang) * 76]; });
          net(ring, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]], a3);
          Art.text(g, 'ring', 666, 310, { font: 'display', size: 36, color: C.pink, alpha: a3 });
          Art.text(g, 'Hydrogens hidden so you can see the skeleton', 400, 392, { size: 25, color: C.dim, alpha: seg(p, 0.7, 0.95) });
        },
      },
      {
        say: 'Two carbons can share 1, 2 or 3 pairs. Every extra pair takes the place of hydrogens, since each carbon still has exactly <b>4 bonds</b>. All single bonds is <b>saturated</b>. A double or triple bond is <b>unsaturated</b>.',
        dur: 4.2,
        draw(g, p, t) {
          const cols = [
            { x: 136, f: 'C2H6', m: 'C2H6', name: 'ethane', tag: 'single', fam: 'alkane', col: C.cyan },
            { x: 400, f: 'C2H4', m: 'C2H4', name: 'ethene', tag: 'double', fam: 'alkene', col: C.sun },
            { x: 664, f: 'C2H2', m: 'C2H2', name: 'ethyne', tag: 'triple', fam: 'alkyne', col: C.pink },
          ];
          cols.forEach((c, i) => {
            const a = ease.out(seg(p, 0.05 + i * 0.22, 0.28 + i * 0.22));
            if (a <= 0) return;
            Art.text(g, c.name, c.x, 46, { font: 'display', size: 36, color: c.col, alpha: a });
            fm(g, c.f, c.x, 92, { size: 32, color: C.ink, alpha: a });
            Art.popIn(g, c.x, 214, a, (gg) => {
              Art.molecule(gg, 0, 0, i === 0 ? 62 : 72, c.m, { t });
            });
            Art.pill(g, c.tag + ' bond', c.x, 330, { size: 25, color: c.col, alpha: a });
          });
          const a = seg(p, 0.78, 0.95);
          Art.text(g, 'saturated', 136, 392, { font: 'display', size: 30, color: C.leaf, alpha: a });
          g.save(); g.globalAlpha *= a; g.strokeStyle = C.fire; g.lineWidth = 4; g.lineCap = 'round';
          g.beginPath(); g.moveTo(290, 372); g.lineTo(290, 380); g.lineTo(775, 380); g.lineTo(775, 372); g.stroke(); g.restore();
          Art.text(g, 'unsaturated: fewer hydrogens', 532, 412, { font: 'display', size: 28, color: C.fire, alpha: a });
          void t;
        },
      },
      {
        say: 'Swap one hydrogen for a small cluster of other atoms, called a <b>functional group</b>, and the molecule changes. Ethane is a gas. Add an OH, and you have ethanol, a liquid at room temperature.',
        dur: 4.2,
        draw(g, p, t) {
          const y = 196, c1 = 200, c2 = 340, d = 104;
          const off = ease.inOut(seg(p, 0.15, 0.45)), on = ease.inOut(seg(p, 0.4, 0.72));
          // Ethane's frame.
          [[c1, y - d], [c1, y + d], [c2, y - d], [c2, y + d], [c1 - d, y]].forEach(([x, Y], i) => {
            const cx = i < 2 || i === 4 ? c1 : c2;
            Art.bond(g, cx, y, x, Y, { width: 7 });
            Art.atom(g, x, Y, 28, 'H', { face: 'happy', t, seed: i });
          });
          Art.bond(g, c1, y, c2, y, { width: 7 });
          // The leaving hydrogen.
          const hx = lerp(c2 + d, 720, off), hy = lerp(y, 40, off);
          if (off < 1) Art.bond(g, c2, y, lerp(c2 + d, c2 + 40, off), y, { width: 7 });
          Art.atom(g, hx, hy, 28, 'H', { face: 'wow', t, alpha: 1 - seg(p, 0.42, 0.5) });
          // The incoming OH.
          const ox = c2 + 118, hhx = ox + 96;
          if (on > 0) {
            const dy = lerp(-250, 0, on);
            if (on > 0.97) {
              Art.bond(g, c2, y, ox, y, { width: 7 });
              Art.bond(g, ox, y, hhx, y + 56, { width: 7 });
            }
            Art.atom(g, hhx, y + 56 + dy, 28, 'H', { face: 'happy', t, seed: 9 });
            Art.atom(g, ox, y + dy, 40, 'O', { face: on > 0.97 ? 'grin' : 'wow', t, look: [-1, 0], seed: 6 });
            if (on > 0.97) {
              const w = seg(p, 0.72, 0.88);
              Art.ring(g, ox + 44, y + 24, 92, { color: C.sun, w: 5, p: w });
              Art.text(g, 'functional group', 690, 96, { font: 'display', size: 26, color: C.sun, alpha: w, halo: true });
            }
          }
          Art.atom(g, c1, y, 40, 'C', { face: 'happy', t, look: [0.4, 0], seed: 1 });
          Art.atom(g, c2, y, 40, 'C', { face: 'happy', t, look: [0.4, 0], seed: 2 });
          const after = p > 0.55;
          Art.text(g, after ? 'ethanol' : 'ethane', 150, 376, { font: 'display', size: 40, color: after ? C.pink : C.cyan });
          fm(g, after ? 'C2H5OH' : 'C2H6', 150, 418, { size: 32 });
          Art.text(g, after ? 'boils at 78 °C' : 'boils at −89 °C', 560, 376, { font: 'display', size: 36, color: after ? C.leaf : C.dim });
          Art.text(g, after ? 'liquid at room temperature' : 'gas at room temperature', 560, 416, { size: 27 });
        },
      },
      {
        say: 'Hydrocarbons store a lot of energy, which is why they fuel the world. Burn one completely and every carbon ends up in $\\ce{CO2}$ and every hydrogen in $\\ce{H2O}$. The <b>combustion lesson</b> covers this in depth.',
        dur: 4,
        draw(g, p, t) {
          const y = 140;
          const a = ease.out(seg(p, 0, 0.28)), b = ease.out(seg(p, 0.42, 0.72));
          Art.popIn(g, 110, y, a, (gg) => Art.molecule(gg, 0, 0, 56, 'CH4', { t }));
          Art.text(g, '+', 214, y, { font: 'display', size: 44, alpha: a });
          Art.popIn(g, 302, y - 46, a, (gg) => Art.molecule(gg, 0, 0, 58, 'O2', { t }));
          Art.popIn(g, 302, y + 46, a, (gg) => Art.molecule(gg, 0, 0, 58, 'O2', { t }));
          Art.arrow(g, 390, y, 462, y, { color: C.ink, w: 7, head: 20, p: seg(p, 0.3, 0.45) });
          Art.popIn(g, 548, y, b, (gg) => Art.molecule(gg, 0, 0, 44, 'CO2', { t }));
          Art.text(g, '+', 636, y, { font: 'display', size: 44, alpha: b });
          Art.popIn(g, 716, y - 56, b, (gg) => Art.molecule(gg, 0, 0, 52, 'H2O', { t }));
          Art.popIn(g, 716, y + 44, b, (gg) => Art.molecule(gg, 0, 0, 52, 'H2O', { t }));
          fm(g, 'CH4 + 2O2 -> CO2 + 2H2O', 400, 290, { size: 40, colorize: true, alpha: seg(p, 0.65, 0.85) });
          Art.text(g, '−890 kJ per mole of methane', 400, 344, { font: 'display', size: 30, color: C.fire, alpha: seg(p, 0.75, 0.92) });
          Art.flame(g, 76, 436, 72, t, { kind: 'blue' });
          Art.flame(g, 724, 436, 72, t, { kind: 'blue' });
          Art.text(g, 'Balance carbon, then hydrogen, then oxygen', 400, 402, { size: 26, alpha: seg(p, 0.82, 1) });
        },
      },
    ],
  });

  /* ---------- Bench: chain builder ---------- */
  const PRE = ['meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct'];
  const ALK = [
    { bp: -162, heat: 890, use: 'Natural gas' }, { bp: -89, heat: 1560, use: 'Natural gas' }, { bp: -42, heat: 2220, use: 'Grills, LPG' }, { bp: -1, heat: 2880, use: 'Lighters' },
    { bp: 36, heat: 3510, use: 'Gasoline' }, { bp: 69, heat: 4160, use: 'Gasoline, solvents' }, { bp: 98, heat: 4820, use: 'Gasoline' }, { bp: 126, heat: 5470, use: 'Gasoline' },
  ];
  const chain = { n: 4, fam: 'ane', t0: 0, prevN: 4 };
  const hCount = (n, fam) => (fam === 'ane' ? 2 * n + 2 : fam === 'ene' ? 2 * n : 2 * n - 2);
  const chainValid = () => chain.fam === 'ane' || chain.n >= 2;
  const chainName = () => (chain.n >= 4 && chain.fam !== 'ane' ? '1-' : '') + PRE[chain.n - 1] + chain.fam;
  const fC = (n) => (n === 1 ? 'C' : 'C' + n);
  const chainF = () => `${fC(chain.n)}H${hCount(chain.n, chain.fam)}`;
  /** Atoms and bonds for a flat drawing: any carbon's bonds add up to 4. */
  function layoutChain(n, fam, s) {
    const carbons = [], hs = [], bonds = [];
    const x0 = 400 - ((n - 1) * s) / 2, y0 = 158;
    for (let i = 0; i < n; i++) carbons.push({ x: x0 + i * s, y: y0, i });
    const orderBetween = (i) => (i === 0 ? (fam === 'ene' ? 2 : fam === 'yne' ? 3 : 1) : 1);
    for (let i = 0; i < n - 1; i++) bonds.push({ a: carbons[i], b: carbons[i + 1], order: orderBetween(i) });
    for (let i = 0; i < n; i++) {
      let used = 0;
      if (i > 0) used += orderBetween(i - 1);
      if (i < n - 1) used += orderBetween(i);
      let h = 4 - used;
      const c = carbons[i];
      const add = (dx, dy) => { const H = { x: c.x + dx, y: c.y + dy, i }; hs.push(H); bonds.push({ a: c, b: H, order: 1 }); h--; };
      const L = s * 0.95;
      if (n === 1) { add(0, -L); add(0, L); add(-L, 0); add(L, 0); continue; }
      const leftEnd = i === 0, rightEnd = i === n - 1;
      if (h >= 3) add(leftEnd ? -L : L, 0);
      if (h === 1 && (leftEnd || rightEnd)) { add(leftEnd ? -L : L, 0); continue; }
      if (h >= 1) add(0, -L);
      if (h >= 1) add(0, L);
    }
    return { carbons, hs, bonds };
  }
  const chainStage = Lab.stage('#c-chain', {
    label: 'A flat drawing of the chosen hydrocarbon, with its name, its formula and a boiling point scale.',
    draw(g, t) {
      const n = chain.n, fam = chain.fam;
      if (!chainValid()) {
        Art.text(g, 'No such molecule', 400, 130, { font: 'display', size: 48, color: C.red });
        Art.para(g, `A ${fam === 'ene' ? 'double' : 'triple'} bond needs two carbons to join. Slide up to at least 2.`, 400, 186, 620, { size: 28, align: 'center' });
        Art.atom(g, 400, 330, 44, 'C', { face: 'sad', t });
        Art.moe(g, 660, 430, 130, 'oops', { t, flip: true });
        return;
      }
      const name = chainName(), f = chainF(), H = hCount(n, fam);
      const prefixEnd = name.indexOf(PRE[n - 1]) + PRE[n - 1].length;
      // The name, with the part that counts carbons in color.
      g.font = `400 46px ${Art.FONT_DISPLAY}`;
      const nameCap = name[0].toUpperCase() + name.slice(1);
      const part1 = nameCap.slice(0, prefixEnd), part2 = nameCap.slice(prefixEnd);
      const w1 = g.measureText(part1).width;
      Art.text(g, part1, 30, 38, { font: 'display', size: 46, color: C.cyan, align: 'left' });
      Art.text(g, part2, 30 + w1, 38, { font: 'display', size: 46, color: C.pink, align: 'left' });
      Art.formula(g, f, 770, 38, { size: 44, align: 'right', colorize: true });
      // The molecule.
      const s = Math.min(78, 600 / (n + 1));
      const { carbons, hs, bonds } = layoutChain(n, fam, s);
      const rC = s * 0.34, rH = s * 0.235;
      const pop = (i) => (Lab.reducedMotion || i < chain.prevN ? 1 : ease.back(clamp((t - chain.t0) * 3)));
      const dy = (i) => wander(i * 1.7, t * 1.2) * 1.5;
      bonds.forEach((b) => {
        const P = pop(b.b.i !== undefined ? b.b.i : b.a.i);
        if (P <= 0.05) return;
        Art.bond(g, b.a.x, b.a.y + dy(b.a.i), b.b.x, b.b.y + dy(b.b.i), { order: b.order, width: Math.max(4.5, s * 0.075) });
      });
      hs.forEach((h, k) => { const P = pop(h.i); if (P > 0) Art.atom(g, h.x, h.y + dy(h.i), rH * P, 'H', { seed: k }); });
      carbons.forEach((c) => {
        const P = pop(c.i);
        if (P > 0) Art.atom(g, c.x, c.y + dy(c.i), rC * P, 'C', { face: n === 1 ? 'happy' : null, t });
      });
      // The hydrogen count, as algebra.
      const rule = fam === 'ane' ? `2(${n}) + 2` : fam === 'ene' ? `2(${n})` : `2(${n}) − 2`;
      Art.text(g, `Hydrogens = ${rule} = ${H}`, 400, 298, { font: 'display', size: 30, color: C.sun });
      // Boiling scale, alkanes only.
      if (fam === 'ane') {
        const x0 = 56, x1 = 744, y = 368;
        const X = (T) => lerp(x0, x1, (T + 200) / 350);
        const room = X(25);
        const grad = g.createLinearGradient(x0, 0, x1, 0);
        grad.addColorStop(0, '#3A5BA8'); grad.addColorStop(0.65, '#6B5BC8'); grad.addColorStop(1, '#E06A4A');
        g.fillStyle = grad; Art.round(g, x0, y - 7, x1 - x0, 14, 7); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 4;
        g.beginPath(); g.moveTo(room, y - 18); g.lineTo(room, y + 18); g.stroke();
        Art.text(g, 'room temperature', room, y + 36, { size: 21, color: C.ink });
        const bp = ALK[n - 1].bp, bx = X(bp);
        Art.ball(g, bx, y, 15, C.pink);
        const gas = bp < 25;
        const lab = `boils at ${bp < 0 ? '−' + -bp : bp} °C`;
        const lx = clamp(bx, 120, 680);
        Art.text(g, lab, lx, y - 32, { font: 'display', size: 26, color: C.pink });
        Art.text(g, gas ? 'Gas at room temperature' : 'Liquid at room temperature', 186, y + 36, { size: 22, color: gas ? C.cyan : C.water, maxW: 300 });
      } else {
        Art.text(g, `Every carbon still has exactly 4 bonds. Count them.`, 400, 362, { size: 28 });
      }
      Art.text(g, 'A flat drawing. Real chains zigzag in 3D.', 400, 432, { size: 20, color: C.dim });
    },
  });
  function combustionTex() {
    const n = chain.n, H = hCount(n, chain.fam);
    // a fuel + b O2 -> n CO2 + (H/2) H2O, with b = n + H/4.
    const denom = H % 4 === 0 ? 1 : 2;
    const fuel = denom, O2 = (n + H / 4) * denom, CO2 = n * denom, H2O = (H / 2) * denom;
    const k = (c, s) => (c === 1 ? s : c + s);
    return `${k(fuel, chainF())} + ${k(O2, 'O2')} -> ${k(CO2, 'CO2')} + ${k(H2O, 'H2O')}`;
  }
  function paintChain() {
    if (!chainValid()) {
      Lab.$('#chain-M').textContent = '—'; Lab.$('#chain-use').textContent = '—'; Lab.$('#chain-heat').textContent = '—';
      Lab.$('#chain-note').innerHTML = '<p>Pick at least 2 carbons for an alkene or alkyne.</p>';
      return;
    }
    Lab.$('#chain-M').textContent = Bank.molarMass(chainF()).toFixed(2) + ' g/mol';
    const A = chain.fam === 'ane' ? ALK[chain.n - 1] : null;
    Lab.$('#chain-use').textContent = A ? A.use : chain.fam === 'ene' ? (chain.n === 2 ? 'Plastics, ripening fruit' : chain.n === 3 ? 'Plastics' : 'Chemical feedstock') : (chain.n === 2 ? 'Welding torches' : 'Chemical feedstock');
    Lab.$('#chain-heat').textContent = A ? `About ${A.heat.toLocaleString('en-US')} kJ` : 'Not shown';
    const eq = combustionTex();
    const note = chain.fam === 'ane'
      ? 'The whole family fits one rule, and each new carbon adds a $\\ce{CH2}$ unit: one carbon plus two hydrogens.'
      : `This chain has its ${chain.fam === 'ene' ? 'double' : 'triple'} bond at the first carbon, and hydrogens drop out to keep every carbon at 4 bonds.${chain.n >= 4 ? ' The "1-" in the name says where the multiple bond starts.' : ''}`;
    Lab.$('#chain-note').innerHTML = Lab.texString(`<p>${note}</p><p><b>Burning it completely:</b> $\\ce{${eq}}$. Want the method? See <a href="combustion.html" style="color:#FFD23F">combustion equations</a>.</p>`);
  }
  Lab.bind('#chain-n', '#chain-n-out', (v) => v, (v) => { chain.prevN = chain.n; chain.n = v; chain.t0 = chainStage.t; paintChain(); chainStage.redraw(); });
  Lab.segmented('#chain-fam', (v) => { chain.fam = v; chain.prevN = 99; paintChain(); chainStage.redraw(); });
  chain.prevN = 99;

  /* ---------- Story 2: isomers ---------- */
  const lerp2 = (a, b, q) => [lerp(a[0], b[0], q), lerp(a[1], b[1], q)];
  function skeleton(g, pts, edges, t, o = {}) {
    edges.forEach(([i, j]) => Art.bond(g, pts[i][0], pts[i][1], pts[j][0], pts[j][1], { width: 10 }));
    pts.forEach((P, i) => {
      const x = P[0] + wander(i * 4, t) * 1.4, y = P[1] + wander(i * 2 + 1, t) * 1.4;
      Art.atom(g, x, y, 44, 'C', { label: false, face: o.face ? o.face(i) : null, t, seed: i, look: [0, 0] });
      if (o.nums && o.nums[i]) {
        g.fillStyle = C.sun; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
        g.beginPath(); g.arc(x + 32, y - 32, 17, 0, TAU); g.fill(); g.stroke();
        Art.text(g, String(o.nums[i]), x + 32, y - 31, { font: 'display', size: 22, color: '#22123A' });
      }
    });
  }
  const STRAIGHT = [[160, 200], [320, 200], [480, 200], [640, 200]];
  const BENT = [[200, 300], [320, 180], [480, 180], [600, 300]];
  const BRANCH = [[220, 280], [400, 280], [580, 280], [400, 110]];
  function traceChain(g, pts, q, col) {
    const L = pts.length - 1, u = q * L;
    g.save(); g.strokeStyle = col; g.lineWidth = 6; g.setLineDash([3, 13]); g.lineCap = 'round';
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1] - 66);
    for (let i = 1; i <= L; i++) {
      if (u < i - 1) break;
      const f = clamp(u - (i - 1));
      g.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f) - 66);
    }
    g.stroke(); g.restore();
  }
  Lab.story('#story-isomers', {
    title: 'Same atoms, new connections',
    scenes: [
      {
        say: 'Here is <b>butane</b>, $\\ce{C4H10}$, with its hydrogens hidden. Follow the path: you can walk through all 4 carbons without lifting your finger.',
        dur: 3.2,
        draw(g, p, t) {
          const a = seg(p, 0.05, 0.3);
          Art.text(g, 'butane', 250, 52, { font: 'display', size: 44, color: C.cyan, alpha: a });
          fm(g, 'C4H10', 560, 52, { size: 42, alpha: a });
          skeleton(g, STRAIGHT, [[0, 1], [1, 2], [2, 3]], t, { nums: [1, 2, 3, 4], face: (i) => (i === 0 ? 'happy' : null) });
          traceChain(g, STRAIGHT, ease.inOut(seg(p, 0.3, 0.9)), C.sun);
          Art.text(g, 'a chain of 4', 400, 320, { font: 'display', size: 38, color: C.sun, alpha: seg(p, 0.7, 0.95) });
          Art.moe(g, 700, 432, 110, 'point', { t, flip: true });
        },
      },
      {
        say: 'Now bend it. Is this a new molecule? <b>No</b>. Single bonds rotate, so chains flex all the time. Same path through 4 carbons, so it is still butane.',
        dur: 3.6,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.05, 0.45));
          const pts = STRAIGHT.map((P, i) => lerp2(P, BENT[i], q));
          Art.text(g, 'still butane', 400, 52, { font: 'display', size: 44, color: C.leaf, alpha: seg(p, 0.55, 0.75) });
          skeleton(g, pts, [[0, 1], [1, 2], [2, 3]], t, { nums: [1, 2, 3, 4], face: (i) => (i === 0 ? 'grin' : null) });
          const a = seg(p, 0.6, 0.85);
          if (a > 0) traceChain(g, BENT, a, C.sun);
          Art.text(g, 'a new pose,', 400, 356, { size: 30, alpha: a });
          Art.text(g, 'not a new molecule', 400, 396, { font: 'display', size: 34, color: C.leaf, alpha: a });
        },
      },
      {
        say: 'Now <b>really</b> change a connection. Break carbon 4 off the end and attach it to the middle. The longest path is only 3 carbons now, with a <b>methyl</b> branch. This is a different molecule.',
        dur: 4.2,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.12, 0.6));
          const pts = STRAIGHT.map((P, i) => lerp2(P, BRANCH[i], q));
          // Pull the bond apart, then rejoin.
          const edges = [[0, 1], [1, 2]];
          if (q < 0.12) edges.push([2, 3]);
          if (q > 0.9) edges.push([1, 3]);
          skeleton(g, pts, edges, t, { nums: q > 0.9 ? [1, 2, 3, 0] : [1, 2, 3, 4], face: (i) => (i === 3 ? (q > 0.9 ? 'grin' : 'wow') : null) });
          const a = seg(p, 0.65, 0.9);
          if (a > 0) {
            g.save(); g.strokeStyle = C.sun; g.lineWidth = 6; g.setLineDash([3, 13]); g.lineCap = 'round'; g.globalAlpha *= a;
            g.beginPath(); g.moveTo(BRANCH[0][0], BRANCH[0][1] + 64); g.lineTo(BRANCH[2][0], BRANCH[2][1] + 64); g.stroke(); g.restore();
            Art.text(g, 'longest chain: 3', 400, 374, { font: 'display', size: 28, color: C.sun, alpha: a });
          }
          Art.text(g, 'methyl branch', 590, 112, { font: 'display', size: 30, color: C.pink, alpha: a });
          Art.text(g, '2-methylpropane', 216, 62, { font: 'display', size: 34, color: C.cyan, alpha: a, maxW: 360 });
          fm(g, 'C4H10', 216, 112, { size: 38, alpha: a });
          Art.text(g, 'the same formula', 400, 420, { size: 28, alpha: a });
        },
      },
      {
        say: 'Same formula, different substance. Isomers have different boiling points, and the difference can be huge. Ethanol and dimethyl ether share $\\ce{C2H6O}$, yet one is a liquid at room temperature and the other is a gas.',
        dur: 3.8,
        draw(g, p, t) {
          const card = (x, y, name, f, bp, col, a) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            g.fillStyle = 'rgba(26,15,46,.86)'; Art.round(g, x - 182, y - 76, 364, 152, 20); g.fill();
            g.strokeStyle = col; g.lineWidth = 3.5; g.stroke();
            Art.text(g, name, x, y - 44, { font: 'display', size: 28, color: col });
            Art.formula(g, f, x, y - 2, { size: 26, colorize: true });
            Art.text(g, bp, x, y + 44, { font: 'display', size: 34, color: C.ink });
            g.restore();
          };
          const tab = (y, f, a) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            g.fillStyle = C.sun; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
            Art.round(g, 338, y - 21, 124, 42, 21); g.fill(); g.stroke();
            Art.formula(g, f, 400, y - 1, { size: 28, color: '#22123A' });
            g.restore();
          };
          card(204, 110, 'butane', 'CH3CH2CH2CH3', 'boils at −1 °C', C.cyan, ease.out(seg(p, 0.05, 0.25)));
          card(596, 110, '2-methylpropane', 'CH3CH(CH3)CH3', 'boils at −12 °C', C.cyan, ease.out(seg(p, 0.2, 0.4)));
          card(204, 298, 'ethanol', 'CH3CH2OH', 'boils at 78 °C', C.pink, ease.out(seg(p, 0.42, 0.62)));
          card(596, 298, 'dimethyl ether', 'CH3OCH3', 'boils at −24 °C', C.pink, ease.out(seg(p, 0.58, 0.78)));
          tab(34, 'C4H10', seg(p, 0.25, 0.45));
          tab(222, 'C2H6O', seg(p, 0.75, 0.92));
          Art.text(g, 'Ethanol molecules can form hydrogen bonds. The ether cannot.', 400, 418, { size: 25, alpha: seg(p, 0.82, 1) });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: isomers in 3D ---------- */
  function pairSpec(a, b, gap, vertical) {
    const atoms = [], bonds = [];
    const addOne = (m, dx) => {
      const k = atoms.length;
      m.atoms.forEach((at) => atoms.push({ el: at.el, p: vertical ? [at.p[0], at.p[1] + dx, at.p[2]] : [at.p[0] + dx, at.p[1], at.p[2]] }));
      m.bonds.forEach(([i, j, o]) => bonds.push([i + k, j + k, o]));
    };
    addOne(a, -gap); addOne(b, gap);
    return { atoms, bonds };
  }
  const PAIRS = {
    c4: { a: 'butane', b: 'isobutane', gap: 3.5, dist: 12.5, nameA: 'Butane', nameB: '2-Methylpropane', bpA: 'Boils at −1 °C', bpB: 'Boils at −12 °C',
      note: 'Both have 4 carbons and 10 hydrogens. On the left, the carbons form an unbroken chain. On the right, one carbon holds three others. A long chain has more surface for <a href="imf.html" style="color:#FFD23F">London dispersion forces</a>, so it boils higher.' },
    c2o: { a: 'ethanol', b: 'ether', gap: 2.7, dist: 10.5, nameA: 'Ethanol', nameB: 'Dimethyl ether', bpA: 'Boils at 78 °C', bpB: 'Boils at −24 °C',
      note: 'Both have 2 carbons, 6 hydrogens and 1 oxygen. Ethanol has an O-H, so its molecules can form <a href="imf.html" style="color:#FFD23F">hydrogen bonds</a> with each other, and that gives it a boiling point about 100 °C higher. In the ether, the oxygen sits between two carbons and has no H of its own to share.' },
  };
  let iv = null;
  if (window.Chem3D) iv = Chem3D.viewer('#v-iso', { height: 420, distance: 10.5, label: 'Two isomers side by side in rotatable 3D, with the same atoms connected in different ways.' });
  function showPair(k) {
    const P = PAIRS[k];
    const host = Lab.$('#v-iso');
    const vertical = host.clientWidth / (host.clientHeight || 1) < 1.35;
    const spec = pairSpec(MOL[P.a], MOL[P.b], vertical ? -2.9 : P.gap, vertical);
    Lab.$('#iso-a-name').textContent = P.nameA; Lab.$('#iso-a').textContent = P.bpA;
    Lab.$('#iso-b-name').textContent = P.nameB; Lab.$('#iso-b').textContent = P.bpB;
    Lab.$('#iso-note').innerHTML = `<p>${P.note}</p>`;
    if (!iv) return;
    iv.molecule(spec);
    if (iv.ok) {
      iv.setDistance(vertical ? 19.5 : P.dist);
      iv.setAuto(false);
      iv.rotateTo(0.2, -0.15);
      iv.labels(vertical
        ? [{ p: [0, 5.3, 0], text: P.nameA }, { p: [0, -5.3, 0], text: P.nameB }]
        : [{ p: [-P.gap, 2.7, 0], text: P.nameA }, { p: [P.gap, 2.7, 0], text: P.nameB }]);
    }
  }
  Lab.segmented('#iso-pick', showPair);
  showPair('c4');

  /* ---------- Bench: functional groups in 3D ---------- */
  const GROUPS = {
    alcohol: { mol: 'ethanol', ids: [2, 3], g: '−OH', end: '-ol', ex: 'Ethanol, $\\ce{CH3CH2OH}$', tag: 'hydroxyl',
      note: 'An <b>alcohol</b> has an OH on a carbon. Its O-H can form hydrogen bonds, so alcohols boil far higher than alkanes of the same size. Ethanol is the alcohol in drinks and hand sanitizer.' },
    ether: { mol: 'ether', ids: [0], g: 'C−O−C', end: 'ether', ex: 'Dimethyl ether, $\\ce{CH3OCH3}$', tag: 'ether oxygen',
      note: 'An <b>ether</b> has an oxygen between two carbons, with no H on it. It cannot donate a hydrogen bond, so it boils low. Dimethyl ether is used as a spray can propellant.' },
    aldehyde: { mol: 'aldehyde', ids: [0, 2, 3], g: '−CHO', end: '-al', ex: 'Ethanal, $\\ce{CH3CHO}$', tag: 'aldehyde',
      note: 'An <b>aldehyde</b> has a C=O at the end of a chain, with an H on that same carbon. Your liver makes ethanal when it breaks down ethanol.' },
    ketone: { mol: 'ketone', ids: [0, 2], g: 'C=O, mid-chain', end: '-one', ex: 'Propanone, $\\ce{CH3COCH3}$', tag: 'carbonyl',
      note: 'A <b>ketone</b> has a C=O with a carbon on each side. Propanone, or acetone, is the sharp-smelling liquid in many nail polish removers.' },
    acid: { mol: 'acid', ids: [0, 2, 3, 4], g: '−COOH', end: '-oic acid', ex: 'Ethanoic acid, $\\ce{CH3COOH}$', tag: 'carboxyl',
      note: 'A <b>carboxylic acid</b> has a C=O and an OH on the same carbon. It can give up the $\\ce{H+}$ on that OH, though it is a weak acid. Vinegar is a dilute solution of ethanoic acid, also called acetic acid.' },
    ester: { mol: 'ester', ids: [0, 2, 3], g: '−COO−', end: '-oate', ex: 'Methyl ethanoate, $\\ce{CH3COOCH3}$', tag: 'ester',
      note: 'An <b>ester</b> is like a carboxylic acid with its acidic H replaced by a carbon group. Many esters give fruits and flowers their smells.' },
    amine: { mol: 'amine', ids: [1, 5, 6], g: '−NH₂', end: '-amine', ex: 'Methylamine, $\\ce{CH3NH2}$', tag: 'amino',
      note: 'An <b>amine</b> has a nitrogen bonded to carbon. Its lone pair can pick up an $\\ce{H+}$, so amines act as weak bases. Many smell fishy, and every amino acid contains one.' },
  };
  let gv = null;
  if (window.Chem3D) gv = Chem3D.viewer('#v-group', { height: 420, distance: 10.5, label: 'A rotatable 3D model of an example molecule with its functional group inside a gold bubble.' });
  function showGroup(k) {
    const G_ = GROUPS[k];
    const m = MOL[G_.mol];
    Lab.$('#group-g').textContent = G_.g;
    Lab.$('#group-end').textContent = G_.end;
    Lab.$('#group-ex').innerHTML = Lab.texString(G_.ex);
    Lab.$('#group-note').innerHTML = Lab.texString(`<p>${G_.note}</p>`);
    if (!gv) return;
    gv.molecule({ atoms: m.atoms, bonds: m.bonds });
    if (!gv.ok) return;
    const T = window.THREE;
    const cen = M3(G_.ids.map((i) => m.atoms[i].p).reduce(A3, [0, 0, 0]), 1 / G_.ids.length);
    const R = Math.max(...G_.ids.map((i) => Math.hypot(...S3(m.atoms[i].p, cen)))) + 0.62;
    const mat = gv.atomMaterial('#FFD23F', { opacity: 0.22 });
    mat.emissive = new T.Color('#E0A800');
    const bubble = new T.Mesh(new T.SphereGeometry(R, 40, 28), mat);
    bubble.position.set(cen[0], cen[1], cen[2]);
    gv.add(bubble);
    gv.labels([{ p: [cen[0], cen[1] + R + 0.28, cen[2]], text: G_.tag + ' group' }]);
    gv.rotateTo(0.28, -0.4);
  }
  Lab.segmented('#group-pick', showGroup);
  showGroup('alcohol');
});
