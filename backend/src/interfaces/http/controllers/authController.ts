import type { Request, Response } from 'express';
import { registerUser } from '../../../application/auth/registerUser';
import { loginUser } from '../../../application/auth/loginUser';
import { getCurrentUser } from '../../../application/auth/getCurrentUser';
import { AppError } from '../../../shared/errors/AppError';
import type { Repositories, Services } from '../../../types/dependencies';

export function makeAuthController(repos: Repositories, services: Services) {
  return {
    async register(req: Request, res: Response): Promise<void> {
      const user = await registerUser(
        { users: repos.users, password: services.password },
        req.body,
      );
      res.status(201).json({ user });
    },

    async login(req: Request, res: Response): Promise<void> {
      const result = await loginUser(
        { users: repos.users, password: services.password, jwt: services.jwt },
        req.body,
      );
      res.status(200).json(result);
    },

    async me(req: Request, res: Response): Promise<void> {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
      }
      const user = await getCurrentUser({ users: repos.users }, req.user.id);
      res.status(200).json({ user });
    },
  };
}
