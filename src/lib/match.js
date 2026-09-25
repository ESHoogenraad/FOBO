// The one table of sites where Upgraditch may show up (F3, HANDOFF section 6), and the check
// whether a page on them is about phones.
//
// `origin` is the host permission pattern, `siteCategory` is what the counts carry instead of
// any URL (B4 spec). `pages` decides whether a page is about phones: the first entry whose
// `path` matches the URL's path decides. An entry without `title` means the URL is enough (a
// phone category); with `title`, the page title decides (a product page or a news article).
// When unsure, the answer is no: a bar on the wrong page costs more than a missed one, and
// "This page tempted me" catches the misses.
//
// URL structures and titles were checked on the live sites on 23 Sep 2026; tests/match.test.js
// keeps the examples.

// ---- Phone names

// Phone model names, by brand. Only the phone lines: "Pixel 11" matches, "Pixel Watch" doesn't,
// "Galaxy S26" matches, "Galaxy Tab S10" and "Galaxy Book5" don't.
const PHONE_MODEL = new RegExp(
  [
    'iphone',
    'galaxy ?(s|a|m|xcover|note) ?\\d',
    'galaxy ?z ?(fold|flip)',
    'pixel ?\\d',
    'pixel ?fold',
    'oneplus ?(\\d|nord|open)',
    'fairphone',
    'moto ?[ge] ?\\d',
    'motorola (moto|edge|razr|signature|thinkphone)',
    'razr',
    'nokia ?(g|c|x|xr)?\\d',
    'hmd \\w',
    'xperia',
    'xiaomi \\d{2}(t|\\b)',
    'redmi (note )?\\d',
    'poco [a-z]\\d',
    'oppo (find|reno|a\\d)',
    'honor (magic ?v?\\d|\\d{2,3}\\b|x\\d)',
    'huawei (pura|nova|p\\d|mate ?(x|\\d))',
    '(nothing|cmf) phone',
    'vivo [xvy]\\d',
    'realme (\\d|gt|narzo|[cp]\\d)',
    'zenfone',
    'rog phone',
    'doro \\d',
  ]
    .map((pattern) => `\\b${pattern}`)
    .join('|'),
  'i',
);

// Words that make a product something other than a phone: cases, chargers, spare parts, and the
// other devices that share a phone's name. Matched inside words too, for Dutch compounds like
// "telefoonhoesje" and "snellader".
const NOT_A_PHONE =
  /hoes|case\b|cover|bumper|protector|beschermglas|glass|gehard glas|lader|charger|kabel|cable|adapter|houder|holder|mount|standaard|stand\b|dock|powerbank|strap|bandje|koord|lanyard|wallet|portemonnee|lens|stylus|popsocket|grip\b|ring\b|skin\b|sticker|simkaart|sim-kaart|accu|batterij|battery|onderdeel|reparatie|repair|gereedschap|magsafe|oordopjes|earbuds|buds\b|koptelefoon|headset|speaker|watch|horloge|tablet|ipad|airpods|airtag|laptop|notebook|\btv\b|televisie/i;

// GSMArena lists watches and tablets with the same page layout as phones.
const NOT_A_PHONE_DEVICE = /\b(watch|tab|band|buds|tablet)\b|pad\b/i;

/**
 * A product name is a phone when it starts with a phone model (after at most two words, as in
 * "Apple iPhone 17" or "Refurbished Samsung Galaxy S23") and nothing marks it as an accessory.
 * "Spigen Ultra Hybrid iPhone 17" and "iPhone 17 hoesje" are not phones.
 */
export function isPhoneProduct(name) {
  const model = PHONE_MODEL.exec(name);
  if (!model) return false;
  const wordsBefore = name.slice(0, model.index).trim().split(/\s+/).filter(Boolean).length;
  return wordsBefore <= 2 && !NOT_A_PHONE.test(name);
}

/**
 * A news or review headline is about phones when it names a phone model anywhere.
 * Its accessory check is shorter than NOT_A_PHONE on purpose: headlines about phones often
 * mention the battery, a watch or a tablet alongside the phone.
 */
export function mentionsPhone(headline) {
  return PHONE_MODEL.test(headline) && !/hoes|case\b|cover|screenprotector|oplader|charger/i.test(headline);
}

