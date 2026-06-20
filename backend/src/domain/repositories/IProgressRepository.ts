import type { ProgressItem, ProgressStatus } from '../entities/Progress';

export interface IProgressRepository {
  findByUser(userId: number): Promise<ProgressItem[]>;
  upsert(userId: number, algorithmId: number, status: ProgressStatus): Promise<ProgressItem>;
}
