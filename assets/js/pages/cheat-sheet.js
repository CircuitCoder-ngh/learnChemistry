/* The cheat sheet: lesson links from the course map, jump links, and small VSEPR pictures. */
Lab.ready(function () {
  'use strict';
  const { $, $$ } = Lab;

  /* Every lesson link reads its number and title from the course map, so they stay right. */
  $$('a[data-lesson]').forEach((a) => {
    const l = Lab.lessonById(a.dataset.lesson);
    if (!l) { a.replaceWith(document.createTextNode(a.dataset.lesson)); return; }
    a.href = l.href;
    a.textContent = `${l.num} ${l.title}`;
  });

  /* Jump links. */
  $('#cs-jump').innerHTML = $$('.cs-card').map((c) => `<a href="#${c.id}">${c.dataset.title}</a>`).join('');
  $('#cs-print').addEventListener('click', () => window.print());

  /* ---------- VSEPR ---------- */
  const a = 0.866, h = 0.5;
  const TET = [[0, 1, 0], [0.943, -0.333, 0], [-0.471, -0.333, 0.816], [-0.471, -0.333, -0.816]];
  const EQ = [[1, 0, 0], [-h, 0, a], [-h, 0, -a]];
  const FAMILIES = [
    { groups: 2, geom: 'Linear', hybrid: 'sp', shapes: [
      { name: 'Linear', lone: 0, angle: '180°', ex: 'CO2', bonds: [[1, 0, 0], [-1, 0, 0]], lp: [] },
    ] },
    { groups: 3, geom: 'Trigonal planar', hybrid: 'sp²', shapes: [
      { name: 'Trigonal planar', lone: 0, angle: '120°', ex: 'BF3', bonds: [[0, 1, 0], [a, -h, 0], [-a, -h, 0]], lp: [] },
      { name: 'Bent', lone: 1, angle: 'a little under 120°', ex: 'SO2', bonds: [[a, -h, 0], [-a, -h, 0]], lp: [[0, 1, 0]] },
    ] },
    { groups: 4, geom: 'Tetrahedral', hybrid: 'sp³', shapes: [
      { name: 'Tetrahedral', lone: 0, angle: '109.5°', ex: 'CH4', bonds: TET, lp: [] },
      { name: 'Trigonal pyramidal', lone: 1, angle: 'about 107°', ex: 'NH3', bonds: TET.slice(1), lp: [TET[0]] },
      { name: 'Bent', lone: 2, angle: 'about 104.5°', ex: 'H2O', bonds: [[0.816, -0.577, 0], [-0.816, -0.577, 0]], lp: [[0, 0.577, 0.816], [0, 0.577, -0.816]] },
    ] },
    { groups: 5, geom: 'Trigonal bipyramidal', hybrid: 'sp³d', shapes: [
      { name: 'Trigonal bipyramidal', lone: 0, angle: '90° and 120°', ex: 'PCl5', bonds: [[0, 1, 0], [0, -1, 0], ...EQ], lp: [] },
      { name: 'Seesaw', lone: 1, angle: 'about 90° and about 120°', ex: 'SF4', bonds: [[0, 1, 0], [0, -1, 0], EQ[1], EQ[2]], lp: [EQ[0]] },
      { name: 'T-shaped', lone: 2, angle: 'about 90°', ex: 'ClF3', bonds: [[0, 1, 0], [0, -1, 0], EQ[0]], lp: [EQ[1], EQ[2]] },
      { name: 'Linear', lone: 3, angle: '180°', ex: 'XeF2', bonds: [[0, 1, 0], [0, -1, 0]], lp: EQ },
    ] },
    { groups: 6, geom: 'Octahedral', hybrid: 'sp³d²', shapes: [
      { name: 'Octahedral', lone: 0, angle: '90°', ex: 'SF6', bonds: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], lp: [] },
      { name: 'Square pyramidal', lone: 1, angle: 'about 90°', ex: 'BrF5', bonds: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1]], lp: [[0, -1, 0]] },
      { name: 'Square planar', lone: 2, angle: '90°', ex: 'XeF4', bonds: [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]], lp: [[0, 1, 0], [0, -1, 0]] },
    ] },
  ];
  /* Project a little 3D, drawing the far things first so nearer atoms sit on top. */
  const yaw = -0.5, pitch = 0.32;
  const project = ([x, y, z]) => {
    const x1 = x * Math.cos(yaw) + z * Math.sin(yaw), z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
    const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch), z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
    return { x: x1, y: -y2, z: z2 };
  };
  function shapeSVG(s) {
    const R = 21;
    const items = [];
    s.bonds.forEach((d) => { const p = project(d); items.push({ z: p.z, svg: () => `<line x1="0" y1="0" x2="${(p.x * R).toFixed(1)}" y2="${(p.y * R).toFixed(1)}" class="vs-bond"/><circle cx="${(p.x * R).toFixed(1)}" cy="${(p.y * R).toFixed(1)}" r="${(5.6 + p.z * 1.1).toFixed(1)}" class="vs-atom"/>` }); });
    s.lp.forEach((d) => {
      const p = project(d);
      const ang = (Math.atan2(p.y, p.x) * 180) / Math.PI;
      const len = Math.max(9, Math.hypot(p.x, p.y) * 20);
      items.push({ z: p.z, svg: () => `<g transform="rotate(${ang.toFixed(0)})"><path d="M2 0 C${(len * 0.45).toFixed(1)} -8 ${len.toFixed(1)} -7 ${len.toFixed(1)} 0 C${len.toFixed(1)} 7 ${(len * 0.45).toFixed(1)} 8 2 0Z" class="vs-lobe"/></g>` });
    });
    items.push({ z: 0.02, svg: () => '<circle cx="0" cy="0" r="7.5" class="vs-center"/>' });
    items.sort((p, q) => p.z - q.z);
    const lbl = `${s.name}: ${s.bonds.length} bonded atoms, ${s.lone} lone pair${s.lone === 1 ? '' : 's'}`;
    return `<svg viewBox="-30 -30 60 60" class="vs-svg" role="img" aria-label="${lbl}">${items.map((i) => i.svg()).join('')}</svg>`;
  }
  const body = $('[data-vsepr]');
  let html = '';
  FAMILIES.forEach((f) => {
    html += `<tr class="vs-family"><th colspan="4" scope="rowgroup">${f.groups} electron groups: ${f.geom.toLowerCase()} electron geometry, ${f.hybrid}</th></tr>`;
    f.shapes.forEach((s) => {
      html += `<tr><td class="vs-shape">${shapeSVG(s)}<span>${s.name}</span></td><td>${s.lone}</td><td>${s.angle}</td><td>$\\ce{${s.ex}}$</td></tr>`;
    });
  });
  body.innerHTML = html;

  /* Render math now so a comma right after a formula can be glued to it, and never start a line. */
  Lab.renderTex($('#sheet'));
  $$('#sheet .katex').forEach((k) => {
    const next = k.nextSibling;
    if (!next || next.nodeType !== 3) return;
    const m = /^[,.;:)]+/.exec(next.nodeValue);
    if (!m) return;
    const glue = document.createElement('span');
    glue.className = 'nowrap';
    k.replaceWith(glue);
    glue.append(k, m[0]);
    next.nodeValue = next.nodeValue.slice(m[0].length);
  });
});
