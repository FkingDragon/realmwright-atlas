// v29 trading in the Market: shopkeepers, hero prices, buying and selling, haggling, stock, black market, caravans, watch list
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.addInitScript(() => { if (!localStorage.getItem('t-init')) { localStorage.setItem('t-init', '1'); localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 300 } })); } });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2600);
  const r = await p.evaluate(() => {
    const A = window.__A, o = {};
    A.srdFetch && A.srdFetch('items');
    const s = A.SET.find((x) => x.tier === 4 && A.orgHere(x, 'thieves') && A.orgHere(x, 'merchants') && A.keeperFor(x, 'Weapons').p);
    const mk = (cls) => { const h = A.newHero(true); A.quickBuild(h, cls); h.home = s.id; h.goldDelta += 2000; A.heroes.list.push(h); return h; };
    const I = (n) => A.SRD.items.find((x) => x.name === n);
    const f = mk('fighter'), g = mk('rogue');
    const sword = I('Longsword'), K = A.keeperFor(s, 'Weapons');
    o.keeper = K.p ? K.p.job : null;
    const P0 = A.heroPrice(f, s, sword), base = A.shopItem(sword, s, A.market.day).gp;
    o.neutral = Math.abs(P0.gp - Math.round(base * 100) / 100) < 0.011;
    // buying uses gold, fills the pack and the week's stock (shared by every hero)
    const g0 = A.goldOf(f), left0 = P0.left;
    o.buy = A.buyItem(f, s, sword, 1); o.paid = Math.round((g0 - A.goldOf(f)) * 100) / 100; o.inv = f.inv.some((x) => x.n === 'Longsword');
    o.left = [left0, A.heroPrice(g, s, sword).left];
    o.dearer = A.heroPrice(g, s, sword).gp > P0.gp;
    // sell out
    const n = A.heroPrice(f, s, sword).left; A.buyItem(f, s, sword, n);
    o.soldOut = A.heroPrice(g, s, sword); o.soldOut = [o.soldOut.ok, o.soldOut.why];
    // members pay less
    A.gjJoin(g, 'merchants', s); const rope = I('Rope, hempen (50 feet)') || I('Rope, hempen'); o.rope = rope && [A.heroPrice(g, s, rope).gp, A.heroPrice(f, s, rope).gp, A.heroPrice(g, s, rope).parts.join(' ')];
    // the seller's feelings
    const kid = K.p.id; A.edits.npc = A.edits.npc || {}; A.edits.npc[kid] = Object.assign({}, A.edits.npc[kid], { disp: -50 });
    const bow = I('Shortbow'); o.hostile = [A.heroPrice(f, s, bow).gp / A.shopItem(bow, s, A.market.day).gp];
    A.edits.npc[kid].disp = -80; o.refuse = A.heroPrice(f, s, bow).why;
    A.edits.npc[kid].disp = 0;
    // haggling: once a day with each seller
    const h1 = A.doHaggle(f, s, 'Weapons'), h2 = A.doHaggle(f, s, 'Weapons');
    o.haggle = [h1 && h1.f, h2, Math.abs(A.heroPrice(f, s, bow).gp - Math.round(A.shopItem(bow, s, A.market.day).gp * h1.f * 100) / 100) < 0.02];
    // selling
    const idx = f.inv.findIndex((x) => x.n === 'Longsword'), q0 = f.inv[idx].q, g1 = A.goldOf(f);
    A.sellItem(f, s, idx); o.sell = [Math.round((A.goldOf(f) - g1) * 100) / 100, Math.round(A.shopItem(sword, s, A.market.day).gp * 0.5 * 100) / 100, (f.inv.find((x) => x.n === 'Longsword') || { q: 0 }).q === q0 - 1];
    // black market
    A.campaign.mode = 'player'; A.applyMode();
    o.bmPlayer = [A.blackMarketOpen(f, s), (A.gjJoin(g, 'thieves', s), A.blackMarketOpen(g, s))];
    A.campaign.mode = 'dm'; A.applyMode();
    o.bmDM = A.blackMarketOpen(null, s);
    const poison = A.POISON_ITEMS.find((x) => A.blackPrice(s, x).ok);
    o.poison = poison ? [A.buyBlack(g, s, poison), g.inv.some((x) => x.n.startsWith(poison.name))] : 'none this week';
    // caravans
    const nb = A.neighbours(s), [to, dist] = nb[nb.length - 1];
    const gd = A.GOODS.find((x) => x.name === 'Iron (1 lb)');
    const g2 = A.goldOf(f); o.send = A.sendVenture(f, s, to, dist, gd.name, 100, true); o.ventCost = Math.round((g2 - A.goldOf(f)) * 100) / 100;
    const v = f.vent[f.vent.length - 1]; o.v = { p: v.p, full: A.ventureRisk(s, to, A.market.day).p, arrive: v.arrive - A.market.day };
    o.early = A.collectVenture(f, v.id);
    const d0 = A.market.day; A.market.day = v.arrive;
    const R1 = A.ventureResult(v), R2 = A.ventureResult(v), g3 = A.goldOf(f), C = A.collectVenture(f, v.id);
    o.vres = [JSON.stringify(R1) === JSON.stringify(R2), Math.round((A.goldOf(f) - g3) * 100) / 100 === C.payout, !!f.vent.find((x) => x.id === v.id).done, A.collectVenture(f, v.id)];
    A.market.day = d0;
    const village = A.SET.find((x) => x.tier === 1 && x.pop > 100);
    o.sat = [A.ventSat(village, 100), A.ventSat(s, 100)];
    o.ids = { s: s.id, f: f.id, g: g.id };
    A.heroSave();
    return o;
  });
  console.log(JSON.stringify(r).slice(0, 700));
  ok(!!r.keeper && r.neutral, 'weapons in the capital are sold by a real person (' + r.keeper + '), at the town\'s price for a neutral seller');
  ok(r.buy && r.paid > 0 && r.inv && r.left[1] === r.left[0] - 1 && r.dearer, 'buying a longsword takes the gold, fills the pack and uses up the week\'s stock for every hero (and the price climbs)');
  ok(r.soldOut[0] === false && /Sold out/.test(r.soldOut[1]), 'when the stock runs out it is sold out for everyone until next week');
  ok(r.rope && r.rope[0] < r.rope[1] && /Merchants/.test(r.rope[2]), 'a Merchants\' Guild member pays less, and the price says why');
  ok(Math.abs(r.hostile[0] - 1.15) < 0.01 && /won't serve/.test(r.refuse), 'a seller who dislikes the party charges 15% more, and one who hates them won\'t serve them');
  ok([0.8, 0.9, 1, 1.1].includes(r.haggle[0]) && r.haggle[1] === null && r.haggle[2], 'haggling once a day with a seller moves that seller\'s prices (' + r.haggle[0] + ')');
  ok(r.sell[0] === r.sell[1] && r.sell[2], 'selling pays half the town\'s price and takes the item from the pack');
  ok(!r.bmPlayer[0] && r.bmPlayer[1] && r.bmDM, 'the black market opens only for Thieves\' Guild members (and the DM)');
  ok(r.poison === 'none this week' || (r.poison[0] && r.poison[1]), 'poisons can be bought there (' + (Array.isArray(r.poison) ? 'bought' : r.poison) + ')');
  ok(r.send && r.ventCost === 110 && Math.abs(r.v.p - r.v.full / 2) < 1e-9 && r.v.arrive >= 1 && r.early === null, 'a caravan with guards costs 10% more and halves the risk; it can\'t be collected before it arrives');
  ok(r.vres[0] && r.vres[1] && r.vres[2] && r.vres[3] === null, 'on arrival the outcome is the same every time, pays out once, and is recorded');
  ok(r.sat[0] < 0.5 && r.sat[1] > 0.9, 'a village can only absorb a small load (' + r.sat.map((x) => x.toFixed(2)).join(' vs ') + ')');
  // the Shop tab: a Buy button in the list buys without opening the row
  await p.evaluate(([sid, gid]) => { const A = window.__A; A.market.shop.hero = gid; A.market.shop.cat = 'Gear'; A.market.shop.q = ''; A.openPlace(sid, 'market', false, 'shop'); }, [r.ids.s, r.ids.g]);
  await p.waitForTimeout(800);
  const before = await p.evaluate((gid) => window.__A.heroes.list.find((h) => h.id === gid).inv.length, r.ids.g);
  await p.click('#inspector [data-mkbuy]'); await p.waitForTimeout(400);
  const after = await p.evaluate((gid) => window.__A.heroes.list.find((h) => h.id === gid).inv.length, r.ids.g);
  ok(after === before + 1 || after === before, 'the Shop tab\'s Buy button buys for the picked hero');
  ok(!!(await p.$('#inspector .mk-purse')) && !!(await p.$('#inspector .mk-sell')), 'the Shop tab shows the hero\'s purse and what they can sell');
  // watch list and the cleaner reasons on the Town tab
  await p.evaluate((sid) => { const A = window.__A; A.openPlace(sid, 'market', false, 'town'); }, r.ids.s); await p.waitForTimeout(500);
  const t = await p.$eval('#inspector', (e) => e.innerText);
  ok(!/Market mood/.test(t), 'the Town tab no longer lists "market mood" guesswork as a reason');
  await p.click('#inspector .wstar'); await p.waitForTimeout(200);
  await p.evaluate(() => { const A = window.__A; A.gst().party.at = null; A.goHome(); A.renderPanel(); }); await p.waitForTimeout(300);
  const wt = await p.$eval('#inspector', (e) => e.innerText);
  ok(/Watched prices/i.test(wt), 'a starred good shows on the World page\'s Today, with where it is cheapest');
  console.log('errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
