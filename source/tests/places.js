const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  await p.addInitScript(() => { try { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 240 } })); } catch (e) {} });
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2500); await require('./canvas-mouse')(p);
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const txt = () => p.$eval('#inspector', (e) => e.innerText.replace(/\n+/g, ' | '));
  const cap = await p.evaluate(() => { const A = window.__A; const s = A.SET.filter((x) => x.tier === 4)[0]; return s.id; });
  const go = (id) => p.evaluate((id) => { const b = document.createElement('button'); b.dataset.town = id; document.body.appendChild(b); b.click(); b.remove(); }, id);
  await p.evaluate(() => window.__A.setTool('explore')); await go(cap); await p.waitForTimeout(600);
  let t = await txt(); const i = t.indexOf('LEADERSHIP'); console.log('CIVIC', t.slice(i, i + 700));
  const nAld = await p.$$eval('#inspector .facts.civic [data-pp="npc"]', (e) => e.length);
  ok(nAld >= 5, 'civic section links people, aldermen included (' + nAld + ')');
  const nPl = await p.$$eval('#inspector .facts.civic [data-place]', (e) => e.length);
  ok(nPl >= 8, 'civic section links places (' + nPl + ')');
  // click a tavern
  await p.evaluate(() => { const b = [...document.querySelectorAll('#inspector .facts.civic [data-place]')].find((x) => /\|tav/.test(x.dataset.place)); b.click(); });
  await p.waitForTimeout(1800);
  t = await txt(); console.log('TAVERN', t.slice(0, 300));
  ok(/tavern/i.test(t) && /Here today/i.test(t), 'a tavern opens its own page');
  const hi = await p.evaluate(() => { const A = window.__A; return A.placeHi && A.placeHi.key; });
  ok(/^tav/.test(hi || ''), 'the tavern is highlighted on the map');
  await p.screenshot({ path: '/tmp/claude-0/pl1.png' });
  // an underworld resident with a place in their secret routine
  const crook = await p.evaluate((cap) => { const A = window.__A; const s = A.SET.find((x) => x.id === cap); const day = A.market.day; for (let d = 0; d < 20; d++) for (const q of A.residents(s)) { if (!q.secretJob) continue; const a = A.activity(q, day + d); if (a.secretPlace) return { id: q.id, d, txt: a.secret, place: a.secretPlace, cover: a.text }; } return null; }, cap);
  console.log('CROOK', JSON.stringify(crook));
  ok(!!crook, 'thieves plan crimes at real places');
  const sample = await p.evaluate((cap) => { const A = window.__A; const s = A.SET.find((x) => x.id === cap); const day = A.market.day; return A.residents(s).slice(0, 14).map((q) => q.job + ': ' + A.activity(q, day).text).join(' || '); }, cap);
  console.log('ACTIVITIES', sample);
  // activity tab heat map
  await p.evaluate((cap) => { const A = window.__A; A.people.place = null; A.people.npc = null; A.people.tab = 'activity'; A.people.sid = cap; A.renderPanel(); }, cap);
  await p.click('[data-pp="heatfly"]'); await p.waitForTimeout(3500);
  t = await txt(); const j = t.indexOf('Busiest'); console.log('ACT TAB', t.slice(j, j + 400));
  await p.screenshot({ path: '/tmp/claude-0/pl2.png' });
  await p.click('[data-pp="hcat"][data-v="work"]'); await p.click('[data-pp="hcat"][data-v="home"]'); await p.click('[data-pp="hcat"][data-v="leisure"]'); await p.click('[data-pp="hcat"][data-v="faith"]'); await p.click('[data-pp="hcat"][data-v="civic"]'); await p.click('[data-pp="hcat"][data-v="adventure"]');
  await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/claude-0/pl3.png' });
  // a place marker on the map
  await p.click('[data-pp="tab"][data-v="residents"]'); await p.waitForTimeout(200);
  await p.evaluate((cap) => { const A = window.__A; const s = A.SET.find((x) => x.id === cap); A.flyTo(s.x, s.y, 2600, 0); }, cap); await p.waitForTimeout(3000);
  const mk = await p.evaluate(() => { const M = window.__A.markers; const m = M.filter((q) => q.kind === 'poi' && q.X > 100 && q.X < 900 && q.Y > 100 && q.Y < 800 && !M.some((o) => o !== q && o.kind !== 'poi' && o.kind !== 'settle' && o.X != null && Math.hypot(o.X - q.X, o.Y - q.Y) < 16))[0]; return m ? { X: m.X, Y: m.Y, id: m.id } : null; });
  if (mk) { await p.mouse.click(mk.X, mk.Y); await p.waitForTimeout(600); const pk = await p.evaluate(() => window.__A.people.place); ok(pk && mk.id.endsWith(pk), 'clicking a place on the street plan opens it (' + mk.id + ')'); }
  await p.screenshot({ path: '/tmp/claude-0/pl4.png' });
  console.log('ERR', errs.join('\n')); await b.close();
})();
