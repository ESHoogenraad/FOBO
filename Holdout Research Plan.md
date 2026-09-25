# Upgraditch: Research Plan

2026-09-22 · @Someone

## Purpose

Most of Upgraditch's mechanics started as a personal itch or a clever idea. This plan checks each one against published evidence and against real people, before and during Stage 1, so that what ships gets used rather than just liked. The goal is adoption and usefulness. Revenue is out of scope.

Everything rolls up into three questions:

1. **Reach.** Does Upgraditch show up at the moment of temptation often enough to matter?
2. **Effect.** When it shows up, does it change what people do?
3. **Adoption.** Do people keep it installed, and do they tell others?

## Rules

- Every research question names the decision it feeds and the checkpoint where that decision is made. No decision, no research
- Desk research is capped at 8 hours in total, spread over evenings, never on a build weekend. It shows what is plausible and what backfires. It never passes a gate
- User research runs alongside the build, not before it
- Record what people say and what they did separately. "I would use that" is logged but carries no weight
- Most published evidence comes from cheap impulse buys (clothes, Amazon baskets) or health apps. A phone upgrade is expensive, slow and researched for weeks. Treat the literature as hypotheses to test, not proof
- One findings log at the bottom of this file, one line per finding

## Research questions

| ID | Question | Decision it feeds | Method | Checkpoint |
| --- | --- | --- | --- | --- |
| RQ1 | How often, and where, are people tempted? | Whether a desktop extension can carry Stage 1; the default trigger list; whether the Stage 1 gate numbers are reachable | B1 | A |
| RQ2 | What drives an upgrade: problems with the old phone, or the pull of a new one? | Which mechanic leads: the own-rule card and cooldown, or the need test and repair path | B2 | A (first 8 interviews), B (all 15) |
| RQ3 | What outcome do people want from a tool like this, and when would they look for one? | Positioning, store listing wording, name, channels, timing | B2, A10 | A |
| RQ4 | How visible can the bar be before people switch it off? | Bar default (collapsed or expanded), size, how often it reappears | B3, B4 | A, B |
| RQ5 | Does onboarding get people to their first bar? | Onboarding steps, the permission request, one device or several | B3, B4 | A, B |
| RQ6 | Which bar content makes people close the tab? | Bar headline, cost framing, whether to vary the content | A1 to A3, B4 | B |
| RQ7 | Does the cooldown lower desire, or only delay the purchase? | Keep the cooldown or not. Length and countdown were settled by Track A: 7 days, a quiet end date, no countdown | A4, B4 | C |
| RQ8 | Is predicted versus actual satisfaction worth building? | Build or cut F12 | A6, B2 | B |

## Track A: desk research (8 hours in total)

For each row: read the abstract, results and limitations of the sources, note effect size, population and context, then set a verdict: *build as planned*, *build with the change noted*, *test in the field first*, or *cut*.

**Status: done on 22 Sep 2026.** A second pass read the full text wherever a verdict depended on it (see the note under Sources). Verdicts that changed from the first pass are marked **Changed**. Every finding behind a change has a line in the findings log.

