# Upgraditch: Claude Code handoff (Stage 1 browser extension)

The build spec. Commands, session rules and gotchas for Claude Code are in `CLAUDE.md`.

Updated 22 Sep 2026 with the verdicts from the research plan's desk research (Track A). Where this file and the design references differ, this file wins.

## 1. What we are building

Upgraditch is a browser extension that shows up when someone is tempted to replace a phone that still works. On a phone page of a shop or spec site, a small bar appears in the bottom-left corner: the user's phone, one short headline, and a "Close tab" button. Clicking the bar opens a card that checks the page against the user's own reasons for replacing the phone.

"Upgraditch" (upgrade + itch) is a working name, chosen on 23 Sep 2026 after "Holdout" turned out to be taken by a coupon extension; Checkpoint A confirms it. Keep the name in one place (`__MSG_appName__` and one constant) so a rename is a single change.

Stage 1 goal: 30 real users for 4 weeks, and evidence that the bar changes behaviour and that people keep it installed. The build budget is 3 weekends. Stage 1 is also a small field study: with the user's opt-in, the extension varies the headline and sends anonymous counts of what happened. Interviews, the diary study and posts run in parallel and are not part of the code.

Source documents in this folder:

- `Holdout Requirements & Roadmap.md`: goals, gates, scope
- `Holdout Research Plan.md`: the evidence behind each mechanic (IDs A1 to A9)
- `research/B4 Field study spec.md`: event schema, headline randomisation, endpoint rules and analysis. Authoritative for everything in section 9
- `design-reference/`: the chosen design is "Dark: Tokyo Night device bar"

## 2. Working agreement for Claude Code

- Build only what is listed as Must or Should below. Ask before adding anything else.
- Never add accounts, remote code, third-party analytics SDKs, or `<all_urls>` / `https://*/*` host permissions, required or optional.
- Nothing leaves the browser except endoflife.date lookups and, only after the user opts in, the anonymous counts in section 9.
- The field-study instrumentation in section 9 is part of the product, not an extra. Don't add any other tracking.
- Speed and reliability on the default sites come before features. In the closest comparable extension, almost all 1 and 2 star reviews are about the overlay freezing the browser or being bypassed.
- Prefer plain JS or Preact with a minimal build (Vite). The code must be readable from source; it will be open sourced.
- When a requirement is ambiguous, check section 13 (open decisions) and ask rather than guess.

## 3. Scope

### Functional

| ID | Requirement | Priority |
| --- | --- | --- |
| F1 | Onboarding in three steps (section 8). 1: phone name (free text, looked up on endoflife.date), purchase date, price paid. 2: "What would make you replace it?", one-tap multi-select. 3: "Where Upgraditch shows up": the default sites, one permission request, and the "Help test what works" opt-in | Must |
| F2 | Derived numbers: age, cost per month, days until security updates end, money not spent (the prices of cooldown items the user dropped) | Must |
| F3 | Trigger detection: the default sites (section 4), and on those only pages about phones (section 6). Each site can be switched off in the popup | Must |
| F4 | The bar on phone pages (section 6): phone, random headline, "Close tab", "Log urge", "Cooldown", and hide for 24 hours on that site. Clicking it opens the own-rule card | Must |
| F5 | Urge log: timestamp, site, source, optional reason tag, optional note. One tap from the bar | Must |
| F6 | Cooldown: item, optional price, want rating 1 to 10, 7 days by default and adjustable, shown as a quiet end date ("Check again on 29 Oct"), never a countdown. End screen in section 8 | Must |
| F7 | Popup: phone summary, cooling-down list with end dates, "This page tempted me", need test, pause switch, sites on/off, counts opt-in, "Share my stats", feedback. No streaks | Must |
| F8 | "This page tempted me": logs the current site through `activeTab`. It doesn't add the site as a trigger; the logged sites feed the default list at Checkpoint A | Must |
| F9 | Need test: checks the user's stated reasons against the evidence; the result is keep, repair or upgrade, with the reason. "Slow" is answered with the battery check first. Says "upgrade" whenever security updates have ended or a real task is blocked (banking, ID or work apps no longer run on it), and never hides that answer. A "keep" result ends with "Make it feel new" (section 8) | Should |
| F10 | Milestones at 2, 3, 4 and 5 years and when security updates end, as a badge on the toolbar icon and a line in the popup. The 2-year milestone carries the battery and repair check | Should |
| F11 | Export all data as JSON | Should |
| F13 | Pause: "Pause Upgraditch" for 1 day, 1 week, or until switched back on. While paused, no bar anywhere. For when the need test says upgrade, or someone is shopping for someone else | Must |
| F14 | English through `chrome.i18n`. Every UI string lives in `_locales` from the first commit, so Dutch can follow in a later stage | Must |

