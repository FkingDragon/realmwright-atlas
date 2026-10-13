// The live shared world, with a stand-in for the claude.ai shared-page database. Three people in separate browsers:
// the owner (DM), an Editor (co-DM) and a player. Access rules are enforced the way the real page declares them.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const store = {};            // path -> body
  let failNext = null;         // the next write fails with this code (to test resending)
  const pages = [];
  const isAdmin = (r) => r === 'owner' || r === 'editor';
  const readable = (r, p) => isAdmin(r) || !p.startsWith('dm/');
  const writable = (r, p) => isAdmin(r) || p === 'heroes/u_' + r;
  const notifyAll = () => { for (const pg of pages) pg.evaluate(() => window.__dbNotify && window.__dbNotify()).catch(() => {}); };
  const mock = (role) => `(() => {
    const role = '${role}', uid = 'u_' + role, admin = ${isAdmin(role)};
    let cache = {}; const L = [];
    const snap = (path) => ({ id: path.split('/').pop(), exists: path in cache, data: () => (path in cache ? JSON.parse(JSON.stringify(cache[path])) : undefined), metadata: { fromCache: false, hasPendingWrites: false } });
    const childrenOf = (col) => Object.keys(cache).filter((p) => p.startsWith(col + '/') && p.split('/').length === col.split('/').length + 1).sort();
    function fire() {
      for (const l of L) {
        if (l.dead) continue;
        if (l.kind === 'doc') { const j = JSON.stringify(cache[l.path]); if (j !== l.last || !l.started) { l.started = true; l.last = j; l.next(snap(l.path)); } continue; }
        const now = new Map(childrenOf(l.path).map((p) => [p, JSON.stringify(cache[p])])), ch = [];
        for (const [p, j] of now) { if (!l.last.has(p)) ch.push({ type: 'added', doc: snap(p) }); else if (l.last.get(p) !== j) ch.push({ type: 'modified', doc: snap(p) }); }
        for (const [p, j] of l.last) if (!now.has(p)) ch.push({ type: 'removed', doc: { id: p.split('/').pop(), exists: true, data: () => JSON.parse(j), metadata: {} } });
        if (ch.length || !l.started) { l.started = true; l.last = now; const docs = [...now.keys()].map(snap); l.next({ docs, size: docs.length, empty: !docs.length, docChanges: () => ch, metadata: { fromCache: false, hasPendingWrites: false } }); }
      }
    }
    async function refresh() { cache = await window.__dbCall(role, 'dump'); fire(); }
    window.__dbNotify = () => refresh();
    const write = async (op, path, data) => { const r = await window.__dbCall(role, op, path, data); if (r && r.error) throw { code: r.error, message: r.error }; await refresh(); };
    const docRef = (path) => ({ id: path.split('/').pop(), path, get: async () => { await refresh(); return snap(path); }, set: (d) => write('set', path, d), update: (d) => write('update', path, d), delete: () => write('delete', path), onSnapshot: (next, err) => { const l = { kind: 'doc', path, next, err }; L.push(l); refresh(); return () => { l.dead = true; }; }, collection: (c) => colRef(path + '/' + c) });
    const colRef = (path) => ({ path, doc: (id) => docRef(path + '/' + (id || Math.random().toString(36).slice(2))), onSnapshot: (next, err) => { const l = { kind: 'col', path, next, err, last: new Map() }; L.push(l); refresh(); return () => { l.dead = true; }; }, get: async () => { await refresh(); const docs = childrenOf(path).map(snap); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [] }; } });
    const db = Object.freeze({ doc: docRef, collection: colRef });
    const user = Object.freeze({ id: async () => uid, isOwner: async () => role === 'owner', canEdit: async () => admin, can: async (n) => (n === 'data.write' ? admin : false), me: async () => ({ id: uid, name: role, isOwner: role === 'owner', canEdit: admin }), profiles: async (ids) => Object.fromEntries(ids.map((i) => [i, { id: i, name: i.slice(2, 3).toUpperCase() + i.slice(3) }])) });
    window.claude = { use: (n) => new Promise((r) => setTimeout(() => r(n === 'db' ? db : n === 'user' ? user : null), 40)) };
  })();`;
  async function person(role, seed) {
    const ctx = await b.newContext({ viewport: { width: 1250, height: 820 } });
    await ctx.exposeBinding('__dbCall', (src, r, op, path, data) => {
      if (op === 'dump') { const o = {}; for (const p in store) if (readable(r, p)) o[p] = store[p]; return o; }
      if (!writable(r, path)) return { error: 'invalid_argument' };
      if (failNext && op !== 'dump') { const c = failNext; failNext = null; return { error: c }; }
      if (op === 'set') store[path] = JSON.parse(JSON.stringify(data));
      else if (op === 'update') { if (!(path in store)) return { error: 'invalid_argument' }; Object.assign(store[path], data); }
      else if (op === 'delete') delete store[path];
      setTimeout(notifyAll, 5);
      return { ok: 1 };
    });
    await ctx.addInitScript(mock(role));
    await ctx.addInitScript((seed) => { if (!localStorage.getItem('t-init')) { localStorage.setItem('t-init', '1'); localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed, edits: {}, market: { day: 240 } })); } }, seed);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(role + ': ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
    await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(3000);
    pages.push(p);
    return p;
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // 1. the owner shares the world
  const dm = await person('owner', 777);
  await dm.click('#btnWorld'); await dm.waitForTimeout(400);
  const offer = await dm.$('[data-w="sharestart"]');
  ok(!!offer, 'the DM is offered "Share this world live"');
  await offer.click(); await wait(1500);
  ok(store['world/meta'] && store['world/meta'].seed === 777, 'sharing writes the world\'s seed and calendar');
  await dm.keyboard.press('Escape');
  const ids = await dm.evaluate(() => {
    const A = window.__A; const towns = A.SET.filter((x) => x.tier === 2); const T = towns[3], U = towns[8], V = towns[14];
    const npc = A.townPeople(T).list[7];
    A.patchSettlement(T.id, { name: 'Dragonsreach' }, 'Rename');
    A.commit('Note', () => { A.edits.npc[npc.id] = { tracked: 1, notes: 'Secretly the duke spy' }; }, {});
    A.commit('Place monster', () => { A.edits.monAdd.push({ id: 'p' + A.edits.next++, name: 'Owlbear', x: T.x + 1, y: T.y, count: 1, cr: '3', day: A.market.day }); }, {});
    A.commit('Label', () => { A.edits.labels.push({ id: 'l' + A.edits.next++, x: U.x, y: U.y, text: 'Old battlefield', size: 'm' }); }, {});
    return { T: T.id, U: U.id, V: V.id, npc: npc.id, next: A.edits.next };
  });
  await wait(2000);
  const kinds = Object.keys(store).reduce((a, p) => { const k = p.split('/')[0]; a[k] = (a[k] || 0) + 1; return a; }, {});
  ok(kinds.w > 0 && kinds.dm >= 2, 'edits are stored as separate entities, DM secrets apart (' + JSON.stringify(kinds) + ')');
  ok(ids.next >= 100000, 'this DM creates ids from their own block, so two DMs never clash (' + ids.next + ')');
  ok(!JSON.stringify(Object.entries(store).filter(([p]) => p.startsWith('w/'))).includes('duke'), 'the DM\'s note is not in the part players can read');
  // 2. a player joins from a different world
  const pl = await person('player', 4242);
  await wait(2500);
  const P = await pl.evaluate((ids) => { const A = window.__A; const T = A.SET.find((s) => s.id === ids.T); return { seed: A.SEED, name: T && T.name, notes: (A.edits.npc[ids.npc] || {}).notes, tracked: (A.edits.npc[ids.npc] || {}).tracked, mon: A.edits.monAdd.length, label: A.edits.labels.map((l) => l.text).join(), mode: A.campaign.mode, shared: A.campaign.shared, chip: (document.getElementById('liveChip') || {}).textContent || '' }; }, ids);
  ok(P.seed === 777 && P.name === 'Dragonsreach' && P.label === 'Old battlefield', 'the player sees the DM\'s world, renames and labels');
  ok(!P.notes && P.mon === 0, 'the player cannot see the DM\'s notes or placed monsters');
  ok(P.mode === 'player' && P.shared && /Live from your DM/.test(P.chip), 'the player is in player view with a live indicator');
  await pl.click('#btnWorld'); await pl.waitForTimeout(400);
  const plMenu = await pl.$eval('#worldBody', (e) => ({ modes: !!e.querySelector('[data-w="mode"]'), seed: !!e.querySelector('[data-w="seed"]'), live: /Live\./.test(e.textContent) }));
  ok(!plMenu.modes && !plMenu.seed && plMenu.live, 'the player cannot switch to DM mode or change the world');
  await pl.keyboard.press('Escape');
  const before4242 = await pl.evaluate(async () => (await window.__A.readIndex()).map((x) => x.seed));
  ok(before4242.includes(4242), 'the player\'s own world was kept in their browser');
  // 3. the co-DM joins, sees secrets, and edits at the same time as the DM
  const co = await person('editor', 1000);
  await wait(2500);
  const C = await co.evaluate((ids) => { const A = window.__A; return { notes: (A.edits.npc[ids.npc] || {}).notes, mon: A.edits.monAdd.length, mode: A.campaign.mode }; }, ids);
  ok(/duke/.test(C.notes || '') && C.mon === 1 && C.mode === 'dm', 'the co-DM sees notes and monsters in DM view');
  await Promise.all([
    dm.evaluate((ids) => window.__A.patchSettlement(ids.U, { name: 'Ashford-by-Sea' }, 'Rename'), ids),
    co.evaluate((ids) => window.__A.patchSettlement(ids.V, { name: 'Coldharbour' }, 'Rename'), ids)
  ]);
  await wait(2500);
  const names = async (pg) => pg.evaluate((ids) => { const A = window.__A; return [ids.T, ids.U, ids.V].map((id) => A.SET.find((s) => s.id === id).name).join(' / '); }, ids);
  const nD = await names(dm), nC = await names(co), nP = await names(pl);
  ok(nD === nC && nC === nP && /Ashford-by-Sea/.test(nD) && /Coldharbour/.test(nD), 'two DMs editing at once: both changes reach everyone (' + nP + ')');
  // 4. undo only takes back your own step
  await dm.evaluate(() => { document.getElementById('btnUndo').click(); });
  await wait(2500);
  const nP2 = await names(pl);
  ok(!/Ashford-by-Sea/.test(nP2) && /Coldharbour/.test(nP2) && /Dragonsreach/.test(nP2), 'the DM\'s undo takes back only their own change (' + nP2 + ')');
  // 5. calendar
  await dm.evaluate(() => { window.__A.setTool('market'); }); await dm.waitForTimeout(300);
  await dm.click('[data-mk="day"][data-v="7"]'); await wait(4000);
  const days = [await dm.evaluate(() => window.__A.market.day), await pl.evaluate(() => window.__A.market.day)];
  ok(days[0] === days[1] && days[0] === 247, 'the player\'s calendar follows the DM (' + days.join(' / ') + ')');
  await pl.evaluate(() => { window.__A.setTool('market'); }); await pl.waitForTimeout(300);
  ok(!(await pl.$('.mk-ctl:not([hidden]) [data-mk="day"]').then((x) => x && x.isVisible())), 'the player has no calendar buttons');
  // 6. a player's hero appears for the DM
  await pl.evaluate(() => { const A = window.__A; const h = A.newHero(true); A.quickBuild(h, 'rogue'); h.name = 'Pip Quickfingers'; A.heroes.list.push(h); A.heroes.cur = h.id; A.heroSave ? A.heroSave() : 0; });
  await pl.evaluate(() => { const A = window.__A; A.setTool('heroes'); A.renderPanel(); });
  await wait(3500);
  await dm.evaluate(() => { const A = window.__A; A.setTool('heroes'); A.renderPanel(); }); await dm.waitForTimeout(500);
  const party = await dm.$eval('#inspector', (e) => e.innerText);
  ok(/At the table/i.test(party) && /Pip Quickfingers/.test(party) && /played by Player/i.test(party), 'the player\'s hero shows on the DM\'s Heroes panel with HP and AC');
  await dm.screenshot({ path: '/tmp/claude-0/share_dm.png' });
  await pl.evaluate(() => { const A = window.__A; A.setTool('explore'); }); await pl.screenshot({ path: '/tmp/claude-0/share_player.png' });
  // 6b. battle-map painting reaches players, one chunk at a time
  await dm.evaluate(() => { const A = window.__A; A.commit('Paint sand', () => { A.edits.bm['900,900'] = { t: { 0: 2, 1: 2 } }; }, { bm: [27, 27, 28, 28] }); });
  await wait(3000);
  const bmPl = await pl.evaluate(() => JSON.stringify((window.__A.edits.bm || {})['900,900'] || null));
  ok(bmPl === JSON.stringify({ t: { 0: 2, 1: 2 } }), 'battle-map painting reaches the player (' + bmPl + ')');
  const feed = await pl.evaluate(() => { const A = window.__A; return A.recentChangesHtml(); });
  const who = (/<b>([^<]+)<\/b> Painted the battle map/.exec(feed) || [])[1];
  ok(/class="ava"/.test(feed) && who && who !== 'You', 'the player sees the change in Recent changes, with the DM\'s name and avatar (' + who + ')');
  const feedDm = await dm.evaluate(() => window.__A.recentChangesHtml());
  ok(/<b>You<\/b> Painted the battle map/.test(feedDm), 'the DM sees their own change as "You"');
  // 6c. a change that fails to send is kept, listed and sent again
  failNext = 'internal';
  await dm.evaluate(() => { const A = window.__A; A.commit('Paint', () => { A.edits.bm['901,901'] = { t: { 0: 3 } }; }, { bm: [27, 27, 28, 28] }); });
  await wait(1500);
  const un = await dm.evaluate(() => window.__A.share.unsent.size);
  const chip1 = await dm.$eval('#liveChip', (e) => e.textContent);
  ok(un === 1 && !('w/' + 'x' in store) && /not sent/.test(chip1), 'a failed change is kept and shown as not sent (' + chip1 + ')');
  await dm.click('#btnWorld'); await dm.waitForTimeout(300);
  await dm.click('[data-w="shareretry"]'); await wait(2500);
  const got = await pl.evaluate(() => JSON.stringify((window.__A.edits.bm || {})['901,901'] || null));
  ok(got === JSON.stringify({ t: { 0: 3 } }) && (await dm.evaluate(() => window.__A.share.unsent.size)) === 0, 'Try again sends it and the player gets it');
  await dm.keyboard.press('Escape');
  // 6d. offline: changes wait, then go when the connection returns
  await dm.evaluate(() => window.dispatchEvent(new Event('offline')));
  await dm.evaluate(() => { const A = window.__A; A.commit('Paint', () => { A.edits.bm['902,902'] = { t: { 0: 4 } }; }, { bm: [27, 27, 28, 28] }); });
  await wait(1200);
  const off = await dm.$eval('#liveChip', (e) => e.textContent), early = await pl.evaluate(() => !!(window.__A.edits.bm || {})['902,902']);
  ok(/Offline/.test(off) && !early, 'offline, changes wait in the browser (' + off + ')');
  await dm.evaluate(() => window.dispatchEvent(new Event('online')));
  await wait(2500);
  ok(await pl.evaluate(() => !!(window.__A.edits.bm || {})['902,902']), 'back online, the waiting change reaches the player');
  // 6e. two DMs change the same thing: the one who was overwritten is told
  const toastsBefore = await dm.evaluate(() => document.getElementById('toast').textContent);
  await dm.evaluate(() => { const A = window.__A; A.commit('Paint', () => { A.edits.bm['903,903'] = { t: { 0: 5 } }; }, { bm: [27, 27, 28, 28] }); });
  await wait(1500);
  await co.evaluate(() => { const A = window.__A; A.commit('Paint', () => { A.edits.bm['903,903'] = { t: { 0: 6 } }; }, { bm: [27, 27, 28, 28] }); });
  await wait(2000);
  const clash = await dm.evaluate(() => document.getElementById('toast').textContent);
  ok(/changed the same thing/.test(clash) && (await dm.evaluate(() => window.__A.edits.bm['903,903'].t[0])) === 6, 'the DM is told when a co-DM overwrites the same thing a moment later (' + clash.slice(0, 80) + ')');
  // 7. the DM starts a new world: everyone moves to it
  await dm.evaluate(() => { window.__A.setTool('explore'); });
  await dm.click('#btnWorld'); await dm.waitForTimeout(400);
  await dm.fill('#f-seed', '5150'); await dm.click('[data-w="seed"]'); await dm.waitForTimeout(200); await dm.click('[data-w="yes"]');
  await wait(6000);
  const seeds = [await dm.evaluate(() => window.__A.SEED), await pl.evaluate(() => window.__A.SEED), await co.evaluate(() => window.__A.SEED)];
  ok(seeds.every((s) => s === 5150), 'a DM\'s new world reaches everyone (' + seeds.join(', ') + ')');
  const stale = Object.keys(store).filter((p) => p.startsWith('w/') && store[p].k && store[p].k.startsWith('ov|' + ids.T));
  ok(!stale.length, 'the old world\'s entities are cleared from the shared store');
  // 8. stop sharing
  await dm.click('#btnWorld'); await dm.waitForTimeout(400);
  await dm.click('[data-w="sharestop"]'); await dm.waitForTimeout(200); await dm.click('[data-w="yes"]');
  await wait(3000);
  const after = await pl.evaluate(() => ({ shared: window.__A.campaign.shared, seed: window.__A.SEED, chip: !(document.getElementById('liveChip') || { hidden: true }).hidden }));
  ok(!after.shared && after.seed === 5150 && !after.chip, 'when sharing stops, players keep the world without the live indicator');
  ok(!store['world/meta'] && !Object.keys(store).some((p) => p.startsWith('w/') || p.startsWith('dm/')), 'stopping clears the shared copy');
  console.log('errors', errs.length ? errs : 'none');
  await b.close();
})();
