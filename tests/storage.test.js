import { beforeEach, describe, expect, it } from 'vitest';
import {
  addUrge,
  createInstall,
  editDevice,
  getDevice,
  getInstall,
  getSettings,
  getSettingsAndDevice,
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

  it('computes a change from the current settings', async () => {
    await updateSettings({ sitesOff: ['bol'] });
    await updateSettings((current) => ({ sitesOff: [...current.sitesOff, 'coolblue'] }));
    expect((await getSettings()).sitesOff).toEqual(['bol', 'coolblue']);
  });

  it('never loses one of two changes made at once', async () => {
    await Promise.all([
      updateSettings((current) => ({ sitesOff: [...current.sitesOff, 'bol'] })),
      updateSettings((current) => ({ sitesOff: [...current.sitesOff, 'coolblue'] })),
      updateSettings({ barTourDone: true }),
    ]);
    expect(await getSettings()).toMatchObject({ sitesOff: ['bol', 'coolblue'], barTourDone: true });
  });

  it('keeps writing after a change that failed', async () => {
    await expect(
      updateSettings(() => {
        throw new Error('broken change');
      }),
    ).rejects.toThrow('broken change');
    await updateSettings({ pausedUntil: 'manual' });
    expect((await getSettings()).pausedUntil).toBe('manual');
  });

  it('stores one phone in sync storage', async () => {
    expect(await getDevice()).toBeNull();
    const phone = newDevice({ name: 'Pixel 7 Pro', purchaseDate: '2022-10-20', purchasePrice: 899 });
    expect(phone).toMatchObject({ category: 'phone', reasons: [], maintenance: [] });
    await saveDevice(phone);
    expect(await getDevice()).toEqual(phone);
    expect((await browser.storage.sync.get('devices')).devices).toHaveLength(1);
  });

  it('reads the settings and the phone together', async () => {
    expect(await getSettingsAndDevice()).toEqual([await getSettings(), null]);
    const phone = newDevice({ name: 'Pixel 7 Pro', purchaseDate: '2022-10-20', purchasePrice: 899 });
    await saveDevice(phone);
    await updateSettings({ barTourDone: true });
    const [settings, device] = await getSettingsAndDevice();
    expect(settings).toMatchObject({ barTourDone: true, sitesOff: [] });
    expect(device).toEqual(phone);
  });
});

describe('editing the phone', () => {
  const old = {
    ...newDevice({ name: 'Pixel 7 Pro', purchaseDate: '2022-10-15', purchasePrice: 899, reasons: ['battery'] }),
    batteryHealthPct: 76,
  };

  it('keeps the same phone when the purchase month stays', () => {
    const edited = editDevice(old, { name: 'Pixel 7 Pro (Obsidian)', purchaseDate: '2022-10-15', purchasePrice: 849 });
    expect(edited).toMatchObject({ id: old.id, name: 'Pixel 7 Pro (Obsidian)', purchasePrice: 849, batteryHealthPct: 76 });
  });

  it('keeps it too when the current month is saved on another day', () => {
    // purchaseDateFor gives today, not the 15th, in the current month.
    const recent = { ...old, purchaseDate: '2026-09-10' };
    expect(editDevice(recent, { name: 'Pixel 10', purchaseDate: '2026-09-15', purchasePrice: 899 }).id).toBe(old.id);
  });

  it('starts a new phone for a new purchase month, with the same reasons', () => {
    const edited = editDevice(old, { name: 'Pixel 10', purchaseDate: '2026-09-15', purchasePrice: 899 });
    expect(edited.id).not.toBe(old.id);
    expect(edited).toMatchObject({ name: 'Pixel 10', reasons: ['battery'], maintenance: [] });
    expect(edited).not.toHaveProperty('batteryHealthPct');
  });

  it('creates the phone when there is none yet', () => {
    const edited = editDevice(null, { name: 'Pixel 10', purchaseDate: '2026-09-15', purchasePrice: 899 });
    expect(edited).toMatchObject({ category: 'phone', name: 'Pixel 10', reasons: [] });
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
