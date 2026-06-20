import { Router } from 'express';
import { makeAuthRoutes } from './authRoutes';
import { makeCategoryRoutes } from './categoryRoutes';
import { makeAlgorithmRoutes } from './algorithmRoutes';
import { makeBookmarkRoutes } from './bookmarkRoutes';
import { makeProgressRoutes } from './progressRoutes';
import type { Repositories, Services } from '../../../types/dependencies';

export function makeApiRouter(repos: Repositories, services: Services): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  router.use('/auth', makeAuthRoutes(repos, services));
  router.use('/categories', makeCategoryRoutes(repos, services));
  router.use('/algorithms', makeAlgorithmRoutes(repos, services));
  router.use('/bookmarks', makeBookmarkRoutes(repos, services));
  router.use('/progress', makeProgressRoutes(repos, services));

  return router;
}
