// The bar on the live sites in Chrome: for each page in bar-pages.json, is the bar there on
// phone pages and absent elsewhere, and how long after DOMContentLoaded did it appear
// (HANDOFF section 12: within 200 ms). With INTERACT=1 it also drives the bar on one bol page:
// card, Escape, Log urge.
//
//   node bar-live.mjs
//   HEADED=1 INTERACT=1 node bar-live.mjs

import fs from 'node:fs';
import path from 'node:path';
import { barScriptReady, dismissSiteDialogs, here, launchChrome, log, makeTestBuild, out, SAMPLE_PHONE } from './lib.mjs';

const ext = makeTestBuild('bar-live', { grantSites: true, openShadow: true });
const { ctx, sw } = await launchChrome(ext, { liveSites: true, viewport: { width: 1366, height: 860 } });

try {
  await sw.evaluate((phone) => chrome.storage.sync.set({ devices: [phone], settings: { barTourDone: true } }), SAMPLE_PHONE);
  await barScriptReady(sw);
  await ctx.addInitScript(() => {
    new MutationObserver((_, observer) => {
      if (document.querySelector('phone-check-bar')) {
        window.__barAt = performance.now();
        observer.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  });

  const pages = JSON.parse(fs.readFileSync(path.join(here, 'bar-pages.json'), 'utf8'));
  const consented = new Set();
  let wrong = 0;
  let failed = 0;
  for (const [url, expect] of pages) {
    // A fresh tab per page: ads sometimes redirect or close the tab they load in.
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      const host = new URL(url).host;
      if (!consented.has(host)) {
        consented.add(host);
        if ((await dismissSiteDialogs(page)) || page.url() !== url) await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      }
      await page.waitForTimeout(700);
      const r = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return { bar: Boolean(document.querySelector('phone-check-bar')), dcl: nav?.domContentLoadedEventStart, at: window.__barAt };
      });
      const delay = r.bar && r.at != null ? `${Math.round(r.at - r.dcl)} ms after DOMContentLoaded` : '';
      if (r.bar !== expect) wrong++;
      log(r.bar === expect ? 'ok ' : 'BAD', expect ? 'phone' : 'other', r.bar ? `bar ${delay}` : 'no bar', url);
    } catch (error) {
      failed++;
      log('ERR', url, error.message.split('\n')[0].slice(0, 160));
    } finally {
      await page.close().catch(() => {});
    }
  }
  log(`${pages.length - wrong - failed} right, ${wrong} wrong, ${failed} not loaded (run again for those)`);

  if (process.env.INTERACT) {
    const page = await ctx.newPage();
    await page.goto('https://www.bol.com/nl/nl/p/apple-iphone-17-256gb-zwart/9300000240171936/', { waitUntil: 'load' });
    // bol can ask again on a new tab; while its dialog is open, the bar's buttons are hidden
    // from role queries (see README, "Traps with the bar").
    await dismissSiteDialogs(page);
    await page.waitForTimeout(1000);
    const bar = page.locator('phone-check-bar');
    await bar.locator('.bar-toggle').click();
    log('card open:', await bar.locator('.card').isVisible(), '| aria-expanded:', await bar.locator('.bar-toggle').getAttribute('aria-expanded'));
    await page.screenshot({ path: path.join(out, 'bar-card.png') });
    await page.keyboard.press('Escape');
    log('card after Escape:', await bar.locator('.card').count());
    await bar.getByRole('button', { name: 'Log urge' }).click();
    log('after Log urge:', (await bar.locator('.card').innerText()).replace(/\s+/g, ' ').slice(0, 80));
  }
} finally {
  if (!process.env.KEEP) await ctx.close();
}
