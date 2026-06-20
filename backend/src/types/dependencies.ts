import type { IUserRepository } from '../domain/repositories/IUserRepository';
import type { ICategoryRepository } from '../domain/repositories/ICategoryRepository';
import type { IAlgorithmRepository } from '../domain/repositories/IAlgorithmRepository';

/**
 * The set of repository implementations the app is wired with. The composition
 * root (server.ts) supplies Oracle implementations; tests supply in-memory fakes.
 * This grows one entry per feature phase.
 */
export interface Repositories {
  users: IUserRepository;
  categories: ICategoryRepository;
  algorithms: IAlgorithmRepository;
}

export interface PasswordService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export interface AuthTokenPayload {
  sub: number;
  role: string;
}

export interface JwtService {
  sign(payload: AuthTokenPayload): string;
  verify(token: string): AuthTokenPayload;
}

export interface Services {
  password: PasswordService;
  jwt: JwtService;
}

export interface AppConfigLite {
  corsOrigin: string;
  env: string;
}

export interface AppDependencies {
  config: AppConfigLite;
  repositories: Repositories;
  services: Services;
}
