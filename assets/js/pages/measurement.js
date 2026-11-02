/* Lesson 1.2: Measuring and significant figures. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;

  /* ---------- Shared helpers ---------- */
  /** A digit tile. */
  function tile(g, x, y, w, h, ch, o = {}) {
    g.save();
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    if (o.glow) Art.glow(g, x + w / 2, y + h / 2, w * 1.1, o.glow, 0.55);
    const f = g.createLinearGradient(0, y, 0, y + h);
    const base = o.fill || '#4A3772';
    f.addColorStop(0, Art.mix(base, '#ffffff', 0.14)); f.addColorStop(1, Art.mix(base, '#100820', 0.22));
    g.fillStyle = f; g.strokeStyle = o.stroke || '#1A0F2E'; g.lineWidth = o.lw || 3;
    Art.round(g, x, y, w, h, Math.min(14, w * 0.24)); g.fill(); g.stroke();
    if (ch) Art.text(g, ch, x + w / 2, y + h / 2 + 1, { font: 'display', size: o.size || h * 0.62, color: o.color || '#fff' });
    g.restore();
  }
  /** Parse a typed number into characters tagged with the sig fig rule that applies. */
  function parseSF(raw) {
    const s = String(raw).trim().replace(/,/g, '').replace(/\s/g, '').replace(/^[+]/, '');
    const m = s.match(/^(-?)(\d*\.?\d*)(?:(?:e|[x×*]10\^?)([+-]?\d+))?$/i);
    if (!m || !/\d/.test(m[2])) return null;
    const mant = m[2], hasPoint = mant.includes('.');
    const chars = [...mant];
    const dIdx = chars.map((c, i) => (c === '.' ? -1 : i)).filter((i) => i >= 0);
    const nz = dIdx.filter((i) => chars[i] !== '0');
    const first = nz.length ? nz[0] : Infinity, last = nz.length ? nz[nz.length - 1] : -1;
    const out = chars.map((ch, i) => {
      if (ch === '.') return { ch, point: true };
      if (i < first) return { ch, sig: false, rule: 'leading' };
      if (ch !== '0') return { ch, sig: true, rule: 'nonzero' };
      if (i < last) return { ch, sig: true, rule: 'between' };
      return hasPoint ? { ch, sig: true, rule: 'trailing' } : { ch, sig: false, rule: 'place' };
    });
    return { chars: out, count: out.filter((c) => c.sig).length, exp: m[3] !== undefined ? +m[3] : null };
  }
  const RULE = {
    nonzero: { color: C.leaf, text: 'Nonzero digits always count' },
    between: { color: C.cyan, text: 'Zeros between digits count' },
    trailing: { color: C.sun, text: 'End zeros with a decimal point count' },
    leading: { color: C.faint, text: 'Leading zeros only hold a place' },
    place: { color: C.red, text: 'End zeros with no decimal point do not count' },
  };

  /* ---------- Bench: prefix ladder ---------- */
  const RUNGS = [
    { name: 'mega', sym: 'M', pow: 6, eq: '1 Mm = 1,000,000 m', note: 'About a 10-hour drive' },
    { name: 'kilo', sym: 'k', pow: 3, eq: '1 km = 1000 m', note: 'About a 12-minute walk' },
    { name: 'no prefix', sym: '', pow: 0, eq: '1 m', note: 'One long stride' },
    { name: 'deci', sym: 'd', pow: -1, eq: '1 dm = 0.1 m', note: 'About the width of a hand' },
    { name: 'centi', sym: 'c', pow: -2, eq: '1 cm = 0.01 m', note: 'About the size of a pea' },
    { name: 'milli', sym: 'm', pow: -3, eq: '1 mm = 0.001 m', note: 'A coin is 1 to 2 mm thick' },
    { name: 'micro', sym: 'µ', pow: -6, eq: '1 µm = 0.000001 m', note: 'A small bacterium' },
    { name: 'nano', sym: 'n', pow: -9, eq: '1 nm = 0.000000001 m', note: 'Only a few atoms wide' },
  ];
  const LA = { i: 1, y: 1, t0: 0 };
  const rungY = (i) => 44 + i * 55;
  function rungArt(g, i, t, cx, cy) {
    if (i === 0) {
      g.strokeStyle = '#5B5375'; g.lineWidth = 34; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - 170, cy + 44); g.bezierCurveTo(cx - 70, cy - 60, cx + 40, cy + 70, cx + 170, cy - 36); g.stroke();
      g.strokeStyle = C.sun; g.lineWidth = 3; g.setLineDash([14, 12]); g.stroke(); g.setLineDash([]);
      const u = (t * 0.12) % 1, B = (a, b, c, d, k) => (1 - k) ** 3 * a + 3 * (1 - k) ** 2 * k * b + 3 * (1 - k) * k * k * c + k ** 3 * d;
      const x = B(cx - 170, cx - 70, cx + 40, cx + 170, u), y = B(cy + 44, cy - 60, cy + 70, cy - 36, u);
      g.fillStyle = C.pink; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; Art.round(g, x - 22, y - 13, 44, 22, 7); g.fill(); g.stroke();
      g.fillStyle = '#1A0F2E'; g.beginPath(); g.arc(x - 12, y + 9, 5, 0, TAU); g.arc(x + 12, y + 9, 5, 0, TAU); g.fill();
    } else if (i === 1) {
      g.strokeStyle = '#6B8F5A'; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - 180, cy + 50); g.lineTo(cx + 180, cy + 50); g.stroke();
      const x = cx - 150 + ((t * 26) % 300), step = Math.sin(t * 7);
      Art.moe(g, x, cy + 44 - Math.abs(step) * 4, 90, 'happy', { t, bob: false });
      [-170, 170].forEach((dx) => { g.fillStyle = '#D8D2EA'; g.fillRect(cx + dx - 3, cy - 26, 6, 72); g.fillStyle = dx < 0 ? C.leaf : C.pink; g.beginPath(); g.moveTo(cx + dx + 3, cy - 26); g.lineTo(cx + dx + 40, cy - 12); g.lineTo(cx + dx + 3, cy + 2); g.closePath(); g.fill(); });
    } else if (i === 2) {
      Art.moe(g, cx - 90, cy + 62, 110, 'wave', { t, bob: false });
      Art.arrow(g, cx - 50, cy + 72, cx + 120, cy + 72, { color: C.sun, w: 5, both: true });
      Art.text(g, '1 m', cx + 35, cy + 42, { font: 'display', size: 30, color: C.sun });
      Art.moe(g, cx + 130, cy + 62, 110, 'happy', { t, bob: false });
    } else if (i === 3) {
      g.fillStyle = '#E0A878'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      for (let k = 0; k < 4; k++) { Art.round(g, cx - 74 + k * 38, cy - 62 + (k === 0 || k === 3 ? 16 : 0), 34, 76, 15); g.fill(); g.stroke(); }
      Art.round(g, cx - 78, cy - 6, 156, 76, 26); g.fill(); g.stroke();
      Art.arrow(g, cx - 78, cy + 82, cx + 78, cy + 82, { color: C.sun, w: 5, both: true });
    } else if (i === 4) {
      const P = g.createRadialGradient(cx - 18, cy - 20, 8, cx, cy, 60);
      P.addColorStop(0, '#CFF58A'); P.addColorStop(1, '#4E9A2E');
      g.fillStyle = P; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 58, 0, TAU); g.fill(); g.stroke();
      Art.face(g, cx, cy - 4, 52, 'happy', { t });
    } else if (i === 5) {
      const m = g.createLinearGradient(0, cy - 26, 0, cy + 26);
      m.addColorStop(0, '#F2C98A'); m.addColorStop(0.5, '#C98A3D'); m.addColorStop(1, '#8A5A22');
      g.fillStyle = m; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; Art.round(g, cx - 130, cy - 24, 260, 48, 10); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(60,30,8,.55)'; g.lineWidth = 2;
      for (let x = -120; x <= 120; x += 12) { g.beginPath(); g.moveTo(cx + x, cy - 22); g.lineTo(cx + x, cy + 22); g.stroke(); }
      Art.arrow(g, cx + 152, cy - 24, cx + 152, cy + 24, { color: C.sun, w: 4, both: true, head: 10 });
    } else if (i === 6) {
      g.fillStyle = '#7BE0A0'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; Art.round(g, cx - 110, cy - 40, 220, 80, 40); g.fill(); g.stroke();
      g.strokeStyle = '#7BE0A0'; g.lineWidth = 5; g.lineCap = 'round';
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b], k) => { g.beginPath(); g.moveTo(cx + a * 90, cy + b * 34); g.quadraticCurveTo(cx + a * (118 + Math.sin(t * 5 + k) * 8), cy + b * 62, cx + a * 142, cy + b * (50 + Math.cos(t * 5 + k) * 8)); g.stroke(); });
      Art.face(g, cx, cy - 2, 42, 'grin', { t });
    } else {
      for (let k = 0; k < 5; k++) Art.atom(g, cx - 120 + k * 60, cy + wander(k, t) * 2, 29, 'C', { label: false, face: k === 2 ? 'happy' : null, t });
      Art.arrow(g, cx - 150, cy + 50, cx + 150, cy + 50, { color: C.sun, w: 4, both: true });
      Art.text(g, 'about 1 nm', cx, cy + 80, { size: 25, color: C.sun });
    }
  }
  const laStage = Lab.stage('#c-ladder', {
    h: 470,
    label: 'A ladder with one rung for each prefix from mega down to nano. Moe stands on the chosen rung, and the panel shows its value and an everyday object of about that size.',
    onPointer(e) {
      if (e.type === 'hover') { laStage.canvas.style.cursor = e.x < 300 ? 'pointer' : 'default'; return; }
      if (e.type !== 'down' || e.x > 320) return;
      const i = clamp(Math.round((e.y - 44) / 55), 0, 7);
      pickRung(i, true);
    },
    draw(g, t, dt) {
      LA.y = dt > 0 ? lerp(LA.y, LA.i, clamp(dt * 8)) : LA.i;
      // Rails, then rungs.
      g.strokeStyle = '#8A6A48'; g.lineWidth = 10; g.lineCap = 'round';
      [46, 176].forEach((x) => { g.beginPath(); g.moveTo(x, 18); g.lineTo(x, 456); g.stroke(); });
      RUNGS.forEach((r, i) => {
        const y = rungY(i), on = i === LA.i;
        g.strokeStyle = on ? C.sun : '#B08A60'; g.lineWidth = on ? 10 : 8;
        g.beginPath(); g.moveTo(46, y); g.lineTo(176, y); g.stroke();
        Art.text(g, r.name, 194, y - 8, { size: 23, align: 'left', color: on ? C.sun : C.ink });
        Art.text(g, `10${Lab.sup(r.pow)}`, 194, y + 17, { size: 21, align: 'left', color: on ? C.sun : C.dim });
      });
      Art.moe(g, 111, rungY(0) + LA.y * 55 - 4, 62, 'happy', { t, bob: false });
      const r = RUNGS[LA.i];
      const since = t - LA.t0, q = ease.back(clamp(since * 3.2));
      g.save(); g.translate(556, 42); g.scale(q, q);
      Art.text(g, r.name, 0, 0, { font: 'display', size: 50, color: C.sun });
      g.restore();
      Art.text(g, r.eq, 556, 96, { font: 'display', size: r.eq.length > 18 ? 30 : 36, alpha: clamp(since * 3) });
      Art.text(g, r.sym ? `The symbol is ${r.sym}, for 10${Lab.sup(r.pow)}` : 'The base unit, 10⁰', 556, 136, { size: 25, color: C.cyan, alpha: clamp(since * 3) });
      g.save(); g.globalAlpha *= clamp(since * 3);
      rungArt(g, LA.i, t, 556, 278);
      g.restore();
      Art.text(g, r.note, 556, 432, { font: 'display', size: 29, color: C.ink, alpha: clamp(since * 2.4 - 0.4) });
    },
  });
  const laSeg = Lab.segmented('#la-pick', (v) => pickRung(+v, false));
  function pickRung(i, sync) {
    LA.i = i; LA.t0 = laStage.t;
    if (sync) laSeg.set(String(i), false);
    Lab.sound.pop();
    laStage.redraw();
  }

  /* ---------- Bench: scientific notation ---------- */
  const NUMS = [
    { d: '56000', pos: 5, lo: 0, hi: 5, sf: 2, plain: '56,000' },
    { d: '6022', pos: 4, lo: 0, hi: 4, sf: 4, plain: '6,022' },
    { d: '299792458', pos: 9, lo: 0, hi: 9, sf: 9, plain: '299,792,458' },
    { d: '000042', pos: 1, lo: 1, hi: 6, sf: 2, plain: '0.00042' },
    { d: '000000052', pos: 1, lo: 1, hi: 9, sf: 2, plain: '0.000000052' },
  ];
  const SC = { n: 0, idx: 5, shown: 5 };
  function mantissa(num, idx) {
    let left = num.d.slice(0, idx).replace(/^0+(?=\d)/, ''), right = num.d.slice(idx);
    if (!left) left = '0';
    // End zeros here are only place holders, so they are dropped from the front number.
    if (right && /[1-9]/.test(num.d)) {
      const lastNZ = num.d.search(/0*$/);
      right = right.slice(0, Math.max(0, lastNZ - idx));
    }
    return left + (right ? '.' + right : '');
  }
  const scStage = Lab.stage('#c-sci', {
    label: 'A row of digit tiles with a pink decimal point that hops between them, and the number written in scientific notation below.',
    draw(g, t, dt) {
      const num = NUMS[SC.n], D = num.d, n = D.length;
      SC.shown = dt > 0 ? lerp(SC.shown, SC.idx, clamp(dt * 10)) : SC.idx;
      const w = Math.min(70, 690 / n), h = 92, gap = 8, total = n * w + (n - 1) * gap, x0 = 400 - total / 2, y = 96;
      const xAt = (i) => x0 + i * (w + gap) - gap / 2;
      for (let i = 0; i < n; i++) tile(g, x0 + i * (w + gap), y, w, h, D[i], { size: 54, fill: D[i] === '0' && (i < 1 || i >= D.search(/0*$/)) ? '#3A2B5E' : '#5B3EA0' });
      /* The hops from where the point started. */
      const from = num.pos, moved = from - SC.idx;
      if (moved !== 0) {
        const dir = Math.sign(SC.idx - from);
        for (let i = from; i !== SC.idx; i += dir) Art.arrow(g, xAt(i), y - 8, xAt(i + dir), y - 8, { color: C.pink, w: 4, curve: -30 * Math.sign(dir || 1), head: 10 });
      }
      /* The point itself, with a little hop. */
      const px = xAt(SC.shown), hop = Math.abs(Math.sin((SC.shown - Math.floor(SC.shown)) * Math.PI)) * 22;
      Art.glow(g, px, y + h + 10 - hop, 24, C.pink, 0.75);
      g.fillStyle = C.pink; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      g.beginPath(); g.arc(px, y + h + 10 - hop, 11, 0, TAU); g.fill(); g.stroke();
      const exp = from - SC.idx, mant = mantissa(num, SC.idx), a = parseFloat(mant);
      const proper = a >= 1 && a < 10;
      Art.text(g, moved === 0 ? 'Original position of the point' : `Moved ${Math.abs(moved)} ${Math.abs(moved) === 1 ? 'place' : 'places'} ${moved > 0 ? 'left' : 'right'}`, 400, 36, { size: 26, color: C.ink });
      /* The written form. */
      const expStr = `10${Lab.sup(exp)}`;
      g.fillStyle = proper ? Art.alpha(C.leaf, 0.2) : 'rgba(255,255,255,.06)';
      g.strokeStyle = proper ? C.leaf : 'rgba(255,255,255,.2)'; g.lineWidth = 4;
      Art.round(g, 108, 236, 584, 92, 22); g.fill(); g.stroke();
      Art.text(g, `${mant} × ${expStr}`, 400, 282, { font: 'display', size: mant.length > 7 ? 40 : 50, color: proper ? C.leaf : C.ink });
      Art.text(g, `= ${num.plain}`, 400, 356, { size: 28, color: C.dim });
      if (proper) {
        Art.text(g, 'Proper scientific notation', 400, 404, { font: 'display', size: 32, color: C.leaf });
      } else {
        Art.text(g, a >= 10 ? 'Still correct, but the front number is 10 or more' : 'Still correct, but the front number is below 1', 400, 404, { size: 25, color: C.sun });
      }
      void t;
    },
  });
  const scSlider = Lab.$('#sc-s');
  function paintSci() {
    const num = NUMS[SC.n];
    const exp = num.pos - SC.idx;
    Lab.$('#sc-s-out').textContent = `exponent ${String(exp).replace('-', '−')}`;
    Lab.paintRange(scSlider);
    scStage.redraw();
  }
  Lab.segmented('#sc-num', (v) => {
    SC.n = +v;
    const num = NUMS[SC.n];
    scSlider.min = num.lo; scSlider.max = num.hi; scSlider.value = num.pos;
    SC.idx = num.pos; SC.shown = num.pos;
    paintSci();
  });
  scSlider.addEventListener('input', () => { SC.idx = +scSlider.value; Lab.sound.pop(); paintSci(); });
  paintSci();

  /* ---------- Bench: dartboard ---------- */
  const BX = 262, BY = 225, BR = 200;
  const DA = { bias: 0, wob: 10, darts: [], queue: 0, nextAt: 0, ang: -0.7 };
  const gauss = () => { const u = Math.max(1e-6, Math.random()), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  function throwDart(now) {
    const x = BX + Math.cos(DA.ang) * DA.bias + gauss() * DA.wob, y = BY + Math.sin(DA.ang) * DA.bias + gauss() * DA.wob;
    const a = Math.atan2(y - BY, x - BX), d = Math.min(BR - 4, Math.hypot(x - BX, y - BY));
    DA.darts.push({ x: BX + Math.cos(a) * d, y: BY + Math.sin(a) * d, t0: now });
    if (DA.darts.length > 40) DA.darts.shift();
    Lab.sound.pop();
  }
  function dart(g, x, y, p) {
    const k = 1 + (1 - p) * 2.4, dx = (1 - p) * 180, dy = (1 - p) * 120;
    g.save(); g.translate(x + dx, y + dy); g.scale(k, k);
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 4.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(13, 13); g.stroke();
    g.strokeStyle = '#E4DEF4'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(13, 13); g.stroke();
    g.fillStyle = C.sun; g.strokeStyle = '#1A0F2E'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(13, 13); g.lineTo(26, 13); g.lineTo(21, 18); g.lineTo(26, 26); g.lineTo(18, 21); g.lineTo(13, 26); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
  const daStage = Lab.stage('#c-dart', {
    label: 'A dartboard with thrown darts, a star marking their average position, and meters for accuracy and precision.',
    onPointer(e) {
      if (e.type === 'hover') { daStage.canvas.style.cursor = Math.hypot(e.x - BX, e.y - BY) < BR ? 'pointer' : 'default'; return; }
      if (e.type === 'down' && Math.hypot(e.x - BX, e.y - BY) < BR) throwDart(daStage.t);
    },
    draw(g, t) {
      if (DA.queue > 0 && t >= DA.nextAt) { throwDart(t); DA.queue--; DA.nextAt = t + 0.16; }
      /* Board. */
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(BX + 5, BY + 7, BR + 7, 0, TAU); g.fill();
      const rings = [[1, '#2B2340'], [0.84, '#F4EFE0'], [0.68, '#2B2340'], [0.52, '#F4EFE0'], [0.36, '#E0394E'], [0.2, C.sun], [0.08, '#E0394E']];
      rings.forEach(([k, c]) => { g.fillStyle = c; g.beginPath(); g.arc(BX, BY, BR * k, 0, TAU); g.fill(); });
      g.strokeStyle = '#1A0F2E'; g.lineWidth = 4; g.beginPath(); g.arc(BX, BY, BR, 0, TAU); g.stroke();
      /* Darts. */
      DA.darts.forEach((d) => dart(g, d.x, d.y, ease.out(clamp((t - d.t0) * 4.5))));
      const settled = DA.darts.filter((d) => t - d.t0 > 0.22), n = settled.length;
      let acc = 0, pre = 0, mx = 0, my = 0, off = 0, spread = 0;
      if (n >= 3) {
        settled.forEach((d) => { mx += d.x; my += d.y; }); mx /= n; my /= n;
        off = Math.hypot(mx - BX, my - BY);
        spread = Math.sqrt(settled.reduce((a, d) => a + (d.x - mx) ** 2 + (d.y - my) ** 2, 0) / n);
        acc = clamp(1 - off / 110); pre = clamp(1 - (spread - 6) / 80);
        g.setLineDash([9, 8]); g.strokeStyle = C.cyan; g.lineWidth = 4;
        g.beginPath(); g.arc(mx, my, Math.max(14, spread * 1.3), 0, TAU); g.stroke(); g.setLineDash([]);
        if (off > 12) Art.arrow(g, BX, BY, mx, my, { color: C.pink, w: 5, head: 14 });
        g.fillStyle = '#fff'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
        Art.star(g, mx, my, 13, t * 0.6); g.fill(); g.stroke();
      }
      /* Readouts. */
      const x = 490;
      Art.text(g, 'Accuracy', x, 44, { font: 'display', size: 32, align: 'left', color: C.pink });
      Art.text(g, 'Is the average on target?', x, 78, { size: 21, align: 'left', color: C.dim });
      Art.meter(g, x, 98, 290, 24, acc, { color: C.pink });
      Art.text(g, 'Precision', x, 164, { font: 'display', size: 32, align: 'left', color: C.cyan });
      Art.text(g, 'Are the darts close together?', x, 198, { size: 21, align: 'left', color: C.dim });
      Art.meter(g, x, 218, 290, 24, pre, { color: C.cyan });
      let v1 = 'Throw at least', v2 = 'three darts', col = C.dim;
      if (n >= 3) {
        const A = off < 30, P = spread < 34;
        v1 = A ? 'Accurate' : 'Not accurate'; v2 = P ? 'and precise' : 'and not precise';
        if (A && !P) v2 = 'but not precise'; if (!A && P) v2 = 'but precise';
        col = A && P ? C.leaf : A || P ? C.sun : C.red;
      }
      Art.text(g, v1, x, 298, { font: 'display', size: 40, align: 'left', color: col });
      Art.text(g, v2, x, 344, { font: 'display', size: 40, align: 'left', color: col });
      Art.text(g, n === 1 ? '1 dart' : `${n} darts`, x, 402, { size: 25, align: 'left', color: C.dim });
    },
  });
  const PRE = { ap: [0, 10, -0.7], p: [96, 12, -0.7], a: [0, 56, 0.4], n: [86, 58, 2.3] };
  const presetDart = (v) => {
    const [b, w, ang] = PRE[v];
    DA.bias = b; DA.wob = w; DA.ang = ang; DA.darts = [];
    Lab.$('#da-bias').value = b; Lab.$('#da-wob').value = w;
    paintDart();
    if (Lab.reducedMotion) { for (let i = 0; i < 7; i++) { throwDart(-1); } daStage.redraw(); return; }
    DA.queue = 7; DA.nextAt = daStage.t + 0.1;
  };
  function paintDart() {
    ['#da-bias', '#da-wob'].forEach((s) => Lab.paintRange(Lab.$(s)));
    Lab.$('#da-bias-out').textContent = DA.bias === 0 ? 'nothing' : DA.bias < 50 ? 'a little' : 'a lot';
    Lab.$('#da-wob-out').textContent = DA.wob < 18 ? 'steady' : DA.wob < 40 ? 'shaky' : 'very shaky';
    daStage.redraw();
  }
  Lab.segmented('#da-preset', presetDart);
  Lab.$('#da-bias').addEventListener('input', (e) => { DA.bias = +e.target.value; paintDart(); });
  Lab.$('#da-wob').addEventListener('input', (e) => { DA.wob = +e.target.value; paintDart(); });
  Lab.$('#da-one').addEventListener('click', () => { throwDart(daStage.t); daStage.redraw(); });
  Lab.$('#da-five').addEventListener('click', () => { if (Lab.reducedMotion) { for (let i = 0; i < 5; i++) throwDart(-1); daStage.redraw(); return; } DA.queue += 5; DA.nextAt = daStage.t; });
  Lab.$('#da-clear').addEventListener('click', () => { DA.darts = []; DA.queue = 0; daStage.redraw(); });
  paintDart();
  // Fire the opening cluster the first time the board scrolls into view.
  new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { ob.disconnect(); presetDart('ap'); } }, { threshold: 0.3 }).observe(daStage.canvas);

  /* ---------- A window onto a glass scale, shared by the story and the bench ---------- */
  const decimalsOf = (div) => (div >= 1 ? 0 : 1);
  function scaleWindow(g, box, vc, ppd, div, level, o = {}) {
    const { x, y, w, h } = box;
    const yOf = (v) => y + h / 2 - ((v - vc) / div) * ppd;
    const dip = o.dip === undefined ? 26 : o.dip;
    g.save();
    Art.round(g, x, y, w, h, 16); g.clip();
    const glass = g.createLinearGradient(x, 0, x + w, 0);
    glass.addColorStop(0, '#2C2158'); glass.addColorStop(0.5, '#3B2F6B'); glass.addColorStop(1, '#2C2158');
    g.fillStyle = glass; g.fillRect(x, y, w, h);
    const yl = yOf(level), cx = x + w / 2;
    /* Liquid under a true curved surface: it climbs the glass at the edges. */
    const liquid = new Path2D();
    liquid.moveTo(x, yl - dip);
    liquid.bezierCurveTo(x + w * 0.14, yl - dip * 0.15, x + w * 0.3, yl, cx, yl);
    liquid.bezierCurveTo(x + w * 0.7, yl, x + w * 0.86, yl - dip * 0.15, x + w, yl - dip);
    liquid.lineTo(x + w, y + h); liquid.lineTo(x, y + h); liquid.closePath();
    const lq = g.createLinearGradient(0, yl - dip, 0, y + h);
    lq.addColorStop(0, '#6FCBF4'); lq.addColorStop(1, '#1F6FB2');
    g.fillStyle = lq; g.fill(liquid);
    const edge = new Path2D();
    edge.moveTo(x, yl - dip);
    edge.bezierCurveTo(x + w * 0.14, yl - dip * 0.15, x + w * 0.3, yl, cx, yl);
    edge.bezierCurveTo(x + w * 0.7, yl, x + w * 0.86, yl - dip * 0.15, x + w, yl - dip);
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 4; g.stroke(edge);
    /* Marks. */
    const first = Math.floor((vc - (h / 2 / ppd) * div) / div), last = Math.ceil((vc + (h / 2 / ppd) * div) / div);
    for (let k = first; k <= last; k++) {
      const v = k * div, yy = yOf(v);
      g.strokeStyle = '#fff'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 92, yy); g.stroke();
      if (yy > y + 16 && yy < y + h - 16) Art.text(g, v.toFixed(decimalsOf(div)), x + 102, yy, { font: 'display', size: 28, align: 'left', color: '#fff', halo: true });
      if (o.tenths) {
        for (let m = 1; m < 10; m++) {
          const ym = yOf(v + (m * div) / 10);
          g.strokeStyle = `rgba(255,210,63,${0.8 * o.tenths})`; g.lineWidth = 2;
          g.beginPath(); g.moveTo(x, ym); g.lineTo(x + (m === 5 ? 54 : 38), ym); g.stroke();
        }
      }
    }
    g.restore();
    g.strokeStyle = C.cyan; g.lineWidth = 4; Art.round(g, x, y, w, h, 16); g.stroke();
    return { yOf, yl, cx };
  }

  /* ---------- Story: reading a scale ---------- */
  Lab.story('#story-read', {
    title: 'How to read glassware',
    scenes: [
      {
        say: 'Water climbs the sides of a glass tube, so its surface is curved. That curve is called the <b>meniscus</b>. Always read the <b>bottom</b> of the curve.',
        dur: 3.2,
        draw(g, p, t, { W, H }) {
          Art.bgLab(g, W, H);
          const q = seg(p, 0.05, 0.3);
          Art.cylinder(g, 120, H - 70, 64, 330, { level: 0.68 });
          const box = { x: 290, y: 30, w: 470, h: 300 };
          g.fillStyle = 'rgba(255,255,255,.08)';
          g.beginPath(); g.moveTo(152, 150); g.lineTo(box.x, box.y); g.lineTo(box.x, box.y + box.h); g.closePath(); g.fill();
          if (q > 0) { g.save(); g.globalAlpha = q; const s = scaleWindow(g, box, 36, 100, 1, 36.4); g.restore();
            const a = seg(p, 0.4, 0.62);
            if (a > 0) {
              Art.arrow(g, s.cx + 130, s.yl + 74, s.cx + 8, s.yl + 8, { color: C.leaf, w: 7, p: a });
              Art.text(g, 'Read here', s.cx + 136, s.yl + 94, { font: 'display', size: 32, color: C.leaf, alpha: a, halo: true });
            }
            const b = seg(p, 0.66, 0.86);
            if (b > 0) {
              Art.arrow(g, box.x + box.w - 84, s.yl - 72, box.x + box.w - 14, s.yl - 32, { color: C.red, w: 6, p: b });
              Art.text(g, 'Not the edge', box.x + box.w - 96, s.yl - 90, { font: 'display', size: 28, color: '#FF8A94', alpha: b, halo: true });
            }
          }
          Art.text(g, 'The meniscus', 525, 356, { font: 'display', size: 32, color: C.sun, alpha: q, halo: true });
          void t;
        },
      },
      {
        say: 'Get your eye level with the liquid. Look from above and you read too high. Look from below and you read too low. This error is called <b>parallax</b>.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          Art.bgLab(g, W, H);
          const base = H - 70, cx = 230;
          Art.cylinder(g, cx, base, 88, 340, { level: 0.56 });
          const ly = base - 14 - (340 - 26) * 0.56;
          const eye = (x, y, col) => {
            g.fillStyle = '#fff'; g.strokeStyle = col; g.lineWidth = 4;
            g.beginPath(); g.moveTo(x - 34, y); g.quadraticCurveTo(x, y - 30, x + 34, y); g.quadraticCurveTo(x, y + 30, x - 34, y); g.closePath(); g.fill(); g.stroke();
            g.fillStyle = '#22123A'; g.beginPath(); g.arc(x - 8, y, 11, 0, TAU); g.fill();
          };
          const rows = [
            { y: 74, a: seg(p, 0.05, 0.25), col: C.red, text: 'Too high', sub: 'eye above' },
            { y: ly, a: seg(p, 0.6, 0.82), col: C.leaf, text: 'Just right', sub: 'eye level' },
            { y: 372, a: seg(p, 0.3, 0.5), col: C.red, text: 'Too low', sub: 'eye below' },
          ];
          rows.forEach((r) => {
            if (r.a <= 0) return;
            g.save(); g.globalAlpha *= r.a;
            g.setLineDash([12, 9]); g.strokeStyle = r.col; g.lineWidth = 4;
            g.beginPath(); g.moveTo(490, r.y); g.lineTo(cx, ly); g.stroke(); g.setLineDash([]);
            eye(530, r.y, r.col);
            Art.text(g, r.text, 590, r.y - 15, { font: 'display', size: 33, align: 'left', color: r.col === C.red ? '#FF8A94' : C.leaf });
            Art.text(g, r.sub, 590, r.y + 21, { size: 24, align: 'left', color: C.dim });
            g.restore();
          });
          void t;
        },
      },
      {
        say: 'These lines are 1 mL apart. The bottom of the curve is past 36 and below 37. So you are <b>certain</b> of the 3 and the 6.',
        dur: 3,
        draw(g, p, t) {
          const box = { x: 40, y: 30, w: 430, h: 390 };
          const s = scaleWindow(g, box, 36.5, 200, 1, 36.4, { dip: 34 });
          const a = seg(p, 0.15, 0.4), b = seg(p, 0.4, 0.65);
          Art.ring(g, box.x + 124, s.yOf(36), 46, { color: C.leaf, w: 5, p: a });
          Art.ring(g, box.x + 124, s.yOf(37), 46, { color: C.leaf, w: 5, p: b });
          const q = seg(p, 0.65, 0.9);
          Art.text(g, 'Between 36 and 37', 635, 120, { size: 30, alpha: q });
          tile(g, 548, 180, 80, 104, '3', { fill: '#1F9A5A', size: 70, alpha: q });
          tile(g, 638, 180, 80, 104, '6', { fill: '#1F9A5A', size: 70, alpha: q });
          Art.text(g, 'certain digits', 633, 322, { font: 'display', size: 32, color: C.leaf, alpha: q });
          void t;
        },
      },
      {
        say: 'Now imagine ten tiny lines between the marks and <b>estimate</b> one more digit. It looks like 36.4. Another person might say 36.3 or 36.5, and that is fine. Exactly one digit is a guess.',
        dur: 3.6,
        draw(g, p, t) {
          const box = { x: 40, y: 30, w: 430, h: 390 };
          const fine = seg(p, 0.08, 0.34);
          const s = scaleWindow(g, box, 36.5, 200, 1, 36.4, { dip: 34, tenths: fine });
          Art.ring(g, s.cx, s.yl, 34, { color: C.pink, w: 5, p: seg(p, 0.34, 0.5) });
          const q = seg(p, 0.5, 0.72);
          Art.text(g, 'Your reading', 620, 110, { size: 28, alpha: q });
          tile(g, 490, 160, 72, 100, '3', { fill: '#1F9A5A', size: 66, alpha: q });
          tile(g, 570, 160, 72, 100, '6', { fill: '#1F9A5A', size: 66, alpha: q });
          Art.text(g, '.', 658, 226, { font: 'display', size: 70, alpha: q });
          tile(g, 674, 160, 72, 100, '4', { fill: '#D9127F', size: 66, alpha: q, glow: C.pink });
          Art.text(g, 'certain', 566, 292, { size: 27, color: C.leaf, alpha: q });
          Art.text(g, 'estimated', 708, 292, { size: 27, color: C.pink, alpha: q });
          Art.text(g, '36.4 mL', 620, 362, { font: 'display', size: 46, color: C.sun, alpha: seg(p, 0.76, 0.94) });
          void t;
        },
      },
      {
        say: 'A finer scale earns you more digits. Same liquid, three tools: a beaker gives 36 mL, a graduated cylinder 36.4 mL, and a burette 36.42 mL. These digits are the <b>significant figures</b>.',
        dur: 3.8,
        draw(g, p, t) {
          const items = [[150, 10, 40, 40, '36 mL', 'lines every 10 mL', 2], [400, 1, 36.5, 100, '36.4 mL', 'lines every 1 mL', 3], [650, 0.1, 36.4, 100, '36.42 mL', 'lines every 0.1 mL', 4]];
          items.forEach(([x, div, vc, ppd, read, lab, sf], i) => {
            const q = seg(p, 0.06 + i * 0.27, 0.3 + i * 0.27);
            if (q <= 0) return;
            g.save(); g.globalAlpha *= q;
            scaleWindow(g, { x: x - 104, y: 24, w: 208, h: 240 }, vc, ppd, div, 36.42, { dip: 12 });
            g.restore();
            Art.text(g, lab, x, 288, { size: 23, color: C.dim, alpha: q });
            Art.text(g, read, x, 332, { font: 'display', size: 42, color: C.sun, alpha: q });
            Art.text(g, `${sf} sig figs`, x, 380, { font: 'display', size: 29, color: C.leaf, alpha: q });
          });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: meniscus reader ---------- */
  const ME = { div: 1, level: 36.4, vc: 36, s: 30, result: null, t0: 0, drag: false };
  const BOX_M = { x: 250, y: 22, w: 530, h: 406 }, PPD = 100;
  const meValue = () => ME.vc + ((ME.s - 20) / 10) * ME.div;
  const fmtReading = (v) => v.toFixed(ME.div === 10 ? 0 : ME.div === 1 ? 1 : 2);
  function newSample() {
    const div = ME.div;
    const base = div === 10 ? 20 + Math.floor(Math.random() * 7) * 10 : div === 1 ? 20 + Math.floor(Math.random() * 60) : 10 + Math.floor(Math.random() * 300) / 10;
    let frac = 1 + Math.floor(Math.random() * 9);
    ME.level = +(base + (frac / 10) * div).toFixed(3);
    ME.vc = +(Math.round(ME.level / div) * div).toFixed(3);
    ME.s = 20 + (Math.random() < 0.5 ? -12 : 12);
    ME.result = null;
    Lab.$('#me-s').value = ME.s;
    Lab.$('#me-foot').innerHTML = '<p>Write down every digit the lines give you, then estimate exactly one more.</p>';
    paintMe();
  }
  const meStage = Lab.stage('#c-menisc', {
    drag: true,
    label: 'A whole graduated cylinder and a magnified view of its scale, with a red line you can drag to the bottom of the curved surface.',
    onPointer(e) {
      if (e.type === 'down' && e.x > BOX_M.x) ME.drag = true;
      if (e.type === 'up') ME.drag = false;
      if ((e.type === 'down' || e.type === 'move') && ME.drag) {
        const v = (BOX_M.y + BOX_M.h / 2 - e.y) / PPD;
        ME.s = clamp(Math.round(v * 10) + 20, 0, 40);
        Lab.$('#me-s').value = ME.s;
        ME.result = null;
        paintMe();
      }
    },
    bg: 'lab',
    draw(g, t, dt, st) {
      const H = st.H;
      const lvl = clamp(ME.div === 10 ? ME.level / 100 : ME.div === 1 ? ME.level / 100 : ME.level / 50);
      Art.cylinder(g, 120, H - 70, 68, 340, { level: lvl });
      const ly = H - 70 - 14 - (340 - 26) * lvl;
      g.fillStyle = 'rgba(255,255,255,.08)';
      g.beginPath(); g.moveTo(154, ly); g.lineTo(BOX_M.x, BOX_M.y); g.lineTo(BOX_M.x, BOX_M.y + BOX_M.h); g.closePath(); g.fill();
      const s = scaleWindow(g, BOX_M, ME.vc, PPD, ME.div, ME.level);
      /* The reading line. */
      const v = meValue(), y = s.yOf(v);
      const res = ME.result;
      const col = res === 'good' ? C.leaf : res ? C.red : '#FF5A6B';
      g.strokeStyle = col; g.lineWidth = 5;
      g.beginPath(); g.moveTo(BOX_M.x + 6, y); g.lineTo(BOX_M.x + BOX_M.w - 6, y); g.stroke();
      const str = fmtReading(v), cert = str.slice(0, -1), est = str.slice(-1);
      g.font = `400 40px ${Art.FONT_DISPLAY}`;
      const wc = g.measureText(cert).width, we = g.measureText(est).width;
      const px = BOX_M.x + BOX_M.w - 130, py = clamp(y, 64, 388);
      g.fillStyle = 'rgba(16,8,32,.9)'; Art.round(g, px - 62, py - 32, 182, 64, 18); g.fill();
      g.strokeStyle = col; g.lineWidth = 3; g.stroke();
      const tx = px + 28 - (wc + we + 44) / 2;
      Art.text(g, cert, tx, py + 1, { font: 'display', size: 40, align: 'left', color: C.leaf });
      Art.text(g, est, tx + wc, py + 1, { font: 'display', size: 40, align: 'left', color: C.pink });
      Art.text(g, 'mL', tx + wc + we + 8, py + 2, { size: 25, align: 'left', color: C.ink });
      if (res) {
        const since = t - ME.t0;
        if (res === 'good' && since < 1) Art.burst(g, s.cx, s.yl, since, { r: 120 });
        if (res !== 'good') {
          /* Show where the bottom of the curve really is. */
          g.setLineDash([10, 8]); g.strokeStyle = C.leaf; g.lineWidth = 4;
          g.beginPath(); g.moveTo(BOX_M.x + 6, s.yl); g.lineTo(BOX_M.x + BOX_M.w - 6, s.yl); g.stroke(); g.setLineDash([]);
        }
      }
      void dt;
    },
  });
  function paintMe() {
    Lab.$('#me-s-out').textContent = `${fmtReading(meValue())} mL`;
    Lab.paintRange(Lab.$('#me-s'));
    meStage.redraw();
  }
  Lab.$('#me-s').addEventListener('input', (e) => { ME.s = +e.target.value; ME.result = null; paintMe(); });
  Lab.segmented('#me-div', (v) => { ME.div = +v; newSample(); });
  Lab.$('#me-new').addEventListener('click', newSample);
  Lab.$('#me-check').addEventListener('click', () => {
    const v = meValue(), err = Math.abs(v - ME.level) / ME.div, edge = ME.level + (26 / PPD) * ME.div;
    ME.t0 = meStage.t;
    const foot = Lab.$('#me-foot');
    const str = fmtReading(v), sf = parseSF(str).count;
    if (err <= 0.2 + 1e-9) {
      ME.result = 'good'; Lab.sound.good();
      foot.innerHTML = `<p><b>Good reading.</b> ${str} mL has ${sf} sig figs: every digit from the lines plus one estimate. Anything close to ${fmtReading(ME.level)} is fair, since the last digit is an estimate.</p>`;
    } else if (Math.abs(v - edge) / ME.div <= 0.15) {
      ME.result = 'edge'; Lab.sound.bad();
      foot.innerHTML = `<p><b>You read the edge of the curve.</b> The liquid climbs the glass there. Read the bottom of the curve instead: about ${fmtReading(ME.level)} mL.</p>`;
    } else {
      ME.result = 'bad'; Lab.sound.bad();
      foot.innerHTML = `<p><b>Not quite.</b> The green dashed line marks the bottom of the curve: about ${fmtReading(ME.level)} mL.</p>`;
    }
    meStage.redraw();
  });
  newSample();

  /* ---------- Story: the sig fig rules ---------- */
  function ruleRow(g, str, y, p, t, o = {}) {
    const parsed = parseSF(str), chars = parsed.chars;
    const w = o.w || 88, h = o.h || 104, gapD = 10;
    const widths = chars.map((c) => (c.point ? 26 : w));
    const total = widths.reduce((a, b) => a + b + gapD, -gapD);
    let x = (o.cx || 400) - total / 2;
    const spots = [];
    chars.forEach((c, i) => {
      const reveal = seg(p, (o.from || 0.1) + i * 0.09, (o.from || 0.1) + 0.14 + i * 0.09);
      if (c.point) {
        Art.text(g, '.', x + 13, y + h * 0.72, { font: 'display', size: h * 0.7 });
      } else {
        const on = c.sig && reveal > 0.5;
        const off = !c.sig && reveal > 0.5;
        tile(g, x, y, w, h, c.ch, { size: h * 0.62, fill: on ? (RULE[c.rule].color === C.sun ? '#C99A10' : RULE[c.rule].color === C.cyan ? '#0E8FA8' : '#1F9A5A') : off ? '#2B2340' : '#4A3772', color: off ? '#8878A8' : '#fff', stroke: on ? '#fff' : '#1A0F2E', glow: on && !o.noGlow ? RULE[c.rule].color : null });
      }
      spots.push({ c, x: x + widths[i] / 2 });
      x += widths[i] + gapD;
    });
    return { spots, count: parsed.count };
  }
  function countBadge(g, n, x, y, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    Art.text(g, String(n), x, y, { font: 'display', size: 70, color: C.sun });
    Art.text(g, n === 1 ? 'sig fig' : 'sig figs', x, y + 52, { font: 'display', size: 28, color: C.sun });
    g.restore();
  }
  Lab.story('#story-rules', {
    title: 'Which digits count?',
    scenes: [
      {
        say: 'Rule one is easy. <b>Nonzero digits always count.</b> All three of these were measured, so 472 has 3 sig figs.',
        dur: 2.6,
        draw(g, p, t) {
          ruleRow(g, '472', 110, p, t);
          countBadge(g, 3, 400, 298, seg(p, 0.5, 0.7));
          Art.moe(g, 690, 430, 150, 'point', { t, flip: true });
        },
      },
      {
        say: 'Rule two. <b>Zeros trapped between other digits count.</b> Nobody would write that 0 unless it was measured. So 1005 has 4 sig figs.',
        dur: 2.8,
        draw(g, p, t) {
          const r = ruleRow(g, '1005', 110, p, t);
          const q = seg(p, 0.5, 0.7);
          Art.arrow(g, r.spots[1].x - 40, 252, r.spots[2].x + 40, 252, { color: C.cyan, w: 6, both: true, p: q });
          Art.text(g, 'trapped', 400, 282, { size: 27, color: C.cyan, alpha: q });
          countBadge(g, 4, 400, 342, seg(p, 0.65, 0.85));
        },
      },
      {
        say: 'Rule three. <b>Leading zeros never count.</b> They only show where the decimal point goes. Switch the unit and they vanish: 0.0052 km is just 5.2 m, so it has 2 sig figs.',
        dur: 3.4,
        draw(g, p, t) {
          ruleRow(g, '0.0052', 70, p, t, { w: 80, h: 96 });
          const q = seg(p, 0.6, 0.8);
          Art.text(g, '0.0052 km', 215, 228, { font: 'display', size: 38, alpha: q });
          Art.arrow(g, 318, 228, 462, 228, { color: C.pink, w: 7, p: q });
          Art.text(g, 'the same as', 390, 198, { size: 23, color: C.pink, alpha: q });
          Art.text(g, '5.2 m', 545, 228, { font: 'display', size: 44, color: C.leaf, alpha: q });
          Art.text(g, 'The zeros were only place holders', 400, 290, { size: 27, alpha: q });
          countBadge(g, 2, 400, 346, seg(p, 0.8, 0.96));
        },
      },
      {
        say: 'Rule four. <b>End zeros after a decimal point count.</b> Nobody needs them to hold a place, so someone must have measured them. 2.50 has 3 sig figs, and it says more than 2.5 does.',
        dur: 3.2,
        draw(g, p, t) {
          ruleRow(g, '2.50', 56, p, t, { cx: 240, w: 84, h: 100 });
          ruleRow(g, '2.5', 56, p, t, { cx: 615, w: 84, h: 100 });
          countBadge(g, 3, 240, 212, seg(p, 0.5, 0.7));
          countBadge(g, 2, 615, 212, seg(p, 0.5, 0.7));
          const q = seg(p, 0.7, 0.9);
          Art.text(g, 'Measured to the', 240, 318, { size: 27, alpha: q });
          Art.text(g, 'nearest 0.01', 240, 352, { size: 27, color: C.sun, alpha: q });
          Art.text(g, 'Measured to the', 615, 318, { size: 27, alpha: q });
          Art.text(g, 'nearest 0.1', 615, 352, { size: 27, color: C.sun, alpha: q });
        },
      },
      {
        say: 'Rule five. <b>End zeros with no decimal point do not count</b> by the usual rule. So 100 has 1 sig fig. A decimal point changes it: 100. has 3. Use scientific notation to be clear: $1.00 \\times 10^{2}$ has 3.',
        speak: 'Rule five. End zeros with no decimal point do not count by the usual rule. So 100 has 1 sig fig. A decimal point changes it: 100 with a point has 3. Use scientific notation to be clear: 1.00 times 10 squared has 3.',
        dur: 4,
        draw(g, p, t) {
          const rows = [['100', 1, 0.05], ['100.', 3, 0.35], ['1.00', 3, 0.62]];
          rows.forEach(([s, n, f], i) => {
            const y = 26 + i * 136;
            if (p < f) return;
            ruleRow(g, s, y, p, t, { cx: 290, w: 86, h: 104, from: f, noGlow: true });
            if (i === 2) Art.text(g, '× 10²', 464, y + 54, { font: 'display', size: 42, align: 'left' });
            countBadge(g, n, 660, y + 30, seg(p, f + 0.16, f + 0.28));
          });
        },
      },
      {
        say: 'One more. <b>Exact numbers</b> have unlimited sig figs. You counted them, or they are true by definition: 12 eggs in a carton, or 1 km = 1000 m. They never limit your answer.',
        dur: 3.2,
        draw(g, p, t) {
          const q = seg(p, 0.05, 0.3), b = seg(p, 0.4, 0.65);
          g.fillStyle = Art.alpha('#6B4A32', q); Art.round(g, 60, 110, 300, 166, 22); g.fill();
          for (let i = 0; i < 12; i++) {
            const e = ease.back(seg(p, 0.08 + i * 0.022, 0.18 + i * 0.022));
            if (e <= 0) continue;
            const x = 95 + (i % 6) * 46, y = 156 + (i > 5 ? 1 : 0) * 72;
            g.fillStyle = '#F6E7CC'; g.beginPath(); g.ellipse(x, y, 19 * e, 25 * e, 0, 0, TAU); g.fill();
          }
          Art.text(g, '12 eggs, counted', 210, 66, { font: 'display', size: 33, alpha: q });
          Art.text(g, 'Not 11.9', 210, 318, { size: 27, color: C.dim, alpha: q });
          Art.text(g, '1 km = 1000 m', 590, 66, { font: 'display', size: 36, alpha: b });
          Art.text(g, 'True by definition', 590, 118, { size: 27, color: C.dim, alpha: b });
          const c = seg(p, 0.7, 0.92);
          Art.text(g, 'Unlimited', 400, 374, { font: 'display', size: 50, color: C.sun, alpha: c });
          Art.text(g, 'sig figs', 400, 420, { font: 'display', size: 30, color: C.sun, alpha: c });
          Art.moe(g, 590, 340, 150, 'think', { t, bob: false });
        },
      },
    ],
  });

  /* ---------- Bench: tap to count ---------- */
  const SF_LIST = ['0.00520', '1005', '100', '100.', '30.0', '0.0030', '1.00e2', '5000', '5000.0', '2.50', '0.101', '60', '1.20e-3', '40.070'];
  const SF = { str: '0.00520', parsed: parseSF('0.00520'), tapped: new Set(), revealed: false, t0: 0, good: false };
  const sfLayout = () => {
    const chars = SF.parsed.chars, w = Math.min(84, 600 / chars.length), h = 112, gap = 8;
    const ws = chars.map((c) => (c.point ? 26 : w));
    const total = ws.reduce((a, b) => a + b + gap, -gap) + (SF.parsed.exp !== null ? 150 : 0);
    let x = 400 - total / 2;
    return chars.map((c, i) => { const o = { c, i, x, y: 62, w: ws[i], h }; x += ws[i] + gap; return o; });
  };
  const sfStage = Lab.stage('#c-sf', {
    label: 'A number shown as digit tiles. Tap the digits that are significant, then check to see each digit colored with the rule that applies.',
    onPointer(e) {
      if (e.type === 'hover') { sfStage.canvas.style.cursor = !SF.revealed && sfLayout().some((b) => !b.c.point && e.x >= b.x && e.x <= b.x + b.w && e.y >= b.y && e.y <= b.y + b.h) ? 'pointer' : 'default'; return; }
      if (e.type !== 'down' || SF.revealed) return;
      const hit = sfLayout().find((b) => !b.c.point && e.x >= b.x && e.x <= b.x + b.w && e.y >= b.y && e.y <= b.y + b.h);
      if (!hit) return;
      if (SF.tapped.has(hit.i)) SF.tapped.delete(hit.i); else SF.tapped.add(hit.i);
      Lab.sound.pop();
    },
    draw(g, t) {
      const boxes = sfLayout();
      Art.text(g, SF.revealed ? 'Here is what counts' : 'Tap every digit that counts', 400, 30, { size: 26, color: C.dim });
      const seen = [];
      boxes.forEach((b) => {
        if (b.c.point) { Art.text(g, '.', b.x + 13, b.y + b.h * 0.72, { font: 'display', size: 76 }); return; }
        const tapped = SF.tapped.has(b.i);
        if (SF.revealed) {
          const q = clamp((t - SF.t0) * 3 - b.i * 0.18);
          const R = RULE[b.c.rule];
          if (!seen.includes(b.c.rule)) seen.push(b.c.rule);
          const fill = b.c.sig ? (b.c.rule === 'nonzero' ? '#1F9A5A' : b.c.rule === 'between' ? '#0E8FA8' : '#C99A10') : '#2B2340';
          tile(g, b.x, b.y, b.w, b.h, b.c.ch, { size: 68, fill: q > 0.5 ? fill : '#4A3772', color: q > 0.5 && !b.c.sig ? '#8878A8' : '#fff', stroke: tapped !== b.c.sig && q > 0.5 ? C.red : '#1A0F2E', lw: tapped !== b.c.sig && q > 0.5 ? 6 : 3 });
          if (q > 0.5) { g.fillStyle = R.color; Art.round(g, b.x + 8, b.y + b.h + 8, b.w - 16, 8, 4); g.fill(); }
        } else {
          tile(g, b.x, b.y, b.w, b.h, b.c.ch, { size: 68, fill: tapped ? '#C99A10' : '#4A3772', stroke: tapped ? '#fff' : '#1A0F2E', glow: tapped ? C.sun : null });
        }
      });
      const last = boxes[boxes.length - 1];
      if (SF.parsed.exp !== null) Art.text(g, `× 10${Lab.sup(SF.parsed.exp)}`, last.x + last.w + 16, last.y + last.h / 2, { font: 'display', size: 44, align: 'left', color: C.dim });
      if (SF.revealed) {
        const a = clamp((t - SF.t0) * 2 - 0.6);
        seen.forEach((rule, i) => {
          const R = RULE[rule], y = 226 + i * 38;
          g.fillStyle = Art.alpha(R.color, a); Art.round(g, 92, y - 9, 34, 18, 9); g.fill();
          Art.text(g, R.text, 140, y, { size: 25, align: 'left', alpha: a });
        });
        Art.text(g, String(SF.parsed.count), 660, 330, { font: 'display', size: 84, color: SF.good ? C.leaf : C.sun, alpha: a });
        Art.text(g, SF.parsed.count === 1 ? 'sig fig' : 'sig figs', 660, 392, { font: 'display', size: 30, color: SF.good ? C.leaf : C.sun, alpha: a });
        if (SF.parsed.count === 0) Art.text(g, 'All zeros: no digit is pinned down', 92, 410, { size: 23, align: 'left', color: C.dim, alpha: a });
      } else {
        Art.moe(g, 690, 442, 140, 'think', { t, flip: true });
        Art.text(g, `Tapped so far: ${SF.tapped.size}`, 400, 240, { font: 'display', size: 34, color: C.sun });
      }
    },
  });
  function setSF(str) {
    const p = parseSF(str);
    if (!p) return false;
    SF.str = str; SF.parsed = p; SF.tapped = new Set(); SF.revealed = false; SF.good = false;
    Lab.$('#sf-foot').innerHTML = '<p>Start with the zeros. Ask of each one: was this measured, or is it only holding a place?</p>';
    sfStage.redraw();
    return true;
  }
  Lab.$('#sf-check').addEventListener('click', () => {
    if (SF.revealed) return;
    const want = new Set(SF.parsed.chars.map((c, i) => (c.sig ? i : -1)).filter((i) => i >= 0));
    SF.good = want.size === SF.tapped.size && [...want].every((i) => SF.tapped.has(i));
    SF.revealed = true; SF.t0 = sfStage.t;
    if (SF.good) { Lab.sound.good(); Lab.collection.award(1); } else Lab.sound.bad();
    Lab.$('#sf-foot').innerHTML = `<p><b>${SF.good ? 'Exactly right.' : 'Look at the red outlines.'}</b> ${SF.str} has ${SF.parsed.count} significant figure${SF.parsed.count === 1 ? '' : 's'}.</p>`;
    sfStage.redraw();
  });
  Lab.$('#sf-new').addEventListener('click', () => {
    let next = SF.str;
    while (next === SF.str) next = SF_LIST[Math.floor(Math.random() * SF_LIST.length)];
    Lab.$('#sf-own').value = '';
    setSF(next);
  });
  Lab.$('#sf-own').addEventListener('input', (e) => { if (e.target.value.trim()) setSF(e.target.value); });

  /* ---------- Bench: the operation animator ---------- */
  const OP = { kind: 'add', a: null, t0: 0 };
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const expForm = (x, sf) => {
    if (Math.abs(x) >= Math.pow(10, sf)) {
      const e = Math.floor(Math.log10(Math.abs(x)));
      return `${(x / Math.pow(10, e)).toFixed(sf - 1)} × 10${Lab.sup(e)}`;
    }
    const s = (x * (1 + 1e-12)).toPrecision(sf);
    return /0$/.test(s) && !s.includes('.') ? `${s}.` : s;
  };
  function newOp() {
    const kind = OP.kind;
    if (kind === 'add' || kind === 'sub') {
      const decs = [[2, 1, 3], [1, 2, 2], [3, 1, 2], [2, 3, 1], [1, 3, 2]][rint(0, 4)];
      const n = kind === 'add' ? 3 : 2;
      const vals = decs.slice(0, n).map((d) => (rint(1, 90) * Math.pow(10, d) + rint(1, Math.pow(10, d) - 1)) / Math.pow(10, d));
      if (kind === 'sub') vals.sort((x, y) => y - x);
      const nums = vals.map((v, i) => v.toFixed(decs[i]));
      const dk = Math.max(...decs.slice(0, n)), sc = Math.pow(10, dk);
      const total = nums.reduce((acc, s, i) => { const v = Math.round(parseFloat(s) * sc); return kind === 'add' || i === 0 ? acc + v : acc - v; }, 0) / sc;
      const keep = Math.min(...decs.slice(0, n));
      OP.a = { nums, raw: total.toFixed(dk), result: (total + 1e-9).toFixed(keep), keep, dk };
    } else {
      const mk = (sf) => { const v = rint(Math.pow(10, sf - 1) + 1, Math.pow(10, sf) - 1); return v.toString(); };
      const [sa, sb] = [[3, 2], [4, 2], [2, 3], [3, 4], [4, 3]][rint(0, 4)];
      const place = (s) => { const dot = /0$/.test(s) ? 1 : rint(1, Math.min(2, s.length)); return dot === s.length ? s : s.slice(0, dot) + '.' + s.slice(dot); };
      const A = place(mk(sa)), B = place(mk(sb));
      const r = kind === 'mul' ? parseFloat(A) * parseFloat(B) : parseFloat(A) / parseFloat(B);
      const keep = Math.min(sa, sb);
      OP.a = { A, B, sa, sb, keep, raw: parseFloat(r.toPrecision(7)).toString(), result: expForm(r, keep) };
    }
    OP.t0 = opStage ? opStage.t : 0;
    paintOp();
  }
  let opStage = null;
  function paintOp() {
    const a = OP.a;
    const foot = Lab.$('#op-foot');
    if (OP.kind === 'add' || OP.kind === 'sub') foot.innerHTML = `<p>${OP.kind === 'add' ? 'Adding' : 'Subtracting'} uses <b>decimal places</b>, the place of the last digit. The calculator says ${a.raw}, but nothing is certain past ${a.keep} decimal place${a.keep === 1 ? '' : 's'}, so the answer is <b>${a.result}</b>.</p>`;
    else foot.innerHTML = `<p>${OP.kind === 'mul' ? 'Multiplying' : 'Dividing'} uses <b>sig figs</b>. ${a.A} has ${a.sa} and ${a.B} has ${a.sb}. The fewest is ${a.keep}, so the calculator's ${a.raw} becomes <b>${a.result}</b>.</p>`;
    if (opStage) opStage.redraw();
  }
  newOp();
  opStage = Lab.stage('#c-ops', {
    h: 470,
    label: 'Two or three numbers set up as a calculation. The digits that limit the answer are highlighted, then the calculator result is cut down to the right number of digits.',
    draw(g, t) {
      const since = Lab.reducedMotion ? 99 : t - OP.t0, a = OP.a, st = (x, d = 0.5) => clamp((since - x) / d);
      const add = OP.kind === 'add' || OP.kind === 'sub';
      Art.text(g, add ? 'Fewest decimal places wins' : 'Fewest sig figs wins', 400, 34, { font: 'display', size: 36, color: add ? C.cyan : C.pink });
      if (add) {
        const size = 58, cw = 42, pointW = 22;
        const allLeft = Math.max(...a.nums.map((s) => s.indexOf('.')), a.raw.indexOf('.'));
        const allRight = Math.max(a.dk, 0);
        const widthTotal = (allLeft + allRight) * cw + pointW;
        const x0 = 330 - widthTotal / 2;
        const colX = (i) => (i < 0 ? x0 + (allLeft + i) * cw + cw / 2 : x0 + allLeft * cw + pointW + i * cw + cw / 2);
        const drawNum = (s, y, o = {}) => {
          const dot = s.indexOf('.');
          [...s].forEach((ch, i) => {
            if (ch === '.') { Art.text(g, '.', x0 + allLeft * cw + pointW / 2, y + 8, { font: 'display', size, color: o.color, alpha: o.alpha }); return; }
            const col = i < dot ? -(dot - i) : i - dot - 1;
            Art.text(g, ch, colX(col), y, { font: 'display', size, color: o.colorFor ? o.colorFor(col) : o.color, alpha: o.alpha });
          });
        };
        const yRow = (i) => 96 + i * 62;
        const lim = st(0.9), n = a.nums.length;
        /* The shaded zone past the cut line: no number there can be trusted. */
        const cutX = colX(a.keep - 1) + cw / 2;
        const shade = st(1.5);
        if (shade > 0) {
          g.fillStyle = Art.alpha(C.red, 0.16 * shade);
          Art.round(g, cutX, yRow(0) - 40, colX(a.dk - 1) + cw / 2 - cutX + 6, yRow(n) + 88 - yRow(0), 10); g.fill();
          g.setLineDash([9, 8]); g.strokeStyle = Art.alpha(C.red, shade); g.lineWidth = 4;
          g.beginPath(); g.moveTo(cutX, yRow(0) - 40); g.lineTo(cutX, yRow(n) + 48); g.stroke(); g.setLineDash([]);
        }
        a.nums.forEach((s, i) => {
          const dec = s.length - s.indexOf('.') - 1, isLimit = dec === a.keep;
          drawNum(s, yRow(i), { alpha: st(i * 0.25), colorFor: (col) => (lim > 0.5 && col === dec - 1 ? (isLimit ? C.sun : C.pink) : C.ink) });
          Art.text(g, `${dec} decimal place${dec === 1 ? '' : 's'}`, 560, yRow(i), { size: 25, align: 'left', color: isLimit ? C.sun : C.dim, alpha: lim });
        });
        if (OP.kind === 'add' || n === 2) Art.text(g, OP.kind === 'add' ? '+' : '−', x0 - 34, yRow(n - 1), { font: 'display', size: 50, alpha: st(0.5) });
        g.fillStyle = Art.alpha(C.ink, st(0.7)); g.fillRect(x0 - 20, yRow(n) - 32, widthTotal + 40, 4);
        const rawA = st(2);
        drawNum(a.raw, yRow(n), { alpha: rawA, colorFor: (col) => (col >= a.keep ? '#FF8A94' : C.ink) });
        Art.text(g, 'calculator', 560, yRow(n), { size: 25, align: 'left', color: C.dim, alpha: rawA });
        const res = st(2.8);
        if (res > 0) {
          const r = yRow(n) + 78;
          g.fillStyle = Art.alpha(C.leaf, 0.2 * res); Art.round(g, x0 - 20, r - 38, widthTotal + 40, 76, 16); g.fill();
          drawNum(a.result, r, { alpha: res, color: C.leaf });
          Art.text(g, 'your answer', 560, r, { font: 'display', size: 30, align: 'left', color: C.leaf, alpha: res });
        }
      } else {
        const show = (s, n, x, y, al) => {
          if (al <= 0) return;
          const w = 56, chars = [...s]; let total = 0;
          chars.forEach((c) => { total += c === '.' ? 20 : w; });
          let cx = x - total / 2, k = 0;
          chars.forEach((c) => {
            if (c === '.') { Art.text(g, '.', cx + 10, y + 26, { font: 'display', size: 54, alpha: al }); cx += 20; return; }
            k++;
            tile(g, cx + 3, y - 34, w - 6, 68, c, { size: 44, fill: since > 1.1 ? '#1F9A5A' : '#4A3772', alpha: al });
            cx += w;
          });
          Art.text(g, `${n} sig figs`, x, y + 62, { size: 27, color: n === OP.a.keep ? C.sun : C.dim, alpha: st(1.2) });
        };
        show(a.A, a.sa, 210, 124, st(0));
        Art.text(g, OP.kind === 'mul' ? '×' : '÷', 400, 124, { font: 'display', size: 60, alpha: st(0.4) });
        show(a.B, a.sb, 590, 124, st(0.4));
        const rawA = st(2);
        Art.text(g, 'calculator says', 400, 244, { size: 25, color: C.dim, alpha: rawA });
        const digits = a.raw;
        g.font = `400 52px ${Art.FONT_DISPLAY}`;
        const tw = g.measureText(digits).width;
        Art.text(g, digits, 400, 294, { font: 'display', size: 52, color: '#FF8A94', alpha: rawA });
        if (st(2.6) > 0) Art.strike(g, 400 - tw / 2 - 8, 296, 400 + tw / 2 + 8, 296, st(2.6), C.red, 6);
        const res = st(3.1);
        if (res > 0) {
          g.fillStyle = Art.alpha(C.leaf, 0.2 * res); Art.round(g, 210, 340, 380, 84, 18); g.fill();
          Art.text(g, a.result, 400, 382, { font: 'display', size: 56, color: C.leaf, alpha: res });
          Art.text(g, `keep ${a.keep} sig figs`, 400, 442, { size: 27, color: C.leaf, alpha: res });
        }
      }
    },
  });
  Lab.segmented('#op-kind', (v) => { OP.kind = v; newOp(); });
  Lab.$('#op-new').addEventListener('click', newOp);
  Lab.$('#op-replay').addEventListener('click', () => { OP.t0 = opStage.t; opStage.redraw(); });
});
