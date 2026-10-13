
// ================================================================ guilds, the Adventurers' Guild, ranks, quests and influence
const ORGS = {
  adventurers: { name: "Adventurers' Guild", short: 'Adventurers', min: 2 },
  rulers: { name: 'The Rulers', short: 'Rulers', min: 1 },
  temple: { name: 'The Temple', short: 'Temple', min: 1 },
  watch: { name: 'The Watch', short: 'Watch', min: 1 },
  merchants: { name: "Merchants' Guild", short: 'Merchants', min: 2 },
  crafts: { name: 'Craft Guilds', short: 'Crafts', min: 2 },
  mages: { name: "Mages' Circle", short: 'Mages', min: 3 },
  thieves: { name: "Thieves' Guild", short: 'Thieves', min: 2, secret: true }
};
const ORG_KEYS = Object.keys(ORGS);
// each organisation's colour, used as the stripe on its cards (from the old Market Ledger's guild cards)
const ORG_COL = { adventurers: '#d6a548', rulers: '#c8603f', temple: '#e6d3a3', watch: '#5b8bd6', merchants: '#4fa36b', crafts: '#c07a3e', mages: '#8f74d8', thieves: '#7b8794' };
const gcStyle = (k) => ' style="--gc:' + (ORG_COL[k] || 'var(--line)') + '"';
// how dangerous a quest is: for the registered party when it has levels (DMG thresholds) or a rank, otherwise by the quest's own rank
const DANGER = ['low', 'moderate', 'high', 'deadly'];
function questDanger(q) {
  const lv = gst().party.members.map((x) => x.level).filter((x) => x > 0), mi = q.mon ? monInfo(q.mon) : null;
  if (mi && lv.length) { const d = difficulty(lv, mi[4], q.count || 1); if (d) return { k: [0, 0, 1, 2, 3][d.k], who: 'for your party' }; }
  const top = partyTopRank();
  if (top >= 0) { const g = q.rank - top; return { k: g <= -1 ? 0 : g === 0 ? 1 : g === 1 ? 2 : 3, who: 'for your party' }; }
  return { k: q.rank <= 1 ? 0 : q.rank <= 3 ? 1 : q.rank <= 5 ? 2 : 3, who: 'by its rank' };
}
const dangerChip = (q) => { const d = questDanger(q); return '<span class="dz dz-' + DANGER[d.k] + '" title="Danger ' + d.who + '">' + DANGER[d.k] + '</span>'; };
const GROUP_ORG = { leader: 'rulers', faith: 'temple', watch: 'watch', trade: 'merchants', service: 'merchants', craft: 'crafts', arcane: 'mages', underworld: 'thieves', adventurer: 'adventurers' };
const pairKey = (a, b) => (ORG_KEYS.indexOf(a) < ORG_KEYS.indexOf(b) ? a + '|' + b : b + '|' + a);
const BASE_REL = {
  'adventurers|rulers': 5, 'adventurers|temple': 15, 'adventurers|watch': 5, 'adventurers|merchants': 20, 'adventurers|crafts': 15, 'adventurers|mages': 10, 'adventurers|thieves': -10,
  'rulers|temple': 25, 'rulers|watch': 40, 'rulers|merchants': 10, 'rulers|crafts': 5, 'rulers|mages': 15, 'rulers|thieves': -35,
  'temple|watch': 10, 'temple|merchants': 0, 'temple|crafts': 5, 'temple|mages': -10, 'temple|thieves': -20,
  'watch|merchants': 20, 'watch|crafts': 5, 'watch|mages': -5, 'watch|thieves': -60,
  'merchants|crafts': -5, 'merchants|mages': 0, 'merchants|thieves': -40,
  'crafts|mages': 5, 'crafts|thieves': -15, 'mages|thieves': -10
};
// how world events push organisations together or apart
const EV_REL = {
  war: [['rulers', 'watch', 10], ['rulers', 'merchants', -10], ['adventurers', 'rulers', 15], ['crafts', 'rulers', 8]],
  bandits: [['adventurers', 'merchants', 15], ['watch', 'merchants', -12], ['watch', 'thieves', -10]],
  famine: [['merchants', 'rulers', -20], ['merchants', 'thieves', -10], ['temple', 'rulers', -8]],
  plague: [['temple', 'rulers', 10], ['temple', 'mages', -10], ['temple', 'merchants', 8], ['adventurers', 'temple', 10]],
  boom: [['merchants', 'crafts', 10], ['merchants', 'thieves', -15], ['merchants', 'rulers', 8]],
  festival: [['merchants', 'temple', 5], ['watch', 'thieves', -5]],
  feast: [['rulers', 'merchants', 5]]
};
// ranks of the Adventurers' Guild: name, merit needed, typical level, badge colour
const RANKS = [['Copper', 0, 1, '#b87333'], ['Iron', 100, 3, '#8d9196'], ['Bronze', 300, 5, '#cd7f32'], ['Silver', 700, 7, '#c9ccd1'], ['Gold', 1500, 9, '#d8b24a'], ['Platinum', 3000, 12, '#b9d3d8'], ['Mithral', 6000, 15, '#9fc2e8'], ['Adamantine', 12000, 18, '#9a7ad1']];
const REWARD = [[5, 25], [25, 100], [100, 300], [300, 800], [800, 2000], [2000, 5000], [5000, 15000], [15000, 50000]];
const MERIT = [10, 25, 50, 90, 150, 250, 400, 700];
const CLASSES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
const HALL_A = ['Gilded', 'Iron', 'Wandering', 'Broken', 'Silver', 'Crimson', 'Lucky', 'Last', 'Seventh', 'Bold', 'Rusted', 'Laughing'];
const HALL_N = ['Gauntlet', 'Lantern', 'Compass', 'Blade', 'Shield', 'Stag', 'Anvil', 'Tankard', 'Horn', 'Banner', 'Griffon', 'Key'];
const CO_A = ['Copper', 'Red', 'Mud', 'Ashen', 'Lucky', 'Grey', 'Brass', 'Hollow', 'Restless', 'Black', 'Merry', 'Thorn'];
const CO_N = ['Kettles', 'Lanterns', 'Larks', 'Wolves', 'Hounds', 'Ravens', 'Blades', 'Crowns', 'Boots', 'Foxes', 'Shields', 'Spears'];
const ADV_MOTIVES = ['Reach Gold rank before the year is out', 'Avenge a fallen companion', 'Pay off the debt for their gear', 'Find the beast that burned their village', 'Retire rich and buy a tavern', 'Prove themselves to the guildmaster', 'Map the ruins no one comes back from', 'Earn enough to free a sibling from debt'];
const PEACEFUL = new Set(['Centaur', 'Dryad', 'Pixie', 'Couatl', 'Merfolk', 'Deer', 'Elk', 'Camel', 'Eagle', 'Giant Owl', 'Giant Goat', 'Hippogriff', 'Jackal', 'Hyena', 'Ape', 'Boar', 'Black Bear', 'Panther', 'Mammoth', 'Giant Frog', 'Giant Lizard', 'Giant Crab', 'Plesiosaurus', 'Triceratops']);
const RAIDERS = new Set(['Gnoll', 'Orc', 'Goblin', 'Bandit', 'Bandit Captain', 'Lizardfolk', 'Sahuagin', 'Ettin', 'Hill Giant', 'Stone Giant', 'Frost Giant']);
const DRAGON = { 14: 'red', 15: 'red', 6: 'green', 7: 'green', 8: 'green', 9: 'black', 10: 'blue', 11: 'blue', 12: 'white', 13: 'white' };
const aan = (w) => (/^[aeiou]/i.test(w) ? 'An' : 'A');
const rankOf = (merit) => { let r = 0; for (let i = 0; i < RANKS.length; i++) if (merit >= RANKS[i][1]) r = i; return r; };
const rankForLevel = (lv) => { let r = 0; for (let i = 0; i < RANKS.length; i++) if (lv >= RANKS[i][2]) r = i; return r; };
function rankBadge(r, small) { const R = RANKS[r]; return '<span class="rank' + (small ? ' sm' : '') + '" style="--rk:' + R[3] + '">' + R[0] + '</span>'; }

// ---------------------------------------------------------------- guild state in the saved edits
function gst() {
  if (!edits.guild) edits.guild = {};
  const g = edits.guild;
  if (!g.party) g.party = { name: '', members: [], gold: 0, log: [] };
  for (const k of ['q', 'rep', 'shift', 'ag']) if (!g[k]) g[k] = {};
  if (!g.custom) g.custom = [];
  return g;
}
const guildUI = { tab: 'board', q: null, pair: null, rel: false, org: null };

