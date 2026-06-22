import { AppError } from '../../shared/errors/AppError';
import { toPublicUser, type PublicUser } from '../../domain/entities/User';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { PasswordService } from '../../types/dependencies';

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface RegisterDeps {
  users: IUserRepository;
  password: PasswordService;
}

export async function registerUser(deps: RegisterDeps, input: RegisterInput): Promise<PublicUser> {
  const existing = await deps.users.findByEmail(input.email);
  if (existing) {
    throw new AppError(409, 'EMAIL_TAKEN', 'Email is already registered');
  }
  const roleId = await deps.users.findRoleIdByName('student');
  if (roleId === null) {
    throw new AppError(500, 'ROLE_MISSING', 'Default student role is not configured');
  }
  const passwordHash = await deps.password.hash(input.password);
  const user = await deps.users.create({
    roleId,
    fullName: input.fullName,
    email: input.email,
    passwordHash,
  });
  return toPublicUser(user);
}
