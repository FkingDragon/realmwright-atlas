# Contributing to Realmwright Atlas

Thanks for helping! You don't need to be a programmer to contribute.

## No code needed

- **Test it** and report what breaks: [open an issue](../../issues/new/choose) → *Bug report*.
- **Suggest things**: new monsters, goods, events, jobs, guild quests → *Idea*.
- **Check the numbers**: prices, populations, CRs and rules. If something looks off against the SRD or Player's Handbook, say which page or rule.

When reporting, the most useful things are: what you did, what you expected, what happened, your device/browser, and your **map code** (World → Copy map code) so others can load the exact same world.

## Changing the code

The whole app is one file: **`index.html`** (styles, then the page, then one big script). There is no build step.

1. **Fork** this repository (button at the top right on GitHub).
2. Edit `index.html` — directly on GitHub with the ✏️ pencil, or on your computer.
3. To test on your computer, just open `index.html` in a browser.
4. Open a **Pull Request** describing what you changed and why.

### House rules

- **Same seed = same world.** Generation must stay deterministic: use the seeded random functions, never `Math.random()` for anything that shapes the world or its people (it's only for player dice rolls).
- **Don't break saved worlds.** Players' edits are stored as differences on top of the generated world (`localStorage` and map codes). If you change a saved format, keep reading the old one.
- **Rules content:** only SRD 5.1 text may be summarised in the app (in our own words). For anything else (non-SRD monsters, subclasses, spells), link to AideDD instead of copying it.
- **Keep it one file, no outside libraries** except Google Fonts — it has to work offline-ish and on phones.
- **Phones matter.** Check your change on a narrow screen.
- Update [`docs/world-atlas.md`](docs/world-atlas.md) when you change how something works.
- **Record every change** in [`CHANGELOG.md`](CHANGELOG.md): date, what changed, which file, your name.
- **Before a big change** to `index.html`, save a dated copy in [`backups/`](backups/README.md).