// ---------------------------------------------------------------- influence: agendas of powerful people
const AGENDA = {
  'Refill an empty treasury': { label: 'Raising taxes', market: { all: 1.04 }, rel: [['merchants', 'rulers', -15], ['crafts', 'rulers', -10]], quest: 'tax' },
  'Win the next war with a neighbouring realm': { label: 'Pushing for war', war: true, market: { weapon: 1.06, armor: 1.06, horse: 1.05 }, rel: [['watch', 'rulers', 10], ['adventurers', 'rulers', 10]], quest: 'war' },
  'Secure the succession': { label: 'Securing the succession', rel: [['rulers', 'temple', 10]], quest: 'heir' },
  'Keep the great houses loyal': { label: 'Courting the great houses', market: { luxury: 1.08 }, rel: [['rulers', 'merchants', 5]] },
  'Win favour at the capital': { label: 'Currying favour at court', rel: [['rulers', 'merchants', 5]] },
  'Keep order and the taxes flowing': { label: 'Strict order and steady taxes', market: { all: 1.02 }, rel: [['watch', 'thieves', -15]] },
  'Root out a plot against them': { label: 'Hunting conspirators', rel: [['rulers', 'thieves', -15], ['watch', 'mages', -5]], quest: 'plot' },
  'Purge corruption from the ranks': { label: 'Purging the watch', rel: [['watch', 'thieves', -20]] },
  "Break the thieves' guild": { label: "Crackdown on the thieves' guild", market: { luxury: 0.97 }, rel: [['watch', 'thieves', -30], ['merchants', 'watch', 10]], quest: 'thieves' },
  'Win glory in battle': { label: 'Seeking glory', rel: [['watch', 'adventurers', 10]], quest: 'monster' },
  'Build a grand new temple': { label: 'Building a grand temple', market: { crafted: 1.05, iron: 1.05, metal: 1.04 }, rel: [['temple', 'crafts', 15], ['temple', 'merchants', -5]], quest: 'temple' },
  'Root out heresy': { label: 'Hunting heretics', rel: [['temple', 'mages', -25]], quest: 'heresy' },
  "Win the ruler's ear": { label: 'Seeking royal favour', rel: [['temple', 'rulers', 10], ['temple', 'mages', -10]] },
  'Bring every merchant under the guild': { label: 'Tightening the guild monopoly', market: { spice: 1.05, cloth: 1.05, salt: 1.05 }, rel: [['merchants', 'crafts', -15], ['merchants', 'thieves', -10]] },
  'Win a royal charter for the guild': { label: 'Lobbying for a royal charter', rel: [['merchants', 'rulers', 15]] },
  'Ruin a rival trading house': { label: 'Waging a trade war', market: { spice: 0.95, cloth: 0.95 }, rel: [['merchants', 'thieves', 5]], quest: 'sabotage' },
  'Win a great commission for the guild': { label: 'Chasing a great commission', rel: [['crafts', 'rulers', 10]] },
  'Stop cheap imports undercutting the guild': { label: 'Blocking cheap imports', market: { crafted: 1.06, weapon: 1.04 }, rel: [['crafts', 'merchants', -20]] },
  'Pass the mastership to a worthy heir': { label: 'Choosing a successor', rel: [['crafts', 'temple', 5]] },
  'Uncover a lost spell': { label: 'Searching for a lost spell', rel: [['mages', 'adventurers', 10]], quest: 'ruin' },
  'Keep dangerous magic out of the wrong hands': { label: 'Licensing magic strictly', market: { magic: 1.08 }, rel: [['mages', 'thieves', -15], ['mages', 'watch', 10]] },
  'Be named court magus': { label: 'Courting the crown', rel: [['mages', 'rulers', 10], ['mages', 'temple', -5]] },
  'Keep the best tables for the right people': { label: 'Serving only the right people', rel: [['merchants', 'rulers', 5]] },
  'Hear every secret in town': { label: 'Gathering secrets', rel: [['merchants', 'thieves', 5]] },
  'Expand the guild into new towns': { label: 'Expanding the guild', rel: [['adventurers', 'merchants', 10], ['adventurers', 'rulers', -5]], quest: 'monster' },
  'Keep the guild out of local politics': { label: 'Keeping the guild independent', rel: [['adventurers', 'rulers', -5], ['adventurers', 'thieves', 5]] },
  'Clear the old ruins once and for all': { label: 'Sponsoring ruin expeditions', rel: [['adventurers', 'mages', 10]], quest: 'ruin' }
};
const EXPORT_TAG = { Grain: 'grain', Wool: 'wool', Horses: 'horse', Cattle: 'cattle', Timber: 'timber', Furs: 'hide', Game: 'meat', Charcoal: 'timber', Amber: 'luxury', Spices: 'spice', Dyes: 'cloth', 'Exotic hides': 'exotic', Hardwoods: 'timber', Peat: 'gear', Reeds: 'gear', 'Alchemical herbs': 'alchemy', Eels: 'meat', Glass: 'luxury', Salt: 'salt', Camels: 'camel', Goats: 'livestock', 'Olive oil': 'food', Hides: 'hide', 'Whale oil': 'gear', Ivory: 'luxury', Iron: 'iron', Silver: 'precious', Stone: 'crafted', Gems: 'precious', Ice: 'food', 'Rare ores': 'metal', Fish: 'meat', 'Shells & pearls': 'luxury' };
function agendaOf(motive) {
  if (AGENDA[motive]) return AGENDA[motive];
  const m = /^Corner the market in (.+)$/.exec(motive || '');
  if (m) { const tag = EXPORT_TAG[m[1].charAt(0).toUpperCase() + m[1].slice(1)] || 'grain'; return { label: 'Cornering the ' + m[1] + ' market', market: { [tag]: 1.12 }, rel: [['merchants', 'crafts', -5]] }; }
  return null;
}
const AGENDA_CHOICES = { leader: ['Refill an empty treasury', 'Win the next war with a neighbouring realm', 'Secure the succession', 'Keep the great houses loyal', 'Win favour at the capital', 'Keep order and the taxes flowing', 'Root out a plot against them'], watch: ['Purge corruption from the ranks', "Break the thieves' guild", 'Win glory in battle'], faith: ['Build a grand new temple', 'Root out heresy', "Win the ruler's ear"], trade: ['Bring every merchant under the guild', 'Win a royal charter for the guild', 'Ruin a rival trading house'], craft: ['Win a great commission for the guild', 'Stop cheap imports undercutting the guild', 'Pass the mastership to a worthy heir'], arcane: ['Uncover a lost spell', 'Keep dangerous magic out of the wrong hands', 'Be named court magus'], service: ['Keep the best tables for the right people', 'Hear every secret in town'], adventurer: ['Expand the guild into new towns', 'Keep the guild out of local politics', 'Clear the old ruins once and for all'] };
// the powerful: a settlement's leaders, plus its adventurers' guildmaster
function powerful(s) {
  const out = [];
  if (!s) return out;
  const tp = townPeople(s, LEADERS[s.tier].length);
  for (const p of tp.list) out.push(withOv(p));
  const R = roster(s);
  if (R) out.push(withOv(R.list[0]));
  return out;
}
const agendaCache = new Map();
function agendaList(s) {
  const key = s.id + '|' + mkVer;
  const c = agendaCache.get(key);
  if (c) return c;
  const out = [];
  const st = gst().ag;
  const add = (p, scope, strength) => {
    if ((p.status || 'Alive') !== 'Alive' || st[p.id]) return;
    const A = agendaOf(p.motive);
    if (A) out.push({ p, A, scope, strength });
  };
  for (const p of powerful(s)) add(p, 'local', 1);
  if (s.tier !== 4 && CAPS.length) {
    const cap = CAPLIST[T.realmAt(s.x, s.y, CAPS).i];
    if (cap && cap.id !== s.id) for (const p of townPeople(cap, LEADERS[4].length).list.slice(0, 2)) add(withOv(p), 'realm', 0.5);
  }
  agendaCache.set(key, out);
  if (agendaCache.size > 3000) agendaCache.clear();
  return out;
}
function agendaFx(s) {
  const fx = {};
  for (const a of agendaList(s)) if (a.A.market) for (const t in a.A.market) fx[t] = (fx[t] || 1) * (1 + (a.A.market[t] - 1) * a.strength);
  return fx;
}
function warAgenda(capId) { const c = SBY.get(capId); return !!c && agendaList(c).some((a) => a.A.war && a.scope === 'local'); }

// ---------------------------------------------------------------- relations between organisations
function orgsIn(s) { return ORG_KEYS.filter((k) => orgHere(s, k)); }
function orgRel(a, b, s, day) {
  const pk = pairKey(a, b), pi = Object.keys(BASE_REL).indexOf(pk);
  const base = (BASE_REL[pk] || 0) + Math.round(T.hash(pi, 1, 990) * 24 - 12);
  const ri = CAPS.length ? T.realmAt(s.x, s.y, CAPS).i : 0;
  const drift = 14 * T.noise2(day / 30 + pi * 3.7, ri * 2.3 + 0.5) + 5 * T.noise2(day / 7 + pi * 1.3, (hashStr(s.id) % 997) * 0.1);
  let ev = 0;
  for (const [ti, f] of modsFor(s, day)) for (const [x, y, d] of EV_REL[ETYPES[ti]] || []) if (pairKey(x, y) === pk) ev += d * f;
  let ag = 0;
  const why = [];
  for (const A of agendaList(s)) for (const [x, y, d] of A.A.rel || []) if (pairKey(x, y) === pk) { ag += d * A.strength; why.push(npcName(A.p) + ': ' + A.A.label.toLowerCase()); }
  const dm = gst().shift[pk] || 0;
  const v = clamp(Math.round(base + drift + ev + ag + dm), -100, 100);
  return { v, base, drift: Math.round(drift), ev: Math.round(ev), ag: Math.round(ag), dm, why };
}
const relWord = (v) => (v <= -50 ? 'Feud' : v <= -15 ? 'Hostile' : v < 15 ? 'Wary' : v < 50 ? 'Friendly' : 'Allied');
function relCell(v) {
  const k = Math.min(1, Math.abs(v) / 80);
  const c = v < 0 ? [192, 83, 58] : [63, 143, 94];
  return 'background:rgba(' + c.join(',') + ',' + (0.12 + k * 0.6).toFixed(2) + ')';
}
const partyRep = (org) => clamp(gst().rep[org] || 0, -100, 100);

