import type { Request, Response } from 'express';
import { listCategories } from '../../../application/categories/listCategories';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../../application/categories/manageCategory';
import type { Repositories } from '../../../types/dependencies';
import type { NewCategory } from '../../../domain/repositories/ICategoryRepository';

function toNewCategory(body: Request['body']): NewCategory {
  return {
    slug: body.slug,
    name: body.name,
    description: body.description ?? null,
    displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : 0,
  };
}

export function makeCategoryController(repos: Repositories) {
  const deps = { categories: repos.categories };
  return {
    async list(_req: Request, res: Response): Promise<void> {
      res.status(200).json({ categories: await listCategories(deps) });
    },
    async create(req: Request, res: Response): Promise<void> {
      const category = await createCategory(deps, toNewCategory(req.body));
      res.status(201).json({ category });
    },
    async update(req: Request, res: Response): Promise<void> {
      const category = await updateCategory(deps, Number(req.params.id), toNewCategory(req.body));
      res.status(200).json({ category });
    },
    async remove(req: Request, res: Response): Promise<void> {
      await deleteCategory(deps, Number(req.params.id));
      res.status(204).send();
    },
  };
}
