/** localStorage with try/catch everywhere: private mode / blocked storage degrades to memory. */
const memory = new Map<string, string>();

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key) ?? memory.get(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  try {
    localStorage.setItem(key, raw);
  } catch {
    memory.set(key, raw);
  }
}
