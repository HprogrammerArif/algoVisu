import type {
  AlgorithmSummary,
  AlgorithmDetail,
  TimeComplexities,
  CodeSnippet,
} from '../entities/Algorithm';

export interface AlgorithmFilters {
  category?: string;
  difficulty?: string;
  search?: string;
}

export interface NewAlgorithm {
  categoryId: number;
  slug: string;
  name: string;
  summary?: string | null;
  description?: string | null;
  visualizerType: string;
  difficulty?: string | null;
  spaceComplexity?: string | null;
  timeComplexities: TimeComplexities;
  codeSnippets: CodeSnippet[];
}

export interface IAlgorithmRepository {
  findAll(filters: AlgorithmFilters): Promise<AlgorithmSummary[]>;
  findBySlug(slug: string): Promise<AlgorithmDetail | null>;
  findById(id: number): Promise<AlgorithmDetail | null>;
  create(algorithm: NewAlgorithm): Promise<AlgorithmDetail>;
  update(id: number, algorithm: NewAlgorithm): Promise<AlgorithmDetail | null>;
  remove(id: number): Promise<boolean>;
  slugExists(slug: string, excludeId?: number): Promise<boolean>;
}
