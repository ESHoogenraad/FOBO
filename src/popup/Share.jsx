// "Share my stats" (V2): shows the summary first, so the user sees exactly what they share,
// then copies it to the clipboard. Nothing is sent from here: the user pastes it into the
// feedback form themselves.

import { useEffect, useRef, useState } from 'preact/hooks';
import browser from 'webextension-polyfill';
import { APP_NAME, SHARE_FORM_URL } from '../config.js';
import { EOL_CACHE_KEY } from '../lib/eol.js';
import { t } from '../lib/i18n.js';
import { collectStats } from '../lib/stats.js';
import { updateInstall } from '../lib/storage.js';
import { BackIcon } from '../ui/icons.jsx';

export function ShareView({ onBack }) {
  const [text, setText] = useState(null);
  const [copied, setCopied] = useState(false);
  const heading = useRef(null);

  useEffect(() => {
    collectStats().then((stats) => setText(JSON.stringify(stats, null, 2)));
    // Opening it answers the day-14 prompt.
    updateInstall({ statsPromptDone: true });
    heading.current?.focus();
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main class="pop">
      <header class="pop-header pop-header-back">
        <button type="button" class="icon-btn" aria-label={t('back')} onClick={onBack}>
          <BackIcon />
        </button>
        <h1 ref={heading} tabIndex={-1}>
          {t('shareTitle')}
        </h1>
      </header>
      <p class="setting-text">{t('shareText')}</p>
      {text && (
        <pre class="share-json num" tabIndex={0} aria-label={t('shareTitle')}>
          {text}
        </pre>
      )}
      {/* The button says it was copied, so no status line holds a gap open below it; the
          hidden line announces it to screen readers. */}
      <button type="button" class="btn btn-primary btn-block" disabled={!text} onClick={copy}>
        {copied ? t('shareCopied') : t('shareCopy')}
      </button>
      <p class="visually-hidden" aria-live="polite">
        {copied ? t('shareCopied') : ''}
      </p>
      {SHARE_FORM_URL && (
        <a class="btn btn-secondary btn-block" href={SHARE_FORM_URL} target="_blank" rel="noopener noreferrer">
          {t('shareOpenForm')}
        </a>
      )}
    </main>
  );
}

/** Downloads everything Upgraditch stored in this browser as one JSON file (F11). */
export async function exportData() {
  const [sync, local] = await Promise.all([browser.storage.sync.get(null), browser.storage.local.get(null)]);
  delete local[EOL_CACHE_KEY]; // a copy of endoflife.date, not the user's data
  const data = { exportedAt: new Date().toISOString(), version: browser.runtime.getManifest().version, sync, local };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${APP_NAME.toLowerCase()}-data-${data.exportedAt.slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
