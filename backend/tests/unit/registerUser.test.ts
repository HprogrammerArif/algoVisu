import { describe, it, expect } from 'vitest';
import { registerUser } from '../../src/application/auth/registerUser';
import { passwordService } from '../../src/infrastructure/security/password';
import { createFakeUserRepository } from '../helpers/fakeUserRepository';

describe('registerUser', () => {
  it('creates a student and returns a public user (no password hash)', async () => {
    const users = createFakeUserRepository();
    const result = await registerUser(
      { users, password: passwordService },
      { fullName: 'Ada Lovelace', email: 'ada@uni.edu', password: 'password123' },
    );
    expect(result).toMatchObject({ fullName: 'Ada Lovelace', email: 'ada@uni.edu', role: 'student' });
    expect((result as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
    // the stored user has a hash that is not the plaintext
    expect(users._users[0].passwordHash).not.toBe('password123');
  });

  it('rejects a duplicate email with 409 EMAIL_TAKEN', async () => {
    const users = createFakeUserRepository();
    const deps = { users, password: passwordService };
    await registerUser(deps, { fullName: 'Ada', email: 'a@uni.edu', password: 'password123' });
    await expect(
      registerUser(deps, { fullName: 'Ada2', email: 'a@uni.edu', password: 'password123' }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_TAKEN' });
  });
});
