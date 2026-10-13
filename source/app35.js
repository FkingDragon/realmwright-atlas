// ================================================================ downtime (v28)
// Between adventures a hero can spend days crafting, working, training, researching, carousing, serving a temple
// or recuperating. Each activity uses the town's prices and the hero's guilds: the Craft Guilds' workshops double
// crafting progress, the Mages' Circle library helps research, the Temple welcomes service, and guild lodging makes
// living cheaper. Results go into the hero's gold, inventory, languages and tools, and chronicle. The world's calendar
// stays with the DM: downtime is recorded from the current day.
const DT_ACTS = [
  ['craft', 'Crafting', 'Make a weapon, armour or gear. You pay half its price in materials and make progress each day.'],
  ['work', 'Working', 'Earn a living at a trade or by performing. A check decides how well it pays.'],
  ['train', 'Training', 'Learn a new language or tool with a teacher.'],
  ['research', 'Research', 'Dig for lore in a library or among the town\'s scholars.'],
  ['carouse', 'Carousing', 'Spend freely in the taverns and make new contacts, good or bad.'],
  ['service', 'Religious service', 'Serve at a temple and earn its favour.'],
  ['rest', 'Recuperating', 'Rest properly to shake off poison and exhaustion.']
];
const DT_LIFE = ['Poor', 'Modest', 'Comfortable'];
const dt = { act: 'craft', days: 5, life: 'Modest', item: '', train: '', tKind: 'lang', last: null };
const TOOLS_LEARN = ["Alchemist's supplies", "Brewer's supplies", "Calligrapher's supplies", "Carpenter's tools", "Cartographer's tools", "Cobbler's tools", "Cook's utensils", "Glassblower's tools", "Herbalism kit", "Jeweler's tools", "Leatherworker's tools", "Mason's tools", "Navigator's tools", "Painter's supplies", "Potter's tools", "Smith's tools", "Thieves' tools", "Tinker's tools", "Weaver's tools", "Woodcarver's tools", 'Disguise kit', 'Forgery kit', 'Poisoner\'s kit', 'Lute', 'Flute', 'Drum'];
// where the hero spends downtime: the party's town, else their home
function dtTown(h) { const at = gst().party.at; return (at && SBY.get(at)) || (h.home ? SBY.get(h.home) : null); }
// a day's living at a lifestyle in this town, less what a guild provides
function dtLiving(h, s, life) {
  const q = INN_Q.indexOf(life), Lv = priceLevels(s, market.day), ML = memberLodging(h, s);
  const stay = q <= ML.lodge ? 0 : INN_STAY[q] * Lv.lodging, meal = q <= ML.meals ? 0 : INN_MEAL[q] * Lv.meal;
  return { day: stay + meal, free: q <= ML.lodge, by: ML.by };
}
const dtMember = (h, k) => { const m = gjMember(h, k); return !!m && !gjLapsed(m); };
const dtRules24 = (h) => is24(h);
// how many gold pieces of an item's value a day of crafting makes: 5 (2014) or 10 (2024), doubled in a guild workshop
function dtCraftRate(h, s) { return (dtRules24(h) ? 10 : 5) * (dtMember(h, 'crafts') && gjAt(s, 'crafts') ? 2 : 1); }
function dtCanCraft(h, D, it) {
  if (!it) return 'Choose what to make.';
  if (!D.tools.length) return 'Crafting needs proficiency with a tool.';
  if (it.kind === 'weapon' || it.kind === 'armor') { if (!D.tools.some((t) => /smith|leatherworker|woodcarver|tinker/i.test(t)) && !(dtMember(h, 'crafts'))) return 'Arms and armour need smith\'s, leatherworker\'s or woodcarver\'s tools (or a Craft Guild workshop).'; }
  return '';
}
const d20 = () => 1 + Math.floor(Math.random() * 20);
// carry out the days and say what happened
function dtRun(h) {
  const D = derive(h), s = dtTown(h), days = clamp(dt.days | 0, 1, 120);
  if (!s) { toast('Choose a hometown first, or place the party in a town.'); return null; }
  const L = dtLiving(h, s, dt.life), lines = [], day0 = market.day;
  // nothing sticks unless the hero can pay: keep a copy to put back
  const snap = JSON.stringify({ dt: h.dt || {}, inv: h.inv, learned: h.learned || { langs: [], tools: [] }, exh: h.exh || 0, conds: h.conds || [] });
  const undo = () => { const o = JSON.parse(snap); h.dt = o.dt; h.inv = o.inv; h.learned = o.learned; h.exh = o.exh; h.conds = o.conds; };
  let cost = Math.round(L.day * days * 100) / 100, gain = 0;
  const res = { title: '', lines, days, town: s.name };
  const live = L.free ? 'Living ' + dt.life.toLowerCase() + ' at ' + L.by[0] + ' cost nothing.' : 'Living ' + dt.life.toLowerCase() + ' for ' + days + ' day' + (days === 1 ? '' : 's') + ' cost ' + money(cost) + '.';
  switch (dt.act) {
    case 'craft': {
      const it = ITEM.get(dt.item), why = dtCanCraft(h, D, it);
      if (why) { toast(why); return null; }
      const cur = Object.assign({ item: it.name, gp: 0, mat: false }, h.dt && h.dt.craft && h.dt.craft.item === it.name ? h.dt.craft : {});
      const price = it.cost;
      if (!cur.mat) { cost += Math.round(price / 2 * 100) / 100; cur.mat = true; lines.push('Materials for ' + it.name + ': ' + money(price / 2) + '.'); }
      const rate = dtCraftRate(h, s);
      cur.gp = Math.min(price, cur.gp + rate * days);
      if (cur.gp >= price) {
        h.inv = h.inv.concat([{ n: it.name, q: 1 }]);
        h.dt = Object.assign({}, h.dt, { craft: null });
        res.title = 'Made ' + aan(it.name).toLowerCase() + ' ' + it.name.toLowerCase();
        lines.push('Finished: ' + it.name + ' is in the inventory.');
      } else {
        h.dt = Object.assign({}, h.dt, { craft: cur });
        res.title = 'Worked on ' + it.name.toLowerCase();
        lines.push('Progress: ' + money(cur.gp) + ' of ' + money(price) + ' (' + money(rate) + ' a day' + (rate > (dtRules24(h) ? 10 : 5) ? ' in the guild workshop' : '') + '); about ' + Math.ceil((price - cur.gp) / rate) + ' more day' + (Math.ceil((price - cur.gp) / rate) === 1 ? '' : 's') + '.');
      }
      break;
    }
    case 'work': {
      const opts = ['Athletics', 'Performance', 'Persuasion', 'Sleight of Hand'].map((k) => [k, D.skillBonus(k)]).sort((a, b) => b[1] - a[1]);
      const toolB = D.tools.length ? D.mod.int + D.pb : -99;
      const [sk, bonus] = toolB > opts[0][1] ? ['a trade (' + D.tools[0] + ')', toolB] : opts[0];
      const roll = d20(), tot = roll + bonus;
      const tier = tot >= 21 ? 3 : tot >= 15 ? 2 : tot >= 10 ? 1 : 0, Lv = priceLevels(s, market.day);
      const perDay = [0.1, 1, 2, 4][tier] * Math.sqrt(Lv.lodging * Lv.meal);
      const guild = (dtMember(h, 'merchants') && gjAt(s, 'merchants')) || (dtMember(h, 'crafts') && gjAt(s, 'crafts')) ? 1.25 : 1;
      gain = Math.round(perDay * days * guild * 100) / 100;
      res.title = 'Worked ' + days + ' days';
      lines.push('Check with ' + sk + ': ' + roll + ' + ' + bonus + ' = ' + tot + ' → ' + ['poor', 'modest', 'comfortable', 'wealthy'][tier] + ' pay, ' + money(perDay * guild) + ' a day' + (guild > 1 ? ' (guild rates)' : '') + '. Earned ' + money(gain) + '.');
      break;
    }
    case 'train': {
      const name = dt.train;
      if (!name) { toast('Choose a language or tool to learn.'); return null; }
      const known = dt.tKind === 'lang' ? D.langs.has(name) : D.tools.includes(name);
      if (known) { toast('Already known.'); return null; }
      const need = 250, fee = 1 * days;   // 250 days with a teacher at 1 gp a day
      const cur = Object.assign({ name, kind: dt.tKind, days: 0 }, h.dt && h.dt.train && h.dt.train.name === name ? h.dt.train : {});
      cur.days += days * (dtMember(h, 'mages') && gjAt(s, 'mages') && dt.tKind === 'lang' ? 2 : 1);
      cost += fee;
      if (cur.days >= need) {
        const Lr = Object.assign({ langs: [], tools: [] }, h.learned);
        h.learned = { langs: dt.tKind === 'lang' ? Lr.langs.concat([name]) : Lr.langs, tools: dt.tKind === 'tool' ? Lr.tools.concat([name]) : Lr.tools };
        h.dt = Object.assign({}, h.dt, { train: null });
        res.title = 'Learned ' + name; lines.push('Training complete: ' + name + ' is now on the sheet.');
      } else {
        h.dt = Object.assign({}, h.dt, { train: cur });
        res.title = 'Trained in ' + name; lines.push('Progress: ' + cur.days + ' of ' + need + ' days. The teacher\'s fee is 1 gp a day.');
      }
      break;
    }
    case 'research': {
      const lib = dtMember(h, 'mages') && gjAt(s, 'mages'), big = s.tier >= 3;
      const b = Math.max(D.skillBonus('Arcana'), D.skillBonus('History'), D.skillBonus('Religion'));
      const r1 = d20(), r2 = d20(), roll = lib ? Math.max(r1, r2) : r1, tot = roll + b + Math.floor(days / 5);
      cost += days * (lib ? 0 : 1);
      const facts = tot >= 25 ? 3 : tot >= 18 ? 2 : tot >= 12 ? 1 : 0;
      res.title = 'Researched for ' + days + ' days';
      lines.push((lib ? 'In the Mages\' Circle library (advantage): ' + r1 + ' and ' + r2 : 'Check: ' + roll) + ' + ' + b + (days >= 5 ? ' + ' + Math.floor(days / 5) + ' for the time spent' : '') + ' = ' + tot + '.');
      lines.push(facts ? 'You uncover ' + facts + ' useful piece' + (facts === 1 ? '' : 's') + ' of lore: the DM tells you what.' : 'Nothing useful turns up.' + (big ? '' : ' A bigger town\'s scholars might help.'));
      if (!lib) lines.push('Scholars and books cost 1 gp a day.');
      break;
    }
    case 'carouse': {
      const q = INN_Q.indexOf(dt.life), spend = [0, 2, 5, 10][Math.max(0, Math.min(3, q))] * days / 5 * Math.sqrt(priceLevels(s, market.day).drink || 1);
      cost += Math.round(spend * 100) / 100;
      const roll = d20() + D.skillBonus('Persuasion');
      const res0 = roll >= 21 ? 2 : roll >= 16 ? 1 : roll >= 6 ? 0 : -1;
      const pool = residents(s).filter((p) => (p.status || 'Alive') === 'Alive' && p.age >= 16);
      const who = pool.length ? withOv(pool[Math.floor(Math.random() * pool.length)]) : null;
      res.title = 'Caroused in ' + s.name;
      lines.push('Spent ' + money(spend) + ' on drink and company. Persuasion: ' + roll + '.');
      if (who) lines.push(res0 < 0 ? 'You made an enemy: ' + pLink(who) + ' (' + esc(who.job) + ') took offence.' : res0 === 0 ? 'A new acquaintance: ' + pLink(who) + ' (' + esc(who.job) + ').' : 'A new friend' + (res0 > 1 ? ' and ally' : '') + ': ' + pLink(who) + ' (' + esc(who.job) + ').');
      res.contact = who ? { id: who.id, kind: res0 } : null;
      break;
    }
    case 'service': {
      const t = placesOf(s).list.find((x) => x.kind === 'temple');
      if (!t) { toast('There is no temple in ' + s.name + '.'); return null; }
      const member = dtMember(h, 'temple');
      const favours = Math.floor(days / 10) + (member && days >= 5 ? 1 : 0);
      res.title = 'Served at ' + t.name;
      lines.push('Served at ' + placeLink(s, t.key) + ', a house of ' + esc(t.god || 'the gods') + '. Board and lodging are given to those who serve.');
      cost = 0;
      lines.push(favours ? 'The temple owes you ' + favours + ' favour' + (favours === 1 ? '' : 's') + ': healing, shelter or a word with the high priest, as the DM decides.' : 'Serve at least 10 days (5 as a member of the Temple) to earn a favour.');
      break;
    }
    case 'rest': {
      const steps = Math.floor(days / 3);
      const before = [h.exh || 0, (h.conds || []).includes('Poisoned')];
      if (steps) { h.exh = Math.max(0, (h.exh || 0) - steps); h.conds = (h.conds || []).filter((c) => c !== 'Poisoned'); }
      res.title = 'Recuperated for ' + days + ' days';
      lines.push(steps ? 'Exhaustion ' + before[0] + ' → ' + h.exh + (before[1] ? '; no longer poisoned' : '') + '. (Atlas rule: every 3 days of rest ends poison and lowers exhaustion by 1.)' : 'Rest at least 3 days to recover.');
      break;
    }
  }
  if (cost > goldOf(h) + gain + 1e-9) { undo(); toast('Not enough gold: this would cost ' + money(cost) + '.'); return null; }
  if (dt.act !== 'service') lines.push(live);
  h.goldDelta += Math.round((gain - cost) * 100) / 100;
  res.net = Math.round((gain - cost) * 100) / 100;
  heroLog(h, 'dt', res.title + ' (' + days + ' day' + (days === 1 ? '' : 's') + ', from ' + dateText(day0) + ', in ' + s.name + ')' + (res.net ? '; ' + (res.net > 0 ? '+' : '−') + money(Math.abs(res.net)) : ''));
  return res;
}
function downtimeHtml(h) {
  const s = dtTown(h), D = derive(h);
  let o = '<section class="dt"><h3>Downtime</h3>';
  if (!s) return o + '<p class="meta">Choose a hometown on the Basics step, or place the party in a town, to spend downtime there.</p></section>';
  const L = dtLiving(h, s, dt.life), A = DT_ACTS.find((a) => a[0] === dt.act) || DT_ACTS[0];
  o += '<p class="small">In ' + tLink(s) + ' from ' + dateText(market.day) + '. ' + esc(A[2]) + '</p>';
  o += '<div class="row3">' + fieldSel('dt-act', 'Activity', DT_ACTS.map((a) => [a[0], a[1]]), dt.act) +
    '<div class="field"><label class="lab" for="dt-days">Days</label><input id="dt-days" type="number" min="1" max="120" value="' + dt.days + '"></div>' +
    fieldSel('dt-life', 'Living', DT_LIFE.map((x) => [x, x]), dt.life) + '</div>';
  if (dt.act === 'craft') {
    const list = WEAPONS.filter((w) => w.dmg !== '—').concat(ARMORS, GEAR.filter((g) => g.cost >= 1)).filter((it) => it.cost > 0);
    const cur = h.dt && h.dt.craft;
    o += fieldSel('dt-item', 'Make', [['', 'Choose…']].concat(list.map((it) => [it.name, it.name + ' (' + money(it.cost) + ')'])), dt.item || (cur ? cur.item : ''));
    const it = ITEM.get(dt.item || (cur ? cur.item : '')), why = dtCanCraft(h, D, it);
    if (it) o += '<p class="small">' + (why ? '<span class="warn-t">' + esc(why) + '</span>' : (cur && cur.item === it.name && cur.mat ? 'Materials paid' : 'Materials ' + money(it.cost / 2)) + '; ' + money(dtCraftRate(h, s)) + ' of progress a day' + (dtCraftRate(h, s) > (is24(h) ? 10 : 5) ? ' in the Craft Guilds\' workshop' : '') + ', so about ' + Math.ceil((it.cost - (cur && cur.item === it.name ? cur.gp : 0)) / dtCraftRate(h, s)) + (cur && cur.item === it.name ? ' more' : '') + ' days.') + '</p>';
    if (cur) o += '<p class="small">Under way: ' + esc(cur.item) + ', ' + money(cur.gp) + ' of ' + money((ITEM.get(cur.item) || {}).cost || 0) + '.</p>';
  }
  if (dt.act === 'train') {
    const kind = dt.tKind, Lr = h.learned || {}, cur = h.dt && h.dt.train;
    o += '<div class="row2">' + fieldSel('dt-tkind', 'Learn', [['lang', 'A language'], ['tool', 'A tool']], kind) +
      fieldSel('dt-train', kind === 'lang' ? 'Language' : 'Tool', [['', 'Choose…']].concat((kind === 'lang' ? LANGS.filter((l) => !D.langs.has(l)) : TOOLS_LEARN.filter((t) => !D.tools.includes(t))).map((x) => [x, x])), dt.train) + '</div>';
    o += '<p class="small">250 days with a teacher, at 1 gp a day.' + (kind === 'lang' && dtMember(h, 'mages') && gjAt(s, 'mages') ? ' The Mages\' Circle teaches languages twice as fast.' : '') + (cur ? ' Under way: ' + esc(cur.name) + ', ' + cur.days + ' days.' : '') + ((Lr.langs || []).length || (Lr.tools || []).length ? ' Learned so far: ' + esc((Lr.langs || []).concat(Lr.tools || []).join(', ')) + '.' : '') + '</p>';
  }
  o += '<p class="small">Living ' + dt.life.toLowerCase() + ': ' + (L.free ? 'free at ' + esc(L.by[0]) : money(L.day) + ' a day here') + '.</p>';
  o += '<div class="actions"><button type="button" class="btn primary" data-dt="run" data-v="' + esc(h.id) + '">Spend ' + dt.days + ' day' + (dt.days === 1 ? '' : 's') + '</button></div>';
  if (dt.last && dt.last.hid === h.id) o += '<div class="dt-out"><b>' + esc(dt.last.title) + '</b>' + dt.last.lines.map((l) => '<p class="small">' + l + '</p>').join('') + '</div>';
  return o + '</section>';
}
document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (!t || !/^dt-/.test(t.id || '')) return;
  if (t.id === 'dt-act') dt.act = t.value;
  else if (t.id === 'dt-days') dt.days = clamp(Math.round(+t.value || 1), 1, 120);
  else if (t.id === 'dt-life') dt.life = t.value;
  else if (t.id === 'dt-item') dt.item = t.value;
  else if (t.id === 'dt-tkind') { dt.tKind = t.value; dt.train = ''; }
  else if (t.id === 'dt-train') dt.train = t.value;
  renderPanel();
});
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-dt="run"]');
  if (!b) return;
  const h = (heroes.list || []).find((x) => x.id === b.dataset.v);
  if (!h) return;
  const r = dtRun(h);
  if (!r) return;
  dt.last = Object.assign({ hid: h.id }, r);
  heroSave();
  renderPanel();
});
