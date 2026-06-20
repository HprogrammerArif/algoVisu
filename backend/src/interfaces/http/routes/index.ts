import { Router } from 'express';
import { makeAuthRoutes } from './authRoutes';
import type { Repositories, Services } from '../../../types/dependencies';

export function makeApiRouter(repos: Repositories, services: Services): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  router.use('/auth', makeAuthRoutes(repos, services));

  return router;
}
