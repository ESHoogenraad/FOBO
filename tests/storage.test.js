import { beforeEach, describe, expect, it } from 'vitest';
import {
  addUrge,
  createInstall,
  getDevice,
  getInstall,
  getSettings,
  getUrges,
  migrate,
  newDevice,
  saveDevice,
  SCHEMA_VERSION,
  updateSettings,
  updateUrge,
} from '../src/lib/storage.js';
import browser, { resetBrowser } from './fake-browser.js';

beforeEach(resetBrowser);

describe('migrations', () => {
  it('stamps a fresh install with the current schema version', async () => {
    await migrate();
    expect(await browser.storage.local.get('schemaVersion')).toEqual({ schemaVersion: SCHEMA_VERSION });
  });

  it('leaves data alone when already current', async () => {
    await browser.storage.local.set({ schemaVersion: SCHEMA_VERSION, install: { clientId: 'x' } });
    await migrate();
    expect(await getInstall()).toEqual({ clientId: 'x' });
  });
});

describe('install record', () => {
  it('is created once, with a random client ID and the counts off', async () => {
    const first = await createInstall({ browser: 'brave' });
    const second = await createInstall({ browser: 'chrome' });
    expect(second).toEqual(first);
    expect(first.clientId).toMatch(/^[0-9a-f-]{36}$/);
    expect(first).toMatchObject({ browser: 'brave', countsOptIn: false, onboardedAt: null });
  });

  it('lives in local storage, not sync', async () => {
    await createInstall({ browser: 'chrome' });
    expect(await browser.storage.sync.get(null)).toEqual({});
  });
});

describe('settings and the phone', () => {
  it('fills in defaults and keeps other fields on update', async () => {
    expect(await getSettings()).toEqual({ pausedUntil: null, sitesOff: [], hiddenUntil: {}, milestonesSeen: [], barTourDone: false });
    await updateSettings({ sitesOff: ['bol'] });
    await updateSettings({ pausedUntil: 'manual' });
    expect(await getSettings()).toEqual({ pausedUntil: 'manual', sitesOff: ['bol'], hiddenUntil: {}, milestonesSeen: [], barTourDone: false });
  });

  it('stores one phone in sync storage', async () => {
    expect(await getDevice()).toBeNull();
    const phone = newDevice({ name: 'Pixel 7 Pro', purchaseDate: '2022-10-20', purchasePrice: 899 });
    expect(phone).toMatchObject({ category: 'phone', reasons: [], maintenance: [] });
    await saveDevice(phone);
    expect(await getDevice()).toEqual(phone);
    expect((await browser.storage.sync.get('devices')).devices).toHaveLength(1);
  });
});

describe('urges', () => {
  it('are kept one per key, in the order they happened, and take a tag afterwards', async () => {
    const first = await addUrge({ site: 'tweakers.net', source: 'bar' });
    await new Promise((resolve) => setTimeout(resolve, 2));
    const second = await addUrge({ site: null, source: 'popup' });
    await updateUrge(second.id, { tag: 'launch_hype' });

    const urges = await getUrges();
    expect(urges.map((u) => u.id)).toEqual([first.id, second.id]);
    expect(urges[1]).toMatchObject({ source: 'popup', site: null, tag: 'launch_hype' });
    expect(urges[0]).not.toHaveProperty('tag');
  });
});
