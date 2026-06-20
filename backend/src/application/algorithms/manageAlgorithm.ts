import { AppError } from '../../shared/errors/AppError';
import type { AlgorithmDetail } from '../../domain/entities/Algorithm';
import type {
  IAlgorithmRepository,
  NewAlgorithm,
} from '../../domain/repositories/IAlgorithmRepository';

export interface ManageAlgorithmDeps {
  algorithms: IAlgorithmRepository;
}

export async function createAlgorithm(
  deps: ManageAlgorithmDeps,
  input: NewAlgorithm,
): Promise<AlgorithmDetail> {
  if (await deps.algorithms.slugExists(input.slug)) {
    throw new AppError(409, 'SLUG_TAKEN', `An algorithm with slug "${input.slug}" already exists`);
  }
  return deps.algorithms.create(input);
}

export async function updateAlgorithm(
  deps: ManageAlgorithmDeps,
  id: number,
  input: NewAlgorithm,
): Promise<AlgorithmDetail> {
  if (await deps.algorithms.slugExists(input.slug, id)) {
    throw new AppError(409, 'SLUG_TAKEN', `An algorithm with slug "${input.slug}" already exists`);
  }
  const updated = await deps.algorithms.update(id, input);
  if (!updated) {
    throw new AppError(404, 'ALGORITHM_NOT_FOUND', 'Algorithm not found');
  }
  return updated;
}

export async function deleteAlgorithm(deps: ManageAlgorithmDeps, id: number): Promise<void> {
  const removed = await deps.algorithms.remove(id);
  if (!removed) {
    throw new AppError(404, 'ALGORITHM_NOT_FOUND', 'Algorithm not found');
  }
}
