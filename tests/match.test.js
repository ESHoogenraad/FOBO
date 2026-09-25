import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_ORIGINS, isOwnModel, isPhoneProduct, matchPage, siteForHost, SITES, siteOf } from '../src/lib/match.js';

const manifest = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'manifest.json'), 'utf8'));

describe('the site table', () => {
  it('matches the optional host permissions in the manifest exactly', () => {
    expect(SITES.map((site) => site.origin).sort()).toEqual([...manifest.optional_host_permissions].sort());
  });

  it('lets the bar load its fonts on exactly those sites', () => {
    const [fonts] = manifest.web_accessible_resources;
    expect([...fonts.matches].sort()).toEqual([...manifest.optional_host_permissions].sort());
  });

  it('asks for the five default sites, not the forum', () => {
    expect(DEFAULT_ORIGINS).toHaveLength(5);
    expect(DEFAULT_ORIGINS).not.toContain('https://gathering.tweakers.net/*');
  });

  it('never asks for broad host permissions', () => {
    const all = [...(manifest.host_permissions ?? []), ...manifest.optional_host_permissions];
    expect(all.filter((origin) => /<all_urls>|\*:\/\/\*|https?:\/\/\*\//.test(origin))).toEqual([]);
    expect(manifest.permissions).not.toContain('tabs');
    expect(manifest.permissions).not.toContain('notifications');
  });

  it('gives every site a category from the B4 spec', () => {
    for (const site of SITES) {
      expect(['price_comparison', 'specs', 'shop', 'forum']).toContain(site.siteCategory);
    }
  });
});

describe('siteOf', () => {
  it('keeps only the host, without www', () => {
    expect(siteOf('https://www.coolblue.nl/product/123?x=1')).toBe('coolblue.nl');
    expect(siteOf('https://tweakers.net/pricewatch/')).toBe('tweakers.net');
  });

  it('is null for pages that are not web pages', () => {
    expect(siteOf('chrome://newtab/')).toBeNull();
    expect(siteOf('about:blank')).toBeNull();
    expect(siteOf(undefined)).toBeNull();
  });
});

// Real URLs and titles from the live sites, 23 Sep 2026.
const PHONE_PAGES = [
  ['https://tweakers.net/smartphones/vergelijken/', 'Vergelijk smartphone-prijzen en deals - Tweakers'],
  ['https://tweakers.net/smartphones/google/pixel-11_p1863868/vergelijken/', 'Vergelijk Google Pixel 11-prijzen en deals - Tweakers'],
  ['https://tweakers.net/best-buy-guide/smartphones/', 'Smartphone Best Buy Guide: altijd actueel'],
  ['https://tweakers.net/pricewatch/2254442/apple-iphone-17-pro-256gb-opslag-blauw.html', 'Apple iPhone 17 Pro, 256GB opslag Blauw: beste prijzen, echte reviews en specificaties - Tweakers'],
  ['https://tweakers.net/nieuws/250000/google-brengt-pixel-11-uit.html', "'Google brengt Pixel 11 uit met grotere accu' - Tweakers"],
  ['https://www.gsmarena.com/samsung_galaxy_s26_ultra_5g-14320.php', 'Samsung Galaxy S26 Ultra - Full phone specifications'],
  ['https://www.gsmarena.com/honor_400_smart-14142.php', 'Honor 400 Smart 4G - Full phone specifications'],
  ['https://www.coolblue.nl/mobiele-telefoons', 'Telefoon kopen? | Coolblue - Voor 23.59u, morgen in huis'],
  ['https://www.coolblue.nl/mobiele-telefoons/smartphones/samsung/samsung-galaxy-s26-ultra', 'Samsung Galaxy S26 Ultra kopen? - Coolblue'],
  ['https://www.coolblue.nl/refurbished-mobiele-telefoons', 'Refurbished telefoon kopen? | Coolblue - Voor 23.59u, morgen in huis'],
  ['https://www.coolblue.nl/en/mobile-phones', 'Buy phone? | Coolblue - Before 23:59, delivered tomorrow'],
  ['https://www.coolblue.nl/product/969426/apple-iphone-17-512gb-zwart.html', 'Apple iPhone 17 512GB Zwart | Coolblue | Mobiele telefoons'],
  ['https://www.coolblue.nl/product/960182/refurbished-iphone-15-128gb-zwart-zo-goed-als-nieuw.html', 'Refurbished iPhone 15 128GB Zwart (Zo goed als nieuw) | Coolblue | Refurbished mobiele telefoons'],
  ['https://www.bol.com/nl/nl/l/smartphones/4010/', 'Smartphone kopen? Alle Smartphones online | bol'],
  ['https://www.bol.com/nl/nl/l/apple-iphones/4010/4294862300/', 'Apple iPhone kopen? Alle Apple iPhones online | bol'],
  ['https://www.bol.com/nl/nl/p/apple-iphone-17-256gb-zwart/9300000240171936/', 'Apple iPhone 17 - 256GB - Black - 6,3 inch Super Retina XDR-display | bol'],
  ['https://www.bol.com/nl/nl/p/the-fairphone-12gb-256gb-cobalt-blue/9300000309478864/', 'The Fairphone (Gen. 6+) - Smartphone - 12GB/256GB - Cobalt Blue | bol'],
  ['https://www.bol.com/nl/nl/p/samsung-sm-s942bzkgeub/9300000265030587/', 'Samsung Galaxy S26 - 256GB - Black | bol'],
  ['https://www.mediamarkt.nl/nl/category/smartphones-283.html', 'Smartphone kopen? Binnen 30 min afhalen of morgen bezorgd | MediaMarkt | Smartphones'],
  ['https://www.mediamarkt.nl/nl/category/apple-iphone-931.html', 'Apple iPhone kopen? Binnen 30 min afhalen of morgen bezorgd | MediaMarkt'],
  ['https://www.mediamarkt.nl/nl/product/_google-pixel-11-pro-fold-256-gb-olive-1908301.html', 'GOOGLE Pixel 11 Pro Fold | 256 GB Olive kopen? | MediaMarkt'],
];

const OTHER_PAGES = [
  // A news article about laptops, and a laptop that shares a phone's brand line.
  ['https://tweakers.net/nieuws/252522/microsoft-kondigt-op-7-oktober-mogelijk-ook-kleinere-laptop-met-rtx-spark-aan.html', "'Microsoft kondigt op 7 oktober mogelijk ook kleinere laptop met RTX Spark aan' - Tweakers"],
  ['https://tweakers.net/pricewatch/2236268/samsung-galaxy-book5-np750xhd-kd4nl.html', 'Samsung Galaxy Book5 NP750XHD-KD4NL: beste prijzen, echte reviews en specificaties - Tweakers'],
  ['https://tweakers.net/pricewatch/2323682/apple-iphone-17e-doorzichtig-hoesje-met-magsafe-transparant.html', 'Apple iPhone 17e Doorzichtig hoesje met MagSafe Transparant: beste prijzen, echte reviews en specificaties - Tweakers'],
  ['https://tweakers.net/laptops/vergelijken/', 'Vergelijk laptop-prijzen en deals - Tweakers'],
  ['https://tweakers.net/', 'Tweakers'],
  ['https://www.gsmarena.com/apple_watch_ultra_4-14935.php', 'Apple Watch Ultra 4 - Full phone specifications'],
  ['https://www.gsmarena.com/samsung_galaxy_tab_s11-14142.php', 'Samsung Galaxy Tab S11 - Full phone specifications'],
  ['https://www.gsmarena.com/google_pixel_11-review-3000.php', 'Google Pixel 11 review - GSMArena.com tests'],
  ['https://www.gsmarena.com/reviewcomm-3000.php', 'Google Pixel 11 review - comments'],
  ['https://www.gsmarena.com/samsung-phones-9.php', 'All Samsung phones'],
  // A kettle, and a case whose name starts like a phone.
  ['https://www.coolblue.nl/product/831109/bosch-twk7203-temperaturecontrol7.html', 'Bosch TWK7203 TemperatureControl7 | Coolblue | Waterkokers'],
  ['https://www.coolblue.nl/product/964494/bluebuilt-apple-iphone-17-book-case-leer-zwart.html', 'BlueBuilt Apple iPhone 17 Book Case Leer Zwart | Coolblue | Telefoonhoesjes'],
  ['https://www.coolblue.nl/waterkokers', 'Waterkoker kopen? | Coolblue - Voor 23.59u, morgen in huis'],
  ['https://www.bol.com/nl/nl/p/ledlenser-p7r-zaklamp/9300000234717257/', 'Ledlenser P7R - 2025 model - zaklamp - oplaadbaar - 2.000 lumen - 330 m - IP68 | bol'],
  ['https://www.bol.com/nl/nl/p/hoesje-geschikt-voor-iphone-17/9300000238952777/', 'Hoesje - Geschikt voor iPhone 17 - Zwart - Geschikt voor MagSafe - Slank - hoes -... | bol'],
  ['https://www.bol.com/nl/nl/l/waterkokers/15452/', 'Waterkokers kopen? | bol'],
  ['https://www.mediamarkt.nl/nl/category/iphone-hoesjes-781.html', 'iPhone-hoesje kopen? | MediaMarkt | iPhone-hoesjes'],
  ['https://www.mediamarkt.nl/nl/category/originele-iphone-accessoires-1493.html', 'Originele iPhone-accessoires | MediaMarkt'],
  ['https://www.mediamarkt.nl/nl/product/_puro-nude-grs-telefoonhoesje-voor-apple-iphone-17-pro-max-transparent-1888779.html', 'PURO Nude GRS MagSafe Telefoonhoesje voor Apple iPhone 17 Pro Max Transparent kopen? | MediaMarkt'],
  ['https://www.mediamarkt.nl/nl/product/_karcher-wv-1-plus-ruitenreiniger-wit-1869647.html', 'KARCHER WV 1 Plus Ruitenreiniger Wit kopen? | MediaMarkt'],
  // A phone page on a site that isn't in the table, or not over https.
  ['https://www.amazon.nl/dp/B0000000', 'Apple iPhone 17 256GB'],
  ['http://www.coolblue.nl/mobiele-telefoons', 'Telefoon kopen? | Coolblue'],
];

describe('matchPage', () => {
  it.each(PHONE_PAGES)('shows on %s', (url, title) => {
    expect(matchPage(url, title)).not.toBeNull();
  });

  it.each(OTHER_PAGES)('stays away from %s', (url, title) => {
    expect(matchPage(url, title)).toBeNull();
  });

  it('gives the site and the product name for a cooldown', () => {
    const match = matchPage(...PHONE_PAGES[3]);
    expect(match.site.id).toBe('tweakers');
    expect(match.item).toBe('Apple iPhone 17 Pro, 256GB opslag Blauw');
    expect(matchPage(PHONE_PAGES[20][0], PHONE_PAGES[20][1]).item).toBe('GOOGLE Pixel 11 Pro Fold 256 GB Olive');
    expect(matchPage(...PHONE_PAGES[0]).item).toBe('');
  });

  it('keeps the forum apart from Tweakers itself', () => {
    expect(siteForHost('gathering.tweakers.net').id).toBe('tweakers-forum');
    expect(siteForHost('tweakers.net').id).toBe('tweakers');
    expect(siteForHost('www.coolblue.nl').id).toBe('coolblue');
    expect(siteForHost('evil-coolblue.nl')).toBeNull();
  });
});

describe('isPhoneProduct', () => {
  it.each([
    'Apple iPhone 17 512GB Zwart',
    'Refurbished Samsung Galaxy S23 128GB',
    'Samsung Galaxy Z Fold8 12GB RAM 256GB',
    'Google Pixel 10a 128GB Zwart',
    'Motorola moto g86 5G',
    'Xiaomi 15T Pro 512GB',
    'POCO F7 Ultra',
    'Nothing Phone (3a) 256GB',
    'Honor Magic V6 512GB Zwart',
  ])('%s is a phone', (name) => {
    expect(isPhoneProduct(name)).toBe(true);
  });

  it.each([
    'Samsung Galaxy Tab S10 FE',
    'Samsung Galaxy Watch8 44mm',
    'Samsung Galaxy Buds3 Pro',
    'Google Pixel Watch 4',
    'Spigen Ultra Hybrid Apple iPhone 17 Pro Max Transparant',
    'Samsung Galaxy S26 Ultra Silicone Case Zwart',
    'Apple iPhone 12 accu vervangingsset',
    'Belkin draadloze snellader voor iPhone',
    'Huawei MatePad 11.5',
    'Xiaomi 65 inch TV A Pro',
  ])('%s is not a phone', (name) => {
    expect(isPhoneProduct(name)).toBe(false);
  });
});

describe('isOwnModel', () => {
  it('finds the model with or without the brand and storage size', () => {
    expect(isOwnModel('Pixel 7 Pro', 'Google Pixel 7 Pro 128GB Obsidian')).toBe(true);
    expect(isOwnModel('Google Pixel 7 Pro 128GB', 'Pixel 7 Pro - Full phone specifications')).toBe(true);
    expect(isOwnModel('iphone 13', 'Apple iPhone 13 - 128GB - Zwart')).toBe(true);
  });

  it('tells models of the same line apart', () => {
    expect(isOwnModel('Pixel 7', 'Google Pixel 7 Pro 128GB')).toBe(false);
    expect(isOwnModel('Pixel 7', 'Google Pixel 7a')).toBe(false);
    expect(isOwnModel('Galaxy S24', 'Samsung Galaxy S24+ 256GB')).toBe(false);
    expect(isOwnModel('Galaxy S24', 'Samsung Galaxy S24 Ultra')).toBe(false);
    expect(isOwnModel('iPhone 16', 'Apple iPhone 16e')).toBe(false);
    expect(isOwnModel('Pixel 7', 'Pixel 7 Pro vs Pixel 7: which one')).toBe(true);
  });

  it('is false without a name or a page', () => {
    expect(isOwnModel('', 'Apple iPhone 13')).toBe(false);
    expect(isOwnModel('Apple', 'Apple iPhone 13')).toBe(false);
    expect(isOwnModel('Pixel 7', '')).toBe(false);
  });
});
