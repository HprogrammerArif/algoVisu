import type { Request, Response } from 'express';
import { listAlgorithms } from '../../../application/algorithms/listAlgorithms';
import { getAlgorithmDetail } from '../../../application/algorithms/getAlgorithmDetail';
import {
  createAlgorithm,
  updateAlgorithm,
  deleteAlgorithm,
} from '../../../application/algorithms/manageAlgorithm';
import type { Repositories } from '../../../types/dependencies';
import type { NewAlgorithm } from '../../../domain/repositories/IAlgorithmRepository';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function toNewAlgorithm(body: Request['body']): NewAlgorithm {
  return {
    categoryId: Number(body.categoryId),
    slug: body.slug,
    name: body.name,
    summary: body.summary ?? null,
    description: body.description ?? null,
    visualizerType: body.visualizerType,
    difficulty: body.difficulty ?? null,
    spaceComplexity: body.spaceComplexity ?? null,
    timeComplexities: body.timeComplexities,
    codeSnippets: Array.isArray(body.codeSnippets) ? body.codeSnippets : [],
  };
}

export function makeAlgorithmController(repos: Repositories) {
  const deps = { algorithms: repos.algorithms };
  return {
    async list(req: Request, res: Response): Promise<void> {
      const algorithms = await listAlgorithms(deps, {
        category: asString(req.query.category),
        difficulty: asString(req.query.difficulty),
        search: asString(req.query.search),
      });
      res.status(200).json({ algorithms });
    },

    async detail(req: Request, res: Response): Promise<void> {
      const algorithm = await getAlgorithmDetail(deps, req.params.slug);
      res.status(200).json({ algorithm });
    },

    async create(req: Request, res: Response): Promise<void> {
      const algorithm = await createAlgorithm(deps, toNewAlgorithm(req.body));
      res.status(201).json({ algorithm });
    },

    async update(req: Request, res: Response): Promise<void> {
      const algorithm = await updateAlgorithm(deps, Number(req.params.id), toNewAlgorithm(req.body));
      res.status(200).json({ algorithm });
    },

    async remove(req: Request, res: Response): Promise<void> {
      await deleteAlgorithm(deps, Number(req.params.id));
      res.status(204).send();
    },
  };
}
