
// ================================================================ heroes: character creation and a live, play-ready sheet
const HERO_KEY = 'atlas-heroes-v1';
const heroes = { list: [], cur: null, step: 'basics', log: [], adv: 0, confirmDel: null, pickHome: false, shopCat: 'weapons', spellLv: -1, lastCrit: null };
function heroLoad() {
  try { const d = JSON.parse(localStorage.getItem(HERO_KEY) || 'null'); if (d && Array.isArray(d.list)) { heroes.list = d.list.filter((h) => h && h.id && CLS(h) && raceOk(h.race)).map(fixHero); heroes.cur = d.cur; if (d.rules) heroes.defRules = d.rules; } }
  catch (e) { /* storage unavailable */ }
  if (!heroes.list.some((h) => h.id === heroes.cur)) heroes.cur = heroes.list[0] ? heroes.list[0].id : null;
  if (heroes.cur) heroes.step = 'sheet';
}
let heroTimer = 0;
function heroSave() { clearTimeout(heroTimer); heroTimer = setTimeout(() => { const j = JSON.stringify({ list: heroes.list, cur: heroes.cur, rules: heroes.defRules }); try { localStorage.setItem(HERO_KEY, j); } catch (e) { /* the database copy below still works */ } if (typeof idbSet === 'function') idbSet('heroes', j); if (typeof shareHeroesPush === 'function') shareHeroesPush(); }, 250); }
const curHero = () => heroes.list.find((h) => h.id === heroes.cur) || null;
function fixHero(h) { return Object.assign(newHero(true), h); }
function newHero(blank) {
  const id = 'h' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  return {
    id, rules: heroes.defRules || '2014', name: '', level: 1, race: 'human', sub: '', cls: 'fighter', bg: 'soldier', align: 'Neutral good', age: 22, fem: false, home: blank ? null : (market.sid || people.sid || null),
    method: 'array', base: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }, rolls: null,
    raceAsi: [], raceSkills: [], raceLangs: [], raceCantrip: '', dragon: 'red', tool: '',
    skills: [], expertise: [], bgSkills: [], bgLangs: [], loreSkills: [], style: '', style2: '', favored: 'Beasts', terrain: 'Forest', land: 'Forest',
    invocations: [], pact: '', metamagic: [], asi: {},
    bgSwap: {}, kit: {}, picks: {}, goldMode: 'kit', goldRoll: 0, goldDelta: 0, inv: [], removed: [], armor: 'auto', shield: true,
    cantrips: [], spells: [], prepared: [], arcanum: {},
    hpMax: 0, hp: null, temp: 0, hdUsed: 0, slotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0], pactUsed: 0, uses: {}, death: [0, 0], insp: false, conds: [], exh: 0, xp: 0,
    subclass: '', subNotes: '', trait: '', ideal: '', bond: '', flaw: '', bondNpc: null, bondKind: '', notes: '', created: market.day,
    bgAsi: { mode: '21' }, bgAbil: [], bgFeat: '', feat24: '', mi: {}, mi2: {}, miList: '', miList2: '', skilled: [],
    order: '', strike7: '', boon: '', boonAb: '', land24: 'Temperate', orgs: {}, dt: {}, learned: { langs: [], tools: [] }, buys: [], hag: [], vent: []
  };
}
const raceSub = (h) => { const R = raceOf(h); if (!R.subs) return null; const k = R.subs[h.sub] ? h.sub : Object.keys(R.subs)[0]; return R.subs[k]; };
const raceName = (h) => { const S = raceSub(h); return S ? S.name.charAt(0).toUpperCase() + S.name.slice(1) : raceOf(h).name; };
const asiLevels = (C) => C.asi || ASI_DEFAULT;
const has = (arr, x) => arr.indexOf(x) >= 0;
const toggleIn = (arr, x, max) => { const i = arr.indexOf(x); if (i >= 0) arr.splice(i, 1); else if (max === undefined || arr.length < max) arr.push(x); else return false; return true; };

