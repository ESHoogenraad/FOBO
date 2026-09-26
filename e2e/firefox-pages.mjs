// The real flow in Firefox: onboarding, the one site prompt and the data consent (both granted
// automatically by a test pref), then the popup: need test, Share my stats, export. With
// ENDPOINT set, the counts upload to it. With LIVE=1, it then visits the pages in
// bar-pages.json and checks the bar is there on phone pages and nowhere else.
//
// Firefox refuses to navigate to extension pages or run scripts in them, so everything on
// them goes through the UI; the test build's Close button leads from onboarding to the popup.
//
//   node firefox-pages.mjs
//   ENDPOINT=http://127.0.0.1:8787/events LIVE=1 node firefox-pages.mjs

import fs from 'node:fs';
import path from 'node:path';
import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { firefoxPath, here, log, makeTestBuild, out } from './lib.mjs';

const endpoint = process.env.ENDPOINT;
const downloads = path.join(out, 'firefox-downloads');
fs.rmSync(downloads, { recursive: true, force: true });
fs.mkdirSync(downloads, { recursive: true });
const ext = makeTestBuild('firefox-pages', { endpoint, fastUpload: Boolean(endpoint), closeToPopup: true, openShadow: true, zip: true });

const options = new firefox.Options()
  .setBinary(firefoxPath())
  .windowSize({ width: 1000, height: 900 })
  .setPreference('extensions.webextOptionalPermissionPrompts', false)
  .setPreference('intl.locale.requested', 'en-GB')
  .setPreference('browser.download.folderList', 2)
  .setPreference('browser.download.dir', downloads)
  .setPreference('browser.download.useDownloadDir', true)
  .setPreference('browser.download.always_ask_before_handling_new_types', false)
  // The bar appears at DOMContentLoaded, so don't wait for every ad and tracker to load.
  .setPageLoadStrategy('eager');
if (!process.env.HEADED) options.addArguments('-headless');
const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build();
const $ = (css) => driver.findElement(By.css(css));
const button = (label) => driver.findElement(By.xpath(`//button[normalize-space()=${JSON.stringify(label)}]`));
const mainText = async () => (await $('main').getText()).replace(/\n+/g, ' | ');
const shot = async (name) => fs.writeFileSync(path.join(out, `firefox-${name}.png`), await driver.takeScreenshot(), 'base64');

await driver.manage().setTimeouts({ pageLoad: 45000 });

try {
  await driver.installAddon(`${ext}.zip`, true);
  await driver.sleep(1500);
  for (const handle of await driver.getAllWindowHandles()) {
    await driver.switchTo().window(handle);
    if ((await driver.getCurrentUrl()).includes('onboarding')) break;
  }

  // ---- Onboarding
  await driver.wait(until.elementLocated(By.css('#phone-name')), 5000);
  await $('#phone-name').sendKeys('Pixel 7 Pro');
  await driver.sleep(1500);
  log('lookup:', await $('.eol-found').getText());
  await $('#purchase-month').sendKeys('October');
  await $('#purchase-year').sendKeys('2022');
  await $('#price').sendKeys('899');
  await $('button[type=submit]').click();
  await driver.wait(until.elementLocated(By.css('.chip')), 5000);
  const chips = await driver.findElements(By.css('.chip'));
  await chips[0].click(); // Battery life
  await chips[1].click(); // Speed
  await $('.onb-actions .btn-primary').click();
  await driver.wait(until.elementLocated(By.css('.counts-box')), 5000);
  if (endpoint) {
    await $('.counts-box input').click(); // Firefox's data consent, granted by the test pref
    await driver.sleep(800);
  }
  await $('.onb-actions .btn-primary').click(); // Allow these sites
  await driver.sleep(1500);
  log('after allowing the sites:', await $('h1').getText());

  // ---- Popup (opened by the test build's Close button)
  await driver.manage().window().setRect({ width: 400, height: 800 });
  await button('Close').click();
  await driver.wait(until.elementLocated(By.css('.phone-card')), 5000);
  log('popup:', await mainText());

  await button('Run the need test').click();
  await driver.sleep(300);
  await $('input[name=need-apps]').click(); // the first radio: Yes
  await $('#need-battery').sendKeys('88');
  await button('See the result').click();
  await driver.sleep(500);
  log('need test:', await mainText());
  await shot('need');
  await button('Done').click();
  await driver.sleep(300);

  await driver.findElement(By.xpath("//footer//button[normalize-space()='Share my stats']")).click();
  await driver.sleep(600);
  log('share:', (await $('.share-json').getText()).replace(/\s+/g, ' ').slice(0, 160), '…');
  await button('Copy to clipboard').click();
  await driver.sleep(300);
  log('copy status:', await $('.share-json ~ .btn-primary').getText());
  await $('.pop-header .icon-btn').click(); // back
  await driver.sleep(300);

  await $('.pop-header .icon-btn').click(); // settings
  await driver.sleep(300);
  await button('Export all data').click();
  await driver.sleep(1500);
  const files = fs.readdirSync(downloads);
  log('export:', files, files[0] ? Object.keys(JSON.parse(fs.readFileSync(path.join(downloads, files[0]), 'utf8'))) : '');

  if (endpoint) {
    log('waiting for the upload alarm (every 6 s in the test build); check the rows with wrangler d1 execute');
    await driver.sleep(15000);
  }

  // ---- The bar on live pages
  if (process.env.LIVE) {
    await driver.manage().window().setRect({ width: 1366, height: 900 });
    const pages = JSON.parse(fs.readFileSync(path.join(here, 'bar-pages.json'), 'utf8'));
    const consented = new Set();
    for (const [url, expect] of pages) {
      try {
        await driver.get(url);
        const host = new URL(url).host;
        if (!consented.has(host)) {
          consented.add(host);
          await driver.sleep(1500);
          await driver.executeScript(() => {
            const b = [...document.querySelectorAll('button')].find((x) => /^(Alles accepteren|Akkoord|Accepteren|Accept|Agree)$/i.test(x.textContent.trim()));
            b?.click();
          });
          await driver.sleep(1500);
          await driver.get(url);
        }
        await driver.sleep(800);
        const bar = await driver.executeScript(() => Boolean(document.querySelector('phone-check-bar')));
        log(bar === expect ? 'ok ' : 'BAD', expect ? 'phone' : 'other', bar ? 'bar' : 'no bar', url);
      } catch (error) {
        log('ERR', url, error.message.split('\n')[0]);
      }
    }
  }
} finally {
  await driver.quit();
}
