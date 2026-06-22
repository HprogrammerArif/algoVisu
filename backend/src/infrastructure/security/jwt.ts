import jwt, { type SignOptions } from 'jsonwebtoken';
import type { JwtService, AuthTokenPayload } from '../../types/dependencies';

/**
 * Builds a JwtService bound to a secret/expiry. Created in the composition root
 * (or in tests) so this module never reads global config at import time.
 */
export function createJwtService(secret: string, expiresIn: string): JwtService {
  return {
    // `expiresIn` is a plain string from config; @types/jsonwebtoken v9 narrows it
    // to a template-literal type, so we widen the options object via `unknown`.
    sign: (payload: AuthTokenPayload) =>
      jwt.sign(payload, secret, { expiresIn } as unknown as SignOptions),
    verify: (token: string) => jwt.verify(token, secret) as unknown as AuthTokenPayload,
  };
}
