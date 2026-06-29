import type { CorsOptions } from 'cors';

/**
 * Build the `cors` `origin` option from a comma-separated allow-list.
 *
 * - `"*"` is passed straight through (allow all).
 * - Any origin in the allow-list is permitted.
 * - In **non-production** environments, any loopback origin (`localhost` /
 *   `127.0.0.1` / `::1`) on any port is also permitted — so the static frontend
 *   works regardless of which local host/port it is served from. `localhost`
 *   and `127.0.0.1` are different origins to the browser, which is exactly the
 *   trap a single hard-coded origin falls into.
 * - In **production**, only the explicit allow-list is honored.
 *
 * Non-matching origins are rejected by allowing the request through *without*
 * the `Access-Control-Allow-Origin` header (the browser then blocks it) rather
 * than raising a 500.
 */
export function buildCorsOrigin(corsOrigin: string, env: string): CorsOptions['origin'] {
  if (corsOrigin.trim() === '*') return '*';

  const allowList = corsOrigin
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (origin, callback) => {
    // Requests without an Origin header (curl, server-to-server, same-origin).
    if (!origin) return callback(null, true);
    if (allowList.includes(origin)) return callback(null, true);
    if (env !== 'production' && isLoopbackOrigin(origin)) return callback(null, true);
    return callback(null, false);
  };
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
  } catch {
    return false;
  }
}
