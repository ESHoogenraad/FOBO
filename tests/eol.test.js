import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eolFields, lookupEol, matchRelease, modelWords, productFor } from '../src/lib/eol.js';
import { resetBrowser } from './fake-browser.js';

// Trimmed from the live API, 23 Sep 2026.
const API = {
  pixel: {
    labels: { eol: 'Security Updates', eoas: 'Android Updates' },
    releases: [
      { label: 'Pixel 7a', eolFrom: '2028-05-01', eoasFrom: '2028-05-01', isEol: false },
      { label: 'Pixel 7 Pro', eolFrom: '2027-10-01', eoasFrom: '2027-10-01', isEol: false },
      { label: 'Pixel 7', eolFrom: '2027-10-01', eoasFrom: '2027-10-01', isEol: false },
      { label: 'Pixel 4a (5G)', eolFrom: '2023-11-05', eoasFrom: '2023-11-05', isEol: true },
      { label: 'Pixel', eolFrom: '2019-12-01', eoasFrom: '2019-12-01', isEol: true },
    ],
  },
  'samsung-mobile': {
    labels: { eol: 'Security Updates', eoas: 'Android Upgrades' },
    releases: [
      { label: 'Galaxy S22 Ultra', eolFrom: '2027-02-25', eoasFrom: '2026-02-25', isEol: false },
      { label: 'Galaxy S22+', eolFrom: '2027-02-25', eoasFrom: '2026-02-25', isEol: false },
      { label: 'Galaxy S22', eolFrom: '2027-02-25', eoasFrom: '2026-02-25', isEol: false },
      { label: 'Galaxy S21 5G', eolFrom: '2026-02-21', eoasFrom: '2025-10-06', isEol: false },
      { label: 'Galaxy Z Flip5', eolFrom: '2028-08-11', eoasFrom: '2027-08-11', isEol: false },
      { label: 'Galaxy A15 5G', eolFrom: '2028-12-11', eoasFrom: '2027-12-11', isEol: false },
      { label: 'Galaxy A15 LTE', eolFrom: '2028-11-01', eoasFrom: '2027-11-01', isEol: false },
    ],
  },
  oneplus: {
    labels: { eol: 'Security Updates', eoas: 'Android Updates' },
    releases: [
      { label: 'OnePlus 12', eolFrom: '2029-01-23', eoasFrom: '2028-01-23', isEol: false },
      { label: '12R', eolFrom: '2029-01-23', eoasFrom: '2028-01-23', isEol: false },
    ],
  },
  iphone: {
    labels: { eol: 'Supported' },
    releases: [
      { label: '13 Mini', eolFrom: null, isEol: false },
      { label: 'SE (3rd generation)', eolFrom: null, isEol: false },
      { label: 'XS', eolFrom: '2026-04-22', isEol: true },
    ],
  },
};

function fakeFetch() {
  return vi.fn(async (url) => {
    const slug = url.split('/').pop();
    if (!API[slug]) return { ok: false, status: 404 };
    return { ok: true, json: async () => ({ result: API[slug] }) };
  });
}

beforeEach(resetBrowser);

describe('the endoflife.date product for a phone name', () => {
  it.each([
    ['Pixel 7 Pro', 'pixel'],
    ['Samsung Galaxy S22', 'samsung-mobile'],
    ['One Plus 12', 'oneplus'],
    ['Moto G54', 'motorola-mobility'],
    ['Razr 40', 'motorola-mobility'],
    ['Sony Xperia 10 V', 'sony-xperia'],
    ['iPhone 13 mini', 'iphone'],
    ['Xiaomi 13', null],
  ])('%s → %s', (name, product) => {
    expect(productFor(name)).toBe(product);
  });
});

