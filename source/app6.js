
// ================================================================ people: residents, relationships, activities
const people = { sid: null, tab: 'residents', npc: null, group: 'all', q: '', place: null, hcats: null, heat: true };
const LIFESTYLE = [['Wretched', 'nothing'], ['Squalid', '1 sp a day'], ['Poor', '2 sp a day'], ['Modest', '1 gp a day'], ['Comfortable', '2 gp a day'], ['Wealthy', '4 gp a day'], ['Aristocratic', '10 gp or more a day']];
// groups double as the seed of future guilds: each names the organisation its members belong to
const GROUPS = {
  leader: { name: 'Rulers & gentry', org: 'The ruling household' },
  faith: { name: 'Faith', org: 'The temple' },
  watch: { name: 'Watch & soldiers', org: 'The watch' },
  craft: { name: 'Craftsfolk', org: 'Craft guild' },
  trade: { name: 'Merchants', org: "Merchants' guild" },
  service: { name: 'Inns, taverns & services', org: 'Victuallers' },
  labour: { name: 'Farmers & labourers', org: null },
  arcane: { name: 'Arcane', org: "Mages' circle" },
  underworld: { name: 'Underworld', org: "Thieves' guild" },
  adventurer: { name: 'Adventurers', org: "Adventurers' Guild" }
};
const GROUP_KEYS = Object.keys(GROUPS);
// title, group, lifestyle (0-6), SRD stat block
const LEADERS = {
  1: [['Village reeve', 'leader', 3, 'Commoner'], ['Village priest', 'faith', 2, 'Acolyte'], ['Ale-house keeper', 'service', 3, 'Commoner'], ['Miller', 'craft', 3, 'Commoner'], ['Blacksmith', 'craft', 3, 'Commoner']],
  2: [['Mayor', 'leader', 4, 'Noble'], ['Captain of the watch', 'watch', 4, 'Veteran'], ['Priest', 'faith', 3, 'Priest'], ['Innkeeper', 'service', 3, 'Commoner'], ['Merchant', 'trade', 4, 'Commoner'], ['Master of the craft guilds', 'craft', 4, 'Commoner']],
  3: [['Lord of the city', 'leader', 6, 'Noble'], ['Steward', 'leader', 5, 'Noble'], ['Captain of the watch', 'watch', 4, 'Veteran'], ['High priest', 'faith', 5, 'Priest'], ["Master of the merchants' guild", 'trade', 5, 'Noble'], ['City wizard', 'arcane', 5, 'Mage'], ['Master of the craft guilds', 'craft', 4, 'Commoner']],
  4: [['Sovereign of the realm', 'leader', 6, 'Noble'], ['Chancellor', 'leader', 6, 'Noble'], ['Marshal of the army', 'watch', 5, 'Knight'], ['Archpriest', 'faith', 5, 'Priest'], ['Master of coin', 'trade', 6, 'Noble'], ['Royal magus', 'arcane', 5, 'Mage'], ['Captain of the city watch', 'watch', 4, 'Veteran'], ["Master of the merchants' guild", 'trade', 5, 'Noble']]
};
const TRADE_JOB = { Taverns: ['Tavern keeper', 'service'], Inns: ['Innkeeper', 'service'], Bathhouses: ['Bathhouse keeper', 'service'], Barbers: ['Barber', 'service'], 'Water-carriers': ['Water-carrier', 'service'], 'Magic shops': ['Magic shop owner', 'arcane'], Physicians: ['Physician', 'service'], Mercers: ['Mercer', 'trade'], 'Spice merchants': ['Spice merchant', 'trade'], 'Wine-sellers': ['Wine-seller', 'trade'], 'Beer-sellers': ['Beer-seller', 'trade'], Booksellers: ['Bookseller', 'trade'], Fishmongers: ['Fishmonger', 'trade'], Jewellers: ['Jeweller', 'craft'], Pastrycooks: ['Pastrycook', 'craft'], Butchers: ['Butcher', 'craft'], Bakers: ['Baker', 'craft'] };
const COMMON = [['Farmer', 'labour', 2, 'Commoner', 30], ['Labourer', 'labour', 1, 'Commoner', 14], ['Servant', 'service', 2, 'Commoner', 10], ['Shepherd', 'labour', 2, 'Commoner', 5], ['Carter', 'labour', 2, 'Commoner', 4], ['Guard', 'watch', 2, 'Guard', 6], ['Acolyte', 'faith', 2, 'Acolyte', 3], ['Scribe', 'service', 3, 'Commoner', 2], ['Midwife', 'service', 2, 'Commoner', 2], ['Herbalist', 'service', 2, 'Commoner', 2], ['Bard', 'service', 2, 'Commoner', 1.5], ['Beggar', 'labour', 0, 'Commoner', 3], ['Street urchin', 'labour', 0, 'Commoner', 2], ['Retired adventurer', 'watch', 3, 'Veteran', 0.8], ['Hedge witch', 'arcane', 2, 'Cult Fanatic', 0.8], ['Soldier', 'watch', 2, 'Guard', 2]];
const BIOME_JOBS = { coast: [['Fisher', 'labour', 2, 'Commoner', 12], ['Sailor', 'labour', 2, 'Commoner', 6]], 14: [['Miner', 'labour', 2, 'Commoner', 14]], 15: [['Miner', 'labour', 2, 'Commoner', 10]], 6: [['Woodcutter', 'labour', 2, 'Commoner', 8], ['Hunter', 'labour', 2, 'Scout', 5]], 7: [['Trapper', 'labour', 2, 'Scout', 9]], 8: [['Hunter', 'labour', 2, 'Scout', 6]], 10: [['Caravan guide', 'trade', 3, 'Scout', 6]], 9: [['Eel-catcher', 'labour', 1, 'Commoner', 8]], 5: [['Horse breeder', 'trade', 3, 'Commoner', 3]] };
// underworld: secret trade, public cover
const SHADY = [['Fence', 'Pawnbroker', 3, 'Spy', 3], ['Pickpocket', 'Street urchin', 1, 'Spy', 4], ['Smuggler', 'Sailor', 2, 'Bandit', 2], ['Cultist', 'Acolyte', 2, 'Cultist', 1.5], ['Forger', 'Scribe', 3, 'Spy', 1], ['Thug for hire', 'Labourer', 1, 'Thug', 3], ['Assassin', 'Courier', 3, 'Assassin', 0.4], ["Master of the thieves' guild", 'Moneylender', 5, 'Bandit Captain', 0.15]];
const FIRST = {
  Human: [['Aldric', 'Bram', 'Cedric', 'Doran', 'Edric', 'Fenwick', 'Garrick', 'Hal', 'Ivor', 'Jory', 'Kellan', 'Lucan', 'Marek', 'Ned', 'Osric', 'Piers', 'Rolf', 'Silas', 'Tobin', 'Ulric', 'Wat', 'Yorick', 'Godwin', 'Anselm'], ['Ada', 'Bertha', 'Celia', 'Dora', 'Elsbeth', 'Freya', 'Gwen', 'Hilda', 'Isolde', 'Joan', 'Kate', 'Lysa', 'Maud', 'Nell', 'Odette', 'Petra', 'Rosamund', 'Sabine', 'Tilda', 'Una', 'Wenna', 'Agnes', 'Mirabel', 'Edith']],
  Dwarf: [['Bodrik', 'Grundal', 'Haldrek', 'Korrin', 'Morgrim', 'Torvek', 'Vonrik', 'Baldric', 'Durgan', 'Skorri'], ['Brunna', 'Dagny', 'Helka', 'Ingra', 'Marta', 'Sigrun', 'Thyra', 'Vala', 'Gerdi', 'Rusla']],
  Elf: [['Caelith', 'Faelan', 'Sorien', 'Valen', 'Aranel', 'Ithrin', 'Talanis', 'Erevan', 'Lorien', 'Thessar'], ['Ilyra', 'Nimriel', 'Elowen', 'Syllin', 'Merileth', 'Ysolde', 'Aeris', 'Vaelith', 'Sharessa', 'Lia']],
  Halfling: [['Pip', 'Tobble', 'Wilber', 'Cobb', 'Fennel', 'Bramble', 'Hob', 'Teodor', 'Barnaby', 'Rufus'], ['Rosie', 'Lavinia', 'Dilly', 'Posy', 'Marigold', 'Tansy', 'Primrose', 'Bree', 'Hettie', 'Clover']],
  Gnome: [['Fizzwick', 'Bimble', 'Zook', 'Quill', 'Nackle', 'Pemble', 'Orrin', 'Tibbet'], ['Tink', 'Orla', 'Wrennet', 'Nyssa', 'Pockle', 'Zanna', 'Bellis', 'Mirri']],
  'Half-orc': [['Grask', 'Krug', 'Gorrim', 'Brakka', 'Ruzg', 'Hargo', 'Dorn', 'Varg'], ['Dura', 'Murza', 'Ugra', 'Varga', 'Sholla', 'Kesh', 'Ronna', 'Brima']],
  Dragonborn: [['Arzhan', 'Rhorin', 'Tazir', 'Korrash', 'Vesh', 'Durhan', 'Ixen', 'Mozrak'], ['Kava', 'Saphra', 'Zyrra', 'Thessa', 'Irixa', 'Vahla', 'Sora', 'Nadrix']],
  Tiefling: [['Mercy', 'Ember', 'Vex', 'Ruin', 'Solace', 'Malachi', 'Corvin', 'Ash'], ['Nyx', 'Lament', 'Kallista', 'Sorrow', 'Vespera', 'Hope', 'Lilith', 'Temper']]
};
const SURN = {
  Human: ['Ashdown', 'Barrow', 'Cooper', 'Fletcher', 'Thatcher', 'Miller', 'Hale', 'Wren', 'Marsh', 'Penrose', 'Tanner', 'Carter', 'Bell', 'Holloway', 'Crane', 'Fairweather', 'Greaves', 'Mercer', 'Whitlock', 'Draper', 'Lark', 'Pike', 'Rook', 'Thorne', 'Blackwood', 'Hollis'],
  Dwarf: ['Ironhand', 'Stonebrow', 'Deepdelve', 'Coppervein', 'Hammerfall', 'Granitebeard', 'Ashforge', 'Flintgrip'],
  Elf: ['Moonbrook', 'Silverleaf', 'Dawnwhisper', 'Starfall', 'Nightbloom', 'Willowshade', 'Mistvale', 'Sunthread'],
  Halfling: ['Goodbarrel', 'Tealeaf', 'Thistletoe', 'Applewick', 'Hilltopple', 'Butterbur', 'Quickfoot', 'Honeypot'],
  Gnome: ['Gearspring', 'Copperkettle', 'Puddlefoot', 'Brightspanner', 'Fizzlebang', 'Tumbledown'],
  'Half-orc': ['of the Broken Tusk', 'Ironjaw', 'Bloodmoon', '', '', ''],
  Dragonborn: ['Vothrak', 'Skaryn', 'Ithrazar', 'Kerrhyl', 'Drusath'],
  Tiefling: ['', '', 'Ashveil', 'Morrow', 'Vane']
};
FIRST['Half-elf'] = [FIRST.Human[0].concat(FIRST.Elf[0]), FIRST.Human[1].concat(FIRST.Elf[1])];
SURN['Half-elf'] = SURN.Human.concat(SURN.Elf);
function uniqueName(p, clash) {
  const fn = FIRST[p.race] || FIRST.Human;
  for (let t = 0; t < 8 && clash(p.first, p.last || ''); t++) {
    const pool = (p.fem ? fn[1] : fn[0]).concat(NAME_EXTRA[p.race] ? NAME_EXTRA[p.race][p.fem ? 1 : 0] : []);
    p.first = pool[Math.floor(T.hash(p.h, t, 977) * pool.length)];
    if (t >= 2) { const sp = (SURN[p.race] || SURN.Human).filter(Boolean).concat(NAME_EXTRA[p.race] ? NAME_EXTRA[p.race][2] : []); if (!p.last || t >= 5) p.last = sp[Math.floor(T.hash(p.h, t, 978) * sp.length)] || p.last || ''; }
  }
  return p;
}
// extra names used only to break ties when two residents would share a name
const NAME_EXTRA = {
  Human: [['Alaric', 'Benedict', 'Conrad', 'Dunstan', 'Eustace', 'Gervase', 'Hugh', 'Lambert', 'Odo', 'Ranulf', 'Simon', 'Walter'], ['Agnes', 'Beatrix', 'Cecily', 'Edith', 'Godiva', 'Isolde', 'Joan', 'Mabel', 'Matilda', 'Petronel', 'Sabine', 'Ysmay'], ['Bracken', 'Collier', 'Dyer', 'Fowler', 'Hayward', 'Mercer', 'Sawyer', 'Webb']],
  Dwarf: [['Brokk', 'Dain', 'Frerin', 'Gimrek', 'Thorgar', 'Ulfgar'], ['Audhild', 'Eldeth', 'Gunnloda', 'Hlin', 'Riswynn', 'Vistra'], ['Battlehammer', 'Fireforge', 'Holderhek', 'Loderr', 'Rumnaheim', 'Torunn']],
  Elf: [['Adran', 'Galinndan', 'Heian', 'Immeral', 'Quarion', 'Riardon'], ['Adrie', 'Birel', 'Drusilia', 'Enna', 'Keyleth', 'Sariel'], ['Amakiir', 'Galanodel', 'Holimion', 'Liadon', 'Meliamne', 'Siannodel']],
  Halfling: [['Alton', 'Cade', 'Eldon', 'Garret', 'Lyle', 'Merric'], ['Andry', 'Bree', 'Callie', 'Kithri', 'Merla', 'Seraphina'], ['Brushgather', 'Greenbottle', 'Highhill', 'Tosscobble', 'Underbough', 'Tealeaf']],
  Gnome: [['Alston', 'Boddynock', 'Dimble', 'Frug', 'Gimble', 'Warryn'], ['Bimpnottin', 'Caramip', 'Ellyjobell', 'Nissa', 'Roywyn', 'Zanna'], ['Beren', 'Daergel', 'Folkor', 'Garrick', 'Nackle', 'Scheppen']],
  'Half-orc': [['Dench', 'Feng', 'Gell', 'Holg', 'Imsh', 'Thokk'], ['Baggi', 'Emen', 'Engong', 'Kansif', 'Myev', 'Sutha'], ['Skullsplitter', 'Grimtooth', 'Ashfang', 'Redmaw']],
  Dragonborn: [['Balasar', 'Ghesh', 'Heskan', 'Kriv', 'Medrash', 'Nadarr'], ['Akra', 'Biri', 'Daar', 'Harann', 'Kava', 'Sora'], ['Clethtinthiallor', 'Delmirev', 'Kepeshkmolik', 'Myastan', 'Yarjerit']],
  Tiefling: [['Akmenos', 'Damakos', 'Ekemon', 'Kairon', 'Leucis', 'Mordai'], ['Akta', 'Bryseis', 'Criella', 'Ea', 'Nemeia', 'Rieta'], ['Hope', 'Torment', 'Glory', 'Reverie', 'Quill']],
  'Half-elf': [['Corin', 'Erevan', 'Laucian', 'Peren', 'Thamior', 'Varis'], ['Antinua', 'Jelenneth', 'Naivara', 'Quelenna', 'Shava', 'Valanthe'], ['Brightwood', 'Evenwood', 'Greycastle', 'Rivers']]
};
const AGE = { Human: [16, 75, 16], Dwarf: [40, 320, 50], Elf: [100, 650, 110], Halfling: [20, 140, 20], Gnome: [40, 380, 40], 'Half-elf': [20, 170, 20], 'Half-orc': [14, 65, 14], Dragonborn: [15, 75, 15], Tiefling: [16, 95, 16] };
const TRAITS = ['Laughs too loudly at their own jokes', 'Never forgets a slight', 'Generous to a fault', 'Suspicious of strangers', 'Talks endlessly about the weather', 'Quietly observant', 'Quick to anger, quick to forgive', 'Deeply superstitious', 'Proud of their work', 'Gossips about everyone', 'Calm in a crisis', 'Hates being idle', 'Flatters anyone with money', 'Blunt to the point of rudeness', 'Fussy and precise', 'Daydreams about faraway places', 'Fiercely loyal to family', 'Collects odd trinkets', 'Sings while working', 'Always hungry'];
const IDEALS = ['Tradition: the old ways keep us safe', 'Charity: help those who cannot help themselves', 'Wealth: coin buys freedom', 'Faith: the gods reward the patient', 'Independence: answer to no one', 'Community: the town comes first', 'Honour: a promise is a promise', 'Ambition: rise above your station', 'Knowledge: learn everything', 'Fairness: everyone deserves a fair price', 'Power: the strong decide', 'Family: blood above all'];
const FLAWS = ['Drinks too much', 'Cannot keep a secret', 'Greedy', 'Cowardly when it counts', 'Holds grudges for years', 'Gambles away their wages', 'Jealous of others\' success', 'Lies to avoid trouble', 'Arrogant', 'Easily flattered', 'Reckless', 'Trusts the wrong people'];
const QUIRKS = ['Missing two fingers', 'Smells of pipe smoke', 'Speaks in a whisper', 'Wears a lucky charm', 'Has a nervous laugh', 'Burn scar on one arm', 'Always chewing something', 'Dresses above their means', 'Bites their nails', 'Hums old songs', 'Walks with a limp', 'Piercing stare', 'Ink-stained hands', 'Keeps a pet crow', 'Very tall and stooped', 'Braided beard or hair with beads'];
const SECRETS = ['Skims coins from their employer', 'Was once a bandit', 'Is in love with someone they should not be', 'Owes money to dangerous people', 'Saw a murder and said nothing', 'Has a child no one knows about', 'Worships a forbidden god', 'Is not who they claim to be', 'Hid a treasure map under the floor', 'Informs for the watch', 'Poisoned a rival years ago', 'Is secretly very rich', 'Fled a noble family', 'Can cast a single spell'];
const REL = {
  spouse: ['Married to', 'Married to', 'family'], parent: ['Parent of', 'Child of', 'family'], sibling: ['Sibling of', 'Sibling of', 'family'],
  employer: ['Employs', 'Works for', 'work'], mentor: ['Mentor to', 'Apprentice of', 'work'],
  friend: ['Friends with', 'Friends with', 'friend'],
  rival: ['Rival of', 'Rival of', 'conflict'], enemy: ['Enemy of', 'Enemy of', 'conflict'], debt: ['Is owed money by', 'Owes money to', 'conflict'],
  lover: ['Secret lover of', 'Secret lover of', 'secret'], blackmail: ['Blackmailing', 'Blackmailed by', 'secret']
};
const REL_GROUPS = [['family', 'Family', '#3987e5'], ['work', 'Work', '#d95926'], ['friend', 'Friendship', '#199e70'], ['conflict', 'Conflict', '#c98500'], ['secret', 'Secret', '#d55181']];
const RGCOL = Object.fromEntries(REL_GROUPS.map((g) => [g[0], g[2]]));
const STATUS = ['Alive', 'Travelling', 'Missing', 'Imprisoned', 'Dead'];

