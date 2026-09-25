// Onboarding (F1, HANDOFF section 8), opened in a tab on install. The same page opens for a
// single step, with the hash naming the step:
//   #phone    edit the phone (from the popup)
//   #reasons  set the reasons (from the popup, and from the bar's "Set my reasons")
//   #sites    allow the default sites, after they were declined (from the popup)

import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import browser from 'webextension-polyfill';
import { APP_NAME } from '../config.js';
import { parsePrice, purchaseDateFor, todayIso } from '../lib/calc.js';
import { eolFields } from '../lib/eol.js';
import { detectBrowser } from '../lib/env.js';
import { recordEvent, setCountsOptIn } from '../lib/events.js';
import { formatMonthYear, locale, localizePage, t } from '../lib/i18n.js';
import { DEFAULT_ORIGINS, DEFAULT_SITES } from '../lib/match.js';
import { REASONS } from '../lib/reasons.js';
import { createInstall, getDevice, getInstall, newDevice, saveDevice, updateInstall } from '../lib/storage.js';
import { CheckIcon } from '../ui/icons.jsx';
import { Logo } from '../ui/Logo.jsx';
import '../styles/pages.css';
import './onboarding.css';

const STEPS = ['phone', 'reasons', 'sites'];

async function closeThisTab() {
  const tab = await browser.tabs.getCurrent();
  if (tab) await browser.tabs.remove(tab.id);
}

/** Moves focus to the step's heading when a step appears, so screen readers announce it. */
function useStepFocus() {
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);
  return ref;
}

function App({ single, initialDevice, initialInstall, initiallyGranted }) {
  const [device, setDevice] = useState(initialDevice);
  const [step, setStep] = useState(single ?? 'phone');
  const [granted, setGranted] = useState(initiallyGranted);

  async function savePhone(fields) {
    const next = device ? { ...device, ...fields } : newDevice(fields);
    await saveDevice(next);
    setDevice(next);
    if (single) await closeThisTab();
    else setStep('reasons');
  }

  async function saveReasons(reasons) {
    if (reasons) {
      const next = { ...device, reasons };
      await saveDevice(next);
      setDevice(next);
    }
    if (single) await closeThisTab();
    else setStep('sites');
  }

  async function finish() {
    if (single) return closeThisTab();
    const install = await getInstall();
    if (!install.onboardedAt) {
      await updateInstall({ onboardedAt: new Date().toISOString() });
      await recordEvent('onboarding_finished', { devices: 1, reasonsSet: device.reasons.length > 0 });
    }
    setStep('done');
  }

  const stepNumber = single || step === 'done' ? null : STEPS.indexOf(step) + 1;

  return (
    <main class="onb">
      <header class="onb-header">
        <Logo />
        {stepNumber && <div class="onb-step">{t('stepOf', stepNumber, STEPS.length)}</div>}
      </header>
      {step === 'phone' && <PhoneStep device={device} single={single} onSave={savePhone} />}
      {step === 'reasons' && <ReasonsStep device={device} single={single} onSave={saveReasons} />}
      {step === 'sites' && (
        <SitesStep
          single={single}
          granted={granted}
          onGranted={setGranted}
          countsOptIn={initialInstall.countsOptIn}
          onFinish={finish}
        />
      )}
      {step === 'done' && <DoneStep granted={granted} />}
    </main>
  );
}

// ---- Step 1: the phone

// Month and year only: most people don't remember the day (lib/calc.js, purchaseDateFor).
const FIRST_YEAR = 2007;

function validatePhone({ name, month, year, price }) {
  const errors = {};
  if (!name.trim()) errors.name = 'errPhoneName';
  const purchaseDate = month && year ? purchaseDateFor(Number(year), Number(month), todayIso()) : null;
  if (!purchaseDate) errors.date = month && year ? 'errPurchaseDateFuture' : 'errPurchaseDate';
  const amount = parsePrice(price);
  if (amount === null || amount > 100_000) errors.price = 'errPrice';
  return { errors, values: { name: name.trim(), purchaseDate, purchasePrice: amount } };
}

// The end of security updates, looked up on endoflife.date by the background script as the
// user types. Only the brand's list is fetched; the name is matched in this browser.
const lookupEol = (name) =>
  browser.runtime.sendMessage({ type: 'eolLookup', name }).catch(() => ({ status: 'offline' }));

/** The lookup for the name as typed; null while typing, or when nothing was found. */
function useEolLookup(name) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    // Never leave the answer for an earlier name on screen while the user types.
    setResult(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) return undefined;
    let current = true;
    const timer = setTimeout(() => {
      lookupEol(trimmed).then((found) => current && setResult(found.status === 'found' ? found : null));
    }, 400);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [name]);
  return result;
}

function monthNames() {
  const format = new Intl.DateTimeFormat(locale(), { month: 'long', timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, i) => format.format(new Date(Date.UTC(2000, i, 1))));
}

