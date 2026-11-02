/* Question bank for 6.1 Energy and heat. */
(function () {
  const SUBS = [
    { name: 'water', c: 4.184 },
    { name: 'aluminum', c: 0.90 },
    { name: 'iron', c: 0.45 },
    { name: 'copper', c: 0.385 },
    { name: 'ethanol', c: 2.44 },
    { name: 'gold', c: 0.129 },
  ];
  const cTex = (c) => `${c}\\ \\tfrac{\\text{J}}{\\text{g}\\cdot{}^\\circ\\text{C}}`;
  const signed = (x, d) => (x > 0 ? '+' : x < 0 ? '-' : '') + Math.abs(x).toFixed(d);

  Bank.add('energy', {
    quiz: [
      {
        q: 'A nitrogen molecule zooms across a room. Which kind of energy does its motion give it?',
        options: ['Kinetic energy', 'Potential energy', 'Chemical energy', 'No energy at all, since it is so small'],
        answer: 0,
        why: 'Kinetic energy is energy of motion. Potential energy comes from position or attraction.',
      },
      {
        q: 'What happens to the energy when a chemical bond breaks?',
        options: ['Energy is released as the bond snaps', 'Energy must be put in to pull the atoms apart', 'Energy is destroyed', 'Nothing, since bonds hold no energy'],
        answer: 1,
        why: 'Breaking a bond always costs energy, like pulling magnets apart. Forming a bond releases energy.',
      },
      {
        q: 'A reaction in a beaker makes the beaker feel hot. The reacting chemicals are the system. What is true?',
        options: ['Exothermic, $q$ of the system is negative', 'Exothermic, $q$ of the system is positive', 'Endothermic, $q$ of the system is negative', 'Endothermic, $q$ of the system is positive'],
        answer: 0,
        why: 'Heat left the chemicals and warmed the beaker, so the system lost heat. Heat out is negative, and that is exothermic. The glass warms up, but the $q$ asked about is the chemicals.',
      },
      {
        q: 'An ice cube melts in your hand. If the ice is the system, what is the sign of $q$?',
        options: ['Negative, since your hand feels cold', 'Positive, since heat enters the ice', 'Zero, since the temperature stays at 0 °C', 'It depends on the size of the cube'],
        answer: 1,
        why: 'Heat flows from your warm hand into the ice. Heat into the system is positive, so melting is endothermic.',
      },
      {
        q: 'Why does an instant cold pack make your hand feel cold?',
        options: ['Cold flows out of the pack into your hand', 'Heat flows out of your hand into the pack', 'The pack destroys heat', 'The pack releases cold particles'],
        answer: 1,
        why: 'There is no such thing as cold flowing. The reaction in the pack is endothermic and pulls heat from your hand.',
      },
      {
        q: 'A system has $q = -120$ kJ. What is $q$ for the surroundings?',
        options: ['$-120$ kJ', '0 kJ', '$+120$ kJ', '$+240$ kJ'],
        answer: 2,
        why: 'Energy is conserved. What the system loses, the surroundings gain: $q_{\\text{surr}} = -q_{\\text{sys}} = +120$ kJ.',
      },
      {
        q: 'A 200 g cup of tea at 90 °C sits next to a 150 kg bathtub at 40 °C. Which statement is true?',
        options: ['The tea has more thermal energy, since it is hotter', 'The tub has more thermal energy, though its particles move more slowly', 'They have equal thermal energy', 'The tea particles and the tub particles move at the same average speed'],
        answer: 1,
        why: 'Temperature tracks the average motion of each particle. Thermal energy adds up all of the particles, and the tub has 750 times as many.',
      },
      {
        q: 'The same amount of heat goes into 100 g of water and 100 g of iron. Which gets hotter?',
        options: ['Water, since it has the larger specific heat', 'Iron, since it has the smaller specific heat', 'They rise by the same amount, since the heat is the same', 'Iron, since it is denser'],
        answer: 1,
        why: 'From $\\Delta T = q/(mc)$, a smaller $c$ gives a larger temperature rise. Iron rises about 9 times as much as water.',
      },
      {
        q: 'What does a specific heat of 4.184 J/g·°C mean?',
        options: ['1 g of water holds 4.184 J in total', '4.184 J warms 1 g of water by 1 °C', '4.184 g of water warms by 1 °C for each joule', '1 J warms 4.184 g of water by 1 °C'],
        answer: 1,
        why: 'Specific heat is the heat needed to warm one gram of a substance by one degree Celsius.',
      },
      {
        q: 'A sample cools from 65 °C to 25 °C. What is $\\Delta T$?',
        options: ['$+40$ °C', '$-40$ °C', '$+90$ °C', '$-90$ °C'],
        answer: 1,
        why: '$\\Delta T$ is always final minus initial: $25 - 65 = -40$ °C.',
      },
    ],

    gens: [
      {
        id: 'find-q',
        title: 'Find q',
        make(r) {
          const s = r.pick(SUBS);
          const m = r.int(5, 50) * 10;
          const hi = s.name === 'ethanol' ? 75 : 90; // Ethanol boils at 78 °C.
          let T1 = r.int(10, hi);
          let T2 = r.int(10, hi);
          while (Math.abs(T2 - T1) < 8) T2 = r.int(10, hi);
          T1 = +T1.toFixed(1); T2 = +T2.toFixed(1);
          const dT = T2 - T1;
          const q = m * s.c * dT;
          return {
            q: `How much heat is involved when ${m} g of ${s.name} goes from ${T1.toFixed(1)} °C to ${T2.toFixed(1)} °C? Use $c = ${s.c}$ J/g·°C. Include the sign.`,
            answer: q, unit: 'J', tol: 0.015,
            hint: 'Use $q = mc\\Delta T$, with $\\Delta T$ as final minus initial. Cooling makes $q$ negative.',
            steps: [
              `Find the change, final minus initial: $\\Delta T = ${T2.toFixed(1)} - ${T1.toFixed(1)} = ${signed(dT, 1)}\\ {}^\\circ\\text{C}$.`,
              `Fill in the equation: $q = (${m}\\ \\text{g})(${cTex(s.c)})(${signed(dT, 1)}\\ {}^\\circ\\text{C})$.`,
              `Grams and °C cancel: $q = ${signed(q, 0)}$ J, which is about $${q > 0 ? '+' : '-'}${Lab.sig(Math.abs(q) / 1000, 3)}$ kJ.`,
              q > 0 ? 'The sign is positive because the sample gains heat.' : 'The sign is negative because the sample loses heat.',
            ],
          };
        },
      },
      {
        id: 'final-t',
        title: 'Find the final temperature',
        make(r) {
          const s = r.pick(SUBS);
          const m = r.int(5, 40) * 10;
          const gain = r.int(0, 1) === 1;
          const T1 = gain ? r.int(15, 35) : r.int(70, s.name === 'ethanol' ? 75 : 95);
          const size = r.int(10, 40);
          const qMag = Math.round((m * s.c * size) / 10) * 10;
          const q = (gain ? 1 : -1) * qMag;
          const dT = q / (m * s.c);
          const T2 = T1 + dT;
          return {
            q: `A ${m} g sample of ${s.name} at ${T1}.0 °C ${gain ? 'absorbs' : 'gives off'} ${(qMag / 1000).toFixed(2)} kJ of heat. What is its final temperature? Use $c = ${s.c}$ J/g·°C.`,
            answer: T2, unit: '°C', tol: 0.02,
            hint: `Rearrange to $\\Delta T = q/(mc)$. Put $q$ in joules, and ${gain ? 'keep it positive' : 'make it negative'}.`,
            steps: [
              `The sample ${gain ? 'gains' : 'loses'} heat, so $q = ${signed(q, 0)}$ J.`,
              `Rearrange by dividing both sides by $mc$: $\\Delta T = \\dfrac{q}{mc} = \\dfrac{${signed(q, 0)}\\ \\text{J}}{(${m}\\ \\text{g})(${cTex(s.c)})} = ${signed(dT, 1)}\\ {}^\\circ\\text{C}$.`,
              `Use $T_f = T_i + \\Delta T = ${T1}.0 + (${signed(dT, 1)}) = ${T2.toFixed(1)}\\ {}^\\circ\\text{C}$.`,
            ],
          };
        },
      },
      {
        id: 'find-m',
        title: 'Find the mass',
        make(r) {
          const s = r.pick(SUBS);
          const dT = r.int(10, 60);
          const m0 = r.int(4, 60) * 5;
          const q = Math.round(m0 * s.c * dT);
          const m = q / (s.c * dT);
          return {
            q: `It takes ${(q / 1000).toFixed(3)} kJ to warm a sample of ${s.name} by ${dT}.0 °C. What is the mass of the sample? Use $c = ${s.c}$ J/g·°C.`,
            answer: m, unit: 'g',
            hint: 'Convert kJ to J first, then divide both sides of $q = mc\\Delta T$ by $c\\Delta T$.',
            steps: [
              `Put the heat in joules: $${(q / 1000).toFixed(3)}\\ \\text{kJ} = ${q}\\ \\text{J}$.`,
              `Rearrange by dividing both sides by $c\\Delta T$: $m = \\dfrac{q}{c\\Delta T}$.`,
              `Fill it in. Joules and °C cancel, leaving grams: $m = \\dfrac{${q}\\ \\text{J}}{(${cTex(s.c)})(${dT}.0\\ {}^\\circ\\text{C})} = ${Lab.sig(m, 3)}\\ \\text{g}$.`,
            ],
          };
        },
      },
      {
        id: 'find-c',
        title: 'Find the specific heat',
        make(r) {
          const s = r.pick(SUBS);
          const m = r.int(4, 40) * 5;
          const dT = r.int(12, 55);
          const q = Math.round(m * s.c * dT);
          const c = q / (m * dT);
          return {
            q: `A ${m} g sample absorbs ${q} J of heat and warms by ${dT}.0 °C. What is its specific heat in J/g·°C?`,
            answer: c, unit: 'J/g·°C', tol: 0.02,
            hint: 'Divide both sides of $q = mc\\Delta T$ by $m\\Delta T$.',
            steps: [
              'Rearrange by dividing both sides by $m\\Delta T$: $c = \\dfrac{q}{m\\Delta T}$.',
              `Fill it in: $c = \\dfrac{${q}\\ \\text{J}}{(${m}\\ \\text{g})(${dT}.0\\ {}^\\circ\\text{C})} = ${Lab.sig(c, 3)}\\ \\tfrac{\\text{J}}{\\text{g}\\cdot{}^\\circ\\text{C}}$.`,
              `That matches ${s.name}, with $c$ of about ${s.c}.`,
            ],
          };
        },
      },
      {
        id: 'sign',
        title: 'Sign of q',
        make(r) {
          const items = [
            ['Methane burns in a stove.', 'the burning methane', -1, 'Burning gives heat to the surroundings.'],
            ['Water freezes in an ice tray.', 'the water', -1, 'Water gives heat to the freezer air as it freezes.'],
            ['Steam condenses on a cold mirror.', 'the steam', -1, 'Steam gives heat to the mirror as it condenses.'],
            ['A hand warmer heats your fingers.', 'the chemicals in the warmer', -1, 'Heat leaves the chemicals and enters your fingers.'],
            ['A candle burns.', 'the burning wax', -1, 'Burning gives heat to the surroundings.'],
            ['An ice cube melts on a counter.', 'the ice', 1, 'Heat from the counter and air enters the ice.'],
            ['Sweat evaporates from your skin.', 'the sweat', 1, 'Heat from your skin enters the sweat, which is why sweating cools you.'],
            ['An instant cold pack turns cold.', 'the chemicals in the pack', 1, 'The chemicals pull heat from everything touching the pack.'],
            ['Water boils in a pot.', 'the water', 1, 'Heat from the stove enters the water.'],
            ['Limestone breaks down in a hot kiln.', 'the limestone', 1, 'The reaction only continues while heat keeps entering.'],
            ['A cold drink warms up on a hot day.', 'the drink', 1, 'Heat from the air enters the drink.'],
            ['A hot pan cools on the counter.', 'the pan', -1, 'Heat leaves the pan and enters the air and counter.'],
            ['Ice melts in your drink, and the drink gets colder.', 'the drink', -1, 'Heat leaves the drink and enters the ice. For the drink as the system, $q$ is negative.'],
          ];
          const [what, sys, dir, why] = r.pick(items);
          const pos = 'Positive, endothermic: heat enters the system';
          const neg = 'Negative, exothermic: heat leaves the system';
          return {
            q: `${what} The system is ${sys}. What is the sign of $q$?`,
            choices: [neg, pos],
            answer: dir < 0 ? 0 : 1,
            steps: [why, dir < 0 ? 'Heat out of the system means $q < 0$.' : 'Heat into the system means $q > 0$.'],
          };
        },
      },
      {
        id: 'compare',
        title: 'Which gets hotter?',
        make(r) {
          const [a, b] = r.shuffle(SUBS).slice(0, 2);
          const m = r.int(2, 20) * 10;
          const q = r.int(1, 9) * 200;
          const dA = q / (m * a.c), dB = q / (m * b.c);
          const win = a.c < b.c ? a : b;
          return {
            q: `Add ${q} J of heat to ${m} g of ${a.name} ($c = ${a.c}$) and ${m} g of ${b.name} ($c = ${b.c}$). Which has the larger temperature rise?`,
            choices: [`${a.name[0].toUpperCase() + a.name.slice(1)}`, `${b.name[0].toUpperCase() + b.name.slice(1)}`, 'They rise by the same amount'],
            answer: win === a ? 0 : 1,
            steps: [
              'Same heat and same mass, so the only difference is $c$. The smaller $c$ gives the bigger rise.',
              `${a.name}: $\\Delta T = \\dfrac{${q}}{(${m})(${a.c})} = ${Lab.sig(dA, 3)}\\ {}^\\circ\\text{C}$.`,
              `${b.name}: $\\Delta T = \\dfrac{${q}}{(${m})(${b.c})} = ${Lab.sig(dB, 3)}\\ {}^\\circ\\text{C}$.`,
            ],
          };
        },
      },
      {
        id: 'units',
        title: 'Energy units',
        make(r) {
          const kind = r.int(0, 3);
          if (kind === 0) {
            const cal = r.int(5, 900);
            const J = cal * 4.184;
            return {
              q: `Convert ${cal} cal to joules.`,
              answer: J, unit: 'J',
              hint: '1 cal = 4.184 J.',
              steps: [`Set it up so calories cancel: $${cal}\\ \\text{cal} \\times \\dfrac{4.184\\ \\text{J}}{1\\ \\text{cal}} = ${Lab.sig(J, 3)}\\ \\text{J}$.`],
            };
          }
          if (kind === 1) {
            const J = r.int(5, 900) * 10;
            const cal = J / 4.184;
            return {
              q: `Convert ${J} J to calories.`,
              answer: cal, unit: 'cal',
              hint: '1 cal = 4.184 J. Make sure joules cancel.',
              steps: [`Set it up so joules cancel: $${J}\\ \\text{J} \\times \\dfrac{1\\ \\text{cal}}{4.184\\ \\text{J}} = ${Lab.sig(cal, 3)}\\ \\text{cal}$.`],
            };
          }
          if (kind === 2) {
            const kJ = r.num(0.5, 95, 1);
            return {
              q: `Convert ${kJ} kJ to joules.`,
              answer: kJ * 1000, unit: 'J',
              hint: '1 kJ = 1000 J.',
              steps: [`Set it up so kJ cancels: $${kJ}\\ \\text{kJ} \\times \\dfrac{1000\\ \\text{J}}{1\\ \\text{kJ}} = ${Lab.sig(kJ * 1000, 3)}\\ \\text{J}$.`],
            };
          }
          const Cal = r.int(5, 60) * 10;
          const kJ = (Cal * 4184) / 1000;
          return {
            q: `A snack has ${Cal} food Calories (Cal). How many kilojoules is that?`,
            answer: kJ, unit: 'kJ',
            hint: '1 Cal = 1000 cal, and 1 cal = 4.184 J.',
            steps: [
              `Capital C means 1000 calories: $${Cal}\\ \\text{Cal} = ${Cal * 1000}\\ \\text{cal}$.`,
              `Calories to joules: $${Cal * 1000} \\times 4.184 = ${Cal * 4184}\\ \\text{J}$.`,
              `Joules to kilojoules: $${Cal * 4184} \\div 1000 = ${Lab.sig(kJ, 3)}\\ \\text{kJ}$.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What is kinetic energy?', back: 'Energy of motion. At the particle level, faster particles have more of it.' },
      { front: 'What is potential energy?', back: 'Stored energy of position or attraction, such as atoms held apart or a rock on a hill.' },
      { front: 'What is the system?', back: 'The part of the universe you choose to study, such as the reacting chemicals. Everything else is the surroundings.' },
      { front: 'What does exothermic mean?', back: 'Heat leaves the system. $q < 0$, and the surroundings warm up.' },
      { front: 'What does endothermic mean?', back: 'Heat enters the system. $q > 0$, and the surroundings cool down.' },
      { front: 'How are $q_{\\text{sys}}$ and $q_{\\text{surr}}$ related?', back: '$q_{\\text{sys}} = -q_{\\text{surr}}$. They are equal in size and opposite in sign.' },
      { front: 'What is the difference between heat and temperature?', back: 'Temperature measures average particle motion. Heat is energy moving from hot to cold.' },
      { front: 'What is specific heat?', back: 'The heat needed to warm 1 g of a substance by 1 °C, in J/g·°C. For water, 4.184.' },
      { front: 'State the heat equation.', back: '$q = mc\\Delta T$, where $\\Delta T = T_{\\text{final}} - T_{\\text{initial}}$.' },
      { front: 'How many joules are in 1 cal?', back: '4.184 J. A food Calorie is 1000 cal, or 4184 J.' },
    ],

    terms: [
      { term: 'Energy', def: 'The ability to do work or to move heat. Measured in joules.' },
      { term: 'Kinetic energy', def: 'Energy of motion.' },
      { term: 'Potential energy', def: 'Stored energy due to position or attraction.' },
      { term: 'Thermal energy', def: 'The total kinetic energy of all the particles in a sample.' },
      { term: 'Temperature', def: 'A measure of the average kinetic energy of the particles in a sample.' },
      { term: 'Heat', def: 'Energy transferred because of a temperature difference, always from hot to cold. Symbol: $q$.' },
      { term: 'System', def: 'The part of the universe being studied, such as the reacting chemicals.' },
      { term: 'Surroundings', def: 'Everything outside the system.' },
      { term: 'Exothermic', def: 'Heat leaves the system, so $q$ is negative and the surroundings warm up.' },
      { term: 'Endothermic', def: 'Heat enters the system, so $q$ is positive and the surroundings cool down.' },
      { term: 'First law of thermodynamics', def: 'Energy is neither created nor destroyed. It only moves or changes form.' },
      { term: 'Specific heat', def: 'The heat needed to warm 1 g of a substance by 1 °C. Symbol: $c$. Units: J/g·°C.' },
      { term: 'Joule', def: 'The SI unit of energy, symbol J. About the energy to lift an apple one meter.' },
      { term: 'Calorie', def: 'A unit of energy. 1 cal = 4.184 J, the heat that warms 1 g of water by 1 °C. A food Calorie (Cal) is 1000 cal.' },
    ],
  });
})();
