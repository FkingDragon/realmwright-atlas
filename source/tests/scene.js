// v27 what's happening at a place: a scene for each time of day, from routines, events, the season and the place itself
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1366, height: 860 } });
  await ctx.addInitScript(() => { if (!localStorage.getItem('t-init')) { localStorage.setItem('t-init', '1'); localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 300 } })); } });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2600);
  const r = await p.evaluate(() => {
    const A = window.__A, o = { bad: [], n: 0 };
    const towns = [A.SET.find((x) => x.tier === 1 && x.pop > 120), A.SET.find((x) => x.tier === 2), A.SET.find((x) => x.tier === 3), A.SET.find((x) => x.tier === 4)];
    for (const s of towns) for (const pl of A.placesOf(s).list) for (const hr of [6, 9, 12, 15, 19, 23]) {
      const sc = A.placeScene(s, pl, A.market.day, hr), txt = sc.lines.join(' ');
      o.n++;
      if (!sc.lines.length || /undefined|NaN|\{|\}/.test(txt) || !sc.word) o.bad.push(s.name + ' ' + pl.name + ' @' + hr + ': ' + txt.slice(0, 80));
    }
    const s = towns[3], tav = A.placesOf(s).list.find((x) => x.kind === 'tavern');
    o.same = JSON.stringify(A.placeScene(s, tav, 300, 19).lines) === JSON.stringify(A.placeScene(s, tav, 300, 19).lines);
    o.diff = A.placeScene(s, tav, 300, 9).lines[0] !== A.placeScene(s, tav, 300, 19).lines[0];
    // events reach the places: a town with plague mentions it at its temple
    let found = null;
    for (let d = 300; d < 700 && !found; d += 7) for (const t of A.SET) { if (t.tier < 2) continue; const m = A.modsFor(t, d).find(([, f, e]) => e.type === 'plague' && f > 0.4); if (m) { const tp = A.placesOf(t).list.find((x) => x.kind === 'temple'); if (tp) { found = A.placeScene(t, tp, d, 12).lines.join(' '); break; } } }
    o.plague = found;
    // the rest day shuts most of the market
    const mk = A.placesOf(s).list.find((x) => x.kind === 'market');
    const rest = 300 + ((6 - (300 % 7)) + 7) % 7, work = rest + 1;
    o.rest = [A.placeScene(s, mk, rest, 9).lines[0], A.placeScene(s, mk, work, 9).lines[0], A.placeScene(s, mk, rest, 9).busy < A.placeScene(s, mk, work, 9).busy];
    o.ids = { s: s.id, tav: tav.key };
    return o;
  });
  ok(!r.bad.length, 'every place in a village, town, city and capital has a scene at all six times of day (' + r.n + ' scenes)' + (r.bad.length ? ': ' + r.bad.slice(0, 3).join(' | ') : ''));
  ok(r.same && r.diff, 'a scene reads the same each time, and changes with the time of day');
  ok(r.plague && /sick|sickness|chalk/i.test(r.plague), 'a plague reaches the temple\'s scene (' + (r.plague || 'none found').slice(0, 70) + '…)');
  ok(/rest day/.test(r.rest[0]) && /busiest/.test(r.rest[1]) && r.rest[2], 'on the rest day the market is mostly shut and quieter');
  // the place page: the time buttons, who is here, a rumour and what is around it
  await p.evaluate(([sid, key]) => { const A = window.__A; A.people.hour = 12; A.goPlace(sid, key, true); }, [r.ids.s, r.ids.tav]);
  await p.waitForTimeout(400);
  const t1 = await p.$eval('#inspector .scene', (e) => e.innerText);
  await p.click('#inspector [data-plhour="19"]'); await p.waitForTimeout(300);
  const t2 = await p.$eval('#inspector .scene', (e) => e.innerText);
  ok(/What.s happening/i.test(t1) && t1 !== t2 && /fiddler|Packed/i.test(t2) && (await p.evaluate(() => window.__A.people.hour)) === 19, 'the Evening button moves the tavern\'s scene on to the evening crowd');
  ok((await p.$$('#inspector .scene-around li')).length === 3, 'Around it lists the three nearest places and how busy they are');
  ok(!!(await p.$('#inspector .scene-rumour')), 'the tavern has something overheard: a job on the board or an event\'s hook');
  // players never see the Thieves' Guild den in Around it
  const pl = await p.evaluate(([sid]) => { const A = window.__A; A.campaign.mode = 'player'; A.applyMode(); const s = A.SBY.get(sid); let bad = 0; for (const x of A.placesOf(s).list) { if (x.secret) continue; const h = A.sceneHtml(s, x, A.market.day); if (/Shadow Court|the Den\b|the Cell\b/.test(h) || /dmtag/.test(h)) bad++; } A.campaign.mode = 'dm'; A.applyMode(); return bad; }, [r.ids.s]);
  ok(pl === 0, 'players never see the Thieves\' Guild hideout or DM-only doings in any scene');
  console.log('errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
