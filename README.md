# Upgraditch

A browser extension that shows up when you are tempted to replace a phone that still works. "Upgraditch" is a working name.

The build spec is [HANDOFF.md](HANDOFF.md); goals and gates are in [Holdout Requirements & Roadmap.md](Holdout%20Requirements%20&%20Roadmap.md).

## Develop

Needs Node 22 or later.

```sh
npm install
npm run build     # builds dist/, which runs in Chrome, Brave, Edge and Firefox
npm run watch     # rebuilds on change; reload the extension to pick it up
npm test          # unit tests (vitest)
npm run lint:firefox   # Mozilla's add-on linter on dist/
npm run package        # zip of dist/ for the stores, in web-ext-artifacts/
npm run package:source # source zip for Firefox Add-ons review
npm run sign:firefox   # sign and submit to Firefox Add-ons (needs WEB_EXT_API_KEY and WEB_EXT_API_SECRET)
```

Load the build:

- **Chrome, Brave, Edge:** open `chrome://extensions`, switch on Developer mode, choose "Load unpacked" and pick `dist/`.
- **Firefox:** open `about:debugging#/runtime/this-firefox`, choose "Load Temporary Add-on" and pick `dist/manifest.json`. Or run `npm run start:firefox` if `firefox` is on your path.

`npm run start:firefox` and `start:chrome` open a fresh browser with the extension loaded. They can't find Flatpak browsers, and branded Chrome ignores the extension anyway, so point them at the copies from `e2e/` (`npm run browsers` there):

```sh
WEB_EXT_FIREFOX=$(ls -d e2e/browsers/firefox/linux-*/firefox/firefox | tail -1) npm run start:firefox
CHROME_PATH=$(ls -d ~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome | tail -1) npm run start:chrome
```

Installing opens the onboarding in a new tab.

## Layout

- `manifest.json`, `_locales/`: copied into `dist/` as they are. Every UI string lives in `_locales`.
- `src/config.js`: the working name and the URLs still to be decided (uninstall survey, feedback, counts endpoint). Empty URLs switch those features off.
- `src/background/`: install flow, uninstall URL, alarms, the toolbar badge, and registering the bar for the sites the user allowed.
- `src/content/`: the bar and its card, shown on phone pages in a closed Shadow DOM.
- `src/onboarding/`, `src/popup/`: the extension's pages (Preact). The popup holds the need test, "Share my stats", milestones and the data export.
- `src/lib/`: storage, calculations, the event log, the site table with its phone-page patterns, headlines, cooldowns, the need test, milestones, the stats summary and the endoflife.date lookup. Tested in `tests/`.
- `worker/`: the counts endpoint, a Cloudflare Worker with a D1 database. See [worker/README.md](worker/README.md).
- `e2e/`: browser checks in Chrome for Testing and Firefox. See [e2e/README.md](e2e/README.md).
- `store/`: store listing text, Firefox Add-ons metadata and screenshots.
- `research/`: kits for the diary study, interviews and prototype sessions, and the field study spec (B4) that defines the opt-in counts. Diary data goes in `research/data/`, which stays out of git. The plan behind them is [Holdout Research Plan.md](Holdout%20Research%20Plan.md).
- `design-reference/`: the design mock-ups. Visual reference only; where they differ, HANDOFF.md wins.
- [PRIVACY.md](PRIVACY.md): what stays in the browser and what leaves it.
- `scripts/build.js`: the Vite build. Output is not minified, so the shipped code stays readable.

The code is under the MIT License ([LICENSE](LICENSE)). The fonts are Plus Jakarta Sans and JetBrains Mono, under the SIL Open Font License (`src/fonts/`).
