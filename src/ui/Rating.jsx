// "How much do you want it?" from 1 to 10, as native radio buttons: arrow keys and screen
// readers work as with any radio group. Used when a cooldown starts (the bar) and ends (the popup).

import { t } from '../lib/i18n.js';

const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function Rating({ name, value, onChange, labelledBy }) {
  return (
    <div>
      <div class="rating" role="radiogroup" aria-labelledby={labelledBy}>
        {VALUES.map((n) => (
          <label class="rating-option">
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} />
            <span class="num">{n}</span>
          </label>
        ))}
      </div>
      <p class="rating-hint">{t('ratingHint')}</p>
    </div>
  );
}

/** A short native radio group, drawn like the rating: yes / no, and the like. */
export function Choice({ name, options, value, onChange, labelledBy }) {
  return (
    <div class="rating choice" role="radiogroup" aria-labelledby={labelledBy}>
      {options.map((option) => (
        <label class="rating-option">
          <input type="radio" name={name} checked={value === option.value} onChange={() => onChange(option.value)} />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
