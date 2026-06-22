import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '../helpers/buildTestApp';

describe('auth routes', () => {
  it('register -> login -> me happy path', async () => {
    const { app } = buildTestApp();

    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Ada Lovelace', email: 'ada@uni.edu', password: 'password123' });
    expect(reg.status).toBe(201);
    expect(reg.body.user.role).toBe('student');
    expect(reg.body.user.passwordHash).toBeUndefined();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@uni.edu', password: 'password123' });
    expect(login.status).toBe(200);
    expect(typeof login.body.token).toBe('string');

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('ada@uni.edu');
  });

  it('rejects invalid registration input with 400', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: '', email: 'not-an-email', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a duplicate email with 409', async () => {
    const { app } = buildTestApp();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'A', email: 'dup@uni.edu', password: 'password123' });
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'B', email: 'dup@uni.edu', password: 'password123' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('me without a token is 401', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('login with wrong password is 401', async () => {
    const { app } = buildTestApp();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'A', email: 'x@uni.edu', password: 'password123' });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'x@uni.edu', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });
});
