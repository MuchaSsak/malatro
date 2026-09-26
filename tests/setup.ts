// Bun test preload: a minimal localStorage so engine persistence code runs outside the browser.
const store = new Map<string, string>();
const g = globalThis as { localStorage?: unknown };
g.localStorage ??= {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
};
