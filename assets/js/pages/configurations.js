/* Lesson 7.4: Electron configurations. All configurations come from the Aufbau engine in the question bank. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const L = Bank.all.configurations.lib;
  const { sup, atomMap, idealMap, ionMap, shorthandText, unpaired, namesFilling, namesByShell, capOf, EXC, ORDER, totalE, writeList, leavingOrder } = L;
  const ELS = window.ELEMENTS;
  const BLOCK = { s: C.pink, p: C.cyan, d: C.sun, f: C.violet };
  const blockOf = (s) => BLOCK[s[1]];

  /* ---------- Shared art ---------- */
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const unsup = (x) => x.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => SUP.indexOf(c)).replace(/⁺/g, '+').replace(/⁻/g, '−');
  /** Configuration text with evenly styled superscripts. Same options as Art.text, and it returns the width. */
  function cfgText(g, str, x, y, o = {}) {
    const size = o.size || 30;
    const fam = o.font === 'body' ? Art.FONT_BODY : Art.FONT_DISPLAY, wt = o.font === 'body' ? 700 : 400;
    const parts = String(str).split(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)/).filter(Boolean).map((tk) => (/^[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/.test(tk) ? { t: unsup(tk), up: true } : { t: tk }));
    const fB = `${wt} ${size}px ${fam}`, fS = `${wt} ${size * 0.62}px ${fam}`;
    let w = 0;
    parts.forEach((pt) => { g.font = pt.up ? fS : fB; pt.w = g.measureText(pt.t).width; w += pt.w; });
    if (o.measure) return w;
    const al = o.align || 'center';
    let cx = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
    const prev = g.globalAlpha;
    g.globalAlpha = prev * (o.alpha === undefined ? 1 : o.alpha);
    g.textAlign = 'left'; g.textBaseline = 'middle';
    parts.forEach((pt) => {
      g.font = pt.up ? fS : fB;
      const yy = pt.up ? y - size * 0.3 : y;
      if (o.halo) { g.lineJoin = 'round'; g.lineWidth = Math.max(3, size * 0.18); g.strokeStyle = 'rgba(23,12,41,.9)'; g.strokeText(pt.t, cx, yy); }
      g.fillStyle = o.color || C.ink; g.fillText(pt.t, cx, yy);
      cx += pt.w;
    });
    g.globalAlpha = prev;
    return w;
  }
  const supHTML = (str) => String(str).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, (m) => `<sup>${unsup(m)}</sup>`);
  function spinArrow(g, x, y, up, hgt, o = {}) {
    const col = o.color || C.electron;
    const t = up ? y - hgt / 2 : y + hgt / 2, b = up ? y + hgt / 2 : y - hgt / 2, d = up ? 1 : -1, hd = hgt * 0.3;
    g.save();
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    g.strokeStyle = Art.alpha(col, 0.3); g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, b); g.lineTo(x, t); g.stroke();
    g.strokeStyle = col; g.lineWidth = 3.4; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x, b); g.lineTo(x, t); g.moveTo(x - hd * 0.72, t + d * hd); g.lineTo(x, t); g.lineTo(x + hd * 0.72, t + d * hd); g.stroke();
    g.restore();
  }
  /** One row of orbital boxes. e electrons follow Hund: first one up in each box, then one down in each. */
  function boxRow(g, x, y, bw, bh, name, e, o = {}) {
    const n = capOf(name) / 2, col = blockOf(name);
    for (let i = 0; i < n; i++) {
      const bx = x + i * bw;
      g.fillStyle = o.hi ? Art.alpha(col, 0.28) : 'rgba(255,255,255,.07)';
      g.strokeStyle = o.hi ? col : Art.alpha(col, 0.75); g.lineWidth = o.hi ? 3.5 : 2.5;
      Art.round(g, bx + 1.5, y - bh / 2, bw - 3, bh, 6); g.fill(); g.stroke();
    }
    for (let k = 0; k < e; k++) {
      const box = k < n ? k : k - n, up = k < n;
      const isNew = o.fresh && k >= o.fresh.from;
      const q = isNew ? o.fresh.q : 1;
      const dy = isNew ? -(1 - q) * 46 : 0;
      spinArrow(g, x + box * bw + bw * (up ? 0.34 : 0.66), y + dy, up, bh * 0.68, { alpha: q, color: isNew && q > 0.1 ? C.sun : undefined });
    }
    if (o.label !== false) Art.text(g, name, x - 10, y, { size: o.labelSize || 24, font: 'display', color: col, align: 'right' });
  }
  /** Rows in a simple left-aligned ladder, with the lowest energy at the bottom. Returns y for each name. */
  function ladder(g, names, map, x, yBot, step, bw, bh, o = {}) {
    const ys = {};
    names.forEach((s, i) => {
      const y = yBot - i * step;
      ys[s] = y;
      const a = o.alpha ? o.alpha(i) : 1;
      if (a <= 0) return;
      g.save(); g.globalAlpha *= a;
      boxRow(g, x, y, bw, bh, s, map[s] || 0, { hi: o.hi === s });
      g.restore();
    });
    return ys;
  }

  /* ---------- Story 1: the electron hotel ---------- */
  Lab.story('#story-hotel', {
    title: 'Checking in',
    scenes: [
      {
        say: 'Picture a hotel where the bottom floors are the cheapest. Each floor is a <b>subshell</b>, and each room is an <b>orbital</b>, drawn as a box. Lower means lower energy, and electrons always want the cheapest room.',
        dur: 4,
        draw(g, p, t) {
          const names = ['1s', '2s', '2p', '3s', '3p'];
          // The hotel.
          const hb = g.createLinearGradient(100, 0, 480, 0);
          hb.addColorStop(0, '#5B4490'); hb.addColorStop(1, '#3B2763');
          g.fillStyle = hb; g.strokeStyle = '#1A0F2E'; g.lineWidth = 4;
          Art.round(g, 70, 44, 420, 372, 12); g.fill(); g.stroke();
          g.fillStyle = '#7F5A3B'; g.fillRect(50, 416, 460, 12);
          ladder(g, names, {}, 170, 382, 72, 80, 50, { alpha: (i) => seg(p, 0.05 + i * 0.12, 0.17 + i * 0.12) });
          Art.arrow(g, 532, 400, 532, 60, { color: C.sun, w: 6, p: seg(p, 0.6, 0.85) });
          Art.text(g, 'more', 590, 74, { size: 26, color: C.sun, alpha: seg(p, 0.72, 0.9) });
          Art.text(g, 'energy', 590, 104, { size: 26, color: C.sun, alpha: seg(p, 0.72, 0.9) });
          Art.text(g, 'cheapest', 610, 382, { size: 26, color: C.leaf, alpha: seg(p, 0.1, 0.3) });
          [0, 1, 2].forEach((i) => {
            const a = ease.back(seg(p, 0.7 + i * 0.08, 0.84 + i * 0.08));
            if (a > 0) Art.atom(g, 680 + i * 44, 180 + Math.sin(t * 2 + i) * 4, 19 * a, 'e', { label: false, face: 'happy', t, color: C.electron, look: [-1, 0.3], seed: i });
          });
          Art.text(g, 'guests', 724, 226, { size: 24, color: C.cyan, alpha: seg(p, 0.8, 0.95) });
        },
      },
      {
        say: 'Rule 1 is the <b>Aufbau principle</b>: fill the lowest energy first. Carbon has 6 electrons. Two go in 1s, two go in 2s, and two go in 2p. Written down, that is $\\mathrm{1s^{2}\\,2s^{2}\\,2p^{2}}$.',
        dur: 5,
        draw(g, p, t) {
          const steps = [['1s', 1], ['1s', 2], ['2s', 1], ['2s', 2], ['2p', 1], ['2p', 2]];
          const shown = Math.floor(seg(p, 0.05, 0.86) * 6.999);
          const map = {};
          steps.slice(0, shown).forEach(([s, k]) => { map[s] = k; });
          const ys = ladder(g, ['1s', '2s', '2p'], map, 110, 372, 120, 96, 66, { hi: steps[Math.min(5, shown)][0] });
          void ys;
          const line = ['1s', '2s', '2p'].filter((s) => map[s]).map((s) => s + sup(map[s])).join(' ');
          cfgText(g, line, 400, 54, { size: 46, color: C.sun, halo: true });
          Art.atom(g, 610, 230, 72, 'C', { face: shown === 6 ? 'grin' : 'happy', t, look: [-1, 0.2] });
          Art.text(g, `${shown} of 6 electrons`, 610, 340, { size: 28 });
        },
      },
      {
        say: 'Rule 2 is the <b>Pauli exclusion principle</b>: each box holds <b>at most two</b> electrons, and they must have <b>opposite spins</b>. That is because no two electrons in an atom may share all four quantum numbers.',
        dur: 4.2,
        draw(g, p) {
          const box = (cx, arrows, ok, label, a) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            g.fillStyle = 'rgba(255,255,255,.08)'; g.strokeStyle = ok ? C.leaf : C.red; g.lineWidth = 5;
            Art.round(g, cx - 92, 110, 184, 168, 16); g.fill(); g.stroke();
            arrows.forEach(([dx, up]) => spinArrow(g, cx + dx, 194, up, 112, { color: ok ? C.electron : '#FFB3BA' }));
            g.restore();
            Art.text(g, ok ? '✓' : '✗', cx, 62, { size: 58, color: ok ? C.leaf : C.red, alpha: a });
            Art.text(g, label, cx, 322, { size: 28, alpha: a, color: ok ? C.leaf : '#FFB3BA' });
          };
          box(140, [[-34, true], [34, false]], true, 'Opposite spins', seg(p, 0.06, 0.26));
          box(400, [[-34, true], [34, true]], false, 'Same spin', seg(p, 0.34, 0.54));
          box(660, [[-54, true], [0, false], [54, true]], false, 'Three in a box', seg(p, 0.62, 0.82));
          Art.text(g, 'Every box: two electrons at most', 400, 392, { size: 32, font: 'display', color: C.sun, alpha: seg(p, 0.82, 0.98) });
        },
      },
      {
        say: "Rule 3 is <b>Hund's rule</b>. Think of strangers on a bus: each person takes an empty seat before anyone shares. Electrons repel each other, so in a subshell they spread out, all spinning the same way, before they pair up.",
        dur: 4.6,
        draw(g, p, t) {
          const bus = (y, seats, ok, a) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            const body = g.createLinearGradient(0, y - 62, 0, y + 62);
            body.addColorStop(0, ok ? '#FFD23F' : '#B9A25A'); body.addColorStop(1, ok ? '#E6A400' : '#857238');
            g.fillStyle = body; g.strokeStyle = '#1A0F2E'; g.lineWidth = 4;
            Art.round(g, 120, y - 62, 420, 124, 22); g.fill(); g.stroke();
            g.fillStyle = '#1A0F2E';
            [190, 470].forEach((x) => { g.beginPath(); g.arc(x, y + 62, 19, 0, TAU); g.fill(); });
            g.fillStyle = '#9A94B3';
            [190, 470].forEach((x) => { g.beginPath(); g.arc(x, y + 62, 8, 0, TAU); g.fill(); });
            seats.forEach((n, i) => {
              const x = 150 + i * 122;
              g.fillStyle = '#24163F'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
              Art.round(g, x, y - 44, 112, 72, 10); g.fill(); g.stroke();
              if (n >= 1) spinArrow(g, x + 38, y - 8, true, 50);
              if (n >= 2) spinArrow(g, x + 74, y - 8, false, 50);
            });
            g.restore();
          };
          bus(114, [2, 1, 0], false, seg(p, 0.08, 0.28));
          bus(306, [1, 1, 1], true, seg(p, 0.46, 0.66));
          const a1 = seg(p, 0.18, 0.38), a2 = seg(p, 0.56, 0.76);
          Art.atom(g, 655, 100, 40, 'N', { face: 'grumpy', t, alpha: a1, label: false });
          Art.text(g, '✗ Sharing too soon', 655, 170, { size: 25, color: C.red, alpha: a1 });
          Art.atom(g, 655, 290, 40, 'N', { face: 'grin', t, alpha: a2, label: false });
          Art.text(g, '✓ One each', 655, 360, { size: 25, color: C.leaf, alpha: a2 });
          Art.text(g, 'Three electrons in 2p: nitrogen', 330, 418, { size: 25, color: C.cyan, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: 'Here is the filling order. Write the subshells in rows, then read along the <b>diagonals</b>. It gives 1s, 2s, 2p, 3s, 3p, then the surprise: <b>4s comes before 3d</b>.',
        dur: 6,
        draw(g, p) {
          const cell = (row, col) => [74 + col * 84, 54 + row * 62];
          const rows = [1, 2, 3, 4, 5, 6, 7];
          const LET = ['s', 'p', 'd', 'f'];
          const used = new Set(ORDER);
          // Diagonals: subshells with the same n + l. Drawn first, so they pass behind the cells.
          const groups = {};
          ORDER.forEach((sub) => { const k = L.nOf(sub) + L.lOf(sub); (groups[k] = groups[k] || []).push(sub); });
          const keys = Object.keys(groups).map(Number).sort((a, b) => a - b);
          keys.forEach((k, i) => {
            const list = groups[k];
            if (list.length < 2) return;
            const a = list[0], b = list[list.length - 1];
            const [x1, y1] = cell(L.nOf(a) - 1, L.lOf(a)), [x2, y2] = cell(L.nOf(b) - 1, L.lOf(b));
            const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
            const u = seg(p, 0.1 + (i / keys.length) * 0.75, 0.18 + (i / keys.length) * 0.75);
            Art.arrow(g, x1 - (dx / len) * 26, y1 - (dy / len) * 26, x2 + (dx / len) * 34, y2 + (dy / len) * 34, { color: 'rgba(255,255,255,.75)', w: 4, head: 10, p: u });
          });
          rows.forEach((n, r) => LET.forEach((ch, c) => {
            const name = n + ch;
            if (!used.has(name)) return;
            const [x, y] = cell(r, c);
            const on = ORDER.indexOf(name) <= Math.floor(seg(p, 0.1, 0.9) * ORDER.length) - 1;
            g.fillStyle = on ? Art.alpha(blockOf(name), 0.3) : 'rgba(26,15,46,.6)';
            g.strokeStyle = blockOf(name); g.lineWidth = 2.5;
            Art.round(g, x - 30, y - 22, 60, 44, 10); g.fill(); g.stroke();
            Art.text(g, name, x, y, { size: 26, font: 'display', color: on ? '#fff' : Art.alpha(blockOf(name), 0.9) });
          }));
          // The order, written out.
          const shown = Math.floor(seg(p, 0.1, 0.9) * ORDER.length);
          const list = ORDER.slice(0, shown);
          list.forEach((s, i) => {
            const col = i % 5, row = Math.floor(i / 5);
            const hot = s === '4s' || s === '3d';
            const x = 462 + col * 66, y = 90 + row * 52;
            if (hot) { g.fillStyle = Art.alpha(C.red, 0.3); Art.round(g, x - 28, y - 20, 56, 40, 10); g.fill(); }
            Art.text(g, s, x, y, { size: 26, font: 'display', color: hot ? '#fff' : blockOf(s) });
          });
          Art.text(g, 'The order', 600, 42, { size: 30, font: 'display' });
          Art.text(g, '4s fills before 3d', 600, 332, { size: 30, font: 'display', color: C.red, alpha: seg(p, 0.32, 0.5), halo: true });
          Art.text(g, 'Same diagonal, same n + ℓ', 600, 378, { size: 24, color: C.dim, alpha: seg(p, 0.65, 0.85) });
        },
      },
      {
        say: 'How to read one: in $\\mathrm{2p^{4}}$, the <b>2</b> is the shell, the <b>p</b> is the subshell, and the <b>4</b> counts electrons. Add up all the superscripts and you get the total number of electrons in the atom.',
        dur: 4.2,
        draw(g, p, t) {
          const y = 150;
          Art.text(g, '2', 280, y, { size: 150, font: 'display', color: C.pink, alpha: seg(p, 0.05, 0.2) });
          Art.text(g, 'p', 390, y - 8, { size: 150, font: 'display', color: C.cyan, alpha: seg(p, 0.25, 0.4) });
          Art.text(g, '4', 490, y - 58, { size: 84, font: 'display', color: C.sun, alpha: seg(p, 0.45, 0.6) });
          const labs = [[150, 'shell: n = 2', C.pink, 0.1, 280, 234], [400, 'subshell: ℓ = 1', C.cyan, 0.3, 390, 234], [660, '4 electrons', C.sun, 0.5, 498, 134]];
          labs.forEach(([x, s, col, a0, tx, ty]) => {
            const a = seg(p, a0, a0 + 0.14);
            Art.text(g, s, x, 286, { size: 28, color: col, alpha: a });
            Art.arrow(g, x, 266, tx, ty, { color: col, w: 4, head: 11, p: a });
          });
          const b = seg(p, 0.7, 0.88);
          if (b > 0) {
            g.fillStyle = Art.alpha(C.plum2, b); Art.round(g, 60, 334, 680, 82, 22); g.fill();
            cfgText(g, '1s² 2s² 2p⁴', 200, 376, { size: 36, alpha: b, color: '#fff' });
            Art.text(g, '2 + 2 + 4 = 8 electrons: oxygen', 510, 376, { size: 27, color: C.sun, alpha: b });
          }
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: orbital box filler ---------- */
  const F = { z: 26, shown: 26 };
  const P8 = { '1s': [110, 490], '2s': [110, 432], '2p': [214, 400], '3s': [110, 342], '3p': [214, 310], '4s': [110, 252], '3d': [398, 222], '4p': [214, 164] };
  function viewFor(z) {
    if (z <= 36) return { core: null, rows: Object.keys(P8), pos: P8, bw: 46, bh: 38 };
    const list = z <= 54 ? ['Kr', ['5s', '4d', '5p']] : z <= 86 ? ['Xe', ['6s', '4f', '5d', '6p']] : ['Rn', ['7s', '5f', '6d', '7p']];
    const pos = {};
    list[1].forEach((s, i) => { pos[s] = [110, 410 - i * 84]; });
    return { core: list[0], rows: list[1], pos, bw: 58, bh: 52 };
  }
  const fillStage = Lab.stage('#c-fill', {
    h: 530,
    label: 'Orbital boxes arranged by energy, with an arrow for each electron. The chosen atom and its configuration are shown.',
    draw(g, t, dt) {
      if (dt) {
        const gap = F.z - F.shown;
        const speed = Math.max(4, Math.abs(gap) * 3);
        F.shown += clamp(gap, -speed * dt, speed * dt);
      } else F.shown = F.z;
      const k = clamp(Math.ceil(F.shown - 1e-6), 1, 118);
      const q = clamp(F.shown - (k - 1));
      const e = ELS[k - 1], cfg = atomMap(k), prev = k > 1 ? atomMap(k - 1) : {};
      const v = viewFor(k);
      const topStr = v.core ? shorthandText(cfg) : writeList(cfg, namesFilling(cfg)).join(' ');
      cfgText(g, topStr || '', 400, 36, { size: topStr.length > 30 ? 28 : 32, color: C.sun, halo: true });
      // Energy arrow.
      Art.arrow(g, 34, 510, 34, 112, { color: C.dim, w: 4, head: 11 });
      Art.text(g, 'Energy', 14, 88, { size: 22, color: C.dim, align: 'left' });
      if (v.core) {
        const hasE = L.NOBLE.find((n) => n[1] === v.core)[0];
        g.fillStyle = 'rgba(255,255,255,.08)'; g.strokeStyle = C.line; g.lineWidth = 2.5;
        Art.round(g, 70, 464, 430, 52, 14); g.fill(); g.stroke();
        Art.text(g, `[${v.core}] core: ${hasE} electrons`, 285, 490, { size: 26, color: C.ink });
      }
      v.rows.forEach((s) => {
        const [x, y] = v.pos[s];
        const was = prev[s] || 0, now = cfg[s] || 0;
        const fresh = q < 1 && now > was ? { from: was, q: ease.out(q) } : null;
        boxRow(g, x, y, v.bw, v.bh, s, now, { fresh, hi: now > was && q < 1, labelSize: v.core ? 28 : 24 });
      });
      // The atom.
      const col = Art.elementColor(e.sym);
      Art.atom(g, 690, 106, 46, e.sym, { face: 'happy', t, look: [-1, 0.3] });
      Art.text(g, e.name, 690, 176, { size: e.name.length > 10 ? 25 : 30, font: 'display', color: Art.lum(col) < 0.3 ? C.ink : Art.mix(col, '#ffffff', 0.25), halo: true });
      const u = unpaired(cfg);
      if (!v.core) cfgText(g, shorthandText(cfg) || '1s¹', 600, 298, { size: 30, color: C.pink, halo: true });
      Art.text(g, `${u} unpaired`, v.core ? 680 : 600, v.core ? 262 : 344, { size: 28, color: u ? C.cyan : C.leaf });
      if (EXC[e.sym] && q >= 1) {
        // The dashed arrow runs from the subshell that came up short to the one that gained.
        const id = idealMap(k);
        const src = v.rows.find((s) => (cfg[s] || 0) < (id[s] || 0));
        const dst = v.rows.find((s) => (cfg[s] || 0) > (id[s] || 0));
        if (src && dst) {
          const A = v.pos[src], B = v.pos[dst];
          const ax = A[0] + (capOf(src) / 2) * v.bw + 8;
          const near = B[0] > ax;
          const bx = near ? B[0] - 40 : B[0] + (capOf(dst) / 2) * v.bw + 8;
          Art.arrow(g, ax, A[1], bx, B[1], { color: C.pink, w: 4, head: 11, curve: near ? -10 : 26, dash: [7, 6] });
        }
        Art.pill(g, 'An exception', v.core ? 680 : 600, v.core ? 310 : 394, { size: 24, color: C.pink, text: '#fff', font: 'display' });
      }
    },
  });
  function paintFill() {
    const z = F.z, e = ELS[z - 1], m = atomMap(z), id = idealMap(z), u = unpaired(m);
    Lab.$('#fill-z').value = z; Lab.paintRange(Lab.$('#fill-z'));
    Lab.$('#fill-z-out').textContent = `${z}: ${e.name}`;
    Lab.$('#fill-short').innerHTML = supHTML(shorthandText(m) || '1s¹');
    Lab.$('#fill-un').textContent = u;
    Lab.$('#fill-mag').textContent = u ? 'Paramagnetic' : 'Diamagnetic';
    let msg;
    if (EXC[e.sym]) {
      const reason = e.sym === 'Cr' ? 'A half-filled 3d, with 6 unpaired electrons, has lower energy than the expected pattern.' : e.sym === 'Cu' ? 'A completely full 3d has lower energy than the expected pattern.' : 'The subshell energies here are so close that the true ground state differs. You only need to know Cr and Cu for most exams.';
      msg = `<b>${e.name} breaks the pattern.</b> The filling order predicts ${supHTML(shorthandText(id))}, but measurements give ${supHTML(shorthandText(m))}. ${reason}`;
    } else {
      const names = namesFilling(id);
      const last = names[names.length - 1];
      msg = `The last electron of ${e.name.toLowerCase()} goes into <b>${last}</b>, in the ${last[1]} block. It has ${z} electrons in all.`;
      if (last[1] === 'p' || last[1] === 'd') {
        const k = id[last], boxes = capOf(last) / 2;
        if (k <= boxes) msg += ` Those ${k} ${last} electron${k > 1 ? 's sit alone' : ' sits alone'}, following Hund's rule.`;
        else msg += ` With ${k} electrons in ${boxes} boxes, ${k - boxes} box${k - boxes > 1 ? 'es are' : ' is'} now paired.`;
      }
    }
    Lab.$('#fill-foot').innerHTML = `<p>${msg}</p>`;
  }
  const setFill = (z) => { F.z = clamp(z, 1, 118); if (Lab.reducedMotion || !fillStage.playing) F.shown = F.z; paintFill(); fillStage.redraw(); jumpSeg.set(String(F.z), false); };
  const jumpSeg = Lab.segmented('#fill-jump', (v) => setFill(+v));
  Lab.$('#fill-z').addEventListener('input', (e) => setFill(+e.target.value));
  Lab.$('#fill-prev').addEventListener('click', () => setFill(F.z - 1));
  Lab.$('#fill-next').addEventListener('click', () => setFill(F.z + 1));
  paintFill();

  /* ---------- Bench: check in the electrons (a game) ---------- */
  const POOL = ELS.slice(2, 36).filter((e) => !EXC[e.sym]).map((e) => e.z);
  const G = { z: 7, rows: [], boxes: {}, spin: 'up', log: [], mistakes: 0, msg: 'Tap the lowest box to start.', mood: 'point', won: false, shake: null, flash: 0 };
  let spinSeg;
  function newGame(z) {
    const pick = z || POOL[Math.floor(Math.random() * POOL.length)];
    G.z = pick;
    const names = namesFilling(idealMap(pick));
    const nextIdx = ORDER.indexOf(names[names.length - 1]) + 1;
    G.rows = names.concat([ORDER[nextIdx]]);
    G.boxes = {};
    G.rows.forEach((s) => { G.boxes[s] = Array.from({ length: capOf(s) / 2 }, () => []); });
    G.log = []; G.mistakes = 0; G.won = false; G.mood = 'point'; G.shake = null;
    G.msg = `${ELS[pick - 1].name} has ${pick} electrons. Start at the bottom.`;
  }
  const countE = () => G.log.length;
  const subFull = (s) => G.boxes[s].every((b) => b.length === 2);
  function geom(s) {
    const i = G.rows.indexOf(s), n = G.rows.length;
    const step = Math.min(92, 392 / Math.max(1, n - 1 || 1));
    const bh = Math.min(62, step - 8), bw = Math.min(70, bh + 18);
    const y = 472 - i * step - bh / 2;
    return { x: 96, y, bw, bh };
  }
  function tapBox(s, i) {
    if (G.won) return;
    const fail = (rule, msg) => {
      G.mistakes++; G.msg = `${rule}: ${msg}`; G.mood = 'oops'; G.shake = { s, i, t0: gameStage.t };
      Lab.sound.bad();
    };
    const box = G.boxes[s][i];
    if (countE() >= G.z) return;
    const lower = G.rows.slice(0, G.rows.indexOf(s)).find((x) => !subFull(x));
    if (lower) return fail('Aufbau', `${lower} is cheaper and is not full yet.`);
    if (box.length === 2) return fail('Pauli', 'that box already has two electrons.');
    const spin = G.spin;
    if (box.length === 1) {
      if (box[0] === spin) return fail('Pauli', 'partners in a box need opposite spins. Flip the spin.');
      if (G.boxes[s].some((b) => b.length === 0)) return fail('Hund', 'take an empty box before pairing up.');
    } else {
      const single = G.boxes[s].find((b) => b.length === 1);
      if (single && single[0] !== spin) return fail('Hund', 'singles in a subshell point the same way. Flip the spin.');
    }
    box.push(spin); G.log.push([s, i]);
    Lab.sound.pop();
    G.mood = 'happy';
    if (countE() === G.z) {
      G.won = true; G.mood = 'cheer';
      G.msg = G.mistakes ? `Done, with ${G.mistakes} slip${G.mistakes > 1 ? 's' : ''}. Try another atom.` : 'Perfect: no rules broken!';
      Lab.collection.award(1); Lab.confetti(60);
    } else if (subFull(s) && G.spin === 'down') {
      G.msg = 'Subshell full. Flip back to up for the next one.';
    } else if (G.boxes[s].every((b) => b.length >= 1) && !subFull(s) && G.spin === 'up') {
      G.msg = 'Every box has one. Now flip the spin and pair up.';
    } else G.msg = `${countE()} placed, ${G.z - countE()} to go.`;
    gameStage.redraw();
  }
  const gameStage = Lab.stage('#c-game', {
    h: 500,
    label: 'A set of orbital boxes for one atom. Tap a box to place the next electron. A message explains any rule you break.',
    onPointer(e) {
      if (e.type === 'hover') { gameStage.canvas.style.cursor = hit(e.x, e.y) ? 'pointer' : 'default'; return; }
      if (e.type !== 'down') return;
      const h2 = hit(e.x, e.y);
      if (h2) tapBox(h2.s, h2.i);
    },
    draw(g, t) {
      Art.text(g, `${countE()} of ${G.z} electrons placed`, 96, 28, { size: 26, align: 'left', color: C.ink });
      const m = {};
      G.rows.forEach((s) => {
        const { x, y, bw, bh } = geom(s);
        const col = blockOf(s);
        Art.text(g, s, x - 12, y, { size: Math.min(30, bh * 0.66), font: 'display', color: col, align: 'right' });
        G.boxes[s].forEach((b, i) => {
          let dx = 0;
          if (G.shake && G.shake.s === s && G.shake.i === i) {
            const u = t - G.shake.t0;
            if (u < 0.45) dx = Math.sin(u * 44) * 7 * (1 - u / 0.45);
          }
          g.fillStyle = 'rgba(255,255,255,.08)'; g.strokeStyle = col; g.lineWidth = 3;
          Art.round(g, x + i * bw + 2 + dx, y - bh / 2, bw - 4, bh, 8); g.fill(); g.stroke();
          b.forEach((sp, k) => spinArrow(g, x + i * bw + dx + bw * (k ? 0.68 : 0.32), y, sp === 'up', bh * 0.68));
        });
        const n = G.boxes[s].reduce((a, b) => a + b.length, 0);
        if (n) m[s] = n;
      });
      const px = 640;
      const el = ELS[G.z - 1];
      Art.atom(g, px, 92, 46, el.sym, { face: G.won ? 'grin' : 'happy', t, look: [-1, 0.2] });
      Art.text(g, el.name, px, 160, { size: 30, font: 'display', color: C.sun });
      Art.bubble(g, G.msg, px - 18, 348, { w: 290, size: 22, side: 'down', dx: 0 });
      Art.moe(g, px, 484, 118, G.mood, { t });
      if (G.won) cfgText(g, shorthandText(m) || writeList(m, namesFilling(m)).join(' '), px, 198, { size: 28, color: C.leaf, halo: true });
    },
  });
  function hit(x, y) {
    for (const s of G.rows) {
      const c = geom(s);
      const count = G.boxes[s].length;
      if (y >= c.y - c.bh / 2 - 2 && y <= c.y + c.bh / 2 + 2 && x >= c.x && x <= c.x + count * c.bw) return { s, i: Math.floor((x - c.x) / c.bw) };
    }
    return null;
  }
  spinSeg = Lab.segmented('#game-spin', (v) => { G.spin = v; });
  Lab.$('#game-undo').addEventListener('click', () => {
    const last = G.log.pop();
    if (!last) return;
    G.boxes[last[0]][last[1]].pop();
    G.won = false; G.mood = 'point';
    G.msg = `${countE()} placed, ${G.z - countE()} to go.`;
    gameStage.redraw();
  });
  Lab.$('#game-new').addEventListener('click', () => { newGame(); spinSeg.set('up'); gameStage.redraw(); });
  newGame(7);
  void spinSeg;

  /* ---------- The table as a map (used by a bench and a story) ---------- */
  const TW = 41, TH = 41, TX = 19, TY = 30;
  const tilePos = (e) => {
    const row = e.y;
    const yy = row >= 9 ? TY + 7 * TH + 16 + (row - 9) * TH : TY + (row - 1) * TH;
    return [TX + (e.x - 1) * TW, yy];
  };
  function drawTiles(g, litFn, o = {}) {
    ELS.forEach((e) => {
      const [x, y] = tilePos(e);
      const lit = litFn(e);
      const col = BLOCK[e.block];
      g.fillStyle = lit ? col : Art.alpha(col, 0.2);
      g.strokeStyle = lit ? '#1A0F2E' : Art.alpha(col, 0.5); g.lineWidth = 1.6;
      Art.round(g, x + 1, y + 1, TW - 2, TH - 2, 6); g.fill(); g.stroke();
      if (o.labels !== false) Art.text(g, e.sym, x + TW / 2, y + TH / 2 + 1, { size: e.sym.length > 2 ? 16 : 20, font: 'display', color: lit ? '#1A0F2E' : Art.alpha('#ffffff', 0.8) });
    });
  }
  function blockLabels(g, a = 1, only) {
    const labs = [['s block', TX + TW, TY - 15, 's'], ['d block', TX + 7 * TW, TY + 3 * TH - 16, 'd'], ['p block', TX + 15 * TW, TY + TH - 14, 'p'], ['f block', TX + TW, TY + 7 * TH + 16 + TH, 'f']];
    labs.forEach(([s, x, y, k]) => { if (!only || only === k) Art.text(g, s, x, y, { size: 22, font: 'display', color: BLOCK[k], alpha: a, halo: true }); });
  }
  const W = { z: 33, t0: 0 };
  const walkDur = (z) => clamp(z * 0.07, 0.8, 5);
  const mapStage = Lab.stage('#c-map', {
    h: 440,
    label: 'The periodic table colored by s, p, d and f block. A walker moves from hydrogen to the chosen element, spelling out the configuration.',
    onPointer(e) {
      const hitEl = ELS.find((el) => { const [x, y] = tilePos(el); return e.x >= x && e.x < x + TW && e.y >= y && e.y < y + TH; });
      if (e.type === 'hover') { mapStage.canvas.style.cursor = hitEl ? 'pointer' : 'default'; return; }
      if (e.type === 'down' && hitEl) setWalk(hitEl.z);
    },
    draw(g, t, dt, st) {
      const u = Lab.reducedMotion || !st.playing ? 1 : clamp((t - W.t0) / walkDur(W.z));
      const cur = Math.max(1, Math.round(ease.inOut(u) * W.z));
      drawTiles(g, (e) => e.z <= cur);
      blockLabels(g);
      const e = ELS[cur - 1];
      const [cx, cy] = tilePos(e);
      Art.glow(g, cx + TW / 2, cy + TH / 2, 40, C.sun, 0.7);
      g.strokeStyle = '#fff'; g.lineWidth = 3.5; Art.round(g, cx, cy, TW, TH, 7); g.stroke();
      // The subshell the walker is filling now.
      const id = idealMap(cur);
      const nowS = namesFilling(id).pop();
      if (u < 1) Art.pill(g, nowS, cx + TW / 2, cy - 15 < 14 ? cy + TH + 15 : cy - 15, { size: 22, color: blockOf(nowS), text: '#1A0F2E', font: 'display' });
      // Readout in the gap at the top of the table.
      const done = u >= 1;
      const showMap = done ? atomMap(W.z) : id;
      Art.text(g, `${e.name}`, TX + 7 * TW, TY + 18, { size: 30, font: 'display', color: C.sun, halo: true });
      cfgText(g, shorthandText(showMap) || '1s¹', TX + 7 * TW, TY + 60, { size: 28, halo: true });
    },
  });
  function setWalk(z, keepT) {
    W.z = z;
    if (!keepT) W.t0 = mapStage.t;
    Lab.$('#map-z').value = z; Lab.paintRange(Lab.$('#map-z'));
    Lab.$('#map-z-out').textContent = `${z}: ${ELS[z - 1].name}`;
    const m = atomMap(z), id = idealMap(z);
    const period = ELS[z - 1].period;
    const rowNames = namesFilling(id).filter((s) => {
      const k = ORDER.indexOf(s);
      const start = ['1s', '2s', '3s', '4s', '5s', '6s', '7s'][period - 1];
      return k >= ORDER.indexOf(start);
    });
    const full = writeList(m, namesFilling(m)).join(' ');
    const note = EXC[ELS[z - 1].sym] ? ` The walk predicts ${supHTML(shorthandText(id))}, but ${ELS[z - 1].name.toLowerCase()} is an exception, with ${supHTML(shorthandText(m))}.` : '';
    Lab.$('#map-foot').innerHTML = `<p>${ELS[z - 1].name} sits in period ${period}. Walking along that row, you pass through <b>${rowNames.join(', ')}</b>. In full: ${supHTML(z > 36 ? shorthandText(m) : full)}.${note}</p>`;
    mapStage.redraw();
  }
  Lab.$('#map-z').addEventListener('input', (e) => setWalk(+e.target.value));
  Lab.$('#map-go').addEventListener('click', () => setWalk(W.z));
  setWalk(33);

  /* ---------- Story 2: shorthand, exceptions and ions ---------- */
  function shells(g, cx, cy, list, o = {}) {
    // list: electrons per shell, from the inside out. The outer shell is lit.
    list.forEach((k, i) => {
      const rr = (o.r0 || 30) + i * (o.dr || 24);
      const outer = i === list.length - 1;
      g.strokeStyle = outer ? C.sun : 'rgba(255,255,255,.3)'; g.lineWidth = outer ? 3 : 2;
      g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke();
      for (let j = 0; j < k; j++) {
        const a = (j / k) * TAU + (o.t || 0) * (0.5 - i * 0.08) + i;
        if (outer) Art.electron(g, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 8);
        else Art.ball(g, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 4.5, '#7F8FB5');
      }
    });
  }
  const shellCounts = (z) => { const m = atomMap(z), out = []; Object.keys(m).forEach((s) => { const n = +s[0] - 1; out[n] = (out[n] || 0) + m[s]; }); return out; };
  Lab.story('#story-short', {
    title: 'Shortcuts, rule-breakers and ions',
    scenes: [
      {
        say: 'The table has four regions, called <b>blocks</b>. Each is named after the subshell being filled there: <b>s</b> on the left, <b>p</b> on the right, <b>d</b> in the middle, and <b>f</b> in the two rows below.',
        dur: 4.4,
        draw(g, p) {
          const order = ['s', 'p', 'd', 'f'];
          const lit = (b) => seg(p, 0.08 + order.indexOf(b) * 0.2, 0.22 + order.indexOf(b) * 0.2) > 0.5;
          g.save(); g.translate(0, 8);
          drawTiles(g, (e) => lit(e.block), { labels: false });
          order.forEach((b, i) => blockLabels(g, seg(p, 0.08 + i * 0.2, 0.22 + i * 0.2), b));
          g.restore();
          const ha = seg(p, 0.82, 0.96);
          cfgText(g, 'Helium is 1s², so it counts as s', 290, 46, { size: 26, font: 'body', color: C.pink, alpha: ha, halo: true });
          Art.arrow(g, 490, 46, TX + 17 * TW - 6, 46, { color: C.pink, w: 4, head: 11, p: ha });
        },
      },
      {
        say: 'Long lists repeat themselves. The first 18 electrons of iron match argon exactly, so we write <b>[Ar]</b> instead. This is <b>noble-gas shorthand</b>. Iron becomes $\\mathrm{[Ar]\\,4s^{2}\\,3d^{6}}$.',
        dur: 4.6,
        draw(g, p) {
          const inner = '1s² 2s² 2p⁶ 3s² 3p⁶', outer = '4s² 3d⁶';
          const wI = cfgText(g, inner, 0, 0, { size: 40, measure: true }), wO = cfgText(g, outer, 0, 0, { size: 40, measure: true });
          const y0 = 104, x0 = 400 - (wI + wO + 14) / 2;
          Art.text(g, 'Iron, Z = 26', 400, 42, { size: 30, color: C.dim });
          const a = seg(p, 0.15, 0.35);
          if (a > 0) { g.fillStyle = Art.alpha(C.violet, 0.28 * a); Art.round(g, x0 - 10, y0 - 34, wI + 20, 66, 14); g.fill(); }
          cfgText(g, inner, x0, y0, { size: 40, align: 'left', color: Art.mix(C.ink, C.violet, a) });
          cfgText(g, outer, x0 + wI + 14, y0, { size: 40, align: 'left', color: C.sun });
          Art.text(g, 'This part is the same as argon, 18 electrons', x0 + wI / 2, y0 + 58, { size: 24, color: C.violet, alpha: seg(p, 0.25, 0.45) });
          const q = ease.back(seg(p, 0.5, 0.72));
          Art.arrow(g, 400, 196, 400, 262, { color: C.ink, w: 6, p: seg(p, 0.45, 0.6) });
          if (q > 0) {
            g.save(); g.translate(400, 330); g.scale(q, q);
            g.fillStyle = C.plum2; g.strokeStyle = C.sun; g.lineWidth = 4;
            Art.round(g, -260, -56, 520, 112, 26); g.fill(); g.stroke();
            Art.text(g, '[Ar]', -160, 0, { size: 60, font: 'display', color: C.violet });
            cfgText(g, '4s² 3d⁶', 90, 0, { size: 60, color: C.sun });
            g.restore();
          }
          Art.text(g, 'Outer electrons are what matter', 400, 420, { size: 26, alpha: seg(p, 0.8, 0.96) });
        },
      },
      {
        say: '<b>Valence electrons</b> live in the outermost shell, and they do the chemistry. Lithium, sodium and potassium each have one. That is why a whole column of the table behaves alike.',
        dur: 4,
        draw(g, p, t) {
          [['Li', 3, 136], ['Na', 11, 400], ['K', 19, 664]].forEach(([sym, z, cx], i) => {
            const a = seg(p, 0.08 + i * 0.24, 0.28 + i * 0.24);
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            const list = shellCounts(z);
            shells(g, cx, 186, list, { t, r0: 44, dr: 26 });
            Art.atom(g, cx, 186, 24, sym, { label: sym });
            g.restore();
            cfgText(g, shorthandText(atomMap(z)), cx, 342, { size: 32, color: C.sun, alpha: a });
          });
          Art.text(g, 'One valence electron each', 400, 402, { size: 34, font: 'display', color: C.cyan, alpha: seg(p, 0.76, 0.94), halo: true });
        },
      },
      {
        say: 'Now the rule-breakers. The pattern predicts <b>chromium</b> is $\\mathrm{[Ar]\\,4s^{2}\\,3d^{4}}$. The 4s and 3d are so close in energy that one electron moves up, giving a half-filled 3d: $\\mathrm{[Ar]\\,4s^{1}\\,3d^{5}}$. <b>Copper</b> does the same to fill its 3d.',
        dur: 5.2,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.3, 0.66));
          const row = (y, label, d0, d1, delay) => {
            const qq = ease.inOut(seg(p, delay, delay + 0.34));
            const x4s = 150, x3d = 330, bw = 54, bh = 56;
            Art.text(g, label, 60, y, { size: 34, font: 'display', color: C.sun });
            boxRow(g, x4s, y, bw, bh, '4s', qq >= 1 ? 1 : 2, {});
            boxRow(g, x3d, y, bw, bh, '3d', qq >= 1 ? d1 : d0, {});
            if (qq > 0 && qq < 1) {
              const tx = x3d + (d1 - 1 < 5 ? d1 - 1 : d1 - 6) * bw + bw * (d1 <= 5 ? 0.34 : 0.66);
              const fx = x4s + bw * 0.66;
              const up = d1 <= 5;
              spinArrow(g, lerp(fx, tx, qq), y - Math.sin(qq * Math.PI) * 54, up, 38, { color: C.pink });
            }
            Art.text(g, qq >= 1 ? (d1 === 5 ? 'half-filled' : 'full') : 'hmm', 720, y, { size: 28, color: qq >= 1 ? C.leaf : C.dim, alpha: qq >= 1 ? 1 : 0 });
            const pa = seg(p, delay - 0.08, delay), ra = seg(p, delay + 0.26, delay + 0.36);
            cfgText(g, `Predicted: [Ar] 4s² 3d${sup(d0)}`, 240, y + 62, { size: 26, font: 'body', color: C.dim, alpha: pa });
            cfgText(g, `Real: [Ar] 4s¹ 3d${sup(d1)}`, 570, y + 62, { size: 30, color: C.sun, alpha: ra });
          };
          row(92, 'Cr', 4, 5, 0.12);
          row(262, 'Cu', 9, 10, 0.5);
          Art.text(g, 'Lower total energy, by a small margin', 400, 410, { size: 24, color: C.dim, alpha: seg(p, 0.84, 1) });
          void q; void t;
        },
      },
      {
        say: 'Atoms become ions by losing or gaining electrons, usually to match a noble gas. Sodium loses its 3s electron and matches neon. Chlorine gains one and matches argon.',
        dur: 4.4,
        draw(g, p, t) {
          const panel = (cx, sym, ion, chg, z, q, faceB) => {
            const u = ease.inOut(seg(p, q, q + 0.34));
            const list = shellCounts(z);
            if (chg > 0) list[list.length - 1] -= chg;
            const shown = chg > 0 ? (u >= 1 ? list.filter((k) => k > 0) : shellCounts(z)) : (u >= 1 ? list.map((k, i) => (i === list.length - 1 ? k - chg : k)) : list);
            shells(g, cx, 172, shown, { t, r0: 42, dr: 28 });
            Art.atom(g, cx, 172, 28, sym, { label: sym, face: null });
            // Electron in flight.
            if (u > 0 && u < 1) {
              if (chg > 0) Art.electron(g, cx + u * 180, 172 - u * 130, 10);
              else Art.electron(g, cx - (1 - u) * 180, 172 - (1 - u) * 130, 10);
            }
            cfgText(g, u >= 1 ? ion : shorthandText(atomMap(z)), cx, 310, { size: 36, color: u >= 1 ? C.sun : C.ink });
            Art.text(g, u >= 1 ? faceB : '', cx, 356, { size: 26, color: C.leaf });
          };
          panel(210, 'Na', 'Na⁺', 1, 11, 0.12, 'same as neon');
          panel(590, 'Cl', 'Cl⁻', -1, 17, 0.5, 'same as argon');
          Art.text(g, 'Isoelectronic means the same number of electrons', 400, 412, { size: 26, color: C.cyan, alpha: seg(p, 0.86, 1) });
        },
      },
      {
        say: 'Transition metals have a twist. 4s fills before 3d, but once 3d has electrons, 4s sits higher, so <b>4s leaves first</b>. To make $\\ce{Fe^{2+}}$, the two 4s electrons go, giving $\\mathrm{[Ar]\\,3d^{6}}$.',
        dur: 4.6,
        draw(g, p) {
          const x = 180, bw = 66, bh = 66;
          const u1 = ease.inOut(seg(p, 0.3, 0.52)), u2 = ease.inOut(seg(p, 0.54, 0.76));
          const left = (u1 >= 1 ? 1 : 2) - (u2 >= 1 ? 1 : 0);
          Art.text(g, 'Fe', 74, 60, { size: 46, font: 'display', color: Art.elementColor('Fe'), alpha: 1 - seg(p, 0.76, 0.85) });
          cfgText(g, 'Fe²⁺', 74, 60, { size: 46, color: C.sun, alpha: seg(p, 0.76, 0.85) });
          boxRow(g, x, 130, bw, bh, '4s', left, { hi: seg(p, 0.1, 0.3) > 0.5 && u2 < 1 });
          boxRow(g, x, 270, bw, bh, '3d', 6, {});
          const fly = (u, dx, up) => {
            if (u <= 0 || u >= 1) return;
            spinArrow(g, x + dx + u * 420, 130 - u * 90, up, 44, { color: C.sun, alpha: 1 - u * 0.3 });
          };
          fly(u1, bw * 0.66, false); fly(u2, bw * 0.34, true);
          Art.text(g, 'n = 4 leaves first', 390, 130, { size: 28, color: C.pink, align: 'left', alpha: seg(p, 0.12, 0.3), halo: true });
          Art.arrow(g, 70, 262, 70, 140, { color: C.dim, w: 4, head: 11, alpha: seg(p, 0.05, 0.2) });
          Art.text(g, 'energy', 72, 288, { size: 22, color: C.dim, alpha: seg(p, 0.05, 0.2) });
          cfgText(g, 'Atom: [Ar] 4s² 3d⁶', 400, 358, { size: 30, font: 'body', color: C.dim, alpha: 1 - seg(p, 0.76, 0.86) * 0.5 });
          cfgText(g, 'Ion: [Ar] 3d⁶', 400, 408, { size: 38, color: C.sun, alpha: seg(p, 0.78, 0.92) });
        },
      },
      {
        say: 'Unpaired electrons act like tiny magnets. $\\ce{Fe^{2+}}$ has four of them, so it is <b>paramagnetic</b> and gets pulled toward a magnet. $\\ce{Zn^{2+}}$ has none, so it is <b>diamagnetic</b>, and is very weakly pushed away.',
        dur: 4.4,
        draw(g, p, t) {
          const pull = ease.out(seg(p, 0.3, 0.7));
          const panel = (cx, label, m, swing, col) => {
            const topY = 44, len = 158;
            const ang = swing + Math.sin(t * 1.3) * 0.012;
            const bx = cx + Math.sin(ang) * len, by = topY + Math.cos(ang) * len;
            g.strokeStyle = '#D9D1EC'; g.lineWidth = 3;
            g.beginPath(); g.moveTo(cx, topY); g.lineTo(bx, by); g.stroke();
            g.fillStyle = '#9A94B3'; g.fillRect(cx - 40, topY - 12, 80, 12);
            Art.ball(g, bx, by + 18, 28, col);
            // Magnet on the right.
            const mx = cx + 112, my = 184;
            g.fillStyle = C.red; g.fillRect(mx, my - 40, 52, 40);
            g.fillStyle = C.blue; g.fillRect(mx, my, 52, 40);
            g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.strokeRect(mx, my - 40, 52, 80);
            Art.text(g, 'N', mx + 26, my - 20, { size: 24, font: 'display', color: '#fff' });
            Art.text(g, 'S', mx + 26, my + 20, { size: 24, font: 'display', color: '#fff' });
            boxRow(g, cx - 134, 306, 54, 48, '3d', m, { label: false });
            cfgText(g, label, cx - 4, 362, { size: 30, color: C.sun });
          };
          panel(190, 'Fe²⁺: 4 unpaired', 6, 0.3 * pull, Art.elementColor('Fe'));
          panel(590, 'Zn²⁺: 0 unpaired', 10, -0.02 * pull, Art.elementColor('Zn'));
          Art.text(g, 'Paramagnetic', 190, 410, { size: 28, color: C.leaf, alpha: seg(p, 0.5, 0.7) });
          Art.text(g, 'Diamagnetic', 590, 410, { size: 28, color: C.cyan, alpha: seg(p, 0.65, 0.85) });
        },
      },
    ],
  });

  /* ---------- Bench: make an ion ---------- */
  const IONS = {
    Na: [1], Mg: [2], Al: [3], K: [1], Ca: [2], Sc: [3], Ti: [2, 3, 4], V: [2, 3], Cr: [2, 3], Mn: [2, 3], Fe: [2, 3], Co: [2, 3], Ni: [2], Cu: [1, 2], Zn: [2], Ag: [1], Sn: [2, 4],
    N: [-3], O: [-2], F: [-1], S: [-2], Cl: [-1], Br: [-1], I: [-1],
  };
  const I = { sym: 'Fe', q: 2, t0: 0 };
  const chargeText = (q) => (Math.abs(q) === 1 ? '' : sup(Math.abs(q))) + (q > 0 ? '⁺' : '⁻');
  const chargeLabel = (q) => (Math.abs(q) === 1 ? '' : Math.abs(q)) + (q > 0 ? '+' : '−');
  const ionStage = Lab.stage('#c-ion', {
    h: 450,
    label: 'Orbital boxes for the outer subshells of an atom. Electrons fly out, or arrive, as the ion forms.',
    draw(g, t, dt, st) {
      const { sym, q } = I;
      const z = EL[sym].z, atom = atomMap(z), ion = ionMap(z, q);
      const all = {};
      Object.keys(atom).forEach((s) => { all[s] = 1; }); Object.keys(ion).forEach((s) => { all[s] = 1; });
      const coreInfo = L.shorthandMap(atom);
      const coreNames = coreInfo.core ? Object.keys(atomMap(L.NOBLE.find((n) => n[1] === coreInfo.core)[0])) : [];
      let rows = Object.keys(all).filter((s) => !coreNames.includes(s) || (ion[s] || 0) !== (atom[s] || 0));
      // After filling, the order by energy is simply n, then l.
      rows = rows.sort((a, b) => L.nOf(a) - L.nOf(b) || L.lOf(a) - L.lOf(b));
      if (q < 0) { const nextS = ORDER.find((x) => (atom[x] || 0) < capOf(x)); if (!rows.includes(nextS)) rows.push(nextS); }
      const elapsed = Lab.reducedMotion || !st.playing ? 99 : t - I.t0;
      const k = Math.abs(q), perE = 0.62, start = 0.4;
      const doneN = clamp(Math.floor((elapsed - start) / perE) + 1, 0, k);
      const cur = {};
      Object.keys(atom).forEach((s) => { cur[s] = atom[s]; });
      const leaving = q > 0 ? leavingOrder(z, q) : [];
      const arriving = [];
      if (q < 0) { const tmp = Object.assign({}, atom); for (let i = 0; i < k; i++) { const s = ORDER.find((x) => (tmp[x] || 0) < capOf(x)); arriving.push(s); tmp[s] = (tmp[s] || 0) + 1; } }
      for (let i = 0; i < doneN; i++) { if (q > 0) cur[leaving[i]] -= 1; else cur[arriving[i]] = (cur[arriving[i]] || 0) + 1; }
      const flyU = clamp((((elapsed - start) % perE) + perE) % perE / perE);
      const flying = elapsed >= start && doneN < k + 1 && (elapsed - start) < k * perE;
      const x0 = 104, n = rows.length;
      const step = n > 3 ? 72 : 104;
      const bw = n > 3 ? 52 : 60, bh = n > 3 ? 54 : 66;
      const yOf = (i) => 344 - i * step;
      cfgText(g, q > 0 ? 'Highest n leaves first' : 'New electrons take the next open place', 40, 40, { size: 26, font: 'body', color: C.sun, align: 'left' });
      rows.forEach((s, i) => boxRow(g, x0, yOf(i), bw, bh, s, cur[s] || 0, { hi: flying && (q > 0 ? leaving[doneN] === s : arriving[doneN] === s) }));
      if (coreInfo.core) {
        g.fillStyle = 'rgba(255,255,255,.08)'; g.strokeStyle = C.line; g.lineWidth = 2.5;
        Art.round(g, 40, 396, 300, 46, 14); g.fill(); g.stroke();
        Art.text(g, `[${coreInfo.core}] core stays`, 190, 419, { size: 24 });
      }
      if (flying) {
        const idx = Math.floor((elapsed - start) / perE);
        const s = q > 0 ? leaving[idx] : arriving[idx];
        const rowI = rows.indexOf(s);
        if (rowI >= 0) {
          const before = (() => { const tmp = Object.assign({}, atom); for (let i = 0; i < idx; i++) { if (q > 0) tmp[leaving[i]] -= 1; else tmp[arriving[i]] = (tmp[arriving[i]] || 0) + 1; } return tmp[s] || 0; })();
          const nb = capOf(s) / 2;
          const seat = q > 0 ? before - 1 : before;
          const box = seat < nb ? seat : seat - nb, up = seat < nb;
          const sx = x0 + box * bw + bw * (up ? 0.34 : 0.66), sy = yOf(rowI);
          const uu = ease.inOut(flyU);
          const ox = 760, oy = 40;
          const X = q > 0 ? lerp(sx, ox, uu) : lerp(ox, sx, uu), Y = q > 0 ? lerp(sy, oy, uu) : lerp(oy, sy, uu);
          spinArrow(g, X, Y, up, 40, { color: C.sun });
        }
      }
      const finished = elapsed >= start + k * perE;
      const cx = 640;
      Art.atom(g, cx, 112, 62, sym, { face: finished ? 'grin' : 'wow', t, look: [-1, 0.2], charge: finished ? chargeLabel(q).replace('−', '-') : undefined });
      const label = finished ? `${sym}${chargeText(q)}` : sym;
      cfgText(g, label, cx, 204, { size: 44, color: C.sun });
      const txt = finished ? shorthandText(ion, 'sup', 'shell', true) : shorthandText(atom, 'sup', 'fill');
      cfgText(g, txt, cx, 254, { size: txt.length > 15 ? 26 : 30, halo: true });
      const iso = finished ? L.isoNoble(ion) : null;
      if (iso) Art.text(g, `Same as ${iso}`, cx, 298, { size: 26, color: C.leaf });
      if (finished) {
        const u = unpaired(ion);
        Art.text(g, `${u} unpaired: ${u ? 'paramagnetic' : 'diamagnetic'}`, cx, iso ? 340 : 298, { size: 24, color: u ? C.cyan : C.dim });
      }
    },
  });
  function paintIon() {
    const { sym, q } = I;
    const z = EL[sym].z, atom = atomMap(z), ion = ionMap(z, q);
    Lab.$('#ion-atom').innerHTML = supHTML(`${sym}: ${shorthandText(atom)}`);
    Lab.$('#ion-ion').innerHTML = supHTML(`${sym}${chargeText(q)}: ${shorthandText(ion, 'sup', 'shell', true)}`);
    Lab.$('#ion-un').textContent = unpaired(ion);
    const e = totalE(ion);
    let msg;
    if (q > 0) {
      const lv = [...new Set(leavingOrder(z, q))];
      msg = `${EL[sym].name} starts with ${z} electrons and loses ${q}, leaving ${e}. They leave from the highest $n$ first: <b>${lv.join(', then ')}</b>.`;
    } else msg = `${EL[sym].name} starts with ${z} electrons and gains ${-q}, reaching ${e}. New electrons go to the next open place.`;
    if (L.isoNoble(ion)) msg += ` It now has the same configuration as ${L.isoNoble(ion)}, so the two are <b>isoelectronic</b>.`;
    if (EL[sym].block === 'd' && q > 0) msg += ' Notice that d electrons stay until the outer s electrons have gone.';
    Lab.$('#ion-foot').innerHTML = Lab.texString(`<p>${msg}</p>`);
  }
  function buildCharges() {
    const host = Lab.$('#ion-q');
    host.innerHTML = IONS[I.sym].map((q) => `<button type="button" data-value="${q}" aria-pressed="${q === I.q}">${chargeLabel(q)}</button>`).join('');
    Lab.$$('button', host).forEach((b) => b.addEventListener('click', () => {
      I.q = +b.dataset.value; I.t0 = ionStage.t;
      Lab.$$('button', host).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      paintIon(); ionStage.redraw();
    }));
  }
  const elSel = Lab.$('#ion-el');
  elSel.innerHTML = Object.keys(IONS).map((s) => `<option value="${s}"${s === I.sym ? ' selected' : ''}>${EL[s].name} (${s})</option>`).join('');
  elSel.addEventListener('change', () => { I.sym = elSel.value; I.q = IONS[I.sym][0]; I.t0 = ionStage.t; buildCharges(); paintIon(); ionStage.redraw(); });
  buildCharges(); paintIon();
  void rand;
});
