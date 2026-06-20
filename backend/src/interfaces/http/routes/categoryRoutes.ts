import { Router } from 'express';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { makeCategoryController } from '../controllers/categoryController';
import type { Repositories, Services } from '../../../types/dependencies';

// `services` is accepted for a consistent factory signature; admin guards added in Phase 5.
export function makeCategoryRoutes(repos: Repositories, _services: Services): Router {
  const router = Router();
  const controller = makeCategoryController(repos);

  router.get('/', asyncHandler(controller.list));

  return router;
}
