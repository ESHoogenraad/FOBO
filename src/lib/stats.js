// "Share my stats" (V2, HANDOFF section 10): a summary the user copies to the clipboard and
// pastes where the study asked for it. Built from what is stored locally; nothing is sent.
// No device names, no notes, no cooldown items, no dates finer than days.

import browser from 'webextension-polyfill';
import { costPerMonth, dayIndex, timeHeld, todayIso } from './calc.js';
import { getEvents } from './events.js';
import { DEFAULT_ORIGINS } from './match.js';
import { NEED_RESULTS } from './needtest.js';
import { getCooldowns, getDevice, getInstall, getUrges } from './storage.js';

export const STATS_SCHEMA_VERSION = 2;

function countBy(items, field) {
  const counts = {};
  for (const item of items) {
    const value = item[field];
    if (value) counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function barStats(events) {
  const shown = events.filter((e) => e.event === 'bar_shown');
  const outcomes = new Map(events.filter((e) => e.event === 'bar_outcome').map((e) => [e.showingId, e]));
  const count = (flag) => shown.filter((e) => outcomes.get(e.showingId)?.[flag]).length;
  const byHeadline = {};
  for (const showing of shown) {
    const entry = (byHeadline[showing.headline] ??= { shown: 0, closedTab: 0 });
    entry.shown++;
    if (outcomes.get(showing.showingId)?.tabClosed) entry.closedTab++;
  }
  return {
    shown: shown.length,
    cardOpened: count('cardOpened'),
    closedTab: count('tabClosed'),
    dismissed: count('dismissed'),
    byHeadline,
  };
}

function cooldownStats(cooldowns) {
  const rated = cooldowns.filter((c) => typeof c.wantRatingEnd === 'number');
  const drop = rated.reduce((sum, c) => sum + (c.wantRating - c.wantRatingEnd), 0);
  const outcomes = countBy(cooldowns, 'outcome');
  return {
    started: cooldowns.length,
    expired: outcomes.expired ?? 0,
    bought: outcomes.bought ?? 0,
    dropped: outcomes.dropped ?? 0,
    avgWantDrop: rated.length ? Math.round((drop / rated.length) * 10) / 10 : null,
  };
}

/** The summary, from plain data (unit tested). */
export function buildStats({ install, device, events, urges, cooldowns, granted, now = Date.now() }) {
  const today = todayIso(new Date(now));
  const firstBar = events.find((e) => e.event === 'bar_shown');
  const needTests = countBy(events.filter((e) => e.event === 'need_test_result'), 'result');
  return {
    schemaVersion: STATS_SCHEMA_VERSION,
    installedDays: dayIndex(install.installedAt, now),
    devices: device
      ? [
          {
            category: device.category,
            ageMonths: timeHeld(device.purchaseDate, today).totalMonths,
            costPerMonth: costPerMonth(device, today),
            hasSupportDate: Boolean(device.securityEndDate),
            reasons: device.reasons ?? [],
          },
        ]
      : [],
    urges: { total: urges.length, byTag: countBy(urges, 'tag'), bySite: countBy(urges, 'site') },
    cooldowns: cooldownStats(cooldowns),
    needTest: Object.fromEntries(NEED_RESULTS.map((id) => [id, needTests[id] ?? 0])),
    bar: barStats(events),
    funnel: { permissionGranted: granted, firstBarDay: firstBar ? firstBar.dayIndex : null },
  };
}

/** The summary from what is stored in this browser. */
export async function collectStats() {
  const [install, device, events, urges, cooldowns, granted] = await Promise.all([
    getInstall(),
    getDevice(),
    getEvents(),
    getUrges(),
    getCooldowns(),
    browser.permissions.contains({ origins: DEFAULT_ORIGINS }),
  ]);
  return buildStats({ install, device, events, urges, cooldowns, granted });
}
