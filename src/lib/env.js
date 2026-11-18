import browser from 'webextension-polyfill';

// runtime.getBrowserInfo exists only in Firefox; the polyfill defines `browser` in Chrome too,
// so the namespace itself says nothing.
export const IS_FIREFOX = typeof browser.runtime.getBrowserInfo === 'function';

/** "chrome" | "edge" | "brave" | "firefox" | "other", for the counts (B4 spec). */
export async function detectBrowser() {
  if (IS_FIREFOX) return 'firefox';
  try {
    if (await globalThis.navigator?.brave?.isBrave?.()) return 'brave';
  } catch {
    // Not Brave.
  }
  const brands = (globalThis.navigator?.userAgentData?.brands ?? []).map((b) => b.brand);
  if (brands.includes('Brave')) return 'brave';
  if (brands.includes('Microsoft Edge')) return 'edge';
  if (brands.includes('Opera') || brands.includes('Vivaldi')) return 'other';
  if (brands.includes('Google Chrome') || brands.includes('Chromium')) return 'chrome';
  return 'other';
}

/**
 * Opens `url` in a new tab right after `tab` and as its child, so closing the new tab leads back.
 * Firefox for Android supports neither placement option and rejects the whole call for
 * `openerTabId`, so there the page opens in a plain new tab.
 */
export async function createTabBeside(url, tab) {
  if (tab) {
    try {
      return await browser.tabs.create({ url, index: tab.index + 1, openerTabId: tab.id });
    } catch {
      // Firefox for Android: fall through.
    }
  }
  return browser.tabs.create({ url });
}
