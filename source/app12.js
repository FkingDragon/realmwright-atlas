
// ================================================================ monsters: natural spawns by habitat, DM placement, tracking and bounties
// more SRD creatures (stats as in the Monster Manual; AideDD is the reference for anything not built in)
Object.assign(MON, {
  'Kobold': ['Small humanoid', 12, 5, '30 ft', '1/8', 'Pack Tactics; hates sunlight.'], 'Giant Rat': ['Small beast', 12, 7, '30 ft', '1/8', 'Pack Tactics; keen smell.'],
  'Skeleton': ['Medium undead', 13, 13, '30 ft', '1/4', 'Shortsword and shortbow; vulnerable to bludgeoning.'], 'Zombie': ['Medium undead', 8, 22, '20 ft', '1/4', 'Undead Fortitude: may stay at 1 HP instead of dropping.'],
  'Hobgoblin': ['Medium humanoid', 18, 11, '30 ft', '1/2', 'Martial Advantage: extra 2d6 when an ally is next to the target.'], 'Cockatrice': ['Small monstrosity', 11, 27, '20 ft, fly 40 ft', '1/2', 'Its bite can slowly turn a creature to stone.'],
  'Rust Monster': ['Medium monstrosity', 14, 27, '40 ft', '1/2', 'Its touch corrodes metal weapons and armour.'], 'Bugbear': ['Medium humanoid', 16, 27, '30 ft', '1', 'Surprise Attack: extra 2d6 against a surprised target.'],
  'Ghoul': ['Medium undead', 12, 22, '30 ft', '1', 'Claws paralyse anything but elves.'], 'Giant Eagle': ['Large beast', 13, 26, '10 ft, fly 80 ft', '1', 'Keen sight; understands Common.'],
  'Giant Octopus': ['Large beast', 11, 52, '10 ft, swim 60 ft', '1', 'Grappling tentacles and an ink cloud.'], 'Ogre': ['Large giant', 11, 59, '40 ft', '2', 'Greatclub 2d8 + 4.'],
  'Gargoyle': ['Medium elemental', 15, 52, '30 ft, fly 60 ft', '2', 'Looks like a statue while still; resists nonmagical weapons.'], 'Gelatinous Cube': ['Large ooze', 6, 84, '15 ft', '2', 'Engulfs creatures and dissolves them; nearly transparent.'],
  'Mimic': ['Medium monstrosity', 12, 58, '15 ft', '2', 'Disguises itself as an object; adhesive.'], 'Wererat': ['Medium humanoid', 12, 33, '30 ft', '2', 'Shapechanger; immune to nonmagical, non-silvered weapons.'],
  'Giant Boar': ['Large beast', 12, 42, '40 ft', '2', 'Charge and Relentless.'], 'Hunter Shark': ['Large beast', 12, 45, 'swim 40 ft', '2', 'Blood Frenzy.'],
  'Saber-toothed Tiger': ['Large beast', 12, 52, '40 ft', '2', 'Pounce.'], 'Basilisk': ['Medium monstrosity', 15, 52, '20 ft', '3', 'Petrifying gaze.'],
  'Doppelganger': ['Medium monstrosity', 14, 52, '30 ft', '3', 'Shapechanger that reads surface thoughts.'], 'Hell Hound': ['Medium fiend', 15, 45, '50 ft', '3', 'Fire breath 6d6; Pack Tactics.'],
  'Minotaur': ['Large monstrosity', 14, 76, '40 ft', '3', 'Charge and Labyrinthine Recall.'], 'Wight': ['Medium undead', 14, 45, '30 ft', '3', 'Life Drain; commands zombies.'],
  'Ghost': ['Medium undead', 11, 45, '0 ft, fly 40 ft (hover)', '4', 'Horrifying Visage and Possession.'], 'Gorgon': ['Large monstrosity', 19, 114, '40 ft', '5', 'Petrifying breath.'],
  'Giant Crocodile': ['Huge beast', 14, 85, '30 ft, swim 50 ft', '5', 'Bite and tail; grapples.'], 'Wraith': ['Medium undead', 13, 67, '0 ft, fly 60 ft (hover)', '5', 'Life Drain; creates specters.'],
  'Vampire Spawn': ['Medium undead', 15, 82, '30 ft', '5', 'Regeneration; spider climb; sunlight hurts it.'], 'Cyclops': ['Huge giant', 14, 138, '30 ft', '6', 'Poor depth perception; hurls rocks.'],
  'Medusa': ['Medium monstrosity', 15, 127, '30 ft', '6', 'Petrifying gaze and snake hair.'], 'Fire Giant': ['Huge giant', 18, 162, '30 ft', '9', 'Greatsword 6d6 + 7; immune to fire.']
});
['Giant Eagle'].forEach((n) => PEACEFUL.add(n));
['Kobold', 'Hobgoblin', 'Bugbear', 'Ogre'].forEach((n) => RAIDERS.add(n));
// habitats: the SRD fauna tables plus the creatures above
const HAB_EXTRA = { 14: ['Kobold', 'Giant Eagle', 'Gargoyle', 'Basilisk', 'Cyclops', 'Fire Giant', 'Ogre', 'Bugbear'], 15: ['Fire Giant', 'Giant Eagle'], 11: ['Kobold', 'Cockatrice', 'Gorgon', 'Hobgoblin', 'Minotaur', 'Medusa'], 5: ['Cockatrice', 'Gorgon', 'Ogre', 'Hobgoblin', 'Giant Boar'], 6: ['Giant Boar', 'Bugbear', 'Hobgoblin', 'Ogre', 'Giant Rat'], 7: ['Saber-toothed Tiger', 'Bugbear'], 12: ['Saber-toothed Tiger'], 9: ['Giant Crocodile', 'Giant Rat'], 8: ['Giant Crocodile'], 10: ['Basilisk', 'Minotaur', 'Medusa', 'Hell Hound'], 2: ['Reef Shark', 'Hunter Shark', 'Giant Octopus', 'Plesiosaurus', 'Merfolk', 'Sahuagin'] };
const HAUNTS = ['Skeleton', 'Zombie', 'Ghoul', 'Wight', 'Ghost', 'Wraith', 'Vampire Spawn', 'Gelatinous Cube', 'Mimic', 'Rust Monster', 'Wererat', 'Doppelganger'];
const AQUATIC = new Set(['Reef Shark', 'Hunter Shark', 'Giant Octopus', 'Plesiosaurus', 'Merfolk', 'Sahuagin']);
const LAIRISH = (n, cr) => crNum(cr) >= 5 || /dragon|Hag|Hydra|Mummy|Lamia|Werebear|Purple Worm|Roc|Remorhaz|Chimera|Manticore|Wyvern|Basilisk|Minotaur|Medusa/.test(n);
const MHAB = {};
const HABITAT_OF = {};
for (const b in FAUNA) for (const [n] of FAUNA[b]) { (MHAB[b] = MHAB[b] || []).push(n); (HABITAT_OF[n] = HABITAT_OF[n] || new Set()).add(+b); }
for (const b in HAB_EXTRA) for (const n of HAB_EXTRA[b]) { if (!(MHAB[b] = MHAB[b] || []).includes(n)) MHAB[b].push(n); (HABITAT_OF[n] = HABITAT_OF[n] || new Set()).add(+b); }
for (const b in DRAGON) for (const age of ['Young ', 'Adult ']) { const n = age + DRAGON[b] + ' dragon'; (HABITAT_OF[n] = HABITAT_OF[n] || new Set()).add(+b); }
const PACK = { Wolf: [3, 8], Jackal: [3, 8], Hyena: [3, 7], Goblin: [4, 12], Gnoll: [3, 9], Orc: [4, 10], Bandit: [4, 10], Lizardfolk: [3, 8], Sahuagin: [3, 8], Kobold: [5, 15], Skeleton: [3, 8], Zombie: [3, 8], Ghoul: [2, 5], Hobgoblin: [3, 8], 'Giant Rat': [4, 12], 'Swarm of Insects': [1, 3], Elk: [3, 10], Deer: [3, 10], 'Dire Wolf': [2, 5], 'Winter Wolf': [1, 3], 'Giant Spider': [1, 3], Harpy: [2, 5], Merfolk: [3, 8], Boar: [2, 6], 'Giant Wasp': [2, 6], Ape: [3, 7], 'Giant Frog': [2, 5], Crocodile: [1, 3], Camel: [2, 6], 'Giant Goat': [2, 6], Bugbear: [1, 4], Ogre: [1, 3], 'Reef Shark': [2, 5], 'Bandit Captain': [1, 1], Wererat: [1, 3], Eagle: [1, 2] };
const MCELL = 64, ROAM_LEN = 36, LAIR_LEN = 200;
const monCache = new Map();
const monBiome = (x, y) => T.biomeAt(x, y, 6, circlesIn(x, y, x, y));
const monKey = () => edits.strokes.length;
function packSize(n, cr, rng) { const p = PACK[n] || (crNum(cr) <= 0.25 ? [2, 6] : crNum(cr) <= 1 ? [1, 4] : [1, 1]); return p[0] + Math.floor(rng() * (p[1] - p[0] + 1)); }
function pickCreature(list, rng, lair) {
  const pool = list.filter((n) => MON[n] && (lair ? LAIRISH(n, MON[n][4]) : !LAIRISH(n, MON[n][4])));
  if (!pool.length) return null;
  let tot = 0; const w = pool.map((n) => { const v = 1 / Math.pow(1 + crNum(MON[n][4]), 0.7); tot += v; return v; });
  let r = rng() * tot;
  for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}
