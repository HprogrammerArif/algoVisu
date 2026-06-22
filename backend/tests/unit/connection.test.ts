import { describe, it, expect } from 'vitest';
import * as conn from '../../src/infrastructure/database/connection';

describe('connection module', () => {
  it('exposes the pool lifecycle API', () => {
    expect(typeof conn.initPool).toBe('function');
    expect(typeof conn.getConnection).toBe('function');
    expect(typeof conn.closePool).toBe('function');
  });
});
