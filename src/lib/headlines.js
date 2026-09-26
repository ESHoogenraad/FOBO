// The bar's headline (V5, B4 spec "Headline randomisation"). Each showing picks one headline
// uniformly at random among those eligible for the phone, and records the eligible list with
// the pick, so the analysis knows each headline's chance.

import { costPerMonth, daysToEol, timeHeld } from './calc.js';
import { formatEur, formatMonthYear, listOr, t } from './i18n.js';

/** Every headline, in a fixed order. */
export const HEADLINES = ['own_rule', 'cost', 'support', 'time_held', 'phone_voice'];

export function eligibleHeadlines(device) {
  return HEADLINES.filter((id) => {
    if (id === 'own_rule') return device.reasons?.length > 0;
    // Only when the end of security updates is known. Apple announces no date, so an iPhone
    // gets it only once its support has ended (the background's daily refresh picks that up).
    if (id === 'support') return Boolean(device.securityEndDate);
    return true;
  });
}

function randomUint32() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

/** Picks one of `eligible`, each equally likely. `random` returns a random 32-bit integer. */
export function pickHeadline(eligible, random = randomUint32) {
  // Numbers at or above `limit` would make the first few headlines slightly more likely,
  // so they are drawn again.
  const limit = 2 ** 32 - (2 ** 32 % eligible.length);
  let n;
  do n = random();
  while (n >= limit);
  return eligible[n % eligible.length];
}

// ---- Text

/** The reasons as a phrase: "battery life or updates ending". */
export function reasonsPhrase(reasons) {
  return listOr(reasons.map((id) => t(`reasonPhrase_${id}`)));
}

/** "3 years 11 months", "11 months", "1 year" */
export function formatTimeHeld(purchaseDate, today) {
  const { years, months, totalMonths } = timeHeld(purchaseDate, today);
  if (totalMonths === 0) return t('timeUnderMonth');
  const parts = [];
  if (years) parts.push(years === 1 ? t('timeYearOne') : t('timeYears', years));
  if (months) parts.push(months === 1 ? t('timeMonthOne') : t('timeMonths', months));
  return parts.join(' ');
}

export function headlineText(id, device, today) {
  switch (id) {
    case 'own_rule': {
      const count = device.reasons.length === 1 ? 'One' : device.reasons.length === 2 ? 'Two' : 'Many';
      return t(`headlineOwnRule${count}`, reasonsPhrase(device.reasons));
    }
    case 'cost':
      return t('headlineCost', formatEur(costPerMonth(device, today)));
    case 'support':
      return daysToEol(device, today) > 0
        ? t('headlineSupport', formatMonthYear(device.securityEndDate))
        : t('headlineSupportEnded', formatMonthYear(device.securityEndDate));
    case 'time_held':
      return t('headlineTimeHeld', formatTimeHeld(device.purchaseDate, today));
    // The same fact as time_held in the phone's own voice, so the pair isolates the voice.
    case 'phone_voice':
      return t('headlinePhoneVoice', formatTimeHeld(device.purchaseDate, today));
    default:
      throw new Error(`Unknown headline "${id}"`);
  }
}
