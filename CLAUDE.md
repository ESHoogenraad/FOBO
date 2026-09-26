# CLAUDE.md

Upgraditch (working name; planning docs keep "Holdout" file names): Manifest V3 extension, one build for Chrome, Brave, Edge and Firefox desktop. Shows a bar on phone pages of shops and spec sites when someone is tempted to replace a working phone.

## Sources of truth

- [HANDOFF.md](HANDOFF.md) is the spec: IDs F1–F14, V1–V7; data §5, bar §6, tokens §7, build order §11, acceptance §12, open decisions §13. Read the relevant section before building.
- `research/B4 Field study spec.md` owns events, fields and headline randomisation.
- HANDOFF beats `design-reference/`; its `.dc.html` files are visual reference, not code.

## Commands (Node 22+)

```sh
npm run build          # dist/, unminified on purpose; npm run watch rebuilds
npm test               # one file or name: npx vitest run tests/calc.test.js -t "name"
npm run lint:firefox   # lints dist/, so build first
```

web-ext: `start:firefox`, `start:chrome`, `package`, `sign:firefox` (after `package:source`, which zips git `HEAD` and refuses uncommitted changes, so `research/data/` never leaves the machine). The counts endpoint lives in `worker/` with its own `package.json` (wrangler); its tests run with the rest (`tests/worker.test.js`). Load `dist/` unpacked, or `dist/manifest.json` in Firefox `about:debugging`.

## Rules

- Build only HANDOFF Must/Should items. Unsure: check §13, then ask.
- Never: accounts, remote code, analytics SDKs, other tracking, `<all_urls>` or `https://*/*` host permissions, minification.
- Only endoflife.date lookups and opt-in counts leave the browser. Payloads carry no device names, notes, URLs or timestamps; `siteCategory` comes from the site table.
- Bar speed and reliability come first (§6: render within 200 ms, overlay with no layout shift, no DOM watching).
- Every UI string lives in `_locales/en/messages.json` (Stage 1 is English only; Dutch drafts are in git history). The name appears only in `appName` and `APP_NAME` (`src/config.js`).

## Gotchas

- `import browser from 'webextension-polyfill'`, never `chrome.*`. Tests alias it to `tests/fake-browser.js`; extend that for new APIs.
- `permissions.request` (sites; Firefox data consent via `setCountsOptIn`) must be the click handler's first call, with no `await` before it.
- `scripts/build.js` runs two builds: pages and background as ES modules (a new entry goes in `rolldownOptions.input`), and `content/bar.jsx` as one IIFE with CSS via `?inline` (content scripts can't be modules).
- The background is a service worker in Chrome and an event page in Firefox: register listeners at top level; alarms are re-created `onStartup`. It registers the bar's content script at runtime for granted origins (the manifest has none).
- New site: add it to `SITES` in `src/lib/match.js`, the manifest's `optional_host_permissions` and `web_accessible_resources.matches`.
- Storage splits HANDOFF's `Settings` on purpose (see the `src/lib/storage.js` header). Schema change: bump `SCHEMA_VERSION`, add `MIGRATIONS[n]`.
- `EVENT_FIELDS` whitelists events and fields; `toPayload` must never leak private fields. A change there also needs `worker/src/validate.js` (a test checks they agree).
- endoflife.date is fetched only in the background script (`lib/eol.js`, message `eolLookup`), by brand; the phone name is matched locally and never sent.
- `tests/locales.test.js` only finds literal `t('key')`/`localizePage('key')` calls plus the key families it lists. Add any new template-literal family there.
- Colours: `--brand` only for the logo and primary actions; `--ok` never on buttons. `components.css` uses classes only, because the bar's shadow root loads it too.
- An empty URL in `src/config.js` switches that feature off.

## Browser testing

- Scripts in `e2e/` (own `package.json`; see `e2e/README.md`, including its "Traps with the bar"): `bar-fake.mjs` (offline, run after any bar change), `chrome-pages.mjs`, `firefox-pages.mjs`, `bar-live.mjs`, `store-shots.mjs`. They run on patched copies of `dist/` made by `makeTestBuild()` in `e2e/lib.mjs`; extend that rather than patching by hand.
- Chrome: Chrome for Testing only (branded Chrome ignores `--load-extension`). Headless never shows the host-permission prompt.
- Firefox: selenium + geckodriver; it refuses navigation to and scripts in `moz-extension://` pages, so drive those through the UI.
- Delete `.playwright-mcp/` afterwards, because the repo will be public.
