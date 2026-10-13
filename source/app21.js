
// ================================================================ 2024 rules option (SRD 5.2) for heroes (v20)
// Each hero can use the 2014 rules (SRD 5.1, the default) or the 2024 rules (SRD 5.2). The 2024 option changes what the
// free SRD 5.2 changes for a new character: species, backgrounds with their ability increases and origin feats,
// weapon mastery, exhaustion, and subclasses at level 3. The 2024 class features themselves live in app31.js; the hero
// page says so. Only SRD 5.2 content is built in (9 species, 4 backgrounds, 4 origin feats).
const is24 = (h) => !!h && h.rules === '2024';
const SRD52 = 'https://www.dndbeyond.com/srd';
const RACES24 = {
  dragonborn: { name: 'Dragonborn', asi: {}, speed: 30, size: 'Medium', dark: 60, langs: ['Common'], extraLang: 2, age: [15, 80], dragon: true, blurb: 'Proud, scaled descendants of dragons who breathe their ancestor\'s element and, in time, take wing.',
    traits: [['Draconic Ancestry', 'Your dragon ancestor sets the damage type of your breath and your resistance.'], ['Breath Weapon', 'When you take the Attack action, replace one attack with a 15-ft cone or 30-ft line. Each creature makes a Dex save (DC 8 + Con mod + proficiency): 1d10 damage, half on a success; 2d10 at 5th level, 3d10 at 11th, 4d10 at 17th. Uses equal to your proficiency bonus per long rest.'], ['Damage Resistance', 'Resistance to your ancestry\'s damage type.'], ['Darkvision', '60 ft.'], ['Draconic Flight', 'From 5th level, a bonus action gives you spectral wings for 10 minutes: fly speed equal to your speed. Once per long rest.']],
    uses: [['breath', 'Breath Weapon', 'pb', 'long', 1], ['flight', 'Draconic Flight', 1, 'long', 5]] },
  dwarf: { name: 'Dwarf', asi: {}, speed: 30, size: 'Medium', dark: 120, langs: ['Common'], extraLang: 2, age: [40, 350], hpLv: 1, blurb: 'Stout, stubborn folk of mountain halls, known for craft, memory and grudges.',
    traits: [['Darkvision', '120 ft.'], ['Dwarven Resilience', 'Resistance to poison damage, and advantage on saves to avoid or end the poisoned condition.'], ['Dwarven Toughness', 'Your hit point maximum rises by 1 for every level.'], ['Stonecunning', 'Bonus action: tremorsense 60 ft for 10 minutes while on or touching stone. Uses equal to your proficiency bonus per long rest.']],
    uses: [['stone', 'Stonecunning', 'pb', 'long', 1]] },
  elf: { name: 'Elf', asi: {}, speed: 30, size: 'Medium', dark: 60, langs: ['Common'], extraLang: 2, age: [100, 750], skillPick: 1, skillFrom: ['Insight', 'Perception', 'Survival'], blurb: 'Graceful, long-lived people of forests and old cities, at home with magic.',
    traits: [['Darkvision', '60 ft.'], ['Fey Ancestry', 'Advantage on saves to avoid or end the charmed condition.'], ['Keen Senses', 'Proficiency in Insight, Perception or Survival.'], ['Trance', 'You don\'t need sleep; four hours of trance finishes a long rest.']],
    subs: { drow: { name: 'Drow', dark: 120, spells: [[1, 'Dancing Lights'], [3, 'Faerie Fire'], [5, 'Darkness']], traits: [['Drow lineage', 'Darkvision 120 ft. You know Dancing Lights; Faerie Fire at 3rd level and Darkness at 5th, each once per long rest without a slot.']] },
      high: { name: 'High elf', spells: [[1, 'Prestidigitation'], [3, 'Detect Magic'], [5, 'Misty Step']], traits: [['High elf lineage', 'You know Prestidigitation (swap it for another wizard cantrip on a long rest); Detect Magic at 3rd level and Misty Step at 5th, each once per long rest without a slot.']] },
      wood: { name: 'Wood elf', speed: 35, spells: [[1, 'Druidcraft'], [3, 'Longstrider'], [5, 'Pass without Trace']], traits: [['Wood elf lineage', 'Speed 35 ft. You know Druidcraft; Longstrider at 3rd level and Pass without Trace at 5th, each once per long rest without a slot.']] } } },
  gnome: { name: 'Gnome', asi: {}, speed: 30, size: 'Small', dark: 60, langs: ['Common'], extraLang: 2, age: [40, 425], blurb: 'Small, curious inventors and tricksters with an endless zest for life.',
    traits: [['Darkvision', '60 ft.'], ['Gnomish Cunning', 'Advantage on Intelligence, Wisdom and Charisma saves.']],
    subs: { forest: { name: 'Forest gnome', spells: [[1, 'Minor Illusion'], [1, 'Speak with Animals']], traits: [['Forest gnome lineage', 'You know Minor Illusion, and can cast Speak with Animals without a slot a number of times equal to your proficiency bonus per long rest.']], uses: [['beasts', 'Speak with Animals', 'pb', 'long', 1]] },
      rock: { name: 'Rock gnome', spells: [[1, 'Mending'], [1, 'Prestidigitation']], traits: [['Rock gnome lineage', 'You know Mending and Prestidigitation. In 10 minutes you can build a Tiny clockwork device (AC 5, 1 HP) that lasts 8 hours; up to three at once.']] } } },
  goliath: { name: 'Goliath', asi: {}, speed: 35, size: 'Medium', dark: 0, langs: ['Common'], extraLang: 2, age: [18, 90], blurb: 'Towering folk descended from giants, who carry a spark of their ancestors\' power.',
    traits: [['Large Form', 'From 5th level, a bonus action makes you Large for 10 minutes: advantage on Strength checks and +10 ft speed. Once per long rest.'], ['Powerful Build', 'Advantage on checks to end the grappled condition; you count as one size larger for carrying.']],
    subs: { cloud: { name: 'Cloud giant ancestry', traits: [["Cloud's Jaunt", 'Bonus action: teleport up to 30 ft to a space you can see.']] }, fire: { name: 'Fire giant ancestry', traits: [["Fire's Burn", 'When you hit with an attack, deal an extra 1d10 fire damage.']] },
      frost: { name: 'Frost giant ancestry', traits: [["Frost's Chill", 'When you hit with an attack, deal an extra 1d6 cold damage and reduce the target\'s speed by 10 ft until your next turn.']] }, hill: { name: 'Hill giant ancestry', traits: [["Hill's Tumble", 'When you hit a Large or smaller creature, knock it prone.']] },
      stone: { name: 'Stone giant ancestry', traits: [["Stone's Endurance", 'Reaction when you take damage: roll 1d12 + Con modifier and reduce the damage by that much.']] }, storm: { name: 'Storm giant ancestry', traits: [["Storm's Thunder", 'Reaction when a creature within 60 ft damages you: deal it 1d8 thunder damage.']] } },
    uses: [['giant', 'Giant Ancestry', 'pb', 'long', 1], ['large', 'Large Form', 1, 'long', 5]] },
  halfling: { name: 'Halfling', asi: {}, speed: 30, size: 'Small', dark: 0, langs: ['Common'], extraLang: 2, age: [20, 150], blurb: 'Small, cheerful and hard to frighten; they love home but often wander.',
    traits: [['Brave', 'Advantage on saves to avoid or end the frightened condition.'], ['Halfling Nimbleness', 'You can move through the space of any creature a size larger than you.'], ['Luck', 'When you roll a 1 on a d20 test, reroll it and use the new roll.'], ['Naturally Stealthy', 'You can take the Hide action when only a larger creature obscures you.']] },
  human: { name: 'Human', asi: {}, speed: 30, size: 'Medium or Small', dark: 0, langs: ['Common'], extraLang: 2, age: [18, 80], skillPick: 1, feat: true, blurb: 'Ambitious, adaptable and everywhere. The most common folk of the realms.',
    traits: [['Resourceful', 'You gain Heroic Inspiration whenever you finish a long rest.'], ['Skillful', 'Proficiency in one skill of your choice.'], ['Versatile', 'You gain an origin feat of your choice.']] },
  orc: { name: 'Orc', asi: {}, speed: 30, size: 'Medium', dark: 120, langs: ['Common'], extraLang: 2, age: [14, 80], blurb: 'Strong, tireless and fierce, gifted with endurance by their gods.',
    traits: [['Adrenaline Rush', 'Take the Dash action as a bonus action, and gain temporary hit points equal to your proficiency bonus. Uses equal to your proficiency bonus per short or long rest.'], ['Darkvision', '120 ft.'], ['Relentless Endurance', 'When reduced to 0 HP but not killed outright, drop to 1 HP instead. Once per long rest.']],
    uses: [['rush', 'Adrenaline Rush', 'pb', 'short', 1], ['relentless', 'Relentless Endurance', 1, 'long', 1]] },
  tiefling: { name: 'Tiefling', asi: {}, speed: 30, size: 'Medium or Small', dark: 60, langs: ['Common'], extraLang: 2, age: [18, 100], blurb: 'Marked by a fiendish bloodline with horns and tails, and often mistrusted.',
    traits: [['Darkvision', '60 ft.'], ['Otherworldly Presence', 'You know Thaumaturgy.']],
    subs: { infernal: { name: 'Infernal legacy', spells: [[1, 'Thaumaturgy'], [1, 'Fire Bolt'], [3, 'Hellish Rebuke'], [5, 'Darkness']], traits: [['Infernal legacy', 'Resistance to fire. You know Fire Bolt; Hellish Rebuke at 3rd level and Darkness at 5th, each once per long rest without a slot.']] },
      abyssal: { name: 'Abyssal legacy', spells: [[1, 'Thaumaturgy'], [1, 'Poison Spray'], [3, 'Ray of Sickness'], [5, 'Hold Person']], traits: [['Abyssal legacy', 'Resistance to poison. You know Poison Spray; Ray of Sickness at 3rd level and Hold Person at 5th, each once per long rest without a slot.']] },
      chthonic: { name: 'Chthonic legacy', spells: [[1, 'Thaumaturgy'], [1, 'Chill Touch'], [3, 'False Life'], [5, 'Ray of Enfeeblement']], traits: [['Chthonic legacy', 'Resistance to necrotic. You know Chill Touch; False Life at 3rd level and Ray of Enfeeblement at 5th, each once per long rest without a slot.']] } } }
};
// SRD 5.2 backgrounds: three abilities to raise (+2/+1 or +1/+1/+1), two skills, a tool, an origin feat and gear (or 50 gp)
const BGS24 = {
  acolyte: { name: 'Acolyte', abil: ['int', 'wis', 'cha'], skills: ['Insight', 'Religion'], tools: ["Calligrapher's supplies"], feat24: 'mi', mi: 'c', gold: 8, org: 'temple', gear: ["Calligrapher's supplies", 'Book (prayers)', 'Holy symbol', 'Parchment (10 sheets)', 'Robe'], blurb: 'You served in a temple, performing rites and learning the faith.' },
  criminal: { name: 'Criminal', abil: ['dex', 'con', 'int'], skills: ['Sleight of Hand', 'Stealth'], tools: ["Thieves' tools"], feat24: 'alert', gold: 16, org: 'thieves', gear: ['Dagger x2', "Thieves' tools", 'Crowbar', 'Pouch x2', "Traveller's clothes"], blurb: 'You lived outside the law and still know people who do.' },
  sage: { name: 'Sage', abil: ['con', 'int', 'wis'], skills: ['Arcana', 'History'], tools: ["Calligrapher's supplies"], feat24: 'mi', mi: 'w', gold: 8, org: 'mages', gear: ['Quarterstaff', "Calligrapher's supplies", 'Book (history)', 'Parchment (8 sheets)', 'Robe'], blurb: 'Years of study have filled your head with lore.' },
  soldier: { name: 'Soldier', abil: ['str', 'dex', 'con'], skills: ['Athletics', 'Intimidation'], tools: ['Gaming set'], feat24: 'savage', gold: 14, org: 'watch', gear: ['Spear', 'Shortbow', 'Arrows x20', 'Gaming set', "Healer's kit", 'Quiver', "Traveller's clothes"], blurb: 'You served in an army or a town watch.' },
  custom: { name: 'Custom', abil: null, skills: [], pick: 2, tools: [], feat24: null, gold: 15, org: null, gear: ["Traveller's clothes"], blurb: 'Make your own from the 2024 rules: any three abilities, two skills and one origin feat.' }
};
const FEATS24 = {
  alert: ['Alert', 'Add your proficiency bonus to initiative. Right after rolling initiative you can swap yours with a willing ally\'s.'],
  mi: ['Magic Initiate', 'Two cantrips and one 1st-level spell from the cleric, druid or wizard list. Cast the spell once per long rest without a slot (or with slots you have). Intelligence, Wisdom or Charisma is your ability for them.'],
  savage: ['Savage Attacker', 'Once per turn when you hit with a weapon, roll its damage dice twice and use either roll.'],
  skilled: ['Skilled', 'Proficiency in any combination of three skills or tools.']
};
const MI_LIST = { c: 'Cleric', d: 'Druid', w: 'Wizard' };
// weapon mastery (SRD 5.2)
const MASTERY_OF = { Club: 'Slow', Dagger: 'Nick', Greatclub: 'Push', Handaxe: 'Vex', Javelin: 'Slow', 'Light hammer': 'Nick', Mace: 'Sap', Quarterstaff: 'Topple', Sickle: 'Nick', Spear: 'Sap', 'Light crossbow': 'Slow', Dart: 'Vex', Shortbow: 'Vex', Sling: 'Slow', Battleaxe: 'Topple', Flail: 'Sap', Glaive: 'Graze', Greataxe: 'Cleave', Greatsword: 'Graze', Halberd: 'Cleave', Lance: 'Topple', Longsword: 'Sap', Maul: 'Topple', Morningstar: 'Sap', Pike: 'Push', Rapier: 'Vex', Scimitar: 'Nick', Shortsword: 'Vex', Trident: 'Topple', 'War pick': 'Sap', Warhammer: 'Push', Whip: 'Slow', Blowgun: 'Vex', 'Hand crossbow': 'Vex', 'Heavy crossbow': 'Push', Longbow: 'Slow' };
const MASTERY = {
  Cleave: 'Hit a creature with a melee attack: make one more attack against a second creature within 5 ft of it and in reach; on a hit it takes the weapon\'s damage without your ability modifier. Once per turn.',
  Graze: 'Miss with an attack: the target still takes damage equal to your ability modifier.',
  Nick: 'The extra attack from the Light property can be part of the Attack action instead of a bonus action. Once per turn.',
  Push: 'On a hit, push a Large or smaller creature up to 10 ft straight away from you.',
  Sap: 'On a hit, the target has disadvantage on its next attack roll before your next turn.',
  Slow: 'On a hit that deals damage, the target\'s speed drops by 10 ft until your next turn.',
  Topple: 'On a hit, the target makes a Con save (DC 8 + the ability modifier you attacked with + proficiency) or falls prone.',
  Vex: 'On a hit that deals damage, you have advantage on your next attack against that target before the end of your next turn.'
};
const MASTERY_N = { barbarian: [[1, 2], [4, 3], [10, 4]], fighter: [[1, 3], [4, 4], [10, 5], [16, 6]], paladin: [[1, 2]], ranger: [[1, 2]], rogue: [[1, 2]] };
function masteryCount(h, lv) { const t = MASTERY_N[h.cls]; if (!t) return 0; let n = 0; for (const [at, k] of t) if (lv >= at) n = k; return n; }

