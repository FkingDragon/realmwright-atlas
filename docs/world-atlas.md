# Realmwright Atlas: how the world map works

Artifact: "Realmwright Atlas" (single HTML page). Map, live market, people tracker, guilds and the Heroes character creator share one world and one calendar.

## World model
- World is 4,096 x 2,560 miles. All coordinates are in miles; 1 ft = 1/5280 mi. Battle squares are 5 ft.
- Everything is generated from one integer seed. Same seed = same world.
- Terrain: simplex-noise elevation (domain-warped fbm + ridged mountains), moisture and temperature (latitude + altitude lapse). Detail octaves are added only when visible, so coastlines, rivers and biome edges stay ragged at every zoom.
- Biomes: deep ocean, sea, shallows, pack ice, beach, grassland, temperate forest, taiga, jungle, swamp, desert, scrub, tundra, snowfield, mountains, snowcapped peaks, river.
- Rivers are channels in a noise field, widening toward the sea and tapering to headwaters in the hills.

## Zoom levels
World -> Realm -> Region -> Town & countryside -> Battle map (5-ft grid). Terrain is drawn as 256-px tiles (zoom levels 0-20) in background workers. Mountain/tree symbols appear at realm-region scale; real tree canopies, bushes and rocks at close scale; full street plans with buildings, walls, temples, keeps, market stalls, fields and trees when zoomed into a settlement (see Town layouts). Past street level the map cross-fades into the pixel-art battle map (see Battle map, v22).

## Size classes and civic life (v16)
- By population (5e guide): Hamlet under 300, Village 300-999, Town 1,000-7,999, City 8,000-24,999, Metropolis 25,000+. Capital is a role (tier 4); generated capitals are 25,000-90,000 so all are metropolises. Map tier follows population on edit (1 below 1,000, 2 below 8,000, else 3; capitals stay 4).
- Hamlet: elder, no watch (guards 0), wayside shrine, 0-1 tavern, barter. Village: reeve, constable and watchmen, one temple, weekly market. Town: mayor and council or a lord (50/50 by hash), watch with gaol and court. City/Metropolis: lord and steward with ward aldermen (capital: sovereign and chancellor), garrison about pop/120 plus watch, 2-4 (city) or 4-6 (metropolis) competing temples to invented deities with SRD domains, districts (city 4-5, metropolis 7) labelled on the plan.
- Watch org absent in hamlets; hamlet leaders relabelled (Hamlet elder, Shrine-keeper, Home brewer if no tavern); hamlet Guard/Soldier jobs become Woodsman.

## Settlements (demographics)
| Size | Population | People per building |
|---|---|---|
| Village | 60-900 | 6 |
| Town | 1,000-7,500 | 7 |
| City | 8,000-24,000 | 8 |
| Capital | 25,000-90,000 | 9 |

- Placed on jittered grids, scored for habitability (biome, river within 4 mi, coast within 5 mi, not too high).
- Capitals are the best-placed cities, at least 640 mi apart; each founds a realm. Realm borders = nearest capital with warped distance.
- Derived figures: farmland = pop / 180 sq mi; guards 1 per 150; nobles 1 per 200; clergy 1 per 40 (priests 1 per ~27 clergy); shops from medieval support values (e.g. shoemakers 1 per 150, inns 1 per 2,000, booksellers 1 per 6,300).
- Each settlement shows its realm, the organisations present, its notable people, exports by biome, a race mix (SRD races weighted by biome) and local SRD 5.1 wildlife with CR and rarity.

## Town layouts
- Each town is laid out in local feet around its market from a seeded generator; the same world always gives the same plans. Plans regenerate when the town is moved, resized, a road changes or terrain is painted near it.
- Layout type comes from the land and the folk. Human-built: Grown town (spokes from the market, lanes branching off at odd angles, broken half-rings), Street settlement (strung along its main road, back lanes behind), Crossroads town, Planned town (grid around a square), Hill town (curved terraces across the slope with stair-lanes, keep at the top), Green village (cottages round a green with a pond), Scattered hamlet (farmsteads with barns joined by winding lanes), Sea-road town (sea within 1.6 mi: fans out toward the coast, harbour road or gate), Canal town (swamps: canals with boardwalks), Courtyard town (deserts: flat-roofed courtyard houses, narrow dead-end alleys, great well and palms). Built by other peoples: Dwarven hold (straight terraces, long stone halls, heavy walls with square towers, hold-gate), Elven grove (round homes among many trees, looping paths, glade with a great tree, no walls), Halfling smials (round turf-roofed homes with vegetable gardens, wandering hedged lanes, green and pond), Gnomish warren (dense, colourful, winding dead ends), Orcish war-camp (longhouses in rings round an arena, palisade), Dragonborn clanhold (courtyard compounds on a broad grid round a great hall).
- Land read for each town: regional slope over 1-2 miles (uphill direction), sea, rivers and mountains within 5 miles (painted terrain counts), woodland within 0.6 miles, biome, and the roads that enter. Hill towns: mountains within 1.8 mi, slope over 0.03 per mile, or high ground.
- Founders: the best-represented non-human people (share x builder strength: dwarf 1.3, elf and gnome and dragonborn 1.2, halfling and tiefling 1, half-orc 0.95, half-elf 0.55) may have founded the place: chance (weight / 45)^1.5 for villages (max 45%), /55 towns (max 38%), /80 cities (max 22%), never capitals. About 1 in 5 settlements end up non-human-built. Census and residents are unchanged; the panel says e.g. "Founded by elves (17% of folk today)".
- Quarters: towns get 1, cities 2, capitals 3 quarters for other peoples with at least 7% of folk, in an angular sector (dwarves on the uphill side, elves toward woodland); their houses use that people's shapes, roof colours, trees and gardens. Labelled on the map at street zoom.
- Footprints are irregular outlines (stretched along the road for street settlements, a cross for crossroads, a fan toward the sea, pulled downhill for hill towns) inside the settlement radius. Fields in strips, pasture and orchards fill the ring between the houses and the edge (not for groves, warrens, war-camps or canal towns). Walls follow the outline with gates where streets cross: stone (cities and big towns), heavy stone (dwarves, dragonborn), mud brick (courtyard towns), timber palisade (orcs) or hedge (halflings); elves and gnomes build none.
- Buildings: rectangles, long halls, round homes and courtyard houses by culture; frontage along every street (up to three rows in cities), then infill aligned to the nearest street; the temple, keep or great hall, and market stalls in round or square markets. People are placed in these buildings as before.
- The settlement panel's Layout section explains the layout type, founders, slope, sea, river, roads, walls and each quarter in plain words.
- Drawing: each plan's shapes are built once and cached as an image at power-of-two zoom steps (up to 2048 px; on sharp screens one step lower), so panning costs one image draw; at very close zoom the plan is drawn directly from cached shapes, only for the part on screen. Plans for towns in view are prepared in the background while zooming in. Shapes avoid the browser's slow closePath on large paths.

