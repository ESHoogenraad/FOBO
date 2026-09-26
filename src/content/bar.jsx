// Content script (HANDOFF section 6), registered only for the sites the user allowed.
//
// On a page about phones it shows the bar in the bottom-left corner, inside a closed Shadow DOM
// so the page's styles and scripts can't reach it. It does nothing else: after rendering, the
// only work is noticing when a site changes pages without reloading, and putting the bar back
// when a page re-renders itself and takes it along. It never reads the page beyond its URL and
// title, and never sends anything anywhere.
//
// Each time the bar appears is a "showing" (B4 spec): bar_shown records the headline picked,
// bar_outcome what the user did with it, until the page changes or 30 minutes pass.

import { render } from 'preact';
import browser from 'webextension-polyfill';
import { hideSite, isHidden, isPaused, todayIso } from '../lib/calc.js';
import { newCooldown } from '../lib/cooldowns.js';
import { recordEvent, updateEvent } from '../lib/events.js';
import { eligibleHeadlines, headlineText, pickHeadline } from '../lib/headlines.js';
import { isOwnModel, matchPage, siteForHost, siteOf } from '../lib/match.js';
import { addUrge, getSettingsAndDevice, saveCooldown, updateSettings, updateUrge } from '../lib/storage.js';
import { Bar } from './BarView.jsx';
import css from './bar.css?inline';

const SHOWING_MS = 30 * 60 * 1000;

/**
 * The current showing, or null:
 * { id, url, match, device, tour, headline, headlineText, deviceMatched, host, outcomeKey }.
 * tour: show the first-run tour. headlineText is fixed when the showing starts, so the bar keeps
 * saying what bar_shown recorded even if the phone is edited meanwhile. outcomeKey is a promise
 * of the bar_outcome event's key, set right after the bar is drawn.
 */
let showing = null;
// Counts calls to update(), so an older call that is still reading storage gives way to a newer one.
let generation = 0;

// The page is its path: filters and sorting that only change the query string are the same
// page, so they keep the showing (B4 spec: a showing ends when the page navigates away).
const pageUrl = () => location.origin + location.pathname;

const readStorage = getSettingsAndDevice;

function blocked(settings, device, siteId) {
  return !device || isPaused(settings) || settings.sitesOff.includes(siteId) || isHidden(settings, siteId);
}

/**
 * Shows, keeps or removes the bar for the page as it is now. `stored` is a storage read that
 * is already under way, from when the page started loading.
 */
async function update(stored) {
  const run = ++generation;
  const url = pageUrl();
  const match = matchPage(url, document.title);
  if (!match) return endShowing();

  const [settings, device] = await (stored ?? readStorage());
  if (run !== generation) return;
  if (blocked(settings, device, match.site.id)) return endShowing();
  if (showing?.url === url) {
    // Same page, new data (the phone was edited): same showing, same headline.
    showing.device = device;
    return draw();
  }
  endShowing();
  startShowing(url, match, device, settings);
}

function startShowing(url, match, device, settings) {
  const eligible = eligibleHeadlines(device);
  const headline = pickHeadline(eligible);
  showing = {
    id: crypto.randomUUID(),
    url,
    match,
    device,
    tour: !settings.barTourDone,
    headline,
    headlineText: headlineText(headline, device, todayIso()),
    deviceMatched: isOwnModel(device.name, match.item || document.title),
    host: mount(),
  };
  showing.host.keeper = keepAttached(showing.host.element);
  draw();

  // Recorded after the bar is on screen, so storage never delays it.
  const { id: showingId, deviceMatched } = showing;
  recordEvent('bar_shown', { showingId, siteCategory: match.site.siteCategory, headline, eligible, deviceMatched });
  showing.outcomeKey = recordEvent(
    'bar_outcome',
    { showingId, cardOpened: false, tabClosed: false, urgeLogged: false, cooldownStarted: false, dismissed: false },
    { holdUntil: Date.now() + SHOWING_MS },
  );
}

function endShowing() {
  if (!showing) return;
  showing.host.keeper.disconnect();
  render(null, showing.host.root);
  showing.host.element.remove();
  showing = null;
}

// ---- Drawing

let fontsLoaded = false;

/** The bundled fonts, under names of their own so they never change how the page looks. */
function loadFonts() {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const faces = [
    ['Plus Jakarta Sans (bar)', 'assets/plus-jakarta-sans.woff2', '200 800'],
    ['JetBrains Mono (bar)', 'assets/jetbrains-mono.woff2', '100 800'],
  ];
  try {
    for (const [family, file, weight] of faces) {
      const face = new FontFace(family, `url("${browser.runtime.getURL(file)}")`, { weight, display: 'swap' });
      document.fonts.add(face);
      face.load().catch(() => {}); // Without the font, the bar uses the system font.
    }
  } catch {
    // Same: the system font.
  }
}

