// Popup (F7): the phone summary, milestones (F10), the cooling-down list with its end screen (F6),
// "This page tempted me" (F8), the need test (F9), "Share my stats" (V2) and the feedback link
// (V3). Settings: pause (F13), sites on/off, the counts switch (V4) and the data export (F11).

import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import browser from 'webextension-polyfill';
import { APP_NAME, FEEDBACK_URL } from '../config.js';
import {
  costPerMonth,
  dayIndex,
  daysOwned,
  daysToEol,
  isPaused,
  lifespanUsed,
  moneyNotSpent,
  PAUSE_OPTIONS,
  pausedUntilFor,
  todayIso,
} from '../lib/calc.js';
import { endCooldown, isDue, isOpen, OUTCOMES } from '../lib/cooldowns.js';
import { EOL_CACHE_KEY } from '../lib/eol.js';
import { isEventKey, recordEvent, updateEvent } from '../lib/events.js';
import { currentMilestone, milestoneKey } from '../lib/milestones.js';
import {
  formatDateTime,
  formatDate,
  formatDayMonth,
  formatEur,
  formatMonthYear,
  formatNumber,
  localizePage,
  t,
} from '../lib/i18n.js';
import { DEFAULT_ORIGINS, DEFAULT_SITES, siteOf } from '../lib/match.js';
import { urgePatterns } from '../lib/stats.js';
import {
  addUrge,
  getCooldowns,
  getInstall,
  getSettingsAndDevice,
  getUrges,
  saveCooldown,
  updateInstall,
  updateSettings,
  updateUrge,
} from '../lib/storage.js';
import { BackIcon, CartIcon, CartOffIcon, HourglassIcon, SettingsIcon } from '../ui/icons.jsx';
import { Logo } from '../ui/Logo.jsx';
import { Rating } from '../ui/Rating.jsx';
import { UrgeTags } from '../ui/UrgeTags.jsx';
import { useCountsSwitch } from '../ui/useCountsSwitch.js';
import { NeedTestView } from './NeedTest.jsx';
import { exportData, ShareView } from './Share.jsx';
import '../styles/pages.css';
import './popup.css';

async function loadState() {
  const [[settings, device], install, granted, urges, cooldowns] = await Promise.all([
    getSettingsAndDevice(),
    getInstall(),
    browser.permissions.contains({ origins: DEFAULT_ORIGINS }),
    getUrges(),
    getCooldowns(),
  ]);
  const month = todayIso().slice(0, 7);
  const urgesThisMonth = urges.filter((urge) => urge.at.slice(0, 7) === month).length;
  return { device, settings, install, granted, urgesThisMonth, patterns: urgePatterns(urges), cooldowns };
}

function openOnboarding(step) {
  const url = browser.runtime.getURL('onboarding/onboarding.html') + (step ? `#${step}` : '');
  browser.tabs.create({ url });
  window.close();
}

async function setPause(option) {
  const pausedUntil = option ? pausedUntilFor(option) : null;
  await updateSettings({ pausedUntil });
  await recordEvent('paused', { on: Boolean(pausedUntil) });
}

function App() {
  const [state, setState] = useState(null);
  // "main", "settings", "needTest", "share", or a cooldown to end: { cooldownId }
  const [view, setView] = useState('main');

  useEffect(() => {
    // Only the newest read is shown: reads that overlap can finish in any order.
    let latest = 0;
    const reload = () => {
      const run = ++latest;
      loadState().then((next) => run === latest && setState(next));
    };
    // Also picks up changes made elsewhere, like Firefox's data consent granted after the popup
    // asked. Event records (written by the bar in every tab) and the endoflife.date cache change
    // nothing shown here.
    const onChanged = (changes) => {
      if (Object.keys(changes).some((key) => !isEventKey(key) && key !== EOL_CACHE_KEY)) reload();
    };
    reload();
    browser.storage.onChanged.addListener(onChanged);
    return () => browser.storage.onChanged.removeListener(onChanged);
  }, []);

  if (!state) return null;
  const back = () => setView('main');
  if (view === 'settings') return <SettingsView state={state} onBack={back} />;
  if (view === 'share') return <ShareView onBack={back} />;
  if (view === 'needTest' && state.device) {
    return (
      <NeedTestView device={state.device} onBack={back} onPause={setPause} onSetReasons={() => openOnboarding('reasons')} />
    );
  }
  const ending = view.cooldownId && state.cooldowns.find((c) => c.id === view.cooldownId);
  if (ending) return <CooldownEndView cooldown={ending} onDone={back} />;
  return <MainView state={state} setView={setView} />;
}

