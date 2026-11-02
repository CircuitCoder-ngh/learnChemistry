/* Lesson 10.3: Solids and crystals. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const NA = 6.022e23;

  /* ---------- Particle views of the four kinds ---------- */
  function dots(g, a, b, o = {}) {
    g.save(); g.strokeStyle = o.color || C.sun; g.lineWidth = o.w || 4; g.lineCap = 'round'; g.setLineDash([1, 8]);
    g.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.restore();
  }
  /** Draw a kind of solid around (cx, cy), with a chosen spacing. Pure in t. */
  function drawKind(g, kind, cx, cy, R, t, o = {}) {
    const sp = o.sp || R * 0.4;
    const vib = (i) => [wander(i + 1, t * 6) * 1.8, wander(i + 31, t * 6) * 1.8];
    const n = Math.ceil(R / sp) + 1;
    if (kind === 'ionic') {
      for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
        const na = (i + j + 100) % 2 === 0, v = vib(i * 13 + j);
        if (Math.hypot(i * sp, j * sp) > R + sp * 0.55 || cy + j * sp < 6 || cy + j * sp > 444) continue;
        Art.atom(g, cx + i * sp + v[0], cy + j * sp + v[1], na ? sp * 0.3 : sp * 0.44, na ? 'Na' : 'Cl', { label: na ? '+' : '−' });
      }
    } else if (kind === 'molecular') {
      const s = sp * 0.38;
      for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
        const x = cx + (i + (j % 2 ? 0.5 : 0)) * sp, y = cy + j * sp * 0.9;
        if (i < n) dots(g, [x, y], [x + sp, y], { w: 4 });
        if (j < n) dots(g, [x, y], [x + sp * 0.5, y + sp * 0.9], { w: 4 });
      }
      for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
        const v = vib(i * 7 + j), x = cx + (i + (j % 2 ? 0.5 : 0)) * sp + v[0], y = cy + j * sp * 0.9 + v[1];
        Art.molecule(g, x, y, s, 'H2O', { rot: (i + j) % 2 ? 0.5 : -0.5, style: 'fill', atomScale: 1.2, labels: false });
      }
    } else if (kind === 'network') {
      const pts = [];
      const a = sp * 0.62, dx = a * 1.732, dy = a * 1.5;
      for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
        const x = cx + i * dx + (j % 2 ? dx / 2 : 0), y = cy + j * dy;
        pts.push([x, y], [x, y + a]);
      }
      pts.forEach((A, i) => {
        for (let k = i + 1; k < pts.length; k++) {
          const B = pts[k], d = Math.hypot(A[0] - B[0], A[1] - B[1]);
          if (d < a * 1.05) Art.bond(g, A[0], A[1], B[0], B[1], { width: Math.max(4, sp * 0.1) });
        }
      });
      pts.forEach((A) => Art.atom(g, A[0], A[1], sp * 0.22, 'C', { label: false }));
    } else {
      for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
        const v = vib(i * 11 + j);
        if (Math.hypot((i + (j % 2 ? 0.5 : 0)) * sp, j * sp * 0.87) > R + sp * 0.5 || cy + j * sp * 0.87 < 6 || cy + j * sp * 0.87 > 444) continue;
        Art.atom(g, cx + (i + (j % 2 ? 0.5 : 0)) * sp + v[0], cy + j * sp * 0.87 + v[1], sp * 0.4, 'Cu', { label: '+' });
      }
      for (let i = 0; i < 22; i++) {
        const X = (rand(i + 1) * R * 2 + t * (22 + rand(i + 4) * 40)) % (R * 2);
        const Y = rand(i + 7) * R * 2 + Math.sin(t * 2 + i) * sp * 0.25;
        Art.electron(g, cx - R + X, cy - R + Y, Math.max(4.5, sp * 0.085));
      }
    }
  }
  /** Small lumps you can see. */
  function macro(g, kind, x, y, s, t) {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round';
    const edge = () => { g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.stroke(); };
    if (kind === 'ionic') {
      g.fillStyle = '#F7F5FF'; g.beginPath(); g.moveTo(-50, -18); g.lineTo(14, -18); g.lineTo(14, 46); g.lineTo(-50, 46); g.closePath(); g.fill(); edge();
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(-50, -18); g.lineTo(-22, -44); g.lineTo(42, -44); g.lineTo(14, -18); g.closePath(); g.fill(); edge();
      g.fillStyle = '#D6D1EA'; g.beginPath(); g.moveTo(14, -18); g.lineTo(42, -44); g.lineTo(42, 20); g.lineTo(14, 46); g.closePath(); g.fill(); edge();
    } else if (kind === 'molecular') {
      const ig = g.createLinearGradient(-50, -50, 50, 50); ig.addColorStop(0, 'rgba(235,250,255,.95)'); ig.addColorStop(1, 'rgba(130,205,245,.85)');
      g.fillStyle = ig; Art.round(g, -48, -48, 96, 96, 18); g.fill(); edge();
      g.fillStyle = 'rgba(255,255,255,.75)'; Art.round(g, -34, -36, 34, 9, 4); g.fill();
    } else if (kind === 'network') {
      g.fillStyle = '#BDF3FF'; g.beginPath(); g.moveTo(-50, -14); g.lineTo(-26, -40); g.lineTo(26, -40); g.lineTo(50, -14); g.lineTo(0, 50); g.closePath(); g.fill(); edge();
      g.fillStyle = '#F4FEFF'; g.beginPath(); g.moveTo(-26, -40); g.lineTo(26, -40); g.lineTo(14, -14); g.lineTo(-14, -14); g.closePath(); g.fill(); edge();
      g.fillStyle = '#6FD6F2'; g.beginPath(); g.moveTo(-50, -14); g.lineTo(-14, -14); g.lineTo(0, 50); g.closePath(); g.fill(); edge();
      g.fillStyle = '#94E3F7'; g.beginPath(); g.moveTo(50, -14); g.lineTo(14, -14); g.lineTo(0, 50); g.closePath(); g.fill(); edge();
      const tw = 0.5 + 0.5 * Math.sin(t * 2.6);
      g.fillStyle = `rgba(255,255,255,${tw})`; Art.star(g, 24, -30, 11, t * 0.3);
    } else {
      const cu = g.createLinearGradient(0, -40, 0, 44); cu.addColorStop(0, '#F3B57E'); cu.addColorStop(0.5, '#C5743A'); cu.addColorStop(1, '#8A4A22');
      g.fillStyle = cu; g.beginPath(); g.moveTo(-52, 36); g.bezierCurveTo(-60, -10, -30, -44, 6, -38); g.bezierCurveTo(44, -32, 58, 2, 48, 38); g.closePath(); g.fill(); edge();
      g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-16, -14, 18, 7, -0.5, 0, TAU); g.fill();
    }
    g.restore();
  }
  function kindScene(g, p, t, kind, name, color, facts) {
    macro(g, kind, 96, 266, ease.back(seg(p, 0, 0.2)), t);
    Art.zoom(g, 122, 250, 352, 254, 166, (gg, cx, cy, R) => drawKind(gg, kind, cx, cy, R, t), { p: seg(p, 0.12, 0.38) });
    Art.text(g, name, 28, 50, { font: 'display', size: 40, color, align: 'left', alpha: seg(p, 0, 0.15) });
    const x = 645;
    Art.text(g, 'Held by', x, 72, { size: 23, color: C.dim, alpha: seg(p, 0.38, 0.5) });
    Art.text(g, facts[0], x, 106, { font: 'display', size: 28, color, alpha: seg(p, 0.42, 0.55), maxW: 290 });
    if (facts[1]) Art.text(g, facts[1], x, 140, { font: 'display', size: 28, color, alpha: seg(p, 0.42, 0.55), maxW: 290 });
    facts.slice(2).forEach((f, i) => Art.pill(g, f, x, 212 + i * 62, { size: 24, color: C.plum2, text: '#fff', alpha: seg(p, 0.55 + i * 0.12, 0.68 + i * 0.12) }));
  }

  /* ---------- Story 1: four kinds of solid ---------- */
  Lab.story('#story-kinds', {
    title: 'Look inside four solids',
    scenes: [
      {
        say: '<b>Ionic solids</b>, like salt. Plus and minus ions alternate in a tight pattern, held by the attraction between opposite charges. High melting, brittle, and they conduct only when melted or dissolved.',
        dur: 3.8,
        draw(g, p, t) { kindScene(g, p, t, 'ionic', 'Ionic: salt', C.leaf, ['opposite', 'charges', 'Melts at 801 °C', 'Hard but brittle', 'Conducts when melted']); },
      },
      {
        say: '<b>Molecular solids</b>, like ice. Whole molecules are stacked together, held only by weak <b>intermolecular forces</b>. Low melting and soft. They do not conduct, because there are no free charges.',
        dur: 3.8,
        draw(g, p, t) { kindScene(g, p, t, 'molecular', 'Molecular: ice', C.water, ['intermolecular', 'forces', 'Melts at 0 °C', 'Soft', 'Does not conduct']); },
      },
      {
        say: '<b>Covalent network solids</b>, like diamond. Every atom is covalently bonded to its neighbors, on and on through the whole crystal. It is effectively <b>one giant molecule</b>. Very hard, with very high melting points.',
        dur: 3.8,
        draw(g, p, t) { kindScene(g, p, t, 'network', 'Covalent network: diamond', C.cyan, ['a giant net of', 'covalent bonds', 'Melts near 3500 °C', 'Very hard', 'Does not conduct']); },
      },
      {
        say: '<b>Metallic solids</b>, like copper. Metal atoms give up their outer electrons to a shared <b>sea of electrons</b> that flows between the cations. So metals conduct, bend, and shine.',
        dur: 3.8,
        draw(g, p, t) { kindScene(g, p, t, 'metal', 'Metallic: copper', C.fire, ['a sea of', 'electrons', 'Melts at 1085 °C', 'Bends and stretches', 'Conducts well']); },
      },
      {
        say: 'Melting points show how strong each kind is. Stronger holding means more heat before the particles break free. Metals vary a lot: sodium melts at just 98 °C and tungsten near 3400 °C.',
        dur: 3.6,
        draw(g, p, t) {
          const items = [['Ice', 0, 'molecular', C.water], ['Salt', 801, 'ionic', C.leaf], ['Copper', 1085, 'metal', C.fire], ['Diamond', 3500, 'network', C.cyan]];
          const baseY = 372, maxH = 262;
          items.forEach(([name, T, kind, col], i) => {
            const x = 104 + i * 176, q = ease.out(seg(p, 0.08 + i * 0.14, 0.42 + i * 0.14));
            const h = Math.max(10, (T / 3500) * maxH) * q;
            const gr = g.createLinearGradient(0, baseY - h, 0, baseY);
            gr.addColorStop(0, col); gr.addColorStop(1, Art.mix(col, '#1A0F2E', 0.5));
            g.fillStyle = gr; Art.round(g, x - 52, baseY - h, 104, h, 12); g.fill();
            Art.text(g, `${T === 3500 ? 'about ' : ''}${T.toLocaleString('en-US')} °C`, x, baseY - h - 22, { font: 'display', size: T === 3500 ? 25 : 28, color: C.sun, alpha: q });
            macro(g, kind, x, 410, 0.36, t);
            Art.text(g, name, x + 34, 412, { size: 25, align: 'left', alpha: q });
          });
          Art.text(g, 'Melting points', 28, 44, { font: 'display', size: 34, align: 'left' });
          g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(40, baseY, 720, 3);
        },
      },
    ],
  });

  /* ---------- Bench: stress test ---------- */
  const TEST = { kind: 'metal', type: 'hammer', t0: 0 };
  const RESULT = {
    metal: {
      hammer: ['It bends', 'Layers slide. The electron sea flows along with them, so nothing pushes back.', 'Copper can be hammered flat (malleable) and drawn into wire (ductile). The cations slide past each other while the electrons keep holding everything together.'],
      heat: ['Melts at 1085 °C', 'Metallic bonding is strong, so it takes a lot of heat.', 'Copper melts at 1085 °C. Metals vary widely: gallium melts in your hand at 30 °C, and tungsten needs about 3400 °C.'],
      power: ['It conducts', 'Electrons flow freely through the whole crystal.', 'The electrons carry the current. The cations stay put. This works in the solid, and that is the signature of a metal.'],
    },
    ionic: {
      hammer: ['It shatters', 'Shift one row and plus lines up with plus. They repel, and the crystal splits.', 'This is why ionic solids are brittle. A sharp blow pushes one layer along by one ion, so like charges suddenly face each other and force the crystal apart.'],
      heat: ['Melts at 801 °C', 'Heat must overcome strong attractions between ions.', 'Once melted, the ions can move, and the liquid conducts. Water does a similar job by pulling the ions apart when salt dissolves.'],
      power: ['No current', 'The ions have charge but are locked in place.', 'Solid salt does not conduct, because its ions cannot move. Melt it or dissolve it, and they can. Then it conducts well.'],
    },
    molecular: {
      hammer: ['It crumbles', 'Only weak forces hold it. The molecules come apart whole.', 'Molecular solids are soft, since a blow only has to overcome weak intermolecular forces. Notice that every water molecule stays whole.'],
      heat: ['Melts at 0 °C', 'Weak forces give way easily. No bonds break.', 'Ice melts at 0 °C, because only hydrogen bonds between molecules need to give way. Each molecule stays $\\ce{H2O}$.'],
      power: ['No current', 'No free charges at all, and no ions.', 'Each molecule keeps its electrons to itself and has no overall charge, so nothing can carry a current.'],
    },
    network: {
      hammer: ['It stays whole', 'The hammer bounces. Every atom is locked in by covalent bonds.', 'Diamond is the hardest natural material. To dent it you have to break real covalent bonds, and those go in every direction. A very sharp blow can still cleave it, though.'],
      heat: ['Still solid', 'Melting would mean breaking covalent bonds.', 'Keep the air out and diamond stays solid at 3000 °C. It needs about 3500 °C and high pressure to melt. In air it burns first, because it is carbon.'],
      power: ['No current', 'Every electron is held in a bond.', 'All four valence electrons of each carbon are locked into bonds, so none can move. Graphite is the famous exception, as you will see later on this page.'],
    },
  };
  const GRID = { cols: 7, rows: 4, sp: 60, x0: 44, y0: 206 };
  const MP = { metal: 1085, ionic: 801, molecular: 0, network: 3000 };
  function testPos(kind, type, c, r, tau, k) {
    const { sp, x0, y0, cols } = GRID;
    let x = x0 + c * sp, y = y0 + r * sp, rot = 0;
    if (type === 'hammer') {
      const hit = 0.5;
      if (kind === 'metal') { if (r < 2) x += sp * ease.inOut(seg(tau, hit, hit + 0.7)); }
      if (kind === 'ionic') {
        if (r < 2) x += sp * ease.inOut(seg(tau, hit, hit + 0.45));
        const sp2 = ease.out(seg(tau, hit + 1.05, hit + 1.9));
        if (r < 2) { x += sp2 * 20; y -= sp2 * 76; rot = -0.17 * sp2; } else { x -= sp2 * 28; y += sp2 * 14; }
      }
      if (kind === 'molecular') {
        const near = Math.abs(c - (cols - 1) / 2) + r * 1.1 + rand(k + 2) * 2.2;
        if (near < 4.2) {
          const q = clamp((tau - hit) / 1.2);
          const ang = -Math.PI / 2 + (c - (cols - 1) / 2) * 0.36 + (rand(k) - 0.5) * 0.7;
          const dist = (120 + rand(k + 1) * 90) * ease.out(q);
          x += Math.cos(ang) * dist; y += Math.sin(ang) * dist + q * q * 190;
          rot = q * (rand(k + 5) - 0.5) * 10;
        }
      }
    }
    if (type === 'heat') {
      const T = lerp(kind === 'molecular' ? -30 : 20, MP[kind], clamp(tau / 3.2));
      const m = kind !== 'network' && T >= MP[kind] ? clamp((tau - 3.2) / 1) : 0;
      if (m > 0) { x += wander(k + 3, tau * 1.1) * 30 * m + (rand(k) - 0.5) * 20 * m; y += wander(k + 9, tau * 1.1) * 26 * m + 8 * m; rot = m * wander(k, tau) * 2; }
    }
    return { x, y, rot };
  }
  const testStage = Lab.stage('#c-test', {
    label: 'A close-up of the particles in the chosen solid during the chosen test, with a one-line result beside it.',
    draw(g, t) {
      const tau = t - TEST.t0, { kind, type } = TEST, { cols, rows, sp, x0, y0 } = GRID;
      const res = RESULT[kind][type];
      const vibAmp = type === 'heat' ? 1.2 + 6 * clamp(tau / 3.2) : 1.4;
      // Burners or wiring go underneath the particles.
      if (type === 'heat') [130, 250, 370].forEach((x) => Art.flame(g, x, 448, 34 + clamp(tau) * 26, t + x, { kind: 'blue', wide: 1.6 }));
      if (type === 'power') {
        g.strokeStyle = '#D98A4A'; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(26, 296); g.lineTo(26, 94); g.lineTo(226, 94); g.moveTo(296, 94); g.lineTo(476, 94); g.lineTo(476, 296); g.stroke();
        g.fillStyle = '#D9D1EC'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
        Art.round(g, 90, 72, 92, 44, 8); g.fill(); g.stroke();
        g.fillStyle = '#1A0F2E'; g.fillRect(180, 84, 8, 20);
        Art.text(g, '−  +', 136, 94, { size: 26, color: '#22123A' });
        Art.bulb(g, 260, 62, 34, kind === 'metal' ? clamp(tau * 1.5) : 0);
      }
      // Particles.
      const P = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const k = r * cols + c, q = testPos(kind, type, c, r, tau, k);
        P.push({ c, r, k, x: q.x + wander(k + 1, t * 7) * vibAmp, y: q.y + wander(k + 41, t * 7) * vibAmp, rot: q.rot });
      }
      const at = (c, r) => P[r * cols + c];
      if (kind === 'molecular') {
        const a = type === 'hammer' ? 1 - seg(tau, 0.5, 0.8) * 0.85 : type === 'heat' ? 1 - seg(tau, 3.2, 3.8) : 1;
        P.forEach((q) => { if (q.c < cols - 1) dots(g, [q.x, q.y], [at(q.c + 1, q.r).x, at(q.c + 1, q.r).y], { alpha: a }); if (q.r < rows - 1) dots(g, [q.x, q.y], [at(q.c, q.r + 1).x, at(q.c, q.r + 1).y], { alpha: a }); });
      }
      if (kind === 'network') {
        P.forEach((q) => {
          if (q.c < cols - 1) Art.bond(g, q.x, q.y, at(q.c + 1, q.r).x, at(q.c + 1, q.r).y, { width: 6 });
          if (q.r < rows - 1) Art.bond(g, q.x, q.y, at(q.c, q.r + 1).x, at(q.c, q.r + 1).y, { width: 6 });
        });
      }
      P.forEach((q) => {
        if (kind === 'metal') Art.atom(g, q.x, q.y, 26, 'Cu', { label: '+' });
        else if (kind === 'ionic') { const na = (q.c + q.r) % 2 === 0; Art.atom(g, q.x, q.y, na ? 20 : 29, na ? 'Na' : 'Cl', { label: na ? '+' : '−' }); }
        else if (kind === 'molecular') Art.molecule(g, q.x, q.y, 25, 'H2O', { rot: q.rot + (q.c + q.r) % 2 * 0.9 - 0.45, style: 'fill', atomScale: 1.2, labels: false });
        else Art.atom(g, q.x, q.y, 18, 'C', { label: false });
      });
      if (kind === 'metal') {
        for (let i = 0; i < 24; i++) {
          const flow = type === 'power' ? t * 160 : t * (12 + rand(i) * 18);
          const X = x0 - 30 + ((rand(i + 1) * 480 + flow) % 470);
          const Y = y0 - 22 + rand(i + 7) * (rows - 1) * sp + 22 + Math.sin(t * 1.7 + i) * 9;
          Art.electron(g, X, Y, 6);
        }
        if (type === 'power') {
          // Electrons run around the wire too, in the direction they really go: toward the positive terminal.
          for (let i = 0; i < 7; i++) {
            const u = ((t * 0.26 + i / 7) % 1), len = 202 + 200 + 202 + 200;
            let d = u * len, x, y;
            if (d < 202) { x = 476; y = 296 - d; }
            else if (d < 402) { x = 476 - (d - 202); y = 94; }
            else if (d < 604) { x = 26 + 0; y = 94 + (d - 402); x = 26; }
            else { x = 26 + (d - 604) * 0; y = 296; }
            if (d < 604) Art.electron(g, x, y, 5.5);
          }
        }
      }
      // Repulsion in the shifted salt crystal.
      if (kind === 'ionic' && type === 'hammer') {
        const a = seg(tau, 1.0, 1.15) * (1 - seg(tau, 1.6, 1.9));
        if (a > 0) for (let c = 1; c < cols; c += 2) {
          const low = at(c, 2), hi = at(c - 1, 1);
          Art.arrow(g, low.x, low.y - 24, low.x, low.y - 42, { color: C.red, w: 5, head: 12, alpha: a });
          Art.arrow(g, hi.x, hi.y + 24, hi.x, hi.y + 42, { color: C.red, w: 5, head: 12, alpha: a });
        }
      }
      // Hammer.
      if (type === 'hammer') {
        const down = ease.in(clamp(tau / 0.5));
        const bounce = kind === 'network' ? Math.sin(seg(tau, 0.5, 1.05) * Math.PI) * 0.34 : 0;
        const lift = tau > 1.3 ? ease.inOut(seg(tau, 1.3, 1.9)) * 0.75 : 0;
        const ang = lerp(-0.85, 0, down) - bounce - lift;
        g.save(); g.translate(496, 58); g.rotate(ang);
        g.fillStyle = '#B9825A'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
        Art.round(g, -226, 58, 226, 18, 8); g.fill(); g.stroke();
        const hg = g.createLinearGradient(0, 16, 0, 118);
        hg.addColorStop(0, '#D8D5E8'); hg.addColorStop(1, '#6E6A86');
        g.fillStyle = hg; Art.round(g, -272, 16, 60, 102, 10); g.fill(); g.stroke();
        g.restore();
        const hit = seg(tau, 0.48, 0.95);
        if (hit > 0 && hit < 1) Art.burst(g, 254, 180, hit, { n: 12, r: 70, colors: [C.sun, '#fff', C.fire] });
      }
      // Thermometer, for the heat test.
      const rx = 654;
      if (type === 'heat') {
        const T = lerp(kind === 'molecular' ? -30 : 20, MP[kind], clamp(tau / 3.2));
        Art.text(g, `${T < 0 ? '−' : ''}${Math.round(Math.abs(T)).toLocaleString('en-US')} °C`, rx, 60, { font: 'display', size: 44, color: C.fire });
      }
      // Result.
      const show = type === 'hammer' ? seg(tau, 0.7, 1) : type === 'heat' ? seg(tau, 3, 3.5) : seg(tau, 0.4, 0.8);
      const good = { 'It bends': C.leaf, 'It conducts': C.leaf, 'It shatters': C.red, 'It crumbles': C.fire, 'It stays whole': C.cyan, 'No current': C.dim, 'Still solid': C.cyan }[res[0]] || C.sun;
      Art.pill(g, res[0], rx, 134, { size: 29, font: 'display', color: good, text: '#1A0F2E', alpha: show });
      g.save(); g.globalAlpha *= show;
      Art.para(g, res[1], rx, 178, 262, { size: 23, align: 'center', lh: 29 });
      g.restore();
    },
  });
  function paintTest() { Lab.$('#test-note').innerHTML = Lab.texString(`<p>${RESULT[TEST.kind][TEST.type][2]}</p>`); }
  const rerun = () => { TEST.t0 = testStage.t; paintTest(); };
  Lab.segmented('#test-kind', (v) => { TEST.kind = v; rerun(); });
  Lab.segmented('#test-type', (v) => { TEST.type = v; rerun(); });
  Lab.$('#test-run').addEventListener('click', rerun);
  paintTest();

  /* ---------- Bench: the sorter ---------- */
  const SORT = [
    ['NaCl', 'Table salt', 'Melts at 801 °C. Brittle. Conducts only when melted.', 'ionic', 'A metal with a nonmetal, so it is made of ions. Conducting only when melted is the giveaway.'],
    ['Cu', 'Copper', 'Melts at 1085 °C. Bends. Conducts as a solid.', 'metal', 'A metal element alone. Conducting as a solid points straight to free electrons.'],
    ['H2O', 'Ice', 'Melts at 0 °C. Does not conduct.', 'molecular', 'Only nonmetals, in separate molecules with weak forces between them. The very low melting point confirms it.'],
    ['C', 'Diamond', 'Melts near 3500 °C. Hardest natural material.', 'network', 'Carbon atoms in one giant net of covalent bonds. Almost nothing else is this hard or melts this high.'],
    ['I2', 'Iodine', 'Melts at 114 °C. Soft, dark crystals.', 'molecular', 'Separate $\\ce{I2}$ molecules held by London forces. A nonmetal with a low melting point.'],
    ['SiO2', 'Quartz', 'Melts near 1700 °C. Very hard. Does not conduct.', 'network', 'The trap: it looks like $\\ce{CO2}$, but it has no separate molecules. Every Si bonds to 4 O in a giant net.'],
    ['MgO', 'Magnesium oxide', 'Melts near 2850 °C. Brittle. Conducts when melted.', 'ionic', 'A metal with a nonmetal. It melts so high because $\\ce{Mg^2+}$ and $\\ce{O^2-}$ have double charges.'],
    ['Na', 'Sodium', 'Melts at 98 °C. So soft you can cut it. Conducts as a solid.', 'metal', 'The trap: soft with a low melting point suggests molecular, but it is a metal element and it conducts as a solid.'],
    ['CO2', 'Dry ice', 'Turns to gas at −78.5 °C. Does not conduct.', 'molecular', 'Only nonmetals, in separate linear molecules held by London forces.'],
    ['W', 'Tungsten', 'Melts near 3400 °C. Conducts as a solid.', 'metal', 'The trap: a melting point like a network solid, but it is a metal element and it conducts as a solid. It is used in hot lamp filaments.'],
    ['SiC', 'Silicon carbide', 'Very hard, breaks down near 2700 °C. Used in sandpaper.', 'network', 'Two nonmetal-like elements, so you might guess molecular, but it is a giant net like diamond. This is one to memorize.'],
    ['KBr', 'Potassium bromide', 'Melts at 734 °C. Brittle. Conducts when dissolved.', 'ionic', 'A metal with a nonmetal, made of $\\ce{K+}$ and $\\ce{Br-}$ ions.'],
  ];
  const BIN = { ionic: ['Ionic', C.leaf], molecular: ['Molecular', C.water], network: ['Covalent network', C.cyan], metal: ['Metallic', C.fire] };
  const sorter = { i: 0, score: 0, picked: null, firstTry: true, t0: 0, done: false };
  const sorterStage = Lab.stage('#c-class', {
    label: 'A solid with clues about its properties. After answering, a magnifier shows its particles.',
    draw(g, t) {
      const [f, name, clue, kind] = SORT[sorter.i];
      const el = t - sorter.t0, right = sorter.picked === kind;
      const shownX = 270;
      Art.formula(g, f, shownX, 72, { size: 66, colorize: true });
      Art.text(g, name, shownX, 132, { size: 32, color: C.dim });
      g.font = `700 25px ${Art.FONT_BODY}`;
      Art.para(g, clue, shownX, 172, 410, { size: 26, align: 'center', lh: 33 });
      if (sorter.picked) {
        const a = clamp(el * 3);
        Art.pill(g, right ? 'Right!' : `Not ${BIN[sorter.picked][0].toLowerCase()}`, shownX, 310, { size: 34, font: 'display', color: right ? C.leaf : C.red, text: '#1A0F2E', alpha: a });
        Art.text(g, `It is ${BIN[kind][0].toLowerCase()}`, shownX, 376, { font: 'display', size: 36, color: BIN[kind][1], alpha: a });
        Art.zoom(g, shownX + 180, 90, 628, 224, 152, (gg, cx, cy, R) => drawKind(gg, kind, cx, cy, R, t), { p: clamp(el * 2) });
      } else {
        // The four bins as pictures, waiting.
        const keys = ['ionic', 'molecular', 'network', 'metal'];
        keys.forEach((k, i) => {
          const x = 572 + (i % 2) * 118, y = 136 + Math.floor(i / 2) * 178;
          g.save(); g.beginPath(); g.arc(x, y, 54, 0, TAU); g.clip();
          g.fillStyle = '#150A28'; g.fillRect(x - 54, y - 54, 108, 108);
          drawKind(g, k, x, y, 54, t, { sp: 26 });
          g.restore();
          g.strokeStyle = BIN[k][1]; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 54, 0, TAU); g.stroke();
          const words = BIN[k][0].split(' ');
          words.forEach((w, j) => Art.text(g, w, x, y + 72 + j * 24, { size: 21, color: BIN[k][1] }));
        });
      }
    },
  });
  function paintSorter() {
    Lab.$('#class-n').textContent = `${sorter.i + 1} of ${SORT.length}`;
    Lab.$('#class-score').textContent = sorter.score;
    Lab.$('#class-next').hidden = !sorter.picked;
    Lab.$$('#class-bins button').forEach((b) => { b.disabled = !!sorter.picked; b.setAttribute('aria-pressed', String(b.dataset.value === sorter.picked)); });
  }
  Lab.$$('#class-bins button').forEach((b) => b.addEventListener('click', () => {
    if (sorter.picked) return;
    sorter.picked = b.dataset.value; sorter.t0 = sorterStage.t;
    const [, , , kind, why] = SORT[sorter.i];
    if (sorter.picked === kind) { sorter.score++; Lab.collection.award(1); } else Lab.sound.bad();
    Lab.$('#class-why').innerHTML = Lab.texString(`<p>${why}</p>`);
    paintSorter();
  }));
  Lab.$('#class-next').addEventListener('click', () => {
    sorter.i = (sorter.i + 1) % SORT.length; sorter.picked = null; sorter.t0 = sorterStage.t;
    Lab.$('#class-why').innerHTML = '<p>Look at the elements first, then use the clues.</p>';
    if (sorter.i === 0) { sorter.score = 0; }
    paintSorter();
  });
  paintSorter();

  /* ---------- Story 2: counting, drawn with a tiny 3D projection ---------- */
  function camera(a, b, s, cx, cy) {
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    return (x, y, z) => {
      const X = x * ca + z * sa, Z = -x * sa + z * ca;
      const Y = y * cb - Z * sb, D = y * sb + Z * cb;
      const k = s * (1 + D * 0.05);
      return { x: cx + X * k, y: cy - Y * k, d: D, k };
    };
  }
  function hull(pts) {
    const P = pts.slice().sort((A, B) => A.x - B.x || A.y - B.y);
    const cross = (O, A, B) => (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
    const lo = [], up = [];
    P.forEach((q) => { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
    P.slice().reverse().forEach((q) => { while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); });
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  /** A wire cube with corner at (x, y, z) and edge e. Returns its projected corners. */
  function cubeCorners(P, x, y, z, e) {
    const out = [];
    for (const i of [0, 1]) for (const j of [0, 1]) for (const k of [0, 1]) out.push(P(x + i * e, y + j * e, z + k * e));
    return out;
  }
  function wireCube(g, P, x, y, z, e, o = {}) {
    const c = cubeCorners(P, x, y, z, e);
    if (o.fill) {
      const H = hull(c);
      g.fillStyle = o.fill; g.beginPath(); H.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath(); g.fill();
    }
    const edges = [[0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]];
    edges.forEach(([u, v]) => {
      g.strokeStyle = o.color || 'rgba(255,255,255,.75)'; g.lineWidth = o.w || 3; g.lineCap = 'round';
      g.globalAlpha = (o.alpha === undefined ? 1 : o.alpha) * (c[u].d + c[v].d < 0 ? 0.5 : 1);
      g.beginPath(); g.moveTo(c[u].x, c[u].y); g.lineTo(c[v].x, c[v].y); g.stroke();
    });
    g.globalAlpha = 1;
    return c;
  }
  /**
   * The piece of an atom inside a cell. dirs says which way the cell lies from the atom along each
   * axis: +1 or -1 cuts that axis at the atom's center, 0 leaves it whole. We clip the ball to the
   * outline of that piece's bounding box, so a wedge reads as a wedge from any camera angle.
   */
  function slice(g, P, c3, r3, dirs, color) {
    const pts = [];
    const span = (d) => (d > 0 ? [0, r3 * 1.04] : d < 0 ? [-r3 * 1.04, 0] : [-r3 * 1.04, r3 * 1.04]);
    const X = span(dirs[0]), Y = span(dirs[1]), Z = span(dirs[2]);
    for (const a of X) for (const b of Y) for (const e of Z) pts.push(P(c3[0] + a, c3[1] + b, c3[2] + e));
    const H = hull(pts), q = P(c3[0], c3[1], c3[2]);
    g.save(); g.beginPath(); H.forEach((v, i) => (i ? g.lineTo(v.x, v.y) : g.moveTo(v.x, v.y))); g.closePath(); g.clip();
    Art.ball(g, q.x, q.y, r3 * q.k, color);
    g.restore();
  }
  const COL = { corner: '#FFD23F', face: '#FF4FA3', center: '#2FD6F2', edge: '#3DDC84' };
  /** N cells that meet around an atom, pulled apart by spread. offs: each cell's direction. */
  function sharedScene(g, p, t, offs, color, e, big, frac, nameTxt, sentence) {
    const spin = -0.62 + Math.sin(t * 0.35) * 0.1;
    const P = camera(spin, 0.42, 84, 276, 226);
    const spread = ease.inOut(seg(p, 0.28, 0.78)) * 0.42;
    const cells = offs.map((o) => {
      const cx = o[0] * (e / 2 + spread), cy = o[1] * (e / 2 + spread), cz = o[2] * (e / 2 + spread);
      return { x: cx - e / 2, y: cy - e / 2, z: cz - e / 2, atom: [o[0] * spread, o[1] * spread, o[2] * spread], d: P(cx, cy, cz).d, o };
    }).sort((A, B) => A.d - B.d);
    cells.forEach((c, i) => {
      const hot = i === cells.length - 1;
      wireCube(g, P, c.x, c.y, c.z, e, { fill: hot ? 'rgba(255,79,163,.16)' : 'rgba(255,255,255,.05)', color: hot ? C.pink : 'rgba(255,255,255,.7)', w: hot ? 4 : 3 });
      if (spread <= 0.002) { if (i === cells.length - 1) { const q = P(0, 0, 0); Art.ball(g, q.x, q.y, big * q.k, color); } } else slice(g, P, c.atom, big, c.o, color);
    });
    const a = seg(p, 0.72, 0.9);
    Art.text(g, nameTxt, 620, 88, { font: 'display', size: 32, color, alpha: seg(p, 0, 0.2) });
    Art.text(g, sentence, 620, 138, { size: 25, alpha: seg(p, 0.1, 0.3) });
    Art.text(g, frac, 620, 256, { font: 'display', size: 96, color: C.sun, alpha: a });
    Art.text(g, 'in each cell', 620, 330, { size: 28, alpha: a });
  }
  /** Draw a full cell with its slices and a sum beside it. */
  function cellScene(g, p, t, kinds, sumLines, totalTxt, extra) {
    const e = 2.5, h = e / 2;
    const P = camera(-0.62 + Math.sin(t * 0.4) * 0.16, 0.42, 82, 262, 232);
    const items = [];
    for (const i of [-1, 1]) for (const j of [-1, 1]) for (const k of [-1, 1]) items.push({ p: [i * h, j * h, k * h], c: COL.corner, r: 0.56, kind: 'corner' });
    if (kinds.includes('center')) items.push({ p: [0, 0, 0], c: COL.center, r: 0.56, kind: 'center' });
    if (kinds.includes('face')) [[h, 0, 0], [-h, 0, 0], [0, h, 0], [0, -h, 0], [0, 0, h], [0, 0, -h]].forEach((q) => items.push({ p: q, c: COL.face, r: 0.56, kind: 'face' }));
    items.forEach((it) => { it.q = P(...it.p); });
    items.sort((A, B) => A.q.d - B.q.d);
    wireCube(g, P, -h, -h, -h, e, { fill: 'rgba(255,255,255,.05)' });
    const show = { corner: seg(p, 0.05, 0.3), face: seg(p, 0.3, 0.55), center: seg(p, 0.3, 0.55) };
    items.forEach((it) => {
      const a = show[it.kind];
      if (a <= 0) return;
      const dirs = it.p.map((v) => (Math.abs(v) < 1e-6 ? 0 : -Math.sign(v)));
      g.save(); g.globalAlpha *= a;
      if (it.kind === 'center') Art.ball(g, it.q.x, it.q.y, it.r * it.q.k, it.c); else slice(g, P, it.p, it.r, dirs, it.c);
      g.restore();
    });
    sumLines.forEach(([text, col, at], i) => {
      const a = seg(p, at, at + 0.18);
      Art.text(g, text, 648, 110 + i * 56, { font: 'display', size: 33, color: col, alpha: a });
    });
    const q = seg(p, 0.72, 0.9);
    Art.popIn(g, 648, 110 + sumLines.length * 56 + 34, q, (gg) => {
      gg.fillStyle = C.pink; Art.round(gg, -128, -36, 256, 72, 22); gg.fill();
      Art.text(gg, totalTxt, 0, 2, { font: 'display', size: 34, color: '#fff' });
    });
    (extra || []).forEach((line, i) => Art.text(g, line, 648, 110 + sumLines.length * 56 + 104 + i * 34, { size: 24, alpha: seg(p, 0.82, 1) }));
  }
  Lab.story('#story-count', {
    title: 'Counting atoms in a shared box',
    scenes: [
      {
        say: 'A crystal is one small box, stacked in every direction. That box is the <b>unit cell</b>. Describe one, and you have described the whole crystal.',
        dur: 3,
        draw(g, p, t) {
          const P = camera(-0.6 + Math.sin(t * 0.3) * 0.06, 0.45, 54, 300, 214);
          const e = 1.5, atoms = [];
          for (let i = -1; i <= 2; i++) for (let j = -1; j <= 2; j++) for (let k = -1; k <= 2; k++) {
            atoms.push({ q: P((i - 0.5) * e, (j - 0.5) * e, (k - 0.5) * e), i, j, k });
          }
          atoms.sort((A, B) => A.q.d - B.q.d);
          const grow = ease.out(seg(p, 0, 0.5));
          atoms.forEach(({ q, i, j, k }) => {
            const ok = ((i + j + k + 3) / 9) <= grow + 0.05;
            if (!ok) return;
            const inCell = i >= 1 && i <= 2 && j >= 1 && j <= 2 && k >= 1 && k <= 2;
            Art.ball(g, q.x, q.y, (inCell ? 17 : 13) * q.k / 54, inCell ? COL.corner : '#8F86C4');
          });
          const a = seg(p, 0.5, 0.75);
          g.save(); g.globalAlpha *= a;
          wireCube(g, P, 0.75, 0.75, 0.75, e, { color: C.pink, w: 6, fill: 'rgba(255,79,163,.18)' });
          g.restore();
          Art.text(g, 'One unit cell', 640, 150, { font: 'display', size: 38, color: C.pink, alpha: a });
          Art.text(g, 'Stack it in', 640, 240, { size: 29, alpha: seg(p, 0.7, 0.95) });
          Art.text(g, 'every direction', 640, 276, { size: 29, alpha: seg(p, 0.7, 0.95) });
        },
      },
      {
        say: 'An atom at a <b>corner</b> sits where <b>8</b> boxes meet. Pull them apart and each gets a wedge. So only <b>one eighth</b> of a corner atom belongs to each box.',
        dur: 4,
        draw(g, p, t) {
          const offs = [];
          for (const i of [-1, 1]) for (const j of [-1, 1]) for (const k of [-1, 1]) offs.push([i, j, k]);
          sharedScene(g, p, t, offs, COL.corner, 1.15, 0.66, '1/8', 'Corner atom', '8 boxes share it');
        },
      },
      {
        say: 'An atom on an <b>edge</b> is shared by <b>4</b> boxes, so each gets <b>one quarter</b>.',
        dur: 3.2,
        draw(g, p, t) {
          sharedScene(g, p, t, [[-1, -1, 0], [-1, 1, 0], [1, -1, 0], [1, 1, 0]], COL.edge, 1.3, 0.72, '1/4', 'Edge atom', '4 boxes share it');
        },
      },
      {
        say: 'An atom on a <b>face</b> is shared by <b>2</b> boxes, so each gets <b>one half</b>. An atom fully <b>inside</b> belongs entirely to its box.',
        dur: 3.2,
        draw(g, p, t) {
          sharedScene(g, p, t, [[-1, 0, 0], [1, 0, 0]], COL.face, 1.7, 0.8, '1/2', 'Face atom', '2 boxes share it');
        },
      },
      {
        say: '<b>Simple cubic</b> has atoms only at the 8 corners. Eight eighths make exactly <b>1 atom</b> per cell. Each atom touches 6 neighbors.',
        dur: 3.6,
        draw(g, p, t) { cellScene(g, p, t, [], [['Simple cubic', C.ink, 0], ['8 corners × 1/8 = 1', COL.corner, 0.3]], '1 atom per cell', ['Touching neighbors: 6']); },
      },
      {
        say: '<b>Body-centered cubic</b> adds one whole atom in the middle. That makes <b>2 atoms</b> per cell. Each atom touches 8 neighbors.',
        dur: 3.8,
        draw(g, p, t) { cellScene(g, p, t, ['center'], [['Body-centered', C.ink, 0], ['8 corners × 1/8 = 1', COL.corner, 0.25], ['1 center × 1 = 1', COL.center, 0.45]], '2 atoms per cell', ['Touching neighbors: 8']); },
      },
      {
        say: '<b>Face-centered cubic</b> adds an atom on each of the 6 faces. Six halves make 3, plus the 1 from the corners. That is <b>4 atoms</b> per cell, the tightest packing, with 12 touching neighbors.',
        dur: 4,
        draw(g, p, t) { cellScene(g, p, t, ['face'], [['Face-centered', C.ink, 0], ['8 corners × 1/8 = 1', COL.corner, 0.25], ['6 faces × 1/2 = 3', COL.face, 0.45]], '4 atoms per cell', ['Touching neighbors: 12']); },
      },
    ],
  });

  /* ---------- Bench: 3D unit cell viewer ---------- */
  const CELLS = {
    sc: { name: 'simple cubic', Z: 1, cn: '6', ra: 0.5, ar: 'a = 2r', sum: '8 × 1/8 = 1', note: 'Simple cubic wastes the most space, so almost nothing uses it. Polonium is the classic example. Atoms touch along each edge.' },
    bcc: { name: 'body-centered cubic', Z: 2, cn: '8', ra: Math.sqrt(3) / 4, ar: '√3 a = 4r', sum: '8 × 1/8 + 1 = 2', note: 'Iron, sodium and tungsten use this cell. The center atom touches all 8 corners. The corners do not touch each other.' },
    fcc: { name: 'face-centered cubic', Z: 4, cn: '12', ra: Math.sqrt(2) / 4, ar: '√2 a = 4r', sum: '8 × 1/8 + 6 × 1/2 = 4', note: 'Copper, aluminum, silver and gold use this cell. It is a closest packing of spheres, the same way a grocer stacks oranges. Atoms touch along each face diagonal.' },
    nacl: { name: 'salt', Z: '4 Na⁺ and 4 Cl⁻', cn: '6', ra: null, ar: 'r₊ + r₋ = a/2', sum: '', note: 'In salt, $\\ce{Cl-}$ sits at corners and faces: $8 \\times \\tfrac18 + 6 \\times \\tfrac12 = 4$. $\\ce{Na+}$ sits on edges and in the center: $12 \\times \\tfrac14 + 1 = 4$. A 1 to 1 ratio, just as the formula says.' },
  };
  const cell = { kind: 'sc', view: 'open', gather: 0, target: 0, pieces: [] };
  const v = Chem3D.viewer('#v-cell', { height: 460, distance: 9.5, autorotate: true, label: 'A rotatable unit cell model.' });
  function pack(kind) {
    const c = CELLS[kind];
    if (kind === 'nacl') {
      // Real ionic radii: Na+ 102 pm, Cl- 181 pm, a = 564 pm.
      const f = (r) => (4 / 3) * Math.PI * (r / 564) ** 3;
      return 4 * f(102) + 4 * f(181);
    }
    return c.Z * (4 / 3) * Math.PI * c.ra ** 3;
  }
  function paintCell() {
    const c = CELLS[cell.kind];
    Lab.$('#cell-z').textContent = cell.kind === 'nacl' ? c.Z : `${c.sum}`;
    Lab.$('#cell-cn').textContent = c.cn;
    Lab.$('#cell-pack').textContent = `${Lab.fmt(pack(cell.kind) * 100, 1)}%`;
    Lab.$('#cell-ar').textContent = c.ar;
    Lab.$('#cell-note').innerHTML = Lab.texString(`<p>${c.note}</p>`);
    Lab.$('#cell-gather').hidden = cell.view !== 'cut';
    Lab.$('#cell-gather').textContent = cell.target ? 'Put the pieces back' : 'Gather the pieces';
  }
  /* Pieces are solid: a curved shell plus flat cut faces, so atoms look truly sliced. */
  function makePieces(kind) {
    const T = v.THREE, a = 2.4, h = a / 2;
    const CORN = kind === 'nacl' ? Art.elementColor('Cl') : kind === 'fcc' ? '#FFD23F' : kind === 'bcc' ? '#2FD6F2' : '#FF8A2B';
    const CENT = kind === 'nacl' ? Art.elementColor('Na') : '#FF4FA3';
    const FACE = kind === 'nacl' ? Art.elementColor('Cl') : '#FF4FA3';
    const EDGE = Art.elementColor('Na');
    const R = kind === 'sc' ? a * 0.5 : kind === 'bcc' ? a * Math.sqrt(3) / 4 : kind === 'fcc' ? a * Math.sqrt(2) / 4 : 0;
    const rBig = kind === 'nacl' ? (181 / 564) * a : R, rSmall = kind === 'nacl' ? (102 / 564) * a : R;
    const mat = (col) => {
      const m = v.atomMaterial(col); m.side = T.DoubleSide; return m;
    };
    const capMat = (col) => {
      const m = v.atomMaterial(Art.mix(col, '#ffffff', 0.28)); m.side = T.DoubleSide; return m;
    };
    const group = new T.Group();
    const pieces = [];
    const add = (mesh, home, atomId) => { mesh.position.set(home[0], home[1], home[2]); group.add(mesh); pieces.push({ mesh, home, atomId }); };
    const octant = (r, col) => {
      const g0 = new T.Group();
      g0.add(new T.Mesh(new T.SphereGeometry(r, 28, 20, Math.PI / 2, Math.PI / 2, 0, Math.PI / 2), mat(col)));
      const cap = (rx, ry) => { const m = new T.Mesh(new T.CircleGeometry(r, 20, 0, Math.PI / 2), capMat(col)); m.rotation.set(rx, ry, 0); g0.add(m); };
      cap(0, 0); cap(0, -Math.PI / 2); cap(Math.PI / 2, 0);
      return g0;
    };
    const half = (r, col) => {
      const g0 = new T.Group();
      g0.add(new T.Mesh(new T.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(col)));
      const c = new T.Mesh(new T.CircleGeometry(r, 36), capMat(col)); c.rotation.x = Math.PI / 2; g0.add(c);
      return g0;
    };
    const quarter = (r, col) => {
      // Occupies x >= 0, z >= 0, along the y axis.
      const g0 = new T.Group();
      g0.add(new T.Mesh(new T.SphereGeometry(r, 24, 20, Math.PI / 2, Math.PI / 2, 0, Math.PI), mat(col)));
      const c1 = new T.Mesh(new T.CircleGeometry(r, 24, -Math.PI / 2, Math.PI), capMat(col)); g0.add(c1);
      const c2 = new T.Mesh(new T.CircleGeometry(r, 24, -Math.PI / 2, Math.PI), capMat(col)); c2.rotation.y = -Math.PI / 2; g0.add(c2);
      return g0;
    };
    let atomId = 0;
    const atoms = [];
    const newAtom = (r, label) => { atoms.push({ r, label }); return atomId++; };
    const corners = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) corners.push([x, y, z]);
    const cId = newAtom(rBig, '8 × 1/8');
    let faceLabel = '6 × 1/2', edgeLabel = '12 × 1/4';
    corners.forEach(([x, y, z]) => {
      const m = octant(rBig, CORN); m.scale.set(-x, -y, -z);
      add(m, [x * h, y * h, z * h], cId);
    });
    if (kind === 'fcc' || kind === 'nacl') {
      [[0, 1, 0], [1, 0, 0], [0, 0, 1]].forEach((axis) => {
        const id = newAtom(rBig, faceLabel); faceLabel = '';
        [-1, 1].forEach((s) => {
          const n = axis.map((q) => q * s);
          const m = half(rBig, FACE);
          m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-n[0], -n[1], -n[2]));
          add(m, [n[0] * h, n[1] * h, n[2] * h], id);
        });
      });
    }
    if (kind === 'nacl') {
      // 12 edge quarters: the four parallel to one axis make one whole atom.
      const eulers = { y: [0, 0, 0], x: [0, 0, Math.PI / 2], z: [Math.PI / 2, 0, 0] };
      ['x', 'y', 'z'].forEach((axis) => {
        const id = newAtom(rSmall, edgeLabel); edgeLabel = '';
        for (const s of [-1, 1]) for (const u of [-1, 1]) {
          const home = axis === 'x' ? [0, s * h, u * h] : axis === 'y' ? [s * h, 0, u * h] : [s * h, u * h, 0];
          // Build the quarter along y and point its opening inward.
          const inner = quarter(rSmall, EDGE);
          const holder = new T.Group();
          holder.add(inner);
          const e0 = eulers[axis];
          holder.rotation.set(e0[0], e0[1], e0[2]);
          // Mirror so it fills the inward quadrant.
          if (axis === 'y') inner.scale.set(-s, 1, -u);
          if (axis === 'x') inner.scale.set(s > 0 ? 1 : -1, 1, -u);
          if (axis === 'z') inner.scale.set(-s, 1, u > 0 ? 1 : -1);
          add(holder, home, id);
        }
      });
    }
    if (kind === 'bcc' || kind === 'nacl') {
      const id = newAtom(rSmall, '1 × 1');
      const m = new T.Mesh(new T.SphereGeometry(rSmall, 36, 28), mat(CENT));
      add(m, [0, 0, 0], id);
    }
    const box = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(a, a, a)), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    group.add(box);
    // Where whole atoms assemble: a row below the cell.
    const gap = 0.2, width = atoms.reduce((s, A) => s + A.r * 2, 0) + gap * (atoms.length - 1);
    let x = -width / 2;
    atoms.forEach((A) => { A.pos = [x + A.r, -h - 1.6, 0]; x += A.r * 2 + gap; });
    pieces.forEach((pc) => { pc.tgt = atoms[pc.atomId].pos; });
    return { group, pieces, atoms };
  }
  function buildCell() {
    cell.target = 0; cell.gather = 0;
    if (!v.ok) return;
    v.camera.position.y = 0;
    v.setAuto(true);
    if (cell.view === 'cut') {
      v.clear();
      const b = makePieces(cell.kind);
      cell.pieces = b.pieces; cell.atoms = b.atoms;
      v.add(b.group);
      v.setDistance(7.6);
      const h = 1.2;
      const lab = [{ p: [h, h, h], text: '1/8' }];
      if (cell.kind === 'fcc' || cell.kind === 'nacl') lab.push({ p: [0, 0, h], text: '1/2' });
      if (cell.kind === 'nacl') lab.push({ p: [h, h, 0], text: '1/4' });
      if (cell.kind === 'bcc' || cell.kind === 'nacl') lab.push({ p: [0, 0, 0], text: '1' });
      cell.partLabels = lab;
      v.labels(lab);
      let was = 0;
      v.animate((dt) => {
        cell.gather = lerp(cell.gather, cell.target, clamp(dt * 2.4));
        if (Math.abs(cell.gather - cell.target) < 0.002) cell.gather = cell.target;
        const q = ease.inOut(clamp(cell.gather));
        // Pull back and look down at the row as the atoms assemble below the cell.
        v.camera.position.y = -1.5 * q;
        v.setDistance(lerp(7.6, cell.kind === 'nacl' ? 15 : 12.5, q));
        if (cell.target) { v.root.rotation.y = lerp(v.root.rotation.y, -0.32, clamp(dt * 3)); v.root.rotation.x = lerp(v.root.rotation.x, 0.22, clamp(dt * 3)); }
        cell.pieces.forEach((pc) => pc.mesh.position.set(lerp(pc.home[0], pc.tgt[0], q), lerp(pc.home[1], pc.tgt[1], q), lerp(pc.home[2], pc.tgt[2], q)));
        const state = cell.gather > 0.97 ? 1 : cell.gather < 0.03 ? 0 : -1;
        if (state >= 0 && state !== was) {
          was = state;
          v.labels(state ? cell.atoms.filter((A) => A.label).map((A) => ({ p: [A.pos[0], A.pos[1] - A.r - 0.42, 0], text: A.label })) : cell.partLabels);
        }
      });
      return;
    }
    if (cell.kind === 'nacl' && cell.view === 'fill') {
      v.lattice('nacl');
      v.setDistance(8.6);
      // Replace the small balls with real ionic sizes.
      const a = 2.4, g0 = v.root.children[v.root.children.length - 1];
      g0.children.forEach((m) => { if (m.isMesh) { const big = Math.abs(m.geometry.parameters.radius - 0.44) < 0.001; const s = (big ? (181 / 564) * a / 0.44 : (102 / 564) * a / 0.27); m.scale.setScalar(s); } });
      v.labels([]);
      return;
    }
    v.lattice(cell.kind, { fill: cell.view === 'fill' });
    v.setDistance(cell.view === 'fill' ? 9.6 : 7.4);
    const h = 1.2, lab = [];
    if (cell.view === 'open') {
      lab.push({ p: [h, h, h], text: 'corner' });
      if (cell.kind === 'fcc' || cell.kind === 'nacl') lab.push({ p: [0, 0, h], text: 'face' });
      if (cell.kind === 'nacl') lab.push({ p: [h, h, 0], text: 'edge' });
      if (cell.kind === 'bcc' || cell.kind === 'nacl') lab.push({ p: [0, 0, 0], text: 'center' });
    }
    v.labels(lab);
  }
  Lab.segmented('#cell-kind', (val) => { cell.kind = val; buildCell(); paintCell(); });
  Lab.segmented('#cell-view', (val) => { cell.view = val; buildCell(); paintCell(); });
  Lab.$('#cell-gather').addEventListener('click', () => { cell.target = cell.target ? 0 : 1; v.setAuto(!cell.target); paintCell(); });
  buildCell(); paintCell();

  /* ---------- Bench: density from a unit cell ---------- */
  const METAL = {
    Na: { name: 'sodium', a: 429.1, Z: 2, real: 0.97 },
    Al: { name: 'aluminum', a: 405.0, Z: 4, real: 2.70 },
    Fe: { name: 'iron', a: 286.6, Z: 2, real: 7.87 },
    Cu: { name: 'copper', a: 361.5, Z: 4, real: 8.96 },
    Po: { name: 'polonium', a: 335.9, Z: 1, real: 9.2 },
    Ag: { name: 'silver', a: 408.6, Z: 4, real: 10.49 },
    Au: { name: 'gold', a: 407.8, Z: 4, real: 19.3 },
    W: { name: 'tungsten', a: 316.5, Z: 2, real: 19.3 },
  };
  const dn = { el: 'Cu', Z: 4, stretch: 100, t0: 0, a: 361.5 };
  const sci = (x, d = 2) => {
    const e = Math.floor(Math.log10(Math.abs(x)));
    return `${(x / Math.pow(10, e)).toFixed(d)} × 10${Lab.sup(e)}`;
  };
  function densVals() {
    const m = METAL[dn.el], a = m.a * (dn.stretch / 100), M = EL[dn.el].mass;
    const massCell = (dn.Z * M) / NA, aCm = a * 1e-10, vol = aCm ** 3;
    return { m, a, M, massCell, aCm, vol, d: massCell / vol };
  }
  const densStage = Lab.stage('#c-dens', {
    label: 'Three panels: the mass of one unit cell, its volume, and the density they give, compared with the measured density.',
    draw(g, t) {
      const V = densVals(), el = t - dn.t0;
      const col = Art.elementColor(dn.el);
      const reveal = (i) => clamp((el - i * 0.45) * 2.4);
      const heads = [[136, 'Mass of one cell'], [400, 'Volume of one cell'], [664, 'Density']];
      heads.forEach(([x, h]) => Art.text(g, h, x, 36, { font: 'display', size: 26 }));
      g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2;
      [268, 532].forEach((x) => { g.beginPath(); g.moveTo(x, 16); g.lineTo(x, 434); g.stroke(); });
      // Panel 1: atoms on a tiny scale.
      const q1 = ease.out(reveal(0));
      const sc = Art.digitalScale(g, 136, 268, 200, `${dn.Z} atoms`, { size: 21 });
      const n = dn.Z, rr = n === 4 ? 30 : n === 2 ? 36 : 44;
      for (let i = 0; i < n; i++) {
        const cols = n === 4 ? 2 : n, cx = 136 + (i % cols - (cols - 1) / 2) * (rr * 2 + 2);
        const row = n === 4 ? Math.floor(i / 2) : 0;
        Art.atom(g, cx, lerp(60, sc.top - rr - row * (rr * 1.75), q1), rr, dn.el, { face: i === 0 ? 'happy' : null, t, seed: i, label: i === 0 ? false : dn.el });
      }
      Art.text(g, `${dn.Z} × ${V.M.toFixed(2)} ÷ 6.022 × 10²³`, 136, 306, { size: 21, color: C.dim, maxW: 250 });
      Art.text(g, `${sci(V.massCell)} g`, 136, 356, { font: 'display', size: 29, color: C.sun, alpha: q1 });
      // Panel 2: the cube with its edge labelled. The picture grows and shrinks with the slider.
      const q2 = ease.out(reveal(1));
      const e = 1.55 * (dn.stretch / 100);
      const P = camera(-0.6, 0.4, 62, 400, 158);
      wireCube(g, P, -e / 2, -e / 2, -e / 2, e, { fill: Art.alpha(col, 0.22), color: col, w: 4 });
      const A = P(-e / 2, -e / 2, e / 2), B = P(e / 2, -e / 2, e / 2);
      Art.arrow(g, A.x, A.y + 22, B.x, B.y + 22, { color: C.ink, w: 4, head: 11, both: true });
      Art.text(g, 'a', (A.x + B.x) / 2 - 8, (A.y + B.y) / 2 + 46, { font: 'display', size: 28, color: C.ink, halo: true });
      Art.text(g, `a = ${Lab.fmt(V.a, 1)} pm`, 400, 306, { size: 23, color: C.dim });
      Art.text(g, `${sci(V.vol)} cm³`, 400, 356, { font: 'display', size: 29, color: C.cyan, alpha: q2 });
      // Panel 3: the result.
      const q3 = ease.out(reveal(2));
      Art.text(g, `${Lab.fmt(V.d, 2)}`, 664, 136, { font: 'display', size: 76, color: C.pink, alpha: q3 });
      Art.text(g, 'g/cm³', 664, 196, { size: 28, alpha: q3 });
      Art.text(g, `Measured: ${V.m.real}`, 664, 256, { size: 25, color: C.dim, alpha: q3 });
      const off = Math.abs(V.d - V.m.real) / V.m.real, match = off < 0.03;
      Art.pill(g, match ? 'It matches!' : 'Does not match', 664, 312, { size: 28, font: 'display', color: match ? C.leaf : C.red, text: '#1A0F2E', alpha: q3 });
      if (match) Art.moe(g, 664, 438, 90, 'cheer', { t });
      else Art.text(g, `off by ${Math.round(off * 100)}%`, 664, 366, { size: 25, color: C.red, alpha: q3 });
      // Bottom strip.
      Art.text(g, `${V.m.name[0].toUpperCase() + V.m.name.slice(1)}, testing ${dn.Z === 1 ? 'simple cubic' : dn.Z === 2 ? 'body-centered' : 'face-centered'}`, 268, 410, { size: 25, color: C.ink, maxW: 480 });
    },
  });
  function paintDens() {
    const V = densVals();
    const tex = (x) => { const e = Math.floor(Math.log10(Math.abs(x))); return `${(x / Math.pow(10, e)).toFixed(3)} \\times 10^{${e}}`; };
    Lab.$('#dens-calc').innerHTML = Lab.texString(`<div class="calc-line">$$d = \\dfrac{Z\\,M}{N_A\\,a^3} = \\dfrac{(${dn.Z})(${V.M.toFixed(2)}\\text{ g/mol})}{(6.022 \\times 10^{23}\\text{ /mol})(${tex(V.aCm)}\\text{ cm})^3} = ${Lab.fmt(V.d, 2)}\\text{ g/cm}^3$$</div>`);
  }
  const zSeg = Lab.segmented('#dens-type', (val) => { dn.Z = +val; dn.t0 = densStage.t; paintDens(); });
  Lab.segmented('#dens-metal', (val) => { dn.el = val; dn.t0 = densStage.t; paintDens(); });
  Lab.bind('#dens-a', '#dens-a-out', (val) => (val === 100 ? 'Real edge' : `${val}% of real`), (val) => { dn.stretch = val; paintDens(); });
  void zSeg;

  /* ---------- Bench: diamond and graphite ---------- */
  const carbon = { form: 'diamond', slide: false, shift: 0 };
  const c3 = Chem3D.viewer('#v-carbon', { height: 440, distance: 12, autorotate: true, label: 'A rotatable model of diamond or graphite.' });
  const CCOL = '#7D8AA0';
  function buildDiamond() {
    const a = 3.5, pts = [];
    const base = [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5], [0.25, 0.25, 0.25], [0.75, 0.75, 0.25], [0.75, 0.25, 0.75], [0.25, 0.75, 0.75]];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      base.forEach(([x, y, z]) => {
        const X = x + i, Y = y + j, Z = z + k;
        if (X >= -0.01 && X <= 1.26 && Y >= -0.01 && Y <= 1.01 && Z >= -0.01 && Z <= 1.01) pts.push([(X - 0.6) * a, (Y - 0.5) * a, (Z - 0.5) * a]);
      });
    }
    const bonds = [];
    const L = (Math.sqrt(3) / 4) * a;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
      if (Math.abs(d - L) < 0.02) bonds.push([i, j, 1]);
    }
    c3.molecule({ atoms: pts.map((p) => ({ el: 'C', p, r: 0.34, color: CCOL })), bonds });
    c3.setDistance(9.6);
    c3.labels([]);
  }
  function buildGraphite() {
    const T = c3.THREE;
    c3.clear();
    const bond = 1.42, gapY = 2.0, root = new T.Group();
    const layers = [];
    const layerAt = (y, shift) => {
      const G = new T.Group(), pts = [];
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
        const x = (i + j * 0.5) * bond * Math.sqrt(3), z = j * bond * 1.5;
        [[x, z], [x, z + bond]].forEach(([px, pz]) => {
          const X = px + shift, Z = pz - bond / 2;
          if (Math.hypot(X, Z) < 3.75) pts.push([X, Z]);
        });
      }
      const geo = new T.SphereGeometry(0.3, 24, 18), mat = c3.atomMaterial(CCOL);
      pts.forEach(([x, z]) => { const m = new T.Mesh(geo, mat); m.position.set(x, 0, z); G.add(m); });
      const stickMat = c3.atomMaterial('#D9D1EC');
      const up = new T.Vector3(0, 1, 0);
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j][0] - pts[i][0], dz = pts[j][1] - pts[i][1], d = Math.hypot(dx, dz);
        if (Math.abs(d - bond) < 0.03) {
          const c = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, d, 10), stickMat);
          c.position.set(pts[i][0] + dx / 2, 0, pts[i][1] + dz / 2);
          c.quaternion.setFromUnitVectors(up, new T.Vector3(dx / d, 0, dz / d));
          G.add(c);
        }
      }
      G.position.y = y;
      root.add(G); layers.push(G);
      return G;
    };
    layerAt(gapY, 0); layerAt(0, bond * Math.sqrt(3) / 2); layerAt(-gapY, 0);
    c3.add(root);
    c3.setDistance(11.4);
    c3.rotateTo(0.38, -0.5);
    c3.labels([{ p: [4.2, gapY / 2, 0], text: 'weak forces' }, { p: [0, gapY + 0.8, 0], text: 'strong sheet' }]);
    carbon.layers = layers;
    c3.animate((dt) => {
      carbon.shift = lerp(carbon.shift, carbon.slide ? 1 : 0, clamp(dt * 1.8));
      layers[0].position.x = carbon.shift * Math.sin(performance.now() / 900) * 1.4;
      layers[2].position.x = -carbon.shift * Math.sin(performance.now() / 900) * 1.4;
    });
  }
  const FORM = {
    diamond: { b: '4', h: 'The hardest natural solid', c: 'No', note: 'Every carbon uses all four of its valence electrons in strong bonds, pointing to the corners of a tetrahedron. No direction is weak, and no electron is free.' },
    graphite: { b: '3, in flat sheets', h: 'Soft and slippery', c: 'Yes, along the sheets', note: 'Each carbon bonds to 3 others in a flat sheet, and its fourth electron can move along the sheet. Weak London forces hold the sheets, so they slide. That is the mark a pencil leaves. Graphite and diamond are called <b>allotropes</b>: different forms of the same element.' },
  };
  function paintCarbon() {
    const f = FORM[carbon.form];
    Lab.$('#carbon-b').textContent = f.b; Lab.$('#carbon-h').textContent = f.h; Lab.$('#carbon-c').textContent = f.c;
    Lab.$('#carbon-note').innerHTML = `<p>${f.note}</p>`;
    const btn = Lab.$('#carbon-slide');
    btn.hidden = carbon.form !== 'graphite';
    btn.textContent = carbon.slide ? 'Stop sliding' : 'Slide the sheets';
  }
  Lab.segmented('#carbon-form', (val) => {
    carbon.form = val; carbon.slide = false; carbon.shift = 0;
    if (c3.ok) { if (val === 'diamond') { buildDiamond(); c3.rotateTo(0.3, -0.5); } else buildGraphite(); }
    paintCarbon();
  });
  Lab.$('#carbon-slide').addEventListener('click', () => { carbon.slide = !carbon.slide; paintCarbon(); });
  if (c3.ok) buildDiamond();
  paintCarbon();
});
