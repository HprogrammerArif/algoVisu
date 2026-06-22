import type { RequestHandler } from 'express';
import { AppError } from '../../../shared/errors/AppError';

export function authorize(...roles: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required'));
      return;
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'));
      return;
    }
    next();
  };
}