// ---------------------------------------------------------------- the Adventurers' Guild hall and its members
const rosterCache = new Map();
function roster(s) {
  const LV = guildLevel(s, 'adventurers');
  if (!s || LV < 1) return null;
  const key = s.id + '|' + s.tier + '|' + s.name + '|' + s.pop + '|' + mkVer + '|' + LV;
  const c = rosterCache.get(s.id);
  if (c && c.key === key) return c;
  const rng = T.mulberry(hashStr('adv:' + s.id) ^ (SEED * 40503));
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const P = profile(s);
  const races = P.races.map((r) => [r[0], r[1]]);
  // a lodge is a handful of members; a hall as many as the town supports; the realm's grand hall a few more
  const n = LV === 1 ? 3 + Math.floor(rng() * 3) : { 2: 7, 3: 14, 4: 22 }[s.tier] + Math.floor(rng() * 5) + (LV === 3 ? 4 : 0);
  // levels fall away exponentially: about 30% of adventurers are level 1, 3% reach level 10,
  // and level 18+ (Adamantine) can only turn up in a metropolis (over 25,000 people)
  const metro = s.pop >= 25000;
  const cap = LV === 1 ? { 2: 6, 3: 9, 4: 11 }[s.tier] : metro ? 20 : { 2: 10, 3: 15, 4: 17 }[s.tier];
  const tail = 1 - Math.exp(-0.36 * cap);
  const lvl = () => Math.min(cap, 1 + Math.floor(-Math.log(1 - rng() * tail) / 0.36));
  const hall = 'The ' + pick(HALL_A) + ' ' + pick(HALL_N);
  const list = [], rels = [], companies = [];
  const mk = (i, level, company, role, job) => {
    const race = pickW(rng, races, 1)[0];
    const fem = rng() < 0.5;
    const A = AGE[race] || AGE.Human;
    const cls = job === 'Guild clerk' ? null : pick(CLASSES);
    const fn = FIRST[race] || FIRST.Human;
    const youth = level ? Math.min(1, level / 12) : 0.5;
    const age = Math.max(Math.round(A[0] + (A[1] - A[0]) * (0.08 + 0.45 * youth * rng())), role === 'trainee' ? A[0] : A[0] + 1);
    const r0 = rankForLevel(level || 1), r1 = Math.min(7, r0 + 1);
    const merit = level ? Math.round(RANKS[r0][1] + (r0 < 7 ? (RANKS[r1][1] - RANKS[r0][1]) * rng() * 0.85 : rng() * 3000)) : 0;
    const title = job || 'Adventurer';
    const p = {
      id: s.id + '#a' + i, idx: -1, adv: i, sid: s.id, race, fem, age, cls, level, merit, role,
      job: cls ? title + ' · level ' + level + ' ' + cls.toLowerCase() + (role === 'trainee' ? ' (in training)' : role === 'mentor' ? ' (mentor)' : '') : title,
      group: 'adventurer', secretJob: null, company: company ? company.id : null, companyName: company ? company.name : null,
      life: level ? clamp(2 + Math.floor(rankOf(merit) / 2), 2, 6) : 3, stat: cls ? 'Level ' + level + ' ' + cls.toLowerCase() : 'Commoner',
      first: pick(fem ? fn[1] : fn[0]), last: pick(SURN[race] || SURN.Human), trait: pick(TRAITS), ideal: pick(IDEALS), flaw: pick(FLAWS), quirk: pick(QUIRKS), secret: pick(SECRETS),
      disp0: Math.round((rng() - 0.4) * 30), h: hashStr(s.id + '#a' + i) & 0x7fffffff,
      motive: i === 0 ? pick(AGENDA_CHOICES.adventurer) : i === 1 ? 'Keep the ledgers straight and the guildmaster happy' : role === 'trainee' ? 'Survive long enough to earn Iron rank' : role === 'mentor' ? 'Keep the young ones alive' : pick(ADV_MOTIVES)
    };
    { const base = townPeople(s, baseCount(s)).list; uniqueName(p, (f, l) => list.some((q) => q.first === f && (q.last || '') === l) || base.some((q) => q.first === f && (q.last || '') === l)); }
    if (company) { for (const m of company.members) rels.push({ a: m, b: i, type: 'friend' }); company.members.push(i); }
    list.push(p);
    return p;
  };
  const gmLv = LV === 1 ? { 2: 3 + Math.floor(rng() * 3), 3: 5 + Math.floor(rng() * 3), 4: 6 + Math.floor(rng() * 4) }[s.tier] : (metro ? 13 + Math.floor(rng() * 6) : { 2: 6 + Math.floor(rng() * 4), 3: 9 + Math.floor(rng() * 5), 4: 12 + Math.floor(rng() * 5) }[s.tier]);
  mk(0, gmLv, null, null, LV === 1 ? 'Lodge warden' : 'Guildmaster');
  mk(1, 0, null, null, 'Guild clerk');
  let i = 2;
  while (i < n) {
    if (rng() < 0.8 && n - i >= 2) {
      let nm = '';
      for (let t = 0; t < 6 && (!nm || companies.some((x) => x.name === nm)); t++) nm = 'The ' + pick(CO_A) + ' ' + pick(CO_N);
      const L0 = lvl();
      const size = Math.min(n - i, 2 + Math.floor(rng() * 4));
      const co = { id: s.id + ':c' + companies.length, name: nm, members: [], level: L0 };
      companies.push(co);
      // companies share a level; now and then one takes on a trainee or travels with an old hand
      const special = size >= 3 && rng() < 0.3 ? (rng() < 0.55 || L0 <= 2 ? 'trainee' : 'mentor') : null;
      const first = i;
      for (let k = 0; k < size; k++) {
        const role = special && k === size - 1 ? special : null;
        const L = role === 'trainee' ? Math.max(1, L0 - 3 - Math.floor(rng() * 3)) : role === 'mentor' ? Math.min(cap, L0 + 3 + Math.floor(rng() * 4)) : clamp(L0 + Math.round((rng() - 0.5) * 2.2), 1, cap);
        mk(i, L, co, role);
        i++;
      }
      if (special === 'trainee') { const top = co.members.slice(0, -1).reduce((b, m) => (list[m].level > list[b].level ? m : b), first); rels.push({ a: top, b: i - 1, type: 'mentor' }); }
      if (special === 'mentor') { const low = co.members.slice(0, -1).reduce((b, m) => (list[m].level < list[b].level ? m : b), first); rels.push({ a: i - 1, b: low, type: 'mentor' }); }
    } else { mk(i, lvl(), null, null); i++; }
  }
  for (let j = 3; j < list.length; j++) if (rng() < 0.18) { const o = 2 + Math.floor(rng() * (j - 2)); if (list[o].company !== list[j].company) rels.push({ a: o, b: j, type: 'rival' }); }
  const out = { key, s, hall, list, rels, companies, lv: LV };
  rosterCache.set(s.id, out);
  if (rosterCache.size > 60) rosterCache.delete(rosterCache.keys().next().value);
  return out;
}
function hallFor(s) {
  if (!s) return null;
  if (guildLevel(s, 'adventurers') >= 1) return s;
  let best = null, bd = 1e9;
  SGRID.query(s.x - 250, s.y - 250, s.x + 250, s.y + 250, (n) => { if (guildLevel(n, 'adventurers') >= 1) { const d = Math.hypot(n.x - s.x, n.y - s.y); if (d < bd) { bd = d; best = n; } } });
  return best;
}