// ---------------------------------------------------------------- dice
function rollExpr(expr) {
  const parts = [];
  let total = 0;
  const re = /([+-]?)\s*(\d*)d(\d+)|([+-]?)\s*(\d+)/g;
  let m;
  while ((m = re.exec(expr.replace(/\s+/g, '')))) {
    if (m[3]) { const n = +(m[2] || 1), d = +m[3], sign = m[1] === '-' ? -1 : 1; for (let i = 0; i < n; i++) { const r = 1 + Math.floor(Math.random() * d); parts.push(r * sign); total += r * sign; } }
    else if (m[5]) { const v = +m[5] * (m[4] === '-' ? -1 : 1); total += v; if (v) parts.push((v > 0 ? '+' : '') + v); }
  }
  return { total, parts };
}
const dsg = (n) => (n >= 0 ? '+' : '-') + Math.abs(n);
const critExpr = (expr) => expr.replace(/(\d*)d(\d+)/g, (_, n, d) => (2 * +(n || 1)) + 'd' + d);
function showRoll(label, text, total, tone) {
  heroes.log.unshift({ label, text, total, tone, t: Date.now() });
  heroes.log.length = Math.min(heroes.log.length, 30);
  const el = $('hrRoll');
  const html = rollCard(heroes.log[0]);
  if (el) { el.innerHTML = html; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  const lg = $('hrLog'); if (lg) lg.innerHTML = logHtml();
}
const rollCard = (r) => '<span class="rc-l">' + esc(r.label) + '</span><b class="rc-t ' + (r.tone || '') + '">' + r.total + '</b><span class="rc-d">' + esc(r.text) + '</span>';
const logHtml = () => heroes.log.slice(1, 8).map((r) => '<li><span>' + esc(r.label) + '</span><b class="' + (r.tone || '') + '">' + r.total + '</b></li>').join('');
function rollD20(label, mod, key) {
  const a = 1 + Math.floor(Math.random() * 20), b = 1 + Math.floor(Math.random() * 20);
  const mode = heroes.adv;
  const nat = mode > 0 ? Math.max(a, b) : mode < 0 ? Math.min(a, b) : a;
  const h = curHero();
  const halfling = h && h.race === 'halfling';
  let used = nat, lucky = '';
  if (halfling && nat === 1) { used = 1 + Math.floor(Math.random() * 20); lucky = ' (Lucky reroll of a 1)'; }
  const D = h ? derive(h) : null;
  const critOn = D ? D.critOn : 20;
  const tone = used >= critOn && /attack|hit/i.test(label) ? 'crit' : used === 20 ? 'crit' : used === 1 ? 'fumble' : '';
  heroes.lastCrit = tone === 'crit' && key ? key : null;
  const dice = mode ? '[' + a + ', ' + b + '] ' + (mode > 0 ? 'adv' : 'dis') : 'd20 ' + nat;
  showRoll(label, dice + lucky + (lucky ? ' → ' + used : '') + ' ' + sgn(mod), used + mod, tone);
}
function rollDamage(label, expr, key) {
  const crit = key && heroes.lastCrit === key;
  const e = crit ? critExpr(expr) : expr;
  const r = rollExpr(e);
  heroes.lastCrit = null;
  showRoll(label + (crit ? ' (critical)' : ''), e + ': ' + r.parts.join(' '), Math.max(0, r.total), crit ? 'crit' : 'dmg');
}

// ---------------------------------------------------------------- derived sheet
function inventory(h) {
  const C = CLS(h), B = bgOf(h);
  const out = [];
  const add = (n, q, key, src) => { if (!n) return; if (h.removed.includes(key)) return; out.push({ n, q: q || 1, key, src }); };
  if (h.goldMode === 'kit') {
    C.kit.forEach((grp, g) => {
      const o = grp[Math.min(h.kit[g] || 0, grp.length - 1)];
      o.i.forEach((tok, j) => {
        const key = 'k' + g + '.' + j;
        if (tok.startsWith('@')) { add(h.picks[g + '.' + j] || '', 1, key, 'class'); return; }
        const m = /^(.*) x(\d+)$/.exec(tok);
        add(m ? m[1] : tok, m ? +m[2] : 1, key, 'class');
      });
    });
    B.gear.forEach((n, j) => { const m = /^(.*) x(\d+)$/.exec(n); add(m ? m[1] : n, m ? +m[2] : 1, 'b' + j, 'background'); });
  }
  if (raceOf(h).toolChoice && h.tool) add(h.tool, 1, 'rt', 'race');
  for (let i = 0; i < h.inv.length; i++) out.push({ n: h.inv[i].n, q: h.inv[i].q || 1, key: 'i' + i, src: 'bought', i });
  return out;
}
const goldOf = (h) => Math.round(((is24(h) ? (h.goldMode === 'kit' ? bgOf(h).gold + kitGp24(h) : (CLS(h).goldB || 0) + 50) : h.goldMode === 'kit' ? bgOf(h).gold : h.goldRoll) + h.goldDelta) * 100) / 100;
function weaponProf(D, w) { const p = D.weaponProfs; return p.has(w.name) || (w.cat.startsWith('simple') && p.has('simple')) || (w.cat.startsWith('martial') && p.has('martial')); }
function derive(h) {
  const R = raceOf(h), S = raceSub(h), C = CLS(h), B = bgOf(h);
  const lv = clamp(h.level | 0, 1, 20), pb = profBonus(lv);
  const srd = (!h.subclass || h.subclass === C.sub[1]) && !(is24(h) && lv < 3);
  const D = { lv, pb, srd, subName: h.subclass || C.sub[1], todo: [], soft: [], feats: [], uses: [], attacks: [], notes: [], dark: (S && S.dark) || R.dark };
  // ability scores
  const sc = Object.assign({}, h.base);
  const add = (o) => { for (const k in o) sc[k] = (sc[k] || 0) + o[k]; };
  add(originAsi(h));
  const asiAt = asiLevels(C).filter((x) => x <= lv);
  for (const at of asiAt) { const c = h.asi[at] || {}; for (const k of [c.a, c.b]) if (ABIL.includes(k)) sc[k] = Math.min(20, sc[k] + 1); }
  for (const k of ABIL) sc[k] = Math.min(20, sc[k]);
  const v24 = is24(h);
  if (v24 && lv >= BOON_LV && boonAb(h)) sc[boonAb(h)] = Math.min(30, sc[boonAb(h)] + 1);
  const cap20 = (a, b) => { const m = v24 ? 25 : 24; sc[a] = Math.max(sc[a], Math.min(m, sc[a] + 4)); sc[b] = Math.max(sc[b], Math.min(m, sc[b] + 4)); };
  if (h.cls === 'barbarian' && lv >= 20) cap20('str', 'con');
  if (v24 && h.cls === 'monk' && lv >= 20) cap20('dex', 'wis');
  D.sc = sc; D.mod = {}; for (const k of ABIL) D.mod[k] = modOf(sc[k]);
  // proficiencies
  const saves = new Set(C.saves);
  if (h.cls === 'monk' && lv >= 14) ABIL.forEach((a) => saves.add(a));
  if (h.cls === 'rogue' && lv >= 15) { saves.add('wis'); if (v24) saves.add('cha'); }
  D.saves = saves;
  const skills = new Set();
  const grant = (list, src) => { for (const s of list) { if (skills.has(s) && !src.endsWith('background')) D.soft.push(s + ' is granted twice (' + src + '); pick a different skill elsewhere.'); skills.add(s); } };
  grant(R.skills || [], R.name);
  if (R.skillPick) grant(h.raceSkills.filter((x) => !R.skillFrom || R.skillFrom.includes(x)).slice(0, R.skillPick), R.name);
  const F24 = feats24(h);
  if (F24.some((f) => f.k === 'skilled')) grant((h.skilled || []).slice(0, 3), 'Skilled feat');
  D.bgSkills = (h.bg === 'custom' ? h.bgSkills.slice(0, 2) : B.skills).map((s) => (skills.has(s) && h.bgSwap[s] && !skills.has(h.bgSwap[s]) ? h.bgSwap[s] : s));
  D.bgDupes = D.bgSkills.filter((s) => skills.has(s));
  grant(D.bgSkills, B.name + ' background');
  D.skN = C.skills[0] + (v24 && h.cls === 'barbarian' && lv >= 3 ? 1 : 0);
  grant(h.skills.slice(0, D.skN), C.name);
  if (v24 && lv >= BOON_LV && h.boon === 'skill') for (const s of ALL_SKILLS) skills.add(s);
  if (h.cls === 'bard' && srd && lv >= 3) grant(h.loreSkills.slice(0, 3), 'College of Lore');
  if (h.cls === 'warlock' && h.invocations.includes('beguiling')) { skills.add('Deception'); skills.add('Persuasion'); }
  D.skills = skills;
  const expN = v24 ? expN24(h, lv) : h.cls === 'rogue' ? (lv >= 6 ? 4 : 2) : h.cls === 'bard' ? (lv >= 10 ? 4 : lv >= 3 ? 2 : 0) : 0;
  D.expN = expN;
  let exL = h.expertise.filter((s) => skills.has(s) || s === "Thieves' tools");
  // 2024 wizard Scholar: the first expertise must be a scholarly skill
  if (v24 && h.cls === 'wizard') { const sch = exL.filter((s) => SCHOLAR.includes(s)).slice(0, 1); exL = sch.concat(exL.filter((s) => !sch.includes(s)).slice(0, Math.max(0, expN - 1))); }
  D.expertise = new Set(exL.slice(0, expN));
  const jack = h.cls === 'bard' && lv >= 2, athlete = !v24 && h.cls === 'fighter' && srd && lv >= 7;
  // 2024 Thaumaturge and Magician add Wisdom to two Intelligence skills
  const orderSk = v24 && h.order === 'thaumaturge' && h.cls === 'cleric' ? ['Arcana', 'Religion'] : v24 && h.order === 'magician' && h.cls === 'druid' ? ['Arcana', 'Nature'] : [];
  D.skillBonus = (s) => { const ab = SKILL_AB[s]; let b = D.mod[ab]; if (D.expertise.has(s)) b += pb * 2; else if (skills.has(s)) b += pb; else if (jack) b += Math.floor(pb / 2); else if (athlete && (ab === 'str' || ab === 'dex' || ab === 'con')) b += Math.ceil(pb / 2); if (orderSk.includes(s)) b += Math.max(1, D.mod.wis); return b; };
  D.saveBonus = (a) => D.mod[a] + (saves.has(a) ? pb : 0);
  D.passive = 10 + D.skillBonus('Perception');
  const ordArmor = v24 ? (h.cls === 'cleric' && h.order === 'protector' ? ['heavy'] : h.cls === 'druid' && h.order === 'warden' ? ['medium'] : []) : [];
  const ordWeap = v24 && ((h.cls === 'cleric' && h.order === 'protector') || (h.cls === 'druid' && h.order === 'warden')) ? ['martial'] : [];
  D.armorProfs = new Set(C.armor.concat(srd ? C.subArmor || [] : [], ordArmor, (S && S.armor) || []));
  D.weaponProfs = new Set(C.weapons.concat(ordWeap, R.weapons || [], (S && S.weapons) || []));
  const tools = [].concat(C.tools || [], B.tools || [], (S && S.tools) || [], R.toolChoice && h.tool ? [h.tool] : [], (h.learned && h.learned.tools) || []);
  D.tools = tools;
  const langs = new Set(R.langs.concat(C.langs || [], h.cls === 'sorcerer' && srd && !v24 ? ['Draconic'] : []));
  for (const l of h.raceLangs) langs.add(l);
  for (const l of h.bgLangs) langs.add(l);
  for (const l of (h.learned && h.learned.langs) || []) langs.add(l);
  D.langs = langs;
  // hit points
  const hd = C.hd, con = D.mod.con;
  const perLv = ((S && S.hpLv) || R.hpLv || 0) + (h.cls === 'sorcerer' && srd ? 1 : 0);
  let hp = hd + con + perLv;
  for (let i = 2; i <= lv; i++) hp += Math.max(1, hd / 2 + 1 + con) + perLv;
  D.hpCalc = Math.max(1, hp);
  if (v24 && lv >= BOON_LV && h.boon === 'fortitude') D.hpCalc += 40;
  D.hpMax = h.hpMax > 0 ? h.hpMax : D.hpCalc;
  D.hd = hd; D.hdLeft = Math.max(0, lv - (h.hdUsed || 0));
  // armour and AC
  const inv = inventory(h);
  D.inv = inv;
  const ownArmor = inv.map((x) => ITEM.get(x.n)).filter((it) => it && it.kind === 'armor' && it.type !== 'shield');
  const ownShield = inv.some((x) => x.n === 'Shield');
  const armorAC = (a) => a.ac + (a.type === 'light' ? D.mod.dex : a.type === 'medium' ? Math.min(2, D.mod.dex) : 0);
  const canWear = (a) => D.armorProfs.has(a.type) && !(C.noMetal && /mail|plate|splint|chain|breast/i.test(a.name));
  let armor = null;
  if (h.armor === 'auto') { const ok = ownArmor.filter(canWear).sort((a, b) => armorAC(b) - armorAC(a)); armor = ok[0] || null; }
  else if (h.armor !== 'none') armor = ownArmor.find((a) => a.name === h.armor) || null;
  const unarmoredOpts = [10 + D.mod.dex];
  if (C.unarmored === 'con') unarmoredOpts.push(10 + D.mod.dex + D.mod.con);
  if (C.unarmored === 'wis') unarmoredOpts.push(10 + D.mod.dex + D.mod.wis);
  if (h.cls === 'sorcerer' && srd) unarmoredOpts.push(v24 ? 10 + D.mod.dex + D.mod.cha : 13 + D.mod.dex);
  let ac = armor ? armorAC(armor) : Math.max(...unarmoredOpts);
  const shieldOn = ownShield && h.shield && D.armorProfs.has('shield') && !(C.unarmored === 'wis' && !armor);
  if (shieldOn) ac += 2;
  const styles = [h.style, lv >= (v24 ? 7 : 10) && h.cls === 'fighter' && srd ? h.style2 : ''].filter(Boolean);
  const styleAt = C.style ? C.style[0] : 99;
  const hasStyle = (k) => lv >= styleAt && styles.includes(k);
  if (armor && hasStyle('defense')) ac += 1;
  D.ac = ac; D.armor = armor; D.shieldOn = shieldOn;
  D.acNote = (armor ? armor.name : C.unarmored === 'con' ? 'Unarmoured defence (Dex + Con)' : C.unarmored === 'wis' ? 'Unarmoured defence (Dex + Wis)' : h.cls === 'sorcerer' && srd ? (v24 ? 'Draconic resilience (10 + Dex + Cha)' : 'Draconic resilience (13 + Dex)') : 'No armour (10 + Dex)') + (shieldOn ? ' + shield' : '') + (armor && hasStyle('defense') ? ' + Defence style' : '');
  if (armor && !canWear(armor)) D.soft.push('You are not proficient with ' + armor.name.toLowerCase() + '.');
  if (ownShield && h.shield && !D.armorProfs.has('shield')) D.soft.push('You are not proficient with shields.');
  // speed
  let speed = (S && S.speed) || R.speed;
  if (armor && armor.type === 'heavy' && armor.str && sc.str < armor.str && !(h.race === 'dwarf' && !is24(h))) { speed -= 10; D.notes.push('Speed −10 ft: ' + armor.name + ' needs Strength ' + armor.str + '.'); }
  if (h.cls === 'barbarian' && lv >= 5 && !(armor && armor.type === 'heavy')) speed += 10;
  if (h.cls === 'monk' && lv >= 2 && !armor && !shieldOn) speed += lv >= 18 ? 30 : lv >= 14 ? 25 : lv >= 10 ? 20 : lv >= 6 ? 15 : 10;
  if (v24 && h.cls === 'ranger' && lv >= 6 && !(armor && armor.type === 'heavy')) speed += 10;
  if (v24 && lv >= BOON_LV && h.boon === 'speed') speed += 30;
  // exhaustion: 2014 halves speed at level 2; 2024 takes 5 ft and 2 from every d20 test per level
  D.d20pen = is24(h) ? 2 * (h.exh || 0) : 0;
  if (is24(h)) speed = Math.max(0, speed - 5 * (h.exh || 0));
  else { if (h.exh >= 2) speed = Math.floor(speed / 2); if (h.exh >= 5) speed = 0; }
  D.speed = speed;
  D.init = D.mod.dex + (F24.some((f) => f.k === 'alert') ? pb : 0) - D.d20pen;
  if (D.d20pen) { const sb = D.skillBonus, vb = D.saveBonus; D.skillBonus = (s) => sb(s) - D.d20pen; D.saveBonus = (a) => vb(a) - D.d20pen; D.passive -= D.d20pen; }
  D.critOn = h.cls === 'fighter' && srd ? (lv >= 15 ? 18 : lv >= 3 ? 19 : 20) : 20;
  if (armor && armor.stealth) D.notes.push('Disadvantage on Stealth in ' + armor.name.toLowerCase() + '.');
  // attacks
  const martialDie = h.cls === 'monk' ? (v24 ? (lv >= 17 ? 'd12' : lv >= 11 ? 'd10' : lv >= 5 ? 'd8' : 'd6') : (lv >= 17 ? 'd10' : lv >= 11 ? 'd8' : lv >= 5 ? 'd6' : 'd4')) : null;
  const twoHandedHeld = false;
  const seen = new Set();
  for (const it of inv) {
    const w = ITEM.get(it.n);
    if (!w || w.kind !== 'weapon' || seen.has(w.name) || w.dmg === '—') continue;
    seen.add(w.name);
    const ranged = w.cat.endsWith('ranged');
    const monkW = martialDie && (v24 ? w.cat === 'simple melee' || (w.cat === 'martial melee' && w.props.includes('light')) : w.name === 'Shortsword' || (w.cat === 'simple melee' && !w.props.includes('two-handed') && !w.props.includes('heavy')));
    const ab = ranged ? 'dex' : (w.props.includes('finesse') || monkW) ? (D.mod.dex > D.mod.str ? 'dex' : 'str') : 'str';
    const prof = weaponProf(D, w);
    let hit = D.mod[ab] + (prof ? pb : 0) + (ranged && hasStyle('archery') ? 2 : 0);
    let die = w.dmg;
    if (monkW && martialDie && +martialDie.slice(1) > +(die.split('d')[1] || 0)) die = '1' + martialDie;
    let dmgBonus = D.mod[ab] + (!ranged && hasStyle('dueling') && !w.props.includes('two-handed') ? 2 : 0);
    const vers = w.props.find((p) => p.startsWith('versatile'));
    const props = w.props.map((p) => p.replace('versatile:', 'versatile ')).join(', ') + (w.range ? (w.props.length ? ', ' : '') + 'range ' + w.range : '');
    const mas = is24(h) && masteryCount(h, lv) && MASTERY_OF[w.name] && prof ? MASTERY_OF[w.name] : '';
    D.attacks.push({ key: 'w:' + w.name, name: w.name, hit, mastery: mas, dmg: die + (dmgBonus ? dsg(dmgBonus) : ''), type: w.type, props: props + (mas ? (props ? ', ' : '') + 'mastery: ' + mas : ''), prof, vers: vers ? vers.split(':')[1] + (dmgBonus ? dsg(dmgBonus) : '') : '' });
  }
  { const ab = martialDie && D.mod.dex > D.mod.str ? 'dex' : 'str'; D.attacks.push({ key: 'unarmed', name: 'Unarmed strike', hit: D.mod[ab] + pb, dmg: martialDie ? '1' + martialDie + (D.mod[ab] ? dsg(D.mod[ab]) : '') : String(Math.max(1, 1 + D.mod[ab])), type: 'bludgeoning', props: martialDie ? 'martial arts' : '', prof: true }); }
  void twoHandedHeld;
  if (R.dragon && is24(h)) {
    const dg = DRAGONS[h.dragon] || DRAGONS.red;
    D.attacks.push({ key: 'breath', name: 'Breath weapon', save: 'dex', dc: 8 + D.mod.con + pb, dmg: (lv >= 17 ? 4 : lv >= 11 ? 3 : lv >= 5 ? 2 : 1) + 'd10', type: dg[1], props: '15-ft cone or 30-ft line, replaces one attack, half on a save' });
  } else if (R.dragon) {
    const dg = DRAGONS[h.dragon] || DRAGONS.red;
    const n = lv >= 16 ? 5 : lv >= 11 ? 4 : lv >= 6 ? 3 : 2;
    D.attacks.push({ key: 'breath', name: 'Breath weapon', save: dg[3], dc: 8 + D.mod.con + pb, dmg: n + 'd6', type: dg[1], props: dg[2] + ', half on a save, once per short rest' });
  }
  // spellcasting
  const cast = C.cast;
  D.cast = null;
  if (cast && lv >= (cast.from || 1)) {
    const mod = D.mod[cast.ab];
    const K = { ab: cast.ab, mod, dc: 8 + pb + mod, atk: pb + mod, mode: cast.mode, list: cast.list, type: cast.type };
    if (cast.type === 'full') K.slots = FULL_SLOTS[lv].slice();
    else if (cast.type === 'half') K.slots = lv >= (cast.from || 2) ? FULL_SLOTS[Math.ceil(lv / 2)].slice() : [];
    else { K.slots = []; K.pact = PACT_SLOTS[lv]; K.pactLv = PACT_LEVEL[lv]; }
    K.maxLv = cast.type === 'pact' ? K.pactLv : K.slots.length;
    K.cantripsN = cast.cantrips(lv) + (!v24 && h.cls === 'druid' && srd && lv >= 2 ? 1 : 0) + (hasPact(h, 'tome') ? 3 : 0);
    if (v24 && ((h.cls === 'cleric' && h.order === 'thaumaturge') || (h.cls === 'druid' && h.order === 'magician'))) K.cantripsN += 1;
    if (v24 && (h.cls === 'paladin' || h.cls === 'ranger') && lv >= 2 && h.style === (h.cls === 'paladin' ? 'blessed' : 'druidic')) K.cantripsN += 2;
    if (cast.mode === 'known') K.knownN = cast.known[lv - 1];
    if (cast.mode === 'prepared') K.prepN = cast.prep ? cast.prep[lv - 1] : Math.max(1, mod + (cast.type === 'half' ? Math.floor(lv / 2) : lv));
    if (cast.mode === 'book') { K.bookN = 6 + 2 * (lv - 1); K.prepN = cast.prep ? cast.prep[lv - 1] : Math.max(1, mod + lv); }
    K.secretsN = h.cls !== 'bard' ? 0 : v24 ? (lv >= 10 ? K.knownN : lv >= 6 && srd ? 2 : 0) : (lv >= 6 && srd ? 2 : 0) + (lv >= 10 ? 2 : 0) + (lv >= 14 ? 2 : 0) + (lv >= 18 ? 2 : 0);
    // always-prepared spells from domain, oath, circle or patron
    K.always = [];
    if (C.extra && srd) for (const at in C.extra) if (lv >= +at) K.always.push(...C.extra[at]);
    if (h.cls === 'druid' && srd && lv >= 3 && !v24) { const cs = CIRCLE_SPELLS[h.land] || CIRCLE_SPELLS.Forest; [3, 5, 7, 9].forEach((at, i) => { if (lv >= at) K.always.push(cs[i * 2], cs[i * 2 + 1]); }); }
    if (h.cls === 'druid' && srd && lv >= 3 && v24) { const cs = CIRCLE24[h.land24] || CIRCLE24.Temperate; [3, 5, 7, 9].forEach((at, i) => { if (lv >= at) K.always.push(...cs[i]); }); }
    if (v24) { const free = { druid: ['Speak with Animals'], paladin: lv >= 2 ? ['Divine Smite'].concat(lv >= 5 ? ['Find Steed'] : []) : [], ranger: ["Hunter's Mark"], warlock: lv >= 9 ? ['Contact Other Plane'] : [], bard: lv >= 20 ? ['Power Word Heal', 'Power Word Kill'] : [] }[h.cls] || []; for (const n of free) if (!K.always.includes(n)) K.always.push(n); }
    K.expanded = C.expanded && srd ? C.expanded.filter((n) => (SPELL_BY.get(n) || {}).lv <= K.maxLv) : [];
    D.cast = K;
  }
  // racial spells
  D.raceSpells = [];
  if (is24(h)) {
    const ab = C.cast && ['int', 'wis', 'cha'].includes(C.cast.ab) ? C.cast.ab : 'wis';
    for (const [at, n] of [].concat(R.spells || [], (S && S.spells) || [])) if (lv >= at) D.raceSpells.push({ name: n, ab, note: (S || R).name + (at > 1 || (SPELL_BY.get(n) || {}).lv ? ', once per long rest' : ''), use: (SPELL_BY.get(n) || {}).lv ? 'r24' + aidSlug(n) : '' });
    for (const f of F24) if (f.k === 'mi') { const M = h[f.slot === 'race' ? 'mi2' : 'mi'] || {}, mab = M.ab || (f.mi === 'w' ? 'int' : 'wis'); for (const n of (M.cant || []).slice(0, 2)) D.raceSpells.push({ name: n, ab: mab, note: 'Magic Initiate' }); if (M.spell) D.raceSpells.push({ name: M.spell, ab: mab, note: 'Magic Initiate, once per long rest', use: 'mi' + (f.slot === 'race' ? '2' : '') }); }
  } else if (h.race === 'elf' && S && S.cantrip && h.raceCantrip) D.raceSpells.push({ name: h.raceCantrip, ab: 'int', note: 'High elf cantrip' });
  if (S && S.name === 'Dark elf (drow)') { D.raceSpells.push({ name: 'Dancing Lights', ab: 'cha', note: 'Drow Magic' }); if (lv >= 3) D.raceSpells.push({ name: 'Faerie Fire', ab: 'cha', note: 'once per long rest', use: 'drowff' }); if (lv >= 5) D.raceSpells.push({ name: 'Darkness', ab: 'cha', note: 'once per long rest', use: 'drowdark' }); }
  if (S && S.name === 'Forest gnome' && !is24(h)) D.raceSpells.push({ name: 'Minor Illusion', ab: 'int', note: 'Natural Illusionist' });
  if (h.race === 'tiefling' && !is24(h)) { D.raceSpells.push({ name: 'Thaumaturgy', ab: 'cha', note: 'Infernal Legacy' }); if (lv >= 3) D.raceSpells.push({ name: 'Hellish Rebuke', ab: 'cha', note: 'as 2nd level, once per long rest', use: 'rebuke' }); if (lv >= 5) D.raceSpells.push({ name: 'Darkness', ab: 'cha', note: 'once per long rest', use: 'darkness' }); }
  // cantrip attacks
  const myCantrips = (D.cast ? h.cantrips.concat(D.cast.always.filter((n) => (SPELL_BY.get(n) || {}).lv === 0 && !h.cantrips.includes(n))) : []).map((n) => [n, D.cast.ab]).concat(D.raceSpells.filter((r) => (SPELL_BY.get(r.name) || {}).lv === 0).map((r) => [r.name, r.ab]));
  const tier = lv >= 17 ? 4 : lv >= 11 ? 3 : lv >= 5 ? 2 : 1;
  for (const [n, ab] of myCantrips) {
    const ca = CANTRIP_ATK[n]; if (!ca) continue;
    const m = D.mod[ab], dc = 8 + pb + m, atk = pb + m;
    if (n === 'Eldritch Blast') { const ag = h.invocations.includes('agonizing') ? m : 0; D.attacks.push({ key: 'c:' + n, name: n + (tier > 1 ? ' (' + tier + ' beams)' : ''), hit: atk, dmg: '1d10' + (ag ? dsg(ag) : ''), type: 'force', props: (h.invocations.includes('spear') ? 'range 300 ft' : 'range 120 ft') + (tier > 1 ? ', roll each beam' : ''), spell: true }); continue; }
    const dice = tier + ca[2];
    if (ca[0] === 'atk') D.attacks.push({ key: 'c:' + n, name: n, hit: atk, dmg: dice, type: ca[3], props: SPELL_BY.get(n).range, spell: true });
    else D.attacks.push({ key: 'c:' + n, name: n, save: ca[1], dc, dmg: dice, type: ca[3], props: SPELL_BY.get(n).range, spell: true });
  }
  if (D.d20pen) for (const a of D.attacks) if (a.hit != null) a.hit -= D.d20pen;
  // features
  D.feats.push(...R.traits.map(([n, d]) => ({ n, d, src: R.name })));
  if (S) D.feats.push(...S.traits.map(([n, d]) => ({ n, d, src: S.name })));
  if (B.feat) D.feats.push({ n: B.feat[0], d: B.feat[1], src: B.name });
  for (const f of F24) D.feats.push({ n: FEATS24[f.k][0] + (f.k === 'mi' ? ' (' + MI_LIST[f.mi] + ')' : ''), d: FEATS24[f.k][1], src: f.src + ' · origin feat' });
  if (is24(h) && masteryCount(h, lv)) { const own = [...new Set(D.attacks.filter((a) => a.mastery).map((a) => a.mastery))]; D.feats.push({ n: 'Weapon Mastery (' + masteryCount(h, lv) + ' kinds)', d: 'Choose ' + masteryCount(h, lv) + ' kinds of weapon you are proficient with and use their mastery property (you can change one choice on each long rest). Your weapons\' masteries are listed with their attacks.' + (own.length ? ' ' + own.map((k) => k + ': ' + MASTERY[k]).join(' ') : ''), src: C.name + ' 1 · 2024' }); }
  if (is24(h) && raceOf(h).feat) D.notes.push('Resourceful: you gain Heroic Inspiration whenever you finish a long rest.');
  const subOn = lv >= subLv(h, C);
  for (const [at, n, d] of C.feats) if (at <= lv) D.feats.push({ n, d, src: C.name + ' ' + at, at });
  if (subOn && srd) for (const [at, n, d] of C.subFeats) if (at <= lv) D.feats.push({ n, d, src: C.sub[1] + ' ' + at, at });
  if (subOn && !srd) { D.feats.push({ n: h.subclass, d: 'A Player\'s Handbook subclass outside the free SRD, so its features are not built in. Read them on AideDD and add the ones you have below in the Class step; they appear here.', src: C.sub[0], at: C.sub[2], link: AID.cls(h.cls) }); for (const line of (h.subNotes || '').split('\n').map((x) => x.trim()).filter(Boolean)) { const m = /^(?:(\d+)\s*[:.)-]\s*)?([^:]+?)(?::\s*(.*))?$/.exec(line); const at = m && m[1] ? +m[1] : C.sub[2]; if (at <= lv) D.feats.push({ n: m ? m[2] : line, d: m && m[3] ? m[3] : '', src: h.subclass + ' ' + at, at }); } }
  const ST = styleTab(h);
  if (C.style && lv >= C.style[0]) for (const k of styles) if (ST[k]) D.feats.push({ n: 'Fighting style: ' + ST[k][0], d: ST[k][1], src: C.name });
  if (h.cls === 'sorcerer') { const dg = DRAGONS[h.dragon] || DRAGONS.red; if (srd) D.feats.push({ n: 'Ancestry: ' + dg[0] + ' dragon', d: 'Your draconic magic is tied to ' + dg[1] + '.', src: C.sub[1] }); const MM = metaTab(h); for (const k of h.metamagic.slice(0, metaN(h, lv))) if (MM[k]) D.feats.push({ n: MM[k][0], d: MM[k][1], src: 'Metamagic' }); }
  if (h.cls === 'warlock') { const IV = invoTab(h); for (const k of h.invocations) if (IV[k] && invoOk(h, k, lv)) D.feats.push({ n: IV[k][0], d: IV[k][1], src: 'Invocation' }); if (!v24 && lv >= 3 && h.pact) D.feats.push({ n: 'Pact of the ' + h.pact.charAt(0).toUpperCase() + h.pact.slice(1), d: { chain: 'Cast find familiar as a ritual; your familiar can be an imp, pseudodragon, quasit or sprite.', blade: 'Bonus action: summon a pact weapon of any melee form; you are proficient with it.', tome: 'A Book of Shadows holding three cantrips from any class.' }[h.pact], src: 'Pact Boon' }); }
  if (h.cls === 'ranger' && !v24) D.feats.push({ n: 'Favoured enemy: ' + h.favored, d: 'Natural explorer terrain: ' + h.terrain + '.', src: C.name });
  if (h.cls === 'druid' && srd && lv >= 2 && !v24) D.feats.push({ n: 'Circle land: ' + h.land, d: 'Your circle spells come from the ' + h.land.toLowerCase() + '.', src: C.sub[1] });
  if (h.cls === 'druid' && srd && lv >= 3 && v24) { const L = LANDS24.includes(h.land24) ? h.land24 : 'Temperate'; D.feats.push({ n: 'Circle land: ' + L, d: 'Your circle spells come from the ' + L.toLowerCase() + ' lands; Nature\'s Ward resists ' + { Arid: 'fire', Polar: 'cold', Temperate: 'lightning', Tropical: 'poison' }[L] + '.', src: C.sub[1] }); }
  if (v24 && (h.cls === 'cleric' || h.cls === 'druid')) {
    const ORD = { protector: ['Protector', 'Martial weapons and heavy armour.'], thaumaturge: ['Thaumaturge', 'One more cantrip; add your Wis mod (min +1) to Arcana and Religion checks.'], magician: ['Magician', 'One more cantrip; add your Wis mod (min +1) to Arcana and Nature checks.'], warden: ['Warden', 'Martial weapons and medium armour.'] }[h.order];
    if (ORD) D.feats.push({ n: (h.cls === 'cleric' ? 'Divine Order: ' : 'Primal Order: ') + ORD[0], d: ORD[1], src: C.name });
    if (lv >= 7 && h.strike7) D.feats.push(h.strike7 === 'potent' ? { n: 'Potent Spellcasting', d: 'Add your Wis mod to the damage of your ' + C.name.toLowerCase() + ' cantrips.', src: C.name } : h.cls === 'cleric' ? { n: 'Divine Strike', d: 'Once per turn, a weapon hit deals +' + (lv >= 14 ? 2 : 1) + 'd8 necrotic or radiant.', src: C.name } : { n: 'Primal Strike', d: 'Once per turn, an attack hit deals +' + (lv >= 15 ? 2 : 1) + 'd8 cold, fire, lightning or thunder.', src: C.name });
  }
  if (v24 && lv >= BOON_LV && EPIC_BOONS[h.boon]) D.feats.push({ n: EPIC_BOONS[h.boon][0], d: EPIC_BOONS[h.boon][1] + (boonAb(h) ? ' (+1 ' + ABIL_N[boonAb(h)] + ')' : ''), src: 'Epic boon' });
  // limited uses
  const U = (key, n, max, rest, note) => D.uses.push({ key, n, max, rest, note: note || '' });
  const cha = Math.max(1, D.mod.cha);
  if (v24) uses24(h, D, U);
  else {
    if (h.cls === 'barbarian') U('rage', 'Rage', lv >= 20 ? 99 : [2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6][lv - 1], 'long', 'Rage damage +' + (lv >= 16 ? 4 : lv >= 9 ? 3 : 2));
    if (h.cls === 'bard') U('insp', 'Bardic Inspiration', cha, lv >= 5 ? 'short' : 'long', 'd' + (lv >= 15 ? 12 : lv >= 10 ? 10 : lv >= 5 ? 8 : 6));
    if (h.cls === 'cleric' && lv >= 2) U('channel', 'Channel Divinity', lv >= 18 ? 3 : lv >= 6 ? 2 : 1, 'short', srd ? 'Turn Undead or Preserve Life (' + 5 * lv + ' HP)' : 'Turn Undead or your domain\'s option');
    if (h.cls === 'druid' && lv >= 2) { U('wild', 'Wild Shape', lv >= 20 ? 99 : 2, 'short', 'Max CR ' + (lv >= 8 ? '1' : lv >= 4 ? '1/2' : '1/4') + ', ' + Math.floor(lv / 2) + ' h'); if (srd) U('natrec', 'Natural Recovery', 1, 'long', Math.ceil(lv / 2) + ' slot levels'); }
    if (h.cls === 'fighter') { U('second', 'Second Wind', 1, 'short', '1d10+' + lv); if (lv >= 2) U('surge', 'Action Surge', lv >= 17 ? 2 : 1, 'short'); if (lv >= 9) U('indom', 'Indomitable', lv >= 17 ? 3 : lv >= 13 ? 2 : 1, 'long'); }
    if (h.cls === 'monk' && lv >= 2) { U('ki', 'Ki points', lv, 'short', 'Save DC ' + (8 + pb + D.mod.wis)); if (lv >= 6 && srd) U('whole', 'Wholeness of Body', 1, 'long', 3 * lv + ' HP'); }
    if (h.cls === 'paladin') { U('sense', 'Divine Sense', 1 + Math.max(0, D.mod.cha), 'long'); U('lay', 'Lay on Hands pool', 5 * lv, 'long', 'HP'); if (lv >= 3) U('channel', 'Channel Divinity', 1, 'short'); if (lv >= 14) U('cleanse', 'Cleansing Touch', cha, 'long'); if (lv >= 20 && srd) U('nimbus', 'Holy Nimbus', 1, 'long'); }
    if (h.cls === 'rogue') { D.notes.push('Sneak Attack: ' + Math.ceil(lv / 2) + 'd6 once per turn.'); if (lv >= 20) U('luck', 'Stroke of Luck', 1, 'short'); }
    if (h.cls === 'sorcerer' && lv >= 2) U('sorc', 'Sorcery points', lv, 'long');
    if (h.cls === 'warlock') { if (lv >= 6) U('ownluck', "Dark One's Own Luck", 1, 'short', '+d10'); if (lv >= 14) U('hurl', 'Hurl Through Hell', 1, 'long', '10d10 psychic'); if (lv >= 20) U('master', 'Eldritch Master', 1, 'long'); [[11, 6], [13, 7], [15, 8], [17, 9]].forEach(([at, sl]) => { if (lv >= at) U('arc' + sl, 'Mystic Arcanum (' + ordinal(sl) + ')', 1, 'long', h.arcanum[sl] || 'choose a spell'); }); }
    if (h.cls === 'wizard') U('arcrec', 'Arcane Recovery', 1, 'long', Math.ceil(lv / 2) + ' slot levels');
  }
  if (R.dragon && !is24(h)) U('breath', 'Breath Weapon', 1, 'short');
  if (is24(h)) for (const [k, n, max, rest, at] of [].concat(R.uses || [], (S && S.uses) || [])) if (lv >= at) U(k, n, max === 'pb' ? pb : max, rest);
  if (h.race === 'halforc') U('relentless', 'Relentless Endurance', 1, 'long');
  for (const r of D.raceSpells) if (r.use) U(r.use, r.name, 1, 'long');
  // choices still to make
  const T = (step, text) => D.todo.push({ step, text });
  if (!h.name.trim()) T('basics', 'Give your hero a name.');
  if (R.asiPick && h.raceAsi.filter((a) => a !== 'cha').length < R.asiPick) T('basics', 'Choose two abilities for your half-elf +1 bonuses.');
  if (R.skillPick && h.raceSkills.length < R.skillPick) T('basics', 'Choose ' + R.skillPick + ' ' + R.name.toLowerCase() + ' skill' + (R.skillPick > 1 ? 's' : '') + '.');
  if (is24(h)) {
    if (h.bg === 'custom' && (h.bgAbil || []).length < 3) T('basics', 'Choose the three abilities your custom background raises.');
    for (const f of F24) { if (f.k === 'mi') { const M = h[f.slot === 'race' ? 'mi2' : 'mi'] || {}; if ((M.cant || []).length < 2 || !M.spell) T('basics', 'Choose your Magic Initiate cantrips and spell.'); } if (f.k === 'skilled' && (h.skilled || []).length < 3) T('basics', 'Choose three skills for the Skilled feat.'); }
  }
  const langN = (R.extraLang || 0) + ((S && S.extraLang) || 0);
  if (h.raceLangs.length < langN) T('basics', 'Choose ' + (langN - h.raceLangs.length) + ' extra language' + (langN - h.raceLangs.length > 1 ? 's' : '') + ' from your race.');
  if (S && S.cantrip && !h.raceCantrip) T('basics', 'Choose your high elf wizard cantrip.');
  if (R.toolChoice && !h.tool) T('basics', 'Choose your dwarf tool proficiency.');
  if (h.bg === 'custom' && h.bgSkills.length < 2) T('basics', 'Choose two background skills.');
  for (const s of D.bgDupes) T('basics', 'Your race already gives ' + s + '; choose a replacement background skill.');
  if ((B.langs || 0) > h.bgLangs.length) T('basics', 'Choose ' + (B.langs - h.bgLangs.length) + ' background language' + (B.langs - h.bgLangs.length > 1 ? 's' : '') + '.');
  if (h.method === 'point') { const left = 27 - ABIL.reduce((a, k) => a + (POINT_COST[h.base[k]] || 0), 0); if (left > 0) D.soft.push(left + ' point-buy points unspent.'); if (left < 0) T('scores', 'Point buy is over budget by ' + -left + '.'); }
  if (h.skills.length < D.skN) T('class', 'Choose ' + (D.skN - h.skills.length) + ' more class skill' + (D.skN - h.skills.length > 1 ? 's' : '') + '.');
  if (expN && D.expertise.size < expN) T('class', 'Choose ' + (expN - D.expertise.size) + ' expertise skill' + (expN - D.expertise.size > 1 ? 's' : '') + '.');
  if (h.cls === 'bard' && srd && lv >= 3 && h.loreSkills.length < 3) T('class', 'Choose three College of Lore skills.');
  if (C.style && lv >= C.style[0] && !h.style) T('class', 'Choose a fighting style.');
  if (h.cls === 'fighter' && srd && lv >= (v24 ? 7 : 10) && !h.style2) T('class', 'Choose a second fighting style.');
  if (h.cls === 'sorcerer' && metaN(h, lv)) { const n = metaN(h, lv); if (h.metamagic.length < n) T('class', 'Choose ' + (n - h.metamagic.length) + ' Metamagic option' + (n - h.metamagic.length > 1 ? 's' : '') + '.'); }
  if (h.cls === 'warlock') { const n = (v24 ? INV_N24 : [0, 0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8])[lv]; D.invN = n; const have = h.invocations.filter((k) => invoTab(h)[k]).length; if (have < n) T('class', 'Choose ' + (n - have) + ' eldritch invocation' + (n - have > 1 ? 's' : '') + '.'); if (!v24 && lv >= 3 && !h.pact) T('class', 'Choose a pact boon.'); [[11, 6], [13, 7], [15, 8], [17, 9]].forEach(([at, sl]) => { if (lv >= at && !h.arcanum[sl]) T('spells', 'Choose a ' + ordinal(sl) + '-level Mystic Arcanum spell.'); }); }
  for (const at of asiAt) { const c = h.asi[at] || {}; if (!c.a || !c.b) T('class', 'Choose your level ' + at + ' ability score increase.'); }
  if (v24) todo24(h, D, T);
  if (h.goldMode === 'kit') C.kit.forEach((grp, g) => { const o = grp[Math.min(h.kit[g] || 0, grp.length - 1)]; o.i.forEach((tok, j) => { if (tok.startsWith('@') && !h.picks[g + '.' + j]) T('gear', 'Pick ' + PICKS[tok][0] + ' for your starting kit.'); }); });
  if (h.goldMode === 'gold' && !h.goldRoll && !v24) T('gear', 'Roll your starting gold.');
  if (D.cast) {
    const K = D.cast;
    const nonCls = h.cls === 'bard' ? h.spells.filter((n) => !spellCls(h, SPELL_BY.get(n) || { cls: '', cls24: '' }).includes('b')).length : 0;
    if (h.cantrips.length < K.cantripsN) T('spells', 'Choose ' + (K.cantripsN - h.cantrips.length) + ' more cantrip' + (K.cantripsN - h.cantrips.length > 1 ? 's' : '') + '.');
    if (K.knownN && h.spells.length < K.knownN) T('spells', 'Choose ' + (K.knownN - h.spells.length) + ' more spell' + (K.knownN - h.spells.length > 1 ? 's' : '') + ' known.');
    if (K.bookN && h.spells.length < K.bookN) T('spells', 'Add ' + (K.bookN - h.spells.length) + ' more spell' + (K.bookN - h.spells.length > 1 ? 's' : '') + ' to your spellbook.');
    const prepCount = K.mode === 'book' ? h.prepared.filter((n) => h.spells.includes(n)).length : K.mode === 'prepared' ? h.spells.length : 0;
    if (K.prepN && prepCount < K.prepN) T('spells', 'Prepare ' + (K.prepN - prepCount) + ' more spell' + (K.prepN - prepCount > 1 ? 's' : '') + '.');
    const cap = K.knownN || K.bookN || K.prepN || 0;
    const tooHigh = h.spells.filter((n) => (SPELL_BY.get(n) || { lv: 99 }).lv > K.maxLv);
    if (tooHigh.length) T('spells', 'Swap out spells you can no longer cast: ' + tooHigh.join(', ') + '.');
    if (h.spells.length > cap) T('spells', 'Remove ' + (h.spells.length - cap) + ' spell' + (h.spells.length - cap > 1 ? 's' : '') + ' (you can have ' + cap + ').');
    if (h.cantrips.length > K.cantripsN) T('spells', 'Remove ' + (h.cantrips.length - K.cantripsN) + ' cantrip' + (h.cantrips.length - K.cantripsN > 1 ? 's' : '') + '.');
    if (nonCls > K.secretsN) T('spells', 'Too many spells from other classes (Magical Secrets allows ' + K.secretsN + ').');
  }
  if (!h.home || !SBY.get(h.home)) D.soft.push('No hometown yet: choose one on the map to shop at local prices and tie your hero into the world.');
  D.ready = D.todo.length === 0;
  return D;
}
function ordinal(n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); }

