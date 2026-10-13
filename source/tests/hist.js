const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1300, height: 860 } });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.addInitScript(() => { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 1500 } })); });
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2600);
  const r = await p.evaluate(() => {
    const A = window.__A, day = A.market.day, out = {};
    let t0 = performance.now(); A.histEvents(day); out.histMs = performance.now() - t0;
    t0 = performance.now();
    let changed = 0, down = 0, maxDrop = 0, worst = null, occ = 0, dead = 0, people = 0, deadByType = {};
    for (const s of A.SET) { const n = A.popNow(s, day); if (n !== s.pop) changed++; if (n < s.pop) { down++; const d = 1 - n / s.pop; if (d > maxDrop) { maxDrop = d; worst = s; } } }
    out.popAllMs = performance.now() - t0;
    t0 = performance.now(); const om = A.occupiedTowns(day); out.occMs = performance.now() - t0; out.occ = om.size;
    const towns = A.SET.filter((s) => s.tier >= 2).slice(0, 400);
    t0 = performance.now();
    for (const s of towns) for (const q of A.townPeople(s).list) { people++; const w = A.withOv(q); if (w.status === 'Dead') { dead++; const k = w.fate.split(' ')[0]; deadByType[k] = (deadByType[k] || 0) + 1; } }
    out.fateMs = performance.now() - t0;
    out.changed = changed; out.down = down; out.maxDrop = maxDrop; out.worst = worst && worst.name; out.worstId = worst && worst.id; out.dead = dead; out.people = people; out.deadByType = deadByType; out.total = A.SET.length;
    // wars and outcomes
    out.wars = A.histEvents(day).filter((e) => e.type === 'war').map((e) => { const o = A.warOutcome(e); return e.name + ' -> ' + (o.truce ? 'truce' : A.REALMS[o.win].name); });
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  ok(r.histMs < 60 && r.popAllMs < 900 && r.occMs < 200, 'history is quick (' + r.histMs.toFixed(0) + ' / ' + r.popAllMs.toFixed(0) + ' / ' + r.occMs.toFixed(0) + ' ms)');
  ok(r.down > 0 && r.maxDrop < 0.2, 'some towns are below their usual size, none crushed (worst ' + (r.maxDrop * 100).toFixed(1) + '%)');
  ok(r.dead > 0 && r.dead / r.people < 0.06, 'history claimed ' + r.dead + ' of ' + r.people + ' notable folk');
  // leaders never die; frozen people stay put
  const r2 = await p.evaluate(() => {
    const A = window.__A, day = A.market.day;
    let leaderDead = 0;
    for (const s of A.SET.filter((x) => x.tier >= 2).slice(0, 600)) { const tp = A.townPeople(s).list; for (const q of tp.slice(0, 5)) if (A.withOv(q).status === 'Dead') leaderDead++; }
    // find a dead person, track them: they must stay dead after freezing
    let victim = null;
    for (const s of A.SET.filter((x) => x.tier >= 2)) { for (const q of A.townPeople(s).list) if (A.withOv(q).status === 'Dead') { victim = q; break; } if (victim) break; }
    return { leaderDead, victim: victim && victim.id, fate: victim && A.withOv(victim).fate };
  });
  ok(r2.leaderDead === 0, 'leaders are never killed off by history');
  console.log('victim', r2.victim, r2.fate);
  // open the victim's town panel and person view
  await p.evaluate((id) => { const A = window.__A; A.setTool('people'); const b = document.createElement('button'); b.className = 'link'; b.dataset.pp = 'npc'; b.dataset.v = id; document.getElementById('inspector').appendChild(b); b.click(); }, r2.victim);
  await p.waitForTimeout(300);
  const today = await p.$eval('.today', (e) => e.innerText);
  ok(/Died|Fell|Killed/.test(today), 'the person page says how they died: ' + today);
  await p.click('[data-pp="track"]'); await p.waitForTimeout(200);
  const still = await p.evaluate((id) => window.__A.npcById(id).status, r2.victim);
  ok(still === 'Dead', 'tracking a dead person does not bring them back (before saving)');
  await p.evaluate(() => window.__A.saveAll()); await p.waitForTimeout(400);
  const sn = await p.evaluate((id) => { const A = window.__A; const s = A.edits.npcSnap[id]; return s && s.status; }, r2.victim);
  ok(sn === 'Dead', 'the frozen copy keeps them dead');
  await p.screenshot({ path: '/tmp/claude-0/hist_person.png' });
  // settlement panel history for the worst-hit town
  await p.evaluate((sid) => { const A = window.__A; A.setTool('explore'); const b = document.createElement('button'); b.className = 'link'; b.dataset.town = sid; document.getElementById('inspector').appendChild(b); b.click(); }, r.worstId);
  await p.waitForTimeout(600);
  const hist = await p.evaluate(() => { const h = [...document.querySelectorAll('#inspector section')].find((x) => /History/.test(x.querySelector('h3') && x.querySelector('h3').textContent)); if (h) h.scrollIntoView(); return h ? h.innerText : null; });
  console.log(hist);
  ok(hist && /Population today/.test(hist), 'the settlement panel has a History section');
  await p.waitForTimeout(200);
  await p.screenshot({ path: '/tmp/claude-0/hist_town.png' });
  // occupied town
  const oc = await p.evaluate(() => { const A = window.__A; const m = A.occupiedTowns(A.market.day); const id = m.keys().next().value; return id || null; });
  console.log('occupied', oc);
  // routine variety: distinct activity texts in a city across 30 days
  const v = await p.evaluate(() => {
    const A = window.__A, s = A.SET.filter((x) => x.tier === 3)[2], set = new Set(), soc = []; let n = 0;
    for (let d = 1500; d < 1530; d++) for (const q of A.residents(s)) { const a = A.activity(q, d); set.add(a.text.replace(/ at .*/, '')); n++; if (a.with) soc.push(a.text); }
    return { distinct: set.size, n, social: soc.length, sample: soc.slice(0, 6) };
  });
  console.log(JSON.stringify(v));
  ok(v.social > 0 && v.social / v.n < 0.2, 'some days are spent with friends, family or rivals (' + v.social + ' of ' + v.n + ')');
  // symmetry: if A is with B, B is with A that day (unless B is busy with an event)
  const sym = await p.evaluate(() => {
    const A = window.__A, s = A.SET.filter((x) => x.tier === 3)[2]; let both = 0, one = 0;
    for (let d = 1500; d < 1560; d++) for (const q of A.residents(s)) { const a = A.activity(q, d); if (!a.with) continue; const o = A.npcById(a.with); const b = A.activity(o, d); if (b.with === q.id) both++; else one++; }
    return { both, one };
  });
  console.log('symmetry', JSON.stringify(sym));
  // the aftermath: families mourn, losses show on a person's page, occupation changes the watch's days
  const G = await p.evaluate(() => {
    const A = window.__A; let found = null, n = 0;
    for (const s of A.SET) { if (s.tier < 2) continue; if (++n > 80) break;
      for (let day = 300; day < 2400 && !found; day += 30) for (const q of A.residents(s)) { const L = A.lossesOf(q, day); if (L.length && L[0].days <= 7) { found = { id: q.id, day, act: A.activity(q, day).text, k: L[0].o.id }; break; } }
      if (found) break; }
    if (!found) return null;
    const later = []; for (let d = found.day + 8; d < found.day + 60; d++) later.push(A.activity(A.npcById(found.id), d).text);
    A.market.day = found.day; const html = A.personView(A.npcById(found.id), found.day);
    let occ = null;
    for (const s of A.SET) { if (occ) break; for (let day = 300; day < 2400; day += 20) { const o = A.occupation(s, day); if (o && day >= o.e.end) { const w = A.residents(s).find((q) => q.group === 'watch' && (q.status || 'Alive') === 'Alive'); if (w) { occ = A.activity(w, day).text; break; } } } }
    return { act: found.act, graves: later.filter((t) => /grave|grieving/i.test(t)).length, losses: /Losses/.test(html) && /Lost /.test(html), occ };
  });
  ok(G && /^In mourning for their \w+ /.test(G.act), 'a death in the family puts people in mourning (' + (G && G.act) + ')');
  ok(G && G.graves >= 2 && G.graves < 40, 'in the weeks after, they visit the grave now and then (' + (G && G.graves) + ' of 52 days)');
  ok(G && G.losses, 'the person\'s page lists who they have lost');
  ok(G && G.occ && /Disarmed|occupiers|garrison/.test(G.occ), 'under occupation the watch is disarmed or ordered about (' + (G && G.occ) + ')');
  console.log('errors', errs.length ? errs : 'none');
  await b.close();
})();
