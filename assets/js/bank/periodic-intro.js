/* Question bank for 2.3 Meet the periodic table. */
(function () {
  const METALS = ['Li', 'Na', 'K', 'Rb', 'Cs', 'Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Al', 'Ga', 'In', 'Sn', 'Pb', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ag', 'Au', 'Pt', 'Hg', 'W', 'U'];
  const NONMETALS = ['H', 'He', 'C', 'N', 'O', 'F', 'Ne', 'P', 'S', 'Cl', 'Ar', 'Se', 'Br', 'Kr', 'I', 'Xe'];
  const METALLOIDS = ['B', 'Si', 'Ge', 'As', 'Sb', 'Te'];
  const FAMILY = {
    'Alkali metals': ['Li', 'Na', 'K', 'Rb', 'Cs'],
    'Alkaline earth metals': ['Be', 'Mg', 'Ca', 'Sr', 'Ba'],
    Halogens: ['F', 'Cl', 'Br', 'I'],
    'Noble gases': ['He', 'Ne', 'Ar', 'Kr', 'Xe'],
    'Transition metals': ['Fe', 'Cu', 'Zn', 'Ni', 'Co', 'Cr', 'Mn', 'Ag', 'Au', 'Ti'],
  };
  const ION = {
    Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Al: 3, Ga: 3,
    N: -3, P: -3, O: -2, S: -2, Se: -2, F: -1, Cl: -1, Br: -1, I: -1,
  };
  const DIATOMIC = ['H', 'N', 'O', 'F', 'Cl', 'Br', 'I'];
  const q2 = (c) => (c === 0 ? '0' : `${c > 0 ? '+' : '−'}${Math.abs(c)}`);
  const nm = (s) => EL[s].name.toLowerCase();

  Bank.add('periodic-intro', {
    quiz: [
      {
        q: 'What are the vertical columns of the periodic table called?',
        options: ['Periods', 'Groups', 'Blocks', 'Shells'],
        answer: 1,
        why: 'Columns are groups, or families. Rows are periods. Elements in a group have similar properties.',
      },
      {
        q: 'The modern periodic table is arranged in order of increasing:',
        options: ['Atomic mass', 'Atomic number', 'Number of neutrons', 'Density'],
        answer: 1,
        why: 'Mendeleev used mass, but atomic number is the true order. That is why tellurium (127.6) comes before iodine (126.9).',
      },
      {
        q: 'Why did Mendeleev leave gaps in his table?',
        options: ['He ran out of cards', 'He predicted that undiscovered elements belonged there', 'Those elements are unstable', 'To make the rows the same length'],
        answer: 1,
        why: 'He trusted the pattern, so he left holes and predicted the missing elements. Gallium and germanium later matched his predictions closely.',
      },
      {
        q: 'Which element is a halogen?',
        options: ['Sodium', 'Bromine', 'Neon', 'Calcium'],
        answer: 1,
        why: 'Halogens are group 17: F, Cl, Br, I. Sodium is an alkali metal, neon is a noble gas, and calcium is an alkaline earth metal.',
      },
      {
        q: 'What charge does an ion of an element in group 16, such as sulfur, usually have?',
        options: ['$+6$', '$+2$', '$-2$', '$-6$'],
        answer: 2,
        why: 'Group 16 atoms are 2 electrons short of a noble gas, so they gain 2 electrons and become $2-$. Common mistake: using the group number as the charge for a nonmetal.',
      },
      {
        q: 'Which of these is written as a diatomic molecule when it stands alone?',
        options: ['Helium', 'Sodium', 'Nitrogen', 'Carbon'],
        answer: 2,
        why: 'Nitrogen gas is $\\ce{N2}$. The seven diatomics are H, O, N, Cl, Br, I and F.',
      },
      {
        q: 'Which is most typical of a nonmetal?',
        options: ['Shiny and bendable', 'A good conductor of electricity', 'Dull and brittle as a solid', 'Forms positive ions'],
        answer: 2,
        why: 'Nonmetals are usually dull, brittle and poor conductors. Graphite is a well-known exception, since it conducts electricity.',
      },
      {
        q: 'Going down group 1 from lithium to cesium, reactions with water:',
        options: ['Get more violent', 'Get less violent', 'Stay the same', 'Stop completely'],
        answer: 0,
        why: 'Lower in the group, the outer electron is farther from the nucleus and easier to lose. Lithium fizzes, potassium burns, and cesium explodes.',
      },
      {
        q: 'What does "Co" stand for, compared with "CO"?',
        options: ['Both are carbon monoxide', 'Co is cobalt, and CO is carbon monoxide', 'Co is copper, and CO is cobalt', 'Both are cobalt'],
        answer: 1,
        why: 'A capital letter starts a new element. Co is one element, cobalt. CO has two elements, carbon and oxygen.',
      },
    ],

    gens: [
      {
        id: 'group-period',
        title: 'Group and period',
        make(r) {
          const s = r.pick(['H', 'He', 'Li', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Ti', 'Cr', 'Mn', 'Fe', 'Ni', 'Cu', 'Zn', 'Ga', 'As', 'Br', 'Kr', 'Rb', 'Sr', 'Ag', 'Sn', 'I', 'Xe', 'Cs', 'Ba', 'Au', 'Pb']);
          const e = EL[s];
          const ask = r.pick(['group', 'period']);
          const ans = e[ask];
          return {
            q: `Use the periodic table. What ${ask} is ${nm(s)}, $\\ce{${s}}$, in?`,
            answer: ans, tol: 0, answerText: String(ans),
            hint: ask === 'group' ? 'Groups are columns, numbered 1 to 18 from left to right.' : 'Periods are rows, numbered 1 to 7 from top to bottom.',
            steps: [`Find ${s} on the table. It is in column ${e.group} and row ${e.period}.`, `So it is in group ${e.group}, period ${e.period}.`],
          };
        },
      },
      {
        id: 'find',
        title: 'Find the element',
        make(r) {
          const pool = window.ELEMENTS.filter((e) => e.group && e.z <= 56 && e.period <= 6);
          const e = r.pick(pool);
          return {
            q: `Which element is in <b>group ${e.group}, period ${e.period}</b>? Type the symbol.`,
            accept: [e.sym, e.name],
            placeholder: 'Symbol',
            hint: 'Go down to the row, then across to the column.',
            steps: [`Row ${e.period} and column ${e.group} meet at ${e.name.toLowerCase()}, $\\ce{${e.sym}}$.`],
          };
        },
      },
      {
        id: 'protons',
        title: 'Read a tile',
        make(r) {
          const e = r.pick(window.ELEMENTS.filter((x) => x.z <= 56 && x.z !== 3 && x.z !== 43));
          const ask = r.pick(['z', 'z', 'mass']);
          if (ask === 'z') {
            return {
              q: `How many protons does every atom of ${nm(e.sym)} have?`,
              answer: e.z, tol: 0, answerText: String(e.z),
              hint: 'It is the atomic number on the tile.',
              steps: [`The atomic number of $\\ce{${e.sym}}$ is ${e.z}, and that equals the number of protons.`],
            };
          }
          return {
            q: `What is the average atomic mass of ${nm(e.sym)}, in u? Use your periodic table.`,
            answer: e.mass, unit: 'u', tol: 0.01, answerText: e.mass.toFixed(2),
            hint: 'It is the decimal number at the bottom of the tile.',
            steps: [`The tile for $\\ce{${e.sym}}$ shows an average atomic mass of about ${e.mass.toFixed(2)} u.`],
          };
        },
      },
      {
        id: 'metal',
        title: 'Metal, nonmetal or metalloid?',
        make(r) {
          const kind = r.pick(['Metal', 'Nonmetal', 'Metalloid']);
          const s = r.pick(kind === 'Metal' ? METALS : kind === 'Nonmetal' ? NONMETALS : METALLOIDS);
          const opts = r.mc(kind, ['Metal', 'Nonmetal', 'Metalloid'].filter((x) => x !== kind));
          const why = {
            Metal: `${EL[s].name} is on the left side of the staircase.`,
            Nonmetal: s === 'H' ? 'Hydrogen sits in group 1 but it is a nonmetal gas.' : `${EL[s].name} is on the upper right, past the staircase.`,
            Metalloid: `${EL[s].name} sits right on the staircase.`,
          }[kind];
          return { q: `Classify ${nm(s)}, $\\ce{${s}}$.`, choices: opts.choices, answer: opts.answer, steps: [why, `So it is a ${kind.toLowerCase()}.`] };
        },
      },
      {
        id: 'family',
        title: 'Which family?',
        make(r) {
          const fam = r.pick(Object.keys(FAMILY));
          const s = r.pick(FAMILY[fam]);
          const opts = r.mc(fam, Object.keys(FAMILY).filter((x) => x !== fam).slice(0, 4));
          const groupText = EL[s].group >= 3 && EL[s].group <= 12 ? 'groups 3 to 12' : `group ${EL[s].group}`;
          return { q: `Which family does ${nm(s)}, $\\ce{${s}}$, belong to?`, choices: opts.choices, answer: opts.answer, steps: [`${EL[s].name} is in ${groupText}, which is the ${fam.toLowerCase()}.`] };
        },
      },
      {
        id: 'charge',
        title: 'Predict the ion charge',
        make(r) {
          const s = r.pick(Object.keys(ION));
          const c = ION[s];
          const g = EL[s].group;
          const opts = r.mc(q2(c), r.shuffle([q2(-c), q2(c > 0 ? c + 1 : c - 1), q2(g > 12 ? g - 10 : g + 1), q2(c > 0 ? c + 2 : 1)].filter((x) => x !== q2(c))).slice(0, 3));
          return {
            q: `What charge does an ion of ${nm(s)}, $\\ce{${s}}$, usually have?`,
            choices: opts.choices, answer: opts.answer,
            steps: c > 0
              ? [`${EL[s].name} is a metal in group ${g}, with ${g > 12 ? g - 10 : g} outer electron${(g > 12 ? g - 10 : g) > 1 ? 's' : ''}.`, `It loses them to match a noble gas, so its charge is ${q2(c)}.`]
              : [`${EL[s].name} is in group ${g}, so it is ${18 - g} electron${18 - g > 1 ? 's' : ''} short of a noble gas.`, `It gains them, so its charge is ${q2(c)}.`],
          };
        },
      },
      {
        id: 'alike',
        title: 'Who behaves alike?',
        make(r) {
          const groups = [['Li', 'Na', 'K', 'Rb', 'Cs'], ['Mg', 'Ca', 'Sr', 'Ba'], ['F', 'Cl', 'Br', 'I'], ['He', 'Ne', 'Ar', 'Kr', 'Xe'], ['O', 'S', 'Se'], ['N', 'P', 'As'], ['C', 'Si', 'Ge']];
          const g = r.pick(groups);
          const pair = r.shuffle(g).slice(0, 2);
          const others = r.shuffle(groups.filter((x) => x !== g).flat()).slice(0, 3);
          const opts = r.mc(EL[pair[1]].name, others.map((x) => EL[x].name));
          return {
            q: `Which element has chemical properties most like ${nm(pair[0])}?`,
            choices: opts.choices, answer: opts.answer,
            steps: [`Elements in the same group behave alike. ${EL[pair[0]].name} and ${nm(pair[1])} are both in group ${EL[pair[0]].group}.`],
          };
        },
      },
      {
        id: 'diatomic',
        title: 'Write the element',
        make(r) {
          const isDi = r.next() < 0.6;
          const s = isDi ? r.pick(DIATOMIC) : r.pick(['He', 'Ne', 'Ar', 'Na', 'Mg', 'Fe', 'Cu', 'Al', 'C', 'K']);
          const name = nm(s);
          const ans = isDi ? `${s}2` : s;
          return {
            q: `How do you write the formula of pure ${name} as it normally exists?`,
            accept: [ans],
            placeholder: 'Formula',
            hint: 'Is it one of the seven in HONClBrIF?',
            steps: isDi ? [`${EL[s].name} is one of the seven diatomic elements, HONClBrIF.`, `So write $\\ce{${s}2}$.`] : [`${EL[s].name} is not in HONClBrIF, so write it as a single atom symbol: $\\ce{${s}}$.`],
          };
        },
      },
    ],

    cards: [
      { front: 'Group versus period', back: 'Groups are columns (similar properties). Periods are rows.' },
      { front: 'Alkali metals', back: 'Group 1 except H. Soft and very reactive, and they form $+1$ ions.' },
      { front: 'Alkaline earth metals', back: 'Group 2. Reactive metals that form $+2$ ions.' },
      { front: 'Halogens', back: 'Group 17: F, Cl, Br, I. Reactive, diatomic nonmetals that form $-1$ ions.' },
      { front: 'Noble gases', back: 'Group 18. Full outer shells, so they are very unreactive.' },
      { front: 'Transition metals', back: 'Groups 3 to 12. Often have several possible charges and colorful ions.' },
      { front: 'The diatomic elements', back: '$\\ce{H2, N2, O2, F2, Cl2, Br2, I2}$, or HONClBrIF.' },
      { front: 'Where are the metalloids?', back: 'On the staircase between metals and nonmetals: B, Si, Ge, As, Sb, Te.' },
      { front: 'The only elements liquid at room temperature', back: 'Bromine and mercury.' },
    ],

    terms: [
      { term: 'Periodic table', def: 'A chart of all elements in order of atomic number, arranged so similar elements line up in columns.' },
      { term: 'Group', def: 'A vertical column of the periodic table, also called a family.' },
      { term: 'Period', def: 'A horizontal row of the periodic table.' },
      { term: 'Metal', def: 'An element that is usually shiny, bendable and a good conductor, and tends to form positive ions.' },
      { term: 'Nonmetal', def: 'An element that is usually dull, brittle and a poor conductor, and tends to form negative ions or share electrons.' },
      { term: 'Metalloid', def: 'An element on the staircase with properties between metals and nonmetals, such as silicon.' },
      { term: 'Alkali metal', def: 'An element of group 1, except hydrogen. Soft, very reactive metals.' },
      { term: 'Alkaline earth metal', def: 'An element of group 2. Reactive metals that form $+2$ ions.' },
      { term: 'Halogen', def: 'An element of group 17. Reactive nonmetals that exist as diatomic molecules.' },
      { term: 'Noble gas', def: 'An element of group 18, with a full outer shell and very little reactivity.' },
      { term: 'Transition metal', def: 'An element of groups 3 to 12, usually with more than one possible charge.' },
      { term: 'Diatomic element', def: 'One of the seven elements that exist as two-atom molecules: $\\ce{H2, N2, O2, F2, Cl2, Br2, I2}$.' },
    ],
  });
})();
