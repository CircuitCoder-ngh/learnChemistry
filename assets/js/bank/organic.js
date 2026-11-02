/* Question bank for 18 A first look at organic chemistry. */
(function () {
  const PRE = ['meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct'];
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const fC = (n) => (n === 1 ? 'C' : 'C' + n);
  const alkaneF = (n) => `${fC(n)}H${2 * n + 2}`;

  Bank.add('organic', {
    quiz: [
      {
        q: 'How many covalent bonds does carbon make in nearly all organic molecules?',
        options: ['2', '3', '4', '6'],
        answer: 2,
        why: 'Carbon has 4 valence electrons and needs 4 more for an octet, so it shares 4 pairs. A double bond counts as 2 of them.',
      },
      {
        q: 'What is the shape of methane, and what is its H-C-H bond angle?',
        options: ['Flat square, 90°', 'Tetrahedral, 109.5°', 'Trigonal planar, 120°', 'Pyramid, 107°'],
        answer: 1,
        why: 'Four bonds around carbon point to the corners of a tetrahedron, at 109.5°. The 90° cross is only how we draw it on paper.',
      },
      {
        q: 'What is the formula of hexane?',
        options: ['$\\ce{C6H6}$', '$\\ce{C6H12}$', '$\\ce{C6H14}$', '$\\ce{C5H12}$'],
        answer: 2,
        why: 'Hex means 6 carbons, and -ane means $\\ce{C_{n}H_{2n+2}}$: $2(6) + 2 = 14$ hydrogens.',
      },
      {
        q: 'Which molecule is unsaturated?',
        options: ['$\\ce{C2H6}$', '$\\ce{C3H8}$', '$\\ce{C4H10}$', '$\\ce{C2H4}$'],
        answer: 3,
        why: '$\\ce{C2H4}$ fits $\\ce{C_{n}H_{2n}}$ and has a C=C double bond. The other three fit $\\ce{C_{n}H_{2n+2}}$, so they are saturated alkanes.',
      },
      {
        q: 'Which molecule can rotate freely around its carbon-carbon bond?',
        options: ['Ethane', 'Ethene', 'Both of them', 'Neither of them'],
        answer: 0,
        why: 'Ethane has a single sigma bond, which keeps overlapping as it turns. In ethene, the pi bond of the C=C would have to break for it to twist.',
      },
      {
        q: 'Ethanol, $\\ce{CH3CH2OH}$, and dimethyl ether, $\\ce{CH3OCH3}$, are:',
        options: ['The same molecule, drawn in two ways', 'Isomers', 'Isotopes', 'Both alcohols'],
        answer: 1,
        why: 'Both are $\\ce{C2H6O}$, but the atoms connect differently, so they are isomers. Ethanol boils at 78 °C and dimethyl ether at −24 °C.',
      },
      {
        q: 'A student draws butane in a straight line and then with a bend in the middle. What are these two drawings?',
        options: ['The same molecule', 'Isomers', 'An alkane and an alkene', 'Different compounds with different boiling points'],
        answer: 0,
        why: 'The connections have not changed. Single bonds rotate, so a chain can bend without becoming a new compound.',
      },
      {
        q: 'Vinegar is a dilute solution of acetic acid, $\\ce{CH3COOH}$. Which functional group makes it acidic?',
        options: ['Hydroxyl alone, as in an alcohol', 'Carbonyl alone, as in a ketone', 'Carboxyl, $\\ce{-COOH}$', 'Amine, $\\ce{-NH2}$'],
        answer: 2,
        why: 'The carboxyl group gives up the $\\ce{H+}$ on its OH. That C=O next door makes it far more acidic than an alcohol.',
      },
      {
        q: 'What is the correct name of $\\ce{CH3CH(CH3)CH3}$?',
        options: ['Butane', '2-methylpropane', '1-methylpropane', '3-methylpropane'],
        answer: 1,
        why: 'The longest chain has 3 carbons, so the parent is propane. A methyl branch sits on carbon 2. Its formula is $\\ce{C4H10}$, which makes it an isomer of butane, not butane itself.',
      },
    ],

    gens: [
      {
        id: 'name',
        title: 'Name the alkane',
        make(r) {
          const n = r.int(1, 8);
          const name = PRE[n - 1] + 'ane';
          return {
            q: `What is the name of the straight-chain alkane with ${n} carbon${n > 1 ? 's' : ''}, $\\ce{${alkaneF(n)}}$?`,
            accept: [name], placeholder: 'Name',
            steps: [
              `${n} carbon${n > 1 ? 's' : ''} means the prefix ${PRE[n - 1]}-.`,
              `All single bonds means the ending -ane. Together: ${name}.`,
            ],
          };
        },
      },
      {
        id: 'formula',
        title: 'Write the formula',
        make(r) {
          const n = r.int(2, 8);
          const fam = r.pick(['ane', 'ene', 'yne']);
          const name = (n >= 4 && fam !== 'ane' ? '1-' : '') + PRE[n - 1] + fam;
          const H = fam === 'ane' ? 2 * n + 2 : fam === 'ene' ? 2 * n : 2 * n - 2;
          const rule = fam === 'ane' ? '2n + 2' : fam === 'ene' ? '2n' : '2n - 2';
          const calc = fam === 'ane' ? `2(${n}) + 2` : fam === 'ene' ? `2(${n})` : `2(${n}) - 2`;
          const f = `C${n}H${H}`;
          return {
            q: `Write the molecular formula of ${name}.`,
            accept: [f], placeholder: 'Formula, such as C2H6',
            hint: 'Find the carbons from the prefix, and the family from the ending.',
            steps: [
              `${cap(PRE[n - 1])}- means ${n} carbons, and -${fam} means an ${fam === 'ane' ? 'alkane' : fam === 'ene' ? 'alkene' : 'alkyne'}.`,
              `Hydrogens: $${rule}$ gives $${calc} = ${H}$.`,
              `The formula is $\\ce{${f}}$.`,
            ],
          };
        },
      },
      {
        id: 'family',
        title: 'Pick the family',
        make(r) {
          const n = r.int(2, 8);
          const fam = r.pick(['ane', 'ene', 'yne']);
          const H = fam === 'ane' ? 2 * n + 2 : fam === 'ene' ? 2 * n : 2 * n - 2;
          const right = fam === 'ane' ? 'Alkane, saturated' : fam === 'ene' ? 'Alkene, unsaturated' : 'Alkyne, unsaturated';
          const m = r.mc(right, ['Alkane, saturated', 'Alkene, unsaturated', 'Alkyne, unsaturated', 'Alkane, unsaturated'].filter((x) => x !== right));
          return {
            q: `An open-chain hydrocarbon has the formula $\\ce{C${n}H${H}}$, with at most one multiple bond. What family is it in?`,
            ...m,
            steps: [
              `Compare the hydrogens with $n = ${n}$: an alkane would have $2n + 2 = ${2 * n + 2}$, an alkene $2n = ${2 * n}$, and an alkyne $2n - 2 = ${2 * n - 2}$.`,
              `It has ${H}, so it is ${right.toLowerCase().replace(', ', ' and ')}.`,
            ],
          };
        },
      },
      {
        id: 'angle',
        title: 'Shape around carbon',
        make(r) {
          const set = [
            ['methane', '$\\ce{CH4}$', 'single', 'Tetrahedral, 109.5°', 4],
            ['ethane', '$\\ce{CH3CH3}$', 'single', 'Tetrahedral, 109.5°', 4],
            ['propane', '$\\ce{CH3CH2CH3}$', 'single', 'Tetrahedral, 109.5°', 4],
            ['ethene', '$\\ce{CH2=CH2}$', 'double', 'Trigonal planar, about 120°', 3],
            ['propene', '$\\ce{CH2=CHCH3}$ (the first two carbons)', 'double', 'Trigonal planar, about 120°', 3],
            ['ethyne', '$\\ce{HC#CH}$', 'triple', 'Linear, 180°', 2],
            ['propyne', '$\\ce{HC#CCH3}$ (the first two carbons)', 'triple', 'Linear, 180°', 2],
          ];
          const [name, f, kind, right, groups] = r.pick(set);
          const m = r.mc(right, ['Tetrahedral, 109.5°', 'Trigonal planar, about 120°', 'Linear, 180°', 'Square planar, 90°'].filter((x) => x !== right));
          return {
            q: `What is the shape around carbon in ${name}, ${f}?`,
            ...m,
            steps: [
              `Count electron groups on that carbon, with a multiple bond counting as one group: ${kind} bonds here give ${groups} groups.`,
              `${groups} groups means ${right.toLowerCase()}.`,
            ],
          };
        },
      },
      {
        id: 'isomer',
        title: 'Isomers or not?',
        make(r) {
          const pairs = [
            ['$\\ce{CH3CH2CH2CH3}$', '$\\ce{CH3CH(CH3)CH3}$', 'iso', 'Both are $\\ce{C4H10}$, but one has a chain of 4 and the other a chain of 3 with a branch.'],
            ['$\\ce{CH3CH2OH}$', '$\\ce{CH3OCH3}$', 'iso', 'Both are $\\ce{C2H6O}$. One has a C-O-H and the other has C-O-C.'],
            ['$\\ce{CH3CH2CHO}$', '$\\ce{CH3COCH3}$', 'iso', 'Both are $\\ce{C3H6O}$. One is an aldehyde and the other is a ketone.'],
            ['$\\ce{CH3COOH}$', '$\\ce{HCOOCH3}$', 'iso', 'Both are $\\ce{C2H4O2}$. One is an acid and the other is an ester.'],
            ['$\\ce{CH3CH2CH2OH}$', '$\\ce{CH3CH(OH)CH3}$', 'iso', 'Both are $\\ce{C3H8O}$, with the OH on different carbons.'],
            ['$\\ce{CH3CH2CH2CH3}$', '$\\ce{CH3(CH2)2CH3}$', 'same', 'Both are a single unbroken chain of 4 carbons: butane, written two ways.'],
            ['$\\ce{CH3CH2CH3}$', '$\\ce{CH3CH2CH2CH3}$', 'diff', 'One is $\\ce{C3H8}$ and the other is $\\ce{C4H10}$, so the formulas differ.'],
            ['$\\ce{C2H6}$', '$\\ce{C2H4}$', 'diff', 'The hydrogen counts differ, so these are different compounds and not isomers.'],
            ['$\\ce{CH3CH(CH3)CH2CH3}$', '$\\ce{CH3CH2CH(CH3)CH3}$', 'same', 'Both are 2-methylbutane. One is just written from the other end.'],
          ];
          const [a, b, kind, why] = r.pick(pairs);
          const right = kind === 'iso' ? 'Isomers' : kind === 'same' ? 'The same molecule' : 'Different compounds that are not isomers';
          const m = r.mc(right, ['Isomers', 'The same molecule', 'Different compounds that are not isomers'].filter((x) => x !== right));
          return {
            q: `How are ${a} and ${b} related?`,
            ...m,
            steps: ['First compare molecular formulas. Then compare how the atoms connect.', why],
          };
        },
      },
      {
        id: 'branch',
        title: 'Name a branched alkane',
        make(r) {
          const set = [
            ['CH3CH(CH3)CH3', '2-methylpropane', ['butane', '1-methylpropane', '2-methylbutane'], 'The longest chain is 3 carbons, so the parent is propane. The methyl is on carbon 2.'],
            ['CH3CH(CH3)CH2CH3', '2-methylbutane', ['pentane', '3-methylbutane', '2-methylpropane'], 'The longest chain is 4 carbons. Counting from the nearer end, the methyl is on carbon 2, not 3.'],
            ['CH3CH(CH3)CH2CH2CH3', '2-methylpentane', ['hexane', '4-methylpentane', '2-methylbutane'], 'The longest chain is 5 carbons. Counting from the nearer end, the methyl is on carbon 2, not 4.'],
            ['CH3CH2CH(CH3)CH2CH3', '3-methylpentane', ['hexane', '2-ethylbutane', '3-methylbutane'], 'The longest chain is 5 carbons, and the methyl is on carbon 3 from either end.'],
            ['CH3C(CH3)2CH3', '2,2-dimethylpropane', ['pentane', '2-methylbutane', '1,1-dimethylpropane'], 'The longest chain is 3 carbons. Two methyl groups sit on carbon 2, which is what 2,2-dimethyl means.'],
            ['CH3CH(CH3)CH(CH3)CH3', '2,3-dimethylbutane', ['hexane', '2-methylpentane', '1,2-dimethylbutane'], 'The longest chain is 4 carbons, with one methyl on carbon 2 and one on carbon 3.'],
          ];
          const [f, right, wrong, why] = r.pick(set);
          const m = r.mc(right, wrong);
          return {
            q: `What is the correct name of $\\ce{${f}}$?`,
            ...m,
            steps: ['Find the longest unbroken chain. Groups in parentheses are branches.', why, `The name is ${right}.`],
          };
        },
      },
      {
        id: 'group',
        title: 'Spot the functional group',
        make(r) {
          const set = [
            ['$\\ce{CH3CH2CH2OH}$', 'Alcohol', 'It has an OH on a carbon.'],
            ['$\\ce{CH3OH}$', 'Alcohol', 'It has an OH on a carbon.'],
            ['$\\ce{CH3OCH2CH3}$', 'Ether', 'An O sits between two carbons, with no H on it.'],
            ['$\\ce{CH3CH2CHO}$', 'Aldehyde', 'CHO means C=O at the end of a chain, with an H on the carbon.'],
            ['$\\ce{HCHO}$', 'Aldehyde', 'CHO means C=O at the end of a chain, with an H on the carbon.'],
            ['$\\ce{CH3COCH3}$', 'Ketone', 'CO between two carbons is a mid-chain C=O.'],
            ['$\\ce{CH3CH2COCH3}$', 'Ketone', 'CO between two carbons is a mid-chain C=O.'],
            ['$\\ce{CH3CH2COOH}$', 'Carboxylic acid', 'COOH is a C=O and an OH on the same carbon.'],
            ['$\\ce{HCOOH}$', 'Carboxylic acid', 'COOH is a C=O and an OH on the same carbon.'],
            ['$\\ce{CH3COOCH3}$', 'Ester', 'COO with a carbon on both sides is an ester.'],
            ['$\\ce{CH3CH2COOCH2CH3}$', 'Ester', 'COO with a carbon on both sides is an ester.'],
            ['$\\ce{CH3CH2NH2}$', 'Amine', 'NH2 on a carbon is an amine.'],
            ['$\\ce{CH3NH2}$', 'Amine', 'NH2 on a carbon is an amine.'],
          ];
          const [f, right, why] = r.pick(set);
          const all = ['Alcohol', 'Ether', 'Aldehyde', 'Ketone', 'Carboxylic acid', 'Ester', 'Amine'];
          const m = r.mc(right, r.shuffle(all.filter((x) => x !== right)).slice(0, 3));
          return { q: `Which family does ${f} belong to?`, ...m, steps: [why] };
        },
      },
      {
        id: 'combustion',
        title: 'Balance the burn',
        make(r) {
          const n = r.int(1, 8);
          const H = 2 * n + 2;
          // n C atoms, H/2 waters, n + H/4 O2.
          let k = 1;
          const twice = 2 * n + H / 2; // O atoms on the right
          if (twice % 2) k = 2;
          const fuel = k, O2 = (twice * k) / 2, CO2 = n * k, H2O = (H / 2) * k;
          const name = PRE[n - 1] + 'ane';
          const coef = (c, s) => (c === 1 ? s : c + s);
          return {
            q: `Balance the complete combustion of ${name}, $\\ce{${alkaneF(n)}}$, with the smallest whole numbers. What is the coefficient of $\\ce{O2}$?`,
            answer: O2, tol: 0, answerText: String(O2),
            hint: 'Balance C, then H, then O last. If oxygen needs a fraction, double everything.',
            steps: [
              `Carbon: ${n} C atom${n > 1 ? 's' : ''} make $${n}\\ \\ce{CO2}$.`,
              `Hydrogen: ${H} H atoms make $${H / 2}\\ \\ce{H2O}$.`,
              `Oxygen on the right: $${n}(2) + ${H / 2}(1) = ${twice}$ O atoms, so you need $${twice}/2 = ${twice / 2}\\ \\ce{O2}$.`,
              k === 2 ? `That is a fraction, so double everything: ${twice}/2 becomes ${twice}.` : 'That is already a whole number.',
              `$\\ce{${coef(fuel, alkaneF(n))} + ${coef(O2, 'O2')} -> ${coef(CO2, 'CO2')} + ${coef(H2O, 'H2O')}}$, so the coefficient is ${O2}.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'Why does carbon make four bonds?', back: 'It has 4 valence electrons and shares 4 more to reach an octet.' },
      { front: 'What are the alkane prefixes for 1 to 8 carbons?', back: 'Meth, eth, prop, but, pent, hex, hept, oct.' },
      { front: 'What is the general formula of an alkane?', back: '$\\ce{C_{n}H_{2n+2}}$. An alkene is $\\ce{C_{n}H_{2n}}$ and an alkyne is $\\ce{C_{n}H_{2n-2}}$.' },
      { front: 'What does saturated mean?', back: 'All carbon-carbon bonds are single, so the molecule holds as many hydrogens as it can.' },
      { front: 'What are isomers?', back: 'Molecules with the same molecular formula but different connections between atoms.' },
      { front: 'What are the angles around carbon with single, double and triple bonds?', back: 'About 109.5° with all single bonds, about 120° at a double bond, and 180° at a triple bond.' },
      { front: 'Which functional group is in vinegar?', back: 'The carboxyl group, $\\ce{-COOH}$. Vinegar is a dilute solution of acetic acid.' },
      { front: 'Aldehyde or ketone: where is the C=O?', back: 'At the end of the chain in an aldehyde, and in the middle in a ketone.' },
      { front: 'What does a hydrocarbon make when it burns completely?', back: '$\\ce{CO2}$ and $\\ce{H2O}$. Balance C first, then H, then O.' },
    ],

    terms: [
      { term: 'Organic chemistry', def: 'The chemistry of carbon compounds, especially those with carbon-hydrogen bonds.' },
      { term: 'Hydrocarbon', def: 'A compound made of only carbon and hydrogen.' },
      { term: 'Alkane', def: 'A hydrocarbon with only single bonds. General formula $\\ce{C_{n}H_{2n+2}}$.' },
      { term: 'Alkene', def: 'A hydrocarbon with a carbon-carbon double bond. For one double bond in an open chain, $\\ce{C_{n}H_{2n}}$.' },
      { term: 'Alkyne', def: 'A hydrocarbon with a carbon-carbon triple bond. For one triple bond in an open chain, $\\ce{C_{n}H_{2n-2}}$.' },
      { term: 'Saturated', def: 'Holding as many hydrogens as possible, with only single carbon-carbon bonds.' },
      { term: 'Unsaturated', def: 'Having at least one carbon-carbon double or triple bond.' },
      { term: 'Isomers', def: 'Compounds with the same molecular formula but different arrangements of atoms.' },
      { term: 'Functional group', def: 'A cluster of atoms in a molecule that largely sets how it reacts.' },
      { term: 'Methyl group', def: 'A one-carbon branch, $\\ce{-CH3}$.' },
      { term: 'Ethyl group', def: 'A two-carbon branch, $\\ce{-CH2CH3}$.' },
      { term: 'Alcohol', def: 'An organic compound with an OH group on a carbon. Name ending -ol.' },
      { term: 'Ether', def: 'An organic compound with an oxygen between two carbons.' },
      { term: 'Aldehyde', def: 'An organic compound with a C=O at the end of a chain. Name ending -al.' },
      { term: 'Ketone', def: 'An organic compound with a C=O between two carbons. Name ending -one.' },
      { term: 'Carboxylic acid', def: 'An organic acid with a $\\ce{-COOH}$ group. Name ending -oic acid.' },
      { term: 'Ester', def: 'An organic compound with a $\\ce{-COO-}$ group between two carbon groups. Name ending -oate.' },
      { term: 'Amine', def: 'An organic compound with nitrogen bonded to carbon, such as $\\ce{-NH2}$.' },
    ],
  });
})();
