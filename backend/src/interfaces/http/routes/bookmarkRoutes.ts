import { Router } from 'express';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { makeBookmarkController } from '../controllers/bookmarkController';
import { makeAuthenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { bookmarkBodyValidators } from '../validators/userDataValidators';
import type { Repositories, Services } from '../../../types/dependencies';

export function makeBookmarkRoutes(repos: Repositories, services: Services): Router {
  const router = Router();
  const controller = makeBookmarkController(repos);
  const authenticate = makeAuthenticate(services.jwt);

  router.get('/', authenticate, asyncHandler(controller.list));
  router.post('/', authenticate, bookmarkBodyValidators, validate, asyncHandler(controller.add));
  router.delete('/:algorithmId', authenticate, asyncHandler(controller.remove));

  return router;
}
