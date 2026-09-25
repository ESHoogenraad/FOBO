# Store listings

Text for the Chrome Web Store and Firefox Add-ons (addons.mozilla.org, AMO) listings, which go live on the same day (HANDOFF section 12). English is final draft; the Dutch is a rough draft to check before it goes live. Screenshots are in `store/screenshots/`.

## Name

Upgraditch (working name until Checkpoint A; rename via `appName` in `_locales` and `APP_NAME` in `src/config.js`)

## Short description (Chrome: max 132 characters; AMO summary: max 250)

**EN:** Shows up when you are tempted to replace a phone that still works, and checks the page against your own reasons.

**NL (draft):** Verschijnt als je in de verleiding komt een telefoon te vervangen die het nog doet, en legt de pagina naast je eigen redenen.

## Full description

### EN

Tempted by a new phone while yours still works? Upgraditch is an honest second opinion, not a blocker.

When you open a phone page on Tweakers, GSMArena, Coolblue, bol or MediaMarkt, a one-line bar appears at the top: your phone, one short fact about it, and a "Close tab" button. Click the bar and it checks the page against the reasons you gave for replacing your phone: battery, updates, camera and so on.

- **Your own rule.** Tell it once what would make you replace your phone. When you're tempted, it asks you back.
- **Need test.** A few questions, then an answer: keep it, repair it, or upgrade. It says "upgrade" plainly when security updates have ended or your banking, ID or work apps no longer run, and never hides that answer. "It feels slow" is checked against the battery first.
- **Cooldown.** Want something? Give it a quiet end date, 7 days by default: "Check again on 29 Oct". No countdown. At the end, it asks whether you still want it.
- **Urge log.** One tap to note that a page tempted you.
- **Milestones.** 2, 3, 4 and 5 years with your phone, and the day its security updates end.
- **Pause** for a day, a week, or until you switch it back on, for when the answer is "upgrade" or you're shopping for someone else.

Private by design: no account, and your data stays in your browser. It looks only at pages on the sites you allow, and only at their address and title. It looks up the end of security updates on endoflife.date without sending your phone's name. Optional anonymous counts help test which wording in the bar works; they are off unless you switch them on. Open source.

### NL (draft)

Zin in een nieuwe telefoon terwijl de jouwe het nog doet? Upgraditch geeft een eerlijk tweede oordeel, geen blokkade.

Op een telefoonpagina van Tweakers, GSMArena, Coolblue, bol of MediaMarkt verschijnt bovenaan een balk van één regel: je telefoon, één kort feit erover en een knop "Sluit tabblad". Klik op de balk en hij legt de pagina naast je eigen redenen om je telefoon te vervangen: accu, updates, camera enzovoort.

- **Je eigen regel.** Vertel één keer wat voor jou een reden is om te vervangen. Kom je in de verleiding, dan vraagt hij het je terug.
- **Nodig-test.** Een paar vragen, dan een antwoord: houden, repareren of vervangen. Hij zegt gewoon "vervangen" als de beveiligingsupdates gestopt zijn of je bank-app, DigiD of werk-apps niet meer werken, en verstopt dat antwoord nooit. "Hij is traag" wordt eerst tegen de accu gehouden.
- **Afkoelen.** Iets gezien? Geef het een rustige einddatum, standaard 7 dagen: "Kijk nog eens op 29 okt". Geen aftelklok. Daarna vraagt hij of je het nog steeds wilt.
- **Drang noteren.** Eén tik om te noteren dat een pagina je verleidde.
- **Mijlpalen.** 2, 3, 4 en 5 jaar met je telefoon, en de dag dat de beveiligingsupdates stoppen.
- **Pauzeren** voor een dag, een week of tot je hem weer aanzet.

Privacy voorop: geen account, en je gegevens blijven in je browser. Hij kijkt alleen naar pagina's op de sites die je toestaat, en daarvan alleen naar het adres en de titel. Optionele anonieme tellingen helpen testen welke tekst in de balk werkt; ze staan uit tenzij je ze aanzet. Open source.

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
- A license, for the repository and for AMO (`version.license` in `store/amo-metadata.json`).
- Uninstall survey, feedback and counts endpoint URLs (`src/config.js`).
- Chrome Web Store developer account; AMO API key and secret (for `npm run sign:firefox`).
- The 30-second recording for the Chrome listing is uploaded to YouTube and linked there.
- Dutch screenshots, once the Dutch strings are final.
