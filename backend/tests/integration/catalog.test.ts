import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '../helpers/buildTestApp';

describe('catalog routes', () => {
  it('GET /categories returns the category list', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.categories.map((c: { slug: string }) => c.slug)).toEqual([
      'sorting',
      'searching',
    ]);
  });

  it('GET /algorithms lists all', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/algorithms');
    expect(res.status).toBe(200);
    expect(res.body.algorithms.length).toBe(2);
  });

  it('GET /algorithms?category=searching filters', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/algorithms?category=searching');
    expect(res.status).toBe(200);
    expect(res.body.algorithms.map((a: { slug: string }) => a.slug)).toEqual(['binary-search']);
  });

  it('GET /algorithms/:slug returns full detail', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/algorithms/binary-search');
    expect(res.status).toBe(200);
    expect(res.body.algorithm.name).toBe('Binary Search');
    expect(res.body.algorithm.timeComplexities.average).toBe('O(log n)');
  });

  it('GET /algorithms/:slug returns 404 for unknown slug', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/algorithms/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ALGORITHM_NOT_FOUND');
  });
});
