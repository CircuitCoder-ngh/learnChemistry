/* Question bank for 0 How to see chemistry. */
(function () {
  /* Sizes in meters. Typical values; real hairs and cells vary. */
  const SIZES = [
    { name: 'a person (height)', m: 1.7, power: 0 },
    { name: 'a human hair (width)', m: 7e-5, power: -5 },
    { name: 'a red blood cell', m: 7.5e-6, power: -6 },
    { name: 'a hemoglobin molecule', m: 5.5e-9, power: -9 },
    { name: 'a water molecule', m: 3e-10, power: -10 },
    { name: 'an oxygen nucleus', m: 5e-15, power: -15 },
  ];
  const VIEW_ITEMS = [
    ['A beaker of water starts to bubble.', 'Macroscopic'],
    ['A blue flame heats the bottom of a flask.', 'Macroscopic'],
    ['A piece of iron turns orange and flaky.', 'Macroscopic'],
    ['The liquid in the tube turns from clear to blue.', 'Macroscopic'],
    ['A white solid settles at the bottom of a test tube.', 'Macroscopic'],
    ['The balloon gets bigger when you warm it.', 'Macroscopic'],
    ['Water molecules slide past one another.', 'Particle'],
    ['Two hydrogen atoms bond to one oxygen atom.', 'Particle'],
    ['Gas molecules zip around and hit the walls.', 'Particle'],
    ['Sodium ions and chloride ions sit in a repeating grid.', 'Particle'],
    ['Atoms in the solid vibrate in place.', 'Particle'],
    ['Methane molecules collide with oxygen molecules.', 'Particle'],
    ['$\\ce{CH4 + 2O2 -> CO2 + 2H2O}$', 'Symbolic'],
    ['$\\ce{H2O(l) -> H2O(g)}$', 'Symbolic'],
    ['$\\ce{NaCl(aq)}$', 'Symbolic'],
    ['$\\ce{2H2 + O2 -> 2H2O}$', 'Symbolic'],
    ['$\\ce{CO2(g)}$', 'Symbolic'],
    ['$\\ce{Fe2O3(s)}$', 'Symbolic'],
  ];
  const WHY = {
    Macroscopic: 'It describes something you could see or measure directly with your own senses or a simple tool.',
    Particle: 'It describes what individual atoms, molecules or ions are doing. Nobody can see that directly.',
    Symbolic: 'It uses chemical formulas: the written code for substances and reactions.',
  };
  const CROWD = [
    ['Liquid water feels wet.', 'crowd', 'Wetness comes from huge numbers of molecules interacting with your skin.'],
    ['Copper metal looks orange and shiny.', 'crowd', 'Color and shine come from enormous numbers of atoms sharing electrons. One atom has no shine.'],
    ['Ice melts at 0 °C.', 'crowd', 'Melting means molecules slip out of a solid pattern. One molecule has no pattern to leave.'],
    ['Water boils at 100 °C at normal pressure.', 'crowd', 'Boiling is about a crowd of molecules pulling apart from each other.'],
    ['Gold has a density of 19.3 g/mL.', 'crowd', 'Density is measured on a sample with a mass and a volume. It is a property of the bulk material.'],
    ['Iron is hard.', 'crowd', 'Hardness comes from the way huge numbers of atoms hold on to each other.'],
    ['A water molecule contains 2 H atoms and 1 O atom.', 'one', 'This is true of each molecule, one at a time.'],
    ['An oxygen atom has 8 protons.', 'one', 'Every single oxygen atom has 8 protons in its nucleus.'],
    ['A carbon dioxide molecule has one carbon atom bonded to two oxygen atoms.', 'one', 'This is a statement about one molecule.'],
    ['A methane molecule has 4 hydrogen atoms around a carbon atom.', 'one', 'This describes a single molecule.'],
    ['A helium atom has 2 electrons.', 'one', 'This is true of each single atom.'],
    ['A hydrogen atom has 1 proton.', 'one', 'This is true of each single atom.'],
  ];
  const texSci = (m) => {
    const e = Math.floor(Math.log10(m) + 1e-9), mant = m / Math.pow(10, e);
    const nice = mant === Math.round(mant) ? String(mant) : mant.toFixed(1);
    return `${nice} \\times 10^{${e}}`;
  };

  Bank.add('start', {
    quiz: [
      {
        q: 'Which is the best one-line description of chemistry?',
        options: ['The science of what matter is made of and how it changes', 'The study of colorful liquids in glass flasks', 'The study of living things', 'The study of energy and motion only'],
        answer: 0,
        why: 'Chemistry covers the makeup of all matter and how it changes, whether or not a flask is involved.',
      },
      {
        q: 'A student writes $\\ce{CO2(g)}$ in a notebook. Which view is that?',
        options: ['Macroscopic', 'Particle', 'Symbolic', 'None of these'],
        answer: 2,
        why: 'A formula is the symbolic view. It stands for the particles, but it is a written code.',
      },
      {
        q: 'Which statement is written in the particle view?',
        options: ['The solution turned blue', 'The water molecules move faster as the temperature rises', 'The flask feels warm', '$\\ce{H2O(l) -> H2O(g)}$'],
        answer: 1,
        why: 'Only this one describes what molecules are doing. Blue and warm are what you observe, and the equation is symbolic.',
      },
      {
        q: 'Is one single water molecule wet?',
        options: ['Yes, water is wet at every scale', 'Yes, but only when it is warm', 'No, wetness belongs to huge crowds of molecules', 'No, because a molecule is a solid'],
        answer: 2,
        why: 'Wetness, color and boiling point are properties of the bulk. Do not give one particle the properties of the crowd.',
      },
      {
        q: 'How many hydrogen atoms are in $\\ce{2H2O}$?',
        options: ['2', '3', '4', '6'],
        answer: 2,
        why: 'Two molecules, each with 2 H atoms: $2 \\times 2 = 4$. A common slip is adding the numbers instead of multiplying.',
      },
      {
        q: 'Put these in order from largest to smallest.',
        options: ['Hair, cell, atom, nucleus', 'Cell, hair, nucleus, atom', 'Hair, atom, cell, nucleus', 'Atom, nucleus, cell, hair'],
        answer: 0,
        why: 'A hair is about $7 \\times 10^{-5}$ m wide, a red blood cell about $7.5 \\times 10^{-6}$ m, an atom about $10^{-10}$ m and a nucleus about $10^{-15}$ m.',
      },
      {
        q: 'About how wide is an atom?',
        options: ['$10^{-3}$ m', '$10^{-6}$ m', '$10^{-10}$ m', '$10^{-23}$ m'],
        answer: 2,
        why: 'Atoms are around $10^{-10}$ m across. Chemists often quote this as 0.1 nm, or about 100 pm.',
      },
      {
        q: 'How many times smaller is $10^{-9}$ m than $10^{-6}$ m?',
        options: ['3 times', '30 times', '1,000 times', '1,000,000 times'],
        answer: 2,
        why: 'Subtract the exponents: $-6 - (-9) = 3$, and $10^{3} = 1000$. Each power of ten is a factor of ten.',
      },
    ],

    gens: [
      {
        id: 'which-view',
        title: 'Which view is it?',
        make(r) {
          const [text, view] = r.pick(VIEW_ITEMS);
          const choices = ['Macroscopic', 'Particle', 'Symbolic'];
          return {
            q: `Which view is this? ${text}`,
            choices, answer: choices.indexOf(view),
            steps: [`This is the <b>${view.toLowerCase()}</b> view. ${WHY[view]}`],
          };
        },
      },
      {
        id: 'size-power',
        title: 'Match the scale',
        make(r) {
          const s = r.pick(SIZES);
          const fmt = (o) => `$${texSci(o.m)}$ m`;
          const others = r.shuffle(SIZES.filter((o) => o !== s && o.m !== s.m)).slice(0, 3);
          const m = r.mc(fmt(s), others.map(fmt));
          return {
            q: `About how big is ${s.name}?`,
            choices: m.choices, answer: m.answer,
            steps: [`${s.name[0].toUpperCase() + s.name.slice(1)} is about ${fmt(s)}. Real sizes vary, so learn the rough scale, not the exact value.`],
          };
        },
      },
      {
        id: 'bigger',
        title: 'Which is bigger?',
        make(r) {
          const [a, b] = r.shuffle(SIZES.slice(1));
          const big = a.m > b.m ? a : b;
          const m = { choices: [a.name, b.name], answer: a.m > b.m ? 0 : 1 };
          return {
            q: `Which is larger: ${a.name} or ${b.name}?`,
            choices: m.choices, answer: m.answer,
            steps: [`${a.name[0].toUpperCase() + a.name.slice(1)} is about $${texSci(a.m)}$ m. ${b.name[0].toUpperCase() + b.name.slice(1)} is about $${texSci(b.m)}$ m.`, `Compare the exponents first. The answer is ${big.name}.`],
          };
        },
      },
      {
        id: 'power-ratio',
        title: 'How many times bigger?',
        make(r) {
          const hi = r.int(-4, 1), gap = r.int(1, 9), lo = hi - gap;
          const ratio = Math.pow(10, gap);
          return {
            q: `How many times larger is $10^{${hi}}$ m than $10^{${lo}}$ m?`,
            answer: ratio, unit: 'times', tol: 0.001, answerText: gap < 5 ? ratio.toLocaleString('en-US') : `10^${gap}`,
            hint: 'To divide powers of ten, subtract the exponents.',
            steps: [
              `Divide the larger by the smaller: $\\dfrac{10^{${hi}}}{10^{${lo}}} = 10^{${hi} - (${lo})} = 10^{${gap}}$.`,
              `That is ${ratio.toLocaleString('en-US')} times larger.`,
            ],
          };
        },
      },
      {
        id: 'count-atoms',
        title: 'Count the atoms',
        make(r) {
          const [f, sym, k] = r.pick([['H2O', 'H', 2], ['H2O', 'O', 1], ['CO2', 'O', 2], ['CO2', 'C', 1], ['CH4', 'H', 4], ['NH3', 'H', 3], ['O2', 'O', 2], ['H2SO4', 'O', 4], ['H2SO4', 'H', 2], ['C6H12O6', 'C', 6], ['C2H6O', 'H', 6]]);
          const n = r.int(2, 6);
          const name = EL[sym].name.toLowerCase();
          return {
            q: `How many ${name} atoms are in $\\ce{${n}${f}}$?`,
            answer: n * k, unit: 'atoms', tol: 0.001, sf: 2, answerText: String(n * k),
            hint: 'The coefficient counts molecules. The subscript counts atoms in one molecule.',
            steps: [
              `The coefficient says there are ${n} molecules. Each has ${k} ${sym} ${k === 1 ? 'atom' : 'atoms'}.`,
              `Multiply: $${n} \\times ${k} = ${n * k}$ ${sym} atoms.`,
            ],
          };
        },
      },
      {
        id: 'crowd-or-one',
        title: 'Crowd or one particle?',
        make(r) {
          const [s, kind, why] = r.pick(CROWD);
          const choices = ['True of one particle', 'Only true of a huge crowd'];
          return {
            q: `Where does this statement apply? ${s}`,
            choices, answer: kind === 'one' ? 0 : 1,
            steps: [why],
          };
        },
      },
    ],

    cards: [
      { front: 'What is chemistry?', back: 'The science of what matter is made of and how it changes.' },
      { front: 'What is matter?', back: 'Anything that has mass and takes up space.' },
      { front: 'What are the three views of chemistry?', back: 'Macroscopic (what you see), particle or submicroscopic (what atoms do), and symbolic (formulas and equations).' },
      { front: 'In $\\ce{3H2O}$, what does the 3 count?', back: 'Whole molecules. It is called the coefficient.' },
      { front: 'In $\\ce{3H2O}$, what does the small 2 count?', back: 'H atoms in one molecule. It is called the subscript.' },
      { front: 'What do $(s)$, $(l)$, $(g)$ and $(aq)$ mean?', back: 'Solid, liquid, gas, and dissolved in water.' },
      { front: 'About how wide is an atom? A nucleus?', back: 'An atom is about $10^{-10}$ m. A nucleus is about $10^{-15}$ m.' },
      { front: 'Is one water molecule wet?', back: 'No. Wetness, color and boiling point are properties of huge crowds of particles.' },
    ],

    terms: [
      { term: 'Chemistry', def: 'The science of what matter is made of and how it changes.' },
      { term: 'Matter', def: 'Anything that has mass and takes up space.' },
      { term: 'Atom', def: 'The smallest piece of an element that is still that element.' },
      { term: 'Molecule', def: 'Two or more atoms held together by covalent bonds, acting as one unit.' },
      { term: 'Element', def: 'A substance made of only one kind of atom. There are 118 known.' },
      { term: 'Chemical reaction', def: 'A process in which atoms change partners and new substances form.' },
      { term: 'Macroscopic view', def: 'Chemistry as you can see, touch and measure it directly.' },
      { term: 'Particle view', def: 'Chemistry as atoms, molecules and ions. Also called the submicroscopic view.' },
      { term: 'Symbolic view', def: 'Chemistry written in formulas and equations.' },
      { term: 'Coefficient', def: 'The large number in front of a formula. It counts whole molecules or formula units.' },
      { term: 'Subscript', def: 'The small number after an atom in a formula. It counts that atom in one molecule or formula unit.' },
      { term: 'Nucleus', def: 'The tiny, dense center of an atom, made of protons and neutrons.' },
    ],
  });
})();