| ID | Mechanic | Evidence | Watch out for | Verdict |
| --- | --- | --- | --- | --- |
| A1 | Own-rule card: reasons picked at onboarding, asked back on a shop page | If-then plans made in advance had a medium-to-large effect on reaching goals, d = 0.65 across 94 tests (Gollwitzer & Sheeran 2006). In a preregistered experiment with 771 US online shoppers and $10 items, listing 5 reasons for and 5 against a purchase (about 3½ minutes) lowered urge and intent from 4.50 to 4.04 on a 1 to 7 scale. The more people wrote against buying, the more the urge fell; the more they wrote for it, the more it rose. A counting task lowered it just as much (Moser 2020). Reflection was one of three strategies online impulse buyers most often called successful; willpower alone never was (Moser et al. 2019) | Reasons picked in a calm moment may be vague: "camera" makes the card say yes on every camera page. Arguing for a purchase backfires; some participants said it talked them into wanting it. Being told what to do can backfire (reactance); the user's own rule and a visible way out are the defence | Build as the core. **Changed:** never ask the user to write or choose reasons *for* buying. One-tap reason tags name the pull without arguing for it. Frame the check around the purchase and the user's own rule, not product details |
| A2 | Bar on trigger pages, with "Close tab" | one sec: 36% of attempts to open a target app were abandoned, and attempts fell 37% over six weeks. These figures cover only the 280 of 719 new users who kept the app all six weeks, with no control group. In the follow-up experiment (500 people, video clips), the option to back out worked as well as the full intervention, a short wait helped, and the deliberation message had no effect (Grüning et al. 2023). A review of 367 self-control apps and extensions sorts them into blocking, self-tracking, goal advancement and reward or punishment (Lyngs et al. 2019) | People stop seeing a warning that looks the same every time: brain response dropped sharply from the second exposure; warnings that changed appearance resisted this (Anderson et al. 2015, security warnings). 61% of one sec's new users had stopped within six weeks. In one sec's Chrome reviews, four of the five 1 and 2 star ratings are about the overlay freezing the browser or being bypassed, not about the idea | Build; "Close tab" stays the main action and must stay prominent. **Changed:** vary appearance and content so the bar stays noticed, but expect small differences between headlines, because the message itself did little. Put effort into speed and reliability on the default sites and on Brave rather than copy |
| A3 | Cost per month | Per-day framing makes people compare a cost with small everyday expenses, so it feels smaller (Gourville 1998). Online impulse buyers asked for costs made personal, such as hours of work needed to pay (54% of 151, Moser et al. 2019). Trade-in programmes go with earlier replacement (Corrocher & Paganuzzi 2025). On Tweakers, contract ends, trade-in values and launch offers come up as the moment to upgrade (A10) | Carriers use exactly this framing to sell phones. "€19 a month" for the old phone invites "only €35 a month" for the new one | Test in the field against other headlines (B4). Idea to test later: when a page shows a trade-in or monthly price, show what keeping the phone costs next to it |
| A4 | Cooldown | Read in full in Moser 2020. A wait of about 25 hours lowered urge from 3.23 to 2.80 and intent from 2.66 to 2.48 on 1 to 7 scales (164 students, $2.49 to $5.49 items, no control group); how long the wait was (2 to 106 hours) did not predict the drop. A 10-minute checkout delay on Amazon (131 people) cut impulse purchases from 0.45 to 0.26 per person, not significant; everyone kept shopping during it, and people who checked the time left more often bought more (correlational). "Sleeping on it" was one of the most cited successful strategies (Moser et al. 2019). Waiting lets a "hot" state cool (Loewenstein 2005) | Waiting for a possession is less pleasant than waiting for an experience (Kumar et al. 2014). A countdown can turn into a deadline (the time-left finding above). The licensing worry is weaker than first stated: moral licensing is d = 0.31 in a meta-analysis (Blanken et al. 2015) and close to zero after correcting for publication bias (Kuper & Bott 2018), and Khan & Dhar (2006) found less licensing when the virtuous act was prompted from outside. No study tested a delay on an expensive, researched purchase | **Changed:** build with a quiet end date ("Check again on 29 Oct") instead of a visible countdown, and a want rating at the start and the end, with the start rating shown back at the end. Default 7 days, adjustable by the user. Drop the 7 versus 30 day test: 30 users will start too few cooldowns to compare lengths |
| A5 | Urge log | Self-monitoring explained the most variation (13%) across 122 healthy-eating and exercise evaluations with 44,747 people; combined with another self-regulation technique, effects were d = 0.42 against 0.26 (Michie et al. 2009) | Tracking fades fast: median 30-day retention across 93 popular mental-health apps was 3.3%, and 6.1% for tracker apps (Baumel et al. 2019) | Build as one tap from the bar, paired with the own-rule card. Don't count on it for retention |
| A6 | Predicted versus actual satisfaction | People misremember their predictions as matching how they later felt, so they don't learn from forecasting errors. One of the five studies was about an important purchase, and reminding people of their actual prediction improved later forecasts (Meyvis et al. 2010) | It needs purchases, which Upgraditch exists to prevent | Test first with a retrospective question in B2; build F12 only if it lands. **Changed:** the cooldown end screen gives the same mechanism without a purchase: show the want rating given at the start next to the one given now |
| A7 | Milestones and streaks | Temporal landmarks (a new week, month or year, a birthday) increase goal pursuit: diet searches, gym visits and goal commitments (Dai, Milkman & Riis 2014, archival). Interest in a model's repair manuals peaks about two years after launch, then declines (Makov & Fitzpatrick 2021) | A streak ended by an honest "upgrade" turns a correct decision into a failure. The fresh-start evidence is about starting a goal, not about holding off | Build milestones (Should). **Changed:** the 2-year milestone carries the battery and repair check, before interest in repair fades. Cut streaks |
| A8 | Social features: Stage 3 share cards, community | Only 9% of 151 impulse buyers wanted a tool that posts when they resist buying; social accountability was the least wanted type of tool (Moser et al. 2019) | Oraee et al. (2024) propose community pledges and a "slow smartphone" movement but say themselves these still need testing. That makes it an untested idea rather than conflicting evidence | Deprioritise; ask in B2 |
| A9 | The need test's claims | iPhone CPU performance stays stable for years across 3.5 million benchmark scores, yet benchmark runs spike each year around new-model launches; the authors read this as people looking for a "functional alibi" (Makov & Fitzpatrick 2021). Replacement is driven mainly by the current phone *seeming* obsolete (basic function, being up to date, keeping up socially) rather than by a desire for the new (Wieser & Tröger 2018, 988 Austrians). In Italy, wanting the latest model and trade-in offers go with shorter phone life, performance problems don't, and tech-engaged users tolerate decline longer (Corrocher & Paganuzzi 2025, 381 people, self-report) | The benchmarks leave out the battery. iOS slowed phones with worn batteries in 2017, so "it feels slow" can be real and a battery swap can fix it. The repair path needs trust: a price, a place, a time. The first pass's claim that most Austrians distrust repair could not be verified and was removed | Build. **Changed:** answer "slow" by checking the battery first, then with evidence and a care quest. Make "repair" concrete. The need test's job is to settle the alibi either way, so it must say "upgrade" plainly when that's true |

**A10: adoption scan (done 22 Sep 2026)**

Method: Chrome Web Store and Firefox Add-ons searches with user counts; the 263 most recent Chrome reviews of one sec, the closest analogue with enough reviews to read; Tweakers forum search and threads (the September 2026 Apple event thread, the Pixel 10 and 11 threads, buying-advice threads); 23 Reddit threads found by search and read once the owner had logged in (r/nobuy, r/BuyItForLife, r/GooglePixel, r/minimalism, r/Anticonsumption, r/shoppingaddiction, r/Android, r/iphone). The Reddit threads date from 2017 to 2024 and are mostly American; upvotes show what resonates there, not how common something is.

Results:

