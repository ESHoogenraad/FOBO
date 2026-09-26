// The bar and its card (HANDOFF section 6, items 4 to 12). A panel in the bottom-left corner:
// the phone and the headline, then "Close tab" (primary), "Log urge" and "Cooldown" as icon
// buttons, and hide. The phone and headline are one button that opens the card above: the
// own-rule check, the urge's reason tags, or the cooldown form. The first time the bar
// appears, a short tour points at each part.

import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { APP_NAME } from '../config.js';
import { parsePrice, todayIso } from '../lib/calc.js';
import { DEFAULT_COOLDOWN_DAYS, MAX_COOLDOWN_DAYS } from '../lib/cooldowns.js';
import { reasonsPhrase } from '../lib/headlines.js';
import { formatDayMonth, formatMonthYear, formatNumber, t } from '../lib/i18n.js';
import { ownRule } from '../lib/rule.js';
import { ChevronIcon, CloseIcon, HourglassIcon, NoteIcon } from '../ui/icons.jsx';
import { Rating } from '../ui/Rating.jsx';
import { UrgeTags } from '../ui/UrgeTags.jsx';

/** The tour's steps, in order: each points at the part of the bar with the same name. */
export const TOUR_STEPS = ['toggle', 'closeTab', 'logUrge', 'cooldown', 'hide'];

