// ================================================================ 2024 class features (SRD 5.2 / Player's Handbook 2024) (v25)
// With the 2024 rules, each class uses its 2024 features, spell counts, starting equipment and level 19 epic boon.
// CLS(h) gives the class table for a hero: the 2014 one, or the 2014 one with these 2024 changes laid over it.
// The built-in subclass is the one in the free SRD 5.2; other subclasses work as in 2014 (the player lists the features).
const PREP24 = {
  full: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  half: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
  sorc: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  lock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  wiz: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25]
};
const ASI24 = [4, 8, 12, 16];
const MARTIAL_LIGHT = WEAPONS.filter((w) => w.cat.startsWith('martial') && w.props.includes('light')).map((w) => w.name);
const MARTIAL_FINLIGHT = WEAPONS.filter((w) => w.cat.startsWith('martial') && (w.props.includes('light') || w.props.includes('finesse'))).map((w) => w.name);
// a few 2024 starting-kit items the 2014 shop lacked
for (const [name, cost, wt, note] of [['Quiver', 1, 1, 'Holds 20 arrows.'], ['Robe', 1, 4], ['Book (occult lore)', 25, 5, 'A book of forbidden lore; it can hold rituals.'], ['Arcane focus (orb)', 20, 3, 'An arcane spellcasting focus.'], ['Druidic focus (sprig of mistletoe)', 1, 0, 'A druidic spellcasting focus.']]) {
  if (ITEM.has(name)) continue;
  const g = { name, cost, wt, note: note || '', kind: 'gear' };
  GEAR.push(g); ITEM.set(name, g);
}
const STYLES24 = Object.assign({}, STYLES, {
  gwf: ['Great Weapon Fighting', 'With a two-handed or versatile melee weapon held in two hands, treat any 1 or 2 on a damage die as a 3.'],
  protection: ['Protection', 'With a shield, use your reaction when a creature attacks an ally within 5 ft: that attack and the others against the ally have disadvantage until your next turn.'],
  twf: ['Two-Weapon Fighting', 'Add your ability modifier to the damage of the extra attack from a Light weapon.'],
  blessed: ['Blessed Warrior', 'Learn two cleric cantrips (Charisma is your ability for them). Swap one when you gain a paladin level.'],
  druidic: ['Druidic Warrior', 'Learn two druid cantrips (Wisdom is your ability for them). Swap one when you gain a ranger level.']
});
const styleTab = (h) => (is24(h) ? STYLES24 : STYLES);
const METAMAGIC24 = {
  careful: ['Careful Spell', '1 point: up to your Cha mod creatures automatically succeed on the spell\'s save and take no damage if they would take half.'],
  distant: ['Distant Spell', '1 point: double the range of a spell with a range of 5 ft or more; touch becomes 30 ft.'],
  empowered: ['Empowered Spell', '1 point: reroll up to your Cha mod damage dice. Works alongside other Metamagic.'],
  extended: ['Extended Spell', '1 point: double a duration of 1 minute or more (max 24 hours); advantage on its Concentration saves.'],
  heightened: ['Heightened Spell', '2 points: one target has disadvantage on its saves against the spell.'],
  quickened: ['Quickened Spell', '2 points: cast a one-action spell as a bonus action (not if you already cast a level 1+ spell this turn).'],
  seeking: ['Seeking Spell', '1 point: reroll a missed spell attack roll. Works alongside other Metamagic.'],
  subtle: ['Subtle Spell', '1 point: cast without verbal, somatic or material components that have no cost.'],
  transmuted: ['Transmuted Spell', '1 point: change acid, cold, fire, lightning, poison or thunder damage to another of those types.'],
  twinned: ['Twinned Spell', '1 point: when a spell can target one more creature by upcasting, raise its effective level by 1.']
};
const META_ORDER24 = ['quickened', 'twinned', 'subtle', 'careful', 'empowered', 'heightened', 'seeking', 'extended', 'distant', 'transmuted'];
const metaTab = (h) => (is24(h) ? METAMAGIC24 : METAMAGIC);
const metaN = (h, lv) => (is24(h) ? (lv >= 17 ? 6 : lv >= 10 ? 4 : lv >= 2 ? 2 : 0) : (lv >= 17 ? 4 : lv >= 10 ? 3 : lv >= 3 ? 2 : 0));
// [name, what it does, warlock level needed, needs (pblade/pchain/ptome/thirsting, or eb for a damaging cantrip)]
const INVOCATIONS24 = {
  pblade: ['Pact of the Blade', 'Bonus action: conjure a pact weapon or bond with a magic weapon you touch. You are proficient with it, can use Charisma for its attacks and damage, and it can deal necrotic, psychic or radiant damage.', 1],
  pchain: ['Pact of the Chain', 'Learn Find Familiar and cast it as a Magic action without a slot. The familiar can take a special form (imp, pseudodragon, quasit, skeleton, slaad tadpole, sphinx of wonder, sprite or venomous snake), and can attack with its reaction when you take the Attack action.', 1],
  ptome: ['Pact of the Tome', 'A Book of Shadows holds three cantrips and two level 1 rituals from any class, always prepared. It can be your spellcasting focus.', 1],
  armor: ['Armor of Shadows', 'Cast Mage Armor on yourself without a spell slot.', 1],
  eldmind: ['Eldritch Mind', 'Advantage on Constitution saves to keep Concentration.', 1],
  agonizing: ['Agonizing Blast', 'Add your Charisma modifier to the damage of a warlock damage cantrip (eldritch blast).', 2, 'eb'],
  spear: ['Eldritch Spear', 'A warlock damage cantrip gets 30 ft more range per warlock level.', 2, 'eb'],
  repelling: ['Repelling Blast', 'When a warlock damage cantrip hits a Large or smaller creature, push it up to 10 ft away.', 2, 'eb'],
  devilsight: ["Devil's Sight", 'See normally in dim light and darkness, magical or not, within 120 ft.', 2],
  vigor: ['Fiendish Vigor', 'Cast False Life on yourself without a slot, taking the maximum temporary hit points.', 2],
  lessons: ['Lessons of the First Ones', 'Gain one origin feat of your choice (note it in your story).', 2],
  mask: ['Mask of Many Faces', 'Cast Disguise Self without a slot.', 2],
  misty: ['Misty Visions', 'Cast Silent Image without a slot.', 2],
  leap: ['Otherworldly Leap', 'Cast Jump on yourself without a slot.', 2],
  ascendant: ['Ascendant Step', 'Cast Levitate on yourself without a slot.', 5],
  smite: ['Eldritch Smite', 'Once per turn when your pact weapon hits, spend a pact slot: +1d8 force plus 1d8 per slot level, and you can knock a Huge or smaller target prone.', 5, 'pblade'],
  gaze: ['Gaze of Two Minds', 'Bonus action: touch a willing creature and perceive through its senses until your next turn ends; you can cast spells as if from its space.', 5],
  depths: ['Gift of the Depths', 'Breathe underwater and swim at your speed; cast Water Breathing once per long rest without a slot.', 5],
  chainmaster: ['Investment of the Chain Master', 'Your familiar gains a 40-ft fly or swim speed, its attacks deal necrotic or radiant damage, it uses your spell save DC, and it can attack as a bonus action command. Reaction: give it resistance to damage.', 5, 'pchain'],
  myriad: ['Master of Myriad Forms', 'Cast Alter Self without a slot.', 5],
  shadows: ['One with Shadows', 'In dim light or darkness, cast Invisibility on yourself without a slot.', 5],
  thirsting: ['Thirsting Blade', 'Attack twice with your pact weapon when you take the Attack action.', 5, 'pblade'],
  grave: ['Whispers of the Grave', 'Cast Speak with Dead without a slot.', 7],
  protectors: ['Gift of the Protectors', 'Creatures who write their names in your Book of Shadows drop to 1 HP instead of 0, once each per long rest.', 9, 'ptome'],
  lifedrinker: ['Lifedrinker', 'Once per turn your pact weapon deals +1d6 necrotic, psychic or radiant damage, and you can spend a hit die to heal.', 9, 'pblade'],
  distant: ['Visions of Distant Realms', 'Cast Arcane Eye without a slot.', 9],
  devouring: ['Devouring Blade', 'Thirsting Blade gives you three attacks with your pact weapon instead of two.', 12, 'thirsting'],
  witchsight: ['Witch Sight', 'Truesight out to 30 ft.', 15]
};
const INVO_ORDER24 = ['armor', 'agonizing', 'devilsight', 'repelling', 'ptome', 'eldmind', 'spear', 'misty', 'mask', 'leap', 'ascendant', 'gaze', 'shadows', 'myriad', 'grave', 'depths', 'distant', 'witchsight', 'vigor'];
const INV_N24 = [0, 1, 3, 3, 3, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10];
const invoTab = (h) => (is24(h) ? INVOCATIONS24 : INVOCATIONS);
// the pacts a warlock has: one boon in 2014, invocations in 2024
function hasPact(h, k) { return h.cls === 'warlock' && (is24(h) ? (h.invocations || []).includes('p' + k) : h.pact === k && (h.level | 0) >= 3); }
// can this invocation be taken with the warlock's current choices?
function invoOk(h, k, lv) {
  const I = invoTab(h)[k]; if (!I) return false;
  if (I[2] > lv) return false;
  const need = I[3];
  if (!need || need === 'eb') return true;
  if (is24(h)) return need === 'thirsting' ? (h.invocations || []).includes('thirsting') : (h.invocations || []).includes(need);
  return h.pact === need;
}
const EPIC_BOONS = {
  combat: ['Boon of Combat Prowess', 'When you miss with an attack roll, you can hit instead. Once per turn.'],
  dimensional: ['Boon of Dimensional Travel', 'After you take the Attack or Magic action, teleport up to 30 ft to a space you can see.'],
  energy: ['Boon of Energy Resistance', 'Resistance to two damage types (acid, cold, fire, lightning, necrotic, poison, psychic, radiant or thunder); reaction: send damage of those types at another creature.'],
  fate: ['Boon of Fate', 'When a creature within 60 ft fails or succeeds on a d20 test, roll 2d4 and add or subtract it. Once per initiative or rest.'],
  fortitude: ['Boon of Fortitude', 'Your hit point maximum rises by 40. When you regain hit points, add your Con mod once per turn.'],
  irresistible: ['Boon of Irresistible Offense', 'Your bludgeoning, piercing and slashing damage ignores resistance. On a natural 20, add damage equal to the ability you raised.', ['str', 'dex']],
  recovery: ['Boon of Recovery', 'Once per long rest, when you would drop to 0 HP, drop to 1 and regain half your HP maximum. A pool of ten d10s you can spend to heal.'],
  skill: ['Boon of Skill', 'Proficiency in every skill, and expertise in one.'],
  speed: ['Boon of Speed', 'Speed +30 ft, and take Disengage as a bonus action.'],
  recall: ['Boon of Spell Recall', 'Once per long rest, cast a level 1–4 spell you have prepared without spending the slot.', ['int', 'wis', 'cha']],
  night: ['Boon of the Night Spirit', 'Bonus action: become invisible in dim light or darkness; there you resist all damage except psychic and radiant.'],
  truesight: ['Boon of Truesight', 'Truesight out to 60 ft.']
};
const BOON_LV = 19;
// 2024 Circle of the Land
const LANDS24 = ['Arid', 'Polar', 'Temperate', 'Tropical'];
const CIRCLE24 = {
  Arid: [['Blur', 'Burning Hands', 'Fire Bolt'], ['Fireball'], ['Blight'], ['Wall of Stone']],
  Polar: [['Fog Cloud', 'Hold Person', 'Ray of Frost'], ['Sleet Storm'], ['Ice Storm'], ['Cone of Cold']],
  Temperate: [['Misty Step', 'Shocking Grasp', 'Sleep'], ['Lightning Bolt'], ['Freedom of Movement'], ['Tree Stride']],
  Tropical: [['Acid Splash', 'Ray of Sickness', 'Web'], ['Stinking Cloud'], ['Polymorph'], ['Insect Plague']]
};
const SUBCLASSES24 = {
  barbarian: ['Path of the Berserker', 'Path of the Wild Heart', 'Path of the World Tree', 'Path of the Zealot'], bard: ['College of Lore', 'College of Dance', 'College of Glamour', 'College of Valor'],
  cleric: ['Life Domain', 'Light Domain', 'Trickery Domain', 'War Domain'], druid: ['Circle of the Land', 'Circle of the Moon', 'Circle of the Sea', 'Circle of the Stars'],
  fighter: ['Champion', 'Battle Master', 'Eldritch Knight', 'Psi Warrior'], monk: ['Warrior of the Open Hand', 'Warrior of Mercy', 'Warrior of Shadow', 'Warrior of the Elements'],
  paladin: ['Oath of Devotion', 'Oath of Glory', 'Oath of the Ancients', 'Oath of Vengeance'], ranger: ['Hunter', 'Beast Master', 'Fey Wanderer', 'Gloom Stalker'],
  rogue: ['Thief', 'Arcane Trickster', 'Assassin', 'Soulknife'], sorcerer: ['Draconic Sorcery', 'Aberrant Sorcery', 'Clockwork Sorcery', 'Wild Magic Sorcery'],
  warlock: ['Fiend Patron', 'Archfey Patron', 'Celestial Patron', 'Great Old One Patron'], wizard: ['Evoker', 'Abjurer', 'Diviner', 'Illusionist']
};
const subsOf = (h) => (is24(h) ? SUBCLASSES24 : SUBCLASSES)[h.cls] || [CLS(h).sub[1]];
const castOf = (cls, o) => Object.assign({}, CLASSES5[cls].cast, o);
const EB = [19, 'Epic Boon', 'An epic boon feat (chosen in the Class step), which also raises one ability by 1, to a maximum of 30.'];
const C24 = {
  barbarian: { sub: ['Barbarian Subclass', 'Path of the Berserker', 3], asi: ASI24, goldB: 75,
    kit: [[{ l: "Greataxe, four handaxes, explorer's pack and 15 gp", i: ['Greataxe', 'Handaxe x4', "Explorer's pack"], gp: 15 }]],
    feats: [[1, 'Rage', 'Bonus action, not in heavy armour: advantage on Strength checks and saves, extra damage on Strength attacks, resistance to bludgeoning, piercing and slashing. It lasts until the end of your next turn and extends each turn you attack, force a save or use a bonus action to extend it, up to 10 minutes. No spells or Concentration while raging.'],
      [1, 'Unarmored Defense', 'Without armour, your AC is 10 + Dex mod + Con mod (a shield still counts).'],
      [2, 'Danger Sense', 'Advantage on Dexterity saves unless you are incapacitated.'], [2, 'Reckless Attack', 'On your first attack each turn, take advantage on Strength attacks until your next turn; attacks against you have advantage too.'],
      [3, 'Primal Knowledge', 'One more Barbarian skill. While raging, you can make Acrobatics, Intimidation, Perception, Stealth and Survival checks as Strength checks.'],
      [5, 'Extra Attack', 'Attack twice when you take the Attack action.'], [5, 'Fast Movement', '+10 ft speed when not wearing heavy armour.'],
      [7, 'Feral Instinct', 'Advantage on initiative rolls.'], [7, 'Instinctive Pounce', 'When you enter your rage, move up to half your speed.'],
      [9, 'Brutal Strike', 'When you attack recklessly, give up the advantage on one Strength attack: on a hit it deals +1d10 and either pushes the target 15 ft (Forceful Blow) or cuts its speed by 15 ft (Hamstring Blow).'],
      [11, 'Relentless Rage', 'While raging, dropping to 0 HP lets you make a DC 10 Con save (rising by 5 each time) to stand back up with HP equal to twice your barbarian level.'],
      [13, 'Improved Brutal Strike', 'New Brutal Strike options: Staggering Blow (disadvantage on its next save, no opportunity attacks) and Sundering Blow (+5 to the next ally\'s attack on it).'],
      [15, 'Persistent Rage', 'When you roll initiative, regain all your rages (once per long rest). Your rage lasts 10 minutes without needing to be extended.'],
      [17, 'Improved Brutal Strike', 'Brutal Strike deals +2d10 and applies two different effects.'], [18, 'Indomitable Might', 'If a Strength check or save total is less than your Strength score, use the score instead.'],
      EB, [20, 'Primal Champion', 'Strength and Constitution rise by 4, to a maximum of 25.']],
    subFeats: [[3, 'Frenzy', 'While raging, the first time you hit with a reckless Strength attack on your turn, deal extra damage: a number of d6s equal to your Rage damage bonus.'], [6, 'Mindless Rage', 'Immune to charmed and frightened while raging; entering the rage ends them.'],
      [10, 'Retaliation', 'Reaction: when a creature within 5 ft damages you, make a melee attack against it.'], [14, 'Intimidating Presence', 'Bonus action: creatures of your choice in a 30-ft emanation make a Wis save (DC 8 + Str mod + proficiency) or are frightened for 1 minute. Once per long rest, or spend a rage to use it again.']] },
  bard: { sub: ['Bard Subclass', 'College of Lore', 3], weapons: ['simple'], asi: ASI24, goldB: 90,
    cast: castOf('bard', { mode: 'known', known: PREP24.full }),
    kit: [[{ l: "Leather armour, two daggers, an instrument, entertainer's pack and 19 gp", i: ['Leather armour', 'Dagger x2', '@instrument', "Entertainer's pack"], gp: 19 }]],
    feats: [[1, 'Bardic Inspiration', 'Bonus action: give a creature within 60 ft a Bardic Inspiration die (d6, d8 at 5th, d10 at 10th, d12 at 15th) to add to a failed d20 test within the next hour. Uses equal to your Cha mod per long rest.'],
      [1, 'Spellcasting', 'You cast bard spells using Charisma; an instrument is your focus. When you gain a level you can swap one prepared spell.'],
      [2, 'Expertise', 'Expertise in two of your skills (two more at 9th level).'], [2, 'Jack of All Trades', 'Add half your proficiency bonus to ability checks that don\'t already use it.'],
      [5, 'Font of Inspiration', 'Bardic Inspiration also returns on a short rest, and you can spend a spell slot to regain a use.'], [7, 'Countercharm', 'Reaction: when a creature within 30 ft fails a save against charm or fright, let it reroll with advantage.'],
      [10, 'Magical Secrets', 'Your prepared spells can come from the bard, cleric, druid and wizard lists.'], [18, 'Superior Inspiration', 'When you roll initiative, regain Bardic Inspiration up to two uses.'], EB,
      [20, 'Words of Creation', 'Power Word Heal and Power Word Kill are always prepared, and each can target a second creature within 10 ft of the first.']],
    subFeats: [[3, 'Bonus Proficiencies', 'Proficiency in three skills of your choice.'], [3, 'Cutting Words', 'Reaction: when a creature within 60 ft hits, succeeds on a check or deals damage, spend a Bardic Inspiration die to subtract it.'],
      [6, 'Magical Discoveries', 'Learn two spells from the cleric, druid or wizard lists; they are always prepared.'], [14, 'Peerless Skill', 'When you fail an ability check or attack roll, add a Bardic Inspiration die; it is spent only if you then succeed.']] },
  cleric: { sub: ['Cleric Subclass', 'Life Domain', 3], subArmor: null, asi: ASI24, goldB: 110,
    cast: castOf('cleric', { prep: PREP24.full }),
    extra: { 3: ['Aid', 'Bless', 'Cure Wounds', 'Lesser Restoration'], 5: ['Mass Healing Word', 'Revivify'], 7: ['Aura of Life', 'Death Ward'], 9: ['Greater Restoration', 'Mass Cure Wounds'] },
    kit: [[{ l: "Chain shirt, shield, mace, holy symbol, priest's pack and 7 gp", i: ['Chain shirt', 'Shield', 'Mace', 'Holy symbol', "Priest's pack"], gp: 7 }]],
    feats: [[1, 'Spellcasting', 'You prepare cleric spells (see the Spells step) and cast them using Wisdom; a holy symbol is your focus. Change your list after a long rest.'],
      [1, 'Divine Order', 'Protector (martial weapons and heavy armour) or Thaumaturge (one more cantrip, and add your Wis mod to Arcana and Religion checks). Chosen below.'],
      [2, 'Channel Divinity', 'Two uses (three at 6th, four at 18th); one returns on a short rest, all on a long rest. Divine Spark: heal or deal radiant or necrotic damage of 1d8 + Wis mod (2d8 at 7th, 3d8 at 13th, 4d8 at 18th). Turn Undead: undead within 30 ft make a Wis save or are frightened and incapacitated for 1 minute.'],
      [5, 'Sear Undead', 'Turn Undead also deals radiant damage: roll a number of d8s equal to your Wis mod.'],
      [7, 'Blessed Strikes', 'Divine Strike (once per turn, +1d8 necrotic or radiant on a weapon hit, 2d8 at 14th) or Potent Spellcasting (add your Wis mod to cleric cantrip damage). Chosen below.'],
      [10, 'Divine Intervention', 'Once per long rest, cast any cleric spell of 5th level or lower as a Magic action without a slot or components.'], EB,
      [20, 'Greater Divine Intervention', 'Divine Intervention can cast Wish. Afterwards you must wait 2d4 long rests to use Divine Intervention again.']],
    subFeats: [[3, 'Disciple of Life', 'Healing from your level 1+ spells adds 2 + the spell slot\'s level.'], [3, 'Life Domain Spells', 'Aid, Bless, Cure Wounds and Lesser Restoration are always prepared; more at 5th, 7th and 9th.'],
      [3, 'Preserve Life', 'Channel Divinity: share out healing equal to five times your cleric level among bloodied creatures within 30 ft (up to half their maximum).'],
      [6, 'Blessed Healer', 'When a spell you cast with a slot heals another creature, you regain 2 + the slot\'s level.'], [17, 'Supreme Healing', 'Healing dice from your spells and Channel Divinity always roll their highest number.']] },
  druid: { sub: ['Druid Subclass', 'Circle of the Land', 3], armor: ['light', 'shield'], weapons: ['simple'], noMetal: false, asi: ASI24, goldB: 50,
    cast: castOf('druid', { prep: PREP24.full, focus: 'Druidic focus (quarterstaff)' }),
    kit: [[{ l: "Leather armour, shield, sickle, quarterstaff (your druidic focus), explorer's pack, herbalism kit and 9 gp", i: ['Leather armour', 'Shield', 'Sickle', 'Quarterstaff', "Explorer's pack", 'Herbalism kit'], gp: 9 }]],
    feats: [[1, 'Druidic', 'You know Druidic, and Speak with Animals is always prepared.'], [1, 'Spellcasting', 'You prepare druid spells (see the Spells step) and cast them using Wisdom. Change your list after a long rest.'],
      [1, 'Primal Order', 'Magician (one more cantrip, and add your Wis mod to Arcana and Nature checks) or Warden (martial weapons and medium armour). Chosen below.'],
      [2, 'Wild Shape', 'Bonus action: take the shape of a beast form you know, for half your druid level in hours. Two uses (three at 6th, four at 17th); one returns on a short rest. You know four forms (six at 4th, eight at 8th); max CR 1/4, then 1/2 at 4th and 1 at 8th; no flying until 8th. You gain temporary HP equal to your druid level.'],
      [2, 'Wild Companion', 'Spend a spell slot or a Wild Shape use to cast Find Familiar without components; the familiar is fey.'],
      [5, 'Wild Resurgence', 'Once per turn, spend a spell slot for a Wild Shape use; once per long rest, spend a Wild Shape use for a level 1 slot.'],
      [7, 'Elemental Fury', 'Potent Spellcasting (add your Wis mod to druid cantrip damage) or Primal Strike (once per turn, +1d8 cold, fire, lightning or thunder on an attack hit; 2d8 at 15th). Chosen below.'],
      [18, 'Beast Spells', 'Cast spells in Wild Shape, except ones with a costly or consumed material component.'], EB,
      [20, 'Archdruid', 'Regain a Wild Shape use on initiative if you have none; turn slots of Wild Shape into spell slots; you age ten times more slowly.']],
    subFeats: [[3, 'Circle of the Land Spells', 'Your chosen land gives spells that are always prepared (chosen below); more at 5th, 7th and 9th.'],
      [3, "Land's Aid", 'Magic action: spend a Wild Shape use; creatures in a 10-ft sphere within 60 ft make a Con save or take 2d6 necrotic (half on a save), and one creature regains 2d6 HP. 3d6 at 10th, 4d6 at 14th.'],
      [6, 'Natural Recovery', 'Cast one land spell once per long rest without a slot; once per long rest during a short rest, regain slots totalling half your druid level.'],
      [10, "Nature's Ward", 'Immune to poisoned; resistance to the damage type of your land.'], [14, "Nature's Sanctuary", 'Magic action: spend a Wild Shape use to raise a 15-ft cube of spectral trees for 1 minute: half cover, and your allies share your Nature\'s Ward resistance.']] },
  fighter: { sub: ['Fighter Subclass', 'Champion', 3], asi: [4, 6, 8, 12, 14, 16], goldB: 155, skills: [2, ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Persuasion', 'Perception', 'Survival']],
    kit: [[{ l: "Option A: chain mail, greatsword, flail, 8 javelins, dungeoneer's pack and 4 gp", i: ['Chain mail', 'Greatsword', 'Flail', 'Javelin x8', "Dungeoneer's pack"], gp: 4 },
      { l: "Option B: studded leather, scimitar, shortsword, longbow, 20 arrows, quiver, dungeoneer's pack and 11 gp", i: ['Studded leather armour', 'Scimitar', 'Shortsword', 'Longbow', 'Arrows (20)', 'Quiver', "Dungeoneer's pack"], gp: 11 }]],
    feats: [[1, 'Fighting Style', 'A fighting style feat (chosen below).'], [1, 'Second Wind', 'Bonus action: regain 1d10 + fighter level HP. Two uses (three at 4th, four at 10th); one returns on a short rest, all on a long rest.'],
      [2, 'Action Surge', 'Take one more action on your turn (not the Magic action). Once per short rest; twice before a rest from 17th.'], [2, 'Tactical Mind', 'When you fail an ability check, spend a Second Wind use to add 1d10; it isn\'t spent if you still fail.'],
      [5, 'Extra Attack', 'Attack twice when you take the Attack action.'], [5, 'Tactical Shift', 'When you use Second Wind, move up to half your speed without provoking opportunity attacks.'],
      [9, 'Indomitable', 'Reroll a failed save, adding your fighter level. Once per long rest (twice at 13th, three times at 17th).'], [9, 'Tactical Master', 'When you attack with a weapon whose mastery you use, you can swap its mastery for Push, Sap or Slow for that attack.'],
      [11, 'Two Extra Attacks', 'Attack three times when you take the Attack action.'], [13, 'Studied Attacks', 'If you miss a creature, you have advantage on your next attack against it before the end of your next turn.'],
      EB, [20, 'Three Extra Attacks', 'Attack four times when you take the Attack action.']],
    subFeats: [[3, 'Improved Critical', 'Your weapon and unarmed attacks score a critical hit on a 19 or 20.'], [3, 'Remarkable Athlete', 'Advantage on initiative and Athletics checks. After a critical hit, move up to half your speed without provoking opportunity attacks.'],
      [7, 'Additional Fighting Style', 'Gain a second fighting style feat.'], [10, 'Heroic Warrior', 'At the start of each of your turns in combat, gain Heroic Inspiration if you lack it.'],
      [15, 'Superior Critical', 'Your weapon and unarmed attacks score a critical hit on an 18–20.'], [18, 'Survivor', 'Advantage on death saves (a roll of 18–20 counts as a 20). While bloodied, regain 5 + Con mod HP at the start of each turn.']] },
  monk: { sub: ['Monk Subclass', 'Warrior of the Open Hand', 3], weapons: ['simple'].concat(MARTIAL_LIGHT), asi: ASI24, goldB: 50,
    kit: [[{ l: "Spear, five daggers, a tool or instrument, explorer's pack and 11 gp", i: ['Spear', 'Dagger x5', '@instrument', "Explorer's pack"], gp: 11 }]],
    feats: [[1, 'Martial Arts', 'With unarmed strikes and monk weapons (simple melee and Light martial melee): a martial arts die (d6, d8 at 5th, d10 at 11th, d12 at 17th), Dex for attacks, and a bonus-action unarmed strike.'],
      [1, 'Unarmored Defense', 'Without armour or a shield, your AC is 10 + Dex mod + Wis mod.'],
      [2, "Monk's Focus", 'Focus points equal to your monk level, back on a short rest. Flurry of Blows (two bonus unarmed strikes), Patient Defense (Disengage free, or Disengage and Dodge for a point), Step of the Wind (Dash free, or Disengage and Dash with doubled jump for a point).'],
      [2, 'Unarmored Movement', '+10 ft speed without armour or a shield (+15 at 6th, +20 at 10th, +25 at 14th, +30 at 18th).'], [2, 'Uncanny Metabolism', 'When you roll initiative, regain all focus points and heal a martial arts die + monk level. Once per long rest.'],
      [3, 'Deflect Attacks', 'Reaction: reduce bludgeoning, piercing or slashing attack damage by 1d10 + Dex mod + monk level; at 0, spend a point to redirect it.'],
      [4, 'Slow Fall', 'Reaction: reduce falling damage by five times your monk level.'], [5, 'Extra Attack', 'Attack twice when you take the Attack action.'],
      [5, 'Stunning Strike', 'Once per turn on a hit, spend a point: Con save or stunned until your next turn (on a success, speed halved and the next attack has advantage).'],
      [6, 'Empowered Strikes', 'Unarmed strikes can deal force damage.'], [7, 'Evasion', 'Take no damage on a successful Dex save for half, and half on a failure.'],
      [9, 'Acrobatic Movement', 'Move along vertical surfaces and across liquids on your turn.'], [10, 'Heightened Focus', 'Flurry of Blows makes three strikes; Patient Defense and Step of the Wind add temporary HP or carrying an ally.'],
      [10, 'Self-Restoration', 'End charmed, frightened or poisoned on yourself at the end of your turn; no exhaustion from hunger or thirst.'], [13, 'Deflect Energy', 'Deflect Attacks works on any damage type.'],
      [14, 'Disciplined Survivor', 'Proficiency in all saves; spend a point to reroll a failed save.'], [15, 'Perfect Focus', 'When you roll initiative with 3 or fewer points, regain up to 4.'],
      [18, 'Superior Defense', 'Spend 3 points: resistance to all damage except force for 1 minute.'], EB, [20, 'Body and Mind', 'Dexterity and Wisdom rise by 4, to a maximum of 25.']],
    subFeats: [[3, 'Open Hand Technique', 'When Flurry of Blows hits: Addle (no reactions), Push (Str save or pushed 15 ft) or Topple (Dex save or prone).'], [6, 'Wholeness of Body', 'Bonus action: heal a martial arts die + Wis mod. Uses equal to your Wis mod per long rest.'],
      [11, 'Fleet Step', 'After any other bonus action, use Step of the Wind.'], [17, 'Quivering Palm', 'Spend 4 points on a hit to start lethal vibrations; later end them for 10d12 force (Con save for half).']] },
  paladin: { sub: ['Paladin Subclass', 'Oath of Devotion', 3], asi: ASI24, goldB: 150, style: [2, ['defense', 'dueling', 'gwf', 'protection', 'blessed']],
    cast: castOf('paladin', { from: 1, prep: PREP24.half }),
    extra: { 3: ['Protection from Evil and Good', 'Shield of Faith'], 5: ['Aid', 'Zone of Truth'], 9: ['Beacon of Hope', 'Dispel Magic'], 13: ['Freedom of Movement', 'Guardian of Faith'], 17: ['Commune', 'Flame Strike'] },
    kit: [[{ l: "Chain mail, shield, longsword, six javelins, holy symbol, priest's pack and 9 gp", i: ['Chain mail', 'Shield', 'Longsword', 'Javelin x6', 'Holy symbol', "Priest's pack"], gp: 9 }]],
    feats: [[1, 'Lay on Hands', 'Bonus action: touch to restore HP from a pool of five times your paladin level (per long rest), or spend 5 to end the poisoned condition.'],
      [1, 'Spellcasting', 'You prepare paladin spells (see the Spells step) and cast them using Charisma. Swap one after each long rest.'],
      [2, 'Fighting Style', 'A fighting style feat, or Blessed Warrior (two cleric cantrips). Chosen below.'], [2, "Paladin's Smite", 'Divine Smite is always prepared, and you can cast it once per long rest without a slot. On a melee hit: +2d8 radiant, +1d8 per slot level above 1st, +1d8 more against fiends and undead.'],
      [3, 'Channel Divinity', 'Two uses (three at 11th); one returns on a short rest. Divine Sense: for 10 minutes, sense celestials, fiends and undead within 60 ft.'],
      [5, 'Extra Attack', 'Attack twice when you take the Attack action.'], [5, 'Faithful Steed', 'Find Steed is always prepared; cast it once per long rest without a slot.'],
      [6, 'Aura of Protection', 'You and allies in a 10-ft emanation add your Cha mod (min +1) to saving throws (30 ft at 18th).'],
      [9, 'Abjure Foes', 'Channel Divinity: up to your Cha mod creatures within 60 ft make a Wis save or are frightened for 1 minute, taking only one kind of action each turn.'],
      [10, 'Aura of Courage', 'You and allies in your aura can\'t be frightened.'], [11, 'Radiant Strikes', 'Melee weapon and unarmed hits deal +1d8 radiant.'],
      [14, 'Restoring Touch', 'Lay on Hands can also end blinded, charmed, deafened, frightened, paralyzed or stunned (5 points each).'], [18, 'Aura Expansion', 'Your auras reach 30 ft.'], EB],
    subFeats: [[3, 'Oath of Devotion Spells', 'Protection from Evil and Good and Shield of Faith are always prepared; more at 5th, 9th, 13th and 17th.'], [3, 'Sacred Weapon', 'Channel Divinity when you take the Attack action: for 10 minutes add your Cha mod (min +1) to attack rolls; the weapon sheds light and deals radiant if you like.'],
      [7, 'Aura of Devotion', 'You and allies in your aura are immune to charmed; a charm ends when they enter it.'], [15, 'Smite of Protection', 'When you cast Divine Smite, you and allies in your aura have half cover until your next turn.'],
      [20, 'Holy Nimbus', 'Bonus action, once per long rest (or a level 5 slot): for 10 minutes enemies starting their turn in your aura take radiant damage equal to Cha mod + proficiency; you have advantage on saves against fiends and undead.']] },
  ranger: { sub: ['Ranger Subclass', 'Hunter', 3], asi: ASI24, goldB: 150, favored: false, style: [2, ['archery', 'defense', 'dueling', 'twf', 'druidic']],
    cast: castOf('ranger', { from: 1, mode: 'prepared', prep: PREP24.half, known: null, focus: 'Druidic focus (sprig of mistletoe)' }),
    kit: [[{ l: "Studded leather, scimitar, shortsword, longbow, 20 arrows, quiver, sprig of mistletoe, explorer's pack and 7 gp", i: ['Studded leather armour', 'Scimitar', 'Shortsword', 'Longbow', 'Arrows (20)', 'Quiver', 'Druidic focus (sprig of mistletoe)', "Explorer's pack"], gp: 7 }]],
    feats: [[1, 'Spellcasting', 'You prepare ranger spells (see the Spells step) and cast them using Wisdom. Swap one after each long rest.'],
      [1, 'Favored Enemy', "Hunter's Mark is always prepared, and you can cast it without a slot a few times per long rest (2, rising to 6 by 17th)."],
      [2, 'Deft Explorer', 'Expertise in one of your skills, and two languages of your choice.'], [2, 'Fighting Style', 'A fighting style feat, or Druidic Warrior (two druid cantrips). Chosen below.'],
      [5, 'Extra Attack', 'Attack twice when you take the Attack action.'], [6, 'Roving', '+10 ft speed when not in heavy armour, and climb and swim speeds equal to your speed.'],
      [9, 'Expertise', 'Expertise in two more of your skills.'], [10, 'Tireless', 'Magic action: gain 1d8 + Wis mod temporary HP (Wis mod uses per long rest). Short rests lower your exhaustion by 1.'],
      [13, 'Relentless Hunter', "Taking damage can't break your Concentration on Hunter's Mark."], [14, "Nature's Veil", 'Bonus action: become invisible until the end of your next turn. Wis mod uses per long rest.'],
      [17, 'Precise Hunter', "Advantage on attacks against the target of your Hunter's Mark."], [18, 'Feral Senses', 'Blindsight 30 ft.'], EB,
      [20, 'Foe Slayer', "Hunter's Mark deals a d10 instead of a d6."]],
    subFeats: [[3, "Hunter's Lore", "While a creature is marked by your Hunter's Mark, you know its immunities, resistances and vulnerabilities."], [3, "Hunter's Prey", 'Colossus Slayer (once per turn, +1d8 to a creature missing HP) or Horde Breaker (one more attack against a creature next to your target). Swap on a rest.'],
      [7, 'Defensive Tactics', 'Escape the Horde (opportunity attacks against you have disadvantage) or Multiattack Defense (after a creature hits you, its other attacks have disadvantage).'],
      [11, 'Superior Hunter\'s Prey', "Once per turn when you damage the target of your Hunter's Mark, deal the mark's damage to a second creature within 30 ft of it."],
      [15, "Superior Hunter's Defense", 'Reaction when you take damage: resistance to that and further damage of its type until the end of the turn.']] },
  rogue: { sub: ['Rogue Subclass', 'Thief', 3], weapons: ['simple'].concat(MARTIAL_FINLIGHT), asi: [4, 8, 10, 12, 16], goldB: 100,
    skills: [4, ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Persuasion', 'Sleight of Hand', 'Stealth']],
    kit: [[{ l: "Leather armour, two daggers, shortsword, shortbow, 20 arrows, quiver, thieves' tools, burglar's pack and 8 gp", i: ['Leather armour', 'Dagger x2', 'Shortsword', 'Shortbow', 'Arrows (20)', 'Quiver', "Thieves' tools", "Burglar's pack"], gp: 8 }]],
    feats: [[1, 'Expertise', 'Expertise in two of your skills (two more at 6th).'], [1, 'Sneak Attack', 'Once per turn, deal extra damage when you hit with a Finesse or ranged weapon and have advantage, or an ally is next to the target.'],
      [1, "Thieves' Cant", "You know Thieves' Cant and one more language."],
      [2, 'Cunning Action', 'Dash, Disengage or Hide as a bonus action.'], [3, 'Steady Aim', 'Bonus action, if you haven\'t moved: advantage on your next attack this turn; your speed is 0 until the turn ends.'],
      [5, 'Cunning Strike', 'Trade Sneak Attack dice for an effect: Poison (1d6, Con save or poisoned), Trip (1d6, Dex save or prone) or Withdraw (1d6, move half speed freely).'],
      [5, 'Uncanny Dodge', 'Reaction: halve the damage of an attack that hits you.'], [7, 'Evasion', 'Take no damage on a successful Dex save for half, and half on a failure.'],
      [7, 'Reliable Talent', 'Treat a d20 roll of 9 or lower as a 10 on any ability check using a skill or tool you are proficient with.'],
      [11, 'Improved Cunning Strike', 'Use up to two Cunning Strike effects on one hit.'], [14, 'Devious Strikes', 'New Cunning Strikes: Daze (2d6), Knock Out (6d6) and Obscure (3d6).'],
      [15, 'Slippery Mind', 'Proficiency in Wisdom and Charisma saves.'], [18, 'Elusive', 'No attack roll has advantage against you unless you are incapacitated.'], EB,
      [20, 'Stroke of Luck', 'Turn a failed d20 test into a 20. Once per short rest.']],
    subFeats: [[3, 'Fast Hands', 'Cunning Action can also make a Sleight of Hand check, use thieves\' tools, or take the Use an Object action.'], [3, 'Second-Story Work', 'Climb speed equal to your speed; use Dex instead of Str for jump distance.'],
      [9, 'Supreme Sneak', 'New Cunning Strike: Stealth Attack (1d6) keeps you hidden if you were hidden.'], [13, 'Use Magic Device', 'Attune to four magic items, use any spell scroll, and sometimes save charges.'],
      [17, "Thief's Reflexes", 'Take two turns in the first round of combat: one at your initiative and one at initiative minus 10.']] },
  sorcerer: { sub: ['Sorcerer Subclass', 'Draconic Sorcery', 3], weapons: ['simple'], asi: ASI24, goldB: 50, dragon: true,
    cast: castOf('sorcerer', { known: PREP24.sorc }),
    extra: { 3: ['Alter Self', 'Chromatic Orb', 'Command', "Dragon's Breath"], 5: ['Fear', 'Fly'], 7: ['Arcane Eye', 'Charm Monster'], 9: ['Legend Lore', 'Summon Dragon'] },
    kit: [[{ l: "Spear, two daggers, arcane focus (crystal), dungeoneer's pack and 28 gp", i: ['Spear', 'Dagger x2', 'Arcane focus (crystal)', "Dungeoneer's pack"], gp: 28 }]],
    feats: [[1, 'Spellcasting', 'You cast sorcerer spells using Charisma. When you gain a level you can swap one prepared spell.'],
      [1, 'Innate Sorcery', 'Bonus action: for 1 minute your spell save DC rises by 1 and you have advantage on sorcerer spell attacks. Twice per long rest.'],
      [2, 'Font of Magic', 'Sorcery points equal to your sorcerer level, back on a long rest. Turn points into slots (2 for 1st, 3 for 2nd, 5 for 3rd, 6 for 4th, 7 for 5th) or slots into points.'],
      [2, 'Metamagic', 'Two Metamagic options (four at 10th, six at 17th). Swap one when you gain a level.'], [5, 'Sorcerous Restoration', 'On a short rest, regain sorcery points up to half your sorcerer level. Once per long rest.'],
      [7, 'Sorcery Incarnate', 'With no Innate Sorcery uses left, spend 2 points to use it; while it is active, use two Metamagic options on one spell.'], EB,
      [20, 'Arcane Apotheosis', 'While Innate Sorcery is active, one Metamagic option each turn costs no points.']],
    subFeats: [[3, 'Draconic Resilience', 'Your HP maximum rises by 3, then by 1 each sorcerer level. Without armour your AC is 10 + Dex mod + Cha mod.'], [3, 'Draconic Spells', "Alter Self, Chromatic Orb, Command and Dragon's Breath are always prepared; more at 5th, 7th and 9th."],
      [6, 'Elemental Affinity', 'Resistance to your draconic damage type, and add your Cha mod to one damage roll of a sorcerer spell of that type.'],
      [14, 'Dragon Wings', 'Bonus action: fly at 60 ft for 1 hour. Once per long rest, or spend 3 sorcery points.'], [18, 'Dragon Companion', 'Cast Summon Dragon without a material component, and once per long rest without a slot; it can last up to 1 minute without Concentration.']] },
  warlock: { sub: ['Warlock Subclass', 'Fiend Patron', 3], asi: ASI24, goldB: 100, expanded: null,
    cast: castOf('warlock', { known: PREP24.lock }),
    extra: { 3: ['Burning Hands', 'Command', 'Scorching Ray', 'Suggestion'], 5: ['Fireball', 'Stinking Cloud'], 7: ['Fire Shield', 'Wall of Fire'], 9: ['Geas', 'Insect Plague'] },
    kit: [[{ l: "Leather armour, sickle, two daggers, arcane focus (orb), book of occult lore, scholar's pack and 15 gp", i: ['Leather armour', 'Sickle', 'Dagger x2', 'Arcane focus (orb)', 'Book (occult lore)', "Scholar's pack"], gp: 15 }]],
    feats: [[1, 'Eldritch Invocations', 'Fragments of forbidden knowledge, pact boons among them (chosen below). One at 1st, three at 2nd, rising to ten.'],
      [1, 'Pact Magic', 'A few spell slots, all of your highest level; they return on a short rest. Charisma is your ability. Swap one spell when you gain a level.'],
      [2, 'Magical Cunning', 'Once per long rest, a 1-minute rite regains up to half your pact slots (all of them at 20th).'], [9, 'Contact Patron', 'Contact Other Plane is always prepared; once per long rest cast it without a slot and succeed on its save.'],
      [11, 'Mystic Arcanum', 'Cast one level 6 spell once per long rest without a slot (level 7 at 13th, 8 at 15th, 9 at 17th).'], EB,
      [20, 'Eldritch Master', 'Magical Cunning regains all your pact slots.']],
    subFeats: [[3, "Dark One's Blessing", 'When an enemy within 10 ft of you drops to 0 HP, gain temporary HP equal to your Cha mod + warlock level.'], [3, 'Fiend Spells', 'Burning Hands, Command, Scorching Ray and Suggestion are always prepared; more at 5th, 7th and 9th.'],
      [6, "Dark One's Own Luck", 'Add a d10 to an ability check or save. Uses equal to your Cha mod per long rest, once per roll.'], [10, 'Fiendish Resilience', 'After each rest, choose a damage type other than force to resist.'],
      [14, 'Hurl Through Hell', 'Once per turn on an attack hit: Cha save or the target is banished through the lower planes until your next turn, then takes 8d10 psychic. Once per long rest, or spend a pact slot.']] },
  wizard: { sub: ['Wizard Subclass', 'Evoker', 3], weapons: ['simple'], asi: ASI24, goldB: 55, skills: [2, ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Nature', 'Religion']],
    cast: castOf('wizard', { prep: PREP24.wiz }),
    kit: [[{ l: "Two daggers, quarterstaff (your arcane focus), robe, spellbook, scholar's pack and 5 gp", i: ['Dagger x2', 'Quarterstaff', 'Robe', 'Spellbook', "Scholar's pack"], gp: 5 }]],
    feats: [[1, 'Spellcasting', 'Your spellbook holds six level 1 spells, plus two each level. Prepare some of them after a long rest (see the Spells step) and cast using Intelligence.'],
      [1, 'Ritual Adept', 'Cast any ritual in your spellbook as a ritual without preparing it.'], [1, 'Arcane Recovery', 'Once per day on a short rest, recover slots totalling half your wizard level (rounded up), none 6th or higher.'],
      [2, 'Scholar', 'Expertise in one of Arcana, History, Investigation, Medicine, Nature or Religion that you are proficient in.'], [5, 'Memorize Spell', 'On a short rest, swap one prepared spell for another in your book.'],
      [18, 'Spell Mastery', 'Choose a level 1 and a level 2 spell in your book that take an action: cast them at their lowest level without a slot.'], EB,
      [20, 'Signature Spells', 'Two level 3 spells are always prepared; cast each once per short rest without a slot.']],
    subFeats: [[3, 'Evocation Savant', 'Add two evocation spells to your book for free, and one more each time you gain access to a new slot level.'], [3, 'Potent Cantrip', 'When a creature avoids your damage cantrip, it still takes half damage.'],
      [6, 'Sculpt Spells', 'Choose up to 1 + the spell\'s level creatures to succeed automatically on your evocation saves and take no damage.'], [10, 'Empowered Evocation', 'Add your Int mod to one damage roll of a wizard evocation spell.'],
      [14, 'Overchannel', 'Deal maximum damage with a level 1–5 wizard spell. Each further use before a long rest deals necrotic damage to you.']] }
};
const CLS24_CACHE = {};
// the class table for this hero: the 2014 one, or the 2024 one laid over it
function CLS(h) {
  const base = CLASSES5[h && h.cls] || CLASSES5.fighter;
  if (!is24(h)) return base;
  return CLS24_CACHE[h.cls] || (CLS24_CACHE[h.cls] = Object.assign({}, base, C24[h.cls] || {}));
}
// the gold that comes with the 2024 class kit (Option A or B) or the plain gold choice
function kitGp24(h) { const C = CLS(h); let g = 0; (C.kit || []).forEach((grp, i) => { const o = grp[Math.min((h.kit || {})[i] || 0, grp.length - 1)]; g += o.gp || 0; }); return g; }
// expertise count by rules and level
function expN24(h, lv) {
  const c = h.cls;
  let n = c === 'rogue' ? (lv >= 6 ? 4 : 2) : c === 'bard' ? (lv >= 9 ? 4 : lv >= 2 ? 2 : 0) : c === 'ranger' ? (lv >= 9 ? 3 : lv >= 2 ? 1 : 0) : c === 'wizard' ? (lv >= 2 ? 1 : 0) : 0;
  if (lv >= BOON_LV && h.boon === 'skill') n += 1;
  return n;
}
const SCHOLAR = ['Arcana', 'History', 'Investigation', 'Medicine', 'Nature', 'Religion'];
// limited-use features with the 2024 rules
function uses24(h, D, U) {
  const lv = D.lv, srd = D.srd, wis = Math.max(1, D.mod.wis), cha = Math.max(1, D.mod.cha);
  switch (h.cls) {
    case 'barbarian':
      U('rage', 'Rage', [2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6][lv - 1], 'one', 'Rage damage +' + (lv >= 16 ? 4 : lv >= 9 ? 3 : 2));
      if (lv >= 15) U('persist', 'Persistent Rage', 1, 'long', 'regain all rages on initiative');
      if (lv >= 14 && srd) U('presence', 'Intimidating Presence', 1, 'long', 'or spend a rage');
      break;
    case 'bard': U('insp', 'Bardic Inspiration', cha, lv >= 5 ? 'short' : 'long', 'd' + (lv >= 15 ? 12 : lv >= 10 ? 10 : lv >= 5 ? 8 : 6)); break;
    case 'cleric':
      if (lv >= 2) U('channel', 'Channel Divinity', lv >= 18 ? 4 : lv >= 6 ? 3 : 2, 'one', 'Divine Spark ' + (lv >= 18 ? 4 : lv >= 13 ? 3 : lv >= 7 ? 2 : 1) + 'd8+' + D.mod.wis + (srd && lv >= 3 ? '; Preserve Life ' + 5 * lv + ' HP' : ''));
      if (lv >= 10) U('interv', 'Divine Intervention', 1, 'long', lv >= 20 ? 'can cast Wish' : '');
      break;
    case 'druid':
      if (lv >= 2) U('wild', 'Wild Shape', lv >= 17 ? 4 : lv >= 6 ? 3 : 2, 'one', (lv >= 8 ? 8 : lv >= 4 ? 6 : 4) + ' forms, max CR ' + (lv >= 8 ? '1, flying' : lv >= 4 ? '1/2' : '1/4') + ', ' + Math.max(1, Math.floor(lv / 2)) + ' h');
      if (lv >= 5) U('resurge', 'Wild Resurgence (slot)', 1, 'long', 'Wild Shape use into a level 1 slot');
      if (lv >= 6 && srd) U('natrec', 'Natural Recovery', 1, 'long', Math.ceil(lv / 2) + ' slot levels on a short rest');
      if (lv >= 6 && srd) U('landfree', 'Free land spell', 1, 'long');
      break;
    case 'fighter':
      U('second', 'Second Wind', lv >= 10 ? 4 : lv >= 4 ? 3 : 2, 'one', '1d10+' + lv);
      if (lv >= 2) U('surge', 'Action Surge', lv >= 17 ? 2 : 1, 'short');
      if (lv >= 9) U('indom', 'Indomitable', lv >= 17 ? 3 : lv >= 13 ? 2 : 1, 'long', '+' + lv + ' to the reroll');
      break;
    case 'monk':
      if (lv >= 2) { U('ki', 'Focus points', lv, 'short', 'Save DC ' + (8 + D.pb + D.mod.wis)); U('metab', 'Uncanny Metabolism', 1, 'long'); }
      if (lv >= 6 && srd) U('whole', 'Wholeness of Body', wis, 'long', '1' + (lv >= 17 ? 'd12' : lv >= 11 ? 'd10' : lv >= 5 ? 'd8' : 'd6') + '+' + D.mod.wis + ' HP');
      break;
    case 'paladin':
      U('lay', 'Lay on Hands pool', 5 * lv, 'long', 'HP');
      if (lv >= 2) U('smite', "Paladin's Smite (free)", 1, 'long', 'Divine Smite without a slot');
      if (lv >= 3) U('channel', 'Channel Divinity', lv >= 11 ? 3 : 2, 'one', 'Divine Sense' + (srd ? ', Sacred Weapon' : '') + (lv >= 9 ? ', Abjure Foes' : ''));
      if (lv >= 5) U('steed', 'Faithful Steed', 1, 'long');
      if (lv >= 20 && srd) U('nimbus', 'Holy Nimbus', 1, 'long');
      break;
    case 'ranger':
      U('mark', "Hunter's Mark (free)", [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6][lv - 1], 'long');
      if (lv >= 10) U('tireless', 'Tireless', wis, 'long', '1d8+' + D.mod.wis + ' temp HP');
      if (lv >= 14) U('veil', "Nature's Veil", wis, 'long');
      break;
    case 'rogue': D.notes.push('Sneak Attack: ' + Math.ceil(lv / 2) + 'd6 once per turn.'); if (lv >= 20) U('luck', 'Stroke of Luck', 1, 'short'); break;
    case 'sorcerer':
      U('innate', 'Innate Sorcery', 2, 'long');
      if (lv >= 2) U('sorc', 'Sorcery points', lv, 'long');
      if (lv >= 5) U('restore', 'Sorcerous Restoration', 1, 'long', Math.floor(lv / 2) + ' points on a short rest');
      if (lv >= 14 && srd) U('wings', 'Dragon Wings', 1, 'long', 'or 3 sorcery points');
      if (lv >= 18 && srd) U('dragon', 'Dragon Companion', 1, 'long', 'Summon Dragon without a slot');
      break;
    case 'warlock':
      if (lv >= 2) U('cunning', 'Magical Cunning', 1, 'long', lv >= 20 ? 'all pact slots' : 'half your pact slots');
      if (lv >= 9) U('patron', 'Contact Patron', 1, 'long');
      if (lv >= 6 && srd) U('ownluck', "Dark One's Own Luck", cha, 'long', '+d10');
      if (lv >= 14 && srd) U('hurl', 'Hurl Through Hell', 1, 'long', '8d10 psychic');
      [[11, 6], [13, 7], [15, 8], [17, 9]].forEach(([at, sl]) => { if (lv >= at) U('arc' + sl, 'Mystic Arcanum (' + ordinal(sl) + ')', 1, 'long', h.arcanum[sl] || 'choose a spell'); });
      break;
    case 'wizard': U('arcrec', 'Arcane Recovery', 1, 'long', Math.ceil(lv / 2) + ' slot levels'); if (lv >= 20) U('sig', 'Signature Spells', 2, 'short'); break;
  }
  if (lv >= BOON_LV) { if (h.boon === 'recovery') U('laststand', 'Last Stand', 1, 'long'); if (h.boon === 'recall') U('recall', 'Spell Recall', 1, 'long'); if (h.boon === 'fate') U('fate', 'Boon of Fate', 1, 'short'); }
}
// choices to make that only the 2024 rules have
function todo24(h, D, T) {
  const lv = D.lv;
  if ((h.cls === 'cleric' || h.cls === 'druid') && !h.order) T('class', h.cls === 'cleric' ? 'Choose your Divine Order.' : 'Choose your Primal Order.');
  if ((h.cls === 'cleric' || h.cls === 'druid') && lv >= 7 && !h.strike7) T('class', h.cls === 'cleric' ? 'Choose Divine Strike or Potent Spellcasting.' : 'Choose Primal Strike or Potent Spellcasting.');
  if (lv >= BOON_LV && !EPIC_BOONS[h.boon]) T('class', 'Choose your epic boon.');
  if (lv >= BOON_LV && EPIC_BOONS[h.boon] && !boonAb(h)) T('class', 'Choose the ability your epic boon raises.');
}
const boonAbs = (k) => (EPIC_BOONS[k] && EPIC_BOONS[k][2]) || ABIL;
const boonAb = (h) => (EPIC_BOONS[h.boon] && boonAbs(h.boon).includes(h.boonAb) ? h.boonAb : '');
// the 2024-only pieces of the Class step
function class24Html(h, D) {
  const lv = D.lv, opt = (act, k, n, d, on) => '<button type="button" class="opt' + (on ? ' on' : '') + '" data-hr="' + act + '" data-v="' + k + '"><b>' + n + '</b><small>' + d + '</small></button>';
  let o = '';
  if (h.cls === 'cleric') o += '<section><h3>Divine Order</h3><div class="opts">' + opt('order', 'protector', 'Protector', 'Martial weapons and heavy armour.', h.order === 'protector') + opt('order', 'thaumaturge', 'Thaumaturge', 'One more cantrip; add your Wis mod to Arcana and Religion checks.', h.order === 'thaumaturge') + '</div></section>';
  if (h.cls === 'druid') o += '<section><h3>Primal Order</h3><div class="opts">' + opt('order', 'magician', 'Magician', 'One more cantrip; add your Wis mod to Arcana and Nature checks.', h.order === 'magician') + opt('order', 'warden', 'Warden', 'Martial weapons and medium armour.', h.order === 'warden') + '</div></section>';
  if (h.cls === 'cleric' && lv >= 7) o += '<section><h3>Blessed Strikes</h3><div class="opts">' + opt('strike7', 'strike', 'Divine Strike', 'Once per turn, +' + (lv >= 14 ? 2 : 1) + 'd8 necrotic or radiant on a weapon hit.', h.strike7 === 'strike') + opt('strike7', 'potent', 'Potent Spellcasting', 'Add your Wis mod to cleric cantrip damage.', h.strike7 === 'potent') + '</div></section>';
  if (h.cls === 'druid' && lv >= 7) o += '<section><h3>Elemental Fury</h3><div class="opts">' + opt('strike7', 'strike', 'Primal Strike', 'Once per turn, +' + (lv >= 15 ? 2 : 1) + 'd8 cold, fire, lightning or thunder on an attack hit.', h.strike7 === 'strike') + opt('strike7', 'potent', 'Potent Spellcasting', 'Add your Wis mod to druid cantrip damage.', h.strike7 === 'potent') + '</div></section>';
  if (h.cls === 'druid' && D.srd) o += fieldSel('hc-land24', 'Circle of the Land: your land', LANDS24.map((t) => [t, t]), LANDS24.includes(h.land24) ? h.land24 : 'Temperate');
  if (lv >= BOON_LV) {
    o += '<section><h3>Epic boon <small class="meta">level 19</small></h3><div class="opts">' + Object.keys(EPIC_BOONS).map((k) => opt('boon', k, EPIC_BOONS[k][0], EPIC_BOONS[k][1], h.boon === k)).join('') + '</div>';
    if (EPIC_BOONS[h.boon]) o += fieldSel('hc-boonab', 'Raise one ability by 1 (up to 30)', [['', 'Choose…']].concat(boonAbs(h.boon).map((a) => [a, ABIL_N[a]])), boonAb(h));
    o += '</section>';
  }
  return o;
}
