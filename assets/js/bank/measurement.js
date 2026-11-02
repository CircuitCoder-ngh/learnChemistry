/* Question bank for 1.2 Measuring and significant figures. */
(function () {
  /** Count significant figures in a string, using the same rules the lesson teaches. */
  function countSF(str) {
    const mant = String(str).split(/e/i)[0];
    const hasPoint = mant.includes('.');
    const d = mant.replace('.', '');
    const first = d.search(/[1-9]/);
    if (first < 0) return 0;
    const core = d.slice(first);
    return hasPoint ? core.length : core.replace(/0+$/, '').length;
  }
  const texE = (e) => `\\times 10^{${e}}`;
  const SF_NUMS = ['472', '1005', '0.0052', '2.50', '100', '100.', '30.0', '0.0030', '5000', '5000.0', '0.101', '60', '60.0', '40.070', '1.020', '0.00700', '12300', '12300.', '8.0', '0.5', '700.0', '10.01'];
  const SF_WHY = (s) => {
    const parts = [];
    const hasPoint = s.includes('.');
    if (/^0\.0*/.test(s) && s.startsWith('0')) parts.push('Leading zeros do not count.');
    const d = s.replace('.', '').replace(/^0+/, '');
    if (/[1-9]0+[1-9]/.test(d)) parts.push('Zeros between other digits count.');
    if (/0$/.test(d)) parts.push(hasPoint ? 'End zeros count, because there is a decimal point.' : 'End zeros do not count, because there is no decimal point.');
    if (!parts.length) parts.push('All nonzero digits count.');
    return parts.join(' ');
  };
  const PREFIX = [
    { sym: 'M', p: 6 }, { sym: 'k', p: 3 }, { sym: 'd', p: -1 }, { sym: 'c', p: -2 }, { sym: 'm', p: -3 }, { sym: '\\mu ', p: -6 }, { sym: 'n', p: -9 },
  ];
  const tidy = (x) => parseFloat(x.toPrecision(6));

  Bank.add('measurement', {
    quiz: [
      {
        q: 'Which is the SI base unit of mass?',
        options: ['gram', 'kilogram', 'pound', 'milligram'],
        answer: 1,
        why: 'The kilogram. It is the only SI base unit with a prefix built in.',
      },
      {
        q: 'How many nanometers are in one meter?',
        options: ['$10^{-9}$', '$10^{3}$', '$10^{6}$', '$10^{9}$'],
        answer: 3,
        why: '1 nm is $10^{-9}$ m, so a whole meter holds $10^{9}$ nm. Watch the direction: a smaller unit means a bigger count.',
      },
      {
        q: 'A student weighs a true 5.00 g mass and gets 4.32, 4.33 and 4.31 g. These results are:',
        options: ['Accurate and precise', 'Precise but not accurate', 'Accurate but not precise', 'Neither accurate nor precise'],
        answer: 1,
        why: 'They agree closely with each other, so they are precise. They are far from 5.00 g, so they are not accurate.',
      },
      {
        q: 'Where do you read a water meniscus in a graduated cylinder?',
        options: ['At the top edge, where it touches the glass', 'At the bottom of the curve, at eye level', 'At the middle of the curve', 'Halfway between the two nearest lines'],
        answer: 1,
        why: 'Water curves up the glass, so read the bottom of the curve, with your eye level to avoid parallax.',
      },
      {
        q: 'A cylinder has lines every 1 mL. Which reading is written correctly?',
        options: ['36 mL', '36.4 mL', '36.42 mL', '36.421 mL'],
        answer: 1,
        why: 'Write every digit the lines give, plus one estimate. With lines every 1 mL, that is one decimal place.',
      },
      {
        q: 'How many sig figs does 0.00520 have?',
        options: ['2', '3', '5', '6'],
        answer: 1,
        why: 'Leading zeros do not count. The 5 and 2 count, and the end zero counts because there is a decimal point.',
      },
      {
        q: 'Which number is unmistakably 3 sig figs?',
        options: ['100', '$1 \\times 10^{2}$', '$1.00 \\times 10^{2}$', '0.100 km as 100 m'],
        answer: 2,
        why: 'In scientific notation, every digit in the front number counts. Plain 100 has 1 sig fig by the usual rule.',
      },
      {
        q: 'What is $12.11 + 1.0$ with the correct sig figs?',
        options: ['13', '13.1', '13.11', '13.110'],
        answer: 1,
        why: 'Adding keeps the fewest decimal places. $1.0$ has one, so the answer keeps one. Students often wrongly apply the multiply rule and write 13.',
      },
      {
        q: 'What is $4.56 \\times 1.4$ with the correct sig figs?',
        options: ['6', '6.4', '6.38', '6.384'],
        answer: 1,
        why: 'Multiplying keeps the fewest sig figs. $1.4$ has two, so the answer keeps two.',
      },
    ],

    gens: [
      {
        id: 'count-sf',
        title: 'Count the sig figs',
        make(r) {
          const s = r.pick(SF_NUMS);
          const n = countSF(s);
          return {
            q: `How many significant figures does <b>${s}</b> have?`,
            answer: n, unit: 'sig figs', tol: 0, answerText: String(n),
            hint: 'Start with the zeros. Leading zeros never count. End zeros count only with a decimal point.',
            steps: [`${SF_WHY(s)}`, `That leaves <b>${n}</b> significant figure${n === 1 ? '' : 's'}.`],
          };
        },
      },
      {
        id: 'sci-write',
        title: 'Write in scientific notation',
        make(r) {
          // Skip whole-number fronts: 5.0 × 10³ written out as 5,000 would lose a sig fig.
          const a0 = r.num(1.1, 9.9, 1), a = Number.isInteger(a0) ? a0 + 0.1 : a0;
          const e = r.pick([-8, -7, -6, -5, -4, -3, -2, 3, 4, 5, 6, 7, 8]);
          const plain = e > 0 ? (a * Math.pow(10, e)).toLocaleString('en-US', { maximumFractionDigits: 0 }) : (a * Math.pow(10, e)).toFixed(-e + 1);
          const correct = `$${a.toFixed(1)} ${texE(e)}$`;
          const m = r.mc(correct, [`$${a.toFixed(1)} ${texE(-e)}$`, `$${a.toFixed(1)} ${texE(e + 1)}$`, `$${a.toFixed(1)} ${texE(e - 1)}$`]);
          const dir = e > 0 ? 'left' : 'right';
          return {
            q: `Write ${plain} in scientific notation.`,
            choices: m.choices, answer: m.answer,
            steps: [`Move the point until one nonzero digit is in front: ${a.toFixed(1)}.`, `It moved ${Math.abs(e)} places ${dir}, so the exponent is ${e}.`, `The answer is ${correct}.`],
          };
        },
      },
      {
        id: 'sci-multiply',
        title: 'Multiply in scientific notation',
        make(r) {
          const a = r.num(1.1, 4.5, 1), b = r.num(1.1, 2.1, 1), e1 = r.int(-9, 9), e2 = r.int(-9, 9);
          const mant = a * b, e = e1 + e2, ans = mant * Math.pow(10, e);
          return {
            q: `What is $(${a.toFixed(1)} ${texE(e1)}) \\times (${b.toFixed(1)} ${texE(e2)})$?`,
            answer: ans, tol: 0.02, sf: 2,
            hint: 'Multiply the front numbers, then add the exponents.',
            steps: [`Multiply the front numbers: $${a.toFixed(1)} \\times ${b.toFixed(1)} = ${mant.toFixed(2)}$.`, `Add the exponents: $${e1} + (${e2}) = ${e}$.`, `The answer is $${mant.toFixed(1)} ${texE(e)}$, keeping 2 sig figs.`],
          };
        },
      },
      {
        id: 'prefix',
        title: 'Convert with prefixes',
        make(r) {
          const P = r.pick(PREFIX);
          const unit = r.pick(['m', 'g', 'L']);
          const v = r.num(1.2, 95, 1), sf = countSF(String(v));
          const toBase = r.next() < 0.5;
          const f = Math.pow(10, P.p);
          const sym = P.sym.trim();
          if (toBase) {
            const ans = v * f;
            return {
              q: `Convert $${v}\\ \\text{${''}}${sym === '\\mu' ? '\\mu\\text{' + unit + '}' : '\\text{' + sym + unit + '}'}$ to ${unit}.`,
              answer: ans, unit, tol: 0.01, sf,
              hint: `The prefix means $10^{${P.p}}$.`,
              steps: [`The prefix means $10^{${P.p}}$, so multiply by that.`, `$${v} \\times 10^{${P.p}} = ${Lab.sig(tidy(ans), sf).replace('×', '\\times').replace(/10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (m, e) => '10^{' + e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '-0123456789'['⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)]) + '}')}$ ${unit}.`],
            };
          }
          const ans = v / f;
          return {
            q: `Convert ${v} ${unit} to $${sym === '\\mu' ? '\\mu\\text{' + unit + '}' : '\\text{' + sym + unit + '}'}$.`,
            answer: ans, tol: 0.01, sf,
            hint: 'A smaller unit means a bigger number, and a bigger unit means a smaller number.',
            steps: [`One of the new units is $10^{${P.p}}$ ${unit}, so divide by that.`, `$${v} \\div 10^{${P.p}} = ${v} \\times 10^{${-P.p}}$. Written out, about ${Lab.sig(tidy(ans), sf)}.`],
          };
        },
      },
      {
        id: 'add-sf',
        title: 'Add with sig figs',
        make(r) {
          const d1 = r.int(1, 3); let d2 = r.int(0, 3);
          if (d1 === d2) d2 = d1 === 3 ? 1 : d1 + 1;
          const A = (r.int(11, 99) + r.int(1, Math.pow(10, d1) - 1) / Math.pow(10, d1)).toFixed(d1);
          // A whole number ending in 0, such as 50, is only known to the tens place, so avoid it.
          const bi = r.int(2, 89);
          const B = (d2 ? bi + r.int(1, Math.pow(10, d2) - 1) / Math.pow(10, d2) : bi % 10 ? bi : bi + 1).toFixed(d2);
          const keep = Math.min(d1, d2), big = Math.max(d1, d2), sc = Math.pow(10, big);
          const sum = (Math.round(parseFloat(A) * sc) + Math.round(parseFloat(B) * sc)) / sc;
          // The nudge makes a final 5 round up every time, whatever the binary float does.
          const raw = sum.toFixed(big), ans = (sum + 1e-9).toFixed(keep);
          const wrong = [raw, (sum).toFixed(Math.min(big, keep + 1)), keep > 0 ? sum.toFixed(keep - 1) : (sum + 1).toFixed(0), keep === 0 ? sum.toFixed(1) : sum.toFixed(keep + 2 > 4 ? 4 : keep + 2)];
          const m = r.mc(ans, wrong);
          return {
            q: `What is $${A} + ${B}$ with the correct number of sig figs?`,
            choices: m.choices, answer: m.answer,
            steps: [`Add: $${A} + ${B} = ${raw}$.`, `$${A}$ has ${d1} decimal place${d1 === 1 ? '' : 's'} and $${B}$ has ${d2}. Keep the fewest: ${keep}.`, `Round to get <b>${ans}</b>.`],
          };
        },
      },
      {
        id: 'mul-sf',
        title: 'Multiply with sig figs',
        make(r) {
          const [sa, sb] = r.pick([[3, 2], [2, 3], [4, 2], [3, 3], [4, 3], [2, 2]]);
          const num = (sf) => { const low = Math.pow(10, sf - 1), v = r.int(low + 1, low * 9); return (v / Math.pow(10, sf - 1)).toFixed(sf - 1); };
          const A = num(sa), B = num(sb), keep = Math.min(sa, sb);
          const div = r.next() < 0.4;
          const res = div ? parseFloat(A) / parseFloat(B) : parseFloat(A) * parseFloat(B);
          // A final 5 always rounds up, and a whole number ending in 0 needs a point to show its zero counts: 20.
          const fmt = (n) => { let s = (res * (1 + 1e-12)).toPrecision(n); if (s.includes('e')) s = String(parseFloat(s)); return countSF(s) !== n && !s.includes('.') ? `${s}.` : s; };
          const m = r.mc(fmt(keep), [fmt(keep + 1), fmt(keep + 2), fmt(keep + 3), keep > 1 ? fmt(keep - 1) : fmt(keep + 4)]);
          return {
            q: `What is $${A} ${div ? '\\div' : '\\times'} ${B}$ with the correct number of sig figs?`,
            choices: m.choices, answer: m.answer,
            steps: [`Calculate: about $${res.toPrecision(6)}$.`, `$${A}$ has ${sa} sig figs and $${B}$ has ${sb}. Keep the fewest: ${keep}.`, `Round to <b>${fmt(keep)}</b>.`],
          };
        },
      },
      {
        id: 'acc-prec',
        title: 'Accuracy or precision?',
        make(r) {
          const truth = r.num(4, 60, 2);
          const type = r.int(0, 3);
          const off = type === 1 || type === 3 ? truth * r.num(0.06, 0.12, 2) : 0;
          const sp = type === 2 || type === 3 ? truth * 0.05 : truth * 0.0015;
          const offsets = type === 2 ? [-1, 1, 0.2] : [-1, 0.6, 0.4];
          const vals = offsets.map((k) => (truth + off + k * sp).toFixed(2));
          const choices = ['Accurate and precise', 'Precise but not accurate', 'Accurate but not precise', 'Neither accurate nor precise'];
          const close = type === 0 || type === 2, tight = type === 0 || type === 1;
          return {
            q: `The true mass is ${truth.toFixed(2)} g. You measure ${vals.join(' g, ')} g. Describe these results.`,
            choices, answer: type,
            steps: [`Compare with each other: they are ${tight ? 'very close, so they are precise' : 'spread out, so they are not precise'}.`, `Compare the average with ${truth.toFixed(2)} g: it is ${close ? 'close, so they are accurate' : 'far off, so they are not accurate'}.`],
          };
        },
      },
      {
        id: 'round-sf',
        title: 'Round to sig figs',
        make(r) {
          const pretty = (v) => (v.includes('e') ? parseFloat(v).toString() : v);
          let x, n, res, shown;
          // Reroll answers that plain digits cannot show at n sig figs, such as 200 for 2 sig figs,
          // and starting numbers with no digit to round away. The nudge makes a final 5 round up.
          do {
            x = r.num(1.0001, 9.9999, 4) * Math.pow(10, r.int(-3, 2));
            n = r.int(2, 3);
            shown = parseFloat(x.toPrecision(5)).toString();
            res = (parseFloat(shown) * (1 + 1e-12)).toPrecision(n);
          } while (countSF(pretty(res)) !== n || countSF(shown) <= n);
          const m = r.mc(pretty(res), [pretty(x.toPrecision(n + 1)), pretty(x.toPrecision(n + 2)), pretty(x.toPrecision(n - 1)), pretty((parseFloat(res) * 10).toPrecision(n))]);
          return {
            q: `Round ${shown} to ${n} significant figures.`,
            choices: m.choices, answer: m.answer,
            steps: [`Start at the first nonzero digit and count ${n} digits.`, `Look at the next digit to decide whether to round up. The answer is <b>${pretty(res)}</b>.`],
          };
        },
      },
    ],

    cards: [
      { front: 'Name the prefixes from mega to nano, with their powers.', back: 'mega $10^{6}$, kilo $10^{3}$, deci $10^{-1}$, centi $10^{-2}$, milli $10^{-3}$, micro $10^{-6}$, nano $10^{-9}$.' },
      { front: 'What is proper scientific notation?', back: '$a \\times 10^{n}$, where $1 \\le a < 10$ and $n$ is a whole number.' },
      { front: 'Accuracy vs precision?', back: 'Accuracy is closeness to the true value. Precision is closeness of repeated results to each other.' },
      { front: 'How do you read a meniscus?', back: 'Read the bottom of the curve, at eye level, estimating one digit past the lines.' },
      { front: 'Which zeros are significant?', back: 'Zeros between digits, and end zeros when there is a decimal point. Leading zeros never are.' },
      { front: 'Sig fig rule for adding and subtracting?', back: 'Keep the fewest decimal places.' },
      { front: 'Sig fig rule for multiplying and dividing?', back: 'Keep the fewest significant figures.' },
      { front: 'Do exact numbers limit sig figs?', back: 'No. Counted numbers and defined conversions have unlimited sig figs.' },
      { front: 'How many sig figs do 100, 100. and $1.00 \\times 10^{2}$ have?', back: '1, 3 and 3. Some teachers call plain 100 ambiguous.' },
    ],

    terms: [
      { term: 'SI units', def: 'The international system of measurement units, such as the meter, kilogram, second, kelvin and mole.' },
      { term: 'Prefix', def: 'A word part that multiplies a unit by a power of ten, such as kilo for $10^{3}$ or milli for $10^{-3}$.' },
      { term: 'Scientific notation', def: 'Writing a number as $a \\times 10^{n}$, with $a$ from 1 up to but not including 10.' },
      { term: 'Accuracy', def: 'How close a measurement is to the true value.' },
      { term: 'Precision', def: 'How close repeated measurements are to each other.' },
      { term: 'Meniscus', def: 'The curved surface of a liquid in a narrow tube. For water, read the bottom of the curve.' },
      { term: 'Parallax', def: 'A reading error caused by viewing a scale from an angle rather than straight on.' },
      { term: 'Significant figures', def: 'All the digits in a measurement that are known for certain, plus one estimated digit.' },
      { term: 'Exact number', def: 'A counted or defined number, which has unlimited significant figures.' },
    ],
  });
})();
