// The local event log (V4 to V6) and the opt-in upload. The event list and fields follow
// research/B4 Field study spec.md, which is authoritative.
//
// Every event is kept locally, for "Share my stats". It leaves the browser only while the user
// has opted in, in batches at most once an hour, and only when COUNTS_ENDPOINT is set.
// A payload carries whole days since install, never a timestamp, URL, device name or note.

import browser from 'webextension-polyfill';
import { COUNTS_ENDPOINT } from '../config.js';
import { dayIndex } from './calc.js';
import { IS_FIREFOX } from './env.js';
import { getInstall, updateInstall } from './storage.js';

export const EVENT_SCHEMA_VERSION = 1;

/** Per event, the extra fields it may carry. Anything else is refused. */
export const EVENT_FIELDS = {
  install: [],
  onboarding_finished: ['devices', 'reasonsSet'],
  permission_result: ['requested', 'granted'],
  bar_shown: ['showingId', 'siteCategory', 'headline', 'eligible', 'deviceMatched'],
  bar_outcome: ['showingId', 'cardOpened', 'tabClosed', 'urgeLogged', 'cooldownStarted', 'dismissed'],
  urge_logged: ['source', 'reasonTag'],
  cooldown_started: ['cooldownId', 'lengthDays', 'wantStart'],
  cooldown_ended: ['cooldownId', 'wantEnd', 'outcome', 'daysRun'],
  need_test_result: ['result'],
  paused: ['on'],
};

const KEY_PREFIX = 'ev:';
/** Whether a local storage key holds an event record. */
export const isEventKey = (key) => key.startsWith(KEY_PREFIX);
// Events filled in shortly after they are recorded, held back from uploads until then:
// the reason tag follows a logged urge within seconds.
const HOLD_MS = { urge_logged: 10 * 60 * 1000 };
const KEEP_DAYS = 90;
const MAX_BATCH = 500;

// Firefox's own data consent (HANDOFF section 4), on top of the opt-in switch.
const DATA_COLLECTION = ['technicalAndInteraction'];

// Recorded before the opt-in in onboarding, and sent once the user opts in there (B4 spec).
const SETUP_EVENTS = ['install', 'permission_result'];

function checkFields(event, fields) {
  const allowed = EVENT_FIELDS[event];
  if (!allowed) throw new Error(`Unknown event "${event}"`);
  for (const name of Object.keys(fields)) {
    if (!allowed.includes(name)) throw new Error(`Event "${event}" has no field "${name}"`);
  }
}

/**
 * The record kept locally. `sent` is local bookkeeping and never part of a payload. `eventId`
 * is random and lets the endpoint store an event sent twice only once.
 */
export function buildRecord(event, fields, { installedAt, build, now = Date.now() }) {
  checkFields(event, fields);
  return { event, eventId: crypto.randomUUID(), dayIndex: dayIndex(installedAt, now), build, sent: false, ...fields };
}

/** What is sent for one record: the common fields, then only the fields the event allows. */
export function toPayload(record, install) {
  const payload = {
    schemaVersion: EVENT_SCHEMA_VERSION,
    clientId: install.clientId,
    eventId: record.eventId,
    build: record.build,
    browser: install.browser,
    dayIndex: record.dayIndex,
    event: record.event,
  };
  for (const name of EVENT_FIELDS[record.event]) payload[name] = record[name] ?? null;
  return payload;
}

// Keys sort in the order the events happened: time, then a counter for events recorded by the
// same page within one millisecond. The time stays in this browser.
let sequence = 0;
const timeKey = (now) => `${KEY_PREFIX}${now.toString(36).padStart(9, '0')}`;
function newKey(now) {
  sequence = (sequence + 1) % 36 ** 4;
  const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  return `${timeKey(now)}${sequence.toString(36).padStart(4, '0')}-${random}`;
}

const holdFor = (event) => (HOLD_MS[event] ? Date.now() + HOLD_MS[event] : undefined);

/**
 * Records an event locally and returns its key, or null before the install record exists.
 * `holdUntil` (a time in ms) keeps an event out of uploads until then, and lets updateEvent
 * change it only until then: bar_outcome is recorded when a showing starts and filled in while
 * it lasts. Like `sent`, it is local bookkeeping and never part of a payload.
 */
