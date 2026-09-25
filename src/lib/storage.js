// Typed wrappers around browser storage, and the schema migrations.
//
// storage.sync (small, follows the user to their other browsers):
//   settings  { pausedUntil, sitesOff, hiddenUntil, milestonesSeen, barTourDone }
//   devices   Device[]; Stage 1 shows and edits only the first. Beyond HANDOFF's Device:
//             androidEndDate and eolLabel, from the end-of-updates lookup (lib/eol.js)
//
// storage.local (this install only):
//   schemaVersion
//   install   { clientId, installedAt, browser, countsOptIn, countsFrom, countsSetup, onboardedAt,
//             statsPromptDone }. countsFrom and countsSetup: which events the counts may send (lib/events.js)
//             Identity and consent belong to one install: syncing them would give two browsers
//             the same client ID and carry an opt-in over to a browser where it was never given.
//   urge:<id>, cooldown:<id>, ev:<key>
//             One key per record, so the popup, the onboarding page, the content script and the
//             background script can all add records without overwriting each other's writes.
//   eolCache  endoflife.date responses, per product, for 7 days (lib/eol.js)

import browser from 'webextension-polyfill';

export const SCHEMA_VERSION = 1;

const { sync, local } = browser.storage;

// ---- Settings (sync)

const SETTINGS_DEFAULTS = { pausedUntil: null, sitesOff: [], hiddenUntil: {}, milestonesSeen: [], barTourDone: false };

export async function getSettings() {
  const { settings } = await sync.get('settings');
  return { ...SETTINGS_DEFAULTS, ...settings };
}

export async function updateSettings(patch) {
  const next = { ...(await getSettings()), ...patch };
  await sync.set({ settings: next });
  return next;
}

// ---- The phone (sync)

export async function getDevice() {
  const { devices = [] } = await sync.get('devices');
  return devices[0] ?? null;
}

export async function saveDevice(device) {
  await sync.set({ devices: [device] });
}

export function newDevice(fields) {
  return { id: crypto.randomUUID(), category: 'phone', maintenance: [], reasons: [], ...fields };
}

// ---- This install (local)

export async function getInstall() {
  const { install } = await local.get('install');
  return install ?? null;
}

export async function createInstall({ browser: browserName }) {
  const existing = await getInstall();
  if (existing) return existing;
  const install = {
    clientId: crypto.randomUUID(),
    installedAt: new Date().toISOString(),
    browser: browserName,
    countsOptIn: false,
    onboardedAt: null,
  };
  await local.set({ install });
  return install;
}

export async function updateInstall(patch) {
  const next = { ...(await getInstall()), ...patch };
  await local.set({ install: next });
  return next;
}

// ---- Records kept one per key (local)

async function getRecords(prefix, sortField) {
  const all = await local.get(null);
  return Object.keys(all)
    .filter((key) => key.startsWith(prefix))
    .map((key) => all[key])
    .sort((a, b) => a[sortField].localeCompare(b[sortField]));
}

async function patchRecord(key, patch) {
  const { [key]: record } = await local.get(key);
  if (!record) return null;
  const next = { ...record, ...patch };
  await local.set({ [key]: next });
  return next;
}

export const getUrges = () => getRecords('urge:', 'at');

export async function addUrge({ site, source, tag, note }) {
  const urge = { id: crypto.randomUUID(), at: new Date().toISOString(), site: site ?? null, source };
  if (tag) urge.tag = tag;
  if (note) urge.note = note;
  await local.set({ [`urge:${urge.id}`]: urge });
  return urge;
}

export const updateUrge = (id, patch) => patchRecord(`urge:${id}`, patch);

export const getCooldowns = () => getRecords('cooldown:', 'startedAt');

export async function saveCooldown(cooldown) {
  await local.set({ [`cooldown:${cooldown.id}`]: cooldown });
  return cooldown;
}

// ---- Migrations

// MIGRATIONS[n] upgrades stored data from schema n - 1 to n. Version 1 is the first schema,
// so there is nothing to migrate yet. Add the next one as `2: async () => { ... }`.
const MIGRATIONS = {};

export async function migrate() {
  const { schemaVersion = 0 } = await local.get('schemaVersion');
  for (let version = schemaVersion + 1; version <= SCHEMA_VERSION; version++) {
    await MIGRATIONS[version]?.();
  }
  if (schemaVersion !== SCHEMA_VERSION) await local.set({ schemaVersion: SCHEMA_VERSION });
}

export const updateCooldown = (id, patch) => patchRecord(`cooldown:${id}`, patch);