- **The category is empty.** Pause is gone from the Chrome Web Store (5 users on Firefox Add-ons, last updated 2021). About 20 "stop impulse buying" extensions exist; the largest (Less) has 49 users, most have under 10, and none has a 1 or 2 star review to learn from. By comparison, one sec has 30,000 Chrome users and Spending Calculator for Amazon, a cost-salience tool, about 10,000. People don't find restraint tools by searching the store, so the store is a place to land, not a channel
- **Search terms.** "impulse shopping", "impulse buying", "mindful shopping" and "think before you buy" surface the small competitors. "phone upgrade" and "phone lifespan" surface nothing related
- **Why people remove the closest analogue.** Four of the five 1 and 2 star ratings among one sec's 263 reviews are about technical failure: the overlay freezing the browser (mostly Brave), or being skipped when a URL is typed fast. Satisfied users accept the annoyance as the point ("annoying, but that's what it has to be"), value the option to continue, and ask for a way to pause everything when they really need a site
- **The words people use** on Tweakers (phone threads from Aug to Sep 2026, plus older threads about other gadgets): "upgradedrang", "upgradekriebels", "hebberig", "mijn koopimpuls tegenhouden", "me voor een Pro laten verleiden", upgrading "omdat het kan" while the old phone "doet het nog steeds te goed", and "dat moet wel ergens op slaan". Some ask for permission: "Ik mag mijn Pixel 7 nu wél vervangen". One wanted reviews that compare a new phone with a 3 to 4 year old one instead of last year's model
- **Where and when it happens.** In product "Ervaringen & Discussie" topics and launch-event live threads on gathering.tweakers.net, not only in Pricewatch, and in videos ("Ik kijk te veel video's"). Named triggers: launch events, a contract ending, trade-in value, launch offers, a price rise. Serious buying-advice threads weigh the update end date explicitly, so the "Updates until" tile speaks their language
- **The name is taken.** "Holdout — Coupon Codes & Cash Back" (18 users) is live in the Chrome Web Store, with the opposite purpose. "Not Yet: Checkout Blocker" and "StillGood" also exist

Reddit results:

- **The alibi, in their own words.** "I always try to find reasons why I 'need' the new version"; "the mental gymnastics to justify the purchase". The most upvoted restraint post found (r/minimalism, 535): someone bought a new phone on interest-free financing because the 2019 one felt "a bit slow", then ran the side-by-side app test from YouTube before selling the old one and found them "almost the same". Supports A9
- **The want fades, but doesn't feel like it will.** "In the moment you're convinced that you will always feel this intensely about it … even though that intense want has always faded after two weeks in the past" (r/nobuy). After buying: "really fun for like a day and then I just feel silly and broke". Supports showing the start rating at the end of a cooldown (A4, A6)
- **What people already do, unprompted.** Make the old phone feel new: a new case or screen protector, a new wallpaper, a tidied home screen, clearing storage or a factory reset (the top answers in the r/nobuy iPhone thread, and again in r/minimalism). Re-watch the launch review of the phone they own ("it makes me feel like I have a new phone again"). Count the price in hours of work. Wait rules of three days, 30 days or three months. Decide at purchase how long to keep a phone. Talk it through with a friend who has to be convinced. Unfollow tech YouTubers and tech news. The refresh tactics and the launch review cost nothing and none is in the roadmap
- **Triggers.** In r/GooglePixel launch threads, deals decide more than features: trade-in values, pre-order gifts (a free watch or earbuds), "if they offered a decent amount on trade". Also contract ends and upgrade plans ("upgrade with this super super great deal for another 2 years"; "I was a sucker and got a new phone when my contract ended"), a friend's new phone, launches, tech videos, and stress or a milestone ("getting that iPhone is like a feel good" during exams, a treat for graduating). A trade-in offer cuts both ways: one reply read the offer as "the most that phone will ever be worth", so falling value can push someone to sell now. That is a risk for the `cost` headline's "and falling"
- **Updates are the accepted reason, and a confusing one.** Supported, secure software is the reason to replace that people accept most readily, and some employers require it. People mix up new Android versions with security updates (a whole thread asks what happens when "guaranteed Android version updates" end), and answers on the risk range from "a better chance of being hit by lightning" to "like not wearing a seatbelt"; the best-received careful answer weighed it by what is on the phone (banking, passwords, email). In practice a phone often ends when banking, ID or work apps stop running on it, or when the network drops support (3G shutdowns)
- **The battery swap is the turning point.** "$35 … I no longer had to constantly charge my phone 3-5 times a day"; "$49 at Apple … as good as new again". One person was quoted more for a battery than the phone would sell for, and bought a new phone instead. Supports making "repair" concrete with a price (A9)
- **Words.** "The itch", "upgrade itch", "scratch that itch", "shiny", "new toy", "want vs need", "justify", "a compelling reason to upgrade", "holding out for" the next model, "rocking an old iPhone". People ask the crowd for a verdict ("Is there any reason to upgrade from my current Pixel 6?"), and get "This is a very personal decision. We cannot make it for you." That gap is what the need test fills
- **Tone.** Enthusiasts resist being restrained ("I can be disciplined enough and have Tech as a hobby"; "If tech is your interest or hobby enjoy it!"), and a r/GooglePixel post advising what to buy drew "are you a Google bot". Upgraditch's posts must not preach or read as advertising
- **Where the conversation is.** Restraint posts about tech draw the most response in r/minimalism and r/Anticonsumption (63 to 535 upvotes, 66 to 107 comments), more than in r/nobuy (7 to 27 comments). r/BuyItForLife threads are about which phone lasts, and regulars are tired of the question ("I see this question almost every day. It's not a thing."). r/GooglePixel has the moment itself: launch-week threads like "Pixel 7 Pro owners, are y'all upgrading?" (301 comments), where the top answer was "Nah. P7P works perfectly well for me"

Output (drafts; B2 question 9 and the first posts decide):

