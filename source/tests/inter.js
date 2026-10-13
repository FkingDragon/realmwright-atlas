const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1400, height: 880 } });
  await p.addInitScript(() => { try { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 240 } })); } catch (e) {} });
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2500); await require('./canvas-mouse')(p);
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const wait = (ms) => p.waitForTimeout(ms);
  // 1. a town name opens the town (Explore)
  await p.evaluate(() => { const A = window.__A; const s = A.SET.filter((x) => x.tier === 2)[5]; A.flyTo(s.x, s.y, 8, 0); });
  await wait(1500);
  let lab = await p.evaluate(() => { const m = window.__A.markers.filter((q) => q.kind === 'slabel' && q.r[0] > 100 && q.r[2] < 950 && q.r[1] > 100 && q.r[3] < 800)[0]; return m ? { id: m.id, x: (m.r[0] + m.r[2]) / 2, y: (m.r[1] + m.r[3]) / 2 } : null; });
  await p.mouse.move(lab.x, lab.y); await wait(150);
  const cur = await p.evaluate(() => document.querySelector('canvas').style.cursor + ' ' + window.__A.hoverSid);
  ok(cur.startsWith('pointer'), 'hand cursor over a name (' + cur + ')');
  await p.mouse.click(lab.x, lab.y); await wait(300);
  let nm = await p.evaluate(() => { const f = document.getElementById('f-name'); return [f && f.value, window.__A.sel && window.__A.sel.id]; });
  ok(nm[1] === lab.id, 'clicking a name opens that town in Explore: ' + nm[0]);
  await p.screenshot({ path: '/tmp/claude-0/i1.png' });
  // 2. in the Market a name opens its board
  await p.evaluate(() => window.__A.setTool('market')); await wait(300);
  lab = await p.evaluate((skip) => { const m = window.__A.markers.filter((q) => q.kind === 'slabel' && q.id !== skip && q.r[0] > 100 && q.r[2] < 900 && q.r[1] > 100 && q.r[3] < 800)[0]; return m ? { id: m.id, x: (m.r[0] + m.r[2]) / 2, y: (m.r[1] + m.r[3]) / 2 } : null; }, lab.id);
  if (lab) { await p.mouse.click(lab.x, lab.y); await wait(300); const st = await p.evaluate(() => [window.__A.market.sid, window.__A.market.tab]); ok(st[0] === lab.id && st[1] === 'town', 'clicking a name in Market opens its board'); }
  // 3. realm names fly to the realm
  await p.evaluate(() => window.__A.setTool('explore')); await wait(200);
  await p.evaluate(() => window.__A.flyTo(2048, 1280, 0.5, 0)); await wait(1500);
  const rl = await p.evaluate(() => { const m = window.__A.markers.filter((q) => q.kind === 'rlabel' && q.r[0] > 100 && q.r[2] < 950)[0]; return m ? { id: m.id, x: (m.r[0] + m.r[2]) / 2, y: (m.r[1] + m.r[3]) / 2 } : null; });
  if (rl) { await p.mouse.click(rl.x, rl.y); await wait(1500); const v = await p.evaluate(() => [window.__A.view.s, window.__A.navR, (document.querySelector('#inspector .crumbs b') || {}).textContent]); ok(v[1] === rl.id && v[0] > 0.6, 'clicking a realm name opens the realm\'s page (' + v[2] + ') and flies to the realm'); } else console.log('no realm label visible');
  // 4. panel link flies to the town and pulses
  await p.evaluate(() => { const A = window.__A; A.setTool('people'); A.people.sid = A.SET.find((x) => x.tier === 3).id; A.people.tab = 'census'; A.renderPanel(); }); await wait(300);
  const linkOk = await p.evaluate(() => { const b = document.querySelector('#inspector [data-town]'); if (!b) return null; b.click(); return b.dataset.town; });
  await wait(200);
  const pul = await p.evaluate(() => window.__A.sel && window.__A.sel.id);
  ok(linkOk && pul === linkOk, 'a town name in the panel selects it and flies the map there');
  // 5. roads are not selectable in Explore
  await p.evaluate(() => window.__A.setTool('explore')); await wait(200);
  const road = await p.evaluate(async () => { const A = window.__A; const r = A.ROADS.find((q) => q.type === 2 && q.a); const g = A.roadGeom(r); const i = Math.floor(g.length / 4) * 2; A.flyTo(g[i], g[i + 1], 2.5, 0); await new Promise((res) => setTimeout(res, 1500)); return { id: r.id }; });
  const mid = await p.evaluate(() => ({ x: Math.round(document.querySelector('#map').clientWidth / 2), y: Math.round(document.querySelector('#map').clientHeight / 2) }));
  const hitR = await p.evaluate((m) => { const h = window.__A.roadHit(m.x, m.y); return h && h.id; }, mid);
  await p.mouse.click(mid.x, mid.y); await wait(250);
  let s1 = await p.evaluate(() => window.__A.sel);
  ok(!s1 || s1.kind !== 'road', 'tapping a road in Explore does not select it (road under pointer: ' + hitR + ')');
  // 6. Road tool: select, drag a dot, undo
  await p.click('.tool[data-tool="road"]'); await wait(200);
  await p.mouse.click(mid.x, mid.y); await wait(250);
  s1 = await p.evaluate(() => window.__A.sel);
  ok(s1 && s1.kind === 'road', 'tapping a road in the Road tool selects it');
  const hd = await p.evaluate(() => { const A = window.__A, r = A.RBY.get(A.sel.id), E = A.roadEditable(r); const v = A.view; const sc = (x, y) => [(x - v.x) * v.s + document.querySelector('#map').clientWidth / 2, (y - v.y) * v.s + document.querySelector('#map').clientHeight / 2]; const out = []; for (let j = 1; j < E.h.length - 1; j++) { const [X, Y] = sc(E.pts[E.h[j] * 2], E.pts[E.h[j] * 2 + 1]); if (X > 80 && X < 1000 && Y > 80 && Y < 800) out.push([X, Y, j]); } return { list: out, n: E.h.length, g0: Array.from(A.roadGeom(r).slice(0, 4)) }; });
  console.log('handles on screen', hd.list.length, 'of', hd.n);
  await p.screenshot({ path: '/tmp/claude-0/i2.png' });
  if (hd.list.length) {
    const [X, Y] = hd.list[0];
    await p.mouse.move(X, Y); await wait(100);
    const c2 = await p.evaluate(() => document.querySelector('canvas').style.cursor);
    ok(c2 === 'grab', 'grab cursor over a dot');
    await p.mouse.down(); await p.mouse.move(X + 30, Y + 20); await p.mouse.move(X + 70, Y + 50); await wait(100);
    await p.screenshot({ path: '/tmp/claude-0/i3.png' });
    await p.mouse.up(); await wait(300);
    const after = await p.evaluate((id) => { const A = window.__A; const o = A.edits.rov[id]; return { has: !!(o && o.pts), selId: A.sel && A.sel.id }; }, s1.id);
    ok(after.has, 'dragging a dot reshapes the road and saves it');
    await p.screenshot({ path: '/tmp/claude-0/i4.png' });
    await p.keyboard.press('Control+z'); await wait(300);
    const und = await p.evaluate((id) => !window.__A.edits.rov[id], s1.id);
    ok(und, 'undo puts the road back');
    // double-click adds a dot
    const n0 = await p.evaluate(() => { const A = window.__A; return A.roadEditable(A.RBY.get(A.sel.id)).h.length; });
    const between = await p.evaluate(() => { const A = window.__A, r = A.RBY.get(A.sel.id), g = A.roadGeom(r), v = A.view; let best = null; for (let k = 0; k < g.length / 2; k++) { const i = ((Math.floor(g.length / 4) + (k % 2 ? 1 : -1) * Math.ceil(k / 2)) * 2 + g.length) % g.length; const X = (g[i] - v.x) * v.s + document.querySelector('#map').clientWidth / 2, Y = (g[i + 1] - v.y) * v.s + document.querySelector('#map').clientHeight / 2; if (X > 150 && X < 950 && Y > 150 && Y < 750 && A.nodeAt(r, { x: X, y: Y }) < 0 && !A.markers.some((m) => m.kind === 'settle' && Math.hypot(m.X - X, m.Y - Y) < 40)) { best = [X, Y]; break; } } return best; });
    if (between) { console.log('between', between, await p.evaluate((b) => { const A = window.__A; const h = A.roadHit(b[0], b[1]); return JSON.stringify([A.sel, h, A.labelAt(b[0], b[1]) && 1, A.tool]); }, between)); await p.mouse.click(between[0], between[1]); console.log('after 1', await p.evaluate(() => JSON.stringify(window.__A.sel))); await p.mouse.click(between[0], between[1]); console.log('after 2', await p.evaluate(() => JSON.stringify(window.__A.sel))); await wait(300); const n1 = await p.evaluate(() => { const A = window.__A; return A.sel && A.sel.kind === 'road' ? A.roadEditable(A.RBY.get(A.sel.id)).h.length : -1; }); ok(n1 === n0 + 1, 'double-tap on the road adds a dot (' + n0 + ' -> ' + n1 + ')'); }
  }
  // 7. a hand-drawn road: draw, then drag its middle point
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await wait(100); await p.evaluate(() => window.__A.setTool('explore')); await p.click('.tool[data-tool="road"]'); await wait(150);
  await p.mouse.click(300, 300); await p.mouse.click(500, 350); await p.mouse.click(650, 250); await wait(100);
  await p.click('[data-act="finish"]'); await wait(300);
  const ur = await p.evaluate(() => { const A = window.__A; return [A.tool, A.sel && A.sel.kind, A.sel && A.sel.id]; });
  ok(ur[0] === 'road' && ur[1] === 'road', 'after finishing, the new road stays selected in the Road tool');
  await p.mouse.move(500, 350); await p.mouse.down(); await p.mouse.move(520, 420); await p.mouse.move(540, 470); await p.mouse.up(); await wait(300);
  const moved = await p.evaluate((id) => { const u = window.__A.edits.radd.find((q) => q.id === id); return u && u.pts; }, ur[2]);
  const vpt = await p.evaluate(() => { const v = window.__A.view; return [(540 - document.querySelector('#map').clientWidth / 2) / v.s + v.x, (470 - document.querySelector('#map').clientHeight / 2) / v.s + v.y]; });
  ok(moved && Math.abs(moved[2] - vpt[0]) < 0.01 && Math.abs(moved[3] - vpt[1]) < 0.01, 'dragging a point of a hand-drawn road moves it');
  await p.screenshot({ path: '/tmp/claude-0/i5.png' });
  // 8. leaving the Road tool drops the road selection
  await p.evaluate(() => window.__A.setTool('explore')); await wait(200);
  const s3 = await p.evaluate(() => window.__A.sel);
  ok(!s3, 'leaving the Road tool deselects the road');
  console.log('ERR', errs.join('\n'));
  await b.close();
})();
