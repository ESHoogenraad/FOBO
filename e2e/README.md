# Browser checks

Scripts that load the built extension (`dist/`) into Chrome for Testing and Firefox and go through it the way a user would. They print what they find (`ok` / `BAD` lines, stored values), and screenshots go to `e2e/out/`. They are checks to run and read, not a pass/fail suite: live shop pages change and sometimes fail to load.

## Set up

Needs Node 22, `zip`, and a build (`npm run build` in the repo root).

```sh
cd e2e
npm install
npm run browsers   # Chrome for Testing into ~/.cache/ms-playwright, Firefox into e2e/browsers/
```

Branded Chrome ignores `--load-extension`, so the scripts use Chrome for Testing. Set `CHROME_PATH` or `FIREFOX_PATH` to use other copies. `HEADED=1` shows the browser.

## Scripts

| Script | What it checks |
| --- | --- |
| `node chrome-pages.mjs` | Onboarding (lookup, month and year, errors), the need test (repair, upgrade, keep), milestone and badge, the day-14 prompt, Share my stats, export, and that the popup makes no outside requests |
| `node firefox-pages.mjs` | The real flow in Firefox, including the site prompt and the data consent; `LIVE=1` adds the bar on the pages in `bar-pages.json` |
| `node bar-fake.mjs` | The bar on a stand-in shop page the script serves itself, so no live site or network: the layout at three window sizes, the tour, filters and new pages, a phone edited during a showing, urge tags and hide. Exits with 1 on any `BAD` line. Run it after any change to the bar |
| `node bar-live.mjs` | The bar on the pages in `bar-pages.json` in Chrome: shown on phone pages only, and how many ms after DOMContentLoaded; `INTERACT=1` also drives the card on a bol page |
| `node store-shots.mjs` | Rewrites the store screenshots in `store/screenshots/` |

With `ENDPOINT=http://127.0.0.1:8787/events`, `chrome-pages.mjs` and `firefox-pages.mjs` also upload the opt-in counts to a local copy of the counts endpoint. Start that first (see [worker/README.md](../worker/README.md)):

```sh
cd worker && npm run db:schema:local && npm run dev
```

## Test builds

`makeTestBuild()` in `lib.mjs` copies `dist/` to `e2e/.build/<name>` and patches only the copy:

- **grantSites:** the default sites become `host_permissions`, because headless Chrome never shows the permission prompt.
- **openShadow:** the bar's shadow root is open, so scripts can click inside it.
- **endpoint:** replaces `COUNTS_ENDPOINT` (from `src/config.js`) with another counts URL, such as a local `wrangler dev`.
- **fastUpload:** uploads every 6 seconds instead of every hour.
- **closeToPopup:** onboarding's Close button opens the popup page.

The shipped `dist/` is never changed.

## What each browser blocks

- **Firefox refuses** to navigate to `moz-extension://` pages and to run scripts in them. So `firefox-pages.mjs` drives the extension's pages through clicks only, and reaches the popup through the test build's Close button.
- **In Node**, `new URL('moz-extension://…').origin` is `"null"`.
- **Test prefs in Firefox:**
  - `extensions.webextOptionalPermissionPrompts=false` grants the site permissions and the data consent without a prompt.
  - The page load strategy is `eager`, because some shop pages never finish loading.
- **Shops in headless Chrome:** they serve a bot page to the headless user agent. Live-site checks therefore use a normal user agent and `--disable-blink-features=AutomationControlled`. Ads sometimes redirect the tab, so `bar-live.mjs` opens a fresh tab per page.
- **Rating and yes/no buttons** are invisible radio inputs over their labels. Select them with `getByRole('radio', { name }).check()`.

## Traps with the bar

- **The bar's host element is 0×0** on purpose, so Playwright calls it hidden. Wait for it with `waitForSelector('phone-check-bar', { state: 'attached' })`.
- **In a fresh profile** the background registers the bar's content script in `onInstalled`, a moment after launch. Call `barScriptReady(sw)` before opening a shop page, or that page never gets the bar.
- **bol's dialogs:** its cookie dialog ignores a click made before the page's scripts have started, and on a later tab it also asks for country and language. `dismissSiteDialogs()` waits for either and clicks until it closes. While one is open, bol hides every other element from assistive technology, the bar included, so role queries inside the bar find nothing.
- **Stand-in pages:** `ctx.route()` can serve your own HTML on a real shop URL, and the bar's content script still runs there. That is how `bar-fake.mjs` works without the live sites.
