# Change log

Every change to the project goes here, newest first. Add a line when you change anything — even small fixes.

Format: `## Date — short title`, then bullet points saying **what** changed, **which file**, and **who** did it.

---

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