function PhoneStep({ device, single, onSave }) {
  const [name, setName] = useState(device?.name ?? '');
  const [year, setYear] = useState(device ? device.purchaseDate.slice(0, 4) : '');
  const [month, setMonth] = useState(device ? String(Number(device.purchaseDate.slice(5, 7))) : '');
  const [price, setPrice] = useState(device ? String(device.purchasePrice) : '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const eol = useEolLookup(name);
  const form = useRef(null);
  const nameInput = useRef(null);
  const thisYear = Number(todayIso().slice(0, 4));

  useEffect(() => nameInput.current?.focus(), []);

  async function submit(event) {
    event.preventDefault();
    const result = validatePhone({ name, month, year, price });
    setErrors(result.errors);
    if (Object.keys(result.errors).length) {
      // Focus the first field with an error once it is marked invalid.
      requestAnimationFrame(() => form.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    setSaving(true);
    // From the cache by now, so this is quick. Offline, the daily refresh fills the date in later.
    const found = await lookupEol(result.values.name);
    await onSave({ ...result.values, ...eolFields(found) });
    setSaving(false);
  }

  // A field's error goes as soon as the field changes; the rest wait for the next submit.
  const edit = (key, set) => (event) => {
    set(event.currentTarget.value);
    if (errors[key]) setErrors({ ...errors, [key]: null });
  };

  const fieldProps = (id, key) => ({
    id,
    'aria-invalid': String(Boolean(errors[key])),
    'aria-describedby': errors[key] ? `${id}-error` : undefined,
  });
  const error = (id, key) =>
    errors[key] && (
      <div class="field-error" id={`${id}-error`}>
        {t(errors[key])}
      </div>
    );

  return (
    <form class="onb-body" ref={form} onSubmit={submit} noValidate>
      <div class="onb-intro">
        <div class="eyebrow">{t('onbPhoneEyebrow')}</div>
        <h1>{t('onbPhoneTitle')}</h1>
      </div>
      <div class="onb-fields">
        <div class="field">
          <label for="phone-name">{t('onbPhoneName')}</label>
          <input
            {...fieldProps('phone-name', 'name')}
            ref={nameInput}
            type="text"
            autocomplete="off"
            spellcheck={false}
            maxLength={60}
            placeholder={t('onbPhoneNamePlaceholder')}
            value={name}
            onInput={edit('name', setName)}
          />
          {error('phone-name', 'name')}
          <div class="field-hint eol-found" aria-live="polite">
            {eol && t('eolFound', formatMonthYear(eol.securityEndDate), eol.label)}
          </div>
        </div>
        <fieldset class="field field-group">
          <legend class="field-label">{t('onbPurchaseDate')}</legend>
          <div class="field-row-2">
            <select
              {...fieldProps('purchase-month', 'date')}
              aria-label={t('onbPurchaseMonth')}
              value={month}
              onChange={edit('date', setMonth)}
            >
              <option value="">{t('onbPurchaseMonth')}</option>
              {monthNames().map((label, i) => (
                <option value={String(i + 1)}>{label}</option>
              ))}
            </select>
            <select
              id="purchase-year"
              aria-invalid={String(Boolean(errors.date))}
              aria-describedby={errors.date ? 'purchase-month-error' : undefined}
              aria-label={t('onbPurchaseYear')}
              value={year}
              onChange={edit('date', setYear)}
            >
              <option value="">{t('onbPurchaseYear')}</option>
              {Array.from({ length: thisYear - FIRST_YEAR + 1 }, (_, i) => String(thisYear - i)).map((y) => (
                <option value={y}>{y}</option>
              ))}
            </select>
          </div>
          {error('purchase-month', 'date')}
        </fieldset>
        <div class="field">
          <label for="price">{t('onbPrice')}</label>
          <input
            {...fieldProps('price', 'price')}
            class="num"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            value={price}
            onInput={edit('price', setPrice)}
          />
          {error('price', 'price')}
        </div>
      </div>
      <div class="onb-actions">
        <button type="submit" class="btn btn-primary btn-lg btn-block" disabled={saving}>
          {single ? t('save') : t('continue')}
        </button>
        <p class="onb-footnote">{t('onbPrivacy')}</p>
      </div>
    </form>
  );
}

// ---- Step 2: what would make you replace it

function ReasonsStep({ device, single, onSave }) {
  const [picked, setPicked] = useState(device?.reasons ?? []);
  const heading = useStepFocus();

  const toggle = (id) => setPicked((current) => (current.includes(id) ? current.filter((r) => r !== id) : [...current, id]));

  return (
    <div class="onb-body">
      <div class="onb-intro">
        <h1 ref={heading} tabIndex={-1} id="reasons-title">
          {t('onbReasonsTitle')}
        </h1>
        <p class="onb-helper">{t('onbReasonsHelper')}</p>
      </div>
      <div class="chips" role="group" aria-labelledby="reasons-title">
        {REASONS.map((id) => {
          const on = picked.includes(id);
          return (
            <button type="button" class="chip" aria-pressed={String(on)} onClick={() => toggle(id)}>
              {on && <CheckIcon />}
              {t(`reason_${id}`)}
            </button>
          );
        })}
      </div>
      <div class="onb-note">{t('onbReasonsNote')}</div>
      <div class="onb-actions">
        <button type="button" class="btn btn-primary btn-lg btn-block" onClick={() => onSave(REASONS.filter((r) => picked.includes(r)))}>
          {single ? t('save') : t('continue')}
        </button>
        {!single && (
          <button type="button" class="btn btn-ghost btn-block" onClick={() => onSave(null)}>
            {t('skipForNow')}
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Step 3: where Upgraditch shows up, and the counts opt-in

function SitesStep({ single, granted, onGranted, countsOptIn, onFinish }) {
  const [declined, setDeclined] = useState(false);
  const [counts, setCounts] = useState(countsOptIn);
  const heading = useStepFocus();

  function allowSites() {
    // First thing in the handler, with no await before it: the request needs the live user
    // gesture, and Firefox refuses it once an await has run. One prompt for all default sites.
    browser.permissions
      .request({ origins: DEFAULT_ORIGINS })
      .catch(() => false)
      .then(async (ok) => {
        onGranted(ok);
        setDeclined(!ok);
        await recordEvent('permission_result', {
          requested: DEFAULT_ORIGINS.length,
          granted: ok ? DEFAULT_ORIGINS.length : 0,
        });
        // The full flow moves on either way; the done screen and the popup offer the sites again.
        // Allowing them on their own (from the popup) stays here after a decline.
        if (ok || !single) await onFinish();
      });
  }

  function toggleCounts(event) {
    const on = event.currentTarget.checked;
    const result = setCountsOptIn(on); // first: Firefox shows its own consent prompt
    setCounts(on);
    result.then(setCounts, () => setCounts(false));
  }

  return (
    <div class="onb-body">
      <div class="onb-intro">
        <h1 ref={heading} tabIndex={-1}>
          {t('onbSitesTitle', APP_NAME)}
        </h1>
      </div>
      <ul class="site-list">
        {DEFAULT_SITES.map((site) => (
          <li>
            <span>{site.label}</span>
            <span class="site-host num">{site.host}</span>
          </li>
        ))}
      </ul>
      <p class="onb-helper">{t('onbSitesText', APP_NAME)}</p>
      {!single && (
        <section class="counts-box" aria-labelledby="counts-title">
          <h2 id="counts-title">{t('countsTitle')}</h2>
          <p>{t('countsText', APP_NAME)}</p>
          <label class="check">
            <input type="checkbox" checked={counts} onChange={toggleCounts} />
            {t('countsCheckbox')}
          </label>
        </section>
      )}
      <div class="onb-actions" aria-live="polite">
        {granted && (
          <div class="status-ok">
            <CheckIcon />
            {t('onbSitesGranted')}
          </div>
        )}
        {declined && <p class="onb-footnote">{t('onbSitesDeclined', APP_NAME)}</p>}
        {/* One action on this step: allowing the sites also finishes it. */}
        <button type="button" class="btn btn-primary btn-lg btn-block" onClick={granted ? onFinish : allowSites}>
          {granted ? t('done') : t('onbSitesAllow')}
        </button>
      </div>
    </div>
  );
}

// ---- Done

function DoneStep({ granted }) {
  const heading = useStepFocus();
  return (
    <div class="onb-body">
      <div class="onb-intro">
        <h1 ref={heading} tabIndex={-1}>
          {t('onbDoneTitle')}
        </h1>
        <p class="onb-helper">{granted ? t('onbDoneGranted', APP_NAME) : t('onbDoneDeclined', APP_NAME)}</p>
        <p class="onb-helper">{t('onbDonePin')}</p>
      </div>
      <div class="onb-actions">
        <button type="button" class="btn btn-primary btn-lg btn-block" onClick={closeThisTab}>
          {t('close')}
        </button>
      </div>
    </div>
  );
}

async function start() {
  localizePage('onbPageTitle', APP_NAME);
  const [device, install, granted] = await Promise.all([
    getDevice(),
    getInstall(),
    browser.permissions.contains({ origins: DEFAULT_ORIGINS }),
  ]);

  // Brave only identifies itself to pages, not to the background script, so check again here.
  const detected = await detectBrowser();
  let current = install ?? (await createInstall({ browser: detected }));
  if (current.browser !== detected) current = await updateInstall({ browser: detected });

  // A single step needs the phone to exist, except for allowing the sites.
  const hash = location.hash.slice(1);
  const single = STEPS.includes(hash) && (device || hash === 'sites') ? hash : null;

  render(
    <App single={single} initialDevice={device} initialInstall={current} initiallyGranted={granted} />,
    document.getElementById('app'),
  );
}

start();
