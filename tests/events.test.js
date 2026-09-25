import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildRecord,
  EVENT_FIELDS,
  getEvents,
  pruneEvents,
  recordEvent,
  saveCountsOptIn,
  toPayload,
  updateEvent,
  uploadPending,
} from '../src/lib/events.js';
import { createInstall, getInstall, updateInstall } from '../src/lib/storage.js';
import browser, { resetBrowser } from './fake-browser.js';

const COMMON = ['schemaVersion', 'clientId', 'eventId', 'build', 'browser', 'dayIndex', 'event'];
const install = { clientId: 'c0ffee00-0000-4000-8000-000000000000', installedAt: '2026-09-01T10:00:00.000Z', browser: 'firefox' };
const ctx = { installedAt: install.installedAt, build: '0.1.0', now: Date.parse('2026-09-15T12:00:00Z') };

// One valid example of every event in the B4 spec.
const EXAMPLES = {
  install: {},
  onboarding_finished: { devices: 1, reasonsSet: true },
  permission_result: { requested: 5, granted: 5 },
  bar_shown: { showingId: 's1', siteCategory: 'shop', headline: 'cost', eligible: ['cost', 'time_held'], deviceMatched: false },
  bar_outcome: { showingId: 's1', cardOpened: true, tabClosed: true, urgeLogged: false, cooldownStarted: false, dismissed: false },
  urge_logged: { source: 'bar', reasonTag: 'camera' },
  cooldown_started: { cooldownId: 'k1', lengthDays: 7, wantStart: 8 },
  cooldown_ended: { cooldownId: 'k1', wantEnd: 5, outcome: 'dropped', daysRun: 7 },
  need_test_result: { result: 'keep' },
  paused: { on: true },
};

beforeEach(resetBrowser);

describe('the event schema', () => {
  it('has an example for every event, using every field', () => {
    expect(Object.keys(EXAMPLES).sort()).toEqual(Object.keys(EVENT_FIELDS).sort());
    for (const [event, fields] of Object.entries(EXAMPLES)) {
      expect(Object.keys(fields).sort()).toEqual([...EVENT_FIELDS[event]].sort());
    }
  });

  it('refuses unknown events and fields', () => {
    expect(() => buildRecord('page_viewed', {}, ctx)).toThrow(/Unknown event/);
    expect(() => buildRecord('urge_logged', { source: 'bar', note: 'hi' }, ctx)).toThrow(/no field "note"/);
  });

  it('keeps whole days since install, not the time', () => {
    const record = buildRecord('install', {}, ctx);
    expect(record).toEqual({ event: 'install', eventId: expect.any(String), dayIndex: 14, build: '0.1.0', sent: false });
  });
});

describe('payloads', () => {
  it('carry only the common fields and the fields of the event', () => {
    for (const [event, fields] of Object.entries(EXAMPLES)) {
      const payload = toPayload(buildRecord(event, fields, ctx), install);
      expect(Object.keys(payload).sort()).toEqual([...COMMON, ...EVENT_FIELDS[event]].sort());
      expect(payload).toMatchObject({ schemaVersion: 1, clientId: install.clientId, browser: 'firefox', event, dayIndex: 14 });
    }
  });

  it('never carry names, notes, URLs or timestamps, even when a record holds them', () => {
    const record = {
      ...buildRecord('urge_logged', { source: 'bar' }, ctx),
      name: 'Pixel 7 Pro',
      note: 'saw the new one',
      url: 'https://www.coolblue.nl/product/123',
      site: 'coolblue.nl',
      at: '2026-09-15T12:00:00.000Z',
    };
    const text = JSON.stringify(toPayload(record, { ...install, installedAt: install.installedAt }));
    for (const secret of ['Pixel', 'saw the new', 'coolblue', 'http', '2026-', 'installedAt', 'sent']) {
      expect(text).not.toContain(secret);
    }
  });

  it('send a missing optional field as null', () => {
    const payload = toPayload(buildRecord('urge_logged', { source: 'popup' }, ctx), install);
    expect(payload.reasonTag).toBeNull();
  });
});

describe('the local log', () => {
  beforeEach(() => createInstall({ browser: 'chrome' }));

  it('records events in order and adds a reason tag afterwards', async () => {
    await recordEvent('install');
    const key = await recordEvent('urge_logged', { source: 'popup', reasonTag: null });
    await updateEvent(key, { reasonTag: 'deal' });
    const events = await getEvents();
    expect(events.map((e) => e.event)).toEqual(['install', 'urge_logged']);
    expect(events[1].reasonTag).toBe('deal');
  });

  it('keeps the last 90 days', async () => {
    const { installedAt } = await getInstall();
    const day = (n) => Date.parse(installedAt) + n * 86_400_000;
    await browser.storage.local.set({
      'ev:a': buildRecord('install', {}, { installedAt, build: '0.1.0', now: day(0) }),
      'ev:b': buildRecord('paused', { on: true }, { installedAt, build: '0.1.0', now: day(15) }),
      'ev:c': buildRecord('paused', { on: false }, { installedAt, build: '0.1.0', now: day(100) }),
    });
    await pruneEvents(day(105));
    expect((await getEvents()).map((e) => e.dayIndex)).toEqual([15, 100]);
  });
});

