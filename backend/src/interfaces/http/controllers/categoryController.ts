import type { Request, Response } from 'express';
import { listCategories } from '../../../application/categories/listCategories';
import type { Repositories } from '../../../types/dependencies';

export function makeCategoryController(repos: Repositories) {
  return {
    async list(_req: Request, res: Response): Promise<void> {
      const categories = await listCategories({ categories: repos.categories });
      res.status(200).json({ categories });
    },
  };
}
