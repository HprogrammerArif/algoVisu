import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '../helpers/buildTestApp';

function studentToken(services: ReturnType<typeof buildTestApp>['services']): string {
  return services.jwt.sign({ sub: 7, role: 'student' });
}

describe('bookmark routes', () => {
  it('add -> list -> remove', async () => {
    const { app, services } = buildTestApp();
    const token = studentToken(services);

    const add = await request(app)
      .post('/api/v1/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ algorithmId: 1 });
    expect(add.status).toBe(201);
    expect(add.body.bookmark.slug).toBe('bubble-sort');

    const list = await request(app)
      .get('/api/v1/bookmarks')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.bookmarks.length).toBe(1);

    const del = await request(app)
      .delete('/api/v1/bookmarks/1')
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);
  });

  it('rejects an unknown algorithm with 404', async () => {
    const { app, services } = buildTestApp();
    const res = await request(app)
      .post('/api/v1/bookmarks')
      .set('Authorization', `Bearer ${studentToken(services)}`)
      .send({ algorithmId: 999 });
    expect(res.status).toBe(404);
  });

  it('requires authentication (401)', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/bookmarks');
    expect(res.status).toBe(401);
  });
});

describe('progress routes', () => {
  it('PUT upserts and GET lists progress', async () => {
    const { app, services } = buildTestApp();
    const token = studentToken(services);

    const put = await request(app)
      .put('/api/v1/progress/2')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' });
    expect(put.status).toBe(200);
    expect(put.body.progress.status).toBe('completed');

    const list = await request(app)
      .get('/api/v1/progress')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.progress[0].status).toBe('completed');
  });

  it('rejects an invalid status with 400', async () => {
    const { app, services } = buildTestApp();
    const res = await request(app)
      .put('/api/v1/progress/2')
      .set('Authorization', `Bearer ${studentToken(services)}`)
      .send({ status: 'banana' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
