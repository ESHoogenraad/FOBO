// Milestones (F10, research A7): 2, 3, 4 and 5 years with the phone, and the day its security
// updates end. Shown as a badge on the toolbar icon and a line in the popup, never as a
// notification. The 2-year milestone carries the battery and repair check, because interest in
// repair peaks about two years in and fades after.

import { addDays, daysBetween } from './calc.js';

export const MILESTONE_YEARS = [2, 3, 4, 5];

// A milestone is news for 30 days. A phone that turned 4 half a year before install gets no
// "4 years" line on its first day.
const FRESH_DAYS = 30;

function addYears(iso, years) {
  const [y, m, d] = iso.split('-').map(Number);
  // 29 February becomes 1 March in years without it.
  return addDays(`${y + years}-${String(m).padStart(2, '0')}-01`, d - 1);
}

/** Every milestone of the phone, reached or not: [{ id, date }], by date. */
export function milestones(device) {
  const list = MILESTONE_YEARS.map((years) => ({ id: `years${years}`, years, date: addYears(device.purchaseDate, years) }));
  if (device.securityEndDate) list.push({ id: 'updatesEnded', date: device.securityEndDate });
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

/** The key a milestone is marked as seen under: per phone, so a new phone starts afresh. */
export const milestoneKey = (device, milestone) => `${device.id}:${milestone.id}`;

/** The newest milestone reached in the last 30 days and not yet seen, or null. */
export function currentMilestone(device, today, seen = []) {
  if (!device?.purchaseDate) return null;
  const fresh = milestones(device).filter((m) => {
    const since = daysBetween(m.date, today);
    return since >= 0 && since < FRESH_DAYS;
  });
  const latest = fresh.at(-1);
  return latest && !seen.includes(milestoneKey(device, latest)) ? latest : null;
}
