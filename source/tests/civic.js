const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  await p.addInitScript(() => { try { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 240 } })); } catch (e) {} });
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2500);
  const st = await p.evaluate(() => { const A = window.__A; const c = {}; for (const s of A.SET) { const k = A.sizeOf(s).k; c[k] = (c[k] || 0) + 1; } return c; });
  console.log('SIZES', JSON.stringify(st));
  const ids = await p.evaluate(() => { const A = window.__A; const f = (fn) => (A.SET.find(fn) || {}).id; return [f((s) => s.pop < 300), f((s) => s.pop >= 300 && s.pop < 1000), f((s) => s.tier === 2 && s.pop > 4000), f((s) => s.tier === 3), f((s) => s.tier === 4)]; });
  const go = (id) => p.evaluate((id) => { const b = document.createElement('button'); b.dataset.town = id; document.body.appendChild(b); b.click(); b.remove(); }, id);
  await p.evaluate(() => window.__A.setTool('explore'));
  let n = 0;
  for (const id of ids) {
    await go(id); await p.waitForTimeout(500);
    const t = await p.$eval('#inspector', (e) => e.innerText.replace(/\n+/g, ' | '));
    const i = t.indexOf('Civic life');
    console.log('\n' + t.slice(0, 80) + '\n  ' + t.slice(i, i + 900));
    await p.evaluate(() => { const h = [...document.querySelectorAll('#inspector h3')].find((x) => x.textContent === 'Civic life'); if (h) h.scrollIntoView(); });
    await p.waitForTimeout(150);
    await p.screenshot({ path: '/tmp/claude-0/c' + (n++) + '.png' });
  }
  // a city plan with district names
  await p.evaluate((id) => { const A = window.__A; const s = A.SET.find((x) => x.id === id); A.setTool('explore'); A.flyTo(s.x, s.y, 520 / A.settleR(s), 0); }, ids[3]);
  await p.waitForTimeout(3500);
  await p.click('.x[data-act="close"]').catch(() => {}); await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/claude-0/c_plan.png' });
  // a hamlet's elder and a village's watch
  const ppl = await p.evaluate((ids) => { const A = window.__A; return ids.slice(0, 2).map((id) => { const s = A.SET.find((x) => x.id === id); return A.townPeople(s).list.slice(0, 6).map((q) => q.job).join(', '); }); }, ids);
  console.log('\nPEOPLE', JSON.stringify(ppl));
  console.log((['hamlet', 'village', 'town', 'city'].every((k) => st[k] > 0) ? 'PASS ' : 'FAIL ') + 'every size class from hamlet to city exists');
  console.log((/Hamlet elder/.test(ppl[0]) ? 'PASS ' : 'FAIL ') + 'a hamlet is led by an elder');
  console.log('ERR', errs.join('\n')); await b.close();
})();