// ---------------------------------------------------------------- local prices at the hometown
const GOOD_ALIAS = { 'Light crossbow': 'Crossbow, light' };
// the town's own price, before any guild discount (shopPrice in app32 adds those)
function shopPriceLocal(h, it) {
  const s = h.home ? SBY.get(h.home) : null;
  if (!s) return { price: it.cost, ok: true, local: false };
  const day = market.day;
  const P = pricesFor(s, day);
  const g = GBY[GOOD_ALIAS[it.name] || it.name];
  if (g) return { price: P[g.i], ok: inStock(s, g, day), local: true };
  // estimate from the town's own prices for similar goods
  const cat = it.kind === 'weapon' || it.kind === 'armor' ? 'arms' : 'trade';
  const pool = GOODS.filter((x) => x.cat === cat && (cat === 'arms' || x.tags.includes('gear')));
  let lr = 0; for (const x of pool) lr += Math.log(P[x.i] / x.base);
  const f = Math.exp(lr / Math.max(1, pool.length));
  let ok = true;
  if (it.kind === 'weapon' && it.cat.startsWith('martial') && s.tier < 2) ok = false;
  if (it.kind === 'armor' && (it.type === 'heavy' || it.cost >= 200) && s.tier < 2) ok = false;
  if (it.kind === 'armor' && it.cost >= 400 && s.tier < 3) ok = false;
  return { price: it.cost * f, ok, local: true };
}

