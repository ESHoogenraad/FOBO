// Promo images for the Chrome Web Store listing, written to store/ (see store/listing.md): the
// small tile (440x280) and the marquee (1400x560). Drawn from the name in src/config.js, the
// icon, the bundled font and the colours in src/styles/tokens.css, so a new name or colour only
// needs a rerun. No extension and no network.
//
//   node store-promo.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { APP_NAME } from '../src/config.js';
import { chromePath, log, root } from './lib.mjs';

const read = (file, encoding) => fs.readFileSync(path.join(root, file), encoding);
const tokens = read('src/styles/tokens.css', 'utf8');
const font = read('src/fonts/plus-jakarta-sans.woff2', 'base64');
const icon = read('src/icons/icon.svg', 'utf8').replace(/ width="\d+" height="\d+"/, '');

const VERDICTS = [
  ['Keep it.', '--ok'],
  ['Repair it.', '--warn'],
  ['Upgrade it.', '--device-1'],
];

const page = (width, height, body) => `<!doctype html><style>
${tokens}
@font-face { font-family: "Plus Jakarta Sans"; src: url(data:font/woff2;base64,${font}); font-weight: 200 800; }
html, body { margin: 0; }
body { width: ${width}px; height: ${height}px; box-sizing: border-box; display: flex; align-items: center;
  font-family: var(--font-ui); color: var(--text); background: linear-gradient(135deg, var(--bg-deep), var(--surface)); }
.logo { display: flex; align-items: center; }
.logo svg { display: block; }
.name { font-weight: 700; letter-spacing: -0.01em; text-transform: lowercase; }
.sub { color: var(--text-2); }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 24px; box-shadow: var(--shadow-card); }
.verdict { display: flex; align-items: center; font-weight: 700; }
.verdict + .verdict { border-top: 1px solid var(--line); }
.dot { border-radius: 50%; }
</style>${body}`;

const small = page(440, 280, `<div style="margin:auto;text-align:center">
  <div class="logo" style="justify-content:center;gap:14px">
    <div style="width:56px">${icon}</div><div class="name" style="font-size:44px">${APP_NAME}</div>
  </div>
  <div style="margin-top:22px;font-size:25px;font-weight:700">Should you replace your phone?</div>
  <div class="sub" style="margin-top:8px;font-size:19px">Keep it, repair it or upgrade.</div>
</div>`);

const marquee = page(1400, 560, `<div style="margin-left:120px;width:700px">
  <div class="logo" style="gap:18px">
    <div style="width:64px">${icon}</div><div class="name" style="font-size:50px">${APP_NAME}</div>
  </div>
  <div style="margin-top:44px;font-size:62px;line-height:1.1;font-weight:700;letter-spacing:-0.02em">Should you replace your phone?</div>
  <div class="sub" style="margin-top:20px;font-size:30px">An honest answer, right when you're tempted.</div>
</div>
<div class="card" style="margin-left:90px;width:370px;padding:8px 36px">
  ${VERDICTS.map(([text, colour]) => `<div class="verdict" style="gap:20px;padding:30px 0;font-size:38px">
    <span class="dot" style="width:18px;height:18px;background:var(${colour})"></span>${text}</div>`).join('')}
</div>`);

const browser = await chromium.launch({ executablePath: chromePath() });
try {
  for (const [file, width, height, html] of [
    ['promo-small-440x280.png', 440, 280, small],
    ['promo-marquee-1400x560.png', 1400, 560, marquee],
  ]) {
    const tab = await browser.newPage({ viewport: { width, height } });
    await tab.setContent(html);
    await tab.evaluate(() => document.fonts.ready);
    await tab.screenshot({ path: path.join(root, 'store', file) });
    await tab.close();
    log('written:', file);
  }
} finally {
  await browser.close();
}
