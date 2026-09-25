// Everything the owner may still change before release (HANDOFF section 13).

// Working name. The other copy lives in _locales/*/messages.json as "appName";
// renaming means changing those and this constant, nothing else.
export const APP_NAME = 'Upgraditch';

// One-question survey opened when the extension is uninstalled (V1). Empty: no page opens.
export const UNINSTALL_SURVEY_URL = '';

// Always-visible feedback link in the popup (V3). Empty: the link is hidden.
export const FEEDBACK_URL = `mailto:e.s.hoogenraad@gmail.com?subject=${encodeURIComponent(`${APP_NAME} feedback`)}`;

// Endpoint for the opt-in anonymous counts (V4, V7). Empty: nothing is ever sent.
export const COUNTS_ENDPOINT = 'https://upgraditch-counts.e-s-hoogenraad.workers.dev/events';
