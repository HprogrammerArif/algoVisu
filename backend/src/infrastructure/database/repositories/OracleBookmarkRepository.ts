import { getConnection } from '../connection';
import type { IBookmarkRepository } from '../../../domain/repositories/IBookmarkRepository';
import type { BookmarkItem } from '../../../domain/entities/Bookmark';

interface BookmarkRow {
  BOOKMARK_ID: number;
  ALGORITHM_ID: number;
  SLUG: string;
  NAME: string;
  CREATED_AT: Date | string;
}

function mapBookmark(row: BookmarkRow): BookmarkItem {
  return {
    id: row.BOOKMARK_ID,
    algorithmId: row.ALGORITHM_ID,
    slug: row.SLUG,
    name: row.NAME,
    createdAt: row.CREATED_AT instanceof Date ? row.CREATED_AT.toISOString() : String(row.CREATED_AT),
  };
}

const SELECT = `
  SELECT b.bookmark_id, b.algorithm_id, a.slug, a.name, b.created_at
    FROM bookmarks b
    JOIN algorithms a ON a.algorithm_id = b.algorithm_id`;

export class OracleBookmarkRepository implements IBookmarkRepository {
  async findByUser(userId: number): Promise<BookmarkItem[]> {
    const conn = await getConnection();
    try {
      const result = await conn.execute<BookmarkRow>(
        `${SELECT} WHERE b.user_id = :userId ORDER BY b.created_at DESC`,
        { userId },
      );
      return (result.rows ?? []).map(mapBookmark);
    } finally {
      await conn.close();
    }
  }

  async add(userId: number, algorithmId: number): Promise<BookmarkItem> {
    const conn = await getConnection();
    try {
      // Idempotent: insert only if the (user, algorithm) pair does not exist yet.
      await conn.execute(
        `MERGE INTO bookmarks b
           USING (SELECT :userId AS user_id, :algorithmId AS algorithm_id FROM dual) src
           ON (b.user_id = src.user_id AND b.algorithm_id = src.algorithm_id)
         WHEN NOT MATCHED THEN
           INSERT (user_id, algorithm_id) VALUES (:userId, :algorithmId)`,
        { userId, algorithmId },
        { autoCommit: true },
      );
      const result = await conn.execute<BookmarkRow>(
        `${SELECT} WHERE b.user_id = :userId AND b.algorithm_id = :algorithmId`,
        { userId, algorithmId },
      );
      const row = result.rows?.[0];
      if (!row) throw new Error('Failed to load bookmark after insert');
      return mapBookmark(row);
    } finally {
      await conn.close();
    }
  }

  async remove(userId: number, algorithmId: number): Promise<boolean> {
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        `DELETE FROM bookmarks WHERE user_id = :userId AND algorithm_id = :algorithmId`,
        { userId, algorithmId },
        { autoCommit: true },
      );
      return (result.rowsAffected ?? 0) > 0;
    } finally {
      await conn.close();
    }
  }
}
