import { AppError } from '../../shared/errors/AppError';
import type { ProgressItem, ProgressStatus } from '../../domain/entities/Progress';
import type { IProgressRepository } from '../../domain/repositories/IProgressRepository';
import type { IAlgorithmRepository } from '../../domain/repositories/IAlgorithmRepository';

export interface ProgressDeps {
  progress: IProgressRepository;
  algorithms: IAlgorithmRepository;
}

export function getProgress(deps: ProgressDeps, userId: number): Promise<ProgressItem[]> {
  return deps.progress.findByUser(userId);
}

export async function upsertProgress(
  deps: ProgressDeps,
  userId: number,
  algorithmId: number,
  status: ProgressStatus,
): Promise<ProgressItem> {
  if (!(await deps.algorithms.exists(algorithmId))) {
    throw new AppError(404, 'ALGORITHM_NOT_FOUND', 'Algorithm not found');
  }
  return deps.progress.upsert(userId, algorithmId, status);
}
