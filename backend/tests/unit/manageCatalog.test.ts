import { describe, it, expect } from 'vitest';
import {
  createAlgorithm,
  updateAlgorithm,
  deleteAlgorithm,
} from '../../src/application/algorithms/manageAlgorithm';
import { deleteCategory } from '../../src/application/categories/manageCategory';
import { createFakeAlgorithmRepository } from '../helpers/fakeAlgorithmRepository';
import { createFakeCategoryRepository } from '../helpers/fakeCategoryRepository';
import type { NewAlgorithm } from '../../src/domain/repositories/IAlgorithmRepository';

const sample: NewAlgorithm = {
  categoryId: 1,
  slug: 'quick-sort',
  name: 'Quick Sort',
  summary: 'Divide and conquer partition sort.',
  description: 'Picks a pivot and partitions around it.',
  visualizerType: 'array',
  difficulty: 'medium',
  spaceComplexity: 'O(log n)',
  timeComplexities: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n^2)' },
  codeSnippets: [{ language: 'pseudocode', code: 'partition; recurse left; recurse right' }],
};

describe('createAlgorithm', () => {
  it('creates a new algorithm', async () => {
    const algorithms = createFakeAlgorithmRepository();
    const created = await createAlgorithm({ algorithms }, sample);
    expect(created.slug).toBe('quick-sort');
    expect(algorithms._items.map((a) => a.slug)).toContain('quick-sort');
  });

  it('rejects a duplicate slug with 409', async () => {
    const algorithms = createFakeAlgorithmRepository();
    await expect(
      createAlgorithm({ algorithms }, { ...sample, slug: 'bubble-sort' }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'SLUG_TAKEN' });
  });
});

describe('updateAlgorithm', () => {
  it('throws 404 for an unknown id', async () => {
    const algorithms = createFakeAlgorithmRepository();
    await expect(updateAlgorithm({ algorithms }, 999, sample)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('deleteAlgorithm', () => {
  it('removes an existing algorithm', async () => {
    const algorithms = createFakeAlgorithmRepository();
    await deleteAlgorithm({ algorithms }, 1);
    expect(algorithms._items.find((a) => a.id === 1)).toBeUndefined();
  });

  it('throws 404 for an unknown id', async () => {
    const algorithms = createFakeAlgorithmRepository();
    await expect(deleteAlgorithm({ algorithms }, 999)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('deleteCategory', () => {
  it('refuses to delete a category still in use (409)', async () => {
    const categories = createFakeCategoryRepository();
    categories._setAlgorithmCount(1, 3);
    await expect(deleteCategory({ categories }, 1)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CATEGORY_IN_USE',
    });
  });

  it('deletes an empty category', async () => {
    const categories = createFakeCategoryRepository();
    await deleteCategory({ categories }, 2);
    expect(categories._items.find((c) => c.id === 2)).toBeUndefined();
  });
});