// ---------------------------------------------------------------- quick build
const QB = {
  barbarian: [['halforc', 'dwarf', 'human'], ['str', 'con', 'dex', 'wis', 'cha', 'int'], 'outlander', ['Athletics', 'Perception']],
  bard: [['halfelf', 'human', 'tiefling'], ['cha', 'dex', 'con', 'wis', 'int', 'str'], 'entertainer', ['Persuasion', 'Deception', 'Insight', 'Perception', 'Stealth']],
  cleric: [['dwarf', 'human', 'halfelf'], ['wis', 'con', 'str', 'dex', 'cha', 'int'], 'acolyte', ['Medicine', 'Persuasion', 'History']],
  druid: [['human', 'halfling', 'elf'], ['wis', 'con', 'dex', 'int', 'cha', 'str'], 'hermit', ['Nature', 'Perception', 'Animal Handling', 'Survival']],
  fighter: [['human', 'halforc', 'dragonborn'], ['str', 'con', 'dex', 'wis', 'cha', 'int'], 'soldier', ['Perception', 'Survival', 'Acrobatics', 'History']],
  monk: [['elf', 'halfling', 'human'], ['dex', 'wis', 'con', 'str', 'int', 'cha'], 'hermit', ['Acrobatics', 'Insight', 'Stealth', 'Athletics']],
  paladin: [['dragonborn', 'human', 'halfelf'], ['str', 'cha', 'con', 'wis', 'dex', 'int'], 'noble', ['Athletics', 'Insight', 'Intimidation', 'Persuasion']],
  ranger: [['elf', 'halfling', 'human'], ['dex', 'wis', 'con', 'str', 'int', 'cha'], 'outlander', ['Perception', 'Stealth', 'Nature', 'Survival', 'Investigation']],
  rogue: [['halfling', 'elf', 'halfelf'], ['dex', 'con', 'int', 'wis', 'cha', 'str'], 'criminal', ['Perception', 'Acrobatics', 'Investigation', 'Insight', 'Persuasion', 'Sleight of Hand']],
  sorcerer: [['tiefling', 'dragonborn', 'halfelf'], ['cha', 'con', 'dex', 'wis', 'int', 'str'], 'sage', ['Persuasion', 'Insight', 'Arcana']],
  warlock: [['tiefling', 'halfelf', 'human'], ['cha', 'con', 'dex', 'wis', 'int', 'str'], 'sage', ['Deception', 'Intimidation', 'Investigation']],
  wizard: [['gnome', 'elf', 'human'], ['int', 'con', 'dex', 'wis', 'cha', 'str'], 'sage', ['Investigation', 'Insight', 'Medicine']]
};
const RECO = {
  b: ['Vicious Mockery', 'Minor Illusion', 'Mage Hand', 'Healing Word', 'Faerie Fire', 'Dissonant Whispers', 'Charm Person', 'Sleep', 'Cure Wounds', 'Heroism', 'Hold Person', 'Invisibility', 'Suggestion', 'Shatter', 'Hypnotic Pattern', 'Dispel Magic', 'Polymorph', 'Dimension Door', 'Greater Invisibility'],
  c: ['Sacred Flame', 'Guidance', 'Spare the Dying', 'Light', 'Thaumaturgy', 'Healing Word', 'Guiding Bolt', 'Shield of Faith', 'Sanctuary', 'Command', 'Detect Magic', 'Spiritual Weapon', 'Aid', 'Hold Person', 'Lesser Restoration', 'Spirit Guardians', 'Revivify', 'Dispel Magic', 'Mass Healing Word', 'Banishment', 'Freedom of Movement', 'Greater Restoration', 'Flame Strike'],
  d: ['Produce Flame', 'Guidance', 'Shillelagh', 'Druidcraft', 'Healing Word', 'Entangle', 'Faerie Fire', 'Goodberry', 'Thunderwave', 'Cure Wounds', 'Moonbeam', 'Pass without Trace', 'Lesser Restoration', 'Call Lightning', 'Conjure Animals', 'Dispel Magic', 'Polymorph', 'Ice Storm', 'Wall of Fire', 'Greater Restoration'],
  p: ['Bless', 'Cure Wounds', 'Shield of Faith', 'Divine Favor', 'Command', 'Heroism', 'Aid', 'Find Steed', 'Lesser Restoration', 'Magic Weapon', 'Revivify', 'Dispel Magic', 'Banishment', 'Death Ward', 'Raise Dead'],
  r: ["Hunter's Mark", 'Cure Wounds', 'Goodberry', 'Fog Cloud', 'Pass without Trace', 'Spike Growth', 'Lesser Restoration', 'Conjure Animals', 'Water Breathing', 'Freedom of Movement', 'Stoneskin', 'Tree Stride'],
  s: ['Fire Bolt', 'Minor Illusion', 'Prestidigitation', 'Mage Hand', 'Ray of Frost', 'Light', 'Shield', 'Magic Missile', 'Sleep', 'Burning Hands', 'Misty Step', 'Scorching Ray', 'Hold Person', 'Fireball', 'Counterspell', 'Haste', 'Greater Invisibility', 'Polymorph', 'Cone of Cold'],
  k: ['Eldritch Blast', 'Minor Illusion', 'Mage Hand', 'Prestidigitation', 'Hellish Rebuke', 'Charm Person', 'Protection from Evil and Good', 'Misty Step', 'Hold Person', 'Invisibility', 'Counterspell', 'Fly', 'Hypnotic Pattern', 'Dimension Door', 'Banishment', 'Hold Monster', 'Scrying'],
  w: ['Fire Bolt', 'Mage Hand', 'Light', 'Minor Illusion', 'Prestidigitation', 'Shield', 'Magic Missile', 'Mage Armor', 'Sleep', 'Detect Magic', 'Find Familiar', 'Thunderwave', 'Identify', 'Burning Hands', 'Misty Step', 'Scorching Ray', 'Invisibility', 'Web', 'Hold Person', 'Fireball', 'Counterspell', 'Fly', 'Haste', 'Dispel Magic', 'Polymorph', 'Greater Invisibility', 'Dimension Door', 'Wall of Force', 'Cone of Cold']
};
const KIT_DEFAULT = { '@martial': 'Longsword', '@martialMelee': 'Battleaxe', '@simple': 'Spear', '@simpleMelee': 'Mace', '@instrument': 'Flute' };
function classSpells(h, lv, maxLv, all) {
  const C = CLS(h);
  let key = C.cast ? C.cast.list : '';
  // 2024 Blessed Warrior and Druidic Warrior take cantrips from the cleric and druid lists
  if (lv === 0 && is24(h) && h.style === 'blessed' && h.cls === 'paladin') key = 'c';
  if (lv === 0 && is24(h) && h.style === 'druidic' && h.cls === 'ranger') key = 'd';
  // 2024 Magical Secrets: the bard, cleric, druid and wizard lists only
  const wide = all && is24(h) && h.cls === 'bard' && !hasPact(h, 'tome') ? (s) => /[bcdw]/.test(s.cls24) : all ? () => true : null;
  return SPELLS.filter((s) => s.lv <= maxLv && s.lv === lv && ((wide && wide(s)) || spellCls(h, s).includes(key) || (C.expanded && (!h.subclass || h.subclass === C.sub[1]) && C.expanded.includes(s.name))));
}
function spellOK(h, K, name, lv0) {
  const sp = SPELL_BY.get(name); if (!sp) return false;
  if (lv0) return sp.lv === 0;
  return sp.lv >= 1 && sp.lv <= K.maxLv;
}
function autoSpells(h) {
  const D = derive(h), K = D.cast;
  if (!K) return;
  const key = K.list, pref = RECO[key] || [];
  const order = (list) => list.slice().sort((a, b) => ((pref.indexOf(a.name) + 1 || 99) - (pref.indexOf(b.name) + 1 || 99)) || a.name.localeCompare(b.name));
  h.cantrips = h.cantrips.filter((n) => spellOK(h, K, n, true)).slice(0, K.cantripsN);
  for (const sp of order(classSpells(h, 0, 0))) { if (h.cantrips.length >= K.cantripsN) break; if (!h.cantrips.includes(sp.name)) h.cantrips.push(sp.name); }
  const want = K.knownN || K.bookN || K.prepN || 0;
  h.spells = h.spells.filter((n) => spellOK(h, K, n) && !K.always.includes(n)).slice(0, want);
  const byLv = {};
  for (let l = 1; l <= K.maxLv; l++) byLv[l] = order(classSpells(h, l, K.maxLv)).filter((sp) => !K.always.includes(sp.name) && !h.spells.includes(sp.name));
  let guard = 0;
  while (h.spells.length < want && guard++ < 300) {
    let moved = false;
    for (let l = K.maxLv; l >= 1 && h.spells.length < want; l--) { const q = byLv[l]; if (q && q.length) { h.spells.push(q.shift().name); moved = true; } }
    if (!moved) break;
  }
  if (K.mode === 'book') {
    h.prepared = h.prepared.filter((n) => h.spells.includes(n)).slice(0, K.prepN);
    for (const n of order(h.spells.map((x) => SPELL_BY.get(x))).map((x) => x.name)) { if (h.prepared.length >= K.prepN) break; if (!h.prepared.includes(n)) h.prepared.push(n); }
  }
  if (h.cls === 'warlock') [[11, 6], [13, 7], [15, 8], [17, 9]].forEach(([at, sl]) => { if (D.lv >= at && !h.arcanum[sl]) { const o = order(classSpells(h, sl, 9)); if (o[0]) h.arcanum[sl] = o[0].name; } });
  if (hasPact(h, 'tome')) for (const sp of order(classSpells(h, 0, 0, true))) { if (h.cantrips.length >= K.cantripsN) break; if (!h.cantrips.includes(sp.name)) h.cantrips.push(sp.name); }
}
const META_ORDER = ['quickened', 'twinned', 'subtle', 'careful', 'empowered', 'extended', 'distant', 'heightened'];
const INVO_ORDER = ['agonizing', 'devilsight', 'repelling', 'armor', 'mask', 'thirsting', 'lifedrinker', 'ascendant', 'misty', 'spear', 'eldsight', 'beast', 'omen', 'mire', 'shadows', 'grave', 'whispers', 'witchsight', 'myriad', 'distant', 'leap', 'sculptor', 'dreadful', 'minions', 'vigor', 'gaze', 'runekeeper', 'thief', 'beguiling'];
// fill every open choice with a sensible default, keeping what the player already picked
function autoFill(h) {
  const R = raceOf(h), S = raceSub(h), C = CLS(h), B = bgOf(h), Q = QB[h.cls];
  const ranked = Q[3].concat(ALL_SKILLS).filter((x, i, a) => a.indexOf(x) === i);
  if (is24(h)) autoFill24(h, Q);
  if (!h.name.trim()) h.name = pickName(h);
  if (R.asiPick) { h.raceAsi = h.raceAsi.filter((a) => a !== 'cha'); for (const a of Q[1]) if (h.raceAsi.length < R.asiPick && a !== 'cha' && !h.raceAsi.includes(a)) h.raceAsi.push(a); }
  if (S && S.cantrip && !h.raceCantrip) h.raceCantrip = 'Fire Bolt';
  if (R.toolChoice && !h.tool) h.tool = R.toolChoice[0];
  let D = derive(h);
  const langN = (R.extraLang || 0) + ((S && S.extraLang) || 0);
  for (const l of LANGS) { if (h.raceLangs.length >= langN) break; if (!D.langs.has(l)) { h.raceLangs.push(l); D.langs.add(l); } }
  for (const l of LANGS) { if (h.bgLangs.length >= (B.langs || 0)) break; if (!D.langs.has(l)) { h.bgLangs.push(l); D.langs.add(l); } }
  // skills: background swaps, custom background, class, then half-elf picks
  D = derive(h);
  for (const s of D.bgDupes) { const r = ranked.find((x) => !D.skills.has(x) && !C.skills[1].includes(x)) || ranked.find((x) => !D.skills.has(x)); if (r) { h.bgSwap[s] = r; D = derive(h); } }
  while (h.bg === 'custom' && h.bgSkills.length < 2) { const r = ranked.find((x) => !D.skills.has(x) && !C.skills[1].includes(x)) || ranked.find((x) => !D.skills.has(x)); if (!r) break; h.bgSkills.push(r); D = derive(h); }
  h.skills = h.skills.filter((x) => C.skills[1].includes(x));
  while (h.skills.length < D.skN) { const r = ranked.find((x) => C.skills[1].includes(x) && !D.skills.has(x)); if (!r) break; h.skills.push(r); D = derive(h); }
  while (R.skillPick && h.raceSkills.length < R.skillPick) { const r = ranked.find((x) => !D.skills.has(x) && (!R.skillFrom || R.skillFrom.includes(x))) || (R.skillFrom || []).find((x) => !h.raceSkills.includes(x)); if (!r) break; h.raceSkills.push(r); D = derive(h); }
  while (feats24(h).some((f) => f.k === 'skilled') && (h.skilled = h.skilled || []).length < 3) { const r = ranked.find((x) => !D.skills.has(x)); if (!r) break; h.skilled.push(r); D = derive(h); }
  while (h.cls === 'bard' && D.srd && D.lv >= 3 && h.loreSkills.length < 3) { const r = ranked.find((x) => !D.skills.has(x)); if (!r) break; h.loreSkills.push(r); D = derive(h); }
  h.expertise = h.expertise.filter((x) => D.skills.has(x) || x === "Thieves' tools");
  const expPool = (h.cls === 'rogue' ? ['Stealth', "Thieves' tools"] : []).concat(ranked);
  for (const x of expPool) { if (h.expertise.length >= D.expN) break; if ((D.skills.has(x) || (x === "Thieves' tools" && h.cls === 'rogue')) && !h.expertise.includes(x)) h.expertise.push(x); }
  // class options
  const dexy = D.mod.dex > D.mod.str;
  const v24 = is24(h);
  if (C.style && D.lv >= C.style[0] && (!h.style || !C.style[1].includes(h.style))) h.style = h.cls === 'ranger' || (h.cls === 'fighter' && dexy) ? 'archery' : 'defense';
  if (h.cls === 'fighter' && D.srd && D.lv >= (v24 ? 7 : 10) && !h.style2) h.style2 = h.style === 'defense' ? (dexy ? 'archery' : 'gwf') : 'defense';
  if (h.cls === 'sorcerer') { const n = metaN(h, D.lv), MM = metaTab(h); h.metamagic = h.metamagic.filter((k) => MM[k]); for (const k of v24 ? META_ORDER24 : META_ORDER) { if (h.metamagic.length >= n) break; if (!h.metamagic.includes(k)) h.metamagic.push(k); } }
  if (h.cls === 'warlock') {
    if (!v24 && D.lv >= 3 && !h.pact) h.pact = 'blade';
    h.invocations = h.invocations.filter((k) => invoOk(h, k, D.lv));
    for (const k of v24 ? INVO_ORDER24 : INVO_ORDER) { if (h.invocations.length >= (D.invN || 0)) break; if (h.invocations.includes(k) || !invoOk(h, k, D.lv)) continue; h.invocations.push(k); }
  }
  if (v24) {
    if (h.cls === 'cleric' && !['protector', 'thaumaturge'].includes(h.order)) h.order = D.mod.wis >= D.mod.str ? 'thaumaturge' : 'protector';
    if (h.cls === 'druid' && !['magician', 'warden'].includes(h.order)) h.order = 'magician';
    if ((h.cls === 'cleric' || h.cls === 'druid') && D.lv >= 7 && !h.strike7) h.strike7 = 'potent';
    if (h.cls === 'druid' && !LANDS24.includes(h.land24)) h.land24 = 'Temperate';
    if (D.lv >= BOON_LV && !EPIC_BOONS[h.boon]) h.boon = C.cast ? 'recall' : 'combat';
    if (D.lv >= BOON_LV && !boonAb(h)) h.boonAb = Q[1].find((a) => boonAbs(h.boon).includes(a)) || boonAbs(h.boon)[0];
  }
  for (const at of asiLevels(C).filter((x) => x <= D.lv)) {
    const c = Object.assign({}, h.asi[at]);
    for (const slot of ['a', 'b']) { if (c[slot]) continue; h.asi[at] = c; const cur = derive(h).sc; c[slot] = Q[1].find((a) => cur[a] < 20) || Q[1][0]; }
    h.asi[at] = c;
  }
  // kit
  if (h.goldMode === 'kit') C.kit.forEach((grp, g) => { const o = grp[Math.min(h.kit[g] || 0, grp.length - 1)]; o.i.forEach((tok, j) => { const k = g + '.' + j; if (!tok.startsWith('@') || h.picks[k]) return; h.picks[k] = tok === '@simple' ? (dexy ? 'Shortbow' : 'Spear') : tok === '@simpleMelee' ? (dexy ? 'Dagger' : 'Mace') : KIT_DEFAULT[tok]; }); });
  if (h.goldMode === 'gold' && !h.goldRoll && !v24) { const [n, d, m] = C.gold; h.goldRoll = rollExpr(n + 'd' + d).total * m; }
  autoSpells(h);
}
function pickName(h) {
  const rn = { dwarf: 'Dwarf', elf: 'Elf', halfling: 'Halfling', human: 'Human', dragonborn: 'Dragonborn', gnome: 'Gnome', halfelf: 'Half-elf', halforc: 'Half-orc', tiefling: 'Tiefling' }[h.race];
  const F = FIRST[rn] || FIRST.Human, Sn = SURN[rn] || SURN.Human;
  const list = F[h.fem ? 1 : 0];
  const first = list[Math.floor(Math.random() * list.length)];
  const last = Sn[Math.floor(Math.random() * Sn.length)];
  return (first + (last ? ' ' + last : '')).trim();
}
function rollPersona(h, only) {
  const r = (a) => a[Math.floor(Math.random() * a.length)];
  if (!only || only === 'trait') h.trait = r(TRAITS);
  if (!only || only === 'ideal') h.ideal = r(IDEALS);
  if (!only || only === 'flaw') h.flaw = r(FLAWS);
  if (!only || only === 'bond') rollBond(h);
}
const BOND_KINDS = [['mentor', 'learned everything from', 'Mentor'], ['debt', 'owes a debt to', 'Debt'], ['sibling', 'is the sibling of', 'Sibling'], ['rival', 'has a bitter rivalry with', 'Rival'], ['sweetheart', 'left a sweetheart behind:', 'Sweetheart'], ['saved', 'once saved the life of', 'Saved'], ['oath', 'swore an oath to protect', 'Oath']];
const BOND_GENERIC = ['Wants to make a name worthy of a song.', 'Owes their life to a stranger they have never been able to thank.', 'Searches for the sibling who vanished on the old road.', 'Carries a sealed letter they promised never to open.', 'Swore to repay the village that took them in after the fire.', 'Hunts the bandit who burned their family home.', 'Keeps a lock of hair from a sweetheart who waits for them.', 'Protects an old book that someone powerful wants back.', 'Will do anything for the mentor who taught them everything.', 'Seeks a cure for a parent\'s wasting sickness.', 'Owes a fortune to a moneylender who is patient, for now.', 'Is the last keeper of their family\'s fading name.', 'Made a promise at a deathbed and means to keep it.', 'Wants to prove the people who doubted them wrong.', 'Guards a map to a place they have only seen in dreams.', 'Left a rival behind who still wants a rematch.'];
const bondResidents = (s) => (s ? residents(s).filter((p) => p.group !== 'adventurer' && (p.status || 'Alive') === 'Alive') : []);
function rollBond(h) {
  const s = h.home ? SBY.get(h.home) : null;
  const pool = bondResidents(s);
  if (!pool.length) {
    const opts = BOND_GENERIC.filter((b) => b !== h.bond);
    h.bondNpc = null; h.bond = opts[Math.floor(Math.random() * opts.length)]; return;
  }
  for (let tries = 0; tries < 12; tries++) {
    const p = pool[Math.floor(Math.random() * pool.length)];
    const k = BOND_KINDS[Math.floor(Math.random() * BOND_KINDS.length)];
    if (p.id === h.bondNpc && k[0] === h.bondKind && tries < 11) continue;
    h.bondNpc = p.id; h.bondKind = k[0]; h.bond = ''; return;
  }
}
// a new hometown takes the bond with it unless the person lives there too
function homeChanged(h) { const p = h.bondNpc ? npcById(h.bondNpc) : null; if (!p || p.sid !== h.home) rollBond(h); }
function quickBuild(h, cls) {
  const k = cls || CLASS_KEYS[Math.floor(Math.random() * CLASS_KEYS.length)];
  const Q = QB[k], R0 = RACES5[Q[0][0]];
  void R0;
  const keepName = h.name, keepLv = h.level, keepHome = h.home, keepRules = h.rules;
  Object.assign(h, newHero(true), { id: h.id, name: keepName, level: keepLv, home: keepHome, rules: keepRules || heroes.defRules || '2014' });
  h.cls = k; h.race = Q[0][Math.floor(Math.random() * 2)]; h.bg = Q[2]; h.fem = Math.random() < 0.5;
  if (is24(h)) { if (!RACES24[h.race]) h.race = h.race === 'halforc' ? 'orc' : h.race === 'halfelf' ? 'human' : 'human'; if (!BGS24[h.bg]) h.bg = BG24_FOR[k] || 'sage'; }
  h.method = 'array'; h.base = {}; Q[1].forEach((a, i) => { h.base[a] = STD_ARRAY[i]; });
  h.dragon = ['red', 'blue', 'gold', 'silver', 'green', 'white', 'black', 'bronze'][Math.floor(Math.random() * 8)];
  if (k === 'cleric') h.kit[1] = 2;
  if (k === 'wizard') h.kit[0] = 1;
  const R = raceOf(h);
  h.age = Math.round(R.age[0] + Math.random() * (R.age[1] - R.age[0]) * 0.3);
  autoFill(h);
  rollPersona(h);
}

