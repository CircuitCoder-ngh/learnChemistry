/* Question bank for 3.1 The mole. */
Bank.add('mole', {
  quiz: [
    {
      q: 'What does one mole of something mean?',
      options: ['$6.022 \\times 10^{23}$ of that thing', '1 gram of that thing', '12 of that thing', 'As much of it as fits in a beaker'],
      answer: 0,
      why: 'A mole is a count, just like a dozen. It is always $6.022 \\times 10^{23}$ things.',
    },
    {
      q: 'Which contains the same number of particles as 1 mole of gold atoms?',
      options: ['1 gram of water', '1 mole of water molecules', '197 moles of water molecules', '197 grams of water'],
      answer: 1,
      why: 'One mole of anything has the same count. Gold being heavier changes the mass, not the number.',
    },
    {
      q: 'What is the molar mass of $\\ce{Mg(NO3)2}$? Use Mg = 24.31, N = 14.01, O = 16.00.',
      options: ['86.32 g/mol', '102.32 g/mol', '148.33 g/mol', '134.32 g/mol'],
      answer: 2,
      why: 'The 2 multiplies everything inside the parentheses: $24.31 + 2(14.01) + 6(16.00) = 148.33$.',
    },
    {
      q: 'To go from grams of a substance to the number of atoms, you must:',
      options: ['Multiply grams by Avogadro\'s number', 'Divide by molar mass, then multiply by Avogadro\'s number', 'Multiply by molar mass, then divide by Avogadro\'s number', 'Divide grams by Avogadro\'s number'],
      answer: 1,
      why: 'Grams to moles first, dividing by molar mass. Then moles to atoms, multiplying by Avogadro\'s number.',
    },
    {
      q: 'Which sample has the most atoms: 10 g of hydrogen, 10 g of carbon, or 10 g of iron?',
      options: ['Hydrogen', 'Carbon', 'Iron', 'They all match, since the mass is the same'],
      answer: 0,
      why: 'The lightest atom gives the most atoms per gram. Convert to moles: 10 g of H is about 9.9 mol, C is 0.83 mol, Fe is 0.18 mol.',
    },
    {
      q: 'How many moles of oxygen atoms are in 3 mol of $\\ce{CO2}$?',
      options: ['2 mol', '3 mol', '5 mol', '6 mol'],
      answer: 3,
      why: 'Each $\\ce{CO2}$ has 2 oxygen atoms, so $3 \\times 2 = 6$ mol of O atoms.',
    },
  ],

  gens: [
    {
      id: 'molar-mass',
      title: 'Molar mass',
      make(r) {
        const f = r.pick(['H2O', 'CO2', 'NH3', 'CH4', 'NaCl', 'KBr', 'CaCO3', 'MgCl2', 'Al2O3', 'H2SO4', 'HNO3', 'Ca(OH)2', 'Mg(OH)2', 'Fe2O3', 'C2H6O', 'C6H12O6', 'Na2SO4', 'Al(NO3)3', 'Ca3(PO4)2']);
        const counts = Bank.countAtoms(f);
        // Add the atomic masses as written in the steps, so the working really leads to the answer. Hydrogen keeps its third decimal.
        const am = (e) => (e === 'H' ? 1.008 : +EL[e].mass.toFixed(2));
        const M = Object.keys(counts).reduce((a, e) => a + counts[e] * am(e), 0);
        const parts = Object.keys(counts).map((e) => `${counts[e]}(${e === 'H' ? '1.008' : am(e).toFixed(2)})`);
        return {
          q: `Find the molar mass of $\\ce{${f}}$.`,
          answer: M, unit: 'g/mol', tol: 0.01, answerText: M.toFixed(2),
          hint: 'Count every atom, remembering a number after parentheses multiplies everything inside.',
          steps: [
            `Count atoms: ${Object.keys(counts).map((e) => `${counts[e]} ${e}`).join(', ')}.`,
            `Add them up: $${parts.join(' + ')} = ${M.toFixed(2)}$ g/mol.`,
          ],
        };
      },
    },
    {
      id: 'g-to-mol',
      title: 'Grams to moles',
      make(r) {
        const f = r.pick(['H2O', 'CO2', 'NaCl', 'CaCO3', 'NH3', 'CH4', 'Fe2O3', 'KCl', 'C6H12O6', 'H2SO4']);
        const M = Bank.molarMass(f);
        const g = r.num(M * 0.1, M * 4, 1);
        const n = g / M;
        return {
          q: `How many moles are in ${g} g of $\\ce{${f}}$?`,
          answer: n, unit: 'mol',
          hint: 'Find the molar mass, then divide the grams by it.',
          steps: [
            `Molar mass of $\\ce{${f}}$ is ${M.toFixed(2)} g/mol.`,
            `Divide so grams cancel: $${g}\\text{ g} \\times \\dfrac{1\\text{ mol}}{${M.toFixed(2)}\\text{ g}} = ${Lab.sig(n, 3)}\\text{ mol}$.`,
          ],
        };
      },
    },
    {
      id: 'mol-to-g',
      title: 'Moles to grams',
      make(r) {
        const f = r.pick(['H2O', 'CO2', 'NaCl', 'MgO', 'NH3', 'Al2O3', 'KNO3', 'CuSO4', 'C2H6O']);
        const M = Bank.molarMass(f);
        const n = r.num(0.05, 5, 2);
        const g = n * M;
        return {
          q: `What is the mass of ${n} mol of $\\ce{${f}}$?`,
          answer: g, unit: 'g',
          hint: 'Multiply moles by molar mass.',
          steps: [
            `Molar mass of $\\ce{${f}}$ is ${M.toFixed(2)} g/mol.`,
            `Multiply: $${n}\\text{ mol} \\times \\dfrac{${M.toFixed(2)}\\text{ g}}{1\\text{ mol}} = ${Lab.sig(g, 3)}\\text{ g}$.`,
          ],
        };
      },
    },
    {
      id: 'mol-to-n',
      title: 'Moles to particles',
      make(r) {
        const f = r.pick(['H2O', 'CO2', 'NH3', 'CH4', 'O2', 'N2']);
        const n = r.num(0.02, 8, 2);
        const N = n * 6.022e23;
        return {
          q: `How many molecules are in ${n} mol of $\\ce{${f}}$?`,
          answer: N, unit: 'molecules',
          hint: 'Multiply moles by $6.022 \\times 10^{23}$.',
          steps: [`Multiply by Avogadro's number: $${n} \\times 6.022 \\times 10^{23} = ${Lab.sig(N, 3).replace('×', '\\times').replace(/10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (m, e) => '10^{' + e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '-0123456789'['⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)]) + '}')}$ molecules.`],
        };
      },
    },
    {
      id: 'g-to-n',
      title: 'Grams to molecules',
      make(r) {
        const f = r.pick(['H2O', 'CO2', 'NH3', 'CH4', 'C6H12O6', 'O2']);
        const M = Bank.molarMass(f);
        const g = r.num(M * 0.2, M * 3, 1);
        const n = g / M, N = n * 6.022e23;
        return {
          q: `How many molecules are in ${g} g of $\\ce{${f}}$?`,
          answer: N, unit: 'molecules',
          hint: 'Two bridges: grams to moles, then moles to molecules.',
          steps: [
            `Grams to moles: $${g} \\div ${M.toFixed(2)} = ${Lab.sig(n, 3)}$ mol.`,
            `Moles to molecules: $${Lab.sig(n, 3)} \\times 6.022 \\times 10^{23}$ gives about ${Lab.sig(N, 3)} molecules.`,
          ],
        };
      },
    },
    {
      id: 'atoms-inside',
      title: 'Atoms inside a compound',
      make(r) {
        const [f, el, k] = r.pick([['H2O', 'H', 2], ['CO2', 'O', 2], ['NH3', 'H', 3], ['CH4', 'H', 4], ['Al2O3', 'O', 3], ['C6H12O6', 'C', 6], ['C6H12O6', 'H', 12], ['H2SO4', 'O', 4], ['Ca(OH)2', 'H', 2]]);
        const n = r.num(0.1, 3, 2);
        const atoms = n * k * 6.022e23;
        return {
          q: `How many ${EL[el].name.toLowerCase()} atoms are in ${n} mol of $\\ce{${f}}$?`,
          answer: atoms, unit: 'atoms',
          hint: `Each $\\ce{${f}}$ holds ${k} ${el} atoms. Multiply by that first.`,
          steps: [
            `Each $\\ce{${f}}$ contains ${k} ${el} atoms, so moles of ${el} is $${n} \\times ${k} = ${(n * k).toFixed(2)}$ mol.`,
            `Then multiply by Avogadro's number to get about ${Lab.sig(atoms, 3)} atoms.`,
          ],
        };
      },
    },
  ],

  cards: [
    { front: 'What is a mole?', back: '$6.022 \\times 10^{23}$ of anything. A counting word, like dozen.' },
    { front: "What is Avogadro's number?", back: '$6.022 \\times 10^{23}$ particles per mole.' },
    { front: 'What is molar mass?', back: 'The mass of one mole of a substance, in g/mol. Add up atomic masses from the periodic table.' },
    { front: 'How do you go from grams to moles?', back: 'Divide by molar mass.' },
    { front: 'How do you go from moles to particles?', back: "Multiply by Avogadro's number." },
    { front: 'How many moles of H atoms are in 1 mol of $\\ce{H2O}$?', back: '2 mol. Subscripts give mole ratios.' },
  ],

  terms: [
    { term: 'Mole', def: 'A count of $6.022 \\times 10^{23}$ things. Symbol: mol.' },
    { term: "Avogadro's number", def: 'The number of particles in one mole, $6.022 \\times 10^{23}$.' },
    { term: 'Molar mass', def: 'The mass of one mole of a substance, in g/mol. It equals the sum of the atomic masses in the formula.' },
    { term: 'Formula unit', def: 'The smallest ratio of ions in an ionic compound, such as one Na⁺ and one Cl⁻ in NaCl.' },
    { term: 'Atomic mass unit', def: 'A tiny mass unit, symbol u, equal to one twelfth of the mass of a carbon-12 atom.' },
  ],
});
