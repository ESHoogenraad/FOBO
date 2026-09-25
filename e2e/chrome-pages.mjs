// The extension's own pages in Chrome: onboarding (with the endoflife.date lookup), then the
// popup: need test (repair, upgrade, keep), milestone and badge, day-14 stats prompt, Share my
// stats, export. With ENDPOINT set (a local `wrangler dev`, see worker/README.md), it also
// uploads the counts and checks they were sent.
//
//   node chrome-pages.mjs
//   ENDPOINT=http://127.0.0.1:8787/events node chrome-pages.mjs

import fs from 'node:fs';
import path from 'node:path';
import { launchChrome, log, makeTestBuild, out, sleep } from './lib.mjs';

const endpoint = process.env.ENDPOINT;
const ext = makeTestBuild('chrome-pages', { endpoint });
const { ctx, sw, id } = await launchChrome(ext, { acceptDownloads: true });
const text = async (locator) => (await locator.innerText()).replace(/\n+/g, ' | ');
const shot = (page, name) => page.screenshot({ path: path.join(out, `chrome-${name}.png`), fullPage: true });
const phone = async () => (await sw.evaluate(() => chrome.storage.sync.get('devices'))).devices[0];
const setPhone = (patch) =>
  sw.evaluate(async (fields) => {
    const { devices } = await chrome.storage.sync.get('devices');
    await chrome.storage.sync.set({ devices: [{ ...devices[0], ...fields }] });
  }, patch);

