// Shared set-up for the browser checks: where the browsers are, a test copy of dist/, and
// launching Chrome for Testing with the extension loaded.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';

export const here = path.dirname(new URL(import.meta.url).pathname);
export const root = path.join(here, '..');
export const out = path.join(here, 'out');
fs.mkdirSync(out, { recursive: true });

export const log = (...args) => console.log(...args);
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Shops serve a bot page to the default headless user agent.
export const NORMAL_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

function newest(dir, pattern, rest) {
  if (!fs.existsSync(dir)) return null;
  const match = fs.readdirSync(dir).filter((name) => pattern.test(name)).sort().at(-1);
  const file = match && path.join(dir, match, ...rest);
  return file && fs.existsSync(file) ? file : null;
}

/** Chrome for Testing, as installed by `npm run browsers`. Branded Chrome ignores --load-extension. */
export function chromePath() {
  const file = process.env.CHROME_PATH ?? newest(path.join(os.homedir(), '.cache/ms-playwright'), /^chromium-\d+$/, ['chrome-linux64', 'chrome']);
  if (!file) throw new Error('No Chrome for Testing: run `npm run browsers` in e2e/, or set CHROME_PATH');
  return file;
}

/** Firefox, as downloaded by `npm run browsers` into e2e/browsers/. */
export function firefoxPath() {
  const file = process.env.FIREFOX_PATH ?? newest(path.join(here, 'browsers/firefox'), /^linux-/, ['firefox', 'firefox']);
  if (!file) throw new Error('No Firefox: run `npm run browsers` in e2e/, or set FIREFOX_PATH');
  return file;
}

/**
 * A copy of dist/ in e2e/.build/<name>, patched for testing. The shipped build is never touched.
 *   grantSites    the default sites as host_permissions, so the bar works without the prompt
 *                 (headless Chrome never shows it)
 *   openShadow    the bar's shadow root open, so a script can click inside it
 *   endpoint      the counts endpoint (the build inlines COUNTS_ENDPOINT as `endpoint = ""`)
 *   fastUpload    the upload alarm every 6 seconds instead of every hour
 *   closeToPopup  onboarding's Close button opens the popup page: Firefox refuses to navigate
 *                 to extension pages or run scripts in them, so this is the way in
 *   zip           also write <name>.zip, for Firefox
 */
export function makeTestBuild(name, { grantSites, openShadow, endpoint, fastUpload, closeToPopup, zip } = {}) {
  const dist = path.join(root, 'dist');
  if (!fs.existsSync(path.join(dist, 'manifest.json'))) throw new Error('No dist/: run `npm run build` first');
  const dir = path.join(here, '.build', name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.cpSync(dist, dir, { recursive: true });

  const patch = (file, from, to) => {
    const full = path.join(dir, file);
    const text = fs.readFileSync(full, 'utf8');
    if (!text.includes(from)) throw new Error(`Test build: "${from}" not found in ${file}`);
    fs.writeFileSync(full, text.replace(from, to));
  };

  if (grantSites) {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    manifest.host_permissions = manifest.optional_host_permissions.filter((origin) => !origin.includes('gathering'));
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  }
  if (openShadow) patch('content/bar.js', 'mode: "closed"', 'mode: "open"');
  if (endpoint) {
    const chunk = fs.readdirSync(path.join(dir, 'chunks')).find((file) =>
      fs.readFileSync(path.join(dir, 'chunks', file), 'utf8').includes('endpoint = ""'),
    );
    patch(`chunks/${chunk}`, 'endpoint = ""', `endpoint = ${JSON.stringify(endpoint)}`);
  }
  if (fastUpload) patch('background/service-worker.js', 'upload: { periodInMinutes: 60 }', 'upload: { periodInMinutes: 0.1 }');
  if (closeToPopup) {
    const file = path.join(dir, 'onboarding/onboarding.js');
    const text = fs.readFileSync(file, 'utf8');
    const patched = text.replace(/async function closeThisTab\(\) \{[\s\S]*?\n\}/, 'async function closeThisTab() {\n\tlocation.href = "../popup/popup.html";\n}');
    if (patched === text) throw new Error('Test build: closeThisTab not found');
    fs.writeFileSync(file, patched);
  }
  if (zip) {
    const file = `${dir}.zip`;
    fs.rmSync(file, { force: true });
    execFileSync('zip', ['-qr', file, '.'], { cwd: dir });
  }
  return dir;
}

/** Chrome for Testing with `ext` loaded. Returns { ctx, sw, id }. */
export async function launchChrome(ext, { headless = !process.env.HEADED, liveSites = false, viewport, ...options } = {}) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'upgraditch-e2e-'));
  const ctx = await chromium.launchPersistentContext(profile, {
    headless,
    executablePath: chromePath(),
    locale: 'en-GB',
    viewport,
    ...(liveSites ? { userAgent: NORMAL_UA } : {}),
    ...options,
    args: [
      `--disable-extensions-except=${ext}`,
      `--load-extension=${ext}`,
      ...(liveSites ? ['--disable-blink-features=AutomationControlled'] : []),
    ],
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  return { ctx, sw, id: new URL(sw.url()).host };
}

/** Clicks a site's cookie consent button, if one shows. bol's is "Alles accepteren". */
export async function acceptConsent(page) {
  for (const name of ['Alles accepteren', 'Akkoord', 'Accepteren', 'Accept', 'Agree']) {
    const button = page.getByRole('button', { name, exact: true }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => {});
      await page.waitForTimeout(1500);
      return true;
    }
  }
  return false;
}

/** The phone most checks use: the HANDOFF sample device. */
export const SAMPLE_PHONE = {
  id: 'd1',
  category: 'phone',
  name: 'Pixel 7 Pro',
  purchaseDate: '2022-10-20',
  purchasePrice: 899,
  securityEndDate: '2027-10-01',
  eolLabel: 'Pixel 7 Pro',
  maintenance: [],
  reasons: ['battery', 'updates'],
  batteryHealthPct: 81,
};
