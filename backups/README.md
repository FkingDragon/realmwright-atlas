# Backups

There are **three layers** of safety for this project:

1. **GitHub history (automatic).** Every time a change is saved ("committed"), GitHub keeps the old version forever. To see or restore one: open a file on GitHub → **History** (clock icon, top right) → pick a version → **⋯ → View file** → copy it back.
2. **Dated copies in this folder (by hand).** Before any *big* change to `index.html`, copy it here as `index_YYYY-MM-DD_short-note.html` (e.g. `index_2026-11-02_before-new-monsters.html`) and add a line to the table below. These open directly in a browser, so anyone can run an old version.
3. **Releases (milestones).** When a version is good and tested, make a GitHub **Release** (right-hand side of the repository page → *Create a new release*, tag like `v1.0`). GitHub stores a downloadable zip of the whole project at that moment.

Players' own worlds are **not** stored here — they live in each person's browser. Remind testers to use **World → Copy map code** and keep that text somewhere safe.

## Backup list

| File | Date | Why |
|---|---|---|
| `index_2026-10-10_original.html` | 2026-10-10 | Original page exactly as built in Claude, before going on GitHub |

## Restoring a backup

1. Open the backup file on GitHub → **Raw** → select all → copy.
2. Open `index.html` → ✏️ **Edit** → select all → paste.
3. **Commit changes** with a note like "Restore backup from 2026-10-10", and add a line to `CHANGELOG.md`.