- Store text: first drafted here; the current text is in [store/listing.md](store/listing.md)
- Positioning: an honest second opinion that also says "upgrade" when that's true, not a blocker. This leans toward B2's "buy the right thing at the right time" rule; B2 confirms or overturns it
- English opening to try in the first posts, from the Reddit words: "Got the upgrade itch?"
- Channels: the order and per-channel advice live in the roadmap (M3). From this scan: lead with the story (keeping a phone that still works) rather than the tool, time posts for launch weeks (Pixel in August, Apple in September) and the run-up to Black Friday, and check each subreddit's rules by hand
- Name candidates (no Chrome Web Store clash found): "Is it time?", "Nog niet", "Upgradecheck". All three follow the permission-and-timing language above. Drop "Holdout", "Not Yet", "Still Good" and "Keeper" (taken)
- Working name since 23 Sep 2026: "Upgraditch" (upgrade + itch, echoing "Got the upgrade itch?"). An itch names the pull without judging it, and sometimes you scratch it, so it leaves room for "yes, upgrade". Tagline to try: "Is it the itch, or is it time?"

**Gaps (searched with the time left)**

- Browsing as entertainment: browsing without intent to buy is a recognised, enjoyable activity (Moe 2003), but nothing was found on whether interrupting it annoys more than it helps. B3 and B4 answer it: watch dismiss rates on browsing pages
- Cost framing for expensive items specifically: nothing found. B4 tests it
- Tech enthusiasts: tech-engaged users tolerate performance decline longer (Corrocher & Paganuzzi 2025), and the Tweakers threads show upgrading "because I can". For Upgraditch's likely users, expect pull and deals to matter more than slowness

## Track B: user research

### B1 Diary study (RQ1, RQ3)

Kit with messages, consent text, log format and tally script: [research/B1 Diary kit.md](research/B1%20Diary%20kit.md).

**Who.** 8 to 10 people who have kept their phone for at least 2 years and admit to looking at phones they don't need. At most half from the pro-longevity communities; recruit the rest through friends, colleagues and the Tweakers forum. Expect one or two to drop out.

**When.** Start as soon as possible and run for 14 days. Autumn is launch season, so the numbers are closer to a ceiling than an average. Note the dates.

**How.** One chat thread per person (Signal, WhatsApp or Telegram) or a three-field form, filled in each time they catch themselves looking:

- Where: computer browser, phone browser, shop app, video, social feed, forum or launch thread, offer or contract (trade-in, contract ending, deal), physical shop, conversation
- What set it off, and which site or app
- What they did next

The two added places come from A10: on Tweakers the urge is voiced in forum threads, and contract ends and trade-in offers come up as triggers.

Each evening, a one-tap check: "Any temptation today? Yes / no." Days without temptation count; without them, frequency is overestimated.

**Output.** Temptations per person per week, share by place, sites named, and which browser each person uses on a laptop or computer (asked at screening).

**Decision rules (Checkpoint A)**

- Median below 1 desktop-browser temptation per person per two weeks: the bar alone cannot carry Stage 1. Add a touchpoint that doesn't need a shop visit (milestones, a weekly popup summary) and set the Stage 1 gate numbers to what the diary shows is reachable
- More than 60% on the phone or in apps: bring Stage 2 forward; keep Stage 1, with lower expectations
- A site not on the default list named by 3 or more people: add it. Watch gathering.tweakers.net in particular: the handoff's `https://tweakers.net/*` permission does not cover the forum subdomain

### B2 Switch interviews (RQ2, RQ3, RQ8)

Replaces the M1 script in the roadmap. Kit with recruitment, consent, the Dutch script, a record sheet and the one-page summary: [research/B2 Interview kit.md](research/B2%20Interview%20kit.md).

**Who.** 15 people: at least 5 who upgraded in the last 18 months, and at least 5 who seriously considered it and didn't.

**Format.** 20 to 30 minutes. Walk through what happened, in order, instead of asking for opinions about the product. The frame is Bob Moesta's forces of progress: what pushed them away from the old phone, what pulled them to the new one, what made them anxious about switching, and what habit kept them where they were (Moesta 2020).

**Script**

1. The phone you have now: when did you get it, and what did you have before?
2. Take me back to the first moment you thought about replacing the old one. What was going on?
3. What did you look at, where, and how often? Sites, videos, shops, forums; on your phone or a computer? Did a contract ending, a trade-in offer or a deal play a part?
4. What was wrong with the old one? Did you check anything to see whether it really was slow or worn? What drew you to the new one? What made you hesitate? What kept you on the old one for a while?
5. Was there a moment you almost didn't buy? What happened?
6. From 1 to 10, how excited were you in the first week with the new phone? And now? (RQ8)
7. Have you ever tried anything to stop yourself buying something? What happened? (RQ3; past behaviour predicts use better than interest does)
8. If something had helped here, what would you have wanted from it: not buying, buying later, buying the right thing, browsing less, or thinking about it less? (RQ3)
9. What would you call this problem? (name)

For people who didn't upgrade, questions 2 to 5 cover the time they considered it, followed by: what stopped you?

**Record per interview:** the dominant force, the reason they give, the reason their story suggests, where the looking happened, and the answers to 6 and 8. Summarise all 15 on one page (the Stage 1 gate asks for this).

**Decision rules**

- Push dominates in 10 or more of 15 (battery, damage, slowness): the need test and repair path become the headline, and the bar leads with evidence ("Battery 81%. A €X swap fixes it")
- Pull dominates (camera, launch hype, novelty): the own-rule card and cooldown stay the core, as designed
- Code push only when the story shows a real problem. A problem that was noticed only after the new model appeared counts as pull looking for an alibi (Makov & Fitzpatrick 2021). The literature is split on which force leads (Wieser & Tröger 2018 against Corrocher & Paganuzzi 2025), so this rule carries real weight
- Fewer than 5 of 15 recognise the problem in themselves: the roadmap's kill signal applies
- Most want "buy the right thing at the right time" rather than "don't buy": position Upgraditch as knowing when it's actually time, not as a restraint tool. This changes the store listing, the posts and possibly the name
- The gap between first week and now in question 6 is large and people react to seeing it: F12 stays. Small, or shrugged off: cut F12

### B3 Prototype sessions (RQ4, RQ5)

**When.** Between build weekends 2 and 3, once the bar works on the default sites.

