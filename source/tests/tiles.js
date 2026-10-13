// The pixel battle map and the Tiles tool: drawing, painting, buildings, fill, undo per stroke, sync entities,
// saving, player view and the phone layout
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  await ctx.addInitScript(() => { if (!localStorage.getItem('t-init')) { localStorage.setItem('t-init', '1'); localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 300 } })); } });
  const open = async () => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1])); await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2600); await require('./canvas-mouse')(p); return p; };
  const waitCovered = async (p) => { for (let i = 0; i < 80; i++) { await p.waitForTimeout(150); if (await p.evaluate(() => { const A = window.__A; return A.pxCovered() && ![...A.pxVisible].some((k) => { const c = A.pxChunks.get(k); return !c || !c.canvas || c.pend || c.stale; }); })) return true; } return false; };
  let p = await open();

  // ---- the battle map draws over a town, a village and open country
  const town = await p.evaluate(() => { const A = window.__A; const s = A.SET.find((x) => x.tier === 3); return { x: s.x, y: s.y, id: s.id }; });
  await p.evaluate((t) => { const A = window.__A; A.view.x = t.x; A.view.y = t.y; A.view.s = A.CELL * 12; A.clampView(); A.requestRender(); }, town);
  ok(await waitCovered(p), 'the battle map covers the view at 5-ft-square zoom');
  ok(await p.evaluate(() => window.__A.pxAlpha() === 1), 'pixel art is fully shown at battle zoom');
  const lay = await p.evaluate(() => {
    const A = window.__A, span = A.PCS / A.CELL, cx = Math.floor(A.view.x / span), cy = Math.floor(A.view.y / span);
    let worst = 0, buildings = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const t0 = performance.now(); const L = A.pxLayout(cx + i, cy + j); worst = Math.max(worst, performance.now() - t0); for (const v of L.ov) if (v === A.PX.ID.PLANKS || v === A.PX.ID.FLAG) buildings++; }
    return { worst, buildings };
  });
  ok(lay.buildings > 50, 'the town shows its buildings square by square (' + lay.buildings + ' floor squares in the middle 9 chunks)');
  ok(lay.worst < 60, 'laying out a town chunk is quick (' + lay.worst.toFixed(1) + ' ms at worst)');
  await p.screenshot({ path: '/tmp/claude-0/tiles_town.png' });
  // zooming out fades back to the town drawing
  await p.evaluate(() => { const A = window.__A; A.view.s = A.CELL * 3; A.clampView(); A.requestRender(); });
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__A.pxAlpha() === 0), 'zoomed out a little, the town drawing comes back');

  // ---- Tiles tool panel
  await p.evaluate(() => window.__A.setTool('tiles')); await p.waitForTimeout(200);
  let t = await p.$eval('#inspector', (e) => e.innerText);
  ok(/Battle map/i.test(t) && /Zoom to the battle map/i.test(t), 'the Tiles panel asks you to zoom in first');
  await p.click('[data-tw="zoom"]'); await p.waitForTimeout(900);
  await waitCovered(p);
  await p.waitForTimeout(200);
  t = await p.$eval('#inspector', (e) => e.innerText);
  ok(!/Zoom to the battle map/i.test(t) && /Terrain/i.test(t) && /Edge walls/i.test(t), 'once zoomed in, the panel shows the palette');
  ok(await p.evaluate(() => [...document.querySelectorAll('.tw-b img')].every((i) => i.src.startsWith('data:image/png'))), 'palette swatches are drawn by the battle-map renderer');

  // ---- paint a stroke with the mouse: one undo step, synced as chunk entities
  const before = await p.evaluate(() => window.__A.history.length);
  await p.evaluate(() => { const A = window.__A; A.tw.kind = 't'; A.tw.i = A.PX.ID.SAND; A.tw.mode = 'paint'; A.tw.brush = 2; A.renderPanel(); });
  await p.mouse.move(600, 400); await p.mouse.down(); for (let x = 600; x <= 760; x += 20) await p.mouse.move(x, 400 + (x - 600) / 4); await p.mouse.up();
  await p.waitForTimeout(300);
  const st = await p.evaluate(() => { const A = window.__A; const keys = Object.keys(A.edits.bm || {}); let n = 0; for (const k of keys) n += Object.keys(A.edits.bm[k].t || {}).length; return { keys, n, h: A.history.length, label: A.history[A.history.length - 1].label, ent: [...A.flattenEdits(A.edits).keys()].filter((k) => k.startsWith('bm|')) }; });
  ok(st.n >= 16 && st.h === before + 1, 'a drag paints squares as one undo step (' + st.n + ' squares, "' + st.label + '")');
  ok(st.ent.length === st.keys.length && st.ent.length >= 1, 'each painted chunk is one shared entity (' + st.ent.join(', ') + ')');
  const sandNow = await p.evaluate(() => { const A = window.__A; const L = A.twLookup(); const r = document.querySelector('#map').getBoundingClientRect(); const cx = Math.floor((A.view.x + (600 - r.width / 2) / A.view.s) * A.CELL), cy = Math.floor((A.view.y + (400 - r.height / 2) / A.view.s) * A.CELL); return L.t(cx, cy) === A.PX.ID.SAND; });
  ok(sandNow, 'the painted square now reads as sand on the battle map');
  ok(await waitCovered(p), 'the painted chunks redraw');
  await p.screenshot({ path: '/tmp/claude-0/tiles_paint.png' });

  // ---- a building: floor, four walls and a door
  await p.evaluate(() => { const A = window.__A; A.tw.kind = 't'; A.tw.i = A.PX.ID.FLAG; A.tw.mode = 'building'; A.renderPanel(); });
  await p.mouse.move(420, 560); await p.mouse.down(); await p.mouse.move(470, 600); await p.mouse.move(520, 640); await p.mouse.up();
  await p.waitForTimeout(300);
  const bld = await p.evaluate(() => { const A = window.__A; let w = 0, d = 0, f = 0; for (const k in A.edits.bm) { const c = A.edits.bm[k]; for (const e of ['h', 'v']) for (const i in c[e] || {}) { if (c[e][i] === 1) w++; if (c[e][i] === 2) d++; } for (const i in c.t || {}) if (c.t[i] === A.PX.ID.FLAG) f++; } return { w, d, f, label: A.history[A.history.length - 1].label }; });
  ok(bld.w >= 8 && bld.d === 1 && bld.f >= 4, 'dragging out a building gives a stone floor, walls and one door (' + bld.f + ' floor, ' + bld.w + ' walls)');

  // ---- fill stops at the new walls
  const fillRes = await p.evaluate(() => {
    const A = window.__A, r = document.querySelector('#map').getBoundingClientRect();
    const cx = Math.floor((A.view.x + (470 - r.width / 2) / A.view.s) * A.CELL), cy = Math.floor((A.view.y + (600 - r.height / 2) / A.view.s) * A.CELL);
    return { cx, cy };
  });
  await p.evaluate(() => { const A = window.__A; A.tw.kind = 't'; A.tw.i = A.PX.ID.PLANKS; A.tw.mode = 'fill'; A.renderPanel(); });
  await p.mouse.click(470, 600); await p.waitForTimeout(300);
  const filled = await p.evaluate(() => { const A = window.__A; let pl = 0, fl = 0; for (const k in A.edits.bm) { const c = A.edits.bm[k]; for (const i in c.t || {}) { if (c.t[i] === A.PX.ID.PLANKS) pl++; if (c.t[i] === A.PX.ID.FLAG) fl++; } } return { pl, fl }; });
  ok(filled.pl === bld.f && filled.fl === 0, 'fill changes the whole room and stops at its walls (' + filled.pl + ' squares)');

  // ---- undo and redo, one stroke at a time
  const n0 = await p.evaluate(() => JSON.stringify(window.__A.edits.bm));
  await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
  const n1 = await p.evaluate(() => { const A = window.__A; let fl = 0; for (const k in A.edits.bm) for (const i in A.edits.bm[k].t || {}) if (A.edits.bm[k].t[i] === A.PX.ID.FLAG) fl++; return fl; });
  ok(n1 === bld.f, 'undo takes back only the fill');
  await p.keyboard.press('Control+Shift+z'); await p.waitForTimeout(200);
  ok(await p.evaluate((s) => JSON.stringify(window.__A.edits.bm) === s, n0), 'redo puts it back');

  // ---- a stroke cancelled by a second finger leaves nothing behind
  const c0 = await p.evaluate(() => JSON.stringify(window.__A.edits.bm));
  const h0 = await p.evaluate(() => window.__A.history.length);
  await p.evaluate(() => { const A = window.__A; A.tw.kind = 't'; A.tw.i = A.PX.ID.LAVA; A.tw.mode = 'paint'; A.twDown({ x: 300, y: 300 }); A.twUp(true); });
  ok(await p.evaluate((s) => JSON.stringify(window.__A.edits.bm) === s, c0) && (await p.evaluate(() => window.__A.history.length)) === h0, 'a cancelled stroke (pinch or cancel) is reverted without an undo step');

  // ---- a prop and an edge
  await p.evaluate(() => { const A = window.__A; A.tw.kind = 'p'; A.tw.i = A.PX.P.CAMPFIRE; A.tw.mode = 'paint'; A.renderPanel(); });
  await p.mouse.click(300, 300); await p.waitForTimeout(200);
  await p.evaluate(() => { const A = window.__A; A.tw.kind = 'e'; A.tw.i = 3; A.renderPanel(); });
  await p.mouse.move(230, 200); await p.mouse.down(); await p.mouse.move(310, 200); await p.mouse.move(390, 202); await p.mouse.up(); await p.waitForTimeout(200);
  const pe = await p.evaluate(() => { const A = window.__A; let props = 0, fence = 0; for (const k in A.edits.bm) { const c = A.edits.bm[k]; for (const i in c.p || {}) if (c.p[i] === A.PX.P.CAMPFIRE) props++; for (const i in c.h || {}) if (c.h[i] === 3) fence++; } return { props, fence }; });
  ok(pe.props === 1 && pe.fence >= 4, 'props and fence runs go down (' + pe.fence + ' fence lengths)');
  await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/claude-0/tiles_build.png' });

  // ---- saved with the world
  await p.evaluate(() => window.__A.saveAll(true)); await p.waitForTimeout(600);
  const saved = await p.evaluate(() => JSON.stringify(window.__A.edits.bm));
  await p.close();
  p = await open();
  ok(await p.evaluate((s) => JSON.stringify(window.__A.edits.bm) === s, saved), 'battle-map changes are still there after reloading');

  // ---- players see the map but not the tool
  await p.evaluate(() => { const A = window.__A; A.campaign.mode = 'player'; A.applyMode(); A.setTool('tiles'); });
  await p.waitForTimeout(200);
  const pv = await p.evaluate(() => ({ tool: window.__A.tool, vis: getComputedStyle(document.querySelector('.tool[data-tool="tiles"]')).display }));
  ok(pv.tool !== 'tiles' && pv.vis === 'none', 'players do not get the Tiles tool');
  await p.evaluate(() => { const A = window.__A; A.campaign.mode = 'dm'; A.applyMode(); });
  await p.close();

  // ---- phone
  const ph = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ph.addInitScript(() => { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 300 } })); });
  const q = await ph.newPage(); q.on('pageerror', (e) => errs.push(e.message));
  await q.goto('file:///tmp/claude-0/dbg.html'); await q.waitForTimeout(2800);
  await q.evaluate((t) => { const A = window.__A; A.view.x = t.x; A.view.y = t.y; A.view.s = A.CELL * 12; A.clampView(); A.setTool('tiles'); }, town);
  await q.waitForTimeout(1500);
  const fit = await q.evaluate(() => { const bad = []; for (const el of document.querySelectorAll('#inspector *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > innerWidth + 1) bad.push(el.tagName + '.' + el.className); } const tb = document.querySelector('.tool[data-tool="tiles"]').getBoundingClientRect(); return { page: document.documentElement.scrollWidth > innerWidth + 1, bad: bad.slice(0, 4), btn: tb.width > 0 }; });
  ok(!fit.page && !fit.bad.length && fit.btn, 'the Tiles panel fits a phone and the tool is on the toolbar ' + JSON.stringify(fit.bad));
  await q.screenshot({ path: '/tmp/claude-0/tiles_phone.png' });

  console.log('errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
