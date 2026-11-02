/* Question bank for 9.3 Kinetic theory and real gases. */
(function () {
  const R = 8.314, RA = 0.08206;
  const r3 = (x) => Lab.sig(x, 3).replace(/\u00A0×\u00A010([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (m, e) => ` \\times 10^{${e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '-0123456789'['⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)])}}`);
  const GASES = [['hydrogen', 'H2'], ['helium', 'He'], ['neon', 'Ne'], ['nitrogen', 'N2'], ['oxygen', 'O2'], ['argon', 'Ar'], ['carbon dioxide', 'CO2'], ['methane', 'CH4'], ['chlorine', 'Cl2']];
  const VDW = { He: [0.0341, 0.0237], H2: [0.244, 0.0266], N2: [1.39, 0.0391], O2: [1.36, 0.0318], CO2: [3.59, 0.0427], CH4: [2.25, 0.0428], NH3: [4.17, 0.0371] };
  Bank.add('kmt', {
    quiz: [
      {
        q: 'Which is <b>not</b> a postulate of kinetic molecular theory?',
        options: ['Gas particles are in constant random motion', 'Collisions between gas particles are elastic', 'Gas particles attract each other strongly', 'Average kinetic energy is proportional to Kelvin temperature'],
        answer: 2,
        why: 'KMT assumes no attractions or repulsions between particles, except during collisions.',
      },
      {
        q: 'A sample holds $\\ce{He}$ and $\\ce{Xe}$ at the same temperature. Which statement is true?',
        options: ['They have the same average speed', 'They have the same average kinetic energy', '$\\ce{Xe}$ has more average kinetic energy', '$\\ce{He}$ has more average kinetic energy'],
        answer: 1,
        why: 'Average kinetic energy depends only on temperature. Same KE with a smaller mass means helium moves faster.',
      },
      {
        q: 'If the Kelvin temperature of a gas is quadrupled, the rms speed:',
        options: ['Stays the same', 'Doubles', 'Quadruples', 'Increases 16 times'],
        answer: 1,
        why: '$u_\\text{rms} = \\sqrt{3RT/M}$. The square root of 4 is 2, so the speed doubles. The average kinetic energy is what quadruples.',
      },
      {
        q: 'As a gas gets hotter, what happens to its Maxwell-Boltzmann speed curve?',
        options: ['The peak moves right and gets lower and wider', 'The peak moves left and gets taller', 'The peak moves right and gets taller', 'The curve does not change'],
        answer: 0,
        why: 'Higher temperature means higher typical speeds, and a wider range of speeds. The area stays fixed, since the total number of particles has not changed, so the peak must drop.',
      },
      {
        q: 'Which gas effuses fastest at the same temperature?',
        options: ['$\\ce{CH4}$', '$\\ce{N2}$', '$\\ce{O2}$', '$\\ce{CO2}$'],
        answer: 0,
        why: 'Rate goes as $1/\\sqrt{M}$, so the lightest gas wins. $\\ce{CH4}$ is 16.04 g/mol.',
      },
      {
        q: 'A real gas behaves most like an ideal gas at:',
        options: ['High pressure and high temperature', 'High pressure and low temperature', 'Low pressure and high temperature', 'Low pressure and low temperature'],
        answer: 2,
        why: 'Low pressure means molecular size hardly matters. High temperature means attractions hardly matter.',
      },
      {
        q: 'In the van der Waals equation, what does the constant $b$ correct for?',
        options: ['Attractions between molecules', 'The volume taken up by the molecules', 'Collisions with the wall', 'Molar mass'],
        answer: 1,
        why: 'The term $V - nb$ subtracts the space the molecules themselves take up. The constant $a$ corrects for attractions.',
      },
      {
        q: 'At moderate pressure, a real gas often has a pressure below the ideal value. Why?',
        options: ['Molecules take up space', 'Attractions tug molecules back as they near the wall', 'Molecules stop moving', 'Collisions lose energy'],
        answer: 1,
        why: 'Attractions soften each hit on the wall. Molecular size would push pressure the other way, and it only wins at very high pressure.',
      },
      {
        q: 'Perfume molecules fly at hundreds of meters per second. Why does the smell take minutes to cross a room?',
        options: ['They slow down in air', 'They constantly collide with air molecules, so their path is a zigzag', 'Perfume molecules are too heavy to move far', 'Smell takes time to register in the nose'],
        answer: 1,
        why: 'Between collisions a molecule goes only about 70 nm. Billions of direction changes every second mean slow overall progress.',
      },
    ],

    gens: [
      {
        id: 'rms',
        title: 'rms speed',
        make(r) {
          const [name, f] = r.pick(GASES);
          const gM = Bank.molarMass(f), M = gM / 1000, c = r.int(-50, 400), T = c + 273.15, u = Math.sqrt((3 * R * T) / M);
          return {
            q: `Find the rms speed of ${name} ($\\ce{${f}}$) molecules at ${c} °C, in m/s.`,
            answer: u, unit: 'm/s',
            hint: 'Use $u_\\text{rms} = \\sqrt{3RT/M}$ with $R = 8.314$, $T$ in Kelvin, and $M$ in kg/mol.',
            steps: [
              `Convert: $T = ${c} + 273.15 = ${T.toFixed(2)}$ K and $M = ${gM.toFixed(2)}\\text{ g/mol} = ${M.toFixed(5)}\\text{ kg/mol}$.`,
              `Plug in: $u_\\text{rms} = \\sqrt{\\dfrac{3(8.314)(${T.toFixed(2)})}{${M.toFixed(5)}}}$.`,
              `Inside the root, $${r3((3 * R * T) / M)}$ m²/s². The square root gives $${r3(u)}$ m/s.`,
            ],
          };
        },
      },
      {
        id: 'rms-ratio',
        title: 'How speed scales with temperature',
        make(r) {
          const T1 = r.int(10, 60) * 5, k = r.pick([4, 9, 16, 2, 3, 0.25]), T2 = T1 * k, f = Math.sqrt(k);
          return {
            q: `A gas at ${T1} K is changed to ${T2} K. By what factor does its rms speed change?`,
            answer: f, tol: 0.01, unit: 'times',
            hint: 'Speed goes as the square root of Kelvin temperature.',
            steps: [
              'From $u_\\text{rms} = \\sqrt{3RT/M}$, the ratio is $\\dfrac{u_2}{u_1} = \\sqrt{\\dfrac{T_2}{T_1}}$.',
              `Plug in: $\\sqrt{\\dfrac{${T2}}{${T1}}} = \\sqrt{${k}} = ${r3(f)}$.`,
            ],
          };
        },
      },
      {
        id: 'ke',
        title: 'Average kinetic energy',
        make(r) {
          const c = r.int(-100, 600), T = c + 273.15, ke = 1.5 * R * T;
          return {
            q: `What is the average kinetic energy of one mole of gas at ${c} °C, in kJ/mol?`,
            answer: ke / 1000, unit: 'kJ/mol',
            hint: '$\\text{KE}_\\text{avg} = \\frac{3}{2}RT$, with $R = 8.314$ J/(mol K).',
            steps: [
              `Convert: $T = ${T.toFixed(2)}$ K.`,
              `Plug in: $\\text{KE}_\\text{avg} = \\frac{3}{2}(8.314)(${T.toFixed(2)}) = ${r3(ke)}$ J/mol.`,
              `Divide by 1000: $${r3(ke / 1000)}$ kJ/mol. This does not depend on which gas it is.`,
            ],
          };
        },
      },
      {
        id: 'graham-ratio',
        title: "Graham's law: compare rates",
        make(r) {
          const a = r.pick(GASES);
          const others = GASES.filter((x) => Bank.molarMass(x[1]) > Bank.molarMass(a[1]) + 1);
          const b = others.length ? r.pick(others) : ['chlorine', 'Cl2'];
          const f1 = a[1] === 'Cl2' ? 'H2' : a[1], f2 = b[1];
          const M1 = Bank.molarMass(f1), M2 = Bank.molarMass(f2), ans = Math.sqrt(M2 / M1);
          return {
            q: `How many times faster does $\\ce{${f1}}$ effuse than $\\ce{${f2}}$ at the same temperature?`,
            answer: ans, unit: 'times', tol: 0.015,
            hint: '$\\text{rate}_1/\\text{rate}_2 = \\sqrt{M_2/M_1}$. The other gas goes on top.',
            steps: [
              `Molar masses: $\\ce{${f1}}$ is ${M1.toFixed(2)} g/mol and $\\ce{${f2}}$ is ${M2.toFixed(2)} g/mol.`,
              `Graham's law: $\\sqrt{\\dfrac{${M2.toFixed(2)}}{${M1.toFixed(2)}}} = \\sqrt{${(M2 / M1).toFixed(2)}} = ${r3(ans)}$.`,
            ],
          };
        },
      },
      {
        id: 'graham-mass',
        title: "Graham's law: find a molar mass",
        make(r) {
          const [ref, Mr] = r.pick([['He', 4.003], ['Ne', 20.18], ['O2', 32.0], ['N2', 28.02], ['Ar', 39.95]]);
          const k = r.pick([0.25, 0.5, 0.7, 0.8, 1.25, 1.5, 2].filter((x) => Mr / (x * x) > 2.016)); // No gas is lighter than H2.
          const Mx = Mr / (k * k);
          return {
            q: `An unknown gas effuses at ${k} times the rate of $\\ce{${ref}}$, under the same conditions. What is the molar mass of the unknown gas?`,
            answer: Mx, unit: 'g/mol', tol: 0.015,
            hint: 'Write $\\dfrac{\\text{rate}_x}{\\text{rate}_\\text{ref}} = \\sqrt{\\dfrac{M_\\text{ref}}{M_x}}$, then square both sides.',
            steps: [
              `Graham's law: $${k} = \\sqrt{\\dfrac{${Mr}}{M_x}}$.`,
              `Square both sides: $${(k * k).toFixed(4)} = \\dfrac{${Mr}}{M_x}$.`,
              `Solve: $M_x = \\dfrac{${Mr}}{${(k * k).toFixed(4)}} = ${r3(Mx)}$ g/mol.`,
            ],
          };
        },
      },
      {
        id: 'graham-time',
        title: 'Effusion times',
        make(r) {
          const [a, Ma] = r.pick([['N2', 28.02], ['O2', 32.0], ['CH4', 16.04], ['He', 4.003]]);
          const [b, Mb] = r.pick([['CO2', 44.01], ['Cl2', 70.9], ['SO2', 64.07], ['Ar', 39.95]]);
          const ta = r.int(20, 180), tb = ta * Math.sqrt(Mb / Ma);
          return {
            q: `A fixed amount of $\\ce{${a}}$ takes ${ta} s to effuse through a hole. How long does the same amount of $\\ce{${b}}$ take, under the same conditions?`,
            answer: tb, unit: 's',
            hint: 'Time is the inverse of rate, so a heavier gas takes longer: $\\dfrac{t_2}{t_1} = \\sqrt{\\dfrac{M_2}{M_1}}$.',
            steps: [
              `A heavier gas is slower, so time scales up: $t_{\\ce{${b}}} = t_{\\ce{${a}}} \\times \\sqrt{\\dfrac{M_{\\ce{${b}}}}{M_{\\ce{${a}}}}}$.`,
              `Plug in: $${ta}\\text{ s} \\times \\sqrt{\\dfrac{${Mb}}{${Ma}}} = ${r3(tb)}\\text{ s}$.`,
            ],
          };
        },
      },
      {
        id: 'vdw',
        title: 'Van der Waals pressure',
        make(r) {
          const f = r.pick(Object.keys(VDW)), [a, b] = VDW[f];
          const n = r.pick([1, 1.5, 2, 0.5]), V = r.num(1, 6, 1), T = r.int(30, 80) * 10;
          const first = (n * RA * T) / (V - n * b), second = (a * n * n) / (V * V), P = first - second, Pi = (n * RA * T) / V;
          return {
            q: `Use the van der Waals equation to find the pressure of ${n} mol of $\\ce{${f}}$ in ${V} L at ${T} K. For this gas, $a = ${a}$ L² atm/mol² and $b = ${b}$ L/mol.`,
            answer: P, unit: 'atm', tol: 0.01,
            hint: 'Solve for $P$: $P = \\dfrac{nRT}{V - nb} - a\\dfrac{n^2}{V^2}$.',
            steps: [
              'Solve for $P$: $P = \\dfrac{nRT}{V - nb} - a\\dfrac{n^2}{V^2}$.',
              `Size term: $\\dfrac{(${n})(0.08206)(${T})}{${V} - (${n})(${b})} = ${first.toFixed(3)}$ atm.`,
              `Attraction term: $${a} \\times \\dfrac{(${n})^2}{(${V})^2} = ${second.toFixed(3)}$ atm.`,
              `Subtract: $P = ${first.toFixed(3)} - ${second.toFixed(3)} = ${r3(P)}$ atm. The ideal gas law would give ${r3(Pi)} atm.`,
            ],
          };
        },
      },
      {
        id: 'concepts',
        title: 'Exam style: real gases and speeds',
        make(r) {
          const items = [
            ['Which gas behaves most ideally at the same temperature and pressure?', '$\\ce{He}$', ['$\\ce{NH3}$', '$\\ce{CO2}$', '$\\ce{H2O}$'], 'Helium is tiny and nonpolar, with the weakest attractions.'],
            ['Which gas strays furthest from ideal behavior at the same temperature and pressure?', '$\\ce{NH3}$', ['$\\ce{He}$', '$\\ce{H2}$', '$\\ce{Ne}$'], 'Ammonia is polar and hydrogen bonds, so it has strong attractions and a large $a$.'],
            ['Which gas has the highest rms speed at 300 K?', '$\\ce{H2}$', ['$\\ce{He}$', '$\\ce{N2}$', '$\\ce{CO2}$'], 'At one temperature, the lightest molecule is the fastest.'],
            ['For an ideal gas, the compressibility factor $Z = PV/nRT$ equals:', 'Exactly 1', ['Exactly 0', 'More than 1', 'Less than 1'], 'An ideal gas obeys $PV = nRT$ exactly, so the ratio is exactly 1.'],
            ['A real gas at very high pressure usually has $Z$:', 'Greater than 1', ['Exactly 1', 'Less than 1', 'Equal to 0'], 'When molecules are crammed together, their size dominates and pressure runs above ideal.'],
            ['Which change makes a real gas behave more ideally?', 'Raising the temperature', ['Raising the pressure', 'Cooling the gas', 'Shrinking the container'], 'Faster molecules barely notice attractions, and a gas that is hot at fixed pressure spreads out.'],
            ['Two gases are at the same temperature. Compared with $\\ce{O2}$, molecules of $\\ce{CO2}$ have:', 'The same average KE and a lower average speed', ['More average KE and a lower speed', 'Less average KE and a higher speed', 'The same average KE and a higher speed'], 'Average KE depends only on temperature. $\\ce{CO2}$ is heavier, so it moves more slowly.'],
            ['Which is an example of effusion?', 'A helium balloon slowly going flat through tiny pores', ['Perfume spreading through a room', 'Food coloring spreading in water', 'Steam rising from a kettle'], 'Effusion means escaping through a tiny hole. Perfume spreading through air is diffusion.'],
          ];
          const [q, right, wrong, why] = r.pick(items);
          const mc = r.mc(right, wrong);
          return { q, choices: mc.choices, answer: mc.answer, steps: [why] };
        },
      },
    ],

    cards: [
      { front: 'What are the five postulates of kinetic molecular theory?', back: 'Particles are tiny compared with the space between them. They move in straight lines at random. No forces act between them, except in collisions. Collisions are elastic. Average KE is proportional to Kelvin temperature.' },
      { front: 'What does temperature measure in a gas?', back: 'The average kinetic energy of the particles: $\\text{KE}_\\text{avg} = \\frac{3}{2}RT$ per mole.' },
      { front: 'What is the rms speed formula, and what units go in?', back: '$u_\\text{rms} = \\sqrt{3RT/M}$, with $R = 8.314$ J/(mol K), $T$ in K, and $M$ in kg/mol.' },
      { front: 'State Graham\'s law.', back: '$\\text{rate}_1/\\text{rate}_2 = \\sqrt{M_2/M_1}$. Lighter gases effuse faster.' },
      { front: 'What is the difference between effusion and diffusion?', back: 'Effusion is escape through a tiny hole into a vacuum. Diffusion is one gas spreading through another.' },
      { front: 'When is a real gas closest to ideal?', back: 'At low pressure and high temperature.' },
      { front: 'What do $a$ and $b$ mean in the van der Waals equation?', back: '$a$ corrects for attractions between molecules. $b$ corrects for the volume of the molecules.' },
      { front: 'What is the compressibility factor?', back: '$Z = PV/nRT$. It is 1 for an ideal gas. Below 1, attractions dominate. Above 1, molecular size dominates.' },
    ],

    terms: [
      { term: 'Kinetic molecular theory', def: 'A model of gases as tiny particles in constant random motion, with elastic collisions and no forces between them.' },
      { term: 'Elastic collision', def: 'A collision in which the total kinetic energy stays the same.' },
      { term: 'Maxwell-Boltzmann distribution', def: 'The curve showing how many gas particles have each speed at a given temperature.' },
      { term: 'Root mean square speed', def: 'The square root of the average of the squared speeds: $u_\\text{rms} = \\sqrt{3RT/M}$.' },
      { term: 'Effusion', def: 'A gas escaping through a tiny hole into a vacuum.' },
      { term: 'Diffusion', def: 'One substance spreading through another because of random particle motion.' },
      { term: "Graham's law", def: 'The rate of effusion of a gas is inversely proportional to the square root of its molar mass.' },
      { term: 'Real gas', def: 'A gas whose molecules have volume and attract each other, so it strays from $PV = nRT$, especially at high pressure and low temperature.' },
      { term: 'Van der Waals equation', def: 'A corrected gas law: $(P + an^2/V^2)(V - nb) = nRT$.' },
      { term: 'Compressibility factor', def: '$Z = PV/nRT$, which measures how far a gas strays from ideal behavior.' },
    ],
  });
})();
