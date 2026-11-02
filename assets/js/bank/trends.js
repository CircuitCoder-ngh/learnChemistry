/* Question bank for 7.5 Periodic trends. Comparisons use the real values in the element table.
   Bank.all.trends.lib holds the successive ionization energies and ionic radii that the page also uses. */
(function () {
  'use strict';
  /* Successive ionization energies in kJ/mol (NIST), up to just past the end of the valence electrons. */
  const SUCC = {
    Li: [520, 7298, 11815], Be: [899, 1757, 14849], B: [801, 2427, 3660, 25026], C: [1086, 2353, 4621, 6223, 37832],
    N: [1402, 2856, 4578, 7475, 9445, 53267], O: [1314, 3388, 5301, 7469, 10990, 13327, 71330], F: [1681, 3374, 6050, 8408, 11023, 15164, 17868, 92038],
    Na: [496, 4562, 6910], Mg: [738, 1451, 7733, 10543], Al: [578, 1817, 2745, 11577, 14842], Si: [786, 1577, 3232, 4356, 16091],
    P: [1012, 1907, 2914, 4964, 6274, 21267], S: [1000, 2252, 3357, 4556, 7004, 8496, 27107], Cl: [1251, 2298, 3822, 5159, 6542, 9362, 11018, 33604],
    K: [419, 3052, 4420], Ca: [590, 1145, 4912, 6491],
  };
  /* Ionic radii in pm (Shannon, coordination number 6; N3- is coordination number 4). */
  const IONIC = {
    'Li+': 76, 'Na+': 102, 'K+': 138, 'Be2+': 45, 'Mg2+': 72, 'Ca2+': 100, 'Al3+': 54,
    'F-': 133, 'Cl-': 181, 'Br-': 196, 'I-': 220, 'O2-': 140, 'S2-': 184, 'N3-': 146,
  };
  const SER = {
    10: [['N3-', 7], ['O2-', 8], ['F-', 9], ['Na+', 11], ['Mg2+', 12], ['Al3+', 13]],
    18: [['S2-', 16], ['Cl-', 17], ['K+', 19], ['Ca2+', 20]],
  };
  const ionTex = (name) => {
    const m = /^([A-Z][a-z]?)(\d?)([+-])$/.exec(name);
    return `\\ce{${m[1]}^{${m[2]}${m[3]}}}`;
  };
  const els = () => window.ELEMENTS;
  const mainPeriod = (p) => els().filter((e) => e.period === p && (e.block === 's' || e.block === 'p') && e.family !== 'Noble gas');
  const mainGroup = (g) => els().filter((e) => e.group === g && e.period >= 2 && e.period <= 5);
  /** Real value used for each property. Noble gases have no meaningful electronegativity here. */
  const VAL = {
    rcov: (e) => e.rcov,
    ie: (e) => e.ie,
    en: (e) => (e.family === 'Noble gas' ? null : e.en),
    ea: (e) => e.ea,
  };
  const INFO = {
    rcov: { name: 'atomic radius', unit: 'pm', across: -1, down: 1, why: 'Across a period, $Z_{\\text{eff}}$ rises, pulling the shell in. Down a group, new shells make the atom larger.' },
    ie: { name: 'first ionization energy', unit: 'eV', across: 1, down: -1, why: 'Across a period, $Z_{\\text{eff}}$ rises and electrons are held tighter. Down a group, the outer electron is farther away and easier to remove.' },
    en: { name: 'electronegativity', unit: '', across: 1, down: -1, why: 'Atoms toward the top right pull hardest on bonding electrons, because of high $Z_{\\text{eff}}$ and short distance.' },
  };
  /** Pick k elements from a line of the table whose real values agree with the trend, well spaced. */
  function pickLine(r, prop, k, usePeriod) {
    const info = INFO[prop];
    for (let tries = 0; tries < 200; tries++) {
      const list = usePeriod ? mainPeriod(r.int(2, 5)) : mainGroup(r.pick([1, 2, 13, 14, 15, 16, 17]));
      if (list.length < k) continue;
      const pick = r.shuffle(list).slice(0, k).sort((a, b) => a.z - b.z);
      const dir = usePeriod ? info.across : info.down;
      let ok = pick.every((e) => VAL[prop](e) !== null && VAL[prop](e) !== undefined);
      for (let i = 1; ok && i < k; i++) {
        const a = VAL[prop](pick[i - 1]), b = VAL[prop](pick[i]);
        if ((b - a) * dir <= 0 || Math.abs(b - a) / Math.max(a, b) < 0.03) ok = false;
      }
      if (ok) return pick;
    }
    return null;
  }
  const lib = { SUCC, IONIC, SER, ionTex, VAL, INFO, pickLine };

  Bank.add('trends', {
    lib,
    quiz: [
      {
        q: 'Why does atomic radius decrease from left to right across a period?',
        options: ['Electrons are removed as you go right', 'Protons are added but electrons go in the same shell, so $Z_{\\text{eff}}$ rises', 'New electron shells are added', 'Atoms on the right have fewer neutrons'],
        answer: 1,
        why: 'Each step adds a proton and an electron in the same shell. Inner shielding barely changes, so the outer electrons are pulled closer.',
      },
      {
        q: 'Which atom has the largest radius?',
        options: ['Li', 'Na', 'Cs', 'F'],
        answer: 2,
        why: 'Radius grows down a group as shells are added, and it shrinks across a period. Cs is low on the left: 244 pm in the data.',
      },
      {
        q: 'Which has the highest first ionization energy?',
        options: ['Na', 'Mg', 'Al', 'Ar'],
        answer: 3,
        why: 'All four are in period 3. Argon, at the far right, has the highest $Z_{\\text{eff}}$ and a full shell: 15.76 eV.',
      },
      {
        q: 'Why is the first ionization energy of boron lower than that of beryllium?',
        options: ['Boron has fewer protons', "Boron's outer electron is in a 2p orbital, higher in energy and shielded by 2s", 'Beryllium has a larger radius', 'Boron is a metal and beryllium is not'],
        answer: 1,
        why: 'Removing the lone 2p electron of boron is easier than removing a 2s electron from beryllium, even though boron has one more proton.',
      },
      {
        q: 'Why is the first ionization energy of oxygen lower than that of nitrogen?',
        options: ['Oxygen has a paired 2p electron, and the pair repels', 'Oxygen has fewer protons', 'Nitrogen has more electron shells', 'Oxygen has a filled 2p subshell'],
        answer: 0,
        why: "Nitrogen has three unpaired 2p electrons. Oxygen's fourth 2p electron must share a box, and that repulsion makes it easier to remove.",
      },
      {
        q: 'Which is the correct size order?',
        options: ['$\\ce{Na+} > \\ce{Na}$ and $\\ce{Cl-} > \\ce{Cl}$', '$\\ce{Na} > \\ce{Na+}$ and $\\ce{Cl-} > \\ce{Cl}$', '$\\ce{Na+} > \\ce{Na}$ and $\\ce{Cl} > \\ce{Cl-}$', '$\\ce{Na} > \\ce{Na+}$ and $\\ce{Cl} > \\ce{Cl-}$'],
        answer: 1,
        why: 'Sodium loses its whole outer shell, so the cation shrinks. Chlorine gains an electron, adding repulsion, so the anion grows.',
      },
      {
        q: 'Which is the largest of these isoelectronic ions?',
        options: ['$\\ce{O^{2-}}$', '$\\ce{F-}$', '$\\ce{Na+}$', '$\\ce{Mg^{2+}}$'],
        answer: 0,
        why: 'All have 10 electrons. Oxygen has the fewest protons (8), so its electrons are held least tightly.',
      },
      {
        q: 'Which element has the highest electronegativity?',
        options: ['Fluorine', 'Oxygen', 'Chlorine', 'Neon'],
        answer: 0,
        why: 'Fluorine is the top right of the table, at 3.98 on the Pauling scale. Noble gases have no meaningful value in this scale, as they rarely form bonds.',
      },
      {
        q: 'An element has a huge jump in ionization energy between its second and third electrons. Which group is it in?',
        options: ['Group 1', 'Group 2', 'Group 13', 'Group 17'],
        answer: 1,
        why: 'The wall comes after two electrons, so there are 2 valence electrons. The third would have to come from the core.',
      },
      {
        q: 'Metallic character is greatest toward:',
        options: ['The top right of the table', 'The top left', 'The bottom left', 'The bottom right'],
        answer: 2,
        why: 'Metals lose electrons easily. Ionization energy is lowest at the bottom left, around cesium.',
      },
    ],

    gens: [
      ...['rcov', 'ie', 'en'].map((prop) => ({
        id: 'rank-' + prop,
        title: 'Rank by ' + INFO[prop].name,
        make(r) {
          const info = INFO[prop];
          const usePeriod = r.next() < 0.5;
          const pick = pickLine(r, prop, 3, usePeriod) || pickLine(r, prop, 3, !usePeriod);
          const wantHigh = r.next() < 0.5;
          const sorted = pick.slice().sort((a, b) => VAL[prop](a) - VAL[prop](b));
          const ans = wantHigh ? sorted[2] : sorted[0];
          const others = pick.filter((e) => e !== ans).map((e) => e.name);
          const mc = r.mc(ans.name, others);
          const lineTxt = usePeriod ? `All three are in period ${pick[0].period}.` : `All three are in group ${pick[0].group}.`;
          return {
            q: `Which has the ${wantHigh ? (prop === 'rcov' ? 'largest' : 'highest') : (prop === 'rcov' ? 'smallest' : 'lowest')} ${info.name}: ${r.shuffle(pick).map((e) => e.name.toLowerCase()).join(', ')}?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              lineTxt,
              info.why,
              `Real values: ${sorted.map((e) => `${e.sym} ${VAL[prop](e)}${info.unit ? ' ' + info.unit : ''}`).join(', ')}. So the answer is ${ans.name.toLowerCase()}.`,
            ],
          };
        },
      })),
      {
        id: 'zeff',
        title: 'Estimate the effective charge',
        make(r) {
          const e = r.pick(els().filter((x) => (x.block === 's' || x.block === 'p') && x.z > 2 && x.z <= 56));
          const group = e.family === 'Noble gas' ? 8 : e.group <= 2 ? e.group : e.group - 10;
          const coreN = e.z - group;
          return {
            q: `Estimate $Z_{\\text{eff}}$ for the valence electrons of ${e.name.toLowerCase()} (Z = ${e.z}), using $Z_{\\text{eff}} \\approx Z - \\text{core electrons}$.`,
            answer: group, tol: 0.001, unit: '',
            hint: 'For a main-group atom, core electrons are all the electrons except the valence ones.',
            steps: [
              `${e.name} is in group ${e.group}, so it has ${group} valence electrons.`,
              `Core electrons: $${e.z} - ${group} = ${coreN}$.`,
              `$Z_{\\text{eff}} \\approx ${e.z} - ${coreN} = +${group}$.`,
            ],
          };
        },
      },
      {
        id: 'iso',
        title: 'Rank an isoelectronic series',
        make(r) {
          const key = r.pick([10, 18]);
          const list = r.shuffle(SER[key]).slice(0, 3);
          const sorted = list.slice().sort((a, b) => IONIC[b[0]] - IONIC[a[0]]);
          const wantLarge = r.next() < 0.5;
          const ans = wantLarge ? sorted[0] : sorted[2];
          const mc = r.mc(`$${ionTex(ans[0])}$`, list.filter((x) => x !== ans).map((x) => `$${ionTex(x[0])}$`));
          return {
            q: `Which ion is the ${wantLarge ? 'largest' : 'smallest'}: ${list.map((x) => `$${ionTex(x[0])}$`).join(', ')}?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              `All have ${key} electrons, so they are isoelectronic.`,
              `With the same electrons, more protons pull harder and make a smaller ion. Protons: ${sorted.map((x) => `${x[0].replace(/[\d+-]/g, '')} has ${x[1]}`).join(', ')}.`,
              `Radii: ${sorted.map((x) => `$${ionTex(x[0])}$ is ${IONIC[x[0]]} pm`).join(', ')}.`,
            ],
          };
        },
      },
      {
        id: 'atom-ion',
        title: 'Atom or ion: which is bigger?',
        make(r) {
          const name = r.pick(Object.keys(IONIC));
          const sym = name.replace(/[\d+-]/g, '');
          const e = window.EL[sym];
          const cation = name.endsWith('+');
          const ans = cation ? e.name + ' atom' : 'The ion';
          const mc = r.mc(ans, [cation ? 'The ion' : e.name + ' atom', 'They are the same size']);
          return {
            q: `Which is larger, a neutral ${e.name.toLowerCase()} atom or the ion $${ionTex(name)}$?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              cation ? 'A cation has lost its outer electrons, usually a whole shell, and the rest are pulled tighter.' : 'An anion has gained electrons in the same shell. The nuclear charge is unchanged, and electrons repel each other more.',
              cation ? `So the atom is larger than the ion, which has a radius of ${IONIC[name]} pm.` : `So the ion, at ${IONIC[name]} pm, is larger than the atom.`,
            ],
          };
        },
      },
      {
        id: 'succ-group',
        title: 'Find the group from successive IEs',
        make(r) {
          const sym = r.pick(Object.keys(SUCC));
          const e = window.EL[sym], list = SUCC[sym];
          const v = list.length - 1 >= 1 ? (e.group <= 2 ? e.group : e.group - 10) : 1;
          const shown = list.slice(0, v + 1);
          const right = `Group ${e.group}`;
          const wrongs = [1, 2, 13, 14, 15, 16, 17].filter((g) => g !== e.group).map((g) => `Group ${g}`);
          const mc = r.mc(right, r.shuffle(wrongs).slice(0, 3));
          return {
            q: `A main-group element has these successive ionization energies, in kJ/mol: ${shown.map((x) => x.toLocaleString('en-US')).join(', ')}. Which group is it in?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              `Look for the wall: the jump from ${shown[v - 1].toLocaleString('en-US')} to ${shown[v].toLocaleString('en-US')} is far bigger than the others.`,
              `The wall comes after electron ${v}, so the atom has ${v} valence electron${v === 1 ? '' : 's'}.`,
              `${v} valence electron${v === 1 ? '' : 's'} means ${right.toLowerCase()}. This is ${e.name.toLowerCase()}.`,
            ],
          };
        },
      },
      {
        id: 'exceptions',
        title: 'Spot the exception',
        make(r) {
          const pair = r.pick([['Be', 'B'], ['N', 'O'], ['Mg', 'Al'], ['P', 'S']]);
          const a = window.EL[pair[0]], b = window.EL[pair[1]];
          const mc = r.mc(a.name, [b.name]);
          const isS = pair[1] === 'B' || pair[1] === 'Al';
          return {
            q: `Which has the higher first ionization energy: ${a.name.toLowerCase()} or ${b.name.toLowerCase()}?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              `The general trend would predict ${b.name.toLowerCase()}, but this pair is a known exception.`,
              isS ? `${b.name} loses a p electron, which is higher in energy and shielded by the s electrons below it.` : `${b.name} has its first paired p electron, and the repulsion makes it easier to remove.`,
              `Real values: ${a.sym} ${a.ie} eV and ${b.sym} ${b.ie} eV.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What is effective nuclear charge?', back: 'The net pull an outer electron feels. Estimate: $Z_{\\text{eff}} \\approx Z - \\text{core electrons}$.' },
      { front: 'What is shielding?', back: 'Inner electrons block part of the pull of the nucleus on outer electrons.' },
      { front: 'How does atomic radius change?', back: 'Smaller across a period, larger down a group.' },
      { front: 'How does first ionization energy change?', back: 'Higher across a period, lower down a group. Dips at Be to B and N to O.' },
      { front: 'What is electronegativity?', back: 'How strongly an atom pulls on shared electrons in a bond. Highest at fluorine.' },
      { front: 'What is electron affinity?', back: 'The energy change when a gas atom gains an electron. Halogens release the most, and Cl beats F.' },
      { front: 'Which is bigger: an atom or its cation? Its anion?', back: 'Cations are smaller than their atoms. Anions are larger.' },
      { front: 'What does a huge jump in successive ionization energies mean?', back: 'All the valence electrons are gone, and the next would come from the core.' },
      { front: 'In an isoelectronic series, which is smallest?', back: 'The one with the most protons.' },
    ],

    terms: [
      { term: 'Effective nuclear charge', def: 'The net positive charge an outer electron feels after shielding. Symbol $Z_{\\text{eff}}$.' },
      { term: 'Shielding', def: 'The way inner electrons reduce the pull of the nucleus on outer electrons.' },
      { term: 'Atomic radius', def: 'A measure of the size of an atom, often half the distance between two bonded atoms.' },
      { term: 'Covalent radius', def: 'Half the length of a single bond between two identical atoms. It is used here as the atomic radius.' },
      { term: 'Ionic radius', def: 'The size of an ion in an ionic crystal.' },
      { term: 'Ionization energy', def: 'The energy needed to remove an electron from a gas atom or ion.' },
      { term: 'Successive ionization energies', def: 'The energies to remove the first, second, third and later electrons from an atom, one at a time.' },
      { term: 'Electron affinity', def: 'The energy change when a gas atom gains an electron. Here, a positive value means energy is released.' },
      { term: 'Electronegativity', def: 'How strongly an atom pulls on shared electrons in a bond, on the Pauling scale.' },
      { term: 'Metallic character', def: 'How readily an element loses electrons and behaves like a metal.' },
      { term: 'Isoelectronic series', def: 'A set of atoms and ions with the same number of electrons.' },
    ],
  });
})();
