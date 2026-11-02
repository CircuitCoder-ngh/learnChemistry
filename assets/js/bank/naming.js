/* Question bank for 2.5 Naming compounds.
   Everything is computed from lists of ions, so formulas and names always agree with the charges.
   The same kit powers the flowchart and the trainer on the lesson page. */
(function () {
  const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII' };
  const PREFIX = { 1: 'mono', 2: 'di', 3: 'tri', 4: 'tetra', 5: 'penta', 6: 'hexa', 7: 'hepta', 8: 'octa', 9: 'nona', 10: 'deca' };

  /* ---------- Cations ---------- */
  const FIXED = [
    { f: 'Li', q: 1, name: 'lithium' }, { f: 'Na', q: 1, name: 'sodium' }, { f: 'K', q: 1, name: 'potassium' }, { f: 'Rb', q: 1, name: 'rubidium' }, { f: 'Cs', q: 1, name: 'cesium' },
    { f: 'Be', q: 2, name: 'beryllium' }, { f: 'Mg', q: 2, name: 'magnesium' }, { f: 'Ca', q: 2, name: 'calcium' }, { f: 'Sr', q: 2, name: 'strontium' }, { f: 'Ba', q: 2, name: 'barium' },
    { f: 'Al', q: 3, name: 'aluminum' }, { f: 'Ga', q: 3, name: 'gallium' }, { f: 'Zn', q: 2, name: 'zinc' }, { f: 'Cd', q: 2, name: 'cadmium' }, { f: 'Ag', q: 1, name: 'silver' },
    { f: 'NH4', q: 1, name: 'ammonium', poly: true },
  ];
  // common: charges used in drills. all: charges accepted when someone types a formula into the flowchart.
  const VARIABLE = [
    { f: 'Fe', base: 'iron', common: [2, 3], all: [2, 3], old: { 2: 'ferrous', 3: 'ferric' } },
    { f: 'Cu', base: 'copper', common: [1, 2], all: [1, 2], old: { 1: 'cuprous', 2: 'cupric' } },
    { f: 'Co', base: 'cobalt', common: [2, 3], all: [2, 3], old: { 2: 'cobaltous', 3: 'cobaltic' } },
    { f: 'Cr', base: 'chromium', common: [2, 3], all: [2, 3, 6], old: { 2: 'chromous', 3: 'chromic' } },
    { f: 'Mn', base: 'manganese', common: [2, 4], all: [2, 3, 4, 7] },
    { f: 'Ni', base: 'nickel', common: [2], all: [2, 3] },
    { f: 'Sn', base: 'tin', common: [2, 4], all: [2, 4], old: { 2: 'stannous', 4: 'stannic' } },
    { f: 'Pb', base: 'lead', common: [2, 4], all: [2, 4], old: { 2: 'plumbous', 4: 'plumbic' } },
    { f: 'Hg', base: 'mercury', common: [2], all: [2], old: { 2: 'mercuric' } },
    { f: 'Au', base: 'gold', common: [1, 3], all: [1, 3] },
    { f: 'Ti', base: 'titanium', common: [3, 4], all: [2, 3, 4] },
    { f: 'V', base: 'vanadium', common: [3, 5], all: [2, 3, 4, 5] },
    { f: 'Pt', base: 'platinum', common: [2, 4], all: [2, 4] },
  ];
  const HG2 = { f: 'Hg2', q: 2, poly: true, isVar: true, base: 'mercury', roman: 'I', name: 'mercury(I)', old: 'mercurous' };
  const varCat = (v, q) => ({ f: v.f, q, isVar: true, base: v.base, roman: ROMAN[q], name: `${v.base}(${ROMAN[q]})`, old: v.old && v.old[q] });
  const VAR_CATIONS = VARIABLE.flatMap((v) => v.common.map((q) => varCat(v, q))).concat([HG2]);

  /* ---------- Anions ---------- */
  const MONO = [
    { f: 'F', q: -1, name: 'fluoride', acid: 'hydrofluoric' }, { f: 'Cl', q: -1, name: 'chloride', acid: 'hydrochloric' }, { f: 'Br', q: -1, name: 'bromide', acid: 'hydrobromic' }, { f: 'I', q: -1, name: 'iodide', acid: 'hydroiodic' },
    { f: 'O', q: -2, name: 'oxide' }, { f: 'S', q: -2, name: 'sulfide', acid: 'hydrosulfuric' }, { f: 'Se', q: -2, name: 'selenide' },
    { f: 'N', q: -3, name: 'nitride' }, { f: 'P', q: -3, name: 'phosphide' }, { f: 'H', q: -1, name: 'hydride' },
  ];
  const POLY = [
    { f: 'OH', q: -1, name: 'hydroxide' }, { f: 'CN', q: -1, name: 'cyanide', acid: 'hydrocyanic' }, { f: 'NO3', q: -1, name: 'nitrate', acid: 'nitric' }, { f: 'NO2', q: -1, name: 'nitrite', acid: 'nitrous' },
    { f: 'C2H3O2', q: -1, name: 'acetate', acid: 'acetic', alt: 'CH3COO' }, { f: 'MnO4', q: -1, name: 'permanganate', acid: 'permanganic' }, { f: 'HCO3', q: -1, name: 'hydrogen carbonate', other: 'bicarbonate' }, { f: 'HSO4', q: -1, name: 'hydrogen sulfate', other: 'bisulfate' },
    { f: 'H2PO4', q: -1, name: 'dihydrogen phosphate' }, { f: 'ClO4', q: -1, name: 'perchlorate', acid: 'perchloric' }, { f: 'ClO3', q: -1, name: 'chlorate', acid: 'chloric' }, { f: 'ClO2', q: -1, name: 'chlorite', acid: 'chlorous' }, { f: 'ClO', q: -1, name: 'hypochlorite', acid: 'hypochlorous' },
    { f: 'BrO3', q: -1, name: 'bromate', acid: 'bromic' }, { f: 'IO3', q: -1, name: 'iodate', acid: 'iodic' }, { f: 'SCN', q: -1, name: 'thiocyanate' },
    { f: 'SO4', q: -2, name: 'sulfate', acid: 'sulfuric' }, { f: 'SO3', q: -2, name: 'sulfite', acid: 'sulfurous' }, { f: 'CO3', q: -2, name: 'carbonate', acid: 'carbonic' }, { f: 'CrO4', q: -2, name: 'chromate', acid: 'chromic' }, { f: 'Cr2O7', q: -2, name: 'dichromate', acid: 'dichromic' },
    { f: 'C2O4', q: -2, name: 'oxalate', acid: 'oxalic' }, { f: 'HPO4', q: -2, name: 'hydrogen phosphate' }, { f: 'O2', q: -2, name: 'peroxide' },
    { f: 'PO4', q: -3, name: 'phosphate', acid: 'phosphoric' }, { f: 'PO3', q: -3, name: 'phosphite', acid: 'phosphorous' }, { f: 'S2O3', q: -2, name: 'thiosulfate' },
  ];
  POLY.forEach((p) => { p.poly = true; });
  const ANIONS = MONO.concat(POLY);
  const DRILL_MONO = MONO.filter((a) => a.f !== 'H' && a.f !== 'Se');
  const DRILL_POLY = POLY.filter((a) => a.f !== 'SCN' && a.f !== 'O2' && a.f !== 'BrO3' && a.f !== 'IO3' && a.f !== 'C2O4' && a.f !== 'PO3' && a.f !== 'S2O3');

  /* ---------- Formula arithmetic ---------- */
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const part = (ion, n) => (n === 1 ? ion.f : ion.poly ? `(${ion.f})${n}` : `${ion.f}${n}`);
  const ratio = (c, a) => { const x = c.q, y = -a.q, g = gcd(x, y); return [y / g, x / g]; };
  const formula = (c, a) => { const [nc, na] = ratio(c, a); return part(c, nc) + part(a, na); };
  const chargeTex = (q) => `${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '-'}`;
  const ionTex = (ion) => `\\ce{${ion.f}^{${chargeTex(ion.q)}}}`;
  const signed = (q) => `${q > 0 ? '+' : '−'}${Math.abs(q)}`;
  const anName = (a) => a.name;
  const ionicName = (c, a) => `${c.name} ${a.name}`;
  // Compounds that do not exist as stable substances, kept out of the drills.
  const NEVER = new Set(['Fe3|I', 'Cu2|I', 'Cu2|CN', 'Pb4|I', 'Pb4|Br', 'Au3|I', 'Al3|CO3', 'Fe3|CO3', 'Cr3|CO3', 'Sn4|CO3', 'Pb4|CO3', 'Ti3|CO3', 'V5|Cl', 'V5|Br', 'V5|I', 'Mn4|I', 'Mn4|Br', 'Mn3|I', 'Co3|I', 'Co3|Br', 'Co3|Cl', 'Hg2|N', 'Hg2|P', 'Ag1|N', 'Ag1|P', 'Pb4|S', 'Au1|O', 'Au1|N', 'Au3|N', 'Pt4|N', 'Pt2|N']);
  const OXIDIZERS = new Set(['MnO4', 'Cr2O7', 'CrO4', 'ClO', 'ClO2', 'ClO3', 'ClO4']);
  const REDUCERS = new Set(['Fe2', 'Sn2', 'Cr2', 'Cu1', 'Mn4', 'Hg21']);
  const RARE_METALS = new Set(['Au', 'Pt', 'Ti', 'V']);
  const allowed = (c, a) => !(REDUCERS.has(`${c.f}${c.q}`) && OXIDIZERS.has(a.f)) && !(c.f === 'Mn' && c.q === 4 && a.poly) && !(RARE_METALS.has(c.f) && !['Cl', 'Br', 'O', 'S', 'F'].includes(a.f)) && !(c.isVar && (a.f === 'N' || a.f === 'P') && !['Fe', 'Cu', 'Cr', 'Mn', 'Co', 'Ni'].includes(c.f)) && !NEVER.has(`${c.f}${c.q}|${a.f}`) && !(c.f === 'Au' && a.poly) && !(c.f === 'Pt' && a.poly) && !(c.f === 'V' && a.poly) && !(c.f === 'Ti' && a.poly) && !(c.f === 'NH4' && (a.f === 'N' || a.f === 'P' || a.f === 'O')) && !(c.f === 'Hg2' && a.f !== 'Cl' && a.f !== 'Br' && a.f !== 'I' && a.f !== 'NO3' && a.f !== 'SO4');

  /* ---------- Answer matching helpers ---------- */
  const spell = (s) => [s, s.replace(/aluminum/g, 'aluminium'), s.replace(/sulf/g, 'sulph'), s.replace(/cesium/g, 'caesium')];
  function nameAccept(c, a) {
    const list = [];
    const aNames = [a.name].concat(a.other ? [a.other] : []);
    const cNames = [c.name];
    if (c.isVar) { cNames.push(`${c.base} ${c.roman}`, `${c.base} ${Object.keys(ROMAN).find((k) => ROMAN[k] === c.roman)}`, `${c.base}(${Object.keys(ROMAN).find((k) => ROMAN[k] === c.roman)})`); if (c.old) cNames.push(c.old); }
    cNames.forEach((cn) => aNames.forEach((an) => list.push(...spell(`${cn} ${an}`))));
    return [...new Set(list)];
  }
  function formulaAccept(f, a) {
    const out = [f];
    if (a && a.alt) out.push(f.replace(a.f, a.alt));
    return out;
  }

  /* ---------- Problem makers, shared by the gym and the trainer ---------- */
  function pickFixedBinary(r) {
    for (let i = 0; i < 40; i++) {
      const c = r.pick(FIXED.filter((x) => !x.poly)), a = r.pick(DRILL_MONO);
      if (allowed(c, a)) return [c, a];
    }
    return [FIXED[1], MONO[1]];
  }
  function pickVarBinary(r) {
    for (let i = 0; i < 60; i++) {
      const c = r.pick(VAR_CATIONS), a = r.pick(DRILL_MONO);
      if (allowed(c, a)) return [c, a];
    }
    return [VAR_CATIONS[1], MONO[1]];
  }
  function pickPoly(r) {
    const cats = FIXED.concat(VAR_CATIONS);
    for (let i = 0; i < 80; i++) {
      const c = r.pick(cats), a = r.pick(DRILL_POLY);
      if (allowed(c, a)) return [c, a];
    }
    return [FIXED[7], POLY[2]];
  }
  const noNumeralLine = (c) => (c.poly ? `$${ionTex(c)}$ is the ammonium ion, which always has this charge.` : `${c.name[0].toUpperCase() + c.name.slice(1)} only forms $${ionTex(c)}$, so no Roman numeral.`);
  function chargeWork(c, a, f) {
    const [nc, na] = ratio(c, a);
    const tot = na * -a.q;
    return [
      `Start with what you know: ${a.name} is $${ionTex(a)}$. ${na > 1 ? `The ${na} of them` : 'One of them'} total $${na} \\times (${a.q}) = -${tot}$.`,
      `$\\ce{${f}}$ must be neutral, so ${c.f === 'Hg2' ? `the $\\ce{Hg2}$ unit totals $+${tot}$, which is $\\ce{Hg2^2+}$` : nc > 1 ? `the ${nc} ${c.f} ions total $+${tot}$, so each is $\\dfrac{+${tot}}{${nc}} = +${c.q}$` : `the ${c.f} ion is $+${tot}$`}.`,
    ];
  }
  const parts = (c, a) => { const [nc, na] = ratio(c, a); return { kind: 'ionic', c, a, nc, na }; };

  function ionicToName(c, a) {
    const f = formula(c, a);
    return {
      q: `Name $\\ce{${f}}$.`, accept: nameAccept(c, a), placeholder: 'Name', answerName: ionicName(c, a), formula: f, parts: parts(c, a), dir: 'name',
      hint: c.isVar ? 'This metal can have several charges. Work out its charge, then write it as a Roman numeral.' : 'This metal has one charge only, so you do not need a number in the name.',
      steps: c.isVar
        ? [...chargeWork(c, a, f), `The Roman numeral shows the charge of the metal ion, so write ${c.name}.`, `The name is <b>${ionicName(c, a)}</b>.`]
        : [noNumeralLine(c), a.poly ? `$${ionTex(a)}$ keeps its name: ${a.name}.` : `The anion takes the -ide ending: ${a.name}.`, `The name is <b>${ionicName(c, a)}</b>. Ionic names have no prefixes.`],
    };
  }
  function ionicToFormula(c, a) {
    const f = formula(c, a);
    const [nc, na] = ratio(c, a);
    const tot = nc * c.q;
    return {
      q: `Write the formula of <b>${ionicName(c, a)}</b>.`, accept: formulaAccept(f, a), placeholder: 'Formula, such as Al2O3', answerName: ionicName(c, a), formula: f, parts: parts(c, a), dir: 'formula',
      hint: c.isVar ? 'The Roman numeral is the charge of the metal ion. Now balance the charges.' : 'Find both ion charges, then balance them to zero.',
      steps: [
        `The ions are $${ionTex(c)}$ and $${ionTex(a)}$.${c.isVar ? ' The Roman numeral gives the charge directly.' : ''}`,
        `Balance: $${nc} \\times (${c.q > 0 ? '+' : ''}${c.q}) + ${na} \\times (${a.q}) = +${tot} - ${tot} = 0$.`,
        `The formula is $\\ce{${f}}$.${a.poly && na > 1 ? ' Parentheses show there is more than one polyatomic ion.' : ''}`,
      ],
    };
  }

  /* ---------- Molecular ---------- */
  const NONMETAL_NAME = { H: 'hydrogen', B: 'boron', C: 'carbon', N: 'nitrogen', O: 'oxygen', F: 'fluorine', Si: 'silicon', P: 'phosphorus', S: 'sulfur', Cl: 'chlorine', As: 'arsenic', Se: 'selenium', Br: 'bromine', Te: 'tellurium', I: 'iodine', Xe: 'xenon', Kr: 'krypton', Sb: 'antimony', Ge: 'germanium' };
  const NONMETAL_ROOT = { H: 'hydride', B: 'boride', C: 'carbide', N: 'nitride', O: 'oxide', F: 'fluoride', Si: 'silicide', P: 'phosphide', S: 'sulfide', Cl: 'chloride', As: 'arsenide', Se: 'selenide', Br: 'bromide', Te: 'telluride', I: 'iodide' };
  const MOLECULES = ['CO', 'CO2', 'NO', 'NO2', 'N2O', 'N2O3', 'N2O4', 'N2O5', 'SO2', 'SO3', 'P2O3', 'P2O5', 'P4O6', 'P4O10', 'PCl3', 'PCl5', 'PBr3', 'PF3', 'PF5', 'SF2', 'SF4', 'SF6', 'SCl2', 'S2Cl2', 'CCl4', 'CBr4', 'CS2', 'SiO2', 'SiCl4', 'SiF4', 'NF3', 'NCl3', 'NBr3', 'N2F4', 'ClF', 'ClF3', 'ClF5', 'ClO2', 'Cl2O', 'Cl2O7', 'BrF3', 'BrF5', 'IF5', 'IF7', 'ICl', 'ICl3', 'BF3', 'BCl3', 'B2O3', 'XeF2', 'XeF4', 'XeF6', 'XeO3', 'As2O3', 'As2O5', 'AsCl3', 'P4S3', 'SeF6', 'SeO2', 'SeO3', 'TeO2', 'OF2', 'I2O5', 'NI3'];
  function parseBinary(f) {
    const m = /^([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)$/.exec(f);
    return m ? { e1: m[1], n1: m[2] ? +m[2] : 1, e2: m[3], n2: m[4] ? +m[4] : 1 } : null;
  }
  function secondWord(n, e2) {
    const root = NONMETAL_ROOT[e2];
    if (!root) return null;
    const pre = PREFIX[n];
    const vowel = /^[ao]/.test(root);
    const dropped = vowel && /[ao]$/.test(pre) ? pre.slice(0, -1) : pre;
    return { word: dropped + root, full: pre + root, dropped: dropped !== pre };
  }
  function molecularName(f) {
    const p = parseBinary(f);
    if (!p || !NONMETAL_NAME[p.e1] || !NONMETAL_ROOT[p.e2] || p.n1 > 10 || p.n2 > 10) return null;
    const first = (p.n1 === 1 ? '' : PREFIX[p.n1]) + NONMETAL_NAME[p.e1];
    const sec = secondWord(p.n2, p.e2);
    return { name: `${first} ${sec.word}`, alt: `${first} ${sec.full}`, p, sec, first };
  }
  function molecularProblem(f, dir) {
    const m = molecularName(f);
    const { p, sec } = m;
    const pieces = [
      p.n1 === 1 ? `One ${p.e1}: no prefix on the first element, so it is just "${NONMETAL_NAME[p.e1]}".` : `${p.n1} ${p.e1}: "${PREFIX[p.n1]}" gives "${m.first}".`,
      `${p.n2} ${p.e2}: "${PREFIX[p.n2]}" plus "${NONMETAL_ROOT[p.e2]}" gives "${sec.word}"${sec.dropped ? `, dropping the last vowel of the prefix before a vowel` : ''}.`,
    ];
    const accept = [...new Set(spell(m.name).concat(spell(m.alt)))];
    const specials = { CO: 'carbon monoxide', CO2: 'carbon dioxide', N2O: 'dinitrogen monoxide', NO: 'nitrogen monoxide' };
    if (f === 'N2O') accept.push('nitrous oxide');
    if (f === 'NO') accept.push('nitric oxide');
    void specials;
    if (dir === 'name') {
      return {
        q: `Name $\\ce{${f}}$.`, accept, placeholder: 'Name', answerName: m.name, formula: f, parts: { kind: 'molecular', f, m }, dir,
        hint: 'Both elements are nonmetals, so use prefixes. Never use mono- on the first element.',
        steps: ['Both are nonmetals, so this is molecular. Use prefixes.', ...pieces, `The name is <b>${m.name}</b>.`],
      };
    }
    return {
      q: `Write the formula of <b>${m.name}</b>.`, accept: [f], placeholder: 'Formula', answerName: m.name, formula: f, parts: { kind: 'molecular', f, m }, dir,
      hint: 'The prefixes tell you the subscripts directly. No charges needed.',
      steps: [`Molecular names count the atoms: ${p.n1 === 1 ? `no prefix on ${NONMETAL_NAME[p.e1]} means 1` : `"${PREFIX[p.n1]}" means ${p.n1}`} and "${PREFIX[p.n2]}" means ${p.n2}.`, `So the formula is $\\ce{${f}}$. Do not simplify it.`],
    };
  }

  /* ---------- Acids ---------- */
  const ACID_ANIONS = ANIONS.filter((a) => a.acid);
  const acidFormula = (a) => { const n = -a.q; return `H${n > 1 ? n : ''}${a.f}`; };
  const acidName = (a) => `${a.acid} acid`;
  const acidRule = (a) => (a.name.endsWith('ide') ? `The anion ends in -ide, so use hydro-...-ic` : a.name.endsWith('ate') ? `The anion ends in -ate, so it becomes -ic` : `The anion ends in -ite, so it becomes -ous`);
  function acidProblem(a, dir) {
    const f = acidFormula(a), name = acidName(a);
    const altF = a.f === 'C2H3O2' ? ['CH3COOH'] : [];
    const steps = dir === 'name'
      ? [`The anion is $${ionTex(a)}$, which is ${a.name}.`, `${acidRule(a)}: ${a.name} becomes <b>${a.acid}</b>.`, `The name is <b>${name}</b>. It is an acid in water, so there is no "hydrogen" in the name.`]
      : [`${a.acid[0].toUpperCase() + a.acid.slice(1)} comes from ${a.name}, $${ionTex(a)}$.`, `The charge is ${chargeTex(a.q)}, so the acid needs ${-a.q} H⁺.`, `The formula is $\\ce{${f}}$.`];
    return dir === 'name'
      ? { q: `Name the acid $\\ce{${f}(aq)}$.`, accept: spell(name), placeholder: 'Name', answerName: name, formula: f, parts: { kind: 'acid', a, f }, dir, hint: 'What ion is attached to the hydrogen? Look at its ending.', steps }
      : { q: `Write the formula of <b>${name}</b>.`, accept: [f].concat(altF), placeholder: 'Formula', answerName: name, formula: f, parts: { kind: 'acid', a, f }, dir, hint: 'Find the anion and its charge. That tells you how many H there are.', steps };
  }

  /* ---------- Hydrates ---------- */
  const HYDRATES = [
    ['CuSO4', 'copper(II) sulfate', 5], ['MgSO4', 'magnesium sulfate', 7], ['CoCl2', 'cobalt(II) chloride', 6], ['Na2CO3', 'sodium carbonate', 10], ['CaSO4', 'calcium sulfate', 2], ['FeSO4', 'iron(II) sulfate', 7], ['BaCl2', 'barium chloride', 2],
    ['Na2SO4', 'sodium sulfate', 10], ['NiCl2', 'nickel(II) chloride', 6], ['CaCl2', 'calcium chloride', 2], ['Fe(NO3)3', 'iron(III) nitrate', 9], ['Al2(SO4)3', 'aluminum sulfate', 18], ['ZnSO4', 'zinc sulfate', 7], ['CuCl2', 'copper(II) chloride', 2],
    ['Mg(NO3)2', 'magnesium nitrate', 6], ['Sr(OH)2', 'strontium hydroxide', 8], ['Ba(OH)2', 'barium hydroxide', 8], ['LiCl', 'lithium chloride', 1], ['Na2CO3', 'sodium carbonate', 1], ['FeCl3', 'iron(III) chloride', 6], ['AlCl3', 'aluminum chloride', 6], ['Cr(NO3)3', 'chromium(III) nitrate', 9], ['MnSO4', 'manganese(II) sulfate', 1], ['Na2S', 'sodium sulfide', 9],
  ].filter((h) => h[2] <= 10);
  const hydrateWord = (n) => `${PREFIX[n]}hydrate`;
  function hydrateProblem(h, dir) {
    const [f, base, n] = h;
    const name = `${base} ${hydrateWord(n)}`;
    const texF = `\\ce{${f}*${n === 1 ? '' : n}H2O}`;
    const typed = `${f}·${n === 1 ? '' : n}H2O`;
    const variants = ['·', '.', '*', ' ', ''].map((s) => `${f}${s}${n === 1 ? '' : n}H2O`);
    if (dir === 'name') {
      return {
        q: `Name $${texF}$.`, accept: [...new Set(spell(name))], placeholder: 'Name', answerName: name, formula: typed, parts: { kind: 'hydrate', f, base, n }, dir,
        hint: 'Name the salt as usual, then add a prefix and the word hydrate.',
        steps: [`Name the salt first: $\\ce{${f}}$ is ${base}.`, `${n === 1 ? 'One water' : `${n} waters`}: "${PREFIX[n]}" + "hydrate" gives ${hydrateWord(n)}.`, `The name is <b>${name}</b>.`],
      };
    }
    return {
      q: `Write the formula of <b>${name}</b>. Use a dot or a period before the water.`, accept: variants, placeholder: 'Such as CuSO4·5H2O', answerName: name, formula: typed, parts: { kind: 'hydrate', f, base, n }, dir,
      hint: `"${PREFIX[n]}" means ${n}. Write the salt, a dot, then the waters.`,
      steps: [`The salt: ${base} is $\\ce{${f}}$.`, `${hydrateWord(n)} means ${n} water${n > 1 ? 's' : ''} per formula unit.`, `The formula is $${texF}$.`],
    };
  }

  /* ---------- The trainer's categories ---------- */
  const CATEGORY = {
    fixed: { label: 'Fixed-charge metals', make(r, d) { const [c, a] = pickFixedBinary(r); return d === 'name' ? ionicToName(c, a) : ionicToFormula(c, a); } },
    variable: { label: 'Roman numerals', make(r, d) { const [c, a] = pickVarBinary(r); return d === 'name' ? ionicToName(c, a) : ionicToFormula(c, a); } },
    poly: { label: 'Polyatomic ions', make(r, d) { const [c, a] = pickPoly(r); return d === 'name' ? ionicToName(c, a) : ionicToFormula(c, a); } },
    molecular: { label: 'Molecular', make(r, d) { return molecularProblem(r.pick(MOLECULES), d); } },
    acid: { label: 'Acids', make(r, d) { return acidProblem(r.pick(ACID_ANIONS), d); } },
    hydrate: { label: 'Hydrates', make(r, d) { return hydrateProblem(r.pick(HYDRATES), d); } },
  };

  /* ---------- The flowchart's analysis: walks any formula through the decisions ---------- */
  const SPECIAL = { H2O: 'water', NH3: 'ammonia', CH4: 'methane', H2O2: 'hydrogen peroxide', PH3: 'phosphine', N2H4: 'hydrazine', SiH4: 'silane', B2H6: 'diborane', C2H6: 'ethane', C3H8: 'propane', C2H4: 'ethene', C2H2: 'ethyne' };
  const NOT_METALS = new Set(['H', 'B', 'C', 'N', 'O', 'F', 'Si', 'P', 'S', 'Cl', 'As', 'Se', 'Br', 'Te', 'I', 'He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'At', 'Ge', 'Sb']);
  function parseCationPrefix(s) {
    const out = [];
    const paren = /^\(([A-Za-z0-9]+)\)(\d+)/.exec(s);
    const tryUnit = (unit, n, rest) => {
      if (unit === 'NH4') out.push({ c: FIXED.find((x) => x.f === 'NH4'), n, rest });
      if (unit === 'Hg2') out.push({ c: HG2, n, rest });
    };
    if (paren) tryUnit(paren[1], +paren[2], s.slice(paren[0].length));
    const nh4 = /^NH4(?!\d)/.exec(s);
    if (nh4) tryUnit('NH4', 1, s.slice(3));
    const hg2 = /^Hg2(?!\d)/.exec(s);
    if (hg2) tryUnit('Hg2', 1, s.slice(3));
    const sym = /^([A-Z][a-z]?)(\d*)/.exec(s);
    if (sym) {
      const fixed = FIXED.find((x) => x.f === sym[1] && !x.poly);
      const vari = VARIABLE.find((x) => x.f === sym[1]);
      const n = sym[2] ? +sym[2] : 1;
      if (fixed) out.push({ c: fixed, n, rest: s.slice(sym[0].length) });
      if (vari) out.push({ v: vari, n, rest: s.slice(sym[0].length) });
    }
    return out;
  }
  function parseAnionRest(rest) {
    const out = [];
    const paren = /^\(([A-Za-z0-9]+)\)(\d+)$/.exec(rest);
    if (paren) { const a = POLY.find((x) => x.f === paren[1] || x.alt === paren[1]); if (a) out.push({ a, n: +paren[2] }); return out; }
    const mono = /^([A-Z][a-z]?)(\d*)$/.exec(rest);
    if (mono) { const a = MONO.find((x) => x.f === mono[1]); if (a) out.push({ a, n: mono[2] ? +mono[2] : 1 }); }
    const p = POLY.find((x) => x.f === rest || x.alt === rest);
    if (p) out.push({ a: p, n: 1 });
    return out;
  }
  function analyze(raw) {
    let s = String(raw || '').trim().replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c));
    if (!s) return { error: 'Type a formula first.' };
    s = s.replace(/\(aq\)|\(s\)|\(l\)|\(g\)/g, '').trim();
    let hydrate = 0;
    const hm = /^(.*?)\s*[·*.\s]\s*(\d*)H2O$/.exec(s);
    if (hm) { hydrate = hm[2] ? +hm[2] : 1; s = hm[1].trim(); }
    s = s.replace(/\s+/g, '');
    if (s === 'CH3COOH') s = 'HC2H3O2';
    if (/^[A-Z][a-z]?\d*$/.test(s)) return { error: `${s} is just one element, not a compound. Check the capitals: Co is cobalt, and CO is carbon monoxide.` };
    if (/[^A-Za-z0-9()]/.test(s)) return { error: `I could not read "${raw}". Use plain text such as Fe2O3 or Ca(OH)2.` };
    if (SPECIAL[s]) {
      return { kind: 'special', f: s, name: SPECIAL[s], hydrate: 0, path: s === 'H2O' || s === 'H2O2' ? ['A', 'Sp'] : ['A', 'B', 'Sp'], why: { A: `$\\ce{${s}}$ is not named as an acid.`, B: 'It has no metal.' }, note: `This one is so common it has its own name, and you just learn it: <b>${SPECIAL[s]}</b>.` };
    }
    // Acids.
    if (s[0] === 'H' && !hydrate) {
      const acidM = /^H(\d*)(.+)$/.exec(s);
      if (acidM && !/^[a-z]/.test(acidM[2])) {
        const n = acidM[1] ? +acidM[1] : 1;
        const a = ANIONS.find((x) => (x.f === acidM[2] || x.alt === acidM[2]) && x.acid);
        if (a && -a.q === n) {
          const binary = a.name.endsWith('ide');
          return {
            kind: 'acid', f: s, a, name: acidName(a), hydrate: 0, path: ['A', 'C', binary ? 'Lh' : 'Lo'],
            why: {
              A: `$\\ce{${s}}$ starts with H, followed by the anion $${ionTex(a)}$. In water it is an acid.`,
              C: binary ? `${a.name[0].toUpperCase() + a.name.slice(1)} has no oxygen in it, so answer no.` : `${a.name[0].toUpperCase() + a.name.slice(1)} contains oxygen, so answer yes.`,
              leaf: binary ? `Use hydro- and -ic: <b>${a.name}</b> becomes <b>${a.acid} acid</b>.` : a.name.endsWith('ate') ? `The -ate ending becomes -ic: <b>${a.name}</b> becomes <b>${a.acid} acid</b>.` : `The -ite ending becomes -ous: <b>${a.name}</b> becomes <b>${a.acid} acid</b>.`,
            },
          };
        }
      }
    }
    // Ionic.
    for (const cand of parseCationPrefix(s)) {
      for (const an of parseAnionRest(cand.rest)) {
        const neg = an.n * -an.a.q;
        if (cand.c) {
          if (cand.n * cand.c.q !== neg) continue;
          const c = cand.c;
          const name = ionicName(c, an.a) + (hydrate ? ` ${hydrateWord(hydrate)}` : '');
          return {
            kind: 'ionic', f: s, name, hydrate, c, a: an.a, nc: cand.n, na: an.n, path: ['A', 'B', 'E', 'Lf'],
            why: {
              A: `$\\ce{${s}}$ does not begin with H, so it is not an acid.`,
              B: c.poly ? 'It contains the ammonium ion, $\\ce{NH4+}$, which behaves like a metal ion.' : `${c.name[0].toUpperCase() + c.name.slice(1)} is a metal, so this is ionic.`,
              E: c.poly ? 'Ammonium is always $+1$, so no numeral is needed.' : `${c.name[0].toUpperCase() + c.name.slice(1)} only ever forms $${ionTex(c)}$, so no numeral is needed.`,
              leaf: `Say the cation, then the anion: <b>${c.name}</b> + <b>${an.a.name}</b>.`,
            },
          };
        }
        const perCat = neg / cand.n;
        if (!Number.isInteger(perCat) || !cand.v.all.includes(perCat)) continue;
        const c = varCat(cand.v, perCat);
        const name = ionicName(c, an.a) + (hydrate ? ` ${hydrateWord(hydrate)}` : '');
        return {
          kind: 'ionic', f: s, name, hydrate, c, a: an.a, nc: cand.n, na: an.n, path: ['A', 'B', 'E', 'Lv'],
          why: {
            A: `$\\ce{${s}}$ does not begin with H, so it is not an acid.`,
            B: `${cand.v.base[0].toUpperCase() + cand.v.base.slice(1)} is a metal, so this is ionic.`,
            E: `${cand.v.base[0].toUpperCase() + cand.v.base.slice(1)} can have several charges, so you need a Roman numeral.`,
            leaf: `${an.n} × (${an.a.q}) = −${neg}, so ${cand.n > 1 ? `the ${cand.n} ${cand.v.f} ions share +${neg}, which is +${perCat} each` : `the ${cand.v.f} ion is +${perCat}`}. Write <b>${cand.v.base}(${ROMAN[perCat]})</b>.`,
          },
        };
      }
    }
    if (parseCationPrefix(s).length) {
      const cand = parseCationPrefix(s)[0];
      if (cand.v && parseAnionRest(cand.rest).length) return { error: `The charge on ${cand.v.base} in ${s} does not come out to a common whole number. Check the formula.` };
      if (parseAnionRest(cand.rest).length) return { error: `The charges in ${s} do not add to zero, so that compound does not exist. Check the subscripts.` };
    }
    // Hydrogen hydrides of metals, and molecular compounds.
    const m = molecularName(s);
    if (m && NOT_METALS.has(m.p.e1) && NOT_METALS.has(m.p.e2)) {
      if (m.p.e1 === m.p.e2) return { error: `${s} is an element, not a compound.` };
      if (m.p.e1 === 'H') return { error: `${s} is not one of the common acids, so I do not have a name for it.` };
      const name = m.name + (hydrate ? ` ${hydrateWord(hydrate)}` : '');
      return {
        kind: 'molecular', f: s, name, hydrate, m, path: ['A', 'B', 'Lm'],
        why: {
          A: `$\\ce{${s}}$ does not begin with H, so it is not an acid.`,
          B: `${NONMETAL_NAME[m.p.e1][0].toUpperCase() + NONMETAL_NAME[m.p.e1].slice(1)} and ${NONMETAL_NAME[m.p.e2]} are both nonmetals. No metal, so this is molecular.`,
          leaf: `Count with prefixes: ${m.p.n1 === 1 ? `one ${m.p.e1} needs no prefix` : `${m.p.n1} ${m.p.e1} is ${PREFIX[m.p.n1]}-`}, and ${m.p.n2} ${m.p.e2} is ${PREFIX[m.p.n2]}-.`,
        },
      };
    }
    const bin = parseBinary(s);
    if (bin && bin.e1 === bin.e2) return { error: `${s} is an element, not a compound.` };
    if (/^\d|^[a-z]/.test(s)) return { error: `A formula starts with a capital letter. Try again.` };
    return { error: `I do not recognize ${s}. It may be organic, or use an unusual ion. Check the capitals too: Co is cobalt, and CO is carbon monoxide.` };
  }

  /* ---------- Multiple-choice builders ---------- */
  function wrongNames(c, a) {
    const list = [];
    if (c.isVar) {
      const [nc, na] = ratio(c, a);
      if (nc !== c.q && ROMAN[nc]) list.push(`${c.base}(${ROMAN[nc]}) ${a.name}`);
      if (na !== c.q && ROMAN[na]) list.push(`${c.base}(${ROMAN[na]}) ${a.name}`);
      list.push(`${c.base} ${a.name}`);
      if (c.q !== 1) list.push(`${c.base}(${ROMAN[c.q === 2 ? 3 : 2]}) ${a.name}`);
      if (na > 1 && PREFIX[na]) list.push(`${c.base} ${PREFIX[na]}${a.name}`);
    } else {
      const [, na] = ratio(c, a);
      if (na > 1) list.push(`${c.name} ${PREFIX[na]}${a.name}`);
      if (!a.poly) list.push(`${c.name} ${({ F: 'fluorine', Cl: 'chlorine', Br: 'bromine', I: 'iodine', O: 'oxygen', S: 'sulfur', N: 'nitrogen', P: 'phosphorus' })[a.f]}`);
      list.push(`${c.name}(${ROMAN[c.q]}) ${a.name}`);
      if (na === 1) list.push(`mono${c.name} mono${a.name}`);
      if (a.name.endsWith('ate')) list.push(`${c.name} ${a.name.replace(/ate$/, 'ite')}`);
      if (a.name.endsWith('ite')) list.push(`${c.name} ${a.name.replace(/ite$/, 'ate')}`);
    }
    return list;
  }
  function wrongFormulas(c, a) {
    const [nc, na] = ratio(c, a);
    const out = [];
    out.push(c.f + a.f);
    out.push(part(c, na) + part(a, nc));
    if (na > 1 && a.poly) out.push(part(c, nc) + a.f + na);
    if (nc > 1 && na > 1) out.push(part(c, nc * 2) + part(a, na * 2));
    out.push(part(c, Math.max(1, -a.q)) + part(a, Math.max(1, c.q)));
    if (nc === 1 && na === 1) out.push(part(c, 2) + part(a, 2));
    out.push(part(c, nc + 1) + part(a, na));
    return [...new Set(out)];
  }

  const typed = (id, title, cat, d) => ({ id, title, make: (r) => CATEGORY[cat].make(r, d) });

  Bank.add('naming', {
    quiz: [
      {
        q: 'What is the name of $\\ce{FeCl3}$?',
        options: ['Iron chloride', 'Iron trichloride', 'Iron(III) chloride', 'Iron(I) chloride'],
        answer: 2,
        why: 'Iron can have several charges, so the name needs a numeral. Three $\\ce{Cl-}$ total $-3$, so iron is $+3$. Prefixes are only for molecular compounds.',
      },
      {
        q: 'What does the Roman numeral in copper(II) oxide tell you?',
        options: ['There are 2 copper atoms', 'There are 2 oxygen atoms', 'Copper has a charge of $+2$', 'It is the second copper compound found'],
        answer: 2,
        why: 'The numeral is the charge on the metal ion, not a count. The formula here is $\\ce{CuO}$, with only one copper.',
      },
      {
        q: 'What is the name of $\\ce{N2O4}$?',
        options: ['Nitrogen oxide', 'Dinitrogen tetroxide', 'Nitrogen(IV) oxide', 'Dinitrogen tetrasulfide'],
        answer: 1,
        why: 'Both elements are nonmetals, so use prefixes: 2 N is dinitrogen, and 4 O is tetroxide, with the a dropped before the vowel.',
      },
      {
        q: 'Why is $\\ce{CaCl2}$ called calcium chloride and not calcium dichloride?',
        options: ['Chlorine is special', 'Prefixes are never used in chemistry', 'Calcium is always $+2$, so the ratio is already fixed', 'Calcium has two charges'],
        answer: 2,
        why: 'In ionic compounds the charges fix the ratio, so nothing needs counting in the name. Prefixes are for molecular compounds, where many ratios are possible.',
      },
      {
        q: 'What is the name of $\\ce{HNO2(aq)}$?',
        options: ['Nitric acid', 'Nitrous acid', 'Hydronitric acid', 'Hydrogen nitrate'],
        answer: 1,
        why: '$\\ce{NO2-}$ is nitrite, and -ite becomes -ous. Nitric acid is $\\ce{HNO3}$, from nitrate.',
      },
      {
        q: 'What is the name of $\\ce{HBr(aq)}$?',
        options: ['Bromic acid', 'Bromous acid', 'Hydrobromic acid', 'Hydrogen bromate'],
        answer: 2,
        why: 'The anion is bromide, with no oxygen. An -ide anion gives hydro-...-ic.',
      },
      {
        q: 'What is the correct formula of tin(IV) sulfate?',
        options: ['$\\ce{SnSO4}$', '$\\ce{Sn(SO4)2}$', '$\\ce{Sn4SO4}$', '$\\ce{Sn2(SO4)4}$'],
        answer: 1,
        why: '$\\ce{Sn^4+}$ needs two $\\ce{SO4^2-}$ to balance. $\\ce{Sn2(SO4)4}$ is balanced too, but it is not the smallest ratio.',
      },
      {
        q: 'What does "pentahydrate" tell you about $\\ce{CuSO4*5H2O}$?',
        options: ['It has 5 hydrogen atoms', 'There are 5 water molecules per formula unit', 'It is dissolved in 5 liters of water', 'There are 5 copper ions'],
        answer: 1,
        why: 'Hydrates trap a set number of water molecules in the crystal. Heating drives them out and leaves the anhydrous salt.',
      },
      {
        q: 'Which compound does <b>not</b> need a Roman numeral in its name?',
        options: ['$\\ce{CuCl2}$', '$\\ce{Fe2O3}$', '$\\ce{ZnO}$', '$\\ce{PbS}$'],
        answer: 2,
        why: 'Zinc only forms $\\ce{Zn^2+}$. Copper, iron and lead each have more than one common charge.',
      },
      {
        q: 'Which is the correct name of $\\ce{CO}$?',
        options: ['Carbon oxide', 'Monocarbon monoxide', 'Carbon monoxide', 'Cobalt oxide'],
        answer: 2,
        why: 'Mono- is dropped on the first element but kept on the second. And it is not cobalt, which would be $\\ce{Co}$ with a lowercase o.',
      },
    ],

    gens: [
      typed('fixed-name', 'Fixed metals: name it', 'fixed', 'name'),
      typed('fixed-formula', 'Fixed metals: write it', 'fixed', 'formula'),
      typed('var-name', 'Roman numerals: name it', 'variable', 'name'),
      typed('var-formula', 'Roman numerals: write it', 'variable', 'formula'),
      typed('poly-name', 'Polyatomics: name it', 'poly', 'name'),
      typed('poly-formula', 'Polyatomics: write it', 'poly', 'formula'),
      typed('mol-name', 'Molecular: name it', 'molecular', 'name'),
      typed('mol-formula', 'Molecular: write it', 'molecular', 'formula'),
      typed('acid-name', 'Acids: name it', 'acid', 'name'),
      typed('acid-formula', 'Acids: write it', 'acid', 'formula'),
      typed('hyd-name', 'Hydrates: name it', 'hydrate', 'name'),
      typed('hyd-formula', 'Hydrates: write it', 'hydrate', 'formula'),
      {
        id: 'charge',
        title: 'Find the Roman numeral',
        make(r) {
          for (let i = 0; i < 40; i++) {
            const [c, a] = r.next() < 0.5 ? pickVarBinary(r) : pickPoly(r);
            if (!c.isVar || c.f === 'Hg2') continue;
            const f = formula(c, a);
            return {
              q: `In $\\ce{${f}}$, what is the charge on the ${c.base} ion? Type just the number.`,
              answer: c.q, tol: 0, answerText: `+${c.q}`,
              hint: 'Total the negative charge, then share it among the metal ions.',
              steps: [...chargeWork(c, a, f), `So it is ${c.name}.`],
            };
          }
          return { q: 'In $\\ce{FeCl3}$, what is the charge on the iron ion? Type just the number.', answer: 3, tol: 0, answerText: '+3', steps: ['Three chlorides total $-3$, so iron is $+3$.'] };
        },
      },
      {
        id: 'ion-name',
        title: 'Name the single ion',
        make(r) {
          const kind = r.pick(['cat', 'var', 'an', 'poly']);
          let ion, accept, why;
          if (kind === 'cat') { ion = r.pick(FIXED.filter((x) => !x.poly)); accept = [ion.name, `${ion.name} ion`]; why = `Cations keep the name of the metal: ${ion.name}.`; }
          else if (kind === 'var') { ion = r.pick(VAR_CATIONS); accept = [ion.name, `${ion.base} ${ion.roman}`]; if (ion.old) accept.push(ion.old); why = `This metal has several charges, so its ion needs a numeral: ${ion.name}.`; }
          else if (kind === 'an') { ion = r.pick(DRILL_MONO); accept = [ion.name, `${ion.name} ion`]; why = `Single-atom anions end in -ide: ${ion.name}.`; }
          else { ion = r.pick(DRILL_POLY); accept = [ion.name].concat(ion.other ? [ion.other] : []); why = `This is a polyatomic ion you need to memorize: ${ion.name}.`; }
          return { q: `Name the ion $${ionTex(ion)}$.`, accept: [...new Set(accept.flatMap(spell))], placeholder: 'Name', hint: kind === 'an' ? 'The ending is -ide.' : 'Do you remember this one from the last lesson?', steps: [why] };
        },
      },
      {
        id: 'path',
        title: 'Which path on the flowchart?',
        make(r) {
          const kind = r.pick(['Ionic, no numeral', 'Ionic, with a Roman numeral', 'Molecular, with prefixes', 'Acid']);
          let f, why;
          if (kind === 'Ionic, no numeral') { const [c, a] = r.next() < 0.5 ? pickFixedBinary(r) : (() => { for (let i = 0; i < 40; i++) { const p = pickPoly(r); if (!p[0].isVar) return p; } return [FIXED[1], POLY[2]]; })(); f = formula(c, a); why = `$\\ce{${f}}$ has ${c.poly ? 'ammonium' : c.name}, which has only one possible charge.`; }
          else if (kind === 'Ionic, with a Roman numeral') { const [c, a] = pickVarBinary(r); f = formula(c, a); why = `$\\ce{${f}}$ has ${c.base}, a metal with more than one possible charge.`; }
          else if (kind === 'Molecular, with prefixes') { f = r.pick(MOLECULES); why = `$\\ce{${f}}$ contains only nonmetals.`; }
          else { f = acidFormula(r.pick(ACID_ANIONS)); why = `$\\ce{${f}}$ is hydrogen joined to an anion, so it is an acid in water.`; }
          const opts = r.mc(kind, ['Ionic, no numeral', 'Ionic, with a Roman numeral', 'Molecular, with prefixes', 'Acid'].filter((x) => x !== kind));
          return { q: `Which naming path does $\\ce{${f}}$ take? Assume acids are in water.`, choices: opts.choices, answer: opts.answer, steps: [why] };
        },
      },
      {
        id: 'pick-name',
        title: 'Pick the right name',
        make(r) {
          for (let i = 0; i < 30; i++) {
            const roll = r.next();
            let [c, a] = roll < 0.35 ? pickVarBinary(r) : roll < 0.65 ? pickPoly(r) : pickFixedBinary(r);
            const right = ionicName(c, a);
            const wrong = [...new Set(wrongNames(c, a).filter((w) => w !== right))];
            if (wrong.length < 2) continue;
            const opts = r.mc(right, r.shuffle(wrong).slice(0, 3));
            return { q: `Which is the correct name of $\\ce{${formula(c, a)}}$?`, choices: opts.choices, answer: opts.answer, steps: ionicToName(c, a).steps };
          }
          return null;
        },
      },
      {
        id: 'pick-formula',
        title: 'Pick the right formula',
        make(r) {
          for (let i = 0; i < 30; i++) {
            const roll = r.next();
            const [c, a] = roll < 0.35 ? pickVarBinary(r) : roll < 0.75 ? pickPoly(r) : pickFixedBinary(r);
            const right = formula(c, a);
            const wrong = wrongFormulas(c, a).filter((w) => w !== right && w !== 'NaN');
            if (wrong.length < 2) continue;
            const tex = (x) => `$\\ce{${x}}$`;
            const opts = r.mc(tex(right), r.shuffle(wrong).slice(0, 3).map(tex));
            return { q: `Which is the correct formula of <b>${ionicName(c, a)}</b>?`, choices: opts.choices, answer: opts.answer, steps: ionicToFormula(c, a).steps };
          }
          return null;
        },
      },
      {
        id: 'prefix',
        title: 'Prefixes',
        make(r) {
          const n = r.int(1, 10);
          if (r.next() < 0.5) {
            return { q: `What number does the prefix <b>${PREFIX[n]}-</b> mean?`, answer: n, tol: 0, answerText: String(n), hint: 'Mono, di, tri, tetra, penta, hexa, hepta, octa, nona, deca.', steps: [`${PREFIX[n]}- means ${n}.`] };
          }
          return { q: `What prefix means <b>${n}</b>?`, accept: [PREFIX[n], `${PREFIX[n]}-`], placeholder: 'Prefix', hint: 'Mono, di, tri, tetra, penta, hexa, hepta, octa, nona, deca.', steps: [`${n} is ${PREFIX[n]}-.`] };
        },
      },
    ],

    cards: [
      { front: 'Name an ionic compound with a fixed-charge metal', back: 'Metal name, then the anion name. No numbers. $\\ce{MgCl2}$ is magnesium chloride.' },
      { front: 'What does a Roman numeral mean in a name?', back: 'The charge of the metal ion. Iron(III) means $\\ce{Fe^3+}$.' },
      { front: 'Which metals need no Roman numeral?', back: 'Groups 1 and 2, plus Al, Zn, Ag and Cd. Each has only one common charge.' },
      { front: 'When do you use prefixes?', back: 'Only for molecular compounds, made of nonmetals. Never for ionic compounds.' },
      { front: 'The prefixes 1 to 10', back: 'Mono, di, tri, tetra, penta, hexa, hepta, octa, nona, deca.' },
      { front: 'When is mono- left out?', back: 'On the first element. $\\ce{CO}$ is carbon monoxide, not monocarbon monoxide.' },
      { front: 'Acid from an -ide anion', back: 'Hydro-...-ic acid. Chloride gives hydrochloric acid.' },
      { front: 'Acid from an -ate anion', back: '-ic acid. Nitrate gives nitric acid.' },
      { front: 'Acid from an -ite anion', back: '-ous acid. Nitrite gives nitrous acid.' },
      { front: 'What does hydrate mean?', back: 'A salt with a set number of water molecules in its crystal, such as $\\ce{CuSO4*5H2O}$, copper(II) sulfate pentahydrate.' },
      { front: 'Name $\\ce{Fe2O3}$', back: 'Iron(III) oxide.' },
      { front: 'Name $\\ce{P2O5}$', back: 'Diphosphorus pentoxide.' },
      { front: 'Name $\\ce{H2SO4}$', back: 'Sulfuric acid.' },
    ],

    terms: [
      { term: 'Nomenclature', def: 'The system of rules for naming compounds.' },
      { term: 'Roman numeral (in a name)', def: 'Shows the charge of a metal ion that could have more than one charge, as in iron(III).' },
      { term: 'Binary compound', def: 'A compound made of exactly two elements.' },
      { term: 'Prefix', def: 'A word part that counts atoms in a molecular name, from mono- (1) to deca- (10).' },
      { term: 'Acid', def: 'A compound that releases $\\ce{H+}$ in water. Its name comes from its anion.' },
      { term: 'Oxyacid', def: 'An acid whose anion contains oxygen, such as $\\ce{H2SO4}$.' },
      { term: 'Hydrate', def: 'A solid compound with a fixed number of water molecules in its crystal.' },
      { term: 'Anhydrous', def: 'Without water: a salt after its water of hydration has been driven off.' },
    ],
  });

  Bank.all.naming.kit = { analyze, CATEGORY, ROMAN, PREFIX, FIXED, VARIABLE, chargeTex, ionTex, ratio, part, formula, signed, anName, hydrateWord, SPECIAL };
})();
