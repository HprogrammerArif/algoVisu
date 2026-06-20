import { AppError } from '../../shared/errors/AppError';
import type { BookmarkItem } from '../../domain/entities/Bookmark';
import type { IBookmarkRepository } from '../../domain/repositories/IBookmarkRepository';
import type { IAlgorithmRepository } from '../../domain/repositories/IAlgorithmRepository';

export interface BookmarkDeps {
  bookmarks: IBookmarkRepository;
  algorithms: IAlgorithmRepository;
}

export function listBookmarks(deps: BookmarkDeps, userId: number): Promise<BookmarkItem[]> {
  return deps.bookmarks.findByUser(userId);
}

export async function addBookmark(
  deps: BookmarkDeps,
  userId: number,
  algorithmId: number,
): Promise<BookmarkItem> {
  if (!(await deps.algorithms.exists(algorithmId))) {
    throw new AppError(404, 'ALGORITHM_NOT_FOUND', 'Algorithm not found');
  }
  return deps.bookmarks.add(userId, algorithmId);
}

export async function removeBookmark(
  deps: BookmarkDeps,
  userId: number,
  algorithmId: number,
): Promise<void> {
  await deps.bookmarks.remove(userId, algorithmId);
}
