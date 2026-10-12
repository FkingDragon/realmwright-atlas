# Change log

Every change to the project goes here, newest first. Add a line when you change anything — even small fixes.

Format: `## Date — short title`, then bullet points saying **what** changed, **which file**, and **who** did it.

---

## 2026-10-12 — Tilewright features prepared on branch `tilewright-style` (not live)
*By: project owner (prepared with Claude)*

- Built from Sean's Tilewright and Market Ledger files: the Tilewright look, a pixel-art battle map, a **Tiles** editing tool, the full SRD item and monster lists, and an inn bill on a new Market → **Shop** tab.
- Built on the 10 October atlas. The main copy is now v21 in the other Claude chat, so this work is **handed over** rather than merged: see **handover/HANDOVER.md**.
- **index.html** (branch only) — all of the above, tested on the 10 October build
- **handover/** — the new code as separate modules, the theme, a full patch and step-by-step notes for folding it into v21
- **data/srd_catalog.json**, **data/srd_monsters.json** — SRD 5.1 items and monsters (CC BY 4.0), compiled by Sean
- **legacy/tilewright.html** — Sean's original battle map, for reference
- **backups/index_2026-10-12_before-tilewright-style.html** — copy taken before starting
- The live site (`main`) is unchanged.

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
