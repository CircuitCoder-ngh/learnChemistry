#!/usr/bin/env node
/* Screenshot and health-check tool for The Mole Hole. No shared server or browser: every run
   starts its own static server and its own headless Chromium, so runs can overlap safely.

   node tools/shot.cjs <page.html> [--out dir] [--width 1280] [--height 900] [--dark] [--reduced]
        [--full]              full-page screenshot (default viewport only)
        [--sel "#id"]         screenshot just this element (repeatable)
        [--stories]           contact sheet of every scene of every story on the page
        [--benches]           screenshot each .bench element after --wait ms
        [--click "#sel"]      click before capture (repeatable, runs in order)
        [--eval "js"]         run JS in the page before capture
        [--wait 1200]         ms to wait after load
        [--scroll "#sel"]     scroll this element into view before capture

   Always prints: console errors, page errors, failed local requests, and horizontal overflow. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PW_PATH || 'playwright');

const args = process.argv.slice(2);
const page_ = args[0];
const flag = (name) => args.includes('--' + name);
const opt = (name, d) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : d; };
const all = (name) => args.flatMap((a, i) => (a === '--' + name ? [args[i + 1]] : []));

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(opt('out', process.env.SHOT_DIR || '/tmp/shots'));
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const width = +opt('width', 1280), height = +opt('height', 900);
  const ctx = await browser.newContext({
    viewport: { width, height }, deviceScaleFactor: +opt('dpr', 1),
    colorScheme: flag('dark') ? 'dark' : 'light', reducedMotion: flag('reduced') ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + (e.stack || e.message)));
  page.on('requestfailed', (r) => { if (r.url().startsWith(base)) problems.push('failed: ' + r.url()); });
  page.on('response', (r) => { if (r.url().startsWith(base) && r.status() >= 400) problems.push(r.status() + ': ' + r.url().replace(base, '')); });

  // Canvas text lint: flags labels that fall off the canvas, overlap, or are too small to read.
  await page.addInitScript(() => {
    const L = (window.__lint = { on: false, boxes: new Map(), issues: new Set(), where: '' });
    L.begin = (c) => { if (L.on) L.boxes.set(c, []); };
    L.end = (c) => {
      if (!L.on) return;
      const b = L.boxes.get(c) || [];
      for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
        const A = b[i], B = b[j];
        if (A.s === B.s || A.s.length < 3 || B.s.length < 3) continue;
        const ox = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0), oy = Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0);
        if (ox > 3 && oy > 3) L.issues.add(`${L.where}: overlapping text "${A.s}" and "${B.s}"`);
      }
    };
    const orig = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (str, x, y, mw) {
      try {
        if (L.on && this.canvas.dataset && this.canvas.dataset.vw && this.globalAlpha > 0.2) {
          const s = String(str);
          const T = this.getTransform(), scale = Math.hypot(T.a, T.b);
          const base = this.canvas.width / +this.canvas.dataset.vw;
          const px = parseFloat((this.font.match(/([\d.]+)px/) || [])[1] || 0);
          const vpx = (px * scale) / base;
          if (s.trim().length >= 3 && vpx < 15.5) L.issues.add(`${L.where}: small text (${vpx.toFixed(0)}px, min 20) "${s}"`);
          const w = this.measureText(s).width * scale, h = px * scale;
          const P = T.transformPoint(new DOMPoint(x, y));
          const al = this.textAlign;
          const x0 = al === 'center' ? P.x - w / 2 : al === 'right' || al === 'end' ? P.x - w : P.x;
          const bl = this.textBaseline;
          const y0 = bl === 'middle' ? P.y - h / 2 : bl === 'top' ? P.y : P.y - h * 0.8;
          const pad = 2;
          if (s.trim() && (x0 < -pad || x0 + w > this.canvas.width + pad || y0 < -pad || y0 + h > this.canvas.height + pad)) L.issues.add(`${L.where}: text off the canvas "${s}"`);
          const list = L.boxes.get(this.canvas);
          if (list && s.trim()) list.push({ s, x0: x0 + w * 0.08, x1: x0 + w * 0.92, y0: y0 + h * 0.14, y1: y0 + h * 0.86 });
        }
      } catch (e) { /* lint must never break the page */ }
      return mw === undefined ? orig.call(this, str, x, y) : orig.call(this, str, x, y, mw);
    };
  });

  await page.goto(`${base}/${page_}${page_.includes('?') ? '&' : '?'}shot`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(+opt('wait', 1200));
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
  const name = page_.replace(/[^a-z0-9-]+/gi, '_').replace(/_html.*/, '') + (flag('dark') ? '-dark' : '') + (width < 700 ? '-m' : '');

  for (const js of all('eval')) await page.evaluate(js);
  for (const sel of all('click')) { await page.click(sel); await page.waitForTimeout(300); }
  const scrollSel = opt('scroll');
  if (scrollSel) { await page.locator(scrollSel).first().scrollIntoViewIfNeeded(); await page.waitForTimeout(500); }

  const saved = [];
  if (flag('stories')) {
    const count = await page.evaluate(() => (window.Lab ? Lab._stories.length : 0));
    for (let si = 0; si < count; si++) {
      await page.evaluate((i) => Lab._stories[i].host.scrollIntoView({ block: 'center', behavior: 'instant' }), si);
      await page.waitForTimeout(160);
      const n = await page.evaluate((i) => Lab._stories[i].scenes.length, si);
      const frames = [];
      for (let k = 0; k < n; k++) {
        const data = await page.evaluate(async ([i, s]) => {
          const st = Lab._stories[i];
          window.__lint.on = true; window.__lint.where = `story ${i + 1} step ${s + 1}`;
          st.go(s, true);
          await new Promise((r) => setTimeout(r, 130));
          window.__lint.on = false;
          return { img: st.stage.canvas.toDataURL('image/jpeg', 0.82), say: st.scenes[s].say };
        }, [si, k]);
        frames.push(data);
      }
      const sheet = await ctx.newPage();
      await sheet.setViewportSize({ width: 1500, height: 900 });
      await sheet.setContent(`<!doctype html><body style="margin:0;background:#111;color:#eee;font:14px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px">${frames.map((f, i) => `<div><img src="${f.img}" style="width:100%;display:block"><div style="padding:4px 2px"><b>${i + 1}.</b> ${f.say.replace(/\$/g, '')}</div></div>`).join('')}</body>`);
      await sheet.waitForTimeout(150);
      const file = path.join(OUT, `${name}-story${si + 1}.png`);
      await sheet.screenshot({ path: file, fullPage: true });
      await sheet.close();
      saved.push(file);
    }
    await page.evaluate(() => Lab._stories.forEach((s) => s.go(0, true)));
  }
  if (flag('benches')) {
    const benches = await page.locator('.bench').all();
    let i = 0;
    for (const b of benches) {
      i++;
      await b.scrollIntoViewIfNeeded();
      await page.waitForTimeout(+opt('benchwait', 900));
      await page.evaluate((n) => { window.__lint.on = true; window.__lint.where = 'bench ' + n; }, i);
      await page.waitForTimeout(140);
      await page.evaluate(() => { window.__lint.on = false; });
      const file = path.join(OUT, `${name}-bench${i}.png`);
      await b.screenshot({ path: file });
      saved.push(file);
    }
  }
  let n = 0;
  for (const sel of all('sel')) {
    n++;
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const file = path.join(OUT, `${name}-sel${n}.png`);
    await el.screenshot({ path: file });
    saved.push(file);
  }
  if (!flag('stories') && !flag('benches') && !all('sel').length) {
    const file = path.join(OUT, `${name}${flag('full') ? '-full' : ''}.png`);
    await page.screenshot({ path: file, fullPage: flag('full') });
    saved.push(file);
  }
  const overflow = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const bad = [];
    if (document.documentElement.scrollWidth > w + 1) bad.push('page scrollWidth ' + document.documentElement.scrollWidth + ' > ' + w);
    document.querySelectorAll('main *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > w + 2 && !el.closest('.katex,.tbl-wrap,.formula-body,.practice-q,.katex-display,.v3d-labels,[data-overflow-ok]')) {
        const tag = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '');
        if (bad.length < 8) bad.push('overflow: ' + tag + ' right=' + Math.round(r.right));
      }
    });
    document.querySelectorAll('.katex-error').forEach((el) => bad.push('TeX error: ' + (el.title || el.textContent).slice(0, 160)));
    const walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const v = walker.currentNode.nodeValue, pe = walker.currentNode.parentElement;
      if (pe && pe.closest('script,style,.katex,details[data-raw]')) continue;
      if (/\\ce\{|\\frac|\\text\{|\$[^$\s]/.test(v)) bad.push('unrendered math: ' + v.trim().slice(0, 90));
    }
    return bad.concat([...window.__lint.issues]);
  });
  saved.forEach((f) => console.log('saved ' + f));
  const unique = [...new Set(problems)];
  console.log(unique.length || overflow.length ? 'PROBLEMS:\n' + unique.concat(overflow).join('\n') : 'no errors, no overflow, canvas text clean');
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
