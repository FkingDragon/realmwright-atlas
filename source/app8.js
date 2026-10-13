
// ================================================================ rules reference (SRD 5.1) and people on the map
// creatures: size & type, AC, HP, speed, CR, note
const MON = {
  'Elk': ['Large beast', 10, 13, '50 ft', '1/4', 'Charge: extra damage after moving 20 ft straight.'],
  'Wolf': ['Medium beast', 13, 11, '40 ft', '1/4', 'Pack Tactics; bite can knock prone.'],
  'Bandit': ['Medium humanoid', 12, 11, '30 ft', '1/8', 'Scimitar and light crossbow.'],
  'Gnoll': ['Medium humanoid', 15, 22, '30 ft', '1/2', 'Rampage: bonus bite after dropping a foe.'],
  'Lion': ['Large beast', 12, 26, '50 ft', '1', 'Pack Tactics, Pounce, Running Leap.'],
  'Ankheg': ['Large monstrosity', 14, 39, '30 ft, burrow 10 ft', '2', 'Acid spray line; grapples with its bite.'],
  'Griffon': ['Large monstrosity', 12, 59, '30 ft, fly 80 ft', '2', 'Keen sight; prized as mounts if raised from eggs.'],
  'Centaur': ['Large monstrosity', 12, 45, '50 ft', '2', 'Charge with pike; usually neutral wanderers.'],
  'Bulette': ['Large monstrosity', 17, 94, '40 ft, burrow 40 ft', '5', 'Deadly Leap: crushes and knocks prone.'],
  'Hill Giant': ['Huge giant', 13, 105, '40 ft', '5', 'Hurls rocks; greataclub.'],
  'Deer': ['Medium beast', 13, 4, '50 ft', '0', 'Harmless game.'],
  'Boar': ['Medium beast', 11, 11, '40 ft', '1/4', 'Charge; Relentless (drops to 1 HP instead of 0 once).'],
  'Goblin': ['Small humanoid', 15, 7, '30 ft', '1/4', 'Nimble Escape: Disengage or Hide as a bonus action.'],
  'Pixie': ['Tiny fey', 15, 1, '10 ft, fly 30 ft', '1/4', 'Innate magic; mostly mischievous.'],
  'Dire Wolf': ['Large beast', 14, 37, '50 ft', '1', 'Pack Tactics; bite knocks prone.'],
  'Brown Bear': ['Large beast', 11, 34, '40 ft, climb 30 ft', '1', 'Bite and claws each turn.'],
  'Giant Spider': ['Large beast', 14, 26, '30 ft, climb 30 ft', '1', 'Web restrains; poison bite; Web Walker.'],
  'Dryad': ['Medium fey', 11, 22, '30 ft', '1', 'Fey Charm; Tree Stride; AC 16 with barkskin.'],
  'Owlbear': ['Large monstrosity', 13, 59, '40 ft', '3', 'Keen sight and smell; beak and claws.'],
  'Werewolf': ['Medium humanoid (shapechanger)', 11, 58, '30 ft (40 ft as wolf)', '3', 'Immune to nonmagical, non-silvered weapons; bite spreads lycanthropy.'],
  'Green Hag': ['Medium fey', 17, 82, '30 ft', '3', 'Mimicry, illusions, invisible passage.'],
  'Giant Owl': ['Large beast', 12, 19, '5 ft, fly 60 ft', '1/4', 'Flyby; keen hearing and sight.'],
  'Black Bear': ['Medium beast', 11, 19, '40 ft, climb 30 ft', '1/2', 'Keen smell.'],
  'Winter Wolf': ['Large monstrosity', 13, 75, '50 ft', '3', 'Cold breath (recharge 5-6); speaks Giant and Winter Wolf.'],
  'Ettin': ['Large giant', 12, 85, '40 ft', '4', 'Two heads: advantage against being blinded, charmed or surprised.'],
  'Werebear': ['Medium humanoid (shapechanger)', 10, 135, '30 ft (40 ft as bear)', '5', 'Immune to nonmagical, non-silvered weapons.'],
  'Panther': ['Medium beast', 12, 13, '50 ft, climb 40 ft', '1/4', 'Pounce; Keen Smell.'],
  'Ape': ['Medium beast', 12, 19, '30 ft, climb 30 ft', '1/2', 'Throws rocks.'],
  'Lizardfolk': ['Medium humanoid', 15, 22, '30 ft, swim 30 ft', '1/2', 'Holds breath 15 minutes; multiattack.'],
  'Giant Wasp': ['Medium beast', 12, 13, '10 ft, fly 50 ft', '1/2', 'Poison sting.'],
  'Tiger': ['Large beast', 12, 37, '40 ft', '1', 'Pounce; Keen Smell.'],
  'Giant Constrictor Snake': ['Huge beast', 12, 60, '30 ft, swim 30 ft', '2', 'Constrict: grapples and restrains.'],
  'Allosaurus': ['Large beast', 13, 51, '60 ft', '2', 'Pounce.'],
  'Couatl': ['Medium celestial', 19, 97, '30 ft, fly 90 ft', '4', 'Shielded mind; innate spells; a guardian, not a threat.'],
  'Triceratops': ['Huge beast', 13, 95, '50 ft', '5', 'Trampling Charge.'],
  'Giant Frog': ['Medium beast', 11, 18, '30 ft, swim 30 ft', '1/4', 'Swallows small creatures.'],
  'Crocodile': ['Large beast', 12, 19, '20 ft, swim 30 ft', '1/2', 'Bite grapples; holds breath.'],
  'Swarm of Insects': ['Medium swarm of Tiny beasts', 12, 22, '20 ft, climb 20 ft', '1/2', 'Resists bludgeoning, piercing and slashing.'],
  "Will-o'-Wisp": ['Tiny undead', 19, 22, 'fly 50 ft (hover)', '2', 'Invisibility; Consume Life; lures travellers.'],
  'Shambling Mound': ['Large plant', 15, 136, '20 ft, swim 20 ft', '5', 'Lightning Absorption; Engulf.'],
  'Hydra': ['Huge monstrosity', 15, 172, '30 ft, swim 30 ft', '8', 'Multiple heads; grows two for each one severed unless burned.'],
  'Jackal': ['Small beast', 12, 3, '40 ft', '0', 'Pack Tactics.'],
  'Camel': ['Large beast', 9, 15, '50 ft', '1/8', 'Beast of burden.'],
  'Giant Lizard': ['Large beast', 12, 19, '30 ft, climb 30 ft', '1/4', 'Often used as a mount.'],
  'Dust Mephit': ['Small elemental', 12, 17, '30 ft, fly 30 ft', '1/2', 'Blinding breath; Death Burst.'],
  'Giant Scorpion': ['Large beast', 15, 52, '40 ft', '3', 'Claws grapple; poison sting.'],
  'Mummy': ['Medium undead', 11, 58, '20 ft', '3', 'Dreadful Glare; rotting fist curse; vulnerable to fire.'],
  'Lamia': ['Large monstrosity', 13, 97, '30 ft', '4', 'Intoxicating Touch; charm and illusion spells.'],
  'Purple Worm': ['Gargantuan monstrosity', 18, 247, '50 ft, burrow 30 ft', '15', 'Swallows whole; Tremorsense.'],
  'Hyena': ['Medium beast', 11, 5, '50 ft', '0', 'Pack Tactics.'],
  'Giant Vulture': ['Large beast', 10, 22, '10 ft, fly 60 ft', '1', 'Pack Tactics.'],
  'Bandit Captain': ['Medium humanoid', 15, 65, '30 ft', '2', 'Parry; multiattack.'],
  'Manticore': ['Large monstrosity', 14, 68, '30 ft, fly 50 ft', '3', 'Tail spike volleys.'],
  'Chimera': ['Large monstrosity', 14, 114, '30 ft, fly 60 ft', '6', 'Fire breath (recharge 5-6).'],
  'Polar Bear': ['Large beast', 12, 42, '40 ft, swim 30 ft', '2', 'Keen Smell.'],
  'Ice Mephit': ['Small elemental', 11, 21, '30 ft, fly 30 ft', '1/2', 'Frost breath; Death Burst.'],
  'Yeti': ['Large monstrosity', 12, 51, '40 ft, climb 40 ft', '3', 'Chilling Gaze; Snow Camouflage.'],
  'Mammoth': ['Huge beast', 13, 126, '40 ft', '6', 'Trampling Charge.'],
  'Frost Giant': ['Huge giant', 15, 138, '40 ft', '8', 'Greataxe; hurls rocks.'],
  'Remorhaz': ['Huge monstrosity', 17, 195, '30 ft, burrow 20 ft', '11', 'Heated Body; swallows whole.'],
  'Eagle': ['Small beast', 12, 3, '10 ft, fly 60 ft', '0', 'Keen Sight.'],
  'Giant Goat': ['Large beast', 11, 19, '40 ft', '1/2', 'Charge; Sure-Footed.'],
  'Orc': ['Medium humanoid', 13, 15, '30 ft', '1/2', 'Aggressive: bonus-action move toward a foe.'],
  'Hippogriff': ['Large monstrosity', 11, 19, '40 ft, fly 60 ft', '1', 'Keen Sight; trainable mount.'],
  'Troll': ['Large giant', 15, 84, '30 ft', '5', 'Regeneration 10 unless hit by acid or fire.'],
  'Wyvern': ['Large dragon', 13, 110, '20 ft, fly 80 ft', '6', 'Poison stinger.'],
  'Stone Giant': ['Huge giant', 17, 126, '40 ft', '7', 'Stone Camouflage; Rock Catching.'],
  'Roc': ['Gargantuan monstrosity', 15, 248, '20 ft, fly 120 ft', '11', 'Carries off elephants.'],
  'Giant Crab': ['Medium beast', 15, 13, '30 ft, swim 30 ft', '1/8', 'Claw grapples.'],
  'Merfolk': ['Medium humanoid', 11, 11, '10 ft, swim 40 ft', '1/8', 'Amphibious.'],
  'Sahuagin': ['Medium humanoid', 12, 22, '30 ft, swim 40 ft', '1/2', 'Blood Frenzy; Shark Telepathy.'],
  'Reef Shark': ['Medium beast', 12, 22, 'swim 40 ft', '1/2', 'Pack Tactics; water breathing.'],
  'Harpy': ['Medium monstrosity', 11, 38, '20 ft, fly 40 ft', '1', 'Luring Song charms listeners.'],
  'Sea Hag': ['Medium fey', 14, 52, '30 ft, swim 40 ft', '2', 'Horrific Appearance; Death Glare.'],
  'Plesiosaurus': ['Large beast', 13, 68, '20 ft, swim 40 ft', '2', 'Holds breath 1 hour.'],
  'Young white dragon': ['Large dragon', 17, 133, '40 ft, burrow 20 ft, fly 80 ft, swim 40 ft', '6', 'Cold breath (recharge 5-6).'],
  'Young black dragon': ['Large dragon', 18, 127, '40 ft, fly 80 ft, swim 40 ft', '7', 'Acid breath (recharge 5-6).'],
  'Young green dragon': ['Large dragon', 18, 136, '40 ft, fly 80 ft, swim 40 ft', '8', 'Poison breath (recharge 5-6).'],
  'Young blue dragon': ['Large dragon', 18, 152, '40 ft, burrow 20 ft, fly 80 ft', '9', 'Lightning breath (recharge 5-6).'],
  'Young red dragon': ['Large dragon', 18, 178, '40 ft, climb 40 ft, fly 80 ft', '10', 'Fire breath (recharge 5-6).'],
  'Adult white dragon': ['Huge dragon', 18, 200, '40 ft, burrow 30 ft, fly 80 ft, swim 40 ft', '13', 'Legendary resistance and actions; frightful presence.'],
  'Adult black dragon': ['Huge dragon', 19, 195, '40 ft, fly 80 ft, swim 40 ft', '14', 'Legendary resistance and actions; frightful presence.'],
  'Adult green dragon': ['Huge dragon', 19, 207, '40 ft, fly 80 ft, swim 40 ft', '15', 'Legendary resistance and actions; frightful presence.'],
  'Adult blue dragon': ['Huge dragon', 19, 225, '40 ft, burrow 30 ft, fly 80 ft', '16', 'Legendary resistance and actions; frightful presence.'],
  'Adult red dragon': ['Huge dragon', 19, 256, '40 ft, climb 40 ft, fly 80 ft', '17', 'Legendary resistance and actions; frightful presence.'],
  // NPC stat blocks
  'Commoner': ['Medium humanoid', 10, 4, '30 ft', '0', 'Club.'],
  'Guard': ['Medium humanoid', 16, 11, '30 ft', '1/8', 'Spear; chain shirt and shield.'],
  'Acolyte': ['Medium humanoid', 10, 9, '30 ft', '1/4', 'Spellcaster: light, sacred flame, bless, cure wounds.'],
  'Noble': ['Medium humanoid', 15, 9, '30 ft', '1/8', 'Parry; rapier.'],
  'Cultist': ['Medium humanoid', 12, 9, '30 ft', '1/8', 'Dark Devotion.'],
  'Scout': ['Medium humanoid', 13, 16, '30 ft', '1/2', 'Keen hearing and sight; longbow.'],
  'Thug': ['Medium humanoid', 11, 32, '30 ft', '1/2', 'Pack Tactics; mace.'],
  'Spy': ['Medium humanoid', 12, 27, '30 ft', '1', 'Cunning Action; Sneak Attack.'],
  'Priest': ['Medium humanoid', 13, 27, '25 ft', '2', 'Divine Eminence; spiritual weapon, spirit guardians.'],
  'Cult Fanatic': ['Medium humanoid', 13, 33, '30 ft', '2', 'Spellcaster: hold person, inflict wounds.'],
  'Veteran': ['Medium humanoid', 17, 58, '30 ft', '3', 'Multiattack with longsword and shortsword.'],
  'Knight': ['Medium humanoid', 18, 52, '30 ft', '3', 'Brave; Leadership; Parry.'],
  'Gladiator': ['Medium humanoid', 16, 112, '30 ft', '5', 'Brave; Brute; Parry.'],
  'Mage': ['Medium humanoid', 12, 40, '30 ft', '6', 'AC 15 with mage armor; fireball, counterspell, greater invisibility.'],
  'Assassin': ['Medium humanoid', 15, 78, '30 ft', '8', 'Assassinate; Evasion; poisoned blades.']
};
const XP_CR = { '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000 };
// DMG encounter XP thresholds per character level: easy, medium, hard, deadly
const XP_THRESH = [null, [25, 50, 75, 100], [50, 100, 150, 200], [75, 150, 225, 400], [125, 250, 375, 500], [250, 500, 750, 1100], [300, 600, 900, 1400], [350, 750, 1100, 1700], [450, 900, 1400, 2100], [550, 1100, 1600, 2400], [600, 1200, 1900, 2800], [800, 1600, 2400, 3600], [1000, 2000, 3000, 4500], [1100, 2200, 3400, 5100], [1250, 2500, 3800, 5700], [1400, 2800, 4300, 6400], [1600, 3200, 4800, 7200], [2000, 3900, 5900, 8800], [2100, 4200, 6300, 9500], [2400, 4900, 7300, 10900], [2800, 5700, 8500, 12700]];
const HIT_DIE = { Barbarian: 12, Fighter: 10, Paladin: 10, Ranger: 10, Bard: 8, Cleric: 8, Druid: 8, Monk: 8, Rogue: 8, Warlock: 8, Sorcerer: 6, Wizard: 6 };
const CLASS_AC = { Barbarian: 15, Fighter: 18, Paladin: 18, Ranger: 15, Bard: 14, Cleric: 17, Druid: 15, Monk: 16, Rogue: 15, Warlock: 13, Sorcerer: 13, Wizard: 13 };
const encMult = (n) => (n <= 1 ? 1 : n === 2 ? 1.5 : n <= 6 ? 2 : n <= 10 ? 2.5 : n <= 14 ? 3 : 4);
function difficulty(levels, cr, count) {
  if (!levels.length || XP_CR[cr] == null) return null;
  const xp = XP_CR[cr] * count, adj = xp * encMult(count);
  const th = [0, 0, 0, 0];
  for (const l of levels) { const t = XP_THRESH[clamp(l, 1, 20)]; for (let i = 0; i < 4; i++) th[i] += t[i]; }
  const k = adj >= th[3] ? 4 : adj >= th[2] ? 3 : adj >= th[1] ? 2 : adj >= th[0] ? 1 : 0;
  return { xp, adj: Math.round(adj), label: ['Trivial', 'Easy', 'Medium', 'Hard', 'Deadly'][k], k, th };
}
function classStats(cls, level) {
  const hd = HIT_DIE[cls] || 8;
  const hp = hd + 1 + (level - 1) * (hd / 2 + 2);
  return { hp: Math.round(hp), ac: (CLASS_AC[cls] || 14) + (level >= 9 ? 1 : 0), prof: 2 + Math.floor((level - 1) / 4) };
}
function statLine(p) {
  if (p.cls && p.level) { const c = classStats(p.cls, p.level); return 'Level ' + p.level + ' ' + p.cls.toLowerCase() + ' · HP ≈' + c.hp + ' · AC ≈' + c.ac + ' · proficiency +' + c.prof; }
  const m = monInfo(p.stat);
  return m ? '<button type="button" class="link" data-mon="' + esc(p.stat) + '">' + esc(p.stat) + '</button> · AC ' + m[1] + ' · HP ' + m[2] + ' · CR ' + m[4] : esc(p.stat || 'Commoner');
}
function monLink(name) { return monInfo(name) ? '<button type="button" class="link" data-mon="' + esc(name) + '">' + esc(name) + '</button>' : extLink(AID.monster(name), name); }
function showMonster(name) {
  const m = monInfo(name);
  if (!m) return;
  monCard = name;
  const sb = SRD.monBy.get(name.toLowerCase());
  const el = $('monPop');
  const lv = (gst().party.members || []).map((x) => x.level);
  const d = lv.length ? [1, 2, 4].map((n) => [n, difficulty(lv, m[4], n)]) : null;
  el.innerHTML = '<div class="mon-h"><div><div class="eyebrow">' + esc(m[0]) + '</div><h2>' + esc(name) + '</h2></div><button type="button" class="x" data-close-mon aria-label="Close">×</button></div>' +
    '<dl class="stats">' + stat('Armour class', m[1]) + stat('Hit points', m[2]) + stat('Challenge', m[4] + (XP_CR[m[4]] != null ? ' <small>(' + XP_CR[m[4]].toLocaleString('en-GB') + ' XP)</small>' : '')) + '</dl>' +
    '<p class="meta"><b>Speed</b> ' + esc(m[3]) + '</p>' + (sb ? statBlock(sb) : '<p>' + esc(m[5]) + '</p>') +
    (d ? '<section><h3>Against your party</h3><ul class="movers">' + d.map(([n, r]) => '<li><span>' + (n === 1 ? 'One' : n === 2 ? 'A pair' : 'Four') + '</span><span class="diff d' + r.k + '">' + r.label + '</span></li>').join('') + '</ul><p class="meta">Dungeon Master\'s Guide encounter thresholds for levels ' + lv.join(', ') + '.</p></section>' : '<p class="meta">Register your party on the Guilds tab to see how dangerous this is for them.</p>') +
    '<p class="meta">' + (sb ? 'Stat block from the System Reference Document 5.1 (the free core of the Monster Manual).' : 'Summary from the System Reference Document 5.1 (the free core of the Monster Manual). See the full stat block for actions.') + '</p>' + '<p class="meta">' + extLink(AID.monster(name), 'Full Monster Manual entry on AideDD') + ' · ' + extLink(AID.monsters, 'Browse every monster') + '</p>';
  el.hidden = false;
}
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-mon]');
  if (b) { ev.preventDefault(); showMonster(b.dataset.mon); return; }
  if (ev.target.closest('[data-close-mon]')) $('monPop').hidden = true;
});

