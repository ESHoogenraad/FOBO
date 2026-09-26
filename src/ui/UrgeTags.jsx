// After an urge is logged (the bar, its card, or the popup): the optional one-tap reason tag.
// Never asks why they want to buy (HANDOFF section 6, item 9). The caller supplies the live
// region around it.

import { useState } from 'preact/hooks';
import { t } from '../lib/i18n.js';
import { URGE_TAGS } from '../lib/reasons.js';

export function UrgeTags({ onPick, titleClass }) {
  const [tag, setTag] = useState(null);

  function pick(id) {
    setTag(id);
    onPick(id);
  }

  return (
    <>
      <p class={titleClass}>{tag ? t('temptedThanks') : t('temptedLogged')}</p>
      {!tag && (
        <div class="chips">
          {URGE_TAGS.map((id) => (
            <button key={id} type="button" class="chip" onClick={() => pick(id)}>
              {t(`urgeTag_${id}`)}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
