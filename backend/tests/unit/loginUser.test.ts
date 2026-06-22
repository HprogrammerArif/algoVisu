import { describe, it, expect } from 'vitest';
import { registerUser } from '../../src/application/auth/registerUser';
import { loginUser } from '../../src/application/auth/loginUser';
import { passwordService } from '../../src/infrastructure/security/password';
import { createJwtService } from '../../src/infrastructure/security/jwt';
import { createFakeUserRepository } from '../helpers/fakeUserRepository';

const jwt = createJwtService('test-secret', '1h');

async function seedUser() {
  const users = createFakeUserRepository();
  await registerUser(
    { users, password: passwordService },
    { fullName: 'Ada', email: 'ada@uni.edu', password: 'password123' },
  );
  return users;
}

describe('loginUser', () => {
  it('returns a token and public user on valid credentials', async () => {
    const users = await seedUser();
    const result = await loginUser(
      { users, password: passwordService, jwt },
      { email: 'ada@uni.edu', password: 'password123' },
    );
    expect(typeof result.token).toBe('string');
    expect(result.user.email).toBe('ada@uni.edu');
    expect(jwt.verify(result.token).role).toBe('student');
  });

  it('rejects a wrong password with 401', async () => {
    const users = await seedUser();
    await expect(
      loginUser({ users, password: passwordService, jwt }, { email: 'ada@uni.edu', password: 'nope' }),
    ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
  });

  it('rejects an unknown email with 401', async () => {
    const users = createFakeUserRepository();
    await expect(
      loginUser({ users, password: passwordService, jwt }, { email: 'no@uni.edu', password: 'x' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
