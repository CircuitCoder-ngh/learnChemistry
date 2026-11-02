/* Question bank for 6.2 Calorimetry. */
(function () {
  const METALS = [
    { name: 'aluminum', c: 0.90 },
    { name: 'iron', c: 0.45 },
    { name: 'copper', c: 0.385 },
    { name: 'gold', c: 0.129 },
  ];
  const CW = 4.184;
  const cTex = (c) => `${c}\\ \\tfrac{\\text{J}}{\\text{g}\\cdot{}^\\circ\\text{C}}`;
  const signed = (x, d) => (x > 0 ? '+' : x < 0 ? '-' : '') + Math.abs(x).toFixed(d);

  Bank.add('calorimetry', {
    quiz: [
      {
        q: 'Hot iron goes into cool water in a sealed foam cup. What happens to the iron and water at the end?',
        options: ['They reach the same temperature', 'They reach the same amount of thermal energy', 'The iron stays hotter, since it started hotter', 'The water ends up hotter than the iron did at the start'],
        answer: 0,
        why: 'Heat flows until the temperatures match. That is thermal equilibrium. Their thermal energies do not have to match.',
      },
      {
        q: 'In that same cup, how does the heat lost by the iron compare with the heat gained by the water?',
        options: ['The iron loses more, since it changes temperature more', 'The water gains more, since it has the higher specific heat', 'They are equal in size and opposite in sign', 'They have no relationship'],
        answer: 2,
        why: 'No heat escapes, so $q_{\\text{iron}} + q_{\\text{water}} = 0$. The temperature changes differ, but the heat is the same size.',
      },
      {
        q: 'Why does the final temperature usually land much closer to the water\'s starting temperature than the metal\'s?',
        options: ['Water has a higher $mc$, so it takes more heat to change its temperature', 'Metals do not hold heat', 'Water is colder', 'Heat always flows toward water'],
        answer: 0,
        why: 'With a large $mc$, water needs a small $\\Delta T$ to absorb the heat the metal gives up. Its large specific heat is the reason.',
      },
      {
        q: 'A salt dissolves in a coffee cup and the temperature of the water rises. What are the signs?',
        options: ['$q_{\\text{water}} > 0$ and $\\Delta H > 0$', '$q_{\\text{water}} > 0$ and $\\Delta H < 0$', '$q_{\\text{water}} < 0$ and $\\Delta H > 0$', '$q_{\\text{water}} < 0$ and $\\Delta H < 0$'],
        answer: 1,
        why: 'The water gained heat, so its $q$ is positive. That heat came from the dissolving salt, so the process is exothermic and $\\Delta H$ is negative.',
      },
      {
        q: 'A reaction in a coffee cup makes the water colder. What kind of process is it?',
        options: ['Exothermic, $\\Delta H < 0$', 'Exothermic, $\\Delta H > 0$', 'Endothermic, $\\Delta H > 0$', 'Endothermic, $\\Delta H < 0$'],
        answer: 2,
        why: 'The reaction took heat from the water, so heat entered the system. That is endothermic, with a positive $\\Delta H$.',
      },
      {
        q: 'What does a coffee cup calorimeter hold constant, and what does it therefore measure?',
        options: ['Constant volume, $\\Delta H$', 'Constant pressure, $\\Delta H$', 'Constant pressure, $\\Delta E$', 'Constant temperature, $\\Delta E$'],
        answer: 1,
        why: 'The cup is open to the air, so the pressure stays constant. Heat at constant pressure is the enthalpy change, $\\Delta H$.',
      },
      {
        q: 'What does a bomb calorimeter hold constant, and what does it therefore measure?',
        options: ['Constant volume, $\\Delta E$', 'Constant pressure, $\\Delta E$', 'Constant pressure, $\\Delta H$', 'Constant temperature, $\\Delta H$'],
        answer: 0,
        why: 'The steel can cannot expand, so the volume is constant and no expansion work is done. The heat equals the internal energy change, $\\Delta E$.',
      },
      {
        q: 'You dissolve 5 g of salt in 100 g of water in a coffee cup. Which mass goes in $q = mc\\Delta T$?',
        options: ['100 g, only the water', '5 g, only the salt', '105 g, the whole solution', '95 g, the difference'],
        answer: 2,
        why: 'The entire solution warms up, so use the total mass of 105 g.',
      },
      {
        q: 'A calorimeter is labeled $C_{\\text{cal}} = 12$ kJ/°C. What does that number mean?',
        options: ['12 kJ warms 1 g of it by 1 °C', 'The whole calorimeter warms by 1 °C when it absorbs 12 kJ', 'It can hold at most 12 kJ', 'It warms by 12 °C when it absorbs 1 kJ'],
        answer: 1,
        why: 'Heat capacity is for the whole object, not per gram. So $q = C_{\\text{cal}}\\Delta T$, with no mass.',
      },
    ],

    gens: [
      {
        id: 'final-t',
        title: 'Final temperature',
        make(r) {
          const M = r.pick(METALS);
          const mM = r.int(4, 30) * 5;
          const TM = r.int(16, 38) * 5;
          const mW = r.int(5, 30) * 10;
          const TW = r.int(10, 30);
          const a = mM * M.c, b = mW * CW;
          const Tf = (a * TM + b * TW) / (a + b);
          return {
            q: `A ${mM} g piece of ${M.name} at ${TM}.0 °C is dropped into ${mW} g of water at ${TW}.0 °C. What is the final temperature? Use $c = ${M.c}$ J/g·°C for ${M.name} and $c = 4.184$ for water.`,
            answer: Tf, unit: '°C', tol: 0.015,
            hint: 'Write $q_{\\text{metal}} + q_{\\text{water}} = 0$ with $T_f$ in both terms, then collect the $T_f$ terms.',
            steps: [
              'Write the balance: $q_{\\text{metal}} + q_{\\text{water}} = 0$.',
              `Fill in: $(${mM})(${M.c})(T_f - ${TM}) + (${mW})(4.184)(T_f - ${TW}) = 0$.`,
              `Multiply out: $${a.toFixed(2)}\\,T_f - ${(a * TM).toFixed(0)} + ${b.toFixed(1)}\\,T_f - ${(b * TW).toFixed(0)} = 0$.`,
              `Collect terms: $${(a + b).toFixed(1)}\\,T_f = ${(a * TM + b * TW).toFixed(0)}$.`,
              `Divide: $T_f = ${Tf.toFixed(1)}\\ {}^\\circ\\text{C}$. It lies between ${TW} and ${TM}, as it must.`,
            ],
          };
        },
      },
      {
        id: 'find-c',
        title: 'Specific heat of a metal',
        make(r) {
          const M = r.pick(METALS);
          const mM = r.int(8, 30) * 5;
          const TM = r.int(16, 20) * 5;
          const mW = r.int(5, 20) * 10;
          const TW = r.int(15, 25);
          const a = mM * M.c, b = mW * CW;
          const Tf = +((a * TM + b * TW) / (a + b)).toFixed(1);
          const qW = mW * CW * (Tf - TW);
          const dTm = Tf - TM;
          const c = -qW / (mM * dTm);
          return {
            q: `A ${mM} g piece of metal at ${TM}.0 °C goes into ${mW} g of water at ${TW}.0 °C. The final temperature is ${Tf.toFixed(1)} °C. What is the specific heat of the metal?`,
            answer: c, unit: 'J/g·°C', tol: 0.04,
            hint: 'Find the heat the water gained. The metal lost that much, so its $q$ is the same number with a minus sign.',
            steps: [
              `Heat gained by the water: $q_{\\text{water}} = (${mW})(4.184)(${Tf.toFixed(1)} - ${TW}) = ${signed(qW, 0)}\\ \\text{J}$.`,
              `The metal lost that much: $q_{\\text{metal}} = ${signed(-qW, 0)}\\ \\text{J}$.`,
              `The metal's change: $\\Delta T = ${Tf.toFixed(1)} - ${TM} = ${signed(dTm, 1)}\\ {}^\\circ\\text{C}$.`,
              `Solve: $c = \\dfrac{q}{m\\Delta T} = \\dfrac{${signed(-qW, 0)}}{(${mM})(${signed(dTm, 1)})} = ${Lab.sig(c, 3)}\\ \\tfrac{\\text{J}}{\\text{g}\\cdot{}^\\circ\\text{C}}$.`,
              `That is close to ${M.name}, with $c$ of about ${M.c}.`,
            ],
          };
        },
      },
      {
        id: 'find-mw',
        title: 'Find the water',
        make(r) {
          const M = r.pick(METALS);
          const mM = r.int(10, 40) * 5;
          const TM = r.int(16, 30) * 5;
          const TW = r.int(15, 25);
          const Tf = TW + r.int(4, 12);
          const qM = mM * M.c * (Tf - TM);
          const mW = -qM / (CW * (Tf - TW));
          return {
            q: `A ${mM} g piece of ${M.name} ($c = ${M.c}$ J/g·°C) at ${TM}.0 °C goes into water at ${TW}.0 °C. The final temperature is ${Tf}.0 °C. How many grams of water were there?`,
            answer: mW, unit: 'g',
            hint: 'Find the heat the metal lost first, then use it as the heat the water gained.',
            steps: [
              `Heat from the metal: $q_{\\text{metal}} = (${mM})(${M.c})(${Tf} - ${TM}) = ${signed(qM, 0)}\\ \\text{J}$.`,
              `The water gained that much: $q_{\\text{water}} = ${signed(-qM, 0)}\\ \\text{J}$.`,
              `Solve for mass, dividing both sides by $c\\Delta T$: $m = \\dfrac{q}{c\\Delta T} = \\dfrac{${signed(-qM, 0)}}{(4.184)(${Tf} - ${TW})} = ${Lab.sig(mW, 3)}\\ \\text{g}$.`,
            ],
          };
        },
      },
      {
        id: 'dissolve',
        title: 'ΔH from dissolving',
        make(r) {
          const [name, f, dH] = r.pick([['NaOH', 'NaOH', -44.5], ['$\\ce{NH4NO3}$', 'NH4NO3', 25.7], ['KCl', 'KCl', 17.2]]);
          const M = Bank.molarMass(f);
          const mS = r.int(4, 20) * 0.5;
          const mW = r.int(5, 20) * 10;
          const n = mS / M;
          const total = mW + mS;
          const dT0 = (-dH * 1000 * n) / (total * CW);
          const T1 = r.int(18, 28);
          const dT = +dT0.toFixed(2);
          const T2 = +(T1 + dT).toFixed(2);
          const qW = total * CW * dT;
          const qR = -qW / 1000;
          const ans = qR / n;
          return {
            q: `${mS.toFixed(1)} g of ${name} dissolves in ${mW}.0 g of water in a coffee cup. The temperature goes from ${T1}.00 °C to ${T2.toFixed(2)} °C. Find $\\Delta H$ in kJ per mole of the solute. Use $c = 4.184$ J/g·°C for the solution. Include the sign.`,
            answer: ans, unit: 'kJ/mol', tol: 0.03,
            hint: 'Use the mass of the whole solution. Then flip the sign of the water\'s $q$ before you divide by moles.',
            steps: [
              `Total mass: $${mW} + ${mS.toFixed(1)} = ${total.toFixed(1)}\\ \\text{g}$. Change: $\\Delta T = ${signed(dT, 2)}\\ {}^\\circ\\text{C}$.`,
              `Heat for the water: $q_{\\text{water}} = (${total.toFixed(1)})(4.184)(${signed(dT, 2)}) = ${signed(qW, 0)}\\ \\text{J}$.`,
              `Flip the sign for the reaction: $q_{\\text{rxn}} = ${signed(qR, 3)}\\ \\text{kJ}$. The water ${dT > 0 ? 'warmed, so this is exothermic' : 'cooled, so this is endothermic'}.`,
              `Moles of solute: $n = ${mS.toFixed(1)} \\div ${M.toFixed(2)} = ${n.toFixed(4)}\\ \\text{mol}$.`,
              `Divide: $\\Delta H = \\dfrac{${signed(qR, 3)}\\ \\text{kJ}}{${n.toFixed(4)}\\ \\text{mol}} = ${signed(ans, 1)}\\ \\text{kJ/mol}$.`,
            ],
          };
        },
      },
      {
        id: 'neutralize',
        title: 'ΔH of neutralization',
        make(r) {
          const V = r.int(5, 20) * 5;
          const M = r.pick([0.5, 1, 1.5, 2]);
          const n = (V / 1000) * M;
          const total = 2 * V;
          const dT = +((55.8 * 1000 * n) / (total * CW)).toFixed(1);
          const qW = total * CW * dT;
          const qR = -qW / 1000;
          const ans = qR / n;
          const T1 = r.int(20, 25);
          return {
            q: `${V}.0 mL of ${M.toFixed(2)} M HCl and ${V}.0 mL of ${M.toFixed(2)} M NaOH, both at ${T1}.0 °C, are mixed in a coffee cup. The temperature rises to ${(T1 + dT).toFixed(1)} °C. Find $\\Delta H$ per mole of water formed. Assume the solution has a density of 1.00 g/mL and $c = 4.184$ J/g·°C.`,
            answer: ans, unit: 'kJ/mol', tol: 0.03,
            hint: 'Add the two volumes for the mass. Moles of water formed equal moles of $\\ce{HCl}$, since the reaction is 1 to 1.',
            steps: [
              `Total volume is $${V} + ${V} = ${total}\\ \\text{mL}$, so the mass is ${total}. g. Change: $\\Delta T = +${dT.toFixed(1)}\\ {}^\\circ\\text{C}$.`,
              `Heat for the solution: $q_{\\text{water}} = (${total})(4.184)(${dT.toFixed(1)}) = ${signed(qW, 0)}\\ \\text{J}$.`,
              `Flip the sign: $q_{\\text{rxn}} = ${signed(qR, 3)}\\ \\text{kJ}$.`,
              `Moles reacted: $n = (${(V / 1000).toFixed(3)}\\ \\text{L})(${M.toFixed(2)}\\ \\text{mol/L}) = ${n.toFixed(4)}\\ \\text{mol}$ of water.`,
              `Divide: $\\Delta H = \\dfrac{${signed(qR, 3)}}{${n.toFixed(4)}} = ${signed(ans, 1)}\\ \\text{kJ/mol}$.`,
            ],
          };
        },
      },
      {
        id: 'bomb',
        title: 'Bomb calorimeter',
        make(r) {
          const [name, f, dE] = r.pick([['carbon', 'C', -393.5], ['glucose', 'C6H12O6', -2803], ['sucrose', 'C12H22O11', -5640]]);
          const M = Bank.molarMass(f);
          const m = r.int(5, 25) * 0.1;
          const Cc = r.int(16, 30) * 0.5;
          const n = m / M;
          const dT = +((-dE * n) / Cc).toFixed(2);
          const qC = Cc * dT;
          const ans = -qC / n;
          return {
            q: `Burning ${m.toFixed(2)} g of ${name} ($\\ce{${f}}$, ${M.toFixed(2)} g/mol) in a bomb calorimeter with $C_{\\text{cal}} = ${Cc.toFixed(1)}$ kJ/°C raises the temperature by ${dT.toFixed(2)} °C. Find the heat of combustion in kJ per mole. Include the sign.`,
            answer: ans, unit: 'kJ/mol', tol: 0.03,
            hint: 'Multiply $C_{\\text{cal}}$ by $\\Delta T$, flip the sign, then divide by moles.',
            steps: [
              `Heat gained by the calorimeter: $q_{\\text{cal}} = (${Cc.toFixed(1)})(${dT.toFixed(2)}) = +${qC.toFixed(2)}\\ \\text{kJ}$.`,
              `Flip the sign for the reaction: $q_{\\text{rxn}} = -${qC.toFixed(2)}\\ \\text{kJ}$.`,
              `Moles burned: $n = ${m.toFixed(2)} \\div ${M.toFixed(2)} = ${n.toFixed(5)}\\ \\text{mol}$.`,
              `Divide: $\\dfrac{-${qC.toFixed(2)}}{${n.toFixed(5)}} = ${Lab.sig(ans, 3)}\\ \\text{kJ/mol}$.`,
            ],
          };
        },
      },
      {
        id: 'calibrate',
        title: 'Find the heat capacity',
        make(r) {
          const known = r.pick([['carbon', -32.8], ['glucose', -15.6], ['table sugar', -16.5]]);
          const m = r.int(5, 25) * 0.1;
          const dT = r.int(14, 60) * 0.1;
          const q = -known[1] * m;
          const Cc = q / dT;
          return {
            q: `A ${m.toFixed(2)} g sample of ${known[0]} releases ${Math.abs(known[1])} kJ/g when burned. In a bomb calorimeter, this raises the temperature by ${dT.toFixed(2)} °C. What is $C_{\\text{cal}}$?`,
            answer: Cc, unit: 'kJ/°C',
            hint: 'Find the total heat released first. The calorimeter absorbs all of it.',
            steps: [
              `Heat released: $${m.toFixed(2)}\\ \\text{g} \\times ${Math.abs(known[1])}\\ \\text{kJ/g} = ${q.toFixed(2)}\\ \\text{kJ}$. So $q_{\\text{cal}} = +${q.toFixed(2)}\\ \\text{kJ}$.`,
              `Rearrange $q_{\\text{cal}} = C_{\\text{cal}}\\Delta T$ by dividing both sides by $\\Delta T$: $C_{\\text{cal}} = \\dfrac{q_{\\text{cal}}}{\\Delta T}$.`,
              `Fill it in: $C_{\\text{cal}} = \\dfrac{${q.toFixed(2)}\\ \\text{kJ}}{${dT.toFixed(2)}\\ {}^\\circ\\text{C}} = ${Lab.sig(Cc, 3)}\\ \\text{kJ/}{}^\\circ\\text{C}$.`,
            ],
          };
        },
      },
      {
        id: 'sign-call',
        title: 'Read the thermometer',
        make(r) {
          const T1 = r.int(18, 30);
          const up = r.int(0, 1) === 1;
          const d = r.int(2, 15);
          const T2 = up ? T1 + d : T1 - d;
          const what = r.pick(['A salt dissolves', 'Two solutions are mixed', 'A solid dissolves'].concat(up ? ['An acid and a base react'] : [])); // Neutralization never cools the water.
          const ask = r.pick(['rxn', 'water']);
          const pos = ask === 'water' ? up : !up;
          return {
            q: `${what} in a coffee cup, and the thermometer goes from ${T1} °C to ${T2} °C. What is the sign of ${ask === 'rxn' ? '$q$ for the reaction' : '$q$ for the water'}?`,
            choices: ['Positive', 'Negative'],
            answer: pos ? 0 : 1,
            steps: [
              `The water ${up ? 'warmed, so it gained heat: $q_{\\text{water}} > 0$' : 'cooled, so it lost heat: $q_{\\text{water}} < 0$'}.`,
              `The reaction is the opposite: $q_{\\text{rxn}} = -q_{\\text{water}}$, so it is ${up ? 'negative (exothermic)' : 'positive (endothermic)'}.`,
              `The question asks about the ${ask === 'rxn' ? 'reaction' : 'water'}, so the sign is <b>${pos ? 'positive' : 'negative'}</b>.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What is a calorimeter?', back: 'A container that traps heat so you can measure it from a temperature change.' },
      { front: 'What equation describes hot metal in cool water?', back: '$q_{\\text{metal}} + q_{\\text{water}} = 0$, or $m_1c_1\\Delta T_1 = -m_2c_2\\Delta T_2$.' },
      { front: 'What is thermal equilibrium?', back: 'The state where touching objects reach the same temperature, so no more net heat flows.' },
      { front: 'A coffee cup reaction warms the water. What are the signs?', back: '$q_{\\text{water}} > 0$, and $q_{\\text{rxn}} < 0$ with $\\Delta H < 0$. It is exothermic.' },
      { front: 'What does a coffee cup calorimeter measure?', back: 'The heat at constant pressure, which is $\\Delta H$.' },
      { front: 'What does a bomb calorimeter measure?', back: 'The heat at constant volume, which is $\\Delta E$, the change in internal energy.' },
      { front: 'What equation goes with a bomb calorimeter?', back: '$q_{\\text{cal}} = C_{\\text{cal}}\\Delta T$, and $q_{\\text{rxn}} = -q_{\\text{cal}}$.' },
      { front: 'How do you get $\\Delta H$ per mole from a calorimeter?', back: 'Find $q$ for the water, flip the sign, then divide by the moles that reacted.' },
    ],

    terms: [
      { term: 'Calorimeter', def: 'A device that traps heat so it can be measured from a temperature change.' },
      { term: 'Calorimetry', def: 'The science of measuring heat flow.' },
      { term: 'Coffee cup calorimeter', def: 'Nested foam cups with a lid and a thermometer. It runs at constant pressure and measures $\\Delta H$.' },
      { term: 'Bomb calorimeter', def: 'A sealed steel vessel sunk in water, used to burn samples. It runs at constant volume and measures $\\Delta E$.' },
      { term: 'Heat capacity', def: 'The heat needed to warm a whole object by 1 °C. Symbol: $C$. Units: J/°C or kJ/°C.' },
      { term: 'Thermal equilibrium', def: 'The state where objects in contact have reached the same temperature.' },
      { term: 'Internal energy', def: 'The total energy of a system. The heat at constant volume equals its change, written $\\Delta E$ or $\\Delta U$.' },
    ],
  });
})();
