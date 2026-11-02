/* Question bank for 10.2 Phase changes. All water numbers match the lesson. */
(function () {
  'use strict';
  const CICE = 2.09, CW = 4.18, CST = 2.0, HF = 334, HV = 2260;
  const degC = (n) => `$${n}\\ ^\\circ\\text{C}$`;
  const j = (x) => Lab.sig(x, 3);
  const cancelG = '\\cancel{\\text{g}}';
  /** A line like 25.0 g × 2.09 J/(g °C) × 10 °C = 523 J */
  const warmTex = (m, c, dT) => `$${m}\\ ${cancelG} \\times ${c}\\ \\dfrac{\\text{J}}{${cancelG}\\ \\cancel{^\\circ\\text{C}}} \\times ${dT}\\ \\cancel{^\\circ\\text{C}} = ${j(m * c * dT)}\\text{ J}$`;
  const phaseTex = (m, H) => `$${m}\\ ${cancelG} \\times ${H}\\ \\dfrac{\\text{J}}{${cancelG}} = ${j(m * H)}\\text{ J}$`;

  const LIQ = [
    { name: 'water', bp: 100, dH: 40.7 },
    { name: 'ethanol', bp: 78.4, dH: 38.6 },
    { name: 'benzene', bp: 80.1, dH: 30.7 },
    { name: 'diethyl ether', bp: 34.6, dH: 26.5 },
    { name: 'acetone', bp: 56.1, dH: 29.1 },
  ];

  const READS = [
    ['water', 25, '1', 'Liquid', 'At 1 atm, water is liquid between $0\\ ^\\circ\\text{C}$ and $100\\ ^\\circ\\text{C}$.'],
    ['water', -10, '1', 'Solid', 'At 1 atm, water freezes below $0\\ ^\\circ\\text{C}$.'],
    ['water', 120, '1', 'Gas', 'At 1 atm, water boils at $100\\ ^\\circ\\text{C}$, so it is gas above that.'],
    ['water', 50, '0.01', 'Gas', 'Vapor pressure of water at $50\\ ^\\circ\\text{C}$ is about 0.12 atm. The pressure here is lower than that, so it is gas.'],
    ['water', -10, '0.001', 'Gas', 'The pressure is below the triple point pressure of 0.006 atm and below the line for ice at this temperature, so it is gas. This is how freeze-drying works.'],
    ['water', 400, '300', 'Supercritical fluid', 'Both $400\\ ^\\circ\\text{C}$ and 300 atm are above the critical point of $374\\ ^\\circ\\text{C}$ and 218 atm.'],
    ['water', -1, '300', 'Liquid', 'Water\'s solid-liquid line leans backward. At 300 atm, ice melts a little below $0\\ ^\\circ\\text{C}$, so this is liquid.'],
    ['carbon dioxide', 25, '1', 'Gas', 'At 1 atm you are below the triple point pressure of 5.1 atm. $\\ce{CO2}$ at room temperature is a gas.'],
    ['carbon dioxide', -90, '1', 'Solid', 'At 1 atm, $\\ce{CO2}$ is solid below its sublimation temperature of $-78.5\\ ^\\circ\\text{C}$. This is dry ice.'],
    ['carbon dioxide', 20, '65', 'Liquid', 'Its vapor pressure at $20\\ ^\\circ\\text{C}$ is about 57 atm. This pressure is higher, and the temperature is below critical, so it is liquid.'],
    ['carbon dioxide', -40, '20', 'Liquid', 'Above the triple point, between the solid-liquid line and the liquid-gas line.'],
    ['carbon dioxide', 50, '100', 'Supercritical fluid', 'Both values are above the critical point of $31\\ ^\\circ\\text{C}$ and 73 atm.'],
    ['carbon dioxide', -70, '1', 'Gas', 'Above $-78.5\\ ^\\circ\\text{C}$ at 1 atm, solid $\\ce{CO2}$ has sublimed.'],
    ['carbon dioxide', -70, '10', 'Solid', 'This is colder than the triple point at $-56.6\\ ^\\circ\\text{C}$ and well above the sublimation line, so it is solid.'],
  ];

  Bank.add('phases', {
    quiz: [
      {
        q: 'You keep heating a mixture of ice and water, and the thermometer stays at $0\\ ^\\circ\\text{C}$. Where is the heat going?',
        options: ['It is lost to the air', 'Into pulling molecules out of the crystal, overcoming the forces between them', 'Into making molecules move faster', 'Into breaking $\\ce{O-H}$ bonds'],
        answer: 1,
        why: 'During a phase change, the heat goes into potential energy: separating molecules from their neighbors. Average kinetic energy, and so temperature, stays the same.',
      },
      {
        q: 'For the same mass of water, which takes the most heat?',
        options: ['Warming the liquid from $0\\ ^\\circ\\text{C}$ to $100\\ ^\\circ\\text{C}$', 'Melting it', 'Boiling it', 'They are all the same'],
        answer: 2,
        why: 'Per gram: warming costs 418 J, melting costs 334 J, and boiling costs 2260 J. Boiling frees every molecule from all its neighbors.',
      },
      {
        q: 'On a heating curve with constant heat input, why is the liquid water slope less steep than the ice slope?',
        options: ['Liquid water has a higher specific heat, so the same heat gives a smaller temperature rise', 'Ice is less dense', 'Ice has stronger bonds', 'The burner weakens over time'],
        answer: 0,
        why: 'Since $\\Delta T = q/(mc)$, a larger $c$ gives a smaller rise. Water at 4.18 J/(g °C) is about twice ice at 2.09.',
      },
      {
        q: 'A liquid boils when:',
        options: ['It reaches $100\\ ^\\circ\\text{C}$', 'Its vapor pressure equals the pressure above it', 'All of its molecules have the same speed', 'Bonds inside its molecules break'],
        answer: 1,
        why: 'Only then can bubbles of vapor survive inside the liquid against the outside pressure. Water boils at $100\\ ^\\circ\\text{C}$ only at 1 atm.',
      },
      {
        q: 'Liquid A has a vapor pressure of 400 torr at $20\\ ^\\circ\\text{C}$, and liquid B has 20 torr. Which statement is true?',
        options: ['A has weaker intermolecular forces and a lower boiling point', 'A has stronger intermolecular forces and a higher boiling point', 'B will evaporate faster', 'They have the same boiling point'],
        answer: 0,
        why: 'Molecules escape A easily, so its forces are weak. It reaches 760 torr at a lower temperature, so it boils lower.',
      },
      {
        q: 'You double the amount of liquid water in a sealed flask at $25\\ ^\\circ\\text{C}$. What happens to its vapor pressure once it settles?',
        options: ['It doubles', 'It halves', 'It stays the same', 'It falls to zero'],
        answer: 2,
        why: 'Vapor pressure depends on the substance and the temperature only, as long as some liquid remains.',
      },
      {
        q: 'Why does pasta take longer to cook on a high mountain?',
        options: ['Water boils at a higher temperature there', 'Water boils at a lower temperature there, so the pasta sits in cooler water', 'There is less oxygen for the flame, so water cannot boil', 'Water boils faster there'],
        answer: 1,
        why: 'Lower air pressure means vapor pressure catches up at a lower temperature. On Everest, water boils near $72\\ ^\\circ\\text{C}$.',
      },
      {
        q: 'What is the triple point?',
        options: ['The one temperature and pressure where solid, liquid and gas all coexist', 'The temperature where a substance has three boiling points', 'The highest temperature a liquid can reach', 'The point where the three lines are all horizontal'],
        answer: 0,
        why: 'The three lines meet there. For water, that is $0.01\\ ^\\circ\\text{C}$ and 0.006 atm.',
      },
      {
        q: 'Above the critical point, a substance is:',
        options: ['A solid', 'Definitely a liquid', 'A supercritical fluid, with no distinct liquid and gas', 'Decomposed into atoms'],
        answer: 2,
        why: 'The liquid-gas line ends at the critical point. Past it, no amount of squeezing gives a separate liquid.',
      },
      {
        q: 'Why does the solid-liquid line on water\'s phase diagram lean backward?',
        options: ['Because ice is less dense than liquid water, so pressure favors the liquid', 'Because water has a high boiling point', 'Because ice is denser than liquid water', 'Because water has a low critical point'],
        answer: 0,
        why: 'Squeezing favors whichever phase takes less room. For water, that is the liquid, so raising the pressure lowers the melting point.',
      },
      {
        q: 'Why does dry ice not melt into a puddle at 1 atm?',
        options: ['It is too cold', '1 atm is below the triple point pressure of $\\ce{CO2}$, 5.1 atm, so no liquid can exist', '$\\ce{CO2}$ has no liquid phase at any pressure', 'It has hydrogen bonds'],
        answer: 1,
        why: 'Below the triple point pressure, there is no liquid region on the map. The solid goes straight to gas: sublimation.',
      },
      {
        q: 'Why can a steam burn at $100\\ ^\\circ\\text{C}$ be worse than a burn from water at $100\\ ^\\circ\\text{C}$?',
        options: ['Steam is hotter than $100\\ ^\\circ\\text{C}$ by definition', 'Condensing on the skin releases 2260 J/g before the water even starts to cool', 'Steam contains acid', 'Steam has a higher specific heat'],
        answer: 1,
        why: 'Steam dumps its whole heat of vaporization on your skin as it condenses, on top of what the hot water would release while cooling.',
      },
    ],

    gens: [
      {
        id: 'warm',
        title: 'Heat for a slope',
        make(r) {
          const k = r.pick([
            { name: 'ice', c: CICE, lo: -40, hi: -2 },
            { name: 'liquid water', c: CW, lo: 2, hi: 98 },
            { name: 'steam', c: CST, lo: 102, hi: 160 },
          ]);
          const m = r.num(5, 150, 1);
          let a = r.int(k.lo, k.hi), b = r.int(k.lo, k.hi);
          if (a === b) b = a + (a + 1 <= k.hi ? 1 : -1);
          const heat = b > a;
          const dT = Math.abs(b - a);
          const q = m * k.c * dT;
          return {
            q: `How many joules of heat are ${heat ? 'needed to warm' : 'released when you cool'} ${m} g of ${k.name} from ${degC(a)} to ${degC(b)}? Use $c = ${k.c}$ J/(g °C). Give a positive number.`,
            answer: q, unit: 'J',
            hint: 'One phase, so use $q = mc\\Delta T$.',
            steps: [
              `One phase with no phase change, so use $q = mc\\Delta T$. The temperature changes by $\\Delta T = ${dT}\\ ^\\circ\\text{C}$.`,
              warmTex(m, k.c, dT) + '.',
            ],
          };
        },
      },
      {
        id: 'flat',
        title: 'Heat for a flat part',
        make(r) {
          const useMol = r.next() < 0.5;
          const boil = r.next() < 0.5;
          const g = r.num(5, 150, 1);
          const M = Bank.molarMass('H2O');
          if (useMol) {
            const dH = boil ? 40.7 : 6.01, n = g / M, q = n * dH;
            return {
              q: `How many kJ of heat are needed to ${boil ? 'boil' : 'melt'} ${g} g of water at ${degC(boil ? 100 : 0)}? Use $\\Delta H_\\text{${boil ? 'vap' : 'fus'}} = ${dH}$ kJ/mol.`,
              answer: q, unit: 'kJ',
              hint: 'The value is per mole, so change grams to moles first.',
              steps: [
                `The temperature stays constant during a phase change, so use $q = n\\Delta H$.`,
                `Moles: $${g} \\div ${M.toFixed(2)} = ${Lab.sig(n, 3)}$ mol.`,
                `$q = ${Lab.sig(n, 3)}\\text{ mol} \\times ${dH}\\text{ kJ/mol} = ${Lab.sig(q, 3)}\\text{ kJ}$.`,
              ],
            };
          }
          const H = boil ? HV : HF, q = g * H;
          return {
            q: `How many joules of heat are needed to ${boil ? 'boil' : 'melt'} ${g} g of water at ${degC(boil ? 100 : 0)}? Use $\\Delta H_\\text{${boil ? 'vap' : 'fus'}} = ${H}$ J/g.`,
            answer: q, unit: 'J',
            hint: 'The value is per gram, so multiply by the mass.',
            steps: [`The temperature stays constant during a phase change, so use $q = m\\Delta H$.`, phaseTex(g, H) + '.'],
          };
        },
      },
      {
        id: 'ice-to-water',
        title: 'Ice to warm water',
        make(r) {
          const m = r.num(10, 100, 1), a = -r.int(5, 30), b = r.int(10, 90);
          const q1 = m * CICE * -a, q2 = m * HF, q3 = m * CW * b, q = q1 + q2 + q3;
          return {
            q: `How many kJ of heat are needed to turn ${m} g of ice at ${degC(a)} into liquid water at ${degC(b)}? Use $c_\\text{ice} = ${CICE}$, $c_\\text{water} = ${CW}$ J/(g °C) and $\\Delta H_\\text{fus} = ${HF}$ J/g.`,
            answer: q / 1000, unit: 'kJ', tol: 0.02,
            hint: 'Three pieces: warm the ice, melt it, warm the water.',
            steps: [
              `Warm the ice to $0\\ ^\\circ\\text{C}$: ${warmTex(m, CICE, -a)}.`,
              `Melt it: ${phaseTex(m, HF)}.`,
              `Warm the water: ${warmTex(m, CW, b)}.`,
              `Add them up and change to kJ: $${j(q1)} + ${j(q2)} + ${j(q3)} = ${Lab.sig(q, 3)}\\text{ J} = ${Lab.sig(q / 1000, 3)}\\text{ kJ}$.`,
            ],
          };
        },
      },
      {
        id: 'ice-to-steam',
        title: 'Full trip: ice to steam',
        make(r) {
          const m = r.num(5, 60, 1), a = -r.int(5, 30), b = r.int(105, 140);
          const parts = [m * CICE * -a, m * HF, m * CW * 100, m * HV, m * CST * (b - 100)];
          const q = parts.reduce((s, x) => s + x, 0);
          return {
            q: `Exam style: how many kJ of heat turn ${m} g of ice at ${degC(a)} into steam at ${degC(b)}? Use $c$ = ${CICE} (ice), ${CW} (water), ${CST} (steam) J/(g °C), $\\Delta H_\\text{fus} = ${HF}$ J/g and $\\Delta H_\\text{vap} = ${HV}$ J/g.`,
            answer: q / 1000, unit: 'kJ', tol: 0.02,
            hint: 'Five pieces, cut at $0\\ ^\\circ\\text{C}$ and $100\\ ^\\circ\\text{C}$.',
            steps: [
              `Warm the ice: ${warmTex(m, CICE, -a)}.`,
              `Melt: ${phaseTex(m, HF)}.`,
              `Warm the water: ${warmTex(m, CW, 100)}.`,
              `Boil: ${phaseTex(m, HV)}.`,
              `Warm the steam: ${warmTex(m, CST, b - 100)}.`,
              `The total is $${Lab.sig(q, 3)}\\text{ J} = ${Lab.sig(q / 1000, 3)}\\text{ kJ}$. Boiling is ${Math.round((100 * m * HV) / q)}% of it.`,
            ],
          };
        },
      },
      {
        id: 'how-much-melts',
        title: 'How much melts?',
        make(r) {
          const boil = r.next() < 0.5;
          const H = boil ? HV : HF;
          const kJ = boil ? r.num(5, 90, 1) : r.num(1, 25, 1);
          const g = (kJ * 1000) / H;
          return {
            q: `You add ${kJ} kJ of heat to plenty of ${boil ? 'water at $100\\ ^\\circ\\text{C}$' : 'ice at $0\\ ^\\circ\\text{C}$'}. How many grams ${boil ? 'boil away' : 'melt'}? Use $\\Delta H_\\text{${boil ? 'vap' : 'fus'}} = ${H}$ J/g.`,
            answer: g, unit: 'g',
            hint: 'Rearrange $q = m\\Delta H$ to $m = q/\\Delta H$. Watch kJ against J.',
            steps: [
              `Change to joules: $${kJ}\\text{ kJ} = ${Math.round(kJ * 1000)}\\text{ J}$.`,
              `Rearrange: $m = \\dfrac{q}{\\Delta H} = \\dfrac{${Math.round(kJ * 1000)}\\text{ J}}{${H}\\text{ J/g}} = ${Lab.sig(g, 3)}\\text{ g}$.`,
            ],
          };
        },
      },
      {
        id: 'clausius',
        title: 'Clausius-Clapeyron',
        make(r) {
          const L = r.pick(LIQ);
          const T2c = Math.round(L.bp) - r.int(10, 30);
          const T1 = L.bp + 273.15, T2 = T2c + 273.15;
          const bracket = 1 / T2 - 1 / T1;
          const exp = -(L.dH * 1000 / 8.314) * bracket;
          const P2 = 760 * Math.exp(exp);
          return {
            q: `The normal boiling point of ${L.name} is ${degC(L.bp)}, and $\\Delta H_\\text{vap} = ${L.dH}$ kJ/mol. Estimate its vapor pressure in torr at ${degC(T2c)}.`,
            answer: P2, unit: 'torr', tol: 0.03,
            hint: 'At the normal boiling point the vapor pressure is 760 torr. Use kelvin and joules, with $R = 8.314$.',
            steps: [
              `At the normal boiling point $P_1 = 760$ torr. In kelvin, $T_1 = ${T1.toFixed(2)}$ K and $T_2 = ${T2.toFixed(2)}$ K.`,
              `Bracket: $\\dfrac{1}{T_2} - \\dfrac{1}{T_1} = ${bracket.toFixed(6)}\\text{ K}^{-1}$.`,
              `$\\ln\\dfrac{P_2}{760} = -\\dfrac{${Math.round(L.dH * 1000)}}{8.314} \\times ${bracket.toFixed(6)} = ${exp.toFixed(3)}$.`,
              `$P_2 = 760 \\times e^{${exp.toFixed(3)}} = ${Lab.sig(P2, 3)}$ torr.`,
            ],
          };
        },
      },
      {
        id: 'read-map',
        title: 'Read the phase diagram',
        make(r) {
          const [sub, T, P, a, why] = r.pick(READS);
          const opts = r.mc(a, ['Solid', 'Liquid', 'Gas', 'Supercritical fluid'].filter((x) => x !== a));
          return {
            q: `Use the triple point and critical point you know (water: $0.01\\ ^\\circ\\text{C}$, 0.006 atm and $374\\ ^\\circ\\text{C}$, 218 atm; $\\ce{CO2}$: $-56.6\\ ^\\circ\\text{C}$, 5.1 atm and $31\\ ^\\circ\\text{C}$, 73 atm). What phase is ${sub} at ${degC(T)} and ${P} atm?`,
            choices: opts.choices, answer: opts.answer,
            hint: 'Picture the map. First compare with the triple point and the critical point.',
            steps: [why, `So it is <b>${a.toLowerCase()}</b>.`],
          };
        },
      },
      {
        id: 'vp-reason',
        title: 'Vapor pressure reasoning',
        make(r) {
          const c = r.pick([
            { q: 'A flask holds liquid and vapor at equilibrium. Raising the temperature makes the vapor pressure:', a: 'Increase', w: ['Decrease', 'Stay the same', 'Fall to zero'], why: 'More molecules have enough energy to escape, so more are in the vapor when rates balance again.' },
            { q: 'Adding more liquid to a sealed flask at equilibrium makes the vapor pressure:', a: 'Stay the same', w: ['Increase', 'Decrease', 'Double'], why: 'Vapor pressure depends only on the substance and the temperature.' },
            { q: 'Strengthening the intermolecular forces in a liquid would make its vapor pressure:', a: 'Decrease', w: ['Increase', 'Stay the same', 'Become 760 torr'], why: 'Fewer molecules can escape stickier neighbors.' },
            { q: 'Strengthening the intermolecular forces in a liquid would make its boiling point:', a: 'Increase', w: ['Decrease', 'Stay the same', 'Become $100\\ ^\\circ\\text{C}$'], why: 'A lower vapor pressure needs more heating to reach the outside pressure.' },
            { q: 'Lowering the outside pressure makes the boiling point of a liquid:', a: 'Decrease', w: ['Increase', 'Stay the same', 'Become $0\\ ^\\circ\\text{C}$'], why: 'Vapor pressure reaches the lower outside pressure at a lower temperature.' },
            { q: 'Inside a pressure cooker, the boiling point of water is:', a: 'Above $100\\ ^\\circ\\text{C}$', w: ['Below $100\\ ^\\circ\\text{C}$', 'Exactly $100\\ ^\\circ\\text{C}$', 'Exactly $0\\ ^\\circ\\text{C}$'], why: 'Higher pressure means vapor pressure must climb higher. At 2 atm, water boils near $120\\ ^\\circ\\text{C}$.' },
            { q: 'At the moment a sealed flask reaches liquid-vapor equilibrium, evaporation and condensation are:', a: 'Happening at equal rates', w: ['Both stopped', 'Only evaporation', 'Only condensation'], why: 'It is a dynamic equilibrium: both continue, and their rates match.' },
          ]);
          const opts = r.mc(c.a, c.w);
          return { q: c.q, choices: opts.choices, answer: opts.answer, hint: 'Think about how easily molecules can escape.', steps: [c.why] };
        },
      },
    ],

    cards: [
      { front: 'Why is temperature constant during a phase change?', back: 'The heat goes into separating molecules, not into making them move faster.' },
      { front: 'Which formula goes with a slope of a heating curve?', back: '$q = mc\\Delta T$' },
      { front: 'Which formula goes with a flat part of a heating curve?', back: '$q = m\\Delta H$ per gram, or $q = n\\Delta H$ per mole.' },
      { front: 'What are $\\Delta H_\\text{fus}$ and $\\Delta H_\\text{vap}$ of water?', back: '334 J/g (6.01 kJ/mol) and 2260 J/g (40.7 kJ/mol).' },
      { front: 'What is vapor pressure?', back: 'The pressure of a vapor in dynamic equilibrium with its liquid at a given temperature.' },
      { front: 'When does a liquid boil?', back: 'When its vapor pressure equals the outside pressure.' },
      { front: 'What is the normal boiling point?', back: 'The temperature where the vapor pressure is exactly 1 atm.' },
      { front: 'What does the Clausius-Clapeyron equation relate?', back: 'Vapor pressure and temperature. $\\ln(P_2/P_1) = -\\frac{\\Delta H_\\text{vap}}{R}(\\frac{1}{T_2}-\\frac{1}{T_1})$.' },
      { front: 'What is the triple point?', back: 'The one temperature and pressure where solid, liquid and gas coexist.' },
      { front: 'What is the critical point?', back: 'The end of the liquid-gas line. Above it you get a supercritical fluid.' },
      { front: 'What is special about water\'s phase diagram?', back: 'The solid-liquid line leans backward, because ice is less dense than the liquid.' },
    ],

    terms: [
      { term: 'Heating curve', def: 'A graph of temperature against heat added. Slopes are single phases warming. Flat parts are phase changes.' },
      { term: 'Melting (fusion)', def: 'Changing from solid to liquid.' },
      { term: 'Vaporization', def: 'Changing from liquid to gas.' },
      { term: 'Sublimation', def: 'Changing directly from solid to gas.' },
      { term: 'Deposition', def: 'Changing directly from gas to solid.' },
      { term: 'Condensation', def: 'Changing from gas to liquid. It releases heat.' },
      { term: 'Heat of fusion', def: 'The heat needed to melt a substance at its melting point: $\\Delta H_\\text{fus}$.' },
      { term: 'Heat of vaporization', def: 'The heat needed to vaporize a substance at its boiling point: $\\Delta H_\\text{vap}$.' },
      { term: 'Vapor pressure', def: 'The pressure of a vapor in dynamic equilibrium with its liquid or solid.' },
      { term: 'Dynamic equilibrium', def: 'Two opposite processes happening at equal rates, so nothing changes overall.' },
      { term: 'Normal boiling point', def: 'The temperature where vapor pressure equals exactly 1 atm.' },
      { term: 'Phase diagram', def: 'A map of pressure against temperature that shows which phase is stable.' },
      { term: 'Triple point', def: 'The temperature and pressure where solid, liquid and gas coexist.' },
      { term: 'Critical point', def: 'The temperature and pressure where the liquid-gas line ends.' },
      { term: 'Supercritical fluid', def: 'A substance above its critical temperature and pressure, with no separate liquid and gas.' },
    ],
  });
})();
