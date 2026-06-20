import type { Request, Response } from 'express';
import { listAlgorithms } from '../../../application/algorithms/listAlgorithms';
import { getAlgorithmDetail } from '../../../application/algorithms/getAlgorithmDetail';
import type { Repositories } from '../../../types/dependencies';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function makeAlgorithmController(repos: Repositories) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const algorithms = await listAlgorithms(
        { algorithms: repos.algorithms },
        {
          category: asString(req.query.category),
          difficulty: asString(req.query.difficulty),
          search: asString(req.query.search),
        },
      );
      res.status(200).json({ algorithms });
    },

    async detail(req: Request, res: Response): Promise<void> {
      const algorithm = await getAlgorithmDetail({ algorithms: repos.algorithms }, req.params.slug);
      res.status(200).json({ algorithm });
    },
  };
}
