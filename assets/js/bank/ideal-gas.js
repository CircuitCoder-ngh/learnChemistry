/* Question bank for 9.2 The ideal gas law. */
(function () {
  const R = 0.08206;
  const r3 = (x) => Lab.sig(x, 3).replace(/ × 10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (m, e) => ` \\times 10^{${e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '-0123456789'['⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)])}}`);
  const VAPOR = { 15: 12.8, 18: 15.5, 20: 17.5, 22: 19.8, 24: 22.4, 25: 23.8, 26: 25.2, 28: 28.3, 30: 31.8, 35: 42.2 };
  Bank.add('ideal-gas', {
    quiz: [
      {
        q: 'In $PV = nRT$ with $R = 0.08206$ L atm/(mol K), what units must $T$ use?',
        options: ['Degrees Celsius', 'Degrees Fahrenheit', 'Kelvin', 'Any temperature unit'],
        answer: 2,
        why: 'The gas law scales with absolute temperature. Celsius can be zero or negative, which would make the volume zero or negative.',
      },
      {
        q: 'At the same temperature and pressure, 1 mol of $\\ce{H2}$ and 1 mol of $\\ce{CO2}$ have:',
        options: ['The same volume and the same mass', 'The same volume but different masses', 'Different volumes but the same mass', 'Different volumes and different masses'],
        answer: 1,
        why: 'Equal moles of ideal gases fill equal volumes at the same $T$ and $P$. But a mole of $\\ce{CO2}$ weighs 44.01 g, while a mole of $\\ce{H2}$ weighs 2.02 g.',
      },
      {
        q: 'What does STP mean in most general chemistry courses?',
        options: ['0 °C and 1 atm', '25 °C and 1 atm', '0 K and 1 atm', '25 °C and 1 bar'],
        answer: 0,
        why: 'STP is 0 °C (273.15 K) and 1 atm, where 1 mol of ideal gas fills 22.4 L. The newer IUPAC version uses 1 bar, which gives 22.7 L.',
      },
      {
        q: 'Which gas has the greatest density at 25 °C and 1 atm?',
        options: ['$\\ce{He}$', '$\\ce{CH4}$', '$\\ce{N2}$', '$\\ce{CO2}$'],
        answer: 3,
        why: '$d = PM/RT$. With the same $P$ and $T$, density follows molar mass. $\\ce{CO2}$ is heaviest, at 44.01 g/mol.',
      },
      {
        q: 'A sealed tank holds $\\ce{N2}$ at 2 atm. Adding $\\ce{He}$ at constant volume and temperature raises the total to 5 atm. What is the partial pressure of $\\ce{N2}$ now?',
        options: ['2 atm', '3 atm', '5 atm', '7 atm'],
        answer: 0,
        why: 'Each gas behaves as if it were alone. The $\\ce{N2}$ has the same moles, volume and temperature as before, so its partial pressure is still 2 atm.',
      },
      {
        q: 'A gas is collected over water at 25 °C and a total pressure of 750 torr. The pressure of the dry gas is:',
        options: ['Exactly 750 torr', 'Less than 750 torr', 'More than 750 torr', 'Zero, since water absorbs it'],
        answer: 1,
        why: 'The total includes water vapor. Dalton\'s law says $P_\\text{gas} = 750 - P_{\\ce{H2O}}$, and the water vapor pressure at 25 °C is 23.8 torr.',
      },
      {
        q: 'A balloon is heated at constant pressure. What happens to the density of the gas inside?',
        options: ['It rises', 'It falls', 'It stays the same', 'It falls to zero'],
        answer: 1,
        why: '$d = PM/RT$, so higher $T$ means lower density. The same mass spreads through a larger volume. That is why hot air balloons rise.',
      },
      {
        q: 'In a gas mixture, the mole fraction of oxygen is 0.25 and the total pressure is 2.0 atm. What is the partial pressure of oxygen?',
        options: ['0.13 atm', '0.25 atm', '0.50 atm', '8.0 atm'],
        answer: 2,
        why: '$P_{\\ce{O2}} = X_{\\ce{O2}} P_\\text{total} = (0.25)(2.0\\text{ atm}) = 0.50$ atm.',
      },
    ],

    gens: [
      {
        id: 'pvnrt-p',
        title: 'Ideal gas: find P',
        make(r) {
          const n = r.num(0.1, 3, 2), V = r.num(1, 30, 1), c = r.int(-20, 120);
          const T = c + 273.15, P = (n * R * T) / V;
          return {
            q: `What pressure, in atm, does ${n} mol of gas exert in a ${V} L container at ${c} °C?`,
            answer: P, unit: 'atm',
            hint: 'Convert to Kelvin, then $P = nRT/V$.',
            steps: [
              `Convert to Kelvin: $T = ${c} + 273.15 = ${T.toFixed(2)}$ K.`,
              'Divide both sides of $PV = nRT$ by $V$: $P = \\dfrac{nRT}{V}$.',
              `Put in the numbers: $P = \\dfrac{(${n}\\text{ mol})(0.08206\\text{ L atm/mol K})(${T.toFixed(2)}\\text{ K})}{${V}\\text{ L}} = ${r3(P)}\\text{ atm}$.`,
            ],
          };
        },
      },
      {
        id: 'pvnrt-v',
        title: 'Ideal gas: find V, with mmHg',
        make(r) {
          const n = r.num(0.05, 2, 2), mm = r.int(30, 170) * 5, c = r.int(0, 90);
          const P = mm / 760, T = c + 273.15, V = (n * R * T) / P;
          return {
            q: `What volume, in liters, does ${n} mol of gas occupy at ${mm} mmHg and ${c} °C?`,
            answer: V, unit: 'L',
            hint: 'Pressure to atm and temperature to Kelvin first. Then $V = nRT/P$.',
            steps: [
              `Pressure to atm: $${mm}\\text{ mmHg} \\times \\dfrac{1\\text{ atm}}{760\\text{ mmHg}} = ${P.toFixed(3)}\\text{ atm}$.`,
              `Temperature to Kelvin: $T = ${T.toFixed(2)}$ K.`,
              `Solve: $V = \\dfrac{nRT}{P} = \\dfrac{(${n})(0.08206)(${T.toFixed(2)})}{${P.toFixed(3)}} = ${r3(V)}\\text{ L}$.`,
            ],
          };
        },
      },
      {
        id: 'pvnrt-n',
        title: 'Ideal gas: find n, with mL',
        make(r) {
          const mL = r.int(50, 800) * 5, atm = r.num(0.6, 4, 2), c = r.int(5, 95);
          const V = mL / 1000, T = c + 273.15, n = (atm * V) / (R * T);
          return {
            q: `How many moles of gas are in ${mL} mL at ${atm} atm and ${c} °C?`,
            answer: n, unit: 'mol',
            hint: 'mL to L, °C to K, then $n = PV/RT$.',
            steps: [
              `Volume to liters: $${mL}\\text{ mL} = ${V}\\text{ L}$.`,
              `Temperature to Kelvin: $T = ${T.toFixed(2)}$ K.`,
              `Solve: $n = \\dfrac{PV}{RT} = \\dfrac{(${atm})(${V})}{(0.08206)(${T.toFixed(2)})} = ${r3(n)}\\text{ mol}$.`,
            ],
          };
        },
      },
      {
        id: 'pvnrt-t',
        title: 'Ideal gas: find T',
        make(r) {
          const n = r.num(0.2, 2.5, 2), V = r.num(2, 40, 1), P = r.num(0.5, 3.5, 2);
          const T = (P * V) / (n * R);
          return {
            q: `At what Kelvin temperature does ${n} mol of gas in ${V} L exert a pressure of ${P} atm?`,
            answer: T, unit: 'K',
            hint: 'Divide both sides of $PV = nRT$ by $nR$.',
            steps: [
              'Rearrange: $T = \\dfrac{PV}{nR}$.',
              `Put in the numbers: $T = \\dfrac{(${P}\\text{ atm})(${V}\\text{ L})}{(${n}\\text{ mol})(0.08206\\text{ L atm/mol K})} = ${r3(T)}\\text{ K}$.`,
            ],
          };
        },
      },
      {
        id: 'combined',
        title: 'Combined gas law',
        make(r) {
          const V1 = r.num(1, 15, 1), P1 = r.num(0.7, 2, 2), c1 = r.int(5, 35), P2 = r.num(0.4, 3, 2), c2 = r.int(-30, 120);
          const T1 = c1 + 273.15, T2 = c2 + 273.15, V2 = (V1 * P1 * T2) / (P2 * T1);
          return {
            q: `A gas occupies ${V1} L at ${P1} atm and ${c1} °C. What is its volume at ${P2} atm and ${c2} °C?`,
            answer: V2, unit: 'L', tol: 0.015,
            hint: 'Kelvin first. Then $V_2 = V_1 \\times \\frac{P_1}{P_2} \\times \\frac{T_2}{T_1}$.',
            steps: [
              `Convert: $T_1 = ${T1.toFixed(2)}$ K and $T_2 = ${T2.toFixed(2)}$ K.`,
              'Solve $\\dfrac{P_1V_1}{T_1} = \\dfrac{P_2V_2}{T_2}$ for $V_2$: $V_2 = V_1 \\times \\dfrac{P_1}{P_2} \\times \\dfrac{T_2}{T_1}$.',
              `Put in the numbers: $V_2 = ${V1}\\text{ L} \\times \\dfrac{${P1}\\text{ atm}}{${P2}\\text{ atm}} \\times \\dfrac{${T2.toFixed(2)}\\text{ K}}{${T1.toFixed(2)}\\text{ K}} = ${r3(V2)}\\text{ L}$.`,
            ],
          };
        },
      },
      {
        id: 'stp',
        title: 'STP and 22.4 L',
        make(r) {
          const [name, f] = r.pick([['nitrogen', 'N2'], ['oxygen', 'O2'], ['carbon dioxide', 'CO2'], ['methane', 'CH4'], ['ammonia', 'NH3'], ['argon', 'Ar']]);
          const M = Bank.molarMass(f), g = r.num(M * 0.1, M * 3, 1), n = g / M, V = n * 22.4;
          return {
            q: `What volume does ${g} g of ${name}, $\\ce{${f}}$, fill at STP (0 °C and 1 atm)?`,
            answer: V, unit: 'L',
            hint: 'Grams to moles, then 22.4 L per mole at STP.',
            steps: [
              `Grams to moles: $${g}\\text{ g} \\div ${M.toFixed(2)}\\text{ g/mol} = ${r3(n)}\\text{ mol}$.`,
              `Moles to liters at STP: $${r3(n)}\\text{ mol} \\times \\dfrac{22.4\\text{ L}}{1\\text{ mol}} = ${r3(V)}\\text{ L}$.`,
            ],
          };
        },
      },
      {
        id: 'density',
        title: 'Gas density',
        make(r) {
          const [name, f] = r.pick([['helium', 'He'], ['neon', 'Ne'], ['nitrogen', 'N2'], ['oxygen', 'O2'], ['argon', 'Ar'], ['carbon dioxide', 'CO2'], ['chlorine', 'Cl2'], ['methane', 'CH4']]);
          const M = Bank.molarMass(f), P = r.num(0.5, 3, 2), c = r.int(0, 150), T = c + 273.15, d = (P * M) / (R * T);
          return {
            q: `Find the density, in g/L, of ${name} ($\\ce{${f}}$) at ${P} atm and ${c} °C.`,
            answer: d, unit: 'g/L',
            hint: '$d = PM/RT$, with $T$ in Kelvin.',
            steps: [
              `Molar mass of $\\ce{${f}}$ is ${M.toFixed(2)} g/mol, and $T = ${T.toFixed(2)}$ K.`,
              `Use $d = \\dfrac{PM}{RT} = \\dfrac{(${P}\\text{ atm})(${M.toFixed(2)}\\text{ g/mol})}{(0.08206\\text{ L atm/mol K})(${T.toFixed(2)}\\text{ K})} = ${r3(d)}\\text{ g/L}$.`,
            ],
          };
        },
      },
      {
        id: 'molar-mass',
        title: 'Molar mass from gas data',
        make(r) {
          const M0 = r.pick([16.04, 28.02, 32.0, 44.01, 64.07, 70.9, 58.12, 30.07]);
          const P = r.num(0.7, 1.5, 2), c = r.int(10, 80), T = c + 273.15, V = r.num(0.25, 1.5, 2);
          const n = (P * V) / (R * T), m = +(n * M0).toFixed(3), M = (m * R * T) / (P * V);
          return {
            q: `A ${V} L flask holds ${m} g of an unknown gas at ${P} atm and ${c} °C. What is its molar mass?`,
            answer: M, unit: 'g/mol', tol: 0.02,
            hint: 'Find moles with $PV = nRT$, then molar mass is grams over moles.',
            steps: [
              `Convert to Kelvin: $T = ${T.toFixed(2)}$ K.`,
              `Moles: $n = \\dfrac{PV}{RT} = \\dfrac{(${P})(${V})}{(0.08206)(${T.toFixed(2)})} = ${r3((P * V) / (R * T))}\\text{ mol}$.`,
              `Molar mass: $M = \\dfrac{${m}\\text{ g}}{${r3((P * V) / (R * T))}\\text{ mol}} = ${r3(M)}\\text{ g/mol}$.`,
            ],
          };
        },
      },
      {
        id: 'stoich',
        title: 'Gas stoichiometry',
        make(r) {
          const kind = r.pick(['azide', 'chlorate', 'zinc']);
          const c = r.int(15, 40), T = c + 273.15, P = r.num(0.85, 1.3, 2);
          if (kind === 'azide') {
            const g = r.num(20, 150, 1), n = g / 65.01, nG = (n * 3) / 2, V = (nG * R * T) / P;
            return {
              q: `How many liters of $\\ce{N2}$ form at ${P} atm and ${c} °C when ${g} g of $\\ce{NaN3}$ decomposes? $\\ce{2NaN3(s) -> 2Na(s) + 3N2(g)}$`,
              answer: V, unit: 'L',
              hint: 'Grams to moles of $\\ce{NaN3}$, the 3:2 mole ratio, then $V = nRT/P$.',
              steps: [
                `Grams to moles: $${g} \\div 65.01 = ${r3(n)}$ mol $\\ce{NaN3}$.`,
                `Mole ratio: $${r3(n)}\\text{ mol }\\ce{NaN3} \\times \\dfrac{3\\text{ mol }\\ce{N2}}{2\\text{ mol }\\ce{NaN3}} = ${r3(nG)}\\text{ mol }\\ce{N2}$.`,
                `Gas law, with $T = ${T.toFixed(2)}$ K: $V = \\dfrac{(${r3(nG)})(0.08206)(${T.toFixed(2)})}{${P}} = ${r3(V)}\\text{ L}$.`,
              ],
            };
          }
          if (kind === 'chlorate') {
            const g = r.num(2, 30, 2), M = Bank.molarMass('KClO3'), n = g / M, nG = (n * 3) / 2, V = (nG * R * T) / P;
            return {
              q: `How many liters of $\\ce{O2}$ form at ${P} atm and ${c} °C when ${g} g of $\\ce{KClO3}$ decomposes? $\\ce{2KClO3(s) -> 2KCl(s) + 3O2(g)}$`,
              answer: V, unit: 'L',
              hint: 'Grams to moles of $\\ce{KClO3}$, the 3:2 mole ratio, then $V = nRT/P$.',
              steps: [
                `Grams to moles: $${g} \\div ${M.toFixed(2)} = ${r3(n)}$ mol $\\ce{KClO3}$.`,
                `Mole ratio: $${r3(n)}\\text{ mol KClO}_3 \\times \\dfrac{3\\text{ mol O}_2}{2\\text{ mol KClO}_3} = ${r3(nG)}\\text{ mol O}_2$.`,
                `Gas law, with $T = ${T.toFixed(2)}$ K: $V = \\dfrac{(${r3(nG)})(0.08206)(${T.toFixed(2)})}{${P}} = ${r3(V)}\\text{ L}$.`,
              ],
            };
          }
          const V = r.num(0.1, 3, 2), nH = (P * V) / (R * T), M = 65.38, g = nH * M;
          return {
            q: `What mass of zinc is needed to make ${V} L of $\\ce{H2}$ at ${P} atm and ${c} °C? $\\ce{Zn(s) + 2HCl(aq) -> ZnCl2(aq) + H2(g)}$`,
            answer: g, unit: 'g',
            hint: 'Gas data to moles of $\\ce{H2}$, then the 1:1 ratio, then the molar mass of Zn.',
            steps: [
              `Moles of $\\ce{H2}$, with $T = ${T.toFixed(2)}$ K: $n = \\dfrac{(${P})(${V})}{(0.08206)(${T.toFixed(2)})} = ${r3(nH)}\\text{ mol}$.`,
              `The ratio is 1:1, so moles of Zn is also ${r3(nH)} mol.`,
              `Moles to grams: $${r3(nH)}\\text{ mol} \\times 65.38\\text{ g/mol} = ${r3(g)}\\text{ g}$.`,
            ],
          };
        },
      },
      {
        id: 'dalton',
        title: "Dalton's law",
        make(r) {
          const a = r.num(0.2, 3, 2), b = r.num(0.2, 3, 2), Pt = r.num(1, 8, 2);
          const [A, B] = r.pick([['N2', 'O2'], ['He', 'Ne'], ['CO2', 'N2'], ['H2', 'Ar']]);
          const X = b / (a + b), Pb = X * Pt;
          return {
            q: `A tank holds ${a} mol of $\\ce{${A}}$ and ${b} mol of $\\ce{${B}}$ at a total pressure of ${Pt} atm. Find the partial pressure of $\\ce{${B}}$.`,
            answer: Pb, unit: 'atm',
            hint: 'Find the mole fraction first. Then $P_i = X_i P_\\text{total}$.',
            steps: [
              `Total moles: $${a} + ${b} = ${(a + b).toFixed(2)}$ mol.`,
              `Mole fraction: $X = \\dfrac{${b}}{${(a + b).toFixed(2)}} = ${X.toFixed(3)}$.`,
              `Partial pressure: $P = (${X.toFixed(3)})(${Pt}\\text{ atm}) = ${r3(Pb)}\\text{ atm}$.`,
            ],
          };
        },
      },
      {
        id: 'over-water',
        title: 'Gas collected over water',
        make(r) {
          const c = +r.pick(Object.keys(VAPOR)), Pw = VAPOR[c], Ptot = r.int(735, 775), mL = r.int(10, 80) * 5;
          const PH2 = Ptot - Pw, atm = PH2 / 760, V = mL / 1000, T = c + 273.15, n = (atm * V) / (R * T);
          return {
            q: `Hydrogen collected over water at ${c} °C fills ${mL} mL at a total pressure of ${Ptot} torr. The vapor pressure of water at ${c} °C is ${Pw} torr. How many moles of $\\ce{H2}$ were collected?`,
            answer: n, unit: 'mol',
            hint: 'Subtract the water vapor first. Then pressure to atm, mL to L, °C to K, and $n = PV/RT$.',
            steps: [
              `Remove the water vapor: $P_{\\ce{H2}} = ${Ptot} - ${Pw} = ${PH2.toFixed(1)}\\text{ torr}$.`,
              `To atm: $${PH2.toFixed(1)} \\div 760 = ${atm.toFixed(4)}\\text{ atm}$. Also $V = ${V}\\text{ L}$ and $T = ${T.toFixed(2)}\\text{ K}$.`,
              `Gas law: $n = \\dfrac{(${atm.toFixed(4)})(${V})}{(0.08206)(${T.toFixed(2)})} = ${r3(n)}\\text{ mol}$.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What is the ideal gas law?', back: '$PV = nRT$.' },
      { front: 'What are the two common values of $R$?', back: '$0.08206$ L atm/(mol K) and $8.314$ J/(mol K).' },
      { front: 'What is the combined gas law?', back: '$\\dfrac{P_1V_1}{T_1} = \\dfrac{P_2V_2}{T_2}$, for a fixed amount of gas.' },
      { front: 'What are STP conditions, and the molar volume there?', back: '0 °C and 1 atm, where 1 mol of ideal gas fills 22.4 L. With the newer 1 bar standard it is 22.7 L.' },
      { front: 'How do you find gas density?', back: '$d = \\dfrac{PM}{RT}$.' },
      { front: 'How do you find molar mass from gas data?', back: '$M = \\dfrac{dRT}{P}$, or find moles with $PV = nRT$ and divide grams by moles.' },
      { front: "State Dalton's law.", back: 'The total pressure of a gas mixture is the sum of the partial pressures: $P_\\text{total} = P_1 + P_2 + \\dots$' },
      { front: 'What is a mole fraction?', back: 'Moles of one gas divided by total moles: $X_i = n_i/n_\\text{total}$. It has no unit. $P_i = X_i P_\\text{total}$.' },
      { front: 'How do you handle a gas collected over water?', back: 'Subtract the vapor pressure of water: $P_\\text{gas} = P_\\text{total} - P_{\\ce{H2O}}$.' },
    ],

    terms: [
      { term: 'Ideal gas law', def: 'The equation $PV = nRT$, which links pressure, volume, moles and Kelvin temperature.' },
      { term: 'Gas constant', def: 'The constant $R$ in the ideal gas law: $0.08206$ L atm/(mol K), or $8.314$ J/(mol K).' },
      { term: 'Combined gas law', def: 'For a fixed amount of gas, $P_1V_1/T_1 = P_2V_2/T_2$.' },
      { term: 'STP', def: 'Standard temperature and pressure: 0 °C and 1 atm in most general chemistry courses. IUPAC now uses 0 °C and 1 bar.' },
      { term: 'Molar volume', def: 'The volume of one mole of gas: 22.4 L at 0 °C and 1 atm for an ideal gas.' },
      { term: 'Partial pressure', def: 'The pressure one gas in a mixture would exert if it were alone in the same container.' },
      { term: "Dalton's law", def: 'The total pressure of a gas mixture equals the sum of the partial pressures of its gases.' },
      { term: 'Mole fraction', def: 'The moles of one substance divided by the total moles in the mixture. Symbol: $X$.' },
      { term: 'Vapor pressure of water', def: 'The pressure of water vapor above liquid water at a given temperature, such as 23.8 torr at 25 °C.' },
    ],
  });
})();
