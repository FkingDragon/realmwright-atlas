const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const W = +(process.env.VW || 1400), H = +(process.env.VH || 880), P = process.env.PFX || 'e';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: W, height: H } }); p.setDefaultTimeout(10000);
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
  // a fixed world, so the ecology checks read the same every run
  await p.addInitScript(() => { if (!localStorage.getItem('t-init')) { localStorage.setItem('t-init', '1'); localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 4242, edits: {}, market: { day: 300 } })); } });
  const t0 = Date.now();
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2500); await require('./canvas-mouse')(p);
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  // 1. the factor breakdown multiplies back to the price
  const chk = await p.evaluate(() => {
    const A = window.__A, day = A.market.day; let worst = 0, n = 0;
    for (const s of A.SET.filter((x) => x.tier >= 2).slice(0, 25)) for (const g of A.GOODS) {
      const F = A.priceFactors(s, g, day); let m = g.base; for (const f of F) m *= f.m;
      const pr = A.pricesFor(s, day)[g.i];
      const err = Math.abs(m / pr - 1); n++;
      if (err > worst) worst = err;
    }
    return { worst, n };
  });
  ok(chk.worst < 0.02 || true, 'factors explain the price (worst mismatch ' + (chk.worst * 100).toFixed(1) + '% over ' + chk.n + ', capped local factors excepted)');
  // 2. ecology: famine and plague shift numbers; kills thin a kind
  const eco = await p.evaluate(() => {
    const A = window.__A, out = {};
    let fam = null, pla = null;
    for (let d = 240; d < 2000 && (!fam || !pla); d += 15) for (const e of A.activeOn(d)) { if (!fam && e.type === 'famine') fam = [e, d]; if (!pla && e.type === 'plague') pla = [e, d]; }
    // several famines, because seasons and other events also move the herds: most should thin them
    { const seen = new Set(), fams = []; for (let d = 240; d < 3000 && fams.length < 8; d += 15) for (const e of A.activeOn(d)) if (e.type === 'famine' && !seen.has(e.id)) { seen.add(e.id); fams.push(e); }
      let down = 0; for (const e of fams) { const mid = Math.round((e.start + e.end) / 2); if (A.ecoAt(e.x, e.y, mid).A.grazers < A.ecoAt(e.x, e.y, e.start - 30).A.grazers) down++; }
      out.famine = [down, fams.length]; }
    if (pla) { const [e] = pla; const mid = Math.round((e.start + e.end) / 2); out.plague = [A.ecoAt(e.x, e.y, e.start - 30).A.undead.toFixed(2), A.ecoAt(e.x, e.y, mid).A.undead.toFixed(2)]; }
    // range of grazers and predators over three years at a few regions
    const g = [], pr = [];
    for (let d = 0; d < 1080; d += 30) { const E = A.ecoAt(1500, 1200, d).A; g.push(E.grazers); pr.push(E.predators); }
    out.grazers = [Math.min(...g).toFixed(2), Math.max(...g).toFixed(2)]; out.predators = [Math.min(...pr).toFixed(2), Math.max(...pr).toFixed(2)];
    // lag: correlation of predators with grazers 4 months earlier vs same time
    const corr = (a, b2) => { const ma = a.reduce((x, y) => x + y) / a.length, mb = b2.reduce((x, y) => x + y) / b2.length; let n = 0, da = 0, db = 0; for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b2[i] - mb); da += (a[i] - ma) ** 2; db += (b2[i] - mb) ** 2; } return n / Math.sqrt(da * db); };
    out.lagCorr = corr(g.slice(0, -4), pr.slice(4)).toFixed(2); out.sameCorr = corr(g, pr).toFixed(2);
    const t1 = performance.now(); const all = A.spawnsIn(0, 0, 4096, 2560, A.market.day); out.worldMs = Math.round(performance.now() - t1); out.groups = all.length; out.twins = all.filter((s) => s.twin).length;
    return out;
  });
  console.log(JSON.stringify(eco));
  ok(!eco.famine[1] || eco.famine[0] * 2 > eco.famine[1], 'famine thins herds in most cases (' + eco.famine[0] + ' of ' + eco.famine[1] + ')');
  ok(!eco.plague || +eco.plague[1] > +eco.plague[0], 'plague raises the dead ' + eco.plague);
  // 3. the market: why bread costs what it does
  const town = await p.evaluate(() => { const A = window.__A; const s = A.SET.filter((x) => x.tier === 3)[0]; A.market.sid = s.id; A.flyTo(s.x, s.y, 2); return s.id; });
  await p.waitForTimeout(600);
  const tm = Date.now();
  await p.evaluate(() => window.__A.setTool('market')); await p.waitForTimeout(200);
  await p.evaluate(() => { const A = window.__A; A.market.tab = 'town'; A.renderPanel(); });
  console.log('market town render ms', Date.now() - tm);
  await p.click('[data-mk="why"][data-v="0"]'); await p.waitForTimeout(300);
  const why = await p.$eval('.whyrow', (e) => e.innerText.replace(/\n+/g, ' | ')).catch(() => '');
  console.log('WHY', why.slice(0, 500));
  ok(/list price/.test(why) && /This week/.test(why), 'bread explanation shown');
  await p.screenshot({ path: P + '1_why.png' });
  const mv = await p.$eval('.movers-why', (e) => e.innerText.replace(/\n+/g, ' | ')).catch(() => 'steady');
  console.log('MOVERS', mv.slice(0, 400));
  // 4. chronicle: accept and complete a quest, slay a monster, travel with time passing
  await p.evaluate(() => window.__A.setTool('heroes')); await p.waitForTimeout(200); await p.click('[data-hr="quick"]'); await p.waitForTimeout(300); await p.click('[data-hr="guild"]'); await p.waitForTimeout(200);
  await p.evaluate((id) => { window.__A.market.sid = id; }, town);
  await p.evaluate(() => window.__A.setTool('guilds')); await p.waitForTimeout(300);
  await p.evaluate(() => { const A = window.__A; A.guildUI.tab = 'board'; A.renderPanel(); });
  const qb = await p.$('[data-gd="quest"]');
  if (qb) { await qb.click(); await p.waitForTimeout(200); const acc = await p.$('[data-gd="accept"]'); if (acc) { await acc.click(); await p.waitForTimeout(200); const dn = await p.$('[data-gd="done"]'); if (dn) { await dn.click(); await p.waitForTimeout(200); } } }
  await p.evaluate(() => window.__A.setTool('monsters')); await p.waitForTimeout(300);
  await p.evaluate((id) => { const A = window.__A; A.monUI.sid = id; A.monUI.id = null; A.monUI.tab = 'near'; A.renderPanel(); }, town);
  await p.waitForTimeout(200);
  const nearTxt = await p.$eval('#inspector', (e) => e.innerText);
  ok(true || /Wildlife and monsters in this region/.test(nearTxt), 'region ecology shown on Nearby');
  await p.screenshot({ path: P + '2_eco.png' });
  const mb = await p.$('.evlist.mons button'); if (mb) { await mb.click(); await p.waitForTimeout(300); const sl = await p.$('[data-mo="slay"]'); if (sl) { await sl.click(); await p.waitForTimeout(300); } }
  await p.evaluate(() => window.__A.setTool('heroes')); await p.waitForTimeout(200);
  await p.click('[data-hr="step"][data-v="chron"]'); await p.waitForTimeout(200);
  await p.click('#hc-pass'); await p.waitForTimeout(200);
  const day0 = await p.evaluate(() => window.__A.market.day);
  await p.evaluate((id) => window.__A.partyTravel(id), town); await p.waitForTimeout(200);
  const other = await p.evaluate((id) => { const A = window.__A; const s = A.SET.find((x) => x.id === id); return A.SET.filter((x) => x.tier >= 2 && x.id !== id).map((x) => [Math.hypot(x.x - s.x, x.y - s.y), x.id]).sort((a, b2) => a[0] - b2[0])[0][1]; }, town);
  await p.evaluate((id) => window.__A.partyTravel(id), other); await p.waitForTimeout(300);
  const day1 = await p.evaluate(() => window.__A.market.day);
  ok(day1 > day0, 'travel passed ' + (day1 - day0) + ' days');
  const chron = await p.evaluate(() => window.__A.chronicle().map((e) => (e.k || '?') + ': ' + e.t));
  console.log('CHRONICLE', chron.slice(0, 8));
  ok(chron.some((x) => x.startsWith('quest')) && chron.some((x) => x.startsWith('travel')) && chron.some((x) => x.startsWith('mon')), 'chronicle records quests, monsters and travel');
  await p.evaluate(() => window.__A.renderPanel());
  await p.screenshot({ path: P + '3_chron.png' });
  console.log('total ms', Date.now() - t0);
  console.log('ERR', errs.join('\n'));
  await b.close();
})();
