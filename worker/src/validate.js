// The schema of one event, as research/B4 Field study spec.md defines it. Anything that doesn't
// match exactly (an unknown event, an unknown field, a wrong type, a value out of range) is
// rejected. tests/worker.test.js checks that this list agrees with the extension's EVENT_FIELDS.

const HEADLINES = ['own_rule', 'cost', 'support', 'time_held', 'phone_voice'];
const SITE_CATEGORIES = ['price_comparison', 'specs', 'shop', 'forum'];
const URGE_SOURCES = ['bar', 'card', 'popup'];
const URGE_TAGS = ['camera', 'speed', 'battery', 'deal', 'boredom', 'launch_hype', 'other'];
const OUTCOMES = ['bought', 'dropped', 'expired'];
const NEED_RESULTS = ['keep', 'repair', 'upgrade'];
const BROWSERS = ['chrome', 'edge', 'brave', 'firefox', 'other'];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// Field checks. Each returns true when the value is valid.
const bool = (v) => typeof v === 'boolean';
const int = (min, max) => (v) => Number.isInteger(v) && v >= min && v <= max;
const oneOf = (list) => (v) => list.includes(v);
const uuid = (v) => typeof v === 'string' && UUID.test(v);
const nullable = (check) => (v) => v === null || check(v);
const headlines = (v) =>
  Array.isArray(v) && v.length >= 1 && v.length <= HEADLINES.length && new Set(v).size === v.length && v.every(oneOf(HEADLINES));

export const EVENT_SCHEMA = {
  install: {},
  onboarding_finished: { devices: int(0, 10), reasonsSet: bool },
  permission_result: { requested: int(0, 20), granted: int(0, 20) },
  bar_shown: {
    showingId: uuid,
    siteCategory: oneOf(SITE_CATEGORIES),
    headline: oneOf(HEADLINES),
    eligible: headlines,
    deviceMatched: bool,
  },
  bar_outcome: {
    showingId: uuid,
    cardOpened: bool,
    tabClosed: bool,
    urgeLogged: bool,
    cooldownStarted: bool,
    dismissed: bool,
  },
  urge_logged: { source: oneOf(URGE_SOURCES), reasonTag: nullable(oneOf(URGE_TAGS)) },
  cooldown_started: { cooldownId: uuid, lengthDays: int(1, 365), wantStart: int(1, 10) },
  cooldown_ended: { cooldownId: uuid, wantEnd: int(1, 10), outcome: oneOf(OUTCOMES), daysRun: int(0, 3650) },
  need_test_result: { result: oneOf(NEED_RESULTS) },
  paused: { on: bool },
};

const BASE = {
  schemaVersion: (v) => v === 1,
  clientId: uuid,
  eventId: uuid,
  build: (v) => typeof v === 'string' && /^\d{1,5}(\.\d{1,5}){0,3}$/.test(v),
  browser: oneOf(BROWSERS),
  dayIndex: int(0, 3650),
  event: oneOf(Object.keys(EVENT_SCHEMA)),
};

/** Whether `event` is a valid event with exactly the fields its type allows. */
export function isValidEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) return false;
  for (const [name, check] of Object.entries(BASE)) {
    if (!check(event[name])) return false;
  }
  const fields = EVENT_SCHEMA[event.event];
  for (const name of Object.keys(event)) {
    // Own keys only: `in` would also accept inherited names like "constructor" or "toString".
    if (!Object.hasOwn(BASE, name) && !Object.hasOwn(fields, name)) return false;
  }
  for (const [name, check] of Object.entries(fields)) {
    if (!Object.hasOwn(event, name) || !check(event[name])) return false;
  }
  // The headline shown must be one of those that could have been picked.
  if (event.event === 'bar_shown' && !event.eligible.includes(event.headline)) return false;
  return true;
}
