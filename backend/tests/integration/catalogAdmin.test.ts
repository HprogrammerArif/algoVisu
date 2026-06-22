import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '../helpers/buildTestApp';

const newAlgorithm = {
  categoryId: 1,
  slug: 'quick-sort',
  name: 'Quick Sort',
  summary: 'Divide and conquer.',
  description: 'Pivot partitioning.',
  visualizerType: 'array',
  difficulty: 'medium',
  spaceComplexity: 'O(log n)',
  timeComplexities: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n^2)' },
  codeSnippets: [{ language: 'pseudocode', code: 'partition; recurse' }],
};

function tokens(services: ReturnType<typeof buildTestApp>['services']) {
  return {
    admin: services.jwt.sign({ sub: 99, role: 'admin' }),
    student: services.jwt.sign({ sub: 1, role: 'student' }),
  };
}

describe('catalog admin routes', () => {
  it('admin can create an algorithm (201) and it appears in the list', async () => {
    const { app, services } = buildTestApp();
    const { admin } = tokens(services);
    const res = await request(app)
      .post('/api/v1/algorithms')
      .set('Authorization', `Bearer ${admin}`)
      .send(newAlgorithm);
    expect(res.status).toBe(201);
    expect(res.body.algorithm.slug).toBe('quick-sort');

    const list = await request(app).get('/api/v1/algorithms');
    expect(list.body.algorithms.length).toBe(3);
  });

  it('a student is forbidden (403)', async () => {
    const { app, services } = buildTestApp();
    const { student } = tokens(services);
    const res = await request(app)
      .post('/api/v1/algorithms')
      .set('Authorization', `Bearer ${student}`)
      .send(newAlgorithm);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('without a token is 401', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/api/v1/algorithms').send(newAlgorithm);
    expect(res.status).toBe(401);
  });

  it('invalid body is 400', async () => {
    const { app, services } = buildTestApp();
    const { admin } = tokens(services);
    const res = await request(app)
      .post('/api/v1/algorithms')
      .set('Authorization', `Bearer ${admin}`)
      .send({ ...newAlgorithm, name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('duplicate slug is 409', async () => {
    const { app, services } = buildTestApp();
    const { admin } = tokens(services);
    const res = await request(app)
      .post('/api/v1/algorithms')
      .set('Authorization', `Bearer ${admin}`)
      .send({ ...newAlgorithm, slug: 'bubble-sort' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SLUG_TAKEN');
  });

  it('admin can delete an algorithm (204), then detail is 404', async () => {
    const { app, services } = buildTestApp();
    const { admin } = tokens(services);
    const del = await request(app)
      .delete('/api/v1/algorithms/1')
      .set('Authorization', `Bearer ${admin}`);
    expect(del.status).toBe(204);

    const detail = await request(app).get('/api/v1/algorithms/bubble-sort');
    expect(detail.status).toBe(404);
  });
});
