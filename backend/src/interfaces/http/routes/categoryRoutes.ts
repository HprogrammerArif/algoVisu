import { Router } from 'express';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { makeCategoryController } from '../controllers/categoryController';
import { makeAuthenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { categoryBodyValidators } from '../validators/categoryValidators';
import type { Repositories, Services } from '../../../types/dependencies';

export function makeCategoryRoutes(repos: Repositories, services: Services): Router {
  const router = Router();
  const controller = makeCategoryController(repos);
  const authenticate = makeAuthenticate(services.jwt);
  const adminOnly = [authenticate, authorize('admin')];

  router.get('/', asyncHandler(controller.list));
  router.post('/', ...adminOnly, categoryBodyValidators, validate, asyncHandler(controller.create));
  router.put('/:id', ...adminOnly, categoryBodyValidators, validate, asyncHandler(controller.update));
  router.delete('/:id', ...adminOnly, asyncHandler(controller.remove));

  return router;
}