// spawns for one cell and cycle; each cell has its own phase so the world never changes all at once
function cellSpawns(cx, cy, lair, c) {
  const key = cx + '|' + cy + '|' + (lair ? 'l' : 'r') + '|' + c + '|' + monKey();
  let out = monCache.get(key);
  if (out) return out;
  out = [];
  const len = lair ? LAIR_LEN : ROAM_LEN;
  const off = Math.floor(T.hash(cx, cy, 701) * len);
  const rng = T.mulberry((Math.imul(cx + 1, 73856093) ^ Math.imul(cy + 1, 19349663) ^ Math.imul(c + 11, 83492791) ^ (lair ? 0x5bd1e995 : 0) ^ SEED) >>> 0);
  const tries = lair ? (rng() < 0.42 ? 1 : 0) : 2 + Math.floor(rng() * 3);
  for (let k = 0; k < tries; k++) {
    const x = cx * MCELL + rng() * MCELL, y = cy * MCELL + rng() * MCELL;
    if (x < 4 || y < 4 || x > W - 4 || y > H - 4) continue;
    const b = monBiome(x, y);
    let name = null, rare = '';
    if (T.isWater(b)) {
      if (lair || b === 0 || rng() > 0.3) continue;
      name = pickCreature(MHAB[2], rng, false);
    } else if (lair) {
      const dc = DRAGON[b];
      const r = rng();
      if (dc && r < 0.14) name = (r < 0.035 ? 'Adult ' : 'Young ') + dc + ' dragon';
      else name = pickCreature(MHAB[b] || MHAB[5], rng, true);
    } else {
      const r = rng();
      if (r < 0.03) { // a wanderer far from its usual haunts
        const others = Object.keys(MHAB).filter((x2) => +x2 !== b && +x2 !== 2);
        name = pickCreature(MHAB[others[Math.floor(rng() * others.length)]], rng, false); rare = 'wanderer';
        if (name && AQUATIC.has(name)) name = null;
      } else if (r < 0.055) { name = pickCreature(HAUNTS, rng, false) || 'Skeleton'; rare = 'haunt'; }
      else name = pickCreature(MHAB[b] || MHAB[5], rng, false);
    }
    if (!name || !MON[name]) continue;
    const start = c * len - off + Math.floor(rng() * len * 0.55);
    const end = start + Math.floor(len * (lair ? 0.9 + rng() * 0.8 : 0.55 + rng() * 0.9));
    out.push({ id: (lair ? 'l:' : 'w:') + cx + ':' + cy + ':' + c + ':' + k, name, count: lair ? 1 : packSize(name, MON[name][4], rng), x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, b, start, end, kind: lair ? 'lair' : 'roam', rare, cr: MON[name][4] });
  }
  monCache.set(key, out);
  if (monCache.size > 30000) monCache.clear();
  return out;
}
const monState = () => (edits.monOff || {});
function monGone(id, day) { const o = monState()[id]; return !!(o && o.d <= day); }
function placedMon(p) {
  const m = monInfo(p.name);
  return { id: p.id, name: p.name, count: p.count, x: p.x, y: p.y, b: p.b, start: p.d, end: 1e9, kind: 'placed', rare: '', cr: (p.custom && p.custom.cr) || (m ? m[4] : '1'), placed: p };
}
function monStats(sp) { const m = monInfo(sp.name), c = sp.placed && sp.placed.custom; return { type: c ? c.type || 'creature' : m ? m[0] : 'creature', ac: c ? c.ac : m ? m[1] : 12, hp: c ? c.hp : m ? m[2] : 10, speed: m ? m[3] : '30 ft', cr: sp.cr, trait: m ? m[5] : '' }; }
function spawnsIn(x0, y0, x1, y1, day, all) {
  const out = [];
  const c0 = Math.max(0, Math.floor(x0 / MCELL)), c1 = Math.min(Math.ceil(W / MCELL) - 1, Math.floor(x1 / MCELL));
  const r0 = Math.max(0, Math.floor(y0 / MCELL)), r1 = Math.min(Math.ceil(H / MCELL) - 1, Math.floor(y1 / MCELL));
  for (let cx = c0; cx <= c1; cx++) for (let cy = r0; cy <= r1; cy++) {
    for (const lair of [false, true]) {
      const len = lair ? LAIR_LEN : ROAM_LEN;
      const off = Math.floor(T.hash(cx, cy, 701) * len);
      const c = Math.floor((day + off) / len);
      for (let k = c - 2; k <= c + 1; k++) for (const sp of cellSpawns(cx, cy, lair, k)) {
        if (sp.start > day || sp.end <= day) continue;
        if (sp.x < x0 || sp.x > x1 || sp.y < y0 || sp.y > y1) continue;
        const live = [];
        ecoApply(sp, day, live);
        for (const x of live) { if (!all && monGone(x.id, day)) continue; out.push(x); }
      }
    }
  }
  for (const p of edits.monAdd || []) { if (p.d > day || p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) continue; if (!all && monGone(p.id, day)) continue; out.push(placedMon(p)); }
  return out;
}
function baseSpawn(id) {
  if (id.startsWith('p')) { const p = (edits.monAdd || []).find((q) => q.id === id); return p ? placedMon(p) : null; }
  const twin = id.endsWith('+'), bid = twin ? id.slice(0, -1) : id;
  const [k, cx, cy, c] = bid.split(':');
  const b = cellSpawns(+cx, +cy, k === 'l', +c).find((s) => s.id === bid) || null;
  return b && twin ? Object.assign({}, b, { id, twin: true, x: Math.round((b.x + 4) * 10) / 10 }) : b;
}
// the creature group as it is on a given day (numbers follow the ecology), or as first seen if it has gone
function findSpawn(id, day) {
  const b = baseSpawn(id);
  if (!b || b.kind === 'placed') return b;
  return spawnLive(id, day == null ? market.day : day) || b;
}
const spawnXP = (sp) => (XP_CR[sp.cr] || 200) * sp.count;
// danger around a settlement: hostile creatures nearby, weighted by strength and distance, against the size of the place
const THREAT_R = { 1: 40, 2: 55, 3: 70, 4: 85 }, THREAT_BASE = { 1: 1700, 2: 4500, 3: 10000, 4: 20000 };
const threatCache = new Map();
function presence(s, day) {
  const R = THREAT_R[s.tier] || 50;
  return spawnsIn(s.x - R, s.y - R, s.x + R, s.y + R, day).filter((sp) => !PEACEFUL.has(sp.name)).map((sp) => ({ sp, d: Math.hypot(sp.x - s.x, sp.y - s.y) })).filter((o) => o.d <= R);
}
function threatOf(s, day) {
  const key = s.id + '|' + day + '|' + monKey() + '|' + JSON.stringify(edits.monOff || {}).length + '|' + (edits.monAdd || []).length;
  let t = threatCache.get(key);
  if (t != null) return t;
  const R = THREAT_R[s.tier] || 50;
  let sum = 0;
  for (const { sp, d } of presence(s, day)) sum += Math.pow(spawnXP(sp), 0.85) * (1 - 0.7 * d / R);
  t = sum / Math.pow(THREAT_BASE[s.tier] || 700, 0.85);
  threatCache.set(key, t);
  if (threatCache.size > 6000) threatCache.clear();
  return t;
}
const threatWord = (t) => (t < 0.25 ? ['Quiet', 'ok'] : t < 0.6 ? ['Uneasy', ''] : t < 1.2 ? ['Dangerous', 'warn'] : ['Perilous', 'bad']);
// danger premium on rewards: up to double where monsters press hardest
const dangerMult = (s, day) => 1 + 0.5 * Math.min(2, threatOf(s, day));
const headPrice = (cr) => Math.max(0.5, (XP_CR[cr] || 200) / 10);
const dirWord = (dx, dy) => { const a = Math.atan2(dy, dx) * 180 / Math.PI; const d = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east']; return d[(Math.round(a / 45) + 8) % 8]; };
function nearestPlace(x, y, tierMin) {
  let best = null, bd = 1e9;
  SGRID.query(x - 120, y - 120, x + 120, y + 120, (s) => { if (s.tier < (tierMin || 1)) return; const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = s; } });
  return best ? { s: best, d: bd } : null;
}
const monTier = (sp) => { const v = crNum(sp.cr); return /dragon/.test(sp.name) ? 4 : v >= 5 ? 3 : v >= 1 ? 2 : 1; };
const MON_COL = ['#8a9a7c', '#c8a25a', '#d27a32', '#c8432f', '#9b1f3f'];
const monCol = (sp) => (PEACEFUL.has(sp.name) ? MON_COL[0] : MON_COL[monTier(sp)]);