describe('upload', () => {
  const endpoint = 'https://counts.example/events';
  const ok = () => vi.fn(async () => ({ ok: true }));

  beforeEach(async () => {
    await createInstall({ browser: 'chrome' });
    await recordEvent('install');
    await recordEvent('permission_result', { requested: 5, granted: 0 });
  });

  it('sends nothing without an endpoint, even when opted in', async () => {
    await saveCountsOptIn(true);
    const fetchImpl = ok();
    expect(await uploadPending({ endpoint: '', fetchImpl })).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends nothing for people who did not opt in', async () => {
    const fetchImpl = ok();
    expect(await uploadPending({ endpoint, fetchImpl })).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends the setup events recorded before the opt-in, once, without credentials', async () => {
    await saveCountsOptIn(true);
    const fetchImpl = ok();
    expect(await uploadPending({ endpoint, fetchImpl })).toBe(2);
    expect(await uploadPending({ endpoint, fetchImpl })).toBe(0);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(endpoint);
    expect(init).toMatchObject({ method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer' });
    expect(JSON.parse(init.body).map((e) => e.event)).toEqual(['install', 'permission_result']);
  });

  it("holds a showing's outcome back until the showing has ended, and fixes it then", async () => {
    await saveCountsOptIn(true);
    const start = Date.now();
    const flags = { showingId: 's1', cardOpened: false, tabClosed: false, urgeLogged: false, cooldownStarted: false, dismissed: false };
    const key = await recordEvent('bar_outcome', flags, { holdUntil: start + 30 * 60_000 });

    await updateEvent(key, { cardOpened: true }, start + 60_000);
    const fetchImpl = ok();
    expect(await uploadPending({ endpoint, fetchImpl, now: start + 60_000 })).toBe(2); // the setup events only

    await updateEvent(key, { tabClosed: true }, start + 31 * 60_000); // too late: the showing has ended
    expect(await uploadPending({ endpoint, fetchImpl, now: start + 31 * 60_000 })).toBe(1);
    const sent = JSON.parse(fetchImpl.mock.calls[1][1].body)[0];
    expect(sent).toMatchObject({ event: 'bar_outcome', cardOpened: true, tabClosed: false });
    expect(sent).not.toHaveProperty('holdUntil');
    expect(sent).not.toHaveProperty('sent');
  });

  describe('from the opt-in on', () => {
    // Event keys carry the time, so each step gets a later clock.
    let clock;
    const tick = () => vi.setSystemTime((clock += 1000));
    const sentEvents = (fetchImpl) => fetchImpl.mock.calls.flatMap(([, init]) => JSON.parse(init.body).map((e) => e.event));

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      clock = Date.now() + 1000;
      tick();
    });
    afterEach(() => vi.useRealTimers());

    it('never sends what was recorded before an opt-in made after onboarding', async () => {
      await updateInstall({ onboardedAt: new Date().toISOString() });
      await recordEvent('urge_logged', { source: 'popup', reasonTag: null });
      tick();
      await saveCountsOptIn(true);
      tick();
      await recordEvent('paused', { on: true });
      const fetchImpl = ok();
      await uploadPending({ endpoint, fetchImpl });
      expect(sentEvents(fetchImpl)).toEqual(['paused']);
    });

    it('sends only the setup events from before an opt-in made during onboarding', async () => {
      await recordEvent('urge_logged', { source: 'popup', reasonTag: null });
      tick();
      await saveCountsOptIn(true);
      const fetchImpl = ok();
      await uploadPending({ endpoint, fetchImpl });
      expect(sentEvents(fetchImpl)).toEqual(['install', 'permission_result']);
    });

    it('never sends what was recorded while the counts were off', async () => {
      await updateInstall({ onboardedAt: new Date().toISOString() });
      await saveCountsOptIn(true);
      tick();
      await saveCountsOptIn(false);
      await recordEvent('paused', { on: true });
      tick();
      await saveCountsOptIn(true);
      tick();
      await recordEvent('paused', { on: false });
      const fetchImpl = ok();
      await uploadPending({ endpoint, fetchImpl });
      expect(JSON.parse(fetchImpl.mock.calls[0][1].body).map((e) => [e.event, e.on])).toEqual([['paused', false]]);
    });

    it('keeps its start when switched on twice (Firefox reports its consent as well)', async () => {
      await saveCountsOptIn(true);
      const { countsFrom } = await getInstall();
      tick();
      await saveCountsOptIn(true);
      expect((await getInstall()).countsFrom).toBe(countsFrom);
    });

    it('sends nothing for an opt-in stored without a start', async () => {
      await updateInstall({ countsOptIn: true });
      const fetchImpl = ok();
      expect(await uploadPending({ endpoint, fetchImpl })).toBe(0);
    });
  });

  it('holds a logged urge back for its reason tag, then sends it once with the tag', async () => {
    await saveCountsOptIn(true);
    const start = Date.now();
    const key = await recordEvent('urge_logged', { source: 'bar', reasonTag: null });
    const fetchImpl = ok();
    expect(await uploadPending({ endpoint, fetchImpl, now: start + 60_000 })).toBe(2); // the setup events only
    await updateEvent(key, { reasonTag: 'deal' }, start + 60_000);
    expect(await uploadPending({ endpoint, fetchImpl, now: start + 11 * 60_000 })).toBe(1);
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)[0]).toMatchObject({ event: 'urge_logged', reasonTag: 'deal' });
  });

  it('gives each event an ID of its own, sent with it', async () => {
    await saveCountsOptIn(true);
    const fetchImpl = ok();
    await uploadPending({ endpoint, fetchImpl });
    const ids = JSON.parse(fetchImpl.mock.calls[0][1].body).map((e) => e.eventId);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('keeps events for the next try when the endpoint fails', async () => {
    await saveCountsOptIn(true);
    await uploadPending({ endpoint, fetchImpl: vi.fn(async () => ({ ok: false })) });
    expect((await getEvents()).every((e) => !e.sent)).toBe(true);
  });
});