**Who.** 5 people other than you, ideally from B2.

Kit with setup checklist, session script and observation sheet: [research/B3 Prototype session kit.md](research/B3%20Prototype%20session%20kit.md).

**Tasks.** Install the test build and complete onboarding. Then: "You're curious about the new Pixel or iPhone. Look around on Tweakers Pricewatch and Coolblue the way you normally would." Ask them to think aloud.

**Watch for**

- Their reaction to the permission prompt
- Whether they notice the bar, and whether they read it
- Whether it gets in the way of the page
- What they expect "Close tab", "Log urge" and "Cooldown" to do
- What they do after opening the card
- Whether the page stays fast, and whether anything freezes. Run at least one session in Brave: in one sec's reviews, freezes and bypasses are what earn 1 star
- How they read the cost line ("€19.14 a month so far, and falling"): as a reason to keep the phone, or as a reason to sell or trade it in while it's still worth something (A10, Reddit)

Afterwards ask: "What would make you switch this off?" and "Would you keep it installed? Why?"

**Decision rules (Checkpoint A)**

- 2 or more of 5 hesitate at or decline the permission prompt: rewrite the explanation shown before it
- 2 or more say the bar gets in the way: one collapsed line by default
- 2 or more misread a button: rename it
- Any freeze or clear slowdown: fix before the field window
- 2 or more read the cost line as a reason to sell now: reword it before B4, for example drop "and falling"

### B4 Field study in the extension (RQ4 to RQ7)

**When.** The Stage 1 window: 4 weeks with the first 30 users. Aim for the window to include Black Friday (27 Nov 2026).

Build spec with the event schema, headline randomisation and analysis steps: [research/B4 Field study spec.md](research/B4%20Field%20study%20spec.md).

**What it needs in the build.** Opt-in counters (V4, a Must), a random headline per showing recorded with its outcome, onboarding funnel events, want ratings at the start and end of each cooldown, and the browser family on every event. Events, fields and headlines: the B4 spec; the build summary: `HANDOFF.md` section 9.

**What to expect from the numbers.** With about 30 users and one or two bars per user per week, expect a few hundred showings. Only large differences between headlines will show, for example 10% against 30% closing the tab. Treat results as directional: enough to drop a clearly weak headline, not to prove one works. Randomising per showing rather than per user is what makes even this possible; the design is a micro-randomised trial (Klasnja et al. 2015). In one sec's experiment the message itself made no difference and the back-out option did, so "no clear winner" is the most likely result. That result is fine: it means copy is not where the effect comes from.

**Decision rules**

- Fewer than half of installs see a bar within 7 days: the extension sits unused for most people. Add a touchpoint that doesn't need a shop visit, or widen the trigger list (Checkpoint B)
- One headline clearly below the others on tabs closed: drop it (B)
- Tabs closed or cards opened falling week by week: habituation. Vary more, show the bar less often (B)
- Fewer than 6 in 10 who finish onboarding grant the permission: the permission step is the bottleneck (B)
- Want ratings fall on average and most cooldowns end dropped or expired: keep the cooldown. Ratings don't fall and most end in a purchase: the cooldown only delays; stop promoting it on the bar and keep the card and urge log as the core (C)

## Checkpoints and timeline

Dates depend on when the build weekends fall; fill them in once known.

| When | Research | Build |
| --- | --- | --- |
| Now, before build weekend 1 | Recruit diary participants and the first interviewees. Set up the diary threads. Track A is done, including the Reddit threads from A10 (22 Sep) | None |
| Build weekends 1 and 2 | Diary runs 14 days. First 8 interviews | Weekends 1 and 2 |
| Between weekends 2 and 3 | 5 prototype sessions. **Checkpoint A**: trigger list (including gathering.tweakers.net), bar default, bar headlines, name, what to cut | Adjust the weekend 3 plan |
| Field window, 4 weeks | B4 runs. Remaining 7 interviews. Roadmap M6 interviews at weeks 2 and 4 | Bug fixes only |
| End of field window | **Checkpoint B**: funnel, headlines, habituation, interview summary, F12. Then the Stage 1 gate review | |
| 1 to 2 weeks later (cooldowns default to 7 days) | **Checkpoint C**: cooldown outcomes | |

## Changes this plan made to the roadmap and handoff

All applied to the roadmap, `HANDOFF.md` and the B4 spec on 22 Sep 2026; each traces to a Track A verdict or a line in the findings log. Two defaults set then are revisited at the checkpoints: Stage 1 supports one phone (RQ5, Checkpoint B), and users can't add trigger sites; "This page tempted me" logs sites for the Checkpoint A decision instead. The Stage 1 gate numbers are revisited at Checkpoint A with the diary data.

## Data and consent

- Diary and interviews: tell people what you record and where it's kept. Keep notes on your own machine, anonymise quotes, delete on request, and record audio only with consent
- Field study: V4 is opt-in and off by default. The privacy note says the bar's wording varies to learn what helps. No device names, notes or full URLs are sent, and the Worker does not store IP addresses. The client ID is random. Delete raw events after the Stage 1 analysis and keep only totals

## Findings log

Strength is the strength of the evidence *for Upgraditch's situation*, so a solid study on $10 items still counts as moderate or weak.

