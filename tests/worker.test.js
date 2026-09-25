// The counts endpoint (worker/): schema validation, CORS and what it stores.

import { beforeEach, describe, expect, it } from 'vitest';
import { EVENT_FIELDS, toPayload } from '../src/lib/events.js';
import worker from '../worker/src/index.js';
import { EVENT_SCHEMA, isValidEvent } from '../worker/src/validate.js';

const install = { clientId: '8f14e45f-ceea-467a-9575-7a3b2a2c2b0e', browser: 'firefox' };
const showingId = '1b4e28ba-2fa1-41d2-883f-0016d3cca427';
const eventId = 'b7d4c2a1-5e6f-4a8b-9c0d-1e2f3a4b5c6d';
const base = { schemaVersion: 1, clientId: install.clientId, eventId, build: '0.1.0', browser: 'firefox', dayIndex: 3 };
const shown = {
  ...base,
  event: 'bar_shown',
  showingId,
  siteCategory: 'shop',
  headline: 'cost',
  eligible: ['own_rule', 'cost', 'time_held'],
  deviceMatched: false,
};

describe('the schema', () => {
  it('has the same events and fields as the extension', () => {
    expect(Object.keys(EVENT_SCHEMA).sort()).toEqual(Object.keys(EVENT_FIELDS).sort());
    for (const [event, fields] of Object.entries(EVENT_FIELDS)) {
      expect(Object.keys(EVENT_SCHEMA[event]).sort(), event).toEqual([...fields].sort());
    }
  });

  it('accepts what the extension sends', () => {
    const records = [
      { event: 'install', dayIndex: 0, build: '0.1.0' },
      { event: 'urge_logged', dayIndex: 1, build: '0.1.0', source: 'bar' }, // reasonTag not picked
      { event: 'cooldown_ended', dayIndex: 9, build: '0.1.0', cooldownId: showingId, wantEnd: 4, outcome: 'dropped', daysRun: 7 },
      { event: 'need_test_result', dayIndex: 9, build: '0.1.0', result: 'repair', sent: false, holdUntil: 1 },
    ].map((record) => ({ ...record, eventId: crypto.randomUUID() }));
    for (const record of records) expect(isValidEvent(toPayload(record, install)), record.event).toBe(true);
    expect(isValidEvent(shown)).toBe(true);
  });

  it.each([
    ['an unknown field', { ...shown, url: 'https://www.bol.com/p/123' }],
    ['a field named like an Object method', { ...shown, constructor: 'anything' }],
    ['a field named toString', { ...shown, toString: 'anything' }],
    ['a __proto__ field', JSON.parse(JSON.stringify(shown).replace('{', '{"__proto__":{"x":1},'))],
    ['a missing field', { ...shown, deviceMatched: undefined }],
    ['an unknown event', { ...base, event: 'page_view' }],
    ['a device name in a field', { ...shown, siteCategory: 'Pixel 7 Pro' }],
    ['a timestamp instead of a day', { ...shown, dayIndex: 1758620000000 }],
    ['a headline that was not eligible', { ...shown, headline: 'support' }],
    ['a client ID that is not a random UUID', { ...shown, clientId: 'user@example.com' }],
    ['no event ID', { ...shown, eventId: undefined }],
    ['an older schema', { ...shown, schemaVersion: 0 }],
    ['an array', [shown]],
    ['null', null],
  ])('rejects %s', (_, event) => {
    expect(isValidEvent(event)).toBe(false);
  });
});

// ---- The Worker, with a stand-in for D1

// Rows as bound: [receivedDay, schemaVersion, clientId, eventId, build, browser, dayIndex, event, fields]
let rows;
const env = {
  ALLOWED_ORIGINS: '',
  DB: {
    prepare: () => ({
      bind: (...values) => ({
        values,
        // SELECT COUNT(*) ... WHERE client_id = ? AND received_day = ?
        first: async () => ({ n: rows.filter((row) => row[2] === values[0] && row[0] === values[1]).length }),
      }),
    }),
    // INSERT OR IGNORE, with event_id UNIQUE
    batch: async (statements) =>
      statements.map(({ values }) => {
        if (rows.some((row) => row[3] === values[3])) return { meta: { changes: 0 } };
        rows.push(values);
        return { meta: { changes: 1 } };
      }),
  },
};

const today = () => new Date().toISOString().slice(0, 10);

function post(body, { origin = 'moz-extension://5a1c3d2e', method = 'POST', path = '/events', type = 'application/json' } = {}) {
  const headers = { 'content-type': type };
  if (origin) headers.origin = origin;
  return worker.fetch(
    new Request(`https://counts.example.workers.dev${path}`, {
      method,
      headers,
      body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    }),
    env,
  );
}

beforeEach(() => {
  rows = [];
});

