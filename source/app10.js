
// ================================================================ character rules (System Reference Document 5.1, CC-BY-4.0, summarised)
const ABIL = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABIL_N = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };
const ABIL_S = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
const SKILLS = [['Acrobatics', 'dex'], ['Animal Handling', 'wis'], ['Arcana', 'int'], ['Athletics', 'str'], ['Deception', 'cha'], ['History', 'int'], ['Insight', 'wis'], ['Intimidation', 'cha'], ['Investigation', 'int'], ['Medicine', 'wis'], ['Nature', 'int'], ['Perception', 'wis'], ['Performance', 'cha'], ['Persuasion', 'cha'], ['Religion', 'int'], ['Sleight of Hand', 'dex'], ['Stealth', 'dex'], ['Survival', 'wis']];
const SKILL_AB = Object.fromEntries(SKILLS);
const ALL_SKILLS = SKILLS.map((s) => s[0]);
const LANGS = ['Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Orc', 'Abyssal', 'Celestial', 'Draconic', 'Deep Speech', 'Infernal', 'Primordial', 'Sylvan', 'Undercommon'];
const ALIGN = ['Lawful good', 'Neutral good', 'Chaotic good', 'Lawful neutral', 'Neutral', 'Chaotic neutral', 'Lawful evil', 'Neutral evil', 'Chaotic evil'];
const STD_ARRAY = [15, 14, 13, 12, 10, 8];
const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const XP_LEVEL = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
const profBonus = (lv) => 2 + Math.floor((lv - 1) / 4);
const modOf = (v) => Math.floor((v - 10) / 2);
const sgn = (n) => (n >= 0 ? '+' : '−') + Math.abs(n);


