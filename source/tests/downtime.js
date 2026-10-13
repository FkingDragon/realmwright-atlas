// v28 downtime: crafting, working, training, research, carousing, religious service and recuperating
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
    const A = window.__A, o = {}, dt = A.dt;
    const city = A.SET.find((s) => s.tier >= 3 && A.orgHere(s, 'crafts') && A.orgHere(s, 'mages'));
    const mk = (cls, f) => { const h = A.newHero(true); A.quickBuild(h, cls); h.home = city.id; h.goldDelta += 400; if (f) f(h); A.heroes.list.push(h); return h; };
    const run = (h, set) => { Object.assign(dt, { days: 5, life: 'Modest', item: '', train: '', tKind: 'lang' }, set); return A.dtRun(h); };
    // crafting
    const f = mk('fighter');
    o.noTool = !!A.dtCanCraft(f, A.derive(f), A.ITEM.get('Longsword'));
    f.learned = { langs: [], tools: ["Smith's tools"] };
    const g0 = A.goldOf(f), c1 = run(f, { act: 'craft', item: 'Longsword' });
    o.craft = { done: f.inv.some((x) => x.n === 'Longsword'), title: c1 && c1.title, spent: Math.round((g0 - A.goldOf(f)) * 100) / 100 };
    const w = mk('fighter', (h) => { h.learned = { langs: [], tools: ["Smith's tools"] }; h.goldDelta += 2000; }); A.gjJoin(w, 'crafts', city);
    o.rate = [A.dtCraftRate(f, city), A.dtCraftRate(w, city)];
    const big = run(w, { act: 'craft', item: 'Plate armour', days: 10 }); o.plate = [w.dt.craft && w.dt.craft.gp, big && big.title];
    // working
    const g1 = A.goldOf(f), wk = run(f, { act: 'work' }); o.work = { lines: wk.lines.join(' '), living: Math.round((A.goldOf(f) - g1) * 100) / 100 };
    // training: twice as fast for languages in the Mages' Circle
    const wiz = mk('wizard'); A.gjJoin(wiz, 'mages', city);
    run(wiz, { act: 'train', tKind: 'lang', train: 'Sylvan' }); run(f, { act: 'train', tKind: 'lang', train: 'Sylvan' });
    o.train = [wiz.dt.train && wiz.dt.train.days, f.dt.train && f.dt.train.days];
    wiz.dt.train.days = 245; run(wiz, { act: 'train', tKind: 'lang', train: 'Sylvan' }); o.learned = A.derive(wiz).langs.has('Sylvan');
    // research, carousing, service, rest
    o.research = run(wiz, { act: 'research' }).lines.join(' ');
    o.carouse = run(f, { act: 'carouse', days: 5 }).lines.join(' ');
    o.service = run(f, { act: 'service', days: 10 }).lines.join(' ');
    f.exh = 2; f.conds = ['Poisoned']; run(f, { act: 'rest', days: 6 }); o.rest = [f.exh, f.conds.length];
    // nothing changes when the hero can't pay
    const poor = mk('fighter', (h) => { h.goldDelta -= A.goldOf(h); h.learned = { langs: [], tools: ["Smith's tools"] }; });
    const pr = run(poor, { act: 'craft', item: 'Plate armour' }); o.poor = [pr, JSON.stringify(poor.dt), A.goldOf(poor)];
    o.log = f.log.filter((l) => l.k === 'dt').length;
    o.ids = { f: f.id };
    return o;
  });
  console.log(JSON.stringify(r.poor), JSON.stringify(r.plate));
  ok(r.noTool && r.craft.done && /Made a longsword/i.test(r.craft.title) && r.craft.spent > 7.4, 'a smith makes a longsword in 5 days, paying half its price in materials plus living costs');
  ok(r.rate[1] === r.rate[0] * 2 && r.plate[0] === 100, 'the Craft Guilds\' workshop doubles progress (plate armour: 100 of 1,500 gp in 10 days)');
  ok(/Check with/.test(r.work.lines) && /Earned/.test(r.work.lines), 'working rolls a check and pays by the town\'s prices');
  ok(r.train[0] === 10 && r.train[1] === 5 && r.learned, 'training: the Mages\' Circle teaches languages twice as fast, and a finished language goes on the sheet');
  ok(/Check|library/.test(r.research) && /contact|acquaintance|friend|enemy/i.test(r.carouse) && /favour/.test(r.service), 'research, carousing (a new contact in town) and temple service each give a result');
  ok(r.rest[0] === 0 && r.rest[1] === 0, '6 days of rest clear exhaustion 2 and poison');
  ok(r.poor[0] === null && r.poor[1] === '{}' && r.poor[2] === 0, 'a hero who can\'t pay changes nothing');
  ok(r.log >= 6, 'every downtime goes into the hero\'s chronicle');
  // the sheet's Downtime section
  await p.evaluate((id) => { const A = window.__A; A.openHero(id); A.heroes.step = 'sheet'; A.renderPanel(); }, r.ids.f);
  await p.waitForTimeout(300);
  await p.selectOption('#dt-act', 'work'); await p.waitForTimeout(200);
  await p.click('[data-dt="run"]'); await p.waitForTimeout(300);
  ok(/Worked 5 days/i.test(await p.$eval('#inspector .dt-out', (e) => e.innerText)), 'the sheet\'s Downtime section runs an activity and shows what happened');
  console.log('errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
