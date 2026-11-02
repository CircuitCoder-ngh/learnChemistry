/* Question bank for 8.2 Covalent bonds and polarity, plus CovalentKit: the H2 potential, bond data, polarity. */
(function () {
  'use strict';
  const Kit = (window.CovalentKit = {});
  /* A Morse potential for H2. r in pm, energy in kJ/mol. Minimum at 74 pm and -436 kJ/mol. */
  Kit.H2 = { De: 436, r0: 74, a: 0.0194 };
  Kit.morse = (r) => { const { De, r0, a } = Kit.H2, x = 1 - Math.exp(-a * (r - r0)); return De * (x * x - 1); };
  Kit.morseSlope = (r) => { const { De, r0, a } = Kit.H2, e = Math.exp(-a * (r - r0)); return 2 * De * a * (1 - e) * e; };

  /* Average bond data. Lengths in pm, energies in kJ/mol. Values vary a little by molecule and by source. */
  Kit.FAMILIES = {
    'C-C': { a: 'C', b: 'C', rows: [[1, 154, 347], [2, 134, 614], [3, 120, 839]] },
    'C-N': { a: 'C', b: 'N', rows: [[1, 147, 305], [2, 129, 615], [3, 116, 891]] },
    'C-O': { a: 'C', b: 'O', rows: [[1, 143, 358], [2, 123, 745], [3, 113, 1072]] },
    'N-N': { a: 'N', b: 'N', rows: [[1, 145, 160], [2, 125, 418], [3, 110, 941]] },
    'O-O': { a: 'O', b: 'O', rows: [[1, 148, 146], [2, 121, 495]] },
  };
  /* Hydrogen halides and H2, for the single-bond trend. */
  Kit.HX = [['H-H', 74, 436], ['H-F', 92, 567], ['H-Cl', 127, 431], ['H-Br', 141, 366], ['H-I', 161, 299]];

  /* Cutoffs vary by textbook. These follow OpenStax: below 0.4 nonpolar, up to 1.8 polar, above that ionic. */
  Kit.CUT = { low: 0.4, high: 1.8 };
  Kit.diff = (a, b) => +Math.abs(window.EL[a].en - window.EL[b].en).toFixed(2); // Rounded so N-O is exactly 0.40, not 0.3999...
  Kit.classify = (a, b) => { const d = Kit.diff(a, b); return d < Kit.CUT.low ? 'nonpolar' : d <= Kit.CUT.high ? 'polar' : 'ionic'; };
  Kit.LABEL = { nonpolar: 'Nonpolar covalent', polar: 'Polar covalent', ionic: 'Ionic' };
  Kit.negEnd = (a, b) => (window.EL[a].en >= window.EL[b].en ? a : b);

  /* ---------- Question bank ---------- */
  const EN = (e) => window.EL[e].en;
  const PAIRS = [['H', 'H'], ['Cl', 'Cl'], ['C', 'H'], ['N', 'H'], ['O', 'H'], ['H', 'Cl'], ['H', 'F'], ['C', 'O'], ['C', 'Cl'], ['S', 'O'], ['N', 'O'], ['C', 'S'], ['Na', 'Cl'], ['K', 'F'], ['Li', 'F'], ['Mg', 'O'], ['Na', 'F'], ['Si', 'O'], ['P', 'Cl'], ['Al', 'Cl']];
  const NAME = { 1: 'single', 2: 'double', 3: 'triple' };
  const symbol = { 1: '-', 2: '=', 3: '≡' };

  Bank.add('covalent', {
    quiz: [
      {
        q: 'What holds two atoms together in a covalent bond?',
        options: ['Their nuclei attract each other', 'Both nuclei attract the shared electrons between them', 'The electrons repel the nuclei', 'A metal gives an electron to a nonmetal'],
        answer: 1,
        why: 'The shared pair sits between the nuclei, and both positive nuclei pull on it. The nuclei themselves repel, which is why they stop at a set distance.',
      },
      {
        q: 'On the energy curve for $\\ce{H2}$, what does the lowest point of the curve tell you?',
        options: ['Where the atoms are farthest apart', 'The bond length and the bond energy', 'Where the nuclei touch', 'The temperature of the gas'],
        answer: 1,
        why: 'The minimum sits at the bond length (74 pm for $\\ce{H2}$). Its depth is the bond energy, 436 kJ/mol.',
      },
      {
        q: 'What happens if you push two bonded H atoms closer than the bond length?',
        options: ['The bond gets stronger', 'The energy drops further', 'The energy rises because the nuclei repel', 'Nothing changes'],
        answer: 2,
        why: 'Closer than 74 pm, the nuclei repel strongly and the energy climbs steeply. The bottom of the well is the balance point.',
      },
      {
        q: 'Which bond is the shortest?',
        options: ['C-C', 'C=C', 'C≡C', 'They are all the same length'],
        answer: 2,
        why: 'More shared pairs pull the nuclei closer: 154 pm, then 134 pm, then 120 pm.',
      },
      {
        q: 'A C=C double bond (614 kJ/mol) compared with a C-C single bond (347 kJ/mol) is:',
        options: ['Exactly twice as strong', 'More than twice as strong', 'Stronger, but less than twice as strong', 'Weaker'],
        answer: 2,
        why: '$2 \\times 347 = 694$, and 614 is less than that. The second pair of electrons adds less strength than the first.',
      },
      {
        q: 'In an H-F bond, where do the shared electrons spend more time?',
        options: ['Closer to H', 'Closer to F', 'Exactly in the middle', 'They have transferred entirely to H'],
        answer: 1,
        why: 'F is the most electronegative element, 3.98 against 2.20 for H. So F pulls harder and has a partial negative charge.',
      },
      {
        q: 'Which bond is the most polar?',
        options: ['C-H', 'N-H', 'O-H', 'H-H'],
        answer: 2,
        why: 'Differences: C-H 0.35, N-H 0.84, O-H 1.24, H-H 0. The biggest difference is the most polar.',
      },
      {
        q: 'Which correctly shows the bond dipole for H-Cl?',
        options: ['An arrow pointing at H, with the cross by Cl', 'An arrow pointing at Cl, with the cross by H', 'No arrow, since it is a covalent bond', 'Arrows in both directions'],
        answer: 1,
        why: 'The arrow points toward the more electronegative atom, and the cross marks the positive end. Cl (3.16) is more electronegative than H (2.20).',
      },
    ],

    gens: [
      {
        id: 'diff',
        title: 'Electronegativity difference',
        make(r) {
          const [a, b] = r.pick(PAIRS.filter((p) => p[0] !== p[1]));
          const d = Kit.diff(a, b);
          return {
            q: `Find the electronegativity difference for the ${a}-${b} bond. Use ${a} = ${EN(a)} and ${b} = ${EN(b)}.`,
            answer: d, tol: 0.015, answerText: d.toFixed(2),
            hint: 'Subtract the smaller value from the larger one.',
            steps: [`$|${EN(a)} - ${EN(b)}| = ${d.toFixed(2)}$.`],
          };
        },
      },
      {
        id: 'classify',
        title: 'Classify the bond',
        make(r) {
          const [a, b] = r.pick(PAIRS);
          const d = Kit.diff(a, b), kind = Kit.classify(a, b);
          const order = ['nonpolar', 'polar', 'ionic'];
          return {
            q: `Classify the bond between ${a} and ${b}. Use ${a} = ${EN(a)} and ${b} = ${EN(b)}. Use cutoffs of about 0.4 and 1.8.`,
            choices: order.map((k) => Kit.LABEL[k]), answer: order.indexOf(kind),
            steps: [
              `Difference: $|${EN(a)} - ${EN(b)}| = ${d.toFixed(2)}$.`,
              d < 0.4 ? 'Below 0.4, the sharing is close to equal.' : d <= 1.8 ? 'Between 0.4 and 1.8, the sharing is unequal.' : 'Above 1.8, the electrons have effectively moved over.',
              `So this is ${Kit.LABEL[kind].toLowerCase()}. Cutoffs vary between textbooks, so values near them can be called either way.`,
            ],
          };
        },
      },
      {
        id: 'negative',
        title: 'Which end is negative?',
        make(r) {
          const [a, b] = r.pick(PAIRS.filter((p) => Kit.classify(p[0], p[1]) === 'polar'));
          const neg = Kit.negEnd(a, b);
          return {
            q: `Which atom carries the partial negative charge ($\\delta-$) in the ${a}-${b} bond?`,
            choices: [a, b], answer: neg === a ? 0 : 1,
            steps: [
              `Electronegativity: ${a} = ${EN(a)}, ${b} = ${EN(b)}.`,
              `The more electronegative atom pulls the shared electrons closer. So ${neg} is $\\delta-$ and the other atom is $\\delta+$. The dipole arrow points toward ${neg}.`,
            ],
          };
        },
      },
      {
        id: 'rank',
        title: 'Bond length and strength',
        make(r) {
          const fam = r.pick(Object.keys(Kit.FAMILIES));
          const F = Kit.FAMILIES[fam];
          const rows = F.rows;
          const askShort = r.pick([true, false]);
          const lab = (row) => `${F.a}${symbol[row[0]]}${F.b}`;
          const ansRow = askShort ? rows[rows.length - 1] : rows[rows.length - 1];
          const opts = rows.map(lab);
          return {
            q: askShort ? `Which of these bonds is the shortest: ${opts.join(', ')}?` : `Which of these bonds is the strongest: ${opts.join(', ')}?`,
            choices: opts, answer: rows.indexOf(ansRow),
            steps: [
              'More shared pairs pull the nuclei closer and hold them more tightly.',
              rows.map((row) => `${lab(row)}: ${row[1]} pm, ${row[2]} kJ/mol`).join('; ') + '.',
            ],
          };
        },
      },
      {
        id: 'energy',
        title: 'Energy to break bonds',
        make(r) {
          const rows = [['H-H', 436, 'H2'], ['N≡N', 941, 'N2'], ['O=O', 495, 'O2'], ['H-Cl', 431, 'HCl'], ['H-F', 567, 'HF']];
          const [lab, E, f] = r.pick(rows);
          const n = r.num(0.1, 4, 2);
          const ans = n * E;
          return {
            q: `The ${lab} bond energy is ${E} kJ/mol. How much energy does it take to break all the bonds in ${n} mol of $\\ce{${f}}$?`,
            answer: ans, unit: 'kJ', tol: 0.02,
            hint: 'Bond energy is given per mole of bonds, so multiply by the moles.',
            steps: [`$${n}\\ \\cancel{\\text{mol}} \\times \\dfrac{${E}\\text{ kJ}}{1\\ \\cancel{\\text{mol}}} = ${Lab.sig(ans, 3)}\\text{ kJ}$.`],
          };
        },
      },
      {
        id: 'bonds',
        title: 'How many bonds does it usually make?',
        make(r) {
          const e = r.pick(['H', 'C', 'N', 'O', 'F', 'Cl', 'S', 'P', 'Si', 'Br']);
          const g = window.EL[e].group, v = g <= 2 ? g : g - 10;
          const n = e === 'H' ? 1 : 8 - v;
          return {
            q: `How many covalent bonds does a neutral ${window.EL[e].name.toLowerCase()} atom usually form?`,
            answer: n, tol: 0, answerText: String(n),
            hint: 'It shares until it sees 8 electrons, or 2 for hydrogen.',
            steps: [e === 'H' ? 'Hydrogen has 1 electron and wants 2, so it forms 1 bond.' : `${e} has ${v} valence electrons and wants 8, so it needs ${n} more: ${n} bond${n === 1 ? '' : 's'}.`],
          };
        },
      },
    ],

    cards: [
      { front: 'What is a covalent bond?', back: 'A shared pair of electrons, attracted to both nuclei at once.' },
      { front: 'What sets the bond length?', back: 'The distance where attraction and repulsion balance and the energy is lowest.' },
      { front: 'What is bond energy?', back: 'The energy needed to break one mole of a bond. For $\\ce{H2}$, 436 kJ/mol.' },
      { front: 'More bonds between two atoms means...', back: 'Shorter and stronger, but the strength does not simply double. C=C is less than twice C-C.' },
      { front: 'What is electronegativity?', back: 'How strongly an atom pulls on shared electrons. Highest at the top right of the table, F at 3.98.' },
      { front: 'How do you classify a bond?', back: 'Find the electronegativity difference. About below 0.4 is nonpolar, 0.4 to 1.8 is polar, above 1.8 is ionic. Cutoffs vary by book.' },
      { front: 'What does a dipole arrow show?', back: 'It points to the more electronegative atom. The cross is at the positive end.' },
    ],

    terms: [
      { term: 'Covalent bond', def: 'A bond made of electrons shared between two atoms.' },
      { term: 'Bond length', def: 'The distance between two bonded nuclei at the lowest energy point.' },
      { term: 'Bond energy', def: 'The energy needed to break one mole of a bond in the gas phase.' },
      { term: 'Bond order', def: 'The number of shared pairs between two atoms: 1, 2 or 3.' },
      { term: 'Electronegativity', def: 'A measure of how strongly an atom in a bond pulls on the shared electrons.' },
      { term: 'Nonpolar covalent bond', def: 'A bond with electrons shared about equally.' },
      { term: 'Polar covalent bond', def: 'A bond with electrons shared unequally, giving partial charges.' },
      { term: 'Dipole', def: 'Separated positive and negative charge, shown with an arrow pointing to the negative end.' },
      { term: 'Partial charge', def: 'A charge smaller than one full electron, written with $\\delta+$ or $\\delta-$.' },
    ],
  });
})();
