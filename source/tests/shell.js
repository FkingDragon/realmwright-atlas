// The v24 shell: a docked side panel (World › Realm › Place with each place's tabs) beside a framed map
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1366, height: 820 } });
  await ctx.addInitScript(() => { if (!localStorage.getItem('t-init')) { localStorage.setItem('t-init', '1'); localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 300 } })); } });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2600);
  await require('./canvas-mouse')(p);
  const txt = () => p.$eval('#inspector', (e) => e.innerText);
  const crumbs = () => p.$$eval('#inspector .crumbs > *', (els) => els.filter((e) => !e.classList.contains('sep')).map((e) => e.textContent));

  // the frame and the side panel
  const lay = await p.evaluate(() => { const s = document.querySelector('#side').getBoundingClientRect(), m = document.querySelector('#map').getBoundingClientRect(); return { side: [s.left, s.width], map: [m.left, m.width, m.height], over: document.documentElement.scrollWidth > innerWidth + 1 }; });
  ok(lay.side[0] === 0 && lay.map[0] >= lay.side[1] && lay.map[1] > 700 && !lay.over, 'the map sits in its own frame beside the side panel (' + Math.round(lay.map[1]) + ' × ' + Math.round(lay.map[2]) + ')');

  // World: the realms
  const realms = await p.$$eval('#inspector [data-nav="realm"]', (els) => els.length);
  const nR = await p.evaluate(() => window.__A.REALMS.length);
  ok(realms === nR && realms > 1, 'the World page lists every realm (' + realms + ')');
  // a realm: its places by size
  await p.click('#inspector [data-nav="realm"]'); await p.waitForTimeout(600);
  let t = await txt();
  ok(/Capital/i.test(t) && /Towns/i.test(t) && (await crumbs()).length === 2, 'a realm lists its places by size, under World › Realm');
  const before = await p.$$eval('#navList [data-nav="place"]', (e) => e.length);
  await p.fill('#nav-q', 'zzzz'); await p.waitForTimeout(150);
  ok(/No place matches/.test(await p.$eval('#navList', (e) => e.innerText)), 'the realm search filters its places');
  await p.fill('#nav-q', ''); await p.waitForTimeout(150);
  // a place and its tabs
  const sid = await p.$eval('#navList [data-nav="place"]', (e) => e.dataset.v);
  await p.click('#navList [data-nav="place"]'); await p.waitForTimeout(700);
  let c = await crumbs();
  ok(c.length === 3 && (await p.evaluate(() => window.__A.sel && window.__A.sel.id)) === sid, 'opening a place shows World › Realm › Place and selects it on the map (' + c.join(' › ') + ')');
  const tabs = await p.$$eval('#inspector .ptabs button', (els) => els.map((e) => e.textContent));
  ok(tabs.join() === 'Overview,Market,People,Guilds', 'each place has Overview, Market, People and Guilds tabs');
  await p.click('[data-ptab="market"]'); await p.waitForTimeout(400);
  let st = await p.evaluate(() => [window.__A.tool, window.__A.market.sid, window.__A.market.tab]);
  t = await txt();
  ok(st[0] === 'market' && st[1] === sid && st[2] === 'town' && /Shop/i.test(t), 'the Market tab opens inside the place (its own Town, Shop, Events and Bounties tabs)');
  const dupHead = await p.$$eval('#inspector .side-body > .mk-head', (els) => els.filter((e) => getComputedStyle(e).display !== 'none').length);
  ok(dupHead === 0, 'inside a place the tool panels drop their duplicate titles');
  await p.click('[data-mk="tab"][data-v="shop"]'); await p.waitForTimeout(300);
  ok(/At the inn/i.test(await txt()), 'the Shop opens within the Market tab');
  await p.click('[data-ptab="people"]'); await p.waitForTimeout(400);
  st = await p.evaluate(() => [window.__A.tool, window.__A.people.sid]);
  ok(st[0] === 'people' && st[1] === sid, 'the People tab opens inside the place');
  const pid = await p.$eval('#inspector [data-pp="npc"]', (e) => e.dataset.v);
  await p.click('#inspector [data-pp="npc"]'); await p.waitForTimeout(400);
  c = await crumbs();
  ok(c.length === 4, 'a person opens one level deeper (' + c.join(' › ') + ')');
  await p.click('#inspector .crumbs [data-nav="place"]'); await p.waitForTimeout(300);
  ok((await p.evaluate(() => window.__A.people.npc)) === null && (await crumbs()).length === 3, 'the breadcrumb goes back up to the place');
  await p.click('[data-ptab="guilds"]'); await p.waitForTimeout(400);
  ok((await p.evaluate(() => window.__A.tool)) === 'guilds', 'the Guilds tab opens inside the place');
  await p.click('[data-ptab="overview"]'); await p.waitForTimeout(300);
  ok((await p.evaluate(() => window.__A.tool)) === 'explore' && /Organisations/i.test(await txt()), 'Overview shows the place\'s details');
  // the realm crumb, then World
  await p.click('#inspector .crumbs [data-nav="realm"]'); await p.waitForTimeout(400);
  ok((await crumbs()).length === 2 && (await p.evaluate(() => window.__A.sel)) === null, 'the realm breadcrumb returns to the realm\'s list');
  await p.click('#inspector .crumbs [data-nav="home"]'); await p.waitForTimeout(300);
  ok((await p.$$eval('#inspector [data-nav="realm"]', (e) => e.length)) === nR, 'and World returns to the realms');

  // tapping a town on the map opens it in the side panel
  const m = await p.evaluate((id) => { const A = window.__A, s = A.SET.find((x) => x.id === id); A.flyTo(s.x, s.y, 9, 0); return id; }, sid);
  await p.waitForTimeout(800);
  const at = await p.evaluate((id) => { const A = window.__A, s = A.SET.find((x) => x.id === id), v = A.view, cv = document.querySelector('#map'); return { X: (s.x - v.x) * v.s + cv.clientWidth / 2, Y: (s.y - v.y) * v.s + cv.clientHeight / 2 }; }, sid);
  await p.mouse.click(at.X, at.Y); await p.waitForTimeout(500);
  ok((await crumbs()).length === 3 && (await p.evaluate(() => window.__A.sel && window.__A.sel.id)) === sid, 'tapping a town on the map opens it in the side panel');
  // tapping empty land goes up to the realm, not all the way out
  await p.evaluate(() => { const A = window.__A; A.flyTo(A.view.x, A.view.y, 0.6, 0); }); await p.waitForTimeout(500);

  // the calendar is always at hand
  const d0 = await p.evaluate(() => window.__A.market.day);
  await p.click('#calBar [data-cal="1"]'); await p.waitForTimeout(200);
  const d1 = await p.evaluate(() => window.__A.market.day);
  const shown = await p.$eval('#calDate', (e) => e.firstChild.nodeValue);
  ok(d1 === d0 + 1 && shown === (await p.evaluate(() => window.__A.dateText(window.__A.market.day))), 'the calendar in the side panel moves the day on from anywhere');

  // edit tools show their options with a Done button
  await p.click('.maptools [data-tool="road"]'); await p.waitForTimeout(300);
  ok(/Draw a road/i.test(await txt()) && !!(await p.$('#inspector [data-nav="done"]')), 'map tools open their options in the side panel, with Done');
  await p.click('#inspector [data-nav="done"]'); await p.waitForTimeout(200);
  ok((await p.evaluate(() => window.__A.tool)) === 'explore', 'Done goes back to Select');

  // hiding the side panel gives the map the whole window
  const w0 = await p.evaluate(() => document.querySelector('#map').clientWidth);
  await p.click('#btnSide'); await p.waitForTimeout(400);
  const w1 = await p.evaluate(() => document.querySelector('#map').clientWidth);
  ok(w1 > w0 + 300 && !(await p.$eval('#btnSideOpen', (e) => e.hidden)), 'hiding the side panel widens the map (' + w0 + ' → ' + w1 + ' px)');
  await p.click('#btnSideOpen'); await p.waitForTimeout(400);
  ok((await p.evaluate(() => document.querySelector('#map').clientWidth)) === w0, 'and it comes back');
  await p.screenshot({ path: '/tmp/claude-0/shell_desk.png' });

  // players: no monsters section and no editing tools
  await p.evaluate(() => { const A = window.__A; A.campaign.mode = 'player'; A.applyMode(); });
  await p.waitForTimeout(200);
  const pv = await p.evaluate(() => ({ mon: getComputedStyle(document.querySelector('.sec[data-tool="monsters"]')).display, tiles: getComputedStyle(document.querySelector('.maptools [data-tool="tiles"]')).display, tile: document.querySelector('#inspector [data-v="monsters"]') }));
  ok(pv.mon === 'none' && pv.tiles === 'none' && !pv.tile, 'players see no Monsters section and no editing tools');
  await p.evaluate(() => { const A = window.__A; A.campaign.mode = 'dm'; A.applyMode(); });

  // phone: map on top, the atlas below, a handle to give either more room
  const ph = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ph.addInitScript(() => { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 300 } })); });
  const q = await ph.newPage(); q.on('pageerror', (e) => errs.push(e.message));
  await q.goto('file:///tmp/claude-0/dbg.html'); await q.waitForTimeout(2800);
  const L = await q.evaluate(() => { const m = document.querySelector('#map').getBoundingClientRect(), s = document.querySelector('#side').getBoundingClientRect(); return { mapBottom: m.bottom, sideTop: s.top, h: m.height, over: document.documentElement.scrollWidth > innerWidth + 1 }; });
  ok(L.mapBottom <= L.sideTop + 1 && L.h > 250 && !L.over, 'on a phone the map is on top and the atlas below (' + Math.round(L.h) + ' px of map)');
  await q.tap('#btnSheet'); await q.waitForTimeout(400);
  const h2 = await q.evaluate(() => document.querySelector('#map').getBoundingClientRect().height);
  ok(h2 > L.h + 100, 'the handle gives the map more room (' + Math.round(L.h) + ' → ' + Math.round(h2) + ' px)');
  await q.tap('#btnSheet'); await q.waitForTimeout(300); await q.tap('#btnSheet'); await q.waitForTimeout(400);
  await q.tap('#inspector [data-nav="realm"]'); await q.waitForTimeout(500);
  await q.tap('#navList [data-nav="place"]'); await q.waitForTimeout(700);
  await q.tap('[data-ptab="market"]'); await q.waitForTimeout(500);
  const fit = await q.evaluate(() => { const bad = []; for (const el of document.querySelectorAll('#inspector *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed') bad.push(el.tagName + '.' + el.className); } return bad.slice(0, 4); });
  ok(!fit.length, 'a place\'s Market tab fits the phone ' + JSON.stringify(fit));
  await q.screenshot({ path: '/tmp/claude-0/shell_phone.png' });

  console.log('errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
