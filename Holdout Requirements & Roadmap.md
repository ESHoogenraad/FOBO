# Upgraditch: Requirements & Roadmap

2026-09-22 · @Someone

"Upgraditch" (upgrade + itch) is a working name, chosen on 23 Sep 2026 after "Holdout" turned out to be taken by a coupon extension. Checkpoint A of the [research plan](Holdout%20Research%20Plan.md) confirms or replaces it.

## Concept

Upgraditch is a browser extension that shows up at the moment you are tempted to replace a phone that still works, and gives you an honest second opinion: keep it, repair it, or yes, upgrade.

**Goal.** Adoption and usefulness: people keep it installed, it changes what they do at the moment of temptation, and they tell others. Revenue is not a goal.

**Problem.** People replace phones long before they fail. The urge comes from browsing (Pricewatch, launch threads, review videos, trade-in offers), not from the phone breaking. On Tweakers people call it "upgradedrang" and upgrade "omdat het kan" while the old phone "doet het nog steeds te goed". Some ask the forum for permission: "Ik mag mijn Pixel 7 nu wél vervangen".

**Insight.** Not upgrading is a non-event, so the product has to create moments: the moment of temptation on a shop or spec page, maintenance moments (battery, updates) and milestones. The research adds two things. "It's getting slow" is often an alibi: benchmark runs on old iPhones spike at every launch while their performance stays flat (Makov & Fitzpatrick 2021). And a rule set in a calm moment, then asked back at the moment of temptation, is one of the best-supported ways to act on an intention (Gollwitzer & Sheeran 2006).

**Positioning.** An honest second opinion, not a blocker. The need test says "upgrade" plainly when security updates have ended or a real task is blocked (banking, ID or work apps no longer run), and that is what makes "keep it" believable. The B2 interviews confirm or overturn this positioning.

**Mechanics.** Each one has a verdict in the research plan (A1 to A9).

| Mechanic | What it does | Research verdict |
| --- | --- | --- |
| Own-rule check (the core) | At onboarding the user picks what would make them replace the phone. On a phone page, the bar asks: "Does this page fix battery life or updates ending?" | A1: build as the core. Never ask for reasons *for* buying; writing them raises desire |
| Bar with "Close tab" | One line on phone pages, with backing out as the main action | A2: build. The option to back out does the work, the wording much less. Speed and reliability matter most |
| Need test | Keep, repair or upgrade, with the evidence. One question for everyone: "Do your banking, ID and work apps still run on it?" A "keep" ends with ways to make the phone feel new | A9: build. "Slow" is answered with a battery check first. A10: people confuse new Android versions with security updates, so every date says "security updates" |
| Urge log | One tap, with an optional reason tag | A5: build, paired with the check. It won't carry retention |
| Cooldown | A want gets a quiet end date ("Check again on 29 Oct"), 7 days by default. At the end: "Still want it?", then the rating given at the start | A4, A6: build with these changes. No countdown |
| Milestones | 2, 3, 4 and 5 years, and when security updates end. The 2-year milestone carries the battery and repair check | A7: build (Should) |
| Cost per month | Price paid divided by months owned | A3: one of five headlines tested in the field. Per-month framing is also how carriers sell phones |

Cut after the research: streaks (an honest upgrade would break them), social features and share cards (the least wanted kind of tool among impulse buyers, A8), and a separate satisfaction check after a purchase (the cooldown end screen gives the same effect without one, A6).

**Scope by stage.** Stage 1 is the browser extension for phones, with a small field study built in. Stage 2 is an Android app, only if the research shows temptation happens mostly on the phone. Stage 3 is growth. Stage 4 is other categories, only on demand.

**Non-goals.** Revenue. An iOS app: iOS gives apps no battery or patch data, although iPhone owners using the desktop extension are in scope. Accounts, until a sync need is proven. Social features, until B2 shows people want them.

## Working principle: no stage starts until the previous gate is passed

The known failure mode on earlier projects is building through problems that building cannot solve, in particular user validation and marketing. Every stage has an exit gate, and every gate is passed by evidence from other people.

