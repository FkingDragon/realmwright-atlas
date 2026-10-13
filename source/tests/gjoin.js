// v27 guild membership: heroes join the town's organisations and get benefits that fit each one
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
    const A = window.__A, o = {};
    const city = A.SET.find((s) => s.tier >= 3 && A.orgHere(s, 'merchants') && A.orgHere(s, 'mages') && A.orgHere(s, 'crafts') && A.orgHere(s, 'thieves'));
    o.city = city && city.name;
    const mk = (cls, f) => { const h = A.newHero(true); A.quickBuild(h, cls); h.home = city.id; h.goldDelta += 500; if (f) f(h); A.heroes.list.push(h); return h; };
    const f = mk('fighter');
    const sword = A.ITEM.get('Longsword'), g0 = A.goldOf(f), local = A.shopPriceLocal(f, sword).price;
    o.join = A.gjJoin(f, 'merchants', city); o.paid = Math.round((g0 - A.goldOf(f)) * 100) / 100;
    const sp = A.shopPrice(f, sword); o.merch = { local, price: sp.price, by: sp.by, sell: A.sellRate(f).r };
    const bb = mk('barbarian', (x) => { x.skills = x.skills.filter((k) => k !== 'Arcana'); }); o.mages = A.derive(bb).skills.has('Arcana') ? 'has arcana' : A.gjNeed(bb, 'mages'); o.thievesF = A.gjNeed(f, 'thieves');
    const w = mk('wizard'); o.magesW = A.gjNeed(w, 'mages'); A.gjJoin(w, 'mages', city);
    o.wizFocus = [A.shopPriceLocal(w, A.ITEM.get('Spellbook')).price, A.shopPrice(w, A.ITEM.get('Spellbook')).price];
    const rg = mk('rogue'); o.thievesR = A.gjNeed(rg, 'thieves'); A.gjJoin(rg, 'watch', city); o.rival = A.gjNeed(rg, 'thieves');
    // crafts beats merchants on a sword for a member of both: the best discount wins, not both
    A.gjJoin(f, 'crafts', city); o.best = [A.shopPrice(f, sword).disc, A.shopPrice(f, sword).by];
    // dues lapse after a month, and paying restores the benefits
    const d0 = A.market.day; A.market.day = d0 + 31;
    o.lapsed = [A.shopPrice(f, A.ITEM.get('Rope, hempen (50 ft)')).disc, A.sellRate(f).r];
    A.gjPay(f, 'merchants'); o.repaid = [A.shopPrice(f, A.ITEM.get('Rope, hempen (50 ft)')).disc, A.sellRate(f).r];
    // ranks rise with time served and levels; the DM can promote
    f.level = 5; A.market.day = d0 + 130; A.gjPay(f, 'crafts'); A.gjPay(f, 'crafts'); A.gjPay(f, 'crafts'); A.gjPay(f, 'crafts'); A.gjPay(f, 'crafts');
    o.rank = A.gjRank(f, 'crafts'); o.craftDisc = A.shopPrice(f, sword).disc;
    A.market.day = d0;
    // the Adventurers' Guild joins the roster too
    A.gjJoin(f, 'adventurers', city); o.roster = !!A.heroGuildMember(f);
    // leaving ends it
    A.gjLeave(w, 'mages'); o.left = A.shopPrice(w, A.ITEM.get('Spellbook')).disc;
    o.ids = { f: f.id, rg: rg.id, w: w.id, city: city.id };
    A.heroSave();
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.join && r.paid === 12 && Math.abs(r.merch.price - Math.round(r.merch.local * 0.9 * 100) / 100) < 0.011 && r.merch.by === 'Merchants', 'joining the Merchants\' Guild in ' + r.city + ' costs 12 gp (fee and a month) and takes 10% off everything');
  ok(r.merch.sell === 0.6, 'and merchants sell for 60% of the price instead of half');
  ok(!!r.mages && !r.magesW && r.wizFocus[1] < r.wizFocus[0] * 0.81, 'the Mages\' Circle turns away a fighter but takes a wizard, who gets arcane supplies 20% cheaper');
  ok(!!r.thievesF && !r.thievesR && /Watch/.test(r.rival), 'the Thieves\' Guild approaches a rogue, not a plain fighter, and never a member of the Watch');
  ok(r.best[0] === 0.15 && r.best[1] === 'Crafts', 'a member of two guilds gets the better discount, not both (Crafts 15% on a sword)');
  ok(r.lapsed[0] === 0 && r.lapsed[1] === 0.5 && r.repaid[0] > 0 && r.repaid[1] === 0.6, 'unpaid dues suspend the benefits, and paying restores them');
  ok(r.rank === 2 && r.craftDisc === 0.25, 'after four months and level 5 a crafter is a Master, with 25% off arms');
  ok(r.roster, 'joining the Adventurers\' Guild puts the hero on the guild roster');
  ok(r.left === 0, 'leaving a guild ends its benefits');

  // the hero's sheet lists memberships; the Gear step shows member prices
  await p.evaluate((id) => { const A = window.__A; A.openHero(id); A.heroes.step = 'sheet'; A.renderPanel(); }, r.ids.f);
  await p.waitForTimeout(400);
  let t = await p.$eval('#inspector', (e) => e.innerText);
  ok(/Guilds and orders/i.test(t) && /Merchants/i.test(t) && /Craft Guilds|Crafts/i.test(t) && /Fair buyers/i.test(t), 'the hero sheet lists each guild with its rank and benefits');
  ok(/Join in /i.test(t) && (await p.$$('#inspector [data-gj="join"]')).length >= 2, 'and offers the other guilds in the hero\'s town');
  await p.evaluate(() => { const A = window.__A; A.heroes.step = 'gear'; A.renderPanel(); });
  await p.waitForTimeout(300);
  ok((await p.$$('#inspector .gj-disc')).length > 10, 'the Gear step shows member prices with the guild that gives them');
  // join the Temple from the sheet with a click
  await p.evaluate(() => { const A = window.__A; A.heroes.step = 'sheet'; A.renderPanel(); });
  await p.waitForTimeout(300);
  await p.click('#inspector [data-gj="join"][data-v*="|temple|"]'); await p.waitForTimeout(300);
  ok(await p.evaluate((id) => !!window.__A.heroes.list.find((h) => h.id === id).orgs.temple, r.ids.f), 'a tap on Take the vows joins the Temple');
  // the organisation's page shows membership and who has joined
  await p.evaluate((sid) => { const A = window.__A; A.openPlace(sid, 'guilds', false); A.guildUI.org = 'temple'; A.renderPanel(); }, r.ids.city);
  await p.waitForTimeout(400);
  t = await p.$eval('#inspector', (e) => e.innerText);
  ok(/Membership/i.test(t) && /Shelter of the faithful/i.test(t) && /Lay follower/i.test(t), 'the Temple\'s page explains membership and shows the hero who joined');
  // a person of the same organisation greets a fellow member
  const kin = await p.evaluate((sid) => { const A = window.__A, s = A.SBY.get(sid); const pr = A.residents(s).find((q) => q.group === 'faith'); if (!pr) return 'none'; A.openPlace(sid, 'people', false); A.people.npc = pr.id; A.renderPanel(); return document.querySelector('#inspector .gj-kin') ? document.querySelector('#inspector .gj-kin').innerText : ''; }, r.ids.city);
  ok(/Fellow member/i.test(kin), 'a priest\'s page notes the hero is a fellow member (' + kin.slice(0, 60) + ')');
  const warm = await p.evaluate((sid) => { const A = window.__A, s = A.SBY.get(sid); const pr = A.residents(s).find((q) => q.group === 'faith'), out = [A.dispOf(pr), A.dispShown(pr), A.kinBonus(pr).why]; A.openPlace(sid, 'people', false); A.people.npc = pr.id; A.renderPanel(); out.push(!!document.querySelector('#inspector .gj-kin-why')); return out; }, r.ids.city);
  ok(warm[1] === Math.min(100, warm[0] + 15) && /fellow member of the Temple/.test(warm[2]) && warm[3], 'a priest thinks better of the party (+15) with a Temple member among them, and the page says why');
  // players: no promoting, and the Thieves' Guild only for those it would approach
  const pl = await p.evaluate(([f, rg]) => { const A = window.__A; A.campaign.mode = 'player'; A.applyMode(); const H = (id) => A.heroes.list.find((h) => h.id === id); const a = A.heroGuildsHtml(H(f)), b2 = A.heroGuildsHtml(H(rg)); A.campaign.mode = 'dm'; A.applyMode(); return { promote: /data-gj="up"/.test(a), thievesF: /\|thieves\|/.test(a), thievesR: /\|thieves\|/.test(b2) }; }, [r.ids.f, r.ids.rg]);
  ok(!pl.promote && !pl.thievesF && pl.thievesR, 'players can\'t promote themselves, and only the rogue is offered the Thieves\' Guild');
  // member prices on the Market's Shop tab and at the inn (v28)
  await p.evaluate((sid) => { const A = window.__A; A.openPlace(sid, 'market', false, 'shop'); }, r.ids.city);
  await p.waitForTimeout(800);
  const shop0 = await p.evaluate(() => document.querySelectorAll('#inspector .gj-disc').length);
  await p.selectOption('#shop-hero', r.ids.f); await p.waitForTimeout(500);
  const shop1 = await p.evaluate(() => ({ disc: [...document.querySelectorAll('#inspector .gj-disc')].map((e) => e.textContent), note: document.querySelector('#inspector #shop-hero').closest('.field').nextElementSibling.textContent }));
  ok(shop0 === 0 && shop1.disc.some((t) => /Merchants/.test(t)) && /Member prices/.test(shop1.note), 'picking a hero on the Shop tab shows their member prices (' + shop1.disc.length + ' items)');
  const inn = await p.evaluate(([sid, fid]) => {
    const A = window.__A, s = A.SBY.get(sid), F = A.market.inn, o = {};
    Object.assign(F, { lodge: 'Modest', meal: 'Modest', nights: 3, guests: 1, horses: 0 });
    A.market.shop.hero = null; o.anyone = A.innBill(s, A.market.day).total;
    A.market.shop.hero = fid; const B = A.innBill(s, A.market.day); o.member = B.total; o.warn = B.warn.join(' ');
    F.guests = 2; o.two = A.innBill(s, A.market.day).total;
    F.guests = 1; F.lodge = 'Wealthy'; o.wealthy = A.innBill(s, A.market.day).warn.join(' ');
    o.heal = A.memberDisc(A.heroes.list.find((h) => h.id === fid), s, 'heal');
    A.market.shop.hero = null;
    return o;
  }, [r.ids.city, r.ids.f]);
  ok(inn.anyone > 0 && inn.member === 0 && Math.abs(inn.two - inn.anyone) < 0.01 && /temple/.test(inn.warn), 'a Temple member stays and eats free at the inn bill (a companion still pays ' + inn.two.toFixed(2) + ' gp)');
  ok(/modest lodging or simpler/.test(inn.wealthy) && inn.heal.v === 0.5, 'choosing wealthy rooms suggests the free modest option, and healing is half price');
  // dues and wages as the days pass (v28)
  const cal = await p.evaluate(([rg, f]) => {
    const A = window.__A, H = (id) => A.heroes.list.find((h) => h.id === id), R = H(rg), F = H(f), o = {}, d0 = A.market.day;
    A.market.day = d0 + 25;
    o.wage = A.watchWageDays(R); const g0 = A.goldOf(R); A.gjCollect(R); o.paid = Math.round((A.goldOf(R) - g0) * 100) / 100; o.after = A.watchWageDays(R);
    A.market.day = d0 + 30; o.after2 = A.watchWageDays(R);
    A.market.day = d0 + 75;
    o.notes = A.guildNotices(F).map((n) => n.kind + ':' + n.k);
    A.goHome(); A.renderPanel(); o.today = [...document.querySelectorAll('#inspector .gl-recent .chip.warn')].map((e) => e.textContent);
    A.market.day = d0;
    return o;
  }, [r.ids.rg, r.ids.f]);
  ok(cal.wage === 2 && cal.paid === 0.2 && cal.after === 0 && cal.after2 === 1, 'the Watch pays 1 sp for each day in ten on patrol, and collecting keeps the remainder (' + JSON.stringify(cal).slice(0, 60) + ')');
  ok(cal.notes.some((n) => /^dues:/.test(n)) && cal.today.some((t) => /dues/.test(t)), 'overdue dues show on the hero\'s sheet and on the World page\'s Today');
  console.log('errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