const raceTable = (h) => (is24(h) ? RACES24 : RACES5);
const bgTable = (h) => (is24(h) ? BGS24 : BGS);
function raceOf(h) { const T2 = raceTable(h); return T2[h.race] || T2.human; }
function bgOf(h) { const T2 = bgTable(h); return T2[h.bg] || T2.soldier; }
const raceOk = (k) => !!(RACES5[k] || RACES24[k]);
const subLv = (h, C) => (is24(h) ? 3 : C.sub[2]);
// the ability increases that come with a hero's origin: race in 2014, background in 2024
function originAsi(h) {
  const out = {};
  const add = (k, n) => { if (ABIL.includes(k)) out[k] = (out[k] || 0) + n; };
  if (is24(h)) {
    const B = bgOf(h), abil = B.abil || (h.bgAbil || []).filter((a) => ABIL.includes(a)).slice(0, 3);
    const A = h.bgAsi || {};
    if (A.mode === '111') abil.forEach((a) => add(a, 1));
    else { const two = abil.includes(A.two) ? A.two : abil[0], one = abil.includes(A.one) && A.one !== two ? A.one : abil.find((a) => a !== two); add(two, 2); add(one, 1); }
    return out;
  }
  const R = raceOf(h), S = raceSub(h);
  for (const k in R.asi) add(k, R.asi[k]);
  if (S && S.asi) for (const k in S.asi) add(k, S.asi[k]);
  if (R.asiPick) for (const a of (h.raceAsi || []).slice(0, R.asiPick)) if (a !== 'cha') add(a, 1);
  return out;
}
// origin feats a 2024 hero has: one from the background, and a second for humans
function feats24(h) {
  if (!is24(h)) return [];
  const B = bgOf(h), out = [];
  const bf = B.feat24 || (h.bg === 'custom' ? h.bgFeat || 'skilled' : null);
  if (bf) out.push({ k: bf, src: B.name + ' background', mi: B.mi || h.miList || 'w', slot: 'bg' });
  if (raceOf(h).feat) { const k = h.feat24 && h.feat24 !== bf ? h.feat24 : bf === 'skilled' ? 'alert' : 'skilled'; out.push({ k, src: 'Human (Versatile)', mi: h.miList2 || 'c', slot: 'race' }); }
  return out;
}
// switching rules: keep what still exists, fall back to sensible choices for the rest
function setRules(h, r) {
  if (h.rules === r || (r !== '2014' && r !== '2024')) return;
  h.rules = r;
  const T2 = raceTable(h);
  if (!T2[h.race]) h.race = ({ halforc: 'orc', orc: 'halforc', goliath: 'human', halfelf: 'human' })[h.race] || 'human';
  if (!T2[h.race]) h.race = 'human';
  if (!bgTable(h)[h.bg]) h.bg = ({ fighter: 'soldier', barbarian: 'soldier', paladin: 'soldier', ranger: 'soldier', rogue: 'criminal', monk: 'criminal', cleric: 'acolyte', druid: 'acolyte' })[h.cls] || 'sage';
  h.sub = ''; h.raceAsi = []; h.raceSkills = []; h.raceLangs = []; h.raceCantrip = ''; h.tool = '';
  h.bgSkills = []; h.bgLangs = []; h.bgSwap = {}; h.removed = h.removed.filter((k) => !k.startsWith('b'));
  if (r === '2024') { h.exh = Math.min(h.exh || 0, 6); }
  // class choices that differ between the editions
  if (h.subclass && !subsOf(h).includes(h.subclass)) { h.subclass = ''; h.subNotes = ''; }
  h.invocations = (h.invocations || []).filter((k) => invoTab(h)[k]); h.pact = r === '2024' ? '' : h.pact;
  h.metamagic = (h.metamagic || []).filter((k) => metaTab(h)[k]);
  if (h.style && CLS(h).style && !CLS(h).style[1].includes(h.style)) h.style = '';
  h.kit = {}; h.picks = {}; h.goldRoll = 0;
  heroes.defRules = r;
}
// the Basics-step pieces that only the 2024 rules have
function basics24Html(h, D) {
  if (!is24(h)) return '';
  const B = bgOf(h), abil = B.abil || (h.bgAbil || []);
  const A = h.bgAsi || {};
  let o = '<div class="field"><span class="lab">Ability increases from your background</span><div class="seg" role="group">' + [['21', '+2 and +1'], ['111', '+1 to all three']].map(([k, l]) => '<button type="button" data-hr="basimode" data-v="' + k + '" aria-pressed="' + ((A.mode || '21') === k) + '">' + l + '</button>').join('') + '</div></div>';
  if (h.bg === 'custom') o += '<div class="field"><span class="lab">Three abilities (' + abil.length + '/3)</span><div class="chips">' + ABIL.map((a) => chip('babil', a, ABIL_S[a], abil.includes(a))).join('') + '</div></div>';
  if ((A.mode || '21') === '21' && abil.length === 3) {
    const oa = originAsi(h), two = ABIL.find((a) => oa[a] === 2), one = ABIL.find((a) => oa[a] === 1);
    o += '<div class="row2">' + fieldSel('hc-basi2', '+2 to', abil.map((a) => [a, ABIL_N[a]]), two) + fieldSel('hc-basi1', '+1 to', abil.filter((a) => a !== two).map((a) => [a, ABIL_N[a]]), one) + '</div>';
  }
  if (h.bg === 'custom') o += fieldSel('hc-bgfeat', 'Origin feat', Object.keys(FEATS24).map((k) => [k, FEATS24[k][0]]), h.bgFeat || 'skilled');
  if (raceOf(h).feat) o += fieldSel('hc-feat24', 'Human Versatile: a second origin feat', Object.keys(FEATS24).filter((k) => k !== (B.feat24 || h.bgFeat || 'skilled')).map((k) => [k, FEATS24[k][0]]), feats24(h)[1] ? feats24(h)[1].k : '');
  for (const f of feats24(h)) {
    o += '<p class="small"><b>' + FEATS24[f.k][0] + '</b> <small>(' + esc(f.src) + ')</small>: ' + esc(FEATS24[f.k][1]) + '</p>';
    if (f.k === 'mi') {
      const key = f.slot === 'race' ? 'mi2' : 'mi', M = h[key] || {}, list = f.mi;
      if (h.bg === 'custom' || f.slot === 'race') o += fieldSel('hc-' + key + 'list', 'Magic Initiate list', Object.keys(MI_LIST).map((k) => [k, MI_LIST[k]]), list);
      o += '<div class="field"><span class="lab">Two ' + MI_LIST[list].toLowerCase() + ' cantrips (' + (M.cant || []).length + '/2)</span><div class="chips">' + SPELLS.filter((s) => s.lv === 0 && spellCls(h, s).includes(list)).map((s) => chip(key + 'cant', s.name, s.name, (M.cant || []).includes(s.name))).join('') + '</div></div>';
      o += '<div class="row2">' + fieldSel('hc-' + key + 'spell', '1st-level spell', [['', 'Choose…']].concat(SPELLS.filter((s) => s.lv === 1 && spellCls(h, s).includes(list)).map((s) => [s.name, s.name])), M.spell || '') + fieldSel('hc-' + key + 'ab', 'Spellcasting ability', [['int', 'Intelligence'], ['wis', 'Wisdom'], ['cha', 'Charisma']], M.ab || (list === 'w' ? 'int' : 'wis')) + '</div>';
    }
    if (f.k === 'skilled') o += '<div class="field"><span class="lab">Three skills (' + (h.skilled || []).length + '/3)</span><div class="chips">' + ALL_SKILLS.map((s) => chip('skilled', s, s, (h.skilled || []).includes(s))).join('') + '</div></div>';
  }
  return o;
}
function rulesNoteHtml(h) {
  return '<div class="field"><span class="lab">Rules</span><div class="seg" role="group">' + [['2014', '2014 (SRD 5.1)'], ['2024', '2024 (SRD 5.2)']].map(([k, l]) => '<button type="button" data-hr="rules" data-v="' + k + '" aria-pressed="' + ((h.rules || '2014') === k) + '">' + l + '</button>').join('') + '</div>' +
    (is24(h) ? '<p class="small rules-note">2024 rules: species give no ability increases (your background does), backgrounds grant an origin feat, martial classes use weapon mastery, exhaustion is −2 per level to d20 tests and −5 ft speed, and every subclass starts at level 3. Classes use their 2024 features, spell counts, starting kits and a level 19 epic boon. Spell lists follow SRD 5.2. Only free SRD 5.2 subclasses are built in. ' + srdLink() + '</p>' : '<p class="small rules-note">The 2014 rules (SRD 5.1, plus Player\'s Handbook summaries). Switch to 2024 to use the newer free rules.</p>') + '</div>';
}
const srdLink = () => '<a class="ext" href="' + SRD52 + '" target="_blank" rel="noopener noreferrer">SRD 5.2 rules<span aria-hidden="true"> ↗</span><span class="vh"> (opens the free rules in a new tab)</span></a>';
const BG24_FOR = { fighter: 'soldier', barbarian: 'soldier', paladin: 'soldier', ranger: 'soldier', rogue: 'criminal', monk: 'criminal', cleric: 'acolyte', druid: 'acolyte', bard: 'acolyte', sorcerer: 'sage', warlock: 'sage', wizard: 'sage' };
// sensible 2024 choices for "fill in the rest" and quick build
function autoFill24(h, Q) {
  const B = bgOf(h);
  if (h.bg === 'custom') { h.bgAbil = (h.bgAbil || []).filter((a) => ABIL.includes(a)); for (const a of Q[1]) if (h.bgAbil.length < 3 && !h.bgAbil.includes(a)) h.bgAbil.push(a); if (!h.bgFeat) h.bgFeat = 'skilled'; }
  const abil = B.abil || h.bgAbil, A = Object.assign({ mode: '21' }, h.bgAsi);
  if (A.mode === '21' && !(abil.includes(A.two) && abil.includes(A.one) && A.one !== A.two)) { const ord = Q[1].filter((a) => abil.includes(a)); A.two = ord[0]; A.one = ord[1]; }
  h.bgAsi = A;
  if (raceOf(h).feat && !h.feat24) h.feat24 = (B.feat24 || h.bgFeat) === 'skilled' ? 'alert' : 'skilled';
  const C = CLASSES5[h.cls];
  for (const f of feats24(h)) {
    if (f.k !== 'mi') continue;
    const key = f.slot === 'race' ? 'mi2' : 'mi', M = Object.assign({ cant: [] }, h[key]), reco = RECO[f.mi] || [];
    const pool = (lv) => reco.filter((n) => (SPELL_BY.get(n) || {}).lv === lv && spellCls(h, SPELL_BY.get(n)).includes(f.mi)).concat(SPELLS.filter((s) => s.lv === lv && spellCls(h, s).includes(f.mi)).map((s) => s.name));
    M.cant = (M.cant || []).slice(); for (const n of pool(0)) if (M.cant.length < 2 && !M.cant.includes(n) && !(h.cantrips || []).includes(n)) M.cant.push(n);
    if (!M.spell) M.spell = pool(1).find((n) => !(h.spells || []).includes(n)) || '';
    if (!M.ab) M.ab = C.cast && ['int', 'wis', 'cha'].includes(C.cast.ab) ? C.cast.ab : f.mi === 'w' ? 'int' : 'wis';
    h[key] = M;
  }
}
