/* Question bank for 10.1 Intermolecular forces. Boiling points are at 1 atm, rounded to the nearest degree. */
(function () {
  'use strict';
  /* strongest: 'LDF', 'DD', 'HB'. Every molecule also has London dispersion. */
  const MOLS = [
    { f: 'CH4', name: 'methane', top: 'LDF', why: 'It is symmetric and nonpolar, so London dispersion is all it has.' },
    { f: 'CO2', name: 'carbon dioxide', top: 'LDF', why: 'Its C=O bonds are polar, but they point in opposite directions and cancel, so the molecule is nonpolar.' },
    { f: 'I2', name: 'iodine', top: 'LDF', why: 'Two identical atoms share electrons evenly, so the molecule is nonpolar.' },
    { f: 'CCl4', name: 'carbon tetrachloride', top: 'LDF', why: 'Four polar C&ndash;Cl bonds point to the corners of a tetrahedron and cancel, so the molecule is nonpolar.' },
    { f: 'C6H14', name: 'hexane', top: 'LDF', why: 'It is a hydrocarbon. C&ndash;H bonds are nearly nonpolar.' },
    { f: 'HCl', name: 'hydrogen chloride', top: 'DD', why: 'It is polar, but its H is bonded to Cl, which is not N, O or F.' },
    { f: 'H2S', name: 'hydrogen sulfide', top: 'DD', why: 'It is bent and polar, but its H is bonded to S, which is not N, O or F.' },
    { f: 'SO2', name: 'sulfur dioxide', top: 'DD', why: 'It is bent, so its bond dipoles do not cancel. It has no H at all.' },
    { f: 'CH3F', name: 'fluoromethane', top: 'DD', why: 'It is polar, and it contains H and F, but the H atoms are bonded to C, not to F.' },
    { f: 'CH3OCH3', name: 'dimethyl ether', top: 'DD', why: 'It is polar with a bent C&ndash;O&ndash;C, but every H is bonded to C, not to O.' },
    { f: 'CH2O', name: 'formaldehyde', top: 'DD', why: 'It is polar, but both H atoms are bonded to C, not to O.' },
    { f: 'H2O', name: 'water', top: 'HB', why: 'Its H atoms are bonded directly to O.' },
    { f: 'NH3', name: 'ammonia', top: 'HB', why: 'Its H atoms are bonded directly to N.' },
    { f: 'HF', name: 'hydrogen fluoride', top: 'HB', why: 'Its H is bonded directly to F.' },
    { f: 'CH3OH', name: 'methanol', top: 'HB', why: 'It has an O&ndash;H group: one H is bonded directly to O.' },
    { f: 'C2H5OH', name: 'ethanol', top: 'HB', why: 'It has an O&ndash;H group: one H is bonded directly to O.' },
    { f: 'CH3NH2', name: 'methylamine', top: 'HB', why: 'It has N&ndash;H bonds: two H atoms are bonded directly to N.' },
  ];
  const NAME = { LDF: 'London dispersion', DD: 'Dipole-dipole', HB: 'Hydrogen bonding' };

  /* Pairs with a clear reason. Real boiling points in °C. */
  const PAIRS = [
    { a: ['H2O', 100], b: ['H2S', -60], why: 'Water has hydrogen bonding. $\\ce{H2S}$ only has dipole-dipole and London forces, even though it is heavier.' },
    { a: ['HF', 20], b: ['HCl', -85], why: 'HF has hydrogen bonding because its H is on F. HCl only has dipole-dipole and London forces.' },
    { a: ['NH3', -33], b: ['CH4', -161], why: 'Ammonia has hydrogen bonding. Methane has only London forces.' },
    { a: ['I2', 184], b: ['Br2', 59], why: 'Both are nonpolar, so London forces decide. Iodine has the bigger electron cloud.' },
    { a: ['Br2', 59], b: ['Cl2', -34], why: 'Both are nonpolar, so London forces decide. Bromine has the bigger electron cloud.' },
    { a: ['Cl2', -34], b: ['F2', -188], why: 'Both are nonpolar, so London forces decide. Chlorine has the bigger electron cloud.' },
    { a: ['C5H12', 36], b: ['C3H8', -42], why: 'Both are nonpolar alkanes. Pentane is longer, with a bigger electron cloud and more surface to touch.' },
    { a: ['C8H18', 126], b: ['C6H14', 69], why: 'Both are nonpolar alkanes. Octane is longer, so its London forces are stronger.' },
    { a: ['C2H5OH', 78], b: ['C3H8', -42], why: 'Ethanol has hydrogen bonding. Propane has about the same mass but only London forces.' },
    { a: ['CH3OH', 65], b: ['CH4', -161], why: 'Methanol has hydrogen bonding through its O&ndash;H. Methane has only London forces.' },
    { a: ['Xe', -108], b: ['Ar', -186], why: 'Noble gases have only London forces. Xenon has the bigger electron cloud.' },
    { a: ['Cl2', -34], b: ['HCl', -85], why: 'A surprise: $\\ce{Cl2}$ is nonpolar and still boils higher, because its bigger electron cloud gives stronger London forces than the small dipole of HCl adds.' },
    { a: ['C8H18', 126], b: ['H2O', 100], why: 'A surprise: octane has no hydrogen bonding, but its long chain makes London forces strong enough to keep it liquid past 100 °C.' },
  ];
  const ce = (f) => `$\\ce{${f}}$`;
  const deg = (n) => `$${n}\\ ^\\circ\\text{C}$`;

  /* Sets for ranking: already sorted lowest first, with a reason. */
  const FAMILIES = [
    { list: [['CH4', -161], ['NH3', -33], ['H2O', 100]], why: 'Methane has only London forces. Water and ammonia both hydrogen bond, and water makes more hydrogen bonds per molecule.' },
    { list: [['CH4', -161], ['HCl', -85], ['HF', 20]], why: 'London only, then dipole-dipole, then hydrogen bonding.' },
    { list: [['F2', -188], ['Cl2', -34], ['Br2', 59]], why: 'All nonpolar, so size decides.' },
    { list: [['Cl2', -34], ['Br2', 59], ['I2', 184]], why: 'All nonpolar, so size decides.' },
    { list: [['Ar', -186], ['Kr', -153], ['Xe', -108]], why: 'Noble gases have only London forces, so size decides.' },
    { list: [['CH4', -161], ['C3H8', -42], ['C5H12', 36]], why: 'All nonpolar alkanes, so the longest wins.' },
    { list: [['C3H8', -42], ['CH3OH', 65], ['H2O', 100]], why: 'Propane has no hydrogen bonding. Water has the most hydrogen bonds per molecule.' },
    { list: [['H2S', -60], ['C2H5OH', 78], ['H2O', 100]], why: '$\\ce{H2S}$ cannot hydrogen bond. Ethanol can, through one O&ndash;H. Water can through two.' },
  ];

  Bank.add('imf', {
    quiz: [
      {
        q: 'What is inside the bubbles in boiling water?',
        options: ['Hydrogen gas and oxygen gas', 'Water vapor, made of whole $\\ce{H2O}$ molecules', 'Air that was dissolved in the water', 'Separate H atoms and O atoms'],
        answer: 1,
        why: 'Boiling only overcomes the forces between molecules. The $\\ce{O-H}$ bonds stay whole, so the bubbles hold $\\ce{H2O}$ vapor.',
      },
      {
        q: 'Which force does every molecule have, without exception?',
        options: ['Hydrogen bonding', 'Dipole-dipole', 'London dispersion', 'Ion-dipole'],
        answer: 2,
        why: 'Every molecule has electrons that can slosh, so every molecule has London dispersion forces. The others need a dipole, an N&ndash;H, O&ndash;H or F&ndash;H bond, or an ion.',
      },
      {
        q: 'Which of these molecules hydrogen bonds with itself?',
        options: ['$\\ce{CH3F}$', '$\\ce{CH3OCH3}$', '$\\ce{CH3OH}$', '$\\ce{CH2O}$'],
        answer: 2,
        why: 'Only $\\ce{CH3OH}$ has an H bonded directly to N, O or F. In the other three, every H is bonded to carbon.',
      },
      {
        q: '$\\ce{H2S}$ is heavier than $\\ce{H2O}$, yet water boils at 100 °C and $\\ce{H2S}$ at &minus;60 °C. Why?',
        options: ['Water molecules are bigger', 'Water has hydrogen bonding and $\\ce{H2S}$ does not', 'The $\\ce{O-H}$ bond is stronger than the $\\ce{S-H}$ bond', '$\\ce{H2S}$ is nonpolar'],
        answer: 1,
        why: 'Boiling depends on forces between molecules, so the bond strength inside them is beside the point. Water hydrogen bonds. $\\ce{H2S}$ is polar but has no H on N, O or F.',
      },
      {
        q: '$\\ce{Cl2}$ boils at &minus;34 °C and HCl at &minus;85 °C. Why does the nonpolar one boil higher?',
        options: ['$\\ce{Cl2}$ has hydrogen bonds', '$\\ce{Cl2}$ has a much bigger electron cloud, so stronger London forces', 'HCl is actually nonpolar', 'Heavier molecules always have ionic forces'],
        answer: 1,
        why: '$\\ce{Cl2}$ has 34 electrons and HCl has 18. Here the extra London force outweighs the small dipole of HCl.',
      },
      {
        q: 'Why does ice float on liquid water?',
        options: ['Ice has air trapped in it', 'Molecules in ice have more mass', 'Hydrogen bonds hold ice in an open pattern, so it is less dense', 'Cold things always rise'],
        answer: 2,
        why: 'The open hydrogen-bonded pattern gives ice more volume for the same mass. Lower density means it floats.',
      },
      {
        q: 'A molecule at the surface of water feels a net pull in which direction?',
        options: ['Into the liquid', 'Up into the air', 'Sideways only', 'No direction: forces cancel as they do in the middle'],
        answer: 0,
        why: 'A surface molecule has neighbors beside and below it, but none above. That unbalanced inward pull is surface tension.',
      },
      {
        q: 'Water climbs up a thin glass tube, but mercury is pushed down. What explains the difference?',
        options: ['Mercury is too heavy to move', 'Water has more adhesion to glass than cohesion, and mercury has more cohesion than adhesion', 'Water has weaker forces than glass', 'Mercury is nonpolar so it cannot touch glass'],
        answer: 1,
        why: 'Water sticks to glass better than to itself, so it climbs. Mercury sticks to itself far more than to glass, so it pulls away.',
      },
      {
        q: 'Which liquid would you expect to pour most slowly?',
        options: ['Hexane, $\\ce{C6H14}$', 'Ethanol, with one O&ndash;H', 'Water, with two O&ndash;H', 'Glycerol, with three O&ndash;H on one molecule'],
        answer: 3,
        why: 'Viscosity rises with stronger forces. Three O&ndash;H groups on one molecule make glycerol about 1400 times more viscous than water.',
      },
      {
        q: 'When $\\ce{Na+}$ dissolves in water, which end of each nearby water molecule points at the ion?',
        options: ['The oxygen end, since it is partly negative', 'The hydrogen end, since it is partly positive', 'It points randomly', 'Neither: the water molecules bond covalently to Na'],
        answer: 0,
        why: 'Opposites attract. The partly negative oxygen faces the positive ion. This is an ion-dipole force.',
      },
      {
        q: 'Pentane and neopentane have the same formula, $\\ce{C5H12}$. Pentane is a long chain and boils at 36 °C. Neopentane is compact and boils at 10 °C. Why?',
        options: ['Pentane has hydrogen bonding', 'Neopentane is polar', 'A long chain has more surface touching its neighbors, so stronger London forces', 'Pentane has more electrons'],
        answer: 2,
        why: 'Same electrons, different shape. Long chains lie alongside each other with more contact than compact balls do.',
      },
      {
        q: 'Which process breaks covalent bonds?',
        options: ['Boiling water', 'Melting ice', 'Dry ice turning to gas', 'Passing electricity through water to make $\\ce{H2}$ and $\\ce{O2}$'],
        answer: 3,
        why: 'Only electrolysis changes $\\ce{H2O}$ into other substances. The rest are phase changes, and every molecule stays whole.',
      },
    ],

    gens: [
      {
        id: 'strongest',
        title: 'Find the strongest force',
        make(r) {
          const m = r.pick(MOLS);
          const opts = r.mc(NAME[m.top], Object.values(NAME).filter((n) => n !== NAME[m.top]).concat(['Ionic bonding']));
          return {
            q: `What is the strongest intermolecular force in pure ${m.name}, ${ce(m.f)}?`,
            choices: opts.choices, answer: opts.answer,
            hint: 'First: is it polar? Second: is an H bonded directly to N, O or F?',
            steps: [
              'Every molecule has London dispersion.',
              m.why,
              `So the strongest force is <b>${NAME[m.top].toLowerCase()}</b>.`,
            ],
          };
        },
      },
      {
        id: 'h-bond',
        title: 'Can it hydrogen bond?',
        make(r) {
          const m = r.pick(MOLS);
          const yes = m.top === 'HB';
          return {
            q: `Does ${m.name}, ${ce(m.f)}, hydrogen bond with itself?`,
            choices: ['Yes', 'No'], answer: yes ? 0 : 1,
            hint: 'Look at what each H is bonded to.',
            steps: [
              'Hydrogen bonding needs an H bonded directly to N, O or F.',
              m.why,
              yes ? 'So <b>yes</b>.' : 'So <b>no</b>.',
            ],
          };
        },
      },
      {
        id: 'higher-bp',
        title: 'Which boils higher?',
        make(r) {
          const p = r.pick(PAIRS);
          const flip = r.next() < 0.5;
          const first = flip ? p.b : p.a, second = flip ? p.a : p.b;
          return {
            q: `Which has the higher boiling point, ${ce(first[0])} or ${ce(second[0])}?`,
            choices: [ce(first[0]), ce(second[0])], answer: flip ? 1 : 0,
            hint: 'Compare the strongest force first. If they tie, the bigger electron cloud wins.',
            steps: [p.why, `Real data: ${ce(p.a[0])} boils at ${deg(p.a[1])} and ${ce(p.b[0])} at ${deg(p.b[1])}.`],
          };
        },
      },
      {
        id: 'rank',
        title: 'Rank three boiling points',
        make(r) {
          const fam = r.pick(FAMILIES);
          const [x, y, z] = fam.list;
          const fmt = (a, b, c) => `${ce(a[0])} &lt; ${ce(b[0])} &lt; ${ce(c[0])}`;
          const right = fmt(x, y, z);
          const opts = r.mc(right, [fmt(z, y, x), fmt(y, x, z), fmt(x, z, y), fmt(z, x, y)]);
          const asked = r.shuffle(fam.list).map(([f]) => ce(f)).join(', ');
          return {
            q: `Rank ${asked} from lowest boiling point to highest.`,
            choices: opts.choices, answer: opts.answer,
            hint: 'Sort by strongest force, then by size.',
            steps: [fam.why, `Real data: ${fam.list.map(([f, t]) => `${ce(f)} ${deg(t)}`).join(', ')}.`],
          };
        },
      },
      {
        id: 'boil-energy',
        title: 'Energy to boil versus to break',
        make(r) {
          const g = r.num(5, 200, 1);
          const M = Bank.molarMass('H2O');
          const n = g / M;
          const boil = n * 40.7, brk = n * 2 * 463;
          const askBreak = r.next() < 0.5;
          const ans = askBreak ? brk : boil;
          return {
            q: askBreak
              ? `How many kJ would it take to break <b>every O&ndash;H bond</b> in ${g} g of water? The O&ndash;H bond enthalpy is 463 kJ/mol.`
              : `How many kJ does it take to <b>boil</b> ${g} g of water at 100 °C? $\\Delta H_\\text{vap} = 40.7$ kJ/mol.`,
            answer: ans, unit: 'kJ',
            hint: askBreak ? 'Find moles of water, then remember each molecule has 2 O&ndash;H bonds.' : 'Find moles, then multiply by the heat of vaporization.',
            steps: [
              `Moles of water: $${g} \\div ${M.toFixed(2)} = ${Lab.sig(n, 3)}$ mol.`,
              askBreak
                ? `Each molecule has 2 bonds: $${Lab.sig(n, 3)} \\times 2 \\times 463 = ${Lab.sig(brk, 3)}$ kJ. That is about 23 times what boiling costs.`
                : `Multiply: $${Lab.sig(n, 3)} \\times 40.7 = ${Lab.sig(boil, 3)}$ kJ. This only overcomes hydrogen bonds. No covalent bonds break.`,
            ],
          };
        },
      },
      {
        id: 'what-breaks',
        title: 'What must be overcome?',
        make(r) {
          const c = r.pick([
            { s: 'boil liquid ammonia, $\\ce{NH3}$', a: 'Hydrogen bonds between molecules', why: 'Ammonia has H on N, and boiling only separates whole molecules.' },
            { s: 'melt ice', a: 'Hydrogen bonds between molecules', why: 'Water has H on O. The $\\ce{O-H}$ bonds stay whole.' },
            { s: 'boil liquid methane, $\\ce{CH4}$', a: 'London dispersion forces between molecules', why: 'Methane is nonpolar, so London forces are all there is to overcome.' },
            { s: 'sublime dry ice, $\\ce{CO2}$', a: 'London dispersion forces between molecules', why: 'Linear $\\ce{CO2}$ is nonpolar. The $\\ce{C=O}$ bonds stay whole.' },
            { s: 'evaporate liquid iodine, $\\ce{I2}$', a: 'London dispersion forces between molecules', why: 'Iodine is nonpolar. The $\\ce{I-I}$ bond stays whole.' },
            { s: 'boil liquid HCl', a: 'Dipole-dipole forces between molecules', why: 'HCl is polar with no H on N, O or F. Its $\\ce{H-Cl}$ bond stays whole.' },
            { s: 'boil liquid sulfur dioxide, $\\ce{SO2}$', a: 'Dipole-dipole forces between molecules', why: 'Bent $\\ce{SO2}$ is polar and has no H. Its $\\ce{S=O}$ bonds stay whole.' },
          ]);
          const wrong = ['Covalent bonds inside the molecules', 'Ionic bonds', 'Hydrogen bonds between molecules', 'London dispersion forces between molecules', 'Dipole-dipole forces between molecules'].filter((w) => w !== c.a);
          const opts = r.mc(c.a, r.shuffle(wrong).slice(0, 3));
          return {
            q: `What is the main thing that must be overcome to ${c.s}?`,
            choices: opts.choices, answer: opts.answer,
            hint: 'A phase change never breaks the bonds inside a molecule.',
            steps: [c.why, `So the answer is: ${c.a.toLowerCase()}.`],
          };
        },
      },
    ],

    cards: [
      { front: 'Intramolecular versus intermolecular?', back: 'Intra means inside a molecule (bonds). Inter means between molecules (weak attractions).' },
      { front: 'What breaks when water boils?', back: 'Hydrogen bonds between molecules. The $\\ce{O-H}$ bonds stay whole, so the bubbles are $\\ce{H2O}$ vapor.' },
      { front: 'Which molecules have London dispersion forces?', back: 'All of them. Bigger electron clouds give stronger forces.' },
      { front: 'What does hydrogen bonding need?', back: 'An H bonded directly to N, O or F, and a lone pair on an N, O or F of a neighbor.' },
      { front: 'What is the ion-dipole force?', back: 'The attraction between an ion and the oppositely charged end of a polar molecule. It is why salts dissolve in water.' },
      { front: 'How do you rank boiling points?', back: 'Sort by the strongest force first. On a tie, the bigger (or longer) molecule wins.' },
      { front: 'Why does ice float?', back: 'Hydrogen bonds lock molecules in an open pattern, so ice is less dense than liquid water: 0.917 versus 1.000 g/mL.' },
      { front: 'What is surface tension?', back: 'The energy needed to stretch a liquid surface. Surface molecules are pulled inward because they have no neighbors above.' },
      { front: 'What is viscosity?', back: 'Resistance to flow. Stronger forces, and long tangling molecules, raise it. Heating lowers it.' },
      { front: 'What causes capillary action?', back: 'Adhesion to the tube is stronger than cohesion in the liquid, so the liquid climbs.' },
    ],

    terms: [
      { term: 'Intermolecular force', def: 'An attraction between separate molecules or between an ion and a molecule. Much weaker than a bond.' },
      { term: 'Intramolecular force', def: 'A force inside a molecule that holds its atoms together: a covalent bond.' },
      { term: 'London dispersion force', def: 'A weak attraction between temporary dipoles caused by electrons sloshing. Every molecule has it.' },
      { term: 'Dipole-dipole force', def: 'The attraction between the positive end of one polar molecule and the negative end of another.' },
      { term: 'Hydrogen bond', def: 'A strong dipole-dipole attraction between an H bonded to N, O or F and a lone pair on a nearby N, O or F. It is not a true bond.' },
      { term: 'Ion-dipole force', def: 'The attraction between an ion and a polar molecule.' },
      { term: 'Polarizability', def: 'How easily an electron cloud can be distorted. Larger clouds are more polarizable.' },
      { term: 'Surface tension', def: 'The energy needed to increase the surface area of a liquid.' },
      { term: 'Viscosity', def: 'A liquid\'s resistance to flow.' },
      { term: 'Capillary action', def: 'A liquid climbing a thin tube because adhesion to the tube beats cohesion in the liquid.' },
      { term: 'Cohesion', def: 'Attraction between molecules of the same substance.' },
      { term: 'Adhesion', def: 'Attraction between molecules of a liquid and a different substance, such as glass.' },
    ],
  });
})();