function mount() {
  loadFonts();
  // An element of its own, placed over the page with no layout effect. Its inline styles win
  // over any page style, and it takes no space, so it never blocks clicks outside the bar.
  const element = document.createElement('phone-check-bar');
  element.style.cssText =
    'all: initial !important; position: fixed !important; top: 0 !important; left: 0 !important; ' +
    'width: 0 !important; height: 0 !important; z-index: 2147483647 !important; display: block !important;';
  const shadow = element.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = css;
  const root = document.createElement('div');
  shadow.append(style, root);
  // First in the page, so it is first when tabbing too, not behind every link on the page.
  (document.body ?? document.documentElement).prepend(element);
  return { element, root };
}

// Some pages re-render the whole document after loading and remove every node they didn't make,
// the bar too: Coolblue's Next.js pages clear <body> a second or two in. Watching only the direct
// children of <html> and <body>, not the page below them, is enough to notice and put it back.
// The cap stops a tug of war with a page that keeps removing it.
const REATTACH_MAX = 5;
function keepAttached(element) {
  let reattached = 0;
  const observer = new MutationObserver(() => {
    if (element.isConnected) return;
    if (++reattached > REATTACH_MAX) return observer.disconnect();
    (document.body ?? document.documentElement).prepend(element);
    if (document.body) observer.observe(document.body, { childList: true }); // the body may be new
  });
  observer.observe(document.documentElement, { childList: true });
  if (document.body) observer.observe(document.body, { childList: true });
  return observer;
}

function draw() {
  const { device, headlineText, deviceMatched, match, tour } = showing;
  render(
    <Bar device={device} headlineText={headlineText} deviceMatched={deviceMatched} item={match.item} tour={tour} actions={actions} />,
    showing.host.root,
  );
}

// ---- What the bar's buttons do

/** Marks an outcome of the current showing. Resolves once it is stored. */
async function flag(name) {
  const key = await showing?.outcomeKey;
  if (key) await updateEvent(key, { [name]: true });
}

const actions = {
  cardOpened: () => flag('cardOpened'),

  async closeTab() {
    await flag('tabClosed');
    await browser.runtime.sendMessage({ type: 'closeTab' });
  },

  /** Hides the bar on this site for 24 hours. */
  async hide() {
    const site = showing?.match.site;
    if (!site) return; // the showing ended between drawing and the click
    await flag('dismissed');
    endShowing();
    await updateSettings((settings) => ({ hiddenUntil: hideSite(settings.hiddenUntil, site.id) }));
  },

  /** Logs an urge with one tap; the reason tag can follow. */
  async logUrge(source) {
    const urge = await addUrge({ site: siteOf(location.href), source });
    const eventKey = await recordEvent('urge_logged', { source, reasonTag: null });
    flag('urgeLogged');
    return { urgeId: urge.id, eventKey };
  },

  async tagUrge({ urgeId, eventKey }, tag) {
    await updateUrge(urgeId, { tag });
    if (eventKey) await updateEvent(eventKey, { reasonTag: tag });
  },

  async startCooldown(fields) {
    const cooldown = await saveCooldown(newCooldown(fields));
    await recordEvent('cooldown_started', {
      cooldownId: cooldown.id,
      lengthDays: cooldown.days,
      wantStart: cooldown.wantRating,
    });
    flag('cooldownStarted');
    return cooldown;
  },

  setReasons: () => browser.runtime.sendMessage({ type: 'openOnboarding', step: 'reasons' }),

  /** The tour was finished, skipped or cut short by using the bar: never show it again. */
  async tourDone() {
    if (showing) showing.tour = false;
    await updateSettings({ barTourDone: true });
  },
};

// ---- Watching for changes

// Sites that change pages without reloading update the title a moment after the URL, and the
// title decides on product pages. So after a URL change, wait for the title to change too, for
// up to two seconds. A newer URL change replaces the wait for an older one.
let lastUrl = pageUrl();
let titleWait;
function onNavigate() {
  if (pageUrl() === lastUrl) return;
  lastUrl = pageUrl();
  endShowing();
  clearInterval(titleWait);
  const title = document.title;
  let checks = 0;
  titleWait = setInterval(() => {
    if (document.title !== title || ++checks >= 8) {
      clearInterval(titleWait);
      update();
    }
  }, 250);
}

if (siteForHost(location.hostname)) {
  // The script runs as the page starts loading (document_start). Reading storage then means
  // the bar is ready as soon as the page is parsed; on heavy pages, reading it at that point
  // instead waits behind the page's own scripts.
  const stored = readStorage();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => update(stored), { once: true });
  } else {
    update(stored);
  }

  // The Navigation API reports every URL change. Browsers without it get a cheap check each second.
  if (globalThis.navigation?.addEventListener) globalThis.navigation.addEventListener('navigatesuccess', onNavigate);
  else setInterval(onNavigate, 1000);
  window.addEventListener('popstate', onNavigate);

  // Pause, sites switched off, hidden in another tab, or the phone edited.
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && (changes.settings || changes.devices)) update();
  });
}