// ---------------------------------------------------------------- quests (deterministic postings every five days)
const POST = 5;
const questCache = new Map();
function crRank(cr) { const v = crNum(cr); return v <= 1 ? 0 : v <= 2 ? 1 : v <= 4 ? 2 : v <= 6 ? 3 : v <= 8 ? 4 : v <= 11 ? 5 : v <= 15 ? 6 : 7; }
function rewardFor(rank, r, m) { const [a, b] = REWARD[rank]; const v = (a + (b - a) * r) * (m || 1); const step = v < 50 ? 5 : v < 500 ? 25 : v < 5000 ? 100 : 500; return Math.round(v / step) * step; }
function makeQuest(s, c, k, rng) {
  const post = c * POST + Math.floor(rng() * POST);
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const base = townPeople(s).list.slice(0, baseCount(s)).map(withOv);
  const leaders = base.slice(0, LEADERS[s.tier].length);
  const mods = modsFor(s, post);
  const ags = agendaList(s).filter((a) => a.A.quest);
  const nbs = neighbours(s);
  const nb = nbs.length ? pick(nbs)[0] : s;
  const vils = [];
  SGRID.query(s.x - 35, s.y - 35, s.x + 35, s.y + 35, (v) => { if (v.tier === 1) vils.push(v); });
  let vil = vils.length ? pick(vils) : nb;
  const q = { id: 'q:' + s.id + ':' + c + ':' + k, sid: s.id, post, loc: s.id, client: null, clientOrg: 'rulers', against: null, eventId: null, rank: 0, kind: 'errand' };
  const threat = threatOf(s, post);
  const kinds = [['monster', 14 + 46 * Math.min(1.5, threat)], ['event', mods.length ? 45 : 0], ['agenda', ags.length ? 16 : 0], ['resident', 20], ['errand', 10]];
  const kind = pickW(rng, kinds, 1)[0];
  q.kind = kind;
  const who = (g) => base.find((p) => p.group === g && (p.status || 'Alive') === 'Alive');
  let target = null;
  if (kind === 'monster') {
    // prefer creatures actually roaming near the town: the stronger and closer, the likelier a bounty
    const cap = ({ 2: 6, 3: 11, 4: 30 })[s.tier];
    const near = presence(s, post).filter((o) => crNum(o.sp.cr) >= 0.125 && crNum(o.sp.cr) <= cap && !AQUATIC.has(o.sp.name) && o.sp.kind !== 'placed' || o.sp.kind === 'placed');
    if (near.length) {
      let tot = 0; const w = near.map((o) => { const x = Math.pow(spawnXP(o.sp), 0.7) / (8 + o.d); tot += x; return x; });
      let r = rng() * tot, i = 0; for (; i < near.length - 1; i++) { r -= w[i]; if (r <= 0) break; }
      target = near[i].sp;
      const np = nearestPlace(target.x, target.y);
      if (np) vil = np.s;
    }
  }
  if (kind === 'monster') {
    const fa = (FAUNA[vil.b] || FAUNA[5]).filter((f) => !PEACEFUL.has(f[0]) && crNum(f[1]) >= 0.5 && crNum(f[1]) <= ({ 2: 6, 3: 11, 4: 30 })[s.tier]);
    let f = target ? [target.name, target.cr] : fa.length ? pick(fa) : ['Dire Wolf', '1'];
    const dc = DRAGON[vil.b] || DRAGON[s.b];
    if (!target && dc && s.tier >= 3 && rng() < (s.tier === 4 ? 0.14 : 0.07)) f = s.tier === 4 && rng() < 0.45 ? ['Adult ' + dc + ' dragon', dc === 'white' ? '13' : dc === 'black' ? '14' : dc === 'green' ? '15' : dc === 'blue' ? '16' : '17'] : ['Young ' + dc + ' dragon', dc === 'white' ? '6' : dc === 'black' ? '7' : dc === 'green' ? '8' : dc === 'blue' ? '9' : '10'];
    q.rank = crRank(f[1]);
    q.loc = vil.id;
    const nm = f[0].toLowerCase(), cr = ' (CR ' + f[1] + ')';
    q.mon = f[0]; q.count = 1;
    if (RAIDERS.has(f[0])) { q.count = 3 + Math.floor(rng() * 6); q.title = 'Drive off the ' + nm + ' raiders near ' + vil.name; q.desc = 'A war band of ' + nm + 's' + cr + ' has been raiding farms around ' + vil.name + '. Break them and bring back their banner.'; }
    else if (/dragon/.test(nm)) { q.title = 'Slay the ' + nm + ' above ' + vil.name; q.desc = aan(nm) + ' ' + nm + cr + ' has made its lair in the wilds near ' + vil.name + ' and demands tribute. The crown and the guild together post the bounty.'; q.clientOrg = 'rulers'; }
    else if (crNum(f[1]) <= 2 && rng() < 0.5) { q.count = 2 + Math.floor(rng() * 3); q.title = 'Clear the ' + nm + ' lair near ' + vil.name; q.desc = 'Several ' + nm + 's' + cr + ' have taken to the land around ' + vil.name + ' and are killing livestock. Find the lair and clear it.'; }
    else { q.title = 'Hunt the ' + nm + ' troubling ' + vil.name; q.desc = aan(nm) + ' ' + nm + cr + ' has been seen near ' + vil.name + '. Bring back proof that the threat is ended.'; }
    if (target) { q.spawnId = target.id; q.count = target.count; q.rank = Math.min(7, crRank(target.cr) + (target.count >= 8 ? 2 : target.count >= 4 ? 1 : 0)); const d = Math.round(Math.hypot(target.x - vil.x, target.y - vil.y)); if (d > 2) q.desc += ' Last seen ' + d + ' miles ' + dirWord(target.x - vil.x, target.y - vil.y) + ' of ' + vil.name + '.'; }
    const reeve = vil.tier === 1 ? withOv(townPeople(vil, 1).list[0]) : leaders[0];
    q.client = reeve ? reeve.id : null; q.clientOrg = 'rulers';
  } else if (kind === 'event') {
    const [ti, f, e] = pick(mods);
    const t = ETYPES[ti];
    q.eventId = e.id;
    if (t === 'bandits') { q.mon = 'Bandit'; q.count = 6 + Math.floor(rng() * 7); const gang = e.name.replace(/ near .*/, ''); q.title = 'Bounty: ' + gang; q.desc = gang + ' have been robbing travellers on the roads around ' + e.place + '. The watch pays for every member brought in, and the merchants add a purse for ending them for good.'; q.rank = 2 + (e.I > 0.8 ? 1 : 0); q.clientOrg = 'watch'; q.client = (who('watch') || {}).id; q.ends = true; }
    else if (t === 'famine') { if (rng() < 0.6) { q.title = 'Escort the grain convoy from ' + nb.name; q.desc = 'Hungry folk on the road have already raided one wagon. See the grain safely from ' + nb.name + ' to ' + s.name + '.'; q.rank = 1; q.loc = nb.id; } else { q.title = 'Find the grain hoarders'; q.desc = 'Someone is holding back grain to sell dear while ' + s.name + ' starves. Find the stores and the names behind them.'; q.rank = 2; q.against = 'merchants'; } q.client = (leaders[0] || {}).id; }
    else if (t === 'plague') { if (rng() < 0.5) { q.title = 'Find the source of ' + e.name.replace(/ in .*/, '').replace(/^the /i, 'the '); q.desc = 'The temple believes the sickness has a source: a fouled well, a cursed shrine or something worse. Find it and end it.'; q.rank = 3; q.ends = true; } else { q.title = 'Gather healing herbs beyond ' + nb.name; q.desc = "The healers' stores are empty. Bring back moonleaf and bitterroot from the wilds past " + nb.name + '.'; q.rank = 1; q.loc = nb.id; } q.clientOrg = 'temple'; q.client = (who('faith') || {}).id; }
    else if (t === 'war') { const r = rng(); const ri = CAPS.length ? T.realmAt(s.x, s.y, CAPS).i : -1; const RA = REALMS[e.ai], RB = REALMS[e.bi]; const foe = ((ri === e.ai ? RB : ri === e.bi ? RA : RB) || { name: 'the enemy' }).name; if (r < 0.4) { q.title = 'Scout the ' + foe.replace(/^The /, '') + ' border'; q.desc = 'The marshal needs to know where the enemy is massing. Ride out, look, and come back alive.'; q.rank = 3; } else if (r < 0.75) { q.title = 'Carry dispatches to ' + nb.name; q.desc = 'Sealed orders must reach ' + nb.name + ' within three days. Enemy riders watch the roads.'; q.rank = 2; q.loc = nb.id; } else { q.title = 'Mercenary contract: hold the line against ' + foe; q.desc = 'The crown pays guild members to stand with the levies at the front for one month.'; q.rank = 4; } q.clientOrg = 'rulers'; q.client = (leaders[0] || {}).id; }
    else if (t === 'boom') { q.title = 'Guard the caravan to ' + nb.name; q.desc = 'With merchants flooding in, the roads are thick with thieves. Guard a heavy caravan to ' + nb.name + '.'; q.rank = 1 + (rng() < 0.4 ? 1 : 0); q.clientOrg = 'merchants'; q.client = (who('trade') || {}).id; q.against = 'thieves'; q.loc = nb.id; }
    else if (t === 'festival') { if (rng() < 0.6) { q.title = 'Keep the peace at the ' + e.name.replace(s.name + ' ', '').replace(/^Harvest Home across .*/, 'Harvest Home'); q.desc = 'Crowds, drink and pickpockets. The watch wants extra hands for the festival days.'; q.rank = 0; q.clientOrg = 'watch'; q.client = (who('watch') || {}).id; q.against = 'thieves'; } else { q.title = 'Win the tourney purse'; q.desc = 'The festival tourney is open to guild members. Prize: the purse below, and the crowd\'s favour.'; q.rank = 2; } }
    else { q.title = 'Guard the high table'; q.desc = 'Someone at ' + e.name + ' has enemies. Stand guard, taste the wine, and watch the servants.'; q.rank = 2; q.client = (leaders[0] || {}).id; }
  } else if (kind === 'agenda') {
    const a = pick(ags), p = a.p, org = GROUP_ORG[p.group] || 'rulers';
    q.client = p.id; q.clientOrg = org;
    const T0 = {
      tax: ['Collect overdue taxes in ' + vil.name, 'The treasury is empty and ' + vil.name + ' has not paid. Collect the arrears without starting a riot.', 1, 'merchants'],
      war: ['Recruit mercenaries for the coming war', 'Find capable sellswords and bring them to the marshal. The crown pays per head.', 2, null],
      heir: ['Find the missing heir', 'A claimant to the succession has vanished on the road to ' + nb.name + '. Find them before rivals do.', 3, null],
      plot: ['Uncover the conspiracy', 'Letters suggest a plot against ' + npcName(p) + '. Follow the trail and name the conspirators.', 3, 'thieves'],
      thieves: ["Infiltrate the thieves' guild", 'Join the guild under a false name and learn where they meet. The captain needs proof, not rumours.', 3, 'thieves'],
      monster: ['Slay a beast worthy of a song', npcName(p) + ' wants a famous kill brought to their name. Find something dangerous, and kill it in style.', 4, null],
      temple: ['Escort the quarry stone', 'Blocks for the new temple are coming from the quarries near ' + nb.name + '. Bandits have taken two wagons already.', 1, null],
      heresy: ['Expose the heretics', 'The temple suspects forbidden rites in ' + s.name + '. Find the circle and their sponsor.', 2, 'mages'],
      sabotage: ["Spoil a rival's shipment", 'No questions asked. A rival trading house has a shipment in the warehouse district. Make sure it never sells.', 2, 'merchants'],
      ruin: ['Explore the ruins near ' + nb.name, npcName(p) + ' will pay for any writings recovered from the old ruins past ' + nb.name + '. Many who go there do not come back.', 3, null]
    }[a.A.quest];
    [q.title, q.desc, q.rank, q.against] = T0;
    if (s.tier === 4 && q.rank < 2) q.rank++;
  } else if (kind === 'resident') {
    const p = pick(base.filter((x) => x.group !== 'leader'));
    q.client = p.id; q.clientOrg = GROUP_ORG[p.group] || 'merchants';
    const opts = [
      ['Recover a family heirloom for ' + npcName(p), 'A ring taken by thieves years ago has turned up in ' + nb.name + '. Bring it home.', 1, 'thieves'],
      ['Find ' + p.first + "'s missing apprentice", 'The apprentice went to ' + nb.name + ' on an errand a week ago and never came back.', 1, null],
      ['Clear the giant rats from ' + p.first + "'s cellar", 'Big ones. Very big ones. Bring a torch.', 0, null],
      ['Collect a debt owed to ' + npcName(p), 'A customer in ' + nb.name + ' owes a tidy sum and stopped answering letters.', 0, null],
      ['Discreetly follow ' + p.first + "'s spouse", npcName(p) + ' suspects an affair and will pay well for discretion.', 0, null]
    ];
    if (p.group === 'underworld') opts.push(['No questions asked: move a package to ' + nb.name, 'Small, heavy, and not to be opened. The watch must not see it.', 1, 'watch']);
    [q.title, q.desc, q.rank, q.against] = pick(opts);
    if (p.group === 'underworld') q.clientOrg = 'thieves';
  } else {
    const opts = [['Deliver a sealed letter to ' + nb.name, 'The guild needs a reliable courier. The seal must arrive unbroken.', 0], ['Map the old road to ' + nb.name, 'The guild wants an up-to-date map of the old road, its fords and its dangers.', 1], ['Escort a pilgrim to ' + nb.name, 'An elderly pilgrim insists on walking. Keep them safe.', 0]];
    [q.title, q.desc, q.rank] = pick(opts);
    q.clientOrg = 'adventurers';
  }
  q.rank = clamp(q.rank, 0, 7);
  // clients and rivals must be organisations that are actually here
  if (!orgHere(s, q.clientOrg)) q.clientOrg = 'rulers';
  if (q.against && !orgHere(s, q.against)) q.against = null;
  { const dm = dangerMult(s, post); q.reward = rewardFor(q.rank, rng(), q.kind === 'monster' ? dm : 1 + (dm - 1) * 0.3); }
  q.merit = MERIT[q.rank];
  q.exp = post + 12 + Math.floor(rng() * 19);
  // other guild members may take the job first
  const R = roster(s);
  const fit = R ? R.companies.filter((cp) => rankForLevel(cp.level) >= q.rank) : [];
  if (fit.length && rng() < 0.5) { const cp = fit[Math.floor(rng() * fit.length)]; q.npcTake = post + 2 + Math.floor(rng() * 12); q.npcBy = cp.name; q.dur = 2 + Math.floor(rng() * 9); q.npcWin = rng() < 0.75; }
  return q;
}
function questsFor(s, day) {
  const LV = guildLevel(s, 'adventurers');
  const hall = LV >= 1 ? s : null;
  if (!hall) return [];
  const out = [];
  const lo = LV === 1 ? [0, 1] : LV === 3 ? { 2: [2, 3], 3: [3, 4], 4: [4, 5] }[s.tier] : { 2: [1, 2], 3: [2, 3], 4: [3, 4] }[s.tier];
  const kept = [];
  for (let c = Math.floor((day - 95) / POST); c <= Math.floor(day / POST); c++) {
    const key = s.id + '|' + c + '|' + mkVer;
    let qs = questCache.get(key);
    if (!qs) {
      const rng = T.mulberry((hashStr('q:' + s.id) ^ Math.imul(c + 7, 7919) ^ SEED) >>> 0);
      const n = lo[0] + Math.floor(rng() * (lo[1] - lo[0] + 1)) + Math.min(LV === 1 ? 1 : 2, Math.floor(threatOf(s, c * POST) * 1.2));
      qs = [];
      // each notice has its own random stream, so a change to one never reshuffles the others
      for (let k = 0; k < n; k++) qs.push(makeQuest(s, c, k, T.mulberry((hashStr('q:' + s.id + ':' + c + ':' + k) ^ SEED) >>> 0)));
      questCache.set(key, qs);
      if (questCache.size > 4000) questCache.clear();
    }
    for (const q of qs) {
      if (q.post > day) continue;
      // one notice per creature group: skip a repost while an earlier one is still up
      if (!gst().q[q.id]) {
        if (q.spawnId && kept.some((o) => o.spawnId === q.spawnId && o.exp > q.post)) continue;
        // the same notice is never reposted within 45 days, so clients don't seem to ask twice
        if (kept.some((o) => o.title === q.title && o.post > q.post - 45)) continue;
      }
      kept.push(q);
      if (q.post >= day - 50) out.push(snapOf(q));
    }
  }
  for (const q of gst().custom) if (q.sid === s.id && q.post <= day) out.push(q);
  return out;
}
// once the party takes a job its details are frozen, whatever happens to the world afterwards
function snapOf(q) { const st = gst().q[q.id]; return st && st.snap ? st.snap : q; }
function findQuest(id) {
  const st0 = gst().q[id];
  if (st0 && st0.snap) return st0.snap;
  const cq = gst().custom.find((q) => q.id === id);
  if (cq) return cq;
  const m = /^q:(.+):(-?\d+):(\d+)$/.exec(id || '');
  if (!m) return null;
  const s = SBY.get(m[1]);
  if (!s) return null;
  questsFor(s, +m[2] * POST + POST);
  const qs = questCache.get(s.id + '|' + m[2] + '|' + mkVer);
  return qs ? qs[+m[3]] || null : null;
}
function questState(q, day) {
  const st = gst().q[q.id];
  if (st && st.st !== 'abandoned') return st.st;
  if (q.spawnId) { if (monGone(q.spawnId, day) || !spawnLive(q.spawnId, day)) return 'gone'; }
  if (q.npcTake != null && day >= q.npcTake && !(st && st.st === 'abandoned' && st.d > q.npcTake)) return day < q.npcTake + q.dur ? 'npc' : q.npcWin ? 'npcdone' : 'npcfail';
  if (day >= q.exp) return 'expired';
  if (q.eventId && q.ends) { const e = findEvent(q.eventId); if (!e || e.end <= day) return 'expired'; }
  return 'open';
}
const Q_LABEL = { open: 'Open', accepted: 'Accepted by the party', done: 'Completed by the party', failed: 'Failed by the party', npc: 'Taken', npcdone: 'Completed', npcfail: 'Failed', expired: 'Expired', gone: 'Threat gone' };
function partyTopRank() { const m = gst().party.members; return m.length ? Math.max(...m.map((x) => rankOf(x.merit || 0))) : -1; }

