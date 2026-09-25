// Background script: a service worker in Chrome, an event page in Firefox (same file).
// Listeners are registered at the top level, so they are in place whenever the script wakes up.

import browser from 'webextension-polyfill';
import { UNINSTALL_SURVEY_URL } from '../config.js';
import { todayIso } from '../lib/calc.js';
import { isDue } from '../lib/cooldowns.js';
import { currentMilestone } from '../lib/milestones.js';
import { detectBrowser } from '../lib/env.js';
import { eolFields, lookupEol } from '../lib/eol.js';
import { dataConsentChange, pruneEvents, recordEvent, saveCountsOptIn, uploadPending } from '../lib/events.js';
import { SITES } from '../lib/match.js';
import { createInstall, getCooldowns, getDevice, getSettings, migrate, saveDevice } from '../lib/storage.js';

const ALARMS = {
  upload: { periodInMinutes: 60 }, // V4: at most one batch an hour
  housekeeping: { periodInMinutes: 24 * 60 },
  badge: { periodInMinutes: 60 }, // end dates and milestones arrive at midnight, not on a storage change
};

async function ensureAlarms() {
  for (const [name, schedule] of Object.entries(ALARMS)) {
    if (!(await browser.alarms.get(name))) await browser.alarms.create(name, schedule);
  }
}

// ---- The bar's content script (HANDOFF section 4)

// Registered only for the sites the user allowed. The script starts as the page starts loading
// (document_start), reads storage while the page loads, and shows the bar at DOMContentLoaded.
const CONTENT_SCRIPT = {
  id: 'bar',
  js: ['content/bar.js'],
  runAt: 'document_start',
  allFrames: false,
  persistAcrossSessions: true,
};

/** Registers, updates or removes the content script to match the granted site permissions. */
async function syncContentScript() {
  const { origins = [] } = await browser.permissions.getAll();
  const matches = SITES.map((site) => site.origin).filter((origin) => origins.includes(origin));
  const [registered] = await browser.scripting.getRegisteredContentScripts({ ids: [CONTENT_SCRIPT.id] });

  if (!matches.length) {
    if (registered) await browser.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT.id] });
  } else if (!registered) {
    await browser.scripting.registerContentScripts([{ ...CONTENT_SCRIPT, matches }]);
  } else if (
    registered.runAt !== CONTENT_SCRIPT.runAt ||
    [...registered.matches].sort().join() !== [...matches].sort().join()
  ) {
    await browser.scripting.updateContentScripts([{ ...CONTENT_SCRIPT, matches }]);
  }
}

// ---- Toolbar badge: cooldowns whose end date has come, and a new milestone
// (no notifications permission)

async function updateBadge() {
  const today = todayIso();
  const [cooldowns, device, settings] = await Promise.all([getCooldowns(), getDevice(), getSettings()]);
  const milestone = device && currentMilestone(device, today, settings.milestonesSeen);
  const due = cooldowns.filter((cooldown) => isDue(cooldown, today)).length + (milestone ? 1 : 0);
  await browser.action.setBadgeText({ text: due ? String(due) : '' });
  if (due) {
    await browser.action.setBadgeBackgroundColor({ color: '#73DACA' }); // --brand
    await browser.action.setBadgeTextColor?.({ color: '#16161E' }); // --on-brand
  }
}

// ---- Lifecycle

browser.runtime.onInstalled.addListener(async ({ reason }) => {
  await migrate();
  if (reason === 'install') {
    await createInstall({ browser: await detectBrowser() });
    await recordEvent('install');
    await browser.tabs.create({ url: browser.runtime.getURL('onboarding/onboarding.html') });
  }
  // V1: one question when someone uninstalls. setUninstallURL persists, so setting it here is enough.
  if (UNINSTALL_SURVEY_URL) await browser.runtime.setUninstallURL(UNINSTALL_SURVEY_URL);
  await ensureAlarms();
  await syncContentScript();
  await updateBadge();
});

// Firefox doesn't keep alarms across restarts.
browser.runtime.onStartup.addListener(async () => {
  await ensureAlarms();
  await syncContentScript();
  await updateBadge();
});

browser.alarms.onAlarm.addListener(async ({ name }) => {
  if (name === 'upload') await uploadPending();
  if (name === 'housekeeping') {
    await pruneEvents();
    await refreshEol();
  }
  if (name === 'badge') await updateBadge();
});

browser.storage.onChanged.addListener(async (changes, area) => {
  const cooldownChanged = area === 'local' && Object.keys(changes).some((key) => key.startsWith('cooldown:'));
  const phoneChanged = area === 'sync' && (changes.devices || changes.settings);
  if (cooldownChanged || phoneChanged) await updateBadge();
});

// The site permissions change from onboarding, the popup, or the browser's own extension settings.
// Firefox: the data consent can also change in about:addons, or be granted while the popup that
// asked for it has already closed. Keep the opt-in switch in step with it.
browser.permissions.onAdded.addListener(async (permissions) => {
  if (dataConsentChange(permissions)) await saveCountsOptIn(true);
  if (permissions.origins?.length) await syncContentScript();
});
browser.permissions.onRemoved.addListener(async (permissions) => {
  if (dataConsentChange(permissions)) await saveCountsOptIn(false);
  if (permissions.origins?.length) await syncContentScript();
});

// ---- End of security updates (endoflife.date), refreshed daily from the 7-day cache.
// Picks up new dates, and iPhones once Apple's support has ended.

async function refreshEol() {
  const device = await getDevice();
  if (!device) return;
  const fields = eolFields(await lookupEol(device.name));
  if (Object.entries(fields).some(([key, value]) => (device[key] ?? null) !== value)) {
    await saveDevice({ ...device, ...fields });
  }
}

// ---- Requests from the extension's pages and the bar

const ONBOARDING_STEPS = ['reasons'];

browser.runtime.onMessage.addListener((message, sender) => {
  if (sender.id !== browser.runtime.id) return undefined;

  // From the onboarding page: all network requests stay in this one script.
  const fromPage = sender.url?.startsWith(browser.runtime.getURL(''));
  if (fromPage && message?.type === 'eolLookup' && typeof message.name === 'string') {
    return lookupEol(message.name.slice(0, 100));
  }

  // From the bar, which can't use the tabs API itself.
  if (!sender.tab) return undefined;
  if (message?.type === 'closeTab') return browser.tabs.remove(sender.tab.id);
  if (message?.type === 'openOnboarding' && ONBOARDING_STEPS.includes(message.step)) {
    const url = browser.runtime.getURL(`onboarding/onboarding.html#${message.step}`);
    return browser.tabs.create({ url, index: sender.tab.index + 1, openerTabId: sender.tab.id });
  }
  return undefined;
});
