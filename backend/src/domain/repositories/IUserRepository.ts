import type { User } from '../entities/User';

export interface NewUser {
  roleId: number;
  fullName: string;
  email: string;
  passwordHash: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  findRoleIdByName(name: string): Promise<number | null>;
  create(user: NewUser): Promise<User>;
}
