import type { IUserRepository, NewUser } from '../../src/domain/repositories/IUserRepository';
import type { User } from '../../src/domain/entities/User';

const ROLE_IDS: Record<string, number> = { admin: 1, teacher: 2, student: 3 };

export interface FakeUserRepository extends IUserRepository {
  _users: User[];
}

export function createFakeUserRepository(): FakeUserRepository {
  const users: User[] = [];
  let nextId = 1;

  return {
    _users: users,
    async findByEmail(email) {
      return users.find((u) => u.email === email) ?? null;
    },
    async findById(id) {
      return users.find((u) => u.id === id) ?? null;
    },
    async findRoleIdByName(name) {
      return ROLE_IDS[name] ?? null;
    },
    async create(nu: NewUser) {
      const role = Object.keys(ROLE_IDS).find((k) => ROLE_IDS[k] === nu.roleId) ?? 'student';
      const user: User = {
        id: nextId++,
        roleId: nu.roleId,
        role,
        fullName: nu.fullName,
        email: nu.email,
        passwordHash: nu.passwordHash,
        isActive: true,
      };
      users.push(user);
      return user;
    },
  };
}
