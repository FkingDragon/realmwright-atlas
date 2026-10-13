// Ideas from the old Market Ledger: households, around town now, the town chronicle, recent changes,
// guild colours and quest danger, and town wealth and defence
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  await ctx.addInitScript(() => { if (!localStorage.getItem('t-init')) { localStorage.setItem('t-init', '1'); localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 300 } })); } });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2600);
  const txt = () => p.$eval('#inspector', (e) => e.innerText);
  const sid = await p.evaluate(() => window.__A.SET.filter((x) => x.tier === 3)[1].id);

  // households
  await p.evaluate((id) => { const A = window.__A; A.setTool('people'); A.people.sid = id; A.people.tab = 'residents'; A.people.view = 'house'; A.renderPanel(); }, sid);
  await p.waitForTimeout(300);
  const hh = await p.evaluate((id) => { const A = window.__A; const s = A.SET.find((x) => x.id === id); const all = A.residents(s); const H = A.households(s, all); return { houses: H.houses.length, inHouses: H.houses.reduce((a, g) => a + g.list.length, 0), alone: H.alone.length, all: all.length, name: H.houses[0] && H.houses[0].name, shown: document.querySelectorAll('#inspector .house-h').length }; }, sid);
  ok(hh.houses >= 3 && hh.inHouses + hh.alone === hh.all && /^House |^Household of /.test(hh.name), 'residents group into households (' + hh.houses + ' households, e.g. "' + hh.name + '"; everyone listed once)');
  ok(hh.shown === hh.houses + (hh.alone ? 1 : 0), 'the list shows a heading for each household');

  // around town now
  const day = await p.evaluate(() => window.__A.market.day);
  const W = await p.evaluate(([id, day]) => {
    const A = window.__A, s = A.SET.find((x) => x.id === id), list = A.residents(s);
    const at = (h) => list.map((q) => [q, A.whereAt(q, s, day, h)]).filter((x) => x[1]);
    const n3 = at(3), n10 = at(10), n20 = at(20);
    return {
      asleep: n3.filter(([, w]) => w.key === '~home').length / n3.length,
      working: n10.filter(([, w]) => w.key !== '~home').length / n10.length,
      kidsDrinking: n20.filter(([q, w]) => q.age < 16 && /Drinking/.test(w.text)).length,
      evening: new Set(n20.map(([, w]) => w.key)).size,
    };
  }, [sid, day]);
  ok(W.asleep > 0.6 && W.working > 0.6, 'at 3 am most are asleep (' + Math.round(W.asleep * 100) + '%), at 10 am most are out at work (' + Math.round(W.working * 100) + '%)');
  ok(W.kidsDrinking === 0 && W.evening >= 3, 'in the evening people spread over ' + W.evening + ' places, and no child is in the tavern');
  await p.evaluate(() => { const A = window.__A; A.people.tab = 'activity'; A.renderPanel(); });
  await p.waitForTimeout(300);
  const before = await p.$eval('#aroundNow', (e) => e.innerText);
  await p.$eval('#pp-hour', (e) => { e.value = '2'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.waitForTimeout(200);
  const after = await p.$eval('#aroundNow', (e) => e.innerText);
  ok(before !== after && /02:00, night/.test(after), 'the time slider updates "Around town now" in place');

  // chronicle
  await p.evaluate(() => { const A = window.__A; A.people.tab = 'chronicle'; A.renderPanel(); });
  await p.waitForTimeout(300);
  let t = await txt();
  const days = (t.match(/\d+ \w+, \d{4}/g) || []).length;
  ok(/chronicle/i.test(t) && days >= 7, 'the Chronicle tab shows the last 7 days (' + days + ' day headings)');
  await p.click('[data-p28="chronmore"]'); await p.waitForTimeout(300);
  t = await txt();
  ok((t.match(/\d+ \w+, \d{4}/g) || []).length >= 14, '"Earlier days" adds another week');
  const same = await p.evaluate(([id, day]) => { const A = window.__A, s = A.SET.find((x) => x.id === id); const a = JSON.stringify(A.chronDay(s, day - 3).map((e) => e.h)); return a; }, [sid, day]);
  await p.evaluate(() => { const A = window.__A; A.campaign.mode = 'player'; A.applyMode(); A.setTool('people'); A.people.tab = 'chronicle'; A.renderPanel(); });
  await p.waitForTimeout(300);
  t = await txt();
  ok(!/Travellers report/.test(t) && !/DM\b/.test(t.replace(/DM password/g, '')), 'players never see monster sightings in the chronicle');
  await p.evaluate(() => { const A = window.__A; A.campaign.mode = 'dm'; A.applyMode(); });
  const same2 = await p.evaluate(([id, day]) => { const A = window.__A, s = A.SET.find((x) => x.id === id); return JSON.stringify(A.chronDay(s, day - 3).map((e) => e.h)); }, [sid, day]);
  ok(same === same2, 'a day\'s chronicle reads the same every time');

  // guild colours and quest danger
  await p.evaluate((id) => { const A = window.__A; A.setTool('guilds'); A.market.sid = A.SET.find((x) => x.tier === 4).id; A.guildUI.tab = 'board'; A.renderPanel(); }, sid);
  await p.waitForTimeout(300);
  const dz = await p.$$eval('#inspector .dz', (els) => els.map((e) => e.textContent));
  ok(dz.length >= 2 && dz.every((x) => /^(low|moderate|high|deadly)$/.test(x)), 'quests carry danger chips (' + [...new Set(dz)].join(', ') + ')');
  await p.evaluate(() => { const A = window.__A; A.guildUI.tab = 'orgs'; A.renderPanel(); });
  await p.waitForTimeout(300);
  const stripes = await p.$$eval('ul.orgcards > li', (els) => els.map((e) => getComputedStyle(e).borderLeftColor));
  ok(stripes.length >= 4 && new Set(stripes).size >= 4, 'each organisation card has its own colour stripe (' + new Set(stripes).size + ' colours)');

  // wealth and defence
  const wd = await p.evaluate(() => {
    const A = window.__A;
    // find a town with famine or plague, and one touched by war or bandits, within the year
    let hit = null, war = null;
    for (let d = A.market.day; d < A.market.day + 360 && (!hit || !war); d += 5) for (const s of A.SET) {
      if (!hit) { const m = A.modsFor ? null : null; }
      const L = A.localInfo(s);
      for (const e of A.activeOn(d)) {
        const f = A.impact(e, s, L, d);
        if (f > 0.2 && !hit && (e.type === 'famine' || e.type === 'plague')) hit = { id: s.id, d, e: e.id, f, type: e.type };
        if (f > 0.2 && !war && (e.type === 'war' || e.type === 'bandits')) war = { id: s.id, d, e: e.id, f, type: e.type };
      }
      if (hit && war) break;
    }
    return { hit, war };
  });
  const after2 = await p.evaluate((wd) => {
    const A = window.__A, out = {};
    const imp = (o) => { const s = A.SET.find((x) => x.id === o.id); const e = A.activeOn(o.d).find((x) => x.id === o.e); return A.impact(e, s, A.localInfo(s), o.d); };
    A.patchSettlement(wd.hit.id, { wealth: 3 }, 'Set wealth'); out.rich = imp(wd.hit);
    A.patchSettlement(wd.hit.id, { wealth: undefined }, 'Auto wealth'); out.auto = imp(wd.hit);
    A.patchSettlement(wd.war.id, { defence: 3 }, 'Set defence'); out.fort = imp(wd.war);
    A.patchSettlement(wd.war.id, { defence: undefined }, 'Auto defence'); out.wauto = imp(wd.war);
    out.ov = JSON.stringify(A.edits.ov[wd.hit.id] || {});
    return out;
  }, wd);
  ok(after2.rich < wd.hit.f * 0.95 && Math.abs(after2.auto - wd.hit.f) < 1e-9, 'a rich town is hit less by ' + wd.hit.type + ' (' + wd.hit.f.toFixed(2) + ' → ' + after2.rich.toFixed(2) + '); Auto puts it back exactly');
  ok(after2.fort < wd.war.f * 0.95 && Math.abs(after2.wauto - wd.war.f) < 1e-9, 'a fortress is hit less by ' + wd.war.type + ' (' + wd.war.f.toFixed(2) + ' → ' + after2.fort.toFixed(2) + ')');
  ok(!/wealth|defence/.test(after2.ov), 'Auto leaves nothing behind in the save');

  // recent changes this session
  await p.evaluate(() => { const A = window.__A; A.setTool('explore'); }); await p.waitForTimeout(100);
  await p.click('#btnWorld'); await p.waitForTimeout(400);
  const feed = await p.$eval('#worldBody', (e) => e.innerText);
  ok(/Recent changes this session/i.test(feed) && /Set wealth/.test(feed) && /Auto defence/.test(feed), 'Recent changes lists this session\'s steps');
  await p.screenshot({ path: '/tmp/claude-0/ledger_feed.png' });

  console.log('errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