// ---- Per-site title readers. Each returns what the page is about, or null.

/** A product page: `clean` turns the title into the product name. */
const product = (clean) => (title) => {
  const name = clean(title).trim();
  return isPhoneProduct(name) ? { item: name } : null;
};

/** A news or review page. There is no item to prefill a cooldown with. */
const article = (clean) => (title) => (mentionsPhone(clean(title)) ? { item: '' } : null);

// "Apple iPhone 17 512GB Zwart | Coolblue | Mobiele telefoons": Coolblue names its own
// category at the end, which is more reliable than guessing from the product name.
function coolblueProduct(title) {
  const parts = title.match(/^(.+) \| Coolblue \| (.+)$/);
  if (!parts || !/^(refurbished )?(mobiele telefoons|mobile phones)$/i.test(parts[2])) return null;
  return { item: parts[1].trim() };
}

// "Samsung Galaxy S26 Ultra - Full phone specifications"
function gsmarenaDevice(title) {
  const name = title.match(/^(.+) - Full phone specifications$/)?.[1];
  return name && !NOT_A_PHONE_DEVICE.test(name) ? { item: name } : null;
}

// ---- The site table

export const SITES = [
  {
    id: 'tweakers',
    label: 'Tweakers',
    host: 'tweakers.net',
    origin: 'https://tweakers.net/*',
    siteCategory: 'price_comparison',
    isDefault: true,
    pages: [
      // The smartphone category, its compare, deals, reviews and news lists.
      { path: /^\/smartphones\/((vergelijken|aanbod|reviews|nieuws)\/)?$/ },
      // A model's own pages: /smartphones/google/pixel-11_p1863868/vergelijken/
      { path: /^\/smartphones\/[^/]+\/[^/]+_p\d+\// },
      { path: /^\/best-buy-guide\/smartphones\// },
      // "Apple iPhone 17 Pro, 256GB opslag Blauw: beste prijzen, echte reviews en specificaties - Tweakers"
      { path: /^\/pricewatch\/\d+\//, title: product((t) => t.replace(/ - Tweakers$/, '').replace(/:[^:]*$/, '')) },
      // "'Google brengt Pixel 11 uit' - Tweakers"
      { path: /^\/(nieuws|reviews)\/\d+\//, title: article((t) => t.replace(/ - Tweakers$/, '')) },
    ],
  },
  {
    id: 'gsmarena',
    label: 'GSMArena',
    host: 'gsmarena.com',
    origin: 'https://www.gsmarena.com/*',
    siteCategory: 'specs',
    isDefault: true,
    pages: [
      // Every device page: /google_pixel_11-14000.php. Reviews and news use the same shape
      // (-review-3000.php), but their titles don't end in "Full phone specifications".
      { path: /^\/[a-z0-9_]+-\d+\.php$/, title: gsmarenaDevice },
    ],
  },
  {
    id: 'coolblue',
    label: 'Coolblue',
    host: 'coolblue.nl',
    origin: 'https://www.coolblue.nl/*',
    siteCategory: 'shop',
    isDefault: true,
    pages: [
      // /mobiele-telefoons, /mobiele-telefoons/smartphones/samsung/samsung-galaxy-s26-ultra, ...
      {
        path: /^\/(en\/)?(refurbished-)?(mobiele-telefoons|mobile-phones)(\/|$)/,
        unless: /hoes|accessoire|accessories|oplader|screenprotector/,
      },
      { path: /^\/(en\/)?product\/\d+\//, title: coolblueProduct },
    ],
  },
  {
    id: 'bol',
    label: 'bol',
    host: 'bol.com',
    origin: 'https://www.bol.com/*',
    siteCategory: 'shop',
    isDefault: true,
    pages: [
      // Category 4010 is Smartphones: /nl/nl/l/smartphones/4010/, /nl/nl/l/apple-iphones/4010/4294862300/
      { path: /^\/(nl|be)\/(nl|fr)\/l\/[^/]+\/4010[/+]/ },
      // "Apple iPhone 17 - 256GB - Black - 6,3 inch Super Retina XDR-display | bol"
      { path: /^\/(nl|be)\/(nl|fr)\/p\//, title: product((t) => t.replace(/ \| bol$/i, '')) },
    ],
  },
  {
    id: 'mediamarkt',
    label: 'MediaMarkt',
    host: 'mediamarkt.nl',
    origin: 'https://www.mediamarkt.nl/*',
    siteCategory: 'shop',
    isDefault: true,
    pages: [
      // /nl/category/smartphones-283.html, /nl/category/apple-iphone-931.html, but not
      // /nl/category/iphone-hoesjes-781.html or /nl/category/originele-iphone-accessoires-1493.html
      {
        path: /^\/nl\/category\/[a-z0-9-]*(smartphone|iphone|mobiele-telefoon)[a-z0-9-]*-\d+\.html$/,
        unless: /hoes|accessoire|oplader|screenprotector|houder|kabel/,
      },
      { path: /^\/nl\/list\/smartphone/ },
      // "GOOGLE Pixel 11 Pro Fold | 256 GB Olive kopen? | MediaMarkt"
      {
        path: /^\/nl\/product\//,
        title: product((t) => t.replace(/( kopen\?)? \| MediaMarkt$/, '').replace(' | ', ' ')),
      },
    ],
  },
  // Declared in the manifest; joins the default request only if Checkpoint A says so. Its pages
  // get patterns then.
  {
    id: 'tweakers-forum',
    label: 'Tweakers forum',
    host: 'gathering.tweakers.net',
    origin: 'https://gathering.tweakers.net/*',
    siteCategory: 'forum',
    isDefault: false,
    pages: [],
  },
];

export const DEFAULT_SITES = SITES.filter((site) => site.isDefault);

/** The origins asked for in the one permission prompt of onboarding step 3. */
export const DEFAULT_ORIGINS = DEFAULT_SITES.map((site) => site.origin);

/** The site-table entry for a host name, or null. "gathering.tweakers.net" is not "tweakers.net". */
export function siteForHost(hostname) {
  return SITES.find((site) => hostname === site.host || hostname === `www.${site.host}`) ?? null;
}

/**
 * Whether a page is about phones. Returns { site, item } or null, where `item` is the product
 * name to prefill a cooldown with ("" when the page is a category or an article).
 */
export function matchPage(url, title) {
  let parsed, path;
  try {
    parsed = new URL(url);
    path = decodeURIComponent(parsed.pathname).toLowerCase();
  } catch {
    return null;
  }
  const site = siteForHost(parsed.hostname);
  if (!site || parsed.protocol !== 'https:') return null;
  const page = site.pages.find((p) => p.path.test(path));
  if (!page || page.unless?.test(path)) return null;
  if (!page.title) return { site, item: '' };
  const found = page.title(title ?? '');
  return found && { site, ...found };
}

// ---- Is the page about the user's own model?

// Words that make a different model of the same line: a "Pixel 7" is not a "Pixel 7 Pro".
const VARIANTS = new Set(['pro', 'plus', '+', 'max', 'mini', 'ultra', 'lite', 'fe', 'xl', 'edge', 'fold', 'flip', 'neo', 'se', 'e', 'a', 's']);

// Brand names people may or may not type, and storage sizes: "Google Pixel 7 Pro 128GB".
const OPTIONAL_WORDS = /^(apple|samsung|google|motorola|sony|nokia|the|\d+(gb|tb))$/;

const words = (text) =>
  text
    .toLowerCase()
    .replace(/\+/g, ' + ')
    .split(/[^a-z0-9+]+/)
    .filter(Boolean);

/** Whether `text` (a product name or page title) is about the phone the user named. */
export function isOwnModel(deviceName, text) {
  const model = words(deviceName ?? '').filter((w) => !OPTIONAL_WORDS.test(w));
  if (!model.length || !text) return false;
  const page = words(text);
  for (let i = 0; i + model.length <= page.length; i++) {
    if (model.every((w, j) => page[i + j] === w) && !VARIANTS.has(page[i + model.length])) return true;
  }
  return false;
}

/** "www.coolblue.nl/product/123" -> "coolblue.nl", for the local urge log. Null for non-web pages. */
export function siteOf(url) {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== 'https:' && protocol !== 'http:') return null;
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