## Roads
Relative-neighbourhood graph per tier: highways between cities/capitals (within 650 mi), roads between towns and up (180 mi), trails to villages (48 mi). Roads that cross more than ~4 mi of open water are dropped. Travel time uses PHB paces (normal 24 mi/day).

## Live market
- Calendar: 12 months x 30 days (Deepwinter, Thawmoon, Seedtime, Rainmoon, Blossom, Highsun, Midsummer, Haymoon, Harvestmoon, Leaffall, Frostfall, Longnight), starting year 1042. Play advances one day every 0.4 / 1.5 / 4 seconds.
- 77 goods with PHB base prices: food, drink and lodging; trade goods (wheat 1 cp/lb up to gold 50 gp/lb); livestock, mounts, tack and vehicles; weapons and armour; adventuring gear; 15 SRD magic items priced inside the DMG rarity bands (common 50-100 gp, uncommon 101-500, rare 501-5,000, very rare 5,001-50,000).
- Local price = base x local supply x agendas of the powerful x season x market drift x event pressure.
  - Local supply: biome (e.g. mountains: iron x0.65, grain x1.25; grassland: grain x0.8, horses x0.85), coast (salt x0.6), size (villages cheap food, dear manufactured goods; capitals dear food and rooms, cheaper luxuries), and distance to the nearest city for imports (+1/800 per mile, capped at 600 mi).
  - Season: grain and feed run from x0.8 at Harvestmoon to x1.22 at Seedtime; other food moves at 45% of that.
  - Drift: smooth daily noise, shared within a realm plus a small local part (magic items swing more).
