import { Router } from 'express';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { validate } from '../middlewares/validate';
import { makeAuthenticate } from '../middlewares/authenticate';
import { registerValidators, loginValidators } from '../validators/authValidators';
import { makeAuthController } from '../controllers/authController';
import type { Repositories, Services } from '../../../types/dependencies';

export function makeAuthRoutes(repos: Repositories, services: Services): Router {
  const router = Router();
  const controller = makeAuthController(repos, services);
  const authenticate = makeAuthenticate(services.jwt);

  router.post('/register', registerValidators, validate, asyncHandler(controller.register));
  router.post('/login', loginValidators, validate, asyncHandler(controller.login));
  router.get('/me', authenticate, asyncHandler(controller.me));

  return router;
}
