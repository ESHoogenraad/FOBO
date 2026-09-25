// End of security updates, from endoflife.date (HANDOFF section 5, "End of life lookup").
//
// Only the brand's product list is fetched (https://endoflife.date/api/v1/products/pixel); the
// phone name the user typed is matched against its releases here, so it never leaves the
// browser. Responses are cached for 7 days in local storage. The API sends
// Access-Control-Allow-Origin: *, so no host permission is needed.
//
// endoflife.date's `eolFrom` is the end of security updates for every phone brand. `eoasFrom`,
// where present, is the end of new Android versions: never shown as "the updates date", because
// people mix the two up. The need test uses it only to explain the difference.

import browser from 'webextension-polyfill';

export const EOL_API = 'https://endoflife.date/api/v1/products/';
const CACHE_KEY = 'eolCache';
const CACHE_MS = 7 * 24 * 60 * 60 * 1000;

// Brand words in the phone name, and the endoflife.date product for each.
const PRODUCTS = [
  [/\biphone\b/, 'iphone'],
  [/\bpixel\b/, 'pixel'],
  [/\b(samsung|galaxy)\b/, 'samsung-mobile'],
  [/\boneplus\b/, 'oneplus'],
  [/\bfairphone\b/, 'fairphone'],
  [/\b(motorola|moto|razr)\b/, 'motorola-mobility'],
  [/\bnokia\b/, 'nokia'],
  [/\b(sony|xperia)\b/, 'sony-xperia'],
];

// Left out when comparing names: release labels include the brand for some products and not for
// others ("Pixel 7 Pro" but "15R" for the OnePlus 15R).
const BRAND_WORDS = new Set([
  'apple', 'iphone', 'google', 'pixel', 'samsung', 'galaxy', 'oneplus', 'fairphone',
  'motorola', 'moto', 'nokia', 'hmd', 'sony', 'xperia',
]);
// Words a model may carry or not ("Galaxy A15" is often sold as "Galaxy A15 5G").
const OPTIONAL_WORDS = new Set(['5g', '4g', 'lte']);

/** The endoflife.date product for a phone name, or null for brands it doesn't cover. */
export function productFor(name) {
  const lower = String(name).toLowerCase().replace(/\bone\s+plus\b/g, 'oneplus');
  return PRODUCTS.find(([pattern]) => pattern.test(lower))?.[1] ?? null;
}

/** "Samsung Galaxy S22+ 128GB" → ["s", "22", "plus"]; "Pixel 4a (5G)" → ["4", "a", "5g"] */
export function modelWords(name) {
  const words = String(name)
    .toLowerCase()
    .replace(/\bone\s+plus\b/g, 'oneplus')
    // The iPhone SE: endoflife.date says "SE (3rd generation)", people say "SE 2022".
    .replace(/\bse\s*\(?\s*(?:2016|1st generation)\s*\)?/g, 'se 1')
    .replace(/\bse\s*\(?\s*(?:2020|2nd generation)\s*\)?/g, 'se 2')
    .replace(/\bse\s*\(?\s*(?:2022|3rd generation)\s*\)?/g, 'se 3')
    .replace(/\+/g, ' plus ')
    .replace(/\b\d+\s?(gb|tb)\b/g, ' ') // storage size
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const result = [];
  for (const word of words) {
    if (BRAND_WORDS.has(word)) continue;
    if (OPTIONAL_WORDS.has(word)) result.push(word);
    // "s22" and "s 22", "flip7" and "flip 7" are the same model.
    else result.push(...word.split(/(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])/));
  }
  return result;
}

const same = (a, b) => a.length === b.length && a.every((word, i) => word === b[i]);
const withoutOptional = (words) => words.filter((word) => !OPTIONAL_WORDS.has(word));

/** The release that matches the phone name, or null. Exact first, then ignoring "5G" and the like. */
export function matchRelease(name, releases) {
  const words = modelWords(name);
  if (!words.length) return null;
  const exact = releases.find((release) => same(modelWords(release.label), words));
  if (exact) return exact;

  const core = withoutOptional(words);
  const loose = releases.filter((release) => same(withoutOptional(modelWords(release.label)), core));
  // Only when the candidates agree: "Galaxy A15" could be the 4G or the 5G model.
  const dates = new Set(loose.map((release) => release.eolFrom));
  return loose.length && dates.size === 1 ? loose[0] : null;
}

/** Keeps only what the lookup needs from the API response. */
export function trimProduct(json) {
  const result = json?.result;
  if (!Array.isArray(result?.releases)) throw new Error('Unexpected endoflife.date response');
  return {
    hasAndroidDates: Boolean(result.labels?.eoas),
    releases: result.releases.map(({ label, eolFrom, eoasFrom, isEol }) => ({
      label,
      eolFrom: eolFrom ?? null,
      eoasFrom: eoasFrom ?? null,
      isEol: Boolean(isEol),
    })),
  };
}

async function getProduct(slug, { fetchImpl = globalThis.fetch, now = Date.now() } = {}) {
  const { [CACHE_KEY]: cache = {} } = await browser.storage.local.get(CACHE_KEY);
  const cached = cache[slug];
  if (cached && now - cached.fetchedAt < CACHE_MS) return cached;
  try {
    const response = await fetchImpl(EOL_API + slug, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error(`endoflife.date answered ${response.status}`);
    const product = { ...trimProduct(await response.json()), fetchedAt: now };
    await browser.storage.local.set({ [CACHE_KEY]: { ...cache, [slug]: product } });
    return product;
  } catch (error) {
    if (cached) return cached; // offline: an older answer beats none
    throw error;
  }
}

/**
 * Looks up the end of security updates for a phone name. Resolves to one of:
 *   { status: 'found', product, label, securityEndDate, androidEndDate? }
 *   { status: 'noDate', product, label? }   known phone, no date announced (iPhones)
 *   { status: 'notFound', product }         brand covered, model not recognised
 *   { status: 'unknownBrand' }              brand not on endoflife.date
 *   { status: 'offline' }                   the lookup failed
 */
export async function lookupEol(name, options) {
  const product = productFor(name);
  if (!product) return { status: 'unknownBrand' };
  let data;
  try {
    data = await getProduct(product, options);
  } catch {
    return { status: 'offline' };
  }
  const release = matchRelease(name, data.releases);
  // Apple announces no end date, so an unrecognised iPhone gets the same answer as a recognised one.
  if (!release) return product === 'iphone' ? { status: 'noDate', product } : { status: 'notFound', product };
  if (!release.eolFrom) return { status: 'noDate', product, label: release.label };

  const result = { status: 'found', product, label: release.label, securityEndDate: release.eolFrom };
  if (data.hasAndroidDates && release.eoasFrom && release.eoasFrom < release.eolFrom) {
    result.androidEndDate = release.eoasFrom;
  }
  return result;
}

/** The device fields a lookup result sets. Offline, it sets none, and the old answer stays. */
export function eolFields(result) {
  if (result.status === 'found') {
    return { securityEndDate: result.securityEndDate, androidEndDate: result.androidEndDate ?? null, eolLabel: result.label };
  }
  if (result.status === 'offline') return {};
  return { securityEndDate: null, androidEndDate: null, eolLabel: result.label ?? null };
}
