/* Question bank for 11.1 Solubility and colligative properties. */
(function () {
  'use strict';
  const KF = 1.86, KB = 0.512, R = 0.08206;
  const SOLUTES = [
    { f: 'NaCl', name: 'sodium chloride', i: 2 }, { f: 'KCl', name: 'potassium chloride', i: 2 }, { f: 'CaCl2', name: 'calcium chloride', i: 3 },
    { f: 'MgCl2', name: 'magnesium chloride', i: 3 }, { f: 'C6H12O6', name: 'glucose', i: 1 }, { f: 'C12H22O11', name: 'sucrose', i: 1 },
    { f: 'C2H6O2', name: 'ethylene glycol', i: 1 }, { f: 'CH4N2O', name: 'urea', i: 1 }, { f: 'AlCl3', name: 'aluminum chloride', i: 4 }, { f: 'Na2SO4', name: 'sodium sulfate', i: 3 },
  ];
  const whyI = (s) => (s.i === 1 ? `$\\ce{${s.f}}$ does not form ions, so $i = 1$.` : `$\\ce{${s.f}}$ splits into ${s.i} ions per formula unit, so $i = ${s.i}$.`);
  const ce = (f) => `$\\ce{${f}}$`;

  Bank.add('solution-props', {
    quiz: [
      {
        q: 'Why does oil not dissolve in water?',
        options: ['Oil molecules repel water with a strong force', 'Water molecules stick to each other too strongly to make room for oil, which offers little in return', 'Oil is more dense than water', 'Oil molecules are charged'],
        answer: 1,
        why: 'Letting oil in would break hydrogen bonds and form only weak new attractions. It is not a matter of repulsion.',
      },
      {
        q: 'Which substance dissolves best in hexane, $\\ce{C6H14}$?',
        options: ['$\\ce{NaCl}$', 'Sugar', '$\\ce{I2}$', '$\\ce{KNO3}$'],
        answer: 2,
        why: 'Hexane is nonpolar, and so is $\\ce{I2}$. Like dissolves like. Ionic salts and polar sugar stay out.',
      },
      {
        q: 'A cold pack feels cold because dissolving its salt is:',
        options: ['Endothermic: the energy costs of separating are greater than the energy paid back by mixing', 'Exothermic: heat is released', 'Not a real process', 'Exothermic: separating particles releases heat'],
        answer: 0,
        why: '$\\ce{NH4NO3}$ has a positive $\\Delta H_\\text{soln}$. It absorbs heat from its surroundings, so the pack cools down.',
      },
      {
        q: 'Warming a soda does what to the amount of $\\ce{CO2}$ it can hold?',
        options: ['Raises it, as for most solids', 'Lowers it', 'No change', 'Raises it only under pressure'],
        answer: 1,
        why: 'Gases get less soluble in water as temperature rises, because the fast-moving gas molecules escape more easily.',
      },
      {
        q: 'If you double the pressure of a gas above a liquid, what happens to its solubility?',
        options: ['It halves', 'It stays the same', 'It doubles', 'It quadruples'],
        answer: 2,
        why: "Henry's law, $C = k_H P$, is a direct proportion.",
      },
      {
        q: 'A clear solution holds more solute than should be possible at its temperature. You drop in a tiny crystal, and solid suddenly forms. The solution was:',
        options: ['Unsaturated', 'Saturated', 'Supersaturated', 'Dilute'],
        answer: 2,
        why: 'A supersaturated solution holds extra solute only until a crystal gives the particles something to build on.',
      },
      {
        q: 'What is the difference between molality and molarity?',
        options: ['There is no difference', 'Molality is per kg of solvent, and molarity is per L of solution', 'Molality is per L of solvent, and molarity is per kg of solution', 'Molality is by mass of solute, and molarity is by moles'],
        answer: 1,
        why: 'Molality uses the solvent and a mass. Molarity uses the whole solution and a volume, which changes slightly with temperature.',
      },
      {
        q: 'Which 0.10 m solution has the lowest freezing point?',
        options: ['Glucose', '$\\ce{NaCl}$', '$\\ce{CaCl2}$', 'They all freeze at the same temperature'],
        answer: 2,
        why: 'Freezing depends on the number of particles. $\\ce{CaCl2}$ makes 3 per formula unit, the most here.',
      },
      {
        q: 'What is the van \'t Hoff factor of $\\ce{Na2SO4}$, assuming full dissociation?',
        options: ['1', '2', '3', '7'],
        answer: 2,
        why: 'It splits into 2 $\\ce{Na+}$ and 1 $\\ce{SO4^2-}$, which is 3 particles. The sulfate ion stays in one piece.',
      },
      {
        q: 'Adding a nonvolatile solute to water does what?',
        options: ['Raises vapor pressure and raises boiling point', 'Lowers vapor pressure and raises boiling point', 'Lowers vapor pressure and lowers boiling point', 'Has no effect on vapor pressure'],
        answer: 1,
        why: 'Fewer solvent molecules escape, so you must heat further before vapor pressure reaches the outside pressure.',
      },
      {
        q: 'Pure water and a sugar solution are separated by a semipermeable membrane. What happens?',
        options: ['Sugar moves into the pure water', 'Water moves into the sugar solution', 'Water moves out of the sugar solution', 'Nothing moves'],
        answer: 1,
        why: 'Water moves toward the higher solute concentration. The sugar cannot pass through the membrane.',
      },
      {
        q: 'A red blood cell is placed in pure water. What happens?',
        options: ['It shrivels, since water leaves it', 'It swells and may burst, since water enters it', 'Nothing happens', 'Salt moves into it'],
        answer: 1,
        why: 'Pure water is hypotonic: it has less solute than the cell. Water moves into the cell, toward the higher solute concentration.',
      },
    ],

    gens: [
      {
        id: 'molality',
        title: 'Molality',
        make(r) {
          const s = r.pick(SOLUTES);
          const M = Bank.molarMass(s.f), g = r.num(M * 0.05, M * 1.5, 1), kg = r.pick([0.100, 0.200, 0.250, 0.500, 0.750, 1.00]);
          const n = g / M, m = n / kg;
          return {
            q: `What is the molality of a solution made from ${g} g of ${s.name} in ${kg * 1000} g of water?`,
            answer: m, unit: 'm',
            hint: 'Moles of solute over kilograms of solvent.',
            steps: [
              `Moles: $${g} \\div ${M.toFixed(2)} = ${Lab.sig(n, 3)}$ mol.`,
              `Solvent in kg: ${kg * 1000} g = ${kg} kg.`,
              `$m = \\dfrac{${Lab.sig(n, 3)}\\text{ mol}}{${kg}\\text{ kg}} = ${Lab.sig(m, 3)}\\ m$.`,
            ],
          };
        },
      },
      {
        id: 'mole-fraction',
        title: 'Mole fraction',
        make(r) {
          const s = r.pick(SOLUTES.filter((x) => x.i === 1));
          const M = Bank.molarMass(s.f), Mw = Bank.molarMass('H2O');
          const g = r.num(10, 150, 1), w = r.int(10, 50) * 10;
          const n = g / M, nw = w / Mw, x = n / (n + nw);
          return {
            q: `A solution holds ${g} g of ${s.name} and ${w} g of water. What is the mole fraction of ${s.name}?`,
            answer: x, tol: 0.02,
            hint: 'Find the moles of each, then solute moles over total moles.',
            steps: [
              `Solute: $${g} \\div ${M.toFixed(2)} = ${Lab.sig(n, 3)}$ mol.`,
              `Water: $${w} \\div ${Mw.toFixed(2)} = ${Lab.sig(nw, 3)}$ mol.`,
              `$\\chi = \\dfrac{${Lab.sig(n, 3)}}{${Lab.sig(n, 3)} + ${Lab.sig(nw, 3)}} = ${Lab.sig(x, 3)}$.`,
            ],
          };
        },
      },
      {
        id: 'percent-ppm',
        title: 'Mass percent and ppm',
        make(r) {
          if (r.next() < 0.5) {
            const g = r.num(2, 80, 1), w = r.int(10, 60) * 10, pct = (g / (g + w)) * 100;
            return {
              q: `What is the mass percent of a solution with ${g} g of NaCl in ${w} g of water?`,
              answer: pct, unit: '%',
              hint: 'The bottom is the mass of the whole solution.',
              steps: [`Mass of solution: $${g} + ${w} = ${Lab.fmt(g + w, 1)}$ g.`, `$\\dfrac{${g}}{${Lab.fmt(g + w, 1)}} \\times 100 = ${Lab.sig(pct, 3)}\\%$.`],
            };
          }
          const mg = r.num(0.5, 50, 1), kg = r.pick([1, 2, 5, 10]);
          const ppm = (mg / 1000 / (kg * 1000)) * 1e6;
          return {
            q: `A ${kg} kg water sample holds ${mg} mg of lead. What is the concentration in ppm?`,
            answer: ppm, unit: 'ppm',
            hint: 'In dilute water solutions, 1 ppm is the same as 1 mg per kg.',
            steps: [`Convert both to grams: ${mg} mg = ${+(mg / 1000).toFixed(4)} g, and ${kg} kg = ${kg * 1000} g.`, `$\\dfrac{${+(mg / 1000).toFixed(4)}}{${kg * 1000}} \\times 10^6 = ${Lab.sig(ppm, 3)}$ ppm. Note that it equals mg per kg.`],
          };
        },
      },
      {
        id: 'henry',
        title: "Henry's law",
        make(r) {
          const k = 3.4e-2, P = r.num(0.5, 6, 1);
          const C = k * P;
          if (r.next() < 0.5) {
            return {
              q: `$k_H$ for $\\ce{CO2}$ in water at 25 °C is $3.4 \\times 10^{-2}$ mol/(L atm). What is the concentration of $\\ce{CO2}$ at ${P} atm?`,
              answer: C, unit: 'mol/L',
              hint: '$C = k_H P$.',
              steps: [`$C = (3.4 \\times 10^{-2})(${P}) = ${Lab.sig(C, 2)}$ mol/L.`],
            };
          }
          const P2 = r.num(0.5, 6, 1), C1 = +Lab.sig(C, 2), C2 = (C1 * P2) / P;
          return {
            q: `A gas has a solubility of ${C1} mol/L at ${P} atm. What is its solubility at ${P2} atm, at the same temperature?`,
            answer: C2, unit: 'mol/L',
            hint: 'Solubility is proportional to pressure, so $C_1/P_1 = C_2/P_2$.',
            steps: [`$C_2 = C_1 \\times \\dfrac{P_2}{P_1} = ${C1} \\times \\dfrac{${P2}}{${P}} = ${Lab.sig(C2, 3)}$ mol/L.`],
          };
        },
      },
      {
        id: 'freezing',
        title: 'Freezing point',
        make(r) {
          const s = r.pick(SOLUTES), m = r.num(0.1, 3, 2), d = s.i * KF * m;
          return {
            q: `What is the freezing point, in °C, of a ${m} m solution of ${s.name} in water, assuming ideal behavior? $K_f = 1.86\\ ^\\circ\\text{C}/m$.`,
            answer: -d, unit: '°C', tol: 0.02,
            hint: 'Find $i$. Then $\\Delta T_f = iK_fm$, and subtract from 0 °C.',
            steps: [whyI(s), `$\\Delta T_f = (${s.i})(1.86)(${m}) = ${Lab.sig(d, 3)}\\ ^\\circ\\text{C}$.`, `Freezing point: $0 - ${Lab.sig(d, 3)} = -${Lab.sig(d, 3)}\\ ^\\circ\\text{C}$.`],
          };
        },
      },
      {
        id: 'boiling',
        title: 'Boiling point',
        make(r) {
          const s = r.pick(SOLUTES), m = r.num(0.2, 4, 2), d = s.i * KB * m;
          return {
            q: `What is the boiling point, in °C, of a ${m} m solution of ${s.name} in water at 1 atm, assuming ideal behavior? $K_b = 0.512\\ ^\\circ\\text{C}/m$.`,
            answer: 100 + d, unit: '°C', tol: 0.0005,
            hint: 'Find $i$. Then $\\Delta T_b = iK_bm$, and add to 100 °C.',
            steps: [whyI(s), `$\\Delta T_b = (${s.i})(0.512)(${m}) = ${d.toFixed(2)}\\ ^\\circ\\text{C}$.`, `Boiling point: $100 + ${d.toFixed(2)} = ${(100 + d).toFixed(2)}\\ ^\\circ\\text{C}$.`],
          };
        },
      },
      {
        id: 'rank-fp',
        title: 'Rank by particles',
        make(r) {
          const base = r.pick([0.1, 0.2, 0.5]);
          const list = r.shuffle(SOLUTES).filter((s, i, a) => a.findIndex((o) => o.i === s.i) === i).slice(0, 3);
          const low = r.next() < 0.5;
          const pick = list.reduce((b, s) => (s.i > b.i ? s : b), list[0]);
          const least = list.reduce((b, s) => (s.i < b.i ? s : b), list[0]);
          const ans = low ? pick : least;
          const opts = r.mc(ce(ans.f), list.filter((s) => s !== ans).map((s) => ce(s.f)));
          return {
            q: `Which ${base} m water solution has the ${low ? 'lowest' : 'highest'} freezing point?`,
            choices: opts.choices, answer: opts.answer,
            hint: 'Same molality, so compare the number of particles each makes.',
            steps: [list.map((s) => `${ce(s.f)}: $i = ${s.i}$`).join(', ') + '.', low ? 'The most particles lower the freezing point the most.' : 'The fewest particles lower the freezing point the least.', `So the answer is ${ce(ans.f)}.`],
          };
        },
      },
      {
        id: 'osmotic',
        title: 'Osmotic pressure',
        make(r) {
          const s = r.pick(SOLUTES), M = r.num(0.01, 0.5, 3), T = r.pick([20, 25, 37]), TK = T + 273;
          const P = s.i * M * R * TK;
          return {
            q: `What is the osmotic pressure in atm of a ${M} M solution of ${s.name} at ${T} °C? Assume ideal behavior.`,
            answer: P, unit: 'atm',
            hint: '$\\Pi = iMRT$, with $T$ in kelvin.',
            steps: [whyI(s), `$T = ${T} + 273 = ${TK}$ K.`, `$\\Pi = (${s.i})(${M})(0.08206)(${TK}) = ${Lab.sig(P, 3)}$ atm.`],
          };
        },
      },
      {
        id: 'raoult',
        title: "Raoult's law",
        make(r) {
          const s = r.pick(SOLUTES.filter((x) => x.i === 1));
          const M = Bank.molarMass(s.f), Mw = Bank.molarMass('H2O');
          const T = r.pick([[25, 23.8], [37, 47.1], [50, 92.5], [80, 355.1]]);
          const n = r.num(0.2, 3, 2), w = r.int(10, 50) * 10;
          const nw = w / Mw, xw = nw / (n + nw), P = xw * T[1];
          void M;
          return {
            q: `Water has a vapor pressure of ${T[1]} torr at ${T[0]} °C. What is the vapor pressure of a solution of ${n} mol of ${s.name} in ${w} g of water?`,
            answer: P, unit: 'torr', tol: 0.01,
            hint: 'Use the mole fraction of the <b>solvent</b>.',
            steps: [
              `Moles of water: $${w} \\div ${Mw.toFixed(2)} = ${Lab.sig(nw, 3)}$ mol.`,
              `$\\chi_\\text{water} = \\dfrac{${Lab.sig(nw, 3)}}{${Lab.sig(nw, 3)} + ${n}} = ${xw.toFixed(3)}$.`,
              `$P = (${xw.toFixed(3)})(${T[1]}) = ${Lab.sig(P, 3)}$ torr.`,
            ],
          };
        },
      },
      {
        id: 'molar-mass',
        title: 'Exam style: molar mass from freezing point',
        make(r) {
          const trueM = r.pick([60, 92, 100, 122, 150, 180, 250, 342]);
          const g = r.num(1, 20, 1), kg = r.pick([0.1, 0.2, 0.25, 0.5]);
          const n = g / trueM, m = n / kg, dT = +(KF * m).toFixed(3);
          const m2 = dT / KF, n2 = m2 * kg, M = g / n2;
          return {
            q: `Dissolving ${g} g of a nonelectrolyte in ${kg * 1000} g of water lowers the freezing point by ${dT} °C. What is its molar mass? $K_f = 1.86\\ ^\\circ\\text{C}/m$.`,
            answer: M, unit: 'g/mol', tol: 0.02,
            hint: 'Temperature change to molality, molality to moles, then grams over moles.',
            steps: [
              `$m = \\dfrac{${dT}}{1.86} = ${Lab.sig(m2, 3)}\\ m$.`,
              `Moles: $${Lab.sig(m2, 3)} \\times ${kg} = ${Lab.sig(n2, 3)}$ mol.`,
              `Molar mass: $\\dfrac{${g}\\text{ g}}{${Lab.sig(n2, 3)}\\text{ mol}} = ${Lab.sig(M, 3)}$ g/mol.`,
            ],
          };
        },
      },
      {
        id: 'dissolve',
        title: 'Will it dissolve?',
        make(r) {
          const c = r.pick([
            ['$\\ce{KCl}$', 'water', 'Yes', 'An ionic solid in a polar solvent: ion-dipole forces pay for it.'],
            ['$\\ce{KCl}$', 'hexane', 'No', 'An ionic solid in a nonpolar solvent gets nothing to pay for breaking up the crystal.'],
            ['sugar', 'water', 'Yes', 'Sugar has many O&ndash;H groups, so it hydrogen bonds with water.'],
            ['sugar', 'hexane', 'No', 'Polar sugar cannot form strong attractions with nonpolar hexane.'],
            ['$\\ce{I2}$', 'hexane', 'Yes', 'Both are nonpolar, with similar London forces.'],
            ['$\\ce{I2}$', 'water', 'No', 'Nonpolar iodine cannot pay for breaking hydrogen bonds. It only dissolves slightly.'],
            ['grease', 'hexane', 'Yes', 'Both are nonpolar hydrocarbons.'],
            ['grease', 'water', 'No', 'Nonpolar grease cannot break into the hydrogen-bonded water.'],
            ['ethanol', 'water', 'Yes', 'The O&ndash;H group hydrogen bonds with water.'],
            ['$\\ce{CCl4}$', 'water', 'No', 'The tetrahedral $\\ce{CCl4}$ is nonpolar.'],
          ]);
          return {
            q: `Will ${c[0]} dissolve well in ${c[1]}?`, choices: ['Yes', 'No'], answer: c[2] === 'Yes' ? 0 : 1,
            hint: 'Like dissolves like.', steps: [c[3]],
          };
        },
      },
    ],

    cards: [
      { front: 'What does "like dissolves like" mean?', back: 'Polar and ionic substances dissolve in polar solvents. Nonpolar substances dissolve in nonpolar solvents.' },
      { front: 'State the three steps of dissolving.', back: 'Separate the solute (costs energy), separate the solvent (costs energy), mix them (pays energy).' },
      { front: "What is Henry's law?", back: '$C = k_H P$. Gas solubility is proportional to the partial pressure of that gas.' },
      { front: 'How does temperature change solubility?', back: 'Most solids dissolve more when hot. Gases dissolve less when hot.' },
      { front: 'Saturated versus supersaturated?', back: 'Saturated holds the maximum at equilibrium. Supersaturated holds extra, and it crashes out when seeded.' },
      { front: 'What is molality?', back: 'Moles of solute per kilogram of solvent.' },
      { front: 'What are colligative properties?', back: 'Properties that depend on the number of solute particles, not their identity.' },
      { front: 'What is the van \'t Hoff factor?', back: 'The number of particles each formula unit forms in solution: 1 for sugar, 2 for NaCl, 3 for $\\ce{CaCl2}$.' },
      { front: 'What are the formulas for $\\Delta T_f$ and $\\Delta T_b$?', back: '$\\Delta T_f = iK_fm$ and $\\Delta T_b = iK_bm$. For water, $K_f = 1.86$ and $K_b = 0.512\\ ^\\circ\\text{C}/m$.' },
      { front: "What is Raoult's law?", back: '$P_\\text{solution} = \\chi_\\text{solvent} P^\\circ_\\text{solvent}$.' },
      { front: 'What is the formula for osmotic pressure?', back: '$\\Pi = iMRT$' },
      { front: 'Which way does water move in osmosis?', back: 'Toward the side with more solute.' },
    ],

    terms: [
      { term: 'Miscible', def: 'Able to mix in all proportions, like ethanol and water.' },
      { term: 'Immiscible', def: 'Unable to mix, forming separate layers, like oil and water.' },
      { term: 'Enthalpy of solution', def: 'The heat absorbed or released as a solute dissolves.' },
      { term: 'Saturated', def: 'Holding the maximum amount of solute at equilibrium at that temperature.' },
      { term: 'Unsaturated', def: 'Holding less solute than it could at that temperature.' },
      { term: 'Supersaturated', def: 'Holding more solute than is stable. A seed crystal makes the extra come out.' },
      { term: "Henry's law", def: 'The solubility of a gas is proportional to its partial pressure above the liquid.' },
      { term: 'Molality', def: 'Moles of solute per kilogram of solvent. Symbol: m.' },
      { term: 'Mole fraction', def: 'Moles of one component divided by the total moles. Symbol: $\\chi$.' },
      { term: 'Mass percent', def: 'Grams of solute per 100 g of solution.' },
      { term: 'Parts per million', def: 'Grams of solute per million grams of solution. Symbol: ppm.' },
      { term: 'Colligative property', def: 'A property that depends only on the number of solute particles.' },
      { term: 'Van \'t Hoff factor', def: 'The number of particles per formula unit in solution. Symbol: $i$.' },
      { term: "Raoult's law", def: 'The vapor pressure of a solvent equals its mole fraction times its pure vapor pressure.' },
      { term: 'Freezing point depression', def: 'The lowering of a solvent\'s freezing point by dissolved particles.' },
      { term: 'Boiling point elevation', def: 'The raising of a solvent\'s boiling point by dissolved particles.' },
      { term: 'Osmosis', def: 'The net movement of solvent through a semipermeable membrane, toward higher solute concentration.' },
      { term: 'Osmotic pressure', def: 'The pressure needed to stop osmosis. Symbol: $\\Pi$.' },
      { term: 'Semipermeable membrane', def: 'A barrier that lets solvent molecules through but blocks solute particles.' },
      { term: 'Hypotonic', def: 'Having less solute than the fluid inside a cell. Water enters the cell.' },
      { term: 'Hypertonic', def: 'Having more solute than the fluid inside a cell. Water leaves the cell.' },
      { term: 'Isotonic', def: 'Having the same osmotic pressure as the fluid inside a cell. There is no net water flow.' },
    ],
  });
})();