// ---------------------------------------------------------------- panel
const HERO_STEPS = [['sheet', 'Sheet'], ['basics', 'Basics'], ['scores', 'Scores'], ['class', 'Class'], ['gear', 'Gear'], ['spells', 'Spells'], ['story', 'Story']];
function heroPanel() {
  if (heroes.step === 'chron') return chronPanel();
  const h = curHero();
  if (!h) return heroWelcome() + partyHtml();
  const D = derive(h);
  const steps = HERO_STEPS.filter(([k]) => k !== 'spells' || CLS(h).cast || D.raceSpells.length);
  if (!steps.some((s) => s[0] === heroes.step)) heroes.step = 'sheet';
  const S = SBY.get(h.home);
  let html = '<div class="mk-head"><div><div class="eyebrow">Heroes · Level ' + D.lv + ' ' + esc(raceName(h)) + ' ' + esc(CLS(h).name) + '</div><h2>' + esc(h.name || 'Unnamed hero') + '</h2></div>' + CLOSE_BTN + '</div>';
  html += '<div class="hero-bar"><select id="hc-pick" aria-label="Choose hero">' + heroes.list.map((x) => '<option value="' + esc(x.id) + '"' + (x.id === h.id ? ' selected' : '') + '>' + esc((x.name || 'Unnamed') + ' · ' + CLASSES5[x.cls].name + ' ' + x.level) + '</option>').join('') + '</select><button type="button" class="btn sm" data-hr="new">+ New</button><button type="button" class="btn sm" data-hr="quick">Quick build</button><button type="button" class="btn sm" data-hr="step" data-v="chron">Chronicle</button></div>';
  html += '<div class="seg mk-tabs hsteps" role="tablist">' + steps.map(([k, l]) => { const n = D.todo.filter((t) => t.step === k).length; return '<button type="button" role="tab" data-hr="step" data-v="' + k + '" aria-pressed="' + (heroes.step === k) + '">' + l + (n ? '<i class="dotn">' + n + '</i>' : '') + '</button>'; }).join('') + '</div>';
  if (heroes.step !== 'sheet') html += readyBox(D, true);
  let body = '';
  if (heroes.step === 'basics') body = stepBasics(h, D);
  else if (heroes.step === 'scores') body = stepScores(h, D);
  else if (heroes.step === 'class') body = stepClass(h, D);
  else if (heroes.step === 'gear') body = stepGear(h, D);
  else if (heroes.step === 'spells') body = stepSpells(h, D);
  else if (heroes.step === 'story') body = stepStory(h, D, S);
  else body = heroSheet(h, D, S) + partyHtml();
  const idx = steps.findIndex((s) => s[0] === heroes.step);
  if (heroes.step !== 'sheet') body += '<div class="actions step-nav">' + (idx > 1 ? '<button type="button" class="btn" data-hr="step" data-v="' + steps[idx - 1][0] + '">‹ ' + steps[idx - 1][1] + '</button>' : '') + (idx < steps.length - 1 ? '<button type="button" class="btn primary" data-hr="step" data-v="' + steps[idx + 1][0] + '">' + steps[idx + 1][1] + ' ›</button>' : '<button type="button" class="btn primary" data-hr="step" data-v="sheet">Open the sheet ›</button>') + '</div>';
  return html + '<div class="mk-body hero-body">' + body + '</div>';
}
function readyBox(D, compact) {
  if (D.ready) return compact ? '' : '<p class="ready ok">✓ Ready to play</p>';
  return '<details class="ready"' + (compact ? '' : ' open') + '><summary><b>' + D.todo.length + ' choice' + (D.todo.length > 1 ? 's' : '') + ' left</b> before this hero is ready to play</summary><ul>' + D.todo.map((t) => '<li><button type="button" class="link" data-hr="step" data-v="' + t.step + '">' + esc(t.text) + '</button></li>').join('') + '</ul><div class="actions"><button type="button" class="btn sm" data-hr="fill">Fill in the rest for me</button></div></details>';
}
function heroWelcome() {
  return '<div class="mk-head"><div><div class="eyebrow">Heroes</div><h2>Create a character</h2></div>' + CLOSE_BTN + '</div>' +
    '<div class="mk-body hero-body"><p>Build a Dungeons &amp; Dragons 5th edition character step by step, then play straight from the sheet: tap any score, skill or attack to roll it, track hit points, spell slots and rests, and level up as you go.</p>' +
    '<ol class="howto"><li><b>Basics.</b> Name, race, class, background and hometown on this map.</li><li><b>Scores.</b> Strength, Dexterity and the rest, using the standard array, point buy or dice.</li><li><b>Class.</b> Skills and the special choices your class gets.</li><li><b>Gear.</b> Starting kit, or gold to spend at your hometown\'s market.</li><li><b>Spells,</b> if your class casts them.</li><li><b>Story.</b> Personality, and a bond with someone who really lives in your hometown.</li></ol>' +
    '<div class="actions"><button type="button" class="btn primary" data-hr="new">Create a hero</button><button type="button" class="btn" data-hr="quick">Quick build for me</button><button type="button" class="btn" data-hr="step" data-v="chron">Party chronicle</button></div>' +
    '<p class="hint">New to D&amp;D? Quick build makes a sensible, complete level 1 character you can tweak. Fighter, barbarian and cleric are the easiest classes to start with. Rules are from the System Reference Document 5.1.</p></div>';
}
const chip = (act, v, label, on, extra) => '<button type="button" class="chip' + (on ? ' on' : '') + '" data-hr="' + act + '" data-v="' + esc(v) + '" aria-pressed="' + !!on + '"' + (extra || '') + '>' + label + '</button>';
const fieldSel = (id, label, opts, cur) => '<div class="field"><label class="lab" for="' + id + '">' + label + '</label><select id="' + id + '">' + opts.map(([v, l]) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select></div>';
function stepBasics(h, D) {
  const R = raceOf(h), S = raceSub(h), C = CLS(h), B = bgOf(h);
  const home = h.home ? SBY.get(h.home) : null;
  let o = rulesNoteHtml(h) + '<div class="row2"><div class="field"><label class="lab" for="hc-name">Name</label><div class="inrow"><input id="hc-name" value="' + esc(h.name) + '" maxlength="50" placeholder="Name your hero"><button type="button" class="btn sm" data-hr="rname" title="Suggest a name">↻</button></div></div>' +
    fieldSel('hc-level', 'Level', Array.from({ length: 20 }, (_, i) => [i + 1, 'Level ' + (i + 1)]), h.level) + '</div>';
  o += '<div class="row2">' + fieldSel('hc-align', 'Alignment', ALIGN.map((a) => [a, a]), h.align) + '<div class="field"><label class="lab" for="hc-age">Age</label><input id="hc-age" type="number" min="1" max="999" value="' + h.age + '"></div></div>';
  // hometown
  o += '<section><h3>Hometown</h3>' + (home ? '<p>' + tLink(home) + ' <small class="meta">' + TIERS[home.tier].name + ' · ' + fmtInt(home.pop) + ' people</small></p>' : '<p class="meta">Where your hero grew up. You will shop at its market prices, and your bond ties you to someone who lives there.</p>') +
    '<div class="actions"><button type="button" class="btn sm' + (heroes.pickHome ? ' primary' : '') + '" data-hr="pickhome">' + (heroes.pickHome ? 'Now tap a settlement on the map…' : 'Choose on the map') + '</button>' + (market.sid && market.sid !== h.home && SBY.get(market.sid) ? '<button type="button" class="btn sm" data-hr="sethome" data-v="' + esc(market.sid) + '">Use ' + esc(SBY.get(market.sid).name) + '</button>' : '') + '</div></section>';
  // race
  const RT = raceTable(h);
  o += '<section><h3>' + (is24(h) ? 'Species' : 'Race') + '</h3><div class="chips">' + Object.keys(RT).map((k) => chip('race', k, RT[k].name, h.race === k)).join('') + '</div>';
  if (R.subs && Object.keys(R.subs).length > 1) { const cur = Object.keys(R.subs).find((k) => R.subs[k] === S); o += '<div class="chips subs">' + Object.keys(R.subs).map((k) => chip('sub', k, esc(R.subs[k].name.charAt(0).toUpperCase() + R.subs[k].name.slice(1)) + (R.subs[k].phb ? ' <small>PHB</small>' : ''), cur === k)).join('') + '</div>'; }
  o += '<p class="meta">' + esc(R.blurb) + ' ' + (is24(h) ? srdLink() : extLink(AID.race(h.race), 'Full race rules')) + '</p>' + (S && S.phb ? '<p class="small">' + esc(S.name.charAt(0).toUpperCase() + S.name.slice(1)) + ' is from the Player\'s Handbook rather than the free SRD; its traits here are short summaries.</p>' : '') + '<p class="small"><b>' + (is24(h) ? 'No ability increases from species' : '') + ABIL.filter((a) => R.asi[a] || (S && S.asi && S.asi[a])).map((a) => ABIL_S[a] + ' +' + ((R.asi[a] || 0) + ((S && S.asi && S.asi[a]) || 0))).join(', ') + '</b>' + (R.asiPick ? ', +1 to two others' : '') + ' · speed ' + ((S && S.speed) || R.speed) + ' ft · ' + R.size + (D.dark ? ' · darkvision ' + D.dark + ' ft' : '') + (S ? ' · ' + esc(S.name) : '') + '</p>';
  if (R.asiPick) o += '<div class="field"><span class="lab">+1 to two abilities</span><div class="chips">' + ABIL.filter((a) => a !== 'cha').map((a) => chip('rasi', a, ABIL_S[a], h.raceAsi.includes(a))).join('') + '</div></div>';
  if (R.skillPick) o += '<div class="field"><span class="lab">' + (R.skillPick === 1 ? 'One skill' : 'Two skills') + ' (' + h.raceSkills.length + '/' + R.skillPick + ')</span><div class="chips">' + (R.skillFrom || ALL_SKILLS).map((s) => chip('rskill', s, s, h.raceSkills.includes(s))).join('') + '</div></div>';
  if (R.dragon) o += fieldSel('hc-dragon', 'Draconic ancestry', Object.keys(DRAGONS).map((k) => [k, DRAGONS[k][0] + ' (' + DRAGONS[k][1] + ', ' + DRAGONS[k][2] + ')']), h.dragon);
  if (R.toolChoice) o += fieldSel('hc-tool', 'Tool proficiency', [['', 'Choose…']].concat(R.toolChoice.map((t) => [t, t])), h.tool);
  if (S && S.cantrip) o += fieldSel('hc-rcantrip', 'Wizard cantrip', [['', 'Choose…']].concat(SPELLS.filter((s) => s.lv === 0 && s.cls.includes('w')).map((s) => [s.name, s.name])), h.raceCantrip);
  const langN = (R.extraLang || 0) + ((S && S.extraLang) || 0);
  if (langN) o += '<div class="field"><span class="lab">Extra language' + (langN > 1 ? 's' : '') + ' (' + h.raceLangs.length + '/' + langN + ')</span><div class="chips">' + LANGS.filter((l) => !R.langs.includes(l)).map((l) => chip('rlang', l, l, h.raceLangs.includes(l))).join('') + '</div></div>';
  o += '</section>';
  // class
  o += '<section><h3>Class</h3><div class="chips">' + CLASS_KEYS.map((k) => chip('cls', k, CLASSES5[k].name, h.cls === k)).join('') + '</div><p class="meta">' + esc(C.blurb) + ' ' + extLink(AID.cls(h.cls), 'Full class rules') + '</p>' +
    '<p class="small">Hit die d' + C.hd + ' · best scores ' + C.prime.map((a) => ABIL_N[a]).join(' and ') + ' · saves ' + C.saves.map((a) => ABIL_S[a]).join(', ') + ' · ' + esc(D.subName) + ' from level ' + subLv(h, C) + '</p></section>';
  // background
  const BT = bgTable(h);
  o += '<section><h3>Background</h3><div class="chips">' + Object.keys(BT).map((k) => chip('bg', k, BT[k].name, h.bg === k)).join('') + '</div><p class="meta">' + esc(B.blurb) + ' ' + (is24(h) ? srdLink() : extLink(AID.bg(h.bg), 'Backgrounds on AideDD')) + '</p>' +
    (B.skills.length ? '<p class="small">' + (B.abil ? 'Raises ' + B.abil.map((a) => ABIL_S[a]).join(', ') + ' · ' : '') + 'Skills: ' + B.skills.join(', ') + (B.tools && B.tools.length ? ' · tools: ' + B.tools.join(', ') : '') + ' · ' + B.gold + ' gp' + (B.org && home && home.tier >= ORGS[B.org].min ? ' · ties to ' + oLink(B.org, home.id) : '') + '</p>' : '');
  for (const s of (h.bg === 'custom' ? [] : B.skills)) { const raceHas = (R.skills || []).includes(s) || (R.skillPick && h.raceSkills.includes(s)); if (raceHas) o += fieldSel('hc-swap-' + s.replace(/\W/g, ''), s + ' is already a race skill: replace it with', [['', 'Choose…']].concat(ALL_SKILLS.filter((x) => !D.skills.has(x) || h.bgSwap[s] === x).map((x) => [x, x])), h.bgSwap[s] || ''); }
  if (h.bg === 'custom') o += '<div class="field"><span class="lab">Two skills (' + h.bgSkills.length + '/2)</span><div class="chips">' + ALL_SKILLS.map((s) => chip('bskill', s, s, h.bgSkills.includes(s))).join('') + '</div></div>';
  o += basics24Html(h, D);
  if (B.langs) o += '<div class="field"><span class="lab">Languages (' + h.bgLangs.length + '/' + B.langs + ')</span><div class="chips">' + LANGS.filter((l) => !D.langs.has(l) || h.bgLangs.includes(l)).map((l) => chip('blang', l, l, h.bgLangs.includes(l))).join('') + '</div></div>';
  o += '</section>';
  return o;
}
function stepScores(h, D) {
  const R = raceOf(h), S = raceSub(h);
  let o = '<p class="meta">Six abilities describe your hero. Each score gives a modifier (10–11 is +0, every 2 points above adds +1) that is added to rolls. Put your highest numbers in ' + CLS(h).prime.map((a) => ABIL_N[a]).join(' and ') + '.</p>';
  o += '<div class="seg" role="group">' + [['array', 'Standard array'], ['point', 'Point buy'], ['roll', 'Roll 4d6'], ['manual', 'Manual']].map(([k, l]) => '<button type="button" data-hr="method" data-v="' + k + '" aria-pressed="' + (h.method === k) + '">' + l + '</button>').join('') + '</div>';
  if (h.method === 'array') o += '<p class="small">Use 15, 14, 13, 12, 10 and 8 once each. Choosing a number already used swaps the two.</p>';
  if (h.method === 'point') { const spent = ABIL.reduce((a, k) => a + (POINT_COST[h.base[k]] || 0), 0); o += '<p class="small">Spend 27 points; scores run 8–15 and cost more near the top. <b>' + (27 - spent) + ' left.</b></p>'; }
  if (h.method === 'roll') o += '<p class="small">Roll four six-sided dice and drop the lowest, six times. ' + (h.rolls ? 'Your rolls: <b>' + h.rolls.join(', ') + '</b>.' : '') + ' <button type="button" class="btn sm" data-hr="rollstats">' + (h.rolls ? 'Roll again' : 'Roll') + '</button></p>';
  const pool = h.method === 'array' ? STD_ARRAY : h.method === 'roll' && h.rolls ? h.rolls.slice().sort((a, b) => b - a) : null;
  o += '<table class="scores"><thead><tr><th>Ability</th><th>Base</th><th>' + (is24(h) ? 'Background' : 'Race') + '</th><th>Other</th><th>Score</th><th>Mod</th></tr></thead><tbody>';
  for (const a of ABIL) {
    const race = originAsi(h)[a] || 0;
    const other = D.sc[a] - h.base[a] - race;
    let base;
    if (pool) base = '<select data-hbase="' + a + '" aria-label="' + ABIL_N[a] + ' base">' + pool.map((v, i) => '<option value="' + i + ':' + v + '"' + (v === h.base[a] ? ' selected' : '') + '>' + v + '</option>').join('') + '</select>';
    else if (h.method === 'point') base = '<span class="pbuy"><button type="button" class="btn sm" data-hr="pt" data-v="' + a + '|-1" aria-label="Lower ' + ABIL_N[a] + '"' + (h.base[a] <= 8 ? ' disabled' : '') + '>−</button><b>' + h.base[a] + '</b><button type="button" class="btn sm" data-hr="pt" data-v="' + a + '|1" aria-label="Raise ' + ABIL_N[a] + '"' + (h.base[a] >= 15 ? ' disabled' : '') + '>+</button></span>';
    else base = '<input type="number" min="3" max="20" data-hbase="' + a + '" value="' + h.base[a] + '" aria-label="' + ABIL_N[a] + ' base">';
    o += '<tr><th scope="row">' + ABIL_N[a] + (CLS(h).prime.includes(a) ? ' <i class="star" title="Important for your class">★</i>' : '') + '</th><td>' + base + '</td><td>' + (race ? '+' + race : '—') + '</td><td>' + (other ? sgn(other) : '—') + '</td><td><b>' + D.sc[a] + '</b></td><td><b class="modv">' + sgn(D.mod[a]) + '</b></td></tr>';
  }
  o += '</tbody></table>';
  return o;
}
function stepClass(h, D) {
  const C = CLS(h), lv = D.lv;
  const fixed = new Set([].concat(raceOf(h).skills || [], raceOf(h).skillPick ? h.raceSkills : [], D.bgSkills));
  const subs = subsOf(h);
  let o = '<section><h3>' + esc(C.sub[0]) + ' <small class="meta">from level ' + subLv(h, C) + '</small></h3>' + fieldSel('hc-subclass', 'Subclass', subs.map((n) => [n, n + (n === C.sub[1] ? ' (built in)' : ' (Player\'s Handbook)')]), D.subName) +
    (D.srd ? '<p class="small">' + esc(C.sub[1]) + ' is in the free SRD, so all its features are built into the sheet.</p>' : '<p class="small">' + esc(h.subclass) + ' is not in the free SRD. Read its features on ' + extLink(AID.cls(h.cls), 'AideDD: ' + C.name) + ' and list the ones you have, one per line, like <i>3: Combat Superiority: four d8 superiority dice</i>. They show on your sheet.</p><div class="field"><label class="lab" for="hc-subnotes">' + esc(h.subclass) + ' features</label><textarea id="hc-subnotes" rows="4" maxlength="3000" placeholder="3: Feature name: what it does">' + esc(h.subNotes || '') + '</textarea></div>') + '</section>';
  o += '<section><h3>' + C.name + ' skills (' + h.skills.length + '/' + D.skN + ')</h3><p class="small">Skills you already get from your race or background are greyed out.</p><div class="chips">' +
    C.skills[1].map((s) => chip('skill', s, s, h.skills.includes(s), fixed.has(s) && !h.skills.includes(s) ? ' disabled' : '')).join('') + '</div></section>';
  if (h.cls === 'bard' && D.srd && lv >= 3) o += '<section><h3>College of Lore skills (' + h.loreSkills.length + '/3)</h3><div class="chips">' + ALL_SKILLS.map((s) => chip('lskill', s, s, h.loreSkills.includes(s), D.skills.has(s) && !h.loreSkills.includes(s) ? ' disabled' : '')).join('') + '</div></section>';
  if (D.expN) o += '<section><h3>Expertise (' + D.expertise.size + '/' + D.expN + ')</h3><p class="small">Double your proficiency bonus with these.</p><div class="chips">' + [...D.skills].concat(h.cls === 'rogue' ? ["Thieves' tools"] : []).map((s) => chip('exp', s, s, D.expertise.has(s))).join('') + '</div></section>';
  if (C.style && lv >= C.style[0]) {
    const ST = styleTab(h);
    o += '<section><h3>Fighting style</h3><div class="opts">' + C.style[1].map((k) => '<button type="button" class="opt' + (h.style === k ? ' on' : '') + '" data-hr="style" data-v="' + k + '"><b>' + ST[k][0] + '</b><small>' + ST[k][1] + '</small></button>').join('') + '</div>';
    if (h.cls === 'fighter' && D.srd && lv >= (is24(h) ? 7 : 10)) o += '<h4>Second style</h4><div class="opts">' + C.style[1].filter((k) => k !== h.style).map((k) => '<button type="button" class="opt' + (h.style2 === k ? ' on' : '') + '" data-hr="style2" data-v="' + k + '"><b>' + ST[k][0] + '</b><small>' + ST[k][1] + '</small></button>').join('') + '</div>';
    o += '</section>';
  }
  if (h.cls === 'ranger' && !is24(h)) o += '<div class="row2">' + fieldSel('hc-favored', 'Favoured enemy', FAVORED.map((f) => [f, f]), h.favored) + fieldSel('hc-terrain', 'Favoured terrain', TERRAINS.map((t) => [t, t]), h.terrain) + '</div>';
  if (h.cls === 'druid' && D.srd && lv >= 2 && !is24(h)) o += fieldSel('hc-land', 'Circle of the Land: your land', TERRAINS.map((t) => [t, t]), h.land);
  if (h.cls === 'sorcerer' && D.srd) o += fieldSel('hc-dragon', 'Dragon ancestor', Object.keys(DRAGONS).map((k) => [k, DRAGONS[k][0] + ' (' + DRAGONS[k][1] + ')']), h.dragon);
  if (h.cls === 'sorcerer' && metaN(h, lv)) { const n = metaN(h, lv), MM = metaTab(h); o += '<section><h3>Metamagic (' + h.metamagic.filter((k) => MM[k]).length + '/' + n + ')</h3><div class="opts">' + Object.keys(MM).map((k) => '<button type="button" class="opt' + (h.metamagic.includes(k) ? ' on' : '') + '" data-hr="meta" data-v="' + k + '"><b>' + MM[k][0] + '</b><small>' + MM[k][1] + '</small></button>').join('') + '</div></section>'; }
  if (is24(h)) o += class24Html(h, D);
  if (h.cls === 'warlock' && lv >= 3 && !is24(h)) o += '<section><h3>Pact boon</h3><div class="opts">' + [['chain', 'Pact of the Chain', 'A clever familiar (imp, pseudodragon, quasit or sprite).'], ['blade', 'Pact of the Blade', 'Summon a magic melee weapon you are proficient with.'], ['tome', 'Pact of the Tome', 'Three extra cantrips from any class.']].map(([k, n, d]) => '<button type="button" class="opt' + (h.pact === k ? ' on' : '') + '" data-hr="pact" data-v="' + k + '"><b>' + n + '</b><small>' + d + '</small></button>').join('') + '</div></section>';
  if (h.cls === 'warlock' && D.invN) { const IV = invoTab(h), NEED = { pblade: 'Pact of the Blade', pchain: 'Pact of the Chain', ptome: 'Pact of the Tome', thirsting: 'Thirsting Blade', blade: 'Pact of the Blade', chain: 'Pact of the Chain', tome: 'Pact of the Tome' };
    o += '<section><h3>Eldritch invocations (' + h.invocations.filter((k) => IV[k]).length + '/' + D.invN + ')</h3><p class="small">' + (is24(h) ? 'The 2024 set: the pact boons are invocations too. ' : 'The SRD set. ') + extLink(AID.invocations, 'Every invocation on AideDD') + '</p><div class="opts">' + Object.keys(IV).filter((k) => IV[k][2] <= lv).map((k) => { const I = IV[k]; const need = I[3] && I[3] !== 'eb' ? I[3] : null; const bad = !invoOk(h, k, lv); return '<button type="button" class="opt' + (h.invocations.includes(k) ? ' on' : '') + '" data-hr="invo" data-v="' + k + '"' + (bad && !h.invocations.includes(k) ? ' disabled' : '') + '><b>' + I[0] + '</b><small>' + I[1] + (need ? ' Needs ' + NEED[need] + '.' : I[3] === 'eb' ? ' Needs eldritch blast.' : '') + (I[2] > 1 ? ' Level ' + I[2] + '+.' : '') + '</small></button>'; }).join('') + '</div></section>'; }
  // ability score improvements
  const at = asiLevels(C).filter((x) => x <= lv);
  if (at.length) {
    o += '<section><h3>Ability score improvements</h3><p class="small">At each of these levels add +1 to two abilities, or +2 to one (pick it twice). Scores can\'t go above 20. Using the optional feat rule instead? Browse ' + extLink(AID.feats, 'feats on AideDD') + ' and note it in your story.</p>';
    for (const l of at) { const c = h.asi[l] || {}; o += '<div class="row2 asi"><span class="lab">Level ' + l + '</span>' + ['a', 'b'].map((s) => '<select data-hasi="' + l + '|' + s + '" aria-label="Level ' + l + ' increase ' + (s === 'a' ? 'one' : 'two') + '"><option value="">Choose…</option>' + ABIL.map((a) => '<option value="' + a + '"' + (c[s] === a ? ' selected' : '') + '>+1 ' + ABIL_N[a] + '</option>').join('') + '</select>').join('') + '</div>'; }
    o += '</section>';
  }
  // features by level
  o += '<section><h3>What you can do</h3><ul class="feats">' + D.feats.filter((f) => f.at).map((f) => '<li><b>' + esc(f.n) + '</b> <small class="meta">' + esc(f.src) + '</small><p>' + esc(f.d) + '</p></li>').join('') + '</ul>';
  const next = C.feats.concat(lv >= subLv(h, C) - 1 && (D.srd || (is24(h) && lv === 2 && (!h.subclass || h.subclass === C.sub[1]))) ? C.subFeats.filter(([l]) => l >= subLv(h, C)) : []).filter(([l]) => l === lv + 1);
  if (lv < 20) o += '<p class="small"><b>At level ' + (lv + 1) + ':</b> ' + (next.length ? next.map((f) => esc(f[1])).join(', ') : 'more hit points') + (asiLevels(C).includes(lv + 1) ? ', ability score improvement' : '') + (lv + 1 === subLv(h, C) ? ', ' + esc(C.sub[1]) : '') + '.</p>';
  return o + '</section>';
}
function stepGear(h, D) {
  const C = CLS(h), B = bgOf(h);
  const home = h.home ? SBY.get(h.home) : null;
  let o = '<div class="seg" role="group">' + [['kit', 'Starting kit'], ['gold', 'Starting gold']].map(([k, l]) => '<button type="button" data-hr="goldmode" data-v="' + k + '" aria-pressed="' + (h.goldMode === k) + '">' + l + '</button>').join('') + '</div>';
  if (h.goldMode === 'kit') {
    o += '<p class="small">' + (is24(h) ? 'Your class kit and ' + kitGp24(h) + ' gp, plus your background\'s gear and ' + B.gold + ' gp (2024 rules).' : 'Your class kit plus your background\'s gear and ' + B.gold + ' gp.') + '</p>';
    C.kit.forEach((grp, g) => {
      const cur = Math.min(h.kit[g] || 0, grp.length - 1);
      o += '<div class="kitg">' + (grp.length > 1 ? grp.map((op, i) => chip('kit', g + '|' + i, esc(op.l), cur === i)).join('<span class="or">or</span>') : '<span class="chip on static">' + esc(grp[0].l) + '</span>');
      grp[cur].i.forEach((tok, j) => { if (tok.startsWith('@')) o += '<select data-hpick="' + g + '.' + j + '" aria-label="' + PICKS[tok][0] + '"><option value="">Pick ' + PICKS[tok][0] + '…</option>' + PICKS[tok][1].map((n) => { const w = ITEM.get(n); return '<option' + (h.picks[g + '.' + j] === n ? ' selected' : '') + ' value="' + esc(n) + '">' + esc(n) + (w && w.dmg ? ' (' + w.dmg + ' ' + w.type + ')' : '') + '</option>'; }).join('') + '</select>'; });
      o += '</div>';
    });
  } else if (is24(h)) {
    o += '<p class="small">Instead of the class and background kits, take ' + (C.goldB || 0) + ' gp from your class and 50 gp from your background, and buy what you want' + (home ? ' at ' + tLink(home) + '\'s prices' : '') + '.</p><p><b class="big">' + money((C.goldB || 0) + 50) + '</b></p>';
  } else {
    const [n, d, m] = C.gold;
    o += '<p class="small">Instead of the class and background kits, roll ' + n + 'd' + d + (m > 1 ? ' × ' + m : '') + ' gp and buy what you want' + (home ? ' at ' + tLink(home) + '\'s prices' : '') + '.</p><p><b class="big">' + (h.goldRoll ? money(h.goldRoll) : '—') + '</b> <button type="button" class="btn sm" data-hr="rollgold">' + (h.goldRoll ? 'Roll again' : 'Roll gold') + '</button></p>';
  }
  // inventory
  const inv = D.inv;
  o += '<section><h3>Inventory</h3><ul class="inv">' + (inv.length ? inv.map((x) => {
    const it = ITEM.get(x.n);
    const info = it ? (it.kind === 'weapon' ? it.dmg + ' ' + it.type : it.kind === 'armor' ? (it.type === 'shield' ? '+2 AC' : 'AC ' + it.ac + (it.type === 'light' ? ' + Dex' : it.type === 'medium' ? ' + Dex (max 2)' : '')) : it.note) : '';
    return '<li><span><b>' + esc(x.n) + (x.q > 1 ? ' ×' + x.q : '') + '</b>' + (info ? '<small>' + esc(info) + '</small>' : '') + '</span>' + (x.src === 'bought' && it ? '<button type="button" class="btn sm" data-hr="sell" data-v="' + x.i + '" title="' + (sellRate(h).by ? 'Sell for ' + Math.round(sellRate(h).r * 100) + '% of the price (' + esc(sellRate(h).by) + ')' : 'Sell for half price') + '">Sell</button>' : '') + '<button type="button" class="x sm" data-hr="rm" data-v="' + esc(x.key) + '" aria-label="Remove ' + esc(x.n) + '">×</button></li>';
  }).join('') : '<li class="meta">Nothing yet.</li>') + '</ul>';
  o += '<div class="relform"><input id="hc-item" maxlength="60" placeholder="Add any other item" aria-label="Item name"><button type="button" class="btn" data-hr="additem">Add</button></div>';
  o += '<p class="meta">Gold: <b>' + money(goldOf(h)) + '</b> <button type="button" class="btn sm" data-hr="gold" data-v="-1">−1 gp</button><button type="button" class="btn sm" data-hr="gold" data-v="1">+1 gp</button><button type="button" class="btn sm" data-hr="gold" data-v="10">+10 gp</button></p>';
  const armors = D.inv.map((x) => ITEM.get(x.n)).filter((it) => it && it.kind === 'armor' && it.type !== 'shield');
  o += '<div class="row2">' + fieldSel('hc-armor', 'Wearing', [['auto', 'Best I can wear (' + (D.armor ? D.armor.name : 'none') + ')'], ['none', 'No armour']].concat(armors.map((a) => [a.name, a.name])), h.armor) + (D.inv.some((x) => x.n === 'Shield') ? '<label class="check"><input type="checkbox" id="hc-shield"' + (h.shield ? ' checked' : '') + '><span>Carry the shield</span></label>' : '') + '</div>';
  o += '<p class="small">AC ' + D.ac + ': ' + esc(D.acNote) + '.</p></section>';
  // shop
  o += '<section><h3>Shop' + (home ? ' in ' + tLink(home) : '') + '</h3><p class="small">' + (home ? 'Prices follow ' + esc(home.name) + '\'s live market today, including wars, famine and booms. Larger towns stock more.' : 'Choose a hometown to see local prices; these are Player\'s Handbook list prices.') + '</p>';
  o += '<div class="seg" role="group">' + [['weapons', 'Weapons'], ['armor', 'Armour'], ['gear', 'Gear'], ['packs', 'Packs']].map(([k, l]) => '<button type="button" data-hr="shopcat" data-v="' + k + '" aria-pressed="' + (heroes.shopCat === k) + '">' + l + '</button>').join('') + '</div>';
  const list = heroes.shopCat === 'weapons' ? WEAPONS.filter((w) => w.dmg !== '—') : heroes.shopCat === 'armor' ? ARMORS : heroes.shopCat === 'gear' ? GEAR : Object.keys(PACKS).map((k) => ITEM.get(k));
  const gold = goldOf(h);
  o += '<table class="shop"><tbody>' + list.map((it) => {
    const p = shopPrice(h, it);
    const info = it.kind === 'weapon' ? it.dmg + ' ' + it.type + (weaponProf(D, it) ? '' : ' · not proficient') : it.kind === 'armor' ? (it.type === 'shield' ? '+2 AC' : 'AC ' + it.ac + ' · ' + it.type) + (D.armorProfs.has(it.type) ? '' : ' · not proficient') : it.note;
    return '<tr' + (p.ok ? '' : ' class="na"') + '><td><b>' + esc(it.name) + '</b>' + (info ? '<small>' + esc(info) + '</small>' : '') + '</td><td class="num">' + (p.ok ? money(p.price) + (p.disc ? '<small class="gj-disc" title="' + esc(p.by) + ' member price">−' + Math.round(p.disc * 100) + '% ' + esc(p.by) + '</small>' : '') : 'Not sold here') + '</td><td>' + (p.ok ? '<button type="button" class="btn sm" data-hr="buy" data-v="' + esc(it.name) + '"' + (p.price > gold + 1e-9 ? ' disabled title="Not enough gold"' : '') + '>Buy</button>' : '') + '</td></tr>';
  }).join('') + '</tbody></table></section>';
  return o;
}
function spellRow(s, on, act, extra, disabled, after) {
  return '<li class="sp' + (on ? ' on' : '') + '"><button type="button" class="sp-t" data-hr="' + act + '" data-v="' + esc(s.name) + '" aria-pressed="' + !!on + '"' + (disabled && !on ? ' disabled' : '') + '><i class="box" aria-hidden="true"></i><b>' + esc(s.name) + '</b>' + (s.conc ? '<em class="tag">C</em>' : '') + (s.ritual ? '<em class="tag">R</em>' : '') + (extra || '') + '</button>' + (after || '') + '<details><summary aria-label="Details of ' + esc(s.name) + '">i</summary><p class="small">' + s.school + ' · ' + esc(s.time) + ' · ' + esc(s.range) + ' · ' + esc(s.dur) + (s.conc ? ' (concentration)' : '') + '</p><p>' + esc(s.text) + '</p><p class="small">' + extLink(AID.spell(s.name), 'Full spell text') + '</p></details></li>';
}
function stepSpells(h, D) {
  const K = D.cast, C = CLS(h);
  let o = '';
  if (D.raceSpells.length) o += '<section><h3>From your race</h3><ul class="spells">' + D.raceSpells.map((r) => { const s = SPELL_BY.get(r.name); return s ? spellRow(s, true, 'noop', '<small class="meta"> ' + esc(r.note) + '</small>') : ''; }).join('') + '</ul></section>';
  if (!K) { if (C.cast) o += '<p class="meta">' + C.name + 's start casting spells at level ' + C.cast.from + '.</p>'; return o; }
  o += '<dl class="stats">' + stat('Spell save DC', K.dc) + stat('Spell attack', sgn(K.atk)) + stat('Ability', ABIL_N[K.ab]) + '</dl>';
  const how = K.mode === 'known' ? 'You know a fixed set of spells and can swap one each time you level up.' : K.mode === 'book' ? 'Your spellbook holds the spells you have learned. Each day, prepare some of them to cast.' : is24(h) && (h.cls === 'paladin' || h.cls === 'ranger') ? 'You keep a set number of ' + C.name.toLowerCase() + ' spells prepared and can swap one after each long rest.' : 'You can prepare any ' + C.name.toLowerCase() + ' spell each day after a long rest. The list below is what you have prepared.';
  o += '<p class="small">' + how + (K.type === 'pact' ? ' Your ' + K.pact + ' pact slot' + (K.pact > 1 ? 's are' : ' is') + ' ' + ordinal(K.pactLv) + ' level and come' + (K.pact > 1 ? '' : 's') + ' back on a short rest.' : '') + '</p>';
  const tome = hasPact(h, 'tome');
  // cantrips
  if (K.cantripsN) {
    const all = classSpells(h, 0, 0, tome);
    o += '<section><h3>Cantrips (' + h.cantrips.length + '/' + K.cantripsN + ')</h3><p class="small">Cast at will, as often as you like.' + (tome ? ' Pact of the Tome lets you pick from any class.' : '') + '</p><ul class="spells">' + all.map((s) => spellRow(s, h.cantrips.includes(s.name), 'cantrip', '', h.cantrips.length >= K.cantripsN)).join('') + '</ul></section>';
  }
  const cap = K.knownN || K.bookN || K.prepN;
  const label = K.mode === 'known' ? 'Spells known' : K.mode === 'book' ? 'Spellbook' : 'Prepared spells';
  const secrets = h.cls === 'bard' && K.secretsN;
  o += '<section><h3>' + label + ' (' + h.spells.length + '/' + cap + ')</h3>';
  if (K.mode === 'book') o += '<p class="small">Prepared today: <b>' + h.prepared.filter((n) => h.spells.includes(n)).length + '/' + K.prepN + '</b>. Tick the circle beside a spell in your book to prepare it.</p>';
  if (K.always.length) o += '<p class="small">Always prepared (free): ' + K.always.map((n) => esc(n)).join(', ') + '.</p>';
  if (secrets) o += '<p class="small">Magical Secrets: up to ' + K.secretsN + ' of your spells may come from any class. <label class="check inl"><input type="checkbox" id="hc-secrets"' + (heroes.showAll ? ' checked' : '') + '><span>Show every class\'s spells</span></label></p>';
  o += '<div class="seg lvls" role="group">' + [-1].concat(Array.from({ length: K.maxLv }, (_, i) => i + 1)).map((l) => '<button type="button" data-hr="splv" data-v="' + l + '" aria-pressed="' + (heroes.spellLv === l) + '">' + (l < 0 ? 'All' : ordinal(l)) + '</button>').join('') + '</div>';
  for (let l = 1; l <= K.maxLv; l++) {
    if (heroes.spellLv > 0 && heroes.spellLv !== l) continue;
    const list = classSpells(h, l, K.maxLv, secrets && heroes.showAll).filter((s) => !K.always.includes(s.name));
    if (!list.length) continue;
    o += '<h4>' + ordinal(l) + ' level <small class="meta">' + (K.slots[l - 1] ? K.slots[l - 1] + ' slot' + (K.slots[l - 1] > 1 ? 's' : '') : K.type === 'pact' ? 'pact slots' : '') + '</small></h4><ul class="spells">' + list.map((s) => {
      const on = h.spells.includes(s.name);
      const prep = K.mode === 'book' && on ? '<button type="button" class="prep' + (h.prepared.includes(s.name) ? ' on' : '') + '" data-hr="prep" data-v="' + esc(s.name) + '" aria-pressed="' + h.prepared.includes(s.name) + '" aria-label="Prepare ' + esc(s.name) + ' today" title="Prepared today">' + (h.prepared.includes(s.name) ? '●' : '○') + '</button>' : '';
      const foreign = secrets && !spellCls(h, s).includes('b') ? '<em class="tag">secret</em>' : '';
      return spellRow(s, on, 'spell', foreign, h.spells.length >= cap, prep);
    }).join('') + '</ul>';
  }
  o += '</section>';
  if (h.cls === 'warlock' && D.lv >= 11) {
    o += '<section><h3>Mystic Arcanum</h3>' + [[11, 6], [13, 7], [15, 8], [17, 9]].filter(([at]) => D.lv >= at).map(([, sl]) => fieldSel('hc-arc' + sl, ordinal(sl) + '-level spell (once per long rest)', [['', 'Choose…']].concat(SPELLS.filter((s) => s.lv === sl && spellCls(h, s).includes('k')).map((s) => [s.name, s.name])), h.arcanum[sl] || '')).join('') + '</section>';
  }
  return o;
}
function stepStory(h, D, S) {
  let o = '<p class="meta">A few lines of personality make a hero easy to roleplay. Tap ↻ to roll a new one, or write your own.</p>';
  for (const [k, l] of [['trait', 'Personality'], ['ideal', 'Ideal'], ['flaw', 'Flaw']]) o += '<div class="field"><label class="lab" for="hc-' + k + '">' + l + '</label><div class="inrow"><input id="hc-' + k + '" value="' + esc(h[k]) + '" maxlength="120"><button type="button" class="btn sm" data-hr="persona" data-v="' + k + '" title="Roll another">↻</button></div></div>';
  const pool = bondResidents(S);
  o += '<section><h3>Bond</h3><p class="small">Who or what your hero cares about most.' + (S ? ' Bonds tie you to someone who really lives in ' + esc(S.name) + '.' : ' Choose a hometown to tie your bond to a real person on the map.') + '</p>' + bondHtml(h) +
    '<div class="actions"><button type="button" class="btn sm" data-hr="persona" data-v="bond">↻ New bond</button>' + (h.bondNpc ? '<button type="button" class="btn sm" data-hr="bondown">Write my own instead</button>' : '') + '</div>';
  if (pool.length) o += '<div class="row2">' + fieldSel('hc-bondkind', 'Kind of bond', BOND_KINDS.map((k) => [k[0], k[2]]), h.bondKind || 'mentor') + fieldSel('hc-bondnpc', 'With', [['', h.bondNpc ? 'Choose…' : 'Choose a person…']].concat(pool.map((p) => [p.id, npcName(p) + ' (' + p.job + ')'])), h.bondNpc || '') + '</div>';
  if (!h.bondNpc) o += '<div class="field"><label class="lab" for="hc-bond">Your own bond</label><input id="hc-bond" value="' + esc(h.bond) + '" maxlength="120"></div>';
  o += '</section>';
  o += '<div class="field"><label class="lab" for="hc-notes">Notes and backstory</label><textarea id="hc-notes" rows="5" maxlength="4000" placeholder="Where they came from, what they want, who they hate…">' + esc(h.notes) + '</textarea></div>';
  if (S) { const B = bgOf(h); o += '<p class="small">Grew up in ' + tLink(S) + (B.org && S.tier >= ORGS[B.org].min ? '; as a ' + B.name.toLowerCase() + ' they have ties to ' + oLink(B.org, S.id) : '') + '.</p>'; }
  return o;
}
function bondHtml(h) {
  const p = h.bondNpc ? npcById(h.bondNpc) : null;
  if (!p) return '<p>' + esc(h.bond || 'No bond yet.') + '</p>';
  const k = BOND_KINDS.find((b) => b[0] === h.bondKind) || BOND_KINDS[0];
  const s = SBY.get(p.sid);
  return '<p>' + esc(h.name || 'Your hero') + ' ' + k[1] + ' ' + pLink(p) + ' <small class="meta">(' + esc(p.job) + (s ? ', ' + esc(s.name) : '') + ')</small>.</p>';
}

// ---------------------------------------------------------------- the play sheet
function heroSheet(h, D, S) {
  const C = CLS(h);
  const hp = h.hp == null ? D.hpMax : h.hp;
  const reg = heroGuildMember(h);
  let o = readyBox(D) + guildNoticeHtml(h);
  o += '<div id="hrRoll" class="rollbar" aria-live="polite">' + (heroes.log[0] ? rollCard(heroes.log[0]) : '<span class="rc-l">Tap any bonus to roll it</span>') + '</div>';
  o += '<div class="rollctl"><div class="seg" role="group" aria-label="Roll mode">' + [[-1, 'Disadvantage'], [0, 'Normal'], [1, 'Advantage']].map(([v, l]) => '<button type="button" data-hr="adv" data-v="' + v + '" aria-pressed="' + (heroes.adv === v) + '">' + l + '</button>').join('') + '</div><div class="dice">' + [4, 6, 8, 10, 12, 20, 100].map((d) => '<button type="button" data-hr="die" data-v="' + d + '">d' + d + '</button>').join('') + '</div></div>';
  // identity line
  o += '<p class="small idline">' + esc(raceName(h)) + ' ' + esc(C.name) + (D.lv >= subLv(h, C) ? ' (' + esc(D.subName) + ')' : '') + (is24(h) ? ' · 2024 rules' : '') + ' · ' + esc(bgOf(h).name) + ' · ' + esc(h.align) + (S ? ' · from ' + tLink(S) : '') + (reg ? ' · ' + rankBadge(rankOf(reg.merit || 0), true) + ' ' + (S && hallFor(S) ? oLink('adventurers', hallFor(S).id, 'Adventurers\' Guild') : 'Adventurers\' Guild') : '') + '</p>';
  // core numbers
  o += '<div class="core">' +
    '<div class="cbox"><span>Armour class</span><b>' + D.ac + '</b><small>' + esc(D.acNote) + '</small></div>' +
    '<button type="button" class="cbox" data-hr="d20" data-v="' + D.init + '|Initiative"><span>Initiative</span><b>' + sgn(D.init) + '</b><small>tap to roll</small></button>' +
    '<div class="cbox"><span>Speed</span><b>' + D.speed + '<small> ft</small></b><small>' + (D.dark ? 'darkvision ' + D.dark + ' ft' : '&nbsp;') + '</small></div>' +
    '<div class="cbox"><span>Proficiency</span><b>' + sgn(D.pb) + '</b><small>passive Perception ' + D.passive + '</small></div></div>';
  // hit points
  o += '<section class="hpbox"><div class="hp-top"><div><span class="lab">Hit points</span><b class="hpv' + (hp <= 0 ? ' down' : hp <= D.hpMax / 2 ? ' low' : '') + '">' + hp + '<small> / ' + D.hpMax + '</small></b>' + (h.temp ? '<small class="temp">+' + h.temp + ' temporary</small>' : '') + '</div>' +
    '<div class="hp-ctl"><input id="hc-hpamt" type="number" min="0" max="999" value="" placeholder="0" aria-label="Amount" inputmode="numeric"><button type="button" class="btn sm danger" data-hr="hp" data-v="-1">Damage</button><button type="button" class="btn sm" data-hr="hp" data-v="1">Heal</button><button type="button" class="btn sm" data-hr="hp" data-v="0">Temp</button></div></div>' +
    '<div class="meter hpm" aria-hidden="true"><i style="width:' + clamp(hp / D.hpMax * 100, 0, 100).toFixed(1) + '%"></i></div>';
  if (hp <= 0) o += '<div class="death"><span class="lab">Death saves</span><span>Successes ' + [0, 1, 2].map((i) => '<button type="button" class="pip' + (h.death[0] > i ? ' on' : '') + '" data-hr="death" data-v="0|' + i + '" aria-label="Success ' + (i + 1) + '"></button>').join('') + '</span><span>Failures ' + [0, 1, 2].map((i) => '<button type="button" class="pip bad' + (h.death[1] > i ? ' on' : '') + '" data-hr="death" data-v="1|' + i + '" aria-label="Failure ' + (i + 1) + '"></button>').join('') + '</span><button type="button" class="btn sm" data-hr="deathroll">Roll</button></div>';
  o += '<div class="rest"><span class="small">Hit dice: <b>' + D.hdLeft + ' / ' + D.lv + '</b> d' + D.hd + '</span><button type="button" class="btn sm" data-hr="hd"' + (D.hdLeft ? '' : ' disabled') + '>Spend a hit die</button><button type="button" class="btn sm" data-hr="short">Short rest</button><button type="button" class="btn sm primary" data-hr="long">Long rest</button></div>';
  o += '<div class="flags"><button type="button" class="chip' + (h.insp ? ' on' : '') + '" data-hr="insp" aria-pressed="' + h.insp + '">★ Inspiration</button><span class="small">Exhaustion <button type="button" class="btn sm" data-hr="exh" data-v="-1" aria-label="Less exhaustion">−</button> <b>' + h.exh + '</b> <button type="button" class="btn sm" data-hr="exh" data-v="1" aria-label="More exhaustion">+</button>' + (h.exh ? ' <small class="meta">' + (is24(h) ? (h.exh >= 6 ? 'Death' : '−' + 2 * h.exh + ' to d20 tests, −' + 5 * h.exh + ' ft speed (included above)') : EXHAUSTION[h.exh]) + '</small>' : '') + '</span></div>';
  o += '<details class="conds"' + (h.conds.length ? ' open' : '') + '><summary>Conditions' + (h.conds.length ? ': <b>' + h.conds.join(', ') + '</b>' : '') + '</summary><div class="chips">' + Object.keys(CONDITIONS).map((c) => chip('cond', c, c, h.conds.includes(c), ' title="' + esc(CONDITIONS[c]) + '"')).join('') + '</div>' + h.conds.map((c) => '<p class="small"><b>' + c + ':</b> ' + esc(CONDITIONS[c]) + '</p>').join('') + '<p class="small">' + extLink(AID.cond, 'All conditions in full') + '</p></details></section>';
  // abilities and saves
  o += '<div class="abil">' + ABIL.map((a) => '<button type="button" class="ab" data-hr="d20" data-v="' + (D.mod[a] - D.d20pen) + '|' + ABIL_N[a] + ' check"><span>' + ABIL_S[a] + '</span><b>' + sgn(D.mod[a]) + '</b><small>' + D.sc[a] + '</small></button>').join('') + '</div>';
  o += '<div class="saves"><span class="lab">Saving throws</span>' + ABIL.map((a) => '<button type="button" class="sv' + (D.saves.has(a) ? ' p' : '') + '" data-hr="d20" data-v="' + D.saveBonus(a) + '|' + ABIL_N[a] + ' save">' + ABIL_S[a] + ' <b>' + sgn(D.saveBonus(a)) + '</b></button>').join('') + '</div>';
  // attacks
  o += '<section><h3>Attacks</h3><ul class="atk">' + D.attacks.map((x) => '<li><div><b>' + esc(x.name) + '</b><small>' + esc(x.type) + (x.props ? ' · ' + esc(x.props) : '') + (x.prof === false ? ' · not proficient' : '') + '</small></div>' +
    (x.save ? '<span class="dc">' + ABIL_S[x.save] + ' save DC ' + x.dc + '</span>' : '<button type="button" class="btn sm roll" data-hr="d20" data-v="' + x.hit + '|' + esc(x.name) + ' attack|' + esc(x.key) + '">Hit ' + sgn(x.hit) + '</button>') +
    '<button type="button" class="btn sm roll" data-hr="dmg" data-v="' + esc(x.dmg) + '|' + esc(x.name) + '|' + esc(x.key) + '">' + esc(x.dmg) + '</button>' + (x.vers ? '<button type="button" class="btn sm roll" data-hr="dmg" data-v="' + esc(x.vers) + '|' + esc(x.name) + ' two-handed|' + esc(x.key) + '" title="Two-handed">' + esc(x.vers) + '</button>' : '') + '</li>').join('') + '</ul>' +
    (D.notes.length ? '<p class="small">' + D.notes.map(esc).join(' ') + '</p>' : '') + '</section>';
  // limited uses
  if (D.uses.length) o += '<section><h3>Limited uses</h3><ul class="uses">' + D.uses.map((u) => { const used = h.uses[u.key] || 0, left = Math.max(0, u.max - used); return '<li><div><b>' + esc(u.n) + '</b><small>' + (u.rest === 'short' ? 'short or long rest' : u.rest === 'one' ? 'long rest; one back on a short rest' : 'long rest') + (u.note ? ' · ' + esc(u.note) : '') + '</small></div>' + (u.max >= 99 ? '<span class="small">Unlimited</span>' : u.max > 8 ? '<span class="pool"><button type="button" class="btn sm" data-hr="use" data-v="' + u.key + '|1" aria-label="Spend one">−</button><b>' + left + '</b>/' + u.max + '<button type="button" class="btn sm" data-hr="use" data-v="' + u.key + '|-1" aria-label="Regain one">+</button></span>' : '<span class="pips">' + Array.from({ length: u.max }, (_, i) => '<button type="button" class="pip' + (i < left ? ' on' : '') + '" data-hr="usepip" data-v="' + u.key + '|' + i + '|' + u.max + '" aria-label="' + esc(u.n) + ' ' + (i + 1) + '"></button>').join('') + '</span>') + '</li>'; }).join('') + '</ul></section>';
  o += heroGuildsHtml(h);
  o += downtimeHtml(h);
  { const V = venturesListHtml(h); if (V) o += '<section><h3>Trade caravans</h3>' + V + '</section>'; }
  // spells
  o += sheetSpells(h, D);
  // skills
  o += '<section><h3>Skills</h3><ul class="skills">' + SKILLS.map(([s, a]) => '<li><button type="button" data-hr="d20" data-v="' + D.skillBonus(s) + '|' + esc(s) + '"><i class="pr' + (D.expertise.has(s) ? ' ex' : D.skills.has(s) ? ' on' : '') + '" aria-label="' + (D.expertise.has(s) ? 'expertise' : D.skills.has(s) ? 'proficient' : 'not proficient') + '"></i><span>' + esc(s) + ' <small>' + ABIL_S[a] + '</small></span><b>' + sgn(D.skillBonus(s)) + '</b></button></li>').join('') + '</ul></section>';
  // features
  o += '<section><h3>Features and traits</h3><ul class="feats">' + D.feats.map((f) => '<li><details><summary><b>' + esc(f.n) + '</b> <small class="meta">' + esc(f.src) + '</small></summary><p>' + esc(f.d) + (f.link ? ' ' + extLink(f.link, 'AideDD') : '') + '</p></details></li>').join('') + '</ul>';
  if (h.cls === 'druid' && D.lv >= 2) {
    const maxCR = D.lv >= 8 ? 1 : D.lv >= 4 ? 0.5 : 0.25;
    const crv = (c) => (c.includes('/') ? +c.split('/')[0] / +c.split('/')[1] : +c);
    const forms = Object.keys(MON).filter((n) => /beast/.test(MON[n][0]) && crv(MON[n][4]) <= maxCR && (D.lv >= 8 || !/fly/.test(MON[n][3])) && (D.lv >= 4 || !/swim/.test(MON[n][3]))).sort();
    if (forms.length) o += '<p class="small"><b>Wild Shape forms you know of:</b> ' + forms.map((n) => monLink(n) + ' <small class="meta">CR ' + MON[n][4] + '</small>').join(', ') + '</p>';
  }
  o += '</section>';
  // proficiencies and gear
  o += '<section><h3>Proficiencies</h3><p class="small"><b>Armour:</b> ' + ([...D.armorProfs].join(', ') || 'none') + '<br><b>Weapons:</b> ' + [...D.weaponProfs].join(', ') + '<br><b>Tools:</b> ' + (D.tools.join(', ') || 'none') + '<br><b>Languages:</b> ' + [...D.langs].join(', ') + '</p></section>';
  const wt = D.inv.reduce((a, x) => a + ((ITEM.get(x.n) || {}).wt || 0) * x.q, 0);
  o += '<section><h3>Equipment</h3><p class="small">' + D.inv.map((x) => esc(x.n) + (x.q > 1 ? ' ×' + x.q : '')).join(', ') + '</p><p class="meta">Gold <b>' + money(goldOf(h)) + '</b> · carrying about ' + Math.round(wt) + ' lb of ' + D.sc.str * 15 + ' lb · <button type="button" class="link" data-hr="step" data-v="gear">Shop or edit</button></p></section>';
  // story
  o += '<section><h3>Story</h3><p class="small">' + (h.trait ? '<b>Personality:</b> ' + esc(h.trait) + '<br>' : '') + (h.ideal ? '<b>Ideal:</b> ' + esc(h.ideal) + '<br>' : '') + (h.flaw ? '<b>Flaw:</b> ' + esc(h.flaw) : '') + '</p>' + bondHtml(h) + '</section>';
  // progress and guild
  const nextXP = XP_LEVEL[D.lv] || null;
  o += '<section><h3>Progress</h3><div class="row2"><div class="field"><label class="lab" for="hc-xp">Experience points</label><input id="hc-xp" type="number" min="0" value="' + (h.xp || 0) + '"></div><div class="field"><span class="lab">Next level</span><p class="small">' + (nextXP ? fmtInt(nextXP) + ' XP' + ((h.xp || 0) >= nextXP ? ' · <b>ready to level up!</b>' : '') : 'Maximum level') + '</p></div></div>' +
    '<div class="actions">' + (D.lv < 20 ? '<button type="button" class="btn primary" data-hr="levelup">Level up to ' + (D.lv + 1) + '</button>' : '') + (D.lv > 1 ? '<button type="button" class="btn" data-hr="leveldown">Level down</button>' : '') + (reg ? '' : '<button type="button" class="btn" data-hr="guild">Register with the Adventurers\' Guild</button>') + '</div>' +
    (reg ? '<p class="small">Registered with the Adventurers\' Guild at ' + rankBadge(rankOf(reg.merit || 0), true) + ' rank, ' + (reg.merit || 0) + ' merit. Quest difficulty on the board now accounts for this hero. <button type="button" class="link" data-hr="toguild">Open the quest board</button></p>' : '<p class="small">Registering adds this hero to your party on the Guilds tab, so quests show how dangerous they are for you and earn merit and rank.</p>') + '</section>';
  o += '<section><h3>Recent rolls</h3><ul class="rlog" id="hrLog">' + logHtml() + '</ul></section>';
  o += '<div class="actions"><button type="button" class="btn" data-hr="step" data-v="basics">Edit character</button><button type="button" class="btn danger" data-hr="del">' + (heroes.confirmDel === h.id ? 'Tap again to delete' : 'Delete hero') + '</button></div>';
  return o;
}
function sheetSpells(h, D) {
  const K = D.cast;
  const rs = D.raceSpells;
  if (!K && !rs.length) return '';
  let o = '<section><h3>Spells</h3>';
  if (K) {
    o += '<p class="small">Save DC <b>' + K.dc + '</b> · spell attack <b>' + sgn(K.atk) + '</b> · ' + ABIL_N[K.ab] + '</p>';
    // slots
    if (K.type === 'pact') { const left = K.pact - (h.pactUsed || 0); o += '<div class="slots"><span>Pact slots (' + ordinal(K.pactLv) + ')</span>' + Array.from({ length: K.pact }, (_, i) => '<button type="button" class="pip' + (i < left ? ' on' : '') + '" data-hr="pslot" data-v="' + i + '" aria-label="Pact slot ' + (i + 1) + '"></button>').join('') + '</div>'; }
    else if (K.slots.length) o += '<div class="slots-grid">' + K.slots.map((n, l) => { const left = n - (h.slotsUsed[l] || 0); return '<div class="slots"><span>' + ordinal(l + 1) + '</span>' + Array.from({ length: n }, (_, i) => '<button type="button" class="pip' + (i < left ? ' on' : '') + '" data-hr="slot" data-v="' + l + '|' + i + '" aria-label="' + ordinal(l + 1) + '-level slot ' + (i + 1) + '"></button>').join('') + '</div>'; }).join('') + '</div>';
  }
  const rows = [];
  for (const r of rs) { const s = SPELL_BY.get(r.name); if (s) rows.push([s, r.note, r.ab]); }
  if (K) {
    for (const n of h.cantrips) { const s = SPELL_BY.get(n); if (s) rows.push([s, '', K.ab]); }
    const list = K.mode === 'book' ? h.prepared.filter((n) => h.spells.includes(n)) : h.spells;
    for (const n of K.always) { const s = SPELL_BY.get(n); if (s && s.lv <= K.maxLv) rows.push([s, 'always prepared', K.ab]); }
    for (const n of list) { const s = SPELL_BY.get(n); if (s && !K.always.includes(n)) rows.push([s, '', K.ab]); }
    for (const sl in h.arcanum) { const s = SPELL_BY.get(h.arcanum[sl]); if (s && D.lv >= { 6: 11, 7: 13, 8: 15, 9: 17 }[sl]) rows.push([s, 'Mystic Arcanum, once per long rest', K.ab]); }
  }
  rows.sort((a, b) => a[0].lv - b[0].lv || a[0].name.localeCompare(b[0].name));
  let lastLv = -1;
  o += '<ul class="spells sheet">';
  for (const [s, note, ab] of rows) {
    if (s.lv !== lastLv) { o += '<li class="lvh">' + (s.lv ? ordinal(s.lv) + ' level' : 'Cantrips') + '</li>'; lastLv = s.lv; }
    const dice = /(\d+d\d+)/.exec(s.text);
    const addMod = /your (spellcasting )?modifier/.test(s.text);
    const m = D.mod[ab];
    const expr = dice ? dice[1] + (addMod && m ? dsg(m) : '') : '';
    o += '<li class="sp"><div class="sp-t"><b>' + esc(s.name) + '</b>' + (s.conc ? '<em class="tag">C</em>' : '') + (s.ritual ? '<em class="tag">R</em>' : '') + (note ? '<small class="meta"> ' + esc(note) + '</small>' : '') + '</div>' +
      (s.lv && !note.startsWith('Mystic') && !rs.some((r) => r.name === s.name) ? '<button type="button" class="btn sm" data-hr="cast" data-v="' + esc(s.name) + '">Cast</button>' : '') + (expr ? '<button type="button" class="btn sm roll" data-hr="dmg" data-v="' + esc(expr) + '|' + esc(s.name) + '|">' + esc(expr) + '</button>' : '') +
      '<details><summary aria-label="Details of ' + esc(s.name) + '">i</summary><p class="small">' + s.school + ' · ' + esc(s.time) + ' · ' + esc(s.range) + ' · ' + esc(s.dur) + '</p><p>' + esc(s.text) + '</p><p class="small">' + extLink(AID.spell(s.name), 'Full spell text') + '</p></details></li>';
  }
  return o + '</ul></section>';
}
function heroGuildMember(h) { return (gst().party.members || []).find((m) => m.id === 'h:' + h.id) || null; }
function syncGuild(h) {
  const m = heroGuildMember(h);
  if (!m || (m.level === h.level && m.name === (h.name || 'Unnamed') && m.cls === CLS(h).name)) return;
  guildCommit('Update ' + (h.name || 'hero'), (g) => { const x = g.party.members.find((q) => q.id === 'h:' + h.id); if (x) { x.level = h.level; x.name = h.name || 'Unnamed'; x.cls = CLS(h).name; } });
}

// ---------------------------------------------------------------- interaction
function heroChanged(h, rerender = true) {
  heroSave();
  if (rerender) { const el = $('inspector'); const top = el ? el.scrollTop : 0; renderPanel(); if (el) el.scrollTop = top; requestRender(); }
}
function longRest(h, D) {
  h.hp = D.hpMax; h.temp = 0; h.death = [0, 0];
  h.hdUsed = Math.max(0, (h.hdUsed || 0) - Math.max(1, Math.floor(D.lv / 2)));
  h.slotsUsed = [0, 0, 0, 0, 0, 0, 0, 0, 0]; h.pactUsed = 0; h.uses = {};
  if (h.exh > 0) h.exh -= 1;
  if (h.cls === 'wizard' || h.cls === 'druid') { /* recovery features reset with uses */ }
}
function shortRest(h, D) {
  h.pactUsed = 0;
  for (const u of D.uses) { if (u.rest === 'short') delete h.uses[u.key]; else if (u.rest === 'one' && h.uses[u.key] > 0) h.uses[u.key] -= 1; }
}
function castSpell(h, D, name) {
  const s = SPELL_BY.get(name), K = D.cast;
  if (!s || !K) return;
  if (K.type === 'pact') {
    if ((h.pactUsed || 0) >= K.pact) { toast('No pact slots left. They return on a short rest.'); return; }
    h.pactUsed = (h.pactUsed || 0) + 1; toast('Cast ' + name + ' with a ' + ordinal(K.pactLv) + '-level pact slot.'); return;
  }
  for (let l = s.lv - 1; l < K.slots.length; l++) {
    if ((h.slotsUsed[l] || 0) < K.slots[l]) { h.slotsUsed[l] = (h.slotsUsed[l] || 0) + 1; toast('Cast ' + name + ' with a ' + ordinal(l + 1) + '-level slot' + (l + 1 > s.lv ? ' (upcast)' : '') + (s.conc ? '. Concentration: one at a time.' : '.')); return; }
  }
  toast(s.ritual ? 'No slots left, but you can cast it as a ritual (10 minutes longer).' : 'No spell slots of ' + ordinal(s.lv) + ' level or higher left.');
}
function levelTo(h, lv) {
  const before = derive(h);
  const cur = h.hp == null ? before.hpMax : h.hp;
  h.level = clamp(lv, 1, 20);
  const after = derive(h);
  h.hp = clamp(cur + (after.hpMax - before.hpMax), 0, after.hpMax);
  h.hdUsed = Math.min(h.hdUsed || 0, h.level);
  const gained = after.feats.filter((f) => f.at === h.level).map((f) => f.n);
  if (h.level !== before.lv) heroLog(h, 'hero', (h.level > before.lv ? 'Reached level ' : 'Dropped to level ') + h.level);
  if (lv > before.lv) toast('Level ' + h.level + '! +' + (after.hpMax - before.hpMax) + ' HP' + (gained.length ? '; new: ' + gained.join(', ') : '') + (after.todo.length ? '. ' + after.todo.length + ' choice' + (after.todo.length > 1 ? 's' : '') + ' to make.' : '.'));
  syncGuild(h);
}
$('inspector').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-hr]');
  if (!b || tool !== 'heroes') return;
  const act = b.dataset.hr, v = b.dataset.v || '';
  let h = curHero();
  if (act === 'chronf') { heroes.chronFilter = v; renderPanel(); return; }
  if (act === 'pickparty') { heroes.pickParty = !heroes.pickParty; if (heroes.pickParty) toast('Tap the settlement the party travels to.'); renderPanel(); return; }
  if (act === 'partyfly') { const s = SBY.get(gst().party.at); if (s) flyVis(s.x, s.y, Math.max(view.s, TOWN_ZOOM[s.tier])); return; }
  if (act === 'chronnote') { const f = $('hc-chronnote'); const t = f && f.value.trim(); if (!t) return; commit('Chronicle note', () => chronAdd({ k: 'note', t: t.slice(0, 200) }), {}); renderPanel(); return; }
  if (act === 'step' && v !== 'chron' && !curHero()) { heroes.step = 'sheet'; renderPanel(); return; }
  if (act === 'step' && v === 'chron') { heroes.step = 'chron'; heroes.confirmDel = null; renderPanel(); $('inspector').scrollTop = 0; return; }
  if (act === 'new') { const n = newHero(); heroes.list.push(n); heroes.cur = n.id; heroes.step = 'basics'; rollPersona(n); heroLog(n, 'hero', 'Began the adventure'); heroChanged(n); $('inspector').scrollTop = 0; return; }
  if (act === 'quick') { const n = newHero(); quickBuild(n); heroLog(n, 'hero', 'Began the adventure as a ' + raceName(n).toLowerCase() + ' ' + CLASSES5[n.cls].name.toLowerCase()); heroes.list.push(n); heroes.cur = n.id; heroes.step = 'sheet'; heroChanged(n); $('inspector').scrollTop = 0; toast(n.name + ', a ' + raceName(n).toLowerCase() + ' ' + CLASSES5[n.cls].name.toLowerCase() + ', is ready. Edit anything you like.'); return; }
  if (!h) return;
  const D = derive(h);
  const R = raceOf(h), C = CLS(h);
  switch (act) {
    case 'step': heroes.step = v; heroes.confirmDel = null; renderPanel(); $('inspector').scrollTop = 0; return;
    case 'rname': h.name = pickName(h); break;
    case 'fill': autoFill(h); toast('Done. Every remaining choice now has a sensible default you can change.'); break;
    case 'sub': h.sub = v; h.raceCantrip = ''; break;
    case 'rules': setRules(h, v); break;
    case 'basimode': h.bgAsi = Object.assign({}, h.bgAsi, { mode: v }); break;
    case 'babil': h.bgAbil = h.bgAbil || []; toggleIn(h.bgAbil, v, 3); break;
    case 'micant': case 'mi2cant': { const k = act.slice(0, -4); h[k] = Object.assign({ cant: [] }, h[k]); h[k].cant = (h[k].cant || []).slice(); if (!toggleIn(h[k].cant, v, 2)) toast('Two cantrips. Untick one first.'); break; }
    case 'skilled': h.skilled = h.skilled || []; if (!toggleIn(h.skilled, v, 3)) toast('Three skills. Untick one first.'); break;
    case 'race': if (h.race !== v) { h.race = v; h.sub = ''; h.raceAsi = []; h.raceSkills = []; h.raceLangs = []; h.raceCantrip = ''; h.tool = ''; } break;
    case 'cls': if (h.cls !== v) { h.cls = v; h.subclass = ''; h.subNotes = ''; h.skills = []; h.expertise = []; h.style = ''; h.style2 = ''; h.kit = {}; h.picks = {}; h.cantrips = []; h.spells = []; h.prepared = []; h.invocations = []; h.metamagic = []; h.pact = ''; h.asi = {}; h.order = ''; h.strike7 = ''; h.boon = ''; h.boonAb = ''; h.arcanum = {}; h.uses = {}; h.slotsUsed = [0, 0, 0, 0, 0, 0, 0, 0, 0]; h.removed = []; } break;
    case 'bg': if (h.bg !== v) { h.bg = v; h.bgSkills = []; h.bgLangs = []; h.bgSwap = {}; h.bgAsi = { mode: (h.bgAsi || {}).mode || '21' }; h.mi = {}; h.removed = h.removed.filter((k) => !k.startsWith('b')); } break;
    case 'rasi': toggleIn(h.raceAsi, v, R.asiPick || 0); break;
    case 'rskill': toggleIn(h.raceSkills, v, R.skillPick || 0); break;
    case 'rlang': toggleIn(h.raceLangs, v, (R.extraLang || 0) + ((raceSub(h) || {}).extraLang || 0)); break;
    case 'bskill': toggleIn(h.bgSkills, v, 2); break;
    case 'blang': toggleIn(h.bgLangs, v, bgOf(h).langs || 0); break;
    case 'skill': if (!toggleIn(h.skills, v, D.skN)) toast('You already have ' + D.skN + ' class skills. Untick one first.'); break;
    case 'lskill': toggleIn(h.loreSkills, v, 3); break;
    case 'exp': if (!toggleIn(h.expertise, v, D.expN)) toast('Expertise is full. Untick one first.'); break;
    case 'style': h.style = v; if (h.style2 === v) h.style2 = ''; break;
    case 'style2': h.style2 = v; break;
    case 'meta': h.metamagic = h.metamagic.filter((k) => metaTab(h)[k]); if (!toggleIn(h.metamagic, v, metaN(h, D.lv))) toast('You know ' + metaN(h, D.lv) + ' Metamagic options at this level.'); break;
    case 'order': h.order = v; break;
    case 'strike7': h.strike7 = v; break;
    case 'boon': h.boon = v; if (!boonAbs(v).includes(h.boonAb)) h.boonAb = ''; break;
    case 'invo': h.invocations = h.invocations.filter((k) => invoTab(h)[k]); if (!toggleIn(h.invocations, v, D.invN || 0)) toast('You know ' + D.invN + ' invocations at this level.'); else if (is24(h)) { for (let i = 0; i < 4; i++) h.invocations = h.invocations.filter((k) => invoOk(h, k, D.lv)); } break;
    case 'pact': h.pact = v; h.invocations = h.invocations.filter((k) => !INVOCATIONS[k][3] || INVOCATIONS[k][3] === 'eb' || INVOCATIONS[k][3] === v); break;
    case 'method': h.method = v; if (v === 'array') { const order = QB[h.cls][1]; h.base = {}; order.forEach((a, i) => { h.base[a] = STD_ARRAY[i]; }); } else if (v === 'point') h.base = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }; else if (v === 'roll' && !h.rolls) { rollStats(h); } break;
    case 'rollstats': rollStats(h); break;
    case 'pt': { const [a, d] = v.split('|'); const nv = clamp(h.base[a] + +d, 8, 15); const spent = ABIL.reduce((s, k) => s + (POINT_COST[k === a ? nv : h.base[k]] || 0), 0); if (spent > 27) { toast('Not enough points left.'); return; } h.base[a] = nv; break; }
    case 'kit': { const [g, i] = v.split('|').map(Number); h.kit[g] = i; break; }
    case 'goldmode': h.goldMode = v; break;
    case 'rollgold': if (is24(h)) break; { const [n, d, m] = C.gold; const r = rollExpr(n + 'd' + d); h.goldRoll = r.total * m; showRoll('Starting gold', n + 'd' + d + ': ' + r.parts.join(' ') + (m > 1 ? ' × ' + m : ''), h.goldRoll, ''); break; }
    case 'shopcat': heroes.shopCat = v; renderPanel(); return;
    case 'buy': { const it = ITEM.get(v); if (!it) return; const p = shopPrice(h, it); if (!p.ok) return; if (p.price > goldOf(h) + 1e-9) { toast('Not enough gold.'); return; } h.goldDelta -= Math.round(p.price * 100) / 100; const ex = h.inv.find((x) => x.n === v); if (ex && it.kind !== 'pack') ex.q = (ex.q || 1) + 1; else h.inv.push({ n: v, q: 1 }); heroLog(h, 'buy', 'Bought ' + v + ' for ' + money(p.price) + (h.home && SBY.get(h.home) ? ' in ' + SBY.get(h.home).name : '')); toast('Bought ' + v + ' for ' + money(p.price) + '.'); break; }
    case 'sell': { const x = h.inv[+v]; if (!x) return; const it = ITEM.get(x.n); const p = it ? shopPrice(h, it).full * sellRate(h).r : 0; h.goldDelta += Math.round(p * 100) / 100; if ((x.q || 1) > 1) x.q -= 1; else h.inv.splice(+v, 1); heroLog(h, 'buy', 'Sold ' + x.n + ' for ' + money(p)); toast('Sold ' + x.n + ' for ' + money(p) + '.'); break; }
    case 'rm': { if (v.startsWith('i')) { const i = +v.slice(1); const x = h.inv[i]; if (x && (x.q || 1) > 1) x.q -= 1; else h.inv.splice(i, 1); } else if (!h.removed.includes(v)) h.removed.push(v); break; }
    case 'additem': { const f = $('hc-item'); const n = f && f.value.trim(); if (!n) return; h.inv.push({ n: n.slice(0, 60), q: 1 }); break; }
    case 'gold': h.goldDelta += +v; if (goldOf(h) < 0) h.goldDelta -= goldOf(h); break;
    case 'cantrip': if (!toggleIn(h.cantrips, v, D.cast ? D.cast.cantripsN : 0)) toast('Cantrips are full. Untick one first.'); break;
    case 'spell': { const cap = D.cast.knownN || D.cast.bookN || D.cast.prepN; if (!toggleIn(h.spells, v, cap)) toast('That is all the spells you can have. Untick one first.'); else if (!h.spells.includes(v)) h.prepared = h.prepared.filter((x) => x !== v); break; }
    case 'prep': if (!toggleIn(h.prepared, v, D.cast.prepN)) toast('You can prepare ' + D.cast.prepN + ' spells. Unprepare one first.'); break;
    case 'splv': heroes.spellLv = +v; renderPanel(); return;
    case 'pickhome': heroes.pickHome = !heroes.pickHome; if (heroes.pickHome) toast('Tap a village, town or city on the map.'); break;
    case 'sethome': h.home = v; heroes.pickHome = false; homeChanged(h); break;
    case 'persona': rollPersona(h, v); break;
    case 'bondown': { const p = npcById(h.bondNpc); const k = BOND_KINDS.find((b) => b[0] === h.bondKind) || BOND_KINDS[0]; h.bond = p ? (k[1].charAt(0).toUpperCase() + k[1].slice(1) + ' ' + npcName(p) + '.').replace(':.', '.') : h.bond; h.bondNpc = null; break; }
    case 'adv': heroes.adv = +v; renderPanel(); return;
    case 'd20': { const [m, label, key] = v.split('|'); rollD20(label, +m, key); return; }
    case 'dmg': { const [e, label, key] = v.split('|'); rollDamage(label, e, key); return; }
    case 'die': { const r = rollExpr('1d' + v); showRoll('d' + v, 'd' + v, r.total, +v === 20 && r.total === 20 ? 'crit' : +v === 20 && r.total === 1 ? 'fumble' : ''); return; }
    case 'hp': {
      const f = $('hc-hpamt'); const n = Math.max(0, Math.round(+(f && f.value) || 0)); if (!n) { toast('Type an amount first.'); if (f) f.focus(); return; }
      let hp = h.hp == null ? D.hpMax : h.hp;
      if (+v < 0) {
        let dmg = n; if (h.temp) { const t = Math.min(h.temp, dmg); h.temp -= t; dmg -= t; }
        if (hp <= 0 && dmg > 0) { h.death[1] = Math.min(3, h.death[1] + 1); toast('Damage at 0 HP counts as a failed death save.'); }
        else if (dmg > 0 && hp - dmg <= -D.hpMax) toast('Massive damage: the leftover damage equals your maximum HP, which is instant death.');
        else if (dmg > 0 && hp - dmg <= 0) { toast('Down to 0 HP: unconscious and making death saves.'); heroLog(h, 'down', 'Fell unconscious'); }
        hp = Math.max(0, hp - dmg);
      }
      else if (+v > 0) { if (hp <= 0) h.death = [0, 0]; hp = Math.min(D.hpMax, hp + n); }
      else h.temp = Math.max(h.temp, n);
      h.hp = hp; break;
    }
    case 'death': { const [k, i] = v.split('|').map(Number); h.death[k] = h.death[k] > i ? i : i + 1; if (k === 1 && h.death[1] >= 3) heroLog(h, 'down', 'Died'); if (k === 0 && h.death[0] >= 3) heroLog(h, 'down', 'Pulled back from death\'s door'); if (h.death[0] >= 3) { toast('Stable at 0 HP.'); } if (h.death[1] >= 3) toast('Three failures: your hero has died. Revivify within a minute can still save them.'); break; }
    case 'deathroll': { const r = 1 + Math.floor(Math.random() * 20); if (r === 20) { h.hp = 1; h.death = [0, 0]; showRoll('Death save', 'natural 20: back up with 1 HP', 20, 'crit'); } else if (r === 1) { h.death[1] = Math.min(3, h.death[1] + 2); showRoll('Death save', 'natural 1: two failures', 1, 'fumble'); } else if (r >= 10) { h.death[0] = Math.min(3, h.death[0] + 1); showRoll('Death save', 'success', r, ''); } else { h.death[1] = Math.min(3, h.death[1] + 1); showRoll('Death save', 'failure', r, 'fumble'); } break; }
    case 'hd': { if (!D.hdLeft) return; const r = rollExpr('1d' + D.hd); const gain = Math.max(0, r.total + D.mod.con); h.hdUsed = (h.hdUsed || 0) + 1; h.hp = Math.min(D.hpMax, (h.hp == null ? D.hpMax : h.hp) + gain); showRoll('Hit die', 'd' + D.hd + ' ' + r.total + ' ' + sgn(D.mod.con), gain, 'heal'); break; }
    case 'short': shortRest(h, D); toast('Short rest: short-rest abilities' + (D.cast && D.cast.type === 'pact' ? ' and pact slots' : '') + ' recharged. Spend hit dice to heal.'); break;
    case 'long': longRest(h, D); toast('Long rest: full HP, spell slots and abilities restored.'); break;
    case 'insp': h.insp = !h.insp; break;
    case 'exh': h.exh = clamp(h.exh + +v, 0, 6); break;
    case 'cond': toggleIn(h.conds, v); break;
    case 'slot': { const [l, i] = v.split('|').map(Number); const n = D.cast.slots[l], left = n - (h.slotsUsed[l] || 0); h.slotsUsed[l] = i < left ? n - i : n - i - 1; break; }
    case 'pslot': { const i = +v, left = D.cast.pact - (h.pactUsed || 0); h.pactUsed = i < left ? D.cast.pact - i : D.cast.pact - i - 1; break; }
    case 'use': { const [k, d] = v.split('|'); const u = D.uses.find((x) => x.key === k); if (!u) return; h.uses[k] = clamp((h.uses[k] || 0) + +d, 0, u.max); break; }
    case 'usepip': { const [k, i, max] = v.split('|'); const left = +max - (h.uses[k] || 0); h.uses[k] = +i < left ? +max - +i : +max - +i - 1; break; }
    case 'cast': castSpell(h, D, v); break;
    case 'levelup': levelTo(h, D.lv + 1); break;
    case 'leveldown': levelTo(h, D.lv - 1); break;
    case 'guild': {
      if (heroGuildMember(h)) return;
      guildCommit('Register ' + (h.name || 'hero'), (g) => { g.party.members.push({ id: 'h:' + h.id, name: h.name || 'Unnamed', cls: C.name, level: h.level, merit: 0 }); });
      heroLog(h, 'hero', 'Joined the Adventurers\' Guild at Copper rank');
      toast((h.name || 'Your hero') + ' joins the Adventurers\' Guild at Copper rank.'); break;
    }
    case 'toguild': { const s = SBY.get(h.home); setTool('guilds', false, true); if (s) { market.sid = s.id; people.sid = s.id; } guildUI.tab = 'board'; guildUI.q = null; guildUI.org = null; renderPanel(); return; }
    case 'del': if (heroes.confirmDel !== h.id) { heroes.confirmDel = h.id; renderPanel(); return; } heroes.list = heroes.list.filter((x) => x.id !== h.id); heroes.cur = heroes.list[0] ? heroes.list[0].id : null; heroes.confirmDel = null; heroes.step = 'sheet'; heroChanged(null); toast('Hero deleted.'); return;
    case 'noop': return;
    default: return;
  }
  heroChanged(h);
});
function rollStats(h) {
  h.rolls = [];
  for (let i = 0; i < 6; i++) { const r = [1, 2, 3, 4].map(() => 1 + Math.floor(Math.random() * 6)).sort((a, b) => b - a); h.rolls.push(r[0] + r[1] + r[2]); }
  const sorted = h.rolls.slice().sort((a, b) => b - a);
  QB[h.cls][1].forEach((a, i) => { h.base[a] = sorted[i]; });
}
$('inspector').addEventListener('change', (e) => {
  if (tool !== 'heroes') return;
  const t = e.target, id = t.id;
  if (id === 'hc-pass') { commit(t.checked ? 'Travel passes time' : 'Travel without passing time', () => { gst().party.pass = t.checked; }, {}); return; }
  if (id === 'hc-pick') { heroes.cur = t.value; heroes.confirmDel = null; heroChanged(curHero()); return; }
  const h = curHero(); if (!h) return;
  if (id === 'hc-secrets') { heroes.showAll = t.checked; renderPanel(); return; }
  if (t.dataset.hbase) {
    const a = t.dataset.hbase;
    if (h.method === 'manual') h.base[a] = clamp(Math.round(+t.value || 10), 3, 20);
    else { const nv = +t.value.split(':')[1]; const other = ABIL.find((k) => k !== a && h.base[k] === nv); if (other) h.base[other] = h.base[a]; h.base[a] = nv; }
  } else if (t.dataset.hasi) { const [l, s] = t.dataset.hasi.split('|'); h.asi[l] = Object.assign({}, h.asi[l], { [s]: t.value }); }
  else if (t.dataset.hpick) h.picks[t.dataset.hpick] = t.value;
  else if (id === 'hc-name') { h.name = t.value.trim().slice(0, 50); syncGuild(h); }
  else if (id === 'hc-level') { levelTo(h, +t.value); }
  else if (id === 'hc-align') h.align = t.value;
  else if (id === 'hc-age') h.age = clamp(Math.round(+t.value || 1), 1, 999);
  else if (id === 'hc-dragon') h.dragon = t.value;
  else if (id === 'hc-tool') h.tool = t.value;
  else if (id === 'hc-basi2') h.bgAsi = Object.assign({}, h.bgAsi, { two: t.value, one: (h.bgAsi || {}).one === t.value ? '' : (h.bgAsi || {}).one });
  else if (id === 'hc-basi1') h.bgAsi = Object.assign({}, h.bgAsi, { one: t.value });
  else if (id === 'hc-bgfeat') { h.bgFeat = t.value; if (h.feat24 === t.value) h.feat24 = ''; }
  else if (id === 'hc-feat24') h.feat24 = t.value;
  else if (id === 'hc-milist') { h.miList = t.value; h.mi = {}; }
  else if (id === 'hc-mi2list') { h.miList2 = t.value; h.mi2 = {}; }
  else if (/^hc-mi2?(spell|ab)$/.test(id)) { const k = id.startsWith('hc-mi2') ? 'mi2' : 'mi', f = id.endsWith('ab') ? 'ab' : 'spell'; h[k] = Object.assign({}, h[k], { [f]: t.value }); }
  else if (id === 'hc-rcantrip') h.raceCantrip = t.value;
  else if (id === 'hc-favored') h.favored = t.value;
  else if (id === 'hc-terrain') h.terrain = t.value;
  else if (id === 'hc-land') h.land = t.value;
  else if (id === 'hc-land24') h.land24 = t.value;
  else if (id === 'hc-boonab') h.boonAb = t.value;
  else if (id === 'hc-armor') h.armor = t.value;
  else if (id === 'hc-shield') h.shield = t.checked;
  else if (/^hc-arc\d$/.test(id)) h.arcanum[id.slice(6)] = t.value;
  else if (['hc-trait', 'hc-ideal', 'hc-flaw', 'hc-bond'].includes(id)) { h[id.slice(3)] = t.value.slice(0, 120); heroSave(); return; }
  else if (id === 'hc-notes') { h.notes = t.value.slice(0, 4000); heroSave(); return; }
  else if (id === 'hc-subnotes') h.subNotes = t.value.slice(0, 3000);
  else if (id === 'hc-subclass') { h.subclass = t.value === CLS(h).sub[1] ? '' : t.value; }
  else if (id === 'hc-bondkind') h.bondKind = t.value;
  else if (id === 'hc-bondnpc') { if (t.value) { h.bondNpc = t.value; if (!h.bondKind) h.bondKind = 'mentor'; } }
  else if (id === 'hc-xp') h.xp = Math.max(0, Math.round(+t.value || 0));
  else if (id.startsWith('hc-swap-')) { const s = ALL_SKILLS.find((x) => 'hc-swap-' + x.replace(/\W/g, '') === id); if (s) h.bgSwap[s] = t.value; }
  else return;
  heroChanged(h);
});
// tapping a settlement while choosing a hometown
function heroTapSettlement(id) {
  if (heroes.pickParty) { partyTravel(id); return true; }
  const h = curHero();
  if (!h || !heroes.pickHome) return false;
  h.home = id; heroes.pickHome = false;
  homeChanged(h);
  toast((SBY.get(id) || {}).name + ' is now ' + (h.name || 'your hero') + '\'s hometown.');
  heroChanged(h);
  return true;
}
// small brass shields on hometowns
function drawHeroBadges() {
  if (!layers.people || !heroes.list.length) return;
  const count = new Map();
  for (const h of heroes.list) if (h.home) count.set(h.home, (count.get(h.home) || 0) + 1);
  if (!count.size) return;
  ctx.font = '700 10px "Atkinson Hyperlegible", system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const m of markers) {
    if (m.kind !== 'settle' || !count.has(m.id)) continue;
    const X = m.r > 9 ? m.X + 11 : m.X + 12, Y = m.r > 9 ? m.Y - 9 : m.Y - 2;
    ctx.fillStyle = '#7e5bd1'; ctx.strokeStyle = '#120d1f'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(X - 6, Y - 7); ctx.lineTo(X + 6, Y - 7); ctx.lineTo(X + 6, Y); ctx.quadraticCurveTo(X + 6, Y + 6, X, Y + 9); ctx.quadraticCurveTo(X - 6, Y + 6, X - 6, Y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4efff'; ctx.fillText(String(count.get(m.id)), X, Y + 0.5);
  }
  ctx.textBaseline = 'alphabetic';
}

