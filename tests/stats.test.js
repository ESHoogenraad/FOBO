import { describe, expect, it } from 'vitest';
import { buildStats, urgePatterns } from '../src/lib/stats.js';

const now = Date.parse('2026-09-19T12:00:00Z');
const input = {
  install: { installedAt: '2026-08-22T09:00:00Z' },
  device: {
    id: 'd1',
    category: 'phone',
    name: 'Pixel 7 Pro',
    purchaseDate: '2022-10-20',
    purchasePrice: 899,
    maintenance: [],
    securityEndDate: '2027-10-01',
    reasons: ['battery', 'updates'],
  },
  events: [
    { event: 'install', dayIndex: 0 },
    { event: 'bar_shown', dayIndex: 2, showingId: 'a', headline: 'own_rule' },
    { event: 'bar_outcome', dayIndex: 2, showingId: 'a', cardOpened: true, tabClosed: true, dismissed: false },
    { event: 'bar_shown', dayIndex: 5, showingId: 'b', headline: 'cost' },
    { event: 'bar_outcome', dayIndex: 5, showingId: 'b', cardOpened: false, tabClosed: false, dismissed: true },
    { event: 'bar_shown', dayIndex: 6, showingId: 'c', headline: 'own_rule' },
    { event: 'need_test_result', dayIndex: 7, result: 'keep' },
  ],
  urges: [
    { site: 'tweakers.net', tag: 'camera', note: 'the new zoom lens' },
    { site: 'tweakers.net', tag: 'launch_hype' },
    { site: 'www.bol.com' },
  ],
  cooldowns: [
    { item: 'Pixel 10 Pro', wantRating: 8, wantRatingEnd: 5, outcome: 'dropped', price: 1099 },
    { item: 'Galaxy S26', wantRating: 6, wantRatingEnd: 6, outcome: 'expired' },
    { item: 'Nothing Phone', wantRating: 7 },
  ],
  granted: true,
  now,
};

describe('Share my stats', () => {
  it('matches schema version 2', () => {
    expect(buildStats(input)).toEqual({
      schemaVersion: 2,
      installedDays: 28,
      devices: [{ category: 'phone', ageMonths: 46, costPerMonth: 19.14, hasSupportDate: true, reasons: ['battery', 'updates'] }],
      urges: { total: 3, byTag: { camera: 1, launch_hype: 1 }, bySite: { 'tweakers.net': 2, 'www.bol.com': 1 } },
      cooldowns: { started: 3, expired: 1, bought: 0, dropped: 1, avgWantDrop: 1.5 },
      needTest: { keep: 1, repair: 0, upgrade: 0 },
      bar: {
        shown: 3,
        cardOpened: 1,
        closedTab: 1,
        dismissed: 1,
        byHeadline: { own_rule: { shown: 2, closedTab: 1 }, cost: { shown: 1, closedTab: 0 } },
      },
      funnel: { permissionGranted: true, firstBarDay: 2 },
    });
  });

  it('contains no names, notes or cooldown items', () => {
    const text = JSON.stringify(buildStats(input));
    for (const secret of ['Pixel 7 Pro', 'zoom lens', 'Pixel 10', 'Galaxy S26', 'Nothing Phone', '2022-10-20', '2026-08-22']) {
      expect(text).not.toContain(secret);
    }
  });

  it('works before the phone is set up and before any bar', () => {
    const stats = buildStats({ ...input, device: null, events: [], urges: [], cooldowns: [], granted: false });
    expect(stats.devices).toEqual([]);
    expect(stats.funnel).toEqual({ permissionGranted: false, firstBarDay: null });
    expect(stats.cooldowns.avgWantDrop).toBeNull();
  });
});

describe('urgePatterns', () => {
  it('ranks the tags and the site by count, ties alphabetically', () => {
    const urges = [
      { site: 'tweakers.net', tag: 'launch_hype' },
      { site: 'bol.com', tag: 'camera' },
      { site: 'tweakers.net', tag: 'camera' },
      { site: 'tweakers.net', tag: 'deal' },
      { site: 'bol.com' },
      { site: null, tag: 'boredom' },
      { site: 'coolblue.nl', tag: 'boredom' },
      { site: 'coolblue.nl', tag: 'launch_hype' },
    ];
    expect(urgePatterns(urges)).toEqual({
      tags: [
        ['boredom', 2],
        ['camera', 2],
      ],
      site: ['tweakers.net', 3],
    });
  });

  it('counts only what was logged at least twice', () => {
    expect(urgePatterns([{ site: 'bol.com', tag: 'camera' }, { site: 'tweakers.net', tag: 'deal' }])).toEqual({ tags: [], site: null });
  });

  it('is empty without urges, tags or sites', () => {
    expect(urgePatterns([])).toEqual({ tags: [], site: null });
    expect(urgePatterns([{ site: null }, { site: null }])).toEqual({ tags: [], site: null });
  });
});
