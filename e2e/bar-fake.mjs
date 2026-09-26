// The bar on a stand-in shop page that this script serves itself: no live site, no network, the
// same result every run. First the layout at three window sizes (the bar in the bottom-left corner
// with the page's header free, the card right above the bar, inside the window, and the page
// still clickable beside it), the light bar on a dark page, then the behaviour: a filter keeps
// the showing, a new path starts one, editing the phone keeps the recorded headline, the bar
// comes back when the page clears <body>, an urge takes a tag, and hide stores hiddenUntil. Screenshots go to e2e/out/fake-*.png.
//
//   node bar-fake.mjs

import path from 'node:path';
import { barScriptReady, launchChrome, log, makeTestBuild, out, SAMPLE_PHONE, sleep } from './lib.mjs';

// A Coolblue phone category: the URL alone decides, so the title doesn't matter. The header
// must stay clickable while the bar shows, and the link beside the card too.
const PAGE = `<!doctype html><title>Smartphones | Coolblue</title>
<body style="margin:0;font:16px sans-serif;background:#eee">
<a id="header" href="#h" style="position:fixed;top:0;left:0;right:0;padding:10px;background:#036;color:#fff">site header</a>
<a id="beside" href="#b" style="position:fixed;top:300px;right:20px;padding:10px;background:#fc0">page link</a>
${'<p>page text</p>'.repeat(60)}</body>`;
const URL_CATEGORY = 'https://www.coolblue.nl/mobiele-telefoons';

// For the light bar: a dark page painted by a wrapper in oklch() while <body> stays transparent
// (as on most shops), and a light page dimmed by a cookie dialog's overlay, which doesn't count.
const DARK_PAGE = `<!doctype html><title>Smartphones | Coolblue</title>
<body style="margin:0;font:16px sans-serif;color:#ddd">
<div style="min-height:200vh;background:oklch(0.22 0.02 260)">${'<p>page text</p>'.repeat(60)}</div></body>`;
const DIMMED_PAGE = PAGE.replace('</body>', '<div style="position:fixed;inset:0;background:rgba(0,0,0,0.6)"></div></body>');
const PAGES = { dark: DARK_PAGE, dimmed: DIMMED_PAGE };

let bad = 0;
const ok = (cond, what) => {
  if (!cond) bad++;
  log(cond ? 'ok ' : 'BAD', what);
};

const ext = makeTestBuild('bar-fake', { grantSites: true, openShadow: true });
const { ctx, sw } = await launchChrome(ext, { viewport: { width: 1366, height: 800 } });
const errors = [];

