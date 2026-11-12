// Everything the owner may still change before release (HANDOFF section 13).

// Working name. The other copy lives in _locales/*/messages.json as "appName";
// renaming means changing those and this constant, nothing else.
export const APP_NAME = 'Upgraditch';

// One web form serves the feedback link in the popup (V3), the survey opened on uninstall (V1)
// and "Share my stats" (V2), each with ?from= so a response shows where it came from. A web page
// opens in the browser the user is in; a mailto: link would open the system's mail handler.
// Empty: all three are off.
const FORM_URL = 'https://tally.so/r/ODvKap';
export const FEEDBACK_URL = FORM_URL && `${FORM_URL}?from=popup`;
export const SHARE_FORM_URL = FORM_URL && `${FORM_URL}?from=share`;
export const UNINSTALL_SURVEY_URL = FORM_URL && `${FORM_URL}?from=uninstall`;

// The phone page that "See it on a phone page" opens at the end of onboarding, so the first bar
// shows within a minute of installing. It must be a page lib/match.js calls a phone page, on a
// default site (tests/match.test.js checks both). A GSMArena device page: in English, and its
// address doesn't change. Empty: the button is left out.
export const DEMO_PAGE_URL = 'https://www.gsmarena.com/samsung_galaxy_s26_ultra_5g-14320.php';

// Endpoint for the opt-in anonymous counts (V4, V7). Empty: nothing is ever sent.
export const COUNTS_ENDPOINT = 'https://upgraditch-counts.e-s-hoogenraad.workers.dev/events';
