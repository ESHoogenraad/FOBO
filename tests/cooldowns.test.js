import { describe, expect, it } from 'vitest';
import { hideSite, isHidden } from '../src/lib/calc.js';
import { daysRun, endCooldown, isDue, isOpen, newCooldown } from '../src/lib/cooldowns.js';

describe('cooldowns', () => {
  const start = new Date(2026, 9, 22, 20, 30); // 22 Oct 2026, 20:30 local time

  it('ends 7 days after the start by default', () => {
    const cooldown = newCooldown({ item: 'Pixel 11', wantRating: 8 }, start);
    expect(cooldown).toMatchObject({ item: 'Pixel 11', days: 7, endsOn: '2026-10-29', wantRating: 8 });
    expect(cooldown).not.toHaveProperty('price');
  });

  it('takes another length and an optional price', () => {
    const cooldown = newCooldown({ item: 'Pixel 11', wantRating: 8, days: 14, price: 999 }, start);
    expect(cooldown.endsOn).toBe('2026-11-05');
    expect(cooldown.price).toBe(999);
  });

  it('is due from the end date until answered', () => {
    const cooldown = newCooldown({ item: 'Pixel 11', wantRating: 8 }, start);
    expect(isDue(cooldown, '2026-10-28')).toBe(false);
    expect(isDue(cooldown, '2026-10-29')).toBe(true);
    const { ended } = endCooldown(cooldown, { wantEnd: 4, outcome: 'dropped' }, '2026-10-30');
    expect(isOpen(ended)).toBe(false);
    expect(isDue(ended, '2026-10-30')).toBe(false);
  });

  it('records the end with the new rating, the outcome and the days it ran', () => {
    const cooldown = newCooldown({ item: 'Pixel 11', wantRating: 8 }, start);
    const { ended, event } = endCooldown(cooldown, { wantEnd: 4, outcome: 'dropped' }, '2026-10-30');
    expect(ended).toMatchObject({ wantRating: 8, wantRatingEnd: 4, outcome: 'dropped', endedOn: '2026-10-30' });
    expect(event).toEqual({ cooldownId: cooldown.id, wantEnd: 4, outcome: 'dropped', daysRun: 8 });
    expect(daysRun(cooldown, '2026-10-22')).toBe(0);
  });

  it('refuses an unknown outcome', () => {
    const cooldown = newCooldown({ item: 'x', wantRating: 5 }, start);
    expect(() => endCooldown(cooldown, { wantEnd: 5, outcome: 'returned' }, '2026-10-29')).toThrow();
  });
});

describe('hiding the bar on a site', () => {
  const now = Date.parse('2026-09-23T12:00:00Z');

  it('hides it for 24 hours on that site only', () => {
    const settings = { hiddenUntil: hideSite({}, 'coolblue', now) };
    expect(isHidden(settings, 'coolblue', now + 23 * 3_600_000)).toBe(true);
    expect(isHidden(settings, 'coolblue', now + 24 * 3_600_000)).toBe(false);
    expect(isHidden(settings, 'bol', now)).toBe(false);
  });

  it('drops hides that have run out', () => {
    const old = { bol: '2026-09-01T00:00:00.000Z', tweakers: '2026-09-24T00:00:00.000Z' };
    expect(Object.keys(hideSite(old, 'coolblue', now)).sort()).toEqual(['coolblue', 'tweakers']);
  });
});
