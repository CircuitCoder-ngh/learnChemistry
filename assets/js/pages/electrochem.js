/* Lesson 16: Batteries and electrochemistry. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const F = 96485;
  const TAU = Math.PI * 2;
  const DARK = '#1A0F2E';

  /* Standard reduction potentials in volts at 25 °C (same values as the bank and the table). */
  const CLEAR = 'rgba(150,200,245,.17)';
  const METALS = {
    Mg: { E: -2.37, n: 2, name: 'magnesium', metal: '#CDD2DC', sol: CLEAR },
    Al: { E: -1.66, n: 3, name: 'aluminum', metal: '#D8DBE3', sol: CLEAR },
    Zn: { E: -0.76, n: 2, name: 'zinc', metal: '#A9B2C8', sol: CLEAR },
    Fe: { E: -0.44, n: 2, name: 'iron', metal: '#8F909C', sol: 'rgba(170,225,150,.42)' },
    Ni: { E: -0.25, n: 2, name: 'nickel', metal: '#C7C5AC', sol: 'rgba(70,205,130,.62)' },
    Pb: { E: -0.13, n: 2, name: 'lead', metal: '#7D8294', sol: CLEAR },
    Cu: { E: 0.34, n: 2, name: 'copper', metal: '#DE8E4E', sol: 'rgba(40,130,245,.74)' },
    Ag: { E: 0.80, n: 1, name: 'silver', metal: '#E8EBF2', sol: CLEAR },
  };
  const ionF = (m) => (METALS[m].n === 1 ? `${m}^+` : `${m}^${METALS[m].n}+`);
  const chargeOf = (m) => (METALS[m].n === 1 ? '+' : METALS[m].n + '+');

  /* ---------- Paths: a polyline that can answer "where is fraction u along me?" ---------- */
  function polyline(pts) {
    const lens = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(d); L += d; }
    return {
      pts, L,
      at(u) {
        let d = clamp(u) * L, i = 0;
        while (i < lens.length - 1 && d > lens[i]) { d -= lens[i]; i++; }
        const a = pts[i], b = pts[i + 1], q = lens[i] ? d / lens[i] : 0;
        const tx = (b[0] - a[0]) / (lens[i] || 1), ty = (b[1] - a[1]) / (lens[i] || 1);
        return { x: lerp(a[0], b[0], q), y: lerp(a[1], b[1], q), nx: -ty, ny: tx };
      },
      trace(g) { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); },
    };
  }

  /* ---------- Fixed layout of the two-beaker cell ---------- */
  const G = { LB: 175, RB: 625, base: 388, bw: 290, bh: 188, surf: 228, EL: 112, ER: 688, elTop: 112, elBot: 352, elW: 54, wireY: 60 };
  /** Art.formula with a fade, since the library version has none. */
  function fm(g, f, x, y, o = {}) {
    const a = o.alpha === undefined ? 1 : o.alpha;
    if (a <= 0) return;
    const prev = g.globalAlpha; g.globalAlpha = prev * a;
    Art.formula(g, f, x, y, o);
    g.globalAlpha = prev;
  }
  const TUBE = (() => {
    const xl = 292, xr = 508, yb = 310, yt = 172, r = 30, pts = [[xl, yb], [xl, yt + r]];
    for (let i = 1; i <= 8; i++) { const a = Math.PI - (i / 8) * Math.PI / 2; pts.push([xl + r + Math.cos(a) * r, yt + r - Math.sin(a) * r]); }
    pts.push([xr - r, yt]);
    for (let i = 1; i <= 8; i++) { const a = Math.PI / 2 - (i / 8) * Math.PI / 2; pts.push([xr - r + Math.cos(a) * r, yt + r - Math.sin(a) * r]); }
    pts.push([xr, yb]);
    return polyline(pts);
  })();
  const WIRE = polyline([[G.EL, G.elTop], [G.EL, G.wireY], [G.ER, G.wireY], [G.ER, G.elTop]]);

  /* ---------- Local art ---------- */
  function electrode(g, x, top, bottom, w, color, sym, o = {}) {
    const erode = o.erode || 0, grow = o.grow || 0;
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, Art.mix(color, '#ffffff', 0.34)); gr.addColorStop(0.45, color); gr.addColorStop(1, Art.mix(color, '#000000', 0.26));
    g.fillStyle = gr; g.strokeStyle = DARK; g.lineWidth = 2.5;
    // The part under the surface wears away or fattens as the cell runs.
    const sub = w * (1 + grow * 0.5 - erode * 0.55);
    g.beginPath(); g.moveTo(x - w / 2 + 1, G.surf);
    const N = 9;
    for (let i = 1; i <= N; i++) { const y = lerp(G.surf, bottom, i / N); g.lineTo(x - sub / 2 - (i % 2 ? 1 : -1) * rand(i + 2) * (erode * 5 - grow * 5), y); }
    g.lineTo(x + sub / 2, bottom);
    for (let i = N - 1; i >= 1; i--) { const y = lerp(G.surf, bottom, i / N); g.lineTo(x + sub / 2 + (i % 2 ? 1 : -1) * rand(i + 9) * (erode * 5 - grow * 5), y); }
    g.lineTo(x + w / 2 - 1, G.surf); g.closePath();
    g.fillStyle = gr; g.fill(); g.stroke();
    // The dry top, drawn last so no seam shows at the waterline.
    g.beginPath(); g.moveTo(x - w / 2, G.surf + 3); g.lineTo(x - w / 2, top + 5); g.quadraticCurveTo(x - w / 2, top, x - w / 2 + 5, top);
    g.lineTo(x + w / 2 - 5, top); g.quadraticCurveTo(x + w / 2, top, x + w / 2, top + 5); g.lineTo(x + w / 2, G.surf + 3);
    g.fill(); g.stroke();
    if (sym) Art.text(g, sym, x, top + 42, { font: 'display', size: 32, color: Art.lum(color) > 0.55 ? '#22123A' : '#fff' });
  }
  function ionBall(g, x, y, m, o = {}) {
    Art.atom(g, x, y, o.r || 19, m, { charge: chargeOf(m), alpha: o.alpha, face: o.face, t: o.t, seed: o.seed });
  }
  function nitrate(g, x, y, a = 1, r = 9) {
    if (a <= 0) return;
    const prev = g.globalAlpha; g.globalAlpha = prev * a;
    Art.ball(g, x - r * 1.05, y + r * 0.62, r * 0.72, Art.elementColor('O'));
    Art.ball(g, x + r * 1.05, y + r * 0.62, r * 0.72, Art.elementColor('O'));
    Art.ball(g, x, y - r * 1.2, r * 0.72, Art.elementColor('O'));
    Art.ball(g, x, y, r * 0.86, Art.elementColor('N'));
    g.globalAlpha = prev;
    Art.text(g, '−', x + r * 1.5, y - r * 1.2, { size: 22, color: '#8FD3FF', alpha: a, halo: true });
  }
  function meter(g, x, y, text, o = {}) {
    const w = o.w || 186, h = o.h || 76;
    const b = g.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    b.addColorStop(0, '#E9E3F7'); b.addColorStop(1, '#A69FBE');
    g.fillStyle = b; g.strokeStyle = DARK; g.lineWidth = 3;
    Art.round(g, x - w / 2, y - h / 2, w, h, 14); g.fill(); g.stroke();
    g.fillStyle = '#0F2A1E'; Art.round(g, x - w / 2 + 11, y - h / 2 + 10, w - 22, h - 20, 8); g.fill();
    Art.text(g, text, x, y + 1, { font: 'display', size: 38, color: o.color || '#6CFFAF' });
  }
  function wireLine(g, poly, a = 1, color = '#F2B566') {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.lineJoin = 'round'; g.lineCap = 'round';
    poly.trace(g); g.strokeStyle = 'rgba(16,6,34,.8)'; g.lineWidth = 10; g.stroke();
    poly.trace(g); g.strokeStyle = color; g.lineWidth = 5.5; g.stroke();
    g.restore();
  }
  function wireElectrons(g, poly, t, o = {}) {
    const n = o.n || 12, rate = o.rate === undefined ? 0.1 : o.rate, dir = o.dir === undefined ? 1 : o.dir, a = o.alpha === undefined ? 1 : o.alpha;
    if (a <= 0) return;
    const prev = g.globalAlpha; g.globalAlpha = prev * a;
    for (let i = 0; i < n; i++) {
      const u = ((i + 0.5) / n + t * rate) % 1;
      const P = poly.at(dir > 0 ? u : 1 - u);
      Art.electron(g, P.x, P.y, o.r || 8);
    }
    g.globalAlpha = prev;
  }
  function saltBridge(g, a, t, o = {}) {
    if (a <= 0) return;
    const dir = o.dir === undefined ? 1 : o.dir; // 1: anode on the left, cations drift right.
    g.save(); g.globalAlpha *= a; g.lineJoin = 'round'; g.lineCap = 'butt';
    TUBE.trace(g); g.strokeStyle = 'rgba(18,7,40,.75)'; g.lineWidth = 52; g.stroke();
    TUBE.trace(g); g.strokeStyle = C.glass; g.lineWidth = 47; g.stroke();
    TUBE.trace(g); g.strokeStyle = '#4A3A7E'; g.lineWidth = 40; g.stroke();
    // Cotton plugs at each end let ions out but keep the gel in.
    g.fillStyle = '#EFE9D8';
    [[292, 310], [508, 310]].forEach(([x, y]) => { Art.round(g, x - 20, y - 8, 40, 16, 7); g.fill(); });
    const flow = o.flow === undefined ? 0.05 : o.flow;
    const n = 7;
    for (let i = 0; i < n; i++) {
      const u0 = ((i + 0.5) / n + t * flow) % 1;
      const P = TUBE.at(dir > 0 ? u0 : 1 - u0);
      Art.ball(g, P.x + P.nx * 9, P.y + P.ny * 9, 9.5, Art.elementColor('K'));
      Art.text(g, '+', P.x + P.nx * 9, P.y + P.ny * 9, { size: 17, color: '#fff' });
      const v0 = ((i + 0.05) / n + t * flow) % 1;
      const Q = TUBE.at(dir > 0 ? 1 - v0 : v0);
      Art.ball(g, Q.x - Q.nx * 9, Q.y - Q.ny * 9, 9.5, Art.elementColor('N'));
      Art.text(g, '−', Q.x - Q.nx * 9, Q.y - Q.ny * 9, { size: 17, color: '#fff' });
    }
    g.restore();
  }
  /** One half of the cell: a beaker of ions with an electrode standing in it. side -1 is left, 1 is right. */
  function halfCell(g, o) {
    const { sym, side, t, role, flow = 0, age = 0 } = o;
    const m = METALS[sym];
    const cx = side < 0 ? G.LB : G.RB, ex = side < 0 ? G.EL : G.ER;
    const inward = -side; // toward the bridge
    const prev = g.globalAlpha; g.globalAlpha = prev * (o.alpha === undefined ? 1 : o.alpha);
    let sol = m.sol;
    if (sym === 'Cu' && role === 'cat') sol = `rgba(40,130,245,${0.74 - age * 0.34})`;
    Art.beaker(g, cx, G.base, G.bw, G.bh, {
      ticks: false,
      inside(gg, box) {
        gg.fillStyle = sol; gg.fillRect(box.x0, G.surf, box.x1 - box.x0, box.bottom - G.surf);
        gg.fillStyle = 'rgba(255,255,255,.28)'; gg.fillRect(box.x0, G.surf, box.x1 - box.x0, 3.5);
      },
    });
    electrode(g, ex, G.elTop, G.elBot, G.elW, m.metal, sym, { erode: role === 'an' ? age : 0, grow: role === 'cat' ? age : 0 });
    // Metal ions leave the anode and arrive at the cathode.
    const K = o.ions === false ? 0 : 3, rate = flow * 0.17;
    for (let k = 0; k < K; k++) {
      const seed = k * 3 + (side < 0 ? 1 : 2);
      let ph = (k / K + t * rate + rand(seed) * 0.1) % 1;
      if (role === 'cat') ph = 1 - ph;
      if (flow <= 0) ph = 0.3 + k * 0.25;
      const y = G.surf + 36 + k * 46 + wander(seed, t * 0.6) * 4;
      const x = ex + inward * (G.elW / 2 + 24 + ph * 98);
      const fade = flow <= 0 ? 1 : clamp(ph * 8) * clamp((1 - ph) * 5 + 0.4);
      ionBall(g, x, y, sym, { alpha: fade });
    }
    g.globalAlpha = prev;
  }
  function polaritySign(g, x, y, s, a = 1) {
    if (a <= 0) return;
    const prev = g.globalAlpha; g.globalAlpha = prev * a;
    g.fillStyle = s === '+' ? '#FF3D7F' : '#1FA5FF'; g.strokeStyle = DARK; g.lineWidth = 2.5;
    g.beginPath(); g.arc(x, y, 17, 0, TAU); g.fill(); g.stroke();
    Art.text(g, s === '+' ? '+' : '−', x, y, { size: 28, color: '#fff' });
    g.globalAlpha = prev;
  }
  const anodeSideOf = (L, R) => (METALS[L].E < METALS[R].E ? -1 : 1);

  /** The whole Daniell-type cell. Every moving part is a pure function of t, so stories can use it too. */
  function drawCell(g, o) {
    const { L, R, t, flow = 1, wire = 1, bridge = 1, ageL = 0, ageR = 0, labels = true, E = null } = o;
    const same = L === R;
    const anS = same ? 0 : anodeSideOf(L, R);
    const roleL = same ? null : anS < 0 ? 'an' : 'cat', roleR = same ? null : anS > 0 ? 'an' : 'cat';
    const f = same ? 0 : flow;
    halfCell(g, { sym: L, side: -1, t, role: roleL, flow: f, age: ageL, alpha: o.alphaL, ions: o.ions });
    halfCell(g, { sym: R, side: 1, t, role: roleR, flow: f, age: ageR, alpha: o.alphaR, ions: o.ions });
    if (bridge > 0) saltBridge(g, bridge, t, { dir: anS >= 0 && anS !== 0 ? -1 : 1, flow: f * 0.05 });
    if (wire > 0) {
      wireLine(g, WIRE, wire);
      if (o.electrons !== false && !same) wireElectrons(g, WIRE, t, { rate: f * (0.05 + 0.03 * Math.min(3.2, Math.abs(E || 1.1))), dir: anS < 0 ? 1 : -1, alpha: wire });
    }
    if (o.meter !== false) meter(g, 400, G.wireY, E === null ? '— V' : E.toFixed(2) + ' V', { color: o.meterColor });
    if (labels && !same) {
      const xa = anS < 0 ? 216 : 584, xc = anS < 0 ? 584 : 216;
      Art.text(g, 'Anode', xa, 124, { font: 'display', size: 32, color: C.pink, halo: true });
      Art.text(g, 'oxidation', xa, 156, { size: 23, color: C.ink, halo: true });
      Art.text(g, 'Cathode', xc, 124, { font: 'display', size: 32, color: C.leaf, halo: true });
      Art.text(g, 'reduction', xc, 156, { size: 23, color: C.ink, halo: true });
      polaritySign(g, anS < 0 ? G.EL + 46 : G.ER - 46, 88, '−');
      polaritySign(g, anS < 0 ? G.ER - 46 : G.EL + 46, 88, '+');
    }
    if (o.bridgeLabels && !same) {
      // Cations head for the cathode, anions for the anode.
      const a = o.bridgeLabels, cs = anS < 0 ? 1 : -1;
      const colK = '#C9B0FF', colN = '#9CBDFF';
      Art.arrow(g, 400 + cs * 8, 130, 400 + cs * 104, 130, { color: colK, w: 5.5, head: 15, p: a });
      fm(g, 'K^+', 400 + cs * 52, 111, { size: 25, color: colK, halo: true, alpha: a });
      Art.arrow(g, 400 - cs * 8, 130, 400 - cs * 104, 130, { color: colN, w: 5.5, head: 15, p: a });
      fm(g, 'NO3^-', 400 - cs * 52, 111, { size: 25, color: colN, halo: true, alpha: a });
    }
  }
  function beakerName(g, m, x, y, o = {}) {
    fm(g, `${ionF(m)} (aq)`, x, y, { size: 28, color: C.ink, halo: true, alpha: o.alpha });
  }

  /* ---------- Particle views used by the story ---------- */
  function metalWall(g, sym, x, cy, R, side, skipRow, t) {
    // Rows of metal atoms along one side of the magnifier. side -1: wall on the left, 1: wall on the right.
    for (let col = 0; col < 2; col++) for (let row = -3; row <= 3; row++) {
      if (col === 0 && row === skipRow) continue;
      const ax = x + side * col * 56 + (row % 2 ? side * 14 : 0), ay = cy + row * 52;
      if (Math.hypot(ax - x, ay - cy) > R * 1.6) continue;
      Art.atom(g, ax + wander(row * 7 + col, t) * 1.6, ay + wander(row + col * 9, t) * 1.6, 27, sym, { label: col === 0 ? sym : false });
    }
  }
  function zoomAnode(g, cx, cy, R, q, t, sym = 'Zn') {
    metalWall(g, sym, cx - R * 0.42, cy, R, -1, 0, t);
    const leave = ease.inOut(seg(q, 0.05, 0.72));
    const ax = lerp(cx - R * 0.42, cx + R * 0.46, leave);
    // Two electrons stay in the metal and head for the wire.
    const up = ease.inOut(seg(q, 0.3, 1));
    [-1, 1].forEach((s, i) => {
      const ex = lerp(cx - R * 0.26 + s * 10, cx - R * 0.42 + s * 16, up);
      const ey = lerp(cy + s * 18, cy - R * 0.48 - i * 34, up);
      Art.electron(g, ex + (up > 0.98 ? wander(i, t) * 2 : 0), ey, 12);
    });
    fm(g, '2e^-', cx + R * 0.02, cy - R * 0.62, { size: 30, color: C.cyan, halo: true, alpha: seg(q, 0.7, 0.95) });
    Art.atom(g, ax, cy, 36, sym, { face: leave > 0.5 ? 'happy' : 'wow', look: [1, 0], t, charge: leave > 0.42 ? '2+' : null, seed: 3 });
    fm(g, 'Zn^2+', ax, cy + 62, { size: 30, color: C.ink, halo: true, alpha: seg(q, 0.7, 0.95) });
  }
  function zoomCathode(g, cx, cy, R, q, t, sym = 'Cu') {
    metalWall(g, sym, cx + R * 0.42, cy, R, 1, 0, t);
    const come = ease.inOut(seg(q, 0.05, 0.78));
    const ax = lerp(cx - R * 0.5, cx + R * 0.42, come);
    const dn = ease.inOut(seg(q, 0, 0.62));
    if (come < 0.97) {
      [-1, 1].forEach((s, i) => {
        const ex = lerp(cx + R * 0.42 + s * 14, cx + R * 0.14, dn);
        const ey = lerp(cy - R * 0.78 - i * 30, cy + s * 18, dn);
        Art.electron(g, ex, ey, 11);
      });
    }
    Art.atom(g, ax, cy, 36, sym, { face: come > 0.8 ? 'grin' : 'happy', look: [1, 0], t, charge: come < 0.86 ? '2+' : null, seed: 5 });
    // The next ion is already on its way.
    const nx = cx - R * 0.48 + wander(4, t * 0.7) * 6, ny = cy + R * 0.52 + wander(9, t * 0.7) * 5;
    Art.atom(g, nx, ny, 30, sym, { charge: '2+', alpha: seg(q, 0.6, 0.9) });
    fm(g, 'Cu^2+', nx, ny - 54, { size: 28, color: C.ink, halo: true, alpha: seg(q, 0.7, 0.95) });
  }

  /* ---------- Story 1: building the Daniell cell ---------- */
  Lab.story('#story-cell', {
    title: 'Make the electrons take the long way',
    bg: 'lab',
    scenes: [
      {
        say: 'Drop zinc into blue copper ions. Electrons jump straight across, and copper metal forms on the zinc. It works, but the energy only warms the beaker.',
        dur: 4,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.1, 0.8));
          Art.beaker(g, 180, 388, 270, 240, {
            ticks: false,
            inside(gg, box) {
              gg.fillStyle = `rgba(40,130,245,${0.74 - q * 0.2})`; gg.fillRect(box.x0, 200, box.x1 - box.x0, box.bottom - 200);
              gg.fillStyle = 'rgba(255,255,255,.28)'; gg.fillRect(box.x0, 200, box.x1 - box.x0, 3.5);
            },
          });
          const sg = g.createLinearGradient(150, 0, 210, 0);
          sg.addColorStop(0, '#CBD3E6'); sg.addColorStop(1, '#808AA6');
          g.fillStyle = sg; g.strokeStyle = DARK; g.lineWidth = 2.5;
          Art.round(g, 152, 100, 56, 262, 5); g.fill(); g.stroke();
          Art.text(g, 'Zn', 180, 136, { font: 'display', size: 34, color: '#22123A' });
          for (let i = 0; i < 26; i++) {
            const u = rand(i + 1), a = clamp(q * 2.2 - rand(i + 7));
            if (a <= 0) continue;
            const side = i % 2 ? -1 : 1;
            g.fillStyle = Art.mix('#E8904C', '#7A4420', rand(i + 3) * 0.6);
            g.beginPath(); g.arc(180 + side * (26 + rand(i + 5) * 6), lerp(214, 354, u), 3.5 + 5 * a * rand(i + 2), 0, TAU); g.fill();
          }
          // Heat rises off the beaker.
          const hot = seg(p, 0.45, 0.95);
          Art.smoke(g, 180, 150, t, { n: 7, h: 110, r: 11, color: '#FFB57A', alpha: 0.32 * hot, spread: 34 });
          Art.text(g, 'just heat', 330, 118, { size: 28, color: C.fire, alpha: hot, halo: true });
          // The particle view.
          Art.zoom(g, 208, 280, 565, 202, 172, (gg, cx, cy, R) => {
            for (let row = -3; row <= 3; row++) {
              const ax = cx - R * 0.72 + (row % 2 ? 16 : 0), ay = cy + row * 52;
              if (row !== 0) Art.atom(gg, ax, ay, 27, 'Zn', {});
            }
            const hop = ease.inOut(seg(p, 0.3, 0.8));
            Art.atom(gg, cx - R * 0.46, cy, 32, 'Zn', { face: 'wow', look: [1, 0], t, charge: hop > 0.5 ? '2+' : null, seed: 3 });
            Art.atom(gg, cx + R * 0.46, cy, 32, 'Cu', { face: hop > 0.9 ? 'grin' : 'happy', look: [-1, 0], t, charge: hop < 0.9 ? '2+' : null, seed: 4 });
            for (let k = 0; k < 2; k++) {
              const u = clamp(hop * 1.25 - k * 0.2);
              if (u <= 0 || u >= 1) continue;
              Art.electron(gg, lerp(cx - R * 0.2, cx + R * 0.2, u), cy - Math.sin(u * Math.PI) * 58 + (k ? 12 : -8), 10);
            }
          }, { p: seg(p, 0.06, 0.3) });
          Art.formula(g, 'Zn + Cu^2+ -> Zn^2+ + Cu', 565, 416, { size: 32, colorize: true, halo: true });
        },
      },
      {
        say: 'So keep them apart. Zinc goes in one beaker and copper in another. A <b>wire</b> joins the two metal strips, called <b>electrodes</b>.',
        dur: 3.4,
        draw(g, p, t) {
          const a = ease.out(seg(p, 0, 0.3)), w = seg(p, 0.35, 0.65), l = seg(p, 0.55, 0.85);
          g.save(); g.globalAlpha *= Math.max(0.02, a);
          halfCell(g, { sym: 'Zn', side: -1, t, flow: 0 });
          halfCell(g, { sym: 'Cu', side: 1, t, flow: 0 });
          g.restore();
          const poly = polyline(WIRE.pts);
          if (w > 0) {
            g.save(); g.lineJoin = 'round';
            const dash = poly.L * w;
            g.setLineDash([dash, poly.L]);
            poly.trace(g); g.strokeStyle = 'rgba(16,6,34,.8)'; g.lineWidth = 10; g.stroke();
            poly.trace(g); g.strokeStyle = '#F2B566'; g.lineWidth = 5.5; g.stroke();
            g.restore();
          }
          Art.pill(g, 'wire', 400, 60, { size: 26, color: C.sun, alpha: l });
          Art.text(g, 'zinc electrode', 262, 124, { size: 26, alpha: l, halo: true });
          Art.text(g, 'copper electrode', 538, 124, { size: 26, alpha: l, halo: true });
          beakerName(g, 'Zn', G.LB, 418, { alpha: a });
          beakerName(g, 'Cu', G.RB, 418, { alpha: a });
          Art.moe(g, 400, 378, 150, 'point', { t, flip: false });
        },
      },
      {
        say: 'At the zinc strip, each atom gives up 2 electrons and swims away as $\\ce{Zn^2+}$. Losing electrons is <b>oxidation</b>, and this electrode is the <b>anode</b>.',
        dur: 4,
        draw(g, p, t) {
          halfCell(g, { sym: 'Zn', side: -1, t, role: 'an', flow: 0.6 });
          wireLine(g, polyline([[G.EL, G.elTop], [G.EL, G.wireY], [420, G.wireY]]), 1);
          Art.ring(g, G.EL + 10, 290, 40, { color: C.pink, w: 5, p: seg(p, 0, 0.2) });
          Art.zoom(g, G.EL + 40, 280, 565, 205, 178, (gg, cx, cy, R) => zoomAnode(gg, cx, cy, R, seg(p, 0.18, 0.95), t), { p: seg(p, 0.05, 0.28), rim: C.pink });
          Art.text(g, 'Anode', 232, 156, { font: 'display', size: 36, color: C.pink, alpha: seg(p, 0.1, 0.3), halo: true });
          Art.formula(g, 'Zn -> Zn^2+ + 2e^-', 565, 418, { size: 34, colorize: true, halo: true });
          beakerName(g, 'Zn', G.LB, 418);
        },
      },
      {
        say: 'Those electrons cannot swim. They run through the <b>wire</b> toward the copper, and that flow is the current you wanted. The meter reads the push: <b>1.10 volts</b>.',
        dur: 3.6,
        draw(g, p, t) {
          const on = ease.inOut(seg(p, 0.1, 0.5));
          halfCell(g, { sym: 'Zn', side: -1, t, role: 'an', flow: 0.6, alpha: 0.55 });
          halfCell(g, { sym: 'Cu', side: 1, t, role: 'cat', flow: 0, alpha: 0.55 });
          wireLine(g, WIRE, 1);
          wireElectrons(g, WIRE, t, { rate: 0.09 * on, dir: 1, n: 14, r: 10, alpha: on });
          meter(g, 400, G.wireY, on < 0.98 ? (1.1 * on).toFixed(2) + ' V' : '1.10 V');
          const a = seg(p, 0.45, 0.7);
          Art.arrow(g, 190, 118, 330, 118, { color: C.cyan, w: 7, p: a });
          Art.arrow(g, 470, 118, 610, 118, { color: C.cyan, w: 7, p: a });
          fm(g, 'e^-', 400, 124, { size: 40, color: C.cyan, alpha: a, halo: true });
          Art.text(g, 'anode to cathode', 400, 168, { font: 'display', size: 32, color: C.cyan, alpha: a, halo: true });
          Art.moe(g, 400, 380, 130, 'wow', { t });
          beakerName(g, 'Zn', G.LB, 418); beakerName(g, 'Cu', G.RB, 418);
        },
      },
      {
        say: 'At the copper strip, $\\ce{Cu^2+}$ ions pick up those electrons and become copper atoms. Gaining electrons is <b>reduction</b>, and this electrode is the <b>cathode</b>.',
        dur: 4,
        draw(g, p, t) {
          halfCell(g, { sym: 'Cu', side: 1, t, role: 'cat', flow: 0.6, age: seg(p, 0.3, 1) * 0.5 });
          wireLine(g, polyline([[380, G.wireY], [G.ER, G.wireY], [G.ER, G.elTop]]), 1);
          Art.ring(g, G.ER - 10, 290, 40, { color: C.leaf, w: 5, p: seg(p, 0, 0.2) });
          Art.zoom(g, G.ER - 40, 280, 235, 205, 178, (gg, cx, cy, R) => zoomCathode(gg, cx, cy, R, seg(p, 0.18, 0.95), t), { p: seg(p, 0.05, 0.28), rim: C.leaf });
          Art.text(g, 'Cathode', 562, 156, { font: 'display', size: 36, color: C.leaf, alpha: seg(p, 0.1, 0.3), halo: true });
          Art.formula(g, 'Cu^2+ + 2e^- -> Cu', 235, 418, { size: 34, colorize: true, halo: true });
          beakerName(g, 'Cu', G.RB, 418);
        },
      },
      {
        say: 'One problem. Positive ions pile up on the zinc side, and negative charge builds on the copper side. Within a moment the flow <b>stops dead</b>.',
        dur: 3.6,
        draw(g, p, t) {
          const q = ease.out(seg(p, 0.05, 0.6)), stop = seg(p, 0.55, 0.75);
          const fl = 1 - stop;
          halfCell(g, { sym: 'Zn', side: -1, t, role: 'an', flow: 0, ions: false });
          halfCell(g, { sym: 'Cu', side: 1, t, role: 'cat', flow: 0, ions: false });
          wireLine(g, WIRE, 1);
          wireElectrons(g, WIRE, ease.out(seg(p, 0, 0.7)) * 1.4, { rate: 0.09, dir: 1, n: 14, r: 10, alpha: 1 });
          meter(g, 400, G.wireY, (1.1 * fl).toFixed(2) + ' V', { color: stop > 0.5 ? '#FF8A94' : undefined });
          // Charge piles up.
          for (let i = 0; i < 9; i++) {
            const a = clamp(q * 10 - i);
            if (a <= 0) continue;
            Art.text(g, '+', lerp(176, 290, (i % 3) / 2) + rand(i) * 10, 268 + Math.floor(i / 3) * 42, { size: 40, color: C.pink, alpha: a, halo: true });
            Art.text(g, '−', lerp(510, 624, (i % 3) / 2) + rand(i + 4) * 10, 268 + Math.floor(i / 3) * 42, { size: 44, color: '#8FD3FF', alpha: a, halo: true });
          }
          Art.text(g, 'too positive', 232, 158, { size: 28, color: C.pink, alpha: seg(p, 0.3, 0.5), halo: true });
          Art.text(g, 'too negative', 568, 158, { size: 28, color: '#8FD3FF', alpha: seg(p, 0.3, 0.5), halo: true });
          [[232, 60], [568, 60]].forEach(([x, y]) => {
            Art.strike(g, x - 26, y - 26, x + 26, y + 26, seg(p, 0.65, 0.8), C.red, 9);
            Art.strike(g, x + 26, y - 26, x - 26, y + 26, seg(p, 0.72, 0.87), C.red, 9);
          });
          Art.moe(g, 400, 382, 150, 'oops', { t });
          beakerName(g, 'Zn', G.LB, 418); beakerName(g, 'Cu', G.RB, 418);
        },
      },
      {
        say: 'A <b>salt bridge</b> fixes it. Negative ions flow toward the anode side, and positive ions flow toward the cathode side. The charges stay balanced, so the electrons keep going.',
        dur: 4,
        draw(g, p, t) {
          const b = ease.out(seg(p, 0, 0.3));
          const on = seg(p, 0.25, 0.5);
          drawCell(g, { L: 'Zn', R: 'Cu', t, flow: on, bridge: Math.max(0.01, b), E: 1.1 * on, labels: true, bridgeLabels: seg(p, 0.4, 0.62) });
          beakerName(g, 'Zn', G.LB, 418); beakerName(g, 'Cu', G.RB, 418);
        },
      },
      {
        say: 'Chemists write the whole cell on one line, with the anode on the left. One bar means a change of phase, and two bars mean the salt bridge. Remember <b>An Ox, Red Cat</b>.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          const a = ease.out(seg(p, 0, 0.3));
          const y = 96;
          const items = [['Zn(s)', 118, 'Zn'], ['Zn^2+(aq)', 268], ['Cu^2+(aq)', 520], ['Cu(s)', 676]];
          items.forEach(([f, x]) => fm(g, f, x, y, { size: 36, colorize: true, alpha: a }));
          const bar = (x, h = 44) => { g.fillStyle = Art.alpha(C.sun, a); g.fillRect(x - 3, y - h / 2, 6, h); };
          bar(180); bar(382); bar(404); bar(618);
          Art.text(g, 'phase', 180, 142, { size: 22, color: C.sun, alpha: seg(p, 0.25, 0.45) });
          Art.text(g, 'salt bridge', 393, 142, { size: 22, color: C.sun, alpha: seg(p, 0.25, 0.45) });
          Art.text(g, 'phase', 618, 142, { size: 22, color: C.sun, alpha: seg(p, 0.25, 0.45) });
          const q1 = ease.back(seg(p, 0.4, 0.62)), q2 = ease.back(seg(p, 0.55, 0.77));
          Art.popIn(g, 236, 262, q1, (gg) => {
            gg.fillStyle = '#D9127F'; Art.round(gg, -156, -64, 312, 128, 26); gg.fill();
            Art.text(gg, 'An Ox', 0, -22, { font: 'display', size: 52, color: '#fff' });
            Art.text(gg, 'anode: oxidation', 0, 32, { size: 26, color: '#fff' });
          });
          Art.popIn(g, 564, 262, q2, (gg) => {
            gg.fillStyle = '#128A52'; Art.round(gg, -156, -64, 312, 128, 26); gg.fill();
            Art.text(gg, 'Red Cat', 0, -22, { font: 'display', size: 52, color: '#fff' });
            Art.text(gg, 'reduction: cathode', 0, 32, { size: 26, color: '#fff' });
          });
          fm(g, 'Zn + Cu^2+ -> Zn^2+ + Cu', W / 2 - 60, 416, { size: 32, colorize: true, alpha: seg(p, 0.6, 0.8), halo: true });
          Art.text(g, '1.10 V', W / 2 + 225, 416, { font: 'display', size: 36, color: C.sun, alpha: seg(p, 0.7, 0.9), halo: true });
        },
      },
    ],
  });

  /* ---------- Bench: build any cell ---------- */
  const cell = { L: 'Zn', R: 'Cu', bridge: true, age: 0, burn: 0, bridgeA: 1, flowA: 1 };
  const cellE = () => (cell.L === cell.R ? 0 : Math.abs(METALS[cell.L].E - METALS[cell.R].E));
  const cellStage = Lab.stage('#c-cell', {
    bg: 'lab',
    label: 'Two beakers joined by a wire and a salt bridge. Electrons travel along the wire from anode to cathode while ions move through the bridge.',
    draw(g, t, dt) {
      const E = cellE();
      const k9 = Lab.reducedMotion ? 1 : clamp(dt * 9), k6 = Lab.reducedMotion ? 1 : clamp(dt * 6);
      cell.bridgeA = lerp(cell.bridgeA, cell.bridge ? 1 : 0, k9);
      cell.flowA = lerp(cell.flowA, cell.bridge && cell.L !== cell.R ? 1 : 0, k6);
      cell.age = clamp(cell.age + dt * cell.flowA * 0.012 * (0.5 + E));
      cell.burn += dt * cell.flowA;
      const same = cell.L === cell.R, anS = same ? 0 : anodeSideOf(cell.L, cell.R);
      const shown = cell.bridge ? E : 0;
      drawCell(g, {
        L: cell.L, R: cell.R, t: cell.burn, flow: cell.flowA, bridge: cell.bridgeA < 0.02 ? 0 : cell.bridgeA,
        E: shown, ageL: anS !== 0 ? cell.age : 0, ageR: anS !== 0 ? cell.age : 0,
        meterColor: cell.bridge ? undefined : '#FF8A94', bridgeLabels: cell.bridge ? 1 : 0, ions: cell.bridgeA > 0.5 || same,
      });
      beakerName(g, cell.L, G.LB, 418);
      beakerName(g, cell.R, G.RB, 418);
      if (same) {
        Art.bubble(g, 'Same metal, so no tug of war and no push.', 400, 120, { w: 340, side: 'up', size: 23, dy: 0 });
      } else if (!cell.bridge) {
        for (let i = 0; i < 6; i++) {
          const lx = lerp(180, 290, (i % 3) / 2), rx = lerp(510, 620, (i % 3) / 2), y = 272 + Math.floor(i / 3) * 52 + Math.sin(t * 3 + i) * 2;
          Art.text(g, anS < 0 ? '+' : '−', lx, y, { size: 38, color: anS < 0 ? C.pink : '#8FD3FF', halo: true });
          Art.text(g, anS < 0 ? '−' : '+', rx, y, { size: 38, color: anS < 0 ? '#8FD3FF' : C.pink, halo: true });
        }
        Art.pill(g, 'No bridge, so the flow stops', 400, 200, { size: 25, color: '#C8243A', text: '#fff' });
      }
    },
  });

  /* The potential ladder under the cell. */
  const LADDER = { x0: 46, x1: 756, lo: -2.6, hi: 1.0, y: 150 };
  const ladderX = (E) => lerp(LADDER.x0, LADDER.x1, (E - LADDER.lo) / (LADDER.hi - LADDER.lo));
  const RUNGS = [['Mg', -1], ['Al', -1], ['Zn', -1], ['Fe', 1], ['Ni', -1], ['Pb', 1], ['Cu', -1], ['Ag', -1]];
  const ladderStage = Lab.stage('#c-ladder', {
    h: 280,
    bg: (g, W, H) => { const b = g.createLinearGradient(0, 0, 0, H); b.addColorStop(0, '#231440'); b.addColorStop(1, '#1A0F2E'); g.fillStyle = b; g.fillRect(0, 0, W, H); },
    label: 'A number line of standard reduction potentials, from magnesium at minus 2.37 volts to silver at plus 0.80 volts, with the gap between the chosen metals marked.',
    draw(g) {
      const y = LADDER.y;
      const same = cell.L === cell.R;
      const an = same ? null : METALS[cell.L].E < METALS[cell.R].E ? cell.L : cell.R;
      const cat = same ? null : an === cell.L ? cell.R : cell.L;
      // Axis.
      g.strokeStyle = 'rgba(247,242,255,.45)'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(LADDER.x0 - 16, y); g.lineTo(LADDER.x1 + 16, y); g.stroke();
      // Zero mark: hydrogen is the reference.
      const zx = ladderX(0);
      g.strokeStyle = 'rgba(247,242,255,.7)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(zx, y - 12); g.lineTo(zx, y + 12); g.stroke();
      Art.text(g, '0 V', zx + 2, y + 32, { size: 21, color: C.dim });
      if (!same) {
        const xa = ladderX(METALS[an].E), xc = ladderX(METALS[cat].E);
        g.strokeStyle = C.sun; g.lineWidth = 11; g.lineCap = 'round';
        g.beginPath(); g.moveTo(xa, y); g.lineTo(xc, y); g.stroke();
      }
      RUNGS.forEach(([m, side]) => {
        const x = ladderX(METALS[m].E);
        const ay = y + side * 62;
        const chosen = m === cell.L || m === cell.R;
        const col = same ? C.sun : m === an ? C.pink : C.leaf;
        g.strokeStyle = chosen ? col : 'rgba(247,242,255,.3)'; g.lineWidth = chosen ? 4 : 2.5;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x, ay); g.stroke();
        Art.atom(g, x, ay, chosen ? 28 : 23, m, { alpha: chosen ? 1 : 0.55, glow: chosen ? 1 : 0 });
        Art.text(g, (METALS[m].E >= 0 ? '+' : '−') + Math.abs(METALS[m].E).toFixed(2), x, ay + side * 42, { size: 21, color: chosen ? col : C.dim });
      });
      Art.text(g, 'gives up electrons', 28, 22, { size: 23, color: C.pink, align: 'left' });
      Art.text(g, 'grabs electrons', 772, 22, { size: 23, color: C.leaf, align: 'right' });
      if (!same) {
        const E = cellE();
        Art.pill(g, `gap = ${E.toFixed(2)} V`, 180, 226, { size: 30, color: C.sun, font: 'display' });
      } else {
        Art.pill(g, 'gap = 0.00 V', 180, 226, { size: 30, color: C.sun, font: 'display' });
      }
    },
    animate: false,
  });

  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const texE = (v) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(2);
  const k = (n, s) => (n === 1 ? s : n + s);
  const ionCe = (m) => (METALS[m].n === 1 ? `${m}+` : `${m}^${METALS[m].n}+`);
  function paintCell() {
    const { L, R } = cell;
    const calc = Lab.$('#cell-calc');
    const Eo = Lab.$('#cell-E'), An = Lab.$('#cell-an'), Cat = Lab.$('#cell-cat');
    if (L === R) {
      Eo.textContent = '0.00 V'; An.textContent = 'None'; Cat.textContent = 'None';
      calc.innerHTML = Lab.texString(`<p>Both beakers hold <b>${METALS[L].name}</b>. Both sides pull on electrons equally hard, so nothing pushes them along. Pick two different metals.</p>`);
      return;
    }
    const an = METALS[L].E < METALS[R].E ? L : R, cat = an === L ? R : L;
    const A = METALS[an], Ca = METALS[cat];
    const E = Ca.E - A.E;
    const lcm = (A.n * Ca.n) / gcd(A.n, Ca.n);
    const ka = lcm / A.n, kc = lcm / Ca.n;
    Eo.textContent = (cell.bridge ? E : 0).toFixed(2) + ' V';
    An.textContent = an; Cat.textContent = cat;
    const sides = an === L ? 'left to right' : 'right to left';
    let html = '';
    if (!cell.bridge) {
      html += '<p><b>Pulled the bridge out.</b> The circuit is broken, so no ions can move, charge piles up, and current stops. Electrons in the wire cannot do this job alone. Put it back to read the voltage.</p>';
    }
    html += `<p><b>Anode</b> (oxidation): $\\ce{${an} -> ${ionCe(an)} + ${k(A.n, 'e-')}}$</p>`;
    html += `<p><b>Cathode</b> (reduction): $\\ce{${ionCe(cat)} + ${k(Ca.n, 'e-')} -> ${cat}}$</p>`;
    html += `<div class="calc-line">$E^\\circ_{\\text{cell}} = (${texE(Ca.E)}) - (${texE(A.E)}) = \\mathbf{${texE(E)}\\text{ V}}$</div>`;
    html += `<p><b>Overall</b> (${lcm} mol of electrons): $\\ce{${k(ka, an)} + ${k(kc, ionCe(cat))} -> ${k(ka, ionCe(an))} + ${k(kc, cat)}}$. Electrons run ${sides}.`;
    if (ka > 1 || kc > 1) html += ' The equation got multiplied to balance electrons, but the potentials did not. That is the rule.';
    html += '</p>';
    if (an === 'Al' || an === 'Mg' || cat === 'Al') html += `<p>Table values are ideal. Real ${an === 'Al' || cat === 'Al' ? 'aluminum hides under an oxide skin' : 'magnesium reacts slowly with water'}, so a real cell measures less. The meter shows standard conditions.</p>`;
    html += '<p>Only the ions doing the work are drawn. Spectator nitrate ions in the beakers are left out, and faster electrons here just stand for a bigger push.</p>';
    calc.innerHTML = Lab.texString(html);
  }
  const refreshCell = () => { cell.age = 0; paintCell(); ladderStage.redraw(); cellStage.redraw(); };
  Lab.segmented('#cell-left', (v) => { cell.L = v; refreshCell(); });
  Lab.segmented('#cell-right', (v) => { cell.R = v; refreshCell(); });
  Lab.segmented('#cell-bridge', (v) => { cell.bridge = v === 'in'; paintCell(); cellStage.redraw(); });
  paintCell();

  /* ---------- Story 2: electrolysis ---------- */
  function hill(g, x0, x1, y0, y1, color) {
    g.fillStyle = color;
    g.beginPath(); g.moveTo(x0, 380); g.lineTo(x0, y0);
    g.bezierCurveTo(lerp(x0, x1, 0.4), y0, lerp(x0, x1, 0.6), y1, x1, y1);
    g.lineTo(x1, 380); g.closePath(); g.fill();
  }
  const hillY = (x0, x1, y0, y1, u) => {
    // The bezier above, evaluated at u.
    const a = (1 - u) ** 3 * y0 + 3 * (1 - u) ** 2 * u * y0 + 3 * (1 - u) * u * u * y1 + u * u * u * y1;
    return { x: (1 - u) ** 3 * x0 + 3 * (1 - u) ** 2 * u * lerp(x0, x1, 0.4) + 3 * (1 - u) * u * u * lerp(x0, x1, 0.6) + u * u * u * x1, y: a };
  };
  function powerSupply(g, x, y, o = {}) {
    const w = o.w || 170, h = o.h || 78;
    const b = g.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    b.addColorStop(0, '#5D5780'); b.addColorStop(1, '#2F2A4D');
    g.fillStyle = b; g.strokeStyle = DARK; g.lineWidth = 3;
    Art.round(g, x - w / 2, y - h / 2, w, h, 12); g.fill(); g.stroke();
    Art.text(g, o.label || 'power', x, y, { font: 'display', size: 26, color: C.sun });
    polaritySign(g, x - w / 2 + 2, y, '+');
    polaritySign(g, x + w / 2 - 2, y, '−');
  }
  Lab.story('#story-electrolysis', {
    title: 'A battery in reverse',
    bg: 'lab',
    scenes: [
      {
        say: 'A battery is a ball rolling downhill: $E^\\circ_{\\text{cell}}$ is positive and it runs by itself. <b>Electrolysis</b> pushes the ball uphill: $E^\\circ_{\\text{cell}}$ is negative, so you must supply the energy.',
        dur: 4,
        draw(g, p, t) {
          // Left: downhill.
          hill(g, 0, 400, 150, 350, '#5F4A8F');
          const q = ease.in(seg(p, 0.05, 0.6));
          const a = hillY(0, 400, 150, 350, q * 0.8 + 0.06);
          Art.atom(g, a.x, a.y - 30, 30, 'Zn', { face: q > 0.9 ? 'grin' : 'wow', t, label: false, look: [1, 1] });
          Art.text(g, 'Battery', 214, 44, { font: 'display', size: 38, color: C.leaf });
          Art.text(g, 'E° positive, runs alone', 214, 86, { size: 25 });
          // Right: uphill with Moe pushing.
          hill(g, 400, 800, 350, 150, '#5F4A8F');
          const u = ease.inOut(seg(p, 0.2, 1)) * 0.5 + 0.34;
          const b = hillY(400, 800, 350, 150, u);
          Art.atom(g, b.x, b.y - 28, 28, 'Na', { face: 'grumpy', t, label: false, look: [-1, 0.4] });
          const m = hillY(400, 800, 350, 150, u - 0.17);
          Art.moe(g, m.x, m.y + 4, 92, 'happy', { t, bob: false });
          Art.text(g, 'Electrolysis', 560, 44, { font: 'display', size: 38, color: C.fire });
          Art.text(g, 'E° negative, needs a push', 560, 86, { size: 25 });
        },
      },
      {
        say: 'Melt table salt and put in two electrodes joined to a power supply. The <b>power supply</b> pulls electrons out of one electrode and forces them into the other.',
        dur: 3.4,
        draw(g, p, t) {
          drawMolten(g, p, t, { ions: 0.25, e: seg(p, 0.35, 0.7), labels: seg(p, 0.05, 0.3), rx: 0, ox: 0 });
        },
      },
      {
        say: 'Positive $\\ce{Na+}$ ions drift to the negative electrode and gain an electron. That is <b>reduction</b>, so this electrode is still the <b>cathode</b>. It makes sodium metal.',
        dur: 3.6,
        draw(g, p, t) {
          drawMolten(g, p, t, { ions: 1, e: 1, labels: 1, rx: seg(p, 0.1, 0.95), ox: 0 });
          fm(g, 'Na^+ + e^- -> Na', 590, 418, { size: 32, colorize: true, halo: true, alpha: seg(p, 0.2, 0.45) });
        },
      },
      {
        say: 'Negative $\\ce{Cl-}$ ions drift to the positive electrode and give up electrons. That is <b>oxidation</b>, so this electrode is still the <b>anode</b>. Chlorine gas bubbles off.',
        dur: 3.6,
        draw(g, p, t) {
          drawMolten(g, p, t, { ions: 1, e: 1, labels: 1, rx: 1, ox: seg(p, 0.1, 0.95) });
          fm(g, '2Cl^- -> Cl2 + 2e^-', 210, 418, { size: 32, colorize: true, halo: true, alpha: seg(p, 0.2, 0.45) });
        },
      },
      {
        say: 'Same jobs, opposite signs. Anode always means oxidation and cathode always means reduction. Only the plus and minus swap. Charging your phone is this same push, running its battery reaction backward.',
        dur: 3.4,
        draw(g, p) {
          const col = (x, title, tcol, rows, a) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            g.fillStyle = 'rgba(26,15,46,.86)'; Art.round(g, x - 186, 34, 372, 318, 22); g.fill();
            g.strokeStyle = tcol; g.lineWidth = 4; g.stroke();
            Art.text(g, title, x, 74, { font: 'display', size: 36, color: tcol });
            rows.forEach(([l, v, sign], i) => {
              const y = 130 + i * 62;
              Art.text(g, l, x - 164, y, { size: 26, align: 'left', color: C.dim });
              Art.text(g, v, x + (sign ? 112 : 164), y, { size: 26, align: 'right', color: C.ink });
              if (sign) polaritySign(g, x + 148, y, sign);
            });
            g.restore();
          };
          col(208, 'Battery', C.leaf, [['Anode', 'oxidation', '−'], ['Cathode', 'reduction', '+'], ['Energy', 'comes out'], ['E°cell', 'positive']], ease.out(seg(p, 0, 0.35)));
          col(592, 'Electrolysis', C.fire, [['Anode', 'oxidation', '+'], ['Cathode', 'reduction', '−'], ['Energy', 'goes in'], ['E°cell', 'negative']], ease.out(seg(p, 0.25, 0.6)));
          const q = seg(p, 0.6, 0.85);
          [[356, 130], [356, 192], [740, 130], [740, 192]].forEach(([x, y]) => Art.ring(g, x, y, 24, { color: C.sun, w: 4, p: q }));
          Art.text(g, 'Oxidation stays at the anode. Only the sign flips.', 400, 412, { size: 27, color: C.sun, alpha: q, halo: true });
        },
      },
      {
        say: 'How much metal forms? Count electrons. One mole of electrons carries <b>96,485 coulombs</b>, and charge is just current times time. Then the half-reaction tells you how many electrons each atom needs.',
        dur: 4.4,
        draw(g, p, t) {
          const steps = [
            ['Amps × seconds', 'coulombs', C.cyan], ['÷ 96,485', 'mol of electrons', C.cyan],
            ['÷ electrons per atom', 'mol of metal', C.sun], ['× molar mass', 'grams', C.pink],
          ];
          steps.forEach(([op, out, col], i) => {
            const y = 66 + i * 82, q = ease.back(seg(p, 0.05 + i * 0.2, 0.25 + i * 0.2));
            if (q <= 0) return;
            g.save(); g.translate(286, y); g.scale(q, q);
            g.fillStyle = 'rgba(26,15,46,.9)'; Art.round(g, -262, -32, 524, 64, 20); g.fill();
            g.strokeStyle = col; g.lineWidth = 3.5; g.stroke();
            Art.text(g, op, -240, 0, { size: 27, align: 'left', color: C.ink });
            Art.text(g, out, 240, 0, { font: 'display', size: 28, align: 'right', color: col });
            g.restore();
            if (i < 3) Art.arrow(g, 286, y + 34, 286, y + 48, { color: C.dim, w: 5, head: 11, alpha: q });
          });
          Art.moe(g, 680, 378, 170, 'think', { t, flip: true });
        },
      },
    ],
  });

  /** Electrolysis of molten NaCl, drawn for three scenes. */
  function drawMolten(g, p, t, o) {
    const cx = 400, base = 388, w = 560, h = 210, surf = 222;
    const anodeX = 210, cathX = 590;
    Art.glow(g, cx, 330, 330, '#FF8A2B', 0.2);
    Art.beaker(g, cx, base, w, h, {
      ticks: false,
      inside(gg, box) {
        const f = gg.createLinearGradient(0, surf, 0, base);
        f.addColorStop(0, 'rgba(255,190,110,.42)'); f.addColorStop(1, 'rgba(255,120,50,.56)');
        gg.fillStyle = f; gg.fillRect(box.x0, surf, box.x1 - box.x0, box.bottom - surf);
      },
    });
    // Electrodes.
    const rod = (x, col) => {
      const gr = g.createLinearGradient(x - 22, 0, x + 22, 0);
      gr.addColorStop(0, Art.mix(col, '#fff', 0.3)); gr.addColorStop(1, Art.mix(col, '#000', 0.3));
      g.fillStyle = gr; g.strokeStyle = DARK; g.lineWidth = 2.5;
      Art.round(g, x - 22, 118, 44, 232, 5); g.fill(); g.stroke();
    };
    rod(anodeX, '#7C8294'); rod(cathX, '#7C8294');
    const wL = polyline([[anodeX, 118], [anodeX, 52], [328, 52]]);
    const wR = polyline([[472, 52], [cathX, 52], [cathX, 118]]);
    wireLine(g, wL); wireLine(g, wR);
    const eOn = o.e;
    wireElectrons(g, wL, t, { n: 5, rate: 0.16, alpha: eOn, r: 8 });
    wireElectrons(g, wR, t, { n: 5, rate: 0.16, alpha: eOn, r: 8 });
    powerSupply(g, 400, 52);
    // Labels.
    const lab = o.labels;
    Art.text(g, 'Anode', 112, 128, { font: 'display', size: 32, color: C.pink, alpha: lab, halo: true });
    polaritySign(g, 112, 168, '+', lab);
    Art.text(g, 'Cathode', 690, 128, { font: 'display', size: 32, color: C.leaf, alpha: lab, halo: true });
    polaritySign(g, 690, 168, '−', lab);
    Art.text(g, 'molten NaCl', 400, 196, { size: 26, alpha: lab, halo: true });
    // Ions drift toward their electrodes.
    const n = 3, moving = o.ions >= 1;
    for (let i = 0; i < n; i++) {
      const u = moving ? (i / n + t * 0.11) % 1 : 0.15 + i * 0.3;
      const v = moving ? ((i + 0.5) / n + t * 0.11) % 1 : 0.1 + i * 0.3;
      const fadeNa = moving ? clamp(u * 6) * clamp((1 - u) * 6) : 1, fadeCl = moving ? clamp(v * 6) * clamp((1 - v) * 6) : 1;
      Art.atom(g, lerp(cathX - 190, cathX - 44, u), surf + 34 + i * 40 + wander(i, t * 0.6) * 3, 21, 'Na', { charge: '+', alpha: fadeNa });
      Art.atom(g, lerp(anodeX + 190, anodeX + 44, v), surf + 56 + i * 40 + wander(i + 5, t * 0.6) * 3, 25, 'Cl', { charge: '-', alpha: fadeCl });
    }
    // Products form with rx and ox.
    if (o.rx > 0) {
      const K = Math.ceil(o.rx * 6);
      for (let i = 0; i < K; i++) Art.atom(g, cathX + 40 + (i % 2) * 8, 332 - i * 22, 15, 'Na', { label: false, alpha: clamp(o.rx * 6 - i) });
      Art.text(g, 'Na metal', 738, 300, { size: 25, color: '#C79BFF', alpha: seg(o.rx, 0.2, 0.5), halo: true });
    }
    if (o.ox > 0) {
      g.save(); g.globalAlpha *= clamp(o.ox * 4);
      g.beginPath(); g.rect(anodeX - 90, 228, 74, 160); g.clip();
      Art.bubbles(g, anodeX - 80, anodeX - 28, 350, 232, t * 0.7, { n: 6, r: 8, color: 'rgba(120,235,160,.95)' });
      g.restore();
      fm(g, 'Cl2 gas', 60, 300, { size: 26, color: C.leaf, alpha: seg(o.ox, 0.2, 0.5), halo: true, font: 'body' });
    }
  }

  /* ---------- Bench: plate a spoon ---------- */
  const plate = { m: 'Cu', I: 2, min: 30, shown: null };
  const PLATE_MASS = () => { const s = plate.min * 60; return ((plate.I * s) / F / METALS[plate.m].n) * EL[plate.m].mass; };
  function spoon(g, x, top, frac, massG, coat, surf) {
    const steel = '#AEB6C8';
    const extra = 7 * Math.sqrt(clamp(frac));
    const path = () => {
      g.beginPath();
      g.moveTo(x - 8, top); g.lineTo(x + 8, top); g.lineTo(x + 8, top + 150);
      g.bezierCurveTo(x + 42, top + 165, x + 42, top + 244, x, top + 244);
      g.bezierCurveTo(x - 42, top + 244, x - 42, top + 165, x - 8, top + 150);
      g.closePath();
    };
    const paint = (col, wide) => {
      path(); g.lineJoin = 'round';
      g.strokeStyle = DARK; g.lineWidth = 5 + wide * 2; g.stroke();
      if (wide > 0.2) { path(); g.strokeStyle = col; g.lineWidth = wide * 2; g.stroke(); }
      const gr = g.createLinearGradient(x - 40, 0, x + 40, 0);
      gr.addColorStop(0, Art.mix(col, '#ffffff', 0.45)); gr.addColorStop(0.5, col); gr.addColorStop(1, Art.mix(col, '#000000', 0.25));
      path(); g.fillStyle = gr; g.fill();
    };
    paint(steel, 0);
    // Metal only plates where the spoon is under the solution.
    g.save(); g.beginPath(); g.rect(x - 70, surf, 140, 300); g.clip();
    paint(Art.mix(steel, coat, clamp(massG / 2.5)), extra);
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(x - 12, top + 195, 7, 24, 0.1, 0, TAU); g.fill();
  }
  const plateStage = Lab.stage('#c-plate', {
    bg: 'lab',
    label: 'A spoon hanging in a metal ion solution, wired to a power supply and a bar of metal. Metal ions travel to the spoon and coat it.',
    draw(g, t, dt) {
      const m = METALS[plate.m];
      const mass = PLATE_MASS();
      plate.shown = plate.shown === null || Lab.reducedMotion ? mass : lerp(plate.shown, mass, clamp(dt * 6));
      const frac = clamp(plate.shown / 40);
      const cx = 262, base = 388, w = 440, h = 200, surf = 216;
      const barX = 118, spX = 404;
      Art.beaker(g, cx, base, w, h, {
        ticks: false,
        inside(gg, box) {
          gg.fillStyle = m.sol; gg.fillRect(box.x0, surf, box.x1 - box.x0, box.bottom - surf);
          gg.fillStyle = 'rgba(255,255,255,.28)'; gg.fillRect(box.x0, surf, box.x1 - box.x0, 3.5);
        },
      });
      // The metal bar (anode) feeds ions in.
      const bg = g.createLinearGradient(barX - 26, 0, barX + 26, 0);
      bg.addColorStop(0, Art.mix(m.metal, '#ffffff', 0.34)); bg.addColorStop(0.5, m.metal); bg.addColorStop(1, Art.mix(m.metal, '#000000', 0.26));
      g.fillStyle = bg; g.strokeStyle = DARK; g.lineWidth = 2.5;
      Art.round(g, barX - 26, 110, 52, 244, 5); g.fill(); g.stroke();
      Art.text(g, plate.m, barX, 150, { font: 'display', size: 32, color: Art.lum(m.metal) > 0.55 ? '#22123A' : '#fff' });
      spoon(g, spX, 110, frac, plate.shown, m.metal, surf);
      // Ions travel across.
      const rate = 0.05 + plate.I * 0.022;
      for (let i = 0; i < 4; i++) {
        const ph = (i / 4 + t * rate) % 1;
        const x = lerp(barX + 44, spX - 42, ph), y = 256 + (i * 37) % 100 + wander(i, t * 0.7) * 4;
        Art.atom(g, x, y, 20, plate.m, { charge: chargeOf(plate.m), alpha: clamp(ph * 8) * clamp((1 - ph) * 6) });
      }
      // Wiring.
      const wL = polyline([[barX, 110], [barX, 56], [168, 56]]);
      const wR = polyline([[356, 56], [spX, 56], [spX, 110]]);
      wireLine(g, wL); wireLine(g, wR);
      wireElectrons(g, wL, t, { n: 3, rate: rate * 1.5, r: 7 });
      wireElectrons(g, wR, t, { n: 4, rate: rate * 1.5, r: 7 });
      powerSupply(g, 262, 56, { w: 188 });
      Art.text(g, 'Anode', barX + 70, 128, { font: 'display', size: 26, color: C.pink, halo: true });
      Art.text(g, 'Cathode', spX - 80, 128, { font: 'display', size: 26, color: C.leaf, halo: true });
      Art.formula(g, `${ionF(plate.m)} (aq)`, cx, 418, { size: 28, halo: true });
      // The electron count, right on the stage.
      const s = plate.min * 60, Q = plate.I * s, ne = Q / F, nm = ne / m.n;
      const rows = [
        ['Charge', Math.round(Q).toLocaleString('en-US') + ' C', C.cyan],
        ['Electrons', Lab.sig(ne, 3) + ' mol', C.cyan],
        [`${m.name[0].toUpperCase() + m.name.slice(1)} atoms`, Lab.sig(nm, 3) + ' mol', C.sun],
      ];
      const px = 660;
      rows.forEach(([l, v, col], i) => {
        const y = 42 + i * 88;
        Art.text(g, l, px, y, { size: 24, color: C.dim });
        Art.text(g, v, px, y + 34, { font: 'display', size: 34, color: col });
        if (i < 2) Art.arrow(g, px, y + 58, px, y + 70, { color: C.dim, w: 4, head: 10 });
      });
      g.fillStyle = 'rgba(26,15,46,.9)'; Art.round(g, px - 122, 300, 244, 104, 20); g.fill();
      g.strokeStyle = C.pink; g.lineWidth = 3.5; g.stroke();
      Art.text(g, 'Mass plated', px, 326, { size: 24, color: C.ink });
      Art.text(g, Lab.fmt(plate.shown, plate.shown < 10 ? 3 : 2) + ' g', px, 370, { font: 'display', size: 44, color: C.pink });
    },
  });
  function paintPlate() {
    const m = METALS[plate.m];
    const s = plate.min * 60, Q = plate.I * s, ne = Q / F, nm = ne / m.n, M = EL[plate.m].mass, g = nm * M;
    const sci = (x) => { const e = Math.floor(Math.log10(Math.abs(x))); return e >= -2 && e <= 4 ? Lab.sig(x, 3) : `${(x / Math.pow(10, e)).toFixed(2)} \\times 10^{${e}}`; };
    const ion = ionCe(plate.m);
    Lab.$('#plate-calc').innerHTML = Lab.texString(`
      <div class="calc-line">$$Q = It = (${plate.I.toFixed(1)}\\text{ A})(${plate.min} \\times 60\\text{ s}) = ${Math.round(Q)}\\text{ C}$$</div>
      <div class="calc-line">$$\\text{mol } e^- = \\frac{${Math.round(Q)}\\text{ C}}{96{,}485\\text{ C/mol}} = ${sci(ne)}\\text{ mol}$$</div>
      <p>Half-reaction: $\\ce{${ion} + ${m.n === 1 ? 'e-' : m.n + 'e-'} -> ${plate.m}}$, so each atom takes ${m.n} electron${m.n > 1 ? 's' : ''}.</p>
      <div class="calc-line">$\\frac{${sci(ne)}\\text{ mol } e^-}{${m.n}} = ${sci(nm)}\\text{ mol ${plate.m}}$</div>
      <div class="calc-line">$$${sci(nm)}\\text{ mol} \\times ${M.toFixed(2)}\\text{ g/mol} = \\mathbf{${Lab.sig(g, 3)}\\text{ g ${plate.m}}}$$</div>`);
  }
  Lab.segmented('#plate-metal', (v) => { plate.m = v; paintPlate(); plateStage.redraw(); });
  Lab.bind('#plate-i', '#plate-i-out', (v) => v.toFixed(1) + ' A', (v) => { plate.I = v; paintPlate(); plateStage.redraw(); });
  Lab.bind('#plate-t', '#plate-t-out', (v) => v + ' min', (v) => { plate.min = v; paintPlate(); plateStage.redraw(); });
});
