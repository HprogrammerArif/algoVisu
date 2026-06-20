import type { Request, Response } from 'express';
import {
  listBookmarks,
  addBookmark,
  removeBookmark,
} from '../../../application/bookmarks/bookmarks';
import { AppError } from '../../../shared/errors/AppError';
import type { Repositories } from '../../../types/dependencies';

function requireUserId(req: Request): number {
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  return req.user.id;
}

export function makeBookmarkController(repos: Repositories) {
  const deps = { bookmarks: repos.bookmarks, algorithms: repos.algorithms };
  return {
    async list(req: Request, res: Response): Promise<void> {
      res.status(200).json({ bookmarks: await listBookmarks(deps, requireUserId(req)) });
    },
    async add(req: Request, res: Response): Promise<void> {
      const bookmark = await addBookmark(deps, requireUserId(req), Number(req.body.algorithmId));
      res.status(201).json({ bookmark });
    },
    async remove(req: Request, res: Response): Promise<void> {
      await removeBookmark(deps, requireUserId(req), Number(req.params.algorithmId));
      res.status(204).send();
    },
  };
}