// ---------------------------------------------------------------- generation (deterministic per town)
const townCache = new Map();
function peopleInvalidate() { townCache.clear(); leadCache.clear(); }
function baseCount(s) { return clamp(Math.round(6 + Math.sqrt(s.pop) * 0.55), 8, 60); }
function npcCount(s) { const more = (edits.npcMore || {})[s.id] || 0; return Math.min(baseCount(s) + more, Math.max(8, Math.min(400, s.pop))); }
function pickW(rng, list, wi) { let t = 0; for (const x of list) t += x[wi]; let r = rng() * t; for (const x of list) { r -= x[wi]; if (r <= 0) return x; } return list[list.length - 1]; }
// limit generates only the first few residents (the leaders); they are identical to the full run
const leadCache = new Map();
function townPeople(s, limit) {
  const n = limit ? Math.min(limit, npcCount(s)) : npcCount(s);
  const key = s.id + '|' + s.name + '|' + s.pop + '|' + s.tier + '|' + n + '|' + mkVer;
  const cache = limit ? leadCache : townCache;
  const c = cache.get(s.id);
  if (c && c.key === key) return c;
  const P = profile(s);
  const rng = T.mulberry(hashStr(s.id) ^ (SEED * 2654435761));
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const races = P.races.filter((r) => r[1] > 0).map((r) => [r[0], r[1]]);
  if (P.other > 0) for (const r of ['Dragonborn', 'Tiefling', 'Gnome', 'Half-elf']) if (!races.some((q) => q[0] === r)) races.push([r, P.other / 4]);
  const trades = P.trades.map(([nm, cnt]) => { const tj = TRADE_JOB[nm]; return [tj ? tj[0] : nm.replace(/s$/, '').replace(/ie$/, 'y'), tj ? tj[1] : 'craft', cnt]; });
  const common = COMMON.concat(P.coastal ? BIOME_JOBS.coast : [], BIOME_JOBS[P.b] || []).map((j) => [j[0], j[1], j[2], j[3], j[4] * (j[1] === 'labour' ? [0, 1.6, 1, 0.7, 0.6][s.tier] : 1)]);
  const shadyShare = [0, 0.04, 0.07, 0.1, 0.11][s.tier];
  const leaders = LEADERS[s.tier];
  const list = [], rels = [];
  for (let i = 0; i < n; i++) {
    let job, group, life, stat, secretJob = null;
    if (i < leaders.length) {
      [job, group, life, stat] = leaders[i];
      if (s.pop < 300) job = { 'Village reeve': 'Hamlet elder', 'Village priest': 'Shrine-keeper', 'Ale-house keeper': P.trades.some((t) => t[0] === 'Taverns') ? 'Ale-house keeper' : 'Home brewer' }[job] || job;
      else if (s.tier === 2 && job === 'Mayor' && T.hash(hashStr(s.id) & 0x7fffffff, 1, 1605) >= 0.5) job = 'Lord of the town';
    }
    else {
      const r = rng();
      if (r < shadyShare) {
        const sh = pickW(rng, SHADY.filter((x) => s.tier >= 3 || x[4] >= 1), 4);
        secretJob = sh[0]; job = sh[1]; group = 'underworld'; life = sh[2]; stat = sh[3];
      } else if (r < (s.tier === 1 ? 0.2 : 0.5) && trades.length) {
        const tj = pickW(rng, trades, 2);
        job = tj[0]; group = tj[1]; stat = 'Commoner';
        const sv = (TRADES.find((t) => t[0] === tj[0] + 's') || [0, 800])[1];
        life = /Jeweller|Mercer|Magic|Spice/.test(job) ? 4 : sv < 500 ? 2 : sv < 1600 ? 3 : 4;
      } else { const cj = pickW(rng, common, 4); [job, group, life, stat] = cj; if (s.pop < 300 && (job === 'Guard' || job === 'Soldier')) { job = 'Woodsman'; group = 'labour'; stat = 'Commoner'; } }
    }
    const race = pickW(rng, races, 1)[0];
    const fem = rng() < 0.5;
    const A = AGE[race] || AGE.Human;
    let age = Math.round(A[0] + (A[1] - A[0]) * Math.pow(rng(), 1.4));
    if (job === 'Street urchin') age = Math.max(9, Math.round(A[0] * 0.6 + rng() * 4));
    if (i < leaders.length) age = Math.max(age, Math.round(A[0] + A[2] * 0.7));
    const fn = FIRST[race] || FIRST.Human;
    const p = {
      id: s.id + '#' + i, idx: i, sid: s.id, race, fem, age, job, group, secretJob, life: clamp(life + (rng() < 0.15 ? 1 : 0) - (rng() < 0.15 ? 1 : 0), 0, 6), stat,
      first: pick(fem ? fn[1] : fn[0]), last: pick(SURN[race] || SURN.Human),
      trait: pick(TRAITS), ideal: pick(IDEALS), flaw: pick(FLAWS), quirk: pick(QUIRKS), secret: pick(SECRETS),
      disp0: Math.round((rng() - 0.5) * 30 - (group === 'underworld' ? 10 : 0) + (group === 'service' || group === 'trade' ? 6 : 0)),
      h: hashStr(s.id + '#' + i) & 0x7fffffff, motive: ''
    };
    // family ties to someone already in town
    if (i > 0 && rng() < 0.34) {
      const pool = list.filter((q) => q.race === race && q.job !== 'Street urchin');
      if (pool.length) {
        const q = pool[Math.floor(rng() * pool.length)];
        const gap = A[2] * 1.15;
        if (p.age - q.age >= gap) { rels.push({ a: i, b: q.idx, type: 'parent' }); p.last = q.last; }
        else if (q.age - p.age >= gap) { rels.push({ a: q.idx, b: i, type: 'parent' }); p.last = q.last; }
        else if (!rels.some((r) => r.type === 'spouse' && (r.a === q.idx || r.b === q.idx)) && Math.abs(p.age - q.age) < gap && rng() < 0.6 && p.age >= A[0] + 2) { rels.push({ a: q.idx, b: i, type: 'spouse' }); if (rng() < 0.6) p.last = q.last; }
        else { rels.push({ a: q.idx, b: i, type: 'sibling' }); p.last = q.last; }
      }
    }
    // nobody in town shares a full name with an earlier resident: re-pick the first name from a hash, not the stream, so later residents never change
    uniqueName(p, (f, l) => list.some((q) => q.first === f && (q.last || '') === l));
    // other ties
    const k = i === 0 ? 0 : rng() < 0.3 ? 0 : rng() < 0.7 ? 1 : 2;
    for (let t = 0; t < k; t++) {
      const q = list[Math.floor(rng() * list.length)];
      if (!q || rels.some((r) => (r.a === q.idx && r.b === i) || (r.b === q.idx && r.a === i))) continue;
      const sameGroup = q.group === group;
      const opts = [['friend', 32], ['rival', sameGroup ? 26 : 7], ['debt', 11], ['enemy', 6], ['lover', 6], ['blackmail', group === 'underworld' || q.group === 'underworld' ? 9 : 3],
        ['mentor', sameGroup && q.age > p.age + A[2] * 0.5 ? 18 : 0], ['employer', (q.group === 'craft' || q.group === 'trade' || q.group === 'service' || q.group === 'leader') && q.life > p.life ? 16 : 0]];
      const type = pickW(rng, opts, 1)[0];
      if (type === 'mentor' || type === 'employer') rels.push({ a: q.idx, b: i, type });
      else if (type === 'debt') rels.push(q.life >= p.life ? { a: q.idx, b: i, type } : { a: i, b: q.idx, type });
      else if (type === 'blackmail') rels.push(group === 'underworld' || rng() < 0.5 ? { a: i, b: q.idx, type } : { a: q.idx, b: i, type });
      else rels.push({ a: q.idx, b: i, type });
    }
    // what drives them (only uses ties made so far, so it never changes when more residents appear)
    const mine = rels.filter((r) => r.a === i || r.b === i);
    const other = (r) => list[r.a === i ? r.b : r.a];
    const pref = [];
    for (const r of mine) {
      const o = other(r); if (!o) continue;
      const on = o.first + ' ' + (o.last || '');
      if (r.type === 'rival') pref.push('Outdo ' + on + ' and win over their customers');
      if (r.type === 'debt' && r.b === i) pref.push('Pay back ' + on + ' before the debt turns ugly');
      if (r.type === 'debt' && r.a === i) pref.push('Collect what ' + on + ' owes, one way or another');
      if (r.type === 'lover') pref.push('Keep the affair with ' + on + ' hidden');
      if (r.type === 'enemy') pref.push('See ' + on + ' ruined');
      if (r.type === 'blackmail' && r.b === i) pref.push('Find leverage against ' + on + ' to end the blackmail');
      if (r.type === 'parent' && r.a === i) pref.push('Secure a good future for ' + on);
    }
    const gm = {
      leader: ['Keep order and the taxes flowing', 'Win favour at the capital', 'Root out a plot against them'],
      faith: ['Raise money to repair the temple', 'Convert the doubters', 'Find a relic lost long ago'],
      watch: ['Make captain one day', 'Catch the thief who has been plaguing the market', 'Keep their head down until retirement'],
      craft: ['Become a guild master', 'Make a masterpiece worthy of a lord', 'Find a reliable apprentice'],
      trade: ['Open a second shop', 'Corner the market in ' + (P.exp[0] || 'grain').toLowerCase(), 'Find a safe road for their caravans'],
      service: ['Save enough to buy the building', 'Hear every secret in town', 'Keep the troublemakers out'],
      labour: ['Earn enough to feed the family through winter', 'Buy a plot of land of their own', 'Leave this town for something better'],
      arcane: ['Learn a spell no one else knows', 'Acquire a rare spellbook', 'Prove the old wizard wrong'],
      underworld: ['Pull off one big score and retire', 'Climb the ranks of the guild', 'Stay one step ahead of the watch']
    }[group];
    const lm = i < leaders.length ? ({
      leader: s.tier === 4 ? ['Secure the succession', 'Keep the great houses loyal', 'Refill an empty treasury', 'Win the next war with a neighbouring realm'] : ['Win favour at the capital', 'Keep order and the taxes flowing', 'Root out a plot against them'],
      watch: ['Purge corruption from the ranks', "Break the thieves' guild", 'Win glory in battle'],
      faith: ['Build a grand new temple', 'Root out heresy', "Win the ruler's ear"],
      trade: ['Bring every merchant under the guild', 'Win a royal charter for the guild', 'Ruin a rival trading house'],
      craft: ['Win a great commission for the guild', 'Stop cheap imports undercutting the guild', 'Pass the mastership to a worthy heir'],
      arcane: ['Uncover a lost spell', 'Keep dangerous magic out of the wrong hands', 'Be named court magus'],
      service: ['Keep the best tables for the right people', 'Hear every secret in town'], labour: gm, underworld: gm
    })[group] : null;
    p.motive = pref.length && rng() < 0.6 ? pick(pref) : pick(lm || gm);
    list.push(p);
  }
  const out = { key, list, rels, s };
  cache.set(s.id, out);
  if (cache.size > (limit ? 3000 : 40)) cache.delete(cache.keys().next().value);
  return out;
}
function npcById(id) {
  if (!id) return null;
  if (id.startsWith('cn')) { const c = (edits.npcAdd || []).find((q) => q.id === id); return c ? withOv(c) : null; }
  const k = id.lastIndexOf('#');
  const s = SBY.get(id.slice(0, k));
  if (!s) return null;
  const tail = id.slice(k + 1);
  const sn = edits.npcSnap && edits.npcSnap[id];
  if (tail.charAt(0) === 'a') { const R = roster(s); const a = R && R.list[+tail.slice(1)]; return a ? withOv(a) : sn ? withOv(sn) : null; }
  const tp = townPeople(s);
  const p = tp.list[+tail];
  return p ? withOv(p) : sn ? withOv(sn) : null;
}
function withOv(p) {
  const sn = edits.npcSnap && edits.npcSnap[p.id]; const base = sn && sn !== p ? Object.assign({}, p, sn) : p; const o = (edits.npc || {})[p.id];
  // history (app20) may have claimed people nobody has frozen yet; the DM's own status always wins
  const f = !sn && !(o && o.o && o.o.status) && base.status == null ? fateOf(base, market.day) : null;
  const b2 = f ? Object.assign({}, base, { status: 'Dead', fate: f.text, fateDay: f.day }) : base;
  return o ? Object.assign({}, b2, o.o || {}) : b2;
}
function npcName(p) { return (p.first + ' ' + (p.last || '')).trim(); }
function dispOf(p) { const o = (edits.npc || {})[p.id]; return o && o.disp != null ? o.disp : p.disp0; }
function attitude(d) { return d <= -35 ? ['Hostile', 'bad'] : d >= 35 ? ['Friendly', 'ok'] : ['Indifferent', '']; }
function tracked(p) { const o = (edits.npc || {})[p.id]; return !!(o && o.tracked); }
function residents(s) {
  const tp = townPeople(s);
  const R = roster(s);
  const list = tp.list.map(withOv).concat(R ? R.list.map(withOv) : [], (edits.npcAdd || []).filter((c) => c.sid === s.id).map(withOv));
  // frozen people the generator no longer makes (for example after a guild change) stay in town
  if (edits.npcSnap) { const have = new Set(list.map((p) => p.id)); for (const id in edits.npcSnap) { const sn = edits.npcSnap[id]; if (sn && sn.sid === s.id && !have.has(id)) list.push(withOv(sn)); } }
  return list;
}
function relsOf(p) {
  const out = [];
  if (p.adv != null) {
    const R = roster(SBY.get(p.sid));
    if (R) for (const r of R.rels) {
      if (r.a !== p.adv && r.b !== p.adv) continue;
      const o = npcById(p.sid + '#a' + (r.a === p.adv ? r.b : r.a));
      if (o) out.push({ o, type: r.type, label: REL[r.type][r.a === p.adv ? 0 : 1], group: REL[r.type][2] });
    }
  } else if (!p.id.startsWith('cn')) {
    const s = SBY.get(p.sid);
    if (s) for (const r of townPeople(s).rels) {
      if (r.a !== p.idx && r.b !== p.idx) continue;
      const o = npcById(p.sid + '#' + (r.a === p.idx ? r.b : r.a));
      if (o) out.push({ o, type: r.type, label: REL[r.type][r.a === p.idx ? 0 : 1], group: REL[r.type][2] });
    }
  }
  for (const r of edits.npcRel || []) {
    if (r.a !== p.id && r.b !== p.id) continue;
    const o = npcById(r.a === p.id ? r.b : r.a);
    if (o) out.push({ o, type: r.type, label: REL[r.type][r.a === p.id ? 0 : 1], group: REL[r.type][2], custom: r.id });
  }
  return out;
}

