import { AppError } from '../../shared/errors/AppError';
import { toPublicUser, type PublicUser } from '../../domain/entities/User';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';

export interface CurrentUserDeps {
  users: IUserRepository;
}

export async function getCurrentUser(deps: CurrentUserDeps, userId: number): Promise<PublicUser> {
  const user = await deps.users.findById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return toPublicUser(user);
}
