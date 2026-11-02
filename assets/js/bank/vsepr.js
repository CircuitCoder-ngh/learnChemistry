/* Question bank for 8.4 VSEPR, plus VseprKit: shapes, counting and dipole vector sums, all done in code.
   Nothing about a molecule's shape or polarity is typed in: it follows from its formula. */
(function () {
  'use strict';
  const Kit = (window.VseprKit = {});
  const t = 1 / Math.sqrt(3);
  /* Ideal unit vectors, the same as Chem3D.GEOM. */
  Kit.GEOM = {
    linear: [[1, 0, 0], [-1, 0, 0]],
    trigonal: [[0, 1, 0], [0.866, -0.5, 0], [-0.866, -0.5, 0]],
    tetrahedral: [[t, t, t], [t, -t, -t], [-t, t, -t], [-t, -t, t]],
    tbp: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]],
    octahedral: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]],
  };
  const GEOM_BY_GROUPS = { 2: 'linear', 3: 'trigonal', 4: 'tetrahedral', 5: 'tbp', 6: 'octahedral' };
  const EG_NAME = { 2: 'Linear', 3: 'Trigonal planar', 4: 'Tetrahedral', 5: 'Trigonal bipyramidal', 6: 'Octahedral' };

  /* Which ideal positions hold lone pairs. In a trigonal bipyramid (positions 0 and 1 are axial) they
     go equatorial. In an octahedron a second lone pair goes opposite the first. */
  const LONE = { '3-1': [0], '4-1': [0], '4-2': [0, 1], '5-1': [2], '5-2': [2, 3], '5-3': [2, 3, 4], '6-1': [0], '6-2': [0, 1] };

  /* key: groups-lonepairs. angle: what to say on an exam. real: a measured example. */
  const S = (groups, lp, name, angle, examples, real) => ({ key: groups + '-' + lp, groups, lp, name, eg: EG_NAME[groups], geom: GEOM_BY_GROUPS[groups], lone: LONE[groups + '-' + lp] || [], angle, examples, real, axe: `AX${groups - lp > 1 ? '<sub>' + (groups - lp) + '</sub>' : ''}${lp ? 'E' + (lp > 1 ? '<sub>' + lp + '</sub>' : '') : ''}` });
  Kit.SHAPES = [
    S(2, 0, 'Linear', '180°', ['CO2', 'BeCl2', 'HCN'], 'CO₂: 180°'),
    S(3, 0, 'Trigonal planar', '120°', ['BF3', 'SO3', 'CO3^2-'], 'BF₃: 120°'),
    S(3, 1, 'Bent', 'a little under 120°', ['SO2', 'O3', 'NO2^-'], 'SO₂: about 119°'),
    S(4, 0, 'Tetrahedral', '109.5°', ['CH4', 'CCl4', 'NH4^+', 'SO4^2-'], 'CH₄: 109.5°'),
    S(4, 1, 'Trigonal pyramidal', 'about 107°', ['NH3', 'NF3', 'PCl3', 'H3O^+'], 'NH₃: 107°'),
    S(4, 2, 'Bent', 'about 104.5°', ['H2O', 'H2S', 'OF2'], 'H₂O: 104.5°'),
    S(5, 0, 'Trigonal bipyramidal', '90° and 120°', ['PCl5', 'PF5'], 'PCl₅: 90° and 120°'),
    S(5, 1, 'Seesaw', 'about 90° and about 120°', ['SF4'], 'SF₄: about 88°, 102° and 173°'),
    S(5, 2, 'T-shaped', 'about 90°', ['ClF3', 'BrF3'], 'ClF₃: about 87.5°'),
    S(5, 3, 'Linear', '180°', ['XeF2', 'I3^-'], 'XeF₂: 180°'),
    S(6, 0, 'Octahedral', '90°', ['SF6'], 'SF₆: 90°'),
    S(6, 1, 'Square pyramidal', 'about 90°', ['BrF5', 'IF5'], 'BrF₅: about 85°'),
    S(6, 2, 'Square planar', '90°', ['XeF4', 'ICl4^-'], 'XeF₄: 90°'),
  ];
  Kit.shape = (groups, lp) => Kit.SHAPES.find((s) => s.groups === groups && s.lp === lp);
  Kit.NAMES = ['Linear', 'Trigonal planar', 'Bent', 'Tetrahedral', 'Trigonal pyramidal', 'Trigonal bipyramidal', 'Seesaw', 'T-shaped', 'Octahedral', 'Square pyramidal', 'Square planar'];

  /* Species: formula, central atom, outer atoms, charge. doubles lists outer indices drawn with double bonds. */
  const sp = (f, name, c, o, charge = 0, doubles = []) => ({ f, name, c, o, charge, doubles });
  const rep = (x, n) => Array(n).fill(x);
  Kit.SPECIES = [
    sp('CO2', 'carbon dioxide', 'C', rep('O', 2), 0, [0, 1]),
    sp('CS2', 'carbon disulfide', 'C', rep('S', 2), 0, [0, 1]),
    sp('BeCl2', 'beryllium chloride', 'Be', rep('Cl', 2)),
    sp('HCN', 'hydrogen cyanide', 'C', ['H', 'N']),
    sp('OCS', 'carbonyl sulfide', 'C', ['O', 'S'], 0, [0, 1]),
    sp('BF3', 'boron trifluoride', 'B', rep('F', 3)),
    sp('BCl3', 'boron trichloride', 'B', rep('Cl', 3)),
    sp('SO3', 'sulfur trioxide', 'S', rep('O', 3), 0, [0, 1, 2]),
    sp('CH2O', 'formaldehyde', 'C', ['O', 'H', 'H'], 0, [0]),
    sp('NO3^-', 'nitrate', 'N', rep('O', 3), -1),
    sp('CO3^2-', 'carbonate', 'C', rep('O', 3), -2),
    sp('SO2', 'sulfur dioxide', 'S', rep('O', 2), 0, [0, 1]),
    sp('O3', 'ozone', 'O', rep('O', 2)),
    sp('NO2^-', 'nitrite', 'N', rep('O', 2), -1),
    sp('CH4', 'methane', 'C', rep('H', 4)),
    sp('CCl4', 'carbon tetrachloride', 'C', rep('Cl', 4)),
    sp('CF4', 'carbon tetrafluoride', 'C', rep('F', 4)),
    sp('CH3Cl', 'chloromethane', 'C', ['Cl', 'H', 'H', 'H']),
    sp('CH2Cl2', 'dichloromethane', 'C', ['Cl', 'Cl', 'H', 'H']),
    sp('CHCl3', 'chloroform', 'C', ['Cl', 'Cl', 'Cl', 'H']),
    sp('NH4^+', 'ammonium', 'N', rep('H', 4), 1),
    sp('SO4^2-', 'sulfate', 'S', rep('O', 4), -2),
    sp('PO4^3-', 'phosphate', 'P', rep('O', 4), -3),
    sp('ClO4^-', 'perchlorate', 'Cl', rep('O', 4), -1),
    sp('NH3', 'ammonia', 'N', rep('H', 3)),
    sp('NF3', 'nitrogen trifluoride', 'N', rep('F', 3)),
    sp('PCl3', 'phosphorus trichloride', 'P', rep('Cl', 3)),
    sp('H3O^+', 'hydronium', 'O', rep('H', 3), 1),
    sp('ClO3^-', 'chlorate', 'Cl', rep('O', 3), -1),
    sp('H2O', 'water', 'O', rep('H', 2)),
    sp('H2S', 'hydrogen sulfide', 'S', rep('H', 2)),
    sp('OF2', 'oxygen difluoride', 'O', rep('F', 2)),
    sp('PCl5', 'phosphorus pentachloride', 'P', rep('Cl', 5)),
    sp('PF5', 'phosphorus pentafluoride', 'P', rep('F', 5)),
    sp('SF4', 'sulfur tetrafluoride', 'S', rep('F', 4)),
    sp('ClF3', 'chlorine trifluoride', 'Cl', rep('F', 3)),
    sp('BrF3', 'bromine trifluoride', 'Br', rep('F', 3)),
    sp('XeF2', 'xenon difluoride', 'Xe', rep('F', 2)),
    sp('I3^-', 'triiodide', 'I', rep('I', 2), -1),
    sp('SF6', 'sulfur hexafluoride', 'S', rep('F', 6)),
    sp('BrF5', 'bromine pentafluoride', 'Br', rep('F', 5)),
    sp('IF5', 'iodine pentafluoride', 'I', rep('F', 5)),
    sp('XeF4', 'xenon tetrafluoride', 'Xe', rep('F', 4)),
    sp('ICl4^-', 'tetrachloroiodate', 'I', rep('Cl', 4), -1),
  ];
  Kit.get = (f) => Kit.SPECIES.find((s) => s.f === f);
  const val = (e) => { const g = window.EL[e].group; return g <= 2 ? g : g - 10; };

  /** The shortcut count: total valence electrons, minus what the outer atoms keep, gives the center's lone pairs. */
  Kit.count = function (s) {
    const total = val(s.c) + s.o.reduce((a, e) => a + val(e), 0) - s.charge;
    const outer = s.o.reduce((a, e) => a + (e === 'H' ? 2 : 8), 0);
    const left = total - outer;
    const lp = left / 2;
    if (!Number.isInteger(lp) || lp < 0) throw new Error('Bad electron count for ' + s.f);
    return { total, outer, left, lp, n: s.o.length, groups: s.o.length + lp, shape: Kit.shape(s.o.length + lp, lp) };
  };
  /** Positions of every electron group. Returns the atom spots in order, then the lone pair spots. */
  Kit.places = function (groups, lp) {
    const pos = Kit.GEOM[GEOM_BY_GROUPS[groups]];
    const lone = LONE[groups + '-' + lp] || [];
    return { bonded: pos.map((p, i) => ({ p, i })).filter((x) => !lone.includes(x.i)).map((x) => x.p), lone: lone.map((i) => pos[i]) };
  };
  /** The real thing: add a vector for each bond, pointing to the more electronegative atom, sized by the
      electronegativity difference. A simplified model that ignores lone pair contributions. */
  Kit.dipole = function (center, outers, dirs) {
    const enC = window.EL[center].en;
    const bonds = outers.map((e, i) => {
      const d = window.EL[e].en - enC;
      return { el: e, dir: dirs[i], size: Math.abs(d), toward: d >= 0 ? e : center, vec: [dirs[i][0] * d, dirs[i][1] * d, dirs[i][2] * d] };
    });
    const net = bonds.reduce((a, b) => [a[0] + b.vec[0], a[1] + b.vec[1], a[2] + b.vec[2]], [0, 0, 0]);
    const size = Math.hypot(net[0], net[1], net[2]);
    const largest = Math.max(...bonds.map((b) => b.size));
    return { bonds, net, size, polar: size > 0.02 && largest > 0.02 };
  };
  Kit.polarity = function (s) {
    const c = Kit.count(s);
    return Kit.dipole(s.c, s.o, Kit.places(c.groups, c.lp).bonded);
  };
  Kit.tex = (f) => `\\ce{${f.replace(/\^(.*)$/, '^{$1}')}}`;

  /* ---------- Question bank ---------- */
  const texOf = Kit.tex;
  const countSteps = (s, c) => [
    `Count valence electrons: $${c.total}$${s.charge ? ` (including the ${Math.abs(s.charge)} ${s.charge > 0 ? 'removed' : 'added'} for the charge)` : ''}.`,
    `Each outer atom keeps 8 electrons (H keeps 2): that uses ${c.outer}. Left over: $${c.total} - ${c.outer} = ${c.left}$, which is ${c.lp} lone pair${c.lp === 1 ? '' : 's'} on ${s.c}.`,
    `Electron groups on ${s.c}: ${c.n} bonded atom${c.n === 1 ? '' : 's'} + ${c.lp} lone pair${c.lp === 1 ? '' : 's'} = ${c.groups}. Multiple bonds count as one group.`,
  ];
  const noRadicals = Kit.SPECIES;

  Bank.add('vsepr', {
    quiz: [
      {
        q: 'In VSEPR, what counts as one electron group?',
        options: ['Each electron', 'Each pair of electrons, so a double bond is two groups', 'A lone pair, or a bond of any order', 'Each atom in the molecule'],
        answer: 2,
        why: 'A single, double or triple bond points one way, so each counts as one group. A lone pair is one group too. Treating a double bond as two groups is the most common slip.',
      },
      {
        q: 'What is the molecular shape of $\\ce{H2O}$, and why is it not linear?',
        options: ['Linear, because it has only 3 atoms', 'Bent, because 2 lone pairs and 2 bonds make 4 groups', 'Bent, because oxygen is large', 'Tetrahedral, because there are 4 groups'],
        answer: 1,
        why: 'Four groups point to the corners of a tetrahedron (the electron geometry). The name of the shape only counts atoms, so three atoms in that arrangement form a bent shape.',
      },
      {
        q: 'Why is the H-N-H angle in $\\ce{NH3}$ about 107° instead of 109.5°?',
        options: ['Nitrogen is too small to reach 109.5°', 'The lone pair takes up more room and pushes the bonds together', 'Hydrogens attract each other', 'Measurement error in the experiment'],
        answer: 1,
        why: 'A lone pair is held by only one nucleus, so it spreads out and repels more strongly than a bonding pair. The bonds get squeezed.',
      },
      {
        q: 'In a trigonal bipyramid, a lone pair goes in an equatorial spot because:',
        options: ['It has fewer neighbors at 90° there', 'It is farther from the central atom there', 'It has more neighbors at 90° there', 'Axial spots can only hold bonds'],
        answer: 0,
        why: 'An axial spot has 3 neighbors at 90°, an equatorial spot has only 2. The 90° repulsions are the costly ones, so a lone pair picks the spot with fewer of them.',
      },
      {
        q: 'Two lone pairs on an octahedral electron geometry give which molecular shape?',
        options: ['Seesaw', 'T-shaped', 'Square planar', 'Square pyramidal'],
        answer: 2,
        why: 'The two lone pairs sit opposite each other, 180° apart, to stay far from each other. The four atoms left make a flat square, as in $\\ce{XeF4}$.',
      },
      {
        q: 'Which molecule is nonpolar even though all its bonds are polar?',
        options: ['$\\ce{H2O}$', '$\\ce{NH3}$', '$\\ce{CHCl3}$', '$\\ce{CCl4}$'],
        answer: 3,
        why: 'The four identical C-Cl dipoles point to the corners of a tetrahedron and add to exactly zero. Replace one Cl with H, as in $\\ce{CHCl3}$, and the balance breaks.',
      },
      {
        q: '$\\ce{CO2}$ and $\\ce{SO2}$ both have three atoms. Which statement is correct?',
        options: ['Both are linear', 'Both are bent', '$\\ce{CO2}$ is linear and $\\ce{SO2}$ is bent, because S has a lone pair', '$\\ce{CO2}$ is bent and $\\ce{SO2}$ is linear, because O is smaller than S'],
        answer: 2,
        why: 'C has 2 groups, no lone pair, so linear. S has 3 groups, one a lone pair, so bent. Same formula pattern, different shape: you must always count electrons.',
      },
      {
        q: '$\\ce{XeF4}$ has two lone pairs on Xe. Is the molecule polar?',
        options: ['Yes, lone pairs always make a molecule polar', 'No, the square planar shape makes the bond dipoles cancel', 'Yes, because Xe-F bonds are polar', 'No, because noble gases do not form polar bonds'],
        answer: 1,
        why: 'Opposite Xe-F dipoles cancel in pairs, and the two opposite lone pairs balance too. Lone pairs on their own do not guarantee polarity. Symmetry decides.',
      },
    ],

    gens: [
      {
        id: 'groups',
        title: 'Count electron groups',
        make(r) {
          const s = r.pick(noRadicals);
          const c = Kit.count(s);
          return {
            q: `How many electron groups surround the central ${s.c} in $${texOf(s.f)}$?`,
            answer: c.groups, tol: 0, answerText: String(c.groups),
            hint: 'Bonded atoms plus lone pairs on the center. A double bond is still one group.',
            steps: countSteps(s, c),
          };
        },
      },
      {
        id: 'center-lp',
        title: 'Lone pairs on the center',
        make(r) {
          const s = r.pick(noRadicals);
          const c = Kit.count(s);
          return {
            q: `How many lone pairs are on the central atom of $${texOf(s.f)}$?`,
            answer: c.lp, tol: 0, answerText: String(c.lp),
            hint: 'Count the valence electrons, take away what the outer atoms keep, and divide by 2.',
            steps: countSteps(s, c).slice(0, 2),
          };
        },
      },
      {
        id: 'eg',
        title: 'Electron geometry',
        make(r) {
          const s = r.pick(noRadicals);
          const c = Kit.count(s);
          const ans = c.shape.eg;
          const m = r.mc(ans, ['Linear', 'Trigonal planar', 'Tetrahedral', 'Trigonal bipyramidal', 'Octahedral'].filter((x) => x !== ans));
          return {
            q: `What is the electron geometry around ${s.c} in $${texOf(s.f)}$?`,
            choices: m.choices, answer: m.answer,
            steps: countSteps(s, c).concat([`${c.groups} electron groups point to the corners of this arrangement: ${ans.toLowerCase()}.`]),
          };
        },
      },
      {
        id: 'mg',
        title: 'Name the molecular shape',
        make(r) {
          const s = r.pick(noRadicals);
          const c = Kit.count(s);
          const ans = c.shape.name;
          const wrong = r.shuffle(Kit.NAMES.filter((x) => x !== ans));
          const m = r.mc(ans, wrong.slice(0, 3));
          return {
            q: `What is the molecular shape of $${texOf(s.f)}$?`,
            choices: m.choices, answer: m.answer,
            steps: countSteps(s, c).concat([`With ${c.groups} groups and ${c.lp} lone pair${c.lp === 1 ? '' : 's'}, the atoms form this shape: ${ans.toLowerCase()}.`]),
          };
        },
      },
      {
        id: 'angle',
        title: 'Bond angle',
        make(r) {
          const s = r.pick(noRadicals.filter((x) => x.f !== 'H2S')); // H2S really measures 92°, so 'about 104.5°' would be a wrong key.
          const c = Kit.count(s);
          const ans = c.shape.angle;
          const all = ['180°', '120°', 'a little under 120°', '109.5°', 'about 107°', 'about 104.5°', '90° and 120°', '90°', 'about 90°'];
          const plain = (x) => x.replace(/about /g, ''); // '90°' and 'about 90°' must never compete as right and wrong.
          const wrong = r.shuffle(all.filter((x) => plain(x) !== plain(ans)));
          const m = r.mc(ans, wrong.slice(0, 3));
          return {
            q: `What bond angle should you expect in $${texOf(s.f)}$?`,
            choices: m.choices, answer: m.answer,
            steps: [`It has ${c.groups} electron groups and ${c.lp} lone pair${c.lp === 1 ? '' : 's'}, so its shape is ${c.shape.name.toLowerCase()}.`, c.lp ? (c.shape.key === '5-3' || c.shape.key === '6-2' ? `The lone pairs balance each other, so the bonds are not squeezed: ${ans}. ${c.shape.real}.` : `Lone pairs take up more room and squeeze the bonds, so expect ${ans}. ${c.shape.real}.${c.groups === 4 ? ' Measured angles vary by molecule: heavier central atoms often come out smaller, as in H₂S at 92° and PCl₃ at 100°.' : ''}`) : `The groups are all bonds, so the angle is the ideal one: ${ans}.`],
          };
        },
      },
      {
        id: 'polar',
        title: 'Polar or nonpolar?',
        make(r) {
          const s = r.pick(Kit.SPECIES.filter((x) => !x.charge && x.f !== 'O3'));
          const c = Kit.count(s);
          const d = Kit.polarity(s);
          const enC = EL[s.c].en;
          const uniq = [...new Set(s.o)];
          const lines = uniq.map((e) => `${s.c}-${e}: electronegativity difference $|${EL[e].en} - ${enC}| = ${Math.abs(EL[e].en - enC).toFixed(2)}$, pointing toward ${EL[e].en > enC ? e : s.c}.`);
          return {
            q: `Is $${texOf(s.f)}$ polar or nonpolar?`,
            choices: ['Polar', 'Nonpolar'], answer: d.polar ? 0 : 1,
            steps: [
              `Shape: ${c.groups} groups with ${c.lp} lone pair${c.lp === 1 ? '' : 's'} gives ${c.shape.name.toLowerCase()}.`,
              ...lines,
              `Add the bond arrows as vectors. The sum has a size of about ${d.size.toFixed(2)}, so the molecule is ${d.polar ? 'polar' : 'nonpolar'}.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What does VSEPR stand for?', back: 'Valence shell electron pair repulsion. Electron groups push each other as far apart as they can.' },
      { front: 'What counts as one electron group?', back: 'One lone pair, or one bond of any order. Single, double and triple bonds each count once.' },
      { front: 'Electron geometry versus molecular geometry', back: 'Electron geometry counts all groups, including lone pairs. Molecular geometry names only where the atoms are.' },
      { front: 'Order of repulsion strength', back: 'Lone pair with lone pair, then lone pair with bond, then bond with bond.' },
      { front: 'Where do lone pairs go in a trigonal bipyramid?', back: 'Equatorial spots, which have only 2 neighbors at 90° instead of 3.' },
      { front: 'Where do two lone pairs go in an octahedron?', back: 'Opposite each other, 180° apart, giving a square planar molecule.' },
      { front: 'When is a molecule polar?', back: 'When its bond dipoles do not cancel. You need polar bonds and an unbalanced shape.' },
      { front: 'Bond angles of the five electron geometries', back: 'Linear 180°. Trigonal planar 120°. Tetrahedral 109.5°. Trigonal bipyramidal 90° and 120°. Octahedral 90°.' },
    ],

    terms: [
      { term: 'VSEPR', def: 'Valence shell electron pair repulsion, the idea that electron groups around an atom spread apart as far as possible.' },
      { term: 'Electron group', def: 'A lone pair or a bond of any order around a central atom.' },
      { term: 'Electron geometry', def: 'The arrangement of all electron groups around a central atom, including lone pairs.' },
      { term: 'Molecular geometry', def: 'The arrangement of the atoms only. This is what the shape names describe.' },
      { term: 'Axial', def: 'One of the two positions along the top-bottom axis of a trigonal bipyramid, with 3 neighbors at 90°.' },
      { term: 'Equatorial', def: 'One of the three positions around the middle of a trigonal bipyramid, with 2 neighbors at 90°.' },
      { term: 'Bond dipole', def: 'The uneven sharing in a polar bond, drawn as an arrow toward the more electronegative atom.' },
      { term: 'Molecular dipole', def: 'The vector sum of all the bond dipoles. If it is not zero, the molecule is polar.' },
    ],
  });
})();
