import type {
  IAlgorithmRepository,
  AlgorithmFilters,
  NewAlgorithm,
} from '../../src/domain/repositories/IAlgorithmRepository';
import type { AlgorithmDetail, AlgorithmSummary } from '../../src/domain/entities/Algorithm';

export interface FakeAlgorithmRepository extends IAlgorithmRepository {
  _items: AlgorithmDetail[];
}

const CATEGORY_SLUG: Record<number, string> = { 1: 'sorting', 2: 'searching' };

const DEFAULT: AlgorithmDetail[] = [
  {
    id: 1,
    slug: 'bubble-sort',
    name: 'Bubble Sort',
    summary: 'Swaps adjacent out-of-order elements.',
    category: 'sorting',
    difficulty: 'easy',
    visualizerType: 'array',
    description: 'Repeatedly steps through the list swapping adjacent pairs.',
    spaceComplexity: 'O(1)',
    timeComplexities: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
    codeSnippets: [{ language: 'pseudocode', code: 'for i ... for j ... if a[j]>a[j+1] swap' }],
  },
  {
    id: 2,
    slug: 'binary-search',
    name: 'Binary Search',
    summary: 'Halves a sorted range each step.',
    category: 'searching',
    difficulty: 'easy',
    visualizerType: 'array',
    description: 'Compares the target to the middle of a sorted range.',
    spaceComplexity: 'O(1)',
    timeComplexities: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
    codeSnippets: [{ language: 'pseudocode', code: 'lo=0; hi=n-1; while lo<=hi ...' }],
  },
];

function toSummary(a: AlgorithmDetail): AlgorithmSummary {
  return {
    id: a.id,
    slug: a.slug,
    name: a.name,
    summary: a.summary,
    category: a.category,
    difficulty: a.difficulty,
    visualizerType: a.visualizerType,
  };
}

export function createFakeAlgorithmRepository(
  seed: AlgorithmDetail[] = DEFAULT,
): FakeAlgorithmRepository {
  const items: AlgorithmDetail[] = seed.map((a) => ({ ...a }));
  let nextId = items.reduce((max, i) => Math.max(max, i.id), 0) + 1;

  return {
    _items: items,
    async findAll(filters: AlgorithmFilters) {
      const search = filters.search?.toLowerCase();
      return items
        .filter((a) => !filters.category || a.category === filters.category)
        .filter((a) => !filters.difficulty || a.difficulty === filters.difficulty)
        .filter(
          (a) =>
            !search || `${a.name} ${a.summary ?? ''}`.toLowerCase().includes(search),
        )
        .map(toSummary);
    },
    async findBySlug(slug) {
      return items.find((a) => a.slug === slug) ?? null;
    },
    async findById(id) {
      return items.find((a) => a.id === id) ?? null;
    },
    async exists(id) {
      return items.some((a) => a.id === id);
    },
    async slugExists(slug, excludeId) {
      return items.some((a) => a.slug === slug && a.id !== excludeId);
    },
    async create(n: NewAlgorithm) {
      const detail: AlgorithmDetail = {
        id: nextId++,
        slug: n.slug,
        name: n.name,
        summary: n.summary ?? null,
        category: CATEGORY_SLUG[n.categoryId] ?? String(n.categoryId),
        difficulty: n.difficulty ?? null,
        visualizerType: n.visualizerType,
        description: n.description ?? null,
        spaceComplexity: n.spaceComplexity ?? null,
        timeComplexities: n.timeComplexities,
        codeSnippets: n.codeSnippets,
      };
      items.push(detail);
      return detail;
    },
    async update(id, n: NewAlgorithm) {
      const item = items.find((a) => a.id === id);
      if (!item) return null;
      Object.assign(item, {
        slug: n.slug,
        name: n.name,
        summary: n.summary ?? null,
        category: CATEGORY_SLUG[n.categoryId] ?? String(n.categoryId),
        difficulty: n.difficulty ?? null,
        visualizerType: n.visualizerType,
        description: n.description ?? null,
        spaceComplexity: n.spaceComplexity ?? null,
        timeComplexities: n.timeComplexities,
        codeSnippets: n.codeSnippets,
      });
      return item;
    },
    async remove(id) {
      const idx = items.findIndex((a) => a.id === id);
      if (idx < 0) return false;
      items.splice(idx, 1);
      return true;
    },
  };
}