| Date | Source | Finding | Strength | Affects | Action |
| --- | --- | --- | --- | --- | --- |
| 22 Sep 2026 | Gollwitzer & Sheeran 2006 (abstract) | If-then plans: d = 0.65 across 94 tests, confirmed | strong | A1 | None; the card stays the core |
| 22 Sep 2026 | Moser 2020, study 5 (full text) | Reflection and distraction lowered urge equally against control (4.04 and 3.97 against 4.50 on 1 to 7; 771 people, $10 items). Writing more against buying lowered urge; writing more for it raised urge | moderate | A1, RQ6 | Card never asks for reasons for buying |
| 22 Sep 2026 | Moser 2020, study 3 (full text) | A 25-hour wait lowered urge by 0.43 and intent by 0.18 on 1 to 7 (164 students, $2 to $5 items, no control group); wait length from 2 to 106 hours did not predict the drop | weak | A4, RQ7 | 7-day default; no length test |
| 22 Sep 2026 | Moser 2020, study 4 (full text) | 10-minute checkout delay: fewer impulse buys (0.26 against 0.45), not significant; all kept shopping; checking the time left more often went with buying more (correlational) | weak | A4, RQ7 | Quiet end date instead of a countdown |
| 22 Sep 2026 | Grüning et al. 2023 (full text) | The 36% and 37% effects come from the 280 of 719 new users who stayed six weeks, without a control group. In the experiment the back-out option did the work and the deliberation message did nothing | moderate | A2, RQ4, RQ6 | "Close tab" stays primary; expect small headline differences in B4 |
| 22 Sep 2026 | Anderson et al. 2015 (abstract) | Habituation after the second exposure; changing appearance resists it. Security warnings, fMRI | moderate | A2, RQ4 | Vary appearance, not only the words |
| 22 Sep 2026 | Blanken et al. 2015; Kuper & Bott 2018 (search summaries) | Moral licensing d = 0.31; near zero after correcting for publication bias; several failed replications | moderate | A4 | Licensing worry downgraded; the countdown concern rests on Moser study 4 |
| 22 Sep 2026 | Kumar et al. 2014 (abstract) | Waiting for a possession is less pleasant than waiting for an experience | moderate | A4 | Keep the wait quiet, not a ticking clock |
| 22 Sep 2026 | Meyvis et al. 2010 (abstract) | People misremember forecasts, including for an important purchase; being reminded of the actual forecast improved learning | moderate | A6, RQ8 | Show the start want rating at cooldown end |
| 22 Sep 2026 | Michie et al. 2009 (abstract) | Self-monitoring explained 13% of variation across 122 evaluations (44,747 people); with another technique d = 0.42 against 0.26 | strong | A5 | Keep the urge log paired with the card |
| 22 Sep 2026 | Baumel et al. 2019 (abstract) | Median 30-day retention 3.3% across 93 mental-health apps, 6.1% for trackers | moderate | A5, adoption | The urge log won't carry retention |
| 22 Sep 2026 | Dai, Milkman & Riis 2014 (abstract) | Fresh-start effect is archival and about starting aspirational behaviour | moderate | A7 | Milestones stay Should |
| 22 Sep 2026 | Makov & Fitzpatrick 2021 (full text) | Old iPhones' benchmark runs spike at each launch although performance is flat ("functional alibi"); benchmarks exclude battery; repair interest peaks about 2 years after launch | moderate | A9, A7, RQ2 | "Slow" → battery check first; 2-year milestone carries the repair check |
| 22 Sep 2026 | Wieser & Tröger 2018 (abstract) | Replacement is driven mainly by perceived obsolescence of the current phone, not a desire for the new (988 people plus 25 interviews, Austria) | moderate | RQ2, A9 | Coding rule for push against alibi in B2. The first pass's "most distrust repair" claim was not in the abstract and was removed |
| 22 Sep 2026 | Corrocher & Paganuzzi 2025 (full text) | Wanting the latest model and trade-in offers go with shorter phone life; performance decline doesn't; tech-engaged users tolerate decline longer (381 people, self-report, low explanatory power) | weak | RQ2, A3, A9 | Ask about deals and contracts in B2; add "offer or contract" to the B1 places |
| 22 Sep 2026 | Oraee et al. 2024 (abstract) | Pledges and a slow smartphone movement are proposals the authors say still need testing | weak | A8 | Not a conflict with Moser et al. 2019; social stays deprioritised |
| 22 Sep 2026 | Chrome Web Store and Firefox Add-ons scan | Pause delisted from Chrome; about 20 restraint extensions, the largest with 49 users, none with critical reviews. one sec 30,000 users, Spending Calculator for Amazon about 10,000 | strong | RQ3, adoption | Store search is not a channel; plan reach around communities |
| 22 Sep 2026 | one sec Chrome reviews (263 read) | Four of the five low ratings are about freezes or bypasses; users accept the annoyance when they can continue; they ask for a pause-all switch | moderate | RQ4, adoption | Test on Brave; add a pause switch |
| 22 Sep 2026 | Chrome Web Store name search | "Holdout — Coupon Codes & Cash Back" exists (18 users), as do "Not Yet" and "StillGood" | strong | RQ3, name | Choose the name at Checkpoint A from "Is it time?", "Nog niet", "Upgradecheck" and B2 answers |
| 23 Sep 2026 | Chrome Web Store, Firefox Add-ons and web search for name candidates | No store match for "Upgraditch", "Upgritch", "Itchometer", "Ripe", "Upgradewijzer"; "Upgraditis" is existing slang (Urban Dictionary); "Techtation" is a Stuttgart party brand; "Second Look" (Chrome, "A pause between impulse and intent.") and "Daily Driver" are taken | strong | RQ3, name | Working name "Upgraditch"; say it to 3 people in B3 and ask them to type it; add Second Look to the adjacent products |
| 22 Sep 2026 | Tweakers forum: Apple event Sep 2026, Pixel 10 and 11 topics, buying advice | Urge words: upgradedrang, hebberig, "omdat het kan", "moet wel ergens op slaan"; asking permission ("mag nu wél vervangen"); triggers: launches, contract end, trade-in, launch offers, videos | moderate | RQ1, RQ3 | Places added to B1; store wording drafted; B2 question 3 extended |
| 22 Sep 2026 | Tweakers forum | The urge is voiced on gathering.tweakers.net, which a `tweakers.net/*` permission does not cover | moderate | RQ1 | Candidate trigger site; decide at Checkpoint A |
| 22 Sep 2026 | Moe 2003 (search summary) | Browsing without intent is a common enjoyable activity; no evidence found on whether interrupting it annoys | weak | RQ4 | Compare dismiss rates by page type in B4 |
| 22 Sep 2026 | Reddit, 23 threads (2017 to 2024) | People describe the alibi themselves ("find reasons why I 'need' the new version"); a buyer who felt their phone was slow found it "almost the same" in a side-by-side test afterwards; want felt permanent in the moment and faded within weeks | moderate | A9, A4, RQ2 | None; supports the battery check and the start rating at cooldown end |
| 22 Sep 2026 | Reddit, r/GooglePixel launch threads | Trade-in values and pre-order gifts decide upgrades as much as features; a trade-in offer can be read as "the most that phone will ever be worth" | moderate | A3, RQ2 | B3 watches how the cost line is read; rewording rule added |
| 22 Sep 2026 | Reddit, update threads | Security updates are the most accepted reason to replace, but people confuse them with new Android versions; the phone often ends when banking, ID or work apps stop | moderate | A9, need test | Applied: "Security updates until" wording and an app question in the need test |
| 22 Sep 2026 | Reddit, restraint threads | Unprompted tactics: make the old phone feel new, re-watch its launch review, hours of work, wait rules, a friend to convince, unfollowing tech media | weak | A8, RQ3 | Applied: "Make it feel new" after a keep result (Stage 1) and in the P6 care quests |
| 22 Sep 2026 | Reddit, channel check | Tech-restraint posts get most response in r/minimalism and r/Anticonsumption; r/BuyItForLife regulars are tired of phone questions; enthusiasts push back on being told off | weak | RQ3, adoption | Channel order changed; posts lead with the story, not the tool |
| 22 Sep 2026 | StatCounter (Aug 2026), Firefox Add-ons API, MDN | Firefox has 6.7% of Dutch desktop and 1.6% of Dutch mobile browsing; one sec has 2,239 Firefox users against 30,000 on Chrome, desktop only. Firefox Add-ons requires new add-ons to declare their data collection (since 3 Nov 2025) | strong | adoption, build | Firefox desktop from build weekend 1; Firefox for Android out of Stage 1; ask recruits which browser they use |