export function Bar({ device, headlineText, deviceMatched, item, tour, light, actions }) {
  const [panel, setPanel] = useState(null); // null | "rule" | "urge" | "cooldown"
  const [urge, setUrge] = useState(null);
  const [tourStep, setTourStep] = useState(tour ? 0 : null);
  const bar = useRef(null);
  const targets = { toggle: useRef(null), closeTab: useRef(null), logUrge: useRef(null), cooldown: useRef(null), hide: useRef(null) };
  const today = todayIso();

  function endTour() {
    if (tourStep === null) return undefined;
    setTourStep(null);
    return actions.tourDone();
  }

  // Using any part of the bar ends the tour: they have found their way.
  function open(next) {
    endTour();
    setPanel(next);
    if (next === 'rule') actions.cardOpened();
  }

  function close() {
    // Focus goes back to the bar's button only if it was in the bar, never away from the page.
    const focusInBar = Boolean(targets.toggle.current?.getRootNode().activeElement);
    setPanel(null);
    if (focusInBar) targets.toggle.current.focus();
  }

  // One urge per click: a double click must not log two.
  const logging = useRef(false);
  async function logUrge(source) {
    if (logging.current) return;
    logging.current = true;
    endTour();
    try {
      setUrge(await actions.logUrge(source));
      open('urge');
    } finally {
      logging.current = false;
    }
  }

  // Close and hide: the tour's settings write finishes first, because closing the tab would cut
  // it off halfway.
  function act(action) {
    return async () => {
      await endTour();
      action();
    };
  }

  // Escape closes the card or the tour, also when focus is on the page: a click doesn't always
  // focus the button (Firefox and Safari on macOS don't), and some sites move focus themselves.
  // Listened for before the page sees it, because some sites (bol) cancel every Escape; the
  // page still gets the key.
  const listening = panel !== null || tourStep !== null;
  useEffect(() => {
    if (!listening) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (panel) close();
      else endTour();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [panel, tourStep]);

  const touring = (id) => (tourStep !== null && TOUR_STEPS[tourStep] === id ? ' tour-target' : '');

  return (
    <div class={light ? 'root theme-light' : 'root'}>
      <section class="bar" aria-label={APP_NAME} ref={bar}>
        <button
          ref={targets.toggle}
          type="button"
          class={`bar-toggle${touring('toggle')}`}
          aria-expanded={panel === 'rule'}
          aria-controls="card"
          onClick={() => (panel === 'rule' ? close() : open('rule'))}
        >
          <span class="bar-phone">
            <span class="device-dot" aria-hidden="true" />
            <span class="bar-name">{device.name}</span>
            {deviceMatched && <span class="tag">{t('barOnThisPage')}</span>}
          </span>
          <span class="bar-headline">{headlineText}</span>
          <ChevronIcon open={panel === 'rule'} />
        </button>
        <div class="bar-actions">
          <button ref={targets.closeTab} type="button" class={`btn btn-primary bar-close${touring('closeTab')}`} onClick={act(actions.closeTab)}>
            {t('closeTab')}
          </button>
          <button
            ref={targets.logUrge}
            type="button"
            class={`btn btn-secondary btn-icon btn-tint bar-urge${touring('logUrge')}`}
            aria-label={t('logUrge')}
            title={t('logUrge')}
            onClick={() => logUrge('bar')}
          >
            <NoteIcon />
          </button>
          <button
            ref={targets.cooldown}
            type="button"
            class={`btn btn-secondary btn-icon btn-tint bar-cooldown${touring('cooldown')}`}
            aria-label={t('cooldown')}
            title={t('cooldown')}
            onClick={() => open('cooldown')}
          >
            <HourglassIcon />
          </button>
          <button
            ref={targets.hide}
            type="button"
            class={`icon-btn${touring('hide')}`}
            aria-label={t('barHide')}
            title={t('barHide')}
            onClick={act(actions.hide)}
          >
            <CloseIcon />
          </button>
        </div>
      </section>

      {tourStep !== null && !panel && (
        <TourTip
          step={tourStep}
          bar={bar}
          target={targets[TOUR_STEPS[tourStep]]}
          onNext={() => (tourStep + 1 < TOUR_STEPS.length ? setTourStep(tourStep + 1) : endTour())}
          onSkip={endTour}
        />
      )}

      {panel && (
        <section class="card" id="card" aria-labelledby="card-head">
          <div class="card-head">
            <div id="card-head">
              <span class="device-dot" aria-hidden="true" />
              <span class="card-device">{device.name}</span> · {t(`cardHead_${panel}`)}
            </div>
            <button type="button" class="icon-btn" aria-label={t('collapse')} onClick={close}>
              <ChevronIcon open />
            </button>
          </div>
          {panel === 'rule' && (
            <RulePanel device={device} today={today} actions={actions} onSomethingElse={() => logUrge('card')} />
          )}
          {panel === 'urge' && <UrgePanel urge={urge} actions={actions} />}
          {panel === 'cooldown' && <CooldownPanel item={item} actions={actions} />}
        </section>
      )}
    </div>
  );
}

// ---- The first-run tour: one tip at a time, above the bar, its arrow on the part it explains.
// It never takes focus from the page; its buttons come right after the bar's when tabbing.

function TourTip({ step, bar, target, onNext, onSkip }) {
  const [place, setPlace] = useState(null);
  const id = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;

  // Centred on the target but inside the window; again when the window is resized. The tip sits
  // in the bar's column, so its left is measured from the bar.
  useLayoutEffect(() => {
    function measure() {
      const barBox = bar.current?.getBoundingClientRect();
      const box = target.current?.getBoundingClientRect();
      if (!barBox || !box) return;
      const width = Math.min(320, window.innerWidth - 16);
      const center = box.left + box.width / 2;
      const left = Math.min(Math.max(center - width / 2, 8), window.innerWidth - width - 8);
      setPlace({ left: left - barBox.left, width, arrow: center - left });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [step]);

  if (!place) return null;
  return (
    <section
      class="tour"
      aria-live="polite"
      aria-labelledby="tour-title"
      style={{ left: `${place.left}px`, width: `${place.width}px`, '--arrow': `${place.arrow}px` }}
    >
      <p class="tour-step">{t('tourStep', step + 1, TOUR_STEPS.length)}</p>
      <p class="tour-title" id="tour-title">
        {t(`tourTitle_${id}`)}
      </p>
      <p class="tour-text">{t(`tourText_${id}`, APP_NAME)}</p>
      <div class="tour-actions">
        {!last && (
          <button type="button" class="btn btn-ghost" onClick={onSkip}>
            {t('tourSkip')}
          </button>
        )}
        <button type="button" class="btn btn-primary" onClick={onNext}>
          {last ? t('gotIt') : t('tourNext')}
        </button>
      </div>
    </section>
  );
}

// ---- The own-rule check

function RulePanel({ device, today, actions, onSomethingElse }) {
  const rule = ownRule(device, today);
  if (!rule) {
    return (
      <>
        <h2>{t('ruleNoneTitle')}</h2>
        <p class="card-text">{t('ruleNoneText')}</p>
        <button type="button" class="btn btn-device btn-block" onClick={actions.setReasons}>
          {t('ruleSetReasons')}
        </button>
      </>
    );
  }
  return (
    <>
      <h2>{t('ruleQuestion', reasonsPhrase(rule.reasons))}</h2>
      {rule.tiles.length > 0 && (
        <div class="tiles">
          {rule.tiles.map((tile) => (
            <Tile key={tile.id} tile={tile} />
          ))}
        </div>
      )}
      <p class="card-text">{t(`ruleAdvice_${rule.advice}`)}</p>
      <div class="card-actions">
        <button type="button" class="btn btn-primary" onClick={actions.closeTab}>
          {t('closeTab')}
        </button>
        <button type="button" class="btn btn-secondary" onClick={onSomethingElse}>
          {t('ruleSomethingElse')}
        </button>
      </div>
    </>
  );
}

function Tile({ tile }) {
  let label, value, note;
  if (tile.id === 'battery') {
    label = t('reason_battery');
    value = `${tile.pct}%`;
    note = t(`tileBattery_${tile.note}`);
  } else {
    label = t('tileUpdates');
    value = tile.ended ? t('tileEnded') : t('tileDays', formatNumber(tile.days));
    note = tile.ended ? t('tileUpdatesSince', formatMonthYear(tile.date)) : t('tileUpdatesUntil', formatMonthYear(tile.date));
  }
  return (
    <div class={`tile tile-${tile.status}`}>
      <div class="tile-label">{label}</div>
      <div class="tile-value">{value}</div>
      <div class="tile-note">{note}</div>
    </div>
  );
}

// ---- After "Log urge" or "Something else": the optional reason tag.

function UrgePanel({ urge, actions }) {
  return (
    <div aria-live="polite" class="panel">
      <UrgeTags titleClass="card-title" onPick={(tag) => urge && actions.tagUrge(urge, tag)} />
    </div>
  );
}

// ---- Cooldown: item, optional price, how much they want it, and for how long

function validateCooldown({ item, price, want, days }) {
  const errors = {};
  if (!item.trim()) errors.item = 'errCooldownItem';
  const amount = price.trim() ? parsePrice(price) : null;
  if (price.trim() && (amount === null || amount > 100_000)) errors.price = 'errCooldownPrice';
  if (!want) errors.want = 'errCooldownWant';
  const length = Number(days);
  if (!Number.isInteger(length) || length < 1 || length > MAX_COOLDOWN_DAYS) errors.days = 'errCooldownDays';
  return { errors, values: { item: item.trim().slice(0, 120), price: amount ?? undefined, wantRating: want, days: length } };
}

function CooldownPanel({ item: prefill, actions }) {
  const [item, setItem] = useState(prefill);
  const [price, setPrice] = useState('');
  const [want, setWant] = useState(null);
  const [days, setDays] = useState(String(DEFAULT_COOLDOWN_DAYS));
  const [errors, setErrors] = useState({});
  const [started, setStarted] = useState(null);
  const first = useRef(null);
  const saving = useRef(false);

  useEffect(() => first.current?.focus(), []);

  async function submit(event) {
    event.preventDefault();
    if (saving.current) return; // a double click starts one cooldown
    const result = validateCooldown({ item, price, want, days });
    setErrors(result.errors);
    if (Object.keys(result.errors).length) return;
    saving.current = true;
    try {
      setStarted(await actions.startCooldown(result.values));
    } finally {
      saving.current = false;
    }
  }

  if (started) {
    return (
      <div aria-live="polite" class="panel">
        <p class="card-title">{t('cooldownStarted', formatDayMonth(started.endsOn))}</p>
        <p class="card-text">{t('cooldownStartedHint', APP_NAME)}</p>
        <button type="button" class="btn btn-primary btn-block" onClick={actions.closeTab}>
          {t('closeTab')}
        </button>
      </div>
    );
  }

  const invalid = (key) => ({
    'aria-invalid': String(Boolean(errors[key])),
    'aria-describedby': errors[key] ? `cd-${key}-error` : undefined,
  });
  const error = (key) =>
    errors[key] && (
      <div class="field-error" id={`cd-${key}-error`}>
        {t(errors[key])}
      </div>
    );

  return (
    <form class="panel" onSubmit={submit} noValidate>
      <div class="field">
        <label for="cd-item">{t('cooldownItem')}</label>
        <input ref={first} id="cd-item" type="text" value={item} onInput={(e) => setItem(e.currentTarget.value)} {...invalid('item')} />
        {error('item')}
      </div>
      <div class="field-row">
        <div class="field">
          <label for="cd-price">{t('cooldownPrice')}</label>
          <input id="cd-price" type="text" inputMode="decimal" value={price} onInput={(e) => setPrice(e.currentTarget.value)} {...invalid('price')} />
          {error('price')}
        </div>
        <div class="field">
          <label for="cd-days">{t('cooldownDays')}</label>
          <input id="cd-days" type="number" min="1" max={MAX_COOLDOWN_DAYS} value={days} onInput={(e) => setDays(e.currentTarget.value)} {...invalid('days')} />
          {error('days')}
        </div>
      </div>
      <div class="field">
        <div class="field-label" id="cd-want-label">
          {t('cooldownWant')}
        </div>
        <Rating name="cd-want" value={want} onChange={setWant} labelledBy="cd-want-label" />
        {error('want')}
      </div>
      <button type="submit" class="btn btn-primary btn-block">
        {t('cooldownStart')}
      </button>
    </form>
  );
}