// ---------------------------------------------------------------- daily activity, driven by the market's world events
const ROUTINE = {
  leader: ['Holding court', 'Hearing petitions', 'Going over the accounts', 'Riding out to inspect the farms', 'Entertaining a visiting envoy'],
  faith: ['Leading prayers at the temple', 'Tending the sick', 'Hearing confessions', 'Blessing the fields', 'Copying scripture'],
  watch: ['On patrol', 'Drilling recruits', 'Guarding the gate', 'Investigating a theft', 'Off duty at the tavern'],
  craft: ['At work in the workshop', 'Haggling over materials', 'Training an apprentice', 'Delivering an order'],
  trade: ['Minding the stall', 'Counting stock', 'Negotiating with a supplier', 'Writing letters to trading partners'],
  service: ['Serving customers', 'Cleaning up after a rowdy night', 'Restocking the cellar', 'Swapping gossip with regulars'],
  labour: ['Working the fields', 'Hauling goods', 'Mending fences', 'Looking for work at the market'],
  arcane: ['Studying in seclusion', 'Gathering spell components', 'Experimenting; coloured smoke from the chimney', 'Meeting a client'],
  underworld: ['Casing a mark', 'Meeting a contact after dark', 'Fencing stolen goods', 'Lying low'],
  adventurer: ['Training in the yard', 'Drinking at the guild hall', 'Reading the quest board', 'Mending gear', 'Resting between jobs']
};
function activity(p, day) {
  const st = p.status || 'Alive';
  if (st !== 'Alive') return { text: st === 'Travelling' ? 'Away travelling' : st === 'Dead' && p.fate ? p.fate : st, tone: st === 'Dead' ? 'bad' : 'warn' };
  const s = SBY.get(p.sid);
  const h = (k) => T.hash(p.h || hashStr(p.id), day, k);
  let ev = null, evId = null;
  if (s) for (const [ti, f, e] of modsFor(s, day)) {
    const t = ETYPES[ti], r = h(31 + ti);
    if (t === 'plague') {
      if (p.group === 'faith' || p.job === 'Physician' || p.job === 'Herbalist' || p.job === 'Midwife') ev = ev || (evId = e.id, 0) || 'Tending victims of ' + e.name.replace(/ in .*/, '');
      else if (r < f * 0.45) { ev = 'Sick in bed with ' + e.name.replace(/ in .*/, '').replace(/^The /, 'the '); evId = e.id; }
    } else if (t === 'war') {
      if (p.group === 'watch') ev = ev || (evId = e.id, 0) || 'Mustered for the war';
      else if (/smith|Armour|Weapon/i.test(p.job)) ev = ev || (evId = e.id, 0) || 'Forging weapons for the war';
      else if (p.group === 'trade' && r < 0.5) ev = ev || (evId = e.id, 0) || 'Selling supplies to the army at a profit';
      else if (r < f * 0.25) ev = ev || (evId = e.id, 0) || 'Worried about a relative at the front';
    } else if (t === 'bandits') {
      if (p.group === 'watch') ev = ev || (evId = e.id, 0) || 'Hunting ' + e.name.replace(/ near .*/, '').replace(/^The /, 'the ');
      else if (p.group === 'trade') ev = ev || (evId = e.id, 0) || 'Hiring guards for the road';
      else if (p.group === 'underworld' && r < 0.5) ev = ev || (evId = e.id, 0) || 'Quietly buying goods from the bandits';
      else if (r < f * 0.1) ev = ev || (evId = e.id, 0) || 'Robbed on the road and shaken';
    } else if (t === 'famine') {
      if (p.group === 'leader') ev = ev || (evId = e.id, 0) || 'Organising grain relief';
      else if (p.group === 'labour' || p.life <= 2) { if (r < f * 0.7) ev = ev || (evId = e.id, 0) || 'Queuing at the granary for bread'; }
      else if (p.group === 'trade' && r < 0.4) ev = ev || (evId = e.id, 0) || 'Hoarding grain to sell dear';
    } else if (t === 'festival' || t === 'feast') {
      if (p.group === 'service') ev = ev || (evId = e.id, 0) || 'Run off their feet serving the ' + (t === 'feast' ? 'feast' : 'festival crowds');
      else if (p.group === 'leader' && t === 'feast') ev = ev || (evId = e.id, 0) || 'At the high table of ' + e.name.replace(/^.*?(Lord|Lady)/, '$1').replace(/ at .*/, '');
      else if (r < 0.6) ev = ev || (evId = e.id, 0) || (t === 'feast' ? 'Hoping for scraps from the feast' : 'Enjoying the ' + e.name.replace(s.name + ' ', '').replace(/^Harvest Home across .*/, 'Harvest Home'));
    } else if (t === 'boom') {
      if (p.group === 'trade') ev = ev || (evId = e.id, 0) || 'Striking deals with incoming merchants';
      else if (p.group === 'service') ev = ev || (evId = e.id, 0) || 'Every room let; business is booming';
      else if (p.group === 'underworld') ev = ev || (evId = e.id, 0) || 'Working the crowds of newcomers';
    }
  }
  // a death in the family comes first in its first week, then shares the days with everything else (app20)
  const gr = griefToday(p, s, day);
  if (gr && /^In mourning/.test(gr.text)) return gr;
  if (ev) return { text: ev, tone: /Sick|Robbed|Worried|Queuing/.test(ev) ? 'warn' : 'event', ev: evId };
  if (gr) return gr;
  const oc = occupiedToday(p, s, day);
  if (oc) return oc;
  if (day % 7 === 6) { const so = socialToday(p, s, day); if (so && !so.secret) return { text: so.text, tone: '', place: so.place, with: so.with }; const rr = routineAt(p, s, 'rest', h(5), h(15), day); return { text: rr.text, tone: '', place: rr.place }; }
  if (p.group === 'trade' && s && h(6) < 0.12) {
    const nb = neighbours(s);
    if (nb.length) { const n = nb[Math.floor(h(7) * nb.length)][0]; return { text: 'On the road to ' + n.name + ' to buy stock', tone: '' }; }
  }
  if (p.group === 'adventurer' && p.level && h(12) < 0.35) return { text: 'Away on a quest' + (p.companyName ? ' with ' + p.companyName : ''), tone: 'event' };
  // the day's routine happens at real places in town (see app18: routineAt)
  const grp = p.group === 'underworld' ? (GROUP_FROM_COVER[p.job] || 'labour') : (ROUTINE_AT[p.group] ? p.group : 'labour');
  // now and then the day is spent with a friend, relative or rival (app20); secret meetings show only to the DM
  const so = socialToday(p, s, day);
  const rr = so && !so.secret ? so : routineAt(p, s, grp, h(8), h(18), day);
  const out = { text: rr.text, tone: '', place: rr.place, with: rr.with };
  if (so && so.secret) { out.secret = so.text; out.secretPlace = so.place; out.secretWith = so.with; }
  else if (p.secretJob) { const r2 = routineAt(p, s, 'underworld', h(9), h(19), day); out.secret = r2.text; out.secretPlace = r2.place; }
  return out;
}
const GROUP_FROM_COVER = { Pawnbroker: 'trade', 'Street urchin': 'labour', Sailor: 'labour', Acolyte: 'faith', Scribe: 'service', Labourer: 'labour', Courier: 'service', Moneylender: 'trade' };

