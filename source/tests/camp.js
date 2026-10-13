const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const URL = 'file:///tmp/claude-0/dbg.html';
  // ---- 1. a fresh world saves to the database and survives a reload
  let ctx = await b.newContext({ viewport: { width: 1300, height: 860 }, acceptDownloads: true });
  let p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('1: ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.addInitScript(() => { if (!localStorage.getItem('atlas-world-v1')) localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 240 } })); });
  await p.goto(URL); await p.waitForTimeout(2600);
  const seed1 = await p.evaluate(() => window.__A.T && document.getElementById('seedLabel').textContent);
  // track someone and add a note (an interaction that should freeze them)
  const npc = await p.evaluate(() => { const A = window.__A; const s = A.SET.filter((x) => x.tier === 2)[3]; const q = A.townPeople(s).list[9]; return { id: q.id, name: q.first + ' ' + (q.last || ''), job: q.job }; });
  await p.evaluate((id) => { const A = window.__A; A.setTool('people'); A.openPerson ? 0 : 0; const b = document.createElement('button'); b.className = 'link'; b.dataset.pp = 'npc'; b.dataset.v = id; document.getElementById('inspector').appendChild(b); b.click(); }, npc.id);
  await p.waitForTimeout(300);
  await p.click('[data-pp="track"]'); await p.waitForTimeout(200);
  await p.evaluate(() => window.__A.saveAll()); await p.waitForTimeout(600);
  const snap = await p.evaluate((id) => !!(window.__A.edits.npcSnap && window.__A.edits.npcSnap[id]), npc.id);
  ok(snap, 'tracking someone freezes their details in the save');
  const inIdb = await p.evaluate(async () => { const cur = await window.__A.idbGet('cur'); const raw = await window.__A.idbGet('w:' + cur); return raw ? JSON.parse(raw).gen : null; });
  ok(inIdb === 20, 'the world is saved in the browser database (generator version ' + inIdb + ')');
  // ---- 2. backup file download
  await p.click('#btnWorld'); await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-w="backup"]')]);
  const fpath = '/tmp/claude-0/dl/backup.json'; await dl.saveAs(fpath);
  const bk = JSON.parse(fs.readFileSync(fpath, 'utf8'));
  ok(bk.kind === 'realmwright-campaign' && bk.seed === 777 && bk.edits.npc[npc.id], 'backup file holds the world and your notes');
  const menu = await p.$eval('#worldBody', (e) => e.innerText.replace(/\n+/g, ' | '));
  console.log('MENU', menu.slice(0, 500));
  // ---- 3. DM password and player mode
  await p.fill('#f-setpw', 'dragon'); await p.click('[data-w="setpw"]'); await p.waitForTimeout(400);
  const [dl2] = await Promise.all([p.waitForEvent('download'), p.click('[data-w="handout"]')]);
  const hpath = '/tmp/claude-0/dl/players.json'; await dl2.saveAs(hpath);
  const ho = JSON.parse(fs.readFileSync(hpath, 'utf8'));
  ok(ho.mode === 'player' && ho.edits.dmLock && !(ho.edits.npc[npc.id] || {}).notes, 'player file opens in player mode without DM notes');
  await p.click('[data-w="mode"][data-v="player"]'); await p.waitForTimeout(400);
  const hid = await p.evaluate(() => ({ player: document.body.classList.contains('player'), settle: getComputedStyle(document.querySelector('.tool[data-tool="settle"]')).display, mons: getComputedStyle(document.querySelector('.tool[data-tool="monsters"]')).display }));
  ok(hid.player && hid.settle === 'none' && hid.mons === 'none', 'player mode hides the editing and monster tools');
  // a thief's card in player mode
  const thief = await p.evaluate(() => { const A = window.__A; for (const s of A.SET.filter((x) => x.tier >= 3)) { const q = A.residents(s).find((r) => r.secretJob); if (q) return q.id; } return null; });
  await p.evaluate((id) => { const A = window.__A; A.setTool('people'); const b = document.createElement('button'); b.className = 'link'; b.dataset.pp = 'npc'; b.dataset.v = id; document.getElementById('inspector').appendChild(b); b.click(); }, thief);
  await p.waitForTimeout(300);
  const card = await p.$eval('#inspector', (e) => e.innerText);
  ok(!/Secretly|Really:|SECRET\b|WANTS/i.test(card.replace(/Secret lover/g, '')), 'a thief\'s card hides their secret job, secrets and motives from players');
  const orgs = await p.evaluate(() => { const A = window.__A; const s = A.SET.filter((x) => x.tier === 4)[0]; return A.orgsShown(s).join(','); });
  ok(!/thieves/.test(orgs), 'the thieves\' guild is hidden from players (' + orgs + ')');
  // switching back needs the password
  await p.click('#btnWorld'); await p.waitForTimeout(200); await p.click('#btnWorld'); await p.waitForTimeout(300);
  await p.fill('#f-dmpw', 'wrong'); await p.click('[data-w="unlock"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__A.isPlayer()), 'a wrong password keeps player mode');
  await p.fill('#f-dmpw', 'dragon'); await p.click('[data-w="unlock"]'); await p.waitForTimeout(400);
  ok(!(await p.evaluate(() => window.__A.isPlayer())), 'the right password switches back to DM');
  await p.screenshot({ path: '/tmp/claude-0/c1.png' });
  await ctx.close();
  // ---- 4. a fresh browser loads the player file
  ctx = await b.newContext({ viewport: { width: 1300, height: 860 } });
  p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('4: ' + e.message));
  await p.goto(URL); await p.waitForTimeout(2600);
  await p.click('#btnWorld'); await p.waitForTimeout(300);
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-w="file"]')]);
  await fc.setFiles(hpath); await p.waitForTimeout(600);
  const conf = await p.$('[data-w="yes"]'); if (conf) { await conf.click(); }
  await p.waitForTimeout(2600);
  const st = await p.evaluate(() => ({ seed: document.getElementById('seedLabel').textContent, player: window.__A.isPlayer() }));
  ok(st.seed === '777' && st.player, 'a player opening the player file gets the same world in player mode');
  await p.screenshot({ path: '/tmp/claude-0/c2.png' });
  await ctx.close();
  // ---- 5. an old save shows what changed
  ctx = await b.newContext({ viewport: { width: 1300, height: 860 } });
  p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('5: ' + e.message));
  await p.addInitScript(() => { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 15, seed: 777, edits: {}, market: { day: 240 }, savedAt: 1 })); });
  await p.goto(URL); await p.waitForTimeout(2800);
  const dlg = await p.$eval('#atlasDialog', (e) => e.innerText).catch(() => '');
  ok(/older version/.test(dlg) && /v16/.test(dlg), 'opening an older world lists what changed since');
  await p.screenshot({ path: '/tmp/claude-0/c3.png' });
  await ctx.close();
  // ---- 6. storage blocked: a clear warning
  ctx = await b.newContext({ viewport: { width: 1300, height: 860 } });
  p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('6: ' + e.message));
  await p.addInitScript(() => { try { Object.defineProperty(window, 'indexedDB', { value: { open() { throw new Error('blocked'); } } }); } catch (e) {} const orig = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'atlas-world-v1') { const er = new Error('full'); er.name = 'QuotaExceededError'; throw er; } return orig.call(this, k, v); }; });
  await p.goto(URL); await p.waitForTimeout(3500);
  const warn = await p.$eval('#saveWarn', (e) => (e.hidden ? '' : e.innerText)).catch(() => '');
  ok(/not being saved/.test(warn), 'when storage is full the app says so and offers a backup');
  await p.screenshot({ path: '/tmp/claude-0/c4.png' });
  await ctx.close();
  console.log('ERR', errs.join('\n'));
  await b.close();
})();