describe('the Worker', () => {
  it('stores valid events with the day they arrived, and drops invalid ones', async () => {
    const response = await post([shown, { ...shown, url: 'https://example.com' }]);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ stored: 1, rejected: 1 });
    expect(rows).toHaveLength(1);
    const [receivedDay, schemaVersion, clientId, storedEventId, build, browserName, dayIndex, event, fields] = rows[0];
    expect(receivedDay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect([schemaVersion, clientId, storedEventId, build, browserName, dayIndex, event]).toEqual([
      1,
      install.clientId,
      eventId,
      '0.1.0',
      'firefox',
      3,
      'bar_shown',
    ]);
    expect(JSON.parse(fields)).toEqual({
      showingId,
      siteCategory: 'shop',
      headline: 'cost',
      eligible: ['own_rule', 'cost', 'time_held'],
      deviceMatched: false,
    });
  });

  it('stores an event sent twice once', async () => {
    expect(await (await post([shown])).json()).toEqual({ stored: 1, rejected: 0 });
    expect(await (await post([shown])).json()).toEqual({ stored: 0, rejected: 1 });
    expect(rows).toHaveLength(1);
  });

  it('refuses a batch with events of more than one install', async () => {
    const other = { ...shown, clientId: crypto.randomUUID(), eventId: crypto.randomUUID() };
    expect((await post([shown, other])).status).toBe(400);
    expect(rows).toHaveLength(0);
  });

  it('stores at most 1000 events per install a day', async () => {
    rows = Array.from({ length: 999 }, (_, i) => [today(), 1, install.clientId, `old-${i}`]);
    const batch = [shown, { ...shown, eventId: crypto.randomUUID() }];
    expect(await (await post(batch)).json()).toEqual({ stored: 1, rejected: 1 });
    // Another install still gets in.
    const other = { ...shown, clientId: crypto.randomUUID(), eventId: crypto.randomUUID() };
    expect(await (await post([other])).json()).toEqual({ stored: 1, rejected: 0 });
  });

  it('answers CORS for extension origins only', async () => {
    const preflight = await post(null, { method: 'OPTIONS', origin: 'chrome-extension://abcdefghijklmnop' });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe('chrome-extension://abcdefghijklmnop');
    expect((await post([shown], { origin: 'https://evil.example' })).status).toBe(403);
    expect((await post([shown], { origin: null })).status).toBe(403);
  });

  it('can be narrowed to the store build in Chrome', async () => {
    env.ALLOWED_ORIGINS = 'chrome-extension://storeid';
    try {
      expect((await post([shown], { origin: 'chrome-extension://otherid' })).status).toBe(403);
      expect((await post([shown], { origin: 'chrome-extension://storeid' })).status).toBe(200);
      expect((await post([shown], { origin: 'moz-extension://anything' })).status).toBe(200);
    } finally {
      env.ALLOWED_ORIGINS = '';
    }
  });

  it('refuses bodies that are not a JSON array of at most 500 events', async () => {
    expect((await post('not json')).status).toBe(400);
    expect((await post({ event: 'install' })).status).toBe(400);
    expect((await post(Array(501).fill(shown))).status).toBe(400);
    // Over 256 KB, also when no content-length says so up front.
    expect((await post(`[${' '.repeat(300 * 1024)}]`)).status).toBe(400);
    expect((await post([shown], { type: 'text/plain' })).status).toBe(415);
    expect((await post([shown], { path: '/' })).status).toBe(404);
    expect(rows).toHaveLength(0);
  });

  it('uses the IP address only as the rate limit key, and never stores it', async () => {
    const request = new Request('https://counts.example.workers.dev/events', {
      method: 'POST',
      headers: { origin: 'moz-extension://x', 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7' },
      body: JSON.stringify([shown]),
    });
    const read = [];
    const original = request.headers.get.bind(request.headers);
    request.headers.get = (name) => {
      read.push(name.toLowerCase());
      return original(name);
    };
    const keys = [];
    const limited = { ...env, RATE_LIMIT: { limit: async ({ key }) => (keys.push(key), { success: true }) } };
    expect((await worker.fetch(request, limited)).status).toBe(200);
    expect(read.filter((name) => !['origin', 'content-type', 'content-length', 'cf-connecting-ip'].includes(name))).toEqual([]);
    expect(keys).toEqual(['203.0.113.7']);
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain('203.0.113.7');
  });

  it('refuses an upload over the rate limit and stores nothing', async () => {
    const request = new Request('https://counts.example.workers.dev/events', {
      method: 'POST',
      headers: { origin: 'moz-extension://x', 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7' },
      body: JSON.stringify([shown]),
    });
    const limited = { ...env, RATE_LIMIT: { limit: async () => ({ success: false }) } };
    const response = await worker.fetch(request, limited);
    expect(response.status).toBe(429);
    expect(response.headers.get('access-control-allow-origin')).toBe('moz-extension://x');
    expect(rows).toHaveLength(0);
  });
});
