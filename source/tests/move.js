const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1400, height: 880 } });
  await p.addInitScript(() => { try { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 240 } })); } catch (e) {} });
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2500); await require('./canvas-mouse')(p);
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const s0 = await p.evaluate(() => { const A = window.__A; const s = A.SET.filter((x) => x.tier === 2)[8]; A.flyTo(s.x, s.y, 9, 0); return { id: s.id, x: s.x, y: s.y }; });
  await p.waitForTimeout(1500);
  const scr = () => p.evaluate((id) => { const A = window.__A, s = A.SET.find((x) => x.id === id), v = A.view; return { X: (s.x - v.x) * v.s + document.querySelector('#map').clientWidth / 2, Y: (s.y - v.y) * v.s + document.querySelector('#map').clientHeight / 2, x: s.x, y: s.y }; }, s0.id);
  // Explore: select then try to drag
  let m = await scr();
  await p.mouse.click(m.X, m.Y); await p.waitForTimeout(300);
  ok(await p.evaluate((id) => window.__A.sel && window.__A.sel.id === id, s0.id), 'Explore: tapping the town selects it');
  m = await scr();
  await p.mouse.move(m.X, m.Y); await p.mouse.down(); await p.mouse.move(m.X + 60, m.Y + 40, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(300);
  let a = await scr();
  ok(Math.abs(a.x - s0.x) < 1e-9 && Math.abs(a.y - s0.y) < 1e-9, 'Explore: dragging does not move the town (the map pans instead)');
  ok(Math.abs(a.X - m.X - 60) < 3, 'Explore: the drag panned the map');
  // Settle tool: the town stays selected, drag moves it
  await p.click('.tool[data-tool="settle"]'); await p.waitForTimeout(200);
  ok(await p.evaluate((id) => window.__A.sel && window.__A.sel.id === id, s0.id), 'Settle: the selected town stays selected when switching tools');
  m = await scr();
  await p.mouse.move(m.X, m.Y); await p.waitForTimeout(80);
  const cur = await p.evaluate(() => document.querySelector('canvas').style.cursor);
  ok(cur === 'grab', 'Settle: grab cursor over the selected town');
  await p.mouse.down(); await p.mouse.move(m.X + 50, m.Y + 30, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(400);
  a = await scr();
  ok(Math.abs(a.x - s0.x) > 1e-4, 'Settle: dragging moves the town');
  const n0 = await p.evaluate(() => window.__A.SET.length);
  // tap empty land deselects, a second tap founds a new place
  const dry = await p.evaluate((m) => { const A = window.__A, v = A.view; for (let k = 0; k < 60; k++) { const X = m.X + Math.cos(k) * (120 + k * 4), Y = m.Y + Math.sin(k) * (120 + k * 4); const wx = (X - document.querySelector('#map').clientWidth / 2) / v.s + v.x, wy = (Y - document.querySelector('#map').clientHeight / 2) / v.s + v.y; if (!A.T.isWater(A.T.biomeAt(wx, wy, 12, null)) && !A.markers.some((q) => q.kind === 'settle' && Math.hypot(q.X - X, q.Y - Y) < 30)) return { X, Y }; } return { X: m.X + 200, Y: m.Y }; }, m);
  m.X = dry.X + 220; m.Y = dry.Y - 120;
  await p.mouse.click(m.X - 220, m.Y + 120); await p.waitForTimeout(400);
  const s2 = await p.evaluate(() => window.__A.sel);
  ok(!s2, 'Settle: tapping empty land deselects');
  await p.waitForTimeout(400); await p.mouse.click(m.X - 220, m.Y + 120); await p.waitForTimeout(400);
  const n1 = await p.evaluate(() => window.__A.SET.length);
  console.log('toast:', await p.evaluate(() => { const t = document.getElementById('toast'); return t ? t.textContent + ' hidden=' + t.hidden : 'none'; }), 'tool', await p.evaluate(() => window.__A.tool));
  ok(n1 === n0 + 1, 'Settle: tapping again founds a new settlement (' + n0 + ' -> ' + n1 + ')');
  // Explore again: nothing moves
  await p.evaluate(() => window.__A.setTool('explore')); await p.waitForTimeout(200);
  m = await scr(); await p.mouse.click(m.X, m.Y); await p.waitForTimeout(200);
  const before = await scr();
  await p.mouse.move(m.X, m.Y); await p.mouse.down(); await p.mouse.move(m.X - 40, m.Y - 40, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(200);
  a = await scr();
  ok(Math.abs(a.x - before.x) < 1e-9, 'Explore: still no moving after edits');
  const hint = await p.$eval('#inspector', (e) => e.innerText).catch(() => '');
  ok(/open the Settle tool/.test(hint), 'Explore panel says to use the Settle tool to move it');
  console.log('ERR', errs.join('\n')); await b.close();
})();
