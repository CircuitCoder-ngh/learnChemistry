/* Question bank for 1.3 Unit conversions and density. */
(function () {
  const METRIC = [
    { from: 'km', to: 'm', f: 1000, top: '1000 m', bot: '1 km' },
    { from: 'm', to: 'km', f: 0.001, top: '1 km', bot: '1000 m' },
    { from: 'm', to: 'cm', f: 100, top: '100 cm', bot: '1 m' },
    { from: 'cm', to: 'm', f: 0.01, top: '1 m', bot: '100 cm' },
    { from: 'g', to: 'mg', f: 1000, top: '1000 mg', bot: '1 g' },
    { from: 'mg', to: 'g', f: 0.001, top: '1 g', bot: '1000 mg' },
    { from: 'kg', to: 'g', f: 1000, top: '1000 g', bot: '1 kg' },
    { from: 'g', to: 'kg', f: 0.001, top: '1 kg', bot: '1000 g' },
    { from: 'L', to: 'mL', f: 1000, top: '1000 mL', bot: '1 L' },
    { from: 'mL', to: 'L', f: 0.001, top: '1 L', bot: '1000 mL' },
  ];
  const CHAIN = [
    { q: (v) => `${v} h`, to: 's', steps: [['60 min', '1 h', 60, 'min'], ['60 s', '1 min', 60, 's']], lo: 1.2, hi: 9 },
    { q: (v) => `${v} days`, to: 'min', steps: [['24 h', '1 day', 24, 'h'], ['60 min', '1 h', 60, 'min']], lo: 1.2, hi: 9 },
    { q: (v) => `${v} km`, to: 'cm', steps: [['1000 m', '1 km', 1000, 'm'], ['100 cm', '1 m', 100, 'cm']], lo: 1.2, hi: 9 },
    { q: (v) => `${v} kg`, to: 'mg', steps: [['1000 g', '1 kg', 1000, 'g'], ['1000 mg', '1 g', 1000, 'mg']], lo: 1.2, hi: 9 },
    { q: (v) => `${v} ft`, to: 'cm', steps: [['12 in', '1 ft', 12, 'in'], ['2.54 cm', '1 in', 2.54, 'cm']], lo: 1.5, hi: 9 },
    { q: (v) => `${v} L`, to: 'cm³', steps: [['1000 mL', '1 L', 1000, 'mL'], ['1 cm³', '1 mL', 1, 'cm³']], lo: 0.2, hi: 4 },
  ];
  const texUnit = (u) => (u.includes('³') ? `\\text{${u.replace('³', '')}}^3` : `\\text{${u}}`);
  const frac = (top, bot) => `\\dfrac{${texUnit(top)}}{${texUnit(bot)}}`;
  const BLOCKS = [
    ['cork', 0.24], ['pine wood', 0.5], ['ice', 0.92], ['aluminum', 2.7], ['iron', 7.87], ['copper', 8.96], ['lead', 11.3], ['gold', 19.3],
  ];
  const LIQUIDS = [['ethanol', 0.79], ['water', 1.0], ['very salty water', 1.2], ['mercury', 13.5]];
  /** Sig figs in a number as printed, by the rules taught in the measurement lesson. */
  const sfOf = (v) => { const s = String(v), d = s.replace('.', '').replace(/^0+/, ''); return s.includes('.') ? d.length : d.replace(/0+$/, '').length; };

  Bank.add('conversions', {
    quiz: [
      {
        q: 'Which fraction changes 5.0 km into meters?',
        options: ['$\\dfrac{1\\text{ km}}{1000\\text{ m}}$', '$\\dfrac{1000\\text{ m}}{1\\text{ km}}$', '$\\dfrac{1\\text{ m}}{1000\\text{ km}}$', '$\\dfrac{1000\\text{ km}}{1\\text{ m}}$'],
        answer: 1,
        why: 'km must be on the bottom to cancel the km you start with. It must also be true: 1000 m does equal 1 km, which rules out the last two.',
      },
      {
        q: 'Why does multiplying by a conversion factor not change the amount?',
        options: ['It is always a very small number', 'The fraction equals exactly 1', 'Units do not affect math', 'It only changes the sig figs'],
        answer: 1,
        why: 'The top and bottom name the same amount, so the fraction equals 1. Multiplying by 1 changes the name, not the amount.',
      },
      {
        q: 'How many cubic centimeters are in one cubic meter?',
        options: ['100', '1,000', '10,000', '1,000,000'],
        answer: 3,
        why: 'Cube the number too: $100^3 = 1{,}000{,}000$. Stopping at 100 is the most common wrong answer.',
      },
      {
        q: 'What is 1 mL the same as?',
        options: ['1 cm', '1 cm²', '1 cm³', '1 dm³'],
        answer: 2,
        why: 'A little cube 1 cm on each side holds exactly 1 mL. And 1 dm³ is 1 L.',
      },
      {
        q: 'A 10.0 mL sample has a mass of 27.0 g. What is its density?',
        options: ['0.370 g/mL', '2.70 g/mL', '17.0 g/mL', '270. g/mL'],
        answer: 1,
        why: '$d = m/V = 27.0 \\div 10.0 = 2.70$ g/mL. Grams go on top. Use the units as your guide.',
      },
      {
        q: 'An object has density 0.92 g/mL. What happens in water, with density 1.00 g/mL?',
        options: ['It sinks to the bottom', 'It floats, with about 92% under the surface', 'It floats, with 8% under the surface', 'It hangs in the middle'],
        answer: 1,
        why: 'Less dense things float. The fraction under the surface equals the ratio of densities, which is why most of an iceberg is hidden.',
      },
      {
        q: 'A rock raises the water in a cylinder from 25.0 mL to 31.0 mL. What is the rock\'s volume?',
        options: ['25.0 mL', '31.0 mL', '6.0 mL', '56.0 mL'],
        answer: 2,
        why: 'The rock pushes aside its own volume of water, so subtract: $31.0 - 25.0 = 6.0$ mL.',
      },
      {
        q: 'What is 25 °C in kelvin?',
        options: ['−248 K', '25 K', '298 K', '77 K'],
        answer: 2,
        why: '$T_{\\text{K}} = 25 + 273.15 = 298$ K. Kelvin is never negative.',
      },
      {
        q: 'Which is correct for changing °F to °C?',
        options: ['Divide by 1.8, then subtract 32', 'Subtract 32, then divide by 1.8', 'Multiply by 1.8, then add 32', 'Add 273.15'],
        answer: 1,
        why: 'Undo the forward steps in reverse order. Forward is multiply then add, so backward is subtract then divide.',
      },
    ],

    gens: [
      {
        id: 'metric',
        title: 'One-step conversions',
        make(r) {
          const c = r.pick(METRIC);
          const v = r.num(1.2, 95, 1);
          const ans = v * c.f;
          return {
            q: `Convert ${v} ${c.from} to ${c.to}.`,
            answer: ans, unit: c.to, tol: 0.01, sf: sfOf(v),
            hint: `Write a fraction with ${c.from} on the bottom so it cancels.`,
            steps: [`Choose the fraction with ${c.from} on the bottom: $${frac(c.top, c.bot)}$.`, `$${v}\\ \\cancel{\\text{${c.from}}} \\times ${frac(c.top, c.bot).replace(`\\text{${c.bot}}`, `\\text{${c.bot.split(' ')[0]} }\\cancel{\\text{${c.from}}}`)} = ${Lab.sig(parseFloat(ans.toPrecision(6)), sfOf(v)).replace('×', '\\times').replace(/10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (m, e) => '10^{' + e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (x) => '-0123456789'['⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(x)]) + '}')}\\text{ ${c.to}}$.`],
          };
        },
      },
      {
        id: 'chain',
        title: 'Chained conversions',
        make(r) {
          const c = r.pick(CHAIN);
          const v = r.num(c.lo, c.hi, 2);
          const ans = c.steps.reduce((a, s) => a * s[2], v);
          let run = v;
          const lines = c.steps.map((s) => { run *= s[2]; return `Multiply by $${frac(s[0], s[1])}$ to get ${Lab.sig(parseFloat(run.toPrecision(6)), 3)} ${s[3]}.`; });
          return {
            q: `Convert ${c.q(v)} to ${c.to}.`,
            answer: ans, unit: c.to, tol: 0.015,
            hint: 'Plan the path through units you know. Each fraction cancels the unit left by the last.',
            steps: [...lines, 'Every unit along the way canceled except the one you wanted.'],
          };
        },
      },
      {
        id: 'cubic',
        title: 'Squared and cubed units',
        make(r) {
          const kind = r.pick(['m3-cm3', 'cm3-m3', 'm2-cm2', 'L-cm3', 'dm3-L', 'cm3-mL']);
          const v = r.num(1.2, 9.5, 1);
          if (kind === 'm3-cm3') return { q: `Convert ${v} m³ to cm³.`, answer: v * 1e6, unit: 'cm³', tol: 0.01, sf: sfOf(v), hint: 'Cube the 100 as well as the unit.', steps: [`$(100\\text{ cm})^3 = 10^{6}\\text{ cm}^3$ for each cubic meter.`, `$${v} \\times 10^{6}$ cm³.`] };
          if (kind === 'cm3-m3') return { q: `Convert ${v} cm³ to m³.`, answer: v * 1e-6, unit: 'm³', tol: 0.01, sf: sfOf(v), hint: 'A cubic meter holds $10^{6}$ cm³, so the answer is small.', steps: ['One cubic meter is $10^{6}$ cm³.', `$${v} \\div 10^{6} = ${v} \\times 10^{-6}$ m³.`] };
          if (kind === 'm2-cm2') return { q: `Convert ${v} m² to cm².`, answer: v * 1e4, unit: 'cm²', tol: 0.01, sf: sfOf(v), hint: 'Square the 100 as well as the unit.', steps: ['$(100\\text{ cm})^2 = 10^{4}\\text{ cm}^2$ for each square meter.', `$${v} \\times 10^{4}$ cm².`] };
          if (kind === 'L-cm3') return { q: `Convert ${v} L to cm³.`, answer: v * 1000, unit: 'cm³', tol: 0.01, sf: sfOf(v), hint: '1 L = 1000 mL, and 1 mL = 1 cm³.', steps: ['1 L = 1000 mL = 1000 cm³.', `$${v} \\times 1000 = ${Math.round(v * 1000)}$ cm³.`] };
          if (kind === 'dm3-L') return { q: `Convert ${v} dm³ to L.`, answer: v, unit: 'L', tol: 0.01, sf: sfOf(v), hint: 'A cube 10 cm on a side is 1 dm³.', steps: ['A cube 1 dm (10 cm) on a side is exactly 1 L.', `So ${v} dm³ is ${v} L.`] };
          return { q: `Convert ${v} cm³ to mL.`, answer: v, unit: 'mL', tol: 0.01, sf: sfOf(v), hint: 'How do those two units compare?', steps: ['1 cm³ is exactly 1 mL.', `So ${v} cm³ is ${v} mL.`] };
        },
      },
      {
        id: 'density',
        title: 'Find density, mass or volume',
        make(r) {
          const [name, d] = r.pick([['aluminum', 2.7], ['iron', 7.87], ['ethanol', 0.789], ['water', 1.0], ['olive oil', 0.91], ['copper', 8.96], ['gold', 19.3], ['mercury', 13.5]]);
          const mode = r.pick(['d', 'm', 'V']);
          const V = r.num(5, 90, 1);
          const m = +(d * V).toFixed(1);
          if (mode === 'd') return { q: `A sample of ${name} has a mass of ${m} g and a volume of ${V} mL. What is its density?`, answer: m / V, unit: 'g/mL', hint: 'Density is mass over volume.', steps: [`$d = \\dfrac{m}{V} = \\dfrac{${m}\\text{ g}}{${V}\\text{ mL}} = ${(m / V).toFixed(2)}\\text{ g/mL}$.`] };
          if (mode === 'm') return { q: `${name[0].toUpperCase() + name.slice(1)} has a density of ${d} g/mL. What is the mass of ${V} mL?`, answer: d * V, unit: 'g', hint: 'Multiply density by volume so that mL cancels.', steps: [`Rearrange: $m = d \\times V$.`, `$m = ${d}\\ \\dfrac{\\text{g}}{\\cancel{\\text{mL}}} \\times ${V}\\ \\cancel{\\text{mL}} = ${(d * V).toFixed(1)}\\text{ g}$.`] };
          return { q: `${name[0].toUpperCase() + name.slice(1)} has a density of ${d} g/mL. What volume does ${m} g occupy?`, answer: m / d, unit: 'mL', hint: 'Divide mass by density so that grams cancel.', steps: [`Rearrange: $V = \\dfrac{m}{d}$.`, `$V = ${m}\\ \\cancel{\\text{g}} \\times \\dfrac{1\\text{ mL}}{${d}\\ \\cancel{\\text{g}}} = ${(m / d).toFixed(1)}\\text{ mL}$.`] };
        },
      },
      {
        id: 'displacement',
        title: 'Water displacement',
        make(r) {
          const v0 = r.num(20, 40, 1), dv = r.num(4, 22, 1), v1 = +(v0 + dv).toFixed(1);
          const d = r.pick([2.7, 7.87, 8.96, 11.3, 2.2]);
          const m = +(dv * d).toFixed(1);
          const ans = m / dv;
          // A volume below 10.0 mL has only 2 sig figs, and that limits the density.
          const sf = dv < 10 ? 2 : 3;
          return {
            q: `An object of mass ${m.toFixed(1)} g raises the water in a cylinder from ${v0.toFixed(1)} mL to ${v1.toFixed(1)} mL. What is its density?`,
            answer: ans, unit: 'g/mL', tol: 0.03, sf,
            hint: 'The volume is how much the water level rose.',
            steps: [`Volume: $${v1.toFixed(1)} - ${v0.toFixed(1)} = ${dv.toFixed(1)}$ mL.`, `Density: $\\dfrac{${m.toFixed(1)}\\text{ g}}{${dv.toFixed(1)}\\text{ mL}} = ${Lab.sig(ans, sf)}\\text{ g/mL}$.`],
          };
        },
      },
      {
        id: 'float',
        title: 'Float or sink?',
        make(r) {
          let b, l;
          do { b = r.pick(BLOCKS); l = r.pick(LIQUIDS); } while (b[1] === l[1]);
          const choices = ['It floats', 'It sinks'];
          const sink = b[1] > l[1];
          return {
            q: `Will ${b[0]} (${b[1]} g/mL) float or sink in ${l[0]} (${l[1]} g/mL)?`,
            choices, answer: sink ? 1 : 0,
            steps: [`Compare the densities. ${b[1]} is ${sink ? 'greater' : 'less'} than ${l[1]}.`, sink ? 'Denser objects sink.' : `Less dense objects float, with about ${Math.round((b[1] / l[1]) * 100)}% under the surface.`],
          };
        },
      },
      {
        id: 'temperature',
        title: 'Temperature scales',
        make(r) {
          const mode = r.pick(['C-K', 'K-C', 'C-F', 'F-C', 'F-K']);
          if (mode === 'C-K') { const c = r.int(-190, 400); return { q: `Convert ${c} °C to kelvin.`, answer: c + 273.15, unit: 'K', tol: 0.005, hint: 'Add 273.15.', steps: [`$T_{\\text{K}} = ${c < 0 ? `(${c})` : c} + 273.15 = ${(c + 273.15).toFixed(2)}$ K.`] }; }
          if (mode === 'K-C') { const k = r.int(80, 700); return { q: `Convert ${k} K to °C.`, answer: k - 273.15, unit: '°C', tol: 0.01, hint: 'Subtract 273.15.', steps: [`$T_{^\\circ\\text{C}} = ${k} - 273.15 = ${(k - 273.15).toFixed(2)}$ °C.`] }; }
          if (mode === 'C-F') { const c = r.int(-40, 220); return { q: `Convert ${c} °C to °F.`, answer: 1.8 * c + 32, unit: '°F', tol: 0.01, hint: 'Multiply by 1.8, then add 32.', steps: [`Multiply first: $1.8 \\times ${c < 0 ? `(${c})` : c} = ${(1.8 * c).toFixed(1)}$.`, `Then add 32: $${(1.8 * c + 32).toFixed(1)}$ °F.`] }; }
          if (mode === 'F-C') { const f = r.int(-20, 400); return { q: `Convert ${f} °F to °C.`, answer: (f - 32) / 1.8, unit: '°C', tol: 0.02, hint: 'Subtract 32 first, then divide by 1.8.', steps: [`Subtract first: $${f} - 32 = ${f - 32}$.`, `Then divide: $${f - 32} \\div 1.8 = ${((f - 32) / 1.8).toFixed(1)}$ °C.`] }; }
          const f = r.int(0, 300), c = (f - 32) / 1.8;
          return { q: `Convert ${f} °F to kelvin.`, answer: c + 273.15, unit: 'K', tol: 0.005, hint: 'Go through Celsius.', steps: [`To Celsius: $(${f} - 32) \\div 1.8 = ${c.toFixed(1)}$ °C.`, `To kelvin: $${c.toFixed(1)} + 273.15 = ${(c + 273.15).toFixed(1)}$ K.`] };
        },
      },
    ],

    cards: [
      { front: 'What is a conversion factor?', back: 'A fraction equal to 1, such as $\\dfrac{1000\\text{ m}}{1\\text{ km}}$.' },
      { front: 'Which unit goes on the bottom of a conversion factor?', back: 'The unit you want to get rid of.' },
      { front: 'How many cm³ are in 1 m³?', back: '$10^{6}$. Cube the 100 too.' },
      { front: 'What is 1 mL in cm³?', back: 'Exactly 1 cm³. And 1 L is 1000 mL.' },
      { front: 'Write density and its rearrangements.', back: '$d = m/V$, $m = dV$, and $V = m/d$.' },
      { front: 'When does something float?', back: 'When it is less dense than the liquid. The fraction under the surface equals the density ratio.' },
      { front: 'What is water displacement?', back: 'Finding a solid\'s volume from how far it raises the water level.' },
      { front: 'Convert °C to K and °F.', back: '$T_{\\text{K}} = T_{^\\circ\\text{C}} + 273.15$, and $T_{^\\circ\\text{F}} = 1.8\\,T_{^\\circ\\text{C}} + 32$.' },
      { front: 'What is absolute zero?', back: '0 K, or $-273.15$ °C. The lowest possible temperature.' },
    ],

    terms: [
      { term: 'Dimensional analysis', def: 'Solving problems by multiplying by fractions so that the units cancel. Also called the factor-label method.' },
      { term: 'Conversion factor', def: 'A fraction equal to 1 that changes the units of a quantity without changing the amount.' },
      { term: 'Density', def: 'Mass per unit volume, $d = m/V$, often in g/mL.' },
      { term: 'Water displacement', def: 'Finding a solid\'s volume from the rise in water level when it is submerged.' },
      { term: 'Kelvin', def: 'The SI unit of temperature, written K with no degree sign. It starts at absolute zero.' },
      { term: 'Absolute zero', def: 'The lowest possible temperature: 0 K, or $-273.15$ °C.' },
      { term: 'Liter', def: 'A unit of volume equal to 1000 mL, or $1000\\text{ cm}^3$.' },
    ],
  });
})();
