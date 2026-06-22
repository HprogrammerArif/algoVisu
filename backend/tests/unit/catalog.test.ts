import { describe, it, expect } from 'vitest';
import { listAlgorithms } from '../../src/application/algorithms/listAlgorithms';
import { getAlgorithmDetail } from '../../src/application/algorithms/getAlgorithmDetail';
import { listCategories } from '../../src/application/categories/listCategories';
import { createFakeAlgorithmRepository } from '../helpers/fakeAlgorithmRepository';
import { createFakeCategoryRepository } from '../helpers/fakeCategoryRepository';

describe('listCategories', () => {
  it('returns categories ordered by display order', async () => {
    const categories = createFakeCategoryRepository();
    const result = await listCategories({ categories });
    expect(result.map((c) => c.slug)).toEqual(['sorting', 'searching']);
  });
});

describe('listAlgorithms', () => {
  it('returns all when no filters', async () => {
    const algorithms = createFakeAlgorithmRepository();
    const result = await listAlgorithms({ algorithms }, {});
    expect(result.length).toBe(2);
  });

  it('filters by category', async () => {
    const algorithms = createFakeAlgorithmRepository();
    const result = await listAlgorithms({ algorithms }, { category: 'searching' });
    expect(result.map((a) => a.slug)).toEqual(['binary-search']);
  });

  it('filters by search term', async () => {
    const algorithms = createFakeAlgorithmRepository();
    const result = await listAlgorithms({ algorithms }, { search: 'bubble' });
    expect(result.map((a) => a.slug)).toEqual(['bubble-sort']);
  });
});

describe('getAlgorithmDetail', () => {
  it('returns detail with complexities and snippets', async () => {
    const algorithms = createFakeAlgorithmRepository();
    const detail = await getAlgorithmDetail({ algorithms }, 'binary-search');
    expect(detail.name).toBe('Binary Search');
    expect(detail.timeComplexities.average).toBe('O(log n)');
    expect(detail.codeSnippets.length).toBeGreaterThan(0);
  });

  it('throws 404 for an unknown slug', async () => {
    const algorithms = createFakeAlgorithmRepository();
    await expect(getAlgorithmDetail({ algorithms }, 'nope')).rejects.toMatchObject({
      statusCode: 404,
      code: 'ALGORITHM_NOT_FOUND',
    });
  });
});
