import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../../../shared/errors/AppError';

export function validate(req: Request, _res: Response, next: NextFunction): void {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const first = result.array()[0];
    next(new AppError(400, 'VALIDATION_ERROR', first.msg as string));
    return;
  }
  next();
}
