/* Question bank for 2.1 Inside the atom. */
Bank.add('atoms', {
  quiz: [
    {
      q: 'In the gold foil experiment, what did the fact that <b>most</b> alpha particles passed straight through tell Rutherford?',
      options: ['Gold atoms are mostly empty space', 'Alpha particles have no charge', 'Electrons are heavier than alpha particles', 'The foil had holes punched in it'],
      answer: 0,
      why: 'Most alphas met nothing that could push them, so most of each atom is empty space. Alphas are positive, and the foil had no holes.',
    },
    {
      q: 'A very few alpha particles bounced almost straight back. What caused that?',
      options: ['Hitting an electron', 'A tiny, heavy, positive nucleus', 'A wall of neutrons', 'The negative electron cloud attracting them'],
      answer: 1,
      why: 'Only something much heavier than an alpha, and positive so it repels, can turn an alpha around. An electron is about 7,300 times too light to do it.',
    },
    {
      q: 'What did Thomson conclude from his cathode ray experiments?',
      options: ['Atoms contain a nucleus', 'All atoms contain tiny negative particles', 'Atoms have no mass', 'Neutrons exist'],
      answer: 1,
      why: 'The beam bent toward the positive plate, and it was the same for every metal. So every atom contains electrons. The nucleus came later, from Rutherford.',
    },
    {
      q: 'Which particle has the smallest mass?',
      options: ['Proton', 'Neutron', 'Electron', 'They all weigh the same'],
      answer: 2,
      why: 'An electron is about 1/1836 of the mass of a proton. The proton and neutron are nearly equal, at about 1 u each.',
    },
    {
      q: 'Copper and chlorine form two compounds. Per 1.00 g of copper, one holds 0.56 g of chlorine and the other holds 1.12 g. Which law does this show?',
      options: ['Conservation of mass', 'Definite proportions', 'Multiple proportions', "Avogadro's law"],
      answer: 2,
      why: 'Same two elements, two different compounds, and the masses of chlorine per gram of copper are in a small whole-number ratio, 2 to 1.',
    },
    {
      q: 'Water from a river and water from a comet both contain about 8 g of oxygen for every 1 g of hydrogen. Which law is this?',
      options: ['Definite proportions', 'Multiple proportions', 'Conservation of mass', 'Conservation of energy'],
      answer: 0,
      why: 'A given compound always has the same mass ratio of its elements, wherever it comes from.',
    },
    {
      q: 'Why does a log seem to lose mass when it burns in an open fire?',
      options: ['Burning destroys atoms', 'Mass is not conserved in fire', 'The products include gases that float away', 'Heat has a negative mass'],
      answer: 2,
      why: 'Carbon dioxide and water vapor escape into the air. Burn it in a sealed container, and the total mass does not change.',
    },
    {
      q: 'Which of Dalton\'s original ideas do we now know is wrong?',
      options: ['Compounds have whole-number ratios of atoms', 'Reactions rearrange atoms', 'Atoms cannot be divided into smaller parts', 'Matter is made of atoms'],
      answer: 2,
      why: 'Atoms contain protons, neutrons and electrons. Dalton also thought all atoms of an element were identical, but isotopes differ in mass.',
    },
    {
      q: 'How does the plum pudding model differ from the nuclear model?',
      options: ['Plum pudding has no electrons', 'In plum pudding the positive charge is spread through the whole atom', 'In plum pudding the electrons sit in the center', 'The nuclear model has no positive charge'],
      answer: 1,
      why: 'Thomson spread the positive charge evenly, with electrons stuck in it. Rutherford concentrated it in a tiny nucleus.',
    },
  ],

  gens: [
    {
      id: 'conservation',
      title: 'Conservation of mass',
      make(r) {
        const rx = r.pick([
          { a: 'magnesium', b: 'oxygen', p: 'magnesium oxide', ka: 24.31, kb: 16.0 },
          { a: 'carbon', b: 'oxygen', p: 'carbon dioxide', ka: 12.01, kb: 32.0 },
          { a: 'sodium', b: 'chlorine', p: 'sodium chloride', ka: 22.99, kb: 35.45 },
          { a: 'iron', b: 'sulfur', p: 'iron(II) sulfide', ka: 55.85, kb: 32.06 },
          { a: 'hydrogen', b: 'oxygen', p: 'water', ka: 2.016, kb: 16.0 },
          { a: 'aluminum', b: 'chlorine', p: 'aluminum chloride', ka: 26.98, kb: 106.35 },
        ]);
        const ma = +(rx.ka * r.num(0.2, 1.5, 2)).toFixed(2);
        const mb = +((ma * rx.kb) / rx.ka).toFixed(2);
        const mp = +(ma + mb).toFixed(2);
        const ask = r.pick(['a', 'b', 'p']);
        if (ask === 'p') {
          return {
            q: `In a sealed flask, ${ma.toFixed(2)} g of ${rx.a} reacts completely with ${mb.toFixed(2)} g of ${rx.b}. What mass of ${rx.p} forms?`,
            answer: mp, unit: 'g', tol: 0.005, answerText: mp.toFixed(2),
            hint: 'Total mass before equals total mass after.',
            steps: [`Conservation of mass: mass of ${rx.a} + mass of ${rx.b} = mass of ${rx.p}.`, `$${ma.toFixed(2)}\\text{ g} + ${mb.toFixed(2)}\\text{ g} = ${mp.toFixed(2)}\\text{ g}$.`],
          };
        }
        const known = ask === 'a' ? [rx.b, mb] : [rx.a, ma];
        const want = ask === 'a' ? [rx.a, ma] : [rx.b, mb];
        return {
          q: `In a sealed flask, ${known[0]} reacts completely with ${want[0]} to make ${mp.toFixed(2)} g of ${rx.p}. If ${known[1].toFixed(2)} g of ${known[0]} was used, what mass of ${want[0]} reacted?`,
          answer: want[1], unit: 'g', tol: 0.01, answerText: want[1].toFixed(2),
          hint: 'Total mass before equals total mass after, so subtract.',
          steps: [`Conservation of mass: ${known[1].toFixed(2)} g + $m$ = ${mp.toFixed(2)} g.`, `Subtract from both sides: $m = ${mp.toFixed(2)} - ${known[1].toFixed(2)} = ${want[1].toFixed(2)}\\text{ g}$.`],
        };
      },
    },
    {
      id: 'definite',
      title: 'Definite proportions',
      make(r) {
        const c = r.pick([
          { f: 'H2O', a: 'H', b: 'O', ka: 2.016, kb: 16.0 },
          { f: 'CO2', a: 'C', b: 'O', ka: 12.01, kb: 32.0 },
          { f: 'NaCl', a: 'Na', b: 'Cl', ka: 22.99, kb: 35.45 },
          { f: 'MgO', a: 'Mg', b: 'O', ka: 24.31, kb: 16.0 },
          { f: 'CaO', a: 'Ca', b: 'O', ka: 40.08, kb: 16.0 },
          { f: 'NH3', a: 'H', b: 'N', ka: 3.024, kb: 14.01 },
          { f: 'CuO', a: 'Cu', b: 'O', ka: 63.55, kb: 16.0 },
        ]);
        const s1a = +(c.ka * r.num(0.2, 1.2, 2)).toFixed(2);
        const s1b = +((s1a * c.kb) / c.ka).toFixed(2);
        const s2a = +(c.ka * r.num(1.3, 4, 2)).toFixed(2);
        const ans = (s2a * s1b) / s1a;
        return {
          q: `A sample of $\\ce{${c.f}}$ contains ${s1a.toFixed(2)} g of ${EL[c.a].name.toLowerCase()} and ${s1b.toFixed(2)} g of ${EL[c.b].name.toLowerCase()}. A second sample of the same compound contains ${s2a.toFixed(2)} g of ${EL[c.a].name.toLowerCase()}. What mass of ${EL[c.b].name.toLowerCase()} does it contain?`,
          answer: ans, unit: 'g',
          hint: 'The mass ratio is the same in every sample of a compound.',
          steps: [
            `Definite proportions: the ratio is fixed, $\\dfrac{${s1b.toFixed(2)}\\text{ g ${c.b}}}{${s1a.toFixed(2)}\\text{ g ${c.a}}} = ${Lab.sig(s1b / s1a, 3)}$.`,
            `Multiply so grams of ${c.a} cancel: $${s2a.toFixed(2)}\\text{ g ${c.a}} \\times \\dfrac{${s1b.toFixed(2)}\\text{ g ${c.b}}}{${s1a.toFixed(2)}\\text{ g ${c.a}}} = ${Lab.sig(ans, 3)}\\text{ g ${c.b}}$.`,
          ],
        };
      },
    },
    {
      id: 'multiple',
      title: 'Multiple proportions',
      make(r) {
        const c = r.pick([
          { a: 'nitrogen', b: 'oxygen', f: ['NO', 'NO2'], m: [1.14, 2.28], ratio: '1 to 2', hi: 2, lo: 1 },
          { a: 'nitrogen', b: 'oxygen', f: ['N2O', 'NO'], m: [0.57, 1.14], ratio: '1 to 2', hi: 2, lo: 1 },
          { a: 'carbon', b: 'oxygen', f: ['CO', 'CO2'], m: [1.33, 2.66], ratio: '1 to 2', hi: 2, lo: 1 },
          { a: 'sulfur', b: 'oxygen', f: ['SO2', 'SO3'], m: [1.0, 1.5], ratio: '2 to 3', hi: 3, lo: 2 },
          { a: 'iron', b: 'oxygen', f: ['FeO', 'Fe2O3'], m: [0.286, 0.43], ratio: '2 to 3', hi: 3, lo: 2 },
          { a: 'phosphorus', b: 'chlorine', f: ['PCl3', 'PCl5'], m: [3.43, 5.72], ratio: '3 to 5', hi: 5, lo: 3 },
          { a: 'copper', b: 'chlorine', f: ['CuCl', 'CuCl2'], m: [0.558, 1.116], ratio: '1 to 2', hi: 2, lo: 1 },
          { a: 'nitrogen', b: 'oxygen', f: ['N2O3', 'N2O5'], m: [1.71, 2.85], ratio: '3 to 5', hi: 5, lo: 3 },
        ]);
        // Scale the fixed amount so the numbers change but the ratio does not.
        const k = r.pick([1, 1, 2, 3, 5]);
        const fix = k.toFixed(2);
        const m1 = c.m[0] * k, m2 = c.m[1] * k;
        const d = (x) => (x < 1 ? x.toFixed(3) : x.toFixed(2));
        const wrong = r.shuffle(['1 to 2', '2 to 3', '3 to 5', '1 to 3', '3 to 4', '1 to 1'].filter((x) => x !== c.ratio)).slice(0, 3);
        const opts = r.mc(c.ratio, wrong);
        return {
          q: `Two compounds contain only ${c.a} and ${c.b}. For every ${fix} g of ${c.a}, compound A holds ${d(m1)} g of ${c.b} and compound B holds ${d(m2)} g. What is the ratio of ${c.b} in A to ${c.b} in B?`,
          choices: opts.choices,
          answer: opts.answer,
          steps: [
            `The ${c.a} is fixed at ${fix} g, so just compare the ${c.b}.`,
            `Divide: $\\dfrac{${d(m2)}\\text{ g}}{${d(m1)}\\text{ g}} = ${(c.hi / c.lo).toFixed(2)}$, which is the same as ${c.hi} divided by ${c.lo}.`,
            `The ratio is <b>${c.ratio}</b>. These could be $\\ce{${c.f[0]}}$ and $\\ce{${c.f[1]}}$.`,
          ],
        };
      },
    },
    {
      id: 'scale',
      title: 'Scale of the atom',
      make(r) {
        const ratio = r.pick([10000, 20000, 50000, 100000]);
        const kind = r.pick(['pea', 'marble', 'grain']);
        const size = { pea: 0.8, marble: 1.5, grain: 0.1 }[kind];
        const name = { pea: 'a pea', marble: 'a marble', grain: 'a grain of sand' }[kind];
        const cm = size * ratio, m = cm / 100;
        return {
          q: `Suppose an atom is ${ratio.toLocaleString('en-US')} times wider than its nucleus. If the nucleus were the size of ${name}, ${size} cm across, how wide would the atom be, in meters?`,
          answer: m, unit: 'm', tol: 0.02,
          hint: 'Multiply by the size ratio, then change centimeters to meters.',
          steps: [
            `Multiply by the ratio: $${size}\\text{ cm} \\times ${ratio} = ${cm.toLocaleString('en-US')}\\text{ cm}$.`,
            `Convert: $${cm.toLocaleString('en-US')}\\ \\cancel{\\text{cm}} \\times \\dfrac{1\\text{ m}}{100\\ \\cancel{\\text{cm}}} = ${m.toLocaleString('en-US')}\\text{ m}$.`,
          ],
        };
      },
    },
    {
      id: 'mass-share',
      title: 'Electron mass share',
      make(r) {
        const el = r.pick(['C', 'O', 'Na', 'Mg', 'Al', 'S', 'Ca', 'Fe', 'Cu', 'Ag', 'Au']);
        const N = { C: 6, O: 8, Na: 12, Mg: 12, Al: 14, S: 16, Ca: 20, Fe: 30, Cu: 34, Ag: 60, Au: 118 }[el];
        const Z = EL[el].z;
        const me = Z * 0.00055, nuc = Z * 1.0073 + N * 1.0087;
        const pct = (me / (me + nuc)) * 100;
        return {
          q: `An atom of ${EL[el].name.toLowerCase()} has ${Z} protons, ${N} neutrons and ${Z} electrons. Use masses of 1.0073 u, 1.0087 u and 0.00055 u. What percent of the atom's mass is electrons?`,
          answer: pct, unit: '%', tol: 0.03, sf: 2,
          hint: 'Find the electron mass, find the total mass, then divide and multiply by 100.',
          steps: [
            `Electrons: $${Z} \\times 0.00055 = ${me.toFixed(4)}$ u.`,
            `Nucleus: $${Z}(1.0073) + ${N}(1.0087) = ${nuc.toFixed(2)}$ u.`,
            `Percent: $\\dfrac{${me.toFixed(4)}}{${me.toFixed(4)} + ${nuc.toFixed(2)}} \\times 100 = ${pct.toFixed(3)}\\%$. Almost nothing.`,
          ],
        };
      },
    },
    {
      id: 'who',
      title: 'Who found what',
      make(r) {
        const facts = [
          ['Which scientist discovered the electron using cathode rays?', 'Thomson'],
          ['Who measured the charge of the electron with falling oil drops?', 'Millikan'],
          ['Who concluded that atoms have a tiny, dense, positive nucleus?', 'Rutherford'],
          ['Who discovered the neutron in 1932?', 'Chadwick'],
          ['Who proposed that all matter is made of atoms that combine in whole-number ratios?', 'Dalton'],
          ['Who proposed the plum pudding model?', 'Thomson'],
          ['Who interpreted the gold foil results?', 'Rutherford'],
          ['Whose experiment measured the charge of $1.602 \\times 10^{-19}$ C?', 'Millikan'],
          ['Whose atomic theory said that a reaction only rearranges atoms?', 'Dalton'],
        ];
        const why = {
          Thomson: 'Thomson bent cathode rays in 1897 and found the electron. He then proposed the plum pudding model.',
          Millikan: "Millikan's oil drop experiment measured the electron's charge.",
          Rutherford: 'Rutherford explained the gold foil results with a tiny, dense, positive nucleus.',
          Chadwick: 'Chadwick found the neutral particle in the nucleus in 1932.',
          Dalton: "Dalton's atomic theory, from the early 1800s, explained the mass laws with atoms.",
        };
        const [q, a] = r.pick(facts);
        const opts = r.mc(a, ['Thomson', 'Millikan', 'Rutherford', 'Chadwick', 'Dalton'].filter((x) => x !== a));
        return { q, choices: opts.choices, answer: opts.answer, steps: [why[a]] };
      },
    },
    {
      id: 'particle',
      title: 'Which particle?',
      make(r) {
        const facts = [
          ['has a charge of $-1$', 'Electron', 'The electron is negative, with a charge of $-1$.'],
          ['has a charge of $+1$', 'Proton', 'The proton is positive, with a charge of $+1$.'],
          ['has no charge', 'Neutron', 'The neutron is neutral.'],
          ['has a mass of about 0.00055 u', 'Electron', 'The electron is about 1,836 times lighter than a proton.'],
          ['lives outside the nucleus', 'Electron', 'Electrons are in a cloud around the nucleus. Protons and neutrons are in the nucleus.'],
          ['is in the nucleus and is positive', 'Proton', 'Protons and neutrons are in the nucleus, and only protons are positive.'],
          ['is in the nucleus and has no charge', 'Neutron', 'Neutrons sit in the nucleus and carry no charge.'],
          ['was found by Thomson', 'Electron', 'Thomson found the electron in cathode rays.'],
          ['was found by Chadwick', 'Neutron', 'Chadwick found the neutron in 1932.'],
          ['makes up cathode rays', 'Electron', 'Cathode rays are streams of electrons.'],
          ['is the heaviest of the three, by a tiny margin', 'Neutron', 'The neutron is 1.0087 u and the proton is 1.0073 u.'],
        ];
        const [q, a, why] = r.pick(facts);
        const opts = r.mc(a, ['Proton', 'Neutron', 'Electron'].filter((x) => x !== a));
        return { q: `Which particle ${q}?`, choices: opts.choices, answer: opts.answer, steps: [why] };
      },
    },
    {
      id: 'evidence',
      title: 'Explain the evidence',
      make(r) {
        const facts = [
          ['Most alpha particles pass straight through gold foil.', 'The atom is mostly empty space', ['The nucleus is negative', 'Electrons are very heavy', 'Gold is a soft metal']],
          ['A few alpha particles bounce back from gold foil.', 'The atom has a tiny, heavy, positive center', ['Electrons repel alpha particles strongly', 'The foil is full of neutrons', 'Atoms are solid spheres']],
          ['Some alpha particles bend as they pass through foil.', 'The center of the atom has a positive charge that repels them', ['Alpha particles are negative', 'Electrons pull them along', 'They hit air molecules']],
          ['A cathode ray bends toward a positive plate.', 'The ray is made of negative particles', ['The ray is made of positive particles', 'The ray has no charge', 'The ray is a form of light']],
          ['Cathode rays are the same no matter what metal the cathode is made of.', 'Every atom contains electrons', ['All metals are the same element', 'The rays come from the glass', 'Only metals contain electrons']],
          ['Oil drops always carry whole-number multiples of $1.602 \\times 10^{-19}$ C.', 'Charge comes in units the size of one electron', ['Oil is made of electrons', 'Oil drops have no mass', 'The nucleus is positive']],
          ['A sealed flask has the same mass before and after a reaction.', 'Atoms are rearranged, not created or destroyed', ['Reactions do not really happen in flasks', 'Gases have no mass', 'All compounds have the same mass']],
        ];
        const [obs, a, wrong] = r.pick(facts);
        const opts = r.mc(a, wrong);
        return { q: `<b>Observation:</b> ${obs} What does this tell you?`, choices: opts.choices, answer: opts.answer, steps: [`The evidence points to this: ${a.toLowerCase()}.`] };
      },
    },
  ],

  cards: [
    { front: 'Law of conservation of mass', back: 'Total mass stays the same in a reaction. Atoms rearrange, they are not created or destroyed.' },
    { front: 'Law of definite proportions', back: 'A compound always contains the same elements in the same mass ratio.' },
    { front: 'Law of multiple proportions', back: 'When two elements form more than one compound, the masses of one element per fixed mass of the other are in small whole-number ratios.' },
    { front: 'What did Thomson discover?', back: 'The electron, from cathode rays bending toward a positive plate.' },
    { front: 'What did Millikan measure?', back: "The electron's charge, $-1.602 \\times 10^{-19}$ C, with the oil drop experiment." },
    { front: 'What did the gold foil experiment show?', back: 'Atoms are mostly empty space with a tiny, dense, positive nucleus.' },
    { front: 'Who discovered the neutron?', back: 'James Chadwick, in 1932.' },
    { front: 'Mass and charge of a proton', back: 'About 1 u, charge $+1$, in the nucleus.' },
    { front: 'Mass and charge of a neutron', back: 'About 1 u, no charge, in the nucleus.' },
    { front: 'Mass and charge of an electron', back: 'About 0.00055 u, charge $-1$, in a cloud around the nucleus.' },
  ],

  terms: [
    { term: 'Law of conservation of mass', def: 'Total mass does not change during a chemical reaction.' },
    { term: 'Law of definite proportions', def: 'Every sample of a compound has the same elements in the same mass ratio.' },
    { term: 'Law of multiple proportions', def: 'When two elements form several compounds, the masses of one per fixed mass of the other are in small whole-number ratios.' },
    { term: 'Cathode ray', def: 'A beam of electrons streaming from the negative plate of an evacuated tube.' },
    { term: 'Electron', def: 'A negative particle with charge $-1$ and a mass of about 0.00055 u, found in a cloud around the nucleus.' },
    { term: 'Plum pudding model', def: "Thomson's model of the atom: positive charge spread evenly, with electrons embedded in it. Disproved by gold foil." },
    { term: 'Alpha particle', def: 'A fast, heavy, positive particle (2 protons and 2 neutrons, a helium nucleus) given off by some radioactive atoms.' },
    { term: 'Nucleus', def: 'The tiny, dense, positive center of an atom, holding its protons and neutrons.' },
    { term: 'Proton', def: 'A positive particle in the nucleus with charge $+1$ and a mass of about 1 u.' },
    { term: 'Neutron', def: 'A neutral particle in the nucleus with a mass of about 1 u.' },
  ],
});
