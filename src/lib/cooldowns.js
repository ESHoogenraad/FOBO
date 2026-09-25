// Cooldowns (F6): a want gets a quiet end date, 7 days by default. No countdown anywhere:
// the end date is shown as "Check again on 29 Oct". Stored one per key (storage.js).

import { addDays, daysBetween, todayIso } from './calc.js';

export const DEFAULT_COOLDOWN_DAYS = 7;
export const MAX_COOLDOWN_DAYS = 365;
export const OUTCOMES = ['bought', 'dropped', 'expired'];

export function newCooldown({ item, price, days = DEFAULT_COOLDOWN_DAYS, wantRating }, now = new Date()) {
  const cooldown = {
    id: crypto.randomUUID(),
    item,
    startedAt: now.toISOString(),
    days,
    endsOn: addDays(todayIso(now), days),
    wantRating,
  };
  if (typeof price === 'number') cooldown.price = price;
  return cooldown;
}

export const isOpen = (cooldown) => !cooldown.outcome;

/** The end date has come and the user hasn't answered yet: shown with a badge on the icon. */
export const isDue = (cooldown, today) => isOpen(cooldown) && cooldown.endsOn <= today;

/** Whole days from the start to `today`, in the user's time zone. */
export function daysRun(cooldown, today) {
  return Math.max(0, daysBetween(todayIso(new Date(cooldown.startedAt)), today));
}

/** The answered cooldown, and the fields of its cooldown_ended event. */
export function endCooldown(cooldown, { wantEnd, outcome }, today) {
  if (!OUTCOMES.includes(outcome)) throw new Error(`Unknown outcome "${outcome}"`);
  const ended = { ...cooldown, wantRatingEnd: wantEnd, outcome, endedOn: today };
  const event = { cooldownId: cooldown.id, wantEnd, outcome, daysRun: daysRun(cooldown, today) };
  return { ended, event };
}
