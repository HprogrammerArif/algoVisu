import { createApp } from './app';
import { getConfig } from './config';
import { initPool, closePool } from './infrastructure/database/connection';

async function start(): Promise<void> {
  const config = getConfig();
  await initPool(); // verifies Oracle connectivity at boot
  const app = createApp(config);

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
