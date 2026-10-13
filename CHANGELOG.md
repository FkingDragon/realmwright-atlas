# Change log

Every change to the project goes here, newest first. Add a line when you change anything — even small fixes.

Format: `## Date — short title`, then bullet points saying **what** changed, **which file**, and **who** did it.

---

## 2026-10-13 — v27: heroes join guilds; places come alive
*By: project owner (prepared with Claude)*

- **index.html**, guild membership:
  - heroes can join any organisation in a town: the Adventurers' Guild, the Rulers, the Temple, the Watch, the Merchants' Guild, the Craft Guilds, the Mages' Circle, and (if it approaches them) the Thieves' Guild;
  - each has a fee, dues, four ranks and fitting benefits;
  - member prices and better selling prices show on the Gear step, and fellow members are noted on people's pages.
- **index.html**, place scenes: every named place shows **What's happening** at dawn, morning, midday, afternoon, evening and night. A scene covers:
  - who is in;
  - the town's events and the season;
  - something particular to the place;
  - a rumour;
  - the places around it.
- **source/**: new `app32.js` and `app33.js`, plus the tests `gjoin.js` and `scene.js`.
- **docs/world-atlas.md**: notes for v27.
- **backups/index_2026-10-13_v27.html**: a copy of this version.
- Tests: 291 automated checks pass.

## 2026-10-13 — v26: finding things faster
*By: project owner (prepared with Claude)*

- **index.html**, places:
  - every place opens with **At a glance**: Market, Danger, Quests and People tiles, each jumping to its tab;
  - below them come today's events, who is in charge, tracked residents and the DM's notes;
  - the editing fields move into a fold-out **Edit this place**.
- **index.html**, the World page: it starts with **Today** (the biggest events) and **Jump back to** (the party, tracked people, recently opened places and people).
- **index.html**, the side panel: its top is tighter, with search and sections on one row. On a laptop that row folds away as you read down.
- **index.html**, the map: zoomed out, monster groups gather into one marker with a count; tap it to zoom in.
- **index.html**, on phones:
  - pages open at their own header;
  - the map tools are icons that fit;
  - the seed line no longer overlaps the buttons.
- **source/**: updated modules and the new `tests/flow.js`.
- **docs/world-atlas.md**: notes for v26.
- **backups/index_2026-10-13_v26.html**: a copy of this version.
- Tests: 267 automated checks pass.

## 2026-10-13 — v25: the eight-point check
*By: project owner (prepared with Claude)*

- **index.html**, live sharing:
  - changes that fail to send are kept and sent again when you're back online, or with **Try again now**;
  - the live chip says when you're offline;
  - you're told when someone else's later change to the same thing was kept;
  - merge summaries count battle-map areas and heroes.
- **index.html**, people:
  - people mourn family who die: they stay home for a week, visit the grave for two months, and their page has a **Losses** section;
  - occupied towns show a disarmed watch and life under the garrison.
- **index.html**, 2024 rules for every class:
  - the features at every level and the SRD 5.2 subclasses;
  - 2024 spell counts, with paladins and rangers casting from level 1;
  - Divine and Primal Order, Blessed Strikes and Elemental Fury;
  - the 2024 Metamagic and invocations, with the pact boons as invocations;
  - epic boons at level 19;
  - 2024 starting kits and fixed starting gold;
  - one use back on a short rest for Rage, Channel Divinity, Wild Shape and Second Wind.
- **index.html**, accessibility:
  - skip links come first;
  - page changes are announced and focus lands on the page name;
  - bigger touch targets on phones;
  - a side-by-side layout for a phone held sideways;
  - text colours checked for contrast;
  - the version is shown in Help and the World menu.
- **index.html**, fixes:
  - "Show on map" centres properly;
  - a capital placed next to another capital stays in its own realm (existing worlds unchanged);
  - monk speed rises at the right levels.
- **source/**, new: the modules the page is built from, `build.py`, and the browser tests. `source/README.md` explains how to build and test. Run `python3 build.py` in `source/` to rebuild.
- **docs/live-table-checklist.md**, new: things to check at a real session with two devices.
- **docs/world-atlas.md**: notes for v25.
- **backups/index_2026-10-13_v25.html**: a copy of this version.
- Tests: 249 automated checks pass.

## 2026-10-12 — v24: the atlas panel and a framed map
*By: project owner (prepared with Claude)*

- **index.html** — a new layout:
  - the map sits in its own frame beside a docked side panel;
  - the side panel drills down World › Realm › Place, and each place has Overview, Market, People and Guilds tabs, with breadcrumbs back up;
  - the calendar is always at the top of the side panel;
  - the map tools are along the top of the map;
  - the side panel can be hidden;
  - on phones the map is on top with the atlas below, and a handle resizes the two.
- **docs/world-atlas.md** — layout notes added.
- **backups/index_2026-10-12_v24.html** — a copy of this release.

## 2026-10-12 — v20 to v23: saving, live table, battle map, Shop, Market Ledger ideas
*By: project owner and Sean (prepared with Claude)*

- **index.html** — brings the site up to v23 of the main copy (it was still the 10 October first release):
  - **v20:** safer saving with snapshots; DM and player modes; lasting town history; the 2024 rules option; accessibility.
  - **v21:** a library of your worlds; protection when two tabs are open; stable worlds that survive updates; a live shared table on the Claude page (this GitHub copy keeps backup files and merging instead).
  - **v22:** Sean's Tilewright look, the pixel-art battle map, the Tiles tool (T), and the full SRD lists. The SRD lists add a Shop tab with an inn bill, and 334 monsters with full stat blocks.
  - **v23:** ideas from Sean and Adam's Market Ledger:
    - everyday prices, shown in gold, silver and copper;
    - parchment stat blocks;
    - households, Around town now and a daily town Chronicle;
    - Recent changes;
    - guild colours and quest danger ratings;
    - town wealth and defence.
- **docs/world-atlas.md** — design notes updated to v23.
- **ATTRIBUTION.md** — adds Tilewright, the Market Ledger, and the Atkinson Hyperlegible and Pixelify Sans fonts.
- **backups/index_2026-10-12_v23.html** — a copy of this release.
- The full version-by-version list is in docs/world-atlas.md and the project's main change log.

## 2026-10-10 — Tidy repository layout
*By: project owner (prepared with Claude)*

- Moved every file out of the `realmwright-atlas/` sub-folder to the top level, so GitHub Pages finds `index.html`
- Removed the uploaded `realmwright-atlas.zip` (its contents are already here)
- Replaced the starter README with the project README, now linking to the live site
- Added the hidden files the web upload skipped: `.github/` issue forms, `.nojekyll`, `.gitignore`

## 2026-10-10 — First release on GitHub
*By: project owner (prepared with Claude)*

- **index.html** — the Realmwright Atlas app, copied from the original Claude artifact. Small changes for the web:
  - moved the page title into the page header so browser tabs show "Realmwright Atlas"
  - added a short description (shown when the link is shared in chats) and a brass compass tab icon
  - no game code was changed
- **backups/index_2026-10-10_original.html** — untouched copy of the original page, exactly as it came from Claude
- **README.md** — what the app is, how to play, how to help
- **CONTRIBUTING.md** — how friends can report bugs and change the code
- **CHANGELOG.md** — this file
- **ATTRIBUTION.md** — SRD 5.1 (CC BY 4.0) and font credits
- **docs/world-atlas.md** — full design notes for how the world works
- **backups/README.md** — how backups and restoring work
- **.github/ISSUE_TEMPLATE/** — "Bug report" and "Idea" forms
- **.nojekyll**, **.gitignore** — housekeeping files for GitHub Pages