// ---- Main view

function MainView({ state, setView }) {
  const { device, settings, granted, install } = state;
  const today = todayIso();
  const milestone = device && currentMilestone(device, today, settings.milestonesSeen);
  // V2: ask once, from day 14, unless the stats were already shared.
  const askStats = install && !install.statsPromptDone && dayIndex(install.installedAt) >= 14;
  return (
    <main class="pop">
      <header class="pop-header">
        <Logo />
        <button type="button" class="icon-btn" aria-label={t('settingsTitle')} onClick={() => setView('settings')}>
          <SettingsIcon />
        </button>
      </header>

      {device ? (
        <PhoneSummary device={device} urgesThisMonth={state.urgesThisMonth} patterns={state.patterns} />
      ) : (
        <section class="notice">
          <h2>{t('popupSetupTitle')}</h2>
          <p>{t('popupSetupText', APP_NAME)}</p>
          <button type="button" class="btn btn-primary btn-block" onClick={() => openOnboarding()}>
            {t('popupSetupButton')}
          </button>
        </section>
      )}

      {device && !granted && (
        <section class="notice">
          <p>{t('popupSitesMissing', APP_NAME)}</p>
          <button type="button" class="btn btn-secondary btn-block" onClick={() => openOnboarding('sites')}>
            {t('popupSitesAllow')}
          </button>
        </section>
      )}

      {isPaused(settings) && (
        <section class="notice notice-row">
          <p>{pausedText(settings)}</p>
          <button type="button" class="btn btn-secondary" onClick={() => setPause(null)}>
            {t('resume')}
          </button>
        </section>
      )}

      {milestone && (
        <Milestone device={device} milestone={milestone} onNeedTest={() => setView('needTest')} />
      )}

      {askStats && (
        <section class="notice">
          <p>{t('statsPrompt')}</p>
          <div class="pause-options">
            <button type="button" class="btn btn-secondary" onClick={() => setView('share')}>
              {t('shareTitle')}
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => updateInstall({ statsPromptDone: true })}>
              {t('notNow')}
            </button>
          </div>
        </section>
      )}

      <Cooldowns cooldowns={state.cooldowns} onEnd={(cooldownId) => setView({ cooldownId })} />

      <div class="pop-actions">
        <Tempted primary={Boolean(device)} />
        {device && (
          <button type="button" class="btn btn-secondary btn-block" onClick={() => setView('needTest')}>
            {t('needRun')}
          </button>
        )}
      </div>

      <footer class="pop-links">
        <button type="button" class="link-btn" onClick={() => setView('share')}>
          {t('shareTitle')}
        </button>
        {FEEDBACK_URL && (
          <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
            {t('feedback')}
          </a>
        )}
      </footer>
    </main>
  );
}

// The urge log, read back (F5): this month's count, then what tempts them most so far, which
// the tour promises. Only tagged urges count toward the reasons.
function UrgeSummary({ urgesThisMonth, patterns }) {
  const { tags, site } = patterns;
  if (!urgesThisMonth && !tags.length && !site) return null;
  const counted = (label, count) => `${label} (${formatNumber(count)})`;
  return (
    <div class="phone-urges">
      {urgesThisMonth > 0 && (
        <div class="urge-pill">{urgesThisMonth === 1 ? t('popupUrgesOne') : t('popupUrgesMany', urgesThisMonth)}</div>
      )}
      {(tags.length > 0 || site) && (
        <div class="urge-patterns">
          {tags.length > 0 && <div>{t('popupUrgeTags', tags.map(([tag, count]) => counted(t(`urgeTag_${tag}`), count)).join(', '))}</div>}
          {site && <div>{t('popupUrgeSite', counted(...site))}</div>}
        </div>
      )}
    </div>
  );
}

