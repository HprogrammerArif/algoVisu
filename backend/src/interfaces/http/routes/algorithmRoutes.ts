import { Router } from 'express';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { makeAlgorithmController } from '../controllers/algorithmController';
import type { Repositories, Services } from '../../../types/dependencies';

// `services` is accepted for a consistent factory signature; admin guards added in Phase 5.
export function makeAlgorithmRoutes(repos: Repositories, _services: Services): Router {
  const router = Router();
  const controller = makeAlgorithmController(repos);

  router.get('/', asyncHandler(controller.list));
  router.get('/:slug', asyncHandler(controller.detail));

  return router;
}
