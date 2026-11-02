# Authoring guide

How to build a lesson for The Mole Hole. Read this fully, then read the reference lesson: `mole.html`, `assets/js/pages/mole.js`, `assets/js/bank/mole.js`. Copy its patterns. `docs/CURRICULUM.md` says what each lesson must cover.

## The brief

A free website that teaches a full college Chemistry 101 course. It should be so clear that a curious child could follow it, and so complete that a struggling college student could pass by using it. Beautiful, visual, and fun.

**The theme.** You are underground in the laboratory of Moe, a mole who is a chemist. (The joke is that the mole is chemistry's most important unit.) Moe is the warm, slightly silly guide. Atoms have faces and moods. Every correct answer "discovers" the next element, up to 118.

## Voice and words

- Teach to a bright 10-year-old first, then give the exam language. Everyday analogy, then the real term in bold, then the formal version. Never leave out the formal term: they have to pass an exam.
- Short sentences. One idea at a time. Active voice. Plain verbs. Say "you".
- Text is the second choice. If an idea can be shown, show it. A section is usually one or two short paragraphs, then a figure. No walls of text. No paragraph over about 4 lines.
- Sentence case for all headings and labels. No ALL CAPS labels.
- Do not write spaced em dashes ("word — word"). Do not append arrows to links or buttons. Do not chain things with middle dots. Buttons say exactly what they do.
- Moe jokes are welcome and should be dry, short, and rare enough to land: at most two or three per lesson. Humor never gets in the way of the concept.
- Use they/them for any person whose pronouns you do not know, and write around pronouns for Moe.

## Accuracy

This site teaches people who cannot tell when it is wrong, so every number and claim must be right.
- Use `EL.Fe.mass` and friends for atomic data (PubChem values) rather than typing masses. In worked examples rounding to 2 decimals is fine. Practice answer tolerance covers small differences between tables.
- Only state data you are confident of (standard enthalpies, solubilities, specific heats, bond energies, spectra). Compute anything derivable and check it. If a value varies between textbooks, say so or round it.
- Check sig figs in worked examples. Check every balanced equation by counting atoms. Check the wrong answers in quizzes are actually wrong.
- Models get a one-line honest label when simplified ("A simplified 2D model").
- Do not repeat classroom myths. Where a common simplification is fine for this level, keep it, and note it if an exam may probe it.

## Teaching rules

From chemistry education research. See CURRICULUM.md for sources.
1. **Three views.** Link what you see, the particles, and the symbols. `Art.zoom` is the signature view: a magnifier from a beaker into its particles. Put the equation on the same stage.
2. **Learner-paced steps.** Stories advance when the learner presses Next. Each step shows one change. One or two short sentences per caption.
3. **Signal.** Highlight, animate or circle exactly what the caption is about. Dim the rest.
4. **Labels on the thing.** Never a separate legend when a direct label fits.
5. **Name parts first**, then run the process.
6. **Hands on.** Give at least two things to play with where changing an input visibly changes the outcome right away. Ask a question the sim can answer ("Can you make it run out of oxygen?").
7. **Show every algebra step and every unit canceling.** Weak math is a top reason students fail.
8. **Confront misconceptions head-on.** Make the wrong idea fail visibly, then call it out in an `Exam trap`.

## Lesson anatomy

Follow this order (loosely, as the content needs). Minimums for a core lesson:

| Part | Markup | Minimum |
| --- | --- | --- |
| Banner | `header.lesson-head` | Title, one-sentence plain promise, Moe, optional `.exam-chip` |
| Goals | `ul.goals` | 3 to 4 things they will be able to do |
| Stories | `<div id="story-x">` + `Lab.story` | 2 stories with 4 or more steps each (bonus lessons: 1) |
| Labs | `figure.bench` + `Lab.stage` | 2 interactive benches (bonus lessons: 1) |
| Big idea | `.big-idea` | At least 1 |
| Moe says | `.moe-says` | At least 1, not more than 4 |
| Exam trap | `.trap` | At least 1, based on a real common mistake |
| Formula | `.formula` | One for each equation they must use |
| Worked example | `.worked` | 2 in calculation lessons, each step on its own line |
| Quiz | `<div data-quiz="id">` | 6 or more concept questions |
| Practice gym | `<div data-practice="id">` | 3 or more generators, 5 or more in calculation lessons |
| Pocket card | `.pocket` | 3 to 6 bullets |
| Lesson end | `<div id="lesson-end"></div>` | Exactly this, last thing in main |

Each `h2` needs an `id`; set `data-short` to a short label for the side rail. Every `h2` becomes a rail link.

## Page template

Copy `mole.html` exactly for the head. Change the title, description, `data-page`, and the two lesson scripts. Pages needing particle physics add `assets/js/sim.js` before the page script; pages needing 3D add `assets/vendor/three.min.js` and `assets/js/chem3d.js`. `data-page` must equal the lesson id in `Lab.course`. Links between lessons are `<id>.html`.

Do not add page CSS unless really needed. If so, add `assets/css/lesson-<id>.css`, keep it tiny, use the existing tokens, and support dark mode. Tables use `<div class="tbl-wrap"><table class="tbl">`.

**Math and chemistry notation.** Anywhere in text: `$\ce{2H2 + O2 -> 2H2O}$`, `$x^2$`, display `$$...$$`. In JS strings, double the backslashes: `'$\\ce{H2O}$'`. A literal dollar is `\$`. Canvas text cannot use KaTeX: use `Art.formula` for formulas and Unicode superscripts (`10²³`).

## Visual rules

These are what separate gorgeous from amateur. Every figure must meet them.

- **Stage size.** Stages are 800 by 450 virtual units unless you pass `w`, `h`. They scale to fit, and on a phone one unit is about 0.45 px.
- **Big text.** Canvas text is **20 or larger, ideally 24 to 34**. Headline numbers 40 to 60 with `font:'display'`. If labels will not fit at this size, you have too many labels: cut them or move them to the caption. The check tool flags smaller text.
- **Fill the frame.** Use the whole stage. Compose content across at least 70 percent of it, balanced around the center. Do not leave the bottom third empty.
- **Few things.** 3 to 7 focal objects, not 20. For particle swarms, fewer big ones beat many tiny ones.
- **No overlaps.** No text over text, no text across a busy object without `halo:true`. Check every step at rest. Moe must not sit on content.
- **Atoms are always their element color.** Never recolor atoms for decoration. Use `Art.atom`, `Art.molecule`.
- **Faces.** Atoms with faces are the emotional hook. Give faces to the main character atoms and to any atom whose mood teaches something (grumpy because it lacks an electron, happy when bonded). Leave them off crowds. Faces need radius 18 or more. Set `look` so eyes point at what matters.
- **Molecules.** In swarms use `style:'fill', atomScale:1.28` with a bond length of 30 to 40: chunky, friendly, readable. Use ball-and-stick (the default) when the bonds are the point, with bond length 60 or more.
- **Motion teaches.** Move only what matters. Ease everything (`Lab.ease`), never linear pops. Stagger items with `Lab.seg(p, a, b)`. Give atoms a little idle life with `t`, using `Lab.wander`. Thermal motion should reflect temperature. Vibrate solids, tumble gases.
- **Backgrounds.** Stage backgrounds are always dark. `bg:'micro'` for particle scenes, `bg:'lab'` for lab bench scenes (`Art.bgLab` puts the bench at y = H - 70), or a custom gradient.
- **Color semantics on stage**: `Art.C.pink` the main highlight, `C.sun` key numbers, `C.cyan` electrons and the micro view, `C.leaf` right or good, `C.red` wrong or danger, `C.fire` heat, `C.water` water.
- **Consistency.** Reuse glassware from `Art`. If you need new art, write a small local helper with the same look: soft gradients, a highlight, a thin dark outline (`#1A0F2E`).

**Scene rule.** A story scene's `draw(g, p, t, info)` must be a pure function of `p` and `t`. No saved state between frames. `p` runs 0 to 1 over `dur`, then holds at 1 while `t` keeps rising for idle motion. At `p = 1` the scene must look complete: that is what Back, Next, screenshots and reduced-motion users see. Benches can keep state.

**Performance.** Stages only run while visible, which is free. Keep each frame light: under about 300 atoms. Avoid creating gradients per particle: `Art.ball` and `Art.atom` are cached sprites.

## API reference

Read the source for details; these are short and well commented. `assets/js/lab.js`, `art.js`, `bank.js`, `sim.js`, `chem3d.js`.

### Lab (lab.js)

- `Lab.ready(fn)`: run page code. Wrap your whole page script in this.
- `Lab.$`, `Lab.$$`, `Lab.clamp(v, lo=0, hi=1)`, `Lab.lerp(a, b, t)`.
- `Lab.seg(p, a, b)`: p mapped to 0..1 in a window. Example: `const q = Lab.ease.out(Lab.seg(p, 0.2, 0.5));`
- `Lab.ease.linear/in/out/inOut/back/elastic/bounce`.
- `Lab.rand(seed)` repeatable 0..1. `Lab.wander(seed, t)` smooth -1..1.
- `Lab.fmt(n, decimals)`. `Lab.sig(x, sf)` text with sig figs (uses × 10ⁿ when needed).
- `Lab.stage(target, { w, h, bg, label, draw(g, t, dt, s), animate, onPointer(e), drag })`. Returns `s` with `s.redraw()`, `s.t`, `s.W`, `s.H`, `s.data`.
  - `label` is the alt text: always set it.
  - `animate:false` draws on demand. Otherwise it runs while visible.
  - `onPointer(e)`: `e.type` is `down`, `move`, `up`, or `hover`; `e.x`, `e.y` in virtual units. Set `drag:true` when the canvas needs dragging, including on touch. Make grab targets big, at least 50 units.
- `Lab.story(host, { title, w, h, bg, hold, scenes:[{ say, speak, dur, draw(g, p, t, { W, H, i, n, stage }) }] })`. Adds transport, narration, transcript. `say` may contain `<b>` and `$math$`. Bold words render yellow, so use them for the key term. Set `speak` if the caption reads badly aloud.
- `Lab.bind(input, output, fmt, onChange)`, for sliders. Calls `onChange` immediately.
- `Lab.segmented(el, onChange)`, for `.seg` buttons. Returns `{ set, value }`.
- `Lab.texString(html)` renders `$...$` in a string. `Lab.renderTex(element)` renders in an element. `Lab.fHTML('H2O')` makes sub/sup HTML.
- `Lab.collection.award(n)` discover elements. `Lab.confetti()`. `Lab.toast(html)`. `Lab.sound.pop/good/bad/fanfare()` (off unless the learner turns it on). Use `award` for genuine wins in games, not for every click.
- `Lab.store.get/set` for per-browser memory.
- `Lab.progress`, `Lab.course`, `Lab.lessons`, `Lab.familyColor(family)`.

### Art (art.js)

Everything takes the canvas context `g` first and draws in stage coordinates.

- Text: `Art.text(g, str, x, y, { size, color, align, base, weight, font:'display'|'body', halo, alpha })`, `Art.para(g, str, x, y, maxW, opts)` wrapped, `Art.formula(g, 'Ca(OH)2', x, y, { size, colorize, color, align, halo })`, supports `SO4^2-` and `->`, `Art.pill(g, str, x, y, { color, text, size, font, align })`, `Art.bubble(g, str, x, y, { w, size, side:'down'|'up'|'left'|'right', alpha })` where (x, y) is the tail tip.
- Atoms: `Art.atom(g, x, y, r, 'O', { face, look:[dx,dy], t, seed, label, charge:'2-', glow, alpha, color })`. Faces: `happy grin wow sad grumpy sleepy wink`. `Art.ball(g, x, y, r, color)`. `Art.face(...)`. `Art.electron(g, x, y, r)`, `Art.proton`, `Art.neutron`. `Art.elementColor('Na')`.
- Molecules: `Art.molecule(g, x, y, bondLen, 'H2O', { rot, style:'ball'|'fill', atomScale, face, faceAll, look, t, alpha, labels:false, bondColor })`. Known: H2 O2 N2 F2 Cl2 Br2 I2 HCl HF CO NO NaCl H2O H2S CO2 SO2 NO2 O3 NH3 CH4 H2O2 C2H5OH CH3OH C2H2 C2H4, plus any straight alkane such as C3H8. `Art.bond(g, x1, y1, x2, y2, { order, width, color })`. For anything else, compose with `Art.atom` and `Art.bond`.
- Glassware: `Art.beaker(g, cx, baseY, w, h, { level, liquid, ticks, label, inside(g, box) })`, returns `{ x0, x1, top, bottom, surface }`. `inside` is clipped to the liquid. `Art.flask` same. `Art.testTube(g, cx, topY, w, h, opts)`, `Art.burette(g, cx, topY, w, h, { level, liquid, open })` returns `{ tipX, tipY }`, `Art.cylinder(g, cx, baseY, w, h, { level, liquid, inside })` has a meniscus.
- Gear: `Art.bunsen(g, x, y, s, { air, flame, t })`, `Art.flame(g, x, y, h, t, { kind:'orange'|'blue', wide })`, `Art.thermometer(g, x, y, h, frac, { label })`, `Art.balance(g, x, y, w, tilt, { drawLeft(g,x,y), drawRight(g,x,y) })`, `Art.digitalScale(g, x, y, w, 'text')` returns `{ top }`, `Art.piston(g, cx, baseY, w, h, pos, { inside(g, box) })`, `Art.bulb(g, x, y, r, glow)`.
- Views: `Art.zoom(g, fromX, fromY, cx, cy, r, inside(g, cx, cy, R), { p, rim })` draws the magnifier and clips to it.
- Marks: `Art.arrow(g, x1, y1, x2, y2, { color, w, head, curve, p, dash, both, alpha })` with `p` for drawing it on, `Art.ring(g, x, y, r, { color, w, p, dash })`, `Art.strike(g, x1, y1, x2, y2, p, color, w)`, `Art.burst(g, x, y, p, { n, r, colors })`, `Art.star`, `Art.glow(g, x, y, r, color, a)`, `Art.bubbles(g, x0, x1, y1, y0, t, { n, r })`, `Art.smoke(g, x, y, t, { n, h, r, color, alpha, spread })`, `Art.meter(g, x, y, w, h, frac, { color })`, `Art.popIn(g, x, y, p, drawAtOrigin)`, `Art.round(g, x, y, w, h, r)` builds a rounded-rect path.
- Moe: `Art.moe(g, x, y, height, mood, { t, flip, bob })`. (x, y) is between the feet. Moods: `happy wave cheer point think wow oops`. Moe looks right by default, `flip:true` points left. At most one per story step, off to the side, in about a third of the steps. HTML slots: `<div class="moe-pic" data-moe="think"></div>`.
- Background: `Art.bg(g, W, H, 'micro'|'lab'|'soil', t)`, `Art.bgLab`, `Art.bench(g, W, y, h)`.
- Color: `Art.C` palette, `Art.mix(a, b, t)`, `Art.alpha(color, a)`, `Art.lum(color)`.
- Data: `ELEMENTS` (array), `EL.Na` with `z sym name mass cpk config en ie ea rvdw rcov ox state mp bp density family year group period x y block fact`. `mp`, `bp` are kelvin, `ie` and `ea` in eV, `rcov` covalent radius in pm: use `rcov` for atomic radius trends.

### Sim (sim.js)

`new Sim.Box({ x0, y0, x1, y1, speed, temperature, collide, gravity })`, then `.add({ n, r, kind, mass, data })`, `.step(dt)`, `.particles` (x y vx vy r kind mass rot), `.setBounds()`, `.setTemperature(k)`, `.pressure()`, `.ke()`, `.remove(kindOrFn, count)`, `.onHit = (a, b) => {}`, `.onWall`. `Sim.scatter(n, x0, y0, x1, y1, seed, minDist)` for stable layouts in pure scenes.

### Chem3D (chem3d.js)

`const v = Chem3D.viewer('#host', { height, distance, autorotate, label });` then `v.shape({ geom:'tetrahedral', center:'C', outer:'H', lone:[0], doubles:[] })` (geoms in `Chem3D.GEOM`: linear trigonal tetrahedral tbp octahedral), `v.molecule({ atoms:[{el,p:[x,y,z]}], bonds:[[i,j,order]], lonePairs:[{at,dir}], dipoles:[{from,to,color}] })`, `v.orbital(n, l, m, 'cloud'|'balloon')`, `v.lattice('sc'|'bcc'|'fcc'|'nacl', { fill })`, `v.labels([{ p:[x,y,z], text, cls }])`, `v.clear()`, `v.add(threeObject)`, `v.animate(fn(dt, t))`, `v.setAuto(bool)`, `v.rotateTo(x, y)`. Put the host in a `.bench-stage`.

### Bank (bank.js)

One file per lesson, `assets/js/bank/<id>.js`, calling `Bank.add('<id>', { quiz, gens, cards, terms })`:

```js
Bank.add('mole', {
  quiz: [{ q, options:[...], answer: 1, why }],
  gens: [{ id, title, make(r) { return { q, answer, unit, tol, hint, steps:[...] }; } }],
  cards: [{ front, back }],
  terms: [{ term: 'Molar mass', def: 'The mass of one mole of a substance, in g/mol.' }],
});
```

- `r` is the random helper: `r.int(a, b)`, `r.num(a, b, decimals)`, `r.pick(list)`, `r.shuffle(list)`, `r.sf(x, n)`, `r.mc(correct, [wrongs])` returns `{ choices, answer }`.
- Three problem kinds. Numeric: `{ q, answer, unit, tol, sf, answerText, hint, steps }`. `tol` is relative, default 0.02. Choice: `{ q, choices, answer, steps }`. Text: `{ q, accept:['NaCl'], placeholder, steps }`, matching ignores spaces and case.
- `Bank.molarMass('Ca(OH)2')`, `Bank.countAtoms('CuSO4·5H2O')`, using `EL`.
- `steps` is the full worked solution and is required. It is what teaches, so show every step with real numbers, not just the answer. Use the same method the lesson teaches.
- A generator must use its random inputs so problems really vary. Avoid degenerate combos such as a limiting-reactant problem with no clear answer. For choices, make sure no two can be equal after rounding (`r.mc` drops duplicates, so give extras).
- Quiz distractors should be the wrong answers real students give. `why` explains the right answer and, where useful, why the tempting one fails.
- `cards` at least 5; `terms` every new term in the lesson. The flashcards, glossary and exam simulator all read these banks. Put at least one exam-style calculation or concept problem among the generators.

## QA: required before you call a lesson done

Run everything from the project root. Replace `SHOTDIR` with a directory just for your own screenshots.

```bash
export NODE_PATH=<given in your brief>/node_modules
export SHOT_DIR=SHOTDIR

node tools/check-banks.cjs <lessonId>          # generators, TeX, answers
node tools/shot.cjs <id>.html --stories         # contact sheet per story, lints each step
node tools/shot.cjs <id>.html --benches --benchwait 1500
node tools/shot.cjs <id>.html --width 1400 --height 1000 --full
node tools/shot.cjs <id>.html --width 390 --height 844 --full   # phone
node tools/shot.cjs <id>.html --dark --width 1400 --full
```

The tool reports console errors, broken local files, horizontal overflow, TeX errors, unrendered math, and canvas text that is off-canvas, overlapping or too small. **All of it must come back clean.** Benches accept `--click` and `--eval` to set up a state before capture. `--sel "#id"` shoots one element.

**Then look at the pictures.** Open every contact sheet and bench shot with the Read tool. A clean lint does not mean it looks right. For each frame ask:
1. Could a 10-year-old tell what this picture shows without reading the caption?
2. Is it actually correct? Count the atoms. Check the arrows point the right way.
3. Does anything overlap, clip, or look lopsided? Is the frame filled?
4. Is the caption's subject visibly highlighted?
5. Would you be proud to show this?

Fix what fails, then shoot again. Do at least one full fix-and-reshoot pass on every figure. Also exercise the interactions: use `--click` or `--eval` to drive controls to extreme values (slider min and max, every option) and shoot those, since that is where things break. Make sure end states of games work.

## Ground rules for parallel work

- Other builders are working at the same time. **Only create or edit the files for your own lessons**: `<id>.html`, `assets/js/pages/<id>.js`, `assets/js/bank/<id>.js`, and an optional `assets/css/lesson-<id>.css`.
- **Do not edit** `lab.js`, `art.js`, `bank.js`, `sim.js`, `chem3d.js`, `moe.js`, `site.css`, `docs/`, `tools/`, or anyone else's lesson. If a shared helper has a bug or needs a feature, work around it locally with a helper in your page script, and mention it in your final report.
- Keep your scratch files in your own screenshot directory, never in the project.
- Do not run git commands.
- Your final report is short: which files you made, anything you could not verify, any shared-code bug you worked around, and any chemistry judgment call worth a second look. Do not paste code in it.

## Small conventions

- `.exam-chip` text is one of: `On every exam`, `Often tested`, `Sometimes tested`, `Bonus topic`.
- `Bank.loadAll()` returns a promise that loads every bank, for pages that aggregate them.
- Dynamic HTML you add after page load must go through `Lab.texString(...)` to render math.
