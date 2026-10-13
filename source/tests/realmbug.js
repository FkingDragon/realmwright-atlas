const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 700 } });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
  let p = await ctx.newPage();
  await p.addInitScript(() => { if (!localStorage.getItem('rb')) localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 240 } })); });
  await p.goto('file:///tmp/claude-0/' + (process.env.DBG || 'dbg.html')); await p.waitForTimeout(2500);
  // make the settlement nearest to a capital into a second capital
  const info = await p.evaluate(() => { const A = window.__A; const cap = A.SET.filter((s) => s.tier === 4)[2]; const near = A.SET.filter((s) => s !== cap).sort((a, b) => Math.hypot(a.x - cap.x, a.y - cap.y) - Math.hypot(b.x - cap.x, b.y - cap.y))[0]; return { cap: cap.id, capName: cap.name, near: near.id, nearName: near.name, d: Math.hypot(near.x - cap.x, near.y - cap.y).toFixed(2), x: cap.x, y: cap.y }; });
  console.log(JSON.stringify(info));
  const st = JSON.stringify({ v: 2, gen: 20, seed: 777, edits: { ov: { [info.near]: { tier: 4, realm: 'Realm of ' + info.nearName } } }, market: { day: 240 } });
  await p.close();
  // a fresh browser profile, so the first page's saved copy can't stand in for the edited one
  p = await (await b.newContext({ viewport: { width: 1000, height: 700 } })).newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript((st) => { localStorage.setItem('rb', '1'); localStorage.setItem('atlas-world-v1', st); }, st);
  await p.goto('file:///tmp/claude-0/' + (process.env.DBG || 'dbg.html')); await p.waitForTimeout(2500);
  await p.evaluate((i) => { window.__A.flyTo(i.x, i.y, 0.55, 0); }, info); await p.waitForTimeout(5000);
  await p.screenshot({ path: '/tmp/claude-0/' + (process.env.OUT || 'rb1') + '.png' });
  const R = await p.evaluate((i) => { const A = window.__A, cap = A.SET.find((s) => s.id === i.cap), near = A.SET.find((s) => s.id === i.near); return { tier: near.tier, names: A.REALMS.map((r) => r.name), split: A.realmOf(near.x, near.y) !== A.realmOf(cap.x, cap.y), mine: (A.realmOf(near.x, near.y) || {}).name }; }, info);
  ok(R.tier === 4 && R.names.includes('Realm of ' + info.nearName) && R.split, 'a capital made right beside another capital becomes its own realm (' + R.mine + '; ' + JSON.stringify([R.tier, R.split, R.names]) + ')');
  ok(!errs.length, 'and the map draws it without errors ' + JSON.stringify(errs));
  await b.close();
})();
