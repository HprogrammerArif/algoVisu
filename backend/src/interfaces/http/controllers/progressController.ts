import type { Request, Response } from 'express';
import { getProgress, upsertProgress } from '../../../application/progress/progress';
import { AppError } from '../../../shared/errors/AppError';
import type { ProgressStatus } from '../../../domain/entities/Progress';
import type { Repositories } from '../../../types/dependencies';

function requireUserId(req: Request): number {
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  return req.user.id;
}

export function makeProgressController(repos: Repositories) {
  const deps = { progress: repos.progress, algorithms: repos.algorithms };
  return {
    async list(req: Request, res: Response): Promise<void> {
      res.status(200).json({ progress: await getProgress(deps, requireUserId(req)) });
    },
    async upsert(req: Request, res: Response): Promise<void> {
      const progress = await upsertProgress(
        deps,
        requireUserId(req),
        Number(req.params.algorithmId),
        req.body.status as ProgressStatus,
      );
      res.status(200).json({ progress });
    },
  };
}
