const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  await p.addInitScript(() => { try { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 4242, edits: {}, market: { day: 240 } })); } catch (e) {} });
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2500);
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const ids = await p.evaluate(() => { const A = window.__A; const f = (fn) => (A.SET.find(fn) || {}).id;
    return { lodge: f((s) => s.tier === 2 && A.guildLevel(s, 'adventurers') === 1 && A.guildLevel(s, 'thieves') === 0), none: f((s) => s.tier === 2 && A.guildLevel(s, 'adventurers') === 0), theoCap: f((s) => s.tier === 4 && A.guildLevel(s, 'mages') === 0), cityHQ: f((s) => s.tier === 3 && A.GUILDS.some((k) => A.guildLevel(s, k) === 3)), post: f((s) => s.tier === 1 && A.guildLevel(s, 'merchants') === 1) }; });
  console.log(JSON.stringify(ids));
  const open = async (id, tool, tab) => p.evaluate(([id, tool, tab]) => { const A = window.__A; const s = A.SET.find((x) => x.id === id); A.setTool(tool); A.market.sid = id; A.people.sid = id; A.guildUI.org = null; A.guildUI.q = null; if (tab) A.guildUI.tab = tab; A.sel = { kind: 'settle', id }; A.renderPanel(); A.flyTo(s.x, s.y, 12, 0); }, [id, tool, tab]);
  const txt = () => p.$eval('#inspector', (e) => e.innerText.replace(/\n+/g, ' | '));
  // lodge town: board
  await open(ids.lodge, 'guilds', 'board'); await p.waitForTimeout(400);
  let t = await txt(); console.log('LODGE BOARD', t.slice(0, 400));
  ok(/lodge/i.test(t) && /Lodge warden/.test(t), 'a small town shows a lodge with a lodge warden');
  const rs = await p.evaluate((id) => { const A = window.__A; const R = A.roster(A.SET.find((x) => x.id === id)); return R.list.length; }, ids.lodge);
  ok(rs >= 3 && rs <= 5, 'lodge roster is small (' + rs + ')');
  await p.screenshot({ path: '/tmp/claude-0/g1.png' });
  await open(ids.lodge, 'guilds', 'orgs'); await p.waitForTimeout(400);
  t = await txt(); const gb = t.toLowerCase().indexOf('guild branches'); console.log('ORGS', t.slice(gb, gb + 600));
  ok(/Guild branches/i.test(t) && /None/i.test(t) && /nearest/i.test(t), 'Orgs tab lists guild branches, absent ones with the nearest');
  await p.evaluate(() => document.querySelector('.branches').scrollIntoView()); await p.screenshot({ path: '/tmp/claude-0/g2.png' });
  // town with no hall at all
  if (ids.none) { await open(ids.none, 'guilds', 'board'); await p.waitForTimeout(400); t = await txt(); ok(/nearest hall to/.test(t), 'a town without a hall uses the nearest one'); }
  // org page of an HQ
  await p.evaluate((id) => { const A = window.__A; const s = A.SET.find((x) => x.id === id); const k = A.GUILDS.find((k) => A.guildLevel(s, k) === 3); A.setTool('guilds'); A.market.sid = id; A.guildUI.org = k; A.renderPanel(); }, ids.cityHQ); await p.waitForTimeout(300);
  t = await txt(); console.log('HQ PAGE', t.slice(t.indexOf('Branch'), t.indexOf('Branch') + 500));
  ok(/Headquarters/.test(t) && /Branches answering here/.test(t), 'HQ page lists the branches answering to it');
  await p.screenshot({ path: '/tmp/claude-0/g3.png' });
  // explore panel: tags and nearest hall
  await p.evaluate((id) => { const A = window.__A; A.setTool('explore'); const b = document.createElement('button'); b.dataset.town = id; document.body.appendChild(b); b.click(); b.remove(); }, ids.post); await p.waitForTimeout(400); t = await txt(); console.log('VILLAGE', t.slice(0, 250));
  ok(/Merchants/.test(t) && /minor/i.test(t), 'a village with a trading post shows Merchants (minor)');
  if (ids.theoCap) { await open(ids.theoCap, 'explore'); await p.waitForTimeout(300); t = await txt(); ok(!/Mages/.test(t.slice(0, 400)), 'theocracy capital has no Mages\' Circle');
  await open(ids.theoCap, 'guilds', 'orgs'); await p.waitForTimeout(300); t = await txt(); const i = t.indexOf("Mages' Circle | None"); console.log('THEO', t.slice(i, i + 200)); }
  // census
  await open(ids.lodge, 'people'); await p.evaluate(() => { const A = window.__A; A.people.tab = 'census'; A.renderPanel(); }); await p.waitForTimeout(300);
  t = await txt(); const ci = t.indexOf('Organisations'); console.log('CENSUS', t.slice(ci, ci + 300));
  // a person whose guild is missing
  const ind = await p.evaluate((id) => { const A = window.__A; const s = A.SET.find((x) => x.id === id); const pp = A.residents(s).find((q) => q.group === 'arcane' || q.group === 'underworld'); return pp ? pp.id : null; }, ids.lodge);
  if (ind) { await p.evaluate((pid) => { const A = window.__A; A.people.npc = pid; A.people.tab = 'residents'; A.renderPanel(); }, ind); await p.waitForTimeout(300); t = await txt(); const bi = t.indexOf('Belongs to'); console.log('BELONGS', t.slice(bi, bi + 80)); }
  console.log('ERR', errs.join('\n'));
  await b.close();
})();
