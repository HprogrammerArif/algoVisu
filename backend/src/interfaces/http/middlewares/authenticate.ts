import type { RequestHandler } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import type { JwtService } from '../../../types/dependencies';

export function makeAuthenticate(jwt: JwtService): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      next(new AppError(401, 'UNAUTHENTICATED', 'Missing or invalid Authorization header'));
      return;
    }
    try {
      const payload = jwt.verify(header.slice('Bearer '.length));
      req.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      next(new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired token'));
    }
  };
}
