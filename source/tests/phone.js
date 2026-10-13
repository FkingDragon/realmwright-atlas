const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 1500 } })); });
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2800);
  const shot = (n) => p.screenshot({ path: '/tmp/claude-0/ph/' + n + '.png' });
  const overflow = () => p.evaluate(() => { const bad = []; for (const el of document.querySelectorAll('#inspector *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed') bad.push(el.tagName + '.' + el.className + ' ' + Math.round(r.right)); } return { page: document.documentElement.scrollWidth > innerWidth + 1, bad: bad.slice(0, 5) }; });
  await shot('1_map');
  // settlement panel with history
  const sid = await p.evaluate(() => { const A = window.__A; const s = A.SET.filter((x) => x.tier === 3)[1]; A.setTool('explore'); const bt = document.createElement('button'); bt.dataset.town = s.id; document.body.appendChild(bt); bt.click(); bt.remove(); return s.id; });
  await p.waitForTimeout(900); await shot('2_town');
  let o = await overflow(); ok(!o.page && !o.bad.length, 'town panel fits the phone screen ' + JSON.stringify(o.bad));
  await p.evaluate(() => { const h = [...document.querySelectorAll('#inspector h3')].find((x) => x.textContent === 'History'); if (h) h.scrollIntoView(); }); await p.waitForTimeout(200); await shot('3_history');
  // people: activity tab
  await p.evaluate((id) => { const A = window.__A; A.setTool('people'); A.people.sid = id; A.people.tab = 'activity'; A.people.npc = null; A.renderPanel(); }, sid);
  await p.waitForTimeout(800); await shot('4_activity');
  o = await overflow(); ok(!o.page && !o.bad.length, 'activity tab fits ' + JSON.stringify(o.bad));
  // hero basics with 2024 rules
  await p.evaluate(() => { const A = window.__A; const h = A.newHero(true); h.rules = '2024'; A.quickBuild(h, 'wizard'); A.heroes.list.push(h); A.heroes.cur = h.id; A.heroes.step = 'basics'; A.setTool('heroes'); A.renderPanel(); });
  await p.waitForTimeout(500); await shot('5_hero');
  o = await overflow(); ok(!o.page && !o.bad.length, 'hero basics fits ' + JSON.stringify(o.bad));
  await p.evaluate(() => { const A = window.__A; A.heroes.step = 'sheet'; A.renderPanel(); }); await p.waitForTimeout(300); await shot('6_sheet');
  o = await overflow(); ok(!o.page && !o.bad.length, 'hero sheet fits ' + JSON.stringify(o.bad));
  // world menu
  await p.evaluate(() => { const A = window.__A; A.setTool('explore'); }); await p.waitForTimeout(200);
  await p.click('#btnWorld'); await p.waitForTimeout(400); await shot('7_world');
  const wb = await p.evaluate(() => { const r = document.getElementById('worldBody').getBoundingClientRect(); return [r.left, r.right, innerWidth]; });
  ok(wb[0] >= 0 && wb[1] <= wb[2] + 1, 'World menu fits the screen ' + JSON.stringify(wb));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  // player mode pill
  await p.evaluate(() => { window.__A.campaign.mode = 'player'; window.__A.applyMode(); }); await p.waitForTimeout(200);
  const pill = await p.evaluate(() => { const el = document.querySelector('.mode-pill'); if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); const hits = [...document.querySelectorAll('button, .tool')].filter((x) => { const q = x.getBoundingClientRect(); return q.width && !(q.right < r.left || q.left > r.right || q.bottom < r.top || q.top > r.bottom); }).map((x) => x.id || x.className).slice(0, 4); return { vis: cs.display !== 'none' && r.width > 0, r: [r.left, r.top, r.right, r.bottom].map(Math.round), hits }; });
  await shot('8_player');
  ok(pill && pill.vis && !pill.hits.length, 'player-view pill shows and covers no buttons ' + JSON.stringify(pill));
  // market rings and monsters on a desktop-sized region view
  console.log('errors', errs.length ? errs : 'none');
  await b.close();
})();