- A gate is passed by what other people did, never by a feature you shipped or a paper you read
- If a gate stalls for 4 weeks, the next action is a conversation or a post, not a commit
- Every stage has a fixed build budget in weekends. Overrunning it means cutting scope, not extending
- Adoption work is written as requirements with the same weight as features
- One line a week: what did a user teach me? Two empty weeks in a row is the warning signal
- **Kill date: if the Stage 1 gate is not passed by 31 January 2027, stop or pivot.** The stall rule restarts work; the kill date ends it

### Gates

This is the only list of gates; the stage sections refer to it.

**Stage 1 → next stage.** The numbers are provisional until Checkpoint A, when the diary study (B1) shows what is reachable.

- [ ] 15 switch interviews done and summarised on one page, and at least 5 of the 15 recognise the problem in themselves (B2)
- [ ] 30 installs, from at least two channels and not only from people you know (store stats, per-channel links)
- [ ] At least half of opted-in installs see a bar within 7 days of installing (B4 funnel)
- [ ] 5 of the 10 users interviewed at weeks 2 and 4 describe a moment where the bar changed what they did (M6)
- [ ] The share of showings that end in a closed tab is, in week 4, at least half of what it was in week 1 (B4)
- [ ] At the end of the field window, at least 40% of all installs are still installed and enabled (store stats). For comparison, 39% of one sec's new users were still using it after six weeks
- [ ] You have closed a tab after seeing the bar 5 or more times

**Where next.** Go to Stage 2 if the diary or field data put more than 60% of temptation on the phone or in apps, or if 10 users ask for a phone version unprompted. Otherwise go to Stage 3 with the extension.

**Stage 2 → Stage 3**

- [ ] 50 app installs, 25 still active at week 4
- [ ] Of users with a "keep" or "repair" verdict, 8 in 10 have not bought a new phone 60 days later
- [ ] 5 users completed a care quest and said it helped

**Stage 3 → Stage 4**

- [ ] 200 weekly users
- [ ] In one month, at least a quarter of installs come through links you didn't post yourself
- [ ] 20 users ask unprompted for one specific category. One category per expansion; the next waits for its own 20 requests

**Kill or pivot signals**

- Fewer than 5 of 15 interviewees recognise the problem in themselves: the problem is yours alone, and the fix is a personal script, not a product
- Bars are shown but tabs are almost never closed, and dismissing is the main outcome: the intervention point is wrong. Go back to the interviews
- The diary shows fewer than 1 desktop-browser temptation per person per two weeks, and touchpoints that don't need a shop visit don't help: the desktop bar cannot carry the product. Rethink the surface before building more
- The kill date passes

## Research

The [research plan](Holdout%20Research%20Plan.md) holds the questions, the verdict per mechanic, the findings log and the kits for the user research (in `research/`). What it changed:

- The own-rule check is the core, and reasons for buying are never asked for
- "Close tab" is the main action. Expect little difference between headline wordings, and put the effort into speed and reliability, including on Brave
- Cooldown: 7 days, a quiet end date, a want rating at the start and the end
- The need test answers "slow" with a battery check first
- Streaks, social features and the post-purchase satisfaction check are cut or deferred
- Opt-in anonymous counters and a random headline per showing turn Stage 1 into a small field study

**Adjacent products (checked 22 Sep 2026)**

The category is empty. Pause is gone from the Chrome Web Store. About 20 "stop impulse buying" extensions exist, and the largest has 49 users. For comparison, one sec (a pause before opening distracting sites) has 30,000 Chrome users and Spending Calculator for Amazon about 10,000. People don't find restraint tools by searching the store, so reach has to come from communities. In one sec's 1 and 2 star reviews the complaints are about the overlay freezing the browser or being bypassed, not about the idea.

**Browsers.** Firefox has 6.7% of desktop and 1.6% of mobile browsing in the Netherlands (StatCounter, August 2026). one sec has 2,239 Firefox users against 30,000 on Chrome, with no Firefox for Android version. The early channels (Turing Station, r/degoogle, Tweakers) probably have far more Firefox users than that; the B1 and B2 recruits are asked, so Checkpoint A has a number.

Nothing combines device context, the moment of temptation and an honest need test. The longevity story is otherwise told by resellers and repair shops, who sell something; a tool with nothing to sell is different.

