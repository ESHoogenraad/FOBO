# B1 Diary kit

Everything needed to run the diary study in the research plan (section B1). Messages to participants are in Dutch, with English versions at the end for anyone who doesn't speak Dutch.

## Before you start

- Recruit 8 to 10 people. At most half from the pro-longevity communities (Groene Nerds, Turing Station); the rest from friends, colleagues and Tweakers. Note where each person came from
- Give everyone a code (P01, P02, ...) and keep the key between codes and names separate from the data
- One chat thread per person. Telegram can schedule the evening message; for Signal or WhatsApp, set yourself a daily reminder at 21:00
- Data goes in `research/data/`, which is set to stay out of git so it never reaches the public repo
- Run for 14 days per person. Write down the start dates: launch season pushes the numbers toward a ceiling

## 1. Recruitment message

> Hoi! Ik doe een klein onderzoek naar hoe en waar mensen bezig zijn met een nieuwe telefoon, ook als hun huidige het nog prima doet.
>
> Ik zoek mensen die hun huidige telefoon minstens 2 jaar hebben en zichzelf er weleens op betrappen dat ze naar nieuwe telefoons kijken.
>
> Wat het vraagt: twee weken lang stuur je me een kort berichtje als je merkt dat je naar telefoons kijkt (drie vragen, zo'n 20 seconden). Elke avond beantwoord je één vraag met ja of nee. Aan het eind volgen nog een paar vragen. Je hoeft niets te installeren en ik verkoop niets.
>
> Doe je mee? Laat het weten, dan stuur ik je de details.

Screening, as a reply to people who say yes:

> Leuk! Vijf korte vragen:
> 1. Welke telefoon heb je nu, en sinds wanneer?
> 2. Hoe vaak kijk je naar telefoons die je eigenlijk niet nodig hebt: nooit, soms of vaak?
> 3. Luister je naar Groene Nerds of Turing Station, of zit je in die community?
> 4. Waar zie je nieuwe telefoons meestal voorbijkomen?
> 5. Welke browser gebruik je op je laptop of computer?

Take people who have had their phone for 2 years or more and answer "soms" or "vaak". Use question 3 to keep the community half at 50% or less.

## 2. Consent, before day 1

> Even over wat ik bijhoud: je berichten in deze chat (waar je keek, wat het in gang zette en wat je daarna deed) en je antwoorden 's avonds. Ik bewaar ze op mijn eigen computer onder een nummer, niet onder je naam. Als ik iets citeer, is dat zonder naam. Je kunt altijd stoppen en vragen om alles te verwijderen, zonder uitleg.
>
> Akkoord? Stuur dan "akkoord", dan beginnen we morgen.

## 3. Start message, day 1

> We beginnen vandaag. Elke keer dat je merkt dat je naar telefoons kijkt (een review, een prijsvergelijker, een webshop, een video, een forum, een folder, een gesprek), stuur je me:
>
> 1. **Waar:** computer, telefoon, tablet, winkel of gesprek, en welke site of app?
> 2. **Wat zette het in gang?**
> 3. **Wat deed je daarna?**
>
> Voorbeeld: "Telefoon, YouTube. Review van de Pixel 11 in mijn aanbevelingen. Filmpje uitgekeken, daarna Tweakers Pricewatch geopend."
>
> Kort is prima, een spraakbericht mag ook. Elke avond om 21:00 stuur ik: "Vandaag verleid door een nieuwe telefoon? Ja of nee." Ook "nee" helpt me, dus stuur dat dan ook even.

## 4. Evening message, daily

> Vandaag verleid door een nieuwe telefoon? Ja of nee. (Ja, en nog niet gestuurd waar? Dan hoor ik het graag.)

## 5. Halfway, day 7

> Halverwege, dank je wel! Ook kleine momenten tellen, zoals even op een review klikken of een advertentie bekijken.

## 6. Closing questions, day 14

> Laatste dag! Nog vijf vragen, antwoord zo kort of lang als je wilt:
> 1. Wat viel je op aan je eigen berichten van de afgelopen twee weken?
> 2. Stel dat iets je hierbij had geholpen. Wat had je dan gewild: niet kopen, later kopen, het juiste kopen, minder kijken, of er minder mee bezig zijn?
> 3. Wanneer zou je zoiets gaan zoeken, en waar?
> 4. Hoe zou je dit noemen?
> 5. Heb je de afgelopen twee weken een telefoon gekocht of besteld?
>
> Heel erg bedankt voor het meedoen.

Questions 2 to 4 feed RQ3 (positioning, name, channels). Question 5 separates looking from buying.

## 7. Coding the messages

Copy each message into `research/data/diary-log.csv`, one row per temptation:

| Column | Values |
| --- | --- |
| participant | P01, P02, ... |
| date | YYYY-MM-DD |
| device | computer, phone, tablet, offline |
| channel | browser, shop_app, video, social, forum, offer, physical_shop, conversation, other |
| site | the website or app, as named: `tweakers.net` for Pricewatch and news, `gathering.tweakers.net` for the forum, `youtube`, `coolblue app` |
| trigger | what set it off, in a few words |
| next_action | what they did next, in a few words |

Use channel `forum` for forum and launch threads, and `offer` for a trade-in offer, a contract ending or a deal by mail or text. These are the two places added after the adoption scan.

Copy the evening answers into `research/data/diary-days.csv` with the columns `participant,date,tempted` (yes or no). Days without temptation matter: without them the rate comes out too high.

## 8. Tally and decision rules

```
python3 research/diary_tally.py research/data
```

It prints temptations per person per week, the share by place, the sites named and by how many people, and applies the three rules from the plan:

1. Median below 1 desktop-browser temptation per person per two weeks: the bar alone cannot carry Stage 1
2. More than 60% on the phone or in apps: bring Stage 2 forward
3. A site not on the default list named by 3 or more people: add it (only websites; an extension can't see apps)

A day counts as observed if the person answered the evening message or logged something that day. Rates are per observed day, so a missed evening doesn't count as a day without temptation.

## English versions

**Recruitment.** Hi! I'm doing a small study on how and where people think about getting a new phone, even when their current one works fine. I'm looking for people who have had their phone for at least 2 years and sometimes catch themselves looking at new ones. For two weeks you send me a short message whenever you notice you're looking at phones (three questions, about 20 seconds), and each evening you answer one yes-or-no question. A few questions at the end. Nothing to install, nothing to buy. Interested?

**Consent.** What I keep: your messages in this chat (where you looked, what set it off, what you did next) and your evening answers. I store them on my own computer under a number, not your name, and quote only without names. You can stop at any time and ask me to delete everything, no reason needed. OK? Reply "agreed" and we start tomorrow.

**Start.** Each time you notice you're looking at phones, send: 1. Where: computer, phone, tablet, shop or conversation, and which site or app? 2. What set it off? 3. What did you do next? Short is fine, voice messages too. Every evening at 21:00 I'll ask "Tempted by a new phone today? Yes or no." "No" helps too.

**Evening.** Tempted by a new phone today? Yes or no.

**Closing.** 1. What stood out in your own messages? 2. If something had helped, what would you have wanted: not buying, buying later, buying the right thing, looking less, or thinking about it less? 3. When and where would you look for something like that? 4. What would you call this? 5. Did you buy or order a phone in these two weeks?