// ---- Milestones (F10): 2 to 5 years, and the end of security updates

function Milestone({ device, milestone, onNeedTest }) {
  const dismiss = () => updateSettings((settings) => ({ milestonesSeen: [...settings.milestonesSeen, milestoneKey(device, milestone)] }));
  let text;
  if (milestone.id === 'updatesEnded') text = t('milestoneUpdatesEnded', device.name, formatDate(milestone.date));
  else if (milestone.years === 2) text = t('milestoneYears2', device.name);
  else text = t('milestoneYears', String(milestone.years), device.name, formatEur(costPerMonth(device, todayIso())));
  // The 2-year milestone carries the battery and repair check; the end of updates, the need test.
  const action = milestone.years === 2 ? t('milestoneBatteryCheck') : milestone.id === 'updatesEnded' ? t('needRun') : null;
  return (
    <section class="notice milestone" aria-label={t('milestoneLabel')}>
      <p>{text}</p>
      <div class="pause-options">
        {action && (
          <button type="button" class="btn btn-secondary" onClick={onNeedTest}>
            {action}
          </button>
        )}
        <button type="button" class="btn btn-ghost" onClick={dismiss}>
          {t('gotIt')}
        </button>
      </div>
    </section>
  );
}

function pausedText(settings) {
  return settings.pausedUntil === 'manual'
    ? t('popupPausedManual')
    : t('popupPausedUntil', formatDateTime(settings.pausedUntil));
}

function PhoneSummary({ device, urgesThisMonth, patterns }) {
  const today = todayIso();
  const used = lifespanUsed(device, today);
  const eolDays = daysToEol(device, today);
  return (
    <section class="phone-card" aria-labelledby="phone-name">
      <div class="phone-head">
        <h2 id="phone-name" class="phone-name">
          <span class="device-dot" aria-hidden="true" />
          {device.name}
        </h2>
        <div class="phone-since">{t('popupSince', formatMonthYear(device.purchaseDate))}</div>
      </div>
      <div class="phone-cost">
        <span class="num phone-cost-value">{formatEur(costPerMonth(device, today))}</span>
        <span>{t('popupPerMonth')}</span>
      </div>
      <div class="phone-life">
        {used !== null && (
          <div
            class="lifespan"
            role="progressbar"
            aria-label={t('lifespanLabel')}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(used * 100)}
          >
            <div style={{ width: `${used * 100}%` }} />
          </div>
        )}
        <div class="phone-meta">
          <span>{t('popupDaysHeld', formatNumber(daysOwned(device, today)))}</span>
          {eolDays !== null &&
            (eolDays > 0 ? (
              <span>{t('popupSecurityUntil', formatMonthYear(device.securityEndDate))}</span>
            ) : (
              <span class="warn">{t('popupSecurityEnded', formatMonthYear(device.securityEndDate))}</span>
            ))}
        </div>
      </div>
      <UrgeSummary urgesThisMonth={urgesThisMonth} patterns={patterns} />
    </section>
  );
}

// ---- Cooling down (F6): quiet end dates, never a countdown

