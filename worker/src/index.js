// The counts endpoint (V7): a Cloudflare Worker that stores the anonymous events the extension
// sends while a user has opted in (research/B4 Field study spec.md, "Endpoint").
//
// - POST a JSON array of events. Each event is checked against the schema; invalid ones are
//   dropped and counted, never stored.
// - Never stores IP addresses. The only client header read besides Origin and Content-Type is
//   CF-Connecting-IP, passed as the key to Cloudflare's rate limiter (RATE_LIMIT in
//   wrangler.toml) and nowhere else. Request logging is off in wrangler.toml.
// - Stores each row with the day it arrived (UTC), and nothing finer.
// - A batch comes from one install. Each install gets at most MAX_PER_CLIENT_DAY events a day,
//   so one script can't fill the table under a single client ID. An event sent twice (same
//   eventId) is stored once.

import { isValidEvent } from './validate.js';

const MAX_BYTES = 256 * 1024;
const MAX_EVENTS = 500;
// A heavy day of real use is a few dozen showings (two events each) and some urges.
const MAX_PER_CLIENT_DAY = 1000;

// Chrome's extension ID is fixed per store listing; Firefox gives each install a random one.
// ALLOWED_ORIGINS (comma-separated, optional) narrows Chrome to the listed IDs.
function allowedOrigin(origin, env) {
  if (!origin) return false;
  if (origin.startsWith('moz-extension://')) return true;
  if (!origin.startsWith('chrome-extension://')) return false;
  const listed = (env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return listed.length === 0 || listed.includes(origin);
}

function corsHeaders(origin) {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

function reply(status, body, origin) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...(origin ? corsHeaders(origin) : {}) },
  });
}

/** The body as text, or null once it passes MAX_BYTES (read in chunks, so never more than that). */
async function readBody(request) {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function readEvents(request) {
  const text = await readBody(request);
  if (text === null) return null;
  try {
    const events = JSON.parse(text);
    return Array.isArray(events) && events.length <= MAX_EVENTS ? events : null;
  } catch {
    return null;
  }
}

/** The row stored for a valid event: the common fields as columns, the rest as JSON. */
function toRow(event, receivedDay) {
  const { schemaVersion, clientId, eventId, build, browser, dayIndex, event: name, ...fields } = event;
  return [receivedDay, schemaVersion, clientId, eventId, build, browser, dayIndex, name, JSON.stringify(fields)];
}

// A script can make up a new client ID for every request, so the daily limit per install can't
// stop it; this limit per address can slow it down. The extension uploads at most once an hour
// and keeps what a 429 refused for the next try. No address (local dev) or no binding: no limit.
async function overRateLimit(request, env) {
  const ip = request.headers.get('cf-connecting-ip');
  if (!ip || !env.RATE_LIMIT) return false;
  try {
    const { success } = await env.RATE_LIMIT.limit({ key: ip });
    return !success;
  } catch {
    return false;
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin');
    if (!allowedOrigin(origin, env)) return reply(403, { error: 'origin' });
    if (request.method === 'OPTIONS') return reply(204, null, origin);
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/events') return reply(404, { error: 'not found' }, origin);
    if (!(request.headers.get('content-type') ?? '').startsWith('application/json')) return reply(415, { error: 'json' }, origin);
    if (await overRateLimit(request, env)) return reply(429, { error: 'rate' }, origin);

    const events = await readEvents(request);
    if (!events) return reply(400, { error: 'body' }, origin);

    const valid = events.filter(isValidEvent);
    // The extension sends each install's events on their own.
    if (new Set(valid.map((event) => event.clientId)).size > 1) return reply(400, { error: 'clients' }, origin);

    let stored = 0;
    if (valid.length) {
      const receivedDay = new Date().toISOString().slice(0, 10);
      const today = await env.DB.prepare('SELECT COUNT(*) AS n FROM events WHERE client_id = ? AND received_day = ?')
        .bind(valid[0].clientId, receivedDay)
        .first();
      const allowed = valid.slice(0, Math.max(0, MAX_PER_CLIENT_DAY - (today?.n ?? 0)));
      if (allowed.length) {
        const insert = env.DB.prepare(
          'INSERT OR IGNORE INTO events (received_day, schema_version, client_id, event_id, build, browser, day_index, event, fields) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        );
        const results = await env.DB.batch(allowed.map((event) => insert.bind(...toRow(event, receivedDay))));
        stored = results.reduce((sum, result) => sum + (result.meta?.changes ?? 0), 0);
      }
    }
    // Rejected: invalid, over the day's limit, or already stored.
    return reply(200, { stored, rejected: events.length - stored }, origin);
  },
};
