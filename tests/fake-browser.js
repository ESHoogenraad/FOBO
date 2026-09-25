// In-memory stand-in for the parts of the WebExtension API that src/lib uses.

function storageArea() {
  let data = {};
  return {
    async get(keys) {
      if (keys == null) return structuredClone(data);
      const list = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
      const result = {};
      for (const key of list) {
        if (key in data) result[key] = structuredClone(data[key]);
        else if (keys && typeof keys === 'object' && !Array.isArray(keys)) result[key] = keys[key];
      }
      return result;
    },
    async set(items) {
      Object.assign(data, structuredClone(items));
    },
    async remove(keys) {
      for (const key of [].concat(keys)) delete data[key];
    },
    async clear() {
      data = {};
    },
  };
}

const browser = {
  storage: { local: storageArea(), sync: storageArea() },
  runtime: { getManifest: () => ({ version: '0.1.0' }) },
  permissions: { contains: async () => true },
  i18n: { getMessage: (key) => key },
};

export async function resetBrowser() {
  await browser.storage.local.clear();
  await browser.storage.sync.clear();
}

export default browser;
