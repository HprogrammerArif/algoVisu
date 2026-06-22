import { AppError } from '../../shared/errors/AppError';
import { toPublicUser, type PublicUser } from '../../domain/entities/User';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { PasswordService, JwtService } from '../../types/dependencies';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginDeps {
  users: IUserRepository;
  password: PasswordService;
  jwt: JwtService;
}

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export async function loginUser(deps: LoginDeps, input: LoginInput): Promise<LoginResult> {
  const user = await deps.users.findByEmail(input.email);
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  const ok = await deps.password.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  const token = deps.jwt.sign({ sub: user.id, role: user.role });
  return { token, user: toPublicUser(user) };
}
