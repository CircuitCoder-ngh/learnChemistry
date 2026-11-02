/* Question bank for 9.1 Pressure and the gas laws. */
(function () {
  const r3 = (x) => Lab.sig(x, 3);
  Bank.add('gas-laws', {
    quiz: [
      {
        q: 'What causes the pressure of a gas on the walls of its container?',
        options: ['The weight of the gas pressing on the floor', 'Particles repelling the walls from a distance', 'Particles colliding with the walls', 'Particles sticking to the walls'],
        answer: 2,
        why: 'Gas particles fly around and hit the walls. Pressure is the total force from those collisions divided by the area of the wall.',
      },
      {
        q: 'In a mercury barometer, what holds the column of mercury up?',
        options: ['Suction from the empty space at the top of the tube', 'The push of the atmosphere on the mercury in the dish', 'The attraction of mercury for the glass', 'Vapor pressure of the mercury'],
        answer: 1,
        why: 'The space above the column is almost empty, so it cannot pull. The air pushes down on the dish and that pushes the mercury up the tube. "Suction" is not a real force here.',
      },
      {
        q: 'A sealed syringe of gas is squeezed to one third of its volume at constant temperature. The pressure:',
        options: ['Drops to one third', 'Stays the same', 'Triples', 'Increases 9 times'],
        answer: 2,
        why: "Boyle's law: $P_1V_1 = P_2V_2$. Volume times one third means pressure times three.",
      },
      {
        q: 'A gas at constant pressure is warmed from 20 °C to 40 °C. Its volume:',
        options: ['Doubles', 'Increases by about 7%', 'Increases by 20%', 'Stays the same'],
        answer: 1,
        why: 'Use Kelvin: $293$ K to $313$ K is a factor of $313/293 = 1.07$. Doubling the Celsius number means very little, since 0 °C is not true zero.',
      },
      {
        q: 'Which graph gives a straight line through the origin for a fixed amount of gas at constant pressure?',
        options: ['$V$ against $T$ in Celsius', '$V$ against $T$ in Kelvin', '$V$ against $P$', '$V$ against $1/T$ in Kelvin'],
        answer: 1,
        why: "Charles's law says $V$ is directly proportional to Kelvin temperature. The Celsius graph is also straight, but it crosses zero volume at $-273$ °C rather than at the origin.",
      },
      {
        q: 'At constant temperature and pressure, 1.0 mol of gas occupies 10 L. What does 3.0 mol occupy?',
        options: ['3.3 L', '10 L', '13 L', '30 L'],
        answer: 3,
        why: "Avogadro's law: $V$ is proportional to $n$, so three times the moles means three times the volume.",
      },
      {
        q: 'Heating a rigid sealed can raises the pressure inside because:',
        options: ['The particles get bigger', 'The particles move faster, so they hit the walls harder and more often', 'More particles are made', 'The can shrinks'],
        answer: 1,
        why: 'The number of particles and the volume are fixed. Higher temperature means faster particles, which give harder and more frequent hits. Particle size does not change.',
      },
      {
        q: 'Which is the highest pressure?',
        options: ['1.1 atm', '800 mmHg', '100 kPa', '700 torr'],
        answer: 0,
        why: 'Convert them all to atm: 1.1 atm, $800/760 = 1.05$ atm, $100/101.325 = 0.987$ atm, $700/760 = 0.921$ atm.',
      },
      {
        q: 'Why does a mercury barometer use mercury and not water?',
        options: ['Water would freeze inside the tube', 'Mercury is much denser, so the column is short enough to use', 'Water does not feel air pressure', 'Mercury is attracted to air'],
        answer: 1,
        why: 'Mercury is about 13.6 times denser than water. The same push holds up 0.76 m of mercury but about 10.3 m of water.',
      },
    ],

    gens: [
      {
        id: 'units',
        title: 'Convert pressure units',
        make(r) {
          const units = [
            { name: 'atm', per: 1 },
            { name: 'mmHg', per: 760 },
            { name: 'torr', per: 760 },
            { name: 'kPa', per: 101.325 },
          ];
          const a = r.pick(units);
          const b = r.pick(units.filter((u) => u.name !== a.name && u.per !== a.per));
          const atm = r.num(0.4, 3.5, 3);
          const given = a.name === 'atm' ? +atm.toFixed(2) : a.per === 760 ? Math.round(atm * 760) : +(atm * 101.325).toFixed(1);
          const inAtm = given / a.per, ans = inAtm * b.per;
          const fmtFactor = (u) => (u.per === 1 ? '1\\text{ atm}' : `${u.per}\\text{ ${u.name}}`);
          return {
            q: `Convert ${given} ${a.name} to ${b.name}.`,
            answer: ans, unit: b.name, tol: 0.01,
            hint: 'Use 1 atm = 760 mmHg = 760 torr = 101.325 kPa. Write the fraction so the old unit cancels.',
            steps: [
              `Start from the equality: $${fmtFactor(a)} = ${fmtFactor(b)}$.`,
              `Multiply so ${a.name} cancels: $${given}\\text{ ${a.name}} \\times \\dfrac{${fmtFactor(b)}}{${fmtFactor(a)}} = ${r3(ans).replace(/ × 10.*/, '')}\\text{ ${b.name}}$.`,
            ],
          };
        },
      },
      {
        id: 'boyle',
        title: "Boyle's law",
        make(r) {
          const P1 = r.num(0.6, 3, 2), V1 = r.num(1.5, 12, 1);
          const f = r.pick([0.4, 0.5, 0.6, 0.75, 1.5, 2, 2.5]);
          const P2 = +(P1 * f).toFixed(2);
          const V2 = (P1 * V1) / P2;
          return {
            q: `A gas occupies ${V1} L at ${P1} atm. At the same temperature, what volume does it occupy at ${P2} atm?`,
            answer: V2, unit: 'L',
            hint: '$T$ and $n$ are steady, so $P_1V_1 = P_2V_2$. Check: higher pressure means smaller volume.',
            steps: [
              "Temperature and moles are steady: Boyle's law, $P_1V_1 = P_2V_2$.",
              'Solve for $V_2$: $V_2 = \\dfrac{P_1V_1}{P_2}$.',
              `Put in the numbers: $V_2 = \\dfrac{(${P1}\\text{ atm})(${V1}\\text{ L})}{${P2}\\text{ atm}} = ${r3(V2)}\\text{ L}$.`,
            ],
          };
        },
      },
      {
        id: 'boyle-mixed',
        title: "Boyle's law, mixed units",
        make(r) {
          const mm = r.int(30, 150) * 5, V1 = r.num(2, 10, 1);
          const P2 = r.num(0.5, 2.5, 2);
          const P1 = mm / 760, V2 = (P1 * V1) / P2;
          return {
            q: `A gas fills ${V1} L at ${mm} mmHg. What volume does it fill at ${P2} atm, with the temperature unchanged?`,
            answer: V2, unit: 'L',
            hint: 'Both pressures must use the same unit before you use $P_1V_1 = P_2V_2$.',
            steps: [
              `Make the units match: $${mm}\\text{ mmHg} \\times \\dfrac{1\\text{ atm}}{760\\text{ mmHg}} = ${P1.toFixed(3)}\\text{ atm}$.`,
              'Solve Boyle\'s law for $V_2$: $V_2 = \\dfrac{P_1V_1}{P_2}$.',
              `Put in the numbers: $V_2 = \\dfrac{(${P1.toFixed(3)}\\text{ atm})(${V1}\\text{ L})}{${P2}\\text{ atm}} = ${r3(V2)}\\text{ L}$.`,
            ],
          };
        },
      },
      {
        id: 'charles',
        title: "Charles's law, with Celsius",
        make(r) {
          const c1 = r.int(5, 40), c2 = c1 + r.int(15, 130), V1 = r.num(0.8, 6, 2);
          const T1 = c1 + 273.15, T2 = c2 + 273.15, V2 = (V1 * T2) / T1;
          return {
            q: `A balloon holds ${V1} L at ${c1} °C. It is heated at constant pressure to ${c2} °C. What is the new volume?`,
            answer: V2, unit: 'L', tol: 0.01,
            hint: 'Convert to Kelvin first. Then $V_2 = V_1 \\times T_2 / T_1$.',
            steps: [
              `Convert to Kelvin: $T_1 = ${c1} + 273.15 = ${T1.toFixed(2)}$ K and $T_2 = ${c2} + 273.15 = ${T2.toFixed(2)}$ K.`,
              "Solve Charles's law: $\\dfrac{V_1}{T_1} = \\dfrac{V_2}{T_2}$ gives $V_2 = V_1 \\times \\dfrac{T_2}{T_1}$.",
              `Put in the numbers: $V_2 = ${V1}\\text{ L} \\times \\dfrac{${T2.toFixed(2)}\\text{ K}}{${T1.toFixed(2)}\\text{ K}} = ${r3(V2)}\\text{ L}$.`,
              `The Celsius mistake would give ${r3((V1 * c2) / c1)} L, which is wrong.`,
            ],
          };
        },
      },
      {
        id: 'charles-t',
        title: "Charles's law: find the temperature",
        make(r) {
          const c1 = r.int(5, 40), V1 = r.num(1, 5, 2), k = r.pick([1.25, 1.5, 2, 0.5, 0.8]);
          const V2 = +(V1 * k).toFixed(2);
          const T1 = c1 + 273.15, T2 = (T1 * V2) / V1, c2 = T2 - 273.15;
          return {
            q: `A gas occupies ${V1} L at ${c1} °C. To what temperature, in °C, must it change to occupy ${V2} L at the same pressure?`,
            answer: c2, unit: '°C', tol: 0.02, answerText: c2.toFixed(0),
            hint: 'Find $T_2$ in Kelvin, then subtract 273.15 at the very end.',
            steps: [
              `Convert the start: $T_1 = ${c1} + 273.15 = ${T1.toFixed(2)}$ K.`,
              "Solve Charles's law for $T_2$: $T_2 = T_1 \\times \\dfrac{V_2}{V_1}$.",
              `Put in the numbers: $T_2 = ${T1.toFixed(2)}\\text{ K} \\times \\dfrac{${V2}\\text{ L}}{${V1}\\text{ L}} = ${T2.toFixed(1)}\\text{ K}$.`,
              `Convert back: $${T2.toFixed(1)} - 273.15 = ${c2.toFixed(0)}$ °C.`,
            ],
          };
        },
      },
      {
        id: 'gay',
        title: "Gay-Lussac's law",
        make(r) {
          const c1 = r.int(10, 35), c2 = c1 + r.int(20, 300), P1 = r.num(0.9, 3.5, 2);
          const T1 = c1 + 273.15, T2 = c2 + 273.15, P2 = (P1 * T2) / T1;
          return {
            q: `A sealed rigid can holds gas at ${P1} atm and ${c1} °C. What is the pressure at ${c2} °C?`,
            answer: P2, unit: 'atm', tol: 0.01,
            hint: 'Rigid means constant volume. Use Kelvin: $P_2 = P_1 \\times T_2 / T_1$.',
            steps: [
              `Convert to Kelvin: $T_1 = ${T1.toFixed(2)}$ K and $T_2 = ${T2.toFixed(2)}$ K.`,
              "Solve Gay-Lussac's law: $\\dfrac{P_1}{T_1} = \\dfrac{P_2}{T_2}$ gives $P_2 = P_1 \\times \\dfrac{T_2}{T_1}$.",
              `Put in the numbers: $P_2 = ${P1}\\text{ atm} \\times \\dfrac{${T2.toFixed(2)}\\text{ K}}{${T1.toFixed(2)}\\text{ K}} = ${r3(P2)}\\text{ atm}$.`,
            ],
          };
        },
      },
      {
        id: 'avo',
        title: "Avogadro's law",
        make(r) {
          const n1 = r.num(0.2, 1.5, 2), V1 = r.num(3, 30, 1), n2 = +(n1 * r.pick([0.5, 1.5, 2, 2.5, 3])).toFixed(2);
          const V2 = (V1 * n2) / n1;
          return {
            q: `At constant temperature and pressure, ${n1} mol of gas fills ${V1} L. What volume does ${n2} mol fill?`,
            answer: V2, unit: 'L',
            hint: '$\\dfrac{V_1}{n_1} = \\dfrac{V_2}{n_2}$. More moles, more volume.',
            steps: [
              "Solve Avogadro's law for $V_2$: $V_2 = V_1 \\times \\dfrac{n_2}{n_1}$.",
              `Put in the numbers: $V_2 = ${V1}\\text{ L} \\times \\dfrac{${n2}\\text{ mol}}{${n1}\\text{ mol}} = ${r3(V2)}\\text{ L}$.`,
            ],
          };
        },
      },
      {
        id: 'which-law',
        title: 'Exam style: which law is it?',
        make(r) {
          const cases = [
            ['A diver lets a bubble rise from deep water, where the temperature is the same at every depth. The bubble grows.', "Boyle's law", 'Pressure falls and volume rises, with temperature and moles steady.'],
            ['You squeeze a sealed syringe with your thumb and the air inside resists more and more.', "Boyle's law", 'Volume falls and pressure rises, with temperature and moles steady.'],
            ['A balloon taken outside on a cold day shrinks.', "Charles's law", 'Temperature falls and volume falls, at the steady pressure of the air outside.'],
            ['A loaf of bread rises as gas bubbles expand in a hot oven.', "Charles's law", 'Temperature rises and volume rises, at steady atmospheric pressure.'],
            ['A sealed spray can in a hot car gets close to bursting.', "Gay-Lussac's law", 'Temperature rises and pressure rises, in a rigid container with fixed moles.'],
            ['A steel gas cylinder reads a higher pressure on a hot afternoon than on a cool morning.', "Gay-Lussac's law", 'Temperature rises and pressure rises, in a rigid container with fixed moles.'],
            ['You blow into a balloon and it gets bigger.', "Avogadro's law", 'Moles rise and volume rises, at nearly steady temperature and pressure.'],
            ['A slow leak lets air out of a soft pool toy and it shrinks.', "Avogadro's law", 'Moles fall and volume falls, at nearly steady temperature and pressure.'],
          ];
          const [text, law, why] = r.pick(cases);
          const mc = r.mc(law, ["Boyle's law", "Charles's law", "Gay-Lussac's law", "Avogadro's law"].filter((x) => x !== law));
          return { q: text + ' Which law does this show best?', choices: mc.choices, answer: mc.answer, steps: [why, `So this is ${law}.`] };
        },
      },
    ],

    cards: [
      { front: 'What is pressure?', back: 'Force per area, $P = F/A$. In a gas, the force comes from particles hitting the walls.' },
      { front: 'How many mmHg, torr and kPa are in 1 atm?', back: '760 mmHg, 760 torr, and 101.325 kPa.' },
      { front: "State Boyle's law.", back: 'At constant $T$ and $n$, $P_1V_1 = P_2V_2$. Pressure and volume are inversely proportional.' },
      { front: "State Charles's law.", back: 'At constant $P$ and $n$, $V_1/T_1 = V_2/T_2$ with $T$ in Kelvin. Volume is directly proportional to temperature.' },
      { front: "State Gay-Lussac's law.", back: 'At constant $V$ and $n$, $P_1/T_1 = P_2/T_2$ with $T$ in Kelvin.' },
      { front: "State Avogadro's law.", back: 'At constant $P$ and $T$, $V_1/n_1 = V_2/n_2$. Equal volumes of gases hold equal numbers of particles.' },
      { front: 'How do you convert Celsius to Kelvin?', back: 'Add 273.15. So 25 °C is about 298 K.' },
      { front: 'What is absolute zero?', back: '0 K, or $-273.15$ °C, the lowest temperature possible.' },
      { front: 'Why does doubling the Celsius temperature not double the volume?', back: 'Because 0 °C is not a true zero. Gas laws scale with Kelvin, which starts at absolute zero.' },
    ],

    terms: [
      { term: 'Pressure', def: 'Force per unit area. Gas pressure comes from particles hitting surfaces.' },
      { term: 'Pascal', def: 'The SI unit of pressure, 1 N/m². Symbol: Pa.' },
      { term: 'Atmosphere (unit)', def: 'A pressure unit equal to 101.325 kPa, close to normal air pressure at sea level. Symbol: atm.' },
      { term: 'Torr', def: 'A pressure unit. 760 torr equals 1 atm. It equals 1 mmHg for all practical purposes.' },
      { term: 'Millimeter of mercury', def: 'A pressure unit based on the height of a mercury column. Symbol: mmHg. 760 mmHg equals 1 atm.' },
      { term: 'Barometer', def: 'A device that measures air pressure, classically by the height of a column of mercury.' },
      { term: "Boyle's law", def: 'At constant temperature and amount, the pressure and volume of a gas are inversely proportional: $P_1V_1 = P_2V_2$.' },
      { term: "Charles's law", def: 'At constant pressure and amount, volume is directly proportional to Kelvin temperature: $V_1/T_1 = V_2/T_2$.' },
      { term: "Gay-Lussac's law", def: 'At constant volume and amount, pressure is directly proportional to Kelvin temperature: $P_1/T_1 = P_2/T_2$.' },
      { term: "Avogadro's law", def: 'At constant temperature and pressure, volume is directly proportional to moles: $V_1/n_1 = V_2/n_2$.' },
      { term: 'Absolute zero', def: 'The lowest possible temperature: 0 K, or $-273.15$ °C.' },
      { term: 'Kelvin', def: 'The temperature scale that starts at absolute zero. $T(\\text{K}) = T(^\\circ\\text{C}) + 273.15$.' },
    ],
  });
})();
