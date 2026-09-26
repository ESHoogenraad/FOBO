# Counts endpoint

A Cloudflare Worker with a D1 database. It receives the anonymous events that Upgraditch sends while a user has opted in to "Help test what works". The events and fields are defined in [research/B4 Field study spec.md](../research/B4%20Field%20study%20spec.md), and the tests are in [tests/worker.test.js](../tests/worker.test.js) (run with `npm test` from the repo root).

What it does:

- Accepts `POST /events` with a JSON array of up to 100 events.
- Checks each event against the schema in `src/validate.js`. An event with an unknown name, an unknown field, a wrong type or an out-of-range value is dropped and counted as rejected; the rest are stored.
- Stores an event sent twice (same `eventId`) once, takes one install's events per batch, and at most 1000 events per install a day. Bodies over 256 KB are refused.
- Answers CORS for extension origins: any `moz-extension://` origin (Firefox gives each install a random one) and `chrome-extension://` origins, which `ALLOWED_ORIGINS` can narrow to the store build.
- Stores at most `MAX_EVENTS_PER_DAY` events a day over all installs (`wrangler.toml`, default 10,000), counted in the `daily` table. Over it, uploads get `429` and the extension keeps them for later. D1's daily row-write limit covers the whole Cloudflare account, so without a cap one script could stop every database on it until midnight UTC.
- Refuses more than 2 uploads a minute from one IP address (`429`), using Cloudflare's rate limiting binding (`RATE_LIMIT` in `wrangler.toml`). The address is only the limiter's key: it is never stored or written anywhere else. The extension keeps refused events and tries again an hour later.
- Stores each event with the UTC day it arrived and nothing finer. It never stores IP addresses, and request logging is off (`wrangler.toml`).

## Deploy

Needs a Cloudflare account.

```sh
cd worker
npm install
npx wrangler login
npm run db:create        # prints a database_id: put it in wrangler.toml
npm run db:schema
npm run deploy           # prints the URL, e.g. https://upgraditch-counts.<you>.workers.dev
```

Then set `COUNTS_ENDPOINT` in `src/config.js` to that URL plus `/events`, and rebuild the extension. While it is empty, the extension sends nothing.

After the first Chrome Web Store upload, set `ALLOWED_ORIGINS` in `wrangler.toml` to `chrome-extension://<the store ID>` and deploy again.

**Deploy the Worker before the extension** whenever a release changes the events (a new event, field or headline in `EVENT_FIELDS`). The Worker answers `200` for a batch even when it rejects some events, and the extension then marks the whole batch as sent: events the old Worker doesn't know are lost, not retried.

Cloudflare's edge still sees the IP address of every request, as with any website. The Worker reads it only to pass it to the rate limiter, and nothing stores it.

## Abuse

The Origin check keeps browsers on other sites out, but any script can send a fake Origin header. The per-install daily limit stops one client ID from filling the table; it is best-effort, since uploads running at the same moment under one ID can each pass it by a batch. The rate limit per IP address slows down a script that makes up a new client ID for each request, but doesn't stop it: the limit is counted per Cloudflare location, and a script with many addresses gets around it. The daily cap bounds the damage: a flood can fill a day and hold real uploads back until the next one (the extension retries hourly), but it can't run up the account's D1 limits. The WAF rate limiting rules in the dashboard need a domain of your own on Cloudflare; they don't cover `workers.dev`. In the analysis, drop client IDs without an `install` event or with impossible sequences.

## Schema changes

`schema.sql` only creates what is missing, so `npm run db:schema` adds a new table (such as `daily`) to a live database without touching its rows. A database made before `event_id` existed needs it dropped and recreated (nothing is deployed with real data yet), or locally: delete `.wrangler/` and run `npm run db:schema:local` again.

## Try it locally

```sh
npm run db:schema:local
npm run dev
curl -X POST http://localhost:8787/events \
  -H 'origin: moz-extension://test' -H 'content-type: application/json' \
  -d '[{"schemaVersion":1,"clientId":"8f14e45f-ceea-467a-9575-7a3b2a2c2b0e","eventId":"b7d4c2a1-5e6f-4a8b-9c0d-1e2f3a4b5c6d","build":"0.1.0","browser":"firefox","dayIndex":0,"event":"install"}]'
```

## After the Stage 1 analysis

The research plan says to delete raw events and keep only totals. For example:

```sh
npx wrangler d1 execute upgraditch-counts --remote --command \
  "SELECT event, browser, COUNT(*) AS n FROM events GROUP BY event, browser"
# save that output, then:
npx wrangler d1 execute upgraditch-counts --remote --command "DELETE FROM events"
```
