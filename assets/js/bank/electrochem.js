/* Question bank for 16 Batteries and electrochemistry. */
(function () {
  /* Standard reduction potentials at 25 °C, volts. The same values appear in the lesson's table. */
  const POT = {
    Mg: { E: -2.37, n: 2, name: 'magnesium' },
    Al: { E: -1.66, n: 3, name: 'aluminum' },
    Zn: { E: -0.76, n: 2, name: 'zinc' },
    Fe: { E: -0.44, n: 2, name: 'iron' },
    Ni: { E: -0.25, n: 2, name: 'nickel' },
    Pb: { E: -0.13, n: 2, name: 'lead' },
    Cu: { E: 0.34, n: 2, name: 'copper' },
    Ag: { E: 0.80, n: 1, name: 'silver' },
  };
  const F = 96485;
  const KEYS = Object.keys(POT);
  const ion = (m) => (POT[m].n === 1 ? `${m}+` : `${m}^${POT[m].n}+`);
  const signed = (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2);
  const tex = (v) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(2);
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const lcm = (a, b) => (a * b) / gcd(a, b);
  const two = (r) => {
    const a = r.pick(KEYS);
    let b = r.pick(KEYS);
    while (b === a) b = r.pick(KEYS);
    return POT[a].E < POT[b].E ? [a, b] : [b, a]; // [anode, cathode]
  };
  const potLine = (a, b) => `$E^\\circ(\\ce{${ion(a)}}/\\ce{${a}}) = ${tex(POT[a].E)}$ V and $E^\\circ(\\ce{${ion(b)}}/\\ce{${b}}) = ${tex(POT[b].E)}$ V`;
  const coef = (k, s) => (k === 1 ? s : k + s);
  /** The balanced overall reaction for a cell, as an mhchem string. */
  const overall = (an, cat) => {
    const L = lcm(POT[an].n, POT[cat].n);
    const ka = L / POT[an].n, kc = L / POT[cat].n;
    return { L, ka, kc, ce: `${coef(ka, an)} + ${coef(kc, ion(cat))} -> ${coef(ka, ion(an))} + ${coef(kc, cat)}` };
  };
  /** Text scientific notation inside math mode. */
  const sciTex = (x, sf = 3) => {
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e >= -2 && e <= 4) return Lab.sig(x, sf);
    return `${(x / Math.pow(10, e)).toFixed(sf - 1)} \\times 10^{${e}}`;
  };

  Bank.add('electrochem', {
    quiz: [
      {
        q: 'In a working galvanic cell, which way do electrons travel through the wire?',
        options: ['From the anode to the cathode', 'From the cathode to the anode', 'Back and forth, with no net direction', 'They do not move through the wire, only through the salt bridge'],
        answer: 0,
        why: 'Oxidation at the anode releases electrons, and reduction at the cathode uses them. So electrons run anode to cathode.',
      },
      {
        q: 'What does the salt bridge carry?',
        options: ['Electrons, from one beaker to the other', 'Ions, which keep each beaker electrically neutral', 'Water, which keeps the levels equal', 'Metal atoms, from one electrode to the other'],
        answer: 1,
        why: 'Electrons never swim through solution. Anions drift toward the anode side and cations toward the cathode side, so charge never piles up.',
      },
      {
        q: 'In the zinc and copper cell, what happens to the two electrodes as it runs?',
        options: ['Both get heavier', 'Both get lighter', 'Zinc gets lighter and copper gets heavier', 'Zinc gets heavier and copper gets lighter'],
        answer: 2,
        why: 'Zinc atoms leave the anode as $\\ce{Zn^2+}$, and $\\ce{Cu^2+}$ ions plate onto the cathode as copper atoms.',
      },
      {
        q: 'Find $E^\\circ_{\\text{cell}}$ for $\\ce{Zn + 2Ag+ -> Zn^2+ + 2Ag}$. Use $E^\\circ(\\ce{Ag+}/\\ce{Ag}) = +0.80$ V and $E^\\circ(\\ce{Zn^2+}/\\ce{Zn}) = -0.76$ V.',
        options: ['+0.04 V', '+1.56 V', '+2.36 V', '−1.56 V'],
        answer: 1,
        why: '$E^\\circ_{\\text{cell}} = 0.80 - (-0.76) = +1.56$ V. Choosing 2.36 V means you doubled the silver potential, which you never do. Choosing 0.04 V means you added without flipping anything.',
      },
      {
        q: 'Which of these is the strongest reducing agent: Mg, Zn, or Cu?',
        options: ['Mg, since it has the lowest $E^\\circ$', 'Zn, since it sits in the middle', 'Cu, since it has the highest $E^\\circ$', 'They are equal, since all are metals'],
        answer: 0,
        why: 'A reducing agent gives electrons away. The lower the $E^\\circ$ of a metal\'s ion, the more easily the metal gives up electrons. Magnesium is at $-2.37$ V.',
      },
      {
        q: 'A cell has a positive $E^\\circ_{\\text{cell}}$. What must be true?',
        options: ['$\\Delta G^\\circ$ is negative and the reaction is spontaneous', '$\\Delta G^\\circ$ is positive and the reaction is spontaneous', '$\\Delta G^\\circ$ is negative and the reaction needs a power supply', 'The reaction is at equilibrium'],
        answer: 0,
        why: 'Since $\\Delta G^\\circ = -nFE^\\circ_{\\text{cell}}$, a positive voltage makes $\\Delta G^\\circ$ negative: spontaneous.',
      },
      {
        q: 'In an electrolytic cell, the cathode is:',
        options: ['Where oxidation happens, and it is positive', 'Where oxidation happens, and it is negative', 'Where reduction happens, and it is positive', 'Where reduction happens, and it is negative'],
        answer: 3,
        why: 'Reduction is always at the cathode. The power supply pushes electrons onto it, so in electrolysis it is the negative electrode.',
      },
      {
        q: 'The same charge passes through a solution of $\\ce{Ag+}$ and a solution of $\\ce{Cu^2+}$. How do the moles of metal deposited compare?',
        options: ['Equal moles of each', 'Twice as many moles of silver as copper', 'Twice as many moles of copper as silver', 'It depends only on the molar masses'],
        answer: 1,
        why: 'Each $\\ce{Ag+}$ needs 1 electron and each $\\ce{Cu^2+}$ needs 2, so the same electrons make twice as many silver atoms.',
      },
      {
        q: 'Steel can be coated with zinc to protect it from rusting. Why does zinc protect the iron?',
        options: ['Zinc has a lower $E^\\circ$, so zinc gets oxidized instead of iron', 'Zinc has a higher $E^\\circ$, so zinc gets reduced instead of iron', 'Zinc is a noble metal that never reacts', 'Zinc adds electrons to the oxygen in the air, turning it inert'],
        answer: 0,
        why: 'Zinc ($-0.76$ V) gives up electrons more easily than iron ($-0.44$ V). Zinc acts as the anode and is used up first.',
      },
    ],

    gens: [
      {
        id: 'ecell',
        title: 'Find the cell potential',
        make(r) {
          const [an, cat] = two(r);
          const E = POT[cat].E - POT[an].E;
          return {
            q: `A galvanic cell uses ${POT[an].name} and ${POT[cat].name} electrodes in 1 M solutions of their ions. Given ${potLine(an, cat)}, find $E^\\circ_{\\text{cell}}$.`,
            answer: +E.toFixed(2), unit: 'V', tol: 0.005, answerText: E.toFixed(2),
            hint: 'The higher $E^\\circ$ is the cathode. Then use cathode minus anode.',
            steps: [
              `The higher $E^\\circ$ gets reduced, so ${POT[cat].name} is the cathode and ${POT[an].name} is the anode.`,
              `$E^\\circ_{\\text{cell}} = E^\\circ_{\\text{cathode}} - E^\\circ_{\\text{anode}} = (${tex(POT[cat].E)}\\text{ V}) - (${tex(POT[an].E)}\\text{ V})$`,
              `$E^\\circ_{\\text{cell}} = ${tex(E)}\\text{ V}$. Do not multiply either value by a coefficient.`,
            ],
          };
        },
      },
      {
        id: 'which-anode',
        title: 'Spot the anode',
        make(r) {
          const [an, cat] = two(r);
          const job = r.pick(['anode', 'cathode', 'flow', 'mass']);
          const ctx = `A galvanic cell uses ${POT[an].name} and ${POT[cat].name} electrodes. ${potLine(an, cat)}.`;
          const stepsBase = `The lower $E^\\circ$ gives up electrons, so ${POT[an].name} is oxidized and is the anode. ${POT[cat].name[0].toUpperCase() + POT[cat].name.slice(1)} is the cathode.`;
          if (job === 'anode') {
            const m = r.mc(POT[an].name[0].toUpperCase() + POT[an].name.slice(1), [POT[cat].name[0].toUpperCase() + POT[cat].name.slice(1), 'Either one, since it depends on which beaker is on the left', 'Neither one, since the salt bridge is the anode']);
            return { q: `${ctx} Which metal is the anode?`, ...m, steps: [stepsBase] };
          }
          if (job === 'cathode') {
            const m = r.mc(`$\\ce{${ion(cat)}}$ is reduced to ${POT[cat].name} metal`, [`$\\ce{${ion(an)}}$ is reduced to ${POT[an].name} metal`, `${POT[cat].name[0].toUpperCase() + POT[cat].name.slice(1)} metal is oxidized to $\\ce{${ion(cat)}}$`, `${POT[an].name[0].toUpperCase() + POT[an].name.slice(1)} metal is reduced`]);
            return { q: `${ctx} What happens at the cathode?`, ...m, steps: [stepsBase, `At the cathode, $\\ce{${ion(cat)}}$ gains electrons and becomes ${POT[cat].name} metal.`] };
          }
          if (job === 'flow') {
            const m = r.mc(`Electrons go from ${POT[an].name} to ${POT[cat].name}, and anions in the bridge go toward the ${POT[an].name} side`, [`Electrons go from ${POT[cat].name} to ${POT[an].name}, and anions in the bridge go toward the ${POT[an].name} side`, `Electrons go from ${POT[an].name} to ${POT[cat].name}, and anions in the bridge go toward the ${POT[cat].name} side`, `Electrons go through the salt bridge, and ions go through the wire`]);
            return { q: `${ctx} Which description is right?`, ...m, steps: [stepsBase, `Electrons leave the anode through the wire. The anode side gains positive ions, so anions drift toward it through the bridge.`] };
          }
          const m = r.mc(`The ${POT[cat].name} electrode gains mass and the ${POT[an].name} electrode loses mass`, [`The ${POT[an].name} electrode gains mass and the ${POT[cat].name} electrode loses mass`, 'Both electrodes gain mass', 'Neither electrode changes mass']);
          return { q: `${ctx} What happens to the electrodes as the cell runs?`, ...m, steps: [stepsBase, 'Metal atoms leave the anode as ions, and ions plate onto the cathode as metal atoms.'] };
        },
      },
      {
        id: 'spontaneous',
        title: 'Will it run?',
        make(r) {
          const [an, cat] = two(r);
          const forward = r.next() < 0.5;
          const ov = overall(an, cat);
          const back = `${coef(ov.ka, ion(an))} + ${coef(ov.kc, cat)} -> ${coef(ov.ka, an)} + ${coef(ov.kc, ion(cat))}`;
          const E = POT[cat].E - POT[an].E;
          const cMetal = forward ? an : cat, redIon = forward ? cat : an;
          const val = POT[redIon].E - POT[cMetal].E;
          const m = r.mc(forward ? 'Yes, it is spontaneous' : 'No, it needs a power supply', [forward ? 'No, it needs a power supply' : 'Yes, it is spontaneous']);
          return {
            q: `Does $\\ce{${forward ? ov.ce : back}}$ run on its own under standard conditions? Use ${potLine(an, cat)}.`,
            ...m,
            steps: [
              `In the reaction as written, $\\ce{${ion(redIon)}}$ gains electrons, so it is the cathode. $\\ce{${cMetal}}$ is oxidized, so it is the anode.`,
              `$E^\\circ_{\\text{cell}} = (${tex(POT[redIon].E)}) - (${tex(POT[cMetal].E)}) = ${tex(val)}$ V.`,
              forward ? 'Positive voltage: spontaneous.' : `Negative voltage: not spontaneous. It runs only if pushed. The reverse reaction is spontaneous, at ${tex(E)} V.`,
            ],
          };
        },
      },
      {
        id: 'electrons',
        title: 'Count the electrons',
        make(r) {
          const pairs = [['Zn', 'Cu'], ['Zn', 'Ag'], ['Al', 'Cu'], ['Al', 'Ag'], ['Mg', 'Ag'], ['Mg', 'Cu'], ['Al', 'Ni'], ['Fe', 'Ag'], ['Pb', 'Ag'], ['Mg', 'Al'], ['Al', 'Zn']];
          const [an, cat] = r.pick(pairs);
          const ov = overall(an, cat);
          return {
            q: `How many moles of electrons move in the balanced reaction $\\ce{${ov.ce}}$, as written?`,
            answer: ov.L, unit: 'mol', tol: 0, answerText: String(ov.L),
            hint: 'Write each half-reaction. The electrons lost have to equal the electrons gained.',
            steps: [
              `Oxidation: each $\\ce{${an}}$ loses ${POT[an].n} electrons. With ${ov.ka} $\\ce{${an}}$, that is $${ov.ka} \\times ${POT[an].n} = ${ov.L}$.`,
              `Reduction: each $\\ce{${ion(cat)}}$ gains ${POT[cat].n} electron${POT[cat].n > 1 ? 's' : ''}. With ${ov.kc} $\\ce{${ion(cat)}}$, that is $${ov.kc} \\times ${POT[cat].n} = ${ov.L}$.`,
              `Lost equals gained, so $n = ${ov.L}$ mol of electrons.`,
            ],
          };
        },
      },
      {
        id: 'delta-g',
        title: 'Free energy from voltage',
        make(r) {
          const [an, cat] = r.pick([['Zn', 'Cu'], ['Zn', 'Ag'], ['Mg', 'Cu'], ['Fe', 'Cu'], ['Ni', 'Ag'], ['Al', 'Cu'], ['Mg', 'Ag'], ['Pb', 'Ag'], ['Zn', 'Ni']]);
          const ov = overall(an, cat);
          const E = POT[cat].E - POT[an].E;
          const J = -ov.L * F * E;
          const kJ = J / 1000;
          return {
            q: `For $\\ce{${ov.ce}}$, $E^\\circ_{\\text{cell}} = ${E.toFixed(2)}$ V. Find $\\Delta G^\\circ$ in kJ. Use $F = 96{,}485$ C/mol.`,
            answer: kJ, unit: 'kJ', tol: 0.02,
            hint: 'Use $\\Delta G^\\circ = -nFE^\\circ_{\\text{cell}}$. Find $n$ from the half-reactions, and remember that 1 V = 1 J/C. The answer should be negative.',
            steps: [
              `Electrons moved: $n = ${ov.L}$ mol.`,
              `$\\Delta G^\\circ = -nFE^\\circ_{\\text{cell}} = -(${ov.L})(96{,}485)(${E.toFixed(2)})\\text{ J} = ${sciTex(J)}\\text{ J}$.`,
              `Divide by 1000: $\\Delta G^\\circ = ${Lab.sig(kJ, 3)}$ kJ. Negative, so it is spontaneous.`,
            ],
          };
        },
      },
      {
        id: 'plate-mass',
        title: 'Mass plated',
        make(r) {
          const m = r.pick(['Cu', 'Ag', 'Ni', 'Zn', 'Al', 'Pb']);
          const I = r.num(0.5, 8, 1), min = r.int(5, 120);
          const s = min * 60, Q = I * s, ne = Q / F, nm = ne / POT[m].n, M = EL[m].mass, g = nm * M;
          return {
            q: `A current of ${I.toFixed(1)} A runs for ${min} minutes through a cell that reduces $\\ce{${ion(m)}}$ to ${POT[m].name} metal. What mass of ${POT[m].name} forms?`,
            answer: g, unit: 'g', tol: 0.03,
            hint: `Seconds, then coulombs, then moles of electrons, then moles of metal (${POT[m].n} electron${POT[m].n > 1 ? 's' : ''} per atom), then grams.`,
            steps: [
              `Time in seconds: $${min} \\times 60 = ${s}\\text{ s}$.`,
              `Charge: $Q = It = (${I.toFixed(1)}\\text{ A})(${s}\\text{ s}) = ${Math.round(Q)}\\text{ C}$.`,
              `Electrons: $${Math.round(Q)}\\text{ C} \\div 96{,}485\\text{ C/mol} = ${sciTex(ne)}\\text{ mol } e^-$.`,
              `Metal: each $\\ce{${ion(m)}}$ takes ${POT[m].n} electron${POT[m].n > 1 ? 's' : ''}, so $${sciTex(ne)} \\div ${POT[m].n} = ${sciTex(nm)}\\text{ mol}$.`,
              `Mass: $${sciTex(nm)}\\text{ mol} \\times ${M.toFixed(2)}\\text{ g/mol} = ${Lab.sig(g, 3)}\\text{ g}$.`,
            ],
          };
        },
      },
      {
        id: 'plate-time',
        title: 'Time to plate',
        make(r) {
          const m = r.pick(['Cu', 'Ag', 'Ni', 'Zn']);
          const g = r.num(0.5, 15, 2), I = r.num(1, 10, 1);
          const M = EL[m].mass, nm = g / M, ne = nm * POT[m].n, Q = ne * F, s = Q / I, min = s / 60;
          return {
            q: `How many minutes does it take to plate ${g.toFixed(2)} g of ${POT[m].name} from $\\ce{${ion(m)}}$ with a current of ${I.toFixed(1)} A?`,
            answer: min, unit: 'min', tol: 0.03,
            hint: 'Run the chain backward: grams to moles of metal, then moles of electrons, then coulombs, then seconds.',
            steps: [
              `Moles of metal: $${g.toFixed(2)}\\text{ g} \\div ${M.toFixed(2)}\\text{ g/mol} = ${sciTex(nm)}\\text{ mol}$.`,
              `Electrons: $${sciTex(nm)} \\times ${POT[m].n} = ${sciTex(ne)}\\text{ mol } e^-$.`,
              `Charge: $${sciTex(ne)}\\text{ mol} \\times 96{,}485\\text{ C/mol} = ${sciTex(Q)}\\text{ C}$.`,
              `Time: $t = Q/I = ${sciTex(Q)}\\text{ C} \\div ${I.toFixed(1)}\\text{ A} = ${sciTex(s)}\\text{ s}$.`,
              `Minutes: $${sciTex(s)}\\text{ s} \\div 60 = ${Lab.sig(min, 3)}\\text{ min}$.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'Where does oxidation happen?', back: 'At the anode, in every kind of cell. An Ox, Red Cat.' },
      { front: 'Which way do electrons flow in the wire?', back: 'From the anode to the cathode.' },
      { front: 'What does a salt bridge do?', back: 'It lets ions flow to keep each side neutral: anions toward the anode, cations toward the cathode.' },
      { front: 'What is the formula for cell potential?', back: '$E^\\circ_{\\text{cell}} = E^\\circ_{\\text{cathode}} - E^\\circ_{\\text{anode}}$, using reduction potentials from the table.' },
      { front: 'Do you multiply $E^\\circ$ when you multiply a half-reaction?', back: 'No. Voltage is push per electron, so it does not depend on how many electrons move.' },
      { front: 'How do $E^\\circ_{\\text{cell}}$ and $\\Delta G^\\circ$ connect?', back: '$\\Delta G^\\circ = -nFE^\\circ_{\\text{cell}}$. Positive voltage gives negative $\\Delta G^\\circ$: spontaneous.' },
      { front: 'What is the sign of the anode in electrolysis?', back: 'Positive. In a battery the anode is negative, but it still does oxidation either way.' },
      { front: "What is Faraday's constant?", back: '96,485 C per mole of electrons.' },
    ],

    terms: [
      { term: 'Galvanic cell', def: 'A cell that turns a spontaneous redox reaction into electric current. Also called a voltaic cell.' },
      { term: 'Electrolytic cell', def: 'A cell in which a power supply forces a nonspontaneous redox reaction to happen.' },
      { term: 'Electrode', def: 'The solid conductor where a half-reaction happens, such as a strip of zinc.' },
      { term: 'Anode', def: 'The electrode where oxidation happens. Negative in a battery, positive in electrolysis.' },
      { term: 'Cathode', def: 'The electrode where reduction happens. Positive in a battery, negative in electrolysis.' },
      { term: 'Salt bridge', def: 'A tube of ions that joins the two halves of a cell, so charge does not pile up.' },
      { term: 'Standard reduction potential', def: 'How strongly an ion or molecule pulls in electrons, in volts, compared with $\\ce{H+}$ at 0 V, at 1 M, 1 atm and 25 °C.' },
      { term: 'Cell potential', def: 'The electrical push of a cell, in volts. $E^\\circ_{\\text{cell}} = E^\\circ_{\\text{cathode}} - E^\\circ_{\\text{anode}}$.' },
      { term: "Faraday's constant", def: 'The charge on one mole of electrons: 96,485 C/mol.' },
      { term: 'Electrolysis', def: 'Using electric current to drive a chemical reaction that would not go on its own.' },
      { term: 'Cell notation', def: 'A shorthand for a cell with the anode on the left and cathode on the right, such as $\\ce{Zn}$ | $\\ce{Zn^2+}$ || $\\ce{Cu^2+}$ | $\\ce{Cu}$.' },
    ],
  });
})();