// ---------------------------------------------------------------- AideDD references for anything outside the free SRD
const aidSlug = (n) => String(n).toLowerCase().replace(/['’()]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const AID = {
  monster: (n) => 'https://www.aidedd.org/dnd/monstres.php?vo=' + aidSlug(n),
  spell: (n) => 'https://www.aidedd.org/dnd/sorts.php?vo=' + aidSlug(n),
  item: (n) => 'https://www.aidedd.org/dnd/om.php?vo=' + ({ '+1 Weapon': 'weapon-1-2-or-3', '+2 Weapon': 'weapon-1-2-or-3', '+3 Weapon': 'weapon-1-2-or-3', 'Spell scroll (1st level)': 'spell-scroll', 'Potion of Greater Healing': 'potion-of-healing', 'Potion of Superior Healing': 'potion-of-healing', 'Potion of Supreme Healing': 'potion-of-healing' }[n] || aidSlug(n)),
  cls: (k) => 'https://www.aidedd.org/en/rules/classes/' + k + '/',
  race: (k) => 'https://www.aidedd.org/en/rules/races/' + ({ halfelf: 'half-elf', halforc: 'half-orc' }[k] || k) + '/',
  bg: (k) => 'https://www.aidedd.org/en/rules/background/' + ({ acolyte: 'acolyte/', criminal: 'criminal/', folkhero: 'folk-hero/', noble: 'noble/', sage: 'sage/', soldier: 'soldier/' }[k] || ''),
  cond: 'https://www.aidedd.org/en/rules/conditions/',
  monsters: 'https://www.aidedd.org/dnd-filters/monsters.php', spells: 'https://www.aidedd.org/dnd-filters/spells-5e.php', feats: 'https://www.aidedd.org/dnd-filters/feats.php', invocations: 'https://www.aidedd.org/dnd-filters/eldritch-invocations.php'
};
const extLink = (url, txt) => '<a class="ext" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(txt) + '<span aria-hidden="true"> ↗</span><span class="vh"> (opens AideDD in a new tab)</span></a>';
// Player's Handbook subclasses beyond the SRD one: chosen by name, with their full text on AideDD
const SUBCLASSES = {
  barbarian: ['Path of the Berserker', 'Path of the Totem Warrior'], bard: ['College of Lore', 'College of Valor'],
  cleric: ['Life Domain', 'Knowledge Domain', 'Light Domain', 'Nature Domain', 'Tempest Domain', 'Trickery Domain', 'War Domain'],
  druid: ['Circle of the Land', 'Circle of the Moon'], fighter: ['Champion', 'Battle Master', 'Eldritch Knight'],
  monk: ['Way of the Open Hand', 'Way of Shadow', 'Way of the Four Elements'], paladin: ['Oath of Devotion', 'Oath of the Ancients', 'Oath of Vengeance'],
  ranger: ['Hunter', 'Beast Master'], rogue: ['Thief', 'Assassin', 'Arcane Trickster'], sorcerer: ['Draconic Bloodline', 'Wild Magic'],
  warlock: ['The Fiend', 'The Archfey', 'The Great Old One'], wizard: ['School of Evocation', 'School of Abjuration', 'School of Conjuration', 'School of Divination', 'School of Enchantment', 'School of Illusion', 'School of Necromancy', 'School of Transmutation']
};

// ---------------------------------------------------------------- races
const DRAGONS = {
  black: ['Black', 'acid', '5 by 30 ft line', 'dex'], blue: ['Blue', 'lightning', '5 by 30 ft line', 'dex'], brass: ['Brass', 'fire', '5 by 30 ft line', 'dex'],
  bronze: ['Bronze', 'lightning', '5 by 30 ft line', 'dex'], copper: ['Copper', 'acid', '5 by 30 ft line', 'dex'], gold: ['Gold', 'fire', '15 ft cone', 'dex'],
  green: ['Green', 'poison', '15 ft cone', 'con'], red: ['Red', 'fire', '15 ft cone', 'dex'], silver: ['Silver', 'cold', '15 ft cone', 'con'], white: ['White', 'cold', '15 ft cone', 'con']
};
const RACES5 = {
  dwarf: { name: 'Dwarf', asi: { con: 2 }, speed: 25, size: 'Medium', dark: 60, langs: ['Common', 'Dwarvish'], age: [40, 250], weapons: ['Battleaxe', 'Handaxe', 'Light hammer', 'Warhammer'],
    toolChoice: ["Smith's tools", "Brewer's supplies", "Mason's tools"], blurb: 'Stout, stubborn folk of mountain halls, known for craft, memory and grudges.',
    traits: [['Darkvision', 'See in dim light within 60 ft as if bright, and in darkness as if dim (no colour).'], ['Dwarven Resilience', 'Advantage on saves against poison, and resistance to poison damage.'], ['Dwarven Combat Training', 'Proficient with battleaxe, handaxe, light hammer and warhammer.'], ['Stonecunning', 'Double proficiency bonus on History checks about stonework.'], ['Heavy-footed', 'Your speed is not reduced by heavy armour.']],
    subs: { hill: { name: 'Hill dwarf', asi: { wis: 1 }, hpLv: 1, traits: [['Dwarven Toughness', 'Your hit point maximum rises by 1 for every level.']] },
      mountain: { name: 'Mountain dwarf', phb: true, asi: { str: 2 }, armor: ['light', 'medium'], traits: [['Dwarven Armor Training', 'Proficient with light and medium armour.']] } } },
  elf: { name: 'Elf', asi: { dex: 2 }, speed: 30, size: 'Medium', dark: 60, langs: ['Common', 'Elvish'], age: [100, 600], skills: ['Perception'], blurb: 'Graceful, long-lived people of forests and old cities, at home with magic.',
    traits: [['Darkvision', 'See in dim light within 60 ft as if bright, and in darkness as if dim.'], ['Keen Senses', 'Proficient in Perception.'], ['Fey Ancestry', 'Advantage on saves against being charmed; magic can\'t put you to sleep.'], ['Trance', 'Four hours of meditation gives you the benefit of a long rest\'s sleep.']],
    subs: { high: { name: 'High elf', asi: { int: 1 }, weapons: ['Longsword', 'Shortsword', 'Shortbow', 'Longbow'], cantrip: 'w', extraLang: 1, traits: [['Elf Weapon Training', 'Proficient with longsword, shortsword, shortbow and longbow.'], ['Cantrip', 'You know one wizard cantrip; Intelligence is your spellcasting ability for it.'], ['Extra Language', 'You speak one extra language of your choice.']] },
      wood: { name: 'Wood elf', phb: true, asi: { wis: 1 }, speed: 35, weapons: ['Longsword', 'Shortsword', 'Shortbow', 'Longbow'], traits: [['Elf Weapon Training', 'Proficient with longsword, shortsword, shortbow and longbow.'], ['Fleet of Foot', 'Your base walking speed is 35 ft.'], ['Mask of the Wild', 'You can try to hide when only lightly obscured by foliage, rain, snow, mist or similar.']] },
      drow: { name: 'Dark elf (drow)', phb: true, asi: { cha: 1 }, dark: 120, weapons: ['Rapier', 'Shortsword', 'Hand crossbow'], traits: [['Superior Darkvision', 'Darkvision out to 120 ft.'], ['Sunlight Sensitivity', 'Disadvantage on attack rolls and sight-based Perception checks in direct sunlight.'], ['Drow Magic', 'You know dancing lights. At 3rd level cast faerie fire, and at 5th level darkness, each once per long rest. Charisma is your spellcasting ability.'], ['Drow Weapon Training', 'Proficient with rapiers, shortswords and hand crossbows.']] } } },
  halfling: { name: 'Halfling', asi: { dex: 2 }, speed: 25, size: 'Small', dark: 0, langs: ['Common', 'Halfling'], age: [20, 150], blurb: 'Small, cheerful and hard to frighten; they love home but often wander.',
    traits: [['Lucky', 'When you roll a 1 on an attack, check or save, reroll it and use the new roll.'], ['Brave', 'Advantage on saves against being frightened.'], ['Halfling Nimbleness', 'You can move through the space of any creature larger than you.']],
    subs: { lightfoot: { name: 'Lightfoot halfling', asi: { cha: 1 }, traits: [['Naturally Stealthy', 'You can try to hide behind a creature at least one size larger than you.']] },
      stout: { name: 'Stout halfling', phb: true, asi: { con: 1 }, traits: [['Stout Resilience', 'Advantage on saves against poison, and resistance to poison damage.']] } } },
  human: { name: 'Human', asi: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, speed: 30, size: 'Medium', dark: 0, langs: ['Common'], extraLang: 1, age: [18, 80], blurb: 'Ambitious, adaptable and everywhere. The most common folk of the realms.',
    traits: [['Versatile', '+1 to every ability score.'], ['Extra Language', 'You speak one extra language of your choice.']] },
  dragonborn: { name: 'Dragonborn', asi: { str: 2, cha: 1 }, speed: 30, size: 'Medium', dark: 0, langs: ['Common', 'Draconic'], age: [15, 80], dragon: true, blurb: 'Proud, scaled descendants of dragons who breathe their ancestor\'s element.',
    traits: [['Draconic Ancestry', 'Your dragon ancestor sets the damage type of your breath and your resistance.'], ['Breath Weapon', 'Action: exhale in an area; each creature makes a save (DC 8 + Con mod + proficiency) for 2d6 damage, half on a success. Damage rises to 3d6 at 6th level, 4d6 at 11th, 5d6 at 16th. Once per short or long rest.'], ['Damage Resistance', 'Resistance to your ancestry\'s damage type.']] },
  gnome: { name: 'Gnome', asi: { int: 2 }, speed: 25, size: 'Small', dark: 60, langs: ['Common', 'Gnomish'], age: [40, 400], blurb: 'Small, curious inventors and tricksters with an endless zest for life.',
    traits: [['Darkvision', 'See in dim light within 60 ft as if bright, and in darkness as if dim.'], ['Gnome Cunning', 'Advantage on Intelligence, Wisdom and Charisma saves against magic.']],
    subs: { rock: { name: 'Rock gnome', asi: { con: 1 }, tools: ["Tinker's tools"], traits: [["Artificer's Lore", 'Double proficiency bonus on History checks about magic items, alchemy and technology.'], ['Tinker', 'Proficient with tinker\'s tools; build tiny clockwork toys, fire starters and music boxes.']] },
      forest: { name: 'Forest gnome', phb: true, asi: { dex: 1 }, traits: [['Natural Illusionist', 'You know the minor illusion cantrip; Intelligence is your spellcasting ability for it.'], ['Speak with Small Beasts', 'Communicate simple ideas with Small or smaller beasts.']] } } },
  halfelf: { name: 'Half-elf', asi: { cha: 2 }, asiPick: 2, speed: 30, size: 'Medium', dark: 60, langs: ['Common', 'Elvish'], extraLang: 1, skillPick: 2, age: [20, 180], blurb: 'Walkers in two worlds, charming and adaptable, at home everywhere and nowhere.',
    traits: [['Darkvision', 'See in dim light within 60 ft as if bright, and in darkness as if dim.'], ['Fey Ancestry', 'Advantage on saves against being charmed; magic can\'t put you to sleep.'], ['Skill Versatility', 'Proficient in two skills of your choice.'], ['Ability Boost', '+1 to two ability scores other than Charisma.']] },
  halforc: { name: 'Half-orc', asi: { str: 2, con: 1 }, speed: 30, size: 'Medium', dark: 60, langs: ['Common', 'Orc'], skills: ['Intimidation'], age: [14, 75], blurb: 'Strong and fierce, often outcasts who prove themselves through deeds.',
    traits: [['Darkvision', 'See in dim light within 60 ft as if bright, and in darkness as if dim.'], ['Menacing', 'Proficient in Intimidation.'], ['Relentless Endurance', 'When reduced to 0 HP but not killed outright, drop to 1 HP instead. Once per long rest.'], ['Savage Attacks', 'On a melee weapon critical hit, roll one of the weapon\'s damage dice once more and add it.']] },
  tiefling: { name: 'Tiefling', asi: { cha: 2, int: 1 }, speed: 30, size: 'Medium', dark: 60, langs: ['Common', 'Infernal'], age: [18, 90], blurb: 'Marked by an infernal bloodline with horns and tails, and often mistrusted.',
    traits: [['Darkvision', 'See in dim light within 60 ft as if bright, and in darkness as if dim.'], ['Hellish Resistance', 'Resistance to fire damage.'], ['Infernal Legacy', 'You know thaumaturgy. At 3rd level cast hellish rebuke as a 2nd-level spell, and at 5th level darkness, each once per long rest. Charisma is your spellcasting ability.']] }
};

// ---------------------------------------------------------------- backgrounds (Acolyte is from the SRD; the rest list skills, tools and gear only)
const BGS = {
  acolyte: { name: 'Acolyte', skills: ['Insight', 'Religion'], langs: 2, gold: 15, org: 'temple', gear: ['Holy symbol', 'Prayer book', 'Incense (5 sticks)', 'Vestments', 'Common clothes'], feat: ['Shelter of the Faithful', 'You and your companions can expect free healing and care at temples of your faith, and the priests will support you within reason.'], blurb: 'You served in a temple, performing rites and learning the faith.' },
  criminal: { name: 'Criminal', skills: ['Deception', 'Stealth'], tools: ["Thieves' tools", 'Gaming set'], gold: 15, org: 'thieves', gear: ['Crowbar', 'Common clothes (dark, hooded)'], blurb: 'You lived outside the law and still know people who do.' },
  entertainer: { name: 'Entertainer', skills: ['Acrobatics', 'Performance'], tools: ['Disguise kit', 'Musical instrument'], gold: 15, org: 'merchants', gear: ['Musical instrument', 'Costume', 'An admirer\'s keepsake'], blurb: 'You earned your keep on stages and street corners.' },
  folkhero: { name: 'Folk hero', skills: ['Animal Handling', 'Survival'], tools: ["Artisan's tools", 'Vehicles (land)'], gold: 10, org: null, gear: ["Artisan's tools", 'Shovel', 'Iron pot', 'Common clothes'], blurb: 'Common folk remember the day you stood up for them.' },
  artisan: { name: 'Guild artisan', skills: ['Insight', 'Persuasion'], tools: ["Artisan's tools"], langs: 1, gold: 15, org: 'crafts', gear: ["Artisan's tools", 'Letter from your guild', "Traveller's clothes"], blurb: 'A trained crafter with a guild behind you.' },
  hermit: { name: 'Hermit', skills: ['Medicine', 'Religion'], tools: ['Herbalism kit'], langs: 1, gold: 5, org: null, gear: ['Scroll case of notes', 'Winter blanket', 'Common clothes', 'Herbalism kit'], blurb: 'You lived apart for years, and found something in the quiet.' },
  noble: { name: 'Noble', skills: ['History', 'Persuasion'], tools: ['Gaming set'], langs: 1, gold: 25, org: 'rulers', gear: ['Fine clothes', 'Signet ring', 'Scroll of pedigree'], blurb: 'You were born to a family of rank, with privileges and duties.' },
  outlander: { name: 'Outlander', skills: ['Athletics', 'Survival'], tools: ['Musical instrument'], langs: 1, gold: 10, org: null, gear: ['Staff', 'Hunting trap', 'Animal trophy', "Traveller's clothes"], blurb: 'You grew up in the wilds, far from towns and their laws.' },
  sage: { name: 'Sage', skills: ['Arcana', 'History'], langs: 2, gold: 10, org: 'mages', gear: ['Bottle of ink', 'Quill', 'Small knife', 'Letter with an unanswered question', 'Common clothes'], blurb: 'Years of study have filled your head with lore.' },
  sailor: { name: 'Sailor', skills: ['Athletics', 'Perception'], tools: ["Navigator's tools", 'Vehicles (water)'], gold: 10, org: 'merchants', gear: ['Belaying pin (club)', 'Silk rope (50 ft)', 'Lucky charm', 'Common clothes'], blurb: 'You worked the decks of a ship through storm and calm.' },
  soldier: { name: 'Soldier', skills: ['Athletics', 'Intimidation'], tools: ['Gaming set', 'Vehicles (land)'], gold: 10, org: 'watch', gear: ['Insignia of rank', 'Trophy from a fallen enemy', 'Dice set', 'Common clothes'], blurb: 'You served in an army or a town watch.' },
  urchin: { name: 'Urchin', skills: ['Sleight of Hand', 'Stealth'], tools: ['Disguise kit', "Thieves' tools"], gold: 10, org: 'thieves', gear: ['Small knife', 'Map of your home town', 'Pet mouse', 'Token from your parents', 'Common clothes'], blurb: 'You grew up alone on the streets and learned to survive.' },
  custom: { name: 'Custom', skills: [], pick: 2, langs: 1, gold: 10, org: null, gear: ['Common clothes'], blurb: 'Make your own: choose any two skills and one language.' }
};

// ---------------------------------------------------------------- equipment
// [name, category, cost gp, damage, type, weight, properties, range]
const WEAPONS = [
  ['Club', 'simple melee', 0.1, '1d4', 'bludgeoning', 2, 'light'], ['Dagger', 'simple melee', 2, '1d4', 'piercing', 1, 'finesse light thrown', '20/60'],
  ['Greatclub', 'simple melee', 0.2, '1d8', 'bludgeoning', 10, 'two-handed'], ['Handaxe', 'simple melee', 5, '1d6', 'slashing', 2, 'light thrown', '20/60'],
  ['Javelin', 'simple melee', 0.5, '1d6', 'piercing', 2, 'thrown', '30/120'], ['Light hammer', 'simple melee', 2, '1d4', 'bludgeoning', 2, 'light thrown', '20/60'],
  ['Mace', 'simple melee', 5, '1d6', 'bludgeoning', 4, ''], ['Quarterstaff', 'simple melee', 0.2, '1d6', 'bludgeoning', 4, 'versatile:1d8'],
  ['Sickle', 'simple melee', 1, '1d4', 'slashing', 2, 'light'], ['Spear', 'simple melee', 1, '1d6', 'piercing', 3, 'thrown versatile:1d8', '20/60'],
  ['Light crossbow', 'simple ranged', 25, '1d8', 'piercing', 5, 'ammunition loading two-handed', '80/320'], ['Dart', 'simple ranged', 0.05, '1d4', 'piercing', 0.25, 'finesse thrown', '20/60'],
  ['Shortbow', 'simple ranged', 25, '1d6', 'piercing', 2, 'ammunition two-handed', '80/320'], ['Sling', 'simple ranged', 0.1, '1d4', 'bludgeoning', 0, 'ammunition', '30/120'],
  ['Battleaxe', 'martial melee', 10, '1d8', 'slashing', 4, 'versatile:1d10'], ['Flail', 'martial melee', 10, '1d8', 'bludgeoning', 2, ''],
  ['Glaive', 'martial melee', 20, '1d10', 'slashing', 6, 'heavy reach two-handed'], ['Greataxe', 'martial melee', 30, '1d12', 'slashing', 7, 'heavy two-handed'],
  ['Greatsword', 'martial melee', 50, '2d6', 'slashing', 6, 'heavy two-handed'], ['Halberd', 'martial melee', 20, '1d10', 'slashing', 6, 'heavy reach two-handed'],
  ['Lance', 'martial melee', 10, '1d12', 'piercing', 6, 'reach special'], ['Longsword', 'martial melee', 15, '1d8', 'slashing', 3, 'versatile:1d10'],
  ['Maul', 'martial melee', 10, '2d6', 'bludgeoning', 10, 'heavy two-handed'], ['Morningstar', 'martial melee', 15, '1d8', 'piercing', 4, ''],
  ['Pike', 'martial melee', 5, '1d10', 'piercing', 18, 'heavy reach two-handed'], ['Rapier', 'martial melee', 25, '1d8', 'piercing', 2, 'finesse'],
  ['Scimitar', 'martial melee', 25, '1d6', 'slashing', 3, 'finesse light'], ['Shortsword', 'martial melee', 10, '1d6', 'piercing', 2, 'finesse light'],
  ['Trident', 'martial melee', 5, '1d6', 'piercing', 4, 'thrown versatile:1d8', '20/60'], ['War pick', 'martial melee', 5, '1d8', 'piercing', 2, ''],
  ['Warhammer', 'martial melee', 15, '1d8', 'bludgeoning', 2, 'versatile:1d10'], ['Whip', 'martial melee', 2, '1d4', 'slashing', 3, 'finesse reach'],
  ['Blowgun', 'martial ranged', 10, '1', 'piercing', 1, 'ammunition loading', '25/100'], ['Hand crossbow', 'martial ranged', 75, '1d6', 'piercing', 3, 'ammunition light loading', '30/120'],
  ['Heavy crossbow', 'martial ranged', 50, '1d10', 'piercing', 18, 'ammunition heavy loading two-handed', '100/400'], ['Longbow', 'martial ranged', 50, '1d8', 'piercing', 2, 'ammunition heavy two-handed', '150/600'],
  ['Net', 'martial ranged', 1, '—', '', 3, 'special thrown', '5/15']
].map(([name, cat, cost, dmg, type, wt, props, range]) => ({ name, cat, cost, dmg, type, wt, props: props ? props.split(' ') : [], range: range || '', kind: 'weapon' }));
// [name, type, cost, base AC, dex cap, str req, stealth disadvantage, weight]
const ARMORS = [
  ['Padded armour', 'light', 5, 11, 99, 0, 1, 8], ['Leather armour', 'light', 10, 11, 99, 0, 0, 10], ['Studded leather armour', 'light', 45, 12, 99, 0, 0, 13],
  ['Hide armour', 'medium', 10, 12, 2, 0, 0, 12], ['Chain shirt', 'medium', 50, 13, 2, 0, 0, 20], ['Scale mail', 'medium', 50, 14, 2, 0, 1, 45], ['Breastplate', 'medium', 400, 14, 2, 0, 0, 20], ['Half plate', 'medium', 750, 15, 2, 0, 1, 40],
  ['Ring mail', 'heavy', 30, 14, 0, 0, 1, 40], ['Chain mail', 'heavy', 75, 16, 0, 13, 1, 55], ['Splint armour', 'heavy', 200, 17, 0, 15, 1, 60], ['Plate armour', 'heavy', 1500, 18, 0, 15, 1, 65],
  ['Shield', 'shield', 10, 2, 0, 0, 0, 6]
].map(([name, type, cost, ac, cap, str, stealth, wt]) => ({ name, type, cost, ac, cap, str, stealth: !!stealth, wt, kind: 'armor' }));
// adventuring gear: [name, cost gp, weight, note]
const GEAR = [
  ['Backpack', 2, 5], ['Bedroll', 1, 7], ['Blanket', 0.5, 3], ['Candle', 0.01, 0], ['Chalk (1 piece)', 0.01, 0], ['Climber\'s kit', 25, 12, 'Anchor yourself; you can\'t fall more than 25 ft from the anchor.'],
  ['Crowbar', 2, 5, 'Advantage on Strength checks where leverage helps.'], ['Grappling hook', 2, 4], ['Hammer', 1, 3], ['Healer\'s kit', 5, 3, '10 uses: stabilise a dying creature without a Medicine check.'],
  ['Holy symbol', 5, 1, 'A divine spellcasting focus.'], ['Hunting trap', 5, 25, 'DC 13 Strength save or 1d4 piercing and stuck.'], ['Lantern, hooded', 5, 2, 'Bright light 30 ft, dim 30 ft more; burns 6 hours per flask of oil.'],
  ['Lock', 10, 1], ['Manacles', 2, 6], ['Mirror, steel', 5, 0.5], ['Oil (flask)', 0.1, 1, 'Throw to coat; set alight for 5 fire damage.'], ['Piton', 0.05, 0.25],
  ['Potion of Healing', 50, 0.5, 'Drink to regain 2d4 + 2 hit points.'], ['Rations (1 day)', 0.5, 2], ['Rope, hempen (50 ft)', 1, 10], ['Rope, silk (50 ft)', 10, 5],
  ['Spellbook', 50, 3, 'Holds the wizard spells you have learned.'], ['Component pouch', 25, 2, 'Holds material components; works as a focus.'], ['Arcane focus (crystal)', 10, 1, 'An arcane spellcasting focus.'], ['Druidic focus (yew wand)', 10, 1, 'A druidic spellcasting focus.'],
  ['Tent, two-person', 2, 20], ['Tinderbox', 0.5, 1], ['Torch', 0.01, 1, 'Burns 1 hour: bright light 20 ft, dim 20 ft more.'], ['Waterskin', 0.2, 5],
  ['Arrows (20)', 1, 1], ['Crossbow bolts (20)', 1, 1.5], ['Sling bullets (20)', 0.04, 1.5], ['Blowgun needles (50)', 1, 1],
  ['Thieves\' tools', 25, 1, 'Pick locks and disarm traps.'], ['Herbalism kit', 5, 3], ['Disguise kit', 25, 3], ['Lute', 35, 2], ['Flute', 2, 1], ['Drum', 6, 3],
  ['Antitoxin (vial)', 50, 0, 'Advantage on saves against poison for 1 hour.'], ['Caltrops (bag of 20)', 1, 2], ['Ball bearings (bag of 1,000)', 1, 2], ['Common clothes', 0.5, 3], ['Fine clothes', 15, 6], ['Traveller\'s clothes', 2, 4]
].map(([name, cost, wt, note]) => ({ name, cost, wt, note: note || '', kind: 'gear' }));
const PACKS = {
  "Burglar's pack": [16, 'Backpack, 1,000 ball bearings, 10 ft of string, a bell, 5 candles, a crowbar, a hammer, 10 pitons, a hooded lantern, 2 flasks of oil, 5 days of rations, a tinderbox, a waterskin and 50 ft of hempen rope.'],
  "Diplomat's pack": [39, 'A chest, 2 cases for maps and scrolls, fine clothes, ink and pen, a lamp, 2 flasks of oil, 5 sheets of paper, perfume, sealing wax and soap.'],
  "Dungeoneer's pack": [12, 'Backpack, a crowbar, a hammer, 10 pitons, 10 torches, a tinderbox, 10 days of rations, a waterskin and 50 ft of hempen rope.'],
  "Entertainer's pack": [40, 'Backpack, a bedroll, 2 costumes, 5 candles, 5 days of rations, a waterskin and a disguise kit.'],
  "Explorer's pack": [10, 'Backpack, a bedroll, a mess kit, a tinderbox, 10 torches, 10 days of rations, a waterskin and 50 ft of hempen rope.'],
  "Priest's pack": [19, 'Backpack, a blanket, 10 candles, a tinderbox, an alms box, 2 blocks of incense, a censer, vestments, 2 days of rations and a waterskin.'],
  "Scholar's pack": [40, 'Backpack, a book of lore, ink and pen, 10 sheets of parchment, a little bag of sand and a small knife.']
};
const ITEM = new Map();
for (const w of WEAPONS) ITEM.set(w.name, w);
for (const a of ARMORS) ITEM.set(a.name, a);
for (const g of GEAR) ITEM.set(g.name, g);
for (const k in PACKS) ITEM.set(k, { name: k, cost: PACKS[k][0], wt: 0, note: PACKS[k][1], kind: 'pack' });
const SIMPLE = WEAPONS.filter((w) => w.cat.startsWith('simple')).map((w) => w.name);
const SIMPLE_MELEE = WEAPONS.filter((w) => w.cat === 'simple melee').map((w) => w.name);
const MARTIAL = WEAPONS.filter((w) => w.cat.startsWith('martial')).map((w) => w.name);
const MARTIAL_MELEE = WEAPONS.filter((w) => w.cat === 'martial melee').map((w) => w.name);
const PICKS = { '@simple': ['any simple weapon', SIMPLE], '@simpleMelee': ['any simple melee weapon', SIMPLE_MELEE], '@martial': ['any martial weapon', MARTIAL], '@martialMelee': ['any martial melee weapon', MARTIAL_MELEE], '@instrument': ['a musical instrument', ['Lute', 'Flute', 'Drum']] };

// ---------------------------------------------------------------- classes
const FULL_SLOTS = [[], [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]];
const PACT_SLOTS = [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4];
const PACT_LEVEL = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
const cantripTable = (a, b, c) => (lv) => (lv >= 10 ? c : lv >= 4 ? b : a);
const STYLES = {
  archery: ['Archery', '+2 to attack rolls with ranged weapons.'], defense: ['Defence', '+1 AC while you wear armour.'],
  dueling: ['Duelling', '+2 damage with a melee weapon held in one hand and no other weapon.'], gwf: ['Great Weapon Fighting', 'Reroll 1s and 2s on damage dice with two-handed or versatile melee weapons held in two hands.'],
  protection: ['Protection', 'With a shield, use your reaction to impose disadvantage on an attack against an ally within 5 ft.'], twf: ['Two-Weapon Fighting', 'Add your ability modifier to the damage of your off-hand attack.']
};
const METAMAGIC = {
  careful: ['Careful Spell', '1 point: chosen creatures automatically succeed on the spell\'s save.'], distant: ['Distant Spell', '1 point: double the range (touch becomes 30 ft).'],
  empowered: ['Empowered Spell', '1 point: reroll up to your Charisma modifier in damage dice.'], extended: ['Extended Spell', '1 point: double a duration of 1 minute or more (max 24 hours).'],
  heightened: ['Heightened Spell', '3 points: one target has disadvantage on its first save against the spell.'], quickened: ['Quickened Spell', '2 points: cast a 1-action spell as a bonus action.'],
  subtle: ['Subtle Spell', '1 point: cast without verbal or somatic components.'], twinned: ['Twinned Spell', 'Points equal to spell level: target a second creature with a single-target spell.']
};
const INVOCATIONS = {
  agonizing: ['Agonizing Blast', 'Add your Charisma modifier to eldritch blast damage.', 0, 'eb'], armor: ['Armor of Shadows', 'Cast mage armor on yourself at will.', 0],
  beast: ['Beast Speech', 'Cast speak with animals at will.', 0], beguiling: ['Beguiling Influence', 'Proficiency in Deception and Persuasion.', 0],
  devilsight: ["Devil's Sight", 'See normally in darkness, magical or not, to 120 ft.', 0], eldsight: ['Eldritch Sight', 'Cast detect magic at will.', 0],
  spear: ['Eldritch Spear', 'Eldritch blast reaches 300 ft.', 0, 'eb'], runekeeper: ['Eyes of the Rune Keeper', 'Read all writing.', 0],
  vigor: ['Fiendish Vigor', 'Cast false life on yourself at will as a 1st-level spell.', 0], gaze: ['Gaze of Two Minds', 'Touch a willing humanoid to perceive through its senses.', 0],
  mask: ['Mask of Many Faces', 'Cast disguise self at will.', 0], misty: ['Misty Visions', 'Cast silent image at will.', 0],
  repelling: ['Repelling Blast', 'Eldritch blast pushes a creature 10 ft away.', 0, 'eb'], thief: ['Thief of Five Fates', 'Cast bane once per long rest using a warlock slot.', 0],
  tome: ['Book of Ancient Secrets', 'Inscribe two 1st-level rituals from any class in your Book of Shadows.', 0, 'tome'], chain: ['Voice of the Chain Master', 'Talk through and perceive through your familiar at any distance.', 0, 'chain'],
  mire: ['Mire the Mind', 'Cast slow once per long rest using a warlock slot.', 5], shadows: ['One with Shadows', 'Become invisible in dim light or darkness while still.', 5],
  omen: ['Sign of Ill Omen', 'Cast bestow curse once per long rest using a warlock slot.', 5], thirsting: ['Thirsting Blade', 'Attack twice with your pact weapon.', 5, 'blade'],
  whispers: ['Bewitching Whispers', 'Cast compulsion once per long rest.', 7], dreadful: ['Dreadful Word', 'Cast confusion once per long rest.', 7], sculptor: ['Sculptor of Flesh', 'Cast polymorph once per long rest.', 7],
  ascendant: ['Ascendant Step', 'Cast levitate on yourself at will.', 9], leap: ['Otherworldly Leap', 'Cast jump on yourself at will.', 9], minions: ['Minions of Chaos', 'Cast conjure elemental once per long rest.', 9], grave: ['Whispers of the Grave', 'Cast speak with dead at will.', 9],
  lifedrinker: ['Lifedrinker', 'Pact weapon hits deal extra necrotic damage equal to your Charisma modifier.', 12, 'blade'],
  carceri: ['Chains of Carceri', 'Cast hold monster at will on celestials, fiends or elementals.', 15, 'chain'], myriad: ['Master of Myriad Forms', 'Cast alter self at will.', 15],
  distant: ['Visions of Distant Realms', 'Cast arcane eye at will.', 15], witchsight: ['Witch Sight', 'See the true form of shapechangers and illusions within 30 ft.', 15]
};
const FAVORED = ['Aberrations', 'Beasts', 'Celestials', 'Constructs', 'Dragons', 'Elementals', 'Fey', 'Fiends', 'Giants', 'Monstrosities', 'Oozes', 'Plants', 'Undead', 'Humanoids (two races)'];
const TERRAINS = ['Arctic', 'Coast', 'Desert', 'Forest', 'Grassland', 'Mountain', 'Swamp', 'Underdark'];
const CIRCLE_SPELLS = {
  Arctic: ['Hold Person', 'Spike Growth', 'Sleet Storm', 'Slow', 'Freedom of Movement', 'Ice Storm', 'Commune with Nature', 'Cone of Cold'],
  Coast: ['Mirror Image', 'Misty Step', 'Water Breathing', 'Water Walk', 'Control Water', 'Freedom of Movement', 'Conjure Elemental', 'Scrying'],
  Desert: ['Blur', 'Silence', 'Create Food and Water', 'Protection from Energy', 'Blight', 'Hallucinatory Terrain', 'Insect Plague', 'Wall of Stone'],
  Forest: ['Barkskin', 'Spider Climb', 'Call Lightning', 'Plant Growth', 'Divination', 'Freedom of Movement', 'Commune with Nature', 'Tree Stride'],
  Grassland: ['Invisibility', 'Pass without Trace', 'Daylight', 'Haste', 'Divination', 'Freedom of Movement', 'Dream', 'Insect Plague'],
  Mountain: ['Spider Climb', 'Spike Growth', 'Lightning Bolt', 'Meld into Stone', 'Stone Shape', 'Stoneskin', 'Passwall', 'Wall of Stone'],
  Swamp: ['Darkness', 'Acid Arrow', 'Water Walk', 'Stinking Cloud', 'Freedom of Movement', 'Locate Creature', 'Insect Plague', 'Scrying'],
  Underdark: ['Spider Climb', 'Web', 'Gaseous Form', 'Stinking Cloud', 'Greater Invisibility', 'Stone Shape', 'Cloudkill', 'Insect Plague']
};
// [level, name, description]; descriptions are short summaries for play
const CLASSES5 = {
  barbarian: { name: 'Barbarian', hd: 12, prime: ['str', 'con'], saves: ['str', 'con'], armor: ['light', 'medium', 'shield'], weapons: ['simple', 'martial'], skills: [2, ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival']], gold: [2, 4, 10],
    blurb: 'A fierce warrior who fights in a battle rage. Very tough; simple to play.', sub: ['Primal Path', 'Path of the Berserker', 3], unarmored: 'con',
    kit: [[{ l: 'A greataxe', i: ['Greataxe'] }, { l: 'Any martial melee weapon', i: ['@martialMelee'] }], [{ l: 'Two handaxes', i: ['Handaxe x2'] }, { l: 'Any simple weapon', i: ['@simple'] }], [{ l: "Explorer's pack and four javelins", i: ["Explorer's pack", 'Javelin x4'] }]],
    feats: [[1, 'Rage', 'Bonus action: for 1 minute gain advantage on Strength checks and saves, bonus damage on Strength melee attacks, and resistance to bludgeoning, piercing and slashing. No spellcasting while raging.'], [1, 'Unarmored Defense', 'Without armour, your AC is 10 + Dex mod + Con mod (a shield still counts).'],
      [2, 'Reckless Attack', 'On your first attack each turn you may take advantage on Strength melee attacks; attacks against you have advantage until your next turn.'], [2, 'Danger Sense', 'Advantage on Dexterity saves against effects you can see, unless blinded, deafened or incapacitated.'],
      [5, 'Extra Attack', 'Attack twice when you take the Attack action.'], [5, 'Fast Movement', '+10 ft speed when not wearing heavy armour.'], [7, 'Feral Instinct', 'Advantage on initiative; you can act on a surprise turn if you rage first.'],
      [9, 'Brutal Critical', 'Roll one extra weapon damage die on a melee critical hit (two at 13th, three at 17th).'], [11, 'Relentless Rage', 'While raging, a DC 10 Con save (rising by 5 each use) keeps you at 1 HP instead of 0.'],
      [15, 'Persistent Rage', 'Your rage only ends early if you fall unconscious or choose to end it.'], [18, 'Indomitable Might', 'If a Strength check total is less than your Strength score, use the score instead.'], [20, 'Primal Champion', 'Strength and Constitution rise by 4, to a maximum of 24.']],
    subFeats: [[3, 'Frenzy', 'While raging you can frenzy: make one melee attack as a bonus action each turn. Afterwards, gain one level of exhaustion.'], [6, 'Mindless Rage', 'You can\'t be charmed or frightened while raging.'], [10, 'Intimidating Presence', 'Action: frighten a creature within 30 ft (Wis save, DC 8 + prof + Cha).'], [14, 'Retaliation', 'Reaction: make a melee attack against a creature within 5 ft that damages you.']] },
  bard: { name: 'Bard', hd: 8, prime: ['cha', 'dex'], saves: ['dex', 'cha'], armor: ['light'], weapons: ['simple', 'Hand crossbow', 'Longsword', 'Rapier', 'Shortsword'], tools: ['Three musical instruments'], skills: [3, ALL_SKILLS], gold: [5, 4, 10],
    blurb: 'A magical performer who inspires allies, heals and knows a bit of everything.', sub: ['Bard College', 'College of Lore', 3],
    cast: { type: 'full', ab: 'cha', mode: 'known', list: 'b', cantrips: cantripTable(2, 3, 4), known: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22], focus: 'Musical instrument' },
    kit: [[{ l: 'A rapier', i: ['Rapier'] }, { l: 'A longsword', i: ['Longsword'] }, { l: 'Any simple weapon', i: ['@simple'] }], [{ l: "Diplomat's pack", i: ["Diplomat's pack"] }, { l: "Entertainer's pack", i: ["Entertainer's pack"] }], [{ l: 'A lute', i: ['Lute'] }, { l: 'Another instrument', i: ['@instrument'] }], [{ l: 'Leather armour and a dagger', i: ['Leather armour', 'Dagger'] }]],
    feats: [[1, 'Spellcasting', 'You cast bard spells using Charisma. You can use a musical instrument as a focus.'], [1, 'Bardic Inspiration', 'Bonus action: give a creature within 60 ft an inspiration die (d6, d8 at 5th, d10 at 10th, d12 at 15th) to add to one attack, check or save in the next 10 minutes.'],
      [2, 'Jack of All Trades', 'Add half your proficiency bonus to ability checks you aren\'t proficient in.'], [2, 'Song of Rest', 'During a short rest, allies who spend hit dice regain an extra d6 (d8 at 9th, d10 at 13th, d12 at 17th).'],
      [3, 'Expertise', 'Double your proficiency bonus for two chosen skills (two more at 10th level).'], [5, 'Font of Inspiration', 'Bardic Inspiration recharges on a short rest as well.'], [6, 'Countercharm', 'Action: allies within 30 ft gain advantage on saves against charm and fear until your next turn ends.'],
      [10, 'Magical Secrets', 'Learn two spells from any class (two more at 14th and 18th). They count as bard spells.'], [20, 'Superior Inspiration', 'If you have no inspiration dice left when you roll initiative, you regain one.']],
    subFeats: [[3, 'Bonus Proficiencies', 'Proficiency in three skills of your choice.'], [3, 'Cutting Words', 'Reaction: spend an inspiration die to subtract it from a creature\'s attack, check or damage roll.'], [6, 'Additional Magical Secrets', 'Learn two spells from any class.'], [14, 'Peerless Skill', 'Spend an inspiration die to add it to your own ability check.']] },
  cleric: { name: 'Cleric', hd: 8, prime: ['wis', 'con'], saves: ['wis', 'cha'], armor: ['light', 'medium', 'shield'], weapons: ['simple'], skills: [2, ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion']], gold: [5, 4, 10],
    blurb: 'A priest who heals, protects and smites through divine magic. Life domain: the best healer.', sub: ['Divine Domain', 'Life Domain', 1], subArmor: ['heavy'],
    cast: { type: 'full', ab: 'wis', mode: 'prepared', list: 'c', cantrips: cantripTable(3, 4, 5), focus: 'Holy symbol' },
    extra: { 1: ['Bless', 'Cure Wounds'], 3: ['Lesser Restoration', 'Spiritual Weapon'], 5: ['Beacon of Hope', 'Revivify'], 7: ['Death Ward', 'Guardian of Faith'], 9: ['Mass Cure Wounds', 'Raise Dead'] },
    kit: [[{ l: 'A mace', i: ['Mace'] }, { l: 'A warhammer', i: ['Warhammer'] }], [{ l: 'Scale mail', i: ['Scale mail'] }, { l: 'Leather armour', i: ['Leather armour'] }, { l: 'Chain mail', i: ['Chain mail'] }], [{ l: 'Light crossbow and 20 bolts', i: ['Light crossbow', 'Crossbow bolts (20)'] }, { l: 'Any simple weapon', i: ['@simple'] }], [{ l: "Priest's pack", i: ["Priest's pack"] }, { l: "Explorer's pack", i: ["Explorer's pack"] }], [{ l: 'A shield and a holy symbol', i: ['Shield', 'Holy symbol'] }]],
    feats: [[1, 'Spellcasting', 'You prepare cleric spells each day (Wisdom modifier + level) and cast them using Wisdom. A holy symbol is your focus.'], [2, 'Channel Divinity', 'Use divine power once per short or long rest (twice at 6th, three times at 18th).'],
      [2, 'Turn Undead', 'Channel Divinity: undead within 30 ft make a Wis save or flee for 1 minute.'], [5, 'Destroy Undead', 'Turned undead of CR 1/2 or lower are destroyed (CR 1 at 8th, 2 at 11th, 3 at 14th, 4 at 17th).'],
      [10, 'Divine Intervention', 'Action: call on your god; it intervenes if you roll your cleric level or lower on d100. Automatic at 20th.']],
    subFeats: [[1, 'Bonus Proficiency', 'Proficiency with heavy armour.'], [1, 'Disciple of Life', 'Your healing spells of 1st level or higher heal an extra 2 + the spell\'s level.'], [2, 'Preserve Life', 'Channel Divinity: share out healing equal to five times your cleric level among creatures within 30 ft (up to half their maximum).'],
      [6, 'Blessed Healer', 'When you heal another with a spell, you regain 2 + the spell\'s level hit points.'], [8, 'Divine Strike', 'Once per turn, weapon hits deal +1d8 radiant (2d8 at 14th).'], [17, 'Supreme Healing', 'Healing spells use the highest number on each die instead of rolling.']] },
  druid: { name: 'Druid', hd: 8, prime: ['wis', 'con'], saves: ['int', 'wis'], armor: ['light', 'medium', 'shield'], weapons: ['Club', 'Dagger', 'Dart', 'Javelin', 'Mace', 'Quarterstaff', 'Scimitar', 'Sickle', 'Sling', 'Spear'], tools: ['Herbalism kit'], skills: [2, ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival']], gold: [2, 4, 10],
    blurb: 'A priest of nature who casts primal magic and takes the shape of beasts.', sub: ['Druid Circle', 'Circle of the Land', 2], langs: ['Druidic'], noMetal: true,
    cast: { type: 'full', ab: 'wis', mode: 'prepared', list: 'd', cantrips: cantripTable(2, 3, 4), focus: 'Druidic focus (yew wand)' },
    kit: [[{ l: 'A wooden shield', i: ['Shield'] }, { l: 'Any simple weapon', i: ['@simple'] }], [{ l: 'A scimitar', i: ['Scimitar'] }, { l: 'Any simple melee weapon', i: ['@simpleMelee'] }], [{ l: "Leather armour, explorer's pack and a druidic focus", i: ['Leather armour', "Explorer's pack", 'Druidic focus (yew wand)'] }]],
    feats: [[1, 'Druidic', 'You know Druidic, the secret language of druids.'], [1, 'Spellcasting', 'You prepare druid spells each day (Wisdom modifier + level) and cast them using Wisdom. Druids won\'t wear metal armour or shields.'],
      [2, 'Wild Shape', 'Action: turn into a beast you have seen, twice per short rest, for half your druid level in hours. Max CR 1/4 with no flying or swimming; CR 1/2 and swimming at 4th; CR 1 and flying at 8th.'],
      [18, 'Timeless Body', 'You age ten times more slowly.'], [18, 'Beast Spells', 'Cast spells with verbal and somatic components while in beast form.'], [20, 'Archdruid', 'Use Wild Shape without limit, and ignore spell components that have no cost.']],
    subFeats: [[2, 'Bonus Cantrip', 'You learn one extra druid cantrip.'], [2, 'Natural Recovery', 'Once per day during a short rest, recover spell slots totalling up to half your druid level (rounded up), none higher than 5th.'], [3, 'Circle Spells', 'Your chosen land grants extra spells that are always prepared.'],
      [6, "Land's Stride", 'Nonmagical difficult terrain costs no extra movement; advantage on saves against magical plants.'], [10, "Nature's Ward", 'Immune to poison and disease; elementals and fey can\'t charm or frighten you.'], [14, "Nature's Sanctuary", 'Beasts and plants must make a Wis save to attack you.']] },
  fighter: { name: 'Fighter', hd: 10, prime: ['str', 'dex', 'con'], saves: ['str', 'con'], armor: ['light', 'medium', 'heavy', 'shield'], weapons: ['simple', 'martial'], skills: [2, ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival']], gold: [5, 4, 10],
    blurb: 'A master of weapons and armour. Reliable and great for a first character.', sub: ['Martial Archetype', 'Champion', 3], style: [1, ['archery', 'defense', 'dueling', 'gwf', 'protection', 'twf']], asi: [4, 6, 8, 12, 14, 16, 19],
    kit: [[{ l: 'Chain mail', i: ['Chain mail'] }, { l: 'Leather armour, longbow and 20 arrows', i: ['Leather armour', 'Longbow', 'Arrows (20)'] }], [{ l: 'A martial weapon and a shield', i: ['@martial', 'Shield'] }, { l: 'Two martial weapons', i: ['@martial', '@martial'] }], [{ l: 'Light crossbow and 20 bolts', i: ['Light crossbow', 'Crossbow bolts (20)'] }, { l: 'Two handaxes', i: ['Handaxe x2'] }], [{ l: "Dungeoneer's pack", i: ["Dungeoneer's pack"] }, { l: "Explorer's pack", i: ["Explorer's pack"] }]],
    feats: [[1, 'Fighting Style', 'A combat speciality (chosen below).'], [1, 'Second Wind', 'Bonus action: regain 1d10 + fighter level HP. Once per short rest.'], [2, 'Action Surge', 'Take one extra action on your turn. Once per short rest (twice before a rest at 17th).'],
      [5, 'Extra Attack', 'Attack twice when you take the Attack action (three times at 11th, four at 20th).'], [9, 'Indomitable', 'Reroll a failed saving throw. Once per long rest (twice at 13th, three times at 17th).']],
    subFeats: [[3, 'Improved Critical', 'Your weapon attacks score a critical hit on a 19 or 20.'], [7, 'Remarkable Athlete', 'Add half proficiency to Str, Dex and Con checks you aren\'t proficient in; running long jumps go further.'], [10, 'Additional Fighting Style', 'Choose a second fighting style.'],
      [15, 'Superior Critical', 'Your weapon attacks score a critical hit on an 18–20.'], [18, 'Survivor', 'At the start of each turn, regain 5 + Con mod HP if you are below half and above 0.']] },
  monk: { name: 'Monk', hd: 8, prime: ['dex', 'wis'], saves: ['str', 'dex'], armor: [], weapons: ['simple', 'Shortsword'], tools: ["One artisan's tool or instrument"], skills: [2, ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth']], gold: [5, 4, 1],
    blurb: 'A swift martial artist who fights unarmed and channels ki.', sub: ['Monastic Tradition', 'Way of the Open Hand', 3], unarmored: 'wis',
    kit: [[{ l: 'A shortsword', i: ['Shortsword'] }, { l: 'Any simple weapon', i: ['@simple'] }], [{ l: "Dungeoneer's pack", i: ["Dungeoneer's pack"] }, { l: "Explorer's pack", i: ["Explorer's pack"] }], [{ l: '10 darts', i: ['Dart x10'] }]],
    feats: [[1, 'Unarmored Defense', 'Without armour or a shield, your AC is 10 + Dex mod + Wis mod.'], [1, 'Martial Arts', 'Use Dex for unarmed strikes and monk weapons; they deal a martial arts die (d4, d6 at 5th, d8 at 11th, d10 at 17th). After attacking, make one unarmed strike as a bonus action.'],
      [2, 'Ki', 'Spend ki points (one per level, back on a short rest): Flurry of Blows (two bonus unarmed strikes), Patient Defense (Dodge as a bonus action), Step of the Wind (Disengage or Dash as a bonus action, jump doubled).'],
      [2, 'Unarmored Movement', '+10 ft speed without armour (rising to +30 ft by 18th level); at 9th you can run along walls and across water.'], [3, 'Deflect Missiles', 'Reaction: reduce ranged weapon damage by 1d10 + Dex mod + level; catch and throw it back for 1 ki if reduced to 0.'],
      [4, 'Slow Fall', 'Reaction: reduce falling damage by five times your level.'], [5, 'Extra Attack', 'Attack twice when you take the Attack action.'], [5, 'Stunning Strike', 'On a melee hit, spend 1 ki: Con save or stunned until the end of your next turn.'],
      [6, 'Ki-Empowered Strikes', 'Your unarmed strikes count as magical.'], [7, 'Evasion', 'On a Dex save for half damage, take none on a success and half on a failure.'], [7, 'Stillness of Mind', 'Action: end one charm or fear effect on yourself.'],
      [10, 'Purity of Body', 'Immune to disease and poison.'], [13, 'Tongue of the Sun and Moon', 'Understand all spoken languages, and be understood.'], [14, 'Diamond Soul', 'Proficient in all saves; spend 1 ki to reroll a failed save.'],
      [15, 'Timeless Body', 'You no longer need food or water and don\'t age further.'], [18, 'Empty Body', '4 ki: invisible and resistant to all but force damage for 1 minute; 8 ki: cast astral projection.'], [20, 'Perfect Self', 'Regain 4 ki if you roll initiative with none.']],
    subFeats: [[3, 'Open Hand Technique', 'When Flurry of Blows hits: the target falls prone (Dex save), is pushed 15 ft (Str save), or can\'t take reactions.'], [6, 'Wholeness of Body', 'Action: regain three times your monk level in HP. Once per long rest.'], [11, 'Tranquility', 'After a long rest you are under a sanctuary effect until you attack.'], [17, 'Quivering Palm', '3 ki: set lethal vibrations in a creature; later, it makes a Con save or drops to 0 HP (10d10 necrotic on a success).']] },
  paladin: { name: 'Paladin', hd: 10, prime: ['str', 'cha'], saves: ['wis', 'cha'], armor: ['light', 'medium', 'heavy', 'shield'], weapons: ['simple', 'martial'], skills: [2, ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion']], gold: [5, 4, 10],
    blurb: 'A holy knight bound by an oath. Heavy armour, healing hands and smiting blows.', sub: ['Sacred Oath', 'Oath of Devotion', 3], style: [2, ['defense', 'dueling', 'gwf', 'protection']],
    cast: { type: 'half', ab: 'cha', mode: 'prepared', list: 'p', cantrips: () => 0, from: 2, focus: 'Holy symbol' },
    extra: { 3: ['Protection from Evil and Good', 'Sanctuary'], 5: ['Lesser Restoration', 'Zone of Truth'], 9: ['Beacon of Hope', 'Dispel Magic'], 13: ['Freedom of Movement', 'Guardian of Faith'], 17: ['Commune', 'Flame Strike'] },
    kit: [[{ l: 'A martial weapon and a shield', i: ['@martial', 'Shield'] }, { l: 'Two martial weapons', i: ['@martial', '@martial'] }], [{ l: 'Five javelins', i: ['Javelin x5'] }, { l: 'Any simple melee weapon', i: ['@simpleMelee'] }], [{ l: "Priest's pack", i: ["Priest's pack"] }, { l: "Explorer's pack", i: ["Explorer's pack"] }], [{ l: 'Chain mail and a holy symbol', i: ['Chain mail', 'Holy symbol'] }]],
    feats: [[1, 'Divine Sense', 'Action: until your next turn, sense celestials, fiends and undead within 60 ft. Uses: 1 + Cha mod per long rest.'], [1, 'Lay on Hands', 'Touch to restore HP from a pool of five times your level (per long rest), or spend 5 to cure a disease or poison.'],
      [2, 'Fighting Style', 'A combat speciality (chosen below).'], [2, 'Spellcasting', 'You prepare paladin spells each day (Cha mod + half level) and cast them using Charisma.'], [2, 'Divine Smite', 'When you hit with a melee weapon, spend a spell slot for +2d8 radiant (+1d8 per slot level above 1st, max 5d8; +1d8 against undead or fiends).'],
      [3, 'Divine Health', 'Immune to disease.'], [3, 'Channel Divinity', 'Use your oath\'s power once per short or long rest.'], [5, 'Extra Attack', 'Attack twice when you take the Attack action.'], [6, 'Aura of Protection', 'You and allies within 10 ft add your Cha mod to saving throws (30 ft at 18th).'],
      [10, 'Aura of Courage', 'You and allies within 10 ft can\'t be frightened while you are conscious.'], [11, 'Improved Divine Smite', 'Every melee weapon hit deals +1d8 radiant.'], [14, 'Cleansing Touch', 'Action: end one spell on yourself or a willing creature. Uses: Cha mod per long rest.']],
    subFeats: [[3, 'Sacred Weapon', 'Channel Divinity: for 1 minute add your Cha mod to weapon attack rolls; the weapon sheds light.'], [3, 'Turn the Unholy', 'Channel Divinity: fiends and undead within 30 ft make a Wis save or are turned.'], [7, 'Aura of Devotion', 'You and allies within 10 ft can\'t be charmed (30 ft at 18th).'], [15, 'Purity of Spirit', 'You are always under protection from evil and good.'], [20, 'Holy Nimbus', 'Action: for 1 minute shine with sunlight that deals 10 radiant to enemies starting near you. Once per long rest.']] },
  ranger: { name: 'Ranger', hd: 10, prime: ['dex', 'wis'], saves: ['str', 'dex'], armor: ['light', 'medium', 'shield'], weapons: ['simple', 'martial'], skills: [3, ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival']], gold: [5, 4, 10],
    blurb: 'A hunter and tracker of the wilds, deadly with a bow, with a little nature magic.', sub: ['Ranger Archetype', 'Hunter', 3], style: [2, ['archery', 'defense', 'dueling', 'twf']], favored: true,
    cast: { type: 'half', ab: 'wis', mode: 'known', list: 'r', cantrips: () => 0, from: 2, known: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11] },
    kit: [[{ l: 'Scale mail', i: ['Scale mail'] }, { l: 'Leather armour', i: ['Leather armour'] }], [{ l: 'Two shortswords', i: ['Shortsword x2'] }, { l: 'Two simple melee weapons', i: ['@simpleMelee', '@simpleMelee'] }], [{ l: "Dungeoneer's pack", i: ["Dungeoneer's pack"] }, { l: "Explorer's pack", i: ["Explorer's pack"] }], [{ l: 'A longbow and 20 arrows', i: ['Longbow', 'Arrows (20)'] }]],
    feats: [[1, 'Favored Enemy', 'Advantage on Survival to track your favoured enemies and on Intelligence checks to recall facts about them; learn one of their languages. More enemies at 6th and 14th.'], [1, 'Natural Explorer', 'In your favoured terrain: difficult terrain doesn\'t slow your group, you can\'t get lost, you stay alert while foraging, and you find twice as much food. More terrains at 6th and 10th.'],
      [2, 'Fighting Style', 'A combat speciality (chosen below).'], [2, 'Spellcasting', 'You know a few ranger spells and cast them using Wisdom.'], [3, 'Primeval Awareness', 'Spend a spell slot to sense aberrations, celestials, dragons, elementals, fey, fiends and undead within a mile (6 in your favoured terrain).'],
      [5, 'Extra Attack', 'Attack twice when you take the Attack action.'], [8, "Land's Stride", 'Nonmagical difficult terrain costs no extra movement; advantage on saves against magical plants.'], [10, 'Hide in Plain Sight', 'Spend a minute camouflaging yourself for +10 to Stealth while still.'],
      [14, 'Vanish', 'Hide as a bonus action; you can\'t be tracked by nonmagical means.'], [18, 'Feral Senses', 'Fight unseen creatures without disadvantage and sense invisible ones within 30 ft.'], [20, 'Foe Slayer', 'Once per turn add your Wis mod to an attack or damage roll against a favoured enemy.']],
    subFeats: [[3, "Hunter's Prey", 'Colossus Slayer: once per turn, +1d8 damage to a creature below its maximum HP.'], [7, 'Defensive Tactics', 'Escape the Horde: opportunity attacks against you have disadvantage.'], [11, 'Multiattack', 'Volley: action to make a ranged attack against every creature within 10 ft of a point.'], [15, "Superior Hunter's Defense", 'Evasion: take no damage on a successful Dex save for half, and half on a failure.']] },
  rogue: { name: 'Rogue', hd: 8, prime: ['dex', 'int'], saves: ['dex', 'int'], armor: ['light'], weapons: ['simple', 'Hand crossbow', 'Longsword', 'Rapier', 'Shortsword'], tools: ["Thieves' tools"], skills: [4, ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth']], gold: [4, 4, 10],
    blurb: 'A sneaky expert with many skills and a devastating Sneak Attack.', sub: ['Roguish Archetype', 'Thief', 3], asi: [4, 8, 10, 12, 16, 19], langs: ["Thieves' Cant"],
    kit: [[{ l: 'A rapier', i: ['Rapier'] }, { l: 'A shortsword', i: ['Shortsword'] }], [{ l: 'A shortbow and 20 arrows', i: ['Shortbow', 'Arrows (20)'] }, { l: 'A shortsword', i: ['Shortsword'] }], [{ l: "Burglar's pack", i: ["Burglar's pack"] }, { l: "Dungeoneer's pack", i: ["Dungeoneer's pack"] }, { l: "Explorer's pack", i: ["Explorer's pack"] }], [{ l: "Leather armour, two daggers and thieves' tools", i: ['Leather armour', 'Dagger x2', "Thieves' tools"] }]],
    feats: [[1, 'Expertise', 'Double your proficiency bonus for two chosen skills or thieves\' tools (two more at 6th).'], [1, 'Sneak Attack', 'Once per turn, deal extra damage when you hit with a finesse or ranged weapon and have advantage, or an ally is next to the target.'], [1, "Thieves' Cant", 'A secret mix of jargon and signs known to criminals.'],
      [2, 'Cunning Action', 'Dash, Disengage or Hide as a bonus action.'], [5, 'Uncanny Dodge', 'Reaction: halve the damage of an attack from an attacker you can see.'], [7, 'Evasion', 'On a Dex save for half damage, take none on a success and half on a failure.'],
      [11, 'Reliable Talent', 'Treat any d20 roll of 9 or lower as a 10 on checks you are proficient in.'], [14, 'Blindsense', 'Aware of hidden or invisible creatures within 10 ft if you can hear.'], [15, 'Slippery Mind', 'Proficiency in Wisdom saves.'], [18, 'Elusive', 'No attack roll has advantage against you while you aren\'t incapacitated.'], [20, 'Stroke of Luck', 'Turn a miss into a hit or a failed check into a 20. Once per short rest.']],
    subFeats: [[3, 'Fast Hands', 'Cunning Action can also Sleight of Hand, use thieves\' tools or Use an Object.'], [3, 'Second-Story Work', 'Climbing costs no extra movement; running jumps go further.'], [9, 'Supreme Sneak', 'Advantage on Stealth if you move no more than half speed.'], [13, 'Use Magic Device', 'Ignore class, race and level requirements on magic items.'], [17, "Thief's Reflexes", 'Take two turns in the first round of combat.']] },
  sorcerer: { name: 'Sorcerer', hd: 6, prime: ['cha', 'con'], saves: ['con', 'cha'], armor: [], weapons: ['Dagger', 'Dart', 'Sling', 'Quarterstaff', 'Light crossbow'], skills: [2, ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion']], gold: [3, 4, 10],
    blurb: 'Born with magic in the blood. Fewer spells than a wizard, but bends them with Metamagic.', sub: ['Sorcerous Origin', 'Draconic Bloodline', 1], dragon: true,
    cast: { type: 'full', ab: 'cha', mode: 'known', list: 's', cantrips: cantripTable(4, 5, 6), known: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15], focus: 'Arcane focus (crystal)' },
    kit: [[{ l: 'Light crossbow and 20 bolts', i: ['Light crossbow', 'Crossbow bolts (20)'] }, { l: 'Any simple weapon', i: ['@simple'] }], [{ l: 'A component pouch', i: ['Component pouch'] }, { l: 'An arcane focus', i: ['Arcane focus (crystal)'] }], [{ l: "Dungeoneer's pack", i: ["Dungeoneer's pack"] }, { l: "Explorer's pack", i: ["Explorer's pack"] }], [{ l: 'Two daggers', i: ['Dagger x2'] }]],
    feats: [[1, 'Spellcasting', 'You know a few sorcerer spells and cast them using Charisma.'], [2, 'Font of Magic', 'Sorcery points (one per level, back on a long rest). Bonus action: turn points into spell slots (2 for 1st, 3 for 2nd, 5 for 3rd, 6 for 4th, 7 for 5th) or slots into points.'],
      [3, 'Metamagic', 'Twist your spells with sorcery points. Two options (three at 10th, four at 17th).'], [20, 'Sorcerous Restoration', 'Regain 4 sorcery points on a short rest.']],
    subFeats: [[1, 'Dragon Ancestor', 'Choose a dragon type. You speak Draconic, and double your proficiency on Charisma checks with dragons.'], [1, 'Draconic Resilience', '+1 HP per sorcerer level; without armour your AC is 13 + Dex mod.'],
      [6, 'Elemental Affinity', 'Add your Cha mod to damage of your ancestry\'s type; spend 1 point for resistance to it for an hour.'], [14, 'Dragon Wings', 'Bonus action: sprout wings for a flying speed equal to your speed.'], [18, 'Draconic Presence', '5 points: an aura of awe or fear for 1 minute (Wis save).']] },
  warlock: { name: 'Warlock', hd: 8, prime: ['cha', 'con'], saves: ['wis', 'cha'], armor: ['light'], weapons: ['simple'], skills: [2, ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion']], gold: [4, 4, 10],
    blurb: 'Wields magic granted by a pact with an otherworldly patron. Eldritch blast is superb.', sub: ['Otherworldly Patron', 'The Fiend', 1],
    cast: { type: 'pact', ab: 'cha', mode: 'known', list: 'k', cantrips: cantripTable(2, 3, 4), known: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15], focus: 'Arcane focus (crystal)' },
    expanded: ['Burning Hands', 'Command', 'Blindness/Deafness', 'Scorching Ray', 'Fireball', 'Stinking Cloud', 'Fire Shield', 'Wall of Fire', 'Flame Strike', 'Hallow'],
    kit: [[{ l: 'Light crossbow and 20 bolts', i: ['Light crossbow', 'Crossbow bolts (20)'] }, { l: 'Any simple weapon', i: ['@simple'] }], [{ l: 'A component pouch', i: ['Component pouch'] }, { l: 'An arcane focus', i: ['Arcane focus (crystal)'] }], [{ l: "Scholar's pack", i: ["Scholar's pack"] }, { l: "Dungeoneer's pack", i: ["Dungeoneer's pack"] }], [{ l: 'Leather armour, a simple weapon and two daggers', i: ['Leather armour', '@simple', 'Dagger x2'] }]],
    feats: [[1, 'Pact Magic', 'Few spell slots, all of your highest level, and they return on a short rest. Charisma is your spellcasting ability.'], [2, 'Eldritch Invocations', 'Fragments of forbidden knowledge (chosen below).'],
      [3, 'Pact Boon', 'Your patron\'s gift: Pact of the Chain (a special familiar), Pact of the Blade (summon a magic weapon), or Pact of the Tome (a Book of Shadows with three extra cantrips).'],
      [11, 'Mystic Arcanum', 'Cast one 6th-level spell once per long rest without a slot (7th at 13th, 8th at 15th, 9th at 17th).'], [20, 'Eldritch Master', 'Spend a minute entreating your patron to regain all pact slots. Once per long rest.']],
    subFeats: [[1, "Dark One's Blessing", 'When you reduce a hostile creature to 0 HP, gain temporary HP equal to your Cha mod + warlock level.'], [6, "Dark One's Own Luck", 'Add a d10 to an ability check or save. Once per short rest.'], [10, 'Fiendish Resilience', 'After a rest, choose a damage type to resist until your next rest.'], [14, 'Hurl Through Hell', 'When you hit, send the target through the lower planes: 10d10 psychic. Once per long rest.']] },
  wizard: { name: 'Wizard', hd: 6, prime: ['int', 'con'], saves: ['int', 'wis'], armor: [], weapons: ['Dagger', 'Dart', 'Sling', 'Quarterstaff', 'Light crossbow'], skills: [2, ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion']], gold: [4, 4, 10],
    blurb: 'A scholar of arcane magic with the biggest spell list. Fragile but versatile.', sub: ['Arcane Tradition', 'School of Evocation', 2],
    cast: { type: 'full', ab: 'int', mode: 'book', list: 'w', cantrips: cantripTable(3, 4, 5), focus: 'Arcane focus (crystal)' },
    kit: [[{ l: 'A quarterstaff', i: ['Quarterstaff'] }, { l: 'A dagger', i: ['Dagger'] }], [{ l: 'A component pouch', i: ['Component pouch'] }, { l: 'An arcane focus', i: ['Arcane focus (crystal)'] }], [{ l: "Scholar's pack", i: ["Scholar's pack"] }, { l: "Explorer's pack", i: ["Explorer's pack"] }], [{ l: 'A spellbook', i: ['Spellbook'] }]],
    feats: [[1, 'Spellcasting', 'Your spellbook holds six 1st-level spells, plus two more each level. Prepare Int mod + level of them each day; cast using Intelligence. Cast rituals from your book without preparing them.'], [1, 'Arcane Recovery', 'Once per day on a short rest, recover spell slots totalling half your wizard level (rounded up), none 6th or higher.'],
      [18, 'Spell Mastery', 'Cast one chosen 1st-level and one 2nd-level spell at will.'], [20, 'Signature Spells', 'Two 3rd-level spells are always prepared and each can be cast once per short rest for free.']],
    subFeats: [[2, 'Evocation Savant', 'Copying evocation spells into your book takes half the gold and time.'], [2, 'Sculpt Spells', 'Choose up to 1 + spell level creatures to automatically succeed on your evocation saves and take no damage.'], [6, 'Potent Cantrip', 'Creatures that succeed on a save against your cantrip still take half damage.'],
      [10, 'Empowered Evocation', 'Add your Int mod to one damage roll of a wizard evocation spell.'], [14, 'Overchannel', 'Deal maximum damage with a spell of 5th level or lower. Repeating it before a long rest hurts you.']] }
};
const CLASS_KEYS = Object.keys(CLASSES5);
const ASI_DEFAULT = [4, 8, 12, 16, 19];

// ---------------------------------------------------------------- conditions
const CONDITIONS = {
  Blinded: 'Can\'t see; fails sight checks. Attacks against you have advantage; yours have disadvantage.', Charmed: 'Can\'t attack the charmer; it has advantage on social checks with you.',
  Deafened: 'Can\'t hear; fails hearing checks.', Frightened: 'Disadvantage on checks and attacks while the source is in sight; can\'t move closer to it.',
  Grappled: 'Speed 0.', Incapacitated: 'No actions or reactions.', Invisible: 'Can\'t be seen without magic. Your attacks have advantage; attacks against you have disadvantage.',
  Paralyzed: 'Incapacitated, can\'t move or speak. Fails Str and Dex saves. Attacks have advantage; hits from within 5 ft are critical.', Petrified: 'Turned to stone: incapacitated, resistant to all damage, fails Str and Dex saves.',
  Poisoned: 'Disadvantage on attack rolls and ability checks.', Prone: 'Crawl only. Disadvantage on attacks; melee attacks against you have advantage, ranged have disadvantage.',
  Restrained: 'Speed 0. Disadvantage on attacks and Dex saves; attacks against you have advantage.', Stunned: 'Incapacitated, can\'t move, speaks falteringly. Fails Str and Dex saves; attacks have advantage.',
  Unconscious: 'Incapacitated, drops what it holds, falls prone. Fails Str and Dex saves; attacks have advantage, and hits from within 5 ft are critical.'
};
const EXHAUSTION = ['None', 'Disadvantage on ability checks', 'Speed halved', 'Disadvantage on attacks and saves', 'Hit point maximum halved', 'Speed 0', 'Death'];

// ---------------------------------------------------------------- spells: name|level|school|classes|time|range|duration|flags|summary
// classes: b bard, c cleric, d druid, p paladin, r ranger, s sorcerer, k warlock, w wizard. flags: c concentration, r ritual
const SCHOOLS = { A: 'Abjuration', C: 'Conjuration', D: 'Divination', E: 'Enchantment', V: 'Evocation', I: 'Illusion', N: 'Necromancy', T: 'Transmutation' };
const SPELL_SRC = `Acid Splash|0|C|sw|1 action|60 ft|Instant||One creature, or two within 5 ft of each other, makes a Dex save or takes 1d6 acid.
Chill Touch|0|N|skw|1 action|120 ft|1 round||Ranged spell attack, 1d8 necrotic. The target can't regain HP until your next turn; undead also have disadvantage to hit you.
Dancing Lights|0|V|bsw|1 action|120 ft|1 minute|c|Up to four torch-like lights (dim light 10 ft) that you can move 60 ft as a bonus action.
Druidcraft|0|T|d|1 action|30 ft|Instant||Small nature tricks: predict tomorrow's weather, bloom a flower, light or snuff a candle.
Eldritch Blast|0|V|k|1 action|120 ft|Instant||Ranged spell attack, 1d10 force per beam. Two beams at 5th level, three at 11th, four at 17th.
Fire Bolt|0|V|sw|1 action|120 ft|Instant||Ranged spell attack, 1d10 fire. Ignites flammable objects nobody is holding.
Guidance|0|D|cd|1 action|Touch|1 minute|c|A willing creature adds 1d4 to one ability check of its choice.
Light|0|V|bcsw|1 action|Touch|1 hour||An object sheds bright light 20 ft and dim light 20 ft beyond.
Mage Hand|0|C|bskw|1 action|30 ft|1 minute||A spectral hand lifts and handles objects up to 10 lb. It can't attack.
Mending|0|T|bcdsw|1 minute|Touch|Instant||Repair a single break or tear up to 1 ft long.
Message|0|T|bsw|1 action|120 ft|1 round||Whisper to a creature; only it hears, and it can whisper back.
Minor Illusion|0|I|bskw|1 action|30 ft|1 minute||A sound or a still image up to a 5-ft cube. An Investigation check against your DC sees through it.
Poison Spray|0|C|dskw|1 action|10 ft|Instant||A creature makes a Con save or takes 1d12 poison.
Prestidigitation|0|T|bskw|1 action|10 ft|Up to 1 hour||Harmless tricks: clean or soil, chill or warm, flavour food, make a small mark or sensory effect.
Produce Flame|0|C|d|1 action|Self|10 minutes||A flame in your hand gives light 10 ft. Hurl it (30 ft) as a ranged spell attack for 1d8 fire.
Ray of Frost|0|V|sw|1 action|60 ft|Instant||Ranged spell attack, 1d8 cold, and the target's speed drops by 10 ft until your next turn.
Resistance|0|A|cd|1 action|Touch|1 minute|c|A willing creature adds 1d4 to one saving throw of its choice.
Sacred Flame|0|V|c|1 action|60 ft|Instant||A creature makes a Dex save or takes 1d8 radiant. Cover doesn't help it.
Shillelagh|0|T|d|1 bonus action|Touch|1 minute||Your club or quarterstaff uses Wisdom for attack and damage, and its damage die becomes a d8.
Shocking Grasp|0|V|sw|1 action|Touch|Instant||Melee spell attack (advantage against metal armour), 1d8 lightning, and the target can't take reactions.
Spare the Dying|0|N|c|1 action|Touch|Instant||A living creature at 0 HP becomes stable.
Thaumaturgy|0|T|c|1 action|30 ft|Up to 1 minute||Minor wonders: a booming voice, tremors, flickering flames, slamming doors, altered eyes.
True Strike|0|D|bskw|1 action|30 ft|1 round|c|Gain advantage on your first attack roll against the target on your next turn.
Vicious Mockery|0|E|b|1 action|60 ft|Instant||A creature that hears you makes a Wis save or takes 1d4 psychic and has disadvantage on its next attack.
Alarm|1|A|rw|1 minute|30 ft|8 hours|r|Ward a door, window or area up to a 20-ft cube; you are alerted when a creature enters.
Animal Friendship|1|E|bdr|1 action|30 ft|24 hours||A beast with Intelligence 3 or less makes a Wis save or is charmed by you.
Bane|1|E|bc|1 action|30 ft|1 minute|c|Up to three creatures make Cha saves or subtract 1d4 from attack rolls and saves.
Bless|1|E|cp|1 action|30 ft|1 minute|c|Up to three creatures add 1d4 to attack rolls and saving throws.
Burning Hands|1|V|sw|1 action|Self (15-ft cone)|Instant||Dex save: 3d6 fire, half on a success. +1d6 per slot level above 1st.
Charm Person|1|E|bdskw|1 action|30 ft|1 hour||A humanoid makes a Wis save (advantage if you are fighting it) or is charmed. It knows afterwards.
Color Spray|1|I|sw|1 action|Self (15-ft cone)|1 round||Blinds creatures in the cone, weakest first, up to 6d10 hit points' worth. +2d10 per slot level above 1st.
Command|1|E|cp|1 action|60 ft|1 round||Speak a one-word command (approach, drop, flee, grovel, halt). Wis save to resist.
Comprehend Languages|1|D|bskw|1 action|Self|1 hour|r|Understand any spoken language you hear and any writing you touch.
Create or Destroy Water|1|T|cd|1 action|30 ft|Instant||Create or destroy up to 10 gallons of water.
Cure Wounds|1|V|bcdpr|1 action|Touch|Instant||A creature regains 1d8 + your spellcasting modifier HP. +1d8 per slot level above 1st.
Detect Evil and Good|1|D|cp|1 action|Self|10 minutes|c|Sense aberrations, celestials, elementals, fey, fiends and undead within 30 ft.
Detect Magic|1|D|bcdprsw|1 action|Self|10 minutes|cr|Sense magic within 30 ft and see its aura and school.
Detect Poison and Disease|1|D|cdpr|1 action|Self|10 minutes|cr|Sense poisons, poisonous creatures and diseases within 30 ft.
Disguise Self|1|I|bsw|1 action|Self|1 hour||Change your appearance and clothes. An Investigation check reveals it.
Divine Favor|1|V|p|1 bonus action|Self|1 minute|c|Your weapon attacks deal an extra 1d4 radiant.
Entangle|1|C|d|1 action|90 ft|1 minute|c|Grasping plants fill a 20-ft square: Str save or restrained. Difficult terrain.
Expeditious Retreat|1|T|skw|1 bonus action|Self|10 minutes|c|Dash as a bonus action on each of your turns.
Faerie Fire|1|V|bd|1 action|60 ft|1 minute|c|Dex save or outlined in light (20-ft cube): attacks against them have advantage and they can't be invisible.
False Life|1|N|sw|1 action|Self|1 hour||Gain 1d4 + 4 temporary HP. +5 per slot level above 1st.
Feather Fall|1|T|bsw|1 reaction|60 ft|1 minute||Up to five falling creatures drift down gently and take no falling damage.
Find Familiar|1|C|w|1 hour|10 ft|Instant|r|Summon a spirit familiar in animal form (cat, owl, raven, bat and the like) that scouts for you and can deliver your touch spells.
Floating Disk|1|C|w|1 action|30 ft|1 hour|r|A 3-ft disk of force carries up to 500 lb and follows you.
Fog Cloud|1|C|drsw|1 action|120 ft|1 hour|c|A 20-ft-radius sphere of thick fog. +20 ft radius per slot level above 1st.
Goodberry|1|T|dr|1 action|Touch|Instant||Ten berries; each restores 1 HP and feeds a creature for a day.
Grease|1|C|w|1 action|60 ft|1 minute||A 10-ft square becomes slick: difficult terrain, Dex save or fall prone.
Guiding Bolt|1|V|c|1 action|120 ft|1 round||Ranged spell attack, 4d6 radiant; the next attack against the target has advantage. +1d6 per slot level above 1st.
Healing Word|1|V|bcd|1 bonus action|60 ft|Instant||A creature regains 1d4 + your spellcasting modifier HP. +1d4 per slot level above 1st.
Hellish Rebuke|1|V|k|1 reaction|60 ft|Instant||When a creature damages you, it makes a Dex save: 2d10 fire, half on a success. +1d10 per slot level above 1st.
Heroism|1|E|bp|1 action|Touch|1 minute|c|The target can't be frightened and gains temporary HP equal to your modifier each turn.
Hideous Laughter|1|E|bw|1 action|30 ft|1 minute|c|Wis save or fall prone with laughter, incapacitated. It saves again each turn and when damaged.
Hunter's Mark|1|D|r|1 bonus action|90 ft|1 hour|c|Your weapon hits on the marked creature deal +1d6, and you track it with advantage. Move the mark when it drops.
Identify|1|D|bw|1 minute|Touch|Instant|r|Learn a magic item's properties and how to use it, or which spells affect a creature.
Illusory Script|1|I|bkw|1 minute|Touch|10 days|r|Write a message only chosen readers can read; others see something else.
Inflict Wounds|1|N|c|1 action|Touch|Instant||Melee spell attack, 3d10 necrotic. +1d10 per slot level above 1st.
Jump|1|T|drsw|1 action|Touch|1 minute||The target's jump distance triples.
Longstrider|1|T|bdrw|1 action|Touch|1 hour||The target's speed increases by 10 ft.
Mage Armor|1|A|sw|1 action|Touch|8 hours||An unarmoured creature's AC becomes 13 + its Dex modifier.
Magic Missile|1|V|sw|1 action|120 ft|Instant||Three darts that never miss, each 1d4 + 1 force. +1 dart per slot level above 1st.
Protection from Evil and Good|1|A|ckpw|1 action|Touch|10 minutes|c|Aberrations, celestials, elementals, fey, fiends and undead have disadvantage against the target and can't charm, frighten or possess it.
Purify Food and Drink|1|T|cdp|1 action|10 ft|Instant|r|Remove poison and disease from food and drink in a 5-ft sphere.
Sanctuary|1|A|c|1 bonus action|30 ft|1 minute||Anyone attacking the warded creature must first pass a Wis save. Ends if it attacks.
Shield|1|A|sw|1 reaction|Self|1 round||+5 AC until your next turn, including against the attack that triggered it.
Shield of Faith|1|A|cp|1 bonus action|60 ft|10 minutes|c|A creature gains +2 AC.
Silent Image|1|I|bsw|1 action|60 ft|10 minutes|c|A silent visual illusion up to a 15-ft cube that you can move.
Sleep|1|E|bsw|1 action|90 ft|1 minute||Creatures in a 20-ft radius fall asleep, weakest first, up to 5d8 hit points' worth. +2d8 per slot level above 1st.
Speak with Animals|1|D|bdr|1 action|Self|10 minutes|r|Talk with beasts.
Thunderwave|1|V|bdsw|1 action|Self (15-ft cube)|Instant||Con save: 2d8 thunder and pushed 10 ft; half and no push on a success. +1d8 per slot level above 1st.
Unseen Servant|1|C|bkw|1 action|60 ft|1 hour|r|An invisible force does simple chores for you.
Acid Arrow|2|V|w|1 action|90 ft|Instant||Ranged spell attack: 4d4 acid now and 2d4 at the end of its next turn (half on a miss, nothing later).
Aid|2|A|cp|1 action|30 ft|8 hours||Up to three creatures gain 5 to their maximum and current HP. +5 per slot level above 2nd.
Alter Self|2|T|sw|1 action|Self|1 hour|c|Reshape yourself: breathe underwater, grow natural weapons (1d6), or change your looks.
Animal Messenger|2|E|bdr|1 action|30 ft|24 hours|r|A Tiny beast carries a 25-word message to a place you describe.
Arcane Lock|2|A|w|1 action|Touch|Until dispelled||Magically lock a door, window or chest; you choose who may open it.
Arcanist's Magic Aura|2|I|w|1 action|Touch|24 hours||Hide or falsify the magical aura of a creature or object.
Augury|2|D|c|1 minute|Self|Instant|r|Learn whether a plan in the next 30 minutes brings weal, woe, both or nothing.
Barkskin|2|T|dr|1 action|Touch|1 hour|c|The target's AC can't be lower than 16.
Blindness/Deafness|2|N|bcsw|1 action|30 ft|1 minute||Con save or blinded or deafened (your choice). It saves again each turn.
Blur|2|I|sw|1 action|Self|1 minute|c|Attackers have disadvantage against you unless they don't rely on sight.
Calm Emotions|2|E|bc|1 action|60 ft|1 minute|c|In a 20-ft sphere (Cha save), suppress charm and fear, or make hostile creatures indifferent.
Continual Flame|2|V|cw|1 action|Touch|Until dispelled||A heatless flame as bright as a torch that never goes out.
Darkness|2|V|skw|1 action|60 ft|10 minutes|c|Magical darkness fills a 15-ft sphere; darkvision can't see through it.
Darkvision|2|T|drsw|1 action|Touch|8 hours||The target gains darkvision to 60 ft.
Detect Thoughts|2|D|bsw|1 action|Self|1 minute|c|Read surface thoughts within 30 ft, or probe deeper if the creature fails a Wis save.
Enhance Ability|2|T|bcds|1 action|Touch|1 hour|c|Advantage on checks with one ability, plus a bonus (e.g. 2d6 temporary HP for Constitution).
Enlarge/Reduce|2|T|sw|1 action|30 ft|1 minute|c|Double or halve a creature's size; its weapon damage gains or loses 1d4.
Enthrall|2|E|bk|1 action|60 ft|1 minute||Creatures that fail a Wis save have disadvantage on Perception to notice anyone but you.
Find Steed|2|C|p|10 minutes|30 ft|Instant||Summon a loyal spirit mount: a warhorse, pony, camel, elk or mastiff.
Find Traps|2|D|cdr|1 action|120 ft|Instant||Sense whether there are traps within sight (not exactly where).
Flame Blade|2|V|d|1 bonus action|Self|10 minutes|c|A fiery scimitar in your hand: melee spell attack, 3d6 fire.
Flaming Sphere|2|C|dw|1 action|60 ft|1 minute|c|A 5-ft ball of fire: Dex save or 2d6 fire to creatures it ends next to. Move it 30 ft as a bonus action.
Gentle Repose|2|N|cw|1 action|Touch|10 days|r|A corpse can't decay or rise as undead.
Gust of Wind|2|V|dsw|1 action|Self (60-ft line)|1 minute|c|A strong wind: Str save or pushed 15 ft. It scatters gas and puts out flames.
Heat Metal|2|T|bd|1 action|60 ft|1 minute|c|A metal object glows red-hot: 2d8 fire to anyone touching it. Bonus action to repeat.
Hold Person|2|E|bcdskw|1 action|60 ft|1 minute|c|A humanoid makes a Wis save or is paralyzed. It saves again each turn.
Invisibility|2|I|bskw|1 action|Touch|1 hour|c|The target turns invisible until it attacks or casts a spell.
Knock|2|T|bsw|1 action|60 ft|Instant||Unlock a lock, bar or seal. A loud knock is heard 300 ft away.
Lesser Restoration|2|A|bcdpr|1 action|Touch|Instant||End a disease, or the blinded, deafened, paralyzed or poisoned condition.
Levitate|2|T|sw|1 action|60 ft|10 minutes|c|A creature or object up to 500 lb rises up to 20 ft (Con save to resist).
Locate Animals or Plants|2|D|bdr|1 action|Self|Instant|r|Learn the direction and distance of a kind of beast or plant within 5 miles.
Locate Object|2|D|bcdprw|1 action|Self|10 minutes|c|Sense the direction of an object you know within 1,000 ft.
Magic Mouth|2|I|bw|1 minute|30 ft|Until dispelled|r|An object speaks a message when a trigger happens.
Magic Weapon|2|T|pw|1 bonus action|Touch|1 hour|c|A nonmagical weapon becomes a +1 weapon.
Mirror Image|2|I|skw|1 action|Self|1 minute||Three illusory duplicates may take attacks meant for you.
Misty Step|2|C|skw|1 bonus action|Self|Instant||Teleport up to 30 ft to a space you can see.
Moonbeam|2|V|d|1 action|120 ft|1 minute|c|A 5-ft beam of moonlight: Con save or 2d10 radiant when a creature enters or starts its turn there.
Pass without Trace|2|A|dr|1 action|Self|1 hour|c|You and allies within 30 ft gain +10 to Stealth and leave no tracks.
Prayer of Healing|2|V|c|10 minutes|30 ft|Instant||Up to six creatures each regain 2d8 + your modifier HP.
Protection from Poison|2|A|cdpr|1 action|Touch|1 hour||Neutralise one poison; advantage on saves against poison and resistance to poison damage.
Ray of Enfeeblement|2|N|kw|1 action|60 ft|1 minute|c|Ranged spell attack: the target deals half damage with Strength weapon attacks.
Rope Trick|2|T|w|1 action|Touch|1 hour||A rope rises to a hidden space where eight creatures can hide.
Scorching Ray|2|V|sw|1 action|120 ft|Instant||Three rays, each a ranged spell attack for 2d6 fire. +1 ray per slot level above 2nd.
See Invisibility|2|D|bsw|1 action|Self|1 hour||See invisible creatures and objects, and into the Ethereal Plane.
Shatter|2|V|bskw|1 action|60 ft|Instant||Con save: 3d8 thunder in a 10-ft sphere, half on a success. +1d8 per slot level above 2nd.
Silence|2|I|bcr|1 action|120 ft|10 minutes|cr|No sound in a 20-ft sphere; spells with verbal components can't be cast there.
Spider Climb|2|T|skw|1 action|Touch|1 hour|c|The target can climb walls and ceilings with free hands.
Spike Growth|2|T|dr|1 action|150 ft|10 minutes|c|Hidden thorns in a 20-ft radius: 2d4 piercing for every 5 ft moved.
Spiritual Weapon|2|V|c|1 bonus action|60 ft|1 minute||A floating weapon: melee spell attack, 1d8 + your modifier force. Bonus action to attack again.
Suggestion|2|E|bskw|1 action|30 ft|8 hours|c|Suggest a reasonable course of action; on a failed Wis save the target follows it.
Warding Bond|2|A|c|1 action|Touch|1 hour||An ally gets +1 AC and saves and resistance to all damage; you take the same damage it does.
Web|2|C|sw|1 action|60 ft|1 hour|c|Sticky webs fill a 20-ft cube: Dex save or restrained. Difficult terrain.
Zone of Truth|2|E|bcp|1 action|60 ft|10 minutes||Creatures in a 15-ft sphere that fail a Cha save can't deliberately lie.
Animate Dead|3|N|cw|1 minute|10 ft|Instant||Raise a skeleton or zombie that obeys you for 24 hours.
Beacon of Hope|3|A|c|1 action|30 ft|1 minute|c|Allies have advantage on Wisdom and death saves and regain the most possible HP from healing.
Bestow Curse|3|N|bcw|1 action|Touch|1 minute|c|Wis save or cursed: disadvantage with one ability, wasted turns, or 1d8 extra necrotic from your attacks.
Blink|3|T|sw|1 action|Self|1 minute||At the end of each turn roll a d20: on 11+ you vanish to the Ethereal Plane until your next turn.
Call Lightning|3|C|d|1 action|120 ft|10 minutes|c|A storm cloud's bolts: Dex save, 3d10 lightning in a 5-ft radius. Call another each turn.
Clairvoyance|3|D|bcsw|10 minutes|1 mile|10 minutes|c|An invisible sensor lets you see or hear a place you know.
Conjure Animals|3|C|dr|1 action|60 ft|1 hour|c|Fey spirits appear as beasts: one CR 2, two CR 1, four CR 1/2 or eight CR 1/4.
Counterspell|3|A|skw|1 reaction|60 ft|Instant||Stop a spell of 3rd level or lower; for higher, roll your ability check against DC 10 + its level.
Create Food and Water|3|C|cp|1 action|30 ft|Instant||Enough food and water for fifteen people or five mounts for a day.
Daylight|3|V|cdprs|1 action|60 ft|1 hour||A 60-ft sphere of bright light that dispels magical darkness of 3rd level or lower.
Dispel Magic|3|A|bcdpskw|1 action|120 ft|Instant||End spells of 3rd level or lower on a target; for higher, check against DC 10 + its level.
Feign Death|3|N|bcdw|1 action|Touch|1 hour|r|A willing creature appears dead: blinded, incapacitated, resistant to all damage but psychic.
Fear|3|I|bskw|1 action|Self (30-ft cone)|1 minute|c|Wis save or drop what it holds and flee, frightened.
Fireball|3|V|sw|1 action|150 ft|Instant||Dex save: 8d6 fire in a 20-ft radius, half on a success. +1d6 per slot level above 3rd.
Fly|3|T|skw|1 action|Touch|10 minutes|c|The target gains a flying speed of 60 ft.
Gaseous Form|3|T|skw|1 action|Touch|1 hour|c|The target turns into a slow-flying mist that slips through cracks.
Glyph of Warding|3|A|bcw|1 hour|Touch|Until triggered||A hidden glyph that explodes (5d8, Dex save) or releases a stored spell when triggered.
Haste|3|T|sw|1 action|30 ft|1 minute|c|Double speed, +2 AC, advantage on Dex saves and an extra limited action. Lethargic for a turn when it ends.
Hypnotic Pattern|3|I|bskw|1 action|120 ft|1 minute|c|Creatures in a 30-ft cube make a Wis save or are charmed and incapacitated.
Lightning Bolt|3|V|sw|1 action|Self (100-ft line)|Instant||Dex save: 8d6 lightning in a 100 by 5 ft line, half on a success. +1d6 per slot level above 3rd.
Magic Circle|3|A|ckpw|1 minute|10 ft|1 hour||A cylinder that one creature type can't willingly enter or attack across.
Major Image|3|I|bskw|1 action|120 ft|10 minutes|c|An illusion up to a 20-ft cube with sound, smell and temperature.
Mass Healing Word|3|V|c|1 bonus action|60 ft|Instant||Up to six creatures regain 1d4 + your modifier HP.
Meld into Stone|3|T|cd|1 action|Touch|8 hours|r|Step into a stone surface with your gear.
Nondetection|3|A|brw|1 action|Touch|8 hours||Hide a target from divination magic.
Phantom Steed|3|I|w|1 minute|30 ft|1 hour|r|A quasi-real horse with a speed of 100 ft.
Plant Growth|3|T|bdr|1 action or 8 hours|150 ft|Instant||Overgrowth makes a 100-ft area cost 4 ft per foot moved, or enriches crops for a year.
Protection from Energy|3|A|cdrsw|1 action|Touch|1 hour|c|The target resists acid, cold, fire, lightning or thunder (your choice).
Remove Curse|3|A|ckpw|1 action|Touch|Instant||End all curses on a creature or object.
Revivify|3|N|cp|1 action|Touch|Instant||Return a creature that died in the last minute to life with 1 HP (300 gp of diamonds).
Sending|3|V|bcw|1 action|Unlimited|1 round||Send a 25-word message to a creature you know; it can reply.
Sleet Storm|3|C|dsw|1 action|150 ft|1 minute|c|Sleet in a 40-ft cylinder: difficult terrain, Dex save or prone, and it breaks concentration.
Slow|3|T|sw|1 action|120 ft|1 minute|c|Up to six creatures (Wis save): half speed, −2 AC and Dex saves, and limited actions.
Speak with Dead|3|N|bc|1 action|10 ft|10 minutes||A corpse answers up to five questions.
Speak with Plants|3|T|bdr|1 action|Self|10 minutes||Plants within 30 ft understand you and can answer.
Spirit Guardians|3|C|c|1 action|Self (15-ft radius)|10 minutes|c|Spirits halve enemies' speed near you; Wis save or 3d8 radiant (necrotic if evil). +1d8 per slot level above 3rd.
Stinking Cloud|3|C|bsw|1 action|90 ft|1 minute|c|A 20-ft sphere of gas: Con save or spend the action retching.
Tiny Hut|3|V|bw|1 minute|Self (10-ft hemisphere)|8 hours|r|A dome of force that shelters up to nine creatures.
Tongues|3|D|bcskw|1 action|Touch|1 hour||The target understands and speaks any language.
Vampiric Touch|3|N|kw|1 action|Self|1 minute|c|Melee spell attack, 3d6 necrotic, and you heal half. Repeat on later turns.
Water Breathing|3|T|drsw|1 action|30 ft|24 hours|r|Up to ten creatures can breathe underwater.
Water Walk|3|T|cdrs|1 action|30 ft|1 hour|r|Up to ten creatures can walk on liquid.
Wind Wall|3|V|dr|1 action|120 ft|1 minute|c|A wall of wind: Str save, 3d8 bludgeoning. It blocks arrows and gas.
Arcane Eye|4|D|w|1 action|30 ft|1 hour|c|An invisible floating eye with darkvision that you see through.
Banishment|4|A|cpskw|1 action|60 ft|1 minute|c|Cha save or banished; a creature from another plane may not return.
Black Tentacles|4|C|w|1 action|90 ft|1 minute|c|Tentacles in a 20-ft square: Dex save or restrained and 3d6 bludgeoning each turn.
Blight|4|N|dskw|1 action|30 ft|Instant||Con save: 8d8 necrotic, half on a success. Plants take the maximum.
Compulsion|4|E|b|1 action|30 ft|1 minute|c|Wis save or it must move in a direction you choose each turn.
Confusion|4|E|bdsw|1 action|90 ft|1 minute|c|Creatures in a 10-ft sphere make a Wis save or act at random each turn.
Conjure Minor Elementals|4|C|dw|1 minute|90 ft|1 hour|c|Summon elementals: one CR 2, two CR 1, four CR 1/2 or eight CR 1/4.
Conjure Woodland Beings|4|C|dr|1 action|60 ft|1 hour|c|Summon fey: one CR 2, two CR 1, four CR 1/2 or eight CR 1/4.
Control Water|4|T|cdw|1 action|300 ft|10 minutes|c|Flood, part, redirect or whirl water in a 100-ft cube.
Death Ward|4|A|cp|1 action|Touch|8 hours||The first time the target would drop to 0 HP, it drops to 1 instead.
Dimension Door|4|C|bskw|1 action|500 ft|Instant||Teleport up to 500 ft, with one willing creature if you like.
Divination|4|D|c|1 action|Self|Instant|r|Ask your god one question about something within the next seven days.
Dominate Beast|4|E|ds|1 action|60 ft|1 minute|c|A beast makes a Wis save or is charmed and obeys you.
Fabricate|4|T|w|10 minutes|120 ft|Instant||Turn raw materials into finished goods.
Faithful Hound|4|C|w|1 action|30 ft|8 hours||An invisible watchdog barks at intruders and bites (4d8 piercing).
Fire Shield|4|V|w|1 action|Self|10 minutes||Resist cold or fire; melee attackers who hit you take 2d8 fire or cold.
Freedom of Movement|4|A|bcdr|1 action|Touch|1 hour||The target ignores difficult terrain and can't be paralyzed or restrained by magic.
Giant Insect|4|T|d|1 action|30 ft|10 minutes|c|Turn up to ten centipedes, three spiders, five wasps or one scorpion into giant versions.
Greater Invisibility|4|I|bsw|1 action|Touch|1 minute|c|The target stays invisible even when it attacks or casts.
Guardian of Faith|4|C|c|1 action|30 ft|8 hours||A spectral guardian: enemies coming near make a Dex save or take 20 radiant (60 in all).
Hallucinatory Terrain|4|I|bdkw|10 minutes|300 ft|24 hours||Make a 150-ft cube of land look, sound and smell like other terrain.
Ice Storm|4|V|dsw|1 action|300 ft|Instant||Dex save: 2d8 bludgeoning and 4d6 cold in a 20-ft cylinder; the ground turns icy.
Locate Creature|4|D|bcdprw|1 action|Self|1 hour|c|Sense the direction of a creature you know within 1,000 ft.
Phantasmal Killer|4|I|w|1 action|120 ft|1 minute|c|Wis save or frightened, taking 4d10 psychic at the end of each of its turns.
Polymorph|4|T|bdsw|1 action|60 ft|1 hour|c|Wis save or transformed into a beast of CR no higher than its level.
Private Sanctum|4|A|w|10 minutes|120 ft|24 hours||Ward an area against scrying, teleporting and eavesdropping.
Resilient Sphere|4|V|w|1 action|30 ft|1 minute|c|Dex save or sealed inside an unbreakable sphere of force.
Secret Chest|4|C|w|1 action|Touch|Instant||Hide a chest on the Ethereal Plane and call it back with a small replica.
Stone Shape|4|T|cdw|1 action|Touch|Instant||Reshape a 5-ft cube of stone.
Stoneskin|4|A|drsw|1 action|Touch|1 hour|c|Resistance to nonmagical bludgeoning, piercing and slashing (100 gp of diamond dust).
Wall of Fire|4|V|dsw|1 action|120 ft|1 minute|c|A wall of flame: Dex save, 5d8 fire; creatures ending turns near the hot side burn too.
Animate Objects|5|T|bsw|1 action|120 ft|1 minute|c|Up to ten small objects come to life and fight for you.
Antilife Shell|5|A|d|1 action|Self (10-ft radius)|1 hour|c|Living creatures other than constructs and undead can't pass the barrier.
Awaken|5|T|bd|8 hours|Touch|Instant||A beast or tree gains Intelligence 10 and the power of speech.
Cloudkill|5|C|sw|1 action|120 ft|10 minutes|c|A drifting 20-ft fog: Con save, 5d8 poison, half on a success.
Commune|5|D|c|1 minute|Self|1 minute|r|Ask your god three yes-or-no questions.
Commune with Nature|5|D|dr|1 minute|Self|Instant|r|Learn three facts about the land within 3 miles.
Cone of Cold|5|V|sw|1 action|Self (60-ft cone)|Instant||Con save: 8d8 cold, half on a success.
Conjure Elemental|5|C|dw|1 minute|90 ft|1 hour|c|Summon an elemental of CR 5 or lower.
Contact Other Plane|5|D|kw|1 minute|Self|1 minute|r|Ask an otherworldly being five questions, risking madness (Int save DC 15).
Contagion|5|N|cd|1 action|Touch|7 days||A melee spell attack infects the target with a magical disease.
Creation|5|I|sw|1 minute|30 ft|Special||Make a nonliving object up to a 5-ft cube out of shadow-stuff.
Dispel Evil and Good|5|A|cp|1 action|Self|1 minute|c|Ward against otherworldly creatures, break their enchantments, or banish one.
Dominate Person|5|E|bsw|1 action|60 ft|1 minute|c|A humanoid makes a Wis save or is charmed and obeys you.
Dream|5|I|bkw|1 minute|Special|8 hours||Speak to a sleeper in a dream, or haunt it (3d6 psychic).
Flame Strike|5|V|c|1 action|60 ft|Instant||Dex save: 4d6 fire and 4d6 radiant in a 10-ft cylinder, half on a success.
Geas|5|E|bcdpw|1 minute|60 ft|30 days||Wis save or bound to obey your command; 5d10 psychic each day it defies you.
Greater Restoration|5|A|bcd|1 action|Touch|Instant||End a charm, petrification, curse, ability or maximum HP drain, or one level of exhaustion.
Hallow|5|V|c|24 hours|Touch|Until dispelled||Consecrate a 60-ft area against otherworldly creatures, with an extra effect.
Hold Monster|5|E|bskw|1 action|90 ft|1 minute|c|Any creature makes a Wis save or is paralyzed.
Insect Plague|5|C|cds|1 action|300 ft|10 minutes|c|Locusts in a 20-ft sphere: Con save, 4d10 piercing.
Legend Lore|5|D|bcw|10 minutes|Self|Instant||Learn legends about a person, place or object.
Mass Cure Wounds|5|V|bcd|1 action|60 ft|Instant||Up to six creatures in a 30-ft sphere regain 3d8 + your modifier HP.
Mislead|5|I|bw|1 action|Self|1 hour|c|You turn invisible while an illusory double of you appears.
Modify Memory|5|E|bw|1 action|30 ft|1 minute|c|Wis save or you reshape its memory of an event.
Passwall|5|T|w|1 action|30 ft|1 hour||Open a passage through wood, plaster or stone.
Planar Binding|5|A|bcdkw|1 hour|60 ft|24 hours||Bind a celestial, elemental, fey or fiend to serve you (Cha save).
Raise Dead|5|N|bcp|1 hour|Touch|Instant||Return a creature dead up to 10 days to life (a 500 gp diamond).
Scrying|5|D|bcdkw|10 minutes|Self|10 minutes|c|See and hear a chosen creature anywhere (Wis save).
Seeming|5|I|bsw|1 action|30 ft|8 hours||Change the appearance of any number of creatures.
Telekinesis|5|T|sw|1 action|60 ft|10 minutes|c|Move creatures or objects up to 1,000 lb with your mind.
Telepathic Bond|5|D|w|1 action|30 ft|1 hour|r|Up to eight willing creatures share thoughts at any distance.
Teleportation Circle|5|C|bsw|1 minute|10 ft|1 round||Open a portal to a permanent teleportation circle you know.
Tree Stride|5|C|dr|1 action|Self|1 minute|c|Step into one tree and out of another within 500 ft.
Wall of Force|5|V|w|1 action|120 ft|10 minutes|c|An invisible wall of force that nothing can pass.
Wall of Stone|5|V|dsw|1 action|120 ft|10 minutes|c|A wall of ten 10-ft stone panels; permanent if held for the full time.
Blade Barrier|6|V|c|1 action|90 ft|10 minutes|c|A wall of whirling blades: Dex save, 6d10 slashing.
Chain Lightning|6|V|sw|1 action|150 ft|Instant||Lightning strikes a target and leaps to three more: Dex save, 10d8 lightning each.
Circle of Death|6|N|skw|1 action|150 ft|Instant||Con save: 8d6 necrotic in a 60-ft sphere.
Conjure Fey|6|C|dk|1 minute|90 ft|1 hour|c|Summon a fey creature of CR 6 or lower.
Contingency|6|V|w|10 minutes|Self|10 days||Store a spell of 5th level or lower to go off when a condition is met.
Create Undead|6|N|ckw|1 minute|10 ft|Instant||Raise up to three ghouls under your control.
Disintegrate|6|T|sw|1 action|60 ft|Instant||Dex save or 10d6 + 40 force; anything reduced to 0 HP turns to dust.
Eyebite|6|N|bskw|1 action|Self|1 minute|c|Each turn one creature makes a Wis save or falls asleep, panics or sickens.
Find the Path|6|D|bcd|1 minute|Self|1 day|c|Know the most direct route to a fixed place.
Flesh to Stone|6|T|kw|1 action|60 ft|1 minute|c|Con saves or the target slowly turns to stone.
Forbiddance|6|A|c|10 minutes|Touch|1 day|r|Block teleporting into an area and harm chosen creature types there.
Globe of Invulnerability|6|A|sw|1 action|Self (10-ft radius)|1 minute|c|Spells of 5th level or lower can't affect anything inside.
Guards and Wards|6|A|bw|10 minutes|Touch|24 hours||Ward a building with fog, webs, locked doors and confusing corridors.
Harm|6|N|c|1 action|60 ft|Instant||Con save: 14d6 necrotic and reduced maximum HP.
Heal|6|V|cd|1 action|60 ft|Instant||A creature regains 70 HP and is cured of blindness, deafness and disease.
Heroes' Feast|6|C|cd|10 minutes|30 ft|Instant||Twelve diners are cured, immune to poison and fear, and gain 2d10 maximum HP for a day.
Instant Summons|6|C|w|1 minute|Touch|Until dispelled|r|Mark an object so you can call it to your hand.
Irresistible Dance|6|E|bw|1 action|30 ft|1 minute|c|The target dances helplessly (it gets no save at first).
Magic Jar|6|N|w|1 minute|Self|Until dispelled||Move your soul into a container and possess other bodies.
Mass Suggestion|6|E|bskw|1 action|60 ft|24 hours||Suggest a course of action to up to twelve creatures.
Move Earth|6|T|dsw|1 action|120 ft|2 hours|c|Reshape earth in a 40-ft square.
Planar Ally|6|C|c|10 minutes|60 ft|Instant||Ask your god to send an otherworldly servant, for a price.
Programmed Illusion|6|I|bw|1 action|120 ft|Until dispelled||An illusion that plays out when triggered.
Sunbeam|6|V|dsw|1 action|Self (60-ft line)|1 minute|c|Con save: 6d8 radiant and blinded. Fire another beam each turn.
Transport via Plants|6|C|d|1 action|10 ft|1 round||Step into one plant and out of another anywhere on the same plane.
True Seeing|6|D|bcskw|1 action|Touch|1 hour||See through illusions and invisibility and into the Ethereal Plane within 120 ft.
Wall of Ice|6|V|w|1 action|120 ft|10 minutes|c|A wall of ice: Dex save, 10d6 cold. Freezing air where it is broken.
Wall of Thorns|6|C|d|1 action|120 ft|10 minutes|c|A wall of thorny brush: Dex save, 7d8 piercing; pushing through hurts.
Wind Walk|6|T|d|1 minute|30 ft|8 hours||Up to ten creatures become clouds that fly 300 ft.
Word of Recall|6|C|c|1 action|5 ft|Instant||You and up to five others teleport to your sanctuary.
Arcane Sword|7|V|bw|1 action|60 ft|1 minute|c|A floating sword: melee spell attack, 3d10 force.
Delayed Blast Fireball|7|V|sw|1 action|150 ft|1 minute|c|A fireball (12d6) that grows by 1d6 each turn you hold it back.
Divine Word|7|V|c|1 bonus action|30 ft|Instant||Creatures that fail a Cha save are deafened, blinded, stunned or killed, depending on their HP.
Etherealness|7|T|bcskw|1 action|Self|8 hours||Step into the Ethereal Plane.
Finger of Death|7|N|skw|1 action|60 ft|Instant||Con save: 7d8 + 30 necrotic. A humanoid killed rises as your zombie.
Fire Storm|7|V|cds|1 action|150 ft|Instant||Dex save: 7d10 fire across ten 10-ft cubes.
Forcecage|7|V|bkw|1 action|100 ft|1 hour||An invisible cage or box of force (1,500 gp of ruby dust).
Magnificent Mansion|7|C|bw|1 minute|300 ft|24 hours||A hidden mansion with servants and a feast.
Mirage Arcane|7|I|bdw|10 minutes|Sight|10 days||Make a square mile of terrain look, sound and feel different.
Plane Shift|7|C|cdskw|1 action|Touch|Instant||Travel to another plane, or banish a creature (Cha save).
Prismatic Spray|7|V|sw|1 action|Self (60-ft cone)|Instant||Seven-coloured rays: each creature suffers a random effect (Dex save).
Project Image|7|I|bkw|1 action|500 miles|1 day|c|An illusory copy of you that speaks for you and that you see through.
Regenerate|7|T|bcd|1 minute|Touch|1 hour||Heal 4d8 + 15, then 1 HP each turn; lost limbs regrow.
Resurrection|7|N|bc|1 hour|Touch|Instant||Return a creature dead up to a century to life (a 1,000 gp diamond).
Reverse Gravity|7|T|dsw|1 action|100 ft|1 minute|c|Gravity reverses in a 50-ft cylinder.
Sequester|7|T|w|1 action|Touch|Until dispelled||Hide a creature or object from divination; creatures sleep in suspended animation.
Simulacrum|7|I|w|12 hours|Touch|Until dispelled||A half-strength duplicate of a creature that obeys you.
Symbol|7|A|bcw|1 minute|Touch|Until triggered||A glyph that unleashes death, discord, fear, pain, sleep or stunning.
Teleport|7|C|bsw|1 action|10 ft|Instant||Teleport yourself and up to eight others to a place you know.
Animal Shapes|8|T|d|1 action|30 ft|24 hours|c|Turn willing creatures into beasts of CR 4 or lower.
Antimagic Field|8|A|cw|1 action|Self (10-ft radius)|1 hour|c|Magic stops working inside the sphere.
Antipathy/Sympathy|8|E|dw|1 hour|60 ft|10 days||An object or area repels or attracts one kind of creature.
Clone|8|N|w|1 hour|Touch|Instant||Grow an inert duplicate that takes your soul if you die.
Control Weather|8|T|cdw|10 minutes|Self (5-mile radius)|8 hours|c|Change the rain, temperature and wind across 5 miles.
Demiplane|8|C|kw|1 action|60 ft|1 hour||Open a door to an empty 30-ft room in another dimension.
Dominate Monster|8|E|bskw|1 action|60 ft|1 hour|c|Any creature makes a Wis save or is charmed and obeys you.
Earthquake|8|V|cds|1 action|500 ft|1 minute|c|A 100-ft quake knocks creatures prone and topples buildings.
Feeblemind|8|E|bdkw|1 action|150 ft|Instant||Int save: 4d6 psychic, and Intelligence and Charisma drop to 1.
Glibness|8|T|bk|1 action|Self|1 hour||Charisma check rolls below 15 count as 15; magic reads you as truthful.
Holy Aura|8|A|c|1 action|Self|1 minute|c|Allies within 30 ft gain advantage on saves; attackers have disadvantage.
Incendiary Cloud|8|C|sw|1 action|150 ft|1 minute|c|A drifting 20-ft cloud of embers: Dex save, 10d8 fire.
Maze|8|C|w|1 action|60 ft|10 minutes|c|Banish a creature into a labyrinth (Int check DC 20 to escape).
Mind Blank|8|A|bw|1 action|Touch|24 hours||Immune to psychic damage, mind reading, divination and charm.
Power Word Stun|8|E|bskw|1 action|60 ft|Instant||A creature with 150 HP or fewer is stunned.
Sunburst|8|V|dsw|1 action|150 ft|Instant||Con save: 12d6 radiant and blinded in a 60-ft radius.
Astral Projection|9|N|ckw|1 hour|10 ft|Special||You and up to eight others travel the Astral Plane.
Foresight|9|D|bdkw|1 minute|Touch|8 hours||Advantage on attacks, checks and saves; attackers have disadvantage.
Gate|9|C|csw|1 action|60 ft|1 minute|c|Open a portal to another plane, or call a named creature through.
Imprisonment|9|A|kw|1 minute|30 ft|Until dispelled||Wis save or bound in a magical prison of your choosing.
Mass Heal|9|V|c|1 action|60 ft|Instant||Restore up to 700 HP split among creatures you choose.
Meteor Swarm|9|V|sw|1 action|1 mile|Instant||Four meteors: Dex save, 20d6 fire and 20d6 bludgeoning each.
Power Word Kill|9|E|bskw|1 action|60 ft|Instant||A creature with 100 HP or fewer dies.
Prismatic Wall|9|A|w|1 action|60 ft|10 minutes||A shimmering wall of seven harmful layers of light.
Shapechange|9|T|dw|1 action|Self|1 hour|c|Become any creature of CR up to your level.
Storm of Vengeance|9|C|d|1 action|Sight|1 minute|c|A vast storm with thunder, acid rain, lightning and hail.
Time Stop|9|T|sw|1 action|Self|Instant||Take 1d4 + 1 turns in a row while time stands still.
True Polymorph|9|T|bkw|1 action|30 ft|1 hour|c|Turn a creature or object into another creature or object.
True Resurrection|9|N|cd|1 hour|Touch|Instant||Restore a creature dead up to 200 years, even without its body.
Weird|9|I|w|1 action|120 ft|1 minute|c|Phantasmal terrors: Wis save or frightened and 4d10 psychic each turn.
Wish|9|C|sw|1 action|Self|Instant||Copy any spell of 8th level or lower, or reshape reality itself.`;
const SPELLS = SPELL_SRC.split('\n').map((l) => { const [name, lv, sc, cl, time, range, dur, fl, text] = l.split('|'); return { name, lv: +lv, school: SCHOOLS[sc], cls: cl, time, range, dur, conc: fl.includes('c'), ritual: fl.includes('r'), text }; });
const SPELL_BY = new Map(SPELLS.map((s) => [s.name, s]));
// cantrip attacks: [kind 'atk'|'save', ability for save, damage die, damage type, extra]
const CANTRIP_ATK = {
  'Fire Bolt': ['atk', '', 'd10', 'fire'], 'Ray of Frost': ['atk', '', 'd8', 'cold'], 'Chill Touch': ['atk', '', 'd8', 'necrotic'], 'Shocking Grasp': ['atk', '', 'd8', 'lightning', 'melee'],
  'Produce Flame': ['atk', '', 'd8', 'fire'], 'Eldritch Blast': ['atk', '', 'd10', 'force', 'beams'], 'Acid Splash': ['save', 'dex', 'd6', 'acid'], 'Poison Spray': ['save', 'con', 'd12', 'poison'],
  'Sacred Flame': ['save', 'dex', 'd8', 'radiant'], 'Vicious Mockery': ['save', 'wis', 'd4', 'psychic']
};