describe('matching a phone name to a release', () => {
  const releases = (slug) => API[slug].releases;

  it('splits models into comparable words', () => {
    expect(modelWords('Samsung Galaxy S22+ 128GB')).toEqual(['s', '22', 'plus']);
    expect(modelWords('Pixel 4a (5G)')).toEqual(['4', 'a', '5g']);
    expect(modelWords('Galaxy Z Flip 5')).toEqual(modelWords('Galaxy Z Flip5'));
  });

  it.each([
    ['Pixel 7 Pro', 'Pixel 7 Pro'],
    ['google pixel 7', 'Pixel 7'],
    ['Pixel 4a 5G', 'Pixel 4a (5G)'],
    ['Galaxy S22 Ultra 256GB', 'Galaxy S22 Ultra'],
    ['Galaxy S22 Plus', 'Galaxy S22+'],
    ['Galaxy S21', 'Galaxy S21 5G'],
    ['Galaxy Z Flip 5', 'Galaxy Z Flip5'],
  ])('%s → %s', (name, label) => {
    const slug = productFor(name);
    expect(matchRelease(name, releases(slug))?.label).toBe(label);
  });

  it('never matches a model to a longer or shorter one', () => {
    expect(matchRelease('Pixel 7', releases('pixel')).label).toBe('Pixel 7');
    expect(matchRelease('OnePlus 12', releases('oneplus')).label).toBe('OnePlus 12');
    expect(matchRelease('OnePlus Nord 3', releases('oneplus'))).toBeNull();
  });

  it('matches the brand alone to nothing', () => {
    expect(matchRelease('Pixel', releases('pixel').filter((r) => r.label !== 'Pixel'))).toBeNull();
    expect(matchRelease('Google', releases('pixel'))).toBeNull();
  });

  it("gives up when models that differ only by '5G' have different dates", () => {
    expect(matchRelease('Galaxy A15', releases('samsung-mobile'))).toBeNull();
    expect(matchRelease('Galaxy A15 5G', releases('samsung-mobile')).label).toBe('Galaxy A15 5G');
  });

  it('knows the iPhone SE by its year', () => {
    expect(matchRelease('iPhone SE 2022', releases('iphone')).label).toBe('SE (3rd generation)');
  });
});

describe('lookupEol', () => {
  it('gives the end of security updates, and the end of Android versions when earlier', async () => {
    const fetchImpl = fakeFetch();
    expect(await lookupEol('Galaxy S22', { fetchImpl })).toEqual({
      status: 'found',
      product: 'samsung-mobile',
      label: 'Galaxy S22',
      securityEndDate: '2027-02-25',
      androidEndDate: '2026-02-25',
    });
    expect(await lookupEol('Pixel 7 Pro', { fetchImpl })).toEqual({
      status: 'found',
      product: 'pixel',
      label: 'Pixel 7 Pro',
      securityEndDate: '2027-10-01',
    });
  });

  it('asks only for the brand, never for the phone name', async () => {
    const fetchImpl = fakeFetch();
    await lookupEol('Pixel 7 Pro', { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith('https://endoflife.date/api/v1/products/pixel', expect.anything());
  });

  it('caches a product for 7 days', async () => {
    const fetchImpl = fakeFetch();
    const now = Date.parse('2026-09-23T12:00:00Z');
    await lookupEol('Pixel 7', { fetchImpl, now });
    await lookupEol('Pixel 7a', { fetchImpl, now: now + 6 * 86_400_000 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await lookupEol('Pixel 7a', { fetchImpl, now: now + 8 * 86_400_000 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('uses an old answer when offline, and says so when it has none', async () => {
    const now = Date.parse('2026-09-23T12:00:00Z');
    await lookupEol('Pixel 7', { fetchImpl: fakeFetch(), now });
    const offline = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    expect((await lookupEol('Pixel 7', { fetchImpl: offline, now: now + 30 * 86_400_000 })).status).toBe('found');
    expect(await lookupEol('Galaxy S22', { fetchImpl: offline, now })).toEqual({ status: 'offline' });
  });

  it('gives up on a slow answer and says offline, so onboarding never waits long', async () => {
    // Never answers, as a stalled server would; it only fails when the request is aborted.
    const stalled = vi.fn((url, init) => new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal.reason))));
    expect(await lookupEol('Pixel 7', { fetchImpl: stalled, timeoutMs: 20 })).toEqual({ status: 'offline' });
  });

  it('has no date for a supported iPhone, recognised or not', async () => {
    const fetchImpl = fakeFetch();
    expect(await lookupEol('iPhone 13 mini', { fetchImpl })).toEqual({ status: 'noDate', product: 'iphone', label: '13 Mini' });
    expect(await lookupEol('iPhone 99', { fetchImpl })).toEqual({ status: 'noDate', product: 'iphone' });
    expect((await lookupEol('iPhone XS', { fetchImpl })).securityEndDate).toBe('2026-04-22');
  });

  it('says when it does not know the brand or the model', async () => {
    const fetchImpl = fakeFetch();
    expect(await lookupEol('Xiaomi 13', { fetchImpl })).toEqual({ status: 'unknownBrand' });
    expect(await lookupEol('OnePlus Nord 3', { fetchImpl })).toEqual({ status: 'notFound', product: 'oneplus' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('eolFields', () => {
  it('stores a date found by the lookup', () => {
    expect(eolFields({ status: 'found', label: 'Pixel 7 Pro', securityEndDate: '2027-10-01' })).toEqual({
      securityEndDate: '2027-10-01',
      androidEndDate: null,
      eolLabel: 'Pixel 7 Pro',
    });
  });

  it('keeps what is there when offline, and clears an old date when the phone has none', () => {
    expect(eolFields({ status: 'offline' })).toEqual({});
    expect(eolFields({ status: 'notFound' })).toEqual({ securityEndDate: null, androidEndDate: null, eolLabel: null });
  });
});
