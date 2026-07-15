// Shared fetch helpers for every integration module. Kept deliberately tiny:
// a timeout wrapper, a text/json wrapper, and an in-memory memoizer so a
// single server process doesn't hammer upstream APIs on every request during
// the ISR revalidation window.
const cache = new Map();

export function memoize(key, ttlMs, fn) {
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && hit.expires > now) {
    return hit.promise;
  }
  const promise = fn().catch((err) => {
    cache.delete(key);
    throw err;
  });
  cache.set(key, { promise, expires: now + ttlMs });
  return promise;
}

const DEFAULT_TIMEOUT_MS = 10_000;

async function timedFetch(url, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson(url, options = {}) {
  const res = await timedFetch(url, options);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

export async function fetchText(url, options = {}) {
  const res = await timedFetch(url, options);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  return res.text();
}

// Every integration returns one of these two shapes so dataSource.js can
// merge live sections with mock fallbacks without special-casing each API.
export function unavailable(reason) {
  return { source: 'unavailable', reason };
}

export function live(data) {
  return { source: 'live', fetchedAt: new Date().toISOString(), ...data };
}