F12, a satisfaction check-in after a purchase, is removed from Stage 1. The cooldown end screen covers the same effect without a purchase (research A6).

### Validation hooks

| ID | Requirement | Priority |
| --- | --- | --- |
| V1 | `chrome.runtime.setUninstallURL()` to a one-question form (URL is a config constant) | Must |
| V2 | "Share my stats" copies a JSON summary to the clipboard (schema in section 10); prompt at day 14 | Must |
| V3 | Always-visible feedback link in the popup (config constant) | Must |
| V4 | Opt-in anonymous counts: offered in onboarding step 3, switchable in the popup, off by default. Events recorded locally, sent in batches at most once an hour, only while opted in. If the endpoint constant is empty, nothing is sent | Must |
| V5 | A random headline per bar showing, recorded with its outcome (section 9) | Must |
| V6 | Onboarding funnel events: install, permission result, onboarding finished, first bar shown | Must |
| V7 | The counts endpoint: a small Cloudflare Worker in `worker/` (section 9) | Must |

### Out of scope

Accounts, sync servers, more than one phone (the data model allows it, the interface doesn't), other device categories, trigger sites added by the user, automatic price lookup, CO2 figures, streaks, community features, leaderboards, newsletter, share cards, F12, a light theme for the popup and onboarding (later, see section 7), Firefox for Android (section 4).

## 4. Architecture

Manifest V3, one codebase for Chrome, Brave, Edge and Firefox desktop. Firefox is built and tested from weekend 1, not ported at the end: the first posts go to open-source and privacy communities, where Firefox is likely far above its 6.7% share of Dutch desktop browsing. Firefox for Android is not a Stage 1 target (1.6% of Dutch mobile browsing), and Chrome for Android does not run extensions.

The repository layout is in `README.md` (Layout). The bar is a content script in a closed Shadow DOM, with its CSS loaded into the shadow root, never into the page. Design tokens live in `src/styles/tokens.css` (section 7), and the fonts are bundled as woff2 (no Google Fonts at runtime).

### Permissions

```json
{
  "permissions": ["storage", "activeTab", "scripting", "alarms"],
  "optional_host_permissions": [
    "https://tweakers.net/*",
    "https://www.gsmarena.com/*",
    "https://www.coolblue.nl/*",
    "https://www.bol.com/*",
    "https://www.mediamarkt.nl/*",
    "https://gathering.tweakers.net/*"
  ]
}
```

- Request all default origins in a single `chrome.permissions.request({ origins: [...] })` call from the button in onboarding step 3: one prompt, not five. Record the result (V6). Then `chrome.scripting.registerContentScripts` for the granted origins (`persistAcrossSessions: true`).
- Call `permissions.request` as the first thing in the click handler, with no `await` before it. The request needs a live user gesture, and Firefox rejects it once an `await` has run.
- The request is all or nothing: the user grants every site or none. Per-site control is the "sites on/off" setting in the popup, which stops the bar without touching the permission.
- `gathering.tweakers.net` is declared so it can be switched on after Checkpoint A, but it is not part of the default request until then. If it's added, existing users get it through a popup button ("Also show on the Tweakers forum"), because a new request needs a user gesture; new installs get it in the onboarding request.
- If the user declines, the popup and "This page tempted me" still work, and the popup offers the request again.
- No host permission for endoflife.date: its API sends `Access-Control-Allow-Origin: *` (checked 22 Sep 2026), so the service worker can fetch it without one, and installing shows no permission warning at all.
- No `notifications` permission: milestones and cooldown ends show as a badge on the toolbar icon and in the popup.

### Firefox desktop

- One manifest for both builds. `background` lists both `service_worker` (Chrome) and `scripts` (Firefox); current versions of each browser ignore the key meant for the other. Check this on the minimum versions you set.
- `browser_specific_settings.gecko.id` is required to sign a Manifest V3 add-on. Chrome ignores the key.
- Since 3 Nov 2025, Firefox Add-ons requires new add-ons to declare what they collect: `"data_collection_permissions": { "required": ["none"], "optional": ["technicalAndInteraction"] }` under `gecko`. The opt-in counts are the optional part.
- On Firefox, switching the counts on also calls `browser.permissions.request({ data_collection: ["technicalAndInteraction"] })`, first thing in the click handler, as with the sites, and as a request of its own. Switching the counts off removes it with `permissions.remove`.
- Use the `browser` namespace via `webextension-polyfill`. Run with `web-ext run` from weekend 1; build and sign with `web-ext`.
- Leave out `gecko_android`, the key that marks an add-on as working on Firefox for Android. Add it only if a test on a real phone passes with no fixes.
- Brave and Edge use the Chrome build.

### Storage

- `chrome.storage.sync` (100 KB total, 8 KB per item): settings, the phone, stated reasons, sites switched off.
- `chrome.storage.local`: urge log, cooldowns, event log, EOL cache. These grow and will not fit sync quotas. Keep the event log to the last 90 days.
- The client ID, install date, browser and counts opt-in also stay in local storage: they belong to one install, and syncing them would carry an opt-in to a browser where it was never given. The exact keys are in the header of `src/lib/storage.js`.
- Version the schema (`schemaVersion`) and write a migration function from day one.

## 5. Data model

```ts
type Device = {
  id: string;
  category: "phone";            // the only value in Stage 1; the field stays for later categories
  name: string;                 // free text, e.g. "Pixel 7 Pro"
  purchaseDate: string;         // ISO date
  purchasePrice: number;        // EUR
  securityEndDate?: string;     // end of security updates: endoflife.date or entered by the user
  maintenance: { date: string; cost: number; type: string }[];
  reasons: Reason[];            // onboarding step 2
  batteryHealthPct?: number;    // manual entry in Stage 1
};
type Reason = "battery" | "slow" | "camera" | "screen" | "storage" | "updates" | "damage" | "other";
type UrgeTag = "camera" | "speed" | "battery" | "deal" | "boredom" | "launch_hype" | "other";
type Urge = { id: string; at: string; site: string; source: "bar" | "card" | "popup"; tag?: UrgeTag; note?: string };
type Cooldown = {
  id: string;
  item: string;
  price?: number;               // EUR, optional; counts toward "money not spent" when dropped
  startedAt: string;
  days: number;                 // default 7, the user can change it
  endsOn: string;               // shown as "Check again on 29 Oct"; no countdown anywhere
  wantRating: number;           // 1 to 10 at the start
  wantRatingEnd?: number;       // 1 to 10 at the end
  outcome?: "bought" | "dropped" | "expired";
};
type Settings = {
  schemaVersion: number;
  installedAt: string;
  clientId: string;             // crypto.randomUUID(), created at install
  countsOptIn: boolean;         // V4, default false
  pausedUntil?: string | "manual";
  sitesOff: string[];
  hiddenUntil: Record<string, string>; // site -> ISO time, from the bar's hide button
  browser: "chrome" | "edge" | "brave" | "firefox" | "other"; // detected once in the onboarding page
};
```

`Settings` is one type here but split across sync and local storage in the code (section 4, Storage). The events are defined in the B4 spec (section 9).

### Calculations (lib/calc.js, unit tested)

- `monthsOwned = daysOwned / 30.44`, with a floor of 1 month to avoid huge values for new devices.
- `costPerMonth = (purchasePrice + sum(maintenance.cost)) / monthsOwned`, rounded to cents for display.
- `daysToEol = securityEndDate - today` (null if unknown).
- `moneyNotSpent = sum(price)` over cooldowns with outcome `dropped`.
- Sample for tests: EUR 899, bought 2022-10-20, today 2026-09-19 gives about EUR 19.14 per month.

### End of life lookup

Fetch `https://endoflife.date/api/v1/products/<slug>` in the service worker, cache 7 days in local storage, and match the phone name fuzzily against each release's `label`. Checked against the live API on 22 Sep 2026:

- Phone slugs: `pixel`, `samsung-mobile`, `oneplus`, `fairphone`, `motorola-mobility`, `nokia`, `sony-xperia`, `iphone`.
- For every Android brand, `eolFrom` is the end of security updates (the product's `labels.eol` says "Security Updates" or "Security Support"). Store it as `securityEndDate`. Example: Pixel 7 Pro, 2027-10-01.
- `eoasFrom`, where present, is the end of new Android versions. It can come much earlier (Galaxy S22: Android upgrades ended Feb 2026, security updates run to Feb 2027). Never show it as the updates date; people mix the two up. The need test uses it only to explain the difference (section 8).
- iPhone: Apple announces no end date, so `eolFrom` is only filled in after support has ended. Show "No end date announced"; the `support` headline is not eligible unless the user enters a date.
- If there is no match, ask the user for a date or leave it blank.

## 6. The bar (core interaction)

Reference markup: `design-reference/TokyoNight.dc.html`. The `.dc.html` files use a design-tool runtime (`<x-dc>`, `<sc-for>`, `{{holes}}`); treat them as visual and structural reference, not code to ship. The reference shows up to four device rows; Stage 1 has one phone, so there is no device list and no "Show all devices", and "Close tab" moves onto the bar.

### When it shows

1. All of these hold: the site is a granted default site, it isn't switched off, it isn't hidden for the next 24 hours, Upgraditch isn't paused, and `lib/match.js` says the page is about phones. When unsure, don't show. A bar on the wrong page costs more than a missed one, and "This page tempted me" catches the misses.
2. `lib/match.js` keeps one table of sites. Per site: URL patterns for phone categories and phone product pages, and for product and news pages the page title checked against phone brand and model names. GSMArena: every device page. Each entry carries a `siteCategory` for the counts (`price_comparison`, `specs`, `shop`, `forum`). Check each site's real URL structure before writing patterns.
3. On sites that change pages without reloading, re-check when the URL changes, without watching the whole DOM.

### Layout and behaviour

4. A panel fixed in the bottom-left corner, as wide as the card (440 px at most), laid over the page (no layout offset: pushing the page down breaks sites with sticky headers), inside a closed Shadow DOM. It never dims the page. Not at the top (settled 26 Sep 2026): there it covered the site's logo, search and cart, which never scroll out from under it.
5. Two rows. First the device colour dot and phone name (with an "on this page" tag when the page is about the user's own model), with the headline (section 9) beneath them; it wraps rather than being cut off. Then "Close tab" (primary), "Log urge" and "Cooldown" as icon buttons (a note and an hourglass, named by `aria-label` and a tooltip), and a hide button (hides the bar on that site for 24 hours).
6. The name and headline form one `<button aria-expanded>` that opens the own-rule card above the bar. Clicking again or Escape closes it.
7. Card with reasons set: the headline "Does this fix [reason A] or [reason B]?", built from the phone's reasons. One status tile per reason that has data (battery 81%, security updates 377 days); reasons without data (camera, screen, damage) appear only in the question. If "slow" is a reason, the battery tile comes first and the advice mentions it ("A worn battery makes a phone feel slow"). Then one sentence of advice and the buttons "Close tab" (primary, calls `chrome.tabs.remove` via the service worker) and "Something else" (shows the reason tags and logs an urge).
8. Card with no reasons: "No rule for this phone yet" and a "Set my reasons" button that opens onboarding step 2.
9. Never ask the user to explain why they want to buy (research A1: writing reasons for a purchase raises desire). Reason tags are one tap and optional.
10. "Log urge" logs with one tap, then offers the reason tags.
11. "Cooldown" opens a small form in the card: item (prefilled from the page title), optional price, want rating, days (7 by default).
12. The bar renders within 200 ms of DOMContentLoaded, never blocks clicks on the page, and does no work after rendering except the URL check in step 3.
13. The first time the bar appears, a five-step tour points at the headline, "Close tab", "Log urge", "Cooldown" and hide, one tip at a time above the bar, with Next and Skip. Escape, Skip, finishing it, or using any part of the bar ends it for good (`settings.barTourDone`). It never takes focus from the page.

## 7. Design tokens (Tokyo Night, dark)

```css
:root {
  --bg: #1A1B26;           /* page-level surfaces */
  --bg-deep: #16161E;      /* bar background */
  --surface: #1F2335;      /* card */
  --surface-2: #24283B;
  --line: #292E42;
  --line-strong: #3B4261;
  --text: #C0CAF5;
  --text-2: #A9B1D6;
  --muted: #9AA5CE;

  --brand: #73DACA;        /* logo badge + primary actions ONLY, with --on-brand text */
  --on-brand: #16161E;
  --ok: #9ECE6A;           /* status fine, never used for buttons */
  --warn: #E0AF68;         /* status near a limit */
  --cooldown: #7AA2F7;     /* the bar's Cooldown button */

  --device-1: #BB9AF7;     /* purple */
  --device-2: #7AA2F7;     /* blue */
  --device-3: #FF9E64;     /* orange */
  --device-4: #7DCFFF;     /* cyan */

  --radius-sm: 10px;       /* buttons */
  --radius-md: 12px;       /* rows, tiles */
  --radius-lg: 16px;       /* bar, card */
  --shadow-bar: 0 12px 32px rgba(0, 0, 0, 0.45);
  --shadow-card: 0 24px 60px rgba(0, 0, 0, 0.55);

  --font-ui: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-num: "JetBrains Mono", ui-monospace, monospace;
}
```

Rules:

- Teal (`--brand`) means "Upgraditch" or "take this action". Never use it for a device or a status.
- Lime (`--ok`) means "this is fine". Never use it for a button.
- The phone uses `--device-1`. The other device colours stay in the tokens for later.
- Open bar: device colour at 12% opacity as background, `--line-strong` border, name in the device colour.
- Status tiles: status colour at 10% background, 35% border, number in the status colour.
- Amber (`--warn`) also means "tempted": the urges in the popup and the bar's Log urge button. Blue (`--cooldown`) means "wait instead of buying": the bar's Cooldown button. Both buttons are tinted (16% background, 55% border, icon in the colour), so "Close tab" stays the only filled button (settled 26 Sep 2026). It shares its value with `--device-2`: pick another blue before a second device gets a colour.
- Bundle fonts locally (both are OFL); never load from Google Fonts inside a host page.
- The popup, onboarding and need test designs in `design-reference/` use an earlier warm light palette. Rebuild them with these tokens; keep their layout, copy and hierarchy. A light theme via `prefers-color-scheme` comes later.
- The bar turns light on a dark page, so it stands out either way (decided 26 Sep 2026): `.theme-light` in `tokens.css` holds the same roles in darker hues, for 4.5:1 on white. `bar.jsx` reads the background under the bar's corner once as the bar appears, skipping see-through layers such as cookie overlays; it never watches the page for it.

### Accessibility floor

Real buttons and links, `aria-expanded` on the bar button, visible focus rings, 44 px minimum targets, text contrast 4.5:1, `prefers-reduced-motion` respected, and the bar fully usable by keyboard (Tab into the shadow root, Escape closes the card).

## 8. Screens and copy

All copy goes through `_locales`. Stage 1 ships English only; a later Dutch version can borrow the wording people use on Tweakers (research plan, A10).

- **Onboarding step 1:** eyebrow "Before you buy", title "Which phone are you currently holding on to?", fields Phone / Purchase date / Price paid (EUR), footer "No account. Nothing leaves this browser unless you opt in."
- **Onboarding step 2:** title "What would make you replace it?", helper "Pick any that apply. The need test checks these first when you are tempted." Options: Battery life, Speed, Camera, Screen, Storage, Updates ending, Damage, Something else. Note "Later you will see how this compares with what actually tempts you.", with the link "Want to know more? Run the need test" under it. Actions Continue / Skip for now. The need test runs in the onboarding tab with the reasons just picked; its result ends with Continue, on to step 3.
- **Onboarding step 3:** title "Where Upgraditch shows up", the five sites listed, text "Upgraditch only looks at pages on these sites, to see whether they're about phones. It never reads anything else, and never sends the pages you visit anywhere." Button "Allow these sites" triggers the single permission prompt. Below it, the "Help test what works" opt-in, with the copy from the B4 spec.
- **Onboarding done:** "You're set", then how to pin the icon to the toolbar, in two steps for the browser in use (Chrome and Brave: the pin; Edge: the eye; Firefox: the gear, then Pin to Toolbar). Where the browser reports the icon is on the toolbar (`action.getUserSettings`), the steps give way to "Upgraditch is pinned to your toolbar."
- **Popup:** phone summary with cost per month "and falling", lifespan bar, "Security updates until Oct 2027", cooling-down list ("Check again on 29 Oct"), "This page tempted me", "Run the need test", "Pause Upgraditch", sites on/off, the counts toggle, links "Share my stats" and "Feedback".
- **Need test:** the checks come from the user's reasons, plus one question for everyone: "Do your banking, ID and work apps still run on it?" (a Dutch version names DigiD). "No" means upgrade. "Slow" leads to the battery check. If the user picked "Updates ending", say which updates: "New Android versions stopped in Feb 2026. Security updates still come." (the row above it already gives the security date). Only the end of security updates counts toward upgrade.
- **Need test result:** "Keep it." / "Repair it." / "Upgrade it." with the checks listed. It must say upgrade when security updates have ended or the apps no longer run, and never hide that answer.
- **Make it feel new** (after "Keep it."): "A new case or screen protector. A new wallpaper and a tidied home screen. Clear out storage. Re-watch its launch review", the last one a search link for "[phone name] review". Static copy, no tracking. This is what people on Reddit already do when the itch hits (research plan, A10); B2 question 7 shows whether interviewees do it too.
- **Cooldown end** (badge when `endsOn` arrives, screen in the popup): first "Still want [item]? 1 to 10". Only after that, the start rating next to the new one: "On 22 Oct you gave it 8". Then the outcome, each with its own colour, icon and one-line hint: "Buying it" (`bought`, amber, "You're buying it, or already have."), "Dropping it" (`dropped`, the phone's colour, "You've decided not to buy it.", plus the amount it adds to money not spent), "Haven't decided" (`expired`, neutral, "The cooldown ends without a choice."). Showing the start rating after the new one is deliberate: people misremember their earlier ratings as matching how they feel now.
- **Milestones:** for example "2 years with your Pixel 7 Pro. Worth a battery check: a new battery resets the clock."

## 9. Field study instrumentation (V4 to V7)

The authoritative spec is `research/B4 Field study spec.md`: events, fields, headline eligibility, endpoint rules and analysis. For the build:

- Events are always recorded locally (for "Share my stats") and sent only while opted in. Setup events recorded before the opt-in are sent once the user opts in; nothing is ever sent for people who don't.
- Events: `install`, `onboarding_finished`, `permission_result`, `bar_shown`, `bar_outcome`, `urge_logged`, `cooldown_started`, `cooldown_ended`, `need_test_result`, `paused`. Every event carries `schemaVersion`, `clientId`, `eventId`, `build`, `browser`, `dayIndex` (whole days since install) and `event`. `browser` is detected once at install: Firefox from `runtime.getBrowserInfo` (Firefox only; the polyfill also defines `browser` in Chrome), Brave from `navigator.brave`, Edge from `navigator.userAgentData.brands`, otherwise Chrome.
- Headlines: `own_rule` ("You said you'd replace it for battery or updates. Does this page fix either?", when reasons are set), `cost` ("€19.14 a month so far, and falling"), `support` ("Security updates until Oct 2027", when the end date is known), `time_held` ("Kept for 3 years 11 months"), `phone_voice` ("We've had 3 years 11 months together. I'm not done yet.": the same fact in the phone's voice). At each showing, pick uniformly at random among the eligible headlines with `crypto.getRandomValues`, and record the eligible list with the pick.
- The layout is the same for every headline, and "Close tab" is the primary action on every variant. The headline is the only thing that varies in Stage 1.
- Never send device names, notes, URLs or timestamps. `siteCategory` comes from the site table, never from the URL.
- The Worker (`worker/`): accepts `POST` with a JSON array of events, validates the schema and rejects unknown fields, answers CORS for the extension origins, never stores IP addresses (it passes them only to Cloudflare's rate limiter, 2 uploads a minute per address), caps the events it stores per day over all installs,, keeps request logging off, and stores rows with the day they arrived and nothing finer. Raw events are deleted after the Stage 1 analysis.

## 10. Share my stats (V2) schema

```json
{
  "schemaVersion": 2,
  "installedDays": 28,
  "devices": [{ "category": "phone", "ageMonths": 47, "costPerMonth": 19.14, "hasSupportDate": true, "reasons": ["battery", "updates"] }],
  "urges": { "total": 12, "byTag": { "camera": 5, "launch_hype": 4, "battery": 3 }, "bySite": { "tweakers.net": 7 } },
  "cooldowns": { "started": 3, "expired": 1, "bought": 0, "dropped": 2, "avgWantDrop": 2.3 },
  "needTest": { "keep": 4, "repair": 1, "upgrade": 0 },
  "bar": { "shown": 40, "cardOpened": 11, "closedTab": 6, "dismissed": 9,
           "byHeadline": { "own_rule": { "shown": 12, "closedTab": 3 } } },
  "funnel": { "permissionGranted": true, "firstBarDay": 2 }
}
```

No device names, no free-text notes, no dates finer than days.

## 11. Build order (3 weekends)

1. **Weekend 1:** manifest for Chrome and Firefox, `_locales` setup, storage + migrations, calc + tests, onboarding (all three steps, including the permission request and the opt-in), popup basics, install flow, uninstall URL, local event log. Check each step in Chrome and in Firefox (`web-ext run`).
2. **Weekend 2:** content script registration, `match.js` with the site table, the bar and card, headline randomisation, urge log, cooldown with its end screen, "This page tempted me", pause. Test in Chrome, Brave and Firefox. The five prototype sessions (research B3) happen after this weekend.
3. **Weekend 3:** fixes from the prototype sessions, need test, EOL lookup, upload and Worker, share stats, feedback link, milestones, signing and the Firefox Add-ons listing, store listing assets in English (screenshots, 30-second recording).

If a weekend overruns, cut Should items before extending.

## 12. Acceptance checks

- A fresh install opens onboarding; completing it stores one phone with reasons, and step 3 shows exactly one permission prompt for all default sites.
- Declining the permission leaves a working popup and "This page tempted me".
- On each default site, after granting permission, the bar appears on phone pages within 200 ms of DOMContentLoaded, and does not appear on at least one non-phone page per site (a kettle on Coolblue, a news article about laptops on Tweakers).
- The bar never blocks clicks and never freezes a heavy product page: no long task over 50 ms from the content script in the Performance panel, in Chrome, Brave and Firefox.
- Clicking the bar toggles the card; Escape closes it; keyboard-only use works.
- Headline pick: over 10,000 simulated showings, each eligible headline lands within 2 percentage points of its expected share, and ineligible headlines never appear.
- Cooldown: the default end date is 7 days after the start; no countdown appears anywhere; the end screen asks for the new rating before it shows the old one.
- Pause hides the bar on every site until the pause ends.
- Cost per month for the sample device renders EUR 19.14.
- Uninstall opens the survey URL.
- With counts off, no request other than endoflife.date is ever made. With counts on, payloads contain no names, notes, URLs or timestamps (unit test on the serialiser).
- "Share my stats" output matches schema version 2 and contains no names or notes.
- Every check above also passes in Firefox desktop. On Firefox, switching the counts on shows Firefox's own data consent prompt.
- The Firefox Add-ons listing goes live on the same day as the Chrome Web Store listing.
- English renders with no missing message keys.

## 13. Open decisions (ask the owner)

- The final name (Checkpoint A).
- Whether gathering.tweakers.net joins the default sites (Checkpoint A).
- Final headline wording (Checkpoint A, after the prototype sessions).
- More than one device (Checkpoint B).

Settled on 22 Sep 2026: cooldowns default to 7 days and are adjustable; "money not spent" adds up dropped cooldown items; the phone gets `--device-1`; milestones and cooldown ends use the toolbar badge, not notifications.

Settled on 25 Sep 2026: Stage 1 ships in English only, for the Dutch audience too. The draft Dutch strings were removed and stay in git history (commit e7d220e, `_locales/nl/`).

Settled on 26 Sep 2026: the counts endpoint is `upgraditch-counts` on workers.dev. Feedback (V3), the uninstall survey (V1) and "Share my stats" (V2) all open one Tally form, with `?from=popup`, `uninstall` or `share`. A web page opens in the user's own browser; a `mailto:` link opened the system's mail handler, which could be another browser.
