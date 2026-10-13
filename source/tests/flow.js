// v26 flow and finding things: a tighter panel top, At a glance, Today and Jump back to, grouped monster markers, phone fit
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

  // the title line never runs under the buttons
  const ov = await p.evaluate(() => { const m = document.querySelector('#side .plate .meta-line').getBoundingClientRect(), a = document.querySelector('#side .top-actions').getBoundingClientRect(); return [Math.round(m.right), Math.round(a.left)]; });
  ok(ov[0] <= ov[1], 'the seed and zoom line stops before the buttons (' + ov.join(' ≤ ') + ')');

  // Today on the World page
  let t = await p.$eval('#inspector', (e) => e.innerText);
  ok(/TODAY/i.test(t) && (await p.$$('#inspector .today .evlist li')).length >= 1, 'the World page opens with Today: what is happening in the world');

  // a place: At a glance comes first, and the content starts high up
  await p.click('#inspector [data-nav="realm"]'); await p.waitForTimeout(400);
  const sid = await p.$eval('#navList [data-nav="place"]', (e) => e.dataset.v);
  await p.click('#navList [data-nav="place"]'); await p.waitForTimeout(600);
  const top = await p.evaluate(() => Math.round(document.querySelector('#inspector .glance').getBoundingClientRect().top));
  ok(top < 320, 'a place\'s At a glance card starts ' + top + ' px down the window');
  const tiles = await p.$$eval('#inspector .gl-t span', (els) => els.map((e) => e.textContent));
  ok(tiles.join() === 'Market,Danger,Quests,People', 'At a glance shows Market, Danger, Quests and People (' + tiles.join(', ') + ')');
  const editBox = await p.evaluate(() => { const d = document.querySelector('#placeEdit'); return d && !d.open && !!d.querySelector('#f-tier') && !!d.querySelector('#f-wealth'); });
  ok(editBox, 'size, population, wealth and defence wait in a closed "Edit this place" fold');
  // jump from the tiles
  for (const [lab, want] of [['Market', ['market', 'town']], ['Danger', ['market', 'bounties']], ['Quests', ['guilds', 'board']], ['People', ['people', 'residents']]]) {
    await p.evaluate((sid) => window.__A.openPlace(sid, 'overview', false), sid).catch(() => {});
    await p.click('[data-ptab="overview"]'); await p.waitForTimeout(250);
    await p.evaluate((lab) => [...document.querySelectorAll('#inspector .gl-t')].find((b) => b.querySelector('span').textContent === lab).click(), lab);
    await p.waitForTimeout(350);
    const st = await p.evaluate(() => { const A = window.__A; return [A.tool, A.tool === 'market' ? A.market.tab : A.tool === 'guilds' ? A.guildUI.tab : A.people.tab, (A.sel || {}).id || A.market.sid]; });
    ok(st[0] === want[0] && st[1] === want[1], 'the ' + lab + ' tile opens ' + want.join(' › ') + ' (' + st.join(', ') + ')');
  }
  // the edit fold stays open while you edit
  await p.click('[data-ptab="overview"]'); await p.waitForTimeout(300);
  await p.click('#placeEdit summary'); await p.waitForTimeout(150);
  await p.fill('#f-pop', '777'); await p.press('#f-pop', 'Tab'); await p.waitForTimeout(400);
  const still = await p.evaluate(() => { const d = document.querySelector('#placeEdit'); return d && d.open && document.querySelector('#f-pop').value; });
  ok(still === '777', 'the edit fold stays open after a change redraws the panel');
  await p.evaluate(() => window.__A.undo && window.__A.undo());

  // reading down a long page folds the search row away; the top brings it back
  const box = await p.$('#inspector');
  await p.evaluate(() => { const i = document.getElementById('inspector'); i.scrollTop = 400; i.dispatchEvent(new Event('scroll')); }); await p.waitForTimeout(250);
  const folded = await p.evaluate(() => [document.getElementById('side').classList.contains('scrolled'), getComputedStyle(document.querySelector('#side .side-row2')).display]);
  await p.evaluate(() => { const i = document.getElementById('inspector'); i.scrollTop = 0; i.dispatchEvent(new Event('scroll')); }); await p.waitForTimeout(250);
  const back = await p.evaluate(() => getComputedStyle(document.querySelector('#side .side-row2')).display);
  ok(folded[0] && folded[1] === 'none' && back !== 'none', 'scrolling down folds the search row away, and the top brings it back');
  void box;

  // Jump back to
  await p.click('#inspector .crumbs [data-nav="home"]'); await p.waitForTimeout(400);
  const chip = await p.$$eval('#inspector .gl-recent .chip', (els) => els.map((e) => [e.dataset.nav, e.dataset.v]));
  ok(chip.some(([n, v]) => n === 'place' && v === sid), 'the World page offers to jump back to the place just opened');
  await p.click('#inspector .gl-recent .chip[data-v="' + sid + '"]'); await p.waitForTimeout(500);
  ok((await p.evaluate(() => (window.__A.sel || {}).id)) === sid, 'and the chip opens it');

  // monster markers group when zoomed out, and a group zooms in when tapped
  await p.evaluate(() => { const A = window.__A, s = A.SET.find((x) => x.tier === 4); A.flyTo(s.x, s.y, 1.1, 0); });
  await p.waitForTimeout(900);
  const mk = await p.evaluate(() => { const M = window.__A.markers || []; const mon = M.filter((m) => m.kind === 'mon'); return { all: mon.length, cl: mon.filter((m) => String(m.id).startsWith('cl:')).map((m) => [m.X, m.Y]) }; });
  ok(mk.cl.length >= 3 && mk.all < 120, 'zoomed out, monster groups gather into ' + mk.cl.length + ' markers (' + mk.all + ' in all)');
  if (mk.cl.length) {
    const s0 = await p.evaluate(() => window.__A.view.s);
    await p.mouse.click(mk.cl[0][0], mk.cl[0][1]); await p.waitForTimeout(900);
    const s1 = await p.evaluate(() => window.__A.view.s);
    ok(s1 > s0 * 1.8, 'tapping a group zooms in on it (' + s0.toFixed(2) + ' → ' + s1.toFixed(2) + ')');
  }
  // players see no Danger tile and no editing
  await p.evaluate((sid) => { const A = window.__A; A.campaign.mode = 'player'; A.applyMode(); A.openPlace(sid, 'overview', false); }, sid);
  await p.waitForTimeout(400);
  const pl = await p.evaluate(() => ({ tiles: [...document.querySelectorAll('#inspector .gl-t span')].map((e) => e.textContent).join(), edit: !!document.querySelector('#placeEdit'), notes: !!document.querySelector('#f-notes') }));
  ok(pl.tiles === 'Market,Quests,People' && !pl.edit && !pl.notes, 'players get Market, Quests and People, with no danger, editing or DM notes');
  await p.evaluate(() => { const A = window.__A; A.campaign.mode = 'dm'; A.applyMode(); });

  // phone: a place opens at its own header, and the map tools fit
  const ph = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ph.addInitScript(() => { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 300 } })); });
  const q = await ph.newPage(); q.on('pageerror', (e) => errs.push(e.message));
  await q.goto('file:///tmp/claude-0/dbg.html'); await q.waitForTimeout(2800);
  const fit = await q.evaluate(() => { const m = document.querySelector('#frame .maptools'); return [m.scrollWidth, m.clientWidth]; });
  ok(fit[0] <= fit[1] + 1, 'on a phone the map tools fit without scrolling (' + fit.join(' ≤ ') + ' px)');
  await q.tap('#inspector [data-nav="realm"]'); await q.waitForTimeout(500);
  await q.tap('#navList [data-nav="place"]'); await q.waitForTimeout(700);
  const head = await q.evaluate(() => { const h = document.querySelector('#inspector .side-head').getBoundingClientRect(), s = document.getElementById('side').getBoundingClientRect(), g = document.querySelector('#inspector .glance').getBoundingClientRect(); return { gap: Math.round(h.top - s.top), glance: Math.round(g.top), vh: innerHeight }; });
  ok(Math.abs(head.gap) <= 2 && head.glance < head.vh - 120, 'on a phone a place opens at its own header, with At a glance in view (' + head.glance + ' of ' + head.vh + ' px)');
  await q.screenshot({ path: '/tmp/claude-0/flow_phone.png' });

  console.log('errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