// ---------------------------------------------------------------- tracker state (hit points per creature, initiative), saved with the browser
const MT_KEY = 'atlas-montrack-v1';
const monTrack = (() => { try { const d = JSON.parse(localStorage.getItem(MT_KEY) || 'null'); return d && d.hp ? d : { hp: {}, init: {}, watch: [] }; } catch (e) { return { hp: {}, init: {}, watch: [] }; } })();
if (!monTrack.watch) monTrack.watch = [];
let mtTimer = 0;
const mtSave = () => { clearTimeout(mtTimer); mtTimer = setTimeout(() => { try { localStorage.setItem(MT_KEY, JSON.stringify(monTrack)); } catch (e) { /* ignore */ } }, 250); };
function hpList(sp) { const st = monStats(sp); let a = monTrack.hp[sp.id]; if (!a || a.length !== sp.count) { a = Array.from({ length: sp.count }, (_, i) => (a && a[i] != null ? a[i] : st.hp)); } return a; }

// ---------------------------------------------------------------- panel
const monUI = { tab: 'near', id: null, sid: null, q: '', place: null, peaceful: false, move: null, count: 1 };
function monHeader(title, eyebrow) {
  const tabs = [['near', 'Nearby'], ['placed', 'Placed & watched'], ['bestiary', 'Bestiary']];
  return '<div class="mk-head"><div><div class="eyebrow">' + eyebrow + '</div><h2>' + title + '</h2></div>' + CLOSE_BTN + '</div>' +
    '<div class="seg mk-tabs" role="tablist">' + tabs.map(([k, l]) => '<button type="button" role="tab" data-mo="tab" data-v="' + k + '" aria-pressed="' + (monUI.tab === k && !monUI.id) + '">' + l + '</button>').join('') + '</div>';
}
function monRow(sp, ox, oy, day) {
  const d = ox != null ? Math.hypot(sp.x - ox, sp.y - oy) : null;
  const tags = (sp.kind === 'lair' ? '<em class="tag">lair</em>' : '') + (sp.kind === 'placed' ? '<em class="tag pl">placed</em>' : '') + (sp.rare ? '<em class="tag rare">' + (sp.rare === 'haunt' ? 'haunt' : 'far from home') + '</em>' : '') + (day - sp.start < 7 && sp.kind !== 'placed' ? '<em class="tag new">new</em>' : '') + (monGone(sp.id, day) ? '<em class="tag">' + (monState()[sp.id].st === 'slain' ? 'slain' : 'gone') + '</em>' : '');
  return '<li><button type="button" data-mo="open" data-v="' + esc(sp.id) + '"><i class="mdot t' + (PEACEFUL.has(sp.name) ? 0 : monTier(sp)) + '" style="background:' + monCol(sp) + '"></i><span class="t"><b>' + esc(sp.name) + (sp.count > 1 ? ' ×' + sp.count : '') + ' ' + tags + '</b><small>CR ' + sp.cr + ' · ' + T.NAMES[sp.b] + (d != null ? ' · ' + Math.round(d) + ' mi ' + dirWord(sp.x - ox, sp.y - oy) : '') + '</small></span></button></li>';
}
function monPanel() {
  const day = market.day;
  if (monUI.id) { const sp = findSpawn(monUI.id, day); if (sp) return monDetail(sp, day); monUI.id = null; }
  const s = monUI.sid ? SBY.get(monUI.sid) : null;
  let h = monHeader(s ? tLink(s) : 'Monsters', 'Monsters · ' + dateText(day));
  let body = '';
  if (monUI.place) body += '<div class="placing"><b>Placing ' + (monUI.count > 1 ? monUI.count + ' × ' : '') + esc(monUI.place.name) + '.</b> Tap the map where they are.<button type="button" class="btn sm" data-mo="cancelplace">Cancel</button></div>';
  if (monUI.move) body += '<div class="placing"><b>Moving ' + esc((findSpawn(monUI.move, day) || {}).name || '') + '.</b> Tap the map at the new spot.<button type="button" class="btn sm" data-mo="cancelmove">Cancel</button></div>';
  if (monUI.tab === 'placed') body += monPlacedTab(day);
  else if (monUI.tab === 'bestiary') body += monBestiary();
  else body += monNearTab(s, day);
  body += '<p class="hint">On the map, danger shows by shape as well as colour: <i class="mdot t1 inl" style="background:' + MON_COL[1] + '"></i> circle under CR 5, <i class="mdot t3 inl" style="background:' + MON_COL[3] + '"></i> diamond CR 5 and up, <i class="mdot t4 inl" style="background:' + MON_COL[4] + '"></i> hexagon for dragons. A claw marks hostile creatures; a gold edge marks ones you placed.</p>';
  return h + '<div class="mk-body">' + body + '</div>';
}
function monNearTab(s, day) {
  const ox = s ? s.x : view.x, oy = s ? s.y : view.y;
  const R = s ? (THREAT_R[s.tier] || 50) : clamp(Math.min(vw, vh) / 2 / view.s, 20, 160);
  let o = '';
  if (s) {
    const t = threatOf(s, day), tw = threatWord(t), wk = threatOf(s, day - 7);
    o += '<div class="threat ' + tw[1] + '"><div><span class="lab">Danger around ' + esc(s.name) + '</span><b>' + tw[0] + '</b><small>index ' + t.toFixed(2) + ' · ' + (t > wk + 0.05 ? 'rising' : t < wk - 0.05 ? 'falling' : 'steady') + ' this week</small></div><div class="tmeter" aria-hidden="true"><i style="width:' + clamp(t / 2 * 100, 3, 100).toFixed(0) + '%"></i></div></div>';
    o += '<p class="small">Bounties and quest rewards here run at <b>' + Math.round(dangerMult(s, day) * 100) + '%</b> of the guild\'s standard rates. ' + '<button type="button" class="link" data-mo="tomarket">See the bounty board</button></p>';
  } else o += '<p class="meta">Showing creatures around the middle of the map. Tap a settlement to see what threatens it, or tap a creature\'s claw marker to open it.</p>';
  let list = spawnsIn(ox - R, oy - R, ox + R, oy + R, day).map((sp) => [Math.hypot(sp.x - ox, sp.y - oy), sp]).filter(([d]) => d <= R);
  const hostile = list.filter(([, sp]) => !PEACEFUL.has(sp.name)), calm = list.filter(([, sp]) => PEACEFUL.has(sp.name));
  hostile.sort((a, b) => spawnXP(b[1]) / (10 + b[0]) - spawnXP(a[1]) / (10 + a[0]));
  o += '<section><h3>Threats within ' + Math.round(R) + ' miles (' + hostile.length + ')</h3>' + (hostile.length ? '<ul class="evlist mons">' + hostile.slice(0, 40).map(([, sp]) => monRow(sp, ox, oy, day)).join('') + '</ul>' : '<p class="meta">Nothing hostile has been seen nearby.</p>') + '</section>';
  o += '<label class="check"><input type="checkbox" id="mo-peaceful"' + (monUI.peaceful ? ' checked' : '') + '><span>Show peaceful animals (' + calm.length + ')</span></label>';
  if (monUI.peaceful && calm.length) o += '<ul class="evlist mons">' + calm.slice(0, 40).map(([, sp]) => monRow(sp, ox, oy, day)).join('') + '</ul>';
  // fresh sightings anywhere close
  const fresh = hostile.filter(([, sp]) => day - sp.start < 7 && sp.kind !== 'placed');
  if (fresh.length) o += '<p class="small"><b>New this week:</b> ' + fresh.slice(0, 5).map(([, sp]) => '<button type="button" class="link" data-mo="open" data-v="' + esc(sp.id) + '">' + esc(sp.name) + (sp.count > 1 ? ' ×' + sp.count : '') + '</button>').join(', ') + '</p>';
  o += '<section><h3>Wildlife and monsters in this region</h3><p class="small">Numbers against a normal year, and why. Hunting a kind thins it for half a year; plague raises the dead; war draws scavengers.</p>' + ecoHtml(ox, oy, day) + '</section>';
  o += '<p class="hint">Creatures appear in their natural habitats and move on after a few weeks; lairs last for months. About one group in twenty is a rare exception: a wanderer far from home, or undead and dungeon things haunting the wilds.</p>';
  return o;
}
function monPlacedTab(day) {
  const placed = (edits.monAdd || []).map(placedMon);
  const watched = monTrack.watch.map((id) => findSpawn(id, day)).filter(Boolean).filter((sp) => sp.kind !== 'placed');
  let o = '<section><h3>Placed by you (' + placed.length + ')</h3>' + (placed.length ? '<ul class="evlist mons">' + placed.map((sp) => monRow(sp, null, null, day)).join('') + '</ul>' : '<p class="meta">Nothing placed yet. Open the Bestiary and press Place, then tap the map.</p>') + '</section>';
  o += '<section><h3>Watched (' + watched.length + ')</h3>' + (watched.length ? '<ul class="evlist mons">' + watched.map((sp) => monRow(sp, null, null, day)).join('') + '</ul>' : '<p class="meta">Open any natural creature and press Watch to keep it here.</p>') + '</section>';
  const off = Object.keys(monState()).filter((id) => monState()[id].d <= day).slice(-12).reverse();
  if (off.length) o += '<section><h3>Recently slain or driven off</h3><ul class="evlist mons">' + off.map((id) => findSpawn(id, day)).filter(Boolean).map((sp) => monRow(sp, null, null, day)).join('') + '</ul></section>';
  return o;
}
function monBestiary() {
  const q = monUI.q.toLowerCase();
  const names = allMonNames().filter((n) => !q || n.toLowerCase().includes(q)).sort((a, b) => crNum(monInfo(a)[4]) - crNum(monInfo(b)[4]) || a.localeCompare(b));
  let o = '<div class="row2"><div class="field"><label class="lab" for="mo-q">Find a creature</label><input id="mo-q" value="' + esc(monUI.q) + '" placeholder="Owlbear, goblin, dragon…" autocomplete="off"></div><div class="field"><label class="lab" for="mo-count">How many to place</label><input id="mo-count" type="number" min="1" max="50" value="' + monUI.count + '"></div></div>';
  o += '<p class="small">' + names.length + ' creature' + (names.length === 1 ? '' : 's') + ', weakest first. Tap a name for its card.</p><ul class="best">' + names.slice(0, 150).map((n) => { const m = monInfo(n); const hb = HABITAT_OF[n] ? [...HABITAT_OF[n]].map((b) => T.NAMES[b]).join(', ') : HAUNTS.includes(n) ? 'Ruins and dark places (rare)' : MON_SRD[n] ? (srdHabitat(n) || 'Anywhere the DM places it') + ' · placed only' : 'Towns and roads'; return '<li><i class="mdot t' + (PEACEFUL.has(n) ? 0 : monTier({ name: n, cr: m[4] })) + '" style="background:' + monCol({ name: n, cr: m[4] }) + '"></i><div class="bt"><div class="bn">' + monLink(n) + '<span class="crb">CR ' + m[4] + '</span></div><small>' + esc(m[0].charAt(0).toUpperCase() + m[0].slice(1)) + ' · AC ' + m[1] + ' · HP ' + m[2] + ' · ' + esc(m[3]) + '</small><small class="hab">' + esc(hb) + '</small></div><button type="button" class="btn sm" data-mo="place" data-v="' + esc(n) + '" aria-label="Place ' + esc(n) + ' on the map">Place</button></li>'; }).join('') + '</ul>';
  if (q && !names.length) o += '<p class="meta">No built-in card for "' + esc(monUI.q) + '". ' + extLink(AID.monster(monUI.q), 'Look it up on AideDD') + ' and add it as a custom creature below.</p>';
  o += '<details class="board"' + (q && !names.length ? ' open' : '') + '><summary><span>Custom creature</span><small>anything from the Monster Manual</small></summary><div class="pad grid">' +
    '<div class="field"><label class="lab" for="mo-cname">Name</label><input id="mo-cname" maxlength="60" value="' + esc(q && !names.length ? monUI.q : '') + '" placeholder="Beholder"></div>' +
    '<div class="row3"><div class="field"><label class="lab" for="mo-ccr">CR</label><select id="mo-ccr">' + Object.keys(XP_CR).map((c) => '<option' + (c === '1' ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></div><div class="field"><label class="lab" for="mo-cac">AC</label><input id="mo-cac" type="number" min="1" max="30" value="13"></div><div class="field"><label class="lab" for="mo-chp">HP</label><input id="mo-chp" type="number" min="1" max="999" value="30"></div></div>' +
    '<p class="small">Copy AC, HP and CR from the creature\'s ' + extLink(AID.monsters, 'AideDD page') + '.</p><div class="actions"><button type="button" class="btn primary" data-mo="placecustom">Place on the map</button></div></div></details>';
  return o;
}
function monDetail(sp, day) {
  const st = monStats(sp), gone = monGone(sp.id, day), off = monState()[sp.id];
  const np = nearestPlace(sp.x, sp.y), hall = np ? hallFor(np.s) : null;
  const R = CAPS.length ? REALMS[T.realmAt(sp.x, sp.y, CAPS).i] : null;
  const mult = hall ? dangerMult(hall, day) : 1;
  const per = headPrice(sp.cr) * mult;
  let h = monHeader(esc(sp.name) + (sp.count > 1 ? ' ×' + sp.count : ''), (sp.kind === 'placed' ? 'Placed by you' : sp.kind === 'lair' ? 'Lair' : 'Roaming') + ' · ' + esc(st.type));
  h += '<div class="mk-body"><button type="button" class="link back" data-mo="back">‹ ' + (monUI.tab === 'placed' ? 'Placed & watched' : monUI.tab === 'bestiary' ? 'Bestiary' : 'Nearby') + '</button>';
  if (!gone && sp.kind !== 'placed' && !spawnLive(sp.id, day)) h += '<p class="ready">' + (day >= sp.end || day < sp.start ? 'This group has moved on.' : 'This group has dispersed: its kind has thinned out here (see below).') + '</p>';
  if (gone) h += '<p class="ready">' + (off.st === 'slain' ? 'Slain' : 'Driven off') + ' on ' + dateText(off.d) + (off.by ? ' by ' + esc(off.by) : '') + '. <button type="button" class="link" data-mo="restore" data-v="' + esc(sp.id) + '">Bring it back</button></p>';
  h += '<dl class="stats">' + stat('Armour class', st.ac) + stat('Hit points', st.hp + (sp.count > 1 ? ' each' : '')) + stat('Challenge', sp.cr + ' <small>(' + ((XP_CR[sp.cr] || 0) * sp.count).toLocaleString('en-GB') + ' XP)</small>') + '</dl>';
  h += '<p class="small">' + (monInfo(sp.name) ? 'Creature card: ' + monLink(sp.name) + ' · ' : '') + extLink(AID.monster(sp.name), 'Full Monster Manual entry') + (st.trait ? '<br>' + esc(st.trait) : '') + '</p>';
  const usual = HABITAT_OF[sp.name];
  h += '<ul class="facts"><li><span>Where</span><div>' + T.NAMES[sp.b] + (np ? ', ' + Math.round(np.d) + ' mi ' + dirWord(sp.x - np.s.x, sp.y - np.s.y) + ' of ' + tLink(np.s) : '') + (R ? ' · ' + rLink(R) : '') + ' <button type="button" class="link" data-mo="fly" data-v="' + esc(sp.id) + '">show on map</button></div></li>' +
    '<li><span>Habitat</span><div>' + (sp.rare === 'haunt' ? 'Ruins, tombs and dark places. Rarely seen in the open.' : usual ? [...usual].map((b) => T.NAMES[b]).join(', ') + (sp.rare === 'wanderer' || !usual.has(sp.b) ? ' · <b>far from its usual haunts</b>' : '') : 'Anywhere') + '</div></li>' +
    (sp.kind !== 'placed' ? '<li><span>Seen</span><div>' + dateText(Math.max(0, sp.start)) + (day < sp.end ? ' · ' + (sp.kind === 'lair' ? 'likely to remain until about ' : 'likely to move on about ') + dateText(sp.end) : '') + '</div></li>' : '<li><span>Placed</span><div>' + dateText(sp.start) + '</div></li>') +
    (!PEACEFUL.has(sp.name) ? '<li><span>Bounty</span><div>' + money(per) + ' a head' + (sp.count > 1 ? ', ' + money(per * sp.count) + ' for all' : '') + (hall ? ' at ' + oLink('adventurers', hall.id, hall.name + '\'s hall') : '') + '</div></li>' : '<li><span>Bounty</span><div>None: it is no threat to anyone</div></li>') + '</ul>';
  // quests aimed at it
  if (hall) { const qs = questsFor(hall, day).filter((q) => { const s2 = questState(q, day); return q.spawnId === sp.id && (s2 === 'open' || s2 === 'accepted' || s2 === 'npc'); }); if (qs.length) h += '<section><h3>Quests for it</h3><ul class="evlist quests">' + qs.map((q) => questRow(q, day).replace('data-gd="quest"', 'data-quest="' + esc(q.id) + '|' + esc(hall.id) + '" data-gd-x="quest"')).join('') + '</ul></section>'; }
  // difficulty for the party
  const lv = (gst().party.members || []).map((x) => x.level);
  const dd = XP_CR[sp.cr] != null ? difficulty(lv, sp.cr, sp.count) : null;
  if (dd) h += '<p><span class="diff d' + dd.k + '">' + dd.label + '</span> for your party <small class="meta">(Dungeon Master\'s Guide thresholds)</small></p>';
  if (sp.kind !== 'placed') h += '<details class="board"><summary><span>Why it is here: wildlife around</span><small>' + Math.round(ecoAt(sp.x, sp.y, day).A[ecoGroup(sp.name)] * 100) + '% of usual ' + ECO_GROUPS[ecoGroup(sp.name)][0].toLowerCase() + '</small></summary><div class="pad">' + ecoHtml(sp.x, sp.y, day) + '</div></details>';
  // encounter tracker
  const hp = hpList(sp), init = monTrack.init[sp.id];
  h += '<section><h3>Encounter tracker</h3><div class="actions"><button type="button" class="btn sm" data-mo="init" data-v="' + esc(sp.id) + '">Roll initiative</button>' + (init != null ? '<span class="small">Initiative <b>' + init + '</b></span>' : '') + '<button type="button" class="btn sm" data-mo="hpreset" data-v="' + esc(sp.id) + '">Reset HP</button></div><ul class="mhp">' +
    hp.map((v, i) => '<li class="' + (v <= 0 ? 'down' : '') + '"><span>' + esc(sp.name) + (sp.count > 1 ? ' ' + (i + 1) : '') + '</span><div class="meter hpm" aria-hidden="true"><i style="width:' + clamp(v / st.hp * 100, 0, 100).toFixed(0) + '%"></i></div><b>' + Math.max(0, v) + '/' + st.hp + '</b><input type="number" min="0" max="999" placeholder="0" aria-label="Amount for ' + esc(sp.name) + ' ' + (i + 1) + '" data-mohp="' + i + '"><button type="button" class="btn sm danger" data-mo="dmg" data-v="' + esc(sp.id) + '|' + i + '">Hit</button><button type="button" class="btn sm" data-mo="heal" data-v="' + esc(sp.id) + '|' + i + '">Heal</button></li>').join('') + '</ul><p class="small">' + hp.filter((v) => v <= 0).length + ' of ' + sp.count + ' down.</p></section>';
  // actions
  h += '<div class="actions">' + (gone ? '' : '<button type="button" class="btn primary" data-mo="slay" data-v="' + esc(sp.id) + '">Mark slain</button>') + (sp.kind === 'placed' ? '<button type="button" class="btn" data-mo="move" data-v="' + esc(sp.id) + '">Move</button><button type="button" class="btn danger" data-mo="remove" data-v="' + esc(sp.id) + '">Remove</button>' : (gone ? '' : '<button type="button" class="btn" data-mo="drive" data-v="' + esc(sp.id) + '">Driven off</button>') + '<button type="button" class="btn" data-mo="watch" data-v="' + esc(sp.id) + '">' + (monTrack.watch.includes(sp.id) ? 'Stop watching' : 'Watch') + '</button>') + '</div>';
  if (sp.kind === 'placed') h += '<div class="row2"><div class="field"><label class="lab" for="mo-pcount">Number</label><input id="mo-pcount" type="number" min="1" max="50" value="' + sp.count + '"></div><div class="field"><label class="lab" for="mo-pname">Name</label><input id="mo-pname" maxlength="60" value="' + esc(sp.name) + '"></div></div><div class="field"><label class="lab" for="mo-pnotes">Notes</label><textarea id="mo-pnotes" rows="2" maxlength="600" placeholder="Guarding the old mill; carries the stolen relic">' + esc(sp.placed.notes || '') + '</textarea></div>';
  return h + '</div>';
}
const MON_CLUSTER_S = 2.2;
function openMonster(id, fly) {
  if (isPlayer()) { toast('Monster whereabouts are for the DM.'); return; }
  if (id && id.startsWith('cl:')) { const [x, y] = id.slice(3).split(',').map(Number); flyTo(x, y, Math.max(MON_CLUSTER_S * 1.05, view.s * 2.6), 450); return; }
  if (tool !== 'monsters') setTool('monsters', true);
  panelMin = false;
  monUI.id = id; renderPanel();
  const el = $('inspector'); if (el) el.scrollTop = 0;
  if (fly) { const sp = findSpawn(id, market.day); if (sp) flyVis(sp.x, sp.y, Math.max(view.s, 6)); }
  requestRender();
}
function flyToSpawn(id) { const sp = findSpawn(id, market.day); if (sp) flyVis(sp.x, sp.y, Math.max(view.s, 6)); }
function monCommit(label, fn) { commit(label, () => { edits.monOff = Object.assign({}, edits.monOff || {}); edits.monAdd = (edits.monAdd || []).slice(); fn(); }, {}); }
$('inspector').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-mo]');
  if (!b || tool !== 'monsters') return;
  const a = b.dataset.mo, v = b.dataset.v || '';
  const day = market.day;
  switch (a) {
    case 'tab': if (v === monUI.tab && !monUI.id) { panelMin = true; renderPanel(); return; } monUI.tab = v; monUI.id = null; renderPanel(); return;
    case 'open': openMonster(v, false); flyToSpawn(v); return;
    case 'back': monUI.id = null; renderPanel(); return;
    case 'fly': flyToSpawn(v); return;
    case 'tomarket': setTool('market', true); market.tab = 'bounties'; if (monUI.sid) market.sid = monUI.sid; renderPanel(); return;
    case 'place': { const n = Math.max(1, Math.min(50, +(($('mo-count') || {}).value) || monUI.count)); monUI.count = n; monUI.place = { name: v, custom: !MON[v] && MON_SRD[v] ? { cr: MON_SRD[v][4], ac: MON_SRD[v][1], hp: MON_SRD[v][2], type: MON_SRD[v][0] } : undefined }; monUI.move = null; toast('Tap the map to place ' + (n > 1 ? n + ' × ' : '') + v + '.'); renderPanel(); return; }
    case 'placecustom': { const nm = (($('mo-cname') || {}).value || '').trim(); if (!nm) { toast('Give the creature a name first.'); return; } const n = Math.max(1, Math.min(50, +(($('mo-count') || {}).value) || 1)); monUI.count = n; monUI.place = { name: nm.slice(0, 60), custom: { cr: $('mo-ccr').value, ac: clamp(+$('mo-cac').value || 12, 1, 30), hp: clamp(+$('mo-chp').value || 10, 1, 999), type: 'creature' } }; toast('Tap the map to place ' + nm + '.'); renderPanel(); return; }
    case 'cancelplace': monUI.place = null; renderPanel(); return;
    case 'cancelmove': monUI.move = null; renderPanel(); return;
    case 'move': monUI.move = v; monUI.place = null; toast('Tap the map where it should be.'); renderPanel(); return;
    case 'remove': monCommit('Remove creature', () => { edits.monAdd = edits.monAdd.filter((p) => p.id !== v); delete edits.monOff[v]; }); monUI.id = null; delete monTrack.hp[v]; mtSave(); renderPanel(); return;
    case 'slay': monCommit('Creature slain', () => { edits.monOff[v] = { st: 'slain', d: day }; const sp = findSpawn(v, day); const np = sp && nearestPlace(sp.x, sp.y); if (sp) chronAdd({ k: 'mon', spawn: v, sid: np ? np.s.id : null, t: 'Slew ' + (sp.count > 1 ? sp.count + ' × ' : '') + sp.name + (np ? ' near ' + np.s.name : '') }); }); toast('Marked slain. Quests for it close and the danger around nearby towns eases.'); return;
    case 'drive': monCommit('Creature driven off', () => { edits.monOff[v] = { st: 'gone', d: day }; const sp = findSpawn(v, day); const np = sp && nearestPlace(sp.x, sp.y); if (sp) chronAdd({ k: 'mon', spawn: v, sid: np ? np.s.id : null, t: 'Drove off ' + (sp.count > 1 ? sp.count + ' × ' : '') + sp.name + (np ? ' near ' + np.s.name : '') }); }); return;
    case 'restore': monCommit('Creature returns', () => { delete edits.monOff[v]; }); return;
    case 'watch': { const i = monTrack.watch.indexOf(v); if (i >= 0) monTrack.watch.splice(i, 1); else monTrack.watch.push(v); mtSave(); renderPanel(); return; }
    case 'init': { const r = 1 + Math.floor(Math.random() * 20); monTrack.init[v] = r; mtSave(); toast('Initiative ' + r + ' (d20; add the creature\'s Dexterity modifier from its stat block).'); renderPanel(); return; }
    case 'hpreset': delete monTrack.hp[v]; mtSave(); renderPanel(); return;
    case 'dmg': case 'heal': {
      const [id, i] = v.split('|'); const sp = findSpawn(id, day); if (!sp) return;
      const inp = b.parentElement.querySelector('[data-mohp]'); const n = Math.max(0, Math.round(+(inp && inp.value) || 0)); if (!n) { toast('Type an amount first.'); if (inp) inp.focus(); return; }
      const arr = hpList(sp), st = monStats(sp);
      arr[+i] = a === 'dmg' ? Math.max(0, arr[+i] - n) : Math.min(st.hp, arr[+i] + n);
      monTrack.hp[id] = arr; mtSave();
      if (arr.every((x) => x <= 0) && !monGone(id, day)) { monCommit('Creature slain', () => { edits.monOff[id] = { st: 'slain', d: day }; }); toast('All ' + sp.name + (sp.count > 1 ? 's' : '') + ' are down.'); return; }
      const el = $('inspector'), top = el.scrollTop; renderPanel(); el.scrollTop = top; return;
    }
  }
});
$('inspector').addEventListener('change', (e) => {
  if (tool !== 'monsters') return;
  const t = e.target, id = t.id;
  if (id === 'mo-peaceful') { monUI.peaceful = t.checked; renderPanel(); requestRender(); return; }
  if (id === 'mo-count') { monUI.count = clamp(Math.round(+t.value || 1), 1, 50); return; }
  const sp = monUI.id ? findSpawn(monUI.id, market.day) : null;
  if (!sp || sp.kind !== 'placed') return;
  if (id === 'mo-pcount') { const n = clamp(Math.round(+t.value || 1), 1, 50); monCommit('Change number', () => { const p = edits.monAdd.find((q) => q.id === sp.id); if (p) edits.monAdd[edits.monAdd.indexOf(p)] = Object.assign({}, p, { count: n }); }); }
  else if (id === 'mo-pname') { const n = t.value.trim().slice(0, 60); if (n) monCommit('Rename creature', () => { const i = edits.monAdd.findIndex((q) => q.id === sp.id); if (i >= 0) edits.monAdd[i] = Object.assign({}, edits.monAdd[i], { name: n }); }); }
  else if (id === 'mo-pnotes') monCommit('Creature notes', () => { const i = edits.monAdd.findIndex((q) => q.id === sp.id); if (i >= 0) edits.monAdd[i] = Object.assign({}, edits.monAdd[i], { notes: t.value.slice(0, 600) }); });
});
$('inspector').addEventListener('input', (e) => {
  if (tool !== 'monsters' || e.target.id !== 'mo-q') return;
  monUI.q = e.target.value;
  const n = e.target.selectionStart;
  renderPanel();
  const f = $('mo-q'); if (f) { f.focus(); f.setSelectionRange(n, n); }
});
// map taps while the Monsters tool is open
function monTap(h, wx, wy) {
  const day = market.day;
  if (monUI.place || monUI.move) {
    if (wx < 0 || wy < 0 || wx > W || wy > H) return true;
    const b = monBiome(wx, wy);
    if (monUI.place) {
      const P = monUI.place, id = 'p' + edits.next;
      monCommit('Place ' + P.name, () => { edits.next++; edits.monAdd.push({ id, name: P.name, count: monUI.count, x: Math.round(wx * 100) / 100, y: Math.round(wy * 100) / 100, b, d: day, notes: '', custom: P.custom || null }); });
      monUI.place = null; monUI.id = id; renderPanel(); requestRender();
      toast(P.name + ' placed' + (HABITAT_OF[P.name] && !HABITAT_OF[P.name].has(b) ? ', though it is far from its usual ' + [...HABITAT_OF[P.name]].map((x) => T.NAMES[x].toLowerCase()).join(' or ') : '') + '.');
      return true;
    }
    const mid = monUI.move;
    monCommit('Move creature', () => { const i = edits.monAdd.findIndex((q) => q.id === mid); if (i >= 0) edits.monAdd[i] = Object.assign({}, edits.monAdd[i], { x: Math.round(wx * 100) / 100, y: Math.round(wy * 100) / 100, b }); });
    monUI.move = null; renderPanel(); requestRender(); return true;
  }
  if (h && h.kind === 'mon') { openMonster(h.id, false); return true; }
  if (h && h.kind === 'settle') { monUI.sid = h.id; market.sid = h.id; people.sid = h.id; monUI.id = null; monUI.tab = 'near'; renderPanel(); requestRender(); return true; }
  return false;
}
// claw markers on the map
const CLAW = new Path2D('M-3.6 -4.2 L-1.2 4.2 M0 -4.6 L0.6 4.4 M3.6 -4.2 L2.4 4.2');
function drawMonsters() {
  if (isPlayer()) return;
  if (!layers.monsters) return;
  const mt = tool === 'monsters';
  if (view.s < (mt ? 0.3 : 0.45)) return;
  const day = market.day;
  const x0 = view.x - vw / 2 / view.s, x1 = view.x + vw / 2 / view.s, y0 = view.y - vh / 2 / view.s, y1 = view.y + vh / 2 / view.s;
  const pad = 20 / view.s;
  let list = spawnsIn(x0 - pad, y0 - pad, x1 + pad, y1 + pad, day);
  const showCalm = mt ? monUI.peaceful || view.s >= 2 : view.s >= 3;
  list = list.filter((sp) => (showCalm || !PEACEFUL.has(sp.name)) && (view.s >= 1.2 || sp.kind === 'placed' || (mt && monUI.id === sp.id) || (view.s >= 0.6 ? sp.kind === 'lair' || crNum(sp.cr) >= (mt ? 1 : 2) : sp.kind === 'lair' && (/dragon/.test(sp.name) || crNum(sp.cr) >= 9))));
  if (list.length > 500) list = list.sort((a, b) => spawnXP(b) - spawnXP(a)).slice(0, 500);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 9.5px "Atkinson Hyperlegible", system-ui, sans-serif';
  // v26: zoomed out, nearby groups gather into one marker showing the most dangerous of them and how many groups there are,
  // so towns and roads stay readable. Tapping it zooms in. Placed and chosen creatures always show on their own.
  if (view.s < MON_CLUSTER_S) {
    const cell = mt ? 72 : 110, cells = new Map(), solo = [];
    for (const sp of list) {
      if (sp.kind === 'placed' || (mt && monUI.id === sp.id)) { solo.push(sp); continue; }
      const k = Math.floor(sp.x * view.s / cell) + ',' + Math.floor(sp.y * view.s / cell); // anchored to the world, so groups don't jump as you pan
      const c = cells.get(k); if (c) c.push(sp); else cells.set(k, [sp]);
    }
    list = solo;
    for (const g of cells.values()) {
      if (g.length === 1) { list.push(g[0]); continue; }
      let top = g[0], cx = 0, cy = 0;
      for (const sp of g) { cx += sp.x; cy += sp.y; if (monTier(sp) > monTier(top) || (monTier(sp) === monTier(top) && spawnXP(sp) > spawnXP(top))) top = sp; }
      cx /= g.length; cy /= g.length;
      const X = sx(cx), Y = sy(cy), r = 10.5, tierN = PEACEFUL.has(top.name) ? 0 : monTier(top);
      ctx.fillStyle = monCol(top); ctx.strokeStyle = 'rgba(20,16,10,.9)'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      if (tierN === 3) { const q = r * 1.25; ctx.moveTo(X, Y - q); ctx.lineTo(X + q, Y); ctx.lineTo(X, Y + q); ctx.lineTo(X - q, Y); ctx.closePath(); }
      else if (tierN === 4) { const q = r * 1.15; for (let k = 0; k < 6; k++) { const an = Math.PI / 6 + k * Math.PI / 3; if (k) ctx.lineTo(X + q * Math.cos(an), Y + q * Math.sin(an)); else ctx.moveTo(X + q * Math.cos(an), Y + q * Math.sin(an)); } ctx.closePath(); }
      else ctx.arc(X, Y, r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(243,234,210,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(X, Y, r + 3.5, 0, Math.PI * 2); ctx.stroke();
      ctx.save(); ctx.translate(X, Y); ctx.scale(r / 7.5, r / 7.5); ctx.strokeStyle = '#fff7e6'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.stroke(CLAW); ctx.restore();
      const txt = String(g.length), bw = Math.max(15, 7 + txt.length * 6), bx = X + r * 0.9, by = Y + r * 0.75;
      ctx.fillStyle = '#e2c37a'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx - bw / 2, by - 7, bw, 14, 7); else ctx.rect(bx - bw / 2, by - 7, bw, 14); ctx.fill();
      ctx.fillStyle = '#1a140c'; ctx.fillText(txt, bx, by + 0.5);
      markers.push({ kind: 'mon', id: 'cl:' + cx.toFixed(2) + ',' + cy.toFixed(2), X, Y, r: r + 6 });
    }
  }
  for (const sp of list) {
    const X = sx(sp.x), Y = sy(sp.y);
    const calm = PEACEFUL.has(sp.name);
    const r = calm ? 5 : sp.kind === 'lair' || /dragon/.test(sp.name) ? 9.5 : 7.5;
    const chosen = mt && monUI.id === sp.id;
    ctx.fillStyle = monCol(sp); ctx.strokeStyle = sp.kind === 'placed' ? '#e2c37a' : 'rgba(20,16,10,.85)'; ctx.lineWidth = sp.kind === 'placed' ? 2.2 : 1.4;
    // danger shows by shape as well as colour: circle, then diamond (CR 5+), then hexagon (dragons)
    const tierN = calm ? 0 : monTier(sp);
    ctx.beginPath();
    if (tierN === 3) { const q = r * 1.25; ctx.moveTo(X, Y - q); ctx.lineTo(X + q, Y); ctx.lineTo(X, Y + q); ctx.lineTo(X - q, Y); ctx.closePath(); }
    else if (tierN === 4) { const q = r * 1.15; for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; if (k) ctx.lineTo(X + q * Math.cos(a), Y + q * Math.sin(a)); else ctx.moveTo(X + q * Math.cos(a), Y + q * Math.sin(a)); } ctx.closePath(); }
    else ctx.arc(X, Y, r, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    if (!calm) { ctx.save(); ctx.translate(X, Y); ctx.scale(r / 7.5, r / 7.5); ctx.strokeStyle = '#fff7e6'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.stroke(CLAW); ctx.restore(); }
    if (sp.rare) { ctx.strokeStyle = '#b48cf0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X, Y, r + 2.5, 0, Math.PI * 2); ctx.stroke(); }
    if (sp.count > 1 && !calm) { const bx = X + r * 0.85, by = Y - r * 0.85; ctx.fillStyle = '#1a140c'; ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f3ead2'; ctx.fillText(String(sp.count), bx, by + 0.5); }
    if (chosen) { ctx.strokeStyle = '#e2c37a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y, r + 6, 0, Math.PI * 2); ctx.stroke(); }
    if (mt && view.s >= 4) { ctx.font = '600 11px "Atkinson Hyperlegible", system-ui, sans-serif'; haloText(sp.name + (sp.count > 1 ? ' ×' + sp.count : ''), X, Y + r + 9, '#f3ead2', 'rgba(15,12,8,.85)'); ctx.font = '700 9.5px "Atkinson Hyperlegible", system-ui, sans-serif'; }
    markers.push({ kind: 'mon', id: sp.id, X, Y, r: r + 4 });
  }
  ctx.textBaseline = 'alphabetic';
}

// ---------------------------------------------------------------- market: the bounty board
function bountiesTab(day) {
  const s0 = market.sid ? SBY.get(market.sid) : null;
  if (!s0) return '<div class="empty-note"><p>Tap a settlement to see what the guild pays for monsters there.</p><p class="meta">Bounties rise where monsters press close: every hostile group within reach of a town adds to its danger, and the guild pays up to double to get the job done.</p></div>';
  const s = hallFor(s0) || s0;
  const t = threatOf(s, day), tw = threatWord(t), mult = dangerMult(s, day);
  let h = '<div class="town-h"><div><div class="eyebrow">Bounty board' + (s !== s0 ? ' · nearest hall to ' + esc(s0.name) : '') + '</div><h3 class="town-name">' + tLink(s) + '</h3></div><div class="idx ' + (mult > 1.6 ? 'bad' : mult > 1.25 ? 'warn' : 'ok') + '"><b>' + Math.round(mult * 100) + '%</b><small>of standard</small></div></div>';
  // danger history
  const hist = []; for (let d = day - 30; d <= day; d += 3) hist.push(threatOf(s, d));
  h += '<p class="meta"><b>Danger:</b> ' + tw[0] + ' (index ' + t.toFixed(2) + ') ' + spark(hist) + ' · ' + changeTag(dangerMult(s, day) / dangerMult(s, day - 7) - 1) + ' on last week</p>';
  // per-head bounties for creatures around
  const groups = new Map();
  for (const { sp, d } of presence(s, day)) { const g = groups.get(sp.name) || { name: sp.name, cr: sp.cr, n: 0, packs: 0, near: 1e9, id: sp.id }; g.n += sp.count; g.packs++; if (d < g.near) { g.near = d; g.id = sp.id; } groups.set(sp.name, g); }
  const gl = [...groups.values()].sort((a, b) => crNum(b.cr) - crNum(a.cr) || b.n - a.n);
  const wk = dangerMult(s, day - 7);
  h += '<section><h3>Price on their heads</h3>' + (gl.length ? '<table class="shop"><thead><tr><th>Creature</th><th>Seen</th><th>Per head</th><th>7 days</th></tr></thead><tbody>' + gl.map((g) => '<tr><td>' + monLink(g.name) + '<small>CR ' + g.cr + ' · nearest ' + Math.round(g.near) + ' mi <button type="button" class="link" data-mon-spawn="' + esc(g.id) + '">find</button></small></td><td class="num">' + g.n + (g.packs > 1 ? ' in ' + g.packs : '') + '</td><td class="num">' + money(headPrice(g.cr) * mult) + '</td><td>' + changeTag(mult / wk - 1) + '</td></tr>').join('') + '</tbody></table>' : '<p class="meta">No hostile creatures within reach of ' + esc(s.name) + ' right now, so no bounties are posted.</p>') + '<p class="hint">A head is worth about a tenth of the creature\'s XP in gold, scaled by local danger. The guild takes a tenth.</p></section>';
  // quest rewards
  const qs = questsFor(s, day).filter((q) => { const st = questState(q, day); return st === 'open' || st === 'accepted'; }).sort((a, b) => b.reward - a.reward);
  h += '<section><h3>Quest rewards on the board (' + qs.length + ')</h3>' + (qs.length ? '<ul class="routes">' + qs.map((q) => '<li><div><b><button type="button" class="link" data-quest="' + esc(q.id) + '|' + esc(s.id) + '">' + esc(q.title) + '</button></b><small>' + RANKS[q.rank][0] + ' rank · ' + q.merit + ' merit' + (q.mon ? ' · ' + (q.count > 1 ? q.count + ' × ' : '') + esc(q.mon) : '') + ' · ' + (q.exp - day) + ' days left</small></div><span class="chg up">' + money(q.reward) + '</span></li>').join('') + '</ul>' : '<p class="meta">The board is bare today.</p>');
  h += '<h4>Going rates here</h4><ul class="movers">' + RANKS.map((r, i) => '<li><span>' + rankBadge(i, true) + '</span><span>' + money(REWARD[i][0] * mult) + ' – ' + money(REWARD[i][1] * mult) + '</span></li>').join('') + '</ul></section>';
  h += '<div class="actions"><button type="button" class="btn" data-quest-board="' + esc(s.id) + '">Open the quest board</button><button type="button" class="btn" data-mon-near="' + esc(s.id) + '">Monsters around ' + esc(s.name) + '</button></div>';
  return h;
}
// links that work from any panel
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-quest],[data-quest-board],[data-mon-spawn],[data-mon-near]');
  if (!t) return;
  ev.preventDefault(); ev.stopPropagation();
  if ((t.dataset.monSpawn || t.dataset.monNear) && isPlayer()) { toast('Monster whereabouts are for the DM.'); return; }
  if (t.dataset.quest) { const [qid, sid] = t.dataset.quest.split('|'); setTool('guilds', true); market.sid = sid; people.sid = sid; guildUI.org = null; guildUI.tab = 'board'; guildUI.q = qid; panelMin = false; renderPanel(); const el = $('inspector'); if (el) el.scrollTop = 0; }
  else if (t.dataset.questBoard) { setTool('guilds', true); market.sid = t.dataset.questBoard; guildUI.org = null; guildUI.q = null; guildUI.tab = 'board'; panelMin = false; renderPanel(); }
  else if (t.dataset.monSpawn) openMonster(t.dataset.monSpawn, true);
  else if (t.dataset.monNear) { setTool('monsters', true); monUI.sid = t.dataset.monNear; monUI.id = null; monUI.tab = 'near'; renderPanel(); const s = SBY.get(monUI.sid); if (s) flyVis(s.x, s.y, Math.max(view.s, 1.2)); }
}, true);
