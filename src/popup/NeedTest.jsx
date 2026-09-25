// The need test screen (F9, HANDOFF section 8): a few questions from the phone's reasons, then
// keep, repair or upgrade with the checks listed. The logic is in lib/needtest.js.

import { useEffect, useRef, useState } from 'preact/hooks';
import { APP_NAME } from '../config.js';
import { todayIso } from '../lib/calc.js';
import { productFor } from '../lib/eol.js';
import { recordEvent } from '../lib/events.js';
import { formatMonthYear, t } from '../lib/i18n.js';
import { needQuestions, needResult } from '../lib/needtest.js';
import { getDevice, saveDevice } from '../lib/storage.js';
import { AlertIcon, ArrowUpIcon, BackIcon, CheckIcon, CrossIcon, QuestionIcon, WrenchIcon } from '../ui/icons.jsx';
import { Choice } from '../ui/Rating.jsx';

const YES_NO = [
  { value: true, label: t('yes') },
  { value: false, label: t('no') },
];

export function NeedTestView({ device, onBack, onPause, onSetReasons }) {
  const [outcome, setOutcome] = useState(null);
  const heading = useRef(null);
  useEffect(() => heading.current?.focus(), [outcome]);

  async function finish(answers) {
    const result = needResult(device, answers, todayIso());
    // Battery health is a manual entry in Stage 1; keep it for the bar's card and the next test.
    if (typeof answers.battery === 'number') {
      const current = await getDevice();
      if (current) await saveDevice({ ...current, batteryHealthPct: answers.battery });
    }
    await recordEvent('need_test_result', { result: result.result });
    setOutcome(result);
  }

  return (
    <main class="pop">
      <header class="pop-header pop-header-back">
        <button type="button" class="icon-btn" aria-label={t('back')} onClick={onBack}>
          <BackIcon />
        </button>
        <h1>{t('needTitle')}</h1>
      </header>
      {outcome ? (
        <NeedResult device={device} outcome={outcome} heading={heading} onDone={onBack} onPause={onPause} />
      ) : (
        <NeedQuestions device={device} heading={heading} onFinish={finish} onSetReasons={onSetReasons} />
      )}
      <p class="need-footnote">{t('needFootnote')}</p>
    </main>
  );
}

// ---- Questions

function NeedQuestions({ device, heading, onFinish, onSetReasons }) {
  const questions = needQuestions(device);
  const [answers, setAnswers] = useState({});
  const [battery, setBattery] = useState(device.batteryHealthPct != null ? String(device.batteryHealthPct) : '');
  const [batteryUnknown, setBatteryUnknown] = useState(false);
  const set = (id) => (value) => setAnswers((current) => ({ ...current, [id]: value }));

  const pct = Number(battery);
  const batteryValid = battery.trim() !== '' && Number.isInteger(pct) && pct >= 1 && pct <= 100;
  const complete = questions.every((id) =>
    id === 'battery' ? batteryValid || batteryUnknown : typeof answers[id] === 'boolean',
  );

  function submit(event) {
    event.preventDefault();
    if (!complete) return;
    const battery = questions.includes('battery') && !batteryUnknown ? pct : null;
    onFinish({ ...answers, battery });
  }

  return (
    <form class="need" onSubmit={submit}>
      <h2 ref={heading} tabIndex={-1} class="need-intro">
        {t('needIntro')}
      </h2>
      {!device.reasons?.length && (
        <div class="notice">
          <p>{t('needNoReasons')}</p>
          <button type="button" class="link-btn" onClick={onSetReasons}>
            {t('ruleSetReasons')}
          </button>
        </div>
      )}
      {questions.map((id) =>
        id === 'battery' ? (
          <div class="field" key={id}>
            <label for="need-battery">{t('needQ_battery')}</label>
            <div class="battery-row">
              <input
                id="need-battery"
                class="num"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                maxLength={3}
                disabled={batteryUnknown}
                value={battery}
                aria-describedby="need-battery-hint"
                onInput={(e) => setBattery(e.currentTarget.value.replace(/[^\d]/g, ''))}
              />
              <span aria-hidden="true">%</span>
              <label class="check">
                <input type="checkbox" checked={batteryUnknown} onChange={(e) => setBatteryUnknown(e.currentTarget.checked)} />
                {t('needBatteryUnknown')}
              </label>
            </div>
            <p class="field-hint" id="need-battery-hint">
              {t('needBatteryHint')}
            </p>
          </div>
        ) : (
          <div class="field" key={id}>
            <div class="field-label" id={`need-${id}`}>
              {t(`needQ_${id}`)}
            </div>
            <Choice name={`need-${id}`} options={YES_NO} value={answers[id]} onChange={set(id)} labelledBy={`need-${id}`} />
          </div>
        ),
      )}
      <button type="submit" class="btn btn-primary btn-block" disabled={!complete}>
        {t('needSeeResult')}
      </button>
    </form>
  );
}

// ---- Result

const RESULT_ICONS = { keep: CheckIcon, repair: WrenchIcon, upgrade: ArrowUpIcon };
const STATUS_ICONS = { ok: CheckIcon, warn: AlertIcon, bad: CrossIcon, unknown: QuestionIcon };

