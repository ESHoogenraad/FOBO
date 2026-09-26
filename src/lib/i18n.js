// UI strings come from _locales (F14); numbers and dates are formatted to match.

import browser from 'webextension-polyfill';

/** The message for `key`, with $1, $2, ... filled in. Shows the key itself if a message is missing. */
export function t(key, ...substitutions) {
  return browser.i18n.getMessage(key, substitutions.map(String)) || key;
}

// The "locale" message says which bundle the text actually comes from, so a browser in German
// (which gets the English text) also gets English dates rather than German ones.
let cachedLocale;
export function locale() {
  cachedLocale ??= browser.i18n.getMessage('locale') || 'en-GB';
  return cachedLocale;
}

export function lang() {
  return locale().split('-')[0];
}

// en-GB shortens September to "Sept" and every other month to three letters ("Mar 2022",
// "Sept 2024"), so it gets "Sep" to match.
function format(options, date) {
  return new Intl.DateTimeFormat(locale(), options)
    .formatToParts(date)
    .map(({ type, value }) => (type === 'month' && value === 'Sept' ? 'Sep' : value))
    .join('');
}

function utcDate(iso) {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

/** €19.14 in English, € 19,14 in Dutch. */
export function formatEur(amount, { whole = false } = {}) {
  return new Intl.NumberFormat(locale(), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}

export function formatNumber(n) {
  return new Intl.NumberFormat(locale()).format(n);
}

/** "Oct 2027" */
export function formatMonthYear(iso) {
  return format({ month: 'short', year: 'numeric', timeZone: 'UTC' }, utcDate(iso));
}

/** "1 Oct 2026" */
export function formatDate(iso) {
  return format({ day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }, utcDate(iso));
}

/** "29 Oct" */
export function formatDayMonth(iso) {
  return format({ day: 'numeric', month: 'short', timeZone: 'UTC' }, utcDate(iso));
}

/** "Tue 29 Oct, 14:00" style, for a pause end in the user's own time zone. */
export function formatDateTime(isoTimestamp) {
  return format({ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }, new Date(isoTimestamp));
}

/** Sets <html lang> and the page title for an extension page. */
export function localizePage(titleKey, ...substitutions) {
  document.documentElement.lang = lang();
  document.title = t(titleKey, ...substitutions);
}

/** "battery life or updates ending", "de accu of de updates" */
export function listOr(items) {
  return new Intl.ListFormat(locale(), { type: 'disjunction' }).format(items);
}
