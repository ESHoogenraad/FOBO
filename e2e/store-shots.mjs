// Store screenshots at 1280x800, written to store/screenshots/ (see store/listing.md):
// the bar and its card on a live Tweakers phone page, the popup, a need test result, and
// onboarding step 1. The extension pages are drawn centred on a dark canvas.
//
//   node store-shots.mjs

import fs from 'node:fs';
import path from 'node:path';
import { acceptConsent, launchChrome, log, makeTestBuild, root, SAMPLE_PHONE } from './lib.mjs';

const dest = path.join(root, 'store/screenshots');
fs.mkdirSync(dest, { recursive: true });
const ext = makeTestBuild('store-shots', { grantSites: true, openShadow: true });
const { ctx, sw, id } = await launchChrome(ext, { liveSites: true, viewport: { width: 1280, height: 800 } });

try {
  // Onboarding step 1, filled in
  const onb = ctx.pages().find((p) => p.url().includes('onboarding')) ?? (await ctx.waitForEvent('page'));
  await onb.waitForSelector('#phone-name');
  await onb.fill('#phone-name', 'Pixel 7 Pro');
  await onb.waitForFunction(() => document.querySelector('.eol-found')?.textContent, null, { timeout: 15000 });
  await onb.selectOption('#purchase-month', { label: 'October' });
  await onb.selectOption('#purchase-year', '2022');
  await onb.fill('#price', '899');
  await onb.screenshot({ path: path.join(dest, '5-onboarding.png') });
  await onb.close();

  await sw.evaluate(async (phone) => {
    // The first-run tour would cover the page in the screenshots.
    await chrome.storage.sync.set({ devices: [phone], settings: { barTourDone: true } });
    const day = (offset) => new Date(Date.now() + offset * 864e5);
    await chrome.storage.local.set({
      'cooldown:a': { id: 'a', item: 'Pixel 11 Pro', price: 1099, startedAt: day(-2).toISOString(), days: 7, endsOn: day(5).toISOString().slice(0, 10), wantRating: 8 },
    });
  }, SAMPLE_PHONE);

  // The bar and the card. Reload until the headline is the own-rule one, which shows best what it does.
  const page = await ctx.newPage();
  const url = 'https://tweakers.net/pricewatch/2254442/apple-iphone-17-pro-256gb-opslag-blauw.html';
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await acceptConsent(page);
  for (let i = 0; i < 12; i++) {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(1200);
    if (/You said/.test(await page.locator('phone-check-bar .bar-headline').innerText().catch(() => ''))) break;
  }
  await page.screenshot({ path: path.join(dest, '1-bar.png') });
  await page.locator('phone-check-bar .bar-toggle').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(dest, '2-card.png') });

  const framed = async (file, act) => {
    const p = await ctx.newPage();
    await p.goto(`chrome-extension://${id}/popup/popup.html`);
    await p.waitForSelector('main');
    if (act) await act(p);
    await p.addStyleTag({
      content: 'html{background:#16161E;min-height:100%} body{margin:24px auto !important;zoom:1.25;border:1px solid #292E42;border-radius:16px;overflow:hidden}',
    });
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(dest, file) });
    await p.close();
  };
  await framed('3-popup.png');
  await framed('4-need-test.png', async (p) => {
    await p.getByRole('button', { name: 'Run the need test' }).click();
    await p.getByRole('radio', { name: 'Yes' }).check();
    await p.fill('#need-battery', '78');
    await p.getByRole('button', { name: 'See the result' }).click();
    await p.waitForSelector('.need-verdict');
  });
  log('written:', fs.readdirSync(dest).join(', '));
} finally {
  await ctx.close();
}
