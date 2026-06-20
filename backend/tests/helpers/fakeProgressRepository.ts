import type { IProgressRepository } from '../../src/domain/repositories/IProgressRepository';
import type { ProgressItem, ProgressStatus } from '../../src/domain/entities/Progress';
import type { FakeAlgorithmRepository } from './fakeAlgorithmRepository';

interface Row {
  userId: number;
  algorithmId: number;
  status: ProgressStatus;
  lastViewedAt: string;
}

export interface FakeProgressRepository extends IProgressRepository {
  _rows: Row[];
}

export function createFakeProgressRepository(
  algorithms: FakeAlgorithmRepository,
): FakeProgressRepository {
  const rows: Row[] = [];

  function toItem(r: Row): ProgressItem {
    const a = algorithms._items.find((x) => x.id === r.algorithmId);
    return {
      algorithmId: r.algorithmId,
      slug: a?.slug ?? '',
      name: a?.name ?? '',
      status: r.status,
      lastViewedAt: r.lastViewedAt,
    };
  }

  return {
    _rows: rows,
    async findByUser(userId) {
      return rows.filter((r) => r.userId === userId).map(toItem);
    },
    async upsert(userId, algorithmId, status) {
      let row = rows.find((r) => r.userId === userId && r.algorithmId === algorithmId);
      if (row) {
        row.status = status;
        row.lastViewedAt = new Date().toISOString();
      } else {
        row = { userId, algorithmId, status, lastViewedAt: new Date().toISOString() };
        rows.push(row);
      }
      return toItem(row);
    },
  };
}