try {
  await sw.evaluate((phone) => chrome.storage.sync.set({ devices: [phone], settings: { barTourDone: false } }), SAMPLE_PHONE);
  await barScriptReady(sw);
  await ctx.route('https://www.coolblue.nl/**', (route) => {
    const variant = new URL(route.request().url()).searchParams.get('page');
    route.fulfill({ contentType: 'text/html', body: PAGES[variant] ?? PAGE });
  });

  const page = await ctx.newPage();
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(String(error)));
  const bar = page.locator('phone-check-bar');
  // The host is 0x0 on purpose, so Playwright calls it hidden: wait for it to be attached.
  const open = async (url = URL_CATEGORY) => {
    await page.goto(url);
    await page.waitForSelector('phone-check-bar', { state: 'attached' });
  };
  const light = () => page.evaluate(() => document.querySelector('phone-check-bar').shadowRoot.querySelector('.root').classList.contains('theme-light'));
  const text = (selector) => page.evaluate((s) => document.querySelector('phone-check-bar')?.shadowRoot.querySelector(s)?.textContent ?? null, selector);
  const geometry = () =>
    page.evaluate(() => {
      const root = document.querySelector('phone-check-bar').shadowRoot;
      const box = (s) => root.querySelector(s)?.getBoundingClientRect().toJSON();
      const card = root.querySelector('.card');
      return {
        bar: box('.bar'),
        headline: box('.bar-headline'),
        chevron: box('.bar-toggle .chevron'),
        cooldown: box('.bar-cooldown'),
        hide: box('.bar-actions .icon-btn'),
        card: box('.card'),
        tour: box('.tour'),
        scrolls: card ? card.scrollHeight > card.clientHeight : null,
        beside: document.elementFromPoint(innerWidth - 40, 318)?.id,
        header: document.elementFromPoint(40, 20)?.id,
        height: innerHeight,
      };
    });
  const shot = (name) => page.screenshot({ path: path.join(out, `fake-${name}.png`) });

  // ---- The first-run tour, above the bar; Escape ends it for good.
  await open();
  await sleep(300);
  const tour = await geometry();
  ok(tour.tour && Math.round(tour.tour.bottom) === Math.round(tour.bar.top) - 12, 'tour tip right above the bar');
  await shot('tour');
  await page.keyboard.press('Escape');

  // ---- Layout: one row, two rows (below 720 px), and a window too short for the card.
  for (const [width, height] of [[1366, 800], [600, 800], [1366, 420]]) {
    const size = `${width}x${height}`;
    await page.setViewportSize({ width, height });
    await open();
    const shown = await geometry();
    ok(Math.round(shown.bar.bottom) === height - 8 && Math.round(shown.bar.left) === 8, `${size}: bar in the bottom-left corner (${Math.round(shown.bar.width)}x${Math.round(shown.bar.height)} px)`);
    ok(shown.header === 'header', `${size}: page header clickable`);
    // The headline wraps where the Cooldown button ends, and the chevron sits above the hide button.
    const middle = (b) => b.left + b.width / 2;
    ok(Math.abs(shown.headline.right - shown.cooldown.right) < 1, `${size}: headline ends with the Cooldown button (${(shown.headline.right - shown.cooldown.right).toFixed(1)} px)`);
    ok(Math.abs(middle(shown.chevron) - middle(shown.hide)) < 1, `${size}: chevron above the hide button (${(middle(shown.chevron) - middle(shown.hide)).toFixed(1)} px)`);
    await bar.locator('.bar-toggle').click();
    const rule = await geometry();
    ok(Math.round(rule.card.bottom) === Math.round(rule.bar.top) - 8, `${size}: card 8 px above the bar`);
    ok(rule.beside === 'beside', `${size}: page clickable beside the card`);
    await shot(`${size}-card`);
    await page.keyboard.press('Escape');
    await bar.getByRole('button', { name: 'Cooldown' }).click();
    const form = await geometry();
    ok(form.card.top >= 8 - 0.5, `${size}: cooldown form inside the window${form.scrolls ? ', scrolling' : ''}`);
    await shot(`${size}-cooldown`);
  }
  await page.setViewportSize({ width: 1366, height: 800 });

  // ---- Light or dark: the bar stands out from the page under it.
  await open();
  ok(!(await light()), 'dark bar on a light page');
  await open(`${URL_CATEGORY}?page=dimmed`);
  ok(!(await light()), 'dark bar on a light page under a dimmed overlay');
  await open(`${URL_CATEGORY}?page=dark`);
  ok(await light(), 'light bar on a dark page');
  await bar.locator('.bar-toggle').click();
  await shot('dark-page-card');
  await page.keyboard.press('Escape');
  await bar.getByRole('button', { name: 'Cooldown' }).click();
  await shot('dark-page-cooldown');
  await page.keyboard.press('Escape');

  // ---- Behaviour. Reload until the support headline shows: it is the one that needs the end
  // date, which the phone edit below takes away.
  const shownCount = () =>
    sw.evaluate(async () => Object.entries(await chrome.storage.local.get(null)).filter(([key, value]) => key.startsWith('ev:') && value.event === 'bar_shown').length);
  let headline = '';
  for (let i = 0; i < 40 && !headline.startsWith('Security updates'); i++) {
    await open();
    headline = await text('.bar-headline');
  }
  ok(headline.startsWith('Security updates'), `support headline: "${headline}"`);
  const shown = await shownCount();

  // A filter only changes the query string: the same showing, the same headline.
  await page.evaluate(() => history.pushState({}, '', '/mobiele-telefoons?sorteer=prijs'));
  await sleep(2500);
  ok((await text('.bar-headline')) === headline && (await shownCount()) === shown, 'a filter keeps the showing');

  // The phone edited meanwhile: end date and reasons gone, a new name.
  await sw.evaluate(async () => {
    const { devices } = await chrome.storage.sync.get('devices');
    await chrome.storage.sync.set({ devices: [{ ...devices[0], name: 'Pixel 7 Pro (edited)', securityEndDate: null, reasons: [] }] });
  });
  await sleep(800);
  ok((await text('.bar-headline')) === headline, 'the headline stays what bar_shown recorded');
  ok((await text('.bar-name')) === 'Pixel 7 Pro (edited)', 'the new name shows');
  await bar.locator('.bar-toggle').click();
  ok((await text('.card h2')) !== null, `the card still opens: "${await text('.card h2')}"`);
  await page.keyboard.press('Escape');

  // A new path is a new showing.
  await page.evaluate(() => history.pushState({}, '', '/mobiele-telefoons/smartphones'));
  await sleep(2500);
  ok((await shownCount()) === shown + 1, 'a new path starts a new showing');

  // Log urge, then a reason tag.
  await bar.getByRole('button', { name: 'Log urge' }).click();
  const logged = await text('.card .card-title');
  await bar.locator('.chip').first().click();
  await sleep(300);
  const urges = await sw.evaluate(async () => Object.entries(await chrome.storage.local.get(null)).filter(([key]) => key.startsWith('urge:')).map(([, value]) => value));
  ok(urges.length === 1 && urges[0].tag === 'camera' && (await text('.card .card-title')) !== logged, `urge logged and tagged (${urges[0]?.tag})`);

  // A page that re-renders itself after loading (Coolblue's Next.js pages clear <body>): the bar
  // comes back, with the same showing.
  await page.evaluate(() => document.body.replaceChildren(...[...document.body.children].filter((e) => e.localName !== 'phone-check-bar')));
  await page.evaluate(() => document.documentElement.replaceChild(document.createElement('body'), document.body));
  await sleep(300);
  ok((await text('.bar-headline')) !== null && (await shownCount()) === shown + 1, 'the bar comes back after the page clears or replaces <body>');

  // Hide: the bar goes, and the site is hidden without undoing the tour's setting.
  await bar.getByRole('button', { name: /hide/i }).click();
  await sleep(500);
  const settings = await sw.evaluate(async () => (await chrome.storage.sync.get('settings')).settings);
  ok((await page.$('phone-check-bar')) === null && Boolean(settings.hiddenUntil?.coolblue) && settings.barTourDone, 'hide stores hiddenUntil and keeps barTourDone');

  ok(errors.length === 0, `no errors in the page console${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  log(bad ? `${bad} BAD` : 'all ok');
  if (bad) process.exitCode = 1;
} finally {
  if (!process.env.KEEP) await ctx.close();
}