## Sources

Checked on 22 Sep 2026. Read in full, or in full for the relevant chapters: Moser 2020 (chapters 4 and 5, the delay and reflection experiments), Grüning et al. 2023, Makov & Fitzpatrick 2021, Corrocher & Paganuzzi 2025, and the survey results in Moser et al. 2019. Blanken et al. 2015, Kuper & Bott 2018 and Moe 2003 were seen only through search-result summaries. All other sources were checked against the abstract or the publisher page.

- Anderson, Kirwan, Jenkins, Eargle, Howard & Vance (2015). [How polymorphic warnings reduce habituation in the brain: insights from an fMRI study](https://dl.acm.org/doi/10.1145/2702123.2702322). CHI 2015
- Baumel, Muench, Edan & Kane (2019). [Objective user engagement with mental health apps](https://www.jmir.org/2019/9/e14567/). Journal of Medical Internet Research 21(9)
- Blanken, van de Ven & Zeelenberg (2015). [A meta-analytic review of moral licensing](https://journals.sagepub.com/doi/10.1177/0146167215572134). Personality and Social Psychology Bulletin 41(4)
- Corrocher & Paganuzzi (2025). [Planned obsolescence and smartphone replacement: empirical evidence on the Italian market](https://www.sciencedirect.com/science/article/pii/S0308596125001193). Telecommunications Policy 49(8)
- Dai, Milkman & Riis (2014). [The fresh start effect: temporal landmarks motivate aspirational behavior](https://pubsonline.informs.org/doi/10.1287/mnsc.2014.1901). Management Science 60(10)
- Gollwitzer & Sheeran (2006). [Implementation intentions and goal achievement: a meta-analysis of effects and processes](https://kops.uni-konstanz.de/handle/123456789/10973). Advances in Experimental Social Psychology 38
- Gourville (1998). [Pennies-a-day: the effect of temporal reframing on transaction evaluation](https://academic.oup.com/jcr/article-abstract/24/4/395/1797969). Journal of Consumer Research 24(4)
- Grüning et al. (2023). [Directing smartphone use through the self-nudge app one sec](https://www.pnas.org/doi/abs/10.1073/pnas.2213114120). PNAS 120(8)
- Khan & Dhar (2006). [Licensing effect in consumer choice](https://journals.sagepub.com/doi/10.1509/jmkr.43.2.259). Journal of Marketing Research 43(2)
- Klasnja et al. (2015). [Microrandomized trials: an experimental design for developing just-in-time adaptive interventions](https://pubmed.ncbi.nlm.nih.gov/26651463/). Health Psychology 34(S)
- Kuper & Bott (2018). [Has the evidence for moral licensing been inflated by publication bias?](https://doi.org/10.31234/osf.io/93q5j) PsyArXiv preprint
- Kumar, Killingsworth & Gilovich (2014). [Waiting for Merlot: anticipatory consumption of experiential and material purchases](https://journals.sagepub.com/doi/abs/10.1177/0956797614546556). Psychological Science
- Loewenstein (2005). [Hot-cold empathy gaps and medical decision making](https://pubmed.ncbi.nlm.nih.gov/16045419/). Health Psychology 24(4)
- Lyngs et al. (2019). [Self-control in cyberspace: applying dual systems theory to a review of digital self-control tools](https://arxiv.org/abs/1902.00157). CHI 2019
- Makov & Fitzpatrick (2021). [Is repairability enough? Big data insights into smartphone obsolescence and consumer interest in repair](https://www.sciencedirect.com/science/article/pii/S0959652621017790). Journal of Cleaner Production 313
- Meyvis, Ratner & Levav (2010). [Why don't we learn to accurately forecast feelings?](https://pubmed.ncbi.nlm.nih.gov/20853995/) Journal of Experimental Psychology: General
- Michie, Abraham, Whittington, McAteer & Gupta (2009). [Effective techniques in healthy eating and physical activity interventions: a meta-regression](https://doi.org/10.1037/a0016136). Health Psychology 28(6)
- Moe (2003). [Buying, searching, or browsing: differentiating between online shoppers using in-store navigational clickstream](https://doi.org/10.1207/153276603768344762). Journal of Consumer Psychology 13(1–2)
- Moesta (2020). Demand-Side Sales 101. Source of the forces-of-progress interview frame
- Moser, Schoenebeck & Resnick (2019). [Impulse buying: design practices and consumer needs](https://dl.acm.org/doi/10.1145/3290605.3300472). CHI 2019. Survey of 151 US online impulse buyers, 86% women, mostly buying clothing and household items
- Moser (2020). [Impulse buying: designing for self-control with e-commerce](https://deepblue.lib.umich.edu/handle/2027.42/155212). PhD dissertation, University of Michigan. Studies 3 to 5: US students and Prolific panel, products of $2 to $20
- Oraee, Pohl, Geurts & Reichel (2024). [Overcoming premature smartphone obsolescence amongst young adults](https://www.sciencedirect.com/science/article/pii/S266678432400007X). Cleaner and Responsible Consumption
- Wieser & Tröger (2018). [Exploring the inner loops of the circular economy: replacement, repair, and reuse of mobile phones in Austria](https://www.sciencedirect.com/science/article/abs/pii/S0959652617327798). Journal of Cleaner Production 172

Adoption scan (A10), checked 22 Sep 2026:

- Chrome Web Store searches: "impulse shopping", "impulse buying", "mindful shopping", "think before you buy", "phone upgrade", "phone lifespan", "one sec", and the name candidates; [one sec reviews](https://chromewebstore.google.com/detail/one-sec-website-blocker-s/femnahohginddofgekknfmaklcbpinkn/reviews)
- Firefox Add-ons searches: "impulse shopping", "impulse buying"; [one sec on Firefox Add-ons](https://addons.mozilla.org/firefox/addon/one-sec/) (2,239 users)
- Browser shares, Netherlands, August 2026: StatCounter [desktop](https://gs.statcounter.com/browser-market-share/desktop/netherlands) and [mobile](https://gs.statcounter.com/browser-market-share/mobile/netherlands)
- [MDN: `browser_specific_settings`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings), for the Firefox Add-ons data-collection declaration
- Tweakers forum: [Apple event, 9 Sep 2026](https://gathering.tweakers.net/forum/list_messages/2343722), [Pixel 11 topic](https://gathering.tweakers.net/forum/list_messages/2332002), [Pixel 10 topic](https://gathering.tweakers.net/forum/list_messages/2305880), [iPhone Air topic](https://gathering.tweakers.net/forum/list_messages/2311236), [buying advice: a high-end phone for the long term](https://gathering.tweakers.net/forum/list_messages/2211716)
- Reddit, read with the top 25 comments per thread and up to 3 replies each:
  - r/nobuy: [I almost upgraded my phone today](https://www.reddit.com/r/nobuy/comments/su77ah/), [mentally tough to escape buying an iPhone](https://www.reddit.com/r/nobuy/comments/mgo07p/), [approved list for a low buy](https://www.reddit.com/r/nobuy/comments/saifvd/), [what does compulsive buying feel like?](https://www.reddit.com/r/nobuy/comments/ee3oqq/)
  - r/BuyItForLife: [no smartphone is truly BIFL](https://www.reddit.com/r/BuyItForLife/comments/17q2s9v/), [there's no BIFL smartphone, then what?](https://www.reddit.com/r/BuyItForLife/comments/1bvjfqy/), [longest lasting phones](https://www.reddit.com/r/BuyItForLife/comments/bhxmue/), [a phone that can last 10 years](https://www.reddit.com/r/BuyItForLife/comments/19aybxd/), [long update support](https://www.reddit.com/r/BuyItForLife/comments/lirytb/)
  - r/GooglePixel: [Pixel 3XL owner, have the itch](https://www.reddit.com/r/GooglePixel/comments/13vrirq/), [skipping the Pixel 9 line](https://www.reddit.com/r/GooglePixel/comments/1drc02p/), [Pixel 7 Pro owners, are y'all upgrading?](https://www.reddit.com/r/GooglePixel/comments/1734b0g/), [any reason to upgrade from a Pixel 6?](https://www.reddit.com/r/GooglePixel/comments/172bqj4/) (post deleted, replies remain), [after guaranteed Android version updates](https://www.reddit.com/r/GooglePixel/comments/1bktjvo/), [a phone without security updates](https://www.reddit.com/r/GooglePixel/comments/14mha3b/)
  - Elsewhere: r/minimalism [stop craving the latest tech](https://www.reddit.com/r/minimalism/comments/gfuix8/) and [the trap of smartphone upgrades](https://www.reddit.com/r/minimalism/comments/r1pe3e/); r/Anticonsumption [fight the urge to buy the newest tech](https://www.reddit.com/r/Anticonsumption/comments/wx31c2/) and [how often do you buy a new phone?](https://www.reddit.com/r/Anticonsumption/comments/u0475y/); r/shoppingaddiction [the need to buy new electronics](https://www.reddit.com/r/shoppingaddiction/comments/p6tlq8/); r/Android [stop upgrading every year](https://www.reddit.com/r/Android/comments/5my9gb/); r/iphone [rocking an old iPhone](https://www.reddit.com/r/iphone/comments/f4ptr4/) and [pointless to upgrade?](https://www.reddit.com/r/iphone/comments/tdftx6/)
