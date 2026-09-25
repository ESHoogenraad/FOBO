// Pure functions behind the numbers Upgraditch shows (F2). No browser APIs, so they are unit tested.
//
// Calendar dates are ISO strings ("2022-10-20") and are compared as UTC midnights,
// so daylight saving time never moves a day.

const DAY_MS = 86_400_000;
export const DAYS_PER_MONTH = 30.44;

/** Today's calendar date in the user's time zone, as "YYYY-MM-DD". */
export function todayIso(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function dateMs(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from one calendar date to another; negative when `to` comes first. */
export function daysBetween(fromIso, toIso) {
  return Math.round((dateMs(toIso) - dateMs(fromIso)) / DAY_MS);
}

export function addDays(iso, days) {
  return new Date(dateMs(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * The purchase date stored for a month and year: the 15th, so the numbers are at most about two
 * weeks out. In the current month, never later than today. Null for a month still to come.
 */
export function purchaseDateFor(year, month, today) {
  const iso = `${year}-${String(month).padStart(2, '0')}-15`;
  if (iso.slice(0, 7) > today.slice(0, 7)) return null;
  return iso > today ? today : iso;
}

export function roundCents(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function daysOwned(device, today) {
  return Math.max(0, daysBetween(device.purchaseDate, today));
}

/** Months owned, never below 1, so a phone bought last week doesn't show a huge monthly cost. */
export function monthsOwned(device, today) {
  return Math.max(1, daysOwned(device, today) / DAYS_PER_MONTH);
}

/** Price paid plus maintenance, per month owned, rounded to cents. */
export function costPerMonth(device, today) {
  const maintenance = (device.maintenance ?? []).reduce((sum, item) => sum + item.cost, 0);
  return roundCents((device.purchasePrice + maintenance) / monthsOwned(device, today));
}

/** Days until security updates end; negative once they have ended, null when unknown. */
export function daysToEol(device, today) {
  return device.securityEndDate ? daysBetween(today, device.securityEndDate) : null;
}

/** Share of the supported lifespan (purchase to end of security updates) used so far, 0 to 1. */
export function lifespanUsed(device, today) {
  if (!device.securityEndDate) return null;
  const total = daysBetween(device.purchaseDate, device.securityEndDate);
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, daysOwned(device, today) / total));
}

/** Calendar time held: 2022-10-20 to 2026-09-22 is 3 years 11 months. */
export function timeHeld(purchaseDate, today) {
  const [y1, m1, d1] = purchaseDate.split('-').map(Number);
  const [y2, m2, d2] = today.split('-').map(Number);
  const total = Math.max(0, (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0));
  return { years: Math.floor(total / 12), months: total % 12, totalMonths: total };
}

/** The prices of cooldown items the user dropped. */
export function moneyNotSpent(cooldowns) {
  return roundCents(
    cooldowns
      .filter((c) => c.outcome === 'dropped' && typeof c.price === 'number')
      .reduce((sum, c) => sum + c.price, 0),
  );
}

/** Whole days since install (24-hour periods); the only time the counts ever carry. */
export function dayIndex(installedAt, now = Date.now()) {
  return Math.max(0, Math.floor((now - Date.parse(installedAt)) / DAY_MS));
}

/**
 * Reads a price typed in either English or Dutch notation: "899", "899.99", "899,99",
 * "1.099", "1,099.00", "€ 1.099,-". Returns null when it isn't a price.
 */
export function parsePrice(text) {
  const s = String(text)
    .trim()
    .replace(/^(€|eur)/i, '')
    .replace(/[,.]-$/, '')
    .replace(/\s/g, '');
  if (!/^\d[\d.,]*$/.test(s)) return null;

  const lastSep = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
  if (lastSep === -1) return Number(s);

  const sep = s[lastSep];
  const hasBoth = s.includes('.') && s.includes(',');
  const fraction = s.slice(lastSep + 1);
  const sepCount = s.split(sep).length - 1;
  // With one kind of separator, three digits after it or several of it mean thousands: "1.099", "1.099.000".
  if (!hasBoth && (fraction.length === 3 || sepCount > 1)) {
    return Number(s.replace(/[.,]/g, ''));
  }
  if (fraction.length > 2) return null;
  return Number(`${s.slice(0, lastSep).replace(/[.,]/g, '')}.${fraction || '0'}`);
}

// Pause (F13): settings.pausedUntil is an ISO timestamp, "manual" (until switched back on), or null.

export const PAUSE_OPTIONS = ['day', 'week', 'manual'];

export function pausedUntilFor(option, now = Date.now()) {
  if (option === 'manual') return 'manual';
  const days = option === 'week' ? 7 : 1;
  return new Date(now + days * DAY_MS).toISOString();
}

export function isPaused(settings, now = Date.now()) {
  const until = settings.pausedUntil;
  return until === 'manual' || (typeof until === 'string' && Date.parse(until) > now);
}

// Hide (F4): the bar's hide button hides it on one site for 24 hours.
// settings.hiddenUntil maps a site id to an ISO timestamp.

export function isHidden(settings, siteId, now = Date.now()) {
  const until = settings.hiddenUntil?.[siteId];
  return typeof until === 'string' && Date.parse(until) > now;
}

/** hiddenUntil with `siteId` hidden for 24 hours, and the hides that have run out removed. */
export function hideSite(hiddenUntil, siteId, now = Date.now()) {
  const next = {};
  for (const [id, until] of Object.entries(hiddenUntil ?? {})) {
    if (Date.parse(until) > now) next[id] = until;
  }
  next[siteId] = new Date(now + DAY_MS).toISOString();
  return next;
}
