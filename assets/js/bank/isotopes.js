/* Question bank for 2.2 Build an atom. */
(function () {
  // Real isotope data: [mass number, isotopic mass in u, percent abundance].
  const ISO = {
    B: [[10, 10.013, 19.9], [11, 11.009, 80.1]],
    Cl: [[35, 34.969, 75.76], [37, 36.966, 24.24]],
    Cu: [[63, 62.930, 69.15], [65, 64.928, 30.85]],
    Br: [[79, 78.918, 50.69], [81, 80.916, 49.31]],
    Ga: [[69, 68.926, 60.11], [71, 70.925, 39.89]],
    Ag: [[107, 106.905, 51.84], [109, 108.905, 48.16]],
    Li: [[6, 6.015, 7.59], [7, 7.016, 92.41]],
    N: [[14, 14.003, 99.63], [15, 15.000, 0.37]],
    Rb: [[85, 84.912, 72.17], [87, 86.909, 27.83]],
    Mg: [[24, 23.985, 78.99], [25, 24.986, 10.0], [26, 25.983, 11.01]],
    Si: [[28, 27.977, 92.22], [29, 28.976, 4.69], [30, 29.974, 3.09]],
    Ne: [[20, 19.992, 90.48], [21, 20.994, 0.27], [22, 21.991, 9.25]],
  };
  const avgOf = (iso) => iso.reduce((s, [, m, ab]) => s + (m * ab) / 100, 0);
  // Common ions and the mass numbers used for them.
  const NUCLIDES = [
    ['H', 1, 0], ['H', 2, 0], ['H', 3, 0], ['He', 4, 0], ['Li', 7, 0], ['Li', 7, 1], ['Be', 9, 0], ['Be', 9, 2], ['B', 11, 0], ['C', 12, 0], ['C', 13, 0], ['C', 14, 0],
    ['N', 14, 0], ['N', 15, 0], ['N', 14, -3], ['O', 16, 0], ['O', 18, 0], ['O', 16, -2], ['F', 19, 0], ['F', 19, -1], ['Ne', 20, 0], ['Ne', 22, 0], ['Na', 23, 0], ['Na', 23, 1],
    ['Mg', 24, 0], ['Mg', 24, 2], ['Mg', 26, 2], ['Al', 27, 0], ['Al', 27, 3], ['Si', 28, 0], ['P', 31, 0], ['P', 31, -3], ['S', 32, 0], ['S', 34, -2], ['S', 32, -2], ['Cl', 35, 0], ['Cl', 37, 0],
    ['Cl', 35, -1], ['Cl', 37, -1], ['Ar', 40, 0], ['K', 39, 0], ['K', 39, 1], ['K', 40, 0], ['Ca', 40, 0], ['Ca', 40, 2], ['Ca', 44, 2], ['Fe', 56, 0], ['Fe', 56, 2], ['Fe', 56, 3], ['Fe', 54, 3],
    ['Co', 59, 2], ['Cu', 63, 1], ['Cu', 65, 2], ['Zn', 64, 2], ['Zn', 66, 2], ['Br', 79, -1], ['Br', 81, -1], ['Sr', 88, 2], ['Sr', 90, 0], ['Ag', 107, 1], ['Ag', 109, 1], ['I', 127, -1], ['I', 131, 0],
    ['Cs', 133, 1], ['Ba', 138, 2], ['Pb', 208, 2], ['Pb', 206, 4], ['Au', 197, 0], ['Au', 197, 3], ['U', 235, 0], ['U', 238, 0],
  ];
  const chargeStr = (q) => (q === 0 ? '' : `${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '-'}`);
  const chargeWords = (q) => (q === 0 ? '0' : `${q > 0 ? '+' : '−'}${Math.abs(q)}`);
  const sym = (s, A, Z, q) => `$\\ce{^{${A}}_{${Z}}${s}${q ? '^{' + chargeStr(q) + '}' : ''}}$`;

  Bank.add('isotopes', {
    quiz: [
      {
        q: 'What decides which element an atom is?',
        options: ['The number of protons', 'The number of neutrons', 'The number of electrons', 'The mass number'],
        answer: 0,
        why: 'Protons alone set the element. Change the neutrons and you get an isotope. Change the electrons and you get an ion.',
      },
      {
        q: 'How many neutrons are in $\\ce{^{37}_{17}Cl}$?',
        options: ['17', '20', '37', '54'],
        answer: 1,
        why: 'Mass number minus atomic number: $37 - 17 = 20$. The 37 counts protons and neutrons together.',
      },
      {
        q: 'An ion has 12 protons and 10 electrons. What is its charge?',
        options: ['$2+$', '$2-$', '$10+$', '$12-$'],
        answer: 0,
        why: 'Charge is protons minus electrons: $12 - 10 = +2$. Having fewer electrons makes it positive.',
      },
      {
        q: 'Which pair are isotopes of each other?',
        options: ['$\\ce{^{14}_{6}C}$ and $\\ce{^{14}_{7}N}$', '$\\ce{^{12}_{6}C}$ and $\\ce{^{14}_{6}C}$', '$\\ce{^{23}_{11}Na}$ and $\\ce{^{23}_{11}Na+}$', '$\\ce{^{16}_{8}O}$ and $\\ce{^{32}_{16}S}$'],
        answer: 1,
        why: 'Isotopes share an atomic number and differ in mass number. Carbon-14 and nitrogen-14 share a mass number only. $\\ce{Na}$ and $\\ce{Na+}$ differ in electrons.',
      },
      {
        q: 'The average atomic mass of chlorine is 35.45 u. How many chlorine atoms have a mass of 35.45 u?',
        options: ['About half of them', 'Most of them', 'None of them', 'All of them'],
        answer: 2,
        why: 'Each atom is one isotope, about 35 u or about 37 u. The 35.45 is an average of the mix, like 2.3 children per family.',
      },
      {
        q: 'An element has isotopes at 10 u and 11 u. Its average atomic mass is 10.81 u. Which is more common?',
        options: ['The 10 u isotope', 'The 11 u isotope', 'They are equally common', 'You cannot tell'],
        answer: 1,
        why: '10.81 is closer to 11, so the balance point leans toward the 11 u isotope. It is about 80% of natural boron.',
      },
      {
        q: 'Why do chlorine-35 and chlorine-37 react the same way?',
        options: ['They have the same number of neutrons', 'They have the same number of electrons', 'They have the same mass', 'They do not react the same way'],
        answer: 1,
        why: 'Reactions involve electrons. Both isotopes have 17 protons and so 17 electrons as neutral atoms. Their only difference is 2 neutrons in the nucleus.',
      },
      {
        q: 'In a mass spectrometer, which ions bend the most in the magnet?',
        options: ['The lightest', 'The heaviest', 'They all bend the same', 'Only the neutral atoms'],
        answer: 0,
        why: 'For the same charge and speed-up voltage, lighter ions are easier to turn, so they bend more. Neutral atoms do not bend at all.',
      },
      {
        q: 'What does the 14 mean in "carbon-14"?',
        options: ['14 protons', '14 neutrons', '14 protons and neutrons in total', '14 electrons'],
        answer: 2,
        why: 'The number after the name is the mass number. Carbon always has 6 protons, so carbon-14 has 8 neutrons.',
      },
    ],

    gens: [
      {
        id: 'count',
        title: 'Count the particles',
        make(r) {
          const [s, A, q] = r.pick(NUCLIDES);
          const Z = EL[s].z, n = A - Z, e = Z - q;
          const ask = r.pick(['protons', 'neutrons', 'electrons']);
          const ans = { protons: Z, neutrons: n, electrons: e }[ask];
          return {
            q: `How many <b>${ask}</b> are in ${sym(s, A, Z, q)}?`,
            answer: ans, tol: 0, sf: 3, answerText: String(ans),
            hint: { protons: 'Protons are the atomic number, the lower left number.', neutrons: 'Subtract: mass number minus atomic number.', electrons: q ? 'Start from the protons. A positive charge means fewer electrons, a negative charge means more.' : 'A neutral atom has as many electrons as protons.' }[ask],
            steps: [
              `Protons are the atomic number: ${Z}.`,
              `Neutrons: $${A} - ${Z} = ${n}$.`,
              q ? `Electrons: charge is $${chargeWords(q)}$, so electrons $= ${Z} - (${q}) = ${e}$.` : `It is neutral, so electrons equal protons: ${e}.`,
            ],
          };
        },
      },
      {
        id: 'write',
        title: 'Write the symbol',
        make(r) {
          const [s, A, q] = r.pick(NUCLIDES.filter((x) => EL[x[0]].z > 2));
          const Z = EL[s].z, n = A - Z, e = Z - q;
          const right = sym(s, A, Z, q);
          const wrong = [
            sym(s, n, Z, q),                       // Neutrons used as the mass number.
            sym(s, A, Z, -q || (Z > 3 ? 1 : 2)),   // Charge sign flipped.
            `$\\ce{^{${Z}}_{${A}}${s}${q ? '^{' + chargeStr(q) + '}' : ''}}$`, // Numbers swapped.
            sym(s, A, Z, q === 0 ? -1 : 0),
          ];
          const opts = r.mc(right, r.shuffle(wrong.filter((w) => w !== right)).slice(0, 3));
          return {
            q: `An atom or ion has ${Z} protons, ${n} neutrons and ${e} electrons. Which symbol is correct?`,
            choices: opts.choices,
            answer: opts.answer,
            steps: [
              `${Z} protons means element ${Z}, which is ${EL[s].name.toLowerCase()}, symbol ${s}. It goes at the lower left as $Z$.`,
              `Mass number: $${Z} + ${n} = ${A}$. It goes at the upper left as $A$.`,
              `Charge: $${Z} - ${e} = ${q}$. ${q ? 'It goes at the upper right.' : 'It is neutral, so no charge is written.'}`,
            ],
          };
        },
      },
      {
        id: 'charge',
        title: 'Find the charge',
        make(r) {
          const [s, , q] = r.pick(NUCLIDES.filter((x) => x[2] !== 0));
          const Z = EL[s].z, e = Z - q;
          const kind = q > 0 ? 'cation' : 'anion';
          const right = chargeWords(q);
          const opts = r.mc(right, [chargeWords(-q), chargeWords(q + (q > 0 ? 1 : -1)), chargeWords(q - (q > 0 ? 1 : -1) || 2), '0'].filter((x) => x !== right));
          return {
            q: `An ion of ${EL[s].name.toLowerCase()} has ${Z} protons and ${e} electrons. What is its charge?`,
            choices: opts.choices,
            answer: opts.answer,
            steps: [`Charge is protons minus electrons: $${Z} - ${e} = ${q}$.`, `That makes it a <b>${kind}</b>, because it has ${q > 0 ? 'lost' : 'gained'} ${Math.abs(q)} electron${Math.abs(q) > 1 ? 's' : ''}.`],
          };
        },
      },
      {
        id: 'avg2',
        title: 'Average mass, two isotopes',
        make(r) {
          const s = r.pick(['B', 'Cl', 'Cu', 'Br', 'Ga', 'Ag', 'Li', 'Rb']);
          const iso = ISO[s];
          const [a, b] = iso;
          // Sometimes use a made-up sample, so the answer cannot just be looked up.
          const fake = r.next() < 0.5;
          const p1 = fake ? r.num(15, 85, 1) : a[2];
          const p2 = +(100 - p1).toFixed(2);
          const f1 = p1 / 100, f2 = p2 / 100;
          const avg = f1 * a[1] + f2 * b[1];
          return {
            q: `${fake ? 'A lab-enriched sample of' : 'Natural'} ${EL[s].name.toLowerCase()} is ${p1}% ${EL[s].name.toLowerCase()}-${a[0]} (${a[1].toFixed(3)} u) and ${p2}% ${EL[s].name.toLowerCase()}-${b[0]} (${b[1].toFixed(3)} u). What is its average atomic mass?`,
            answer: avg, unit: 'u', tol: 0.002, answerText: avg.toFixed(2),
            hint: 'Turn each percent into a fraction, multiply each by its mass, and add.',
            steps: [
              `Fractions: ${p1}% is ${f1.toFixed(4)} and ${p2}% is ${f2.toFixed(4)}.`,
              `Multiply: $(${f1.toFixed(4)})(${a[1].toFixed(3)}) = ${(f1 * a[1]).toFixed(3)}$ and $(${f2.toFixed(4)})(${b[1].toFixed(3)}) = ${(f2 * b[1]).toFixed(3)}$.`,
              `Add: $${(f1 * a[1]).toFixed(3)} + ${(f2 * b[1]).toFixed(3)} = ${avg.toFixed(2)}$ u.`,
            ],
          };
        },
      },
      {
        id: 'avg3',
        title: 'Average mass, three isotopes',
        make(r) {
          const s = r.pick(['Mg', 'Si', 'Ne']);
          const iso = ISO[s].map((x) => x.slice());
          // A made-up sample half the time: shift a few percent between the first two isotopes.
          const shift = r.next() < 0.5 ? r.num(-5, 5, 1) : 0;
          iso[0][2] = +(iso[0][2] + shift).toFixed(2); iso[2][2] = +(iso[2][2] - shift).toFixed(2);
          if (iso[2][2] < 0) { iso[0][2] = ISO[s][0][2]; iso[2][2] = ISO[s][2][2]; }
          const avg = avgOf(iso);
          const name = EL[s].name.toLowerCase();
          return {
            q: `A sample of ${name} is ${iso.map(([a, m, ab]) => `${ab}% ${name}-${a} (${m.toFixed(3)} u)`).join(', ')}. What is its average atomic mass?`,
            answer: avg, unit: 'u', tol: 0.002, answerText: avg.toFixed(2),
            hint: 'Three fractions, three products, one sum.',
            steps: [
              `Multiply each fraction by its mass: ${iso.map(([, m, ab]) => `$(${(ab / 100).toFixed(4)})(${m.toFixed(3)}) = ${((ab / 100) * m).toFixed(3)}$`).join(', ')}.`,
              `Add them: ${iso.map(([, m, ab]) => ((ab / 100) * m).toFixed(3)).join(' + ')} $= ${avg.toFixed(2)}$ u.`,
            ],
          };
        },
      },
      {
        id: 'abundance',
        title: 'Find the abundance',
        make(r) {
          const s = r.pick(['B', 'Cl', 'Cu', 'Br', 'Ga', 'Ag', 'Rb']);
          const [a, b] = ISO[s];
          const name = EL[s].name.toLowerCase();
          const m1 = +a[1].toFixed(2), m2 = +b[1].toFixed(2);
          const fTrue = r.next() < 0.5 ? a[2] / 100 : r.num(0.2, 0.8, 2);
          const avg = +(fTrue * m1 + (1 - fTrue) * m2).toFixed(2);
          const x = (m2 - avg) / (m2 - m1);
          const ask = r.next() < 0.5 ? a : b;
          const ans = (ask === a ? x : 1 - x) * 100;
          return {
            q: `A sample of ${name} has two isotopes: ${name}-${a[0]} at ${m1.toFixed(2)} u and ${name}-${b[0]} at ${m2.toFixed(2)} u. The average mass is ${avg.toFixed(2)} u. What percent of the sample is ${name}-${ask[0]}?`,
            answer: ans, unit: '%', tol: 0.02, sf: 3,
            hint: 'Let the fractions be $x$ and $1 - x$, then solve the average mass equation.',
            steps: [
              `Let $x$ be the fraction of ${name}-${a[0]}, so ${name}-${b[0]} is $1 - x$.`,
              `Write the equation: $${m1.toFixed(2)}x + ${m2.toFixed(2)}(1 - x) = ${avg.toFixed(2)}$.`,
              `Multiply out and combine: $${m2.toFixed(2)} - ${(m2 - m1).toFixed(2)}x = ${avg.toFixed(2)}$.`,
              `Solve: $x = \\dfrac{${m2.toFixed(2)} - ${avg.toFixed(2)}}{${(m2 - m1).toFixed(2)}} = ${x.toFixed(3)}$.`,
              `So ${name}-${a[0]} is ${(x * 100).toFixed(1)}% and ${name}-${b[0]} is ${((1 - x) * 100).toFixed(1)}%.`,
            ],
          };
        },
      },
      {
        id: 'common',
        title: 'Which isotope is common?',
        make(r) {
          const s = r.pick(['B', 'Cl', 'Cu', 'Ga', 'Li', 'Rb', 'N', 'Mg', 'Si', 'Ne']);
          const iso = ISO[s];
          const name = EL[s].name.toLowerCase();
          const best = iso.reduce((m, x) => (x[2] > m[2] ? x : m), iso[0]);
          const avg = avgOf(iso);
          const opts = r.mc(`${name}-${best[0]}`, iso.filter((x) => x !== best).map((x) => `${name}-${x[0]}`).concat(['They are equally common']));
          return {
            q: `${EL[s].name} has an average atomic mass of ${avg.toFixed(2)} u. Its isotopes have mass numbers ${iso.map((x) => x[0]).join(', ')}. Which isotope is most abundant?`,
            choices: opts.choices,
            answer: opts.answer,
            steps: [`The average leans toward the most common isotope. ${avg.toFixed(2)} is closest to ${best[0]}.`, `Natural ${name} is ${best[2]}% ${name}-${best[0]}.`],
          };
        },
      },
      {
        id: 'same',
        title: 'Isotope, ion, or a different element?',
        make(r) {
          const pick = r.pick(['isotope', 'ion', 'element']);
          const a = r.pick([['C', 12], ['N', 14], ['O', 16], ['Na', 23], ['Mg', 24], ['Cl', 35], ['K', 39], ['Ca', 40], ['Fe', 56], ['Cu', 63], ['Ag', 107]]);
          const Z = EL[a[0]].z;
          let b, ans, why;
          if (pick === 'isotope') { const d = r.int(1, 3); b = { p: Z, n: a[1] - Z + d, e: Z }; ans = 'Isotopes of each other'; why = `Both have ${Z} protons, but the neutrons differ: ${a[1] - Z} and ${b.n}.`; }
          else if (pick === 'ion') { const d = r.pick([-2, -1, 1, 2]); b = { p: Z, n: a[1] - Z, e: Z + d }; ans = 'An atom and an ion of the same element'; why = `The protons and neutrons match, but the electrons differ: ${Z} and ${b.e}.`; }
          else { const d = r.int(1, 2); b = { p: Z + d, n: a[1] - Z, e: Z + d }; ans = 'Two different elements'; why = `The protons differ: ${Z} and ${b.p}. Protons set the element.`; }
          const opts = r.mc(ans, ['Isotopes of each other', 'An atom and an ion of the same element', 'Two different elements'].filter((x) => x !== ans));
          return {
            q: `Atom A has ${Z} protons, ${a[1] - Z} neutrons and ${Z} electrons. Particle B has ${b.p} protons, ${b.n} neutrons and ${b.e} electrons. What are they?`,
            choices: opts.choices,
            answer: opts.answer,
            steps: [why],
          };
        },
      },
      {
        id: 'mystery',
        title: 'Mystery element',
        make(r) {
          const s = r.pick(['B', 'Cl', 'Cu', 'Br', 'Ga', 'Ag', 'Mg', 'Si', 'Ne', 'Rb']);
          const iso = ISO[s];
          const avg = avgOf(iso);
          const others = r.shuffle(['B', 'Cl', 'Cu', 'Br', 'Ga', 'Ag', 'Mg', 'Si', 'Ne', 'Rb', 'Na', 'K', 'Ca', 'Fe'].filter((x) => x !== s)).slice(0, 3);
          const opts = r.mc(EL[s].name, others.map((x) => EL[x].name));
          return {
            q: `A mass spectrum shows these isotopes: ${iso.map(([, m, ab]) => `${m.toFixed(2)} u at ${ab}%`).join(', ')}. Which element is it?`,
            choices: opts.choices,
            answer: opts.answer,
            steps: [
              `Find the average: ${iso.map(([, m, ab]) => `$(${(ab / 100).toFixed(4)})(${m.toFixed(2)})$`).join(' + ')} $= ${avg.toFixed(2)}$ u.`,
              `Look up that mass on the periodic table: ${avg.toFixed(2)} u is ${EL[s].name.toLowerCase()}.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What does the atomic number $Z$ count?', back: 'Protons. It decides which element the atom is.' },
      { front: 'What does the mass number $A$ count?', back: 'Protons plus neutrons.' },
      { front: 'How do you find neutrons from a symbol?', back: 'Neutrons $= A - Z$.' },
      { front: 'What is an isotope?', back: 'An atom of the same element with a different number of neutrons.' },
      { front: 'What is a cation?', back: 'A positive ion. It has lost electrons.' },
      { front: 'What is an anion?', back: 'A negative ion. It has gained electrons.' },
      { front: 'How do you calculate average atomic mass?', back: 'Add up (fraction × isotope mass) for every isotope.' },
      { front: 'Mass number versus atomic mass', back: 'Mass number is a whole-number count for one isotope. Atomic mass is the weighted average for the element.' },
      { front: 'What does a mass spectrometer measure?', back: 'The mass and abundance of each isotope. Ions bend in a magnetic field, and lighter ions bend more.' },
    ],

    terms: [
      { term: 'Atomic number', def: 'The number of protons in an atom, symbol $Z$. It defines the element.' },
      { term: 'Mass number', def: 'The number of protons plus neutrons in one atom, symbol $A$.' },
      { term: 'Isotope', def: 'Atoms of the same element with different numbers of neutrons, so different mass numbers.' },
      { term: 'Ion', def: 'An atom or group of atoms with a net charge, because electrons and protons are not equal.' },
      { term: 'Cation', def: 'A positive ion, formed by losing electrons.' },
      { term: 'Anion', def: 'A negative ion, formed by gaining electrons.' },
      { term: 'Mass spectrometer', def: 'A device that separates ions by mass using a magnetic field, to measure isotope masses and abundances.' },
      { term: 'Percent abundance', def: 'The percentage of an element\'s atoms that are one particular isotope.' },
      { term: 'Average atomic mass', def: 'The weighted average of an element\'s isotope masses, as printed on the periodic table.' },
    ],
  });
  // Handed to the page script so the lesson and the bank use one set of data.
  Bank.all.isotopes.iso = ISO;
})();
