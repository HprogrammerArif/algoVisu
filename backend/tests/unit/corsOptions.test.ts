import { describe, it, expect } from 'vitest';
import { buildCorsOrigin } from '../../src/interfaces/http/corsOptions';

// Invoke the cors `origin` function and capture the boolean it allows.
function resolve(originOpt: unknown, requestOrigin: string | undefined): Promise<unknown> {
  return new Promise((res) => {
    (originOpt as (o: string | undefined, cb: (e: Error | null, allow?: unknown) => void) => void)(
      requestOrigin,
      (_e, allow) => res(allow),
    );
  });
}

describe('buildCorsOrigin', () => {
  it('passes "*" straight through', () => {
    expect(buildCorsOrigin('*', 'production')).toBe('*');
  });

  it('allows both localhost and 127.0.0.1 from the default allow-list', async () => {
    const o = buildCorsOrigin('http://localhost:5500,http://127.0.0.1:5500', 'development');
    expect(await resolve(o, 'http://localhost:5500')).toBe(true);
    expect(await resolve(o, 'http://127.0.0.1:5500')).toBe(true);
  });

  it('allows any loopback origin/port in non-production (dev convenience)', async () => {
    const o = buildCorsOrigin('http://127.0.0.1:5500', 'development');
    expect(await resolve(o, 'http://localhost:5500')).toBe(true); // the reported bug
    expect(await resolve(o, 'http://127.0.0.1:8080')).toBe(true);
    expect(await resolve(o, 'http://localhost:3000')).toBe(true);
  });

  it('allows requests with no Origin header (curl / same-origin)', async () => {
    const o = buildCorsOrigin('http://localhost:5500', 'development');
    expect(await resolve(o, undefined)).toBe(true);
  });

  it('blocks non-loopback origins not on the allow-list', async () => {
    const o = buildCorsOrigin('http://localhost:5500', 'development');
    expect(await resolve(o, 'https://evil.example.com')).toBe(false);
  });

  it('in production, honors only the explicit allow-list (no loopback fallback)', async () => {
    const o = buildCorsOrigin('https://app.example.com', 'production');
    expect(await resolve(o, 'https://app.example.com')).toBe(true);
    expect(await resolve(o, 'http://localhost:5500')).toBe(false);
  });
});
