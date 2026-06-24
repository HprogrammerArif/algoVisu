import express, { type Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { makeApiRouter } from './interfaces/http/routes';
import { notFoundHandler, errorHandler } from './interfaces/http/middlewares/errorHandler';
import { buildCorsOrigin } from './interfaces/http/corsOptions';
import type { AppDependencies } from './types/dependencies';

// createApp is the application assembly. Dependencies (config, repositories,
// services) are injected so it can be built with Oracle repos in production or
// in-memory fakes in tests — no database required to exercise the HTTP stack.
export function createApp(deps: AppDependencies): Express {
  const app = express();

  app.use(cors({ origin: buildCorsOrigin(deps.config.corsOrigin, deps.config.env) }));
  app.use(express.json());
  if (deps.config.env !== 'test') app.use(morgan('dev'));

  app.use('/api/v1', makeApiRouter(deps.repositories, deps.services));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
