// English renders with no missing message keys (HANDOFF section 12). Stage 1 ships English only.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAUSE_OPTIONS } from '../src/lib/calc.js';
import { OUTCOMES } from '../src/lib/cooldowns.js';
import { NEED_RESULTS } from '../src/lib/needtest.js';
import { REASONS, URGE_TAGS } from '../src/lib/reasons.js';

const root = join(import.meta.dirname, '..');
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const en = readJson('_locales/en/messages.json');

function sourceFiles(dir) {
  return readdirSync(join(root, dir), { recursive: true })
    .filter((file) => /\.(js|jsx)$/.test(file))
    .map((file) => readFileSync(join(root, dir, file), 'utf8'));
}

// Every key the code asks for: t('key'), localizePage('key'), and the per-option families.
function usedKeys() {
  const keys = new Set();
  for (const source of sourceFiles('src')) {
    for (const [, key] of source.matchAll(/\b(?:t|localizePage)\(\s*'([A-Za-z_]+)'/g)) keys.add(key);
  }
  REASONS.forEach((id) => keys.add(`reason_${id}`));
  URGE_TAGS.forEach((id) => keys.add(`urgeTag_${id}`));
  PAUSE_OPTIONS.forEach((id) => keys.add(`pause_${id}`));
  REASONS.forEach((id) => keys.add(`reasonPhrase_${id}`));
  OUTCOMES.forEach((id) => keys.add(`outcome_${id}`));
  OUTCOMES.forEach((id) => keys.add(`outcomeHint_${id}`));
  // The bar's first-run tour (content/BarView.jsx, TOUR_STEPS).
  ['toggle', 'closeTab', 'logUrge', 'cooldown', 'hide'].forEach((id) => ['tourTitle', 'tourText'].forEach((f) => keys.add(`${f}_${id}`)));
  ['One', 'Two', 'Many'].forEach((n) => keys.add(`headlineOwnRule${n}`));
  ['rule', 'urge', 'cooldown'].forEach((id) => keys.add(`cardHead_${id}`));
  ['updatesEnded', 'batteryWorn', 'slow', 'notYetOne', 'notYetMany', 'noData'].forEach((id) => keys.add(`ruleAdvice_${id}`));
  ['fine', 'near', 'below'].forEach((id) => keys.add(`tileBattery_${id}`));
  // Onboarding field errors, set by id.
  ['errPhoneName', 'errPurchaseDate', 'errPurchaseDateFuture', 'errPrice'].forEach((key) => keys.add(key));
  // The pin steps on the last onboarding screen, per browser.
  ['chrome', 'edge', 'firefox'].forEach((id) => keys.add(`onbPinStep2_${id}`));
  // The need test (popup/NeedTest.jsx).
  NEED_RESULTS.forEach((id) => keys.add(`needResult_${id}`));
  ['apps', 'screen', 'damage', 'camera', 'storage'].forEach((id) => keys.add(`needQ_${id}`));
  ['ok', 'warn', 'bad', 'unknown'].forEach((id) => keys.add(`needStatus_${id}`));
  ['updates', 'apps', 'battery', 'slow', 'screen', 'damage', 'camera', 'storage'].forEach((id) => keys.add(`needCheck_${id}`));
  ['fine', 'near', 'below'].forEach((id) => keys.add(`needBattery_${id}`));
  ['battery', 'notBattery', 'checkBattery'].forEach((id) => keys.add(`needSlow_${id}`));
  ['full', 'fine'].forEach((id) => keys.add(`needStorage_${id}`));
  ['apps', 'screen', 'damage', 'camera'].forEach((id) => ['ok', 'bad'].forEach((s) => keys.add(`need_${id}_${s}`)));
  const manifest = readFileSync(join(root, 'manifest.json'), 'utf8');
  for (const [, key] of manifest.matchAll(/__MSG_(\w+)__/g)) keys.add(key);
  return [...keys].sort();
}

describe('_locales', () => {
  it('has every key the code uses, in English', () => {
    const missing = usedKeys().filter((key) => !(key in en));
    expect(missing).toEqual([]);
  });

  it('defines every placeholder a message uses', () => {
    for (const key of Object.keys(en)) {
      for (const name of en[key].message.match(/\$\w+\$/g) ?? []) {
        expect(en[key].placeholders?.[name.slice(1, -1)], `${key} ${name}`).toBeDefined();
      }
    }
  });

  it('ships English only in Stage 1', () => {
    expect(readdirSync(join(root, '_locales'))).toEqual(['en']);
  });

  it('keeps the name in one place: no message spells it out except appName', () => {
    const name = en.appName.message;
    const offenders = Object.entries(en)
      .filter(([key, { message }]) => key !== 'appName' && message.includes(name))
      .map(([key]) => key);
    expect(offenders).toEqual([]);
  });
});
