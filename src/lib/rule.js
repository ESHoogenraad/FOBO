// The own-rule card (HANDOFF section 6, item 7): checks a phone page against the reasons the
// user gave for replacing the phone. Pure: returns ids and numbers, the card turns them into text.

import { daysToEol } from './calc.js';

// The line a replacement battery is usually recommended below, and the line under which it is near.
const BATTERY_LINE = 80;
const BATTERY_NEAR = 85;
// The end of security updates counts as near within a year. Shared with the need test.
export const UPDATES_NEAR_DAYS = 365;

/** Battery health as 'fine' (85% and up), 'near' (80 to 84%) or 'below' (under 80%). Shared with the need test. */
export function batteryNote(pct) {
  if (pct >= BATTERY_NEAR) return 'fine';
  return pct >= BATTERY_LINE ? 'near' : 'below';
}

/**
 * { reasons, tiles, advice } for a phone with reasons set; null without reasons.
 * tiles: one per reason that has data, as { id: "battery" | "updates", status: "ok" | "warn", ... }.
 * The battery comes first when "slow" is a reason: a worn battery makes a phone feel slow.
 * advice: the id of the one sentence of advice.
 */
export function ownRule(device, today) {
  const reasons = device.reasons ?? [];
  if (!reasons.length) return null;

  const tiles = [];
  const hasBattery = typeof device.batteryHealthPct === 'number';
  if (hasBattery && (reasons.includes('battery') || reasons.includes('slow'))) {
    const pct = device.batteryHealthPct;
    const note = batteryNote(pct);
    tiles.push({ id: 'battery', pct, status: note === 'fine' ? 'ok' : 'warn', note });
  }
  const eolDays = daysToEol(device, today);
  if (eolDays !== null && reasons.includes('updates')) {
    tiles.push({
      id: 'updates',
      days: eolDays,
      date: device.securityEndDate,
      status: eolDays > UPDATES_NEAR_DAYS ? 'ok' : 'warn',
      ended: eolDays <= 0,
    });
  }

  return { reasons, tiles, advice: advice(reasons, tiles) };
}

function advice(reasons, tiles) {
  const battery = tiles.find((tile) => tile.id === 'battery');
  const updates = tiles.find((tile) => tile.id === 'updates');
  // Never hidden: once security updates have ended, that is a real reason to upgrade.
  if (updates?.ended) return 'updatesEnded';
  if (battery?.note === 'below') return 'batteryWorn';
  if (reasons.includes('slow')) return 'slow';
  if (tiles.length === 1) return 'notYetOne';
  if (tiles.length > 1) return 'notYetMany';
  return 'noData';
}
