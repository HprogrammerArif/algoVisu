import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../src/config';

describe('loadConfig', () => {
  it('throws when required vars are missing', () => {
    expect(() => loadConfig({})).toThrow(/Missing required env vars/);
  });

  it('parses a valid environment', () => {
    const cfg = loadConfig({
      NODE_ENV: 'test',
      PORT: '4000',
      DB_USER: 'u',
      DB_PASSWORD: 'p',
      DB_CONNECT_STRING: 'localhost:1521/XEPDB1',
      JWT_SECRET: 's',
    });
    expect(cfg.port).toBe(4000);
    expect(cfg.db.user).toBe('u');
    expect(cfg.db.connectString).toBe('localhost:1521/XEPDB1');
    expect(cfg.jwt.secret).toBe('s');
  });
});
