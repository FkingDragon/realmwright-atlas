const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const p = await (await b.newContext({ viewport: { width: 1300, height: 860 } })).newPage();
  p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.addInitScript(() => { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 240 } })); });
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => {
    const A = window.__A, out = { bad: [], sample: null };
    for (const cls of A.CLASS_KEYS) for (const lv of [1, 2, 3, 5, 7, 12, 19, 20]) {
      const h = A.newHero(true); h.rules = '2024'; h.level = lv; A.quickBuild(h, cls); h.level = lv; A.autoFill(h);
      let D; try { D = A.derive(h); } catch (e) { out.bad.push(cls + lv + ' derive ' + e.message); continue; }
      try { A.heroes.list.push(h); A.heroes.cur = h.id; for (const st of A.HERO_STEPS) { A.heroes.step = st[0]; A.heroPanel(); } } catch (e) { out.bad.push(cls + lv + ' panel ' + e.message); }
      if (D.todo.length) out.bad.push(cls + lv + ' todo: ' + D.todo.map((t) => t.text).join(' / '));
      if (h.rules !== '2024') out.bad.push(cls + lv + ' lost rules');
      if (cls === 'fighter' && lv === 5) out.sample = { race: h.race, bg: h.bg, sc: D.sc, base: h.base, atk: D.attacks.map((a) => a.name + ' ' + a.hit + ' ' + a.props), feats: D.feats.map((f) => f.n + ' [' + f.src + ']'), uses: D.uses.map((u) => u.n + ' ' + u.max), init: D.init, speed: D.speed };
    }
    // exhaustion
    const h = A.newHero(true); h.rules = '2024'; A.quickBuild(h, 'rogue'); A.autoFill(h);
    const D0 = A.derive(h); h.exh = 2; const D2 = A.derive(h);
    out.exh = { speed: [D0.speed, D2.speed], stealth: [D0.skillBonus('Stealth'), D2.skillBonus('Stealth')], init: [D0.init, D2.init] };
    // subclass at 3 in 2024: a level-1 cleric has no Life domain features
    const c = A.newHero(true); c.rules = '2024'; A.quickBuild(c, 'cleric'); c.level = 1; A.autoFill(c);
    out.cleric1 = A.derive(c).feats.filter((f) => /Life|Disciple/.test(f.n + f.src)).length;
    c.level = 3; out.cleric3 = A.derive(c).feats.filter((f) => /Life|Disciple/.test(f.n + f.src)).length;
    // 2014 unchanged: a 2014 human fighter has +1 everywhere from race
    const o = A.newHero(true); o.rules = '2014'; o.race = 'human'; out.h14 = A.derive(o).sc;
    // switching an orc to 2014 falls back to half-orc
    const s = A.newHero(true); s.rules = '2024'; s.race = 'orc'; s.bg = 'criminal'; A.heroes.list.push(s); A.heroes.cur = s.id;
    return out;
  });
  console.log(JSON.stringify(r.sample, null, 1));
  console.log(JSON.stringify({ exh: r.exh, c1: r.cleric1, c3: r.cleric3, h14: r.h14 }));
  ok(!r.bad.length, '2024 quick builds for every class and level have no errors or loose ends' + (r.bad.length ? ': ' + r.bad.slice(0, 6).join(' | ') : ''));
  ok(r.exh.speed[1] === r.exh.speed[0] - 10 && r.exh.stealth[1] === r.exh.stealth[0] - 4, '2024 exhaustion: −5 ft and −2 per level');
  ok(r.cleric1 === 0 && r.cleric3 > 0, 'subclass features start at level 3 under 2024 rules');
  ok(r.h14.str === 16, '2014 heroes are unchanged');
  // 2024 class features (v25)
  const c24 = await p.evaluate(() => {
    const A = window.__A, o = {};
    const mk = (cls, lv, rules, f) => { const h = A.newHero(true); h.rules = rules || '2024'; h.level = lv; A.quickBuild(h, cls); h.level = lv; if (f) f(h); A.autoFill(h); return h; };
    let h = mk('fighter', 1), D = A.derive(h);
    o.fighter = { sw: (D.uses.find((u) => u.key === 'second') || {}).max, kit: D.inv.map((x) => x.n), gold: A.goldOf(h), bgGold: A.CLS(h) && h.bg };
    h.uses.second = 2; A.shortRest(h, D); o.swAfterShort = h.uses.second;
    const pal = A.derive(mk('paladin', 1)), pal14 = A.derive(mk('paladin', 1, '2014'));
    o.paladin = { slots: pal.cast && pal.cast.slots, prep: pal.cast && pal.cast.prepN, old: !!pal14.cast };
    const mo = A.derive(mk('monk', 1)), mo14 = A.derive(mk('monk', 1, '2014'));
    o.monk = [mo.attacks.find((a) => a.key === 'unarmed').dmg, mo14.attacks.find((a) => a.key === 'unarmed').dmg];
    const bh = mk('barbarian', 20, '2024', (x) => { x.base.str = 20; x.base.con = 20; }), bb = A.derive(bh);
    o.barb = { rage: bb.uses.find((u) => u.key === 'rage').max, str: bb.sc.str, con: bb.sc.con, skN: bb.skN, skills: bh.skills.length };
    const so2 = A.derive(mk('sorcerer', 2)), so10 = mk('sorcerer', 10), s10 = A.derive(so10);
    o.sorc = { m2: so2.todo.length === 0 && mk('sorcerer', 2).metamagic.length, m10: so10.metamagic.length, ac: s10.armor ? null : s10.ac, want: 10 + s10.mod.dex + s10.mod.cha };
    const w1 = mk('warlock', 1); o.lock1 = { invN: A.derive(w1).invN, inv: w1.invocations.slice() };
    const wt = mk('warlock', 5, '2024', (x) => { x.invocations = ['ptome']; }); const wD = A.derive(wt);
    o.tome = { cN: wD.cast.cantripsN, base: A.derive(mk('warlock', 5)).cast.cantripsN + (mk('warlock', 5).invocations.includes('ptome') ? -3 : 0), thirsty: wt.invocations.includes('thirsting') };
    // every 2024 kit item is a real shop item
    o.missing = [];
    for (const k of Object.keys(A.C24)) for (const grp of A.C24[k].kit) for (const op of grp) for (const t of op.i) { const n = t.replace(/ x\d+$/, ''); if (!t.startsWith('@') && !A.ITEM.get(n)) o.missing.push(k + ': ' + n); }
    const fb = mk('fighter', 19, '2024', (x) => { x.boon = 'fortitude'; x.boonAb = 'str'; x.base.str = 20; }), fD = A.derive(fb), fb2 = mk('fighter', 19, '2024', (x) => { x.boon = 'combat'; x.boonAb = 'str'; x.base.str = 20; });
    o.boon = { hp: fD.hpMax - A.derive(fb2).hpMax, str: fD.sc.str, feat: fD.feats.some((f) => f.n === 'Boon of Fortitude') };
    const ct = mk('cleric', 1, '2024', (x) => { x.order = 'thaumaturge'; }), cp = mk('cleric', 1, '2024', (x) => { x.order = 'protector'; });
    const tD = A.derive(ct), pD = A.derive(cp);
    o.cleric = { cant: [tD.cast.cantripsN, pD.cast.cantripsN], relig: tD.skillBonus('Religion') - pD.skillBonus('Religion'), heavy: [tD.armorProfs.has('heavy'), pD.armorProfs.has('heavy')] };
    const dr = mk('druid', 3, '2024', (x) => { x.land24 = 'Arid'; }), drD = A.derive(dr);
    o.druid = { always: drD.cast.always.slice(), fb: drD.attacks.some((a) => a.name === 'Fire Bolt') };
    o.rogue15 = A.derive(mk('rogue', 15)).saves.has('cha');
    const g = mk('wizard', 1, '2024', (x) => { x.goldMode = 'gold'; }); o.gold = { g: A.goldOf(g), todo: A.derive(g).todo.length };
    const sh = mk('monk', 5, '2014', (x) => { x.subclass = 'Way of Shadow'; }); A.setRules(sh, '2024'); o.sub = sh.subclass;
    const rg = A.derive(mk('ranger', 6)); o.ranger = { speed: rg.speed, mark: (rg.uses.find((u) => u.key === 'mark') || {}).max };
    return o;
  });
  console.log(JSON.stringify(c24));
  ok(c24.fighter.sw === 2 && c24.fighter.kit.includes('Greatsword') && c24.fighter.gold === 18, '2024 fighter: two Second Winds, the 2024 kit, and kit gold plus background gold (' + c24.fighter.gold + ' gp)');
  ok(c24.swAfterShort === 1, 'a short rest gives back one Second Wind, not all of them');
  ok(String(c24.paladin.slots) === '2' && c24.paladin.prep === 2 && !c24.paladin.old, '2024 paladins cast from level 1 (2 slots, 2 prepared); 2014 paladins still wait for level 2');
  ok(/^1d6/.test(c24.monk[0]) && /^1d4/.test(c24.monk[1]), 'monk martial arts die is d6 in 2024, d4 in 2014');
  ok(c24.barb.rage === 6 && c24.barb.str === 25 && c24.barb.con === 24 && c24.barb.skN === 3 && c24.barb.skills === 3, '2024 barbarian 20: six rages, Primal Champion +4 on top of the epic boon (Str 25 cap), and the Primal Knowledge skill');
  ok(c24.sorc.m2 === 2 && c24.sorc.m10 === 4 && c24.sorc.ac === c24.sorc.want, '2024 sorcerer: Metamagic from level 2 (4 at 10), draconic AC 10 + Dex + Cha');
  ok(c24.lock1.invN === 1 && c24.lock1.inv.length === 1 && c24.tome.cN === c24.tome.base + 3 && !c24.tome.thirsty, '2024 warlock: one invocation at level 1; Pact of the Tome adds three cantrips; Thirsting Blade needs the blade');
  ok(!c24.missing.length, 'every 2024 starting-kit item is a real item ' + JSON.stringify(c24.missing));
  ok(c24.boon.hp === 40 && c24.boon.str === 21 && c24.boon.feat, 'level 19 epic boon: Fortitude adds 40 HP and the +1 can pass 20');
  ok(c24.cleric.cant[0] === c24.cleric.cant[1] + 1 && c24.cleric.relig >= 1 && !c24.cleric.heavy[0] && c24.cleric.heavy[1], 'Divine Order: Thaumaturge gets a cantrip and Wis to Religion, Protector gets heavy armour');
  ok(c24.druid.always.includes('Fire Bolt') && c24.druid.always.includes('Blur') && c24.druid.fb, '2024 Circle of the Land (Arid) gives Blur, Burning Hands and Fire Bolt, with a Fire Bolt attack');
  ok(c24.rogue15, '2024 Slippery Mind adds Charisma saves');
  ok(c24.gold.g === 105 && c24.gold.todo === 0, '2024 starting gold is fixed: class 55 gp + background 50 gp, nothing to roll');
  ok(c24.sub === '', 'switching rules drops a subclass the other edition lacks');
  ok(c24.ranger.speed === 40 && c24.ranger.mark === 3, '2024 ranger 6: Roving +10 ft and three free Hunter\'s Marks');
  // 2024 spell lists (v28)
  const sp = await p.evaluate(() => {
    const A = window.__A, o = {};
    const mk = (cls, lv, rules, f) => { const h = A.newHero(true); h.rules = rules || '2024'; h.level = lv; A.quickBuild(h, cls); h.level = lv; if (f) f(h); A.autoFill(h); return h; };
    const names = (h, lv) => A.classSpells(h, lv, 9).map((s) => s.name);
    const w24 = mk('wizard', 15), w14 = mk('wizard', 15, '2014');
    o.wiz = { ice24: names(w24, 1).includes('Ice Knife'), ice14: names(w14, 1).includes('Ice Knife'), fee24: names(w24, 8).includes('Feeblemind'), bef24: names(w24, 8).includes('Befuddlement'), fee14: names(w14, 8).includes('Feeblemind') };
    o.bard = [names(mk('bard', 1), 1).includes('Dissonant Whispers'), names(mk('bard', 1, '2014'), 1).includes('Dissonant Whispers')];
    o.ranger = names(mk('ranger', 1), 1).includes('Ensnaring Strike');
    o.lock = names(mk('warlock', 1), 1).includes('Hex');
    const so = mk('sorcerer', 1, '2024', (h) => { h.cantrips = ['Sorcerous Burst']; });
    o.burst = A.derive(so).attacks.some((a) => a.name === 'Sorcerous Burst');
    const cur0 = A.heroes.cur, pal = mk('paladin', 2); A.heroes.list.push(pal); A.openHero(pal.id); A.heroes.step = 'sheet'; A.renderPanel();
    o.smite = /Divine Smite/.test(document.querySelector('#inspector').innerText) && !!A.SPELL_BY.get('Divine Smite');
    A.heroes.cur = cur0; A.setTool('explore');
    o.new14 = A.classSpells(mk('cleric', 9, '2014'), 4, 9).some((s) => s.name === 'Aura of Life');
    o.new24 = A.classSpells(mk('cleric', 9), 4, 9).some((s) => s.name === 'Aura of Life');
    return o;
  });
  console.log(JSON.stringify(sp));
  ok(sp.wiz.ice24 && !sp.wiz.ice14 && !sp.wiz.fee24 && sp.wiz.bef24 && sp.wiz.fee14, '2024 wizards choose from the SRD 5.2 list (Ice Knife, Befuddlement); 2014 wizards keep theirs (Feeblemind)');
  ok(sp.bard[0] && !sp.bard[1] && sp.ranger && sp.lock && sp.new24 && !sp.new14, 'each 2024 class gets its own new spells: Dissonant Whispers, Ensnaring Strike, Hex, Aura of Life');
  ok(sp.burst && sp.smite, 'Sorcerous Burst works as a cantrip attack, and a 2024 paladin\'s sheet lists Divine Smite as a spell');
  // UI: switch rules on the current hero
  await p.evaluate(() => { const A = window.__A; A.setTool('heroes'); A.heroes.step = 'basics'; A.renderPanel(); });
  await p.waitForTimeout(300);
  await p.click('[data-hr="rules"][data-v="2014"]'); await p.waitForTimeout(200);
  const after = await p.evaluate(() => { const h = window.__A.heroes.list.find((x) => x.id === window.__A.heroes.cur); return h.rules + ' ' + h.race + ' ' + h.bg; });
  ok(/^2014 halforc criminal/.test(after), 'switching to 2014 swaps an orc for a half-orc (' + after + ')');
  await p.click('[data-hr="rules"][data-v="2024"]'); await p.waitForTimeout(200);
  await p.click('[data-hr="race"][data-v="goliath"]'); await p.waitForTimeout(200);
  await p.click('[data-hr="bg"][data-v="sage"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: '/tmp/claude-0/r24a.png' });
  await p.evaluate(() => { const el = document.querySelector('.rules-note'); const s = [...document.querySelectorAll('#inspector section h3')].find((x) => x.textContent === 'Background'); if (s) s.scrollIntoView(); });
  await p.waitForTimeout(200);
  await p.screenshot({ path: '/tmp/claude-0/r24b.png' });
  const lab = await p.$eval('#inspector', (e) => /magic initiate/i.test(e.innerText) && /species/i.test(e.innerText));
  ok(lab, 'the Basics step shows Species and the Magic Initiate choices');
  console.log('errors', errs.length ? errs : 'none');
  await b.close();
})();
