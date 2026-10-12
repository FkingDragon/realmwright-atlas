# Change log

Every change to the project goes here, newest first. Add a line when you change anything — even small fixes.

Format: `## Date — short title`, then bullet points saying **what** changed, **which file**, and **who** did it.

---

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
