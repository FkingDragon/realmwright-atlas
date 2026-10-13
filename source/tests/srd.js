// The full SRD lists: Shop and inn bill, 334 monsters with stat blocks, and same-seed worlds unchanged
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  await ctx.addInitScript(() => { if (!localStorage.getItem('t-init')) { localStorage.setItem('t-init', '1'); localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 300 } })); } });
  const open = async () => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1])); await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2600); return p; };
  const p = await open();
  const counts = await p.evaluate(() => { const A = window.__A; A.SRD.items || 0; return { mons: A.SRD.mons.length, extra: Object.keys(A.MON_SRD).length, names: A.allMonNames().length }; });
  ok(counts.mons === 334 && counts.extra > 200, 'all 334 SRD monsters are available (' + counts.extra + ' beyond the built-in cards)');
  // shop in a village and a capital
  const ids = await p.evaluate(() => { const A = window.__A; return { vil: A.SET.find((s) => s.tier === 1 && s.pop >= 300).id, cap: A.SET.find((s) => s.tier === 4).id }; });
  const shopText = async (sid) => { await p.evaluate((sid) => { const A = window.__A; A.setTool('market'); A.market.sid = sid; A.market.tab = 'shop'; A.renderPanel(); }, sid); await p.waitForTimeout(400); return p.$eval('#inspector', (e) => e.innerText); };
  let t = await shopText(ids.vil);
  ok(/At the inn/i.test(t) && /Everything for sale/i.test(t) && /Search 618 items/i.test(t), 'the Shop tab shows the inn bill and the full item list (581 priced SRD items + 37 everyday)');
  const ev = await p.evaluate((sid) => { const A = window.__A; const s = A.SET.find((x) => x.id === sid); const its = A.SRD.items.filter((x) => ['Food', 'Drink', 'Lodging', 'Services', 'Wages'].includes(x.cat)); const pr = (n) => A.shopItem(its.find((x) => x.name === n), s, A.market.day); return { n: its.length, ale: pr('Ale').gp, fine: pr('Wine, fine').ok, coins: document.querySelectorAll('#inspector .c-gp, #inspector .c-sp, #inspector .c-cp').length, ids: new Set(A.SRD.items.map((x) => x.id)).size === A.SRD.items.length }; }, ids.vil);
  ok(ev.n === 37 && ev.ale > 0.02 && ev.ale < 0.08 && !ev.fine && ev.ids, 'the 37 everyday prices are in, priced locally (ale ' + (ev.ale * 100).toFixed(1) + ' cp), fine wine needs a town, every id is unique');
  ok(ev.coins > 10, 'prices show in coloured coins (' + ev.coins + ')');
  const vilPlate = await p.evaluate((sid) => { const A = window.__A; const it = A.SRD.items.find((x) => x.name === 'Plate Armor'); return A.shopItem(it, A.SET.find((s) => s.id === sid), A.market.day); }, ids.vil);
  const capPlate = await p.evaluate((sid) => { const A = window.__A; const it = A.SRD.items.find((x) => x.name === 'Plate Armor'); return A.shopItem(it, A.SET.find((s) => s.id === sid), A.market.day); }, ids.cap);
  ok(!vilPlate.ok && capPlate.gp > 0, 'plate armour needs a bigger market than a village (' + vilPlate.why + ')');
  const total1 = await p.$eval('.inn-total b', (e) => e.textContent);
  await p.fill('#inn-n', '5'); await p.waitForTimeout(200);
  const total5 = await p.$eval('.inn-total b', (e) => e.textContent);
  ok(total1 !== total5, 'the inn total changes as you type (' + total1 + ' → ' + total5 + ')');
  await p.fill('#shop-q', 'rope'); await p.waitForTimeout(200);
  const rows = await p.$$eval('.shop-t tr.item', (r) => r.length);
  ok(rows >= 2 && rows < 10, 'search filters the list (' + rows + ' rows for "rope")');
  await p.click('.shop-t tr.item'); await p.waitForTimeout(150);
  ok(!!(await p.$('.shop-t .note')), 'tapping an item shows its description');
  await p.screenshot({ path: '/tmp/claude-0/srd_shop.png' });
  // magic items only in cities and capitals, legendary never
  const magic = await p.evaluate((ids) => { const A = window.__A; const g = (n, sid) => A.shopItem(A.SRD.items.find((x) => x.name === n), A.SET.find((s) => s.id === sid), A.market.day); return { vor: g('Vorpal Sword', ids.cap).ok, bag: g('Bag of Holding', ids.vil).ok, bagCap: g('Bag of Holding', ids.cap).gp }; }, ids);
  ok(!magic.vor && !magic.bag && magic.bagCap >= 101 && magic.bagCap <= 600, 'legendary items are never sold, and magic needs a city (bag of holding ' + Math.round(magic.bagCap) + ' gp in the capital)');
  // bestiary: aboleth with a full stat block, placed and kept after reload
  await p.evaluate(() => { const A = window.__A; A.setTool('monsters'); A.monUI.tab = 'bestiary'; A.monUI.q = 'aboleth'; A.renderPanel(); }); await p.waitForTimeout(300);
  t = await p.$eval('#inspector', (e) => e.innerText);
  ok(/Aboleth/.test(t), 'the Bestiary finds the aboleth');
  await p.evaluate(() => window.__A.showMonster('Aboleth')); await p.waitForTimeout(200);
  const card = await p.$eval('#monPop', (e) => e.innerText);
  ok(/Full stat block/i.test(card) && /Legendary actions/i.test(card) && /STR/.test(card), 'its card shows the full stat block');
  await p.evaluate(() => { document.getElementById('monPop').hidden = true; });
  const placed = await p.evaluate(() => { const A = window.__A; const s = A.SET.find((x) => x.tier === 2); A.commit('Place Aboleth', () => { A.edits.next++; A.edits.monAdd.push({ id: 'p' + A.edits.next, name: 'Aboleth', count: 1, x: s.x + 1, y: s.y, b: 2, d: A.market.day, notes: '', custom: { cr: A.MON_SRD.Aboleth[4], ac: A.MON_SRD.Aboleth[1], hp: A.MON_SRD.Aboleth[2], type: A.MON_SRD.Aboleth[0] } }); }, {}); return 'p' + A.edits.next; });
  await p.evaluate(() => window.__A.saveAll(true)); await p.waitForTimeout(500);
  await p.close();
  const q = await open();
  const kept = await q.evaluate((id) => { const A = window.__A; const m = A.edits.monAdd.find((x) => x.id === id); return m && m.name + ':' + m.custom.cr; }, placed);
  ok(kept === 'Aboleth:10', 'a placed SRD creature survives a reload (' + kept + ')');
  // natural spawns use only the built-in list: same seed, same world
  const spawnNames = await q.evaluate(() => { const A = window.__A; const set = new Set(); for (const sp of A.spawnsIn(0, 0, 4096, 2560, 300)) if (sp.kind !== 'placed') set.add(sp.name); return [...set].filter((n) => !A.MON[n]).length; });
  ok(spawnNames === 0, 'natural spawns never use the new creatures, so worlds are unchanged');
  console.log('errors', errs.length ? errs : 'none');
  await b.close();
})();
