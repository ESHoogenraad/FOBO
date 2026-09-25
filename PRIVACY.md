# Privacy

Upgraditch has no account and no server of its own for your data. Everything it knows about you stays in your browser, except for the two things below.

## What stays in your browser

- Your phone: its name, purchase date, price, the reasons you would replace it, battery health if you enter it, and the end of its security updates.
- The urges you log (when and on which site), the cooldowns you start, and your need test results.
- Your settings: pause, sites switched off, milestones you have seen.
- A local log of what happened with the bar (which headline it showed, what you clicked), kept for 90 days.

Settings and your phone are stored in the browser's sync storage, so they follow you to your other browsers if you use browser sync. Everything else stays in this browser only. "Export all data" in the popup's settings downloads all of it as one file. Uninstalling removes it.

## Which pages Upgraditch looks at

Only pages on the sites you allow in the setup: Tweakers, GSMArena, Coolblue, bol and MediaMarkt. On those, it reads the page's web address and title to decide whether the page is about phones. It never reads anything else on the page, never looks at other sites, and never sends the pages you visit anywhere.

"This page tempted me" in the popup notes the site you are on (for example `www.example.com`), and only when you click it. That stays in your browser.

## What leaves your browser

1. **End of security updates.** Upgraditch asks [endoflife.date](https://endoflife.date) for the list of phones of your phone's brand (for example all Pixel phones) and finds your model in that list itself. Your phone's name is not sent. endoflife.date sees an ordinary web request from your browser.
2. **Anonymous counts, only if you switch them on.** They are off unless you tick "Send anonymous counts" in the setup or the popup. Upgraditch tries different wording in the bar to learn what helps. With the counts on, it sends, at most once an hour: which wording was shown, what you clicked, the kind of site (shop, spec site, price comparison), each urge you log with its tag, each cooldown's length, want ratings (1 to 10) and outcome, need test results (keep, repair or upgrade), setup steps, and pausing. Each count carries a random ID created on your device, a random ID of its own (so a count sent twice is stored once), the extension version, your browser (Chrome, Firefox and so on) and the number of whole days since you installed Upgraditch. It never contains your phone's name, notes, web addresses, dates or times. The server stores each count with the day it arrived, does not store IP addresses, and keeps no request logs. It uses your IP address only to refuse more than 10 uploads a minute from one address. That count lasts a minute and is not stored anywhere. Raw counts are deleted after the first study (Stage 1) is analysed; only totals are kept. Counts start when you switch them on: nothing recorded before that, or while they were off, is sent later. The only exception is the setup steps, if you switch the counts on during the setup. You can switch the counts off at any time in the popup. In Firefox, the browser also asks for your consent.

## Sharing your stats

"Share my stats" shows you a summary of counts and copies it to your clipboard. Nothing is sent: you decide where to paste it.

## Links

The need test can show links to iFixit, Repair Café and a YouTube search for your phone's review. They open only when you click them, like any link.

## Questions

Email e.s.hoogenraad@gmail.com, or open an issue in this project's repository.
