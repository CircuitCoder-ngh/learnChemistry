/* Question bank for 8.5 Hybrid orbitals and MO theory, plus HybridKit: sigma and pi counting, hybridization
   and molecular orbital filling, all computed. Nothing about bond order or magnetism is typed in. */
(function () {
  'use strict';
  const Kit = (window.HybridKit = {});
  const val = (e) => { const g = window.EL[e].group; return g <= 2 ? g : g - 10; };

  /* ---------- Molecular orbital diagrams for second-period diatomics ---------- */
  /* Up to N2, sigma 2p sits above pi 2p. From O2 onward, it drops below. Each level: name, boxes, bonding? */
  const LEVEL = {
    s2s: { id: 's2s', name: 'σ2s', boxes: 1, bonding: true },
    ss2s: { id: 'ss2s', name: 'σ*2s', boxes: 1, bonding: false },
    p2p: { id: 'p2p', name: 'π2p', boxes: 2, bonding: true },
    s2p: { id: 's2p', name: 'σ2p', boxes: 1, bonding: true },
    pp2p: { id: 'pp2p', name: 'π*2p', boxes: 2, bonding: false },
    ss2p: { id: 'ss2p', name: 'σ*2p', boxes: 1, bonding: false },
  };
  const LOW_Z = ['s2s', 'ss2s', 'p2p', 's2p', 'pp2p', 'ss2p'];
  const HIGH_Z = ['s2s', 'ss2s', 's2p', 'p2p', 'pp2p', 'ss2p'];
  Kit.LEVEL = LEVEL;
  /** Energy order for a diatomic of this element. The switch happens between N (Z = 7) and O (Z = 8). */
  Kit.orderFor = (el) => (window.EL[el].z <= 7 ? LOW_Z : HIGH_Z);
  /** Fill electrons following the Aufbau principle, Pauli exclusion and Hund's rule. */
  Kit.fill = function (el, charge = 0, total) {
    const order = Kit.orderFor(el);
    const n = total === undefined ? 2 * val(el) - charge : total;
    const levels = order.map((id) => ({ ...LEVEL[id], e: Array(LEVEL[id].boxes).fill(0) }));
    const seq = [];
    let left = n;
    levels.forEach((L, li) => {
      // First one electron in each box, then pair up.
      for (let pass = 1; pass <= 2; pass++) {
        L.e.forEach((c, b) => {
          if (left > 0 && L.e[b] === pass - 1) { L.e[b] = pass; left--; seq.push({ level: li, box: b, spin: pass === 1 ? 1 : -1 }); }
        });
      }
    });
    const sum = (test) => levels.reduce((a, L) => a + (test(L) ? L.e.reduce((x, y) => x + y, 0) : 0), 0);
    const bonding = sum((L) => L.bonding), anti = sum((L) => !L.bonding);
    const unpaired = levels.reduce((a, L) => a + L.e.filter((c) => c === 1).length, 0);
    return { el, charge, n, order, levels, seq, bonding, anti, bo: (bonding - anti) / 2, unpaired, para: unpaired > 0 };
  };
  /* Species offered on the page. Bond lengths in pm, where known and well established. */
  Kit.DIATOMICS = [
    { id: 'Li2', el: 'Li', charge: 0, name: 'Dilithium', len: 267 },
    { id: 'Be2', el: 'Be', charge: 0, name: 'Diberyllium' },
    { id: 'B2', el: 'B', charge: 0, name: 'Diboron', len: 159 },
    { id: 'C2', el: 'C', charge: 0, name: 'Dicarbon', len: 124 },
    { id: 'N2', el: 'N', charge: 0, name: 'Nitrogen', len: 110 },
    { id: 'O2', el: 'O', charge: 0, name: 'Oxygen', len: 121 },
    { id: 'F2', el: 'F', charge: 0, name: 'Fluorine', len: 142 },
    { id: 'Ne2', el: 'Ne', charge: 0, name: 'Dineon' },
    { id: 'N2^+', el: 'N', charge: 1, name: 'Dinitrogen cation', len: 112 },
    { id: 'O2^+', el: 'O', charge: 1, name: 'Dioxygenyl', len: 112 },
    { id: 'O2^-', el: 'O', charge: -1, name: 'Superoxide', len: 135 },
    { id: 'O2^2-', el: 'O', charge: -2, name: 'Peroxide', len: 149 },
  ];
  Kit.diatomic = (id) => Kit.DIATOMICS.find((d) => d.id === id);
  Kit.tex = (f) => `\\ce{${f.replace(/\^(.*)$/, '^{$1}')}}`;
  const boText = (b) => (Number.isInteger(b) ? String(b) : b.toFixed(1));
  Kit.boText = boText;
  /** Filling in TeX, such as (σ2s)²(σ*2s)². */
  Kit.configTex = (f) => f.levels.filter((L) => L.e.some((c) => c)).map((L) => { const base = { s2s: '\\sigma_{2s}', ss2s: '\\sigma^{*}_{2s}', p2p: '\\pi_{2p}', s2p: '\\sigma_{2p}', pp2p: '\\pi^{*}_{2p}', ss2p: '\\sigma^{*}_{2p}' }[L.id]; return `(${base})^{${L.e.reduce((a, b) => a + b, 0)}}`; }).join('\\ ');

  /* ---------- Sigma, pi and hybridization on real molecules ---------- */
  const HYB = { 2: 'sp', 3: 'sp²', 4: 'sp³', 5: 'sp³d', 6: 'sp³d²' };
  const HYB_TEX = { 2: 'sp', 3: 'sp^2', 4: 'sp^3', 5: 'sp^3d', 6: 'sp^3d^2' };
  Kit.HYB = HYB;
  Kit.HYB_TEX = HYB_TEX;
  Kit.GEOM_NAME = { 2: 'Linear', 3: 'Trigonal planar', 4: 'Tetrahedral', 5: 'Trigonal bipyramidal', 6: 'Octahedral' };
  /* atoms: [element, x, y, lone pairs]. edges: [i, j, bond order]. Positions are in bond lengths, 2D. */
  const m = (f, name, charge, atoms, edges) => ({ f, name, charge, atoms: atoms.map(([el, x, y, lp]) => ({ el, x, y, lp: lp || 0 })), edges });
  const hexC = (i) => { const a = -Math.PI / 2 + (i * Math.PI) / 3; return [Math.cos(a), Math.sin(a)]; };
  Kit.MOLS = [
    m('H2O', 'Water', 0, [['O', 0, 0, 2], ['H', -0.8, 0.6], ['H', 0.8, 0.6]], [[0, 1, 1], [0, 2, 1]]),
    m('NH3', 'Ammonia', 0, [['N', 0, 0, 1], ['H', -1, 0.25], ['H', 1, 0.25], ['H', 0, 1]], [[0, 1, 1], [0, 2, 1], [0, 3, 1]]),
    m('CO2', 'Carbon dioxide', 0, [['C', 0, 0], ['O', -1, 0, 2], ['O', 1, 0, 2]], [[0, 1, 2], [0, 2, 2]]),
    m('HCN', 'Hydrogen cyanide', 0, [['H', -1, 0], ['C', 0, 0], ['N', 1, 0, 1]], [[0, 1, 1], [1, 2, 3]]),
    m('N2', 'Nitrogen', 0, [['N', -0.5, 0, 1], ['N', 0.5, 0, 1]], [[0, 1, 3]]),
    m('CH2O', 'Formaldehyde', 0, [['C', 0, 0.2], ['O', 0, -0.8, 2], ['H', -0.87, 0.7], ['H', 0.87, 0.7]], [[0, 1, 2], [0, 2, 1], [0, 3, 1]]),
    m('C2H6', 'Ethane', 0, [['C', -0.5, 0], ['C', 0.5, 0], ['H', -0.5, -1], ['H', -0.5, 1], ['H', -1.5, 0], ['H', 0.5, -1], ['H', 0.5, 1], ['H', 1.5, 0]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1]]),
    m('C2H4', 'Ethene', 0, [['C', -0.5, 0], ['C', 0.5, 0], ['H', -1.2, -0.7], ['H', -1.2, 0.7], ['H', 1.2, -0.7], ['H', 1.2, 0.7]], [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]]),
    m('C2H2', 'Ethyne', 0, [['H', -1.5, 0], ['C', -0.5, 0], ['C', 0.5, 0], ['H', 1.5, 0]], [[0, 1, 1], [1, 2, 3], [2, 3, 1]]),
    m('HCOOH', 'Formic acid', 0, [['C', 0, 0], ['O', -0.87, -0.5, 2], ['O', 0.87, -0.5, 2], ['H', 0, 1], ['H', 1.67, -0.1]], [[0, 1, 2], [0, 2, 1], [0, 3, 1], [2, 4, 1]]),
    m('CH3CN', 'Acetonitrile', 0, [['C', -0.5, 0], ['C', 0.5, 0], ['N', 1.5, 0, 1], ['H', -0.5, -1], ['H', -0.5, 1], ['H', -1.5, 0]], [[0, 1, 1], [1, 2, 3], [0, 3, 1], [0, 4, 1], [0, 5, 1]]),
    m('C6H6', 'Benzene', 0, [0, 1, 2, 3, 4, 5].map((i) => ['C', hexC(i)[0], hexC(i)[1]]).concat([0, 1, 2, 3, 4, 5].map((i) => ['H', hexC(i)[0] * 1.72, hexC(i)[1] * 1.72])), [[0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1], [0, 6, 1], [1, 7, 1], [2, 8, 1], [3, 9, 1], [4, 10, 1], [5, 11, 1]]),
  ];
  Kit.mol = (f) => Kit.MOLS.find((x) => x.f === f);
  Kit.count = (mol) => ({ sigma: mol.edges.length, pi: mol.edges.reduce((a, e) => a + (e[2] - 1), 0) });
  Kit.groups = (mol, i) => mol.edges.filter((e) => e[0] === i || e[1] === i).length + mol.atoms[i].lp;
  Kit.hybridOf = (mol, i) => (mol.atoms[i].el === 'H' ? null : HYB[Kit.groups(mol, i)]);
  /** Throws if a molecule's electrons do not add up. */
  Kit.verify = function (mol) {
    const need = mol.atoms.reduce((a, x) => a + val(x.el), 0) - mol.charge;
    const have = 2 * mol.edges.reduce((a, e) => a + e[2], 0) + 2 * mol.atoms.reduce((a, x) => a + x.lp, 0);
    if (need !== have) throw new Error(`${mol.f}: drawing holds ${have} electrons, needs ${need}`);
    return true;
  };
  Kit.MOLS.forEach((x) => Kit.verify(x));

  /* Central atoms for the hybridization question: formula, center, bonded atoms, lone pairs. */
  const HY = [
    ['BeCl2', 'Be', 2, 0], ['CO2', 'C', 2, 0], ['HCN', 'C', 2, 0], ['BF3', 'B', 3, 0], ['SO3', 'S', 3, 0], ['SO2', 'S', 2, 1],
    ['CH2O', 'C', 3, 0], ['CH4', 'C', 4, 0], ['NH3', 'N', 3, 1], ['H2O', 'O', 2, 2], ['CCl4', 'C', 4, 0], ['NH4^+', 'N', 4, 0],
    ['PCl5', 'P', 5, 0], ['SF4', 'S', 4, 1], ['SF6', 'S', 6, 0], ['XeF4', 'Xe', 4, 2],
  ];

  /* ---------- Question bank ---------- */
  const D = () => Kit.DIATOMICS;
  Bank.add('hybrid', {
    quiz: [
      {
        q: 'A sigma bond forms when orbitals overlap:',
        options: ['Above and below the line between the nuclei', 'Directly along the line between the nuclei', 'Only when both are p orbitals', 'Only in double bonds'],
        answer: 1,
        why: 'Sigma overlap is head-on, with electron density on the axis. It can form from s, p or hybrid orbitals. Pi overlap is the one with lobes above and below the axis.',
      },
      {
        q: 'A triple bond consists of:',
        options: ['3 sigma bonds', '2 sigma bonds and 1 pi bond', '1 sigma bond and 2 pi bonds', '3 pi bonds'],
        answer: 2,
        why: 'The first bond between two atoms is always sigma. The second and third must be pi, because only one orbital pair can point along the axis.',
      },
      {
        q: 'Why can atoms not rotate freely around a double bond?',
        options: ['The atoms are too heavy', 'Twisting would break the pi overlap', 'Twisting would break the sigma overlap', 'Double bonds are too short'],
        answer: 1,
        why: 'Pi overlap needs the p orbitals to stay parallel. Sigma overlap does not change on twisting, which is why single bonds rotate freely.',
      },
      {
        q: 'What is the hybridization of the central atom in a molecule with 3 electron groups?',
        options: ['sp', 'sp²', 'sp³', 'sp³d'],
        answer: 1,
        why: 'Count one hybrid orbital per group. Three groups need 3 hybrid orbitals, made from one s and two p: $sp^2$. One p orbital is left over for a pi bond.',
      },
      {
        q: 'In ethene, $\\ce{C2H4}$, what makes up the C=C double bond?',
        options: ['Two overlapping $sp^2$ pairs', 'One $sp^2$-$sp^2$ sigma and one p-p pi', 'One $sp^3$-$sp^3$ sigma and one p-p pi', 'Two p-p pi bonds'],
        answer: 1,
        why: 'Each carbon has 3 groups, so it is $sp^2$. One hybrid from each carbon makes the sigma bond, and the leftover p orbitals overlap side by side to make the pi bond.',
      },
      {
        q: 'Which statement about bonding and antibonding molecular orbitals is correct?',
        options: ['Bonding orbitals are higher in energy', 'Antibonding orbitals put electron density between the nuclei', 'Antibonding orbitals have a node between the nuclei', 'They are the same energy'],
        answer: 2,
        why: 'Out-of-phase waves cancel between the nuclei, leaving a node. Without the electrons holding the nuclei together, the energy is higher than the starting atomic orbitals.',
      },
      {
        q: 'MO theory succeeds where Lewis structures fail by explaining why $\\ce{O2}$ is:',
        options: ['A gas at room temperature', 'Attracted to a magnet', 'Colorless', 'Linear'],
        answer: 1,
        why: 'Its last two electrons sit alone in the two $\\pi^*$ orbitals, as Hund\'s rule says. Two unpaired electrons make it paramagnetic. A Lewis structure shows every electron paired.',
      },
      {
        q: 'Bond order in MO theory is:',
        options: ['Bonding electrons plus antibonding electrons, over 2', 'Bonding electrons minus antibonding electrons, over 2', 'The number of unpaired electrons', 'The number of atoms in the molecule'],
        answer: 1,
        why: 'Each bonding pair strengthens the bond and each antibonding pair undoes one. A bond order of 0, as in $\\ce{Be2}$ and $\\ce{Ne2}$, means no stable molecule.',
      },
      {
        q: 'Which is true of the order of the $\\sigma_{2p}$ and $\\pi_{2p}$ levels?',
        options: ['$\\sigma_{2p}$ is always the lower one', '$\\pi_{2p}$ is always the lower one', '$\\pi_{2p}$ is lower through $\\ce{N2}$, and $\\sigma_{2p}$ is lower from $\\ce{O2}$ onward', 'They are always the same energy'],
        answer: 2,
        why: 'For Li through N, s and p orbitals mix enough to push $\\sigma_{2p}$ above $\\pi_{2p}$. From O onward, the order switches. You need both diagrams.',
      },
    ],

    gens: [
      {
        id: 'hybrid',
        title: 'Hybridization of the central atom',
        make(r) {
          const [f, c, nb, lp] = r.pick(HY);
          const groups = nb + lp;
          const ans = Kit.HYB[groups];
          const m2 = r.mc(`$${Kit.HYB_TEX[groups]}$`, Object.keys(Kit.HYB).filter((k) => +k !== groups).map((k) => `$${Kit.HYB_TEX[k]}$`).slice(0, 3));
          return {
            q: `What is the hybridization of ${c} in $${Kit.tex(f)}$?`,
            choices: m2.choices, answer: m2.answer,
            steps: [
              `Count electron groups on ${c}: ${nb} bonded atom${nb > 1 ? 's' : ''} and ${lp} lone pair${lp === 1 ? '' : 's'}, which is ${groups} groups. Multiple bonds count once.`,
              `${groups} groups need ${groups} hybrid orbitals: ${ans}.`,
            ],
          };
        },
      },
      {
        id: 'sigma-pi',
        title: 'Count sigma and pi bonds',
        make(r) {
          const mol = r.pick(Kit.MOLS);
          const c = Kit.count(mol);
          const askPi = r.pick([true, false]);
          const ans = askPi ? c.pi : c.sigma;
          const dbl = mol.edges.filter((e) => e[2] === 2).length, tpl = mol.edges.filter((e) => e[2] === 3).length;
          return {
            q: `How many ${askPi ? 'pi' : 'sigma'} bonds are in $${Kit.tex(mol.f)}$ (${mol.name.toLowerCase()})?`,
            answer: ans, tol: 0, answerText: String(ans),
            hint: 'Every bond between two atoms holds exactly one sigma. A double adds one pi and a triple adds two pi.',
            steps: [
              `The structure has ${mol.edges.length} connections between atoms: ${dbl} double, ${tpl} triple, and the rest single.`,
              `Sigma: one per connection, so ${c.sigma}. Pi: $${dbl} \\times 1 + ${tpl} \\times 2 = ${c.pi}$.`,
            ],
          };
        },
      },
      {
        id: 'bond-order',
        title: 'Bond order from an MO diagram',
        make(r) {
          const d = r.pick(D());
          const fl = Kit.fill(d.el, d.charge);
          return {
            q: `Use molecular orbital theory to find the bond order of $${Kit.tex(d.id)}$. Count valence electrons only.`,
            answer: fl.bo, tol: 0.01, answerText: Kit.boText(fl.bo),
            hint: 'Bond order = (bonding electrons - antibonding electrons) / 2.',
            steps: [
              `Valence electrons: $2(${val(d.el)})${d.charge ? (d.charge > 0 ? ' - ' + d.charge : ' + ' + -d.charge) : ''} = ${fl.n}$.`,
              `Fill from the bottom: $${Kit.configTex(fl)}$.`,
              `Bonding electrons: ${fl.bonding}. Antibonding electrons: ${fl.anti}.`,
              `Bond order $= \\dfrac{${fl.bonding} - ${fl.anti}}{2} = ${Kit.boText(fl.bo)}$.`,
            ],
          };
        },
      },
      {
        id: 'magnetic',
        title: 'Paramagnetic or diamagnetic?',
        make(r) {
          const d = r.pick(D());
          const fl = Kit.fill(d.el, d.charge);
          return {
            q: `Is $${Kit.tex(d.id)}$ paramagnetic or diamagnetic?`,
            choices: ['Paramagnetic', 'Diamagnetic'], answer: fl.para ? 0 : 1,
            steps: [
              `Fill ${fl.n} valence electrons from the bottom: $${Kit.configTex(fl)}$.`,
              fl.para ? `The top level leaves ${fl.unpaired} unpaired electron${fl.unpaired > 1 ? 's' : ''}, following Hund's rule. So it is paramagnetic.` : 'Every electron is paired. So it is diamagnetic.',
            ],
          };
        },
      },
      {
        id: 'unpaired',
        title: 'Count unpaired electrons',
        make(r) {
          const d = r.pick(D());
          const fl = Kit.fill(d.el, d.charge);
          return {
            q: `How many unpaired electrons does $${Kit.tex(d.id)}$ have, according to MO theory?`,
            answer: fl.unpaired, tol: 0, answerText: String(fl.unpaired),
            hint: 'In the two $\\pi$ orbitals, place one electron in each before pairing.',
            steps: [`Filling: $${Kit.configTex(fl)}$.`, `That leaves ${fl.unpaired} unpaired electron${fl.unpaired === 1 ? '' : 's'}.`],
          };
        },
      },
      {
        id: 'rank-o2',
        title: 'Rank by bond length',
        make(r) {
          const set = r.pick([['O2^+', 'O2', 'O2^-', 'O2^2-'], ['O2^+', 'O2', 'O2^-'], ['O2', 'O2^-', 'O2^2-'], ['N2', 'N2^+'], ['O2', 'F2'], ['N2', 'O2', 'F2']]);
          const list = set.map((id) => ({ id, fl: Kit.fill(Kit.diatomic(id).el, Kit.diatomic(id).charge) }));
          const longest = list.reduce((a, b) => (b.fl.bo < a.fl.bo ? b : a));
          const askLong = r.pick([true, false]);
          const shortest = list.reduce((a, b) => (b.fl.bo > a.fl.bo ? b : a));
          const ans = askLong ? longest : shortest;
          return {
            q: `Which of these has the ${askLong ? 'longest' : 'shortest'} bond: ${set.map((id) => `$${Kit.tex(id)}$`).join(', ')}?`,
            choices: set.map((id) => `$${Kit.tex(id)}$`), answer: set.indexOf(ans.id),
            steps: [
              `Bond orders: ${list.map((x) => `$${Kit.tex(x.id)}$ ${Kit.boText(x.fl.bo)}`).join(', ')}.`,
              'A higher bond order means a shorter, stronger bond.',
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'Sigma bond', back: 'Head-on overlap, with electrons on the line between the nuclei. Every bond has exactly one.' },
      { front: 'Pi bond', back: 'Side-by-side overlap of p orbitals, with electrons above and below the axis. Adds to a sigma, and stops rotation.' },
      { front: 'Groups to hybridization', back: '2 groups sp, 3 groups $sp^2$, 4 groups $sp^3$. Count one hybrid orbital per electron group.' },
      { front: 'Why hybridize?', back: 'Pure s and p orbitals do not point the right way. Mixing them gives equal orbitals pointing where VSEPR says.' },
      { front: 'Bond order in MO theory', back: '(Bonding electrons minus antibonding electrons) divided by 2.' },
      { front: 'The MO order switch', back: 'Through $\\ce{N2}$, $\\pi_{2p}$ is below $\\sigma_{2p}$. From $\\ce{O2}$ on, $\\sigma_{2p}$ is below $\\pi_{2p}$.' },
      { front: 'Paramagnetic versus diamagnetic', back: 'Paramagnetic has unpaired electrons and is attracted to a magnet. Diamagnetic has all electrons paired.' },
      { front: 'Why is $\\ce{O2}$ paramagnetic?', back: 'Two electrons occupy the two $\\pi^*$ orbitals singly, following Hund\'s rule.' },
    ],

    terms: [
      { term: 'Valence bond theory', def: 'A picture of bonds as overlapping atomic orbitals.' },
      { term: 'Sigma bond', def: 'A bond with electron density along the axis between two nuclei.' },
      { term: 'Pi bond', def: 'A bond formed by side-by-side overlap, with density above and below the axis.' },
      { term: 'Hybridization', def: 'Mixing atomic orbitals on one atom to make a set of equal new orbitals.' },
      { term: 'Hybrid orbital', def: 'A mixed orbital such as $sp^3$, pointing where an electron group goes.' },
      { term: 'Molecular orbital', def: 'An orbital that belongs to the whole molecule, formed by combining atomic orbitals.' },
      { term: 'Bonding orbital', def: 'A lower-energy molecular orbital with electron density between the nuclei.' },
      { term: 'Antibonding orbital', def: 'A higher-energy molecular orbital with a node between the nuclei, marked with a star.' },
      { term: 'Bond order', def: 'In MO theory, half of the difference between bonding and antibonding electrons.' },
      { term: 'Paramagnetic', def: 'Attracted to a magnet, because the substance has unpaired electrons.' },
      { term: 'Diamagnetic', def: 'Weakly pushed away from a magnet, because all electrons are paired.' },
    ],
  });
})();
