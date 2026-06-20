import { AppError } from '../../shared/errors/AppError';
import type { AlgorithmDetail } from '../../domain/entities/Algorithm';
import type { IAlgorithmRepository } from '../../domain/repositories/IAlgorithmRepository';

export interface GetAlgorithmDetailDeps {
  algorithms: IAlgorithmRepository;
}

export async function getAlgorithmDetail(
  deps: GetAlgorithmDetailDeps,
  slug: string,
): Promise<AlgorithmDetail> {
  const algorithm = await deps.algorithms.findBySlug(slug);
  if (!algorithm) {
    throw new AppError(404, 'ALGORITHM_NOT_FOUND', `No algorithm with slug "${slug}"`);
  }
  return algorithm;
}