function Cooldowns({ cooldowns, onEnd }) {
  const today = todayIso();
  const open = cooldowns.filter(isOpen);
  const notSpent = moneyNotSpent(cooldowns);
  if (!open.length && !notSpent) return null;
  return (
    <section class="cooldowns" aria-labelledby="cooldowns-title">
      <h2 id="cooldowns-title">{t('coolingDown')}</h2>
      {open.length > 0 && (
        <ul class="cooldown-list">
          {open.map((cooldown) => {
            const due = isDue(cooldown, today);
            return (
              <li>
                {/* Opens the end screen: when the date has come, or to end it early. */}
                <button type="button" class={due ? 'cooldown-row cooldown-due' : 'cooldown-row'} onClick={() => onEnd(cooldown.id)}>
                  <span class="cooldown-item">{cooldown.item}</span>
                  <span class="cooldown-when">
                    {due ? t('cooldownDue') : t('cooldownCheckAgain', formatDayMonth(cooldown.endsOn))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {notSpent > 0 && (
        <p class="cooldown-saved">{t('moneyNotSpent', formatEur(notSpent, { whole: Number.isInteger(notSpent) }))}</p>
      )}
    </section>
  );
}

// Each answer has its own colour and icon, so they can't be mistaken for one another.
const OUTCOME_ICONS = { bought: CartIcon, dropped: CartOffIcon, expired: HourglassIcon };

// The end screen: first "Still want it?", and only then the rating given at the start. Showing
// the old rating afterwards is deliberate: people misremember earlier ratings as matching how
// they feel now (B4 spec, "Cooldown changes").
function CooldownEndView({ cooldown, onDone }) {
  const [wantEnd, setWantEnd] = useState(null);
  const [answered, setAnswered] = useState(false);
  const heading = useRef(null);
  const startDay = todayIso(new Date(cooldown.startedAt));

  useEffect(() => heading.current?.focus(), [answered]);

  // One answer per cooldown: a double click must not record two.
  const finishing = useRef(false);
  async function finish(outcome) {
    if (finishing.current) return;
    finishing.current = true;
    const { ended, event } = endCooldown(cooldown, { wantEnd, outcome }, todayIso());
    await saveCooldown(ended);
    await recordEvent('cooldown_ended', event);
    onDone();
  }

  return (
    <main class="pop">
      <header class="pop-header pop-header-back">
        <button type="button" class="icon-btn" aria-label={t('back')} onClick={onDone}>
          <BackIcon />
        </button>
        <h1>{t('coolingDown')}</h1>
      </header>

      {!answered ? (
        <section class="end-step">
          <h2 ref={heading} tabIndex={-1} id="want-end-label">
            {t('cooldownStillWant', cooldown.item)}
          </h2>
          <Rating name="want-end" value={wantEnd} onChange={setWantEnd} labelledBy="want-end-label" />
          <button type="button" class="btn btn-primary btn-block" disabled={!wantEnd} onClick={() => setAnswered(true)}>
            {t('continue')}
          </button>
        </section>
      ) : (
        <section class="end-step">
          <h2 ref={heading} tabIndex={-1}>
            {cooldown.item}
          </h2>
          <div class="want-compare">
            <div>
              <div class="want-label">{t('cooldownNow')}</div>
              <div class="want-value num">{wantEnd}</div>
            </div>
            <div>
              <div class="want-label">{t('cooldownThen', formatDayMonth(startDay))}</div>
              <div class="want-value num">{cooldown.wantRating}</div>
            </div>
          </div>
          <p class="end-question">{t('cooldownWhatNow')}</p>
          <div class="outcomes">
            {OUTCOMES.map((outcome) => {
              const Icon = OUTCOME_ICONS[outcome];
              const saves = outcome === 'dropped' && cooldown.price ? ` ${t('outcomeSaves', formatEur(cooldown.price, { whole: Number.isInteger(cooldown.price) }))}` : '';
              return (
                <button type="button" class={`outcome outcome-${outcome}`} onClick={() => finish(outcome)}>
                  <Icon />
                  <span>
                    <span class="outcome-label">{t(`outcome_${outcome}`)}</span>
                    <span class="outcome-hint">{t(`outcomeHint_${outcome}`) + saves}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

// "This page tempted me" (F8): logs the current site through activeTab. The site stays in this
// browser; it feeds the default site list at Checkpoint A and is never sent anywhere.
// Before setup, "Set up" is the one primary action, so this steps back to secondary.
function Tempted({ primary }) {
  const [logged, setLogged] = useState(null);

  const logging = useRef(false);
  async function logUrge() {
    if (logging.current) return; // one urge per click, also on a double click
    logging.current = true;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const urge = await addUrge({ site: siteOf(tab?.url), source: 'popup' });
    const eventKey = await recordEvent('urge_logged', { source: 'popup', reasonTag: null });
    setLogged({ urgeId: urge.id, eventKey });
  }

  async function pickTag(id) {
    await updateUrge(logged.urgeId, { tag: id });
    if (logged.eventKey) await updateEvent(logged.eventKey, { reasonTag: id });
  }

  if (!logged) {
    return (
      <button type="button" class={`btn ${primary ? 'btn-primary btn-lg' : 'btn-secondary'} btn-block`} onClick={logUrge}>
        {t('tempted')}
      </button>
    );
  }
  return (
    <section class="tempted" aria-live="polite">
      <UrgeTags onPick={pickTag} />
    </section>
  );
}

// ---- Settings view

function SettingsView({ state, onBack }) {
  const { device, settings, install, granted } = state;
  const [counts, toggleCounts] = useCountsSwitch(install?.countsOptIn ?? false);

  function toggleSite(id, on) {
    updateSettings((current) => {
      const others = current.sitesOff.filter((s) => s !== id);
      return { sitesOff: on ? others : [...others, id] };
    });
  }

  return (
    <main class="pop">
      <header class="pop-header pop-header-back">
        <button type="button" class="icon-btn" aria-label={t('back')} onClick={onBack}>
          <BackIcon />
        </button>
        <h1>{t('settingsTitle')}</h1>
      </header>

      <section class="setting">
        <h2>{t('pauseTitle', APP_NAME)}</h2>
        <p class="setting-text">{t('pauseText')}</p>
        {isPaused(settings) ? (
          <div class="notice-row">
            <p>{pausedText(settings)}</p>
            <button type="button" class="btn btn-secondary" onClick={() => setPause(null)}>
              {t('resume')}
            </button>
          </div>
        ) : (
          <div class="pause-options">
            {PAUSE_OPTIONS.map((option) => (
              <button type="button" class="btn btn-secondary" onClick={() => setPause(option)}>
                {t(`pause_${option}`)}
              </button>
            ))}
          </div>
        )}
      </section>

      <section class="setting">
        <h2>{t('sitesTitle', APP_NAME)}</h2>
        {!granted && (
          <div class="notice-row">
            <p class="setting-text">{t('sitesNotAllowed')}</p>
            <button type="button" class="btn btn-secondary" onClick={() => openOnboarding('sites')}>
              {t('popupSitesAllow')}
            </button>
          </div>
        )}
        {DEFAULT_SITES.map((site) => (
          <label class="switch">
            <span>{site.label}</span>
            <input
              type="checkbox"
              role="switch"
              disabled={!granted}
              checked={granted && !settings.sitesOff.includes(site.id)}
              onChange={(e) => toggleSite(site.id, e.currentTarget.checked)}
            />
          </label>
        ))}
      </section>

      <section class="setting">
        <h2>{t('countsTitle')}</h2>
        <label class="switch">
          <span>{t('countsCheckbox')}</span>
          <input type="checkbox" role="switch" checked={counts} onChange={toggleCounts} />
        </label>
        <p class="setting-text">{t('countsShort')}</p>
      </section>

      <section class="setting">
        <h2>{t('dataTitle')}</h2>
        <p class="setting-text">{t('dataText')}</p>
        <div class="pause-options">
          <button type="button" class="btn btn-secondary" onClick={exportData}>
            {t('exportData')}
          </button>
        </div>
      </section>

      {device && (
        <section class="setting">
          <h2>{t('phoneTitle')}</h2>
          <div class="pause-options">
            <button type="button" class="btn btn-secondary" onClick={() => openOnboarding('phone')}>
              {t('editPhone')}
            </button>
            <button type="button" class="btn btn-secondary" onClick={() => openOnboarding('reasons')}>
              {t('editReasons')}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

localizePage('appName');
render(<App />, document.getElementById('app'));
