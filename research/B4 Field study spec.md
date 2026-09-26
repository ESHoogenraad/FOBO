# B4 Field study spec

What the extension and the counter endpoint need so the 4-week field study (research plan, section B4) can answer RQ4 to RQ7, and how to analyse the result. `HANDOFF.md` section 9 summarises it for the build; for events, fields and headline randomisation, this file is the authority.

## Principles

- V4 is a **Must** and stays opt-in, off by default. Everything below is also kept locally for "Share my stats", but leaves the browser only when the user has opted in
- No device names, notes, URLs, domains of user-added sites or timestamps are sent. Time is sent as whole days since install
- The client ID is random, created on the device, and tied to nothing else
- No new permissions. The endpoint is the configurable V4 URL; when it's empty, nothing is sent
- On Firefox, the opt-in also goes through Firefox's built-in data consent (`technicalAndInteraction`, see `HANDOFF.md` section 4)

## Opt-in copy, onboarding

> **Help test what works**
> Upgraditch tries different wording in the bar to learn what helps. If you switch this on, it sends anonymous counts: which wording was shown and what you clicked. No device names, notes or web addresses. You can switch it off at any time in the popup.
>
> [ ] Send anonymous counts

## Common fields

Every event carries:

```ts
type Base = {
  schemaVersion: 1;
  clientId: string;      // crypto.randomUUID(), created at install
  eventId: string;       // crypto.randomUUID(), per event, so an event sent twice is stored once
  build: string;         // manifest version
  browser: "chrome" | "edge" | "brave" | "firefox" | "other"; // detected once at install
  dayIndex: number;      // whole days since install; week of use = floor(dayIndex / 7) + 1
  event: EventName;
};
```

Events are batched locally and posted at most once an hour, and only while the opt-in is on. The opt-in sits in onboarding, so the setup events recorded just before it (`install`, `permission_result`) are sent once the user opts in. Otherwise the counts start when the switch goes on: events recorded before an opt-in made later (from the popup), or while the switch was off, are never sent. Nothing is ever sent for people who don't opt in, including people who leave onboarding before reaching it; the Chrome Web Store install count shows how many that is.

## Events

| Event | When | Extra fields |
| --- | --- | --- |
| `install` | First run | none |
| `onboarding_finished` | Onboarding completed | `devices`, `reasonsSet` (boolean) |
| `permission_result` | After each host permission request | `requested`, `granted` (counts) |
| `bar_shown` | Each time the bar renders | `showingId`, `siteCategory`, `headline`, `eligible` (list), `deviceMatched` |
| `bar_outcome` | Once per showing, when it ends: the tab closes, the page navigates away, or 30 minutes pass | `showingId`, `cardOpened`, `tabClosed`, `urgeLogged`, `cooldownStarted`, `dismissed` (booleans) |
| `urge_logged` | Any urge, from the bar, card or popup | `source`, `reasonTag` |
| `cooldown_started` | Cooldown created | `cooldownId`, `lengthDays`, `wantStart` |
| `cooldown_ended` | End date reached and the user answered, or they ended it early | `cooldownId`, `wantEnd`, `outcome` (`bought`, `dropped`, `expired`), `daysRun` |
| `need_test_result` | Need test finished | `result` (`keep`, `repair`, `upgrade`) |
| `paused` | The pause switch changed | `on` (boolean) |

`siteCategory` comes from the trigger list entry, never from the URL: `price_comparison` (Tweakers Pricewatch), `specs` (GSMArena), `shop` (Coolblue, bol, MediaMarkt), `forum` (gathering.tweakers.net, if added at Checkpoint A). Trigger sites added by the user are out of scope for Stage 1.

A showing can have several outcomes (card opened, then tab closed), so `bar_outcome` records each as a flag. All flags false means "nothing".

## Headline randomisation

This is the micro-randomised part (Klasnja et al. 2015): each showing, not each user, is randomised.

| ID | Headline (first draft from the plan) | Eligible when |
| --- | --- | --- |
| `own_rule` | "You said you'd replace it for battery or updates. Does this page fix either?" | The shown device has reasons set |
| `cost` | "€19.14 a month so far, and falling" | Always |
| `support` | "Security updates until Oct 2027" | The end of security updates is known (never automatically for iPhones: Apple announces no date) |
| `time_held` | "Kept for 3 years 11 months" | Always |
| `phone_voice` | "We've had 3 years 11 months together. I'm not done yet." (the same fact as `time_held`, in the phone's voice) | Always |

- At each showing, pick uniformly at random among the *eligible* headlines with `crypto.getRandomValues`, and record the eligible list, so the analysis knows each headline's chance of being picked
- The layout stays the same for every headline. Varying the headline is the only variation in Stage 1; with a few hundred showings, a second randomised factor would leave both unreadable
- "Close tab" stays the primary action on every variant

## Cooldown and Share my stats

The cooldown's data model (want rating at the start and the end, adjustable length, outcome) is in `HANDOFF.md` section 5, and its end screen, which asks for the new rating before showing the old one, in section 8. The "Share my stats" summary, including the per-headline bar counts, is in section 10.

## Endpoint

- `POST` a JSON array of events. Validate the schema and reject unknown fields
- Don't store IP addresses, and keep request logging off. The only use of the address is as the key of Cloudflare's rate limiter (2 uploads a minute per address), so a script can't fill the table by making up client IDs
- Store rows with the day they arrived; nothing finer
- Store an event sent twice (same `eventId`) once. Accept one install's events per batch, and at most 1000 a day per install, so one script can't fill the table under a single client ID
- After the Stage 1 analysis, delete raw events and keep only the totals (research plan, Data and consent)

## Analysis

### Checkpoint B (end of the field window)

1. **Funnel.** Installs (store dashboard) → opted in → onboarding finished → at least one permission granted → first bar (days after install) → first interaction. Rules: fewer than 6 in 10 who finish onboarding grant a permission, then the permission step is the bottleneck; fewer than half of installs see a bar within 7 days, then add a touchpoint that doesn't need a shop visit, or widen the trigger list
2. **Headlines.** Per headline: showings, the share with `tabClosed`, and a 95% Wilson interval; the same for `cardOpened`. Also compute each user's rate and average across users, so one heavy user can't decide it. Drop a headline only when its rate is under half the best one and the intervals don't overlap. Expect no clear loser: in one sec's experiment the message itself made no difference
   - `phone_voice` against `time_held`: both state how long the phone has been kept, so the difference between them is the effect of the phone's voice. Report it as its own comparison
3. **Habituation.** `tabClosed` and `cardOpened` rates by week of use (1 to 4). For users with showings in both week 1 and week 4, compare their own rates. A steady fall means: vary more, show the bar less often
4. **Page type.** Dismiss rate by `siteCategory`. This answers the open question from Track A about whether interrupting casual browsing annoys
5. **Urges.** Urges per active user per week (active: at least one event that week)
6. **Browser.** Opted-in users per browser, next to the recruits' answers (B1, B2) and the store dashboards (Chrome Web Store against Firefox Add-ons installs). Dismiss rate by browser: a bar that misbehaves in one browser shows up here first, as one sec's freezes did on Brave

### Checkpoint C (1 to 2 weeks later)

- Mean change from `wantStart` to `wantEnd`, paired per cooldown, and the share of outcomes
- Rule: want ratings fall on average and most cooldowns end dropped or expired, so keep the cooldown. Ratings don't fall and most end in a purchase: the cooldown only delays, so stop promoting it on the bar

With 30 users, expect somewhere between 10 and 40 cooldowns. Read the result as a direction, not a finding.