try {
  // ---- Onboarding
  const onb = ctx.pages().find((p) => p.url().includes('onboarding')) ?? (await ctx.waitForEvent('page'));
  await onb.waitForSelector('#phone-name');
  await onb.getByRole('button', { name: 'Continue' }).click();
  log('empty form errors:', (await onb.locator('.field-error').allInnerTexts()).join(' / '));
  for (const name of ['Xiaomi 13', 'Galaxy S22']) {
    await onb.fill('#phone-name', name);
    await sleep(150); // the hint clears on input; don't read the previous phone's line
    await onb.waitForFunction(() => document.querySelector('.eol-found')?.textContent, null, { timeout: 5000 }).catch(() => {});
    log(`lookup "${name}":`, (await onb.locator('.eol-found').innerText()) || '(nothing shown)');
  }
  await onb.selectOption('#purchase-month', { label: 'March' });
  await onb.selectOption('#purchase-year', '2022');
  await onb.fill('#price', '849');
  log('errors left after fixing:', await onb.locator('.field-error').count());
  await shot(onb, 'onboarding');
  await onb.getByRole('button', { name: 'Continue' }).click();
  await onb.waitForSelector('#reasons-title');
  for (const reason of ['Battery life', 'It feels slow', 'Updates ending']) await onb.getByRole('button', { name: reason }).click();
  await onb.getByRole('button', { name: 'Continue' }).click();
  await onb.waitForSelector('.counts-box');
  if (endpoint) await onb.locator('.counts-box input').check();
  const stored = await phone();
  log('phone stored:', stored.name, stored.purchaseDate, stored.purchasePrice, stored.securityEndDate, stored.androidEndDate, stored.eolLabel);

  // ---- Popup
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.setViewportSize({ width: 380, height: 600 });
  const popup = `chrome-extension://${id}/popup/popup.html`;
  await page.goto(popup);
  await page.waitForSelector('.phone-card');
  log('popup:', await text(page.locator('main')));
  await shot(page, 'popup');

  // Need test: the radios are invisible inputs over their labels, so check them by role.
  const needTest = async (answers, battery) => {
    await page.getByRole('button', { name: 'Run the need test' }).click();
    const groups = await page.locator('.choice').all();
    for (const [i, group] of groups.entries()) await group.getByRole('radio', { name: answers[i] ?? 'Yes' }).check();
    if (battery === null) await page.getByText("I don't know").click();
    else if (battery !== undefined) await page.fill('#need-battery', String(battery));
    await page.getByRole('button', { name: 'See the result' }).click();
    await page.waitForSelector('.need-verdict');
    return text(page.locator('main'));
  };
  log('need test, battery 76%:', await needTest(['Yes'], 76));
  await shot(page, 'need-repair');
  log('battery health saved:', (await phone()).batteryHealthPct);
  await page.getByRole('button', { name: 'Done' }).click();

  log('need test, apps blocked:', await needTest(['No'], null));
  await shot(page, 'need-upgrade');
  await page.getByRole('button', { name: /Pause .* for a week/ }).click();
  await page.waitForSelector('.need-done');
  log('paused until:', (await sw.evaluate(() => chrome.storage.sync.get('settings'))).settings.pausedUntil);
  await sw.evaluate(async () => {
    const { settings } = await chrome.storage.sync.get('settings');
    await chrome.storage.sync.set({ settings: { ...settings, pausedUntil: null } });
  });

  await setPhone({ reasons: ['camera'] });
  await page.goto(popup);
  log('need test, camera works:', await needTest(['Yes', 'Yes']));
  await shot(page, 'need-keep');

  // ---- Milestone: 2 years reached 3 days ago
  await sw.evaluate(async () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 2);
    date.setDate(date.getDate() - 3);
    const { devices } = await chrome.storage.sync.get('devices');
    await chrome.storage.sync.set({ devices: [{ ...devices[0], purchaseDate: date.toISOString().slice(0, 10) }] });
  });
  await sleep(400);
  log('badge with milestone:', JSON.stringify(await sw.evaluate(() => chrome.action.getBadgeText({}))));
  await page.goto(popup);
  await page.waitForSelector('.milestone');
  log('milestone:', await text(page.locator('.milestone')));
  await shot(page, 'milestone');
  await page.getByRole('button', { name: 'Got it' }).click();
  await page.waitForFunction(() => !document.querySelector('.milestone'));
  await sleep(400);
  log('badge after "Got it":', JSON.stringify(await sw.evaluate(() => chrome.action.getBadgeText({}))));

  // ---- Day 14: stats prompt, Share my stats
  await sw.evaluate(async () => {
    const { install } = await chrome.storage.local.get('install');
    await chrome.storage.local.set({ install: { ...install, installedAt: new Date(Date.now() - 15 * 864e5).toISOString() } });
  });
  await page.goto(popup);
  await page.waitForSelector('.phone-card');
  log('stats prompt shown:', await page.getByText('Two weeks in').count());
  await page.locator('.notice').getByRole('button', { name: 'Share my stats' }).click();
  await page.waitForSelector('.share-json');
  const shared = await page.locator('.share-json').innerText();
  log('share json:', shared.replace(/\s+/g, ' '));
  log('phone name in it:', shared.includes(stored.name));
  await shot(page, 'share');
  await page.getByRole('button', { name: 'Copy to clipboard' }).click();
  await sleep(300);
  log('copy status:', await page.locator('.share-status').innerText());
  await page.goto(popup);
  await page.waitForSelector('.phone-card');
  log('stats prompt after sharing:', await page.getByText('Two weeks in').count());

  // ---- Export
  await page.getByRole('button', { name: 'Settings' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export all data' }).click()]);
  const file = path.join(out, 'export.json');
  await download.saveAs(file);
  const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
  log('export:', download.suggestedFilename(), 'sync:', Object.keys(exported.sync), 'eolCache left out:', !('eolCache' in exported.local));

  // ---- Upload (only with ENDPOINT)
  if (endpoint) {
    await sw.evaluate(() => chrome.alarms.create('upload', { when: Date.now() + 200 }));
    await sleep(2500);
    const events = await sw.evaluate(async () =>
      Object.entries(await chrome.storage.local.get(null)).filter(([key]) => key.startsWith('ev:')).map(([, v]) => v),
    );
    log('events sent:', events.filter((e) => e.sent).length, 'of', events.length);
  }

  log('requests from the popup outside the extension:', [...new Set(requests.filter((u) => !u.startsWith('chrome-extension://')))].join(' ') || 'none');
  log(`screenshots in ${out}`);
} finally {
  await ctx.close();
}
