// Save safety: worlds are never lost to a new world, two tabs never overwrite each other, damaged saves recover
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
  await ctx.addInitScript(() => { if (!localStorage.getItem('t-init')) { localStorage.setItem('t-init', '1'); localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 240 } })); } });
  const open = async () => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1])); await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2600); return p; };
  const p = await open();
  const rename = (pg, name) => pg.evaluate((name) => { const A = window.__A; const s = A.SET.find((x) => x.tier === 2); A.patchSettlement(s.id, { name }, 'Rename'); return s.id; }, name);
  const sid = await rename(p, 'Keepsake');
  await p.evaluate(() => window.__A.saveAll(true)); await p.waitForTimeout(400);
  const cid1 = await p.evaluate(() => window.__A.campaign.cid);
  // 1. a new world keeps the old one
  await p.click('#btnWorld'); await p.waitForTimeout(300);
  await p.click('[data-w="random"]'); await p.waitForTimeout(200); await p.click('[data-w="yes"]'); await p.waitForTimeout(3500);
  const after = await p.evaluate(async () => { const A = window.__A; return { seed: A.SEED || null, cid: A.campaign.cid, index: (await A.readIndex()).map((x) => x.cid + ':' + x.n) }; });
  ok(after.cid !== cid1 && after.index.some((x) => x.startsWith(cid1 + ':')), 'starting a new world keeps the old one in Your other worlds');
  await p.click('#btnWorld'); await p.waitForTimeout(500);
  const listed = await p.$$eval('#worldList [data-w="openw"]', (e) => e.map((x) => x.dataset.v));
  ok(listed.includes(cid1), 'the World menu lists the old world');
  await p.click('[data-w="openw"][data-v="' + cid1 + '"]'); await p.waitForTimeout(3500);
  const back = await p.evaluate((sid) => { const A = window.__A; const s = A.SET.find((x) => x.id === sid); return { cid: A.campaign.cid, name: s && s.name }; }, sid);
  ok(back.cid === cid1 && back.name === 'Keepsake', 'opening it again brings back its edits');
  // 2. two tabs on one world
  const q = await open();
  const sameWorld = await q.evaluate(() => window.__A.campaign.cid);
  ok(sameWorld === cid1, 'a second tab opens the same world');
  await rename(q, 'Newer');
  await q.evaluate(() => window.__A.saveAll(true)); await q.waitForTimeout(500);
  const stale = await p.evaluate(() => window.__A.campaign.stale);
  ok(stale, 'the first tab notices the second tab saved newer work');
  await rename(p, 'Older'); await p.evaluate(() => window.__A.saveAll(true)); await p.waitForTimeout(500);
  const kept = await p.evaluate(async (cid) => { const raw = await window.__A.idbGet('w:' + cid); const d = JSON.parse(raw); return JSON.stringify(d.edits.ov); }, cid1);
  ok(/Newer/.test(kept) && !/Older/.test(kept), 'the stale tab does not overwrite the newer save');
  const banner = await p.$eval('#saveWarn', (e) => !e.hidden && /another tab/.test(e.textContent)).catch(() => false);
  ok(banner, 'the stale tab shows a banner offering reload or keeping its version');
  await p.click('[data-sw="mine"]'); await p.waitForTimeout(600);
  const mine = await p.evaluate(async (cid) => { const d = JSON.parse(await window.__A.idbGet('w:' + cid)); return JSON.stringify(d.edits.ov); }, cid1);
  const qStale = await q.evaluate(() => window.__A.campaign.stale);
  ok(/Older/.test(mine) && qStale, 'choosing "keep this tab\'s version" saves it and the other tab steps back');
  await q.close();
  // 3. clearing edits keeps a snapshot you can restore
  await p.evaluate(() => { window.__A.campaign.stale = false; });
  await p.click('#btnWorld'); await p.waitForTimeout(300);
  await p.click('[data-w="clear"]'); await p.waitForTimeout(200); await p.click('[data-w="yes"]'); await p.waitForTimeout(3500);
  const cleared = await p.evaluate((sid) => window.__A.SET.find((x) => x.id === sid).name, sid);
  const snaps = await p.evaluate(async () => { const A = window.__A; const s = await A.listSnapshots(); const out = []; for (const x of s.slice(0, 3)) { const r = await A.readSnapshot(x.key); out.push({ key: x.key, why: r && r.why }); } return out; });
  const before = snaps.find((x) => /clearing/.test(x.why || ''));
  ok(cleared !== 'Older' && before, 'clearing edits takes a labelled snapshot first');
  await p.click('#btnWorld'); await p.waitForTimeout(500);
  await p.click('[data-w="snap"][data-v="' + before.key + '"]'); await p.waitForTimeout(200); await p.click('[data-w="yes"]'); await p.waitForTimeout(3500);
  const restored = await p.evaluate((sid) => window.__A.SET.find((x) => x.id === sid).name, sid);
  ok(restored === 'Older', 'restoring that snapshot brings the edits back');
  // 4. edits made while a save is running are saved too
  await p.evaluate(async (sid) => { const A = window.__A; const s1 = A.saveAll(true); A.patchSettlement(sid, { name: 'Late edit' }, 'Rename'); A.saveAll(); await s1; }, sid);
  await p.waitForTimeout(800);
  const late = await p.evaluate(async (cid) => JSON.stringify(JSON.parse(await window.__A.idbGet('w:' + cid)).edits.ov), cid1);
  ok(/Late edit/.test(late), 'an edit made during a save is not dropped');
  // 5. a damaged save is recovered from a snapshot
  await p.evaluate(async (cid) => { await window.__A.idbSet('w:' + cid, '{"broken'); localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 3, inIdb: true, cid, seed: 777 })); }, cid1);
  await p.close();
  const r = await open();
  const rec = await r.evaluate((sid) => { const A = window.__A; const s = A.SET.find((x) => x.id === sid); return { msg: A.campaign.recovered, name: s && s.name, dlg: !!document.querySelector('#atlasDialog:not([hidden])') }; }, sid);
  ok(rec.msg && rec.dlg && rec.name, 'a damaged save is recovered from the newest snapshot, with a message');
  const rcid = await r.evaluate(() => window.__A.campaign.cid);
  ok(rcid === cid1, 'the recovered world keeps its identity');
  console.log('errors', errs.length ? errs : 'none');
  await b.close();
})();
