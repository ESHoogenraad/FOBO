import { describe, expect, it } from 'vitest';
import {
  addDays,
  purchaseDateFor,
  costPerMonth,
  dayIndex,
  daysBetween,
  daysOwned,
  daysToEol,
  isPaused,
  lifespanUsed,
  monthsOwned,
  moneyNotSpent,
  parsePrice,
  pausedUntilFor,
  timeHeld,
  todayIso,
} from '../src/lib/calc.js';

// The sample device from HANDOFF section 5.
const pixel = { purchaseDate: '2022-10-20', purchasePrice: 899, maintenance: [], securityEndDate: '2027-10-01' };

describe('dates', () => {
  it('counts whole calendar days, across a leap year', () => {
    expect(daysBetween('2022-10-20', '2026-09-19')).toBe(1430);
    expect(daysBetween('2026-09-19', '2022-10-20')).toBe(-1430);
  });

  it('ignores daylight saving time', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });

  it('adds days', () => {
    expect(addDays('2026-10-22', 7)).toBe('2026-10-29');
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
  });

  it("formats today's date in local time", () => {
    expect(todayIso(new Date(2026, 8, 3, 23, 30))).toBe('2026-09-03');
  });
});

describe('cost per month', () => {
  it('divides the price by days owned / 30.44 for the sample device', () => {
    // 899 / (1430 / 30.44) = 19.1368, rounded to the nearest cent (HANDOFF sections 5 and 12).
    expect(daysOwned(pixel, '2026-09-19')).toBe(1430);
    expect(costPerMonth(pixel, '2026-09-19')).toBe(19.14);
  });

  it('adds maintenance costs', () => {
    const repaired = { ...pixel, maintenance: [{ date: '2025-01-10', cost: 89, type: 'battery' }] };
    expect(costPerMonth(repaired, '2026-09-19')).toBe(21.03);
  });

  it('never divides by less than one month', () => {
    const newPhone = { ...pixel, purchaseDate: '2026-09-12' };
    expect(monthsOwned(newPhone, '2026-09-19')).toBe(1);
    expect(costPerMonth(newPhone, '2026-09-19')).toBe(899);
  });

  it('keeps falling', () => {
    expect(costPerMonth(pixel, '2026-10-19')).toBeLessThan(costPerMonth(pixel, '2026-09-19'));
  });
});

describe('security updates', () => {
  it('counts days until they end', () => {
    expect(daysToEol(pixel, '2026-09-19')).toBe(377);
  });

  it('is negative once they have ended, null when unknown', () => {
    expect(daysToEol(pixel, '2027-10-11')).toBe(-10);
    expect(daysToEol({ ...pixel, securityEndDate: undefined }, '2026-09-19')).toBeNull();
  });

  it('gives the share of the supported lifespan used', () => {
    expect(lifespanUsed(pixel, '2022-10-20')).toBe(0);
    expect(lifespanUsed(pixel, '2026-09-19')).toBeCloseTo(0.79, 2);
    expect(lifespanUsed(pixel, '2030-01-01')).toBe(1);
    expect(lifespanUsed({ ...pixel, securityEndDate: undefined }, '2026-09-19')).toBeNull();
  });
});

describe('time held', () => {
  it('counts calendar years and months', () => {
    expect(timeHeld('2022-10-20', '2026-09-22')).toEqual({ years: 3, months: 11, totalMonths: 47 });
    expect(timeHeld('2022-10-20', '2026-09-19')).toEqual({ years: 3, months: 10, totalMonths: 46 });
    expect(timeHeld('2022-10-20', '2022-10-20')).toEqual({ years: 0, months: 0, totalMonths: 0 });
  });
});

describe('money not spent', () => {
  it('adds up the prices of dropped cooldown items only', () => {
    const cooldowns = [
      { outcome: 'dropped', price: 1099 },
      { outcome: 'dropped', price: 249.5 },
      { outcome: 'dropped' },
      { outcome: 'bought', price: 999 },
      { outcome: 'expired', price: 50 },
      { price: 700 },
    ];
    expect(moneyNotSpent(cooldowns)).toBe(1348.5);
    expect(moneyNotSpent([])).toBe(0);
  });
});

describe('day index', () => {
  it('counts whole 24-hour periods since install', () => {
    const installedAt = '2026-09-01T10:00:00.000Z';
    expect(dayIndex(installedAt, Date.parse('2026-09-01T23:59:00Z'))).toBe(0);
    expect(dayIndex(installedAt, Date.parse('2026-09-02T10:00:00Z'))).toBe(1);
    expect(dayIndex(installedAt, Date.parse('2026-09-29T09:00:00Z'))).toBe(27);
  });
});

describe('parsePrice', () => {
  it.each([
    ['899', 899],
    ['899.99', 899.99],
    ['899,99', 899.99],
    ['899,5', 899.5],
    ['1.099', 1099],
    ['1,099', 1099],
    ['1.099,00', 1099],
    ['1,099.00', 1099],
    ['€ 1.099,-', 1099],
    ['€899', 899],
    ['EUR 899', 899],
    [' 899 ', 899],
    ['0', 0],
  ])('reads %j as %d', (text, expected) => {
    expect(parsePrice(text)).toBe(expected);
  });

  it.each(['', 'abc', '-5', '8a9', '.99', '12.3456'])('refuses %j', (text) => {
    expect(parsePrice(text)).toBeNull();
  });
});

describe('pause', () => {
  const now = Date.parse('2026-09-23T12:00:00Z');

  it('pauses for a day, a week, or until switched back on', () => {
    expect(pausedUntilFor('day', now)).toBe('2026-09-24T12:00:00.000Z');
    expect(pausedUntilFor('week', now)).toBe('2026-09-30T12:00:00.000Z');
    expect(pausedUntilFor('manual', now)).toBe('manual');
  });

  it('ends by itself', () => {
    const settings = { pausedUntil: pausedUntilFor('day', now) };
    expect(isPaused(settings, now)).toBe(true);
    expect(isPaused(settings, now + 86_400_000)).toBe(false);
    expect(isPaused({ pausedUntil: 'manual' }, now + 1e12)).toBe(true);
    expect(isPaused({ pausedUntil: null }, now)).toBe(false);
  });
});

describe('purchaseDateFor', () => {
  it('stores the 15th of the month picked', () => {
    expect(purchaseDateFor(2022, 10, '2026-09-23')).toBe('2022-10-15');
  });

  it('never goes past today in the current month, and refuses a month to come', () => {
    expect(purchaseDateFor(2026, 9, '2026-09-10')).toBe('2026-09-10');
    expect(purchaseDateFor(2026, 9, '2026-09-23')).toBe('2026-09-15');
    expect(purchaseDateFor(2026, 10, '2026-09-23')).toBeNull();
  });
});
