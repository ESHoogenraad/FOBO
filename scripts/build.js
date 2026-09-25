// Builds the extension into dist/. The one output runs in Chrome, Brave, Edge and Firefox.
//
// The extension pages (popup, onboarding) and the background script are built as ES modules
// that share chunks. The bar's content script is built on its own, as one classic script:
// content scripts can't be modules. manifest.json, _locales/ and the icons are copied as they are.
// Nothing is minified, so the shipped code stays readable for store reviewers.
//
//   node scripts/build.js           build once
//   node scripts/build.js --watch   rebuild on change (reload the extension to pick it up)

import { build } from 'vite';
import { cpSync, globSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const src = resolve(root, 'src');
const dist = resolve(root, 'dist');
const watch = process.argv.includes('--watch');

const staticFiles = [
  ['manifest.json', 'manifest.json'],
  ['_locales', '_locales'],
  ['src/icons', 'icons'],
  ['src/fonts/OFL-plus-jakarta-sans.txt', 'fonts/OFL-plus-jakarta-sans.txt'],
  ['src/fonts/OFL-jetbrains-mono.txt', 'fonts/OFL-jetbrains-mono.txt'],
];

// Copies the static files after each build, and makes watch mode rebuild when they change.
const copyStatic = {
  name: 'upgraditch-copy-static',
  buildStart() {
    for (const file of ['manifest.json', ...globSync('_locales/*/messages.json', { cwd: root })]) {
      this.addWatchFile(resolve(root, file));
    }
  },
  closeBundle() {
    for (const [from, to] of staticFiles) {
      cpSync(resolve(root, from), resolve(dist, to), { recursive: true });
    }
  },
};

// Both builds write into dist/, so it is emptied once here rather than by either build.
rmSync(dist, { recursive: true, force: true });

const shared = {
  configFile: false,
  root: src,
  publicDir: false,
  logLevel: 'info',
  oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
};

const sharedBuild = {
  outDir: dist,
  emptyOutDir: false,
  target: ['chrome121', 'firefox140'],
  minify: false,
  cssMinify: false,
  modulePreload: { polyfill: false },
  watch: watch ? {} : null,
};

await build({
  ...shared,
  plugins: [copyStatic],
  build: {
    ...sharedBuild,
    rolldownOptions: {
      input: {
        popup: resolve(src, 'popup/popup.html'),
        onboarding: resolve(src, 'onboarding/onboarding.html'),
        'background/service-worker': resolve(src, 'background/service-worker.js'),
      },
      output: {
        // popup/popup.js next to popup/popup.html; background/service-worker.js as named above.
        entryFileNames: (chunk) => (chunk.name.includes('/') ? '[name].js' : '[name]/[name].js'),
        minifyInternalExports: false,
        chunkFileNames: 'chunks/[name].js',
        // Stable names: the bar loads the fonts as assets/<name>.woff2 (web_accessible_resources).
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});

// The bar: everything in one file, its CSS inlined into the script (bar.css?inline).
await build({
  ...shared,
  build: {
    ...sharedBuild,
    rolldownOptions: {
      input: { 'content/bar': resolve(src, 'content/bar.jsx') },
      output: { format: 'iife', entryFileNames: '[name].js' },
    },
  },
});
