import type { BookmarkItem } from '../entities/Bookmark';

export interface IBookmarkRepository {
  findByUser(userId: number): Promise<BookmarkItem[]>;
  add(userId: number, algorithmId: number): Promise<BookmarkItem>;
  remove(userId: number, algorithmId: number): Promise<boolean>;
}