- Stock: villages sell basics; towns add longswords, warhorses and common magic; cities add plate, elephants and uncommon magic; capitals carry rare and very rare items. Magic stock rotates weekly (common 85%, uncommon 60%, rare 45%, very rare 18% chance).
- Events (deterministic from seed, one of each kind per place per cycle, so no overlaps; every town and border runs each kind on its own phase and an event can start anywhere it still fits, so there are no world-wide waves; a town's festival keeps its name every year; wars are named with their year): war between neighbouring realms (300-day cycle, 60-240 days, strongest near the border; nearly twice as likely when either sovereign is pushing for war), bandits (25-60 mi), famine (90-220 mi, drier/colder lands more often), plague (spreads out from a city), trade booms (cities and ports; imports cheaper, rooms and wagons dearer), annual town festivals plus a realm-wide Harvest Home on 13 Harvestmoon, and feasts. Effects ramp in and out. The DM can declare events at any settlement or call generated ones off (both undoable). Completing certain guild quests ends events early.
- Each event page says where it is (the town it is centred on and its realm; for wars both realms and their capitals; for Harvest Home the realm) and lists affected settlements.
- Trade runs compare neighbouring towns (road-linked within two hops or within 70 mi) after carriage of about 0.4% per mile.

## People (residents & tracking)
- Each settlement has a deterministic cast of notable residents: 8-60 by population (6 + 0.55 x sqrt(pop)), expandable 20 at a time up to 400. Resident N is identical however many are generated, because generation runs in one seeded stream and each new person only links to people generated before them.
- Order of generation: the settlement's leaders for its size (village reeve and priest up to sovereign, chancellor, marshal, archpriest, master of coin and royal magus at a capital), then shopkeepers drawn from the town's actual trade counts, common folk weighted by biome (fishers on coasts, miners in mountains, trappers in taiga), and an underworld share (4% villages, 7% towns, 10-11% cities and capitals) who have a public cover job and a secret one. Towns and cities also include their Adventurers' Guild members.
- Every person has: name by race, race (from the town's folk mix), race-appropriate age, pronouns, job, group, PHB lifestyle (Wretched to Aristocratic) and coin on hand, personality, ideal, flaw, look, secret, motivation, SRD stat block with AC/HP/CR, and attitude to the party (-100 to 100: Hostile at -35 or below, Friendly at 35 or above).
- Relationships: spouse, parent/child, sibling (same race, believable age gaps), employer, mentor, friend, rival (likelier within the same trade), enemy, debt, secret lover, blackmail. Motivations draw on these ties; rulers and guildmasters get rank-appropriate goals. The DM can add links, including across towns.
- Daily activity comes from the job's routine, a rest day every seventh day, merchant trips to neighbouring towns, adventurers away on quests, and the Market's world events. Underworld members show their cover and their real activity. When a world event drives what someone is doing today, that line links to the event.
- Tracking: star anyone to follow them on the Tracked tab, as a brass badge on their town, and as a brass pin in the town plan. Log interactions with dates; edit name, job, status (Alive, Travelling, Missing, Imprisoned, Dead) and notes.
- Census per town: households (4.4-5.5 per household by town), work, ages (about 35% children, 52% adults, 13% elders, but younger in frontier biomes, more working-age adults in capitals, and fewer children and elders after recent plague, famine or war, shown as "Hard times lately"), PHB lifestyle shares by settlement size shifted richer when food is cheap and poorer when it is dear or times are hard, folk mix, and organisations present (each links to its organisation page).
- No two residents of a town share a full name (adventurers included); a clash renames only the later person, from a hash, so nobody else changes.

## Places, aldermen and activity (v19)
- placesOf(s): hall (by size: Elder's House, Reeve's House, Town Hall or Manor, Citadel, Royal Palace / Great Hall), market (Village Green below 1,000 people), temples (templesOf), taverns (up to 6, at least one per tavern keeper) and inns (up to 3) with generated names and keeper owners, law (Constable's House / Gaol / City Gaol + Barracks), guild branches (adventurers by hall name; thieves beneath the first tavern), bank (cities: the Bank of <two richest traders>) or countinghouse (towns), docks + warehouse (ports, city+), districts; shops are 'shop:<person id>' named <surname>'s <noun by job>.
- placePos: keep (bk 2) for the hall, bk 1 for the first temple, owner's work building for taverns, inns, shops and the adventurers' hall, district-aware spots (Temple Ward, Garrison, Merchants' Row, Docks, The Warrens), else a deterministic house in a distance band from the market.
- Routines use tokens with fallbacks (ROUTINE_AT); activity() returns place / secretPlace keys; actHtml links names. Links are data-place="sid|key"; goPlace opens People place view and flies to the building with a pulsing ring.
- Aldermen: one per district, from the base townsfolk excluding leaders, labourers and underworld, sorted by lifestyle.
- Activity heat map (People → Activity): resident points (weight 3 at their place, 2 at their work/home) plus crowd estimates proportional to population (market 35%, taverns 12%, temples 8%, civic, crime by thieves' guild level and The Warrens, adventurers by roster, docks, homes and workshops), rest-day and event multipliers; rendered as a 256 px log-scaled heat raster over the plan, with category toggles.

## Lasting history (v20)
- histEvents(day): plague, famine, war, boom and bandit events from the last ~1,160 days (regenerated each 30-day bucket, ~10 ms). townEvents(s): those touching the town, with peak impact measured at each event's midpoint (>= 0.15; bandits >= 0.3).
- Population today = usual population x product of (1 - loss x w) x (1 + gain x w). Loss per event x impact: plague 3-12%, famine 1-5%, war 1-4% (+2% if the town was taken); booms add 2-5%. w builds up through the event (smoothstep) and fades as (1 - t/1000 days)^1.5 afterwards. Display only (panel "People today", census, History); the generator still uses the recorded population.
- Wars: 28% end in a truce; otherwise the winner is drawn with weight sqrt(realm population) x 1.25 for a sovereign pushing for war. Loser towns (not capitals) with impact >= 0.5 that lie nearer the enemy capital than their own are occupied from the war's midpoint until a year after it ends: flag in the winner's colours on the map, Civic life note, History line.
- Deaths of notable folk (fateOf): per event, chance x impact: plague 6% (healers and clergy 9%), famine 2% (5% for poor lifestyles), war: soldiers 8% where impact >= 0.4, others 3% only where impact >= 0.6. A death day falls inside the event. Never: leaders, adventurers, DM-made people, anyone with a frozen snapshot or a DM-set status. Freezing records Dead + fate, so tracking a dead person keeps them dead. About 3% of notable folk over three years.
- Social routines: each relationship pair rolls daily (friend 5.5%, sibling/parent 4.5%, spouse 4%, rival 4.5%, enemy 4%, debt 5%, mentor 5%, lover 5%); a person takes the lowest roll, so both sides usually match. Secret lovers show only to the DM. People in other towns write letters instead.
- Seasonal routines: about a third of everyday routines come from season lists (winter Longnight-Thawmoon, spring Seedtime-Blossom, summer Highsun-Haymoon, autumn Harvestmoon-Frostfall) for labour, craft, trade, service, faith, watch and rest days.

## Campaign: saving, stable worlds, DM and player modes (v20)
- Saves go to IndexedDB ('realmwright' / 'kv': 'world', 'heroes', 'snap:<time>') with a second copy in localStorage; a red banner appears if saving fails. Snapshots every 30 minutes, last 12 kept. Backup files (kind 'realmwright-campaign') can be downloaded and loaded.
- GEN_VERSION 20: generated details of anyone the DM has interacted with (tracked, noted, logged, linked, bonded, quest client) are copied into edits.npcSnap, so later generator versions cannot change them. Older worlds show a "what changed" dialog.
- Player mode hides secrets, motives, flaws, the thieves' guild, secret relationships, monsters, DM notes and editing tools; optional SHA-256 DM password (edits.dmLock); "Make a player file" strips DM notes. A "Player view" pill shows the mode.
- Merging another DM's backup of the same seed: their added settlements, roads, labels, people, relationships, quests and events are renumbered; notes and logs about the same person are combined; finished quests stay finished. Live syncing would need a server.

## Heroes: 2024 rules option (v20)
- Per hero: rules '2014' (default, SRD 5.1) or '2024' (SRD 5.2). 2024: species Dragonborn, Dwarf, Elf (Drow/High/Wood lineages), Gnome (Forest/Rock), Goliath (six giant ancestries), Halfling, Human (extra origin feat, one skill), Orc, Tiefling (Abyssal/Chthonic/Infernal), all without ability increases and with two extra languages.
- Backgrounds Acolyte (Int/Wis/Cha, Magic Initiate cleric), Criminal (Dex/Con/Int, Alert), Sage (Con/Int/Wis, Magic Initiate wizard), Soldier (Str/Dex/Con, Savage Attacker), Custom: +2/+1 or +1/+1/+1 to the three abilities. Origin feats Alert (+prof to initiative), Magic Initiate (2 cantrips, 1 first-level spell, chosen ability), Savage Attacker, Skilled (3 skills).
- Weapon mastery for barbarian (2-4), fighter (3-6), paladin, ranger, rogue (2), shown on each attack; 2024 exhaustion (-2 per level to all d20 numbers, -5 ft per level, death at 6); subclass features from level 3.
- **2024 classes (v25, app31.js).** `CLS(h)` returns `CLASSES5[cls]` with the `C24` overlay for 2024 heroes. Each overlay holds:
  - the features by level and the SRD 5.2 subclass;
  - the always-prepared spells;
  - the starting kit, with gp on each option, and `goldB`;
  - the ASI levels (19 is the Epic Boon);
  - the fighting styles, and the cast table.
- Spell counts: 2024 casters use fixed prepared tables. Bard, sorcerer and warlock swap one spell on level-up ("known" mode). Cleric, druid, paladin, ranger and wizard prepare from a table. Paladins and rangers cast from level 1.
- 2024 choices:
  - cleric and druid `order`;
  - `strike7`;
  - druid `land24` (Arid, Polar, Temperate or Tropical);
  - `boon` and `boonAb`;
  - the 2024 invocations, where the pact boons are invocations (`pblade`, `pchain`, `ptome`);
  - the 2024 Metamagic.
- Abilities: ASIs cap at 20; the boon adds 1, up to 30; the barbarian and monk level-20 capstones reach 25.
- Uses with rest type `'one'` (Rage, Channel Divinity, Wild Shape, Second Wind) refill fully on a long rest and by one on a short rest.
- Gold is fixed in gold mode: class `goldB` plus 50.
- Spell lists still follow SRD 5.1.

## Accessibility and testing (v20)
- Monster danger by shape as well as colour (circle, diamond CR 5+, hexagon dragons); price rings carry arrows; viewport meta for phones; phone toolbar labels no longer overlap.
- Tests: node tests/run.js builds and runs every browser test (about 90 checks, including phone-size layout). Git history with version tags.

## Saving, worlds library and live sharing (v21)
- Storage: IndexedDB 'w:<cid>' per world, 'cur' = open world, 'libIndex' = list (title, seed, savedAt, size), 'snap:<cid>:<t>' snapshots ({save, heroes, why}; 16 per world, 'snapWhy' index), 'heroes'. localStorage keeps a second copy (or a pointer when over 1.5 MB). Load order: cur world -> legacy 'world' -> localStorage -> newest snapshot, with a recovery notice.
- Two tabs: BroadcastChannel 'realmwright-tabs' (storage event fallback); a tab that hears a newer save of its world stops saving and offers Reload or Keep this tab's version.
- beforeReplace(why) saves and snapshots before new world, map code, file load, merge, clear, restore and joining a shared world.
- Stability: edits.setSnap[id] freezes name, x, y, tier, pop, b, coastal, realm of every settlement the campaign uses plus all capitals; edits.roadSnap[id] keeps the ends of reshaped or removed roads; lost places and reshaped roads are rebuilt; driftReport() lists what a newer generator would have changed.
- Entities: edits are flattened into keys (section|id; lists by id or content hash; 'v|' single values; 'next' stays local). Undo/redo patch only the entities a step changed.
- Live sharing (claude.ai shared page, db + user + room capabilities): 'world/meta' {seed, cid, title, day}; 'w/<entity>' readable by everyone admitted; 'dm/<entity>' DM-only (npc notes and attitude, settlement notes, placed monsters, secret relationships, DM password); 'heroes/<uid>' each person's heroes. Rules: root read view/write admin; dm read+write admin; heroes read view/write owner with heroes/{self} write interact. Owner and Editors are DMs; others get forced player view and the DM's calendar. Writes queue per document (4 at a time, retry on rate limits); incoming changes apply per entity and never redraw a panel under someone's typing. Per-device id blocks (100,000 x a random 1-899) stop id clashes.

## Battle map and Tiles tool (v22, from Sean's Tilewright)
- Scale: CELL = 1056 squares per mile. Chunks are 32 × 32 squares (PCS), rendered at 16 px per square, or 8 px ("half") below 9.5 screen px per square. Pixels fade in between 5.5 and 9 screen px per square (pxAlpha). Once they cover the view, tiles, roads and town plans are skipped.
- pixelLib(T) is the renderer, shared by the workers and the main thread. It has 19 tiling 64 × 64 textures (each row and column brought to the same average so no stripes show), soft blending between natural ground, wall shading, edge walls, doors, windows and fences, and 15 prop sprites. Natural ground comes from the world's biomes and rivers (naturalT); natural props are hashed per square.
- pxLayout(cx, cy) turns the world into one chunk's overlay:
  - roads by type;
  - town plans through pxPlan, which converts plans to miles once per plan: streets, canals (as shallows), plazas, trees, fields, round and courtyard buildings, outline walls rasterised by distance to their segments (half-thickness 3 ft for palisades, 6 ft for heavy walls, 4.5 ft otherwise; hedges become bushes), and towers;
  - buildings snapped to the grid, with doors toward the nearest street and furniture by kind;
  - then the DM's edits.bm on top.
- edits.bm['cx,cy'] = {t, p, h, v}, keyed by square index y*32 + x:
  - t is terrain;
  - p is a prop, or -1 for none;
  - h and v are edges along the top and left of each square (0 none, 1 wall, 2 door, 3 fence, 4 window).

  An absent entry means "as generated". Each chunk is one entity ('bm|cx,cy'), public to players.
- Tiles tool (T, DM-only):
  - **Paint:** brush 1, 2, 3 or 5.
  - **Fill:** up to 5,000 squares; walls, doors and windows stop it.
  - **Building:** a floor, a ring of walls and a south door.
  - **Edges:** drag to build a run, or tap a line to toggle one.
  - **Natural:** resets to what the world generates.

  A stroke is one undo step whose "before" differs from "after" only in edits.bm. A pinch or cancel reverts the stroke.

## Shop, inn and the full SRD (v22, data compiled by Sean)
- srd-data.js holds 588 items and 334 monsters (SRD 5.1, CC BY 4.0).
- The Shop prices each item from the matching market good, or by the town's price level for similar goods.
- Availability:
  - martial weapons and heavy armour need a town or larger;
  - ships need a coast;
  - magic items need a city or capital and rotate weekly;
  - legendary items and artifacts are never sold.
- Unpriced magic items get a deterministic price within the Dungeon Master's Guide band for their rarity (halved for consumables).
- The inn bill covers lifestyle lodging and meals, nights, guests and stabling.
- MON_SRD holds creatures beyond the built-in MON. Natural spawns use MON only, so seeds are unchanged; monInfo(name) reads both, and statBlock shows the full block.

## Market Ledger ideas (v23)
- **Everyday prices:** SRD_INLINE.everyday, 37 items in copper pieces. Shop prices use the town's price levels:
  - meals use the meal level, other food the food level, drink the drink level;
  - lodging uses the lodging level (stabling uses √(feed × lodging));
  - services use √(lodging × gear), wages √(lodging × meal).
- **Coins:** coinHtml() wraps money() output in .c-gp, .c-sp and .c-cp spans.
- **Households:** union-find over spouse, parent and sibling ties in townPeople(s).rels. Each household is named "House <commonest surname>".
- **whereAt(p, s, day, hour)** starts from activity(p, day). Time parts:
  - night (22:00–05:00): asleep at home; innkeepers close up until midnight; 35% of the watch are on the night watch; secret business is DM-only;
  - dawn (05:00–08:00): prayers, early trades, or breakfast at home;
  - morning and afternoon: the day's routine place;
  - midday: 30% eat at a tavern;
  - evening: innkeepers serve, priests lead services (60%), the watch patrols (50%), others drink at a tavern (30%, or 50% on a rest day; never under 16) or go home.
- **chronDay(s, d)** is deterministic per day and cached. It gathers:
  - modsFor(s, d) against modsFor(s, d − 1) for events arriving and ending (impact over 0.15);
  - deaths (deadOf, by fateDay);
  - quests posted that day;
  - presence() starts within 30 miles, DM only;
  - party chronicle entries for the town;
  - up to two non-secret socialToday meetings, not at home;
  - basketIndex week on week on rest days.
- **Recent changes:** at a shared table, read from share.pub and share.dmd documents {k, v, t, by}, newest first, folding repeats within 10 minutes. Alone, read from localFeed (commit, undo, redo, Tiles strokes).
- **Town settings:** edits.ov[sid].wealth and .defence (0–3; absent means Auto).

  impact = impactRaw × townGuard, where townGuard is the chosen factor divided by the Auto factor:
  - wealth factors 1.3, 1, 0.85 and 0.7 apply to famine and plague; Auto is Prosperous for cities and up, otherwise Modest;
  - defence factors 1.3, 1, 0.8 and 0.6 apply to war and bandits; Auto is a Garrison for capitals, a Town watch for towns and cities, and None for villages.
- **Guild colours:** ORG_COL per organisation (--gc). questDanger() rates each quest low, moderate, high or deadly.

## Layout: the atlas panel and the framed map (v24)
- `#app.shell` is a grid: `#side` (420 px wide, 560 px for Heroes) beside `#stage > #frame`, which holds the canvas, map tools, Layers, scale, ladder, toasts, the creature card, the live chip and the mode pill.
  - Below 860 px wide the grid becomes rows: the map on top at 44% of the height (72% or 22% with the handle), with the side panel below, scrolling as a whole.
- The side panel's page comes from sideCtx():
  - **Place:** market, people or guilds with a town, or Explore with a settlement selected. The tab is the tool, and its sub-tabs are the tool's own.
  - **Section:** heroes, monsters, tracked people, world markets or events, or an editing tool.
  - **Realm:** navR is set and nothing is selected.
  - **Home:** otherwise.
- **shellWrap(html):** adds a sticky header with breadcrumbs, and for a place its name (an editable title for the DM), size and population, a "show on map" button, and the Overview, Market, People and Guilds tabs. Inside a place, the tool panels' own titles and calendars are hidden.
- **realmStats:** groups every settlement by realmOf() in one pass, cached per mkVer.

## Version 25 checks
- **Live sharing:**
  - writes that fail are kept in `share.unsent` and re-sent by `shareResync()` when the browser comes back online, every 60 s, or from **Try again now**;
  - offline is detected from the browser's offline and online events;
  - if another person changes the same key within 120 s of your change, a toast says whose change won (the last write is kept).
- **Grief and occupation (app20):**
  - `lossesOf(p, day)` lists family deaths;
  - `griefToday` gives mourning for 7 days (the person stays home), then grave visits at the temple (30% of days up to day 30, 12% up to day 60);
  - `occupiedToday` gives the occupation lines by job;
  - the person page has a **Losses** section.
- **Accessibility (app30):**
  - skip links come first;
  - `#srAnnounce` (polite) announces each page change;
  - focus moves to the page heading on navigation;
  - controls in bars are at least 24 px;
  - phones held sideways use a side-by-side layout.
- **Realms:** `realmAt` scales its border warp by distance to the nearest capital, so a capital always lies in its own realm. No existing place changes realm.

## Linked people & the map
- Any person's name anywhere (residents, relationships, relationship web, guild halls and rosters, quest clients, organisation leaders and members, influence, market agendas, a settlement's Notable people, and the search box) opens their card and flies the map to them.
- Each person has a place in their town plan: rulers at the keep, clergy at the temple, guild members at the hall, shopkeepers in the central streets, everyone else at a home. The person being viewed shows as a named brass pin; tracked people as brass pins; in People mode every resident shows as a pin coloured by role, and tapping a pin opens that person.
- The search box finds realms, places, people (leaders and guild members of every town and city, plus anyone already generated, tracked or added) and current or upcoming events; an exact full-name match comes first.

## Navigation & cross-links
- Town and city names on the map are clickable and open that town in whichever tool is open (hand cursor and underline on hover); realm names open the capital and fly to the realm. The town the panel shows is highlighted on the map, and following a town link flies there with a brief ring; the Explore profile has a Show on map button.
- Underlined names are links. Towns open that town in whichever tool is active (Explore profile, Market board, People residents, Guilds tabs) and fly to it; realms fly out to the whole realm; organisations open their organisation page; events open their Market page; people open their card.
- Linked places include panel headings, a person's home town, tracked-people headings, quest locations and halls, road ends, event locations, a settlement's realm, and market town headers.
- Clicking an event anywhere (Market lists, a town's market summary, a quest's "Because of" line, a person's activity, search) opens it and moves the map to it: the midpoint of a war between the two capitals, a whole realm for realm-wide festivals, the spread of a plague or famine, or the town itself. The map is offset so the target is not hidden behind the panel (beside it on wide screens, above the bottom sheet on phones).
- Minimising: pressing the open tool again, pressing the tab you are already on (when no detail page is open), or the – button folds the panel into a slim bar showing what is open; tapping the bar, + or the tool again restores it. Tapping something on the map, following a link or switching tools restores it. Close (×) leaves Market, People or Guilds in one press.

## Rules integration (SRD 5.1)
- Creature cards (tap any creature name in Wildlife nearby, quest threats or stat blocks) give size and type, AC, HP, speed, CR with XP, and a key trait for about 85 SRD creatures, young and adult chromatic dragons and NPC stat blocks, plus how dangerous one, two or four would be for the registered party.
- NPC stat blocks (Commoner, Guard, Acolyte, Noble, Cultist, Scout, Thug, Spy, Priest, Cult Fanatic, Veteran, Knight, Gladiator, Mage, Assassin) show AC, HP and CR on each person's card. Adventurers show estimated HP (from the class hit die), AC and proficiency bonus by level.
- Monster quests name the creature and how many (raiders 3-8, lairs 2-4, bandit gangs 6-12 with a captain), with Dungeon Master's Guide encounter difficulty for the party (XP thresholds by character level and the group multiplier: 1 x1, 2 x1.5, 3-6 x2, 7-10 x2.5, 11-14 x3, 15+ x4) and the XP the encounter is worth.

## Guilds & organisations
- Eight organisations: Adventurers' Guild (towns and up), the Rulers, the Temple, the Watch (everywhere), Merchants' Guild and Craft Guilds (towns and up), Mages' Circle (cities and up), Thieves' Guild (towns and up, secret). Residents belong by group: leader -> Rulers, faith -> Temple, watch -> Watch, trade and service -> Merchants, craft -> Crafts, arcane -> Mages, underworld -> Thieves, adventurer -> Adventurers.
- Relations between organisations (-100 to 100; Feud, Hostile, Wary, Friendly, Allied) = long-standing base (e.g. Watch-Thieves -60, Rulers-Watch +40, Merchants-Thieves -40, Temple-Mages -10, each jittered by the seed) + daily drift (realm-wide and local) + world events in the town (e.g. famine: Merchants-Rulers -20; bandits: Adventurers-Merchants +15; plague: Temple-Rulers +10) + agendas of the powerful + DM nudges and quest outcomes. Not neutral: the Adventurers' Guild's relations move like everyone else's.
- Party reputation with each organisation (-100 to 100), changed by quests and DM buttons.

### Guild networks (v15)
- Civic bodies (Rulers, Temple, Watch) are everywhere. The five guilds have per-settlement levels: none, minor branch, major branch, realm headquarters. Branch names: Adventurers Lodge/Guild hall/Grand hall; Merchants Trading post/Guildhall/Exchange; Crafts Craft lodge/Guild halls/Hall of Masters; Mages Circle house/Tower/High Tower; Thieves Cell/Den/Shadow court.
- Support score (x local jitter 0.75-1.25, x1.25 capitals, x realm stance): adventurers (towns+) pop/2600 x (1 + 0.8 x wildness); merchants pop/3000 x (1 + 0.5 coastal + 0.22 per highway + 0.08 per road), villages included; crafts (towns+) shops/115; mages (towns+) pop/17,000; thieves (towns+) pop/12,500 x (1 + 0.3 coastal + 0.15 per highway). Major at 1+ (towns and up); minor at 0.35+ only if a major or HQ of that guild is within 140/170/110/230/120 mi (adventurers/merchants/crafts/mages/thieves).
- Realm stances: Theocracy mages x0.3, thieves x0.5; Free Cities / League merchants x1.35, crafts x1.2; Marches adventurers x1.35; Protectorate thieves x0.55; Principality / Grand Duchy mages x1.2.
- HQ: per realm and guild, the strongest major branch, weighted at capitals by adventurers 0.7, merchants 0.9, crafts 1, mages 1.25, thieves 0.55 (adventurers also favour wild country). Metropolis (capital of 60,000+) is HQ of every guild. Majors answer to their realm HQ; minors to the nearest major.
- Adventurer rosters: lodge 3-5 with a Lodge warden (levels capped 6/9/11 by town size), hall as before, grand hall +4 members. Boards: lodge 0-1 notices per posting (+1 for danger), grand hall one more than a hall. hallFor = the place itself if it has any branch, else the nearest within 250 mi.
- Typical shares (two seeds): villages 2-4% trading posts; towns about 2.9 guilds (adventurers 6-10% none, ~50% lodge, ~40% hall; mages and thieves ~4%); cities 3.8-4.4; capitals 4.8-5; metropolis 5.

### Organisation pages
- Open from any organisation name: the Orgs tab cards and relations grid, a person's "Belongs to", the census, quest clients, influence lines, the Explore profile's Organisations line, or an adventurer's company name.
- Each page shows: members in town (estimates: Rulers pop/500, Temple pop/40, Watch pop/150, Merchants 35% of shopkeepers, Crafts 60% of shopkeepers, Mages pop/3,000, Thieves pop/400 in cities or pop/700 in towns, Adventurers the hall roster), notables you can meet, party standing, and the local leader.
- How it works: what it does, where its money comes from (e.g. Adventurers' Guild takes a tenth of each reward; Temple tithes a tenth; Merchants' dues about 2 gp a year and 1 cp per stall per day; Craft guilds have about seven-year apprenticeships and masterpieces) and what power it holds.
- What its leaders want (their agendas and effects), its relations with every other organisation in town (with the 7-day change, each linking onward), jobs it is paying for and jobs against it on the local board, world events putting pressure on it, and chapters in nearby towns.
- Members: for the Adventurers' Guild, hall staff, each company with its core level, and those working alone; for others, the notable residents who belong, titled by standing (e.g. Temple: High priest, Priest, Acolyte, Lay servant; Crafts: Guildmaster, Master, Journeyman, Apprentice; Thieves: Guildmaster, Lieutenant, Cutpurse, Runner). Generating more residents reveals more members.

### Adventurers' Guild
- A hall or lodge in most towns and every city (see Guild networks) (named, e.g. "The Rusted Compass"), led by a guildmaster (towns level 6-9, cities 9-13, capitals 12-16, metropolises of 60,000+ 13-18) with a guild clerk, and a roster of NPC adventurers (7-11 in towns, 14-18 in cities, 22-26 in capitals) grouped into named companies. They appear among the town's residents.
- Levels fall away exponentially (truncated; chance of level L proportional to e^(-0.36(L-1))): about 31% level 1, 22% level 2, 16% level 3, 10% level 4, 7% level 5, 2% level 9, under 2% level 10. Caps: towns 10, cities 15, capitals 17, metropolises 20. Adamantine (level 18+) is only possible in a metropolis and in practice is almost always its guildmaster, if anyone.
- Companies (2-5 members) share a core level and stay within about one level of each other. About 30% of companies of three or more carry an exception: a trainee 3-5 levels below (mentored by the strongest member) or a veteran mentor 3-6 levels above (mentoring the weakest). Quests are matched to a company's core level.
- Ranks by merit: Copper 0, Iron 100, Bronze 300, Silver 700, Gold 1,500, Platinum 3,000, Mithral 6,000, Adamantine 12,000 (roughly levels 1/3/5/7/9/12/15/18). Quest rewards by rank: Copper 5-25 gp, Iron 25-100, Bronze 100-300, Silver 300-800, Gold 800-2,000, Platinum 2,000-5,000, Mithral 5,000-15,000, Adamantine 15,000-50,000; merit 10/25/50/90/150/250/400/700.
- Party: register player characters (name, class, level); each earns merit per completed quest and rises in rank automatically; the DM can promote, demote and level up. Party earnings are tracked.
- Quest board: new notices every 5 days (1-2 in towns, 2-3 in cities, 3-4 in capitals), on the board 12-30 days. Sources: monsters from local SRD wildlife (peaceful creatures excluded; humanoids become raiders; cities and capitals occasionally post young or adult dragons by terrain), world events in the town (bounties on bandit gangs, grain convoys and hoarders in famine, finding the source of a plague, war scouting and dispatches, boom caravans, festival security, guarding a feast), agendas of the powerful (collecting taxes, finding a missing heir, infiltrating the thieves' guild, exposing heretics, sabotage, ruin expeditions), resident requests (heirlooms, missing apprentices, debts, cellar rats, shady packages for underworld clients) and guild errands. Villages post at the nearest hall. The DM can pin custom quests. Notices tied to an event come down when the event ends.
- A board never shows the same notice twice, and the same notice is not re-posted within 45 days. War jobs name the enemy realm.
- NPC companies of high enough rank take about half the jobs, and succeed about three times in four. Once the party accepts a quest its details are frozen.
- Completing a quest: reward and merit; client organisation +6 + 2 x rank; organisation worked against -(5 + rank) and the two organisations' relations -4; Adventurers' Guild +2; client's attitude +15 and a log entry; bounty and plague-source quests end their event. Failing: client organisation -(4 + rank), client attitude -10. All undoable.

### Influence of the powerful
- The powerful are each settlement's leaders plus its guildmaster. Their motivation becomes an agenda with concrete effects, e.g. Refill an empty treasury (all prices +4%, Merchants-Rulers -15, tax-collection quests), Win the next war (arms +6%, warhorses +5%, war more likely, mercenary quests), Break the thieves' guild (Watch-Thieves -30, infiltration quests), Build a grand new temple (crafted goods and iron +5%, Temple-Crafts +15), Stop cheap imports (crafted goods +6%, Crafts-Merchants -20), Corner the market in an export (that good +12%).
- A capital's sovereign and chancellor are felt across the whole realm at half strength. Agendas stop when the person is no longer Alive or when the DM marks them Thwarted or Achieved; the DM can also change what someone wants.

## Monsters (spawns, placement, tracking, bounties)
- Toolbar "Monsters" (shortcut B) and a Monsters layer. The world is split into 64-mile cells; each cell rolls 2-4 roaming groups per 36-day cycle and has a 42% chance of a lair per 200-day cycle, each cell on its own phase so the population turns over gradually (about a sixth of groups are still present 40 days later). Groups appear and move on at staggered dates; lairs last 6-12 months.
- Habitat: the creature is drawn from the habitat table of the biome where it stands (SRD fauna tables plus 34 more Monster Manual creatures such as kobolds, hobgoblins, ogres, basilisks, giant crocodiles and fire giants; sea creatures in shallows and open sea). Lower CR is commoner (weight 1/(1+CR)^0.7). Lairs hold CR 5+ or lair-type creatures (hags, hydras, manticores, wyverns, rocs and so on) and dragons in their biomes (young 10.5%, adult 3.5% of lairs). Rare exceptions: 3% wanderers from another habitat and 2.5% haunts (skeletons, zombies, ghouls, wights, ghosts, wraiths, vampire spawn, gelatinous cubes, mimics, rust monsters, wererats, doppelgangers). Pack sizes per kind (wolves 3-8, goblins 4-12, kobolds 5-15...).
- Map: claw markers coloured and shaped by danger (peaceful grey-green, CR<1 tan, CR 1-4 orange circles, CR 5+ red diamonds, dragons crimson hexagons), lairs larger, a count badge, a violet ring for rare exceptions and a brass ring for creatures you placed. Outside the Monsters tool only stronger groups and lairs show until zoomed in.
- Panel: Nearby (threats around the tapped settlement with danger level, or around the map centre; peaceful animals optional; new sightings this week), Placed & watched, Bestiary (search, place any creature with a count, or a custom creature with CR/AC/HP when it has no built-in card, with an AideDD link). Tapping the map places or moves. Each group has a page: stats, AideDD link, place, habitat (and "far from its usual haunts"), seen/leaves dates, bounty, quests for it, difficulty for the party, an encounter tracker with initiative and per-creature hit points, Mark slain, Driven off, Watch, and for placed creatures Move, Remove, count, name and notes. Placing, moving and slaying are undoable; hit points save in the browser.
- Danger: each settlement sums hostile groups within 40/55/70/85 miles (village to capital), weighted by XP^0.85 and closeness, against the size of the place. Typical towns: 10th percentile 0.18, median 0.5, 90th 1.0. Words: Quiet <0.25, Uneasy <0.6, Dangerous <1.2, Perilous above.
- Effects: danger multiplier = 1 + 0.5 x min(2, danger), so up to double. Monster quests are weighted 14 + 46 x min(1.5, danger), target real nearby groups (stronger and closer likelier), take their count and rise a rank for 4+ creatures (two for 8+), and pay the full multiplier; other quests get 30% of it. Halls post up to two extra notices when danger is high. One notice per group at a time; it closes ("Threat gone") when the group is slain, driven off or moves on, and completing it marks the group slain.
- Market Bounties tab: the hall's danger and 30-day history, price per head for every hostile kind within reach (a tenth of the creature's XP in gold x the multiplier, with a 7-day change and a link to find the nearest group), the open quests and their rewards, and the going rate for each rank there.

## Ecology, price reasons and the chronicle
- Ecology per 256-mile region and creature group (game and grazing beasts, predators, scavengers, raiders, undead, monsters, sea creatures), as a multiplier on a normal year (0.3-2.6): prey wanders with slow noise (about ±38%), predators follow prey four months later; spring +15% grazers and +8% predators, winter -15% grazers and +10% scavengers, bears at 35% in winter; famine grazers down up to 38% and predators up 22%; plague undead up to +160% and scavengers +60%; war scavengers +90%, undead +50%, raiders +35%, grazers -15%; booms raiders +15%; each kill in the last 180 days -14% for its kind (fading), predator kills +5% grazers. Below 100% some groups vanish; above, packs grow and second groups appear nearby.
- Prices also carry monster danger on the roads (imported goods +5% per danger point, up to +10%), game (meat ±) and predators (livestock and wool ±). Each item's price can be broken down into all its factors with this week's changes; a "Why prices are moving" summary heads each town's board.
- Chronicle: party log entries (quests, monsters, travel, notes) are stored with the world; hero entries (start, level, guild, buy/sell, downs and deaths) with each hero; NPC interaction notes are merged in. The party location is stored with the world and drawn as a banner; travel can advance the calendar.

## Heroes (character creation and play sheet)
- Toolbar "Heroes" (shortcut H). Rules from the System Reference Document 5.1 (CC BY 4.0), summarised in our own words: 9 races with their SRD subraces (hill dwarf, high elf, lightfoot halfling, rock gnome; dragonborn ancestry; half-elf +1/+1 and two skills; tiefling Infernal Legacy), 12 classes levels 1-20 with their SRD subclass (Berserker, Lore, Life, Land, Champion, Open Hand, Devotion, Hunter, Thief, Draconic Bloodline, Fiend, Evocation), the SRD Acolyte plus mechanics-only backgrounds (Criminal, Entertainer, Folk hero, Guild artisan, Hermit, Noble, Outlander, Sage, Sailor, Soldier, Urchin, Custom).
- Steps: Basics (name, level, alignment, age, hometown, race, class, background, race and background languages; background skills that duplicate a race skill can be swapped), Scores (standard array with swap-on-select, 27-point buy, 4d6-drop-lowest, manual), Class (skills, expertise, Lore skills, fighting styles, ranger enemy/terrain, druid land, dragon ancestor, Metamagic, pact boon, eldritch invocations with level and pact prerequisites, ability score improvements at 4/8/12/16/19, fighter also 6/14, rogue also 10), Gear (class kit options with "any weapon" pickers, or rolled class starting gold instead of class and background kits; shop), Spells, Story.
- A readiness box lists every unmade choice with a link to its step; "Fill in the rest for me" makes sensible defaults while keeping the player's picks. "Quick build" makes a complete character: class-appropriate race, standard array in priority order, recommended skills, kit, spells and personality.
- Derived sheet: ability mods, proficiency 2 + (level-1)/4, saves (monk all at 14, rogue Wis at 15), skills with proficiency, expertise, Jack of All Trades and Remarkable Athlete, passive Perception, AC (best wearable armour, Dex caps, shield, Defence style, barbarian/monk unarmoured defence, draconic 13 + Dex; druids won't wear metal), speed (heavy armour Str requirement, barbarian fast movement, monk unarmoured movement, exhaustion), HP (max die at 1st, average after, plus hill dwarf/draconic +1 per level, or a manual override), hit dice, attacks for every weapon owned (finesse/ranged/monk weapons pick the better ability, proficiency, Archery and Duelling, versatile damage, martial arts die, unarmed strike), dragonborn breath (DC 8 + Con + prof, 2d6 to 5d6), and cantrip attacks scaling at 5/11/17 (eldritch blast beams, Agonizing Blast).
- Spellcasting: full, half (paladin, ranger from 2nd: full-caster table at half level rounded up) and pact slots (1-4 slots of 1st-5th level, short rest); cantrips known per class; spells known (bard, ranger, sorcerer, warlock), prepared = ability mod + level (cleric, druid; paladin mod + half level), wizard spellbook 6 + 2 per level with a prepared subset. Always-prepared domain, oath and circle spells; Fiend expanded list; bard Magical Secrets (any class, counted); Pact of the Tome cantrips from any class; Mystic Arcanum 6th-9th. About 320 SRD spells with level, school, casting time, range, duration, concentration and ritual tags and a short summary.
- Play sheet: tap any ability, save, skill, initiative or attack to roll d20 with normal/advantage/disadvantage (halfling Lucky rerolls 1s; fighters crit on 19-20 or 18-20); damage buttons roll the dice and double them after a critical; free dice tray d4-d100; recent roll log. HP damage (temporary HP first, massive-damage warning, damage at 0 HP adds a failed death save), healing, temporary HP, death saves with a roll button, hit dice spending, short rest (short-rest features and pact slots) and long rest (HP, slots, features, half hit dice, one exhaustion level). Spell slot pips and Cast buttons that spend the lowest suitable slot; limited-use trackers for Rage, Bardic Inspiration, Channel Divinity, Wild Shape, Second Wind, Action Surge, Indomitable, Ki, Lay on Hands, Divine Sense, Sorcery points, Arcane Recovery, breath weapon, Relentless Endurance and more. Inspiration, exhaustion 0-6 and the SRD conditions with reminders. XP with next-level threshold, level up/down (HP and guild level kept in step), druid Wild Shape forms linked to creature cards.
- World links: the hometown sets shop prices from its live market (exact goods use the market price and stock; others use the town's arms or gear price level; martial weapons and heavy armour need a town, armour of 400 gp+ a city); a bond with a real resident of the hometown (mentor, debt, sibling, rival, sweetheart, saved, oath), shown on that NPC's page too; background ties to the hometown's organisation (e.g. Acolyte to the Temple); purple shield badges on hometowns; registering a hero adds it to the Guilds party (merit, rank, quest difficulty), and the party list links back to the sheet; heroes appear in search.
- Bonds: with a hometown, "New bond" picks a different resident and bond kind each time (mentor, debt, sibling, rival, sweetheart, saved, oath); the kind and the person can also be chosen from lists, or "Write my own instead" turns it into free text. Without a hometown it rolls from a list of general bonds. Changing hometown re-rolls a bond whose person lives elsewhere.
- Player's Handbook options: subraces Mountain dwarf, Wood elf (speed 35), Dark elf/drow (darkvision 120, Drow Magic, rapier/shortsword/hand crossbow), Stout halfling and Forest gnome, as short summaries. Every PHB subclass can be chosen by name; non-SRD subclasses switch off the SRD subclass's built-in features (e.g. Champion crits, Life domain spells and heavy armour, Draconic AC/HP, Land circle spells) and take features the player types in ("3: Name: effect"), shown on the sheet from that level.
- AideDD (aidedd.org) is the reference for anything outside the free SRD: links to full class, race and background rules, every spell's full text, conditions, feats and invocations; creature cards link to the full Monster Manual entry; creatures without a built-in card link straight to AideDD; the search box offers "Look up … on AideDD" for any monster name; magic items on market boards link to their AideDD entries.
- Heroes save in the browser separately from the world (key atlas-heroes-v1) and travel inside the map code; loading a code adds any heroes not already present.

## Edits & saving
Edits are stored as a diff over the generated world: overrides, deletions, added settlements/roads/labels, paint strokes, declared and called-off events, resident changes, and guild data (party, quest states with frozen details, reputation, relation shifts, agenda states, custom quests). Roads are selected and reshaped only in the Road tool: drag dots (generated roads bend smoothly between dots and keep their ends on their towns; stored as edits.rov[id] = { pts, h } with h the dot indices; hand-drawn roads store pts and h in radd), double-tap to add or remove dots, Reset shape for generated roads. Undo/redo keeps 80 steps. The calendar date saves too. Everything saves in the browser automatically (database plus a second copy, see Campaign); "World -> Copy map code" exports it as a text code, and backup files carry the whole campaign.
