import type { AlgorithmSummary } from '../../domain/entities/Algorithm';
import type {
  IAlgorithmRepository,
  AlgorithmFilters,
} from '../../domain/repositories/IAlgorithmRepository';

export interface ListAlgorithmsDeps {
  algorithms: IAlgorithmRepository;
}

export async function listAlgorithms(
  deps: ListAlgorithmsDeps,
  filters: AlgorithmFilters,
): Promise<AlgorithmSummary[]> {
  return deps.algorithms.findAll(filters);
}