// ---------------------------------------------------------------- census of the whole population
const LIFE_SHARE = { 1: [5, 15, 45, 30, 4, 1, 0], 2: [6, 14, 35, 33, 9, 2.5, 0.5], 3: [8, 16, 30, 30, 11, 4, 1], 4: [9, 16, 28, 29, 12, 4.5, 1.5] };
function census(s, day) {
  if (day == null) day = market.day;
  const P = profile(s), pop = popNow(s, day);
  const shops = P.trades.reduce((a, t) => a + t[1], 0);
  const gentry = P.nobles * 4, watch = P.guards, clergy = P.clergy;
  const crafts = Math.min(pop * 0.45, shops * 3.2);
  const rest = Math.max(0, pop - gentry - watch - clergy - crafts);
  const farm = rest * [0, 0.86, 0.5, 0.24, 0.14][s.tier];
  const occ = [['Farming, herding & fishing', farm], ['Crafts & trades', crafts], ['Labourers & servants', rest - farm], ['Watch & soldiers', watch], ['Clergy', clergy], ['Gentry & households', gentry]];
  const orgs = [];
  { const tp = templesOf(s); orgs.push(['The temple', Math.max(1, Math.round(clergy)) + ' clergy', pop < 300 ? 'a wayside shrine' : tp.length === 1 ? 'one temple' : tp.length + ' competing temples']); }
  if (pop < 300) orgs.push(['No watch', 'none', 'neighbours and the elder keep the peace']);
  else orgs.push(['The watch', fmtInt(watch) + ' members', pop >= 8000 ? 'barracks, gatehouses and a garrison' : pop >= 1000 ? 'a watch-house and a gaol' : 'a constable and watchmen']);
  // guilds only where they have a branch (see the guild networks)
  const gl = (k) => guildLevel(s, k);
  if (gl('merchants')) orgs.push(["Merchants' guild", fmtInt(orgEstimate(s, 'merchants')) + ' members', gl('merchants') === 1 ? 'a trading post run by a factor' : gl('merchants') === 3 ? 'the realm\'s exchange: sets tolls and weights for every branch' : 'sets market tolls and weights']);
  else if (s.tier >= 2) orgs.push(['Traders', 'independent', 'no merchants\' guild here']);
  if (gl('crafts')) { const big = P.trades.filter((t) => t[1] >= 5).slice(0, 4).map((t) => t[0].toLowerCase()); orgs.push(['Craft guilds', fmtInt(orgEstimate(s, 'crafts')) + ' masters', gl('crafts') === 1 ? 'a small craft lodge' : big.length ? big.join(', ') : 'mixed crafts']); }
  if (isPlayer()) { /* the thieves keep out of the census */ }
  else if (gl('thieves') >= 2) orgs.push(["Thieves' guild", 'about ' + fmtInt(orgEstimate(s, 'thieves')) + ' members', 'never openly acknowledged']);
  else if (gl('thieves') === 1) orgs.push(["Thieves' guild", 'a small cell', 'answers to a bigger guild elsewhere']);
  else if (s.tier >= 2) orgs.push(['Cutpurses & smugglers', 'a handful', 'no organised guild']);
  if (gl('mages')) orgs.push(["Mages' circle", fmtInt(orgEstimate(s, 'mages')) + ' members', gl('mages') === 1 ? 'a circle house that licenses spellcasting' : 'licenses spellcasting in the city']);
  // every town has its own age and wealth profile: frontier towns are younger, capitals draw working-age migrants,
  // and dear food or recent plague, famine and war leave their mark
  const hs = hashStr(s.id) & 0x7fffffff, jit = (k) => T.hash(hs, k, 333) - 0.5;
  const frontier = [6, 7, 9, 11, 14].includes(s.b) ? 1 : 0;
  const notes = [];
  let kids = 0.35 + 0.06 * jit(1) + 0.02 * frontier - (s.tier === 4 ? 0.03 : 0), elders = 0.13 + 0.05 * jit(2) - 0.02 * frontier + (s.tier >= 3 ? 0.01 : 0);
  let hard = 0;
  for (const e of eventsWindow(day)) {
    if (e.end > day || day - e.end > 360 || !(e.type === 'plague' || e.type === 'famine' || e.type === 'war')) continue;
    const f = impact(e, s, localInfo(s), Math.min(e.end - 1, Math.max(e.start, day - 1)));
    if (f > 0.15) { hard += f * (e.type === 'plague' ? 1 : e.type === 'famine' ? 0.7 : 0.5); if (notes.length < 3) notes.push(e.name + ' (' + EVT[e.type].name.toLowerCase() + ', ended ' + dateText(e.end - 1) + ')'); }
  }
  for (const [ti, f, e] of modsFor(s, day)) { const t = ETYPES[ti]; if ((t === 'plague' || t === 'famine' || t === 'war') && f > 0.15) { hard += f * (t === 'plague' ? 1 : 0.6); if (notes.length < 3) notes.push(e.name + ' (still going)'); } }
  hard = Math.min(1, hard);
  elders -= 0.03 * hard; kids -= 0.025 * hard;
  const ages = [['Children (0-14)', kids], ['Adults (15-49)', 1 - kids - elders], ['Elders (50+)', elders]];
  const base = LIFE_SHARE[s.tier].slice();
  const w = clamp((1 - basketIndex(s, day)) * 0.9 + 0.16 * jit(3) - 0.12 * hard, -0.3, 0.3);
  if (w > 0) for (let i = base.length - 2; i >= 0; i--) { const m = base[i] * w * 0.5; base[i] -= m; base[i + 1] += m; }
  else if (w < 0) for (let i = 1; i < base.length; i++) { const m = base[i] * -w * 0.5; base[i] -= m; base[i - 1] += m; }
  const tot = base.reduce((a, v) => a + v, 0);
  return {
    pop, households: Math.round(pop / (4.4 + 0.8 * (0.5 + jit(4)) + (frontier ? 0.3 : 0))), perHouse: 0, ages,
    occ: occ.map(([n, v]) => [n, v / pop]), life: base.map((v, i) => [LIFESTYLE[i][0], v / tot]), orgs, races: P.races, other: P.other, notes, wealth: w
  };
}

