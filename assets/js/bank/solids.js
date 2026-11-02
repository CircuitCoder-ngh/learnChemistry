/* Question bank for 10.3 Solids and crystals. Cell edges in pm, from standard crystal data. */
(function () {
  'use strict';
  const NA = 6.022e23;
  const METALS = [
    { el: 'Na', type: 'body-centered', Z: 2, a: 429.1 },
    { el: 'Fe', type: 'body-centered', Z: 2, a: 286.6 },
    { el: 'Cr', type: 'body-centered', Z: 2, a: 288.5 },
    { el: 'W', type: 'body-centered', Z: 2, a: 316.5 },
    { el: 'Al', type: 'face-centered', Z: 4, a: 405.0 },
    { el: 'Cu', type: 'face-centered', Z: 4, a: 361.5 },
    { el: 'Ni', type: 'face-centered', Z: 4, a: 352.4 },
    { el: 'Ag', type: 'face-centered', Z: 4, a: 408.6 },
    { el: 'Au', type: 'face-centered', Z: 4, a: 407.8 },
    { el: 'Pb', type: 'face-centered', Z: 4, a: 495.0 },
    { el: 'Po', type: 'simple cubic', Z: 1, a: 335.9 },
  ];
  const zSum = { 1: '8 \\times \\tfrac18 = 1', 2: '8 \\times \\tfrac18 + 1 = 2', 4: '8 \\times \\tfrac18 + 6 \\times \\tfrac12 = 4' };
  const texSci = (x, d = 3) => {
    const e = Math.floor(Math.log10(Math.abs(x)));
    return `${(x / Math.pow(10, e)).toFixed(d)} \\times 10^{${e}}`;
  };
  const SOLIDS = [
    ['$\\ce{NaCl}$', 'ionic', 'A metal with a nonmetal.'], ['$\\ce{MgO}$', 'ionic', 'A metal with a nonmetal.'], ['$\\ce{KBr}$', 'ionic', 'A metal with a nonmetal.'], ['$\\ce{CaF2}$', 'ionic', 'A metal with a nonmetal.'], ['$\\ce{K2SO4}$', 'ionic', 'A metal cation with a polyatomic anion.'], ['$\\ce{NH4Cl}$', 'ionic', 'Ammonium is a polyatomic cation, so this is made of ions even with no metal.'],
    ['ice, $\\ce{H2O}$', 'molecular', 'Only nonmetals, in separate molecules.'], ['dry ice, $\\ce{CO2}$', 'molecular', 'Only nonmetals, in separate molecules.'], ['$\\ce{I2}$', 'molecular', 'A nonmetal in separate $\\ce{I2}$ molecules.'], ['sugar, $\\ce{C12H22O11}$', 'molecular', 'Only nonmetals, in separate molecules.'], ['$\\ce{S8}$', 'molecular', 'Sulfur forms separate rings of 8 atoms.'],
    ['diamond, C', 'covalent network', 'Carbon atoms in one giant net of covalent bonds.'], ['graphite, C', 'covalent network', 'Carbon atoms in giant covalently bonded sheets.'], ['quartz, $\\ce{SiO2}$', 'covalent network', 'Unlike $\\ce{CO2}$, it has no separate molecules: every Si bonds to 4 O in a giant net.'], ['silicon carbide, $\\ce{SiC}$', 'covalent network', 'Si and C in a giant net of covalent bonds.'],
    ['$\\ce{Cu}$', 'metallic', 'A metal element alone.'], ['$\\ce{Fe}$', 'metallic', 'A metal element alone.'], ['$\\ce{Na}$', 'metallic', 'A metal element alone. It is soft and melts at only 98 °C, but it is still metallic.'], ['$\\ce{W}$', 'metallic', 'A metal element alone. It melts near 3400 °C.'], ['$\\ce{Au}$', 'metallic', 'A metal element alone.'],
  ];

  Bank.add('solids', {
    quiz: [
      {
        q: 'A solid melts at 801 °C. It does not conduct as a solid, but it conducts when melted. What kind of solid is it?',
        options: ['Molecular', 'Ionic', 'Metallic', 'Covalent network'],
        answer: 1,
        why: 'Ions are locked in place in the solid, and free to carry charge once melted. Metals conduct as solids too, and molecular solids melt far lower.',
      },
      {
        q: 'Why does a hammer shatter salt but only bend copper?',
        options: ['Copper is heavier', 'Sliding the ions lines up like charges, which repel. In a metal the electron sea simply follows the shifted cations', 'Salt has weak bonds', 'Copper is held by covalent bonds'],
        answer: 1,
        why: 'Shift a salt crystal by one row and plus faces plus. In a metal, the electrons have no fixed places, so layers can slide without any repulsion.',
      },
      {
        q: 'Why do metals conduct electricity?',
        options: ['Their cations move through the solid', 'Their outer electrons are free to move through the whole crystal', 'They contain water', 'Their atoms are large'],
        answer: 1,
        why: 'The valence electrons form a mobile sea. The cations stay in place and vibrate.',
      },
      {
        q: 'What must be broken to melt solid $\\ce{SiO2}$?',
        options: ['London dispersion forces', 'Hydrogen bonds', 'Covalent bonds', 'Ionic bonds'],
        answer: 2,
        why: '$\\ce{SiO2}$ is a covalent network. It has no separate molecules, so melting has to break Si&ndash;O covalent bonds, near 1700 °C.',
      },
      {
        q: 'Solid $\\ce{CO2}$ turns to gas at &minus;78.5 °C, while $\\ce{SiO2}$ melts near 1700 °C. Why are they so different?',
        options: ['$\\ce{CO2}$ is a molecular solid and $\\ce{SiO2}$ is a covalent network', 'Silicon is heavier than carbon', '$\\ce{CO2}$ is ionic', '$\\ce{SiO2}$ has hydrogen bonds'],
        answer: 0,
        why: 'Their formulas look alike, but $\\ce{CO2}$ has separate molecules held by weak forces. $\\ce{SiO2}$ is one giant net of strong bonds.',
      },
      {
        q: 'How much of an atom at a cube\'s corner belongs to that one cell?',
        options: ['$\\tfrac12$', '$\\tfrac14$', '$\\tfrac18$', 'All of it'],
        answer: 2,
        why: 'Eight cubes meet at any corner, and each gets an equal share.',
      },
      {
        q: 'How many atoms belong to one face-centered cubic cell?',
        options: ['14', '9', '4', '2'],
        answer: 2,
        why: '$8 \\times \\tfrac18 + 6 \\times \\tfrac12 = 1 + 3 = 4$. The tempting 14 counts every sphere you can see in the picture.',
      },
      {
        q: 'Which unit cell packs its atoms most tightly?',
        options: ['Simple cubic', 'Body-centered cubic', 'Face-centered cubic', 'They all fill the same space'],
        answer: 2,
        why: 'Filled space is 52% for simple, 68% for body-centered and 74% for face-centered.',
      },
      {
        q: 'How many nearest neighbors touch each atom in a body-centered cubic crystal?',
        options: ['4', '6', '8', '12'],
        answer: 2,
        why: 'The center atom touches all 8 corner atoms. Since the pattern repeats, every atom has 8 neighbors.',
      },
      {
        q: 'In a body-centered cubic metal, atoms touch along:',
        options: ['A cube edge', 'A face diagonal', 'The body diagonal', 'Nowhere'],
        answer: 2,
        why: 'The center atom touches the corners, so the body diagonal spans $4r$: $\\sqrt{3}\\,a = 4r$.',
      },
      {
        q: 'Why is graphite soft and slippery, even though it is a covalent network?',
        options: ['It has fewer electrons than diamond', 'Its strong bonds are only within sheets, and weak London forces hold the sheets together', 'It is not really carbon', 'Its atoms are bonded to 4 neighbors'],
        answer: 1,
        why: 'The sheets slide over each other easily. That is how a pencil leaves a mark.',
      },
      {
        q: 'Why does graphite conduct electricity while diamond does not?',
        options: ['Each C in graphite has one electron free to move along the sheets, while diamond uses all four in bonds', 'Graphite contains metal', 'Diamond has too many electrons', 'Graphite is an ionic solid'],
        answer: 0,
        why: 'Graphite bonds each C to 3 others, which leaves one electron delocalized. Diamond locks all its electrons into 4 bonds.',
      },
    ],

    gens: [
      {
        id: 'count',
        title: 'Count atoms per cell',
        make(r) {
          const c = r.pick([0, 8, 8, 8]), e = r.pick([0, 0, 12, 4]), f = r.pick([0, 6, 2, 6]), b = r.pick([0, 1, 1, 2]);
          const set = (c || e || f || b) ? { c, e, f, b } : { c: 8, e: 0, f: 6, b: 0 };
          const total = set.c / 8 + set.e / 4 + set.f / 2 + set.b;
          const parts = [];
          if (set.c) parts.push(`${set.c} at corners`);
          if (set.e) parts.push(`${set.e} on edges`);
          if (set.f) parts.push(`${set.f} on faces`);
          if (set.b) parts.push(`${set.b} fully inside the cell`);
          const lines = [];
          if (set.c) lines.push(`Corners: $${set.c} \\times \\tfrac18 = ${set.c / 8}$.`);
          if (set.e) lines.push(`Edges: $${set.e} \\times \\tfrac14 = ${set.e / 4}$.`);
          if (set.f) lines.push(`Faces: $${set.f} \\times \\tfrac12 = ${set.f / 2}$.`);
          if (set.b) lines.push(`Inside: $${set.b} \\times 1 = ${set.b}$.`);
          return {
            q: `A cubic unit cell has atoms ${parts.join(', ')}. How many atoms belong to one cell?`,
            answer: total, tol: 0.001, unit: 'atoms',
            hint: 'Corner $\\tfrac18$, edge $\\tfrac14$, face $\\tfrac12$, inside 1.',
            steps: lines.concat([`Add them: <b>${total}</b> atoms per cell.`]),
          };
        },
      },
      {
        id: 'formula',
        title: 'Formula from a cell',
        make(r) {
          const c = r.pick([
            { A: 'Cs', B: 'Cl', posA: 'corners', posB: 'the body center', a: 1, b: 1 },
            { A: 'Ti', B: 'O', posA: 'corners and the body center', posB: 'four face positions and two inside', a: 2, b: 4 },
            { A: 'Re', B: 'O', posA: 'corners', posB: 'edge centers', a: 1, b: 3 },
            { A: 'Cu', B: 'Au', posA: 'face centers', posB: 'corners', a: 3, b: 1 },
            { A: 'Ca', B: 'F', posA: 'corners and face centers', posB: 'eight positions fully inside', a: 4, b: 8 },
            { A: 'Na', B: 'Cl', posA: 'edge centers and the body center', posB: 'corners and face centers', a: 4, b: 4 },
            { A: 'Zn', B: 'S', posA: 'four positions fully inside', posB: 'corners and face centers', a: 4, b: 4 },
          ]);
          const g = (x, y) => (y ? g(y, x % y) : x);
          const k = g(c.a, c.b), m = c.a / k, n = c.b / k;
          const fm = (p, q) => `${c.A}${p > 1 ? p : ''}${c.B}${q > 1 ? q : ''}`;
          const right = `$\\ce{${fm(m, n)}}$`;
          const wrong = [[1, 1], [1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2]].filter(([p, q]) => !(p === m && q === n)).map(([p, q]) => `$\\ce{${fm(p, q)}}$`);
          const opts = r.mc(right, r.shuffle(wrong).slice(0, 3));
          const count = (pos, tot) => `${pos} gives ${tot} per cell`;
          return {
            q: `In a unit cell, ${c.A} sits at ${c.posA}, and ${c.B} sits at ${c.posB}. What is the formula?`,
            choices: opts.choices, answer: opts.answer,
            hint: 'Count each element per cell using its shares, then reduce the ratio.',
            steps: [
              `${c.A}: ${count(c.posA, c.a)}.`,
              `${c.B}: ${count(c.posB, c.b)}.`,
              `The ratio ${c.a} : ${c.b} reduces to ${m} : ${n}, so the formula is ${right}.`,
            ],
          };
        },
      },
      {
        id: 'density',
        title: 'Density from a cell',
        make(r) {
          const m = r.pick(METALS);
          const M = EL[m.el].mass, aCm = m.a * 1e-10, massCell = (m.Z * M) / NA, vol = aCm ** 3, d = massCell / vol;
          return {
            q: `$\\ce{${m.el}}$ has a ${m.type} unit cell with an edge of ${m.a} pm. Calculate its density in g/cm³. Its molar mass is ${M.toFixed(2)} g/mol.`,
            answer: d, unit: 'g/cm³', tol: 0.02,
            hint: 'Find Z. Then mass of cell over volume of cell. Change pm to cm before cubing.',
            steps: [
              `${m.type[0].toUpperCase() + m.type.slice(1)} means $Z = ${zSum[m.Z]}$.`,
              `Mass of cell: $\\dfrac{${m.Z} \\times ${M.toFixed(2)}\\text{ g/mol}}{6.022 \\times 10^{23}\\text{ /mol}} = ${texSci(massCell)}\\text{ g}$.`,
              `Edge: $${m.a}\\text{ pm} \\times 10^{-10}\\text{ cm/pm} = ${texSci(aCm)}\\text{ cm}$.`,
              `Volume: $(${texSci(aCm)}\\text{ cm})^3 = ${texSci(vol)}\\text{ cm}^3$.`,
              `Density: $\\dfrac{${texSci(massCell)}\\text{ g}}{${texSci(vol)}\\text{ cm}^3} = ${Lab.sig(d, 3)}\\text{ g/cm}^3$.`,
            ],
          };
        },
      },
      {
        id: 'edge',
        title: 'Edge from density',
        make(r) {
          const m = r.pick(METALS);
          const M = EL[m.el].mass;
          const d = +((m.Z * M) / (NA * (m.a * 1e-10) ** 3)).toFixed(2);
          const vol = (m.Z * M) / (NA * d), aCm = Math.cbrt(vol), pm = aCm / 1e-10;
          return {
            q: `$\\ce{${m.el}}$ is ${m.type} with a density of ${d} g/cm³ and a molar mass of ${M.toFixed(2)} g/mol. Find the cell edge in pm.`,
            answer: pm, unit: 'pm', tol: 0.02,
            hint: 'Rearrange the density formula for $a^3$, take the cube root, then change cm to pm.',
            steps: [
              `$Z = ${zSum[m.Z]}$.`,
              `Rearrange: $a^3 = \\dfrac{ZM}{N_A d} = \\dfrac{${m.Z} \\times ${M.toFixed(2)}}{(6.022 \\times 10^{23})(${d})} = ${texSci(vol)}\\text{ cm}^3$.`,
              `Cube root: $a = ${texSci(aCm)}\\text{ cm}$.`,
              `Change to pm: $a = ${texSci(aCm)}\\text{ cm} \\times \\dfrac{1\\text{ pm}}{10^{-10}\\text{ cm}} = ${Lab.sig(pm, 4)}\\text{ pm}$.`,
            ],
          };
        },
      },
      {
        id: 'radius',
        title: 'Atomic radius from the edge',
        make(r) {
          const m = r.pick(METALS);
          const R = m.Z === 1 ? m.a / 2 : m.Z === 2 ? (Math.sqrt(3) * m.a) / 4 : (Math.sqrt(2) * m.a) / 4;
          const rule = m.Z === 1 ? 'Atoms touch along the edge, so $a = 2r$.' : m.Z === 2 ? 'Atoms touch along the body diagonal, so $\\sqrt{3}\\,a = 4r$.' : 'Atoms touch along the face diagonal, so $\\sqrt{2}\\,a = 4r$.';
          const calc = m.Z === 1 ? `r = \\dfrac{${m.a}}{2}` : m.Z === 2 ? `r = \\dfrac{1.732 \\times ${m.a}}{4}` : `r = \\dfrac{1.414 \\times ${m.a}}{4}`;
          return {
            q: `$\\ce{${m.el}}$ is ${m.type} with an edge of ${m.a} pm. What is its atomic radius in pm?`,
            answer: R, unit: 'pm', tol: 0.01,
            hint: 'Find which line the atoms touch along.',
            steps: [rule, `$${calc} = ${Lab.sig(R, 4)}\\text{ pm}$.`],
          };
        },
      },
      {
        id: 'classify',
        title: 'What kind of solid?',
        make(r) {
          const [name, kind, why] = r.pick(SOLIDS);
          const list = ['ionic', 'molecular', 'covalent network', 'metallic'];
          const opts = r.mc(kind, list.filter((k) => k !== kind));
          return {
            q: `What kind of solid is ${name}?`,
            choices: opts.choices, answer: opts.answer,
            hint: 'Metal plus nonmetal is ionic. Metal alone is metallic. Nonmetals are molecular, except the few networks you memorize.',
            steps: [why, `So it is <b>${kind}</b>.`],
          };
        },
      },
      {
        id: 'cell-facts',
        title: 'Cell facts',
        make(r) {
          const c = r.pick([
            { q: 'How many touching neighbors does each atom have in a simple cubic crystal?', a: '6', w: ['4', '8', '12'], why: 'One in each direction: left, right, front, back, up and down.' },
            { q: 'How many touching neighbors does each atom have in a body-centered cubic crystal?', a: '8', w: ['6', '4', '12'], why: 'The center atom touches all 8 corners.' },
            { q: 'How many touching neighbors does each atom have in a face-centered cubic crystal?', a: '12', w: ['6', '8', '14'], why: 'This is the closest possible packing of equal spheres.' },
            { q: 'What fraction of the space is filled in a face-centered cubic crystal?', a: '74%', w: ['52%', '68%', '100%'], why: '$\\frac{4 \\times \\frac43\\pi r^3}{a^3}$ with $a = 2\\sqrt2\\,r$ gives 74%.' },
            { q: 'What fraction of the space is filled in a simple cubic crystal?', a: '52%', w: ['68%', '74%', '100%'], why: '$\\frac{1 \\times \\frac43\\pi r^3}{(2r)^3} = \\frac{\\pi}{6}$, which is 52%.' },
            { q: 'What fraction of the space is filled in a body-centered cubic crystal?', a: '68%', w: ['52%', '74%', '100%'], why: '$\\frac{2 \\times \\frac43\\pi r^3}{a^3}$ with $a = 4r/\\sqrt3$ gives 68%.' },
            { q: 'How many $\\ce{Na+}$ and $\\ce{Cl-}$ belong to one unit cell of salt?', a: '4 of each', w: ['1 of each', '13 of each', '14 and 13'], why: '$\\ce{Cl-}$: $8 \\times \\tfrac18 + 6 \\times \\tfrac12 = 4$. $\\ce{Na+}$: $12 \\times \\tfrac14 + 1 = 4$.' },
          ]);
          const opts = r.mc(c.a, c.w);
          return { q: c.q, choices: opts.choices, answer: opts.answer, hint: 'Picture the cell, or try the 3D viewer.', steps: [c.why] };
        },
      },
    ],

    cards: [
      { front: 'What are the four kinds of crystalline solid?', back: 'Ionic, molecular, covalent network and metallic.' },
      { front: 'What holds a molecular solid together?', back: 'Intermolecular forces. The molecules stay whole when it melts.' },
      { front: 'What is the sea of electrons?', back: 'In a metal, valence electrons move freely through the crystal around fixed cations. It explains conductivity and malleability.' },
      { front: 'Why are ionic solids brittle?', back: 'Shifting a layer lines up like charges, and they repel.' },
      { front: 'Share of an atom at a corner, edge, face, center?', back: '$\\tfrac18$, $\\tfrac14$, $\\tfrac12$ and 1.' },
      { front: 'Atoms per cell in simple, body-centered and face-centered cubic?', back: '1, 2 and 4.' },
      { front: 'Touching neighbors in simple, body-centered and face-centered cubic?', back: '6, 8 and 12.' },
      { front: 'Where do atoms touch in each cell?', back: 'Simple: along an edge, $a = 2r$. Body: along the body diagonal, $\\sqrt3\\,a = 4r$. Face: along a face diagonal, $\\sqrt2\\,a = 4r$.' },
      { front: 'Density from a unit cell?', back: '$d = \\dfrac{ZM}{N_A a^3}$, with $a$ in cm.' },
      { front: 'Diamond versus graphite?', back: 'Diamond: 4 bonds per C, 3D net, very hard, no conduction. Graphite: 3 bonds per C, sheets, soft, conducts along the sheets.' },
    ],

    terms: [
      { term: 'Crystalline solid', def: 'A solid whose particles sit in a regular repeating pattern.' },
      { term: 'Amorphous solid', def: 'A solid with no long-range order, such as glass.' },
      { term: 'Ionic solid', def: 'A crystal of cations and anions held by opposite charges.' },
      { term: 'Molecular solid', def: 'A crystal of separate molecules held by intermolecular forces.' },
      { term: 'Covalent network solid', def: 'A crystal where covalent bonds join all the atoms into one giant net.' },
      { term: 'Metallic solid', def: 'Metal cations in a mobile sea of valence electrons.' },
      { term: 'Sea of electrons', def: 'The model of metallic bonding, with valence electrons shared by the whole crystal.' },
      { term: 'Malleable', def: 'Able to be hammered into shape without breaking.' },
      { term: 'Unit cell', def: 'The smallest repeating box that builds a whole crystal when stacked.' },
      { term: 'Simple cubic', def: 'A unit cell with atoms only at the corners. Z = 1.' },
      { term: 'Body-centered cubic', def: 'A unit cell with atoms at the corners and one in the center. Z = 2.' },
      { term: 'Face-centered cubic', def: 'A unit cell with atoms at the corners and on every face. Z = 4.' },
      { term: 'Coordination number', def: 'The number of nearest neighbors that touch a particle.' },
      { term: 'Packing efficiency', def: 'The percent of a unit cell\'s volume filled by atoms.' },
    ],
  });
})();