function NeedResult({ device, outcome, heading, onDone, onPause }) {
  const { result, checks, passed, known } = outcome;
  const Icon = RESULT_ICONS[result];
  return (
    <section class="need">
      <div class="need-head">
        <div class={`need-badge need-${result}`}>
          <Icon size={22} weight={2.6} />
        </div>
        <div>
          <h2 ref={heading} tabIndex={-1} class="need-verdict">
            {t(`needResult_${result}`)}
          </h2>
          <p class="need-summary">{t('needPassed', passed, known)}</p>
        </div>
      </div>

      <ul class="need-checks">
        {checks.map((check) => {
          const StatusIcon = STATUS_ICONS[check.status];
          return (
            <li class={`need-check need-check-${check.status}`}>
              <span class="need-check-icon" role="img" aria-label={t(`needStatus_${check.status}`)}>
                <StatusIcon size={18} />
              </span>
              <div>
                <div class="need-check-title">{t(`needCheck_${check.id}`)}</div>
                <div class="need-check-detail">{checkDetail(check, device)}</div>
                {check.androidEndDate && <div class="need-check-detail">{androidNote(check)}</div>}
              </div>
            </li>
          );
        })}
      </ul>

      {result === 'upgrade' && <UpgradeAdvice checks={checks} onPause={onPause} />}
      {result === 'repair' && <RepairAdvice checks={checks} device={device} />}
      {result === 'keep' && <FeelNew device={device} />}

      <button type="button" class="btn btn-secondary btn-block" onClick={onDone}>
        {t('done')}
      </button>
    </section>
  );
}

function checkDetail(check, device) {
  if (check.status === 'unknown') {
    if (check.id === 'updates') return productFor(device.name) === 'iphone' ? t('eolNoDateAppleShort') : t('needUpdates_unknown');
    if (check.id === 'slow') return t('needSlow_checkBattery');
    return t('needNotChecked');
  }
  switch (check.id) {
    case 'updates':
      return check.ended ? t('needUpdates_ended', formatMonthYear(check.date)) : t('needUpdates_until', formatMonthYear(check.date));
    case 'battery':
      return t(`needBattery_${check.note}`, check.pct);
    case 'slow':
      return t(`needSlow_${check.note}`);
    case 'storage':
      return t(`needStorage_${check.note}`);
    default:
      // apps, screen, damage, camera
      return t(`need_${check.id}_${check.status}`);
  }
}

// New Android versions often stop long before security updates do (research A10).
function androidNote(check) {
  const android = formatMonthYear(check.androidEndDate);
  const security = formatMonthYear(check.date);
  return check.androidEndDate <= todayIso() ? t('needAndroidStopped', android, security) : t('needAndroidUntil', android, security);
}

function UpgradeAdvice({ checks, onPause }) {
  const updatesEnded = checks.some((check) => check.id === 'updates' && check.upgrade);
  const appsBlocked = checks.some((check) => check.id === 'apps' && check.upgrade);
  const [paused, setPaused] = useState(false);
  return (
    <div class="need-advice">
      {updatesEnded && <p>{t('needUpgradeUpdates')}</p>}
      {appsBlocked && <p>{t('needUpgradeApps')}</p>}
      {paused ? (
        <p class="need-done" aria-live="polite">
          {t('needPausedWeek', APP_NAME)}
        </p>
      ) : (
        <button
          type="button"
          class="btn btn-secondary btn-block"
          onClick={async () => {
            await onPause('week');
            setPaused(true);
          }}
        >
          {t('needUpgradePause', APP_NAME)}
        </button>
      )}
    </div>
  );
}

function RepairAdvice({ checks, device }) {
  const battery = checks.some((check) => (check.id === 'battery' || check.id === 'slow') && check.note === 'below');
  const part = battery ? 'battery' : '';
  const guide = `https://www.ifixit.com/Search?query=${encodeURIComponent(`${device.name} ${part}`.trim())}`;
  return (
    <div class="need-advice">
      <p>{battery ? t('needRepairBattery') : t('needRepairOther')}</p>
      <div class="need-links">
        <a href={guide} target="_blank" rel="noopener noreferrer">
          {t('needRepairGuide')}
        </a>
        <a href={t('repairCafeUrl')} target="_blank" rel="noopener noreferrer">
          {t('needRepairCafe')}
        </a>
      </div>
    </div>
  );
}

// "Make it feel new" after a keep: what people on Reddit already do when the itch hits (A10).
// Static copy; the review link is a plain search, with no tracking.
function FeelNew({ device }) {
  const review = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${device.name} review`)}`;
  return (
    <div class="need-advice">
      <h3>{t('needFeelNewTitle')}</h3>
      <ul class="feel-new">
        <li>{t('needFeelNew_case')}</li>
        <li>{t('needFeelNew_wallpaper')}</li>
        <li>{t('needFeelNew_storage')}</li>
        <li>
          <a href={review} target="_blank" rel="noopener noreferrer">
            {t('needFeelNew_review')}
          </a>
        </li>
      </ul>
    </div>
  );
}
