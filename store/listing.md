# Store listings

Text for the Chrome Web Store and Firefox Add-ons (addons.mozilla.org, AMO) listings, which go live on the same day (HANDOFF section 12). Stage 1 is English only (settled 25 Sep 2026); the Dutch drafts are in git history for a later stage. Screenshots are in `store/screenshots/`.

The text leads with the verdict (keep, repair or upgrade), then the bar (changed 12 Nov 2026). People already ask forums whether they may replace their phone, so the answer is what they come for; the bar is how the answer reaches them when they're tempted. The short description is also `appDescription` in `_locales/en/messages.json` and the summary in `store/amo-metadata.json`: change all three together.

## Name

Upgraditch (working name until Checkpoint A; rename via `appName` in `_locales` and `APP_NAME` in `src/config.js`)

## Short description (Chrome: max 132 characters; AMO summary: max 250)

Should you replace your phone? An honest answer: keep it, repair it or upgrade. Then it shows up on shop pages when you're tempted.

## Full description

Should you replace your phone, or is it just the itch? Upgraditch gives you an honest answer: keep it, repair it, or upgrade.

Tell it which phone you have and what would make you replace it. A few questions later you have a verdict, with the checks behind it. It says "upgrade" plainly when security updates have ended or your banking, ID or work apps no longer run, which is why you can believe it when it says "keep".

Then it shows up when you're tempted. On a phone page on Tweakers, GSMArena, Coolblue, bol or MediaMarkt, a small bar appears in the bottom-left corner, out of the way of the site's menu and search: your phone, one short fact about it, and a "Close tab" button. Click the bar and it checks the page against the reasons you gave: battery, updates, camera and so on. It is a second opinion, not a blocker: nothing on the page is ever blocked.

- **Need test.** Keep it, repair it, or upgrade, with each check listed. It never hides "upgrade". "It feels slow" is checked against the battery first: a worn battery is a repair, not a new phone.
- **Your own rule.** Tell it once what would make you replace your phone. When you're tempted, it asks you back.
- **Cooldown.** Want something? Give it a quiet end date, 7 days by default: "Check again on 29 Oct". No countdown. At the end, it asks whether you still want it.
- **Urge log.** One tap to note that a page tempted you.
- **Milestones.** 2, 3, 4 and 5 years with your phone, and the day its security updates end.
- **Pause** for a day, a week, or until you switch it back on, for when the answer is "upgrade" or you're shopping for someone else.

Private by design: no account, and your data stays in your browser. It looks only at pages on the sites you allow, and only at their address and title. It looks up the end of security updates on endoflife.date without sending your phone's name. Optional anonymous counts help test which wording in the bar works; they are off unless you switch them on. Open source.


## Category

- Chrome Web Store: Shopping
- AMO: Shopping (in `store/amo-metadata.json`)

## Privacy policy

`PRIVACY.md`. Both stores want a URL: link to the file in the public repository.

## Chrome Web Store: privacy practices tab

**Single purpose:** Shows a short reminder on phone pages of a few shops and spec sites when the user is tempted to replace a phone that still works, and helps them decide whether they need a new one.

**Permission justifications:**

- `storage`: keeps the user's phone details, settings, urge log and cooldowns in the browser.
- `activeTab`: "This page tempted me" in the popup notes the site of the current tab, only when the user clicks it.
- `scripting`: registers the bar's content script for the sites the user allowed during setup, and only those.
- `alarms`: daily housekeeping, the hourly upload of the opt-in counts, and the toolbar badge for cooldown end dates and milestones.
- Optional host permissions (tweakers.net, gsmarena.com, coolblue.nl, bol.com, mediamarkt.nl, gathering.tweakers.net): the bar only appears on these sites, and only after the user allows them in one prompt. The forum is declared but not requested yet.

**Remote code:** No. All code is in the package.

**Data usage:** Tick "Website content" is **not** needed: only the page address and title are read, on the allowed sites, and they are not sent. Tick "User activity" only for the opt-in counts (clicks on the bar), which are anonymous and off by default. Certify: not sold, not used for unrelated purposes, not used for creditworthiness.

## Firefox Add-ons: notes for reviewers

The code is bundled with Vite but not minified (`scripts/build.js`). Source code is uploaded with each version (`npm run package:source`). To build: Node 22, `npm ci`, `npm run build`; the output is `dist/`.

Data collection is declared in `manifest.json` (`data_collection_permissions`: required none, optional `technicalAndInteraction`). Switching the counts on asks for Firefox's data consent.

`npm run lint:firefox` gives no errors and four warnings. Two are `UNSAFE_VAR_ASSIGNMENT` (`innerHTML`) in `content/bar.js` and `chunks/NeedTest.js`: both are inside Preact's renderer, on the path for `dangerouslySetInnerHTML`, which this code never uses. The other two are about the manifest: `service_worker` is listed for Chrome next to `scripts` for Firefox, and Firefox for Android is not a target.

## Screenshots

Chrome Web Store: 1280×800, up to 5. AMO: any size, 1280×800 works. In `store/screenshots/`:

1. `1-bar.png`: the bar on a phone page
2. `2-card.png`: the card with the user's own rule
3. `3-popup.png`: the popup
4. `4-need-test.png`: the need test result
5. `5-onboarding.png`: setup, step 1

The shop pages in the screenshots are real third-party sites. Check the stores' policies on showing them, or swap in a neutral page before submitting.

## Still needed from the owner

- The final name (Checkpoint A).
- Chrome Web Store developer account; AMO API key and secret (for `npm run sign:firefox`).
- The 30-second recording for the Chrome listing is uploaded to YouTube and linked there. Like the text, open it with the need test's verdict and then show the bar.
