/* Lesson 2.4: Ions and compounds. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const K = Bank.all.compounds.kit;
  const PLUS = '#D62D7E', MINUS = '#1178B8';
  const bright = (col) => (Art.lum(col) < 0.42 ? Art.mix(col, '#ffffff', 0.5) : col);

  /** Art.formula, but keeps formulas with carbon in plain ink, since dark carbon is hard to read on the stage. */
  const F = (g, f, x, y, o = {}) => Art.formula(g, f, x, y, Object.assign({}, o, { colorize: o.colorize && !/C(?![a-z])/.test(f) }));
  /* ---------- Labels and ion drawings ---------- */
  const uni = (f) => f.replace(/\d/g, (c) => '₀₁₂₃₄₅₆₇₈₉'[+c]);
  const supQ = (q) => `${Math.abs(q) > 1 ? '⁰¹²³⁴'[Math.abs(q)] : ''}${q > 0 ? '⁺' : '⁻'}`;
  const ionLabel = (ion) => uni(ion.f) + supQ(ion.q);
  const qText = (q) => `${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '-'}`;
  function badge(g, x, y, br, str) {
    const pos = /\+/.test(str);
    g.fillStyle = pos ? '#FF3D7F' : '#1FA5FF'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, br, 0, TAU); g.fill(); g.stroke();
    g.font = `700 ${br * 1.26}px ${Art.FONT_BODY}`;
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(str.replace('-', '−'), x, y + 0.5);
  }
  /** Draws any ion: a single atom, a little cluster for a polyatomic ion, or a capsule if the shape is too fiddly. */
  function ionArt(g, x, y, r, ion, o = {}) {
    if (!ion.poly) {
      Art.atom(g, x, y, r * (ion.q > 0 ? 0.86 : 1.08), ion.f, { face: o.face, t: o.t, seed: o.seed, look: o.look, charge: o.noBadge ? null : qText(ion.q) });
      return;
    }
    const br = Math.max(11, r * 0.4);
    if (ion.art) {
      const [c, l, n] = ion.art;
      if (n === 1) {
        const d = r * 0.5, rr = r * 0.54;
        Art.bond(g, x - d, y, x + d, y, { width: Math.max(3, r * 0.12) });
        Art.atom(g, x - d, y, rr, c, { face: o.face, t: o.t, seed: o.seed, label: r >= 22 ? c : false });
        Art.atom(g, x + d, y, l === 'H' ? rr * 0.72 : rr, l, { label: r >= 22 ? l : false });
      } else {
        const d = r * 0.78, lr = (l === 'H' ? 0.32 : 0.4) * r, cr = r * 0.46;
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + (i / n) * TAU + (o.rot || 0);
          Art.bond(g, x, y, x + Math.cos(a) * d, y + Math.sin(a) * d, { width: Math.max(2.5, r * 0.09) });
        }
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + (i / n) * TAU + (o.rot || 0);
          Art.atom(g, x + Math.cos(a) * d, y + Math.sin(a) * d, lr, l, { label: lr >= 12 ? l : false });
        }
        Art.atom(g, x, y, cr, c, { face: o.face, t: o.t, seed: o.seed, label: cr >= 20 ? c : o.face ? false : (cr >= 11 ? c : false) });
      }
    } else {
      g.fillStyle = C.plum2; g.strokeStyle = '#8F76C2'; g.lineWidth = 3;
      Art.round(g, x - r * 1.1, y - r * 0.62, r * 2.2, r * 1.24, r * 0.5); g.fill(); g.stroke();
      F(g, ion.f, x, y, { size: Math.max(16, r * 0.54), colorize: true });
    }
    if (!o.noBadge) badge(g, x + r * 0.84, y - r * 0.84, br, qText(ion.q));
  }
  /** A checkerboard of Na+ and Cl-. reveal (0..1) grows it from the center outward. */
  function lattice(g, cx, cy, nx, ny, sp, reveal, t, o = {}) {
    const rr = Math.hypot((nx - 1) / 2, (ny - 1) / 2) || 1;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const dx = i - (nx - 1) / 2, dy = j - (ny - 1) / 2;
      const d = Math.hypot(dx, dy) / rr;
      const q = ease.back(clamp(reveal * 1.6 - d * 0.6));
      if (q <= 0) continue;
      const na = (i + j) % 2 === (o.flip ? 1 : 0);
      const x = cx + dx * sp + wander(i * 3 + j, t) * 1.6, y = cy + dy * sp + wander(i + j * 5, t) * 1.6;
      Art.atom(g, x, y, (na ? sp * 0.3 : sp * 0.46) * q, na ? 'Na' : 'Cl', { label: o.labels ? (na ? 'Na' : 'Cl') : false, alpha: o.alpha ? o.alpha(i, j) : 1 });
    }
  }

  /* ---------- Story 1: two kinds of compound ---------- */
  function saltPile(g, x, y) {
    for (let i = 0; i < 40; i++) {
      const a = rand(i) * 2 - 1, h = rand(i + 2);
      const px = x + a * 96 * (1 - h * 0.7), py = y - h * 62 - rand(i + 8) * 8;
      const s = 12 + rand(i + 5) * 9;
      g.fillStyle = i % 3 ? '#FFFFFF' : '#DDD9EC'; g.strokeStyle = 'rgba(26,15,46,.4)'; g.lineWidth = 1.5;
      g.save(); g.translate(px, py); g.rotate(rand(i + 9) * 0.5);
      g.fillRect(-s / 2, -s / 2, s, s); g.strokeRect(-s / 2, -s / 2, s, s);
      g.restore();
    }
  }
  Lab.story('#story-kinds', {
    title: 'Hand it over, or share it',
    scenes: [
      {
        say: 'Sodium, a metal, gives one electron to chlorine, a nonmetal. Sodium becomes a <b>cation</b>, a positive ion. Chlorine becomes an <b>anion</b>, a negative ion. Notice they also change size.',
        dur: 4.2,
        draw(g, p, t, { W, H }) {
          const q = ease.inOut(seg(p, 0.24, 0.62));
          const done = q >= 0.98;
          const cy = H / 2 - 12;
          const rNa = lerp(92, 58, q), rCl = lerp(66, 102, q);
          const xNa = 220, xCl = 570;
          Art.atom(g, xNa, cy, rNa, 'Na', { face: done ? 'happy' : 'wink', t, look: [1, 0], charge: done ? '+' : null, seed: 1 });
          Art.atom(g, xCl, cy, rCl, 'Cl', { face: done ? 'happy' : 'grumpy', t, look: [-1, 0], charge: done ? '-' : null, seed: 2 });
          if (q > 0 && !done) {
            const x = lerp(xNa + rNa, xCl - rCl, q), y = cy - Math.sin(q * Math.PI) * 120;
            Art.electron(g, x, y, 13);
            Art.text(g, 'one electron', x, y - 34, { size: 25, color: C.cyan, halo: true });
          } else if (!done) { Art.electron(g, xNa + rNa * 0.72, cy - rNa * 0.72, 12); }
          Art.text(g, done ? 'Na⁺ cation' : 'sodium atom', xNa, H - 66, { font: 'display', size: 34, color: done ? C.pink : Art.elementColor('Na') });
          Art.text(g, done ? 'Cl⁻ anion' : 'chlorine atom', xCl, H - 66, { font: 'display', size: 34, color: done ? C.cyan : Art.elementColor('Cl') });
          Art.text(g, done ? 'lost an electron' : '', xNa, H - 28, { size: 25, alpha: done ? 1 : 0 });
          Art.text(g, done ? 'gained an electron' : '', xCl, H - 28, { size: 25, alpha: done ? 1 : 0 });
          void W;
        },
      },
      {
        say: 'Opposite charges attract, in every direction. So trillions of ions lock into a neat, repeating pattern called a <b>crystal lattice</b>. That is what a grain of salt is.',
        dur: 4,
        draw(g, p, t, { H }) {
          Art.bench(g, 800, H - 56, 56);
          saltPile(g, 180, H - 56);
          Art.text(g, 'table salt', 180, H - 26, { font: 'display', size: 28 });
          Art.zoom(g, 200, H - 110, 540, 192, 178, (gg, cx, cy) => {
            lattice(gg, cx, cy, 7, 7, 58, seg(p, 0.2, 0.95), t);
          }, { p: seg(p, 0.04, 0.2) });
          Art.text(g, 'Na⁺ and Cl⁻, stacked', 540, H - 42, { size: 27, color: C.sun, alpha: seg(p, 0.7, 0.9), halo: true });
        },
      },
      {
        say: 'So look for one sodium\'s partner. There is no such thing. Every ion is pulled equally by all its neighbors. The formula $\\ce{NaCl}$ is only a <b>ratio</b>, one to one. We call that a <b>formula unit</b>.',
        dur: 4.6,
        draw(g, p, t, { W }) {
          const sp = 78, cx = W / 2, cy = 252;
          const a = seg(p, 0.1, 0.3);
          const near = (i, j) => Math.abs(i - 4) + Math.abs(j - 2) <= 1;
          lattice(g, cx, cy, 9, 5, sp, 1, t, { flip: true, alpha: (i, j) => (near(i, j) ? 1 : 1 - a * 0.6), labels: true });
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            Art.arrow(g, cx + dx * sp * 0.74, cy + dy * sp * 0.74, cx + dx * sp * 0.36, cy + dy * sp * 0.36, { color: C.sun, w: 6, p: seg(p, 0.25, 0.45), head: 15 });
          }
          Art.ring(g, cx, cy, 34, { color: C.sun, p: seg(p, 0.1, 0.25), w: 5 });
          const c = seg(p, 0.66, 0.84);
          if (c < 0.5) Art.text(g, 'Which Cl⁻ is its partner?', cx, 32, { font: 'display', size: 36, color: C.sun, alpha: seg(p, 0.46, 0.6) });
          else Art.text(g, 'All of them. 1 Na⁺ for every 1 Cl⁻', cx, 32, { font: 'display', size: 36, color: C.leaf });
        },
      },
      {
        say: 'Now take nonmetals, such as hydrogen and oxygen. They <b>share</b> electrons, and that makes a <b>molecule</b>: a real, separate particle. Water is a crowd of these, each one a whole unit.',
        dur: 4,
        draw(g, p, t, { H }) {
          Art.bench(g, 800, H - 56, 56);
          Art.beaker(g, 170, H - 56, 200, 230, { level: 0.76, liquid: C.water, ticks: false });
          Art.text(g, 'water', 170, H - 26, { font: 'display', size: 28 });
          Art.zoom(g, 210, H - 170, 540, 192, 178, (gg, cx, cy, R) => {
            const pts = Sim2(10);
            pts.forEach(([u, v], i) => {
              const x = cx + u * R * 0.8 + wander(i, t * 0.8) * 9, y = cy + v * R * 0.8 + wander(i + 20, t * 0.8) * 9;
              Art.molecule(gg, x, y, 38, 'H2O', { rot: rand(i * 3) * 6.28 + Math.sin(t * 0.6 + i) * 0.5, labels: false, style: 'fill', atomScale: 1.26, face: i === 4 ? 'happy' : null, t });
            });
          }, { p: seg(p, 0.08, 0.3) });
          Art.text(g, 'separate molecules', 540, H - 42, { size: 27, color: C.sun, alpha: seg(p, 0.6, 0.8), halo: true });
        },
      },
      {
        say: 'A molecular formula is a <b>real count</b>. Each water molecule has exactly 2 H and 1 O. An ionic formula is only a ratio. That difference is the heart of this lesson.',
        dur: 4,
        draw(g, p, t, { H }) {
          const col = (x, a, title, f, lines, draw) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a; g.translate(0, (1 - a) * 16);
            g.fillStyle = C.plum2; Art.round(g, x - 186, 18, 372, H - 36, 24); g.fill();
            Art.text(g, title, x, 54, { font: 'display', size: 34, color: C.sun });
            draw(x, 150);
            F(g, f, x, 250, { size: 42, colorize: true });
            lines.forEach((l, i) => Art.text(g, l, x, 298 + i * 36, { size: 24 }));
            g.restore();
          };
          col(208, ease.out(seg(p, 0.05, 0.3)), 'Ionic', 'NaCl', ['metal + nonmetal', 'electrons hand over', 'formula is a ratio'], (x, y) => {
            lattice(g, x, y, 5, 3, 46, 1, t);
          });
          col(592, ease.out(seg(p, 0.45, 0.7)), 'Molecular', 'H2O', ['only nonmetals', 'electrons are shared', 'formula is a real count'], (x, y) => {
            Art.molecule(g, x, y, 62, 'H2O', { face: 'happy', t });
          });
        },
      },
    ],
  });
  function Sim2(n) { // Even, stable points in a unit disk, for pure scenes.
    return Array.from({ length: n }, (_, i) => { const a = i * 2.39996, d = Math.sqrt((i + 0.5) / n); return [Math.cos(a) * d, Math.sin(a) * d]; });
  }

  /* ---------- Bench: the pull test ---------- */
  const TUG = { W: 800, H: 450 };
  const tug = { mode: 'ionic', ions: [], mols: [], grab: null, pulled: 0, t: 0 };
  (function buildTug() {
    const sp = 88, spY = 79, nx = 8, ny = 5;
    const x0 = (TUG.W - (nx - 1) * sp) / 2, y0 = 100;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const hx = x0 + i * sp, hy = y0 + j * spY;
      tug.ions.push({ i, j, hx, hy, x: hx, y: hy, vx: 0, vy: 0, na: (i + j) % 2 === 0 });
    }
    for (let k = 0; k < 9; k++) {
      const [u, v] = Sim2(9)[k];
      tug.mols.push({ x: 400 + u * 300, y: 225 + v * 160, vx: (rand(k) - 0.5) * 34, vy: (rand(k + 3) - 0.5) * 34, rot: rand(k + 7) * 6.28, vr: (rand(k + 5) - 0.5) * 0.9, mood: 'happy' });
    }
  })();
  const neighbors = (a) => tug.ions.filter((b) => Math.abs(a.i - b.i) + Math.abs(a.j - b.j) === 1);
  const tugStage = Lab.stage('#c-tug', {
    h: TUG.H, drag: true,
    label: 'A grid of sodium and chloride ions, or a group of water molecules. Drag one to see how strongly it is tied to its neighbors.',
    onPointer(e) {
      if (e.type === 'hover') {
        tugStage.canvas.style.cursor = (tug.mode === 'ionic' ? tug.ions : tug.mols).some((a) => Math.hypot(a.x - e.x, a.y - e.y) < 46) ? 'grab' : 'default';
        return;
      }
      if (e.type === 'down') {
        const list = tug.mode === 'ionic' ? tug.ions : tug.mols;
        let best = null, bd = 56;
        list.forEach((a) => { const d = Math.hypot(a.x - e.x, a.y - e.y); if (d < bd) { bd = d; best = a; } });
        if (best) { tug.grab = best; tug.px = e.x; tug.py = e.y; Lab.sound.pop(); paintTug(); }
      } else if (e.type === 'move' && tug.grab) { tug.px = e.x; tug.py = e.y; }
      else if (e.type === 'up') { tug.grab = null; paintTug(); }
    },
    draw(g, t, dt) {
      tug.t = t;
      const h = Math.min(dt, 0.033);
      if (tug.mode === 'ionic') {
        const grab = tug.grab;
        for (let it = 0; it < 2; it++) {
          tug.ions.forEach((a) => {
            if (a === grab) return;
            let ax = -60 * (a.x - a.hx), ay = -60 * (a.y - a.hy);
            neighbors(a).forEach((b) => { ax += 70 * ((b.x - b.hx) - (a.x - a.hx)); ay += 70 * ((b.y - b.hy) - (a.y - a.hy)); });
            a.vx = (a.vx + ax * h * 0.5) * 0.94; a.vy = (a.vy + ay * h * 0.5) * 0.94;
            a.x += a.vx * h * 0.5; a.y += a.vy * h * 0.5;
          });
        }
        if (grab) {
          const dx = tug.px - grab.hx, dy = tug.py - grab.hy, d = Math.hypot(dx, dy) || 1, max = 118;
          const k = d > max ? max + (d - max) * 0.08 : d;
          grab.x = grab.hx + (dx / d) * k; grab.y = grab.hy + (dy / d) * k;
        }
        const nearSet = grab ? neighbors(grab) : [];
        // Attraction lines, drawn behind the ions.
        nearSet.forEach((b) => {
          const stretch = clamp((Math.hypot(b.x - grab.x, b.y - grab.y) - 88) / 90);
          g.strokeStyle = Art.mix(C.sun, C.red, stretch); g.lineWidth = lerp(6, 3, stretch); g.setLineDash([3, 8]); g.lineCap = 'round';
          g.beginPath(); g.moveTo(grab.x, grab.y); g.lineTo(b.x, b.y); g.stroke(); g.setLineDash([]);
        });
        tug.ions.forEach((a) => {
          if (a === grab) return;
          const isN = nearSet.includes(a);
          const dim = grab && !isN;
          Art.atom(g, a.x, a.y, a.na ? 27 : 40, a.na ? 'Na' : 'Cl', { label: a.na ? 'Na' : 'Cl', alpha: dim ? 0.55 : 1, face: isN ? 'grumpy' : null, t, look: grab ? [clamp((grab.x - a.x) / 80, -1, 1), clamp((grab.y - a.y) / 80, -1, 1)] : [0, 0], charge: isN || !grab ? (a.na ? '+' : '-') : null, seed: a.i + a.j });
        });
        if (grab) Art.atom(g, grab.x, grab.y, grab.na ? 30 : 42, grab.na ? 'Na' : 'Cl', { face: 'wow', t, charge: grab.na ? '+' : '-', glow: 1 });
        if (grab) Art.text(g, `Pulled equally by ${nearSet.length} neighbors`, 400, 26, { font: 'display', size: 30, color: C.sun, halo: true });
        else Art.text(g, 'Grab an ion and pull', 400, 26, { font: 'display', size: 30, halo: true });
      } else {
        tug.mols.forEach((m, i) => {
          if (m === tug.grab) {
            m.x = lerp(m.x, tug.px, clamp(dt * 18)); m.y = lerp(m.y, tug.py, clamp(dt * 18));
          } else {
            m.x += m.vx * h; m.y += m.vy * h; m.rot += m.vr * h;
            if (m.x < 50 || m.x > TUG.W - 50) m.vx *= -1;
            if (m.y < 70 || m.y > TUG.H - 50) m.vy *= -1;
            m.x = clamp(m.x, 40, TUG.W - 40); m.y = clamp(m.y, 60, TUG.H - 40);
            tug.mols.forEach((o, j) => {
              if (j <= i) return;
              const dx = o.x - m.x, dy = o.y - m.y, d = Math.hypot(dx, dy) || 1;
              if (d < 96) { const f = ((96 - d) / d) * h * 1.6; m.x -= dx * f; m.y -= dy * f; if (o !== tug.grab) { o.x += dx * f; o.y += dy * f; } }
            });
          }
          const on = m === tug.grab;
          if (on) Art.glow(g, m.x, m.y, 92, C.sun, 0.45);
          Art.molecule(g, m.x, m.y, on ? 56 : 48, 'H2O', { rot: m.rot, face: on ? 'grin' : i % 3 === 0 ? 'happy' : null, t, seed: i, labels: true });
        });
        Art.text(g, tug.grab ? 'All three atoms come along as one unit' : 'Grab a molecule and pull', 400, 26, { font: 'display', size: 30, color: tug.grab ? C.sun : C.ink, halo: true });
      }
    },
  });
  function paintTug() {
    Lab.$('#tug-foot').innerHTML = tug.mode === 'ionic'
      ? '<p>An ion sits among its opposites, and they all tug at once. Let go and it <b>snaps back</b>. In this flat picture it has 4 neighbors, and in a real 3D crystal it has 6. No sodium owns any one chloride, so there is no such thing as a molecule of salt. A simplified 2D model.</p>'
      : '<p>Each water molecule is held together by strong shared-electron bonds, and those stay intact. Between molecules the attraction is <b>much weaker</b>, so one molecule pulls free easily. That is why "one $\\ce{H2O}$" is a real thing you could isolate.</p>';
    Lab.renderTex(Lab.$('#tug-foot'));
  }
  Lab.segmented('#tug-mode', (v) => { tug.mode = v; tug.grab = null; paintTug(); });
  paintTug();

  /* ---------- Bench: charge balancer ---------- */
  const ALL_ANIONS = K.ANIONS.concat(K.POLY_ANIONS);
  const catKey = (c) => `${c.f}${c.q}`;
  function fillSelect(sel, list, label) {
    Lab.$(sel).innerHTML = list.map((x, i) => `<option value="${i}">${label(x)}</option>`).join('');
  }
  const optName = (x) => `${ionLabel(x)}, ${x.name}`;
  fillSelect('#cb-cat', K.CATIONS, optName);
  fillSelect('#cb-an', ALL_ANIONS, optName);
  const cb = { cat: K.CATIONS.find((c) => c.f === 'Al'), an: K.ANIONS.find((a) => a.f === 'O'), cats: [], ans: [], t: 0, won: new Set(), winT: -9, n: 0 };
  Lab.$('#cb-cat').value = String(K.CATIONS.indexOf(cb.cat));
  Lab.$('#cb-an').value = String(ALL_ANIONS.indexOf(cb.an));
  const CB_MAX = 6;
  const cbState = () => {
    const P = cb.cats.length * cb.cat.q, N = cb.ans.length * -cb.an.q;
    const k = cb.cats.length && cb.ans.length ? K.gcd(cb.cats.length, cb.ans.length) : 1;
    return { P, N, net: P - N, balanced: P === N && P > 0, k };
  };
  function cbAdd(kind) {
    const arr = kind === 'c' ? cb.cats : cb.ans;
    if (arr.length >= CB_MAX) { Lab.toast('The tray only holds six of each. Try removing some.'); return; }
    arr.push({ born: cb.t, id: cb.n++ });
    Lab.sound.pop();
    cbChanged();
  }
  function cbRemove(kind, i) {
    (kind === 'c' ? cb.cats : cb.ans).splice(i, 1);
    Lab.sound.pop();
    cbChanged();
  }
  function cbChanged() {
    const s = cbState();
    if (s.balanced && s.k === 1) {
      cb.winT = cb.t;
      const key = catKey(cb.cat) + cb.an.f;
      Lab.sound.good();
      if (!cb.won.has(key)) { cb.won.add(key); Lab.collection.award(1); Lab.confetti(40); }
    }
    paintCb();
  }
  function paintCb() {
    Lab.$('#cb-add-cat').textContent = `Add ${ionLabel(cb.cat)}`;
    Lab.$('#cb-add-an').textContent = `Add ${ionLabel(cb.an)}`;
    const s = cbState();
    const foot = Lab.$('#cb-foot');
    const compound = `${cb.cat.name} ${cb.an.name}`;
    let html;
    if (s.balanced) {
      const nc = cb.cats.length / s.k, na = cb.ans.length / s.k;
      const f = K.part(cb.cat, nc) + K.part(cb.an, na);
      html = `<p><b>${compound[0].toUpperCase() + compound.slice(1)}:</b> ${cb.cats.length} × (+${cb.cat.q}) + ${cb.ans.length} × (−${-cb.an.q}) = 0. ${s.k > 1 ? `That balances, but formulas use the <b>smallest</b> ratio, so divide by ${s.k}: $\\ce{${f}}$.` : `The formula is $\\ce{${f}}$.`}</p>`;
    } else if (!cb.cats.length && !cb.ans.length) html = `<p>Build <b>${compound}</b>. Add one of each to start, and see which charges are left over.</p>`;
    else html = `<p>Net charge: <b>${s.net > 0 ? '+' : s.net < 0 ? '−' : ''}${Math.abs(s.net)}</b>. ${s.net > 0 ? 'Too positive, so add an anion.' : 'Too negative, so add a cation.'}</p>`;
    if (!K.pairOK(cb.cat, cb.an)) html += '<p>Heads up: this pair is for charge practice. It does not form a stable compound you could keep in a bottle.</p>';
    foot.innerHTML = Lab.texString(html);
  }
  const chargeStage = Lab.stage('#c-charge', {
    h: 500,
    label: 'A tray holding positive and negative ions, with matched pairs of plus and minus chips below it, and the resulting formula.',
    onPointer(e) {
      if (e.type === 'hover') {
        const over = (e.x < 150 || e.x > 650) && e.y > 56 && e.y < 290;
        chargeStage.canvas.style.cursor = over || hitIon(e.x, e.y) ? 'pointer' : 'default';
        return;
      }
      if (e.type !== 'down') return;
      if (e.y > 56 && e.y < 290) {
        if (e.x < 150) { cbAdd('c'); return; }
        if (e.x > 650) { cbAdd('a'); return; }
        const h = hitIon(e.x, e.y);
        if (h) cbRemove(h[0], h[1]);
      }
    },
    draw(g, t) {
      cb.t = t;
      const s = cbState();
      const netCol = s.balanced ? C.leaf : s.net > 0 ? '#FF7AB6' : s.net < 0 ? '#5BBDFF' : C.ink;
      Art.text(g, `Net charge: ${s.net > 0 ? '+' : s.net < 0 ? '−' : ''}${Math.abs(s.net)}`, 400, 30, { font: 'display', size: 38, color: netCol });
      // Bins.
      const bin = (x, ion, col, side) => {
        const pulse = 1 + Math.sin(t * 2.4 + side) * 0.03;
        g.fillStyle = C.plum2; g.strokeStyle = col; g.lineWidth = 3.5;
        Art.round(g, x, 60, 136, 228, 18); g.fill(); g.stroke();
        g.save(); g.translate(x + 68, 138); g.scale(pulse, pulse); ionArt(g, 0, 0, 46, ion, { face: 'happy', t, seed: side }); g.restore();
        Art.text(g, ionLabel(ion), x + 68, 216, { font: 'display', size: 30, color: bright(ion.poly ? C.ink : Art.elementColor(ion.f)) });
        Art.text(g, 'tap to add', x + 68, 256, { size: 22, color: C.dim });
      };
      bin(12, cb.cat, '#FF7AB6', 0);
      bin(652, cb.an, '#5BBDFF', 1);
      // Tray.
      g.fillStyle = 'rgba(0,0,0,.22)'; g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2;
      Art.round(g, 160, 60, 480, 228, 18); g.fill(); g.stroke();
      const place = (arr, y, ion, kind) => {
        const r = ion.poly ? 34 : 34, sp = 74;
        arr.forEach((it, i) => {
          const x = 400 + (i - (arr.length - 1) / 2) * sp;
          const q = ease.back(clamp((t - it.born) * 4));
          g.save(); g.translate(x, y + wander(it.id, t) * 2); g.scale(q, q);
          ionArt(g, 0, 0, r, ion, { face: s.balanced ? 'happy' : kind === 'c' && s.net > 0 ? 'grumpy' : kind === 'a' && s.net < 0 ? 'grumpy' : 'happy', t, seed: it.id });
          g.restore();
        });
      };
      place(cb.cats, 116, cb.cat, 'c');
      place(cb.ans, 230, cb.an, 'a');
      if (!cb.cats.length && !cb.ans.length) Art.text(g, 'The tray is empty', 400, 174, { size: 28, color: C.faint });
      // Charge chips: each plus pairs with a minus.
      const chipSp = 36;
      const pairs = Math.min(s.P, s.N);
      const startX = (n) => 400 - ((n - 1) * chipSp) / 2;
      const width = Math.max(s.P, s.N);
      const sx = startX(width);
      for (let i = 0; i < pairs; i++) {
        const x = sx + i * chipSp;
        g.strokeStyle = C.leaf; g.lineWidth = 5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, 322); g.lineTo(x, 362); g.stroke();
      }
      const chip = (x, y, plus, odd) => {
        const pu = odd ? 1 + Math.sin(t * 6) * 0.12 : 1;
        g.fillStyle = plus ? '#FF3D7F' : '#1FA5FF'; g.strokeStyle = odd ? '#fff' : '#1A0F2E'; g.lineWidth = odd ? 3 : 2;
        g.beginPath(); g.arc(x, y, 15 * pu, 0, TAU); g.fill(); g.stroke();
        Art.text(g, plus ? '+' : '−', x, y, { size: 24, color: '#fff' });
      };
      for (let i = 0; i < s.P; i++) chip(sx + i * chipSp, 312, true, i >= pairs);
      for (let i = 0; i < s.N; i++) chip(sx + i * chipSp, 372, false, i >= pairs);
      // Result.
      if (s.balanced) {
        const nc = cb.cats.length / s.k, na = cb.ans.length / s.k;
        const f = K.part(cb.cat, nc) + K.part(cb.an, na);
        const q = ease.back(clamp((t - cb.winT) * 3));
        if (s.k > 1) {
          Art.text(g, 'Balanced, but simplify:', 330, 436, { size: 28, color: C.sun });
          F(g, f, 590, 436, { size: 54, colorize: true });
          Art.moe(g, 740, 494, 88, 'think', { t, flip: true });
        } else {
          g.save(); g.translate(360, 438); g.scale(q || 1, q || 1);
          F(g, f, 0, 0, { size: 70, colorize: true });
          g.restore();
          Art.burst(g, 360, 438, clamp((t - cb.winT) / 0.8), { r: 170, n: 18 });
          Art.moe(g, 720, 494, 96, 'cheer', { t, flip: true });
        }
      } else {
        const msg = !s.P && !s.N ? 'Add both kinds of ion' : s.net > 0 ? `${s.net} extra positive charge${s.net > 1 ? 's' : ''}` : s.net < 0 ? `${-s.net} extra negative charge${s.net < -1 ? 's' : ''}` : '';
        Art.text(g, msg, 360, 438, { font: 'display', size: 34, color: netCol });
        Art.moe(g, 720, 494, 88, 'point', { t, flip: true });
      }
    },
  });
  function hitIon(x, y) {
    const test = (arr, yy, kind) => { for (let i = 0; i < arr.length; i++) { const ix = 400 + (i - (arr.length - 1) / 2) * 74; if (Math.hypot(ix - x, yy - y) < 36) return [kind, i]; } return null; };
    return test(cb.cats, 116, 'c') || test(cb.ans, 230, 'a');
  }
  const cbClear = () => { cb.cats = []; cb.ans = []; cb.winT = -9; paintCb(); };
  Lab.$('#cb-add-cat').addEventListener('click', () => cbAdd('c'));
  Lab.$('#cb-add-an').addEventListener('click', () => cbAdd('a'));
  Lab.$('#cb-clear').addEventListener('click', cbClear);
  Lab.$('#cb-cat').addEventListener('change', (e) => { cb.cat = K.CATIONS[+e.target.value]; cbClear(); });
  Lab.$('#cb-an').addEventListener('change', (e) => { cb.an = ALL_ANIONS[+e.target.value]; cbClear(); });
  Lab.$('#cb-new').addEventListener('click', () => {
    for (let i = 0; i < 30; i++) {
      const c = K.CATIONS[Math.floor(Math.random() * K.CATIONS.length)], a = ALL_ANIONS[Math.floor(Math.random() * ALL_ANIONS.length)];
      const [nc, na] = K.ratio(c, a);
      if (K.pairOK(c, a) && (nc > 1 || na > 1) && !(c.poly && !a.poly)) {
        cb.cat = c; cb.an = a;
        Lab.$('#cb-cat').value = String(K.CATIONS.indexOf(c)); Lab.$('#cb-an').value = String(ALL_ANIONS.indexOf(a));
        break;
      }
    }
    cbClear();
  });
  paintCb();
  chargeStage.data.cb = cb;

  /* ---------- Bench: criss-cross animator ---------- */
  fillSelect('#cc-cat', K.CATIONS, optName);
  fillSelect('#cc-an', ALL_ANIONS, optName);
  const cc = { cat: K.CATIONS.find((c) => c.f === 'Al'), an: ALL_ANIONS.find((a) => a.f === 'SO4'), t0: 0 };
  Lab.$('#cc-cat').value = String(K.CATIONS.indexOf(cc.cat));
  Lab.$('#cc-an').value = String(ALL_ANIONS.indexOf(cc.an));
  function fw(g, f, size) { g.save(); g.globalAlpha = 0; const w = Art.formula(g, f, -500, -500, { size }); g.restore(); return w; }
  const crossStage = Lab.stage('#c-cross', {
    h: 450,
    label: 'Two ions with their charges. Each charge flies across to become the subscript of the other ion, forming the formula.',
    draw(g, t) {
      const tau = t - cc.t0;
      const { cat, an } = cc;
      const a = cat.q, b = -an.q, gg = K.gcd(a, b);
      const size = 86, y = 130;
      const cw = fw(g, cat.f, size), aw = fw(g, an.f, size);
      const xc = 242 - cw / 2, xa = 590 - aw / 2;
      const col = { c: '#FF7AB6', a: '#5BBDFF' };
      // Stage one: the two ions and their charges.
      const lift = ease.inOut(seg(tau, 0.9, 2.1));
      const landed = lift >= 1;
      const dropOnes = seg(tau, 2.3, 2.7), parens = seg(tau, 2.7, 3.1), simplify = gg > 1 ? seg(tau, 3.2, 3.9) : 0;
      F(g, cat.f, xc, y, { size, colorize: true, align: 'left' });
      F(g, an.f, xa, y, { size, colorize: true, align: 'left' });
      const signA = seg(tau, 0.6, 1);
      // The charge sign fades as the number takes off.
      Art.text(g, cat.q > 0 ? '+' : '−', xc + cw + 40, y - 44, { font: 'display', size: 40, color: col.c, alpha: 1 - signA });
      Art.text(g, '−', xa + aw + 40, y - 44, { font: 'display', size: 40, color: col.a, alpha: 1 - signA });
      // Arrows crossing in an X.
      const subAx = xa + aw + (an.poly ? 34 : 12), subCx = xc + cw + (cat.poly ? 34 : 12);
      const arrowsA = seg(tau, 0.75, 1.4) * (1 - seg(tau, 2.2, 2.6));
      if (arrowsA > 0) {
        Art.arrow(g, xc + cw + 24, y - 30, subAx, y + 40, { color: Art.alpha(col.c, 0.55 * arrowsA + 0.2), w: 5, curve: -60, p: seg(tau, 0.75, 1.5) });
        Art.arrow(g, xa + aw + 24, y - 30, subCx, y + 40, { color: Art.alpha(col.a, 0.55 * arrowsA + 0.2), w: 5, curve: 60, p: seg(tau, 0.75, 1.5) });
      }
      // The two numbers.
      const numberAt = (fx, fy, tx, ty, u, v, c, gone) => {
        const px = lerp(fx, tx, u), py = lerp(fy, ty, u) - Math.sin(u * Math.PI) * 44;
        Art.text(g, String(v), px, py, { font: 'display', size: lerp(52, 56, u), color: c, alpha: gone ? 1 - dropOnes : 1, halo: true });
      };
      numberAt(xc + cw + 20, y - 44, subAx, y + 40, lift, a, col.c, landed && a === 1);
      numberAt(xa + aw + 20, y - 44, subCx, y + 40, lift, b, col.a, landed && b === 1);
      // Parentheses for a polyatomic ion that appears more than once.
      const nc = b / gg, na = a / gg;
      if (an.poly && na > 1) {
        Art.text(g, '(', xa - 16, y - 2, { font: 'display', size: 96, color: C.sun, alpha: parens });
        Art.text(g, ')', xa + aw + 14, y - 2, { font: 'display', size: 96, color: C.sun, alpha: parens });
      }
      if (cat.poly && nc > 1) {
        Art.text(g, '(', xc - 16, y - 2, { font: 'display', size: 96, color: C.sun, alpha: parens });
        Art.text(g, ')', xc + cw + 14, y - 2, { font: 'display', size: 96, color: C.sun, alpha: parens });
      }
      // Simplify when the subscripts share a factor.
      if (gg > 1) {
        Art.strike(g, subAx - 24, y + 62, subAx + 24, y + 18, simplify);
        Art.strike(g, subCx - 24, y + 62, subCx + 24, y + 18, simplify);
        Art.text(g, `both divide by ${gg}`, 400, y + 92, { size: 27, color: C.red, alpha: simplify, halo: true });
      }
      // The result.
      const res = ease.back(seg(tau, gg > 1 ? 4 : 3.1, gg > 1 ? 4.6 : 3.7));
      const f = K.part(cat, nc) + K.part(an, na);
      if (res > 0) {
        g.save(); g.translate(400, 300); g.scale(res, res);
        g.fillStyle = C.plum2; Art.round(g, -240, -58, 480, 116, 26); g.fill();
        F(g, f, 0, 0, { size: 72, colorize: true });
        g.restore();
        Art.text(g, `${nc} × (+${a})  +  ${na} × (−${b})  =  0`, 400, 396, { size: 29, color: C.sun, alpha: seg(tau, gg > 1 ? 4.6 : 3.7, gg > 1 ? 5 : 4.1) });
        const label = K.pairOK(cat, an) ? `${cat.name} ${an.name}` : 'Charge practice only: not a stable compound';
        Art.text(g, label, 400, 432, { size: 25, color: K.pairOK(cat, an) ? C.dim : '#FF9AA6', alpha: seg(tau, gg > 1 ? 4.6 : 3.7, gg > 1 ? 5 : 4.1) });
      }
    },
  });
  const ccRestart = () => { cc.t0 = crossStage.t; };
  Lab.$('#cc-cat').addEventListener('change', (e) => { cc.cat = K.CATIONS[+e.target.value]; ccRestart(); });
  Lab.$('#cc-an').addEventListener('change', (e) => { cc.an = ALL_ANIONS[+e.target.value]; ccRestart(); });
  Lab.$('#cc-play').addEventListener('click', ccRestart);
  crossStage.data.cc = cc;

  /* ---------- Story 2: polyatomic ions ---------- */
  const P = (f) => K.POLY.find((x) => x.f === f);
  Lab.story('#story-poly', {
    title: 'Teams with a charge',
    scenes: [
      {
        say: 'This is <b>sulfate</b>. One sulfur and four oxygens, bonded tightly together, plus two extra electrons. The whole team carries a charge of $2-$. It is called a <b>polyatomic ion</b>.',
        dur: 3.8,
        draw(g, p, t, { H }) {
          const q = ease.back(seg(p, 0, 0.35));
          g.save(); g.translate(270, H / 2); g.scale(q, q);
          g.rotate(Math.sin(t * 0.4) * 0.05);
          ionArt(g, 0, 0, 165, P('SO4'), { face: 'happy', t, noBadge: true });
          g.restore();
          const a = seg(p, 0.42, 0.62);
          g.strokeStyle = Art.alpha(C.sun, a); g.lineWidth = 5; g.setLineDash([12, 10]);
          g.beginPath(); g.arc(270, H / 2, 208, 0, TAU); g.stroke(); g.setLineDash([]);
          if (a > 0) badge(g, 270 + 150, H / 2 - 150, 38 * a, '2-');
          Art.formula(g, 'SO4^2-', 630, 170, { size: 74, colorize: true });
          Art.text(g, 'sulfate', 630, 244, { font: 'display', size: 44, color: C.sun, alpha: seg(p, 0.5, 0.7) });
          Art.text(g, 'one team, one charge', 630, 296, { size: 27, alpha: seg(p, 0.6, 0.8) });
        },
      },
      {
        say: 'The team stays together. When sodium sulfate dissolves, the ions separate, but sulfate does <b>not</b> break apart into S and O. It acts as a single ion.',
        dur: 4.2,
        draw(g, p, t, { H, W }) {
          const q = ease.inOut(seg(p, 0.25, 0.75));
          const cy = H / 2 - 24;
          ionArt(g, lerp(350, 150, q), cy - lerp(60, 0, q), 62, K.CATIONS[1], { face: 'happy', t, seed: 1, look: [1, 0] });
          ionArt(g, lerp(350, 650, q), cy + lerp(90, 0, q), 62, K.CATIONS[1], { face: 'happy', t, seed: 2, look: [-1, 0] });
          ionArt(g, W / 2 + lerp(-10, 0, q), cy + lerp(4, 0, q) + wander(1, t) * 3, 92, P('SO4'), { face: q > 0.8 ? 'grin' : 'happy', t, rot: q * 0.6 });
          Art.text(g, 'Na₂SO₄', W / 2, 30, { font: 'display', size: 34, alpha: 1 - seg(p, 0.5, 0.75) });
          Art.formula(g, '2Na^+ + SO4^2-', W / 2, H - 56, { size: 44, colorize: true, alpha: 1 });
          Art.text(g, 'S and O stay bonded', W / 2, 40, { size: 28, color: C.sun, alpha: seg(p, 0.75, 0.92), halo: true });
        },
      },
      {
        say: 'When you need more than one polyatomic ion, wrap it in <b>parentheses</b>. In $\\ce{Ca(NO3)2}$, the 2 multiplies everything inside. That means 2 nitrates, so 2 N and 6 O.',
        dur: 4.6,
        draw(g, p, t, { W }) {
          Art.formula(g, 'Ca(NO3)2', W / 2, 62, { size: 76, colorize: true });
          const a = seg(p, 0.15, 0.32);
          Art.ring(g, W / 2 + fw(g, 'Ca(NO3)2', 76) / 2 - 15, 88, 28, { color: C.sun, p: a, w: 5 });
          const q = ease.back(seg(p, 0.25, 0.45));
          if (q > 0) { g.save(); g.translate(150, 240); g.scale(q, q); ionArt(g, 0, 0, 76, K.CATIONS.find((c) => c.f === 'Ca'), { face: 'happy', t, look: [1, 0] }); g.restore(); }
          [400, 640].forEach((x, i) => {
            const qq = ease.back(seg(p, 0.35 + i * 0.12, 0.55 + i * 0.12));
            if (qq <= 0) return;
            g.save(); g.translate(x, 240); g.scale(qq, qq); ionArt(g, 0, 0, 86, P('NO3'), { face: 'happy', t, seed: i, rot: Math.sin(t * 0.5 + i) * 0.08 }); g.restore();
          });
          Art.text(g, '1 calcium', 150, 356, { size: 28, alpha: seg(p, 0.4, 0.55), color: Art.elementColor('Ca') });
          Art.text(g, 'nitrate', 400, 356, { size: 28, alpha: seg(p, 0.5, 0.65) });
          Art.text(g, 'nitrate', 640, 356, { size: 28, alpha: seg(p, 0.62, 0.77) });
          Art.text(g, 'Total: 1 Ca, 2 N, 6 O', W / 2, 410, { font: 'display', size: 38, color: C.sun, alpha: seg(p, 0.8, 0.95) });
        },
      },
      {
        say: 'Now the pattern. The <b>-ate</b> ion is the usual one. The <b>-ite</b> ion has <b>one less oxygen</b> and the same charge. For chlorine, <b>per-</b> means one more than -ate, and <b>hypo-</b> means one less than -ite.',
        dur: 5,
        draw(g, p, t) {
          const row = [['ClO4', 'perchlorate', '4 O'], ['ClO3', 'chlorate', '3 O'], ['ClO2', 'chlorite', '2 O'], ['ClO', 'hypochlorite', '1 O']];
          row.forEach(([f, n, c], i) => {
            const x = 112 + i * 192;
            const q = ease.back(seg(p, 0.05 + i * 0.16, 0.24 + i * 0.16));
            if (q <= 0) return;
            g.save(); g.translate(x, 138); g.scale(q, q); ionArt(g, 0, 0, 72, P(f), { t, rot: i === 0 ? 0 : 0, noBadge: true }); g.restore();
            Art.formula(g, `${f}^-`, x, 262, { size: 38, colorize: true, alpha: 1 });
            Art.text(g, n, x, 312, { font: 'display', size: 26, color: C.sun, maxW: 186 });
            Art.text(g, c, x, 352, { size: 25, color: C.dim });
          });
          Art.arrow(g, 60, 400, 740, 400, { color: C.cyan, w: 5, p: seg(p, 0.7, 0.95) });
          Art.text(g, 'fewer oxygens, same 1− charge', 400, 430, { size: 25, color: C.cyan, alpha: seg(p, 0.8, 0.95), halo: true });
          void t;
        },
      },
      {
        say: 'Adding an H⁺ makes a new ion. Each H added <b>raises the charge by 1</b>. Carbonate, $\\ce{CO3^2-}$, becomes hydrogen carbonate, $\\ce{HCO3-}$, also called bicarbonate, the ion in baking soda.',
        dur: 4.2,
        draw(g, p, t, { H }) {
          const cy = 180;
          ionArt(g, 200, cy, 92, P('CO3'), { face: 'happy', t, noBadge: true });
          F(g, 'CO3^2-', 200, 322, { size: 50, colorize: true });
          Art.text(g, 'carbonate', 200, 376, { font: 'display', size: 28, color: C.sun });
          const q = ease.inOut(seg(p, 0.2, 0.55));
          if (q < 1) Art.atom(g, lerp(370, 590, q), cy - 90 - Math.sin(q * Math.PI) * 30, 26, 'H', { charge: '+' });
          Art.arrow(g, 320, cy, 460, cy, { color: C.sun, w: 7, p: seg(p, 0.2, 0.5) });
          const after = ease.back(seg(p, 0.52, 0.72));
          if (after > 0) {
            g.save(); g.translate(600, cy); g.scale(after, after);
            ionArt(g, 0, 0, 92, P('HCO3'), { face: 'grin', t, noBadge: true });
            g.restore();
            Art.atom(g, 600, cy - 104 - 6, 22, 'H', { alpha: after > 1 ? 1 : after });
          }
          F(g, 'HCO3^-', 600, 322, { size: 50, colorize: true });
          Art.text(g, 'hydrogen carbonate', 600, 376, { font: 'display', size: 28, color: C.sun, alpha: seg(p, 0.65, 0.82) });
          Art.text(g, '2− becomes 1−', 400, H - 34, { font: 'display', size: 30, color: C.pink, alpha: seg(p, 0.76, 0.92) });
        },
      },
    ],
  });

  /* ---------- Bench: polyatomic flash drill ---------- */
  const dr = { set: 'core', dir: 'mix', deck: [], i: 0, right: 0, streak: 0, missed: [], phase: 'ask', flipT: -9, ok: false, showName: true, t: 0, done: false };
  const answersHost = Lab.$('#dr-answers');
  const nextBtn = Lab.$('#dr-next');
  function shuffled(list) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function newRound() {
    const pool = dr.set === 'core' ? K.POLY.filter((p) => p.core) : K.POLY;
    dr.deck = shuffled(pool).slice(0, 10);
    while (dr.deck.length < 10) dr.deck.push(pool[Math.floor(Math.random() * pool.length)]);
    dr.i = 0; dr.right = 0; dr.missed = []; dr.done = false;
    deal();
  }
  function deal() {
    const card = dr.deck[dr.i];
    dr.phase = 'ask'; dr.flipT = -9;
    dr.showName = dr.dir === 'mix' ? Math.random() < 0.5 : dr.dir === 'name';
    // Distractors that really tempt: same central atom first, then same charge.
    const others = K.POLY.filter((p) => p !== card);
    const score = (p) => (p.art && card.art && p.art[0] === card.art[0] ? 0 : p.q === card.q ? 1 : 2) + Math.random();
    const wrong = others.slice().sort((a, b) => score(a) - score(b)).slice(0, 3);
    const opts = shuffled([card].concat(wrong));
    answersHost.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">${opts.map((o, i) => `<button type="button" class="btn ghost" data-i="${i}" style="justify-content:center">${dr.showName ? Lab.texString(`$\\ce{${o.f}^{${K.chargeTex(o.q)}}}$`) : o.name}</button>`).join('')}</div>`;
    Lab.$$('button', answersHost).forEach((b) => b.addEventListener('click', () => {
      if (dr.phase !== 'ask') return;
      const o = opts[+b.dataset.i];
      dr.ok = o === card;
      dr.phase = 'show'; dr.flipT = dr.t;
      if (dr.ok) { dr.right++; dr.streak++; Lab.sound.good(); } else { dr.streak = 0; dr.missed.push(card); Lab.sound.bad(); }
      Lab.$$('button', answersHost).forEach((x) => { x.disabled = true; const opt = opts[+x.dataset.i]; if (opt === card) { x.style.background = '#177A4B'; x.style.boxShadow = 'none'; } else if (x === b) { x.style.background = '#A63A2E'; x.style.boxShadow = 'none'; } });
      nextBtn.hidden = false;
      nextBtn.textContent = dr.i >= dr.deck.length - 1 ? 'See my score' : 'Next card';
      nextBtn.focus({ preventScroll: true });
    }));
    nextBtn.hidden = true;
    Lab.$('#dr-foot').innerHTML = dr.showName ? '<p>Pick the formula that goes with this name.</p>' : '<p>Pick the name that goes with this formula.</p>';
  }
  function finishRound() {
    dr.done = true; dr.phase = 'done'; dr.flipT = dr.t;
    answersHost.innerHTML = '';
    nextBtn.hidden = false; nextBtn.textContent = 'Drill again';
    if (dr.right >= 8) { Lab.collection.award(1); Lab.sound.fanfare(); Lab.confetti(dr.right === 10 ? 110 : 50); }
    const miss = dr.missed.length ? `Practice these: ${dr.missed.map((m) => `$\\ce{${m.f}^{${K.chargeTex(m.q)}}}$ ${m.name}`).join(', ')}.` : 'You missed none.';
    Lab.$('#dr-foot').innerHTML = Lab.texString(`<p><b>${dr.right} of 10.</b> ${miss}</p>`);
  }
  nextBtn.addEventListener('click', () => {
    if (dr.done) { newRound(); return; }
    if (dr.i >= dr.deck.length - 1) { finishRound(); return; }
    dr.i++; deal();
  });
  Lab.stage('#c-drill', {
    h: 340,
    label: 'A flash card that shows the name or formula of a polyatomic ion, and flips to show the structure.',
    draw(g, t) {
      dr.t = t;
      const cx = 400, cy = 172, w = 500, h = 268;
      const card = dr.deck[dr.i];
      if (!card) return;
      if (dr.phase === 'done') {
        const q = ease.back(clamp((t - dr.flipT) * 2));
        g.save(); g.translate(cx - 90, cy); g.scale(q, q);
        Art.text(g, `${dr.right} of 10`, 0, -22, { font: 'display', size: 76, color: dr.right >= 8 ? C.leaf : C.sun });
        Art.text(g, dr.right === 10 ? 'A perfect round!' : dr.right >= 8 ? 'You found an element.' : 'Go again. It gets easier.', 0, 44, { size: 28 });
        g.restore();
        Art.moe(g, 660, 330, 190, dr.right >= 8 ? 'cheer' : 'think', { t, flip: true });
        return;
      }
      const u = dr.phase === 'show' ? ease.inOut(clamp((t - dr.flipT) / 0.5)) : 0;
      const sx = Math.max(0.02, Math.abs(1 - 2 * u));
      const back = u > 0.5;
      g.save(); g.translate(cx, cy); g.scale(sx, 1);
      g.fillStyle = 'rgba(0,0,0,.3)'; Art.round(g, -w / 2 + 5, -h / 2 + 8, w, h, 24); g.fill();
      g.fillStyle = back ? (dr.ok ? '#17563A' : '#5C2A3C') : C.plum2; g.strokeStyle = back ? (dr.ok ? C.leaf : C.red) : '#8F76C2'; g.lineWidth = 5;
      Art.round(g, -w / 2, -h / 2, w, h, 24); g.fill(); g.stroke();
      if (!back) {
        if (dr.showName) Art.text(g, card.name, 0, 0, { font: 'display', size: card.name.length > 16 ? 38 : 50, color: C.sun });
        else F(g, `${card.f}^${K.chargeTex(card.q)}`, 0, 0, { size: 70, colorize: true });
      } else {
        ionArt(g, -130, -2, 76, card, { face: dr.ok ? 'happy' : 'sad', t, rot: Math.sin(t * 0.5) * 0.06 });
        F(g, `${card.f}^${K.chargeTex(card.q)}`, 100, -40, { size: 52, colorize: true });
        Art.text(g, card.name, 100, 40, { font: 'display', size: card.name.length > 16 ? 25 : 32, color: C.sun, maxW: 230 });
      }
      g.restore();
      Art.text(g, `Card ${dr.i + 1} of 10`, 30, 28, { size: 22, color: C.dim, align: 'left' });
      Art.text(g, `${dr.streak} in a row`, 770, 28, { size: 22, color: dr.streak ? C.sun : C.dim, align: 'right' });
    },
  });
  Lab.segmented('#dr-set', (v) => { dr.set = v; newRound(); });
  Lab.segmented('#dr-dir', (v) => { dr.dir = v; newRound(); });
  newRound();

  /* ---------- Story 3: empirical formulas ---------- */
  Lab.story('#story-emp', {
    title: 'The real count and the simplest ratio',
    scenes: [
      {
        say: 'Hydrogen peroxide has 2 H and 2 O in every molecule. That is its <b>molecular formula</b>, $\\ce{H2O2}$. The simplest ratio of those atoms is 1 to 1, so its <b>empirical formula</b> is HO.',
        dur: 4,
        draw(g, p, t, { H }) {
          Art.molecule(g, 220, H / 2 - 30, 124, 'H2O2', { face: 'happy', t, rot: Math.sin(t * 0.5) * 0.06 });
          Art.text(g, 'one real molecule', 220, 40, { size: 27, color: C.dim });
          Art.formula(g, 'H2O2', 220, H - 86, { size: 62, colorize: true });
          Art.text(g, 'molecular formula', 220, H - 34, { size: 26, color: C.sun });
          Art.arrow(g, 380, H - 76, 490, H - 76, { color: C.pink, w: 7, p: seg(p, 0.4, 0.62) });
          Art.text(g, 'divide by 2', 445, H - 108, { size: 25, color: C.pink, alpha: seg(p, 0.45, 0.62) });
          const a = seg(p, 0.6, 0.8);
          g.save(); g.globalAlpha *= a;
          Art.formula(g, 'HO', 610, H - 86, { size: 62, colorize: true });
          g.restore();
          Art.text(g, 'empirical formula', 610, H - 34, { size: 26, color: C.sun, alpha: a });
          Art.atom(g, 560, 180, 42, 'H', { alpha: a });
          Art.text(g, ':', 610, 180, { font: 'display', size: 50, alpha: a });
          Art.atom(g, 668, 180, 52, 'O', { alpha: a });
          Art.text(g, 'just a ratio', 610, 96, { size: 27, color: C.dim, alpha: a });
        },
      },
      {
        say: 'Glucose is $\\ce{C6H12O6}$. Sort its 24 atoms into equal bundles and you get <b>6 identical bundles</b> of $\\ce{CH2O}$. That bundle is its empirical formula.',
        dur: 4.6,
        draw(g, p, t, { W, H }) {
          const q = ease.inOut(seg(p, 0.22, 0.65));
          const atoms = [];
          for (let k = 0; k < 6; k++) { atoms.push(['C', k, 0]); atoms.push(['H', k, 1]); atoms.push(['H', k, 2]); atoms.push(['O', k, 3]); }
          atoms.forEach(([s, k, slot], i) => {
            const a0 = i * 2.39996, d = Math.sqrt(i + 0.5) * 36;
            const sx = W / 2 + Math.cos(a0) * d * 1.5, sy = 180 + Math.sin(a0) * d * 0.72;
            const tx = 100 + k * 120 + (slot === 1 ? -22 : slot === 2 ? 22 : 0);
            const ty = 110 + (slot === 0 ? 0 : slot === 3 ? 106 : 54);
            Art.atom(g, lerp(sx, tx, q) + wander(i, t) * 1.4, lerp(sy, ty, q) + wander(i + 9, t) * 1.4, s === 'H' ? 17 : 24, s, {});
          });
          const a = seg(p, 0.66, 0.8);
          for (let k = 0; k < 6; k++) {
            g.strokeStyle = Art.alpha(C.sun, a * 0.9); g.lineWidth = 3; g.setLineDash([7, 6]);
            Art.round(g, 100 + k * 120 - 52, 76, 104, 176, 18); g.stroke(); g.setLineDash([]);
          }
          F(g, 'C6H12O6', W / 2, 34, { size: 44, colorize: true });
          if (a > 0) {
            g.save(); g.globalAlpha *= a;
            F(g, '6 CH2O', W / 2, H - 92, { size: 58, colorize: true });
            g.restore();
            Art.text(g, 'The empirical formula is the bundle', W / 2, H - 38, { size: 27, color: C.sun, alpha: a });
          }
        },
      },
      {
        say: 'Different molecules can share one empirical formula. Acetylene, $\\ce{C2H2}$, and benzene, $\\ce{C6H6}$, are very different substances, but both have a 1 to 1 ratio: <b>CH</b>. So you need more than a ratio to name a molecule.',
        dur: 4.2,
        draw(g, p, t, { H }) {
          const a = ease.back(seg(p, 0.05, 0.3)), b = ease.back(seg(p, 0.3, 0.55));
          Art.popIn(g, 200, 170, a, (gg) => Art.molecule(gg, 0, 0, 74, 'C2H2', { face: 'happy', t }));
          Art.popIn(g, 590, 180, b, (gg) => {
            for (let i = 0; i < 6; i++) {
              const an = -Math.PI / 2 + (i / 6) * TAU, an2 = an + TAU / 6;
              Art.bond(gg, Math.cos(an) * 84, Math.sin(an) * 84, Math.cos(an2) * 84, Math.sin(an2) * 84, { order: i % 2 ? 1 : 2, width: 4 });
              Art.bond(gg, Math.cos(an) * 84, Math.sin(an) * 84, Math.cos(an) * 134, Math.sin(an) * 134, { width: 4 });
            }
            for (let i = 0; i < 6; i++) {
              const an = -Math.PI / 2 + (i / 6) * TAU;
              Art.atom(gg, Math.cos(an) * 134, Math.sin(an) * 134, 15, 'H', {});
              Art.atom(gg, Math.cos(an) * 84, Math.sin(an) * 84, 24, 'C', {});
            }
          });
          F(g, 'C2H2', 200, 266, { size: 44, colorize: true });
          F(g, 'C6H6', 590, 392, { size: 44, colorize: true });
          const c = seg(p, 0.62, 0.8);
          if (c > 0) {
            g.fillStyle = Art.alpha(C.pink, c); Art.round(g, 90, H - 110 , 280, 76, 24); g.fill();
            Art.text(g, 'Both are CH', 230, H - 72, { font: 'display', size: 36, color: '#fff', alpha: c });
          }
        },
      },
      {
        say: 'Ionic formulas are <b>always</b> written as the simplest ratio, so they are already empirical. Molecular formulas are <b>not</b> reduced, because the real count matters. This is why $\\ce{H2O2}$ stays as it is, but $\\ce{Ca2O2}$ becomes $\\ce{CaO}$.',
        dur: 4.6,
        draw(g, p, t, { H }) {
          const left = ease.out(seg(p, 0.05, 0.3)), right = ease.out(seg(p, 0.45, 0.7));
          g.save(); g.globalAlpha *= left;
          g.fillStyle = C.plum2; Art.round(g, 20, 26, 370, H - 52, 24); g.fill();
          Art.text(g, 'Ionic', 205, 66, { font: 'display', size: 36, color: C.sun });
          Art.formula(g, 'Ca2O2', 205, 160, { size: 64, colorize: true });
          Art.strike(g, 100, 186, 310, 132, seg(p, 0.2, 0.35));
          Art.arrow(g, 205, 208, 205, 254, { color: C.leaf, w: 7, p: seg(p, 0.3, 0.42) });
          Art.formula(g, 'CaO', 205, 306, { size: 70, colorize: true, });
          Art.text(g, 'always reduce', 205, 378, { size: 27, color: C.leaf });
          g.restore();
          g.save(); g.globalAlpha *= right;
          g.fillStyle = C.plum2; Art.round(g, 410, 26, 370, H - 52, 24); g.fill();
          Art.text(g, 'Molecular', 595, 66, { font: 'display', size: 36, color: C.sun });
          Art.formula(g, 'H2O2', 595, 160, { size: 64, colorize: true });
          Art.arrow(g, 595, 208, 595, 254, { color: C.leaf, w: 7, p: seg(p, 0.62, 0.74) });
          Art.formula(g, 'H2O2', 595, 306, { size: 70, colorize: true });
          Art.text(g, 'keep the real count', 595, 378, { size: 27, color: C.leaf });
          g.restore();
          void t;
        },
      },
    ],
  });
  void Sim2;
});
