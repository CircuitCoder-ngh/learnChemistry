# The Mole Hole

A free, fully animated website that teaches a complete college Chemistry 101 course. Moe, a mole in a lab coat, guides you down through a cutaway burrow where each chamber is one topic. Every lesson pairs step-by-step animated stories with labs you can play with, then a practice gym that generates endless problems with worked solutions. Every right answer discovers the next element, all the way to 118.

## What is in it

| Page | What it does |
| --- | --- |
| `index.html` | Home: a pond of atoms you drag together to build molecules, then the burrow course map |
| `<lesson>.html` | 48 lessons, from matter and measurement through bonding and gases, plus next-term bonus topics |
| `exam.html` | Timed practice exam with fresh numbers, scored topic by topic, with worked solutions |
| `periodic-table.html` | Interactive periodic table and your element collection |
| `flashcards.html` | Spaced-repetition cards for every lesson |
| `cheat-sheet.html` | Printable formula sheet with solubility rules, ion tables and more |
| `glossary.html` | Searchable terms |
| `movie.html` | The whole course as one narrated animated film |
| `about.html` | Sources and credits |

`docs/CURRICULUM.md` lists every lesson and why the course is shaped the way it is.

## Running it locally

The site is plain HTML, CSS and JavaScript with no build step. Serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly from disk also works.

## Publishing on GitHub Pages

1. Push this folder to a GitHub repository.
2. On GitHub, open **Settings → Pages**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`, and save.
3. After a minute the site is live at `https://<your-user>.github.io/<repo>/`.

The empty `.nojekyll` file tells GitHub Pages to serve the files as they are.

## Project layout

```
index.html, <lesson>.html   One page per lesson, all at the root
assets/css/site.css         Shared design system
assets/js/lab.js            Course map, chrome, progress, element collection, stages, story player
assets/js/art.js            Drawing library: atoms with faces, glassware, flames, zoom bubbles
assets/js/moe.js            The mascot, as both SVG and canvas
assets/js/bank.js           Quizzes, practice gym, generators
assets/js/sim.js            Particle physics
assets/js/chem3d.js         3D molecules, real orbitals and crystal lattices, on three.js
assets/js/pages/<id>.js     Each lesson's figures
assets/js/bank/<id>.js      Each lesson's questions
assets/js/data/elements.js  Element data from PubChem
assets/vendor/              three.js r149
docs/AUTHORING.md           How to write a lesson: voice, visual rules, full API
tools/                      Quality checks
```

To add a lesson, add it to `Lab.course` in `lab.js`, then follow `docs/AUTHORING.md`.

Fonts load from Google Fonts and equation rendering from KaTeX on jsDelivr. Everything else is local, and progress is kept in the browser's local storage.

## Quality checks

The tools need Playwright and KaTeX: `npm install --no-save playwright katex@0.16.11`.

```bash
node tools/audit.cjs            # every lesson exists and meets the anatomy rules, links resolve
node tools/check-banks.cjs      # hammers every problem generator, renders all math
node tools/shot.cjs mole.html --stories --benches    # screenshots plus canvas text lint
node tools/e2e.cjs              # plays through the site with real clicks, typing and dragging
```

## Accuracy

Atomic data comes from PubChem and covalent radii from Cordero et al. (2008). Lessons are a study aid and simplify where marked. Your instructor's rules and tables always win.
