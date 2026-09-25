import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // lib/ talks to the extension API through the polyfill; tests get an in-memory stand-in.
    alias: { 'webextension-polyfill': fileURLToPath(new URL('./tests/fake-browser.js', import.meta.url)) },
  },
  test: {
    include: ['tests/**/*.test.js'],
  },
});
