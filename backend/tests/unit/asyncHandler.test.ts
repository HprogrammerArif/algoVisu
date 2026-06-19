import { describe, it, expect } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../src/shared/utils/asyncHandler';

describe('asyncHandler', () => {
  it('forwards a rejected promise to next', async () => {
    const boom = new Error('boom');
    let received: unknown;
    const handler = asyncHandler(async () => {
      throw boom;
    });
    await new Promise<void>((resolve) => {
      handler({} as Request, {} as Response, ((e?: unknown) => {
        received = e;
        resolve();
      }) as NextFunction);
    });
    expect(received).toBe(boom);
  });
});
