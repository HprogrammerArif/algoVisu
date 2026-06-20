import { createApp } from './app';
import { getConfig } from './config';
import { initPool, closePool } from './infrastructure/database/connection';
import { OracleUserRepository } from './infrastructure/database/repositories/OracleUserRepository';
import { passwordService } from './infrastructure/security/password';
import { createJwtService } from './infrastructure/security/jwt';
import type { Repositories, Services } from './types/dependencies';

async function start(): Promise<void> {
  const config = getConfig();
  await initPool(); // verifies Oracle connectivity at boot

  const repositories: Repositories = {
    users: new OracleUserRepository(),
  };
  const services: Services = {
    password: passwordService,
    jwt: createJwtService(config.jwt.secret, config.jwt.expiresIn),
  };

  const app = createApp({
    config: { corsOrigin: config.corsOrigin, env: config.env },
    repositories,
    services,
  });

  const server = app.listen(config.port, () => {
    console.log(`QuantumViz API listening on http://localhost:${config.port}/api/v1`);
  });

  const shutdown = (signal: string): void => {
    console.log(`\n${signal} received — shutting down...`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