// links between heroes and the rest of the world
function heroBondsFor(p) {
  const hs = heroes.list.filter((h) => h.bondNpc === p.id);
  if (!hs.length) return '';
  return '<section><h3>Bound to a hero</h3><ul class="rels">' + hs.map((h) => { const k = BOND_KINDS.find((b) => b[0] === h.bondKind) || BOND_KINDS[0]; return '<li><i style="background:#7e5bd1"></i><span>' + k[2] + ' of <button type="button" class="link" data-hero="' + esc(h.id) + '">' + esc(h.name || 'a hero') + '</button><small>' + esc(raceName(h)) + ' ' + esc(CLS(h).name.toLowerCase()) + ', level ' + h.level + '</small></span><span></span></li>'; }).join('') + '</ul></section>';
}
function openHero(id) {
  if (!heroes.list.some((h) => h.id === id)) { toast('That hero is no longer on this device.'); return; }
  heroes.cur = id; heroes.step = 'sheet';
  if (tool !== 'heroes') setTool('heroes'); else { panelMin = false; renderPanel(); }
  const el = $('inspector'); if (el) el.scrollTop = 0;
  heroSave();
}
document.addEventListener('click', (ev) => { const t = ev.target.closest('[data-hero]'); if (!t) return; ev.preventDefault(); openHero(t.dataset.hero); });
heroLoad();