// ---------------------------------------------------------------- panel
function guildHeader(s) {
  const tabs = [['board', 'Quests'], ['members', 'Members'], ['orgs', 'Orgs'], ['influence', 'Influence']];
  return '<div class="mk-head"><div><div class="eyebrow">Guilds · ' + dateText(market.day) + '</div><h2>' + (s ? tLink(s) : 'Guilds') + '</h2></div><button type="button" class="x" data-act="close" aria-label="Close panel">×</button></div>' +
    '<div class="seg mk-tabs g4" role="tablist">' + tabs.map(([k, l]) => '<button type="button" role="tab" data-gd="tab" data-v="' + k + '" aria-pressed="' + (guildUI.tab === k) + '">' + l + '</button>').join('') + '</div>';
}
function questRow(q, day) {
  const st = questState(q, day), top = partyTopRank();
  const left = q.exp - day;
  const meta = st === 'open' ? (left <= 1 ? 'last day' : left + ' days left') : Q_LABEL[st] + (q.npcBy && st.startsWith('npc') ? ' by ' + q.npcBy : '');
  return '<li><button type="button" data-gd="quest" data-v="' + esc(q.id) + '" class="' + (st === 'accepted' ? 'mine' : '') + '">' + rankBadge(q.rank, true) + '<span class="t"><b>' + esc(q.title) + '</b><small>' + (st === 'open' || st === 'accepted' ? dangerChip(q) + ' ' : '') + coinHtml(q.reward) + ' · ' + q.merit + ' merit · ' + meta + (top >= 0 && q.rank > top && st === 'open' ? ' · above your rank' : '') + '</small></span></button></li>';
}
function boardTab(s, day) {
  const sel0 = s;
  const hall = hallFor(s);
  if (!hall) return '<div class="empty-note"><p>Tap a town or city on the map to open its Adventurers\' Guild hall.</p><p class="meta">Bigger towns have a guild hall or a small lodge with a quest board. Everywhere else posts its jobs at the nearest one.</p></div>';
  const R = roster(hall), gm = withOv(R.list[0]);
  let h = '<div class="hall"><div><div class="eyebrow">Adventurers\' Guild · ' + BRANCH.adventurers[guildLevel(hall, 'adventurers')].toLowerCase() + '</div><h3 class="town-name">' + oLink('adventurers', hall.id, R.hall) + '</h3><p class="meta">' + tLink(hall) + (hall !== sel0 ? ' (nearest hall to ' + tLink(sel0) + ')' : '') + ' · ' + (R.lv === 1 ? 'Lodge warden' : 'Guildmaster') + ' <button type="button" class="link" data-pp="npc" data-v="' + esc(gm.id) + '">' + esc(npcName(gm)) + '</button> ' + rankBadge(rankOf(gm.merit), true) + '</p></div></div>';
  const P = gst().party;
  h += P.members.length ? '<p class="meta">Your party' + (P.name ? ', <b>' + esc(P.name) + '</b>,' : '') + ' holds up to ' + rankBadge(partyTopRank(), true) + ' rank and ' + money(P.gold || 0) + ' in earnings.</p>' : '<p class="meta">Register your party on the Members tab to take quests and earn ranks.</p>';
  const all = questsFor(hall, day);
  const mine = all.filter((q) => questState(q, day) === 'accepted');
  const open = all.filter((q) => questState(q, day) === 'open').sort((a, b) => a.rank - b.rank || a.exp - b.exp);
  const recent = all.filter((q) => { const st = questState(q, day); return st !== 'open' && st !== 'accepted' && (st !== 'expired' || day - q.exp < 6); }).sort((a, b) => b.post - a.post).slice(0, 8);
  if (mine.length) h += '<section><h3>Your active quests</h3><ul class="evlist quests">' + mine.map((q) => questRow(q, day)).join('') + '</ul></section>';
  h += '<section><h3>On the board (' + open.length + ')</h3>' + (open.length ? '<ul class="evlist quests">' + open.map((q) => questRow(q, day)).join('') + '</ul>' : '<p class="meta">The board is bare today. New notices go up every few days.</p>') + '</section>';
  if (recent.length) h += '<details class="board"><summary><span>Recently taken or closed</span><small>' + recent.length + '</small></summary><ul class="evlist quests pad">' + recent.map((q) => questRow(q, day)).join('') + '</ul></details>';
  h += '<details class="board"><summary><span>Post your own quest</span></summary><div class="pad grid">' +
    '<div class="field"><label class="lab" for="gq-title">Title</label><input id="gq-title" maxlength="80" placeholder="Escort the bishop to Ashford"></div>' +
    '<div class="row2"><div class="field"><label class="lab" for="gq-rank">Rank</label><select id="gq-rank">' + RANKS.map((r, i) => '<option value="' + i + '">' + r[0] + '</option>').join('') + '</select></div><div class="field"><label class="lab" for="gq-org">Client</label><select id="gq-org">' + orgsIn(hall).map((k) => '<option value="' + k + '">' + ORGS[k].short + '</option>').join('') + '</select></div></div>' +
    '<div class="field"><label class="lab" for="gq-desc">Details</label><textarea id="gq-desc" rows="2" maxlength="400"></textarea></div>' +
    '<div class="actions"><button type="button" class="btn primary" data-gd="post">Pin to the board</button></div></div></details>';
  return h;
}
function questView(q, day) {
  const s = SBY.get(q.sid), loc = SBY.get(q.loc) || s;
  const st = questState(q, day);
  const client = q.client ? npcById(q.client) : null;
  const ev = q.eventId ? findEvent(q.eventId) : null;
  const top = partyTopRank();
  let h = '<button type="button" class="link back" data-gd="back">‹ Quest board</button>';
  h += '<div class="ev-h">' + rankBadge(q.rank) + '<div><div class="eyebrow">' + esc(Q_LABEL[st]) + (q.npcBy && st.startsWith('npc') ? ' by ' + esc(q.npcBy) : '') + (q.custom ? ' · posted by you' : '') + '</div><h3 class="town-name">' + esc(q.title) + '</h3></div></div>';
  h += '<p>' + esc(q.desc || '') + '</p>';
  h += '<dl class="stats">' + stat('Reward', coinHtml(q.reward)) + stat('Merit', q.merit) + stat('Danger', dangerChip(q)) + '</dl>';
  if (q.mon && MON[q.mon]) {
    const m = MON[q.mon], cr = /dragon/.test(q.mon) ? m[4] : m[4];
    const lv = gst().party.members.map((x) => x.level);
    const d = difficulty(lv, cr, q.count || 1);
    const xp = XP_CR[cr] * (q.count || 1);
    h += '<section><h3>The threat</h3><p>' + (q.count > 1 ? q.count + ' × ' : '') + monLink(q.mon) + ' <small class="meta">CR ' + cr + ' · AC ' + m[1] + ' · HP ' + m[2] + (q.mon === 'Bandit' ? ' · led by a ' : '') + '</small>' + (q.mon === 'Bandit' ? monLink('Bandit Captain') : '') + '</p>' +
      (d ? '<p><span class="diff d' + d.k + '">' + d.label + '</span> for your party <small class="meta">(adjusted ' + d.adj.toLocaleString('en-GB') + ' XP against a deadly threshold of ' + d.th[3].toLocaleString('en-GB') + ')</small></p><p class="meta">Worth ' + xp.toLocaleString('en-GB') + ' XP, about ' + Math.round(xp / lv.length).toLocaleString('en-GB') + ' each. Difficulty uses the Dungeon Master\'s Guide thresholds.</p>' : '<p class="meta">Worth ' + xp.toLocaleString('en-GB') + ' XP. Register your party to see how hard this is for them.</p>') + '</section>';
  }
  h += '<ul class="facts"><li><span>Client</span><div>' + (client ? '<button type="button" class="link" data-pp="npc" data-v="' + esc(client.id) + '">' + esc(npcName(client)) + '</button> <small>' + esc(client.job) + ', ' + oLink(q.clientOrg, q.sid, ORGS[q.clientOrg].short) + '</small>' : oLink(q.clientOrg, q.sid)) + '</div></li>' +
    '<li><span>Where</span><div>' + (loc ? tLink(loc) : '—') + '</div></li>' +
    (q.spawnId ? '<li><span>Target</span><div><button type="button" class="link" data-mon-spawn="' + esc(q.spawnId) + '">' + esc(q.mon) + (q.count > 1 ? ' ×' + q.count : '') + ' on the map</button></div></li>' : '') +
    '<li><span>Posted</span><div>' + dateText(q.post) + '</div></li><li><span>Board until</span><div>' + dateText(q.exp - 1) + '</div></li>' +
    (ev ? '<li><span>Because of</span><div><button type="button" class="link" data-mk="event" data-v="' + esc(ev.id) + '">' + esc(ev.name) + '</button></div></li>' : '') + '</ul>';
  const gain = 6 + q.rank * 2;
  h += '<section><h3>If the party succeeds</h3><ul class="movers"><li><span>Reputation with ' + oLink(q.clientOrg, q.sid) + '</span><span class="chg"><i class="pos">▲</i>+' + gain + '</span></li>' +
    (q.against ? '<li><span>Reputation with ' + oLink(q.against, q.sid) + '</span><span class="chg"><i class="neg">▼</i>−' + (5 + q.rank) + '</span></li><li><span>' + ORGS[q.clientOrg].short + ' and ' + ORGS[q.against].short + ' relations</span><span class="chg">−4</span></li>' : '') +
    (client ? '<li><span>' + esc(npcName(client)) + "'s attitude</span><span class=\"chg\"><i class=\"pos\">▲</i>+15</span></li>" : '') +
    (q.ends && ev ? '<li><span>' + esc(ev.name) + '</span><span class="chg">ends</span></li>' : '') + '</ul></section>';
  if (top >= 0 && q.rank > top) h += '<p class="secret-line">This job is above your party\'s rank (' + RANKS[top][0] + '). The guild would normally refuse; you can still accept it as DM.</p>';
  const P = gst().party;
  h += '<div class="actions">';
  if (st === 'open' || st === 'expired') h += P.members.length ? '<button type="button" class="btn primary" data-gd="accept">Accept for the party</button>' : '<button type="button" class="btn" data-gd="tab" data-v="members">Register your party first</button>';
  if (st === 'accepted') h += '<button type="button" class="btn primary" data-gd="done">Mark completed</button><button type="button" class="btn danger" data-gd="fail">Mark failed</button><button type="button" class="btn" data-gd="abandon">Abandon</button>';
  if (q.custom) h += '<button type="button" class="btn danger" data-gd="unpost">Take down</button>';
  return h + '</div>';
}
function membersTab(s, day) {
  const P = gst().party;
  let h = '<section><h3>Your party</h3><div class="field"><label class="lab" for="gp-name">Company name</label><input id="gp-name" maxlength="50" placeholder="The Unlikely Heroes" value="' + esc(P.name || '') + '"></div>';
  if (P.members.length) {
    h += '<ul class="pcs">' + P.members.map((m) => {
      const r = rankOf(m.merit || 0), next = RANKS[r + 1];
      const f = next ? ((m.merit || 0) - RANKS[r][1]) / (next[1] - RANKS[r][1]) : 1;
      return '<li><div class="pc-top">' + rankBadge(r) + '<b>' + (String(m.id).startsWith('h:') && heroes.list.some((x) => 'h:' + x.id === m.id) ? '<button type="button" class="link" data-hero="' + esc(m.id.slice(2)) + '">' + esc(m.name) + '</button>' : esc(m.name)) + '</b><small>Level ' + m.level + ' ' + esc(m.cls) + '</small><button type="button" class="x sm" data-gd="rmpc" data-v="' + esc(m.id) + '" aria-label="Remove ' + esc(m.name) + '">×</button></div>' +
        '<div class="pc-bar"><i><em style="width:' + (f * 100).toFixed(0) + '%"></em></i><small>' + (m.merit || 0) + (next ? ' / ' + next[1] + ' merit to ' + next[0] : ' merit · highest rank') + '</small></div>' +
        '<div class="actions"><button type="button" class="btn sm" data-gd="demote" data-v="' + esc(m.id) + '"' + (r === 0 ? ' disabled' : '') + '>Demote</button><button type="button" class="btn sm" data-gd="promote" data-v="' + esc(m.id) + '"' + (!next ? ' disabled' : '') + '>Promote</button><button type="button" class="btn sm" data-gd="lvl" data-v="' + esc(m.id) + '">Level up</button></div></li>';
    }).join('') + '</ul><p class="meta">Earnings so far: <b>' + money(P.gold || 0) + '</b>. Completed quests add merit to every member; ranks rise automatically.</p>';
  } else h += '<p class="meta">Add each player character to register them with the Adventurers\' Guild. Everyone starts at Copper rank.</p>';
  h += '<div class="pcform"><input id="gp-pc" maxlength="40" placeholder="Character name" aria-label="Character name"><select id="gp-cls" aria-label="Class">' + CLASSES.map((c) => '<option>' + c + '</option>').join('') + '</select><input id="gp-lv" type="number" min="1" max="20" value="1" aria-label="Level"><button type="button" class="btn primary" data-gd="addpc">Register</button></div></section>';
  h += '<section><h3>Ranks</h3><ul class="ranks">' + RANKS.map((r, i) => '<li>' + rankBadge(i, true) + '<span>' + r[1].toLocaleString('en-GB') + ' merit</span><small>about level ' + r[2] + '+ · jobs ' + money(REWARD[i][0]) + '–' + money(REWARD[i][1]) + '</small></li>').join('') + '</ul></section>';
  const hall = hallFor(s);
  if (hall) {
    const R = roster(hall);
    h += '<section><h3>Members of ' + esc(R.hall) + ', ' + esc(hall.name) + '</h3>';
    const staff = R.list.slice(0, 2).map(withOv);
    const groups = R.companies.map((c) => [c.name, c.members.map((i) => withOv(R.list[i]))]);
    const solo = R.list.slice(2).filter((p) => !p.company).map(withOv);
    const row = (p) => '<li><button type="button" data-pp="npc" data-v="' + esc(p.id) + '">' + (p.level ? rankBadge(rankOf(p.merit), true) : '<span class="rank sm" style="--rk:#7d868c">Staff</span>') + '<span class="t"><b>' + esc(npcName(p)) + '</b><small>' + esc(p.job) + ' · ' + esc(p.race) + '</small><small class="act">' + esc(activity(p, day).text) + '</small></span></button></li>';
    h += '<h4>Hall staff</h4><ul class="evlist people">' + staff.map(row).join('') + '</ul>';
    for (const [n, ms] of groups) h += '<h4>' + esc(n) + '</h4><ul class="evlist people">' + ms.map(row).join('') + '</ul>';
    if (solo.length) h += '<h4>Working alone</h4><ul class="evlist people">' + solo.map(row).join('') + '</ul>';
    h += '</section>';
  }
  return h;
}
function orgsTab(s, day) {
  if (!s) return '<div class="empty-note"><p>Tap a settlement on the map to see its organisations and how they get on.</p></div>';
  const keys = orgsShown(s);
  const base = townPeople(s).list.slice(0, baseCount(s)).map(withOv);
  let h = '<section><h3>Organisations in ' + esc(s.name) + '</h3><p class="meta">Tap a name for its members, leaders, money and rivalries.</p><ul class="orgcards">';
  for (const k of keys) {
    let lead = null;
    if (k === 'adventurers') { const R = roster(s); lead = R ? withOv(R.list[0]) : null; }
    else if (k === 'thieves') lead = base.find((p) => /thieves/.test(p.secretJob || '')) || base.find((p) => p.group === 'underworld');
    else lead = base.find((p) => GROUP_ORG[p.group] === k);
    const rep = partyRep(k), at = rep <= -35 ? 'bad' : rep >= 35 ? 'ok' : '';
    h += '<li' + gcStyle(k) + '><div class="oc-top"><b>' + oLink(k, s.id) + '</b>' + (ORGS[k].secret ? '<small>secret</small>' : '') + '</div>' +
      (lead ? '<p class="meta">Led here by <button type="button" class="link" data-pp="npc" data-v="' + esc(lead.id) + '">' + esc(npcName(lead)) + '</button></p>' : '') +
      '<div class="rep"><span>Party standing</span><div class="meter" aria-hidden="true"><em style="left:' + ((rep + 100) / 2).toFixed(1) + '%"></em></div><b class="' + at + '">' + (rep > 0 ? '+' : '') + rep + '</b><button type="button" class="btn sm" data-gd="rep" data-v="' + k + '|-10" aria-label="Lower standing with ' + ORGS[k].name + '">−</button><button type="button" class="btn sm" data-gd="rep" data-v="' + k + '|10" aria-label="Raise standing with ' + ORGS[k].name + '">+</button></div></li>';
  }
  h += '</ul></section>' + guildPresenceHtml(s);
  // relations grid
  h += '<section><h3>How they get on</h3><p class="meta">Today, in ' + esc(s.name) + '. Relations drift day by day and swing with world events, the agendas of powerful people, and the party\'s deeds. Tap a cell for the reasons.</p><div class="relgrid-wrap"><table class="relgrid"><thead><tr><th></th>' + keys.map((k) => '<th scope="col">' + oLink(k, s.id, ORGS[k].short) + '</th>').join('') + '</tr></thead><tbody>';
  for (const a of keys) {
    h += '<tr><th scope="row">' + oLink(a, s.id, ORGS[a].short) + '</th>';
    for (const b of keys) {
      if (a === b) { h += '<td class="self"></td>'; continue; }
      const r = orgRel(a, b, s, day);
      const chosen = guildUI.pair === pairKey(a, b);
      h += '<td><button type="button" data-gd="pair" data-v="' + pairKey(a, b) + '" style="' + relCell(r.v) + '" class="' + (chosen ? 'on' : '') + '" aria-label="' + ORGS[a].short + ' and ' + ORGS[b].short + ': ' + relWord(r.v) + ' ' + r.v + '">' + r.v + '</button></td>';
    }
    h += '</tr>';
  }
  h += '</tbody></table></div><p class="meta key-row"><span class="kc" style="' + relCell(-70) + '"></span>Feud <span class="kc" style="' + relCell(-30) + '"></span>Hostile <span class="kc" style="' + relCell(0) + '"></span>Wary <span class="kc" style="' + relCell(30) + '"></span>Friendly <span class="kc" style="' + relCell(70) + '"></span>Allied</p>';
  if (guildUI.pair) {
    const [a, b] = guildUI.pair.split('|');
    if (keys.includes(a) && keys.includes(b)) {
      const r = orgRel(a, b, s, day), wk = orgRel(a, b, s, day - 7);
      h += '<div class="pairbox"><b>' + oLink(a, s.id) + ' and ' + oLink(b, s.id) + ': ' + relWord(r.v) + ' (' + r.v + ')</b>' + changeTag((r.v - wk.v) / 100).replace(/%/, ' pts').replace(/\.0 pts/, ' pts') +
        '<ul class="movers"><li><span>Long-standing</span><span>' + (r.base > 0 ? '+' : '') + r.base + '</span></li><li><span>Recent mood</span><span>' + (r.drift > 0 ? '+' : '') + r.drift + '</span></li><li><span>World events</span><span>' + (r.ev > 0 ? '+' : '') + r.ev + '</span></li><li><span>Agendas of the powerful</span><span>' + (r.ag > 0 ? '+' : '') + r.ag + '</span></li><li><span>Your changes and quest outcomes</span><span>' + (r.dm > 0 ? '+' : '') + r.dm + '</span></li></ul>' +
        (r.why.length ? '<p class="meta">' + esc(r.why.join('; ')) + '</p>' : '') +
        '<div class="actions"><button type="button" class="btn sm" data-gd="nudge" data-v="-10">Worsen</button><button type="button" class="btn sm" data-gd="nudge" data-v="10">Improve</button></div></div>';
    }
  }
  return h + '</section>';
}
function influenceBlock(p, compact) {
  const A = agendaOf(p.motive);
  if (!A) return '';
  const st = gst().ag[p.id];
  const isPow = (() => { const s = SBY.get(p.sid); return !!s && powerful(s).some((q) => q.id === p.id); })();
  if (!isPow) return '';
  const lines = [];
  const os = SBY.get(p.sid), ol = (k) => (os && orgHere(os, k) ? oLink(k, os.id, ORGS[k].short) : ORGS[k].short);
  if (A.market) for (const t in A.market) lines.push((t === 'all' ? 'All prices' : t.charAt(0).toUpperCase() + t.slice(1) + ' prices') + ' ' + pct(A.market[t] - 1));
  for (const [x, y, d] of A.rel || []) lines.push(ol(x) + ' and ' + ol(y) + ' relations ' + (d > 0 ? '+' : '−') + Math.abs(d));
  if (A.war) lines.push('Wars with neighbouring realms far more likely');
  if (A.quest) lines.push('Posts related quests at the guild hall');
  const s = SBY.get(p.sid);
  const scope = p.group === 'leader' && s && s.tier === 4 ? 'Across the whole realm (half strength outside the capital)' : 'In ' + (s ? s.name : 'their town');
  let h = '<section class="infl"><h3>Influence</h3><p><b>' + esc(A.label) + '</b> <span class="pill ' + (st ? 'off' : 'on') + '">' + (st === 'thwarted' ? 'Thwarted' : st === 'achieved' ? 'Achieved' : 'In effect') + '</span></p><p class="meta">' + esc(scope) + '</p>' + (st ? '' : '<ul class="movers">' + lines.map((l) => '<li><span>' + l + '</span></li>').join('') + '</ul>');
  if (!compact) {
    const choices = AGENDA_CHOICES[p.group] || [];
    h += '<div class="actions">' + (st ? '<button type="button" class="btn sm" data-gd="agon" data-v="' + esc(p.id) + '">Resume agenda</button>' : '<button type="button" class="btn sm" data-gd="agoff" data-v="' + esc(p.id) + '|thwarted">Thwarted</button><button type="button" class="btn sm" data-gd="agoff" data-v="' + esc(p.id) + '|achieved">Achieved</button>') + '</div>';
    if (choices.length) h += '<div class="field"><label class="lab" for="ag-' + esc(p.id) + '">Change what they want</label><select id="ag-' + esc(p.id) + '" data-ag="' + esc(p.id) + '">' + (choices.includes(p.motive) ? '' : '<option selected>' + esc(p.motive) + '</option>') + choices.map((c) => '<option' + (c === p.motive ? ' selected' : '') + '>' + esc(c) + '</option>').join('') + '</select></div>';
  }
  return h + '</section>';
}
function influenceTab(s) {
  if (!s) return '<div class="empty-note"><p>Tap a settlement to see who holds power there and what they are pushing for.</p></div>';
  let h = '<p class="meta">The wants of rulers and guild leaders shape prices, the relations between organisations, the odds of war and the quests on the board. Thwart or fulfil them in play, or change them here.</p>';
  const ags = agendaList(s);
  const pw = powerful(s);
  const realm = ags.filter((a) => a.scope === 'realm');
  h += '<ul class="infl-list">' + pw.map((p) => '<li><div class="oc-top"><button type="button" class="link" data-pp="npc" data-v="' + esc(p.id) + '">' + esc(npcName(p)) + '</button><small>' + esc(p.job) + '</small></div><p class="meta">Wants: ' + esc(p.motive) + '</p>' + (influenceBlock(p) || '<p class="meta">No wider influence.</p>') + '</li>').join('') + '</ul>';
  if (realm.length) h += '<section><h3>From the capital</h3><ul class="infl-list">' + realm.map((a) => '<li><div class="oc-top"><button type="button" class="link" data-pp="npc" data-v="' + esc(a.p.id) + '">' + esc(npcName(a.p)) + '</button><small>' + esc(a.p.job) + ', ' + tLink(SBY.get(a.p.sid)) + '</small></div><p><b>' + esc(a.A.label) + '</b></p><p class="meta">Felt here at half strength.</p></li>').join('') + '</ul></section>';
  const fx = agendaFx(s), keys = Object.keys(fx).filter((k) => Math.abs(fx[k] - 1) > 0.004);
  if (keys.length) h += '<section><h3>Net effect on ' + esc(s.name) + '\'s market</h3><ul class="movers">' + keys.map((k) => '<li><span>' + (k === 'all' ? 'All goods' : k.charAt(0).toUpperCase() + k.slice(1)) + '</span>' + changeTag(fx[k] - 1) + '</li>').join('') + '</ul></section>';
  return h;
}
function guildPanel() {
  const s = market.sid ? SBY.get(market.sid) : (people.sid ? SBY.get(people.sid) : null);
  const day = market.day;
  if (guildUI.q) { const q = findQuest(guildUI.q); if (q) return '<div class="mk-body">' + questView(q, day) + '</div>'; guildUI.q = null; }
  if (guildUI.org && s && orgHere(s, guildUI.org) && !(isPlayer() && ORGS[guildUI.org].secret)) return guildHeader(s) + '<div class="mk-body">' + orgView(s, guildUI.org, day) + '</div>';
  guildUI.org = null;
  let body;
  if (guildUI.tab === 'members') body = membersTab(s, day);
  else if (guildUI.tab === 'orgs') body = orgsTab(s, day);
  else if (guildUI.tab === 'influence') body = influenceTab(s);
  else body = boardTab(s, day);
  return guildHeader(s) + '<div class="mk-body">' + body + '</div>';
}
function guildCommit(label, fn) { commit(label, () => fn(gst()), {}); }
function addMerit(m, add) {
  const before = rankOf(m.merit || 0);
  m.merit = (m.merit || 0) + add;
  const after = rankOf(m.merit);
  return after > before ? m.name + ' rises to ' + RANKS[after][0] + ' rank' : null;
}
$('inspector').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-gd]');
  if (!b) return;
  const k = b.dataset.gd, v = b.dataset.v;
  const q = guildUI.q ? findQuest(guildUI.q) : null;
  const day = market.day;
  switch (k) {
    case 'tab': if (v === guildUI.tab && !guildUI.q && !guildUI.org) { panelMin = true; renderPanel(); break; } guildUI.tab = v; guildUI.q = null; guildUI.org = null; renderPanel(); break;
    case 'quest': guildUI.q = v; renderPanel(); $('inspector').scrollTop = 0; break;
    case 'back': guildUI.q = null; renderPanel(); break;
    case 'fly': { const s = SBY.get(v); if (s) flyVis(s.x, s.y, Math.max(view.s, TOWN_ZOOM[s.tier])); break; }
    case 'accept': if (q) guildCommit('Accept quest', (g) => { g.q[q.id] = { st: 'accepted', d: day, snap: q.custom ? undefined : JSON.parse(JSON.stringify(q)) }; chronAdd({ k: 'quest', q: q.id, hall: q.sid, sid: q.loc, t: 'Took the quest "' + q.title + '" (' + money(q.reward) + ')' }); }); break;
    case 'abandon': if (q) guildCommit('Abandon quest', (g) => { g.q[q.id] = { st: 'abandoned', d: day, snap: (g.q[q.id] || {}).snap }; g.rep[q.clientOrg] = (g.rep[q.clientOrg] || 0) - 2; chronAdd({ k: 'quest', q: q.id, hall: q.sid, t: 'Abandoned "' + q.title + '"' }); }); break;
    case 'done': case 'fail': {
      if (!q) break;
      const ok = k === 'done';
      const msgs = [];
      commit(ok ? 'Complete quest' : 'Fail quest', () => {
        const g = gst();
        g.q[q.id] = { st: ok ? 'done' : 'failed', d: day, snap: (g.q[q.id] || {}).snap || (q.custom ? undefined : JSON.parse(JSON.stringify(q))) };
        if (ok && q.spawnId) { edits.monOff = Object.assign({}, edits.monOff || {}); edits.monOff[q.spawnId] = { st: 'slain', d: day, by: 'the party' }; }
        if (ok) {
          g.rep[q.clientOrg] = clamp((g.rep[q.clientOrg] || 0) + 6 + q.rank * 2, -100, 100);
          if (q.against) { g.rep[q.against] = clamp((g.rep[q.against] || 0) - 5 - q.rank, -100, 100); const pk = pairKey(q.clientOrg, q.against); if (q.clientOrg !== q.against) g.shift[pk] = (g.shift[pk] || 0) - 4; }
          g.rep.adventurers = clamp((g.rep.adventurers || 0) + 2, -100, 100);
          g.party.gold = (g.party.gold || 0) + q.reward;
          for (const m of g.party.members) { const up = addMerit(m, q.merit); if (up) msgs.push(up); }
          if (q.ends && q.eventId) edits.evOff = Object.assign({}, edits.evOff, { [q.eventId]: 1 });
        } else g.rep[q.clientOrg] = clamp((g.rep[q.clientOrg] || 0) - 4 - q.rank, -100, 100);
        if (q.client) { edits.npc = edits.npc || {}; const o = edits.npc[q.client] || { o: {} }; const p0 = npcById(q.client); o.disp = clamp((o.disp != null ? o.disp : (p0 ? p0.disp0 : 0)) + (ok ? 15 : -10), -100, 100); o.log = (o.log || []).concat([{ d: day, t: (ok ? 'The party completed: ' : 'The party failed: ') + q.title }]); edits.npc[q.client] = o; }
        g.party.log = (g.party.log || []).concat([{ d: day, k: 'quest', q: q.id, hall: q.sid, t: (ok ? 'Completed "' + q.title + '" for ' + money(q.reward) : 'Failed "' + q.title + '"') }]);
      }, { bb: null });
      toast(ok ? 'Quest complete: ' + money(q.reward) + ' and ' + q.merit + ' merit each.' + (msgs.length ? ' ' + msgs.join('. ') + '!' : '') : 'Quest failed. ' + ORGS[q.clientOrg].name + ' thinks less of the party.');
      break;
    }
    case 'unpost': if (q) { guildCommit('Take down quest', (g) => { g.custom = g.custom.filter((x) => x.id !== q.id); }); guildUI.q = null; renderPanel(); } break;
    case 'post': {
      const s = hallFor(market.sid ? SBY.get(market.sid) : null);
      const title = ($('gq-title').value || '').trim();
      if (!s || !title) { toast('Give the quest a title first.'); break; }
      const rank = +$('gq-rank').value;
      const id = 'gq' + edits.next;
      const cq = { id, custom: true, sid: s.id, loc: s.id, title: title.slice(0, 80), desc: ($('gq-desc').value || '').slice(0, 400), rank, reward: rewardFor(rank, 0.5), merit: MERIT[rank], clientOrg: $('gq-org').value, against: null, post: day, exp: day + 30, kind: 'custom' };
      commit('Post quest', () => { edits.next++; gst().custom.push(cq); }, {});
      guildUI.q = id; renderPanel();
      break;
    }
    case 'addpc': {
      const name = ($('gp-pc').value || '').trim();
      if (!name) { $('gp-pc').focus(); break; }
      const id = 'pc' + edits.next;
      const lv = clamp(Math.round(+$('gp-lv').value || 1), 1, 20);
      commit('Register ' + name, () => { edits.next++; gst().party.members.push({ id, name: name.slice(0, 40), cls: $('gp-cls').value, level: lv, merit: 0 }); }, {});
      toast(name + ' joins the Adventurers\' Guild at Copper rank.');
      break;
    }
    case 'rmpc': guildCommit('Remove member', (g) => { g.party.members = g.party.members.filter((m) => m.id !== v); }); break;
    case 'promote': case 'demote': guildCommit(k === 'promote' ? 'Promote' : 'Demote', (g) => { const m = g.party.members.find((x) => x.id === v); if (!m) return; const r = clamp(rankOf(m.merit || 0) + (k === 'promote' ? 1 : -1), 0, 7); m.merit = RANKS[r][1]; }); break;
    case 'lvl': guildCommit('Level up', (g) => { const m = g.party.members.find((x) => x.id === v); if (m) m.level = Math.min(20, m.level + 1); }); break;
    case 'rep': { const [org, d] = v.split('|'); guildCommit('Change standing', (g) => { g.rep[org] = clamp((g.rep[org] || 0) + +d, -100, 100); }); break; }
    case 'pair': guildUI.pair = guildUI.pair === v ? null : v; renderPanel(); break;
    case 'nudge': if (guildUI.pair) guildCommit('Shift relations', (g) => { g.shift[guildUI.pair] = clamp((g.shift[guildUI.pair] || 0) + +v, -100, 100); }); break;
    case 'agoff': { const [id, how] = v.split('|'); guildCommit('Agenda ' + how, (g) => { g.ag[id] = how; }); break; }
    case 'agon': guildCommit('Resume agenda', (g) => { delete g.ag[v]; }); break;
  }
});
$('inspector').addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.id === 'gp-name') guildCommit('Name the party', (g) => { g.party.name = t.value.trim().slice(0, 50); });
  else if (t.dataset && t.dataset.ag) { const id = t.dataset.ag, val = t.value; npcEdit(id, 'Change agenda', (o) => { o.o.motive = val; }); }
});

