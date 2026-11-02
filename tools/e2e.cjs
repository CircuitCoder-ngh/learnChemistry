/* End-to-end test: plays through the site as a learner would, with real clicks, typing and dragging.
   node tools/e2e.cjs */
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require(process.env.PW_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..');
const srv=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));const ff=f.endsWith('/')?f+'index.html':f;if(!fs.existsSync(ff)||fs.statSync(ff).isDirectory()){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[path.extname(ff)]||'application/octet-stream'});fs.createReadStream(ff).pipe(r);});
const ok=(n,c,x='')=>console.log((c?'PASS ':'FAIL ')+n+(x?'  ('+x+')':''));
(async()=>{await new Promise(r=>srv.listen(0,r));const base=`http://127.0.0.1:${srv.address().port}`;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(base+'/mole.html');await p.waitForTimeout(800);
const count=()=>p.$eval('[data-element-count]',e=>+e.textContent);
// Story transport
const st=p.locator('#story-mole');await st.scrollIntoViewIfNeeded();
const say0=await st.locator('.story-say').innerText();await st.locator('.story-next').click();await p.waitForTimeout(150);const say1=await st.locator('.story-say').innerText();ok('story Next changes the caption',say0!==say1);
await st.locator('.story-back').click();await p.waitForTimeout(150);ok('story Back returns',(await st.locator('.story-say').innerText())===say0);
await st.locator('.story-pip').nth(3).click();await p.waitForTimeout(150);ok('story pip jumps',(await st.locator('.story-pip.is-on').count())===1);
await st.locator('.story-play').click();await p.waitForTimeout(200);ok('story play control responds',/Pause/.test(await st.locator('.story-play').getAttribute('aria-label')));await st.locator('.story-play').click();
// Slider and segmented control
await p.locator('#scale-sub button[data-value="Au"]').click();await p.waitForTimeout(100);ok('substance button updates mass',/196\.97/.test(await p.locator('#scale-mass').innerText()),await p.locator('#scale-mass').innerText());
await p.locator('#scale-n').evaluate(e=>{e.value=2;e.dispatchEvent(new Event('input',{bubbles:true}))});ok('slider updates mass',/393\.94/.test(await p.locator('#scale-mass').innerText()));
// Worked example reveal
const w=p.locator('.worked').first();const before=await w.locator('ol > li:visible').count();await w.locator('.worked-next').click();ok('worked example reveals a step',(await w.locator('ol > li:visible').count())===before+1);
// Quiz: correct awards an element, wrong does not
const c0=await count();const q=p.locator('.quiz-item').first();await q.locator('.quiz-opt').nth(0).click();await p.waitForTimeout(150);ok('quiz right answer discovers an element',(await count())===c0+1,`count ${c0}->${await count()}`);
ok('element toast names the element',/You discovered Hydrogen/.test(await p.locator('.element-toast').first().innerText()));
const q2=p.locator('.quiz-item').nth(1);await q2.locator('.quiz-opt').nth(0).click();await p.waitForTimeout(100);ok('quiz wrong answer gives no element',(await count())===c0+1);ok('quiz shows explanation',await q2.locator('.quiz-why').isVisible());
// Practice: solve a numeric problem by reading the generator through the same API
const prac=p.locator('.practice');await prac.scrollIntoViewIfNeeded();
await prac.locator('.chip',{hasText:'Molar mass'}).click();await p.waitForTimeout(120);
const qtxt=await prac.locator('.practice-q').innerText();
const f=await prac.locator('.practice-q .katex-mathml annotation').first().evaluate(e=>e.textContent).catch(()=>null);
const formula=(f||'').replace(/\\ce\{|\}/g,'');const ans=await p.evaluate(x=>Bank.molarMass(x),formula);
await prac.locator('input.practice-input').fill(String(ans.toFixed(2)));await prac.locator('button[type=submit]').click();await p.waitForTimeout(150);
ok('practice accepts correct typed answer',/Correct/.test(await prac.locator('.practice-feedback').innerText()),formula+' = '+ans.toFixed(2));ok('practice shows worked steps',await prac.locator('.practice-steps').isVisible());
await prac.locator('.next-btn').click();await p.waitForTimeout(120);ok('practice serves another problem',await prac.locator('.practice-q').isVisible());
await prac.locator('.chip',{hasText:'Grams to moles'}).click();await p.waitForTimeout(100);await prac.locator('input.practice-input').fill('6.02x10^23');await prac.locator('button[type=submit]').click();await p.waitForTimeout(100);ok('wrong answer gets a hint first',/Close the gap|Not yet/.test(await prac.locator('.practice-feedback').innerText()));
await prac.locator('input.practice-input').fill('abc');await prac.locator('button[type=submit]').click();await p.waitForTimeout(80);ok('non-number is rejected kindly',/Enter a number/.test(await prac.locator('.practice-feedback').innerText()));
// Finish lesson
const c1=await count();await p.locator('.complete-btn').click();await p.waitForTimeout(200);ok('finishing a lesson pays 3 elements',(await count())===c1+3,`${c1}->${await count()}`);ok('rail marks lesson done',await p.locator('.rail-link[data-id="mole"].is-done').count()===1);
await p.locator('.complete-btn').click();await p.locator('.complete-btn').click();await p.waitForTimeout(100);ok('refinishing does not pay twice',(await count())===c1+3);
// Theme persists, nav works
const dark0=await p.evaluate(()=>Lab.theme());await p.locator('.theme-btn').click();ok('theme toggles',(await p.evaluate(()=>Lab.theme()))!==dark0);
await p.goto(base+'/stoichiometry.html');await p.waitForTimeout(400);ok('progress persists across pages',(await count())===c1+3);ok('theme persists across pages',(await p.evaluate(()=>Lab.theme()))!==dark0);
await p.locator('.pager .is-next').click();await p.waitForLoadState();ok('pager goes to next lesson',/limiting/.test(p.url()));
// Home shows progress and pond bonds by real drag
await p.goto(base+'/index.html');await p.waitForTimeout(900);ok('home offers Keep digging',/Keep digging/.test(await p.locator('#pond-go').innerText()));ok('home burrow lists all lessons',(await p.locator('.chamber-link').count())===48);ok('home marks finished lesson',(await p.locator('.chamber-link[data-id="mole"].is-done').count())===1);
const pos=await p.evaluate(()=>{const A=__pond.atoms();const r=document.getElementById('pond').getBoundingClientRect();const o=A.find(a=>a.sym==='O'&&a.bonds===0);const h=A.find(a=>a.sym==='H'&&a.bonds===0);return{ox:o.x+r.left,oy:o.y+r.top,hx:h.x+r.left,hy:h.y+r.top};});
await p.mouse.move(pos.hx,pos.hy);await p.mouse.down();await p.mouse.move((pos.hx+pos.ox)/2,(pos.hy+pos.oy)/2,{steps:6});await p.mouse.move(pos.ox,pos.oy,{steps:10});await p.waitForTimeout(250);await p.mouse.up();ok('dragging atoms forms a bond',await p.evaluate(()=>__pond.bonds().length)>=1);
// Exam end to end
await p.goto(base+'/exam.html');await p.waitForFunction(()=>!document.getElementById('exam-start').disabled);await p.locator('.exam-choice[data-n="10"]').click();await p.locator('#exam-start').click();await p.waitForTimeout(200);ok('exam starts',await p.locator('#exam-run').isVisible());ok('exam has 10 questions',(await p.locator('.exam-cell').count())===10);
for(let i=0;i<10;i++){const opt=p.locator('.exam-opt').first();if(await opt.count())await opt.click();else await p.locator('#exam-text').fill('x');if(i<9)await p.locator('#exam-next').click();}
await p.locator('#exam-submit').click();await p.waitForTimeout(300);ok('exam results appear',await p.locator('#exam-results').isVisible());ok('exam gives a percentage',/%$/.test(await p.locator('#score-num').innerText()),await p.locator('#score-num').innerText());ok('exam lists topics',(await p.locator('.topic-row').count())>0);
console.log('page errors:',errs.length?errs.slice(0,5):'none');await b.close();srv.close();})().catch(e=>{console.error('E2E CRASH',e.message);process.exit(1);});
