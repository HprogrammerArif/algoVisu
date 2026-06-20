import { Router } from 'express';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { makeAlgorithmController } from '../controllers/algorithmController';
import { makeAuthenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { algorithmBodyValidators } from '../validators/algorithmValidators';
import type { Repositories, Services } from '../../../types/dependencies';

export function makeAlgorithmRoutes(repos: Repositories, services: Services): Router {
  const router = Router();
  const controller = makeAlgorithmController(repos);
  const authenticate = makeAuthenticate(services.jwt);
  const adminOnly = [authenticate, authorize('admin')];

  router.get('/', asyncHandler(controller.list));
  router.get('/:slug', asyncHandler(controller.detail));
  router.post('/', ...adminOnly, algorithmBodyValidators, validate, asyncHandler(controller.create));
  router.put('/:id', ...adminOnly, algorithmBodyValidators, validate, asyncHandler(controller.update));
  router.delete('/:id', ...adminOnly, asyncHandler(controller.remove));

  return router;
}