**Regulation (EU, in force since 20 June 2025)**

The [ecodesign rules for smartphones and tablets](https://single-market-economy.ec.europa.eu/news/new-eu-rules-durable-energy-efficient-and-repairable-smartphones-and-tablets-start-applying-2025-06-20_en) require at least 5 years of OS updates after the last unit is sold, spare parts for 7 years, batteries that keep 80% capacity after 800 cycles, and a repairability score on an energy label backed by the EPREL database. For the product:

- The 800-cycle figure is a design minimum for phones sold after June 2025, not a point at which to replace a battery. The need test uses battery health below 80%, not the cycle count
- EPREL gives repairability and battery data per model for phones sold after June 2025
- Older phones, like a 2022 Pixel 7 Pro, are not covered, so support dates come from endoflife.date, which gives the end of security updates for every Android brand but no advance date for iPhones

**Market numbers.** Estimates of how long people keep a phone conflict by source and region (roughly 2.5 to 3.5 years), and several come from resellers. They are not used for decisions. Upgraditch's own data on holding time will be better.

## Stage 1: Extension and field study (build budget: 3 weekends)

Goal: show up at the moment of temptation on phone pages, and learn from 30 real users whether it changes what they do and whether they keep it.

The build spec, with requirement IDs and priorities, lives in [HANDOFF.md](HANDOFF.md). The field study spec is [research/B4 Field study spec.md](research/B4%20Field%20study%20spec.md). This section holds the summary, the adoption requirements and the scope limits.

**What ships**

- Onboarding in three steps: one phone (name, purchase date, price paid); what would make you replace it (one-tap reasons); where Upgraditch shows up (one permission prompt for the default sites), with the opt-in "Help test what works"
- A one-line bar on phone pages of the default sites: the phone, a headline picked at random from five, "Close tab", "Log urge", "Cooldown" and hide. Clicking it opens the own-rule check with the evidence
- A popup with cost per month, security updates until, cooldowns with their end dates, "This page tempted me", the need test, a pause switch, "Share my stats" and feedback
- Need test with "Make it feel new" after a keep result, milestones and JSON export (Should)
- Validation: uninstall survey, "Share my stats", a feedback link, opt-in anonymous counters with a random headline per showing, and onboarding funnel counts
- English and Dutch, following the browser language
- One codebase for Chrome, Brave, Edge and Firefox desktop. Firefox is built and tested from the first weekend and listed on Firefox Add-ons on the same day as the Chrome Web Store: the first channels are open-source and privacy communities, where Firefox is likely far more common than its 6.7% of Dutch desktop browsing

**Where the bar shows.** The default sites are Tweakers Pricewatch, GSMArena, Coolblue, bol and MediaMarkt. The bar shows only on pages about phones, never across a whole domain: a phone bar on a kettle page teaches people to dismiss it. Whether to add gathering.tweakers.net, where launch threads and product discussions happen, is decided at Checkpoint A.

**Mobile constraint.** Chrome for Android does not run extensions. Firefox for Android does, but it has 1.6% of Dutch mobile browsing and one sec doesn't support it, so it is not a Stage 1 target. Most temptation on the phone happens in apps and videos, which no extension can see. The diary study (B1) measures how much of it happens on the phone, and that decides Stage 2.

**Adoption requirements (same weight as features)**

- M1: 15 switch interviews with the [B2 kit](research/B2%20Interview%20kit.md), alongside the build: at least 5 people who upgraded in the last 18 months and at least 5 who seriously considered it and didn't. The diary study (B1) and prototype sessions (B3) run alongside as well; the timeline is in the research plan
- M2: A store listing in English and Dutch with a 30-second recording, ready before the first user is invited. Drafts are in the research plan (A10). Choose the name at Checkpoint A first
- M3: Posts in sequence, about a week apart, so each round of fixes lands before the next audience sees it. Each carries the recording and one question, and is framed as "I built this to stop myself, looking for people to break it", never as a launch. Ask a moderator or host first. Time the posts so the field window includes the run-up to Black Friday (27 Nov 2026)
  1. Groene Nerds (Telegram): lead with device lifespan, e-waste and the EU ecodesign rules
  2. Turing Station (Discord): lead with open source, local-only storage, opt-in counters and no broad permissions. Expect the manifest to be read, which is free code review
  3. Tweakers forum: ask a moderator where a self-built tool may be posted. This is the core audience; the launch and "Ervaringen & Discussie" topics show where they are
  4. Reddit, in this order: r/Anticonsumption and r/minimalism (where restraint posts about tech get the most response), r/nobuy, r/degoogle, r/GooglePixel (reply in "are you upgrading?" threads rather than posting), and r/BuyItForLife last (regulars are tired of phone questions). Open English posts with "Got the upgrade itch?" and the story of keeping a phone that still works, not the tool. Don't preach: enthusiasts push back ("If tech is your hobby, enjoy it!"), and a post that reads like an ad gets called a bot. Check each subreddit's rules by hand
  5. Later: communities where one sec users gather (r/nosurf, r/digitalminimalism)
- M4: Give every channel its own tagged link, so installs can be traced to it. Groene Nerds and Turing Station lean pro-longevity and will flatter the idea; if they bring more than half the installs, give the Tweakers and Reddit results more weight in the gate review
- M5: Save the podcast hosts for later. A mention on the show is worth more than a channel post, and you get one first ask. Pitch it once the first aggregate data exists, as a story rather than a product
- M6: Five user interviews at week 2 and five at week 4: what happened the last time the bar appeared?
- M7: Read every uninstall survey response in the week it arrives

**Out of scope for Stage 1**

- Accounts, sync, and any server other than the opt-in counter endpoint
- More than one phone, and other device categories. The data model allows more; the interface doesn't. Revisited at Checkpoint B
- Trigger sites added by the user. "This page tempted me" logs the site, and the logged sites feed the default list at Checkpoint A. Letting users add triggers would need a broad optional permission
- Automatic price lookup and CO2 figures
- Streaks, leaderboards, community features, a newsletter and share cards
- An Android app, and Firefox for Android. The Firefox add-on is marked as working on Android only if a test on a real phone passes with no fixes

**Exit gate:** see Gates.

## Stage 2: Android app and widget (build budget: 4 weekends)

Only if the gate says so. Goal: bring the check to the phone, where most temptation may happen, and let the need test use real device data.

| ID | Requirement | Priority |
| --- | --- | --- |
| P1 | Import from the extension's JSON export, or fresh onboarding | Must |
| P2 | Device data: model, Android version, security patch level (`Build.VERSION.SECURITY_PATCH`), free storage (`StatFs`), and battery cycle count on Android 14+ where the manufacturer reports it. Check before promising more: battery health as a percentage appears to need a system permission, so it may stay a manual entry | Must |
| P3 | Need test on the real data: keep, repair or upgrade, with the evidence; "slow" leads to the battery check | Must |
| P4 | Home screen widget: cost per month, security updates until, cooldown end dates | Must |
| P5 | Urge log and cooldown, same model as the extension | Must |
| P6 | Care quests for the detected model. Battery replacement with a price, a place and a time (iFixit guide, nearest Repair Café); debloat list; animation scale; "make it feel new" (case or screen protector, wallpaper, tidied home screen, storage clean-up, its launch review). The 2-year milestone opens the battery quest | Should |
| P7 | Optional prompt when a shopping app or a trigger site is opened. Needs the usage-access permission, so opt-in only. The only way to catch temptation inside apps | Could |

**Non-functional:** Kotlin, a single module, minSdk 30, Material 3. No account, no backend, no third-party analytics SDK; opt-in counters as in Stage 1. The Play Store listing must pass with no special permission other than the optional usage-access one.

**Adoption:** a closed beta through Play internal testing with the Stage 1 users who asked for mobile. One post per month with a real user story, not a feature announcement. Ask every beta user one question at week 3: did the widget change anything?

**Exit gate:** see Gates.

## Stage 3: Growth

Goal: grow from a few dozen users to a few hundred through communities and content, without breaking the one rule: Upgraditch never nudges toward buying.

- G1: Launch-season content around the Pixel launch in August, Apple in September and Black Friday: "survive launch season", with the aggregate data
- G2: An aggregate stats page: median holding time, the most common reasons for temptation, the most common trigger sites. This is the data nobody else has, and the press hook
- G3: Reviews that compare a 3 to 4 year old phone with the new model, which Tweakers users asked for instead of comparisons with last year's model
- G4: A newsletter, only if people ask for one
- Unvalidated until B2 says otherwise: shareable setups and milestone share cards. Only 9% of impulse buyers wanted a tool that posts when they resist buying (A8)

**Money.** Not a goal. Upgraditch stays free, open source and local-first. If running costs appear, a donation link covers them. These guardrails protect trust, and with it adoption: no affiliate links to new phones, no sale of data, and no commercial link in the bar or the need test. A "repair" verdict links to a guide or a Repair Café, not a paid partner.

**Exit gate:** see Gates.

## Stage 4: Other categories (roadmap only)

Cars and clothes could use the same mechanics (own-rule check, cooldown, cost per month), but nothing is designed for them yet. The data model keeps a `category` field and nothing else for this. One category per expansion, and only through the gate.

## Open decisions

| Decision | When | Input |
| --- | --- | --- |
| Name: keep the working name "Upgraditch", or switch to one from the interviews | Checkpoint A | B2 question 9, A10, spelling test in B3 |
| Add gathering.tweakers.net to the default sites | Checkpoint A | B1, B3 |
| How visible the bar is by default | Checkpoint A | B3 |
| Final headline wording for the field study | Checkpoint A | B3 |
| Stage 1 gate numbers | Checkpoint A | B1 |
| One phone or several devices | Checkpoint B | B3, B4, feedback |
| A separate satisfaction check after a purchase (F12) | Checkpoint B | B2 question 6 |
| Keep the cooldown | Checkpoint C | B4 |

Decided on 22 Sep 2026: cooldowns default to 7 days and the user can change that; "money not spent" adds up the prices of cooldown items the user dropped; no CO2 figure in Stage 1; English and Dutch from the start; the kill date is 31 January 2027.

## Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| The bar rarely shows, because people visit phone pages only around an upgrade. Most installs see nothing and forget it | High | B1 measures it; the B4 funnel tracks it; milestones and the popup are touchpoints that don't need a shop visit |
| Installs come mostly from pro-longevity communities, who agree but are rarely tempted | High | The recruitment mix in B1 and B2; per-channel links (M4) |
| The conversations get dropped while building | High, known pattern | M1 is in the Stage 1 gate; no gate passes on installs alone |
| The bar freezes or slows heavy shop pages, or is easy to get around | Medium | Performance checks in the acceptance list; Brave in testing. These cause most of one sec's 1-star reviews |
| People stop noticing the bar after a few showings | Medium | A random headline per showing; a weekly habituation check in B4 |
| The cost headline ("and falling") reads as "sell it while it's still worth something", as trade-in offers frame it | Medium | B3 checks how people read it; reword before the field study if 2 of 5 read it that way |
| The permission prompt stops people before their first bar | Medium | One prompt for all sites, an explanation before it, B3 |
| Nobody finds it by searching the store | Certain | Communities (M3) |
| It feels like being told off, so people switch it off | Medium | The user's own rule, "Close tab" as an offer rather than a block, a pause switch |
| Local-only storage leaves you blind to whether it works | Medium | Opt-in counters, "Share my stats", the uninstall survey |
| Mobile reach is near zero because Chrome for Android has no extensions | Certain | B1 measures how much temptation happens on the phone and decides Stage 2. Firefox for Android is no answer: 1.6% of Dutch mobile browsing |
| The early audience uses Firefox and finds no version for it | Medium | Firefox built from weekend 1 and listed on the same day as Chrome; B1 and B2 recruits are asked which browser they use |
| Users keep a phone whose security updates have ended | Medium | The need test says "upgrade" when security updates have ended or banking, ID or work apps stop running, and never hides it |
| Manifest V3 or store policy changes break the bar | Low | A content script with no remote code; open source, so others can fork it |
| Scope creeps into more devices or categories | Medium | One phone in Stage 1; the Stage 4 gate |
