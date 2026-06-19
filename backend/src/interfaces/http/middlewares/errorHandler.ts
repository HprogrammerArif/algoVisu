import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../../../shared/errors/AppError';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`));
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error('[unexpected error]', err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Unexpected server error' } });
};
