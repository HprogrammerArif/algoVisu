import { createApp } from '../../src/app';
import { passwordService } from '../../src/infrastructure/security/password';
import { createJwtService } from '../../src/infrastructure/security/jwt';
import { createFakeUserRepository, type FakeUserRepository } from './fakeUserRepository';
import { createFakeCategoryRepository, type FakeCategoryRepository } from './fakeCategoryRepository';
import {
  createFakeAlgorithmRepository,
  type FakeAlgorithmRepository,
} from './fakeAlgorithmRepository';
import type { Services } from '../../src/types/dependencies';

export interface TestRepositories {
  users: FakeUserRepository;
  categories: FakeCategoryRepository;
  algorithms: FakeAlgorithmRepository;
}

export interface TestContext {
  app: import('express').Express;
  repositories: TestRepositories;
  services: Services;
}

/**
 * Builds the full Express app wired with in-memory fake repositories and real
 * (test-secret) services. Exercises the entire HTTP + use-case stack without Oracle.
 */
export function buildTestApp(): TestContext {
  const repositories: TestRepositories = {
    users: createFakeUserRepository(),
    categories: createFakeCategoryRepository(),
    algorithms: createFakeAlgorithmRepository(),
  };
  const services: Services = {
    password: passwordService,
    jwt: createJwtService('test-secret', '1h'),
  };
  const app = createApp({ config: { corsOrigin: '*', env: 'test' }, repositories, services });
  return { app, repositories, services };
}