// ---------------------------------------------------------------- where people are
function workBuilding(p, s, P) {
  if (!P || !P.n) return -1;
  const want = p.group === 'leader' ? 2 : p.group === 'faith' ? 1 : -1;
  if (want >= 0) for (let i = 0; i < P.n; i++) if (P.bk[i] === want) return i;
  if (p.group === 'adventurer') { // everyone in the guild is seen at the hall: the biggest house near the square
    let best = -1, bd = 1e9;
    for (let i = 0; i < Math.min(P.n, 400); i++) { if (P.bk[i] !== 0) continue; const d = Math.hypot(P.bx[i] - s.x, P.by[i] - s.y) - P.bw[i] * 3; if (d < bd) { bd = d; best = i; } }
    return best;
  }
  const homes = [];
  for (let i = 0; i < P.n; i++) if (P.bk[i] === 0 || P.bk[i] === 4) homes.push(i);
  if (!homes.length) return -1;
  const central = p.group === 'trade' || p.group === 'service' || p.group === 'craft';
  const pool = central ? homes.slice(0, Math.max(1, Math.floor(homes.length * 0.35))) : homes;
  return pool[(p.h || hashStr(p.id)) % pool.length];
}
const locCache = new WeakMap();
function npcLocation(p) {
  const s = SBY.get(p.sid);
  if (!s) return null;
  const R = settleR(s);
  let P = null;
  try { P = getPlan(s); } catch (e) { P = null; }
  let m = P ? locCache.get(P) : null;
  if (P && !m) { m = new Map(); locCache.set(P, m); }
  const ck = p.id + '|' + p.group;
  if (m && m.has(ck)) return m.get(ck);
  const i = workBuilding(p, s, P);
  let out;
  if (i >= 0) out = { x: P.bx[i], y: P.by[i], s, R };
  else { const a = ((p.h || 1) % 360) * Math.PI / 180, r = R * 0.5; out = { x: s.x + Math.cos(a) * r, y: s.y + Math.sin(a) * r, s, R }; }
  if (m) m.set(ck, out);
  return out;
}
function flyToPerson(p) {
  const L = npcLocation(p);
  if (!L) return;
  const target = clamp(Math.min(vw, vh) * 0.3 / L.R, PLAN_S * 1.15, 9000);
  const ts = view.s > target && Math.hypot(view.x - L.x, view.y - L.y) * view.s < Math.min(vw, vh) * 0.4 ? view.s : target;
  flyTo(L.x, L.y, ts);
}
// pins: the person you are looking at, the people you track, and in People mode everyone in the town
function drawPeoplePins() {
  if (view.s < PLAN_S) return;
  const show = new Map();
  const add = (p, kind) => { if (p && !show.has(p.id)) show.set(p.id, [p, kind]); };
  if (people.npc) add(npcById(people.npc), 'focus');
  if (edits.npc) for (const id in edits.npc) if (edits.npc[id].tracked) add(npcById(id), 'tracked');
  if (tool === 'people' && people.sid && layers.people) { const s = SBY.get(people.sid); if (s && Math.hypot(s.x - view.x, s.y - view.y) < (vw + vh) / view.s) for (const p of residents(s)) add(p, 'resident'); }
  if (!show.size) return;
  const placed = new Map();
  const names = view.s > 2600;
  ctx.font = '600 11px "Atkinson Hyperlegible", system-ui, sans-serif';
  ctx.textAlign = 'center';
  const list = [...show.values()].sort((a, b) => (a[1] === 'focus') - (b[1] === 'focus'));
  for (const [p, kind] of list) {
    const L = npcLocation(p);
    if (!L) continue;
    let X = sx(L.x), Y = sy(L.y);
    if (X < -30 || X > vw + 30 || Y < -30 || Y > vh + 30) continue;
    const key = Math.round(X / 6) + ':' + Math.round(Y / 6);
    const n = placed.get(key) || 0;
    placed.set(key, n + 1);
    if (n) { const a = n * 2.4; X += Math.cos(a) * (6 + n * 1.5); Y += Math.sin(a) * (6 + n * 1.5); }
    const focus = kind === 'focus', r = focus ? 7 : kind === 'tracked' ? 5.5 : 4.5;
    const col = focus ? '#e2c37a' : kind === 'tracked' ? '#c9a253' : (GROUP_COL[pubGroup(p)] || '#d8d1bf');
    ctx.fillStyle = col; ctx.strokeStyle = '#1a140c'; ctx.lineWidth = focus ? 2 : 1.4;
    ctx.beginPath(); ctx.moveTo(X, Y); ctx.arc(X, Y - r * 1.6, r, Math.PI * 0.75, Math.PI * 2.25); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (focus) { ctx.strokeStyle = 'rgba(227,179,65,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y, 14, 0, Math.PI * 2); ctx.stroke(); }
    if (names || focus || kind === 'tracked') haloText(p.first + (focus ? ' ' + (p.last || '') : ''), X, Y - r * 3 - 4, '#1a140c', 'rgba(246,238,218,0.92)', 3);
    markers.push({ kind: 'npc', id: p.id, X, Y: Y - r * 1.6, r: Math.max(9, r + 4) });
  }
}
const GROUP_COL = { leader: '#b9483a', faith: '#e8e2cf', watch: '#6f87a6', craft: '#b98a52', trade: '#d6b04c', service: '#c7795b', labour: '#9aa36a', arcane: '#8f74c9', underworld: '#4b4f57', adventurer: '#3f9a87' };

// ---------------------------------------------------------------- finding people from the search box
let pIndex = null, pIndexVer = -1;
function peopleIndex() {
  if (pIndex && pIndexVer === mkVer) return pIndex;
  const out = [], seen = new Set();
  const put = (p) => { if (!p || seen.has(p.id)) return; seen.add(p.id); const s = SBY.get(p.sid); out.push({ id: p.id, name: npcName(p), lc: npcName(p).toLowerCase(), sub: p.job + (s ? ' · ' + s.name : ''), tier: s ? s.tier : 1 }); };
  for (const s of SET) {
    if (s.tier < 2) continue;
    for (const p of townPeople(s, LEADERS[s.tier].length).list) put(withOv(p));
    const R = roster(s);
    if (R) for (const p of R.list) put(withOv(p));
  }
  for (const tp of townCache.values()) for (const p of tp.list) put(withOv(p));
  for (const id in edits.npc || {}) put(npcById(id));
  for (const c of edits.npcAdd || []) put(withOv(c));
  pIndex = out; pIndexVer = mkVer;
  return out;
}
function searchPeople(q) {
  if (q.length < 2) return [];
  const res = [];
  for (const e of peopleIndex()) { const i = e.lc.indexOf(q); if (i >= 0) res.push({ kind: 'npc', id: e.id, name: e.name, sub: e.sub, rank: (e.lc === q ? 7 : i === 0 || e.lc.charAt(i - 1) === ' ' ? 4.5 : 2) + e.tier * 0.1 }); }
  return res;
}
