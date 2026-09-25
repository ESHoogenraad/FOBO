import { APP_NAME } from '../config.js';
import { CheckIcon } from './icons.jsx';

export function Logo() {
  return (
    <div class="logo">
      <div class="logo-badge">
        <CheckIcon />
      </div>
      <div class="logo-name">{APP_NAME}</div>
    </div>
  );
}
