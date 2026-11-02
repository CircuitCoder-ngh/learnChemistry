/* Lesson 8.1: Ionic bonds. Formulas and lattice comparisons come from IonicKit (bank/ionic.js). */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const K = window.IonicKit;
  const TAU = Math.PI * 2;
  const PM = 0.5; // Stage units per picometer in the transfer story.
  const R_ATOM = { Na: EL.Na.rcov * PM, Cl: EL.Cl.rcov * PM };
  const R_ION = { Na: K.RADII.Na * PM, Cl: K.RADII.Cl * PM };

  function eDot(g, x, y, r = 6.5, alpha = 1) {
    if (alpha <= 0) return;
    const prev = g.globalAlpha;
    g.globalAlpha = prev * alpha;
    g.fillStyle = Art.alpha(C.electron, 0.26); g.beginPath(); g.arc(x, y, r * 1.9, 0, TAU); g.fill();
    Art.ball(g, x, y, r, C.electron);
    g.globalAlpha = prev;
  }
  /** Eight seats around an atom. n electrons fill them, starting from the given angle. */
  function ring(g, x, y, r, n, o = {}) {
    const R = r + (o.gap || 18), a0 = o.a0 === undefined ? -Math.PI / 2 : o.a0, seats = o.seats || 8;
    if (o.circle !== false) {
      g.strokeStyle = 'rgba(247,242,255,.26)'; g.lineWidth = 2; g.setLineDash([5, 7]);
      g.beginPath(); g.arc(x, y, R, 0, TAU); g.stroke(); g.setLineDash([]);
    }
    for (let i = 0; i < seats; i++) {
      const a = a0 + (i / seats) * TAU;
      const px = x + Math.cos(a) * R, py = y + Math.sin(a) * R;
      if (i < n) eDot(g, px, py, o.dot || 6.5);
      else if (o.empty) { g.strokeStyle = C.sun; g.lineWidth = 3; g.beginPath(); g.arc(px, py, (o.dot || 6.5) + 2, 0, TAU); g.stroke(); }
    }
    return (i) => { const a = a0 + (i / seats) * TAU; return { x: x + Math.cos(a) * R, y: y + Math.sin(a) * R }; };
  }
  /** Lewis dots: one per side, then pair up. */
  function lewisDots(g, x, y, r, n, o = {}) {
    const sides = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const count = [0, 0, 0, 0];
    for (let k = 0; k < n; k++) count[k % 4]++;
    const used = [0, 0, 0, 0], dist = r + (o.gap || 13), sep = o.sep || 9;
    for (let k = 0; k < n; k++) {
      const s = k % 4, idx = used[s]++, off = count[s] === 1 ? 0 : idx === 0 ? -sep : sep;
      eDot(g, x + sides[s][0] * dist + (sides[s][1] ? off : 0), y + sides[s][1] * dist + (sides[s][0] ? off : 0), o.dot || 6, o.alpha);
    }
  }
  function badgeText(g, x, y, str, color, q = 1) {
    if (q <= 0) return;
    Art.text(g, str, x, y, { font: 'display', size: 40, color, alpha: q, halo: true });
  }
  function chargeLabel(g, x, y, text, positive, q = 1) {
    if (q <= 0) return;
    const prev = g.globalAlpha; g.globalAlpha = prev * q;
    g.fillStyle = positive ? '#E8357F' : '#1786D8'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    const w = Math.max(40, text.length * 18 + 16);
    Art.round(g, x - w / 2, y - 21, w, 42, 21); g.fill(); g.stroke();
    Art.text(g, text, x, y + 1, { font: 'display', size: 30, color: '#fff' });
    g.globalAlpha = prev;
  }

  /* ---------- Story 1: the electron jumps ---------- */
  const nax = 210, clx = 590, ay = 205;
  Lab.story('#story-transfer', {
    title: 'Sodium meets chlorine',
    scenes: [
      {
        say: 'Sodium has just <b>1</b> electron in its outer shell, held loosely. Chlorine has <b>7</b> in its outer shell, and only needs one more to fill it.',
        dur: 3.2,
        draw(g, p, t) {
          Art.atom(g, nax, ay, R_ATOM.Na, 'Na', { face: 'sad', t, look: [1, 0] });
          Art.atom(g, clx, ay, R_ATOM.Cl, 'Cl', { face: 'grumpy', t, look: [-1, 0], seed: 2 });
          ring(g, nax, ay, R_ATOM.Na, 1, { seats: 1, a0: t * 1.1, gap: 22 });
          ring(g, clx, ay, R_ATOM.Cl, 7, { a0: Math.PI + Math.PI / 4, empty: true });
          Art.text(g, 'Sodium', nax, 354, { font: 'display', size: 34 });
          Art.text(g, '1 outer electron', nax, 394, { size: 28, color: C.cyan, alpha: seg(p, 0.1, 0.3) });
          Art.text(g, 'Chlorine', clx, 354, { font: 'display', size: 34 });
          Art.text(g, '7 outer electrons', clx, 394, { size: 28, color: C.cyan, alpha: seg(p, 0.3, 0.5) });
          Art.bubble(g, 'One seat empty!', clx + 30, 104, { w: 230, size: 25, side: 'down', alpha: seg(p, 0.55, 0.72) });
        },
      },
      {
        say: 'The electron jumps across. It does not get shared: it <b>moves</b>. This is <b>electron transfer</b>.',
        dur: 2.8,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.1, 0.75));
          const done = q >= 1;
          Art.atom(g, nax, ay, R_ATOM.Na, 'Na', { face: done ? 'happy' : 'wow', t, look: [1, 0] });
          Art.atom(g, clx, ay, R_ATOM.Cl, 'Cl', { face: done ? 'happy' : 'wow', t, look: [-1, 0], seed: 2 });
          const seat = ring(g, clx, ay, R_ATOM.Cl, 7, { a0: Math.PI + Math.PI / 4, empty: !done });
          const end = seat(7);
          const sx = nax + R_ATOM.Na + 22, sy = ay;
          const at = (u) => ({ x: lerp(sx, end.x, u), y: lerp(sy, end.y, u) - Math.sin(u * Math.PI) * 120 });
          for (let k = 8; k >= 1; k--) {
            const tail = at(Math.max(0, q - k * 0.03));
            if (q > 0 && q < 1) { g.fillStyle = Art.alpha(C.electron, 0.34 - k * 0.035); g.beginPath(); g.arc(tail.x, tail.y, 10 - k * 0.7, 0, TAU); g.fill(); }
          }
          const e = at(q);
          eDot(g, e.x, e.y, 10);
          Art.burst(g, end.x, end.y, seg(p, 0.75, 1), { r: 70 });
          Art.text(g, 'e⁻', at(Math.min(q, 0.5)).x, at(Math.min(q, 0.5)).y - 34, { font: 'display', size: 34, color: C.cyan, alpha: 1 - seg(p, 0.7, 0.85) });
          Art.text(g, 'Na', nax, 372, { font: 'display', size: 36 });
          Art.text(g, 'Cl', clx, 372, { font: 'display', size: 36 });
          Art.moe(g, 400, 438, 110, done ? 'cheer' : 'wow', { t });
        },
      },
      {
        say: 'Now their sizes change. Sodium lost its whole outer shell, so $\\ce{Na+}$ <b>shrinks</b>. Chlorine has an extra electron that crowds the others, so $\\ce{Cl-}$ <b>swells</b>.',
        dur: 3.2,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.1, 0.7));
          const rNa = lerp(R_ATOM.Na, R_ION.Na, q), rCl = lerp(R_ATOM.Cl, R_ION.Cl, q);
          Art.atom(g, nax, ay, rNa, 'Na', { face: 'happy', t, look: [1, 0] });
          Art.atom(g, clx, ay, rCl, 'Cl', { face: 'happy', t, look: [-1, 0], seed: 2 });
          g.strokeStyle = 'rgba(247,242,255,.4)'; g.lineWidth = 2.5; g.setLineDash([6, 7]);
          g.beginPath(); g.arc(nax, ay, R_ATOM.Na, 0, TAU); g.stroke();
          g.beginPath(); g.arc(clx, ay, R_ATOM.Cl, 0, TAU); g.stroke(); g.setLineDash([]);
          chargeLabel(g, nax + 62, ay - 76, '+', true, seg(p, 0.5, 0.7));
          chargeLabel(g, clx + 72, ay - 92, '−', false, seg(p, 0.5, 0.7));
          Art.text(g, `${EL.Na.rcov} pm`, nax - 90, 354, { font: 'display', size: 30, color: C.dim });
          Art.text(g, `${K.RADII.Na} pm`, nax + 90, 354, { font: 'display', size: 36, color: C.sun, alpha: seg(p, 0.5, 0.75) });
          Art.arrow(g, nax - 40, 354, nax + 30, 354, { color: C.ink, w: 4, p: seg(p, 0.3, 0.6) });
          Art.text(g, `${EL.Cl.rcov} pm`, clx - 90, 354, { font: 'display', size: 30, color: C.dim });
          Art.text(g, `${K.RADII.Cl} pm`, clx + 90, 354, { font: 'display', size: 36, color: C.sun, alpha: seg(p, 0.5, 0.75) });
          Art.arrow(g, clx - 40, 354, clx + 30, 354, { color: C.ink, w: 4, p: seg(p, 0.3, 0.6) });
          Art.text(g, 'Sodium ion', nax, 398, { size: 28, alpha: seg(p, 0.6, 0.8) });
          Art.text(g, 'Chloride ion', clx, 398, { size: 28, alpha: seg(p, 0.6, 0.8) });
        },
      },
      {
        say: 'Lewis dot notation shows it in one line. Sodium loses its dot. Chlorine gets a full 8 and goes in brackets, with the charge on the outside.',
        dur: 3,
        draw(g, p, t) {
          const y1 = 118, y2 = 320;
          Art.atom(g, 150, y1, 44, 'Na', {});
          lewisDots(g, 150, y1, 44, 1, { dot: 8, gap: 16 });
          Art.text(g, '+', 275, y1, { font: 'display', size: 56, color: C.dim });
          Art.atom(g, 400, y1, 40, 'Cl', {});
          lewisDots(g, 400, y1, 40, 7, { dot: 7, gap: 16, sep: 10 });
          const q = seg(p, 0.2, 0.55);
          Art.arrow(g, 165, y1 - 72, 362, y1 + 2, { color: C.pink, w: 5, curve: -60, p: ease.out(q) });
          Art.text(g, 'atoms', 660, y1, { size: 30, color: C.dim });
          Art.arrow(g, 400, y1 + 72, 400, y2 - 92, { color: C.ink, w: 6, p: seg(p, 0.4, 0.6) });
          const a = seg(p, 0.55, 0.8);
          g.save(); g.globalAlpha *= a;
          Art.atom(g, 150, y2, 34, 'Na', {});
          Art.text(g, '+', 202, y2 - 34, { font: 'display', size: 40, color: '#FF7AB8' });
          Art.text(g, '+', 275, y2, { font: 'display', size: 56, color: C.dim });
          Art.atom(g, 400, y2, 50, 'Cl', {});
          lewisDots(g, 400, y2, 50, 8, { dot: 7, gap: 15, sep: 10 });
          g.strokeStyle = '#EDE6FA'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
          [[310, 1], [490, -1]].forEach(([x, d]) => { g.beginPath(); g.moveTo(x + d * 16, y2 - 88); g.lineTo(x, y2 - 88); g.lineTo(x, y2 + 88); g.lineTo(x + d * 16, y2 + 88); g.stroke(); });
          Art.text(g, '−', 512, y2 - 84, { font: 'display', size: 40, color: '#6EC6FF' });
          Art.text(g, 'ions', 660, y2, { size: 30, color: C.leaf });
          g.restore();
          void t;
        },
      },
      {
        say: 'Opposite charges attract. The pull between $\\ce{Na+}$ and $\\ce{Cl-}$ is the <b>ionic bond</b>. No electrons are shared, and it pulls in every direction.',
        dur: 2.8,
        draw(g, p, t, { W }) {
          const q = ease.out(seg(p, 0.18, 0.7));
          const y = 195, gap = lerp(310, R_ION.Na + R_ION.Cl - 4, q);
          const x1 = W / 2 - gap / 2 - 12, x2 = W / 2 + gap / 2 - 12;
          Art.glow(g, (x1 + x2) / 2, y, 200, C.sun, 0.14 * q);
          Art.atom(g, x1, y, R_ION.Na, 'Na', { face: q > 0.9 ? 'grin' : 'wow', t, look: [1, 0], charge: '+' });
          Art.atom(g, x2, y, R_ION.Cl, 'Cl', { face: q > 0.9 ? 'grin' : 'wow', t, look: [-1, 0], seed: 2, charge: '-' });
          if (q < 0.9) {
            Art.arrow(g, x1 + R_ION.Na + 10, y, x1 + R_ION.Na + 74, y, { color: C.sun, w: 8, head: 22, p: seg(p, 0.02, 0.14) });
            Art.arrow(g, x2 - R_ION.Cl - 10, y, x2 - R_ION.Cl - 74, y, { color: C.sun, w: 8, head: 22, p: seg(p, 0.02, 0.14) });
          }
          Art.text(g, 'Ionic bond', W / 2, 342, { font: 'display', size: 44, color: C.sun, alpha: seg(p, 0.7, 0.85) });
          Art.text(g, 'attraction between opposite charges', W / 2, 392, { size: 28, alpha: seg(p, 0.75, 0.9) });
        },
      },
      {
        say: 'And they do not stop at two. Every $\\ce{Na+}$ attracts every nearby $\\ce{Cl-}$, so ions keep gathering into a huge <b>crystal lattice</b>. "NaCl" means a 1 to 1 ratio, called a <b>formula unit</b>. It is not a molecule.',
        dur: 4,
        draw(g, p, t, { W }) {
          const cols = 9, rows = 5, sp = 72, x0 = W / 2 - ((cols - 1) * sp) / 2, y0 = 62;
          const order = [];
          for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) order.push({ i, j, d: Math.hypot(i - 4, j - 2) });
          const maxD = Math.hypot(4, 2);
          order.sort((a, b) => a.d - b.d).forEach((o) => {
            const q = ease.back(seg(p, 0.02 + (o.d / maxD) * 0.6, 0.16 + (o.d / maxD) * 0.6));
            if (q <= 0) return;
            const na = (o.i + o.j) % 2 === 1;
            const x = x0 + o.i * sp + wander(o.i * 3 + o.j, t) * 1.5, y = y0 + o.j * sp + wander(o.i + o.j * 7, t) * 1.5;
            const center = o.d < 1.01 && (o.j === 2) && o.i >= 4 && o.i <= 5;
            Art.atom(g, x, y, (na ? R_ION.Na * 0.58 : R_ION.Cl * 0.45) * q, na ? 'Na' : 'Cl', { label: na ? 'Na' : 'Cl', face: center ? 'happy' : null, t, seed: o.i });
          });
          const a = seg(p, 0.78, 0.92);
          if (a > 0) {
            g.fillStyle = Art.alpha(C.plum, 0.92 * a); Art.round(g, W / 2 - 300, 404, 600, 40, 16); g.fill();
            Art.text(g, 'Each ion attracts all its neighbors.', W / 2, 425, { size: 26, color: C.sun, alpha: a });
          }
        },
      },
    ],
  });

  /* ---------- Bench: electron swap meet ---------- */
  const swap = { m: 'Na', x: 'Cl', c: K.compound('Na', 'Cl'), t0: 0 };
  const atomR = (e) => clamp(EL[e].rcov * 0.27, 30, 50);
  const ionR = (e) => clamp(K.RADII[e] * 0.27, 22, 60);
  const swapStage = Lab.stage('#c-swap', {
    h: 460, label: 'Metal atoms on the left hand electrons to nonmetal atoms on the right until all have full shells.',
    draw(g, t) {
      const c = swap.c, age = t - swap.t0;
      const yOf = (i, n) => 200 + (i - (n - 1) / 2) * 136;
      const xM = 170, xX = 630;
      // Assign every electron a journey.
      const moves = [];
      let tx = 0, slot = 0;
      const vX = 8 - c.p;
      for (let i = 0; i < c.nM; i++) for (let k = 0; k < c.q; k++) {
        moves.push({ from: i, k, to: tx, seat: vX + slot });
        slot++;
        if (slot === c.p) { slot = 0; tx++; }
      }
      const STEP = c.moved > 3 ? 0.42 : 0.62;
      const start = (n) => 0.5 + n * STEP;
      const prog = (n) => ease.inOut(clamp((age - start(n)) / (STEP * 0.92)));
      const allDone = clamp((age - start(moves.length)) * 2.5);
      const metalDone = (i) => moves.filter((e) => e.from === i).every((e) => prog(moves.indexOf(e)) >= 1);
      const nonDone = (j) => moves.filter((e) => e.to === j).every((e) => prog(moves.indexOf(e)) >= 1);
      const finished = (fn, i) => fn(i);
      // Atoms.
      const Mq = Array.from({ length: c.nM }, (_, i) => (finished(metalDone, i) ? 1 : 0));
      const Xq = Array.from({ length: c.nX }, (_, j) => (finished(nonDone, j) ? 1 : 0));
      const rM = (i) => lerp(atomR(c.m), ionR(c.m), ease.inOut(Mq[i] * allDone || (Mq[i] ? clamp((age - start(moves.filter((e) => e.from === i).length * (i + 1))) * 2) : 0)));
      const rX = (j) => lerp(atomR(c.x), ionR(c.x), Xq[j] ? clamp(allDone + 0.0) : 0);
      for (let i = 0; i < c.nM; i++) {
        const y = yOf(i, c.nM), r = rM(i);
        Art.atom(g, xM, y, r, c.m, { face: Mq[i] ? 'happy' : 'sad', t, seed: i, look: [1, 0] });
        // Electrons still at home.
        moves.filter((e) => e.from === i).forEach((e) => {
          const a = -Math.PI / 2 + (e.k / c.q) * TAU;
          if (prog(moves.indexOf(e)) <= 0) eDot(g, xM + Math.cos(a) * (r + 16), y + Math.sin(a) * (r + 16), 7);
        });
        if (Mq[i]) chargeLabel(g, xM + r + 30, y - r - 4, (c.q > 1 ? c.q : '') + '+', true, allDone);
      }
      for (let j = 0; j < c.nX; j++) {
        const y = yOf(j, c.nX), r = rX(j);
        Art.atom(g, xX, y, r, c.x, { face: Xq[j] ? 'happy' : 'grumpy', t, seed: j + 4, look: [-1, 0] });
        for (let s = 0; s < vX; s++) {
          const a = -Math.PI / 2 + (s / 8) * TAU;
          eDot(g, xX + Math.cos(a) * (r + 16), y + Math.sin(a) * (r + 16), 6);
        }
        for (let s = vX; s < 8; s++) {
          const a = -Math.PI / 2 + (s / 8) * TAU;
          const px = xX + Math.cos(a) * (r + 16), py = y + Math.sin(a) * (r + 16);
          const coming = moves.find((e) => e.to === j && e.seat === s);
          if (coming && prog(moves.indexOf(coming)) >= 1) eDot(g, px, py, 6);
          else { g.strokeStyle = C.sun; g.lineWidth = 2.5; g.beginPath(); g.arc(px, py, 7.5, 0, TAU); g.stroke(); }
        }
        if (Xq[j]) chargeLabel(g, xX + r + 34, y - r - 4, (c.p > 1 ? c.p : '') + '−', false, allDone);
      }
      // Electrons in flight.
      moves.forEach((e, n) => {
        const q = prog(n);
        if (q <= 0 || q >= 1) return;
        const y1 = yOf(e.from, c.nM), y2 = yOf(e.to, c.nX);
        const a1 = -Math.PI / 2 + (e.k / c.q) * TAU, a2 = -Math.PI / 2 + (e.seat / 8) * TAU;
        const sx = xM + Math.cos(a1) * (atomR(c.m) + 16), sy = y1 + Math.sin(a1) * (atomR(c.m) + 16);
        const ex = xX + Math.cos(a2) * (atomR(c.x) + 16), ey = y2 + Math.sin(a2) * (atomR(c.x) + 16);
        const x = lerp(sx, ex, q), y = lerp(sy, ey, q) - Math.sin(q * Math.PI) * 54;
        for (let k = 1; k <= 5; k++) { const u = Math.max(0, q - k * 0.035); g.fillStyle = Art.alpha(C.electron, 0.3 - k * 0.05); g.beginPath(); g.arc(lerp(sx, ex, u), lerp(sy, ey, u) - Math.sin(u * Math.PI) * 54, 8 - k, 0, TAU); g.fill(); }
        eDot(g, x, y, 9);
      });
      // Tally in the middle.
      const shown = moves.reduce((a, _, n) => a + (prog(n) >= 1 ? 1 : 0), 0);
      Art.text(g, 'Electrons moved', 400, 96, { size: 25, color: C.dim });
      Art.text(g, String(shown), 400, 158, { font: 'display', size: 84, color: allDone >= 1 ? C.leaf : C.sun });
      if (allDone > 0) {
        Art.formula(g, c.f, 400, 262, { size: 72, color: C.ink });
        Art.text(g, `${c.nM} × (+${c.q})  +  ${c.nX} × (−${c.p})  =  0`, 400, 330, { size: 25, color: C.cyan, alpha: allDone });
      }
      Art.text(g, EL[c.m].name, xM, 438, { font: 'display', size: 30 });
      Art.text(g, EL[c.x].name, xX, 438, { font: 'display', size: 30 });
    },
  });
  function paintSwap() {
    const c = K.compound(swap.m, swap.x);
    swap.c = c; swap.t0 = swapStage.t;
    Lab.$('#swap-f').innerHTML = Lab.fHTML(c.f);
    Lab.$('#swap-n').textContent = c.moved;
    Lab.$('#swap-q').textContent = '0';
    Lab.$('#swap-say').innerHTML = Lab.texString(`<p>${EL[c.m].name} is in group ${EL[c.m].group}: each atom gives ${c.q}. ${EL[c.x].name} has ${8 - c.p} valence electrons: each atom takes ${c.p}. So ${c.nM} ${c.m} and ${c.nX} ${c.x} balance out, with ${c.moved} electron${c.moved === 1 ? '' : 's'} moved. That gives $\\ce{${c.f}}$.</p>`);
  }
  Lab.segmented('#swap-m', (v) => { swap.m = v; paintSwap(); });
  Lab.segmented('#swap-x', (v) => { swap.x = v; paintSwap(); });
  Lab.$('#swap-replay').addEventListener('click', () => { swap.t0 = swapStage.t; });
  paintSwap();

  /* ---------- Story 2: who pays? A Born-Haber staircase for NaCl, values in kJ/mol ---------- */
  const STEPS = [
    { dE: 107, label: 'vaporize Na', x: 92 },
    { dE: 121, label: 'split Cl₂', x: 212 },
    { dE: 496, label: 'ionize Na', x: 332 },
    { dE: -349, label: 'Cl takes e⁻', x: 452 },
    { dE: -787, label: 'lattice forms', x: 572 },
  ];
  const Ey = (E) => 42 + (760 - E) * 0.285;
  function stair(g, upto, p, o = {}) {
    // Axis and the starting level.
    g.strokeStyle = 'rgba(247,242,255,.28)'; g.lineWidth = 2; g.setLineDash([7, 7]);
    g.beginPath(); g.moveTo(40, Ey(0)); g.lineTo(780, Ey(0)); g.stroke(); g.setLineDash([]);
    Art.text(g, 'Energy', 30, 32, { size: 24, color: C.dim, align: 'left' });
    Art.text(g, '0', 22, Ey(0), { size: 24, color: C.dim });
    let E = 0;
    STEPS.forEach((s, i) => {
      if (i > upto) return;
      const q = i === upto ? ease.out(seg(p, o.from || 0, o.to || 0.7)) : 1;
      const next = E + s.dE;
      const color = s.dE > 0 ? C.fire : C.leaf;
      // Level line carried from the previous step.
      g.strokeStyle = 'rgba(247,242,255,.7)'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(s.x - 40, Ey(E)); g.lineTo(s.x + 14, Ey(E)); g.stroke();
      Art.arrow(g, s.x, Ey(E), s.x, Ey(next), { color, w: 9, head: 22, p: q, alpha: o.dim && i < upto ? 0.55 : 1 });
      const midY = (Ey(E) + Ey(next)) / 2;
      const a = i === upto ? seg(p, 0.45, 0.8) : (o.dim ? 0.5 : 1);
      const tall = Math.abs(Ey(E) - Ey(next)) > 70;
      const tx = tall ? s.x + 18 : s.x, ty = tall ? midY - 14 : Ey(next) - 52;
      Art.text(g, (s.dE > 0 ? '+' : '−') + Math.abs(s.dE), tx, ty, { font: 'display', size: 30, align: tall ? 'left' : 'center', color, alpha: a, halo: true });
      Art.text(g, s.label, tx, ty + 28, { size: 20, align: tall ? 'left' : 'center', alpha: a, halo: true });
      E = next;
      g.strokeStyle = 'rgba(247,242,255,.7)'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(s.x - 14, Ey(E)); g.lineTo(s.x + 80, Ey(E)); g.globalAlpha *= q; g.stroke(); g.globalAlpha = 1;
    });
    return E;
  }
  Lab.story('#story-energy', {
    title: 'Following the energy of NaCl',
    scenes: [
      {
        say: 'Start with sodium metal and chlorine gas, then get them ready. Turning sodium into gas atoms costs <b>107 kJ/mol</b>, and splitting chlorine costs <b>121 kJ/mol</b>. Orange means energy spent.',
        dur: 3.2,
        draw(g, p) {
          stair(g, 1, p);
          Art.text(g, 'Na(s) + ½Cl₂(g)', 150, Ey(0) + 28, { size: 26 });
          const q = seg(p, 0.5, 0.8);
          Art.atom(g, 300, 368, 44, 'Na', { face: 'sleepy', t: 0, alpha: q });
          Art.atom(g, 420, 368, 30, 'Cl', { face: 'grumpy', t: 0, alpha: q });
          Art.text(g, 'separate gas atoms', 610, 368, { size: 28, alpha: q });
        },
      },
      {
        say: 'Pulling an electron off sodium costs a lot: <b>496 kJ/mol</b>. Chlorine taking it gives back only <b>349 kJ/mol</b>. Moving the electron has a net cost of 147 kJ/mol.',
        dur: 3.6,
        draw(g, p) {
          if (p <= 0.55) stair(g, 2, seg(p, 0, 0.55));
          else stair(g, 3, seg(p, 0.55, 1));
          Art.text(g, 'Na(s) + ½Cl₂(g)', 150, Ey(0) + 28, { size: 26 });
          const q = seg(p, 0.7, 0.95);
          Art.atom(g, 300, 368, 26, 'Na', { face: 'wow', t: 0, alpha: q, charge: '+' });
          Art.atom(g, 420, 368, 44, 'Cl', { face: 'happy', t: 0, alpha: q, charge: '-' });
          Art.text(g, 'separate gas ions', 610, 368, { size: 28, alpha: q });
        },
      },
      {
        say: 'Look where that leaves us: separate gas ions sit <b>375 kJ/mol uphill</b> from where we began. If this were all, salt would never form. Giving away an electron is not free.',
        dur: 2.8,
        draw(g, p, t) {
          stair(g, 3, 1);
          const y = Ey(375);
          Art.ring(g, 505, y, 26, { color: C.red, w: 5, p: seg(p, 0, 0.5) });
          Art.text(g, 'Na⁺(g) + Cl⁻(g)', 650, y + 44, { size: 26, alpha: seg(p, 0.2, 0.4) });
          Art.text(g, '+375: uphill!', 650, y + 86, { font: 'display', size: 36, color: C.red, alpha: seg(p, 0.3, 0.5) });
          Art.text(g, 'Na(s) + ½Cl₂(g)', 150, Ey(0) + 28, { size: 26 });
          Art.moe(g, 700, 442, 120, 'oops', { t, flip: true });
        },
      },
      {
        say: 'Now the ions rush together into a crystal. That releases a huge amount of energy, the <b>lattice energy</b>: <b>787 kJ/mol</b>. This is what pays the whole bill.',
        dur: 3.2,
        draw(g, p) {
          stair(g, 4, p, { dim: true });
          Art.text(g, 'Lattice energy', 690, 196, { font: 'display', size: 30, color: C.leaf, alpha: seg(p, 0.5, 0.75) });
          Art.text(g, 'Na(s) + ½Cl₂(g)', 150, Ey(0) + 28, { size: 26 });
        },
      },
      {
        say: 'Add it all up: $107 + 121 + 496 - 349 - 787 = -412$ kJ/mol, which matches the measured value of about <b>$-411$ kJ/mol</b>. Salt forms because the lattice is so stable, not just because of octets.',
        dur: 3.4,
        draw(g, p, t) {
          stair(g, 4, 1);
          const y = Ey(-412);
          Art.ring(g, 626, y, 26, { color: C.leaf, w: 5, p: seg(p, 0, 0.4) });
          g.strokeStyle = C.sun; g.lineWidth = 3; g.setLineDash([8, 7]);
          g.beginPath(); g.moveTo(40, y); g.lineTo(720, y); g.stroke(); g.setLineDash([]);
          Art.arrow(g, 46, Ey(0), 46, y, { color: C.sun, w: 8, head: 20, p: seg(p, 0.1, 0.5) });
          Art.text(g, '−412', 62, 330, { font: 'display', size: 36, color: C.sun, align: 'left', alpha: seg(p, 0.3, 0.6), halo: true });
          Art.text(g, 'overall', 148, 332, { size: 24, align: 'left', alpha: seg(p, 0.3, 0.6), halo: true });
          Art.text(g, 'NaCl(s)', 720, y + 28, { font: 'display', size: 30, alpha: seg(p, 0.3, 0.6) });
          Art.text(g, 'Na(s) + ½Cl₂(g)', 164, Ey(0) + 28, { size: 26 });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: Coulomb's law pull meter ---------- */
  const CATION = { 1: 'Na', 2: 'Mg', 3: 'Al' }, ANION = { 1: 'Cl', 2: 'O', 3: 'N' };
  const cl = { q1: 1, q2: 1, r: 300, shownF: 1, won: false };
  const forceRatio = () => ((cl.q1 * cl.q2) / (cl.r * cl.r)) / (1 / (300 * 300));
  const energyRatio = () => ((cl.q1 * cl.q2) / cl.r) / (1 / 300);
  Lab.stage('#c-coulomb', {
    h: 450, label: 'Two ions pulling on each other, with force arrows that grow with charge and shrink with distance.',
    draw(g, t, dt) {
      const F = forceRatio();
      cl.shownF = lerp(cl.shownF, F, clamp(dt * 7));
      const sep = cl.r * 0.95, cx = 400, y = 170;
      const x1 = cx - sep / 2, x2 = cx + sep / 2;
      const r1 = K.RADII[CATION[cl.q1]] * 0.44, r2 = K.RADII[ANION[cl.q2]] * 0.44;
      const w = clamp(3 + Math.sqrt(cl.shownF) * 4.2, 4, 28), L = clamp(30 + Math.sqrt(cl.shownF) * 26, 34, 150);
      const space = (sep - r1 - r2) / 2 - 6;
      const LL = Math.min(L, Math.max(24, space));
      const hum = 0.6 + Math.min(1.4, cl.shownF * 0.04);
      const jx = wander(1, t * 8) * hum * 0.5;
      const prevAlpha = clamp(cl.shownF / 12 + 0.05);
      g.fillStyle = Art.alpha(C.sun, Math.min(0.25, prevAlpha * 0.28)); g.fillRect(x1, y - w, sep, w * 2);
      Art.atom(g, x1 + jx, y, r1, CATION[cl.q1], { face: cl.shownF > 3 ? 'grin' : 'happy', t, look: [1, 0], charge: (cl.q1 > 1 ? cl.q1 : '') + '+' });
      Art.atom(g, x2 - jx, y, r2, ANION[cl.q2], { face: cl.shownF > 3 ? 'grin' : 'happy', t, look: [-1, 0], seed: 2, charge: (cl.q2 > 1 ? cl.q2 : '') + '-' });
      Art.arrow(g, x1 + r1 + 8, y, x1 + r1 + 8 + LL, y, { color: C.pink, w, head: w * 1.6 + 8 });
      Art.arrow(g, x2 - r2 - 8, y, x2 - r2 - 8 - LL, y, { color: C.pink, w, head: w * 1.6 + 8 });
      // Dimension line.
      const dy = 286;
      g.strokeStyle = 'rgba(247,242,255,.7)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x1, dy); g.lineTo(x2, dy); g.moveTo(x1, dy - 12); g.lineTo(x1, dy + 12); g.moveTo(x2, dy - 12); g.lineTo(x2, dy + 12); g.stroke();
      Art.text(g, cl.r + ' pm', cx, dy + 28, { font: 'display', size: 32, color: C.sun });
      // Force bar.
      const barX = 60, barW = 560, barY = 374;
      g.fillStyle = 'rgba(14,6,30,.72)'; Art.round(g, barX, barY, barW, 40, 14); g.fill();
      const frac = clamp(Math.log10(cl.shownF / 0.25) / Math.log10(36 / 0.25));
      const gr = g.createLinearGradient(barX, 0, barX + barW, 0); gr.addColorStop(0, C.cyan); gr.addColorStop(1, C.pink);
      g.fillStyle = gr; Art.round(g, barX + 3, barY + 3, Math.max(14, (barW - 6) * frac), 34, 12); g.fill();
      Art.text(g, 'Force', barX + 18, barY + 20, { size: 22, align: 'left', color: '#fff', halo: true });
      const f = forceRatio();
      Art.text(g, '× ' + (f >= 10 ? f.toFixed(0) : f.toFixed(1)), 700, barY + 20, { font: 'display', size: 44, color: C.sun });
      if (Math.abs(f - 9) < 0.02) { Art.text(g, 'Exactly 9 times!', cx, 50, { font: 'display', size: 40, color: C.leaf }); Art.moe(g, 94, 300, 110, 'cheer', { t }); }
    },
  });
  function paintCoulomb() {
    const f = forceRatio(), e = energyRatio();
    const kJ = (138935 * cl.q1 * cl.q2) / cl.r;
    Lab.$('#cl-f').textContent = '× ' + (f >= 10 ? f.toFixed(0) : f.toFixed(2));
    Lab.$('#cl-e').textContent = '× ' + (e >= 10 ? e.toFixed(0) : e.toFixed(2));
    Lab.$('#cl-k').textContent = '−' + Lab.sig(kJ, 3) + ' kJ/mol';
    Lab.$('#cl-say').innerHTML = Lab.texString(`<p>$\\dfrac{q_1 q_2}{r^2}$ compared to the start: $\\dfrac{(${cl.q1})(${cl.q2}) / ${cl.r}^2}{(1)(1) / 300^2} = ${f.toFixed(2)}$. Doubling a charge doubles the force, but doubling the distance cuts it to one quarter. The ions are named after real ones with those charges.</p>`);
    if (Math.abs(f - 9) < 0.02 && !cl.won) { cl.won = true; Lab.collection.award(1); Lab.sound.good(); }
  }
  Lab.bind('#cl-q1', '#cl-q1-out', (v) => `${CATION[v]}${v > 1 ? v : ''}+`, (v) => { cl.q1 = v; paintCoulomb(); });
  Lab.bind('#cl-q2', '#cl-q2-out', (v) => `${ANION[v]}${v > 1 ? v : ''}−`, (v) => { cl.q2 = v; paintCoulomb(); });
  Lab.bind('#cl-r', '#cl-r-out', (v) => v + ' pm', (v) => { cl.r = v; paintCoulomb(); });

  /* ---------- Bench: lattice energy duel ---------- */
  const duel = { pair: null, picked: null, t0: 0, streak: 0, best: 0 };
  function pickDuel() {
    const list = K.duels();
    const pair = list[Math.floor(Math.random() * list.length)];
    duel.pair = Math.random() < 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]];
    duel.picked = null; duel.t0 = duelStage ? duelStage.t : 0;
    const [a, b] = duel.pair;
    const host = Lab.$('#duel-btns');
    host.innerHTML = `<button type="button" class="btn ghost small" data-k="0">${Lab.fHTML(a.f)} is stronger</button><button type="button" class="btn ghost small" data-k="1">${Lab.fHTML(b.f)} is stronger</button>`;
    Lab.$('#duel-say').innerHTML = '<p>Compare the charges first. If they tie, the smaller ions win.</p>';
  }
  let duelStage = null;
  duelStage = Lab.stage('#c-duel', {
    h: 420, label: 'Two ionic compounds side by side with their ions to scale. After you pick, bars show the lattice energies.',
    draw(g, t, dt, s) {
      if (!duel.pair) return;
      Art.text(g, `Streak: ${duel.streak}`, s.W / 2, 32, { font: 'display', size: 28, color: C.sun });
      const age = t - duel.t0;
      duel.pair.forEach((salt, k) => {
        const cx = 200 + k * 400;
        const win = duel.picked !== null && salt.U === Math.max(duel.pair[0].U, duel.pair[1].U);
        g.fillStyle = win ? 'rgba(61,220,132,.12)' : 'rgba(14,6,30,.5)';
        Art.round(g, cx - 186, 52, 372, 356, 18); g.fill();
        g.strokeStyle = win ? C.leaf : 'rgba(247,242,255,.14)'; g.lineWidth = win ? 4 : 2; g.stroke();
        Art.formula(g, salt.f, cx, 90, { size: 48 });
        const scale = 0.34;
        const rm = K.RADII[salt.m] * scale, rx = K.RADII[salt.x] * scale, total = rm + rx;
        const y = 198, x1 = cx - total / 2 - 8, x2 = x1 + total;
        Art.atom(g, x1, y, rm, salt.m, { face: rm >= 18 ? 'happy' : null, t, charge: (salt.q > 1 ? salt.q : '') + '+', label: rm >= 18 ? salt.m : false });
        Art.atom(g, x2, y, rx, salt.x, { face: 'happy', t, seed: 2, charge: (salt.p > 1 ? salt.p : '') + '-' });
        Art.text(g, `${salt.q} × ${salt.p} = ${salt.q * salt.p}`, cx - 86, 296, { font: 'display', size: 28, color: C.pink });
        Art.text(g, 'charges', cx - 86, 324, { size: 20, color: C.dim });
        Art.text(g, salt.r + ' pm', cx + 86, 296, { font: 'display', size: 28, color: C.cyan });
        Art.text(g, 'apart', cx + 86, 324, { size: 20, color: C.dim });
        if (duel.picked !== null) {
          const q = ease.out(clamp(age * 1.6));
          const maxU = Math.max(duel.pair[0].U, duel.pair[1].U);
          const w = 320 * (salt.U / maxU) * q;
          g.fillStyle = 'rgba(14,6,30,.8)'; Art.round(g, cx - 164, 348, 328, 44, 14); g.fill();
          g.fillStyle = win ? C.leaf : C.dim; Art.round(g, cx - 160, 352, Math.max(16, w), 36, 12); g.fill();
          Art.text(g, `${salt.U} kJ/mol`, cx, 370, { size: 24, color: '#fff', halo: true, alpha: q });
        }
      });
    },
  });
  Lab.$('#duel-btns').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'duel-next') { pickDuel(); return; }
    if (duel.picked !== null) return;
    const k = +btn.dataset.k, [a, b] = duel.pair;
    const right = duel.pair[k].U === Math.max(a.U, b.U);
    duel.picked = k; duel.t0 = duelStage.t;
    if (right) {
      duel.streak++; Lab.sound.good();
      if (duel.streak === 5) { Lab.collection.award(1); Lab.confetti(); }
    } else { duel.streak = 0; Lab.sound.bad(); }
    Lab.$('#duel-say').innerHTML = `<p><b>${right ? 'Right.' : 'Not this time.'}</b> ${K.reason(a, b)} Measured values vary a little by source.</p>`;
    Lab.$('#duel-btns').innerHTML = '<button type="button" class="btn sun small" id="duel-next">Next duel</button>';
  });
  pickDuel();

  /* ---------- Bench: 3D sodium chloride ---------- */
  const latV = Chem3D.viewer('#v-lattice', { height: 460, distance: 9.5, label: 'A rotatable 3D unit cell of sodium chloride.' });
  const FACES = [[1.2, 0, 0], [-1.2, 0, 0], [0, 1.2, 0], [0, -1.2, 0], [0, 0, 1.2], [0, 0, -1.2]];
  function paintLattice(view) {
    const T = window.THREE;
    Lab.$('#lat-na').textContent = view === 'count' ? '12 × ¼ + 1 = 4' : '4';
    Lab.$('#lat-cl').textContent = view === 'count' ? '8 × ⅛ + 6 × ½ = 4' : '4';
    const SAY = {
      cell: '<p>This is one repeating box of the crystal. The <b>green</b> balls are the bigger $\\ce{Cl-}$ ions and the <b>purple</b> balls are the smaller $\\ce{Na+}$ ions. Every line of atoms alternates between the two.</p>',
      six: '<p>The $\\ce{Na+}$ in the center touches <b>6</b> $\\ce{Cl-}$ neighbors, and it is not bonded to any one of them more than the others. Each $\\ce{Cl-}$ has 6 $\\ce{Na+}$ neighbors in the same way. This is why there is no NaCl molecule.</p>',
      count: '<p>Ions on the outside are shared with neighboring boxes. A corner is shared by 8 boxes, an edge by 4, and a face by 2. The center is all ours. Count them: <b>4 of each</b>, so a 1 to 1 ratio, and the formula is $\\ce{NaCl}$.</p>',
    };
    Lab.$('#lat-say').innerHTML = Lab.texString(SAY[view]);
    if (!latV.ok) return;
    latV.lattice('nacl');
    latV.setDistance(7.9);
    const group = latV.root.children[0];
    const naLab = { p: [1.2, 1.2, 0], text: 'Na⁺' }, clLab = { p: [1.2, 0, 0], text: 'Cl⁻' };
    if (view === 'cell') latV.labels([{ ...naLab, p: [1.2, 1.2, 0.2] }, { ...clLab, p: [1.2, 0, 0.3] }]);
    if (view === 'six') {
      group.children.forEach((m) => {
        if (!m.isMesh) return;
        const p = m.position, isCenter = p.length() < 0.01, isFace = FACES.some((f) => Math.hypot(f[0] - p.x, f[1] - p.y, f[2] - p.z) < 0.01);
        if (!isCenter && !isFace) { m.material.transparent = true; m.material.opacity = 0.16; m.material.depthWrite = false; }
      });
      FACES.forEach((f) => {
        const A = new T.Vector3(0, 0, 0), B = new T.Vector3(...f);
        const mesh = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, A.distanceTo(B), 16), new T.MeshBasicMaterial({ color: '#FFD23F' }));
        mesh.position.copy(B).multiplyScalar(0.5);
        mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().normalize());
        latV.add(mesh);
      });
      latV.labels([{ p: [0, 0, 0], text: 'Na⁺' }, { p: [0, 1.75, 0], text: 'Cl⁻' }]);
    }
    if (view === 'count') latV.labels([{ p: [1.2, 1.2, 1.2], text: 'corner ⅛' }, { p: [1.2, 0, 0], text: 'face ½' }, { p: [-1.2, -1.2, 0], text: 'edge ¼' }, { p: [0, 0, 0], text: 'center 1' }]);
  }
  Lab.segmented('#lat-view', paintLattice);
  paintLattice('cell');

  /* ---------- Bench: crystal and hammer ---------- */
  const COLS = 10, ROWS = 5, SP = 66;
  const ham = { s: 0, slider: 0, split: 0, hitT: -1, broken: false };
  const hamStage = Lab.stage('#c-hammer', {
    h: 450, label: 'A sheet of alternating positive and negative ions, split into two blocks when the top layers slide by one ion.',
    draw(g, t, dt) {
      // Timeline: the hammer drives the slide.
      if (ham.hitT >= 0) {
        ham.hitT += dt;
        ham.s = ease.inOut(seg(ham.hitT, 0.32, 0.85));
        if (ham.hitT > 1.2) { ham.slider = 100; Lab.$('#ham-s').value = 100; Lab.paintRange && Lab.paintRange(Lab.$('#ham-s')); paintHammer(); ham.hitT = -1; }
      } else ham.s = lerp(ham.s, ham.slider / 100, clamp(dt * 12));
      const aligned = seg(ham.s, 0.8, 0.98);
      ham.split = aligned >= 1 ? clamp(ham.split + dt * 1.1) : clamp(ham.split - dt * 3);
      const sp = ease.inOut(ham.split);
      const x0 = 400 - ((COLS - 1) * SP) / 2 - 26, y0 = 158;
      const topRows = 2;
      const dx = ham.s * SP;
      // Interface force marks.
      if (sp < 0.5) {
        for (let i = 0; i < COLS; i++) {
          const xLow = x0 + i * SP, y1 = y0 + (topRows - 1) * SP, y2 = y0 + topRows * SP;
          const att = 1 - seg(ham.s, 0.1, 0.45), rep = aligned * (1 - sp * 2);
          if (att > 0) {
            g.strokeStyle = Art.alpha(C.leaf, 0.7 * att); g.lineWidth = 5;
            g.beginPath(); g.moveTo(xLow + dx, y1 + 18); g.lineTo(xLow, y2 - 18); g.stroke();
          }
          if (rep > 0 && i < COLS) {
            const X = xLow + dx - SP * 0;
            Art.arrow(g, X - SP * 0 + (ham.s > 0.5 ? 0 : 0) - dx + SP * 0 + dx, (y1 + y2) / 2 - 4, X - dx + dx, y1 + 16, { color: C.red, w: 4, head: 11, alpha: rep });
            Art.arrow(g, X - dx + dx, (y1 + y2) / 2 + 4, X - dx + dx, y2 - 16, { color: C.red, w: 4, head: 11, alpha: rep });
          }
        }
      }
      // Ions.
      for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
        const top = j < topRows;
        const na = (i + j) % 2 === 0;
        const shake = wander(i * 3 + j, t * (ham.hitT >= 0 ? 8 : 1.6)) * (ham.hitT >= 0 ? 2.5 : 1);
        const x = x0 + i * SP + (top ? dx + sp * 18 : 0) + shake;
        const y = y0 + j * SP + (top ? -sp * 62 : 0) + wander(i + j * 5, t * 1.6);
        const r = na ? 19 : 27;
        const faceOn = (j === topRows - 1 || j === topRows) && i >= 3 && i <= 5;
        Art.atom(g, x, y, r, na ? 'Na' : 'Cl', { label: faceOn ? (na ? 'Na' : 'Cl') : na ? '+' : '−', face: faceOn ? (aligned > 0.5 ? 'grumpy' : 'happy') : null, t, seed: i + j });
      }
      if (sp > 0.25) {
        const y = y0 + (topRows - 0.5) * SP - sp * 30;
        g.strokeStyle = Art.alpha(C.red, sp); g.lineWidth = 4; g.setLineDash([10, 8]);
        g.beginPath(); g.moveTo(x0 - 40, y); g.lineTo(x0 + (COLS - 1) * SP + 60, y); g.stroke(); g.setLineDash([]);
      }
      // The hammer.
      const hit = ham.hitT;
      const show = hit >= 0 ? 1 - seg(hit, 0.9, 1.15) : 0;
      if (show > 0) {
        const swing = ease.in(seg(hit, 0, 0.3));
        const hx = lerp(-90, x0 - 66, swing) + ham.s * SP * 0.8, hy = y0 + SP * 0.5;
        g.save(); g.globalAlpha *= show; g.translate(hx, hy);
        g.fillStyle = '#7B5233'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
        Art.round(g, -130, -9, 130, 18, 7); g.fill(); g.stroke();
        const m = g.createLinearGradient(0, -38, 0, 38); m.addColorStop(0, '#D6DAE4'); m.addColorStop(1, '#6A7382');
        g.fillStyle = m; Art.round(g, -14, -38, 48, 76, 8); g.fill(); g.stroke();
        g.restore();
        Art.burst(g, x0 - 28, y0 + SP * 0.5, seg(hit, 0.3, 0.75), { r: 86 });
      }
      // Headline.
      const msg = aligned > 0.5 ? 'Like charges face each other!' : ham.s < 0.1 ? 'Opposites face each other' : 'Sliding';
      Art.text(g, msg, 400, 34, { font: 'display', size: 36, color: aligned > 0.5 ? C.red : ham.s < 0.1 ? C.leaf : C.sun, halo: true });
    },
  });
  function paintHammer() {
    Lab.$('#ham-s-out').textContent = ham.slider >= 100 ? 'one whole ion' : ham.slider === 0 ? 'in place' : Math.round(ham.slider) + '% of an ion';
    const say = ham.slider >= 80 ? 'Slide by one ion and <b>positive sits on positive, negative on negative</b>. Those layers now push apart, and the crystal snaps cleanly along the plane. This is why ionic solids are <b>brittle</b>, even though they are hard.'
      : ham.slider < 10 ? 'Each ion in the top layers sits above an opposite ion. The green lines show attraction across the plane. This crystal is strong and hard.'
        : 'Halfway through a slide, attractions weaken. Keep going to one whole ion.';
    Lab.$('#ham-say').innerHTML = `<p>${say}</p>`;
  }
  Lab.bind('#ham-s', null, null, (v) => { ham.slider = v; ham.hitT = -1; paintHammer(); });
  Lab.$('#ham-hit').addEventListener('click', () => { ham.hitT = 0; ham.slider = 0; ham.s = 0; ham.split = 0; Lab.$('#ham-s').value = 0; if (Lab.paintRange) Lab.paintRange(Lab.$('#ham-s')); Lab.sound.pop(); hamStage.redraw(); });
  Lab.$('#ham-reset').addEventListener('click', () => { ham.hitT = -1; ham.slider = 0; Lab.$('#ham-s').value = 0; if (Lab.paintRange) Lab.paintRange(Lab.$('#ham-s')); paintHammer(); });

  /* ---------- Bench: conductivity ---------- */
  const cond = { state: 'solid', f: 0, heat: 0, water: 0 };
  const IONS = Array.from({ length: 16 }, (_, i) => ({ i, na: i % 2 === 0, seed: rand(i * 3.7), row: Math.floor(i / 4), col: i % 4 }));
  Lab.stage('#c-cond', {
    h: 450, bg: 'lab', label: 'Sodium chloride between two electrodes wired to a battery and a bulb that lights only when ions can move.',
    draw(g, t, dt, s) {
      const mobile = cond.state === 'solid' ? 0 : 1;
      cond.f = lerp(cond.f, mobile, clamp(dt * 2.2));
      cond.heat = lerp(cond.heat, cond.state === 'molten' ? 1 : 0, clamp(dt * 2.5));
      cond.water = lerp(cond.water, cond.state === 'water' ? 1 : 0, clamp(dt * 2.5));
      const f = cond.f, benchY = s.H - 70;
      const cx = 400, w = 400, baseY = benchY - 8, h = 260;
      const x0 = cx - w / 2 + 26, x1 = cx + w / 2 - 26, top = baseY - h + 42;
      // Burner under the melt.
      if (cond.heat > 0.05) {
        Art.flame(g, cx - 110, baseY + 2, 22 * cond.heat, t, { kind: 'blue', wide: true });
        Art.flame(g, cx + 110, baseY + 2, 22 * cond.heat, t, { kind: 'blue', wide: true });
      }
      const liquid = cond.state === 'water' || cond.water > 0.5 ? C.water : '#FF9A3D';
      const level = clamp(Math.max(cond.heat, cond.water)) * 0.72;
      Art.beaker(g, cx, baseY, w, h, { level, liquid, ticks: false });
      // Wires, battery, bulb.
      const elX = [cx - 160, cx + 160];
      elX.forEach((x, k) => {
        g.fillStyle = '#6A7382'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
        Art.round(g, x - 11, top - 66, 22, baseY - top + 40, 5); g.fill(); g.stroke();
        Art.text(g, k === 0 ? '−' : '+', x, top - 88, { font: 'display', size: 38, color: k === 0 ? '#6EC6FF' : '#FF7AB8', halo: true });
      });
      g.strokeStyle = '#C9C7DB'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(elX[0], top - 66); g.lineTo(elX[0], 40); g.lineTo(cx - 44, 40); g.moveTo(cx + 44, 40); g.lineTo(elX[1], 40); g.lineTo(elX[1], top - 66); g.stroke();
      // Moving electrons in the wire when current flows.
      if (f > 0.3) {
        const L = (top - 66 - 40) + (elX[0] * -1 + cx - 44) ;
        for (let i = 0; i < 6; i++) {
          const u = ((t * 0.35 + i / 6) % 1);
          const seg1 = 0.5;
          // Electrons leave the positive electrode side, up and over, through the bulb.
          let x, y;
          if (u < seg1) { const a = u / seg1; x = lerp(elX[1], cx + 44, seg(a, 0.45, 1)); y = lerp(top - 66, 40, seg(a, 0, 0.45)); }
          else { const a = (u - seg1) / seg1; x = lerp(cx - 44, elX[0], seg(a, 0, 0.55)); y = lerp(40, top - 66, seg(a, 0.55, 1)); }
          eDot(g, x, y, 5.4, clamp((f - 0.3) * 2));
        }
        void L;
      }
      Art.bulb(g, cx, 48, 40, f);
      // Battery, on the wire to the negative electrode.
      g.fillStyle = '#3B414D'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      Art.round(g, cx - 122, 24, 56, 32, 6); g.fill(); g.stroke();
      g.fillStyle = C.sun; g.fillRect(cx - 80, 24, 14, 32); g.strokeRect(cx - 80, 24, 14, 32);
      // Ions.
      const solidX = (ion) => cx + (ion.col - 1.5) * 50, solidY = (ion) => baseY - 30 - (3 - ion.row) * 48;
      IONS.forEach((ion) => {
        const dir = ion.na ? -1 : 1;
        const span = x1 - x0;
        const fx = x0 + (((ion.seed * span + dir * t * 26 * (0.8 + ion.seed * 0.5)) % span) + span) % span;
        const fy = lerp(baseY - 26, top + 10, rand(ion.i * 5.1)) + wander(ion.i, t * 1.1) * 12;
        const shakeA = f < 0.5 ? 1.8 : 0;
        const x = lerp(solidX(ion) + wander(ion.i * 2, t * 4) * shakeA, fx, ease.inOut(f));
        const y = lerp(solidY(ion) + wander(ion.i * 3, t * 4) * shakeA, fy, ease.inOut(f));
        const r = ion.na ? 15 : 23;
        Art.atom(g, x, y, r, ion.na ? 'Na' : 'Cl', { label: ion.na ? '+' : '−' });
      });
      // Water molecules, only in solution.
      if (cond.water > 0.2) {
        for (let i = 0; i < 9; i++) {
          const x = x0 + rand(i * 7.3) * (x1 - x0) + wander(i + 30, t * 0.7) * 10, y = lerp(baseY - 24, top + 8, rand(i * 3.1)) + wander(i + 40, t * 0.7) * 8;
          Art.molecule(g, x, y, 14, 'H2O', { style: 'fill', atomScale: 1.2, rot: rand(i) * 6 + t * 0.4, labels: false, alpha: cond.water * 0.82 });
        }
      }
      // Labels.
      const title = cond.state === 'solid' ? 'Ions locked in place' : cond.state === 'molten' ? 'Ions drift to the electrodes' : 'Ions drift to the electrodes';
      Art.text(g, title, 400, 138, { font: 'display', size: 32, color: cond.state === 'solid' ? C.red : C.leaf, halo: true });
      Art.text(g, f > 0.5 ? 'Bulb on' : 'Bulb off', 652, 48, { font: 'display', size: 34, color: f > 0.5 ? C.sun : C.dim, halo: true });
      if (cond.heat > 0.5) Art.text(g, '801 °C', 672, 150, { font: 'display', size: 38, color: C.fire, halo: true });
      Art.text(g, 'Na⁺ goes to −', 112, benchY + 34, { size: 24, color: '#E8D4FF', alpha: f });
      Art.text(g, 'Cl⁻ goes to +', 690, benchY + 34, { size: 24, color: '#B9F3D4', alpha: f });
    },
  });
  function paintCond(v) {
    const SAY = {
      solid: '<p>All the charges are here, but they are stuck in the lattice. Nothing can move toward the electrodes, so no current flows. <b>Solid ionic compounds do not conduct.</b></p>',
      molten: '<p>Melting breaks up the lattice. $\\ce{Na+}$ now drifts to the negative electrode and $\\ce{Cl-}$ drifts to the positive one. <b>Moving ions carry the current</b>, and the bulb lights.</p>',
      water: '<p>Water pulls the ions out of the lattice, so they can move here too. This is why salt water conducts and pure water barely does. More on this in the solutions lesson.</p>',
    };
    Lab.$('#cond-say').innerHTML = Lab.texString(SAY[v]);
  }
  Lab.segmented('#cond-state', (v) => { cond.state = v; paintCond(v); });
  paintCond('solid');
  paintHammer();
});
