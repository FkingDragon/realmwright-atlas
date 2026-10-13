// World stability: a world saved with this version opens in a "future generator" that renames, moves, resizes and
// drops places and roads and renames people. Everything the campaign uses must come through unchanged.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const src = fs.readFileSync('/tmp/claude-0/dbg.html', 'utf8');
  const hook = 'BASE = generateWorld(SEED);';
  if (!src.includes(hook)) { console.log('FAIL cannot build the altered generator'); return; }
  const alt = src.replace(hook, hook + "\n    BASE.settle.forEach((s) => { s.name = s.name + 'ia'; s.x += 0.6; s.y -= 0.4; s.pop = Math.round(s.pop * 1.15); }); BASE.settle = BASE.settle.filter((s, i) => i % 7 !== 3); BASE.roads = BASE.roads.filter((r, i) => i % 4 !== 1); if (!window.__altNames) { window.__altNames = 1; for (const k in FIRST) { FIRST[k][0].reverse(); FIRST[k][1].reverse(); } }")
    .replace('const GEN_VERSION = 20;', 'const GEN_VERSION = 99;');
  fs.writeFileSync('/tmp/claude-0/dbg_alt.html', alt);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
  await ctx.addInitScript(() => { if (!localStorage.getItem('t-init')) { localStorage.setItem('t-init', '1'); localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 240 } })); } });
  const open = async (f) => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1])); await p.goto('file:///tmp/claude-0/' + f); await p.waitForTimeout(2800); return p; };
  // 1. play a little with today's generator
  const p = await open('dbg.html');
  const before = await p.evaluate(() => {
    const A = window.__A;
    const towns = A.SET.filter((x) => x.tier === 2);
    const T = towns[5], U = towns[11], V = towns[17];
    const npc = A.townPeople(T).list[9];
    A.commit('Track', () => { A.edits.npc[npc.id] = { tracked: 1, notes: 'Owes the party a favour' }; }, {});
    A.patchSettlement(U.id, { notes: 'Haunted mill' }, 'Notes');
    A.commit('Party travels', () => { A.edits.guild.party.at = V.id; }, {});
    const R = A.ROADS.find((r) => r.gen && A.SET.find((s) => s.id === r.a).tier >= 2 && A.SET.find((s) => s.id === r.b).tier >= 2);
    const E = A.roadEditable(R); const pts = E.pts.slice(); const mid = E.h[Math.floor(E.h.length / 2)]; pts[mid * 2] += 0.5;
    A.saveRoadShape(R.id, pts, E.h, 'Bend');
    const caps = A.SET.filter((s) => s.tier === 4).map((s) => s.id + ':' + s.name + ':' + s.realm);
    return { T: [T.id, T.name, T.x, T.pop], U: [U.id, U.name], V: [V.id, V.name], npc: [npc.id, npc.first, npc.last, npc.job], road: R.id, roadPts: pts.length, caps, other: towns[30] ? [towns[30].id, towns[30].name] : null };
  });
  await p.evaluate(() => window.__A.saveAll(true)); await p.waitForTimeout(600);
  const snaps = await p.evaluate(() => ({ places: Object.keys(window.__A.edits.setSnap || {}).length, roads: Object.keys(window.__A.edits.roadSnap || {}).length }));
  ok(snaps.places >= 4 && snaps.roads === 1, 'saving freezes the places (' + snaps.places + ') and the road the campaign uses');
  await p.close();
  // 2. open it with the "future" generator
  const q = await open('dbg_alt.html');
  const afterR = await q.evaluate((B) => {
    const A = window.__A, get = (id) => A.SET.find((s) => s.id === id);
    const T = get(B.T[0]), U = get(B.U[0]), V = get(B.V[0]), npc = A.npcById(B.npc[0]);
    const other = B.other && get(B.other[0]);
    const R = A.RBY.get(B.road);
    return { T: T && [T.id, T.name, T.x, T.pop], U: U && [U.id, U.name, U.notes], V: V && [V.id, V.name], party: A.gst().party.at, npc: npc && [npc.id, npc.first, npc.last, npc.job, (A.edits.npc[B.npc[0]] || {}).tracked ? 1 : 0], road: !!R && !!(R.pts && R.pts.length === B.roadPts),
      caps: A.SET.filter((s) => s.tier === 4).map((s) => s.id + ':' + s.name + ':' + s.realm), other: other ? other.name : null, drift: A.driftReport(), dialog: (document.querySelector('#atlasDialog:not([hidden])') || {}).innerText || '' };
  }, before);
  ok(afterR.other === null || afterR.other !== before.other[1], 'the altered generator really changes places nobody uses (' + before.other[1] + ' → ' + afterR.other + ')');
  ok(JSON.stringify(afterR.T) === JSON.stringify(before.T), 'the tracked person\'s town keeps its name, position and size');
  ok(afterR.U && afterR.U[1] === before.U[1] && afterR.U[2] === 'Haunted mill', 'a town with DM notes keeps its name and notes');
  ok(afterR.V && afterR.V[1] === before.V[1] && afterR.party === before.V[0], 'the party\'s town is unchanged and the party is still there');
  ok(JSON.stringify(afterR.npc.slice(0, 4)) === JSON.stringify(before.npc) && afterR.npc[4] === 1, 'the tracked person keeps their name and job (' + afterR.npc.slice(1, 4).join(' ') + ')');
  ok(afterR.road, 'the reshaped road keeps its shape');
  ok(JSON.stringify(afterR.caps.sort()) === JSON.stringify(before.caps.sort()), 'every capital and realm name survives');
  ok(afterR.drift.places > 0 && afterR.drift.people > 0, 'the drift report counts what was held in place (' + JSON.stringify(afterR.drift) + ')');
  ok(/Held in place/.test(afterR.dialog), 'opening the world tells the DM what was held in place');
  console.log('errors', errs.length ? errs : 'none');
  await b.close();
})();
