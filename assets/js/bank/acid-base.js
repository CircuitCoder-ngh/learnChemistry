/* Question bank for 5.4 Acids, bases and titration. */
(function () {
  'use strict';
  const num = (x, sf = 4) => Lab.sig(x, sf);
  /** Scientific-notation number as TeX. */
  const tex = (x, sf = 4) => {
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e >= -2 && e < 3) return x.toFixed(Math.max(0, sf - 1 - e));
    return `${(x / Math.pow(10, e)).toFixed(sf - 1)} \\times 10^{${e}}`;
  };
  // A little titration menu: equation, moles of base per mole of acid.
  const TITRATIONS = [
    { acid: 'HCl', eq: 'HCl(aq) + NaOH(aq) -> NaCl(aq) + H2O(l)', ratio: 1 },
    { acid: 'HNO3', eq: 'HNO3(aq) + NaOH(aq) -> NaNO3(aq) + H2O(l)', ratio: 1 },
    { acid: 'CH3COOH', eq: 'CH3COOH(aq) + NaOH(aq) -> NaCH3COO(aq) + H2O(l)', ratio: 1 },
    { acid: 'H2SO4', eq: 'H2SO4(aq) + 2NaOH(aq) -> Na2SO4(aq) + 2H2O(l)', ratio: 2 },
  ];
  const CONJ_BASE = [['HCl', 'Cl-'], ['HNO3', 'NO3-'], ['H2SO4', 'HSO4-'], ['HSO4-', 'SO4^2-'], ['H2O', 'OH-'], ['NH4+', 'NH3'], ['H3O+', 'H2O'], ['H2CO3', 'HCO3-'], ['HCO3-', 'CO3^2-'], ['CH3COOH', 'CH3COO-'], ['HF', 'F-'], ['H3PO4', 'H2PO4-']];
  const CONJ_ACID = [['NH3', 'NH4+'], ['OH-', 'H2O'], ['H2O', 'H3O+'], ['CO3^2-', 'HCO3-'], ['HCO3-', 'H2CO3'], ['F-', 'HF'], ['Cl-', 'HCl'], ['SO4^2-', 'HSO4-'], ['CH3COO-', 'CH3COOH']];
  // acid, base, conjugate base, conjugate acid, using a double arrow unless the acid is strong.
  const REACTIONS = [
    ['HCl', 'H2O', 'Cl-', 'H3O+', '->'], ['HNO3', 'H2O', 'NO3-', 'H3O+', '->'], ['HCl', 'NH3', 'Cl-', 'NH4+', '->'],
    ['H2O', 'NH3', 'OH-', 'NH4+', '<=>'], ['CH3COOH', 'H2O', 'CH3COO-', 'H3O+', '<=>'], ['HF', 'H2O', 'F-', 'H3O+', '<=>'],
    ['H2O', 'CO3^2-', 'OH-', 'HCO3-', '<=>'], ['HCO3-', 'H2O', 'CO3^2-', 'H3O+', '<=>'], ['H3O+', 'OH-', 'H2O', 'H2O', '->'],
    ['HF', 'NH3', 'F-', 'NH4+', '<=>'],
  ];
  const STRENGTH = [['HCl', 'strong acid'], ['HBr', 'strong acid'], ['HI', 'strong acid'], ['HNO3', 'strong acid'], ['H2SO4', 'strong acid'], ['HClO4', 'strong acid'], ['HF', 'weak acid'], ['CH3COOH', 'weak acid'], ['H2CO3', 'weak acid'], ['H3PO4', 'weak acid'], ['NaOH', 'strong base'], ['KOH', 'strong base'], ['LiOH', 'strong base'], ['Ca(OH)2', 'strong base'], ['Ba(OH)2', 'strong base'], ['NH3', 'weak base']];
  const NEUTRAL = [
    ['HCl', 'NaOH', 'NaCl', 'HCl(aq) + NaOH(aq) -> NaCl(aq) + H2O(l)'],
    ['HCl', 'KOH', 'KCl', 'HCl(aq) + KOH(aq) -> KCl(aq) + H2O(l)'],
    ['HNO3', 'KOH', 'KNO3', 'HNO3(aq) + KOH(aq) -> KNO3(aq) + H2O(l)'],
    ['H2SO4', 'NaOH', 'Na2SO4', 'H2SO4(aq) + 2NaOH(aq) -> Na2SO4(aq) + 2H2O(l)'],
    ['H2SO4', 'KOH', 'K2SO4', 'H2SO4(aq) + 2KOH(aq) -> K2SO4(aq) + 2H2O(l)'],
    ['HCl', 'Ba(OH)2', 'BaCl2', '2HCl(aq) + Ba(OH)2(aq) -> BaCl2(aq) + 2H2O(l)'],
    ['HNO3', 'Ca(OH)2', 'Ca(NO3)2', '2HNO3(aq) + Ca(OH)2(aq) -> Ca(NO3)2(aq) + 2H2O(l)'],
    ['HBr', 'LiOH', 'LiBr', 'HBr(aq) + LiOH(aq) -> LiBr(aq) + H2O(l)'],
    ['H3PO4', 'NaOH', 'Na3PO4', 'H3PO4(aq) + 3NaOH(aq) -> Na3PO4(aq) + 3H2O(l)'],
  ];
  const ce = (f) => `$\\ce{${f}}$`;

  Bank.add('acid-base', {
    quiz: [
      {
        q: 'According to Brønsted-Lowry, what does an acid do?',
        options: ['It accepts a proton', 'It donates a proton', 'It makes $\\ce{OH-}$ in water', 'It accepts an electron'],
        answer: 1,
        why: 'Acids donate $\\ce{H+}$ and bases accept it. Making $\\ce{OH-}$ in water is the Arrhenius definition of a base.',
      },
      {
        q: 'Which of these is <b>not</b> a strong acid?',
        options: ['$\\ce{HCl}$', '$\\ce{HNO3}$', '$\\ce{HF}$', '$\\ce{HClO4}$'],
        answer: 2,
        why: 'HF looks like HCl, but it is a weak acid. The strong six are HCl, HBr, HI, $\\ce{HNO3}$, $\\ce{H2SO4}$ and $\\ce{HClO4}$.',
      },
      {
        q: 'Why is $\\ce{NH3}$ a base, even though it contains no $\\ce{OH-}$?',
        options: ['It is a Brønsted-Lowry base: its lone pair accepts a proton', 'It secretly contains oxygen', 'It releases $\\ce{H+}$ in water', 'It is not really a base'],
        answer: 0,
        why: 'Ammonia takes a proton from water, making $\\ce{NH4+}$ and $\\ce{OH-}$. The Arrhenius definition misses this, and Brønsted-Lowry covers it.',
      },
      {
        q: 'What is the net ionic equation when any strong acid neutralizes any strong base?',
        options: ['$\\ce{Na+ + Cl- -> NaCl}$', '$\\ce{H+ + OH- -> H2O}$', '$\\ce{HCl + NaOH -> NaCl + H2O}$', '$\\ce{H2O -> H+ + OH-}$'],
        answer: 1,
        why: 'The salt ions are spectators. All that really happens is that protons and hydroxide ions make water. The exception is an insoluble salt: $\\ce{H2SO4}$ with $\\ce{Ba(OH)2}$ also makes solid $\\ce{BaSO4}$.',
      },
      {
        q: 'What is the difference between the equivalence point and the end point?',
        options: ['There is no difference at all', 'Equivalence is when moles of $\\ce{H+}$ equal moles of $\\ce{OH-}$. The end point is when the indicator changes color.', 'The end point always comes first', 'Equivalence is when the flask turns pink'],
        answer: 1,
        why: 'One is a chemistry fact and the other is what you see. A good indicator makes them nearly the same, a tiny bit apart.',
      },
      {
        q: 'How many moles of $\\ce{NaOH}$ does it take to neutralize 1 mole of $\\ce{H2SO4}$ completely?',
        options: ['0.5 mol', '1 mol', '2 mol', '4 mol'],
        answer: 2,
        why: 'Each $\\ce{H2SO4}$ gives two $\\ce{H+}$, and each $\\ce{NaOH}$ supplies one $\\ce{OH-}$. So the ratio is 1 to 2.',
      },
      {
        q: 'A flask of acid has been pink for a while, and more base keeps going in. What does that tell you?',
        options: ['You have gone past the end point, and the result will read too high', 'You have not reached the end point', 'The acid is getting stronger', 'The indicator has run out'],
        answer: 0,
        why: 'Pink means there is already extra $\\ce{OH-}$. Every extra drop gets counted as if it reacted, so the acid looks more concentrated than it is.',
      },
      {
        q: 'Which statement is correct?',
        options: ['A strong acid is always concentrated', 'A weak acid cannot be concentrated', 'Strong tells what fraction splits into ions, and concentrated tells how much is dissolved', 'Weak acids do not react with bases'],
        answer: 2,
        why: 'Those are two separate ideas. A weak acid still gets fully neutralized in a titration, because the base keeps pulling its protons off.',
      },
    ],

    gens: [
      {
        id: 'bl-identify',
        title: 'Spot the acid and the base',
        make(r) {
          const [a, b, ca, cb, arrow] = r.pick(REACTIONS);
          const askAcid = r.next() < 0.5;
          const list = [a, b, ca, cb].filter((v, i, l) => l.indexOf(v) === i);
          const eq = `${a} + ${b} ${arrow} ${ca} + ${cb}`;
          const correct = askAcid ? a : b;
          const mc = r.mc(ce(correct), list.filter((x) => x !== correct).map(ce));
          return {
            q: `In $\\ce{${eq}}$, which species on the left acts as the Brønsted-Lowry ${askAcid ? 'acid' : 'base'}?`,
            choices: mc.choices,
            answer: mc.answer,
            steps: [
              `Follow the proton. $\\ce{${a}}$ loses one $\\ce{H+}$ and becomes $\\ce{${ca}}$, so it is the acid.`,
              `$\\ce{${b}}$ gains one $\\ce{H+}$ and becomes $\\ce{${cb}}$, so it is the base.`,
            ],
          };
        },
      },
      {
        id: 'conjugates',
        title: 'Conjugate pairs',
        make(r) {
          const base = r.next() < 0.5;
          const [from, to] = r.pick(base ? CONJ_BASE : CONJ_ACID);
          const others = (base ? CONJ_BASE : CONJ_ACID).map((x) => x[1]).filter((x) => x !== to);
          const wrongPool = r.shuffle(others.concat(from)).filter((x) => x !== to).slice(0, 3);
          const mc = r.mc(ce(to), wrongPool.map(ce));
          return {
            q: `What is the conjugate ${base ? 'base' : 'acid'} of $\\ce{${from}}$?`,
            choices: mc.choices,
            answer: mc.answer,
            steps: [
              base ? 'To find a conjugate base, remove one $\\ce{H+}$: take away one H and lower the charge by 1.' : 'To find a conjugate acid, add one $\\ce{H+}$: add one H and raise the charge by 1.',
              `So $\\ce{${from}}$ becomes $\\ce{${to}}$.`,
            ],
          };
        },
      },
      {
        id: 'strength',
        title: 'Strong or weak?',
        make(r) {
          const [f, kind] = r.pick(STRENGTH);
          const choices = ['Strong acid', 'Weak acid', 'Strong base', 'Weak base'];
          const answer = choices.map((x) => x.toLowerCase()).indexOf(kind);
          return {
            q: `How would you classify $\\ce{${f}}$?`,
            choices,
            answer,
            steps: [
              'The six strong acids are $\\ce{HCl}$, $\\ce{HBr}$, $\\ce{HI}$, $\\ce{HNO3}$, $\\ce{H2SO4}$, $\\ce{HClO4}$. Treat any other acid as weak.',
              'Strong bases are the group 1 hydroxides and $\\ce{Ca(OH)2}$, $\\ce{Sr(OH)2}$, $\\ce{Ba(OH)2}$.',
              `So $\\ce{${f}}$ is a ${kind}.`,
            ],
          };
        },
      },
      {
        id: 'salt',
        title: 'Name the salt',
        make(r) {
          const [a, b, salt, eq] = r.pick(NEUTRAL);
          return {
            q: `$\\ce{${a}}$ is neutralized by $\\ce{${b}}$. Type the formula of the salt that forms, like NaCl.`,
            accept: [salt],
            placeholder: 'Formula',
            hint: 'The cation comes from the base and the anion from the acid. Balance their charges.',
            steps: [`The H from the acid and the OH from the base become water.`, `The leftover cation and anion make the salt: $\\ce{${salt}}$.`, `Balanced: ${eq.split(' -> ').map((side) => side.split(' + ').map(ce).join(' + ')).join(' $\\rightarrow$ ')}.`],
          };
        },
      },
      {
        id: 'titrate-molarity',
        title: 'Find the acid molarity',
        make(r) {
          const T = r.pick(TITRATIONS);
          const Va = r.pick([10, 15, 20, 25, 30, 50]);
          const Mb = r.pick([0.1, 0.12, 0.15, 0.2, 0.25]);
          const Vb = r.num(12, 45, 2);
          const nb = (Vb / 1000) * Mb, na = nb / T.ratio, Ma = na / (Va / 1000);
          return {
            q: `It takes ${Vb.toFixed(2)} mL of ${Mb.toFixed(4)} M $\\ce{NaOH}$ to reach the end point with ${Va.toFixed(2)} mL of $\\ce{${T.acid}}$. What is the molarity of the acid?`,
            answer: Ma,
            unit: 'M',
            tol: 0.01,
            sf: 4,
            hint: T.ratio > 1 ? 'This acid gives two protons. Check the mole ratio.' : 'Moles of base first, then moles of acid, then divide by liters of acid.',
            steps: [
              `Equation: ${T.eq.split(' -> ').map((side) => side.split(' + ').map(ce).join(' + ')).join(' $\\rightarrow$ ')}.`,
              `Moles of $\\ce{NaOH}$: $${(Vb / 1000).toFixed(5)}\\text{ L} \\times ${Mb.toFixed(4)}\\text{ mol/L} = ${tex(nb)}\\text{ mol}$.`,
              `Moles of acid: $${tex(nb)} \\div ${T.ratio} = ${tex(na)}\\text{ mol}$.`,
              `Molarity: $${tex(na)}\\text{ mol} \\div ${(Va / 1000).toFixed(5)}\\text{ L} = ${tex(Ma)}\\text{ M}$.`,
            ],
          };
        },
      },
      {
        id: 'titrate-volume',
        title: 'Find the base volume',
        make(r) {
          const T = r.pick(TITRATIONS);
          const Va = r.pick([10, 20, 25, 30, 40]);
          const Ma = r.pick([0.08, 0.1, 0.12, 0.15, 0.2, 0.25]);
          const Mb = r.pick([0.1, 0.15, 0.2, 0.25, 0.5]);
          const na = (Va / 1000) * Ma, nb = na * T.ratio, Vb = (nb / Mb) * 1000;
          return {
            q: `What volume of ${Mb.toFixed(3)} M $\\ce{NaOH}$ neutralizes ${Va.toFixed(2)} mL of ${Ma.toFixed(4)} M $\\ce{${T.acid}}$?`,
            answer: Vb,
            unit: 'mL',
            tol: 0.01,
            sf: 3,
            hint: 'Moles of acid, then moles of base through the equation, then divide by the molarity of the base.',
            steps: [
              `Moles of acid: $${(Va / 1000).toFixed(5)}\\text{ L} \\times ${Ma.toFixed(4)}\\text{ mol/L} = ${tex(na)}\\text{ mol}$.`,
              `Moles of $\\ce{NaOH}$: multiply by ${T.ratio}, giving $${tex(nb)}\\text{ mol}$.`,
              `Volume: $${tex(nb)}\\text{ mol} \\div ${Mb.toFixed(3)}\\text{ mol/L} = ${tex(nb / Mb)}\\text{ L}$, which is ${num(Vb, 3)} mL.`,
            ],
          };
        },
      },
      {
        id: 'standardize',
        title: 'Exam style: standardize a base',
        make(r) {
          const M = Bank.molarMass('KHC8H4O4');
          const m = r.num(0.3, 0.9, 3);
          const V = r.num(15, 40, 2);
          const n = m / M, Mb = n / (V / 1000);
          return {
            q: `A chemist dissolves ${m.toFixed(3)} g of potassium hydrogen phthalate, $\\ce{KHC8H4O4}$, which has one acidic proton. It takes ${V.toFixed(2)} mL of $\\ce{NaOH}$ solution to reach the end point. What is the molarity of the $\\ce{NaOH}$?`,
            answer: Mb,
            unit: 'M',
            tol: 0.01,
            sf: 4,
            hint: 'Grams of acid to moles of acid. One proton means the mole ratio is 1 to 1.',
            steps: [
              `Molar mass of $\\ce{KHC8H4O4}$ is ${M.toFixed(2)} g/mol.`,
              `Moles of acid: $${m.toFixed(3)}\\text{ g} \\div ${M.toFixed(2)}\\text{ g/mol} = ${tex(n)}\\text{ mol}$.`,
              `One proton per formula unit, so moles of $\\ce{NaOH}$ are also $${tex(n)}$ mol.`,
              `Molarity: $${tex(n)}\\text{ mol} \\div ${(V / 1000).toFixed(5)}\\text{ L} = ${tex(Mb)}\\text{ M}$.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What are the six strong acids?', back: '$\\ce{HCl}$, $\\ce{HBr}$, $\\ce{HI}$, $\\ce{HNO3}$, $\\ce{H2SO4}$, $\\ce{HClO4}$.' },
      { front: 'What are the strong bases?', back: 'Group 1 hydroxides, plus $\\ce{Ca(OH)2}$, $\\ce{Sr(OH)2}$ and $\\ce{Ba(OH)2}$.' },
      { front: 'What is a Brønsted-Lowry acid?', back: 'A proton donor.' },
      { front: 'What is a Brønsted-Lowry base?', back: 'A proton acceptor. It needs a lone pair to hold the proton.' },
      { front: 'What is the Arrhenius definition?', back: 'An acid makes $\\ce{H+}$ in water, and a base makes $\\ce{OH-}$ in water.' },
      { front: 'What is hydronium?', back: '$\\ce{H3O+}$, a water molecule holding an extra proton. It is what $\\ce{H+}$ really is in water.' },
      { front: 'What is the equivalence point?', back: 'The point where moles of $\\ce{H+}$ equal moles of $\\ce{OH-}$.' },
      { front: 'What color is phenolphthalein in acid and in base?', back: 'Colorless in acid, pink in base.' },
      { front: 'What is the conjugate base of $\\ce{H2SO4}$?', back: '$\\ce{HSO4-}$. Remove exactly one proton.' },
    ],

    terms: [
      { term: 'Acid (Brønsted-Lowry)', def: 'A substance that donates a proton.' },
      { term: 'Base (Brønsted-Lowry)', def: 'A substance that accepts a proton.' },
      { term: 'Arrhenius acid', def: 'A substance that produces $\\ce{H+}$ ions in water.' },
      { term: 'Arrhenius base', def: 'A substance that produces $\\ce{OH-}$ ions in water.' },
      { term: 'Hydronium ion', def: 'The ion $\\ce{H3O+}$, a water molecule with an extra proton attached.' },
      { term: 'Conjugate pair', def: 'Two species that differ by exactly one proton, such as $\\ce{HCl}$ and $\\ce{Cl-}$.' },
      { term: 'Strong acid', def: 'An acid that gives up its proton completely in water.' },
      { term: 'Weak acid', def: 'An acid of which only a small fraction gives up its proton in water at any moment.' },
      { term: 'Neutralization', def: 'The reaction of an acid with a base, forming a salt and usually water.' },
      { term: 'Salt', def: 'An ionic compound made of the cation from a base and the anion from an acid.' },
      { term: 'Titration', def: 'Adding a solution of known concentration to another until the reaction is just complete, in order to find an unknown amount.' },
      { term: 'Equivalence point', def: 'The point in a titration when reactants have been mixed in exact stoichiometric amounts.' },
      { term: 'End point', def: 'The point in a titration when the indicator changes color.' },
      { term: 'Indicator', def: 'A dye that changes color with acidity, such as phenolphthalein.' },
      { term: 'Lone pair', def: 'Two valence electrons on an atom that are not in a bond. A base uses one to hold a proton.' },
    ],
  });
})();
