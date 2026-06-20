import { getConnection } from '../connection';
import type { IProgressRepository } from '../../../domain/repositories/IProgressRepository';
import type { ProgressItem, ProgressStatus } from '../../../domain/entities/Progress';

interface ProgressRow {
  ALGORITHM_ID: number;
  SLUG: string;
  NAME: string;
  STATUS: string;
  LAST_VIEWED_AT: Date | string;
}

function mapProgress(row: ProgressRow): ProgressItem {
  return {
    algorithmId: row.ALGORITHM_ID,
    slug: row.SLUG,
    name: row.NAME,
    status: row.STATUS as ProgressStatus,
    lastViewedAt:
      row.LAST_VIEWED_AT instanceof Date ? row.LAST_VIEWED_AT.toISOString() : String(row.LAST_VIEWED_AT),
  };
}

const SELECT = `
  SELECT p.algorithm_id, a.slug, a.name, p.status, p.last_viewed_at
    FROM progress p
    JOIN algorithms a ON a.algorithm_id = p.algorithm_id`;

export class OracleProgressRepository implements IProgressRepository {
  async findByUser(userId: number): Promise<ProgressItem[]> {
    const conn = await getConnection();
    try {
      const result = await conn.execute<ProgressRow>(
        `${SELECT} WHERE p.user_id = :userId ORDER BY p.last_viewed_at DESC`,
        { userId },
      );
      return (result.rows ?? []).map(mapProgress);
    } finally {
      await conn.close();
    }
  }

  async upsert(userId: number, algorithmId: number, status: ProgressStatus): Promise<ProgressItem> {
    const conn = await getConnection();
    try {
      await conn.execute(
        `MERGE INTO progress p
           USING (SELECT :userId AS user_id, :algorithmId AS algorithm_id FROM dual) src
           ON (p.user_id = src.user_id AND p.algorithm_id = src.algorithm_id)
         WHEN MATCHED THEN
           UPDATE SET p.status = :status,
                      p.last_viewed_at = CURRENT_TIMESTAMP,
                      p.updated_at = CURRENT_TIMESTAMP
         WHEN NOT MATCHED THEN
           INSERT (user_id, algorithm_id, status) VALUES (:userId, :algorithmId, :status)`,
        { userId, algorithmId, status },
        { autoCommit: true },
      );
      const result = await conn.execute<ProgressRow>(
        `${SELECT} WHERE p.user_id = :userId AND p.algorithm_id = :algorithmId`,
        { userId, algorithmId },
      );
      const row = result.rows?.[0];
      if (!row) throw new Error('Failed to load progress after upsert');
      return mapProgress(row);
    } finally {
      await conn.close();
    }
  }
}