// ---------------------------------------------------------------- map: open quests and the party's jobs
function drawGuildBadges() {
  if (tool !== 'guilds') return;
  const day = market.day;
  ctx.font = '600 11px "Atkinson Hyperlegible", system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const t0 = performance.now();
  let pending = false;
  const mineLoc = new Set();
  for (const id in gst().q) { if (gst().q[id].st !== 'accepted') continue; const q = findQuest(id); if (q) mineLoc.add(q.loc); }
  for (const m of markers) {
    if (m.kind !== 'settle') continue;
    const s = SBY.get(m.id);
    if (!s) continue;
    if (guildLevel(s, 'adventurers') >= 1) {
      if (!questsReady(s, day)) { if (performance.now() - t0 > 10) { pending = true; continue; } }
      const n = questsFor(s, day).filter((q) => questState(q, day) === 'open').length;
      if (n) {
        const X = m.X + (m.r > 9 ? 12 : 11), Y = m.Y + (m.r > 9 ? 0 : 11);
        ctx.fillStyle = '#2b3a4a'; ctx.strokeStyle = '#e2c37a'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(X - 9, Y - 7, 18, 14, 3) : ctx.rect(X - 9, Y - 7, 18, 14); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f3ead2'; ctx.fillText(String(n), X, Y + 0.5);
      }
    }
    if (mineLoc.has(s.id)) {
      const X = m.X, Y = m.Y - (m.r > 9 ? 0 : 16);
      ctx.strokeStyle = '#1a140c'; ctx.lineWidth = 1.5; ctx.fillStyle = '#e2c37a';
      ctx.beginPath(); ctx.moveTo(X, Y + 6); ctx.lineTo(X, Y - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X, Y - 10); ctx.lineTo(X + 10, Y - 6.5); ctx.lineTo(X, Y - 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  ctx.textBaseline = 'alphabetic';
  if (pending) requestRender();
}
function questsReady(s, day) {
  for (let c = Math.floor((day - 45) / POST); c <= Math.floor(day / POST); c++) if (!questCache.has(s.id + '|' + c + '|' + mkVer)) return false;
  return true;
}