export async function recordEvent(event, fields = {}, { holdUntil = holdFor(event) } = {}) {
  const install = await getInstall();
  if (!install) return null;
  const now = Date.now();
  const record = buildRecord(event, fields, {
    installedAt: install.installedAt,
    build: browser.runtime.getManifest().version,
    now,
  });
  if (holdUntil) record.holdUntil = holdUntil;
  const key = newKey(now);
  await browser.storage.local.set({ [key]: record });
  return key;
}

/**
 * Adds fields to an event that hasn't been sent yet, like a reason tag picked after the tap.
 * An event with `holdUntil` can only change until that time.
 */
export async function updateEvent(key, fields, now = Date.now()) {
  const { [key]: record } = await browser.storage.local.get(key);
  if (!record || record.sent || (record.holdUntil && now >= record.holdUntil)) return;
  checkFields(record.event, fields);
  await browser.storage.local.set({ [key]: { ...record, ...fields } });
}

async function getEventEntries() {
  const all = await browser.storage.local.get(null);
  return Object.keys(all)
    .filter(isEventKey)
    .sort()
    .map((key) => [key, all[key]]);
}

export async function getEvents() {
  return (await getEventEntries()).map(([, record]) => record);
}

/** Keeps the event log to the last 90 days. */
export async function pruneEvents(now = Date.now()) {
  const install = await getInstall();
  if (!install) return;
  const oldest = dayIndex(install.installedAt, now) - KEEP_DAYS;
  const old = (await getEventEntries()).filter(([, record]) => record.dayIndex < oldest);
  if (old.length) await browser.storage.local.remove(old.map(([key]) => key));
}

// ---- Opt-in (V4)

/**
 * Switches the anonymous counts on or off and resolves to the new state.
 * Call it directly from the click or change handler, with no `await` before it:
 * Firefox asks for its data consent, and that needs the live user gesture.
 */
export function setCountsOptIn(on) {
  let consent;
  if (!IS_FIREFOX) consent = Promise.resolve(on);
  else if (on) consent = browser.permissions.request({ data_collection: DATA_COLLECTION });
  else consent = browser.permissions.remove({ data_collection: DATA_COLLECTION }).then(() => false);
  return consent.then(async (granted) => {
    await saveCountsOptIn(granted);
    return granted;
  });
}

/**
 * Stores the switch. Switching it on starts the counts from now: events recorded before, or
 * while it was off, are never sent. The one exception is the setup events of an opt-in made
 * during onboarding. `countsFrom` is the event key of that moment, so it sorts like the keys.
 */
export async function saveCountsOptIn(on, now = Date.now()) {
  const install = await getInstall();
  if (!on) return updateInstall({ countsOptIn: false });
  if (install?.countsOptIn) return install; // already on (Firefox reports its consent twice)
  return updateInstall({ countsOptIn: true, countsFrom: timeKey(now), countsSetup: !install?.onboardedAt });
}

/** Whether an event may be sent: recorded since the opt-in, or a setup event of an onboarding opt-in. */
function inCounts(key, record, install) {
  if (install.countsFrom && key >= install.countsFrom) return true;
  return Boolean(install.countsSetup) && SETUP_EVENTS.includes(record.event);
}

async function firefoxConsentGiven() {
  if (!IS_FIREFOX) return true;
  return browser.permissions.contains({ data_collection: DATA_COLLECTION });
}

/** Whether a permissions change on Firefox was the data consent, and in which direction. */
export function dataConsentChange(permissions) {
  return (permissions.data_collection ?? []).some((type) => DATA_COLLECTION.includes(type));
}

/** Sends the events not sent yet. Called by the hourly alarm; does nothing unless opted in. */
export async function uploadPending({ endpoint = COUNTS_ENDPOINT, fetchImpl = globalThis.fetch, now = Date.now() } = {}) {
  if (!endpoint) return 0;
  const install = await getInstall();
  if (!install?.countsOptIn || !(await firefoxConsentGiven())) return 0;

  const pending = (await getEventEntries())
    .filter(([key, record]) => !record.sent && !(record.holdUntil > now) && inCounts(key, record, install))
    .slice(0, MAX_BATCH);
  if (!pending.length) return 0;

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(pending.map(([, record]) => toPayload(record, install))),
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  });
  if (!response.ok) return 0;

  await browser.storage.local.set(
    Object.fromEntries(pending.map(([key, record]) => [key, { ...record, sent: true }])),
  );
  return pending.length;
}
