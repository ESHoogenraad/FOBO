// The need test (F9, HANDOFF section 8): checks the reasons the user gave for replacing the
// phone against the evidence, and answers keep, repair or upgrade, with the checks listed.
//
// Its job is to settle the "functional alibi" either way (research A9), so it says upgrade
// plainly whenever security updates have ended or banking, ID or work apps no longer run, and
// nothing else can outweigh that. "Slow" is answered with the battery check first.
// Pure: returns ids and numbers, the popup turns them into text.

import { daysToEol } from './calc.js';
import { batteryNote, UPDATES_NEAR_DAYS } from './rule.js';

export const NEED_RESULTS = ['keep', 'repair', 'upgrade'];

/**
 * The questions to ask, in order. Everyone gets the apps question; the others come from the
 * phone's reasons. The end of security updates is never asked: it comes from the phone's data.
 *   yes/no questions: apps, screen, damage, camera, storage
 *   battery: a percentage, or "don't know"
 */
export function needQuestions(device) {
  const reasons = device.reasons ?? [];
  const questions = ['apps'];
  if (reasons.includes('battery') || reasons.includes('slow')) questions.push('battery');
  for (const id of ['screen', 'damage', 'camera', 'storage']) {
    if (reasons.includes(id)) questions.push(id);
  }
  return questions;
}

/**
 * The result for a phone and the answers given: { result, checks, passed, known }.
 * answers: { apps: boolean, battery: number | null, screen, damage, camera, storage: boolean }
 *   apps: true when the apps still run; camera: true when the camera still works;
 *   screen, damage, storage: true when there is a problem.
 * Each check: { id, status: 'ok' | 'warn' | 'bad' | 'unknown', upgrade?, repair?, ...data }.
 * `status` is how the row looks; `upgrade` and `repair` are what decide the result.
 */
export function needResult(device, answers, today) {
  const reasons = device.reasons ?? [];
  const checks = [updatesCheck(device, today), appsCheck(answers.apps)];

  const battery = typeof answers.battery === 'number' ? answers.battery : null;
  if (reasons.includes('battery') || reasons.includes('slow')) checks.push(batteryCheck(battery));
  if (reasons.includes('slow')) checks.push(slowCheck(battery));
  if (reasons.includes('screen')) checks.push(brokenCheck('screen', answers.screen));
  if (reasons.includes('damage')) checks.push(brokenCheck('damage', answers.damage));
  // The camera question asks whether it still works, so "no" is the problem.
  if (reasons.includes('camera')) checks.push(brokenCheck('camera', answers.camera == null ? null : !answers.camera));
  if (reasons.includes('storage')) checks.push(storageCheck(answers.storage));

  let result = 'keep';
  if (checks.some((check) => check.upgrade)) result = 'upgrade';
  else if (checks.some((check) => check.repair)) result = 'repair';

  const known = checks.filter((check) => check.status !== 'unknown');
  const passed = known.filter((check) => check.status === 'ok' || check.status === 'warn').length;
  return { result, checks, passed, known: known.length };
}

function updatesCheck(device, today) {
  const days = daysToEol(device, today);
  const check = { id: 'updates', date: device.securityEndDate ?? null };
  // Explained only to people who gave "updates ending" as a reason: new Android versions often
  // stop well before security updates do, and people mix the two up (research A10).
  if ((device.reasons ?? []).includes('updates') && device.androidEndDate) check.androidEndDate = device.androidEndDate;
  if (days === null) return { ...check, status: 'unknown' };
  if (days <= 0) return { ...check, status: 'bad', ended: true, upgrade: true };
  return { ...check, status: days > UPDATES_NEAR_DAYS ? 'ok' : 'warn' };
}

function appsCheck(appsRun) {
  if (appsRun === false) return { id: 'apps', status: 'bad', upgrade: true };
  return { id: 'apps', status: appsRun ? 'ok' : 'unknown' };
}

function batteryCheck(pct) {
  if (pct === null) return { id: 'battery', status: 'unknown' };
  const note = batteryNote(pct);
  if (note === 'below') return { id: 'battery', pct, status: 'bad', note, repair: true };
  return { id: 'battery', pct, status: note === 'fine' ? 'ok' : 'warn', note };
}

// A worn battery makes a phone feel slow. With a healthy battery, the phone itself rarely got
// slower (research A9), so "slow" alone never leads to repair or upgrade.
function slowCheck(pct) {
  if (pct === null) return { id: 'slow', status: 'unknown', note: 'checkBattery' };
  if (batteryNote(pct) === 'below') return { id: 'slow', status: 'warn', note: 'battery' };
  return { id: 'slow', status: 'ok', note: 'notBattery' };
}

function brokenCheck(id, broken) {
  if (broken === undefined || broken === null) return { id, status: 'unknown' };
  return broken ? { id, status: 'bad', repair: true } : { id, status: 'ok' };
}

// Full storage is fixed by clearing it out, which costs nothing.
function storageCheck(full) {
  if (full === undefined || full === null) return { id: 'storage', status: 'unknown' };
  return { id: 'storage', status: full ? 'warn' : 'ok', note: full ? 'full' : 'fine' };
}
