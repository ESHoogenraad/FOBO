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
