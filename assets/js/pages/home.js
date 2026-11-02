/* Home page: the atom pond, the burrow map, and the core. */
Lab.ready(function () {
  'use strict';
  const { clamp, lerp, rand, ease } = Lab;
  const TAU = Math.PI * 2;

  /* ---------- The atom pond ----------
     Atoms have a number of bonds they want (their valence). Touch two with open slots and they bond.
     An atom frowns until its slots are full. When a whole molecule is happy, it gets a name.
     This is octet thinking made into a toy, not a reaction simulator. */
  const WANT = { H: 1, O: 2, N: 3, C: 4, Cl: 1, Na: 1 };
  const RADIUS = { H: 25, O: 36, N: 36, C: 38, Cl: 40, Na: 42 };
  const NAMES = {
    'H2': 'hydrogen gas', 'O2': 'oxygen gas', 'N2': 'nitrogen gas', 'Cl2': 'chlorine gas', 'H2O': 'water', 'CO2': 'carbon dioxide', 'CH4': 'methane',
    'H3N': 'ammonia', 'NaCl': 'table salt', 'ClH': 'hydrochloric acid gas', 'H2O2': 'hydrogen peroxide', 'CHN': 'hydrogen cyanide', 'C2H6': 'ethane', 'C2H4': 'ethylene',
    'C2H2': 'acetylene', 'CH2O': 'formaldehyde', 'C2H6O': 'ethanol or dimethyl ether', 'CH4O': 'methanol', 'C3H8': 'propane', 'CO': 'carbon monoxide', 'H2N2': 'diazene',
    'CCl4': 'carbon tetrachloride', 'Cl2O': 'dichlorine monoxide', 'H4N2': 'hydrazine', 'NCl3': 'nitrogen trichloride', 'CHCl3': 'chloroform', 'CH2Cl2': 'dichloromethane', 'CH3Cl': 'chloromethane', 'O2N2': 'a fun one',
  };

  const canvas = document.getElementById('pond');
  const g = canvas.getContext('2d');
  let W = 800, H = 600, dpr = 1, atoms = [], bonds = [], grabbed = null, grabOffset = [0, 0], pointer = null, ambient = 0, last = 0, visible = true, raf = 0;
  const made = new Set(Lab.store.get('pondMade', []));
  const popups = [];

  function spawnList() {
    // A pond that can always make water, methane, ammonia, CO2 and salt.
    return ['O', 'H', 'H', 'H', 'H', 'C', 'H', 'O', 'O', 'N', 'H', 'H', 'H', 'H', 'Na', 'Cl', 'H', 'C', 'O', 'O', 'Cl', 'Na', 'H', 'H'];
  }
  function safeBox() {
    // Keep atoms away from the headline at rest so the words stay readable.
    const copy = document.querySelector('.pond-copy').getBoundingClientRect();
    const host = canvas.getBoundingClientRect();
    return { x0: 0, y0: copy.top - host.top - 20, x1: copy.right - host.left + 26, y1: copy.bottom - host.top + 20 };
  }
  function init() {
    const n = W < 600 ? 13 : W < 1000 ? 18 : 24;
    const box = safeBox();
    atoms = spawnList().slice(0, n).map((sym, i) => {
      let x = 0, y = 0, tries = 0;
      do {
        x = 50 + rand(i * 2.7 + tries) * (W - 100);
        y = 50 + rand(i * 5.3 + tries * 3) * (H - 170);
        tries++;
      } while (tries < 60 && x > box.x0 && x < box.x1 && y > box.y0 && y < box.y1);
      const a = rand(i + 9) * TAU;
      return { id: i, sym, x, y, vx: Math.cos(a) * 18, vy: Math.sin(a) * 18, r: RADIUS[sym] * (W < 700 ? 0.82 : 1), want: WANT[sym], bonds: 0, mood: 'happy', seed: i, bump: 0 };
    });
    bonds = [];
  }
  function fit() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    const nw = r.width, nh = r.height;
    const scaleChanged = Math.abs(nw - W) > 2 || Math.abs(nh - H) > 2;
    canvas.width = Math.round(nw * dpr); canvas.height = Math.round(nh * dpr);
    if (scaleChanged || !atoms.length) { W = nw; H = nh; init(); }
    W = nw; H = nh;
  }
  const open = (a) => a.want - a.bonds;
  const bondOf = (a, b) => bonds.find((k) => (k.a === a && k.b === b) || (k.a === b && k.b === a));
  function clusterOf(a) {
    const seen = new Set([a]), todo = [a];
    while (todo.length) {
      const x = todo.pop();
      bonds.forEach((k) => {
        const o = k.a === x ? k.b : k.b === x ? k.a : null;
        if (o && !seen.has(o)) { seen.add(o); todo.push(o); }
      });
    }
    return [...seen];
  }
  /** Hill-system formula: C first, then H, then the rest alphabetically, as in NAMES. */
  function formula(list) {
    const c = {};
    list.forEach((a) => (c[a.sym] = (c[a.sym] || 0) + 1));
    let keys = Object.keys(c).sort();
    if (c.C) keys = ['C', 'H', ...keys.filter((k) => k !== 'C' && k !== 'H')].filter((k) => c[k]);
    return keys.map((k) => k + (c[k] > 1 ? c[k] : '')).join('');
  }
  const SHOW = { 'H3N': 'NH3', 'ClH': 'HCl', 'H2N2': 'N2H2', 'H4N2': 'N2H4', 'Cl2O': 'Cl2O', 'O2N2': 'N2O2' };
  const moeHost = document.getElementById('pond-moe');
  let cheerTimer = 0;
  function cheer() {
    moeHost.innerHTML = Moe.svg('cheer');
    clearTimeout(cheerTimer);
    cheerTimer = setTimeout(() => { moeHost.innerHTML = Moe.svg('wave'); }, 1500);
  }
  function checkComplete(a) {
    const list = clusterOf(a);
    if (list.length < 2 || list.some((x) => open(x) > 0)) return;
    const f = formula(list);
    const label = NAMES[f];
    const cx = list.reduce((s, x) => s + x.x, 0) / list.length, cy = list.reduce((s, x) => s + x.y, 0) / list.length;
    const show = SHOW[f] || f;
    popups.push({ x: cx, y: cy - 60, t: 0, f: show, name: label || 'a new molecule' });
    Lab.sound.good();
    cheer();
    if (!made.has(show)) {
      made.add(show);
      Lab.store.set('pondMade', [...made]);
      paintMade();
      if (made.size === 1 || made.size === 3 || made.size === 6) Lab.collection.award(1);
    }
  }
  function tryBond(a, b) {
    if (a === b || open(a) <= 0 || open(b) <= 0) return;
    const existing = bondOf(a, b);
    if (a.sym === 'Na' || b.sym === 'Na') {
      // Sodium is not a covalent partner. It only hands its electron to something that wants one.
      const other = a.sym === 'Na' ? b : a;
      if (other.sym !== 'Cl' || existing) return;
    }
    if (a.sym === 'H' && b.sym === 'H' && (clusterOf(a).length > 1 || clusterOf(b).length > 1)) return;
    if (existing) {
      if (existing.order >= 3) return;
      if (grabbed && !(grabbed === a || grabbed === b)) return;
      existing.order++; a.bonds++; b.bonds++;
      a.bump = b.bump = 1;
      if (open(a) === 0) checkComplete(a); else if (open(b) === 0) checkComplete(b);
      Lab.sound.pop();
      return;
    }
    if (clusterOf(a).includes(b)) return;
    bonds.push({ a, b, order: 1, ionic: a.sym === 'Na' || b.sym === 'Na' });
    a.bonds++; b.bonds++;
    a.bump = b.bump = 1;
    Lab.sound.pop();
    const hint = document.getElementById('pond-hint');
    if (hint && !hint.dataset.done) { hint.dataset.done = '1'; hint.innerHTML = 'Bonded! Atoms stay grumpy until they have all the bonds they want. Yellow rings are empty slots.'; }
    checkComplete(a);
  }
  function step(dt) {
    ambient += dt;
    const box = safeBox();
    atoms.forEach((a) => {
      a.bump = Math.max(0, a.bump - dt * 3);
      a.mood = open(a) === 0 ? 'grin' : a.bonds > 0 ? 'happy' : a.want > 1 ? 'grumpy' : 'happy';
      if (a === grabbed) return;
      a.vx += Math.sin(ambient * 0.4 + a.seed * 2.1) * 6 * dt;
      a.vy += Math.cos(ambient * 0.33 + a.seed * 1.3) * 6 * dt;
      // Atoms drift away from the headline.
      const pad = a.r;
      if (a.x > box.x0 - pad && a.x < box.x1 + pad && a.y > box.y0 - pad && a.y < box.y1 + pad) {
        // Wide layouts drift right, narrow ones drift down: whichever way leaves the words.
        if (box.x1 - box.x0 > W * 0.7) a.vy += 120 * dt; else a.vx += 90 * dt;
      }
    });
    // Springs along bonds.
    bonds.forEach((k) => {
      const dx = k.b.x - k.a.x, dy = k.b.y - k.a.y, d = Math.hypot(dx, dy) || 1;
      const rest = (k.a.r + k.b.r) * (k.ionic ? 0.98 : 0.86);
      const f = (d - rest) * 26 * dt;
      const nx = dx / d, ny = dy / d;
      if (k.a !== grabbed) { k.a.vx += nx * f; k.a.vy += ny * f; }
      if (k.b !== grabbed) { k.b.vx -= nx * f; k.b.vy -= ny * f; }
    });
    // Atoms in the same molecule spread out, which gives water its bend without storing angles.
    for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
      const A = atoms[i], B = atoms[j];
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
      const nx = dx / d, ny = dy / d;
      const bonded = bondOf(A, B);
      const min = A.r + B.r;
      if (!bonded) {
        const shareNeighbor = bonds.some((k) => (k.a === A || k.b === A) && bonds.some((m) => (m.a === B || m.b === B) && (m.a === k.a || m.a === k.b || m.b === k.a || m.b === k.b)));
        if (shareNeighbor && d < min * 1.5) {
          const f = (min * 1.5 - d) * 8 * dt;
          if (A !== grabbed) { A.vx -= nx * f; A.vy -= ny * f; }
          if (B !== grabbed) { B.vx += nx * f; B.vy += ny * f; }
        }
        if (d < min) {
          // Contact: bond if allowed, otherwise bounce.
          const held = grabbed === A || grabbed === B;
          if (held) tryBond(A, B);
          if (!bondOf(A, B)) {
            const push = (min - d) * 0.5;
            if (A !== grabbed) { A.x -= nx * push; A.y -= ny * push; }
            if (B !== grabbed) { B.x += nx * push; B.y += ny * push; }
            const rel = (A.vx - B.vx) * nx + (A.vy - B.vy) * ny;
            if (rel > 0) { A.vx -= nx * rel; A.vy -= ny * rel; B.vx += nx * rel; B.vy += ny * rel; }
          }
        }
      } else if (grabbed && (grabbed === A || grabbed === B) && d < min * 0.92) {
        tryBond(A, B);
      }
    }
    atoms.forEach((a) => {
      if (a === grabbed) return;
      a.vx *= 1 - 1.4 * dt; a.vy *= 1 - 1.4 * dt;
      const sp = Math.hypot(a.vx, a.vy);
      const max = 180;
      if (sp > max) { a.vx *= max / sp; a.vy *= max / sp; }
      a.x += a.vx * dt; a.y += a.vy * dt;
      const floor = H - 86;
      if (a.x < a.r) { a.x = a.r; a.vx = Math.abs(a.vx); }
      if (a.x > W - a.r) { a.x = W - a.r; a.vx = -Math.abs(a.vx); }
      if (a.y < a.r) { a.y = a.r; a.vy = Math.abs(a.vy); }
      if (a.y > floor - a.r) { a.y = floor - a.r; a.vy = -Math.abs(a.vy); }
    });
    popups.forEach((p) => (p.t += dt));
    while (popups.length && popups[0].t > 3.4) popups.shift();
  }
  function drawBg() {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#120A26'); sky.addColorStop(0.55, '#26163F'); sky.addColorStop(1, '#3A2150');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // Stars twinkle slowly. Nothing else moves unless it teaches.
    for (let i = 0; i < 70; i++) {
      const x = rand(i + 1.1) * W, y = rand(i + 4.4) * H * 0.82;
      const tw = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(ambient * (0.3 + rand(i) * 0.7) + i));
      g.fillStyle = `rgba(230,215,255,${tw * (0.25 + rand(i + 7) * 0.55)})`;
      g.beginPath(); g.arc(x, y, 0.7 + rand(i + 2) * 1.5, 0, TAU); g.fill();
    }
  }
  function lookTarget(a) {
    if (pointer) { const d = Math.hypot(pointer.x - a.x, pointer.y - a.y) || 1; return [(pointer.x - a.x) / d, (pointer.y - a.y) / d]; }
    return [Math.sin(ambient * 0.5 + a.seed) * 0.5, Math.cos(ambient * 0.4 + a.seed) * 0.3];
  }
  function draw() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBg();
    bonds.forEach((k) => {
      if (k.ionic) {
        g.strokeStyle = 'rgba(255,210,63,.75)'; g.lineWidth = 4; g.setLineDash([3, 8]); g.lineCap = 'round';
        g.beginPath(); g.moveTo(k.a.x, k.a.y); g.lineTo(k.b.x, k.b.y); g.stroke(); g.setLineDash([]);
      } else Art.bond(g, k.a.x, k.a.y, k.b.x, k.b.y, { order: k.order, width: 7 });
    });
    atoms.forEach((a) => {
      const s = 1 + a.bump * 0.2;
      const charge = bonds.some((k) => k.ionic && (k.a === a || k.b === a)) ? (a.sym === 'Na' ? '+' : '-') : null;
      Art.atom(g, a.x, a.y, a.r * s, a.sym, { face: a.mood, look: lookTarget(a), t: ambient, seed: a.seed, charge });
      // Show empty bond slots as small open rings.
      if (open(a) > 0 && a.bonds > 0) {
        for (let i = 0; i < open(a); i++) {
          const an = -1.2 + i * 0.9 + Math.sin(ambient) * 0.1;
          g.strokeStyle = '#FFD23F'; g.lineWidth = 2.6;
          g.beginPath(); g.arc(a.x + Math.cos(an) * (a.r + 9), a.y + Math.sin(an) * (a.r + 9), 5, 0, TAU); g.stroke();
        }
      }
    });
    popups.forEach((p) => {
      const q = clamp(p.t * 4), fade = clamp(3.4 - p.t);
      const s = ease.back(q);
      const px = clamp(p.x, 170, W - 170), py = Math.max(60, p.y - p.t * 10);
      g.save();
      g.globalAlpha = fade; g.translate(px, py); g.scale(s, s);
      g.font = `700 21px ${Art.FONT_BODY}`;
      const nameW = g.measureText(p.name).width;
      const w = Math.max(nameW + 34, 140);
      g.fillStyle = '#3DDC84'; g.strokeStyle = '#0B2A1A'; g.lineWidth = 3;
      Art.round(g, -w / 2, -40, w, 76, 22); g.fill(); g.stroke();
      Art.formula(g, p.f, 0, -14, { size: 28, color: '#0B2A1A' });
      g.fillStyle = '#0B2A1A'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `700 21px ${Art.FONT_BODY}`;
      g.fillText(p.name, 0, 19);
      g.restore();
      Art.burst(g, px, py, clamp(p.t / 0.9), { n: 16, r: 120, seed: p.f.length });
    });
  }
  function frame(now) {
    raf = 0;
    if (!visible) return;
    const dt = last ? Math.min(0.04, (now - last) / 1000) : 0;
    last = now;
    if (!Lab.reducedMotion || grabbed) step(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }
  const toLocal = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const hit = (p) => {
    let best = null, bd = Infinity;
    atoms.forEach((a) => { const d = Math.hypot(a.x - p.x, a.y - p.y); if (d < a.r + 14 && d < bd) { best = a; bd = d; } });
    return best;
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = toLocal(e);
    pointer = p;
    const a = hit(p);
    if (a) {
      grabbed = a; grabOffset = [a.x - p.x, a.y - p.y];
      try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ }
      canvas.classList.add('is-dragging');
      a.bump = 0.6;
    }
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = toLocal(e);
    pointer = p;
    canvas.style.cursor = grabbed ? 'grabbing' : hit(p) ? 'grab' : 'default';
    if (grabbed) {
      grabbed.x = clamp(p.x + grabOffset[0], grabbed.r, W - grabbed.r);
      grabbed.y = clamp(p.y + grabOffset[1], grabbed.r, H - 86 - grabbed.r);
      grabbed.vx = grabbed.vy = 0;
      if (Lab.reducedMotion) { step(0.016); draw(); }
    }
  });
  const release = () => { if (grabbed) { grabbed.vx = grabbed.vy = 0; } grabbed = null; canvas.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { if (!grabbed) pointer = null; });

  function paintMade() {
    const ul = document.getElementById('pond-made');
    ul.innerHTML = [...made].slice(-8).map((f) => `<li>${Lab.fHTML(f)}</li>`).join('');
  }
  paintMade();
  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible && !raf) { last = 0; raf = requestAnimationFrame(frame); }
  }, { threshold: 0.01 }).observe(canvas);
  new ResizeObserver(fit).observe(canvas);
  fit();
  if (document.fonts) document.fonts.ready.then(draw);
  draw();
  window.__pond = { atoms: () => atoms, bonds: () => bonds, tryBond };

  // Returning learners get a direct way back.
  const doneMap = Lab.progress.all();
  const nextLesson = Lab.lessons.find((l) => !doneMap[l.id]);
  const finished = Lab.progress.count();
  if (finished && nextLesson) {
    const go = document.getElementById('pond-go');
    go.textContent = 'Keep digging';
    go.href = nextLesson.href;
    const resume = document.getElementById('pond-resume');
    resume.hidden = false;
    resume.innerHTML = `${finished} of ${Lab.lessons.length} lessons finished. Next up: <a href="${nextLesson.href}">${nextLesson.title}</a>.`;
  }

  /* ---------- The burrow map ---------- */
  const ink = (hex) => Art.mix(hex, '#ffffff', 0.45);
  const chambers = document.getElementById('chambers');
  chambers.innerHTML = Lab.course.map((u) => {
    const color = Lab.unitColor(u.id);
    return `<article class="chamber" data-unit="${u.id}" style="--u:${color};--u-ink:${ink(color)}">
      <div class="chamber-art"><canvas data-art="${u.id}" width="340" height="260" aria-hidden="true"></canvas></div>
      <div>
        <p class="chamber-depth">${u.depth}</p>
        <h3>${u.title}</h3>
      </div>
      <ol>${u.lessons.map((l) => `<li><a class="chamber-link" data-id="${l.id}" href="${l.href}"><span class="n">${l.num}</span><span>${l.title}<small>${l.blurb}</small></span><span class="tick">✓</span></a></li>`).join('')}</ol>
      <div class="chamber-meter"><span></span></div>
    </article>`;
  }).join('');
  Lab.placeMoe(document.getElementById('burrow'));

  function paintProgress() {
    const done = Lab.progress.all();
    Lab.$$('.chamber').forEach((c) => {
      const links = Lab.$$('.chamber-link', c);
      let n = 0;
      links.forEach((a) => { const d = !!done[a.dataset.id]; a.classList.toggle('is-done', d); if (d) n++; });
      c.querySelector('.chamber-meter > span').style.width = (100 * n) / links.length + '%';
      c.classList.toggle('is-complete', n === links.length);
    });
  }
  paintProgress();
  document.addEventListener('lab:progress', paintProgress);

  /* Each chamber has a little live diorama of what it teaches. */
  const SCENES = {
    u0(c, t) { // Three views: drop, molecule, symbol
      Art.zoom(c, 62, 134, 118, 76, 56, (gg, x, y) => Art.molecule(gg, x, y, 38, 'H2O', { style: 'fill', atomScale: 1.28, face: 'happy', t }), { rim: Art.C.cyan });
      Art.beaker(c, 50, 196, 72, 76, { level: 0.7, ticks: false });
      Art.formula(c, 'H2O', 124, 170, { size: 28, colorize: true });
    },
    u1(c, t) { // Solid, liquid, gas
      const cols = [[32, 'solid'], [85, 'liquid'], [138, 'gas']];
      cols.forEach(([x, k], i) => {
        c.fillStyle = 'rgba(255,255,255,.08)'; Art.round(c, x - 24, 22, 48, 158, 10); c.fill();
        for (let n = 0; n < 12; n++) {
          let px, py;
          if (i === 0) { px = x - 14 + (n % 3) * 14 + Math.sin(t * 8 + n) * 1; py = 174 - 6 - Math.floor(n / 3) * 14 + Math.cos(t * 8 + n) * 1; }
          else if (i === 1) { px = x + Math.sin(t * 1.3 + n * 1.9) * 16; py = 165 - (n % 4) * 14 + Math.cos(t * 1.6 + n) * 4; }
          else { px = x + Math.sin(t * 1.1 + n * 2.3) * 19; py = 100 + Math.sin(t * 0.9 + n * 1.7) * 70; }
          if (n < (i === 2 ? 7 : 12)) Art.ball(c, px, py, 6.5, Art.elementColor('O'));
        }
        void k;
      });
    },
    u2(c, t) { // An atom with orbiting electrons
      const cx = 85, cy = 100;
      c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.8;
      [[60, 22, 0.4], [60, 22, -0.8], [60, 22, 1.5]].forEach(([a, b, rot], i) => {
        c.beginPath(); c.ellipse(cx, cy, a, b, rot, 0, TAU); c.stroke();
        const an = t * (1.5 + i * 0.3) + i * 2;
        const ex = a * Math.cos(an), ey = b * Math.sin(an);
        Art.electron(c, cx + ex * Math.cos(rot) - ey * Math.sin(rot), cy + ex * Math.sin(rot) + ey * Math.cos(rot), 5);
      });
      Art.proton(c, cx - 6, cy - 3, 10); Art.neutron(c, cx + 7, cy - 4, 10); Art.proton(c, cx + 2, cy + 7, 10);
    },
    u3(c, t) { // Moe and the big number
      Art.moe(c, 45, 190, 118, 'cheer', { t });
      Art.text(c, '6.02', 126, 74, { font: 'display', size: 28, color: Art.C.sun });
      Art.text(c, '× 10²³', 126, 104, { font: 'display', size: 24, color: Art.C.sun });
      Art.digitalScale(c, 125, 186, 74, '1 mol', { size: 13 });
    },
    u4(c, t) { // Methane burning
      Art.molecule(c, 42, 112, 25, 'CH4', { labels: false });
      Art.flame(c, 110, 190, 110, t, { kind: 'blue', wide: 1.1 });
      Art.molecule(c, 128, 44, 22, 'CO2', { labels: false, rot: Math.sin(t) * 0.2 });
      Art.molecule(c, 40, 42, 22, 'H2O', { labels: false, style: 'fill', atomScale: 1.2, rot: Math.cos(t) * 0.3 });
    },
    u5(c, t) { // A precipitate forming
      Art.beaker(c, 85, 192, 128, 150, {
        level: 0.8, liquid: '#46B9F0', ticks: false,
        inside(gg, box) {
          for (let i = 0; i < 26; i++) {
            const ph = (t * 0.12 + rand(i)) % 1;
            const x = box.x0 + 8 + rand(i + 3) * (box.x1 - box.x0 - 16), y = lerp(box.top + 6, box.bottom - 5, ph);
            gg.fillStyle = '#FFF8E0'; gg.beginPath(); gg.arc(x, y, 2 + rand(i + 6) * 2, 0, TAU); gg.fill();
          }
          gg.fillStyle = '#FFF4CF'; gg.beginPath(); gg.ellipse((box.x0 + box.x1) / 2, box.bottom, 70, 14, 0, 0, TAU); gg.fill();
        },
      });
    },
    u6(c, t) { // Hot and cold
      Art.bunsen(c, 58, 196, 0.86, { air: 1, t });
      Art.thermometer(c, 132, 26, 124, 0.45 + 0.2 * Math.sin(t * 0.8), {});
    },
    u7(c, t) { // An electron cloud
      const cx = 85, cy = 100;
      for (let i = 0; i < 340; i++) {
        const u = rand(i) * TAU + t * 0.08, d = Math.sqrt(rand(i + 5)), lobe = i % 2 ? 1 : -1;
        const x = cx + Math.cos(u) * d * 34, y = cy + lobe * 42 + Math.sin(u) * d * 38;
        c.fillStyle = lobe > 0 ? 'rgba(47,214,242,.8)' : 'rgba(255,79,163,.8)';
        c.beginPath(); c.arc(x, y, 1.9, 0, TAU); c.fill();
      }
      Art.ball(c, cx, cy, 6, Art.C.sun);
    },
    u8(c, t) { // A tumbling water molecule, ball and stick
      Art.molecule(c, 85, 96, 62, 'H2O', { rot: Math.sin(t * 0.7) * 0.35, face: 'grin', t });
    },
    u9(c, t) { // A piston of gas
      Art.piston(c, 85, 192, 110, 150, 0.5 + 0.28 * Math.sin(t * 0.9), {
        inside(gg, box) {
          for (let i = 0; i < 9; i++) {
            const x = box.x0 + 12 + Math.abs(((t * (20 + rand(i) * 40) + rand(i + 2) * 200) % 172) - 86) / 86 * (box.x1 - box.x0 - 24);
            const hh = box.bottom - box.top - 22;
            const y = box.top + 11 + Math.abs(((t * (24 + rand(i + 5) * 34) + rand(i + 3) * 200) % 172) - 86) / 86 * hh;
            Art.ball(gg, x, y, 7, Art.elementColor('N'));
          }
        },
      });
    },
    u10(c) { // A crystal
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
        const x = 34 + i * 34 + (j % 2) * 16, y = 44 + j * 34;
        Art.ball(c, x, y, 16, (i + j) % 2 ? Art.elementColor('Cl') : Art.elementColor('Na'));
      }
    },
    u11(c, t) { // Salty ice
      Art.beaker(c, 85, 192, 128, 150, { level: 0.74, liquid: '#46B9F0', ticks: false, inside(gg, box) { Art.bubbles(gg, box.x0 + 12, box.x1 - 12, box.bottom, box.top, t * 0.4, { n: 7, r: 4 }); } });
      Art.atom(c, 58, 96, 15, 'Na', { label: false, charge: '+' });
      Art.atom(c, 112, 112, 18, 'Cl', { label: false, charge: '-' });
    },
    u12(c, t) { // Radioactive decay and heat
      Art.glow(c, 85, 100, 90, Art.C.fire, 0.45 + Math.sin(t * 2) * 0.12);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU, r = i % 2 ? 15 : 8;
        (i % 3 ? Art.proton : Art.neutron)(c, 85 + Math.cos(a) * r, 100 + Math.sin(a) * r, 8);
      }
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + 0.5, d = 24 + ((t * 26 + i * 10) % 56);
        Art.ball(c, 85 + Math.cos(a) * d, 100 + Math.sin(a) * d, 4, Art.C.sun);
      }
    },
  };
  // Dioramas draw at 170 by 200 units on a 2x canvas, only while on screen.
  const dioramas = Lab.$$('canvas[data-art]').map((cv) => {
    const c = cv.getContext('2d');
    return { cv, c, id: cv.dataset.art, on: false };
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const d = dioramas.find((x) => x.cv === e.target);
    d.on = e.isIntersecting;
  }), { rootMargin: '40px' });
  dioramas.forEach((d) => {
    d.cv.width = 340; d.cv.height = 400;
    io.observe(d.cv);
  });
  const renderDiorama = (d, t) => {
    const c = d.c;
    c.setTransform(2, 0, 0, 2, 0, 0);
    const bg = c.createRadialGradient(85, 90, 10, 85, 100, 130);
    bg.addColorStop(0, '#3A2466'); bg.addColorStop(1, '#170C29');
    c.fillStyle = bg; c.fillRect(0, 0, 170, 200);
    try { SCENES[d.id](c, t); } catch (e) { console.error(e); }
  };
  let t0 = performance.now();
  (function loop(now) {
    const t = (now - t0) / 1000;
    if (!Lab.reducedMotion) dioramas.forEach((d) => { if (d.on) renderDiorama(d, t); });
    requestAnimationFrame(loop);
  })(t0);
  dioramas.forEach((d) => renderDiorama(d, 1));
  if (document.fonts) document.fonts.ready.then(() => dioramas.forEach((d) => renderDiorama(d, 1)));

  /* ---------- The tunnel: a winding path through the chambers, with Moe digging along it ---------- */
  const burrow = document.getElementById('burrow');
  const tunnel = document.getElementById('tunnel');
  const digger = document.getElementById('digger');
  let path = null, pathLen = 0, ropes = null;
  function buildTunnel() {
    const box = burrow.getBoundingClientRect();
    const pts = Lab.$$('.chamber').map((c) => {
      const r = c.getBoundingClientRect();
      const left = r.left - box.left < 40;
      // Run through the empty soil beside each chamber, ducking behind chambers to cross over.
      const free = box.width - r.width;
      return { x: left ? r.right - box.left + free * 0.52 : r.left - box.left - free * 0.52, y: r.top - box.top + r.height / 2 };
    });
    if (!pts.length) return;
    const W2 = box.width, Hh = box.height;
    let d = `M${W2 / 2} -10`;
    pts.forEach((p, i) => {
      const prev = i ? pts[i - 1] : { x: W2 / 2, y: -10 };
      const mid = (prev.y + p.y) / 2;
      d += `C${prev.x} ${mid} ${p.x} ${mid} ${p.x} ${p.y}`;
    });
    const last = pts[pts.length - 1];
    d += `C${last.x} ${Hh} ${W2 / 2} ${Hh} ${W2 / 2} ${Hh + 60}`;
    tunnel.setAttribute('viewBox', `0 0 ${W2} ${Hh}`);
    tunnel.innerHTML = `<path d="${d}" fill="none" stroke="#120724" stroke-width="58" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="#25133F" stroke-width="42" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="#FFD23F" stroke-width="4" stroke-dasharray="3 15" stroke-linecap="round" opacity=".55"/>`;
    path = tunnel.querySelector('path');
    pathLen = path.getTotalLength();
    ropes = true;
    placeDigger();
  }
  function placeDigger() {
    if (!path || !ropes) return;
    const box = burrow.getBoundingClientRect();
    const u = clamp((innerHeight * 0.55 - box.top) / box.height);
    digger.style.opacity = u <= 0.002 ? 0 : 1;
    const pt = path.getPointAtLength(u * pathLen);
    const after = path.getPointAtLength(Math.min(pathLen, u * pathLen + 6));
    const flip = after.x < pt.x ? -1 : 1;
    digger.style.transform = `translate(${pt.x}px, ${pt.y}px) scaleX(${flip})`;
  }
  addEventListener('scroll', placeDigger, { passive: true });
  new ResizeObserver(buildTunnel).observe(burrow);
  buildTunnel();

  /* ---------- The core: slow-moving magma ---------- */
  const coreC = document.getElementById('core-canvas');
  const coreX = coreC.getContext('2d');
  let coreOn = false;
  new IntersectionObserver((es) => { coreOn = es[0].isIntersecting; }).observe(coreC);
  const paintCore = (t) => {
    const r = coreC.getBoundingClientRect();
    if (coreC.width !== Math.round(r.width) || coreC.height !== Math.round(r.height)) { coreC.width = Math.round(r.width); coreC.height = Math.round(r.height); }
    const w = coreC.width, h = coreC.height;
    const bg = coreX.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#451430'); bg.addColorStop(0.5, '#7C1E22'); bg.addColorStop(1, '#C9440F');
    coreX.fillStyle = bg; coreX.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const x = rand(i) * w + Math.sin(t * 0.14 + i) * 40, y = h * (0.35 + rand(i + 3) * 0.75) + Math.cos(t * 0.11 + i * 2) * 26;
      const R = 40 + rand(i + 5) * 120;
      const gg = coreX.createRadialGradient(x, y, 0, x, y, R);
      gg.addColorStop(0, `rgba(255,${130 + Math.floor(rand(i + 7) * 90)},40,.28)`);
      gg.addColorStop(1, 'rgba(255,120,30,0)');
      coreX.fillStyle = gg; coreX.fillRect(x - R, y - R, R * 2, R * 2);
    }
  };
  (function coreLoop(now) {
    if (coreOn && !Lab.reducedMotion) paintCore(now / 1000);
    requestAnimationFrame(coreLoop);
  })(performance.now());
  paintCore(1);
});
