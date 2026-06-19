import { describe, it, expect } from 'vitest';
import { AppError } from '../../src/shared/errors/AppError';

describe('AppError', () => {
  it('carries statusCode, code, message', () => {
    const err = new AppError(404, 'NOT_FOUND', 'nope');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('nope');
    expect(err).toBeInstanceOf(Error);
    expect(err.isOperational).toBe(true);
  });
});
