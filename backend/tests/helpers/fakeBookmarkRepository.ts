import type { IBookmarkRepository } from '../../src/domain/repositories/IBookmarkRepository';
import type { BookmarkItem } from '../../src/domain/entities/Bookmark';
import type { FakeAlgorithmRepository } from './fakeAlgorithmRepository';

interface Row {
  id: number;
  userId: number;
  algorithmId: number;
  createdAt: string;
}

export interface FakeBookmarkRepository extends IBookmarkRepository {
  _rows: Row[];
}

export function createFakeBookmarkRepository(
  algorithms: FakeAlgorithmRepository,
): FakeBookmarkRepository {
  const rows: Row[] = [];
  let nextId = 1;

  function toItem(r: Row): BookmarkItem {
    const a = algorithms._items.find((x) => x.id === r.algorithmId);
    return {
      id: r.id,
      algorithmId: r.algorithmId,
      slug: a?.slug ?? '',
      name: a?.name ?? '',
      createdAt: r.createdAt,
    };
  }

  return {
    _rows: rows,
    async findByUser(userId) {
      return rows.filter((r) => r.userId === userId).map(toItem);
    },
    async add(userId, algorithmId) {
      let row = rows.find((r) => r.userId === userId && r.algorithmId === algorithmId);
      if (!row) {
        row = { id: nextId++, userId, algorithmId, createdAt: new Date().toISOString() };
        rows.push(row);
      }
      return toItem(row);
    },
    async remove(userId, algorithmId) {
      const idx = rows.findIndex((r) => r.userId === userId && r.algorithmId === algorithmId);
      if (idx < 0) return false;
      rows.splice(idx, 1);
      return true;
    },
  };
}
