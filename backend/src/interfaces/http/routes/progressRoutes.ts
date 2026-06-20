import { Router } from 'express';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { makeProgressController } from '../controllers/progressController';
import { makeAuthenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { progressBodyValidators } from '../validators/userDataValidators';
import type { Repositories, Services } from '../../../types/dependencies';

export function makeProgressRoutes(repos: Repositories, services: Services): Router {
  const router = Router();
  const controller = makeProgressController(repos);
  const authenticate = makeAuthenticate(services.jwt);

  router.get('/', authenticate, asyncHandler(controller.list));
  router.put(
    '/:algorithmId',
    authenticate,
    progressBodyValidators,
    validate,
    asyncHandler(controller.upsert),
  );

  return router;
}