// ---------------------------------------------------------------- panel
function bars(rows, total) {
  return '<ul class="bars">' + rows.map(([n, f]) => '<li><span>' + esc(n) + '</span><i><em style="width:' + Math.max(0, Math.min(100, f * 100)).toFixed(1) + '%"></em></i><b>' + (total ? fmtInt(f * total) : Math.round(f * 100) + '%') + '</b></li>').join('') + '</ul>';
}
function peopleHeader(s) {
  const tabs = [['residents', 'Residents'], ['census', 'Census'], ['activity', 'Activity'], ['chronicle', 'Chronicle'], ['tracked', 'Tracked']];
  return '<div class="mk-head"><div><div class="eyebrow">People' + (s ? ' · ' + placeKind(s) + ' · ' + fmtInt(s.pop) + ' people' : '') + '</div><h2>' + (s ? tLink(s) : people.tab === 'tracked' ? 'Tracked people' : 'Residents') + '</h2></div><button type="button" class="x" data-act="close" aria-label="Close panel">×</button></div>' +
    '<div class="seg mk-tabs g5" role="tablist">' + tabs.map(([k, l]) => '<button type="button" role="tab" data-pp="tab" data-v="' + k + '" aria-pressed="' + (people.tab === k) + '">' + l + '</button>').join('') + '</div>';
}
function personRow(p, day) {
  const a = activity(p, day), d = dispOf(p), at = attitude(d);
  return '<li><button type="button" data-pp="npc" data-v="' + esc(p.id) + '"><span class="dot ' + at[1] + '" title="' + at[0] + ' to the party"></span><span class="t"><b>' + esc(npcName(p)) + (tracked(p) ? ' <i class="star" aria-label="tracked">★</i>' : '') + '</b><small>' + esc(p.job) + ' · ' + esc(p.race) + ', ' + p.age + '</small><small class="act' + (a.tone ? ' ' + a.tone : '') + '">' + esc(a.text) + '</small></span></button></li>';
}
function residentsTab(s, day) {
  if (!s) return '<div class="empty-note"><p>Tap a village, town or city on the map to meet its people.</p><p class="meta">Every settlement has a cast of notable residents with jobs, families, friendships, rivalries, secrets and daily routines. Wars, plague, famine, festivals and trade booms from the Market change what they are doing.</p></div>';
  const all = residents(s);
  const q = people.q.trim().toLowerCase();
  const list = all.filter((p) => (people.group === 'all' || pubGroup(p) === people.group) && (!q || (npcName(p) + ' ' + p.job + ' ' + p.race).toLowerCase().includes(q)));
  const counts = {};
  for (const p of all) counts[pubGroup(p)] = (counts[pubGroup(p)] || 0) + 1;
  let h = '<div class="pp-tools"><input id="pp-q" type="search" placeholder="Search names or jobs" value="' + esc(people.q) + '" aria-label="Search residents"><select id="pp-group" aria-label="Filter by group"><option value="all">Everyone (' + all.length + ')</option>' + GROUP_KEYS.filter((g) => counts[g]).map((g) => '<option value="' + g + '"' + (people.group === g ? ' selected' : '') + '>' + GROUPS[g].name + ' (' + counts[g] + ')</option>').join('') + '</select></div>';
  h += residentsViewToggle();
  h += !list.length ? '<p class="meta">Nobody matches.</p>' : people.view === 'house' ? householdListHtml(s, list, day) : '<ul class="evlist people">' + list.map((p) => personRow(p, day)).join('') + '</ul>';
  const more = npcCount(s) < Math.min(400, s.pop);
  h += '<div class="actions">' + (more ? '<button type="button" class="btn" data-pp="more">Generate 20 more residents</button>' : '') + '<button type="button" class="btn" data-pp="add">Add your own</button></div>';
  h += '<p class="hint">These are the notable folk of ' + esc(s.name) + ', not all ' + fmtInt(s.pop) + ' people. The Census tab covers everyone. The dot shows how each person feels about the party.</p>';
  return h;
}
function egoGraph(p, rels) {
  const W0 = 368, H0 = 230, cx = W0 / 2, cy = H0 / 2;
  const shown = rels.slice(0, 10);
  if (!shown.length) return '';
  const R = 88;
  let g = '';
  const pos = shown.map((r, i) => { const a = -Math.PI / 2 + i / shown.length * Math.PI * 2; return [cx + Math.cos(a) * R * 1.45, cy + Math.sin(a) * R]; });
  shown.forEach((r, i) => { g += '<line x1="' + cx + '" y1="' + cy + '" x2="' + pos[i][0].toFixed(1) + '" y2="' + pos[i][1].toFixed(1) + '" stroke="' + RGCOL[r.group] + '" stroke-width="2"' + (r.group === 'secret' ? ' stroke-dasharray="5 4"' : '') + '/>'; });
  shown.forEach((r, i) => {
    const [x, y] = pos[i];
    const nm = r.o.first;
    g += '<g class="node" data-pp="npc" data-v="' + esc(r.o.id) + '" tabindex="0" role="button" aria-label="' + esc(npcName(r.o) + ', ' + r.label.toLowerCase()) + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7" fill="' + RGCOL[r.group] + '" stroke="#151a20" stroke-width="2"/>' +
      '<text x="' + x.toFixed(1) + '" y="' + (y + (y < cy ? -12 : 19)).toFixed(1) + '" text-anchor="middle">' + esc(nm) + '</text></g>';
  });
  g += '<circle cx="' + cx + '" cy="' + cy + '" r="11" fill="#c9a253" stroke="#151a20" stroke-width="2"/><text x="' + cx + '" y="' + (cy + 26) + '" text-anchor="middle" class="me">' + esc(p.first) + '</text>';
  const used = new Set(shown.map((r) => r.group));
  return '<div class="ego"><svg viewBox="0 0 ' + W0 + ' ' + H0 + '" role="img" aria-label="Relationship web of ' + esc(npcName(p)) + '">' + g + '</svg><ul class="legend inline">' + REL_GROUPS.filter((x) => used.has(x[0])).map((x) => '<li><i style="background:' + x[2] + '"></i><span>' + x[1] + '</span></li>').join('') + '</ul></div>';
}
const PURSE = [0.02, 0.15, 0.6, 3, 12, 45, 180];
function coinText(p) { const v = PURSE[p.life] * (0.4 + 1.2 * T.hash(p.h || 1, 3, 77)); return v < 0.01 ? 'Nothing' : money(v); }
function personView(p, day) {
  const s = SBY.get(p.sid);
  const d = dispOf(p), at = attitude(d);
  const a = activity(p, day);
  const o = (edits.npc || {})[p.id] || {};
  const rels = relsOf(p).filter((r) => !(isPlayer() && (SECRET_REL.has(r.type) || r.group === 'secret')));
  let h = '<button type="button" class="link back" data-pp="back">‹ ' + (s ? esc(s.name) + ' residents' : 'Back') + '</button>';
  h += '<div class="ihead"><div class="grow"><div class="eyebrow">' + esc(p.race) + ' · ' + p.age + ' · ' + (p.fem ? 'she/her' : 'he/him') + (s ? ' · ' + tLink(s) : '') + '</div><input id="pp-name" class="title-in" value="' + esc(npcName(p)) + '" aria-label="Name" maxlength="50"></div>' +
    '<button type="button" class="star-btn" data-pp="track" aria-pressed="' + tracked(p) + '" aria-label="Track this person">' + (tracked(p) ? '★ Tracked' : '☆ Track') + '</button></div>';
  h += '<div class="row2"><div class="field"><label class="lab" for="pp-job">Job</label><input id="pp-job" value="' + esc(p.job) + '" maxlength="50"></div><div class="field"><label class="lab" for="pp-status">Status</label><select id="pp-status">' + STATUS.map((x) => '<option' + ((p.status || 'Alive') === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></div></div>';
  if (p.secretJob && !isPlayer()) h += '<p class="secret-line"><b>Secretly:</b> ' + esc(p.secretJob) + '</p>';
  h += '<div class="disp"><div><span class="lab">Towards the party</span><b class="' + at[1] + '">' + at[0] + '</b></div><div class="meter" aria-hidden="true"><em style="left:' + ((d + 100) / 2).toFixed(1) + '%"></em></div>' + (isPlayer() ? '' : '<div class="disp-btns"><button type="button" class="btn" data-pp="disp" data-v="-10">Worse</button><button type="button" class="btn" data-pp="disp" data-v="10">Better</button></div>') + '</div>';
  h += placeRoleHtml(p);
  h += '<section><h3>Today</h3><p class="today ' + (a.tone || '') + '">' + (a.ev ? '<button type="button" class="link" data-ev="' + esc(a.ev) + '">' + esc(a.text) + '</button>' : actLinks(a, s)) + '</p>' + (a.secret && !isPlayer() ? '<p class="secret-line"><b>' + (a.secretWith ? 'Secretly:' : 'Really:') + '</b> ' + actLinks({ text: a.secret, place: a.secretPlace, with: a.secretWith }, s) + '</p>' : '') + '</section>';
  h += '<dl class="stats two">' + (isPlayer() ? '' : stat('Wants', esc(p.motive)) + stat('Secret', esc(p.secret))) + stat('Personality', esc(p.trait)) + stat('Believes in', esc(p.ideal)) + (isPlayer() ? '' : stat('Flaw', esc(p.flaw))) + stat('Look', esc(p.quirk)) +
    stat('Lifestyle', LIFESTYLE[p.life][0] + ' <small>(' + LIFESTYLE[p.life][1] + ')</small>') + stat('Stat block', statLine(p)) + stat('Coin on hand', coinText(p)) + stat('Belongs to', belongsTo(p, s)) + '</dl>';
  if (p.group === 'adventurer' && p.level) h += '<p class="meta">' + rankBadge(rankOf(p.merit)) + ' ' + p.merit.toLocaleString('en-GB') + ' merit' + (p.companyName ? ' · member of ' + (s ? oLink('adventurers', s.id, p.companyName) : esc(p.companyName)) : ' · works alone') + '</p>';
  h += influenceBlock(p);
  h += heroBondsFor(p);
  h += guildKinHtml(p);
  h += lossesHtml(p, day);
  // relationships
  h += '<section><h3>Relationships (' + rels.length + ')</h3>' + egoGraph(p, rels);
  h += rels.length ? '<ul class="rels">' + rels.map((r) => '<li><i style="background:' + RGCOL[r.group] + '"></i><span>' + r.label + ' <button type="button" class="link" data-pp="npc" data-v="' + esc(r.o.id) + '">' + esc(npcName(r.o)) + '</button><small>' + esc(r.o.job) + (r.o.sid !== p.sid ? ' in ' + esc((SBY.get(r.o.sid) || {}).name || '') : '') + '</small></span>' + (r.custom ? '<button type="button" class="x sm" data-pp="unrel" data-v="' + esc(r.custom) + '" aria-label="Remove relationship">×</button>' : '') + '</li>').join('') + '</ul>' : '<p class="meta">No close ties yet.</p>';
  if (s && !isPlayer()) {
    const others = residents(s).filter((q) => q.id !== p.id);
    h += '<div class="relform"><select id="pp-rtype" aria-label="Relationship type">' + Object.keys(REL).map((k) => '<option value="' + k + '">' + REL[k][0] + '</option>').join('') + '</select><select id="pp-rto" aria-label="Person">' + others.map((q) => '<option value="' + esc(q.id) + '">' + esc(npcName(q)) + ' (' + esc(q.job) + ')</option>').join('') + '</select><button type="button" class="btn" data-pp="rel">Link</button></div>';
  }
  h += '</section>';
  // activity log
  const log = (o.log || []).map((e) => ({ d: e.d, text: e.t, mine: true }));
  for (let k = 1; k <= 6; k++) log.push({ d: day - k, text: activity(p, day - k).text });
  log.sort((x, y) => y.d - x.d || (y.mine ? 1 : 0) - (x.mine ? 1 : 0));
  h += '<section><h3>Activity &amp; interactions</h3><div class="logform"><input id="pp-log" placeholder="Log what happened, e.g. Sold the party a map" maxlength="200"><button type="button" class="btn primary" data-pp="log">Log</button></div><ul class="log">' + log.map((e) => '<li class="' + (e.mine ? 'mine' : '') + '"><time>' + shortDate(e.d) + '</time><span>' + esc(e.text) + '</span></li>').join('') + '</ul></section>';
  if (!isPlayer()) h += '<div class="field"><label class="lab" for="pp-notes">DM notes</label><textarea id="pp-notes" rows="3" placeholder="Voice, mannerisms, what the party knows…">' + esc(o.notes || '') + '</textarea></div>';
  h += '<div class="actions"><button type="button" class="btn" data-pp="showtown">Show on map</button>' + (p.id.startsWith('cn') ? '<button type="button" class="btn danger" data-pp="delnpc">Delete person</button>' : '') + '</div>';
  return h;
}
function censusTab(s) {
  if (!s) return '<div class="empty-note"><p>Tap a settlement on the map to see its census.</p></div>';
  const C = census(s, market.day);
  let h = '<dl class="stats">' + stat('People', fmtInt(C.pop)) + stat('Households', fmtInt(C.households)) + stat('Per household', (C.pop / Math.max(1, C.households)).toFixed(1)) + '</dl>';
  if (C.notes.length) h += '<p class="meta"><b>Hard times lately:</b> ' + C.notes.map(esc).join('; ') + '. Fewer children and elders survived, and more families have slipped into poverty.</p>';
  if (Math.abs(C.wealth) > 0.12) h += '<p class="meta">' + (C.wealth > 0 ? 'Cheap food and steady trade have made ' + esc(s.name) + ' better off than most.' : 'Dear prices have pushed many in ' + esc(s.name) + ' towards poverty.') + '</p>';
  h += '<section><h3>Work</h3>' + bars(C.occ, C.pop) + '</section>';
  h += '<section><h3>Ages</h3>' + bars(C.ages, C.pop) + '</section>';
  h += '<section><h3>How people live</h3><p class="meta">Player\'s Handbook lifestyles.</p>' + bars(C.life) + '</section>';
  h += '<section><h3>Folk</h3>' + bars(C.races.map(([n, v]) => [n, v / 100]).concat(C.other > 0 ? [['Others', C.other / 100]] : [])) + '</section>';
  h += '<section><h3>Organisations</h3><ul class="orgs">' + C.orgs.map(([n, m, d]) => '<li><b>' + (CENSUS_ORG[n] ? oLink(CENSUS_ORG[n], s.id, n) : esc(n)) + '</b><span>' + esc(m) + '</span><small>' + esc(d) + '</small></li>').join('') + '</ul><p class="meta">Also here: ' + orgsShown(s).filter((k) => !Object.values(CENSUS_ORG).includes(k) || (k === 'thieves' && s.tier < 2)).map((k) => oLink(k, s.id)).join(' · ') + '</p><p class="hint">Tap an organisation to see its members, leaders, money and rivalries.</p></section>';
  return h;
}
function trackedTab(day) {
  const ids = Object.keys(edits.npc || {}).filter((id) => edits.npc[id].tracked);
  const list = ids.map(npcById).filter(Boolean);
  if (!list.length) return '<div class="empty-note"><p>Nobody is tracked yet.</p><p class="meta">Open a resident and press Track to follow them here, wherever they live. Tracked people show as a brass badge on their town.</p></div>';
  list.sort((a, b) => ((SBY.get(a.sid) || {}).name || '').localeCompare((SBY.get(b.sid) || {}).name || '') || npcName(a).localeCompare(npcName(b)));
  let h = '', cur = null;
  for (const p of list) {
    const town = (SBY.get(p.sid) || {}).name || 'Unknown';
    if (town !== cur) { if (cur !== null) h += '</ul>'; h += '<h4>' + tLink(SBY.get(p.sid), town) + '</h4><ul class="evlist people">'; cur = town; }
    h += personRow(p, day);
  }
  return h + '</ul>';
}
function peoplePanel() {
  const s = people.sid ? SBY.get(people.sid) : null;
  const day = market.day;
  if (people.npc) { const p = npcById(people.npc); if (p) return '<div class="mk-body">' + personView(p, day) + '</div>'; people.npc = null; }
  if (people.place) { const v = s ? placeView(s, people.place, day) : null; if (v) return '<div class="mk-body">' + v + '</div>'; people.place = null; }
  let body;
  if (people.tab === 'census') body = censusTab(s);
  else if (people.tab === 'activity') body = activityTab(s, day);
  else if (people.tab === 'tracked') body = trackedTab(day);
  else if (people.tab === 'chronicle') body = chronicleTab(s, day);
  else body = residentsTab(s, day);
  return peopleHeader(people.tab === 'tracked' ? null : s) + '<div class="mk-body">' + body + '</div>';
}
function peopleAfterRender() {
  if (tool !== 'people') return;
  const q = $('pp-q');
  if (q && people.focusQ) { q.focus(); const n = q.value.length; q.setSelectionRange(n, n); people.focusQ = false; }
}
function npcEdit(id, label, fn) {
  commit(label, () => {
    edits.npc = Object.assign({}, edits.npc);
    const o = Object.assign({ o: {} }, edits.npc[id] || {});
    o.o = Object.assign({}, o.o);
    fn(o);
    edits.npc[id] = o;
  }, {});
}
function openPerson(id, noFly) { people.npc = id; const p = npcById(id); if (p) people.sid = p.sid; renderPanel(); const el = $('inspector'); if (el) el.scrollTop = 0; if (p && !noFly) flyToPerson(p); requestRender(); }
$('inspector').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-pp]');
  if (!b) return;
  const k = b.dataset.pp, v = b.dataset.v;
  const p = people.npc ? npcById(people.npc) : null;
  switch (k) {
    case 'tab': if (v === people.tab && !people.npc && !people.place) { panelMin = true; renderPanel(); break; } people.tab = v; people.npc = null; people.place = null; renderPanel(); requestRender(); break;
    case 'placeback': people.place = null; placeHi = null; renderPanel(); requestRender(); break;
    case 'placefly': { const s = SBY.get(people.sid); if (s && people.place) goPlace(s.id, people.place); break; }
    case 'hcat': { const all = Object.keys(HEAT_CATS); let c = people.hcats ? people.hcats.slice() : all.slice(); c = c.includes(v) ? c.filter((x) => x !== v) : c.concat(v); people.hcats = c.length === all.length ? null : c; renderPanel(); requestRender(); break; }
    case 'heat': people.heat = people.heat === false; renderPanel(); requestRender(); break;
    case 'heatfly': { const s = SBY.get(people.sid); if (s) flyVis(s.x, s.y, clamp(Math.min(vw, vh) * 0.42 / settleR(s), PLAN_S * 1.2, MAXS)); break; }
    case 'npc': if (tool !== 'people') setTool('people', true); openPerson(v); break;
    case 'back': people.npc = null; renderPanel(); break;
    case 'more': { const s = SBY.get(people.sid); if (!s) break; edits.npcMore = Object.assign({}, edits.npcMore, { [s.id]: ((edits.npcMore || {})[s.id] || 0) + 20 }); scheduleSave(); renderPanel(); toast('20 more residents of ' + s.name + ' have been generated.'); break; }
    case 'add': {
      const s = SBY.get(people.sid); if (!s) break;
      const id = 'cn' + edits.next;
      const rng = T.mulberry(hashStr(id) ^ SEED ^ Date.now());
      const race = 'Human', fem = rng() < 0.5;
      const c = { id, sid: s.id, idx: -1, race, fem, age: 18 + Math.floor(rng() * 40), job: 'Newcomer', group: 'labour', secretJob: null, life: 3, stat: 'Commoner', first: FIRST.Human[fem ? 1 : 0][Math.floor(rng() * 24)], last: SURN.Human[Math.floor(rng() * SURN.Human.length)], trait: TRAITS[Math.floor(rng() * TRAITS.length)], ideal: IDEALS[Math.floor(rng() * IDEALS.length)], flaw: FLAWS[Math.floor(rng() * FLAWS.length)], quirk: QUIRKS[Math.floor(rng() * QUIRKS.length)], secret: SECRETS[Math.floor(rng() * SECRETS.length)], disp0: 0, h: hashStr(id), motive: 'Make a name for themselves in ' + s.name };
      commit('Add resident', () => { edits.next++; edits.npcAdd = (edits.npcAdd || []).concat([c]); }, {});
      openPerson(id);
      const f = $('pp-name'); if (f) { f.focus(); f.select(); }
      break;
    }
    case 'track': if (p) { const on = !tracked(p); npcEdit(p.id, on ? 'Track ' + npcName(p) : 'Stop tracking', (o) => { o.tracked = on ? 1 : 0; }); } break;
    case 'disp': if (p) { const nd = clamp(dispOf(p) + +v, -100, 100); npcEdit(p.id, 'Change attitude', (o) => { o.disp = nd; }); } break;
    case 'log': {
      const inp = $('pp-log');
      const t = inp ? inp.value.trim() : '';
      if (!p || !t) { if (inp) inp.focus(); break; }
      npcEdit(p.id, 'Log for ' + npcName(p), (o) => { o.log = (o.log || []).concat([{ d: market.day, t: t.slice(0, 200) }]); });
      break;
    }
    case 'rel': {
      if (!p) break;
      const type = $('pp-rtype').value, to = $('pp-rto').value;
      if (!to || !REL[type]) break;
      const id = 'nr' + edits.next;
      commit('Link people', () => { edits.next++; edits.npcRel = (edits.npcRel || []).concat([{ id, a: p.id, b: to, type }]); }, {});
      break;
    }
    case 'unrel': commit('Remove link', () => { edits.npcRel = (edits.npcRel || []).filter((r) => r.id !== v); }, {}); break;
    case 'showtown': if (p) flyToPerson(p); break;
    case 'delnpc': if (p) { commit('Delete person', () => { edits.npcAdd = (edits.npcAdd || []).filter((c) => c.id !== p.id); edits.npcRel = (edits.npcRel || []).filter((r) => r.a !== p.id && r.b !== p.id); }, {}); people.npc = null; renderPanel(); } break;
  }
});
$('inspector').addEventListener('keydown', (ev) => {
  const g = ev.target.closest && ev.target.closest('g.node[data-pp]');
  if (g && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); openPerson(g.dataset.v); }
  if (ev.target.id === 'pp-log' && ev.key === 'Enter') { ev.preventDefault(); const b = document.querySelector('[data-pp="log"]'); if (b) b.click(); }
});
$('inspector').addEventListener('input', (ev) => {
  if (ev.target.id === 'pp-q') { people.q = ev.target.value; people.focusQ = true; renderPanel(); }
});
$('inspector').addEventListener('change', (ev) => {
  const id = ev.target.id, v = ev.target.value;
  if (id === 'pp-group') { people.group = v; renderPanel(); return; }
  const p = people.npc ? npcById(people.npc) : null;
  if (!p) return;
  const custom = p.id.startsWith('cn');
  const setField = (field, val, label) => {
    if (custom) commit(label, () => { edits.npcAdd = (edits.npcAdd || []).map((c) => (c.id === p.id ? Object.assign({}, c, { [field]: val }) : c)); }, {});
    else npcEdit(p.id, label, (o) => { o.o[field] = val; });
  };
  if (id === 'pp-name') {
    const n = v.trim();
    if (!n) { ev.target.value = npcName(p); return; }
    const sp = n.indexOf(' ');
    const first = sp < 0 ? n : n.slice(0, sp), last = sp < 0 ? '' : n.slice(sp + 1);
    if (custom) commit('Rename', () => { edits.npcAdd = edits.npcAdd.map((c) => (c.id === p.id ? Object.assign({}, c, { first, last }) : c)); }, {});
    else npcEdit(p.id, 'Rename', (o) => { o.o.first = first; o.o.last = last; });
  } else if (id === 'pp-job') { const n = v.trim(); if (n) setField('job', n.slice(0, 50), 'Change job'); }
  else if (id === 'pp-status') setField('status', v, 'Set status: ' + v);
  else if (id === 'pp-notes') npcEdit(p.id, 'Edit notes', (o) => { o.notes = v.slice(0, 3000); });
});

// ---------------------------------------------------------------- map: brass badges where tracked people live
function drawPeopleBadges() {
  if (!layers.people || !edits.npc) return;
  const count = new Map();
  for (const id in edits.npc) {
    if (!edits.npc[id].tracked) continue;
    const sid = id.startsWith('cn') ? ((edits.npcAdd || []).find((c) => c.id === id) || {}).sid : id.slice(0, id.lastIndexOf('#'));
    if (sid) count.set(sid, (count.get(sid) || 0) + 1);
  }
  if (!count.size) return;
  ctx.font = '600 11px "Atkinson Hyperlegible", system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const m of markers) {
    if (m.kind !== 'settle' || !count.has(m.id)) continue;
    const X = m.r > 9 ? m.X - 10 : m.X - 12, Y = m.r > 9 ? m.Y : m.Y + 11;
    ctx.fillStyle = '#c9a253'; ctx.strokeStyle = '#1a140c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(X, Y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a140c'; ctx.fillText(String(count.get(m.id)), X, Y + 0.5);
  }
  ctx.textBaseline = 'alphabetic';
}
