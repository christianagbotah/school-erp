'use client';

/**
 * Cached fetch: network-first with durable localStorage fallback for offline reads.
 * On success: stores the JSON payload keyed by URL. On network failure: serves
 * the last cached payload. This gives offline access to previously downloaded
 * rosters, classes and invoice lists — the read side of the offline matrix.
 */
export async function cachedFetch<T>(url: string, opts?: { ttl?: number }): Promise<T | null> {
  const cacheKey = `iedupro-cache:${url}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), data }));
      } catch {
        /* quota — ignore */
      }
      return data as T;
    }
    throw new Error(`HTTP ${res.status}`);
  } catch {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { at: number; data: T };
        const ttl = opts?.ttl ?? 1000 * 60 * 60 * 24 * 7; // 7 days
        if (Date.now() - parsed.at < ttl) return parsed.data;
        localStorage.removeItem(cacheKey);
      }
    } catch {
      /* corrupt cache */
    }
    return null;
  }
}
